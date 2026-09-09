/**
 * gunluk-gorev.test.ts — D8'İN BEKÇİSİ: günlük görev sistemi.
 *
 * NEYİ KORUR: D7a'nın ölçtüğü tek sayı günün TOPLAM 💎 arzıdır (`diamondsPerDay: 10`) ve
 * "hiç reklam izlemeyen ~2,5 günde bir Usta alır" vaadi ona dayanır. Sistem o arzı sessizce
 * büyütebileceği ÜÇ yer var ve üçü de burada kilitli:
 *   ① parçaların toplamı ≠ toplam   (ödül dağılımı türetilir, config'e üç ayrı sayı yazılmaz)
 *   ② aynı görev iki kez toplanır    (`claimed` bekçisi)
 *   ③ çevrimdışı ₺ bugünün görevini bedava doldurur (gün dönümü tabanı offline'dan ÖNCE alınır)
 *
 * DÖRDÜNCÜ tehlike ters yönde: ULAŞILAMAZ görev. Eşik bir günde bitmezse ölçülen arz
 * GERÇEKLEŞMEZ — o yüzden havuzun tamamı akış sayacıdır ve hedefler masaya ölçeklenir.
 */
import { describe, it, expect } from 'vitest';
import {
  dayIndex, defaultDaily, pickIds, diamondsFor, targetOf, rollDaily, dailyViews,
  claimDailyReward, claimableDailyCount, availableTemplates, templateOf,
  type DailyContext, type DailyCounters, type DailyState,
} from '../src/game/dailyQuests';
import { economyConfig as C } from '../src/config/economy.config';
import { useGame, dailyCountersOf, dailyContextOf } from '../src/game/store';
import { defaultSave, loadSave, SAVE_VERSION } from '../src/game/save';
import { D } from '../src/game/decimal';

const KEY = 'kiraathane.save';

/** localStorage'ı bellek sözlüğüyle değiştirir (`tests/usta.test.ts`teki desen). */
function withStorage(seed: string | null, fn: () => void): void {
  const mem: Record<string, string> = {};
  if (seed != null) mem[KEY] = seed;
  const g = globalThis as Record<string, unknown>;
  const orig = g.localStorage;
  g.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
  try { fn(); } finally { if (orig === undefined) delete g.localStorage; else g.localStorage = orig; }
}

const sifirSayac = (): DailyCounters =>
  ({ served: 0, hand: 0, coins: 0, dishes: 0, earn: 0, pickup: 0, waiter: 0, tost: 0 });

const acikCtx = (tables = 4): DailyContext => ({ tables, hasWaiter: true, tostOpen: true });
const kapaliCtx = (tables = 4): DailyContext => ({ tables, hasWaiter: false, tostOpen: false });

describe('Günün arzı — ölçülen 10 💎 tam olarak dağıtılır', () => {
  it('parçaların toplamı config toplamına EŞİT (D7a: 2,5 gün/Usta vaadi buna dayanır)', () => {
    const n = C.dailyQuests.count;
    const paylar = Array.from({ length: n }, (_, i) => diamondsFor(i, n));
    expect(paylar.reduce((a, b) => a + b, 0)).toBe(C.dailyQuests.diamondsPerDay);
    expect(paylar).toEqual([3, 3, 4]); // 10/3 → taban 3, artan SONA
    // Dağılım kalıbı toplamdan bağımsız doğru olmalı: bölünen ve bölünmeyen iki örnek.
    expect([0, 1, 2].map((i) => diamondsFor(i, 3, 9))).toEqual([3, 3, 3]);
    expect([0, 1, 2, 3].map((i) => diamondsFor(i, 4, 10))).toEqual([2, 2, 3, 3]);
  });

  it('bir GÜN boyunca toplanabilecek 💎 tavanı tam 10 (fazlası kaçak arz olurdu)', () => {
    const ctx = acikCtx();
    const daily = rollDaily(undefined, 100, ctx, sifirSayac());
    const doldur = (): DailyCounters =>
      ({ served: 1e9, hand: 1e9, coins: 1e9, dishes: 1e9, earn: 1e9, pickup: 1e9, waiter: 1e9, tost: 1e9 });
    const toplam = dailyViews(daily, ctx, doldur()).reduce((a, v) => a + v.diamonds, 0);
    expect(toplam).toBe(C.dailyQuests.diamondsPerDay);
  });
});

