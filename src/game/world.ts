/**
 * world.ts — DÜNYA MODELİ: **ALAN · SERVİS · MASA · ODA** (Faz B1).
 *
 * Faz B1'e kadar bu dördü TEK bir `zone` index'inin içinde iç içeydi: bir `zone` aynı anda
 * hem mekânsal bölge, hem servis noktası (ocak + bulaşık + personel), hem de 4'lük masa
 * grubuydu. Maket v13 bu birlikteliği bozuyor (D-058):
 *   - 2. Alan'ın **ocağı yok** → alan açmak servis açmak demek değil.
 *   - 3. Alan masa getirmiyor, **servis noktasını tezgâha çeviriyor** → servis kendi merdivenini
 *     alanlardan bağımsız çıkar.
 *   - Lavabo/merdiven **ODA**: oturma eklemez, alan da değildir.
 * Bu yüzden ÖNCE model ayrışır (B1, içerik sabit — davranış parmak izi birebir aynı kalır),
 * SONRA içerik değişir (B2: servis tekilleşir · B3: yerleşim · B4: odalar · B5: masa tipleri).
 *
 * Burada oyun DURUMU tutulmaz: `deriveWorld(padsDone)` saf bir türetmedir (D-015 — `padsDone`
 * tek doğru kaynak). Koordinat da yoktur; o `layout.ts`'in işidir.
 */
import {
  economyConfig,
  MAX_AREAS,
  TABLES_PER_AREA,
  type PadDef,
  type ProductId,
} from '../config/economy.config';

export { MAX_AREAS, TABLES_PER_AREA };

// ============================== SERVİS: TEK NOKTA ==============================
// B2 (D-060): üç ocak TEK servis noktasına indi. Maket v13'te kat boyunca bir tane servis vardır;
// 2. Alan'ın ocağı YOKTUR ve 3. Alan yeni ocak değil, var olanın TEZGÂHA dönüşmesidir.
// B1 bu ayrımın zeminini kurmuştu: "servis hangi alanda duruyor" ile "masaya kim servis veriyor"
// B1'de iki ayrı soru oldu — bugün cevapları ayrışıyor:
//   serviceOfTable(t) → katın TEK servisi hepsine bakar (ÜRETİM sorusu — burada, world'de)
//   serviceInArea(a, areasOpen) → servisin o an DURDUĞU alan (YERLEŞİM sorusu — layout.ts'te)
// B3-1 (D-062): yerleşim sorusunun cevabı ARTIK SABİT DEĞİL (3. Alan açılınca servis arka banda
// taşınır), yani bir koordinat sorusudur → `SERVICE_AREAS` listesi world'den kalktı, cevabı
// `layout.servicePlace(areasOpen)` veriyor. World "ne", layout "nerede" sorusuna bakar.

/** Katın servis noktası sayısı: BİR (B2). */
export const MAX_SERVICES = 1;

/** GLOBAL garson havuzunun tavanı (B2: alan başına değil, kat çapında). */
export const MAX_WAITERS = economyConfig.waiter.maxWaiters;

/** Katın tek servis noktası. "0" sabitini koda dağıtmamak için adı var. */
export const THE_SERVICE = 0;

/**
 * ÜRÜN ARTIK SEVİYEDEN GELİR (B2 — eski `SERVICE_PRODUCTS` listesi kalktı).
 * Tek merdiven, iki kimlik (plan §4): L1-L3 çay ocağı · **L4 TEZGÂH** (obje yerini ve görünümünü
 * değiştirir, seviye sıfırlanmaz) · **L5 TOST AÇILIR** · L6 son ₺ seviyesi.
 * Eskiden tost ÜÇÜNCÜ BÖLGENİN ürünüydü (`SERVICE_PRODUCTS = ['tea','tea','tost']`) — yani alanı
 * açmak ürünü açıyordu. Artık alan ile ürünün hiçbir ilgisi yok.
 */
export const COUNTER_LEVEL = economyConfig.service.counterLevel; // L4: ocak → tezgâh
export const TOST_LEVEL = economyConfig.service.tostLevel; // L5: tost açılır

/** Servis noktası TEZGÂH mı (L4+), yoksa hâlâ derme çatma çay ocağı mı? */
export const isCounter = (level: number): boolean => level >= COUNTER_LEVEL;

/** Bu seviyede tost satılıyor mu (L5+)? */
export const sellsTost = (level: number): boolean => level >= TOST_LEVEL;

