/**
 * usta.test.ts — D-093'ÜN BEKÇİSİ: Usta katmanı OYUNDA gerçekten bağlı mı, ve doğru YERE mi?
 *
 * NEDEN GEREKLİ (D-090'ın dersi, D-092'de bir kez daha öğrenildi): denge testleri SİM'in kolunu
 * ölçer (`tools/usta-kollari.ts` → `simulate.ts`) ve `src/game/tick.ts`teki gerçek kablolamayı
 * hiç görmez. Biri `tick.ts`ten `masterTip` çarpanını silse bütün denge testleri yeşil kalırdı ve
 * ölçüm raporu yürürlükte OLMAYAN bir sayıyı savunuyor olurdu.
 *
 * BU DOSYA FORMÜLÜ DEĞİL KAREYİ KOŞTURUR (D-092'nin mutasyon M1'inin dersi): `masterTipMult`in
 * doğru sayıyı döndürmesi yetmez — o sayının ₺'nin yaratıldığı yere gerçekten binmesi gerekir.
 *
 * ÖLÇÜM: `docs/elmas-raporu-d7.md` (tam koşu). Buradaki bantlar oradan gelir, tahminden değil.
 */
import { describe, it, expect } from 'vitest';
import { createTickCtx, runTick, type TickCtx } from '../src/game/tick';
import { useGame } from '../src/game/store';
import {
  masterId, masterCost, masterTipMult, masterTipsOf, masterUnlockedForTable, tableSoftMaxLevel,
} from '../src/game/rules';
import { economyConfig as C, PRODUCTS, tableTip } from '../src/config/economy.config';
import { D } from '../src/game/decimal';
import { loadSave, defaultSave, SAVE_VERSION } from '../src/game/save';
import type { Npc } from '../src/game/types';

const KEY = 'kiraathane.save';

/** localStorage'ı bellek sözlüğüyle değiştirir (`tests/gorev-kimligi.test.ts`teki desen). */
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

/** İçkisini BİTİRMİŞ bir müşteri: bu karede parasını masanın yanına düşürür. */
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

/** 0. masası ₺ TAVANINDA olan bir durum — Usta ancak orada açılır. */
function tavandakiDurum() {
  const s = useGame.getState();
  const tableLevels = s.tableLevels.slice();
  tableLevels[0] = tableSoftMaxLevel();
  return { ...s, tableLevels };
}

/** Tek kare koştur, o karede düşen parayı topla. */
function kareninParasi(mastersOwned: string[]): number {
  const s = tavandakiDurum();
  const c: TickCtx = createTickCtx(
    { ...s, npcs: [icenMusteri()], coins: [], mastersOwned }, 1 / 60);
  runTick(c);
  return c.coins.reduce((a, k) => a + k.value, 0);
}

describe('Usta katmanı — ölçülen sayılar (D-093)', () => {
  it('config ölçülen dozları taşıyor', () => {
    // Doz ×1,5 ÖLÇÜLEREK seçildi (zincir %-3,0 · en uzun 33,8 → 30,4 dk); ×2 (planın dozu)
    // eşiğin altındaydı ama iki turun bileşiği yüzünden alınmadı. Fiyat 25 💎 kuyruk koludur.
    expect(C.master.tipMult).toBe(1.5);
    expect(C.master.diamondCost).toBe(25);
    // Günlük arz DEFTERDEN geldi: 25 💎 fiyatta kalan 16 hedef 40 günde biter → 2,50 gün/Usta,
    // yani planın "~2,5 günde bir Usta" vaadi birebir korunur. 6 💎/gün bunu 4,17'ye düşürürdü.
    expect(C.dailyQuests.diamondsPerDay).toBe(10);
    const kalanHedef = 26 - Math.floor(250 / C.master.diamondCost);
    const gunBasinaUsta = (kalanHedef * C.master.diamondCost) / C.dailyQuests.diamondsPerDay / kalanHedef;
    expect(gunBasinaUsta).toBeCloseTo(2.5, 2);
  });

  it('çarpan KİMLİK listesinden türer (kayıtta "kaç Usta" alanı yok)', () => {
    expect(masterTipsOf([], 4)).toEqual([1, 1, 1, 1]);
    expect(masterTipsOf([masterId('table', 2)], 4)).toEqual([1, 1, C.master.tipMult, 1]);
    // Tanınmayan kimlik hiçbir masayı Usta yapmaz (kimlik kalıbı bozulursa sessizce bonus vermesin).
    expect(masterTipsOf(['masa:0', 'table:99'], 2)).toEqual([1, 1]);
    expect(masterTipMult(false)).toBe(1);
  });
});

