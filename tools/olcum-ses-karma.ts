/**
 * olcum-ses-karma.ts — S17'NİN EKSİK KOLU: KARMA katalog ölçülebilir mi?
 *
 * NEDEN AYRI KOŞU: `olcum-ses-s17.ts` iki UÇ hâli ölçtü — dokuzu da sentez (E4 tabanı,
 * 0/36 KARIŞIR) ve dokuzu da dosya (36/36 AYRI). Karar paketi yazılırken ortadaki kol
 * (bir kısmı dosya, bir kısmı sentez) sayısız kaldı: matriste dosya↔dosya ve sentez↔sentez
 * mesafeleri var, **dosya↔sentez ÇAPRAZ mesafeleri yok**. Sayısı olmayan kol karar paketine
 * girmez (D-084 varyant kapısı) — bu araç o çaprazı üretir.
 *
 * ÖLÇÜ AYNI CETVEL: `ses-metrik.ts`in `spektrogram`ı tepeyi 0 dB'e normalize eder, yani
 * dosyaların sentezden 16,6 dB yüksek olması mesafeyi ŞİŞİRMEZ — iki kaynak aynı ölçekte
 * karşılaştırılabilir. Hüküm eşiği de S17'nin kendisiyle aynı: MUTLAK TABAN sentez tarafında
 * ölçülür (aynı ses, 1 yarım ses tiz) ve `mesafe < TABAN && sureJnd < 2` → KARIŞIR.
 *
 * NE SORAR: her BÖLÜŞÜM (hangi olay dosyadan gelir) için ortaya çıkan dokuzlu katalogda
 *   · kaç çift KARIŞIR                     → kimlik bozuluyor mu
 *   · en yakın çift kaç dB (taban kaç katı) → payın büyüklüğü
 *   · APK payı (KB) · `aralik` taşması     → bedeli
 *
 * KOŞU KİPİ YOK: analitik, deterministik, saniyeler sürer (`olcum-ses-s17.ts` ile aynı gerekçe).
 * Yine de `OLCUM=tam` ile alınır ki damga özeti "tam" bassın.
 *
 * Çalıştır:
 *   OLCUM=tam npx tsx tools/olcum-ses-karma.ts > docs/olcum-ses-karma.txt
 */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { SES_KATALOG, sesSure, type SesId } from '../src/game/audio.ts';
import { ORNEKLEME, seslendir } from '../src/game/audioSynth.ts';
import { SURE_WEBER, YARIM_SES, etkinSure, izParmak, izParmakPcm, mesafe, transpoze } from './ses-metrik.ts';
import { HAVUZ } from './ses-adaylari.ts';
import { damga, damgaOzeti } from './olcum-lib';

const PCM_KLASOR = 'indirilen/_pcm';

function pcmOku(ad: string): Float32Array {
  const b = readFileSync(path.join(PCM_KLASOR, `${ad}.f32`));
  return new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
}

const IDLER = Object.keys(SES_KATALOG) as SesId[];
const kip = process.env.OLCUM === 'tam' ? 'tam' : 'kisa';

console.log('='.repeat(92));
console.log('S17-EK — KARMA KATALOG: dosya ile sentez AYNI katalogda durabilir mi?');
console.log('ANALITIK ARAC · deterministik · S17 ile AYNI metrik ve AYNI hukum esigi');
console.log('='.repeat(92));
if (kip !== 'tam') console.log('\n!! KISA KIP — bu cikti RAPORA GIRMEZ (D-084). Tam kosu: OLCUM=tam\n');

// === Taban ================================================================
const mutlakTabanlar = IDLER.map((id) =>
  mesafe(izParmak(SES_KATALOG[id].katmanlar), izParmak(transpoze(SES_KATALOG[id].katmanlar, YARIM_SES))));
const MUTLAK_TABAN = mutlakTabanlar.reduce((a, b) => a + b, 0) / mutlakTabanlar.length;

// === Iki taraf: her olayin SENTEZ hali ve SECILEN dosyasi ==================
interface Yan { iz: number[][]; etkin: number; kb: number; ad: string }
const sentezYan = new Map<SesId, Yan>();
const dosyaYan = new Map<SesId, Yan>();

for (const id of IDLER) {
  const p = seslendir(SES_KATALOG[id].katmanlar);
  sentezYan.set(id, { iz: izParmakPcm(p), etkin: etkinSure(p), kb: 0, ad: `sentez:${id}` });
}

