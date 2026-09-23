/**
 * mutasyon-nav-onbellek-t9a.mjs — T9a (D-145) N2-kesin bekçisinin mutasyon sınavı.
 * `tools/mutasyon-nav-t5.mjs` kalıbı: her mutasyon `src/game/nav.ts`e yazılır, bekçi koşar, geri alınır.
 *
 * Koşu:  node tools/mutasyon-nav-onbellek-t9a.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEDEF = path.join(KOK, 'src/game/nav.ts');
const TEST = 'tests/nav-onbellek-t9a.test.ts';

/** { ad, bul, koy, ne, esdeger? } — `esdeger` olan mutasyonun DÜŞMEMESİ beklenir. */
const MUTASYONLAR = [
  {
    ad: 'M1 anahtardan reach dustu',
    bul: '${sr * grid.cols + sc}|${tx}|${tz}|${reach}',
    koy: '${sr * grid.cols + sc}|${tx}|${tz}',
    ne: 'ayni hucreden ayni hedefe farkli menzille gelen aktor oncekinin rotasini alir',
  },
  {
    ad: 'M2 izgara degisince temizlenmiyor',
    bul: '  if (grid !== onbellekIzgara) {\n    onbellek.clear();',
    koy: '  if (grid !== onbellekIzgara) {',
    ne: 'masa/alan acilinca eski izgaranin rotalari kullanilir — yeni masanin icinden gecer',
  },
  {
    ad: 'M3 anahtar hucre yerine iki hucrelik kutu',
    bul: '  const anahtar = `${sr * grid.cols + sc}|',
    koy: '  const anahtar = `${(sr >> 1) * grid.cols + (sc >> 1)}|',
    ne: 'komsu hucredeki aktorun rotasi paylasilir — ilk waypoint yanlis hucreden baslar',
  },
  {
    ad: 'M4 uretimde kapali',
    bul: 'let onbellekAcik = true;',
    koy: 'let onbellekAcik = false;',
    ne: 'D-145 sessizce geri alinir — tick x10 kazanc kaybolur, hicbir sey cokmez',
  },
  {
    ad: 'M5 hedef anahtardan dustu (yalniz x)',
    bul: '|${tx}|${tz}|${reach}',
    koy: '|${tx}|${reach}',
    ne: 'ayni sutundaki iki masa ayni anahtara duser — garson yanlis masaya yurur',
  },
];

// Depo CRLF tutuyor; kaliplar LF yaziyor. Once normalize et, sonra duz metin ara.
const asilHam = readFileSync(HEDEF, 'utf8');
const crlfMi = asilHam.includes('\r\n');
const asil = asilHam.replace(/\r\n/g, '\n');
const yaz = (metin) => writeFileSync(HEDEF, crlfMi ? metin.replace(/\n/g, '\r\n') : metin, 'utf8');

/**
 * KIRLI BASLANGIC KORUMASI — bu sinav bir kez tam buradan yara aldi: onceki kosu (arka planda,
 * askida kalan bir mutasyon yuzunden) OLDURULDU, `finally` hic calismadi ve `nav.ts` MUTASYONLU
 * kaldi. Sonraki kosu o dosyayi "asil" sanip snapshot aldi; yani sinav mutasyonlu bir tabanin
 * uzerine mutasyon koydu ve sonunda dosyayi mutasyonlu hale GERI YAZACAKTI. Sessizce bozulan
 * bir uretim dosyasindan daha kotu bir sinav yoktur. Baslamadan once kontrol edilir.
 */
const kirli = MUTASYONLAR.filter((m) => asil.includes(m.koy) && !asil.includes(m.bul));
if (kirli.length) {
  console.error('!! KIRLI BASLANGIC — kaynak dosyada mutasyon izi var, sinav KOSMADI:');
  for (const m of kirli) console.error(`   · ${m.ad}`);
  console.error('   `git diff src/game/nav.ts` ile bak, once dosyayi temizle.');
  process.exit(2);
}

let kacan = 0;
let bulunamayan = 0;

console.log('=== T9a nav onbellek bekcisi — mutasyon sinavi ===');
console.log(`hedef ${path.relative(KOK, HEDEF).replace(/\\/g, '/')} · satir sonu ${crlfMi ? 'CRLF' : 'LF'}`);
console.log('');
try {
  for (const m of MUTASYONLAR) {
    if (!asil.includes(m.bul)) {
      console.log(`?? ${m.ad}: KALIP BULUNAMADI (kod degismis, mutasyon guncellenmeli)`);
      bulunamayan++;
      continue;
    }
    yaz(asil.replace(m.bul, m.koy));
    // ZAMAN ASIMI SART: bazi mutasyonlar testi DUSURMEZ, ASKIDA BIRAKIR. M5 (tampon buyumuyor)
    // tam olarak bunu yapiyor — kuyruk tamponu tasinca yazimlar sessizce dusuyor, `son` sinirsiz
    // buyuyor ve BFS sonsuz donuyor. Vitest senkron bir sonsuz donguyu kesemez; ilk kosuda sinav
    // burada kilitlendi. Askida kalmak da bir YAKALAMADIR: kod bozuldu, bekci normal bitmedi.
    let dustu = false;
    let askida = false;
    try {
      execFileSync('npx', ['vitest', 'run', TEST], {
        cwd: KOK, stdio: 'pipe', shell: true, timeout: 180_000,
      });
    } catch (e) {
      dustu = true;
      askida = e?.signal === 'SIGTERM' || e?.code === 'ETIMEDOUT';
    }
    const beklenen = m.esdeger ? !dustu : dustu;
    const etiket = m.esdeger
      ? (dustu ? 'ESDEGER SANILAN MUTASYON DUSTU (kanit yanlis)' : 'esdeger — kacmasi BEKLENIR')
      : (dustu ? (askida ? 'bekci YAKALADI (mutasyon ASKIDA biraktirdi)' : 'bekci YAKALADI') : 'bekci KACIRDI');
    console.log(`${beklenen ? 'OK ' : '!! '}${m.ad} -> ${etiket}`);
    console.log(`    ${m.ne}`);
    if (!beklenen) kacan++;
  }
} finally {
  yaz(asil);
}

const gercek = MUTASYONLAR.filter((m) => !m.esdeger).length;
console.log('');
console.log(`${gercek - kacan}/${gercek} gercek mutasyon yakalandi (+${MUTASYONLAR.length - gercek} esdeger).`);
if (kacan || bulunamayan) {
  console.error('!! SINAV TEMIZ DEGIL — kacan mutasyon ya da bulunamayan kalip var.');
  process.exitCode = 1;
}
