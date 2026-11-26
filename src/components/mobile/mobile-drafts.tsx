"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  FileText,
  Loader2,
  Share2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RunResult, WorkspaceStatus } from "@/lib/types";
import { cn, copyText } from "@/lib/utils";

export function MobileDrafts({
  run,
  status,
  selectedPlatform,
  onSelectPlatform,
  onShare,
}: {
  run: RunResult | null;
  status: WorkspaceStatus;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  onShare: (platform: string) => void;
}) {
  const [version, setVersion] = useState<"first" | "current">("current");
  const [copied, setCopied] = useState(false);

  const draft = useMemo(() => {
    if (!run) return null;
    return run.drafts.find((item) => item.platform === selectedPlatform) || run.drafts[0] || null;
  }, [run, selectedPlatform]);

  if (status === "running") {
    return (
      <Card>
        <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-sm font-medium">正在生成多平台稿件</div>
          <div className="text-[11px] text-muted-foreground">可以保持页面打开，完成后自动展示</div>
        </CardContent>
      </Card>
    );
  }

  if (!run || !draft) {
    return (
      <Card>
        <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
          <FileText className="h-5 w-5 text-muted-foreground/60" />
          <div className="text-sm font-medium">还没有生成稿</div>
          <div className="text-[11px] text-muted-foreground">先回到「简报」填写并运行</div>
        </CardContent>
      </Card>
    );
  }

  const body = version === "current" && draft.secondRound ? draft.secondRound : draft.firstRound;
  const showVersionSwitch = Boolean(draft.secondRound);

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
            onClick={() => onSelectPlatform(item.platform)}
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
        <CardContent className="space-y-3 p-3.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <Badge
              variant={
                status === "approved"
                  ? "success"
                  : status === "rejected"
                    ? "destructive"
                    : draft.status === "pass"
                      ? "success"
                      : "warning"
              }
            >
              {status === "approved"
                ? "已通过"
                : status === "rejected"
                  ? "已归档"
                  : draft.status === "pass"
                    ? "可审核"
                    : "需修订"}
            </Badge>
            <span className="text-[11px] text-muted-foreground">{draft.wordCount} 字</span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground">
              {draft.issues.length} 条建议 · {draft.claims.length} 条引用
            </span>
          </div>

          {showVersionSwitch ? (
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
              {[
                { value: "first" as const, label: "首轮稿" },
                { value: "current" as const, label: "当前版本" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setVersion(item.value)}
                  className={cn(
                    "h-8 rounded-md text-[13px] font-medium transition-colors",
                    version === item.value
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="max-h-[52vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-3 text-[15px] leading-[1.9] text-foreground/90">
            {body}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border bg-card text-[13px] font-medium"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              {copied ? "已复制" : "复制全文"}
            </button>
            <button
              type="button"
              onClick={() => onShare(draft.platform)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border bg-card text-[13px] font-medium"
            >
              <Share2 className="h-4 w-4" />
              分享预览
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
