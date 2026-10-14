# 求职在线助手 Recall 📡

AI 简历诊断工具：上传简历 PDF + 粘贴目标岗位 JD，浏览器端五维评分（雷达图）→ 改进建议、AI 改写、模拟面试、投递追踪一条龙。

- 🎯 面向应届生、校招求职者
- 🔒 隐私红线：简历默认只在浏览器内存里处理，**永不落盘、服务端零存储**
- 🤖 AI 增强（DeepSeek）可选：未配置时自动降级为规则评分，功能不中断
- 🌐 线上地址：https://job-helper-live.vercel.app/

> 架构说明（2026-10-14 起）：AI 代理已从 CloudBase 云函数迁入站内 **`app/api/ai-proxy/route.ts`**（Vercel serverless，`maxDuration: 30`）；`next.config.ts` 已移除 `output: "export"`。`cloudfunctions/` 等 CloudBase 遗留已于 2026-10-14 从仓库移除（git 历史可查），不再部署。

## ✨ 核心功能

**`/` · 简历诊断（首页）**
1. 📄 简历 PDF 上传与解析（拖拽 / 点击选择，10MB 以内，文字版 PDF；unpdf 浏览器端提取）
2. 📋 目标岗位 JD 粘贴（≥20 字校验；12 行业中/英双语示例 JD 库一键加载）
3. 📊 五维匹配度评分：技能匹配 0.30 / 关键词覆盖 0.20 / 经历与成果 0.25 / 教育背景 0.10 / 表达规范 0.15，雷达图可视化（Recharts）
4. ✅ 改进建议清单：命中/缺失关键词对比（点击带 ⓘ 的关键词可查看含义，125+ 条解释字典）+ 可执行建议
5. ✍️ AI 简历改写：针对缺失关键词，基于简历既有经历生成可直接粘贴的改写句（**不虚构、不编造**）
6. 🖼 报告分享卡片：一键生成诊断报告图片（含雷达图），方便分享

**`/editor` · 简历编辑器** — 20 套简历模板，所见即所得编辑
**`/preview` · A4 打印预览** — 导出 PDF
**`/interview` · AI 模拟面试** — 按目标岗位出题、逐题作答、AI 点评
**`/star` · STAR 描述生成器** — 输入一句经历，AI 扩写为「情境-任务-行动-结果」亮点句式，附四步拆解
**`/tracker` · 投递追踪** — 记录投递进度，7 天未推进自动标跟进提醒
**`/profile` · 私人职业档案** — 默认关闭、用户主动开启；每次诊断自动沉淀「能力画像 + 成长轨迹」（仅存本地浏览器，可导出 `.json`、可一键清除）；≥2 次诊断快照后显示成长趋势折线 + 任选两次快照的五维雷达对比 + 90 天补位计划
**`/vertical` · 垂直人群模板** — 跨专业转码 / 考公转产品 / 二战转就业 / 应届零实习 / 在职跳槽 / 海归 6 类人群的起步简历骨架与定位建议
**`/campus` · 高校 B2B2C 落地页** — 面向高校就业中心的合作入口与封闭试点留资表单（纯前端，数据仅存本地）

**全站能力**：🌗 暗色模式（无闪烁 FOUC）/ 🌐 中英双语 JD 库 / 🛡 路由级 + 组件级错误边界 / 📈 长期职业建模对比

## 🛠 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Next.js 16.3.1（App Router）+ React 19 + Tailwind v4 | 前后端一体 |
| AI 代理 | `app/api/ai-proxy/route.ts`（Vercel serverless） | 隐藏 DeepSeek Key；temperature 0.4，强制 JSON 输出 |
| PDF 解析 | unpdf | 浏览器端，内置 pdf.js，无 worker 兼容问题 |
| 可视化 | Recharts | 雷达图 / 折线图 |
| 分享卡片 | html-to-image | 诊断报告图片导出 |
| 本地状态 | 6 个 localStorage Provider + React Context | 主题 / 简历 / 档案 / 诊断历史 / 投递 / 补位计划 |
| 云同步 | 浏览器端 AES-256-GCM 加密 | 密钥只存本地；服务端已降级为本地（503） |
| 部署 | Vercel | `vercel.json` 配 `maxDuration: 30` |

## 🔄 诊断链路（核心）

