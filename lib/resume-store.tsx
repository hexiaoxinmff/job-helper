"use client";

import { createContext, ReactNode, useCallback, useContext, useSyncExternalStore } from "react";
import {
  ActivityItem,
  AwardItem,
  EducationItem,
  InternshipItem,
  LanguageItem,
  LEGACY_TEMPLATE_MAP,
  PortfolioItem,
  ProjectItem,
  Resume,
  SkillGroup,
  TemplateId,
  WorkItem,
  createEmptyResume,
} from "./types";

interface ResumeContextValue {
  resume: Resume;
  /** 是否已完成 localStorage 回填（回填前调用方应渲染骨架，避免空表单闪屏） */
  hydrated: boolean;
  setResume: (updater: Resume | ((prev: Resume) => Resume)) => void;
  reset: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);
const STORAGE_KEY = "job-helper:resume";
// 头像单列存储：避免整份简历 JSON 因 2MB base64 头像而体积爆炸，
// 否则每次按键做 JSON.stringify + localStorage.setItem 会阻塞主线程导致输入卡顿（P1 修复）。
const STORAGE_KEY_AVATAR = "job-helper:avatar";
const AVATAR_MAX_LEN = 300000; // ~300KB，远超头像显示所需，同时把单次写盘开销压到可接受范围
/**
 * 存储结构版本：1 = { version, data } 包装 + 5 板块（basics/education/work/projects/skills）；
 * 2 = 扩展 12 板块（新增 advantages/languages/internships/activities/awards/portfolio + visibility）；
 * 3 = 20 套新版模板 + avatar 头像（2026-08 模板重构，旧 6 个模板 id 自动映射到新模板）。
 * 旧裸 Resume 对象自动迁移。迁移红线：已有字段原样保留，不丢。
 */
const STORAGE_VERSION = 3;

const TEMPLATE_IDS: TemplateId[] = [
  "timeline",
  "minimal-blue",
  "bw-minimal",
  "artistic",
  "dense",
  "fresh-green",
  "gradient-purple",
  "vibrant-orange",
  "it-minimal",
  "biz-split",
  "edu-blue",
  "dark-biz",
  "space-grey",
  "rose-gold",
  "classic-red",
  "light-blue",
  "sidebar-navy",
  "military-green",
  "topbar-modern",
  "magazine",
];

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
const arrOf = <T,>(v: unknown): T[] =>
  (Array.isArray(v) ? v.filter((it): it is Record<string, unknown> => isObj(it)) : []) as unknown as T[];

/** 逐字段校验从 localStorage 恢复的简历，损坏/跨版本数据降级为空值而非抛错 */
function sanitizeResume(data: unknown): Resume {
  const empty = createEmptyResume();
  if (!data || typeof data !== "object") return empty;
  const d = data as Partial<Resume>;

  const basics = { ...empty.basics, ...(d.basics && typeof d.basics === "object" ? d.basics : {}) };
  const education = arrOf<EducationItem>(d.education);
  const languages = arrOf<LanguageItem>(d.languages);
  const internships = arrOf<InternshipItem>(d.internships);
  const work = arrOf<WorkItem>(d.work);
  const projects = arrOf<ProjectItem>(d.projects);
  const activities = arrOf<ActivityItem>(d.activities);
  const skills = arrOf<SkillGroup>(d.skills);
  const awards = arrOf<AwardItem>(d.awards);
  const portfolio = arrOf<PortfolioItem>(d.portfolio);
  const advantages = Array.isArray(d.advantages) ? d.advantages.filter((s) => typeof s === "string") : [];
  const visibility =
    d.visibility && isObj(d.visibility)
      ? Object.fromEntries(Object.entries(d.visibility).filter(([, v]) => typeof v === "boolean"))
      : {};
  // 模板：新 id 直接用；旧 6 个 id（classic/modern/compact/sidebar/elegant/creative）映射到新模板；其余回退 timeline
  let template: TemplateId = empty.template;
  const raw = d.template as string;
  if (raw) {
    if (TEMPLATE_IDS.includes(raw as TemplateId)) {
      template = raw as TemplateId;
    } else if (LEGACY_TEMPLATE_MAP[raw]) {
      template = LEGACY_TEMPLATE_MAP[raw];
    }
  }
  // 头像上限从 2MB 降到 ~300KB（P1 修复：降低单次写盘体积）
  const avatar = typeof d.avatar === "string" && d.avatar.length > 0 ? d.avatar.slice(0, AVATAR_MAX_LEN) : "";

  return {
    basics,
    advantages,
    education,
    languages,
    internships,
    work,
    projects,
    activities,
    skills,
    awards,
    portfolio,
    visibility,
    avatar,
    template,
  };
}

/** v1 → v2 温和迁移：仅当旧 summary 含换行（用户曾把多行内容塞进简介）时拆为个人优势，否则保持空 */
function migrateAdvantages(prev: Resume): Resume {
  if (prev.advantages.length > 0) return prev;
  const s = prev.basics.summary;
  if (!s || !s.includes("\n")) return prev;
  const lines = s
    .split("\n")
    .map((l) => l.replace(/^[•·\-\s]+/, "").trim())
    .filter(Boolean);
  if (lines.length < 2) return prev;
  return { ...prev, advantages: lines };
}

/** 兼容旧格式（裸 Resume）与 v1/v2（{ version, data }），损坏返回空简历 */
function loadResume(raw: string | null): Resume {
  if (!raw) return createEmptyResume();
  try {
    const parsed = JSON.parse(raw) as unknown;
    // 版本号低于当前版本（v1）→ sanitize 时缺省字段自动补空；再温和迁移 advantages
    const base =
      parsed && isObj(parsed) && "version" in parsed
        ? migrateAdvantages(sanitizeResume((parsed as { data: unknown }).data))
        : migrateAdvantages(sanitizeResume(parsed));
    // 头像独立存储：从专用 key 合并回来（主 JSON 不含头像，保持轻量）
    try {
      const av = window.localStorage.getItem(STORAGE_KEY_AVATAR);
      if (av && av.length <= AVATAR_MAX_LEN) return { ...base, avatar: av };
    } catch {
      /* 读头像失败不影响主数据 */
    }
    return base;
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

// 持久化防抖（P1 修复核心）：UI 同步更新，但落盘延迟 300ms 并合并连续按键，避免每次按键阻塞主线程。
const PERSIST_DEBOUNCE_MS = 300;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

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

function persistNow() {
  const next = resumeCache;
  if (!next) return;
  try {
    // 头像剥离到独立 key，主 JSON 只存文本数据 → 体积小、stringify 快
    const { avatar, ...rest } = next;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, data: rest })
    );
    if (avatar && avatar.length > 0) {
      window.localStorage.setItem(STORAGE_KEY_AVATAR, avatar.slice(0, AVATAR_MAX_LEN));
    } else {
      // 无头像时清掉旧头像 key，避免残留
      window.localStorage.removeItem(STORAGE_KEY_AVATAR);
    }
  } catch {
    /* 存储不可用时静默降级 */
  }
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistNow();
  }, PERSIST_DEBOUNCE_MS);
}

function commitResume(next: Resume) {
  resumeCache = next; // 同步更新缓存 → 订阅组件立即重渲染，输入不卡
  resumeHydrated = true;
  resumeListeners.forEach((l) => l()); // 同步通知订阅
  schedulePersist(); // 异步(防抖)落盘，仅此步延后
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
