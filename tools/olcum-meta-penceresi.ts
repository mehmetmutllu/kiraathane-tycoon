/**
 * olcum-meta-penceresi.ts — D9: META KATMANIN YIĞINI, ilk kez AYNI KOŞUDA.
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-meta-penceresi.ts > docs/olcum-meta-penceresi.txt
 *        (OLCUM verilmezse KISA koşar — ikili birleşimler düşer, rapora GİRMEZ.)
 *
 * SORU — beş turdur açık duran D-087 kalemi budur. Faz D üç kanat ekledi:
 *   H  hedef koleksiyonunun KALICI GELİR ÇARPANI          (D-090 · `hUYGF`)
 *   R  İtibar'ın TAŞIMA çarpanı                            (D-092 · `rUYG`)
 *   E  Usta katmanı + günlük görev 💎 arzı                  (D-093/094 · `eUYG`)
 * Ama her tur ötekilerin kancasını KAPATTI: D6 hedef çarpanını kapatarak ölçtü, D7 Usta'yı
 * H+R açıkken ölçtü, D3b/D4 İtibar yokken ölçtü. Yani BUGÜNKÜ OYUNUN — üçü birden açık —
 * tempo penceresi hiçbir tabloda YOK. Bu araç o satırı üretir.
 *
 * NEDEN YIĞIN OLARAK: D-090 Bulgu 10 ("uygulanan hâl knob'ların toplamı çıkmadı") D-093'te
 * ÜÇÜNCÜ kez tekrarlandı. Aynı toplanamama bir kat yukarıda, KATMANLAR arasında da olabilir —
 * ve olursa üç turun ayrı ayrı ölçtüğü kazanç bugün yürürlükte DEĞİLDİR. Varsayılmaz, ölçülür:
 * yedi bileşim (H · R · E · HR · HE · RE · HRE) tabanla birlikte tek koşuda okunur.
 *
 * NE ÖLÇÜYOR — altı kolon birden okunmadan karar verilemez:
 *   1) HÜKÜM    İdealize profilde 20 dk'yı aşan alım (D-087: hüküm profili budur) + en uzunu.
 *   2) GÖZLEM   Normal profildeki aynı iki sayı — D1'den beri tabloların okunduğu bant.
 *   3) ŞERİT    Zincirin uzunluğu = Kat 1 içeriğinin ömrü. D-092'nin BİLEREK ödediği %15,5'lik
 *               borç bu kolonda tartılır; eleme eşiği %7 (D1), aşan satır gerekçe ister.
 *   4) AÇILIŞ   D-079'un üç ölçütü — meta katman erken oyuna sızmış mı (D4'te `hG` buradan
 *               elenmişti: otomasyon 6,1 → 1,7 dk).
 *   5) TOPLAM   Ölçülen HRE ile "parçaların toplamı" tahmininin FARKI (§4). Turun asıl sorusu.
 *   6) KELEPÇE  Darboğazın zamandaki dağılımı — yığın kelepçeyi taşımadan aldı mı (D6: %93,0).
 *
 * DAMGALAR: (a) M0 tabanı D1'in ölçtüğü dünya olmalı (`normalAsan === 6`) — kırılırsa D1'den
 * beri sim'in TABANI kaymıştır ve bu turun kıyas noktası bayattır; (b) her tekil katman tabanın
 * izini KIMILDATMALI (yoksa satır ölçüm değil, tabanın kopyasıdır — C4 tuzağı ②); (c) HRE izi
 * her tekil katmandan AYRI olmalı; (d) E açıkken en az bir Usta ALINMIŞ olmalı ve 💎 korunumu
 * sıfır sapmalı; (e) tur sonunda taban geri gelmeli (kanca sızıntısı yok).
 */
