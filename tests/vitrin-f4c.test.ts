/**
 * BEKÇİ — F4c 💎 kozmetik vitrini (kullanıcı seçimi 2026-09-24, `tools/vitrin-adaylari.html`).
 * Kıyafet + tepsi 💎 ile · kurucu (K4 bordo yelek + fes) YALNIZ başlangıç paketiyle · sahiplik tek
 * kaynaktan (paket iade → kıyafet düşer) · 💎 bir kez düşer · teklif ilk Usta'dan sonra BİR kez,
 * ekran kanallarının en sonunda · kayıt additive (eski kayıt 'klasik') · bulut teklifi korur.
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '../src/game/store';
import { baslangicTeklifiGoster, gecerliKiyafet, gecerliTepsi, vitrinSahip, vitrinUrunleri } from '../src/game/vitrin';
import { ekranKanali, type EkranGirdisi } from '../src/game/ekranKanali';
import { bulutlaBirlestir } from '../src/game/bulut';
import { defaultSatinAlim, defaultSave, kayitCoz } from '../src/game/save';
import { KIYAFET_GORUNUM, TEPSI_GORUNUM } from '../src/config/kozmetik';
import { iapConfig } from '../src/config/iap.config';
import { D } from '../src/game/decimal';

const mem: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};
const oku = (p: string) => readFileSync(p, 'utf8');
const bos = { ownedCosmetics: [] as string[], satin: { baslangic: false } };

describe('ürün listesi ve görünümler (tek kaynak)', () => {
  it('her ürünün bir görünümü var, her görünümün bir ürünü var', () => {
    expect(new Set(vitrinUrunleri('outfit').map((u) => u.id))).toEqual(new Set(Object.keys(KIYAFET_GORUNUM)));
    expect(new Set(vitrinUrunleri('tray').map((u) => u.id))).toEqual(new Set(Object.keys(TEPSI_GORUNUM)));
  });
  it('seçilen liste: kurucu + 5 kıyafet · 4 tepsi (+ klasikler)', () => {
    expect(vitrinUrunleri('outfit').map((u) => u.id)).toEqual(['klasik', 'kurucu', 'yesil', 'sef', 'yazlik', 'kislik', 'altin']);
    expect(vitrinUrunleri('tray').map((u) => u.id)).toEqual(['klasik', 'bakir', 'emaye', 'aski', 'altin']);
  });
  it('FES YALNIZ KURUCUDA — paketin özel ürünü başka yoldan alınamaz', () => {
    for (const [id, g] of Object.entries(KIYAFET_GORUNUM)) expect(!!g.fes, id).toBe(id === 'kurucu');
  });
  it('paket ürünü 💎 ile satılmaz, klasikler ücretsiz, diğerleri 💎 ister', () => {
    for (const u of [...vitrinUrunleri('outfit'), ...vitrinUrunleri('tray')]) {
      if (u.paket || u.id === 'klasik') expect(u.diamonds, u.id).toBe(0);
      else expect(u.diamonds, u.id).toBeGreaterThan(0);
    }
  });
  it('askılı tepsi askı tipinde (elden asılı taşınır), klasik tepsi düz bardakta kalır', () => {
    expect(TEPSI_GORUNUM.aski.tip).toBe('aski');
    expect(TEPSI_GORUNUM.klasik.belli).toBe(false);
  });
});

describe('sahiplik (saf)', () => {
  it('klasik her zaman sahip; 💎 ürünü anahtar ister', () => {
    expect(vitrinSahip(bos, 'outfit', 'klasik')).toBe(true);
    expect(vitrinSahip(bos, 'outfit', 'altin')).toBe(false);
    expect(vitrinSahip({ ...bos, ownedCosmetics: ['outfit:altin'] }, 'outfit', 'altin')).toBe(true);
    expect(vitrinSahip({ ...bos, ownedCosmetics: ['outfit:altin'] }, 'tray', 'altin')).toBe(false);
  });
  it('kurucu YALNIZ paketten: listedeki sahte anahtar sahiplik vermez', () => {
    expect(vitrinSahip({ ...bos, ownedCosmetics: ['outfit:kurucu'] }, 'outfit', 'kurucu')).toBe(false);
    expect(vitrinSahip({ ownedCosmetics: [], satin: { baslangic: true } }, 'outfit', 'kurucu')).toBe(true);
  });
  it('paket iade edilince giyilen kurucu klasiğe düşer; bilinmeyen kimlik de', () => {
    expect(gecerliKiyafet({ ...bos, outfit: 'kurucu' })).toBe('klasik');
    expect(gecerliKiyafet({ ownedCosmetics: [], satin: { baslangic: true }, outfit: 'kurucu' })).toBe('kurucu');
    expect(gecerliTepsi({ ...bos, trayLook: 'yok-boyle' })).toBe('klasik');
  });
});

describe('store: 💎 ile al / giy', () => {
  beforeEach(() => {
    useGame.getState().hardReset();
    useGame.setState({ diamonds: D(100), ownedCosmetics: [], outfit: 'klasik', trayLook: 'klasik', satin: defaultSatinAlim() });
  });
  it('alır: 💎 düşer, anahtar eklenir, giyilir', () => {
    expect(useGame.getState().buyGemCosmetic('outfit', 'yesil')).toBe(true);
    const s = useGame.getState();
    expect(s.diamonds.toNumber()).toBe(40);
    expect(s.ownedCosmetics).toContain('outfit:yesil');
    expect(s.outfit).toBe('yesil');
  });
  it('sahip olunan ikinci kez 💎 düşmez (yalnız giyilir)', () => {
    const al = useGame.getState().buyGemCosmetic;
    al('tray', 'bakir');
    al('tray', 'klasik');
    al('tray', 'bakir');
    const s = useGame.getState();
    expect(s.diamonds.toNumber()).toBe(60);
    expect(s.trayLook).toBe('bakir');
    expect(s.ownedCosmetics.filter((k) => k === 'tray:bakir')).toHaveLength(1);
  });
  it('💎 yetmezse almaz, hiçbir şey değişmez', () => {
    useGame.setState({ diamonds: D(10) });
    expect(useGame.getState().buyGemCosmetic('outfit', 'altin')).toBe(false);
    expect(useGame.getState().outfit).toBe('klasik');
    expect(useGame.getState().diamonds.toNumber()).toBe(10);
  });
  it('kurucu 💎 ile ALINAMAZ; paket sahibi ücretsiz giyer', () => {
    expect(useGame.getState().buyGemCosmetic('outfit', 'kurucu')).toBe(false);
    useGame.setState({ satin: { ...defaultSatinAlim(), baslangic: true } });
    expect(useGame.getState().buyGemCosmetic('outfit', 'kurucu')).toBe(true);
    expect(useGame.getState().diamonds.toNumber()).toBe(100);
    expect(useGame.getState().outfit).toBe('kurucu');
  });
  it('başlangıç paketi işlenince kurucu kendiliğinden giyilir (bir kez)', () => {
    useGame.getState().satinAlimIsle({ islem: 'x1', urun: iapConfig.urun.baslangic });
    expect(useGame.getState().outfit).toBe('kurucu');
    useGame.getState().buyGemCosmetic('outfit', 'klasik');
    useGame.getState().satinAlimIsle({ islem: 'x2', urun: iapConfig.urun.reklamsiz });
    expect(useGame.getState().outfit).toBe('klasik');
  });
  it('kıyafet ve tepsi kayda girer ve geri okunur', () => {
    useGame.getState().buyGemCosmetic('tray', 'aski');
    const kayit = JSON.parse(Object.values(mem).find((v) => v.includes('"trayLook"'))!);
    expect(kayit.trayLook).toBe('aski');
    expect(kayit.outfit).toBe('klasik');
  });
});

describe('başlangıç paketi teklifi', () => {
  const s = (usta: number, baslangic = false, teklif = false) => ({
    mastersOwned: Array.from({ length: usta }, (_, i) => `t${i}`),
    satin: { baslangic, teklif },
  });
  it('ilk Usta\'dan sonra çıkar; önce değil, paket alınmışsa değil, bir kez gösterildiyse değil', () => {
    expect(baslangicTeklifiGoster(s(0))).toBe(false);
    expect(baslangicTeklifiGoster(s(1))).toBe(true);
    expect(baslangicTeklifiGoster(s(3, true))).toBe(false);
    expect(baslangicTeklifiGoster(s(3, false, true))).toBe(false);
  });
  it('kapatınca bayrak kalıcı olur', () => {
    useGame.getState().hardReset();
    useGame.getState().baslangicTeklifKapat();
    expect(useGame.getState().satin.teklif).toBe(true);
  });
  const g: EkranGirdisi = {
    cevrimdisiVar: false, ustaVar: false, panelAcik: false, bildirimVar: false, gecisPenceresi: false,
    bulasikOgretmeHazir: false, karakterIpucuHazir: false, tepsiIpucuHazir: false, baslangicTeklifHazir: true,
  };
  it('ekran kanallarının EN SONUNDA: panel/Usta/seviye/ipucu varken çıkmaz', () => {
    expect(ekranKanali(g)).toBe('teklif-baslangic');
    expect(ekranKanali({ ...g, panelAcik: true })).toBe(null);
    expect(ekranKanali({ ...g, ustaVar: true })).toBe('usta');
    expect(ekranKanali({ ...g, seviyeVar: true })).toBe('seviye');
    expect(ekranKanali({ ...g, tepsiIpucuHazir: true })).toBe('ipucu-tepsi');
    expect(ekranKanali({ ...g, bildirimVar: true })).toBe(null);
  });
  it('baskı dili yok: geri sayım / son fırsat / indirim yazmaz, "Şimdi değil" var', () => {
    const kod = oku('src/components/ui/HUD.tsx');
    const govde = kod.slice(kod.indexOf('function BaslangicTeklifi'), kod.indexOf('function RewardModal'));
    expect(govde).toContain('Şimdi değil');
    expect(govde).not.toMatch(/son fırsat|kaçırma|indirim|%\d|saniye|setInterval|setTimeout/i);
  });
});

describe('kayıt ve bulut', () => {
  it('eski kayıt (alanlar yok) klasikle açılır, teklif gösterilmemiş sayılır', () => {
    const eski = { ...defaultSave() } as Record<string, unknown>;
    delete eski.outfit;
    delete eski.trayLook;
    eski.satin = { reklamsiz: false, baslangic: false, gunlukGun: -1, islenen: [] };
    const { data } = kayitCoz(eski);
    expect(data.outfit).toBe('klasik');
    expect(data.trayLook).toBe('klasik');
    expect(data.satin.teklif).toBe(false);
  });
  it('buluttan gelen eski kayıt teklif bayrağını yerelden korur', () => {
    const bulut = defaultSave();
    const yerel = { ...defaultSave(), satin: { ...defaultSatinAlim(), teklif: true } };
    delete (bulut.satin as Partial<typeof bulut.satin>).teklif;
    expect(bulutlaBirlestir(bulut, yerel).satin.teklif).toBe(true);
  });
});
