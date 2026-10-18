import type { DiagnosisIssue, DiagnosisIssueCandidate, IssueLocationFailure } from "./types";

export const AI_CHECKED_CHARACTERS = 6000;

export interface LogicalBullet {
  index: number;
  start: number;
  end: number;
  text: string;
}

/** PDF 提取后每个非空文本行是一个逻辑条目；不代表 PDF 的视觉行或页面坐标。 */
export function getLogicalBullets(text: string): LogicalBullet[] {
  const bullets: LogicalBullet[] = [];
  let lineStart = 0;
  while (lineStart < text.length) {
    const newline = text.indexOf("\n", lineStart);
    const rawEnd = newline < 0 ? text.length : newline;
    const lineEnd = rawEnd > lineStart && text[rawEnd - 1] === "\r" ? rawEnd - 1 : rawEnd;
    const raw = text.slice(lineStart, lineEnd);
    const value = raw.trim();
    if (value) {
      const leading = raw.length - raw.trimStart().length;
      bullets.push({
        index: bullets.length,
        start: lineStart + leading,
        end: lineStart + leading + value.length,
        text: value,
      });
    }
    if (newline < 0) break;
    lineStart = newline + 1;
  }
  return bullets;
}

/** 只作会话版本标识，不作密码学摘要，也不写入持久化存储。 */
export function fingerprintText(text: string): string {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length.toString(36)}-${(hash >>> 0).toString(36)}`;
}

function locateCandidate(
  text: string,
  excerpt: string,
  origin: DiagnosisIssue["origin"]
): Pick<DiagnosisIssue, "logicalBulletIndex" | "startOffset" | "endOffset" | "occurrence" | "locationStatus" | "locationFailureReason"> {
  const fallback = (reason: IssueLocationFailure) => ({
    logicalBulletIndex: null,
    startOffset: null,
    endOffset: null,
    occurrence: null,
    locationStatus: "section" as const,
    locationFailureReason: reason,
  });
  if (!excerpt) return fallback("no_excerpt");
  const first = text.indexOf(excerpt);
  if (first < 0) return fallback("not_found");
  if (text.indexOf(excerpt, first + 1) >= 0) return fallback("ambiguous");
  const end = first + excerpt.length;
  if (origin === "ai" && end > AI_CHECKED_CHARACTERS) return fallback("outside_ai_scope");
  const bullet = getLogicalBullets(text).find((line) => first >= line.start && end <= line.end);
  if (!bullet) return fallback("not_single_bullet");
  return {
    logicalBulletIndex: bullet.index,
    startOffset: first,
    endOffset: end,
    occurrence: 0,
    locationStatus: "exact",
    locationFailureReason: undefined,
  };
}

export function createDiagnosisIssue(
  candidate: DiagnosisIssueCandidate,
  text: string,
  origin: DiagnosisIssue["origin"],
  index: number
): DiagnosisIssue {
  const excerpt = candidate.candidateExcerpt.trim();
  const location = locateCandidate(text, excerpt, origin);
  return {
    issueId: `${fingerprintText(text)}-${origin}-${index}`,
    type: candidate.type,
    severity: candidate.severity,
    dimension: candidate.dimension,
    suggestion: candidate.suggestion,
    evidence: candidate.evidence,
    origin,
    sourceType: "extracted_text",
    section: candidate.section || candidate.dimension,
    ...location,
    excerpt,
    textFingerprint: fingerprintText(text),
    before: candidate.before,
    after: candidate.after,
    rewriteReason: candidate.rewriteReason,
    missingFacts: candidate.missingFacts,
    status: "proposed",
    updatedAt: null,
  };
}

export function isIssueAnchorValid(issue: DiagnosisIssue, text: string): boolean {
  const bullet = issue.logicalBulletIndex === null
    ? undefined : getLogicalBullets(text)[issue.logicalBulletIndex];
  return issue.locationStatus === "exact" &&
    issue.textFingerprint === fingerprintText(text) &&
    issue.startOffset !== null && issue.endOffset !== null &&
    bullet !== undefined &&
    text.slice(issue.startOffset, issue.endOffset) === issue.excerpt &&
    bullet.start <= issue.startOffset && bullet.end >= issue.endOffset;
}
