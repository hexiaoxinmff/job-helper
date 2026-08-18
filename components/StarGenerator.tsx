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
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-1">描述一段你的经历</h2>
        <p className="text-sm text-slate-500 mb-4">
          输入一句你做过的事，AI 帮你扩写为「情境-任务-行动-结果」的简历亮点句式
        </p>

        <textarea
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          placeholder="例如：负责电商订单数据分析，做了月度报表"
          className="w-full h-24 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
        />

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-500 self-center">试试：</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setExperience(ex)}
              className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {starMsg && (
          <p className="mt-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            {starMsg}
          </p>
        )}

        <button
          onClick={runStar}
          disabled={starLoading}
          className="mt-4 w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {starLoading ? "生成中…" : "生成 STAR 句式"}
        </button>
      </div>

      {starResult && (
        <>
          {/* 完整句式 */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">可直接粘贴进简历</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={copy}
                  className="text-sm text-purple-600 hover:underline"
                >
                  {copied ? "已复制 ✓" : "复制"}
                </button>
                <button
                  onClick={addToResume}
                  className="text-sm text-purple-600 hover:underline"
                >
                  {added ? "已加入 ✓" : "加入简历"}
                </button>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm text-slate-800 leading-relaxed">{starResult.star}</p>
            </div>
          </div>

          {/* 四步拆解 */}
          {starResult.parts.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4">STAR 四步拆解</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {starResult.parts.map((p) => (
                  <div
                    key={p.label}
                    className="bg-slate-50 rounded-xl px-4 py-3 group relative"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-purple-700">
                        {p.label}
                      </span>
                      <button
                        onClick={() => copyPart(`${p.label}：${p.content}`)}
                        className="text-xs text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="复制本步"
                      >
                        复制
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{p.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 使用建议 */}
          {starResult.tips.length > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6">
              <h2 className="font-semibold text-amber-800 mb-2">使用建议</h2>
              <ul className="space-y-1.5 text-sm text-amber-900">
                {starResult.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!starResult && !starMsg && (
        <p className="text-xs text-slate-400 text-center">
          输入的内容只用于本次生成，不存储
        </p>
      )}
    </div>
  );
}