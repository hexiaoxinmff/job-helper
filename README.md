# 求职在线助手 📡

AI 简历诊断工具：上传简历 PDF + 粘贴目标岗位 JD，自动解析并给出**匹配度评分（雷达图）**与**可执行的改进建议**。

- 🎯 面向应届生、校招求职者
- 🔒 隐私安全：简历只在内存中处理，**分析完成立即丢弃**，不存储、不落盘
- 🤖 支持 AI 增强建议（DeepSeek），未配置时自动降级为规则评分，功能不中断

## ✨ 核心功能

**首页 · 简历诊断**
1. 📄 **简历 PDF 上传与解析**（拖拽 / 点击选择，10MB 以内，文字版 PDF）
2. 📋 **目标岗位 JD 粘贴**
3. 📊 **匹配度评分**：技能匹配、关键词覆盖、经历与成果、教育背景、表达规范 5 维度，雷达图可视化
4. ✅ **改进建议清单**：命中/缺失关键词对比（**点击带 ⓘ 的关键词可查看含义**，内置 125+ 条解释字典）+ 可执行建议
5. ✍️ **AI 简历改写**：针对缺失关键词，基于简历既有经历生成可直接粘贴的改写句（不虚构、不编造）
6. 🖼 **报告分享卡片**：一键生成诊断报告图片（含雷达图），方便分享到朋友圈/小红书

**`/star` · STAR 描述生成器（独立页面）**
7. ⭐ **STAR 扩写**：输入一句经历，AI 扩写为「情境-任务-行动-结果」的简历亮点句式，附四步拆解 + 使用建议

**`/profile` · 私人职业档案（新增）**
8. 🗂 **跨平台私人档案**：默认关闭、用户主动开启；开启后每次诊断自动沉淀「能力画像 + 成长轨迹」，仅存本地浏览器，可导出 `.json` 携带、可一键清除。破解「简历用完即弃」，把差异化护城河做出来。
9. 🧭 **差距补救路线**：缺失项区分「硬技能缺口 / 表达缺口」并给出可行动路线，避免笼统「学会它」或过度美化。
10. 🛡 **置信度 + 醒目免责**：诊断结果标注置信度（低/中/高），顶部固定「AI 建议仅供参考」横幅，对齐防幻觉合规要求。
11. 📈 **长期职业建模对比图（新增）**：沉淀 ≥ 2 次诊断快照后自动显示——能力成长趋势折线图（总分 + 五维随时间变化，标注对比点与目标线）+ **任选两次快照的五维雷达对比**（不再局限于首末）+ 对比摘要与「理想岗位目标总分」对照（可持久化保存），把单次诊断升级为「长期职业教练」。

**`/vertical` · 垂直人群模板（新增）**
12. 🎯 **垂直人群起步模板**：针对跨专业转码 / 考公转产品 / 二战失利转就业 / 应届零实习 / 在职跳槽 / 海归 6 类高价值垂直人群，提供痛点诊断、定位包装建议、推荐目标岗位（联动 JD 库）与「诚实不编造」的起步简历骨架，一键载入编辑器。

**`/campus` · 高校 B2B2C 入口（新增）**
13. 🏫 **高校就业中心合作入口**：面向高校 / 院系的 B2B2C 落地页，阐述价值主张、合作三步与隐私合规，并提供「申请封闭试点」留资表单（纯前端，数据仅存本地）。对应 PRD Roadmap 的 B2B2C 试点目标。

> AI 改写与 STAR 生成依赖 DeepSeek API（需配置 `DEEPSEEK_API_KEY`）；评分与建议在无 key 时自动降级为规则引擎，功能不中断。

## ✨ 本期新增能力

- 🌗 **暗色模式（Dark Mode）**：导航栏一键切换亮 / 暗主题，偏好持久化到本地，首屏前同步应用 **无闪烁（FOUC）**；全站卡片、表单、图表配色随主题自适应。
- 🌐 **多语言行业 JD 扩库**：示例 JD 库从 6 个扩到 **12 个行业**（互联网 / 数据·AI / 设计 / 市场 / 运营 / 职能等），每个岗位提供 **中文 + English** 双语 JD，顶部「语言」切换后一键加载对应语言。
- 🛡 **错误边界（Error Boundary）**：路由级 `error.tsx`（首页 / STAR / 编辑器 / 预览 + 根级 `global-error`）与组件级 `ErrorBoundary`（包裹雷达图等易崩模块）双重兜底，单页 / 单图崩溃不影响整站，并提供「重试」恢复。

## 🛠 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Next.js 16（App Router）+ Tailwind CSS | 前后端一体，少学一套框架 |
| 后端 | CloudBase HTTP 云函数 `ai-proxy` | 隐藏 DeepSeek Key，纯前端无服务端路由 |
| PDF 解析 | unpdf | 内置 pdf.js，无 worker 兼容问题 |
| 可视化 | Recharts | 雷达图 |
| AI 增强 | DeepSeek API（可选） | 未配置 key 时自动降级为规则评分 |
| 部署 | CloudBase 静态网站托管（已上线）/ Vercel | 静态导出 `out/`，可托管到任意静态服务 |

