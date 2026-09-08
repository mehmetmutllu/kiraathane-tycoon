/**
 * simulate.ts — Ekonomi v2 (D-010) BOTTLENECK modelini simüle eder ve her kilometre
 * taşına ~ne kadar sürede ulaşıldığını yazar. Dengeleme için config sayıları oynanıp
 * tekrar çalıştırılır.
 *
 * Çalıştır:  npx tsx tools/simulate.ts   (veya)  node --import tsx tools/simulate.ts
 *
 * Model (B2 — TEK SERVİS): gelir = min(talep, arz) × (ortalama fiyat + bahşiş) × VERİM.
 *   - talep = tüm açık masaların koltukları / döngü   (kat tek noktadan beslenir)
 *     B5a: koltuk sayısı masa TİPİNDEN okunur (dörtlü 1/2/2/4/4 · banket ikilisi 1/2/2/2/2) —
 *     `masa × tableSeats(lvl)` çarpımı orta şerit 12 ikiliye çıkınca talebi ~2 kat abartırdı.
 *   - arz   = 1 / hazırlamaSüresi                    (tek servis noktası, kendi seviyesi)
 *   - ÜRÜN KARIŞIMI: L5'ten sonra müşterilerin `tostShare(level)` kadarı tost ister → hem fiyat
 *     hem hazırlama süresi ağırlıklı ortalamayla girer (rules.ts incomeRate ile AYNI formül).
 *   - VERİM (profil): idealize tavanın oyuncu tarafından gerçeklenen oranı.
 *     Sim eski sürümde hep 1.0 (idealize) idi; 3-profil raporu için parametre oldu.
 *     VARSAYILAN ÇIKTI yine 1.0 → "ilk-alım 60sn" denetimi DEĞİŞMEDİ.
 *
 * NOT (D-011): manuel tepsi servisi/bardak döngüsü gerçek-zamanlı darboğazlar idealize modellenmez;
 * VERİM çarpanı bu kayıpların toplamını temsil eder (profil gerekçeleri docs/curve-report.md).
 */
import {
  economyConfig as C,
  upgradeCost,
  upgradeOutputMultiplier,
  requiresMet,
  tableUpgradeCost,
  tableTip,
  tableSeats,
  charNextCost,
  lavaboIncomePerCustomer,
  lavaboUpgradeCost,
  lavaboMaxLevel,
  waiterTrayNextCost,
  waiterSpeedNextCost,
  dishCarryNextCost,
  dishCarryCapacityFor,
  dishSpeedNextCost,
  dishSpeedFor,
  PRODUCTS,
  type GateState,
  type QuestTarget,
} from '../src/config/economy.config.ts';
import { deriveWorld, tostShare, THE_SERVICE, MAX_SERVICES } from '../src/game/world.ts';
import { getNavGrid, servicePlace, LAYOUT, REACH_TABLE, REACH_PICKUP, reachWash } from '../src/game/layout.ts';

type Vec3n = readonly [number, number, number];
import { findNavPath } from '../src/game/nav.ts';
import { pathToFileURL } from 'node:url';

const DT = 1; // saniyelik adım

/* ═══ D-087 — DÖRDÜNCÜ TEMPO ÖLÇÜTÜNÜN PROFİLİ SABİTLENDİ ═══════════════════════════════
 * D-010 §3.6'nın "20 dk'yı aşan tek alım kalmasın" ölçütü, hangi PROFİLDE okunacağı hiç
 * yazılmadan yaşadı; araç onu Normal'de (verim 0,55) basıyordu, oysa KARDEŞ ÜÇ ÖLÇÜT
 * (ilk alım · açılış boşluğu · otomasyon) İDEALİZE'de (verim 1,0) okunuyor. D1 turu bunu
 * ölçtü: aynı eğri İdealize'de 1, Yoğun'da 1, Normal'de 6, Rahat'ta 11 ihlal veriyor —
 * yani "hüküm" tamamen okunan profile bağlıydı (`docs/gec-oyun-raporu-d1.md` Bulgu 1).
 * Karar: ölçüt kardeşleriyle AYNI profilde hüküm verir. Normal/Rahat sayıları silinmez,
 * HÜKÜMSÜZ GÖZLEM BANDI olarak basılır — geç oyunun gerçek maliyeti görünür kalsın diye.
 * Ekonomiye dokunulmadı: D1'de ölçülen düzeltici kolların hepsi Kat 1 içeriğinden %7-42
 * götürüyordu ve o pencereleri dolduracak katman (Faz D meta) henüz yok. */
const BEKLEME_SINIRI = 20 * 60;
/** D-078'in BİLEREK bıraktığı tek basamak (`servis L6`) hükümde sayılmaz → hedef ≤ 1. */
const BEKLEME_IZIN = 1;
/** Hükmün okunduğu profil (kardeş üç ölçütle aynı): İDEALİZE. */
const OLCUT_VERIM = 1;
const TEA_PRICE = C.service.basePrice;
/* D1: bu iki tavan eskiden modül yükleme anında SABİTLENİYORDU. `DENGE` kolu merdivenin
 * basamağını değiştirebildiği için artık her okumada config'ten türer — yoksa varyant
 * uygulanır ama sim eski tavanı kullanır ve ölçüm sessizce yalan söyler. */
const softMax = () => C.service.upgrade.maxLevel; // ₺ ile çıkılabilen en yüksek seviye
const tableSoftMax = () => C.tables.upgrade.maxLevel;

/* ═════════════ C5 — MODEL KOLLARI (simulate.ts'i gerçeğe yaklaştırma) ═════════════
 * C1/C3 dört kusur saydı; her biri AYRI KOL olarak ölçülür, hiçbiri "zaten doğrudur"
 * diye kalıcı yazılmaz (varyant kapısı). `SIMKOL=<ad>` ile seçilir; verilmezse TABAN —
 * taban çıktısı eski çıktının BİREBİR aynısı olmak zorundadır (bekçi bunu denetler).
 *
 *   k1a  TAŞIMA · ölçülen realizasyon oranı — `olcum-kuyruk.ts`in bastığı "gerçekleşen %"
 *        doğrudan çarpan olur. Kalibre ama KÖR: kaybın taşımadan mı, demlemeyi beklemekten
 *        mi geldiğini ayırt etmez (sim'de arz zaten ayrı bir kol → çifte sayma riski).
 *   k1b  TAŞIMA · çok duraklı tur — modelin gerçek kusuru: N bardaklık tepsiyi ORTALAMA
 *        mesafedeki TEK masaya götürüp dönüyor sayıyor. Gerçekte N bardak N ayrı masaya
 *        gider. Tur = git + (N-1)×masalar-arası + dön. Sihirli sayı yok, mesafe BFS'ten.
 *   k2   MASA YÜKSELTMESİ KALEM KALEM — sim 20 masayı tek kalemde alıyor (sahte 21,4 dk).
 *   k3   BARDAK TAVANI — bardak KAPALI sistem (D-082/D-083): temiz bardağın tek kaynağı
 *        yıkamadır. Modelde dördüncü tavan hiç yoktu.
 *   k4   SABIR — terk modelde hiç yok; sabrı aşan bekleme parasını ödemez.
 */
export interface ModelKollari { k1a: boolean; k1b: boolean; k2: boolean; k3: boolean; k4: boolean }
const KOL_KAPALI: ModelKollari = { k1a: false, k1b: false, k2: false, k3: false, k4: false };
/** D-086 ile YÜRÜRLÜKTEKİ model: k1b (çok duraklı tur) + k2 (masa kalem kalem). */
export const VARSAYILAN: Partial<ModelKollari> = { k1b: true, k2: true };
let M: ModelKollari = { ...KOL_KAPALI, ...VARSAYILAN };
export const kolAyarla = (k: Partial<ModelKollari>): void => { M = { ...KOL_KAPALI, ...k }; };

/* ── D1 MODEL KOLU (m1) — "TAŞIMA darboğazken oyuncu TAŞIYICIYI yükseltir" ──────────────
 * Sim'in oyuncusu garson tepsisini/hızını YALNIZ görev hattı istediğinde alıyor. Hat
 * `waiterSpeed t1` + `waiterTray t1,t2`de bitiyor; üçüncü tepsi kademesi (₺2.500 → tepsi 4)
 * hiçbir koşuda satın alınmıyor — oysa 8 masadan sonra bağlayıcı kol HEP taşıma ve oyunda o
 * kademe karakter panelinden alınabiliyor. Yani "taşıma tavanını açan bir kaldıraç tempoyu
 * değiştirmiyor" sonucu bir oyun gerçeği değil, modelin kendi kör noktasıydı.
 * Kural, servis merdiveni (`stationBottleneck`) ve bulaşıkçı (k3) için ZATEN yazılı olanın
 * aynısı: darboğaz olan kolu yükselt. Ayrı kol olarak ölçülür, kalıcı yazılmaz. */
export let m1: boolean = false;
export const m1Ayarla = (v: boolean): void => { m1 = v; };

/** Kol adı → bayraklar. `hepsi` kolların birbirini gizleyip gizlemediğini gösterir. */
export const KOLLAR: Record<string, Partial<ModelKollari>> = {
  /** C5 ÖNCESİ model — ölçüm turunun tabanı. Silinmedi: bekçi "yeni model eskisinden gerçekten
   *  daha yakın mı" sorusunu ancak eskisini koşturabildiği sürece sorabilir. */
  eski: {},
  taban: {},
  k1a: { k1a: true },
  k1b: { k1b: true },
  k2: { k2: true },
  k3: { k3: true },
  k4: { k4: true },
  // `hepsi` k1'in İKİ kolundan yapısal olanı alır (k1a ile k1b aynı kaybı iki kez sayardı).
  hepsi: { k1b: true, k2: true, k3: true, k4: true },
  // UYGULANAN kol (D-086). Kendi başına bir varyanttır: uygulanacak birleşim, uygulanmadan
  // ÖNCE ölçülür — "iki kol tek tek iyiydi, birlikte de iyidir" bir varsayımdır.
  secilen: { k1b: true, k2: true },
};

// D-015: masa/servis ayrı tutulmaz; padsDone'dan türetilir (store ile aynı kaynak — world.ts).
interface State {
  t: number;
  wallet: number;
  lifetime: number;
  stationLevels: number[]; // servis noktasının seviyesi (B2: tek eleman)
  tableLevel: number; // idealize kol: tüm masalar eşit yükseltilir (k2 kapalıyken tek kaynak)
  /** K2 — masa BAŞINA seviye. Oyunda her masanın kendi yükseltme noktası var (D-019);
   *  sim 20 masayı TEK kalemde alıyordu ve C1'de bunun sahte bir 21,4 dk bekleme ürettiği
   *  ölçülmüştü. Kol kapalıyken dizi küresel seviyenin kopyasıdır → taban çıktısı korunur. */
  tableLevels: number[];
  padsDone: string[];
  /** Karakter kademeleri (v20): quest hattındaki alımlar simüle edilir (T1/T2/M1). */
  char: { tray: number; magnet: number; speed: number };
  /** Personel kademeleri — B2'de gerçekten SATIN ALINIR (eski sim bunları bedava sayıyordu). */
  waiterTray: number;
  waiterSpeed: number;
  /** Bulaşıkçı kademeleri (leğen/hız) — oyunda karakter panelinden ALINIR; sim hiç almıyordu
   *  ve bu yüzden K3 bulaşıkçıyı sonsuza dek kademe 0'da sayıyordu (rapor Bulgu 5 ②). */
  dishCarry: number;
  dishSpeed: number;
  /** Görev hattı index'i (M1 ödülleri): tamamlanan görev cüzdana reward ekler. */
  questIdx: number;
  /** ODA: lavabo seviyesi (B4; 0 = kapalı). Pad açılışı 1, kalanı yükseltme noktasından. */
  lavabo: number;
}

