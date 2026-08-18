// 行业 JD 库：提供多行业标准岗位描述模板，供诊断页一键加载示例 JD。
// 纯前端数据，不依赖 AI，无 key 也可用。
// 支持多语言（中文 / English），并持续扩库更多行业。

export type JdLocale = "zh-CN" | "en";

export interface JdTemplate {
  id: string;
  /** 行业（按语言） */
  industry: Record<JdLocale, string>;
  /** 岗位（按语言） */
  role: Record<JdLocale, string>;
  /** JD 正文（按语言） */
  jd: Record<JdLocale, string>;
}

export const JD_LOCALES: { id: JdLocale; label: string }[] = [
  { id: "zh-CN", label: "中文" },
  { id: "en", label: "English" },
];

export const JD_LIBRARY: JdTemplate[] = [
  {
    id: "fe",
    industry: { "zh-CN": "互联网", en: "Internet" },
    role: { "zh-CN": "前端开发工程师", en: "Frontend Engineer" },
    jd: {
      "zh-CN": `岗位职责：
- 负责 Web 端产品的前端开发，与产品、设计、后端协作交付功能；
- 使用 React / Vue 等框架搭建高质量、可维护的用户界面；
- 优化页面性能与首屏加载，提升用户体验与浏览器兼容性。

任职要求：
- 熟练掌握 HTML / CSS / JavaScript / TypeScript；
- 熟悉 React 或 Vue 生态，了解组件化与状态管理（Redux / Zustand 等）；
- 了解 Webpack / Vite 等构建工具，具备性能优化经验者优先；
- 有小程序或 Node.js 经验者优先。`,
      en: `Responsibilities:
- Develop and maintain front-end features of web products, collaborating with product, design, and back-end to deliver functionality;
- Build high-quality, maintainable user interfaces with frameworks such as React / Vue;
- Optimize page performance and first-screen loading to improve UX and browser compatibility.

Requirements:
- Proficient in HTML / CSS / JavaScript / TypeScript;
- Familiar with the React or Vue ecosystem, understanding componentization and state management (Redux / Zustand, etc.);
- Knowledge of build tools like Webpack / Vite; performance optimization experience is a plus;
- Experience with mini-programs or Node.js is a plus.`,
    },
  },
  {
    id: "be",
    industry: { "zh-CN": "互联网", en: "Internet" },
    role: { "zh-CN": "后端开发工程师", en: "Backend Engineer" },
    jd: {
      "zh-CN": `岗位职责：
- 负责服务端业务逻辑开发与接口设计，保障系统稳定与高并发；
- 设计与优化数据库结构，编写高性能 SQL；
- 参与系统架构演进与微服务拆分。

任职要求：
- 熟练掌握 Java / Go / Python 中至少一门；
- 熟悉 MySQL / PostgreSQL 等关系型数据库，了解 Redis 等缓存；
- 了解 Spring Boot / Gin / Django 等框架；
- 有微服务、消息队列（Kafka / RabbitMQ）经验者优先。`,
      en: `Responsibilities:
- Develop server-side business logic and API design, ensuring stability and high concurrency;
- Design and optimize database schemas, write high-performance SQL;
- Participate in architecture evolution and microservice decomposition.

Requirements:
- Proficient in at least one of Java / Go / Python;
- Familiar with relational databases such as MySQL / PostgreSQL; knowledge of caches like Redis;
- Familiar with frameworks such as Spring Boot / Gin / Django;
- Experience with microservices and message queues (Kafka / RabbitMQ) is a plus.`,
    },
  },
  {
    id: "fs",
    industry: { "zh-CN": "互联网", en: "Internet" },
    role: { "zh-CN": "全栈工程师", en: "Full-stack Engineer" },
    jd: {
      "zh-CN": `岗位职责：
- 负责前端到后端的端到端功能开发，独立交付完整需求；
- 设计 REST API 并与数据库集成；
- 负责服务部署与运维，保障稳定性。

任职要求：
- 熟练掌握 JavaScript/TypeScript 及至少一门后端语言（Node.js / Go / Python）；
- 熟悉 React/Vue 前端与一种服务端框架；
- 了解数据库（PostgreSQL / MongoDB）与基础 DevOps（Docker、CI/CD）；
- 有线上项目交付经验者优先。`,
      en: `Responsibilities:
- Build end-to-end features across front-end and back-end;
- Design REST APIs and integrate with databases;
- Deploy and maintain services, ensuring reliability.

Requirements:
- Proficient in JavaScript/TypeScript and at least one back-end language (Node.js / Go / Python);
- Familiar with React/Vue on the front-end and a server framework on the back-end;
- Understanding of databases (PostgreSQL / MongoDB) and basic DevOps (Docker, CI/CD);
- Experience shipping production web apps is a plus.`,
    },
  },
  {
    id: "da",
    industry: { "zh-CN": "数据", en: "Data" },
    role: { "zh-CN": "数据分析师", en: "Data Analyst" },
    jd: {
      "zh-CN": `岗位职责：
- 负责业务数据的提取、清洗与分析，输出可落地的洞察报告；
- 搭建数据看板与指标体系，支持业务决策；
- 通过 A/B 测试与归因分析优化增长策略。

任职要求：
- 熟练使用 SQL，掌握 Python（Pandas / NumPy）或 R；
- 熟悉 Tableau / Power BI / Metabase 等可视化工具；
- 具备统计分析与实验设计基础；
- 有用户增长或电商分析经验者优先。`,
      en: `Responsibilities:
- Extract, clean, and analyze business data, delivering actionable insight reports;
- Build dashboards and metric systems to support decisions;
- Optimize growth strategy via A/B testing and attribution analysis.

Requirements:
- Proficient in SQL; skilled in Python (Pandas / NumPy) or R;
- Familiar with visualization tools such as Tableau / Power BI / Metabase;
- Foundation in statistical analysis and experiment design;
- Experience in user growth or e-commerce analytics is a plus.`,
    },
  },
  {
    id: "algo",
    industry: { "zh-CN": "数据·AI", en: "Data & AI" },
    role: { "zh-CN": "算法工程师", en: "Algorithm Engineer" },
    jd: {
      "zh-CN": `岗位职责：
- 研究并实现推荐、搜索或 NLP 相关的机器学习/深度学习模型；
- 完成模型训练、评估与上线部署；
- 通过特征工程与调参持续提升模型效果。

任职要求：
- 扎实的机器学习、统计学与算法基础；
- 熟练使用 Python 及 PyTorch / TensorFlow 等框架；
- 了解数据管道与模型服务化；
- 有推荐 / 计算机视觉 / NLP 经验者优先。`,
      en: `Responsibilities:
- Research and implement ML/DL models for recommendation, search, or NLP;
- Train, evaluate, and deploy models to production;
- Improve model performance via feature engineering and tuning.

Requirements:
- Solid foundation in machine learning, statistics, and algorithms;
- Proficient in Python and frameworks like PyTorch / TensorFlow;
- Familiar with data pipelines and model serving;
- Experience with recommendation / CV / NLP is a plus.`,
    },
  },
  {
    id: "qa",
    industry: { "zh-CN": "互联网", en: "Internet" },
    role: { "zh-CN": "测试工程师", en: "QA Engineer" },
    jd: {
      "zh-CN": `岗位职责：
- 制定并执行 Web/移动端产品的测试方案；
- 编写自动化回归测试，建设 CI 测试流水线；
- 跟踪、复现并与开发协作验证缺陷。

任职要求：
- 了解软件测试理论与流程；
- 熟悉至少一种自动化框架（Playwright / Selenium / pytest）；
- 具备 Python / JavaScript 基础脚本能力；
- 有接口测试与性能测试经验者优先。`,
      en: `Responsibilities:
- Design and execute test plans for web/mobile products;
- Automate regression tests and build CI test pipelines;
- Track, reproduce, and verify bugs with developers.

Requirements:
- Understanding of software testing theory and processes;
- Familiar with at least one automation framework (Playwright / Selenium / pytest);
- Basic scripting in Python / JavaScript;
- Experience with API testing and performance testing is a plus.`,
    },
  },
  {
    id: "pm",
    industry: { "zh-CN": "互联网", en: "Internet" },
    role: { "zh-CN": "产品经理", en: "Product Manager" },
    jd: {
      "zh-CN": `岗位职责：
- 负责产品需求调研、规划与优先级排期，撰写 PRD；
- 协调设计、研发、测试推动版本交付；
- 通过数据分析与用户反馈持续迭代产品。

任职要求：
- 具备良好的逻辑思维与结构化表达能力；
- 熟练使用 Axure / Figma 等原型工具；
- 了解数据分析方法，能用数据驱动决策；
- 有 0-1 产品或 B 端产品经验者优先。`,
      en: `Responsibilities:
- Research requirements, plan roadmap, and write PRDs;
- Coordinate design, dev, and QA to ship versions;
- Continuously iterate the product via data and feedback.

Requirements:
- Strong logical and structured communication skills;
- Proficient with prototyping tools like Axure / Figma;
- Understanding of data analysis methods;
- Experience with 0-to-1 or B2B products is a plus.`,
    },
  },
  {
    id: "ux",
    industry: { "zh-CN": "设计", en: "Design" },
    role: { "zh-CN": "UI/UX 设计师", en: "UI/UX Designer" },
    jd: {
      "zh-CN": `岗位职责：
- 负责 Web/移动端产品的界面与交互流程设计；
- 建立并维护设计系统与组件库；
- 通过用户研究与可用性测试验证设计方案。

任职要求：
- 熟练使用 Figma / Sketch 及原型工具；
- 扎实的视觉层级、排版与设计系统能力；
- 理解以用户为中心的设计与可访问性；
- 需提供作品集。`,
      en: `Responsibilities:
- Design user interfaces and interaction flows for web/mobile;
- Build and maintain design systems and component libraries;
- Validate designs through user research and usability testing.

Requirements:
- Proficient with Figma / Sketch and prototyping tools;
- Solid grasp of visual hierarchy, layout, and design systems;
- Understanding of user-centered design and accessibility;
- A strong portfolio is required.`,
    },
  },
  {
    id: "mkt",
    industry: { "zh-CN": "市场", en: "Marketing" },
    role: { "zh-CN": "市场营销专员", en: "Marketing Specialist" },
    jd: {
      "zh-CN": `岗位职责：
- 负责品牌内容与社交媒体运营，策划并执行营销活动；
- 投放并优化信息流广告，跟踪 ROI；
- 通过用户画像与增长漏斗提升转化。

任职要求：
- 具备优秀的内容策划与文案能力；
- 熟悉抖音 / 小红书 / 微信等渠道玩法；
- 了解 SEO / SEM 与基础数据分析（GA / 巨量引擎）；
- 有活动策划或社群运营经验者优先。`,
      en: `Responsibilities:
- Plan and run brand content and social media campaigns;
- Manage and optimize paid ads, tracking ROI;
- Improve conversion via user personas and funnels.

Requirements:
- Strong content and copywriting skills;
- Familiar with Douyin / Xiaohongshu / WeChat ecosystems;
- Basic knowledge of SEO / SEM and analytics (GA / Ocean Engine);
- Experience in campaigns or community ops is a plus.`,
    },
  },
  {
    id: "ops",
    industry: { "zh-CN": "运营", en: "Operations" },
    role: { "zh-CN": "运营专员", en: "Operations Specialist" },
    jd: {
      "zh-CN": `岗位职责：
- 负责用户社区与内容运营，提升活跃与留存；
- 策划并执行活动，促进用户增长；
- 分析运营指标，优化运营流程。

任职要求：
- 较强的执行力与沟通协调能力；
- 熟悉社区运营与内容运营；
- 具备数据敏感度与基础分析能力；
- 有用户增长经验者优先。`,
      en: `Responsibilities:
- Operate user communities and content to drive engagement and retention;
- Run campaigns and activities to grow active users;
- Analyze operational metrics and optimize workflows.

Requirements:
- Strong execution and communication skills;
- Familiar with community and content operations;
- Data sensitivity and basic analytics skills;
- Experience in user growth is a plus.`,
    },
  },
  {
    id: "hr",
    industry: { "zh-CN": "职能", en: "Functions" },
    role: { "zh-CN": "人力资源专员（HR）", en: "HR Specialist" },
    jd: {
      "zh-CN": `岗位职责：
- 负责招聘渠道维护与候选人筛选、面试安排；
- 推动员工入职、培训与绩效跟进；
- 维护员工关系与企业文化落地。

任职要求：
- 熟悉招聘流程与面试技巧，具备人才评估能力；
- 良好的沟通协调与亲和力；
- 了解劳动法与 HR 相关系统（如 Moka / 北森）；
- 有校园招聘或批量招聘经验者优先。`,
      en: `Responsibilities:
- Manage recruiting channels, screen candidates, and schedule interviews;
- Support onboarding, training, and performance follow-up;
- Maintain employee relations and culture.

Requirements:
- Familiar with recruiting process and interview techniques;
- Good communication and interpersonal skills;
- Basic knowledge of labor law and HR systems (Moka / Beisen);
- Experience in campus or bulk recruiting is a plus.`,
    },
  },
  {
    id: "fin",
    industry: { "zh-CN": "职能", en: "Functions" },
    role: { "zh-CN": "财务专员", en: "Finance Specialist" },
    jd: {
      "zh-CN": `岗位职责：
- 负责会计核算、报销与月度结账；
- 编制财务报表，支持预算与预测；
- 协助税务申报与审计对接。

任职要求：
- 熟悉会计准则与财务软件；
- 熟练使用 Excel（VLOOKUP、数据透视表等）；
- 细致负责、保密意识强；
- 持有会计相关证书者优先。`,
      en: `Responsibilities:
- Handle accounting, reimbursement, and monthly closing;
- Prepare financial statements and support budgeting/forecasting;
- Assist with tax filing and audit coordination.

Requirements:
- Familiar with accounting standards and finance software;
- Proficient with Excel (VLOOKUP, PivotTables, etc.);
- Careful, responsible, and confidential;
- An accounting certificate is a plus.`,
    },
  },
];

/** 按 id 取模板 */
export function getJdById(id: string): JdTemplate | undefined {
  return JD_LIBRARY.find((x) => x.id === id);
}
