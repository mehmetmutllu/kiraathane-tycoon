/**
 * tick.ts — SİMÜLASYON SİSTEMLERİ. Her kare `runTick(c)` bu dosyadaki sistemleri SIRAYLA çağırır.
 *
 * Faz A2 (2026-09-06): eski 800 satırlık tek `tick()` gövdesi buraya, 17 sisteme bölündü.
 * Sıra ÖNEMLİ ve eskisiyle birebir aynıdır (demleme → spawn → NPC → oyuncu → para → servis →
 * bardak → garson → bulaşıkçı → etkileşim → bildirim → pad → yükseltmeler → türetme → görev → seviye).
 *
 * Sözleşme: sistemler yalnız `TickCtx` üstünde çalışır — Zustand'a, React'e, DOM'a DOKUNMAZLAR.
 * Ctx bir KARE anlık görüntüsüdür: `s` girişteki (salt-okunur) durum, geri kalan alanlar bu karede
 * değişebilen çalışma değerleridir. `store.tick()` ctx'i kurar, `runTick`i çağırır, sonucu tek
 * `set()` ile yazar. Bu ayrım sayesinde sistemler saf, tek tek okunabilir ve test edilebilir kalır.
 */
import type { Decimal } from './decimal';
import type { Coin, Dish, Npc, Vec3, Waiter } from './types';
import {
  economyConfig as C,
  brewQueueCapacity,
  tableTip,
  tablePatience,
  tableSeats,
  rollGroupSize,
  upgradeFillRateFor,
  waiterSpeedFor,
  dishSpeedFor,
  levelProgress,
  PRODUCTS,
  waiterTrayCapacityFor,
  dishCarryCapacityFor,
  trayCapacityFor,
  attractRadiusFor,
  playerSpeedFor,
  type PadDef,
  type GateState,
  type ProductId,
} from '../config/economy.config';
import {
  deriveWorld,
  areaOfTable,
  THE_SERVICE,
  MAX_WAITERS,
  isCounter,
  serviceMenu,
  tostShare,
  type World,
} from './world';
import type { SaveStats } from './save';
import {
  LAYOUT,
  PAD_RADIUS,
  NPC_SPEED,
  TABLE_UP_RADIUS,
  REACH_TABLE,
  REACH_PICKUP,
  REACH_WASH,
  REACH_HOME,
  dist2D,
  moveToward,
  activeSolids,
  clampToOpenAreas,
  openServices,
  tableSolids,
  hitsSolid,
  getNavGrid,
  navStep,
  type RVec3,
  type Solid,
} from './layout';
import {
  FILL_TEA,
  FILL_TABLE,
  NPC_COLORS,
  WASH_QUEST_INDEX,
  QUEST_COMPLETE_DUR,
  QUEST_GAP_DUR,
  CAM_FOCUS_TTL,
  brewTime,
  tableSoftMaxLevel,
  tableNextCost,
  stationSoftMaxLevel,
  stationUpgradeCostAt,
  dirtyTables,
  occupiedSeats,
  findTableForGroup,
  revealKeys,
  visiblePads,
  stationUpgradeUnlocked,
  tableUpgradeUnlockedIn,
  questView,
  questTargetMet,
  questCounterValue,
  questFocusPos,
  type ActiveSpot,
  type GameNotice,
  type QuestView,
  type QuestCtx,
  type CamFocus,
} from './rules';
import type { NavGrid } from './nav';
import type { GameState } from './store'; // yalnız TİP (derlemede silinir → döngüsel import YOK)

/**
 * Bir karenin çalışma bağlamı. `s` girişteki durum (salt-okunur); diğer alanlar sistemlerin sırayla
 * güncellediği değerlerdir. Bir sistemin ÜRETİP sonrakine verdiği ara değerler (dirty, liveNpcs,
 * input, player, out, quest …) da burada durur — eskiden aynı dev gövdedeki yerel değişkenlerdi;
 * artık sistemler arası sözleşme AÇIKÇA görünür.
 */
export interface TickCtx {
  readonly dt: number;
  readonly s: GameState;
  // --- Giriş kopyaları (bu karede değişebilir) ---
  npcs: Npc[];
  coins: Coin[];
  dishes: Dish[];
  wallet: Decimal;
  lifetime: Decimal;
  padsDone: string[];
  padFills: Record<string, number>;
  readonly world: World;
  readonly tables: number;
  readonly areasOpen: number;
  /** Bu karede AÇIK servis index'leri (ocak/bulaşık/personel döngüleri bunun üstünde döner). */
  readonly openSvc: number[];
  readonly obstacles: Solid[];
  readonly navGrid: NavGrid;
  upgradeFills: number[];
  activeSpot: ActiveSpot | null;
  stationLevels: number[];
  tableLevels: number[];
  /** Servisin HAZIR ürünleri — B2: servis başına değil ÜRÜN başına (tek nokta, iki ürün). */
  ready: Record<ProductId, number>;
  /** Ürün başına birikmiş demleme süresi (sn). Tezgâh aynı anda TEK kalem hazırlar: hangi ürünün
   *  açığı büyükse onun sayacı ilerler, diğerinin yarım ilerlemesi KAYBOLMAZ (bekler). */
  brewProgress: Record<ProductId, number>;
  tray: number;
  trayFood: number;
  cleanCups: number;
  carriedDirty: number;
  carriedDirtyFood: number;
  tableUpgradeFills: number[];
  notice: GameNotice | null;
  noticeQueue: GameNotice[];
  readonly enqueueNotice: (n: GameNotice) => void;
  revealSeen: string[];
  questPhase: 'active' | 'completing' | 'gap';
  questPhaseT: number;
  xp: number;
  stats: SaveStats;
  questIndex: number;
  questBase: number;
  camFocus: CamFocus | null;
  camPrio: number;
  readonly requestFocus: (pos: RVec3, prio: number) => void;
  nextId: number;
  spawnTimer: number;
  spawnArea: number;
  // --- Sistemden sisteme geçen ara değerler ---
  dirty: Set<number>;
  liveNpcs: Npc[];
  input: readonly number[];
  pr: number;
  player: Vec3;
  autoCollectSum: number;
  autoCollectToastCooldown: number;
  trayCap: number;
  /** GLOBAL garson havuzu (B2): düz liste, uzunluk = tutulmuş garson sayısı. */
  waiters: Waiter[];
  /** Katın TEK bulaşıkçısı (yoksa null). */
  dishwasher: Waiter | null;
  padGate: GateState;
  activePads: PadDef[];
  fillReady: boolean;
  onFillId: string | null;
  out: World;
  questDoneIndex: number;
  quest: QuestView | null;
}