/** Görev hedefi sim durumunda karşılandı mı? Sayaç görevleri (öğretici) + sim'de modellenmeyen
 *  waiterLevel/tableLevel İDEALİZE tamam sayılır (oyuncu görev hattını takip eder; maliyetleri
 *  küçük — 250/60₺ — tempo ölçümünü bozmaz). */
function questMetSim(s: State, t: QuestTarget): boolean {
  switch (t.type) {
    case 'pad': return s.padsDone.includes(t.id);
    case 'stationLevel': return s.stationLevels[THE_SERVICE] >= t.level;
    case 'charStat': return s.char[t.stat] >= t.tier;
    case 'waiterTray': return s.waiterTray >= t.tier;
    case 'waiterSpeed': return s.waiterSpeed >= t.tier;
    // `tableLevel` = "bir masan bu seviyede mi" (en YÜKSEK) · `tablesAtLevel` = "hepsi" (en DÜŞÜK).
    // Kol kapalıyken ikisi de küresel seviyeye eşittir → taban davranışı korunur.
    case 'tableLevel': return tlMax(s, deriveWorld(s.padsDone)) >= t.level;
    case 'lavaboLevel': return s.lavabo >= t.level;
    case 'tablesAtLevel': return tlMin(s, deriveWorld(s.padsDone)) >= t.level;
    // Sayaç görevleri (çay al / servis et / para topla / bulaşık yıka) oynanışla dolar — para
    // harcamaz, tempoyu geciktirmez; idealize modelde ANINDA tamam sayılır.
    default: return true;
  }
}

/* ── D3 HEDEF AKIŞI KANCASI (varyant katmanı; `economy.config.ts` DEĞİŞMEZ) ─────────────
 * Hedefler (koleksiyon) ₺ ödülü verecekse bu bir DENGE sayısıdır ve varyant kapısı devrededir:
 * kol önce ölçülür, config'e yazılmaz. Sim'in bildiği tek şey "şu an ne kadar ₺ düştü" —
 * kademelerin kendisi `tools/hedef-kollari.ts`te durur, bu dosya onları tanımaz.
 *
 * MODEL SINIRI (rapora yazılır): ödül DÜŞER DÜŞMEZ cüzdana geçer. Gerçekte oyuncu paneli açıp
 * "Al"a basana kadar bekler; yani buradan çıkan etki bir ÜST SINIRdır. Üst sınır bile küçükse
 * kol güvenle elenir — büyükse gecikme ayrıca konuşulur.
 *
 * Taban `null`: kanca kapalıyken tek bir toplama bile yapılmaz → taban çıktısı BİREBİR korunur.
 */
export interface HedefDurum {
  t: number;
  lifetime: number;
  padSayisi: number;
  /** Son seviyeye çıkmış masa sayısı — "Usta" kategorisinin sayacı. */
  ustaMasa: number;
}
/** Bir koşunun ödeyicisi: her tick çağrılır, o tick düşen ₺'yi döndürür (yoksa 0). */
export type HedefOdeyici = (d: HedefDurum) => number;
let hedefFabrika: (() => HedefOdeyici) | null = null;
/** Her PROFİL koşusu taze bir ödeyici ister (kademeler koşu başına sıfırlanır) — bu yüzden
 *  ödeyici değil FABRİKA verilir. `null` = kanca kapalı. */
export const hedefAkisiAyarla = (f: (() => HedefOdeyici) | null): void => { hedefFabrika = f; };

/** Tamamlanan görevlerin ödüllerini öde (M1) — store'daki quest-advance döngüsünün sim karşılığı. */
function advanceQuests(s: State): void {
  while (s.questIdx < C.quests.length && questMetSim(s, C.quests[s.questIdx].target)) {
    const r = C.quests[s.questIdx].reward ?? 0;
    s.wallet += r;
    s.lifetime += r;
    s.questIdx += 1;
  }
}

function gateOf(s: State): GateState {
  return {
    padsDone: s.padsDone,
    tables: deriveWorld(s.padsDone).tables.length,
    stationLevel: s.stationLevels[0],
    lifetime: s.lifetime,
  };
}

/** Seviyedeki ORTALAMA ürün (tost payına göre ağırlıklı fiyat + hazırlık süresi). */
function mixAt(level: number): { price: number; prepTime: number } {
  const p = tostShare(level);
  return {
    price: (1 - p) * PRODUCTS.tea.price + p * PRODUCTS.tost.price,
    prepTime: (1 - p) * PRODUCTS.tea.prepTime + p * PRODUCTS.tost.prepTime,
  };
}

type Dunya = ReturnType<typeof deriveWorld>;

/** Masa seviyesi dizisini açık masa sayısına eşitler.
 *  Kol KAPALI: yeni masa mevcut küresel seviyeyle doğar — `openSeats`in tek seviyeyi tüm
 *  masalara uyguladığı taban davranışının birebir karşılığı.
 *  Kol AÇIK: yeni masa L0 doğar — oyunda yeni açılan masa yükseltilmemiştir. */
function seviyeleriEsitle(s: State, w: Dunya): void {
  const n = w.tables.length;
  while (s.tableLevels.length < n) s.tableLevels.push(M.k2 ? 0 : s.tableLevel);
  if (!M.k2) for (let i = 0; i < s.tableLevels.length; i++) s.tableLevels[i] = s.tableLevel;
  if (s.tableLevels.length > n) s.tableLevels.length = n;
}

/** En DÜŞÜK masa seviyesi — "tüm masalar L≥x" anlamındaki kapılar/görevler bunu okur. */
const tlMin = (s: State, w: Dunya): number =>
  w.tables.length === 0 ? s.tableLevel : Math.min(...s.tableLevels.slice(0, w.tables.length));
/** En YÜKSEK masa seviyesi — "oyuncu ilk bahşiş yükseltmesini aldı mı" bunu okur. */
const tlMax = (s: State, w: Dunya): number =>
  w.tables.length === 0 ? s.tableLevel : Math.max(...s.tableLevels.slice(0, w.tables.length));

/** Açık masaların TOPLAM koltuğu — her masa kendi tipinin merdivenini VE kendi seviyesini okur. */
function openSeats(w: Dunya, s: State): number {
  seviyeleriEsitle(s, w);
  let n = 0;
  for (let i = 0; i < w.tables.length; i++) n += tableSeats(s.tableLevels[i], w.tables[i].kind);
  return n;
}

/** Koltuk-ağırlıklı ORTALAMA bahşiş. Kol kapalıyken tüm seviyeler eşit → `tableTip(tableLevel)`. */
function ortBahsis(w: Dunya, s: State): number {
  seviyeleriEsitle(s, w);
  let toplam = 0, koltuk = 0;
  for (let i = 0; i < w.tables.length; i++) {
    const k = tableSeats(s.tableLevels[i], w.tables[i].kind);
    toplam += tableTip(s.tableLevels[i]) * k;
    koltuk += k;
  }
  return koltuk > 0 ? toplam / koltuk : tableTip(s.tableLevel);
}

function brewTimeOf(s: State): number {
  const lv = s.stationLevels[THE_SERVICE];
  return mixAt(lv).prepTime / upgradeOutputMultiplier(C.service.upgrade, lv);
}

/* ─────────────── TAŞIMA KOLU (Ö5, denge-raporu-b5b §5) ───────────────
 * Eski sim gelirin ÜÇÜNCÜ tavanını hiç görmüyordu: çayı biri TAŞIMALI. Demleme ne kadar hızlı
 * olursa olsun, oyuncu + garsonlar saniyede taşıyabildiklerinden fazlasını satamaz. Bu tavan
 * verim çarpanının (0,80/0,55/0,35) içinde SAKLIYDI — yani garson/tepsi/karakter fiyatları
 * ölçülemiyordu ve "3. garson ne satın alıyor" sorusunun sim'de cevabı yoktu.
 *
 * BEKÇİ olarak eklenir, yeniden denge olarak değil: formüle yalnız üçüncü bir `min` terimi girer.
 * Tavan BİLEREK İYİMSER (üst sınır) — masalar arası ara mesafeyi, kirli dönüşünü, bekleme/hedef
 * seçimini saymaz. Yani susuyorsa gerçek oyunda da darboğaz değildir; KONUŞUYORSA gerçek oyun
 * kesinlikle daha kötüdür. Bir bekçinin yanlış alarm vermemesi, geç alarm vermesinden önemlidir.
 */
const CARRY_HANDLE = 0.5; // bardak başına alma+bırakma payı (sn)

/** Servis noktasından açık masalara ORTALAMA gerçek (BFS) yol — ızgara gibi cache'lenir. */
const distCache = new Map<string, number>();
function avgServeDist(tables: number, areasOpen: number): number {
  const key = `${tables}|${areasOpen}`;
  const hit = distCache.get(key);
  if (hit != null) return hit;
  const sp = servicePlace(areasOpen);
  const grid = getNavGrid(tables, areasOpen);
  let total = 0;
  let n = 0;
  for (let i = 0; i < tables; i++) {
    const t = LAYOUT.tables[i].table;
    const path = findNavPath(grid, [sp.pickup[0], 0, sp.pickup[2]], t[0], t[2], REACH_TABLE);
    if (!path || path.length === 0) continue;
    let d = Math.hypot(path[0][0] - sp.pickup[0], path[0][1] - sp.pickup[2]);
    for (let k = 1; k < path.length; k++) d += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
    total += d;
    n += 1;
  }
  const avg = n > 0 ? total / n : 0;
  distCache.set(key, avg);
  return avg;
}

/** K1b — açık masalar arasındaki ORTALAMA gerçek (BFS) mesafe. Aynı ızgara, aynı yol bulucu;
 *  yeni bir sayı UYDURULMAZ, mesafe düzenden türer. */
const araCache = new Map<string, number>();
export function avgInterTableDist(tables: number, areasOpen: number): number {
  const key = `${tables}|${areasOpen}`;
  const hit = araCache.get(key);
  if (hit != null) return hit;
  const grid = getNavGrid(tables, areasOpen);
  let total = 0, n = 0;
  for (let i = 0; i < tables; i++) {
    for (let j = i + 1; j < tables; j++) {
      const a = LAYOUT.tables[i].table, b = LAYOUT.tables[j].table;
      const path = findNavPath(grid, [a[0], 0, a[2]], b[0], b[2], REACH_TABLE);
      if (!path || path.length === 0) continue;
      let d = Math.hypot(path[0][0] - a[0], path[0][1] - a[2]);
      for (let k = 1; k < path.length; k++) d += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
      total += d; n += 1;
    }
  }
  const avg = n > 0 ? total / n : 0;
  araCache.set(key, avg);
  return avg;
}

