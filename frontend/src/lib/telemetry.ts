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

export type PasteTelemetryTarget = "code-editor";

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