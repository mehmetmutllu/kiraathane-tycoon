/**
 * olcum-ses-ayirt.ts — ses kataloğunun "KULAKTAN AYIRT EDİLEBİLİR" iddiasını ÖLÇER (Faz E · E4).
 *
 * NEDEN BU ÖLÇÜM: `src/game/audio.ts` sentez sesleri için şunu iddia ediyor — değerler "müzik"
 * değil OKUNABİLİRLİK için seçildi; amaç olayların KULAKTAN ayırt edilebilmesi. Bu bir TASARIM
 * İDDİASI ve E3'te hiç sınanmadı. E4 "hangi kaynaktan ses dosyası alalım" turu olarak açıldı, ama
 * o sorunun ÖNÜNDE duran soru buydu: motor dosya olmadan da çalıyor, yani "sentez NİHAİ olsun"
 * gerçek bir kol (D-013'ün sesteki karşılığı). Kol ancak iddia ölçülürse tartışılabilir.
 *
 * NE ÖLÇÜLÜYOR: 9 sesin İKİŞERLİ (36 çift) ayırt edilebilirliği. Ses "duyulamaz" ama sesin
 * FİZİĞİ hesaplanabilir: her ses PCM'e çevrilir, log-frekans bantlı spektrogramı çıkarılır ve
 * çiftler arası mesafe ölçülür.
 *
 * TAKLİT YOK (E4'ün mimarî düzeltmesi): örnekler `src/game/audioSynth.ts`in KENDİ `seslendir`
 * fonksiyonundan gelir — oyuncunun duyduğu tamponun ta kendisi. E3'te sentez `audioWeb.ts` içinde
 * WebAudio düğümleriyle kuruluydu ve bu araç o zinciri TAKLİT etmek zorundaydı; ölçülen kod ile
 * duyulan kod ayrıydı ve sapmayı hiçbir şey tutmuyordu. Artık tek bir üretim yeri var.
 * (Bu yüzden sentez `Math.random` değil TOHUMLU gürültü kullanır: koşudan koşuya değişen bir
 * gürültü ölçümü tekrarlanamaz kılardı. Damgalardan biri bunu her koşuda doğruluyor.)
 *
 * İKİ KANAL, ÇÜNKÜ İKİ DİNLEME DURUMU VAR:
 *   · MUTLAK — sesler ART ARDA duyulursa. Mutlak perde burada güçlü bir ipucudur.
 *   · JEST   — sesler DAKİKALARCA ARAYLA duyulursa (oyunun gerçek hâli: `level` saatte bir,
 *     `coin` saniyede bir). Mutlak perde hafızada tutulmaz; kalan şey JESTtir — tını, katman
 *     yapısı ve ARALIK ÖRÜNTÜSÜ. Bu kanalda her sesin bütün frekansları, ilk katmanın ilk
 *     değeri 440 Hz olacak şekilde ölçeklenir; yani perde farkı silinir, jest kalır.
 *   Bu ayrımı ölçümün KENDİSİ doğurdu: tek kanalla sonuç 36/36 "AYRI" çıkıyordu, oysa E3'ün
 *   `quest` (660-880) ve `reward` (988-1319) sesleri aynı dalga, aynı nota sayısı, aynı yükselen
 *   dörtlü ve 0,6 JND süre farkıyla AYNI JESTİN transpozesiydi. Metrik yanlış değildi — sorulan
 *   soru eksikti.
 *
 * SÜRE üçüncü ve BAĞIMSIZ kanaldır: spektrogram zamanda 32 kareye normalize edilir (yani ŞEKİL
 * karşılaştırılır), süre bu yüzden mesafeye girmez; ayrıca Weber oranıyla (%15) "kaç JND" olarak
 * ölçülür ve her iki hükme ikinci koşul olarak girer. 0,10 sn ile 0,55 sn, spektrumları ne olursa
 * olsun benzemez.
 *
 * EŞİK NEREDEN GELİYOR (sihirli sayı YOK): mesafenin kendisi anlamsızdır, kıyas gerekir. Her
 * kanalın KENDİ kalibrasyon tabanı ölçülür:
 *   · MUTLAK TABAN = aynı sesin 1 yarım ses tizleştirilmiş hâli (tanım gereği AYNI ses).
 *   · JEST TABANI  = aynı jestin son aralığı 1 yarım ses kaydırılmış hâli. (Jest kanalında
 *     transpoze mesafesi tanımı gereği 0'dır, o yüzden taban başka bir bozmadan gelmek zorunda.)
 * Bir çift kendi kanalının tabanının ALTINDAYSA, o kanalda ayrı ses sayılamaz.
 *
 * METRİĞİN BİLİNEN KUSURU (yönü İYİ tarafa): 24 bant 80 Hz - 12 kHz arasını kaplıyor, yani bir
 * bant ~3,6 yarım ses. Tek yarım seslik bozma çoğunlukla bant İÇİNDE kalıyor ve tabanları
 * olduğundan DÜŞÜK çıkarıyor. Düşük taban = dar eşik = araç karışan çifti EKSİK bildirir, fazla
 * değil. Bu yüzden §5'te metrikten TAMAMEN bağımsız yapısal sayılar da basılıyor (aile + tını +
 * aralık örüntüsü ikizleri): iki yöntem aynı çifti gösteriyorsa bulgu metriğe bağlı değildir.
 *
 * ÖLÇMEDİĞİ ŞEY (bilerek): iki sesin oyunda BİRBİRİNE YAKIN ZAMANDA düşüp düşmediği. `sesOlaylari`
 * tek karede birden çok olay döndürebiliyor ve motor onları aralıksız çalıyor; hangi bileşimlerin
 * gerçekten ulaşılabilir olduğu oyun kurallarının işi, bu aracın değil.
 *
 * KOŞU KİPİ YOK: araç ANALİTİK (tick simülasyonu yok), deterministik ve saniyeler sürer.
 * `OLCUM=kisa|tam` ayrımı burada anlamsız olurdu — kısaltılacak bir şey yok. Yine de koşu
 * `OLCUM=tam` ile alınır: `olcum-lib`in damga özeti kip etiketini basıyor ve "rapora yalnız
 * tam-koşu damgalı sayı girer" kuralı (D-084) etiketin "tam" demesini istiyor.
 *
 * Çalıştır:  OLCUM=tam npx tsx tools/olcum-ses-ayirt.ts > docs/olcum-ses-ayirt.txt
 */
