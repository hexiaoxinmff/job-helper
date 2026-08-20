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

        <p className="mt-4 text-[15px] font-medium text-neutral-800 dark:text-neutral-100">
          你的简历，只属于你。
        </p>

        <ul className="mt-4 space-y-3">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-[11px] font-bold text-success-700 dark:bg-success-950 dark:text-success-300">
              ✓
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">本地解析</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                默认所有处理都在你的浏览器内完成，不落库、不上传。
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              ②
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">可控上云</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                仅当你在「私人档案 → 云端同步」主动开启「同步简历」时，简历才以 AES-256 加密上云（密钥仅存本机，服务端不可读），可随时关闭。
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-[11px] font-bold text-accent-700 dark:bg-accent-950 dark:text-accent-300">
              ✦
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">AI 仅转发</p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                开启 AI 增强时，文本经云函数代理转发给 AI 服务商生成建议，不留存、不记录，可随时关闭。
              </p>
            </div>
          </li>
        </ul>

        <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
          你的数据，由你完全掌控。
        </p>

        <button
          type="button"
          onClick={acknowledge}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
        >
          我知晓并开始 ›
        </button>

        <p className="mt-3 text-center text-xs text-neutral-400 dark:text-neutral-500">
          之后不再自动弹出（清除本站数据可重新查看）
        </p>
      </div>
    </div>
  );
}
