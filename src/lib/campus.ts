import type { KnowledgeHit, RevisionMode, RevisionRequest } from "./types";

// Editorial guidance, deliberately NOT merchant facts or fabricated interviews.
const GUIDANCE = "只写商家材料能支持的信息。价格、时间、地点、名额、优惠和合作背书缺失时先向商家确认；不要虚构学生专享、校方背书、效果保证或库存。开篇对准具体使用需求，给出清晰行动入口。";
export function editorialGuidance(): KnowledgeHit[] {
  return [{ id: "guide-general", title: "通用写作指引", source: "项目内部编辑指引 v1（非平台官方规则）", kind: "guidance", text: GUIDANCE }];
}
export function chooseRevisionRoute(req: RevisionRequest): Exclude<RevisionMode, "auto"> {
  // Explicit facts always take precedence over a tone-only/score-only request.
  if (req.revisionMode === "regenerate") return "regenerate";
  if (req.verifiedCorrections.trim()) return "facts";
  if (req.revisionMode === "facts") throw new Error("事实纠正需要填写已核实事实及来源。");
  const trendChanged = req.trend !== req.run.selectedTrend;
  const toneChanged = req.toneChoice !== "保持原 tone" && req.toneChoice !== req.run.effectiveTone;
  if (req.revisionMode === "reevaluate" && (trendChanged || toneChanged || req.feedback.trim())) throw new Error("仅重新评分不能同时改内容、语气或热点；请选择对应改稿路径。");
  if (req.revisionMode === "tone" && trendChanged) throw new Error("改变热点需要局部改稿，不能走仅调语气路径。");
  if (req.revisionMode !== "auto") return req.revisionMode;
  if (trendChanged) return "content";
  if (!req.feedback.trim() && !toneChanged && req.scoreFeedback.trim()) return "reevaluate";
  if (!req.feedback.trim() && toneChanged) return "tone";
  // Ambiguous free text takes the conservative general-edit path; no speculative classifier call.
  return "content";
}
