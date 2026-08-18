import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "求职在线助手 - AI 简历诊断工具",
  description:
    "上传简历 PDF，粘贴目标岗位 JD，AI 自动解析并给出匹配度评分、雷达图与可执行的改进建议。免费、隐私安全，简历处理完即删。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:pl-56">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
