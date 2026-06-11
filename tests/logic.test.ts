import { describe, it, expect, vi } from 'vitest';
import {
  economyConfig,
  upgradeCost,
  upgradeOutputMultiplier,
  brewQueueCapacity,
  cupPoolCapacity,
  derivedFromPads,
  tableUpgradeCost,
  tableTip,
  tablePatience,
  tableSeats,
  rollGroupSize,
  waiterSpeed,
  xpForLevel,
  levelProgress,
  SAVE_VERSION,
  charValue,
  charNextCost,
  charMaxTier,
  charLevel,
  trayCapacityFor,
  attractRadiusFor,
  playerSpeedFor,
} from '../src/config/economy.config';
import { D, fmt } from '../src/game/decimal';
import {
  useGame,
  LAYOUT,
  currentPad,
  visiblePads,
  questFocusPos,
  computeOfflineEarned,
  questTargetMet,
  questCounterValue,
  stationSoftMaxLevel,
  stationUpgradeCost,
  trayCapacity,
  tableSoftMaxLevel,
  tableUpgradeZoneUnlocked,
  tableUpgradeUnlockedZ,
  upgradeZoneUnlockedZ,
  waiterUpgradeUnlockedZ,
  waiterSoftMaxLevel,
  waiterUpgradeCost,
  waiterUpgradeUnlocked,
  TEA_PRICE,
  brewTime,
  incomeRate,
  dirtyTables,
  totalCupPool,
  stationUpgradeCostZ,
} from '../src/game/store';
import { migrate, defaultSave, defaultStats } from '../src/game/save';
import { buildNavGrid, findNavPath } from '../src/game/nav';

// Mevcut ilerleme durumundan gating (requires) için GateState üretir.
function gate() {
  const s = useGame.getState();
  return {
    padsDone: s.padsDone,
    tables: s.tables,
    stationLevel: s.stationLevels[0],
    lifetime: s.lifetime.toNumber(),
    waiterServed: s.stats.waiterServed,
  };
}

// Bir pad'in görev hattındaki quest index'i (her pad'in bir quest'i var).
function questIndexFor(padId: string): number {
  return economyConfig.quests.findIndex(
    (q) => q.target.type === 'pad' && (q.target as { id: string }).id === padId,
  );
}

// Pad'i quest hattında aktif yapıp (görünürlük), oyuncuyu üstüne koyup parayla tamamlar.
function completePad(padId: string): boolean {
  const pad = economyConfig.pads.find((p) => p.id === padId);
  if (!pad) return false;
  useGame.setState({ questIndex: questIndexFor(padId), questBase: 0 });
  useGame.getState().addMoney(pad.cost + 50);
  const pos = LAYOUT.padPos[padId];
  useGame.setState({ player: [pos[0], 0.6, pos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
  for (let i = 0; i < 400 && !useGame.getState().padsDone.includes(padId); i++) {
    useGame.getState().tick(0.1);
  }
  return useGame.getState().padsDone.includes(padId);
}

const spec = economyConfig.teaStation.upgrade;

describe('ekonomi yükseltme formülleri', () => {
  it('maliyet geometrik büyür', () => {
    expect(upgradeCost(spec, 1)).toBe(spec.costBase);
    expect(upgradeCost(spec, 2)).toBe(Math.floor(spec.costBase * spec.costGrowth));
    expect(upgradeCost(spec, 3)).toBeGreaterThan(upgradeCost(spec, 2));
  });

  it('L5 usta seviyesi normalden büyük sıçrar', () => {
    expect(upgradeOutputMultiplier(spec, 0)).toBe(1);
    const l4 = upgradeOutputMultiplier(spec, 4);
    const l5 = upgradeOutputMultiplier(spec, 5);
    expect(l5).toBeGreaterThan(l4);
    // L4->L5 sıçraması, L3->L4 sıçramasından büyük olmalı (usta rozeti)
    const j45 = l5 / l4;
    const j34 = upgradeOutputMultiplier(spec, 4) / upgradeOutputMultiplier(spec, 3);
    expect(j45).toBeGreaterThan(j34);
  });
});

describe('sayı biçimlendirme', () => {
  it('eşikleri doğru biçimler', () => {
    expect(fmt(D(150))).toBe('150');
    expect(fmt(D(1500))).toBe('1.5K');
    expect(fmt(D(1_000_000))).toBe('1M');
  });
});

describe('servis döngüsü (D-011 / Faz 2c)', () => {
  // Oyuncuyu kimseyi servis edemeyeceği, pad doldurmayacağı uzak bir köşeye park eder.
  function parkPlayerAway() {
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
  }

  it('ocak hazır-kuyruğa demler; kapasiteyi (ocak seviyesine bağlı) AŞMAZ', () => {
    useGame.getState().hardReset();
    parkPlayerAway();
    // Uzun süre: hiç servis yok → kuyruk dolar ama kapasitede durur.
    for (let i = 0; i < 1200; i++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    expect(s.readyCupsByZone[0]).toBeGreaterThan(0);
    expect(s.readyCupsByZone[0]).toBeLessThanOrEqual(brewQueueCapacity(s.stationLevels[0]));
  });

  it('servis EDİLMEYEN müşteri sabır aşımında SESSİZCE gider (ödeme yok)', () => {
    useGame.getState().hardReset();
    parkPlayerAway();
    // Sabır + döngü süresinden uzun simüle et; oyuncu servis etmiyor.
    for (let i = 0; i < 600; i++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    // Müşteriler gelip gidiyor ama hiç ödeme olmadı.
    expect(s.lifetime.toNumber()).toBe(0);
    expect(s.coins.length).toBe(0);
  });

  it('ocaktan tepsiye al → bekleyen masaya bırak → müşteri içer, öder, para toplanır', () => {
    useGame.getState().hardReset();
    parkPlayerAway();
    // Bir müşteri otursun + çay demlensin.
    for (let i = 0; i < 200; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().readyCupsByZone[0]).toBeGreaterThan(0);
    const waiting = useGame.getState().npcs.find((n) => n.state === 'waitingForTea');
    expect(waiting).toBeTruthy();

    // 1) Ocağa git → tepsi dolar.
    const st = LAYOUT.stations[0];
    useGame.setState({ player: [st[0], 0.6, st[2]] });
    useGame.getState().tick(0.1);
    const trayLoaded = useGame.getState().tray;
    expect(trayLoaded).toBeGreaterThan(0);
    expect(trayLoaded).toBeLessThanOrEqual(trayCapacity());

    // 2) Bekleyen müşterinin koltuğuna git → çay bırak.
    const seat = LAYOUT.tables[waiting!.tableIndex].seat;
    useGame.setState({ player: [seat[0], 0.6, seat[2]] });
    useGame.getState().tick(0.1);
    const served = useGame.getState().npcs.find((n) => n.id === waiting!.id);
    expect(served?.state).toBe('drinking'); // servis edildi
    expect(useGame.getState().tray).toBe(trayLoaded - 1); // tepsiden bir çay gitti

    // 3) İçme süresi sonunda öder; oyuncu koltukta olduğundan parayı toplar → lifetime artar.
    for (let i = 0; i < 80; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().lifetime.toNumber()).toBeGreaterThan(0);
  });
});

describe('çay istasyonu yükseltme (Faz 2a)', () => {
  it('₺ ile L1→L4 yükselir; sonra ₺ ile çıkamaz (L5 = Usta 💎)', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(1_000_000);
    expect(useGame.getState().stationLevels[0]).toBe(0);

    expect(useGame.getState().upgradeStation()).toBe(true);
    expect(useGame.getState().stationLevels[0]).toBe(1);

    for (let i = 0; i < 10; i++) useGame.getState().upgradeStation();
    expect(useGame.getState().stationLevels[0]).toBe(stationSoftMaxLevel());
    expect(useGame.getState().upgradeStation()).toBe(false); // L5 ₺ ile açılmaz
  });

  it('maliyet geometrik artar ve cüzdandan düşülür', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(1_000_000);
    const c1 = stationUpgradeCost(0);
    const c2 = stationUpgradeCost(1);
    expect(c2).toBeGreaterThan(c1);
    const before = useGame.getState().wallet.toNumber();
    useGame.getState().upgradeStation();
    expect(useGame.getState().wallet.toNumber()).toBeCloseTo(before - c1, 5);
  });

  it('para yetmezse yükseltmez', () => {
    useGame.getState().hardReset();
    expect(useGame.getState().upgradeStation()).toBe(false);
    expect(useGame.getState().stationLevels[0]).toBe(0);
  });
});

describe('generic pad sistemi + gating (quest hattı omurgası, 2026-06-09)', () => {
  it("pad'ler quest hattı sırasıyla açılır ve etkileri uygulanır (personel ZORUNLU halka)", () => {
    useGame.getState().hardReset();
    expect(useGame.getState().tables).toBe(1);
    // table2 minLifetime:20 ile kilitli — lifetime 0 iken aktif pad yok.
    expect(currentPad(gate())).toBeNull();
    useGame.getState().addMoney(50); // lifetime ≥ 20 → table2 açılır
    expect(currentPad(gate())?.id).toBe('table2');

    // Omurga sırası: table2 → table3 → waiter → dishwasher → table4 (quests[] ile birebir).
    expect(completePad('table2')).toBe(true);
    expect(useGame.getState().tables).toBe(2);

    expect(currentPad(gate())?.id).toBe('table3');
    expect(completePad('table3')).toBe(true);
    expect(useGame.getState().tables).toBe(3);

    // Personel artık OPSİYONEL DEĞİL: garson omurganın 3. halkası (D-014 kararı güncellendi).
    expect(currentPad(gate())?.id).toBe('waiter');
    expect(completePad('waiter')).toBe(true);
    expect(useGame.getState().waiters[0]).not.toBeNull();

    expect(currentPad(gate())?.id).toBe('dishwasher');
    expect(completePad('dishwasher')).toBe(true);
    expect(useGame.getState().dishwashers[0]).not.toBeNull();

    expect(currentPad(gate())?.id).toBe('table4');
    expect(completePad('table4')).toBe(true);
    expect(useGame.getState().tables).toBe(4);
    expect(useGame.getState().stations).toBe(1);

    expect(useGame.getState().padsDone.length).toBe(5);
    // Zone-1 omurgası bitti → sıradaki omurga halkası ZONE-2 açılışı (Faz 3a).
    expect(currentPad(gate())?.id).toBe('zone2');
    expect(useGame.getState().serviceSpeedMult).toBe(1); // serviceSpeed pad yok → hep 1
  });

  it('EKRANDA TEK PAD: pad-dışı görev sırasında hiç pad görünmez; pad görevinde YALNIZ o pad', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50); // lifetime ≥ 20 (gating hazır)
    // Görev 0 (ocaktan çay al) pad görevi DEĞİL → tek pad bile görünmez (currentPad olsa da).
    useGame.setState({ questIndex: 0, questBase: 0 });
    expect(currentPad(gate())?.id).toBe('table2'); // gating açık ama...
    expect(visiblePads(0, gate())).toEqual([]); // ...quest pad görevi değil → görünmez
    // table2 görevi aktifken yalnız table2 görünür.
    const qi = questIndexFor('table2');
    expect(visiblePads(qi, gate()).map((p) => p.id)).toEqual(['table2']);
    // Görev hattı bittiğinde güvenlik ağı: klasik omurga (kalan pad yoksa boş).
    expect(visiblePads(economyConfig.quests.length, gate()).map((p) => p.id)).toEqual(['table2']);
  });
});

describe('garson — quest hattında zorunlu personel (2026-06-09; eski D-014 opsiyonel kararı güncellendi)', () => {
  it('garson tutulunca hasWaiter=true olur ve garson varlığı kurulur', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    expect(completePad('table2')).toBe(true);
    expect(useGame.getState().waiters[0]).toBeNull();
    expect(completePad('table3')).toBe(true);
    expect(completePad('waiter')).toBe(true);
    expect(useGame.getState().waiters[0]).not.toBeNull();
    expect(useGame.getState().waiters[0]).not.toBeNull();
    // Tamamlanan pad bir daha görünür listede olmamalı.
    expect(visiblePads(useGame.getState().questIndex, gate()).map((p) => p.id)).not.toContain('waiter');
  });

  it('garson en ACİL (sabrı en az) bekleyene gider — yakın ama sabrı bol masa atlanır (anti-starvation)', () => {
    useGame.getState().hardReset();
    const nearIdx = 0;
    const farIdx = 3;
    const nearSeat = LAYOUT.tables[nearIdx].seat;
    const farSeat = LAYOUT.tables[farIdx].seat;
    const dist = (a: number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);
    // Garsonu YAKIN masanın koltuğuna (mesafe ~0) tepsi dolu koy. İki bekleyen:
    //  - 901: yakın AMA sabrı bol (timer 17)   - 902: uzak AMA acil (timer 2)
    // "En yakın" politikasıyla 901 anında servis edilirdi; "en acil" ile garson 902'ye yönelmeli.
    useGame.setState({
      padsDone: ['table2', 'table3', 'table4', 'waiter'],
      waiters: [{ pos: [nearSeat[0], 0.6, nearSeat[2]] as [number, number, number], tray: 1 }, null],
      player: [0, 0.6, 6.5],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [
        { id: 901, state: 'waitingForTea', pos: [...nearSeat] as [number, number, number], tableIndex: nearIdx, seatIndex: 0, timer: 17, color: '#27ae60' },
        { id: 902, state: 'waitingForTea', pos: [...farSeat] as [number, number, number], tableIndex: farIdx, seatIndex: 0, timer: 2, color: '#c0392b' },
      ],
      spawnTimer: 999, // bu testte yeni müşteri spawn olmasın
    });
    const startFarDist = dist([nearSeat[0], 0.6, nearSeat[2]], farSeat);
    useGame.getState().tick(0.1);
    const s = useGame.getState();
    const near = s.npcs.find((n) => n.id === 901);
    // Yakın ama sabrı bol masa SERVİS EDİLMEDİ (nearest-first olsaydı anında 'drinking' olurdu).
    expect(near?.state).toBe('waitingForTea');
    expect(s.waiters[0]?.tray).toBe(1); // henüz teslim yok (uzak masaya yürüyor)
    // Garson acil (uzak) masaya YÖNELDİ → ona yaklaştı.
    expect(dist(s.waiters[0]!.pos, farSeat)).toBeLessThan(startFarDist);
  });

  it('garson bekleyen müşteriye çay servis eder (oyuncu uzakta → kısmi assist)', () => {
    useGame.getState().hardReset();
    // D-015: hasWaiter padsDone'dan türetilir → garsonu padsDone üzerinden kur (sahte set işe yaramaz).
    // Oyuncuyu kimseyi servis edemeyeceği köşeye park et.
    useGame.setState({
      padsDone: ['table2', 'waiter'],
      waiters: [{ pos: [...LAYOUT.waiterHome] as [number, number, number], tray: 0 }, null],
      player: [0, 0.6, 2],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
    });
    // Oyuncu servis etmeden: yalnız garson sayesinde müşteri içip ödesin (yere para düşer).
    for (let i = 0; i < 900; i++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    // Garson en az bir müşteriye servis etti → ödeme parası yere düştü (oyuncu uzakta, toplamadı).
    expect(s.coins.length).toBeGreaterThan(0);
  });

  it('garson hızı seviyeyle artar (L2 > L1); aşırı seviye son değere kelepçelenir (D-018 §6)', () => {
    expect(waiterSpeed(1)).toBeGreaterThan(waiterSpeed(0));
    expect(waiterSpeed(0)).toBe(economyConfig.waiter.moveSpeedByLevel[0]);
    expect(waiterSpeed(99)).toBe(waiterSpeed(waiterSoftMaxLevel())); // clamp
  });

  it('garson hız yükseltme: tutulmadan kilitli; tutulsa da 20 ÇAY TAŞIMADAN kilitli (arka-plan şartı); sonra açılır', () => {
    useGame.getState().hardReset();
    const g0 = { padsDone: ['table2'], tables: 2, stationLevel: 1, lifetime: 0, waiterServed: 99 };
    expect(waiterUpgradeUnlocked(g0, 0)).toBe(false); // garson yok → kilitli
    // Garson tutuldu ama henüz 20 çay taşımadı → İŞARET YOK (kullanıcı: "tutar tutmaz hızlandırma gelmesin").
    const gFresh = { padsDone: ['table2', 'waiter'], tables: 2, stationLevel: 1, lifetime: 0, waiterServed: 0 };
    expect(waiterUpgradeUnlocked(gFresh, 0)).toBe(false);
    const g1 = { padsDone: ['table2', 'waiter'], tables: 2, stationLevel: 1, lifetime: 0, waiterServed: 20 };
    expect(waiterUpgradeUnlocked(g1, 0)).toBe(true); // tutuldu + işbaşında görüldü → açık
    expect(waiterUpgradeUnlocked(g1, waiterSoftMaxLevel())).toBe(false); // max → kapanır
  });

  it('garsonu tuttuğun noktada dur → ₺ akar → garson L2 olur (waiterLevel 0→1); sonra nokta kapanır', () => {
    useGame.getState().hardReset();
    const spot = LAYOUT.waiterUpgradeSpot;
    useGame.setState({
      padsDone: ['table2', 'waiter'],
      waiters: [{ pos: [...LAYOUT.waiterHome] as [number, number, number], tray: 0 }, null],
      player: [spot[0], 0.6, spot[2]],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      stats: { ...defaultStats(), waiterServed: 20 }, // arka-plan şartı karşılanmış olsun
      spawnTimer: 999, // bu testte müşteri akışı karışmasın
    });
    useGame.getState().addMoney(waiterUpgradeCost() + 100);
    expect(useGame.getState().waiterLevels[0]).toBe(0);
    for (let i = 0; i < 300 && useGame.getState().waiterLevels[0] === 0; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().waiterLevels[0]).toBe(1);
    // Soft max'a ulaştı → yükseltme noktası artık kilitli (işaret kaybolur).
    const s = useGame.getState();
    expect(waiterUpgradeUnlocked({ padsDone: s.padsDone, tables: s.tables, stationLevel: s.stationLevels[0], lifetime: s.lifetime.toNumber(), waiterServed: s.stats.waiterServed }, s.waiterLevels[0])).toBe(false);
  });

  it('waiterLevel kayıt round-trip\'inde korunur (saveNow→init persist)', () => {
    // node test ortamında localStorage yok → geçici mock ile gerçek persistence'ı doğrula.
    const mem: Record<string, string> = {};
    const g = globalThis as Record<string, unknown>;
    const orig = g.localStorage;
    g.localStorage = {
      getItem: (k: string) => (k in mem ? mem[k] : null),
      setItem: (k: string, v: string) => { mem[k] = v; },
      removeItem: (k: string) => { delete mem[k]; },
    };
    try {
      useGame.getState().hardReset();
      useGame.setState({ padsDone: ['table2', 'waiter'], waiterLevels: [1, 0] });
      useGame.getState().saveNow();
      useGame.getState().init();
      expect(useGame.getState().waiterLevels[0]).toBe(1);
    } finally {
      g.localStorage = orig;
    }
  });
});

describe('yeni-özellik bildirimi (D-019 §4)', () => {
  it('yeni oyunda ikincil özellik yok → revealSeen boş; bir özellik açılınca toast + kamera pan tetiklenir', () => {
    useGame.getState().hardReset();
    expect(useGame.getState().revealSeen).toEqual([]);
    // 2. masa aç → çay ocağı yükseltme açılır (ikincil özellik).
    useGame.getState().addMoney(50);
    expect(completePad('table2')).toBe(true);
    // table2 tamamlandıktan SONRAKİ tick'te 'upgrade' reveal'ı belirir (oyuncuyu uzak köşeye park et).
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    useGame.getState().tick(0.1);
    expect(useGame.getState().revealSeen).toContain('upgrade:0'); // v21: anahtarlar zone-başına
    expect(useGame.getState().notice).not.toBeNull();
    // Yeni açılan noktaya kamera pan istendi (kullanıcı 2026-06-09: "orada bir şey var" hissi).
    expect(useGame.getState().camFocus).not.toBeNull();
  });

  it("garson 20 çay taşıyınca 'waiterUp' bildirilir (arka-plan şartı reveal'ı)", () => {
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: ['table2', 'table3', 'waiter'],
      waiters: [{ pos: [...LAYOUT.waiterHome] as [number, number, number], tray: 0 }, null],
      player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      npcs: [], spawnTimer: 999,
      stats: { ...defaultStats(), waiterServed: 19 },
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().revealSeen).not.toContain('waiterUp:0'); // 19 < 20 → henüz yok
    useGame.setState({ stats: { ...defaultStats(), waiterServed: 20 } });
    useGame.getState().tick(0.1);
    expect(useGame.getState().revealSeen).toContain('waiterUp:0'); // eşik aşıldı → bildirildi
  });

  it('yeniden yüklemede ZATEN açık özellikler tekrar bildirilmez (baseline; spam yok)', () => {
    const mem: Record<string, string> = {};
    const g = globalThis as Record<string, unknown>;
    const orig = g.localStorage;
    g.localStorage = {
      getItem: (k: string) => (k in mem ? mem[k] : null),
      setItem: (k: string, v: string) => { mem[k] = v; },
      removeItem: (k: string) => { delete mem[k]; },
    };
    try {
      useGame.getState().hardReset();
      // table2 açık + ocak L1 → çay yükseltme zaten açık bir kayıt.
      useGame.setState({ padsDone: ['table2'], stationLevels: [1, 0] });
      useGame.getState().saveNow();
      useGame.getState().init();
      const s = useGame.getState();
      // Baseline açık özellikleri içerir → ilk açılışta toast YOK.
      expect(s.revealSeen).toContain('upgrade:0');
      expect(s.notice).toBeNull();
      // Park + tick → zaten açık olanlar yeniden bildirilmez.
      useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
      useGame.getState().tick(0.1);
      expect(useGame.getState().notice).toBeNull();
    } finally {
      g.localStorage = orig;
    }
  });
});