describe('Seçim — deterministik, tekrarsız, uzun vadede eşit', () => {
  it('aynı gün her zaman aynı üçlüyü verir (kayıtta rastgelelik tohumu yok)', () => {
    const havuz = availableTemplates(acikCtx());
    expect(pickIds(4242, havuz, 3)).toEqual(pickIds(4242, havuz, 3));
  });

  it('aynı gün içinde AYNI görev iki kez gelmez', () => {
    const havuz = availableTemplates(acikCtx());
    for (let g = 0; g < 400; g++) {
      const ids = pickIds(g, havuz, 3);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
    }
  });

  it('şablonlar uzun vadede eşit sıklıkta geliyor (deste kalıbı — saf rastgelelik değil)', () => {
    const havuz = availableTemplates(acikCtx());
    const sayac = new Map<string, number>();
    const gun = 400;
    for (let g = 0; g < gun; g++) {
      for (const id of pickIds(g, havuz, 3)) sayac.set(id, (sayac.get(id) ?? 0) + 1);
    }
    expect(sayac.size).toBe(havuz.length); // hiçbir şablon aç kalmıyor
    const beklenen = (gun * 3) / havuz.length;
    for (const [, n] of sayac) expect(Math.abs(n - beklenen) / beklenen).toBeLessThan(0.2);
  });

  it('üçlüler günden güne TAZE — sabit desteyle 8 günde bir tekrar etmiyor', () => {
    // Deste her turda yeniden karılmasaydı üçlüler havuz boyunda (8) periyotla tekrarlardı ve
    // oyuncu ikinci haftada aynı sırayı görürdü. Farklı kombinasyon sayısı bunu ölçer.
    const havuz = availableTemplates(acikCtx());
    const kombin = new Set<string>();
    for (let g = 0; g < 100; g++) kombin.add(pickIds(g, havuz, 3).join('+'));
    expect(kombin.size).toBeGreaterThan(havuz.length * 2);
  });

  it('kapalı sistemin görevi SEÇİLMEZ — imkânsız görev = o günün kayıp 💎ı', () => {
    const kapali = availableTemplates(kapaliCtx()).map((t) => t.id);
    expect(kapali).not.toContain('waiter');
    expect(kapali).not.toContain('tost');
    const acik = availableTemplates(acikCtx()).map((t) => t.id);
    expect(acik).toContain('waiter');
    expect(acik).toContain('tost');
    for (let g = 0; g < 200; g++) {
      for (const id of pickIds(g, availableTemplates(kapaliCtx()), 3)) {
        expect(['waiter', 'tost']).not.toContain(id);
      }
    }
  });

  it('havuz görev sayısından küçülse bile çöker değil, olanı verir', () => {
    expect(pickIds(7, [], 3)).toEqual([]);
    const iki = C.dailyQuests.pool.slice(0, 2);
    expect(pickIds(7, iki, 3)).toEqual(iki.map((t) => t.id));
  });
});

describe('Hedef ölçeği — ulaşılabilirlik (arzın gerçekleşme şartı)', () => {
  it('eşik masa sayısıyla büyür ve hiçbir zaman 0/negatif olmaz', () => {
    for (const t of C.dailyQuests.pool) {
      expect(targetOf(t, 0)).toBeGreaterThanOrEqual(1);
      expect(targetOf(t, 20)).toBeGreaterThan(targetOf(t, 4));
      expect(targetOf(t, -5)).toBeGreaterThanOrEqual(1);
    }
    // Config'in ölçek kalıbı: hedef = base + perTable × masa (bir şablonla çivilenir).
    const serve = templateOf('serve')!;
    expect(targetOf(serve, 4)).toBe(serve.base + serve.perTable * 4);
  });

  it('havuzun TAMAMI akış sayacı — tükenen bir merdivene bağlı görev yok', () => {
    // "Yükseltme al" gibi bir görev 20 masada merdiven bitince İMKÂNSIZ olurdu ve o günün
    // ölçülen 💎ı sessizce kaybolurdu. Metrik listesi bu kuralın yazılı hâli.
    const akis = ['served', 'hand', 'coins', 'dishes', 'earn', 'pickup', 'waiter', 'tost'];
    for (const t of C.dailyQuests.pool) expect(akis).toContain(t.metric);
  });
});

