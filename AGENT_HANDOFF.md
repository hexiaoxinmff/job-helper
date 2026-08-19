# Job-Helper（求职在线助手 / Recall）— AI Agent 交接说明

> **本文档用途**：给第一次接触本项目的 AI Agent 读取。读完本文档即可独立完成开发、调试、答疑、评审，**无需任何对话历史**。
> **最后更新**：2026-08-19
> **建议读取顺序**：0 → 1 → 2 → 3 → 4 → 5 → 6 → 7，遇到具体任务时再细读 8~14。

---

## 0. 一句话总结（TL;DR）

**Job-Helper（产品代号 Recall，求职在线助手）是一个纯前端的 AI 简历诊断工具**：用户上传简历 PDF + 粘贴目标岗位 JD，浏览器端完成解析与五维评分（雷达图），可选调用 DeepSeek（经 CloudBase 云函数代理）生成诊断建议/简历改写/STAR 扩写。核心差异化是「跨平台私人职业档案 + 诚实诊断 + 长期职业建模」，隐私红线是**简历永不落盘、服务端零存储**。

- 工程目录：`F:\WorkBuddyData\全栈式开发 web\job-helper\`（本文件所在目录）
- 技术栈：Next.js 16（App Router）+ React 19 + Tailwind v4，静态导出，CloudBase 静态托管已上线
- 已实现功能：FR-01 ~ FR-13 **全部已实现**（见 §3）
- 线上地址：`https://xiaoxin2026-personal-d1acf1a1fb0-1469931868.tcloudbaseapp.com/`

---

## 1. 仓库内容总览（工作区根目录）

工作区 `F:\WorkBuddyData\全栈式开发 web\` 包含：

| 路径 | 内容 | 角色 |
|---|---|---|
| `求职产品需求验证报告.md` | 资深 PM 视角的市场验证报告（用户规模、竞品、风险、商业模式结论） | 战略文档，回答「为什么做、怎么做才能赢」 |
| `求职在线助手-PRD.md` | v1.0 PRD，含功能清单 FR-01~13、非功能需求、验收标准 GWT、技术方案 | 需求文档，回答「做什么、验收什么」 |
| `job-helper/` | **工程本体**（本说明的管辖范围） | 代码 |
| `job-helper/AGENT_HANDOFF.md` | 本文档 | 给 AI Agent 的交接说明 |

> 三层关系：验证报告（要不要做）→ PRD（做什么）→ 代码（做成什么样）。新 agent 若需产品上下文先读 PRD；若需决策背景读验证报告。

---

## 2. 产品定位与背景（30 秒版）

- **痛点**：求职者的信息差、简历-岗位不匹配、简历填写不到位、缺乏个性化推荐。
- **竞争环境**：BOSS 直聘「直闪闪」、牛客简历助手已免费提供类似 AI 功能 → **不做「又一个 AI 改简历工具」**。
- **差异化定位**：「跨平台的私人职业档案 + 长期职业教练」——诚实诊断（给理由、给置信度、区分硬技能缺口/表达缺口）而非美化；档案沉淀为可携带的私人资产而非用完即弃。
- **目标人群（MVP）**：应届生 + 跨专业/转码/考公转行人群。
- **商业模式**：B2B2C（高校就业中心试点，`/campus` 落地页已实现）+ 后续付费深度诊断。

---

## 3. 当前状态速览

**功能实现状态（PRD FR 编号）**：

| 编号 | 功能 | 优先级 | 状态 |
|---|---|---|---|
| FR-01 | 简历 PDF 上传与解析（unpdf，浏览器端） | P0 | ✅ 已实现 |
| FR-02 | 目标岗位 JD 粘贴 + 12 行业中/英双语 JD 库 | P0 | ✅ 已实现 |
| FR-03 | 五维匹配度评分 + 雷达图（Recharts） | P0 | ✅ 已实现 |
| FR-04 | 命中/缺失关键词对比 + 125+ 条含义字典 | P0 | ✅ 已实现 |
| FR-05 | AI 简历改写（强约束：不虚构） | P1 | ✅ 已实现 |
| FR-06 | STAR 描述生成器（`/star`） | P1 | ✅ 已实现 |
| FR-07 | 私人职业档案（localStorage，默认关闭，可导出/清除） | P1 | ✅ 已实现 |
| FR-08 | 报告分享卡片导出（html-to-image） | P1 | ✅ 已实现 |
| FR-09 | 简历编辑器 + 预览导出（`/editor`、`/preview`，6 套模板） | P2 | ✅ 已实现 |
| FR-10 | 暗色模式（无 FOUC）/ 错误边界（路由级+组件级） | P2 | ✅ 已实现 |
| FR-11 | 长期职业建模对比图（趋势折线 + 雷达对比 + 摘要） | P1 | ✅ 已实现 |
| FR-12 | 垂直人群模板（`/vertical`，6 类人群） | P1 | ✅ 已实现 |
| FR-13 | 高校 B2B2C 入口（`/campus`，留资表单纯前端） | P2 | ✅ 已实现 |

**未做（Roadmap，见 §14）**：用户账号体系、诊断历史云端存储、多简历对比、付费深度报告、简历代写引流。

---

## 4. 技术栈

| 层 | 技术 | 版本/说明 |
|---|---|---|
| 前端框架 | Next.js（App Router） | **16.3.1**（⚠️ 与 13/14 有破坏性变更，见 §13 工作守则） |
| UI 库 | React + Tailwind CSS | React 19.2.8 / Tailwind v4（@tailwindcss/postcss） |
| 构建产物 | 静态导出 | `output: "export"`, `trailingSlash: true` → 产出 `out/` |
| PDF 解析 | `unpdf` | ^1.8.1，浏览器端提取文本，内置 pdf.js |
| 可视化 | `recharts` | ^3.10.1，雷达图/折线图 |
| 分享卡片 | `html-to-image` | ^1.11.13 |
| AI | DeepSeek API（经云函数代理） | 前端永远拿不到 Key |
| 后端 | CloudBase HTTP 云函数 `ai-proxy` | Node.js，隐藏 Key，4 个 action |
| 部署 | CloudBase 静态网站托管（已上线） | 也可 Vercel |
| 本地状态 | `localStorage` + React Context | 简历、主题、私人档案 |

---

## 5. 架构与数据流（核心！）

```
用户上传简历 PDF ──► 粘贴/选择目标岗位 JD（≥20字校验）
        │
        ▼