describe('bardak döngüsü (Faz 2e) — demleme temiz harcar, içen kirli bırakır, topla+yıka', () => {
  // Sistemdeki TÜM bardakları say (korunum değişmezi: toplam = havuz kapasitesi).
  function totalCups() {
    const s = useGame.getState();
    const drinking = s.npcs.filter((n) => n.state === 'drinking').length;
    return (
      s.cleanCups + s.readyCupsByZone[0] + s.tray + s.carriedDirty + s.dishes.length + drinking +
      (s.waiters[0]?.tray ?? 0) + (s.dishwashers[0]?.tray ?? 0)
    );
  }

  it('başlangıçta temiz havuz dolu; demleme temiz harcar (toplam bardak KORUNUR)', () => {
    useGame.getState().hardReset();
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    const pool = cupPoolCapacity(0);
    expect(useGame.getState().cleanCups).toBe(pool);
    // Servis yok → ocak hazır-kuyruğu temizden demler; clean azalır, ready artar, TOPLAM sabit.
    for (let i = 0; i < 300; i++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    expect(s.readyCupsByZone[0]).toBeGreaterThan(0);
    expect(s.cleanCups).toBeLessThan(pool);
    expect(totalCups()).toBe(pool); // korunum
  });

  it('temiz bardak biterse demleme DURUR (yeni darboğaz)', () => {
    useGame.getState().hardReset();
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0], cleanCups: 0, readyCupsByZone: [0, 0], brewProgressByZone: [0, 0] });
    for (let i = 0; i < 200; i++) useGame.getState().tick(0.1);
    // Temiz yokken hiç çay demlenemez.
    expect(useGame.getState().readyCupsByZone[0]).toBe(0);
  });

  it('içen müşteri masada KİRLİ bardak bırakır; oyuncu toplar → bulaşıkta yıkar → temize döner', () => {
    useGame.getState().hardReset();
    // Onboarding gate (2026-06-10): kirli bardak ancak q_wash göreviyle çıkmaya başlar.
    const washIdx = economyConfig.quests.findIndex((q) => q.target.type === 'washDish');
    useGame.setState({ questIndex: washIdx, questBase: 0 });
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    const pool = cupPoolCapacity(0);
    // Müşteri otursun + çay demlensin.
    for (let i = 0; i < 200; i++) useGame.getState().tick(0.1);
    const waiting = useGame.getState().npcs.find((n) => n.state === 'waitingForTea');
    expect(waiting).toBeTruthy();

    // Ocaktan tepsiye al → bekleyen masaya götür → servis.
    const st = LAYOUT.stations[0];
    useGame.setState({ player: [st[0], 0.6, st[2]] });
    useGame.getState().tick(0.1);
    const seat = LAYOUT.tables[waiting!.tableIndex].seat;
    useGame.setState({ player: [seat[0], 0.6, seat[2]] });
    useGame.getState().tick(0.1);
    expect(useGame.getState().npcs.find((n) => n.id === waiting!.id)?.state).toBe('drinking');

    // İçme bitince masada kirli bardak belirir (oyuncuyu uzağa park et ki otomatik toplamasın).
    useGame.setState({ player: [0, 0.6, 6.5] });
    const before = useGame.getState().dishes.length;
    for (let i = 0; i < 80; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().dishes.length).toBeGreaterThan(before);
    expect(totalCups()).toBe(pool); // korunum hâlâ geçerli

    // Kirli bardağa git → topla (carriedDirty artar, dishes azalır).
    const dish = useGame.getState().dishes[0];
    useGame.setState({ player: [dish.pos[0], 0.6, dish.pos[2]] });
    const dishesBefore = useGame.getState().dishes.length;
    useGame.getState().tick(0.1);
    expect(useGame.getState().carriedDirty).toBeGreaterThan(0);
    expect(useGame.getState().dishes.length).toBe(dishesBefore - 1);

    // Bulaşığa git → yıka (carriedDirty 0, cleanCups artar).
    const cleanBefore = useGame.getState().cleanCups;
    const carried = useGame.getState().carriedDirty;
    const ds = LAYOUT.dishStation;
    useGame.setState({ player: [ds[0], 0.6, ds[2]] });
    useGame.getState().tick(0.1);
    expect(useGame.getState().carriedDirty).toBe(0);
    expect(useGame.getState().cleanCups).toBe(cleanBefore + carried);
    expect(totalCups()).toBe(pool);
  });

  it('ocak seviyesi artınca temiz havuz büyür (cupPoolCapacity)', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(1_000_000);
    const before = useGame.getState().cleanCups;
    expect(useGame.getState().upgradeStation()).toBe(true);
    expect(useGame.getState().cleanCups).toBe(before + economyConfig.cups.poolPerLevel);
    expect(cupPoolCapacity(1)).toBe(cupPoolCapacity(0) + economyConfig.cups.poolPerLevel);
  });

  // PAYLAŞIMLI kapasite (2026-06-09): çay + kirli aynı tepsiyi paylaşır; karışık taşıma serbest, deadlock yok.
  it('kirli taşırken ocaktan temiz çay ALINIR (karışık taşıma; toplam trayCap sınırı)', () => {
    useGame.getState().hardReset();
    const st = LAYOUT.stations[0];
    // Elinde kirli varken ocağa gidince temizi de alabilmeli (toplam trayCap'i aşmadan).
    useGame.setState({
      player: [st[0], 0.6, st[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      readyCupsByZone: [3, 0], carriedDirty: 1, tray: 0,
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().tray).toBeGreaterThan(0); // kirli elindeyken de temiz alındı
    expect(useGame.getState().tray + useGame.getState().carriedDirty).toBeLessThanOrEqual(trayCapacity());
  });

  it('temiz çay taşırken masadaki kirli TOPLANIR (karışık taşıma; simetrik)', () => {
    useGame.getState().hardReset();
    // Bir masaya kirli bardak koy, oyuncuyu üstüne park et, elinde temiz çay olsun → kirliyi de alabilmeli.
    const dishPos: [number, number, number] = [1, 0.95, 1];
    useGame.setState({
      player: [dishPos[0], 0.6, dishPos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      tray: 1, carriedDirty: 0,
      dishes: [{ id: 9001, pos: dishPos, tableIndex: 0 }],
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().carriedDirty).toBe(1); // temiz elindeyken kirli toplandı
    expect(useGame.getState().dishes.length).toBe(0);
  });

  it('DEADLOCK YOK: elinde çay + tüm masalar kirli → kirli toplanıp temizlenebilir', () => {
    useGame.getState().hardReset();
    // Elinde 1 çay; bir masada eşik üstü kirli (masa kilitli, bekleyen yok) → eskiden kilitlenirdi.
    const dishPos: [number, number, number] = [1, 0.95, 1];
    const dishes = Array.from({ length: 3 }, (_, i) => ({ id: 9100 + i, pos: dishPos, tableIndex: 0 }));
    useGame.setState({
      player: [dishPos[0], 0.6, dishPos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      tray: 1, carriedDirty: 0, dishes,
    });
    useGame.getState().tick(0.1);
    // Çay elindeyken kirli toplanabildi → kilit kırıldı.
    expect(useGame.getState().carriedDirty).toBeGreaterThan(0);
    expect(useGame.getState().tray + useGame.getState().carriedDirty).toBeLessThanOrEqual(trayCapacity());
  });
});

describe('kirli masa mekaniği (D-019) — eşik aşılınca masa kilitlenir', () => {
  const T = economyConfig.cups.dirtyThreshold;
  function dishOn(idx: number, id: number) {
    const t = LAYOUT.tables[idx].table;
    return { id, pos: [t[0], 0.95, t[2]] as [number, number, number], tableIndex: idx };
  }

  it('dirtyTables: eşik kadar kirli temiz sayılır, eşiği AŞINCA kirli olur', () => {
    // T kadar kirli (= eşik) → henüz kirli değil.
    const atThreshold = Array.from({ length: T }, (_, i) => dishOn(0, 1000 + i));
    expect(dirtyTables(atThreshold).has(0)).toBe(false);
    // T+1 kirli (eşiği aşar) → kirli.
    const overThreshold = Array.from({ length: T + 1 }, (_, i) => dishOn(0, 2000 + i));
    expect(dirtyTables(overThreshold).has(0)).toBe(true);
  });

  it('kirli masaya YENİ müşteri oturmaz (findFreeTable atlar); temizlenince yeniden açılır', () => {
    useGame.getState().hardReset();
    // 2 masa aç (table2) → masa 0 kirli olsun, masa 1 temiz.
    useGame.getState().addMoney(50);
    expect(completePad('table2')).toBe(true);
    const dirtyDishes = Array.from({ length: T + 1 }, (_, i) => dishOn(0, 3000 + i));
    useGame.setState({
      player: [0, 0.6, 6.5], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      npcs: [], dishes: dirtyDishes, spawnTimer: 0,
    });
    // Müşteriler gelir → yalnız temiz masaya (1) oturur, kirli masaya (0) ASLA.
    for (let i = 0; i < 200; i++) useGame.getState().tick(0.1);
    const seated = useGame.getState().npcs.filter((n) => n.state !== 'leaving' && n.state !== 'toTable');
    expect(seated.every((n) => n.tableIndex !== 0)).toBe(true);
    expect(useGame.getState().npcs.some((n) => n.tableIndex === 1)).toBe(true);

    // Kirliyi eşik altına indir → masa 0 yeniden boş sayılır.
    useGame.setState({ dishes: [dishOn(0, 9999)] });
    expect(dirtyTables(useGame.getState().dishes).has(0)).toBe(false);
  });

  it('garson kirli masaya çay GÖTÜRMEZ (teslimat hedefi sayılmaz)', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    expect(completePad('table2')).toBe(true);
    // Garson tepsisinde çay; masa 0 kirli + orada bekleyen müşteri var.
    const idx = 0;
    const seat = LAYOUT.tables[idx].seat;
    const dirtyDishes = Array.from({ length: T + 1 }, (_, i) => dishOn(idx, 4000 + i));
    useGame.setState({
      padsDone: ['table2', 'waiter'],
      waiters: [{ pos: [LAYOUT.tables[idx].table[0], 0.6, LAYOUT.tables[idx].table[2]] as [number, number, number], tray: 1 }, null],
      player: [0, 0.6, 6.5], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      npcs: [{ id: 880, state: 'waitingForTea', pos: [...seat] as [number, number, number], tableIndex: idx, seatIndex: 0, timer: 999, color: '#27ae60' }],
      dishes: dirtyDishes, spawnTimer: 999,
    });
    for (let i = 0; i < 50; i++) useGame.getState().tick(0.1);
    // Kirli masaya servis yapılmadı → müşteri hâlâ bekliyor, garson tepsisi dolu.
    expect(useGame.getState().npcs.find((n) => n.id === 880)?.state).toBe('waitingForTea');
    expect(useGame.getState().waiters[0]?.tray).toBe(1);
  });
});

describe('bulaşıkçı — quest hattında zorunlu personel (Faz 2e; 2026-06-09 omurgaya girdi)', () => {
  it('bulaşıkçı garsondan sonra omurga halkası: quest görevi olmadan pad GÖRÜNMEZ, görevinde görünür', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    expect(completePad('table2')).toBe(true);
    expect(completePad('table3')).toBe(true);
    expect(completePad('waiter')).toBe(true);
    // Omurga sırada bulaşıkçıyı gösterir; ama pad YALNIZ kendi görevi aktifken görünür.
    expect(currentPad(gate())?.id).toBe('dishwasher');
    expect(visiblePads(questIndexFor('table4'), gate())).toEqual([]); // başka pad görevi → requires kilitli
    expect(visiblePads(questIndexFor('dishwasher'), gate()).map((p) => p.id)).toEqual(['dishwasher']);
    expect(useGame.getState().dishwashers[0]).toBeNull();
  });

  it('bulaşıkçı tutulunca hasDishwasher=true; kirlileri toplayıp yıkar (oyuncu uzakta → kısmi assist)', () => {
    useGame.getState().hardReset();
    // D-015: hasDishwasher padsDone'dan türetilir → padsDone üzerinden kur. NPC'siz izole sahne.
    const ds = LAYOUT.dishStation;
    useGame.setState({
      padsDone: ['table2', 'table3', 'dishwasher'],
      dishwashers: [{ pos: [...LAYOUT.dishwasherHome] as [number, number, number], tray: 0 }, null],
      player: [0, 0.6, 6.5], // oyuncu uzakta; yalnız bulaşıkçı çalışsın
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [], // yeni müşteri/yeni kirli karışmasın
      // İki kirli bardak masalara serpiştir; temiz havuzu düşür ki yıkamanın etkisi görünsün.
      dishes: [
        { id: 9001, pos: [LAYOUT.tables[0].table[0], 0.95, LAYOUT.tables[0].table[2]] as [number, number, number], tableIndex: 0 },
        { id: 9002, pos: [LAYOUT.tables[1].table[0], 0.95, LAYOUT.tables[1].table[2]] as [number, number, number], tableIndex: 1 },
      ],
      cleanCups: 0,
      readyCups: 0,
      spawnTimer: 999, // yeni müşteri/yeni kirli olmasın
    });
    expect(useGame.getState().dishwashers[0]).not.toBeNull();
    const dirtyBefore = useGame.getState().dishes.length;
    for (let i = 0; i < 600; i++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    // Bulaşıkçı kirlileri toplayıp bulaşıkta yıkadı → kirli temizlendi, bardaklar sisteme döndü
    // (yıkanan temiz bardakları ocak hemen demleyebilir → cleanCups + readyCups olarak ölç).
    expect(s.dishes.length).toBeLessThan(dirtyBefore);
    expect(s.cleanCups + s.readyCupsByZone[0]).toBeGreaterThan(0);
    void ds;
  });
});

describe('para mıknatısı (Faz 2f) — attract yarıçapındaki para oyuncuya akar + toplanır', () => {
  it('düşme noktasının pickup yarıçapına HİÇ girilmese de para mıknatısla toplanır (bug düzeltmesi)', () => {
    useGame.getState().hardReset();
    // Para, oyuncudan pickup (1.4) DIŞINDA ama attract (taban kademe 2.6) İÇİNDE düşsün.
    const px = 0;
    const coinX = px + (economyConfig.money.pickupRadius + attractRadiusFor(0)) / 2; // ~2.0
    useGame.setState({
      player: [px, 0.6, 0], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      coins: [{ id: 5555, pos: [coinX, 0.3, 0], value: 5 }],
    });
    const before = useGame.getState().wallet.toNumber();
    // Oyuncu yerinde dursa bile mıknatıs parayı çeker → birkaç tick'te toplanır.
    for (let i = 0; i < 20; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().coins.length).toBe(0);
    expect(useGame.getState().wallet.toNumber()).toBe(before + 5);
  });

  it('attract yarıçapı DIŞINDAKİ para çekilmez (oyuncu uzaktayken yerinde kalır)', () => {
    useGame.getState().hardReset();
    const far = attractRadiusFor(0) + 2; // attract dışında (taban kademe)
    useGame.setState({
      player: [0, 0.6, 0], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      coins: [{ id: 5556, pos: [far, 0.3, 0], value: 5 }],
    });
    for (let i = 0; i < 10; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().coins.length).toBe(1); // toplanmadı
    expect(useGame.getState().coins[0].pos[0]).toBeCloseTo(far, 5); // hareket etmedi
  });
});

describe('tepsi kapasitesi (v20: karakter tepsi kademesinden türetilir; paylaşımlı çay+kirli)', () => {
  it('kademe → kapasite eğrisi: 2→3→4→5→6; taşan kademe son değere kelepçelenir', () => {
    expect(trayCapacityFor(0)).toBe(2); // yeni oyun
    expect(trayCapacityFor(1)).toBe(3);
    expect(trayCapacityFor(2)).toBe(4); // eski kayıt hediyesi (migrasyon T2)
    expect(trayCapacityFor(4)).toBe(6);
    expect(trayCapacityFor(99)).toBe(6);
  });

  it('arg\'sız trayCapacity() canlı store kademesini okur (devHooks geri-uyumu)', () => {
    useGame.getState().hardReset();
    expect(trayCapacity()).toBe(2);
    useGame.setState({ charUpgrades: { tray: 2, magnet: 0, speed: 0 } });
    expect(trayCapacity()).toBe(4);
  });
});

describe('kayıt migrasyonu v4..v15 (padFills, station2/samovar çıkışı, addTable senkron, türetme, trayLevel düşüşü, tableLevels, waiterLevel)', () => {
  it('eski tek padFill, aktif omurga pad id\'sine taşınır; türetilenler + trayLevel saklanmaz', () => {
    const m = migrate({
      saveVersion: 4,
      wallet: '100', diamonds: '0', lifetime: '50',
      tables: 1, stations: 1, stationLevel: 0, serviceSpeedMult: 1,
      padsDone: [], padFill: 20,
    });
    // lifetime 50 ≥ 30 → table2 aktif omurga pad'i → padFill ona atanır.
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.padFills).toEqual({ table2: 20 });
    // D-015: türetilen alanlar artık kayıtta YOK; garson alınmamış → padsDone'da 'waiter' yok.
    expect((m as Record<string, unknown>).tables).toBeUndefined();
    expect((m as Record<string, unknown>).hasWaiter).toBeUndefined();
    expect(m.padsDone).not.toContain('waiter');
    expect((m as Record<string, unknown>).padFill).toBeUndefined();
  });

  it('v5 → v9: station2 çıkar; hasWaiter:true → padsDone\'a \'waiter\' taşınır (garson korunur)', () => {
    const m = migrate({
      saveVersion: 5,
      wallet: '500', diamonds: '0', lifetime: '2000',
      tables: 3, stations: 2, stationLevel: 1, serviceSpeedMult: 0.85,
      padsDone: ['table2', 'table3', 'station2'], padFills: { station2: 100, samovar: 40 }, hasWaiter: true,
    });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.padsDone).toEqual(['table2', 'table3', 'waiter']); // station2 kalktı; eski hasWaiter → waiter pad'i
    expect(m.padFills).toEqual({}); // station2 (v6) + samovar (v14) dolumları temizlendi
    // Türetme: tek salon = tek ocak, garson korunur.
    const d = derivedFromPads(m.padsDone);
    expect(d.stations).toBe(1);
    expect(d.hasWaiter).toBe(true);
    expect(d.tables).toBe(3); // table2 + table3 (station2 türetmeyi etkilemez)
  });

  it('v6 → v9: v6\'da takılı (senkronsuz) tables=4 kaydı düzelir → table4 done (çakışma önlenir)', () => {
    // Kullanıcının gerçek durumu: önceki migration v6'ya yükseltmiş ama addTable senkronu yoktu.
    const m = migrate({
      saveVersion: 6, wallet: '0', diamonds: '0', lifetime: '9000',
      tables: 4, stations: 1, stationLevel: 2, serviceSpeedMult: 1,
      padsDone: ['table2', 'table3'], padFills: {}, hasWaiter: false,
    });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    // 4. masa zaten çiziliyken table4 pad'i bir daha belirmemeli (aynı konumda çakışır).
    expect(m.padsDone).toContain('table4');
    // Türetilen masa sayısı padsDone'dan gelir = 4. Personel omurgaya girdi (2026-06-09) →
    // garson hiç tutulmamış eski kayıtta sıradaki omurga = 'waiter' (quest hattı oraya yönlendirir).
    const tables = derivedFromPads(m.padsDone).tables;
    expect(tables).toBe(4);
    expect(currentPad({ padsDone: m.padsDone, tables, stationLevel: m.stationLevel, lifetime: 9000 })?.id).toBe('waiter');
    // questIndex tohumlama: garson tutulmadığı için hat "Garson tut" görevinde durur (atlanmaz —
    // atlasaydı "Garsonu hızlandır" garsonsuz kilitlenirdi).
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_waiter');
  });

  it('v13 → v14 (D-018 adım 5): samovar referansı padsDone + padFills\'ten DÜŞER (ilerleme korunur)', () => {
    const m = migrate({
      saveVersion: 13, wallet: '900', diamonds: '0', lifetime: '5000',
      stationLevel: 2, padsDone: ['table2', 'table3', 'table4', 'samovar'],
      padFills: { samovar: 200 }, tableLevels: [1, 0, 0, 0],
    } as unknown as Record<string, unknown>);
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.padsDone).not.toContain('samovar'); // dead id temizlendi
    expect(m.padsDone).toEqual(['table2', 'table3', 'table4']);
    expect(m.padFills).toEqual({}); // samovar dolumu temizlendi
    expect(derivedFromPads(m.padsDone).tables).toBe(4); // 4 masa korunur
    expect(m.wallet).toBe('900'); // ₺ ilerleme kaybolmaz
  });

  it('v14 → v15 (D-018 adım 6): waiterLevel eklenir (eksikse 0; varsa korunup soft max\'a clamp\'lenir)', () => {
    // Eski v14 kaydında waiterLevel YOK → 0 gelir.
    const m = migrate({
      saveVersion: 14, wallet: '300', diamonds: '0', lifetime: '4000',
      stationLevel: 2, padsDone: ['table2', 'waiter'], padFills: {}, tableLevels: [],
    } as unknown as Record<string, unknown>);
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.waiterLevels[0]).toBe(0);
    // Aşırı (bozuk) waiterLevel soft max'a clamp'lenir (moveSpeedByLevel uzunluğu - 1).
    const cap = economyConfig.waiter.moveSpeedByLevel.length - 1;
    const m2 = migrate({
      saveVersion: 14, wallet: '0', diamonds: '0', lifetime: '0',
      stationLevel: 0, padsDone: ['table2', 'waiter'], padFills: {}, tableLevels: [], waiterLevel: 99,
    } as unknown as Record<string, unknown>);
    expect(m2.waiterLevels[0]).toBe(cap);
  });

  it('v15 → v16 (QUEST): stats/questIndex/questBase eklenir; ilerleme tohumlanır (başa düşülmez)', () => {
    // Orta-oyun v15 kaydı: table2+table3 açık, ocak L2, garson YOK.
    const m = migrate({
      saveVersion: 15, wallet: '400', diamonds: '0', lifetime: '1500',
      stationLevel: 2, padsDone: ['table2', 'table3'], padFills: {}, tableLevels: [0, 0, 0, 0], waiterLevel: 0,
    } as unknown as Record<string, unknown>);
    expect(m.saveVersion).toBe(SAVE_VERSION);
    // Sayaçlar sıfırdan (garson yok → tohum yok); v21/v23 zone-başı sayaçlar [0, 0] ile gelir.
    expect(m.stats).toEqual({ ...defaultStats(), waiterServedByZone: [0, 0], teasServedByZone: [0, 0] });
    // Tohumlama: öğretici sayaçlar + table2 + araları tamam; garson tutulmadığı için hat q_waiter'da durur.
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_waiter');
    expect(m.questBase).toBe(0);

    // Garson zaten tutulmuş kayıtta waiterServed=20 tohumlanır (hız yükseltme işareti elinden alınmaz).
    const m2 = migrate({
      saveVersion: 15, wallet: '0', diamonds: '0', lifetime: '5000',
      stationLevel: 3, padsDone: ['table2', 'table3', 'waiter', 'dishwasher', 'table4'],
      padFills: {}, tableLevels: [0, 0, 0, 0], waiterLevel: 0,
    } as unknown as Record<string, unknown>);
    expect(m2.stats.waiterServed).toBe(20);
    // Tüm pad'ler açık + magnet 0 → hat q_charMagnet'te durur (v20: tepsi görevleri T2 hediyesiyle
    // tamam sayılır; mıknatıs görevi eski oyuncuya doğal sırasında verilir).
    expect(economyConfig.quests[m2.questIndex]?.id).toBe('q_charMagnet');
  });

  it('v12 → v13 (D-018): eski trayLevel persist alanı DÜŞER (tepsi sabit; şemada yok)', () => {
    const m = migrate({
      saveVersion: 12, wallet: '0', diamonds: '0', lifetime: '0',
      stationLevel: 0, padsDone: ['table2', 'table3'], padFills: {}, trayLevel: 2, tableLevels: [],
    } as unknown as Record<string, unknown>);
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect((m as Record<string, unknown>).trayLevel).toBeUndefined(); // eski tray yükseltmesi şemada yok
    // v20: eski kayda T2 hediye → kapasite 4 KORUNUR (eski trayLevel'dan bağımsız).
    expect(m.charUpgrades).toEqual({ tray: 2, magnet: 0, speed: 0 });
    expect(trayCapacity(m.charUpgrades.tray)).toBe(4);
  });

  it('varsayılan kayıt padFills={} içerir; türetilen + kaldırılan (trayLevel) alanlar tutulmaz', () => {
    const d = defaultSave();
    expect(d.saveVersion).toBe(SAVE_VERSION);
    expect(d.padFills).toEqual({});
    expect((d as Record<string, unknown>).trayLevel).toBeUndefined();
    expect(d.tableLevels).toEqual([]);
    expect(d.waiterLevels).toEqual([]); // v18: diziler boş başlar; init MAX_ZONES'a 0'la doldurur
    expect((d as Record<string, unknown>).tables).toBeUndefined();
    expect((d as Record<string, unknown>).hasWaiter).toBeUndefined();
  });
});

