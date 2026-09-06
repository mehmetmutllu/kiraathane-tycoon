/**
 * rules.ts — OYUN KURALLARI: gating, görev motoru, yükseltme/ekonomi türetmeleri, bildirim anahtarları.
 *
 * Faz A2'de store.ts'ten ayrıldı. Burada oyun DURUMU tutulmaz; hepsi saf fonksiyon veya sabittir
 * (girdi: anlık görüntü, çıktı: değer). Böylece tick sistemleri (tick.ts) ve store aynı kuralları
 * tek yerden okur. store.ts bu modülü yeniden dışa aktarır (eski `from './store'` importları çalışır).
 */
import type { Dish, Npc } from './types';
import {
  economyConfig as C,
  upgradeOutputMultiplier,
  upgradeCost,
  requiresMet,
  tableUpgradeCost,
  tableSeats,
  MAX_ZONES,
  TABLES_PER_ZONE,
  PRODUCTS,
  zoneProduct,
  charNextCost,
  waiterTrayNextCost,
  waiterSpeedNextCost,
  type PadDef,
  type GateState,
  type QuestDef,
  type QuestTarget,
  type Requires,
  type CharUpgrades,
  type WaiterUpgrades,
} from '../config/economy.config';
import type { SaveStats } from './save';
import { LAYOUT, ZONE_DZ, zoneRow, type RVec3 } from './layout';

// DWELL kanonik dolum-noktası id'leri (D-018 §2): pad'ler kendi id'sini kullanır; bunlar yükseltme
// noktaları. Zone'lu öneklerdir: gerçek id = önek + index ('tea:0', 'tableUp:5').
// (v29: 'waiterUp:' kalktı — garson hızı karakter panelinden satın alınır.)
export const FILL_TEA = 'tea:'; // + zone index
export const FILL_TABLE = 'tableUp:'; // + GLOBAL masa index

/** Zone z'nin garson pad id'si (per-zone personel; z>0 → 'z2waiter'/'z3waiter'). */
export const waiterPadId = (z: number) => (z === 0 ? 'waiter' : `z${z + 1}waiter`);

/** Zone z'nin çay-yükseltme noktası açık mı? (v21: her salonun KENDİ 2. masası önkoşul —
 *  upgradeRequiresByZone; zone-1 deseni aynalanır, "önce kapasite sonra verim".) */
export function upgradeZoneUnlockedZ(z: number, g: GateState): boolean {
  return requiresMet(C.teaStation.upgradeRequiresByZone[z], g);
}

/** Zone z'nin masa yükseltmeleri açık mı? (v21: o salonun 4 masası da açılınca — per-zone D-019 §3.) */
export function tableUpgradeUnlockedZ(z: number, g: GateState): boolean {
  return requiresMet(C.tables.upgradeRequiresByZone[z], g);
}

// KİMLİK KORUMA (P0 perf, 2026-09-06). `tick()` her karede diziyi/nesneyi kopyalayıp tek `set()`
// ile yazıyordu → içerik AYNI olsa bile referans değişiyor, Zustand seçicileri "değişti" sanıp
// abone bileşeni her karede yeniden render ediyordu. Ölçüm (1920×1080, 3 salon, 14 NPC):
// kare başına 3,2 React commit; 12 anahtar (`tableLevels`, `stationLevels`, `stats`, `quest`,
// `dishes`, `upgradeFills`, ...) karelerin %100'ünde SADECE kimlik değiştiriyordu.
// Çözüm: set'ten hemen önce, içeriği eskisiyle aynı olan değeri ESKİ referansa geri döndür.
// Karşılaştırma sınırlı derinlikte (dizi → aktör nesnesi → pos dizisi → sayı) ve yalnız `tick`
// yükünde çalışır; maliyeti tek bir gereksiz React render'ından ucuzdur.
export function sameDeep(a: unknown, b: unknown, depth = 4): boolean {
  if (a === b) return true;
  if (depth <= 0) return false;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const aArr = Array.isArray(a);
  if (aArr !== Array.isArray(b)) return false;
  if (aArr) {
    const x = a as unknown[];
    const y = b as unknown[];
    if (x.length !== y.length) return false;
    for (let i = 0; i < x.length; i++) if (!sameDeep(x[i], y[i], depth - 1)) return false;
    return true;
  }
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  for (const k of ka) {
    if (!(k in bo)) return false;
    if (!sameDeep(ao[k], bo[k], depth - 1)) return false;
  }
  return true;
}

