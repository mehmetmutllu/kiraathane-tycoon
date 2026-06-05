import { describe, it, expect } from 'vitest';
import {
  economyConfig,
  upgradeCost,
  upgradeOutputMultiplier,
} from '../src/config/economy.config';
import { D, fmt } from '../src/game/decimal';
import {
  useGame,
  LAYOUT,
  currentPad,
  stationSoftMaxLevel,
  stationUpgradeCost,
} from '../src/game/store';

// Sıradaki pad'i, oyuncuyu üstüne koyup para ekleyerek tamamlar; tamamlanan id'yi döner.
function completeCurrentPad(): string | null {
  const pad = currentPad(useGame.getState().padsDone);
  if (!pad) return null;
  const pos = LAYOUT.padPos[pad.id];
  useGame.getState().addMoney(pad.cost + 50);
  useGame.setState({ player: [pos[0], 0.6, pos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
  for (let i = 0; i < 400 && currentPad(useGame.getState().padsDone)?.id === pad.id; i++) {
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

describe('simülasyon — NPC tam yaşam döngüsü', () => {
  it('müşteri gelir, servis edilir ve para üretir', () => {
    useGame.getState().hardReset();
    expect(useGame.getState().tables).toBe(1);

    // ~50 sn simüle et (gel→otur→sipariş→iç→öde döngüsü ~13 sn)
    for (let i = 0; i < 500; i++) useGame.getState().tick(0.1);

    const s = useGame.getState();
    expect(s.npcCount).toBeGreaterThan(0);
    // Oyuncu masada değil → paralar yerde birikir (toplanmadı)
    expect(s.coins.length).toBeGreaterThan(0);
  });

  it('oyuncu parayı toplayınca cüzdan artar', () => {
    useGame.getState().hardReset();
    // bir müşteri ödeyene kadar ilerlet
    for (let i = 0; i < 200; i++) useGame.getState().tick(0.1);
    let s = useGame.getState();
    // bir coin oluştuysa oyuncuyu üstüne koy ve bir tick işlet
    if (s.coins.length > 0) {
      const c = s.coins[0];
      useGame.setState({ player: [c.pos[0], 0.6, c.pos[2]] });
      const before = useGame.getState().wallet.toNumber();
      useGame.getState().tick(0.1);
      const after = useGame.getState().wallet.toNumber();
      expect(after).toBeGreaterThan(before);
    }
    expect(s.lifetime.toNumber()).toBeGreaterThanOrEqual(0);
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

describe('generic pad sistemi (Faz 2b)', () => {
  it("pad'ler config sırasıyla açılır ve etkileri uygulanır", () => {
    useGame.getState().hardReset();
    expect(useGame.getState().tables).toBe(1);
    expect(currentPad([])?.id).toBe('table2');

    // 1) 2. Masa → tables 1→2
    expect(completeCurrentPad()).toBe('table2');
    expect(useGame.getState().tables).toBe(2);

    // 2) Yeni Çaydanlık Yeri → tables→3, stations→2
    expect(completeCurrentPad()).toBe('station2');
    expect(useGame.getState().tables).toBe(3);
    expect(useGame.getState().stations).toBe(2);

    // 3) Semavere Geçiş → servis hızı çarpanı 0.7
    expect(completeCurrentPad()).toBe('samovar');
    expect(useGame.getState().serviceSpeedMult).toBeCloseTo(0.7, 5);

    // Hepsi açıldı
    expect(useGame.getState().padsDone.length).toBe(3);
    expect(currentPad(useGame.getState().padsDone)).toBeNull();
  });
});
