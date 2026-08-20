import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "求职在线助手 - AI 简历诊断工具",
    short_name: "求职在线助手",
    description: "上传简历 PDF，粘贴目标岗位 JD，AI 自动解析并给出匹配度评分与可执行改进建议。免费、隐私安全。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    lang: "zh-CN",
    categories: ["productivity", "business", "education"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
