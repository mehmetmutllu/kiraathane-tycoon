/**
 * mantik-t9c.test.ts — T9c MANTIK/KİLİT BEKÇİSİ (D-146, `docs/tarama-raporu-t9b.md` §A · §D).
 *
 * A1: `q_tost5` hattı 30/50'de kilitliyordu — `serveTost` hedefinin değerlendiricisi yoktu, sayaç
 * `null` döndü, `questTargetMet` hep `false`. Yeni bir hedef tipi eklenip değerlendiricisi unutulursa
 * aynı kilit tekrar olur → bekçi TÜM hattı "her şey tavanda" bağlamıyla koşar.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { economyConfig as C, waiterTrayCapacityFor, type QuestTarget } from '../src/config/economy.config';
import { questCounterValue, questTargetMet, questFocusPos, tableUpgradeTarget, gateOf, type QuestCtx } from '../src/game/rules';
import { useGame, LAYOUT, servicePlace, parkSpot } from '../src/game/store';
import type { Vec3 } from '../src/game/types';
import { ustaKaresi } from '../src/game/dwell';
import { ustaCercevesi } from '../src/game/markerFrame';
import { tableHalfFor } from '../src/game/layout';
import { geriTusu } from '../src/game/ekranKanali';
import { rollDaily, dailyViews } from '../src/game/dailyQuests';
import { defaultStats, defaultCharUpgrades, defaultWaiterUpgrades, defaultSave, loadSave, derinBirlestir, kayitKilitli, SAVE_VERSION } from '../src/game/save';

const COK = 1e6;

function tavanBaglami(): QuestCtx {
  const s = defaultStats();
  return {
    padsDone: C.pads.map((p) => p.id),
    stationLevels: Array(8).fill(COK),
    tableLevels: Array(64).fill(COK),
    stats: {
      ...s,
      teaPickups: COK, teasServed: COK, tostServed: COK, coinsCollected: COK, dishesWashed: COK,
      waiterServed: COK, waiterServedByService: Array(8).fill(COK), teasServedByArea: Array(8).fill(COK),
    },
    questBase: 0,
    charUpgrades: Object.fromEntries(Object.keys(defaultCharUpgrades()).map((k) => [k, COK])) as QuestCtx['charUpgrades'],
    waiterUpgrades: Object.fromEntries(Object.keys(defaultWaiterUpgrades()).map((k) => [k, COK])) as QuestCtx['waiterUpgrades'],
    lavaboLevel: COK,
  };
}

function bosBaglam(): QuestCtx {
  return {
    padsDone: [], stationLevels: [0], tableLevels: [0], stats: defaultStats(), questBase: 0,
    charUpgrades: defaultCharUpgrades(), waiterUpgrades: defaultWaiterUpgrades(), lavaboLevel: 0,
  };
}

describe('A1 — görev hattında bitmeyen görev yok', () => {
  it('her görev, her şey tavandayken biter; sıfırdayken bitmez', () => {
    const tavan = tavanBaglami();
    const bos = bosBaglam();
    for (const q of C.quests) {
      expect(questTargetMet(q.target, tavan), `${q.id} tavanda bitmiyor`).toBe(true);
      expect(questTargetMet(q.target, bos), `${q.id} sıfırda bitmiş sayılıyor`).toBe(false);
    }
  });

  it('`count` taşıyan her sayaç hedefinin sayacı var (tablesAtLevel durum hedefidir)', () => {
    const tipler = new Set(C.quests.map((q) => q.target.type));
    for (const q of C.quests) {
      if (!('count' in q.target) || q.target.type === 'tablesAtLevel') continue;
      expect(questCounterValue(q.target, defaultStats()), `${q.id} (${q.target.type})`).not.toBeNull();
    }
    expect(tipler.has('serveTost')).toBe(true);
  });

  it('q_tost5: tost sayacı görev tabanından DELTA ilerler', () => {
    const t = C.quests.find((q) => q.id === 'q_tost5')!.target as QuestTarget;
    const ctx = bosBaglam();
    ctx.stats = { ...ctx.stats, tostServed: 7 };
    ctx.questBase = 3;
    expect(questTargetMet(t, ctx)).toBe(false);
    ctx.stats = { ...ctx.stats, tostServed: 8 };
    expect(questTargetMet(t, ctx)).toBe(true);
  });
});

describe('A2 — masa görevinde ok CANLI masayı gösterir', () => {
  const idx = C.quests.findIndex((q) => q.id === 'q_tableL2x2');

  it('1. masa L3 (tavan altı), 2. masa L0 → ok 1. masada, çünkü canlı nokta orada', () => {
    useGame.getState().hardReset();
    useGame.setState({ padsDone: C.pads.map((p) => p.id), tables: 4, tableLevels: [3, 0, 0, 0], questIndex: idx });
    const s = useGame.getState();
    const canli = tableUpgradeTarget(gateOf(s));
    expect(canli).toBe(0);
    // Eski davranış: ilk-eksik masa (1) — ok ile canlı nokta ayrışıyordu.
    expect(questFocusPos(C.quests[idx].target, s.tableLevels, s.tables, s.areasOpen)).toEqual(LAYOUT.tables[1].upgradeSpot);
    s.focusQuest();
    expect(useGame.getState().camFocus?.pos).toEqual([...LAYOUT.tables[0].upgradeSpot]);
  });
});

const KEY = 'kiraathane.save';

/** localStorage'ı bellek sözlüğüyle değiştirir (onarim-g58-g81 deseni). */
function withStorage(fn: (mem: Record<string, string>) => void): void {
  const mem: Record<string, string> = {};
  const g = globalThis as Record<string, unknown>;
  const orig = g.localStorage;
  g.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
  try { fn(mem); } finally { if (orig === undefined) delete g.localStorage; else g.localStorage = orig; }
}

