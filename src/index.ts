import {
  ALLOWED,
  DEVANAGARI_SUFFIXES,
  INFIXES,
  LATIN_SUFFIXES,
  PHRASES,
  STEMS,
  WORDS,
  type Language,
  type LexiconEntry,
  type Strictness,
} from "./lexicon.js";

export type { Language, Strictness } from "./lexicon.js";

export interface FilterOptions {
  /** Which languages to check. Defaults to all three. */
  languages?: readonly Language[];
  /** How much to catch. Defaults to "standard". */
  strictness?: Strictness;
  /** More words to flag, at every strictness. Matched like the built-in words: leetspeak, stretching, postpositions. */
  extraWords?: readonly string[];
  /** Words never to flag, such as names on your site. A word here is also allowed with a postposition. */
  allowWords?: readonly string[];
}

/** One place where profanity was found in the original text. */
export interface ProfanityMatch {
  /** The matched text exactly as it appears in the input, e.g. "F.U.C.K". */
  text: string;
  /** The normalized form that was matched, e.g. "fuck". The same value findProfanity returns. */
  normalized: string;
  /** Start index in the input, in UTF-16 code units like String.prototype.slice. */
  start: number;
  /** End index in the input, exclusive. */
  end: number;
}

export interface CensorOptions {
  /** Replaces each character of a match, except whitespace. Defaults to "*". */
  mask?: string;
  /** Returns the replacement for a whole match. Takes precedence over mask. */
  replace?: (match: ProfanityMatch) => string;
}

/** The result of scanning one text: inspect it, then censor it without scanning again. */
export interface ProfanityCheck {
  /** The text that was checked. */
  readonly text: string;
  /** Whether any profanity was found. */
  readonly hasProfanity: boolean;
  /** The normalized words found, without duplicates. The same as findProfanity. */
  readonly words: string[];
  /** Every match with its position, sorted by position. The same as findProfanityMatches. */
  readonly matches: ProfanityMatch[];
  /** The text with every match masked. */
  censor(options?: CensorOptions): string;
}

export interface ProfanityFilter {
  check(text: string): ProfanityCheck;
  containsProfanity(text: string): boolean;
  findProfanity(text: string): string[];
  findProfanityMatches(text: string): ProfanityMatch[];
  censor(text: string, options?: CensorOptions): string;
}

const LANGUAGES: readonly Language[] = ["english", "romanized", "devanagari"];
const STRICTNESS_LEVEL: Record<Strictness, number> = { lenient: 0, standard: 1, strict: 2 };

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "9": "g", "@": "a", "$": "s", "€": "e",
};

// Cyrillic and Greek letters that look like Latin ones, so "fuсk" with a Cyrillic с still reads as "fuck".
const CONFUSABLES: Record<string, string> = {
  "а": "a", "в": "b", "е": "e", "ё": "e", "к": "k", "м": "m", "н": "h", "о": "o", "р": "p", "с": "c", "т": "t",
  "у": "y", "х": "x", "ѕ": "s", "і": "i", "ї": "i", "ј": "j", "ԁ": "d", "α": "a", "β": "b", "ε": "e", "ι": "i",
  "κ": "k", "ν": "v", "ο": "o", "ρ": "p", "τ": "t", "υ": "u", "χ": "x",
};

const MIN_COLLAPSE = 4;

const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const collapse = (s: string) => s.replace(/(.)\1+/g, "$1");
const squeeze = (s: string) => s.replace(/(.)\1{2,}/g, "$1$1");

// Romanized Nepali writes छ as chh or x. Romanized entries and tokens are both folded to x before they're compared,
// so xakka matches chhakka. It also keeps छ apart from च once letters are collapsed, so chhod ("leave") no longer
// matches the stem chod.
const romanize = (s: string) => squeeze(s).replace(/chh/g, "x");

/**
 * Normalized text, plus the span of the original text that each normalized UTF-16 unit came from, so a match
 * found in the normalized text can be traced back to what the user typed.
 */
interface Normalized {
  text: string;
  starts: number[];
  ends: number[];
}

