# nepali-profanity-filter

A small, dependency-free profanity matcher for **English**, **Romanized Nepali** and **Devanagari Nepali**, plus the
Hindi slang that is common in Nepal. Built for moderating user-written text (names, comments) on Nepali sites.

```ts
import { containsProfanity, findProfanity } from "nepali-profanity-filter";

containsProfanity("Great teacher!");      // false
containsProfanity("muji");                // true
containsProfanity("मुजीको कक्षा");          // true  (Devanagari, with a postposition)
findProfanity("f.u.c.k this sh1t");       // ["fuck", "shit"]
```

## What it catches

- **Case and Unicode forms**: `IDIOT`, full-width letters.
- **Leetspeak**: `sh1t`, `@ss` (`0 1 3 4 5 7 @ $`; `!` is left alone because it ends sentences).
- **Stretched letters**: `fuuuuck`, for words of 4+ letters.
- **Spelled-out letters**: `f.u.c.k`, `f u c k`, `m u j i`.
- **Nepali postpositions and plurals glued on**: `mujiko`, `randiharu`, `मुजीको`, `…हरू`.
- **Devanagari spelling variants**: nukta, chandrabindu vs anusvara, zero-width joiners.
- **Stems** where no ordinary word starts the same way: `fucking`, `bitches`, `machiknee`.

## What it deliberately doesn't

- **Short words match exactly**, so `as`, `class`, `assignment` and `Assam` are fine.
- **No stems that real names start with**: `shit` is a whole word only, because **Shitij** (Kshitij) is a name.
  Names like **Putali / पुतली**, **Randip**, **Asha**, **Machindra** and **Harimaya** are in the test suite as must-pass.
- **No caste names, surnames or ordinary words that are only offensive in context** (e.g. *kami*, *kukur*). A word
  list can't tell a slur from someone's name; that needs human moderation.
- **No judgement of context, sarcasm or meaning.** This is a first-pass filter, not a moderator.

## API

| Export | |
|---|---|
| `containsProfanity(text): boolean` | Whether any word matches. |
| `findProfanity(text): string[]` | The matching words, normalised. Empty when clean. |
| `tokenize(text): string[]` | The words the matcher sees (useful for debugging). |
| `lexicon` | The word lists: `LATIN_WORDS`, `LATIN_STEMS`, `DEVANAGARI_WORDS`, `DEVANAGARI_STEMS`, and the suffix lists. |

## Contributing words

The lists live in `src/lexicon.ts`, apart from the matching logic. Please:

1. Add the word in its **normal spelling**. Stretched letters and leetspeak are handled by the matcher.
2. Add a **stem** only if no ordinary word or common Nepali name starts with it.
3. Add a test in `test/profanity.test.ts`: the word must be caught, and any names or words it resembles must not be.

Native-speaker review of the Nepali lists is the most valuable contribution.

## Development

```sh
npm install
npm test         # vitest
npm run build    # compiles to dist/
```

## License

MIT
