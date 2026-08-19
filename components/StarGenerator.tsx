"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/track";
import { generateStarDescription } from "@/lib/ai-client";
import { useResume } from "@/lib/resume-store";

interface StarResult {
  star: string;
  parts: { label: string; content: string }[];
  tips: string[];
}

const EXAMPLES = [
  "负责电商订单数据分析，做了月度报表",
  "在学生会组织了一次 200 人参与的迎新晚会",
  "用 Python 写了爬虫，爬了 10 万条招聘信息",
  "参与毕业设计课题，完成了一份调研报告",
];

export default function StarGenerator() {
  const [experience, setExperience] = useState("");
  const [starLoading, setStarLoading] = useState(false);
  const [starResult, setStarResult] = useState<StarResult | null>(null);
  const [starMsg, setStarMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const { setResume } = useResume();

  useEffect(() => {
    track("star_page_view");
  }, []);

  const runStar = async () => {
    if (!experience.trim()) {
      setStarMsg("请先输入一段经历描述");
      return;
    }
    setStarLoading(true);
    setStarMsg("");
    setStarResult(null);
    setCopied(false);
    track("star_generate_click");
    try {
      const res = await generateStarDescription(experience);
      if (!res) {
        setStarMsg("STAR 生成暂不可用，请稍后重试");
        track("star_generate_error", { reason: "null" });
        return;
      }
      setStarResult(res);
      track("star_generate_success");
    } catch {
      setStarMsg("网络错误，请稍后重试");
      track("star_generate_error", { reason: "network" });
    } finally {
      setStarLoading(false);
    }
  };

  const copy = async () => {
    if (!starResult) return;
    try {
      await navigator.clipboard.writeText(starResult.star);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      track("star_copy");
    } catch {
      // 剪贴板不可用静默
    }
  };

  const addToResume = () => {
    if (!starResult) return;
    setResume((prev) => {
      const line = starResult.star;
      const projects = prev.projects.length
        ? prev.projects.map((p, i) =>
            i === 0 ? { ...p, bullets: [...p.bullets, line] } : p
          )
        : [
            {
              id: `p-${Date.now()}`,
              name: "STAR 生成的经历",
              role: "",
              link: "",
              startDate: "",
              endDate: "",
              bullets: [line],
            },
          ];
      return { ...prev, projects };
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    track("star_add_to_resume");
  };

  const copyPart = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 静默
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 font-semibold text-neutral-800 dark:text-neutral-100">描述一段你的经历</h2>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          输入一句你做过的事，AI 帮你扩写为「情境-任务-行动-结果」的简历亮点句式
        </p>

        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="例如：负责电商订单数据分析，做了月度报表"
          className="h-24 w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition-colors focus:ring-2 focus:ring-accent-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="self-center text-xs text-neutral-500 dark:text-neutral-400">试试：</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setExperience(ex)}
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {ex}
            </button>
          ))}
        </div>

        {starMsg && (
          <p className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {starMsg}
          </p>
        )}

        <button
          onClick={runStar}
          disabled={starLoading}
          className="mt-4 w-full rounded-xl bg-accent-600 py-3 font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
        >
          {starLoading ? "生成中…" : "生成 STAR 句式"}
        </button>
      </div>

      {starResult && (
        <>
          {/* 完整句式 */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">可直接粘贴进简历</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={copy}
                  className="text-sm text-accent-600 hover:underline dark:text-accent-400"
                >
                  {copied ? "已复制 ✓" : "复制"}
                </button>
                <button
                  onClick={addToResume}
                  className="text-sm text-accent-600 hover:underline dark:text-accent-400"
                >
                  {added ? "已加入 ✓" : "加入简历"}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-accent-200 bg-accent-50 p-4 dark:border-accent-900 dark:bg-accent-950">
              <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-100">{starResult.star}</p>
            </div>
          </div>

          {/* 四步拆解 */}
          {starResult.parts.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">STAR 四步拆解</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {starResult.parts.map((p) => (
                  <div
                    key={p.label}
                    className="group relative rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-800"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-accent-700 dark:text-accent-300">
                        {p.label}
                      </span>
                      <button
                        onClick={() => copyPart(`${p.label}：${p.content}`)}
                        className="text-xs text-neutral-400 opacity-0 transition-opacity hover:text-neutral-600 group-hover:opacity-100 dark:text-neutral-500 dark:hover:text-neutral-300"
                        title="复制本步"
                      >
                        复制
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{p.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 使用建议 */}
          {starResult.tips.length > 0 && (
            <div className="rounded-2xl border border-warning-200 bg-warning-50 p-6 dark:border-warning-900 dark:bg-warning-950">
              <h2 className="mb-2 font-semibold text-warning-800 dark:text-warning-300">使用建议</h2>
              <ul className="space-y-1.5 text-sm text-warning-900 dark:text-warning-200">
                {starResult.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!starResult && !starMsg && (
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
          输入的内容只用于本次生成，不存储
        </p>
      )}
    </div>
  );
}
