/**
 * itibar.test.ts — D-092'NİN BEKÇİSİ: İtibar seviyesinin ödülü OYUNUN taşıma yoluna bağlı mı?
 *
 * NEDEN BU DOSYA: ölçüm `tools/olcum-itibar.ts` → `simulate.ts` üstünden yapıldı; o koşu
 * `src/game/tick.ts`teki gerçek kablolamayı HİÇ görmez. Biri `* c.carryMult` çarpanını oradan
 * silse ölçüm raporu yürürlükte olmayan bir sayıyı savunuyor olurdu (D-090'ın en pahalı dersi,
 * `hedef-gelir-kablosu.test.ts`in varlık sebebi). Burada üç şey ayrı ayrı çivilenir:
 *
 *   1) TÜRETME   — çarpan `xp`ten türer, kayıtta ayrı alan yok (kayıt sürümü artmadı).
 *   2) DOZ       — %2/sv ÖLÇÜLEN dozdur; sayı doğrudan çivilenir (D-090 M9: "config'ten okuyup
 *                  config'e karşı test etmek" mutasyonu kaçırıyordu — ölçülen sayı yazılır).
 *   3) KABLO     — oyuncu VE garson hareketi çarpanı görür; bulaşıkçı GÖRMEZ (ölçülen kol
 *                  yalnız `carryRateOf`a biniyordu, `washRateOf`a değil).
 */
import { describe, it, expect } from 'vitest';
import { createTickCtx, runTick, type TickCtx } from '../src/game/tick';
import { useGame, LAYOUT, servicePlace, parkSpot } from '../src/game/store';
import {
  economyConfig as C, levelProgress, reputationCarryMult, waiterSpeedFor, dishSpeedFor, playerSpeedFor, xpForLevel,
} from '../src/config/economy.config';
import type { Npc, Vec3 } from '../src/game/types';

/** `hedef` seviyesine tam yetecek toplam XP. */
function xpForSeviye(hedef: number): number {
  let toplam = 0;
  for (let L = 1; L < hedef; L++) toplam += xpForLevel(L);
  return toplam;
}

describe('D-092 — İtibar çarpanının TÜRETİLMESİ', () => {
  it('L1 ödülsüzdür (yeni oyuncu tabanla başlar)', () => {
    expect(reputationCarryMult(1)).toBe(1);
    expect(reputationCarryMult(0)).toBe(1); // bozuk/eksik girdi de tabana düşer
  });

  it('ÖLÇÜLEN doz %2/seviye — sayı çivili (config sapsa test kırılır)', () => {
    // Bilerek config'ten OKUNMUYOR: `1 + (L-1) * C.xp.carryBonusPerLevel` yazsaydık config'i
    // %5'e çeken bir mutasyon testten geçerdi ve rapor yürürlükte olmayan bir sayıyı savunurdu.
    expect(reputationCarryMult(2)).toBeCloseTo(1.02, 12);
    expect(reputationCarryMult(7)).toBeCloseTo(1.12, 12);
    expect(reputationCarryMult(13)).toBeCloseTo(1.24, 12);
    expect(C.xp.carryBonusPerLevel).toBe(0.02);
  });

  it('seviyeyle DOĞRUSAL ve monoton artar', () => {
    for (let L = 1; L < 20; L++) {
      expect(reputationCarryMult(L + 1)).toBeGreaterThan(reputationCarryMult(L));
      expect(reputationCarryMult(L + 1) - reputationCarryMult(L)).toBeCloseTo(0.02, 12);
    }
  });

  it('tick bağlamı çarpanı `xp`ten TÜRETİR — kayıtta ayrı alan yok', () => {
    const s = useGame.getState();
    expect(createTickCtx({ ...s, xp: 0 }, 1 / 60).carryMult).toBe(1);
    const xp7 = xpForSeviye(7);
    expect(levelProgress(xp7).level).toBe(7); // yardımcı doğru mu (test kendi kendini kandırmasın)
    expect(createTickCtx({ ...s, xp: xp7 }, 1 / 60).carryMult).toBeCloseTo(reputationCarryMult(7), 12);
  });
});

/* ─────────────── KABLO: çarpan gerçekten HAREKETE biniyor mu ───────────────
 * Bu bölüm FORMÜL doğrulamaz, GERÇEK KAREYİ koşturur. İlk hâli `waiterSpeedFor(0) * carryMult`
 * yazıyordu ve `tick.ts`ten `* c.carryMult` silinse yeşil kalıyordu — yani bu dosyanın var olma
 * sebebini ıskalıyordu. Şimdi garson gerçekten yürütülüyor ve KAT ETTİĞİ YOL ölçülüyor.
 */
const PARK = parkSpot();

/** Pad zinciri TEK KAYNAKTAN (`bardak.test.ts` ile aynı desen — elle liste tutulmaz). */
const zincireKadar = (son: string): string[] => {
  const i = C.pads.findIndex((p) => p.id === son);
  if (i < 0) throw new Error(`pad yok: ${son}`);
  return C.pads.slice(0, i + 1).map((p) => p.id);
};

const musteri = (id: number, tableIndex: number): Npc => ({
  id, state: 'waitingForTea', pos: [...LAYOUT.tables[tableIndex].seats[0]] as Vec3,
  tableIndex, seatIndex: 0, timer: 999, product: 'tea', color: '#27ae60',
});

