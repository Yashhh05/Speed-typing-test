"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode, type SyntheticEvent } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestHeader } from "@/components/test-header";
import { readBest, writeBestIfBetter, type Score } from "@/lib/best-score";
import { pickSentence } from "@/lib/sentences";
import {
  TEST_DURATION_MS,
  accuracyPercent,
  caretIndex,
  countCorrect,
  displayWpm,
  elapsedForScore,
  formatAccuracy,
  formatClock,
  formatWpm,
  isBurstInsert,
  markLetters,
  remainingMs,
  sanitizeTyped,
  shouldCompleteSentence,
  shouldStartTimer,
  wordsPerMinute,
  type Phase,
} from "@/lib/scoring";

type EndReason = "time" | "complete";

type Result = {
  wpm: number;
  accuracy: number;
  correct: number;
  typedCount: number;
  elapsedMs: number;
  remainingMs: number;
};

const EXTRA_CHAR_ALLOWANCE = 24;

let bootSentence: string | null = null;

function sentenceForFirstPaint(): string {
  if (!bootSentence) bootSentence = pickSentence();
  return bootSentence;
}

function storedBest(): { best: Score | null; error: string | null } {
  if (typeof window === "undefined") return { best: null, error: null };
  const read = readBest(window.localStorage);
  if (!read.ok) {
    return { best: null, error: "Best score could not be read in this browser." };
  }
  return { best: read.best, error: null };
}

