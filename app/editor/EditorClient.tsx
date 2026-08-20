"use client";

import { useRef, useState } from "react";
import { useResume } from "@/lib/resume-store";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import ImportDialog from "@/components/ImportDialog";
import { TEMPLATE_META, type TemplateMeta } from "@/components/resume/template-meta";
import type { ParsedResumeInput } from "@/lib/resume-import";
import Link from "next/link";
import type {
  BasicInfo,
  EducationItem,
  WorkItem,
  InternshipItem,
  ProjectItem,
  SkillGroup,
  ActivityItem,
  AwardItem,
  LanguageItem,
  PortfolioItem,
  Resume,
  SectionKey,
} from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const toLines = (arr: string[]) => arr.join("\n");
const fromLines = (text: string) =>
  text.split("\n").map((s) => s.trim()).filter(Boolean);

/** 模板缩略预览（按元数据 accent/layout 配置驱动） */
function TemplateThumb({ meta }: { meta: TemplateMeta }) {
  const base = "h-16 w-full overflow-hidden rounded-md border border-neutral-200 bg-white";
  const line = (w: string, i: number) => (
    <div key={i} className="h-1 rounded" style={{ width: w, background: "var(--jh-neutral-200)" }} />
  );
  switch (meta.layout) {
    case "timeline":
      return (
        <div className={`${base} flex`}>
          <div className="w-1" style={{ background: meta.accent }} />
          <div className="flex-1 p-1.5">
            <div className="flex">
              <div className="h-2.5 w-1/3" style={{ background: meta.accent }} />
              <div className="h-2.5 flex-1 bg-neutral-200" />
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              <div className="size-2 rounded-full" style={{ background: meta.accent }} />
              <div className="h-1.5 w-1/2 rounded bg-neutral-300" />
            </div>
            {line("w-3/4", 1)}
            {line("w-2/3", 2)}
          </div>
        </div>
      );
    case "split":
      return (
        <div className={`${base} flex`}>
          <div className="w-1/3" style={{ background: meta.accent, opacity: 0.9 }} />
          <div className="flex-1 space-y-1 p-1.5">
            {line("w-1/2", 0)}
            {line("w-3/4", 1)}
            {line("w-2/3", 2)}
          </div>
        </div>
      );
    case "banner":
      return (
        <div className={base}>
          <div className="h-5 w-full" style={{ background: meta.accent }} />
          <div className="space-y-1 p-1.5">
            {line("w-1/2", 0)}
            {line("w-3/4", 1)}
          </div>
        </div>
      );
    case "magazine":
      return (
        <div className={`${base} flex flex-col items-center justify-center`}>
          <div className="h-2.5 w-1/2 rounded" style={{ background: meta.accent }} />
          <div className="my-1 h-px w-8 bg-neutral-400" />
          {line("w-2/3", 0)}
        </div>
      );
    default:
      return (
        <div className={base}>
          <div className="h-1.5 w-full" style={{ background: meta.accent }} />
          <div className="space-y-1 p-1.5">
            {line("w-1/2", 0)}
            {line("w-3/4", 1)}
            {line("w-2/3", 2)}
          </div>
        </div>
      );
  }
}

/** 填写完成度 */
function computeProgress(r: Resume) {
  const checks: [string, boolean][] = [
    ["姓名", !!r.basics.name.trim()],
    ["求职意向", !!r.basics.title.trim()],
    ["联系方式", !!(r.basics.email.trim() || r.basics.phone.trim())],
    ["个人简介", !!r.basics.summary.trim()],
    ["教育经历", r.education.some((e) => e.school.trim())],
    ["工作/项目", r.work.some((w) => w.company.trim()) || r.projects.some((p) => p.name.trim())],
    ["技能", r.skills.some((s) => s.items.length > 0 || s.category.trim())],
  ];
  const done = checks.filter((c) => c[1]).length;
  const total = checks.length;
  const missing = checks.filter((c) => !c[1]).map((c) => c[0]);
  return { percent: Math.round((done / total) * 100), missing, done, total };
}

/** 引导提示条 */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-lg bg-primary-50 px-3 py-2 text-xs leading-relaxed text-neutral-600 dark:bg-primary-950/40 dark:text-neutral-300">
      {children}
    </div>
  );
}

