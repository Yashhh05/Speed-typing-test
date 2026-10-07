import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SENTENCES, pickSentence } from "./sentences.ts";

const ALLOWED = /^[A-Za-z ,.'-]+$/;

describe("sentences", () => {
  it("has a pool of distinct typeable sentences", () => {
    assert.ok(SENTENCES.length >= 12);
    assert.equal(new Set(SENTENCES).size, SENTENCES.length);
    for (const sentence of SENTENCES) {
      assert.equal(sentence, sentence.trim(), sentence);
      assert.equal(sentence.endsWith("."), true, sentence);
      assert.equal(sentence.includes("  "), false, sentence);
      assert.match(sentence, ALLOWED, sentence);
      assert.ok(
        sentence.length >= 150 && sentence.length <= 220,
        `${sentence.length} chars: ${sentence}`,
      );
    }
  });

  it("picks a different sentence on restart", () => {
    const first = SENTENCES[0];
    assert.equal(pickSentence({ previous: first, random: () => 0 }), SENTENCES[1]);
    assert.equal(pickSentence({ random: () => 0 }), SENTENCES[0]);
    assert.equal(
      pickSentence({ previous: SENTENCES.at(-1), random: () => 0.999999 }),
      SENTENCES.at(-2),
    );
  });
});
