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
  PRODUCTS,
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
import { LAYOUT, servicePlace, type RVec3 } from './layout';
import { MAX_AREAS, THE_SERVICE, areaTableStart, tostShare, isCounter } from './world';

// DWELL kanonik dolum-noktası id'leri (D-018 §2): pad'ler kendi id'sini kullanır; bunlar yükseltme
// noktaları. Önek + index biçimindedir ('tea:0' = SERVİS index'i, 'tableUp:5' = GLOBAL masa index'i).
// (v29: 'waiterUp:' kalktı — garson hızı karakter panelinden satın alınır.)
export const FILL_TEA = 'tea:'; // + SERVİS index
export const FILL_TABLE = 'tableUp:'; // + GLOBAL masa index

/** Servis noktasının yükseltmesi açık mı? (2. masa önkoşul — "önce kapasite sonra verim".)
 *  B2: servis TEK olduğu için parametresiz; alan-başı `upgradeRequiresByArea` dizisi kalktı. */
export function stationUpgradeUnlocked(g: GateState): boolean {
  return requiresMet(C.service.upgradeRequires, g);
}

/** Alanın masa yükseltmeleri açık mı? (v21: o alanın 4 masası da açılınca — D-019 §3.) */
export function tableUpgradeUnlockedIn(area: number, g: GateState): boolean {
  return requiresMet(C.tables.upgradeRequiresByArea[area], g);
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
export const TEA_PRICE = C.service.basePrice;
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
  return upgradeOutputMultiplier(C.service.upgrade, level);
}

/** Bir birim ürünün hazırlanma süresi (sn) — throughput arttıkça kısalır. prepTime verilmezse çay
 *  (geri uyum: eski çağıranlar/testler); tost servisi PRODUCTS.tost.prepTime geçer (M3). */
export function brewTime(level: number, prepTime: number = C.npc.orderTime): number {
  return prepTime / brewThroughputMult(level);
}

/**
 * GLOBAL bardak havuzu kapasitesi: açık ALAN başına taban + servis seviyesi başına ek.
 * B2: taban ALANLA ölçeklenir (servisle DEĞİL) — mekân büyüdükçe daha çok bardak döner ve
 * `unlockArea` etkisinin havuza eklediği `poolBase` ile aynı kaynağı kullanır. Servis tekilleşince
 * "açık servis başına taban" okuması havuzu alan açılışlarında sessizce tutarsız bırakıyordu.
 */
export function totalCupPool(areasOpen: number, stationLevels: number[]): number {
  let lv = 0;
  for (const l of stationLevels) lv += l ?? 0;
  return areasOpen * C.cups.poolBase + C.cups.poolPerLevel * lv;
}

/** ₺ ile çıkılabilen en yüksek masa seviyesi (💎 "Usta" katmanı Faz D'de gelecek). */
export const tableSoftMaxLevel = () => C.tables.upgrade.maxLevel;

/**
 * Masa teması mağazası kilidi (kullanıcı kararı 2026-06-17): 3 salon AÇIK **VE** tüm açık masalar
 * MAX seviye olunca açılır ("seviyeler fullenince"). Başta masalar renksiz (native mavi); tüm ilerleme
 * tamamlanınca premium renk teması satın alınabilir. Zemin/duvar temaları bu kilitten etkilenmez.
 */
export function tableThemeUnlocked(g: { areasOpen: number; tables: number; tableLevels: number[] }): boolean {
  if (g.areasOpen < MAX_AREAS || g.tables <= 0) return false;
  const max = tableSoftMaxLevel();
  for (let i = 0; i < g.tables; i++) if ((g.tableLevels[i] ?? 0) < max) return false;
  return true;
}
/** Mevcut seviyeden bir sonraki masa yükseltmesinin maliyeti (₺). */
export const tableNextCost = (level: number, area = 0) => tableUpgradeCost(level, area);
/** 1. alanın masa yükseltme gate'i (geri uyum: testler/eski çağıranlar). */
export function tableUpgradeUnlocked(g: GateState): boolean {
  return tableUpgradeUnlockedIn(0, g);
}

/**
 * Çevrimdışı gelir oranı (₺/sn) — bottleneck idealize: oturma × ürün fiyatı / döngü.
 * B2: menü artık SEVİYEDEN geldiği için ürün "servisin ürünü" değil, seviyedeki tost payına göre
 * KARIŞIM: L5'te müşterilerin %25'i tost (pahalı + yavaş) ister → hem fiyat hem hazırlık süresi
 * ağırlıklı ortalamayla girer. L0-L4'te pay 0 → formül eski çay-hâliyle birebir aynı sonucu verir.
 * Masa BAHŞİŞLERİ de orana dahil (kullanıcı 2026-06-11): tipTotal = açık masaların Σ(tipBase × seviye).
 */