describe('Usta OYUNUN gelir yoluna bağlı mı (tick.ts — sim değil)', () => {
  it('Usta masa DAHA ÇOK ödüyor ve fark TAM OLARAK bahşişin çarpanı kadar', () => {
    const s = tavandakiDurum();
    const seviye = s.tableLevels[0];
    const fiyat = PRODUCTS.tea.price;
    const bahsis = tableTip(seviye);

    const taban = kareninParasi([]);
    expect(taban).toBeGreaterThan(0); // kare gerçekten ödeme üretti (yoksa test boş geçerdi)
    expect(taban).toBeCloseTo(fiyat + bahsis, 6);

    const usta = kareninParasi([masterId('table', 0)]);
    // ÇARPAN YALNIZ BAHŞİŞE BİNER. Bu satır iki mutasyonu birden yakalar: çarpanı silmek
    // (usta === taban) ve çarpanı ÜRÜN FİYATINA da uygulamak (ölçülmemiş gelir yaratmak).
    expect(usta).toBeCloseTo(fiyat + bahsis * C.master.tipMult, 6);
    expect(usta).not.toBeCloseTo((fiyat + bahsis) * C.master.tipMult, 6);
    expect(usta).toBeGreaterThan(taban);
  });

  it('BAŞKA masanın Usta`sı bu masanın bahşişini büyütmez (çarpan masa-başı)', () => {
    expect(kareninParasi([masterId('table', 1)])).toBeCloseTo(kareninParasi([]), 6);
  });

  it('hiç Usta alınmamışken ekonomi BİREBİR eski', () => {
    const s = tavandakiDurum();
    expect(createTickCtx({ ...s, mastersOwned: [] }, 1 / 60).masterTip.every((m) => m === 1)).toBe(true);
    // Eski kayıt (alan hiç yok) da tabanla aynı olmalı — sürüm artmadı, alan additive.
    const eski = { ...s } as Record<string, unknown>;
    delete eski.mastersOwned;
    const c = createTickCtx(eski as never, 1 / 60);
    expect(c.masterTip.every((m) => m === 1)).toBe(true);
  });
});

describe('Usta satın alma kuralı (store.ts · buyMaster)', () => {
  const kur = (yama: Record<string, unknown>) => {
    const s = useGame.getState();
    const tableLevels = s.tableLevels.slice();
    tableLevels[0] = tableSoftMaxLevel();
    useGame.setState({ tableLevels, mastersOwned: [], diamonds: D(1000), ...yama });
  };

  it('₺ TAVANI şartı aranır — Usta kritik yol dışıdır (plan K6)', () => {
    // Bu şart ölçülmüş bir karardır: kalkarsa personel kanalı ×1,25`te bile zinciri %13,4
    // kısaltıyor (rapor §2 Bulgu 4), yani Kat 1 içeriğini yer.
    expect(masterUnlockedForTable(tableSoftMaxLevel())).toBe(true);
    expect(masterUnlockedForTable(tableSoftMaxLevel() - 1)).toBe(false);

    const s = useGame.getState();
    const altSeviye = s.tableLevels.slice();
    altSeviye[0] = tableSoftMaxLevel() - 1;
    kur({ tableLevels: altSeviye });
    expect(useGame.getState().buyMaster(masterId('table', 0))).toBe(false);
    expect(useGame.getState().mastersOwned).toEqual([]);
  });

  it('💎 yetmezse alınmaz ve hiçbir şey değişmez', () => {
    kur({ diamonds: D(masterCost() - 1) });
    expect(useGame.getState().buyMaster(masterId('table', 0))).toBe(false);
    expect(useGame.getState().mastersOwned).toEqual([]);
    expect(useGame.getState().diamonds.toNumber()).toBe(masterCost() - 1);
  });

  it('alınca 💎 DÜŞER ve kimlik listeye girer; ikinci kez alınamaz', () => {
    kur({ diamonds: D(100) });
    expect(useGame.getState().buyMaster(masterId('table', 0))).toBe(true);
    expect(useGame.getState().mastersOwned).toEqual([masterId('table', 0)]);
    expect(useGame.getState().diamonds.toNumber()).toBe(100 - masterCost());
    // İkinci alım reddedilmeli — yoksa oyuncu aynı masayı sonsuz kez satın alıp 💎 yakardı.
    expect(useGame.getState().buyMaster(masterId('table', 0))).toBe(false);
    expect(useGame.getState().mastersOwned).toEqual([masterId('table', 0)]);
    expect(useGame.getState().diamonds.toNumber()).toBe(100 - masterCost());
  });

  it('açık olmayan masa alınamaz (kimlik uydurmak işe yaramaz)', () => {
    kur({});
    const s = useGame.getState();
    expect(s.buyMaster(masterId('table', s.tables + 5))).toBe(false);
    expect(useGame.getState().buyMaster('table:-1')).toBe(false);
    expect(useGame.getState().buyMaster('sacma')).toBe(false);
    expect(useGame.getState().mastersOwned).toEqual([]);
  });

  it('satın alınan Usta KAYITTA durur — ve kayıt sürümü ARTMADI', () => {
    withStorage(null, () => {
      kur({ diamonds: D(100) });
      expect(useGame.getState().buyMaster(masterId('table', 0))).toBe(true);
      const kayit = loadSave();
      expect(kayit.mastersOwned).toEqual([masterId('table', 0)]);
      // Alan ADDITIVE: `goalsClaimed`in v32'deki deseni. Sürüm artsaydı her oyuncunun kaydı
      // göç yolundan geçerdi — bu turda buna gerek yok.
      expect(kayit.saveVersion).toBe(SAVE_VERSION);
      expect(SAVE_VERSION).toBe(33);
    });
  });

  it('ALANI OLMAYAN eski kayıt boş listeyle okunur (göç gerekmiyor)', () => {
    const eski = { ...defaultSave() } as Record<string, unknown>;
    delete eski.mastersOwned;
    withStorage(JSON.stringify(eski), () => {
      expect(loadSave().mastersOwned).toEqual([]);
    });
  });
});
