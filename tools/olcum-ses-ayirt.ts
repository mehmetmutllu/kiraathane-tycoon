/**
 * olcum-ses-ayirt.ts — ses kataloğunun "KULAKTAN AYIRT EDİLEBİLİR" iddiasını ÖLÇER (Faz E · E4).
 *
 * NEDEN BU ÖLÇÜM: `src/game/audio.ts` sentez tonları için şunu yazıyor — "Ton değerleri 'müzik'
 * değil OKUNABİLİRLİK için seçildi... Amaç, dosyalar gelene kadar bile olayların KULAKTAN ayırt
 * edilebilmesi." Bu bir TASARIM İDDİASI ve E3'te hiç sınanmadı. E4 "hangi kaynaktan ses dosyası
 * alalım" turu olarak açıldı, ama o sorunun ÖNÜNDE duran soru bu: fallback zaten oyunu tam sesli
 * oynatıyor, yani "dosya HİÇ gelmesin, sentez nihai olsun" gerçek bir koldur (D-013'ün — primitive
 * = nihai sanat stili — sesteki karşılığı). O kol ancak iddia ölçülürse tartışılabilir.
 *
 * NE ÖLÇÜLÜYOR: 9 sesin İKİŞERLİ (36 çift) ayırt edilebilirliği. Ses "duyulamaz" ama sesin
 * FİZİĞİ hesaplanabilir: her ton, `audioWeb.ts`in `tonCal`i birebir taklit edilerek PCM'e
 * çevrilir, log-frekans bantlı spektrogramı çıkarılır ve çiftler arası mesafe ölçülür.
 *
 * NEDEN TAKLİT, NEDEN GERÇEK WebAudio DEĞİL: node'da AudioContext yok; olsaydı da çıktısı
 * hoparlöre giderdi, sayıya değil. Taklit `tonCal`in üç davranışını da kopyalar:
 *   · osilatör tipi (sine/square/triangle) — band-limitli TOPLAMSAL sentezle (WebAudio'nun
 *     dalga tablosu da band-limitlidir; naif dalga sahte tiz harmonik üretip mesafeyi şişirirdi),
 *   · frekansın `setValueAtTime` ile BASAMAK basamak değişmesi + FAZ SÜREKLİLİĞİ,
 *   · üstel zarf (0.0001 -> gain, 10 ms; sonra gain -> 0.0001, sürenin sonuna kadar).
 *
 * EŞİK NEREDEN GELİYOR (sihirli sayı YOK): mesafenin kendisi anlamsızdır, kıyas gerekir. İki
 * kalibrasyon kontrolü ölçülür:
 *   · TABAN  = her sesin KENDİSİYLE, yalnız 1 yarım ses tizleştirilmiş hâli arasındaki mesafe.
 *     Bu ikisi tanım gereği AYNI sestir — insan kulağı bunları OLAY olarak ayırt edemez.
 *     Gerçek bir çift bu mesafenin ALTINDAYSA, o çift "aynı sesin bir tık kaydırılmışı" kadar
 *     bile ayrı değildir.
 *   · TAVAN  = 36 gerçek çiftin en büyüğü (kataloğun kendi eriştiği en uzak mesafe).
 * SÜRE ayrı bir kanaldır ve bilerek ayrı ölçülür: spektrogram zamanda 32 kareye normalize edilir
 * (yani ŞEKİL karşılaştırılır), süre farkı bu yüzden mesafeye girmez. Süre, Weber oranıyla (%15)
 * "kaç JND" olarak ayrı raporlanır ve hükme İKİNCİ kanal olarak girer.
 *
 * İKİ KANAL, ÇÜNKÜ İKİ DİNLEME DURUMU VAR:
 *   · MUTLAK — sesler ART ARDA duyulursa. Mutlak perde burada güçlü bir ipucudur.
 *   · JEST   — sesler DAKİKALARCA ARAYLA duyulursa (oyunun gerçek hâli: `level` saatte bir,
 *     `coin` saniyede bir). Mutlak perde hafızada tutulmaz; kalan şey JESTtir — dalga biçimi,
 *     nota sayısı ve ARALIK ÖRÜNTÜSÜ. Bu kanalda her ton ilk notası 440 Hz olacak şekilde
 *     transpoze edilir, yani perde farkı silinir ve geriye yalnız jest kalır.
 *   Bu ayrımı eklememin sebebi ölçümün kendisi: tek kanalla 36/36 "AYRI" çıkıyordu, oysa
 *   `quest` (660-880) ile `reward` (988-1319) aynı dalga, aynı nota sayısı, aynı yükselen
 *   dörtlü aralık ve süre farkı 0,6 JND — yani AYNI JESTİN transpozesi. Tek kanal bunu
 *   göremiyordu; metrik değil, sorulan soru eksikti.
 *
 * ÖLÇMEDİĞİ ŞEY (bilerek): iki sesin oyunda BİRBİRİNE YAKIN ZAMANDA düşüp düşmediği. `sesOlaylari`
 * tek karede birden çok olay döndürebiliyor ve motor onları aralıksız arka arkaya çalıyor; hangi
 * bileşimlerin gerçekten ulaşılabilir olduğu oyun kurallarının işi, bu aracın değil. Karışan bir
 * çiftin ZARARI bu yüzden burada değil, karar paketinde tartışılır.
 *
 * METRİĞİN BİLİNEN KUSURU (yönü İYİ tarafa): 24 bant, 80 Hz - 12 kHz arasını kaplar, yani bir
 * bant ~3,6 yarım ses genişliğindedir. Tek yarım seslik bir bozma çoğu zaman bant İÇİNDE kalır ve
 * mesafeye zayıf yansır. Bunun sonucu, kalibrasyon TABANLARININ olduğundan düşük çıkmasıdır
 * (3-4 notalı seslerde jest tabanı ~0,0'a iniyor: bozulan son nota sürenin yalnız üçte/dörtte
 * birini kaplıyor). Düşük taban = DAR eşik = araç karışan çifti EKSİK bildirir, fazla değil.
 * Yani "KARIŞIR 0" sonucu iyimser olabilir; "AYNI JEST 1" sonucu ise sağlamdır. Bu yüzden §5'te
 * metrikten TAMAMEN bağımsız yapısal sayılar da basılıyor (dalga + aralık örüntüsü ikizleri):
 * iki yöntem aynı çifti gösteriyorsa bulgu metriğe bağlı değildir.
 *
 * KOŞU KİPİ YOK: araç ANALİTİK (tick simülasyonu yok), deterministik ve saniyeler sürer.
 * `OLCUM=kisa|tam` ayrımı burada anlamsız olurdu — kısaltılacak bir şey yok. Aynı gerekçe
 * `olcum-tek-odak.ts`te de geçerli. Çıktının tamamı yayınlanabilir. Yine de koşu `OLCUM=tam`
 * ile alınır: `olcum-lib`in damga özeti kip etiketini basıyor ve "rapora yalnız tam-koşu damgalı
 * sayı girer" kuralı (D-084) etiketin "tam" demesini istiyor — kipin kendisi burada işlevsiz.
 *
 * Çalıştır:  OLCUM=tam npx tsx tools/olcum-ses-ayirt.ts > docs/olcum-ses-ayirt.txt
 */
