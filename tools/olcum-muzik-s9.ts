/**
 * olcum-muzik-s9.ts — ARKA PLAN MÜZİĞİ ADAYLARINI ÖLÇER (S9 · kol O5).
 *
 * NEDEN AYRI KOL: D-122'de ortam UĞULTUSU (O1/O3) reddedildi — kullanıcı *"uğultu da hiç
 * olmasın"* dedi ve yerine *"daha farklı bir tycoon oyun arka planı"* istedi. Yani aranan şey
 * bir ses YATAĞI değil, bir MÜZİK döngüsü. Bu iki şeyin ölçütü de farklı: yatak bant-sınırlı
 * gürültüdür ve yalnız maskelemeyle yargılanır; müziğin ayrıca DİKİŞİ (döngü noktası) ve
 * DİNAMİĞİ vardır — kabaran bir parça oyunun sesini düzensiz aralıklarla yutar.
 *
 * TURUN ASIL SORUSU — ve neden tek sayıya iniyor:
 * Bir arka plan müziği iki ateş arasındadır. Yeterince kısılmazsa dokuz olay sesini örter
 * (oyuncu parasını topladığını duymaz). Fazla kısılırsa kendisi duyulmaz ve APK'da boşuna
 * durur. Bu yüzden her aday için TEK bir sayı hesaplanıyor: **tavan kazanç** — dokuz sesin
 * HEPSİNİ kendi baskın bandında +12 dB üstte tutan en yüksek müzik seviyesi (S17 §6b'nin
 * kuralı, aynen). O kazançta parçanın kendi RMS'i ne kadar kalıyorsa, "duyulur mu" sorusunun
 * sayısı odur.
 *
 * DİKİŞ: parça döngüye alınacağı için sonu başına eklenir. Ölçülen iki şey — (a) sınırdaki
 * ÖRNEK sıçraması (tık sesi verir), (b) son ve ilk saniyenin spektral farkı (ani değişim
 * "başa sardı" diye duyulur). İkisi de düşükse dikiş duyulmaz.
 *
 * TAKLİT YOK: adaylar oyunun kendi çözücüsünden geçiyor (`tools/ses-coz.mjs`, Chromium
 * `decodeAudioData`) ve dokuz olay sesi `audioSynth.seslendir()`in tam tamponu.
 *
 * Çalıştır:
 *   node tools/ses-coz.mjs indirilen-muzik/_liste.json indirilen-muzik/_pcm
 *   OLCUM=tam npx tsx tools/olcum-muzik-s9.ts > docs/olcum-muzik-s9.txt
 */
import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { SES_KATALOG, type SesId } from '../src/game/audio.ts';
import { ORNEKLEME, seslendir } from '../src/game/audioSynth.ts';
import { BANT, rms } from './ses-metrik.ts';
import { IDLER } from './ses-secim.ts';
import { damga, damgaOzeti } from './olcum-lib';

const PCM_KLASOR = 'indirilen-muzik/_pcm';
const LISTE = 'indirilen-muzik/_liste.json';

interface Aday { ad: string; yol: string; paket: string; kunye: string }

const kip = process.env.OLCUM === 'tam' ? 'tam' : 'kisa';
const adaylar: Aday[] = JSON.parse(readFileSync(LISTE, 'utf8'));

