import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PreviewActions } from "@/components/mobile/preview-actions";
import { PreviewBody } from "@/components/mobile/preview-body";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_VARIANTS, STATUS_LABELS } from "@/lib/constants";
import { loadRun } from "@/lib/run-store";
import type { RunResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "稿定",
  description: "内容预览",
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

        <PreviewBody run={run} draft={draft} />
      </main>

      <PreviewActions text={body} title={title} />
    </div>
  );
}
