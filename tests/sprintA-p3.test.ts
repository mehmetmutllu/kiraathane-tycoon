/**
 * sprintA-p3.test.ts — Sprint A P3'ün BEKÇİSİ (tarama raporu 2026-10-09 §3 "Görev hattı + küçükler").
 *
 * ① Pad onarımı (Y-23) index'i geri çekince kayıt ilerideki görev kimliklerini SİLİYORDU ve hat
 *    yeniden yürürken aradaki görevler ₺+XP'yi ikinci kez ödüyordu. Kaynak artık `questsDone`.
 * ② `teasServedByArea` tick bağlamında klonlanmıyordu: önceki durumun dizisi yerinde değişiyordu.
 * ③ Gece yarısı ödül kartı açıkken gün dönerse günlük görevin 💎'ı kayboluyordu.
 */
import { describe, it, expect } from 'vitest';
import { economyConfig as C } from '../src/config/economy.config';
import { completedQuestIds } from '../src/game/questProgress';
import { loadSave } from '../src/game/save';
import { useGame } from '../src/game/store';
import { createTickCtx } from '../src/game/tick';
import { dayIndex, diamondsFor, rollDaily, type DailyCounters } from '../src/game/dailyQuests';
import { D } from '../src/game/decimal';

const KEY = 'kiraathane.save';

function withStorage(fn: () => void): void {
  const mem: Record<string, string> = {};
  const g = globalThis as Record<string, unknown>;
  const orig = g.localStorage;
  g.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
  try { fn(); } finally { if (orig === undefined) delete g.localStorage; else g.localStorage = orig; }
}

const padlar = (n: number) =>
  C.quests.slice(0, n).flatMap((x) => (x.target.type === 'pad' ? [x.target.id] : []));

describe('① geri çekilen görev hattı kimlik silmez, ikinci kez ödemez', () => {
  const ilkPad = C.quests.findIndex((x) => x.target.type === 'pad');
  const ileri = ilkPad + 6;
  const eksikPad = (C.quests[ilkPad].target as { id: string }).id;

  function geriCekilmis() {
    useGame.getState().hardReset();
    useGame.setState({
      questIndex: ilkPad,
      questsDone: completedQuestIds(C.quests, ileri),
      padsDone: padlar(ileri).filter((p) => p !== eksikPad),
      questPhase: 'active',
      wallet: D(0),
      lifetime: D(0),
    });
  }

  it('kayıt ilerideki kimlikleri korur', () => {
    withStorage(() => {
      geriCekilmis();
      useGame.getState().saveNow();
      expect(loadSave().questsDone).toEqual(completedQuestIds(C.quests, ileri));
      expect(localStorage.getItem(KEY)).not.toBeNull();
    });
  });

  it('eksik pad alınınca ödül/XP verilmez ve hat kaldığı yere döner', () => {
    withStorage(() => {
      geriCekilmis();
      const xp0 = useGame.getState().xp;
      useGame.setState({ padsDone: [...useGame.getState().padsDone, eksikPad] });
      useGame.getState().tick(1 / 60);
      const g = useGame.getState();
      expect(g.questIndex).toBe(ileri);
      expect(g.wallet.toNumber()).toBe(0);
      expect(g.xp).toBe(xp0);
    });
  });

  it('ilk kez biten görev normal öder ve kimliği listeye girer', () => {
    withStorage(() => {
      useGame.getState().hardReset();
      useGame.setState({ questIndex: ilkPad, questsDone: completedQuestIds(C.quests, ilkPad), padsDone: padlar(ilkPad) });
      const xp0 = useGame.getState().xp;
      useGame.setState({ padsDone: [...useGame.getState().padsDone, eksikPad] });
      useGame.getState().tick(1 / 60);
      const g = useGame.getState();
      expect(g.questIndex).toBe(ilkPad + 1);
      expect(g.questsDone).toContain(C.quests[ilkPad].id);
      expect(g.xp).toBe(xp0 + C.xp.perQuest);
    });
  });
});

describe('② tick önceki durumun sayaç dizisini değiştirmez', () => {
  it('teasServedByArea bağlamda klonlanır', () => {
    withStorage(() => {
      useGame.getState().hardReset();
      const s = useGame.getState();
      const c = createTickCtx(s, 1 / 60);
      expect(c.stats.teasServedByArea).not.toBe(s.stats.teasServedByArea);
      expect(c.stats.teasServedByArea).toEqual(s.stats.teasServedByArea);
    });
  });
});

describe('③ gece yarısı dönen gün hazır ödülü yutmaz', () => {
  const dolu = (): DailyCounters =>
    ({ served: 1e6, hand: 1e6, coins: 1e6, dishes: 1e6, earn: 1e6, pickup: 1e6, waiter: 1e6, tost: 1e6 });
  const sifir = (): DailyCounters =>
    ({ served: 0, hand: 0, coins: 0, dishes: 0, earn: 0, pickup: 0, waiter: 0, tost: 0 });
  const ctx = { tables: 4, hasWaiter: true, tostOpen: true };

  it('gün dönümü hazır-alınmamış ödülleri önceki güne yazar', () => {
    const dun = rollDaily(undefined, 90, ctx, sifir());
    const bugun = rollDaily({ ...dun, claimed: [dun.ids[0]] }, 91, ctx, dolu());
    expect(bugun.onceki?.day).toBe(90);
    expect(Object.keys(bugun.onceki!.hazir)).toEqual(dun.ids.slice(1));
  });

  it('dünkü kartla alınır, bir kez; bugünün görevine dokunmaz', () => {
    withStorage(() => {
      useGame.getState().init();
      const bugunNo = dayIndex(Date.now());
      const id = 'serve';
      useGame.setState({
        diamonds: D(0),
        daily: { day: bugunNo, ids: [], base: {}, claimed: [], onceki: { day: bugunNo - 1, hazir: { [id]: 4 } } },
      });
      expect(useGame.getState().claimDailyQuest(id, false, bugunNo - 1)).toBe(true);
      expect(useGame.getState().diamonds.toNumber()).toBe(4);
      expect(useGame.getState().claimDailyQuest(id, false, bugunNo - 1)).toBe(false);
      expect(useGame.getState().diamonds.toNumber()).toBe(4);
      expect(useGame.getState().daily.claimed).toEqual([]);
      expect(useGame.getState().daily.onceki).toBeUndefined();
    });
  });

  it('izlenmiş reklam çarpanı önceki günün ödülüne de uygulanır', () => {
    withStorage(() => {
      useGame.getState().init();
      const bugunNo = dayIndex(Date.now());
      useGame.setState({
        diamonds: D(0),
        daily: { day: bugunNo, ids: [], base: {}, claimed: [], onceki: { day: bugunNo - 1, hazir: { serve: diamondsFor(0, 3) } } },
      });
      useGame.getState().claimDailyQuest('serve', true, bugunNo - 1);
      expect(useGame.getState().diamonds.toNumber()).toBe(diamondsFor(0, 3) * C.rewarded.claimMult);
    });
  });
});