/** set() yükündeki DEĞİŞMEMİŞ değerleri eski referansa çevirir (yerinde). */
export function keepIdentity<T extends Record<string, unknown>>(prev: Record<string, unknown>, next: T): T {
  const patch = next as Record<string, unknown>;
  for (const k in patch) {
    const v = patch[k];
    if (v !== null && typeof v === 'object' && v !== prev[k] && sameDeep(v, prev[k])) patch[k] = prev[k];
  }
  return next;
}

export const SAVE_INTERVAL = 2; // sn
export const NPC_COLORS = ['#c0392b', '#27ae60', '#2980b9', '#8e44ad', '#d35400', '#16a085'];


// EKONOMİ v2 (D-010): çay fiyatı SABİT; seviye fiyatı değil throughput'u (çay/dk) artırır.
export const TEA_PRICE = C.teaStation.basePrice;
// Bulaşık öğretilmeden kirli bardak çıkmaz (onboarding gate, 2026-06-10): ilk washDish görevinin index'i.
// Görev hattında yoksa -1 → gate hep açık (questIndex >= -1).
export const WASH_QUEST_INDEX = C.quests.findIndex((q) => q.target.type === 'washDish');

// Görev geçiş ritmi (2026-06-17, kullanıcı onayı): hedef tamamlanınca kart ANINDA takas
// olmaz. completing = bar %100 dolar + yeşil onay flash'ı; gap = yeni görev gelmeden boşluk.
// Böylece "bitti → ara → yeni" net hissedilir (eski: aynı tick'te instant swap).
export const QUEST_COMPLETE_DUR = 0.5;
export const QUEST_GAP_DUR = 0.8;

/** stationLevel'in demleme hız (throughput) çarpanı — çay/dk; fiyatı DEĞİL. */
export function brewThroughputMult(level: number): number {
  return upgradeOutputMultiplier(C.teaStation.upgrade, level);
}

/** Bir birim ürünün hazırlanma süresi (sn) — throughput arttıkça kısalır. prepTime verilmezse çay
 *  (geri uyum: eski çağıranlar/testler); tost zone'u PRODUCTS.tost.prepTime geçer (M3). */
export function brewTime(level: number, prepTime: number = C.npc.orderTime): number {
  return prepTime / brewThroughputMult(level);
}

/** GLOBAL bardak havuzu kapasitesi: açık zone başına taban + açık ocak seviyeleri toplamı (Faz 3a). */
export function totalCupPool(zonesOpen: number, stationLevels: number[]): number {
  let lv = 0;
  for (let z = 0; z < zonesOpen; z++) lv += stationLevels[z] ?? 0;
  return zonesOpen * C.cups.poolBase + C.cups.poolPerLevel * lv;
}

/** ₺ ile çıkılabilen en yüksek masa seviyesi (💎 "Usta" katmanı Faz D'de gelecek). */
export const tableSoftMaxLevel = () => C.tables.upgrade.maxLevel;

/**
 * Masa teması mağazası kilidi (kullanıcı kararı 2026-06-17): 3 salon AÇIK **VE** tüm açık masalar
 * MAX seviye olunca açılır ("seviyeler fullenince"). Başta masalar renksiz (native mavi); tüm ilerleme
 * tamamlanınca premium renk teması satın alınabilir. Zemin/duvar temaları bu kilitten etkilenmez.
 */
