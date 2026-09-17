/**
 * mutasyon-yon-f6.mjs — `tests/ekran-yonu-f6.test.ts` BEKÇİSİNİ DOĞRULAR (D-132).
 *
 * NEDEN: yeşil test tek başına hiçbir şey kanıtlamaz — hiçbir şeyi denetlemeyen bir test de
 * yeşildir. D-084 §"kesilmez": bekçi en az iki MUTASYONLA doğrulanır. Burada altı mutasyon var
 * ve her biri kararın gerçek bir çiğnenme biçimini taklit ediyor:
 *
 *   M1  yön `portrait`e kilitlenir          → K0 kararının doğrudan ihlali
 *   M2  yön beyanı tamamen silinir          → karar YAZISIZ kalır (bugüne kadarki hâl)
 *   M3  yön `fullSensor` yapılır            → dört yön açık AMA cihaz kilidini EZER
 *   M4  `orientation` configChanges'ten düşer → her döndürmede oturum sıfırlanır
 *   M5  `.char-card`ın shrink düzeltmesi geri alınır → ölçülen döndürme kusuru geri gelir
 *   M6  yön JS'ten kilitlenir               → manifest serbestken karar arka kapıdan çiğnenir
 *
 * M5 ÖZELLİKLE ÖNEMLİ: taklit ettiği kusur DURAN KAREDE GÖRÜNMÜYOR. Ne göz ne duman testi onu
 * yakalar; yalnız "shrink kilidi açık mı" diye bakan denetim yakalar. Bekçinin varlık sebebi bu.
 *
 * Her mutasyon uygulanır, test koşulur, dosya GERİ ALINIR. Test o mutasyonda kırılmıyorsa
 * bekçi o kırılma biçimini görmüyor demektir ve araç kırmızı döner.
 *
 * Koşu: node tools/mutasyon-yon-f6.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(KOK, 'android/app/src/main/AndroidManifest.xml');
const HUD = path.join(KOK, 'src/components/ui/hud.css');
const HUD_TSX = path.join(KOK, 'src/components/ui/HUD.tsx');

const MUTASYONLAR = [
  {
    id: 'M1',
    ad: 'yon portrait\'e kilitlendi (K0 kararinin dogrudan ihlali)',
    dosya: MANIFEST,
    uygula: (s) => s.replace('android:screenOrientation="fullUser"', 'android:screenOrientation="portrait"'),
  },
  {
    id: 'M2',
    ad: 'yon beyani tamamen silindi (karar YAZISIZ kalir)',
    dosya: MANIFEST,
    uygula: (s) => s.replace(/\n\s*android:screenOrientation="fullUser"/, ''),
  },
  {
    id: 'M3',
    ad: 'yon fullSensor yapildi (cihazin dondurme kilidini EZER)',
    dosya: MANIFEST,
    uygula: (s) => s.replace('android:screenOrientation="fullUser"', 'android:screenOrientation="fullSensor"'),
  },
  {
    id: 'M4',
    ad: 'orientation configChanges\'ten dustu (her dondurmede oturum sifirlanir)',
    dosya: MANIFEST,
    uygula: (s) => s.replace('android:configChanges="orientation|keyboardHidden', 'android:configChanges="keyboardHidden'),
  },
  {
    id: 'M5',
    ad: 'char-card shrink duzeltmesi geri alindi (DURAN KAREDE GORUNMEYEN kusur geri gelir)',
    dosya: HUD,
    uygula: (s) => s.replace(/\.char-card \{\n  flex-shrink: 1;\n\}/, '.char-card {\n  flex-shrink: 0;\n}'),
  },
  {
    id: 'M6',
    ad: 'yon JS\'ten kilitlendi (manifest serbestken arka kapi)',
    dosya: HUD_TSX,
    uygula: (s) => `${s}\n// mutasyon\nvoid (() => { screen.orientation.lock('portrait'); });\n`,
  },
];

function testKos() {
  try {
    execFileSync('npx', ['vitest', 'run', 'tests/ekran-yonu-f6.test.ts'], {
      cwd: KOK, stdio: 'pipe', shell: process.platform === 'win32',
    });
    return { kirildi: false };
  } catch (e) {
    const cikti = String(e.stdout ?? '') + String(e.stderr ?? '');
    const satir = cikti.split('\n').find((l) => /×|FAIL/.test(l))?.trim() ?? '(ad okunamadi)';
    return { kirildi: true, satir };
  }
}

const taban = testKos();
if (taban.kirildi) {
  console.error('*** TABAN KIRMIZI — mutasyona gecilmez. Once testi duzelt.');
  console.error('   ', taban.satir);
  process.exit(1);
}
console.log('# MUTASYON DENETIMI — tests/ekran-yonu-f6.test.ts (D-132)');
console.log('');
console.log('  taban: TEMIZ (mutasyonsuz kosu yesil)');
console.log('');

let kacan = 0;
for (const m of MUTASYONLAR) {
  const orijinal = fs.readFileSync(m.dosya, 'utf8');
  const mutant = m.uygula(orijinal);
  if (mutant === orijinal) {
    console.log(`  ${m.id}  *** MUTASYON UYGULANAMADI (kalip tutmadi) — ${m.ad}`);
    kacan++;
    continue;
  }
  fs.writeFileSync(m.dosya, mutant);
  const s = testKos();
  fs.writeFileSync(m.dosya, orijinal);
  if (s.kirildi) {
    console.log(`  ${m.id}  YAKALANDI   ${m.ad}`);
    console.log(`        ${s.satir}`);
  } else {
    console.log(`  ${m.id}  *** KACTI *** ${m.ad}`);
    kacan++;
  }
}

console.log('');
if (kacan) {
  console.log(`SONUC: ${kacan} mutasyon KACTI — bekci bu kirilma bicimlerini gormuyor.`);
  process.exit(1);
}
console.log(`SONUC: ${MUTASYONLAR.length}/${MUTASYONLAR.length} mutasyon yakalandi — bekci gecerli.`);
