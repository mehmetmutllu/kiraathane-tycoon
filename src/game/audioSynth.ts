/**
 * audioSynth.ts — SES SENTEZ ÇEKİRDEĞİ (Faz E · E4). SAF ve deterministik: DOM yok, rastgelelik
 * tohumlu, aynı girdi her zaman aynı örnek dizisini üretir.
 *
 * NEDEN AYRI VE NEDEN SAF — E3'ün kabul edilen kusuru buydu:
 * E3'te sentez `audioWeb.ts` içinde, WebAudio düğümleriyle kuruluydu. Ölçüm aracı (E4) o düğüm
 * zincirini **taklit etmek** zorunda kaldı; yani ölçülen şey ile duyulan şey iki AYRI koddu ve
 * aralarındaki sapma hiçbir şey tarafından tutulmuyordu. E4 bunu yapısal olarak kapatıyor:
 * ses tek bir yerde üretilir (burada), tarayıcı üretilen tamponu yalnızca ÇALAR, ölçüm aracı
 * aynı tamponu OKUR. Ölçülen şey birebir duyulan şeydir. (`feedback_single_source_of_truth`.)
 *
 * NEDEN SENTEZ, NEDEN HAZIR KAYIT DEĞİL (D-013'ün sesteki karşılığı):
 * Projenin görsel kararı "primitive = yer tutucu değil, NİHAİ stil". Sesin karşılığı da budur.
 * Hazır kayıt setleri iki sorunu birden getiriyordu: seslerde tek stil kilidi hiç kurulmamıştı
 * (karışık sanatçı) ve gerçekçi kayıt, flat-shaded low-poly bir sahnenin üstünde yabancı durur.
 * Sentez ise tek "sanatçı"dır, lisans yüzeyi sıfırdır ve stil kilidi tanımı gereği sağlanır.
 *
 * E3'E GÖRE NE DEĞİŞTİ — motorun KAPASİTESİ:
 * E3'te tek osilatör vardı, yani motor yalnız "nota dizisi" üretebiliyordu; 9 sesin 7'si yükselen
 * arpejdi ve gürültü bileşeni (şıngırtı, süzülme, tıkırtı) ÜRETİLEMİYORDU (ölçüm: E4 Bulgu 3).
 * Bu yüzden fiziksel olaylar da müzikal cümlelerle anlatılıyordu. Artık üç kaynak var:
 *   · gürültü + bant filtresi        → fiziksel olaylar (para tık, çay süzülme, cam şıngırtı)
 *   · inharmonik kısmiler            → metalik/çan tınısı (para, Usta)
 *   · band-limitli klasik dalgalar   → ilerleme olayları (görev, seviye, ödül)
 * Ayrım tesadüfi değil: FİZİKSEL olan fiziksel duyulur, İLERLEME tonal kalır — oyuncu iki aileyi
 * birbirine karıştırmaz (D-080 Tek Odak'ın ses karşılığı).
 */

/** Örnekleme hızı. Hem çalınan tampon hem ölçüm bu hızda üretilir. */
export const ORNEKLEME = 44100;

export type Dalga = 'sine' | 'triangle' | 'square';

/**
 * Bir sesin TEK katmanı. Sesler katman toplamıdır — gerçek bir tık "bir nota" değil, kısa bir
 * gürültü geçişi + tınlayan bir gövdedir; katmansız bir motor bunu üretemez.
 */