import { SES_KATALOG, sesSure, type SesId } from '../src/game/audio.ts';
import { seslendir } from '../src/game/audioSynth.ts';
import {
  YARIM_SES, SURE_WEBER, aile, araligiBoz, izParmak, jestHali, mesafe, oruntu, tini, transpoze,
} from './ses-metrik.ts';
import { damga, damgaOzeti } from './olcum-lib';

// METRIK ARTIK 'tools/ses-metrik.ts'TE (S17): ayni cetvel hazir .ogg DOSYALARINI da olcuyor.
// Cikarma davranisi degistirmedi — bu aracin ciktisi cikarmadan once ve sonra bayt bayt ayni.

// --- Olcum -----------------------------------------------------------------
const IDLER = Object.keys(SES_KATALOG) as SesId[];

console.log('='.repeat(84));
console.log('SES AYIRT EDILEBILIRLIGI — sentez seslerinin olcumu (Faz E · E4)');
console.log('ANALITIK ARAC · kosu kipi yok · deterministik · TAKLIT YOK: ornekler audioSynth.ts-ten');
console.log('='.repeat(84));

const mutlak = new Map<SesId, number[][]>();
const jest = new Map<SesId, number[][]>();
for (const id of IDLER) {
  mutlak.set(id, izParmak(SES_KATALOG[id].katmanlar));
  jest.set(id, izParmak(jestHali(SES_KATALOG[id].katmanlar)));
}

const mutlakTabanlar = IDLER.map((id) =>
  mesafe(mutlak.get(id)!, izParmak(transpoze(SES_KATALOG[id].katmanlar, YARIM_SES))));
const MUTLAK_TABAN = mutlakTabanlar.reduce((a, b) => a + b, 0) / mutlakTabanlar.length;

// Jest tabani yalnizca ARALIGI OLAN seslerden hesaplanir; tek degerli sesin bozulacak araligi yok.
const jestTabanIdler = IDLER.filter((id) => oruntu(SES_KATALOG[id].katmanlar).length > 0);
const jestTabanlar = jestTabanIdler.map((id) =>
  mesafe(jest.get(id)!, izParmak(jestHali(araligiBoz(SES_KATALOG[id].katmanlar)))));
