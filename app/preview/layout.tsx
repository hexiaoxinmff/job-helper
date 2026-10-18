import type { ReactNode } from "react";
import { ResumeProvider } from "@/lib/resume-store";

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <ResumeProvider>{children}</ResumeProvider>;
}