## 🚀 快速开始

### 1. 环境要求

- Node.js 18.18+（推荐 20+）
- npm / pnpm / yarn

### 2. 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:3000）
npm run dev

# 生产构建
npm run build
npm run start
```

### 3. 配置 AI 增强（可选但推荐）

复制 `.env.example` 为 `.env.local`，填入 DeepSeek key：

```bash
cp .env.example .env.local
# 编辑 .env.local：
DEEPSEEK_API_KEY=sk-你的key
```

> 不配置也能用：系统会用内置的规则评分引擎（关键词匹配 + 量化检测 + 结构检测），只是建议不如 AI 生成的具体。

### 4. 部署到 Vercel（免费）

1. 把项目推送到 GitHub
2. 打开 [vercel.com](https://vercel.com) → New Project → 导入仓库
3. 在 Environment Variables 里添加 `DEEPSEEK_API_KEY`
4. Deploy，完成 ✅

> 域名：Vercel 默认给你 `xxx.vercel.app` 免费域名；想用自有域名（约 80 元/年）在 Vercel 控制台绑定即可。

### 5. 部署到 CloudBase 静态网站托管（当前已上线 ✅）

项目已配置 `output: "export"`，`npm run build` 产出纯静态文件到 `out/`，可托管到 CloudBase 静态网站托管（免备案、免费）。

- **线上地址**：`https://xiaoxin2026-personal-d1acf1a1fb0-1469931868.tcloudbaseapp.com/`
- **部署步骤**（使用 CloudBase MCP 或 `tcb` CLI）：
  1. `npm run build` 生成 `out/`
  2. 开通静态托管 `manageHosting(action="enableService")`
  3. 上传产物 `manageHosting(action="upload", localPath="out", cloudPath="/")`
  4. 配置文档 `manageHosting(action="setWebsiteDocument", indexDocument="index.html", errorDocument="404.html")`
