"use client";

import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  Download,
  FileJson,
  FileText,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ISSUE_TYPE_LABELS, shortToneLabel, TONES } from "@/lib/constants";
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

function ScoreSummary({ draft, run }: { draft: PlatformDraft; run: RunResult }) {
  const score = draft.score ?? run.score;
  const issues = draft.issues;
  const blocks = issues.filter((issue) => issue.severity === "block").length;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">内部评审</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-semibold">{score >= 0 ? score : "—"}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
          <Badge variant={draft.secondRound ? "success" : "info"} className="text-xs">
            <TrendingUp className="h-3 w-3" />
            {draft.secondRound ? "当前版本复评" : "首轮评审"}
          </Badge>
        </div>
        <Progress value={score > 0 ? score : 0} className="mt-3" />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Badge variant="warning" className="text-xs">
            {issues.length} 条建议
          </Badge>
          {blocks > 0 ? (
            <Badge variant="destructive" className="text-xs">
              {blocks} 条拦截
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function IssuesCard({ draft }: { draft: PlatformDraft }) {
  const issues = draft.issues;
  return (
    <Card>
      <CardHeader className="pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            问题清单
          </CardTitle>
          <span className="text-xs text-muted-foreground">{issues.length} 条</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.length === 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] leading-5 text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            无拦截项
          </div>
        ) : (
          issues.map((issue) => {
            const long =
              issue.reason.length > 180 || (issue.suggestion?.length ?? 0) > 180;
            return (
              <div key={issue.id} className="rounded-md border bg-card p-3">
                <div className="flex items-start gap-2">
                  {issue.severity === "block" ? (
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={issue.severity === "block" ? "destructive" : "warning"}
                        className="text-xs"
                      >
                        {issue.severity === "block" ? "拦截" : "建议"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {ISSUE_TYPE_LABELS[issue.type] || issue.type}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-[13px] leading-5">{issue.reason}</p>
                    {issue.suggestion ? (
                      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                        建议：{issue.suggestion}
                      </p>
                    ) : null}
                    {long ? (
                      <details>
                        <summary className="cursor-pointer text-xs font-medium text-primary">
                          展开全文
                        </summary>
                        <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5">
                          {issue.reason}
                        </p>
                        {issue.suggestion ? (
                          <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-muted-foreground">
                            建议：{issue.suggestion}
                          </p>
                        ) : null}
                      </details>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function ClaimsCard({ draft }: { draft: PlatformDraft }) {
  const claims = draft.claims;
  const pending = claims.filter((claim) => claim.status === "to_verify").length;

  return (
    <Card>
      <CardContent className="p-0">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-[13px] font-medium">
            <span className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              事实引用
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {claims.length} 条
              {pending > 0 ? ` · ${pending} 条待核实` : ""}
            </span>
          </summary>
          <div className="border-t">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-start gap-2 border-b px-4 py-2.5 last:border-0"
              >
                <Badge variant={claimVariant[claim.status]} className="mt-0.5 shrink-0 text-xs">
                  {claimLabel[claim.status]}
                </Badge>
                <div className="min-w-0">
                  <div className="text-[13px] leading-5">{claim.claim}</div>
                  {claim.sourceQuote ? (
                    <div
                      className="mt-0.5 truncate text-xs leading-5 text-muted-foreground"
                      title={claim.sourceQuote}
                    >
                      原文：{claim.sourceQuote}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

export function ReviewWorkspace({
  run,
  draft,
  status,
  platforms,
  onSelectPlatform,
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
  onBack,
  busy,
}: {
  run: RunResult | null;
  draft: PlatformDraft | null;
  status: WorkspaceStatus;
  platforms: string[];
  onSelectPlatform: (platform: string) => void;
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
  onBack: () => void;
  busy: boolean;
}) {
  if (status === "running") {
    return (
      <Card className="mx-auto max-w-[900px]">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-sm font-medium">正在生成，完成后可审核</div>
        </CardContent>
      </Card>
    );
  }

  if (!run || !draft) {
    return (
      <Card className="mx-auto max-w-[900px]">
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-3">
          <ShieldCheck className="h-6 w-6 text-muted-foreground/60" />
          <div className="text-sm font-medium">还没有可审核的稿件</div>
          <Button variant="outline" onClick={onBack}>
            返回运行概览
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const reviewLocked = isApproved || isRejected;
  const body = draft.secondRound || draft.firstRound;

  return (
    <div className="mx-auto max-w-[1180px] space-y-3 pb-20">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-2.5 gap-y-2 p-3.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            人工审核
          </span>
          <span className="text-muted-foreground/50">/</span>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => onSelectPlatform(platform)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[13px] font-medium transition-colors",
                  platform === draft.platform
                    ? "border-border bg-card shadow-sm"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {platform}
              </button>
            ))}
          </div>
          <Badge
            variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}
            className="text-xs"
          >
            {isApproved ? "已通过" : isRejected ? "已归档" : "待确认"}
          </Badge>
          {status === "revising" ? (
            <Badge variant="info" className="text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              改稿中
            </Badge>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onBack} className="ml-auto">
            <ArrowLeft className="h-4 w-4" />
            返回稿件
          </Button>
        </CardContent>
      </Card>

      <details className="rounded-md border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-[13px] font-medium">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            查看当前稿件
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {draft.wordCount} 字
          </span>
        </summary>
        <div className="max-h-[320px] overflow-y-auto whitespace-pre-line border-t p-4 text-sm leading-6 text-foreground/90 scrollbar-thin">
          {body}
        </div>
      </details>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 space-y-3">
          <ScoreSummary draft={draft} run={run} />
          <IssuesCard draft={draft} />
          <ClaimsCard draft={draft} />
        </div>

        <Card className="h-fit">
          <CardHeader className="pb-2.5">
            <CardTitle>{reviewLocked ? "审核结果" : "改稿与提交"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                    <div className="text-[13px] font-semibold">
                      {isApproved ? "当前稿已通过人工确认" : "当前稿已归档"}
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
              <>
                <div className="space-y-1.5">
                  <label htmlFor="revision-mode" className="text-[13px] font-medium">
                    修改范围
                  </label>
                  <Select
                    id="revision-mode"
                    value={revisionMode}
                    onChange={(event) =>
                      onRevisionModeChange(event.target.value as RevisionMode)
                    }
                  >
                    <option value="auto">自动分流（混合反馈走局部改稿）</option>
                    <option value="tone">只调整语气</option>
                    <option value="content">局部内容 / 话题调整</option>
                    <option value="facts">纠正已核实事实</option>
                    <option value="reevaluate">仅重新评分（不改文案）</option>
                    <option value="regenerate">重新生成（调用首轮工具）</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="feedback" className="text-[13px] font-medium">
                    修改意见
                  </label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(event) => onFeedbackChange(event.target.value)}
                    placeholder="如：删掉价格，补充营业时间"
                    className="min-h-[84px] resize-y text-sm leading-6"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="verified" className="text-[13px] font-medium">
                    已核实事实补充
                  </label>
                  <Textarea
                    id="verified"
                    value={verifiedCorrections}
                    onChange={(event) => onVerifiedChange(event.target.value)}
                    placeholder="商家确认过的事实"
                    className="min-h-[64px] resize-y text-sm leading-6"
                  />
                </div>

                <details className="rounded-md border bg-muted/20">
                  <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium">
                    更多改稿选项
                  </summary>
                  <div className="space-y-3 border-t p-3">
                    <div className="space-y-1.5">
                      <label htmlFor="tone-choice" className="text-[13px] font-medium">
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
                      <label htmlFor="score-feedback" className="text-[13px] font-medium">
                        评分异议
                      </label>
                      <Textarea
                        id="score-feedback"
                        value={scoreFeedback}
                        onChange={(event) => onScoreFeedbackChange(event.target.value)}
                        placeholder="指出不合理之处及原因"
                        className="min-h-[64px] resize-y text-sm leading-6"
                      />
                    </div>
                    <TrendPicker value={trend} onChange={onTrendChange} />
                  </div>
                </details>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {reviewLocked ? null : (
        <div className="sticky bottom-3 z-20 flex flex-col gap-2 rounded-lg border bg-card/95 p-3 shadow-panel backdrop-blur sm:flex-row sm:items-center">
          <Button onClick={onRevise} disabled={busy} className="sm:w-52">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {`提交处理 · 版本 ${(run.history?.length || 1) + 1}`}
          </Button>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
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
      )}
    </div>
  );
}
