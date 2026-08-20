# MASTER.md — 求职在线助手（Recall）设计系统

> 文档版本：v1.0  
> 编制日期：2026-08-20  
> 性质：**唯一权威设计系统**。所有页面、组件、新功能开发前必须阅读本文件，并以其为验收基准。  
> 关联文档：《求职在线助手-PRD.md》（需求）、《UI-UX设计文档.md》（设计规范 v1.0，本文件为其可执行升级版）  
> 适用范围：`job-helper`（Next.js 16 + Tailwind CSS v4 + Recharts）、后续所有 Web 端迭代；小程序端（`job-helper-mini`）仅参考色彩语义，不直接套用本文件的布局规则。

---

## 1. 产品类型与设计定位

### 1.1 产品类型

**工具型 AI 求职助手（Web 应用，静态导出）**，不是营销站、不是内容站、不是 Saas 后台。

| 维度   | 结论                        | 对设计的含义                    |
| ---- | ------------------------- | ------------------------- |
| 核心任务 | 上传简历 + 粘贴 JD → 匹配诊断 → 改简历 | 单栏线性流程，**每屏一个主操作**，不搞多栏栅格 |
| 使用频率 | 低频高 stakes（秋招/春招洪峰）       | 首屏 3 秒破冰，30 秒出结果；不做沉浸式浏览  |
| 用户   | 应届生/转行者，学生为主，价格敏感         | 文案直白不营销，免费感清晰，隐私承诺常驻      |
| 信任核心 | 隐私 + 诚实诊断                 | 界面是「信任的载体」：给理由、给置信度、给数据主权 |

### 1.2 一句话设计定位

**一个让求职者「3 秒破冰、30 秒出结果、全程敢信」的诚实型 AI 职业教练。**

### 1.3 设计原则（对齐 PRD D-01~04，全部必须执行）

| #           | 原则                                                                                | 界面表达（硬性要求） |
| ----------- | --------------------------------------------------------------------------------- | ---------- |
| D-01 隐私优先   | 隐私承诺常驻可见（上传区底部 `PrivacyNote` + 首次 `PrivacyModal`）；AI 开关前置到核心流程，文案写明「不留存」；档案开关默认关闭 |            |
| D-02 零门槛破冰  | 首屏 = 一个大上传区 + 一个「开始诊断」主按钮，不要求先填任何表单；示例 JD 一键加载                                    |            |
| D-03 诚实而非讨好 | 结果不只一个分数：维度、命中/缺失关键词、置信度徽章、顶部免责横幅、缺口区分「硬技能/表达」两类路线                                |            |
| D-04 可降级    | 无 AI 时界面自动收敛：AI 依赖区块（改写/优化/置信度徽章）隐藏，核心诊断链路 100% 可用；降级是静默的                         |            |

### 1.4 体验基调（Tone of Voice）

- 界面文案：短句、动词开头。「点击选择或拖拽简历 PDF 到此处」，不说「请选择您的简历文件以进行上传」。
- 错误文案：为什么 + 怎么办。「JD 内容过短，请粘贴完整的职位描述」。
- AI 输出：克制、可追溯、带边界。「AI 建议仅供参考」是常驻横幅，不是免责小字。
- 禁用：营销腔（「开启你的 AI 求职新时代」）、恐吓腔、过度承诺。

---

## 2. 页面类型与设计目标

| 页面       | 路由           | 类型    | 设计目标                     |
| -------- | ------------ | ----- | ------------------------ |
| 简历诊断（核心） | `/`          | 表单流   | 3 秒破冰；线性 4 步；错误具体可恢复     |
| 诊断结果     | `ResultView` | 数据展示  | 分数即锚点；诚实分层（维度→关键词→建议→路线） |
| 简历编辑器    | `/editor`    | 工具表单  | 长表单不焦虑：分段卡片 + 实时缩略预览     |
| 简历预览     | `/preview`   | 文档渲染  | 白底 A4，打印友好，导航隐藏          |
| STAR 生成器 | `/star`      | AI 工具 | 紫色=AI 心智；四步拆解清晰          |
| 私人档案     | `/profile`   | 数据页   | 数据主权可视化；成长轨迹鼓励留存         |
| 投递追踪     | `/tracker`   | 数据页   | 表格/看板可扫读；状态色一致           |
| AI 模拟面试  | `/interview` | AI 对话 | 会话沉浸；加载反馈明确              |
| 垂直模板     | `/vertical`  | 获客页   | 人群卡扫读；一键进编辑器             |
| 高校入口     | `/campus`    | 营销落地页 | 允许品牌化，但同令牌体系             |

