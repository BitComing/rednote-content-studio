"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { BriefPanel } from "@/components/workbench/brief-panel";
import { DifySettingsDialog } from "@/components/workbench/dify-settings-dialog";
import { DraftWorkspace } from "@/components/workbench/draft-workspace";
import { ReviewPanel } from "@/components/workbench/review-panel";
import { RunOverview } from "@/components/workbench/run-overview";
import { TopBar } from "@/components/workbench/top-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DEFAULT_BANNED_WORDS,
  DEFAULT_BRIEF,
  LANGUAGES,
  TONES,
} from "@/lib/constants";
import type { BriefInput, RunResult, WorkspaceStatus } from "@/lib/types";
import { downloadText } from "@/lib/utils";

export function Studio({ initialDifyConfigured }: { initialDifyConfigured: boolean }) {
  const [difyConfigured, setDifyConfigured] = useState(initialDifyConfigured);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [input, setInput] = useState<BriefInput>({
    brief: DEFAULT_BRIEF,
    tone: TONES[0],
    toneDetails: "",
    language: LANGUAGES[0],
    platforms: ["小红书", "朋友圈", "公众号"],
    bannedWords: DEFAULT_BANNED_WORDS,
    files: [],
  });
  const [status, setStatus] = useState<WorkspaceStatus>("idle");
  const [run, setRun] = useState<RunResult | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [feedback, setFeedback] = useState("");
  const [verifiedCorrections, setVerifiedCorrections] = useState("");
  const [toneChoice, setToneChoice] = useState("保持原 tone");
  const [trend, setTrend] = useState("不附加热点");
  const [error, setError] = useState("");

  const busy = status === "running" || status === "revising";
  const selectedDraft = useMemo(() => {
    if (!run) return null;
    return run.drafts.find((draft) => draft.platform === selectedPlatform) || run.drafts[0] || null;
  }, [run, selectedPlatform]);

  function patchInput(patch: Partial<BriefInput>) {
    setInput((current) => ({ ...current, ...patch }));
  }

  async function handleRun() {
    if (!input.brief.trim()) {
      setError("请先填写商家简报。");
      return;
    }
    if (input.platforms.length === 0) {
      setError("至少选择一个目标平台。");
      return;
    }

    setError("");
    setStatus("running");
    setRun(null);
    setSelectedPlatform("");
    setFeedback("");
    setVerifiedCorrections("");
    setToneChoice("保持原 tone");

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "运行失败，请稍后重试。");
      }
      const result = payload as RunResult;
      setRun(result);
      setSelectedPlatform(result.drafts[0]?.platform || "");
      setTrend(result.selectedTrend);
      setStatus("reviewing");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "运行失败，请稍后重试。");
      setStatus("error");
    }
  }

  async function handleRevise() {
    if (!run) return;
    if (!feedback.trim() && !verifiedCorrections.trim()) {
      setError("请填写修改意见，或补充已核实事实。");
      return;
    }

    setError("");
    setStatus("revising");
    try {
      const response = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drafts: run.drafts,
          feedback,
          verifiedCorrections,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "二轮改稿失败。");
      }
      setRun((current) =>
        current
          ? {
              ...current,
              drafts: payload.drafts,
              score: payload.score,
              stages: payload.stages,
              summary: payload.summary,
              status: "reviewing",
            }
          : current,
      );
      setStatus("reviewing");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "二轮改稿失败。");
      setStatus("reviewing");
    }
  }

  function handleApprove() {
    if (!run) return;
    const blocked = run.drafts.some((draft) =>
      draft.issues.some((issue) => issue.severity === "block"),
    );
    if (blocked) {
      setError("存在拦截项，当前稿不能通过。请先按反馈修订。");
      return;
    }
    setError("");
    setRun((current) => (current ? { ...current, status: "approved" } : current));
    setStatus("approved");
  }

  function handleReject() {
    if (!run) return;
    setRun((current) => (current ? { ...current, status: "rejected" } : current));
    setStatus("rejected");
  }

  function handleExport(format: "md" | "json") {
    if (!run) return;
    const exportedAt = new Date().toISOString();
    if (format === "json") {
      downloadText(
        `${run.id}.json`,
        JSON.stringify({ exportedAt, ...run }, null, 2),
        "application/json",
      );
      return;
    }

    const sections = run.drafts.map((draft) => {
      const body = draft.secondRound || draft.firstRound;
      return `## ${draft.platform}\n\n${body}`;
    });
    const document = [
      `# ${run.id}`,
      "",
      `生成时间：${run.startedAt}`,
      `状态：${status}`,
      `评分：${run.score}`,
      "",
      ...sections,
    ].join("\n\n");
    downloadText(`${run.id}.md`, document, "text/markdown");
  }

  return (
    <TooltipProvider delayDuration={180}>
      <div className="min-h-screen">
        <TopBar
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
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[336px_minmax(0,1fr)_356px]">
            <BriefPanel value={input} onChange={patchInput} onRun={handleRun} running={busy} />
            <div className="min-w-0 space-y-4">
              <RunOverview run={run} status={status} />
              <DraftWorkspace
                run={run}
                status={status}
                selectedPlatform={selectedPlatform}
                onSelectPlatform={setSelectedPlatform}
              />
            </div>
            <ReviewPanel
              run={run}
              draft={selectedDraft}
              status={status}
              feedback={feedback}
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
              busy={busy}
            />
          </div>
        </main>

        <DifySettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          onStatusChange={setDifyConfigured}
        />
      </div>
    </TooltipProvider>
  );
}
