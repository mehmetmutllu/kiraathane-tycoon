import { describe, it, expect } from 'vitest';
import {
  economyConfig,
  upgradeCost,
  upgradeOutputMultiplier,
  brewQueueCapacity,
} from '../src/config/economy.config';
import { D, fmt } from '../src/game/decimal';
import {
  useGame,
  LAYOUT,
  currentPad,
  nextStep,
  stationSoftMaxLevel,
  stationUpgradeCost,
  trayCapacity,
  TEA_PRICE,
  brewTime,
} from '../src/game/store';

// Mevcut ilerleme durumundan gating (requires) için GateState üretir.
function gate() {
  const s = useGame.getState();
  return { padsDone: s.padsDone, tables: s.tables, stationLevel: s.stationLevel, lifetime: s.lifetime.toNumber() };
}

// Sıradaki aktif pad'i, oyuncuyu üstüne koyup para ekleyerek tamamlar; tamamlanan id'yi döner.
function completeCurrentPad(): string | null {
  const pad = currentPad(gate());
  if (!pad) return null;
  const pos = LAYOUT.padPos[pad.id];
  useGame.getState().addMoney(pad.cost + 50);
  useGame.setState({ player: [pos[0], 0.6, pos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
  for (let i = 0; i < 400 && currentPad(gate())?.id === pad.id; i++) {
    useGame.getState().tick(0.1);
  }
  return pad.id;
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
    expect(s.readyCups).toBeGreaterThan(0);
    expect(s.readyCups).toBeLessThanOrEqual(brewQueueCapacity(s.stationLevel));
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
    expect(useGame.getState().readyCups).toBeGreaterThan(0);
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
    expect(useGame.getState().stationLevel).toBe(0);

    expect(useGame.getState().upgradeStation()).toBe(true);
    expect(useGame.getState().stationLevel).toBe(1);

    for (let i = 0; i < 10; i++) useGame.getState().upgradeStation();
    expect(useGame.getState().stationLevel).toBe(stationSoftMaxLevel());
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
    expect(useGame.getState().stationLevel).toBe(0);
  });
});

describe('generic pad sistemi + gating (Faz 2b / ekonomi v2)', () => {
  it("pad'ler önkoşul (requires) sırasıyla açılır ve etkileri uygulanır", () => {
    useGame.getState().hardReset();
    expect(useGame.getState().tables).toBe(1);
    // table2 minLifetime:30 ile kilitli — lifetime 0 iken aktif pad yok.
    expect(currentPad(gate())).toBeNull();
    useGame.getState().addMoney(50); // lifetime ≥ 30 → table2 açılır
    expect(currentPad(gate())?.id).toBe('table2');

    // 1) 2. Masa → tables 1→2
    expect(completeCurrentPad()).toBe('table2');
    expect(useGame.getState().tables).toBe(2);

    // table3 minStationLevel:1 ile kilitli → ocak yükseltilmeden pad yok
    expect(currentPad(gate())).toBeNull();
    useGame.getState().addMoney(1000);
    expect(useGame.getState().upgradeStation()).toBe(true);
    expect(useGame.getState().stationLevel).toBe(1);

    // 2) 3. Masa → tables 2→3 (artık açık)
    expect(currentPad(gate())?.id).toBe('table3');
    expect(completeCurrentPad()).toBe('table3');
    expect(useGame.getState().tables).toBe(3);

    // 3) Yeni Çay Ocağı → stations 1→2, servis hızı ×0.85
    expect(completeCurrentPad()).toBe('station2');
    expect(useGame.getState().stations).toBe(2);
    expect(useGame.getState().serviceSpeedMult).toBeCloseTo(0.85, 5);

    // 4) Semavere Geçiş → servis hızı ×0.7 (toplam 0.85*0.7)
    expect(completeCurrentPad()).toBe('samovar');
    expect(useGame.getState().serviceSpeedMult).toBeCloseTo(0.85 * 0.7, 5);

    // Hepsi açıldı
    expect(useGame.getState().padsDone.length).toBe(4);
    expect(currentPad(gate())).toBeNull();
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

  it('nextStep gating durumuna göre doğru yönlendirir', () => {
    // Başlangıç: table2 minLifetime:30 ile kilitli → "₺30 kazan" yönlendirmesi
    expect(nextStep({ padsDone: [], tables: 1, stationLevel: 0, lifetime: 0 })).toContain('30');
    // lifetime yeterli → sıradaki = 2. Masa
    expect(nextStep({ padsDone: [], tables: 1, stationLevel: 0, lifetime: 100 })).toContain('2. Masa');
    // table2 alındı, table3 minStationLevel:1 ile kilitli → ocak yükselt yönlendirmesi
    expect(nextStep({ padsDone: ['table2'], tables: 2, stationLevel: 0, lifetime: 200 })).toContain('ocağı');
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
    expect(useGame.getState().stationLevel).toBe(0);
  });

  it('table2 açıldıktan sonra noktada durunca seviye artar (activeZone kind=upgrade)', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    expect(completeCurrentPad()).toBe('table2'); // önkoşulu karşıla

    useGame.getState().addMoney(30); // L1 (25₺) yeter; max'a varmaz
    const z = LAYOUT.upgradeZone;
    useGame.setState({ player: [z[0], 0.6, z[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    const before = useGame.getState().stationLevel;

    for (let i = 0; i < 50; i++) useGame.getState().tick(0.1);

    expect(useGame.getState().stationLevel).toBeGreaterThan(before);
    expect(useGame.getState().activeZone?.kind).toBe('upgrade');
  });
});
