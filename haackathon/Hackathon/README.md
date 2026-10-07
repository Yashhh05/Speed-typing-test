# Typing Speed Test

A 30-second typing test that runs in the browser. No account, no server, no API keys.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

## How a run works

- You get a random sentence. Restart always loads a different one.
- The clock stays at 30.0 until the first character. Shift, arrows, and backspace on an empty field do not start it.
- Correct letters turn green. Mistakes turn red, including extra characters past the end of the sentence. Matching is case-sensitive.
- Backspace removes that character from the score.
- Paste is disabled.
- The run ends at 30 seconds, or sooner if the sentence is exactly complete. An early finish is scored on the time you actually took, so a short perfect run is not diluted by leftover seconds.
- WPM = (correct characters / 5) / minutes.
- Accuracy = correct characters / characters typed. Letters you have not reached are ignored.
- The best score is the highest WPM in this browser, with accuracy as the tie-break. It is stored in `localStorage` under `typing-speed-test-best`.

## Scripts

```bash
npm test
npm run lint
npm run build
```
