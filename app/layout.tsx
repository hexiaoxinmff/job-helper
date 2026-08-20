import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import PrivacyModal from "@/components/PrivacyModal";
import { ResumeProvider } from "@/lib/resume-store";
import { ProfileProvider } from "@/lib/profile";
import { DiagnosisHistoryProvider } from "@/lib/diagnosis-history";
import { TrackerProvider } from "@/lib/tracker-store";
import { RemediationProvider } from "@/lib/remediation-store";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  metadataBase: new URL("https://xiaoxin2026-personal-d1acf1a1fb0-1469931868.tcloudbaseapp.com"),
  title: {
    default: "求职在线助手 - AI 简历诊断工具",
    template: "%s",
  },
  description:
    "上传简历 PDF，粘贴目标岗位 JD，AI 自动解析并给出匹配度评分、雷达图与可执行的改进建议。免费、隐私安全，简历仅在本地解析。",
  keywords: ["简历诊断", "AI 简历", "求职助手", "匹配度评分", "STAR 扩写", "简历编辑器"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "求职在线助手",
    title: "求职在线助手 - AI 简历诊断工具",
    description:
      "上传简历 PDF，粘贴目标岗位 JD，AI 给出匹配度评分、雷达图与可执行的改进建议。免费、隐私安全。",
  },
  twitter: {
    card: "summary",
    title: "求职在线助手 - AI 简历诊断工具",
    description: "AI 简历诊断：匹配度评分 + 雷达图 + 可执行改进建议。免费、隐私安全。",
  },
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
              <DiagnosisHistoryProvider>
                <TrackerProvider>
                  <RemediationProvider>
                    <NavBar />
                    {children}
                    <PrivacyModal />
                  </RemediationProvider>
                </TrackerProvider>
              </DiagnosisHistoryProvider>
            </ProfileProvider>
          </ResumeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
