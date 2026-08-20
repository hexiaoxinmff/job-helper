"use client";
// 诊断历史本地化：每次诊断无条件记录（脱敏，仅本地），最近 N 条，可一键清除。
// 与私人档案（lib/profile.tsx）的区别：
//   - 档案：需用户主动开启，用于「长期职业建模对比」，可导出携带；
//   - 诊断历史：默认记录、纯脱敏（岗位摘要/总分/维度/时间，不含简历正文）、上限 20 条、一键清除，
//     作为「跨平台求职工作台」的数据底座，不违反隐私红线。
import { useCallback, useContext, createContext, ReactNode, useSyncExternalStore } from "react";
import type { Confidence } from "./types";

export interface DiagnosisHistoryItem {
  id: string;
  /** Unix 毫秒 */
  ts: number;
  /** JD 摘要（截断，不含全文） */
  targetRole: string;
  overallScore: number;
  dimensions: { name: string; score: number }[];
  confidence?: Confidence;
}

const STORAGE_KEY = "job-helper:diag-history";
const MAX_ITEMS = 20;

function sanitizeItem(s: unknown): DiagnosisHistoryItem | null {
  if (!s || typeof s !== "object") return null;
  const d = s as Partial<DiagnosisHistoryItem>;
  const ts = typeof d.ts === "number" && Number.isFinite(d.ts) ? d.ts : 0;
  const score =
    typeof d.overallScore === "number" && Number.isFinite(d.overallScore)
      ? Math.max(0, Math.min(100, Math.round(d.overallScore)))
      : 0;
  const dims = Array.isArray(d.dimensions)
    ? d.dimensions
        .filter((x) => x && typeof x === "object")
        .slice(0, 10)
        .map((x) => ({
          name: String((x as { name?: unknown }).name ?? "维度"),
          score: Math.max(0, Math.min(100, Number((x as { score?: unknown }).score) || 0)),
        }))
    : [];
  if (ts <= 0) return null;
  return {
    id: String(d.id ?? `${ts}-${Math.random().toString(36).slice(2, 8)}`),
    ts,
    targetRole: String(d.targetRole ?? "").slice(0, 200),
    overallScore: score,
    dimensions: dims,
    confidence:
      d.confidence === "low" || d.confidence === "medium" || d.confidence === "high"
        ? d.confidence
        : undefined,
  };
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: DiagnosisHistoryItem[] = [];
let loaded = false;

function getSnapshot(): DiagnosisHistoryItem[] {
  if (!loaded) {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as unknown;
        cache = Array.isArray(arr)
          ? arr.map(sanitizeItem).filter((x): x is DiagnosisHistoryItem => x !== null).slice(0, MAX_ITEMS)
          : [];
      }
    } catch {
      cache = [];
    }
  }
  return cache;
}

function getServerSnapshot(): DiagnosisHistoryItem[] {
  return [];
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: DiagnosisHistoryItem[]) {
  cache = next.slice(0, MAX_ITEMS);
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* 存储不可用时静默降级 */
  }
  listeners.forEach((l) => l());
}

export interface DiagnosisHistoryContextValue {
  items: DiagnosisHistoryItem[];
  /** 无条件追加一次诊断记录（脱敏，调用方只传必要字段） */
  append: (s: Omit<DiagnosisHistoryItem, "id" | "ts"> & { ts?: number }) => void;
  /** 云端同步合并：按 ts 去重，取最新 20 条 */
  mergeRemote: (items: DiagnosisHistoryItem[]) => void;
  /** 一键清除全部诊断历史 */
  clear: () => void;
}

const DiagnosisHistoryContext = createContext<DiagnosisHistoryContextValue | null>(null);

export function DiagnosisHistoryProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    useCallback((l: Listener) => subscribe(l), []),
    getSnapshot,
    getServerSnapshot
  );

  const append: DiagnosisHistoryContextValue["append"] = (s) => {
    const item: DiagnosisHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: s.ts ?? Date.now(),
      targetRole: s.targetRole,
      overallScore: s.overallScore,
      dimensions: s.dimensions,
      confidence: s.confidence,
    };
    commit([item, ...getSnapshot()]);
  };

  const clear = () => commit([]);

  const mergeRemote = (items: DiagnosisHistoryItem[]) => {
    const map = new Map<string, DiagnosisHistoryItem>();
    for (const it of [...getSnapshot(), ...items]) {
      const clean = sanitizeItem(it);
      if (!clean) continue;
      const prev = map.get(clean.id);
      if (!prev || (clean.ts ?? 0) >= (prev.ts ?? 0)) map.set(clean.id, clean);
    }
    commit(Array.from(map.values()).sort((a, b) => b.ts - a.ts));
  };

  return (
    <DiagnosisHistoryContext.Provider value={{ items, append, mergeRemote, clear }}>
      {children}
    </DiagnosisHistoryContext.Provider>
  );
}

export function useDiagnosisHistory() {
  const ctx = useContext(DiagnosisHistoryContext);
  if (!ctx) throw new Error("useDiagnosisHistory 必须在 DiagnosisHistoryProvider 内使用");
  return ctx;
}
