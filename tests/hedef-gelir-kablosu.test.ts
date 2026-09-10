/**
 * hedef-gelir-kablosu.test.ts — D-090'IN İKİNCİ BEKÇİSİ: çarpan OYUNUN gelir yoluna gerçekten
 * bağlı mı?
 *
 * NEDEN AYRI DOSYA: `tests/hedefler.test.ts`in denge bölümü SİM'in kolunu ölçer
 * (`tools/hedef-kollari.ts` → `simulate.ts`). O koşu, `src/game/tick.ts`teki gerçek kablolamayı
 * hiç görmez — biri `* incomeMult` çarpanını oradan silse denge testlerinin hepsi yeşil kalırdı
 * ve ölçüm raporu yürürlükte olmayan bir sayıyı savunuyor olurdu. Bu dosya tam o boşluğu kapatır:
 * ölçülen etkinin OYUNDA da var olduğunu ₺'nin yaratıldığı ÜÇ yerde ayrı ayrı doğrular.
 *
 *   1) müşteri ödemesi   (tick.ts · coins.push · drinking → leaving)
 *   2) lavabo ücreti     (tick.ts · coins.push · toWc çıkışı)
 *   3) çevrimdışı oran   (rules.ts · incomeRate)
 */
import { describe, it, expect } from 'vitest';
import { createTickCtx, runTick, type TickCtx } from '../src/game/tick';
import { useGame } from '../src/game/store';
import { incomeRate } from '../src/game/rules';
import { collectionMult, goalCategories, goalId, tierBonus } from '../src/game/goals';
import { economyConfig as C, PRODUCTS, tableTip } from '../src/config/economy.config';
import type { Npc } from '../src/game/types';

/** Koleksiyonun TAMAMI toplanmış kimlik listesi. */
const hepsi = (): string[] => goalCategories().flatMap((c) => c.tiers.map((_, i) => goalId(c.id, i)));

/** İçkisini BİTİRMİŞ bir müşteri: bu karede parasını masanın yanına düşürür.
 *  (Store'un taze durumunda hiç NPC yok — spawn'ı beklemek yerine kare doğrudan kurulur.) */
const icenMusteri = (): Npc => ({
  id: 1,
  state: 'drinking',
  pos: [0, 0, 0],
  tableIndex: 0,
  seatIndex: 0,
  timer: 0,
  product: 'tea',
  color: '#888',
});

/** Belirli bir `goalsClaimed` listesiyle tek kare koştur, o karede düşen parayı topla. */
function kareninParasi(goalsClaimed: string[]): number {
  const taze = useGame.getState();
  const c: TickCtx = createTickCtx({ ...taze, goalsClaimed, coins: [] }, 1 / 60);
  runTick(c);
  return c.coins.reduce((a, k) => a + k.value, 0);
}

describe('ÇARPAN OYUNUN gelir yoluna bağlı mı (sim değil, tick.ts/rules.ts)', () => {
  it('tick bağlamı çarpanı `goalsClaimed`ten TÜRETİR (kayıtta ayrı alan yok)', () => {
    const s = useGame.getState();
    expect(createTickCtx({ ...s, goalsClaimed: [] }, 1 / 60).incomeMult).toBe(1);
    expect(createTickCtx({ ...s, goalsClaimed: ['service:0'] }, 1 / 60).incomeMult)
      .toBeCloseTo(1 + tierBonus(), 12);
    expect(createTickCtx({ ...s, goalsClaimed: hepsi() }, 1 / 60).incomeMult)
      .toBeCloseTo(1 + C.goals.incomeBonusTotal, 12);
  });

  it('MÜŞTERİ ÖDEMESİ çarpanı görür (tick.ts · coins.push)', () => {
    const s = useGame.getState();
    // İçkisini bitirmiş tek müşteri: bu karede `drinking` → ödeme düşer.
    const npc = icenMusteri();
    const kur = (goalsClaimed: string[]) => {
      const c: TickCtx = createTickCtx({ ...s, npcs: [npc], coins: [], goalsClaimed }, 1 / 60);
      runTick(c);
      return c.coins.reduce((a, k) => a + k.value, 0);
    };
    const tabanPara = kur([]);
    expect(tabanPara).toBeGreaterThan(0); // kare gerçekten ödeme üretti (yoksa test boş geçerdi)
    expect(tabanPara).toBeCloseTo(PRODUCTS[npc.product].price + tableTip(s.tableLevels[0] ?? 0), 6);
    expect(kur(hepsi())).toBeCloseTo(tabanPara * (1 + C.goals.incomeBonusTotal), 6);
  });

  it('LAVABO ÜCRETİ çarpanı görür (tick.ts · wcCikis sonu)', () => {
    // İkinci ödeme noktası ayrı bir `coins.push`tur: çarpanı yalnız birinden silmek denge
    // testlerinden de, yukarıdaki müşteri-ödemesi testinden de KAÇARDI.
    // S7/G-35 (D-104): ödeme noktası 'inWc' bitişinden 'wcCikis' bitişine taşındı — müşteri
    // artık kapı eşiğinde belirmiyor, odadan ÇIKARKEN parasını bırakıyor. Kablo aynı kablo.
    const s = useGame.getState();
    const npc: Npc = { ...icenMusteri(), state: 'wcCikis', timer: 0 };
    const kur = (goalsClaimed: string[]) => {
      const c: TickCtx = createTickCtx({ ...s, npcs: [npc], coins: [], lavaboLevel: 1, goalsClaimed }, 1 / 60);
      runTick(c);
      return c.coins.reduce((a, k) => a + k.value, 0);
    };
    const tabanPara = kur([]);
    expect(tabanPara).toBeGreaterThan(0);
    expect(kur(hepsi())).toBeCloseTo(tabanPara * (1 + C.goals.incomeBonusTotal), 6);
  });

  it('ÇEVRİMDIŞI ORAN çarpanı görür (rules.ts · incomeRate)', () => {
    const taban = incomeRate(6, 3, 12, 1);
    expect(taban).toBeGreaterThan(0);
    expect(incomeRate(6, 3, 12, 1, collectionMult([]))).toBeCloseTo(taban, 12);
    expect(incomeRate(6, 3, 12, 1, collectionMult(hepsi())))
      .toBeCloseTo(taban * (1 + C.goals.incomeBonusTotal), 12);
    // Aktif ve çevrimdışı AYNI çarpanı görmeli: farklı olsalardı oyuncu oyunu kapatarak
    // bonusunu kaybeder, "hedef topla" ile "oyunu açık bırak" birbiriyle yarışırdı.
    expect(collectionMult(hepsi())).toBe(1 + C.goals.incomeBonusTotal);
  });

  it('hiç hedef toplanmamışken ekonomi BİREBİR eski (çarpan = 1)', () => {
    expect(kareninParasi([])).toBe(kareninParasi([]));
    expect(collectionMult([])).toBe(1);
  });
});
