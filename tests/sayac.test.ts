/**
 * sayac.test.ts — çevrimdışı ₺ sayacının BEKÇİSİ. Sayaç yanlış bir son değerde durursa ekran
 * oyuncuya almadığı parayı (ya da eksiğini) gösterir; bu yüzden son kare `fmt(hedef)` ile birebir.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { D, fmt } from '../src/game/decimal';
import { SAYAC_MS, sayacDegeri } from '../src/game/sayac';

describe('çevrimdışı ₺ sayacı', () => {
  it('süre 0,8-1,2 sn bandında', () => {
    expect(SAYAC_MS).toBeGreaterThanOrEqual(800);
    expect(SAYAC_MS).toBeLessThanOrEqual(1200);
  });

  it('0 anında 0, süre dolunca TAM hedef (kuruşsuz) — son kare fmt(hedef) ile aynı', () => {
    expect(sayacDegeri(7474.9, 0).toNumber()).toBe(0);
    expect(sayacDegeri(7474.9, SAYAC_MS).toNumber()).toBe(7474);
    expect(fmt(sayacDegeri(7474.9, SAYAC_MS + 500))).toBe(fmt(D(7474)));
    // Büyük sayı Decimal'da kalır (Number'a düşmez).
    expect(fmt(sayacDegeri(D('2.5e12'), SAYAC_MS))).toBe(fmt(D('2.5e12')));
  });

  it('arada tam sayı, hedefi AŞMAZ, geri GİTMEZ; ease-out: yarı sürede yarıdan çok', () => {
    const hedef = 12_345;
    let onceki = -1;
    for (let t = 0; t <= SAYAC_MS; t += 16) {
      const v = sayacDegeri(hedef, t).toNumber();
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeLessThanOrEqual(hedef);
      expect(v).toBeGreaterThanOrEqual(onceki);
      onceki = v;
    }
    const yari = sayacDegeri(hedef, SAYAC_MS / 2).toNumber();
    expect(yari).toBeGreaterThan(hedef / 2);
    expect(yari).toBeLessThan(hedef);
  });

  it('çevrimdışı ekranı sayacı kullanıyor ve hareket azaltmada anında hedefe gidiyor', () => {
    const src = readFileSync('src/components/ui/HUD.tsx', 'utf8');
    const offline = src.slice(src.indexOf('testid="offline"'), src.indexOf('claimTestid="offline-ok"'));
    expect(offline).toMatch(/\bsayac\b/);
    expect(src).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(src).toMatch(/useState\(azHareket \? SAYAC_MS : 0\)/);
  });
});
