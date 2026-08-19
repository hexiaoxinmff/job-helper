// 垂直人群模板：针对 PRD 锁定的高价值垂直人群（跨专业转码 / 考公转行 / 二战转就业 / 应届零实习 / 在职跳槽等），
// 提供「人群定位 + 痛点 + 起步简历骨架 + 目标岗位 + 诊断建议」，落地到「诚实诊断 + 差距补救」的产品差异化。
// 纯前端数据，不依赖 AI / 后端。

import { createEmptyResume, type Resume, type TemplateId } from "./types";

export interface VerticalTargetRole {
  /** 对应 lib/jd-library.ts 的 JD id */
  jdId: string;
  /** 推荐理由（一句话） */
  note: string;
}

export interface VerticalTemplate {
  id: string;
  /** 人群名 */
  name: string;
  /** 图标（emoji） */
  emoji: string;
  /** 一句话定位 */
  tagline: string;
  /** 核心痛点 */
  painPoint: string;
  /** 定位与包装建议 */
  guidance: string[];
  /** 推荐目标岗位（联动 JD 库） */
  targetRoles: VerticalTargetRole[];
  /** 推荐简历版式 */
  recommendedTemplate: TemplateId;
  /** 一键载入编辑器的起步简历骨架（含占位引导，绝不编造用户经历） */
  starterResume: Resume;
}

// —— 起步简历骨架构造：用占位引导而非伪造经历 ——
function starter(over: Partial<Resume>): Resume {
  return { ...createEmptyResume(), ...over };
}

