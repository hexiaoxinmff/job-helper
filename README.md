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

> AI 改写与 STAR 生成依赖 DeepSeek API（需配置 `DEEPSEEK_API_KEY`）；评分与建议在无 key 时自动降级为规则引擎，功能不中断。

## 🛠 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | Next.js 16（App Router）+ Tailwind CSS | 前后端一体，少学一套框架 |
| 后端 | Next.js API Routes（Route Handlers） | 无独立后端，部署简单 |
| PDF 解析 | unpdf | 内置 pdf.js，无 worker 兼容问题 |
| 可视化 | Recharts | 雷达图 |
| AI 增强 | DeepSeek API（可选） | 未配置 key 时自动降级为规则评分 |
| 部署 | Vercel（推荐） | 免备案、免费、自动部署 |

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

## 📁 项目结构

```
job-helper/
├── app/
│   ├── layout.tsx            # 根布局（含顶部导航）
│   ├── page.tsx              # 首页：简历诊断
│   ├── star/page.tsx         # 独立页面：STAR 描述生成器
│   └── api/
│       ├── analyze/route.ts  # 分析 API（PDF 解析 → 评分 → AI 增强）
│       ├── rewrite/route.ts  # AI 改写 API（缺失关键词 → 改后文案）
│       └── star/route.ts     # STAR 生成 API（经历 → STAR 句式）
├── components/
│   ├── NavBar.tsx            # 左侧导航栏（桌面）/ 顶部导航（移动端）
│   ├── KeywordChip.tsx       # 可点击展开含义的关键词 chip
│   ├── StarGenerator.tsx     # STAR 生成器 UI（独立组件，可复用）
│   └── ResultView.tsx        # 简历诊断结果页
├── lib/
│   ├── pdf.ts                # PDF 文本提取（unpdf）
│   ├── scoring.ts            # 规则评分引擎
│   ├── ai.ts                 # DeepSeek AI（建议/改写/STAR 三个调用）
│   ├── keywords.ts           # 关键词库 + 含义字典
│   └── types.ts              # 共享类型
├── scripts/
│   ├── make-test-pdf.cjs     # 生成测试 PDF（英文）
│   └── make-test-pdf-cn.py   # 生成中文测试 PDF
└── .env.example              # 环境变量模板
```

## 🔧 开发指南

### 评分引擎（lib/scoring.ts）

5 个维度，各 0-100 分，加权汇总为总分（权重 0.35/0.2/0.2/0.1/0.15）：

1. **技能匹配**：JD 要求的技能关键词在简历中的命中比例
2. **关键词覆盖**：JD 全文关键词（技能+经历类）覆盖率
3. **经历与成果**：实习/项目关键词 + 量化数据（% 万 人 次 等）+ 强动词
4. **教育背景**：学历关键词 + JD 专业方向匹配
5. **表达规范**：结构分段 + 标点 + 内容长度

自定义关键词库：直接编辑 `lib/scoring.ts` 中的 `SKILL_KEYWORDS` / `EXPERIENCE_KEYWORDS` / `EDUCATION_KEYWORDS` 数组。

### AI 增强（lib/ai.ts）

- 有 `DEEPSEEK_API_KEY` → 调用 DeepSeek 生成评分+建议，覆盖规则结果
- 无 key / 调用失败 → 返回 `null`，API 自动回退到规则结果，不影响使用

### API 说明

`POST /api/analyze`（multipart/form-data）：

| 字段 | 类型 | 说明 |
|---|---|---|
| resume | File | 简历 PDF（必填，≤10MB，文字版） |
| jd | string | 目标岗位 JD（必填，≥20 字） |

返回：`{ overallScore, dimensions[], matchedKeywords[], missingKeywords[], suggestions[], aiEnhanced, resumeLength }`

`POST /api/rewrite`（multipart/form-data，需 DEEPSEEK_API_KEY）：

| 字段 | 类型 | 说明 |
|---|---|---|
| resume | File | 简历 PDF（必填） |
| jd | string | 目标岗位 JD（必填） |

返回：`{ rewrites: [{ keyword, original, rewritten, reason }] }`

`POST /api/star`（JSON，需 DEEPSEEK_API_KEY）：

| 字段 | 类型 | 说明 |
|---|---|---|
| experience | string | 一段经历描述（必填，≥5 字） |

返回：`{ star, parts: [{label, content}], tips[] }`

## 🧪 本地测试

```bash
# 1. 启动服务
npm run dev

# 2. 生成中文测试 PDF（首次需 pip install fpdf2）
python scripts/make-test-pdf-cn.py

# 3. 调用 API
curl -X POST http://localhost:3000/api/analyze \
  -F "resume=@scripts/test-resume-cn.pdf;type=application/pdf" \
  -F "jd=岗位职责：负责数据分析、报表开发。任职要求：熟练使用 Python、SQL、机器学习，有实习经验者优先。"
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
