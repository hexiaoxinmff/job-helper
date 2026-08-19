// 前端埋点：配置 NEXT_PUBLIC_TRACKING_URL 后经 sendBeacon 上报；未配置保持 no-op，
// 避免静态托管下产生 /api/track 404 噪声。

const TRACKING_URL = process.env.NEXT_PUBLIC_TRACKING_URL || "";

export function track(event: string, meta?: Record<string, unknown>) {
  if (!TRACKING_URL) return; // 未配置埋点端点，静默
  try {
    const payload = JSON.stringify({
      event,
      ts: Date.now(),
      page: typeof window !== "undefined" ? window.location.pathname : "",
      meta: meta ?? {},
    });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(TRACKING_URL, new Blob([payload], { type: "application/json" }));
    } else if (typeof fetch !== "undefined") {
      // sendBeacon 不可用时降级为 keepalive fetch（同样不阻塞页面卸载）
      void fetch(TRACKING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* 埋点失败不影响业务 */
  }
}
