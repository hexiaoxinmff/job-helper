"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

/**
 * 应用内确认弹窗：替代 window.confirm / alert，提供一致的视觉与键盘/可访问性体验。
 *
 * - 背景点击关闭、ESC 关闭、Enter 确认
 * - role="dialog" + aria-modal + aria-labelledby + aria-describedby
 * - 破坏性操作传 `danger` 变体，主按钮显示红色
 */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  cancelLabel?: string;
  okLabel?: string;
  /** 破坏性操作（如清空/删除）置 true，主按钮变红 */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel = "取消",
  okLabel = "确定",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // ESC 关闭 + Enter 确认；打开时把焦点放到取消按钮（防误触破坏性操作）
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  // 打开时锁定 body 滚动，关闭恢复（避免长内容在背景滚）
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onCancel();
    },
    [onCancel]
  );

  if (!open) return null;

  const titleId = "confirm-dialog-title";
  const descId = "confirm-dialog-desc";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-privacy-fade"
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" aria-hidden="true" />

      {/* 弹窗卡片 */}
      <div
        ref={dialogRef}
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
            className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300"
          >
            {description}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button type="button" variant={danger ? "danger" : "primary"} size="md" onClick={onConfirm}>
            {okLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}