**导航顺序 = 产品漏斗**：先用（诊断）→ 改（编辑器）→ 练（面试）→ 追（追踪）→ 写（STAR）→ 沉淀（档案）→ 人群（垂直）→ 渠道（高校）。

---

## 3. 颜色系统（Tokens）

### 3.1 色板体系

7 组语义色板，每组 50~950 共 11 档，**light/dark 共用档位值**，暗色通过 `dark:` 前缀切档位。组件**禁止硬编码 hex**（唯一例外见 §10 豁免）。

| 色板        | 色相家族      | 用途（语义锚点，不可串用）                                     |
| --------- | --------- | ------------------------------------------------- |
| `neutral` | slate 灰   | 文字层级、边框、背景（90% 场景）                                |
| `primary` | indigo 靛蓝（Stripe-inspired） | 主操作、导航激活、链接、主进度、总分锚点 |
| `success` | emerald 绿 | 命中、高置信度、成功、已加入                                    |
| `warning` | amber 琥珀  | 免责横幅、中置信度、≥60 分                                   |
| `danger`  | red 红     | 错误、缺失关键词、低分、删除、硬技能缺口                              |
| `info`    | sky 天蓝    | 表达缺口、辅助信息                                         |
| `accent`  | purple 紫  | **AI 专属色**：AI 增强徽章、AI 改写/优化、STAR 生成器（「紫色=AI」认知锚点） |

### 3.2 关键语义色（随主题切换）

| Token                | Light                | Dark               | 用途                             |
| -------------------- | -------------------- | ------------------ | ------------------------------ |
| `--jh-bg`            | `#f8fafc`            | `#020617`          | 页面背景                           |
| `--jh-bg-elevated`   | `#ffffff`            | `#0f172a`          | 卡片/弹层                          |
| `--jh-bg-muted`      | `#f1f5f9`            | `#1e293b`          | 次级背景/hover/内嵌块                 |
| `--jh-fg`            | `#0f172a`            | `#e2e8f0`          | 正文                             |
| `--jh-fg-muted`      | `#475569`            | `#94a3b8`          | 次要文字                           |
| `--jh-fg-faint`      | `#94a3b8`            | `#64748b`          | 弱化/占位（仅辅助信息，见 §10）             |
| `--jh-border`        | `#e2e8f0`            | `#1e293b`          | 默认边框                           |
| `--jh-border-strong` | `#cbd5e1`            | `#334155`          | 强调边框/输入框                       |
| `--jh-overlay`       | `rgb(15 23 42 / .5)` | `rgb(2 6 23 / .6)` | **弹窗遮罩唯一来源**（组件用 `bg-overlay`） |

### 3.3 图表色（`--chart-series-*`）

总分→primary-600 / 技能匹配→success-600 / 关键词覆盖→warning-600 / 经历与成果→accent-600 / 教育背景→pink `#db2777` / 表达规范→cyan `#0891b2`（后两者为图表专用色，豁免于语义色板）。暗色下提亮一档。

### 3.4 分数颜色语义（注意：语义色，非涨跌色）

≥80 绿（优秀）/ ≥60 琥珀（良好）/ ≥40 中性灰或橙（一般）/ <40 红（待改进）。

---

## 4. 字体排印（Typography）

### 4.1 字体栈

系统字体栈，**不引入 Web Font**（静态导出零网络依赖、快）：

```
--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto,
  "PingFang SC", "Microsoft YaHei", sans-serif;
```

### 4.2 字号层级（Tailwind 默认 scale，全站只有这几档）

| 层级    | 类                                          | 用途               |
| ----- | ------------------------------------------ | ---------------- |
| 页面 H1 | `text-3xl font-bold`                       | 仅首页诊断（全站唯一 H1）   |
| 大数字   | `text-5xl font-bold`                       | 结果页总分（唯一视觉锚点）    |
| 卡片标题  | `text-base font-semibold`（`text-lg` 仅弹窗标题） | 卡片内 `h2`/弹窗 `h3` |
| 正文    | `text-sm`                                  | 默认密度（信息量大，紧凑）    |
| 辅助/弱化 | `text-xs`                                  | 说明、时间戳、徽章        |
| 版本号   | `text-[10px]`（豁免例外）                        | 侧栏/移动菜单版本行       |

- 数字用 `tabular-nums` 对齐（总分/维度分竖排对齐）。
- 禁止随意 `text-lg/xl/2xl` 提升层级；层级靠字重与颜色区分，不靠字号堆叠。

---

## 5. 圆角 / 阴影 / 间距（Shape & Rhythm）

