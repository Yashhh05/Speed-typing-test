export function TestHeader() {
  return (
    <header>
      <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
        Typing speed test · 30 seconds
      </p>
      <h1 className="mt-3 max-w-2xl font-heading text-[2.15rem] leading-[1.05] text-balance italic sm:text-5xl">
        How fast and accurate are you?
      </h1>
      <p id="typing-help" className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
        Type the sentence. The timer starts on your first key, then you have 30 seconds. Correct
        letters turn green and mistakes turn red. Paste is off. On a phone, tap the sentence so the
        keyboard opens.
      </p>
    </header>
  );
}
