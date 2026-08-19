"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VERTICAL_TEMPLATES, getVerticalById } from "@/lib/vertical-templates";
import { getJdById, JD_LOCALES, type JdLocale } from "@/lib/jd-library";
import { useResume } from "@/lib/resume-store";
import { track } from "@/lib/track";

export default function VerticalTemplatesPage() {
  const router = useRouter();
  const { setResume } = useResume();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locale, setLocale] = useState<JdLocale>("zh-CN");
  const [copiedJd, setCopiedJd] = useState("");

  const selected = selectedId ? getVerticalById(selectedId) : undefined;

  const openInEditor = () => {
    if (!selected) return;
    setResume(selected.starterResume);
    track("vertical_open_editor", { id: selected.id });
    router.push("/editor");
  };

  const copyJd = async (jdId: string, roleName: string) => {
    const tpl = getJdById(jdId);
    if (!tpl) return;
    try {
      await navigator.clipboard.writeText(tpl.jd[locale]);
      setCopiedJd(jdId);
      setTimeout(() => setCopiedJd(""), 1500);
      track("vertical_copy_jd", { id: jdId });
    } catch {
      /* 剪贴板不可用则静默 */
    }
  };

  if (!selected) {
    return (
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">垂直人群模板</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            针对高价值垂直人群（跨专业转码 / 考公转行 / 二战转就业 / 应届零实习 / 在职跳槽 / 海归）的起步简历骨架与定位建议。
            每个模板都「诚实不编造」——只给结构与引导，经历由你填写。
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {VERTICAL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedId(t.id);
                track("vertical_view", { id: t.id });
              }}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{t.emoji}</span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{t.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t.tagline}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.painPoint}
              </p>
              <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">查看模板 →</p>
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
          🔒 模板仅提供结构引导与占位示例，不会替你编造经历；最终简历里的所有内容都来自你自己填写。
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <button
        onClick={() => setSelectedId(null)}
        className="mb-6 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ← 返回全部模板
      </button>

      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{selected.emoji}</span>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selected.name}</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{selected.tagline}</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="font-medium">核心痛点：</span>
          {selected.painPoint}
        </div>
      </header>

      {/* 定位与包装建议 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">定位与包装建议</h2>
        <ol className="space-y-3">
          {selected.guidance.map((g, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {i + 1}
              </span>
              {g}
            </li>
          ))}
        </ol>
      </section>

      {/* 推荐目标岗位 */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">推荐目标岗位</h2>
          <div className="flex items-center gap-1">
            {JD_LOCALES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocale(l.id)}
                className={`rounded-lg px-2.5 py-1 text-xs ${
                  locale === l.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {selected.targetRoles.map((r) => {
            const tpl = getJdById(r.jdId);
            if (!tpl) return null;
            return (
              <div key={r.jdId} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {tpl.industry[locale]} · {tpl.role[locale]}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{r.note}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => copyJd(r.jdId, tpl.role[locale])}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {copiedJd === r.jdId ? "已复制 JD ✓" : "复制参考 JD"}
                  </button>
                  <a
                    href="/"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    去首页诊断 →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 起步简历骨架 */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 font-semibold text-slate-800 dark:text-slate-100">起步简历骨架</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          已按「{selected.recommendedTemplate}」版式预填引导占位，点击一键载入编辑器，把括号里的示例替换成你自己的真实经历即可。
        </p>
        <button
          onClick={openInEditor}
          className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          用此模板在编辑器中打开
        </button>
      </section>

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        🔒 模板仅提供结构引导与占位示例，不会替你编造经历；最终简历里的所有内容都来自你自己填写。
      </p>
    </main>
  );
}