describe('Gün dönümü ve ilerleme — delta, kalıcı sayaç değil', () => {
  it('gün değişmediyse AYNI nesne döner (her karede yeniden render yok)', () => {
    const ctx = acikCtx();
    const a = rollDaily(undefined, 50, ctx, sifirSayac());
    const b = rollDaily(a, 50, ctx, { ...sifirSayac(), served: 999 });
    expect(b).toBe(a); // nesne KİMLİĞİ aynı
    const c = rollDaily(a, 51, ctx, sifirSayac());
    expect(c).not.toBe(a);
    expect(c.day).toBe(51);
    expect(c.claimed).toEqual([]);
  });

  it('ilerleme gün başındaki tabandan sayılır (kalıcı sayaç sıfırlanmaz)', () => {
    const ctx = acikCtx();
    const baslangic: DailyCounters = { ...sifirSayac(), served: 5_000, coins: 5_000, dishes: 5_000, earn: 5_000, hand: 5_000, pickup: 5_000, waiter: 5_000, tost: 5_000 };
    const daily = rollDaily(undefined, 60, ctx, baslangic);
    // Gün başında hiçbir görev ilerlememiş olmalı — yoksa dünkü emek bugünü bedava bitirirdi.
    for (const v of dailyViews(daily, ctx, baslangic)) {
      expect(v.cur).toBe(0);
      expect(v.state).toBe('progress');
    }
    // Sayaçlar taban + hedef kadar artınca tam dolar.
    const t0 = templateOf(daily.ids[0])!;
    const sonra = { ...baslangic, [t0.metric]: baslangic[t0.metric] + targetOf(t0, ctx.tables) };
    const v0 = dailyViews(daily, ctx, sonra)[0];
    expect(v0.cur).toBe(v0.target);
    expect(v0.state).toBe('claimable');
  });

  it('sayaç geri giderse ilerleme negatife düşmez, hedefi de aşmaz', () => {
    const ctx = acikCtx();
    const daily = rollDaily(undefined, 61, ctx, { ...sifirSayac(), coins: 100, served: 100, hand: 100, dishes: 100, earn: 100, pickup: 100, waiter: 100, tost: 100 });
    for (const v of dailyViews(daily, ctx, sifirSayac())) expect(v.cur).toBe(0);
    const cok: DailyCounters = { served: 1e6, hand: 1e6, coins: 1e6, dishes: 1e6, earn: 1e6, pickup: 1e6, waiter: 1e6, tost: 1e6 };
    for (const v of dailyViews(daily, ctx, cok)) expect(v.cur).toBe(v.target);
  });

  it('havuzdan KALKMIŞ bir kimlik kartı sessizce düşürür (çöker değil)', () => {
    const ctx = acikCtx();
    const bozuk: DailyState = { day: 70, ids: ['serve', 'yok-boyle-gorev', 'dishes'], base: {}, claimed: [] };
    const v = dailyViews(bozuk, ctx, sifirSayac());
    expect(v.map((x) => x.id)).toEqual(['serve', 'dishes']);
  });

  it('yerel gün numarası 24 saatte tam 1 artar', () => {
    const t = Date.UTC(2026, 8, 9, 12, 0, 0);
    expect(dayIndex(t + 86_400_000) - dayIndex(t)).toBe(1);
    expect(dayIndex(t + 3_600_000)).toBe(dayIndex(t)); // aynı gün içinde sabit
  });
});

describe('Ödül alma — tek yerde doğrulanır, iki kez alınamaz', () => {
  const ctx = acikCtx();
  const dolu = (): DailyCounters =>
    ({ served: 1e6, hand: 1e6, coins: 1e6, dishes: 1e6, earn: 1e6, pickup: 1e6, waiter: 1e6, tost: 1e6 });

  it('eşik dolmadan ödül YOK', () => {
    const daily = rollDaily(undefined, 80, ctx, sifirSayac());
    expect(claimDailyReward(daily.ids[0], daily, ctx, sifirSayac())).toBeNull();
    expect(claimableDailyCount(daily, ctx, sifirSayac())).toBe(0);
  });

  it('dolunca ödül var; toplandıktan sonra bir daha YOK', () => {
    const daily = rollDaily(undefined, 81, ctx, sifirSayac());
    expect(claimableDailyCount(daily, ctx, dolu())).toBe(C.dailyQuests.count);
    const id = daily.ids[1];
    const odul = claimDailyReward(id, daily, ctx, dolu());
    expect(odul).toBe(diamondsFor(1, daily.ids.length));
    const sonra: DailyState = { ...daily, claimed: [id] };
    expect(claimDailyReward(id, sonra, ctx, dolu())).toBeNull();
    expect(dailyViews(sonra, ctx, dolu()).find((v) => v.id === id)!.state).toBe('claimed');
  });

  it('var olmayan kimlik ödül vermez', () => {
    const daily = rollDaily(undefined, 82, ctx, sifirSayac());
    expect(claimDailyReward('uydurma', daily, ctx, dolu())).toBeNull();
  });
});

