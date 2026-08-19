"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@/lib/track";
import PrivacyNote from "@/components/PrivacyNote";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";

const STORAGE_KEY = "job-helper:campus-lead";

interface Lead {
  school: string;
  dept: string;
  contact: string;
  email: string;
  scale: string;
  note: string;
  ts: number;
}

const WHY = [
  {
    emoji: "🛡",
    title: "隐私合规，机构不碰学生 PII",
    desc: "简历仅在学生本地浏览器处理，不落盘、不上传；机构看到的只是聚合后的「能力画像趋势」，而非个人敏感信息。",
  },
  {
    emoji: "📈",
    title: "用「长期陪伴」破解季节性留存",
    desc: "求职是低频高 stakes 行为。私人职业档案让学生从大一用到入职，把一次性工具变成院系可长期触达的入口。",
  },
  {
    emoji: "🎯",
    title: "诚实诊断，而非「美化」",
    desc: "差距补救路线区分硬技能缺口与表达缺口，真正帮学生补短板——这正是就业指导老师最需要的，而非又一份「AI 改简历」。",
  },
  {
    emoji: "🆓",
    title: "轻量试点，零采购门槛",
    desc: "纯静态前端 + 可选 AI 增强，无需账号体系与数据库即可运行；一间院系用一个链接即可封闭试点。",
  },
];

const STEPS = [
  { n: "1", title: "申请封闭试点", desc: "填写下方表单，我们会提供机构专属入口链接与试点配置说明。" },
  { n: "2", title: "分发给学生", desc: "就业中心 / 辅导员把入口链接发到班级群，学生零门槛上传简历即出诊断。" },
  { n: "3", title: "跟踪成长趋势", desc: "学生用私人档案沉淀成长轨迹；机构侧可看脱敏的群体能力分布与提升情况。" },
];