/**
 * Bir taşıyıcının bardak/sn'si.
 * TABAN: tepsi dolusu ORTALAMA mesafedeki TEK masaya götür, boş dön → 2×dist.
 * K1b  : N bardak N AYRI masaya gider → git + (N-1)×masalar-arası + dön. Modelin gerçek
 *        kusuru bu: tepsi büyüdükçe taban tavanı doğrusal büyüyor, gerçekte her ek bardak
 *        bir masa daha dolaşmak demek (C3 §6: açık masa sayısıyla BÜYÜYOR — 8 masada %11,
 *        20 masada %58). Kusur "biraz iyimser" değil, YAPIYA ait.
 */
export const carrierRate = (tray: number, speed: number, dist: number, ara = 0): number =>
  tray / ((2 * dist + Math.max(0, tray - 1) * ara) / speed + tray * CARRY_HANDLE);

/**
 * K1a — ölçülen realizasyon oranı (`docs/olcum-kuyruk.txt`in "gerçekleşen %" satırı).
 * Masa sayısına göre doğrusal aradeğerleme; ölçüm noktalarının dışında en yakın nokta.
 * KÖR ÇARPAN olduğu için k1b ile birlikte KULLANILMAZ (aynı kaybı iki kez sayar).
 */
const K1A_OLCUM: [number, number][] = [
  // [acik masa, gerceklesen oran] — docs/olcum-kuyruk.txt, D-083 SONRASI tam kosu (2026-09-08).
  // G1'in orani 1'in USTUNDE: model bir tavan degil (ortalama masa mesafesini kullanir), yakin
  // masaya servis eden bir kural onu asabilir. C3 §6'da G1 %12,5 olculmustu — o sayi tasimanin
  // degil BARDAK KILIDININ sayisiymis; D-083 kilidi acinca ayni senaryo %117,8'e cikti.
  [4, 1.178], [8, 0.792], [12, 0.746], [20, 0.591],
];
function carryRealization(tables: number): number {
  const pts = K1A_OLCUM;
  if (tables <= pts[0][0]) return pts[0][1];
  if (tables >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    if (tables <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (tables - x0)) / (x1 - x0);
    }
  }
  return 1;
}

/** TAŞIMA tavanı (bardak/sn) = oyuncu + garson havuzu. */
function carryRateOf(s: State, oyuncusuz = false): number {
  const w = deriveWorld(s.padsDone);
  const dist = avgServeDist(w.tables.length, w.areasOpen);
  if (dist <= 0) return Infinity; // masa yokken tavan yok
  const ara = M.k1b ? avgInterTableDist(w.tables.length, w.areasOpen) : 0;
  // Olcum senaryolarinda oyuncu YOKTUR (AFK) — model/gercek karsilastirmasi oyuncusuz kurulur.
  const player = oyuncusuz ? 0
    : carrierRate(C.character.tray.values[s.char.tray], C.character.speed.values[s.char.speed], dist, ara);
  const wSpeed = C.waiter.speedUpgrades.speeds[s.waiterSpeed];
  const waiters = w.services[THE_SERVICE]?.waiters ?? 0;
  const ham = player + waiters * carrierRate(1 + s.waiterTray, wSpeed, dist, ara);
  return M.k1a ? ham * carryRealization(w.tables.length) : ham;
}

/* ─────────── K3'ün İKİ KUSURU (rapor Bulgu 5) — ölçülerek kapatıldı ───────────
 * İlk hâli G1'de 3,20 diyordu, oyunun kendi tick'i aynı senaryoda 7,53 ölçmüştü (%42).
 * Sebebi iki YAPISAL eksikti, kalibrasyon değil:
 *
 * ① Kirli bardağa TAM bir gidiş-dönüş yazılıyordu. Gerçekte boştaki garson zaten tezgâha
 *    DÖNMEKTE; kirliyi o dönüşün üstüne alır ve leğen dönüş yolundadır. Ödenen bedel turun
 *    tamamı değil, SAPMA payıdır:  d(masa→leğen) + d(leğen→tezgâh) − d(masa→tezgâh).
 *    D-083'ün dozu (tek bardak) tam bu kısa taahhüt için seçilmişti.
 * ② Sim bulaşıkçının yükseltme merdivenini HİÇ satın almıyordu (leğen 2→4→6→8 ₺600/2000/5000,
 *    hız 2,0→2,4→2,8 ₺700/2200). D-083 o merdiven tavandayken 20 masada temiz bardağın hiç
 *    bitmediğini ölçmüştü; model kademe 0'da donmuş bir bulaşıkçı varsayıyordu.
 */

/** ① Boştaki garsonun kirli için ödediği EK yol (sapma payı) — tezgâha zaten dönüyor. */
const sapmaCache = new Map<string, number>();
function avgDishDetour(tables: number, areasOpen: number): number {
  const key = `${tables}|${areasOpen}`;
  const hit = sapmaCache.get(key);
  if (hit != null) return hit;
  const sp = servicePlace(areasOpen);
  const grid = getNavGrid(tables, areasOpen);
  const yol = (a: Vec3n, bx: number, bz: number, reach: number): number => {
    const path = findNavPath(grid, [a[0], 0, a[2]], bx, bz, reach);
    if (!path || path.length === 0) return 0;
    let d = Math.hypot(path[0][0] - a[0], path[0][1] - a[2]);
    for (let k = 1; k < path.length; k++) d += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
    return d;
  };
  const wash = reachWash(areasOpen);
  let toplam = 0, n = 0;
  for (let i = 0; i < tables; i++) {
    const t = LAYOUT.tables[i].table as Vec3n;
    const masaLegen = yol(t, sp.dish[0], sp.dish[2], wash);
    const legenTezgah = yol(sp.dish as Vec3n, sp.pickup[0], sp.pickup[2], REACH_PICKUP);
    const masaTezgah = yol(t, sp.pickup[0], sp.pickup[2], REACH_PICKUP);
    toplam += Math.max(0, masaLegen + legenTezgah - masaTezgah);
    n += 1;
  }
  const avg = n > 0 ? toplam / n : 0;
  sapmaCache.set(key, avg);
  return avg;
}

/** Bulaşıkçının kendi döngüsü: leğenden çık, kirli topla, leğene dön. */
const legenCache = new Map<string, number>();
function avgDishToTable(tables: number, areasOpen: number): number {
  const key = `${tables}|${areasOpen}`;
  const hit = legenCache.get(key);
  if (hit != null) return hit;
  const sp = servicePlace(areasOpen);
  const grid = getNavGrid(tables, areasOpen);
  let toplam = 0, n = 0;
  for (let i = 0; i < tables; i++) {
    const t = LAYOUT.tables[i].table;
    const path = findNavPath(grid, [sp.dish[0], 0, sp.dish[2]], t[0], t[2], REACH_TABLE);
    if (!path || path.length === 0) continue;
    let d = Math.hypot(path[0][0] - sp.dish[0], path[0][1] - sp.dish[2]);
    for (let k = 1; k < path.length; k++) d += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
    toplam += d; n += 1;
  }
  const avg = n > 0 ? toplam / n : 0;
  legenCache.set(key, avg);
  return avg;
}

/**
 * K3'ün SABİT NOKTASI. `washRateOf` akışın AZALAN fonksiyonudur (akış arttıkça boş vakit azalır),
 * aranan akış ise onun ARTAN tarafı: en büyük `f ≤ tavan` öyle ki `f ≤ washRateOf(f)`.
 *
 * TUZAK — ilk hâli `f = min(f, wash(f))` diye YİNELEMEYDİ ve her adım f'i yalnız aşağı çektiği
 * için hep SIFIRA iniyordu: model G1'de "mekân tamamen kilitli" diyordu, oyunun kendi tick'i
 * aynı senaryoda 7,53 servis/dk ölçmüştü. Yanlış çözücü, doğru modeli çürük gösterdi. İkiye
 * bölme iki tarafı da tuttuğu için kararlı kökü bulur.
 */
function bardakDengesi(s: State, tavan: number, oyuncusuz = false): number {
  if (!Number.isFinite(tavan) || tavan <= 0) return tavan;
  if (tavan <= washRateOf(s, tavan, oyuncusuz)) return tavan; // yıkama hiç kelepçelemiyor
  let alt = 0, ust = tavan;
  for (let i = 0; i < 40; i++) {
    const orta = (alt + ust) / 2;
    if (orta <= washRateOf(s, orta, oyuncusuz)) alt = orta; else ust = orta;
  }
  return alt;
}

/* ─────────────── K3 — BARDAK (YIKAMA) TAVANI ───────────────
 * Bardak KAPALI bir sistemdir (D-082): servis edilen her bardak kirli döner, temizin TEK
 * kaynağı yıkamadır. Modelde bu tavan HİÇ yoktu — sim erken oyunda mekânın kilitlendiğini
 * (C4: 4 masa, dakika 3'te KALICI duruş) göremiyordu.
 *
 * Üç kaynak, ikisi AKIŞA BAĞLI: bulaşıkçı sabit çalışır; garson (D-083) ve oyuncu ancak BOŞ
 * vakitlerinde yıkar — boş vakit ise akışın taşıma tavanına ne kadar yaklaştığına bağlıdır.
 * Bu yüzden tavan sabit bir sayı değil, akışın SABİT NOKTASIDIR (birkaç yinelemede oturur).
 */
function washRateOf(s: State, akis: number, oyuncusuz = false): number {
  const w = deriveWorld(s.padsDone);
  const dist = avgServeDist(w.tables.length, w.areasOpen);
  if (dist <= 0) return Infinity;
  const tavan = carryRateOf(s, oyuncusuz);
  // Boşluk payı: taşıma tavanının kullanılmayan kısmı (D-083 tetiği "servis edecek kimse yok").
  const bos = tavan > 0 && Number.isFinite(tavan) ? Math.max(0, 1 - akis / tavan) : 0;

  // ① SAPMA payı: tezgâha zaten dönen taşıyıcı için kirli, turun tamamı değil ek yoldur.
  const sapma = avgDishDetour(w.tables.length, w.areasOpen);
  const kirliOran = (hiz: number, adet: number): number => adet / (sapma / hiz + adet * CARRY_HANDLE);

  const wSpeed = C.waiter.speedUpgrades.speeds[s.waiterSpeed];
  const waiters = w.services[THE_SERVICE]?.waiters ?? 0;
  // D-083: boştaki garson TEK kirli alır (idleDishCarry) — kısa taahhüt, ölçülerek seçildi.
  const garson = bos * waiters * kirliOran(wSpeed, C.waiter.idleDishCarry);
  // Oyuncu boş vaktinde elle yıkar (q_wash); tepsi kapasitesiyle taşır.
  const oyuncu = oyuncusuz ? 0
    : bos * kirliOran(C.character.speed.values[s.char.speed], C.character.tray.values[s.char.tray]);
  // ② Bulaşıkçı SÜREKLİ çalışır ve KADEMELERİ vardır: leğenden çık, kapasitesi dolana dek masa
  //    dolaş, leğene dön. Bir masada eşik kadar (dirtyThreshold) kirli birikir → durak sayısı.
  let bulasikci = 0;
  if (w.services[THE_SERVICE]?.hasDishwasher) {
    const kap = dishCarryCapacityFor(s.dishCarry);
    const hiz = dishSpeedFor(s.dishSpeed);
    const legenMasa = avgDishToTable(w.tables.length, w.areasOpen);
    const duraklar = Math.max(1, Math.ceil(kap / C.cups.dirtyThreshold));
    const ara = avgInterTableDist(w.tables.length, w.areasOpen);
    bulasikci = kap / ((2 * legenMasa + (duraklar - 1) * ara) / hiz + kap * CARRY_HANDLE);
  }
  return garson + oyuncu + bulasikci;
}

