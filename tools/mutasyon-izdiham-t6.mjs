/**
 * mutasyon-izdiham-t6.mjs — T6 bekçisinin MUTASYON SINAVI (D-140).
 *
 * `src/game/tick.ts`e bilerek kusur sokulur; `tests/izdiham-t6.test.ts` ile S18'in bekçisi
 * `tests/musteri-ayrisma.test.ts` birlikte koşar ve düşmeleri beklenir. İkisi birlikte, çünkü
 * muafiyet kümesi iki turun ortak yüzeyi: T6 `leaving`i ekledi, S18 oturanları korur.
 * Kusurlar kararın üç iddiasını hedefler: `leaving` muaf · diğer üyeler bozulmadı ·
 * silme hâlâ sokak noktasında. Ortak gövde `mutasyon-nav-t5.mjs`ten (CRLF + kirli başlangıç).
 *
 * Koşu:  node tools/mutasyon-izdiham-t6.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEDEF = path.join(KOK, 'src/game/tick.ts');
const TESTLER = ['tests/izdiham-t6.test.ts', 'tests/musteri-ayrisma.test.ts'];

/** { ad, bul, koy, ne, esdeger? } — `esdeger` olan mutasyonun DÜŞMEMESİ beklenir. */
const MUTASYONLAR = [
  {
    ad: 'M1 leaving muafiyetten cikarildi',
    bul: "'waitingForTea', 'drinking', 'inWc', 'wcGiris', 'wcCikis', 'leaving',",
    koy: "'waitingForTea', 'drinking', 'inWc', 'wcGiris', 'wcCikis',",
    ne: 'kararin geri alinmasi — cikis kalabaligi sokakta halka kurup kilitlenir',
  },
  {
    ad: 'M2 drinking muafiyetten cikarildi',
    bul: "'waitingForTea', 'drinking', 'inWc', 'wcGiris', 'wcCikis', 'leaving',",
    koy: "'waitingForTea', 'inWc', 'wcGiris', 'wcCikis', 'leaving',",
    ne: 'kume duzenlenirken eski uye dustu — cay icen musteri koltugundan itilir',
  },
  {
    ad: 'M3 ic dongu bekcisi silindi',
    bul: '      if (AYRISMASIZ.has(b.state)) continue;',
    koy: '      /* bekci yok */',
    ne: 'yuruyen, muaf olanı (oturan/cikan) itebilir — S18 karisik cift kusuru',
  },
  {
    ad: 'M4 silme yaricapi sessizce acildi',
    bul: '          const R = kol?.silmeYariCapi ?? 0;',
    koy: '          const R = kol?.silmeYariCapi ?? 0.8;',
    ne: 'izdiham baska yoldan "cozulur": NPC sokaga varmadan silinir (eski S3)',
  },
  {
    ad: 'M5 kapi esiginde silme',
    bul: '          if (vardi || (R > 0 && dist2D(n.pos, hedef) <= R)) removed.push(n.id);',
    koy: '          removed.push(n.id);',
    ne: 'kapiya gelen aninda kaybolur — sokak yuruyusu hic cizilmez',
  },
];

// Depo CRLF tutuyor; kaliplar LF yaziyor. Once normalize et, sonra duz metin ara.
const asilHam = readFileSync(HEDEF, 'utf8');
const crlfMi = asilHam.includes('\r\n');
const asil = asilHam.replace(/\r\n/g, '\n');
const yaz = (metin) => writeFileSync(HEDEF, crlfMi ? metin.replace(/\n/g, '\r\n') : metin, 'utf8');

/**
 * KIRLI BASLANGIC KORUMASI — bu sinav bir kez tam buradan yara aldi: onceki kosu (arka planda,
 * askida kalan bir mutasyon yuzunden) OLDURULDU, `finally` hic calismadi ve `tick.ts` MUTASYONLU
 * kaldi. Sonraki kosu o dosyayi "asil" sanip snapshot aldi; yani sinav mutasyonlu bir tabanin
 * uzerine mutasyon koydu ve sonunda dosyayi mutasyonlu hale GERI YAZACAKTI. Sessizce bozulan
 * bir uretim dosyasindan daha kotu bir sinav yoktur. Baslamadan once kontrol edilir.
 */
const kirli = MUTASYONLAR.filter((m) => asil.includes(m.koy) && !asil.includes(m.bul));
if (kirli.length) {
  console.error('!! KIRLI BASLANGIC — kaynak dosyada mutasyon izi var, sinav KOSMADI:');
  for (const m of kirli) console.error(`   · ${m.ad}`);
  console.error('   `git diff src/game/tick.ts` ile bak, once dosyayi temizle.');
  process.exit(2);
}

let kacan = 0;
let bulunamayan = 0;

console.log('=== T6 izdiham bekcisi — mutasyon sinavi ===');
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
      execFileSync('npx', ['vitest', 'run', ...TESTLER], {
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
