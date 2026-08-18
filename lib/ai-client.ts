// 浏览器端 AI 调用封装：统一打到 ai-proxy 云函数（隐藏 DeepSeek Key）。
// 失败时返回 null，由调用方降级为规则结果。

const AI_PROXY_URL =
  process.env.NEXT_PUBLIC_AI_PROXY_URL ||
  "https://xiaoxin2026-personal-d1acf1a1fb0-1469931868.ap-shanghai.app.tcloudbase.com/ai-proxy";

export interface AiSuggestionResult {
  overallScore?: number;
  dimensions: { name: string; score: number; description: string }[];
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

async function callAiProxy<T>(action: string, payload: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok === false) {
      console.warn(`[ai-proxy] ${action} 失败:`, data?.error || res.status);
      return null;
    }
    return (data.data as T) ?? null;
  } catch (err) {
    console.warn(`[ai-proxy] ${action} 网络错误:`, err);
    return null;
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
