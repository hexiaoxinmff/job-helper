// 前端埋点：当前为纯静态托管，无后端接收，置为安全 no-op。
export function track(_event: string, _meta?: Record<string, unknown>) {
  // 静态部署无埋点后端，预留接口，不发起网络请求（避免 /api/track 404 噪声）。
}
