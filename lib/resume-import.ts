// 简历导入：前端规则解析（不依赖 AI，高置信字段优先）
// 与 AI 解析（ai-proxy parseResume）组成「规则先行 + AI 兜底」双轨。
// 设计原则：只提取高置信字段（电话/邮箱/教育/时间/技能关键词），
// 语义类字段（个人优势/校园经历/荣誉）识别不到就留空，由 AI 补全。

import type {
  ActivityItem,
  AwardItem,
  EducationItem,
  InternshipItem,
  LanguageItem,
  PortfolioItem,
  ProjectItem,
  Resume,
  SkillGroup,
  WorkItem,
} from "./types";

type WithoutId<T> = Omit<T, "id">;

/**
 * 导入/解析出的简历结构（数组元素不含 id，由编辑器填充时补 id）。
 * 规则解析与 AI 解析共用此类型，保证双轨可互换。
 */
export interface ParsedResumeInput {
  basics?: Partial<Resume["basics"]>;
  advantages?: string[];
  education?: WithoutId<EducationItem>[];
  languages?: WithoutId<LanguageItem>[];
  internships?: WithoutId<InternshipItem>[];
  work?: WithoutId<WorkItem>[];
  projects?: WithoutId<ProjectItem>[];
  activities?: WithoutId<ActivityItem>[];
  skills?: WithoutId<SkillGroup>[];
  awards?: WithoutId<AwardItem>[];
  portfolio?: WithoutId<PortfolioItem>[];
}

/** 简历文本的规则解析结果（部分填充，可被 AI 覆盖） */
export type RuleParsedResume = ParsedResumeInput;

// ---------- 正则 ----------
const RE_PHONE = /(1[3-9]\d{9})/;
const RE_EMAIL = /([\w.+-]+@[\w-]+\.[\w.]+)/;
const RE_GITHUB = /((?:github\.com|gitee\.com)\/[\w.-]+)/;
const RE_HTTP = /(https?:\/\/[^\s，,。；;]+)/;
const RE_BIRTH = /出生年月[:：]?\s*(\d{4}[./-]\d{1,2})/;
const RE_SEX = /性别[:：]?\s*([男女])/;
const RE_TITLE = /求职意向[:：]?\s*([^\s|，,。；;]{1,20})/;
const RE_TIME = /(\d{4}(?:[./-]\d{1,2})?)\s*[-—~至到]\s*(\d{4}(?:[./-]\d{1,2})?|至今|现在|今)/;
const RE_SCHOOL = /([\u4e00-\u9fa5A-Za-z0-9]{2,30}(?:大学|学院|学校|研究院|中学))/;
const RE_DEGREE = /(本科|硕士|博士|大专|专科)/;

