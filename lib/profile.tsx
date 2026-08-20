"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import type { Confidence } from "./types";

// ===== 私人职业档案 =====
// 设计原则（对齐需求验证报告）：
// 1. 默认不存储 —— 用户主动开启后才写入本地（localStorage），契合「隐私优先」合规红线。
// 2. 数据归用户所有 —— 仅存本地、可导出为 .json、可一键清除，支持跨设备「携带」。
// 3. 沉淀「能力与成长轨迹」—— 多次诊断的历史快照，构成长期职业建模的数据基础。

const STORAGE_KEY = "job-helper:profile";
// 数据结构 v1：无外层包装（导出文件即用户数据），结构变更时在此处做迁移/兼容，避免破坏已导出文件

export interface ProfileSnapshot {
  id: string;
  ts: number; // Unix 毫秒
  targetRole: string; // JD 摘要（截断）
  overallScore: number;
  dimensions: { name: string; score: number }[];
  confidence?: Confidence;
}

export interface PrivateProfile {
  enabled: boolean;
  targetRole: string;
  /** 理想岗位目标总分（0-100），驱动「长期职业建模对比图」目标线，可选 */
  targetScore?: number;
  histories: ProfileSnapshot[];
}

const EMPTY: PrivateProfile = { enabled: false, targetRole: "", histories: [] };

/** 逐 snapshot 校验：损坏的条目丢弃，避免渲染时 Invalid Date / NaN */
function sanitizeSnapshot(s: unknown): ProfileSnapshot | null {
  if (!s || typeof s !== "object") return null;
  const d = s as Partial<ProfileSnapshot>;
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
          score: Math.max(
            0,
            Math.min(100, Number((x as { score?: unknown }).score) || 0)
          ),
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

function safeParse(raw: string | null): PrivateProfile {
  if (!raw) return EMPTY;
  try {
    const p = JSON.parse(raw) as Partial<PrivateProfile>;
    return {
      enabled: !!p.enabled,
      targetRole: p.targetRole ?? "",
      targetScore:
        typeof p.targetScore === "number" && p.targetScore >= 0 && p.targetScore <= 100
          ? p.targetScore
          : undefined,
      histories: Array.isArray(p.histories)
        ? p.histories.map(sanitizeSnapshot).filter((x): x is ProfileSnapshot => x !== null)
        : [],
    };
  } catch {
    return EMPTY;
  }
}

interface ProfileContextValue {
  profile: PrivateProfile;
  /** 开启 / 关闭私人档案（关闭即停止沉淀，但保留已有数据直到用户清除） */
  setEnabled: (v: boolean) => void;
  setTargetRole: (v: string) => void;
  /** 设定理想岗位目标总分（0-100 或 undefined 清除） */
  setTargetScore: (v?: number) => void;
  /** 追加一次诊断快照（仅在 enabled 时生效由调用方控制） */
  appendSnapshot: (s: Omit<ProfileSnapshot, "id">) => void;
  /** 云端同步合并：按 ts 去重合并历史快照（保留本地 enabled/targetRole/targetScore 设置） */
  mergeRemoteHistories: (histories: ProfileSnapshot[]) => void;
  clear: () => void;
  exportProfile: () => void;
  importProfile: (json: string) => { ok: boolean; error?: string };
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

// ===== 外部 store：localStorage 持久化 + 订阅，供 useSyncExternalStore 使用 =====
// 本地恢复发生在客户端首次读取快照时（hydration 用 server snapshot 兜底，避免 SSR/CSR mismatch）。
type Listener = () => void;
const profileListeners = new Set<Listener>();
let profileCache: PrivateProfile = EMPTY;
let profileLoaded = false;

function getProfileSnapshot(): PrivateProfile {
  if (!profileLoaded) {
    profileLoaded = true;
    try {
      profileCache = safeParse(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      profileCache = EMPTY;
    }
  }
  return profileCache;
}

function getProfileServerSnapshot(): PrivateProfile {
  return EMPTY;
}

function subscribeProfile(listener: Listener) {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
}

function commitProfile(next: PrivateProfile) {
  profileCache = next;
  profileLoaded = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 存储不可用时静默降级 */
  }
  profileListeners.forEach((l) => l());
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const profile = useSyncExternalStore(
    useCallback((l: Listener) => subscribeProfile(l), []),
    getProfileSnapshot,
    getProfileServerSnapshot
  );

  const setEnabled = (v: boolean) =>
    commitProfile({ ...profile, enabled: v });

  const setTargetRole = (v: string) =>
    commitProfile({ ...profile, targetRole: v });

  const setTargetScore = (v?: number) =>
    commitProfile({ ...profile, targetScore: v });

  const appendSnapshot = (s: Omit<ProfileSnapshot, "id">) => {
    const snap: ProfileSnapshot = { ...s, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    commitProfile({ ...profile, histories: [snap, ...profile.histories].slice(0, 50) });
  };

  const clear = () => commitProfile(EMPTY);

  const mergeRemoteHistories = (histories: ProfileSnapshot[]) => {
    const map = new Map<string, ProfileSnapshot>();
    for (const h of [...profile.histories, ...(Array.isArray(histories) ? histories : [])]) {
      const clean = sanitizeSnapshot(h);
      if (!clean) continue;
      const prev = map.get(clean.id);
      if (!prev || clean.ts >= prev.ts) map.set(clean.id, clean);
    }
    commitProfile({
      ...profile,
      histories: Array.from(map.values()).sort((a, b) => b.ts - a.ts).slice(0, 50),
    });
  };

  const exportProfile = () => {
    try {
      const blob = new Blob([JSON.stringify(profile, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `我的职业档案-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* 忽略 */
    }
  };

  const importProfile = (json: string): { ok: boolean; error?: string } => {
    try {
      const p = safeParse(json);
      if (p.histories.length === 0 && !json.trim()) {
        return { ok: false, error: "文件内容为空" };
      }
      commitProfile(p);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error)?.message ?? "导入失败" };
    }
  };

  return (
    <ProfileContext.Provider
      value={{ profile, setEnabled, setTargetRole, setTargetScore, appendSnapshot, mergeRemoteHistories, clear, exportProfile, importProfile }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile 必须在 ProfileProvider 内使用");
  return ctx;
}
