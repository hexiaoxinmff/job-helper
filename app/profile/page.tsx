"use client";

import { useRef, useState } from "react";
import { useProfile } from "@/lib/profile";
import { track } from "@/lib/track";
import CareerModelChart from "@/components/CareerModelChart";

export default function ProfilePage() {
  const { profile, setEnabled, setTargetRole, setTargetScore, clear, exportProfile, importProfile } =
    useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState("");

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    setImportMsg("");
    try {
      const text = await file.text();
      const r = importProfile(text);
      if (r.ok) {
        setImportMsg("导入成功！");
        track("profile_import");
      } else {
        setImportMsg(`导入失败：${r.error ?? "未知错误"}`);
      }
    } catch {
      setImportMsg("导入失败：文件读取错误");
    }
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">私人职业档案</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          跨平台私有的能力画像与成长轨迹。数据仅存于你本地浏览器，可导出携带、可随时清除，不上传任何服务器。
        </p>
      </header>

      {/* 开关 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">开启私人档案</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {profile.enabled
                ? "已开启：每次诊断会自动沉淀为历史快照。"
                : "默认关闭：开启后才会保存诊断记录（关闭不会删除已有数据）。"}
            </p>
          </div>
          <button
            onClick={() => {
              setEnabled(!profile.enabled);
              track(profile.enabled ? "profile_disable" : "profile_enable");
            }}
            className={`shrink-0 rounded-xl px-4 py-2.5 font-medium text-white transition-colors ${
              profile.enabled ? "bg-slate-400 hover:bg-slate-500" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {profile.enabled ? "关闭" : "开启"}
          </button>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
            目标岗位 / 求职方向
          </label>
          <input
            value={profile.targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="例如：前端工程师 / 跨专业转码"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </section>

      {/* 操作 */}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={exportProfile}
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          导出档案 (.json)
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          导入档案
        </button>
        <button
          onClick={() => {
            if (confirm("确定清除本地所有档案数据？此操作不可恢复。")) {
              clear();
              setImportMsg("");
              track("profile_clear");
            }
          }}
          className="rounded-xl border border-red-300 bg-white px-4 py-2.5 font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          清除数据
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handleImport(e.target.files?.[0])}
        />
      </div>
      {importMsg && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{importMsg}</p>
      )}

      {/* 长期职业建模对比图 */}
      {profile.histories.length >= 2 && (
        <section className="mt-8">
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
            长期职业建模对比
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              新增
            </span>
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            基于 {profile.histories.length} 次诊断快照，可视化你的能力成长轨迹与前后变化。
          </p>
          <CareerModelChart
            histories={profile.histories}
            targetScore={profile.targetScore}
            onTargetScoreChange={setTargetScore}
          />
        </section>
      )}

      {/* 历史快照 */}
      <section className="mt-8">
        <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">
          诊断历史（{profile.histories.length}）
        </h2>
        {profile.histories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
            暂无记录。开启档案并在「简历诊断」页完成一次诊断即可自动沉淀。
          </p>
        ) : (
          <>
            {profile.histories.length === 1 && (
              <p className="mb-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                已沉淀 1 次快照。再完成至少 1 次诊断，「长期职业建模对比」会自动显示成长趋势与前后雷达对比。
              </p>
            )}
            <div className="space-y-3">
              {profile.histories.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {h.targetRole || "（未填写方向）"}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {new Date(h.ts).toLocaleDateString()} · 匹配度 {h.overallScore}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {h.dimensions.map((d) => (
                      <span
                        key={d.name}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {d.name} {d.score}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <p className="mt-8 text-xs text-slate-400 dark:text-slate-500">
        🔒 隐私承诺：档案数据仅保存在你本地浏览器（localStorage），不上传、不共享、不被用于任何推荐或投放。你可以随时导出或清除。
      </p>
    </main>
  );
}