const JEST_TABAN = jestTabanlar.reduce((a, b) => a + b, 0) / jestTabanlar.length;

console.log('\n§1 KATALOG');
console.log('id        aile      tini              katman  sure(sn)  aralik(sn)  oruntu(yariton)');
for (const id of IDLER) {
  const k = SES_KATALOG[id].katmanlar;
  const o = oruntu(k);
  console.log(
    id.padEnd(9) + ' ' + aile(k).padEnd(9) + ' ' + tini(k).padEnd(17) + ' ' +
    String(k.length).padEnd(7) + ' ' + sesSure(id).toFixed(3).padEnd(9) + ' ' +
    SES_KATALOG[id].aralik.toFixed(2).padEnd(11) + ' ' +
    (o.length ? o.map((a) => (a > 0 ? '+' + a : String(a))).join(',') : '—'));
}

console.log('\n§2 KALIBRASYON (iki kanal, iki taban)');
console.log('MUTLAK TABAN (ayni ses, 1 yarim ses tiz)    = ' + MUTLAK_TABAN.toFixed(2) + ' dB');
console.log('JEST TABAN   (ayni jest, araligi 1 yariton) = ' + JEST_TABAN.toFixed(2) + ' dB');
console.log('  -> Bir cift kendi kanalinin tabaninin ALTINDAYSA, o kanalda AYRI SES SAYILAMAZ.');
console.log('  Mutlak taban / ses: ' + IDLER.map((id, i) => id + ' ' + mutlakTabanlar[i].toFixed(1)).join(' · '));
console.log('  Jest taban / ses  : ' + jestTabanIdler.map((id, i) => id + ' ' + jestTabanlar[i].toFixed(1)).join(' · '));

interface Cift { a: SesId; b: SesId; dm: number; dj: number; sureJnd: number; hukum: string }
const cifter: Cift[] = [];
for (let i = 0; i < IDLER.length; i++) {
  for (let j = i + 1; j < IDLER.length; j++) {
    const a = IDLER[i];
    const b = IDLER[j];
    const dm = mesafe(mutlak.get(a)!, mutlak.get(b)!);
    const dj = mesafe(jest.get(a)!, jest.get(b)!);
    const sureJnd = Math.abs(Math.log(sesSure(a) / sesSure(b))) / Math.log(SURE_WEBER);
    const sureYakin = sureJnd < 2;
    const hukum = dm < MUTLAK_TABAN && sureYakin ? 'KARISIR'
      : dj < JEST_TABAN && sureYakin ? 'AYNI JEST'
        : 'AYRI';
    cifter.push({ a, b, dm, dj, sureJnd, hukum });
  }
}
cifter.sort((x, y) => x.dj - y.dj);

console.log('\n§3 CIFTLER (36 · JEST mesafesine gore artan)');
console.log('cift                    mutlak(dB) jest(dB)  sure(JND)  hukum      jest/taban');
for (const c of cifter) {
  console.log(
    (c.a + ' <-> ' + c.b).padEnd(23) + ' ' + c.dm.toFixed(2).padStart(7) + '  ' +
    c.dj.toFixed(2).padStart(7) + '   ' + c.sureJnd.toFixed(1).padStart(6) + '     ' +
    c.hukum.padEnd(10) + ' x' + (c.dj / JEST_TABAN).toFixed(2));
}

const karisan = cifter.filter((c) => c.hukum === 'KARISIR');
const ayniJest = cifter.filter((c) => c.hukum === 'AYNI JEST');

console.log('\n§4 OZET');
console.log('KARISIR   : ' + karisan.length + '/36  ' + (karisan.map((c) => c.a + '<->' + c.b).join(' · ') || '—'));
console.log('AYNI JEST : ' + ayniJest.length + '/36  ' + (ayniJest.map((c) => c.a + '<->' + c.b).join(' · ') || '—'));
console.log('AYRI      : ' + (36 - karisan.length - ayniJest.length) + '/36');
console.log('EN YAKIN  : ' + cifter[0].a + ' <-> ' + cifter[0].b +
  ' (jest ' + cifter[0].dj.toFixed(2) + ' dB = x' + (cifter[0].dj / JEST_TABAN).toFixed(2) + ' taban)');

