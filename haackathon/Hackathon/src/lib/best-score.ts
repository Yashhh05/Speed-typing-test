export const BEST_SCORE_KEY = "typing-speed-test-best";

export type Score = {
  wpm: number;
  accuracy: number;
};

export type ScoreStore = Pick<Storage, "getItem" | "setItem">;

export type ReadBestResult = {
  ok: boolean;
  best: Score | null;
};

export type WriteBestResult = {
  ok: boolean;
  best: Score | null;
  isNew: boolean;
};

export function normalizeScore(score: Score): Score | null {
  if (!Number.isFinite(score.wpm) || !Number.isFinite(score.accuracy)) return null;
  const wpm = Math.round(score.wpm);
  const accuracy = Math.round(score.accuracy);
  if (wpm < 0 || accuracy < 0 || accuracy > 100) return null;
  return { wpm, accuracy };
}

function isScore(value: unknown): value is Score {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.wpm === "number" &&
    typeof record.accuracy === "number" &&
    normalizeScore({ wpm: record.wpm, accuracy: record.accuracy }) !== null
  );
}

export function isBetterScore(next: Score, previous: Score | null): boolean {
  const normalized = normalizeScore(next);
  if (!normalized) return false;
  if (!previous) return true;
  if (normalized.wpm > previous.wpm) return true;
  if (normalized.wpm === previous.wpm && normalized.accuracy > previous.accuracy) return true;
  return false;
}

export function readBest(storage: Pick<Storage, "getItem">): ReadBestResult {
  let raw: string | null;
  try {
    raw = storage.getItem(BEST_SCORE_KEY);
  } catch {
    return { ok: false, best: null };
  }
  if (!raw) return { ok: true, best: null };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isScore(parsed)) return { ok: true, best: null };
    return { ok: true, best: normalizeScore(parsed) };
  } catch {
    return { ok: true, best: null };
  }
}

export function writeBestIfBetter(storage: ScoreStore, next: Score): WriteBestResult {
  const normalized = normalizeScore(next);
  try {
    const current = readBest(storage);
    if (!current.ok) return { ok: false, best: null, isNew: false };
    if (!normalized || !isBetterScore(normalized, current.best)) {
      return { ok: true, best: current.best, isNew: false };
    }
    storage.setItem(BEST_SCORE_KEY, JSON.stringify(normalized));
    return { ok: true, best: normalized, isNew: true };
  } catch {
    return { ok: false, best: null, isNew: false };
  }
}