/** Geliri olan bir dükkân: ilk 6 pad + ocak L3 + masalar L2 → kaydet → yeniden yükle (türetilmiş dünya tutarlı). */
function gelirliDukkan(): void {
  useGame.getState().hardReset();
  useGame.setState({
    padsDone: C.pads.slice(0, 6).map((p) => p.id),
    stationLevels: useGame.getState().stationLevels.map((l, i) => (i === 0 ? 3 : l)),
    tableLevels: useGame.getState().tableLevels.map(() => 2),
  });
  useGame.getState().saveNow();
  useGame.getState().init();
}

afterEach(() => vi.restoreAllMocks());

describe('A3 — arka plandan sıcak dönüşte çevrimdışı gelir', () => {
  it('3 sa arka plan → sıcak dönüş, soğuk açılışla AYNI ₺ verir ve cüzdana girer', () => {
    withStorage((mem) => {
      const t0 = 1_800_000_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(t0);
      gelirliDukkan();
      useGame.getState().arkaPlanaGec();
      const kayit = mem[KEY];
      const once = useGame.getState().wallet.toNumber();

      vi.spyOn(Date, 'now').mockReturnValue(t0 + 3 * 3600_000);
      useGame.getState().onPlanaDon();
      const sicak = useGame.getState().offlineEarned;
      expect(sicak).toBeGreaterThan(0);
      expect(useGame.getState().wallet.toNumber()).toBeCloseTo(once + sicak, 6);
      expect(useGame.getState().gizlendiAt).toBeNull();

      mem[KEY] = kayit;
      useGame.getState().init();
      expect(useGame.getState().offlineEarned).toBeCloseTo(sicak, 6);
    });
  });

  it('kısa yokluk (≤ 30 sn) ve gizlenmeden görünme hiçbir şey vermez', () => {
    withStorage(() => {
      const t0 = 1_800_000_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(t0);
      gelirliDukkan();
      useGame.setState({ offlineEarned: 0 });
      const once = useGame.getState().wallet.toNumber();
      useGame.getState().onPlanaDon();
      useGame.getState().arkaPlanaGec();
      vi.spyOn(Date, 'now').mockReturnValue(t0 + 20_000);
      useGame.getState().onPlanaDon();
      expect(useGame.getState().offlineEarned).toBe(0);
      expect(useGame.getState().wallet.toNumber()).toBe(once);
    });
  });

  it('ödül ekranı kapatılınca bir sonraki dönüşte yeniden açılabilir', () => {
    withStorage(() => {
      const t0 = 1_800_000_000_000;
      vi.spyOn(Date, 'now').mockReturnValue(t0);
      gelirliDukkan();
      useGame.getState().claimOffline();
      expect(useGame.getState().offlineEarned).toBe(0);
      useGame.getState().arkaPlanaGec();
      vi.spyOn(Date, 'now').mockReturnValue(t0 + 3600_000);
      useGame.getState().onPlanaDon();
      expect(useGame.getState().offlineEarned).toBeGreaterThan(0);
    });
  });
});

