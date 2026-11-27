"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Server,
  Settings2,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DifyStatus {
  configured: boolean;
  baseUrl: string;
  user: string;
  source: "none" | "file" | "env";
  keyMasked: string;
  revisionConfigured?: boolean;
  analysisConfigured?: boolean;
}

type Message = { type: "success" | "warning" | "error"; text: string } | null;

const emptyStatus: DifyStatus = {
  configured: false,
  baseUrl: "",
  user: "",
  source: "none",
  keyMasked: "",
};

export function DifySettingsDialog({
  open,
  onOpenChange,
  onStatusChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (configured: boolean, analysisConfigured: boolean) => void;
}) {
  const [status, setStatus] = useState<DifyStatus>(emptyStatus);
  const [baseUrl, setBaseUrl] = useState("https://api.dify.ai/v1");
  const [apiKey, setApiKey] = useState("");
  const [revisionApiKey, setRevisionApiKey] = useState("");
  const [analysisApiKey, setAnalysisApiKey] = useState("");
  const [user, setUser] = useState("content-studio");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!open) return;
    setMessage(null);
    setLoading(true);
    fetch("/api/settings")
      .then((response) => response.json())
      .then((payload: DifyStatus) => {
        setStatus(payload);
        setBaseUrl(payload.baseUrl || "https://api.dify.ai/v1");
        setUser(payload.user || "content-studio");
        setApiKey("");
        setRevisionApiKey("");
        setAnalysisApiKey("");
      })
      .catch(() => {
        setMessage({ type: "error", text: "读取当前配置失败。" });
      })
      .finally(() => setLoading(false));
  }, [open]);

  async function request(action: "test" | "save") {
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          revisionApiKey,
          analysisApiKey,
          user,
          testOnly: action === "test",
        }),
      });
      const payload = await response.json();
      if (!response.ok && action === "test") {
        setMessage({ type: "error", text: payload.message || payload.error || "连接失败。" });
        return;
      }
      if (!response.ok) {
        setMessage({ type: "error", text: payload.error || "保存配置失败。" });
        return;
      }
      setStatus(payload.status);
      setApiKey("");
      setRevisionApiKey("");
      setAnalysisApiKey("");
      onStatusChange(
        Boolean(payload.status.configured),
        Boolean(payload.status.analysisConfigured),
      );
      if (action === "test") {
        setMessage({ type: "success", text: payload.message });
      } else {
        setMessage({
          type: payload.tested ? "success" : "warning",
          text: payload.message,
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "请求失败。",
      });
    } finally {
      setLoading(false);
    }
  }

  async function clearConfig() {
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch("/api/settings", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "清除配置失败。");
      }
      setStatus(payload.status);
      setBaseUrl(payload.status.baseUrl || "https://api.dify.ai/v1");
      setUser(payload.status.user || "content-studio");
      setApiKey("");
      setAnalysisApiKey("");
      onStatusChange(
        Boolean(payload.status.configured),
        Boolean(payload.status.analysisConfigured),
      );
      setMessage({
        type: payload.status.configured ? "warning" : "success",
        text: payload.status.configured
          ? "页面配置已清除，当前仍使用环境变量中的 Dify 连接。"
          : "页面配置已清除。",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "清除配置失败。",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Dify 连接设置
          </DialogTitle>
          <DialogDescription>
            保存后运行请求会走真实 Dify 工作流。API Key 只保存在服务端，不会返回浏览器。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/25 px-2.5 py-2">
          <Badge variant={status.configured ? "success" : "warning"}>
            {status.configured ? "已配置" : "未配置"}
          </Badge>
          {status.source !== "none" ? (
            <Badge variant="outline">
              {status.source === "env" ? "环境变量" : "页面配置"}
            </Badge>
          ) : null}
          {status.keyMasked ? (
            <span className="ml-auto text-[10px] text-muted-foreground">{status.keyMasked}</span>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="dify-base-url" className="flex items-center gap-1.5 text-xs font-medium">
              <Server className="h-3.5 w-3.5 text-muted-foreground" />
              Base URL
            </label>
            <Input
              id="dify-base-url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://api.dify.ai/v1"
              className="text-xs"
              autoComplete="url"
            />
            <p className="text-[10px] leading-4 text-muted-foreground">
              云端通常是 https://api.dify.ai/v1；自部署通常是 http://你的地址/v1。
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="dify-api-key" className="flex items-center gap-1.5 text-xs font-medium">
              <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
              首轮工作流 API Key
            </label>
            <div className="relative">
              <Input
                id="dify-api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={status.keyMasked ? "留空不修改" : "app-..."}
                className="pr-9 text-xs"
                autoComplete="off"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey((current) => !current)}
                aria-label={showKey ? "隐藏 API Key" : "显示 API Key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="revision-key" className="text-xs font-medium">改稿工作流 API Key</label>
            <Input id="revision-key" type="password" value={revisionApiKey} onChange={event => setRevisionApiKey(event.target.value)} placeholder={status.revisionConfigured ? "留空不修改" : "app-..."} autoComplete="off" />
            <p className="text-[10px] text-muted-foreground">两个工作流分别发布，分别填写密钥。测试连接仅检测首轮。</p>
            <label htmlFor="analysis-key" className="text-xs font-medium">账号评估工作流 API Key</label>
            <Input id="analysis-key" type="password" value={analysisApiKey} onChange={event => setAnalysisApiKey(event.target.value)} placeholder={status.analysisConfigured ? "留空不修改" : "app-..."} autoComplete="off" />
            <p className="text-[10px] text-muted-foreground">账号评估与生成流程独立，每次评估会消耗 SocialToAI 积分。</p>
            <label htmlFor="dify-user" className="text-xs font-medium">
              User 标识
            </label>
            <Input
              id="dify-user"
              value={user}
              onChange={(event) => setUser(event.target.value)}
              placeholder="user"
              className="text-xs"
              autoComplete="off"
            />
          </div>
        </div>

        {message ? (
          <div
            className={cn(
              "flex items-start gap-2 rounded-md border px-2.5 py-2 text-[11px] leading-4",
              message.type === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
              message.type === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
              message.type === "error" && "border-red-200 bg-red-50 text-red-800",
            )}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span className="min-w-0">{message.text}</span>
          </div>
        ) : null}

        <DialogFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearConfig}
            disabled={loading || status.source !== "file"}
            className="text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清除页面配置
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => request("test")} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              测试连接
            </Button>
            <Button type="button" onClick={() => request("save")} disabled={loading}>
              保存配置
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
