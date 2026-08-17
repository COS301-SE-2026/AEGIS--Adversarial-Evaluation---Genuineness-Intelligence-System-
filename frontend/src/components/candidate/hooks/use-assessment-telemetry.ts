"use client";

import { useEffect, useRef } from "react";

type TelemetryAccumulator = {
  active_time_ms: number;
  unique_keys_count: number;
  chars_alnum: number;
  chars_special: number;
  backspace_count: number;
  copy_event_count: number;
  paste_event_count: number;
  paste_char_count: number;
  focus_loss_count: number;
  focus_loss_time_ms: number;
};

function createEmptyTelemetryAccumulator(): TelemetryAccumulator {
  return {
    active_time_ms: 0,
    unique_keys_count: 0,
    chars_alnum: 0,
    chars_special: 0,
    backspace_count: 0,
    copy_event_count: 0,
    paste_event_count: 0,
    paste_char_count: 0,
    focus_loss_count: 0,
    focus_loss_time_ms: 0,
  };
}

function logTelemetryEvent(eventType: string) {
  console.log(eventType);
}

export function useAssessmentTelemetry() {
  const accumulatorRef = useRef<TelemetryAccumulator>(createEmptyTelemetryAccumulator());
  const uniqueKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    //I will use these later
    void accumulatorRef.current;
    void uniqueKeysRef.current;

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