"use client";

import { useState } from "react";
import { useResume } from "@/lib/resume-store";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import Link from "next/link";
import type {
  BasicInfo,
  EducationItem,
  WorkItem,
  ProjectItem,
  SkillGroup,
  Resume,
  TemplateId,
} from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "classic", label: "经典", desc: "稳重通用，适合大多数岗位" },
  { id: "modern", label: "现代", desc: "蓝色点缀，干净专业" },
  { id: "compact", label: "紧凑", desc: "信息密度高，一页装更多" },
  { id: "sidebar", label: "侧边栏", desc: "分栏布局，突出技能与亮点" },
  { id: "elegant", label: "优雅", desc: "衬线字体，适合文化/设计类" },
  { id: "creative", label: "创意", desc: "色块头图，适合技术/创意岗" },
];

const toLines = (arr: string[]) => arr.join("\n");
const fromLines = (text: string) =>
  text.split("\n").map((s) => s.trim()).filter(Boolean);

/** 模板缩略预览 */
function TemplateThumb({ id }: { id: TemplateId }) {
  const base = "h-16 w-full overflow-hidden rounded-md border border-slate-200 bg-white";
  switch (id) {
    case "classic":
      return (
        <div className={`${base} p-2`}>
          <div className="h-3 w-1/2 rounded bg-slate-700" />
          <div className="mt-2 h-1.5 w-3/4 rounded bg-slate-300" />
          <div className="mt-1 h-1.5 w-2/3 rounded bg-slate-200" />
        </div>
      );
    case "modern":
      return (
        <div className={base}>
          <div className="h-1.5 w-full bg-blue-600" />
          <div className="p-2">
            <div className="h-2.5 w-1/2 rounded bg-blue-500" />
            <div className="mt-1.5 h-1.5 w-3/4 rounded bg-slate-200" />
          </div>
        </div>
      );
    case "compact":
      return (
        <div className={`${base} p-2`}>
          <div className="h-1.5 w-1/2 rounded bg-slate-600" />
          <div className="mt-1 h-1 w-3/4 rounded bg-slate-200" />
          <div className="mt-1 h-1 w-2/3 rounded bg-slate-200" />
        </div>
      );
    case "sidebar":
      return (
        <div className={`${base} flex`}>
          <div className="w-1/3 bg-slate-800" />
          <div className="flex-1 space-y-1 p-1.5">
            <div className="h-1.5 w-1/2 rounded bg-slate-400" />
            <div className="h-1 w-3/4 rounded bg-slate-200" />
            <div className="h-1 w-2/3 rounded bg-slate-200" />
          </div>
        </div>
      );
    case "elegant":
      return (
        <div className={`${base} flex flex-col items-center justify-center`}>
          <div className="h-2.5 w-1/2 rounded bg-slate-700" />
          <div className="my-1 h-px w-8 bg-slate-400" />
          <div className="h-1 w-2/3 rounded bg-slate-200" />
        </div>
      );
    case "creative":
      return (
        <div className={base}>
          <div className="h-5 w-full bg-gradient-to-r from-indigo-600 to-violet-600" />
          <div className="space-y-1 p-1.5">
            <div className="h-1.5 w-1/2 rounded bg-slate-300" />
            <div className="h-1 w-3/4 rounded bg-slate-200" />
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
    <div className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:bg-blue-950/40 dark:text-slate-300">
      {children}
    </div>
  );
}

/** 空区块引导 */
function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-slate-400 dark:text-slate-500">{text}</p>;
}