describe('K8 — kapanırken yerdeki para kayıtta cüzdandadır', () => {
  it('yerde 50 ₺ → kayıt cüzdanı ve ömür boyu +50; canlı cüzdan değişmez, yüklemede çift sayım yok', () => {
    withStorage((mem) => {
      useGame.getState().hardReset();
      useGame.setState({ wallet: useGame.getState().wallet.add(100), lifetime: useGame.getState().lifetime.add(100) });
      const coin = { id: 1, pos: [0, 0, 0], value: 50, age: 0 } as unknown as ReturnType<typeof useGame.getState>['coins'][number];
      useGame.setState({ coins: [coin] });
      useGame.getState().arkaPlanaGec();
      const kayit = JSON.parse(mem[KEY]);
      expect(Number(kayit.wallet)).toBe(150);
      expect(Number(kayit.lifetime)).toBe(150);
      expect(useGame.getState().wallet.toNumber()).toBe(100);
      useGame.getState().init();
      expect(useGame.getState().coins).toEqual([]);
      expect(useGame.getState().wallet.toNumber()).toBe(150);
    });
  });
});

describe('A5 — daha yeni sürümlü kayıt silinmez, üstüne yazılmaz', () => {
  it('v(SAVE_VERSION+1) kayıt okunur, ilerleme gelir, kayıt AYNEN kalır; sıfırlama kilidi açar', () => {
    withStorage((mem) => {
      const yeni = { ...defaultSave(), saveVersion: SAVE_VERSION + 1, wallet: '777', padsDone: [C.pads[0].id], gelecekAlani: 5 };
      mem[KEY] = JSON.stringify(yeni);
      useGame.getState().init();
      expect(kayitKilitli()).toBe(true);
      expect(useGame.getState().wallet.toNumber()).toBeGreaterThanOrEqual(777);
      expect(useGame.getState().padsDone).toContain(C.pads[0].id);
      useGame.getState().saveNow();
      useGame.getState().arkaPlanaGec();
      expect(JSON.parse(mem[KEY])).toEqual(yeni);
      useGame.getState().hardReset();
      expect(kayitKilitli()).toBe(false);
    });
  });
});

describe('A6 — kaydın iç alanları varsayılanla DERİN birleşir', () => {
  it('eksik stats alanı ve null padsDone çökme üretmez', () => {
    withStorage((mem) => {
      const bozuk = { ...defaultSave(), padsDone: null, stats: { teasServed: 12 } } as Record<string, unknown>;
      mem[KEY] = JSON.stringify(bozuk);
      const d = loadSave();
      expect(d.padsDone).toEqual([]);
      expect(d.stats.teasServed).toBe(12);
      expect(d.stats.waiterServedByService).toEqual([]);
      expect(d.stats.tostServed).toBe(0);
      expect(() => { useGame.getState().init(); for (let i = 0; i < 20; i++) useGame.getState().tick(0.1); }).not.toThrow();
    });
  });

  it('sözlük alanlarının anahtarları korunur, yanlış türdeki ilkel varsayılana döner', () => {
    expect(derinBirlestir({ a: 1, m: {} }, { a: 'x', m: { k: 3 } })).toEqual({ a: 1, m: { k: 3 } });
    expect(derinBirlestir({ w: '0' }, { w: 42 })).toEqual({ w: '42' });
    expect(derinBirlestir({ n: 0 }, { n: NaN })).toEqual({ n: 0 });
  });
});

describe('A7 — alınmamış seviye ödülü kayıtla taşınır', () => {
  it('₺li ödül ekranı açıkken kapanış → yüklemede ekran geri gelir; ₺siz ödül kayda girmez', () => {
    withStorage(() => {
      useGame.getState().hardReset();
      useGame.setState({ levelUp: { level: 6, amount: 250, carryBefore: 0.02, carryAfter: 0.03 } });
      useGame.getState().arkaPlanaGec();
      useGame.setState({ levelUp: null });
      useGame.getState().init();
      expect(useGame.getState().levelUp).toEqual({ level: 6, amount: 250, carryBefore: 0.02, carryAfter: 0.03 });
      const once = useGame.getState().wallet.toNumber();
      useGame.getState().claimLevelUp();
      expect(useGame.getState().wallet.toNumber()).toBe(once + 250);
      useGame.getState().init();
      expect(useGame.getState().levelUp).toBeNull();

      useGame.setState({ levelUp: { level: 3, amount: 0, carryBefore: 0, carryAfter: 0.01 } });
      useGame.getState().saveNow();
      useGame.getState().init();
      expect(useGame.getState().levelUp).toBeNull();
    });
  });
});

