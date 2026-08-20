import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 原生构建：承载 app/api/* Route Handlers（AI 代理已迁移进站内），并正常产出浏览器页面。
  // 此前 CloudBase 静态托管用的 `output: "export"` 无法在 Vercel 上同时跑 API 路由，已移除。
  // AI 云函数（ai-proxy）逻辑已迁移至 app/api/ai-proxy/route.ts（Vercel serverless），
  // DeepSeek Key 走 Vercel 环境变量 DEEPSEEK_API_KEY，前端永远拿不到。
  // 注意：不启用 trailingSlash，避免 /api/ai-proxy 的 POST 被 308 重定向丢弃请求体。
};

export default nextConfig;
