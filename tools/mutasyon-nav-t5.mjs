/**
 * mutasyon-nav-t5.mjs — T5 bekçisinin MUTASYON SINAVI.
 *
 * NEDEN: "test yeşil" bir şey kanıtlamaz; testin YAKALADIĞI şey kanıtlar. Burada
 * `src/game/nav.ts`e bilerek kusur sokulur ve `tests/nav-kol-t5.test.ts`in düşmesi beklenir.
 * DÜŞMEYEN MUTASYON, bekçinin o yüzeyi hiç görmediğini söyler (D-085: kaçan mutasyon kodun
 * zayıf yerini gösterir).
 *
 * Kusurlar T5'in üç kolunun tam olarak ayrıştığı yerleri hedefler: kuşak damgası (N1a),
 * hedef testinin yeri (N1b), maske kutusu (N1c), tampon büyümesi, snap araması.
 *
 * ## Bu sınavın ilk koşularında DÖRT ŞEY ÇIKTI
 *   · **M5 kaçtı** ve bekçide gerçek bir kusur gösterdi: "ızgara boyu değişince" denetimi
 *     11×9 ↔ 114×90 arasında gidip geliyordu, ama dosyadaki ÖNCEKİ denetimler zaten 114×90'lık
 *     ızgarayla koştuğu için tampon en büyük boyda kurulmuş oluyordu — yani BÜYÜME hiç
 *     denenmiyordu. Denetim 200×160'a çıkarıldı; artık sıradan bağımsız.
 *   · **M2 ve M3 "kalıp bulunamadı" dedi** ve sınavın KENDİ kusurunu açtı: depo CRLF tutuyor,
 *     kalıplar LF yazıyordu; çok satırlı hiçbir kalıp tutmuyordu. Sınav "2/6 yakalandı" derken
 *     o ikisini aslında hiç DENEMEMİŞTİ — sessizce zayıf bir sınav. Artık dosya LF'e
 *     normalize edilip öyle aranıyor ve bulunamayan kalıp çıkış kodunu düşürüyor.
 *   · **M4 eşdeğer çıktı** (kaçması BEKLENİR, aşağıda `esdeger`): `rad`daki `+1` fazladan
 *     emniyet payıdır. Hücre merkezi `reach` içindeyse sütun farkı en çok `floor(reach/cell+0,5)`
 *     ve bu her zaman `ceil(reach/cell)`i geçmez — yani `+1` olmadan da aynı küme bulunur.
 *     Kod `+1`i koruyor (bedeli yok), sınav bunu kusur saymıyor.
 *   · **M5 sınavı ASTI** — mutasyon testi düşürmüyor, sonsuz döngüye sokuyor (kuyruk tamponu
 *     taşınca yazımlar sessizce düşer, `son` sınırsız büyür). Vitest senkron bir sonsuz döngüyü
 *     kesemez. Koşu dışarıdan öldürülünce `finally` hiç çalışmadı ve `nav.ts` MUTASYONLU kaldı;
 *     sonraki koşu o dosyayı "asıl" sanıp snapshot aldı. İki koruma eklendi: her mutasyona sert
 *     zaman aşımı (asmak da bir yakalamadır) ve başlamadan KİRLİ BAŞLANGIÇ denetimi.
 *
 * Koşu:  node tools/mutasyon-nav-t5.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEDEF = path.join(KOK, 'src/game/nav.ts');
const TEST = 'tests/nav-kol-t5.test.ts';

/** { ad, bul, koy, ne, esdeger? } — `esdeger` olan mutasyonun DÜŞMEMESİ beklenir. */
const MUTASYONLAR = [
  {
    ad: 'M1 kusak damgasi gevsetildi',
    bul: 'if (tHedef[nidx] === hedefKusak) { goalIdx = nidx; break dis; }',
    koy: 'if (tHedef[nidx] >= hedefKusak - 1) { goalIdx = nidx; break dis; }',
    ne: 'ONCEKI cagrinin hedef hucreleri de hedef sayilir — kalici tamponun tek korumasi kusaktir',
  },
  {
    ad: 'M2 kose kesme kurali silindi',
    bul: '      if (dc !== 0 && dr !== 0 && (blocked[cr * cols + nc] || blocked[nr * cols + cc])) continue;\n      tDamga[nidx] = kusak;\n      tPrev[nidx] = idx;',
    koy: '      tDamga[nidx] = kusak;\n      tPrev[nidx] = idx;',
    ne: 'capraz adim iki kapali komsunun arasindan gecer — aktor masa kosesini keser',
  },
  {
    ad: 'M3 kusak artirilmiyor',
    bul: '  const startIdx = nearestFreeIdx(grid, sc, sr); // bloklu başlangıcı en yakın açığa snap et\n  kusak++;',
    koy: '  const startIdx = nearestFreeIdx(grid, sc, sr); // bloklu başlangıcı en yakın açığa snap et',
    ne: 'bir onceki cagrinin ziyaret damgalari duruyor — ikinci cagridan sonra yol bozulur',
  },
  {
    ad: 'M4 maske kutusu bir hucre dar',
    bul: '  const rad = Math.ceil(reach / grid.cell) + 1;',
    koy: '  const rad = Math.ceil(reach / grid.cell);',
    ne: 'ESDEGER: `+1` emniyet payi, kumeyi degistirmez (dosya basindaki kanit)',
    esdeger: true,
  },
  {
    ad: 'M5 tampon buyumuyor',
    bul: '  if (tPrev.length < n) {',
    koy: '  if (tPrev.length === 0) {',
    ne: 'izgara buyuyunce eski kucuk tampon kullanilir — tasan yazimlar sessizce duser',
  },
  {
    ad: 'M6 hedef maskesi menzili sisirildi',
    bul: '      if (dx * dx + dz2 <= reach2) {',
    koy: '      if (dx * dx + dz2 <= reach2 * 1.2) {',
    ne: 'menzilden biraz uzaktaki hucre de hedef sayilir — aktor erken durur',
  },
  {
    ad: 'M7 snap kusagi artirilmiyor',
    bul: '  snapKusak++;\n  tSnap[start] = snapKusak;',
    koy: '  tSnap[start] = snapKusak;',
    ne: 'engel icinden baslayan aktor eski snap damgalarini gorur — yanlis hucreye snap eder',
  },
  {
    ad: 'M8 hedef maskesi kusagi sabit',
    bul: '  hedefKusak++;\n  let hedefVar = false;',
    koy: '  let hedefVar = false;',
    ne: 'onceki cagrinin hedef maskesi duruyor — aktor BASKA bir hedefin yaninda durur',
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

console.log('=== T5 nav bekcisi — mutasyon sinavi ===');
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