describe('D-015 — tek doğru kaynak: türetilen alanlar padsDone\'dan, kayıttaki sahte değer SIZAMAZ', () => {
  it('derivedFromPads padsDone\'dan tutarlı türetir (masa/garson/servis hızı)', () => {
    expect(derivedFromPads([]).tables).toBe(1);
    expect(derivedFromPads(['table2', 'table3', 'table4']).tables).toBe(4);
    expect(derivedFromPads(['waiter']).hasWaiter).toBe(true);
    expect(derivedFromPads([]).hasWaiter).toBe(false);
    expect(derivedFromPads(['dishwasher']).hasDishwasher).toBe(true);
    expect(derivedFromPads([]).hasDishwasher).toBe(false);
    // samovar pad'i kaldırıldı (D-018 adım 5) → artık bilinmeyen id, etki yok (serviceSpeedMult hep 1).
    expect(derivedFromPads(['samovar']).serviceSpeedMult).toBe(1);
    expect(derivedFromPads([]).stations).toBe(1);
    // Bilinmeyen pad id'leri yok sayılır (ileri/geri uyum).
    expect(derivedFromPads(['table2', 'station2', 'bogus']).tables).toBe(2);
  });

  it('kayıtta padsDone ile ÇELİŞEN tables/hasWaiter alanları olsa bile türetme yalnız padsDone\'a bakar', () => {
    // v8 kaydına kasten çelişkili (eski/bozuk) sahte alanlar ekle — migrate bunları DROP eder.
    const m = migrate({
      saveVersion: 8, wallet: '0', diamonds: '0', lifetime: '0',
      stationLevel: 0, padsDone: ['table2'], padFills: {},
      tables: 99, stations: 7, serviceSpeedMult: 0.1, hasWaiter: true, // ÇELİŞKİ: padsDone'da yok
    } as unknown as Record<string, unknown>);
    expect((m as Record<string, unknown>).tables).toBeUndefined();
    expect((m as Record<string, unknown>).hasWaiter).toBeUndefined();
    // Tek doğru kaynak padsDone → türetme sahte alanları yok sayar.
    const d = derivedFromPads(m.padsDone);
    expect(d.tables).toBe(2); // 1 + table2
    expect(d.hasWaiter).toBe(false); // 'waiter' padsDone'da değil
    expect(d.serviceSpeedMult).toBe(1);
  });

  it('store: pad açıldıkça tables/hasWaiter padsDone ile DAİMA tutarlı (desenkronizasyon üretilemez)', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    completePad('table2');
    let s = useGame.getState();
    expect(s.tables).toBe(derivedFromPads(s.padsDone).tables);
    expect(s.waiters[0] != null).toBe(derivedFromPads(s.padsDone).hasWaiter);

    // Garson omurgada table3'ten sonra (quest hattı).
    completePad('table3');
    completePad('waiter');
    s = useGame.getState();
    expect(s.waiters[0]).not.toBeNull();
    expect(s.waiters[0] != null).toBe(derivedFromPads(s.padsDone).hasWaiter);
    expect(s.tables).toBe(derivedFromPads(s.padsDone).tables);
  });
});

describe('ekonomi v2 — seviye throughputu artırır, fiyatı DEĞİL (D-010)', () => {
  it('stationLevel arttıkça demleme süresi kısalır (çay/dk ↑); fiyat sabit kalır', () => {
    const t0 = brewTime(0, 1);
    const t1 = brewTime(1, 1);
    const t2 = brewTime(2, 1);
    expect(t1).toBeLessThan(t0); // throughput arttı → süre kısaldı
    expect(t2).toBeLessThan(t1);
    // Fiyat sabit: müşterinin bıraktığı coin değeri seviyeden bağımsız.
    expect(TEA_PRICE).toBe(economyConfig.teaStation.basePrice);
  });

  it('servis hızı (semaver/ek ocak) da demlemeyi kısaltır', () => {
    expect(brewTime(0, 0.7)).toBeLessThan(brewTime(0, 1));
  });

  it('quest motoru: ilk-oyun görevleri eylem sayaçlarıyla SIRAYLA ilerler (eski onboarding koçunun yerine)', () => {
    useGame.getState().hardReset();
    // Taze oyun: görev 0 = ocaktan çay al; quest bar görünümü dolu.
    expect(useGame.getState().questIndex).toBe(0);
    expect(useGame.getState().quest?.id).toBe('q_pickup');
    // Çay demlensin (oyuncu uzakta).
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    for (let i = 0; i < 200 && useGame.getState().readyCupsByZone[0] === 0; i++) useGame.getState().tick(0.1);
    // 1) Ocağa git → tepsiye al → görev 1 tamam, sıradaki "müşteriye götür".
    const st = LAYOUT.stations[0];
    useGame.setState({ player: [st[0], 0.6, st[2]] });
    useGame.getState().tick(0.1);
    expect(useGame.getState().stats.teaPickups).toBeGreaterThan(0);
    expect(useGame.getState().quest?.id).toBe('q_serve1');
    // Görev geçişinde kamera yeni hedefe pan ister (hareketli onboarding).
    expect(useGame.getState().camFocus).not.toBeNull();
    // 2) Bekleyen müşteriye servis → "parayı topla".
    const waiting = useGame.getState().npcs.find((n) => n.state === 'waitingForTea');
    expect(waiting).toBeTruthy();
    const seat = LAYOUT.tables[waiting!.tableIndex].seat;
    useGame.setState({ player: [seat[0], 0.6, seat[2]] });
    useGame.getState().tick(0.1);
    expect(useGame.getState().stats.teasServed).toBe(1);
    expect(useGame.getState().quest?.id).toBe('q_coin');
    // 3) Müşteri öder, oyuncu koltukta → para toplanır → "2. Masayı aç".
    for (let i = 0; i < 80; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().stats.coinsCollected).toBeGreaterThan(0);
    expect(useGame.getState().quest?.id).toBe('q_table2');
  });

  it('sayaç görevleri questBase\'ten DELTA sayılır (önceki birikmiş sayaç hedefi bedavaya getirmez)', () => {
    const stats = { ...defaultStats(), teasServed: 7 };
    const target = { type: 'serveTea', count: 5 } as const;
    expect(questCounterValue(target, stats)).toBe(7);
    // questBase 7 (görev şimdi başladı) → 7 servis sayılmaz, 5 YENİ servis gerek.
    const ctx = { padsDone: [], stationLevel: 0, waiterLevel: 0, tableLevels: [], stats, questBase: 7 };
    expect(questTargetMet(target, ctx)).toBe(false);
    expect(questTargetMet(target, { ...ctx, stats: { ...stats, teasServed: 12 } })).toBe(true);
  });

  it('görev ödülü (M1): tamamlanınca reward cüzdana+lifetime\'a eklenir; toast ve görev kartı gösterir', () => {
    useGame.getState().hardReset();
    const reward = economyConfig.quests[0].reward ?? 0;
    expect(reward).toBeGreaterThan(0); // ödül tanımlı olmalı (config sözleşmesi)
    const w0 = useGame.getState().wallet.toNumber();
    const l0 = useGame.getState().lifetime.toNumber();
    // q_pickup sayacını karşıla → tick görev hattını ilerletir ve ödülü öder.
    useGame.setState({ stats: { ...useGame.getState().stats, teaPickups: 1 } });
    useGame.getState().tick(0.05);
    const s = useGame.getState();
    expect(s.questIndex).toBe(1);
    expect(s.wallet.toNumber()).toBeCloseTo(w0 + reward, 5);
    expect(s.lifetime.toNumber()).toBeCloseTo(l0 + reward, 5);
    expect(s.notice?.kind).toBe('quest');
    expect(s.notice?.reward).toBe(reward); // HUD toast'ı coin + tutar çizer
    // Sıradaki görevin kartında ödül görünür (QuestView.reward).
    expect(s.quest?.reward).toBe(economyConfig.quests[1].reward ?? null);
  });
});

