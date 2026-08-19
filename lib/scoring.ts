import type { AnalysisResult, DimensionScore, GapRemediation } from "./types";
import {
  SKILL_KEYWORDS,
  EDUCATION_KEYWORDS,
  EXPERIENCE_KEYWORDS,
} from "./keywords";

// ========== 规则特征词 ==========

const ACHIEVEMENT_PATTERN = /\d+(\.\d+)?\s*(%|万|人|次|天|倍|分|名|篇|项|个|家)/;

const STRONG_VERBS = [
  "实现", "开发", "设计", "搭建", "优化", "提升", "降低", "完成", "主导", "负责",
  "构建", "编写", "部署", "落地", "推动", "达成", "获得", "荣获",
];

// ========== 工具函数 ==========

function toLowerCase(s: string): string {
  return s.toLowerCase();
}

function countOccurrences(text: string, keyword: string): number {
  const lowerText = toLowerCase(text);
  const lowerKeyword = toLowerCase(keyword);
  let count = 0;
  let idx = 0;
  while (true) {
    idx = lowerText.indexOf(lowerKeyword, idx);
    if (idx === -1) break;
    count++;
    idx += lowerKeyword.length;
  }
  return count;
}

// ========== 核心评分 ==========

export function analyzeResume(
  resumeText: string,
  jdText: string
): AnalysisResult {
  const resume = toLowerCase(resumeText);
  const jd = toLowerCase(jdText);

  // 1. 提取 JD 中的技能关键词，按出现次数排序
  const jdKeywords = SKILL_KEYWORDS.filter(
    (kw) => jd.includes(kw) && countOccurrences(resume, kw) === 0
  );

  // 命中与缺失：以 JD 中出现的技能为准
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of SKILL_KEYWORDS) {
    if (!jd.includes(kw)) continue; // JD 没要求的技能不参与
    if (resume.includes(kw)) matched.push(kw);
    else missing.push(kw);
  }

  // 2. 维度评分
  const dimensions: DimensionScore[] = [];

  // 维度一：技能匹配度（JD 要求的技能，简历命中比例）
  const requiredSkills = SKILL_KEYWORDS.filter((kw) => jd.includes(kw));
  const skillScore = requiredSkills.length
    ? Math.round(
        (requiredSkills.filter((kw) => resume.includes(kw)).length /
          requiredSkills.length) *
          100
      )
    : 50;
  dimensions.push({
    name: "技能匹配",
    score: skillScore,
    description:
      requiredSkills.length === 0
        ? "JD 中未识别到常见技能关键词，请检查 JD 是否粘贴完整"
        : `JD 要求 ${requiredSkills.length} 项技能，简历命中 ${requiredSkills.filter((kw) => resume.includes(kw)).length} 项`,
  });

  // 维度二：关键词覆盖（JD 全文高频词与简历文本的语义重合，用技能+教育+经验三类词覆盖率近似）
  const allKeywordTypes = [
    ...SKILL_KEYWORDS,
    ...EXPERIENCE_KEYWORDS,
  ];
  const jdAllWords = allKeywordTypes.filter((kw) => jd.includes(kw));
  const keywordScore = jdAllWords.length
    ? Math.round(
        (jdAllWords.filter((kw) => resume.includes(kw)).length /
          jdAllWords.length) *
          100
      )
    : 50;
  dimensions.push({
    name: "关键词覆盖",
    score: keywordScore,
    description: `JD 共识别 ${jdAllWords.length} 个关键词，简历覆盖 ${jdAllWords.filter((kw) => resume.includes(kw)).length} 个`,
  });

  // 维度三：经历与成果（是否有实习/项目描述 + 量化成果）
  let expScore = 30;
  const expHitCount = EXPERIENCE_KEYWORDS.filter((kw) =>
    resume.includes(kw)
  ).length;
  const hasNumbers = ACHIEVEMENT_PATTERN.test(resumeText);
  const hasStrongVerbs = STRONG_VERBS.some((v) => resume.includes(v));
  expScore += expHitCount * 15; // 每个经历关键词 +15
  if (hasNumbers) expScore += 20; // 有量化数据 +20
  if (hasStrongVerbs) expScore += 10; // 有强动词 +10
  dimensions.push({
    name: "经历与成果",
    score: Math.min(100, expScore),
    description: hasNumbers
      ? "简历含量化成果（如 %/万/人/次 等），加分项"
      : "未发现量化成果数据，建议补充具体数字（如「提升 30%」）",
  });

  // 维度四：教育背景（学历关键词 + 专业匹配）
  let eduScore = 30;
  const eduHitCount = EDUCATION_KEYWORDS.filter((kw) =>
    resume.includes(kw)
  ).length;
  eduScore += eduHitCount * 15;
  // 专业匹配：从 JD 中提取"计算机/数据/软件/运营/设计"等方向词，看简历是否出现
  const majorDirections = [
    "计算机", "软件", "数据", "统计", "数学", "自动化", "电子", "通信",
    "金融", "会计", "市场营销", "新闻", "设计", "教育",
  ];
  const jdMajors = majorDirections.filter((m) => jd.includes(m));
  const majorMatched = jdMajors.filter((m) => resume.includes(m));
  eduScore += jdMajors.length
    ? Math.round((majorMatched.length / jdMajors.length) * 40)
    : 10;
  dimensions.push({
    name: "教育背景",
    score: Math.min(100, eduScore),
    description:
      jdMajors.length > 0
        ? `JD 提及方向：${jdMajors.join("、")}；简历命中：${majorMatched.join("、") || "无"}`
        : "JD 未识别到专业方向词",
  });

  // 维度五：表达规范（结构清晰度：段落/换行 + 标点 + 无明显堆砌）
  let formatScore = 40;
  const hasStructure = /\n\s*\n/.test(resumeText) || resumeText.split("\n").length > 8;
  const hasPunct = /[，。；、]/.test(resumeText);
  const isTooShort = resumeText.replace(/\s/g, "").length < 200;
  const isTooLong = resumeText.replace(/\s/g, "").length > 3000;
  if (hasStructure) formatScore += 20;
  if (hasPunct) formatScore += 15;
  if (!isTooShort) formatScore += 15;
  if (isTooShort) formatScore -= 20;
  if (isTooLong) formatScore -= 15;
  dimensions.push({
    name: "表达规范",
    score: Math.max(0, Math.min(100, formatScore)),
    description: isTooShort
      ? "简历内容过短（<200 字），可能信息不完整"
      : isTooLong
        ? "简历偏长（>3000 字），建议精简，突出与岗位最相关的经历"
        : hasStructure
          ? "结构清晰（分段明确）"
          : "建议增加分段，让结构更清晰",
  });

  // 3. 总体分（加权）
  // 维度权重与顺序：技能匹配 / 关键词覆盖 / 经历与成果 / 教育背景 / 表达规范
  // 校准：下调纯关键词命中的「技能匹配」权重，上调真正体现简历价值的「经历与成果」，
  // 避免 JD 未识别到技能词时分数虚高/虚低、整体波动过大。
  const weights = [0.3, 0.2, 0.25, 0.1, 0.15];
  const overallScore = Math.round(
    dimensions.reduce((sum, d, i) => sum + d.score * weights[i], 0)
  );

  // 4. 规则化建议（按缺失项生成）
  const suggestions = buildRuleSuggestions(resumeText, jdText, missing);

  // 维度感知的针对性建议（规则增强：无 AI 时也能给出可操作方向）
  const dimScore = (n: string) => dimensions.find((d) => d.name === n)?.score ?? 100;
  if (dimScore("技能匹配") < 60) {
    suggestions.push("技能匹配度偏低：把 JD 最看重的技能放到简历靠前位置，并在项目/工作中用具体产出证明，而非只列名词。");
  }
  if (dimScore("经历与成果") < 50) {
    suggestions.push("经历与成果偏弱：用 STAR 结构（情境-任务-行动-结果）重写经历，每条写成「动词+对象+量化结果」。");
  }
  if (dimScore("关键词覆盖") < 50) {
    suggestions.push("关键词覆盖不足：把 JD 高频词自然融入项目与职责描述， 避免生硬堆砌。");
  }
  if (dimScore("表达规范") < 60) {
    suggestions.push("表达规范性可提升：分点列出职责与成果，每条以强动词开头（实现/优化/主导），避免大段纯文本。");
  }

  // 5. 差距补救路线（诚实诊断：区分硬缺口与表达缺口，而非笼统"学会它"）
  const gapRemediation = buildGapRemediation(missing);

  // 6. 置信度：基于输入信号质量（简历长度、JD 关键技能数量、可计算样本量）
  const resumeLen = resumeText.replace(/\s/g, "").length;
  const jdSkillCount = requiredSkills.length;
  const sampleSize = requiredSkills.length + missing.length; // 已识别 JD 要求技能的样本量
  const confidence: "low" | "medium" | "high" =
    resumeLen < 200 || jdSkillCount === 0
      ? "low"
      : sampleSize >= 3 && jdSkillCount >= 3
        ? "high"
        : "medium";

  return {
    resumeText: resumeText.slice(0, 500),
    resumeLength: resumeText.length,
    overallScore,
    dimensions,
    weights,
    matchedKeywords: matched.slice(0, 20),
    missingKeywords: missing.slice(0, 20),
    suggestions,
    aiEnhanced: false,
    confidence,
    gapRemediation,
  };
}