// SERVİSİN gelir oranı (₺/sn): min(talep, arz) × (ürün fiyatı + bahşiş). M3: tost pahalı+yavaş.
// Y4 kalibrasyonu: talep KOLTUK-temelli (Y2 grupları — masa başına seviyeyle 1→4 koltuk; idealize
// tableLevel'da L0 koltuk=1 → ölçülen erken/orta eğri AYNI kalır, geç-oyun L4 döneminde talep ×4
// olur ve istasyon arzı tavana dayanır — 2. garson + tepsi-3 tam bu pencereyi taşır, compute §1).
/* ─────────────── K4 — MÜŞTERİ SABRI ───────────────
 * Sabır modelde HİÇ yoktu. Sabrı aşan bekleme parasını ödemez: koltuk dolu geçer ama gelir
 * üretmez. Bu bir TALEP kolu kırpmasıdır — servis kapasitesini düşürmez (sıra boş değilse
 * sunucu zaten meşguldür), koltuğun ÜRETKEN payını düşürür. Kolun tempoya etkisinin olup
 * olmaması ölçümün cevabıdır: talep hiçbir senaryoda bağlayıcı değilse etki SIFIR çıkar.
 */
function servedFraction(s: State, w: Dunya, koltuk: number, kapasite: number): number {
  if (koltuk <= 0 || kapasite <= 0) return 1;
  seviyeleriEsitle(s, w);
  const pay = tostShare(s.stationLevels[THE_SERVICE]);
  const sabirlar = s.tableLevels.slice(0, w.tables.length).map((lv) =>
    (C.npc.patience + C.tables.patiencePerLevel * lv) *
    ((1 - pay) * PRODUCTS.tea.patienceMult + pay * PRODUCTS.tost.patienceMult));
  const sabir = sabirlar.length ? sabirlar.reduce((a, b) => a + b, 0) / sabirlar.length : C.npc.patience;
  // Doygun kuyrukta bir müşterinin beklemesi ≈ önündeki koltuk sayısı ÷ servis hızı.
  const bekleme = koltuk / kapasite;
  return bekleme <= sabir ? 1 : sabir / bekleme;
}

function rate(s: State, eff = 1): number {
  const w = deriveWorld(s.padsDone);
  const bt = brewTimeOf(s);
  const cycle = C.npc.walkTime + bt + C.npc.eatTime;
  const koltuk = openSeats(w, s);
  let demand = koltuk / cycle;
  const supply = 1 / bt;
  const price = mixAt(s.stationLevels[THE_SERVICE]).price;
  // B4 ODA KOLU: servis edilen her müşteri çıkarken lavaboya uğrayabilir ve parasını odanın
  // önüne bırakır → gelir MÜŞTERİ BAŞINA büyür. Üç tavanın (talep/arz/taşıma) HİÇBİRİNİ
  // gevşetmez, yalnız aynı akışın ₺'sini artırır — Kat 1'de throughput kolu tükendiği için
  // (arz L6'da 0,78 fincan/sn, taşıma tavanı 1,25) geriye kalan tek büyüme yönü budur.
  const perCustomer = price + ortBahsis(w, s) + lavaboIncomePerCustomer(s.lavabo);

  const carry = carryRateOf(s);
  let akis = Math.min(demand, supply, carry);
  if (M.k3) akis = bardakDengesi(s, akis);
  if (M.k4) {
    demand *= servedFraction(s, w, koltuk, Math.min(supply, carry));
    akis = Math.min(akis, demand);
  }
  return akis * perCustomer * eff;
}

/** Geliri o an KİM kelepçeliyor — üç kolun hangisi (rapor/teşhis için). */
type Kol = 'talep' | 'arz' | 'taşıma' | 'bardak';
function bindingArm(s: State): Kol {
  const w = deriveWorld(s.padsDone);
  const bt = brewTimeOf(s);
  const koltuk = openSeats(w, s);
  const carry = carryRateOf(s);
  let demand = koltuk / (C.npc.walkTime + bt + C.npc.eatTime);
  if (M.k4) demand *= servedFraction(s, w, koltuk, Math.min(1 / bt, carry));
  const arms: [string, number][] = [['talep', demand], ['arz', 1 / bt], ['taşıma', carry]];
  if (M.k3) arms.push(['bardak', washRateOf(s, Math.min(demand, 1 / bt, carry))]);
  arms.sort((a, b) => a[1] - b[1]);
  return arms[0][0] as Kol;
}

// Servis noktası darboğaz mı (talep ≥ arz)? Akıllı oyuncu önce onu yükseltir.
// B2'de bu neredeyse HEP doğru: kat büyürken tek nokta besliyor — ilerlemenin ana kolu bu.
function stationBottleneck(s: State): boolean {
  const w = deriveWorld(s.padsDone);
  const bt = brewTimeOf(s);
  const cycle = C.npc.walkTime + bt + C.npc.eatTime;
  return openSeats(w, s) / cycle > (1 / bt) * 0.95;
}

function upgradeUnlocked(s: State): boolean {
  if (s.stationLevels[THE_SERVICE] >= softMax()) return false;
  return requiresMet(C.service.upgradeRequires, gateOf(s));
}

const stationCost = (s: State) => upgradeCost(C.service.upgrade, s.stationLevels[THE_SERVICE] + 1);

// İdealize tek tableLevel: 1. alanın gate'i referans (v21 alan-başı; sim masa seviyesini tekilleştirir).
function tableUpgradeUnlocked(s: State): boolean {
  return requiresMet(C.tables.upgradeRequiresByArea[0], gateOf(s)) && s.tableLevel < tableSoftMax();
}

/**
 * K2 — KALEM KALEM masa yükseltmesi. Oyunda her masanın kendi yükseltme noktası ve kendi
 * alan çarpanı var; oyuncu en ucuzunu alır (parası yeten ilk kalem). Kapısı da masanın
 * KENDİ alanınındır — taban kol tek bir alan kapısına (a0) bakıyordu.
 * Döner: alınabilecek en ucuz masanın indeksi + ₺'si (yoksa null).
 */
function enUcuzMasa(s: State, w: Dunya): { i: number; cost: number } | null {
  seviyeleriEsitle(s, w);
  let best: { i: number; cost: number } | null = null;
  for (let i = 0; i < w.tables.length; i++) {
    const lv = s.tableLevels[i];
    if (lv >= tableSoftMax()) continue;
    const alan = w.tables[i].areaIndex;
    const kapi = C.tables.upgradeRequiresByArea[alan] ?? C.tables.upgradeRequiresByArea[0];
    if (!requiresMet(kapi, gateOf(s))) continue;
    const cost = tableUpgradeCost(lv, alan);
    if (!best || cost < best.cost) best = { i, cost };
  }
  return best;
}

/** Masa yükseltmesi satın alma — iki kol tek yerde (taban: hepsi tek kalemde). */
function masaYukselt(s: State, w: Dunya): boolean {
  if (M.k2) {
    const en = enUcuzMasa(s, w);
    if (!en || s.wallet < en.cost) return false;
    s.wallet -= en.cost;
    s.tableLevels[en.i] += 1;
    s.tableLevel = tlMin(s, w);
    return true;
  }
  if (!tableUpgradeUnlocked(s)) return false;
  let cost = 0;
  for (const tb of w.tables) cost += tableUpgradeCost(s.tableLevel, tb.areaIndex);
  if (s.wallet < cost) return false;
  s.wallet -= cost;
  s.tableLevel += 1;
  seviyeleriEsitle(s, w);
  return true;
}

/** Alınacak masa yükseltmesi KALDI mı (iki kol için ortak). */
const masaYukseltmeVar = (s: State, w: Dunya): boolean =>
  M.k2 ? enUcuzMasa(s, w) != null : tableUpgradeUnlocked(s);

function currentPad(s: State) {
  const g = gateOf(s);
  return C.pads.find((p) => !p.optional && !s.padsDone.includes(p.id) && requiresMet(p.requires, g)) ?? null;
}

/**
 * OYUNCU DAVRANIŞI — GÖREV HATTI GÜDÜMLÜ (B2'de düzeltildi).
 *
 * Eski sim "her an en ucuz darboğaz ocağı al" diyordu; oyun ise ekranda TEK aktif görev
 * gösteriyor ve oyuncu onu takip ediyor (Tek Odak). Servis merdiveni ucuzken fark küçüktü, ama
 * B2'de tezgâh/tost basamakları pahalı olduğu için "hangi sırayla alınıyor" tempoyu belirleyen
 * şeyin ta kendisi oldu. Bu yüzden sim artık aktif görevin istediğini biriktirip alıyor;
 * hat bitince serbest oyuna (servis merdiveni → masa seviyeleri) düşüyor.
 */