const ZERO_WIDTH = /[​-‍⁠﻿]/;
// "!" stands for "i" only between two letters or digits, so a sentence-final "!" stays punctuation.
const BANG_FOR_I = /(?<=[\p{L}\p{N}])!+(?=[\p{L}\p{N}])/gu;

function normalizeChar(ch: string): string {
  if (ZERO_WIDTH.test(ch)) return "";
  if (isDevanagari(ch)) {
    // Decompose so a precomposed nukta letter (ऩ) loses its nukta too, and fold chandrabindu into anusvara.
    return ch.normalize("NFD").replace(/़/g, "").replace(/ँ/g, "ं");
  }
  // Accents are removed, so "fück" reads as "fuck".
  const folded = ch.normalize("NFKC").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return [...folded].map((c) => LEET[c] ?? CONFUSABLES[c] ?? c).join("");
}

function normalize(input: string): Normalized {
  let text = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const ch of input) {
    const out = normalizeChar(ch);
    text += out;
    for (let k = 0; k < out.length; k++) {
      starts.push(offset);
      ends.push(offset + ch.length);
    }
    offset += ch.length;
  }

  // Replace each run of "!" between letters with one "i" spanning the whole run.
  let result = "";
  const resultStarts: number[] = [];
  const resultEnds: number[] = [];
  let last = 0;
  for (const m of text.matchAll(BANG_FOR_I)) {
    const i = m.index!;
    result += text.slice(last, i) + "i";
    resultStarts.push(...starts.slice(last, i), starts[i]);
    resultEnds.push(...ends.slice(last, i), ends[i + m[0].length - 1]);
    last = i + m[0].length;
  }
  if (last === 0) return { text, starts, ends };
  result += text.slice(last);
  resultStarts.push(...starts.slice(last));
  resultEnds.push(...ends.slice(last));
  return { text: result, starts: resultStarts, ends: resultEnds };
}

const normalizeText = (s: string) => normalize(s).text;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Turns a token into an anchored regex where each "*" stands for one hidden letter.
const wildcardRegex = (s: string) =>
  new RegExp(`^${s.replace(/[*+?^${}()|[\]\\]/g, (m) => (m === "*" ? "." : "\\" + m))}$`, "i");

interface Tables {
  latinExact: Set<string>;
  latinCollapsed: Set<string>;
  latinStems: string[];
  romanExact: Set<string>;
  romanCollapsed: Set<string>;
  romanStems: string[];
  /** Every Latin word and stem, unfolded, for wildcard tokens. */
  wildWords: string[];
  wildStems: string[];
  infixes: string[];
  /** The infixes with no doubled letter, which are also looked for in the collapsed token. */
  plainInfixes: string[];
  allowed: Set<string>;
  devWords: Set<string>;
  devStems: string[];
  devAllowed: Set<string>;
  phrases: RegExp[];
}