/**
 * SECIM S17 ILE BIREBIR AYNI KURALLA yeniden uretilir (kopyalanmaz, TURETILIR): her olay icin
 * adaylar, DIGER olaylarin TUM adaylarina olan en kisa mesafesine gore siralanir, ilki secilir.
 * Boylece bu arac S17'nin secimini dogrular; ayrisirsa asagidaki damga kirilir.
 */
const havuzIz = new Map<string, { iz: number[][]; olay: SesId; etkin: number; kb: number }>();
for (const olay of IDLER) {
  for (const a of HAVUZ[olay] ?? []) {
    const pcm = pcmOku(a.ad);
    havuzIz.set(a.ad, { iz: izParmakPcm(pcm), olay, etkin: etkinSure(pcm), kb: statSync(a.yol).size / 1024 });
  }
}
for (const olay of IDLER) {
  const havuz = (HAVUZ[olay] ?? []).map((a) => a.ad);
  if (havuz.length === 0) continue;
  let enIyi = '';
  let enIyiPuan = -Infinity;
  for (const ad of havuz) {
    const A = havuzIz.get(ad)!;
    let enKisa = Infinity;
    for (const [bAd, B] of havuzIz) {
      if (B.olay === olay) continue;
      const d = mesafe(A.iz, B.iz);
      if (d < enKisa) { enKisa = d; void bAd; }
    }
    if (enKisa > enIyiPuan) { enIyiPuan = enKisa; enIyi = ad; }
  }
  const S = havuzIz.get(enIyi)!;
  dosyaYan.set(olay, { iz: S.iz, etkin: S.etkin, kb: S.kb, ad: enIyi });
}

console.log('\n§A SECILEN DOKUZLU (S17 §3b ile ayni kuraldan TURETILDI)');
console.log('olay        secilen dosya                 KB   etkin(sn)  aralik(sn)  sentez etkin(sn)');
for (const id of IDLER) {
  const D = dosyaYan.get(id)!;
  const S = sentezYan.get(id)!;
  console.log(id.padEnd(11) + D.ad.padEnd(30) + D.kb.toFixed(1).padStart(5) + '  ' +
    D.etkin.toFixed(3).padStart(9) + '  ' + SES_KATALOG[id].aralik.toFixed(2).padStart(10) + '  ' +
    S.etkin.toFixed(3).padStart(15));
}

// === §B CAPRAZ MATRIS — S17'de OLMAYAN sayi ===============================
console.log('\n§B CAPRAZ MATRIS — secilen DOSYA (satir) ile SENTEZ (sutun) arasi mesafe, dB');
console.log('Kosegen = "ayni olayin iki hali" (kaynak takasinin kendisi), karara GIRMEZ.');
console.log('Kritik olan KOSEGEN DISI: karma katalogta bir dosya, BASKA bir olayin sentezine');
console.log('ne kadar yakin? Bu satirlar S17 cikitisinda hic yoktu.');
console.log('MUTLAK TABAN = ' + MUTLAK_TABAN.toFixed(2) + ' dB  (bunun altinda + sure < 2 JND => KARISIR)');
console.log('');
console.log('dosya \\ sentez'.padEnd(16) + IDLER.map((i) => i.slice(0, 8).padStart(9)).join(''));
const capraz = new Map<string, number>();
for (const a of IDLER) {
  const satir: string[] = [];
  for (const b of IDLER) {
    const d = mesafe(dosyaYan.get(a)!.iz, sentezYan.get(b)!.iz);
    capraz.set(a + '|' + b, d);
    satir.push((a === b ? '[' + d.toFixed(2) + ']' : d.toFixed(2)).padStart(9));
  }
  console.log(a.padEnd(16) + satir.join(''));
}

let enYakinCapraz = Infinity;
let enYakinCift = '';
for (const a of IDLER) {
  for (const b of IDLER) {
    if (a === b) continue;
    const d = capraz.get(a + '|' + b)!;
    if (d < enYakinCapraz) { enYakinCapraz = d; enYakinCift = `dosya:${a} <-> sentez:${b}`; }
  }
}
console.log('\nKOSEGEN DISI EN YAKIN: ' + enYakinCift + ' = ' + enYakinCapraz.toFixed(2) +
  ' dB (x' + (enYakinCapraz / MUTLAK_TABAN).toFixed(2) + ' taban)');

