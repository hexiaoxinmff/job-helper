"use client";

import { useMemo, useState } from "react";
import type { DiagnosisIssue, RepairLogEntry } from "@/lib/types";
import { getLogicalBullets, isIssueAnchorValid } from "@/lib/issue-anchors";

const ISSUE_LABEL: Record<DiagnosisIssue["type"], string> = {
  missing_keyword: "关键词缺口",
  missing_metric: "缺少量化成果",
  weak_expression: "表达可加强",
  experience_gap: "经历缺口",
  structure: "结构问题",
  other: "改进建议",
};

const LOCATION_REASON: Record<NonNullable<DiagnosisIssue["locationFailureReason"]>, string> = {
  no_excerpt: "建议没有可核验的原文片段",
  not_found: "候选片段与提取原文不一致",
  ambiguous: "相同片段出现多次，无法判定是哪一条",
  not_single_bullet: "片段跨越多个逻辑条目",
  outside_ai_scope: "片段超出 AI 本次检查的前 6000 字",
  text_changed: "文本已改变，旧位置失效",
};

function markedText(
  line: { start: number; end: number; text: string },
  issues: DiagnosisIssue[]
) {
  const intervals = issues
    .filter((issue) => issue.status === "proposed" && issue.startOffset !== null && issue.endOffset !== null)
    .map((issue) => ({ start: Math.max(line.start, issue.startOffset!), end: Math.min(line.end, issue.endOffset!) }))
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const range of intervals) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  if (merged.length === 0) return line.text;
  const nodes: React.ReactNode[] = [];
  let cursor = line.start;
  for (const range of merged) {
    if (cursor < range.start) nodes.push(line.text.slice(cursor - line.start, range.start - line.start));
    nodes.push(<mark className="diagnosis-wavy" key={`${range.start}-${range.end}`}>
      {line.text.slice(range.start - line.start, range.end - line.start)}
    </mark>);
    cursor = range.end;
  }
  if (cursor < line.end) nodes.push(line.text.slice(cursor - line.start));
  return nodes;
}

interface Props {
  sourceText: string;
  issues: DiagnosisIssue[];
  logs?: RepairLogEntry[];
  onApprove?: (issueId: string) => void;
  onDismiss?: (issueId: string) => void;
  onRestore?: (issueId: string) => void;
}