function trySpend(s: State): void {
  const d = deriveWorld(s.padsDone);
  const q = s.questIdx < C.quests.length ? C.quests[s.questIdx] : null;
  const t = q?.target;

  if (t) {
    switch (t.type) {
      case 'pad': {
        const pad = C.pads.find((p) => p.id === t.id);
        // Görevin pad'i henüz gate'liyse (önkoşul eksik) hattın tıkanmaması için serbest oyuna düş.
        if (pad && requiresMet(pad.requires, gateOf(s))) {
          if (s.wallet >= pad.cost) {
            s.wallet -= pad.cost;
            s.padsDone.push(pad.id);
            if (pad.effect.type === 'openRoom') s.lavabo = Math.max(s.lavabo, 1);
          }
          return; // biriktiriyor
        }
        break;
      }
      case 'stationLevel': {
        if (upgradeUnlocked(s)) {
          const cost = stationCost(s);
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.stationLevels[THE_SERVICE] += 1;
          }
          return;
        }
        break;
      }
      case 'charStat': {
        const cost = charNextCost(t.stat, s.char[t.stat]);
        if (cost != null) {
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.char[t.stat] += 1;
          }
          return;
        }
        break;
      }
      case 'waiterTray': {
        const cost = waiterTrayNextCost(s.waiterTray);
        if (cost != null) {
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.waiterTray += 1;
          }
          return;
        }
        break;
      }
      case 'waiterSpeed': {
        const cost = waiterSpeedNextCost(s.waiterSpeed);
        if (cost != null) {
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.waiterSpeed += 1;
          }
          return;
        }
        break;
      }
      case 'lavaboLevel': {
        const cost = lavaboUpgradeCost(s.lavabo);
        if (cost != null) {
          if (s.wallet >= cost) {
            s.wallet -= cost;
            s.lavabo += 1;
          }
          return;
        }
        break;
      }
      case 'tableLevel':
      case 'tablesAtLevel': {
        if (masaYukseltmeVar(s, d)) {
          masaYukselt(s, d);
          return;
        }
        break;
      }
      default:
        break; // sayaç görevi: para harcamaz, altta serbest oyun sürsün
    }
  }

  // SERBEST OYUN (hat bitti ya da aktif görev para istemiyor): önce servis merdiveni
  // (darboğaz olduğu sürece), sonra omurga pad'i, en son masa seviyeleri.
  if (stationBottleneck(s) && upgradeUnlocked(s)) {
    const cost = stationCost(s);
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.stationLevels[THE_SERVICE] += 1;
    }
    return;
  }
  // m1: taşıma darboğazsa taşıyıcı merdiveni pad'den ÖNCE gelir — servis merdiveninde
  // uygulanan "akıllı oyuncu önce darboğazı açar" kuralının taşıma kolundaki karşılığı.
  if (m1 && (deriveWorld(s.padsDone).services[THE_SERVICE]?.waiters ?? 0) > 0 && bindingArm(s) === 'taşıma') {
    const tepsi = waiterTrayNextCost(s.waiterTray);
    const hiz = waiterSpeedNextCost(s.waiterSpeed);
    const uygun = ([[tepsi, 'tepsi'], [hiz, 'hiz']] as [number | null, 'tepsi' | 'hiz'][])
      .filter((x) => x[0] != null).sort((a, b) => a[0]! - b[0]!)[0];
    if (uygun) {
      if (s.wallet >= uygun[0]!) {
        s.wallet -= uygun[0]!;
        if (uygun[1] === 'tepsi') s.waiterTray += 1; else s.waiterSpeed += 1;
      }
      return; // biriktiriyor
    }
  }
  const pad = currentPad(s);
  if (pad) {
    if (s.wallet >= pad.cost) {
      s.wallet -= pad.cost;
      s.padsDone.push(pad.id);
      if (pad.effect.type === 'openRoom') s.lavabo = Math.max(s.lavabo, 1);
    }
    return;
  }
  if (upgradeUnlocked(s)) {
    const cost = stationCost(s);
    if (s.wallet >= cost) {
      s.wallet -= cost;
      s.stationLevels[THE_SERVICE] += 1;
    }
    return;
  }
  // K3: bardak darboğazsa oyuncu bulaşıkçının merdivenini alır (oyunda karakter panelinden;
  // "yetişemiyor" hissi v28/v29'da tam bu yüzden yükseltmeye bağlanmıştı). Akıllı-oyuncu
  // kuralı servis merdiveniyle aynı: darboğaz olan kolu yükselt.
  if (M.k3 && deriveWorld(s.padsDone).services[THE_SERVICE]?.hasDishwasher && bindingArm(s) === 'bardak') {
    const kap = dishCarryNextCost(s.dishCarry);
    const hiz = dishSpeedNextCost(s.dishSpeed);
    const secim: [number | null, 'carry' | 'speed'][] = [[kap, 'carry'], [hiz, 'speed']];
    const uygun = secim.filter((x) => x[0] != null).sort((a, b) => a[0]! - b[0]!)[0];
    if (uygun) {
      if (s.wallet >= uygun[0]!) {
        s.wallet -= uygun[0]!;
        if (uygun[1] === 'carry') s.dishCarry += 1; else s.dishSpeed += 1;
      }
      return;
    }
  }
  const lavCost = lavaboUpgradeCost(s.lavabo);
  if (lavCost != null) {
    if (s.wallet >= lavCost) {
      s.wallet -= lavCost;
      s.lavabo += 1;
    }
    return;
  }
  if (masaYukseltmeVar(s, d)) masaYukselt(s, d);
}

interface Milestone { name: string; hit: (s: State) => boolean }
/* D1: liste eskiden modül yükleme anında kuruluyordu; oysa AD'ları config'ten sayı okuyor
 * (`zone2` ₺'si, servis tavanı). `DENGE` kolu o sayıları değiştirince ad bayatlıyordu.
 * Artık tembel kurulur; kol değiştiren `milestoneTazele()` çağırır. */
let _milestones: Milestone[] | null = null;
export function milestoneTazele(): void { _milestones = null; }
function MS(): Milestone[] {
  if (_milestones) return _milestones;
  _milestones = [
  { name: 'İlk satın alma (2. Masa)', hit: (s) => s.padsDone.includes('table2') },
  { name: `Karakter: Tepsi T1 (${charNextCost('tray', 0)}₺)`, hit: (s) => s.char.tray >= 1 },
  { name: 'Çay ocağı L1 (z1)', hit: (s) => s.stationLevels[0] >= 1 },
  { name: '3. Masa', hit: (s) => s.padsDone.includes('table3') },
  { name: `Karakter: Tepsi T2 (${charNextCost('tray', 1)}₺)`, hit: (s) => s.char.tray >= 2 },
  { name: 'Garson', hit: (s) => s.padsDone.includes('waiter') },
  { name: 'Bulaşıkçı', hit: (s) => s.padsDone.includes('dishwasher') },
  { name: '4. Masa (zone-1 dolu)', hit: (s) => s.padsDone.includes('table4') },
  { name: `Karakter: Mıknatıs M1 (${charNextCost('magnet', 0)}₺)`, hit: (s) => s.char.magnet >= 1 },
  { name: 'TEZGÂH kuruldu (L4)', hit: (s) => s.stationLevels[0] >= C.service.counterLevel },
  { name: 'TOST açıldı (L5)', hit: (s) => s.stationLevels[0] >= C.service.tostLevel },
  { name: `Servis ₺-max L${softMax()}`, hit: (s) => s.stationLevels[0] >= softMax() },
  { name: `ZONE-2 AÇILDI (₺${C.pads.find((p) => p.id === 'zone2')?.cost})`, hit: (s) => s.padsDone.includes('zone2') },
  { name: 'Z2: 2. Masa', hit: (s) => s.padsDone.includes('z2table2') },
  { name: '2. Garson', hit: (s) => s.padsDone.includes('waiter2') },
  { name: 'Z2: 4. Masa (zone-2 dolu)', hit: (s) => s.padsDone.includes('z2table4') },
  { name: `ZONE-3 AÇILDI (₺${C.pads.find((p) => p.id === 'zone3')?.cost})`, hit: (s) => s.padsDone.includes('zone3') },
  { name: 'Z3: 4. Masa', hit: (s) => s.padsDone.includes('z3table4') },
  // B5a: orta şerit 12 banket birimine açıldı — kat 20 masa. Zincirin son iki uğrağı.
  { name: 'LAVABO açıldı', hit: (s) => s.padsDone.includes('lavabo') },
  { name: `Lavabo L${lavaboMaxLevel()} (oda tavanı)`, hit: (s) => s.lavabo >= lavaboMaxLevel() },
  { name: 'Şerit yarısı (16. masa)', hit: (s) => s.padsDone.includes('z3table8') },
  { name: 'ŞERİT DOLDU (20. masa)', hit: (s) => s.padsDone.includes('z3table12') },
  { name: 'Masa yükseltme L1 (bahşiş)', hit: (s) => tlMax(s, deriveWorld(s.padsDone)) >= 1 },
  { name: 'lifetime 1.000 ₺', hit: (s) => s.lifetime >= 1_000 },
  { name: 'lifetime 10.000 ₺', hit: (s) => s.lifetime >= 10_000 },
  ];
  return _milestones;
}

const NL = String.fromCharCode(10);

function fmtTime(sec: number): string {
  if (sec < 60) return `${sec.toFixed(0)} sn`;
  if (sec < 3600) return `${(sec / 60).toFixed(1)} dk`;
  return `${(sec / 3600).toFixed(2)} sa`;
}

/**
 * SATIN ALMA OLAYI — tempo denetiminin ikinci ölçütü için (D-010 §3.6: "20 dk'yı aşan tek alım
 * kalmasın"). Milestone listesi zincirin TAMAMINI taşımaz (karakter kademeleri, masa seviyeleri,
 * ara pad'ler dışarıda kalır); oysa oyuncunun hissettiği bekleme iki ARDIŞIK ALIM arasındaki
 * boşluktur. Bu yüzden ölçüm milestone'lardan değil, harcamanın kendisinden türer.
 */
interface Buy { t: number; label: string }

/** Harcama sayaçlarının anlık görüntüsü — trySpend'in NE aldığını fark ile okuruz. */
function spendSnap(s: State) {
  return {
    pads: s.padsDone.length,
    lastPad: s.padsDone[s.padsDone.length - 1] ?? '',
    st: s.stationLevels[THE_SERVICE],
    tl: s.tableLevel,
    // K2'de tek masa yükselince küresel (min) seviye kıpırdamaz — alım TESPİTİ toplamı okur,
    // yoksa 20 masanın 19 yükseltmesi "alım olmadı" sayılır ve bekleme sahte biçimde uzar.
    // Etiket yine seviyeden yazılır → taban çıktısı birebir korunur.
    tlTop: s.tableLevels.reduce((a, b) => a + b, 0),
    tray: s.char.tray, magnet: s.char.magnet, speed: s.char.speed,
    wt: s.waiterTray, ws: s.waiterSpeed, lav: s.lavabo,
    dc: s.dishCarry, ds: s.dishSpeed,
  };
}
type Snap = ReturnType<typeof spendSnap>;

/** İki anlık görüntü arasındaki fark bir alımsa etiketi, değilse null. */
function boughtLabel(a: Snap, b: Snap): string | null {
  if (b.pads > a.pads) return `pad: ${b.lastPad}`;
  if (b.st > a.st) return `servis L${b.st}`;
  if (b.tlTop > a.tlTop) return `masa seviyesi L${M.k2 ? a.tl + 1 : b.tl}`;
  if (b.lav > a.lav) return `lavabo L${b.lav}`;
  if (b.tray > a.tray) return `karakter: tepsi ${b.tray}`;
  if (b.magnet > a.magnet) return `karakter: mıknatıs ${b.magnet}`;
  if (b.speed > a.speed) return `karakter: hız ${b.speed}`;
  if (b.wt > a.wt) return `garson tepsi ${b.wt}`;
  if (b.ws > a.ws) return `garson hız ${b.ws}`;
  if (b.dc > a.dc) return `bulaşıkçı leğen ${b.dc}`;
  if (b.ds > a.ds) return `bulaşıkçı hız ${b.ds}`;
  return null;
}

