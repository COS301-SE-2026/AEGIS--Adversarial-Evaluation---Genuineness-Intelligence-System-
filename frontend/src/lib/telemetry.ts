export type KeyboardEventCategory =
    "alnum"
	| "backspace"
	| "delete"
	| "enter"
	| "tab"
	| "modifier"
	| "arrow"
	| "whitespace"
	| "punctuation"
	| "other";

export type KeyboardTelemetryEvent = {
	type: "keyboard";
	category: KeyboardEventCategory;
	timestamp: number;
};

export type PasteTelemetryTarget = "code-editor" | "fill-in-the-blank";

export type PasteTelemetryEvent = {
  type: "paste";
  target: PasteTelemetryTarget;
  length: number;
  timestamp: number;
};


export type CopyTelemetrySource = "question" | "answer";

export type CopyTelemetryEvent = {
  type: "copy";
  copiedLength: number;
  source: CopyTelemetrySource;
  timestamp: number;
};

export type ClickTelemetryTarget =
  "run-code-button"
  | "next-question-button"
  | "submit-button"
  | "start-assessment-button"
  | "other";

export type ClickTelemetryEvent = {
  type: "click";
  target: ClickTelemetryTarget;
  timestamp: number;
};


const ALNUM_KEY_PATTERN = /^[a-z0-9]$/i;
const PUNCTUATION_KEY_PATTERN = /^[.,;:'"(){}\[\]\-+=*/\\`~<>!?@#$%^&|]$/;

const SPECIAL_KEY_MAP: Record<string, KeyboardEventCategory> = {
  Backspace: "backspace",
  Delete: "delete",
  Enter: "enter",
  Tab: "tab",
  Control: "modifier",
  Shift: "modifier",
  Alt: "modifier",
  Meta: "modifier",
  ArrowUp: "arrow",
  ArrowDown: "arrow",
  ArrowLeft: "arrow",
  ArrowRight: "arrow",
  " ": "whitespace",
  Spacebar: "whitespace"
};

export function classifyKeyboardKey(key: string): KeyboardEventCategory {
  if (ALNUM_KEY_PATTERN.test(key)) {
    return "alnum";
  }

  if (PUNCTUATION_KEY_PATTERN.test(key)) {
    return "punctuation";
  }

  return SPECIAL_KEY_MAP[key] ?? "other";
}

export function createKeyboardTelemetryEvent(
    event: Pick<KeyboardEvent, "key">): KeyboardTelemetryEvent {
  return {
    type: "keyboard",
    category: classifyKeyboardKey(event.key),
    timestamp: Date.now(),
  };
}

export function createPasteTelemetryEvent(
  pastedText: string,
  target: PasteTelemetryTarget = "code-editor"): PasteTelemetryEvent {
  return {
    type: "paste",
    target,
    length: pastedText.length,
    timestamp: Date.now(),
  };
}

export function createCopyTelemetryEvent(
  copiedText: string,
  source: CopyTelemetrySource): CopyTelemetryEvent {
  return {
    type: "copy",
    copiedLength: copiedText.length,
    source,
    timestamp: Date.now(),
  };
}

function normalizeTelemetryLabel(label: string): string {
  return label.trim().toLowerCase();
}

export function classifyClickTarget(label: string): ClickTelemetryTarget {
  const normalizedLabel = normalizeTelemetryLabel(label);

  switch (normalizedLabel) {
  case "run-code":
    return "run-code-button";

  case "next-question":
    return "next-question-button";

  case "submit-assessment":
    return "submit-button";

  case "start-assessment":
    return "start-assessment-button";

  default:
    return "other";
}
}

export function createClickTelemetryEvent(label: string): ClickTelemetryEvent {
  return {
    type: "click",
    target: classifyClickTarget(label),
    timestamp: Date.now(),
  };
}