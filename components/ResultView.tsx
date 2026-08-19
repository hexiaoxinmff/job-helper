"use client";

import { useRef, useEffect, useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { toPng } from "html-to-image";
import KeywordChip from "./KeywordChip";
import { ErrorBoundary } from "./ErrorBoundary";
import { track } from "@/lib/track";
import { generateResumeRewrites } from "@/lib/ai-client";
import { useProfile } from "@/lib/profile";

function confidenceLabel(c?: "low" | "medium" | "high"): { text: string; cls: string } {
  if (c === "high") return { text: "高", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" };
  if (c === "medium") return { text: "中", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" };
  if (c === "low") return { text: "低", cls: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };
  return { text: "—", cls: "bg-slate-200 text-slate-600" };
}

interface Props {
  result: AnalysisResult;
  resumeText: string;
  jdText: string;
  onReset: () => void;
}

interface RewriteItem {
  keyword: string;
  original: string;
  rewritten: string;
  reason: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "优秀";
  if (score >= 60) return "良好";
  if (score >= 40) return "一般";
  return "待改进";
}

export default function ResultView({ result, resumeText, jdText, onReset }: Props) {
  const { profile, appendSnapshot } = useProfile();
  const chartData = result.dimensions.map((d) => ({
    dimension: d.name,
    score: d.score,
  }));

  const weights = result.weights ?? result.dimensions.map(() => 1 / result.dimensions.length);

  // 私人档案：开启后自动沉淀本次诊断（仅本地、用户所有）
  const lastSavedRef = useRef<AnalysisResult | null>(null);
  useEffect(() => {
    if (profile.enabled && lastSavedRef.current !== result) {
      lastSavedRef.current = result;
      appendSnapshot({
        ts: Date.now(),
        targetRole: (jdText || "").slice(0, 80),
        overallScore: result.overallScore,
        dimensions: result.dimensions.map((d) => ({ name: d.name, score:  d.score })),
        confidence: result.confidence,
      });
    }
  }, [result, profile.enabled, appendSnapshot, jdText]);

  // —— 分享卡片 ——
  const reportRef = useRef<HTMLDivElement>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  const downloadReport = async () => {
    if (!reportRef.current) return;
    setShareLoading(true);
    setShareMsg("");
    try {
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `简历诊断-诊断报告-${result.overallScore}分.png`;
      link.href = dataUrl;
      link.click();
      setShareMsg("报告图片已生成，去分享吧！");
      track("report_download", { score: result.overallScore });
    } catch {
      setShareMsg("图片生成失败，请重试或直接复制文字报告");
      track("report_download_error");
    } finally {
      setShareLoading(false);
    }
  };

  // —— AI 改写 ——
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewrites, setRewrites] = useState<RewriteItem[] | null>(null);
  const [rewriteMsg, setRewriteMsg] = useState("");
  const [copiedKw, setCopiedKw] = useState("");

  const runRewrite = async () => {
    setRewriteLoading(true);
    setRewriteMsg("");
    setRewrites(null);
    track("rewrite_click");
    try {
      const rewrites = await generateResumeRewrites(
        resumeText,
        jdText,
        result.missingKeywords
      );
      if (!rewrites) {
        setRewriteMsg("AI 改写暂不可用，请稍后重试");
        track("rewrite_error", { reason: "null" });
        return;
      }
      setRewrites(rewrites);
      track("rewrite_success", { count: rewrites.length });
    } catch {
      setRewriteMsg("网络错误，请稍后重试");
      track("rewrite_error", { reason: "network" });
    } finally {
      setRewriteLoading(false);
    }
  };

  const copyRewrite = async (item: RewriteItem) => {
    try {
      await navigator.clipboard.writeText(item.rewritten);
      setCopiedKw(item.keyword);
      setTimeout(() => setCopiedKw(""), 1500);
    } catch {
      // 剪贴板不可用则静默
    }
  };

  // —— STAR 生成已拆为独立页面 /star ——

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 剪贴板不可用则静默
    }
  };

  const copyReport = async () => {
    const lines = [
      "简历诊断分析报告",
      `整体匹配度：${result.overallScore}/100（${scoreLabel(result.overallScore)}）`,
      "",
      "各维度得分：",
      ...result.dimensions.map((d) => `- ${d.name}：${d.score}/100`),
      "",
      "改进建议：",
      ...result.suggestions.map((s, i) => `${i + 1}. ${s}`),
      "",
      "由求职在线助手生成（免费）",
    ];
    await copyText(lines.join("\n"));
    track("report_copy");
  };

  return (
    <section className="space-y-6">
      {/* 免责声明（醒目）：对齐「防幻觉」合规要求 */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
        ⚠️ AI 建议仅供参考，关键求职决策请结合自身情况与人工判断；本报告不构成任何录用保证。
      </div>

      {/* 可导出的报告区 */}
      <div ref={reportRef} className="space-y-6 p-1">
        {/* 总分 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">整体匹配度</p>
          <p className={`text-5xl font-bold mt-2 ${scoreColor(result.overallScore)}`}>
            {result.overallScore}
            <span className="text-xl text-slate-400 font-normal dark:text-slate-500"> /100</span>
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {scoreLabel(result.overallScore)}
            {result.aiEnhanced && (
              <span className="ml-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                AI 增强
              </span>
            )}
            {result.confidence && (
              <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs ${confidenceLabel(result.confidence).cls}`}>
                置信度 {confidenceLabel(result.confidence).text}
              </span>
            )}
          </p>
        </div>

        {/* 雷达图 + 维度明细 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">维度评分</h2>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="h-64 w-full md:w-1/2">
              <ErrorBoundary
                fallback={(error, reset) => (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">图表加载失败</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{error.message}</p>
                    <button
                      onClick={reset}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                    >
                      重试
                    </button>
                  </div>
                )}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} outerRadius="70%">
                    <PolarGrid stroke="var(--chart-grid)" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13, fill: "var(--chart-axis)" }} />
                    <Radar
                      dataKey="score"
                      stroke="var(--chart-stroke)"
                      fill="var(--chart-stroke)"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
            <div className="w-full space-y-3 md:w-1/2">
              {result.dimensions.map((d, i) => (
                <div key={d.name} className="flex items-start gap-3">
                  <span className={`w-14 shrink-0 text-lg font-semibold ${scoreColor(d.score)}`}>
                    {d.score}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {d.name}
                      <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                        权重 {Math.round((weights[i] ?? 0) * 100)}%
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{d.description}</p>
                  </div>
                </div>
              ))}
              <p className="border-t border-slate-100 pt-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                总分 = 各维度得分 × 权重 之和（{result.overallScore} 分）
              </p>
            </div>
          </div>
        </div>

        {/* 关键词 */}
        {(result.matchedKeywords.length > 0 || result.missingKeywords.length > 0) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">关键词对比</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">点击带 ⓘ 的关键词可查看含义</span>
            </div>
            {result.matchedKeywords.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">✅ 已命中</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((kw) => (
                    <KeywordChip key={kw} keyword={kw} variant="matched" />
                  ))}
                </div>
              </div>
            )}
            {result.missingKeywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">❌ 缺失</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingKeywords.map((kw) => (
                    <KeywordChip key={kw} keyword={kw} variant="missing" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 建议 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">改进建议</h2>
          <ol className="space-y-3">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 差距补救路线（诚实诊断：硬缺口 → 学习/补齐；表达缺口 → 在既有经历补位） */}
      {result.gapRemediation && result.gapRemediation.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-1 font-semibold text-slate-800 dark:text-slate-100">差距补救路线</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            针对缺失项给出可行动路线——避免「过度美化」导致面试翻车，也避免笼统说「要学会它」。
          </p>
          <div className="space-y-3">
            {result.gapRemediation.map((g) => (
              <div key={g.keyword} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                    {g.keyword}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      g.kind === "expression"
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                    }`}
                  >
                    {g.kind === "expression" ? "表达缺口 · 可在现有经历补位" : "硬技能缺口 · 需学习/补齐"}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{g.action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 简历改写 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">AI 简历改写</h2>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-950 dark:text-purple-300">P0</span>
        </div>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          针对缺失关键词，基于你简历的既有经历生成可直接粘贴的改写句（不虚构、不编造）
        </p>

        {rewrites === null && !rewriteMsg && (
          <button
            onClick={runRewrite}
            disabled={rewriteLoading}
            className="w-full rounded-xl bg-purple-600 py-3 font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {rewriteLoading ? "AI 改写中…" : "一键生成改写建议"}
          </button>
        )}

        {rewriteMsg && (
          <p className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {rewriteMsg}
          </p>
        )}

        {rewrites && rewrites.length > 0 && (
          <div className="space-y-4">
            {rewrites.map((item) => (
              <div key={item.keyword} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                    +{item.keyword}
                  </span>
                  <button
                    onClick={() => copyRewrite(item)}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {copiedKw === item.keyword ? "已复制 ✓" : "复制改写句"}
                  </button>
                </div>
                {item.original && (
                  <p className="mb-1.5 text-xs text-slate-400 dark:text-slate-500">
                    原文：{item.original}
                  </p>
                )}
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-slate-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-slate-100">
                  {item.rewritten}
                </p>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">💡 {item.reason}</p>
              </div>
            ))}
            <button
              onClick={() => {
                setRewrites(null);
                setRewriteMsg("");
              }}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← 重新生成
            </button>
          </div>
        )}

        {rewrites && rewrites.length === 0 && !rewriteMsg && (
          <p className="text-sm text-slate-500 dark:text-slate-400">没有可改写的缺失关键词。</p>
        )}
      </div>

      {/* STAR 已拆为独立页面（顶部导航可进入），此处不再展示 */}

      {/* 操作 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={downloadReport}
          disabled={shareLoading}
          className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {shareLoading ? "生成图片中…" : "保存报告图片"}
        </button>
        <button
          onClick={copyReport}
          className="flex-1 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          复制文字报告
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          再测一份
        </button>
      </div>

      {shareMsg && <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">{shareMsg}</p>}
    </section>
  );
}
