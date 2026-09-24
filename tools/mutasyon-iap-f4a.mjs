/**
 * mutasyon-iap-f4a.mjs — F4a bekçisinin MUTASYON SINAVI (D-152).
 *
 * Ölçülen sayılara (B100 · 25/60/150), çift ödül korumasına, reklamsız kuralına, sıfırlamaya,
 * mağaza eşitlemesine, cihaz arka ucuna, vitrin kapısına ve HUD kablolarına bilerek kusur sokulur;
 * `tests/iap-f4a.test.ts` düşmelidir. Gövde `mutasyon-odullu-f3b.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-iap-f4a.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/iap-f4a.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  { ad: 'M1 baslangic 100 -> 250', dosya: 'src/config/economy.config.ts',
    bul: 'starterDiamonds: 100,', koy: 'starterDiamonds: 250,', ne: 'olculmemis kol (B250)' },
  { ad: 'M2 paket 150 -> 300', dosya: 'src/config/economy.config.ts',
    bul: 'diamondPacks: [25, 60, 150],', koy: 'diamondPacks: [25, 60, 300],', ne: 'olu elmas satilir' },
  { ad: 'M3 cift islem korumasi yok', dosya: 'src/game/rules.ts',
    bul: 'if (!g || s.islenen.includes(islem)) return null;', koy: 'if (!g) return null;', ne: 'ayni islem iki kez elmas verir' },
  { ad: 'M4 baslangic elmasi tekrar verilir', dosya: 'src/game/rules.ts',
    bul: 'const diamonds = g.baslangic && s.baslangic ? 0 : g.diamonds;', koy: 'const diamonds = g.diamonds;', ne: 'geri yuklemede bedava 100 elmas' },
  { ad: 'M5 reklamsiza gecisli cikar', dosya: 'src/game/ads.ts',
    bul: 'if (g.reklamsiz || g.panelOdul || g.reklamAcik) return false;', koy: 'if (g.panelOdul || g.reklamAcik) return false;', ne: 'para veren reklam gorur' },
  { ad: 'M6 sifirlama satin alimi siler', dosya: 'src/game/store.ts',
    bul: '    set({ satin: { ...satin, islenen: [...satin.islenen] } });\n    reklamsizAyarla(satin.reklamsiz);\n', koy: '', ne: 'reset reklamsizi kaybettirir' },
  { ad: 'M7 esitleme reklam katmanina inmez', dosya: 'src/game/store.ts',
    bul: '    set({ satin: { ...s.satin, reklamsiz: h.reklamsiz, baslangic: h.baslangic } });\n    reklamsizAyarla(h.reklamsiz);', koy: '    set({ satin: { ...s.satin, reklamsiz: h.reklamsiz, baslangic: h.baslangic } });', ne: 'iade sonrasi reklam hala kapali' },
  { ad: 'M8 cihazda sahte arka uc', dosya: 'src/game/iap.ts',
    bul: '(anahtar ? await dene(() => revenueCatArkaUcu(anahtar), null) : null)', koy: '(anahtar ? await dene(() => revenueCatArkaUcu(anahtar), null) : sahteArkaUc())', ne: 'anahtarsiz APK bedava urun verir' },
  { ad: 'M9 vitrin acik', dosya: 'src/config/iap.config.ts',
    bul: 'vitrin: { baslangic: false, elmas: false },', koy: 'vitrin: { baslangic: true, elmas: true },', ne: 'harcanacak yeri olmayan elmas satilir' },
  { ad: 'M10 hediye her acilista', dosya: 'src/game/rules.ts',
    bul: '=> s.reklamsiz && s.gunlukGun !== gun;', koy: '=> s.reklamsiz;', ne: 'gunde sinirsiz 10 elmas' },
  { ad: 'M11 fiyatsiz urun basilir', dosya: 'src/components/ui/HUD.tsx',
    bul: 'disabled={sahip || !fiyat}', koy: 'disabled={sahip}', ne: 'magaza hazir degilken dugme aktif' },
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
console.log('=== F4a satin alma bekcisi — mutasyon sinavi ===');
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
