import { Navbar } from "@/components/candidate/layouts/navbar";
import { ReactNode } from "react";

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      <main className="px-26">
        {children}
      </main>
    </div>
  );
}
