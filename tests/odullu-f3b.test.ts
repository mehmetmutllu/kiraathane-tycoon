/**
 * BEKÇİ — F3b ödüllü videonun ödülü (D-150 · `docs/odullu-raporu-f3b.md`).
 * Seçilen kollar: S2 + Eg2 + O2 (ödül ekranı 2×, hedef ekranı HARİÇ) · U1 (günde 1 Usta) · V60 (video hakkı).
 * Formül değil STORE koşturulur: sayının oyuncunun cüzdanına/elmasına gerçekten bindiği doğrulanır.
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame, dailyCountersOf } from '../src/game/store';
import {
  computeOfflineEarned, offlineWatchExtra, masterAdsLeft, spendMasterAd, videoRights, spendVideoRight, videoReward,
  tableSoftMaxLevel, GELIR_ORNEK_SN,
} from '../src/game/rules';
import { dayIndex, dailyViews } from '../src/game/dailyQuests';
import { defaultReklam, defaultSave, loadSave } from '../src/game/save';
import { economyConfig as C } from '../src/config/economy.config';
import { D } from '../src/game/decimal';

const KEY = 'kiraathane.save';
const mem: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};
const oku = (p: string) => readFileSync(p, 'utf8');

describe('ölçülen sayılar config\'te (D-150)', () => {
  it('2× · günde 1 Usta · 2 sa\'te 4 video × son 60 sn', () => {
    expect(C.rewarded.claimMult).toBe(2);
    expect(C.rewarded.masterPerDay).toBe(1);
    expect(C.rewarded.video).toEqual({ rights: 4, periodSec: 7200, incomeSec: 60 });
  });
});

describe('çevrimdışı "İzle" eki — O2: tavan yine bağlar', () => {
  const pads: string[] = [];
  const sonraki = (C.pads as readonly { id: string; cost: number; optional?: boolean }[]).find((p) => !p.optional)!;
  const tavan = Math.floor(sonraki.cost * C.offline.capNextPadFrac);
  it('tavanın altında ek = kazanç kadar (2×)', () => {
    const kazanc = computeOfflineEarned(0.01, 600, pads);
    expect(kazanc).toBeLessThan(tavan / 2);
    expect(offlineWatchExtra(0.01, 600, pads)).toBe(kazanc);
  });
  it('tavana yakınsa ek tavana kadar', () => {
    const oran = (0.75 * tavan) / (C.offline.rateMult * 3600);
    const kazanc = computeOfflineEarned(oran, 3600, pads);
    expect(kazanc + offlineWatchExtra(oran, 3600, pads)).toBe(tavan);
  });
  it('zaten tavandaysa ek 0 (düğme çizilmez)', () => {
    expect(offlineWatchExtra(1e6, 3600, pads)).toBe(0);
  });
});

describe('haklar (saf)', () => {
  it('Usta: günde 1, gün dönünce tazelenir', () => {
    const r0 = defaultReklam();
    expect(masterAdsLeft(r0, 100)).toBe(1);
    const r1 = spendMasterAd(r0, 100);
    expect(masterAdsLeft(r1, 100)).toBe(0);
    expect(masterAdsLeft(r1, 101)).toBe(1);
  });
  it('video: pencere ilk izlemede başlar, 4 hak, 2 sa sonra tazelenir', () => {
    let r = defaultReklam();
    const t0 = 1_000_000_000;
    for (let i = 0; i < 4; i++) r = spendVideoRight(r, t0 + i * 1000);
    expect(videoRights(r, t0 + 5000).kalan).toBe(0);
    expect(videoRights(r, t0 + 5000).yenilenmeMs).toBe(7200_000 - 5000);
    expect(videoRights(r, t0 + 7200_000).kalan).toBe(4);
  });
  it('saat geri alınırsa hak çoğalmaz, ceza da yok', () => {
    const r = spendVideoRight(defaultReklam(), 2e12);
    expect(videoRights(r, 1e12).kalan).toBe(4);
  });
  it('video ödülü son 60 sn\'nin ₺\'si (iz 5 sn\'de bir)', () => {
    const k = C.rewarded.video.incomeSec / GELIR_ORNEK_SN;
    const iz = Array.from({ length: k + 1 }, (_, i) => i * 100);
    expect(videoReward(iz, iz[iz.length - 1])).toBe(k * 100);
    expect(videoReward([], 500)).toBe(0);
  });
});

describe('store: ödül gerçekten katlanıyor', () => {
  beforeEach(() => {
    for (const k of Object.keys(mem)) delete mem[k];
    useGame.getState().init();
  });

  it('seviye ödülü: izleyen 2×, izlemeyen 1×', () => {
    useGame.setState({ levelUp: { level: 6, amount: 500, carryBefore: 0, carryAfter: 0 }, wallet: D(0) });
    useGame.getState().claimLevelUp(true);
    expect(useGame.getState().wallet.toNumber()).toBe(1000);
    useGame.setState({ levelUp: { level: 7, amount: 500, carryBefore: 0, carryAfter: 0 }, wallet: D(0) });
    useGame.getState().claimLevelUp();
    expect(useGame.getState().wallet.toNumber()).toBe(500);
  });

  it('çevrimdışı: izleyen eki alır, ekran kapanınca ek sıfırlanır', () => {
    useGame.setState({ offlineEarned: 300, offlineIzleEki: 300, wallet: D(300) });
    useGame.getState().claimOffline(true);
    expect(useGame.getState().wallet.toNumber()).toBe(600);
    expect(useGame.getState().offlineIzleEki).toBe(0);
    useGame.setState({ offlineEarned: 300, offlineIzleEki: 300, wallet: D(300) });
    useGame.getState().claimOffline();
    expect(useGame.getState().wallet.toNumber()).toBe(300);
  });

  it('günlük görev: izleyen elması 2× alır', () => {
    // Gün dönümünü store kendisi yapar (tick); burada günün görevlerini açıkça kurup birini dolduruyoruz.
    useGame.getState().tick(0.1);
    const doldur = () => {
      const s = useGame.getState();
      const v = dailyViews(s.daily, s.tables, dailyCountersOf(s)).find((x) => x.state !== 'claimed')!;
      const t = C.dailyQuests.pool.find((x) => x.id === v.id)!;
      const sayac = dailyCountersOf(s);
      useGame.setState({ daily: { ...s.daily, base: { ...s.daily.base, [v.id]: sayac[t.metric] - v.target } } });
      return v;
    };
    const v1 = doldur();
    useGame.setState({ diamonds: D(0) });
    expect(useGame.getState().claimDailyQuest(v1.id, true)).toBe(true);
    expect(useGame.getState().diamonds.toNumber()).toBe(v1.diamonds * 2);
    const v2 = doldur();
    useGame.setState({ diamonds: D(0) });
    expect(useGame.getState().claimDailyQuest(v2.id)).toBe(true);
    expect(useGame.getState().diamonds.toNumber()).toBe(v2.diamonds);
  });

  it('Usta reklamla: 💎 düşmez, günde bir kez', () => {
    const tl = useGame.getState().tableLevels.slice();
    tl[0] = tableSoftMaxLevel();
    tl[1] = tableSoftMaxLevel();
    useGame.setState({ tables: 2, tableLevels: tl, diamonds: D(0), reklam: defaultReklam() });
    expect(useGame.getState().buyMasterAd('table:0')).toBe(true);
    expect(useGame.getState().diamonds.toNumber()).toBe(0);
    expect(useGame.getState().mastersOwned).toContain('table:0');
    expect(useGame.getState().buyMasterAd('table:1')).toBe(false);
    expect(masterAdsLeft(useGame.getState().reklam, dayIndex(Date.now()))).toBe(0);
  });

  it('Usta reklamla da tavan şartını atlamaz', () => {
    useGame.setState({ tables: 1, reklam: defaultReklam() });
    expect(useGame.getState().buyMasterAd('table:0')).toBe(false);
  });

  it('video hakkı: son 60 sn\'nin ₺\'si cüzdana, hak düşer', () => {
    useGame.setState({ gelirIzi: Array.from({ length: 13 }, (_, i) => i * 10), lifetime: D(120), wallet: D(0), reklam: defaultReklam() });
    const odul = useGame.getState().claimVideo();
    expect(odul).toBe(120);
    expect(useGame.getState().wallet.toNumber()).toBe(120);
    expect(videoRights(useGame.getState().reklam, Date.now()).kalan).toBe(3);
  });

  it('ödül parası kazanç izine girmez: arka arkaya videolar katlanmaz', () => {
    useGame.setState({ gelirIzi: Array.from({ length: 13 }, (_, i) => i * 10), lifetime: D(120), wallet: D(0), reklam: defaultReklam() });
    const a = useGame.getState().claimVideo();
    const b = useGame.getState().claimVideo();
    expect(b).toBe(a);
    useGame.setState({ levelUp: { level: 9, amount: 500, carryBefore: 0, carryAfter: 0 } });
    useGame.getState().claimLevelUp(true);
    expect(useGame.getState().claimVideo()).toBe(a);
  });

  it('reklam sayaçları kayda gider ve geri okunur', () => {
    useGame.setState({ reklam: { ustaGun: 42, ustaSayi: 1, videoPencere: 123, videoKullanilan: 2 } });
    useGame.getState().saveNow();
    expect(JSON.parse(mem[KEY]).reklam).toEqual({ ustaGun: 42, ustaSayi: 1, videoPencere: 123, videoKullanilan: 2 });
  });

  it('eski kayıt (alan yok) varsayılanla açılır — sürüm artmadı', () => {
    const eski = { ...defaultSave() } as Record<string, unknown>;
    delete eski.reklam;
    mem[KEY] = JSON.stringify(eski);
    expect(loadSave().reklam).toEqual(defaultReklam());
  });
});

describe('HUD kabloları', () => {
  const hud = oku('src/components/ui/HUD.tsx');
  it('seviye, çevrimdışı (ek > 0 iken) ve günlük görev ekranları "İzle"ye bağlı', () => {
    expect(hud).toContain('onIzle={() => claimLevelUp(true)}');
    expect(hud).toContain('onIzle={offlineIzleEki > 0 ? () => claimOffline(true) : undefined}');
    expect(hud).toMatch(/onIzle=\{\(\) => \{\s*claimDailyQuest\(gunOdul\.id, true\);/);
  });
  it('hedef ekranında "İzle" YOK (hedef 💎 2× Usta kuyruğunu bitiriyordu)', () => {
    const i = hud.indexOf('testid="goal-reward"');
    const blok = hud.slice(i, hud.indexOf('/>', i));
    expect(blok).not.toContain('onIzle');
  });
  it('ödül YALNIZ video izlenince verilir', () => {
    expect(hud).toMatch(/if \(await odulluIzle\(\)\) onIzle\(\);/);
    expect(hud).toMatch(/if \(await odulluIzle\(\)\) buyMasterAd\(id\);/);
    expect(hud).toMatch(/if \(await odulluIzle\(\)\) claimVideo\(\);/);
  });
});