import { SES_KATALOG, type SesId, type SesTanim } from '../src/game/audio.ts';
import { damga, damgaOzeti } from './olcum-lib';

type Ton = SesTanim['ton'];

// --- Sentez ----------------------------------------------------------------
const SR = 32000; // örnekleme hızı (Nyquist 16 kHz — en tiz harmonikleri kapsar)
const ZARF_ATAK = 0.01; // audioWeb.ts: exponentialRampToValueAtTime(gain, t0 + 0.01)
const ZARF_TABAN = 0.0001; // audioWeb.ts: setValueAtTime(0.0001, t0)

/** Band-limitli osilatör örneği. Harmonikler Nyquist'te kesilir (WebAudio dalga tablosu gibi). */
function ornek(dalga: Ton['dalga'], faz: number, f0: number): number {
  if (dalga === 'sine') return Math.sin(faz);
  const nyq = SR / 2;
  let s = 0;
  if (dalga === 'square') {
    for (let k = 1; k * f0 < nyq; k += 2) s += Math.sin(k * faz) / k;
    return (4 / Math.PI) * s;
  }
  // triangle: tek harmonikler, 1/k^2, isaret donusumlu
  let isaret = 1;
  for (let k = 1; k * f0 < nyq; k += 2) {
    s += (isaret * Math.sin(k * faz)) / (k * k);
    isaret = -isaret;
  }
  return (8 / (Math.PI * Math.PI)) * s;
}

/** audioWeb.ts'in kazanç zarfı: üstel açılış (10 ms), sonra sürenin sonuna üstel kapanış. */
function zarf(t: number, ton: Ton): number {
  if (t <= 0) return ZARF_TABAN;
  if (t < ZARF_ATAK) return ZARF_TABAN * Math.pow(ton.gain / ZARF_TABAN, t / ZARF_ATAK);
  if (t < ton.sure) {
    return ton.gain * Math.pow(ZARF_TABAN / ton.gain, (t - ZARF_ATAK) / (ton.sure - ZARF_ATAK));
  }
  return ZARF_TABAN;
}