前端 unpdf 提取文本（仅内存，不落盘不上传）──► 规则评分引擎 scoring.ts（始终执行）
        │
        ▼
AI 代理可用？ ──是──► 云函数 ai-proxy（analyze 覆盖评分 + jdSemantics 近义技能修正→重算总分）
        │否/超时/失败                                    │
        ▼                                                ▼
规则结果降级输出 ◄────────────────────────────────────────┘
        │
        ▼
渲染 ResultView：雷达图 + 命中/缺失关键词 + 建议 + 置信度 + 免责横幅
        │
        ▼
可选：AI 改写(rewrite) / STAR扩写(star) / 档案沉淀(localStorage) / 分享卡片导出
```

**关键设计原则（改代码时必须遵守）**：
1. **双轨评分**：规则引擎永远先跑、永远兜底；AI 只是覆盖/修正。任何 AI 失败都不允许中断主流程。
2. **隐私红线**：简历文本只在浏览器内存里处理，**禁止**上传服务端/写后端存储/写 localStorage（除非用户主动开启档案且仅存脱敏快照）。
3. **防幻觉三件套**：置信度标注（低/中/高）+ 顶部固定「AI 建议仅供参考」横幅 + 缺口区分硬技能/表达缺口并给可行动路线。
4. **降级可用**：无 `DEEPSEEK_API_KEY`、AI 超时（前端 8s / 云函数上游 20s）→ 自动降级规则结果，不展示依赖 AI 的功能区。

---

## 6. 目录结构与关键文件职责

```
job-helper/
├── app/
│   ├── layout.tsx            # 根布局：导航 + ThemeProvider + 无闪烁主题脚本
│   ├── page.tsx              # 首页：简历诊断（核心流程入口）
│   ├── star/page.tsx         # STAR 描述生成器
│   ├── editor/page.tsx       # 简历编辑器（6 套模板）
│   ├── preview/page.tsx      # 简历预览 / 打印导出 PDF
│   ├── profile/page.tsx      # 私人职业档案（快照列表 + 成长对比图）
│   ├── vertical/page.tsx     # 垂直人群模板
│   ├── campus/page.tsx       # 高校 B2B2C 落地页
│   └── error.tsx / global-error.tsx  # 路由级 + 根级错误边界
├── components/
│   ├── NavBar.tsx / ThemeToggle.tsx   # 导航 + 暗色切换
│   ├── ErrorBoundary.tsx              # 组件级错误边界（包裹图表等易崩模块）
│   ├── KeywordChip.tsx                # 可点击展开含义的关键词 chip（ⓘ 字典）
│   ├── ResultView.tsx                 # 诊断结果页（雷达图用 ErrorBoundary 包裹）
│   ├── StarGenerator.tsx / PrivacyModal.tsx
│   ├── resume/ResumeDocument.tsx      # 简历渲染（6 套模板）
│   └── ui/                            # Button / Card / Field / Input 基础组件
├── lib/
│   ├── pdf.ts              # PDF 文本提取（unpdf）
│   ├── diagnose.ts         # 浏览器端诊断编排（规则 → AI 增强 → 近义修正 → 输出）
│   ├── scoring.ts          # ★ 规则评分引擎（5 维权重、关键词命中、量化正则、强动词）
│   ├── ai-client.ts        # 调用 ai-proxy 的封装（失败返回 null → 降级）
│   ├── keywords.ts         # 技能/教育/经历关键词 + 125+ 条含义字典
│   ├── jd-library.ts       # 12 行业 × 中/英 JD 示例库
│   ├── profile.tsx         # 私人档案 Context（localStorage，快照 ≤50 条）
│   ├── theme.tsx           # 主题 Context + 无闪烁初始化脚本
│   ├── resume-store.tsx    # 简历状态（本地持久化）
│   ├── track.ts            # 轻量埋点（navigator.sendBeacon，可 no-op）
│   └── types.ts            # 共享类型（ProfileSnapshot 等）
├── cloudfunctions/
│   └── ai-proxy/           # ★ CloudBase HTTP 云函数，隐藏 DeepSeek Key
│       ├── index.js        # 4 个 action：analyze / jdSemantics / rewrite / star
│       └── scf_bootstrap   # 云函数启动配置
├── scripts/                # 生成中/英测试 PDF（make-test-pdf*.cjs/py）
├── .env.example            # 环境变量模板（复制为 .env.local）
└── AGENTS.md               # next dev 自动生成（会重写，别手动改）
```

---

## 7. 核心逻辑细节

### 7.1 规则评分引擎（`lib/scoring.ts`）

- 输入：简历文本 + JD 文本（均转小写比对）。
- 五维评分（各 0-100）与权重：**技能匹配 0.30 / 关键词覆盖 0.20 / 经历与成果 0.25 / 教育背景 0.10 / 表达规范 0.15**，总分 = Σ(维分×权重) 取整。
- ⚠️ **权重校准背景（2026-08-18）**：从「纯关键词命中」下调了技能匹配权重、上调了经历与成果权重——目的是避免 JD 未识别到技能词时分数虚高/虚低。**修改权重前先读这段注释，别凭直觉改回去。**
- 维度定义：
  1. 技能匹配：JD 要求技能在简历中的命中比例
  2. 关键词覆盖：JD 全文技能+经历类关键词覆盖率
  3. 经历与成果：实习/项目词 + 量化正则 `\d+(\.\d+)?\s*(%|万|人|次|天|倍|分|名|篇|项|个|家)` + 强动词
  4. 教育背景：学历词 + JD 专业方向匹配
  5. 表达规范：结构分段 + 标点 + 内容长度
- 关键词库扩展：直接编辑 `SKILL_KEYWORDS` / `EXPERIENCE_KEYWORDS` / `EDUCATION_KEYWORDS` 数组。

### 7.2 云函数 `ai-proxy` API

`POST {NEXT_PUBLIC_AI_PROXY_URL}`，JSON 统一封装 `{ action, ...payload }`，返回 `{ ok: true, data }` 或 `{ ok: false, error }`：

| action | 字段 | 说明 |
|---|---|---|
| `analyze` | `resumeText`, `jdText` | AI 评分与建议，覆盖/修正规则结果 |
| `jdSemantics` | `jdText` | JD 语义解析：核心技能 + 近义表述（如「机器学习≈深度学习」），用于修正关键词命中并重算总分 |
| `rewrite` | `resumeText`, `jdText`, `missingKeywords` | 基于简历既有经历的改写句（**禁止虚构**），返回 original/rewritten/reason |
| `star` | `experience` | STAR 四步拆解 + 完整句式 + 使用建议 |

- 请求体限制 ≤1MB（防滥用）。重部署必须保持 HTTP 函数形态：`tcb fn deploy ai-proxy --httpFn`。

### 7.3 隐私与安全（红线，不可违反）

- 简历文本仅在浏览器内存参与解析与评分，分析完即弃，无后端落库。
- DeepSeek Key 仅存于云函数环境变量，前端经代理调用，永不暴露 Key。
- 私人档案默认关闭；开启后仅写 `localStorage` 脱敏快照（目标岗位/总分/五维/置信度/时间戳，≤50 条），可导出 `.json`、可清除。
- 首页「AI 增强诊断」开关可完全关闭 AI（关闭后不发任何外部请求）。

---

## 8. 环境变量（`.env.local`，模板见 `.env.example`）

| 变量 | 必填 | 说明 |
|---|---|---|
| `DEEPSEEK_API_KEY` | 可选 | 不配置则降级为纯规则评分，功能不中断 |
| `DEEPSEEK_BASE_URL` | 可选 | 默认 `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | 可选 | 默认 `deepseek-chat` |
| `NEXT_PUBLIC_AI_PROXY_URL` | 可选 | AI 代理云函数网关地址，构建时内联；不配置用代码默认值 |
| `NEXT_PUBLIC_TRACKING_URL` | 可选 | 埋点上报端点；不配置则完全静默 |

