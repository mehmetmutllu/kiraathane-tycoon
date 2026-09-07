import { describe, it, expect } from 'vitest';
import {
  LAYOUT,
  PAD_RADIUS,
  TABLE_UP_RADIUS,
  activeSolids,
  hitsSolid,
  servicePlace,
  staffIdleSpots,
  waiterHomeAt,
  WAITER_HOME_GAP,
  dist2D,
} from '../src/game/layout';
import { MAX_WAITERS, areaTableStart, areaTableSlots } from '../src/game/world';
import { decorItems } from '../src/config/decor';
import { WALL_H } from '../src/components/three/wallPanel';

/** O kadar alan açıkken katta en fazla kaç masa olabilir. */
const maxTablesFor = (areasOpen: number): number => areaTableStart(areasOpen - 1) + areaTableSlots(areasOpen - 1);

/**
 * B6a — BOŞTA BEKLEYEN PERSONEL OYUNCUNUN İŞARETİNİN ÜSTÜNDE DURMAZ.
 *
 * Bu bir görsel kural ama tek yeri YERLEŞİM olduğu için testi de burada durur: garson/bulaşıkçı
 * boştayken `waiterHome`/`dishwasherHome`'a döner, oyuncu ise masayı kendi yükseltme noktasında
 * yükseltir. İkisi çakışırsa collision olmadığı için kimse durmaz — sadece işaret bir gövdenin
 * arkasında kaybolur. B6a öncesi arka bantta tam bu oluyordu (garson 0,71 br · bulaşıkçı 0,32 br).
 */
describe('B6a — personelin bekleme noktası yükseltme işaretini kapatmaz', () => {
  // D-076: pay artık AKTÖR YARIÇAPINDAN türer (elle yazılı 1,4 değil) — gövde büyüyünce işareti
  // kapatma mesafesi de büyür; sabit kalsaydı bu bekçi gövdeyle birlikte gevşerdi.
  const CLEAR = TABLE_UP_RADIUS + LAYOUT.actorRadius + 0.15; // 1,55

  it('her dönemde: hiçbir bekleme noktası açık bir masanın yükseltme noktasına yakın değil', () => {
    for (const areasOpen of [1, 2, 3]) {
      const place = servicePlace(areasOpen);
      const tables = maxTablesFor(areasOpen);
      for (const spot of staffIdleSpots(place)) {
        for (let i = 0; i < tables; i++) {
          const up = LAYOUT.tables[i].upgradeSpot;
          expect(
            dist2D(spot, up),
            `alan ${areasOpen} · bekleme [${spot[0]}, ${spot[2]}] ↔ masa ${i} noktası`,
          ).toBeGreaterThan(CLEAR);
        }
      }
    }
  });

  it('bekleme noktaları servisin yükseltme noktasını ve personel pad’lerini de kapatmaz', () => {
    for (const areasOpen of [1, 2, 3]) {
      const place = servicePlace(areasOpen);
      for (const spot of staffIdleSpots(place)) {
        expect(dist2D(spot, place.upgradeSpot)).toBeGreaterThan(CLEAR);
        for (const [id, pos] of Object.entries(LAYOUT.padPos)) {
          // Pad dairesinin İÇİNDE beklenmez: oyuncu pad'i doldururken personel üstüne biner.
          expect(dist2D(spot, pos), `alan ${areasOpen} · pad ${id}`).toBeGreaterThan(PAD_RADIUS);
        }
      }
    }
  });

  it('bekleme noktaları katı engelin içinde değil ve servisin alanının içinde', () => {
    for (const areasOpen of [1, 2, 3]) {
      const place = servicePlace(areasOpen);
      const solids = activeSolids(maxTablesFor(areasOpen), areasOpen);
      const ab = LAYOUT.areaBounds[place.areaIndex];
      for (const spot of staffIdleSpots(place)) {
        expect(hitsSolid(spot[0], spot[2], solids, LAYOUT.actorRadius)).toBe(false);
        expect(spot[0]).toBeGreaterThanOrEqual(ab.minX);
        expect(spot[0]).toBeLessThanOrEqual(ab.maxX);
        expect(spot[2]).toBeGreaterThanOrEqual(ab.minZ);
        expect(spot[2]).toBeLessThanOrEqual(ab.maxZ);
      }
    }
  });

  it('TEK KAYNAK: sıra ritmi `waiterHomeAt` — havuz kadar nokta üretir, gövdeler üst üste binmez', () => {
    const place = servicePlace(3);
    expect(staffIdleSpots(place)).toHaveLength(MAX_WAITERS + 1);
    for (let i = 0; i < MAX_WAITERS; i++) {
      expect(waiterHomeAt(place, i)[0]).toBeCloseTo(place.waiterHome[0] + i * WAITER_HOME_GAP, 6);
      expect(waiterHomeAt(place, i)[2]).toBeCloseTo(place.waiterHome[2], 6);
    }
    // Ritim iki gövdenin çapından (2 × actorRadius) geniş: garsonlar yan yana durur, iç içe değil.
    expect(WAITER_HOME_GAP).toBeGreaterThan(2 * LAYOUT.actorRadius);
    // TABLE_UP_RADIUS bu testin CLEAR payının tabanı; birlikte değişsinler diye burada bağlanıyor.
    expect(CLEAR).toBeGreaterThan(TABLE_UP_RADIUS);
  });
});