### 5.1 圆角：全站只有三级「形状语言」

| 级别 | Token                      | 用途                     |
| -- | -------------------------- | ---------------------- |
| 全圆 | `--jh-radius-full`         | 徽章、chip、switch 滑块、序号圆点 |
| 卡片 | `--jh-radius-2xl` (1rem)   | **所有页面内容块**            |
| 控件 | `--jh-radius-xl` (0.75rem) | 主按钮、输入框、textarea、内嵌块   |
| 辅助 | `--jh-radius-lg` (0.5rem)  | 导航项、select、小按钮、tooltip |

规则：**卡片一律 2xl；主输入/主按钮一律 xl；辅助控件 lg；chip/徽章 full**。内嵌块比外层小一级（外层 2xl → 内嵌 xl）。

### 5.2 阴影：分层哲学

亮色靠「白卡片 + 浅边框」分层，暗色靠「深色块 + 更深的边框」分层；**阴影只作为浮层/交互反馈**，禁止大面积投影。

| Token             | 用途          |
| ----------------- | ----------- |
| `shadow-sm`       | 卡片默认（几乎不可见） |
| `shadow-md`       | hover 浮起    |
| `shadow-lg`       | 移动端折叠面板     |
| `shadow-xl`/`2xl` | 弹窗          |

### 5.3 间距

- 页面卡片间：`space-y-6`（1.5rem）
- 卡片内 padding：`p-6`（1.5rem）
- 区块小标题下：`mb-4`（1rem）
- 卡片内条目间：`space-y-3`（0.75rem）
- 语义 token：`--jh-space-xs~4xl`（0.5rem→4rem），组件禁止拍脑袋写 `p-7`/`gap-7` 等非档位值。

---

## 6. 布局系统（响应式）

### 6.1 全局框架

```
桌面 ≥768px                         移动 <768px
┌─────────┬──────────────────┐      ┌──────────────────┐
│ Logo    │                  │      │ 顶栏: Logo·主题·汉堡│
│ 导航(8项)│  主内容区          │      ├──────────────────┤
│ 外观/版本│  max-w-3xl        │      │   折叠面板(点击展开) │
├─────────┤  mx-auto 居中      │      └──────────────────┘
│ 固定 224px│  单栏线性          │      主内容 max-w-3xl
└─────────┴──────────────────┘
```

### 6.2 断点规则（全站仅两档）

| 断点               | 行为                                                         |
| ---------------- | ---------------------------------------------------------- |
| `< 768px`（默认）    | 移动顶栏（sticky h-12）+ 折叠导航；内容区单栏；按钮竖排                         |
| `≥ 768px`（`md:`） | 左侧固定 224px 侧栏；主内容 `md:pl-56`；操作区横排                         |
| `≥ 640px`（`sm:`） | 卡片内部允许 2 列网格（如反向推荐 3 列 `sm:grid-cols-3`、操作区 `sm:flex-row`） |

- 内容区始终 `max-w-3xl mx-auto` **单栏**，不采用多栏栅格（诊断流程线性）。
- 打印：导航 `print:hidden`，`main` 清 padding，模板容器解除 max-w。
- 雷达图/维度明细：`flex-col md:flex-row`，移动端图表 100% 宽。

---

## 7. 组件规范与状态矩阵

> 所有组件必须覆盖状态：`default / hover / focus-visible / active / disabled / loading / error / empty`。  
> 焦点环统一：`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-{semantic}-500 focus-visible:ring-offset-2`。

### 7.1 按钮 Button（`components/ui/Button.tsx`）

| 变体          | 样式                                       | 用途          |
| ----------- | ---------------------------------------- | ----------- |
| `primary`   | `bg-primary-600` hover 700 active 800，白字 | 每屏唯一主按钮     |
| `secondary` | `bg-neutral-100` 灰                       | 次级操作        |
| `outline`   | 白底 + 边框                                  | 并行操作（复制/再测） |
| `ghost`     | 透明                                       | 弱操作（重新生成）   |
| `danger`    | `bg-danger-600`                          | 破坏性操作       |

- 尺寸：`sm` px-3 py-1.5 / `md` px-4 py-2 / `lg` px-4 py-3.5（全宽主操作）。
- 状态：`disabled:opacity-50 cursor-not-allowed`；loading 内联 spinner（`border-current/30 border-t-current`）；`active:scale-[0.98]`。
- **每屏只有一个主按钮**；主按钮常驻宽 100%；三键以上用 `flex-1` 等宽横排（移动竖排）。

### 7.2 卡片 Card（`components/ui/Card.tsx`）