/** Tonu PCM'e çevirir. `transpoze` = frekans çarpanı (kalibrasyon kontrolü 1 yarım ses kullanır). */
function seslendir(ton: Ton, transpoze = 1): Float64Array {
  const n = Math.round(ton.sure * SR);
  const cikti = new Float64Array(n);
  const adim = ton.sure / ton.hz.length;
  let faz = 0; // FAZ SUREKLI: WebAudio osilatoru frekans degisiminde fazi sifirlamaz
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = ton.hz[Math.min(ton.hz.length - 1, Math.floor(t / adim))] * transpoze;
    cikti[i] = ornek(ton.dalga, faz, f) * zarf(t, ton);
    faz += (2 * Math.PI * f) / SR;
  }
  return cikti;
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
function spektrogram(pcm: Float64Array): number[][] {
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
      const f = (b * SR) / PENCERE;
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

const izParmak = (ton: Ton, transpoze = 1) =>
  zamandaNormalize(spektrogram(seslendir(ton, transpoze)));

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
const YARIM_SES = Math.pow(2, 1 / 12);
const SURE_WEBER = 1.15; // sure JND'si ~%15 (kisa seslerde Weber orani) — 1 JND = 1.15 kat
const JEST_KOK = 440; // jest kanalinda her tonun ilk notasi buraya tasinir

/** JEST tonu: aralik oruntusu ve dalga korunur, MUTLAK PERDE silinir (ilk nota 440 Hz olur). */
const jestTonu = (ton: Ton): Ton => ({ ...ton, hz: ton.hz.map((h) => (h * JEST_KOK) / ton.hz[0]) });

/** Jest tabani icin bozma: SON notanin araligi 1 yarim ses kaydirilir — "ayni jest, bir tik farkli". */
function araligiBoz(ton: Ton): Ton {
  const hz = ton.hz.slice();
  hz[hz.length - 1] = hz[hz.length - 1] * YARIM_SES;
  return { ...ton, hz };
}

console.log('='.repeat(78));
console.log('SES AYIRT EDILEBILIRLIGI — sentez tonlarinin olcumu (Faz E · E4)');
console.log('ANALITIK ARAC · kosu kipi yok · deterministik · kaynak: src/game/audio.ts SES_KATALOG');
console.log('='.repeat(78));

const mutlak = new Map<SesId, number[][]>();
const jest = new Map<SesId, number[][]>();
for (const id of IDLER) {
  mutlak.set(id, izParmak(SES_KATALOG[id].ton));
  jest.set(id, izParmak(jestTonu(SES_KATALOG[id].ton)));
}

// KALIBRASYON TABANLARI — her kanalin kendi tabani var, cunku kanallar farkli seyi siliyor.
const mutlakTabanlar = IDLER.map((id) =>
  mesafe(mutlak.get(id)!, izParmak(SES_KATALOG[id].ton, YARIM_SES)));
const MUTLAK_TABAN = mutlakTabanlar.reduce((a, b) => a + b, 0) / mutlakTabanlar.length;

// Jest kanalinda transpoze mesafesi TANIMI GEREGI 0'dir (perde silindi) — o yuzden taban
// baska bir bozmadan gelir: ayni jestin ARALIGI 1 yarim ses kaydirilmisi. Tek notali sesin
// (pour) araligi yok, taban hesabina girmez.
const jestTabanIdler = IDLER.filter((id) => SES_KATALOG[id].ton.hz.length > 1);
const jestTabanlar = jestTabanIdler.map((id) =>
  mesafe(jest.get(id)!, izParmak(jestTonu(araligiBoz(SES_KATALOG[id].ton)))));
const JEST_TABAN = jestTabanlar.reduce((a, b) => a + b, 0) / jestTabanlar.length;

console.log('\n§1 KATALOG');
console.log('id        dalga     nota  sure(sn)  gain   aralik(sn)  frekanslar        oruntu(yariton)');
for (const id of IDLER) {
  const t = SES_KATALOG[id].ton;
  const aralik = t.hz.slice(1).map((h, i) => Math.round(12 * Math.log2(h / t.hz[i])));
  console.log(
    id.padEnd(9) + ' ' + t.dalga.padEnd(9) + ' ' + String(t.hz.length).padEnd(5) + ' ' +
    t.sure.toFixed(2).padEnd(9) + ' ' + t.gain.toFixed(2).padEnd(6) + ' ' +
    SES_KATALOG[id].aralik.toFixed(2).padEnd(11) + ' ' + t.hz.join('-').padEnd(17) + ' ' +
    (aralik.length ? aralik.map((a) => (a > 0 ? '+' + a : String(a))).join(',') : '—'));
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
    const sa = SES_KATALOG[a].ton.sure;
    const sb = SES_KATALOG[b].ton.sure;
    const sureJnd = Math.abs(Math.log(sa / sb)) / Math.log(SURE_WEBER);
    // Sure her iki hukumde de IKINCI kanaldir: 0.09 sn ile 0.42 sn hic benzemez, spektrumlari
    // ne olursa olsun. 2 JND = sureler ~%32 ayrilmis demektir.
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

// Yapisal sayilar — "hepsi ayni kaliptan mi" sorusunun cevabi metrikten BAGIMSIZ okunabilsin.
const dalgaSay = new Map<string, number>();
for (const id of IDLER) {
  const d = SES_KATALOG[id].ton.dalga;
  dalgaSay.set(d, (dalgaSay.get(d) ?? 0) + 1);
}
console.log('\n§5 YAPISAL SAYILAR (metrikten bagimsiz)');
console.log('Dalga dagilimi: ' + [...dalgaSay].map(([k, v]) => k + ' ' + v).join(' · '));
const cikanArpej = IDLER.filter((id) => {
  const h = SES_KATALOG[id].ton.hz;
  return h.length > 1 && h.every((v, i) => i === 0 || v > h[i - 1]);
});
console.log('Yukselen arpej (cok notali, hep tizlesen): ' + cikanArpej.length + '/9 — ' + cikanArpej.join(' · '));
const digerleri = IDLER.filter((id) => !cikanArpej.includes(id));
console.log('Yukselen OLMAYAN: ' + digerleri.length + '/9 — ' + digerleri.join(' · '));
// Ayni aralik oruntusunu paylasanlar: jest kanalinin yapisal karsiligi.
const oruntuHarita = new Map<string, SesId[]>();
for (const id of IDLER) {
  const t = SES_KATALOG[id].ton;
  const anahtar = t.dalga + '|' + t.hz.slice(1).map((h, i) => Math.round(12 * Math.log2(h / t.hz[i]))).join(',');
  oruntuHarita.set(anahtar, [...(oruntuHarita.get(anahtar) ?? []), id]);
}
const ikizler = [...oruntuHarita.entries()].filter(([, v]) => v.length > 1);
console.log('Ayni dalga + ayni aralik oruntusu: ' + ikizler.length + ' grup — ' +
  (ikizler.map(([k, v]) => v.join('/') + ' (' + k + ')').join(' · ') || '—'));

// --- Damgalar --------------------------------------------------------------
damga(
  'sentez sessiz degil',
  IDLER.every((id) => seslendir(SES_KATALOG[id].ton).some((v) => Math.abs(v) > 1e-3)),
  'bir ton hic ornek uretmedi');
damga('mesafe kendisiyle 0', IDLER.every((id) => mesafe(mutlak.get(id)!, mutlak.get(id)!) === 0));
damga(
  'mesafe simetrik',
  cifter.every((c) =>
    Math.abs(mesafe(mutlak.get(c.a)!, mutlak.get(c.b)!) - mesafe(mutlak.get(c.b)!, mutlak.get(c.a)!)) < 1e-9));
damga('mutlak taban pozitif', MUTLAK_TABAN > 0, 'taban ' + MUTLAK_TABAN.toFixed(3));
damga('jest taban pozitif', JEST_TABAN > 0, 'taban ' + JEST_TABAN.toFixed(3));
// Jest kanali GERCEKTEN perdeyi siliyor mu? Transpoze edilmis kopyanin jest mesafesi ~0 olmali.
// Bu damga olmasaydi jestTonu() sessizce etkisiz kalabilir ve kanal mutlagin kopyasi olurdu.
damga(
  'jest kanali perdeyi siliyor',
  IDLER.every((id) => {
    const t = SES_KATALOG[id].ton;
    return mesafe(jest.get(id)!, izParmak(jestTonu({ ...t, hz: t.hz.map((h) => h * 1.5) }))) < 1e-9;
  }),
  'transpoze kopya jest kanalinda ayni cikmadi — perde silinmemis');
damga(
  'iki kanal ayni sey degil',
  cifter.some((c) => Math.abs(c.dm - c.dj) > 0.5),
  'jest ve mutlak mesafeler ayni — kanal eklemek olcumu degistirmemis');
damgaOzeti();