function pcmOku(ad: string): Float32Array {
  const b = readFileSync(path.join(PCM_KLASOR, `${ad}.f32`));
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

console.log('='.repeat(92));
console.log('S9 — ARKA PLAN MUZIGI: hangi parca dokuz sesi ORTMEDEN duyulur kalir?');
console.log('ANALITIK ARAC · deterministik · adaylar oyunun kendi cozucusunden (Chromium)');
console.log('='.repeat(92));
if (kip !== 'tam') console.log('\n!! KISA KIP — bu cikti RAPORA GIRMEZ (D-084). Tam kosu: OLCUM=tam\n');

// --- Bant enerjisi: ses-metrik ile AYNI bolme (80 Hz - 12 kHz, 24 log bant) ---------------
const BANT_ALT = 80, BANT_UST = 12000, PENCERE = 2048;
const KENAR = Array.from({ length: BANT + 1 }, (_, i) => BANT_ALT * Math.pow(BANT_UST / BANT_ALT, i / BANT));

/** Basit DFT gucu — pencere basina; tam FFT gerekmiyor, bant sayisi 24. */
function bantEnerjisi(pcm: Float32Array, bas: number, boy: number): number[] {
  const n = Math.min(boy, pcm.length - bas);
  if (n < 256) return new Array(BANT).fill(0);
  const guc = new Array<number>(BANT).fill(0);
  // Goertzel: her bandin merkez frekansinda tek nokta — 24 bant icin FFT'den ucuz ve yeterli.
  for (let b = 0; b < BANT; b++) {
    const f = Math.sqrt(KENAR[b] * KENAR[b + 1]);
    const w = (2 * Math.PI * f) / ORNEKLEME;
    const c = 2 * Math.cos(w);
    let s1 = 0, s2 = 0;
    for (let i = 0; i < n; i++) {
      const s0 = pcm[bas + i] + c * s1 - s2;
      s2 = s1; s1 = s0;
    }
    guc[b] = (s1 * s1 + s2 * s2 - c * s1 * s2) / n;
  }
  return guc;
}

/** Parcanin TAMAMI icin bant profili (pencereler ortalanir). */
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

// === §1 DOKUZ SESIN BASKIN BANDI (S17 §6b ile ayni kural) ==================
console.log('\n§1 OLAY SESLERININ BASKIN BANDI — yatak/muzik bu bantlarda yarisir');
console.log('ses         baskin bant  o banttaki guc');
const sesProfil = new Map<SesId, { bant: number; guc: number }>();
for (const id of IDLER) {
  const p = profil(seslendir(SES_KATALOG[id].katmanlar));
  let en = 0;
  for (let b = 1; b < BANT; b++) if (p[b] > p[en]) en = b;
  sesProfil.set(id, { bant: en, guc: p[en] });
  console.log(id.padEnd(11) + String(en).padStart(12) + '  ' + p[en].toExponential(3).padStart(14));
}

// === §2 ADAY OLCULERI ======================================================
console.log('\n§2 ADAYLAR — sure · boyut · RMS · tepe · dinamik yayilim');
console.log('aday                              paket        sure(sn)  KB    RMS     tepe   dinamik(dB)');
interface Olcu {
  aday: Aday; pcm: Float32Array; sure: number; kb: number; rms: number; tepe: number;
  dinamik: number; profil: number[];
}
const olculer: Olcu[] = [];
for (const a of adaylar) {
  if (!existsSync(path.join(PCM_KLASOR, `${a.ad}.f32`))) { console.log(`  ! PCM yok: ${a.ad}`); continue; }
  const pcm = pcmOku(a.ad);
  // Dinamik yayilim: saniyelik RMS'lerin en yuksek/en dusuk orani. Buyukse parca KABARIYOR
  // demektir ve arka planda duzensiz araliklarla one cikar.
  const saniyeler: number[] = [];
  for (let i = 0; i + ORNEKLEME <= pcm.length; i += ORNEKLEME) saniyeler.push(rms(pcm.subarray(i, i + ORNEKLEME)));
  const gecerli = saniyeler.filter((v) => v > 1e-5);
  const dinamik = gecerli.length > 1 ? 20 * Math.log10(Math.max(...gecerli) / Math.min(...gecerli)) : 0;
  let tepe = 0;
  for (let i = 0; i < pcm.length; i++) { const v = Math.abs(pcm[i]); if (v > tepe) tepe = v; }
  const o: Olcu = {
    aday: a, pcm, sure: pcm.length / ORNEKLEME, kb: statSync(a.yol).size / 1024,
    rms: rms(pcm), tepe, dinamik, profil: profil(pcm),
  };
  olculer.push(o);
  console.log(
    a.ad.padEnd(34) + a.paket.padEnd(12) + o.sure.toFixed(1).padStart(8) + ' ' +
    o.kb.toFixed(0).padStart(5) + ' ' + o.rms.toFixed(4).padStart(7) + ' ' +
    o.tepe.toFixed(3).padStart(6) + ' ' + o.dinamik.toFixed(1).padStart(11));
}

// === §3 TAVAN KAZANC — turun asil sayisi ===================================
console.log('\n§3 TAVAN KAZANC — dokuz sesin HEPSINI kendi bandinda +12 dB ustte tutan en yuksek muzik seviyesi');
console.log('(S17 §6b ile ayni 12 dB payi: kisa bir gecis sesinin surekli bir katmanin ustunde kalmasi icin gereken kaba pay.)');
console.log('aday                              tavan kazanc(dB)  o kazancta RMS  kisitlayan ses  kisitlayan bant');
const PAY = Math.pow(10, 12 / 10); // 12 dB guc orani
interface Tavan { o: Olcu; kazancDb: number; rmsSonra: number; kisit: SesId; bant: number }
const tavanlar: Tavan[] = [];
for (const o of olculer) {
  let enKucuk = Infinity;
  let kisit: SesId = IDLER[0];
  let bant = 0;
  for (const id of IDLER) {
    const s = sesProfil.get(id)!;
    const muzikGuc = o.profil[s.bant];
    if (muzikGuc <= 0) continue;
    // ses.guc / (muzik.guc * k^2) >= PAY  ->  k <= sqrt(ses.guc / (PAY * muzik.guc))
    const k = Math.sqrt(s.guc / (PAY * muzikGuc));
    if (k < enKucuk) { enKucuk = k; kisit = id; bant = s.bant; }
  }
  const db = 20 * Math.log10(enKucuk);
  tavanlar.push({ o, kazancDb: db, rmsSonra: o.rms * enKucuk, kisit, bant });
}
tavanlar.sort((a, b) => b.rmsSonra - a.rmsSonra);
for (const t of tavanlar) {
  console.log(
    t.o.aday.ad.padEnd(34) + t.kazancDb.toFixed(1).padStart(16) + '  ' +
    t.rmsSonra.toFixed(5).padStart(14) + '  ' + t.kisit.padEnd(15) + String(t.bant).padStart(15));
}
console.log('\n-> "o kazancta RMS" BUYUK olan, kisilmaya en dayanikli parcadir: dokuz sesi ortmeden');
console.log('   kendisi en cok duyulur kalan. Kucuk olan, sigmak icin neredeyse yok olmak zorunda.');
const sentezOrt = IDLER.reduce((a, id) => a + rms(seslendir(SES_KATALOG[id].katmanlar)), 0) / IDLER.length;
console.log('KIYAS: dokuz olay sesinin ortalama RMS\'i ' + sentezOrt.toFixed(4) +
  '  (muzik bunun ~%' + (100 * tavanlar[0].rmsSonra / sentezOrt).toFixed(0) + "'i kadar kalabiliyor, en iyi adayda)");

// === §4 DIKIS — dongu noktasi duyulur mu? ==================================
console.log('\n§4 DIKIS — parca basa sardiginda tik/kopma duyulur mu?');
console.log('aday                              ornek sicramasi  bas/son RMS orani(dB)  spektral fark');
for (const o of olculer) {
  // (a) Sinirdaki ornek sicramasi: son ornek ile ilk ornek arasindaki fark. Buyukse TIK.
  const sicrama = Math.abs(o.pcm[o.pcm.length - 1] - o.pcm[0]);
  // (b) Son 1 sn ile ilk 1 sn: seviye ve spektrum ayni mi?
  const n = Math.min(ORNEKLEME, Math.floor(o.pcm.length / 4));
  const bas = o.pcm.subarray(0, n);
  const son = o.pcm.subarray(o.pcm.length - n);
  const oran = 20 * Math.log10((rms(son) || 1e-9) / (rms(bas) || 1e-9));
  const pb = profil(bas), ps = profil(son);
  let fark = 0, say = 0;
  for (let b = 0; b < BANT; b++) {
    if (pb[b] > 1e-12 && ps[b] > 1e-12) { fark += Math.abs(10 * Math.log10(ps[b] / pb[b])); say++; }
  }
  console.log(
    o.aday.ad.padEnd(34) + sicrama.toFixed(4).padStart(15) + '  ' +
    oran.toFixed(1).padStart(20) + '  ' + (say ? (fark / say).toFixed(1) : '—').padStart(13) + ' dB');
}
console.log('-> ornek sicramasi < 0,05 ise tik duyulmaz · bas/son RMS orani |x| < 3 dB ise seviye tutuyor');
console.log('   · spektral fark kucukse parca ayni dokuyla basliyor ve bitiyor (dikis gizlenir).');

// === §5 BEDEL ==============================================================
console.log('\n§5 APK PAYI');
for (const t of tavanlar) {
  console.log('  ' + t.o.aday.ad.padEnd(34) + t.o.kb.toFixed(0).padStart(5) + ' KB  · ' + t.o.aday.kunye);
}
console.log('KIYAS: dokuz olay sesinin sentezi 0 KB (kod) · secilen dosyali dokuzlu olsaydi 116,7 KB');

// --- Damgalar --------------------------------------------------------------
damga('aday havuzu bos degil', olculer.length > 0, olculer.length + ' aday cozuldu');
damga('dokuz olay sesinin baskin bandi bulundu', sesProfil.size === IDLER.length, sesProfil.size + '/' + IDLER.length);
damga('tavan kazanc negatif (muzik KISILMAK zorunda)', tavanlar.every((t) => t.kazancDb < 0),
  'en yuksek tavan ' + Math.max(...tavanlar.map((t) => t.kazancDb)).toFixed(1) + ' dB');
damga('adaylar farkli paketlerden', new Set(olculer.map((o) => o.aday.paket)).size > 1,
  new Set(olculer.map((o) => o.aday.paket)).size + ' paket');
damgaOzeti();