function buildTables(options: FilterOptions): Tables {
  const languages = new Set(options.languages ?? LANGUAGES);
  for (const l of languages) {
    if (!LANGUAGES.includes(l)) throw new TypeError(`Unknown language "${l}". Use one of: ${LANGUAGES.join(", ")}.`);
  }
  const strictness = options.strictness ?? "standard";
  const level = STRICTNESS_LEVEL[strictness];
  if (level === undefined) {
    throw new TypeError(`Unknown strictness "${strictness}". Use one of: ${Object.keys(STRICTNESS_LEVEL).join(", ")}.`);
  }

  const extraWords = stringList(options.extraWords, "extraWords").map(normalizeText);
  const allowWords = [...ALLOWED, ...stringList(options.allowWords, "allowWords")].map(normalizeText);

  const active = (entries: readonly LexiconEntry[], language: Language) =>
    languages.has(language)
      ? entries
          .filter((e) => e.language === language && STRICTNESS_LEVEL[e.strictness] <= level)
          .map((e) => normalizeText(e.text))
      : [];

  // Extra words count as English: matched as they are, without the Romanized spelling folds.
  const englishWords = [...active(WORDS, "english"), ...extraWords.filter((w) => !isDevanagari(w))];
  const romanWords = active(WORDS, "romanized").map(romanize);
  const englishStems = active(STEMS, "english");
  const romanStems = active(STEMS, "romanized");
  const infixes = active(INFIXES, "english").map(squeeze);

  return {
    latinExact: new Set(englishWords.map(squeeze)),
    latinCollapsed: new Set(englishWords.map(collapse).filter((w) => w.length >= MIN_COLLAPSE)),
    latinStems: englishStems.map(collapse),
    romanExact: new Set(romanWords),
    romanCollapsed: new Set(romanWords.map(collapse).filter((w) => w.length >= MIN_COLLAPSE)),
    romanStems: romanStems.map((s) => collapse(romanize(s))),
    wildWords: [...englishWords, ...active(WORDS, "romanized")].map(squeeze),
    wildStems: [...englishStems, ...romanStems].map(collapse),
    infixes,
    plainInfixes: infixes.filter((i) => collapse(i) === i),
    allowed: new Set(allowWords.filter((w) => !isDevanagari(w)).map(squeeze)),
    devWords: new Set([...active(WORDS, "devanagari"), ...extraWords.filter(isDevanagari)]),
    devStems: active(STEMS, "devanagari"),
    devAllowed: new Set(allowWords.filter(isDevanagari)),
    phrases: [...active(PHRASES, "english"), ...active(PHRASES, "romanized"), ...active(PHRASES, "devanagari")].map((p) => {
      const body = p.trim().split(/\s+/).map(escapeRegex).join("\\s+");
      return new RegExp(`(?:^|[^\\p{L}\\p{N}])(${body})(?![\\p{L}\\p{N}])`, "giud");
    }),
  };
}

function stringList(value: readonly string[] | undefined, name: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((w) => typeof w !== "string")) {
    throw new TypeError(`${name} must be an array of strings.`);
  }
  return value.map((w) => w.trim()).filter(Boolean);
}

function wildcardTokenMatches(tables: Tables, token: string): boolean {
  if (!token.includes("*")) return false;

  const cleanToken = token.replace(/^\*+|\*+$/g, "");
  if (!/[\p{L}]/u.test(cleanToken)) return false;

  // "*" on both ends is markdown emphasis ("*sh*t*"). On one end only, it may also hide a first or last letter ("*ss").
  const emphasis = token.startsWith("*") && token.endsWith("*");
  const tokens = emphasis || cleanToken === token ? [cleanToken] : [cleanToken, token];
  const forms = tokens.flatMap((t) => [squeeze(t), collapse(t)]);

  return forms.some((f) => {
    const regexPattern = wildcardRegex(f);
    if (tables.wildWords.some((w) => regexPattern.test(w))) return true;

    return tables.wildStems.some((stem) => {
      if (f.length < stem.length) return false;
      return wildcardRegex(f.slice(0, stem.length)).test(stem);
    });
  });
}

function latinTokenMatches(tables: Tables, token: string): boolean {
  const candidates = [token];
  for (const s of LATIN_SUFFIXES) {
    if (token.endsWith(s) && token.length - s.length >= 3) {
      candidates.push(token.slice(0, -s.length));
      break;
    }
  }

  if (candidates.some((t) => tables.allowed.has(squeeze(t)))) return false;

  return candidates.some((t) => {
    const squeezed = squeeze(t);
    const collapsed = collapse(t);
    const roman = romanize(t);
    const romanCollapsed = collapse(roman);
    return (
      tables.latinExact.has(squeezed) ||
      (collapsed.length >= MIN_COLLAPSE && tables.latinCollapsed.has(collapsed)) ||
      tables.latinStems.some((stem) => collapsed.startsWith(stem)) ||
      tables.romanExact.has(roman) ||
      (romanCollapsed.length >= MIN_COLLAPSE && tables.romanCollapsed.has(romanCollapsed)) ||
      tables.romanStems.some((stem) => romanCollapsed.startsWith(stem)) ||
      tables.infixes.some((i) => squeezed.includes(i)) ||
      tables.plainInfixes.some((i) => collapsed.includes(i)) ||
      wildcardTokenMatches(tables, t)
    );
  });
}