describe('OYUNA bağlı mı — store (saf fonksiyon değil, gerçek durum)', () => {
  it('store 💎 ekliyor, iki kez eklemiyor ve kayda yazıyor', () => {
    withStorage(null, () => {
      useGame.getState().init();
      const s0 = useGame.getState();
      // Bugünün görevlerini elle DOLDUR: sayaçları hedefin üstüne çıkar.
      const ctx = dailyContextOf(s0);
      const ids = s0.daily.ids;
      expect(ids.length).toBe(C.dailyQuests.count);
      const stats = { ...s0.stats, teasServed: 1e6, waiterServed: 1e6, dishesWashed: 1e6, coinsCollected: 1e6, teaPickups: 1e6, tostServed: 1e6 };
      useGame.setState({ stats, lifetime: D(1e6), diamonds: D(0) });

      const ok = useGame.getState().claimDailyQuest(ids[0]);
      expect(ok).toBe(true);
      const bekleneni = diamondsFor(0, ids.length);
      expect(useGame.getState().diamonds.toNumber()).toBe(bekleneni);
      // İkinci kez: reddedilir ve 💎 artmaz.
      expect(useGame.getState().claimDailyQuest(ids[0])).toBe(false);
      expect(useGame.getState().diamonds.toNumber()).toBe(bekleneni);
      // Kayda gitti mi (yeniden yükleyince toplanmış kalır)?
      expect(loadSave().daily.claimed).toContain(ids[0]);
      // Sayaç türeticisi gerçekten durumdan okuyor (HUD kendi başına toplamıyor).
      expect(dailyCountersOf(useGame.getState()).served).toBe(2e6);
      expect(ctx.tables).toBe(useGame.getState().tables);
    });
  });

  it('ÇEVRİMDIŞI ₺ bugünün "kazan" görevini bedava doldurmaz (taban offline ÖNCESİ alınır)', () => {
    // 12 saat kapalı kalmış, "kazan" görevi seçilebilecek bir kayıt kur.
    const kayit = {
      ...defaultSave(),
      saveVersion: SAVE_VERSION,
      padsDone: ['table2', 'table3', 'table4'],
      stationLevels: [3],
      tableLevels: [2, 2, 2, 2],
      lifetime: '50000',
      wallet: '50000',
      lastSaved: Date.now() - 12 * 3600 * 1000,
      daily: { ...defaultDaily(), day: dayIndex(Date.now()) - 1 },
    };
    withStorage(JSON.stringify(kayit), () => {
      useGame.getState().init();
      const s = useGame.getState();
      expect(s.daily.day).toBe(dayIndex(Date.now())); // gün döndü
      expect(s.lifetime.toNumber()).toBeGreaterThan(50_000); // offline ₺ gerçekten geldi
      // Hiçbir görev, açılışta kendiliğinden toplanabilir olmamalı.
      const gorunum = dailyViews(s.daily, dailyContextOf(s), dailyCountersOf(s));
      expect(gorunum.every((v) => v.state === 'progress')).toBe(true);
      const kazan = gorunum.find((v) => v.id === 'earn');
      if (kazan) expect(kazan.cur).toBe(0);
    });
  });

  it('gün OTURUM AÇIKKEN dönerse tick yeniler (gece yarısı oynayan oyuncu)', () => {
    withStorage(null, () => {
      useGame.getState().init();
      const dun = dayIndex(Date.now()) - 1;
      useGame.setState({ daily: { day: dun, ids: ['serve'], base: { serve: 0 }, claimed: ['serve'] } });
      useGame.getState().tick(1 / 60);
      const d = useGame.getState().daily;
      expect(d.day).toBe(dayIndex(Date.now()));
      expect(d.claimed).toEqual([]); // dünün toplananları bugüne taşınmaz
      expect(d.ids.length).toBe(C.dailyQuests.count);
    });
  });

  it('eski kayıtta alan yoksa sürüm ARTMADAN açılır ve ilk günü kurar', () => {
    const eski = { ...defaultSave(), saveVersion: SAVE_VERSION } as Record<string, unknown>;
    delete eski.daily;
    withStorage(JSON.stringify(eski), () => {
      expect(loadSave().saveVersion).toBe(SAVE_VERSION);
      expect(loadSave().daily).toEqual(defaultDaily());
      useGame.getState().init();
      expect(useGame.getState().daily.day).toBe(dayIndex(Date.now()));
      expect(useGame.getState().daily.ids.length).toBe(C.dailyQuests.count);
    });
  });
});
