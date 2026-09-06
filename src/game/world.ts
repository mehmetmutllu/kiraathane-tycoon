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

// ============================== SERVİS ↔ ALAN BAĞI ==============================
// B1'de her alanın kendi servis noktası var (bugünkü içerik: 3 alan = 3 servis, 1:1).
// B2 bu listeyi TEK servise indirir ([0] olur) — o zaman `serviceInArea` her alan için 0 döner
// ve alan açmak artık servis açmaz. Bağı sabit bir liste olarak yazmak, "servis index'i = alan
// index'i" varsayımının koda dağılmasını engeller.

/** Servis noktası s hangi alanda duruyor. */
export const SERVICE_AREAS: readonly number[] = [0, 1, 2];

/**
 * Servis noktasının ÜRÜNÜ (M3 ürün hattı): tek ürün üretir. Çay fiyatı sabit kalır; tost ikinci
 * hat — pahalı + yavaş (throughput matematiği aynı, sabitler farklı).
 * B2'de bu liste kalkar: ürün servisin SEVİYESİNDEN gelir (L5 = tost).
 */
export const SERVICE_PRODUCTS: readonly ProductId[] = ['tea', 'tea', 'tost'];

export const MAX_SERVICES = SERVICE_AREAS.length;

/** Servis noktasının ürünü (sınır dışı index → son servisin ürünü; savunmacı). */
export function serviceProduct(s: number): ProductId {
  return SERVICE_PRODUCTS[Math.min(Math.max(s, 0), SERVICE_PRODUCTS.length - 1)];
}

/** Alandaki servis noktasının index'i; alanda servis yoksa −1. */
export function serviceInArea(area: number): number {
  return SERVICE_AREAS.indexOf(area);
}

/** Alanın VARSAYILAN zemin teması (Y1 yemek alanı kimliği): tost alanı 'yemek' fayansıyla doğar. */
export function defaultFloorTheme(area: number): string {
  const s = serviceInArea(area);
  return s >= 0 && serviceProduct(s) === 'tost' ? 'yemek' : 'parke';
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

/** Masa slotuna servis veren noktanın index'i. */
export function serviceOfTable(tableIndex: number): number {
  return Math.max(0, serviceInArea(areaOfTable(tableIndex)));
}

// ============================== DÖRT KAVRAM ==============================

/** ALAN — mekânsal bölge. Zemin/duvar teması, sınırları ve açık/kapalı durumu ona aittir. */
export interface Area {
  index: number;
  open: boolean;
}

/** SERVİS — servis noktası: ocak/tezgâh + bulaşık köşesi + o noktanın personeli. */
export interface Service {
  index: number;
  /** Hangi alanda duruyor (B1: alanla 1:1; B2'de tek servis tüm alanlara bakar). */
  areaIndex: number;
  open: boolean;
  product: ProductId;
  /** Tutulmuş garson sayısı (0..2). */
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
  const services: Service[] = SERVICE_AREAS.map((areaIndex, index) => ({
    index,
    areaIndex,
    open: areaIndex < areasOpen,
    product: serviceProduct(index),
    waiters: 0,
    hasDishwasher: false,
  }));
  // Açık alan en az 1 masayla doğar (alan açılışı otomatik masa getirir).
  const tablesByArea: number[] = areas.map((a) => (a.open ? 1 : 0));

  // 2. geçiş: pad etkileri. Pad MEKÂNSAL olarak bir alanda durur; personel etkisi o alanın
  // servis noktasına gider (B2'de tek servise akacak yol budur).
  for (const id of padsDone) {
    const pad = byId.get(id);
    if (!pad) continue;
    const area = pad.area ?? 0;
    if (area >= areasOpen) continue;
    const svc = services[serviceInArea(area)];
    switch (pad.effect.type) {
      case 'addTable':
        tablesByArea[area] = Math.min(TABLES_PER_AREA, tablesByArea[area] + 1);
        break;
      case 'hireWaiter':
        if (svc) svc.waiters = Math.min(2, svc.waiters + 1); // Y4: servis başına en çok 2 garson
        break;
      case 'hireDishwasher':
        if (svc) svc.hasDishwasher = true;
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
      tables.push({ index, areaIndex: a, serviceIndex: Math.max(0, serviceInArea(a)) });
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
