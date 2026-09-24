/**
 * mutasyon-reklam-f3.mjs — F3 reklam bekçisinin MUTASYON SINAVI (D-144 · D-149).
 *
 * Geçişli kuralına (soğuma · ödül bayrağı · açılış), arka uç sağlamlığına ve yapılandırmaya
 * (çocuk bayrağı · SDK sabit sürüm · AAID · 2× düğmesi) bilerek kusur sokulur;
 * `tests/reklam-f3.test.ts` düşmelidir. Gövde `mutasyon-arayuz-t9d.mjs`ten.
 *
 * Koşu:  node tools/mutasyon-reklam-f3.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/reklam-f3.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  {
    ad: 'M1 odul bayragi yok sayiliyor',
    dosya: 'src/game/ads.ts',
    bul: 'if (g.panelOdul || g.reklamAcik) return false;',
    koy: 'if (g.reklamAcik) return false;',
    ne: 'odul ekranindan hemen sonra gecisli cikar (kullanici reddetti)',
  },
  {
    ad: 'M2 sogoma acilistan baslamiyor',
    dosya: 'src/game/ads.ts',
    bul: `const referans = Math.max(g.oturumBasi, g.sonGecisli ?? -Infinity);
  return`,
    koy: `const referans = g.sonGecisli ?? -Infinity;
  return`,
    ne: 'oyun acilir acilmaz ilk panel kapanisinda reklam',
  },
  {
    ad: 'M3 sogoma yarim',
    dosya: 'src/config/ads.config.ts',
    bul: 'gecisli: { sogumaSn: 180 }',
    koy: 'gecisli: { sogumaSn: 90 }',
    ne: 'D-144 C1prime 3 dk bozulur',
  },
  {
    ad: 'M4 kurulum hatasinda eski arka uc kaliyor',
    dosya: 'src/game/ads.ts',
    bul: `  arkaUc = null;
  oturumBasi = Date.now();`,
    koy: '  oturumBasi = Date.now();',
    ne: 'SDK kurulamadigi halde reklam cagrilir',
  },
  {
    ad: 'M5 panel bayragi sonraki panele tasiniyor',
    dosya: 'src/game/ads.ts',
    bul: '  panelOdul = false; // bayrak YALNIZ burada iner',
    koy: '  // bayrak YALNIZ burada iner',
    ne: 'tek odul sonraki tum kapanislari da reklamsiz yapar (ya da tersi)',
  },
  {
    ad: 'M6 cocuk bayragi kapali',
    dosya: 'src/config/ads.config.ts',
    bul: 'tagForChildDirectedTreatment: true,',
    koy: 'tagForChildDirectedTreatment: false,',
    ne: 'monetization.md 3 ihlali',
  },
  {
    ad: 'M7 SDK surumu yine dinamik',
    dosya: 'android/variables.gradle',
    bul: "playServicesAdsVersion = '25.4.0'",
    koy: "playServicesAdsVersion = '25.4.+'",
    ne: 'iki derleme iki farkli SDK alabilir',
  },
  {
    ad: 'M8 AAID izni geri geliyor',
    dosya: 'android/app/src/main/AndroidManifest.xml',
    bul: 'permission.AD_ID" tools:node="remove"',
    koy: 'permission.AD_ID"',
    ne: 'cocuk-guvenli kipte reklam kimligi okunur',
  },
  {
    ad: 'M9 2x dugmesi yine Al in islevi',
    dosya: 'src/components/ui/HUD.tsx',
    bul: `            onClick={onIzle}
`,
    koy: `            onClick={onClaim}
`,
    ne: 'F3 3D kusuru geri gelir: 2x diyip 1x verir',
  },
  {
    ad: 'M10 panel ici odul bayragi dusuruldu',
    dosya: 'src/components/ui/HUD.tsx',
    bul: `            claimGoal(odul.id);
            odulAlindi();
`,
    koy: `            claimGoal(odul.id);
`,
    ne: 'hedef odulunden sonra panel kapaninca reklam',
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
console.log('=== F3 reklam bekcisi — mutasyon sinavi ===');
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
