"use client";

import { AlertTriangle, ClipboardCheck, FileText, ShieldCheck, X } from "lucide-react";

import { AccountAnalysisPanel } from "@/components/workbench/account-analysis-panel";
import { BriefPanel } from "@/components/workbench/brief-panel";
import { DifySettingsDialog } from "@/components/workbench/dify-settings-dialog";
import { DraftWorkspace } from "@/components/workbench/draft-workspace";
import { ReviewEntry } from "@/components/workbench/review-entry";
import { ReviewWorkspace } from "@/components/workbench/review-workspace";
import { StepNav, type StepNavItem } from "@/components/workbench/step-nav";
import { TopBar } from "@/components/workbench/top-bar";
import { EvidencePanel } from "@/components/workbench/evidence-panel";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkbench, type GenerateStep } from "./use-workbench";

export function Studio({
  initialDifyConfigured,
  initialAnalysisConfigured,
}: {
  initialDifyConfigured: boolean;
  initialAnalysisConfigured: boolean;
}) {
  const {
    view,
    setView,
    step,
    setStep,
    difyConfigured,
    analysisConfigured,
    settingsOpen,
    setSettingsOpen,
    input,
    patchInput,
    status,
    run,
    selectedPlatform,
    setSelectedPlatform,
    selectedDraft,
    feedback,
    setFeedback,
    scoreFeedback,
    setScoreFeedback,
    revisionMode,
    setRevisionMode,
    verifiedCorrections,
    setVerifiedCorrections,
    toneChoice,
    setToneChoice,
    trend,
    setTrend,
    error,
    setError,
    busy,
    handleRun,
    handleRevise,
    handleApprove,
    handleReject,
    handleExport,
    handleSettingsStatusChange,
  } = useWorkbench({ initialDifyConfigured, initialAnalysisConfigured });

  return (
    <TooltipProvider delayDuration={180}>
      <div className="min-h-screen">
        <TopBar
          view={view}
          onViewChange={setView}
          status={status}
          mode={run?.mode ?? (difyConfigured ? "dify" : "mock")}
          difyConfigured={difyConfigured}
          running={busy}
          canExport={Boolean(run)}
          onRun={handleRun}
          onExport={() => handleExport("md")}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {error ? (
          <div className="mx-auto mt-3 flex max-w-[1600px] items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 sm:mx-4 lg:mx-5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 leading-5">{error}</span>
            <button
              type="button"
              className="text-red-700/70 hover:text-red-800"
              onClick={() => setError("")}
              aria-label="关闭提示"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4 lg:px-5">
          {view === "analysis" ? (
            <AccountAnalysisPanel
              configured={analysisConfigured}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          ) : (
            <>
              <StepNav
                ariaLabel="内容生成步骤"
                step={step}
                items={STEP_ITEMS}
                disabledKeys={run ? [] : ["review"]}
                onChange={setStep}
              />
              {step === "brief" ? (
                <div className="mx-auto max-w-3xl">
                  <BriefPanel
                    value={input}
                    onChange={patchInput}
                    onRun={handleRun}
                    running={busy}
                  />
                </div>
              ) : step === "results" ? (
                <div className="space-y-3">
                  <ReviewEntry
                    run={run}
                    draft={selectedDraft}
                    running={status === "running"}
                    onOpen={() => setStep("review")}
                  />
                  <DraftWorkspace
                    run={run}
                    status={status}
                    selectedPlatform={selectedPlatform}
                    onSelectPlatform={setSelectedPlatform}
                    onOpenReview={() => setStep("review")}
                  />
                  {run && (
                    <EvidencePanel run={run} onExport={() => handleExport("json")} />
                  )}
                </div>
              ) : (
                <ReviewWorkspace
                  run={run}
                  draft={selectedDraft}
                  status={status}
                  platforms={run?.drafts.map((draft) => draft.platform) ?? []}
                  onSelectPlatform={setSelectedPlatform}
                  feedback={feedback}
                  scoreFeedback={scoreFeedback}
                  onScoreFeedbackChange={setScoreFeedback}
                  revisionMode={revisionMode}
                  onRevisionModeChange={setRevisionMode}
                  onFeedbackChange={setFeedback}
                  verifiedCorrections={verifiedCorrections}
                  onVerifiedChange={setVerifiedCorrections}
                  toneChoice={toneChoice}
                  onToneChange={setToneChoice}
                  trend={trend}
                  onTrendChange={setTrend}
                  onRevise={handleRevise}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onExport={handleExport}
                  onBack={() => setStep("results")}
                  busy={busy}
                />
              )}
            </>
          )}
        </main>

        <DifySettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onStatusChange={handleSettingsStatusChange}
        />
      </div>
    </TooltipProvider>
  );
}

const STEP_ITEMS: StepNavItem<GenerateStep>[] = [
  { key: "brief", label: "输入简报", icon: FileText },
  { key: "results", label: "运行概览", icon: ClipboardCheck },
  { key: "review", label: "人工审核", icon: ShieldCheck },
];
