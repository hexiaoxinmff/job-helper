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

// ========== 多简历版本（v4，2026-08-20） ==========
// v4 把「单份简历」升级为「多份简历版本」：不同岗位方向各存一份，诊断/投递/档案按版本管理。
// 存储结构：{ version: 4, data: { versions: [{ id, name, updatedAt, resume }], activeId } }
// 头像（v3 起独立 key）在 v4 并入各版本 resume.avatar（多版本可能各自不同），
// 配合 300ms 持久化防抖，写盘频率低，体积可控。

export interface ResumeVersion {
  id: string;
  /** 版本名（如「主简历」「前端-2026秋招」） */
  name: string;
  /** 最近修改时间（Unix 毫秒） */
  updatedAt: number;
  resume: Resume;
}

interface ResumeStoreData {
  versions: ResumeVersion[];
  activeId: string;
}

const DEFAULT_VERSION_ID = "v-default";
const DEFAULT_VERSION_NAME = "主简历";

interface ResumeContextValue {
  resume: Resume;
  /** 是否已完成 localStorage 回填（回填前调用方应渲染骨架，避免空表单闪屏） */
  hydrated: boolean;
  setResume: (updater: Resume | ((prev: Resume) => Resume)) => void;
  reset: () => void;
  // ===== 多版本能力 =====
  versions: ResumeVersion[];
  activeId: string;
  /** 切换当前编辑的版本 */
  setActiveVersion: (id: string) => void;
  /** 新建版本（从当前版本复制；返回新版本 id） */
  duplicateVersion: (name?: string) => string;
  /** 新建空白版本（返回新版本 id） */
  addVersion: (name?: string) => string;
  renameVersion: (id: string, name: string) => void;
  /** 删除版本（至少保留 1 个） */
  deleteVersion: (id: string) => void;
  /** 云同步合并版本：按 id + updatedAt 取新（resume 已由调用方解密） */
  mergeResumeVersions: (versions: ResumeVersion[]) => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);
const STORAGE_KEY = "job-helper:resume";
// v3 时代的头像独立 key：v4 迁移后并入 resume.avatar，此 key 仅用于读旧数据
const STORAGE_KEY_AVATAR_LEGACY = "job-helper:avatar";
const AVATAR_MAX_LEN = 300000; // ~300KB，远超头像显示所需，同时把单次写盘开销压到可接受范围
/**
 * 存储结构版本：1 = { version, data } 包装 + 5 板块（basics/education/work/projects/skills）；
 * 2 = 扩展 12 板块（新增 advantages/languages/internships/activities/awards/portfolio + visibility）；
 * 3 = 20 套新版模板 + avatar 头像（旧 6 个模板 id 自动映射到新模板）；
 * 4 = 多简历版本（versions[] + activeId）。
 * 旧裸 Resume 对象自动迁移。迁移红线：已有字段原样保留，不丢。
 */
const STORAGE_VERSION = 4;

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
  // 头像上限 ~300KB（P1 修复：降低单次写盘体积）
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

