// 浏览器端 AI 调用封装：统一打到 ai-proxy 云函数（隐藏 DeepSeek Key）。
// 失败时返回 null，由调用方降级为规则结果。

import type { ParsedResumeInput } from "./resume-import";

const AI_PROXY_URL =
  process.env.NEXT_PUBLIC_AI_PROXY_URL ||
  "https://xiaoxin2026-personal-d1acf1a1fb0-1469931868.ap-shanghai.app.tcloudbase.com/ai-proxy";

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

const AI_PROXY_TIMEOUT_MS = 8000; // 单个 AI 请求超时，超时返回 null 由调用方降级

async function callAiProxy<T>(action: string, payload: Record<string, unknown>): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_PROXY_TIMEOUT_MS);
  try {
    const res = await fetch(AI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok === false) {
      console.warn(`[ai-proxy] ${action} 失败:`, data?.error || res.status);
      return null;
    }
    return (data.data as T) ?? null;
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

/** AI 简历解析：文本 → 结构化简历（不含 id，由调用方补齐） */
export type AiParsedResume = ParsedResumeInput;

export function parseResumeByAi(text: string): Promise<AiParsedResume | null> {
  return callAiProxy<AiParsedResume>("parseResume", { resumeText: text });
}
