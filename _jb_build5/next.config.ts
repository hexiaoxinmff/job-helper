import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出：产出纯静态文件到 out/，可托管到 CloudBase 静态网站（免费、免备案）。
  // 所有 PDF 解析、评分、AI 调用均在浏览器端 / 云函数完成，无服务端路由。
  output: "export",
  // 目录式产物（star/index.html），兼容静态托管的 /star/ 目录服务
  trailingSlash: true,
};

export default nextConfig;
