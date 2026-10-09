/**
 * BEKÇİ — Sprint A ③ bulut kaydı (`src/game/bulut.ts`).
 * Genel `BulutArkaUcu` (iOS iCloud KVS · sahte KVS) · seçim kuralı sifirlamaNo > lifetime > xp >
 * lastSaved · bozuk bulut (sağlama / NaN) yok sayılır · satın alım uzlaşma alanları birleştirmede
 * korunur · sayfa gizliyken zamanlayıcılar durur.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bulutBaslat, bulutDongusu, bulutDurumu, bulutKaydet, bulutlaBirlestir, kayitIleriMi, playGamesDurumu,
  sahteBulut, type BulutKancasi,
} from '../src/game/bulut';
import { defaultSave, kayitMetni, kayitMetniCoz, type SaveData } from '../src/game/save';

(globalThis as Record<string, unknown>).localStorage = {
  getItem: () => null, setItem: () => {}, removeItem: () => {},
};

const kayit = (o: Partial<SaveData> = {}): SaveData => ({ ...defaultSave(), ...o });
let yerel: SaveData;
let yuklenen: SaveData | null;
const kanca: BulutKancasi = { yerel: () => yerel, yukle: (d) => { yuklenen = d; } };
beforeEach(() => { yuklenen = null; });

describe('seçim kuralı', () => {
  it('sifirlamaNo > toplam kazanç > XP > son kayıt anı; tümü eşitse ileri değil', () => {
    expect(kayitIleriMi({ lifetime: '0', xp: 0, sifirlamaNo: 2 }, { lifetime: '1e9', xp: 999, sifirlamaNo: 1 })).toBe(true);
    expect(kayitIleriMi({ lifetime: '1e9', xp: 999, sifirlamaNo: 1 }, { lifetime: '0', xp: 0, sifirlamaNo: 2 })).toBe(false);
    expect(kayitIleriMi({ lifetime: '500', xp: 0 }, { lifetime: '400', xp: 9 })).toBe(true);
    expect(kayitIleriMi({ lifetime: '400', xp: 9 }, { lifetime: '400', xp: 5 })).toBe(true);
    expect(kayitIleriMi({ lifetime: '400', xp: 5, lastSaved: 20 }, { lifetime: '400', xp: 5, lastSaved: 10 })).toBe(true);
    expect(kayitIleriMi({ lifetime: '400', xp: 5, lastSaved: 10 }, { lifetime: '400', xp: 5, lastSaved: 10 })).toBe(false);
    // Eski kayıt (alan yok) = 0 sıfırlama.
    expect(kayitIleriMi({ lifetime: '1', xp: 0, sifirlamaNo: 1 }, { lifetime: '9', xp: 0 })).toBe(true);
  });
});

describe('KVS akışı (sahte arka uç)', () => {
  it('buluttaki DAHA İLERİ kayıt yüklenir (ayar + satın alım yerelden)', async () => {
    yerel = kayit({ lifetime: '100', settings: { ...defaultSave().settings, music: false } });
    const b = sahteBulut({ veri: kayitMetni(kayit({ lifetime: '5000', wallet: '42' }), 3) });
    await bulutBaslat(kanca, b);
    expect(yuklenen?.lifetime).toBe('5000');
    expect(yuklenen?.wallet).toBe('42');
    expect(yuklenen?.settings.music).toBe(false);
    expect(b.yazmaSayisi).toBe(0);
    expect(bulutDurumu()).toEqual({ tur: 'icloud', esitlendi: true });
    expect(playGamesDurumu().kullanilabilir).toBe(false); // iOS'ta Play Games bölümü görünmez
  });

  it('yereldeki daha ileriyse buluta ZARFLI yazılır', async () => {
    yerel = kayit({ lifetime: '9000' });
    const b = sahteBulut({ veri: kayitMetni(kayit({ lifetime: '10' }), 1) });
    await bulutBaslat(kanca, b);
    expect(yuklenen).toBeNull();
    expect(b.yazmaSayisi).toBe(1);
    expect(kayitMetniCoz(b.veri!)?.data.lifetime).toBe('9000');
    expect(JSON.parse(b.veri!).zarf.sum).toMatch(/^[0-9a-f]{8}$/);
  });

  it('daha çok ilerlemiş ama ESKİ sıfırlamalı bulut kaybeder; sıfırlaması yeni olan kazanır', async () => {
    yerel = kayit({ lifetime: '50', sifirlamaNo: 1 });
    const b = sahteBulut({ veri: kayitMetni(kayit({ lifetime: '1e12', sifirlamaNo: 0 }), 1) });
    await bulutBaslat(kanca, b);
    expect(yuklenen).toBeNull();
    expect(kayitMetniCoz(b.veri!)?.data.sifirlamaNo).toBe(1);

    yerel = kayit({ lifetime: '1e12', sifirlamaNo: 0 });
    const c = sahteBulut({ veri: kayitMetni(kayit({ lifetime: '50', sifirlamaNo: 1 }), 1) });
    await bulutBaslat(kanca, c);
    expect(yuklenen?.lifetime).toBe('50');
    expect(yuklenen?.sifirlamaNo).toBe(1);
  });

  it('bozuk bulut (sağlama tutmuyor / NaN cüzdan) yüklenmez, üstüne sağlam yerel yazılır', async () => {
    yerel = kayit({ lifetime: '100' });
    const kurcalanmis = kayitMetni(kayit({ lifetime: '1e30' }), 2).replace('"wallet":"0"', '"wallet":"1e30"');
    const b = sahteBulut({ veri: kurcalanmis });
    await bulutBaslat(kanca, b);
    expect(yuklenen).toBeNull();
    expect(kayitMetniCoz(b.veri!)?.data.lifetime).toBe('100');

    const nan = sahteBulut({ veri: JSON.stringify(kayit({ lifetime: '1e30', wallet: 'NaN' })) });
    await bulutBaslat(kanca, nan);
    expect(yuklenen).toBeNull();
    expect(kayitMetniCoz(nan.veri!)?.data.lifetime).toBe('100');
  });

  it('eski (zarfsız) bulut kaydı okunur', async () => {
    yerel = kayit({ lifetime: '1' });
    const b = sahteBulut({ veri: JSON.stringify(kayit({ lifetime: '777' })) });
    await bulutBaslat(kanca, b);
    expect(yuklenen?.lifetime).toBe('777');
  });

  it('okunamayan bulut ezilmez; bağlı değilse hiçbir şey yapılmaz', async () => {
    yerel = kayit({ lifetime: '100' });
    const b = sahteBulut({ veri: 'dokunma' });
    b.okumaHatasi = true;
    await bulutBaslat(kanca, b);
    expect(await bulutKaydet()).toBe(false);
    expect(b.veri).toBe('dokunma');

    const kapali = sahteBulut({ bagli: false });
    await bulutBaslat(kanca, kapali);
    expect(bulutDurumu().tur).toBeNull();
    expect(await bulutKaydet()).toBe(false);
    expect(kapali.yazmaSayisi).toBe(0);
  });
});

describe('satın alım uzlaşma alanları birleştirmede korunur', () => {
  const satin = defaultSave().satin;
  it('tek tarafta olan alan korunur', () => {
    const r = bulutlaBirlestir(
      kayit({ satin: { ...satin } }),
      kayit({ satin: { ...satin, uzlasmaBasi: 1000, baslangicElmas: true, hakKimlik: 'rc-yerel' } }),
    );
    expect(r.satin).toMatchObject({ uzlasmaBasi: 1000, baslangicElmas: true, hakKimlik: 'rc-yerel' });
    const s = bulutlaBirlestir(kayit({ satin: { ...satin, uzlasmaBasi: 2000, hakKimlik: 'rc-bulut' } }), kayit());
    expect(s.satin).toMatchObject({ uzlasmaBasi: 2000, hakKimlik: 'rc-bulut' });
  });
  it('ikisinde de varsa: uzlasmaBasi GEÇ olan (çift ödeme yok), hakKimlik yerelin, baslangicElmas VEYA', () => {
    const r = bulutlaBirlestir(
      kayit({ satin: { ...satin, uzlasmaBasi: 5000, baslangicElmas: true, hakKimlik: 'rc-bulut' } }),
      kayit({ satin: { ...satin, uzlasmaBasi: 3000, baslangicElmas: false, hakKimlik: 'rc-yerel' } }),
    );
    expect(r.satin).toMatchObject({ uzlasmaBasi: 5000, baslangicElmas: true, hakKimlik: 'rc-yerel' });
  });
  it('hiçbirinde yoksa alan YAZILMAZ ("yok → şimdi" kuralı mağaza tarafının)', () => {
    const r = bulutlaBirlestir(kayit(), kayit());
    expect(r.satin).not.toHaveProperty('uzlasmaBasi');
    expect(r.satin).not.toHaveProperty('baslangicElmas');
    expect(r.satin).not.toHaveProperty('hakKimlik');
  });
  it('bulut akışında da: yüklenen kayıt yereldeki uzlaşma alanlarını taşır', async () => {
    yerel = kayit({ lifetime: '1', satin: { ...satin, uzlasmaBasi: 777, hakKimlik: 'rc-x' } });
    await bulutBaslat(kanca, sahteBulut({ veri: kayitMetni(kayit({ lifetime: '99' }), 1) }));
    expect(yuklenen?.satin).toMatchObject({ uzlasmaBasi: 777, hakKimlik: 'rc-x' });
  });
});

describe('zamanlayıcılar sayfa gizliyken durur (perf #5)', () => {
  const dinleyici: Record<string, () => void> = {};
  const belge = { visibilityState: 'visible' as 'visible' | 'hidden',
    addEventListener: (_: string, f: () => void) => { dinleyici.v = f; },
    removeEventListener: () => { delete dinleyici.v; } };
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as Record<string, unknown>).document = belge;
  });
  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as Record<string, unknown>).document;
  });
  it('görünürken 2 zamanlayıcı · gizlenince 0 · dönünce yine 2 · temizleyici hepsini kaldırır', () => {
    belge.visibilityState = 'visible';
    const coz = bulutDongusu();
    expect(vi.getTimerCount()).toBe(2);
    belge.visibilityState = 'hidden';
    dinleyici.v();
    expect(vi.getTimerCount()).toBe(0);
    belge.visibilityState = 'visible';
    dinleyici.v();
    dinleyici.v(); // çift olay zamanlayıcıyı ikilemez
    expect(vi.getTimerCount()).toBe(2);
    coz();
    expect(vi.getTimerCount()).toBe(0);
    expect(dinleyici.v).toBeUndefined();
  });
  it('gizli açılışta zamanlayıcı kurulmaz', () => {
    belge.visibilityState = 'hidden';
    const coz = bulutDongusu();
    expect(vi.getTimerCount()).toBe(0);
    coz();
  });
});
