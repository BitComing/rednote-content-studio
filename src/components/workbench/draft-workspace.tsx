"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  Columns2,
  FileText,
  Loader2,
  MessageSquareText,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PlatformDraft, RunResult, WorkspaceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type ViewMode = "first" | "second" | "compare";

function DraftContent({ children }: { children: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="draft-body max-h-[430px] overflow-y-auto pr-2 text-foreground/90 scrollbar-thin">
        {children}
      </div>
    </div>
  );
}

function EmptyDraft({ label }: { label: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/20 p-6 text-center">
      <RotateCcw className="h-5 w-5 text-muted-foreground/60" />
      <div className="text-xs font-medium">{label}</div>
      <div className="text-[11px] text-muted-foreground">先在右侧提交修改意见</div>
    </div>
  );
}

function DraftPanel({
  draft,
  status,
}: {
  draft: PlatformDraft;
  status: WorkspaceStatus;
}) {
  const [view, setView] = useState<ViewMode>(draft.secondRound ? "second" : "first");
  const [copied, setCopied] = useState(false);
  const hasSecond = Boolean(draft.secondRound);
  const issues = draft.issues.length;

  async function copyCurrent() {
    const text =
      view === "second" && draft.secondRound
        ? draft.secondRound
        : draft.firstRound;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{draft.platform}</h3>
          <Badge variant={draft.status === "pass" ? "success" : "warning"}>
            {status === "approved"
              ? "已通过"
              : status === "rejected"
                ? "已归档"
                : draft.status === "pass"
                  ? "可审核"
                  : "需修订"}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {draft.wordCount} 字
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="inline-flex rounded-md bg-secondary p-0.5">
            {[
              { value: "first" as const, label: "首轮" },
              { value: "second" as const, label: "当前版本" },
              { value: "compare" as const, label: "对比" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={item.value !== "first" && !hasSecond}
                onClick={() => setView(item.value)}
                className={cn(
                  "rounded-sm px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-35",
                  view === item.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={copyCurrent}
                aria-label="复制当前稿"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>复制当前稿</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {view === "first" ? <DraftContent>{draft.firstRound}</DraftContent> : null}
      {view === "second" ? (
        draft.secondRound ? (
          <DraftContent>{draft.secondRound}</DraftContent>
        ) : (
              <EmptyDraft label="修改稿尚未生成" />
        )
      ) : null}
      {view === "compare" ? (
        draft.secondRound ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <MessageSquareText className="h-3.5 w-3.5" /> 首轮
              </div>
              <DraftContent>{draft.firstRound}</DraftContent>
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                <Columns2 className="h-3.5 w-3.5" /> 当前版本
              </div>
              <DraftContent>{draft.secondRound}</DraftContent>
            </div>
          </div>
        ) : (
          <EmptyDraft label="生成二轮稿后可对比" />
        )
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3">
        <div className="flex min-w-[130px] flex-1 items-center gap-2">
          <span className="text-[11px] text-muted-foreground">AI 评分</span>
          <Progress
            value={draft.score}
            className="max-w-[120px]"
            indicatorClassName={draft.score >= 90 ? "bg-emerald-600" : undefined}
          />
          <span className="text-xs font-semibold">{draft.score >= 0 ? draft.score : "—"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {issues > 0 ? (
            <Badge variant="warning">{issues} 条建议</Badge>
          ) : (
            <Badge variant="success">无拦截项</Badge>
          )}
          <span className="text-[11px] text-muted-foreground">
            {draft.claims.length} 条事实引用
          </span>
        </div>
      </div>
    </div>
  );
}

export function DraftWorkspace({
  run,
  status,
  selectedPlatform,
  onSelectPlatform,
}: {
  run: RunResult | null;
  status: WorkspaceStatus;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
}) {
  const active = useMemo(
    () => selectedPlatform || run?.drafts[0]?.platform || "",
    [run, selectedPlatform],
  );

  if (status === "running") {
    return (
      <Card>
        <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-sm font-medium">正在生成多平台稿件</div>
          <div className="text-[11px] text-muted-foreground">
            正在执行首轮生成与安全检查
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!run || run.drafts.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-sm font-medium">还没有生成稿</div>
          <div className="max-w-sm text-center text-[11px] leading-5 text-muted-foreground">
            填写左侧简报后运行，首轮内容、评分和事实引用会出现在这里。
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            平台稿件
          </CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {run.drafts.length} 个平台
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={onSelectPlatform}>
          <TabsList className="h-auto max-w-full flex-wrap justify-start bg-transparent p-0">
            {run.drafts.map((draft) => (
              <TabsTrigger
                key={draft.platform}
                value={draft.platform}
                className="gap-1.5 border border-transparent data-[state=active]:border-border"
              >
                {draft.platform}
                {draft.issues.length > 0 ? (
                  <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-700">
                    {draft.issues.length}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {run.drafts.map((draft) => (
            <TabsContent key={draft.platform} value={draft.platform}>
              <DraftPanel
                key={`${draft.platform}-${draft.secondRound ? "second" : "first"}`}
                draft={draft}
                status={status}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