`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm`（暗色 `border-neutral-800 bg-neutral-900`）。标题 `h3 text-base font-medium` + `mb-3`。卡片间 `space-y-6`，不嵌套圆角冲突。

### 7.3 输入控件（`components/ui/Input.tsx` 的 `fieldClass`）

- 主输入（Input/Textarea）：`rounded-xl`、`border-neutral-300`、`px-3 py-2`、`text-sm`；focus `ring-2 ring-primary-500`（textarea 再加 `ring-primary-100` 淡环 + `resize-y`）。
- 辅助控件（select 等小控件）：`rounded-lg` 与主输入区分层级。
- **页面内禁止手写同款类**，一律引用 `fieldClass`（见 §12 实现映射），保证状态完全一致。
- 校验错误：`Alert variant="danger"` + `role="alert"`，不打断已填内容。

### 7.4 开关 Switch

`role="switch"` + `aria-checked` + `aria-label`；`h-6 w-11 rounded-full`，开=primary-600，滑块 `h-5 w-5 bg-white shadow`，`translate-x` 过渡。**必须有可读的相邻文字说明**（如「AI 增强诊断」+ 副文案）。

### 7.5 关键词 Chip（`KeywordChip`）

命中=`success-100/700`，缺失=`danger-100/700`，`px-2.5 py-1 text-xs rounded-full`。带字典的 chip 显示 `ⓘ`，点击弹 tooltip（`role="tooltip"`）。按钮需 focus-visible 环。

### 7.6 徽章 Badge

置信度：高=success / 中=warning / 低=neutral，`rounded-full px-2 py-0.5 text-xs`。「AI 增强」=accent-100/700。缺口类型：「表达缺口」=info，「硬技能缺口」=orange（全站唯一 orange 用途，作「需要行动」信号）。

### 7.7 警示横幅 / 提示块（`ui/Alert.tsx`）

| variant   | role      | 用途                  |
| --------- | --------- | ------------------- |
| `warning` | status    | 免责横幅（结果页最顶，可导出区内保留） |
| `danger`  | **alert** | 校验错误（即时，打断播报）       |
| `success` | status    | 成功回执                |
| `info`    | status    | 降级提示                |

圆角 `rounded-xl`，浅底深字；暗色 `950/40` 半透明底。隐私承诺 `PrivacyNote`：`neutral-50` 底小字常驻表单底部。

### 7.8 弹窗 Modal

- 遮罩：**统一 `bg-overlay`（即 `--jh-overlay`）+ `backdrop-blur-sm`**，禁止 `bg-black/50` 等其它写法。
- 结构：`role="dialog"` + `aria-modal="true"` + `aria-labelledby`（+ `aria-describedby`）。
- 键盘：ESC 关闭；Enter 确认；打开时焦点移入（破坏性操作聚焦「取消」防误触）。
- 动画：遮罩 `animate-privacy-fade` 0.2s + 内容 `animate-privacy-pop` 0.25s `cubic-bezier(0.16,1,0.3,1)`；尊重 `prefers-reduced-motion`。
- 用途：隐私承诺（首次）、确认对话框、导入对话框、优化结果预览。

### 7.9 进度 / 加载

- 诊断进度：雷达骨架预览 + 进度条（`bg-primary-600`，宽随步骤）+ `aria-live="polite"` 步骤文案。
- 按钮 loading：内联 spinner，禁用态。
- 空态：上传区 📄 引导、档案未开启说明、无快照空态——都给出下一步动作。

### 7.10 图表（Recharts）

- 雷达图：`outerRadius 70%`，grid/stroke 引用 `--chart-*` 变量，随主题切换。
- 折线图（档案成长）：6 系列引用 `--chart-series-1..6`。
- **每个图表组件必须被 `ErrorBoundary` 包裹**，fallback = 文案 + 重试按钮。

---

## 8. 主题系统（亮/暗）

- 切换：`ThemeToggle`（桌面侧栏 + 移动顶栏），偏好持久化 `localStorage`（key `job-helper:theme`）。
- **无闪烁（FOUC）**：`THEME_INIT_SCRIPT` 首屏内联脚本在渲染前读偏好挂 `.dark`。
- 实现：`@custom-variant dark` + `:root/.dark` 双份语义变量 + `dark:` 前缀类。
- 导出图片：`html.export-capture` 捕获态强制亮色（`dark:` 变体失效），导出白底深字不刺眼。

---

## 9. 可访问性标准（WCAG 2.1 AA，强制）

