"use client";

import { createContext, useContext, useState } from "react";

type AssessmentTimerContextValue = {
  endTime: string | null;
  setEndTime: (endTime: string) => void;
};

const AssessmentTimerContext = createContext<
  AssessmentTimerContextValue | undefined
>(undefined);

export function AssessmentTimerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [endTime, setEndTime] = useState<string | null>(null);

  return (
    <AssessmentTimerContext.Provider value={{ endTime, setEndTime }}>
      {children}
    </AssessmentTimerContext.Provider>
  );
}

export function useAssessmentTimer() {
  const contetxt = useContext(AssessmentTimerContext);
  if (!contetxt) {
    throw new Error(
      "useAssessmentTimer must be used within AssessmentTimerProvider",
    );
  }
  return contetxt;
}
