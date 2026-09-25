# Contributing

Thanks for helping. The most useful contribution is a **review of the Nepali word lists by a native speaker**:
spotting entries that are ordinary words or names, adding common spellings, and saying whether an entry is at the
right strictness.

The full guide, including the rules for adding a word, is at
[mukhxadnahunna.com/js/contributing](https://mukhxadnahunna.com/js/contributing).

## Reporting a problem

All the ports share one issue tracker:
[github.com/PG-Momik/no-nepali-profanity/issues](https://github.com/PG-Momik/no-nepali-profanity/issues). Include:

- the **exact input text**,
- which words were found, and what you expected,
- that you used the JavaScript package, and the options you passed, if any.

For a false positive, say whether the word is a name, a place or an ordinary word.

## Development setup

```sh
git clone https://github.com/PG-Momik/no-nepali-profanity.git
cd no-nepali-profanity
npm install
npm test            # Vitest
npm run typecheck
npm run build       # compile to dist/
```

`src/lexicon.ts` holds the word lists and `src/index.ts` the matching logic.

## Changing the word lists

This repository holds the word lists every port uses. After changing `src/lexicon.ts`, open an issue or a pull
request in each port's repository so they stay in step, or say in your pull request that you'd like help with that.

## Changing the matching rules

Every port gives the same result for the same text. A change to how text is matched (normalization, tokenizing,
suffixes, wildcards, phrases or censoring) changes the behaviour of all of them, so open an issue first to agree on
it, and describe the change precisely enough to port.

## Pull requests

- Keep each pull request to one change, and explain why it's needed.
- Add a test to `test/profanity.test.ts`: a "catches" case for something that should be flagged, and a "does not flag" case for a
  word or name that shouldn't be.
- Make sure the tests pass before you open it.
- Don't add runtime dependencies without discussing it in an issue first.

By contributing, you agree that your contribution is released under the [MIT License](LICENSE).