/** Servis noktasının MENÜSÜ: seviye ne kadar ürün açtıysa o. */
export function serviceMenu(level: number): ProductId[] {
  return sellsTost(level) ? ['tea', 'tost'] : ['tea'];
}

/**
 * Gelen müşterinin TOST isteme olasılığı (0..1). Sipariş nesnesi `{çay:1, tost:2}` Faz C'de
 * (D-058 karar 1) — B2 yalnız talebin doğduğu yeri kurar: müşteri otururken ürününü SEÇER,
 * oran tezgâh seviyesinden gelir. L5 tost açar (%25), L6 tost arzını genişletir (%35).
 */
export function tostShare(level: number): number {
  const t = economyConfig.service.tostShareByLevel;
  return t[Math.min(Math.max(level, 0), t.length - 1)] ?? 0;
}

/** Alanın VARSAYILAN zemin teması. B2: tost artık alana ait değil → her alan parke doğar
 *  (yemek fayansı mağazada duruyor; servis bloğunun zemini B3 yerleşiminin işi). */
export function defaultFloorTheme(_area: number): string {
  return 'parke';
}

/**
 * Masa slotunun alanı. Masa slotları GLOBAL index'lidir (alan a → slotlar
 * [a*TABLES_PER_AREA, a*TABLES_PER_AREA+4)); açılış sırası gating'le katı olduğundan açık
 * index'ler DAİMA bitişiktir. B5'te masa tipleri gelince bu formül yerini `world.tables`
 * listesine bırakır — bugün zaten türetmenin kendisi listeyi üretiyor.
 */
export function areaOfTable(tableIndex: number): number {
  return Math.min(MAX_AREAS - 1, Math.floor(tableIndex / TABLES_PER_AREA));
}

/** Masaya kim servis veriyor: katın TEK servisi (ÜRETİM sorusu — alanla ilgisi yok). */
export function serviceOfTable(_tableIndex: number): number {
  return THE_SERVICE;
}

// ============================== DÖRT KAVRAM ==============================

/** ALAN — mekânsal bölge. Zemin/duvar teması, sınırları ve açık/kapalı durumu ona aittir. */
export interface Area {
  index: number;
  open: boolean;
}

/** SERVİS — katın tek servis noktası: ocak/tezgâh + bulaşık köşesi + GLOBAL personel havuzu.
 *  B3-1: `areaIndex` KALKTI — servisin hangi alanda durduğu artık sabit değil (3. Alan açılınca
 *  arka banda taşınır) ve bir KOORDİNAT sorusudur: `layout.servicePlace(areasOpen).areaIndex`. */
export interface Service {
  index: number;
  open: boolean;
  /** Bu seviyede satılan ürünler (B2: seviyeden türer — L5'te tost eklenir). */
  menu: ProductId[];
  /** Tutulmuş garson sayısı — GLOBAL havuz (0..MAX_WAITERS). */
  waiters: number;
  hasDishwasher: boolean;
}

/** MASA — açık masa slotu. Alanı ve servisini AYRI taşır (eskiden ikisi de `zone`'du). */
export interface Table {
  /** GLOBAL masa index'i (tableLevels/npc.tableIndex ile aynı uzay). */
  index: number;
  areaIndex: number;
  serviceIndex: number;
}

/** ODA türleri (B4): lavabo pasif çarpan, merdiven bugün yalnız konuşur ("Kat 2 çok yakında"). */
export type RoomKind = 'lavabo' | 'merdiven';

/** ODA — oturma eklemeyen, kendi başına duran hacim. B4'e kadar liste boştur. */
export interface Room {
  id: string;
  kind: RoomKind;
  areaIndex: number;
  open: boolean;
}

/** `padsDone`'dan TÜRETİLEN dünya (D-015). Bu alanların hiçbiri ayrıca saklanmaz. */
export interface World {
  /** Açık alan sayısı (1 = yalnız 1. alan). */
  areasOpen: number;
  areas: Area[];
  /** TÜM servis noktaları (kapalı olanlar da; `open` ile ayrılır). */
  services: Service[];
  /** Yalnız AÇIK masalar, global index sırasında (bitişik). */
  tables: Table[];
  /** Odalar (B4'e kadar boş). */
  rooms: Room[];
}

// ============================== TÜRETME ==============================