// 技能关键词库（按类别）
const SKILL_LIB: { category: string; words: string[] }[] = [
  { category: "编程语言", words: ["Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "R语言", "MATLAB"] },
  { category: "前端", words: ["React", "Vue", "Angular", "Next.js", "Node.js", "HTML", "CSS", "Tailwind", "Webpack", "小程序", "uni-app"] },
  { category: "后端", words: ["Spring", "Django", "Flask", "Express", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Kafka", "Docker", "K8s", "微服务"] },
  { category: "数据", words: ["SQL", "Python数据分析", "Pandas", "NumPy", "Scikit-learn", "机器学习", "深度学习", "数据挖掘", "统计分析", "SPSS", "Excel", "Tableau", "Power BI", "ECharts"] },
  { category: "AI", words: ["大模型", "LLM", "Prompt", "Dify", "Agent", "RAG", "深度学习", "PyTorch", "TensorFlow"] },
  { category: "工具", words: ["Git", "Linux", "VS Code", "IDEA", "Postman", "Docker", "Jenkins", "Jupyter", "Markdown", "LaTeX", "Office"] },
];

const SKIP_HEAD_WORDS = ["简历", "个人简历", "求职简历", "resume", "CV", "联系方式", "基本信息"];

function cleanLines(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function normDate(d: string): string {
  return d.replace(/[/]/g, ".").replace(/-/g, ".").replace(/^(\d{4})\.?(\d{1,2})?$/, (_m, y, mo) => (mo ? `${y}.${mo.padStart(2, "0")}` : y));
}

/** 从文本中识别技能（按关键词库匹配，去重） */
function extractSkills(text: string): { category: string; items: string[] }[] {
  const found: { category: string; items: string[] }[] = [];
  for (const group of SKILL_LIB) {
    const hit = group.words.filter((w) => new RegExp(`(^|[^A-Za-z])${w.replace(/[+]/g, "\\+")}([^A-Za-z]|$)`, "i").test(text));
    if (hit.length > 0) found.push({ category: group.category, items: hit });
  }
  return found;
}

/**
 * 规则解析简历文本。返回部分填充的 Resume（不包含 id/template/visibility，由调用方合并）。
 */
export function parseResumeByRules(text: string): RuleParsedResume {
  const lines = cleanLines(text);
  if (lines.length === 0) return {};

  const fullText = text.replace(/\s+/g, " ");

  // 高置信字段
  const phone = fullText.match(RE_PHONE)?.[1] ?? "";
  const email = fullText.match(RE_EMAIL)?.[1] ?? "";
  const github = fullText.match(RE_GITHUB)?.[1] ?? "";
  const website = (fullText.match(RE_HTTP)?.[1] ?? "").split(" ")[0] ?? "";
  const birth = fullText.match(RE_BIRTH)?.[1] ?? "";
  const sex = fullText.match(RE_SEX)?.[1] ?? "";
  const title = fullText.match(RE_TITLE)?.[1] ?? "";

  // 姓名：第一个非标题行（过滤掉邮箱/电话/时间/标题词/联系方式行）
  let name = "";
  for (const line of lines) {
    const l = line.replace(/[•·\-\s]/g, "");
    if (!l) continue;
    if (RE_PHONE.test(l) || RE_EMAIL.test(l) || RE_TIME.test(l)) continue;
    if (SKIP_HEAD_WORDS.some((w) => l.includes(w))) continue;
    if (l.length > 10) continue;
    if (/\d/.test(l)) continue;
    name = line;
    break;
  }

  // 教育背景：含学校关键词的行
  const education: { school: string; degree: string; major: string; startDate: string; endDate: string; description: string }[] = [];
  for (const line of lines) {
    const schoolMatch = line.match(RE_SCHOOL);
    if (!schoolMatch) continue;
    const time = line.match(RE_TIME);
    const degree = line.match(RE_DEGREE)?.[1] ?? "";
    const school = schoolMatch[1] ?? "";
    // 专业：学历之后的词段（尽力而为）
    let major = "";
    const degreeIdx = line.indexOf(degree);
    if (degreeIdx >= 0) {
      const after = line.slice(degreeIdx + degree.length);
      major = (after.match(/[\u4e00-\u9fa5A-Za-z0-9（）()]{2,20}/)?.[0] ?? "").replace(school, "");
    }
    education.push({
      school,
      degree,
      major,
      startDate: time ? normDate(time[1] ?? "") : "",
      endDate: time ? (time[2] === "至今" || time[2] === "现在" || time[2] === "今" ? "至今" : normDate(time[2] ?? "")) : "",
      description: "",
    });
  }

  // 经历：按时间区间行切段（含时间 + 非教育行的段落）
  const work: { company: string; role: string; startDate: string; endDate: string; bullets: string[] }[] = [];
  const internships: { company: string; role: string; startDate: string; endDate: string; bullets: string[] }[] = [];
  const projects: { name: string; role: string; link: string; startDate: string; endDate: string; bullets: string[] }[] = [];
  const activities: { org: string; role: string; startDate: string; endDate: string; description: string }[] = [];
  {
    const SECTION_TITLES = /(个人优势|教育背景|工作经历|实习经历|项目经历|校园经历|社团|志愿者|技能|荣誉奖项|自我评价|主修课程)/;
    let section: "work" | "internship" | "project" | "activity" | null = null; // 最近遇到的章节标题
    let cur: { kind: "work" | "internship" | "project" | "activity"; head: string; role: string; time: RegExpMatchArray | null; bullets: string[] } | null = null;
    const flush = () => {
      if (!cur) return;
      const time = cur.time;
      const startDate = time ? normDate(time[1] ?? "") : "";
      const endDate = time ? (time[2] === "至今" || time[2] === "现在" || time[2] === "今" ? "至今" : normDate(time[2] ?? "")) : "";
      const bullets = cur.bullets.slice(0, 8);
      const head = cur.head;
      const role = cur.role;
      if (cur.kind === "internship") {
        internships.push({ company: head, role, startDate, endDate, bullets });
      } else if (cur.kind === "project") {
        projects.push({ name: head, role, link: "", startDate, endDate, bullets });
      } else if (cur.kind === "activity") {
        activities.push({ org: head, role, startDate, endDate, description: bullets.join("；") });
      } else {
        work.push({ company: head, role, startDate, endDate, bullets });
      }
      cur = null;
    };
    for (const line of lines) {
      // 章节标题：断段 + 记录当前章节类型
      if (SECTION_TITLES.test(line) && line.length < 20) {
        flush();
        cur = null;
        if (/实习/.test(line)) section = "internship";
        else if (/项目/.test(line)) section = "project";
        else if (/校园|社团|志愿/.test(line)) section = "activity";
        else if (/工作/.test(line)) section = "work";
        else section = null;
        continue;
      }
      if (RE_TIME.test(line) && line.length < 60) {
        flush();
        const time = line.match(RE_TIME);
        // 段头：去掉时间后的剩余部分；按 | 拆分名称与角色
        const headRaw = line.replace(RE_TIME, "").replace(/^[\s|，,。；;：:]+/, "").trim();
        const [headMainRaw, rolePart] = headRaw.split("|").map((s) => s.trim());
        const headMain = headMainRaw ?? "";
        // 学校关键词 → 教育段，跳过（教育已单独处理）
        if (RE_SCHOOL.test(headMain)) {
          cur = null;
          continue;
        }
        const isIntern = section === "internship" || /实习/.test(headMain);
        const isProject = section === "project" || /项目|作品|课题/.test(headMain);
        const isActivity = section === "activity" || /社团|志愿|学生会|社团/.test(headMain);
        cur = {
          kind: isIntern ? "internship" : isProject ? "project" : isActivity ? "activity" : "work",
          head: headMain, role: rolePart ?? "", time, bullets: [],
        };
      } else if (cur) {
        cur.bullets.push(line.replace(/^[•·\-*\d.、\s]+/, ""));
      }
    }
    flush();
  }

  // 技能
  const skills = extractSkills(fullText);

  // 个人优势：标签行启发式（专业背景/综合素质/团队协作…）+ 「个人优势/自我评价」标题段落兜底
  const advantages: string[] = [];
  {
    const ADV_LABEL = /^(专业背景|综合素质|团队协作|沟通能力|学习能力|执行力|抗压能力|责任心|自我驱动力)[:：]/;
    for (const line of lines) {
      if (ADV_LABEL.test(line)) advantages.push(line.replace(/^[•·\-*\s]+/, "").trim());
    }
    if (advantages.length === 0) {
      const idx = lines.findIndex((l) => /^(个人优势|自我评价)[:：]?$/.test(l));
      if (idx >= 0) {
        for (const l of lines.slice(idx + 1)) {
          if (RE_TIME.test(l) || /教育背景|工作经历|项目经历|技能|荣誉/.test(l)) break;
          const clean = l.replace(/^[•·\-*\s]+/, "").trim();
          if (clean && clean.length > 4) advantages.push(clean);
          if (advantages.length >= 6) break;
        }
      }
    }
  }

  // 摘要：尝试取"自我评价/个人简介"段落
  let summary = "";
  {
    const idx = lines.findIndex((l) => /(自我评价|个人简介|个人介绍|关于我)/.test(l));
    if (idx >= 0 && idx + 1 < lines.length) {
      summary = lines.slice(idx + 1).find((l) => l.length > 10) ?? "";
    }
  }

  return {
    basics: {
      name, title, email, phone, location: "", website: github || website, summary,
      birth, sex,
    },
    education,
    internships,
    work,
    projects,
    activities,
    skills,
    advantages,
  };
}