describe('mekânsal çay yükseltme noktası (zone) + gating', () => {
  it('önkoşul (2. masa) karşılanmadan zone pasiftir', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(1000);
    const z = LAYOUT.upgradeZone;
    useGame.setState({ player: [z[0], 0.6, z[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    for (let i = 0; i < 50; i++) useGame.getState().tick(0.1);
    // table2 açılmadığı için yükseltme noktası çalışmaz.
    expect(useGame.getState().stationLevels[0]).toBe(0);
  });

  it('table2 açıldıktan sonra noktada durunca seviye artar (activeZone kind=upgrade)', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    expect(completePad('table2')).toBe(true); // önkoşulu karşıla

    useGame.getState().addMoney(30); // L1 (25₺) yeter; max'a varmaz
    const z = LAYOUT.upgradeZone;
    useGame.setState({ player: [z[0], 0.6, z[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    const before = useGame.getState().stationLevels[0];

    for (let i = 0; i < 50; i++) useGame.getState().tick(0.1);

    expect(useGame.getState().stationLevels[0]).toBeGreaterThan(before);
    expect(useGame.getState().activeZone?.kind).toBe('upgrade');
  });

  it('GEOMETRİ DEĞİŞMEZİ: yükseltme PAD MERKEZİ pickup dairesinin DIŞINDA (kullanıcı 2026-06-11: pad ocağın yanında)', () => {
    // Pad ocağa bitişik durur (My Hotel obje-başı desen) ama MERKEZİ pickup yarıçapının dışında
    // kalmalı (+0.3 marj) → pad merkezinde duran oyuncu çay-alma alanına girmez; pickup alanı
    // içindeyken dolum zaten tick'teki pickup-guard'ıyla kilitli (alttaki test).
    for (let z = 0; z < LAYOUT.stations.length; z++) {
      const st = LAYOUT.stations[z];
      const up = LAYOUT.upgradeZones[z];
      const dist = Math.hypot(st[0] - up[0], st[2] - up[2]);
      expect(dist).toBeGreaterThanOrEqual(economyConfig.serving.pickupRadius + 0.3);
    }
  });

  it('çay almak için tezgâh önünde dururken yükseltme PARA ÇEKMEZ (pickup-yarıçapı guard\'ı)', () => {
    useGame.getState().hardReset();
    expect(completePad('table2')).toBe(true); // yükseltme noktası açık
    useGame.getState().addMoney(100);

    // Oyuncu tezgâhın TAM önünde (collision standoff ≈ z=-4.0): pickup yarıçapının İÇİNDE.
    const st = LAYOUT.stations[0];
    const front: [number, number, number] = [st[0], 0.6, st[2] + LAYOUT.stationHalf[1] + LAYOUT.playerRadius + 0.05];
    expect(Math.hypot(front[0] - st[0], front[2] - st[2])).toBeLessThan(economyConfig.serving.pickupRadius);
    useGame.setState({ player: front, inputKeyboard: [0, 0], inputJoystick: [0, 0], npcs: [], spawnTimer: 999 });

    const walletBefore = useGame.getState().wallet.toNumber();
    // Demleme (6sn/bardak) tamamlanıp çay tepsiye alınana kadar bekle (en az bir pickup yaşansın).
    for (let i = 0; i < 200 && useGame.getState().tray === 0; i++) useGame.getState().tick(0.1);

    // Durduğu halde (fillReady) ne dolum başladı ne para gitti; çay tepsiye alınabildi.
    expect(useGame.getState().upgradeFills[0]).toBe(0);
    expect(useGame.getState().stationLevels[0]).toBe(0);
    expect(useGame.getState().wallet.toNumber()).toBe(walletBefore);
    expect(useGame.getState().tray).toBeGreaterThan(0);
  });
});

describe('mobilya collision (D-016) — oyuncu ocağın/masanın içine giremez', () => {
  it('input ile ocağa yürürken İÇİNE GİRMEZ (kenarından kayar) + hareket eder', () => {
    useGame.getState().hardReset();
    const ocak = LAYOUT.stations[0];
    const startX = ocak[0] - 0.6; // ocağın solu (masa kutusundan uzak, ocak x-menzilinde) → -z'ye yürü
    const startZ = -1.4;
    useGame.setState({ player: [startX, 0.6, startZ], inputKeyboard: [0, -1], inputJoystick: [0, 0], npcs: [], spawnTimer: 999 });
    for (let i = 0; i < 60; i++) useGame.getState().tick(0.1);
    const p = useGame.getState().player;
    // Oyuncu merkezi ocak AABB'sinin İÇİNDE OLMAMALI (içine girmedi; kenardan kaydı/durdu).
    const insideOcak = Math.abs(p[0] - ocak[0]) < LAYOUT.stationHalf[0] && Math.abs(p[2] - ocak[2]) < LAYOUT.stationHalf[1];
    expect(insideOcak).toBe(false);
    // Dead-lock değil: bir yere hareket etti (kenara kaydı veya ocağa yaklaştı).
    expect(p[0] !== startX || p[2] !== startZ).toBe(true);
  });

  it('mobilyanın İÇİNDE kalırsa (ör. üstünde masa açıldı) çıkışına izin verilir (hapsolmaz)', () => {
    useGame.getState().hardReset();
    const tbl = LAYOUT.tables[0].table; // oyuncuyu masanın TAM merkezine koy (içinde)
    // Masadan UZAĞA (merkeze ters, +x) input ver → birkaç tick'te footprint dışına çıkmalı.
    useGame.setState({ player: [tbl[0], 0.6, tbl[2]], inputKeyboard: [1, 0], inputJoystick: [0, 0], npcs: [], spawnTimer: 999 });
    for (let i = 0; i < 40; i++) useGame.getState().tick(0.1);
    const p = useGame.getState().player;
    const half = LAYOUT.tableHalf[0] + LAYOUT.playerRadius;
    const stillInside = Math.abs(p[0] - tbl[0]) < half && Math.abs(p[2] - tbl[2]) < half;
    expect(stillInside).toBe(false); // dışarı çıkabildi (eski sürümde kilitlenip içeride kalırdı)
  });

  it('input olmadan (teleport/setState) collision uygulanmaz → testler/dev kancası etkilenmez', () => {
    useGame.getState().hardReset();
    const ocak = LAYOUT.stations[0];
    // Doğrudan ocağın merkezine ışınla (kutu içi), input yok → konum AYNEN korunur (push-out yok).
    useGame.setState({ player: [ocak[0], 0.6, ocak[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0], npcs: [], spawnTimer: 999 });
    useGame.getState().tick(0.1);
    const p = useGame.getState().player;
    expect(p[0]).toBeCloseTo(ocak[0], 5);
    expect(p[2]).toBeCloseTo(ocak[2], 5);
  });
});

describe('yerleşim — yürüme döngüsü zorlanır (D-017 §1, çakışma yok)', () => {
  function dist2D(a: readonly number[], b: readonly number[]) {
    return Math.hypot(a[0] - b[0], a[2] - b[2]);
  }
  it('hiçbir masa ocağın çay-alma + servis dairelerinin BİRLEŞİĞİNDE değil (tek noktada çay-al+servis imkânsız)', () => {
    const stove = LAYOUT.stations[0];
    const minSep = economyConfig.serving.pickupRadius + economyConfig.serving.serveRadius; // 1.6+1.6 = 3.2 (=2R)
    for (const t of LAYOUT.tables) {
      expect(dist2D(stove, t.table)).toBeGreaterThan(minSep);
    }
  });
  it('hiçbir masa bulaşığın yıkama + kirli-toplama dairelerinin BİRLEŞİĞİNDE değil (tek noktada kirli-al+yıka imkânsız)', () => {
    const dish = LAYOUT.dishStation;
    const minSep = economyConfig.cups.washRadius + economyConfig.cups.collectRadius; // 1.6+1.4 = 3.0
    for (const t of LAYOUT.tables) {
      expect(dist2D(dish, t.table)).toBeGreaterThan(minSep);
    }
  });
  it('başlangıç masası (table0) ocaktan hedef ~5 br uzak (yürüme döngüsü en baştan zorlanır)', () => {
    expect(dist2D(LAYOUT.stations[0], LAYOUT.tables[0].table)).toBeGreaterThan(4);
  });
});

describe('personel yol bulma (nav.ts — BFS, kilitlenme yok)', () => {
  // Oyundaki ile aynı engeller: ocak + bulaşık + 4 masa (koltuk/semaver hariç).
  function navSolids() {
    const solids = [
      { c: LAYOUT.stations[0], h: LAYOUT.stationHalf },
      { c: LAYOUT.dishStation, h: LAYOUT.dishHalf },
    ];
    for (const t of LAYOUT.tables) solids.push({ c: t.table, h: LAYOUT.tableHalf });
    return solids;
  }
  const grid = () => buildNavGrid(LAYOUT.area, 0.3, navSolids(), LAYOUT.actorRadius);
  const REACH = 1.1;

  it('ocaktan HER masaya yol bulunur (kolon-bloklu arka masalar dahil)', () => {
    const g = grid();
    const station = LAYOUT.stations[0];
    for (const t of LAYOUT.tables) {
      const path = findNavPath(g, station, t.table[0], t.table[2], REACH);
      expect(path).not.toBeNull(); // ulaşılamayan masa YOK
    }
  });

  it('engel TAM aradayken etrafından dolaşır (eski moveAvoid kilitlenirdi)', () => {
    const g = grid();
    // table0 (ön-sol) ile table2 (arka-sol) aynı x kolonunda; table0 ocak ile table2 arasında.
    const t0 = LAYOUT.tables[0].table; // [-2.4, 0.0]
    const t2 = LAYOUT.tables[2].table; // [-2.4, 3.0]
    // table0'ın hemen ARKASINDAN (ocak tarafı) table2'ye yol iste.
    const behind: [number, number, number] = [t0[0], 0, t0[2] - 1.0];
    const path = findNavPath(g, behind, t2[0], t2[2], REACH);
    expect(path).not.toBeNull();
    // Yol, table0 gövdesinin İÇİNDEN geçmemeli (her waypoint masa footprint+aktör yarıçapı dışında).
    const blockedHalf = LAYOUT.tableHalf[0] + LAYOUT.actorRadius;
    for (const [wx, wz] of path!) {
      const insideT0 = Math.abs(wx - t0[0]) < blockedHalf && Math.abs(wz - t0[2]) < blockedHalf;
      expect(insideT0).toBe(false);
    }
  });

  it('garson kolon-bloklu ARKA masaya gerçekten servis eder (deadlock yok, entegrasyon)', () => {
    useGame.getState().hardReset();
    const backIdx = 2; // sol-alt masa: ocak ile arasında table0 var (eski sistemde kilitlenirdi)
    useGame.setState({
      padsDone: ['table2', 'table3', 'table4', 'waiter'],
      // Garsonu ocakta tepsi DOLU başlat → doğruca teslimata yönelir.
      waiters: [{ pos: [...LAYOUT.stations[0]] as [number, number, number], tray: 1 }, null],
      player: [0, 0.6, 4.2], // oyuncu uzakta (servis etmesin)
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [
        { id: 950, state: 'waitingForTea', pos: [...LAYOUT.tables[backIdx].seat] as [number, number, number], tableIndex: backIdx, seatIndex: 0, timer: 999, color: '#27ae60' },
      ],
      spawnTimer: 999, // yeni müşteri spawn olmasın
    });
    // Garson (hız 1.8) rotayı dolaşıp masaya VARANA kadar simüle et (deadlock olsaydı asla varmazdı).
    let servedState = 'waitingForTea';
    for (let i = 0; i < 120 && servedState === 'waitingForTea'; i++) {
      useGame.getState().tick(0.1);
      servedState = useGame.getState().npcs.find((n) => n.id === 950)?.state ?? 'leaving';
    }
    // Müşteri sabrı 999 → tek çıkış yolu SERVİS (drinking) → arka masaya gerçekten ulaşıldı (takılmadı).
    expect(servedState).not.toBe('waitingForTea');
    expect(useGame.getState().waiters[0]?.tray).toBe(0); // çayı bıraktı
  });

  it('MÜŞTERİ kolon-bloklu ARKA masaya gerçekten oturur (eski moveAvoid ön masada kilitleniyordu)', () => {
    useGame.getState().hardReset();
    const backIdx = 2; // arka-sol masa: kapı ile koltuk arasında table0 TAM kolonda
    useGame.setState({
      padsDone: ['table2', 'table3'],
      player: [4.5, 0.6, 4.2], // oyuncu uzakta
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [
        { id: 960, state: 'toTable', pos: [...LAYOUT.entrances[0]] as [number, number, number], tableIndex: backIdx, seatIndex: 0, timer: 0, color: '#27ae60' },
      ],
      spawnTimer: 999,
    });
    let st = 'toTable';
    for (let i = 0; i < 120 && st === 'toTable'; i++) {
      useGame.getState().tick(0.1);
      st = useGame.getState().npcs.find((n) => n.id === 960)?.state ?? 'gone';
    }
    expect(st).toBe('waitingForTea'); // oturdu (takılıp 30sn vazgeçme sigortasına düşmedi)
    const npc = useGame.getState().npcs.find((n) => n.id === 960)!;
    expect(npc.pos[0]).toBeCloseTo(LAYOUT.tables[backIdx].seat[0], 5);
    expect(npc.pos[2]).toBeCloseTo(LAYOUT.tables[backIdx].seat[2], 5);
  });

  it('nav ızgarası oyun alanının DIŞINA hücre açmaz (taşan satır kapı önü salınımı yapıyordu)', () => {
    // KÖK NEDEN (telefon 2026-06-11): rows=ceil ile son satır merkezi z≈5.05 > area.maxZ 5.0 →
    // kapıdan girip SAĞA gidecek müşterinin ilk waypoint'i bu satıra düşünce z>5.0'a itiliyor,
    // "kapıya yürü" dalı geri çekiyor → kapı yanında (çöp kovası hizasında) sonsuz salınım.
    const g = buildNavGrid(LAYOUT.area, 0.3, navSolids(), LAYOUT.actorRadius);
    for (let r = 0; r < g.rows; r++) {
      const z = g.minZ + (r + 0.5) * g.cell;
      if (z > LAYOUT.area.maxZ) {
        for (let c = 0; c < g.cols; c++) expect(g.blocked[r * g.cols + c]).toBe(1);
      }
    }
  });

  it('MÜŞTERİ sokaktan SAĞ ön masaya GERÇEK frame dt ile oturur (kapı önü salınım regresyonu)', () => {
    useGame.getState().hardReset();
    const rightIdx = 1; // ön-SAĞ masa: kapıdan sonra rota sağa kırar (telefon bug senaryosu)
    useGame.setState({
      padsDone: ['table2'],
      player: [-4.5, 0.6, 4.2], // oyuncu uzakta
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [
        { id: 962, state: 'toTable', pos: [...LAYOUT.streets[0]] as [number, number, number], tableIndex: rightIdx, seatIndex: 0, timer: 0, color: '#27ae60' },
      ],
      spawnTimer: 999,
    });
    // GERÇEK frame adımı (1/60): telefondaki küçük adımlar hücre-sınırı salınımını tetikliyordu;
    // dt=0.1'lik eski testler bunu atlıyordu. 35 sn simüle (30sn vazgeçme sigortasından uzun).
    let st = 'toTable';
    for (let i = 0; i < 35 * 60 && st === 'toTable'; i++) {
      useGame.getState().tick(1 / 60);
      st = useGame.getState().npcs.find((n) => n.id === 962)?.state ?? 'gone';
    }
    expect(st).toBe('waitingForTea'); // oturdu — salınıma takılıp vazgeçmedi
  });

  it('MÜŞTERİ arka masadan çıkışta kapıya BFS ile gider ve sokakta silinir', () => {
    useGame.getState().hardReset();
    const backIdx = 2;
    useGame.setState({
      padsDone: ['table2', 'table3'],
      player: [4.5, 0.6, 4.2],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [
        { id: 961, state: 'leaving', pos: [...LAYOUT.tables[backIdx].seat] as [number, number, number], tableIndex: backIdx, seatIndex: 0, timer: 0, color: '#27ae60' },
      ],
      spawnTimer: 999,
    });
    let gone = false;
    for (let i = 0; i < 150 && !gone; i++) {
      useGame.getState().tick(0.1);
      gone = !useGame.getState().npcs.some((n) => n.id === 961);
    }
    expect(gone).toBe(true); // kapıdan çıkıp sokakta kayboldu (takılmadı)
  });
});

describe('masa yükseltme + bahşiş (Faz 2h)', () => {
  it('maliyet eğrisi geometrik (60 × 1.8^lvl)', () => {
    expect(tableUpgradeCost(0)).toBe(60);
    expect(tableUpgradeCost(1)).toBe(108);
    expect(tableUpgradeCost(2)).toBe(194);
    expect(tableUpgradeCost(3)).toBe(349);
  });

  it('bahşiş ve sabır seviyeyle artar; L0 nötr', () => {
    expect(tableTip(0)).toBe(0);
    expect(tableTip(2)).toBe(economyConfig.tables.tipBase * 2);
    expect(tablePatience(0)).toBe(economyConfig.npc.patience);
    expect(tablePatience(2)).toBe(economyConfig.npc.patience + economyConfig.tables.patiencePerLevel * 2);
  });

  it('yükseltme noktası TÜM masalar (table4) açılınca belirir — erken oyunda gizli (D-019 §3)', () => {
    useGame.getState().hardReset();
    expect(tableUpgradeZoneUnlocked(gate())).toBe(false); // başta
    useGame.setState({ padsDone: ['table2', 'table3'] });
    expect(tableUpgradeZoneUnlocked(gate())).toBe(false); // hâlâ kilitli (table4 lazım → erken ekran sade)
    useGame.setState({ padsDone: ['table2', 'table3', 'table4'] });
    expect(tableUpgradeZoneUnlocked(gate())).toBe(true); // 4. masa açılınca belirir
  });

  it('ödeyen müşteri çay fiyatı + OTURDUĞU masanın bahşişini bırakır (masa-başı)', () => {
    useGame.getState().hardReset();
    const seat = LAYOUT.tables[0].seat;
    useGame.setState({
      tableLevels: [2, 0, 0, 0], // sadece 0. masa L2 → bahşiş = tipBase×2
      player: [5.2, 0.6, -5.2], // GERÇEKTEN uzak (alan içi köşe; eski [0,0.6,99] z=5'e kelepçelenip mıknatısa giriyordu — flaky)
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      coins: [],
      npcs: [{ id: 970, state: 'drinking', pos: [...seat] as [number, number, number], tableIndex: 0, seatIndex: 0, timer: 0.05, color: '#27ae60' }],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.1); // drinking timer biter → öder
    const coin = useGame.getState().coins.find((c) => c.value === TEA_PRICE + tableTip(2));
    expect(coin).toBeTruthy(); // 5 + 4 = 9 ₺ düştü
  });

  it('oturan müşterinin sabrı OTURDUĞU masanın seviyesiyle uzar', () => {
    useGame.getState().hardReset();
    const seat = LAYOUT.tables[0].seat;
    useGame.setState({
      tableLevels: [2, 0, 0, 0],
      player: [5.2, 0.6, -5.2],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      // Koltuğun üstünde 'toTable' → bu tick oturur, timer = tablePatience(2).
      npcs: [{ id: 971, state: 'toTable', pos: [...seat] as [number, number, number], tableIndex: 0, seatIndex: 0, timer: 0, color: '#2980b9' }],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.05);
    const n = useGame.getState().npcs.find((x) => x.id === 971);
    expect(n?.state).toBe('waitingForTea');
    expect(n?.timer).toBeGreaterThan(economyConfig.npc.patience); // taban 18'den fazla
    expect(n?.timer).toBeCloseTo(tablePatience(2), 5);
  });

  it('yükseltme MASA-BAŞI: bir masanın noktasında dur → SADECE o masa yükselir (diğerleri 0)', () => {
    useGame.getState().hardReset();
    // 4 masayı aç (omurga padsDone) + bol para; oyuncuyu 0. masanın yükseltme noktasına koy.
    useGame.setState({
      padsDone: ['table2', 'table3', 'table4'],
      tableLevels: [0, 0, 0, 0],
      wallet: D(5000),
      player: [LAYOUT.tables[0].upgradeSpot[0], 0.6, LAYOUT.tables[0].upgradeSpot[2]],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [],
      spawnTimer: 999,
    });
    for (let i = 0; i < 40; i++) useGame.getState().tick(0.1);
    const lv = useGame.getState().tableLevels;
    expect(lv[0]).toBeGreaterThan(0); // 0. masa yükseldi
    expect(lv[1]).toBe(0); // komşu masalar ETKİLENMEDİ (toplu değil)
    expect(lv[2]).toBe(0);
    expect(lv[3]).toBe(0);
  });

  it('tableLevels kayıttan korunur; v10→v12 migrasyon zinciri (eski tek seviye → her masaya)', () => {
    // v10 kaydı (masa yükseltmesi yok) → tüm masalar 0.
    const v10raw: Record<string, unknown> = {
      saveVersion: 10, wallet: '500', diamonds: '0', lifetime: '500',
      stationLevel: 2, trayLevel: 1, padsDone: ['table2', 'table3'], padFills: {}, lastSaved: Date.now(),
    };
    const m = migrate(v10raw);
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(Array.isArray(m.tableLevels)).toBe(true);
    expect(m.tableLevels.every((n) => n === 0)).toBe(true);
    expect((m as Record<string, unknown>).tableLevel).toBeUndefined(); // eski tek alan kalmadı
    // v11 kaydı (eski tek tableLevel=2) → v12'de HER masaya uygulanır (zone-geneli → masa-başı).
    const v11 = migrate({ ...v10raw, saveVersion: 11, tableLevel: 2 });
    expect(v11.tableLevels.length).toBeGreaterThanOrEqual(4);
    expect(v11.tableLevels.every((n) => n === 2)).toBe(true);
  });
});

describe('Etkileşim HAREKET-temelli (D-018 §2): üstünden geçerken alma, durunca hemen al', () => {
  function placeOnPad() {
    useGame.getState().hardReset();
    useGame.getState().addMoney(1000); // wallet + lifetime (table2 gate'i için lifetime≥20)
    // Quest sistemi: pad yalnız kendi görevi aktifken doldurulabilir → table2 görevine atla.
    useGame.setState({ questIndex: questIndexFor('table2'), questBase: 0 });
    const pad = currentPad(gate())!; // table2 (omurga)
    const pos = LAYOUT.padPos[pad.id];
    useGame.setState({ player: [pos[0], 0.6, pos[2]], npcs: [], spawnTimer: 999 });
    return { pad, pos };
  }

  it('üstünden GEÇERKEN (hareket halinde) para AKMAZ', () => {
    const { pad, pos } = placeOnPad();
    // Her tick'te pad'e geri koy + HAREKET input'u → konumdan değil HAREKETTEN ötürü akmadığını test eder.
    for (let i = 0; i < 12; i++) {
      useGame.setState({ player: [pos[0], 0.6, pos[2]], inputKeyboard: [1, 0], inputJoystick: [0, 0] });
      useGame.getState().tick(0.1);
    }
    expect(useGame.getState().wallet.toNumber()).toBe(1000); // hiç harcanmadı
    expect(useGame.getState().padsDone).not.toContain(pad.id);
  });

  it('DURUNCA (input ~0) para HEMEN akmaya başlar (sayaç/countdown yok)', () => {
    const { pos } = placeOnPad();
    useGame.setState({ player: [pos[0], 0.6, pos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    useGame.getState().tick(0.1); // TEK tick yeter → para hemen akar
    expect(useGame.getState().wallet.toNumber()).toBeLessThan(1000);
  });

  it('biriken ₺ KORUNUR: noktadan çıkınca kısmi dolum sıfırlanmaz', () => {
    const { pad, pos } = placeOnPad();
    useGame.setState({ wallet: D(20) }); // cost(25)'ten AZ → tamamlanmaz, kısmi kalır
    for (let i = 0; i < 6; i++) {
      useGame.setState({ player: [pos[0], 0.6, pos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
      useGame.getState().tick(0.1);
    }
    const accrued = useGame.getState().padFills[pad.id] ?? 0;
    expect(accrued).toBeGreaterThan(0);
    expect(useGame.getState().padsDone).not.toContain(pad.id); // tamamlanmadı (20<25)
    // ÇIK → biriken dolum korunur.
    useGame.setState({ player: [pos[0] + 6, 0.6, pos[2]] });
    useGame.getState().tick(0.1);
    expect(useGame.getState().padFills[pad.id] ?? 0).toBeCloseTo(accrued, 5);
  });
});

describe('Level/XP sistemi (v17, 2026-06-10) — eylem XP\'si, seviye eğrisi, migrasyon tohumlama, ayarlar', () => {
  const X = economyConfig.xp;

  it('seviye eğrisi: xpForLevel geometrik büyür; levelProgress doğru böler', () => {
    expect(xpForLevel(1)).toBe(Math.round(X.levelBase));
    expect(xpForLevel(2)).toBe(Math.round(X.levelBase * X.levelGrowth));
    expect(levelProgress(0)).toEqual({ level: 1, cur: 0, need: xpForLevel(1) });
    // Tam L1 eşiği: seviye atlar, içi sıfırlanır.
    expect(levelProgress(xpForLevel(1))).toEqual({ level: 2, cur: 0, need: xpForLevel(2) });
    // L2 ortası.
    const mid = xpForLevel(1) + 10;
    expect(levelProgress(mid)).toEqual({ level: 2, cur: 10, need: xpForLevel(2) });
    // Negatif/bozuk değer güvenli.
    expect(levelProgress(-50).level).toBe(1);
  });

  it('oyuncu eliyle servis XP verir; görev tamamlanınca görev XP\'si eklenir', () => {
    useGame.getState().hardReset();
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    for (let i = 0; i < 200; i++) useGame.getState().tick(0.1);
    const waiting = useGame.getState().npcs.find((n) => n.state === 'waitingForTea');
    expect(waiting).toBeTruthy();
    const st = LAYOUT.stations[0];
    useGame.setState({ player: [st[0], 0.6, st[2]] });
    useGame.getState().tick(0.1); // çay al (q_pickup tamamlanır → +perQuest)
    const xpAfterPickup = useGame.getState().xp;
    expect(xpAfterPickup).toBeGreaterThanOrEqual(X.perQuest);
    const seat = LAYOUT.tables[waiting!.tableIndex].seat;
    useGame.setState({ player: [seat[0], 0.6, seat[2]] });
    useGame.getState().tick(0.1); // servis (+perTeaServed; q_serve1 da tamamlanır → +perQuest)
    expect(useGame.getState().xp).toBeGreaterThanOrEqual(xpAfterPickup + X.perTeaServed + X.perQuest);
  });

  it('pad açılışı XP verir; seviye atlanınca toast gelir', () => {
    useGame.getState().hardReset();
    // Seviye eşiğinin hemen altına kur → pad XP'si seviye atlatsın.
    useGame.setState({ xp: xpForLevel(1) - 1, notice: null });
    expect(completePad('table2')).toBe(true);
    const s = useGame.getState();
    expect(s.xp).toBeGreaterThanOrEqual(xpForLevel(1) - 1 + X.perPad);
    // Pad + quest XP'si eşiği aştı → "Seviye 2!" toast'u (sonraki görev toast'larından önce yakalanmış olmalı
    // — aynı tick'te görev de tamamlanır; level-up bildirimi görev bildirimini EZER).
    expect(levelProgress(s.xp).level).toBeGreaterThanOrEqual(2);
  });

  it('migrasyon v16→v17: xp mevcut ilerlemeden tohumlanır (eski oyuncu Level 1\'e düşmez)', () => {
    const m = migrate({
      saveVersion: 16,
      wallet: '500',
      lifetime: '2000',
      stationLevel: 2,
      tableLevels: [1, 1, 0, 0],
      waiterLevel: 1,
      padsDone: ['table2', 'table3', 'waiter'],
      padFills: {},
      stats: { teaPickups: 60, teasServed: 50, coinsCollected: 80, dishesWashed: 30, waiterServed: 25 },
      questIndex: 9,
      questBase: 0,
      lastSaved: Date.now(),
    });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    const expected =
      50 * X.perTeaServed +
      25 * X.perWaiterServed +
      30 * X.perDishWashed +
      9 * X.perQuest +
      3 * X.perPad +
      (2 + 1 + 2) * X.perUpgrade;
    expect(m.xp).toBe(expected);
    expect(levelProgress(m.xp).level).toBeGreaterThan(1);
    expect(m.settings).toEqual({ sound: true, music: true, notifications: true });
  });

  it('ayarlar: setSetting persist eder; bozuk kayıt değeri default\'a normalize edilir', () => {
    useGame.getState().hardReset();
    useGame.getState().setSetting('sound', false);
    expect(useGame.getState().settings.sound).toBe(false);
    // (localStorage node ortamında yok — persist yolu smoke testinde doğrulanır.)
    // Bozuk settings alanı migrate'te default'lanır.
    const m = migrate({ saveVersion: 16, padsDone: [], settings: 'bozuk', lastSaved: Date.now() });
    expect(m.settings).toEqual({ sound: true, music: true, notifications: true });
    // hardReset sıfırlar (yeni kayıt default ayarlarla).
    useGame.getState().hardReset();
    expect(useGame.getState().settings.sound).toBe(true);
  });
});

describe('bulaşık onboarding gate (2026-06-10) — q_wash gelmeden kirli bardak çıkmaz', () => {
  it('görev öncesi: içen müşteri kirli BIRAKMAZ, bardak temiz havuza döner (korunum bozulmaz)', () => {
    useGame.getState().hardReset(); // questIndex 0 < q_wash
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    for (let i = 0; i < 200; i++) useGame.getState().tick(0.1);
    const waiting = useGame.getState().npcs.find((n) => n.state === 'waitingForTea');
    expect(waiting).toBeTruthy();
    const st = LAYOUT.stations[0];
    useGame.setState({ player: [st[0], 0.6, st[2]] });
    useGame.getState().tick(0.1);
    const seat = LAYOUT.tables[waiting!.tableIndex].seat;
    useGame.setState({ player: [seat[0], 0.6, seat[2]] });
    useGame.getState().tick(0.1);
    // İçme bitsin (oyuncu uzakta).
    useGame.setState({ player: [0, 0.6, 6.5] });
    for (let i = 0; i < 100; i++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    expect(s.dishes.length).toBe(0); // kirli YOK (öğretilmedi)
    // Korunum: havuz eksilmedi (bardak temize geri döndü) → demleme asla kilitlenmez.
    expect(s.cleanCups + s.readyCupsByZone[0] + s.tray + s.npcs.filter((n) => n.state === 'drinking').length).toBe(
      cupPoolCapacity(s.stationLevels[0]),
    );
  });
});

describe('ZONE-2 (Faz 3a + D-022) — per-zone ocak+bulaşık, geçit pad\'i, migrasyon', () => {
  const Z1_CHAIN = ['table2', 'table3', 'waiter', 'dishwasher', 'table4'];

  it('derivedFromPads: zone2 açılınca zonesOpen=2, oto +1 masa (slot 4), per-zone personel ayrı', () => {
    const d1 = derivedFromPads([...Z1_CHAIN]);
    expect(d1.zonesOpen).toBe(1);
    expect(d1.tables).toBe(4);
    const d2 = derivedFromPads([...Z1_CHAIN, 'zone2']);
    expect(d2.zonesOpen).toBe(2);
    expect(d2.stations).toBe(2);
    expect(d2.tables).toBe(5); // zone-2 oto 1. masa
    expect(d2.tablesByZone).toEqual([4, 1, 0]); // z2 (arka-sağ TOST) kilitli
    expect(d2.hasWaiterByZone).toEqual([true, false, false]); // z1 garsonu z2'ye SIZMAZ
    const d3 = derivedFromPads([...Z1_CHAIN, 'zone2', 'z2table2', 'z2waiter']);
    expect(d3.tables).toBe(6);
    expect(d3.hasWaiterByZone).toEqual([true, true, false]);
  });

  it('savunmacı: zone2 pad\'i YOKKEN z2 pad\'leri etki edemez (bozuk kayıt sızamaz)', () => {
    const d = derivedFromPads(['z2table2', 'z2waiter']);
    expect(d.zonesOpen).toBe(1);
    expect(d.tables).toBe(1);
    expect(d.hasWaiterByZone[1]).toBe(false);
  });

  it('STORE entegrasyon: geçit pad\'iyle zone-2 açılır → 2. ocak demler, oyuncu 2. ocaktan alır, zone-2 masasına müşteri oturur', () => {
    useGame.getState().hardReset();
    useGame.setState({ padsDone: [...Z1_CHAIN] });
    useGame.getState().addMoney(50); // lifetime tabanı
    expect(completePad('zone2')).toBe(true);
    const s0 = useGame.getState();
    expect(s0.zonesOpen).toBe(2);
    expect(s0.tables).toBe(5);
    // 2. ocak kendi kuyruğuna demler (oyuncu uzakta).
    useGame.setState({ player: [0, 0.6, 4.5], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    for (let i = 0; i < 300 && useGame.getState().readyCupsByZone[1] === 0; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().readyCupsByZone[1]).toBeGreaterThan(0);
    // Oyuncu zone-2 ocağından tepsiye alır.
    const st2 = LAYOUT.stations[1];
    useGame.setState({ player: [st2[0], 0.6, st2[2]] });
    useGame.getState().tick(0.1);
    expect(useGame.getState().tray).toBeGreaterThan(0);
    // Zone-2 masasına (global slot >= 4) müşteri oturur (kendi kapısından gelir).
    let sawZone2Npc = false;
    for (let i = 0; i < 600 && !sawZone2Npc; i++) {
      useGame.getState().tick(0.1);
      sawZone2Npc = useGame.getState().npcs.some((n) => n.tableIndex >= 4);
    }
    expect(sawZone2Npc).toBe(true);
  });

  it('bardak korunumu zone-2 ile GLOBAL: unlock poolBase ekler; toplam bardak değişmezi sürer', () => {
    useGame.getState().hardReset();
    useGame.setState({ padsDone: [...Z1_CHAIN] });
    useGame.getState().addMoney(50);
    expect(completePad('zone2')).toBe(true);
    // Bir süre oyna (demleme + müşteri akışı) — q_wash geçildi (questIndex zone2 sonrası) → kirli çıkar.
    for (let i = 0; i < 400; i++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    const drinking = s.npcs.filter((n) => n.state === 'drinking').length;
    const total =
      s.cleanCups + s.readyCupsByZone[0] + s.readyCupsByZone[1] + s.tray + s.carriedDirty +
      s.dishes.length + drinking +
      (s.waiters[0]?.tray ?? 0) + (s.waiters[1]?.tray ?? 0) +
      (s.dishwashers[0]?.tray ?? 0) + (s.dishwashers[1]?.tray ?? 0);
    expect(total).toBe(totalCupPool(s.zonesOpen, s.stationLevels));
  });

  it('kayıt migrasyonu v17→v18: skaler stationLevel/waiterLevel zone-1 dizisine taşınır (ilerleme korunur)', () => {
    const m = migrate({
      saveVersion: 17, wallet: '500', diamonds: '0', lifetime: '5000',
      stationLevel: 3, waiterLevel: 1, padsDone: [...Z1_CHAIN], padFills: {},
      tableLevels: [1, 0, 0, 0], stats: defaultStats(), questIndex: 13, questBase: 0,
      xp: 100, settings: { sound: true, music: true, notifications: true }, lastSaved: Date.now(),
    });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.stationLevels).toEqual([3]);
    expect(m.waiterLevels).toEqual([1]);
    expect((m as Record<string, unknown>).stationLevel).toBeUndefined();
    expect((m as Record<string, unknown>).waiterLevel).toBeUndefined();
  });

  it('kayıt migrasyonu v24→v25: kaldırılan pad\'ler (wc/cleaner/zone4 zinciri) düşülür, ₺ İADE edilir', () => {
    const Z2 = ['zone2', 'z2table2', 'z2waiter', 'z2table3', 'z2dishwasher', 'z2table4'];
    const Z3 = ['zone3', 'z3table2', 'z3waiter', 'z3table3', 'z3dishwasher', 'z3table4'];
    const m = migrate({
      saveVersion: 24, wallet: '100', diamonds: '0', lifetime: '50000',
      stationLevels: [1, 0, 0, 0], waiterLevels: [0, 0, 0, 0],
      padsDone: [...Z1_CHAIN, ...Z2, ...Z3, 'wc', 'cleaner', 'zone4', 'z4table2'],
      padFills: { z4waiter: 700 },
      tableLevels: [], stats: defaultStats(), questIndex: 999, questBase: 0,
      xp: 100, settings: { sound: true, music: true, notifications: true }, lastSaved: Date.now(),
    });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    // İade: wc 3000 + cleaner 2000 + zone4 9000 + z4table2 1200 + yarım z4waiter 700 = 15.900 (+100 cüzdan).
    expect(m.wallet).toBe('16000');
    expect(m.padsDone).toEqual([...Z1_CHAIN, ...Z2, ...Z3]);
    expect(m.padFills).toEqual({});
    // Silinen görevler listenin sonundaydı → questIndex hat sonuna clamp'lenir.
    expect(m.questIndex).toBe(economyConfig.quests.length);
  });
});

describe('WP1 bug paketi (2026-06-11) — quest-pad gate, zone kamera odağı, offline tavanları', () => {
  it("aktif görevin hedef pad'i requires gate'ini ATLAR (q_table2 verilmişken pad görünür)", () => {
    useGame.getState().hardReset();
    const qi = economyConfig.quests.findIndex((q) => q.id === 'q_table2');
    useGame.setState({ questIndex: qi, questBase: 0 });
    const g = gate();
    expect(g.lifetime).toBeLessThan(20); // minLifetime:20 KARŞILANMIYOR ama görev aktif...
    expect(visiblePads(qi, g).map((p) => p.id)).toEqual(['table2']); // ...pad yine görünür
    // Görev-dışı güvenlik ağında gate hâlâ işler (currentPad requires'a bakar).
    expect(currentPad(g)).toBeNull();
  });

  it('questFocusPos zone-2 görevlerinde zone-2 koordinatına bakar (zone parametresi)', () => {
    // serveTea zone 1 → zone-2 salon ortası (x zone-1 alanının dışında).
    const p = questFocusPos({ type: 'serveTea', count: 5 }, [], 8, 1);
    expect(p[0]).toBeGreaterThan(LAYOUT.zoneAreas[0].maxX);
    // stationLevel / washDish / pickupTea zone 1 → zone-2 noktaları.
    expect(questFocusPos({ type: 'stationLevel', level: 1 }, [], 8, 1)).toEqual(LAYOUT.upgradeZones[1]);
    expect(questFocusPos({ type: 'washDish', count: 3 }, [], 8, 1)).toEqual(LAYOUT.dishStations[1]);
    expect(questFocusPos({ type: 'pickupTea', count: 1 }, [], 8, 1)).toEqual(LAYOUT.stations[1]);
    // zone verilmezse eski davranış (zone-1) — geri uyum.
    expect(questFocusPos({ type: 'stationLevel', level: 1 }, [], 4)).toEqual(LAYOUT.upgradeZones[0]);
    // Config: tüm z2 görevleri zone:1 işaretli (kamera asla zone-1'e zoom atmaz).
    for (const q of economyConfig.quests) {
      if (q.id.startsWith('q_z2')) expect(q.zone).toBe(1);
    }
  });

  it('offline PARA tavanı: kazanç sıradaki omurga pad maliyetinin oranını aşamaz', () => {
    const frac = economyConfig.offline.capNextPadFrac;
    // Taze oyun: sıradaki pad table2 (25₺) → dev oran bile tavana kelepçelenir.
    expect(computeOfflineEarned(100, 3600, [])).toBe(Math.floor(25 * frac));
    // Zone-1 bitti: sıradaki zone2 pad'i → tavan = pad × frac (2026-06-11: frac 1.2 — zone AÇILIR
    // ama salonun İÇİ bitmez: tavan < zone2 + ilk iç pad).
    const z1 = ['table2', 'table3', 'waiter', 'dishwasher', 'table4'];
    const capped = computeOfflineEarned(4, 3600, z1);
    const zone2Cost = economyConfig.pads.find((p) => p.id === 'zone2')!.cost;
    const z2t2Cost = economyConfig.pads.find((p) => p.id === 'z2table2')!.cost;
    expect(capped).toBe(Math.floor(zone2Cost * frac));
    expect(capped).toBeLessThan(zone2Cost + z2t2Cost);
    // Düşük oran tavana takılmaz (normal formül işler).
    expect(computeOfflineEarned(0.05, 600, z1)).toBe(
      Math.floor(0.05 * economyConfig.offline.rateMult * 600),
    );
    // Tüm pad'ler bitti: referans = en pahalı pad (tavansız kalmaz).
    const all = economyConfig.pads.map((p) => p.id);
    const maxCost = Math.max(...economyConfig.pads.map((p) => p.cost));
    expect(computeOfflineEarned(1000, 7200, all)).toBe(Math.floor(maxCost * frac));
  });

  it('offline SÜRE tavanı hâlâ işler (cap üstü süre işlemez) + rateMult 0.5 (2026-06-11 kullanıcı)', () => {
    expect(economyConfig.offline.rateMult).toBe(0.5);
    const z1 = ['table2', 'table3', 'waiter', 'dishwasher', 'table4'];
    const oneHour = computeOfflineEarned(0.5, 3600, z1);
    const threeHours = computeOfflineEarned(0.5, 3 * 3600, z1);
    expect(threeHours).toBe(oneHour); // 1sa tavanından sonrası işlemez
    expect(oneHour).toBe(Math.floor(0.5 * economyConfig.offline.rateMult * 3600));
  });

  it('offline oranına masa bahşişleri dahil (2026-06-11): tipTotal orana eklenir', () => {
    const base = incomeRate(4, 0, 1, 0);
    const withTips = incomeRate(4, 0, 1, 0, 4 * economyConfig.tables.tipBase); // 4 masa L1
    // Döngü aynı, gelir payı masa başına +tipBase → oran tam o oranda büyür.
    const cycle = (4 * 5) / base;
    expect(withTips).toBeCloseTo((4 * 5 + 4 * economyConfig.tables.tipBase) / cycle, 6);
    expect(withTips).toBeGreaterThan(base);
  });
});

describe('kozmetik mağaza (WP6, v19) — zone-başına tema satın alma + migrasyon', () => {
  it('satın alma cüzdandan düşer, tema uygulanır, sahiplik kalıcı (geri dönüş ücretsiz)', () => {
    useGame.getState().hardReset();
    const floor = economyConfig.cosmetics.floorThemes.find((t) => t.cost > 0)!;
    // Para yokken satın alınamaz.
    expect(useGame.getState().buyCosmetic('floor', floor.id, 0)).toBe(false);
    expect(useGame.getState().floorThemeByZone[0]).toBe('parke');
    // Yeterli parayla satın alınır + uygulanır + cüzdan düşer.
    useGame.getState().addMoney(floor.cost + 500);
    const before = useGame.getState().wallet.toNumber();
    expect(useGame.getState().buyCosmetic('floor', floor.id, 0)).toBe(true);
    expect(useGame.getState().floorThemeByZone[0]).toBe(floor.id);
    expect(useGame.getState().wallet.toNumber()).toBe(before - floor.cost);
    expect(useGame.getState().ownedCosmetics).toContain(`floor:${floor.id}:z0`);
    // Default'a dön (ücretsiz) + sahip olunan temaya GERİ dönmek de ücretsiz.
    expect(useGame.getState().buyCosmetic('floor', 'parke', 0)).toBe(true);
    const w2 = useGame.getState().wallet.toNumber();
    expect(useGame.getState().buyCosmetic('floor', floor.id, 0)).toBe(true);
    expect(useGame.getState().wallet.toNumber()).toBe(w2); // ikinci kez para düşmez
    // Kapalı zone'a uygulanamaz (zonesOpen 1) + tanımsız tema reddedilir.
    expect(useGame.getState().buyCosmetic('wall', 'yesil', 1)).toBe(false);
    expect(useGame.getState().buyCosmetic('floor', 'yok-boyle-tema', 0)).toBe(false);
  });

  it('kayıt v18→v19: kozmetik alanları default ile gelir (eski ilerleme korunur)', () => {
    const m = migrate({
      saveVersion: 18, wallet: '500', diamonds: '0', lifetime: '5000',
      stationLevels: [3], waiterLevels: [1], padsDone: ['table2'], padFills: {},
      tableLevels: [1, 0, 0, 0], stats: defaultStats(), questIndex: 5, questBase: 0,
      xp: 100, settings: { sound: true, music: true, notifications: true }, lastSaved: Date.now(),
    });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    // v26 (Y1): tost salonu (z2) kendi varsayılan zeminiyle ('yemek') gelir; çay zone'ları boş kalır
    // (init'te 'parke' doldurulur).
    expect(m.floorThemeByZone[0]).toBeUndefined();
    expect(m.floorThemeByZone[1]).toBeUndefined();
    expect(m.floorThemeByZone[2]).toBe('yemek');
    expect(m.wallThemeByZone).toEqual([]);
    expect(m.ownedCosmetics).toEqual([]);
    expect(m.wallet).toBe('500');
    // v20 id-eşleme: eski index 5 = 'q_station2' → yeni listede aynı görev (index kaysa da id korunur).
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_station2');
  });
});

describe('karakter yükseltmeleri (v20) — eğri, satın alma, migrasyon, görev akışı', () => {
  it('fiyat eğrisi: T1-T2 ucuz, T3-T4 çok pahalı; max kademede null; değerler tasarımla birebir', () => {
    expect(economyConfig.character.tray.costs).toEqual([75, 150, 15_000, 60_000]);
    expect(charNextCost('tray', 0)).toBe(75);
    expect(charNextCost('tray', 3)).toBe(60_000);
    expect(charNextCost('tray', 4)).toBeNull(); // MAX
    expect(charNextCost('magnet', 2)).toBe(2_800);
    expect(charNextCost('magnet', 3)).toBeNull();
    expect(charNextCost('speed', 0)).toBe(400);
    expect(charMaxTier('tray')).toBe(4);
    expect(charMaxTier('magnet')).toBe(3);
    expect(charMaxTier('speed')).toBe(3);
    // Değer türeticileri (kademe → etkin değer).
    expect(attractRadiusFor(0)).toBeCloseTo(2.6);
    expect(attractRadiusFor(3)).toBeCloseTo(5.0);
    expect(playerSpeedFor(0)).toBeCloseTo(4.5);
    expect(playerSpeedFor(3)).toBeCloseTo(5.4); // tavan +%20 (bilinçli düşük)
    expect(charValue('speed', 99)).toBeCloseTo(5.4); // kelepçe
  });

  it('buyCharUpgrade: para yetmezse false; yeterliyse kademe+1, ₺ düşer, XP verir; max\'ta false', () => {
    useGame.getState().hardReset();
    expect(useGame.getState().charUpgrades).toEqual({ tray: 0, magnet: 0, speed: 0 });
    expect(useGame.getState().buyCharUpgrade('tray')).toBe(false); // cüzdan 0
    useGame.getState().addMoney(200);
    const xpBefore = useGame.getState().xp;
    expect(useGame.getState().buyCharUpgrade('tray')).toBe(true);
    const s = useGame.getState();
    expect(s.charUpgrades.tray).toBe(1);
    expect(s.wallet.toNumber()).toBe(125); // 200 - 75
    expect(s.xp).toBe(xpBefore + economyConfig.xp.perUpgrade);
    expect(charLevel(s.charUpgrades)).toBe(1);
    // Max kademede satın alma reddedilir.
    useGame.setState({ charUpgrades: { tray: 4, magnet: 0, speed: 0 } });
    useGame.getState().addMoney(1_000_000);
    expect(useGame.getState().buyCharUpgrade('tray')).toBe(false);
  });

  it('tepsi kapasitesi oyunda kademeden türetilir: yeni oyun 2 bardakla sınırlı, T1 sonrası 3', () => {
    useGame.getState().hardReset();
    // Ocakta 5 hazır çay olsun; oyuncu ocağa yaklaşsın → tepsiye EN FAZLA kapasite kadar alır.
    const st = LAYOUT.stations[0];
    useGame.setState({
      readyCupsByZone: [5, 0], cleanCups: 10,
      player: [st[0] + 1.0, 0.6, st[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0],
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().tray).toBe(2); // kapasite 2 (tier 0)
    // T1 alınca kapasite 3 → kalan çaydan 1 daha alınabilir.
    useGame.setState({ charUpgrades: { tray: 1, magnet: 0, speed: 0 } });
    useGame.getState().tick(0.1);
    expect(useGame.getState().tray).toBe(3);
  });

  it('charStat görevi: q_charTray1 tepsi T1 alınınca tamamlanır; kamera odağı SIÇRAMAZ (3D hedef yok)', () => {
    useGame.getState().hardReset();
    const idx = economyConfig.quests.findIndex((q) => q.id === 'q_charTray1');
    expect(idx).toBeGreaterThan(economyConfig.quests.findIndex((q) => q.id === 'q_table2')); // table2 SONRASI
    expect(idx).toBeLessThan(economyConfig.quests.findIndex((q) => q.id === 'q_serve5')); // q_serve5 ÖNCESİ
    useGame.setState({ questIndex: idx, questBase: 0, camFocus: null });
    // charStat görevinin dünya konumu yok → focusQuest no-op (kamera sıçramaz).
    useGame.getState().focusQuest();
    expect(useGame.getState().camFocus).toBeNull();
    expect(questFocusPos({ type: 'charStat', stat: 'tray', tier: 1 }, [], 1)).toBeNull();
    // Satın al → bir sonraki tick görevi tamamlar, hat ilerler.
    useGame.getState().addMoney(200);
    expect(useGame.getState().buyCharUpgrade('tray')).toBe(true);
    useGame.getState().tick(0.1);
    expect(useGame.getState().questIndex).toBeGreaterThan(idx);
    expect(useGame.getState().quest?.id).toBe('q_serve5');
  });

  it('görev zamanlaması (kullanıcı: "aşırı önemli"): charTray2 q_table3→q_waiter arası; charMagnet q_table4→q_waiterL2 arası; T3/T4 ve hız görevsiz', () => {
    const ids = economyConfig.quests.map((q) => q.id);
    const between = (a: string, x: string, b: string) =>
      ids.indexOf(a) < ids.indexOf(x) && ids.indexOf(x) < ids.indexOf(b);
    expect(between('q_table2', 'q_charTray1', 'q_serve5')).toBe(true);
    expect(between('q_table3', 'q_charTray2', 'q_waiter')).toBe(true);
    expect(between('q_table4', 'q_charMagnet', 'q_waiterL2')).toBe(true);
    // T3/T4 ve hız için görev YOK (bilinçli — "çok zor" hedefler görevle dayatılmaz).
    const charQuests = economyConfig.quests.filter((q) => q.target.type === 'charStat');
    expect(charQuests.length).toBe(3);
    expect(charQuests.some((q) => q.target.type === 'charStat' && q.target.stat === 'speed')).toBe(false);
    expect(
      charQuests.some((q) => q.target.type === 'charStat' && q.target.stat === 'tray' && q.target.tier > 2),
    ).toBe(false);
  });

  it('kayıt v19→v20: T2 hediye + charPanelSeen false + questIndex İD-EŞLEMELİ (aktif görev korunur)', () => {
    // Aktif görev q_serve5 (eski index 4) olan v19 kaydı → yeni listede q_serve5 index 5'e kayar.
    const m = migrate({
      saveVersion: 19, wallet: '100', diamonds: '0', lifetime: '300',
      stationLevels: [1], waiterLevels: [0], padsDone: ['table2'], padFills: {},
      tableLevels: [0, 0, 0, 0], stats: { ...defaultStats(), teasServed: 3 }, questIndex: 4, questBase: 1,
      xp: 50, settings: { sound: true, music: true, notifications: true },
      floorThemeByZone: [], wallThemeByZone: [], ownedCosmetics: [], lastSaved: Date.now(),
    });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.charUpgrades).toEqual({ tray: 2, magnet: 0, speed: 0 }); // hediye → kapasite 4 korunur
    expect(m.charPanelSeen).toBe(false);
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_serve5'); // id korunur (index 4→5)
    // Hat bitmiş v19 kaydı → yeni hatta da bitmiş (yeni görevler dayatılmaz).
    const m2 = migrate({
      saveVersion: 19, wallet: '0', diamonds: '0', lifetime: '99999',
      stationLevels: [4, 4], waiterLevels: [1, 1],
      padsDone: ['table2', 'table3', 'waiter', 'dishwasher', 'table4', 'zone2', 'z2table2', 'z2waiter', 'z2table3', 'z2dishwasher', 'z2table4'],
      padFills: {}, tableLevels: [], stats: defaultStats(), questIndex: 20, questBase: 0,
      xp: 0, settings: { sound: true, music: true, notifications: true },
      floorThemeByZone: [], wallThemeByZone: [], ownedCosmetics: [], lastSaved: Date.now(),
    });
    expect(m2.questIndex).toBe(economyConfig.quests.length);
    // Bozuk/aşırı kademe max'a kelepçelenir.
    const m3 = migrate({ ...m, saveVersion: 20, charUpgrades: { tray: 99, magnet: -5, speed: 2 } } as unknown as Record<string, unknown>);
    expect(m3.charUpgrades).toEqual({ tray: charMaxTier('tray'), magnet: 0, speed: 2 });
  });

  it('yeni oyun tepsi 2 başlar (trayCapacityFor 0) — eski "sabit 4" değişti', () => {
    const d = defaultSave();
    expect(d.charUpgrades).toEqual({ tray: 0, magnet: 0, speed: 0 });
    expect(trayCapacityFor(d.charUpgrades.tray)).toBe(2);
    expect(d.charPanelSeen).toBe(false);
  });
});

describe('zone-2 yükseltme gating (v21) — zone-1 deseni aynalanır (önce kapasite, sonra verim)', () => {
  const Z1_FULL = ['table2', 'table3', 'waiter', 'dishwasher', 'table4'];
  const g = (padsDone: string[], extra: Partial<GateLike> = {}) => ({
    padsDone, tables: 0, stationLevel: 0, lifetime: 0, ...extra,
  });
  type GateLike = {
    padsDone: string[]; tables: number; stationLevel: number; lifetime: number;
    waiterServed?: number; waiterServedByZone?: number[];
  };

  it('z2 ocak yükseltmesi: salon açılır açılmaz DEĞİL, z2 2. masası açılınca belirir (z1: table2 deseni)', () => {
    expect(upgradeZoneUnlockedZ(1, g([...Z1_FULL, 'zone2']))).toBe(false); // salon yeni açıldı → kapalı
    expect(upgradeZoneUnlockedZ(1, g([...Z1_FULL, 'zone2', 'z2table2']))).toBe(true);
    // Zone-1 davranışı değişmedi.
    expect(upgradeZoneUnlockedZ(0, g([]))).toBe(false);
    expect(upgradeZoneUnlockedZ(0, g(['table2']))).toBe(true);
  });

  it('z2 masa yükseltmeleri: o salonun 4 masası da açılınca belirir (z1: table4 deseni)', () => {
    const half = [...Z1_FULL, 'zone2', 'z2table2', 'z2waiter', 'z2table3'];
    expect(tableUpgradeUnlockedZ(0, g(Z1_FULL))).toBe(true); // z1 dolu → z1 masaları açık
    expect(tableUpgradeUnlockedZ(1, g(half))).toBe(false); // z2 henüz dolu değil → z2 masaları kilitli
    expect(tableUpgradeUnlockedZ(1, g([...half, 'z2dishwasher', 'z2table4']))).toBe(true);
  });

  it('z2 garson hızlandırma: KENDİ garsonu 20 taşımadan belirmez (global sayaç z1den dolu olsa bile)', () => {
    const pads = [...Z1_FULL, 'zone2', 'z2table2', 'z2waiter'];
    // Global 99 ama z2 garsonu daha 5 taşıdı → kapalı (eski bug: tutar tutmaz beliriyordu).
    expect(waiterUpgradeUnlockedZ(1, g(pads, { waiterServed: 99, waiterServedByZone: [99, 5] }), 0)).toBe(false);
    expect(waiterUpgradeUnlockedZ(1, g(pads, { waiterServed: 99, waiterServedByZone: [99, 20] }), 0)).toBe(true);
    // z1 geri-uyum: global sayaç yeterli (eski kayıt/dev kancası).
    expect(waiterUpgradeUnlockedZ(0, g(pads, { waiterServed: 20 }), 0)).toBe(true);
  });

  it('tick z2 garson taşımasını KENDİ zone sayacına yazar', () => {
    useGame.getState().hardReset();
    const before = useGame.getState().stats.waiterServedByZone.slice();
    // z1 garsonuna bir teslimat yaptır: garson tepside 1 çay + bekleyen müşteri masada.
    useGame.setState({
      padsDone: ['table2', 'table3', 'waiter'],
      waiters: [{ pos: [...LAYOUT.tables[0].table] as [number, number, number], tray: 1 }, null],
      npcs: [{ id: 1, state: 'waitingForTea', pos: [...LAYOUT.tables[0].seat] as [number, number, number], tableIndex: 0, seatIndex: 0, timer: 18, color: '#fff' }],
      spawnTimer: 999, player: [0, 0.6, 4], inputKeyboard: [0, 0], inputJoystick: [0, 0],
    });
    for (let i = 0; i < 30 && useGame.getState().stats.waiterServed === 0; i++) useGame.getState().tick(0.1);
    const st = useGame.getState().stats;
    expect(st.waiterServed).toBe(1);
    expect(st.waiterServedByZone[0] ?? 0).toBe((before[0] ?? 0) + 1);
    expect(st.waiterServedByZone[1] ?? 0).toBe(0);
  });

  it('kayıt v20→v21: zone-başı sayaç tohumlanır (global→z1; z2waiter tutulmuşsa eşik, değilse 0)', () => {
    const base = {
      saveVersion: 20, wallet: '0', diamonds: '0', lifetime: '5000',
      stationLevels: [3, 0], waiterLevels: [0, 0], padFills: {}, tableLevels: [],
      stats: { ...defaultStats(), waiterServed: 50 }, questIndex: 0, questBase: 0, xp: 0,
      settings: { sound: true, music: true, notifications: true },
      floorThemeByZone: [], wallThemeByZone: [], ownedCosmetics: [],
      charUpgrades: { tray: 2, magnet: 0, speed: 0 }, charPanelSeen: false, lastSaved: Date.now(),
    };
    const m1 = migrate({ ...base, padsDone: ['table2', 'waiter'] } as unknown as Record<string, unknown>);
    expect(m1.stats.waiterServedByZone).toEqual([50, 0]); // z2 garsonu yok → sıfırdan sayar
    const m2 = migrate({
      ...base,
      padsDone: ['table2', 'table3', 'waiter', 'dishwasher', 'table4', 'zone2', 'z2table2', 'z2waiter'],
    } as unknown as Record<string, unknown>);
    // z2 garsonu zaten tutulmuş → bugün görünür olan hızlandırma işareti yarın kaybolmasın (eşik tohumu).
    expect(m2.stats.waiterServedByZone).toEqual([50, economyConfig.waiter.upgradeRequires.minWaiterServed]);
  });
});

describe('görev sırası v22 — q_zone2 yükseltme görevlerinden ÖNCE + v21→v22 migrasyonu', () => {
  const qi = (id: string) => economyConfig.quests.findIndex((q) => q.id === id);

  it('sıra (v23 rev.): q_charMagnet → q_zone2 → q_z2serve → q_waiterL2 → q_tableL2 (önce yeni salonu yaşa)', () => {
    expect(qi('q_zone2')).toBeGreaterThan(qi('q_charMagnet'));
    expect(qi('q_z2serve')).toBe(qi('q_zone2') + 1); // salon açılır açılmaz görev ORADA (kamera çelişkisi yok)
    expect(qi('q_z2serve')).toBeLessThan(qi('q_waiterL2'));
    expect(qi('q_waiterL2')).toBeLessThan(qi('q_tableL2'));
    expect(qi('q_tableL2')).toBeLessThan(qi('q_z2table2'));
  });

  function v21Save(questIndex: number, padsDone: string[]) {
    return {
      saveVersion: 21, wallet: '0', diamonds: '0', lifetime: '9000',
      stationLevels: [3, 0], waiterLevels: [0, 0], padFills: {}, tableLevels: [],
      padsDone,
      stats: { ...defaultStats(), waiterServed: 50, waiterServedByZone: [50, 0] },
      questIndex, questBase: 0, xp: 0,
      settings: { sound: true, music: true, notifications: true },
      floorThemeByZone: [], wallThemeByZone: [], ownedCosmetics: [],
      charUpgrades: { tray: 2, magnet: 0, speed: 0 }, charPanelSeen: true, lastSaved: Date.now(),
    } as unknown as Record<string, unknown>;
  }

  it('v21 kaydı q_waiterL2 aktifken (eski index 14, zone2 alınmamış) → q_zone2 aktif olur (hat kilitlenmez)', () => {
    // Eski v21 sırasında 14 = q_waiterL2; zone2 padsDone'da YOK → düz İD-eşleme q_zone2 görevini
    // atlardı ve hat q_z2serve'de (zone-2'siz) kilitlenirdi. Güvenlik kelepçesi q_zone2'ye çeker.
    const m = migrate(v21Save(14, ['table2', 'table3', 'waiter', 'dishwasher', 'table4']));
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_zone2');
  });

  it('v21 kaydı zone-2 zincirindeyken (zone2 alınmış) → aynı görev İD-eşlenir, geri çekilmez', () => {
    const oldIdx = 18; // eski v21 sırasında 18 = q_z2table2
    const m = migrate(v21Save(oldIdx, ['table2', 'table3', 'waiter', 'dishwasher', 'table4', 'zone2']));
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_z2table2');
  });

  it('v20-ÖNCESİ giriş (v19) çifte eşlenmez: v20 adımı güncel listeye eşler, v22 yalnız kelepçe uygular', () => {
    // v19 kaydında charStat görevleri yok; eski v19 sırasında 11 = q_waiterL2. zone2 alınmamış →
    // v20 adımı güncel listede q_waiterL2'ye eşler, v22 kelepçesi q_zone2'ye çeker.
    const m = migrate({
      saveVersion: 19, wallet: '0', diamonds: '0', lifetime: '9000',
      stationLevels: [3, 0], waiterLevels: [0, 0], padFills: {}, tableLevels: [],
      padsDone: ['table2', 'table3', 'waiter', 'dishwasher', 'table4'],
      stats: { ...defaultStats(), waiterServed: 50 }, questIndex: 11, questBase: 0, xp: 0,
      settings: { sound: true, music: true, notifications: true },
      floorThemeByZone: [], wallThemeByZone: [], ownedCosmetics: [], lastSaved: Date.now(),
    } as unknown as Record<string, unknown>);
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_zone2');
  });
});

describe('görev senkronu v23 — q_z2serve öne + zone-başı servis sayacı + v22→v23 migrasyonu', () => {
  function v22Save(questIndex: number, padsDone: string[], extra: Record<string, unknown> = {}) {
    return {
      saveVersion: 22, wallet: '0', diamonds: '0', lifetime: '9000',
      stationLevels: [3, 0], waiterLevels: [0, 0], padFills: {}, tableLevels: [],
      padsDone,
      stats: { ...defaultStats(), teasServed: 40, waiterServed: 50, waiterServedByZone: [50, 0] },
      questIndex, questBase: 0, xp: 0,
      settings: { sound: true, music: true, notifications: true },
      floorThemeByZone: [], wallThemeByZone: [], ownedCosmetics: [],
      charUpgrades: { tray: 2, magnet: 0, speed: 0 }, charPanelSeen: true, lastSaved: Date.now(),
      ...extra,
    } as unknown as Record<string, unknown>;
  }
  const Z1_FULL = ['table2', 'table3', 'waiter', 'dishwasher', 'table4'];

  it('v22 kaydı q_waiterL2/q_tableL2 aktifken → q_z2serve aktif olur (görev sessizce atlanmaz)', () => {
    // Eski v22 sırasında 15 = q_waiterL2, 16 = q_tableL2 (zone2 ile z2serve ARASINDA kalıyorlardı).
    const m1 = migrate(v22Save(15, [...Z1_FULL, 'zone2']));
    expect(economyConfig.quests[m1.questIndex]?.id).toBe('q_z2serve');
    const m2 = migrate(v22Save(16, [...Z1_FULL, 'zone2']));
    expect(economyConfig.quests[m2.questIndex]?.id).toBe('q_z2serve');
  });

  it('v22 kaydı q_z2serve aktifken → İD korunur + questBase SIFIRLANIR (eski taban global sayaçtı)', () => {
    const m = migrate(v22Save(17, [...Z1_FULL, 'zone2'], { questBase: 35 }));
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_z2serve');
    expect(m.questBase).toBe(0); // yeni sayaç (z2=0) tabanı — 35 kalsa görev asla bitmezdi
  });

  it('v22→v23 stats: teasServedByZone tohumlanır (global→z1, z2=0); diğer İD-eşlemeler kayar', () => {
    const m = migrate(v22Save(12, Z1_FULL.slice(0, 4))); // eski 12 = q_table4
    expect(m.stats.teasServedByZone).toEqual([40, 0]);
    expect(economyConfig.quests[m.questIndex]?.id).toBe('q_table4');
  });

  it('zone\'lu serveTea sayacı: zone-1 servisi q_z2serve\'ü İLERLETMEZ, zone-2 servisi ilerletir', () => {
    const stats = { ...defaultStats(), teasServed: 99, teasServedByZone: [99, 0] };
    const target = { type: 'serveTea', count: 5, zone: 1 } as const;
    const ctx = {
      padsDone: [], stationLevel: 0, waiterLevel: 0, tableLevels: [], stats, questBase: 0,
      charUpgrades: { tray: 0, magnet: 0, speed: 0 },
    };
    expect(questCounterValue(target, stats)).toBe(0); // global 99 SIZMAZ
    expect(questTargetMet(target, ctx)).toBe(false);
    stats.teasServedByZone[1] = 5;
    expect(questTargetMet(target, ctx)).toBe(true);
    // zone'suz hedef eski (global) davranışını korur.
    expect(questCounterValue({ type: 'serveTea', count: 5 }, stats)).toBe(99);
  });

  it('emptyTray (v23+Y1): çaylar atılır, bardaklar TEMİZ havuza döner (korunum); kirliler tepside kalır', () => {
    useGame.getState().hardReset();
    const before = useGame.getState().cleanCups;
    useGame.setState({ tray: 3, cleanCups: before - 3, carriedDirty: 1 });
    useGame.getState().emptyTray('tea');
    const s = useGame.getState();
    expect(s.tray).toBe(0);
    expect(s.cleanCups).toBe(before); // bardak korunumu: 3 bardak temiz rafa döndü
    expect(s.carriedDirty).toBe(1); // kirliler etkilenmez (onlar lavaboya gidiyor)
    // Tepsi boşken no-op.
    useGame.getState().emptyTray('tea');
    expect(useGame.getState().cleanCups).toBe(before);
  });

  it('trayTipSeen kayıt round-trip\'inde korunur (markTrayTipSeen → saveNow → init)', () => {
    // node test ortamında localStorage yok → geçici mock ile gerçek persistence'ı doğrula.
    const mem: Record<string, string> = {};
    const g = globalThis as Record<string, unknown>;
    const orig = g.localStorage;
    g.localStorage = {
      getItem: (k: string) => (k in mem ? mem[k] : null),
      setItem: (k: string, v: string) => { mem[k] = v; },
      removeItem: (k: string) => { delete mem[k]; },
    };
    try {
      useGame.getState().hardReset();
      expect(useGame.getState().trayTipSeen).toBe(false);
      useGame.getState().markTrayTipSeen();
      useGame.getState().init();
      expect(useGame.getState().trayTipSeen).toBe(true);
    } finally {
      g.localStorage = orig;
    }
  });

  it('STORE entegrasyon: oyuncunun z2 masasına el servisi teasServedByZone[1]\'i artırır', () => {
    useGame.getState().hardReset();
    const z2Table = 4; // zone-2 oto-masası (slot 4)
    useGame.setState({
      padsDone: [...Z1_FULL, 'zone2'],
      tray: 1,
      player: [LAYOUT.tables[z2Table].table[0], 0.6, LAYOUT.tables[z2Table].table[2]],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [
        { id: 970, state: 'waitingForTea', pos: [...LAYOUT.tables[z2Table].seat] as [number, number, number], tableIndex: z2Table, seatIndex: 0, timer: 999, color: '#27ae60' },
      ],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().stats.teasServedByZone[1]).toBe(1);
    expect(useGame.getState().stats.teasServedByZone[0] ?? 0).toBe(0);
  });
});

describe('M2 — 2×2 kat ızgarası (zone-3/4 altyapısı; arka sıra + geçitli duvar + union kelepçe)', () => {
  const Z1 = ['table2', 'table3', 'waiter', 'dishwasher', 'table4'];
  const Z2 = ['zone2', 'z2table2', 'z2waiter', 'z2table3', 'z2dishwasher', 'z2table4'];
  const Z3 = ['zone3', 'z3table2', 'z3waiter', 'z3table3', 'z3dishwasher', 'z3table4'];

  it('derivedFromPads: zone3 zinciri — zonesOpen artar, önceki zone\'lar DOLU kelepçesi genel', () => {
    const d3 = derivedFromPads([...Z1, ...Z2, 'zone3']);
    expect(d3.zonesOpen).toBe(3);
    expect(d3.stations).toBe(3);
    expect(d3.tablesByZone).toEqual([4, 4, 1]); // z3 oto 1. masa; z1/z2 yapısal dolu
    expect(d3.tables).toBe(9);
    const dFull = derivedFromPads([...Z1, ...Z2, ...Z3]);
    expect(dFull.zonesOpen).toBe(3);
    expect(dFull.tablesByZone).toEqual([4, 4, 4]);
    expect(dFull.tables).toBe(12);
  });

  it('STORE: zone-3 açık → müşteri sokaktan girip arka salona oturur (gerçek dt nav; z1↔z2 sınırı duvarsız)', () => {
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: [...Z1, ...Z2, 'zone3'],
      questIndex: economyConfig.quests.length,
      npcs: [],
      spawnTimer: 1e9, // test sırasında başka müşteri belirmesin (deterministik rota)
    });
    useGame.getState().tick(0.05);
    expect(useGame.getState().zonesOpen).toBe(3);
    expect(useGame.getState().tables).toBe(9);
    // zone-3'ün ilk masası (slot 8) için sokakta müşteri başlat.
    useGame.setState({
      npcs: [
        { id: 9001, state: 'toTable', pos: [...LAYOUT.streets[2]] as [number, number, number], tableIndex: 8, seatIndex: 0, timer: 0, color: '#fff' },
      ],
      spawnTimer: 1e9,
    });
    const dt = 1 / 60; // v23 dersi: nav regresyonları GERÇEK kare adımıyla test edilir
    let seated = false;
    for (let i = 0; i < 60 * 40 && !seated; i++) {
      useGame.getState().tick(dt);
      const n = useGame.getState().npcs.find((x) => x.id === 9001);
      if (!n) break; // vazgeçti = başarısızlık (seated false kalır)
      if (n.state === 'waitingForTea') seated = true;
    }
    expect(seated).toBe(true);
  });

  it('oyuncu union kelepçesi: arka sıra KAPALIYKEN girilmez; zone-3 açılınca sınır DUVARSIZ geçilir', () => {
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: [...Z1, ...Z2],
      questIndex: economyConfig.quests.length,
      npcs: [],
      spawnTimer: 1e9,
      player: [9.0, 0.6, -4.0] as [number, number, number],
      inputKeyboard: [0, -1],
    });
    for (let i = 0; i < 120; i++) useGame.getState().tick(1 / 60);
    expect(useGame.getState().player[2]).toBeGreaterThanOrEqual(LAYOUT.zoneAreas[1].minZ - 1e-6);
    // zone-3 açık: z1↔z2 sınırı tamamen duvarsız (2026-06-11) — her x hizasından arka salona yürünür.
    for (const x of [7.0, 11.9]) {
      useGame.setState({
        padsDone: [...Z1, ...Z2, 'zone3'],
        npcs: [],
        spawnTimer: 1e9,
        player: [x, 0.6, -4.0] as [number, number, number],
        inputKeyboard: [0, -1],
      });
      for (let i = 0; i < 240; i++) useGame.getState().tick(1 / 60);
      expect(useGame.getState().player[2]).toBeLessThan(-5.5);
    }
    // ... ve REZERV arka-sol arsa zone-3 açıkken bile KAPALI.
    useGame.setState({
      npcs: [],
      spawnTimer: 1e9,
      player: [1.6, 0.6, -4.0] as [number, number, number],
      inputKeyboard: [0, -1],
    });
    for (let i = 0; i < 120; i++) useGame.getState().tick(1 / 60);
    expect(useGame.getState().player[2]).toBeGreaterThanOrEqual(LAYOUT.zoneAreas[0].minZ - 1e-6);
    useGame.setState({ inputKeyboard: [0, 0] });
  });
});

describe('M3 — TOST ürün hattı (zone-3): trayFood, ürün fiyatı, tabak, görev append, maliyet çarpanı', () => {
  const Z1 = ['table2', 'table3', 'waiter', 'dishwasher', 'table4'];
  const Z2 = ['zone2', 'z2table2', 'z2waiter', 'z2table3', 'z2dishwasher', 'z2table4'];
  const OPEN3 = [...Z1, ...Z2, 'zone3'];

  it('görev hattı: zone-2 zincirinden sonra tost görevleri APPEND edildi (questIndex migrasyonsuz geçerli)', () => {
    const ids = economyConfig.quests.map((q) => q.id);
    const i = ids.indexOf('q_z2table4');
    expect(i).toBeGreaterThan(0);
    expect(ids.slice(i + 1)).toEqual([
      'q_zone3', 'q_z3serve', 'q_z3table2', 'q_z3waiter', 'q_z3table3', 'q_z3dish', 'q_z3table4',
    ]);
  });

  it('tost istasyonundan alınan ürün trayFood\'a gider; tost müşterisi ÇAYLA doyurulamaz, tostla doyar', () => {
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: [...OPEN3],
      questIndex: economyConfig.quests.length,
      npcs: [],
      spawnTimer: 1e9,
      tray: 0, trayFood: 0, carriedDirty: 0,
    });
    useGame.getState().tick(0.05); // türetme otursun
    const ready = useGame.getState().readyCupsByZone.slice();
    ready[2] = 2;
    const st = LAYOUT.stations[2];
    useGame.setState({ readyCupsByZone: ready, player: [st[0], 0.6, st[2]], npcs: [], spawnTimer: 1e9 });
    useGame.getState().tick(0.05);
    expect(useGame.getState().trayFood).toBeGreaterThan(0); // tost trayFood'a gitti
    expect(useGame.getState().tray).toBe(0);
    // tost masasında bekleyen müşteri: çayla servis OLMAZ, tostla OLUR.
    const t8 = LAYOUT.tables[8];
    useGame.setState({
      npcs: [{ id: 5, state: 'waitingForTea', pos: [...t8.seat] as [number, number, number], tableIndex: 8, seatIndex: 0, timer: 999, color: '#fff' }],
      tray: 1, trayFood: 0,
      player: [t8.table[0], 0.6, t8.table[2] + 0.9],
      spawnTimer: 1e9,
    });
    useGame.getState().tick(0.05);
    expect(useGame.getState().npcs[0].state).toBe('waitingForTea'); // çay tost yerine geçmedi
    useGame.setState({ trayFood: 1 });
    useGame.getState().tick(0.05);
    expect(useGame.getState().npcs[0].state).toBe('drinking');
    expect(useGame.getState().trayFood).toBe(0);
    expect(useGame.getState().tray).toBe(1); // çaya dokunulmadı
    expect(useGame.getState().stats.teasServedByZone[2]).toBe(1); // zone'lu görev sayacı tost'u sayar
  });

  it('tost müşterisi ÜRÜN fiyatı öder (25 + bahşiş 0) ve kirli TABAK bırakır', () => {
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: [...OPEN3],
      questIndex: economyConfig.quests.length, // q_wash geçildi → kirli bırakılır
      npcs: [{ id: 7, state: 'drinking', pos: [...LAYOUT.tables[8].seat] as [number, number, number], tableIndex: 8, seatIndex: 0, timer: 0.02, color: '#fff' }],
      spawnTimer: 1e9,
      player: [0, 0.6, 4.5],
    });
    useGame.getState().tick(0.1);
    const s = useGame.getState();
    expect(s.coins.length).toBe(1);
    expect(s.coins[0].value).toBe(25); // PRODUCTS.tost.price (masa L0 → bahşiş yok)
    expect(s.dishes.length).toBe(1);
    expect(s.dishes[0].kind).toBe('plate');
  });

  it('stationUpgradeCostZ: tost tezgâhı çay eğrisi × upgradeCostMult; çay zone\'ları çarpansız', () => {
    expect(stationUpgradeCostZ(2, 0)).toBe(stationUpgradeCost(0) * 20);
    expect(stationUpgradeCostZ(0, 0)).toBe(stationUpgradeCost(0));
    expect(stationUpgradeCostZ(1, 0)).toBe(stationUpgradeCost(0)); // z1 çay salonu çarpansız
  });

  it('emptyTray (Y1): çay ve tost AYRI boşaltılır (kind) — kaplar ortak temiz havuza döner, kirliler kalır', () => {
    useGame.getState().hardReset();
    const clean0 = useGame.getState().cleanCups;
    useGame.setState({ tray: 1, trayFood: 2, carriedDirty: 1 });
    // Önce yalnız TOSTLAR bırakılır — çay tepside kalır.
    useGame.getState().emptyTray('food');
    let s = useGame.getState();
    expect(s.trayFood).toBe(0);
    expect(s.tray).toBe(1);
    expect(s.cleanCups).toBe(clean0 + 2);
    // Sonra çaylar — toplam korunum tamamlanır; kirli tepsiden inmez (lavaboya gidecek).
    useGame.getState().emptyTray('tea');
    s = useGame.getState();
    expect(s.tray).toBe(0);
    expect(s.carriedDirty).toBe(1);
    expect(s.cleanCups).toBe(clean0 + 3);
  });
});

describe('Y1 — yemek alanı kimliği: arka-duvar counter + dikdörtgen masa + zemin varsayılanı', () => {
  const FZ = 2; // tost salonu (zoneProduct(2)==='tost')

  it('tost tezgâhı ARKA duvara paralel: rot 0 (önü güneye), footprint uzun kenarı x\'te', () => {
    expect(LAYOUT.stationRots[FZ]).toBe(0);
    expect(LAYOUT.stationHalves[FZ][0]).toBeGreaterThan(LAYOUT.stationHalves[FZ][1]);
    // Çay zone'ları eski yan-duvar düzeninde kalır (uzun kenar z'de).
    expect(LAYOUT.stationHalves[0][1]).toBeGreaterThan(LAYOUT.stationHalves[0][0]);
    // Tezgâh zone alanının arka şeridinde (arka duvara yaslı), pickup ÖN yüzde (güneyinde).
    const st = LAYOUT.stations[FZ];
    const za = LAYOUT.zoneAreas[FZ];
    expect(st[2] - za.minZ).toBeLessThan(1.2);
    const pickup = LAYOUT.stationPickups[FZ];
    expect(pickup[2]).toBeGreaterThan(st[2]);
    expect(Math.abs(pickup[0] - st[0])).toBeLessThan(0.01);
  });

  it('z3dishwasher pad\'i counter footprint\'inin ve komşu dolum dairelerinin DIŞINDA', () => {
    const pad = LAYOUT.padPos.z3dishwasher;
    const st = LAYOUT.stations[FZ];
    // Pad merkezi tezgâh AABB'sinin dışında (eski konum [10.4,-14.8] içinde kalıyordu).
    const inside =
      Math.abs(pad[0] - st[0]) < LAYOUT.stationHalves[FZ][0] &&
      Math.abs(pad[2] - st[2]) < LAYOUT.stationHalves[FZ][1];
    expect(inside).toBe(false);
    // Yükseltme pad'iyle dolum daireleri kesişmez (2×PAD_RADIUS = 2.6 ayrımı korunur).
    const up = LAYOUT.upgradeZones[FZ];
    expect(Math.hypot(pad[0] - up[0], pad[2] - up[2])).toBeGreaterThanOrEqual(2.6);
  });

  it('yemek masası dikdörtgen (foodTableHalf) + oturma yeri G-BATI sandalyesiyle hizalı (x −0.35)', () => {
    expect(LAYOUT.foodTableHalf[0]).toBeGreaterThan(LAYOUT.foodTableHalf[1]);
    for (let i = FZ * 4; i < FZ * 4 + 4; i++) {
      const t = LAYOUT.tables[i];
      expect(t.seat[0] - t.table[0]).toBeCloseTo(-0.35, 5);
      expect(t.seat[2] - t.table[2]).toBeCloseTo(0.78, 5);
    }
    // Çay masalarının oturma yeri masa merkezinin tam güneyinde kalır.
    expect(LAYOUT.tables[0].seat[0]).toBeCloseTo(LAYOUT.tables[0].table[0], 5);
  });

  it('garson, evinden tost pickup\'ına nav ile ulaşır (counter taşınınca rota kopmadı)', () => {
    useGame.getState().hardReset();
    const OPEN3 = ['table2', 'table3', 'waiter', 'dishwasher', 'table4',
      'zone2', 'z2table2', 'z2waiter', 'z2table3', 'z2dishwasher', 'z2table4', 'zone3',
      'z3table2', 'z3table3', 'z3table4'];
    useGame.setState({ padsDone: [...OPEN3], questIndex: economyConfig.quests.length });
    useGame.getState().tick(0.05); // türetilen sayılar otursun (12 masa, 3 zone)
    const solids = [
      ...Array.from({ length: 3 }, (_, z) => ({ c: LAYOUT.stations[z], h: LAYOUT.stationHalves[z] })),
      ...Array.from({ length: 3 }, (_, z) => ({ c: LAYOUT.dishStations[z], h: LAYOUT.dishHalf })),
      ...LAYOUT.tables.map((t, i) => ({
        c: t.table,
        h: i >= FZ * 4 ? LAYOUT.foodTableHalf : LAYOUT.tableHalf,
      })),
    ];
    const grid = buildNavGrid(LAYOUT.area, 0.3, solids, LAYOUT.actorRadius);
    const home = LAYOUT.waiterHomes[FZ];
    const pickup = LAYOUT.stationPickups[FZ];
    expect(findNavPath(grid, [...home] as [number, number, number], pickup[0], pickup[2], 0.45)).not.toBeNull();
    // Pickup'tan tost salonunun her masasına da rota var.
    for (let i = FZ * 4; i < FZ * 4 + 4; i++) {
      const t = LAYOUT.tables[i].table;
      expect(findNavPath(grid, [...pickup] as [number, number, number], t[0], t[2], 1.5)).not.toBeNull();
    }
  });

  it('kayıt v25→v26: z2 zemini eski varsayılandan (\'parke\') \'yemek\'e geçer; satın alınan tema KORUNUR', () => {
    const base = {
      saveVersion: 25, wallet: '100', diamonds: '0', lifetime: '5000',
      stationLevels: [3, 0, 0], waiterLevels: [1, 0, 0], padsDone: ['table2'], padFills: {},
      tableLevels: [1, 0, 0, 0], stats: defaultStats(), questIndex: 3, questBase: 0,
      xp: 100, settings: { sound: true, music: true, notifications: true },
      wallThemeByZone: [], ownedCosmetics: [], charUpgrades: { tray: 2, magnet: 0, speed: 0 },
      charPanelSeen: false, trayTipSeen: false, lastSaved: Date.now(),
    };
    // Eski varsayılan ('parke') → tasarlanan kimlik kazanır.
    const m1 = migrate({ ...base, floorThemeByZone: ['parke', 'parke', 'parke'] });
    expect(m1.floorThemeByZone).toEqual(['parke', 'parke', 'yemek']);
    // Oyuncunun bilinçli uyguladığı satın-alma teması korunur.
    const m2 = migrate({ ...base, floorThemeByZone: ['dama', 'parke', 'dama'] });
    expect(m2.floorThemeByZone).toEqual(['dama', 'parke', 'dama']);
    // Çay zone'larının başlangıç durumu değişmez; cüzdan/ilerleme dokunulmaz.
    expect(m1.wallet).toBe('100');
    expect(m1.questIndex).toBe(3);
  });

  it('yeni oyun: tost salonu \'yemek\' zeminiyle doğar; \'yemek\' teması mağazada ücretsiz', () => {
    useGame.getState().hardReset();
    expect(useGame.getState().floorThemeByZone).toEqual(['parke', 'parke', 'yemek']);
    const t = economyConfig.cosmetics.floorThemes.find((x) => x.id === 'yemek');
    expect(t).toBeTruthy();
    expect(t!.cost).toBe(0);
  });
});

describe('M3 — müşteri tavanı masalarla ölçeklenir (arka salon açlığı fix)', () => {
  it('9+ masada 8 müşteri tavanı aşılır: ön masalar doluyken tost salonuna müşteri DOĞAR', () => {
    const OPEN3 = ['table2', 'table3', 'waiter', 'dishwasher', 'table4',
      'zone2', 'z2table2', 'z2waiter', 'z2table3', 'z2dishwasher', 'z2table4', 'zone3'];
    useGame.getState().hardReset();
    useGame.setState({ padsDone: [...OPEN3], questIndex: economyConfig.quests.length });
    useGame.getState().tick(0.05);
    // Ön 8 masayı oturan müşteriyle doldur (eski tavan 8'i tüketir).
    const sitters = Array.from({ length: 8 }, (_, i) => ({
      id: 8000 + i,
      state: 'waitingForTea' as const,
      pos: [...LAYOUT.tables[i].seat] as [number, number, number],
      tableIndex: i,
      seatIndex: 0,
      timer: 999,
      color: '#fff',
    }));
    useGame.setState({ npcs: sitters, spawnTimer: 0, player: [0, 0.6, 4.5] });
    useGame.getState().tick(0.1); // spawn denemesi
    const s = useGame.getState();
    const newcomer = s.npcs.find((n) => n.id < 8000 || n.id > 8007);
    expect(newcomer).toBeTruthy(); // 9. müşteri doğdu (eski sabit tavanda doğmazdı)
    expect(newcomer!.tableIndex).toBe(8); // hedefi tost salonunun ilk masası
  });
});

describe('Y2 — koltuk + grup sistemi (plan §2)', () => {
  it('koltuk sayısı masa seviyesinden türetilir: 1/2/2/4/4 + kelepçe', () => {
    expect(economyConfig.tables.seatsByLevel).toEqual([1, 2, 2, 4, 4]);
    expect([0, 1, 2, 3, 4].map(tableSeats)).toEqual([1, 2, 2, 4, 4]);
    expect(tableSeats(9)).toBe(4); // aşırı seviye son değere kelepçelenir
    expect(tableSeats(-1)).toBe(1);
  });

  it('grup zarı deterministik: %30→1, %35→2, %20→3, %15→4 (sınır değerleriyle)', () => {
    expect(economyConfig.npc.groupChances).toEqual([0.3, 0.35, 0.2, 0.15]);
    expect(rollGroupSize(0)).toBe(1);
    expect(rollGroupSize(0.299)).toBe(1);
    expect(rollGroupSize(0.3)).toBe(2);
    expect(rollGroupSize(0.649)).toBe(2);
    expect(rollGroupSize(0.65)).toBe(3);
    expect(rollGroupSize(0.849)).toBe(3);
    expect(rollGroupSize(0.85)).toBe(4);
    expect(rollGroupSize(0.999)).toBe(4);
  });

  it('koltuk pozisyonları: seats[0] eski .seat ile birebir; çay masası 4 yana, yemek masası 2+2 karşılıklı', () => {
    for (const t of LAYOUT.tables) {
      expect(t.seats).toHaveLength(4);
      expect(t.seats[0]).toEqual(t.seat);
    }
    // Çay masası 0: S/N/E/W ofsetleri. Yemek masası 8 (z2): karşılıklı çiftler (G-batı/K-batı, G-doğu/K-doğu).
    const expectOffsets = (ti: number, want: [number, number][]) => {
      const t = LAYOUT.tables[ti];
      t.seats.forEach((s, k) => {
        expect(s[0] - t.table[0]).toBeCloseTo(want[k][0], 6);
        expect(s[2] - t.table[2]).toBeCloseTo(want[k][1], 6);
      });
    };
    expectOffsets(0, [[0, 0.78], [0, -0.78], [0.78, 0], [-0.78, 0]]);
    expectOffsets(8, [[-0.35, 0.78], [-0.35, -0.78], [0.35, 0.78], [0.35, -0.78]]);
  });

  it('grup spawn: L3 masada (4 koltuk) 4 kişilik grup AYNI masaya FARKLI koltuklarla doğar', () => {
    useGame.getState().hardReset();
    useGame.setState({ tableLevels: [3, 0, 0, 0], spawnTimer: 0, player: [5.2, 0.6, -5.2] });
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.99); // zar → 4 kişilik grup
    try {
      useGame.getState().tick(0.05);
    } finally {
      rnd.mockRestore();
    }
    const npcs = useGame.getState().npcs;
    expect(npcs).toHaveLength(4);
    expect(npcs.every((n) => n.tableIndex === 0)).toBe(true);
    expect(new Set(npcs.map((n) => n.seatIndex))).toEqual(new Set([0, 1, 2, 3]));
    // Sokakta hafif saçılmış (üst üste binmesin).
    const xs = new Set(npcs.map((n) => n.pos[0].toFixed(2)));
    expect(xs.size).toBe(4);
  });

  it("koltuk yetmezse grup KÜÇÜLÜR: L1 masada (2 koltuk) 4'lük zar 2 kişi doğurur", () => {
    useGame.getState().hardReset();
    useGame.setState({ tableLevels: [1, 0, 0, 0], spawnTimer: 0, player: [5.2, 0.6, -5.2] });
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    try {
      useGame.getState().tick(0.05);
    } finally {
      rnd.mockRestore();
    }
    const npcs = useGame.getState().npcs;
    expect(npcs).toHaveLength(2);
    expect(new Set(npcs.map((n) => n.seatIndex))).toEqual(new Set([0, 1]));
  });

  it('müşteri tavanı KOLTUK+2: 16 koltuk doluyken +2 taşma sonrası spawn durur; boş koltuk atlanarak atanır', () => {
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: ['table2', 'table3', 'table4'],
      tableLevels: [4, 4, 4, 4], // 4 masa × 4 koltuk = 16; tavan = 18
      questIndex: economyConfig.quests.length,
      player: [5.2, 0.6, -5.2],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
    });
    // 15 oturan (masa 3'ün 3. koltuğu + 1 koltuk daha boş) + 2 yürüyen = 17 aktif → tavana 1 yer.
    const sitters = [];
    let id = 7000;
    for (let t = 0; t < 4; t++) {
      for (let k = 0; k < 4; k++) {
        if (t === 3 && (k === 3 || k === 2)) continue; // masa 3'te 2 koltuk boş
        const seat = LAYOUT.tables[t].seats[k];
        sitters.push({
          id: id++, state: 'waitingForTea' as const, pos: [...seat] as [number, number, number],
          tableIndex: t, seatIndex: k, timer: 999, color: '#fff',
        });
      }
    }
    // 2 de yolda (toTable, masa 3 koltuk 2'ye atanmış + ekstra biri koltuk 3'e) → aktif 16.
    sitters.push({
      id: id++, state: 'toTable' as const, pos: [...LAYOUT.streets[0]] as [number, number, number],
      tableIndex: 3, seatIndex: 2, timer: 0, color: '#fff',
    });
    sitters.push({
      id: id++, state: 'toTable' as const, pos: [...LAYOUT.streets[0]] as [number, number, number],
      tableIndex: 3, seatIndex: 3, timer: 0, color: '#fff',
    });
    useGame.setState({ npcs: sitters, spawnTimer: 0 });
    expect(useGame.getState().npcs.filter((n) => n.state !== 'leaving')).toHaveLength(16);
    // Koltuklar TAM dolu (16/16) ama tavan 18 → boş koltuk yok → spawn OLMAZ.
    useGame.getState().tick(0.05);
    expect(useGame.getState().npcs.filter((n) => n.state !== 'leaving')).toHaveLength(16);
    // Bir koltuk boşalt (masa 3 koltuk 3 yolcusu gider) → 15 aktif → spawn 1 kişi, KOLTUK 3'e (atlanarak).
    useGame.setState({
      npcs: useGame.getState().npcs.filter((n) => !(n.tableIndex === 3 && n.seatIndex === 3)),
      spawnTimer: 0,
    });
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.99); // 4'lük zar bile 1'e kelepçelenir
    try {
      useGame.getState().tick(0.05);
    } finally {
      rnd.mockRestore();
    }
    const active = useGame.getState().npcs.filter((n) => n.state !== 'leaving');
    expect(active).toHaveLength(16);
    const newcomer = active.find((n) => n.id < 7000);
    expect(newcomer).toBeTruthy();
    expect(newcomer!.tableIndex).toBe(3);
    expect(newcomer!.seatIndex).toBe(3); // dolu koltuklar atlandı
  });

  it('kirli eşik koltukla ölçeklenir: L3 masada (4 koltuk) 8 kap temiz, 9 kap kirli; L0 eski davranış (>2)', () => {
    const T = economyConfig.cups.dirtyThreshold;
    const dishOn = (idx: number, id: number) => ({
      id, pos: [0, 0.95, 0] as [number, number, number], tableIndex: idx,
    });
    // L3 (4 koltuk): eşik = 2×4 = 8.
    const eight = Array.from({ length: T * 4 }, (_, i) => dishOn(0, 100 + i));
    expect(dirtyTables(eight, [3]).has(0)).toBe(false);
    const nine = Array.from({ length: T * 4 + 1 }, (_, i) => dishOn(0, 200 + i));
    expect(dirtyTables(nine, [3]).has(0)).toBe(true);
    // L0 (1 koltuk): eski eşik aynen (>2). Seviye verilmezse de L0 varsayılır.
    const three = Array.from({ length: T + 1 }, (_, i) => dishOn(0, 300 + i));
    expect(dirtyTables(three, [0]).has(0)).toBe(true);
    expect(dirtyTables(three).has(0)).toBe(true);
  });

  it('GERÇEK-DT (1/60): 2 kişilik grup sokaktan yürür, farklı koltuklara oturur, bireysel servis + bireysel ödeme', () => {
    useGame.getState().hardReset();
    useGame.setState({
      tableLevels: [1, 0, 0, 0], // 2 koltuk
      spawnTimer: 0,
      player: [5.2, 0.6, -5.2],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
    });
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.5); // zar → 2 kişilik grup
    try {
      useGame.getState().tick(1 / 60);
      const born = useGame.getState().npcs;
      expect(born).toHaveLength(2);
      // Gerçek kare adımıyla yürüyüp OTURMALILAR (sabır bitmeden; nav regresyonu).
      const dt = 1 / 60;
      for (let i = 0; i < 20 * 60 && !useGame.getState().npcs.every((n) => n.state === 'waitingForTea'); i++) {
        useGame.getState().tick(dt);
      }
      const seated = useGame.getState().npcs;
      expect(seated).toHaveLength(2);
      expect(seated.every((n) => n.state === 'waitingForTea')).toBe(true);
      // Farklı koltuklarda oturuyorlar (pozisyon = atanan koltuk).
      const t0 = LAYOUT.tables[0];
      for (const n of seated) {
        expect(n.pos[0]).toBeCloseTo(t0.seats[n.seatIndex][0], 5);
        expect(n.pos[2]).toBeCloseTo(t0.seats[n.seatIndex][2], 5);
      }
      expect(new Set(seated.map((n) => n.seatIndex)).size).toBe(2);
      // Oyuncu tepside 2 çayla masaya gelir → İKİSİNE de tek durakta servis.
      useGame.setState({ tray: 2, player: [t0.table[0], 0.6, t0.table[2] + 1.2] });
      useGame.getState().tick(dt);
      const drinking = useGame.getState().npcs;
      expect(drinking.every((n) => n.state === 'drinking')).toBe(true);
      expect(useGame.getState().tray).toBe(0);
      // İçince HER ÜYE bireysel öder (2 ayrı para; değer = çay + L1 bahşiş).
      useGame.setState({
        npcs: drinking.map((n) => ({ ...n, timer: 0.01 })),
        player: [5.2, 0.6, -5.2],
        coins: [],
      });
      useGame.getState().tick(dt);
      const coins = useGame.getState().coins;
      expect(coins).toHaveLength(2);
      for (const c of coins) expect(c.value).toBe(TEA_PRICE + tableTip(1));
    } finally {
      rnd.mockRestore();
    }
  });
});