/** Kare bağlamını girişteki durumdan kurar (eski tick() prologu). */
export function createTickCtx(s: GameState, dt: number): TickCtx {
  const world = deriveWorld(s.padsDone);
  const tableCount = world.tables.length;
  const c: TickCtx = {
    dt,
    s,
    npcs: s.npcs.map((n) => ({ ...n, pos: [...n.pos] as Vec3 })),
    // pos klonlanır (mıknatıs hareketinde mutasyon önceki state'i bozmasın).
    coins: s.coins.map((x) => ({ ...x, pos: [...x.pos] as Vec3 })),
    dishes: s.dishes.map((d) => ({ ...d, pos: [...d.pos] as Vec3 })),
    wallet: s.wallet,
    lifetime: s.lifetime,
    padsDone: s.padsDone,
    padFills: s.padFills,
    // D-015: masa/servis/personel padsDone'dan TÜRETİLİR (kare anlık görüntüsü; kare içinde
    // ayrıca mutasyona uğramaz — pad açılınca yalnız padsDone büyür, gerisi türetilir).
    world,
    tables: tableCount,
    areasOpen: world.areasOpen,
    openSvc: openServices(world.areasOpen),
    // Personelin oyuncudan kaçarken masaya itilmemesi için masa gövdeleri (navStep avoidSolids).
    obstacles: tableSolids(tableCount),
    // Personel (garson/bulaşıkçı) BFS ızgarası — masa+alan sayısına göre cache'li.
    navGrid: getNavGrid(tableCount, world.areasOpen),
    upgradeFills: s.upgradeFills.slice(),
    activeSpot: null,
    stationLevels: s.stationLevels.slice(), // SERVİS başına ocak seviyesi (bu karede yükselebilir)
    tableLevels: s.tableLevels.slice(), // masa-başı seviyeler (kopya; bu karede yükseltilebilir)
    ready: { ...s.ready },
    brewProgress: { ...s.brewProgress },
    tray: s.tray,
    trayFood: s.trayFood,
    cleanCups: s.cleanCups,
    carriedDirty: s.carriedDirty,
    carriedDirtyFood: s.carriedDirtyFood,
    tableUpgradeFills: s.tableUpgradeFills.slice(),
    notice: s.notice,
    // Bildirim kuyruğu: bitiş/reveal/seviye toast'ları tek slotu EZMEK yerine sıraya girer (B paketi).
    noticeQueue: [...s.noticeQueue],
    enqueueNotice: (n: GameNotice) => { c.noticeQueue.push(n); },
    revealSeen: s.revealSeen,
    questPhase: s.questPhase,
    questPhaseT: s.questPhaseT,
    xp: s.xp, // toplam XP (bu karede eylem ödülleriyle artabilir; level türetilir)
    // Kalıcı eylem sayaçları (bu karede artabilir). waiterServedByService dizisi de klonlanır (v21).
    stats: { ...s.stats, waiterServedByService: s.stats.waiterServedByService.slice() },
    questIndex: s.questIndex,
    questBase: s.questBase,
    camFocus: s.camFocus,
    // Kamera odak tetikleri aynı karede üst üste binebilir (reveal + görev geçişi + alan açılışı) —
    // 2026-06-11 fix: kare-içi ÖNCELİK (reveal 1 < görev 2 < alan 3); düşük öncelik yükseği EZEMEZ.
    camPrio: 0,
    requestFocus: (pos: RVec3, prio: number) => {
      if (prio >= c.camPrio) {
        c.camFocus = { pos: [pos[0], pos[1], pos[2]], ttl: CAM_FOCUS_TTL };
        c.camPrio = prio;
      }
    },
    nextId: s.nextId,
    spawnTimer: s.spawnTimer - dt,
    spawnArea: s.spawnArea,
    // Ara değerler: üreten sistem yazana kadar giriş değeri/boş.
    dirty: new Set<number>(),
    liveNpcs: [],
    input: [0, 0],
    pr: LAYOUT.playerRadius,
    player: s.player,
    autoCollectSum: s.autoCollectSum,
    autoCollectToastCooldown: s.autoCollectToastCooldown,
    trayCap: 0,
    waiters: s.waiters,
    dishwasher: s.dishwasher,
    padGate: { padsDone: s.padsDone, tables: tableCount, stationLevel: s.stationLevels[0], lifetime: 0 },
    activePads: [],
    fillReady: false,
    onFillId: null,
    out: world,
    questDoneIndex: s.questDoneIndex,
    quest: s.quest,
  };
  return c;
}

/**
 * SERVİS NOKTASI — hazır ürün kuyruğu (D-011 §3 + bardak döngüsü Faz 2e §5).
 *
 * B2: kat TEK noktadan üretir ve o nokta seviyesine göre BİRDEN ÇOK ürün yapabilir (L5'ten sonra
 * çay + tost). Eskiden her servis kendi tek ürününü kendi kuyruğuna demliyordu; şimdi tek tezgâh
 * aynı anda TEK kalem hazırlar ve hangi kalemi hazırlayacağını TALEP söyler:
 *   açık = (o ürünü bekleyen müşteri) − (o üründen hazır olan)
 * En büyük açığı olan ürün ilerler; eşitlikte çay (ucuz+hızlı olan akışı tıkamaz). Seçilmeyen
 * ürünün yarım ilerlemesi KAYBOLMAZ, olduğu yerde bekler — ürün değiştirmek ceza değildir.
 * Kuyruk kapasitesi ve temiz bardak havuzu ORTAKTIR (korunum değişmezi tek kalır).
 */
function brewSystem(c: TickCtx): void {
  // NOT: talep `npcs` üstünden okunur, `liveNpcs` üstünden DEĞİL — brewSystem sıranın BAŞINDA
  // çalışır, `liveNpcs`i npcSystem sonra doldurur. `npcs` kare başındaki listedir (doğru girdi).
  const { dt, dishes, stationLevels, tableLevels, ready, brewProgress, npcs } = c;
  let cleanCups = c.cleanCups;
  const level = stationLevels[THE_SERVICE] ?? 0;
  const menu = serviceMenu(level);
  const queueCap = brewQueueCapacity(level);
  const readyTotal = menu.reduce((n, p) => n + ready[p], 0);

  if (readyTotal < queueCap && cleanCups > 0) {
    // Bekleyen talep (kuyruğa girmiş müşteriler) ürün başına.
    const want: Record<ProductId, number> = { tea: 0, tost: 0 };
    for (const n of npcs) if (n.state === 'waitingForTea') want[n.product] += 1;
    // En büyük açığı olan ürünü seç; hiçbir ürünün açığı yoksa yine de stok yap (menünün ilki).
    let pick: ProductId = menu[0];
    let bestGap = -Infinity;
    for (const p of menu) {
      const gap = want[p] - ready[p];
      if (gap > bestGap + 1e-9) { bestGap = gap; pick = p; }
    }
    const cupBrewTime = brewTime(level, PRODUCTS[pick].prepTime);
    brewProgress[pick] += dt;
    let total = readyTotal;
    while (total < queueCap && cleanCups > 0 && brewProgress[pick] >= cupBrewTime) {
      ready[pick] += 1;
      total += 1;
      cleanCups -= 1;
      brewProgress[pick] -= cupBrewTime;
    }
    if (total >= queueCap || cleanCups <= 0) brewProgress[pick] = Math.min(brewProgress[pick], cupBrewTime);
  }

  // Kirli masalar (D-019): eşiği aşan masalar müşteriye/garsona kapalı (temizlik baskısı).
  // Y2: eşik koltukla ölçeklenir → seviye gerekir.
  const dirty = dirtyTables(dishes, tableLevels);
  c.cleanCups = cleanCups;
  c.dirty = dirty;
}

/**
 * Spawn (Y2 GRUP sistemi, plan §2)
 */
