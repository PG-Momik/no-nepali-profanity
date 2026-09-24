// Writes words.csv from the compiled lexicon (run `npm run build` first).
// Columns: kind (word | stem | phrase | suffix), word (Latin form), devanagari (paired spelling or "").
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lexicon } from "../dist/index.js";

const PAIRED = {
  // English (Latin only)
  fuck: "", fuk: "", fck: "", phuck: "", shit: "", shitty: "", shithead: "", bullshit: "", bitch: "", bastard: "",
  ass: "", asshole: "", arsehole: "", dumbass: "", dick: "", dickhead: "", cunt: "", whore: "", slut: "", piss: "",
  cock: "", pussy: "", twat: "", wanker: "", retard: "", idiot: "", stupid: "", moron: "",
  // Romanized Nepali / Hindi
  muji: "मुजी", mujhi: "मुजी", muzi: "मुजी", machikne: "माचिक्ने", machhikne: "माचिक्ने", mchikne: "मचिक्ने",
  machikney: "माचिक्ने", randi: "रंडी", raandi: "रांडी", rando: "रण्डो", lado: "लाडो", puti: "पुती", geda: "गेडा",
  jatha: "जाठा", chikne: "चिक्ने", chikney: "चिक्ने", bhalu: "भालु", khate: "खाते", harami: "हरामी", gandu: "गान्डु",
  chutiya: "चुतिया", chutia: "चुतिया", bhosdi: "भोस्डी", bhosadi: "भोसडी", bhosdike: "भोस्डीके", kutta: "कुत्ता",
  kutti: "कुत्ती", kuttiya: "कुत्तिया", madarchod: "मादरचोद", behenchod: "बहनचोद", bhenchod: "भेनचोद",
  murkha: "मुर्ख", badmas: "बदमास", sala: "साला", saley: "साले", sali: "साली", rande: "रांडे", chhakka: "छक्का",
  lauro: "लौरो", chhucho: "छुच्चो", chhuchi: "छुच्ची", jantha: "जांठा", gu: "गु", gukhane: "गुखाने", gand: "गान्ड",
  gandako: "गान्डको", lund: "लुंड", lundra: "लुन्ड्रा", lundri: "लुन्ड्री", lodo: "लोडो", chod: "चोद",
  chodna: "चोद्ना", kichkich: "किचकिच", thukk: "थुक", nalayak: "नालायक", beijjat: "बेइज्जत", nikamma: "निकम्मा",
  fohor: "फोहोर", ghinlagdo: "घिनलाग्दो", nindaniya: "निन्दनीय", beshya: "वेश्या", hijada: "हिजडा", kamina: "कमिना",
  haramzada: "हरामजादा", paji: "पाजी", radi: "राडी", moot: "मूत",
  bhate: "भाते", chhura: "छुरा", turi: "तुरी", pakhe: "पाखे", condo: "कोंडो", chaak: "चाक", gula: "गुला",
  bajiya: "बजिया", torpe: "टोर्पे", mukhulla: "मुखुल्ला", gobre: "गोबरे", bhusya: "भुस्या", dhurt: "धूर्त",
  // Stems
  motherfuck: "", asshol: "", wank: "", behench: "", bhench: "", chikn: "चिक्न", chickn: "",
  machikn: "माचिक्न", chutiy: "चुतिय", bhosd: "भोस्ड", madarch: "मादरच", chod: "चोद", lund: "लुंड",
  // Phrases
  "chaak ko pwal": "चाकको प्वाल", "pesa garne": "पेसा गर्ने", "sasto manche": "सस्तो मान्छे",
  // Suffixes
  haruko: "हरूको", harule: "हरूले", haru: "हरू", ko: "को", ki: "की", ka: "का", le: "ले", lai: "लाई", ma: "मा",
  bata: "बाट", sanga: "संग",
};

const rows = [];
const push = (kind, word, devanagari) => rows.push([kind, word ?? "", devanagari ?? ""]);

for (const w of lexicon.LATIN_WORDS) push("word", w, PAIRED[w]);
for (const d of lexicon.DEVANAGARI_WORDS) if (!Object.values(PAIRED).includes(d)) push("word", "", d);
for (const s of lexicon.LATIN_STEMS) push("stem", s, PAIRED[s]);
for (const d of lexicon.DEVANAGARI_STEMS) if (!Object.values(PAIRED).includes(d)) push("stem", "", d);
for (const p of lexicon.LATIN_PHRASES) push("phrase", p, PAIRED[p]);
for (const s of lexicon.LATIN_SUFFIXES) push("suffix", s, PAIRED[s]);
for (const d of lexicon.DEVANAGARI_SUFFIXES) if (!Object.values(PAIRED).includes(d)) push("suffix", "", d);

const csv = (v) => (v && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const out = [["kind", "word", "devanagari"], ...rows.map((r) => r.map(csv).join(","))].join("\n") + "\n";
const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "words.csv");
writeFileSync(target, out);
console.log(`wrote ${rows.length} rows to ${path.basename(target)}`);
