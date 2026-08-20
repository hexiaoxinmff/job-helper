"use client";

import { useRef, useState } from "react";
import { useProfile } from "@/lib/profile";
import { useDiagnosisHistory } from "@/lib/diagnosis-history";
import { track } from "@/lib/track";
import PrivacyNote from "@/components/PrivacyNote";
import { Button } from "@/components/ui/Button";
import CareerModelChart from "@/components/CareerModelChart";

export default function ProfileClient() {
  const { profile, setEnabled, setTargetRole, setTargetScore, clear, exportProfile, importProfile } =
    useProfile();
  const { items: diagHistory, clear: clearDiagHistory } = useDiagnosisHistory();
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
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">私人职业档案</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          跨平台私有的能力画像与成长轨迹。数据仅存于你本地浏览器，可导出携带、可随时清除，不上传任何服务器。
        </p>
      </header>

      {/* 开关 */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-neutral-800 dark:text-neutral-100">开启私人档案</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
              profile.enabled ? "bg-neutral-400 hover:bg-neutral-500" : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            {profile.enabled ? "关闭" : "开启"}
          </button>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
            目标岗位 / 求职方向
          </label>
          <input
            value={profile.targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="例如：前端工程师 / 跨专业转码"
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      </section>

      {/* 操作 */}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={exportProfile}>导出档案 (.json)</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          导入档案
        </Button>
        <button
          onClick={() => {
            if (confirm("确定清除本地所有档案数据？此操作不可恢复。")) {
              clear();
              setImportMsg("");
              track("profile_clear");
            }
          }}
          className="rounded-xl border border-danger-300 bg-white px-4 py-2.5 font-medium text-danger-600 hover:bg-danger-50 dark:border-danger-900 dark:bg-neutral-900 dark:text-danger-400 dark:hover:bg-danger-950"
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
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{importMsg}</p>
      )}

      {/* 近期诊断（无条件自动记录）：脱敏、仅本地、可一键清除，作为求职工作台数据底座 */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-neutral-800 dark:text-neutral-100">
              近期诊断（{diagHistory.length}）
            </h2>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              自动记录
            </span>
          </div>
          {diagHistory.length > 0 && (
            <button
              onClick={() => {
                if (confirm("确定清除全部近期诊断记录？此操作不可恢复。")) {
                  clearDiagHistory();
                  track("diag_history_clear");
                }
              }}
              className="text-sm text-danger-600 hover:underline dark:text-danger-400"
            >
              一键清除
            </button>
          )}
        </div>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          每次诊断自动记录最近 20 条（仅岗位摘要/总分/维度/时间，不含简历正文）。与下方「档案快照」不同，这里无需开启档案即可沉淀。
        </p>
        {diagHistory.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400 dark:border-neutral-700">
            暂无记录。在「简历诊断」页完成一次诊断即可自动沉淀。
          </p>
        ) : (
          <div className="space-y-3">
            {diagHistory.map((h) => (
              <div
                key={h.id}
                className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    {h.targetRole || "（未填写方向）"}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(h.ts).toLocaleDateString()} · 匹配度 {h.overallScore}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {h.dimensions.map((d) => (
                    <span
                      key={d.name}
                      className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    >
                      {d.name} {d.score}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 长期职业建模对比图 */}
      {profile.histories.length >= 2 && (
        <section className="mt-8">
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-100">
            长期职业建模对比
            <span className="rounded-full bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-950 dark:text-accent-300">
              新增
            </span>
          </h2>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
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
        <h2 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">
          诊断历史（{profile.histories.length}）
        </h2>
        {profile.histories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-400 dark:border-neutral-700">
            暂无记录。开启档案并在「简历诊断」页完成一次诊断即可自动沉淀。
          </p>
        ) : (
          <>
            {profile.histories.length === 1 && (
              <p className="mb-3 rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                已沉淀 1 次快照。再完成至少 1 次诊断，「长期职业建模对比」会自动显示成长趋势与前后雷达对比。
              </p>
            )}
            <div className="space-y-3">
              {profile.histories.map((h) => (
                <div
                  key={h.id}
                  className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">
                      {h.targetRole || "（未填写方向）"}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(h.ts).toLocaleDateString()} · 匹配度 {h.overallScore}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {h.dimensions.map((d) => (
                      <span
                        key={d.name}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
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

      <PrivacyNote>
        隐私承诺：档案数据仅保存在你本地浏览器（localStorage），不上传、不共享、不被用于任何推荐或投放。你可以随时导出或清除。
      </PrivacyNote>
    </main>
  );
}