/** Bir profili koştur; milestone → saniye haritası döner. `buys` verilirse alım hattı da dolar. */
function runProfile(eff: number, log = false, buys?: Buy[]): Map<string, number> {
  const s: State = {
    t: 0, wallet: 0, lifetime: 0,
    stationLevels: Array.from({ length: MAX_SERVICES }, () => 0),
    tableLevel: 0, tableLevels: [], padsDone: [],
    char: { tray: 0, magnet: 0, speed: 0 },
    waiterTray: 0, waiterSpeed: 0, dishCarry: 0, dishSpeed: 0,
    questIdx: 0, lavabo: 0,
  };
  const MAX_T = 60 * 60 * 12; // B5a: şeridin 12 birimi 6 saatin ötesine taşıyor — ölçüm penceresi büyüdü
  const hedef = hedefFabrika ? hedefFabrika() : null;
  const done = new Map<string, number>();
  while (s.t < MAX_T) {
    const inc = rate(s, eff) * DT;
    s.wallet += inc;
    s.lifetime += inc;
    s.t += DT;
    const before = buys ? spendSnap(s) : null;
    trySpend(s);
    if (before) {
      const label = boughtLabel(before, spendSnap(s));
      if (label) buys!.push({ t: s.t, label });
    }
    advanceQuests(s); // M1: görev ödülleri cüzdana
    if (hedef) {
      // D3: hedef (koleksiyon) ödülleri — görev ödülüyle AYNI muamele (ikisi de lifetime'a sayar).
      const w = deriveWorld(s.padsDone);
      seviyeleriEsitle(s, w);
      const usta = s.tableLevels.slice(0, w.tables.length).filter((l) => l >= tableSoftMax()).length;
      const odul = hedef({ t: s.t, lifetime: s.lifetime, padSayisi: s.padsDone.length, ustaMasa: usta });
      if (odul > 0) { s.wallet += odul; s.lifetime += odul; }
    }
    for (const m of MS()) {
      if (!done.has(m.name) && m.hit(s)) {
        done.set(m.name, s.t);
        if (log) {
          console.log(
            `  ✓ ${m.name.padEnd(34)} @ ${fmtTime(s.t).padStart(7)}  (oran ${rate(s, eff).toFixed(2)} ₺/sn, servis L${s.stationLevels[0]}, ${deriveWorld(s.padsDone).tables.length} masa, darboğaz: ${bindingArm(s)})`,
          );
        }
      }
    }
    if (done.size === MS().length) break;
  }
  return done;
}

/** Bir profilin ARDIŞIK ALIM boşlukları — D1 tarayıcısı ihlalleri buradan sayar.
 *  Boşluğun etiketi onu BİTİREN alımdır: oyuncu o süre boyunca ONUN için biriktiriyordu. */
export interface Bosluk { t: number; gap: number; label: string }
export function profilBosluklari(eff: number): Bosluk[] {
  const buys: Buy[] = [];
  runProfile(eff, false, buys);
  return buys.map((b, i) => ({ t: b.t, label: b.label, gap: b.t - (i === 0 ? 0 : buys[i - 1].t) }));
}

/* ═══════════ C5 — KOL KARŞILAŞTIRMASI (rapor §Bulgular tablosunu üretir) ═══════════
 * Her kol AYNI koşuyu AYNI ölçütlerle verir; fark yalnız modelden gelir. Tek tek VE `hepsi`:
 * kollar birbirini gizleyebilir (taşıma kısılınca bardak tavanı hiç konuşmayabilir), o yüzden
 * "tek tek etkisiz" ile "birlikte etkisiz" ayrı sorulardır.
 */
export interface Olcut {
  ilkAlim: number | undefined;
  acilisEnUzun: number;
  acilisAlim: number;
  otomasyon: number | undefined;
  serit: number | undefined;
  normalEnUzun: number;
  normalEnUzunEtiket: string;
  /** D-087: DÖRDÜNCÜ tempo ölçütünün HÜKÜM sayıları — İDEALİZE profilden (kardeş üç ölçütle
   *  aynı profil). Normal/Rahat sayıları hüküm değil GÖZLEM bandıdır. */
  idealAsan: number;
  idealEnUzun: number;
  idealEnUzunEtiket: string;
  normalAsan: number;
  /** 20 dk'yı aşan alımların TAMAMI (D1: sayı tek başına hangi basamak olduğunu söylemiyordu). */
  asanlar: Bosluk[];
  /** Normal profilin TÜM boşlukları — D1 tarayıcısının parmak izi bunu okur (ayrı koşu ETMEZ:
   *  üçüncü bir profil koşusu tarama süresini 1,5 katına çıkarıyordu). */
  bosluklarNormal: Bosluk[];
  masaEnUzun: number;
}

export function olcutler(): Olcut {
  const idealBuys: Buy[] = [];
  const ideal = runProfile(OLCUT_VERIM, false, idealBuys);
  const otomasyon = ideal.get('Garson');
  const acilis = idealBuys
    .map((b, i) => ({ label: b.label, gap: b.t - (i === 0 ? 0 : idealBuys[i - 1].t), t: b.t }))
    .filter((g) => otomasyon != null && g.t <= otomasyon);
  const acilisEnUzun = acilis.length ? Math.max(...acilis.map((g) => g.gap)) : NaN;

  const idealGaps = idealBuys
    .map((b, i) => ({ ...b, gap: b.t - (i === 0 ? 0 : idealBuys[i - 1].t) }))
    .sort((a, b) => b.gap - a.gap);

  const nBuys: Buy[] = [];
  const normal = runProfile(0.55, false, nBuys);
  const gaps = nBuys.map((b, i) => ({ ...b, gap: b.t - (i === 0 ? 0 : nBuys[i - 1].t) }));
  gaps.sort((a, b) => b.gap - a.gap);
  const masa = gaps.filter((g) => g.label.startsWith('masa seviyesi'));
  return {
    ilkAlim: ideal.get('İlk satın alma (2. Masa)'),
    acilisEnUzun,
    acilisAlim: acilis.length,
    otomasyon,
    serit: normal.get('ŞERİT DOLDU (20. masa)'),
    normalEnUzun: gaps[0]?.gap ?? NaN,
    normalEnUzunEtiket: gaps[0]?.label ?? '—',
    idealAsan: idealGaps.filter((g) => g.gap > BEKLEME_SINIRI).length,
    idealEnUzun: idealGaps[0]?.gap ?? NaN,
    idealEnUzunEtiket: idealGaps[0]?.label ?? '—',
    normalAsan: gaps.filter((g) => g.gap > BEKLEME_SINIRI).length,
    asanlar: gaps.filter((g) => g.gap > BEKLEME_SINIRI).map((g) => ({ t: g.t, gap: g.gap, label: g.label })).sort((a, b) => a.t - b.t),
    bosluklarNormal: [...gaps].sort((a, b) => a.t - b.t).map((g) => ({ t: g.t, gap: g.gap, label: g.label })),
    masaEnUzun: masa[0]?.gap ?? NaN,
  };
}

const GEC_OYUN_PADS = ['table2', 'table3', 'waiter', 'table4', 'zone2', 'z2table2', 'z2table3', 'dishwasher', 'z2table4', 'zone3', 'z3table2', 'waiter2', 'z3table3', 'z3table4', 'waiter3', 'z3table5', 'z3table6', 'z3table7', 'z3table8', 'z3table9', 'z3table10', 'z3table11', 'z3table12', 'lavabo'];

/* ═══════════ C5 — MODEL ↔ GERÇEK DOĞRULAMASI ═══════════
 * Kolları birbiriyle kıyaslamak yetmez: hangisinin GERÇEĞE yaklaştırdığı sorusunun cevabı,
 * modelin tahminini `olcum-kuyruk.ts`in oyunun KENDİ tick'iyle ölçtüğü debiyle karşılaştırmaktır.
 * Senaryolar `olcum-kuyruk.ts`in G1-G4'üyle BİREBİR aynı kurulur (aynı pad zinciri, aynı ocak
 * seviyesi, aynı garson kademeleri, karakter yükseltmesi YOK) — ölçümde oyuncu yoktur, bu yüzden
 * modelin taşıma tavanı da OYUNCUSUZ hesaplanır. Tek fark modelin kendisidir.
 */
const ZINCIR_IDS = C.pads.map((p) => p.id);
const zincireKadar = (son: string): string[] => {
  const i = ZINCIR_IDS.indexOf(son);
  if (i < 0) throw new Error(`pad yok: ${son}`);
  return ZINCIR_IDS.slice(0, i + 1);
};

interface GercekSenaryo {
  ad: string;
  sonPad: string;
  stationLevel: number;
  tableLevel: number;
  waiterTray: number;
  waiterSpeed: number;
  dishCarry: number;
  dishSpeed: number;
  /** `docs/olcum-kuyruk.txt` — oyunun kendi tick'iyle ÖLÇÜLEN servis/dk (D-083 sonrası tam koşu). */
  olculen: number;
}

export const GERCEK: GercekSenaryo[] = [
  // Kademeler `tools/olcum-kuyruk.ts`in SENARYOLAR dizisiyle birebir (waiterUpgrades).
  { ad: 'G1 · 4 masa · 1 garson', sonPad: 'table4', stationLevel: 1, tableLevel: 0, waiterTray: 0, waiterSpeed: 0, dishCarry: 0, dishSpeed: 0, olculen: 7.53 },
  { ad: 'G2 · 8 masa · 1 garson', sonPad: 'z2table4', stationLevel: 3, tableLevel: 1, waiterTray: 1, waiterSpeed: 1, dishCarry: 1, dishSpeed: 1, olculen: 5.93 },
  { ad: 'G3 · 12 masa · 2 garson', sonPad: 'z3table4', stationLevel: 5, tableLevel: 2, waiterTray: 1, waiterSpeed: 1, dishCarry: 1, dishSpeed: 1, olculen: 8.27 },
  { ad: 'G4 · 20 masa · 3 garson', sonPad: 'z3table12', stationLevel: 6, tableLevel: 4, waiterTray: 2, waiterSpeed: 1, dishCarry: 2, dishSpeed: 1, olculen: 16.13 },
];

/** Senaryonun model tahmini (müşteri/dk) — oyuncusuz, o an açık kollarla. */
export function modelDebisi(g: GercekSenaryo): number {
  const padsDone = zincireKadar(g.sonPad);
  const st: State = {
    t: 0, wallet: 0, lifetime: 999999, stationLevels: [g.stationLevel], tableLevel: g.tableLevel,
    tableLevels: [], padsDone, char: { tray: 0, magnet: 0, speed: 0 },
    waiterTray: g.waiterTray, waiterSpeed: g.waiterSpeed,
    dishCarry: g.dishCarry, dishSpeed: g.dishSpeed, questIdx: C.quests.length,
    lavabo: padsDone.includes('lavabo') ? 1 : 0,
  };
  const w = deriveWorld(padsDone);
  st.tableLevels = Array.from({ length: w.tables.length }, () => g.tableLevel);
  const bt = brewTimeOf(st);
  const koltuk = openSeats(w, st);
  const carry = carryRateOf(st, true);
  let talep = koltuk / (C.npc.walkTime + bt + C.npc.eatTime);
  if (M.k4) talep *= servedFraction(st, w, koltuk, Math.min(1 / bt, carry));
  let akis = Math.min(talep, 1 / bt, carry);
  if (M.k3) akis = bardakDengesi(st, akis, true);
  return akis * 60;
}

