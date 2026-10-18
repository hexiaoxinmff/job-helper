import type { ReactNode } from "react";
import { ResumeProvider } from "@/lib/resume-store";
import { ProfileProvider } from "@/lib/profile";
import { DiagnosisHistoryProvider } from "@/lib/diagnosis-history";
import { TrackerProvider } from "@/lib/tracker-store";
import { RemediationProvider } from "@/lib/remediation-store";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <ResumeProvider>
      <ProfileProvider>
        <DiagnosisHistoryProvider>
          <TrackerProvider>
            <RemediationProvider>{children}</RemediationProvider>
          </TrackerProvider>
        </DiagnosisHistoryProvider>
      </ProfileProvider>
    </ResumeProvider>
  );
}
