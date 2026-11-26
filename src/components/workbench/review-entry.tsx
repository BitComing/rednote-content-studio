"use client";

import { ArrowRight, Clock3, Loader2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { PlatformDraft, RunResult } from "@/lib/types";

export function ReviewEntry({
  run,
  draft,
  running,
  onOpen,
}: {
  run: RunResult | null;
  draft: PlatformDraft | null;
  running: boolean;
  onOpen: () => void;
}) {
  const issues = draft?.issues ?? [];
  const blocks = issues.filter((issue) => issue.severity === "block").length;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">审核入口</span>
              <Badge
                variant={running ? "info" : run ? "warning" : "outline"}
                className="text-xs"
              >
                {running ? "运行中" : run ? "待确认" : "等待运行"}
              </Badge>
              {run ? (
                <span className="truncate text-xs text-muted-foreground">
                  {run.id.slice(0, 8)} · {draft?.platform || "未选择平台"}
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Clock3 className="h-3.5 w-3.5" />
              )}
              {running ? "生成中" : "等待人工审核与最终打分"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="warning" className="text-xs">
            {issues.length} 条建议
          </Badge>
          {blocks > 0 ? (
            <Badge variant="destructive" className="text-xs">
              {blocks} 条拦截
            </Badge>
          ) : null}
          <Badge variant="outline" className="text-xs">
            {draft?.claims.length ?? 0} 条事实引用
          </Badge>
        </div>
        <Button className="ml-auto" onClick={onOpen} disabled={!run || running}>
          进入人工审核
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