// === §C BOLUSUMLER — her kol icin ortaya cikan dokuzlu katalog =============
interface Kol { kod: string; ad: string; dosyaOlaylar: SesId[]; not: string }
const KOLLAR: Kol[] = [
  { kod: 'K1', ad: 'Sentez kalsin (BUGUNKU)', dosyaOlaylar: [], not: 'E4 tabani · D-096' },
  { kod: 'K2', ad: 'Dokuzu da dosya', dosyaOlaylar: [...IDLER], not: 'S-C tam · D-106 harfiyen' },
  {
    kod: 'K3', ad: 'FIZIKSEL aile dosya, ilerleme sentez',
    dosyaOlaylar: ['coin', 'pour', 'serve'],
    not: 'D-080 aile ayrimi: foley dosyadan, ezgi kodtan',
  },
  {
    kod: 'K4', ad: 'Yalniz coin dosya',
    dosyaOlaylar: ['coin'],
    not: 'kullanicinin harfi sikayeti: "guzel coin sesi gibi olsa"',
  },
  {
    kod: 'K5', ad: 'ILERLEME dosya, fiziksel sentez (K3 tersi)',
    dosyaOlaylar: ['purchase', 'padFill', 'quest', 'level', 'master', 'reward'],
    not: 'karsit kol — elenmesi de bir sayidir',
  },
];

interface Sonuc {
  kol: Kol; karisir: number; toplam: number; enYakin: number; enYakinAd: string;
  ortMin: number; kb: number; tasan: number; tasanlar: string[];
}
const sonuclar: Sonuc[] = [];

for (const kol of KOLLAR) {
  const dosyadan = new Set(kol.dosyaOlaylar);
  const yan = (id: SesId): Yan => (dosyadan.has(id) ? dosyaYan.get(id)! : sentezYan.get(id)!);

  let karisir = 0;
  let toplam = 0;
  let enYakin = Infinity;
  let enYakinAd = '';
  const minler: number[] = [];
  for (let i = 0; i < IDLER.length; i++) {
    let benimMin = Infinity;
    for (let j = 0; j < IDLER.length; j++) {
      if (i === j) continue;
      const A = yan(IDLER[i]);
      const B = yan(IDLER[j]);
      const d = mesafe(A.iz, B.iz);
      if (d < benimMin) benimMin = d;
      if (j <= i) continue;
      toplam++;
      const sureJnd = Math.abs(Math.log(A.etkin / B.etkin)) / Math.log(SURE_WEBER);
      if (d < MUTLAK_TABAN && sureJnd < 2) karisir++;
      if (d < enYakin) { enYakin = d; enYakinAd = A.ad + ' <-> ' + B.ad; }
    }
    minler.push(benimMin);
  }

  const kb = kol.dosyaOlaylar.reduce((a, id) => a + dosyaYan.get(id)!.kb, 0);
  const tasanlar = kol.dosyaOlaylar.filter((id) => dosyaYan.get(id)!.etkin > SES_KATALOG[id].aralik);
  sonuclar.push({
    kol, karisir, toplam, enYakin, enYakinAd,
    ortMin: minler.reduce((a, b) => a + b, 0) / minler.length,
    kb, tasan: tasanlar.length, tasanlar: tasanlar.map(String),
  });
}

console.log('\n§C BOLUSUMLER — her kolun ortaya cikardigi DOKUZLU katalog, ayni cetvelle');
console.log('kol  ne                                       KARISIR  enYakin(dB) x taban  ortMin(dB)   KB  aralik tasan');
for (const s of sonuclar) {
  console.log(
    s.kol.kod.padEnd(5) + s.kol.ad.padEnd(41) +
    (s.karisir + '/' + s.toplam).padStart(7) + '  ' +
    s.enYakin.toFixed(2).padStart(11) + '  ' +
    ('x' + (s.enYakin / MUTLAK_TABAN).toFixed(2)).padStart(7) + '  ' +
    s.ortMin.toFixed(2).padStart(10) + ' ' + s.kb.toFixed(1).padStart(6) + '  ' +
    (s.tasan + '/' + s.kol.dosyaOlaylar.length).padStart(12));
}
console.log('');
for (const s of sonuclar) {
  console.log(s.kol.kod + ' en yakin cift : ' + s.enYakinAd + '  (' + s.enYakin.toFixed(2) + ' dB)');
}
console.log('');
for (const s of sonuclar) {
  if (s.tasan > 0) console.log(s.kol.kod + ' aralik tasan   : ' + s.tasanlar.join(' · '));
}

