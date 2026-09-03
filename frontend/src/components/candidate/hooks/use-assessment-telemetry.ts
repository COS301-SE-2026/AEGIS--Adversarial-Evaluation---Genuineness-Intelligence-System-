"use client";

import { useCallback, useEffect, useRef } from "react";
import { apiPost } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";

type TelemetryAccumulator = {
  active_time_ms: number;
  unique_keys_count: number;
  chars_alnum: number;
  chars_special: number;
  backspace_count: number;
  copy_event_count: number;
  copy_char_count: number;
  paste_event_count: number;
  paste_char_count: number;
  focus_loss_count: number;
  focus_loss_time_ms: number;
};

type TelemetryFlushPayload = {
  candidate_assessment_id: number;
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
    copy_char_count: 0,
    paste_event_count: 0,
    paste_char_count: 0,
    focus_loss_count: 0,
    focus_loss_time_ms: 0,
  };
}

function createEmptyDeltaAccumulator(): TelemetryAccumulator {
  return {
    ...createEmptyTelemetryAccumulator(),
    unique_keys_count: 0,
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
  candidateAssessmentId: number,
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
      copy_char_count: accumulator.copy_char_count,
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

function buildTelemetrySnapshot(
  accumulator: TelemetryAccumulator,
  activeStartedAtMs: number | null,
  isActive: boolean,
  uniqueKeysCount: number,
): TelemetryAccumulator {
  const inFlightActiveTime = isActive && activeStartedAtMs !== null
    ? Math.max(Date.now() - activeStartedAtMs, 0)
    : 0;

  return {
    ...accumulator,
    active_time_ms: accumulator.active_time_ms + inFlightActiveTime,
    unique_keys_count: uniqueKeysCount,
  };
}

export function useAssessmentTelemetry(
  candidateAssessmentId: number | null,
  candidateResponseId: number | null,
  activeQuestionId: number | null,
) {
  const accumulatorRef = useRef<TelemetryAccumulator>(createEmptyTelemetryAccumulator());
  const uniqueKeysRef = useRef<Set<string>>(new Set());
  const activityStateRef = useRef<TelemetryActivityState>("paused");
  const activeStartedAtMsRef = useRef<number | null>(null);
  const hasWindowFocusRef = useRef<boolean>(true);
  const focusLossStartedAtMsRef = useRef<number | null>(null);
  const questionContextRef = useRef<string | null>(null);
  const hasFlushedFinalStateRef = useRef<boolean>(false);

  const clearDeltaState = useCallback(() => {
    accumulatorRef.current = createEmptyDeltaAccumulator();
    accumulatorRef.current.unique_keys_count = uniqueKeysRef.current.size;
  }, []);

  const recordPasteEvent = useCallback((pastedText: string) => {
    accumulatorRef.current.paste_event_count += 1;
    accumulatorRef.current.paste_char_count += pastedText.length;
  }, []);

  const recordDeleteEvent = useCallback((deletedCharacterCount: number) => {
    accumulatorRef.current.backspace_count += Math.max(deletedCharacterCount, 1);
  }, []);

  const clearQuestionState = useCallback(() => {
    uniqueKeysRef.current = new Set();
    accumulatorRef.current = createEmptyTelemetryAccumulator();
    activityStateRef.current = "paused";
    activeStartedAtMsRef.current = null;
    focusLossStartedAtMsRef.current = null;
    hasFlushedFinalStateRef.current = false;
  }, []);

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
    if (!candidateAssessmentId || candidateResponseId === null || activeQuestionId === null) {
      pauseActiveTimeTracking();
      return;
    }

    const shouldBeActive = !document.hidden && hasWindowFocusRef.current;

    if (shouldBeActive) {
      startActiveTimeTracking();
      return;
    }

    pauseActiveTimeTracking();
  }, [activeQuestionId, candidateAssessmentId, candidateResponseId, pauseActiveTimeTracking, startActiveTimeTracking]);

  function getCopiedText(event: ClipboardEvent): string {
    const clipboardText = event.clipboardData?.getData("text/plain");

      if (clipboardText && clipboardText.length > 0) {
        return clipboardText;
      }

      return window.getSelection()?.toString() ?? "";
    }

  function isInsideCodeEditor(event: ClipboardEvent): boolean {
    const target = event.target;
    
    if (!(target instanceof Node)) {
      return false;
    }

    const element =
      target instanceof Element ? target : target.parentElement;

    if (!element) {
      return false;
    }

    return Boolean(element.closest(".monaco-editor"));
  }

  const recordCopyEvent = useCallback((copiedText: string) => {
    accumulatorRef.current.copy_event_count += 1;
    accumulatorRef.current.copy_char_count += copiedText.length;
  }, []);

  const flushTelemetry = useCallback(async () => {
    if (!candidateAssessmentId || candidateResponseId === null) {
      return;
    }

    const snapshot = buildTelemetrySnapshot(
      accumulatorRef.current,
      activeStartedAtMsRef.current,
      activityStateRef.current === "active",
      uniqueKeysRef.current.size,
    );

    const payload = createTelemetryFlushPayload(candidateAssessmentId, snapshot);
    const authToken = getToken() ?? undefined;

    try {
      await apiPost<{
        candidate_response_id: number;
        updated_at: string;
      }, typeof payload>(
        `/api/v1/candidate-responses/${candidateResponseId}/metrics/flush`,
        payload,
        authToken ? { authToken } : {},
      );

      clearDeltaState();

      if (activityStateRef.current === "active") {
        activeStartedAtMsRef.current = Date.now();
      }
    } catch (error) {
      console.error("Failed to flush telemetry", error);
    }
  }, [candidateAssessmentId, candidateResponseId, clearDeltaState]);

  const flushTelemetryKeepAlive = useCallback(async () => {
    if (!candidateAssessmentId || candidateResponseId === null) {
      return;
    }

    if (hasFlushedFinalStateRef.current) {
      return;
    }

    pauseActiveTimeTracking();

    const snapshot = buildTelemetrySnapshot(
      accumulatorRef.current,
      activeStartedAtMsRef.current,
      false,
      uniqueKeysRef.current.size,
    );

    const payload = createTelemetryFlushPayload(candidateAssessmentId, snapshot);
    const authToken = getToken() ?? undefined;

    try {
      await apiPost<{
        candidate_response_id: number;
        updated_at: string;
      }, typeof payload>(
        `/api/v1/candidate-responses/${candidateResponseId}/metrics/flush`,
        payload,
        {
          authToken,
          keepalive: true,
        },
      );

      clearDeltaState();
      hasFlushedFinalStateRef.current = true;
    } catch (error) {
      console.error("Failed to flush telemetry keepalive", error);
    }
  }, [
    candidateAssessmentId,
    candidateResponseId,
    clearDeltaState,
    pauseActiveTimeTracking,
  ]);

  useEffect(() => {
    if (!candidateAssessmentId) {
      return;
    }

    const questionContext = `${activeQuestionId ?? "none"}:${candidateResponseId ?? "none"}`;
    if (questionContextRef.current !== questionContext) {
      questionContextRef.current = questionContext;
      clearQuestionState();
    }

    hasWindowFocusRef.current = document.hasFocus();
    reconcileActiveTimeState();

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      uniqueKeysRef.current.add(key);

      accumulatorRef.current.unique_keys_count = uniqueKeysRef.current.size;
    };

    
    const handleBeforeInput = (event: InputEvent) => {
  
      if (event.inputType !== "insertText") {
        if (event.inputType.startsWith("delete")) {
          recordDeleteEvent(getDeleteCharacterCount(event));
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
    
    const handleCopy = (event: ClipboardEvent) => {

      if (isInsideCodeEditor(event)) {
        return;
      }

      const copiedText = getCopiedText(event);
      recordCopyEvent(copiedText);
    };

    const handlePaste = (event: ClipboardEvent) => {

      const pastedText = event.clipboardData?.getData("text/plain") ?? "";
      recordPasteEvent(pastedText);
};

    const handleVisibilityChange = () => {


      if (document.hidden) {
        if (focusLossStartedAtMsRef.current === null) {
          focusLossStartedAtMsRef.current = Date.now();
          accumulatorRef.current.focus_loss_count += 1;
        }
        void flushTelemetryKeepAlive();
        return;
      }

      const startedAt = focusLossStartedAtMsRef.current;
      if (startedAt !== null) {
        accumulatorRef.current.focus_loss_time_ms += Math.max(Date.now() - startedAt, 0);
        focusLossStartedAtMsRef.current = null;
      }
      reconcileActiveTimeState();
    };

    const handlePageHide = () => {
      void flushTelemetryKeepAlive();
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
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("blur", handleWindowBlur);

    const intervalId = window.setInterval(() => {
      void flushTelemetry();
    }, 5000);

    return () => {
      pauseActiveTimeTracking();
      window.clearInterval(intervalId);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("beforeinput", handleBeforeInput);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [
    activeQuestionId,
    candidateAssessmentId,
    candidateResponseId,
    clearQuestionState,
    flushTelemetryKeepAlive,
    flushTelemetry,
    pauseActiveTimeTracking,
    reconcileActiveTimeState,
    recordCopyEvent,
    recordDeleteEvent,
    recordPasteEvent,
  ]);

  return {
    flushTelemetry,
    flushTelemetryKeepAlive,
    recordCopyEvent,
    recordDeleteEvent,
    recordPasteEvent,
    uniqueKeysRef,
    accumulatorRef,
  };
}