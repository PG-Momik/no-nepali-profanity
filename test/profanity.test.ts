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
