// A small profanity matcher for English, Romanized Nepali and Devanagari Nepali. Pure, dependency-free, and kept in
// its own module with its word list (./lexicon.ts).
//
// What it handles: case, Unicode forms, leetspeak ("sh1t", "@ss"), stretched letters ("fuuuck", for words of 4+
// letters), letters spelled out with separators ("f.u.c.k", "f u c k"), Nepali postpositions glued on ("mujiko",
// "मुजीको"), and Devanagari spelling variants (nukta, chandrabindu vs anusvara, zero-width joiners).
// What it does not: judge context, sarcasm or slurs that are also ordinary words. That is human moderation.
import {
  DEVANAGARI_STEMS,
  DEVANAGARI_SUFFIXES,
  DEVANAGARI_WORDS,
  LATIN_STEMS,
  LATIN_SUFFIXES,
  LATIN_WORDS,
} from "./lexicon.js";

// "!" is left alone: it ends sentences far more often than it replaces an "i".
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s" };
const MIN_COLLAPSE = 4; // only words this long are also matched with stretched letters undone

const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
/** Every run of a repeated letter becomes one: "fuuuck" -> "fuck". */
const collapse = (s: string) => s.replace(/(.)\1+/g, "$1");
/** Runs of 3+ become 2, so "asss" still reads as "ass" but "as" stays "as". */
const squeeze = (s: string) => s.replace(/(.)\1{2,}/g, "$1$1");

function normalizeDevanagari(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[‌‍]/g, "") // zero-width non-joiner / joiner
    .replace(/़/g, "") // nukta
    .replace(/ँ/g, "ं"); // chandrabindu -> anusvara
}

function normalizeLatin(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[0-9@$]/g, (c) => LEET[c] ?? c);
}

const LATIN_EXACT = new Set(LATIN_WORDS.map((w) => squeeze(normalizeLatin(w))));
const LATIN_COLLAPSED = new Set(LATIN_WORDS.filter((w) => collapse(w).length >= MIN_COLLAPSE).map((w) => collapse(normalizeLatin(w))));
const LATIN_STEMS_COLLAPSED = LATIN_STEMS.map((s) => collapse(normalizeLatin(s)));
const DEV_WORDS = new Set(DEVANAGARI_WORDS.map(normalizeDevanagari));
const DEV_STEMS = DEVANAGARI_STEMS.map(normalizeDevanagari);
const DEV_SUFFIXES = DEVANAGARI_SUFFIXES.map(normalizeDevanagari);

function latinTokenMatches(token: string): boolean {
  const candidates = [token, ...LATIN_SUFFIXES.filter((s) => token.endsWith(s) && token.length - s.length >= 3).map((s) => token.slice(0, -s.length))];
  return candidates.some((t) => {
    const squeezed = squeeze(t);
    const collapsed = collapse(t);
    return (
      LATIN_EXACT.has(squeezed) ||
      (collapsed.length >= MIN_COLLAPSE && LATIN_COLLAPSED.has(collapsed)) ||
      LATIN_STEMS_COLLAPSED.some((stem) => collapsed.startsWith(stem))
    );
  });
}

function devanagariTokenMatches(token: string): boolean {
  const candidates = [token, ...DEV_SUFFIXES.filter((s) => token.endsWith(s) && token.length > s.length + 1).map((s) => token.slice(0, -s.length))];
  return candidates.some((t) => DEV_WORDS.has(t) || DEV_STEMS.some((stem) => t.startsWith(stem)));
}

/**
 * The words a text is split into for matching: Latin words (leetspeak undone) and Devanagari words, plus any letters
 * spelled out one at a time ("f.u.c.k", "f u c k") joined back into a word.
 */
export function tokenize(text: string): string[] {
  // Zero-width characters would otherwise split a word in two ("मु\u200Dजी") before it could be normalised.
  const latin = normalizeLatin(text.replace(/[\u200B-\u200D\u2060\uFEFF]/g, ""));
  // Letters (and leet digits/symbols, already mapped) form words; everything else separates them.
  const raw = latin.match(/[\p{L}\p{M}]+/gu) ?? [];
  const tokens: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= 3) tokens.push(run.join(""));
    run = [];
  };
  for (const t of raw) {
    if (isDevanagari(t)) {
      flush();
      tokens.push(normalizeDevanagari(t));
    } else if (t.length === 1) {
      run.push(t);
    } else {
      flush();
      tokens.push(t);
    }
  }
  flush();
  return tokens;
}

/** The offending words found in a text, as written after normalisation. Empty when the text is clean. */
export function findProfanity(text: string): string[] {
  if (!text) return [];
  return tokenize(text).filter((t) => (isDevanagari(t) ? devanagariTokenMatches(t) : latinTokenMatches(t)));
}

export function containsProfanity(text: string): boolean {
  return findProfanity(text).length > 0;
}

/** The word lists, for inspection or for building on (e.g. adding site-specific words before matching). */
export * as lexicon from "./lexicon.js";
