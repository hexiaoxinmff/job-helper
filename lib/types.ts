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
