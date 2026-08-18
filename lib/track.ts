/**
 * 前端匿名埋点工具。
 * 只上报事件名与少量 meta（无简历/JD 内容）。
 * 使用 sendBeacon 优先（页面关闭前也能送达），失败降级 fetch。
 */

const UID_KEY = "job-helper-uid";

function getUid(): string {
  try {
    let uid = localStorage.getItem(UID_KEY);
    if (!uid) {
      uid = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(UID_KEY, uid);
    }
    return uid;
  } catch {
    return "u-anon";
  }
}

export function track(event: string, meta?: Record<string, unknown>) {
  const payload = { event, uid: getUid(), meta };
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon("/api/track", JSON.stringify(payload));
      if (ok) return;
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // 埋点失败静默，不影响主流程
  }
}
