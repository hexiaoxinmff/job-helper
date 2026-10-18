import type { DiagnosisIssue, DiagnosisIssueCandidate, RepairLogEntry } from "./types";
import { createDiagnosisIssue, fingerprintText, getLogicalBullets, isIssueAnchorValid } from "./issue-anchors";

interface ApprovedEdit {
  replacement: string;
  facts: string[];
  at: number;
}

/** 全部状态仅由报告页 useState 持有；本模块不读取或写入浏览器存储。 */
export interface RepairSession {
  baseText: string;
  baseIssues: DiagnosisIssue[];
  draftText: string;
  issues: DiagnosisIssue[];
  approved: Record<string, ApprovedEdit>;
  dismissed: string[];
  logs: RepairLogEntry[];
}

export function createRepairSession(baseText: string, issues: DiagnosisIssue[]): RepairSession {
  return { baseText, baseIssues: issues, draftText: baseText, issues, approved: {}, dismissed: [], logs: [] };
}

function log(session: RepairSession, issueId: string, action: RepairLogEntry["action"], label: string): RepairLogEntry[] {
  const at = Date.now();
  return [...session.logs, { eventId: `${at}-${session.logs.length}`, issueId, action, at, label }];
}

function candidateOf(issue: DiagnosisIssue, excerpt: string): DiagnosisIssueCandidate {
  return {
    type: issue.type, severity: issue.severity, dimension: issue.dimension,
    suggestion: issue.suggestion, evidence: issue.evidence, section: issue.section,
    candidateExcerpt: excerpt, before: issue.before, after: issue.after,
    rewriteReason: issue.rewriteReason, missingFacts: issue.missingFacts,
  };
}

function rebuild(session: RepairSession): RepairSession {
  const originalLines = getLogicalBullets(session.baseText);
  const edits = session.baseIssues.flatMap((issue) => {
    const approved = session.approved[issue.issueId];
    const line = issue.logicalBulletIndex === null ? undefined : originalLines[issue.logicalBulletIndex];
    return approved && line ? [{ ...approved, issueId: issue.issueId, line }] : [];
  }).sort((a, b) => b.line.start - a.line.start);
  let draftText = session.baseText;
  for (const edit of edits) {
    draftText = draftText.slice(0, edit.line.start) + edit.replacement + draftText.slice(edit.line.end);
  }
  const draftLines = getLogicalBullets(draftText);
  const issues = session.baseIssues.map((base, index) => {
    const lastActionAt = [...session.logs].reverse().find((entry) => entry.issueId === base.issueId)?.at ?? null;
    if (session.dismissed.includes(base.issueId)) {
      const checked = base.locationStatus === "exact"
        ? createDiagnosisIssue(candidateOf(base, base.excerpt), draftText, base.origin, index)
        : base;
      return { ...base, ...checked, issueId: base.issueId, status: "dismissed" as const, updatedAt: lastActionAt };
    }
    const approved = session.approved[base.issueId];
    if (approved && base.logicalBulletIndex !== null) {
      const line = draftLines[base.logicalBulletIndex];
      if (!line) return { ...base, status: "stale" as const, locationStatus: "section" as const, locationFailureReason: "text_changed" as const };
      return {
        ...base,
        status: "approved" as const,
        updatedAt: approved.at,
        excerpt: line.text,
        before: originalLines[base.logicalBulletIndex]?.text ?? base.before,
        after: approved.replacement,
        textFingerprint: fingerprintText(draftText),
        logicalBulletIndex: line.index,
        startOffset: line.start,
        endOffset: line.end,
        occurrence: 0,
        locationStatus: "exact" as const,
        locationFailureReason: undefined,
      };
    }
    if (base.locationStatus !== "exact") return { ...base, updatedAt: lastActionAt };
    const checked = createDiagnosisIssue(candidateOf(base, base.excerpt), draftText, base.origin, index);
    if (checked.locationStatus !== "exact" || checked.logicalBulletIndex !== base.logicalBulletIndex) {
      return {
        ...base,
        status: "stale" as const,
        updatedAt: lastActionAt,
        textFingerprint: fingerprintText(draftText),
        logicalBulletIndex: null,
        startOffset: null,
        endOffset: null,
        occurrence: null,
        locationStatus: "section" as const,
        locationFailureReason: "text_changed" as const,
      };
    }
    return { ...base, ...checked, issueId: base.issueId, status: "proposed" as const, updatedAt: lastActionAt };
  });
  return { ...session, draftText, issues };
}

