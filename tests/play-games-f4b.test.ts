/**
 * BEKÇİ — F4b Play Games (D-153 · `docs/play-games-kurulum.md`).
 * Başarımlar toplam 1000 XP, durumdan türer, oyun içi ödül YOK · bulut: DAHA İLERİ kayıt kazanır,
 * daha ileri bulutun üstüne yazılmaz, okunamayan bulut ezilmez, sıfırlama bulutu da sıfırlar,
 * yüklemede ayarlar + satın alımlar yerelden korunur, eski şemalı bulut kaydı göçten geçer ·
 * cihazda APP_ID yokken katman kapalı.
 */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { kayitVerisi, useGame } from '../src/game/store';
import { defaultSave, SAVE_VERSION, type SaveData } from '../src/game/save';
import { acikBasarimlar, basarimOlculeri } from '../src/game/basarim';
import {
  basarimlariGonder, bulutBaslat, bulutKaydet, bulutlaBirlestir, bulutSifirla, girisYap, kayitIleriMi,
  playGamesDurumu, sahteArkaUc, type BulutKancasi, type SahtePlayGames,
} from '../src/game/bulut';
import { playGamesConfig } from '../src/config/playGames.config';
import { economyConfig as C } from '../src/config/economy.config';
import { totalTiers } from '../src/game/goals';
import { LAYOUT } from '../src/game/layout';

const mem: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};
const oku = (p: string) => readFileSync(p, 'utf8');
const B = playGamesConfig.basarimlar;

const kayit = (o: Partial<SaveData> = {}): SaveData => ({ ...defaultSave(), ...o });
const kanca: BulutKancasi = {
  yerel: () => kayitVerisi(useGame.getState()),
  yukle: (d) => useGame.getState().bulutKaydiYukle(d),
};
/** Oyunu verilen kayıtla kurar (diskten, gerçek yükleme yolu). */
function oyunKur(d: SaveData) {
  mem['kiraathane.save'] = JSON.stringify(d);
  useGame.getState().init();
}
const bulutMetni = (d: SaveData) => JSON.stringify(d);

describe('başarım listesi (Play kuralları)', () => {
  it('toplam XP tam 1000 · her biri 5\'in katı ve 5..200', () => {
    expect(B.reduce((a, b) => a + b.xp, 0)).toBe(1000);
    for (const b of B) {
      expect(b.xp % 5).toBe(0);
      expect(b.xp).toBeGreaterThanOrEqual(5);
      expect(b.xp).toBeLessThanOrEqual(200);
    }
  });
  it('anahtarlar tekil · Play kimliği ya boş ya Play biçiminde', () => {
    expect(new Set(B.map((b) => b.anahtar)).size).toBe(B.length);
    for (const b of B) if (b.kimlik !== null) expect(b.kimlik).toMatch(/^CgkI[\w-]+$/);
  });
  it('her eşik oyunda ULAŞILABİLİR (ölü başarım yok)', () => {
    const ucretliPad = (C.pads as readonly unknown[]).length;
    for (const b of B) {
      if (b.olcu === 'pad') expect(b.esik).toBeLessThanOrEqual(ucretliPad);
      if (b.olcu === 'sonSeviyeMasa') expect(b.esik).toBeLessThanOrEqual(LAYOUT.tables.length);
    }
  });
  it('başarım oyun içi ödül vermez: economy.config\'e bağlı değil', () => {
    expect(oku('src/config/economy.config.ts')).not.toMatch(/basarim|playGames/i);
    expect(oku('src/game/basarim.ts')).not.toMatch(/diamonds|wallet/);
  });
});

describe('başarımlar durumdan türer', () => {
  it('boş kayıt hiçbir başarım açmaz', () => {
    expect(acikBasarimlar(kayit())).toEqual([]);
  });
  it('ilk çay · seviye · kazanç eşikleri', () => {
    const s = kayit({
      stats: { ...defaultSave().stats, teasServed: 60, waiterServed: 40 },
      lifetime: '10000',
    });
    const a = acikBasarimlar(s);
    expect(a).toContain('ilk_cay');
    expect(a).toContain('ilk_garson');
    expect(a).toContain('servis_100');
    expect(a).toContain('kazanc_10k');
    expect(a).not.toContain('servis_1000');
    expect(a).not.toContain('kazanc_200k');
  });
  it('elle servis garson başarımını açmaz', () => {
    const a = acikBasarimlar(kayit({ stats: { ...defaultSave().stats, teasServed: 30 } }));
    expect(a).toContain('ilk_cay');
    expect(a).not.toContain('ilk_garson');
  });
  it('koleksiyon yalnız TÜM hedefler toplanınca · görev hattı yalnız bütün görevler bitince', () => {
    const hepsi = C.goals.categories.flatMap((c) => c.tiers.map((_t, i) => `${c.id}:${i}`));
    expect(hepsi.length).toBe(totalTiers());
    expect(basarimOlculeri(kayit({ goalsClaimed: hepsi.slice(1) })).hedef).toBe(0);
    expect(basarimOlculeri(kayit({ goalsClaimed: hepsi })).hedef).toBe(1);
    const ids = C.quests.map((q) => q.id);
    expect(basarimOlculeri(kayit({ questsDone: ids.slice(0, -1) })).gorevHatti).toBe(0);
    expect(basarimOlculeri(kayit({ questsDone: ids })).gorevHatti).toBe(1);
  });
});

