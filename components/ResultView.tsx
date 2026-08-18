"use client";

import { useRef, useState } from "react";
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

interface Props {
  result: AnalysisResult;
  resumeFile: File;
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
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "优秀";
  if (score >= 60) return "良好";
  if (score >= 40) return "一般";
  return "待改进";
}

export default function ResultView({ result, resumeFile, jdText, onReset }: Props) {
  const chartData = result.dimensions.map((d) => ({
    dimension: d.name,
    score: d.score,
  }));

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
    } catch {
      setShareMsg("图片生成失败，请重试或直接复制文字报告");
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
    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jd", jdText);
      const res = await fetch("/api/rewrite", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setRewriteMsg(data.error || "改写失败，请稍后重试");
        return;
      }
      setRewrites(data.rewrites ?? []);
      if (data.message) setRewriteMsg(data.message);
    } catch {
      setRewriteMsg("网络错误，请稍后重试");
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
  };

  return (
    <section className="space-y-6">
      {/* 可导出的报告区 */}
      <div ref={reportRef} className="space-y-6 p-1">
        {/* 总分 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-500">整体匹配度</p>
          <p className={`text-5xl font-bold mt-2 ${scoreColor(result.overallScore)}`}>
            {result.overallScore}
            <span className="text-xl text-slate-400 font-normal"> /100</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {scoreLabel(result.overallScore)}
            {result.aiEnhanced && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
                AI 增强
              </span>
            )}
          </p>
        </div>

        {/* 雷达图 + 维度明细 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">维度评分</h2>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData} outerRadius="70%">
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13, fill: "#334155" }} />
                  <Radar
                    dataKey="score"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3">
              {result.dimensions.map((d) => (
                <div key={d.name} className="flex items-start gap-3">
                  <span className={`text-lg font-semibold w-14 shrink-0 ${scoreColor(d.score)}`}>
                    {d.score}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{d.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 关键词 */}
        {(result.matchedKeywords.length > 0 || result.missingKeywords.length > 0) && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-semibold text-slate-800">关键词对比</h2>
              <span className="text-xs text-slate-400">点击带 ⓘ 的关键词可查看含义</span>
            </div>
            {result.matchedKeywords.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1.5">✅ 已命中</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((kw) => (
                    <KeywordChip key={kw} keyword={kw} variant="matched" />
                  ))}
                </div>
              </div>
            )}
            {result.missingKeywords.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">❌ 缺失</p>
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
        <div className="rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">改进建议</h2>
          <ol className="space-y-3">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* AI 简历改写 */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-slate-800">AI 简历改写</h2>
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">P0</span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          针对缺失关键词，基于你简历的既有经历生成可直接粘贴的改写句（不虚构、不编造）
        </p>

        {rewrites === null && !rewriteMsg && (
          <button
            onClick={runRewrite}
            disabled={rewriteLoading}
            className="w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {rewriteLoading ? "AI 改写中…" : "一键生成改写建议"}
          </button>
        )}

        {rewriteMsg && (
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-3">
            {rewriteMsg}
          </p>
        )}

        {rewrites && rewrites.length > 0 && (
          <div className="space-y-4">
            {rewrites.map((item) => (
              <div key={item.keyword} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                    +{item.keyword}
                  </span>
                  <button
                    onClick={() => copyRewrite(item)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {copiedKw === item.keyword ? "已复制 ✓" : "复制改写句"}
                  </button>
                </div>
                {item.original && (
                  <p className="text-xs text-slate-400 mb-1.5">
                    原文：{item.original}
                  </p>
                )}
                <p className="text-sm text-slate-800 leading-relaxed bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {item.rewritten}
                </p>
                <p className="text-xs text-slate-500 mt-1.5">💡 {item.reason}</p>
              </div>
            ))}
            <button
              onClick={() => {
                setRewrites(null);
                setRewriteMsg("");
              }}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              ← 重新生成
            </button>
          </div>
        )}

        {rewrites && rewrites.length === 0 && !rewriteMsg && (
          <p className="text-sm text-slate-500">没有可改写的缺失关键词。</p>
        )}
      </div>

      {/* STAR 已拆为独立页面（顶部导航可进入），此处不再展示 */}

      {/* 操作 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={downloadReport}
          disabled={shareLoading}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {shareLoading ? "生成图片中…" : "保存报告图片"}
        </button>
        <button
          onClick={copyReport}
          className="flex-1 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          复制文字报告
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          再测一份
        </button>
      </div>

      {shareMsg && <p className="text-sm text-emerald-600 text-center">{shareMsg}</p>}
    </section>
  );
}
