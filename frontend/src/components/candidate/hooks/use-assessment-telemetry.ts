"use client";

import { useCallback, useEffect, useRef } from "react";

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

type TelemetryFlushPayload = {
  candidate_assessment_id: string;
  delta: Omit<TelemetryAccumulator, "unique_keys_count">;
  cumulative: Pick<TelemetryAccumulator, "unique_keys_count">;
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

function createTelemetryFlushPayload(
  candidateAssessmentId: string,
  accumulator: TelemetryAccumulator,
): TelemetryFlushPayload {
  return {
    candidate_assessment_id: candidateAssessmentId,
    delta: {
      active_time_ms: accumulator.active_time_ms,
      chars_alnum: accumulator.chars_alnum,
      chars_special: accumulator.chars_special,
      backspace_count: accumulator.backspace_count,
      copy_event_count: accumulator.copy_event_count,
      paste_event_count: accumulator.paste_event_count,
      paste_char_count: accumulator.paste_char_count,
      focus_loss_count: accumulator.focus_loss_count,
      focus_loss_time_ms: accumulator.focus_loss_time_ms,
    },
    cumulative: {
      unique_keys_count: accumulator.unique_keys_count,
    },
  };
}

function logTelemetryEvent(eventType: string) {
  console.log(eventType);
}

export function useAssessmentTelemetry(candidateAssessmentId: string | null) {
  const accumulatorRef = useRef<TelemetryAccumulator>(createEmptyTelemetryAccumulator());
  const uniqueKeysRef = useRef<Set<string>>(new Set());

  const flushTelemetry = useCallback(() => {
    if (!candidateAssessmentId) {
      return;
    }

    const payload = createTelemetryFlushPayload(candidateAssessmentId, accumulatorRef.current);
    console.log(payload);
  }, [candidateAssessmentId]);

  useEffect(() => {
    if (!candidateAssessmentId) {
      return;
    }

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

    const intervalId = window.setInterval(() => {
      flushTelemetry();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("beforeinput", handleBeforeInput);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [candidateAssessmentId, flushTelemetry]);

  return { flushTelemetry, uniqueKeysRef, accumulatorRef };
}