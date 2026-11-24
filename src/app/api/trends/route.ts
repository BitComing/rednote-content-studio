import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { TrendOption } from "@/lib/types";

export const runtime = "nodejs";

const TREND_API_URL = process.env.TREND_API_URL || "https://60s.viki.moe/v2/weibo";
const CACHE_PATH = path.join(process.cwd(), ".data", "trends-cache.json");
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

type TrendCache = {
  options: TrendOption[];
  fetchedAt: string;
};

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[{}]/g, "")
    .trim()
    .slice(0, 100);
}

async function readCache(): Promise<TrendCache | null> {
  try {
    const parsed = JSON.parse(await fs.readFile(CACHE_PATH, "utf-8")) as TrendCache;
    if (!Array.isArray(parsed.options) || !parsed.fetchedAt) return null;
    if (Date.now() - new Date(parsed.fetchedAt).getTime() > CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(cache: TrendCache) {
  try {
    await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
    await fs.writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf-8");
  } catch {
    // Cache is optional; the network result still serves the request.
  }
}

function parseOptions(payload: { code?: number | string; data?: unknown }): TrendOption[] {
  if (payload.code !== undefined && ![0, 200, "200", "0"].includes(payload.code)) {
    throw new Error("热点接口返回失败状态");
  }

  let rows = payload.data;
  if (rows && typeof rows === "object" && !Array.isArray(rows)) {
    const record = rows as Record<string, unknown>;
    rows = record.list ?? record.items ?? record.data ?? [];
  }
  if (!Array.isArray(rows)) throw new Error("热点服务返回格式不匹配");

  const seen = new Set<string>();
  const options: TrendOption[] = [];
  for (const row of rows) {
    const record = (row ?? {}) as Record<string, unknown>;
    const label = cleanText(record.title ?? record.name ?? record.word ?? record.query);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    const heatValue = record.hot ?? record.heat ?? record.hot_value ?? record.score;
    options.push({
      label,
      heat: heatValue === undefined || heatValue === null ? "" : String(heatValue),
    });
    if (options.length >= 10) break;
  }
  return options;
}

export async function GET() {
  try {
    const cached = await readCache();
    if (cached) {
      return NextResponse.json({
        topics: cached.options.map((option) => option.label),
        options: cached.options,
        fetchedAt: cached.fetchedAt,
        source: "微博热榜 · 第三方 API",
        warning: "仅作选题背景，不是小红书官方热榜或商家事实依据",
      });
    }

    const response = await fetch(TREND_API_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`热点服务 HTTP ${response.status}`);
    const options = parseOptions(
      (await response.json()) as { code?: number | string; data?: unknown },
    );
    const fetchedAt = new Date().toISOString();
    if (options.length > 0) await writeCache({ options, fetchedAt });

    return NextResponse.json({
      topics: options.map((option) => option.label),
      options,
      fetchedAt,
      source: "微博热榜 · 第三方 API",
      warning: "仅作选题背景，不是小红书官方热榜或商家事实依据",
    });
  } catch (error) {
    return NextResponse.json({
      topics: [],
      options: [],
      warning: `热点暂不可用，可不附加热点继续。${error instanceof Error ? error.message : ""}`,
    });
  }
}
