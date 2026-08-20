"use client";

import { useCallback, useRef, useState } from "react";

/**
 * 剪贴板复制 hook：统一复制逻辑与「已复制」反馈状态。
 * @param timeoutMs 反馈状态自动清除的时长（默认 1500ms）
 */
export function useCopy(timeoutMs = 1500) {
  const [copiedKey, setCopiedKey] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string, key = "default"): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopiedKey(""), timeoutMs);
        return true;
      } catch {
        return false; // 剪贴板不可用则静默
      }
    },
    [timeoutMs]
  );

  return { copiedKey, copy };
}
