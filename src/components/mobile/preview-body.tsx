import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_VARIANTS, STATUS_LABELS } from "@/lib/constants";
import type { PlatformDraft, RunResult } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function PreviewBody({
  run,
  draft,
  shareHref,
}: {
  run: RunResult;
  draft: PlatformDraft;
  shareHref?: string;
}) {
  const body = draft.secondRound || draft.firstRound;
  const approved = run.status === "approved";

  return (
    <div className="space-y-3">
      {!approved ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            此稿尚未通过人工确认（当前：{STATUS_LABELS[run.status]}）。仅供内部预览，请勿直接发布。
          </span>
        </div>
      ) : null}

      <article className="rounded-2xl border bg-card p-4 shadow-panel">
        <div className="mb-3 flex items-center gap-1.5 border-b pb-2.5 text-[11px] text-muted-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-[10px] font-semibold">R</span>
          </span>
          {draft.platform}
          <span>·</span>
          {draft.secondRound ? "当前版本" : "首轮稿"}
          <Badge
            variant={STATUS_BADGE_VARIANTS[run.status]}
            className="ml-auto shrink-0"
          >
            {STATUS_LABELS[run.status]}
          </Badge>
        </div>
        <div className="whitespace-pre-wrap break-words text-[15px] leading-[1.95] text-foreground/90">
          {body}
        </div>
      </article>

      <div className="rounded-xl border bg-card px-3.5 py-3 text-[11px] leading-5 text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>生成于 {formatDateTime(run.startedAt)}</span>
          <span>版本 V{run.history?.length || 1}</span>
          <span>内部评分 {draft.score >= 0 ? draft.score : "—"}</span>
          <span>{run.mode === "dify" ? "Dify 生成" : "演示模式"}</span>
        </div>
        <p className="mt-1.5">本页为本地存档的只读预览，修改请回到移动工作台。</p>
        {shareHref ? (
          <a
            href={shareHref}
            className="mt-1 inline-block font-medium text-primary underline-offset-2 hover:underline"
          >
            打开独立分享页 →
          </a>
        ) : null}
      </div>
    </div>
  );
}