/**
 * Garsonu tepsisinde çayla, uzaktaki bir masaya doğru N kare yürütür; kat ettiği YOLU döndürür.
 * Aynı başlangıç, aynı hedef, tek fark `xp` → yol farkı yalnız çarpandan gelebilir.
 */
function garsonYolu(xp: number, kare = 20): number {
  useGame.getState().hardReset();
  const wPos = servicePlace(1).pickup;
  useGame.setState({
    xp,
    padsDone: zincireKadar('waiter'),
    waiters: [{ pos: [wPos[0], 0.6, wPos[2]] as Vec3, tray: 1, trayFood: 0, dirtyCarry: 0 }],
    npcs: [musteri(900, 0)],
    dishes: [], cleanCups: 5,
    player: PARK, inputKeyboard: [0, 0], inputJoystick: [0, 0], spawnTimer: 999,
  });
  const bas = [...useGame.getState().waiters[0].pos] as Vec3;
  let yol = 0;
  let onceki = bas;
  for (let k = 0; k < kare; k++) {
    useGame.getState().tick(1 / 60);
    const w = useGame.getState().waiters[0];
    if (!w) break;
    yol += Math.hypot(w.pos[0] - onceki[0], w.pos[2] - onceki[2]);
    onceki = [...w.pos] as Vec3;
  }
  return yol;
}

/** Bulaşıkçıyı kirli bardağa doğru yürütür; kat ettiği yolu döndürür (çarpanı GÖRMEMELİ). */
function bulasikciYolu(xp: number, kare = 20): number {
  useGame.getState().hardReset();
  const t0 = LAYOUT.tables[0].table;
  useGame.setState({
    xp,
    padsDone: zincireKadar('dishwasher'),
    npcs: [], cleanCups: 0,
    dishes: [{ id: 7001, pos: [t0[0], 0.95, t0[2]] as Vec3, tableIndex: 0, kind: 'cup' }],
    player: PARK, inputKeyboard: [0, 0], inputJoystick: [0, 0], spawnTimer: 999,
  });
  // Bulaşıkçı ilk tick'te doğar (store'da `null` başlar, `dishwasherSystem` kurar) — bu yüzden
  // başlangıç noktası bir kare KOŞTURULDUKTAN sonra okunur.
  useGame.getState().tick(1 / 60);
  const d0 = useGame.getState().dishwasher;
  if (!d0) return NaN;
  let yol = 0;
  let onceki = [...d0.pos] as Vec3;
  for (let k = 0; k < kare; k++) {
    useGame.getState().tick(1 / 60);
    const d = useGame.getState().dishwasher;
    if (!d) break;
    yol += Math.hypot(d.pos[0] - onceki[0], d.pos[2] - onceki[2]);
    onceki = [...d.pos] as Vec3;
  }
  return yol;
}

describe('D-092 — çarpan OYUNUN taşıma yoluna bağlı mı (sim değil, tick.ts)', () => {
  it('OYUNCU hareketi çarpanı görür: aynı girdi, yüksek itibarda daha uzun adım', () => {
    const taze = useGame.getState();
    const girdi: [number, number] = [1, 0];
    // Kare sonucu `c.player`a yazılır (sistemler durum nesnesini değil ctx'i yazar).
    const adim = (xp: number): number => {
      const c = createTickCtx({ ...taze, xp, inputKeyboard: girdi, inputJoystick: [0, 0] }, 1 / 60);
      const x0 = c.s.player[0];
      runTick(c);
      return Math.abs(c.player[0] - x0);
    };
    const a1 = adim(0);
    const a7 = adim(xpForSeviye(7));
    expect(a1).toBeGreaterThan(0); // hareket hiç olmuyorsa test bir şey ölçmüyor demektir
    expect(a7 / a1).toBeCloseTo(reputationCarryMult(7), 3);
  });

  it('GARSON gerçekten daha hızlı yürür (waiterSystem koşturuluyor, formül değil)', () => {
    const y1 = garsonYolu(0);
    const y7 = garsonYolu(xpForSeviye(7));
    expect(y1).toBeGreaterThan(0.1); // garson hiç yürümediyse test bir şey ölçmüyor
    expect(y7 / y1).toBeCloseTo(reputationCarryMult(7), 2);
  });

  it('BULAŞIKÇI çarpanı GÖRMEZ — ölçülen kol yalnız taşımaydı', () => {
    // Bilinçli sınır: sim'de bulaşık debisi ayrı bir koldur (`washRateOf`) ve bu turda ölçülmedi.
    // Kol oraya da bindirilseydi rapordaki sayı yürürlükteki etkiyi eksik anlatırdı.
    const y1 = bulasikciYolu(0);
    const y7 = bulasikciYolu(xpForSeviye(7));
    expect(y1).toBeGreaterThan(0.1); // bulaşıkçı hiç yürümediyse test bir şey ölçmüyor
    expect(y7).toBeCloseTo(y1, 6);
  });

  it('kademe türeticileri SAF kalır — panel çarpanlı sayı göstermez', () => {
    // İtibar bonusu ayrı bir satır olarak gösterilir (HUD `rep-hero`); kademe değerinin içine
    // karışsaydı oyuncu "garson hızı 2,0" yazan yükseltmeyi alıp 2,24 alırdı ve panel yalan olurdu.
    expect(waiterSpeedFor(0)).toBe(C.waiter.speedUpgrades.speeds[0]);
    expect(playerSpeedFor(0)).toBeCloseTo(4.5);
    expect(dishSpeedFor(0)).toBe(C.dishwasher.speedUpgrades.speeds[0]);
  });
});
