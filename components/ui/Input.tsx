import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * 全站主输入控件统一样式（设计系统 §7.3）：
 * - 主输入（Input/Textarea）一律 rounded-xl，与辅助控件（select，rounded-lg）区分层级
 * - 焦点态：ring-2 ring-primary-500（textarea 淡环 ring-primary-100 视觉更轻）
 * - 页面内禁止手写同款类，一律引用本常量，保证状态与视觉完全一致
 */
export const fieldClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-primary-900/40";

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClass} resize-y ${className}`} {...rest} />;
}
