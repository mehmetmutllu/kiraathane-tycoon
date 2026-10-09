/**
 * BEKÇİ — Sprint A ③ kalıcılık katmanı (`src/game/kalicilik.ts`).
 * Preferences ana depo + localStorage hızlı kopya · eski localStorage kaydı taşınır · OS'un sildiği
 * hızlı kopya geri yazılır · iki depo ayrışırsa ikisi de okunabilir · Preferences yoksa/patlarsa
 * localStorage ile sürer (tarayıcı + test = bugünkü davranış).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  kalicilikBekle, kalicilikHazirla, kaliciOku, kaliciSil, kaliciYaz, kaliciYerelOku, rcKimlik, type TercihDeposu,
} from '../src/game/kalicilik';

class BellekDepo {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

function sahteTercih(ilk: Record<string, string> = {}, o: { patla?: boolean } = {}) {
  const m = new Map(Object.entries(ilk));
  const d: TercihDeposu & { m: Map<string, string> } = {
    m,
    keys: async () => {
      if (o.patla) throw new Error('native yok');
      return { keys: [...m.keys()] };
    },
    get: async ({ key }) => ({ value: m.get(key) ?? null }),
    set: async ({ key, value }) => { m.set(key, value); },
    remove: async ({ key }) => { m.delete(key); },
  };
  return d;
}

let ls: BellekDepo;
beforeEach(() => {
  ls = new BellekDepo();
  (globalThis as Record<string, unknown>).localStorage = ls;
});

describe('Preferences yok (tarayıcı / test)', () => {
  it('okuma ve yazma doğrudan localStorage', async () => {
    await kalicilikHazirla(null);
    kaliciYaz('kiraathane.save', 'a');
    expect(ls.getItem('kiraathane.save')).toBe('a');
    ls.setItem('kiraathane.save', 'dışarıdan');
    expect(kaliciOku('kiraathane.save')).toBe('dışarıdan');
    kaliciSil('kiraathane.save');
    expect(ls.getItem('kiraathane.save')).toBeNull();
  });
  it('Preferences patlarsa da localStorage ile sürer', async () => {
    ls.setItem('kiraathane.save', 'x');
    await kalicilikHazirla(sahteTercih({}, { patla: true }));
    expect(kaliciOku('kiraathane.save')).toBe('x');
  });
});

describe('Preferences ana depo', () => {
  it('eski localStorage kaydı Preferences\'a TAŞINIR; ilgisiz anahtar taşınmaz', async () => {
    ls.setItem('kiraathane.save', 'eski');
    ls.setItem('kiraathane.save.yedek.0', 'y0');
    ls.setItem('kiraathane.rcKimlik', 'uuid-1');
    ls.setItem('kiraathane.cihazSinifi', 'guclu');
    const p = sahteTercih();
    await kalicilikHazirla(p);
    expect(p.m.get('kiraathane.save')).toBe('eski');
    expect(p.m.get('kiraathane.save.yedek.0')).toBe('y0');
    expect(p.m.get('kiraathane.rcKimlik')).toBe('uuid-1');
    expect(p.m.has('kiraathane.cihazSinifi')).toBe(false);
  });

  it('OS localStorage\'ı sildiyse Preferences\'tan geri gelir (önbellekten SENKRON okunur)', async () => {
    const p = sahteTercih({ 'kiraathane.save': 'kalici' });
    await kalicilikHazirla(p);
    expect(kaliciOku('kiraathane.save')).toBe('kalici');
    expect(ls.getItem('kiraathane.save')).toBe('kalici');
  });

  it('iki depo ayrışırsa ikisi de durur: ana = Preferences, yerel kopya ayrı okunur', async () => {
    ls.setItem('kiraathane.save', 'yerel-taze');
    const p = sahteTercih({ 'kiraathane.save': 'tercih' });
    await kalicilikHazirla(p);
    expect(kaliciOku('kiraathane.save')).toBe('tercih');
    expect(kaliciYerelOku('kiraathane.save')).toBe('yerel-taze');
    expect(p.m.get('kiraathane.save')).toBe('tercih');
  });

  it('yazma önbelleğe + localStorage\'a hemen, Preferences\'a arka planda; silme ikisinden', async () => {
    const p = sahteTercih();
    await kalicilikHazirla(p);
    kaliciYaz('kiraathane.save', 'v1');
    kaliciYaz('kiraathane.save', 'v2');
    expect(kaliciOku('kiraathane.save')).toBe('v2');
    expect(ls.getItem('kiraathane.save')).toBe('v2');
    await kalicilikBekle();
    expect(p.m.get('kiraathane.save')).toBe('v2');
    kaliciSil('kiraathane.save');
    await kalicilikBekle();
    expect(p.m.has('kiraathane.save')).toBe(false);
    expect(ls.getItem('kiraathane.save')).toBeNull();
    expect(kaliciOku('kiraathane.save')).toBeNull();
  });

  it('rcKimlik bir kez üretilir, kalıcıdır', async () => {
    const p = sahteTercih();
    await kalicilikHazirla(p);
    const k = rcKimlik();
    expect(k).toMatch(/^[0-9a-f-]{36}$/);
    expect(rcKimlik()).toBe(k);
    await kalicilikBekle();
    expect(p.m.get('kiraathane.rcKimlik')).toBe(k);
  });
});