describe('K7 · D2 — günlük görev: hedef sabit, gün yalnız ileri döner', () => {
  const ctx = { tables: 4, hasWaiter: true, tostOpen: true };
  const sifir = { served: 0, hand: 0, coins: 0, dishes: 0, earn: 0, pickup: 0, waiter: 0, tost: 0 };
  const dolu = { served: 1e6, hand: 1e6, coins: 1e6, dishes: 1e6, earn: 1e9, pickup: 1e6, waiter: 1e6, tost: 1e6 };

  it('K7: gün içinde masa açılınca hedef büyümez, "alınabilir" "ilerliyor"a dönmez', () => {
    const d = rollDaily(undefined, 100, ctx, sifir);
    const sabah = dailyViews(d, 4, dolu);
    const aksam = dailyViews(d, 12, dolu);
    expect(aksam.map((v) => v.target)).toEqual(sabah.map((v) => v.target));
    expect(aksam.every((v) => v.state === 'claimable')).toBe(true);
  });

  it('K7: eski kayıt (targets yok) o günün türetilen hedefiyle devam eder', () => {
    const { targets: _t, ...eski } = rollDaily(undefined, 100, ctx, sifir);
    expect(dailyViews(eski, 4, sifir).length).toBe(C.dailyQuests.count);
  });

  it('D2: saati geri almak yeni set / boş claimed vermez', () => {
    const d = rollDaily(undefined, 100, ctx, sifir);
    const alindi = { ...d, claimed: [...d.ids] };
    expect(rollDaily(alindi, 99, ctx, sifir)).toBe(alindi);
    expect(rollDaily(alindi, 100, ctx, sifir)).toBe(alindi);
    expect(rollDaily(alindi, 101, ctx, sifir).claimed).toEqual([]);
  });
});

describe('D6 — yanlış ürünle dolu tepsili garson boşta kalmaz', () => {
  it('2 çay taşıyan garson, yalnız tost bekleyen varken çayı iade edip tostu götürür', () => {
    useGame.getState().hardReset();
    const i = C.pads.findIndex((p) => p.id === 'waiter');
    const cap = waiterTrayCapacityFor(0);
    const home = servicePlace(1).pickup;
    useGame.setState({
      padsDone: C.pads.slice(0, i + 1).map((p) => p.id),
      stationLevels: useGame.getState().stationLevels.map((l, k) => (k === 0 ? 5 : l)),
      waiters: [{ pos: [home[0], 0.6, home[2]] as Vec3, tray: cap, trayFood: 0 }],
      ready: { tea: 0, tost: 2 },
      player: parkSpot(),
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [{ id: 990, state: 'waitingForTea', pos: [...LAYOUT.tables[1].seats[0]] as Vec3,
        tableIndex: 1, seatIndex: 0, timer: 999, product: 'tost', color: '#fff' }],
      spawnTimer: 999,
    });
    // Korunum: temiz + tezgâh + tepsi + masadaki (içilen) + kirli — hiçbir bardak yok olmaz.
    const havuz = () => {
      const g = useGame.getState();
      const w = g.waiters[0];
      return g.cleanCups + g.ready.tea + g.ready.tost + (w?.tray ?? 0) + (w?.trayFood ?? 0) +
        g.npcs.filter((n) => n.state === 'drinking').length + g.dishes.length;
    };
    const once = havuz();
    for (let k = 0; k < 400 && useGame.getState().npcs[0]?.state === 'waitingForTea'; k++) useGame.getState().tick(0.1);
    const s = useGame.getState();
    expect(s.npcs.find((n) => n.id === 990)?.state).toBe('drinking');
    expect(s.waiters[0].tray).toBe(0);
    expect(s.ready.tea).toBeGreaterThanOrEqual(cap); // iade edilen çay tezgâhta
    expect(havuz()).toBe(once);
  });
});

