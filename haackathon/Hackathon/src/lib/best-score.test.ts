import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BEST_SCORE_KEY,
  isBetterScore,
  normalizeScore,
  readBest,
  writeBestIfBetter,
  type ScoreStore,
} from "./best-score.ts";

function memoryStore(initial?: string): ScoreStore & { dump: () => string | null } {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(BEST_SCORE_KEY, initial);
  return {
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    dump() {
      return data.get(BEST_SCORE_KEY) ?? null;
    },
  };
}

describe("best score", () => {
  it("rounds before comparing and keeps the higher WPM", () => {
    assert.deepEqual(normalizeScore({ wpm: 60.4, accuracy: 97.2 }), { wpm: 60, accuracy: 97 });
    assert.equal(isBetterScore({ wpm: 60.6, accuracy: 90 }, { wpm: 60, accuracy: 99 }), true);
    assert.equal(isBetterScore({ wpm: 60.4, accuracy: 99 }, { wpm: 60, accuracy: 90 }), true);
    assert.equal(isBetterScore({ wpm: 60.2, accuracy: 90 }, { wpm: 60, accuracy: 90 }), false);
    assert.equal(isBetterScore({ wpm: 50, accuracy: 100 }, { wpm: 70, accuracy: 80 }), false);
  });

  it("rejects impossible scores", () => {
    assert.equal(normalizeScore({ wpm: Number.NaN, accuracy: 10 }), null);
    assert.equal(normalizeScore({ wpm: 10, accuracy: 140 }), null);
    assert.equal(isBetterScore({ wpm: -1, accuracy: 10 }, null), false);
  });

  it("saves a first score and replaces it only when the new one is better", () => {
    const store = memoryStore();
    const first = writeBestIfBetter(store, { wpm: 64.2, accuracy: 96.4 });
    assert.deepEqual(first, { ok: true, best: { wpm: 64, accuracy: 96 }, isNew: true });
    assert.equal(store.dump(), JSON.stringify({ wpm: 64, accuracy: 96 }));

    const worse = writeBestIfBetter(store, { wpm: 40, accuracy: 100 });
    assert.equal(worse.isNew, false);
    assert.deepEqual(worse.best, { wpm: 64, accuracy: 96 });

    const tiedWpmBetterAccuracy = writeBestIfBetter(store, { wpm: 64.1, accuracy: 99 });
    assert.equal(tiedWpmBetterAccuracy.isNew, true);
    assert.deepEqual(tiedWpmBetterAccuracy.best, { wpm: 64, accuracy: 99 });
  });

  it("treats corrupt storage as empty and reports a thrown read", () => {
    const corrupt = memoryStore("{not json");
    assert.deepEqual(readBest(corrupt), { ok: true, best: null });

    const thrown: ScoreStore = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    assert.deepEqual(readBest(thrown), { ok: false, best: null });
    assert.deepEqual(writeBestIfBetter(thrown, { wpm: 10, accuracy: 10 }), {
      ok: false,
      best: null,
      isNew: false,
    });
  });
});
