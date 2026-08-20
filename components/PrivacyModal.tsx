"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "job-helper:privacy-ack";

// ===== 外部 store：确认状态（localStorage）供 useSyncExternalStore 订阅 =====
// 首次访问未确认 → 弹窗；确认后写入并通知订阅者关闭。
type Listener = () => void;
const ackListeners = new Set<Listener>();

function getAckSnapshot(): boolean {
  try {
    return !!window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

function subscribeAck(listener: Listener) {
  ackListeners.add(listener);
  return () => ackListeners.delete(listener);
}

function acknowledge() {
  try {
    window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* 忽略写入失败，仅关闭弹窗 */
  }
  ackListeners.forEach((l) => l());
}

/**
 * 开发者隐私承诺弹窗：首次使用自动弹出一次，
 * 点击「我已知晓」后写入 localStorage，后续不再自动弹出。
 */
export default function PrivacyModal() {
  const acked = useSyncExternalStore(
    useCallback((l: Listener) => subscribeAck(l), []),
    getAckSnapshot,
    () => true // SSR / hydration 阶段视为已确认，不弹窗
  );

  // 已确认过则不渲染
  if (acked) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-privacy-fade"
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" />

      {/* 弹窗卡片 */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-neutral-200 animate-privacy-pop dark:bg-neutral-900 dark:ring-neutral-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            🔒
          </span>
          <h2
            id="privacy-title"
            className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
          >
            隐私承诺
          </h2>
        </div>

        <p className="mt-4 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          简历默认仅在你的浏览器内解析、
          <span className="font-medium text-neutral-800 dark:text-neutral-100">不落库、不上传</span>；
          仅在你在「私人档案 → 云端同步」主动开启「同步简历」后，简历才会以
          <span className="font-medium text-neutral-800 dark:text-neutral-100">AES-256 加密形式</span>
          上云（密钥仅存本浏览器，服务端不可读），可随时关闭。
          开启 AI 增强时，文本会经云函数代理转发给 AI 服务商用于生成诊断建议，
          <span className="font-medium text-neutral-800 dark:text-neutral-100">不留存、不记录</span>，你可随时在诊断页关闭该功能。
          你的数据安全由你掌控，请放心使用。
        </p>

        <button
          type="button"
          onClick={acknowledge}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        >
          我已知晓
        </button>

        <p className="mt-3 text-center text-xs text-neutral-400 dark:text-neutral-500">
          勾选后本承诺将不再自动弹出（清除本站数据可重新查看）
        </p>
      </div>
    </div>
  );
}