export function tableThemeUnlocked(g: { zonesOpen: number; tables: number; tableLevels: number[] }): boolean {
  if (g.zonesOpen < MAX_ZONES || g.tables <= 0) return false;
  const max = tableSoftMaxLevel();
  for (let i = 0; i < g.tables; i++) if ((g.tableLevels[i] ?? 0) < max) return false;
  return true;
}
/** Mevcut seviyeden bir sonraki masa yükseltmesinin maliyeti (₺). */
export const tableNextCost = (level: number, zone = 0) => tableUpgradeCost(level, zone);
/** Zone-1 masa yükseltme gate'i (geri uyum: testler/eski çağıranlar; per-zone için tableUpgradeUnlockedZ). */
export function tableUpgradeZoneUnlocked(g: GateState): boolean {
  return tableUpgradeUnlockedZ(0, g);
}

/** Çevrimdışı gelir oranı (₺/sn) — bottleneck idealize: oturma × ürün fiyatı / döngü.
 *  M3: zone verilirse o zone'un ÜRÜNÜ (tost pahalı+yavaş) hesaba girer.
 *  2026-06-11 (kullanıcı): masa BAHŞİŞLERİ de orana dahil — tipTotal = o zone'un açık masalarının
 *  Σ(tipBase × seviye); ilerleme (masa yükseltme) offline kazancı da büyütür. */
export function incomeRate(tables: number, level: number, z = 0, tipTotal = 0): number {
  const prod = PRODUCTS[zoneProduct(z)];
  const cycle = C.npc.walkTime + brewTime(level, prod.prepTime) + C.npc.eatTime;
  return (tables * prod.price + tipTotal) / cycle;
}

/**
 * Kirli masaların index kümesi (D-019): bir masada eşikten FAZLA (>) kirli kap varsa kirli.
 * Y2: eşik KOLTUKLA ölçeklenir (`dirtyThreshold × koltuk` — plan §2; yoksa 4 kişilik tek grup
 * masayı anında kilitlerdi; L0'da eski davranışla birebir aynı: >2).
 * Kirli masaya yeni müşteri oturmaz + garson çay götürmez → oyuncu eşiğe inene kadar masa kilitli.
 */
export function dirtyTables(dishes: Dish[], tableLevels: number[] = []): Set<number> {
  const counts = new Map<number, number>();
  for (const d of dishes) counts.set(d.tableIndex, (counts.get(d.tableIndex) ?? 0) + 1);
  const dirty = new Set<number>();
  for (const [idx, n] of counts)
    if (n > C.cups.dirtyThreshold * tableSeats(tableLevels[idx] ?? 0)) dirty.add(idx);
  return dirty;
}

/** Masa-başı DOLU koltuk indeksleri (leaving sayılmaz — koltuk kalkar kalkmaz boşalır, Y2). */
export function occupiedSeats(npcs: Npc[]): Map<number, Set<number>> {
  const occ = new Map<number, Set<number>>();
  for (const n of npcs) {
    if (n.state === 'leaving') continue;
    let set = occ.get(n.tableIndex);
    if (!set) {
      set = new Set();
      occ.set(n.tableIndex, set);
    }
    set.add(n.seatIndex);
  }
  return occ;
}

/** Grup hedefi (Y2, plan §2 + dağılım fix'i): zone'lar ROUND-ROBIN pay alır — global "en çok
 *  boş koltuk" araması, az koltuklu yeni salonu (tost L0=1 koltuk) çay salonlarına karşı sürekli
 *  kaybettirip AÇ bırakıyordu (q_tost5 ilerleyemiyordu). startZone'dan başlayarak boş koltuğu
 *  olan İLK zone seçilir; zone İÇİNDE en çok boş koltuklu temiz masa (eşitlikte düşük index).
 *  Hiç boş koltuk yoksa -1. */
