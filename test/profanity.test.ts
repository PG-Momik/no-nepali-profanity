import { describe, it, expect } from "vitest";
import {
  censor,
  check,
  containsProfanity,
  createFilter,
  findProfanity,
  findProfanityMatches,
  tokenize,
} from "../src/index.js";

describe("containsProfanity", () => {
  it.each([
    ["English", "what a bitch"],
    ["an inflected English word (stem)", "fucking useless"],
    ["Romanized Nepali", "muji teacher"],
    ["Romanized Nepali with a postposition", "machikneko class"],
    ["Devanagari Nepali", "यो मुजी हो"],
    ["Devanagari with a postposition", "मुजीको कक्षा"],
    ["Devanagari with a nukta or zero-width joiner", "मु‍जी"],
    ["leetspeak", "sh1t lecturer"],
    ["leetspeak with @", "@ss"],
    ["leetspeak with $", "a$$"],
    ["dodging with ! for i inside a word", "sh!t lecturer"],
    ["dodging with a wildcard for a hidden letter", "f*ck this"],
    ["dodging with a wildcard for the hidden i", "sh*t"],
    ["dodging with a wildcard for the hidden first letter", "that *ss"],
    ["markdown emphasis still reads the word", "*sh*t* is bad"],
    ["stretched letters", "fuuuuck"],
    ["letters spelled out with dots", "f.u.c.k"],
    ["letters spelled out with spaces", "m u j i"],
    ["upper case", "IDIOT"],
    ["Hindi slang common in Nepal", "chutiya"],
    ["Romanized invective", "murkha"],
    ["Dodged word stays caught with a suffix", "gandako budi"],
    ["exact word, not a long place name", "look at that gand"],
    ["stem catches the -ne inflected form", "chodne manche"],
    ["Devanagari invective", "मुर्ख"],
    ["Devanagari slang", "कमिना"],
    ["Devanagari vulgar term", "लुंड"],
    ["multi-word phrase", "chaak ko pwal"],
    ["multi-word phrase with leetspeak", "p3sa g@rne taba"],
    ["multi-word phrase ending a sentence", "thulo sasto manche!"],
    ["review-supplied term", "chhakka lai hami mukhulla bhanchha"],
    ["short spelling from words.csv", "mji"],
    ["leet spelling from words.csv", "m00ji"],
    ["English leet spelling from words.csv", "f4ck off"],
    ["Devanagari spelling from words.csv", "राण्डी"],
    ["Latin phrase from words.csv", "khatako choro"],
    ["Devanagari phrase from words.csv", "राण्डीको बान"],
    ["spelling variant with -ey", "yo khatey payment app kahiley chaley po"],
  ])("catches %s", (_label, text) => {
    expect(containsProfanity(text)).toBe(true);
  });

  it.each([
    // Ordinary words that contain or resemble a listed word
    "The class assignment was as hard as expected",
    "Computing and data structures",
    "Dickson explained Scunthorpe problems",
    "Assam and Gandaki are places",
    // Real Nepali names, in both scripts
    "Kshitij Shrestha",
    "Shitij Adhikari",
    "Putali Gurung",
    "पुतली गुरुङ",
    "Randip Thapa",
    "Asha Sharma",
    "Machindra Karki",
    "Harimaya Tamang",
    "सीता कार्की",
    "क्षितिज श्रेष्ठ",
    // Sentence punctuation
    "Great teacher!",
    "No way! That can't be right",
    "the starred items are on page 12*",
    "feed ** me ** the list",
    // Ordinary words that must not start matching the new stems
    "chicken biryani is good",
    "the salaam greeting sounded nice",
    "Gandaki river is in Nepal",
    // Words separated so a phrase must not match
    "sasto ra manche duitai ho",
    // Ordinary words that the "strict"-only stems would catch
    "terms and conditions",
    "the conductor",
    "bhrastachar kanda",
    "Kandel sir",
    "Lundberg",
    // Ordinary words removed from the lexicon
    "fohor pani",
    "kano manche",
    "lato keta",
    "फोहोर पानी",
    "लाटो केटा",
  ])("does not flag %j", (text) => {
    expect(findProfanity(text)).toEqual([]);
  });

  it("is false for an empty string", () => {
    expect(containsProfanity("")).toBe(false);
  });
});