describe('çakışma kuralı: daha ileri kazanır', () => {
  it('önce toplam kazanç, eşitse XP; eşit kayıt ileri değil', () => {
    expect(kayitIleriMi({ lifetime: '500', xp: 0 }, { lifetime: '400', xp: 999 })).toBe(true);
    expect(kayitIleriMi({ lifetime: '400', xp: 10 }, { lifetime: '400', xp: 5 })).toBe(true);
    expect(kayitIleriMi({ lifetime: '400', xp: 5 }, { lifetime: '400', xp: 5 })).toBe(false);
    expect(kayitIleriMi({ lifetime: '1e30', xp: 0 }, { lifetime: '9e29', xp: 0 })).toBe(true);
  });
  it('yükleme: ayarlar ve satın alımlar yerelden korunur', () => {
    const bulut = kayit({ lifetime: '900', satin: { reklamsiz: false, baslangic: true, gunlukGun: 3, islenen: ['a'] } });
    const yerel = kayit({
      settings: { ...defaultSave().settings, music: false },
      satin: { reklamsiz: true, baslangic: false, gunlukGun: 5, islenen: ['b'] },
    });
    const r = bulutlaBirlestir(bulut, yerel);
    expect(r.lifetime).toBe('900');
    expect(r.settings.music).toBe(false);
    expect(r.satin).toEqual({ reklamsiz: true, baslangic: true, gunlukGun: 5, islenen: ['a', 'b'], teklif: false });
  });
});