function spawnSystem(c: TickCtx): void {
  const { npcs, tables, areasOpen, tableLevels, dirty, stationLevels } = c;
  // B2: müşteri ÜRÜNÜNÜ gelirken seçer; tost payı servis SEVİYESİNDEN gelir (L5 öncesi 0 → herkes
  // çay ister, eski davranışla birebir). Sipariş nesnesi `{çay:1, tost:2}` Faz C'de.
  const pTost = tostShare(stationLevels[THE_SERVICE] ?? 0);
  let nextId = c.nextId;
  let spawnTimer = c.spawnTimer;
  let spawnArea = c.spawnArea;
  const activeCount = npcs.filter((n) => n.state !== 'leaving').length;
  // Müşteri tavanı KOLTUK+2 (masa değil — Y2; M3'ün masa+2 fix'inin koltuklu hali).
  let totalSeats = 0;
  for (let i = 0; i < tables; i++) totalSeats += tableSeats(tableLevels[i] ?? 0);
  const maxConcurrent = Math.max(C.npc.maxConcurrent, totalSeats + 2);
  if (spawnTimer <= 0 && activeCount < maxConcurrent) {
    const occ = occupiedSeats(npcs);
    const target = findTableForGroup(occ, tables, dirty, tableLevels, areasOpen, spawnArea);
    if (target >= 0) {
      // Grup boyu zarla (%30/35/20/15); koltuk yetmezse KÜÇÜLÜR, tavan da aşılmaz.
      const seats = LAYOUT.tables[target].seats;
      const taken = occ.get(target) ?? new Set<number>();
      const freeSeats = tableSeats(tableLevels[target] ?? 0) - taken.size;
      const size = Math.min(rollGroupSize(Math.random()), freeSeats, maxConcurrent - activeCount);
      // KENDİ zone'unun sokağında belir → o zone'un kapısından girer (dış dünya hissi).
      // Üyeler sokakta hafif saçılır (üst üste binmesin); her üye FARKLI koltuğa atanır,
      // çay/timer/ödeme/bahşiş bireysel (ekonomi korunumu bozulmaz).
      const street = LAYOUT.streets[areaOfTable(target)];
      let placed = 0;
      for (let k = 0; k < seats.length && placed < size; k++) {
        if (taken.has(k)) continue;
        npcs.push({
          id: nextId++,
          state: 'toTable',
          pos: [street[0] + (placed - (size - 1) / 2) * 0.55, street[1], street[2] + placed * 0.35],
          tableIndex: target,
          seatIndex: k,
          timer: 0,
          product: Math.random() < pTost ? 'tost' : 'tea',
          color: NPC_COLORS[Math.floor(Math.random() * NPC_COLORS.length)],
        });
        placed += 1;
      }
      spawnTimer += C.npc.spawnInterval;
      spawnArea = (areaOfTable(target) + 1) % areasOpen; // sıradaki grup bir SONRAKİ alandan başlasın
    } else {
      spawnTimer = 0; // koltuk boşalınca hemen denesin
    }
  }
  c.nextId = nextId;
  c.spawnTimer = spawnTimer;
  c.spawnArea = spawnArea;
}

/**
 * NPC durum makinesi
 */
function npcSystem(c: TickCtx): void {
  const { dt, npcs, coins, dishes, navGrid, tableLevels, questIndex } = c;
  let cleanCups = c.cleanCups;
  let nextId = c.nextId;
  const step = NPC_SPEED * dt;
  const removed: number[] = [];
  for (const n of npcs) {
    const slot = LAYOUT.tables[n.tableIndex];
    // Müşteri KENDİ zone'unun kapısını/sokağını kullanır (zone-yerel hareket; bölme duvarı sorunu yok).
    const nEntrance = LAYOUT.entrances[areaOfTable(n.tableIndex)];
    const nStreet = LAYOUT.streets[areaOfTable(n.tableIndex)];
    switch (n.state) {
      case 'toTable': {
        // Önce KAPIYA (sokaktaysa düz yürü — dışarıda engel yok), sonra koltuğa BFS rotayla
        // (navStep): eksen-kayması (moveAvoid) ön-sıra masayı dolaşamayıp KİLİTLENİYORDU →
        // müşteri arka masaya hiç oturamıyor, masayı süresiz rezerve ediyordu (telefon bug'ı 2026-06-11).
        const goingIn = n.pos[2] > nEntrance[2] + 0.2;
        // Y2: hedef ATANAN koltuk (grup üyeleri aynı masada farklı koltuğa oturur).
        const seat = slot.seats[n.seatIndex];
        if (goingIn) {
          moveToward(n.pos, nEntrance, step);
        } else if (navStep(n.pos, seat, step, navGrid, 0.5)) {
          // Oturdu (koltuğa tam otur); çay servisini bekler. Sabır timer'ı başlar (D-011);
          // OTURDUĞU masanın seviyesi sabrı uzatır (Faz 2h).
          n.pos[0] = seat[0];
          n.pos[2] = seat[2];
          n.state = 'waitingForTea';
          n.timer = tablePatience(tableLevels[n.tableIndex] ?? 0, n.product);
        } else {
          // Sigorta: rota bulunamayıp uzun süre oturamadıysa vazgeçip gider — masa SÜRESİZ
          // rezerve kalamaz (timer toTable'da yürüme-süresi sayacı olarak kullanılır).
          n.timer += dt;
          if (n.timer > 30) n.state = 'leaving';
        }
        break;
      }
      case 'waitingForTea':
        // Çay artık OTO gelmez — oyuncu/garson tepsiyle bırakmalı. Sabır biterse sessizce gider.
        n.timer -= dt;
        if (n.timer <= 0) n.state = 'leaving';
        break;
      case 'drinking':
        n.timer -= dt;
        if (n.timer <= 0) {
          // Öde: parayı masanın yanına düşür — ÜRÜN fiyatı (çay 5 / tost 25, M3) + masa bahşişi (Faz 2h).
          // (turu-5'te kule istifi ve moneySpot saçılımı denendi; kullanıcı İKİSİNİ de beğenmedi →
          // ORİJİNAL davranış geri. Para sunumuna bir daha dokunmadan önce telefonda mockup onayı al.)
          coins.push({
            id: nextId++,
            pos: [slot.table[0] + (Math.random() - 0.5), 0.3, slot.table[2] + 0.6 + (Math.random() - 0.5)],
            value: PRODUCTS[n.product].price + tableTip(tableLevels[n.tableIndex] ?? 0),
          });
          // İçtiği bardak masada KİRLİ kalır (Faz 2e): toplanıp yıkanmalı, yoksa temiz biter.
          // tableIndex ile masaya etiketlenir (D-019): masa-başı eşik aşılınca masa KİRLİ olur.
          // ONBOARDING GATE (kullanıcı 2026-06-10): bulaşık MEKANİĞİ öğretilmeden (q_wash görevi
          // gelmeden) kirli bardak HİÇ çıkmaz — bardak doğrudan temiz havuza döner (korunum bozulmaz,
          // demleme durmaz). q_wash aktif olduğu andan itibaren kirli bırakılır → görevle birlikte öğrenilir.
          if (questIndex >= WASH_QUEST_INDEX) {
            dishes.push({
              id: nextId++,
              pos: [slot.table[0] + (Math.random() - 0.5) * 0.6, 0.95, slot.table[2] + (Math.random() - 0.5) * 0.6],
              tableIndex: n.tableIndex,
              kind: PRODUCTS[n.product].dish, // M3: bardak/tabak görseli
            });
          } else {
            cleanCups += 1;
          }
          n.state = 'leaving';
        }
        break;
      case 'leaving': {
        // Önce KAPIYA (içerdeyse BFS rotayla — masalara takılmaz), sonra SOKAĞA düz yürü.
        const nearDoor = n.pos[2] >= nEntrance[2] - 0.2 || dist2D(n.pos, nEntrance) <= 0.45;
        if (nearDoor) {
          if (moveToward(n.pos, nStreet, step)) removed.push(n.id);
        } else {
          navStep(n.pos, nEntrance, step, navGrid, 0.4);
        }
        break;
      }
    }
  }
  const liveNpcs = removed.length ? npcs.filter((n) => !removed.includes(n.id)) : npcs;
  c.cleanCups = cleanCups;
  c.nextId = nextId;
  c.liveNpcs = liveNpcs;
}

/**
 * Oyuncu hareketi (D-016: mobilya collision'ı)
 * Collision YALNIZ input'la harekette uygulanır (eksen-başı kayma); doğrudan setState/__teleport
 * (testler/dev kancası) input'suz konum atadığında engellenmez → birim/smoke testleri etkilenmez.
 */
