import { LANGUAGES, TONES } from "./constants";
import type { BriefInput } from "./types";
export function validateBrief(value: unknown): BriefInput {
  if (!value || typeof value !== "object") throw new Error("请填写商家简报");
  const x = value as BriefInput;
  if (typeof x.brief !== "string" || !x.brief.trim() || x.brief.length > 12000) throw new Error("商家简报必填，最多 12000 字符");
  if (!TONES.includes(x.tone) || !LANGUAGES.includes(x.language)) throw new Error("语气或语言无效");
  if (!Array.isArray(x.platforms) || !x.platforms.length || x.platforms.length > 10 || x.platforms.some(p => typeof p !== "string" || !p.trim()) || x.platforms.join("、").length > 256) throw new Error("平台输入无效");
  if (!Array.isArray(x.files) || x.files.length > 10 || x.files.some(f => !f || typeof f.id !== "string" || !["image", "document"].includes(f.type))) throw new Error("文件输入无效");
  for (const [key, max] of Object.entries({ toneDetails: 2000, bannedWords: 4000, merchantId: 100, scenario: 50, selectedTrend: 256, trendJson: 4000 })) {
    const v = x[key as keyof BriefInput]; if (v !== undefined && (typeof v !== "string" || v.length > max)) throw new Error(`${key} 超过长度或格式不正确`);
  }
  return { ...x, toneDetails: x.toneDetails || "", bannedWords: x.bannedWords || "" };
}
