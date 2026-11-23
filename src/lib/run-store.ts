import fs from "node:fs";
import path from "node:path";
import type { RunResult } from "./types";
const root = () => path.join(process.cwd(), ".data", "runs");
function filename(id: string) { if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error("无效任务编号"); return path.join(root(), `${id}.json`); }
export function loadRun(id: string): RunResult { return JSON.parse(fs.readFileSync(filename(id), "utf8")); }
export function saveRun(run: RunResult) {
  fs.mkdirSync(root(), { recursive: true });
  const file = filename(run.id);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(run, null, 2), "utf8");
  fs.renameSync(`${file}.tmp`, file);
}
export function lockRun(id: string) {
  fs.mkdirSync(root(), { recursive: true });
  const file = `${filename(id)}.lock`;
  let fd: number;
  try { fd = fs.openSync(file, "wx"); } catch { throw new Error("该任务正在处理中，请等待完成后重试。"); }
  return () => { fs.closeSync(fd); fs.rmSync(file, { force: true }); };
}