function playerMoveSystem(c: TickCtx): void {
  const { dt, s, tables, areasOpen } = c;
  const jMag = Math.hypot(s.inputJoystick[0], s.inputJoystick[1]);
  const input = jMag > 0.05 ? s.inputJoystick : s.inputKeyboard;
  const pr = LAYOUT.playerRadius;
  const oldX = s.player[0];
  const oldZ = s.player[2];
  const moveSpeed = playerSpeedFor(s.charUpgrades.speed); // hız kademesinden (v20)
  const dxIn = input[0] * moveSpeed * dt;
  const dzIn = input[1] * moveSpeed * dt;
  // Oyuncu yalnız AÇIK zone'ların BİRLEŞİMİNDE gezer (M2 union kelepçesi; L-şekil destekli —
  // kilitli salonun "boş arsa"sına girilmez).
  let [nx, nz] = clampToOpenAreas(oldX + dxIn, oldZ + dzIn, areasOpen);
  if (dxIn !== 0 || dzIn !== 0) {
    // MOBİLYA = KATI engel: yeni bir engele GİRİŞ bloklanır (eksen-başı kayma; kafa kafaya gelince durur).
    // AMA oyuncu zaten bir engelin İÇİNDEyse (ör. üstünde masa açıldı) kilitlenmesin → çıkışına izin ver
    // (aktör collision'ındaki desenin aynısı). Böylece "zorlasan da giremezsin" korunur ama hapsolmazsın.
    const furn = activeSolids(tables, areasOpen);
    const stuckInFurn = hitsSolid(oldX, oldZ, furn, pr);
    if (dxIn !== 0 && hitsSolid(nx, oldZ, furn, pr) && !stuckInFurn) nx = oldX;
    if (dzIn !== 0 && hitsSolid(nx, nz, furn, pr) && !stuckInFurn) nz = oldZ;
    // AKTÖR çarpışması KALDIRILDI (turu-5 m.9): oyuncu müşteri/personel kalabalığının içinden
    // geçer (kalabalıkta yürünemiyordu). Personel zaten navStep separation'ıyla oyuncuya yol verir.
  }
  const player = [nx, s.player[1], nz] as Vec3;
  c.input = input;
  c.pr = pr;
  c.player = player;
}

/**
 * Para mıknatısı + toplama (Faz 2f juice)
 * attractRadius içine giren para oyuncuya doğru GERÇEKTEN akar (hız > oyuncu hızı → daima yetişir),
 * pickupRadius'a varınca toplanır. Mıknatıs store'da yapıldığı için görsel = mantık → "yapışıp
 * toplanmayan para" bug'ı yapısal olarak imkansız (Coins.tsx sadece c.pos'u çizer).
 */
function coinSystem(c: TickCtx): void {
  const { dt, s, enqueueNotice, stats, player } = c;
  let coins = c.coins;
  let wallet = c.wallet;
  let lifetime = c.lifetime;
  let autoCollectSum = s.autoCollectSum;
  let autoCollectToastCooldown = Math.max(0, s.autoCollectToastCooldown - dt);
  if (coins.length) {
    const attractR = attractRadiusFor(s.charUpgrades.magnet); // mıknatıs kademesinden (v20)
    const keep: Coin[] = [];
    for (const c of coins) {
      const inMagnet = dist2D(player, c.pos) < attractR;
      if (inMagnet) {
        moveToward(c.pos, player, C.money.attractSpeed * dt);
      }
      if (dist2D(player, c.pos) < C.money.pickupRadius) {
        wallet = wallet.add(c.value);
        lifetime = lifetime.add(c.value);
        stats.coinsCollected += 1;
        continue;
      }
      // OTO-TOPLAMA (2026-06-13): uzun süre yerde bekleyen para kendiliğinden cüzdana girer.
      // Mıknatıs alanındaki coin'e dokunulmaz (zaten oyuncuya akıyor — manuel toplama hissi korunur).
      // stats.coinsCollected ARTMAZ (o sayaç manuel toplamanın quest/öğretici ölçüsü).
      c.age = (c.age ?? 0) + dt;
      if (!inMagnet && C.money.autoCollectAfter > 0 && c.age >= C.money.autoCollectAfter) {
        wallet = wallet.add(c.value);
        lifetime = lifetime.add(c.value);
        autoCollectSum += c.value;
        continue;
      }
      keep.push(c);
    }
    coins = keep;
  }
  // Oto-toplama bildirimi TOPLU çıkar (en sık autoCollectToastEvery sn'de bir) — kullanıcı
  // paranın kendiliğinden toplandığını GÖRSÜN ama toast spam'ı olmasın.
  if (autoCollectSum > 0 && autoCollectToastCooldown <= 0) {
    enqueueNotice({ text: 'Bekleyen paralar otomatik toplandı', ttl: 4, kind: 'reveal', reward: autoCollectSum });
    autoCollectSum = 0;
    autoCollectToastCooldown = C.money.autoCollectToastEvery;
  }
  c.coins = coins;
  c.wallet = wallet;
  c.lifetime = lifetime;
  c.autoCollectSum = autoCollectSum;
  c.autoCollectToastCooldown = autoCollectToastCooldown;
}

/**
 * Servis (D-011): ocakta tepsiyi doldur, bekleyen masalara çay bırak (yakınlık)
 */
function serveSystem(c: TickCtx): void {
  const { s, ready, carriedDirty, carriedDirtyFood, stats, liveNpcs, player } = c;
  let tray = c.tray;
  let trayFood = c.trayFood;
  let xp = c.xp;
  const trayCap = trayCapacityFor(s.charUpgrades.tray);
  // Servise yaklaşınca HAZIR üründen tepsi dolar. PAYLAŞIMLI kapasite (2026-06-09): ürün + kirli
  // aynı tepsiyi paylaşır → toplam trayCap'i aşamaz. Karışık taşıma serbest (deadlock'u engeller).
  // B2: tek noktadan iki ürün alınabilir — çay tepsinin bardak bölmesine, tost tabak bölmesine.
  if (
    tray + trayFood + carriedDirty + carriedDirtyFood < trayCap &&
    dist2D(player, LAYOUT.stations[THE_SERVICE]) < C.serving.pickupRadius
  ) {
    for (const prod of ['tea', 'tost'] as const) {
      const free = trayCap - tray - trayFood - carriedDirty - carriedDirtyFood;
      if (free <= 0) break;
      const take = Math.min(free, ready[prod]);
      if (take <= 0) continue;
      if (prod === 'tost') trayFood += take;
      else tray += take;
      ready[prod] -= take;
      stats.teaPickups += take; // generic "üründen al" sayacı (görevler ortak)
    }
  }
  // Bekleyen masaya yaklaşınca tepsiden ÜRÜN bırak → müşteri içmeye/yemeye başlar (toplu servis).
  // B2: müşterinin istediği ürün ARTIK MÜŞTERİNİN KENDİSİNDE (n.product) — eskiden masasının
  // bölgesinden okunuyordu. Tepside O ürün yoksa servis OLMAZ (çayla tost müşterisi doyurulamaz).
  if (tray > 0 || trayFood > 0) {
    for (const n of liveNpcs) {
      if (tray <= 0 && trayFood <= 0) break;
      if (n.state !== 'waitingForTea') continue;
      const wantsFood = n.product === 'tost';
      if (wantsFood ? trayFood <= 0 : tray <= 0) continue;
      if (dist2D(player, LAYOUT.tables[n.tableIndex].table) < C.serving.serveRadius) {
        n.state = 'drinking';
        n.timer = C.npc.eatTime;
        if (wantsFood) trayFood -= 1;
        else tray -= 1;
        stats.teasServed += 1;
        if (wantsFood) stats.tostServed += 1; // "5 tost servis et" görevi (B2: alan sayacı değil)
        // Alan sayacı: hangi ALANDA servis verdiği (alanlı serveTea görevleri için) — ürünle ilgisi yok.
        const a = areaOfTable(n.tableIndex);
        stats.teasServedByArea[a] = (stats.teasServedByArea[a] ?? 0) + 1;
        xp += C.xp.perTeaServed;
      }
    }
  }
  c.tray = tray;
  c.trayFood = trayFood;
  c.xp = xp;
  c.trayCap = trayCap;
}

/**
 * Bardak döngüsü (Faz 2e): oyuncu masadaki kirli bardakları toplar, bulaşıkta yıkar (yakınlık)
 * PAYLAŞIMLI kapasite (2026-06-09): çay taşırken de kirli toplanabilir → toplam trayCap'i aşamaz.
 */