export interface Katman {
  /** `ton` = perdeli kaynak · `gurultu` = bant-geçiren süzülmüş beyaz gürültü. */
  kaynak: 'ton' | 'gurultu';
  /**
   * `ton` için nota dizisi (Hz), `gurultu` için bant merkezi dizisi (Hz).
   * Varsayılan olarak BASAMAK basamak değişir (`setValueAtTime` gibi); `suzul` açıksa
   * değerler arasında doğrusal geçilir (çay dökme gibi süreklilik isteyen sesler için).
   */
  hz: number[];
  /** Değerler arasında süzülerek geç (basamak yerine rampa). */
  suzul?: boolean;
  /**
   * `ton` için KISMİ çarpanları. Verilmezse `dalga` kullanılır.
   * [1, 2, 3, …] harmonik (perdeli); [1, 2.76, 5.40, …] inharmonik = ÇAN/METAL tınısı.
   * Metalik ses band-limitli klasik dalgalarla üretilemez — para ve Usta bunun için var.
   */
  kismi?: number[];
  /** `ton` için temel dalga (kismi verilmişse yok sayılır). */
  dalga?: Dalga;
  /** `gurultu` için bant keskinliği (yüksek = dar bant = daha "perdeli" gürültü). */
  q?: number;
  /** Katmanın başlangıç gecikmesi (sn) — katmanları birbirinden kaydırmak için. */
  gecikme?: number;
  /** Yükseliş süresi (sn). Fiziksel tıklarda çok kısa (~1 ms), tonal seslerde birkaç ms. */
  atak: number;
  /** Sönme süresi (sn): sesin -60 dB'ye indiği an. Katmanın toplam boyu = gecikme+atak+sönme. */
  sonme: number;
  /** Katmanın kendi kazancı. Toplam tepe `seslendir` sonunda yumuşak sınırlanır. */
  gain: number;
}

// --- Deterministik gürültü -------------------------------------------------
// Math.random KULLANILMAZ: ölçüm aracı bu tamponu okuyor ve koşudan koşuya değişen bir gürültü
// ölçümü tekrarlanamaz kılardı. Tohum ses kimliğinden değil, katman sırasından türer.
function gurultuKaynagi(tohum: number): () => number {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 2147483648) - 1; // [-1, 1)
  };
}

/** Band-limitli klasik dalga: harmonikler Nyquist'te kesilir (aliasing sahte tiz üretmesin). */
function klasikDalga(dalga: Dalga, faz: number, f0: number): number {
  if (dalga === 'sine') return Math.sin(faz);
  const nyq = ORNEKLEME / 2;
  let s = 0;
  if (dalga === 'square') {
    for (let k = 1; k * f0 < nyq; k += 2) s += Math.sin(k * faz) / k;
    return (4 / Math.PI) * s;
  }
  let isaret = 1;
  for (let k = 1; k * f0 < nyq; k += 2) {
    s += (isaret * Math.sin(k * faz)) / (k * k);
    isaret = -isaret;
  }
  return (8 / (Math.PI * Math.PI)) * s;
}

/** Kısmi toplamı: verilen çarpanlarda sinüsler, genlik 1/sıra. İnharmonik çarpan = metal tınısı. */
function kismiToplam(kismi: number[], faz: number): number {
  let s = 0;
  let agirlik = 0;
  for (let i = 0; i < kismi.length; i++) {
    const g = 1 / (i + 1);
    s += g * Math.sin(kismi[i] * faz);
    agirlik += g;
  }
  return s / agirlik;
}

/** Katmanın toplam boyu (sn). */
const katmanBoyu = (k: Katman): number => (k.gecikme ?? 0) + k.atak + k.sonme;

/** Sesin toplam süresi = en uzun katman. Katalogda süre ELLE yazılmaz, katmanlardan TÜRER. */
export const sesSuresi = (katmanlar: readonly Katman[]): number =>
  katmanlar.reduce((m, k) => Math.max(m, katmanBoyu(k)), 0);

/** Zarf: doğrusal yükseliş, sonra -60 dB'ye üstel sönme. */
function zarf(t: number, k: Katman): number {
  const yerel = t - (k.gecikme ?? 0);
  if (yerel < 0) return 0;
  if (yerel < k.atak) return k.atak <= 0 ? 1 : yerel / k.atak;
  const sonmeT = yerel - k.atak;
  if (sonmeT > k.sonme) return 0;
  return Math.exp((-6.9078 * sonmeT) / k.sonme); // e^-6.9078 ≈ 0.001 = -60 dB
}

