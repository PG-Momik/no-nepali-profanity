import {
  DEVANAGARI_PHRASES,
  DEVANAGARI_STEMS,
  DEVANAGARI_SUFFIXES,
  DEVANAGARI_WORDS,
  LATIN_PHRASES,
  LATIN_STEMS,
  LATIN_SUFFIXES,
  LATIN_WORDS,
} from "./lexicon.js";

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s",
};

const MIN_COLLAPSE = 4;

const isDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const collapse = (s: string) => s.replace(/(.)\1+/g, "$1");
const squeeze = (s: string) => s.replace(/(.)\1{2,}/g, "$1$1");

function normalizeDevanagari(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/़/g, "")
    .replace(/ँ/g, "ं");
}

function normalizeLatin(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[0-9@$]/g, (c) => LEET[c] ?? c)
    .replace(/([\p{L}\p{N}])!+(?=[\p{L}\p{N}])/gu, "$1i");
}

const LATIN_EXACT = new Set(LATIN_WORDS.map((w) => squeeze(normalizeLatin(w))));
const LATIN_COLLAPSED = new Set(
  LATIN_WORDS.filter((w) => collapse(w).length >= MIN_COLLAPSE).map((w) => collapse(normalizeLatin(w)))
);
const LATIN_WORD_LIST = LATIN_WORDS.map((w) => squeeze(normalizeLatin(w)));
const LATIN_STEMS_COLLAPSED = LATIN_STEMS.map((s) => collapse(normalizeLatin(s)));

const DEV_WORDS = new Set(DEVANAGARI_WORDS.map(normalizeDevanagari));
const DEV_STEMS = DEVANAGARI_STEMS.map(normalizeDevanagari);
const DEV_SUFFIXES = DEVANAGARI_SUFFIXES; 

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const COMPILED_PHRASES = [...LATIN_PHRASES, ...DEVANAGARI_PHRASES].map((p) => {
  const norm = isDevanagari(p) ? normalizeDevanagari(p) : normalizeLatin(p);
  const body = norm.trim().split(/\s+/).map(escapeRegex).join("\\s+");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(${body})(?![\\p{L}\\p{N}])`, "giu");
});

const WILDCARD_WORD_REGEXES = LATIN_WORD_LIST.map((w) => ({
  word: w,
  patternStr: w,
}));

function wildcardTokenMatches(token: string): boolean {
  if (!token.includes("*")) return false;
  
  const cleanToken = token.replace(/^\*+|\*+$/g, "");
  if (!/[\p{L}]/u.test(cleanToken)) return false;

  const forms = [squeeze(cleanToken), collapse(cleanToken)];

  return forms.some((f) => {
    const regexPattern = new RegExp(`^${f.replace(/[*+?^${}()|[\]\\]/g, (m) => (m === "*" ? "." : "\\" + m))}$`, "i");
    
    if (WILDCARD_WORD_REGEXES.some((item) => regexPattern.test(item.word))) return true;

    return LATIN_STEMS_COLLAPSED.some((stem) => {
      if (f.length < stem.length) return false;
      const stemSub = f.slice(0, stem.length);
      const stemRegex = new RegExp(`^${stemSub.replace(/[*+?^${}()|[\]\\]/g, (m) => (m === "*" ? "." : "\\" + m))}$`, "i");
      return stemRegex.test(stem);
    });
  });
}

function latinTokenMatches(token: string): boolean {
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
      LATIN_EXACT.has(squeezed) ||
      (collapsed.length >= MIN_COLLAPSE && LATIN_COLLAPSED.has(collapsed)) ||
      LATIN_STEMS_COLLAPSED.some((stem) => collapsed.startsWith(stem)) ||
      wildcardTokenMatches(t)
    );
  });
}

function devanagariTokenMatches(token: string): boolean {
  const candidates = [token];
  for (const s of DEV_SUFFIXES) {
    if (token.endsWith(s) && token.length > s.length + 1) {
      candidates.push(token.slice(0, -s.length));
      break;
    }
  }

  return candidates.some((t) => DEV_WORDS.has(t) || DEV_STEMS.some((stem) => t.startsWith(stem)));
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  const latin = normalizeLatin(text);
  const raw = latin.match(/[\p{L}\p{M}*]+/gu) ?? [];
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

export function findProfanity(text: string): string[] {
  if (!text) return [];

  const found: string[] = [];
  const tokens = tokenize(text);

  for (const t of tokens) {
    if (isDevanagari(t) ? devanagariTokenMatches(t) : latinTokenMatches(t)) {
      found.push(t);
    }
  }

  const normLatin = normalizeLatin(text);
  const normDev = normalizeDevanagari(text);

  for (const re of COMPILED_PHRASES) {
    const target = re.source.match(/[ऀ-ॿ]/) ? normDev : normLatin;
    re.lastIndex = 0; 
    let match: RegExpExecArray | null;
    while ((match = re.exec(target)) !== null) {
      found.push(match[1]);
    }
  }

  return [...new Set(found)];
}

export function containsProfanity(text: string): boolean {
  return findProfanity(text).length > 0;
}

export * as lexicon from "./lexicon.js";