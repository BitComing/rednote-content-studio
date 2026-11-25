// Dify 连接与耗时诊断（排查 HTTP 504 用，不参与构建）
// 用法：node scripts/check-dify.mjs
// 依次做三件事，每件都打印耗时：
//   1) GET  /info            —— 纯粹测网络与密钥
//   2) POST /workflows/run   —— blocking 模式，和你页面上的调用方式完全一致
//   3) POST /workflows/run   —— streaming 模式（只在第 2 步失败时做）
// 不会打印任何密钥内容。
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cfgPath = path.join(root, ".data", "dify-config.json");
if (!fs.existsSync(cfgPath)) {
  console.log("✗ 没找到 .data/dify-config.json");
  console.log("  说明页面上的「保存配置」还没成功，先去右上角填好并保存。");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const base = String(cfg.baseUrl || "").replace(/\/+$/, "");
const key = String(cfg.apiKey || "");
const rev = String(cfg.revisionApiKey || cfg.round2ApiKey || "");
const mask = (v) => (v ? `${v.slice(0, 4)}...${v.slice(-3)}（${v.length} 位）` : "（空）");

console.log("配置文件：", cfgPath);
console.log("Base URL：", base || "（空）");
console.log("首轮 Key：", mask(key));
console.log("改稿 Key：", mask(rev));
console.log("");

const inputs = {
  draft: "拾光咖啡，校园咖啡店，考试周自习活动。长桌充足，营业时间 09:00-18:00，人均 18 元，招牌手冲 12 元。",
  voice_and_tone: "自然友好 Natural and friendly",
  platform: "小红书",
  language: "简体中文",
};

async function timed(label, fn) {
  const t = Date.now();
  try {
    const r = await fn();
    return { ...r, ms: Date.now() - t };
  } catch (e) {
    return { error: e.name === "TimeoutError" ? "客户端超时（脚本自身等待上限）" : e.message, ms: Date.now() - t };
  }
}

// ① /info
const info = await timed("info", async () => {
  const r = await fetch(`${base}/info`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20000) });
  const body = await r.text();
  return { status: r.status, ok: r.ok, body: body.slice(0, 160) };
});
console.log(`① GET /info → HTTP ${info.status ?? "—"}  ${info.ms}ms`);
console.log(`   ${info.error || info.body}`);
console.log("");

// ② blocking
console.log("② POST /workflows/run（blocking，与页面一致）…… 可能要等好几分钟，别中断");
const block = await timed("block", async () => {
  const r = await fetch(`${base}/workflows/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs, response_mode: "blocking", user: cfg.user || "content-studio" }),
    signal: AbortSignal.timeout(300000),
  });
  const text = await r.text();
  let j = null;
  try { j = JSON.parse(text); } catch {}
  return { status: r.status, ok: r.ok, text: text.slice(0, 300), j };
});
console.log(`   结果：HTTP ${block.status ?? "—"}  耗时 ${(block.ms / 1000).toFixed(1)}s`);
if (block.error) console.log(`   异常：${block.error}`);
if (block.j) {
  console.log(`   工作流状态：${block.j?.data?.status || "—"}`);
  if (block.j?.data?.error) console.log(`   错误：${String(block.j.data.error).slice(0, 200)}`);
  const out = block.j?.data?.outputs;
  if (out) console.log(`   输出字段：${Object.keys(out).join(", ")}`);
} else if (block.text) {
  console.log(`   响应片段：${block.text.replace(/\s+/g, " ").slice(0, 200)}`);
}
console.log("");

if (block.ok) {
  console.log("blocking 模式成功，页面不应报 504。若页面仍失败，说明是浏览器到本机服务这一段的问题。");
  process.exit(0);
}

// ③ streaming
console.log("③ POST /workflows/run（streaming，用来判断是不是网关掐断）……");
const stream = await timed("stream", async () => {
  const r = await fetch(`${base}/workflows/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs, response_mode: "streaming", user: cfg.user || "content-studio" }),
    signal: AbortSignal.timeout(300000),
  });
  if (!r.ok) {
    const t = await r.text();
    return { status: r.status, ok: false, text: t.slice(0, 200) };
  }
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = "", events = 0, finished = null, lastEvent = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      events++;
      try {
        const ev = JSON.parse(raw);
        lastEvent = ev.event || lastEvent;
        if (ev.event === "workflow_finished") finished = ev.data || ev;
      } catch {}
    }
  }
  return { status: r.status, ok: true, events, lastEvent, finished };
});
console.log(`   结果：HTTP ${stream.status ?? "—"}  耗时 ${(stream.ms / 1000).toFixed(1)}s  收到事件 ${stream.events ?? 0} 个`);
if (stream.error) console.log(`   异常：${stream.error}`);
if (stream.text) console.log(`   响应片段：${stream.text.replace(/\s+/g, " ").slice(0, 200)}`);
if (stream.finished) {
  const f = stream.finished;
  console.log(`   工作流状态：${f.status || "—"}`);
  if (f.error) console.log(`   错误：${String(f.error).slice(0, 200)}`);
  const out = f.outputs;
  if (out) console.log(`   输出字段：${Object.keys(out).join(", ")}`);
}
console.log("");
if (stream.ok && stream.finished) {
  console.log("判定：流式能跑完、blocking 拿不到响应 → 是网关在约 100 秒处掐断长连接（Cloudflare/nginx 的常见限制）。");
  console.log("     工作流本身没问题，只是 blocking 模式下等不到结果。");
} else if (!stream.ok) {
  console.log("判定：流式请求也被拒绝 → 先解决鉴权/地址问题，不是超时。");
}
