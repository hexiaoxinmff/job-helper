"use client";

import { useRef, useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { track } from "@/lib/track";
import { useCopy } from "@/lib/use-copy";
import {
  generateResumeRewrites,
  optimizeResumeForJd,
  generateApplyMessage,
  type AiOptimizedResume,
  type ApplyMessageResult,
} from "@/lib/ai-client";
import { analyzeAtsFriendly } from "@/lib/ats";
import { useProfile } from "@/lib/profile";
import { useDiagnosisHistory } from "@/lib/diagnosis-history";
import { useRemediation } from "@/lib/remediation-store";
import { getRemediationResource } from "@/lib/remediation";
import { recommendRoles } from "@/lib/recommend";
import { getJdById } from "@/lib/jd-library";
import { resolveThemeVars } from "@/lib/theme";
import { useResume } from "@/lib/resume-store";
import { normalizeParsedResume, isResumeEmpty } from "@/lib/normalize-resume";
import { useRouter } from "next/navigation";

function confidenceLabel(c?: "low" | "medium" | "high"): { text: string; cls: string } {
  if (c === "high") return { text: "高", cls: "bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300" };
  if (c === "medium") return { text: "中", cls: "bg-warning-100 text-warning-700 dark:bg-warning-950 dark:text-warning-300" };
  if (c === "low") return { text: "低", cls: "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300" };
  return { text: "—", cls: "bg-neutral-200 text-neutral-600" };
}

interface Props {
  result: AnalysisResult;
  resumeText: string;
  jdText: string;
  onReset: () => void;
  /** 反向岗位推荐回调：点击推荐方向后，用该 JD 重新诊断 */
  onReDiagnose?: (jdText: string, jdId?: string) => void;
}

interface RewriteItem {
  keyword: string;
  original: string;
  rewritten: string;
  reason: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-success-600 dark:text-success-400";
  if (score >= 60) return "text-warning-600 dark:text-warning-400";
  return "text-danger-600 dark:text-danger-400";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "优秀";
  if (score >= 60) return "良好";
  if (score >= 40) return "一般";
  return "待改进";
}

export default function ResultView({ result, resumeText, jdText, onReset, onReDiagnose }: Props) {
  const { profile, appendSnapshot } = useProfile();
  const { append: appendDiagnosis } = useDiagnosisHistory();
  const { items: remediationItems, add: addRemediation } = useRemediation();
  const { addVersion, setResume } = useResume();
  const router = useRouter();
  const chartData = result.dimensions.map((d) => ({
    dimension: d.name,
    score: d.score,
  }));

  const weights = result.weights ?? result.dimensions.map(() => 1 / result.dimensions.length);  // 私人档案：开启后自动沉淀本次诊断（仅本地、用户所有）
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

  // 诊断历史本地化：无条件记录（脱敏，仅本地，上限 20 条），不依赖档案开关
  const lastHistoryRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${result.overallScore}:${(jdText || "").slice(0, 40)}:${result.dimensions.map((d) => d.score).join(",")}`;
    if (lastHistoryRef.current === key) return;
    lastHistoryRef.current = key;
    appendDiagnosis({
      ts: Date.now(),
      targetRole: (jdText || "").slice(0, 80),
      overallScore: result.overallScore,
      dimensions: result.dimensions.map((d) => ({ name: d.name, score: d.score })),
      confidence: result.confidence,
    });
  }, [result, jdText, appendDiagnosis]);

  // 反向岗位推荐：基于简历文本从 JD 库匹配高契合方向（复用规则评分，零成本）
  const recommendations = useMemo(() => {
    try {
      return recommendRoles(resumeText, jdText, 3);
    } catch {
      return [];
    }
  }, [resumeText, jdText]);

  // ATS 友好度：基于已解析文本的规则检测（独立维度卡，不影响诊断主分）
  const ats = useMemo(
    () => analyzeAtsFriendly(resumeText, jdText, result.matchedKeywords, result.missingKeywords),
    [resumeText, jdText, result.matchedKeywords, result.missingKeywords]
  );

  // —— 求职自荐话术（仅 AI 增强时展示）——
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyResult, setApplyResult] = useState<ApplyMessageResult | null>(null);

  const runApplyMessage = async () => {
    setApplyLoading(true);
    setApplyMsg("");
    setApplyResult(null);
    track("apply_message_click");
    try {
      const r = await generateApplyMessage(resumeText, jdText);
      if (!r || (!r.boss && !r.email && !r.wechat)) {
        setApplyMsg("AI 话术生成暂不可用，请稍后重试");
        track("apply_message_error", { reason: "null" });
        return;
      }
      setApplyResult(r);
      track("apply_message_success");
    } catch {
      setApplyMsg("网络错误，请稍后重试");
      track("apply_message_error", { reason: "network" });
    } finally {
      setApplyLoading(false);
    }
  };

  // 差距补救区滚动定位（供「补位计划」下一步直达）
  const scrollToRemediation = () => {
    track("next_remediation");
    if (result.gapRemediation && result.gapRemediation.length > 0) {
      document.getElementById("gap-remediation")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/profile");
    }
  };

  // —— 分享卡片 ——
  const reportRef = useRef<HTMLDivElement>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  const downloadReport = async () => {
    if (!reportRef.current) return;
    setShareLoading(true);
    setShareMsg("");
    // 截图捕获态：临时强制亮色主题，保证导出卡片白底深字（分享场景可读）。
    // 仅捕获阶段生效：追加 export-capture 后 dark: 变体与 .dark 变量块整体失效，
    // resolveThemeVars() 随即读到亮色值；colorScheme 同步切 light 兜底原生控件。
    const root = document.documentElement;
    const prevColorScheme = root.style.colorScheme;
    root.classList.add("export-capture");
    root.style.colorScheme = "light";
    try {
      // 捕获态下 --jh-bg 已回退为亮色，无需再按当前主题取值
      const bgColor = resolveThemeVars().bg || "#ffffff";
      const dataUrl = await toPng(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: bgColor,
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
      // 无论成功失败都恢复原主题，避免页面被卡在亮色
      root.classList.remove("export-capture");
      root.style.colorScheme = prevColorScheme;
      setShareLoading(false);
    }
  };

  // —— 按 JD 智能优化简历 ——
  const [optLoading, setOptLoading] = useState(false);
  const [optResult, setOptResult] = useState<AiOptimizedResume | null>(null);
  const [optMsg, setOptMsg] = useState("");
  const [optOpen, setOptOpen] = useState(false);

  // —— AI 改写 ——
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewrites, setRewrites] = useState<RewriteItem[] | null>(null);
  const [rewriteMsg, setRewriteMsg] = useState("");
  const { copiedKey: copiedKw, copy: copyText } = useCopy();

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
    await copyText(item.rewritten, item.keyword);
  };

  // —— STAR 生成已拆为独立页面 /star ——

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
    await copyText(lines.join("\n"), "report");
    track("report_copy");
  };

  // AI 模拟面试入口：把当前简历 + JD + 缺失关键词带入面试页（会话级，不落盘）
  const goInterview = () => {
    try {
      sessionStorage.setItem(
        "job-helper:interview-ctx",
        JSON.stringify({
          resumeText,
          jdText,
          missingKeywords: result.missingKeywords,
        })
      );
    } catch {
      /* 忽略写入失败 */
    }
    track("interview_enter");
    window.location.href = "/interview";
  };

  // 按 JD 智能优化简历：调 AI 生成定向优化后的结构化简历 + 修改点，预览后灌入编辑器（新建版本）
  const runOptimize = async () => {
    setOptLoading(true);
    setOptMsg("");
    setOptResult(null);
    track("optimize_click");
    try {
      const r = await optimizeResumeForJd(resumeText, jdText, result.missingKeywords);
      if (!r || !r.resume) {
        setOptMsg("AI 优化暂不可用，请稍后重试");
        track("optimize_error", { reason: "null" });
        return;
      }
      setOptResult(r);
      setOptOpen(true);
      track("optimize_success", { changes: r.changes.length });
    } catch {
      setOptMsg("网络错误，请稍后重试");
      track("optimize_error", { reason: "network" });
    } finally {
      setOptLoading(false);
    }
  };

  const applyOptimize = () => {
    if (!optResult) return;
    const optimized = normalizeParsedResume(optResult.resume);
    if (isResumeEmpty(optimized)) {
      setOptMsg("优化结果内容过少，请重试");
      setOptOpen(false);
      track("optimize_error", { reason: "empty" });
      return;
    }
    const name = `JD优化-${optimized.basics.title || "简历"}`.slice(0, 30);
    addVersion(name); // 新建版本并切为当前编辑版本，原简历不受影响
    setResume(optimized);
    track("optimize_apply", { name });
    setOptOpen(false);
    router.push("/editor");
  };

  return (
    <section className="space-y-6">
      {/* 免责声明（醒目）：对齐「防幻觉」合规要求 */}
      <Alert variant="warning">
        ⚠️ AI 建议仅供参考，关键求职决策请结合自身情况与人工判断；本报告不构成任何录用保证。
      </Alert>

      {/* 可导出的报告区 */}
      <div ref={reportRef} className="space-y-6 p-1">
        {/* 总分 */}
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-primary-50/80 to-white p-6 text-center dark:border-neutral-800 dark:from-primary-950/30 dark:to-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">整体匹配度</p>
          <p className={`text-6xl font-bold mt-2 tabular-nums ${scoreColor(result.overallScore)}`}>
            {result.overallScore}
            <span className="text-xl text-neutral-400 font-normal dark:text-neutral-500"> /100</span>
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            {scoreLabel(result.overallScore)}
            {result.aiEnhanced && (
              <span className="ml-2 inline-block rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-700 dark:bg-accent-950 dark:text-accent-300">
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
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">维度评分</h2>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="h-64 w-full rounded-xl bg-neutral-50 p-2 dark:bg-neutral-800/50 md:w-1/2">
              <ErrorBoundary
                fallback={(error, reset) => (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">图表加载失败</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">{error.message}</p>
                    <button
                      onClick={reset}
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
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
                  <span className={`w-14 shrink-0 text-lg font-semibold tabular-nums ${scoreColor(d.score)}`}>
                    {d.score}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                      {d.name}
                      <span className="ml-2 text-xs font-normal text-neutral-400 dark:text-neutral-500">
                        权重 {Math.round((d.weight ?? weights[i] ?? 0) * 100)}%
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{d.description}</p>
                  </div>
                </div>
              ))}
              <p className="border-t border-neutral-100 pt-2 text-xs text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
                总分 = 各维度得分 × 权重 之和（{result.overallScore} 分）
              </p>
            </div>
          </div>
        </div>

        {/* 关键词 */}
        {(result.matchedKeywords.length > 0 || result.missingKeywords.length > 0) && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">关键词对比</h2>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">点击带 ⓘ 的关键词可查看含义</span>
            </div>
            {result.matchedKeywords.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-xs text-neutral-500 dark:text-neutral-400">✅ 已命中</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.matchedKeywords.map((kw) => (
                    <KeywordChip key={kw} keyword={kw} variant="matched" />
                  ))}
                </div>
              </div>
            )}
            {result.missingKeywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-neutral-500 dark:text-neutral-400">❌ 缺失</p>
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
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">改进建议</h2>
          <ol className="space-y-3">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 反向岗位推荐：基于这份简历，你可能适合（复用 JD 库 + 规则评分，点击即换 JD 重新诊断） */}
      {recommendations.length > 0 && onReDiagnose && (
        <div className="rounded-2xl border border-primary-200 bg-white p-6 dark:border-primary-900 dark:bg-neutral-900">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">基于这份简历，你可能适合</h2>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              反向推荐
            </span>
          </div>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            从行业 JD 库匹配的高契合方向（规则评分，纯本地）。点击即可换用该方向重新诊断。
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {recommendations.map((rec) => {
              const tpl = getJdById(rec.id);
              return (
                <button
                  key={rec.id}
                  onClick={() => {
                    if (!tpl) return;
                    track("recommend_click", { id: rec.id, score: rec.score });
                    onReDiagnose(tpl.jd["zh-CN"], tpl.id);
                  }}
                  className="group rounded-xl border border-neutral-200 p-4 text-left transition-colors hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-300">
                        {rec.role}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {rec.industry}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        rec.tier === "high"
                          ? "bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      }`}
                    >
                      {rec.score} 分
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-primary-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-primary-400">
                    换 JD 重新诊断 →
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 差距补救路线（诚实诊断：硬缺口 → 学习/补齐；表达缺口 → 在既有经历补位；可加入 90 天补位计划） */}
      {result.gapRemediation && result.gapRemediation.length > 0 && (
        <div id="gap-remediation" className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">差距补救路线 · 90 天补位计划</h2>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              可追踪
            </span>
          </div>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            针对缺失项给出可行动路线——避免「过度美化」导致面试翻车，也避免笼统说「要学会它」。点击「加入补位计划」沉淀到私人档案追踪。
          </p>
          <div className="space-y-3">
            {result.gapRemediation.map((g) => {
              const resource = g.kind === "hard" ? getRemediationResource(g.keyword) : undefined;
              const added = remediationItems.some((x) => x.keyword === g.keyword);
              return (
                <div key={g.keyword} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700 dark:bg-danger-950 dark:text-danger-300">
                      {g.keyword}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        g.kind === "expression"
                          ? "bg-info-100 text-info-700 dark:bg-info-950 dark:text-info-300"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                      }`}
                    >
                      {g.kind === "expression" ? "表达缺口 · 可在现有经历补位" : "硬技能缺口 · 需学习/补齐"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (added) return;
                        addRemediation({
                          keyword: g.keyword,
                          kind: g.kind,
                          resource: resource
                            ? `${resource.course}；项目：${resource.project}`
                            : undefined,
                        });
                        track("remediation_add", { keyword: g.keyword, kind: g.kind });
                      }}
                      disabled={added}
                      className={`ml-auto rounded-lg px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        added
                          ? "bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300"
                          : "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500"
                      }`}
                    >
                      {added ? "✓ 已加入补位计划" : "加入补位计划"}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{g.action}</p>
                  {resource && (
                    <div className="mt-3 space-y-1.5 rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      <p>📚 学习路径：{resource.course}</p>
                      <p>🛠️ 实操项目：{resource.project}</p>
                      {resource.cert && <p>📜 可选考证：{resource.cert}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI 简历改写（仅 AI 增强时展示，对齐 AC-04：无 AI 能力时不展示依赖区） */}
      {result.aiEnhanced && (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">AI 简历改写</h2>
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-700 dark:bg-accent-950 dark:text-accent-300">P0</span>
        </div>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          针对缺失关键词，基于你简历的既有经历生成可直接粘贴的改写句（不虚构、不编造）
        </p>

        {rewrites === null && !rewriteMsg && (
          <button
            onClick={runRewrite}
            disabled={rewriteLoading}
            className="w-full rounded-xl bg-accent-600 py-3 font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {rewriteLoading ? "AI 改写中…" : "一键生成改写建议"}
          </button>
        )}

        {rewriteMsg && (
          <p className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {rewriteMsg}
          </p>
        )}

        {rewrites && rewrites.length > 0 && (
          <div className="space-y-4">
            {rewrites.map((item) => (
              <div key={item.keyword} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700 dark:bg-danger-950 dark:text-danger-300">
                    +{item.keyword}
                  </span>
                  <button
                    onClick={() => copyRewrite(item)}
                    className="text-xs text-primary-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-primary-400"
                  >
                    {copiedKw === item.keyword ? "已复制 ✓" : "复制改写句"}
                  </button>
                </div>
                {item.original && (
                  <p className="mb-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                    原文：{item.original}
                  </p>
                )}
                <p className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm leading-relaxed text-neutral-800 dark:border-success-900 dark:bg-success-950 dark:text-neutral-100">
                  {item.rewritten}
                </p>
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">💡 {item.reason}</p>
              </div>
            ))}
            <button
              onClick={() => {
                setRewrites(null);
                setRewriteMsg("");
              }}
              className="text-sm text-neutral-500 hover:text-neutral-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              ← 重新生成
            </button>
          </div>
        )}

        {rewrites && rewrites.length === 0 && !rewriteMsg && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">没有可改写的缺失关键词。</p>
        )}
      </div>
      )}

      {/* 按 JD 智能优化简历（仅 AI 增强时展示）：一键生成整份定向优化简历，预览后灌入编辑器（新建版本） */}
      {result.aiEnhanced && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">按 JD 智能优化简历</h2>
            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-700 dark:bg-accent-950 dark:text-accent-300">P0</span>
          </div>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            根据这份 JD 与诊断出的缺失项，AI 直接在你的简历基础上做定向优化（嵌入关键词、对齐岗位优势、调整技能），生成一份可编辑的新简历版本。不虚构、不夸大。
          </p>

          {!optResult && !optMsg && (
            <button
              onClick={runOptimize}
              disabled={optLoading}
              className="w-full rounded-xl bg-accent-600 py-3 font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {optLoading ? "AI 优化中…" : "一键优化简历"}
            </button>
          )}

          {optMsg && (
            <p className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {optMsg}
            </p>
          )}

          {optMsg && !optResult && (
            <button
              onClick={runOptimize}
              disabled={optLoading}
              className="w-full rounded-xl bg-accent-600 py-3 font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {optLoading ? "AI 优化中…" : "重试"}
            </button>
          )}
        </div>
      )}

      {/* STAR 已拆为独立页面（顶部导航可进入），此处不再展示 */}

      {/* 求职自荐话术（仅 AI 增强时展示）：3 个渠道可直接粘贴的打招呼文案 */}
      {result.aiEnhanced && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">求职自荐话术</h2>
            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs text-accent-700 dark:bg-accent-950 dark:text-accent-300">P0</span>
          </div>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            根据这份简历与 JD，生成 BOSS 直聘 / 邮箱 / 微信 三个渠道可直接粘贴的打招呼文案。不虚构、不夸大。
          </p>

          {!applyResult && !applyMsg && (
            <button
              onClick={runApplyMessage}
              disabled={applyLoading}
              className="w-full rounded-xl bg-accent-600 py-3 font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {applyLoading ? "AI 生成中…" : "一键生成自荐话术"}
            </button>
          )}

          {applyMsg && (
            <p className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {applyMsg}
            </p>
          )}

          {applyResult && (
            <div className="space-y-3">
              {(
                [
                  { key: "boss", platform: "BOSS 直聘打招呼", text: applyResult.boss, hint: "≈60 字·打招呼用" },
                  { key: "email", platform: "邮箱投递自荐", text: applyResult.email, hint: "正文·3-5 句" },
                  { key: "wechat", platform: "微信 / 聊天自荐", text: applyResult.wechat, hint: "≈40 字·简短" },
                ] as const
              ).map((item) => (
                <div key={item.key} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                      {item.platform}
                      <span className="ml-2 text-xs font-normal text-neutral-400 dark:text-neutral-500">{item.hint}</span>
                    </span>
                    <button
                      onClick={() => copyText(item.text, item.key)}
                      className="shrink-0 text-xs text-primary-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-primary-400"
                    >
                      {copiedKw === item.key ? "已复制 ✓" : "复制"}
                    </button>
                  </div>
                  <p className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm leading-relaxed text-neutral-800 dark:border-success-900 dark:bg-success-950 dark:text-neutral-100">
                    {item.text}
                  </p>
                </div>
              ))}
              {applyResult.tips.length > 0 && (
                <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  💡 {applyResult.tips.join("；")}
                </p>
              )}
              <button
                onClick={() => {
                  setApplyResult(null);
                  setApplyMsg("");
                }}
                className="text-sm text-neutral-500 hover:text-neutral-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                ← 重新生成
              </button>
            </div>
          )}
        </div>
      )}

      {/* ATS 友好度（规则检测，独立维度卡，不影响诊断主分） */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">ATS 友好度</h2>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              规则检测
            </span>
          </div>
          <span className={`text-3xl font-bold tabular-nums ${ats.score >= 80 ? "text-success-600 dark:text-success-400" : ats.score >= 55 ? "text-warning-600 dark:text-warning-400" : "text-danger-600 dark:text-danger-400"}`}>
            {ats.score}
          </span>
        </div>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          检测简历是否容易被投递系统（ATS）机器解析与检索——仅评估可解析文本，不参与你的匹配总分。
        </p>
        <ul className="space-y-2">
          {ats.checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2.5 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800/60">
              <span
                className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  c.status === "pass"
                    ? "bg-success-500"
                    : c.status === "warn"
                      ? "bg-warning-500"
                      : "bg-danger-500"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{c.label}</p>
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{c.tip}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 下一步：把诊断变成行动 */}
      <div className="rounded-2xl border border-primary-200 bg-primary-50/60 p-6 dark:border-primary-900 dark:bg-neutral-900">
        <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">下一步，把诊断变成行动</h2>
        <p className="mb-4 mt-1 text-sm text-neutral-500 dark:text-neutral-400">基于这份诊断，选一个能立刻推进的方向。</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={result.aiEnhanced ? runOptimize : () => router.push("/editor")}
            disabled={optLoading}
            className="group rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-primary-700 dark:hover:bg-primary-950/40"
          >
            <span className="text-xl">✍️</span>
            <p className="mt-1.5 text-sm font-semibold text-neutral-800 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-300">
              {result.aiEnhanced ? "优化简历" : "打开编辑器"}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {result.aiEnhanced ? "一键按 JD 生成优化版" : "手动润色这份简历"}
            </p>
          </button>
          <button
            onClick={goInterview}
            className="group rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-primary-700 dark:hover:bg-primary-950/40"
          >
            <span className="text-xl">🎤</span>
            <p className="mt-1.5 text-sm font-semibold text-neutral-800 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-300">
              AI 模拟面试
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">针对缺失项专项演练</p>
          </button>
          <button
            onClick={scrollToRemediation}
            className="group rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-primary-400 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-primary-700 dark:hover:bg-primary-950/40"
          >
            <span className="text-xl">🗺️</span>
            <p className="mt-1.5 text-sm font-semibold text-neutral-800 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-300">
              补位计划
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">把缺口变成 90 天行动</p>
          </button>
        </div>
      </div>

      {/* 操作 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={downloadReport}
          disabled={shareLoading}
          className="flex-1"
        >
          {shareLoading ? "生成图片中…" : "保存报告图片"}
        </Button>
        <Button
          variant="outline"
          onClick={copyReport}
          className="flex-1"
        >
          复制文字报告
        </Button>
        <Button
          variant="outline"
          onClick={goInterview}
          className="flex-1"
        >
          AI 模拟面试
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="flex-1"
        >
          再测一份
        </Button>
      </div>

      {shareMsg && <p className="text-center text-sm text-success-600 dark:text-success-400">{shareMsg}</p>}

      {/* 优化结果预览弹窗：展示修改点，确认后灌入编辑器（新建版本） */}
      {optOpen && optResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4" role="dialog" aria-modal="true">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 p-6 dark:border-neutral-800">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">AI 已按 JD 优化你的简历</h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  将新建一份「JD优化-{optResult.resume.basics?.title || "简历"}」版本，原简历不受影响，可在编辑器中继续微调。
                </p>
              </div>
              <button
                onClick={() => {
                  setOptOpen(false);
                  setOptResult(null);
                }}
                className="shrink-0 rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:hover:bg-neutral-800"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-6">
              {optResult.changes.length > 0 ? (
                <ul className="space-y-3">
                  {optResult.changes.map((c, i) => (
                    <li key={i} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                          {c.section}
                        </span>
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{c.title}</span>
                      </div>
                      {c.before ? (
                        <p className="mb-1 text-xs text-neutral-400 dark:text-neutral-500">原：{c.before}</p>
                      ) : (
                        <p className="mb-1 text-xs text-neutral-400 dark:text-neutral-500">新增内容</p>
                      )}
                      <p className="rounded-lg border border-success-200 bg-success-50 px-3 py-2 text-sm leading-relaxed text-neutral-800 dark:border-success-900 dark:bg-success-950 dark:text-neutral-100">
                        {c.after}
                      </p>
                      {c.reason && (
                        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">💡 {c.reason}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  AI 已为你重新组织简历内容以更贴合该岗位，可直接查看与继续编辑。
                </p>
              )}
            </div>
            <div className="flex gap-3 border-t border-neutral-100 p-6 dark:border-neutral-800">
              <button
                onClick={() => {
                  setOptOpen(false);
                  setOptResult(null);
                }}
                className="flex-1 rounded-xl border border-neutral-300 py-3 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                取消
              </button>
              <button
                onClick={applyOptimize}
                className="flex-1 rounded-xl bg-accent-600 py-3 font-medium text-white transition-colors hover:bg-accent-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
              >
                应用到编辑器
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
