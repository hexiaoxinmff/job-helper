"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Resume, createEmptyResume } from "./types";

interface ResumeContextValue {
  resume: Resume;
  setResume: (updater: Resume | ((prev: Resume) => Resume)) => void;
  reset: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);
const STORAGE_KEY = "job-helper:resume";

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [resume, setResumeState] = useState<Resume>(createEmptyResume);

  // 挂载后从本地存储恢复，避免 SSR/CSR hydration mismatch
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setResumeState({ ...createEmptyResume(), ...JSON.parse(raw) });
    } catch {
      /* 忽略损坏的本地数据 */
    }
  }, []);

  // 变更后持久化
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
    } catch {
      /* 存储不可用时静默降级 */
    }
  }, [resume]);

  const setResume: ResumeContextValue["setResume"] = (updater) =>
    setResumeState((prev) => (typeof updater === "function" ? updater(prev) : updater));

  const reset = () => setResumeState(createEmptyResume());

  return (
    <ResumeContext.Provider value={{ resume, setResume, reset }}>{children}</ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume 必须在 ResumeProvider 内使用");
  return ctx;
}