> 本地 `.env.local` 已存在（含本地配置，勿提交到 git——已在 .gitignore）。

---

## 9. 常用命令

```bash
npm run dev        # 开发服务器 http://localhost:3000
npm run build      # 生产构建（静态导出到 out/）
npm run start      # 预览构建产物（npx serve out）
npm run typecheck  # tsc --noEmit
npm run lint       # eslint + tsc --noEmit
```

测试：`npm run dev` 后，用 `scripts/make-test-pdf-cn.py`（需 pip install fpdf2）生成中文测试 PDF，走完整诊断流程。

---

## 10. 部署（当前：CloudBase 静态托管）

1. `npm run build` 生成 `out/`（build 前自动跑 `scripts/make-version.mjs`，生成版本号写入 `public/version.txt` + `lib/version.ts`，页面导航栏底部显示「版本 …」）
2. 静态托管：`manageHosting(action="enableService")` → `upload(localPath="out", cloudPath="/")` → `setWebsiteDocument(indexDocument="index.html", errorDocument="404.html")`
3. ⚠️ `next build` 会清理 `.next`/`out`；若构建环境清理受限，可构建到干净子目录（拷贝源码 + 复用上层 node_modules）再上传产物。若 `out/` 目录本身被 OS 句柄锁住（rmdir EBUSY），改在 C 盘 Temp 全量构建（`npm ci` + `next build`），再文件级复制 `cp -r tmp/out/. out/`。
4. 云函数重部署保持 HTTP 形态：`tcb fn deploy ai-proxy --httpFn`
5. 线上地址：`https://xiaoxin2026-personal-d1acf1a1fb0-1469931868.tcloudbaseapp.com/`
6. **版本验证**：部署后 `curl https://<域名>/version.txt` 即得当前线上版本号（格式 `YYYYMMDD-HHmm-<git短hash>`），并同步告知用户版本号。