/** 多简历版本管理条：切换 / 新建 / 复制 / 重命名 / 删除（不同岗位方向各一份） */
function VersionBar() {
  const {
    versions,
    activeId,
    setActiveVersion,
    duplicateVersion,
    addVersion,
    renameVersion,
    deleteVersion,
  } = useResume();
  return (
    <Card className="print:hidden">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          简历版本（{versions.length}）
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const n = window.prompt("新版本名称（留空自动命名）");
              if (n !== null) addVersion(n || undefined);
            }}
          >
            ＋ 新建空白
          </Button>
          <Button size="sm" variant="secondary" onClick={() => duplicateVersion()}>
            复制当前
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {versions.map((v) => (
          <div
            key={v.id}
            className={`group flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              v.id === activeId
                ? "border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950 dark:text-primary-300"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            <button type="button" onClick={() => setActiveVersion(v.id)} className="font-medium">
              {v.name}
            </button>
            <button
              type="button"
              title="重命名"
              aria-label={`重命名版本「${v.name}」`}
              onClick={() => {
                const n = window.prompt("重命名版本", v.name);
                if (n && n.trim()) renameVersion(v.id, n);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            >
              ✎
            </button>
            {versions.length > 1 && (
              <button
                type="button"
                title="删除版本"
                aria-label={`删除版本「${v.name}」`}
                onClick={() => {
                  if (window.confirm(`删除版本「${v.name}」？此操作不可恢复。`)) deleteVersion(v.id);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded text-neutral-400 opacity-100 transition-opacity hover:bg-neutral-100 hover:text-danger-500 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-neutral-800"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
        不同岗位方向各建一份版本（如「前端-秋招」「国企-综合岗」），投递追踪里可记录这次投递用了哪份简历。
      </p>
    </Card>
  );
}

/** 空区块引导 */
function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-neutral-400 dark:text-neutral-500">{text}</p>;
}

/** 板块 Card：标题 + 显示/隐藏开关，隐藏时内容替换为提示 */
function SectionCard({
  title,
  section,
  isVisible,
  onToggle,
  children,
}: {
  title: string;
  section: SectionKey;
  isVisible: boolean;
  onToggle: (s: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-medium text-neutral-800 dark:text-neutral-100">{title}</h3>
        <button
          type="button"
          onClick={() => onToggle(section)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
            isVisible
              ? "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300"
              : "border-neutral-200 text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${isVisible ? "bg-primary-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
          />
          {isVisible ? "显示中" : "已隐藏"}
        </button>
      </div>
      {isVisible ? (
        children
      ) : (
        <EmptyHint text={`「${title}」已隐藏，导出/预览时不会显示；点击右上角按钮可恢复。`} />
      )}
    </Card>
  );
}

/** 分组折叠容器 */
function GroupCard({
  title,
  hint,
  defaultOpen = true,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        <span>{title}</span>
        <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
          {open ? "▾ 收起" : "▸ 展开"}
        </span>
      </button>
      {open && (
        <div className="mt-4 space-y-6">
          {hint && <p className="text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

export default function EditorClient() {
  const { resume, hydrated, setResume, reset } = useResume();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const progress = computeProgress(resume);

  /** 头像上传：canvas 压缩到 ~200px 宽转 JPEG dataURL（控制 localStorage 体积） */
  const handleAvatarFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = 200;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setResume((p) => ({ ...p, avatar: dataUrl }));
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const patchBasics = (patch: Partial<BasicInfo>) =>
    setResume((p) => ({ ...p, basics: { ...p.basics, ...patch } }));

  const addEducation = () =>
    setResume((p) => ({
      ...p,
      education: [
        ...p.education,
        { id: uid(), school: "", degree: "", major: "", startDate: "", endDate: "", description: "" },
      ],
    }));
  const updateEducation = (id: string, patch: Partial<EducationItem>) =>
    setResume((p) => ({
      ...p,
      education: p.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  const removeEducation = (id: string) =>
    setResume((p) => ({ ...p, education: p.education.filter((e) => e.id !== id) }));

  const addWork = () =>
    setResume((p) => ({
      ...p,
      work: [...p.work, { id: uid(), company: "", role: "", startDate: "", endDate: "", bullets: [] }],
    }));
  const updateWork = (id: string, patch: Partial<WorkItem>) =>
    setResume((p) => ({ ...p, work: p.work.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  const removeWork = (id: string) =>
    setResume((p) => ({ ...p, work: p.work.filter((w) => w.id !== id) }));

  const addProject = () =>
    setResume((p) => ({
      ...p,
      projects: [
        ...p.projects,
        { id: uid(), name: "", role: "", link: "", startDate: "", endDate: "", bullets: [] },
      ],
    }));
  const updateProject = (id: string, patch: Partial<ProjectItem>) =>
    setResume((p) => ({
      ...p,
      projects: p.projects.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  const removeProject = (id: string) =>
    setResume((p) => ({ ...p, projects: p.projects.filter((x) => x.id !== id) }));

  const addSkill = () =>
    setResume((p) => ({ ...p, skills: [...p.skills, { id: uid(), category: "", items: [] }] }));
  const updateSkill = (id: string, patch: Partial<SkillGroup>) =>
    setResume((p) => ({
      ...p,
      skills: p.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  const removeSkill = (id: string) =>
    setResume((p) => ({ ...p, skills: p.skills.filter((s) => s.id !== id) }));

  // ---- 新增板块：个人优势 / 实习经历 / 校园经历 / 荣誉奖项 / 语言能力 / 作品集 ----
  const setAdvantages = (lines: string) =>
    setResume((p) => ({ ...p, advantages: fromLines(lines) }));

  const addInternship = () =>
    setResume((p) => ({
      ...p,
      internships: [
        ...p.internships,
        { id: uid(), company: "", role: "", startDate: "", endDate: "", bullets: [] },
      ],
    }));
  const updateInternship = (id: string, patch: Partial<InternshipItem>) =>
    setResume((p) => ({
      ...p,
      internships: p.internships.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  const removeInternship = (id: string) =>
    setResume((p) => ({ ...p, internships: p.internships.filter((w) => w.id !== id) }));

  const addActivity = () =>
    setResume((p) => ({
      ...p,
      activities: [...p.activities, { id: uid(), org: "", role: "", startDate: "", endDate: "", description: "" }],
    }));
  const updateActivity = (id: string, patch: Partial<ActivityItem>) =>
    setResume((p) => ({
      ...p,
      activities: p.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  const removeActivity = (id: string) =>
    setResume((p) => ({ ...p, activities: p.activities.filter((a) => a.id !== id) }));

  const addAward = () =>
    setResume((p) => ({
      ...p,
      awards: [...p.awards, { id: uid(), name: "", date: "", description: "" }],
    }));
  const updateAward = (id: string, patch: Partial<AwardItem>) =>
    setResume((p) => ({
      ...p,
      awards: p.awards.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  const removeAward = (id: string) =>
    setResume((p) => ({ ...p, awards: p.awards.filter((a) => a.id !== id) }));

  const addLanguage = () =>
    setResume((p) => ({
      ...p,
      languages: [...p.languages, { id: uid(), language: "", level: "" }],
    }));
  const updateLanguage = (id: string, patch: Partial<LanguageItem>) =>
    setResume((p) => ({
      ...p,
      languages: p.languages.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  const removeLanguage = (id: string) =>
    setResume((p) => ({ ...p, languages: p.languages.filter((l) => l.id !== id) }));

  const addPortfolio = () =>
    setResume((p) => ({
      ...p,
      portfolio: [...p.portfolio, { id: uid(), name: "", link: "", description: "" }],
    }));
  const updatePortfolio = (id: string, patch: Partial<PortfolioItem>) =>
    setResume((p) => ({
      ...p,
      portfolio: p.portfolio.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  const removePortfolio = (id: string) =>
    setResume((p) => ({ ...p, portfolio: p.portfolio.filter((x) => x.id !== id) }));

  /** 板块显示/隐藏开关 */
  const toggleSection = (key: SectionKey) =>
    setResume((p) => ({
      ...p,
      visibility: { ...p.visibility, [key]: p.visibility[key] === false ? true : false },
    }));

  /** 导入结果合并：非空字段覆盖，空板块保留已有内容（数组补 id） */
  const applyImport = (parsed: ParsedResumeInput) => {
    setResume((p) => {
      const b = parsed.basics ?? {};
      const nextBasics = { ...p.basics };
      for (const k of Object.keys(b) as (keyof BasicInfo)[]) {
        const v = b[k];
        if (v !== undefined && String(v).trim() !== "") nextBasics[k] = v as never;
      }
      const withIds = <T,>(next?: T[]): (T & { id: string })[] | undefined =>
        next && next.length > 0 ? next.map((it) => ({ ...it, id: uid() })) : undefined;
      const adv = parsed.advantages?.length ? parsed.advantages : undefined;

      return {
        ...p,
        basics: nextBasics,
        advantages: adv ?? p.advantages,
        education: withIds(parsed.education) ?? p.education,
        languages: withIds(parsed.languages) ?? p.languages,
        internships: withIds(parsed.internships) ?? p.internships,
        work: withIds(parsed.work) ?? p.work,
        projects: withIds(parsed.projects) ?? p.projects,
        activities: withIds(parsed.activities) ?? p.activities,
        skills: withIds(parsed.skills) ?? p.skills,
        awards: withIds(parsed.awards) ?? p.awards,
        portfolio: withIds(parsed.portfolio) ?? p.portfolio,
      };
    });
  };

  const handleReset = () => {
    setResetConfirmOpen(true);
  };

  const confirmReset = () => {
    reset();
    setResetConfirmOpen(false);
  };

  // 本地数据回填前渲染骨架，避免空表单一闪而过后才填充（hydration 闪白）
  if (!hydrated) {
    return (
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-9 w-48 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-72 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-40 rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">简历编辑器</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">填写内容，自动保存到本地浏览器</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden md:flex-nowrap">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            导入简历
          </Button>
          <Link
            href="/preview"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            预览 / 导出
          </Link>
          <Button variant="ghost" onClick={handleReset}>
            清空重填
          </Button>
        </div>
      </header>

      {/* 多简历版本管理 */}
      <VersionBar />

      {/* 完成度进度 */}
      <Card className="print:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            简历完成度
          </span>
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {progress.percent}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-primary-600 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
          {progress.missing.length === 0
            ? "各部分已填写，可直接预览导出 🎉"
            : `还差：${progress.missing.join("、")}（共 ${progress.done}/${progress.total} 项已填）`}
        </p>
      </Card>

      {/* 模板样式选择 */}
      <Card title="模板样式" className="mt-6 print:hidden">
        <p className="mb-3 text-xs text-neutral-400 dark:text-neutral-500">
          选择一套版式，内容填写不受模板影响，可随时切换。
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMPLATE_META.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setResume((p) => ({ ...p, template: t.id }))}
              className={`flex flex-col rounded-xl border p-2 text-left transition-colors ${
                resume.template === t.id
                  ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200 dark:bg-primary-950/40"
                  : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              }`}
            >
              <TemplateThumb meta={t} />
              <span className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
                {t.label}
              </span>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">{t.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        {/* ① 基础信息 */}
        <GroupCard title="① 基础信息" hint="姓名、联系方式与个人优势是简历的门面，务必准确。">
          <Card title="基本信息">
            <Tip>
              💡 求职意向写<strong>具体岗位名</strong>（如「前端开发工程师」），比「工程师」更精准；
              个人简介用 2–3 句话概括你的核心优势与求职方向。
            </Tip>
            {/* 头像上传 */}
            <div className="mb-4 flex items-center gap-4 rounded-xl border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
              {resume.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- 本地 dataURL 头像预览
                <img
                  src={resume.avatar}
                  alt="头像预览"
                  className="h-20 w-16 rounded-md border border-neutral-200 object-cover dark:border-neutral-700"
                />
              ) : (
                <div className="flex h-20 w-16 items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-[10px] leading-tight text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800">
                  头像
                  <br />
                  （1-2 寸照）
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  上传证件照会显示在简历模板的头像框里（建议 1-2 寸清晰正装照）。
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                  />
                  <Button variant="secondary" onClick={() => avatarInputRef.current?.click()}>
                    {resume.avatar ? "更换照片" : "上传照片"}
                  </Button>
                  {resume.avatar && (
                    <Button variant="ghost" onClick={() => setResume((p) => ({ ...p, avatar: "" }))}>
                      移除
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="姓名" placeholder="张三" value={resume.basics.name} onChange={(v) => patchBasics({ name: v })} />
              <Field label="求职意向" placeholder="前端开发工程师" value={resume.basics.title} onChange={(v) => patchBasics({ title: v })} />
              <Field label="邮箱" placeholder="name@example.com" value={resume.basics.email} onChange={(v) => patchBasics({ email: v })} />
              <Field label="电话" placeholder="138-0000-0000" value={resume.basics.phone} onChange={(v) => patchBasics({ phone: v })} />
              <Field label="所在地" placeholder="上海" value={resume.basics.location} onChange={(v) => patchBasics({ location: v })} />
              <Field label="个人网站" placeholder="github.com/yourname" value={resume.basics.website} onChange={(v) => patchBasics({ website: v })} />
              <Field label="出生年月（可选）" placeholder="2004.02" value={resume.basics.birth ?? ""} onChange={(v) => patchBasics({ birth: v })} />
              <Field label="性别（可选）" placeholder="男 / 女" value={resume.basics.sex ?? ""} onChange={(v) => patchBasics({ sex: v })} />
            </div>
            <div className="mt-4">
              <Field
                label="个人简介"
                placeholder="用 2–3 句话概括你的核心优势、专长与求职方向"
                textarea
                value={resume.basics.summary}
                onChange={(v) => patchBasics({ summary: v })}
              />
            </div>
          </Card>

          <SectionCard
            title="个人优势"
            section="advantages"
            isVisible={resume.visibility.advantages !== false}
            onToggle={toggleSection}
          >
            <Tip>
              💡 <strong>每行一条</strong>优势，用「标签：一句话说明」的结构（如：专业背景：学习数据结构、
              算法、机器学习等课程，曾参加数学建模竞赛），模板中会渲染为独立章节。
            </Tip>
            <Field
              label="个人优势（每行一条，会渲染为独立章节）"
              placeholder={"专业背景：学习数据结构、算法、机器学习等课程，具备扎实的数学与编程基础\n综合素质：具备较强的实践能力和抗压能力，做事认真仔细，执行力强\n团队协作：具有良好的人际交往能力，能够与团队成员高效协作"}
              textarea
              value={toLines(resume.advantages)}
              onChange={setAdvantages}
            />
            {resume.advantages.length === 0 && (
              <div className="mt-2">
                <EmptyHint text="填 3 条左右即可：专业背景 / 综合素质 / 团队协作 是校招简历最常见的组合。" />
              </div>
            )}
          </SectionCard>
        </GroupCard>

        {/* ② 教育培养 */}
        <GroupCard title="② 教育培养" hint="应届生教育背景优先；语言能力有证书/水平就填。">
          <Card title="教育经历">
            <Tip>
              💡 按<strong>时间倒序</strong>填写；GPA、专业排名、核心课程、荣誉奖项都可写进「描述」。
            </Tip>
            <div className="space-y-4">
              {resume.education.length === 0 && (
                <EmptyHint text="还没有教育经历，点击下方按钮添加；应届生请填写在读院校。" />
              )}
              {resume.education.map((e) => (
                <div key={e.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="学校" placeholder="某某大学" value={e.school} onChange={(v) => updateEducation(e.id, { school: v })} />
                    <Field label="学历" placeholder="本科 / 硕士" value={e.degree} onChange={(v) => updateEducation(e.id, { degree: v })} />
                    <Field label="专业" placeholder="计算机科学与技术" value={e.major} onChange={(v) => updateEducation(e.id, { major: v })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="开始" placeholder="2022.09" value={e.startDate} onChange={(v) => updateEducation(e.id, { startDate: v })} />
                      <Field label="结束" placeholder="2026.06" value={e.endDate} onChange={(v) => updateEducation(e.id, { endDate: v })} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Field
                      label="描述（可选）"
                      placeholder="如：GPA 3.8/4.0，专业前 5%；曾获国家奖学金"
                      textarea
                      value={e.description}
                      onChange={(v) => updateEducation(e.id, { description: v })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEducation(e.id)}
                    className="mt-2 text-sm text-danger-600 hover:underline dark:text-danger-400"
                  >
                    删除
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addEducation}>
                + 添加教育经历
              </Button>
            </div>
          </Card>

          <SectionCard
            title="语言能力"
            section="languages"
            isVisible={resume.visibility.languages !== false}
            onToggle={toggleSection}
          >
            <Tip>💡 双语或多语人才加分；英语建议写具体水平（CET-4 / CET-6 / 流利听说读写）。</Tip>
            <div className="space-y-4">
              {resume.languages.length === 0 && <EmptyHint text="还没有语言能力，点击下方按钮添加。" />}
              {resume.languages.map((l) => (
                <div key={l.id} className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <Field label="语言" placeholder="英语" value={l.language} onChange={(v) => updateLanguage(l.id, { language: v })} />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Field label="水平" placeholder="CET-6 / 流利 / N3" value={l.level} onChange={(v) => updateLanguage(l.id, { level: v })} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLanguage(l.id)}
                      className="mb-1 text-sm text-danger-600 hover:underline dark:text-danger-400"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={addLanguage}>
                + 添加语言
              </Button>
            </div>
          </SectionCard>
        </GroupCard>

        {/* ③ 经历 */}
        <GroupCard title="③ 经历" hint="实习与工作分开填写；经历类用 STAR 句式 + 量化成果最有说服力。">
          <SectionCard
            title="实习经历"
            section="internships"
            isVisible={resume.visibility.internships !== false}
            onToggle={toggleSection}
          >
            <Tip>
              💡 校招简历中实习经历是<strong>重点考察项</strong>；用 STAR 句式（情境-任务-行动-结果），
              每条突出量化成果。
            </Tip>
            <div className="space-y-4">
              {resume.internships.length === 0 && <EmptyHint text="还没有实习经历，点击下方按钮添加；没有实习可留空或直接写项目经历。" />}
              {resume.internships.map((w) => (
                <div key={w.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="公司" placeholder="某某科技有限公司" value={w.company} onChange={(v) => updateInternship(w.id, { company: v })} />
                    <Field label="职位" placeholder="数据分析实习生" value={w.role} onChange={(v) => updateInternship(w.id, { role: v })} />
                    <Field label="开始" placeholder="2025.07" value={w.startDate} onChange={(v) => updateInternship(w.id, { startDate: v })} />
                    <Field label="结束" placeholder="2025.09" value={w.endDate} onChange={(v) => updateInternship(w.id, { endDate: v })} />
                  </div>
                  <div className="mt-3">
                    <Field
                      label="实习描述（每行一条，建议用 STAR 句式）"
                      placeholder={"例：负责电商客服数据清洗与分析，通过 SQL 提取 10w+ 订单数据，输出转化率周报"}
                      textarea
                      value={toLines(w.bullets)}
                      onChange={(v) => updateInternship(w.id, { bullets: fromLines(v) })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeInternship(w.id)}
                    className="mt-2 text-sm text-danger-600 hover:underline dark:text-danger-400"
                  >
                    删除
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addInternship}>
                + 添加实习经历
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="工作经历"
            section="work"
            isVisible={resume.visibility.work !== false}
            onToggle={toggleSection}
          >
            <Tip>
              💡 用 <strong>STAR 句式</strong>（情境-任务-行动-结果），每条突出<strong>量化成果</strong>，
              如「主导 X 项目，通过 Y 方案，使 Z 指标提升 30%」。
            </Tip>
            <div className="space-y-4">
              {resume.work.length === 0 && (
                <EmptyHint text="暂无工作经历？可填写实习，或直接在下方添加「项目经历」。" />
              )}
              {resume.work.map((w) => (
                <div key={w.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="公司" placeholder="某某科技有限公司" value={w.company} onChange={(v) => updateWork(w.id, { company: v })} />
                    <Field label="职位" placeholder="前端开发工程师" value={w.role} onChange={(v) => updateWork(w.id, { role: v })} />
                    <Field label="开始" placeholder="2024.07" value={w.startDate} onChange={(v) => updateWork(w.id, { startDate: v })} />
                    <Field label="结束" placeholder="2025.08" value={w.endDate} onChange={(v) => updateWork(w.id, { endDate: v })} />
                  </div>
                  <div className="mt-3">
                    <Field
                      label="工作描述（每行一条，建议用 STAR 句式）"
                      placeholder={"例：负责 XX 模块，通过 XX 优化，使页面加载时间降低 40%"}
                      textarea
                      value={toLines(w.bullets)}
                      onChange={(v) => updateWork(w.id, { bullets: fromLines(v) })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeWork(w.id)}
                    className="mt-2 text-sm text-danger-600 hover:underline dark:text-danger-400"
                  >
                    删除
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addWork}>
                + 添加工作经历
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="项目经历"
            section="projects"
            isVisible={resume.visibility.projects !== false}
            onToggle={toggleSection}
          >
            <Tip>
              💡 写清你担任的<strong>角色</strong>、使用的<strong>关键技术</strong>，以及最终<strong>产出/影响</strong>；
              有链接（仓库 / 演示）一定填上，更有说服力。
            </Tip>
            <div className="space-y-4">
              {resume.projects.length === 0 && (
                <EmptyHint text="还没有项目经历，点击下方按钮添加（课程设计、竞赛、开源贡献都算）。" />
              )}
              {resume.projects.map((x) => (
                <div key={x.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="项目名称" placeholder="项目名称" value={x.name} onChange={(v) => updateProject(x.id, { name: v })} />
                    <Field label="角色" placeholder="负责人 / 核心开发" value={x.role} onChange={(v) => updateProject(x.id, { role: v })} />
                    <Field label="链接" placeholder="github.com/... 或 演示链接" value={x.link} onChange={(v) => updateProject(x.id, { link: v })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="开始" placeholder="2024.03" value={x.startDate} onChange={(v) => updateProject(x.id, { startDate: v })} />
                      <Field label="结束" placeholder="2024.06" value={x.endDate} onChange={(v) => updateProject(x.id, { endDate: v })} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Field
                      label="项目描述（每行一条）"
                      placeholder={"例：作为核心开发，使用 React+TS 搭建 XX 系统，服务 1w+ 用户"}
                      textarea
                      value={toLines(x.bullets)}
                      onChange={(v) => updateProject(x.id, { bullets: fromLines(v) })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProject(x.id)}
                    className="mt-2 text-sm text-danger-600 hover:underline dark:text-danger-400"
                  >
                    删除
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addProject}>
                + 添加项目经历
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="校园经历"
            section="activities"
            isVisible={resume.visibility.activities !== false}
            onToggle={toggleSection}
          >
            <Tip>
              💡 社团、学生会、志愿活动、赛事组织都算；写清<strong>角色</strong>与<strong>实际贡献</strong>，
              别只写「参加了」。
            </Tip>
            <div className="space-y-4">
              {resume.activities.length === 0 && <EmptyHint text="还没有校园经历，点击下方按钮添加（社团 / 学生会 / 志愿者）。" />}
              {resume.activities.map((a) => (
                <div key={a.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="组织" placeholder="求索社团 / 学生会" value={a.org} onChange={(v) => updateActivity(a.id, { org: v })} />
                    <Field label="角色" placeholder="成员 / 部长 / 队长" value={a.role} onChange={(v) => updateActivity(a.id, { role: v })} />
                    <Field label="开始" placeholder="2023.09" value={a.startDate} onChange={(v) => updateActivity(a.id, { startDate: v })} />
                    <Field label="结束" placeholder="2024.06" value={a.endDate} onChange={(v) => updateActivity(a.id, { endDate: v })} />
                  </div>
                  <div className="mt-3">
                    <Field
                      label="职责与贡献（可选）"
                      placeholder="如：参与活动执行与宣传工作，完成多场活动的全流程组织与复盘"
                      textarea
                      value={a.description}
                      onChange={(v) => updateActivity(a.id, { description: v })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeActivity(a.id)}
                    className="mt-2 text-sm text-danger-600 hover:underline dark:text-danger-400"
                  >
                    删除
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addActivity}>
                + 添加校园经历
              </Button>
            </div>
          </SectionCard>
        </GroupCard>

        {/* ④ 技能荣誉 */}
        <GroupCard title="④ 技能荣誉" hint="技能按熟练度分组；奖学金、竞赛奖项都值得写。">
          <SectionCard
            title="技能"
            section="skills"
            isVisible={resume.visibility.skills !== false}
            onToggle={toggleSection}
          >
            <Tip>
              💡 按<strong>熟练度分组</strong>（如 熟练掌握 / 了解），避免堆砌无关工具；
              语言、框架、工具分开写更清晰。
            </Tip>
            <div className="space-y-4">
              {resume.skills.length === 0 && (
                <EmptyHint text="还没有技能分组，点击下方按钮添加（如：前端 / 后端 / 语言）。" />
              )}
              {resume.skills.map((s) => (
                <div key={s.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <Field label="分类" placeholder="前端 / 后端 / 语言" value={s.category} onChange={(v) => updateSkill(s.id, { category: v })} />
                  <div className="mt-3">
                    <Field
                      label="技能（每行一个，如：React / TypeScript）"
                      placeholder={"React\nTypeScript\nNext.js"}
                      textarea
                      value={toLines(s.items)}
                      onChange={(v) => updateSkill(s.id, { items: fromLines(v) })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(s.id)}
                    className="mt-2 text-sm text-danger-600 hover:underline dark:text-danger-400"
                  >
                    删除
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addSkill}>
                + 添加技能分组
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="荣誉奖项"
            section="awards"
            isVisible={resume.visibility.awards !== false}
            onToggle={toggleSection}
          >
            <Tip>💡 奖学金、竞赛获奖、荣誉称号、职业证书都可以；有年份写上年份更有说服力。</Tip>
            <div className="space-y-4">
              {resume.awards.length === 0 && <EmptyHint text="还没有荣誉奖项，点击下方按钮添加（奖学金 / 竞赛 / 证书）。" />}
              {resume.awards.map((a) => (
                <div key={a.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="奖项 / 证书" placeholder="国家奖学金 / XX 竞赛二等奖" value={a.name} onChange={(v) => updateAward(a.id, { name: v })} />
                    <Field label="时间（可选）" placeholder="2024.09" value={a.date} onChange={(v) => updateAward(a.id, { date: v })} />
                  </div>
                  <div className="mt-3">
                    <Field
                      label="说明（可选）"
                      placeholder="如：颁发机构 / 获奖比例 / 相关说明"
                      value={a.description}
                      onChange={(v) => updateAward(a.id, { description: v })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAward(a.id)}
                    className="mt-2 text-sm text-danger-600 hover:underline dark:text-danger-400"
                  >
                    删除
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addAward}>
                + 添加荣誉奖项
              </Button>
            </div>
          </SectionCard>
        </GroupCard>

        {/* ⑤ 个人作品 */}
        <GroupCard title="⑤ 个人作品" hint="有作品集 / 个人站 / 开源项目的同学强烈建议填。">
          <SectionCard
            title="作品集"
            section="portfolio"
            isVisible={resume.visibility.portfolio !== false}
            onToggle={toggleSection}
          >
            <Tip>💡 放最拿得出手的 2–3 个作品；技术岗填 GitHub，设计/新媒体岗填作品链接或站酷/小红书主页。</Tip>
            <div className="space-y-4">
              {resume.portfolio.length === 0 && <EmptyHint text="还没有作品集，点击下方按钮添加（GitHub / 个人站 / 在线作品）。" />}
              {resume.portfolio.map((x) => (
                <div key={x.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="作品名称" placeholder="个人博客 / XX 项目" value={x.name} onChange={(v) => updatePortfolio(x.id, { name: v })} />
                    <Field label="链接" placeholder="https://..." value={x.link} onChange={(v) => updatePortfolio(x.id, { link: v })} />
                  </div>
                  <div className="mt-3">
                    <Field
                      label="说明（可选）"
                      placeholder="如：技术栈 / 亮点 / 数据"
                      value={x.description}
                      onChange={(v) => updatePortfolio(x.id, { description: v })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePortfolio(x.id)}
                    className="mt-2 text-sm text-danger-600 hover:underline dark:text-danger-400"
                  >
                    删除
                  </button>
                </div>
              ))}
              <Button variant="secondary" onClick={addPortfolio}>
                + 添加作品
              </Button>
            </div>
          </SectionCard>
        </GroupCard>

        <p className="text-xs text-neutral-400 text-center dark:text-neutral-500">
          内容自动保存在本地浏览器，不会上传服务器
        </p>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        title="清空当前简历内容？"
        description="清空后不可恢复，建议先到「预览 / 导出」备份当前 PDF 再操作。"
        danger
        okLabel="确认清空"
        onConfirm={confirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(parsed) => {
          applyImport(parsed);
          setImportOpen(false);
        }}
      />
    </main>
  );
}
