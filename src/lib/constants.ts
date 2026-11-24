export const DEFAULT_BRIEF =
  "【合成演示简报，非真实商家资料】校园咖啡店「拾光咖啡」想在期中周推出自习套餐：手冲咖啡 + 可续杯茶饮，提供靠窗长桌和静音区。希望吸引港中深学生，语气自然，不要夸张，不要承诺提分或保过。";

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
