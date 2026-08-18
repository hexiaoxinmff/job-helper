// ai-proxy：CloudBase HTTP（Web）云函数
// 形态：原生 Node HTTP 服务，监听 9000，由 scf_bootstrap 拉起。
// 隐藏 DEEPSEEK_API_KEY，对外提供 4 个 AI 能力：
//   action = "analyze"      { resumeText, jdText }            -> AI 评分建议
//   action = "jdSemantics"  { jdText }                         -> JD 语义解析（近义技能）
//   action = "rewrite"      { resumeText, jdText, missingKeywords } -> AI 改写文案
//   action = "star"         { experience }                     -> STAR 句式生成
// 仅服务端调用 DeepSeek，前端永远拿不到 key。

const http = require("http");

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

function parseJsonObject(content) {
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("无法从模型返回中解析 JSON 对象");
  return JSON.parse(m[0]);
}

function parseJsonArray(content) {
  const m = content.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("无法从模型返回中解析 JSON 数组");
  return JSON.parse(m[0]);
}

async function callDeepSeek(systemPrompt, userPrompt, maxTokens) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
      max_tokens: maxTokens || 1500,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`DeepSeek ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("DeepSeek 返回空内容");
  return content;
}

async function actionAnalyze(resumeText, jdText) {
  const trimmedResume = (resumeText || "").slice(0, 6000);
  const trimmedJd = (jdText || "").slice(0, 3000);
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

  const content = await callDeepSeek("你只输出合法的 JSON，不做任何解释。", prompt, 2000);
  const parsed = parseJsonObject(content);

  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.filter((s) => typeof s === "string").slice(0, 5)
    : [];
  const dimensions = Array.isArray(parsed.dimensions)
    ? parsed.dimensions
        .filter((d) => d && typeof d === "object")
        .slice(0, 5)
        .map((d) => ({
          name: String(d.name ?? "维度"),
          score: Math.max(0, Math.min(100, Number(d.score) || 0)),
          description: String(d.description ?? ""),
        }))
    : [];
  const overallScore =
    typeof parsed.overallScore === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.overallScore)))
      : undefined;

  if (suggestions.length === 0 && dimensions.length === 0)
    throw new Error("AI 未返回有效建议");
  return { overallScore, dimensions, suggestions };
}

async function actionJdSemantics(jdText) {
  const trimmedJd = (jdText || "").slice(0, 3000);
  const prompt = `你是一位资深招聘专家。请从下面的岗位 JD 中提取核心技能要求，并给出这些技能在简历中常见的等价表述。

【目标岗位 JD】
${trimmedJd}

要求：
1. coreSkills 只列硬技能/专业能力（如 Python、数据分析、机器学习），5-10 项，用岗位招聘中常用叫法，不要列"责任心、团队合作"这类泛化词。
2. aliases 可选：对每个 coreSkills 中的技能，列出简历中常见等价/近义表述（2-4 个）。
3. 严格按 JSON 输出（不要输出其他内容）：
{
  "coreSkills": ["技能1", "技能2"],
  "aliases": [{"skill": "技能1", "terms": ["等价表述1", "等价表述2"]}],
  "jdSummary": "一句话概括这个岗位要什么样的人"
}`;

  const content = await callDeepSeek("你只输出合法的 JSON，不做任何解释。", prompt, 1200);
  const parsed = parseJsonObject(content);

  const coreSkills = Array.isArray(parsed.coreSkills)
    ? parsed.coreSkills.filter((s) => typeof s === "string").slice(0, 10)
    : [];
  const aliases = Array.isArray(parsed.aliases)
    ? parsed.aliases
        .filter((a) => a && typeof a === "object")
        .slice(0, 10)
        .map((a) => ({
          skill: String(a.skill ?? ""),
          terms: Array.isArray(a.terms)
            ? a.terms.filter((t) => typeof t === "string").slice(0, 5)
            : [],
        }))
        .filter((a) => a.skill)
    : [];
  const jdSummary = String(parsed.jdSummary ?? "").slice(0, 200);

  if (coreSkills.length === 0) throw new Error("AI 未提取到核心技能");
  return { coreSkills, aliases, jdSummary };
}

async function actionRewrite(resumeText, jdText, missingKeywords) {
  const list = Array.isArray(missingKeywords) ? missingKeywords.slice(0, 8) : [];
  if (list.length === 0) return [];
  const trimmedResume = (resumeText || "").slice(0, 6000);
  const trimmedJd = (jdText || "").slice(0, 3000);
  const prompt = `你是一位资深简历优化专家。请针对简历缺失的关键词，基于简历已有内容生成可落地的改写文案。