/**
 * D-015: `padsDone` TEK doğru kaynak; masa/servis/personel buradan TÜRETİLİR → masa sayacı ile
 * pad listesi gibi alanlar yapısal olarak DESENKRONİZE OLAMAZ.
 */
export function deriveWorld(padsDone: readonly string[]): World {
  const byId = new Map<string, PadDef>((economyConfig.pads as readonly PadDef[]).map((p) => [p.id, p]));

  // 1. geçiş: alan açılışları (kapalı alanın pad etkisi sayılmaz — bozuk kayda karşı savunma).
  let areasOpen = 1;
  for (const id of padsDone) {
    const pad = byId.get(id);
    if (pad && pad.effect.type === 'unlockArea') areasOpen = Math.min(MAX_AREAS, areasOpen + 1);
  }

  const areas: Area[] = Array.from({ length: MAX_AREAS }, (_, i) => ({ index: i, open: i < areasOpen }));
  // Servis noktası kattaki TEK üretim yeri; menüsü seviyeden gelir (seviye türetmenin girdisi
  // değil — `stationLevels` ayrı bir durum; menü okunurken `serviceMenu(level)` çağrılır).
  const services: Service[] = Array.from({ length: MAX_SERVICES }, (_, index) => ({
    index,
    open: true, // 1. alan hep açık → servis de hep açık (kat servissiz başlamaz)
    menu: ['tea'],
    waiters: 0,
    hasDishwasher: false,
  }));
  // Açık alan en az 1 masayla doğar (alan açılışı otomatik masa getirir).
  const tablesByArea: number[] = areas.map((a) => (a.open ? 1 : 0));

  // 2. geçiş: pad etkileri. Pad MEKÂNSAL olarak bir alanda durur ama PERSONEL GLOBAL havuza gider
  // (B2): garsonu nerede tuttuğunun, kime servis vereceğiyle ilgisi yok. B1'de bu satır
  // `services[serviceInArea(area)]` idi — pad'in alanı personelin sahibini belirliyordu.
  const svc = services[THE_SERVICE];
  for (const id of padsDone) {
    const pad = byId.get(id);
    if (!pad) continue;
    const area = pad.area ?? 0;
    if (area >= areasOpen) continue;
    switch (pad.effect.type) {
      case 'addTable':
        tablesByArea[area] = Math.min(TABLES_PER_AREA, tablesByArea[area] + 1);
        break;
      case 'hireWaiter':
        svc.waiters = Math.min(MAX_WAITERS, svc.waiters + 1);
        break;
      case 'hireDishwasher':
        svc.hasDishwasher = true;
        break;
    }
  }

  // Global masa index'leri BİTİŞİK kalmalı: bir alan açıksa ÖNCEKİ alanlar yapısal olarak doludur
  // (her alan pad'i öncekinin 4. masasını ister). Bozuk kayda karşı kelepçe — yoksa slot atlanır,
  // index kayardı.
  for (let a = 0; a < areasOpen - 1; a++) tablesByArea[a] = TABLES_PER_AREA;

  const tables: Table[] = [];
  for (let a = 0; a < MAX_AREAS; a++) {
    for (let k = 0; k < tablesByArea[a]; k++) {
      const index = a * TABLES_PER_AREA + k;
      tables.push({ index, areaIndex: a, serviceIndex: THE_SERVICE });
    }
  }

  return { areasOpen, areas, services, tables, rooms: [] };
}

// ============================== OKUMA YARDIMCILARI ==============================
// Sistemler dünyaya bu adlarla sorar; hiçbiri "servis index'i = alan index'i" varsaymaz.

/** Açık masa sayısı. */
export const tableCount = (w: World): number => w.tables.length;

/** Alandaki açık masa sayısı. */
export function tablesInArea(w: World, area: number): number {
  let n = 0;
  for (const t of w.tables) if (t.areaIndex === area) n++;
  return n;
}

/** Açık servis noktası sayısı. */
export function openServiceCount(w: World): number {
  let n = 0;
  for (const s of w.services) if (s.open) n++;
  return n;
}

/** Servis noktasında kaç garson var (kapalıysa 0). */
export const waitersAt = (w: World, service: number): number => (w.services[service]?.open ? w.services[service].waiters : 0);

/** Servis noktasında bulaşıkçı var mı. */
export const hasDishwasherAt = (w: World, service: number): boolean => !!w.services[service]?.open && w.services[service].hasDishwasher;