export default function DiagnosisAnnotations({ sourceText, issues, logs = [], onApprove, onDismiss, onRestore }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bullets = useMemo(() => getLogicalBullets(sourceText), [sourceText]);
  const exactIssues = useMemo(
    () => issues.filter((issue) => isIssueAnchorValid(issue, sourceText)),
    [issues, sourceText]
  );

  const locate = (issue: DiagnosisIssue) => {
    if (!isIssueAnchorValid(issue, sourceText) || issue.logicalBulletIndex === null) return;
    setSelectedId(issue.issueId);
    const target = document.getElementById(`diagnosis-bullet-${issue.logicalBulletIndex}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus({ preventScroll: true });
  };

  return (
    <section aria-label="逐条诊断与原文定位" className="scroll-mt-20 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">逐条诊断与原文定位</h2>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          这里的“行”指 PDF 提取文本中的逻辑条目，不代表 PDF 页面坐标。仅精确核验的片段显示红波浪线；定位失败会明确说明。
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-950/40" aria-label="本次简历提取文本">
          <h3 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">简历提取文本</h3>
          <ol className="max-h-[34rem] space-y-1 overflow-y-auto pr-1">
            {bullets.map((line) => {
              const lineIssues = exactIssues.filter((issue) => issue.logicalBulletIndex === line.index);
              const active = lineIssues.some((issue) => issue.issueId === selectedId);
              return (
                <li key={line.index} id={`diagnosis-bullet-${line.index}`} tabIndex={-1}
                  className={`diagnosis-line flex scroll-mt-24 items-start gap-2 rounded-lg px-2 py-1.5 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${active ? "bg-primary-100 dark:bg-primary-950" : ""}`}>
                  <span className="w-6 shrink-0 select-none text-right text-xs text-neutral-400" aria-hidden="true">{line.index + 1}</span>
                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-neutral-700 dark:text-neutral-200">{markedText(line, lineIssues)}</span>
                  {lineIssues.length > 0 && <span className="shrink-0 rounded-full bg-danger-100 px-2 py-0.5 text-[11px] font-medium text-danger-700 dark:bg-danger-950 dark:text-danger-300" aria-label={`第 ${line.index + 1} 条有 ${lineIssues.length} 个诊断问题`}>
                    {lineIssues.length} 个问题
                  </span>}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="min-w-0 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">诊断项（{issues.filter((i) => i.status !== "dismissed").length}）</h3>
          {issues.filter((issue) => issue.status !== "dismissed").map((issue) => {
            const exact = isIssueAnchorValid(issue, sourceText);
            return <article key={issue.issueId} className={`rounded-xl border p-4 ${selectedId === issue.issueId ? "border-primary-400" : "border-neutral-200 dark:border-neutral-700"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700 dark:bg-danger-950 dark:text-danger-300">{ISSUE_LABEL[issue.type]}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{issue.dimension} · {issue.origin === "ai" ? "AI 建议" : "规则检查"}</span>
                {issue.status === "approved" && <span className="text-xs text-success-700 dark:text-success-300">已修复 ✓</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">{issue.suggestion}</p>
              {issue.evidence && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">依据：{issue.evidence}</p>}
              <div className="mt-2 text-xs">
                {exact ? <button type="button" onClick={() => locate(issue)} className="font-medium text-primary-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-300">定位到第 {issue.logicalBulletIndex! + 1} 条</button>
                  : <p className="text-warning-700 dark:text-warning-300">未能定位 · {LOCATION_REASON[issue.locationFailureReason ?? "text_changed"]}；按{issue.section || "相关"}模块查看</p>}
              </div>
              {(issue.before || issue.after) && <div className="mt-3 space-y-1.5 rounded-lg bg-neutral-50 p-3 text-xs dark:bg-neutral-800/60">
                {issue.before && <p className="break-words text-neutral-600 dark:text-neutral-300">原文：{issue.before}</p>}
                {issue.after && <p className="break-words text-success-700 dark:text-success-300">建议：{issue.after}</p>}
                {issue.rewriteReason && <p className="text-neutral-500 dark:text-neutral-400">理由：{issue.rewriteReason}</p>}
              </div>}
              {issue.missingFacts.length > 0 && <p className="mt-2 text-xs text-warning-700 dark:text-warning-300">应用前请确认：{issue.missingFacts.join("；")}</p>}
              {(onApprove || onDismiss || onRestore) && <div className="mt-3 flex flex-wrap gap-2">
                {issue.status === "proposed" && onApprove && <button type="button" onClick={() => onApprove(issue.issueId)} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">批准应用</button>}
                {issue.status === "proposed" && onDismiss && <button type="button" onClick={() => onDismiss(issue.issueId)} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200">不采纳</button>}
                {issue.status === "approved" && onRestore && <button type="button" onClick={() => onRestore(issue.issueId)} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200">撤销修改</button>}
              </div>}
            </article>;
          })}
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">修复日志</h3>
            {logs.length === 0 ? <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">本次还没有逐条修复操作。</p> :
              <ol className="mt-2 space-y-2">{logs.map((entry) => {
                const issue = issues.find((item) => item.issueId === entry.issueId);
                return <li key={entry.eventId} className="text-xs">
                  <button type="button" disabled={!issue || !isIssueAnchorValid(issue, sourceText)} onClick={() => issue && locate(issue)} className="text-left text-primary-700 underline underline-offset-2 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline dark:text-primary-300">{entry.label}</button>
                  <span className="ml-2 text-neutral-400">{new Date(entry.at).toLocaleTimeString()}</span>
                </li>;
              })}</ol>}
          </div>
        </div>
      </div>
    </section>
  );
}