export const VERTICAL_TEMPLATES: VerticalTemplate[] = [
  {
    id: "cross-major-coder",
    name: "跨专业转码",
    emoji: "💻",
    tagline: "非科班 → 前端 / 后端工程师",
    painPoint: "经历与目标岗位严重错位，简历里缺少「工程化项目」与「技术关键词」，容易被规则硬匹配误杀。",
    guidance: [
      "把课程设计 / 自学项目写成「动词 + 技术栈 + 量化结果」，例如「用 React 重构课程作业，首屏加载从 3.2s 降到 1.1s」。",
      "技能栏按目标 JD 排序，把 JD 最看重的语言 / 框架放最前，且在项目里证明用过，而非只列名词。",
      "教育背景突出「相关课程 + GPA / 排名」，弥补专业不对口；跨专业动机用一句话点明（如「自学 800h 转前端」）。",
      "用诊断的「差距补救路线」区分硬缺口（需补学的框架）与表达缺口（可在现有经历补位的软素质）。",
    ],
    targetRoles: [
      { jdId: "fe", note: "最主流的转码入口，项目门槛相对友好" },
      { jdId: "be", note: "若偏后端，注意补数据库 / 框架项目" },
      { jdId: "fs", note: "前后端都做，适合小项目经历丰富的转码者" },
    ],
    recommendedTemplate: "modern",
    starterResume: starter({
      template: "modern",
      basics: {
        name: "（你的姓名）",
        title: "前端开发工程师（转码）",
        email: "you@example.com",
        phone: "138-0000-0000",
        location: "（城市）",
        website: "（GitHub / 博客，可选）",
        summary:
          "非科班背景，自学转码 X 个月，完成 N 个 React/Vue 项目。擅长把课程作业工程化，目标岗位：前端开发。",
      },
      education: [
        {
          id: "edu-1",
          school: "（本科学校）",
          degree: "本科",
          major: "（原专业，如 自动化 / 金融）",
          startDate: "20XX.09",
          endDate: "20XX.06",
          description: "相关课程：数据结构、计算机网络、Python 程序设计；GPA 3.X / 排名前 X%。",
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "（项目名称，如 校园二手交易平台）",
          role: "前端开发",
          link: "（GitHub 链接，可选）",
          startDate: "20XX.XX",
          endDate: "20XX.XX",
          bullets: [
            "使用 React + TypeScript 实现 XX 模块，负责组件拆分与状态管理；",
            "通过 XX 优化（如懒加载 / 缓存），使页面加载时间从 Xs 降到 Xs；",
            "（用 STAR 改写：动词 + 对象 + 量化结果，不要编造没做过的）",
          ],
        },
      ],
      skills: [
        { id: "sk-1", category: "前端", items: ["HTML/CSS", "JavaScript", "TypeScript", "React"] },
        { id: "sk-2", category: "工具", items: ["Git", "Vite", "VS Code"] },
        { id: "sk-3", category: "基础", items: ["数据结构", "计算机网络", "算法"] },
      ],
    }),
  },
  {
    id: "exam-to-product",
    name: "考公转产品",
    emoji: "🧭",
    tagline: "考公 / 考研失利 → 产品经理 / 运营",
    painPoint: "经历与目标岗位错位，没有「产品 / 互联网」相关经历，简历容易被规则误判为「无关」。",
    guidance: [
      "把备考期间的「信息整理 / 政策分析 / 项目统筹」能力平移为产品基本功：需求调研、逻辑结构化、文档撰写。",
      "用 PRD / 原型工具（Axure / Figma）做一个「模拟需求」作品，证明你有产品思维，而非空谈。",
      "目标岗位优先选「产品 / 运营」，JD 强调逻辑与表达，正好是考公群体的相对优势。",
      "诚实标注转行意愿与学习路径，避免把备考说成「工作经验」—— 过度美化会在面试翻车。",
    ],
    targetRoles: [
      { jdId: "pm", note: "最契合：强逻辑 + 文档能力可平移" },
      { jdId: "ops", note: "运营对专业限制小，可作过渡" },
      { jdId: "mkt", note: "若擅长内容与表达，市场营销也适配" },
    ],
    recommendedTemplate: "sidebar",
    starterResume: starter({
      template: "sidebar",
      basics: {
        name: "（你的姓名）",
        title: "产品经理（转行）",
        email: "you@example.com",
        phone: "138-0000-0000",
        location: "（城市）",
        website: "（作品集链接，可选）",
        summary:
          "文科 / 考公背景，具备强逻辑、信息整理与结构化表达能力。自学产品方法论，完成 1 个模拟 PRD 作品，目标转行产品经理。",
      },
      education: [
        {
          id: "edu-1",
          school: "（本科学校）",
          degree: "硕士 / 本科",
          major: "（如 公共管理 / 中文）",
          startDate: "20XX.09",
          endDate: "20XX.06",
          description: "相关课程：逻辑学、统计学基础、写作；获 XX 奖学金 / 排名前 X%。",
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "（模拟产品需求：如 校园失物招领小程序）",
          role: "产品负责人（模拟）",
          link: "（Figma / 文档链接，可选）",
          startDate: "20XX.XX",
          endDate: "20XX.XX",
          bullets: [
            "调研 N 位用户，输出需求文档与功能清单（XX 个核心功能）；",
            "用 Figma 绘制原型，梳理 XX 条用户路径；",
            "（强调「发现问题—定义需求—方案落地」的产品思维）",
          ],
        },
      ],
      skills: [
        { id: "sk-1", category: "产品", items: ["需求分析", "PRD 撰写", "Axure", "Figma"] },
        { id: "sk-2", category: "通用", items: ["结构化表达", "数据分析基础", "Excel"] },
      ],
    }),
  },
  {
    id: "second-war",
    name: "二战失利转就业",
    emoji: "🔁",
    tagline: "二战考研 / 考公失利 → 就业复盘",
    painPoint: "空档期长、经历断层，简历「年份空白」易被质疑；需要把备考能力转化为岗位语言。",
    guidance: [
      "诚实处理空档期：用「备考 + 持续学习」替代掩饰，并把自学成果（如证书 / 项目）写进简历。",
      "复盘失败原因对应到岗位差距：是硬技能缺口（需补学）还是表达缺口（可在现有经历补位）。",
      "优先投递「对空档期包容度高」的岗位（如运营 / 职能 / 数据分析入门），积累经验再跳。",
      "利用「长期职业建模」跟踪：每隔几周做一次诊断，看到差距收窄，增强信心。",
    ],
    targetRoles: [
      { jdId: "ops", note: "包容度高，适合积累第一份经验" },
      { jdId: "da", note: "若数学底子好，数据分析是稳妥方向" },
      { jdId: "hr", note: "职能岗对专业限制小" },
    ],
    recommendedTemplate: "classic",
    starterResume: starter({
      template: "classic",
      basics: {
        name: "（你的姓名）",
        title: "（目标岗位，如 运营专员）",
        email: "you@example.com",
        phone: "138-0000-0000",
        location: "（城市）",
        website: "",
        summary:
          "毕业后专注备考，期间保持自律与系统学习，具备信息检索、计划执行与抗压能力。现转向就业，目标岗位：XX。",
      },
      education: [
        {
          id: "edu-1",
          school: "（本科学校）",
          degree: "本科",
          major: "（专业）",
          startDate: "20XX.09",
          endDate: "20XX.06",
          description: "主修课程与成果；（可补充备考期间自学的证书 / 课程）",
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "（备考期间的自学项目 / 志愿 / 实习，任选）",
          role: "（角色）",
          link: "",
          startDate: "20XX.XX",
          endDate: "20XX.XX",
          bullets: [
            "（用 STAR 写一段可迁移经历，如「统筹 XX 活动，协调 X 人，覆盖 X 人」）；",
            "（突出自律、计划、抗压等可迁移能力，贴合目标岗位）",
          ],
        },
      ],
      skills: [
        { id: "sk-1", category: "通用", items: ["信息检索", "计划执行", "抗压", "Office"] },
        { id: "sk-2", category: "岗位相关", items: ["（按目标 JD 补，如 SQL / 数据分析）"] },
      ],
    }),
  },
  {
    id: "zero-intern",
    name: "应届零实习",
    emoji: "🌱",
    tagline: "应届生 · 项目 / 实习经历空白",
    painPoint: "简历「经历与成果」维度分低，缺量化数据，容易被 JD 的「有实习经验优先」直接刷掉。",
    guidance: [
      "把课程项目 / 大作业 / 比赛当成「项目经历」写，每条用 STAR：动词 + 技术 + 量化结果。",
      "没有实习就补「校园实践 / 开源贡献 / 自学作品」，证明你做过事、能交付。",
      "技能栏具体到版本与场景（如「Python：用于数据分析，处理过 X 万行数据」），而非只写名词。",
      "用诊断的「经历与成果」维度分当标尺，每补一条经历就重测，看到分数上涨。",
    ],
    targetRoles: [
      { jdId: "fe", note: "项目导向，作品比实习更重要" },
      { jdId: "da", note: "用课程数据项目补位" },
      { jdId: "qa", note: "测试门槛友好，适合首份工作" },
    ],
    recommendedTemplate: "elegant",
    starterResume: starter({
      template: "elegant",
      basics: {
        name: "（你的姓名）",
        title: "（目标岗位，如 前端开发）",
        email: "you@example.com",
        phone: "138-0000-0000",
        location: "（城市）",
        website: "（GitHub，强烈建议）",
        summary:
          "应届生，暂无实习但完成 N 个课程 / 自学项目，具备扎实的基础与动手能力，目标岗位：XX。",
      },
      education: [
        {
          id: "edu-1",
          school: "（本科学校）",
          degree: "本科（应届）",
          major: "（专业）",
          startDate: "20XX.09",
          endDate: "20XX.06",
          description: "GPA 3.X / 排名前 X%；相关课程：XX、XX。",
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "（课程 / 比赛项目，如 数据结构课程设计）",
          role: "（你的角色）",
          link: "（GitHub 链接）",
          startDate: "20XX.XX",
          endDate: "20XX.XX",
          bullets: [
            "实现 XX 功能，使用 XX 技术，处理了 X 规模的数据；",
            "（量化：性能 / 覆盖率 / 用户数等，没有就补一个具体数字）",
          ],
        },
      ],
      skills: [
        { id: "sk-1", category: "技术", items: ["（如 Python / Java / C++）"] },
        { id: "sk-2", category: "工具", items: ["Git", "（IDE）"] },
      ],
    }),
  },
  {
    id: "job-hopper",
    name: "在职 1-3 年跳槽",
    emoji: "🚀",
    tagline: "在职 1-3 年 · 简历需包装升级",
    painPoint: "有经历但写得「平」，缺少量化成果与业务价值，跳槽时匹配度上不去。",
    guidance: [
      "每段工作用「业务价值」而非「职责罗列」：你做了什么 → 带来什么结果（量化）。",
      "突出「从 0 到 1 / 提效 X% / 降本 X 万」等可迁移成果，跨岗位也能证明能力。",
      "技能栏对齐目标 JD，删掉与目标无关的旧技能，聚焦最相关的 2-3 条主线。",
      "用诊断看「关键词覆盖」维度，确保 JD 高频词自然融入，又不生硬堆砌。",
    ],
    targetRoles: [
      { jdId: "fs", note: "全栈经验跳槽友好" },
      { jdId: "pm", note: "有业务经验转产品顺" },
      { jdId: "mkt", note: "有增长 / 投放经验可跳" },
    ],
    recommendedTemplate: "compact",
    starterResume: starter({
      template: "compact",
      basics: {
        name: "（你的姓名）",
        title: "（目标岗位，如 全栈工程师）",
        email: "you@example.com",
        phone: "138-0000-0000",
        location: "（城市）",
        website: "",
        summary:
          "1-3 年 X 领域经验，主导过 XX 项目，擅长 XX。目标：在更高平台承接更复杂业务。",
      },
      work: [
        {
          id: "work-1",
          company: "（当前公司）",
          role: "（当前职位）",
          startDate: "20XX.XX",
          endDate: "至今",
          bullets: [
            "负责 XX 模块，通过 XX 优化使（指标）提升 X%；",
            "（每条写成「动词 + 对象 + 量化结果」）",
          ],
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "（代表性项目）",
          role: "（角色）",
          link: "",
          startDate: "20XX.XX",
          endDate: "20XX.XX",
          bullets: ["（突出业务价值与量化成果）"],
        },
      ],
      skills: [
        { id: "sk-1", category: "主线技能", items: ["（按目标 JD 聚焦 2-3 条）"] },
      ],
    }),
  },
  {
    id: "returnee",
    name: "留学 / 外企归国",
    emoji: "🌏",
    tagline: "海归 / 外企背景 · 中英双语",
    painPoint: "国内 JD 关键词与海外经历表述不一致，简历「关键词覆盖」低；双语呈现需求强。",
    guidance: [
      "把海外经历「翻译」成国内 JD 语言：课程 / 实习对应的国内岗位技能要显式写出。",
      "技能与项目保留中英双语关键词，兼顾国内ATS与涉外岗位。",
      "突出跨文化协作、英语工作语言能力，这是海归的差异化而非劣势。",
      "目标岗位可同时看国内版 JD 与 English 版，诊断时切换语言加载。",
    ],
    targetRoles: [
      { jdId: "pm", note: "外企 / 出海产品适配" },
      { jdId: "mkt", note: "跨境 / 品牌营销适配" },
      { jdId: "da", note: "数据岗语言门槛低、通用性强" },
    ],
    recommendedTemplate: "creative",
    starterResume: starter({
      template: "creative",
      basics: {
        name: "（Your Name / 姓名）",
        title: "Product Manager / 产品经理",
        email: "you@example.com",
        phone: "+86 138-0000-0000",
        location: "（城市 / City）",
        website: "（LinkedIn / 作品集）",
        summary:
          "Overseas-educated with cross-cultural collaboration experience and bilingual (中/EN) working ability. Target: product / data roles in cross-border or MNC environments.",
      },
      education: [
        {
          id: "edu-1",
          school: "（Overseas / 海外学校）",
          degree: "Master / 硕士",
          major: "（专业）",
          startDate: "20XX.09",
          endDate: "20XX.06",
          description: "Relevant courses & achievements; GPA X.X.",
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "（Overseas project / internship）",
          role: "（Role）",
          link: "",
          startDate: "20XX.XX",
          endDate: "20XX.XX",
          bullets: [
            "Delivered XX with XX tech, impacting X users / X% improvement;",
            "（中英双语描述关键成果）",
          ],
        },
      ],
      skills: [
        { id: "sk-1", category: "Core", items: ["（核心技能 中/EN）"] },
        { id: "sk-2", category: "Language", items: ["中文（母语）", "English (Fluent)"] },
      ],
    }),
  },
];

export function getVerticalById(id: string): VerticalTemplate | undefined {
  return VERTICAL_TEMPLATES.find((t) => t.id === id);
}
