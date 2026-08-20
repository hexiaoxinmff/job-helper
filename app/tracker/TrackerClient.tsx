"use client";

import { useMemo, useState } from "react";
import {
  APPLICATION_STATUSES,
  STATUS_META,
  useTracker,
  type ApplicationItem,
  type ApplicationStatus,
} from "@/lib/tracker-store";
import { JD_LIBRARY } from "@/lib/jd-library";
import { useResume } from "@/lib/resume-store";
import { track } from "@/lib/track";
import PrivacyNote from "@/components/PrivacyNote";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type ViewMode = "kanban" | "list";

interface Draft {
  id?: string;
  company: string;
  role: string;
  source: string;
  status: ApplicationStatus;
  appliedAt: string;
  resumeVersion: string;
  jdId: string;
  notes: string;
  url: string;
}

const emptyDraft = (): Draft => ({
  company: "",
  role: "",
  source: "",
  status: "applied",
  appliedAt: new Date().toISOString().slice(0, 10),
  resumeVersion: "",
  jdId: "",
  notes: "",
  url: "",
});

function todayCN(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusIndex(s: ApplicationStatus): number {
  return APPLICATION_STATUSES.indexOf(s);
}

/** 距投递日已过去的天数 */
function daysSince(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/** 已投递后迟迟未推进（≥7 天）→ 建议跟进 */
function needsFollowUp(it: ApplicationItem): boolean {
  return it.status === "applied" && daysSince(it.appliedAt) >= 7;
}

export default function TrackerClient() {
  const { items, add, update, move, remove, clear, exportTracker } = useTracker();
  const { versions, activeId } = useResume();
  const [view, setView] = useState<ViewMode>("kanban");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [formError, setFormError] = useState("");
  const [msg, setMsg] = useState("");

  // 看板列：按状态分组
  const byStatus = useMemo(() => {
    const map: Record<ApplicationStatus, ApplicationItem[]> = {
      applied: [], written: [], interview: [], offer: [], rejected: [],
    };
    for (const it of items) map[it.status].push(it);
    // 已投递列：待跟进的置顶，其次按最近更新
    map.applied.sort(
      (a, b) => Number(needsFollowUp(b)) - Number(needsFollowUp(a)) || (b.updatedAt || 0) - (a.updatedAt || 0)
    );
    return map;
  }, [items]);

  const stats = useMemo(() => {
    const s = {
      total: items.length,
      followUp: items.filter(needsFollowUp).length,
      interview: byStatus.interview.length,
      offer: byStatus.offer.length,
      rejected: byStatus.rejected.length,
    };
    return s;
  }, [items, byStatus]);

  const openAdd = () => {
    setDraft(emptyDraft());
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (it: ApplicationItem) => {
    setDraft({
      id: it.id,
      company: it.company,
      role: it.role,
      source: it.source ?? "",
      status: it.status,
      appliedAt: it.appliedAt,
      resumeVersion: it.resumeVersion ?? "",
      jdId: it.jdId ?? "",
      notes: it.notes ?? "",
      url: it.url ?? "",
    });
    setFormError("");
    setShowForm(true);
  };

  const submitForm = () => {
    const company = draft.company.trim();
    const role = draft.role.trim();
    if (!company || !role) {
      setFormError("请填写公司名称与岗位名称");
      return;
    }
    const jdTpl = JD_LIBRARY.find((x) => x.id === draft.jdId);
    if (draft.id) {
      update(draft.id, {
        company,
        role,
        source: draft.source.trim() || undefined,
        status: draft.status,
        appliedAt: draft.appliedAt || todayCN(Date.now()),
        resumeVersion: draft.resumeVersion || undefined,
        jdId: jdTpl?.id,
        jdSummary: jdTpl ? `${jdTpl.industry["zh-CN"]} · ${jdTpl.role["zh-CN"]}` : undefined,
        notes: draft.notes.trim() || undefined,
        url: draft.url.trim() || undefined,
      });
      track("tracker_update");
    } else {
      add({
        company,
        role,
        source: draft.source.trim() || undefined,
        status: draft.status,
        appliedAt: draft.appliedAt || todayCN(Date.now()),
        resumeVersion: draft.resumeVersion || undefined,
        jdId: jdTpl?.id,
        jdSummary: jdTpl ? `${jdTpl.industry["zh-CN"]} · ${jdTpl.role["zh-CN"]}` : undefined,
        notes: draft.notes.trim() || undefined,
        url: draft.url.trim() || undefined,
      });
      track("tracker_add");
    }
    setShowForm(false);
    setMsg(draft.id ? "已保存修改" : "已记录投递");
    setDraft(emptyDraft());
    window.setTimeout(() => setMsg(""), 2500);
  };

  const handleRemove = (it: ApplicationItem) => {
    if (confirm(`确定删除「${it.company} · ${it.role}」这条投递记录？`)) {
      remove(it.id);
      track("tracker_remove");
    }
  };

  const handleClearAll = () => {
    if (confirm("确定清空全部投递记录？此操作不可恢复。")) {
      clear();
      track("tracker_clear");
    }
  };

  const statusFlow = (it: ApplicationItem, dir: 1 | -1) => {
    const idx = statusIndex(it.status);
    const next = APPLICATION_STATUSES[idx + dir];
    if (!next) return;
    move(it.id, next);
    track("tracker_move", { from: it.status, to: next });
  };

  const jdLabel = (it: ApplicationItem) => (it.jdSummary ? it.jdSummary : "");

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">投递追踪工作台</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          跨平台记录你的每一次投递——不限于单一平台，台账归你自己。数据仅存本地，可导出、可清除。
        </p>
      </header>

      {msg && (
        <div className="mb-4 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-900 dark:bg-success-950 dark:text-success-300">
          ✅ {msg}
        </div>
      )}

      {/* 统计 + 工具栏 */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            共 {stats.total} 条投递
          </span>
          {stats.followUp > 0 && (
            <span className="rounded-full bg-orange-100 px-3 py-1.5 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-300">
              待跟进 {stats.followUp}
            </span>
          )}
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            面试中 {stats.interview}
          </span>
          <span className="rounded-full bg-success-100 px-3 py-1.5 text-sm text-success-700 dark:bg-success-950 dark:text-success-300">
            Offer {stats.offer}
          </span>
          <span className="rounded-full bg-danger-100 px-3 py-1.5 text-sm text-danger-700 dark:bg-danger-950 dark:text-danger-300">
            已拒绝 {stats.rejected}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "kanban"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              看板
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm transition-colors ${
                view === "list"
                  ? "bg-primary-600 text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              列表
            </button>
          </div>
          <Button size="sm" variant="outline" onClick={exportTracker}>
            导出 JSON
          </Button>
          {items.length > 0 && (
            <Button size="sm" variant="outline" onClick={handleClearAll}>
              清空
            </Button>
          )}
          <Button size="sm" onClick={openAdd}>
            + 新增投递
          </Button>
        </div>
      </div>

      {/* 新增 / 编辑表单 */}
      {showForm && (
        <div className="mb-6 rounded-2xl border border-primary-200 bg-white p-6 dark:border-primary-800 dark:bg-neutral-900">
          <h2 className="mb-4 font-semibold text-neutral-800 dark:text-neutral-100">
            {draft.id ? "编辑投递记录" : "新增投递记录"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                公司名称 <span className="text-danger-500">*</span>
              </label>
              <input
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                placeholder="例如：字节跳动"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                岗位名称 <span className="text-danger-500">*</span>
              </label>
              <input
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                placeholder="例如：前端开发工程师"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                投递渠道
              </label>
              <input
                value={draft.source}
                onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                placeholder="BOSS直聘 / 官网 / 内推 / 邮箱…"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                当前状态
              </label>
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as ApplicationStatus })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                投递日期
              </label>
              <input
                type="date"
                value={draft.appliedAt}
                onChange={(e) => setDraft({ ...draft, appliedAt: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                所用简历版本
              </label>
              <select
                value={draft.resumeVersion}
                onChange={(e) => setDraft({ ...draft, resumeVersion: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="">未指定</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                    {v.id === activeId ? "（当前）" : ""} · {v.resume.basics.title?.trim() || "未设意向"}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                来自简历编辑器的多版本；没有则先到编辑器新建。
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                关联岗位方向（可选，从行业 JD 库选择）
              </label>
              <select
                value={draft.jdId}
                onChange={(e) => setDraft({ ...draft, jdId: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="">不关联</option>
                {JD_LIBRARY.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.industry["zh-CN"]} · {x.role["zh-CN"]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                仅记录行业与岗位摘要，不保存 JD 全文（隐私红线）。
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                备注（面试时间、跟进事项…）
              </label>
              <textarea
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={2}
                placeholder="例如：9/3 下午 2 点一面（线上）"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                投递链接（可选）
              </label>
              <input
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://…"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
          {formError && (
            <div className="mt-4">
              <Alert variant="danger">{formError}</Alert>
            </div>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              取消
            </Button>
            <Button onClick={submitForm}>{draft.id ? "保存修改" : "记录投递"}</Button>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {items.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <div className="mb-3 text-4xl">📋</div>
          <p className="font-medium text-neutral-700 dark:text-neutral-200">还没有投递记录</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
            完成一次投递后记在这里：公司、岗位、渠道、状态一目了然，跨平台台账随你带走。
          </p>
          <div className="mt-6">
            <Button onClick={openAdd}>+ 记录第一条投递</Button>
          </div>
        </div>
      )}

      {/* 看板视图 */}
      {items.length > 0 && view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_STATUSES.map((s) => {
            const col = byStatus[s];
            return (
              <div key={s} className="w-64 shrink-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[s].dot}`} />
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    {STATUS_META[s].label}
                  </span>
                  <span className="ml-auto rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {col.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {col.map((it) => (
                    <div
                      key={it.id}
                      className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{it.company}</p>
                      <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-300">{it.role}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400 dark:text-neutral-500">
                        <span>{it.appliedAt}</span>
                        {it.source && <span>· {it.source}</span>}
                        {jdLabel(it) && <span className="w-full">🎯 {jdLabel(it)}</span>}
                      {needsFollowUp(it) && (
                        <span className="w-full rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          已投递 {daysSince(it.appliedAt)} 天未回 · 建议跟进
                        </span>
                      )}
                      </div>
                      {it.notes && (
                        <p className="mt-2 line-clamp-2 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          {it.notes}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {statusIndex(it.status) > 0 && (
                            <button
                              onClick={() => statusFlow(it, -1)}
                              title="回退状态"
                              aria-label={`回退「${it.company}」投递状态`}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                            >
                              ◀
                            </button>
                          )}
                          {statusIndex(it.status) < APPLICATION_STATUSES.length - 2 && (
                            <button
                              onClick={() => statusFlow(it, 1)}
                              title="推进状态"
                              aria-label={`推进「${it.company}」投递状态`}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                            >
                              ▶
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(it)}
                            title="编辑"
                            className="rounded-lg px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleRemove(it)}
                            title="删除"
                            className="rounded-lg px-3 py-2 text-xs text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {col.length === 0 && (
                    <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-4 text-center text-xs text-neutral-400 dark:border-neutral-700">
                      暂无
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 列表视图 */}
      {items.length > 0 && view === "list" && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                <th className="px-4 py-3 font-medium">公司 / 岗位</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">投递日期</th>
                <th className="px-4 py-3 font-medium">渠道</th>
                <th className="px-4 py-3 font-medium">方向</th>
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-800 dark:text-neutral-100">{it.company}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{it.role}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_META[it.status].badge}`}>
                      {STATUS_META[it.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-neutral-600 dark:text-neutral-300">{it.appliedAt}</span>
                    {needsFollowUp(it) && (
                      <span className="ml-1.5 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                        建议跟进
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{it.source ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">{jdLabel(it) || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(it)}
                      aria-label={`编辑「${it.company} · ${it.role}」`}
                      className="mr-1 rounded-lg px-2.5 py-2 text-xs text-primary-600 hover:bg-primary-50 hover:underline dark:text-primary-400 dark:hover:bg-primary-950"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleRemove(it)}
                      aria-label={`删除「${it.company} · ${it.role}」`}
                      className="rounded-lg px-2.5 py-2 text-xs text-danger-600 hover:bg-danger-50 hover:underline dark:text-danger-400 dark:hover:bg-danger-950"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <PrivacyNote>
          隐私承诺：投递台账仅保存在你本地浏览器（localStorage），只记录公司/岗位/状态等投递动作，不含简历正文与 JD 全文；可随时导出或清除，不上传任何服务器。
        </PrivacyNote>
      </div>
    </main>
  );
}
