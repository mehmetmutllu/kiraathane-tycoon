/**
 * olcum-gec-oyun.ts — D1: geç-oyun eğrisi 20 dk ölçütünü Normal profilde 6 kez aşıyor.
 * Bu araç, ihlali kapatan HER KALDIRACI ayrı bir varyant olarak ölçer (D-084 varyant kapısı).
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-gec-oyun.ts > docs/olcum-gec-oyun.txt
 *        (geliştirirken OLCUM verilmezse KISA koşar — ızgara seyrekleşir, rapora girmez.)
 *
 * NE ÖLÇÜYOR — üç kolon, üçü birden okunmadan karar verilemez:
 *   1) İHLAL       Normal profilde 20 dk'yı aşan alım sayısı (hedef: D-078'in bilerek bıraktığı
 *                  `servis L6` dışında sıfır → yani ≤ 1; ayrıca "tam sıfır" dozu da çözülür).
 *   2) EN KÜÇÜK DOZ Kolun hedefi tutturan EN AZ müdahalesi. Doz tahmin edilmez, taranır: karar
 *                  paketine "L6'yı 5.500 yapalım mı?" değil "bu kol ancak %X ile karşılıyor" gider.
 *   3) TAKAS       O dozun başka nereyi bozduğu: açılışın üç ölçütü (D-079), zincirin uzunluğu
 *                  (ŞERİT), en uzun bekleme, ve modelin gerçeğe sapması (C5'in sınavı).
 *
 * DAMGA (C4 tuzağı ②): çözülen dozun parmak izi TABANınkiyle aynıysa varyant dünyaya hiç
 * dokunmamıştır — o satır ölçüm değil, tabanın kopyasıdır. `varyantDamgasi` bunu yakalar.
 */
import {
  olcutler, profilBosluklari, onbellekTemizle, milestoneTazele, m1Ayarla,
  modelDebisi, GERCEK, kolAyarla, KOLLAR, VARSAYILAN,
  type Olcut, type Bosluk,
} from './simulate.ts';
import { DENGE_KOLLARI, geriAl, type DengeKol } from './denge-kollari.ts';
import { KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur } from './olcum-lib.ts';

const SINIR = 20 * 60;
const dk = (x: number) => (Number.isFinite(x) ? `${(x / 60).toFixed(1)} dk` : '—');
const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)} sa` : '—');
const sn = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${x.toFixed(0)} sn` : '—');

/** Kol uygulanmadan önce dünya TABANA döner; yoksa kollar birbirinin üstüne biner.
 *  `m1` (taşıma darboğazsa taşıyıcıyı yükselt) bir MODEL kolu; g-kollarının bir kısmı onsuz
 *  yapısal olarak ölçülemez, o yüzden kolun kendisi hangi modelde koştuğunu söyler. */
function kolaGec(kol: DengeKol | null, doz: number): void {
  geriAl();
  m1Ayarla(kol?.m1 === true);
  if (kol) kol.uygula(doz);
  onbellekTemizle();
  milestoneTazele();
}

/** Normal profilin davranış parmak izi — varyant gerçekten etkili mi, bunu karşılaştırır. */
function iz(bosluklar: Bosluk[]): string {
  const h = izOlustur();
  for (const b of bosluklar) h.ekle(b.t, b.gap);
  return h.deger;
}

interface Sonuc {
  o: Olcut;
  iz: string;
  sapma: number;
}

/** Bir dozun tam ölçümü: ölçütler + parmak izi + modelin gerçeğe ortalama sapması. */
function olc(): Sonuc {
  const o = olcutler();
  const sapmalar = GERCEK.map((g) => Math.abs(modelDebisi(g) - g.olculen) / g.olculen);
  return { o, iz: iz(o.bosluklarNormal), sapma: sapmalar.reduce((a, b) => a + b, 0) / sapmalar.length };
}

kipBandi();
console.log('=== D1 — GEC-OYUN EGRISI: 20 dk olcutunu kapatan kaldiraclar (varyant olarak) ===');
console.log('');
console.log('Model: D-086 yururlukteki model (k1b + k2). economy.config.ts DOSYASI DEGISMEDI —');
console.log('kollar calisma aninda uygulanip geri alinir (tools/denge-kollari.ts).');
console.log('');

// Yururlukteki model her kolda ayni kalmali: kol DENGEYI degistiriyor, MODELI degil.
kolAyarla(VARSAYILAN);

/* ── TABAN ─────────────────────────────────────────────────────────────────────────── */
kolaGec(null, 0);
const taban = olc();

