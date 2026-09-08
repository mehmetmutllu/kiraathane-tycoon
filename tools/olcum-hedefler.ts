/**
 * olcum-hedefler.ts — D3: hedeflerin (koleksiyon) ₺ ödülü tempoya ne yapıyor?
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-hedefler.ts > docs/olcum-hedefler.txt
 *        (OLCUM verilmezse KISA koşar — ızgara seyrekleşir, rapora GİRMEZ.)
 *
 * SORU — D1'in bilerek açık bıraktığı yarısı: *"Faz D bitince yeniden okunacak: meta katman
 * geç-oyun bekleme pencerelerini gerçekten dolduruyor mu?"* D1'de ölçülen dokuz düzeltici kolun
 * hepsi Kat 1 içeriğinden %7-42 götürdüğü için elenmişti. Hedef ödülü aynı şeyi yaparsa aynı
 * gerekçeyle elenir; yapmıyorsa — yani ödül PENCEREYE düşüyor ama zinciri kısaltmıyorsa — meta
 * katmanın ekonomik yeri budur.
 *
 * NE ÖLÇÜYOR — beş kolon birden okunmadan karar verilemez:
 *   1) ÖDENEN   Normal profil koşusunda hedeflerden düşen toplam ₺ (12 sa penceresinde).
 *   2) PENCERE  Bunun NE KADARI 20 dk'yı AŞAN bekleme aralıklarının İÇİNE düştü. Asıl soru bu:
 *               toplam ₺ büyük ama hepsi ilk saatte düşüyorsa geç-oyun pencereleri boş kalır.
 *               (İlk taslak yalnız EN UZUN pencereye bakıyordu; tek 43 dk'lık aralığa seyrek bir
 *               ödemenin düşmemesi bir bulgu değil, dar bir sorudur — ölçüt tüm ihlallere açıldı.)
 *   3) İHLAL    20 dk'yı aşan alım — hüküm İDEALİZE profilde (D-087), Normal gözlem bandı.
 *   4) ŞERİT    Zincirin uzunluğu: ödül Kat 1 içeriğinden ne kadar GÖTÜRÜYOR (D1'in eleme ölçütü).
 *   5) AÇILIŞ   D-079'un üç ölçütü — ödül erken oyuna sızıp açılışı bozuyor mu.
 *
 * DAMGA: kol açıkken hiç ödeme düşmediyse satır ölçüm değildir (D1'de `iade:0.25` varyantı tam
 * bu şekilde hiç tetiklenmemişti ve rapora sahte bir "fark yok" satırı girmişti).
 */
import {
  olcutler, profilBosluklari, onbellekTemizle, milestoneTazele, m1Ayarla,
  modelDebisi, GERCEK, kolAyarla, VARSAYILAN, hedefAkisiAyarla,
  type Olcut, type Bosluk,
} from './simulate.ts';
import { HEDEF_KOLLARI, odemeleriSifirla, sonKosuOdemeleri, sonKosuToplami, type HedefKol } from './hedef-kollari.ts';
import { KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur } from './olcum-lib.ts';

const SINIR = 20 * 60;
const dk = (x: number) => (Number.isFinite(x) ? `${(x / 60).toFixed(1)} dk` : '—');
const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)} sa` : '—');
const sn = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${x.toFixed(0)} sn` : '—');
const tl = (x: number) => (x >= 1000 ? `${Math.round(x / 1000)}k` : `${Math.round(x)}`);
/** Doz etiketi kolun BİRİMİNE göre: oran kolları yüzde, yoğunluk kolu adet. İlk taslak hepsini
 *  yüzde basıyordu ve hD'nin "6 kademe"si tabloya `%600` diye giriyordu. */
const dozYaz = (kol: HedefKol, doz: number): string =>
  doz === 0 ? '0' : doz >= 1 ? `${doz}` : `%${(doz * 100).toFixed(doz < 0.01 ? 1 : 0)}`;

/** Kol uygulanmadan önce dünya TABANA döner; yoksa kollar birbirinin üstüne biner. */
function kolaGec(kol: HedefKol | null, doz: number): void {
  odemeleriSifirla();
  hedefAkisiAyarla(kol ? kol.fabrika(doz) : null);
  m1Ayarla(false);
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
  /** Normal koşuda hedeflerden düşen toplam ₺. */
  odenen: number;
  /** Bunun 20 dk'yı AŞAN bekleme aralıklarının içine düşen kısmı (₺) ve kaç ödeme olduğu. */
  pencere: number;
  pencereAdet: number;
}

