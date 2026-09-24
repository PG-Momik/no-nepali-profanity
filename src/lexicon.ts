export type Language = "english" | "romanized" | "devanagari";

/**
 * The lowest filter strictness that turns an entry on.
 * - "lenient": severe profanity, caught at every strictness.
 * - "standard": milder insults (idiot, murkha, sala…), caught from "standard" up.
 * - "strict": entries known to also hit ordinary words or names, caught only at "strict".
 */
export type Strictness = "lenient" | "standard" | "strict";

export interface LexiconEntry {
  readonly text: string;
  readonly language: Language;
  readonly strictness: Strictness;
}

const tag = (language: Language, strictness: Strictness, texts: readonly string[]): LexiconEntry[] =>
  texts.map((text) => ({ text, language, strictness }));

export const WORDS: readonly LexiconEntry[] = [
  ...tag("english", "lenient", [
    "fuck", "fuk", "fck", "phuck", "shit", "shitty", "shithead", "bullshit", "bitch", "bastard", "ass", "asshole",
    "arsehole", "dumbass", "dick", "dickhead", "cunt", "whore", "slut", "cock", "pussy", "twat", "wanker", "retard",
    "fack",
  ]),
  ...tag("english", "standard", ["piss", "idiot", "stupid", "moron"]),

  ...tag("romanized", "lenient", [
    "muji", "mujhi", "muzi", "machikne", "machhikne", "mchikne", "mcikne", "machikney", "randi", "raandi", "rando",
    "rande", "radi", "lado", "lodo", "puti", "geda", "jatha", "jantha", "jathya", "chikne", "chikney", "bhalu", "khate",
    "harami", "gandu", "chutiya", "chutia", "bhosdi", "bhosadi", "bhosdike", "bsdk", "madarchod", "behenchod",
    "bhenchod", "chhakka", "lauro", "gukhane", "gand", "gaand", "gandako", "lund", "lundra", "lundri", "chod", "chodna",
    "beshya", "hijada", "kamina", "haramzada", "turi", "pakhe", "condo", "kando", "chaak", "gula", "bajiya",
    "mji", "mzi", "mujj", "mooji", "moozi", "mcne", "mechikne", "laado", "puuti", "zatya", "chodeko", "toori", "kundo",
  ]),
  ...tag("romanized", "standard", [
    "kutta", "kutti", "kuttiya", "murkha", "badmas", "sala", "saley", "sali", "chhucho", "chhuchi", "gu", "thukk",
    "nalayak", "beijjat", "nikamma", "ghinlagdo", "nindaniya", "paji", "moot", "bhate", "chhura", "torpe", "mukhulla",
    "gobre", "bhusya", "dhurt",
  ]),

  ...tag("devanagari", "lenient", [
    "मुजी", "मुजि", "माचिक्ने", "मचिक्ने", "रण्डी", "रन्डी", "रंडी", "रांडी", "रण्डो", "राण्डे", "राडी", "लाडो", "लांडो",
    "पुती", "गेडा", "जाठा", "जांठा", "जाठ्या", "चिक्ने", "भालु", "खाते", "हरामी", "गान्डु", "गांडु", "चुतिया", "भोस्डी",
    "भोसडी", "भोस्डीके", "मादरचोद", "बहनचोद", "भेनचोद", "छक्का", "लौरो", "गुखाने", "गान्ड", "गाण्ड", "गान्डको", "लुंड",
    "लुण्ड", "लुन्ड्रा", "लुन्ड्री", "लोडो", "चोद", "चोद्ना", "चोदेको", "वेश्या", "हिजडा", "कमिना", "हरामजादा", "तुरी",
    "पाखे", "कोंडो", "काण्डो", "कुन्डो", "चाक", "गुला", "बजिया", "राण्डी", "गाण्डु", "भोसडीके", "गाण्डको", "कोन्डो",
  ]),
  ...tag("devanagari", "standard", [
    "कुत्ता", "कुत्ती", "कुत्तिया", "मुर्ख", "मूर्ख", "बदमास", "साला", "साले", "साली", "छुच्चो", "छुच्ची", "गु", "किचकिच",
    "थुक", "नालायक", "बेइज्जत", "निकम्मा", "घिनलाग्दो", "निन्दनीय", "पाजी", "मूत", "भाते", "छुरा", "टोर्पे", "मुखुल्ला",
    "गोबरे", "भुस्या", "धूर्त",
  ]),
];

