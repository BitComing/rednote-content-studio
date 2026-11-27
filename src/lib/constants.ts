import type { WorkspaceStatus } from "./types";

export const TONES = [
  "自然友好 Natural and friendly",
  "专业可信 Professional",
  "轻松幽默 Light humour",
  "热情有活力 Energetic",
  "温暖共情 Warm and empathetic",
  "简洁直接 Concise and direct",
  "克制高级 Restrained and polished",
  "自定义 Custom",
];

export const LANGUAGES = ["简体中文", "English", "Français", "Deutsch"];

export const DEFAULT_BANNED_WORDS =
  "保过,保证提分,全网最低,百分百有效,100%有效,guaranteed results";

export const DEFAULT_TREND = "不附加热点";

export function shortToneLabel(tone: string) {
  return tone.split(/\s+/)[0];
}

export const ISSUE_TYPE_LABELS: Record<string, string> = {
  platform: "平台格式",
  to_verify: "待核实",
  facts: "事实",
  tone: "语气",
  banned_word: "禁用词",
  exaggeration: "夸张表达",
  trend: "热点",
  coverage: "平台覆盖",
  other: "其他",
  gate: "综合判定",
  demo: "演示",
};

export const STATUS_LABELS: Record<WorkspaceStatus, string> = {
  idle: "待运行",
  running: "运行中",
  reviewing: "待审核",
  revising: "改稿中",
  approved: "已通过",
  rejected: "已归档",
  error: "运行失败",
};

export const STATUS_BADGE_VARIANTS: Record<
  WorkspaceStatus,
  "outline" | "info" | "warning" | "success" | "destructive"
> = {
  idle: "outline",
  running: "info",
  reviewing: "warning",
  revising: "info",
  approved: "success",
  rejected: "destructive",
  error: "destructive",
};