/* DORT profil, UCU degil: D-079'un ilk UC olcutu IDEALIZE profilde (verim 1.0) olculuyor,
 * dorduncusu (20 dk) ise Normal'de (0.55). Dorduncunun profili hicbir yerde SABITLENMEMIS —
 * yani "olcut tutuyor mu" sorusunun cevabi bugun okuyanin sectigi profile bagli. Idealize
 * satiri o yuzden buraya girdi: `o1` kolu bu dort sayiyi karsilastirmaktan ibaret. */
console.log('--- TABAN: dort profilde 20 dk`yi asan alimlar (olcut hangi profilde okunmali?) ---');
for (const [ad, eff] of [['Idealize', 1.0], ['Yogun', 0.8], ['Normal', 0.55], ['Rahat', 0.35]] as [string, number][]) {
  const bs = profilBosluklari(eff);
  const asan = bs.filter((b) => b.gap > SINIR);
  const enUzun = bs.reduce((a, b) => (b.gap > a.gap ? b : a), { t: 0, gap: 0, label: '—' });
  console.log(`  ${ad.padEnd(7)} asan ${String(asan.length).padStart(2)} · en uzun ${dk(enUzun.gap).padStart(8)} -> ${enUzun.label}`);
  for (const b of asan) console.log(`          @ ${sa(b.t).padStart(7)}  bekleme ${dk(b.gap).padStart(8)} -> ${b.label}`);
}
console.log('');
console.log(`  TABAN olcutleri: ilk alim ${sn(taban.o.ilkAlim)} · acilis enUzun ${dk(taban.o.acilisEnUzun)}` +
  ` · otomasyon ${dk(taban.o.otomasyon ?? NaN)} · SERIT ${sa(taban.o.serit)} · sapma %${(taban.sapma * 100).toFixed(0)}`);
console.log('');

/* ── KOL TARAMASI ──────────────────────────────────────────────────────────────────── */
/** Hedefler: <=1 (D-078'in bilerek biraktigi `servis L6` haric sifir) ve ==0 (tam temiz). */
const HEDEFLER = [1, 0] as const;

interface KolSonuc {
  kol: DengeKol;
  egri: { doz: number; asan: number; enUzun: number }[];
  cozum: Map<number, { doz: number; s: Sonuc }>;
  /** En uç dozun parmak izi — kol hedefi tutturamasa bile "gerçekten etkili miydi" sorusu için. */
  ucIz: string;
  ucSonuc: Sonuc;
}

const sonuclar: KolSonuc[] = [];
const adlar = Object.keys(DENGE_KOLLARI);

for (const ad of adlar) {
  const kol = DENGE_KOLLARI[ad];
  // Kısa koşuda ızgara seyreltilir AMA SON DOZ hep kalır: en uç doz düşerse kolun etkisiz mi
  // yoksa atıl mı olduğu ayırt edilemez (m1 kolu ilk denemede tam bu yüzden hiç ölçülmemişti).
  const son = kol.dozlar[kol.dozlar.length - 1];
  const dozlar = KISA
    ? [...new Set([...kol.dozlar.filter((_, i) => i % 2 === 0), son])]
    : kol.dozlar;
  const egri: KolSonuc['egri'] = [];
  const cozum = new Map<number, { doz: number; s: Sonuc }>();
  let ucIz: string | undefined;
  let ucSonuc: Sonuc | undefined;
  for (const doz of dozlar) {
    kolaGec(kol, doz);
    const s = olc();
    egri.push({ doz, asan: s.o.normalAsan, enUzun: s.o.normalEnUzun });
    for (const h of HEDEFLER) {
      if (!cozum.has(h) && s.o.normalAsan <= h) cozum.set(h, { doz, s });
    }
    ucIz = s.iz;
    ucSonuc = s;
    if (cozum.size === HEDEFLER.length) break;
  }
  sonuclar.push({ kol, egri, cozum, ucIz: ucIz!, ucSonuc: ucSonuc! });
}

/* ── EGRILER (ham) ─────────────────────────────────────────────────────────────────── */
console.log('--- DOZ -> IHLAL egrisi (kol basina; tarama TABANDAN uzaklasarak gider) ---');
for (const r of sonuclar) {
  console.log(`  ${r.kol.ad} (${r.kol.birim})  ${r.kol.ne}`);
  console.log('       ' + r.egri.map((e) => `${e.doz}:${e.asan}`).join('  '));
}
console.log('');

