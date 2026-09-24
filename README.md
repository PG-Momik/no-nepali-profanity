# no-nepali-profanity

A small, **dependency-free** profanity matcher for **English**, **Romanized (Latin) Nepali** and **Devanagari Nepali**,
plus the Hindi slang common in Nepal. Built for moderating user-written text — names, comments, reviews — on Nepali
sites, where false positives on real names are more damaging than a missed swear.

Zero runtime dependencies. TypeScript, ships pre-built ESM (`dist/`) with `.d.ts` typings, published as a Node package
(`type: module`). No browser/CDN bundle is shipped; it targets server-side or build-time moderation.

**Documentation: [mukhxadnahunna.com/js](https://mukhxadnahunna.com/js/)**

## Install

```sh
npm install no-nepali-profanity
```

Requires Node 18+ (uses `String.prototype.normalize` and Unicode property regex escapes). ESM-only:

```js
import { containsProfanity, findProfanity, tokenize } from "no-nepali-profanity";
```

TypeScript works out of the box — the `.d.ts` ship with the package.

## Usage

Seven functions, one lexicon module. All examples below are verified against the current build.

```js
import { containsProfanity, findProfanity, tokenize } from "no-nepali-profanity";

// boolean check — fastest
containsProfanity("Great teacher!");        // false
containsProfanity("muji");                  // true
containsProfanity("मुजीको कक्षा");           // true  (Devanagari + postposition)

// which words — returns normalised matches as they appeared
findProfanity("f.u.c.k this sh1t");        // ["fuck", "shit"]
findProfanity("f u c k this");              // ["fuck"]
findProfanity("Randip Thapa");              // []
findProfanity("*ss teacher");               // []           ⚠️ not yet caught — see Known issues

// debugging — see what the matcher actually splits into
tokenize("Great teacher!");                 // ["great", "teacher"]
```

## API

| Signature | Returns | Notes |
|---|---|---|
| `containsProfanity(text, options?)` | `boolean` | Yes/no from `findProfanity`. |
| `findProfanity(text, options?)` | `string[]` | Matching words **normalised + lowercased** (leet decoded, case-folded), deduplicated. Empty when clean. |
| `check(text, options?)` | `{ text, hasProfanity, words, matches, censor() }` | Scans once; inspect the result and censor it without scanning again. |
| `findProfanityMatches(text, options?)` | `{ text, normalized, start, end }[]` | Every occurrence with its position in the original text, sorted by position. |
| `censor(text, options?)` | `string` | The text with each match masked: `"you muji"` → `"you ****"`. Options: `mask` (default `"*"`), `replace(match)`. |
| `createFilter(options?)` | `{ check, containsProfanity, findProfanity, findProfanityMatches, censor }` | Builds the tables once for fixed options. |
| `tokenize(text)` | `string[]` | Raw tokens the matcher sees. Useful for debugging why a word is (or isn't) caught. |
| `lexicon` | module | Tagged entries (`WORDS`, `STEMS`, `PHRASES`), flat per-script lists (`LATIN_WORDS`, `DEVANAGARI_WORDS`…) and suffixes. |

### Censoring

```js
censor("you muji");                                   // "you ****"
censor("F.U.C.K this Sh1t!");                          // "******* this ****!"
censor("you muji", { mask: "#" });                    // "you ####"
censor("you muji", { replace: () => "[censored]" });  // "you [censored]"
findProfanityMatches("you muji");                     // [{ text: "muji", normalized: "muji", start: 4, end: 8 }]
```

Check and censor in one pass:

```js
const result = check("you muji");
result.hasProfanity;   // true
result.words;          // ["muji"]
result.censor();       // "you ****"

check("you muji").censor();   // "you ****"
```

### Options

```js
findProfanity("fuck muji मुजी", { languages: ["romanized"] });      // ["muji"]
containsProfanity("you idiot", { strictness: "lenient" });         // false
findProfanity("terms and conditions", { strictness: "strict" });   // ["conditions"]
```

- `languages`: any of `"english"`, `"romanized"`, `"devanagari"`. Default: all three.
- `strictness`: `"lenient"` (severe words only), `"standard"` (default, adds milder insults like `idiot`, `murkha`) or
  `"strict"` (adds the stems `rand`, `cond`, `kand`, `lund`, which also hit words like `Randip` and `conditions`).

## What it catches

- **Case and Unicode forms**: `IDIOT`, full-width letters.
- **Leetspeak**: `sh1t`, `@ss` (`0 1 3 4 5 7 @ $`).
- **`!` for `i` between letters**: `sh!t`, `b!tch`. Sentence-final `Great teacher!` is left alone.
- **`*` for a hidden letter**: `f*ck`, `sh*t`, and markdown emphasis like `*sh*t*` still reads as the word.
- **Stretched letters**: `fuuuuck`, for words of 4+ letters.
- **Spelled-out letters**: `f.u.c.k`, `f u c k`.
- **Nepali postpositions and plurals glued on**: `mujiko`, `randiharu`, `मुजीको`, `…हरू`.
- **Devanagari spelling variants**: nukta, chandrabindu vs anusvara, zero-width joiners.
- **Stems** where no ordinary word starts the same way: `fucking`, `bitches`, `machiknee`.
- **Multi-word phrases**: `chaak ko pwal`, `pesa garne`, `sasto manche` (Latin and Devanagari).

## What it deliberately doesn't

- **Short words match exactly**, so `as`, `class`, `assignment` and `Assam` are fine.
- **Name collisions**: `shit` is a whole word only, because **Shitij / शितिज** is a name. Names like **मुजी**-adjacent
  **Randip / राण्डीप**, **Putali / पुतली**, **Asha / आशा** are checked in the test suite.
- **No caste names, surnames or ordinary words that are only offensive in context** (e.g. *kami*, *kukur*). A word
  list can't tell a slur from someone's name; that needs human moderation.
- **No judgement of context, sarcasm or meaning.** This is a first-pass filter, not a moderator.

## Known issues

One check in `test/profanity.test.ts` currently fails against this build. It's a real gap, not a documentation
error:

- **A wildcard for a hidden first letter isn't caught.** `*ss` (`ass` with a hidden first letter) returns `[]`.

## Development

```sh
npm install
npm test         # vitest
npm run build    # tsc -> dist/
npm run typecheck
```

The word lists live in `src/lexicon.ts`, apart from the matching logic in `src/index.ts`. A helper exports the lists
as CSV for review: `scripts/export-csv.mjs` → `words.csv`. Native-speaker review of the Nepali lists is the most
valuable contribution.

## License

MIT
