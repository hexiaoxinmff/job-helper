// 简历 ATS 友好度检测（纯前端规则，零成本，无需 AI）
// ATS（Applicant Tracking System）用机器解析简历做关键词检索。以下检查项均基于
// 「已解析出的纯文本简历」可评估的信号，诚实反映可解析性、结构、关键词命中与量化：
// 超出文本可判断范围的（如是否用了无法解析的多栏/图片版式）不臆测，仅在提示中说明。

export type AtsCheckStatus = "pass" | "warn" | "fail";
export interface AtsCheck {
  label: string;
  status: AtsCheckStatus;
  tip: string;
}
export interface AtsResult {
  /** 0-100 */
  score: number;
  checks: AtsCheck[];
}

const ACHIEVEMENT_PATTERN = /\d+(\.\d+)?\s*(%|万|人|次|天|倍|分|名|篇|项|个|家)/;
const SECTION_PATTERN = /(教育|经历|技能|项目|实习|工作|自评|优势)/;

function sectionHit(resume: string): boolean {
  return SECTION_PATTERN.test(resume) && (resume.split("\n").filter((l) => l.trim()).length >= 4);
}

/** 基于已解析文本的 ATS 友好度评估（不修改诊断主分，作为独立维度卡展示） */
export function analyzeAtsFriendly(
  resumeText: string,
  jdText: string,
  matchedKeywords: string[],
  missingKeywords: string[]
): AtsResult {
  const text = (resumeText || "").trim();
  const noSpaceLen = text.replace(/\s/g, "").length;
  const checks: AtsCheck[] = [];

  // 1) 文本可解析（有实质内容，非空/扫描件）
  if (noSpaceLen < 100) {
    checks.push({
      label: "文本可解析",
      status: "fail",
      tip: "内容过少（<100 字）。若为扫描件/图片版式，ATS 通常无法识别，请改用文字版 PDF。",
    });
  } else {
    checks.push({
      label: "文本可解析",
      status: "pass",
      tip: "已提取到足量文字，可被 ATS 检索。",
    });
  }

  // 2) 标准化结构（分段 + 常见板块标题）
  const hasStructure = /\n\s*\n/.test(text) || text.split("\n").length > 8;
  if (!sectionHit(text) && noSpaceLen > 150) {
    checks.push({
      label: "清晰结构",
      status: "warn",
      tip: "缺少常见板块标题（教育/经历/技能/项目等）。ATS 靠关键词分区定位，建议补明板块标题并单栏左对齐排版。",
    });
  } else if (hasStructure) {
    checks.push({ label: "清晰结构", status: "pass", tip: "分段清晰，含常见板块，便于 ATS 分区解析。" });
  } else {
    checks.push({
      label: "清晰结构",
      status: "warn",
      tip: "建议增加分段与板块标题，让结构与关键词更易被检索。",
    });
  }

  // 3) 技能关键词命中（JD 要求技能在简历中出现比例）
  const totalReq = matchedKeywords.length + missingKeywords.length;
  if (totalReq === 0) {
    checks.push({
      label: "技能关键词",
      status: "pass",
      tip: "未在 JD 中识别到明确技能关键词，无法评估；ATS 更看重技能词命中，建议把岗位核心技能显式写出。",
    });
  } else {
    const ratio = matchedKeywords.length / totalReq;
    const status: AtsCheckStatus = ratio >= 0.5 ? "pass" : ratio >= 0.2 ? "warn" : "fail";
    checks.push({
      label: "技能关键词",
      status,
      tip: `JD 相关技能命中 ${matchedKeywords.length}/${totalReq}。ATS 按关键词检索，命中率偏低时建议在技能/项目描述中自然嵌入 JD 高频词（勿生硬堆砌）。`,
    });
  }

  // 4) 量化成果（数字+单位）
  if (noSpaceLen >= 100 && ACHIEVEMENT_PATTERN.test(text)) {
    checks.push({ label: "量化成果", status: "pass", tip: "含量化成果（% / 人 / 次…），更能打动筛选系统与 HR。" });
  } else if (noSpaceLen >= 100) {
    checks.push({
      label: "量化成果",
      status: "warn",
      tip: "未发现量化数据。ATS 常见做法是把「负责 XX」写成「使 XX 提升 30%」，量化项更易被命中与加权。",
    });
  }

  // 5) 关键信息完整（联系方式 / 教育 / 技能）
  const hasContact = /[\w.\-]+@[\w.\-]+\.[a-z]{2,}/i.test(text) || /1[3-9]\d{9}/.test(text);
  const hasEdu = /(大学|学院|学校|本科|硕士|教育)/.test(text);
  if (noSpaceLen >= 100 && (!hasContact || !hasEdu)) {
    checks.push({
      label: "关键信息完整",
      status: "warn",
      tip: `${!hasContact ? "未检测到联系方式" : "未检测到教育经历"}。ATS 检索需要联系方式（邮箱/手机）与教育/经历等可定位信息。`,
    });
  } else {
    checks.push({
      label: "关键信息完整",
      status: noSpaceLen < 100 ? "warn" : "pass",
      tip: "已识别到联系方式与教育/技能等关键板块。",
    });
  }

  // 综合分：pass=100，warn=55，fail=20，取平均
  const weights: Record<AtsCheckStatus, number> = { pass: 100, warn: 55, fail: 20 };
  const score = Math.round(
    checks.reduce((sum, c) => sum + weights[c.status], 0) / checks.length
  );

  return { score, checks };
}