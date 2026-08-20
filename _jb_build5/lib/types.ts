// 共享类型定义

/** 诊断置信度 */
export type Confidence = "low" | "medium" | "high";

/** 简历分析结果 */
export interface AnalysisResult {
  /** 解析出的简历文本（截断预览） */
  resumeText: string;
  /** 简历文本长度 */
  resumeLength: number;
  /** 总体匹配度 0-100 */
  overallScore: number;
  /** 各维度得分 */
  dimensions: DimensionScore[];
  /** 各维度权重（与 dimensions 一一对应，0-1，合计为 1） */
  weights: number[];
  /** 命中关键词（JD 要求且简历已包含） */
  matchedKeywords: string[];
  /** 缺失关键词（JD 要求但简历未包含） */
  missingKeywords: string[];
  /** 可执行改进建议 */
  suggestions: string[];
  /** 是否使用了 AI 增强（false 表示规则降级） */
  aiEnhanced: boolean;
  /** 诊断置信度：低/中/高，基于输入信号质量（简历长度、JD 关键词数量等） */
  confidence?: Confidence;
  /** 差距补救路线：对每个缺失项给出「硬缺口/表达缺口」分类与可行动建议 */
  gapRemediation?: GapRemediation[];
}

/** 差距补救条目 */
export interface GapRemediation {
  /** 缺失关键词 */
  keyword: string;
  /** 缺口类型：hard=硬技能缺口（需学习/补充）；expression=表达缺口（可在现有经历中补位） */
  kind: "hard" | "expression";
  /** 可执行的补救建议 */
  action: string;
}

/** 单一维度得分 */
export interface DimensionScore {
  /** 维度名 */
  name: string;
  /** 0-100 */
  score: number;
  /** 简短说明 */
  description: string;
  /** 该维度权重（0-1，随维度自带，避免按 index 对齐脆弱） */
  weight: number;
}

/** API 请求体 */
export interface AnalyzeRequest {
  /** 简历文本（服务端已解析） */
  resumeText: string;
  /** 目标岗位 JD */
  jdText: string;
}

// ===== 结构化简历数据模型（编辑器线使用） =====

/** 可选模板（20 套，2026-08 重构后新版式） */
export type TemplateId =
  | "timeline"        // ① 时间轴（蓝点，何钊新 PDF 版式）
  | "minimal-blue"    // ② 单栏极简蓝
  | "bw-minimal"      // ③ 黑白极简（ATS 友好）
  | "artistic"        // ④ 留白文艺
  | "dense"           // ⑤ 紧凑单页
  | "fresh-green"     // ⑥ 清新绿
  | "gradient-purple" // ⑦ 渐变紫
  | "vibrant-orange"  // ⑧ 活力橙
  | "it-minimal"      // ⑨ 极简 IT
  | "biz-split"       // ⑩ 简约商务分栏
  | "edu-blue"        // ⑪ 时尚蓝教育
  | "dark-biz"        // ⑫ 深色经典商务
  | "space-grey"      // ⑬ 深空灰
  | "rose-gold"       // ⑭ 玫瑰金
  | "classic-red"     // ⑮ 经典红黑
  | "light-blue"      // ⑯ 浅蓝清新
  | "sidebar-navy"    // ⑰ 侧栏深蓝
  | "military-green"  // ⑱ 军绿稳重
  | "topbar-modern"   // ⑲ 顶部色条
  | "magazine";       // ⑳ 杂志风

/** 旧模板 id → 新模板映射（旧 localStorage 数据自动迁移） */
export const LEGACY_TEMPLATE_MAP: Record<string, TemplateId> = {
  classic: "minimal-blue",
  modern: "topbar-modern",
  compact: "dense",
  sidebar: "sidebar-navy",
  elegant: "magazine",
  creative: "gradient-purple",
};

/** 基本信息 */
export interface BasicInfo {
  name: string;
  /** 求职意向 / 目标职位 */
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  /** 个人简介 */
  summary: string;
  /** 出生年月（可选） */
  birth?: string;
  /** 性别（可选） */
  sex?: string;
}

/** 教育经历 */
export interface EducationItem {
  id: string;
  school: string;
  /** 学历 */
  degree: string;
  /** 专业 */
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

/** 实习经历（与工作经历同构，渲染共用） */
export interface InternshipItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

/** 工作经历 */
export interface WorkItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  /** 工作描述，支持 STAR 句式 */
  bullets: string[];
}

/** 项目经历 */
export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  link: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

/** 校园经历 / 社团 / 志愿者 */
export interface ActivityItem {
  id: string;
  /** 组织 / 社团 / 赛事名称 */
  org: string;
  /** 角色 */
  role: string;
  startDate: string;
  endDate: string;
  /** 职责与贡献 */
  description: string;
}

/** 荣誉奖项 / 证书 */
export interface AwardItem {
  id: string;
  /** 奖项 / 证书名 */
  name: string;
  /** 时间（如 2024.09） */
  date: string;
  /** 颁发机构 / 说明 */
  description: string;
}

/** 语言能力 */
export interface LanguageItem {
  id: string;
  language: string;
  /** 熟练度，如 CET-6 / 流利 / N3 */
  level: string;
}

/** 作品集 */
export interface PortfolioItem {
  id: string;
  name: string;
  link: string;
  description: string;
}

/** 技能分组 */
export interface SkillGroup {
  id: string;
  /** 分类，如 前端 / 后端 / 语言 */
  category: string;
  /** 技能列表 */
  items: string[];
}

/** 可显示/隐藏的内容板块 key */
export type SectionKey =
  | "advantages"
  | "education"
  | "languages"
  | "internships"
  | "work"
  | "projects"
  | "activities"
  | "skills"
  | "awards"
  | "portfolio";

/** 板块显示开关：缺省视为显示 */
export type SectionVisibility = Partial<Record<SectionKey, boolean>>;

/** 完整简历数据（v2：12 板块 + 头像） */
export interface Resume {
  basics: BasicInfo;
  /** 个人优势，每条一个 bullet */
  advantages: string[];
  education: EducationItem[];
  languages: LanguageItem[];
  internships: InternshipItem[];
  work: WorkItem[];
  projects: ProjectItem[];
  activities: ActivityItem[];
  skills: SkillGroup[];
  awards: AwardItem[];
  portfolio: PortfolioItem[];
  /** 板块显示开关 */
  visibility: SectionVisibility;
  /** 头像照片（dataURL/base64，可空） */
  avatar?: string;
  template: TemplateId;
}

/** 生成空白简历 */
export function createEmptyResume(): Resume {
  return {
    basics: { name: "", title: "", email: "", phone: "", location: "", website: "", summary: "", birth: "", sex: "" },
    advantages: [],
    education: [],
    languages: [],
    internships: [],
    work: [],
    projects: [],
    activities: [],
    skills: [],
    awards: [],
    portfolio: [],
    visibility: {},
    avatar: "",
    template: "timeline",
  };
}
