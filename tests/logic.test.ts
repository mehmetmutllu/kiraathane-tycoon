import { describe, it, expect } from 'vitest';
import {
  economyConfig,
  upgradeCost,
  upgradeOutputMultiplier,
  brewQueueCapacity,
  cupPoolCapacity,
  derivedFromPads,
} from '../src/config/economy.config';
import { D, fmt } from '../src/game/decimal';
import {
  useGame,
  LAYOUT,
  currentPad,
  availableOptionalPads,
  nextStep,
  stationSoftMaxLevel,
  stationUpgradeCost,
  trayCapacity,
  trayMaxLevel,
  trayNextCost,
  TEA_PRICE,
  brewTime,
} from '../src/game/store';
import { migrate, defaultSave } from '../src/game/save';

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

    // 3) 4. Masa → tables 3→4 (salon 1 ocak : 4 masa dolar; D-012). Tek ocak korunur.
    expect(completeCurrentPad()).toBe('table4');
    expect(useGame.getState().tables).toBe(4);
    expect(useGame.getState().stations).toBe(1);

    // 4) Semavere Geçiş → servis hızı ×0.7 (tek ocağın 4 masaya yetişme kapağı)
    expect(completeCurrentPad()).toBe('samovar');
    expect(useGame.getState().serviceSpeedMult).toBeCloseTo(0.7, 5);

    // Hepsi açıldı
    expect(useGame.getState().padsDone.length).toBe(4);
    expect(currentPad(gate())).toBeNull();
  });
});

