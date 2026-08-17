"use client";

import { useEffect } from "react";

function logTelemetryEvent(eventType: string) {
  console.log(eventType); 
}

export function useAssessmentTelemetry() {
  useEffect(() => {
    const handleKeyDown = () => logTelemetryEvent("keydown");
    const handleBeforeInput = () => logTelemetryEvent("beforeinput");
    const handleCopy = () => logTelemetryEvent("copy");
    const handlePaste = () => logTelemetryEvent("paste");
    const handleVisibilityChange = () => logTelemetryEvent("visibilitychange");

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("beforeinput", handleBeforeInput);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("beforeinput", handleBeforeInput);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}