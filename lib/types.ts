// 共享类型定义

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
}

/** 单一维度得分 */
export interface DimensionScore {
  /** 维度名 */
  name: string;
  /** 0-100 */
  score: number;
  /** 简短说明 */
  description: string;
}

/** API 请求体 */
export interface AnalyzeRequest {
  /** 简历文本（服务端已解析） */
  resumeText: string;
  /** 目标岗位 JD */
  jdText: string;
}

// ===== 结构化简历数据模型（编辑器线使用） =====

/** 可选模板 */
export type TemplateId = "classic" | "modern" | "compact";

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

/** 技能分组 */
export interface SkillGroup {
  id: string;
  /** 分类，如 前端 / 后端 / 语言 */
  category: string;
  /** 技能列表 */
  items: string[];
}

/** 完整简历数据 */
export interface Resume {
  basics: BasicInfo;
  education: EducationItem[];
  work: WorkItem[];
  projects: ProjectItem[];
  skills: SkillGroup[];
  template: TemplateId;
}

/** 生成空白简历 */
export function createEmptyResume(): Resume {
  return {
    basics: { name: "", title: "", email: "", phone: "", location: "", website: "", summary: "" },
    education: [],
    work: [],
    projects: [],
    skills: [],
    template: "classic",
  };
}
