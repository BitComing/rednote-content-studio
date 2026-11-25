"use client";

import { useState } from "react";
import { FileText, Loader2, Paperclip, Play, Plus, ShieldCheck, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
    <Card className="h-fit min-w-0 xl:sticky xl:top-[72px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            输入简报
          </CardTitle>
          <Badge variant="outline">必填 2 项</Badge>
        </div>
      </CardHeader>
      <CardContent className="max-h-none space-y-4 overflow-visible pr-3 xl:max-h-[calc(100vh-190px)] xl:overflow-y-auto xl:scrollbar-thin">
        <div className="space-y-1.5">
          <label className="block space-y-1 text-xs">商家资料编号（可选）<Input value={value.merchantId || ""} onChange={e => onChange({ merchantId: e.target.value })} placeholder="匹配本地已核实商家知识库" /></label>
          <label htmlFor="brief" className="text-xs font-medium">
            商家简报与已核实事实
          </label>
          <Textarea
            id="brief"
            value={value.brief}
            onChange={(event) => onChange({ brief: event.target.value })}
            className="min-h-[148px] resize-y"
            placeholder="写清楚商家、产品、已核实事实和不能说的话"
          />
          <p className="text-[11px] leading-4 text-muted-foreground">
            只写有依据的信息。价格、时间、地址请放在已核实事实里。
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">参考文件</span>
            <span className="text-[11px] text-muted-foreground">
              {uploading ? "上传中" : `${value.files.length}/10`}
            </span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60">
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
                  setUploadError(error instanceof Error ? error.message : "文件上传失败。");
                } finally {
                  setUploading(false);
                  input.value = "";
                }
              }}
            />
          </label>
          {uploadError ? (
            <div className="text-[11px] leading-4 text-red-700">{uploadError}</div>
          ) : null}
          <p className="text-[10px] text-muted-foreground">当前仅提取文档文字。图片不会自动识别，请将关键事实写入简报。</p>
          {value.files.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {value.files.map((file) => (
                <span
                  key={file.id}
                  className="inline-flex max-w-full items-center gap-1 rounded-md border bg-card px-2 py-1 text-[11px]"
                >
                  <span className="max-w-[160px] truncate">{file.name}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      onChange({ files: value.files.filter((item) => item.id !== file.id) })
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="tone" className="text-xs font-medium">
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
          <div className="space-y-1.5">
            <label htmlFor="language" className="text-xs font-medium">
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

        <div className="space-y-1.5">
          <span className="text-xs font-medium">目标平台</span>
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
              placeholder="输入平台后回车"
              className="h-8 text-xs"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={addPlatform}
              aria-label="添加平台"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {value.platforms.map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-medium"
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

        <div className="space-y-1.5">
          <label htmlFor="tone-details" className="text-xs font-medium">
            补充语气要求
          </label>
          <Input
            id="tone-details"
            value={value.toneDetails}
            onChange={(event) => onChange({ toneDetails: event.target.value })}
            placeholder="例如：少用感叹号，像学生之间的推荐"
            className="text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="banned" className="text-xs font-medium">
            禁用词
          </label>
          <Textarea
            id="banned"
            value={value.bannedWords}
            onChange={(event) => onChange({ bannedWords: event.target.value })}
            className="min-h-[58px] resize-y text-xs"
            placeholder="逗号或换行分隔"
          />
        </div>

        <TrendPicker value={value.selectedTrend || "不附加热点"} onChange={(selectedTrend, trendJson) => onChange({ selectedTrend, trendJson })} />
        <Separator />
        <Button className="w-full" onClick={onRun} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "正在生成" : "运行工作流"}
        </Button>
        <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-2.5 py-2 text-[11px] leading-4 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>所有结果发布前都需要人工确认；拦截项不会自动放行。</span>
        </div>
      </CardContent>
    </Card>
  );
}