/* ── §Bulgular TABLOSU ─────────────────────────────────────────────────────────────── */
const bas = 'kol | model | hedef | en kucuk doz                              | ihlal | enUzun  | ilk alim | acilis | otom.  | SERIT   | sapma';
console.log('--- KOL BASINA: hedefi tutturan EN KUCUK doz ve TAKASI ---');
console.log('  acilis olcutleri (D-079): ilk alim < 90 sn · acilis enUzun <= 2 dk · otomasyon < 15 dk');
console.log('');
console.log(bas);
console.log('-'.repeat(bas.length));
console.log(
  'taban'.padEnd(3) + ' | ' + 'D-086'.padEnd(5) + ' | ' + '  —'.padEnd(5) + ' | ' + 'degisiklik yok'.padEnd(42) +
  ' | ' + String(taban.o.normalAsan).padStart(5) + ' | ' + dk(taban.o.normalEnUzun).padStart(7) +
  ' | ' + sn(taban.o.ilkAlim).padStart(8) + ' | ' + dk(taban.o.acilisEnUzun).padStart(6) +
  ' | ' + dk(taban.o.otomasyon ?? NaN).padStart(6) + ' | ' + sa(taban.o.serit).padStart(7) +
  ' | ' + `%${(taban.sapma * 100).toFixed(0)}`.padStart(5),
);

for (const r of sonuclar) {
  for (const h of HEDEFLER) {
    const c = r.cozum.get(h);
    if (!c) {
      console.log(`${r.kol.ad.padEnd(3)} | ${(r.kol.m1 ? '+m1' : 'D-086').padEnd(5)} | <=${h}   | ULASMIYOR (izgaranin sonuna kadar hedef tutmadi)`);
      continue;
    }
    kolaGec(r.kol, c.doz);
    const yazi = r.kol.yaz(c.doz);
    console.log(
      r.kol.ad.padEnd(3) + ' | ' + (r.kol.m1 ? '+m1' : 'D-086').padEnd(5) + ' | ' + `<=${h}`.padEnd(5) + ' | ' + yazi.slice(0, 42).padEnd(42) +
      ' | ' + String(c.s.o.normalAsan).padStart(5) + ' | ' + dk(c.s.o.normalEnUzun).padStart(7) +
      ' | ' + sn(c.s.o.ilkAlim).padStart(8) + ' | ' + dk(c.s.o.acilisEnUzun).padStart(6) +
      ' | ' + dk(c.s.o.otomasyon ?? NaN).padStart(6) + ' | ' + sa(c.s.o.serit).padStart(7) +
      ' | ' + `%${(c.s.sapma * 100).toFixed(0)}`.padStart(5),
    );
  }
}
console.log('');

/* ── HEDEFI TUTTURAN DOZDA KALAN IHLALLER ──────────────────────────────────────────── */
console.log('--- Hedef <=1 dozunda KALAN ihlal(ler) ---');
for (const r of sonuclar) {
  const c = r.cozum.get(1);
  if (!c) { console.log(`  ${r.kol.ad}: —`); continue; }
  const kalan = c.s.o.asanlar.map((a) => `${dk(a.gap)} -> ${a.label}`).join(' · ') || 'yok';
  console.log(`  ${r.kol.ad}: ${kalan}`);
}
console.log('');

/* ── DAMGALAR ──────────────────────────────────────────────────────────────────────── */
/* Her kolun EN UÇ dozu tabandan farklı davranmalı. Aynıysa kol dünyaya hiç dokunmamıştır:
 * "bu kaldıraç işe yaramıyor" ile "bu kol atıl kaldı" AYRI şeyler ve ikincisi bir ölçüm değil,
 * bir kod hatasıdır (C4 tuzağı ②). m1 kolu bu damgayı bilerek kırar — sebebi rapordadır. */
for (const r of sonuclar) {
  if (r.kol.atilBeklenir) {
    // m1: BULGUNUN KENDİSİ atıl kalmasıdır (serbest oyun bloğu görev hattı bitmeden koşmuyor).
    // Damga bu kez farkı değil AYNILIĞI arar: biri serbest oyunu düzeltirse bu damga kırılır
    // ve rapordaki hüküm yeniden okunmak zorunda kalır.
    damga(`${r.kol.ad} ATIL kaldi (beklenen)`, r.ucIz === taban.iz, `iz ${r.ucIz} != taban ${taban.iz} — serbest oyun artik kosuyor, m1 hukmu bayat`);
    continue;
  }
  varyantDamgasi(`${r.kol.ad} (en uc doz)`, taban.iz, r.ucIz);
}
// Model kolu tur boyunca DEGISMEDI mi (denge kolu modeli kaydirmamali)?
kolaGec(null, 0);
const kontrol = olc();
damga('taban geri donusu', kontrol.iz === taban.iz, `iz ${kontrol.iz} != ${taban.iz} — geriAl() eksik`);
damga('taban ihlal 6', taban.o.normalAsan === 6, `${taban.o.normalAsan} (D-086 Bulgu 7'de 6 idi)`);
damga('gec-oyun darbogazi tasima', KOLLAR.secilen != null, 'yururlukteki model kolu yok');
damgaOzeti();