describe("tokenize", () => {
  it("joins letters spelled out one at a time, and keeps Devanagari words whole", () => {
    expect(tokenize("f.u.c.k this")).toEqual(["fuck", "this"]);
    expect(tokenize("सीता कार्की")).toEqual(["सीता", "कार्की"]);
  });

  it("keeps a wildcard asterisk inside a word, and lets sentence-final ! stay a separator", () => {
    expect(tokenize("f*ck this!")).toEqual(["f*ck", "this"]);
  });
});

describe("languages option", () => {
  it("checks only the languages turned on", () => {
    const romanized = { languages: ["romanized"] } as const;
    expect(containsProfanity("muji", romanized)).toBe(true);
    expect(containsProfanity("fuck", romanized)).toBe(false);
    expect(containsProfanity("मुजी", romanized)).toBe(false);
    expect(containsProfanity("sasto manche", romanized)).toBe(true);
  });

  it("keeps English and Devanagari separate from Romanized Nepali", () => {
    expect(findProfanity("fuck muji मुजी", { languages: ["english"] })).toEqual(["fuck"]);
    expect(findProfanity("fuck muji मुजी", { languages: ["devanagari"] })).toEqual(["मुजी"]);
  });

  it("checks nothing when no language is turned on", () => {
    expect(findProfanity("fuck muji मुजी", { languages: [] })).toEqual([]);
  });

  it("rejects an unknown language", () => {
    expect(() => createFilter({ languages: ["hindi" as never] })).toThrow(TypeError);
  });
});

describe("strictness option", () => {
  it("lenient skips milder insults but keeps severe profanity", () => {
    expect(containsProfanity("idiot", { strictness: "lenient" })).toBe(false);
    expect(containsProfanity("murkha", { strictness: "lenient" })).toBe(false);
    expect(containsProfanity("sasto manche", { strictness: "lenient" })).toBe(false);
    expect(containsProfanity("muji", { strictness: "lenient" })).toBe(true);
  });

  it("standard is the default", () => {
    expect(containsProfanity("idiot")).toBe(true);
    expect(containsProfanity("idiot", { strictness: "standard" })).toBe(true);
    expect(containsProfanity("Randip Thapa")).toBe(false);
  });

  it("strict adds the stems that also match ordinary words and names", () => {
    const strict = { strictness: "strict" } as const;
    expect(findProfanity("randikoban", strict)).toEqual(["randikoban"]);
    expect(findProfanity("terms and conditions", strict)).toEqual(["conditions"]);
    expect(findProfanity("Randip Thapa", strict)).toEqual(["randip"]);
  });

  it("rejects an unknown strictness", () => {
    expect(() => createFilter({ strictness: "max" as never })).toThrow(TypeError);
  });
});

describe("createFilter", () => {
  it("combines both options", () => {
    const filter = createFilter({ languages: ["romanized"], strictness: "lenient" });
    expect(filter.containsProfanity("muji")).toBe(true);
    expect(filter.containsProfanity("murkha")).toBe(false);
    expect(filter.findProfanity("fuck muji")).toEqual(["muji"]);
  });
});

