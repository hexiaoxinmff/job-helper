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
  // 上游调用超时 20s，防止 DeepSeek 慢响应拖垮云函数实例
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
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
      signal: controller.signal,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`DeepSeek ${res.status}: ${txt.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    if (!content) throw new Error("DeepSeek 返回空内容");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function actionAnalyze(resumeText, jdText) {
  const trimmedResume = (resumeText || "").slice(0, 6000);
  const trimmedJd = (jdText || "").slice(0, 3000);
  const prompt = `你是一位资深 HR 与简历优化专家，擅长把模糊的简历诊断转化为可落地动作。请分析以下简历与目标岗位 JD 的匹配情况。

【目标岗位 JD】
${trimmedJd}

【简历内容】
${trimmedResume}

输出要求：
1. overallScore：0-100 整数，综合匹配度。评分要准不要虚高；关键信息（如量化成果、核心技能）缺失应明显扣分。
2. dimensions：固定 5 个维度（技能匹配 / 关键词覆盖 / 经历与成果 / 教育背景 / 表达规范），每项 score 为 0-100 整数；description 用一句话点出判断依据或证据（引用简历 / JD 中的事实），不要空话。
3. suggestions：3-5 条中文改进建议，按重要性从高到低排列。每条必须：
   - 指出简历里具体哪段 / 哪点有问题（引用真实片段或明确位置，不要凭空）；
   - 给出改法，并尽量提供「改写前 → 改写后」对照句（改写后须真实、不编造）；
   - 若需要量化，提示应补充哪类数字。
   严禁出现"建议多补充经历""注意排版"这类空泛话。

严格按以下 JSON 格式输出（不输出其他内容）：
{
  "overallScore": 0-100,
  "dimensions": [
    {"name": "技能匹配", "score": 0-100, "description": "判断依据"},
    {"name": "关键词覆盖", "score": 0-100, "description": "判断依据"},
    {"name": "经历与成果", "score": 0-100, "description": "判断依据"},
    {"name": "教育背景", "score": 0-100, "description": "判断依据"},
    {"name": "表达规范", "score": 0-100, "description": "判断依据"}
  ],
  "suggestions": ["建议1（含改写前→改写后）", "建议2", "建议3"]
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
  const prompt = `你是一位资深简历优化专家。请把下面这段经历描述扩写为可直接写进简历的 STAR 句式（情境 Situation、任务 Task、行动 Action、结果 Result）。

【经历描述】
${text}

输出要求：
1. star：完整一句，≤110 字。必须以强动词开头（实现 / 主导 / 设计 / 搭建 / 优化 / 推动 / 构建 等）；结构为「情境+任务一句话带过 → 行动（含具体方法 / 工具 / 分工）→ 结果（量化产出，无真实数字用『提升约 X%』并标注待补真实值）」；不要写公司背景铺垫。
2. parts：4 段。情境、任务各一句简写；行动写"用了什么方法 / 工具、具体做了什么"；结果写量化产出或明确占位。每条 content 要具体、不空泛。
3. tips：1-2 条落地建议（如"面试时展开讲行动细节""把占位数字换成真实指标"）。

严格按以下 JSON 格式输出（不输出其他内容）：
{
  "star": "完整 STAR 句式",
  "parts": [{"label":"情境","content":"..."},{"label":"任务","content":"..."},{"label":"行动","content":"..."},{"label":"结果","content":"..."}],
  "tips": ["建议1","建议2"]
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
// 请求体上限 1MB：静态前端不会发更大体积，防滥用打爆内存
const MAX_BODY_BYTES = 1024 * 1024;

const server = http.createServer(async (req, res) => {
  // 注意：不要在此设置 Access-Control-Allow-Origin。
  // 该函数在网关(WEB_SCF)后面，网关会反射并追加 Origin 作为 ACAO；
  // 若函数再写 * 会与网关的 Origin 拼成 "origin,*" 被浏览器判非法。
  // 故 ACAO 完全交给网关处理，这里只声明允许的方法/请求头。
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
  let tooLarge = false;
  try {
    // 逐块读取；超过上限后停止累积（丢弃后续数据），读完流后返回 413。
    // 不主动 destroy 连接——网关会把中断连接转成 4xx 非标准码，统一以 413 响应。
    for await (const chunk of req) {
      if (tooLarge) continue; // 已超限：只消耗流，不再累积
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        tooLarge = true;
        body = ""; // 释放已累积内存
      }
    }
    if (tooLarge) {
      res.statusCode = 413;
      res.end(JSON.stringify({ ok: false, error: "请求体过大（上限 1MB）" }));
      return;
    }
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