export function approvalQuestions(issue: DiagnosisIssue, originalLine: string, proposedLine: string): string[] {
  const questions = [...issue.missingFacts];
  const originalNumbers = new Set(originalLine.match(/\d+(?:\.\d+)?%?/g) ?? []);
  const addedNumbers = (proposedLine.match(/\d+(?:\.\d+)?%?/g) ?? []).filter((n) => !originalNumbers.has(n));
  if (addedNumbers.length > 0 && questions.length === 0) {
    questions.push(`请确认新增数字 ${[...new Set(addedNumbers)].join("、")} 的真实来源与口径`);
  }
  return questions;
}

export function originalIssueLine(session: RepairSession, issueId: string): string | null {
  const issue = session.baseIssues.find((item) => item.issueId === issueId);
  if (!issue || issue.logicalBulletIndex === null || !isIssueAnchorValid(issue, session.baseText)) return null;
  return getLogicalBullets(session.baseText)[issue.logicalBulletIndex]?.text ?? null;
}

export function approveRepair(
  session: RepairSession,
  issueId: string,
  replacementInput: string,
  facts: string[]
): { session: RepairSession; error?: string } {
  const current = session.issues.find((issue) => issue.issueId === issueId);
  const original = session.baseIssues.find((issue) => issue.issueId === issueId);
  if (!current || !original || current.status !== "proposed" || !isIssueAnchorValid(current, session.draftText)) {
    return { session, error: "这条建议的位置已失效，请重新诊断。" };
  }
  const originalLine = originalIssueLine(session, issueId);
  if (!originalLine || original.logicalBulletIndex === null) return { session, error: "未能核验整条原文，不能应用。" };
  if (session.baseIssues.some((item) => item.issueId !== issueId &&
      item.logicalBulletIndex === original.logicalBulletIndex && session.approved[item.issueId])) {
    return { session, error: "同一条原文已有已批准修改，请先撤销该修改。" };
  }
  const replacement = replacementInput.trim();
  if (!replacement || replacement === originalLine || /[\r\n]/.test(replacement)) {
    return { session, error: "请提供与原文不同、且不含换行的完整单条改写。" };
  }
  const questions = approvalQuestions(original, originalLine, replacement);
  if (questions.some((_, index) => !facts[index]?.trim())) {
    return { session, error: "请先回答需要核实的事实，再批准应用。" };
  }
  const originalNumbers = new Set(originalLine.match(/\d+(?:\.\d+)?%?/g) ?? []);
  const addedNumbers = (replacement.match(/\d+(?:\.\d+)?%?/g) ?? []).filter((n) => !originalNumbers.has(n));
  if (addedNumbers.some((number) => !facts.some((answer) => answer.includes(number)))) {
    return { session, error: "新增数字必须出现在你填写的事实依据中。" };
  }
  const approved = { ...session.approved, [issueId]: { replacement, facts: facts.map((answer) => answer.trim()), at: Date.now() } };
  return { session: rebuild({ ...session, approved, logs: log(session, issueId, "approved", `第 ${session.baseIssues.indexOf(original) + 1} 项已批准`) }) };
}

export function dismissRepair(session: RepairSession, issueId: string): RepairSession {
  const issue = session.issues.find((item) => item.issueId === issueId);
  if (!issue || issue.status !== "proposed") return session;
  return rebuild({ ...session, dismissed: [...session.dismissed, issueId], logs: log(session, issueId, "dismissed", "已撤销建议，不予采纳") });
}

export function restoreRepair(session: RepairSession, issueId: string): RepairSession {
  if (!session.approved[issueId]) return session;
  const approved = { ...session.approved };
  delete approved[issueId];
  return rebuild({ ...session, approved, logs: log(session, issueId, "restored", "已撤销，恢复原文") });
}
