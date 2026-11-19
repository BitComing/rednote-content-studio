"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunResult, RunStage, StageStatus } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
  if (status === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
  if (status === "blocked") return <XCircle className="h-3.5 w-3.5 text-red-600" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />;
}

function StageItem({ stage }: { stage: RunStage }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-md border bg-card px-2.5 py-2",
        stage.status === "running" && "border-primary/30 bg-primary/[0.03]",
      )}
    >
      <StageIcon status={stage.status} />
      <div className="min-w-0">
        <div className="truncate text-[11px] font-medium leading-4">{stage.label}</div>
        <div className="truncate text-[11px] leading-4 text-muted-foreground">{stage.detail}</div>
      </div>
    </div>
  );
}

export function RunOverview({ run, status }: { run: RunResult | null; status: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            运行概览
          </CardTitle>
          {run ? (
            <>
              <Badge variant="outline">{run.id}</Badge>
              <Badge variant={run.mode === "dify" ? "info" : "secondary"}>
                {run.mode === "dify" ? "Dify API" : "演示数据"}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDateTime(run.startedAt)}
              </span>
            </>
          ) : (
            <Badge variant="outline">{status === "running" ? "运行中" : "等待运行"}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {run ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {run.stages.map((stage) => (
              <StageItem key={stage.id} stage={stage} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["解析平台", "获取热点", "首轮生成", "AI 评审", "人工审核", "二轮改稿", "复评", "输出"].map(
              (label) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-md border border-dashed px-2.5 py-2 text-[11px] text-muted-foreground"
                >
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                  {label}
                </div>
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
