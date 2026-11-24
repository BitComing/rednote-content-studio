"use client";

import { Download, Loader2, PenLine, Play, Settings2, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RunMode, WorkspaceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusLabel: Record<WorkspaceStatus, string> = {
  idle: "待运行",
  running: "运行中",
  reviewing: "待审核",
  revising: "改稿中",
  approved: "已通过",
  rejected: "已归档",
  error: "运行失败",
};

const statusVariant: Record<WorkspaceStatus, "outline" | "info" | "warning" | "success" | "destructive"> = {
  idle: "outline",
  running: "info",
  reviewing: "warning",
  revising: "info",
  approved: "success",
  rejected: "destructive",
  error: "destructive",
};

export function TopBar({
  status,
  mode,
  difyConfigured,
  running,
  canExport,
  onRun,
  onExport,
  onOpenSettings,
}: {
  status: WorkspaceStatus;
  mode: RunMode | null;
  difyConfigured: boolean;
  running: boolean;
  canExport: boolean;
  onRun: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <PenLine className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-5">校园商家内容工作台</div>
            <div className="hidden truncate text-[11px] leading-4 text-muted-foreground sm:block">
              Rednote Content Studio
            </div>
          </div>
        </div>

        <div className="ml-2 hidden items-center gap-1.5 md:flex">
          <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
          {mode ? (
            <Badge variant={mode === "dify" ? "info" : "outline"}>
              {mode === "dify" ? "Dify API" : "演示模式"}
            </Badge>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenSettings}
                className="hidden h-8 items-center gap-1.5 rounded-md border bg-card px-2 text-[11px] text-muted-foreground transition-colors hover:bg-muted/60 sm:flex"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    difyConfigured ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
                {difyConfigured ? "Dify 已配置" : "未配置 Dify"}
                <Settings2 className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {difyConfigured
                ? "服务端已保存 Dify 连接配置，点击可修改"
                : "点击配置 Dify Base URL 和 API Key"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                aria-label="Dify 连接设置"
                className="sm:hidden"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Dify 连接设置</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onExport}
                disabled={!canExport}
                aria-label="导出结果"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>导出当前结果</TooltipContent>
          </Tooltip>

          <Button
            onClick={onRun}
            disabled={running}
            className="min-w-[76px]"
            aria-label={running ? "运行中" : "运行"}
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{running ? "运行中" : "运行"}</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t px-3 py-1.5 text-[11px] text-muted-foreground md:hidden">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>发布前需人工确认</span>
        <Badge variant={statusVariant[status]} className="ml-auto">
          {statusLabel[status]}
        </Badge>
      </div>
    </header>
  );
}