function olc(): Sonuc {
  const o = olcutler();
  const sapmalar = GERCEK.map((g) => Math.abs(modelDebisi(g) - g.olculen) / g.olculen);
  // `olcutler()` son olarak NORMAL profili koşar → kayıt onundur.
  const odemeler = sonKosuOdemeleri();
  // Her ihlal penceresi [alım anı - boşluk, alım anı] aralığıdır; oyuncu o aralık boyunca
  // biriktiriyordu. Ödül bu aralıkların İÇİNE düşüyorsa bekleme fiilen kısalır.
  const pencereler = o.bosluklarNormal.filter((b) => b.gap > SINIR).map((b) => [b.t - b.gap, b.t] as const);
  const icinde = odemeler.filter((p) => pencereler.some(([a, b]) => p.t >= a && p.t <= b));
  return {
    o,
    iz: iz(o.bosluklarNormal),
    sapma: sapmalar.reduce((a, b) => a + b, 0) / sapmalar.length,
    odenen: sonKosuToplami(),
    pencere: icinde.reduce((a, p) => a + p.tutar, 0),
    pencereAdet: icinde.length,
  };
}

kipBandi();
console.log('=== D3 — HEDEFLER (koleksiyon): odulun TEMPOYA etkisi (varyant olarak) ===');
console.log('');
console.log('Model: D-086 yururlukteki model (k1b + k2). economy.config.ts DOSYASI DEGISMEDI —');
console.log('kollar sim`in hedef-akisi kancasina takilir (tools/hedef-kollari.ts).');
console.log('');
console.log('MODEL SINIRI: odul duser dusmez cuzdana gecer sayilir. Gercekte oyuncu paneli acip');
console.log('"Al"a basana kadar bekler → buradaki etki bir UST SINIRdir.');
console.log('');

kolAyarla(VARSAYILAN);

/* ── TABAN ─────────────────────────────────────────────────────────────────────────── */
kolaGec(null, 0);
const taban = olc();

console.log('--- TABAN: dort profilde 20 dk`yi asan alimlar (hedef odulu YOK) ---');
for (const [ad, eff] of [['Idealize', 1.0], ['Yogun', 0.8], ['Normal', 0.55], ['Rahat', 0.35]] as [string, number][]) {
  const bs = profilBosluklari(eff);
  const asan = bs.filter((b) => b.gap > SINIR);
  const enUzun = bs.reduce((a, b) => (b.gap > a.gap ? b : a), { t: 0, gap: 0, label: '—' });
  console.log(`  ${ad.padEnd(8)} asan ${String(asan.length).padStart(2)} · en uzun ${dk(enUzun.gap).padStart(8)} -> ${enUzun.label}`);
}
console.log('');
console.log(`  TABAN olcutleri: ilk alim ${sn(taban.o.ilkAlim)} · acilis enUzun ${dk(taban.o.acilisEnUzun)}` +
  ` · otomasyon ${dk(taban.o.otomasyon ?? NaN)} · SERIT ${sa(taban.o.serit)} · sapma %${(taban.sapma * 100).toFixed(0)}`);
console.log(`  TABAN en uzun bekleme (Normal): ${dk(taban.o.normalEnUzun)} -> ${taban.o.normalEnUzunEtiket}`);
console.log(`  TABAN hukum (Idealize): asan ${taban.o.idealAsan} · en uzun ${dk(taban.o.idealEnUzun)} -> ${taban.o.idealEnUzunEtiket}`);
console.log('');

/* ── KOL TARAMASI ──────────────────────────────────────────────────────────────────── */
interface Satir { kol: HedefKol; doz: number; s: Sonuc }
const satirlar: Satir[] = [];

for (const ad of Object.keys(HEDEF_KOLLARI)) {
  const kol = HEDEF_KOLLARI[ad];
  const son = kol.dozlar[kol.dozlar.length - 1];
  // Kisa kosuda izgara seyreltilir AMA SON DOZ hep kalir: en uc doz duserse kolun etkisiz mi
  // yoksa atil mi oldugu ayirt edilemez (D1'de m1 kolu tam bu yuzden hic olculmemisti).
  const dozlar = KISA ? [...new Set([...kol.dozlar.filter((_, i) => i % 2 === 0), son])] : kol.dozlar;
  for (const doz of dozlar) {
    kolaGec(kol, doz);
    satirlar.push({ kol, doz, s: olc() });
  }
}

/* ── §Bulgular TABLOSU ─────────────────────────────────────────────────────────────── */
const bas = 'kol | doz   | ODENEN | PENCERE       | ihlal(N/I) | enUzun  | SERIT   | d.SERIT | ilk alim | acilis | otom.';
console.log('--- KOL x DOZ: odulun buyuklugu, YERI ve takasi ---');
console.log('  acilis olcutleri (D-079): ilk alim < 90 sn · acilis enUzun <= 2 dk · otomasyon < 15 dk');
console.log('  ihlal(N/I): Normal (gozlem) / Idealize (HUKUM, D-087) profilinde 20 dk`yi asan alim');
console.log('  d.SERIT   : zincirin TABANA gore kisalmasi — D1`in eleme olcutu (Kat 1 icerigi)');
console.log('');
console.log(bas);
console.log('-'.repeat(bas.length));

