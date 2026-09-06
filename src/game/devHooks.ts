// Test/dev kancaları. 3D sahne görsel doğrulanamaz; durum buradan okunur.
// window.__game  -> salt-okunur anlık görüntü
// window.__advanceTime(sn) -> simülasyonu hızlı ileri sar
import { useGame, visiblePads, questCounterValue, LAYOUT, servicePlace, trayCapacity, dirtyTables, parkSpot } from './store';
import { THE_SERVICE, sellsTost } from './world';
import { perf, type PerfSnapshot } from './perf';
import { economyConfig, levelProgress, charLevel, type CharStat } from '../config/economy.config';
import type { SaveStats } from './save';
import type { Vec3 } from './types';

declare global {
  interface Window {
    __game?: () => Record<string, unknown>;
    __advanceTime?: (seconds: number) => Record<string, unknown>;
    __resetGame?: () => void;
    __addMoney?: (amount: number) => Record<string, unknown>;
    __upgradeStation?: () => boolean;
    __teleport?: (x: number, z: number) => Record<string, unknown>;
    /** Quest hattında belirli göreve atla (id ile; smoke testleri sıralı sayaç görevlerini beklemesin). */
    __setQuest?: (id: string) => Record<string, unknown>;
    /** Kalıcı sayaç ver (ör. waiterServed=20 → arka-plan reveal şartını test et). */
    __grantStat?: (key: string, value: number) => Record<string, unknown>;
    /** Karakter özelliği satın al (v20; panel butonunun store yolu). */
    __buyChar?: (stat: CharStat) => boolean;
    /** Masa seviyesini doğrudan ayarla (Y2 koltuk/grup testleri — koltuk = seviyeden türetilir). */
    __setTableLevel?: (tableIndex: number, level: number) => Record<string, unknown>;
    /** Anlık render bütçesi (FPS Tier 2): { fps, calls, tris }. PerfProbe 0.5sn'de bir günceller. */
    __perf?: () => PerfSnapshot;
    /** DEV-ONLY ham setState (canlı görsel ayar; masa/zone/seviye zorlama). Üretimde kullanılmaz. */
    __setState?: (patch: Record<string, unknown>) => Record<string, unknown>;
    /** Oyuncuyu hiçbir mekanizmayı tetiklemeyen noktaya park eder (Faz A3: duman testi elle
     *  yazılmış köşe koordinatı kullanmasın — nokta YERLEŞİMDEN türetilir). */
    __park?: () => Record<string, unknown>;
  }
}

