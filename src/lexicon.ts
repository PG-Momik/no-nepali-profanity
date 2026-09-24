// Words to refuse in user-written text. Kept apart from the matcher (./index.ts) so the
// list can grow on its own and be reviewed by Nepali speakers.
//
// Terms are written in their normal spelling. The matcher (./index.ts) undoes leetspeak ("sh1t"), joins spelled-out
// letters ("f.u.c.k"), strips Nepali postpositions ("mujiko"), and for words of 4+ letters also undoes stretched
// letters ("fuuuck"). Short words ("ass") must match exactly, so ordinary words ("as", "class") never do.
//
// Deliberately NOT here: caste names, surnames, or ordinary words that are only offensive in context ("kami",
// "kukur" = dog). Those belong to human moderation: a word list would block real people's names. Stems (below) are
// chosen so no ordinary word or common Nepali name starts with them ("shit" is NOT a stem: "Shitij" is a name).

// Lexicon containing English, Romanized Nepali, and Devanagari terms.

export const LATIN_WORDS: readonly string[] = [
  // English
  "fuck", "fuk", "fck", "phuck", "shit", "shitty", "shithead", "bullshit", "bitch", "bastard", "ass", "asshole",
  "arsehole", "dumbass", "dick", "dickhead", "cunt", "whore", "slut", "piss", "cock", "pussy", "twat", "wanker",
  "retard", "idiot", "stupid", "moron",
  // Romanized Nepali & Dialects
  "muji", "mujhi", "muzi", "machikne", "ma  chhikne", "mchikne", "mcikne", "machikney", "randi", "raandi", "rando", "rande",
  "radi", "lado", "lodo", "puti", "geda", "jatha", "jantha", "jathya", "chikne", "chikney", "bhalu", "khate", "harami",
  "gandu", "chutiya", "chutia", "bhosdi", "bhosadi", "bhosdike", "bsdk", "kutta", "kutti", "kuttiya", "madarchod",
  "behenchod", "bhenchod", "murkha", "badmas", "sala", "saley", "sali", "chhakka", "lauro", "chhucho", "chhuchi",
  "gu", "gukhane", "gand", "gaand", "gandako", "lund", "lundra", "lundri", "chod", "chodna", "thukk", "nalayak",
  "beijjat", "nikamma", "fohor", "ghinlagdo", "nindaniya", "beshya", "hijada", "kamina", "haramzada", "paji", "moot",
  "bhate", "chhura", "turi", "pakhe", "condo", "kando", "chaak", "gula", "bajiya", "torpe", "mukhulla", "gobre",
  "bhusya", "dhurt", "kano", "lato", "lati"
];

export const LATIN_STEMS: readonly string[] = [
  "fuck", "motherfuck", "bitch", "bastard", "asshol", "cunt", "whore", "slut", "wank", "retard", "machikn", "mchikn",
  "chutiy", "bhosd", "madarch", "behench", "bhench", "chikn", "chickn", "chod", "lund", "rand", "jath", "cond", "kand"
];

export const DEVANAGARI_WORDS: readonly string[] = [
  "मुजी", "मुजि", "माचिक्ने", "मचिक्ने", "रण्डी", "रन्डी", "रंडी", "रांडी", "रण्डो", "राण्डे", "राडी", "लाडो", "लांडो",
  "पुती", "गेडा", "जाठा", "जांठा", "जाठ्या", "चिक्ने", "भालु", "खाते", "हरामी", "गान्डु", "गांडु", "चुतिया", "भोस्डी",
  "भोसडी", "भोस्डीके", "कुत्ता", "कुत्ती", "कुत्तिया", "मादरचोद", "बहनचोद", "भेनचोद", "मुर्ख", "मूर्ख", "बदमास",
  "साला", "साले", "साली", "छक्का", "लौरो", "छुच्चो", "छुच्ची", "गु", "गुखाने", "गान्ड", "गाण्ड", "गान्डको", "लुंड",
  "लुण्ड", "लुन्ड्रा", "लुन्ड्री", "लोडो", "चोद", "चोद्ना", "चोदेको", "किचकिच", "थुक", "नालायक", "बेइज्जत", "निकम्मा",
  "फोहर", "फोहोर", "घिनलाग्दो", "निन्दनीय", "वेश्या", "हिजडा", "कमिना", "हरामजादा", "पाजी", "मूत", "भाते", "छुरा",
  "तुरी", "पाखे", "कोंडो", "काण्डो", "कुन्डो", "चाक", "गुला", "बजिया", "टोर्पे", "मुखुल्ला", "गोबरे", "भुस्या",
  "धूर्त", "कानो", "लाटो", "लाटी"
];

export const DEVANAGARI_STEMS: readonly string[] = [
  "माचिक्न", "मचिक्न", "चुतिय", "भोस्ड", "मादरच", "बहनच", "चोद", "चिक्न", "रण्ड", "लुण्ड"
];

export const LATIN_PHRASES: readonly string[] = [
  "chaak ko pwal", "pesa garne", "sasto manche", "tero aama ko", "muji jasto", "lado khaye", "randi ko choro", "gand mara"
];

export const DEVANAGARI_PHRASES: readonly string[] = [
  "चाकको प्वाल", "चाक को प्वाल", "पेसा गर्ने", "सस्तो मान्छे", "तेरो आमाको", "राण्डीको छोरो", "गाण्ड मरा"
];

// Ensure suffixes are sorted by length DESCENDING to guarantee greedy stripping
export const LATIN_SUFFIXES: readonly string[] = [
  "haruko", "harule", "haru", "sanga", "bata", "lai", "ko", "ki", "ka", "le", "ma", "ni", "ne", "yo"
].sort((a, b) => b.length - a.length);

export const DEVANAGARI_SUFFIXES: readonly string[] = [
  "हरूको", "हरुको", "हरूले", "हरुले", "हरू", "हरु", "बाट", "सँग", "संग", "लाई", "को", "की", "का", "ले", "मा", "नि", "ने", "यो"
].sort((a, b) => b.length - a.length);