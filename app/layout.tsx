import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import PrivacyModal from "@/components/PrivacyModal";
import { ResumeProvider } from "@/lib/resume-store";
import { ProfileProvider } from "@/lib/profile";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "求职在线助手 - AI 简历诊断工具",
  description:
    "上传简历 PDF，粘贴目标岗位 JD，AI 自动解析并给出匹配度评分、雷达图与可执行的改进建议。免费、隐私安全，简历处理完即删。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col md:pl-56">
        <ThemeProvider>
          <ResumeProvider>
            <ProfileProvider>
              <NavBar />
              {children}
              <PrivacyModal />
            </ProfileProvider>
          </ResumeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
