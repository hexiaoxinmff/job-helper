// DeepSeek AI 增强建议（可选）
// 未配置 DEEPSEEK_API_KEY 时，本模块返回 null，系统自动使用规则建议降级。

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export interface AiSuggestionResult {
  overallScore?: number;
  dimensions: { name: string; score: number; description: string }[];
  suggestions: string[];
}

/**
 * 调用 DeepSeek 生成结构化改进建议。
 * 失败或未配置 key 时返回 null（调用方降级为规则建议）。
 */
export async function generateAiSuggestions(
  resumeText: string,
  jdText: string
): Promise<AiSuggestionResult | null> {
  if (!DEEPSEEK_API_KEY) return null;

  // 简历可能很长，截断以控制 token 成本（约 6000 字符）
  const trimmedResume = resumeText.slice(0, 6000);
  const trimmedJd = jdText.slice(0, 3000);

  const prompt = `你是一位资深 HR 和简历优化专家。请分析以下简历与目标岗位 JD 的匹配情况。

【目标岗位 JD】
${trimmedJd}

【简历内容】
${trimmedResume}

请严格按以下 JSON 格式输出（不要输出其他内容）：
{
  "overallScore": 0-100 的整数（整体匹配度）,
  "dimensions": [
    {"name": "技能匹配", "score": 0-100, "description": "一句话说明"},
    {"name": "关键词覆盖", "score": 0-100, "description": "一句话说明"},
    {"name": "经历与成果", "score": 0-100, "description": "一句话说明"},
    {"name": "教育背景", "score": 0-100, "description": "一句话说明"},
    {"name": "表达规范", "score": 0-100, "description": "一句话说明"}
  ],
  "suggestions": ["3-5 条具体的、可执行的中文改进建议，每条一句话"]
}`;

  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: "你只输出合法的 JSON，不做任何解释。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      console.warn(`[ai] DeepSeek API error: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    if (!content) return null;

    // 提取 JSON（兼容模型偶尔输出代码块的情况）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const suggestions: string[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s: unknown) => typeof s === "string").slice(0, 5)
      : [];

    const dimensions = Array.isArray(parsed.dimensions)
      ? parsed.dimensions
          .filter((d: unknown) => d && typeof d === "object")
          .slice(0, 5)
          .map((d: Record<string, unknown>) => ({
            name: String(d.name ?? "维度"),
            score: Math.max(0, Math.min(100, Number(d.score) || 0)),
            description: String(d.description ?? ""),
          }))
      : [];

    const overallScore =
      typeof parsed.overallScore === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.overallScore)))
        : undefined;

    if (suggestions.length === 0 && dimensions.length === 0) return null;

    return { overallScore, dimensions, suggestions };
  } catch (err) {
    console.warn("[ai] DeepSeek call failed, falling back to rules:", err);
    return null;
  }
}

// ========== AI 简历改写 ==========

/** JD 语义解析结果 */
export interface JdSemantics {
  /** JD 明确要求的核心技能（岗位常用叫法） */
  coreSkills: string[];
  /** 近义/等价表述映射（用于简历匹配时识别语义相关技能） */
  aliases: { skill: string; terms: string[] }[];
  /** 一句话概括这个岗位要什么样的人 */
  jdSummary: string;
}

/**
 * 用 AI 语义解析 JD，提取核心技能及其近义表述。
 * 解决规则引擎"词面匹配"的局限（如 JD 要求"机器学习"、简历写"深度学习"识别不出）。
 * 返回 null 表示未配置 key 或调用失败（调用方降级为纯规则匹配）。
 */
export async function analyzeJdSemantics(
  jdText: string
): Promise<JdSemantics | null> {
  if (!DEEPSEEK_API_KEY) return null;

  const trimmedJd = jdText.slice(0, 3000);

  const prompt = `你是一位资深招聘专家。请从下面的岗位 JD 中提取核心技能要求，并给出这些技能在简历中常见的等价表述。

【目标岗位 JD】
${trimmedJd}

要求：
1. coreSkills 只列硬技能/专业能力（如 Python、数据分析、机器学习、沟通协调），5-10 项，用岗位招聘中常用的叫法，不要列"责任心、团队合作"这类过于泛化的词。
2. aliases 为可选：对每个 coreSkills 中的技能，列出简历中常见的等价/近义表述（2-4 个），例如 机器学习 → ["深度学习","神经网络","NLP","LLM"]；Python → ["python","python3"]。
3. 严格按以下 JSON 格式输出（不要输出其他内容）：
{
  "coreSkills": ["技能1", "技能2"],
  "aliases": [{"skill": "技能1", "terms": ["等价表述1", "等价表述2"]}],
  "jdSummary": "一句话概括这个岗位要什么样的人"
}`;

  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: "你只输出合法的 JSON，不做任何解释。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      console.warn(`[ai] JD semantics API error: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const coreSkills: string[] = Array.isArray(parsed.coreSkills)
      ? parsed.coreSkills.filter((s: unknown) => typeof s === "string").slice(0, 10)
      : [];

    const aliases = Array.isArray(parsed.aliases)
      ? parsed.aliases
          .filter((a: unknown) => a && typeof a === "object")
          .slice(0, 10)
          .map((a: Record<string, unknown>) => ({
            skill: String(a.skill ?? ""),
            terms: Array.isArray(a.terms)
              ? a.terms.filter((t: unknown) => typeof t === "string").slice(0, 5)
              : [],
          }))
          .filter((a: { skill: string; terms: string[] }) => a.skill)
      : [];

    const jdSummary = String(parsed.jdSummary ?? "").slice(0, 200);

    if (coreSkills.length === 0) return null;
    return { coreSkills, aliases, jdSummary };
  } catch (err) {
    console.warn("[ai] JD semantics call failed, falling back to keyword match:", err);
    return null;
  }
}

