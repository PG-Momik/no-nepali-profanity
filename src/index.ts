import {
  DEVANAGARI_SUFFIXES,
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

export interface ProfanityFilter {
  containsProfanity(text: string): boolean;
  findProfanity(text: string): string[];
  findProfanityMatches(text: string): ProfanityMatch[];
  censor(text: string, options?: CensorOptions): string;
}

const LANGUAGES: readonly Language[] = ["english", "romanized", "devanagari"];
const STRICTNESS_LEVEL: Record<Strictness, number> = { lenient: 0, standard: 1, strict: 2 };

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s",
};

const MIN_COLLAPSE = 4;

const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const collapse = (s: string) => s.replace(/(.)\1+/g, "$1");
const squeeze = (s: string) => s.replace(/(.)\1{2,}/g, "$1$1");

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
  return ch
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[0-9@$]/g, (c) => LEET[c] ?? c);
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
  latinWords: string[];
  latinStems: string[];
  devWords: Set<string>;
  devStems: string[];
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

  const active = (entries: readonly LexiconEntry[], devanagari: boolean) =>
    entries
      .filter((e) => languages.has(e.language) && STRICTNESS_LEVEL[e.strictness] <= level)
      .filter((e) => (e.language === "devanagari") === devanagari)
      .map((e) => normalizeText(e.text));

  const latinWords = active(WORDS, false);

  return {
    latinExact: new Set(latinWords.map(squeeze)),
    latinCollapsed: new Set(latinWords.map(collapse).filter((w) => w.length >= MIN_COLLAPSE)),
    latinWords: latinWords.map(squeeze),
    latinStems: active(STEMS, false).map(collapse),
    devWords: new Set(active(WORDS, true)),
    devStems: active(STEMS, true),
    phrases: [...active(PHRASES, false), ...active(PHRASES, true)].map((p) => {
      const body = p.trim().split(/\s+/).map(escapeRegex).join("\\s+");
      return new RegExp(`(?:^|[^\\p{L}\\p{N}])(${body})(?![\\p{L}\\p{N}])`, "giud");
    }),
  };
}

function wildcardTokenMatches(tables: Tables, token: string): boolean {
  if (!token.includes("*")) return false;

  const cleanToken = token.replace(/^\*+|\*+$/g, "");
  if (!/[\p{L}]/u.test(cleanToken)) return false;

  const forms = [squeeze(cleanToken), collapse(cleanToken)];

  return forms.some((f) => {
    const regexPattern = wildcardRegex(f);
    if (tables.latinWords.some((w) => regexPattern.test(w))) return true;

    return tables.latinStems.some((stem) => {
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

  return candidates.some((t) => {
    const squeezed = squeeze(t);
    const collapsed = collapse(t);
    return (
      tables.latinExact.has(squeezed) ||
      (collapsed.length >= MIN_COLLAPSE && tables.latinCollapsed.has(collapsed)) ||
      tables.latinStems.some((stem) => collapsed.startsWith(stem)) ||
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
    containsProfanity: (text) => scan(tables, text).length > 0,
    findProfanity: (text) => unique(scan(tables, text)),
    findProfanityMatches: (text) => scan(tables, text).sort(byPosition),
    censor: (text, censorOptions) => censorMatches(text, scan(tables, text), censorOptions),
  };
}

const filterCache = new Map<string, ProfanityFilter>();

function cachedFilter(options: FilterOptions = {}): ProfanityFilter {
  const key = `${options.strictness ?? ""}|${[...(options.languages ?? LANGUAGES)].sort().join(",")}`;
  let filter = filterCache.get(key);
  if (!filter) {
    filter = createFilter(options);
    filterCache.set(key, filter);
  }
  return filter;
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
