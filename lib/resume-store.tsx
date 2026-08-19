"use client";

import { createContext, ReactNode, useCallback, useContext, useSyncExternalStore } from "react";
import { Resume, TemplateId, createEmptyResume } from "./types";

interface ResumeContextValue {
  resume: Resume;
  /** 是否已完成 localStorage 回填（回填前调用方应渲染骨架，避免空表单闪屏） */
  hydrated: boolean;
  setResume: (updater: Resume | ((prev: Resume) => Resume)) => void;
  reset: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);
const STORAGE_KEY = "job-helper:resume";
/** 存储结构版本：1 = { version, data } 包装；旧数据为裸 Resume 对象（自动迁移） */
const STORAGE_VERSION = 1;

const TEMPLATE_IDS: TemplateId[] = [
  "classic",
  "modern",
  "compact",
  "sidebar",
  "elegant",
  "creative",
  "timeline",
];

/** 逐字段校验从 localStorage 恢复的简历，损坏/跨版本数据降级为空值而非抛错 */
function sanitizeResume(data: unknown): Resume {
  const empty = createEmptyResume();
  if (!data || typeof data !== "object") return empty;
  const d = data as Partial<Resume>;

  const basics = { ...empty.basics, ...(d.basics && typeof d.basics === "object" ? d.basics : {}) };
  const education = Array.isArray(d.education)
    ? d.education.filter((it): it is NonNullable<typeof it> => !!it && typeof it === "object")
    : [];
  const work = Array.isArray(d.work)
    ? d.work.filter((it): it is NonNullable<typeof it> => !!it && typeof it === "object")
    : [];
  const projects = Array.isArray(d.projects)
    ? d.projects.filter((it): it is NonNullable<typeof it> => !!it && typeof it === "object")
    : [];
  const skills = Array.isArray(d.skills)
    ? d.skills.filter((it): it is NonNullable<typeof it> => !!it && typeof it === "object")
    : [];
  const template: TemplateId = TEMPLATE_IDS.includes(d.template as TemplateId)
    ? (d.template as TemplateId)
    : empty.template;

  return { basics, education, work, projects, skills, template };
}

/** 兼容旧格式（裸 Resume）与 v1（{ version, data }），损坏返回空简历 */
function loadResume(raw: string | null): Resume {
  if (!raw) return createEmptyResume();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "version" in (parsed as object) &&
      (parsed as { version?: unknown }).version === STORAGE_VERSION
    ) {
      return sanitizeResume((parsed as { data?: unknown }).data);
    }
    // 旧格式：直接是 Resume 对象
    return sanitizeResume(parsed);
  } catch {
    return createEmptyResume();
  }
}

// ===== 外部 store：localStorage 持久化 + 订阅，供 useSyncExternalStore 使用 =====
// 设计说明：resume 状态由用户交互更新，本地恢复发生在客户端首次读取快照时
// （hydration 用 server snapshot 兜底，避免 SSR/CSR mismatch）。
type Listener = () => void;
const resumeListeners = new Set<Listener>();
let resumeCache: Resume | null = null;
let resumeHydrated = false;

function getResumeSnapshot(): Resume {
  if (!resumeHydrated) {
    resumeHydrated = true;
    try {
      resumeCache = loadResume(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      resumeCache = createEmptyResume();
    }
  }
  return resumeCache ?? createEmptyResume();
}

function getResumeServerSnapshot(): Resume {
  return createEmptyResume();
}

function subscribeResume(listener: Listener) {
  resumeListeners.add(listener);
  return () => resumeListeners.delete(listener);
}

function commitResume(next: Resume) {
  resumeCache = next;
  resumeHydrated = true;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, data: next })
    );
  } catch {
    /* 存储不可用时静默降级 */
  }
  resumeListeners.forEach((l) => l());
}

export function ResumeProvider({ children }: { children: ReactNode }) {
  const resume = useSyncExternalStore(
    useCallback((l: Listener) => subscribeResume(l), []),
    getResumeSnapshot,
    getResumeServerSnapshot
  );
  const hydrated = useSyncExternalStore(
    useCallback((l: Listener) => subscribeResume(l), []),
    () => resumeHydrated,
    () => false
  );

  const setResume: ResumeContextValue["setResume"] = (updater) => {
    const prev = getResumeSnapshot();
    const next = typeof updater === "function" ? updater(prev) : updater;
    commitResume(next);
  };

  const reset = () => commitResume(createEmptyResume());

  return (
    <ResumeContext.Provider value={{ resume, hydrated, setResume, reset }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume 必须在 ResumeProvider 内使用");
  return ctx;
}
