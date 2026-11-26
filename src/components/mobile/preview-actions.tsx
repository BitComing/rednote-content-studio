"use client";

import { useState } from "react";
import { Check, Clipboard, Share2 } from "lucide-react";

import { copyText } from "@/lib/utils";

export function PreviewActions({ text, title }: { text: string; title: string }) {
  const [copied, setCopied] = useState<"copy" | "share" | null>(null);

  function flash(kind: "copy" | "share") {
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function handleCopy() {
    if (await copyText(text)) flash("copy");
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Cancelled or unsupported: fall back to copying the link.
      }
    }
    if (await copyText(url)) flash("share");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[560px] gap-2 px-3 py-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-medium text-primary-foreground"
        >
          {copied === "copy" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
          {copied === "copy" ? "已复制全文" : "复制全文"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border bg-card text-[15px] font-medium"
        >
          {copied === "share" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {copied === "share" ? "链接已复制" : "分享页面"}
        </button>
      </div>
    </div>
  );
}
