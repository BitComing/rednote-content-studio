import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, PenLine } from "lucide-react";

import { PreviewActions } from "@/components/mobile/preview-actions";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_VARIANTS, STATUS_LABELS } from "@/lib/constants";
import { loadRun } from "@/lib/run-store";
import type { RunResult } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "内容预览 | Rednote Content Studio",
  description: "小红书内容预览：复制全文或分享给他人查看",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { runId } = await params;
  const { p } = await searchParams;

  let run: RunResult;
  try {
    run = loadRun(runId);
  } catch {
    notFound();
  }

  const draft =
    run.drafts.find((item) => item.platform === p) || run.drafts[0];
  if (!draft) notFound();

  const body = draft.secondRound || draft.firstRound;
  const title = (body.split("\n").find((line) => line.trim()) || draft.platform)
    .trim()
    .slice(0, 48);
  const approved = run.status === "approved";

  return (
    <div className="mobile-shell flex min-h-screen min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-[560px] items-center gap-2 px-3">
          <Link
            href="/m"
            aria-label="返回移动工作台"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold leading-tight">内容预览</div>
            <div className="truncate text-[10px] leading-tight text-muted-foreground">
              {draft.platform} · {draft.wordCount} 字
            </div>
          </div>
          <Badge
            variant={STATUS_BADGE_VARIANTS[run.status]}
            className="ml-auto shrink-0"
          >
            {STATUS_LABELS[run.status]}
          </Badge>
        </div>
      </header>

      {!approved ? (
        <div className="mx-auto mt-2 flex w-full max-w-[560px] items-start gap-2 px-3">
          <div className="flex w-full items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              此稿尚未通过人工确认（当前：{STATUS_LABELS[run.status]}）。仅供内部预览，请勿直接发布。
            </span>
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-[560px] flex-1 px-3 pb-28 pt-3">
        {run.drafts.length > 1 ? (
          <div
            className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: "none" }}
          >
            {run.drafts.map((item) => (
              <Link
                key={item.platform}
                href={`/p/${run.id}?p=${encodeURIComponent(item.platform)}`}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium",
                  item.platform === draft.platform
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {item.platform}
              </Link>
            ))}
          </div>
        ) : null}

        <article className="rounded-2xl border bg-card p-4 shadow-panel">
          <div className="mb-3 flex items-center gap-1.5 border-b pb-2.5 text-[11px] text-muted-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PenLine className="h-3 w-3" />
            </span>
            {draft.platform}
            <span>·</span>
            {draft.secondRound ? "当前版本" : "首轮稿"}
          </div>
          <div className="whitespace-pre-wrap break-words text-[15px] leading-[1.95] text-foreground/90">
            {body}
          </div>
        </article>

        <div className="mt-3 rounded-xl border bg-card px-3.5 py-3 text-[11px] leading-5 text-muted-foreground">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span>生成于 {formatDateTime(run.startedAt)}</span>
            <span>版本 V{run.history?.length || 1}</span>
            <span>内部评分 {draft.score >= 0 ? draft.score : "—"}</span>
            <span>{run.mode === "dify" ? "Dify 生成" : "演示模式"}</span>
          </div>
          <p className="mt-1.5">本页为本地存档的只读预览，修改请回到移动工作台。</p>
        </div>
      </main>

      <PreviewActions text={body} title={title} />
    </div>
  );
}