/** O anki frekans: basamak basamak, `suzul` açıksa doğrusal geçişli. */
function frekans(k: Katman, oran: number): number {
  if (k.hz.length === 1) return k.hz[0];
  if (!k.suzul) return k.hz[Math.min(k.hz.length - 1, Math.floor(oran * k.hz.length))];
  const x = oran * (k.hz.length - 1);
  const i = Math.min(k.hz.length - 2, Math.floor(x));
  return k.hz[i] + (k.hz[i + 1] - k.hz[i]) * (x - i);
}

/**
 * Sesi PCM'e çevirir. SAF: aynı katmanlar her zaman aynı diziyi verir.
 *
 * Gürültü katmanı bir DURUM DEĞİŞKENLİ SÜZGEÇten (state-variable filter) geçirilir; merkez
 * frekansı zamanla değişebildiği için sabit katsayılı bir süzgeç yetmezdi (çay dökme sesi tam
 * olarak merkez frekansın YÜKSELMESİdir). Süzgeç kararlılığı için merkez frekans ORNEKLEME/6
 * ile sınırlanır.
 */
export function seslendir(katmanlar: readonly Katman[]): Float32Array {
  const sure = sesSuresi(katmanlar);
  const n = Math.max(1, Math.round(sure * ORNEKLEME));
  const cikti = new Float32Array(n);
  const FC_TAVAN = ORNEKLEME / 6;

  katmanlar.forEach((k, katmanIndex) => {
    const boy = katmanBoyu(k);
    // Döngü 0'dan başlar ve gecikmeyi ZARF uygular — bilerek TEK mekanizma.
    // İlk hâlde döngü `gecikme` indeksinden başlıyordu VE zarfın da bir gecikme dalı vardı;
    // ikisi aynı işi yapınca zarfın dalı ÖLÜ KOD oldu ve mutasyon testinde M3 (gecikmeyi yok
    // sayan mutasyon) hiçbir testi kırmadan geçti. İki mekanizmadan biri sessizce yanlış
    // olabiliyorsa, o mekanizma bekçisizdir.
    const son = Math.min(n, Math.round(boy * ORNEKLEME));
    const aktifBoy = Math.max(1e-9, k.atak + k.sonme);
    let faz = 0;
    // Süzgecin durumu (Chamberlin SVF)
    let alcak = 0;
    let bant = 0;
    const gurultu = gurultuKaynagi(0x9e3779b9 ^ (katmanIndex * 0x85ebca6b));

    for (let i = 0; i < son; i++) {
      const t = i / ORNEKLEME;
      const oran = Math.min(1, Math.max(0, (t - (k.gecikme ?? 0)) / aktifBoy));
      const f = frekans(k, oran);
      const g = zarf(t, k) * k.gain;
      if (g === 0) continue;

      if (k.kaynak === 'ton') {
        faz += (2 * Math.PI * f) / ORNEKLEME;
        const ham = k.kismi ? kismiToplam(k.kismi, faz) : klasikDalga(k.dalga ?? 'sine', faz, f);
        cikti[i] += ham * g;
      } else {
        const fc = Math.min(FC_TAVAN, f);
        const fKat = 2 * Math.sin((Math.PI * fc) / ORNEKLEME);
        const q1 = 1 / Math.max(0.5, k.q ?? 1);
        const girdi = gurultu();
        const yuksek = girdi - alcak - q1 * bant;
        bant += fKat * yuksek;
        alcak += fKat * bant;
        cikti[i] += bant * g;
      }
    }
  });

  // Yumuşak sınırlama: katmanlar üst üste binince tepe 1'i aşabilir; sert kırpma "tık" üretir.
  for (let i = 0; i < n; i++) cikti[i] = Math.tanh(cikti[i]);
  return cikti;
}
