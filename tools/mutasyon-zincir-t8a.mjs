/**
 * mutasyon-zincir-t8a.mjs — T8a bekçisinin MUTASYON SINAVI (D-142).
 *
 * Kararın dört dosyaya dağılmış iddialarına bilerek kusur sokulur; `tests/zincir-t8a.test.ts`
 * düşmelidir. Hedefler kararın gövdesi: yükseltme noktası kapısı · geçiş penceresi · seviye ₺
 * kapısı · ödül birikimi · garson tepsi tabanı · kayıt göçü. Gövde `mutasyon-izdiham-t6.mjs`ten
 * (CRLF + kirli başlangıç koruması), çok dosyaya genişletildi.
 *
 * Koşu:  node tools/mutasyon-zincir-t8a.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TESTLER = ['tests/zincir-t8a.test.ts'];

/** { ad, dosya, bul, koy, ne } */
const MUTASYONLAR = [
  {
    ad: 'M1 nokta kapisi kalkti (her gorevde canli)',
    dosya: 'src/game/rules.ts',
    bul: '  if (!q) return true;\n  switch (q.target.type) {',
    koy: '  if (!q || q) return true;\n  switch (q.target.type) {',
    ne: 'G-61 geri gelir: ocak noktasi gorevi yokken de dolar',
  },
  {
    ad: 'M2 gecis penceresi yok sayildi',
    dosya: 'src/game/rules.ts',
    bul: '  !questInTransition(q) && upgradeSpotLive(kind, q.questIndex);',
    koy: '  upgradeSpotLive(kind, q.questIndex);',
    ne: 'kutlama surerken yeni hedef belirir (G-60 sirasi bozulur)',
  },
  {
    ad: 'M3 seviye TL kapisi kalkti',
    dosya: 'src/game/rules.ts',
    bul: '  if (level < C.xp.levelRewardFromLevel) return 0;\n',
    koy: '',
    ne: 'ilk seviyeler TL verir — acilis 22 -> 3 sn (K8b)',
  },
  {
    ad: 'M4 odul birikimi sifirlaniyor',
    dosya: 'src/game/tick.ts',
    bul: '      let amount = c.levelUp?.amount ?? 0;',
    koy: '      let amount = 0;',
    ne: 'ekran kapanmadan atlanan ikinci seviye ilkinin TL sini siler',
  },
  {
    ad: 'M5 garson tepsi tabani 1e dondu',
    dosya: 'src/config/economy.config.ts',
    bul: '  return economyConfig.waiter.trayBase + Math.min(',
    koy: '  return 1 + Math.min(',
    ne: 'G-72 geri gelir: garson tek bardakla baslar',
  },
  {
    ad: 'M6 kayit gocu kademeyi kaydirmiyor',
    dosya: 'src/game/save.ts',
    bul: 'tray: Math.max(0, (wu.tray ?? 0) - 1) }',
    koy: 'tray: wu.tray ?? 0 }',
    ne: 'eski kaydin garsonu bir bardak fazla tasir (kapasite korunmaz)',
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
console.log('=== T8a zincir bekcisi — mutasyon sinavi ===');
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