function buildRuleSuggestions(
  resumeText: string,
  jdText: string,
  missingKeywords: string[]
): string[] {
  const suggestions: string[] = [];

  if (missingKeywords.length > 0) {
    suggestions.push(
      `简历缺少 JD 要求的以下技能关键词：${missingKeywords
        .slice(0, 8)
        .join("、")}。如果实际掌握，请在技能/项目经历中明确写出；如果不会，可考虑针对性学习或在项目里体现。`
    );
  }

  if (!ACHIEVEMENT_PATTERN.test(resumeText)) {
    suggestions.push(
      "缺少量化成果：把「负责 XX」改成「负责 XX，使效率提升 30%」，用数字证明能力。"
    );
  }

  if (jdText.includes("团队") && !resumeText.includes("团队")) {
    suggestions.push("JD 强调团队协作，建议在经历中补充团队规模与分工（如「5 人团队中负责 XX」）。");
  }

  if (jdText.includes("实习") && !resumeText.includes("实习")) {
    suggestions.push("JD 要求实习/工作经验，如果暂无相关实习，用课程项目或校园实践补位，重点突出可迁移技能。");
  }

  if (resumeText.replace(/\s/g, "").length < 200) {
    suggestions.push("简历内容过于单薄，建议补充教育背景、技能清单、项目经历三大部分，总字数 500 字以上。");
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "整体匹配度不错！建议进一步：1) 根据目标岗位微调技能排序，把 JD 最看重的技能放前面；2) 准备 STAR 故事（情境-任务-行动-结果）应对面试深挖。"
    );
  }

  return suggestions.slice(0, 5);
}

