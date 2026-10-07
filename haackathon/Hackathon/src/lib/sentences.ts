/** Original sentences. Straight punctuation only, long enough to fill most of 30 seconds. */
export const SENTENCES: readonly string[] = [
  "The morning ferry was late again, so the commuters on the pier shared a thermos of tea and argued gently about whether the fog would lift before the noon whistle.",
  "Nora kept the shop key on a red ribbon and checked the lock twice, because the street cats had learned how to nudge the door open when the latch failed to catch.",
  "By the time the rain reached the station, every bench was taken and a violinist under the clock played the same four bars until the express finally rolled in.",
  "The baker wrote the day's loaves on the window in white chalk, then wiped off the rye because the mill had sent flour that smelled faintly of rain and wet sacks.",
  "Jonah borrowed a ladder from the neighbor, pruned the fig tree before breakfast, and left a bowl of the ripest fruit on the step as quiet payment for the favor.",
  "The library lamp hummed softly while Amina copied the old map by hand, tracing each river twice so the thinner ink would not fade before spring arrived in town.",
  "When the power blinked out, the diner switched to candles and the cook called orders across the pass as if nothing important had changed in the kitchen at all.",
  "A yellow bus sighed at the corner, the driver waved at the crossing guard, and three late children broke into a run without once dropping their armful of books.",
  "The tailor saved every leftover scrap in a tin labeled winter, and on quiet afternoons she stitched those scraps into quilts for the small clinic across the square.",
  "Clouds piled over the ridge in tall gray columns, and the vineyard crew picked the last rows faster, talking only when someone found a crate that had already split.",
  "Leah sanded the old oak table until the grain showed through, then oiled it with a soft cloth and ate an early dinner so the fresh finish could dry overnight.",
  "The post office line curled past the stamp machine, where a child pressed every button and announced each price aloud as if calling the next train on the board.",
  "After the match the players sat in the cool grass and retold the same lucky pass, each version a little braver than the one that had come just before it.",
  "The hardware store smelled like rope and cedar, and the owner found the right bolt by touch before he bothered to switch on the light in the narrow back room.",
  "Iris labeled the seed jars in careful print, lined them along the sunny shelf, and promised herself she would sow the basil seeds before the week was over.",
  "A bicycle leaned against the bakery window with a basket full of letters, while its owner frowned at a new parking sign that had appeared sometime during the night.",
];

export function pickSentence(options?: {
  previous?: string;
  random?: () => number;
}): string {
  const random = options?.random ?? Math.random;
  const previous = options?.previous;
  const pool = previous ? SENTENCES.filter((sentence) => sentence !== previous) : SENTENCES;
  const source = pool.length > 0 ? pool : SENTENCES;
  const raw = random();
  const unit = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 0.999999) : 0;
  const index = Math.min(source.length - 1, Math.floor(unit * source.length));
  return source[index] ?? SENTENCES[0];
}