function sanitizeVersion(s: unknown): ResumeVersion | null {
  if (!s || typeof s !== "object") return null;
  const d = s as Partial<ResumeVersion>;
  const resume = sanitizeResume(d.resume);
  return {
    id: String(d.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name: String(d.name ?? "").trim().slice(0, 30) || DEFAULT_VERSION_NAME,
    updatedAt: typeof d.updatedAt === "number" && Number.isFinite(d.updatedAt) ? d.updatedAt : Date.now(),
    resume,
  };
}

/** 兼容旧格式（裸 Resume / v1-v3 {version,data}）→ 多版本结构；损坏返回默认单版本 */
function loadStore(raw: string | null): ResumeStoreData {
  const emptyVersion = (): ResumeVersion => ({
    id: DEFAULT_VERSION_ID,
    name: DEFAULT_VERSION_NAME,
    updatedAt: Date.now(),
    resume: createEmptyResume(),
  });
  if (!raw) return { versions: [emptyVersion()], activeId: DEFAULT_VERSION_ID };
  try {
    const parsed = JSON.parse(raw) as unknown;
    // v4：多版本结构
    if (parsed && isObj(parsed) && (parsed as { version?: unknown }).version === 4) {
      const data = (parsed as { data?: unknown }).data;
      if (data && isObj(data)) {
        const d = data as Partial<ResumeStoreData>;
        const versions = Array.isArray(d.versions)
          ? d.versions.map(sanitizeVersion).filter((v): v is ResumeVersion => v !== null)
          : [];
        if (versions.length === 0) return { versions: [emptyVersion()], activeId: DEFAULT_VERSION_ID };
        const first = versions[0];
        if (!first) return { versions: [emptyVersion()], activeId: DEFAULT_VERSION_ID };
        const activeId = versions.some((v) => v.id === d.activeId)
          ? (d.activeId as string)
          : first.id;
        return { versions, activeId };
      }
    }
    // v1-v3 或裸 Resume：包成单版本「主简历」
    const base =
      parsed && isObj(parsed) && "version" in parsed
        ? migrateAdvantages(sanitizeResume((parsed as { data: unknown }).data))
        : migrateAdvantages(sanitizeResume(parsed));
    // v3 头像独立 key：并入主版本（多版本后不再用独立 key）
    let withAvatar = base;
    try {
      const av = window.localStorage.getItem(STORAGE_KEY_AVATAR_LEGACY);
      if (av && av.length <= AVATAR_MAX_LEN && !withAvatar.avatar) {
        withAvatar = { ...base, avatar: av };
      }
      window.localStorage.removeItem(STORAGE_KEY_AVATAR_LEGACY);
    } catch {
      /* 读头像失败不影响主数据 */
    }
    return {
      versions: [{ id: DEFAULT_VERSION_ID, name: DEFAULT_VERSION_NAME, updatedAt: Date.now(), resume: withAvatar }],
      activeId: DEFAULT_VERSION_ID,
    };
  } catch {
    return { versions: [emptyVersion()], activeId: DEFAULT_VERSION_ID };
  }
}

// ===== 外部 store：localStorage 持久化 + 订阅，供 useSyncExternalStore 使用 =====
// 设计说明：resume 状态由用户交互更新，本地恢复发生在客户端首次读取快照时
// （hydration 用 server snapshot 兜底，避免 SSR/CSR mismatch）。
type Listener = () => void;
const resumeListeners = new Set<Listener>();
let storeCache: ResumeStoreData | null = null;
let resumeHydrated = false;

// 持久化防抖（P1 修复核心）：UI 同步更新，但落盘延迟 300ms 并合并连续按键，避免每次按键阻塞主线程。
const PERSIST_DEBOUNCE_MS = 300;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function getStoreSnapshot(): ResumeStoreData {
  if (!resumeHydrated) {
    resumeHydrated = true;
    try {
      storeCache = loadStore(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      storeCache = { versions: [], activeId: DEFAULT_VERSION_ID };
    }
  }
  return storeCache ?? { versions: [], activeId: DEFAULT_VERSION_ID };
}

function getStoreServerSnapshot(): ResumeStoreData {
  return { versions: [], activeId: DEFAULT_VERSION_ID };
}

function subscribeResume(listener: Listener) {
  resumeListeners.add(listener);
  return () => resumeListeners.delete(listener);
}

function persistNow() {
  const next = storeCache;
  if (!next) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data: next }));
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

function commitStore(next: ResumeStoreData) {
  storeCache = next; // 同步更新缓存 → 订阅组件立即重渲染，输入不卡
  resumeHydrated = true;
  resumeListeners.forEach((l) => l()); // 同步通知订阅
  schedulePersist(); // 异步(防抖)落盘，仅此步延后
}