function dogrula(): void {
  console.log('');
  console.log('--- MODEL ↔ GERCEK (olcum-kuyruk.ts, oyunun kendi tick`i, D-083 sonrasi) ---');
  console.log('  Sapma = |model - olculen| / olculen. KUCUK olan model gercege YAKIN.');
  console.log('');
  const adlar = ['taban', 'k1a', 'k1b', 'k2', 'k3', 'k4', 'hepsi', 'secilen'];
  const head = 'kol'.padEnd(6) + '| ' + GERCEK.map((g) => g.ad.split(' · ')[0].padStart(15)).join(' | ') + ' | ORT SAPMA';
  console.log('olculen'.padEnd(6) + '| ' + GERCEK.map((g) => `${g.olculen.toFixed(2)}/dk`.padStart(15)).join(' | ') + ' |     —');
  console.log(head);
  console.log('-'.repeat(head.length));
  for (const ad of adlar) {
    kolAyarla(KOLLAR[ad]);
    distCache.clear();
    araCache.clear();
    const sapmalar: number[] = [];
    const hucre = GERCEK.map((g) => {
      const m = modelDebisi(g);
      const sapma = Math.abs(m - g.olculen) / g.olculen;
      sapmalar.push(sapma);
      return `${m.toFixed(2)} (${(m / g.olculen * 100).toFixed(0)}%)`.padStart(15);
    });
    const ort = sapmalar.reduce((a, b) => a + b, 0) / sapmalar.length;
    console.log(ad.padEnd(6) + '| ' + hucre.join(' | ') + ' | ' + `%${(ort * 100).toFixed(0)}`.padStart(9));
  }
  kolAyarla(KOLLAR.taban);
}

/** Kol degistiginde mesafe onbellekleri tazelenmeli (kol mesafe TERIMINI degistiriyor). */
export function onbellekTemizle(): void { distCache.clear(); araCache.clear(); sapmaCache.clear(); legenCache.clear(); }

function karsilastir(): void {
  console.log('=== C5 — MODEL KOLLARI KARSILASTIRMASI (ayni kosu, fark yalniz modelden) ===');
  console.log('');
  console.log('Olcutler (D-010 §3.6 · D-079): 1) ilk alim < 90 sn · 2) garsona kadar bosluk <= 2 dk');
  console.log('                               3) otomasyon (Garson) < 15 dk · 4) en uzun bekleme <= 20 dk');
  console.log('"masa enUzun" = Normal profilde en uzun MASA YUKSELTMESI beklemesi (C1in sahte 21,4 dk).');
  console.log('');
  const adlar = ['taban', 'k1a', 'k1b', 'k2', 'k3', 'k4', 'hepsi', 'secilen'];
  const bas = (x: number | undefined, birim: 'sn' | 'dk' | 'sa'): string =>
    x == null || Number.isNaN(x)
      ? '—'
      : birim === 'sn'
        ? `${x.toFixed(0)} sn`
        : birim === 'dk'
          ? `${(x / 60).toFixed(1)} dk`
          : `${(x / 3600).toFixed(2)} sa`;
  const head =
    'kol'.padEnd(6) + '| ilk alim | acilis enUzun | otomasyon | SERIT(N) | en uzun bekleme (Normal)       | >20dk | masa enUzun';
  console.log(head);
  console.log('-'.repeat(head.length));
  for (const ad of adlar) {
    kolAyarla(KOLLAR[ad]);
    distCache.clear();
    araCache.clear();
    const o = olcutler();
    console.log(
      ad.padEnd(6) +
        '| ' + bas(o.ilkAlim, 'sn').padStart(8) +
        ' | ' + bas(o.acilisEnUzun, 'dk').padStart(13) +
        ' | ' + bas(o.otomasyon, 'dk').padStart(9) +
        ' | ' + bas(o.serit, 'sa').padStart(8) +
        ' | ' + `${bas(o.normalEnUzun, 'dk')} -> ${o.normalEnUzunEtiket}`.padEnd(30) +
        ' | ' + String(o.normalAsan).padStart(5) +
        ' | ' + bas(o.masaEnUzun, 'dk').padStart(11),
    );
  }

  console.log('');
  console.log('--- Gec-oyun sahnesi (20 masa · L6 · garson 3 · lavabo L6): kol basina DARBOGAZ ---');
  for (const ad of ['taban', 'k1a', 'k1b', 'k2', 'k3', 'k4', 'hepsi', 'secilen']) {
    kolAyarla(KOLLAR[ad]);
    distCache.clear();
    araCache.clear();
    const st: State = {
      t: 0, wallet: 0, lifetime: 0, stationLevels: [6], tableLevel: 4, tableLevels: [],
      padsDone: [...GEC_OYUN_PADS], char: { tray: 4, magnet: 3, speed: 3 },
      waiterTray: 3, waiterSpeed: 1, dishCarry: 0, dishSpeed: 0, questIdx: 0, lavabo: lavaboMaxLevel(),
    };
    const w = deriveWorld(st.padsDone);
    st.tableLevels = Array.from({ length: w.tables.length }, () => st.tableLevel);
    const b = brewTimeOf(st);
    const koltuk = openSeats(w, st);
    const carry = carryRateOf(st);
    let talep = koltuk / (C.npc.walkTime + b + C.npc.eatTime);
    if (M.k4) talep *= servedFraction(st, w, koltuk, Math.min(1 / b, carry));
    const yikama = M.k3 ? washRateOf(st, Math.min(talep, 1 / b, carry)) : Infinity;
    console.log(
      `  ${ad.padEnd(6)} talep ${talep.toFixed(2).padStart(6)} · arz ${(1 / b).toFixed(2)} · tasima ${carry.toFixed(2).padStart(5)}` +
        ` · bardak ${(Number.isFinite(yikama) ? yikama.toFixed(2) : '—').padStart(5)}` +
        ` -> ${bindingArm(st).toUpperCase().padEnd(7)} · gelir ${rate(st).toFixed(2)} TL/sn`,
    );
  }

  console.log('');
  console.log('--- Tasima modeli: kol basina TUR mesafesi (4/8/12/20 masa, garson tepsisi 3) ---');
  console.log('  masa | servis yolu | masalar arasi | taban tur | k1b tur | k1b/taban');
  for (const [pads, n] of [[4, 4], [9, 8], [14, 12], [24, 20]] as [number, number][]) {
    const padsDone = GEC_OYUN_PADS.slice(0, pads);
    const w = deriveWorld(padsDone);
    const d = avgServeDist(w.tables.length, w.areasOpen);
    const ara = avgInterTableDist(w.tables.length, w.areasOpen);
    const tabanTur = (2 * d) / 2 + 3 * CARRY_HANDLE;
    const k1bTur = (2 * d + 2 * ara) / 2 + 3 * CARRY_HANDLE;
    console.log(
      `  ${String(w.tables.length).padStart(4)} | ${d.toFixed(1).padStart(11)} | ${ara.toFixed(1).padStart(13)}` +
        ` | ${tabanTur.toFixed(1).padStart(9)} | ${k1bTur.toFixed(1).padStart(7)} | ${(k1bTur / tabanTur).toFixed(2).padStart(9)}` +
        `   (istenen ${n} masa)`,
    );
  }
  dogrula();
  kolAyarla(KOLLAR.taban);
}