import {
  olcutler, onbellekTemizle, milestoneTazele, m1Ayarla,
  modelDebisi, GERCEK, kolAyarla, VARSAYILAN, hedefAkisiAyarla, hedefCarpaniAyarla,
  itibarAyarla, ustaAyarla, darbogazDagilimi,
  type Olcut, type Bosluk,
} from './simulate.ts';
import { HEDEF_KOLLARI } from './hedef-kollari.ts';
import { ITIBAR_KOLLARI, kayitSifirla as itibarKayitSifirla } from './itibar-kollari.ts';
import {
  USTA_KOLLARI, kayitSifirla as ustaKayitSifirla, sonKosuAlimlari, sonKosuElmasi,
  korunumSapmasi,
} from './usta-kollari.ts';
import { KISA, kipBandi, damga, damgaOzeti, varyantDamgasi, izOlustur } from './olcum-lib.ts';

const dk = (x: number) => (Number.isFinite(x) ? `${(x / 60).toFixed(1)} dk` : '—');
const sa = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${(x / 3600).toFixed(2)} sa` : '—');
const sn = (x: number | undefined) => (x != null && Number.isFinite(x) ? `${x.toFixed(0)} sn` : '—');
const yuzde = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;

/** Bir satırın kimliği: hangi kancalar açık. */
interface Kat { ad: string; h: boolean; r: boolean; e: boolean }
const KAT = (ad: string, h: boolean, r: boolean, e: boolean): Kat => ({ ad, h, r, e });

/**
 * Dünyayı verilen katman bileşimine kurar. Her satırdan ÖNCE çağrılır; kapalı kanca `null`
 * verilir ki taban çıktısı BİREBİR korunsun (kancaların hepsi "null → hiç hesap yapma" sözü
 * veriyor; damga (b)/(e) o sözü bu turda da sınar).
 *
 * `hedefAkisiAyarla` her satırda KAPALI: D-090'da hedeflerin ₺ akışı tamamen kalktı, bugün
 * ödenen tek şey kalıcı çarpandır. Açık bırakmak yürürlükte olmayan bir ödülü ölçerdi.
 */
function kataGec(k: Kat): void {
  itibarKayitSifirla();
  ustaKayitSifirla();
  hedefAkisiAyarla(null);
  hedefCarpaniAyarla(k.h ? HEDEF_KOLLARI.hUYGF.carpanFabrika!(1) : null);
  itibarAyarla(k.r ? ITIBAR_KOLLARI.rUYG.fabrika(1) : null);
  ustaAyarla(k.e ? USTA_KOLLARI.eUYG.fabrika(1) : null);
  m1Ayarla(false);
  onbellekTemizle();
  milestoneTazele();
}

function iz(bosluklar: Bosluk[]): string {
  const h = izOlustur();
  for (const b of bosluklar) h.ekle(b.t, b.gap);
  return h.deger;
}

interface Sonuc {
  o: Olcut;
  iz: string;
  sapma: number;
  /** E açıkken: alınan Usta sayısı + 💎 defterinin korunum sapması. */
  alim: number;
  korunum: number;
  kalanElmas: number;
}

function olc(): Sonuc {
  const o = olcutler();
  const sapmalar = GERCEK.map((g) => Math.abs(modelDebisi(g) - g.olculen) / g.olculen);
  const e = sonKosuElmasi();
  return {
    o,
    iz: iz(o.bosluklarNormal),
    sapma: sapmalar.reduce((a, b) => a + b, 0) / sapmalar.length,
    alim: sonKosuAlimlari().length,
    korunum: korunumSapmasi(),
    kalanElmas: e.kalan,
  };
}

kipBandi();
console.log('=== D9 — META KATMANIN YIGINI: uc kanat ilk kez AYNI kosuda ===');
console.log('');
console.log('Model: D-086 yururlukteki model (k1b + k2). economy.config.ts DOSYASI DEGISMEDI —');
console.log('uc katman da sim`in KANCALARINA takilir (hedef carpani · itibar · usta).');
console.log('');
console.log('KATMANLAR:');
console.log('  H = hedef koleksiyonunun KALICI gelir carpani   (D-090 · hUYGF)');
console.log('  R = Itibar`in TASIMA carpani                     (D-092 · rUYG)');
console.log('  E = Usta katmani + gunluk gorev 💎 arzi          (D-093/094 · eUYG)');
console.log('  M0  = ucu de KAPALI — D1`in tabani, tum tablonun kiyas noktasi.');
console.log('  HRE = ucu de ACIK — **YURURLUKTEKI OYUN**, bugune dek hicbir tabloda yok.');
console.log('');
console.log('MODEL SINIRI (rapora aynen gecer):');
console.log('  1) Her katman kendi turunun MODEL SINIRLARINI beraberinde getirir: H 4/5 kategori');
console.log('     modelliyor (alt sinir) · R`nin XP`si turetiliyor ve perDishWashed=0 (alt sinir)');
console.log('     · E`nin 12 sa penceresi yarim gun (gunluk arz kucuk kalir) ve odul ANINDA');
console.log('     harcanir (ust sinir). Yigin bu sinirlarin BILESIMIDIR, daha dar degil.');
console.log('  2) Hedeflerin ₺ AKISI her satirda kapali (D-090`da kalkti).');
console.log('  3) HUKUM profili IDEALIZE (D-087); Normal satiri GOZLEM bandidir.');
console.log('');