export function ResumeProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(
    useCallback((l: Listener) => subscribeResume(l), []),
    getStoreSnapshot,
    getStoreServerSnapshot
  );
  const hydrated = useSyncExternalStore(
    useCallback((l: Listener) => subscribeResume(l), []),
    () => resumeHydrated,
    () => false
  );

  const activeVersion = store.versions.find((v) => v.id === store.activeId) ?? store.versions[0];
  const resume: Resume = activeVersion?.resume ?? createEmptyResume();

  const setResume: ResumeContextValue["setResume"] = (updater) => {
    const cur = getStoreSnapshot();
    const target = cur.versions.find((v) => v.id === cur.activeId) ?? cur.versions[0];
    if (!target) return;
    const nextResume = typeof updater === "function" ? updater(target.resume) : updater;
    commitStore({
      ...cur,
      versions: cur.versions.map((v) =>
        v.id === target.id ? { ...v, resume: nextResume, updatedAt: Date.now() } : v
      ),
    });
  };

  const reset = () => {
    const cur = getStoreSnapshot();
    commitStore({
      ...cur,
      versions: cur.versions.map((v) =>
        v.id === cur.activeId ? { ...v, resume: createEmptyResume(), updatedAt: Date.now() } : v
      ),
    });
  };

  const setActiveVersion = (id: string) => {
    const cur = getStoreSnapshot();
    if (cur.versions.some((v) => v.id === id)) commitStore({ ...cur, activeId: id });
  };

  const duplicateVersion = (name?: string): string => {
    const cur = getStoreSnapshot();
    const src = cur.versions.find((v) => v.id === cur.activeId) ?? cur.versions[0];
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const v: ResumeVersion = {
      id,
      name: (name ?? "").trim().slice(0, 30) || `${src?.name ?? DEFAULT_VERSION_NAME}（副本）`,
      updatedAt: Date.now(),
      resume: src ? { ...src.resume, avatar: src.resume.avatar ?? "" } : createEmptyResume(),
    };
    commitStore({ versions: [v, ...cur.versions], activeId: id });
    return id;
  };

  const addVersion = (name?: string): string => {
    const cur = getStoreSnapshot();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const v: ResumeVersion = {
      id,
      name: (name ?? "").trim().slice(0, 30) || `简历 ${cur.versions.length + 1}`,
      updatedAt: Date.now(),
      resume: createEmptyResume(),
    };
    commitStore({ versions: [v, ...cur.versions], activeId: id });
    return id;
  };

  const renameVersion = (id: string, name: string) => {
    const cur = getStoreSnapshot();
    const clean = name.trim().slice(0, 30);
    if (!clean) return;
    commitStore({
      ...cur,
      versions: cur.versions.map((v) => (v.id === id ? { ...v, name: clean } : v)),
    });
  };

  const deleteVersion = (id: string) => {
    const cur = getStoreSnapshot();
    if (cur.versions.length <= 1) return; // 至少保留 1 份
    const rest = cur.versions.filter((v) => v.id !== id);
    if (rest.length === 0) return;
    const first = rest[0];
    if (!first) return;
    const activeId = cur.activeId === id ? first.id : cur.activeId;
    commitStore({ versions: rest, activeId });
  };

  const mergeResumeVersions = (versions: ResumeVersion[]) => {
    const cur = getStoreSnapshot();
    const map = new Map<string, ResumeVersion>();
    for (const v of [...cur.versions, ...(Array.isArray(versions) ? versions : [])]) {
      const clean = sanitizeVersion(v);
      if (!clean) continue;
      const prev = map.get(clean.id);
      if (!prev || (clean.updatedAt ?? 0) >= (prev.updatedAt ?? 0)) map.set(clean.id, clean);
    }
    const merged = Array.from(map.values());
    if (merged.length === 0) return;
    // activeId：本地当前版本「有内容且不旧于云端最新有内容版本」→ 保持；
    // 否则切到「最新且有内容」的版本（恢复场景：直接落到云端真实简历，而非空默认版本）
    const hasContent = (v: ResumeVersion) =>
      !!(v.resume.basics?.name?.trim() || v.resume.basics?.title?.trim());
    const latestWithContent = merged
      .filter(hasContent)
      .reduce<ResumeVersion | undefined>((a, b) =>
        !a || (b.updatedAt ?? 0) > (a.updatedAt ?? 0) ? b : a
      , undefined);
    const curActive = merged.find((v) => v.id === cur.activeId);
    const activeId =
      curActive &&
      hasContent(curActive) &&
      (curActive.updatedAt ?? 0) >= (latestWithContent?.updatedAt ?? 0)
        ? curActive.id
        : (latestWithContent?.id ?? merged[0]?.id ?? DEFAULT_VERSION_ID);
    commitStore({ versions: merged, activeId });
    persistNow(); // 恢复场景立即落盘，避免防抖窗口内跳转页面读到旧数据
  };

  return (
    <ResumeContext.Provider
      value={{
        resume,
        hydrated,
        setResume,
        reset,
        versions: store.versions,
        activeId: store.activeId,
        setActiveVersion,
        duplicateVersion,
        addVersion,
        renameVersion,
        deleteVersion,
        mergeResumeVersions,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error("useResume 必须在 ResumeProvider 内使用");
  return ctx;
}
