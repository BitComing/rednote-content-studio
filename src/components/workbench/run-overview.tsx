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

const PLACEHOLDER_STAGES: RunStage[] = [
  "解析平台",
  "获取热点",
  "首轮生成",
  "AI 评审",
  "人工审核",
  "二轮改稿",
  "复评",
  "输出",
].map((label, index) => ({
  id: `placeholder-${index}`,
  label,
  detail: "",
  status: "pending" as const,
}));

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
  if (status === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
  if (status === "blocked") return <XCircle className="h-3.5 w-3.5 text-red-600" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />;
}

export function RunOverview({ run, status }: { run: RunResult | null; status: string }) {
  const stages = run?.stages.length ? run.stages : PLACEHOLDER_STAGES;

  return (
    <Card>
      <CardHeader className="pb-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            运行概览
          </CardTitle>
          {run ? (
            <>
              <Badge variant="outline">{run.id}</Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDateTime(run.startedAt)}
              </span>
              <Badge variant={run.mode === "dify" ? "info" : "secondary"} className="ml-auto">
                {run.mode === "dify" ? "Dify API" : "演示数据"}
              </Badge>
            </>
          ) : (
            <Badge variant="outline" className="ml-auto">
              {status === "running" ? "运行中" : "等待运行"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[11px]">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden className="h-px w-3 bg-border" /> : null}
              <span
                title={stage.detail || undefined}
                className={cn(
                  "flex items-center gap-1",
                  stage.status === "pending" && "text-muted-foreground/60",
                  stage.status === "running" && "font-medium text-foreground",
                )}
              >
                <StageIcon status={stage.status} />
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
