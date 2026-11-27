"use client";

import { useState } from "react";
import {
  FileText,
  Loader2,
  Paperclip,
  Play,
  Plus,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES, shortToneLabel, TONES } from "@/lib/constants";
import type { BriefInput, UploadedFile } from "@/lib/types";
import { TrendPicker } from "./trend-picker";

export function BriefPanel({
  value,
  onChange,
  onRun,
  running,
}: {
  value: BriefInput;
  onChange: (patch: Partial<BriefInput>) => void;
  onRun: () => void;
  running: boolean;
}) {
  const [platformInput, setPlatformInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function addPlatform() {
    const next = platformInput.trim().replace(/[，,;；]$/, "");
    if (!next || value.platforms.length >= 10) return;
    if (!value.platforms.some((platform) => platform.toLowerCase() === next.toLowerCase())) {
      onChange({ platforms: [...value.platforms, next] });
    }
    setPlatformInput("");
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            输入简报
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            必填 2 项
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-5">
        <div className="space-y-2">
          <label
            htmlFor="brief"
            className="flex items-center gap-1 text-[13px] font-medium"
          >
            产品简介
            <span className="text-red-600" aria-hidden>
              *
            </span>
          </label>
          <Textarea
            id="brief"
            value={value.brief}
            onChange={(event) => onChange({ brief: event.target.value })}
            className="min-h-[190px] resize-y text-sm leading-6"
            placeholder="产品、卖点、禁用说法"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
          <div className="space-y-2">
            <span className="flex h-5 items-center gap-1 text-[13px] font-medium">
              目标平台
              <span className="text-red-600" aria-hidden>
                *
              </span>
            </span>
            <div className="flex gap-1.5">
              <Input
                value={platformInput}
                onChange={(event) => setPlatformInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addPlatform();
                  }
                }}
                placeholder="平台名称"
                className="text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={addPlatform}
                aria-label="添加平台"
                className="h-9 w-9 shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {value.platforms.map((platform) => (
                <span
                  key={platform}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
                >
                  {platform}
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      onChange({
                        platforms: value.platforms.filter((item) => item !== platform),
                      })
                    }
                    aria-label={`移除 ${platform}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="tone"
              className="flex h-5 items-center text-[13px] font-medium"
            >
              文案语气
            </label>
            <Select
              id="tone"
              value={value.tone}
              onChange={(event) => onChange({ tone: event.target.value })}
            >
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {shortToneLabel(tone)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="language"
              className="flex h-5 items-center text-[13px] font-medium"
            >
              语言
            </label>
            <Select
              id="language"
              value={value.language}
              onChange={(event) => onChange({ language: event.target.value })}
            >
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 border-t pt-4 sm:flex-row sm:items-center">
          <Button className="sm:w-56" onClick={onRun} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {running ? "正在生成" : "运行工作流"}
          </Button>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            发布前需人工确认
          </span>
        </div>

        <details className="rounded-md border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-[13px] font-medium">
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              更多设置
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              参考文件 · 补充语气 · 禁用词 · 热点
            </span>
          </summary>
          <div className="space-y-4 border-t p-3 sm:p-4">
            <div className="space-y-2">
              <label
                htmlFor="merchant-id"
                className="flex h-5 items-center text-[13px] font-medium"
              >
                商家资料编号（可选）
              </label>
              <Input
                id="merchant-id"
                value={value.merchantId || ""}
                onChange={(event) => onChange({ merchantId: event.target.value })}
                placeholder="商家编号"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex h-5 items-center justify-between">
                <span className="text-[13px] font-medium">参考文件</span>
                <span className="text-xs text-muted-foreground">
                  {uploading ? "上传中" : `${value.files.length}/10`}
                </span>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                {uploading ? "正在上传" : "添加图片或文档"}
                <input
                  type="file"
                  className="sr-only"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                  onChange={async (event) => {
                    const input = event.currentTarget;
                    const selected = Array.from(input.files || []);
                    if (selected.length === 0) return;
                    setUploading(true);
                    setUploadError("");
                    try {
                      const uploaded = await Promise.all(
                        selected.map(async (file) => {
                          const body = new FormData();
                          body.append("file", file);
                          const response = await fetch("/api/upload", {
                            method: "POST",
                            body,
                          });
                          const payload = await response.json();
                          if (!response.ok) {
                            throw new Error(payload.error || `上传失败：${file.name}`);
                          }
                          return payload as UploadedFile;
                        }),
                      );
                      onChange({ files: [...value.files, ...uploaded].slice(0, 10) });
                    } catch (error) {
                      setUploadError(
                        error instanceof Error ? error.message : "文件上传失败。",
                      );
                    } finally {
                      setUploading(false);
                      input.value = "";
                    }
                  }}
                />
              </label>
              {uploadError ? (
                <div className="text-xs text-red-700">{uploadError}</div>
              ) : null}
              {value.files.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {value.files.map((file) => (
                    <span
                      key={file.id}
                      className="inline-flex max-w-full items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs"
                    >
                      <span className="max-w-[160px] truncate">{file.name}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          onChange({
                            files: value.files.filter((item) => item.id !== file.id),
                          })
                        }
                        aria-label={`移除 ${file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tone-details"
                className="flex h-5 items-center text-[13px] font-medium"
              >
                补充语气要求
              </label>
              <Input
                id="tone-details"
                value={value.toneDetails}
                onChange={(event) => onChange({ toneDetails: event.target.value })}
                placeholder="如：少用感叹号"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="banned"
                className="flex h-5 items-center text-[13px] font-medium"
              >
                禁用词
              </label>
              <Textarea
                id="banned"
                value={value.bannedWords}
                onChange={(event) => onChange({ bannedWords: event.target.value })}
                className="min-h-[64px] resize-y text-sm leading-6"
                placeholder="如：保过、第一"
              />
            </div>

            <TrendPicker
              value={value.selectedTrend || "不附加热点"}
              onChange={(selectedTrend, trendJson) =>
                onChange({ selectedTrend, trendJson })
              }
            />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
