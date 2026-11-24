import type { KnowledgeHit, RevisionMode, RevisionRequest } from "./types";

export const SCENARIOS = [
  { id: "daily", label: "校园门店日常推广", hint: "商品 / 服务、适用学生、地点、营业时间、行动入口" },
  { id: "exam", label: "考试周 / 自习场景", hint: "已确认的空间与服务、价格与时段；不承诺提分、保过或座位供应" },
  { id: "club", label: "社团活动 / 校园市集", hint: "主办方、日期地点、报名方式、名额、费用、合作授权" },
  { id: "welcome", label: "迎新 / 新生体验", hint: "适用对象、优惠有效期、使用条件、到店或报名入口" },
] as const;

// Editorial guidance, deliberately NOT merchant facts or fabricated interviews.
const GUIDANCE: Record<string, string> = {
  daily: "以学生的具体使用需求开篇，说明适用对象与真实服务，使用一个清晰行动入口。未给出的价格、营业时间和地址不要自行补写。",
  exam: "围绕自习、休息和到店安排表达。座位、插座、网络、安静程度和续杯政策都需要商家材料支持。禁止学习效果保证和未经证实的图书馆对比。",
  club: "区分商家、社团和学校主体。活动日期、地点、主办方、报名方式、费用与限额必须有依据。没有授权不得声称学校官方推荐、指定合作或社团联合主办。",
  welcome: "明确新生适用条件、优惠有效期及使用范围。不得虚构学生专享折扣、学校背书或限时库存。缺失信息应先向商家确认。",
};
export function scenarioGuidance(scenario = "daily"): KnowledgeHit[] {
  return [{ id: `guide-${scenario}`, title: SCENARIOS.find(s => s.id === scenario)?.label || "校园门店日常推广", source: "项目内部编辑指引 v1（非平台官方规则）", kind: "guidance", text: GUIDANCE[scenario] || GUIDANCE.daily }];
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