| 项    | 标准                          | 本项目执行                                                                                                                          |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 对比度  | 正文 ≥ 4.5:1                  | 正文 neutral-700/800 on white ≥ 7:1；dark 用 neutral-200。弱化文字 neutral-400 仅限辅助信息（豁免，见 §10）                                         |
| 键盘可达 | 全部交互可 Tab 到达、Enter/Space 触发 | 上传区 `role="button" tabIndex=0`；switch 原生按钮；tooltip 可聚焦触发                                                                       |
| 焦点可见 | `:focus-visible` 环 ≥ 2px    | 全局 ring-2 + ring-offset-2；**裸按钮必须补**                                                                                           |
| 语义   | 正确的 role/aria               | `role="dialog"`、`role="switch"`、`role="alert"`、`role="status"`、`aria-current="page"`、`aria-live`、`aria-label`；skip link「跳到主内容」 |
| 动效   | 尊重 `prefers-reduced-motion` | 弹窗动画、进度条 transition、按钮 active 缩放全部降级/关闭                                                                                        |
| 目标尺寸 | 触控目标 ≥ 24px（AA），推荐 44px     | 主按钮 ≥ 44px；icon 按钮 36px（24px 达标，记录为改进项）                                                                                        |
| 文档结构 | 单一 H1、层级正确                  | 仅首页 H1；卡片用 h2/h3                                                                                                               |
| 打印   | 内容可打印                       | 导航隐藏、白底、`break-inside: avoid`                                                                                                  |

---

## 10. 已知豁免与例外（记录在案，新增时须评审）

1. **简历模板专有色**（`template-meta.ts` / `ResumeDocument.tsx` 的 accent/正文色）：属于「用户导出的简历文档」设计，非产品 UI，允许硬编码（打印导出需固定色值）。
2. **弱化文字 neutral-400**（`#94a3b8`，对比 2.9:1）：仅用于 hint/时间戳/占位等**非关键**信息；关键信息（正文、错误、链接）禁止使用。
3. **版本号 `text-[10px]`**：弱化辅助信息，固定例外。
4. **图表专用色**（pink/cyan）：`--chart-series-5/6`，仅图表使用。
5. **`--jh-overlay` 遮罩**：曾出现 `bg-black/50`（ResultView）、`bg-neutral-900/50`（PrivacyModal/ConfirmDialog）两套写法，**已统一为 `bg-overlay`**，新代码一律用 token。

---

## 11. 令牌 ↔ 实现映射

| 设计概念 | 实现文件                                                                        |
| ---- | --------------------------------------------------------------------------- |
| 令牌定义 | `app/globals.css`（`--jh-*`）、`lib/theme.tsx`（JS 注册表 + `resolveThemeVars`）    |
| 全局框架 | `app/layout.tsx`、`components/NavBar.tsx`、`ThemeToggle.tsx`                  |
| 基础组件 | `components/ui/`：Button / Card / Field / Input（导出 `fieldClass`）/ Alert      |
| 首页诊断 | `app/page.tsx`                                                              |
| 结果页  | `components/ResultView.tsx`、`KeywordChip.tsx`                               |
| 图表   | `components/CareerModelChart.tsx`、ResultView 内嵌雷达                           |
| STAR | `components/StarGenerator.tsx`                                              |
| 档案   | `lib/profile.tsx`、`app/profile/ProfileClient.tsx`                           |
| 弹窗   | `PrivacyModal.tsx`、`ConfirmDialog.tsx`、`ImportDialog.tsx`、`PrivacyNote.tsx` |
| 错误兜底 | `ErrorBoundary.tsx`、`app/error.tsx`、`global-error.tsx`                      |

---

## 12. 走查清单（Go/No-Go，合入前逐项打勾）

- [ ] 每屏只有一个主按钮
- [ ] 隐私承诺在核心流程可见（上传页底部 + 首次弹窗）
- [ ] 结果页顶部免责横幅存在且可导出
- [ ] 所有 AI 增强输出带置信度标注
- [ ] 无 AI 时隐藏 AI 依赖区块，核心功能可走通
- [ ] 所有颜色来自令牌，无硬编码 hex（除 §10 豁免）
- [ ] 输入控件一律用 `fieldClass`，不手写同款类
- [ ] 弹窗遮罩统一 `bg-overlay`
- [ ] 图表均有 ErrorBoundary 包裹
- [ ] 亮/暗双主题下对比度达标、图表可读
- [ ] 暗色切换无 FOUC 闪烁
- [ ] 所有可交互元素有 focus-visible 环
- [ ] 动效尊重 prefers-reduced-motion
- [ ] 移动端导航可用、表单不溢出、按钮不挤
- [ ] 简历任何环节不落盘（无后端存储、无意外 localStorage 写入）
