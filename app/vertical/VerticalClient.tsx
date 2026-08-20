"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VERTICAL_TEMPLATES, getVerticalById } from "@/lib/vertical-templates";
import { getJdById, JD_LOCALES, type JdLocale } from "@/lib/jd-library";
import { useResume } from "@/lib/resume-store";
import { useCopy } from "@/lib/use-copy";
import PrivacyNote from "@/components/PrivacyNote";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { track } from "@/lib/track";

export default function VerticalClient() {
  const router = useRouter();
  const { setResume } = useResume();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locale, setLocale] = useState<JdLocale>("zh-CN");
  const { copiedKey, copy } = useCopy();

  const selected = selectedId ? getVerticalById(selectedId) : undefined;

  const openInEditor = () => {
    if (!selected) return;
    setResume(selected.starterResume);
    track("vertical_open_editor", { id: selected.id });
    router.push("/editor");
  };

  const copyJd = async (jdId: string) => {
    const tpl = getJdById(jdId);
    if (!tpl) return;
    const ok = await copy(tpl.jd[locale], jdId);
    if (ok) track("vertical_copy_jd", { id: jdId });
  };

  if (!selected) {
    return (
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">垂直人群模板</h1>
          <p className="mt-3 text-neutral-600 dark:text-neutral-300">
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
              className="rounded-2xl border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-primary-400 hover:bg-primary-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-700 dark:hover:bg-primary-950/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{t.emoji}</span>
                <div>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100">{t.name}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.tagline}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {t.painPoint}
              </p>
              <p className="mt-3 text-xs text-primary-600 dark:text-primary-400">查看模板 →</p>
            </button>
          ))}
        </div>

        <PrivacyNote>
          模板仅提供结构引导与占位示例，不会替你编造经历；最终简历里的所有内容都来自你自己填写。
        </PrivacyNote>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <button
        onClick={() => setSelectedId(null)}
        className="mb-6 text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        ← 返回全部模板
      </button>

      <header className="mb-8">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{selected.emoji}</span>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{selected.name}</h1>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">{selected.tagline}</p>
          </div>
        </div>
        <Alert variant="warning" className="mt-4">
          <span className="font-medium">核心痛点：</span>
          {selected.painPoint}
        </Alert>
      </header>

      {/* 定位与包装建议 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">定位与包装建议</h2>
        <ol className="space-y-3">
          {selected.guidance.map((g, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                {i + 1}
              </span>
              {g}
            </li>
          ))}
        </ol>
      </section>

      {/* 推荐目标岗位 */}
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">推荐目标岗位</h2>
          <div className="flex items-center gap-1">
            {JD_LOCALES.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocale(l.id)}
                className={`rounded-lg px-2.5 py-1 text-xs ${
                  locale === l.id
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
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
              <div key={r.jdId} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
                <p className="font-medium text-neutral-800 dark:text-neutral-100">
                  {tpl.industry[locale]} · {tpl.role[locale]}
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{r.note}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyJd(r.jdId)}
                  >
                    {copiedKey === r.jdId ? "已复制 JD ✓" : "复制参考 JD"}
                  </Button>
                  <Link
                    href="/"
                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    去首页诊断 →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 衔接时间线建议（如考公失利转就业的关键节点） */}
      {selected.timeline && selected.timeline.length > 0 && (
        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">衔接时间线建议</h2>
          <div className="space-y-3">
            {selected.timeline.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    {i + 1}
                  </span>
                  {i < selected.timeline!.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{t.phase}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{t.action}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 起步简历骨架 */}
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-800 dark:text-neutral-100">起步简历骨架</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          已按「{selected.recommendedTemplate}」版式预填引导占位，点击一键载入编辑器，把括号里的示例替换成你自己的真实经历即可。
        </p>
        <Button size="lg" className="w-full" onClick={openInEditor}>
          用此模板在编辑器中打开
        </Button>
      </section>

      <PrivacyNote>
        模板仅提供结构引导与占位示例，不会替你编造经历；最终简历里的所有内容都来自你自己填写。
      </PrivacyNote>
    </main>
  );
}