const satirYaz = (ad: string, doz: string, s: Sonuc) => {
  const dSerit = s.o.serit != null && taban.o.serit != null ? (s.o.serit - taban.o.serit) / taban.o.serit : NaN;
  console.log(
    ad.padEnd(3) + ' | ' + doz.padStart(5) +
    ' | ' + tl(s.odenen).padStart(6) +
    ' | ' + `${tl(s.pencere)} (${s.pencereAdet})`.padStart(13) +
    ' | ' + `${s.o.normalAsan}/${s.o.idealAsan}`.padStart(10) +
    ' | ' + dk(s.o.normalEnUzun).padStart(7) +
    ' | ' + sa(s.o.serit).padStart(7) +
    ' | ' + (Number.isFinite(dSerit) ? `%${(dSerit * 100).toFixed(1)}` : '—').padStart(7) +
    ' | ' + sn(s.o.ilkAlim).padStart(8) +
    ' | ' + dk(s.o.acilisEnUzun).padStart(6) +
    ' | ' + dk(s.o.otomasyon ?? NaN).padStart(6),
  );
};

satirYaz('tab', '—', taban);
let oncekiKol = '';
for (const r of satirlar) {
  if (r.kol.ad !== oncekiKol) {
    console.log(`    ${r.kol.ad}: ${r.kol.ne}`);
    oncekiKol = r.kol.ad;
  }
  satirYaz(r.kol.ad, dozYaz(r.kol, r.doz), r.s);
}
console.log('');

/* ── ODUL BANDI: dozun insan dilindeki karsiligi ───────────────────────────────────── */
console.log('--- Dozun karsiligi (kademe odulleri, ₺) ---');
for (const ad of Object.keys(HEDEF_KOLLARI)) {
  const kol = HEDEF_KOLLARI[ad];
  for (const doz of kol.dozlar) {
    if (doz === 0 && kol.ad !== 'h0') continue;
    const etiket = dozYaz(kol, doz).padStart(5);
    console.log(`  ${kol.ad} ${etiket}  ${kol.yaz(doz)}`);
  }
}
console.log('');

/* ── ODEMELERIN ZAMAN DAGILIMI (en uc doz) ─────────────────────────────────────────── */
console.log('--- Odemelerin ZAMAN dagilimi (her kolun en uc dozu, Normal profil) ---');
for (const ad of Object.keys(HEDEF_KOLLARI)) {
  const kol = HEDEF_KOLLARI[ad];
  const son = kol.dozlar[kol.dozlar.length - 1];
  kolaGec(kol, son);
  const s = olc();
  const ode = sonKosuOdemeleri();
  console.log(`  ${kol.ad} (doz ${son}): ${ode.length} odeme · toplam ${tl(s.odenen)} ₺`);
  for (const p of ode) console.log(`      @ ${sa(p.t).padStart(7)}  ${Math.round(p.tutar).toLocaleString('tr-TR').padStart(9)} ₺`);
}
console.log('');

/* ── DAMGALAR ──────────────────────────────────────────────────────────────────────── */
for (const ad of Object.keys(HEDEF_KOLLARI)) {
  const kol = HEDEF_KOLLARI[ad];
  const son = kol.dozlar[kol.dozlar.length - 1];
  const uc = satirlar.filter((r) => r.kol.ad === ad).pop()!;
  if (kol.atilBeklenir) {
    // h0: BULGUNUN KENDISI atil kalmasidir — elmas odulu tempoya dokunmaz. Damga bu kez farki
    // degil AYNILIGI arar: biri elmasi tempoya baglarsa (D5 Usta katmani) bu damga kirilir ve
    // rapordaki hukum yeniden okunmak zorunda kalir.
    damga(`${kol.ad} ATIL kaldi (beklenen)`, uc.s.iz === taban.iz, `iz ${uc.s.iz} != taban ${taban.iz}`);
    continue;
  }
  varyantDamgasi(`${kol.ad} (en uc doz)`, taban.iz, uc.s.iz);
  // C4 tuzagi ②'nin bu turdaki karsiligi: kanca hic tetiklenmediyse satir olcum degil, tabanin
  // kopyasidir. `odenen === 0` bunu tek basina yakalar (iz damgasi kacirsa bile).
  damga(`${kol.ad} odeme dustu (doz ${son})`, uc.s.odenen > 0, 'hedef akisi hic tetiklenmedi');
}

kolaGec(null, 0);
const kontrol = olc();
damga('taban geri donusu', kontrol.iz === taban.iz, `iz ${kontrol.iz} != ${taban.iz} — hedefAkisiAyarla(null) eksik`);
damga('taban odeme yok', kontrol.odenen === 0, `${kontrol.odenen} ₺ — kanca kapaliyken odeme dusmus`);
damga('taban ihlal 6 (Normal)', taban.o.normalAsan === 6, `${taban.o.normalAsan} (D-086 Bulgu 7'de 6 idi)`);
damga('taban hukum 1 (Idealize)', taban.o.idealAsan <= 1, `${taban.o.idealAsan} (D-087'de 1 idi)`);
damgaOzeti();