function dishCycleSystem(c: TickCtx): void {
  const { tray, trayFood, stats, trayCap, player } = c;
  let dishes = c.dishes;
  let cleanCups = c.cleanCups;
  let carriedDirty = c.carriedDirty;
  let carriedDirtyFood = c.carriedDirtyFood;
  let xp = c.xp;
  if (tray + trayFood + carriedDirty + carriedDirtyFood < trayCap && dishes.length) {
    const keep: Dish[] = [];
    for (const d of dishes) {
      if (tray + trayFood + carriedDirty + carriedDirtyFood < trayCap && dist2D(player, d.pos) < C.cups.collectRadius) {
        // turu-5 m.11: kirli kabın TÜRÜ tepsi görseline taşınır (tabak ≠ bardak); havuz/yıkama ortak.
        if (d.kind === 'plate') carriedDirtyFood += 1;
        else carriedDirty += 1;
      } else keep.push(d);
    }
    dishes = keep;
  }
  // Bulaşık noktasına yaklaşınca taşınan kirliler yıkanır → GLOBAL temiz havuza (B2: tek nokta).
  if (carriedDirty + carriedDirtyFood > 0 && dist2D(player, LAYOUT.dishStations[THE_SERVICE]) < C.cups.washRadius) {
    const washed = carriedDirty + carriedDirtyFood;
    cleanCups += washed;
    stats.dishesWashed += washed;
    xp += C.xp.perDishWashed * washed;
    carriedDirty = 0;
    carriedDirtyFood = 0;
  }
  c.dishes = dishes;
  c.cleanCups = cleanCups;
  c.carriedDirty = carriedDirty;
  c.carriedDirtyFood = carriedDirtyFood;
  c.xp = xp;
}

/**
 * GARSON HAVUZU (B2 — D-060). Eskiden garson bölgeye aitti: kendi bölgesinin ocağından alır, YALNIZ
 * kendi bölgesinin masalarına götürürdü (D-012/D-022). Kat tek servisten döndüğü için o ayrım
 * anlamını yitirdi — havuz GLOBAL: hepsi aynı noktadan alır, hepsi her masaya gider.
 * Kısmi assist korunur (D-014): oyuncudan yavaş ve küçük tepsili.
 * CLAIM: sıra sabit (1., 2., 3. garson); bir garsonun bu tick'te hedeflediği masayı diğeri HARİÇ
 * tutar → çift-hedef salınımı yok. Boşta bekleme noktaları 0.7 br arayla yan yana.
 * Tepsi B2'de İKİ BÖLMELİ (çay/tost): garson en acil bekleyenin ürününü yükler.
 */
function waiterSystem(c: TickCtx): void {
  const { dt, s, world, obstacles, navGrid, ready, stats, dirty, liveNpcs, player } = c;
  let xp = c.xp;
  const svc = world.services[THE_SERVICE];
  const wCount = svc?.open ? Math.min(svc.waiters, MAX_WAITERS) : 0;
  if (wCount === 0) {
    c.waiters = [];
    return;
  }
  const wStep = waiterSpeedFor(s.waiterUpgrades.speed) * dt;
  const wTrayCap = waiterTrayCapacityFor(s.waiterUpgrades.tray);
  const claimed = new Set<number>(); // bu tick'te hedeflenen masa index'leri (claim)
  const prev = s.waiters;
  const out: Waiter[] = [];

  for (let i = 0; i < wCount; i++) {
    const home: Vec3 = [LAYOUT.waiterHomes[THE_SERVICE][0] + i * 0.7, 0, LAYOUT.waiterHomes[THE_SERVICE][2]];
    const p = prev[i];
    const w: Waiter = p
      ? { pos: [...p.pos] as Vec3, tray: p.tray, trayFood: p.trayFood ?? 0 }
      : { pos: [...home] as Vec3, tray: 0, trayFood: 0 };
    // Garson kirli masaya ürün GÖTÜRMEZ (D-019). Her garson için YENİDEN filtrelenir (öncekinin
    // bu tick servis ettiği müşteri listeden düşer).
    const waiting = liveNpcs.filter((n) => n.state === 'waitingForTea' && !dirty.has(n.tableIndex));
    // Elindeki ürünle DOYURULABİLİR bekleyenler (tepsisinde çay varsa çay isteyenler…).
    const canServe = (n: (typeof waiting)[number]) => (n.product === 'tost' ? w.trayFood > 0 : w.tray > 0);
    const claimable = waiting.filter((n) => !claimed.has(n.tableIndex) && canServe(n));

    if (w.tray + w.trayFood > 0 && claimable.length > 0) {
      // Teslimat: en ACİL (sabrı en az kalan) bekleyene; eşitlikte en yakın (anti-starvation).
      let best = claimable[0];
      let bestTimer = Infinity;
      let bestDist = Infinity;
      for (const n of claimable) {
        const d = dist2D(w.pos, LAYOUT.tables[n.tableIndex].table);
        if (n.timer < bestTimer - 1e-6 || (Math.abs(n.timer - bestTimer) <= 1e-6 && d < bestDist)) {
          bestTimer = n.timer;
          bestDist = d;
          best = n;
        }
      }
      claimed.add(best.tableIndex);
      if (navStep(w.pos, LAYOUT.tables[best.tableIndex].table, wStep, navGrid, REACH_TABLE, player, obstacles)) {
        // TEK durakta o masada bekleyen HERKESE tepsi yettiğince bırakır (grup + tepsi-3 = tek seferde).
        for (const n of waiting) {
          if (w.tray + w.trayFood <= 0) break;
          if (n.tableIndex !== best.tableIndex || !canServe(n)) continue;
          n.state = 'drinking';
          n.timer = C.npc.eatTime;
          if (n.product === 'tost') w.trayFood -= 1;
          else w.tray -= 1;
          stats.waiterServed += 1;
          stats.waiterServedByService[THE_SERVICE] = (stats.waiterServedByService[THE_SERVICE] ?? 0) + 1;
          xp += C.xp.perWaiterServed;
        }
      }
    } else if (w.tray + w.trayFood < wTrayCap && waiting.length > 0) {
      // Yükleme: servisin ÖN yüzüne git (ürünler önde); varınca EN ACİL bekleyenin ürününden yükle.
      if (navStep(w.pos, LAYOUT.stationPickups[THE_SERVICE], wStep, navGrid, REACH_PICKUP, player, obstacles)) {
        // Talep sırası: en acil bekleyenin ürünü önce; kalan yere diğer üründen doldurur.
        const order = [...waiting].sort((a, b) => a.timer - b.timer).map((n) => n.product);
        for (const prod of [...order, 'tea' as const, 'tost' as const]) {
          const free = wTrayCap - w.tray - w.trayFood;
          if (free <= 0) break;
          const take = Math.min(free, ready[prod]);
          if (take <= 0) continue;
          if (prod === 'tost') w.trayFood += take;
          else w.tray += take;
          ready[prod] -= take;
        }
      }
    } else {
      // Boşta: kendi bekleme noktasına dön (garsonlar 0.7 br arayla — üst üste binmez).
      navStep(w.pos, home, wStep, navGrid, REACH_HOME, player, obstacles);
    }
    out.push(w);
  }
  c.xp = xp;
  c.waiters = out;
}

/**
 * BULAŞIKÇI (Faz 2e kısmi assist) — B2'de kat çapında TEK kişi: kirlileri nerede olursa olsun
 * toplar, katın tek bulaşık noktasında yıkar. (Eskiden her servisin kendi bulaşıkçısı vardı ve
 * yalnız kendi bölgesinin kirlilerine bakardı.)
 */
