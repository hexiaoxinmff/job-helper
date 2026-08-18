"use client";

import { useResume } from "@/lib/resume-store";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type {
  BasicInfo,
  EducationItem,
  WorkItem,
  ProjectItem,
  SkillGroup,
  TemplateId,
} from "@/lib/types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: "classic", label: "经典" },
  { id: "modern", label: "现代" },
  { id: "compact", label: "紧凑" },
];

const toLines = (arr: string[]) => arr.join("\n");
const fromLines = (text: string) =>
  text.split("\n").map((s) => s.trim()).filter(Boolean);

export default function EditorPage() {
  const { resume, setResume, reset } = useResume();

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

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <header className="flex items-start justify-between mb-8 gap-4">
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
          <Button variant="ghost" onClick={reset}>
            清空重填
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        <Card title="基本信息">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="姓名" value={resume.basics.name} onChange={(v) => patchBasics({ name: v })} />
            <Field label="求职意向" value={resume.basics.title} onChange={(v) => patchBasics({ title: v })} />
            <Field label="邮箱" value={resume.basics.email} onChange={(v) => patchBasics({ email: v })} />
            <Field label="电话" value={resume.basics.phone} onChange={(v) => patchBasics({ phone: v })} />
            <Field label="所在地" value={resume.basics.location} onChange={(v) => patchBasics({ location: v })} />
            <Field label="个人网站" value={resume.basics.website} onChange={(v) => patchBasics({ website: v })} />
          </div>
          <div className="mt-4">
            <Field
              label="个人简介"
              textarea
              value={resume.basics.summary}
              onChange={(v) => patchBasics({ summary: v })}
            />
          </div>
          <div className="mt-4">
            <span className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-200">模板样式</span>
            <div className="flex gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setResume((p) => ({ ...p, template: t.id }))}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    resume.template === t.id
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card title="教育经历">
          <div className="space-y-4">
            {resume.education.map((e) => (
              <div key={e.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="学校" value={e.school} onChange={(v) => updateEducation(e.id, { school: v })} />
                  <Field label="学历" value={e.degree} onChange={(v) => updateEducation(e.id, { degree: v })} />
                  <Field label="专业" value={e.major} onChange={(v) => updateEducation(e.id, { major: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="开始" value={e.startDate} onChange={(v) => updateEducation(e.id, { startDate: v })} />
                    <Field label="结束" value={e.endDate} onChange={(v) => updateEducation(e.id, { endDate: v })} />
                  </div>
                </div>
                <div className="mt-3">
                  <Field
                    label="描述"
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
          <div className="space-y-4">
            {resume.work.map((w) => (
              <div key={w.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="公司" value={w.company} onChange={(v) => updateWork(w.id, { company: v })} />
                  <Field label="职位" value={w.role} onChange={(v) => updateWork(w.id, { role: v })} />
                  <Field label="开始" value={w.startDate} onChange={(v) => updateWork(w.id, { startDate: v })} />
                  <Field label="结束" value={w.endDate} onChange={(v) => updateWork(w.id, { endDate: v })} />
                </div>
                <div className="mt-3">
                  <Field
                    label="工作描述（每行一条，建议用 STAR 句式）"
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
          <div className="space-y-4">
            {resume.projects.map((x) => (
              <div key={x.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="项目名称" value={x.name} onChange={(v) => updateProject(x.id, { name: v })} />
                  <Field label="角色" value={x.role} onChange={(v) => updateProject(x.id, { role: v })} />
                  <Field label="链接" value={x.link} onChange={(v) => updateProject(x.id, { link: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="开始" value={x.startDate} onChange={(v) => updateProject(x.id, { startDate: v })} />
                    <Field label="结束" value={x.endDate} onChange={(v) => updateProject(x.id, { endDate: v })} />
                  </div>
                </div>
                <div className="mt-3">
                  <Field
                    label="项目描述（每行一条）"
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
          <div className="space-y-4">
            {resume.skills.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <Field label="分类" value={s.category} onChange={(v) => updateSkill(s.id, { category: v })} />
                <div className="mt-3">
                  <Field
                    label="技能（每行一个，如：React / TypeScript）"
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
    </main>
  );
}