kolAyarla(VARSAYILAN);

/* ── SATIRLAR ──────────────────────────────────────────────────────────────────────── */
const TEKIL = [KAT('H', true, false, false), KAT('R', false, true, false), KAT('E', false, false, true)];
const IKILI = [KAT('HR', true, true, false), KAT('HE', true, false, true), KAT('RE', false, true, true)];
const HEPSI = KAT('HRE', true, true, true);
// Kisa kosuda ikili birlesimler duser: onlar KAYBIN NEREDE oldugunu adresler, VARLIGINI degil.
const SATIRLAR = KISA ? [...TEKIL, HEPSI] : [...TEKIL, ...IKILI, HEPSI];

const M0 = KAT('M0', false, false, false);
kataGec(M0);
const m0 = olc();
const m0Kelepce = darbogazDagilimi(0.55);

const olculen = new Map<string, Sonuc>();
for (const k of SATIRLAR) {
  kataGec(k);
  olculen.set(k.ad, olc());
}

/* ── §1 TABLO ──────────────────────────────────────────────────────────────────────── */
const bas = 'kol | H R E | HUKUM(ideal)   | GOZLEM(normal) | ilk alim | acilis | otom.  | SERIT   | dSERIT | sapma';
console.log('--- §1 KATMAN BILESIMLERI: hukum · gozlem · zincir · acilis ---');
console.log('  acilis olcutleri (D-079): ilk alim < 90 sn · acilis enUzun <= 2 dk · otomasyon < 15 dk');
console.log('  dSERIT = zincirin M0`a gore uzama/kisalma orani. Eleme esigi %7 (D1); asan satir gerekce ister.');
console.log('');
console.log(bas);
console.log('-'.repeat(bas.length));

function satirYaz(ad: string, k: Kat | null, s: Sonuc): void {
  const bayrak = k ? `${k.h ? 'H' : '·'} ${k.r ? 'R' : '·'} ${k.e ? 'E' : '·'}` : '· · ·';
  const hukum = `${String(s.o.idealAsan).padStart(2)} · ${dk(s.o.idealEnUzun).padStart(7)}`;
  const gozlem = `${String(s.o.normalAsan).padStart(2)} · ${dk(s.o.normalEnUzun).padStart(7)}`;
  const dSerit = s.o.serit != null && m0.o.serit != null ? yuzde((s.o.serit - m0.o.serit) / m0.o.serit) : '—';
  console.log(
    ad.padEnd(3) + ' | ' + bayrak + ' | ' + hukum.padEnd(14) + ' | ' + gozlem.padEnd(14) +
    ' | ' + sn(s.o.ilkAlim).padStart(8) + ' | ' + dk(s.o.acilisEnUzun).padStart(6) +
    ' | ' + dk(s.o.otomasyon ?? NaN).padStart(6) + ' | ' + sa(s.o.serit).padStart(7) +
    ' | ' + dSerit.padStart(6) + ' | ' + `%${(s.sapma * 100).toFixed(0)}`.padStart(5),
  );
}