/**
 * B6a — DEKOR KATMANI. Dekor salt görsel: collision'ı yok, testi de "çarpışıyor mu" diye
 * sormaz. Sorduğu şey ŞU: dekorun ekranda kapattığı bir şey var mı, ve dekor kilitli alana
 * sızıyor mu. İkisi de gözle bir kere doğrulanıp sonra sessizce bozulabilecek türden.
 */
describe('B6a — dekor katmanı (salt görsel) yerinde ve kilitli alana sızmıyor', () => {
  const AREAS = [1, 2, 3];

  it('her parça AÇIK bir alanın (ya da onun duvar hattının) içinde', () => {
    for (const areasOpen of AREAS) {
      for (const d of decorItems(areasOpen)) {
        const ok = LAYOUT.areaBounds.slice(0, areasOpen).some(
          (ab) =>
            d.pos[0] >= ab.minX - 0.6 &&
            d.pos[0] <= ab.maxX + 0.6 &&
            d.pos[2] >= ab.minZ - 0.6 &&
            d.pos[2] <= ab.maxZ + 0.6,
        );
        expect(ok, `${d.kind} [${d.pos[0]}, ${d.pos[2]}] alan ${areasOpen}`).toBe(true);
      }
    }
  });

  it('KİLİTLİ alanın dekoru ÇİZİLMEZ (D-057 ile aynı kural)', () => {
    const one = decorItems(1);
    // a1 (x > 0) tek alan açıkken hiç dekor taşımaz.
    expect(one.filter((d) => d.pos[0] > 0.6)).toHaveLength(0);
    // Alan açıldıkça dekor SADECE artar; açılmış bir parça geri kaybolmaz.
    const kindsOf = (n: number) => decorItems(n).map((d) => `${d.kind}@${d.pos[0]},${d.pos[2]}`);
    for (const d of kindsOf(1)) if (!d.startsWith('paspas') && !d.startsWith('askilik') && !d.startsWith('semsiyelik')) {
      expect(kindsOf(2), d).toContain(d); // (kapıya göreli üçlü hariç: kapı 2. alanda kayar)
    }
  });

  it('hiçbir parça yükseltme işaretinin ya da pad’in üstünde durmaz', () => {
    for (const areasOpen of AREAS) {
      const tables = maxTablesFor(areasOpen);
      for (const d of decorItems(areasOpen)) {
        if (d.kind === 'paspas') continue; // paspas ZEMİNDE ve düz: işaretin altında kalır, kapatmaz
        for (let i = 0; i < tables; i++) {
          expect(
            dist2D(d.pos, LAYOUT.tables[i].upgradeSpot),
            `${d.kind} ↔ masa ${i} yükseltme noktası`,
          ).toBeGreaterThan(TABLE_UP_RADIUS + 0.5);
        }
        for (const [id, pos] of Object.entries(LAYOUT.padPos)) {
          expect(dist2D(d.pos, pos), `${d.kind} ↔ pad ${id}`).toBeGreaterThan(PAD_RADIUS);
        }
        expect(dist2D(d.pos, servicePlace(areasOpen).upgradeSpot), `${d.kind} ↔ servis noktası`).toBeGreaterThan(1.2);
      }
    }
  });

  it('SERVİS DÖNEMİ: sol duvar programı ancak ocak arka banda taşınınca beliriyor', () => {
    // Ocak sol duvarda dururken (areasOpen < 3) o duvara konsol/TV konamaz — üst üste binerler.
    const before = decorItems(2).filter((d) => d.kind === 'konsol' || d.kind === 'tvUnitesi');
    expect(before).toHaveLength(0);
    const after = decorItems(3).filter((d) => d.kind === 'konsol' || d.kind === 'tvUnitesi');
    expect(after).toHaveLength(2);
    // ve gerçekten servisin ESKİ yerinin bandında duruyorlar (maket v14'ün "boşalan 13 birim"i)
    const sp = servicePlace(1);
    for (const d of after) {
      expect(Math.abs(d.pos[0] - sp.station[0])).toBeLessThan(1.5);
      expect(d.pos[2]).toBeGreaterThan(2);
      expect(d.pos[2]).toBeLessThan(14);
    }
  });

  it('DUVARA ASILAN her şey kesik duvarın (WALL_H) içinde kalır — havada obje yok', () => {
    for (const d of decorItems(3)) {
      if (d.pos[1] <= 0.05) continue; // zemin objesi
      expect(d.pos[1], `${d.kind} asma yüksekliği`).toBeLessThan(WALL_H);
      expect(d.pos[1], `${d.kind} lambri çıtasının üstünde olmalı`).toBeGreaterThan(0.5);
    }
  });
});
