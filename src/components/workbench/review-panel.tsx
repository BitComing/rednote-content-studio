"use client";

import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  CircleAlert,
  Download,
  FileJson,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { shortToneLabel, TONES } from "@/lib/constants";
import type { PlatformDraft, RevisionMode, RunResult, WorkspaceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrendPicker } from "./trend-picker";

const claimVariant = {
  supported: "success" as const,
  unsupported: "destructive" as const,
  to_verify: "warning" as const,
};

const claimLabel = {
  supported: "有依据",
  unsupported: "无依据",
  to_verify: "待核实",
};

const issueTypeLabel: Record<string, string> = {
  platform: "平台格式",
  to_verify: "待核实",
  facts: "事实",
  tone: "语气",
  banned_word: "禁用词",
  exaggeration: "夸张表达",
  trend: "热点",
  coverage: "平台覆盖",
};

function ScoreBlock({ draft, run }: { draft: PlatformDraft | null; run: RunResult }) {
  const score = draft?.score ?? run.score;
  const hasSecond = Boolean(draft?.secondRound);
  const issueCount = draft?.issues.length ?? 0;
  const summary = draft
    ? issueCount > 0
      ? `当前平台 ${issueCount} 条建议待人工确认。`
      : "当前平台未发现硬性拦截项，仍需人工确认。"
    : run.summary;
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] text-muted-foreground">工作流内部评审（整包分数）</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tracking-normal">{score >= 0 ? score : "—"}</span>
            <span className="text-[11px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <Badge variant={hasSecond ? "success" : "info"}>
          <TrendingUp className="h-3 w-3" />
          {hasSecond ? "当前版本复评" : "首轮评审"}
        </Badge>
      </div>
      <Progress
        value={score}
        className="mt-3"
        indicatorClassName={score >= 90 ? "bg-emerald-600" : undefined}
      />
      <div className="mt-2 text-[11px] leading-4 text-muted-foreground">{summary}</div>
    </div>
  );
}