// ========== 差距补救路线（诚实诊断） ==========
// 区分「硬技能缺口」与「表达缺口」，给用户可行动的路线，而非笼统要求"学会它"。
// 偏软素质 / 经验诉求的关键词，通常可在既有经历中补位，不必编造新经历；
// 偏工具 / 技术的关键词，则属于真正需要学习或补充项目的硬性缺口。
const SOFT_GAP_TERMS = [
  "团队", "沟通", "协作", "领导", "实习", "经验", "责任心", "抗压",
  "学习能力", "表达", "组织", "协调", "客户", "用户", "解决问题",
  "执行力", "主动", "结果导向", "自我驱动",
];
const ENGLISH_SOFT_GAP_TERMS = [
  "team", "communication", "collaboration", "leadership", "internship",
  "experience", "responsible", "ownership", "communication skills",
];

function classifyGap(kw: string): "hard" | "expression" {
  const k = kw.toLowerCase();
  if (SOFT_GAP_TERMS.includes(kw) || ENGLISH_SOFT_GAP_TERMS.some((t) => k.includes(t))) {
    return "expression";
  }
  return "hard";
}

function buildGapRemediation(missing: string[]): GapRemediation[] {
  return missing.slice(0, 12).map((keyword) => {
    const kind = classifyGap(keyword);
    const action =
      kind === "expression"
        ? `这是软素质 / 经验诉求，可在你已有的经历中用具体事例或强动词体现（例：把「参与项目」改成「主导 / 协同 X 人完成 Y，产出 Z」），无需编造新经历。`
        : `这是硬技能缺口，建议通过课程、开源项目或实操练习补齐，并在简历中体现「做了什么 + 产出」，而非只写名词。`;
    return { keyword, kind, action };
  });
}
