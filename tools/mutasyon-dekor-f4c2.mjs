/**
 * mutasyon-dekor-f4c2.mjs — F4c-2 💎 dekor bekçisinin MUTASYON SINAVI.
 *
 * Duvar profiline, paya, yuva yerlerine, çizim ölçeğine, kilide, satın almaya ve kayda bilerek
 * kusur sokulur; `tests/vitrin-dekor-f4c2.test.ts` (+ `pencere-nis`) düşmelidir.
 * Gövde `mutasyon-vitrin-f4c.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-dekor-f4c2.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/vitrin-dekor-f4c2.test.ts', 'tests/pencere-nis.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  { ad: 'M1 cita profilden duser', dosya: 'src/config/decor.ts',
    bul: '  if (y0 < RAIL_TOP && y1 > WAINSCOT_H) t = Math.max(t, WALL_T_RAIL / 2);\n', koy: '', ne: 'yere oturan esya citaya 0,02 gomulur (kullanicinin kusuru)' },
  { ad: 'M2 pay sifir', dosya: 'src/config/decor.ts',
    bul: 'export const DUVAR_PAYI = 0.02;', koy: 'export const DUVAR_PAYI = 0;', ne: 'esya duvara yapisik, en kucuk sapmada gomulur' },
  { ad: 'M3 konsol eski hatta', dosya: 'src/config/decor.ts',
    bul: 'export const WALL_BACK = FLOOR_HALF + WALL_M - WALL_T_RAIL / 2 - DUVAR_PAYI;', koy: 'export const WALL_BACK = WALL_FACE;', ne: 'konsol/TV/petek yine 0,04 gomulu (B5)' },
  { ad: 'M4 semaver peteğin ustunde', dosya: 'src/config/decor.ts',
    bul: "{ id: 'semaver', duvar: 'sag', boy: -2.2,", koy: "{ id: 'semaver', duvar: 'sag', boy: 7.4,", ne: 'yuva bugunku dekorun icine duser (duzen bozulur)' },
  { ad: 'M5 yilbasi TV unitesinin icinde', dosya: 'src/config/decor.ts',
    bul: "{ id: 'yilbasi', duvar: 'sol', boy: 13.05,", koy: "{ id: 'yilbasi', duvar: 'sol', boy: 11.4,", ne: 'yilbasi koltugu TV unitesine girer' },
  { ad: 'M6 saat lavabo kapisinin onunde', dosya: 'src/config/decor.ts',
    bul: "{ id: 'saat', duvar: 'wc', boy: 8.2,", koy: "{ id: 'saat', duvar: 'wc', boy: 13.4,", ne: 'saat kapi boslugunda havada' },
  { ad: 'M7 radyo yuvasi dar', dosya: 'src/config/decor.ts',
    bul: "{ id: 'radyo', duvar: 'sol', boy: -2.2, w: 0.9, d: 0.91,", koy: "{ id: 'radyo', duvar: 'sol', boy: -2.2, w: 0.9, d: 0.9,", ne: 'cizilen dolap yuvadan tasar (ilk kosuda gercekten yakalanmisti)' },
  { ad: 'M8 koltuk paketin olceginde', dosya: 'src/components/three/vitrinDekorLook.ts',
    bul: 'export const KOLTUK_S = 0.7;', koy: 'export const KOLTUK_S = 0.9;', ne: 'koltuk kanepe boyu, yuvadan tasar' },
  { ad: 'M9 kilit yok', dosya: 'src/game/vitrin.ts',
    bul: '  return !!y && yuvaAlani(y) >= 0 && yuvaAlani(y) < areasOpen;', koy: '  return !!y;', ne: 'goremeyecegi esyaya elmas harcatir' },
  { ad: 'M10 store kilide bakmaz', dosya: 'src/game/store.ts',
    bul: "    if (kind === 'decor' && !dekorAcik(id, s.areasOpen)) return false;\n", koy: '', ne: 'kilitli yuvaya satis' },
  { ad: 'M11 ikinci basis kaldirmaz', dosya: 'src/game/vitrin.ts',
    bul: '  if (yeni[yuva] === id) delete yeni[yuva];\n  else yeni[yuva] = id;', koy: '  yeni[yuva] = id;', ne: 'dekor bir kez konunca kaldirilamaz' },
  { ad: 'M12 sahiplik sarti yok', dosya: 'src/game/vitrin.ts',
    bul: " && vitrinSahip(s, 'decor', id) && dekorAcik(id, s.areasOpen))", koy: ' && dekorAcik(id, s.areasOpen))', ne: 'kayitta yazan her dekor bedava cizilir' },
  { ad: 'M13 dekor kayda girmez', dosya: 'src/game/store.ts',
    bul: '    dekor: { ...s.dekor },\n', koy: '', ne: 'alinan dekor yeniden acilista kaybolur' },
  { ad: 'M14 her dokunusta elmas', dosya: 'src/game/store.ts',
    bul: '    if (!vitrinSahip(s, kind, id)) {\n      if (urun.paket', koy: '    if (true) {\n      if (urun.paket', ne: 'koy/kaldir her seferinde elmas duser' },
];

const dosyalar = [...new Set(MUTASYONLAR.map((m) => m.dosya))];
const asil = new Map();
const crlf = new Map();
for (const d of dosyalar) {
  const ham = readFileSync(path.join(KOK, d), 'utf8');
  crlf.set(d, ham.includes('\r\n'));
  asil.set(d, ham.replace(/\r\n/g, '\n'));
}
const yaz = (d, metin) => writeFileSync(path.join(KOK, d), crlf.get(d) ? metin.replace(/\n/g, '\r\n') : metin, 'utf8');
const hepsiniGeriYaz = () => { for (const d of dosyalar) yaz(d, asil.get(d)); };

// KIRLI BASLANGIC KORUMASI (gerekce `mutasyon-izdiham-t6.mjs`): askida kalmis bir onceki kosu
// dosyayi mutasyonlu birakmissa sinav KOSMAZ.
const kirli = MUTASYONLAR.filter((m) => m.koy && asil.get(m.dosya).includes(m.koy) && !asil.get(m.dosya).includes(m.bul));
if (kirli.length) {
  console.error('!! KIRLI BASLANGIC — kaynak dosyada mutasyon izi var, sinav KOSMADI:');
  for (const m of kirli) console.error(`   · ${m.ad} (${m.dosya})`);
  process.exit(2);
}

let kacan = 0;
let bulunamayan = 0;
console.log('=== F4c-2 dekor bekcisi — mutasyon sinavi ===');
console.log('');
try {
  for (const m of MUTASYONLAR) {
    const govde = asil.get(m.dosya);
    if (!govde.includes(m.bul)) {
      console.log(`?? ${m.ad}: KALIP BULUNAMADI (${m.dosya})`);
      bulunamayan++;
      continue;
    }
    yaz(m.dosya, govde.replace(m.bul, m.koy));
    let dustu = false;
    try {
      execFileSync('npx', ['vitest', 'run', ...TESTLER], { cwd: KOK, stdio: 'pipe', shell: true, timeout: 180_000 });
    } catch {
      dustu = true;
    }
    yaz(m.dosya, govde);
    console.log(`${dustu ? 'OK ' : '!! '}${m.ad} -> ${dustu ? 'bekci YAKALADI' : 'bekci KACIRDI'}`);
    console.log(`    ${m.ne}`);
    if (!dustu) kacan++;
  }
} finally {
  hepsiniGeriYaz();
}

console.log('');
console.log(`${MUTASYONLAR.length - kacan - bulunamayan}/${MUTASYONLAR.length} mutasyon yakalandi.`);
if (kacan || bulunamayan) {
  console.error('!! SINAV TEMIZ DEGIL — kacan mutasyon ya da bulunamayan kalip var.');
  process.exitCode = 1;
}
