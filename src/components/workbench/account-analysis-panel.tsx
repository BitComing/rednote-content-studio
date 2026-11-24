"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Code2,
  Download,
  Lightbulb,
  Loader2,
  Play,
  Settings2,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { AccountAnalysisResult, AccountAnalysisScores } from "@/lib/types";
import { cn, downloadText, formatDateTime } from "@/lib/utils";

const DIMENSIONS: Array<{
  key: keyof AccountAnalysisScores;
  label: string;
  weight: number;
}> = [
  { key: "content", label: "内容质量", weight: 30 },
  { key: "interaction", label: "互动表现", weight: 25 },
  { key: "consistency", label: "发布规律", weight: 15 },
  { key: "topicStructure", label: "选题结构", weight: 15 },
  { key: "growthPotential", label: "增长潜力", weight: 15 },
];

function scoreTextTone(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function scoreBarTone(score: number | null) {
  if (score === null) return "bg-muted-foreground/30";
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function scoreLabel(score: number | null) {
  if (score === null) return "暂无评分";
  if (score >= 80) return "表现良好";
  if (score >= 60) return "中等水平";
  return "有待改进";
}

function buildMarkdown(result: AccountAnalysisResult) {
  const lines = [
    `# 小红书账号评估报告（${result.id}）`,
    "",
    `- 账号：${result.account}`,
    `- 评估时间：${formatDateTime(result.startedAt)}`,
    `- 总评分：${result.overallScore ?? "—"} / 100`,
    `- 分项：${DIMENSIONS.map((item) => `${item.label} ${result.scores[item.key] ?? "—"}`).join(" ｜ ")}`,
    "",
    "## 优势",
    ...result.strengths.map((item) => `- ${item}`),
    "",
    "## 问题",
    ...result.problems.map((item) => `- ${item}`),
    "",
    "## 改进建议",
    ...result.suggestions.map((item) => `- ${item}`),
  ];
  if (result.benchmarkNote) {
    lines.push("", "## 评语", result.benchmarkNote);
  }
  if (!result.parsed) {
    lines.push("", "## 原始输出", "```", result.rawReport, "```");
  }
  return lines.join("\n");
}

export function AccountAnalysisPanel({
  configured,
  onOpenSettings,
}: {
  configured: boolean;
  onOpenSettings: () => void;
}) {
  const [accountUrl, setAccountUrl] = useState("");
  const [notesLimit, setNotesLimit] = useState("20");
  const [merchantNote, setMerchantNote] = useState("");
  const [result, setResult] = useState<AccountAnalysisResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  async function handleAnalyze() {
    if (!accountUrl.trim()) {
      setError("请填写小红书主页链接或 24 位用户编号。");
      return;
    }
    setError("");
    setRunning(true);
    setShowRaw(false);
    try {
      const response = await fetch("/api/account-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountUrl, notesLimit, merchantNote }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "账号评估失败，请稍后重试。");
      }
      setResult(payload as AccountAnalysisResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "账号评估失败，请稍后重试。");
    } finally {
      setRunning(false);
    }
  }

  function handleExport(format: "md" | "json") {
    if (!result) return;
    if (format === "json") {
      downloadText(
        `${result.id}.json`,
        JSON.stringify({ exportedAt: new Date().toISOString(), ...result }, null, 2),
        "application/json",
      );
      return;
    }
    downloadText(`${result.id}.md`, buildMarkdown(result), "text/markdown");
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[336px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              账号评估
            </CardTitle>
            <Badge variant="outline" className="ml-auto">
              12 积分 / 次
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="account-url" className="text-xs font-medium">
              小红书主页链接或用户编号
            </label>
            <Input
              id="account-url"
              value={accountUrl}
              onChange={(event) => setAccountUrl(event.target.value)}
              placeholder="https://www.xiaohongshu.com/user/profile/..."
              className="text-xs"
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="account-limit" className="text-xs font-medium">
              拉取笔记条数上限
            </label>
            <Input
              id="account-limit"
              type="number"
              min={1}
              max={100}
              value={notesLimit}
              onChange={(event) => setNotesLimit(event.target.value)}
              className="text-xs"
            />
            <p className="text-[10px] leading-4 text-muted-foreground">
              建议 20。
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="merchant-note" className="text-xs font-medium">
              商家背景说明（可空）
            </label>
            <Textarea
              id="merchant-note"
              value={merchantNote}
              onChange={(event) => setMerchantNote(event.target.value)}
              placeholder="例如：校园咖啡店，主要面向港中深学生"
              className="min-h-[70px] text-xs"
            />
          </div>

          {!configured ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0 space-y-1.5">
                <p>还没配置账号评估工作流的 API Key。</p>
                <Button type="button" size="sm" variant="outline" onClick={onOpenSettings}>
                  <Settings2 className="h-3.5 w-3.5" />
                  打开 Dify 设置
                </Button>
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            className="w-full"
            onClick={handleAnalyze}
            disabled={running || !configured}
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "评估中…" : "开始评估"}
          </Button>

          <p className="text-[10px] leading-4 text-muted-foreground">
            浏览量不公开，仅用点赞 / 收藏 / 评论。
          </p>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-4">
        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
          </div>
        ) : null}

        {running ? (
          <Card>
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="text-sm font-medium">正在拉取公开笔记并评估</div>
              <p className="max-w-sm text-xs leading-5 text-muted-foreground">
                依次执行：账号解析 → SocialToAI 拉取笔记 → 指标计算 → 模型评分。通常需要 20 秒左右。
              </p>
            </CardContent>
          </Card>
        ) : result ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    评估结果
                  </CardTitle>
                  <Badge variant="outline">{result.id}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(result.startedAt)} · 用时 {Math.round(result.elapsedMs / 1000)}s
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("md")}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Markdown
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport("json")}
                    >
                      <Download className="h-3.5 w-3.5" />
                      JSON
                    </Button>
                  </div>
                </div>
                <p className="break-all text-[11px] leading-4 text-muted-foreground">
                  {result.account}
                  {result.merchantNote ? ` · ${result.merchantNote}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!result.parsed ? (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-800">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      模型返回里没有找到结构化评分，下面展示的是原始输出，可以点「查看原始返回」核对。
                    </span>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                  <div>
                    <div className="text-[11px] text-muted-foreground">总评分</div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-4xl font-semibold leading-none tabular-nums",
                          scoreTextTone(result.overallScore),
                        )}
                      >
                        {result.overallScore ?? "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <Badge variant={result.overallScore === null ? "outline" : result.overallScore >= 60 ? "success" : "destructive"}>
                    {scoreLabel(result.overallScore)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {DIMENSIONS.map((item) => {
                    const score = result.scores[item.key];
                    return (
                      <div key={item.key} className="space-y-1.5 rounded-md border px-2.5 py-2">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-muted-foreground">权重 {item.weight}%</span>
                          <span className={cn("ml-auto tabular-nums font-medium", scoreTextTone(score))}>
                            {score ?? "—"}
                          </span>
                        </div>
                        <Progress
                          value={score ?? 0}
                          indicatorClassName={scoreBarTone(score)}
                        />
                      </div>
                    );
                  })}
                </div>

                {result.benchmarkNote ? (
                  <p className="rounded-md bg-muted/40 px-3 py-2 text-[11px] leading-5 text-muted-foreground">
                    评语：{result.benchmarkNote}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    优势
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.strengths.length > 0 ? (
                    result.strengths.map((item, index) => (
                      <p key={`${index}-${item}`} className="text-[11px] leading-5">
                        · {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground">未返回</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-1.5 text-xs">
                    <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
                    问题
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.problems.length > 0 ? (
                    result.problems.map((item, index) => (
                      <p key={`${index}-${item}`} className="text-[11px] leading-5">
                        · {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground">未返回</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-1.5 text-xs">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    改进建议
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.suggestions.length > 0 ? (
                    result.suggestions.map((item, index) => (
                      <p key={`${index}-${item}`} className="text-[11px] leading-5">
                        {index + 1}. {item}
                      </p>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground">未返回</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="flex items-center gap-1.5 text-xs">
                    <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                    原始返回
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 text-[11px] text-muted-foreground"
                    onClick={() => setShowRaw((current) => !current)}
                  >
                    {showRaw ? "收起" : "查看原始返回"}
                  </Button>
                </div>
              </CardHeader>
              {showRaw ? (
                <CardContent>
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted/40 p-2.5 text-[10px] leading-4 text-muted-foreground">
                    {result.rawReport}
                  </pre>
                </CardContent>
              ) : null}
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">还没有评估结果</div>
              <p className="max-w-sm text-xs leading-5 text-muted-foreground">
                输入主页链接或用户编号，输出五维评分与改进建议。
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