export function incomeRate(tables: number, level: number, tipTotal = 0): number {
  const p = tostShare(level);
  const price = (1 - p) * PRODUCTS.tea.price + p * PRODUCTS.tost.price;
  const prepTime = (1 - p) * PRODUCTS.tea.prepTime + p * PRODUCTS.tost.prepTime;
  const cycle = C.npc.walkTime + brewTime(level, prepTime) + C.npc.eatTime;
  return (tables * price + tipTotal) / cycle;
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

/** Grup hedefi (Y2, plan §2 + dağılım fix'i): ALANLAR ROUND-ROBIN pay alır — global "en çok
 *  boş koltuk" araması, az koltuklu yeni alanı (tost L0=1 koltuk) çay alanlarına karşı sürekli
 *  kaybettirip AÇ bırakıyordu (q_tost5 ilerleyemiyordu). startArea'dan başlayarak boş koltuğu
 *  olan İLK alan seçilir; alan İÇİNDE en çok boş koltuklu temiz masa (eşitlikte düşük index).
 *  Hiç boş koltuk yoksa -1. */
/**
 * Masanın O ANKİ koltuk sayısı: masanın TİPİNE ait seviye merdiveninden okunur, sonra masanın
 * gerçekten sahip olduğu koltuk konumlarıyla kelepçelenir. B3-2'de kelepçe TEK başınaydı ve doğru
 * cevabı tesadüfen veriyordu (min(4, 2) = 2); B5a'da `seatsByLevel` masa tipine ayrıldığı için
 * asıl cevabı merdiven veriyor, kelepçe yerleşim ile config'in çelişmesine karşı savunma olarak
 * duruyor (banketin iki yeri var, dörtlü masanın dört).
 */
export function seatsAtTable(tableIndex: number, level: number): number {
  const t = LAYOUT.tables[tableIndex];
  if (!t) return 0;
  return Math.min(tableSeats(level, t.kind), t.seats.length);
}

export function findTableForGroup(
  occ: Map<number, Set<number>>,
  tables: number,
  dirty: Set<number>,
  tableLevels: number[],
  areasOpen: number,
  startArea: number,
): number {
  for (let da = 0; da < areasOpen; da++) {
    const a = (startArea + da) % areasOpen;
    let best = -1;
    let bestFree = 0;
    const end = Math.min(areaTableStart(a + 1), tables);
    for (let i = areaTableStart(a); i < end; i++) {
      if (dirty.has(i)) continue;
      const free = seatsAtTable(i, tableLevels[i] ?? 0) - (occ.get(i)?.size ?? 0);
      if (free > bestFree) {
        bestFree = free;
        best = i;
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

/** Oyuncunun o an üstünde durduğu/doldurduğu NOKTA (HUD'da alttaki bar). */
export interface ActiveSpot {
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
 * Şu an açık olan "yeni-özellik" reveal anahtarları (D-019 §4) — v21'den beri ALAN/SERVİS BAŞINA
 * (kullanıcı 2026-06-12: 2. alanın yükseltmeleri de düzenli açılsın + bildirilsin). Bir anahtar
 * revealSeen'de YOKKEN belirirse toast + kamera panı tetiklenir. revealSeen baseline init'te
 * mevcut açık özelliklerle kurulur → yeniden yüklemede zaten açık olanlar tekrar bildirmez.
 * Dönen üçlü: [anahtar, metin, pan hedefi (null = pan yok)].
 */
export function revealKeys(
  g: GateState,
  areasOpen: number,
  stationLevels: number[],
): [string, string, RVec3 | null][] {
  const out: [string, string, RVec3 | null][] = [];
  const pre = (a: number) => (a === 0 ? '' : `Salon ${a + 1}: `);
  for (let a = 0; a < areasOpen; a++) {
    if (tableUpgradeUnlockedIn(a, g))
      out.push([`tableUp:${a}`, `Yeni: ${pre(a)}Masaları yükseltebilirsin 🪑`, LAYOUT.tables[areaTableStart(a)].upgradeSpot]);
  }
  // Servis noktası TEK (B2) → tek reveal anahtarı, alan döngüsünün dışında. Metin seviyeye göre
  // konuşur: L4'e kadar "çay ocağı", sonrası "tezgâh" (tek merdiven, iki kimlik).
  const lv = stationLevels[THE_SERVICE] ?? 0;
  if (stationUpgradeUnlocked(g) && lv < stationSoftMaxLevel())
    out.push([
      `upgrade:${THE_SERVICE}`,
      isCounter(lv) ? 'Yeni: Tezgâhı yükseltebilirsin 🍞' : 'Yeni: Çay ocağını yükseltebilirsin ☕',
      servicePlace(areasOpen).upgradeSpot,
    ]);
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

/** Servis yükseltme gate'i — eski adıyla (geri uyum: testler/eski çağıranlar). */
export const stationUpgradeUnlocked0 = stationUpgradeUnlocked;

// ============================== QUEST MOTORU (2026-06-09) ==============================
// İlerleme sıralı TEK görevle yönlendirilir (Fable brief §1+§4; eski nextStep + onboardingHint
// koç bandının yerini alır). Sayaç görevleri questBase'ten DELTA sayılır; durum görevleri
// (pad/level) doğrudan oyun durumundan okunur.

/** Quest değerlendirme bağlamı (salt-okunur anlık görüntü). */
export interface QuestCtx {
  padsDone: string[];
  /** SERVİS başına ocak seviyesi (v27: servisli stationLevel görevleri — "Salon 2'nin ocağını yükselt"). */
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
      // ALAN'lı hedef (v23): yalnız o alandaki el servisi sayılır ("Yeni salonda 5 çay" gerçek olsun).
      return target.area != null ? stats.teasServedByArea[target.area] ?? 0 : stats.teasServed;
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
    case 'stationLevel': return (ctx.stationLevels[THE_SERVICE] ?? 0) >= target.level;
    case 'waiterSpeed': return ctx.waiterUpgrades.speed >= target.tier;
    case 'tableLevel': return ctx.tableLevels.some((l) => l >= target.level);
    case 'tablesAtLevel': {
      // area verilirse yalnız o alanın masa slotları; verilmezse tüm masalar (v27 çeşitlilik).
      const lvls = target.area != null
        ? ctx.tableLevels.slice(areaTableStart(target.area), areaTableStart(target.area + 1))
        : ctx.tableLevels;
      return lvls.filter((l) => (l ?? 0) >= target.level).length >= target.count;
    }
    case 'waiterTray': return ctx.waiterUpgrades.tray >= target.tier;
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
        ? waiterTrayNextCost(q.target.tier - 1)
        : q.target.type === 'waiterSpeed'
          ? waiterSpeedNextCost(q.target.tier - 1)
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

/** Görev hedefinin DÜNYA konumu (kamera odak + işaret görünürlüğü). area = görevin ALANI
 *  (2026-06-11 fix: 3. alanın görevlerinde kamera 1. alana zoom atıyordu — hedefler alias'lara sabitti).
 *  charStat görevlerinde 3D hedef YOK → null (kamera sıçramaz; yönlendirme HUD buton efektiyle). */
export function questFocusPos(
  target: QuestTarget,
  tableLevels: number[],
  tables: number,
  areasOpen: number,
  area = 0,
): RVec3 | null {
  const a = Math.min(Math.max(area, 0), MAX_AREAS - 1);
  // B3-1: servisin YERİ areasOpen'a bağlı (3. Alan açılınca arka banda taşınır) → hedef noktalar
  // sabit diziden değil `servicePlace`ten okunur. Alan index'i (a) artık servisi seçmez: tek servis var.
  const sp = servicePlace(areasOpen);
  switch (target.type) {
    case 'charStat': return null;
    case 'waiterTray': return null; // panel satın alımı — 3D hedef yok (charStat deseni)
    case 'waiterSpeed': return null; // v29: hız da panelden — 3D hedef yok
    case 'pickupTea': return sp.station;
    case 'washDish': return sp.dish;
    case 'pad': return LAYOUT.padPos[target.id] ?? sp.station;
    case 'stationLevel': return sp.upgradeSpot;
    case 'tableLevel':
    case 'tablesAtLevel': {
      // O alandan başlayarak hedef seviyenin ALTINDAKİ ilk açık masanın yükseltme noktası
      // (tablesAtLevel v27: oyuncuyu gerçekten yükseltilecek masaya götürür).
      const goal = target.type === 'tablesAtLevel' ? target.level : tableSoftMaxLevel();
      const a0 = target.type === 'tablesAtLevel' && target.area != null ? target.area : a;
      for (let i = areaTableStart(a0); i < tables; i++) {
        if ((tableLevels[i] ?? 0) < goal) return LAYOUT.tables[i].upgradeSpot;
      }
      return LAYOUT.tables[Math.min(areaTableStart(a0), tables - 1) || 0].upgradeSpot;
    }
    // serveTea → o alanın OCAĞI/TEZGÂHI (2026-06-12 telefon feedback: salon ortası boştu —
    // özellikle yeni açılan salonda kamera "hiçbir şeye" bakıyordu); collectCoin → masa bölgesi ortası.
    case 'serveTea': return sp.station;
    default: {
      // B3-1: alanlar eş olmadığından "şablon + sıra kaydırması" kalktı — alanın KENDİ merkezi.
      const ab = LAYOUT.areaBounds[a];
      return [(ab.minX + ab.maxX) / 2, 0, (ab.minZ + ab.maxZ) / 2];
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
export const stationSoftMaxLevel = () => C.service.upgrade.maxLevel;
/**
 * Servis noktasının bir sonraki seviyesinin ₺ maliyeti. B2: TEK eğri — eski "ürünün
 * upgradeCostMult'u ile çarp" (tost tezgâhı ×20) kuralı kalktı, çünkü ürün artık ayrı bir servisin
 * değil AYNI merdivenin üst basamağı; L4-L6'nın pahalı olması eğrinin kendi işi (costsByLevel).
 */
export const stationUpgradeCost = (level: number) => upgradeCost(C.service.upgrade, level + 1);
/** Eski adıyla (servis parametresi kalktı; çağıranlar tek servisi soruyor). */
export const stationUpgradeCostAt = (_service: number, level: number) => stationUpgradeCost(level);