describe("findProfanityMatches", () => {
  it("returns every occurrence with its position in the original text", () => {
    expect(findProfanityMatches("F.U.C.K this sh1t, muji. MUJI")).toEqual([
      { text: "F.U.C.K", normalized: "fuck", start: 0, end: 7 },
      { text: "sh1t", normalized: "shit", start: 13, end: 17 },
      { text: "muji", normalized: "muji", start: 19, end: 23 },
      { text: "MUJI", normalized: "muji", start: 25, end: 29 },
    ]);
  });

  it("returns a phrase before a word it contains", () => {
    expect(findProfanityMatches("chaak ko pwal")).toEqual([
      { text: "chaak ko pwal", normalized: "chaak ko pwal", start: 0, end: 13 },
      { text: "chaak", normalized: "chaak", start: 0, end: 5 },
    ]);
  });

  it("is empty for clean text", () => {
    expect(findProfanityMatches("Great teacher!")).toEqual([]);
    expect(findProfanityMatches("")).toEqual([]);
  });
});

describe("censor", () => {
  it.each([
    ["you muji", "you ****"],
    ["F.U.C.K this Sh1t!", "******* this ****!"],
    ["sh!!t happens", "***** happens"],
    ["ＦＵＣＫ off", "**** off"],
    ["fuuuuck yeah", "******* yeah"],
    ["f*ck and *sh*t*", "**** and ******"],
    ["muji muji", "**** ****"],
    ["you 😀 muji 😀", "you 😀 **** 😀"],
  ])("masks %j", (text, expected) => {
    expect(censor(text)).toBe(expected);
  });

  it("masks Devanagari by visible character, not code unit", () => {
    expect(censor("मुजीको कक्षा")).toBe("*** कक्षा");
  });

  it("keeps the spaces inside a phrase", () => {
    expect(censor("sasto   manche")).toBe("*****   ******");
  });

  it("merges a word with the phrase around it", () => {
    expect(censor("chaak ko pwal")).toBe("***** ** ****");
  });

  it("leaves clean text and names alone", () => {
    expect(censor("Great teacher!")).toBe("Great teacher!");
    expect(censor("Shitij is great")).toBe("Shitij is great");
    expect(censor("")).toBe("");
  });

  it("uses a custom mask character", () => {
    expect(censor("you muji", { mask: "#" })).toBe("you ####");
  });

  it("uses a replace function over the mask", () => {
    expect(censor("you muji fuck", { mask: "#", replace: () => "[censored]" })).toBe("you [censored] [censored]");
    expect(censor("you muji", { replace: (m) => m.text[0] + "*".repeat(m.text.length - 1) })).toBe("you m***");
  });

  it("respects the filter options", () => {
    expect(censor("fuck muji", { languages: ["romanized"] })).toBe("fuck ****");
    expect(censor("you idiot", { strictness: "lenient" })).toBe("you idiot");
    expect(createFilter({ strictness: "strict" }).censor("Randip Thapa")).toBe("****** Thapa");
  });

  it("rejects an empty mask", () => {
    expect(() => censor("muji", { mask: "" })).toThrow(TypeError);
  });
});

describe("check", () => {
  it("returns everything from one scan", () => {
    const result = check("you muji, F.U.C.K");
    expect(result.text).toBe("you muji, F.U.C.K");
    expect(result.hasProfanity).toBe(true);
    expect(result.words).toEqual(["muji", "fuck"]);
    expect(result.matches.map((m) => m.text)).toEqual(["muji", "F.U.C.K"]);
    expect(result.censor()).toBe("you ****, *******");
    expect(result.censor({ mask: "#" })).toBe("you ####, #######");
  });

  it("chains straight into censor", () => {
    expect(check("you muji").censor()).toBe("you ****");
    expect(check("Great teacher!").censor()).toBe("Great teacher!");
  });

  it("reports clean text", () => {
    const result = check("Great teacher!");
    expect(result.hasProfanity).toBe(false);
    expect(result.words).toEqual([]);
    expect(result.matches).toEqual([]);
  });

  it("respects the filter options", () => {
    expect(check("fuck muji", { languages: ["romanized"] }).censor()).toBe("fuck ****");
    expect(createFilter({ strictness: "lenient" }).check("you idiot").hasProfanity).toBe(false);
  });
});