export default function CampusClient() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({
    school: "",
    dept: "",
    contact: "",
    email: "",
    scale: "1000 人以下",
    note: "",
  });
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.school.trim() || !form.contact.trim() || !form.email.trim()) {
      setError("请填写学校名称、联系人与邮箱");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("邮箱格式不正确");
      return;
    }
    const next: Lead = { ...form, ts: Date.now() };
    setLead(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* 忽略存储失败 */
    }
    setError("");
    track("campus_apply", { scale: form.scale });
  };

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-md py-2xl">
      {/* Hero */}
      <header className="mb-2xl text-center">
        <span className="inline-block rounded-full bg-primary-100 px-sm py-1 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          B2B2C · 高校就业中心合作
        </span>
        <h1 className="mt-md text-3xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-4xl">
          把「求职在线助手」接入你的就业指导
        </h1>
        <p className="mx-auto mt-md max-w-2xl text-neutral-600 dark:text-neutral-300">
          面向高校就业中心 / 院系的封闭试点方案：用跨平台的私人职业档案与诚实诊断，
          帮学生从「简历空白」到「匹配上岗」，同时守护隐私合规。
        </p>
        <div className="mt-lg flex flex-wrap justify-center gap-sm">
          <a
            href="#apply"
            className="rounded-xl bg-primary-600 px-5 py-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            申请封闭试点
          </a>
          <Link
            href="/"
            className="rounded-xl border border-neutral-300 bg-white px-5 py-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            体验学生端工具
          </Link>
        </div>
      </header>

      {/* Why */}
      <section className="mb-2xl">
        <h2 className="mb-5 text-xl font-semibold text-neutral-800 dark:text-neutral-100">为什么是高校？</h2>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          {WHY.map((w) => (
            <div key={w.title} className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-sm">
                <span className="text-2xl">{w.emoji}</span>
                <p className="font-semibold text-neutral-800 dark:text-neutral-100">{w.title}</p>
              </div>
              <p className="mt-xs text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mb-2xl">
        <h2 className="mb-5 text-xl font-semibold text-neutral-800 dark:text-neutral-100">合作三步</h2>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {s.n}
              </span>
              <p className="mt-sm font-medium text-neutral-800 dark:text-neutral-100">{s.title}</p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools for students */}
      <section className="mb-2xl rounded-2xl border border-neutral-200 bg-white p-lg dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-sm font-semibold text-neutral-800 dark:text-neutral-100">学生端能力（机构可统一分发）</h2>
        <div className="grid grid-cols-1 gap-sm sm:grid-cols-2">
          <ToolCard href="/" title="简历诊断" desc="上传 PDF + JD，秒出匹配度雷达图与改进建议" />
          <ToolCard href="/star" title="STAR 生成器" desc="把干瘪经历扩写成面试级亮点句式" />
          <ToolCard href="/profile" title="私人职业档案" desc="沉淀成长轨迹，长期职业建模" />
          <ToolCard href="/vertical" title="垂直人群模板" desc="跨专业转码 / 考公转行等起步简历" />
        </div>
      </section>

      {/* Apply form */}
      <section id="apply" className="scroll-mt-lg">
        <div className="rounded-2xl border border-neutral-200 bg-white p-lg dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-1 font-semibold text-neutral-800 dark:text-neutral-100">申请封闭试点</h2>
          <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">
            填写以下信息即可提交申请（纯前端留资，数据仅存你本地浏览器，不会上传）。
          </p>

          {lead ? (
            <div className="rounded-xl border border-success-200 bg-success-50 p-5 text-sm text-success-800 dark:border-success-900 dark:bg-success-950/40 dark:text-success-200">
              <p className="font-medium">✅ 申请已提交（本地留存）</p>
              <p className="mt-xs">
                {lead.school}
                {lead.dept ? ` · ${lead.dept}` : ""} · 规模 {lead.scale}
              </p>
              <p className="mt-1 text-xs text-success-700 dark:text-success-300">
                这是演示用留资：真实试点请联系产品方开通机构入口。你可在浏览器本地存储查看 / 清除该记录。
              </p>
              <div className="mt-sm">
                <button
                  onClick={() => {
                    setLead(null);
                    try {
                      window.localStorage.removeItem(STORAGE_KEY);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="rounded-lg border border-success-300 px-sm py-1.5 text-success-700 hover:bg-success-100 dark:border-success-800 dark:text-success-300 dark:hover:bg-success-950"
                >
                  清除本地申请记录
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-md">
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                <Field label="学校名称 *">
                  <Input
                    value={form.school}
                    onChange={(e) => setForm({ ...form, school: e.target.value })}
                    placeholder="如：XX 大学"
                  />
                </Field>
                <Field label="院系 / 就业中心">
                  <Input
                    value={form.dept}
                    onChange={(e) => setForm({ ...form, dept: e.target.value })}
                    placeholder="如：计算机学院就业办"
                  />
                </Field>
                <Field label="联系人 *">
                  <Input
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="老师 / 负责人姓名"
                  />
                </Field>
                <Field label="邮箱 *">
                  <Input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@school.edu.cn"
                  />
                </Field>
              </div>
              <Field label="学生规模">
                <select
                  value={form.scale}
                  onChange={(e) => setForm({ ...form, scale: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-sm py-xs text-sm text-neutral-800 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-primary-900/40"
                >
                  {["1000 人以下", "1000-5000 人", "5000-10000 人", "10000 人以上"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="备注">
                <Textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  placeholder="试点时间、特殊需求等（选填）"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-sm py-xs text-sm text-neutral-800 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-primary-900/40"
                />
              </Field>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-danger-200 bg-danger-50 px-md py-sm text-sm text-danger-600 dark:border-danger-900 dark:bg-danger-950/40 dark:text-danger-400"
                >
                  {error}
                </p>
              )}

              <button
                onClick={submit}
                className="w-full rounded-xl bg-primary-600 py-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                提交申请
              </button>
            </div>
          )}
        </div>
      </section>

      <PrivacyNote>
        隐私承诺：本页申请表单为纯前端演示，留资仅存于你本地浏览器（localStorage），不上传任何服务器。学生端工具同样遵循「简历不落盘、档案仅本地」原则。
      </PrivacyNote>
    </main>
  );
}


function ToolCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-neutral-200 p-md transition-colors hover:border-primary-400 hover:bg-primary-50/40 dark:border-neutral-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
    >
      <p className="font-medium text-neutral-800 dark:text-neutral-100">{title}</p>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{desc}</p>
    </Link>
  );
}
