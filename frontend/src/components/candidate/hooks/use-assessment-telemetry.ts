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

type TelemetryActivityState = "active" | "paused";

const ALNUM_TEXT_PATTERN = /^[a-z0-9]$/i;
const SPECIAL_TEXT_PATTERN = /^[.,;:'"(){}\[\]\-+=*/\\`~<>!?@#$%^&|]$/;

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

function classifyInsertedTextCharacter(character: string): "alnum" | "special" | "other" {
  if (ALNUM_TEXT_PATTERN.test(character)) {
    return "alnum";
  }

  if (SPECIAL_TEXT_PATTERN.test(character)) {
    return "special";
  }

  return "other";
}

function getDeleteCharacterCount(event: InputEvent): number {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return 0;
  }

  const selectionStart = target.selectionStart;
  const selectionEnd = target.selectionEnd;

  if (
    typeof selectionStart === "number" &&
    typeof selectionEnd === "number" &&
    selectionStart !== selectionEnd
  ) {
    return Math.max(selectionEnd - selectionStart, 1);
  }

  return 1;
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

export function useAssessmentTelemetry(
  candidateAssessmentId: string | null,
  activeQuestionId: number | null,
) {
  const accumulatorRef = useRef<TelemetryAccumulator>(createEmptyTelemetryAccumulator());
  const uniqueKeysRef = useRef<Set<string>>(new Set());
  const activityStateRef = useRef<TelemetryActivityState>("paused");
  const activeStartedAtMsRef = useRef<number | null>(null);
  const hasWindowFocusRef = useRef<boolean>(true);

  const pauseActiveTimeTracking = useCallback(() => {
    if (activityStateRef.current !== "active") {
      return;
    }

    const startedAt = activeStartedAtMsRef.current;
    if (startedAt !== null) {
      accumulatorRef.current.active_time_ms += Math.max(Date.now() - startedAt, 0);
    }

    activeStartedAtMsRef.current = null;
    activityStateRef.current = "paused";
  }, []);

  const startActiveTimeTracking = useCallback(() => {
    if (activityStateRef.current === "active") {
      return;
    }

    activeStartedAtMsRef.current = Date.now();
    activityStateRef.current = "active";
  }, []);

  const reconcileActiveTimeState = useCallback(() => {
    if (!candidateAssessmentId || activeQuestionId === null) {
      pauseActiveTimeTracking();
      return;
    }

    const shouldBeActive = !document.hidden && hasWindowFocusRef.current;

    if (shouldBeActive) {
      startActiveTimeTracking();
      return;
    }

    pauseActiveTimeTracking();
  }, [activeQuestionId, candidateAssessmentId, pauseActiveTimeTracking, startActiveTimeTracking]);

  const flushTelemetry = useCallback(() => {
    if (!candidateAssessmentId) {
      return;
    }

    const inFlightActiveTime =
      activityStateRef.current === "active" && activeStartedAtMsRef.current !== null
        ? Math.max(Date.now() - activeStartedAtMsRef.current, 0)
        : 0;

    const snapshot: TelemetryAccumulator = {
      ...accumulatorRef.current,
      active_time_ms: accumulatorRef.current.active_time_ms + inFlightActiveTime,
    };

    const payload = createTelemetryFlushPayload(candidateAssessmentId, snapshot);
    console.log(payload);
  }, [candidateAssessmentId]);

  useEffect(() => {
    if (!candidateAssessmentId) {
      return;
    }

    hasWindowFocusRef.current = document.hasFocus();
    reconcileActiveTimeState();

    const handleKeyDown = () => logTelemetryEvent("keydown");
    const handleBeforeInput = (event: InputEvent) => {
      logTelemetryEvent("beforeinput");

      if (event.inputType !== "insertText") {
        if (event.inputType.startsWith("delete")) {
          accumulatorRef.current.backspace_count += getDeleteCharacterCount(event);
        }

        return;
      }

      const insertedText = event.data ?? "";
      if (!insertedText) {
        return;
      }

      for (const character of insertedText) {
        const category = classifyInsertedTextCharacter(character);

        if (category === "alnum") {
          accumulatorRef.current.chars_alnum += 1;
          continue;
        }

        if (category === "special") {
          accumulatorRef.current.chars_special += 1;
        }
      }
    };
    const handleCopy = () => logTelemetryEvent("copy");
    const handlePaste = () => logTelemetryEvent("paste");
    const handleVisibilityChange = () => {
      logTelemetryEvent("visibilitychange");
      reconcileActiveTimeState();
    };
    const handleWindowFocus = () => {
      hasWindowFocusRef.current = true;
      reconcileActiveTimeState();
    };
    const handleWindowBlur = () => {
      hasWindowFocusRef.current = false;
      reconcileActiveTimeState();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("beforeinput", handleBeforeInput);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("blur", handleWindowBlur);

    const intervalId = window.setInterval(() => {
      flushTelemetry();
    }, 5000);

    return () => {
      pauseActiveTimeTracking();
      window.clearInterval(intervalId);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("beforeinput", handleBeforeInput);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [candidateAssessmentId, flushTelemetry, pauseActiveTimeTracking, reconcileActiveTimeState]);

  return { flushTelemetry, uniqueKeysRef, accumulatorRef };
}