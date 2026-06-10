// Test/dev kancaları. 3D sahne görsel doğrulanamaz; durum buradan okunur.
// window.__game  -> salt-okunur anlık görüntü
// window.__advanceTime(sn) -> simülasyonu hızlı ileri sar
import { useGame, visiblePads, questCounterValue, LAYOUT, trayCapacity, dirtyTables } from './store';
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
  }
}

export function installDevHooks(): void {
  if (typeof window === 'undefined') return;

  window.__game = () => {
    const s = useGame.getState();
    const gate = {
      padsDone: s.padsDone,
      tables: s.tables,
      stationLevel: s.stationLevels[0],
      lifetime: s.lifetime.toNumber(),
      waiterServed: s.stats.waiterServed,
    };
    // Quest sistemi: görünür pad = aktif görevin pad'i (ekranda tek pad).
    const pad = visiblePads(s.questIndex, gate)[0] ?? null;
    return {
      wallet: s.wallet.toNumber(),
      diamonds: s.diamonds.toNumber(),
      lifetime: s.lifetime.toNumber(),
      tables: s.tables,
      stations: s.stations,
      // Zone modeli (Faz 3a): geri-uyum anahtarları zone-1'i gösterir; per-zone detay `zones`'ta.
      zonesOpen: s.zonesOpen,
      zones: Array.from({ length: s.zonesOpen }, (_, z) => ({
        stationLevel: s.stationLevels[z],
        readyCups: s.readyCupsByZone[z],
        hasWaiter: s.waiters[z] != null,
        hasDishwasher: s.dishwashers[z] != null,
        waiterLevel: s.waiterLevels[z],
        stationPos: LAYOUT.stations[z],
        dishStationPos: LAYOUT.dishStations[z],
        upgradeZonePos: LAYOUT.upgradeZones[z],
      })),
      stationLevel: s.stationLevels[0],
      serviceSpeedMult: +s.serviceSpeedMult.toFixed(3),
      padsDone: [...s.padsDone],
      npcCount: s.npcCount,
      // Servis durumu (D-011) — zone-1 geri-uyum
      readyCups: s.readyCupsByZone[0],
      tray: s.tray,
      trayCap: trayCapacity(),
      // Masa-başı yükseltme (Faz 2h): her masanın seviyesi + yanındaki yükseltme noktaları
      tableLevels: [...s.tableLevels],
      tableUpgradeSpots: LAYOUT.tables.map((t) => t.upgradeSpot),
      waitingCount: s.npcs.filter((n) => n.state === 'waitingForTea').length,
      stationPos: LAYOUT.stations[0],
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
      dishStationPos: LAYOUT.dishStation,
      firstDishPos: s.dishes[0] ? s.dishes[0].pos : null,
      // Kirli masa mekaniği (D-019): eşiği aşan masa indeksleri (müşteri oturmaz + garson götürmez).
      dirtyTables: [...dirtyTables(s.dishes)],
      dishesByTable: LAYOUT.tables.map((_, i) => s.dishes.filter((d) => d.tableIndex === i).length),
      hasDishwasher: s.dishwashers[0] != null,
      dishwasherTray: s.dishwashers[0] ? s.dishwashers[0].tray : 0,
      dishwasherPos: s.dishwashers[0] ? s.dishwashers[0].pos.map((n) => +n.toFixed(2)) : null,
      padFill: Math.floor(pad ? s.padFills[pad.id] ?? 0 : 0),
      currentPad: pad ? pad.id : null,
      padCost: pad ? pad.cost : 0,
      padPos: pad ? LAYOUT.padPos[pad.id] : null,
      // Garson durumu (Faz 2d) + hız yükseltme (D-018 §6) — zone-1 geri-uyum
      hasWaiter: s.waiters[0] != null,
      waiterTray: s.waiters[0] ? s.waiters[0].tray : 0,
      waiterPos: s.waiters[0] ? s.waiters[0].pos.map((n) => +n.toFixed(2)) : null,
      waiterLevel: s.waiterLevels[0],
      waiterUpgradeSpotPos: LAYOUT.waiterUpgradeSpot,
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
      camFocus: s.camFocus ? { pos: s.camFocus.pos, ttl: +s.camFocus.ttl.toFixed(2) } : null,
      // Yeni-özellik bildirimi (D-019 §4): anlık toast metni + bu oturumda bildirilmiş reveal anahtarları.
      notice: s.notice ? s.notice.text : null,
      revealSeen: [...s.revealSeen],
      upgradeFill: Math.floor(s.upgradeFills[0]),
      upgradeZonePos: LAYOUT.upgradeZone,
      activeZone: s.activeZone ? { kind: s.activeZone.kind, label: s.activeZone.label } : null,
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

  window.__setQuest = (id: string) => {
    const idx = economyConfig.quests.findIndex((q) => q.id === id);
    if (idx >= 0) {
      const s = useGame.getState();
      // Sayaç görevi ise delta tabanı ŞU ANKİ sayaç (görev şimdi başlamış gibi).
      const base = questCounterValue(economyConfig.quests[idx].target, s.stats) ?? 0;
      useGame.setState({ questIndex: idx, questBase: base });
    }
    return window.__game!();
  };

  window.__buyChar = (stat: CharStat) => useGame.getState().buyCharUpgrade(stat);

  window.__grantStat = (key: string, value: number) => {
    const s = useGame.getState();
    useGame.setState({ stats: { ...s.stats, [key]: value } as SaveStats });
    return window.__game!();
  };
}
