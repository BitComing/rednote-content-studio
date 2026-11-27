"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
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
import { StepNav, type StepNavItem } from "@/components/workbench/step-nav";
import type { AccountAnalysisResult, AccountAnalysisScores } from "@/lib/types";
import { cn, downloadText, formatDateTime } from "@/lib/utils";

export type AccountStep = "input" | "overview" | "advice";

const STEPS: StepNavItem<AccountStep>[] = [
  { key: "input", label: "填账号" },
  { key: "overview", label: "看评估" },
  { key: "advice", label: "看建议" },
];

const DIMENSIONS: Array<{
  key: keyof AccountAnalysisScores;
  label: string;
}> = [
  { key: "content", label: "内容质量" },
  { key: "interaction", label: "互动表现" },
  { key: "consistency", label: "发布规律" },
  { key: "topicStructure", label: "选题结构" },
  { key: "growthPotential", label: "增长潜力" },
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
  step: controlledStep,
  onStepChange,
  onResultChange,
  hideStepNav = false,
  hideHeader = false,
}: {
  configured: boolean;
  onOpenSettings: () => void;
  step?: AccountStep;
  onStepChange?: (step: AccountStep) => void;
  onResultChange?: (hasResult: boolean) => void;
  hideStepNav?: boolean;
  hideHeader?: boolean;
}) {
  const [internalStep, setInternalStep] = useState<AccountStep>("input");
  const step = controlledStep ?? internalStep;
  const setStep = onStepChange ?? setInternalStep;
  const [accountUrl, setAccountUrl] = useState("");
  const [notesLimit, setNotesLimit] = useState("20");
  const [merchantNote, setMerchantNote] = useState("");
  const [result, setResult] = useState<AccountAnalysisResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  function updateResult(next: AccountAnalysisResult | null) {
    setResult(next);
    onResultChange?.(Boolean(next));
  }

  async function handleAnalyze() {
    if (!accountUrl.trim()) {
      setError("请填写小红书主页链接或 24 位用户编号。");
      return;
    }
    setError("");
    setRunning(true);
    updateResult(null);
    setStep("overview");
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
      updateResult(payload as AccountAnalysisResult);
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
    <>
      {hideStepNav ? null : (
        <StepNav
          ariaLabel="账号评估步骤"
          step={step}
          items={STEPS}
          disabledKeys={result ? [] : ["advice"]}
          onChange={setStep}
        />
      )}

      {error ? (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            className="shrink-0 text-xs font-medium text-red-700 underline-offset-2 hover:underline"
            onClick={() => setStep("input")}
          >
            返回输入
          </button>
        </div>
      ) : null}

      {step === "input" ? (
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader className={hideHeader ? "hidden" : "hidden pb-3 sm:block"}>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  输入账号
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  12 积分 / 次
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-3.5 sm:space-y-5 sm:p-5">
              <div className="space-y-2">
                <label
                  htmlFor="account-url"
                  className="flex items-center gap-1 text-[13px] font-medium"
                >
                  小红书主页链接或用户编号
                  <span className="text-red-600" aria-hidden>
                    *
                  </span>
                </label>
                <Input
                  id="account-url"
                  value={accountUrl}
                  onChange={(event) => setAccountUrl(event.target.value)}
                  placeholder="主页链接"
                  className="h-10 text-base sm:h-9 sm:text-sm"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="account-limit"
                  className="flex h-5 items-center text-[13px] font-medium"
                >
                  拉取笔记条数上限
                </label>
                <Input
                  id="account-limit"
                  type="number"
                  min={1}
                  max={100}
                  value={notesLimit}
                  onChange={(event) => setNotesLimit(event.target.value)}
                  className="h-10 max-w-[180px] text-base sm:h-9 sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="merchant-note"
                  className="flex h-5 items-center text-[13px] font-medium"
                >
                  商家背景说明（可空）
                </label>
                <Textarea
                  id="merchant-note"
                  value={merchantNote}
                  onChange={(event) => setMerchantNote(event.target.value)}
                  placeholder="如：校园咖啡店"
                  className="min-h-[84px] resize-y text-base leading-6 sm:text-sm"
                />
              </div>

              {!configured ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] leading-5 text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 space-y-2">
                    <p>账号评估 API Key 未配置。</p>
                    <Button type="button" size="sm" variant="outline" onClick={onOpenSettings}>
                      <Settings2 className="h-3.5 w-3.5" />
                      打开设置
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-2.5 border-t pt-4 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  className="w-full sm:w-56"
                  onClick={handleAnalyze}
                  disabled={running || !configured}
                >
                  {running ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {running ? "评估中…" : "开始评估"}
                </Button>
                <span className="text-[11px] text-muted-foreground sm:hidden">
                  12 积分 / 次
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : step === "overview" ? (
        <div className="mx-auto max-w-4xl">
          {running ? (
            <Card>
              <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="text-sm font-medium">正在拉取公开笔记并评估</div>
              </CardContent>
            </Card>
          ) : !result ? (
            <Card>
              <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-center">
                <BarChart3 className="h-6 w-6 text-muted-foreground/60" />
                <div className="text-sm font-medium">还没有评估结果</div>
                <Button variant="outline" onClick={() => setStep("input")}>
                  去输入账号
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2.5">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    评估概览
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {result.id}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(result.startedAt)} ·{" "}
                    {Math.round(result.elapsedMs / 1000)}s
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
                <p className="break-all text-xs leading-5 text-muted-foreground">
                  {result.account}
                  {result.merchantNote ? ` · ${result.merchantNote}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!result.parsed ? (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] leading-5 text-amber-800">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>未返回结构化评分，以下为原始输出。</span>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground">总评分</div>
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
                  <Badge
                    variant={
                      result.overallScore === null
                        ? "outline"
                        : result.overallScore >= 60
                          ? "success"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {scoreLabel(result.overallScore)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {DIMENSIONS.map((item) => {
                    const score = result.scores[item.key];
                    return (
                      <div key={item.key} className="space-y-1.5 rounded-md border px-3 py-2">
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="font-medium">{item.label}</span>
                          <span
                            className={cn(
                              "ml-auto tabular-nums font-medium",
                              scoreTextTone(score),
                            )}
                          >
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
                  <p className="rounded-md bg-muted/40 px-3 py-2 text-[13px] leading-5 text-muted-foreground">
                    评语：{result.benchmarkNote}
                  </p>
                ) : null}

                <Button onClick={() => setStep("advice")} className="w-full sm:w-auto">
                  查看改进建议
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : !result ? (
        <Card className="mx-auto max-w-4xl">
          <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
            <Lightbulb className="h-6 w-6 text-muted-foreground/60" />
            <div className="text-sm font-medium">还没有评估结果</div>
            <Button variant="outline" onClick={() => setStep("input")}>
              去输入账号
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Lightbulb className="h-4 w-4 text-primary" />
              改进建议
            </span>
            <Badge variant="outline" className="text-xs">
              {result.id}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setStep("overview")}
            >
              <ArrowLeft className="h-4 w-4" />
              返回概览
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {[
              {
                title: "优势",
                icon: CheckCircle2,
                iconClass: "text-emerald-600",
                items: result.strengths,
                numbered: false,
              },
              {
                title: "问题",
                icon: TriangleAlert,
                iconClass: "text-amber-600",
                items: result.problems,
                numbered: false,
              },
              {
                title: "改进建议",
                icon: Lightbulb,
                iconClass: "text-primary",
                items: result.suggestions,
                numbered: true,
              },
            ].map((group) => {
              const Icon = group.icon;
              return (
                <Card key={group.title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", group.iconClass)} />
                      {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.items.length > 0 ? (
                      group.items.map((item, index) => (
                        <p key={`${index}-${item}`} className="text-[13px] leading-6">
                          {group.numbered ? `${index + 1}. ` : "· "}
                          {item}
                        </p>
                      ))
                    ) : (
                      <p className="text-[13px] text-muted-foreground">未返回</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <details className="rounded-md border bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-[13px] font-medium">
              <span className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                原始返回
              </span>
              <span className="text-xs font-normal text-muted-foreground">展开</span>
            </summary>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words border-t p-3 text-xs leading-5 text-muted-foreground">
              {result.rawReport}
            </pre>
          </details>
        </div>
      )}
    </>
  );
}