function devanagariTokenMatches(tables: Tables, token: string): boolean {
  const candidates = [token];
  for (const s of DEVANAGARI_SUFFIXES) {
    if (token.endsWith(s) && token.length > s.length + 1) {
      candidates.push(token.slice(0, -s.length));
      break;
    }
  }

  if (candidates.some((t) => tables.devAllowed.has(t))) return false;
  return candidates.some((t) => tables.devWords.has(t) || tables.devStems.some((stem) => t.startsWith(stem)));
}

/** A token with the span of the original text it came from. */
interface Span {
  value: string;
  start: number;
  end: number;
}

function tokenSpans(n: Normalized): Span[] {
  const tokens: Span[] = [];
  let run: Span[] = [];

  // Three or more single letters in a row ("f.u.c.k", "f u c k") are read as one word.
  const flush = () => {
    if (run.length >= 3) {
      tokens.push({ value: run.map((t) => t.value).join(""), start: run[0].start, end: run[run.length - 1].end });
    }
    run = [];
  };

  for (const m of n.text.matchAll(/[\p{L}\p{M}*]+/gu)) {
    const i = m.index!;
    const t = { value: m[0], start: n.starts[i], end: n.ends[i + m[0].length - 1] };
    if (isDevanagari(t.value)) {
      flush();
      tokens.push(t);
    } else if (t.value.length === 1) {
      run.push(t);
    } else {
      flush();
      tokens.push(t);
    }
  }
  flush();
  return tokens;
}

// Characters that can split a word without a space: "sh.it", "fu-ck", "b_i_tch".
const GLUE = /^[._\-~'`]+$/;
const MAX_GLUED_PIECES = 6;
const MAX_GLUED_LENGTH = 12;

/**
 * Runs of Latin letters split only by GLUE characters, read as one word. A run is joined only if one of its pieces is
 * three letters or fewer and the joined word is at most 12 letters, so "shital.shrestha" in an email address stays
 * two words.
 */
function gluedSpans(n: Normalized): Span[] {
  const runs: { value: string; from: number; to: number }[] = [];
  for (const m of n.text.matchAll(/[\p{L}\p{M}*]+/gu)) {
    if (!isDevanagari(m[0])) runs.push({ value: m[0], from: m.index!, to: m.index! + m[0].length });
  }

  const spans: Span[] = [];
  let group: typeof runs = [];
  const flush = () => {
    const length = group.reduce((sum, r) => sum + r.value.length, 0);
    if (
      group.length >= 2 &&
      group.length <= MAX_GLUED_PIECES &&
      length <= MAX_GLUED_LENGTH &&
      group.some((r) => r.value.length <= 3)
    ) {
      spans.push({
        value: group.map((r) => r.value).join(""),
        start: n.starts[group[0].from],
        end: n.ends[group[group.length - 1].to - 1],
      });
    }
    group = [];
  };
  for (const r of runs) {
    const prev = group[group.length - 1];
    if (!prev || !GLUE.test(n.text.slice(prev.to, r.from))) flush();
    group.push(r);
  }
  flush();
  return spans;
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  return tokenSpans(normalize(text)).map((t) => t.value);
}

/** Every match, words first and then phrases, in the order found. */
function scan(tables: Tables, text: string): ProfanityMatch[] {
  if (!text) return [];

  const n = normalize(text);
  const match = (normalized: string, start: number, end: number): ProfanityMatch => ({
    text: text.slice(start, end),
    normalized,
    start,
    end,
  });

  const found: ProfanityMatch[] = [];

  for (const t of tokenSpans(n)) {
    if (isDevanagari(t.value) ? devanagariTokenMatches(tables, t.value) : latinTokenMatches(tables, t.value)) {
      found.push(match(t.value, t.start, t.end));
    }
  }

  // A glued word is only read joined when none of its pieces matched on its own.
  for (const g of gluedSpans(n)) {
    if (found.some((m) => m.start < g.end && g.start < m.end)) continue;
    if (latinTokenMatches(tables, g.value)) found.push(match(g.value, g.start, g.end));
  }

  for (const re of tables.phrases) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(n.text)) !== null) {
      const [from, to] = m.indices![1];
      found.push(match(m[1], n.starts[from], n.ends[to - 1]));
    }
  }

  return found;
}