export function findTableForGroup(
  occ: Map<number, Set<number>>,
  tables: number,
  dirty: Set<number>,
  tableLevels: number[],
  zonesOpen: number,
  startZone: number,
): number {
  for (let dz = 0; dz < zonesOpen; dz++) {
    const z = (startZone + dz) % zonesOpen;
    let best = -1;
    let bestFree = 0;
    const end = Math.min((z + 1) * TABLES_PER_ZONE, tables);
    for (let i = z * TABLES_PER_ZONE; i < end; i++) {
      if (dirty.has(i)) continue;
      const free = tableSeats(tableLevels[i] ?? 0) - (occ.get(i)?.size ?? 0);
      if (free > bestFree) {
        bestFree = free;
        best = i;
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

/** Oyuncunun o an üstünde durduğu/doldurduğu zone (HUD'da alttaki bar). */
export interface ActiveZone {
  kind: 'pad' | 'upgrade';
  label: string;
  fill: number;
  cost: number;
}

/** Yeni-özellik bildirimi (D-019 §4): bir özellik İLK kez açılınca beliren kısa toast (ttl = kalan sn).
 *  kind → HUD'daki SVG rozeti seçer (emoji yok — UI game-feel kuralı). */
export interface GameNotice {
  text: string;
  ttl: number;
  kind: 'quest' | 'level' | 'reveal';
  /** Görev ödülü (₺; M1): toast'ta coin ikonu + tutar olarak gösterilir (₺ sembolü display'de yok). */
  reward?: number;
}

/**
 * Şu an açık olan "yeni-özellik" reveal anahtarları (D-019 §4) — v21'den beri ZONE-BAŞINA
 * (kullanıcı 2026-06-12: zone-2 yükseltmeleri de düzenli açılsın + bildirilsin). Bir anahtar
 * revealSeen'de YOKKEN belirirse toast + kamera panı tetiklenir. revealSeen baseline init'te
 * mevcut açık özelliklerle kurulur → yeniden yüklemede zaten açık olanlar tekrar bildirmez.
 * Dönen üçlü: [anahtar, metin, pan hedefi (null = pan yok)].
 */
export function revealKeys(
  g: GateState,
  zonesOpen: number,
  stationLevels: number[],
): [string, string, RVec3 | null][] {
  const out: [string, string, RVec3 | null][] = [];
  const pre = (z: number) => (z === 0 ? '' : `Salon ${z + 1}: `);
  for (let z = 0; z < zonesOpen; z++) {
    if (upgradeZoneUnlockedZ(z, g) && (stationLevels[z] ?? 0) < stationSoftMaxLevel())
      out.push([`upgrade:${z}`, `Yeni: ${pre(z)}Çay ocağını yükseltebilirsin ☕`, LAYOUT.upgradeZones[z]]);
    if (tableUpgradeUnlockedZ(z, g))
      out.push([`tableUp:${z}`, `Yeni: ${pre(z)}Masaları yükseltebilirsin 🪑`, LAYOUT.tables[z * TABLES_PER_ZONE].upgradeSpot]);
  }
  for (const op of availableOptionalPads(g)) out.push([`opt:${op.id}`, `Yeni: ${op.label} 🔓`, null]);
  return out;
}

/**
 * Şu an aktif OMURGA pad'i: ilk açılmamış, opsiyonel OLMAYAN, `requires` koşulu karşılanan pad.
 * Opsiyonel pad'ler (ör. garson) atlanır → alınmasalar da omurga (sonraki masa/ocak) açılmaya
 * devam eder. Önkoşul zinciri (prev) sayesinde sıralıdır; sonraki gate'liyse null döner.
 */
export function currentPad(g: GateState): PadDef | null {
  return (C.pads as readonly PadDef[]).find(
    (p) => !p.optional && !g.padsDone.includes(p.id) && requiresMet(p.requires, g),
  ) ?? null;
}

/**
 * Şu an alınabilir opsiyonel pad'ler (garson vb.): açılmamış, `optional:true`, koşulu karşılanan.
 * Omurgadan bağımsız; oyuncu isterse alır. Aynı anda omurga pad'iyle birlikte aktif olabilir.
 */
export function availableOptionalPads(g: GateState): PadDef[] {
  return (C.pads as readonly PadDef[]).filter(
    (p) => p.optional && !g.padsDone.includes(p.id) && requiresMet(p.requires, g),
  );
}

/** Zone-1 istasyon yükseltme gate'i (geri uyum: testler/eski çağıranlar; per-zone için upgradeZoneUnlockedZ). */
export function upgradeZoneUnlocked(g: GateState): boolean {
  return upgradeZoneUnlockedZ(0, g);
}

// ============================== QUEST MOTORU (2026-06-09) ==============================
// İlerleme sıralı TEK görevle yönlendirilir (Fable brief §1+§4; eski nextStep + onboardingHint
// koç bandının yerini alır). Sayaç görevleri questBase'ten DELTA sayılır; durum görevleri
// (pad/level) doğrudan oyun durumundan okunur.

/** Quest değerlendirme bağlamı (salt-okunur anlık görüntü). */
export interface QuestCtx {
  padsDone: string[];
  /** Zone başına ocak seviyesi (v27: zone'lu stationLevel görevleri — "Salon 2'nin ocağını yükselt"). */
  stationLevels: number[];
  tableLevels: number[];
  stats: SaveStats;
  questBase: number;
  /** Karakter yükseltme kademeleri (v20; charStat görevleri için). */
  charUpgrades: CharUpgrades;
  /** Garson tepsi kademeleri (v27/Y3; waiterTray görevleri için). */
  waiterUpgrades: WaiterUpgrades;
}

/** Sayaç hedefinin baktığı kümülatif sayaç değeri (durum hedefleri için null). */
export function questCounterValue(target: QuestTarget, stats: SaveStats): number | null {
  switch (target.type) {
    case 'pickupTea': return stats.teaPickups;
    case 'serveTea':
      // zone'lu hedef (v23): yalnız o salonun el servisi sayılır ("Yeni salonda 5 çay" gerçek olsun).
      return target.zone != null ? stats.teasServedByZone[target.zone] ?? 0 : stats.teasServed;
    case 'collectCoin': return stats.coinsCollected;
    case 'washDish': return stats.dishesWashed;
    default: return null;
  }
}

/** Görev hedefi karşılandı mı? */
export function questTargetMet(target: QuestTarget, ctx: QuestCtx): boolean {
  const counter = questCounterValue(target, ctx.stats);
  if (counter != null) {
    const count = (target as { count: number }).count;
    return counter - ctx.questBase >= count;
  }
  switch (target.type) {
    case 'pad': return ctx.padsDone.includes(target.id);
    case 'stationLevel': return (ctx.stationLevels[target.zone ?? 0] ?? 0) >= target.level;
    case 'waiterSpeed':
      return (target.kind === 'tea' ? ctx.waiterUpgrades.teaSpeed : ctx.waiterUpgrades.tostSpeed) >= target.tier;
    case 'tableLevel': return ctx.tableLevels.some((l) => l >= target.level);
    case 'tablesAtLevel': {
      // zone verilirse yalnız o salonun masa slotları; verilmezse tüm masalar (v27 çeşitlilik).
      const lvls = target.zone != null
        ? ctx.tableLevels.slice(target.zone * TABLES_PER_ZONE, (target.zone + 1) * TABLES_PER_ZONE)
        : ctx.tableLevels;
      return lvls.filter((l) => (l ?? 0) >= target.level).length >= target.count;
    }
    case 'waiterTray':
      return (target.kind === 'tea' ? ctx.waiterUpgrades.teaTray : ctx.waiterUpgrades.tostTray) >= target.tier;
    case 'charStat': return ctx.charUpgrades[target.stat] >= target.tier;
    default: return false;
  }
}

/** HUD görev barı görünümü (transient; her tick türetilir). */
export interface QuestView {
  id: string;
  title: string;
  /** Görev hedefi (HUD görev fotoğrafı hedef tipine göre seçilir). */
  target: QuestTarget;
  /** Sayaç görevlerinde ilerleme (cur/total); durum görevlerinde null. */
  cur: number | null;
  total: number | null;
  /** Pad görevlerinde maliyet (görev barında gösterilir). */
  cost: number | null;
  /** Tamamlama ödülü (₺; M1) — görev kartında coin rozetiyle gösterilir. */
  reward: number | null;
  /** Görev geçiş fazında (completing/gap) true → kart %100 + yeşil onay flash'ı gösterir. */
  done?: boolean;
}

export function questView(q: QuestDef, ctx: QuestCtx): QuestView {
  const counter = questCounterValue(q.target, ctx.stats);
  const count = counter != null ? (q.target as { count: number }).count : null;
  const pad =
    q.target.type === 'pad'
      ? (C.pads as readonly PadDef[]).find((p) => p.id === (q.target as { id: string }).id)
      : undefined;
  // charStat/waiterTray/waiterSpeed görevinde maliyet = hedef kademeye ulaştıran satın almanın ₺'si (görev kartında).
  const charCost =
    q.target.type === 'charStat'
      ? charNextCost(q.target.stat, q.target.tier - 1)
      : q.target.type === 'waiterTray'
        ? waiterTrayNextCost(q.target.kind, q.target.tier - 1)
        : q.target.type === 'waiterSpeed'
          ? waiterSpeedNextCost(q.target.kind, q.target.tier - 1)
          : null;
  return {
    id: q.id,
    title: q.title,
    target: q.target,
    cur: counter != null && count != null ? Math.max(0, Math.min(count, counter - ctx.questBase)) : null,
    total: count,
    cost: pad ? pad.cost : charCost,
    reward: q.reward ?? null,
  };
}

/** Görev hedefinin DÜNYA konumu (kamera odak + işaret görünürlüğü). zone = görevin salonu
 *  (2026-06-11 fix: z2 görevlerinde kamera zone-1'e zoom atıyordu — hedefler zone-1 alias'larına sabitti).
 *  charStat görevlerinde 3D hedef YOK → null (kamera sıçramaz; yönlendirme HUD buton efektiyle). */
export function questFocusPos(target: QuestTarget, tableLevels: number[], tables: number, zone = 0): RVec3 | null {
  const z = Math.min(Math.max(zone, 0), MAX_ZONES - 1);
  switch (target.type) {
    case 'charStat': return null;
    case 'waiterTray': return null; // panel satın alımı — 3D hedef yok (charStat deseni)
    case 'waiterSpeed': return null; // v29: hız da panelden — 3D hedef yok
    case 'pickupTea': return LAYOUT.stations[z];
    case 'washDish': return LAYOUT.dishStations[z];
    case 'pad': return LAYOUT.padPos[target.id] ?? LAYOUT.stations[z];
    case 'stationLevel': return LAYOUT.upgradeZones[target.zone ?? z];
    case 'tableLevel':
    case 'tablesAtLevel': {
      // O zone'dan başlayarak hedef seviyenin ALTINDAKİ ilk açık masanın yükseltme noktası
      // (tablesAtLevel v27: oyuncuyu gerçekten yükseltilecek masaya götürür).
      const goal = target.type === 'tablesAtLevel' ? target.level : tableSoftMaxLevel();
      const z0 = target.type === 'tablesAtLevel' && target.zone != null ? target.zone : z;
      for (let i = z0 * TABLES_PER_ZONE; i < tables; i++) {
        if ((tableLevels[i] ?? 0) < goal) return LAYOUT.tables[i].upgradeSpot;
      }
      return LAYOUT.tables[Math.min(z0 * TABLES_PER_ZONE, tables - 1) || 0].upgradeSpot;
    }
    // serveTea → o salonun OCAĞI/TEZGÂHI (2026-06-12 telefon feedback: salon ortası boştu —
    // özellikle yeni açılan salonda kamera "hiçbir şeye" bakıyordu); collectCoin → masa bölgesi ortası.
    case 'serveTea': return LAYOUT.stations[z];
    default: {
      const za = LAYOUT.zoneAreas[z];
      return [(za.minX + za.maxX) / 2, 0, 1.5 - zoneRow(z) * ZONE_DZ]; // arka sıra kaydırılır (M2)
    }
  }
}

/** Kamera odak isteği (transient): CameraRig bu hedefe kayar/zoom yapar, ttl bitince/girdiyle döner. */
export interface CamFocus {
  pos: [number, number, number];
  ttl: number;
}
export const CAM_FOCUS_TTL = 2.2; // sn — kayma + kısa bekleme; joystick girdisi anında iptal eder

/**
 * EKRANDA TEK PAD (quest sistemi): görünür/doldurulabilir pad'ler. Pad görevi sırasında YALNIZ o pad;
 * pad-dışı görevde HİÇ pad; görev hattı bittiyse güvenlik ağı olarak klasik omurga sırası (normalde
 * hat tüm pad'leri kapsadığından boş kalır). Hem tick (dolum) hem Pad.tsx (çizim) BUNU kullanır →
 * görsel ile mantık ayrışamaz.
 */
export function visiblePads(questIndex: number, g: GateState): PadDef[] {
  // Y4: gating'i karşılanan OPSİYONEL pad'ler (2. garsonlar) görev durumundan bağımsız görünür —
  // geç-oyun serbest keşfi; "ekranda tek pad" ilkesi omurga için sürer (opsiyoneller nadir/gate'li).
  const opt = availableOptionalPads(g);
  const q = questIndex < C.quests.length ? C.quests[questIndex] : null;
  if (q) {
    if (q.target.type !== 'pad') return opt;
    const p = (C.pads as readonly PadDef[]).find((pd) => pd.id === (q.target as { id: string }).id);
    // AKTİF görevin hedef pad'inde TEMPO gate'leri (minLifetime vb.) ATLANIR (2026-06-11 fix:
    // "2. Masayı aç" görevi verilmişken table2 minLifetime:20 pad'i gizliyordu — görev hattı sıralı =
    // tempo kaynağı). `prev` OMURGA zinciri yapısal güvenlik ağı olarak KALIR (bozuk kayda karşı).
    const req = p ? (p.requires as Requires | undefined) : undefined;
    const prevOk = !req?.prev || req.prev.every((id) => g.padsDone.includes(id));
    const rest = opt.filter((o) => o.id !== p?.id); // q_waiter2 gibi opsiyonel-hedefli görevde çiftleme olmasın
    return p && !g.padsDone.includes(p.id) && prevOk ? [p, ...rest] : rest;
  }
  const bp = currentPad(g);
  return bp ? [bp, ...opt] : opt;
}

/**
 * Offline kazanç (saf — vitest edilebilir; 2026-06-11 nerf): oran × rateMult × min(süre, süre-tavanı),
 * SONRA PARA tavanı = sıradaki omurga pad maliyeti × capNextPadFrac (tüm pad'ler bittiyse en pahalı pad
 * referans alınır). İki kelepçe birlikte: kapa-aç ~7k verip zone'u tek girişte bitirme bug'ı kapanır.
 */
export function computeOfflineEarned(rate: number, elapsedSec: number, padsDone: readonly string[]): number {
  const capSec = C.offline.baseCapHours * 3600;
  const raw = Math.floor(rate * C.offline.rateMult * Math.min(elapsedSec, capSec));
  const pads = C.pads as readonly PadDef[];
  const next = pads.find((p) => !p.optional && !padsDone.includes(p.id));
  const refCost = next ? next.cost : Math.max(...pads.map((p) => p.cost));
  return Math.min(raw, Math.floor(refCost * C.offline.capNextPadFrac));
}

/** ₺ ile çıkılabilen en yüksek istasyon seviyesi (L5 = Usta, 💎/video — Faz 4). */
export const stationSoftMaxLevel = () => C.teaStation.upgrade.maxLevel;
/** Mevcut seviyeden bir sonraki ₺ yükseltmenin maliyeti (çay eğrisi; zone-farkındalı için *Z). */
export const stationUpgradeCost = (level: number) => upgradeCost(C.teaStation.upgrade, level + 1);
/** Zone'un istasyon yükseltme maliyeti: çay eğrisi × ürünün upgradeCostMult'u (M3 — tost tezgâhı
 *  geç-oyun, çay eğrisi orada komik ucuz kalırdı). */
export const stationUpgradeCostZ = (z: number, level: number) =>
  Math.floor(upgradeCost(C.teaStation.upgrade, level + 1) * PRODUCTS[zoneProduct(z)].upgradeCostMult);
