"use client";

import { useState } from "react";
import { FileText, Loader2, Paperclip, Plus, Settings2, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES, shortToneLabel, TONES } from "@/lib/constants";
import type { BriefInput } from "@/lib/types";
import { uploadFiles } from "@/lib/upload-client";
import { TrendPicker } from "@/components/workbench/trend-picker";

const PRESET_PLATFORMS = ["小红书", "微信公众号", "抖音"];

export function MobileBrief({
  value,
  onChange,
}: {
  value: BriefInput;
  onChange: (patch: Partial<BriefInput>) => void;
}) {
  const [platformInput, setPlatformInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function addPlatform(name: string) {
    const next = name.trim().replace(/[，,;；]$/, "");
    if (!next || value.platforms.length >= 10) return;
    if (!value.platforms.some((platform) => platform.toLowerCase() === next.toLowerCase())) {
      onChange({ platforms: [...value.platforms, next] });
    }
    setPlatformInput("");
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-4 p-3.5">
          <div className="space-y-1.5">
            <label htmlFor="m-brief" className="flex items-center gap-1 text-[13px] font-medium">
              <FileText className="h-3.5 w-3.5 text-primary" />
              产品简介
              <span className="text-red-600" aria-hidden>
                *
              </span>
            </label>
            <Textarea
              id="m-brief"
              value={value.brief}
              onChange={(event) => onChange({ brief: event.target.value })}
              className="min-h-[180px] resize-y text-base leading-7"
              placeholder="请输入产品简介"
            />
          </div>

          <div className="space-y-2">
            <span className="flex items-center gap-1 text-[13px] font-medium">
              目标平台
              <span className="text-red-600" aria-hidden>
                *
              </span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {value.platforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() =>
                    onChange({ platforms: value.platforms.filter((item) => item !== platform) })
                  }
                  className="inline-flex min-h-8 items-center gap-1 rounded-full bg-secondary px-3 text-[13px] font-medium"
                >
                  {platform}
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
              {PRESET_PLATFORMS.filter((preset) => !value.platforms.includes(preset)).map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addPlatform(preset)}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-dashed px-3 text-[13px] text-muted-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {preset}
                  </button>
                ),
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={platformInput}
                onChange={(event) => setPlatformInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addPlatform(platformInput);
                  }
                }}
                placeholder="平台名称"
                className="h-10 text-base"
              />
              <button
                type="button"
                onClick={() => addPlatform(platformInput)}
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md border bg-card px-3 text-[13px]"
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label htmlFor="m-tone" className="text-[13px] font-medium">
                文案语气
              </label>
              <Select
                id="m-tone"
                value={value.tone}
                onChange={(event) => onChange({ tone: event.target.value })}
                className="h-10 text-base"
              >
                {TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {shortToneLabel(tone)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="m-language" className="text-[13px] font-medium">
                语言
              </label>
              <Select
                id="m-language"
                value={value.language}
                onChange={(event) => onChange({ language: event.target.value })}
                className="h-10 text-base"
              >
                {LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <details className="rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-[13px] font-medium">
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            更多设置
          </span>
        </summary>
        <div className="space-y-4 border-t p-3.5">
          <div className="space-y-1.5">
            <label htmlFor="m-merchant" className="text-[13px] font-medium">
              商家资料编号（可选）
            </label>
            <Input
              id="m-merchant"
              value={value.merchantId || ""}
              onChange={(event) => onChange({ merchantId: event.target.value })}
              placeholder="商家编号"
              className="h-10 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">参考文件</span>
              <span className="text-[11px] text-muted-foreground">
                {uploading ? "上传中" : `${value.files.length}/10`}
              </span>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed bg-muted/30 px-3 text-[13px] text-muted-foreground">
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
                  const target = event.currentTarget;
                  const selected = Array.from(target.files || []);
                  if (selected.length === 0) return;
                  setUploading(true);
                  setUploadError("");
                  try {
                    const uploaded = await uploadFiles(selected);
                    onChange({ files: [...value.files, ...uploaded].slice(0, 10) });
                  } catch (error) {
                    setUploadError(error instanceof Error ? error.message : "文件上传失败。");
                  } finally {
                    setUploading(false);
                    target.value = "";
                  }
                }}
              />
            </label>
            {uploadError ? <div className="text-[11px] text-red-700">{uploadError}</div> : null}
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
                      onClick={() =>
                        onChange({ files: value.files.filter((item) => item.id !== file.id) })
                      }
                      aria-label={`移除 ${file.name}`}
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="m-tone-details" className="text-[13px] font-medium">
              补充语气要求
            </label>
            <Input
              id="m-tone-details"
              value={value.toneDetails}
              onChange={(event) => onChange({ toneDetails: event.target.value })}
              placeholder="如：少用感叹号"
              className="h-10 text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="m-banned" className="text-[13px] font-medium">
              禁用词
            </label>
            <Textarea
              id="m-banned"
              value={value.bannedWords}
              onChange={(event) => onChange({ bannedWords: event.target.value })}
              className="min-h-[72px] resize-y text-base leading-6"
              placeholder="如：保过、第一"
            />
          </div>

          <TrendPicker
            value={value.selectedTrend || "不附加热点"}
            onChange={(selectedTrend, trendJson) => onChange({ selectedTrend, trendJson })}
          />
        </div>
      </details>
    </div>
  );
}
