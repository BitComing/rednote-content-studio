"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  CircleAlert,
  Clipboard,
  Download,
  FileJson,
  FileText,
  Loader2,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TrendPicker } from "@/components/workbench/trend-picker";
import type { Workbench } from "@/components/workbench/use-workbench";
import { ISSUE_TYPE_LABELS, shortToneLabel, TONES } from "@/lib/constants";
import type { RevisionMode } from "@/lib/types";
import { cn, copyText } from "@/lib/utils";

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

export function MobileReview({ wb }: { wb: Workbench }) {
  const {
    run,
    status,
    selectedDraft: draft,
    setSelectedPlatform,
    feedback,
    setFeedback,
    scoreFeedback,
    setScoreFeedback,
    verifiedCorrections,
    setVerifiedCorrections,
    revisionMode,
    setRevisionMode,
    toneChoice,
    setToneChoice,
    trend,
    setTrend,
    handleApprove,
    handleReject,
    handleExport,
    busy,
  } = wb;
  const [copied, setCopied] = useState(false);

  if (!run || !draft) {
    return (
      <Card>
        <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
          <ShieldCheck className="h-5 w-5 text-muted-foreground/60" />
          <div className="text-sm font-medium">还没有可审核的稿件</div>
          <div className="text-[11px] text-muted-foreground">先在「简报」运行一次生成</div>
        </CardContent>
      </Card>
    );
  }

  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const reviewLocked = isApproved || isRejected;
  const body = draft.secondRound || draft.firstRound;
  const score = draft.score ?? run.score;
  const blocks = draft.issues.filter((issue) => issue.severity === "block").length;
  const pendingClaims = draft.claims.filter((claim) => claim.status === "to_verify").length;

  async function handleCopy() {
    const ok = await copyText(body);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="space-y-3">
      <div
        className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        {run.drafts.map((item) => (
          <button
            key={item.platform}
            type="button"
            onClick={() => setSelectedPlatform(item.platform)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              item.platform === draft.platform
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {item.platform}
            {item.issues.length > 0 ? (
              <span className="rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-700">
                {item.issues.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-3.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] text-muted-foreground">内部评审</div>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-[32px] font-semibold leading-none">
                  {score >= 0 ? score : "—"}
                </span>
                <span className="text-[11px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}>
                {isApproved ? "已通过" : isRejected ? "已归档" : "待确认"}
              </Badge>
              {status === "revising" ? (
                <Badge variant="info">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  改稿中
                </Badge>
              ) : null}
            </div>
          </div>
          <Progress value={score > 0 ? score : 0} className="mt-3" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="warning">{draft.issues.length} 条建议</Badge>
            {blocks > 0 ? <Badge variant="destructive">{blocks} 条拦截</Badge> : null}
            <Badge variant="outline">{draft.wordCount} 字</Badge>
          </div>
        </CardContent>
      </Card>

      <details className="rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-[13px] font-medium">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            查看当前稿件
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">展开</span>
        </summary>
        <div className="space-y-3 border-t p-3.5">
          <div className="max-h-[46vh] overflow-y-auto whitespace-pre-wrap break-words text-[15px] leading-[1.9] text-foreground/90">
            {body}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md border bg-card text-[13px] font-medium"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
            {copied ? "已复制" : "复制全文"}
          </button>
        </div>
      </details>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              问题清单
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">
              {draft.issues.length} 条
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {draft.issues.length === 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] leading-5 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              无拦截项
            </div>
          ) : (
            draft.issues.map((issue) => {
              const long = issue.reason.length > 120 || (issue.suggestion?.length ?? 0) > 120;
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
                        <Badge variant={issue.severity === "block" ? "destructive" : "warning"}>
                          {issue.severity === "block" ? "拦截" : "建议"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {ISSUE_TYPE_LABELS[issue.type] || issue.type}
                        </span>
                      </div>
                      <p className={cn("text-[13px] leading-5", long && "line-clamp-3")}>
                        {issue.reason}
                      </p>
                      {issue.suggestion ? (
                        <p
                          className={cn(
                            "text-[11px] leading-5 text-muted-foreground",
                            long && "line-clamp-2",
                          )}
                        >
                          建议：{issue.suggestion}
                        </p>
                      ) : null}
                      {long ? (
                        <details>
                          <summary className="cursor-pointer text-[11px] font-medium text-primary">
                            展开全文
                          </summary>
                          <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5">
                            {issue.reason}
                          </p>
                          {issue.suggestion ? (
                            <p className="mt-1.5 whitespace-pre-line text-[11px] leading-5 text-muted-foreground">
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

      <details className="rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-[13px] font-medium">
          <span className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            事实引用
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {draft.claims.length} 条{pendingClaims > 0 ? ` · ${pendingClaims} 待核实` : ""}
          </span>
        </summary>
        <div className="divide-y border-t">
          {draft.claims.length === 0 ? (
            <p className="px-3.5 py-3 text-[11px] text-muted-foreground">本稿没有提取到事实引用。</p>
          ) : (
            draft.claims.map((claim) => (
              <div key={claim.id} className="flex items-start gap-2 px-3.5 py-2.5">
                <Badge variant={claimVariant[claim.status]} className="mt-0.5 shrink-0">
                  {claimLabel[claim.status]}
                </Badge>
                <div className="min-w-0">
                  <div className="text-[13px] leading-5">{claim.claim}</div>
                  {claim.sourceQuote ? (
                    <div className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                      原文：{claim.sourceQuote}
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </details>

      {reviewLocked ? (
        <Card>
          <CardContent className="space-y-3 p-3.5">
            <div
              className={cn(
                "flex items-start gap-2 rounded-md border p-3",
                isApproved
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-red-200 bg-red-50/60",
              )}
            >
              {isApproved ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              ) : (
                <Archive className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
              )}
              <div className="text-[13px] font-semibold">
                {isApproved ? "当前稿已通过人工确认" : "当前稿已归档"}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleExport("md")}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border bg-card text-[13px] font-medium"
              >
                <Download className="h-4 w-4" />
                Markdown
              </button>
              <button
                type="button"
                onClick={() => handleExport("json")}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border bg-card text-[13px] font-medium"
              >
                <FileJson className="h-4 w-4" />
                JSON
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>改稿</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="m-revision-mode" className="text-[13px] font-medium">
                  修改范围
                </label>
                <Select
                  id="m-revision-mode"
                  value={revisionMode}
                  onChange={(event) => setRevisionMode(event.target.value as RevisionMode)}
                  className="h-10 text-base"
                >
                  <option value="auto">自动分流</option>
                  <option value="tone">只调整语气</option>
                  <option value="content">局部内容 / 话题调整</option>
                  <option value="facts">纠正已核实事实</option>
                  <option value="reevaluate">仅重新评分（不改文案）</option>
                  <option value="regenerate">重新生成（调用首轮工具）</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="m-feedback" className="text-[13px] font-medium">
                  修改意见
                </label>
                <Textarea
                  id="m-feedback"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="例如：删掉「光线好、桌面宽」，价格先不写"
                  className="min-h-[88px] resize-y text-base leading-6"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="m-verified" className="text-[13px] font-medium">
                  已核实事实补充
                </label>
                <Textarea
                  id="m-verified"
                  value={verifiedCorrections}
                  onChange={(event) => setVerifiedCorrections(event.target.value)}
                  placeholder="只填商家确认过的事实，没有则留空"
                  className="min-h-[72px] resize-y text-base leading-6"
                />
              </div>

              <details className="rounded-md border bg-muted/20">
                <summary className="cursor-pointer list-none px-3 py-2.5 text-[13px] font-medium">
                  更多改稿选项
                </summary>
                <div className="space-y-3 border-t p-3">
                  <div className="space-y-1.5">
                    <label htmlFor="m-tone-choice" className="text-[13px] font-medium">
                      本次改稿语气
                    </label>
                    <Select
                      id="m-tone-choice"
                      value={toneChoice}
                      onChange={(event) => setToneChoice(event.target.value)}
                      className="h-10 text-base"
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
                    <label htmlFor="m-score-feedback" className="text-[13px] font-medium">
                      评分异议
                    </label>
                    <Textarea
                      id="m-score-feedback"
                      value={scoreFeedback}
                      onChange={(event) => setScoreFeedback(event.target.value)}
                      placeholder="说明哪个判断不合理及原因；不会因要求高分而加分"
                      className="min-h-[72px] resize-y text-base leading-6"
                    />
                  </div>
                  <TrendPicker value={trend} onChange={setTrend} />
                </div>
              </details>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>审核结论</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={busy || !run.canApprove}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-[13px] font-medium text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  通过当前稿
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={busy}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border bg-card text-[13px] font-medium disabled:opacity-50"
                >
                  <Archive className="h-4 w-4" />
                  拒绝归档
                </button>
              </div>
              <p className="text-[11px] leading-4 text-muted-foreground">
                存在拦截项或外部评估未通过时不能通过；通过后仍由人决定是否发布。
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