function dishwasherSystem(c: TickCtx): void {
  const { dt, s, world, obstacles, navGrid, player } = c;
  let dishes = c.dishes;
  let cleanCups = c.cleanCups;
  const svc = world.services[THE_SERVICE];
  if (!svc?.open || !svc.hasDishwasher) {
    c.dishwasher = null;
    return;
  }
  const prevDw = s.dishwasher;
  const dw: Waiter = prevDw
    ? { pos: [...prevDw.pos] as Vec3, tray: prevDw.tray, trayFood: prevDw.trayFood }
    : { pos: [...LAYOUT.dishwasherHomes[THE_SERVICE]] as Vec3, tray: 0, trayFood: 0 };
  const dStep = dishSpeedFor(s.waiterUpgrades.dishSpeed) * dt; // v29: hız panel kademesinden
  const dCap = dishCarryCapacityFor(s.waiterUpgrades.dishCarry);
  const carried = dw.tray + dw.trayFood;
  if (carried >= dCap || (carried > 0 && dishes.length === 0)) {
    // Dolu (ya da elinde var ama toplanacak kalmadı) → bulaşıkta yıka. Bardak da tabak da AYNI
    // havuza döner (korunum değişmezi tek).
    if (navStep(dw.pos, LAYOUT.dishStations[THE_SERVICE], dStep, navGrid, REACH_WASH, player, obstacles)) {
      cleanCups += dw.tray + dw.trayFood;
      dw.tray = 0;
      dw.trayFood = 0;
    }
  } else if (dishes.length > 0) {
    // Topla: KATTAKİ en yakın kirli kaba yaklaş; collectRadius'a girince al.
    let target = dishes[0];
    let td = Infinity;
    for (const d of dishes) {
      const dd = dist2D(dw.pos, d.pos);
      if (dd < td) { td = dd; target = d; }
    }
    if (navStep(dw.pos, target.pos, dStep, navGrid, C.cups.collectRadius, player, obstacles)) {
      dishes = dishes.filter((d) => d.id !== target.id);
      // Kabın TÜRÜ leğende korunur (B2: tek bulaşıkçı iki tür de toplar → tabak taşırken elinde
      // bardak görünmez; oyuncu tepsisindeki carriedDirty/carriedDirtyFood ayrımının aynısı).
      if (target.kind === 'plate') dw.trayFood += 1;
      else dw.tray += 1;
    }
  } else {
    // Boşta: bulaşık köşesine dön.
    navStep(dw.pos, LAYOUT.dishwasherHomes[THE_SERVICE], dStep, navGrid, REACH_HOME, player, obstacles);
  }
  c.dishes = dishes;
  c.cleanCups = cleanCups;
  c.dishwasher = dw;
}

/**
 * Mekânsal etkileşim noktaları (D-018 §2, HAREKET-TEMELLİ)
 * Oyuncu fiziksel olarak aynı anda TEK dolum noktasının üstünde olabilir. Para yalnız oyuncu DURUNCA akar:
 * üstünden GEÇERKEN (hareket halinde) hiç alınmaz, DURDUĞU (input bıraktığı) anda HEMEN başlar (sayaç/countdown YOK).
 */
function interactionZoneSystem(c: TickCtx): void {
  const { lifetime, padsDone, tables, stationLevels, tableLevels, stats, questIndex } = c;
  const padGate: GateState = {
    padsDone,
    tables,
    stationLevel: stationLevels[0],
    lifetime: lifetime.toNumber(),
    waiterServed: stats.waiterServed,
    waiterServedByService: stats.waiterServedByService,
    tableLevels, // Y4: allZoneTablesLevel gate'i (2. garson pad'leri)
  };
  // EKRANDA TEK PAD (quest sistemi): görünürlük visiblePads'ten (Pad.tsx ile aynı kaynak).
  const activePads: PadDef[] = visiblePads(questIndex, padGate);
  c.padGate = padGate;
  c.activePads = activePads;
}

/**
 * Yeni-özellik bildirimi (D-019 §4; v21 zone-başına)
 * Bir ikincil özellik (yükseltme/personel) İLK kez açıldığında kısa toast + pan. revealSeen baseline
 * init'te kurulduğu için zaten açık olanlar tekrar bildirmez (yeniden-yükleme spam'ı yok; persist gerekmez).
 * turu-5 m.8: karakter-butonu spotlight'ı bekliyorsa (charStat görevi aktif + panel hiç açılmamış)
 * reveal kamera panı BASTIRILIR — ekranda tek yönlendirme kalır (table2 bitişi ertesi tick'te
 * "çay yükselt" reveal'ını ateşliyordu; kamera oraya kayarken spotlight char butonunu gösteriyordu).
 */
function revealSystem(c: TickCtx): void {
  const { dt, s, tables, areasOpen, stationLevels, tableLevels, enqueueNotice, questIndex, requestFocus, input, player, padGate, activePads } = c;
  let notice = c.notice;
  let revealSeen = c.revealSeen;
  const spotlightPending =
    questIndex < C.quests.length &&
    C.quests[questIndex].target.type === 'charStat' &&
    !s.charPanelSeen;
  // C paketi (⑤⑥ → tek talimat kaynağı = görev kartı): bir reveal'ın açtığı özelliği AYNI/İLERİDEKİ
  // bir görev zaten öğretiyorsa reveal toast'ı GÖSTERİLMEZ (sessizce tüketilir) — "Çay ocağını
  // yükseltebilirsin ☕" gibi mesajlar görev cümlesiyle çakışıp görev sanılmasın.
  const questCoveredReveals = new Set<string>();
  for (let qi = questIndex; qi < C.quests.length; qi++) {
    const t = C.quests[qi].target;
    if (t.type === 'stationLevel') questCoveredReveals.add(`upgrade:${THE_SERVICE}`);
    else if (t.type === 'tableLevel') questCoveredReveals.add('tableUp:0');
    else if (t.type === 'tablesAtLevel') questCoveredReveals.add(`tableUp:${t.area ?? 0}`);
    else if (t.type === 'pad') questCoveredReveals.add(`opt:${t.id}`);
  }
  for (const [key, text, rp] of revealKeys(padGate, areasOpen, stationLevels)) {
    if (!revealSeen.includes(key)) {
      // Bir görevin kapsadığı özellik: reveal'ı sessizce tüket (toast/pan yok) → tek talimat görev kartı.
      if (questCoveredReveals.has(key)) {
        revealSeen = [...revealSeen, key];
        continue;
      }
      // turu-6 fix: spotlight beklerken PAN'lı reveal'ı TAMAMEN ertele (toast + tüketim dahil).
      if (spotlightPending && rp) continue;
      revealSeen = [...revealSeen, key];
      enqueueNotice({ text, ttl: 4.5, kind: 'reveal' });
      // Yeni açılan noktaya anlık kamera pan ("orada bir şey var" — kullanıcı isteği 2026-06-09).
      if (rp) requestFocus(rp, 1);
    }
  }
  if (notice) {
    const ttl = notice.ttl - dt;
    notice = ttl > 0 ? { ...notice, ttl } : null;
  }

  // Oyuncu DURUYOR mu? (input ~0). Para yalnız dururken akar → üstünden geçerken (hareket) alınmaz.
  const fillReady = Math.hypot(input[0], input[1]) <= 0.1;

  // Oyuncunun şu an üstünde durduğu dolum noktasının kanonik id'si (pad.id / 'tea:z' / 'tableUp:i').
  let onFillId: string | null = null;
  for (const pad of activePads) {
    const pp = LAYOUT.padPos[pad.id];
    if (pp && dist2D(player, pp) < PAD_RADIUS) { onFillId = pad.id; break; }
  }
  // GUARD (gece fix 2026-06-10): oyuncu AÇIK bir ocağın pickup yarıçapındaysa niyeti ÇAY ALMAK'tır —
  // yükseltme dolumu kesinlikle başlamaz (mekânsal ayrımın yanında ikinci emniyet).
  const inPickupRange = dist2D(player, LAYOUT.stations[THE_SERVICE]) < C.serving.pickupRadius;
  if (
    !onFillId &&
    !inPickupRange &&
    stationUpgradeUnlocked(padGate) &&
    stationLevels[THE_SERVICE] < stationSoftMaxLevel() &&
    dist2D(player, LAYOUT.stationUpgradeSpots[THE_SERVICE]) < PAD_RADIUS
  ) {
    onFillId = FILL_TEA + THE_SERVICE;
  }
  if (!onFillId) {
    for (let i = 0; i < tables; i++) {
      // v21: her masanın yükseltmesi KENDİ zone'unun gate'ine bağlı (o salonun 4 masası açık mı).
      if (!tableUpgradeUnlockedIn(areaOfTable(i), padGate)) continue;
      if (tableLevels[i] >= tableSoftMaxLevel()) continue;
      if (dist2D(player, LAYOUT.tables[i].upgradeSpot) < TABLE_UP_RADIUS) { onFillId = FILL_TABLE + i; break; }
    }
  }
  c.notice = notice;
  c.revealSeen = revealSeen;
  c.fillReady = fillReady;
  c.onFillId = onFillId;
}