---

## 11. 文档索引

| 文档 | 路径 | 何时读 |
|---|---|---|
| 交接说明（本文件） | `AGENT_HANDOFF.md` | 总是 |
| PRD | `../求职在线助手-PRD.md`（工作区根目录） | 做功能/验收时 |
| 验证报告 | `../求职产品需求验证报告.md` | 决策背景、商业论证 |
| README | `README.md` | 给人类看的快速上手 |
| 历史优化方案 | `../优化方案.html`（工作区根目录） | 参考（历史方案记录） |

---

## 12. 已知限制

- **不支持扫描件（图片型 PDF）**，仅文字版 PDF（Word/WPS 导出即文字版），UI 有明确提示。
- 关键词库基于常见岗位 JD 预置，极端冷门术语可能识别不全（可扩展 `lib/keywords.ts` / `lib/scoring.ts`）。
- AI 增强依赖 DeepSeek Key，费用约 10-30 元/月。
- 无用户账号体系，档案仅存本机浏览器（跨设备需手动导出/导入 `.json`）。

---

## 13. 给 AI Agent 的硬性工作守则（红线）

1. **Next.js 16 有破坏性变更**：`AGENTS.md` 明确要求——写代码前先查 `node_modules/next/dist/docs/` 相关指南，不要凭 13/14 时代的记忆写。`AGENTS.md` 由 `next dev` 自动生成/重写，**不要手动改它**，也不要在 diff 里删它。
2. **隐私红线不可触碰**：禁止把简历原文上传服务端/写后端存储/localStorage；禁止在代码里暴露 DeepSeek Key。
3. **防幻觉约束**：AI 改写禁止虚构经历/数据；诊断输出必须带置信度与免责横幅。
4. **降级优先**：任何 AI 相关改动都要保证无 Key/失败时主流程 100% 可用。
5. **权重校准**：改 `scoring.ts` 权重前先读 7.1 的校准注释，别把「技能匹配 0.30 / 经历与成果 0.25」凭直觉改回旧值。
6. **静态导出约束**：`output: "export"` 意味着无服务端路由，页面一律静态；新增功能不得依赖 SSR/API Routes（AI 走云函数代理）。

---

## 14. 建议的下一步（Roadmap 排序）

按 PRD Roadmap 与商业优先级：

1. **用户账号体系 + 诊断历史云端存储**（Supabase Auth + PostgreSQL）——档案跨设备，解锁长期职业建模价值
2. **多简历对比**
3. **B2B2C 试点落地**（`/campus` 已有入口，需接真实留资/机构开通）
4. **付费解锁深度报告**（用户量起来后再开放）
5. **简历代写 / 求职咨询引流**

---

*本文档由 AI Agent 编写，基于验证报告、PRD、README 与工程代码交叉核对。若代码与本文档不一致，以代码为准并及时更新本文档。*
