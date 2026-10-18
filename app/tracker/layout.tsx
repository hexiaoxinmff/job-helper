import type { ReactNode } from "react";
import { ResumeProvider } from "@/lib/resume-store";
import { TrackerProvider } from "@/lib/tracker-store";

export default function TrackerLayout({ children }: { children: ReactNode }) {
  return (
    <ResumeProvider>
      <TrackerProvider>{children}</TrackerProvider>
    </ResumeProvider>
  );
}
