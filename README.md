# 内容工作台

Next.js + TypeScript + Tailwind + shadcn/ui 风格组件 + lucide-react 的多平台内容工作台。

## 运行

```powershell
npm install
npm run dev
```

默认使用本地演示数据，不需要 Dify 凭证就能完整体验首轮生成、评分、审核和二轮改稿。

## 接入 Dify

复制 `.env.example` 为 `.env.local`，填入：

```text
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-xxxxxxxx
DIFY_WORKFLOW_USER=content-studio
```

服务端接口会请求 `POST /workflows/run`，使用 `response_mode: "blocking"`。API key 只在服务端读取，不会进入浏览器。

也可以不写 `.env.local`，直接点页面右上角的“Dify 设置”保存 Base URL、API Key 和 User。页面配置保存在 `web/.data/dify-config.json`，已加入 `.gitignore`，并优先于环境变量。

参考文件会先走 `/api/upload`。配置 Dify 后，它转发到 `/files/upload`，再把 `upload_file_id` 放进 `user_file`；未配置时返回演示文件 ID。

当前 DSL 包含 Dify 的 `human-input` 节点。不同 Dify 版本对通过 API 提交人工表单的支持不同：

- 如果实例开放 human-input API，可在 `src/app/api/run/route.ts` 和 `src/app/api/revise/route.ts` 中继续接入暂停/恢复。
- 如果没有开放，建议用 Dify Web App 完成人工审核，或在 Dify 里拆成“首轮生成”和“二轮改稿”两个工作流。

## 目录

```text
src/app/api/run      Dify 代理或本地演示运行
src/app/api/revise   二轮改稿
src/components/ui    shadcn/ui 风格基础组件
src/components/workbench  工作台界面
src/lib             Dify 适配、演示数据、类型和工具
```
