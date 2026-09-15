/**
 * muzik-karar-paketi.ts — ARKA PLAN MÜZİĞİ ADAYLARINI KARAR PANOSUNA HAZIRLAR (S9 · kol O5).
 *
 * NEDEN DİKİŞTEN KESİYOR: her aday için üretilen klip parçanın ORTASINDAN değil, **döngü
 * noktasından** alınıyor — son N saniye + ilk N saniye, arka arkaya. Böylece kullanıcı tek
 * düğmede iki şeyi birden duyuyor: parçanın kendisi ve **başa sardığında ne olduğu**. Arka plan
 * müziğinde ikinci soru birincisi kadar önemli; oyuncu o dikişi bir oturumda onlarca kez duyar.
 *
 * NEDEN 22050 Hz MONO: tam kaliteli 23 parça panoya sığmaz (adayların toplamı 57 MB). Klip bir
 * KARAR aracıdır, ürün değil — seçilen parça oyuna kendi .ogg'siyle girer. Örnekleme yarıya
 * inince tiz bant 11 kHz'de kesilir; bu, ölçümün baktığı bandı (80 Hz - 12 kHz) neredeyse
 * tamamen koruyor, yani panoda duyulan ile raporda ölçülen ayrışmıyor.
 *
 * SEVİYE BİLEREK HAM: klipler ölçülen tavan kazancı UYGULANMADAN yazılır. Kazanç panoda,
 * çalma anında uygulanır — böylece kullanıcı aynı parçayı hem "tam" hem "oyundaki seviyede"
 * dinleyebiliyor ve tavanın ne kadar kıstığını kendi kulağıyla görüyor.
 *
 * Çalıştır: npx tsx tools/muzik-karar-paketi.ts
 */
import { mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { SES_KATALOG, type SesId } from '../src/game/audio.ts';
import { ORNEKLEME, seslendir } from '../src/game/audioSynth.ts';
import { BANT, rms } from './ses-metrik.ts';
import { IDLER } from './ses-secim.ts';
import { wav } from './ses-taslak.ts';

const KOK = 'indirilen-muzik';
const PCM = path.join(KOK, '_pcm');
const HEDEF = 'docs/pano/ses-karar';

/** Klibin yarısı (sn): son YARIM + ilk YARIM = dikişi ortada tutan bir pencere. */
const YARIM = 8;
/** Pano örnekleme hızı — gerekçe dosya başlığında. */
const PANO_HZ = 22050;

/** Panoya girecek adaylar: ölçümün dört farklı köşesi bilerek temsil ediliyor. */
const SECILEN = [
  'Sketchbook_2024-01-24_02',          // ölçümün dengeli birincisi: temiz dikiş + yüksek kalan RMS
  'Troubadeck_04_Guinea_Pig_Jig',      // kısılmaya EN dayanıklı (tavan -18,0 dB) · akustik/lavta
  'VGMA_Challenge_25',                 // en küçük dosya (754 KB) + en yakın baş/son dokusu
  'Sketchbook_2024-04-10',             // en uzun döngü (101,7 sn) — tekrar yorgunluğu en az
  'Patreon_Challenge_07',              // en KOYU parça (parlaklık 2) — akşam kıraathanesi
  'Sketchbook_2024-06-19',             // tek "desert" etiketli parça — Anadolu tınısına en yakın
  'Week_16_-_Vacation_Day',            // en temiz dikiş (sıçrama 0,0027) ama en kısa (12,8 sn)
  'Interior_Birdecorator_Decorate',    // gerçek bir dekorasyon oyununun müziği — ÖLÇÜMDE SONUNCU
];

interface Aday {
  ad: string; yol: string; paket: string; kunye: string; etiket: string;
  sure: number; enerji: number; parlaklik: number; hiz: number; karmasiklik: number; puan: number;
}
const liste: Aday[] = JSON.parse(readFileSync(path.join(KOK, '_liste.json'), 'utf8'));

function pcmOku(ad: string): Float32Array {
  const b = readFileSync(path.join(PCM, `${ad}.f32`));
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

// --- Bant profili: `olcum-muzik-s9.ts` ile AYNI Goertzel, aynı bantlar --------------------
const BANT_ALT = 80, BANT_UST = 12000, PENCERE = 2048;
const KENAR = Array.from({ length: BANT + 1 }, (_, i) => BANT_ALT * Math.pow(BANT_UST / BANT_ALT, i / BANT));
function bantEnerjisi(pcm: Float32Array, bas: number, boy: number): number[] {
  const n = Math.min(boy, pcm.length - bas);
  if (n < 256) return new Array(BANT).fill(0);
  const guc = new Array<number>(BANT).fill(0);
  for (let b = 0; b < BANT; b++) {
    const f = Math.sqrt(KENAR[b] * KENAR[b + 1]);
    const w = (2 * Math.PI * f) / ORNEKLEME;
    const c = 2 * Math.cos(w);
    let s1 = 0, s2 = 0;
    for (let i = 0; i < n; i++) { const s0 = pcm[bas + i] + c * s1 - s2; s2 = s1; s1 = s0; }
    guc[b] = (s1 * s1 + s2 * s2 - c * s1 * s2) / n;
  }
  return guc;
}
function profil(pcm: Float32Array): number[] {
  const adim = Math.max(PENCERE, Math.floor(pcm.length / 60));
  const top = new Array<number>(BANT).fill(0);
  let say = 0;
  for (let bas = 0; bas + PENCERE <= pcm.length; bas += adim) {
    const g = bantEnerjisi(pcm, bas, PENCERE);
    for (let b = 0; b < BANT; b++) top[b] += g[b];
    say++;
  }
  return say ? top.map((v) => v / say) : top;
}

// Dokuz olay sesinin baskın bandı (tavan kazancın kısıtı buradan çıkar).
const sesProfil = new Map<SesId, { bant: number; guc: number }>();
for (const id of IDLER) {
  const p = profil(seslendir(SES_KATALOG[id].katmanlar));
  let en = 0;
  for (let b = 1; b < BANT; b++) if (p[b] > p[en]) en = b;
  sesProfil.set(id, { bant: en, guc: p[en] });
}
const PAY = Math.pow(10, 12 / 10);

/** Doğrusal ara-değerli yeniden örnekleme (44100 → 22050). */
function indir(pcm: Float32Array, hedefHz: number): Float32Array {
  const oran = ORNEKLEME / hedefHz;
  const n = Math.floor(pcm.length / oran);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * oran;
    const a = Math.floor(x);
    const t = x - a;
    out[i] = pcm[a] * (1 - t) + (pcm[Math.min(pcm.length - 1, a + 1)] ?? 0) * t;
  }
  return out;
}

const b64 = (b: Buffer): string => 'data:audio/wav;base64,' + b.toString('base64');

mkdirSync(HEDEF, { recursive: true });

const cikti: Record<string, unknown>[] = [];
for (const ad of SECILEN) {
  const a = liste.find((x) => x.ad === ad);
  if (!a) { console.log(`  ! listede yok: ${ad}`); continue; }
  const pcm = pcmOku(ad);

  // TAVAN KAZANÇ — ölçümle birebir aynı hesap.
  const pr = profil(pcm);
  let k = Infinity;
  let kisit: SesId = IDLER[0];
  for (const id of IDLER) {
    const s = sesProfil.get(id)!;
    if (pr[s.bant] <= 0) continue;
    const kk = Math.sqrt(s.guc / (PAY * pr[s.bant]));
    if (kk < k) { k = kk; kisit = id; }
  }

  // DİKİŞ KLİBİ: son YARIM saniye + ilk YARIM saniye. Parça YARIM*2'den kısaysa tamamı iki kez.
  const yarimOrnek = Math.min(Math.round(YARIM * ORNEKLEME), Math.floor(pcm.length / 2));
  const klip = new Float32Array(yarimOrnek * 2);
  klip.set(pcm.subarray(pcm.length - yarimOrnek), 0);
  klip.set(pcm.subarray(0, yarimOrnek), yarimOrnek);

  const kucuk = indir(klip, PANO_HZ);
  const veri = b64(wav(kucuk, PANO_HZ));

  cikti.push({
    ad,
    baslik: ad.replace(/_/g, ' '),
    paket: a.paket,
    kunye: a.kunye,
    etiket: a.etiket || '',
    sure: a.sure,
    kb: Math.round(statSync(a.yol).size / 1024),
    enerji: a.enerji, parlaklik: a.parlaklik, hiz: a.hiz, karmasiklik: a.karmasiklik, puan: a.puan,
    tavanDb: +(20 * Math.log10(k)).toFixed(1),
    tavanKazanc: +k.toFixed(5),
    rmsSonra: +(rms(pcm) * k).toFixed(5),
    kisit,
    sicrama: +Math.abs(pcm[pcm.length - 1] - pcm[0]).toFixed(4),
    dikisSn: +(yarimOrnek / ORNEKLEME).toFixed(1),
    veri,
  });
  console.log(`  ✓ ${ad.padEnd(34)} tavan ${(20 * Math.log10(k)).toFixed(1)} dB · klip ${(kucuk.length / PANO_HZ).toFixed(1)} sn · ${(veri.length / 1024 / 1024).toFixed(2)} MB`);
}

const sentezOrt = IDLER.reduce((a, id) => a + rms(seslendir(SES_KATALOG[id].katmanlar)), 0) / IDLER.length;
const js = '/* URETILMIS DOSYA — elle duzenleme. Kaynak: tools/muzik-karar-paketi.ts */\n' +
  'window.MUZIK = ' + JSON.stringify({ hz: PANO_HZ, yarim: YARIM, sesRmsOrt: +sentezOrt.toFixed(4), adaylar: cikti }) + ';\n';
writeFileSync(`${HEDEF}/muzik.js`, js);
console.log(`\nyazildi: ${HEDEF}/muzik.js — ${(js.length / 1024 / 1024).toFixed(2)} MB · ${cikti.length} aday`);