/**
 * Pad doldurma (omurga + opsiyonel; her pad açtığı objenin yerinde)
 */
function padFillSystem(c: TickCtx): void {
  const { dt, requestFocus, pr, player, activePads, fillReady, onFillId } = c;
  let wallet = c.wallet;
  let padsDone = c.padsDone;
  let padFills = c.padFills;
  let activeSpot = c.activeSpot;
  let cleanCups = c.cleanCups;
  let xp = c.xp;
  const activePad = onFillId ? activePads.find((p) => p.id === onFillId) : undefined;
  if (activePad) {
    const padPos = LAYOUT.padPos[activePad.id]!;
    let fill = padFills[activePad.id] ?? 0;
    if (fillReady && wallet.gt(0)) {
      const amt = Math.min(activePad.fillRate * dt, wallet.toNumber(), activePad.cost - fill);
      if (amt > 0) {
        fill += amt;
        wallet = wallet.sub(amt);
      }
    }
    if (fill >= activePad.cost) {
      // Pad tamamlandı: SADECE padsDone'a ekle (etkiler türetilir, D-015), kısmi dolumu temizle.
      padsDone = [...padsDone, activePad.id];
      xp += C.xp.perPad;
      const rest = { ...padFills };
      delete rest[activePad.id];
      padFills = rest;
      activeSpot = null;
      // ALAN açılışı (Faz 3a): yeni alan kendi bardak stoğuyla gelir + kamera oraya pan
      // ("orada yeni bir dünya var" hissi — quest kamerası ayrıca sıradaki göreve döner).
      if (activePad.effect.type === 'unlockArea') {
        cleanCups += C.cups.poolBase;
        // Yeni açılan ALANIN merkezine pan (M2: index pad listesinden değil, AÇILMIŞ sayıdan).
        const aNew = deriveWorld(padsDone).areasOpen - 1;
        const ab = LAYOUT.areaBounds[aNew];
        requestFocus([(ab.minX + ab.maxX) / 2, 0, (ab.minZ + ab.maxZ) / 2], 3); // en yüksek öncelik
      }
      // Masa pad'i oyuncunun DURDUĞU yerde belirir → oyuncu masanın içinde kalmasın, anında dışarı it.
      if (activePad.effect.type === 'addTable') {
        // Masa yarısı + oyuncu yarıçapı — push-out oyuncuyu masanın içinde bırakmaz.
        const out = LAYOUT.tableHalf[0] + pr + 0.1;
        let ex = player[0] - padPos[0];
        let ez = player[2] - padPos[2];
        const ed = Math.hypot(ex, ez);
        if (ed < out) {
          if (ed < 1e-4) { ex = 0; ez = 1; } else { ex /= ed; ez /= ed; }
          player[0] = padPos[0] + ex * out;
          player[2] = padPos[2] + ez * out;
        }
      }
    } else {
      padFills = { ...padFills, [activePad.id]: fill };
      activeSpot = { kind: 'pad', label: activePad.label, fill, cost: activePad.cost };
    }
  }
  c.wallet = wallet;
  c.padsDone = padsDone;
  c.padFills = padFills;
  c.activeSpot = activeSpot;
  c.cleanCups = cleanCups;
  c.xp = xp;
}

/**
 * Mekânsal çay yükseltme noktası (ZONE BAŞINA; ocağın önünde dur → altta bar dolar)
 * Biriken ₺ KORUNUR (çıkınca sıfırlanmaz; D-018 dwell) → para harcanıp boşa gitmez.
 */
function stationUpgradeSystem(c: TickCtx): void {
  const { dt, upgradeFills, stationLevels, fillReady, onFillId } = c;
  let wallet = c.wallet;
  let activeSpot = c.activeSpot;
  let cleanCups = c.cleanCups;
  let xp = c.xp;
  if (onFillId != null && onFillId.startsWith(FILL_TEA)) {
    const z = Number(onFillId.slice(FILL_TEA.length));
    const cost = stationUpgradeCostAt(z, stationLevels[z]); // M3: tost tezgâhı kendi maliyet çarpanıyla
    if (fillReady && wallet.gt(0)) {
      const amt = Math.min(upgradeFillRateFor(cost) * dt, wallet.toNumber(), cost - upgradeFills[z]);
      if (amt > 0) {
        upgradeFills[z] += amt;
        wallet = wallet.sub(amt);
      }
    }
    if (upgradeFills[z] >= cost) {
      stationLevels[z] += 1;
      xp += C.xp.perUpgrade;
      upgradeFills[z] = 0;
      cleanCups += C.cups.poolPerLevel; // havuz ocak seviyesiyle büyür (Faz 2e; global depo)
    }
    const lv = stationLevels[z];
    const nextCost = lv < stationSoftMaxLevel() ? stationUpgradeCostAt(z, lv) : cost;
    // Etiket seviyenin KİMLİĞİNİ söyler (tek merdiven, iki kimlik): L4'ten önce ocak, sonra tezgâh.
    const unitName = isCounter(lv) ? 'Tezgâh' : 'Çay Ocağı';
    // GÖRSEL: istasyon L1'den başlar (iç seviye 0-tabanlı; etiket +1). Soft max → "Usta" (💎/video, Faz 4).
    activeSpot = {
      kind: 'upgrade',
      label: `${unitName} L${lv + 1}${lv < stationSoftMaxLevel() ? ` → L${lv + 2}` : ' (Usta 💎)'}`,
      fill: upgradeFills[z],
      cost: nextCost,
    };
  }

  // (v29: mekânsal garson hız yükseltmesi kalktı — hız karakter panelinden satın alınır.)
  c.wallet = wallet;
  c.activeSpot = activeSpot;
  c.cleanCups = cleanCups;
  c.xp = xp;
}

/**
 * Mekânsal masa yükseltme (Faz 2h, MASA-BAŞI / My Hotel): açık masanın KENARINDAKİ noktada dur → o masanın
 * bahşişi + sabrı artar. Gating: 2. masa açılınca belirir (D-018 §1: işaretler kenara taşındı).
 */
function tableUpgradeSystem(c: TickCtx): void {
  const { dt, tableLevels, tableUpgradeFills, fillReady, onFillId } = c;
  let wallet = c.wallet;
  let activeSpot = c.activeSpot;
  let xp = c.xp;
  if (onFillId != null && onFillId.startsWith(FILL_TABLE)) {
    const i = Number(onFillId.slice(FILL_TABLE.length));
    const cost = tableNextCost(tableLevels[i], areaOfTable(i));
    let fill = tableUpgradeFills[i] ?? 0;
    if (fillReady && wallet.gt(0)) {
      const amt = Math.min(upgradeFillRateFor(cost) * dt, wallet.toNumber(), cost - fill);
      if (amt > 0) {
        fill += amt;
        wallet = wallet.sub(amt);
      }
    }
    if (fill >= cost) {
      tableLevels[i] += 1;
      xp += C.xp.perUpgrade;
      fill = 0;
    }
    tableUpgradeFills[i] = fill;
    const nextCost = tableLevels[i] < tableSoftMaxLevel() ? tableNextCost(tableLevels[i], areaOfTable(i)) : cost;
    // GÖRSEL: masa L1'den başlar (iç tableLevels 0-tabanlı; etiket +1). Soft max → "Usta" (💎/video, Faz 4).
    activeSpot = {
      kind: 'upgrade',
      label: `Masa ${i + 1}: L${tableLevels[i] + 1}${tableLevels[i] < tableSoftMaxLevel() ? ` → L${tableLevels[i] + 2} (+${C.tables.tipBase} bahşiş)` : ' (Usta 💎)'}`,
      fill,
      cost: nextCost,
    };
  }
  c.wallet = wallet;
  c.activeSpot = activeSpot;
  c.xp = xp;
}

