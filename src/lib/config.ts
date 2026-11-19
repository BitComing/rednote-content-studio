import fs from "node:fs";
import path from "node:path";

export type DifyConfigSource = "file" | "env";

export interface DifyConfig {
  baseUrl: string;
  apiKey: string;
  user: string;
  source: DifyConfigSource;
}

export interface DifyStatus {
  configured: boolean;
  baseUrl: string;
  user: string;
  source: "none" | DifyConfigSource;
  keyMasked: string;
}

const CONFIG_PATH =
  process.env.DIFY_CONFIG_PATH || path.join(process.cwd(), ".data", "dify-config.json");

export function normalizeBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error("Base URL 必须以 http:// 或 https:// 开头。");
  }
  const url = new URL(trimmed);
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/v1";
  }
  return url.toString().replace(/\/$/, "");
}

function readFileConfig(): Omit<DifyConfig, "source"> | null {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as Partial<DifyConfig>;
    if (!parsed.baseUrl || !parsed.apiKey) return null;
    return {
      baseUrl: normalizeBaseUrl(parsed.baseUrl),
      apiKey: parsed.apiKey,
      user: parsed.user || "content-studio",
    };
  } catch {
    return null;
  }
}

export function getDifyConfig(): DifyConfig | null {
  const fileConfig = readFileConfig();
  if (fileConfig) return { ...fileConfig, source: "file" };

  if (process.env.DIFY_API_BASE_URL && process.env.DIFY_API_KEY) {
    return {
      baseUrl: normalizeBaseUrl(process.env.DIFY_API_BASE_URL),
      apiKey: process.env.DIFY_API_KEY,
      user: process.env.DIFY_WORKFLOW_USER || "content-studio",
      source: "env",
    };
  }
  return null;
}

export function getDifyStatus(): DifyStatus {
  const config = getDifyConfig();
  if (!config) {
    return { configured: false, baseUrl: "", user: "", source: "none", keyMasked: "" };
  }
  const key = config.apiKey;
  const masked = key.length <= 8 ? "****" : `${key.slice(0, 4)}...${key.slice(-4)}`;
  return {
    configured: true,
    baseUrl: config.baseUrl,
    user: config.user,
    source: config.source,
    keyMasked: masked,
  };
}

export function saveDifyConfig(input: {
  baseUrl: string;
  apiKey: string;
  user: string;
}) {
  const existing = readFileConfig();
  const apiKey = input.apiKey.trim() || existing?.apiKey;
  if (!apiKey) {
    throw new Error("请填写 Dify API Key。");
  }
  const config = {
    baseUrl: normalizeBaseUrl(input.baseUrl),
    apiKey,
    user: input.user.trim() || "content-studio",
  };
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: "utf-8",
    mode: 0o600,
  });
  try {
    fs.chmodSync(CONFIG_PATH, 0o600);
  } catch {
    // Windows uses ACLs; the file remains under the local user profile.
  }
  return config;
}

export function clearDifyConfig() {
  try {
    fs.rmSync(CONFIG_PATH, { force: true });
  } catch {
    // Ignore a missing file.
  }
}

export async function testDifyConnection(config: {
  baseUrl: string;
  apiKey: string;
}) {
  try {
    const response = await fetch(`${config.baseUrl}/info`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        ok: false,
        message: payload?.message || `连接失败：HTTP ${response.status}`,
      };
    }
    const name = payload?.name || payload?.mode || "Dify 应用";
    return { ok: true, message: `已连接：${name}` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "连接超时或地址不可达。",
    };
  }
}
