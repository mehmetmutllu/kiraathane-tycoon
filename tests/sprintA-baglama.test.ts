/**
 * sprintA-baglama.test.ts — Sprint A'nın store BAĞLANTISI (orkestratör): mağaza uzlaşması kayda
 * gerçekten işleniyor mu. Saf kurallar `iap-sprintA.test.ts`te; burada store yan etkileri.
 * Kol A (2026-10-09): Başlangıç Paketi geri yüklemesi kıyafet + 100 💎 verir, bir kayıtta bir kez.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { economyConfig as C } from '../src/config/economy.config';
import { iapConfig } from '../src/config/iap.config';
import { useGame } from '../src/game/store';
import { D } from '../src/game/decimal';
import type { MusteriOzu } from '../src/game/satinAlimUzlas';
import { defaultSatinAlim } from '../src/game/save';

const U = iapConfig.urun;
const m = (o: Partial<MusteriOzu> & { baslangic?: boolean } = {}): MusteriOzu => ({
  kimlik: o.kimlik ?? 'k1',
  hak: { reklamsiz: false, baslangic: o.baslangic ?? false },
  islemler: o.islemler ?? [],
});

beforeEach(() => {
  useGame.getState().hardReset();
  // hardReset satın alımları KORUR (mağaza malı) — her test sıfır satın alımla başlar.
  useGame.setState({ diamonds: D(0), satin: defaultSatinAlim(), outfit: 'klasik' });
  useGame.getState().magazaUzlasUygula(m()); // eski kayıt → uzlasmaBasi = şimdi
});

describe('mağaza uzlaşması store\'da', () => {
  it('yeni cihazda geri yükleme: kurucu kıyafeti + başlangıç 💎 bir kez', () => {
    expect(useGame.getState().magazaUzlasUygula(m({ baslangic: true }))).toBe(C.iap.starterDiamonds);
    expect(useGame.getState().outfit).toBe('kurucu');
    expect(useGame.getState().satin.baslangic).toBe(true);
    expect(useGame.getState().magazaUzlasUygula(m({ baslangic: true }))).toBe(0);
    expect(useGame.getState().diamonds.toNumber()).toBe(C.iap.starterDiamonds);
  });

  it('doğrudan alınan paket sonra geri yüklenince 💎 ikinci kez gelmez', () => {
    const elmas = useGame.getState().satinAlimIsle({ islem: 't1', urun: U.baslangic });
    expect(elmas).toBe(C.iap.starterDiamonds);
    expect(useGame.getState().satin.baslangicElmas).toBe(true);
    useGame.getState().magazaUzlasUygula(m({ baslangic: true, islemler: [{ kimlik: 't1', urun: U.baslangic, tarih: Date.now() }] }));
    expect(useGame.getState().diamonds.toNumber()).toBe(C.iap.starterDiamonds);
  });

  it('kapanan uygulamanın onaylı elmas işlemi sonraki uzlaşmada bir kez ödenir', () => {
    const islem = { kimlik: 'e1', urun: U.elmas[0], tarih: Date.now() + 1000 };
    const once = useGame.getState().magazaUzlasUygula(m({ islemler: [islem] }));
    expect(once).toBe(C.iap.diamondPacks[0]);
    expect(useGame.getState().magazaUzlasUygula(m({ islemler: [islem] }))).toBe(0);
    expect(useGame.getState().diamonds.toNumber()).toBe(C.iap.diamondPacks[0]);
  });

  it('uzlaşma kayda yazılır (yeniden açılışta tekrar ödenmez)', () => {
    const mem: Record<string, string> = {};
    const g = globalThis as Record<string, unknown>;
    const orig = g.localStorage;
    g.localStorage = {
      getItem: (k: string) => (k in mem ? mem[k] : null),
      setItem: (k: string, v: string) => { mem[k] = v; },
      removeItem: (k: string) => { delete mem[k]; },
    };
    try {
      const islem = { kimlik: 'e2', urun: U.elmas[0], tarih: Date.now() + 1000 };
      useGame.getState().magazaUzlasUygula(m({ islemler: [islem] }));
      useGame.getState().init();
      expect(useGame.getState().satin.islenen).toContain('e2');
      expect(useGame.getState().magazaUzlasUygula(m({ islemler: [islem] }))).toBe(0);
    } finally {
      if (orig === undefined) delete g.localStorage; else g.localStorage = orig;
    }
  });
});