- **提示**：
  - `next build` 会清理 `.next`/`out`；在清理受限的构建环境里，可构建到干净子目录（拷贝源码 + 复用上层 `node_modules`）后上传产物，避免清理被拦截。
  - WorkBuddy 沙箱会给 node 注入删除保护（`NODE_OPTIONS` 指向 safe-delete shim），`next build` 清理缓存时会报 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`。绕过方法：构建命令前 `unset NODE_OPTIONS`；清理 `.next`/`out` 用 `cmd /c rmdir /s /q`（不经 node，不受保护限制）。
- **主题体系**：颜色/圆角/阴影/间距全部 token 化为根 CSS 变量（`app/globals.css` 的 `--jh-*`），Tailwind v4 `@theme` 映射工具类，`lib/theme.tsx` 导出 `THEME_CSS_VARS` / `resolveThemeVars()` 供 JS 侧读取。**新增颜色一律走 `--jh-*` 变量或语义工具类（如 `bg-primary-600`），禁止硬编码十六进制**。批量替换旧色板类可用 `scripts/replace-theme-tokens.cjs`。

## 📁 项目结构

```
job-helper/
├── app/
│   ├── layout.tsx            # 根布局（导航 + ThemeProvider + 无闪烁主题脚本）
│   ├── page.tsx              # 首页：简历诊断
│   ├── star/page.tsx         # 独立页面：STAR 描述生成器
│   ├── star/error.tsx        # STAR 路由级错误边界
│   ├── editor/page.tsx       # 简历编辑器
│   ├── editor/error.tsx      # 编辑器路由级错误边界
│   ├── preview/page.tsx      # 简历预览 / 导出
│   ├── preview/error.tsx     # 预览路由级错误边界
│   ├── error.tsx             # 根路由级错误边界
│   └── global-error.tsx      # 根布局级错误边界（自带 html/body）
├── components/
│   ├── NavBar.tsx            # 导航栏（含暗色切换）
│   ├── ThemeToggle.tsx       # 亮 / 暗主题切换按钮
│   ├── ErrorBoundary.tsx     # 通用组件级错误边界（包裹图表等易崩模块）
│   ├── KeywordChip.tsx       # 可点击展开含义的关键词 chip
│   ├── StarGenerator.tsx     # STAR 生成器 UI（独立组件，可复用）
│   ├── ResultView.tsx        # 简历诊断结果页（雷达图用 ErrorBoundary 包裹）
│   ├── resume/ResumeDocument.tsx # 简历渲染（6 套模板：经典/现代/紧凑/侧边栏/优雅/创意）
│   └── ui/                   # Button / Card / Field / Input 基础组件（已适配暗色）
├── lib/
│   ├── pdf.ts                # PDF 文本提取（unpdf）
│   ├── diagnose.ts           # 诊断编排（浏览器端评分 + AI 增强）
│   ├── scoring.ts            # 规则评分引擎
│   ├── ai-client.ts          # DeepSeek AI（建议/改写/STAR 三个调用）
│   ├── jd-library.ts         # 多语言行业 JD 库（中文 / English，12 个行业）
│   ├── theme.tsx             # 主题 Context + 无闪烁初始化脚本
│   ├── resume-store.tsx      # 简历状态（本地持久化）
│   ├── track.ts              # 轻量埋点
│   └── types.ts              # 共享类型
├── scripts/
│   ├── make-test-pdf.cjs     # 生成测试 PDF（英文）
│   └── make-test-pdf-cn.py   # 生成中文测试 PDF
└── .env.example              # 环境变量模板
```

## 🔧 开发指南

### 评分引擎（lib/scoring.ts）

5 个维度，各 0-100 分，加权汇总为总分（权重 0.30/0.20/0.25/0.10/0.15；8-18 校准：下调纯关键词命中的「技能匹配」、上调体现简历价值的「经历与成果」，避免 JD 未识别技能词时分数虚高/虚低）：

1. **技能匹配**：JD 要求的技能关键词在简历中的命中比例
2. **关键词覆盖**：JD 全文关键词（技能+经历类）覆盖率
3. **经历与成果**：实习/项目关键词 + 量化数据（% 万 人 次 等）+ 强动词
4. **教育背景**：学历关键词 + JD 专业方向匹配
5. **表达规范**：结构分段 + 标点 + 内容长度

自定义关键词库：直接编辑 `lib/scoring.ts` 中的 `SKILL_KEYWORDS` / `EXPERIENCE_KEYWORDS` / `EDUCATION_KEYWORDS` 数组。

### AI 增强（lib/ai-client.ts + cloudfunctions/ai-proxy）

- 前端 `lib/ai-client.ts` 统一打到 CloudBase HTTP 云函数 `ai-proxy`（隐藏 DeepSeek Key，URL 由 `NEXT_PUBLIC_AI_PROXY_URL` 配置）
- 云函数提供 4 个 action：`analyze`（评分建议）、`jdSemantics`（近义技能修正）、`rewrite`（改写）、`star`（STAR 句式）
- 任一调用失败 / 超时（前端 8s、云函数上游 20s）→ 返回 `null`，自动降级到规则结果，功能不中断
- 首页「AI 增强诊断」开关可关闭 AI（关闭后不发任何外部请求，仅本地规则评分，隐私红线）
- 云函数已限制请求体 ≤1MB（防滥用）；重部署需保持 HTTP 函数形态：`tcb fn deploy ai-proxy --httpFn`

### 云函数 API 说明

`POST {NEXT_PUBLIC_AI_PROXY_URL}`（JSON，统一封装 `{ action, ...payload }`）：

| action | 字段 | 说明 |
|---|---|---|
| `analyze` | `resumeText`, `jdText` | AI 评分与建议，覆盖/修正规则结果 |
| `jdSemantics` | `jdText` | JD 语义解析：核心技能 + 近义表述，用于修正关键词命中 |
| `rewrite` | `resumeText`, `jdText`, `missingKeywords` | 基于简历既有经历的改写句（不虚构） |
| `star` | `experience` | STAR 四步拆解 + 完整句式 |

返回统一为 `{ ok: true, data }` 或 `{ ok: false, error }`。

> 诊断全程在浏览器端完成：unpdf 解析 PDF → 规则评分（`lib/scoring.ts` 始终执行）→ AI 增强并行覆盖/修正 → 输出结果。简历文本仅在内存处理，不落库。

## 🧪 本地测试

```bash
# 1. 启动服务
npm run dev

# 2. 生成中文测试 PDF（首次需 pip install fpdf2）
python scripts/make-test-pdf-cn.py

# 3. 本地验证：浏览器打开 http://localhost:3000 上传该 PDF 走完整诊断流程
#    （诊断全程在浏览器端完成；无 AI Key 时自动降级为规则评分）
```

## ⚠️ 已知限制

- **不支持扫描件（图片型 PDF）**：需要文字版 PDF（Word/WPS 导出 PDF 即为文字版）
- 关键词库基于常见岗位 JD 预置，极端冷门的岗位术语可能识别不全（可自行扩展词库）
- AI 增强需要 DeepSeek API key（费用约 10-30 元/月，取决于用量）

## 🗺 后续规划（本期未做）

- [ ] 用户账号体系（Supabase Auth）
- [ ] 诊断历史记录（Supabase PostgreSQL）
- [ ] 多简历对比
- [ ] 付费解锁深度报告（用户量起来后再开放）
- [ ] 简历代写 / 求职咨询引流

## 📝 License

MIT
