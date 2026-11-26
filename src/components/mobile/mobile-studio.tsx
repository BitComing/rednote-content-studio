"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Clipboard,
  ClipboardCheck,
  FileText,
  Loader2,
  PenLine,
  RefreshCw,
  Settings2,
  Share2,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";

import { AccountAnalysisPanel } from "@/components/workbench/account-analysis-panel";
import { DifySettingsDialog } from "@/components/workbench/dify-settings-dialog";
import { EvidencePanel } from "@/components/workbench/evidence-panel";
import { useWorkbench, type GenerateStep } from "@/components/workbench/use-workbench";
import { MobileBrief } from "@/components/mobile/mobile-brief";
import { MobileDrafts } from "@/components/mobile/mobile-drafts";
import { MobileReview } from "@/components/mobile/mobile-review";
import { PreviewBody } from "@/components/mobile/preview-body";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_VARIANTS, STATUS_LABELS } from "@/lib/constants";
import { cn, copyText } from "@/lib/utils";

const STEPS: Array<{ key: GenerateStep; label: string; icon: typeof FileText }> = [
  { key: "brief", label: "简报", icon: FileText },
  { key: "results", label: "稿件", icon: ClipboardCheck },
  { key: "review", label: "审核", icon: ShieldCheck },
];

export function MobileStudio({
  initialDifyConfigured,
  initialAnalysisConfigured,
}: {
  initialDifyConfigured: boolean;
  initialAnalysisConfigured: boolean;
}) {
  const wb = useWorkbench({ initialDifyConfigured, initialAnalysisConfigured });
  const [toast, setToast] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    view,
    setView,
    step,
    setStep,
    status,
    run,
    difyConfigured,
    analysisConfigured,
    settingsOpen,
    setSettingsOpen,
    input,
    patchInput,
    selectedPlatform,
    setSelectedPlatform,
    error,
    setError,
    busy,
    handleRun,
    handleRevise,
    handleExport,
    handleSettingsStatusChange,
  } = wb;

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function handleShare(platform: string) {
    if (!run) return;
    const url = `${window.location.origin}/p/${run.id}?p=${encodeURIComponent(platform)}`;
    const ok = await copyText(url);
    flash(ok ? "预览链接已复制，可在手机浏览器打开" : url);
  }

  const previewDraft = run
    ? run.drafts.find((draft) => draft.platform === selectedPlatform) ||
      run.drafts[0] ||
      null
    : null;

  async function copyFullText() {
    if (!previewDraft) return;
    const body = previewDraft.secondRound || previewDraft.firstRound;
    flash((await copyText(body)) ? "全文已复制" : "复制失败，请长按选择文本");
  }

  async function copyPreviewLink() {
    if (!run || !previewDraft) return;
    const url = `${window.location.origin}/p/${run.id}?p=${encodeURIComponent(previewDraft.platform)}`;
    flash((await copyText(url)) ? "分享链接已复制" : url);
  }

  const reviewLocked = status === "approved" || status === "rejected";

  return (
    <div className="mobile-shell flex min-h-screen min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-[560px] items-center gap-2 px-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <PenLine className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold leading-tight">校园内容工作台</div>
            <div className="truncate text-[10px] leading-tight text-muted-foreground">
              移动版 · {difyConfigured ? "Dify 已配置" : "未配置 Dify"}
            </div>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Badge variant={STATUS_BADGE_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="连接设置"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card text-muted-foreground"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {previewOpen ? (
          <div className="mx-auto flex w-full max-w-[560px] items-center gap-2 px-3 pb-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary/60 px-2.5 text-[12px] font-medium text-muted-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回工作台
            </button>
            <span className="truncate text-[11px] text-muted-foreground">
              成品页 · {previewDraft?.platform ?? ""}
            </span>
          </div>
        ) : view === "generate" ? (
          <div className="mx-auto grid w-full max-w-[560px] grid-cols-3 gap-1 px-3 pb-2">
            {STEPS.map((item, index) => {
              const active = step === item.key;
              const disabled = item.key === "review" && !run;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStep(item.key)}
                  disabled={disabled}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex h-8 items-center justify-center gap-1.5 rounded-md border text-[12px] font-medium transition-colors",
                    active
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-transparent bg-secondary/60 text-muted-foreground",
                    disabled && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold",
                      active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <Icon className="h-3 w-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[560px] px-3 pb-2">
            <div className="flex h-8 items-center gap-1.5 rounded-md bg-secondary/60 px-3 text-[12px] font-medium text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
              账号评估 · 独立工作流
            </div>
          </div>
        )}
      </header>

      {error ? (
        <div className="mx-auto mt-2 flex w-full max-w-[560px] items-start gap-2 px-3">
          <div className="flex w-full items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 leading-5">{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="关闭提示">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <main
        className={cn(
          "mx-auto w-full max-w-[560px] flex-1 px-3 pt-3",
          view === "analysis" ? "pb-28" : "pb-44",
        )}
      >
        {previewOpen && run && previewDraft ? (
          <div className="space-y-3">
            {run.drafts.length > 1 ? (
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
                      "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium",
                      item.platform === previewDraft.platform
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {item.platform}
                  </button>
                ))}
              </div>
            ) : null}
            <PreviewBody
              run={run}
              draft={previewDraft}
              shareHref={`/p/${run.id}?p=${encodeURIComponent(previewDraft.platform)}`}
            />
          </div>
        ) : view === "analysis" ? (
          <AccountAnalysisPanel
            configured={analysisConfigured}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : step === "brief" ? (
          <MobileBrief value={input} onChange={patchInput} />
        ) : step === "results" ? (
          <div className="space-y-3">
            <MobileDrafts
              run={run}
              status={status}
              selectedPlatform={selectedPlatform}
              onSelectPlatform={setSelectedPlatform}
              onShare={handleShare}
            />
            {run ? <EvidencePanel run={run} onExport={() => handleExport("json")} /> : null}
          </div>
        ) : (
          <MobileReview wb={wb} />
        )}
      </main>

      {toast ? (
        <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+124px)] left-1/2 z-40 w-max max-w-[86vw] -translate-x-1/2 break-all rounded-full bg-foreground px-4 py-2 text-center text-[12px] text-background shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto w-full max-w-[560px]">
          {view === "generate" && previewOpen ? (
            <div className="flex gap-2 px-3 py-2">
              <button
                type="button"
                onClick={copyFullText}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-medium text-primary-foreground"
              >
                <Clipboard className="h-4 w-4" />
                复制全文
              </button>
              <button
                type="button"
                onClick={copyPreviewLink}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border bg-card text-[15px] font-medium"
              >
                <Share2 className="h-4 w-4" />
                分享链接
              </button>
            </div>
          ) : view === "generate" ? (
            <div className="px-3 py-2">
              {step === "brief" ? (
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={busy}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-medium text-primary-foreground disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PenLine className="h-4 w-4" />
                  )}
                  {busy ? "正在生成" : "生成初稿"}
                </button>
              ) : step === "results" ? (
                <button
                  type="button"
                  onClick={() => setStep("review")}
                  disabled={!run || busy}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-medium text-primary-foreground disabled:opacity-50"
                >
                  进入人工审核
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : reviewLocked ? (
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-card text-[15px] font-medium"
                >
                  <Smartphone className="h-4 w-4" />
                  查看成品页
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRevise}
                  disabled={busy || !run}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-medium text-primary-foreground disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {busy ? "处理中" : `提交处理 · 版本 ${(run?.history?.length || 1) + 1}`}
                </button>
              )}
            </div>
          ) : null}

          <nav className="grid grid-cols-3 border-t border-border/70" aria-label="移动端功能切换">
            <button
              type="button"
              onClick={() => {
                setView("generate");
                setPreviewOpen(false);
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium",
                view === "generate" && !previewOpen ? "text-primary" : "text-muted-foreground",
              )}
            >
              <PenLine className="h-5 w-5" />
              生成
            </button>
            <button
              type="button"
              onClick={() => {
                setView("generate");
                setPreviewOpen(true);
              }}
              disabled={!run}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium",
                !run
                  ? "text-muted-foreground/40"
                  : view === "generate" && previewOpen
                    ? "text-primary"
                    : "text-muted-foreground",
              )}
            >
              <Smartphone className="h-5 w-5" />
              成品页
            </button>
            <button
              type="button"
              onClick={() => {
                setView("analysis");
                setPreviewOpen(false);
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium",
                view === "analysis" ? "text-primary" : "text-muted-foreground",
              )}
            >
              <BarChart3 className="h-5 w-5" />
              评估
            </button>
          </nav>
        </div>
      </div>

      <DifySettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onStatusChange={handleSettingsStatusChange}
      />
    </div>
  );
}
