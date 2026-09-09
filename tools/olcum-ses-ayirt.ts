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
import { ORNEKLEME, seslendir, type Katman } from '../src/game/audioSynth.ts';
import { damga, damgaOzeti } from './olcum-lib';

const YARIM_SES = Math.pow(2, 1 / 12);
const SURE_WEBER = 1.15; // sure JND'si ~%15 (kisa seslerde Weber orani) — 1 JND = 1.15 kat

// --- Katman yardimcilari ---------------------------------------------------
/** Butun katmanlarin butun frekanslarini `k` ile olcekler (transpoze). */
const transpoze = (katmanlar: readonly Katman[], k: number): Katman[] =>
  katmanlar.map((kat) => ({ ...kat, hz: kat.hz.map((h) => h * k) }));

/** JEST hali: ilk katmanin ilk frekansi 440 Hz'e tasinir, oranlar korunur → mutlak perde silinir. */
const jestHali = (katmanlar: readonly Katman[]): Katman[] =>
  transpoze(katmanlar, 440 / katmanlar[0].hz[0]);

/** Cok degerli ILK katmanin SON degeri 1 yarim ses kaydirilir — "ayni jest, bir tik farkli". */
function araligiBoz(katmanlar: readonly Katman[]): Katman[] {
  const i = katmanlar.findIndex((k) => k.hz.length > 1);
  if (i < 0) return katmanlar.map((k) => ({ ...k }));
  return katmanlar.map((k, j) => {
    if (j !== i) return { ...k };
    const hz = k.hz.slice();
    hz[hz.length - 1] = hz[hz.length - 1] * YARIM_SES;
    return { ...k, hz };
  });
}

/**
 * BASKIN katman = en yuksek kazancli olan. Uc teshis (aile · tini · oruntu) hep BUNU okur.
 *
 * Ilk hali "cok degerli ILK katman" diyordu ve bu YANLIS teshis uretiyordu: `padFill`in ilk
 * katmani gurultu supurmesi (400->2000 Hz), tonal ucluyu (440-660-880) golgeliyordu; oruntu
 * "+28" cikiyordu, oysa kulagin duydugu jest "+7,+5". Ikiz denetimi de bu kolona baktigi icin
 * gercek bir ikizi KACIRABILIRDI. Teshis, sesin en yuksek katmanini anlatmali.
 */
const baskin = (katmanlar: readonly Katman[]): Katman =>
  katmanlar.reduce((a, b) => (b.gain > a.gain ? b : a));

/** Sesin aralik oruntusu (yariton): BASKIN katmanin kendi deger dizisinden. */
function oruntu(katmanlar: readonly Katman[]): number[] {
  const k = baskin(katmanlar);
  if (k.hz.length < 2) return [];
  return k.hz.slice(1).map((h, i) => Math.round(12 * Math.log2(h / k.hz[i])));
}

/** AILE: baskin katman gurultu ise FIZIKSEL, degilse TONAL. */
const aile = (katmanlar: readonly Katman[]): 'fiziksel' | 'tonal' =>
  baskin(katmanlar).kaynak === 'gurultu' ? 'fiziksel' : 'tonal';

/** TINI: BASKIN katmanin uretim bicimi — inharmonik kismi (can/metal), klasik dalga, ya da gurultu. */
function tini(katmanlar: readonly Katman[]): string {
  const k = baskin(katmanlar);
  if (k.kaynak === 'gurultu') return 'gurultu q=' + (k.q ?? 1);
  return k.kismi ? 'kismi:' + k.kismi.join('/') : (k.dalga ?? 'sine');
}

// --- Spektrogram -----------------------------------------------------------
const PENCERE = 512;
const ATLAMA = 128;
const BANT = 24;
const BANT_ALT = 80;
const BANT_UST = 12000;
const KARE = 32; // zamanda normalize edilen kare sayisi (SEKIL karsilastirilir)
const DIP = -60; // dB tabani: bunun alti sessizlik sayilir

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    const yari = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < yari; k++) {
        const ur = re[i + k], ui = im[i + k];
        const xr = re[i + k + yari], xi = im[i + k + yari];
        const vr = xr * cr - xi * ci, vi = xr * ci + xi * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + yari] = ur - vr; im[i + k + yari] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/** Bant kenarlari: log-frekans (kulagin olcegi), 80 Hz - 12 kHz arasi 24 bant. */
const BANT_KENAR = Array.from({ length: BANT + 1 }, (_, i) =>
  BANT_ALT * Math.pow(BANT_UST / BANT_ALT, i / BANT));

/** PCM -> [kare][bant] dB matrisi; tepe 0 dB'e normalize (yukseklik degil SEKIL karsilastirilir). */
function spektrogram(pcm: Float32Array): number[][] {
  const kareler: number[][] = [];
  const hann = Array.from({ length: PENCERE }, (_, i) =>
    0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (PENCERE - 1)));
  for (let bas = 0; bas + PENCERE <= pcm.length; bas += ATLAMA) {
    const re = new Float64Array(PENCERE);
    const im = new Float64Array(PENCERE);
    for (let i = 0; i < PENCERE; i++) re[i] = pcm[bas + i] * hann[i];
    fft(re, im);
    const bantlar = new Array<number>(BANT).fill(0);
    for (let b = 1; b < PENCERE / 2; b++) {
      const f = (b * ORNEKLEME) / PENCERE;
      if (f < BANT_ALT || f >= BANT_UST) continue;
      let j = 0;
      while (j < BANT - 1 && f >= BANT_KENAR[j + 1]) j++;
      bantlar[j] += re[b] * re[b] + im[b] * im[b];
    }
    kareler.push(bantlar.map((p) => 10 * Math.log10(p + 1e-12)));
  }
  if (kareler.length === 0) return [];
  let tepe = -Infinity;
  for (const k of kareler) for (const v of k) if (v > tepe) tepe = v;
  return kareler.map((k) => k.map((v) => Math.max(DIP, v - tepe)));
}

/** Zamanda KARE adede indirger — sure bilerek mesafeden cikarilir, ayri kanalda olculur. */
function zamandaNormalize(spek: number[][]): number[][] {
  if (spek.length === 0) {
    return Array.from({ length: KARE }, () => new Array<number>(BANT).fill(DIP));
  }
  const cikti: number[][] = [];
  for (let i = 0; i < KARE; i++) {
    const x = (i * (spek.length - 1)) / (KARE - 1);
    const a = Math.floor(x);
    const b = Math.min(spek.length - 1, a + 1);
    const t = x - a;
    cikti.push(spek[a].map((v, j) => v * (1 - t) + spek[b][j] * t));
  }
  return cikti;
}

const izParmak = (katmanlar: readonly Katman[]) => zamandaNormalize(spektrogram(seslendir(katmanlar)));

/** Iki spektrogram arasi ortalama mutlak fark (dB). Simetrik; kendisiyle 0. */
function mesafe(a: number[][], b: number[][]): number {
  let toplam = 0;
  for (let i = 0; i < KARE; i++) {
    for (let j = 0; j < BANT; j++) toplam += Math.abs(a[i][j] - b[i][j]);
  }
  return toplam / (KARE * BANT);
}

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