export default function EditorClient() {
  const { resume, hydrated, setResume, reset } = useResume();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const progress = computeProgress(resume);

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
          <div className="h-9 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-72 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">简历编辑器</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">填写内容，自动保存到本地浏览器</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link
            href="/preview"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            预览 / 导出
          </Link>
          <Button variant="ghost" onClick={handleReset}>
            清空重填
          </Button>
        </div>
      </header>

      {/* 完成度进度 */}
      <Card className="print:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            简历完成度
          </span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {progress.percent}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {progress.missing.length === 0
            ? "各部分已填写，可直接预览导出 🎉"
            : `还差：${progress.missing.join("、")}（共 ${progress.done}/${progress.total} 项已填）`}
        </p>
      </Card>

      {/* 模板样式选择 */}
      <Card title="模板样式" className="mt-6 print:hidden">
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          选择一套版式，内容填写不受模板影响，可随时切换。
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setResume((p) => ({ ...p, template: t.id }))}
              className={`flex flex-col rounded-xl border p-2 text-left transition-colors ${
                resume.template === t.id
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-950/40"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              <TemplateThumb id={t.id} />
              <span className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                {t.label}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{t.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card title="基本信息" className="mt-6">
          <Tip>
            💡 求职意向写<strong>具体岗位名</strong>（如「前端开发工程师」），比「工程师」更精准；
            个人简介用 2–3 句话概括你的核心优势与求职方向。
          </Tip>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="姓名" placeholder="张三" value={resume.basics.name} onChange={(v) => patchBasics({ name: v })} />
            <Field label="求职意向" placeholder="前端开发工程师" value={resume.basics.title} onChange={(v) => patchBasics({ title: v })} />
            <Field label="邮箱" placeholder="name@example.com" value={resume.basics.email} onChange={(v) => patchBasics({ email: v })} />
            <Field label="电话" placeholder="138-0000-0000" value={resume.basics.phone} onChange={(v) => patchBasics({ phone: v })} />
            <Field label="所在地" placeholder="上海" value={resume.basics.location} onChange={(v) => patchBasics({ location: v })} />
            <Field label="个人网站" placeholder="github.com/yourname" value={resume.basics.website} onChange={(v) => patchBasics({ website: v })} />
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

        <Card title="教育经历">
          <Tip>
            💡 按<strong>时间倒序</strong>填写；GPA、专业排名、核心课程、荣誉奖项都可写进「描述」。
          </Tip>
          <div className="space-y-4">
            {resume.education.length === 0 && (
              <EmptyHint text="还没有教育经历，点击下方按钮添加；应届生请填写在读院校。" />
            )}
            {resume.education.map((e) => (
              <div key={e.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
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
                  className="mt-2 text-sm text-red-600 hover:underline dark:text-red-400"
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

        <Card title="工作经历">
          <Tip>
            💡 用 <strong>STAR 句式</strong>（情境-任务-行动-结果），每条突出<strong>量化成果</strong>，
            如「主导 X 项目，通过 Y 方案，使 Z 指标提升 30%」。
          </Tip>
          <div className="space-y-4">
            {resume.work.length === 0 && (
              <EmptyHint text="暂无工作经历？可填写实习，或直接在下方添加「项目经历」。" />
            )}
            {resume.work.map((w) => (
              <div key={w.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
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
                  className="mt-2 text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  删除
                </button>
              </div>
            ))}
            <Button variant="secondary" onClick={addWork}>
              + 添加工作经历
            </Button>
          </div>
        </Card>

        <Card title="项目经历">
          <Tip>
            💡 写清你担任的<strong>角色</strong>、使用的<strong>关键技术</strong>，以及最终<strong>产出/影响</strong>；
            有链接（仓库 / 演示）一定填上，更有说服力。
          </Tip>
          <div className="space-y-4">
            {resume.projects.length === 0 && (
              <EmptyHint text="还没有项目经历，点击下方按钮添加（课程设计、竞赛、开源贡献都算）。" />
            )}
            {resume.projects.map((x) => (
              <div key={x.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
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
                  className="mt-2 text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  删除
                </button>
              </div>
            ))}
            <Button variant="secondary" onClick={addProject}>
              + 添加项目经历
            </Button>
          </div>
        </Card>

        <Card title="技能">
          <Tip>
            💡 按<strong>熟练度分组</strong>（如 熟练掌握 / 了解），避免堆砌无关工具；
            语言、框架、工具分开写更清晰。
          </Tip>
          <div className="space-y-4">
            {resume.skills.length === 0 && (
              <EmptyHint text="还没有技能分组，点击下方按钮添加（如：前端 / 后端 / 语言）。" />
            )}
            {resume.skills.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
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
                  className="mt-2 text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  删除
                </button>
              </div>
            ))}
            <Button variant="secondary" onClick={addSkill}>
              + 添加技能分组
            </Button>
          </div>
        </Card>

        <p className="text-xs text-slate-400 text-center dark:text-slate-500">
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
    </main>
  );
}
