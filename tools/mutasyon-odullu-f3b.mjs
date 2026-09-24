/**
 * mutasyon-odullu-f3b.mjs — F3b bekçisinin MUTASYON SINAVI (D-150).
 *
 * Seçilen kolların sayısına (2× · günde 1 Usta), tavan kuralına (O2), hak sayaçlarına, kayda ve
 * HUD kablolarına (hedef ekranı reklamsız · ödül yalnız izleyince) bilerek kusur sokulur;
 * `tests/odullu-f3b.test.ts` düşmelidir. Gövde `mutasyon-arayuz-t9d.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-odullu-f3b.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/odullu-f3b.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  {
    ad: 'M1 kat 2 -> 1',
    dosya: 'src/config/economy.config.ts',
    bul: 'claimMult: 2,',
    koy: 'claimMult: 1,',
    ne: '"Izle, 2x al" 1x verir',
  },
  {
    ad: 'M2 seviye odulu izlemeyi yok sayiyor',
    dosya: 'src/game/store.ts',
    bul: 'const amount = s.levelUp.amount * (izledi ? C.rewarded.claimMult : 1);',
    koy: 'const amount = s.levelUp.amount;',
    ne: 'izleyen oyuncu 1x alir',
  },
  {
    ad: 'M3 cevrimdisi 2x tavandan SONRA (O1)',
    dosya: 'src/game/rules.ts',
    bul: 'return Math.max(0, Math.min(raw * C.rewarded.claimMult, cap) - Math.min(raw, cap));',
    koy: 'return Math.min(raw, cap) * (C.rewarded.claimMult - 1);',
    ne: '1 sa donuste iki pad (alanin ici biter)',
  },
  {
    ad: 'M4 Usta reklaminin gunluk siniri yok',
    dosya: 'src/game/store.ts',
    bul: `    if (masterAdsLeft(s.reklam, gun) <= 0) return false;
`,
    koy: '',
    ne: 'U-sonsuz: kuyruk bir gunde biter',
  },
  {
    ad: 'M5 Usta reklami tavan sartini atliyor',
    dosya: 'src/game/store.ts',
    bul: `    if (!ustaAcilabilir(s, id)) return false;
    const gun`,
    koy: '    const gun',
    ne: 'Usta kritik yola girer (D-093)',
  },
  {
    ad: 'M6 video hakki tazelenmiyor',
    dosya: 'src/game/rules.ts',
    bul: `const taze = simdi < r.videoPencere || simdi - r.videoPencere >= per;
  const kullanilan`,
    koy: `const taze = false;
  const kullanilan`,
    ne: '4 videodan sonra hak bir daha gelmez',
  },
  {
    ad: 'M7 hedef ekranina Izle geri geldi',
    dosya: 'src/components/ui/HUD.tsx',
    bul: 'claimTestid="goal-reward-ok"',
    koy: `claimTestid="goal-reward-ok"
          onIzle={() => claimGoal(odul.id)}`,
    ne: 'Eh2: hedef elmasi 2x, Usta kuyrugu ilk gun biter',
  },
  {
    ad: 'M8 video izlenmeden odul',
    dosya: 'src/components/ui/HUD.tsx',
    bul: 'if (await odulluIzle()) claimVideo();',
    koy: `await odulluIzle();
    claimVideo();`,
    ne: 'reklam yarida kalsa da para verilir',
  },
  {
    ad: 'M9 reklam sayaci kayda gitmiyor',
    dosya: 'src/game/store.ts',
    bul: `      reklam: { ...s.reklam },
`,
    koy: '',
    ne: 'uygulamayi kapatip acmak hakki tazeler',
  },
  {
    ad: 'M10 gunluk gorev izlemeyi yok sayiyor',
    dosya: 'src/game/store.ts',
    bul: 'diamonds: s.diamonds.add(odul * (izledi ? C.rewarded.claimMult : 1)),',
    koy: 'diamonds: s.diamonds.add(odul),',
    ne: 'Eg2 bozulur: izleyen 1x elmas alir',
  },
  {
    ad: 'M11 video odulu kazanc izine giriyor',
    dosya: 'src/game/store.ts',
    bul: `      lifetime: s.lifetime.add(odul),
      gelirIzi: izKaydir(s.gelirIzi, odul),`,
    koy: `      lifetime: s.lifetime.add(odul),`,
    ne: 'arka arkaya videolar katlanir (240 -> 480 -> 960)',
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
console.log('=== F3b odullu bekcisi — mutasyon sinavi ===');
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