export interface RewriteItem {
  /** 缺失的关键词 */
  keyword: string;
  /** 原文片段（简历中与关键词最相关的位置，可为空） */
  original: string;
  /** 改写后可直接粘贴进简历的句子 */
  rewritten: string;
  /** 一句话说明为什么这么改 */
  reason: string;
}

/**
 * 针对缺失关键词，生成可落地的改写文案。
 * 返回 null 表示未配置 key 或调用失败。
 */
export async function generateResumeRewrites(
  resumeText: string,
  jdText: string,
  missingKeywords: string[]
): Promise<RewriteItem[] | null> {
  if (!DEEPSEEK_API_KEY) return null;
  if (missingKeywords.length === 0) return [];

  const trimmedResume = resumeText.slice(0, 6000);
  const trimmedJd = jdText.slice(0, 3000);

  const prompt = `你是一位资深简历优化专家。请针对简历缺失的关键词，基于简历已有内容生成可落地的改写文案。

【目标岗位 JD】
${trimmedJd}

【简历内容】
${trimmedResume}

【缺失的关键词】
${missingKeywords.slice(0, 8).join("、")}

要求：
1. 对每个缺失关键词生成一条改写建议，改写句必须基于简历已有经历（不虚构、不编造），可以把缺失关键词自然地嵌入句子。
2. 如果某个关键词确实与简历内容完全无关，rewritten 填空字符串，reason 说明"建议学习后补充或删除该关键词"。
3. 每条 original 填简历中最相关的原文片段（找不到填空字符串）。
4. 严格按以下 JSON 数组格式输出（不要输出其他内容）：
[{"keyword":"机器学习","original":"负责电商订单数据分析","rewritten":"负责电商订单数据分析，并基于 scikit-learn 构建用户流失预测模型（准确率 87%）","reason":"在既有数据工作基础上嵌入机器学习，既真实又补齐关键词"}]

最多输出 ${missingKeywords.slice(0, 8).length} 条。`;

  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: "你只输出合法的 JSON 数组，不做任何解释。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      console.warn(`[ai] Rewrite API error: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    if (!content) return null;

    // 兼容数组或 {items: [...]} 两种返回
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const items: RewriteItem[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>).items)
        ? (parsed as { items: RewriteItem[] }).items
        : [];

    return items
      .filter((it) => it && typeof it === "object")
      .map((it) => ({
        keyword: String(it.keyword ?? ""),
        original: String(it.original ?? ""),
        rewritten: String(it.rewritten ?? ""),
        reason: String(it.reason ?? ""),
      }))
      .filter((it) => it.keyword)
      .slice(0, 8);
  } catch (err) {
    console.warn("[ai] Rewrite call failed:", err);
    return null;
  }
}

// ========== STAR 描述生成 ==========

export interface StarResult {
  /** 完整 STAR 句式（可整体复制） */
  star: string;
  /** 分步拆解 */
  parts: { label: string; content: string }[];
  /** 使用建议 */
  tips: string[];
}

/**
 * 将一段经历描述扩写为 STAR 句式。
 * 返回 null 表示未配置 key 或调用失败。
 */
export async function generateStarDescription(
  experienceText: string
): Promise<StarResult | null> {
  if (!DEEPSEEK_API_KEY) return null;
  if (!experienceText.trim()) return null;

  const prompt = `你是一位简历优化专家。请把下面这段经历描述扩写为 STAR 句式（情境 Situation、任务 Task、行动 Action、结果 Result），用于写入简历。

【经历描述】
${experienceText.slice(0, 1000)}

要求：
1. 情境(S)、任务(T)简洁，行动(A)具体（含方法/工具），结果(R)尽量量化；如果原文没有量化数据，用「提升约 X%」这类占位并提示用户填真实数字。
2. 完整成句，可直接粘贴进简历，总长不超过 120 字。
3. 严格按以下 JSON 格式输出（不要输出其他内容）：
{
  "star": "完整的一段 STAR 句式",
  "parts": [{"label":"情境","content":"..."},{"label":"任务","content":"..."},{"label":"行动","content":"..."},{"label":"结果","content":"..."}],
  "tips": ["1-2 条使用建议"]
}`;

  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: "你只输出合法的 JSON，不做任何解释。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      console.warn(`[ai] STAR API error: ${res.status} ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const star = String(parsed.star ?? "");
    if (!star) return null;

    const parts = Array.isArray(parsed.parts)
      ? parsed.parts
          .filter((p: unknown) => p && typeof p === "object")
          .slice(0, 4)
          .map((p: Record<string, unknown>) => ({
            label: String(p.label ?? ""),
            content: String(p.content ?? ""),
          }))
      : [];

    const tips: string[] = Array.isArray(parsed.tips)
      ? parsed.tips.filter((t: unknown) => typeof t === "string").slice(0, 3)
      : [];

    return { star, parts, tips };
  } catch (err) {
    console.warn("[ai] STAR call failed:", err);
    return null;
  }
}