```
上传简历 PDF ──► 粘贴/选择目标 JD
        │
        ▼
浏览器 unpdf 提取文本（仅内存，不落盘不上传）
        │
        ▼
规则评分引擎 lib/scoring.ts 先跑（始终执行，永远兜底）
        │
        ▼
AI 开关开？ ──是──► 同源 /api/ai-proxy 并行 analyze + jdSemantics（客户端 30s 超时）
        │否/超时/失败                                              │
        ▼                                                          ▼
规则结果降级输出 ◄──────────────────────────────────────────────────┘
        │
        ▼
ResultView：雷达图 + 命中/缺失关键词 + 建议 + 置信度（低/中/高）+ 「AI 建议仅供参考」横幅
        │
        ▼
可选：AI 改写 / STAR 扩写 / 模拟面试 / 档案沉淀 / 分享卡片
```

**关键原则**：双轨评分（规则永远先跑、AI 只覆盖/修正）；隐私红线（简历文本禁止上传服务端/写后端存储）；防幻觉三件套（置信度 + 免责横幅 + 硬技能/表达缺口区分）；AI 开关可完全关闭（关闭后不发任何外部请求）。

## 🚀 快速开始

### 1. 环境要求

- Node.js 18.18+（推荐 20+）
- npm

### 2. 安装与运行

```bash
npm install

# 开发（http://localhost:3000）
npm run dev

# 生产构建 + 本地预览
npm run build
npm run start
```

`npm run dev` / `npm run build` 前会自动跑 `scripts/make-version.mjs`，生成版本号（页面底部显示「版本 …」）。

### 3. 配置 AI 增强（可选但推荐）

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

| 变量 | 位置 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | Vercel 环境变量（服务端） | DeepSeek 密钥，前端永远拿不到；不配则降级纯规则评分 |
| `DEEPSEEK_BASE_URL` | Vercel 环境变量 | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | Vercel 环境变量 | 默认 `deepseek-chat` |
| `AI_PROXY_SECRET` | Vercel 环境变量（必填生产） | 与前端 `NEXT_PUBLIC_AI_PROXY_KEY` 同值；路由侧校验 x-api-key，缺失/不匹配返回 401。不配则任何人可刷你的 DeepSeek 额度 |
| `AI_PROXY_ALLOWED_ORIGINS` | Vercel 环境变量（可选） | 逗号分隔的 Origin 白名单；为空不限制，正式域名确认后务必收紧 |
| `NEXT_PUBLIC_AI_PROXY_KEY` | `.env.local`（前端，构建时内联） | 与 `AI_PROXY_SECRET` 同值 |
| `NEXT_PUBLIC_AI_PROXY_URL` | `.env.local`（可选） | 默认同源 `/api/ai-proxy`；仅 AI 代理单独部署时才改 |
| `NEXT_PUBLIC_TRACKING_URL` | `.env.local`（可选） | 埋点上报端点；不配置则完全静默 |

### 4. 部署到 Vercel

1. 推送到 GitHub
2. vercel.com → New Project → 导入仓库
3. Environment Variables 添加上表服务端变量（至少 `DEEPSEEK_API_KEY` + `AI_PROXY_SECRET`）
4. Deploy ✅

### AI 代理 action 一览（`POST /api/ai-proxy`，JSON 封装 `{ action, ...payload }`）

| action | 说明 |
|---|---|
| `analyze` | AI 评分与建议，覆盖/修正规则结果 |
| `jdSemantics` | JD 语义解析：核心技能 + 近义表述，用于修正关键词命中并重算总分 |
| `rewrite` | 基于简历既有经历的改写句（禁止虚构） |
| `star` | STAR 四步拆解 + 完整句式 |
| `parseResume` / `optimizeResume` | 简历解析 / 优化（编辑器链路） |
| `interview` / `reviewAnswer` | 模拟面试出题 / 作答点评 |
| `applyMessage` | 求职信/私信生成 |
| `sync` / `syncClear` | 云同步（当前部署已降级为本地，服务端返回 503） |

安全：共享密钥校验（x-api-key）+ Origin 白名单 + 每 IP 滑动窗口限流 + 全局并发上限 + 提示注入防御；请求体 ≤1MB。

## 📁 项目结构