// === §D NORMALIZASYON HEDEFI ==============================================
console.log('\n§D NORMALIZASYON — dosya seti hangi kazancla sentezin seviyesine iner?');
console.log('(Karma katalogta iki kaynak AYNI katalogta calar; seviye farki en cok BURADA duyulur.)');
console.log('olay        dosya RMS  sentez RMS  gereken kazanc(dB)  kazanc sonrasi tepe');
const rmsOf = (p: Float32Array): number => {
  let t = 0;
  for (let i = 0; i < p.length; i++) t += p[i] * p[i];
  return Math.sqrt(t / p.length);
};
const kazanclar: number[] = [];
for (const id of IDLER) {
  const dPcm = pcmOku(dosyaYan.get(id)!.ad);
  const sPcm = seslendir(SES_KATALOG[id].katmanlar);
  const dR = rmsOf(dPcm);
  const sR = rmsOf(sPcm);
  const kazanc = 20 * Math.log10(sR / dR);
  kazanclar.push(kazanc);
  let tepe = 0;
  for (let i = 0; i < dPcm.length; i++) { const v = Math.abs(dPcm[i]); if (v > tepe) tepe = v; }
  console.log(id.padEnd(11) + dR.toFixed(4).padStart(9) + '  ' + sR.toFixed(4).padStart(10) + '  ' +
    kazanc.toFixed(1).padStart(18) + '  ' + (tepe * Math.pow(10, kazanc / 20)).toFixed(3).padStart(19));
}
const kazancOrt = kazanclar.reduce((a, b) => a + b, 0) / kazanclar.length;
console.log('ortalama gereken kazanc : ' + kazancOrt.toFixed(1) + ' dB');
console.log('  -> TEK kazanc mi, ses basina mi? Yayilim: ' +
  Math.min(...kazanclar).toFixed(1) + ' … ' + Math.max(...kazanclar).toFixed(1) + ' dB (' +
  (Math.max(...kazanclar) - Math.min(...kazanclar)).toFixed(1) + ' dB fark)');

// === §E ARALIK KELEPCESI — tasma nasil kapanir ============================
console.log('\n§E ARALIK KELEPCESI — tasan dosya icin iki cikis yolu, sayiyla');
console.log('olay        aralik(sn)  dosya etkin(sn)  A: aralik buyusun  B: dosya kirpilsin(kesilen sn)');
for (const id of IDLER) {
  const D = dosyaYan.get(id)!;
  const ar = SES_KATALOG[id].aralik;
  if (D.etkin <= ar) continue;
  console.log(id.padEnd(11) + ar.toFixed(2).padStart(10) + '  ' + D.etkin.toFixed(3).padStart(15) +
    '  ' + D.etkin.toFixed(2).padStart(17) + '  ' + (D.etkin - ar).toFixed(3).padStart(28));
}
console.log('NOT: `aralik` `audio.ts`te durur — DENGE dosyasi degil (sira-kilidi: economy.config /');
console.log('     tick / rules). Yani bu secim varyant kapisina tabi DEGIL, ama yine de olculdu.');

// === Damgalar =============================================================
damga('mutlak taban pozitif', MUTLAK_TABAN > 0, 'taban ' + MUTLAK_TABAN.toFixed(3));
damga('capraz matris dolu', capraz.size === IDLER.length * IDLER.length,
  capraz.size + ' hucre (beklenen ' + IDLER.length * IDLER.length + ')');
damga('dokuz olayin dokuzunda da dosya adayi var', dosyaYan.size === IDLER.length,
  dosyaYan.size + '/' + IDLER.length);
damga('K1 tabani S17 ile ayni hukmu veriyor', sonuclar[0].karisir === 0,
  'K1 KARISIR ' + sonuclar[0].karisir + '/36');
damga('K2 S17 §3c ile ayni hukmu veriyor', sonuclar[1].karisir === 0,
  'K2 KARISIR ' + sonuclar[1].karisir + '/36');
damga('secim S17 ile ayni dosyalari buldu',
  dosyaYan.get('coin')!.ad === 'coin_handleCoins2' && dosyaYan.get('pour')!.ad === 'pour_metalPot3' &&
  dosyaYan.get('serve')!.ad === 'serve_glass_003' && dosyaYan.get('level')!.ad === 'level_SAX03',
  'coin=' + dosyaYan.get('coin')!.ad + ' pour=' + dosyaYan.get('pour')!.ad +
  ' serve=' + dosyaYan.get('serve')!.ad + ' level=' + dosyaYan.get('level')!.ad);
damga('karma kollarin capraz cifti olculdu', enYakinCapraz < Infinity,
  'en yakin capraz ' + enYakinCapraz.toFixed(2) + ' dB');
void sesSure;
damgaOzeti();
