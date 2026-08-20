"use client";
// 90 天补位计划存储：把诊断出的缺失项沉淀为可追踪的补位清单（本地），档案页展示进度。
// 与诊断历史不同：补位计划是「用户主动加入、可勾选完成」的行动清单，而非自动记录。
import { useCallback, useContext, createContext, ReactNode, useSyncExternalStore } from "react";

export interface RemediationItem {
  id: string;
  /** 缺失关键词 */
  keyword: string;
  /** 缺口类型：hard=硬技能缺口；expression=表达缺口 */
  kind: "hard" | "expression";
  /** 资源建议（hard 缺口；纯文本摘要） */
  resource?: string;
  /** 加入时间（Unix 毫秒） */
  addedAt: number;
  /** 是否已完成 */
  done: boolean;
  /** 完成时间 */
  doneAt?: number;
}

const STORAGE_KEY = "job-helper:remediation";
const MAX_ITEMS = 30;

function sanitizeItem(s: unknown): RemediationItem | null {
  if (!s || typeof s !== "object") return null;
  const d = s as Partial<RemediationItem>;
  const keyword = String(d.keyword ?? "").trim().slice(0, 60);
  if (!keyword) return null;
  return {
    id: String(d.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    keyword,
    kind: d.kind === "expression" ? "expression" : "hard",
    resource: String(d.resource ?? "").slice(0, 400) || undefined,
    addedAt: typeof d.addedAt === "number" && Number.isFinite(d.addedAt) ? d.addedAt : Date.now(),
    done: !!d.done,
    doneAt: typeof d.doneAt === "number" && Number.isFinite(d.doneAt) ? d.doneAt : undefined,
  };
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: RemediationItem[] = [];
let loaded = false;

function getSnapshot(): RemediationItem[] {
  if (!loaded) {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as unknown;
        cache = Array.isArray(arr)
          ? arr.map(sanitizeItem).filter((x): x is RemediationItem => x !== null).slice(0, MAX_ITEMS)
          : [];
      }
    } catch {
      cache = [];
    }
  }
  return cache;
}

function getServerSnapshot(): RemediationItem[] {
  return [];
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: RemediationItem[]) {
  cache = next.slice(0, MAX_ITEMS);
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* 存储不可用时静默降级 */
  }
  listeners.forEach((l) => l());
}

export interface RemediationContextValue {
  items: RemediationItem[];
  /** 加入补位计划（已存在相同关键词则忽略） */
  add: (s: { keyword: string; kind: "hard" | "expression"; resource?: string }) => void;
  /** 勾选 / 取消完成 */
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const RemediationContext = createContext<RemediationContextValue | null>(null);

export function RemediationProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    useCallback((l: Listener) => subscribe(l), []),
    getSnapshot,
    getServerSnapshot
  );

  const add: RemediationContextValue["add"] = (s) => {
    const cur = getSnapshot();
    if (cur.some((x) => x.keyword === s.keyword)) return; // 去重
    const item: RemediationItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      keyword: s.keyword,
      kind: s.kind,
      resource: s.resource,
      addedAt: Date.now(),
      done: false,
    };
    commit([item, ...cur]);
  };

  const toggle = (id: string) => {
    commit(
      getSnapshot().map((it) =>
        it.id === id
          ? { ...it, done: !it.done, doneAt: !it.done ? Date.now() : undefined }
          : it
      )
    );
  };

  const remove = (id: string) => commit(getSnapshot().filter((it) => it.id !== id));

  const clear = () => commit([]);

  return (
    <RemediationContext.Provider value={{ items, add, toggle, remove, clear }}>
      {children}
    </RemediationContext.Provider>
  );
}

export function useRemediation() {
  const ctx = useContext(RemediationContext);
  if (!ctx) throw new Error("useRemediation 必须在 RemediationProvider 内使用");
  return ctx;
}
