import { describe, it, expect } from "vitest";
import { containsProfanity, findProfanity, tokenize } from "../src/index.js";

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
    ["stretched letters", "fuuuuck"],
    ["letters spelled out with dots", "f.u.c.k"],
    ["letters spelled out with spaces", "m u j i"],
    ["upper case", "IDIOT"],
    ["Hindi slang common in Nepal", "chutiya"],
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
});