describe('K4 — Usta noktası pad gibi: çerçevenin üstünde durunca, kapatınca çıkana kadar kilitli', () => {
  const spot = LAYOUT.tables[0].upgradeSpot;
  const adaylar = [{ id: 'table:0', pos: spot }];
  const cer = ustaCercevesi();
  const kos = (px: number, pz: number, sn: number, bas: { p: number; kapali: string | null }) => {
    let d = { ...bas, acik: null as string | null };
    for (let t = 0; t < sn; t += 0.1) d = ustaKaresi(adaylar, px, pz, true, 0.1, d);
    return d;
  };

  it('çerçevenin DIŞINDA (eski 1,9 br yarıçapın içinde) durmak açmaz', () => {
    const x = spot[0] + cer.hw + 0.3;
    expect(Math.hypot(x - spot[0], 0)).toBeLessThan(1.9);
    expect(kos(x, spot[2], 3, { p: 0, kapali: null }).acik).toBeNull();
  });

  it('üstünde 1,1 sn durunca açılır; yürürken dolmaz', () => {
    expect(kos(spot[0], spot[2], 1.3, { p: 0, kapali: null }).acik).toBe('table:0');
    expect(ustaKaresi(adaylar, spot[0], spot[2], false, 5, { p: 0, kapali: null }).p).toBe(0);
  });

  it('kapatılan nokta üstünde beklese de açılmaz; çıkıp yeniden basınca açılır', () => {
    const kilitli = kos(spot[0], spot[2], 3, { p: 0, kapali: 'table:0' });
    expect(kilitli.acik).toBeNull();
    expect(kilitli.kapali).toBe('table:0');
    const cikti = ustaKaresi(adaylar, spot[0] + cer.hw + 1, spot[2], true, 0.1, kilitli);
    expect(cikti.kapali).toBeNull();
    expect(kos(spot[0], spot[2], 1.3, cikti).acik).toBe('table:0');
  });

  it('store: closeMaster pencereyi kapatır ve noktayı kilitler', () => {
    useGame.getState().hardReset();
    useGame.getState().setNearMaster('table:0');
    useGame.getState().closeMaster();
    expect(useGame.getState().nearMaster).toBeNull();
    expect(useGame.getState().ustaKapali).toBe('table:0');
  });
});

describe('K5 — masaya servis gövdeden, kirli toplama ile aynı pay (D-147)', () => {
  const kur = (px: number, pz: number) => {
    useGame.getState().hardReset();
    useGame.setState({
      player: [px, 0.6, pz] as Vec3,
      tray: 1,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
      npcs: [{ id: 991, state: 'waitingForTea', pos: [...LAYOUT.tables[0].seats[0]] as Vec3,
        tableIndex: 0, seatIndex: 0, timer: 999, product: 'tea', color: '#fff' }],
      spawnTimer: 999,
    });
    useGame.getState().tick(0.05);
    return useGame.getState().npcs.find((n) => n.id === 991)?.state;
  };
  const t = LAYOUT.tables[0].table;
  const h = tableHalfFor(0);

  it('köşeye dayanan oyuncu (merkeze ~1,86 br — eski 1,6 dairesinin dışı) servis eder', () => {
    const k = h[0] + LAYOUT.playerRadius; // kare çarpışmada köşe durağı
    const x = t[0] + k + 0.01, z = t[2] - k - 0.01;
    expect(Math.hypot(x - t[0], z - t[2])).toBeGreaterThan(1.6);
    expect(kur(x, z)).toBe('drinking');
  });

  it('gövdeye payın ötesinde duran oyuncu servis etmez', () => {
    expect(kur(t[0] + h[0] + C.cups.collectReach + 0.1, t[2])).toBe('waitingForTea');
  });
});

describe('A4 — Android geri tuşu üstteki ekranı kapatır, yoksa küçültür', () => {
  it('sıra: çevrimdışı/Usta → panel → seviye → ipucu → küçült', () => {
    expect(geriTusu('cevrimdisi', true)).toBe('cevrimdisi');
    expect(geriTusu('usta', true)).toBe('usta');
    expect(geriTusu(null, true)).toBe('panel');
    expect(geriTusu('seviye', false)).toBe('seviye');
    expect(geriTusu('ipucu-tepsi', false)).toBe('ipucu');
    expect(geriTusu('ogretme-bulasik', false)).toBe('ipucu');
    expect(geriTusu(null, false)).toBe('kucult');
  });
});