export function TypingTest() {
  const [phase, setPhase] = useState<Exclude<Phase, "loading">>("idle");
  const [target, setTarget] = useState(sentenceForFirstPaint);
  const [typed, setTyped] = useState("");
  const [caret, setCaret] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [remainingMsNow, setRemainingMsNow] = useState(TEST_DURATION_MS);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [endReason, setEndReason] = useState<EndReason | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [best, setBest] = useState<Score | null>(() => storedBest().best);
  const [bestIsNew, setBestIsNew] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(() => storedBest().error);

  const phaseRef = useRef(phase);
  const targetRef = useRef(target);
  const typedRef = useRef("");
  const startedAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const completeTest = useCallback((reason: EndReason) => {
    if (finishedRef.current || phaseRef.current !== "running") return;
    finishedRef.current = true;
    phaseRef.current = "done";

    const start = startedAtRef.current ?? performance.now();
    const elapsed = elapsedForScore(performance.now() - start);
    const remaining = reason === "time" ? 0 : remainingMs(elapsed);
    const typedValue = typedRef.current;
    const correct = countCorrect(targetRef.current, typedValue);
    const typedCount = typedValue.length;
    const wpm = wordsPerMinute(correct, elapsed);
    const accuracy = accuracyPercent(correct, typedCount);

    setRemainingMsNow(remaining);
    setElapsedMs(elapsed);
    setResult({ wpm, accuracy, correct, typedCount, elapsedMs: elapsed, remainingMs: remaining });
    setEndReason(reason);
    setPhase("done");

    if (typedCount === 0) return;

    const outcome = writeBestIfBetter(window.localStorage, { wpm, accuracy });
    if (!outcome.ok) {
      setStorageError("Best score could not be saved in this browser.");
      return;
    }
    setStorageError(null);
    setBest(outcome.best);
    setBestIsNew(outcome.isNew);
  }, []);

  useEffect(() => {
    if (phase !== "running" || startedAt == null) return;
    const id = window.setInterval(() => {
      if (phaseRef.current !== "running" || startedAtRef.current == null) return;
      const elapsed = performance.now() - startedAtRef.current;
      const remaining = remainingMs(elapsed);
      setElapsedMs(elapsedForScore(elapsed));
      setRemainingMsNow(remaining);
      if (remaining <= 0) completeTest("time");
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, startedAt, completeTest]);

  useEffect(() => {
    if (phase !== "idle") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    textareaRef.current?.focus();
  }, [phase, target]);

  useEffect(() => {
    if (phase === "done") resultRef.current?.focus();
  }, [phase]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (phaseRef.current === "done") return;

    const value = sanitizeTyped(event.target.value, targetRef.current.length + EXTRA_CHAR_ALLOWANCE);
    const previousLength = typedRef.current.length;

    if (isBurstInsert(previousLength, value.length)) {
      event.target.value = typedRef.current;
      return;
    }

    if (shouldStartTimer(phaseRef.current, previousLength, value.length)) {
      const now = performance.now();
      startedAtRef.current = now;
      finishedRef.current = false;
      phaseRef.current = "running";
      setStartedAt(now);
      setBestIsNew(false);
      setEndReason(null);
      setResult(null);
      setElapsedMs(0);
      setRemainingMsNow(TEST_DURATION_MS);
      setPhase("running");
    }

    typedRef.current = value;
    setTyped(value);
    setCaret(caretIndex(value.length, event.target.selectionStart));

    if (shouldCompleteSentence(value, targetRef.current, phaseRef.current)) {
      completeTest("complete");
    }
  }

  function syncCaret(event: SyntheticEvent<HTMLTextAreaElement>) {
    setCaret(caretIndex(typedRef.current.length, event.currentTarget.selectionStart));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter") event.preventDefault();
    if (phaseRef.current === "done" && event.key !== "Tab") event.preventDefault();
  }

  function restart() {
    const next = pickSentence({ previous: targetRef.current });
    phaseRef.current = "idle";
    finishedRef.current = false;
    startedAtRef.current = null;
    targetRef.current = next;
    typedRef.current = "";
    setTarget(next);
    setTyped("");
    setCaret(0);
    setStartedAt(null);
    setRemainingMsNow(TEST_DURATION_MS);
    setElapsedMs(0);
    setPhase("idle");
    setEndReason(null);
    setResult(null);
    setBestIsNew(false);
    textareaRef.current?.focus();
  }

  const marks = markLetters(target, typed);
  const showCaret = phase === "idle" || phase === "running";
  const caretAt = Math.min(caret, marks.length);
  const liveCorrect = countCorrect(target, typed);
  const liveWpm =
    phase === "done" && result ? result.wpm : phase === "running" ? displayWpm(liveCorrect, elapsedMs) : null;
  const accuracy =
    phase === "done" && result
      ? result.accuracy
      : typed.length > 0
        ? accuracyPercent(liveCorrect, typed.length)
        : null;
  const urgent = remainingMsNow <= 5_000 && phase !== "idle";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-8 sm:py-14">
      <a
        href="#typing-input"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to typing
      </a>

      <TestHeader />

      <dl
        data-phase={phase}
        className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4"
      >
        <Stat label="Timer" hint={timerHint(phase, endReason)}>
          <span data-testid="typing-timer" className={urgent ? "text-destructive" : undefined}>
            {formatClock(remainingMsNow)}
          </span>
        </Stat>
        <Stat label="WPM" hint={wpmHint(phase)}>
          <span data-testid="typing-wpm" data-wpm={liveWpm ?? ""}>
            {liveWpm == null ? "—" : formatWpm(liveWpm)}
          </span>
        </Stat>
        <Stat label="Accuracy" hint="Correct ÷ typed">
          <span data-testid="typing-accuracy">{accuracy == null ? "—" : `${formatAccuracy(accuracy)}%`}</span>
        </Stat>
        <Stat label="Best" hint={best ? `${formatAccuracy(best.accuracy)}% accurate` : "No best yet"}>
          <span data-testid="typing-best" className="inline-flex items-baseline gap-2">
            {best ? formatWpm(best.wpm) : "—"}
            {bestIsNew ? (
              <span className="best-flag font-sans text-[10px] tracking-[0.14em] uppercase not-italic">New</span>
            ) : null}
          </span>
        </Stat>
      </dl>

      <section className="mt-6">
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
          <div
            className={urgent ? "h-full bg-destructive" : "h-full bg-foreground"}
            style={{ width: `${(remainingMsNow / TEST_DURATION_MS) * 100}%` }}
          />
        </div>

        <div className="relative min-h-40 rounded-2xl border border-border bg-card px-4 py-5 focus-within:ring-3 focus-within:ring-ring/50 sm:px-6 sm:py-7">
          <p id="sentence-text" className="sr-only">
            Sentence: {target}
          </p>
          <p
            data-testid="typing-passage"
            aria-hidden="true"
            className="font-mono text-[1.2rem] leading-8 break-words whitespace-pre-wrap text-foreground sm:text-[1.45rem] sm:leading-9"
          >
            {marks.map((mark, index) => (
              <span key={index}>
                {showCaret && index === caretAt ? <Caret /> : null}
                <span
                  data-state={mark.state}
                  className={letterClass(mark.state, mark.space, showCaret && index === caretAt)}
                >
                  {mark.char === " " ? " " : mark.char}
                </span>
              </span>
            ))}
            {showCaret && caretAt === marks.length ? <Caret /> : null}
          </p>
          <textarea
            id="typing-input"
            ref={textareaRef}
            data-testid="typing-input"
            value={typed}
            readOnly={phase === "done"}
            aria-label="Type the sentence"
            aria-describedby="typing-help sentence-text"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            inputMode="text"
            data-1p-ignore="true"
            data-lpignore="true"
            onChange={handleChange}
            onSelect={syncCaret}
            onKeyUp={syncCaret}
            onClick={syncCaret}
            onKeyDown={handleKeyDown}
            onPaste={(event) => event.preventDefault()}
            onDrop={(event) => event.preventDefault()}
            className="absolute inset-0 z-10 h-full w-full resize-none rounded-2xl border-0 bg-transparent p-0 text-base text-transparent caret-transparent outline-none"
          />
        </div>
        <p className="mt-2 font-mono text-xs text-muted-foreground" data-testid="typing-progress">
          {Math.min(typed.length, target.length)} / {target.length} characters
        </p>
      </section>

      {phase === "done" && result ? (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          data-testid="typing-result"
          className="mt-6 rounded-2xl border border-border bg-card px-4 py-4 outline-none sm:px-5"
        >
          <h2 className="font-heading text-2xl italic">{endReason === "complete" ? "Sentence complete" : "Time's up"}</h2>
          <p className="mt-1 text-base">
            {formatWpm(result.wpm)} WPM at {formatAccuracy(result.accuracy)}% accuracy.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.correct} correct {result.correct === 1 ? "character" : "characters"} in{" "}
            {(result.elapsedMs / 1000).toFixed(1)} seconds. {resultNote(result, bestIsNew, storageError)}
          </p>
        </div>
      ) : null}

      {storageError ? (
        <p role="alert" data-testid="storage-error" className="mt-4 text-sm text-destructive">
          {storageError}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" size="lg" className="h-10 px-4" onClick={restart} data-testid="typing-restart">
          <RotateCcw data-icon="inline-start" />
          Restart
        </Button>
        <p className="text-sm text-muted-foreground">Restart loads a new sentence and keeps your best.</p>
      </div>

      <footer className="mt-10 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          WPM is correct characters divided by 5, then divided by minutes since your first key.
          Accuracy is correct characters divided by the characters you typed. Letters you have not
          reached yet stay out of both numbers. Backspace takes a character back. If you finish the
          sentence before the clock runs out, minutes are the time you actually took. Your best WPM
          stays in this browser.
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <div className="bg-card px-4 py-3 sm:py-4">
      <dt className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-mono text-3xl leading-none tabular-nums">{children}</dd>
      <p className="mt-2 min-h-4 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Caret() {
  return <span className="typing-caret" aria-hidden="true" />;
}

function letterClass(state: "pending" | "correct" | "wrong", space: boolean, current: boolean) {
  const parts = ["rounded-sm"];
  if (state === "correct") parts.push("letter-correct");
  else if (state === "wrong") parts.push("letter-wrong");
  else parts.push("letter-pending");
  if (space) parts.push("inline-block min-w-[0.35em]");
  if (current && state === "pending") parts.push("letter-current");
  return parts.join(" ");
}

function timerHint(phase: Exclude<Phase, "loading">, endReason: EndReason | null): string {
  if (phase === "idle") return "Starts on first key";
  if (phase === "running") return "Counting";
  if (endReason === "complete") return "Finished early";
  return "Time's up";
}

function wpmHint(phase: Exclude<Phase, "loading">): string {
  if (phase === "idle") return "Correct ÷ 5 ÷ min";
  if (phase === "running") return "Live";
  return "Final";
}

function resultNote(result: Result, bestIsNew: boolean, storageError: string | null): string {
  if (storageError) return "The best score was not saved.";
  if (result.typedCount === 0) return "This run was not saved.";
  if (bestIsNew) return "New best saved in this browser.";
  return "Best score unchanged.";
}
