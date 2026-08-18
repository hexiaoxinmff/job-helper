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
  // 这里用内联样式保证自带可用的外观。
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#e2e8f0",
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
            border: "1px solid #334155",
            background: "#1e293b",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>应用出错了</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#94a3b8" }}>
            发生了无法恢复的错误，请重试。
          </p>
          {error.digest && (
            <p style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
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
              background: "#2563eb",
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
