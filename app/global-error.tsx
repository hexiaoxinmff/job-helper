"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[global error] 根布局渲染异常：", error);
  }, [error]);

  // global-error 会替换根布局，无法使用全局样式与主题切换，
  // 这里用内联样式保证自带可用的外观；颜色优先读根 CSS 变量（--jh-*），
  // 变量缺失时回退到兜底色值（与变量定义一致），避免全局 CSS 未加载时白屏。
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--jh-bg, #0f172a)",
          color: "var(--jh-fg, #e2e8f0)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "90%",
            padding: 32,
            borderRadius: 16,
            border: "1px solid var(--jh-border-strong, #334155)",
            background: "var(--jh-bg-elevated, #1e293b)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>应用出错了</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "var(--jh-fg-muted, #94a3b8)" }}>
            发生了无法恢复的错误，请重试。
          </p>
          {error.digest && (
            <p style={{ marginTop: 4, fontSize: 12, color: "var(--jh-fg-faint, #64748b)" }}>
              错误码：{error.digest}
            </p>
          )}
          <button
            onClick={retry}
            style={{
              marginTop: 24,
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              background: "var(--jh-primary-600, #2563eb)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