```
job-helper/
├── app/
│   ├── layout.tsx            # 根布局（导航 + ThemeProvider + 无闪烁主题脚本）
│   ├── page.tsx              # 首页：简历诊断
│   ├── api/ai-proxy/route.ts # ★ AI 代理（Vercel serverless，11 个 action）
│   ├── editor/page.tsx       # 简历编辑器（20 套模板）
│   ├── preview/page.tsx      # A4 打印预览 / 导出
│   ├── interview/page.tsx    # AI 模拟面试
│   ├── star/page.tsx         # STAR 描述生成器
│   ├── tracker/page.tsx      # 投递追踪
│   ├── profile/page.tsx      # 私人职业档案 + 成长对比 + 90 天补位计划
│   ├── vertical/page.tsx     # 垂直人群模板（6 类）
│   ├── campus/page.tsx       # 高校 B2B2C 落地页
│   └── error.tsx / global-error.tsx  # 路由级 + 根级错误边界
├── components/
│   ├── NavBar.tsx / ThemeToggle.tsx
│   ├── ErrorBoundary.tsx / KeywordChip.tsx / ResultView.tsx / StarGenerator.tsx
│   ├── resume/               # 简历渲染（ResumeDocument + template-meta，20 套模板）
│   └── ui/                   # Button / Card / Field / Input 基础组件
├── lib/
│   ├── pdf.ts                # PDF 文本提取（unpdf）
│   ├── diagnose.ts           # 浏览器端诊断编排（规则 → AI 增强 → 近义修正 → 输出）
│   ├── scoring.ts            # ★ 规则评分引擎（5 维权重 0.30/0.20/0.25/0.10/0.15，有校准注释，勿凭直觉改）
│   ├── ai-client.ts          # 调用 /api/ai-proxy 的封装（失败返回 null → 降级）
│   ├── keywords.ts           # 技能/教育/经历关键词 + 125+ 条含义字典
│   ├── jd-library.ts         # 12 行业 × 中/英 JD 示例库
│   ├── cloud-sync.ts         # 云同步（浏览器端 AES-256-GCM，密钥只存本地）
│   ├── profile.tsx / theme.tsx / resume-store.tsx  # 6 个 localStorage Provider 的一部分
│   ├── track.ts              # 轻量埋点（可 no-op）
│   └── types.ts              # 共享类型
├── scripts/                  # make-version.mjs（构建前生成版本号）/ 中英测试 PDF 生成
├── .env.example              # 环境变量模板
├── vercel.json               # ai-proxy maxDuration: 30
└── AGENTS.md                 # next dev 自动生成（勿手改）
```

## 🔧 开发指南

### 评分引擎（lib/scoring.ts）

5 个维度各 0-100 分，加权汇总取整。权重 0.30/0.20/0.25/0.10/0.15（2026-08-18 校准：下调纯关键词命中的「技能匹配」、上调「经历与成果」，避免 JD 未识别技能词时分数虚高/虚低）——**改权重前先读文件内校准注释**。

自定义关键词库：编辑 `lib/scoring.ts` 的 `SKILL_KEYWORDS` / `EXPERIENCE_KEYWORDS` / `EDUCATION_KEYWORDS`，或 `lib/keywords.ts` 的含义字典。

### 设计系统

颜色/圆角/阴影/间距全部 token 化为根 CSS 变量（`app/globals.css` 的 `--jh-*`，以 `MASTER.md` 为准），Tailwind v4 `@theme` 映射工具类。**新增颜色一律走 `--jh-*` 变量或语义工具类（如 `bg-primary-600`），禁止硬编码十六进制**。批量替换旧色板类可用 `scripts/replace-theme-tokens.cjs`。

### 给 AI Agent 的硬守则

1. **Next.js 16 有破坏性变更**：写代码前先查 `node_modules/next/dist/docs/` 相关指南；`AGENTS.md` 由 `next dev` 生成，**勿手改**。
2. **隐私红线**：禁止把简历原文上传服务端/写后端存储/localStorage（档案快照仅存脱敏字段）；禁止在代码里暴露 DeepSeek Key。
3. **降级优先**：任何 AI 相关改动都要保证无 Key/失败时主流程 100% 可用。
4. **防幻觉**：AI 改写禁止虚构经历/数据；诊断输出必须带置信度与免责横幅。

## 🧪 本地测试

```bash
npm run dev
# 生成中文测试 PDF（首次需 pip install fpdf2）
python scripts/make-test-pdf-cn.py
# 浏览器打开 http://localhost:3000 上传该 PDF，走完整诊断流程
```

## ⚠️ 已知限制

- **不支持扫描件（图片型 PDF）**：需要文字版 PDF（Word/WPS 导出即文字版）
- 关键词库基于常见岗位 JD 预置，极端冷门术语可能识别不全（可自行扩展词库）
- AI 增强需要 DeepSeek API key（费用约 10-30 元/月，取决于用量）
- 无用户账号体系：档案仅存本机浏览器，跨设备需手动导出/导入 `.json`；云同步当前降级为本地

## 🗺 后续规划（本期未做）

- [ ] 用户账号体系 + 诊断历史云端存储（档案跨设备，解锁长期职业建模价值）
- [ ] 多简历对比
- [ ] B2B2C 试点落地（`/campus` 已有入口，需接真实留资/机构开通）
- [ ] 付费解锁深度报告（用户量起来后再开放）
- [ ] 简历代写 / 求职咨询引流

## 📝 License

MIT