function run() {
  console.log('=== Köşe Kıraathanesi — Ekonomi Simülasyonu (B2: TEK servis, bottleneck) ===\n');
  const s0: State = {
    t: 0, wallet: 0, lifetime: 0, stationLevels: [0], tableLevel: 0, tableLevels: [], padsDone: [],
    char: { tray: 0, magnet: 0, speed: 0 }, waiterTray: 0, waiterSpeed: 0, dishCarry: 0, dishSpeed: 0, questIdx: 0, lavabo: 0,
  };
  console.log(`Sabit çay fiyatı: ${TEA_PRICE} ₺ · Başlangıç: 1 masa, oran ${rate(s0).toFixed(2)} ₺/sn\n`);

  console.log('--- İDEALİZE (verim 1.0 — tempo denetimi bununla) ---');
  const idealBuys: Buy[] = [];
  const ideal = runProfile(1, true, idealBuys);

  console.log('\n--- Tempo denetimi (D-010 §3.6 · ölçüt 2 D-079da değişti) ---');
  console.log('Hedef (D-079): ilk alım < 90 sn; GARSONA KADAR hiçbir boşluk > 2 dk; otomasyon < 15 dk.');
  const first = ideal.get('İlk satın alma (2. Masa)');
  console.log(first != null && first <= 90 ? `  1) İlk satın alma ${fmtTime(first)} ✓` : `  1) İlk satın alma HEDEF DIŞI: ${first}`);
  const notHit = MS().filter((m) => !ideal.has(m.name)).map((m) => m.name);
  if (notHit.length) console.log('6 saatte ulaşılamayan:', notHit.join(', '));

  /* Faz C1 — D-010'un üç ölçütünden yalnız BİRİ ölçülüyordu; kalan ikisi düz yazı olarak durup
     göz kararıyla bakılıyordu. B5a'nın dersi burada da geçerli: ölçülmeyen ölçüt bayatlar ve
     kimse fark etmez. Üçü de ölçülür oldu; hiçbir denge sayısına dokunulmadı, değişen yalnız
     raporun kendisi. */

  /* 2) AÇILIŞ TEMPOSU — ÖLÇÜT D-079'da DEĞİŞTİ.
     Eski ölçüt: "ilk 5-10 dk her ~20-40 sn bir alım". C1'de ölçüldü ve tutmuyordu (ilk 10 dk'de
     8 alım, medyan boşluk 1,4 dk). Kullanıcı kararı: ölçüt BAYAT — oyunun ilk günlerinden
     (kat 21 × 21, tek salon, dört masa) ve sonraki kuralla ÇELİŞİYOR. Geçerli kural
     `feedback_economy_pacing_offline`: **garson öncesi ucuz, garson sonrası ölçülü pahalı.**
     Ölçülebilir karşılığı: otomasyona kadar hiçbir alım boşluğu OPENING_GAP_MAX'ı aşmaz.
     Garson SONRASI tempo zaten ayrı bir bekçide (EN UZUN BEKLEME, 20 dk). */
  const OPENING_GAP_MAX = 2 * 60;
  const autoAt = ideal.get('Garson');
  const openGaps = idealBuys
    .map((b, i) => ({ label: b.label, gap: b.t - (i === 0 ? 0 : idealBuys[i - 1].t), t: b.t }))
    .filter((g) => autoAt != null && g.t <= autoAt);
  if (openGaps.length === 0) {
    console.log('  2) Açılış temposu ÖLÇÜLEMEDİ (garsondan önce hiç alım yok)');
  } else {
    const sorted = openGaps.map((g) => g.gap).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const worst = openGaps.reduce((a, b) => (b.gap > a.gap ? b : a));
    console.log(
      `  2) Açılış temposu (garsona kadar): ${openGaps.length} alım · medyan boşluk ${fmtTime(median)}` +
        ` · en uzun ${fmtTime(worst.gap)} → ${worst.label}  ${worst.gap <= OPENING_GAP_MAX ? '✓' : '✗ (hedef ≤ 2 dk)'}`,
    );
  }

  /* 3) OTOMASYON: garsonun tutulduğu an — oyuncunun TEK BAŞINA taşıdığı dönemin uzunluğu. */
  console.log(
    autoAt == null
      ? '  3) Otomasyon (Garson) 6 saatte ULAŞILAMADI ✗'
      : `  3) Otomasyon (Garson) ${fmtTime(autoAt)}  ${autoAt <= 15 * 60 ? '✓' : '✗ (hedef < 15 dk)'}`,
  );

  /* 4) EN UZUN BEKLEME (D-010 §3.6) — D-087'de PROFİLİ SABİTLENDİ: hüküm bu üçün YANINDA,
     AYNI profilde (İDEALİZE) verilir. Eskiden bu ölçüt buradan değil, aşağıdaki üç-profil
     bloğundan göz kararıyla okunuyordu ve "hangi profil" hiç yazılmamıştı. */
  const hukumGaps = idealBuys
    .map((b, i) => ({ ...b, gap: b.t - (i === 0 ? 0 : idealBuys[i - 1].t) }))
    .sort((a, b) => b.gap - a.gap);
  const hukumAsan = hukumGaps.filter((g) => g.gap > BEKLEME_SINIRI);
  console.log(
    `  4) En uzun bekleme ${fmtTime(hukumGaps[0]?.gap ?? 0)} → ${hukumGaps[0]?.label ?? '—'}` +
      ` · 20 dk'yı aşan: ${hukumAsan.length}  ` +
      (hukumAsan.length <= BEKLEME_IZIN ? '✓' : `✗ (hedef ≤ ${BEKLEME_IZIN})`),
  );
  console.log(
    `     (hüküm İDEALİZE profilden — 1-3 ile aynı. İzin verilen ${BEKLEME_IZIN} aşan:` +
      ` D-078'in bilerek bıraktığı son basamak. Gerekçe: D-087.)`,
  );

  // 3-PROFİL raporu (gece 5/7; gerekçeler docs/curve-report.md)
  const profiles: [string, number][] = [
    ['Yoğun (aktif, verim 0.80)', 0.8],
    ['Normal (verim 0.55)', 0.55],
    ['Rahat (seyrek, verim 0.35)', 0.35],
  ];
  console.log('\n--- 3 PROFİL (milestone → süre) ---');
  const results = profiles.map(([name, eff]) => {
    const buys: Buy[] = [];
    return { name, res: runProfile(eff, false, buys), buys };
  });
  const header = 'Milestone'.padEnd(34) + ' | ' + results.map((r) => r.name.split(' ')[0].padStart(8)).join(' | ');
  console.log(header);
  for (const m of MS()) {
    const row = m.name.padEnd(34) + ' | ' +
      results.map((r) => (r.res.has(m.name) ? fmtTime(r.res.get(m.name)!) : '—').padStart(8)).join(' | ');
    console.log(row);
  }

  /* --- EN UZUN BEKLEME (D-010 §3.6'nın ikinci ölçütü) ---
     "20 dk'yı aşan tek alım kalmasın." Bekleme = iki ARDIŞIK alım arasındaki boşluk; etiketi
     boşluğu BİTİREN alımdır (oyuncu o süre boyunca ONUN için biriktiriyordu). B4 raporunun
     §7'sinde elle ölçülen bu sayı burada kalıcı bir bekçi oldu. */
  /* D-087: bu blok artık HÜKÜM VERMEZ — hüküm yukarıda, ölçüt 4'te, İdealize profilinden.
     Burası GÖZLEM BANDI: aynı eğrinin daha seyrek oynayan oyuncuda ne kadar uzadığını
     gösterir. Silinmedi, çünkü D1'in ölçtüğü asıl takas burada görünüyor: bu sayıları
     düzelten her kol Kat 1 içeriğinden %7-42 götürüyor (`docs/gec-oyun-raporu-d1.md`). */
  console.log(NL + '--- GÖZLEM BANDI: profil başına en uzun bekleme (HÜKÜM DEĞİL — ölçüt 4 yukarıda) ---');
  const WAIT_LIMIT = BEKLEME_SINIRI;
  for (const r of results) {
    const gaps = r.buys.map((b, i) => ({ ...b, gap: b.t - (i === 0 ? 0 : r.buys[i - 1].t) }));
    gaps.sort((a, b) => b.gap - a.gap);
    const worst = gaps.slice(0, 3);
    const asan = gaps.filter((g) => g.gap > WAIT_LIMIT);
    console.log(
      `  ${r.name.split(' ')[0].padEnd(7)} en uzun ${fmtTime(worst[0]?.gap ?? 0).padStart(7)} → ${worst[0]?.label ?? '—'}` +
        `   (20 dk'yı aşan: ${asan.length})`,
    );
    /* D-086 Bulgu 7 açık kalemi: ihlal SAYISI tek başına hangi basamağın pahalı olduğunu
       söylemiyor. İlk üç yerine AŞANın TAMAMI, gerçekleşme sırasıyla ve o anın darboğazıyla
       birlikte basılır — kol seçimi bu listeden yapılır, göz kararıyla değil. */
    for (const g of [...asan].sort((a, b) => a.t - b.t)) {
      console.log(
        `          @ ${fmtTime(g.t).padStart(7)}  bekleme ${fmtTime(g.gap).padStart(7)} → ${g.label}`,
      );
    }
  }

  // ÜÇ KOL tablosu (Ö5): geliri hangi tavan kelepçeliyor, ve garson/tepsi ne satın alıyor.
  console.log('\n--- ÜÇ KOL (talep / arz / TAŞIMA) — bardak/sn ---');
  const scenes: [string, Partial<State>][] = [
    ['4 masa · L2 · garson 1', { padsDone: ['table2', 'table3', 'waiter', 'table4'], stationLevels: [2], tableLevel: 0, char: { tray: 1, magnet: 0, speed: 0 }, waiterTray: 0, waiterSpeed: 0 }],
    ['8 masa · L3 · garson 1', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4'], stationLevels: [3], tableLevel: 1, char: { tray: 2, magnet: 1, speed: 0 }, waiterTray: 1, waiterSpeed: 1 }],
    ['12 masa · L6 · garson 2', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4','zone3','z3table2','waiter2','z3table3','z3table4'], stationLevels: [6], tableLevel: 4, char: { tray: 2, magnet: 1, speed: 0 }, waiterTray: 2, waiterSpeed: 1 }],
    ['12 masa · L6 · garson 3', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4','zone3','z3table2','waiter2','z3table3','z3table4','waiter3'], stationLevels: [6], tableLevel: 4, char: { tray: 2, magnet: 1, speed: 0 }, waiterTray: 2, waiterSpeed: 1 }],
    ['20 masa · L6 · garson 3', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4','zone3','z3table2','waiter2','z3table3','z3table4','waiter3','z3table5','z3table6','z3table7','z3table8','z3table9','z3table10','z3table11','z3table12'], stationLevels: [6], tableLevel: 4, char: { tray: 4, magnet: 3, speed: 3 }, waiterTray: 3, waiterSpeed: 1 }],
    /* FAZ C1: bu tablo LAVABO KOLUNU hic icermiyordu (senaryolarda `lavabo` verilmiyor, yani 0
       kalıyor) ve o yüzden geç-oyun gelirini 3,4 KAT eksik gösteriyordu — son satır 15,62 ₺/sn
       diyordu, oyunun gerçek tavanı ise 52,57. B5b'nin "gelir L6'dan sonra donuyor" bulgusu
       B4a'da kapanmıştı; tablo kapanmamış gibi göstermeye devam ediyordu. Tam kadro satırı
       lavabosuyla birlikte eklendi: darboğaz aynı (ARZ), değişen yalnız müşteri başına ₺. */
    ['20 masa · L6 · garson 3 · lavabo L6', { padsDone: ['table2','table3','waiter','table4','zone2','z2table2','z2table3','dishwasher','z2table4','zone3','z3table2','waiter2','z3table3','z3table4','waiter3','z3table5','z3table6','z3table7','z3table8','z3table9','z3table10','z3table11','z3table12','lavabo'], stationLevels: [6], tableLevel: 4, char: { tray: 4, magnet: 3, speed: 3 }, waiterTray: 3, waiterSpeed: 1, lavabo: lavaboMaxLevel() }],
  ];
  for (const [name, patch] of scenes) {
    const st: State = { t: 0, wallet: 0, lifetime: 0, stationLevels: [0], tableLevel: 0, tableLevels: [], padsDone: [],
      char: { tray: 0, magnet: 0, speed: 0 }, waiterTray: 0, waiterSpeed: 0, dishCarry: 0, dishSpeed: 0, questIdx: 0, lavabo: 0, ...patch } as State;
    const w = deriveWorld(st.padsDone);
    // Senaryo bir ANLIK GÖRÜNTÜ, bir ilerleme değil: masalar senaryonun seviyesinde doğar
    // (k2 açıkken "yeni masa L0 doğar" kuralı burada geçerli olsaydı senaryo başka bir şey ölçerdi).
    st.tableLevels = Array.from({ length: w.tables.length }, () => st.tableLevel);
    const b = brewTimeOf(st);
    const demand = openSeats(w, st) / (C.npc.walkTime + b + C.npc.eatTime);
    console.log(
      `  ${name.padEnd(24)} yol ${avgServeDist(w.tables.length, w.areasOpen).toFixed(1).padStart(5)} br · ` +
        `talep ${demand.toFixed(2)} · arz ${(1 / b).toFixed(2)} · taşıma ${carryRateOf(st).toFixed(2)} → ` +
        `darboğaz ${bindingArm(st).toUpperCase()} · gelir ${rate(st).toFixed(2)} ₺/sn`,
    );
  }

  console.log('\n--- Servis kapasitesi (bilgi) ---');
  console.log(
    `Garson havuzu (ilk ₺${C.pads.find((p) => p.id === 'waiter')?.cost}): hız ${C.waiter.speedUpgrades.speeds.join('→')} br/sn (₺${C.waiter.speedUpgrades.costs.join('/')}; panel), tepsi 1+kademe (₺${C.waiter.trayUpgrades.costs.join('/')}). ` +
      `Servis merdiveni: ₺${(C.service.upgrade.costsByLevel ?? []).join('/')} (L4 tezgâh, L5 tost).`,
  );
}

/* Giris: SIMKOL yoksa TABAN (eski cikti birebir korunur — bekci bunu denetler).
 * SIMKOL=karsilastir  → rapor tablosu · SIMKOL=k1b vb. → o kolla tam cikti. */
/* Giris: SIMKOL yoksa YURURLUKTEKI model (D-086 = k1b + k2).
 * SIMKOL=eski  -> C5 oncesi model · SIMKOL=karsilastir -> kol tablosu. */
export function anaKosu(): void {
  const SECIM = process.env.SIMKOL ?? '';
  if (SECIM === 'karsilastir') { karsilastir(); return; }
  if (SECIM) {
    if (!KOLLAR[SECIM]) {
      console.error(`Bilinmeyen kol: ${SECIM} (gecerli: ${Object.keys(KOLLAR).join(', ')})`);
      process.exit(1);
    }
    kolAyarla(KOLLAR[SECIM]);
    console.log(`### MODEL KOLU: ${SECIM} ###
`);
  }
  run();
}

/* Kutuphane olarak import edildiginde KOSMAZ — yalniz DOGRUDAN calistirilinca kosar.
 * (Once yalniz VITEST bakiliyordu; D1'in `olcum-gec-oyun.ts` tarayicisi da bu dosyayi
 * import ediyor ve import aninda 4 sn'lik tam kosuyu tetiklememeli.) */
const dogrudanCalisti = (() => {
  const arg = process.argv[1];
  if (!arg) return false;
  return import.meta.url === pathToFileURL(arg).href;
})();
if (!process.env.VITEST && dogrudanCalisti) anaKosu();
