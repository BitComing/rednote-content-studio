import { countWords } from "@/lib/utils";
import type {
  BriefInput,
  Claim,
  PlatformDraft,
  ReviewIssue,
  RevisionResult,
  RunResult,
  RunStage,
} from "@/lib/types";

const DEFAULT_TOPIC = "拾光咖啡期中周自习空间";

function topicFromBrief(brief: string) {
  const brand = brief.match(/「([^」]+)」/)?.[1];
  if (brand) {
    return `${brand}期中周自习空间`.slice(0, 34);
  }
  const firstClause = brief
    .split(/[\n。！？!?：:，,；;]/)
    .map((line) => line.trim())
    .find(Boolean);
  return (firstClause || DEFAULT_TOPIC).slice(0, 34);
}

function platformKind(platform: string) {
  const value = platform.toLowerCase();
  if (value.includes("小红书") || value.includes("xiaohongshu")) return "rednote";
  if (value.includes("朋友圈") || value.includes("moments")) return "moments";
  if (value.includes("公众号") || value.includes("official")) return "wechat";
  if (value.includes("校园") || value.includes("forum")) return "forum";
  return "generic";
}

function buildDraft(platform: string, brief: string): PlatformDraft {
  const topic = topicFromBrief(brief);
  const kind = platformKind(platform);
  let content = "";

  if (kind === "rednote") {
    content = `期中周想找个能坐一下午的地方｜${topic}

最近图书馆热门时段座位比较紧张，我把「拾光咖啡」的靠窗长桌试了一遍。

适合：
- 需要长时间写作业、带电脑
- 想喝手冲咖啡，又不想频繁续杯
- 喜欢相对安静、不被打扰的环境

店里有手冲咖啡和可续杯茶饮，静音区更适合专注。期中周想找一个稳定落脚点的话，可以把它加入备选。

#港中深 #校园咖啡 #自习好去处 #期中周`;
  } else if (kind === "moments") {
    content = `期中周的自习据点又多了一个选择。${topic}，靠窗长桌和静音区开放，手冲咖啡配可续杯茶饮，适合带电脑坐一下午。想一起自习的同学可以约。`;
  } else if (kind === "wechat") {
    content = `期中周自习指南｜${topic}

期中周开始后，图书馆的热门时段座位会比较紧张。拾光咖啡把靠窗长桌和静音区整理出来，提供手冲咖啡与可续杯茶饮，适合需要长时间专注的同学。

## 适合谁
- 需要电脑和稳定桌面的同学
- 喜欢手冲咖啡、又不想频繁续杯的同学
- 希望有一个相对安静环境的人

## 到店建议
建议避开午晚餐高峰，优先选择靠窗长桌或静音区。具体营业时间、位置和套餐内容以店内公示为准。`;
  } else if (kind === "forum") {
    content = `【求推荐】期中周哪里适合坐一下午？

最近试了拾光咖啡，靠窗长桌和静音区都能坐，手冲咖啡和可续杯茶饮对学生比较友好。适合带电脑写作业，也适合几个人安静讨论。

想去的同学建议避开饭点。具体营业时间以店内公示为准。`;
  } else {
    content = `${topic}

拾光咖啡准备了适合期中周的自习空间：靠窗长桌、静音区、手冲咖啡和可续杯茶饮。适合需要长时间专注的同学，具体安排以店内公示为准。`;
  }

  const issues: ReviewIssue[] = [];
  if (kind === "rednote") {
    issues.push({
      id: `${platform}-tag`,
      severity: "warn",
      type: "platform",
      reason: "标签数量偏多，信息密度可以再收敛。",
      suggestion: "保留 3 到 4 个最相关的标签。",
    });
  }
  if (kind === "wechat") {
    issues.push({
      id: `${platform}-detail`,
      severity: "warn",
      type: "to_verify",
      reason: "缺少明确营业时间和具体位置。",
      suggestion: "由商家核实后在人工修正区补充。",
    });
  }

  const claims: Claim[] = [
    {
      id: `${platform}-claim-1`,
      platform,
      claim: "提供靠窗长桌和静音区",
      status: brief.includes("靠窗") || brief.includes("静音") ? "supported" : "to_verify",
      sourceQuote: brief.slice(0, 80),
    },
    {
      id: `${platform}-claim-2`,
      platform,
      claim: "提供手冲咖啡与可续杯茶饮",
      status: brief.includes("咖啡") || brief.includes("茶") ? "supported" : "to_verify",
      sourceQuote: brief.slice(0, 80),
    },
    {
      id: `${platform}-claim-3`,
      platform,
      claim: "图书馆热门时段座位会比较紧张",
      status: "to_verify",
      sourceQuote: "",
    },
  ];

  return {
    platform,
    firstRound: content,
    score: 86,
    status: "pass",
    issues,
    claims,
    wordCount: countWords(content),
  };
}