describe('bulut akışı (sahte arka uç)', () => {
  let pg: SahtePlayGames;
  beforeEach(() => {
    for (const k of Object.keys(mem)) delete mem[k];
  });

  it('bulut boş → yerel ilerleme buluta yazılır', async () => {
    oyunKur(kayit({ lifetime: '1234', xp: 50 }));
    pg = sahteArkaUc();
    await bulutBaslat(kanca, pg);
    expect(pg.yazmaSayisi).toBe(1);
    expect(JSON.parse(pg.veri!).lifetime).toBe('1234');
  });

  it('bulut DAHA İLERİ → açılışta yüklenir (yeni telefon)', async () => {
    oyunKur(kayit());
    pg = sahteArkaUc({ veri: bulutMetni(kayit({ lifetime: '50000', xp: 900, padsDone: [] })) });
    await bulutBaslat(kanca, pg);
    expect(useGame.getState().lifetime.toString()).toBe('50000');
    expect(useGame.getState().xp).toBe(900);
    expect(pg.yazmaSayisi).toBe(0);
    expect(useGame.getState().notice?.text).toBe('Bulut kaydı yüklendi');
  });

  it('bulut GERİDE → yüklenmez, üstüne yerel yazılır', async () => {
    oyunKur(kayit({ lifetime: '8000', xp: 300 }));
    pg = sahteArkaUc({ veri: bulutMetni(kayit({ lifetime: '100' })) });
    await bulutBaslat(kanca, pg);
    expect(useGame.getState().lifetime.toString()).toBe('8000');
    expect(JSON.parse(pg.veri!).lifetime).toBe('8000');
  });

  it('bulut okunamadı → hiç yazılmaz (bilinmeyen kayıt ezilmez)', async () => {
    oyunKur(kayit({ lifetime: '8000' }));
    pg = sahteArkaUc({ veri: 'dokunma' });
    pg.okumaHatasi = true;
    await bulutBaslat(kanca, pg);
    expect(await bulutKaydet()).toBe(false);
    expect(pg.veri).toBe('dokunma');
  });

  it('daha YENİ sürümle yazılmış ileri bulut: yüklenmez, üstüne de yazılmaz', async () => {
    oyunKur(kayit({ lifetime: '100' }));
    const ileri = { ...kayit({ lifetime: '99999' }), saveVersion: SAVE_VERSION + 1 };
    pg = sahteArkaUc({ veri: JSON.stringify(ileri) });
    await bulutBaslat(kanca, pg);
    expect(useGame.getState().lifetime.toString()).toBe('100');
    expect(await bulutKaydet()).toBe(false);
    expect(JSON.parse(pg.veri!).lifetime).toBe('99999');
  });

  it('eski şemalı bulut kaydı göç zincirinden geçer (v33 garson tepsisi)', async () => {
    oyunKur(kayit());
    const v33 = { ...kayit({ lifetime: '7777' }), saveVersion: 33, waiterUpgrades: { tray: 2, speed: 0, dishCarry: 0, dishSpeed: 0 } };
    pg = sahteArkaUc({ veri: JSON.stringify(v33) });
    await bulutBaslat(kanca, pg);
    expect(useGame.getState().lifetime.toString()).toBe('7777');
    expect(useGame.getState().waiterUpgrades.tray).toBe(1);
  });

  it('değişmeyen kayıt tekrar yazılmaz; ilerleyince yazılır', async () => {
    oyunKur(kayit({ lifetime: '500' }));
    pg = sahteArkaUc();
    await bulutBaslat(kanca, pg);
    expect(await bulutKaydet()).toBe(false);
    useGame.setState({ lifetime: useGame.getState().lifetime.add(10) });
    expect(await bulutKaydet()).toBe(true);
    expect(pg.yazmaSayisi).toBe(2);
  });

  it('sıfırlama: daha geri kayıt da buluta ZORLA yazılır', async () => {
    oyunKur(kayit({ lifetime: '9000' }));
    pg = sahteArkaUc();
    await bulutBaslat(kanca, pg);
    useGame.getState().hardReset();
    expect(await bulutKaydet()).toBe(false); // olağan yazım daha ileri bulutu ezmez
    expect(await bulutSifirla()).toBe(true);
    expect(JSON.parse(pg.veri!).lifetime).toBe('0');
  });

  it('giriş yoksa okuma/yazma yok; "Bağlan" sonrası eşitlenir', async () => {
    oyunKur(kayit({ lifetime: '300' }));
    pg = sahteArkaUc({ girisli: false });
    await bulutBaslat(kanca, pg);
    expect(playGamesDurumu()).toEqual({ kullanilabilir: true, girisli: false });
    expect(await bulutKaydet()).toBe(false);
    expect(await girisYap()).toBe(true);
    expect(JSON.parse(pg.veri!).lifetime).toBe('300');
  });

  it('başarımlar: açık olanlar bir kez gönderilir, giriş yokken hiç', async () => {
    oyunKur(kayit({ stats: { ...defaultSave().stats, teasServed: 120 }, lifetime: '12000' }));
    pg = sahteArkaUc({ girisli: false });
    await bulutBaslat(kanca, pg);
    expect(await basarimlariGonder()).toBe(0);
    await girisYap();
    expect(pg.acilan).toEqual(expect.arrayContaining(['ilk_cay', 'servis_100', 'kazanc_10k']));
    expect(await basarimlariGonder()).toBe(0);
  });

  it('kullanılamaz arka uç → katman kapalı', async () => {
    oyunKur(kayit());
    const kapali = { ...sahteArkaUc(), durum: async () => ({ kullanilabilir: false, girisli: false }) };
    await bulutBaslat(kanca, kapali);
    expect(playGamesDurumu().kullanilabilir).toBe(false);
    expect(await girisYap()).toBe(false);
  });
});

describe('kablolar', () => {
  const app = oku('src/App.tsx');
  const hud = oku('src/components/ui/HUD.tsx');
  const bulut = oku('src/game/bulut.ts');
  const java = oku('android/app/src/main/java/com/memedobro/teahousetycoon/PlayGamesPlugin.java');
  it('açılışta başlar · arka plana geçince yazar', () => {
    expect(app).toMatch(/bulutBaslat\(/);
    expect(app).toMatch(/arkaPlanaGec\(\);\s*void bulutKaydet\(\)/);
  });
  it('Ayarlar: bölüm yalnız kullanılabilirken · sıfırlama bulutu da sıfırlar', () => {
    expect(hud).toMatch(/if \(!kullanilabilir\) return null;/);
    expect(hud).toMatch(/hardReset\(\);[\s\S]{0,160}bulutSifirla\(\)/);
  });
  it('cihazda sahte arka uç YOK', () => {
    expect(bulut).toContain('Capacitor.isNativePlatform() ? yerliArkaUc() : sahteArkaUc()');
  });
  it('native: kayıtlı · APP_ID boşken SDK kurulmaz · en ileri çözüm politikası', () => {
    expect(oku('android/app/src/main/java/com/memedobro/teahousetycoon/MainActivity.java')).toContain('registerPlugin(PlayGamesPlugin.class)');
    expect(oku('android/app/src/main/AndroidManifest.xml')).toContain('com.google.android.gms.games.APP_ID');
    expect(java).toMatch(/isEmpty\(\)\) return;\s*PlayGamesSdk\.initialize/);
    expect(java.split('open(ad, true, SnapshotsClient.RESOLUTION_POLICY_HIGHEST_PROGRESS)').length - 1).toBe(2);
    expect(java).toContain('setProgressValue(ilerleme)');
  });
});