// --- §5 Yapisal sayilar — metrikten BAGIMSIZ -------------------------------
console.log('\n§5 YAPISAL SAYILAR (metrikten bagimsiz)');
const aileSay = new Map<string, SesId[]>();
for (const id of IDLER) {
  const a = aile(SES_KATALOG[id].katmanlar);
  aileSay.set(a, [...(aileSay.get(a) ?? []), id]);
}
for (const [a, ids] of aileSay) console.log('Aile ' + a.padEnd(9) + ': ' + ids.length + '/9 — ' + ids.join(' · '));
const tiniSay = new Map<string, number>();
for (const id of IDLER) {
  const t = tini(SES_KATALOG[id].katmanlar);
  tiniSay.set(t, (tiniSay.get(t) ?? 0) + 1);
}
console.log('Tini dagilimi: ' + [...tiniSay].map(([k, v]) => k + ' ' + v).join(' · '));
const cikanArpej = IDLER.filter((id) => {
  const o = oruntu(SES_KATALOG[id].katmanlar);
  return o.length > 0 && o.every((v) => v > 0);
});
console.log('Yukselen arpej (aralikli, hep tizlesen): ' + cikanArpej.length + '/9 — ' + cikanArpej.join(' · '));
// IKIZ: ayni aile + ayni tini + ayni aralik oruntusu. Jest kanalinin yapisal karsiligi.
const ikizHarita = new Map<string, SesId[]>();
for (const id of IDLER) {
  const k = SES_KATALOG[id].katmanlar;
  const anahtar = aile(k) + '|' + tini(k) + '|' + oruntu(k).join(',');
  ikizHarita.set(anahtar, [...(ikizHarita.get(anahtar) ?? []), id]);
}
const ikizler = [...ikizHarita.entries()].filter(([, v]) => v.length > 1);
console.log('IKIZ (ayni aile + tini + oruntu): ' + ikizler.length + ' grup — ' +
  (ikizler.map(([k, v]) => v.join('/') + ' (' + k + ')').join(' · ') || '—'));

// --- Damgalar --------------------------------------------------------------
damga(
  'sentez sessiz degil',
  IDLER.every((id) => seslendir(SES_KATALOG[id].katmanlar).some((v) => Math.abs(v) > 1e-3)),
  'bir ses hic ornek uretmedi');
damga(
  'sentez deterministik',
  IDLER.every((id) => {
    const a = seslendir(SES_KATALOG[id].katmanlar);
    const b = seslendir(SES_KATALOG[id].katmanlar);
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }),
  'ayni katmanlar iki farkli tampon uretti — gurultu tohumsuz');
damga('mesafe kendisiyle 0', IDLER.every((id) => mesafe(mutlak.get(id)!, mutlak.get(id)!) === 0));
damga(
  'mesafe simetrik',
  cifter.every((c) =>
    Math.abs(mesafe(mutlak.get(c.a)!, mutlak.get(c.b)!) - mesafe(mutlak.get(c.b)!, mutlak.get(c.a)!)) < 1e-9));
damga('mutlak taban pozitif', MUTLAK_TABAN > 0, 'taban ' + MUTLAK_TABAN.toFixed(3));
damga('jest taban pozitif', JEST_TABAN > 0, 'taban ' + JEST_TABAN.toFixed(3));
// Jest kanali GERCEKTEN perdeyi siliyor mu? Transpoze edilmis kopyanin jest mesafesi ~0 olmali.
// Bu damga olmasaydi jestHali() sessizce etkisiz kalabilir ve kanal mutlagin kopyasi olurdu.
damga(
  'jest kanali perdeyi siliyor',
  IDLER.every((id) =>
    mesafe(jest.get(id)!, izParmak(jestHali(transpoze(SES_KATALOG[id].katmanlar, 1.5)))) < 1e-9),
  'transpoze kopya jest kanalinda ayni cikmadi — perde silinmemis');
damga(
  'iki kanal ayni sey degil',
  cifter.some((c) => Math.abs(c.dm - c.dj) > 0.5),
  'jest ve mutlak mesafeler ayni — kanal eklemek olcumu degistirmemis');
damgaOzeti();