【目标岗位 JD】
${trimmedJd}

【简历内容】
${trimmedResume}

【缺失的关键词】
${list.join("、")}

要求：
1. 每个缺失关键词生成一条改写建议，改写句必须基于简历已有经历（不虚构、不编造），可把缺失关键词自然嵌入句子。
2. 若某关键词与简历完全无关，rewritten 填空字符串，reason 说明"建议学习后补充或删除该关键词"。
3. 每条 original 填简历中最相关原文片段（找不到填空字符串）。
4. 严格按 JSON 数组输出（不要输出其他内容）：
[{"keyword":"机器学习","original":"负责电商订单数据分析","rewritten":"负责电商订单数据分析，并基于 scikit-learn 构建用户流失预测模型（准确率 87%）","reason":"在既有数据工作上嵌入机器学习，既真实又补齐关键词"}]

最多输出 ${list.length} 条。`;

  const content = await callDeepSeek("你只输出合法的 JSON 数组，不做任何解释。", prompt, 2000);
  const parsed = parseJsonArray(content);
  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.items)
    ? parsed.items
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
}

async function actionStar(experience) {
  const text = (experience || "").slice(0, 1000);
  const prompt = `你是一位简历优化专家。请把下面这段经历描述扩写为 STAR 句式（情境 Situation、任务 Task、行动 Action、结果 Result），用于写入简历。

【经历描述】
${text}

要求：
1. 情境(S)、任务(T)简洁，行动(A)具体（含方法/工具），结果(R)尽量量化；无量化数据时用「提升约 X%」占位并提示用户填真实数字。
2. 完整成句，可直接粘贴进简历，总长不超过 120 字。
3. 严格按 JSON 输出（不要输出其他内容）：
{
  "star": "完整的一段 STAR 句式",
  "parts": [{"label":"情境","content":"..."},{"label":"任务","content":"..."},{"label":"行动","content":"..."},{"label":"结果","content":"..."}],
  "tips": ["1-2 条使用建议"]
}`;

  const content = await callDeepSeek("你只输出合法的 JSON，不做任何解释。", prompt, 1200);
  const parsed = parseJsonObject(content);
  const star = String(parsed.star ?? "");
  if (!star) throw new Error("AI 未返回 STAR 句式");
  const parts = Array.isArray(parsed.parts)
    ? parsed.parts
        .filter((p) => p && typeof p === "object")
        .slice(0, 4)
        .map((p) => ({ label: String(p.label ?? ""), content: String(p.content ?? "") }))
    : [];
  const tips = Array.isArray(parsed.tips)
    ? parsed.tips.filter((t) => typeof t === "string").slice(0, 3)
    : [];
  return { star, parts, tips };
}

async function dispatch(payload) {
  const { action } = payload || {};
  switch (action) {
    case "analyze":
      return await actionAnalyze(payload.resumeText, payload.jdText);
    case "jdSemantics":
      return await actionJdSemantics(payload.jdText);
    case "rewrite":
      return await actionRewrite(payload.resumeText, payload.jdText, payload.missingKeywords);
    case "star":
      return await actionStar(payload.experience);
    default:
      const err = new Error(`未知 action: ${action}`);
      err.status = 400;
      throw err;
  }
}

const PORT = 9000;
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: "仅支持 POST" }));
    return;
  }
  if (!DEEPSEEK_API_KEY) {
    res.statusCode = 503;
    res.end(JSON.stringify({ ok: false, error: "AI 服务未配置 API Key" }));
    return;
  }

  let body = "";
  try {
    for await (const chunk of req) body += chunk;
    const payload = JSON.parse(body || "{}");
    const data = await dispatch(payload);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, data }));
  } catch (e) {
    const status = e && e.status ? e.status : 500;
    res.statusCode = status;
    res.end(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e).slice(0, 300) }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[ai-proxy] listening on ${PORT}`);
});
