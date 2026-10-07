/** A standard word is 5 characters. Minutes are elapsed time, not a fixed clock. */
export const TEST_DURATION_MS = 30_000;

export type LetterState = "pending" | "correct" | "wrong";

export type Phase = "loading" | "idle" | "running" | "done";

export function countCorrect(target: string, typed: string): number {
  const limit = Math.min(target.length, typed.length);
  let correct = 0;
  for (let i = 0; i < limit; i += 1) {
    if (target[i] === typed[i]) correct += 1;
  }
  return correct;
}

/**
 * WPM = (correct characters / 5) / minutes.
 * Minutes are elapsed milliseconds / 60000. Idle time before the first key is not included.
 */
export function wordsPerMinute(correctCharacters: number, elapsedMs: number): number {
  if (correctCharacters <= 0 || elapsedMs < 1) return 0;
  const minutes = elapsedMs / 60_000;
  return correctCharacters / 5 / minutes;
}

/** Hide the first fraction of a second, when a single key would flash an absurd rate. */
export function displayWpm(correctCharacters: number, elapsedMs: number): number | null {
  if (elapsedMs < 300) return null;
  return wordsPerMinute(correctCharacters, elapsedMs);
}

/** Accuracy = correct characters / characters typed. Untyped letters are ignored. */
export function accuracyPercent(correctCharacters: number, typedCharacters: number): number {
  if (typedCharacters <= 0) return 100;
  return (correctCharacters / typedCharacters) * 100;
}

export function formatWpm(wpm: number): string {
  if (!Number.isFinite(wpm)) return "0";
  return String(Math.round(wpm));
}

export function formatAccuracy(accuracy: number): string {
  if (!Number.isFinite(accuracy)) return "0";
  return String(Math.round(accuracy));
}

export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  return (clamped / 1000).toFixed(1);
}

export function remainingMs(elapsedMs: number, durationMs = TEST_DURATION_MS): number {
  if (elapsedMs <= 0) return durationMs;
  return Math.max(0, durationMs - elapsedMs);
}

export function elapsedForScore(elapsedMs: number, durationMs = TEST_DURATION_MS): number {
  if (elapsedMs <= 0) return 0;
  return Math.min(elapsedMs, durationMs);
}

export function letterState(expected: string | undefined, actual: string | undefined): LetterState {
  if (actual === undefined) return "pending";
  if (expected === undefined || actual !== expected) return "wrong";
  return "correct";
}

export function displayedChar(expected: string | undefined, actual: string | undefined): string {
  if (actual !== undefined && (expected === undefined || actual !== expected)) return actual;
  return expected ?? "";
}

export type LetterMark = {
  char: string;
  state: LetterState;
  space: boolean;
};

export function markLetters(target: string, typed: string): LetterMark[] {
  const total = Math.max(target.length, typed.length);
  const marks: LetterMark[] = [];
  for (let i = 0; i < total; i += 1) {
    const expected = target[i];
    const actual = typed[i];
    const char = displayedChar(expected, actual);
    marks.push({
      char,
      state: letterState(expected, actual),
      space: char === " ",
    });
  }
  return marks;
}

export function caretIndex(typedLength: number, selectionStart: number | null): number {
  if (selectionStart == null || selectionStart < 0) return typedLength;
  return Math.min(selectionStart, typedLength);
}

export function sanitizeTyped(value: string, maxLength: number): string {
  const cleaned = value.replace(/[\r\n]/g, "");
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, Math.max(0, maxLength));
}

/** A real key inserts one character. A paste or drop inserts many, and does not count. */
export function isBurstInsert(previousLength: number, nextLength: number, limit = 8): boolean {
  return nextLength - previousLength > limit;
}

export function shouldStartTimer(phase: Phase, previousLength: number, nextLength: number): boolean {
  return phase === "idle" && previousLength === 0 && nextLength > 0;
}

export function shouldCompleteSentence(typed: string, target: string, phase: Phase): boolean {
  return phase === "running" && target.length > 0 && typed === target;
}