// Bir opsiyonel pad'i (ör. garson) oyuncuyu üstüne koyup parayla tamamlar; başarılıysa true.
function completeOptionalPad(id: string): boolean {
  const pad = availableOptionalPads(gate()).find((p) => p.id === id);
  if (!pad) return false;
  const pos = LAYOUT.padPos[pad.id];
  useGame.getState().addMoney(pad.cost + 50);
  useGame.setState({ player: [pos[0], 0.6, pos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
  for (let i = 0; i < 400 && !useGame.getState().padsDone.includes(id); i++) useGame.getState().tick(0.1);
  return useGame.getState().padsDone.includes(id);
}

describe('garson — opsiyonel kısmi assist (Faz 2d / D-012)', () => {
  it("garson pad'i OPSİYONEL: alınmasa da omurga zinciri (sonraki masa) açılmaya devam eder", () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50); // lifetime ≥ 30 → table2 açılır
    expect(completeCurrentPad()).toBe('table2');

    // 2. masa sonrası: garson alınabilir opsiyonel pad olarak görünür AMA omurga pad'i DEĞİL.
    expect(availableOptionalPads(gate()).map((p) => p.id)).toContain('waiter');
    expect(currentPad(gate())).toBeNull(); // table3 minStationLevel:1 ile gated; garson omurgayı tıkamaz

    // Garson HİÇ alınmadan ocak yükselt → omurga normal devam etmeli (table3 aktifleşir).
    useGame.getState().addMoney(1000);
    expect(useGame.getState().upgradeStation()).toBe(true);
    expect(currentPad(gate())?.id).toBe('table3'); // garson değil, sıradaki masa
    expect(useGame.getState().hasWaiter).toBe(false);
  });

  it('garson tutulunca hasWaiter=true olur ve garson varlığı kurulur', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    expect(completeCurrentPad()).toBe('table2');
    expect(useGame.getState().hasWaiter).toBe(false);

    expect(completeOptionalPad('waiter')).toBe(true);
    expect(useGame.getState().hasWaiter).toBe(true);
    expect(useGame.getState().waiter).not.toBeNull();
    // Tamamlanan opsiyonel pad bir daha alınabilir listede olmamalı.
    expect(availableOptionalPads(gate()).map((p) => p.id)).not.toContain('waiter');
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
      hasWaiter: true,
      waiter: { pos: [nearSeat[0], 0.6, nearSeat[2]] as [number, number, number], tray: 1 },
      player: [0, 0.6, 6.5],
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [
        { id: 901, state: 'waitingForTea', pos: [...nearSeat] as [number, number, number], tableIndex: nearIdx, timer: 17, color: '#27ae60' },
        { id: 902, state: 'waitingForTea', pos: [...farSeat] as [number, number, number], tableIndex: farIdx, timer: 2, color: '#c0392b' },
      ],
      spawnTimer: 999, // bu testte yeni müşteri spawn olmasın
    });
    const startFarDist = dist([nearSeat[0], 0.6, nearSeat[2]], farSeat);
    useGame.getState().tick(0.1);
    const s = useGame.getState();
    const near = s.npcs.find((n) => n.id === 901);
    // Yakın ama sabrı bol masa SERVİS EDİLMEDİ (nearest-first olsaydı anında 'drinking' olurdu).
    expect(near?.state).toBe('waitingForTea');
    expect(s.waiter?.tray).toBe(1); // henüz teslim yok (uzak masaya yürüyor)
    // Garson acil (uzak) masaya YÖNELDİ → ona yaklaştı.
    expect(dist(s.waiter!.pos, farSeat)).toBeLessThan(startFarDist);
  });

  it('garson bekleyen müşteriye çay servis eder (oyuncu uzakta → kısmi assist)', () => {
    useGame.getState().hardReset();
    // D-015: hasWaiter padsDone'dan türetilir → garsonu padsDone üzerinden kur (sahte set işe yaramaz).
    // Oyuncuyu kimseyi servis edemeyeceği köşeye park et.
    useGame.setState({
      padsDone: ['table2', 'waiter'],
      hasWaiter: true,
      waiter: { pos: [...LAYOUT.waiterHome] as [number, number, number], tray: 0 },
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
});

describe('bardak döngüsü (Faz 2e) — demleme temiz harcar, içen kirli bırakır, topla+yıka', () => {
  // Sistemdeki TÜM bardakları say (korunum değişmezi: toplam = havuz kapasitesi).
  function totalCups() {
    const s = useGame.getState();
    const drinking = s.npcs.filter((n) => n.state === 'drinking').length;
    return (
      s.cleanCups + s.readyCups + s.tray + s.carriedDirty + s.dishes.length + drinking +
      (s.waiter?.tray ?? 0) + (s.dishwasher?.tray ?? 0)
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
    expect(s.readyCups).toBeGreaterThan(0);
    expect(s.cleanCups).toBeLessThan(pool);
    expect(totalCups()).toBe(pool); // korunum
  });

  it('temiz bardak biterse demleme DURUR (yeni darboğaz)', () => {
    useGame.getState().hardReset();
    useGame.setState({ player: [0, 0.6, 2], inputKeyboard: [0, 0], inputJoystick: [0, 0], cleanCups: 0, readyCups: 0, brewProgress: 0 });
    for (let i = 0; i < 200; i++) useGame.getState().tick(0.1);
    // Temiz yokken hiç çay demlenemez.
    expect(useGame.getState().readyCups).toBe(0);
  });

  it('içen müşteri masada KİRLİ bardak bırakır; oyuncu toplar → bulaşıkta yıkar → temize döner', () => {
    useGame.getState().hardReset();
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

  // Faz 2f "eli boşken" kısıtı (karar 2026-06-06): tepside hep TEK tür → tek renk taşıma.
  it('kirli taşırken (carriedDirty>0) ocaktan temiz çay ALINMAZ', () => {
    useGame.getState().hardReset();
    const st = LAYOUT.stations[0];
    // Hazır çay olsun + elinde kirli olsun → ocağa gitse de temizi alamamalı.
    useGame.setState({
      player: [st[0], 0.6, st[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      readyCups: 3, carriedDirty: 1, tray: 0,
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().tray).toBe(0); // kirli elindeyken temiz alınmadı
    expect(useGame.getState().carriedDirty).toBe(1);
  });

  it('temiz çay taşırken (tray>0) masadaki kirli TOPLANMAZ (simetrik)', () => {
    useGame.getState().hardReset();
    // Bir masaya kirli bardak koy, oyuncuyu üstüne park et, elinde temiz çay olsun.
    const dishPos: [number, number, number] = [1, 0.95, 1];
    useGame.setState({
      player: [dishPos[0], 0.6, dishPos[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      tray: 1, carriedDirty: 0,
      dishes: [{ id: 9001, pos: dishPos }],
    });
    useGame.getState().tick(0.1);
    expect(useGame.getState().carriedDirty).toBe(0); // temiz elindeyken kirli toplanmadı
    expect(useGame.getState().dishes.length).toBe(1);
  });
});

describe('bulaşıkçı — opsiyonel kısmi assist (Faz 2e)', () => {
  it('bulaşıkçı pad OPSİYONEL: alınmasa da omurga (sonraki masa) açılmaya devam eder', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    expect(completeCurrentPad()).toBe('table2');
    useGame.getState().addMoney(1000);
    expect(useGame.getState().upgradeStation()).toBe(true); // table3 minStationLevel:1
    expect(completeCurrentPad()).toBe('table3');
    // table3 sonrası bulaşıkçı opsiyonel olarak görünür ama omurga pad'i DEĞİL.
    expect(availableOptionalPads(gate()).map((p) => p.id)).toContain('dishwasher');
    expect(useGame.getState().hasDishwasher).toBe(false);
  });

  it('bulaşıkçı tutulunca hasDishwasher=true; kirlileri toplayıp yıkar (oyuncu uzakta → kısmi assist)', () => {
    useGame.getState().hardReset();
    // D-015: hasDishwasher padsDone'dan türetilir → padsDone üzerinden kur. NPC'siz izole sahne.
    const ds = LAYOUT.dishStation;
    useGame.setState({
      padsDone: ['table2', 'table3', 'dishwasher'],
      hasDishwasher: true,
      dishwasher: { pos: [...LAYOUT.dishwasherHome] as [number, number, number], tray: 0 },
      player: [0, 0.6, 6.5], // oyuncu uzakta; yalnız bulaşıkçı çalışsın
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [], // yeni müşteri/yeni kirli karışmasın
      // İki kirli bardak masalara serpiştir; temiz havuzu düşür ki yıkamanın etkisi görünsün.
      dishes: [
        { id: 9001, pos: [LAYOUT.tables[0].table[0], 0.95, LAYOUT.tables[0].table[2]] as [number, number, number] },
        { id: 9002, pos: [LAYOUT.tables[1].table[0], 0.95, LAYOUT.tables[1].table[2]] as [number, number, number] },
      ],
      cleanCups: 0,
      readyCups: 0,
      spawnTimer: 999, // yeni müşteri/yeni kirli olmasın
    });
    expect(useGame.getState().hasDishwasher).toBe(true);
    const dirtyBefore = useGame.getState().dishes.length;
    for (let i = 0; i < 600; i++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    // Bulaşıkçı kirlileri toplayıp bulaşıkta yıkadı → kirli temizlendi, bardaklar sisteme döndü
    // (yıkanan temiz bardakları ocak hemen demleyebilir → cleanCups + readyCups olarak ölç).
    expect(s.dishes.length).toBeLessThan(dirtyBefore);
    expect(s.cleanCups + s.readyCups).toBeGreaterThan(0);
    void ds;
  });
});

describe('para mıknatısı (Faz 2f) — attract yarıçapındaki para oyuncuya akar + toplanır', () => {
  it('düşme noktasının pickup yarıçapına HİÇ girilmese de para mıknatısla toplanır (bug düzeltmesi)', () => {
    useGame.getState().hardReset();
    // Para, oyuncudan pickup (1.4) DIŞINDA ama attract (2.6) İÇİNDE düşsün.
    const px = 0;
    const coinX = px + (economyConfig.money.pickupRadius + economyConfig.money.attractRadius) / 2; // ~2.0
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
    const far = economyConfig.money.attractRadius + 2; // attract dışında
    useGame.setState({
      player: [0, 0.6, 0], inputKeyboard: [0, 0], inputJoystick: [0, 0],
      coins: [{ id: 5556, pos: [far, 0.3, 0], value: 5 }],
    });
    for (let i = 0; i < 10; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().coins.length).toBe(1); // toplanmadı
    expect(useGame.getState().coins[0].pos[0]).toBeCloseTo(far, 5); // hareket etmedi
  });
});

describe('tepsi yükseltme (Faz 2e-B) — mekânsal nokta, kapasite 2→4→6 (Faz 2f max 6)', () => {
  // table3'e kadar ilerlet (tepsi yükseltme noktasının önkoşulu: prev table3).
  function reachTable3() {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    completeCurrentPad(); // table2
    useGame.getState().addMoney(2000);
    useGame.getState().upgradeStation(); // L1 → table3 gate açılır
    completeCurrentPad(); // table3
  }

  it('kapasite seviyeyle 2→4→6 büyür (Faz 2f: max 6 = 3×2 ızgara)', () => {
    expect(trayCapacity(0)).toBe(2);
    expect(trayCapacity(1)).toBe(4);
    expect(trayCapacity(2)).toBe(6);
    expect(trayMaxLevel()).toBe(2);
  });

  it('önkoşul (3. masa) karşılanmadan tepsi noktası pasiftir', () => {
    useGame.getState().hardReset();
    useGame.getState().addMoney(50);
    completeCurrentPad(); // sadece table2
    useGame.getState().addMoney(100000);
    const z = LAYOUT.trayUpgradeZone;
    useGame.setState({ player: [z[0], 0.6, z[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    for (let i = 0; i < 50; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().trayLevel).toBe(0); // table3 yok → yükseltme olmaz
  });

  it('3. masadan sonra noktada durunca tepsi seviyesi artar + kalıcı yazılır', () => {
    reachTable3();
    expect(useGame.getState().trayLevel).toBe(0);
    useGame.getState().addMoney(trayNextCost(0) + 50);
    const z = LAYOUT.trayUpgradeZone;
    useGame.setState({ player: [z[0], 0.6, z[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    // 20 tick (~2s): L1 (cost/fillRate ≈ 1.33s) tamamlanır ama L2'ye (max) ulaşmaz → zone aktif kalır.
    for (let i = 0; i < 20; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().trayLevel).toBeGreaterThan(0);
    expect(useGame.getState().trayLevel).toBeLessThan(trayMaxLevel()); // henüz max değil → zone gösterilir
    expect(useGame.getState().activeZone?.kind).toBe('upgrade');
  });

  it('maliyet geometrik artar ve max seviyede durur (₺ ile aşılamaz)', () => {
    expect(trayNextCost(1)).toBeGreaterThan(trayNextCost(0));
    reachTable3();
    useGame.getState().addMoney(10_000_000);
    const z = LAYOUT.trayUpgradeZone;
    useGame.setState({ player: [z[0], 0.6, z[2]], inputKeyboard: [0, 0], inputJoystick: [0, 0] });
    for (let i = 0; i < 600; i++) useGame.getState().tick(0.1);
    expect(useGame.getState().trayLevel).toBe(trayMaxLevel()); // max'ta durur, taşmaz
    expect(trayCapacity(useGame.getState().trayLevel)).toBe(6);
  });
});

describe('kayıt migrasyonu v4..v10 (padFills, station2 çıkışı, addTable senkron, türetme, trayLevel, tepsi clamp)', () => {
  it('eski tek padFill, aktif omurga pad id\'sine taşınır; saveVersion 10; türetilenler saklanmaz; trayLevel=0', () => {
    const m = migrate({
      saveVersion: 4,
      wallet: '100', diamonds: '0', lifetime: '50',
      tables: 1, stations: 1, stationLevel: 0, serviceSpeedMult: 1,
      padsDone: [], padFill: 20,
    });
    // lifetime 50 ≥ 30 → table2 aktif omurga pad'i → padFill ona atanır.
    expect(m.saveVersion).toBe(10);
    expect(m.padFills).toEqual({ table2: 20 });
    expect(m.trayLevel).toBe(0); // eski kayıtta tepsi yükseltmesi yok → L0
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
    expect(m.saveVersion).toBe(10);
    expect(m.padsDone).toEqual(['table2', 'table3', 'waiter']); // station2 kalktı; eski hasWaiter → waiter pad'i
    expect(m.padFills).toEqual({ samovar: 40 }); // station2 dolumu temizlendi, diğeri durur
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
    expect(m.saveVersion).toBe(10);
    // 4. masa zaten çiziliyken table4 pad'i bir daha belirmemeli (aynı konumda çakışır).
    expect(m.padsDone).toContain('table4');
    // Türetilen masa sayısı padsDone'dan gelir = 4; tutarlı: currentPad artık samovar.
    const tables = derivedFromPads(m.padsDone).tables;
    expect(tables).toBe(4);
    expect(currentPad({ padsDone: m.padsDone, tables, stationLevel: m.stationLevel, lifetime: 9000 })?.id).toBe('samovar');
  });

  it('v8 → v10: mevcut trayLevel korunur (≤ yeni max); eksikse 0\'lanır', () => {
    const kept = migrate({
      saveVersion: 8, wallet: '0', diamonds: '0', lifetime: '0',
      stationLevel: 0, padsDone: ['table2'], padFills: {}, trayLevel: 2,
    } as unknown as Record<string, unknown>);
    expect(kept.saveVersion).toBe(10);
    expect(kept.trayLevel).toBe(2); // 2 ≤ yeni max (2) → korunur
    const missing = migrate({
      saveVersion: 8, wallet: '0', diamonds: '0', lifetime: '0',
      stationLevel: 0, padsDone: ['table2'], padFills: {},
    } as unknown as Record<string, unknown>);
    expect(missing.trayLevel).toBe(0);
  });

  it('v9 → v10: eski L3 tepsi kaydı yeni max\'a (2) clamp\'lenir (kapasite 8→6)', () => {
    const m = migrate({
      saveVersion: 9, wallet: '0', diamonds: '0', lifetime: '0',
      stationLevel: 0, padsDone: ['table2', 'table3'], padFills: {}, trayLevel: 3,
    } as unknown as Record<string, unknown>);
    expect(m.saveVersion).toBe(10);
    expect(m.trayLevel).toBe(2); // L3 → tavana çekildi
    expect(trayCapacity(m.trayLevel)).toBe(6); // taşmayan max kapasite
  });

  it('v10 varsayılan kayıt padFills={} + trayLevel=0 içerir; türetilen alan tutmaz', () => {
    const d = defaultSave();
    expect(d.saveVersion).toBe(10);
    expect(d.padFills).toEqual({});
    expect(d.trayLevel).toBe(0);
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
    expect(derivedFromPads(['samovar']).serviceSpeedMult).toBeCloseTo(0.7, 5);
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
    completeCurrentPad(); // table2
    let s = useGame.getState();
    expect(s.tables).toBe(derivedFromPads(s.padsDone).tables);
    expect(s.hasWaiter).toBe(derivedFromPads(s.padsDone).hasWaiter);

    completeOptionalPad('waiter');
    s = useGame.getState();
    expect(s.hasWaiter).toBe(true);
    expect(s.hasWaiter).toBe(derivedFromPads(s.padsDone).hasWaiter);
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
