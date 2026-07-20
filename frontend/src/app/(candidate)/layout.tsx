import { Navbar } from "@/components/candidate/layouts/navbar";
import { AssessmentTimerProvider } from "@/components/candidate/context/assessment-timer";
import { ReactNode } from "react";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <AssessmentTimerProvider>
      <div>
        <Navbar />
        <main className="px-26">{children}</main>
      </div>
    </AssessmentTimerProvider>
  );
}