/**
 * D-015: padsDone değiştiyse türetilen alanlar yeniden hesaplanır (tek yazım noktası)
 */
function deriveSystem(c: TickCtx): void {
  const { padsDone, waiters } = c;
  const out = deriveWorld(padsDone);
  // Personel pad'i bu karede tamamlandıysa aktörü HEMEN var et (GLOBAL havuz — B2).
  const svc = out.services[THE_SERVICE];
  const home = LAYOUT.waiterHomes[THE_SERVICE];
  while (waiters.length < svc.waiters)
    waiters.push({ pos: [home[0] + waiters.length * 0.7, 0, home[2]] as Vec3, tray: 0, trayFood: 0 });
  if (waiters.length > svc.waiters) waiters.length = svc.waiters;
  if (svc.hasDishwasher && !c.dishwasher)
    c.dishwasher = { pos: [...LAYOUT.dishwasherHomes[THE_SERVICE]] as Vec3, tray: 0, trayFood: 0 };
  c.out = out;
}

/**
 * GÖREV İLERLEMESİ
 * Aktif görev karşılandıysa sıradakine geç (aynı tick'te birden çok karşılanabilir — ör. migrasyon
 * sonrası): tamamlama toast'u + kamera YENİ hedefe pan ("orada bir şey var" hissi, kullanıcı isteği).
 */
function questSystem(c: TickCtx): void {
  const { dt, s, padsDone, stationLevels, tableLevels, enqueueNotice, stats, requestFocus, out, input } = c;
  let wallet = c.wallet;
  let lifetime = c.lifetime;
  let questPhase = c.questPhase;
  let questPhaseT = c.questPhaseT;
  let xp = c.xp;
  let questIndex = c.questIndex;
  let questBase = c.questBase;
  const questCtx: QuestCtx = {
    padsDone,
    stationLevels,
    tableLevels,
    stats,
    questBase,
    charUpgrades: s.charUpgrades,
    waiterUpgrades: s.waiterUpgrades,
  };
  // GÖREV GEÇİŞ RİTMİ (A paketi): aktif görev karşılanınca kart ANINDA takas olmaz. 3 vuruş:
  //   active → (hedef tamam) → completing (kart %100 + yeşil onay, ödül+toast burada) → gap (boşluk,
  //   kart tamamlanmış görevi %100 tutar) → active (questIndex ilerler, yeni kart cardPop ile girer).
  // Bu sayede "bitti → ara → yeni" net hissedilir; zincirli tamamlamalar sıraya girer (instant skip yok).
  let questDone = false; // bu tick kart "tamamlandı" (completing/gap) gösterilsin mi
  let questDoneIndex = s.questDoneIndex;
  if (questPhase === 'active') {
    if (questIndex < C.quests.length && questTargetMet(C.quests[questIndex].target, questCtx)) {
      // BİTİŞ ANI: ödül + tamamlama toast'u + xp (bir kez).
      const qReward = C.quests[questIndex].reward ?? 0;
      if (qReward > 0) {
        wallet = wallet.add(qReward);
        lifetime = lifetime.add(qReward);
      }
      enqueueNotice({ text: C.quests[questIndex].title, ttl: 3.5, kind: 'quest', reward: qReward > 0 ? qReward : undefined });
      xp += C.xp.perQuest;
      // GÖREV BU ANDA İLERLER (kutlama yalnız görsel). Yoksa 1,3 sn'lik kutlama penceresinde
      // yapılan eylem yeni görevin TABANINA yazılır ve sayaç 0/1'de kilitlenirdi (q_coin domino'su).
      questDoneIndex = questIndex;
      questIndex += 1;
      const nt = questIndex < C.quests.length ? C.quests[questIndex].target : null;
      questBase = nt ? questCounterValue(nt, stats) ?? 0 : 0;
      questCtx.questBase = questBase;
      questPhase = 'completing';
      questPhaseT = QUEST_COMPLETE_DUR;
      questDone = true;
    }
  } else if (questPhase === 'completing') {
    questPhaseT -= dt;
    questDone = true;
    if (questPhaseT <= 0) {
      questPhase = 'gap';
      questPhaseT = QUEST_GAP_DUR;
    }
  } else {
    // 'gap': boşluk dolunca kutlama kartı iner, YENİ görevin kartı görünür (kamera hedefe pan).
    questPhaseT -= dt;
    questDone = true;
    if (questPhaseT <= 0) {
      questPhase = 'active';
      questDone = false;
      questDoneIndex = -1;
      if (questIndex < C.quests.length) {
        const q = C.quests[questIndex];
        if (q.target.type === 'charStat' && !s.charPanelSeen) {
          // charStat görevi + spotlight bekliyorsa kamera panı İPTAL — ekranda tek yönlendirme (spotlight).
          c.camFocus = null;
        } else {
          const fp = questFocusPos(q.target, tableLevels, out.tables.length, q.area ?? 0);
          if (fp) requestFocus(fp, 2); // charStat'ta 3D hedef yok → kamera sıçramaz (buton efekti yönlendirir)
        }
      }
    }
  }
  // Kamera odağı: joystick/klavye girdisi iptal eder (oyuncu kontrolü üstün); süre dolunca biter.
  // Deadzone 0.25 (2026-06-11 fix: 0.1 joystick titremesinde odağı yanlışlıkla bozuyordu).
  if (c.camFocus) {
    const ttl = c.camFocus.ttl - dt;
    const moving = Math.hypot(input[0], input[1]) > 0.25;
    c.camFocus = ttl > 0 && !moving ? { pos: c.camFocus.pos, ttl } : null;
  }
  // completing/gap: kart BİTEN görevi %100 + onay flash'ıyla gösterir (questIndex çoktan ilerledi).
  const viewIndex = questDone && questDoneIndex >= 0 ? questDoneIndex : questIndex;
  let quest = viewIndex < C.quests.length ? questView(C.quests[viewIndex], questCtx) : null;
  if (quest && questDone) quest = { ...quest, cur: quest.total, done: true };
  c.wallet = wallet;
  c.lifetime = lifetime;
  c.questPhase = questPhase;
  c.questPhaseT = questPhaseT;
  c.xp = xp;
  c.questIndex = questIndex;
  c.questBase = questBase;
  c.questDoneIndex = questDoneIndex;
  c.quest = quest;
}

/**
 * Level-up bildirimi: toplam XP bu tick'te seviye atlattıysa toast (kuyruğa girer).
 */
function levelNoticeSystem(c: TickCtx): void {
  const { s, noticeQueue, enqueueNotice, xp } = c;
  let notice = c.notice;
  if (xp !== s.xp) {
    const before = levelProgress(s.xp).level;
    const after = levelProgress(xp).level;
    if (after > before) enqueueNotice({ text: `Seviye ${after}!`, ttl: 4.5, kind: 'level' });
  }

  // Bildirim kuyruğu: mevcut toast yoksa sıradakini göster (tek slot, sırayla — B paketi).
  if (!notice && noticeQueue.length > 0) notice = noticeQueue.shift()!;
  c.notice = notice;
}

/** Bir karenin TAMAMI: sistemler sabit sırayla koşar. Sıra eski tek-gövdeli tick() ile birebirdir. */
export function runTick(c: TickCtx): void {
  brewSystem(c);
  spawnSystem(c);
  npcSystem(c);
  playerMoveSystem(c);
  coinSystem(c);
  serveSystem(c);
  dishCycleSystem(c);
  waiterSystem(c);
  dishwasherSystem(c);
  interactionZoneSystem(c);
  revealSystem(c);
  padFillSystem(c);
  stationUpgradeSystem(c);
  tableUpgradeSystem(c);
  deriveSystem(c);
  questSystem(c);
  levelNoticeSystem(c);
}
