// 浏览器端 AI 调用封装：统一打到 ai-proxy 云函数（隐藏 DeepSeek Key）。
// 失败时返回 null，由调用方降级为规则结果。

import type { ParsedResumeInput } from "./resume-import";

const AI_PROXY_URL =
  process.env.NEXT_PUBLIC_AI_PROXY_URL ||
  "https://xiaoxin2026-personal-d1acf1a1fb0-1469931868.ap-shanghai.app.tcloudbase.com/ai-proxy";

// 共享密钥（P0 配套）：与云函数环境变量 AI_PROXY_SECRET 同名，经 x-api-key 头携带。
// 未配置时不带该头；此时若云端已启用密钥校验，请求会被 401 拒绝。
const AI_PROXY_KEY = process.env.NEXT_PUBLIC_AI_PROXY_KEY || "";

// 单个 AI 请求超时（P2 修复）：与云端上游 12s 对齐并略放宽到 13s，
// 修复此前 8s 过早放弃、但云端仍跑 20s 白烧额度的问题。
const AI_PROXY_TIMEOUT_MS = 13000;

// ===== AI 结果短时缓存（P2 修复）=====
// 相同输入（简历+JD / JD / 经历）短时间内重复请求直接命中，避免重复付费、加快二次诊断。
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 分钟
const CACHE_MAX = 200; // 上限保护内存
const aiCache = new Map<string, { exp: number; value: unknown }>();

function hashStr(s: string): string {
  // cyrb53：快速、低碰撞的字符串哈希，用于缓存键（无需加密强度）
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

function cacheGet(key: string): unknown | null {
  const e = aiCache.get(key);
  if (e && Date.now() < e.exp) return e.value;
  if (e) aiCache.delete(key);
  return null;
}

function cacheSet(key: string, value: unknown): void {
  if (aiCache.size >= CACHE_MAX) aiCache.clear();
  aiCache.set(key, { exp: Date.now() + CACHE_TTL_MS, value });
}

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (AI_PROXY_KEY) h["x-api-key"] = AI_PROXY_KEY;
  return h;
}

async function callAiProxy<T>(action: string, payload: Record<string, unknown>): Promise<T | null> {
  const cacheKey = `${action}:${hashStr(JSON.stringify(payload))}`;
  const cached = cacheGet(cacheKey) as T | null;
  if (cached !== null) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_PROXY_TIMEOUT_MS);
  try {
    const res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok === false) {
      console.warn(`[ai-proxy] ${action} 失败:`, data?.error || res.status);
      return null;
    }
    const value = (data.data as T) ?? null;
    if (value !== null) cacheSet(cacheKey, value); // 仅缓存成功结果
    return value;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[ai-proxy] ${action} 超时(${AI_PROXY_TIMEOUT_MS}ms)，降级为规则结果`);
    } else {
      console.warn(`[ai-proxy] ${action} 网络错误:`, err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function generateAiSuggestions(
  resumeText: string,
  jdText: string
): Promise<AiSuggestionResult | null> {
  return callAiProxy<AiSuggestionResult>("analyze", { resumeText, jdText });
}

export function analyzeJdSemantics(jdText: string): Promise<JdSemantics | null> {
  return callAiProxy<JdSemantics>("jdSemantics", { jdText });
}

export function generateResumeRewrites(
  resumeText: string,
  jdText: string,
  missingKeywords: string[]
): Promise<RewriteItem[] | null> {
  return callAiProxy<RewriteItem[]>("rewrite", { resumeText, jdText, missingKeywords });
}

export function generateStarDescription(experience: string): Promise<StarResult | null> {
  return callAiProxy<StarResult>("star", { experience });
}

/** AI 模拟面试：基于简历 + JD + 诊断缺口生成追问列表（#6） */
export async function generateInterviewQuestions(
  resumeText: string,
  jdText: string,
  missingKeywords: string[]
): Promise<InterviewQuestion[] | null> {
  // 云函数返回 { questions: [...] }，这里解包成数组供调用方直接使用
  const r = await callAiProxy<{ questions?: InterviewQuestion[] }>("interview", {
    resumeText,
    jdText,
    missingKeywords,
  });
  if (!r) return null;
  return Array.isArray(r.questions) ? r.questions : null;
}

/** AI 点评面试回答：评分 + 点评 + 参考回答 */
export function reviewInterviewAnswer(
  resumeText: string,
  jdText: string,
  question: string,
  answer: string
): Promise<InterviewReview | null> {
  return callAiProxy<InterviewReview>("reviewAnswer", {
    resumeText,
    jdText,
    question,
    answer,
  });
}

/** AI 简历解析：文本 → 结构化简历（不含 id，由调用方补齐） */
export type AiParsedResume = ParsedResumeInput;

export function parseResumeByAi(text: string): Promise<AiParsedResume | null> {
  return callAiProxy<AiParsedResume>("parseResume", { resumeText: text });
}

export interface AiSuggestionResult {
  overallScore?: number;
  dimensions: { name: string; score: number; description: string; weight?: number }[];
  suggestions: string[];
}

export interface JdSemantics {
  coreSkills: string[];
  aliases: { skill: string; terms: string[] }[];
  jdSummary: string;
}

export interface RewriteItem {
  keyword: string;
  original: string;
  rewritten: string;
  reason: string;
}

export interface StarResult {
  star: string;
  parts: { label: string; content: string }[];
  tips: string[];
}

export interface InterviewQuestion {
  question: string;
  /** 考察点 / 对应缺口 */
  focus: string;
  /** 候选人思考提示 */
  hint: string;
}

export interface InterviewReview {
  score: number;
  comment: string;
  reference: string;
  tips: string[];
}
