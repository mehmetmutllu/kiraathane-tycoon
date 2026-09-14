/**
 * ses-metrik.ts — SES KARŞILAŞTIRMA METRİĞİ, tek kaynak (S17'de çıkarıldı).
 *
 * NEDEN AYRI DOSYA: metrik E4'te `olcum-ses-ayirt.ts`in içinde doğdu ve orada tek müşterisi
 * vardı — SENTEZ. S17 ikinci müşteriyi getirdi: hazır `.ogg` DOSYALARI aynı matrise sokulacak
 * ("dosya mı sentez mi" kolu ancak ikisi aynı cetvelle ölçülürse tartışılabilir). İki aracın
 * kendi kopyasını taşıması `feedback_single_source_of_truth`un ihlali olurdu: bant sayısı ya da
 * dip eşiği birinde değişip diğerinde kalsaydı, karşılaştırma sessizce anlamsızlaşırdı.
 *
 * Bu dosya SAF ve PCM-TEMELLİDİR: nereden geldiğini (sentez mi, çözülmüş ogg mü) bilmez, yalnız
 * `Float32Array` alır. Sentezle ilgili yardımcılar (`transpoze`, `jestHali`, `araligiBoz`)
 * KATMAN temellidir ve bilerek burada durur — kalibrasyon tabanı ikisini de kullanır.
 *
 * Çıkarma işlemi DAVRANIŞI DEĞİŞTİRMEDİ: `olcum-ses-ayirt.ts`in çıktısı çıkarmadan önce ve sonra
 * bayt bayt aynı (`docs/olcum-ses-ayirt.txt` diff'i boş). Refactor'ün kanıtı budur.
 */
import { ORNEKLEME, seslendir, type Katman } from '../src/game/audioSynth.ts';

// --- Sabitler --------------------------------------------------------------
export const YARIM_SES = Math.pow(2, 1 / 12);
/** Süre JND'si ~%15 (kısa seslerde Weber oranı) — 1 JND = 1,15 kat. */
export const SURE_WEBER = 1.15;

const PENCERE = 512;
const ATLAMA = 128;
export const BANT = 24;
const BANT_ALT = 80;
const BANT_UST = 12000;
/** Zamanda normalize edilen kare sayısı (ŞEKİL karşılaştırılır, süre ayrı kanalda ölçülür). */
export const KARE = 32;
/** dB tabanı: bunun altı sessizlik sayılır. */
export const DIP = -60;

// --- Katman yardimcilari (sentez tarafi) -----------------------------------
/** Bütün katmanların bütün frekanslarını `k` ile ölçekler (transpoze). */
export const transpoze = (katmanlar: readonly Katman[], k: number): Katman[] =>
  katmanlar.map((kat) => ({ ...kat, hz: kat.hz.map((h) => h * k) }));

/** JEST hâli: ilk katmanın ilk frekansı 440 Hz'e taşınır, oranlar korunur → mutlak perde silinir. */
export const jestHali = (katmanlar: readonly Katman[]): Katman[] =>
  transpoze(katmanlar, 440 / katmanlar[0].hz[0]);

