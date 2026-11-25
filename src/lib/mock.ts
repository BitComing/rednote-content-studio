import { randomUUID } from "node:crypto";
import { chooseRevisionRoute, editorialGuidance } from "./campus";
import type { BriefInput, Evaluation, RevisionRequest, RunResult } from "./types";
const demoEvaluation = (): Evaluation => ({ status: "demo", rubric: "campus-rednote-v1", judges: [], mean: null, spread: null, requiresReview: true, elapsedMs: 0 });
export function createMockRun(input: BriefInput): RunResult {
  const content = input.platforms.map(p => `## ${p}\n【交互演示，未调用 AI】\n${input.brief}`).join("\n\n");
  const evaluation = demoEvaluation();
  return { id: randomUUID(), mode: "mock", startedAt: new Date().toISOString(), briefSnapshot: structuredClone(input), effectiveTone: input.tone,
    knowledge: editorialGuidance(), documents: "", reviewJson: "", canApprove: false, elapsedMs: 0, evaluation,
    drafts: input.platforms.map(platform => ({ platform, firstRound: `【交互演示，未调用 AI】\n${input.brief}`, score: -1, status: "revise", issues: [{ id: "demo", severity: "block", type: "demo", reason: "演示内容未进行模型评审，不能作为通过审核的稿件。" }], claims: [], wordCount: input.brief.length })),
    stages: [{ id: "demo", label: "交互演示", detail: "未调用生成或评分模型", status: "warning" }], trendOptions: [{ label: "不附加热点", heat: "" }], selectedTrend: input.selectedTrend || "不附加热点",
    score: -1, summary: "交互演示，不包含真实模型评分。", status: "reviewing",
    history: [{ version: 1, createdAt: new Date().toISOString(), route: "initial", content, reviewJson: "", feedback: "", scoreFeedback: "", corrections: "", tone: input.tone, trend: input.selectedTrend || "不附加热点", elapsedMs: 0, internalScore: -1, evaluation }] };
}
export function createMockRevision(req: RevisionRequest): RunResult {
  const route = chooseRevisionRoute(req);
  const run = structuredClone(req.run);
  const tone = req.toneChoice === "保持原 tone" ? run.effectiveTone || run.briefSnapshot!.tone : req.toneChoice;
  run.drafts = run.drafts.map(d => ({ ...d, secondRound: route === "reevaluate" ? d.secondRound ?? d.firstRound :
    `${d.secondRound ?? d.firstRound}\n\n【演示改稿记录】路径：${route}；语气：${tone}；反馈：${req.feedback || "无"}。\n未执行真实改写，请接入 Dify。`, score: -1 }));
  run.effectiveTone = tone; run.route = route; run.selectedTrend = req.trend; run.status = "reviewing";
  run.drafts = run.drafts.map(d => ({ ...d, wordCount: (d.secondRound ?? d.firstRound).length }));
  run.verifiedFacts = [run.verifiedFacts, req.verifiedCorrections].filter(Boolean).join("\n");
  run.history = [...(run.history || []), { version: (run.history?.length || 0)+1, createdAt: new Date().toISOString(), route,
    content: run.drafts.map(d => `## ${d.platform}\n${d.secondRound}`).join("\n\n"), reviewJson: "", feedback: req.feedback, scoreFeedback: req.scoreFeedback,
    corrections: req.verifiedCorrections, tone, trend: req.trend, elapsedMs: 0, internalScore: -1, evaluation: demoEvaluation() }];
  return run;
}