export const STEMS: readonly LexiconEntry[] = [
  ...tag("english", "lenient", [
    "fuck", "motherfuck", "bitch", "bastard", "asshol", "cunt", "whore", "slut", "wank", "retard",
  ]),
  ...tag("romanized", "lenient", [
    "machikn", "mchikn", "chutiy", "bhosd", "madarch", "behench", "bhench", "chikn", "chickn", "chod", "jath",
  ]),
  // Each of these also starts ordinary words or names: rand → Randip, cond → condition, kand → kanda / Kandel,
  // lund → Lundberg.
  ...tag("romanized", "strict", ["rand", "cond", "kand", "lund"]),
  ...tag("devanagari", "lenient", [
    "माचिक्न", "मचिक्न", "चुतिय", "भोस्ड", "मादरच", "बहनच", "भेनच", "चोद", "चिक्न", "रण्ड", "लुण्ड", "जाठ",
  ]),
  // Devanagari pairs of the "strict" Latin stems cond and kand.
  ...tag("devanagari", "strict", ["कोन्ड", "कान्ड"]),
];

export const PHRASES: readonly LexiconEntry[] = [
  ...tag("romanized", "lenient", [
    "chaak ko pwal", "tero aama ko", "muji jasto", "lado khaye", "lado khos", "randi ko choro", "randi ko ban",
    "gand mara", "gand fatchya", "geda jasto", "geda khaya", "khatako choro", "bhaluko ban", "machikne khate",
  ]),
  ...tag("romanized", "standard", ["pesa garne", "sasto manche"]),
  ...tag("devanagari", "lenient", [
    "चाकको प्वाल", "चाक को प्वाल", "तेरो आमाको", "मुजी जस्तो", "लाडो खाए", "लाडो खोस्", "राण्डीको छोरो", "राण्डीको बान",
    "गाण्ड मरा", "गाण्ड फाट्या", "गेडा जस्तो", "गेडा खाया", "खातेको छोरो", "भालुको बान", "माचिक्ने खाते",
  ]),
  ...tag("devanagari", "standard", ["पेसा गर्ने", "सस्तो मान्छे"]),
];

export const LATIN_SUFFIXES: readonly string[] = [
  "haruko", "harule", "haru", "sanga", "bata", "lai", "ko", "ki", "ka", "le", "ma", "ni", "ne", "yo"
].sort((a, b) => b.length - a.length);

export const DEVANAGARI_SUFFIXES: readonly string[] = [
  "हरूको", "हरुको", "हरूले", "हरुले", "हरू", "हरु", "बाट", "सँग", "संग", "लाई", "को", "की", "का", "ले", "मा", "नि", "ने", "यो"
].sort((a, b) => b.length - a.length);

// Flat lists of every entry at every strictness, by script.
const texts = (entries: readonly LexiconEntry[], latin: boolean) =>
  entries.filter((e) => (e.language !== "devanagari") === latin).map((e) => e.text);

export const LATIN_WORDS: readonly string[] = texts(WORDS, true);
export const LATIN_STEMS: readonly string[] = texts(STEMS, true);
export const LATIN_PHRASES: readonly string[] = texts(PHRASES, true);
export const DEVANAGARI_WORDS: readonly string[] = texts(WORDS, false);
export const DEVANAGARI_STEMS: readonly string[] = texts(STEMS, false);
export const DEVANAGARI_PHRASES: readonly string[] = texts(PHRASES, false);
