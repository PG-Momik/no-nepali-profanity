import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lexicon } from "../dist/index.js";

const PAIRED = {
  fuck: "", fuk: "", fck: "", phuck: "", shit: "", shitty: "", shithead: "", bullshit: "", bitch: "", bastard: "",
  ass: "", asshole: "", arsehole: "", dumbass: "", dick: "", dickhead: "", cunt: "", whore: "", slut: "", piss: "",
  cock: "", pussy: "", twat: "", wanker: "", retard: "", idiot: "", stupid: "", moron: "",
  muji: "मुजी", mujhi: "मुजी", muzi: "मुजी", machikne: "माचिक्ने", machhikne: "माचिक्ने", mchikne: "मचिक्ने", mcikne: "माचिक्ने",
  machikney: "माचिक्ने", randi: "रण्डी", raandi: "रांडी", rando: "रण्डो", rande: "राण्डे", radi: "राडी", lado: "लाडो",
  lodo: "लोडो", puti: "पुती", geda: "गेडा", jatha: "जाठा", jantha: "जांठा", jathya: "जाठ्या", chikne: "चिक्ने", chikney: "चिक्ने",
  bhalu: "भालु", khate: "खाते", harami: "हरामी", gandu: "गाण्डु", chutiya: "चुतिया", chutia: "चुतिया", bhosdi: "भोसडी",
  bhosadi: "भोसडी", bhosdike: "भोस्डीके", bsdk: "भोस्डीके", kutta: "कुत्ता", kutti: "कुत्ती", kuttiya: "कुत्तिया",
  madarchod: "मादरचोद", behenchod: "बहनचोद", bhenchod: "भेनचोद", murkha: "मूर्ख", badmas: "बदमास", sala: "साला",
  saley: "साले", sali: "साली", chhakka: "छक्का", lauro: "लौरो", chhucho: "छुच्चो", chhuchi: "छुच्ची", gu: "गु",
  gukhane: "गुखाने", gand: "गान्ड", gaand: "गाण्ड", gandako: "गान्डको", lund: "लुण्ड", lundra: "लुन्ड्रा", lundri: "लुन्ड्री",
  chod: "चोद", chodna: "चोद्ना", thukk: "थुक", nalayak: "नालायक", beijjat: "बेइज्जत", nikamma: "निकम्मा", fohor: "फोहोर",
  ghinlagdo: "घिनलाग्दो", nindaniya: "निन्दनीय", beshya: "वेश्या", hijada: "हिजडा", kamina: "कमिना", haramzada: "हरामजादा",
  paji: "पाजी", moot: "मूत", bhate: "भाते", chhura: "छुरा", turi: "तुरी", pakhe: "पाखे", condo: "कोंडो", kando: "काण्डो",
  chaak: "चाक", gula: "गुला", bajiya: "बजिया", torpe: "टोर्पे", mukhulla: "मुखुल्ला", gobre: "गोबरे", bhusya: "भुस्या",
  dhurt: "धूर्त", kano: "कानो", lato: "लाटो", lati: "लाटी",
  motherfuck: "", asshol: "", wank: "", behench: "बहनच", bhench: "भेनच", chikn: "चिक्न", chickn: "चिक्न",
  machikn: "माचिक्न", mchikn: "मचिक्न", chutiy: "चुतिय", bhosd: "भोस्ड", madarch: "मादरच", rand: "रण्ड", jath: "जाठ",
  cond: "कोंड", kand: "कान्ड",
  "chaak ko pwal": "चाकको प्वाल", "pesa garne": "पेसा गर्ने", "sasto manche": "सस्तो मान्छे", "tero aama ko": "तेरो आमाको",
  "muji jasto": "मुजी जस्तो", "lado khaye": "लाडो खाए", "randi ko choro": "राण्डीको छोरो", "gand mara": "गाण्ड मरा",
  haruko: "हरूको", harule: "हरूले", haru: "हरू", ko: "को", ki: "की", ka: "का", le: "ले", lai: "लाई", ma: "मा",
  bata: "बाट", sanga: "संग", ni: "नि", ne: "ने", yo: "यो"
};

const rows = [];
const push = (kind, word, devanagari) => rows.push([kind, word ?? "", devanagari ?? ""]);

for (const w of lexicon.LATIN_WORDS) push("word", w, PAIRED[w] ?? "");

const pairedDevValues = new Set(Object.values(PAIRED).filter(Boolean));
for (const d of lexicon.DEVANAGARI_WORDS) {
  if (!pairedDevValues.has(d)) push("word", "", d);
}

for (const s of lexicon.LATIN_STEMS) push("stem", s, PAIRED[s] ?? "");
for (const d of lexicon.DEVANAGARI_STEMS) {
  if (!pairedDevValues.has(d)) push("stem", "", d);
}

for (const p of lexicon.LATIN_PHRASES) push("phrase", p, PAIRED[p] ?? "");
if (lexicon.DEVANAGARI_PHRASES) {
  for (const d of lexicon.DEVANAGARI_PHRASES) {
    if (!pairedDevValues.has(d)) push("phrase", "", d);
  }
}

for (const s of lexicon.LATIN_SUFFIXES) push("suffix", s, PAIRED[s] ?? "");
for (const d of lexicon.DEVANAGARI_SUFFIXES) {
  if (!pairedDevValues.has(d)) push("suffix", "", d);
}

const csv = (v) => (v && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const out = [["kind", "word", "devanagari"], ...rows.map((r) => r.map(csv).join(","))].join("\n") + "\n";

const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "words.csv");
writeFileSync(target, out);
console.log(`Successfully wrote ${rows.length} rows to ${path.basename(target)}`);