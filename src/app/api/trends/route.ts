import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { TrendOption } from "@/lib/types";

export const runtime = "nodejs";

const BAIDU_API_URL = "https://top.baidu.com/api/board?platform=wise&tab=realtime";
const ZHIHU_API_URL = "https://api.zhihu.com/topstory/hot-list?limit=30";
const TREND_API_URL = process.env.TREND_API_URL || BAIDU_API_URL;
const TREND_FALLBACK_API_URL = process.env.TREND_FALLBACK_API_URL ?? ZHIHU_API_URL;
const CACHE_PATH = path.join(process.cwd(), ".data", "trends-cache.json");
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

type TrendProvider = "baidu" | "zhihu" | "legacy";

type TrendCache = {
  options: TrendOption[];
  fetchedAt: string;
  source?: string;
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

function parseZhihuOptions(rows: unknown[]): TrendOption[] {
  const seen = new Set<string>();
  const options: TrendOption[] = [];
  for (const row of rows) {
    const card = (row ?? {}) as Record<string, unknown>;
    const target = (card.target ?? {}) as Record<string, unknown>;
    const label = cleanText(target.title ?? target.name);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    const rawUrl = String(target.url ?? "");
    const id = cleanText(target.id);
    const url = rawUrl
      ? rawUrl.replace("https://api.zhihu.com/questions/", "https://www.zhihu.com/question/")
      : id
        ? `https://www.zhihu.com/question/${id}`
        : "";
    options.push({
      label,
      title: label,
      url,
      heat: cleanText(card.detail_text ?? target.heat ?? ""),
    });
    if (options.length >= 10) break;
  }
  return options;
}

function collectBaiduRows(value: unknown, rows: Record<string, unknown>[] = []) {
  if (!value || typeof value !== "object") return rows;
  if (Array.isArray(value)) {
    for (const item of value) collectBaiduRows(item, rows);
    return rows;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.word === "string" && record.word.trim()) rows.push(record);
  for (const child of Object.values(record)) {
    if (child && typeof child === "object") collectBaiduRows(child, rows);
  }
  return rows;
}

function parseBaiduOptions(payload: {
  success?: boolean;
  data?: unknown;
}): TrendOption[] {
  if (payload.success === false) throw new Error("百度热榜返回失败状态");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const seen = new Set<string>();
  const options: TrendOption[] = [];
  for (const row of collectBaiduRows(data.cards)) {
    const label = cleanText(row.word);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    options.push({
      label,
      title: label,
      url: String(row.url ?? ""),
      heat: cleanText(row.newHotName),
    });
    if (options.length >= 10) break;
  }
  return options;
}

function parseOptions(
  payload: { code?: number | string; data?: unknown; success?: boolean },
  provider: TrendProvider,
): TrendOption[] {
  if (provider === "baidu") return parseBaiduOptions(payload);

  if (payload.code !== undefined && ![0, 200, "200", "0"].includes(payload.code)) {
    throw new Error("热点接口返回失败状态");
  }

  let rows = payload.data;
  if (rows && typeof rows === "object" && !Array.isArray(rows)) {
    const record = rows as Record<string, unknown>;
    rows = record.list ?? record.items ?? record.data ?? [];
  }
  if (!Array.isArray(rows)) throw new Error("热点服务返回格式不匹配");

  if (provider === "zhihu") return parseZhihuOptions(rows);

  const isZhihu = rows.some(
    (row) => row !== null && typeof row === "object" && "target" in row,
  );
  if (isZhihu) return parseZhihuOptions(rows);

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

function providerFor(url: string): TrendProvider {
  if (url.includes("top.baidu.com")) return "baidu";
  if (url.includes("zhihu.com")) return "zhihu";
  return "legacy";
}

function sourceFor(provider: TrendProvider) {
  if (provider === "baidu") return "百度热榜 · 公开接口";
  if (provider === "zhihu") return "知乎热榜 · 公开接口";
  return "微博热榜 · 第三方 API";
}

async function fetchOptions(url: string) {
  const provider = providerFor(url);
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`热点服务 HTTP ${response.status}`);
  const options = parseOptions(
    (await response.json()) as {
      code?: number | string;
      data?: unknown;
      success?: boolean;
    },
    provider,
  );
  if (!options.length) throw new Error("热点服务未返回可用条目");
  return { options, source: sourceFor(provider) };
}

export async function GET() {
  try {
    const cached = await readCache();
    if (cached) {
      return NextResponse.json({
        topics: cached.options.map((option) => option.label),
        options: cached.options,
        fetchedAt: cached.fetchedAt,
        source: cached.source || sourceFor(providerFor(TREND_API_URL)),
        warning: "仅作选题背景，不是小红书官方热榜或商家事实依据",
      });
    }

    const urls = [...new Set([TREND_API_URL, TREND_FALLBACK_API_URL].filter(Boolean))];
    let lastError: unknown;
    for (const url of urls) {
      try {
        const { options, source } = await fetchOptions(url);
        const fetchedAt = new Date().toISOString();
        await writeCache({ options, fetchedAt, source });
        return NextResponse.json({
          topics: options.map((option) => option.label),
          options,
          fetchedAt,
          source,
          warning: "仅作选题背景，不是小红书官方热榜或商家事实依据",
        });
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("热点服务未返回可用条目");
  } catch (error) {
    return NextResponse.json({
      topics: [],
      options: [],
      warning: `热点暂不可用，可不附加热点继续。${error instanceof Error ? error.message : ""}`,
    });
  }
}
