// 差距补救路线图（#7）：把缺失关键词升级为「90 天补位计划」的可执行资源建议。
// 硬缺口（技术/工具）→ 学习资源（课程方向 / 实操项目 / 可选考证）；
// 表达缺口（软素质/经验）→ 由 scoring.ts 的 buildGapRemediation 给出改写示例，无需资源映射。
// 纯前端静态数据，资源建议为方向性指引（不绑定具体付费平台，避免广告性质）。

export interface RemediationResource {
  /** 课程 / 教程方向建议 */
  course: string;
  /** 实操项目建议（证明掌握的最短路径） */
  project: string;
  /** 可选考证 / 认证（0-1 个，非必须） */
  cert?: string;
}

// 按关键词分组的资源建议；键用关键词原文（小写匹配）
export const REMEDIATION_RESOURCES: Record<string, RemediationResource> = {
  // —— 编程语言 ——
  "python": {
    course: "Python 官方教程 + 任一免费入门课（如菜鸟教程 / 廖雪峰），1-2 周掌握语法",
    project: "做一个自动化小工具（如批量重命名/爬取表格数据）并放 GitHub",
    cert: "Python 等级考试 / 数据分析师证书（可选）",
  },
  "java": {
    course: "Java 基础 + Spring Boot 入门（慕课网 / B 站免费课），配合官方文档",
    project: "做一个 REST API 小项目（如图书管理系统）连 MySQL",
  },
  "go": {
    course: "Go 官方 Tour + 《Go 语言圣经》前几章",
    project: "写一个并发 HTTP 服务（如短链接服务），跑 go test",
  },
  "javascript": {
    course: "MDN JavaScript 教程 + 现代 JS 教程（zh.javascript.info）",
    project: "写一个交互小页面（如 Todo 应用 / 计算器）",
  },
  "typescript": {
    course: "TypeScript 官方 Handbook（中文版）",
    project: "把一个小 JS 项目迁移到 TS 并解决类型报错",
  },
  "c++": {
    course: "C++ Primer 前 12 章 + 算法竞赛模板（洛谷/力扣入门题）",
    project: "实现一个数据结构（如红黑树/哈希表）并跑通测试",
  },
  "sql": {
    course: "SQL 必知必会（书/在线版）+ 任一 SQL 练习平台（如 SQLZoo / LeetCode SQL）",
    project: "建一个电商模拟库，写出 10+ 条查询（连表/聚合/子查询）",
  },
  "r语言": {
    course: "R for Data Science（R4DS，在线免费书）",
    project: "用 R 做一份探索性数据分析报告（ggplot2 出图）",
  },

  // —— 前端 ——
  "react": {
    course: "React 官方文档（Beta 版）+ 一个免费项目课",
    project: "做一个组件化小应用（如待办/看板）并部署上线",
  },
  "vue": {
    course: "Vue 官方文档（中文）+ 教程",
    project: "用 Vue 3 做一个可交互页面（如记账本）",
  },
  "html": { course: "MDN HTML 入门（半天）", project: "手写一个语义化静态页面" },
  "css": { course: "MDN CSS 教程 + Flex/Grid 练习", project: "还原一个设计稿页面（自适应）" },
  "next.js": {
    course: "Next.js 官方教程（Learn）",
    project: "用 Next.js 做一个博客/列表页并静态部署",
  },
  "tailwind": { course: "Tailwind 官方文档快速上手", project: "用 Tailwind 重写一个页面" },
  "webpack": {
    course: "Webpack 官方概念文档 + 一篇文章讲清楚构建流程",
    project: "从零配置一个 webpack 项目（loader/plugin/分包）",
  },
  "node.js": {
    course: "Node.js 官方入门 + Express 教程",
    project: "写一个简单 API 服务（CRUD + 中间件）",
  },

  // —— 后端与架构 ——
  "spring": {
    course: "Spring Boot 官方 Quickstart + 中文教程",
    project: "做一个带鉴权的 CRUD 接口服务连数据库",
  },
  "django": {
    course: "Django 官方教程（Tutorial）",
    project: "做一个博客/问卷站点（管理后台 + 页面）",
  },
  "flask": { course: "Flask 官方入门", project: "写一个带 REST API 的小应用" },
  "fastapi": {
    course: "FastAPI 官方教程（含中文）",
    project: "做一个带参数校验/文档的 API 服务",
  },
  "微服务": {
    course: "《微服务设计》/ 系统设计入门 + 一套微服务教程",
    project: "把一个单体拆成 2 个服务 + 网关 + 服务发现",
  },
  "docker": {
    course: "Docker 官方 Get Started",
    project: "把自己项目容器化并写 Dockerfile + compose",
  },
  "kubernetes": {
    course: "Kubernetes 官方基础教程 + kubectl 常用命令",
    project: "本地用 minikube 部署一个应用并配置伸缩",
  },
  "nginx": {
    course: "Nginx 官方文档 + 反向代理/负载均衡配置教程",
    project: "本地配一个 nginx 反代 + HTTPS 证书",
  },
  "redis": {
    course: "Redis 官方文档 + 数据类型速览",
    project: "在项目里用 Redis 做缓存/限流并写清理由",
  },
  "消息队列": {
    course: "消息队列原理入门（一篇讲清）+ RabbitMQ/Kafka 官方文档",
    project: "搭一个生产者-消费者示例（延迟/重试）",
  },
  "rabbitmq": { course: "RabbitMQ 官方 Tutorials", project: "实现一个任务队列 + 消息确认" },
  "kafka": {
    course: "Kafka 官方快速入门",
    project: "本地起 Kafka 实现流式 word count 或日志管道",
  },
  "linux": {
    course: "Linux 基础命令（文件/权限/进程）+ 鸟哥私房菜入门",
    project: "在云服务器/VM 上部署一个应用并配置 systemd",
  },

  // —— 数据与 AI ——
  "机器学习": {
    course: "吴恩达 Machine Learning（Coursera 免费旁听）",
    project: "用 scikit-learn 完成一个真实数据集分类任务并对比模型",
  },
  "深度学习": {
    course: "吴恩达 Deep Learning 系列（前 2 门）",
    project: "用 PyTorch 复现一个图像分类/文本分类小模型",
  },
  "数据分析": {
    course: "数据分析入门课（SQL + Python pandas + Excel 三件套）",
    project: "找一份开放数据集做完整分析报告（清洗→分析→可视化→结论）",
  },
  "数据挖掘": { course: "数据挖掘导论 / 机器学习基础", project: "完成一个 Kaggle 入门竞赛（Titanic/House Prices）" },
  "大数据": { course: "Hadoop/Spark 入门教程", project: "用 Spark 处理 1GB+ 数据完成聚合统计" },
  "spark": { course: "Spark 官方快速入门（PySpark）", project: "用 Spark 完成一个 ETL + 聚合任务" },
  "pandas": {
    course: "Pandas 官方 10 Minutes to pandas",
    project: "用 pandas 完成一份数据清洗与透视分析",
  },
  "numpy": { course: "NumPy 官方 Quickstart", project: "用 numpy 实现矩阵运算小工具" },
  "tensorflow": { course: "TensorFlow 官方入门", project: "训练一个 MNIST 分类模型" },
  "pytorch": {
    course: "PyTorch 官方 60 分钟入门",
    project: "用 PyTorch 训练并部署一个图像分类模型",
  },
  "scikit-learn": { course: "scikit-learn 官方示例", project: "跑通一个分类 + 交叉验证的完整流程" },
  "数据可视化": {
    course: "Tableau/Power BI 官方入门 或 Python matplotlib/echarts 教程",
    project: "做一个业务看板（3+ 图表联动）",
  },
  "tableau": { course: "Tableau 官方免费培训", project: "用 Tableau 做一个交互仪表盘" },
  "power bi": { course: "Power BI 官方入门", project: "用 Power BI 做一个数据看板" },
  "excel": {
    course: "Excel 函数/透视表免费课（VLOOKUP、SUMIFS、数据透视）",
    project: "用 Excel 完成一份数据清洗与汇总报告",
  },
  "spss": { course: "SPSS 操作入门（医学/社科常用）", project: "用 SPSS 完成一次问卷数据分析" },
  "matlab": { course: "MATLAB Onramp（官方免费）", project: "用 MATLAB 做数值计算/仿真小实验" },
  "nlp": {
    course: "自然语言处理入门（文本分类/词向量基础）",
    project: "做一个中文文本分类/情感分析 demo",
  },
  "自然语言处理": {
    course: "NLP 入门课（分词→词向量→分类）",
    project: "做一个中文评论情感分析小项目",
  },
  "大模型": {
    course: "大模型原理科普 + 提示词工程入门",
    project: "用 API 做一个 AI 应用 demo（如总结/问答工具）",
  },
  "llm": { course: "LLM 应用开发入门（LangChain 官方教程）", project: "做一个 RAG 问答 demo" },
  "rag": {
    course: "RAG 原理与实现教程（向量库 + 检索）",
    project: "用向量库给文档做检索问答（10 篇以上文档）",
  },
  "prompt": { course: "提示词工程指南（免费）", project: "写 20 条高质量提示词并整理成册" },
  "agent": {
    course: "AI Agent 开发入门（工具调用/规划）",
    project: "做一个能调工具完成任务的简单 agent",
  },

  // —— 工程与工具 ——
  "git": {
    course: "Git 官方 Pro Git（前 3 章）",
    project: "用 git 管理一个项目并提交 PR 到开源仓库",
  },
  "github": { course: "GitHub 官方入门", project: "建立个人主页/项目仓库并写 README" },
  "jenkins": { course: "Jenkins 官方入门", project: "配一个自动化构建流水线" },
  "ci/cd": {
    course: "GitHub Actions 官方教程",
    project: "给项目加一个自动测试/部署的 workflow",
  },
  "测试": { course: "软件测试基础（黑盒/白盒）", project: "给项目写一份测试用例并执行" },
  "自动化测试": { course: "Selenium/Playwright 入门", project: "写 10 个自动化用例跑通回归" },
  "单元测试": { course: "JUnit/pytest/Jest 官方入门", project: "给核心函数补齐单元测试" },
  "敏捷开发": { course: "敏捷开发入门（Scrum 角色/仪式）", project: "用看板管理一个小项目并复盘" },
  "devops": {
    course: "DevOps 基础（Docker + CI/CD + 监控）",
    project: "把项目从代码到部署全流程自动化",
  },
  "aws": { course: "AWS 免费层 + 官方入门", project: "在 AWS 部署一个静态站/小服务" },
  "阿里云": { course: "阿里云免费试用 + 入门文档", project: "在阿里云部署一个应用并配域名" },
  "腾讯云": { course: "腾讯云开发者手册", project: "在腾讯云部署一个应用/云函数" },
  "elasticsearch": {
    course: "Elasticsearch 官方入门",
    project: "用 ES 建一个全文检索 demo",
  },
  "mongodb": { course: "MongoDB 官方入门", project: "做一个带 MongoDB 的 CRUD 应用" },
  "mysql": {
    course: "MySQL 官方教程 + SQL 必知必会",
    project: "设计一个业务库表结构并写索引优化",
  },
  "postgresql": { course: "PostgreSQL 官方入门", project: "用 PG 完成一个带事务的应用" },

  // —— 其他岗位技能 ——
  "ps": { course: "Photoshop 官方教程/免费课", project: "完成一套海报/头图设计" },
  "剪映": { course: "剪映官方教程", project: "剪辑 3 条竖屏短视频" },
  "axure": { course: "Axure 入门教程", project: "画一套高保真产品原型（10 页以上）" },
  "figma": {
    course: "Figma 官方 Learn Design",
    project: "用 Figma 完成一个 App 页面设计并做交互原型",
  },
  "sketch": { course: "Sketch 官方入门", project: "画一套 UI 界面" },
  "seo": { course: "SEO 入门（Google 官方 SEO 指南）", project: "优化一个网站并跟踪收录与排名" },
  "sem": { course: "搜索引擎营销基础（百度/Google Ads 官方课程）", project: "写一份投放计划与关键词方案" },
  "新媒体运营": {
    course: "新媒体运营入门（平台规则 + 内容方法论）",
    project: "运营一个账号 30 天，输出 15+ 条内容并复盘数据",
  },
  "社群运营": { course: "社群运营方法论", project: "组织一场线上活动并沉淀转化路径" },
  "用户运营": { course: "用户运营体系（拉新/留存/活跃/转化）", project: "为产品设计一套用户分层与召回方案" },
  "产品运营": { course: "产品运营入门", project: "给一款产品写一份运营策略提案" },
  "内容运营": { course: "内容运营方法论", project: "搭建一个内容选题库并产出 10 篇内容" },
  "小红书": { course: "小红书运营规则与玩法", project: "运营一个小红书号 30 天（10+ 笔记）" },
  "抖音": { course: "抖音运营基础", project: "拍摄剪辑并发布 10 条视频，复盘完播率" },
  "公众号": { course: "公众号运营入门", project: "开通并运营一个公众号，发布 5+ 篇文章" },
  "私域": { course: "私域流量运营（企微/社群/朋友圈）", project: "设计一套私域 SOP 与转化路径" },
};

/** 查资源建议：精确匹配优先，其次包含匹配；未命中返回 undefined（前端给默认建议） */
export function getRemediationResource(keyword: string): RemediationResource | undefined {
  const k = keyword.toLowerCase().trim();
  if (REMEDIATION_RESOURCES[k]) return REMEDIATION_RESOURCES[k];
  const hit = Object.entries(REMEDIATION_RESOURCES).find(
    ([key]) => (k.length >= 2 && k.includes(key)) || key.includes(k)
  );
  return hit ? hit[1] : undefined;
}