/** Çok değerli İLK katmanın SON değeri 1 yarım ses kaydırılır — "aynı jest, bir tık farklı". */
export function araligiBoz(katmanlar: readonly Katman[]): Katman[] {
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
 * BASKIN katman = en yüksek kazançlı olan. Üç teşhis (aile · tını · örüntü) hep BUNU okur.
 *
 * İlk hâli "çok değerli İLK katman" diyordu ve bu YANLIŞ teşhis üretiyordu: `padFill`in ilk
 * katmanı gürültü süpürmesi (400→2000 Hz), tonal üçlüyü (440-660-880) gölgeliyordu; örüntü
 * "+28" çıkıyordu, oysa kulağın duyduğu jest "+7,+5". İkiz denetimi de bu kolona baktığı için
 * gerçek bir ikizi KAÇIRABİLİRDİ. Teşhis, sesin en yüksek katmanını anlatmalı.
 */
export const baskin = (katmanlar: readonly Katman[]): Katman =>
  katmanlar.reduce((a, b) => (b.gain > a.gain ? b : a));

/** Sesin aralık örüntüsü (yarıton): BASKIN katmanın kendi değer dizisinden. */
export function oruntu(katmanlar: readonly Katman[]): number[] {
  const k = baskin(katmanlar);
  if (k.hz.length < 2) return [];
  return k.hz.slice(1).map((h, i) => Math.round(12 * Math.log2(h / k.hz[i])));
}

/** AİLE: baskın katman gürültü ise FİZİKSEL, değilse TONAL. */
export const aile = (katmanlar: readonly Katman[]): 'fiziksel' | 'tonal' =>
  baskin(katmanlar).kaynak === 'gurultu' ? 'fiziksel' : 'tonal';

/** TINI: BASKIN katmanın üretim biçimi — inharmonik kısmi (çan/metal), klasik dalga ya da gürültü. */
export function tini(katmanlar: readonly Katman[]): string {
  const k = baskin(katmanlar);
  if (k.kaynak === 'gurultu') return 'gurultu q=' + (k.q ?? 1);
  return k.kismi ? 'kismi:' + k.kismi.join('/') : (k.dalga ?? 'sine');
}

// --- Spektrogram -----------------------------------------------------------
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

/** Bant kenarları: log-frekans (kulağın ölçeği), 80 Hz - 12 kHz arası 24 bant. */
const BANT_KENAR = Array.from({ length: BANT + 1 }, (_, i) =>
  BANT_ALT * Math.pow(BANT_UST / BANT_ALT, i / BANT));

/** PCM → [kare][bant] dB matrisi; tepe 0 dB'e normalize (yükseklik değil ŞEKİL karşılaştırılır). */
export function spektrogram(pcm: Float32Array): number[][] {
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

/** Zamanda KARE adede indirger — süre bilerek mesafeden çıkarılır, ayrı kanalda ölçülür. */
export function zamandaNormalize(spek: number[][]): number[][] {
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

/** PCM → karşılaştırılabilir iz (zamanda normalize spektrogram). Kaynağı umursamaz. */
export const izParmakPcm = (pcm: Float32Array): number[][] => zamandaNormalize(spektrogram(pcm));

/** Katmanlardan iz — sentez tarafının kısayolu. */
export const izParmak = (katmanlar: readonly Katman[]): number[][] =>
  izParmakPcm(seslendir(katmanlar));

/** İki spektrogram arası ortalama mutlak fark (dB). Simetrik; kendisiyle 0. */
export function mesafe(a: number[][], b: number[][]): number {
  let toplam = 0;
  for (let i = 0; i < KARE; i++) {
    for (let j = 0; j < BANT; j++) toplam += Math.abs(a[i][j] - b[i][j]);
  }
  return toplam / (KARE * BANT);
}

// --- PCM olculeri (S17: dosyalarin sentezle KIYASLANABILIR yuksekligi) -----
/** Kare ortalamanın karekökü — algılanan yüksekliğin kaba ama kaynaktan bağımsız ölçüsü. */
export function rms(pcm: Float32Array): number {
  if (pcm.length === 0) return 0;
  let t = 0;
  for (let i = 0; i < pcm.length; i++) t += pcm[i] * pcm[i];
  return Math.sqrt(t / pcm.length);
}

/** Mutlak tepe değeri — kırpılma (1,0'a dayanma) buradan görünür. */
export function tepe(pcm: Float32Array): number {
  let m = 0;
  for (let i = 0; i < pcm.length; i++) { const v = Math.abs(pcm[i]); if (v > m) m = v; }
  return m;
}

/**
 * SESSİZ KUYRUK: sondaki, tepeye göre `esikDb` altında kalan bölümün süresi (sn).
 *
 * Hazır paketlerde dosyalar çoğu zaman sabit uzunluğa hizalanmış olur ve sesin kendisi bittikten
 * sonra sessizlik devam eder. Bu, `aralik` kelepçesini (audio.ts) yanıltır: "0,9 sn'lik ses"
 * aslında 0,2 sn ses + 0,7 sn hiçliktir. Ayrıca süre kanalı (JND) bu yüzden yanlış hüküm verir.
 */
export function sessizKuyruk(pcm: Float32Array, esikDb = -50, hz = ORNEKLEME): number {
  const t = tepe(pcm);
  if (t === 0) return pcm.length / hz;
  const esik = t * Math.pow(10, esikDb / 20);
  let i = pcm.length - 1;
  while (i >= 0 && Math.abs(pcm[i]) < esik) i--;
  return (pcm.length - 1 - i) / hz;
}

/** Sesin GERÇEK süresi (sn) — sessiz kuyruk düşülmüş. */
export const etkinSure = (pcm: Float32Array, hz = ORNEKLEME): number =>
  pcm.length / hz - sessizKuyruk(pcm, -50, hz);