export function ReviewPanel({
  run,
  draft,
  status,
  feedback,
  scoreFeedback,
  onScoreFeedbackChange,
  revisionMode,
  onRevisionModeChange,
  onFeedbackChange,
  verifiedCorrections,
  onVerifiedChange,
  toneChoice,
  onToneChange,
  trend,
  onTrendChange,
  onRevise,
  onApprove,
  onReject,
  onExport,
  busy,
}: {
  run: RunResult | null;
  draft: PlatformDraft | null;
  status: WorkspaceStatus;
  feedback: string;
  scoreFeedback: string;
  onScoreFeedbackChange: (value: string) => void;
  revisionMode: RevisionMode;
  onRevisionModeChange: (value: RevisionMode) => void;
  onFeedbackChange: (value: string) => void;
  verifiedCorrections: string;
  onVerifiedChange: (value: string) => void;
  toneChoice: string;
  onToneChange: (value: string) => void;
  trend: string;
  onTrendChange: (value: string) => void;
  onRevise: () => void;
  onApprove: () => void;
  onReject: () => void;
  onExport: (format: "md" | "json") => void;
  busy: boolean;
}) {
  if (status === "running" || status === "revising") {
    return (
      <Card className="h-fit min-w-0 xl:sticky xl:top-[72px]">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-sm font-medium">
            {status === "revising" ? "正在按所选路径处理" : "正在执行安全检查"}
          </div>
          <div className="text-[11px] text-muted-foreground">结果完成后可在这里审核</div>
        </CardContent>
      </Card>
    );
  }

  if (!run || !draft) {
    return (
      <Card className="h-fit min-w-0 xl:sticky xl:top-[72px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            人工审核
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-sm font-medium">等待首轮结果</div>
          <div className="max-w-[220px] text-center text-[11px] leading-5 text-muted-foreground">
            运行后在这里查看评分、拦截项和事实引用。
          </div>
        </CardContent>
      </Card>
    );
  }

  const issues = draft.issues;
  const allClaims = draft.claims;
  const hasSecond = Boolean(draft.secondRound);
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const reviewLocked = isApproved || isRejected;

  return (
    <Card className="h-fit min-w-0 xl:sticky xl:top-[72px]">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            人工审核
          </CardTitle>
          <Badge variant="outline">{draft.platform}</Badge>
          <Badge
            variant={
              isApproved ? "success" : isRejected ? "destructive" : issues.some((i) => i.severity === "block") ? "destructive" : "warning"
            }
            className="ml-auto"
          >
            {isApproved ? "已通过" : isRejected ? "已归档" : "待确认"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="max-h-none space-y-4 overflow-visible pr-3 xl:max-h-[calc(100vh-150px)] xl:overflow-y-auto xl:scrollbar-thin">
        <ScoreBlock draft={draft} run={run} />

        <div className="space-y-1.5">
          <label htmlFor="trend" className="text-xs font-medium">
            本次热点
          </label>
          <TrendPicker value={trend} onChange={onTrendChange} />

        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">问题清单</span>
            <span className="text-[11px] text-muted-foreground">{issues.length} 条</span>
          </div>
          {issues.length === 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] leading-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              未发现硬性拦截项，仍需人工确认后发布。
            </div>
          ) : (
            <div className="space-y-1.5">
              {issues.map((issue) => (
                <div key={issue.id} className="rounded-md border bg-card px-2.5 py-2">
                  <div className="flex items-start gap-2">
                    {issue.severity === "block" ? (
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={issue.severity === "block" ? "destructive" : "warning"}>
                          {issue.severity === "block" ? "拦截" : "建议"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {issueTypeLabel[issue.type] || issue.type}
                        </span>
                      </div>
                      <div className="mt-1 text-xs leading-5">{issue.reason}</div>
                      {issue.suggestion ? (
                        <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                          {issue.suggestion}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">事实引用</span>
            <span className="text-[11px] text-muted-foreground">{allClaims.length} 条</span>
          </div>
          <div className="overflow-hidden rounded-md border">
            {allClaims.map((claim, index) => (
              <div
                key={claim.id}
                className={cn(
                  "flex items-start gap-2 px-2.5 py-2",
                  index > 0 && "border-t",
                )}
              >
                <Badge variant={claimVariant[claim.status]} className="mt-0.5 shrink-0">
                  {claimLabel[claim.status]}
                </Badge>
                <div className="min-w-0">
                  <div className="text-[11px] leading-4">{claim.claim}</div>
                  {claim.sourceQuote ? (
                    <div
                      className="mt-0.5 truncate text-[10px] leading-4 text-muted-foreground"
                      title={claim.sourceQuote}
                    >
                      原文：{claim.sourceQuote}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {reviewLocked ? (
          <div
            className={cn(
              "space-y-3 rounded-md border p-3",
              isApproved
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-red-200 bg-red-50/60",
            )}
          >
            <div className="flex items-start gap-2">
              {isApproved ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              ) : (
                <Archive className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              )}
              <div>
                <div className="text-xs font-semibold">
                  {isApproved ? "当前稿已通过人工确认" : "当前稿已归档"}
                </div>
                <div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {isApproved
                    ? "可以导出 Markdown 或 JSON 进入发布流程。"
                    : "稿件和评审记录保留，可导出后人工修改。"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onExport("md")}>
                <Download className="h-4 w-4" />
                Markdown
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => onExport("json")}>
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block space-y-1 text-xs">修改范围
              <Select value={revisionMode} onChange={e => onRevisionModeChange(e.target.value as RevisionMode)}>
                <option value="auto">自动分流（混合反馈走局部改稿）</option>
                <option value="tone">只调整语气</option><option value="content">局部内容 / 话题调整</option>
                <option value="facts">纠正已核实事实</option><option value="reevaluate">仅重新评分（不改文案）</option>
                <option value="regenerate">重新生成（调用首轮工具）</option>
              </Select>
            </label>
            <label className="block space-y-1 text-xs">评分异议
              <Textarea value={scoreFeedback} onChange={e => onScoreFeedbackChange(e.target.value)} placeholder="说明哪个判断不合理及原因；不会因要求高分而加分" />
            </label>
            <div className="space-y-1.5">
              <label htmlFor="tone-choice" className="text-xs font-medium">
                本次改稿语气
              </label>
              <Select
                id="tone-choice"
                value={toneChoice}
                onChange={(event) => onToneChange(event.target.value)}
              >
                <option value="保持原 tone">保持原 tone</option>
                {TONES.filter((tone) => tone !== "自定义 Custom").map((tone) => (
                  <option key={tone} value={tone}>
                    {shortToneLabel(tone)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="feedback" className="text-xs font-medium">
                修改意见
              </label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(event) => onFeedbackChange(event.target.value)}
                placeholder="例如：把语气再收一点，公众号补充营业时间"
                className="min-h-[72px] resize-y text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="verified" className="text-xs font-medium">
                已核实事实补充
              </label>
              <Textarea
                id="verified"
                value={verifiedCorrections}
                onChange={(event) => onVerifiedChange(event.target.value)}
                placeholder="只填商家确认过的事实，没有则留空"
                className="min-h-[58px] resize-y text-xs"
              />
            </div>

            <div className="grid gap-2">
              <Button
                onClick={onRevise}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {`提交处理 · 版本 ${(run.history?.length || 1) + 1}`}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="success" onClick={onApprove} disabled={busy || !run.canApprove}>
                  <Check className="h-4 w-4" />
                  通过当前稿
                </Button>
                <Button variant="outline" onClick={onReject} disabled={busy}>
                  <Archive className="h-4 w-4" />
                  拒绝归档
                </Button>
              </div>
            </div>
            <p className="text-[10px] leading-4 text-muted-foreground">
              通过只确认当前稿，不会应用尚未提交的修改。存在拦截项或外部评估缺失时不能通过；草稿仍可导出供检查。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
