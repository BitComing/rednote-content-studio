import { randomUUID } from "node:crypto";
import { getDifyConfig } from "./config";
import { chooseRevisionRoute } from "./campus";
import { retrieveKnowledge, knowledgeText } from "./knowledge";
import { evaluateOutput } from "./evaluation";
import type { BriefInput, Claim, PlatformDraft, ReviewIssue, RevisionRequest, RunResult, VersionRecord } from "./types";

export function hasDifyConfig() { return Boolean(getDifyConfig()); }
export function packContent(run: RunResult) { return run.drafts.map(d => `## ${d.platform}\n${d.secondRound ?? d.firstRound}`).join("\n\n"); }
export function splitPlatformContent(content: string, platforms: string[]) {
  // Only target-platform headings delimit posts. Internal headings stay within a post.
  const lines = content.split("\n");
  const starts: { index: number; platform: string }[] = [];
  lines.forEach((line, index) => {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/)?.[1];
    const platform = platforms.find(p => p.toLowerCase() === heading?.toLowerCase());
    if (platform) starts.push({ index, platform });
  });
  return platforms.map(platform => {
    const n = starts.findIndex(s => s.platform === platform);
    return { platform, content: n < 0 ? (platforms.length === 1 ? content : "") : lines.slice(starts[n].index+1, starts[n+1]?.index ?? lines.length).join("\n").trim() };
  });
}
async function callWorkflow(inputs: object, revision = false) {
  const config = getDifyConfig();
  if (!config) throw new Error("尚未配置首轮 Dify 工作流。");
  const key = revision ? config.revisionApiKey : config.apiKey;
  if (!key) throw new Error("请在 Dify 设置中填写改稿工作流 API Key；真实任务不会退回演示改稿。");
  const response = await fetch(`${config.baseUrl}/workflows/run`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs, response_mode: "blocking", user: config.user }), cache: "no-store", signal: AbortSignal.timeout(240000) });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || `Dify 请求失败 HTTP ${response.status}`);
  if (payload?.data?.status !== "succeeded") throw new Error(payload?.data?.error || `Dify 未完成：${payload?.data?.status || "未知状态"}`);
  const outputs = payload.data.outputs;
  if (outputs?.error) throw new Error(outputs.error);
  if (!outputs || typeof outputs.content !== "string" || !outputs.content.trim()) throw new Error("工作流未返回有效 content，请确认已导入并发布新版两阶段工作流。");
  return { outputs, workflowRunId: String(payload.workflow_run_id || payload.data.id || "") };
}
type Outputs = Record<string, unknown>;
export function parseOutputs(outputs: Outputs, platforms: string[], previous?: RunResult) {
  let review: { claims?: Record<string, unknown>[]; issues?: Record<string, unknown>[]; verdict?: string } = {};
  let parsed = true;
  try { review = JSON.parse(String(outputs.review_json || "")); if (!review || !Array.isArray(review.claims) || !Array.isArray(review.issues)) throw new Error(); }
  catch { parsed = false; review = {}; }
  const canApprove = parsed && ["yes", "ready"].includes(String(outputs.status)) && review.verdict === "pass";
  const score = typeof outputs.score === "number" && outputs.score >= 0 && outputs.score <= 100 ? outputs.score : -1;
  const issues: ReviewIssue[] = (review.issues || []).map((r, i) => ({ id: `issue-${i}`, severity: r.severity === "warn" ? "warn" : "block", type: String(r.type || "other"), reason: String(r.reason || "需人工核实"), suggestion: String(r.suggestion || "") }));
  if (!canApprove) issues.push({ id: "gate", severity: "block", type: "gate", reason: String(outputs.review || "结构化评审缺失或规则检查未通过") });
  const claims: Claim[] = (review.claims || []).map((r,i) => ({ id: `claim-${i}`, platform: String(r.platform || ""), claim: String(r.claim || ""), status: r.status === "supported" ? "supported" : r.status === "unsupported" ? "unsupported" : "to_verify", sourceQuote: String(r.source_quote || "") }));
  const drafts: PlatformDraft[] = splitPlatformContent(String(outputs.content), platforms).map(({ platform, content }) => {
    const old = previous?.drafts.find(d => d.platform === platform);
    return { platform, firstRound: old?.firstRound ?? content, ...(old ? { secondRound: content } : {}), score, status: canApprove && content ? "pass" : "revise",
      issues: content ? issues : [...issues, { id: "missing", severity: "block", type: "coverage", reason: `未返回${platform}内容` }],
      claims: claims.filter(c => !c.platform || c.platform === platform), wordCount: content.length };
  });
  return { drafts, score, canApprove: canApprove && drafts.every(d => d.status === "pass" && d.claims.every(c => c.status === "supported")), reviewJson: String(outputs.review_json || ""), summary: String(outputs.review || "等待人工审核") };
}
async function finish(run: RunResult, started: number, record: Omit<VersionRecord, "version" | "content" | "createdAt" | "elapsedMs" | "evaluation" | "internalScore" | "reviewJson">) {
  const content = packContent(run);
  run.evaluation = await evaluateOutput(content, [run.briefSnapshot?.brief, run.documents, run.verifiedFacts].filter(Boolean).join("\n"), {
    scenario: run.briefSnapshot?.scenario, platforms: run.briefSnapshot?.platforms, tone: run.effectiveTone,
    toneDetails: run.briefSnapshot?.toneDetails, language: run.briefSnapshot?.language, bannedWords: run.briefSnapshot?.bannedWords,
    trend: run.selectedTrend, editorialGuidance: knowledgeText(run.knowledge || [], "guidance"),
  });
  run.elapsedMs = Date.now()-started;
  const externalBlocks = run.evaluation.judges.flatMap(j => j.blocks.map(reason => ({ id: `${j.model}-${reason}`, severity: "block" as const, type: "external", reason })));
  if (externalBlocks.length) { run.canApprove = false; run.drafts = run.drafts.map(d => ({ ...d, status: "revise", issues: d.issues.concat(externalBlocks) })); }
  if (run.evaluation.requiresReview) run.canApprove = false;
  run.history = [...(run.history || []), { ...record, version: (run.history?.length || 0)+1, createdAt: new Date().toISOString(), content, elapsedMs: run.elapsedMs,
    internalScore: run.score, reviewJson: run.reviewJson || "", evaluation: run.evaluation }];
  return run;
}
export async function runDifyWorkflow(input: BriefInput): Promise<RunResult> {
  const started = Date.now();
  const knowledge = retrieveKnowledge(input.merchantId || "", input.scenario || "daily");
  const facts = knowledgeText(knowledge, "fact");
  const { outputs, workflowRunId } = await callWorkflow({ draft: input.brief, user_file: input.files.map(file => ({ type: file.type, transfer_method: "local_file", upload_file_id: file.id })),
    voice_and_tone: input.tone, platform: input.platforms.join("、"), language: input.language, tone_details: input.toneDetails, banned_words: input.bannedWords,
    selected_trend: input.selectedTrend || "不附加热点", trend_json: input.trendJson || '{"attached":false}', scenario: input.scenario || "daily",
    campus_guidance: knowledgeText(knowledge, "guidance"), knowledge_facts: facts, documents: "" });
  const run: RunResult = { ...parseOutputs(outputs, input.platforms), id: randomUUID(), mode: "dify", startedAt: new Date(started).toISOString(),
    stages: [{ id: "draft", label: "首轮生成", detail: "首轮工作流已完成", status: "done" }, { id: "human", label: "人工审核", detail: "等待确认", status: "running" }],
    trendOptions: [{ label: "不附加热点", heat: "" }], selectedTrend: input.selectedTrend || "不附加热点", status: "reviewing", briefSnapshot: structuredClone(input),
    effectiveTone: input.tone, documents: Array.isArray(outputs.documents_text) ? outputs.documents_text.join("\n") : String(outputs.documents_text || ""), knowledge, workflowRunId, history: [] };
  return finish(run, started, { route: "initial", feedback: "", scoreFeedback: "", corrections: "", tone: input.tone, trend: run.selectedTrend, workflowRunId });
}
export async function reviseDifyWorkflow(req: RevisionRequest): Promise<RunResult> {
  const started = Date.now();
  const prior = req.run;
  const input = prior.briefSnapshot;
  if (!input) throw new Error("原始简报快照缺失，请重新生成首轮。");
  const route = chooseRevisionRoute(req);
  const tone = req.toneChoice === "保持原 tone" ? prior.effectiveTone || input.tone : req.toneChoice;
  const corrections = [prior.verifiedFacts, req.verifiedCorrections.trim()].filter(Boolean).join("\n");
  const trendJson = req.trend === "不附加热点" ? '{"attached":false}' : JSON.stringify({ attached: true, title: req.trend, source: "用户选定话题，仅作表达背景，非商家事实证据" });
  const { outputs, workflowRunId } = await callWorkflow({ draft: input.brief, documents: prior.documents || "", platforms: JSON.stringify(input.platforms), language: input.language,
    banned_words: input.bannedWords, voice_and_tone: prior.effectiveTone || input.tone, tone_choice: tone, tone_details: input.toneDetails,
    verified_corrections: corrections, content_feedback: req.feedback, score_feedback: req.scoreFeedback,
    round1_content: packContent(prior), round1_review: prior.reviewJson || "", selected_trend: req.trend, trend_json: trendJson,
    revision_mode: route, round_no: String((prior.history?.length || 1)+1), scenario: input.scenario || "daily", campus_guidance: knowledgeText(prior.knowledge || [], "guidance"),
  }, true);
  const run: RunResult = { ...prior, ...parseOutputs(outputs, input.platforms, prior), status: "reviewing", effectiveTone: tone, verifiedFacts: corrections,
    documents: outputs.documents_text ? String(outputs.documents_text) : prior.documents, selectedTrend: req.trend, workflowRunId, route,
    stages: [{ id: "revise", label: route === "reevaluate" ? "仅重新评分" : "按反馈改稿", detail: `${route} · 基于当前版本`, status: "done" }, { id: "human", label: "人工审核", detail: "等待确认", status: "running" }] };
  return finish(run, started, { route, feedback: req.feedback, scoreFeedback: req.scoreFeedback, corrections: req.verifiedCorrections, tone, trend: req.trend, workflowRunId });
}