function baseStages(platforms: string[]): RunStage[] {
  return [
    { id: "parse", label: "解析平台", detail: `${platforms.length} 个目标平台`, status: "done" },
    { id: "trend", label: "获取热点", detail: "已刷新微博热榜", status: "done" },
    { id: "draft", label: "首轮生成", detail: "按平台生成初稿", status: "done" },
    { id: "review", label: "AI 评审", detail: "事实、禁用词与格式检查", status: "done" },
    { id: "human", label: "人工审核", detail: "等待你的判断", status: "running" },
    { id: "revise", label: "二轮改稿", detail: "按反馈调整", status: "pending" },
    { id: "recheck", label: "复评", detail: "再次评分与安全检查", status: "pending" },
    { id: "output", label: "输出", detail: "生成可审核结果", status: "pending" },
  ];
}

export function createMockRun(input: BriefInput): RunResult {
  const drafts = input.platforms.map((platform) => buildDraft(platform, input.brief));
  const issues = drafts.flatMap((draft) => draft.issues);
  const score = Math.round(
    drafts.reduce((total, draft) => total + draft.score, 0) / Math.max(1, drafts.length),
  );

  return {
    id: `R-${String(Date.now()).slice(-6)}`,
    mode: "mock",
    startedAt: new Date().toISOString(),
    stages: baseStages(input.platforms),
    drafts,
    trendOptions: [
      { label: "不附加热点", heat: "" },
      { label: "期中周校园生活", heat: "12.8 万" },
      { label: "大学生自习搭子", heat: "8.4 万" },
    ],
    selectedTrend: "不附加热点",
    score,
    summary:
      issues.length > 0
        ? `未发现硬性拦截项，${issues.length} 条建议待人工确认。`
        : "未发现硬性拦截项，仍需人工确认后发布。",
    status: "reviewing",
  };
}

function reviseContent(content: string, feedback: string) {
  let next = content
    .replaceAll("最近图书馆热门时段座位比较紧张", "热门时段的自习座位会比较紧张")
    .replaceAll("图书馆的热门时段座位会比较紧张", "热门时段的自习座位会比较紧张");

  if (/地址|位置|营业时间/.test(feedback) && !next.includes("具体位置")) {
    next += "\n\n具体位置与营业时间以店内公示为准。";
  }
  if (/标签|hashtag/i.test(feedback) && next.includes("#港中深")) {
    next = next.replace("#港中深 #校园咖啡 #自习好去处 #期中周", "#港中深 #校园咖啡 #自习好去处");
  }
  if (/简短|短一点|精简/.test(feedback)) {
    next = next
      .split("\n")
      .filter((line, index) => index < 14 || line.startsWith("#"))
      .join("\n");
  }
  return next;
}

export function createMockRevision(
  drafts: PlatformDraft[],
  feedback: string,
  verifiedCorrections: string,
): RevisionResult {
  const nextDrafts = drafts.map((draft) => {
    const nextContent = reviseContent(draft.firstRound, feedback);
    return {
      ...draft,
      secondRound: nextContent,
      score: Math.min(96, draft.score + 4),
      status: "pass" as const,
      issues: draft.issues.filter((issue) => issue.type === "to_verify").slice(0, 1),
      claims: draft.claims.map((claim) =>
        claim.status === "to_verify" && verifiedCorrections
          ? { ...claim, status: "supported" as const, sourceQuote: verifiedCorrections.slice(0, 80) }
          : claim,
      ),
      wordCount: countWords(nextContent),
    };
  });
  const score = Math.round(
    nextDrafts.reduce((total, draft) => total + draft.score, 0) / Math.max(1, nextDrafts.length),
  );
  const stages: RunStage[] = [
    { id: "parse", label: "解析平台", detail: "平台列表已确认", status: "done" },
    { id: "trend", label: "获取热点", detail: "保留当前热点选择", status: "done" },
    { id: "draft", label: "首轮生成", detail: "初稿已生成", status: "done" },
    { id: "review", label: "AI 评审", detail: "首轮评审已完成", status: "done" },
    { id: "human", label: "人工审核", detail: "已提交修改意见", status: "done" },
    { id: "revise", label: "二轮改稿", detail: "已按反馈重写", status: "done" },
    { id: "recheck", label: "复评", detail: "复评通过", status: "done" },
    { id: "output", label: "输出", detail: "等待最终确认", status: "running" },
  ];
  return {
    drafts: nextDrafts,
    score,
    stages,
    summary: `二轮复评已完成，${nextDrafts.reduce((total, draft) => total + draft.issues.length, 0)} 条建议待确认。`,
  };
}