const unique = (matches: ProfanityMatch[]) => [...new Set(matches.map((m) => m.normalized))];

const byPosition = (a: ProfanityMatch, b: ProfanityMatch) => a.start - b.start || b.end - a.end;

const graphemes =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? (s: string) => [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].map((g) => g.segment)
    : (s: string) => [...s];

function censorMatches(text: string, matches: ProfanityMatch[], options: CensorOptions = {}): string {
  const { mask = "*", replace } = options;
  if (typeof mask !== "string" || mask === "") throw new TypeError("mask must be a non-empty string.");
  if (replace !== undefined && typeof replace !== "function") throw new TypeError("replace must be a function.");

  // Merge overlapping matches, such as the word "chaak" inside the phrase "chaak ko pwal", into one.
  const merged: ProfanityMatch[] = [];
  for (const m of [...matches].sort(byPosition)) {
    const prev = merged[merged.length - 1];
    if (prev && m.start < prev.end) {
      if (m.end > prev.end) {
        prev.end = m.end;
        prev.text = text.slice(prev.start, prev.end);
      }
    } else {
      merged.push({ ...m });
    }
  }

  let out = "";
  let last = 0;
  for (const m of merged) {
    const replacement = replace
      ? replace(m)
      : graphemes(m.text).map((g) => (/^\s+$/u.test(g) ? g : mask)).join("");
    out += text.slice(last, m.start) + replacement;
    last = m.end;
  }
  return out + text.slice(last);
}

/** Builds a filter once for a set of options. Reuse it rather than passing options on every call. */
export function createFilter(options: FilterOptions = {}): ProfanityFilter {
  const tables = buildTables(options);
  return {
    check: (text) => {
      const matches = scan(tables, text);
      return {
        text,
        hasProfanity: matches.length > 0,
        words: unique(matches),
        matches: [...matches].sort(byPosition),
        censor: (censorOptions) => censorMatches(text, matches, censorOptions),
      };
    },
    containsProfanity: (text) => scan(tables, text).length > 0,
    findProfanity: (text) => unique(scan(tables, text)),
    findProfanityMatches: (text) => scan(tables, text).sort(byPosition),
    censor: (text, censorOptions) => censorMatches(text, scan(tables, text), censorOptions),
  };
}

const filterCache = new Map<string, ProfanityFilter>();

function cachedFilter(options: FilterOptions = {}): ProfanityFilter {
  const key = JSON.stringify([
    options.strictness ?? "",
    [...(options.languages ?? LANGUAGES)].sort(),
    options.extraWords ?? [],
    options.allowWords ?? [],
  ]);
  let filter = filterCache.get(key);
  if (!filter) {
    filter = createFilter(options);
    filterCache.set(key, filter);
  }
  return filter;
}

/** Scans the text once. Use the result to check for profanity and to censor it, e.g. check(text).censor(). */
export function check(text: string, options?: FilterOptions): ProfanityCheck {
  return cachedFilter(options).check(text);
}

export function containsProfanity(text: string, options?: FilterOptions): boolean {
  return cachedFilter(options).containsProfanity(text);
}

export function findProfanity(text: string, options?: FilterOptions): string[] {
  return cachedFilter(options).findProfanity(text);
}

/** Like findProfanity, but returns every occurrence with its position in the input, sorted by position. */
export function findProfanityMatches(text: string, options?: FilterOptions): ProfanityMatch[] {
  return cachedFilter(options).findProfanityMatches(text);
}

/** Returns the text with every match masked, e.g. "you muji" → "you ****". */
export function censor(text: string, options?: FilterOptions & CensorOptions): string {
  const { mask, replace, ...filterOptions } = options ?? {};
  return cachedFilter(filterOptions).censor(text, { mask, replace });
}

export * as lexicon from "./lexicon.js";
