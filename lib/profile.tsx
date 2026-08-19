"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Confidence } from "./types";

// ===== 私人职业档案 =====
// 设计原则（对齐需求验证报告）：
// 1. 默认不存储 —— 用户主动开启后才写入本地（localStorage），契合「隐私优先」合规红线。
// 2. 数据归用户所有 —— 仅存本地、可导出为 .json、可一键清除，支持跨设备「携带」。
// 3. 沉淀「能力与成长轨迹」—— 多次诊断的历史快照，构成长期职业建模的数据基础。

const STORAGE_KEY = "job-helper:profile";

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
      histories: Array.isArray(p.histories) ? p.histories : [],
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
  clear: () => void;
  exportProfile: () => void;
  importProfile: (json: string) => { ok: boolean; error?: string };
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PrivateProfile>(EMPTY);

  // 挂载后从本地恢复，避免 SSR/CSR hydration mismatch
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile(safeParse(raw));
    } catch {
      /* 忽略损坏的本地数据 */
    }
  }, []);

  const persist = (next: PrivateProfile) => {
    setProfile(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* 存储不可用时静默降级 */
    }
  };

  const setEnabled = (v: boolean) =>
    persist({ ...profile, enabled: v });

  const setTargetRole = (v: string) =>
    persist({ ...profile, targetRole: v });

  const setTargetScore = (v?: number) =>
    persist({ ...profile, targetScore: v });

  const appendSnapshot = (s: Omit<ProfileSnapshot, "id">) => {
    const snap: ProfileSnapshot = { ...s, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    persist({ ...profile, histories: [snap, ...profile.histories].slice(0, 50) });
  };

  const clear = () => persist(EMPTY);

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
      if (!Array.isArray(p.histories)) return { ok: false, error: "文件格式不正确" };
      persist(p);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error)?.message ?? "导入失败" };
    }
  };

  return (
    <ProfileContext.Provider
      value={{ profile, setEnabled, setTargetRole, setTargetScore, appendSnapshot, clear, exportProfile, importProfile }}
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
