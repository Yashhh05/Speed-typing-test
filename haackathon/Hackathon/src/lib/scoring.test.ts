import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accuracyPercent,
  caretIndex,
  countCorrect,
  displayWpm,
  elapsedForScore,
  formatAccuracy,
  formatClock,
  formatWpm,
  isBurstInsert,
  letterState,
  markLetters,
  remainingMs,
  sanitizeTyped,
  shouldCompleteSentence,
  shouldStartTimer,
  TEST_DURATION_MS,
  wordsPerMinute,
} from "./scoring.ts";

describe("words per minute", () => {
  it("uses correct characters divided by 5 per minute", () => {
    assert.equal(wordsPerMinute(125, 30_000), 50);
    assert.equal(wordsPerMinute(5, 60_000), 1);
    assert.equal(wordsPerMinute(5, 30_000), 2);
    assert.equal(wordsPerMinute(150, 15_000), 120);
  });

  it("is zero when nothing correct has been typed or the clock has not moved", () => {
    assert.equal(wordsPerMinute(0, 30_000), 0);
    assert.equal(wordsPerMinute(10, 0), 0);
    assert.equal(wordsPerMinute(10, 0.4), 0);
    assert.equal(wordsPerMinute(10, -5), 0);
  });

  it("holds the live number back for a fraction of a second", () => {
    assert.equal(displayWpm(10, 200), null);
    assert.equal(displayWpm(125, 30_000), 50);
  });
});

describe("accuracy", () => {
  it("divides correct characters by characters typed", () => {
    assert.equal(accuracyPercent(8, 10), 80);
    assert.equal(accuracyPercent(0, 4), 0);
    assert.equal(accuracyPercent(5, 6), (5 / 6) * 100);
  });

  it("does not treat an empty field as a miss", () => {
    assert.equal(accuracyPercent(0, 0), 100);
  });
});

describe("correct characters", () => {
  it("counts exact case-sensitive matches and ignores extras", () => {
    assert.equal(countCorrect("Hello", "Hello"), 5);
    assert.equal(countCorrect("Hello", "hello"), 4);
    assert.equal(countCorrect("Hello", "Hellox"), 5);
    assert.equal(countCorrect("Hello", "He"), 2);
    assert.equal(countCorrect("Hello", ""), 0);
  });
});

describe("clock", () => {
  it("is a 30 second test", () => {
    assert.equal(TEST_DURATION_MS, 30_000);
    assert.equal(remainingMs(0), 30_000);
    assert.equal(remainingMs(1_000), 29_000);
    assert.equal(remainingMs(30_000), 0);
    assert.equal(remainingMs(45_000), 0);
    assert.equal(formatClock(30_000), "30.0");
    assert.equal(formatClock(18_400), "18.4");
  });

  it("caps the scored duration at 30 seconds", () => {
    assert.equal(elapsedForScore(18_400), 18_400);
    assert.equal(elapsedForScore(31_200), 30_000);
    assert.equal(elapsedForScore(0), 0);
  });
});

describe("letters", () => {
  it("marks pending, correct, and wrong characters", () => {
    assert.deepEqual(markLetters("ab", ""), [
      { char: "a", state: "pending", space: false },
      { char: "b", state: "pending", space: false },
    ]);
    assert.deepEqual(markLetters("ab", "a"), [
      { char: "a", state: "correct", space: false },
      { char: "b", state: "pending", space: false },
    ]);
    assert.deepEqual(markLetters("ab", "ax"), [
      { char: "a", state: "correct", space: false },
      { char: "x", state: "wrong", space: false },
    ]);
    assert.deepEqual(markLetters("ab", "abz"), [
      { char: "a", state: "correct", space: false },
      { char: "b", state: "correct", space: false },
      { char: "z", state: "wrong", space: false },
    ]);
    assert.equal(letterState("A", "a"), "wrong");
    assert.equal(letterState(" ", " "), "correct");
  });

  it("shows a mistyped space as a space so the red mark has a shape", () => {
    assert.deepEqual(markLetters("a b", "axb"), [
      { char: "a", state: "correct", space: false },
      { char: "x", state: "wrong", space: false },
      { char: "b", state: "correct", space: false },
    ]);
    assert.deepEqual(markLetters("ab", "a "), [
      { char: "a", state: "correct", space: false },
      { char: " ", state: "wrong", space: true },
    ]);
  });
});

describe("typing rules", () => {
  it("treats a long insert as a paste, not as typing", () => {
    assert.equal(isBurstInsert(0, 1), false);
    assert.equal(isBurstInsert(4, 3), false);
    assert.equal(isBurstInsert(0, 40), true);
  });

  it("starts the timer only on the first character of an idle test", () => {
    assert.equal(shouldStartTimer("idle", 0, 1), true);
    assert.equal(shouldStartTimer("idle", 0, 0), false);
    assert.equal(shouldStartTimer("running", 0, 1), false);
    assert.equal(shouldStartTimer("idle", 2, 3), false);
    assert.equal(shouldStartTimer("done", 0, 1), false);
    assert.equal(shouldStartTimer("loading", 0, 1), false);
  });

  it("ends early only when the running text matches the sentence", () => {
    assert.equal(shouldCompleteSentence("Hello.", "Hello.", "running"), true);
    assert.equal(shouldCompleteSentence("Hello.x", "Hello.", "running"), false);
    assert.equal(shouldCompleteSentence("Hell", "Hello.", "running"), false);
    assert.equal(shouldCompleteSentence("Hello.", "Hello.", "idle"), false);
  });

  it("strips line breaks and extra characters past the allowance", () => {
    assert.equal(sanitizeTyped("ab\ncd", 10), "abcd");
    assert.equal(sanitizeTyped("abcdef", 4), "abcd");
  });

  it("keeps the caret inside the typed text", () => {
    assert.equal(caretIndex(4, 2), 2);
    assert.equal(caretIndex(4, 9), 4);
    assert.equal(caretIndex(4, null), 4);
  });
});

describe("rounding", () => {
  it("rounds the numbers that are shown", () => {
    assert.equal(formatWpm(60.4), "60");
    assert.equal(formatWpm(60.5), "61");
    assert.equal(formatAccuracy(79.6), "80");
    assert.equal(formatWpm(Number.NaN), "0");
  });
});