satirYaz('M0', null, m0);
for (const k of SATIRLAR) satirYaz(k.ad, k, olculen.get(k.ad)!);
console.log('');

/* ── §2 KALAN IHLALLER ─────────────────────────────────────────────────────────────── */
console.log('--- §2 HANGI ALIMLAR 20 dk`yi ASIYOR (Normal gozlem bandi) ---');
const ihlalYaz = (ad: string, s: Sonuc) => {
  const l = s.o.asanlar.map((a) => `${dk(a.gap)} -> ${a.label}`).join(' · ') || 'yok';
  console.log(`  ${ad.padEnd(4)} ${l}`);
};
ihlalYaz('M0', m0);
for (const k of SATIRLAR) ihlalYaz(k.ad, olculen.get(k.ad)!);
console.log('');

/* ── §3 IDEALIZE HUKUM AYRINTISI ───────────────────────────────────────────────────── */
console.log('--- §3 HUKUM (Idealize profil, D-087): en uzun bekleme hangi basamakta ---');
console.log(`  M0   ${String(m0.o.idealAsan).padStart(2)} asan · en uzun ${dk(m0.o.idealEnUzun)} -> ${m0.o.idealEnUzunEtiket}`);
for (const k of SATIRLAR) {
  const s = olculen.get(k.ad)!;
  console.log(`  ${k.ad.padEnd(4)} ${String(s.o.idealAsan).padStart(2)} asan · en uzun ${dk(s.o.idealEnUzun)} -> ${s.o.idealEnUzunEtiket}`);
}
console.log('');

/* ── §4 TOPLANABILIRLIK — TURUN ASIL SORUSU ────────────────────────────────────────── */
/* D-090 Bulgu 10 knob'lar arasinda "toplam != parcalarin toplami" dedi. Ayni sinav KATMANLAR
 * arasinda: her katmanin M0'a gore TEK BASINA kazanci toplanip olculen HRE ile kiyaslanir.
 * Fark POZITIFse katmanlar birbirini yiyor (yigin vaat edilenden az veriyor); NEGATIFse
 * birbirini besliyor. Ikisi de karar paketine ayni agirlikta girer. */
console.log('--- §4 TOPLANABILIRLIK: yigin, parcalarinin toplami mi? ---');
const hre = olculen.get('HRE')!;
function toplanabilirlik(ad: string, oku: (s: Sonuc) => number, bic: (x: number) => string): void {
  const taban = oku(m0);
  const tekilDelta = TEKIL.map((k) => oku(olculen.get(k.ad)!) - taban);
  const beklenen = taban + tekilDelta.reduce((a, b) => a + b, 0);
  const gercek = oku(hre);
  console.log(`  ${ad}`);
  console.log(`     M0 ${bic(taban)} · tekil delta ${TEKIL.map((k, i) => `${k.ad} ${bic(tekilDelta[i])}`).join(' · ')}`);
  console.log(`     BEKLENEN (toplanir) ${bic(beklenen)} · OLCULEN HRE ${bic(gercek)} · FARK ${bic(gercek - beklenen)}`);
}
toplanabilirlik('en uzun bekleme (Normal)', (s) => s.o.normalEnUzun, (x) => `${(x / 60).toFixed(1)} dk`);
toplanabilirlik('ihlal sayisi (Normal)', (s) => s.o.normalAsan, (x) => x.toFixed(0));
toplanabilirlik('ihlal sayisi (Idealize · HUKUM)', (s) => s.o.idealAsan, (x) => x.toFixed(0));
toplanabilirlik('SERIT (zincir omru)', (s) => s.o.serit ?? NaN, (x) => `${(x / 3600).toFixed(2)} sa`);
console.log('');

/* ── §5 KELEPCE ────────────────────────────────────────────────────────────────────── */
/* D6 kelepcenin zamanin %93,0'inde TASIMADA oldugunu olctu ve D-092 tam oraya odedi. Yigin
 * acikken kelepce YER DEGISTIRDI mi — yani bir sonraki turun kolu hangi kanalda? */
