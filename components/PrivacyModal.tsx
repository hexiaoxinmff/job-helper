"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "job-helper:privacy-ack";

/**
 * 开发者隐私承诺弹窗：页面启动后自动弹出一次，
 * 点击「我已知晓」后写入 localStorage，后续不再自动弹出。
 */
export default function PrivacyModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const ack = window.localStorage.getItem(STORAGE_KEY);
      if (!ack) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const handleAcknowledge = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* 忽略写入失败，仅关闭弹窗 */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-privacy-fade"
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* 弹窗卡片 */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 animate-privacy-pop dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            🔒
          </span>
          <h2
            id="privacy-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            隐私承诺
          </h2>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
          简历仅在你的浏览器内解析，分析完成后立即丢弃，
          <span className="font-medium text-slate-800 dark:text-slate-100">
            不存储、不上传原文
          </span>
          。你的数据安全由你掌控，请放心使用。
        </p>

        <button
          type="button"
          onClick={handleAcknowledge}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          我已知晓
        </button>

        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          勾选后本承诺将不再自动弹出（清除本站数据可重新查看）
        </p>
      </div>
    </div>
  );
}
