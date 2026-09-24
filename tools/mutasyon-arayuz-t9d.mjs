/**
 * mutasyon-arayuz-t9d.mjs — T9d bekçisinin MUTASYON SINAVI (D-148).
 *
 * Kararın mantık gövdesine (para biçimi · görünen cüzdan · tepsi ipucu anı · çok-adımlı sayaç) ve
 * sunum kablolarına (bant tutarı · gezinme katmanı · Sv 2-4 düğmesi) bilerek kusur sokulur;
 * `tests/arayuz-t9d.test.ts` düşmelidir. Gövde `mutasyon-zincir-t8a.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-arayuz-t9d.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/arayuz-t9d.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  {
    ad: 'M1 para yukari yuvarlaniyor',
    dosya: 'src/game/decimal.ts',
    bul: 'Math.floor(d.mantissa * Math.pow(10, d.exponent - grup * 3) * 10) / 10',
    koy: 'Math.round(d.mantissa * Math.pow(10, d.exponent - grup * 3) * 10) / 10',
    ne: '1,99 Mn "2 Mn" yazar — oyuncu olmayan parayi gorur',
  },
  {
    ad: 'M2 binlik ayraci kalkti',
    dosya: 'src/game/decimal.ts',
    bul: 'if (d.lt(1e6)) return Math.floor(d.toNumber()).toLocaleString(YEREL[dil]);',
    koy: 'if (d.lt(1e6)) return String(Math.floor(d.toNumber()));',
    ne: 'zemin "9950" doner (C1)',
  },
  {
    ad: 'M3 gorunen cuzdan cevrimdisi odulu iceriyor',
    dosya: 'src/game/store.ts',
    bul: 's.offlineEarned > 0 ? Decimal.max(0, s.wallet.sub(s.offlineEarned)) : s.wallet',
    koy: 's.wallet',
    ne: 'B11 geri gelir: "Al" hicbir sey eklemiyor gibi gorunur',
  },
  {
    ad: 'M4 tepsi ipucu yolda gelen musteriyi saymiyor',
    dosya: 'src/game/ekranKanali.ts',
    bul: "(n.state === 'toTable' || n.state === 'waitingForTea') &&",
    koy: "n.state === 'waitingForTea' &&",
    ne: 'B2 geri gelir: ilk servis ortasinda ekran kararir',
  },
  {
    ad: 'M5 tepsi ipucu ilk servisten once',
    dosya: 'src/game/ekranKanali.ts',
    bul: 'if (s.tray + s.trayFood <= 0 || s.teasServed < 1) return false;',
    koy: 'if (s.tray + s.trayFood <= 0) return false;',
    ne: 'ilk cayi alan oyuncu ipucuyla karsilasir',
  },
  {
    ad: 'M6 cok-adimli sayac alan filtresini unuttu',
    dosya: 'src/game/rules.ts',
    bul: 'const cur = lvls.filter((l) => (l ?? 0) >= target.level).length;',
    koy: 'const cur = ctx.tableLevels.filter((l) => (l ?? 0) >= target.level).length;',
    ne: 'Salon 1 gorevi baska salonun masasini sayar (kart 3/4, gorev bitmez)',
  },
  {
    ad: 'M7 bant yine toplam maliyeti yaziyor',
    dosya: 'src/components/ui/HUD.tsx',
    bul: "  if (q.target.type !== 'pad') return q.cost;\n  return Math.max(0, Math.ceil(q.cost - (padFills[q.target.id] ?? 0)));",
    koy: '  return q.cost;',
    ne: 'B8 geri gelir: bant 9.950, zemin 4.200',
  },
  {
    ad: 'M8 Sv 2-4 ekraninda yine bos 2x vaadi',
    dosya: 'src/components/ui/HUD.tsx',
    bul: 'const katlanir = amount > 0 || diamonds > 0;',
    koy: 'const katlanir = true;',
    ne: 'K3 geri gelir: 0 TL icin "Al" + "Izle, 2x al"',
  },
  {
    ad: 'M9 gezinme karartmanin altinda',
    dosya: 'src/components/ui/hud.css',
    bul: '.side-stack.spot-acik {\n  z-index: 31;',
    koy: '.side-stack.spot-acik {\n  z-index: 13;',
    ne: 'B1 geri gelir: ilk dokunus yalniz karartmayi kapatir',
  },
  {
    ad: 'M10 tost gorevi 5e dondu',
    dosya: 'src/config/economy.config.ts',
    bul: "target: { type: 'serveTost', count: 3 }",
    koy: "target: { type: 'serveTost', count: 5 }",
    ne: 'D-148 geri alinir: gorev 1,4-8,9 dk sacilir',
  },
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
console.log('=== T9d arayuz bekcisi — mutasyon sinavi ===');
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
