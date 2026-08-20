"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/Input";

/**
 * 应用内输入弹窗：替代 window.prompt，提供一致的视觉与键盘/可访问性体验。
 *
 * 视觉/行为与 ConfirmDialog 对齐，便于版本条等场景统一：
 * - 背景点击关闭、ESC 关闭、Enter 提交（form submit）
 * - role="dialog" + aria-modal + aria-labelledby + aria-describedby
 * - 按钮一律使用站内 Button 组件（不写 inline 样式）；主操作 variant=primary，取消 variant=outline
 */
export interface PromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  /** 主按钮文案，默认「确定」 */
  confirmLabel?: string;
  cancelLabel?: string;
  /** 留空时是否仍允许提交（默认 false，留空即视为取消） */
  allowEmpty?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function PromptDialog({
  open,
  title,
  description,
  defaultValue = "",
  placeholder,
  confirmLabel = "确定",
  cancelLabel = "取消",
  allowEmpty = false,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  // 派生式同步：父组件再次打开并传入新的 defaultValue 时，在渲染阶段重置 value，
  // 比 useEffect 同步 setState 更稳（React 19 react-hooks 规则禁止后者）。
  const [prevDefault, setPrevDefault] = useState(defaultValue);
  if (defaultValue !== prevDefault) {
    setPrevDefault(defaultValue);
    setValue(defaultValue);
  }
  const inputRef = useRef<HTMLInputElement>(null);

  // 用 ref 保存最新的 onCancel，避免父组件传新函数引用时反复卸载/重建 keydown 监听器
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  // 每次打开时把焦点送进输入框（不重置 value，由上面的派生同步处理）
  useEffect(() => {
    if (!open) return;
    // 等下一个 tick 让对话框挂载完成再聚焦，避免无焦点影响键盘可达性
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 打开时锁定 body 滚动，关闭恢复（与 ConfirmDialog 一致）
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allowEmpty && !value.trim()) {
      // 留空即视为取消，与原 window.prompt 留空确认时的「回空串」不一致——但调用方原本会传
      // undefined 跳过，这里也用 trim 后判空，保持行为直观
      return;
    }
    onConfirm(value);
  };

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onCancel();
    },
    [onCancel]
  );

  if (!open) return null;

  const titleId = "prompt-dialog-title";
  const descId = description ? "prompt-dialog-desc" : undefined;
  const inputId = "prompt-dialog-input";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-privacy-fade"
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />

      {/* 弹窗卡片 */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-neutral-200 animate-privacy-pop dark:bg-neutral-900 dark:ring-neutral-700"
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          {title}
        </h2>
        {description && (
          <p
            id={descId}
            className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400"
          >
            {description}
          </p>
        )}

        <div className="mt-4">
          <input
            id={inputId}
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            aria-label={title}
            className={fieldClass}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="primary" size="md">
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
