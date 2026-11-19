import { getDifyConfig } from "@/lib/config";
import type { BriefInput, PlatformDraft, RunResult } from "@/lib/types";

export function hasDifyConfig() {
  return Boolean(getDifyConfig());
}

function splitPlatformContent(content: string, platforms: string[]) {
  const sections = new Map<string, string>();
  const parts = content.split(/\n(?=#{1,6}\s+)/g);
  for (const part of parts) {
    const match = part.match(/^#{1,6}\s*(.+?)\s*$/m);
    if (!match) continue;
    const heading = match[1].trim();
    const body = part.replace(/^#{1,6}\s*.+?\s*$/m, "").trim();
    sections.set(heading.toLowerCase(), body);
  }

  return platforms.map((platform) => {
    const direct = sections.get(platform.toLowerCase());
    if (direct) return { platform, content: direct };
    for (const [heading, body] of sections) {
      if (heading.includes(platform.toLowerCase()) || platform.toLowerCase().includes(heading)) {
        return { platform, content: body };
      }
    }
    return { platform, content: "" };
  });
}

export async function runDifyWorkflow(input: BriefInput): Promise<RunResult> {
  const config = getDifyConfig();
  if (!config) {
    throw new Error("尚未配置 Dify 连接。请在页面右上角打开 Dify 设置。");
  }
  const { baseUrl, apiKey, user } = config;

  const response = await fetch(`${baseUrl}/workflows/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: {
        draft: input.brief,
        voice_and_tone: input.tone,
        platform: input.platforms.join("、"),
        language: input.language,
        tone_details: input.toneDetails,
        banned_words: input.bannedWords,
        user_file: input.files.map((file) => ({
          type: file.type,
          transfer_method: "local_file",
          upload_file_id: file.id,
        })),
      },
      response_mode: "blocking",
      user,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.message || payload?.error || `Dify 请求失败：HTTP ${response.status}`;
    throw new Error(message);
  }

  const outputs = payload?.data?.outputs || {};
  const content =
    outputs.r1_pass_content ||
    outputs.content ||
    outputs.r2_pass_content ||
    "";
  const review =
    outputs.r1_pass_review || outputs.review || outputs.r2_pass_review || "";

  if (!content) {
    throw new Error(
      "Dify 没有返回内容。当前工作流包含人工输入节点，可能停在审核步骤；请在 Dify Web App 完成人工审核，或配置支持 human-input 的接口。",
    );
  }

  const drafts: PlatformDraft[] = splitPlatformContent(String(content), input.platforms).map(
    ({ platform, content: body }) => ({
      platform,
      firstRound: body || String(content),
      score: 0,
      status: "revise",
      issues: [],
      claims: [],
      wordCount: body.length,
    }),
  );

  return {
    id: `R-${String(Date.now()).slice(-6)}`,
    mode: "dify",
    startedAt: new Date().toISOString(),
    stages: [
      { id: "parse", label: "解析平台", detail: `${input.platforms.length} 个目标平台`, status: "done" },
      { id: "trend", label: "获取热点", detail: "由 Dify 工作流处理", status: "done" },
      { id: "draft", label: "首轮生成", detail: "Dify 已返回内容", status: "done" },
      { id: "review", label: "AI 评审", detail: review ? "已返回评审记录" : "未返回结构化评审", status: review ? "done" : "warning" },
      { id: "human", label: "人工审核", detail: "请在当前工作台确认", status: "running" },
      { id: "revise", label: "二轮改稿", detail: "等待人工意见", status: "pending" },
      { id: "recheck", label: "复评", detail: "等待二轮稿", status: "pending" },
      { id: "output", label: "输出", detail: "等待最终确认", status: "pending" },
    ],
    drafts,
    trendOptions: [{ label: "由 Dify 工作流选择", heat: "" }],
    selectedTrend: "由 Dify 工作流选择",
    score: 0,
    summary: review
      ? "Dify 已返回评审记录，请在右侧完成人工确认。"
      : "Dify 已返回内容，但未返回结构化评审。",
    status: "reviewing",
  };
}
