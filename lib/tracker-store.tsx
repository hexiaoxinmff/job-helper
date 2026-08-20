"use client";
// 投递追踪工作台（Job Tracker）数据层：纯前端 localStorage，仅记录投递动作。
// 隐私红线：只存「公司/岗位/状态/时间/备注」等投递台账信息，不含简历正文、不含 JD 全文，
// 天然合规，可在首页隐私弹窗中说明。
import { useCallback, useContext, createContext, ReactNode, useSyncExternalStore } from "react";

export const APPLICATION_STATUSES = [
  "applied", // 已投递
  "written", // 笔试
  "interview", // 面试
  "offer", // Offer
  "rejected", // 已拒绝
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; dot: string; badge: string }
> = {
  applied: {
    label: "已投递",
    dot: "bg-neutral-400",
    badge: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
  written: {
    label: "笔试",
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  interview: {
    label: "面试",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  offer: {
    label: "Offer",
    dot: "bg-success-500",
    badge: "bg-success-100 text-success-700 dark:bg-success-950 dark:text-success-300",
  },
  rejected: {
    label: "已拒绝",
    dot: "bg-danger-500",
    badge: "bg-danger-100 text-danger-700 dark:bg-danger-950 dark:text-danger-300",
  },
};

export interface ApplicationItem {
  id: string;
  /** 公司 */
  company: string;
  /** 岗位 */
  role: string;
  /** 投递渠道，如 BOSS直聘 / 官网 / 内推（可选） */
  source?: string;
  /** 所用简历版本说明（可选） */
  resumeVersion?: string;
  /** 关联 JD 模板 id（可选，便于一键回看该岗位 JD） */
  jdId?: string;
  /** JD 摘要（脱敏，截断） */
  jdSummary?: string;
  status: ApplicationStatus;
  /** 投递日期 YYYY-MM-DD */
  appliedAt: string;
  /** 最近更新时间（Unix 毫秒） */
  updatedAt: number;
  /** 备注（面试时间、跟进事项等） */
  notes?: string;
  /** 投递链接（可选） */
  url?: string;
}

const STORAGE_KEY = "job-helper:tracker";

function sanitizeItem(s: unknown): ApplicationItem | null {
  if (!s || typeof s !== "object") return null;
  const d = s as Partial<ApplicationItem>;
  const company = String(d.company ?? "").trim().slice(0, 100);
  const role = String(d.role ?? "").trim().slice(0, 100);
  if (!company || !role) return null;
  const status = APPLICATION_STATUSES.includes(d.status as ApplicationStatus)
    ? (d.status as ApplicationStatus)
    : "applied";
  const updatedAt =
    typeof d.updatedAt === "number" && Number.isFinite(d.updatedAt) ? d.updatedAt : Date.now();
  return {
    id: String(d.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    company,
    role,
    source: String(d.source ?? "").slice(0, 100) || undefined,
    resumeVersion: String(d.resumeVersion ?? "").slice(0, 100) || undefined,
    jdId: String(d.jdId ?? "") || undefined,
    jdSummary: String(d.jdSummary ?? "").slice(0, 300) || undefined,
    status,
    appliedAt: String(d.appliedAt ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10),
    updatedAt,
    notes: String(d.notes ?? "").slice(0, 2000) || undefined,
    url: String(d.url ?? "").slice(0, 500) || undefined,
  };
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: ApplicationItem[] = [];
let loaded = false;

function getSnapshot(): ApplicationItem[] {
  if (!loaded) {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as unknown;
        cache = Array.isArray(arr)
          ? arr.map(sanitizeItem).filter((x): x is ApplicationItem => x !== null)
          : [];
      }
    } catch {
      cache = [];
    }
  }
  return cache;
}

function getServerSnapshot(): ApplicationItem[] {
  return [];
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: ApplicationItem[]) {
  cache = next;
  loaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* 存储不可用时静默降级 */
  }
  listeners.forEach((l) => l());
}

export interface TrackerContextValue {
  items: ApplicationItem[];
  add: (s: Omit<ApplicationItem, "id" | "updatedAt">) => void;
  update: (id: string, patch: Partial<Omit<ApplicationItem, "id">>) => void;
  /** 快捷流转状态（看板卡片用） */
  move: (id: string, status: ApplicationStatus) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** 云端同步合并：按条目 updatedAt 取新（同 id 保留更新时间更大的） */
  mergeRemote: (items: ApplicationItem[]) => void;
  /** 导出投递台账为 JSON（用户数据所有权） */
  exportTracker: () => void;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    useCallback((l: Listener) => subscribe(l), []),
    getSnapshot,
    getServerSnapshot
  );

  const add: TrackerContextValue["add"] = (s) => {
    const item: ApplicationItem = {
      ...s,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      updatedAt: Date.now(),
    };
    commit([item, ...getSnapshot()]);
  };

  const update: TrackerContextValue["update"] = (id, patch) => {
    commit(
      getSnapshot().map((it) =>
        it.id === id ? { ...it, ...patch, updatedAt: Date.now() } : it
      )
    );
  };

  const move: TrackerContextValue["move"] = (id, status) => {
    commit(
      getSnapshot().map((it) => (it.id === id ? { ...it, status, updatedAt: Date.now() } : it))
    );
  };

  const remove = (id: string) => {
    commit(getSnapshot().filter((it) => it.id !== id));
  };

  const clear = () => commit([]);

  const mergeRemote = (items: ApplicationItem[]) => {
    const map = new Map<string, ApplicationItem>();
    for (const it of [...getSnapshot(), ...items]) {
      const clean = sanitizeItem(it);
      if (!clean) continue;
      const prev = map.get(clean.id);
      if (!prev || (clean.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) map.set(clean.id, clean);
    }
    commit(Array.from(map.values()));
  };

  const exportTracker = () => {
    try {
      const blob = new Blob([JSON.stringify(getSnapshot(), null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `投递追踪台账-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* 忽略 */
    }
  };

  return (
    <TrackerContext.Provider
      value={{ items, add, update, move, remove, clear, mergeRemote, exportTracker }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker 必须在 TrackerProvider 内使用");
  return ctx;
}