console.log('--- §5 KELEPCE: darbogazin zamandaki dagilimi (Normal profil) ---');
kataGec(HEPSI);
const hreKelepce = darbogazDagilimi(0.55);
/* `darbogazDagilimi` HAM tick sayisi dondurur, oran degil — kendi toplamiyla normalize edilir.
 * Kosu uzunlugu satirdan satira degistigi icin (SERIT kisaliyor) her dagilim KENDI toplamina
 * bolunur: okunan sey "zamanin % kacinda bu kanal baglayiciydi". */
const kanallar = [...new Set([...Object.keys(m0Kelepce), ...Object.keys(hreKelepce)])];
const topla = (d: Record<string, number>) => Object.values(d).reduce((a, b) => a + b, 0);
const m0Top = topla(m0Kelepce);
const hreTop = topla(hreKelepce);
console.log(`  toplam tick: M0 ${m0Top.toFixed(0)} · HRE ${hreTop.toFixed(0)}`);
console.log('  kanal      | M0     | HRE    | fark');
for (const c of kanallar) {
  const a = m0Top > 0 ? (m0Kelepce[c] ?? 0) / m0Top : 0;
  const b = hreTop > 0 ? (hreKelepce[c] ?? 0) / hreTop : 0;
  console.log(`  ${c.padEnd(10)} | ${`%${(a * 100).toFixed(1)}`.padStart(6)} | ${`%${(b * 100).toFixed(1)}`.padStart(6)} | ${yuzde(b - a).padStart(7)}`);
}
console.log('');

/* ── §6 ELMAS DEFTERI (E acik satirlar) ────────────────────────────────────────────── */
console.log('--- §6 USTA ALIMI: E acik satirlarda kac Usta alindi (12 sa, Normal) ---');
for (const k of SATIRLAR.filter((x) => x.e)) {
  const s = olculen.get(k.ad)!;
  console.log(`  ${k.ad.padEnd(4)} alim ${String(s.alim).padStart(2)} · kalan ${s.kalanElmas.toFixed(1).padStart(5)} 💎 · korunum sapmasi ${s.korunum.toFixed(6)}`);
}
console.log('');

/* ── DAMGALAR ──────────────────────────────────────────────────────────────────────── */
// (a) Kiyas noktasi bayat mi? D1 bu dunyada 6 ihlal olcmustu; kirilirsa TABAN kaymistir.
damga('M0 = D1 tabani (ihlal 6)', m0.o.normalAsan === 6,
  `${m0.o.normalAsan} olculdu — D1'den beri sim'in tabani kaydi, kiyas bayat`);
// (b) Her tekil katman dunyayi KIMILDATMALI.
for (const k of TEKIL) varyantDamgasi(`katman ${k.ad}`, m0.iz, olculen.get(k.ad)!.iz);
// (c) Yigin her tekil katmandan AYRI olmali (yoksa bir katman otekileri yutuyor demektir ve
//     bu bir olcum degil, kanca sirasinin hatasi olabilir).
for (const k of TEKIL) varyantDamgasi(`HRE != ${k.ad}`, olculen.get(k.ad)!.iz, hre.iz);
// (d) E acik satirlarda Usta ALINMALI + 💎 korunumu sifir.
for (const k of SATIRLAR.filter((x) => x.e)) {
  const s = olculen.get(k.ad)!;
  damga(`Usta alindi (${k.ad})`, s.alim > 0, 'hic Usta alinmadi — satir olcum degil');
  damga(`elmas korunumu (${k.ad})`, s.korunum === 0, `${s.korunum} birim sapma`);
}
// (e) Kanca sizintisi yok: tur sonunda taban geri gelmeli.
kataGec(M0);
const geri = olc();
damga('taban geri donusu', geri.iz === m0.iz, `iz ${geri.iz} != ${m0.iz} — kanca sizintisi`);
damgaOzeti();
