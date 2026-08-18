import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 输出：打包出包含 Node.js 服务端的独立目录（.next/standalone），
  // 便于 CloudBase 云托管 / Docker 直接运行，无需在容器内再装依赖。
  output: "standalone",
};

export default nextConfig;