export function installDevHooks(): void {
  if (typeof window === 'undefined') return;

  window.__game = () => {
    const s = useGame.getState();
    const place = servicePlace(s.areasOpen);
    const gate = {
      padsDone: s.padsDone,
      tables: s.tables,
      stationLevel: s.stationLevels[0],
      lifetime: s.lifetime.toNumber(),
      waiterServed: s.stats.waiterServed,
      waiterServedByService: s.stats.waiterServedByService,
      tableLevels: s.tableLevels,
    };
    // Quest sistemi: görünür pad = aktif görevin pad'i (ekranda tek pad).
    const pad = visiblePads(s.questIndex, gate)[0] ?? null;
    return {
      wallet: s.wallet.toNumber(),
      diamonds: s.diamonds.toNumber(),
      lifetime: s.lifetime.toNumber(),
      tables: s.tables,
      stations: s.stations,
      areasOpen: s.areasOpen,
      // B2: kat TEK servis noktasından döner → "zone başına ocak/personel" anlık görüntüsü kalktı,
      // yerine tek `service` nesnesi geldi (testler ve duman testi buradan okur).
      service: {
        level: s.stationLevels[THE_SERVICE],
        readyTea: s.ready.tea,
        readyTost: s.ready.tost,
        sellsTost: sellsTost(s.stationLevels[THE_SERVICE]),
        waiters: s.waiters.length,
        hasDishwasher: s.dishwasher != null,
        // B3-1: servisin YERİ açık alan sayısına bağlı (3. Alan açılınca arka banda taşınır).
        stationPos: place.station,
        dishStationPos: place.dish,
        upgradeSpotPos: place.upgradeSpot,
        movedToBand: place.areaIndex !== 0,
      },
      stationLevel: s.stationLevels[THE_SERVICE],
      padsDone: [...s.padsDone],
      npcCount: s.npcCount,
      // Servis durumu (D-011): hazır ÇAY (geri-uyum adı; tost ayrı — service.readyTost).
      readyCups: s.ready.tea,
      tray: s.tray,
      trayFood: s.trayFood,
      trayCap: trayCapacity(),
      // Masa-başı yükseltme (Faz 2h): her masanın seviyesi + yanındaki yükseltme noktaları
      tableLevels: [...s.tableLevels],
      tableUpgradeSpots: LAYOUT.tables.map((t) => t.upgradeSpot),
      waitingCount: s.npcs.filter((n) => n.state === 'waitingForTea').length,
      stationPos: place.station,
      // Servis edilmeyi bekleyen ilk müşterinin koltuğu (smoke servis testi için) — yoksa null.
      firstWaitingSeat: (() => {
        const w = s.npcs.find((n) => n.state === 'waitingForTea');
        return w ? LAYOUT.tables[w.tableIndex].seat : null;
      })(),
      coins: s.coins.length,
      // Bardak döngüsü (Faz 2e)
      cleanCups: s.cleanCups,
      dirtyCount: s.dishes.length,
      carriedDirty: s.carriedDirty,
      carriedDirtyFood: s.carriedDirtyFood,
      dishStationPos: place.dish,
      firstDishPos: s.dishes[0] ? s.dishes[0].pos : null,
      // Kirli masa mekaniği (D-019): eşiği aşan masa indeksleri (müşteri oturmaz + garson götürmez).
      dirtyTables: [...dirtyTables(s.dishes, s.tableLevels)],
      dishesByTable: LAYOUT.tables.map((_, i) => s.dishes.filter((d) => d.tableIndex === i).length),
      hasDishwasher: s.dishwasher != null,
      dishwasherTray: s.dishwasher ? s.dishwasher.tray + s.dishwasher.trayFood : 0,
      dishwasherPos: s.dishwasher ? s.dishwasher.pos.map((n: number) => +n.toFixed(2)) : null,
      padFill: Math.floor(pad ? s.padFills[pad.id] ?? 0 : 0),
      currentPad: pad ? pad.id : null,
      padCost: pad ? pad.cost : 0,
      padPos: pad ? LAYOUT.padPos[pad.id] : null,
      // Garson durumu (Faz 2d) — zone-1 geri-uyum (v29: hız kademesi waiterUpgrades'te)
      hasWaiter: s.waiters[0] != null,
      waiterTray: s.waiters[0] ? s.waiters[0].tray : 0,
      waiterPos: s.waiters[0] ? s.waiters[0].pos.map((n) => +n.toFixed(2)) : null,
      // Quest sistemi (2026-06-09): aktif görev + sayaçlar + kamera odağı.
      questIndex: s.questIndex,
      quest: s.quest ? { id: s.quest.id, title: s.quest.title, cur: s.quest.cur, total: s.quest.total } : null,
      stats: { ...s.stats },
      // Level/XP sistemi (v17): toplam xp + türetilen seviye/ilerleme + ayarlar.
      xp: s.xp,
      level: levelProgress(s.xp),
      settings: { ...s.settings },
      // Karakter yükseltmeleri (v20): kademeler + türetilen karakter seviyesi + spotlight bayrağı.
      charUpgrades: { ...s.charUpgrades },
      charLevel: charLevel(s.charUpgrades),
      charPanelSeen: s.charPanelSeen,
      // Garson yükseltmeleri (v27/Y3) + havuzdaki her garsonun anlık tepsi yükü (çay/tost).
      waiterUpgrades: { ...s.waiterUpgrades },
      waiterTrays: s.waiters.map((w) => w.tray + w.trayFood),
      camFocus: s.camFocus ? { pos: s.camFocus.pos, ttl: +s.camFocus.ttl.toFixed(2) } : null,
      // Yeni-özellik bildirimi (D-019 §4): anlık toast metni + bu oturumda bildirilmiş reveal anahtarları.
      notice: s.notice ? s.notice.text : null,
      revealSeen: [...s.revealSeen],
      upgradeFill: Math.floor(s.upgradeFills[0]),
      upgradeZonePos: place.upgradeSpot,
      activeSpot: s.activeSpot ? { kind: s.activeSpot.kind, label: s.activeSpot.label } : null,
      player: s.player.map((n) => +n.toFixed(2)),
      offlineEarned: s.offlineEarned,
    };
  };

  // Sabit küçük adımlarla ileri sar (NPC durum makinesi stabil kalsın).
  window.__advanceTime = (seconds: number) => {
    const tick = useGame.getState().tick;
    const stepDt = 0.1;
    let remaining = Math.max(0, seconds);
    let guard = 0;
    while (remaining > 0 && guard < 200000) {
      tick(Math.min(stepDt, remaining));
      remaining -= stepDt;
      guard++;
    }
    return window.__game!();
  };

  window.__resetGame = () => useGame.getState().hardReset();

  window.__addMoney = (amount: number) => {
    useGame.getState().addMoney(amount);
    return window.__game!();
  };

  window.__upgradeStation = () => useGame.getState().upgradeStation();

  window.__teleport = (x: number, z: number) => {
    useGame.setState({ player: [x, 0.6, z] as Vec3 });
    return window.__game!();
  };

  window.__park = () => {
    const s = useGame.getState();
    useGame.setState({ player: parkSpot(s.areasOpen, s.tables), inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    return window.__game!();
  };

  window.__setQuest = (id: string) => {
    const idx = economyConfig.quests.findIndex((q) => q.id === id);
    if (idx >= 0) {
      const s = useGame.getState();
      // Sayaç görevi ise delta tabanı ŞU ANKİ sayaç (görev şimdi başlamış gibi).
      const base = questCounterValue(economyConfig.quests[idx].target, s.stats) ?? 0;
      useGame.setState({ questIndex: idx, questBase: base, questPhase: 'active', questPhaseT: 0, questDoneIndex: -1 });
    }
    return window.__game!();
  };

  window.__buyChar = (stat: CharStat) => useGame.getState().buyCharUpgrade(stat);

  window.__setTableLevel = (tableIndex: number, level: number) => {
    const levels = useGame.getState().tableLevels.slice();
    levels[tableIndex] = level;
    useGame.setState({ tableLevels: levels });
    return window.__game!();
  };

  window.__perf = () => ({ ...perf });

  window.__setState = (patch) => {
    useGame.setState(patch as never);
    return window.__game!();
  };

  window.__grantStat = (key: string, value: number) => {
    const s = useGame.getState();
    useGame.setState({ stats: { ...s.stats, [key]: value } as SaveStats });
    return window.__game!();
  };
}
