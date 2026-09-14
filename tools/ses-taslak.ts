/**
 * ses-taslak.ts — KARAR ANINDA DİNLENEN TASLAKLAR (S17). Oyun kodu DEĞİL.
 *
 * NEDEN AYRI DOSYA: üç araç aynı üç şeyi istiyordu — `ses-disari.ts` (WAV çıktısı),
 * `olcum-ses-s17.ts` (ölçüm) ve `ses-panosu.ts` (dinleme panosu). Her biri kendi kopyasını
 * taşısaydı, PANODA DUYULAN ile RAPORDA ÖLÇÜLEN ayrışırdı; S17 zaten tam da bunu düzeltiyor
 * (`feedback_single_source_of_truth`). Kullanıcı bir kolu dinleyip seçtiğinde, seçtiği şeyin
 * ölçülen şey olduğu bu dosya sayesinde doğru.
 *
 * "TASLAK" kelimesi bilerek: buradaki ortam yatağı ve seri karışımı, kullanıcı o kolu seçerse
 * `src/game/audioSynth.ts`e taşınacak DAVRANIŞIN önizlemesidir — motor bugün ne döngü ne de
 * perde basamağı biliyor. Karar verilmeden oyun koduna hiçbir şey girmez (D-084 varyant kapısı).
 */
import { ORNEKLEME, seslendir, type Katman } from '../src/game/audioSynth.ts';
import { YARIM_SES } from './ses-metrik.ts';

/** Float32 [-1,1] → 16-bit PCM WAV. Tarayıcı hiçbir kütüphane olmadan çalar. */
export function wav(ornekler: Float32Array, hz = ORNEKLEME): Buffer {
  const veri = Buffer.alloc(ornekler.length * 2);
  for (let i = 0; i < ornekler.length; i++) {
    const s = Math.max(-1, Math.min(1, ornekler[i]));
    veri.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const bas = Buffer.alloc(44);
  bas.write('RIFF', 0);
  bas.writeUInt32LE(36 + veri.length, 4);
  bas.write('WAVE', 8);
  bas.write('fmt ', 12);
  bas.writeUInt32LE(16, 16);          // fmt yığın boyu
  bas.writeUInt16LE(1, 20);           // PCM
  bas.writeUInt16LE(1, 22);           // mono
  bas.writeUInt32LE(hz, 24);
  bas.writeUInt32LE(hz * 2, 28);      // bayt/sn
  bas.writeUInt16LE(2, 32);           // blok hizası
  bas.writeUInt16LE(16, 34);          // bit derinliği
  bas.write('data', 36);
  bas.writeUInt32LE(veri.length, 40);
  return Buffer.concat([bas, veri]);
}

/** Bütün frekansları `k` ile ölçekler — perde basamağı bunun üstünde kurulur. */
const olcekle = (katmanlar: readonly Katman[], k: number): Katman[] =>
  katmanlar.map((kat) => ({ ...kat, hz: kat.hz.map((h) => h * k) }));

/**
 * SERİ KARIŞIMI — `adet` kadar toplama, her biri bir öncekinden `basamak` yarım ses yukarıda,
 * `tavan` basamakta durur. `tavan: 0` = basamak yok (bugünkü hâl).
 *
 * `tanh` bilerek: üst üste binen kısa sesler toplandığında tepe 1,0'ı aşabilir ve dijital
 * kırpılma cızırtı yapar. Yumuşak sınırlayıcı bunu, sesin karakterini bozmadan tutar.
 * (Ölçüm §5b ham tepeyi sınırlayıcıdan ÖNCE okur; kırpılmanın var olup olmadığı orada görünür.)
 */
export function seriKarisim(
  katmanlar: readonly Katman[],
  basamak: number,
  tavan: number,
  adet = 5,
  ara = 0.16,
): { karisim: Float32Array; hamTepe: number } {
  const ARA = Math.round(ara * ORNEKLEME);
  const parca: Float32Array[] = [];
  for (let i = 0; i < adet; i++) {
    const adim = Math.min(i, tavan) * basamak;
    parca.push(seslendir(olcekle(katmanlar, Math.pow(YARIM_SES, adim))));
  }
  const boy = ARA * (adet - 1) + parca[adet - 1].length;
  const karisim = new Float32Array(boy);
  parca.forEach((s, i) => { for (let j = 0; j < s.length; j++) karisim[i * ARA + j] += s[j]; });
  let hamTepe = 0;
  for (let i = 0; i < boy; i++) { const v = Math.abs(karisim[i]); if (v > hamTepe) hamTepe = v; }
  for (let i = 0; i < boy; i++) karisim[i] = Math.tanh(karisim[i]);
  return { karisim, hamTepe };
}

/**
 * ORTAM YATAĞI TASLAĞI — "kalabalık uğultusu"nun önizlemesi (O1 kolu).
 *
 * İki kutuplu alçak-geçirgen süzgeçten geçmiş gürültü: kalabalığın enerjisi konuşma gövdesinde,
 * 300-900 Hz civarında toplanır. Üstüne iki YAVAŞ ve birbirine oransız genlik dalgası biner —
 * sabit gürültü klima sesi gibi durur, uğultu gibi durmaz; kıraathaneyi yaşayan yapan o
 * dalgalanmadır. Periyotlar (3,1 sn · 7,3 sn) bilerek ortak bölensiz: döngü dikişi duyulmasın.
 *
 * Deterministik (tohumlu) — ölçüm ile panonun aynı yatağı duyması için.
 */
export function ortamYatagi(sn: number, gain: number): Float32Array {
  const n = Math.round(sn * ORNEKLEME);
  const out = new Float32Array(n);
  let a = 12345;
  const rnd = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 2147483648) - 1;
  };
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < n; i++) {
    const x = rnd();
    y1 += (x - y1) * 0.06;
    y2 += (y1 - y2) * 0.06;
    const dalga = 1 + 0.35 * Math.sin((2 * Math.PI * i) / (ORNEKLEME * 3.1)) +
      0.2 * Math.sin((2 * Math.PI * i) / (ORNEKLEME * 7.3));
    out[i] = y2 * dalga * gain * 14;
  }
  return out;
}

/** Dalga zarfı: `kova` adet kutuya inen tepe değerleri — panodaki çizim bunu kullanır. */
export function zarf(pcm: Float32Array, kova = 128): number[] {
  const out: number[] = [];
  const boy = Math.max(1, Math.floor(pcm.length / kova));
  for (let k = 0; k < kova; k++) {
    let m = 0;
    for (let i = k * boy; i < Math.min(pcm.length, (k + 1) * boy); i++) {
      const v = Math.abs(pcm[i]);
      if (v > m) m = v;
    }
    out.push(m);
  }
  const tepe = Math.max(...out, 1e-6);
  return out.map((v) => v / tepe);
}
