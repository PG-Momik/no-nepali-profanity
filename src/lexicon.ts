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

/** Whole words, Latin script: English, Romanized Nepali, and Hindi slang common in Nepal. */
export const LATIN_WORDS: readonly string[] = [
  // English
  "fuck", "fuk", "fck", "phuck", "shit", "shitty", "shithead", "bullshit", "bitch", "bastard", "ass", "asshole",
  "arsehole", "dumbass", "dick", "dickhead", "cunt", "whore", "slut", "piss", "cock", "pussy", "twat", "wanker",
  "retard", "idiot", "stupid", "moron",
  // Romanized Nepali
  "muji", "mujhi", "muzi", "machikne", "machhikne", "mchikne", "machikney", "randi", "raandi", "rando", "lado",
  "puti", "geda", "jatha", "chikne", "chikney", "bhalu", "khate", "harami", "gandu", "chutiya", "chutia", "bhosdi",
  "bhosadi", "bhosdike", "kutta", "kutti", "kuttiya", "madarchod", "behenchod", "bhenchod",
  // Additional common invectives (see README: ordinary words like "kukur", "pagal", "pesa" are deliberately absent)
  "murkha", "badmas", "sala", "saley", "sali", "rande", "chhakka", "lauro", "chhucho", "chhuchi", "jantha", "gu",
  "gukhane", "gand", "gandako", "lund", "lundra", "lundri", "lodo", "chod", "chodna", "kichkich", "thukk", "nalayak",
  "beijjat", "nikamma", "fohor", "ghinlagdo", "nindaniya", "beshya", "hijada", "kamina", "haramzada", "paji", "radi",
  "moot",
  // Additional terms supplied for review by a native speaker
  "bhate", "chhura", "turi", "pakhe", "condo", "chaak", "gula", "bajiya", "torpe", "mukhulla", "gobre", "bhusya",
  "dhurt",
];

/** Latin stems: a word starting with one of these is refused ("fucking", "bitches", "machiknee", "retarded"). */
export const LATIN_STEMS: readonly string[] = [
  "fuck", "motherfuck", "bitch", "bastard", "asshol", "cunt", "whore", "slut", "wank", "retard", "machikn", "chutiy",
  "bhosd", "madarch", "behench", "bhench", "chikn", "chickn", "chod", "lund",
];

/** Whole words, Devanagari: Nepali, and Hindi slang common in Nepal. */
export const DEVANAGARI_WORDS: readonly string[] = [
  "मुजी", "मुजि", "माचिक्ने", "मचिक्ने", "रण्डी", "रन्डी", "रंडी", "रांडी", "लाडो", "लांडो", "पुती", "गेडा", "जाठा",
  "चिक्ने", "भालु", "खाते", "हरामी", "गान्डु", "गांडु", "चुतिया", "भोस्डी", "भोसडी", "कुत्ता", "कुत्ती", "मादरचोद",
  "बहनचोद", "भेनचोद",
  // Additional common invectives
  "मुर्ख", "मूर्ख", "बदमास", "साला", "साली", "रांडे", "छक्का", "लौरो", "छुच्चो", "छुच्ची", "जांठा", "गु", "गुखाने",
  "गान्ड", "लुंड", "लोडो", "चोद", "चोद्ना", "किचकिच", "थुक", "नालायक", "बेइज्जत", "निकम्मा", "फोहर", "फोहोर",
  "घिनलाग्दो", "निन्दनीय", "वेश्या", "हिजडा", "कमिना", "हरामजादा", "पाजी", "राडी", "मूत",
  // Devanagari spellings supplied for native-speaker review
  "चाक", "गुला", "बजिया", "गोबरे", "धूर्त",
  // Devanagari for the remaining romanized terms
  "रण्डो", "भोस्डीके", "कुत्तिया", "गान्डको", "लुन्ड्रा", "लुन्ड्री", "साले", "भाते", "छुरा", "तुरी", "पाखे",
  "कोंडो", "टोर्पे", "मुखुल्ला", "भुस्या",
];

/** Multi-word insults, matched as a whole ("chaak ko pwal", "pesa garne", "sasto manche"). Latin only for now. */
export const LATIN_PHRASES: readonly string[] = ["chaak ko pwal", "pesa garne", "sasto manche"];

/** Devanagari stems (see LATIN_STEMS). */
export const DEVANAGARI_STEMS: readonly string[] = ["माचिक्न", "मचिक्न", "चुतिय", "भोस्ड", "मादरच", "चोद"];

/** Nepali postpositions and plural endings that can be glued to a word ("mujiko", "मुजीको", "randiharu"). */
export const LATIN_SUFFIXES: readonly string[] = ["haruko", "harule", "haru", "ko", "ki", "ka", "le", "lai", "ma", "bata", "sanga"];
export const DEVANAGARI_SUFFIXES: readonly string[] = ["हरूको", "हरुको", "हरू", "हरु", "को", "की", "का", "ले", "लाई", "मा", "बाट", "सँग", "संग"];
