import { Navbar } from "@/components/candidate/layouts/navbar";
import { AssessmentTimerProvider } from "@/components/candidate/context/assessment-timer";
import { AccessGate } from "@/components/auth/auth-access-gate";
import { ReactNode } from "react";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <AssessmentTimerProvider>
      <AccessGate allowedRole="CANDIDATE">
        <div>
          <Navbar />
          <main className="px-26">{children}</main>
        </div>
      </AccessGate>
    </AssessmentTimerProvider>
  );
}
