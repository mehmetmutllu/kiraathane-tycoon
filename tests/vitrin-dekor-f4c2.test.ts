/**
 * BEKÇİ — F4c-2 💎 dekor (D-155). Kullanıcı 2026-09-24: dekor haritada gösterilsin, DÜZEN
 * DEĞİŞMESİN, dekor boş yerlere sığsın, duvara GÖMÜLMESİN. Onaylanan harita + ölçüm:
 * `docs/dekor-raporu-f4c2.md`. Kararlar: yerleşim olduğu gibi · yılbaşı A (sol ön) · yuvanın salonu
 * açılmadan vitrinde kilitli.
 *
 * Neyi korur:
 *  - GÖMÜLME: her yuvanın gövdesi duvar PROFİLİNİN (lambri · çıta · gövde) `DUVAR_PAYI` önünde,
 *    ama havada da değil (≤ 0,05). Bugünkü konsol/TV/petek de aynı kurala girdi (rapor B5).
 *  - DÜZEN: yuvalar masa/tezgâh/banket katılarına, pad/yükseltme noktalarına, bugünkü dekora ve
 *    birbirine girmiyor; çizilen gövde yuvanın kutusundan taşmıyor.
 *  - KİLİT: yuvanın salonu açılmadan satılmaz, çizilmez; yılbaşı 1. Salon'dan, gerisi 3. Salon'dan.
 *  - SATIN ALMA: 💎 bir kez düşer · aynı düğme koyar/kaldırır · yılbaşı renkleri tek yuvayı paylaşır ·
 *    kayıt additive (eski kayıt {} ile açılır).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '../src/game/store';
import { dekorAcik, dekorDegistir, gorunenDekor, vitrinUrunleri } from '../src/game/vitrin';
import {
  DUVAR_PAYI, SALON_DUVAR_HAT, VITRIN_YUVALARI, WALL_BACK, decorItems, duvarProfili, vitrinYuva, yuvaAlani,
  yuvaAnkraj, yuvaDuvarPayi, yuvaKutu, type Kutu2,
} from '../src/config/decor';
import {
  LAYOUT, LAVABO, TABLE_UP_RADIUS, activeSolids, entranceAt, servicePlace, staffIdleSpots,
} from '../src/game/layout';
import { MAX_AREAS, areaTableSlots, areaTableStart } from '../src/game/world';
import { GOVDE, HOLIDAY, YILBASI_MODEL } from '../src/components/three/vitrinDekorLook';
import { turDunyaKutu } from '../src/components/three/decorLook';
import { defaultSave, kayitCoz } from '../src/game/save';
import { D } from '../src/game/decimal';

const mem: Record<string, string> = {};
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = v; },
  removeItem: (k: string) => { delete mem[k]; },
};

const kesisir = (a: Kutu2, b: Kutu2, pay = 0) =>
  a.minX < b.maxX + pay && a.maxX > b.minX - pay && a.minZ < b.maxZ + pay && a.maxZ > b.minZ - pay;
const kutuNokta = (k: Kutu2, x: number, z: number) =>
  Math.hypot(Math.max(0, k.minX - x, x - k.maxX), Math.max(0, k.minZ - z, z - k.maxZ));
const maxMasa = (a: number) => areaTableStart(a - 1) + areaTableSlots(a - 1);
const EPS = 1e-9;

describe('bekçi gerçekten bir şeye bakıyor (boş küme koruması)', () => {
  // Mutasyon sınavı bunu yakaladı: `MAX_AREAS` yanlış modülden alınınca undefined oluyordu; dönem
  // döngüleri hiç dönmüyor, `decorItems(undefined)` yalnız kapı takımını veriyordu ve yuvayı
  // petek/TV'nin içine taşıyan mutasyon KAÇTI. Kümelerin boş olmadığı burada sabitlenir.
  it('üç dönem, bugünkü dekorda konsol/TV/petek var, dokuz yuva', () => {
    expect(MAX_AREAS).toBe(3);
    const turler = new Set(decorItems(MAX_AREAS).map((d) => d.kind));
    for (const t of ['konsol', 'tvUnitesi', 'petek', 'buyukSaksi']) expect(turler.has(t as never), t).toBe(true);
    expect(VITRIN_YUVALARI).toHaveLength(9);
  });
});

describe('gömülme yok, havada da değil', () => {
  it('her yuva duvar profilinden tam DUVAR_PAYI önde (≥ pay, ≤ 0,05)', () => {
    for (const y of VITRIN_YUVALARI) {
      const p = yuvaDuvarPayi(y);
      expect(p, y.id).toBeGreaterThanOrEqual(DUVAR_PAYI - EPS);
      expect(p, y.id).toBeLessThanOrEqual(0.05);
    }
  });
  it('yere oturan eşya ÇITAYA göre, asılı eşya GÖVDEYE göre konur (profil y aralığından)', () => {
    expect(duvarProfili(0, 1.2)).toBeCloseTo(0.13, 6); // çıta 0,26
    expect(duvarProfili(0, 0.5)).toBeCloseTo(0.11, 6); // lambri 0,22
    expect(duvarProfili(1.45, 2.2)).toBeCloseTo(0.09, 6); // gövde 0,18
  });
  it('B5: bugünkü konsol / TV ünitesi / petek de çıtaya gömülmüyor', () => {
    expect(SALON_DUVAR_HAT - duvarProfili(0, 1.2) - WALL_BACK).toBeCloseTo(DUVAR_PAYI, 6);
    for (const d of decorItems(MAX_AREAS).filter((d) => ['konsol', 'tvUnitesi', 'petek'].includes(d.kind))) {
      expect(Math.abs(d.pos[0]), d.kind).toBeCloseTo(WALL_BACK, 6);
    }
  });
  it('asılı parça duvarın tepesini aşmaz (lavabo duvarı 2,2 · salon 3,2), kapı boşluğuna düşmez', () => {
    for (const y of VITRIN_YUVALARI) expect(yuvaDuvarPayi(y), y.id).toBeGreaterThan(0);
    const saat = vitrinYuva('saat')!;
    const k = yuvaKutu(saat);
    expect(k.maxX < LAVABO.door[0] - 0.7 || k.minX > LAVABO.door[0] + 0.7).toBe(true);
  });
  it('ankraj yüzü odaya bakıyor: sol duvar +π/2, sağ −π/2, lavabo duvarı 0', () => {
    const rot = (id: string) => yuvaAnkraj(vitrinYuva(id)!).rot;
    expect(rot('radyo')).toBeCloseTo(Math.PI / 2, 6);
    expect(rot('semaver')).toBeCloseTo(-Math.PI / 2, 6);
    expect(rot('saat')).toBe(0);
  });
});

describe('düzen değişmedi — yuvalar boş yerde', () => {
  it('çizilen gövde yuvanın kutusundan taşmaz (her yuvanın bir çizimi var)', () => {
    for (const y of VITRIN_YUVALARI) {
      const g = GOVDE[y.id];
      expect(g, y.id).toBeDefined();
      expect(g.minZ, `${y.id} sırtı duvarın arkasında`).toBeGreaterThanOrEqual(-EPS);
      expect(g.maxZ, `${y.id} derinlik`).toBeLessThanOrEqual(y.d + EPS);
      expect(g.maxX - g.minX, `${y.id} genişlik`).toBeLessThanOrEqual(y.w + EPS);
      expect(g.maxY, `${y.id} yükseklik`).toBeLessThanOrEqual(y.y1 - y.y0 + EPS);
    }
  });
  it('yuvalar birbirine girmez (asılı ile yerdeki y aralığı ayrıksa izinli)', () => {
    const ys = VITRIN_YUVALARI;
    for (let i = 0; i < ys.length; i++)
      for (let j = i + 1; j < ys.length; j++) {
        const ust = ys[i].y0 < ys[j].y1 && ys[j].y0 < ys[i].y1;
        expect(ust && kesisir(yuvaKutu(ys[i]), yuvaKutu(ys[j])), `${ys[i].id} ↔ ${ys[j].id}`).toBe(false);
      }
  });
  it('bugünkü dekora girmez (yer eşyası ↔ yer eşyası)', () => {
    for (const y of VITRIN_YUVALARI.filter((v) => v.y0 < 0.5)) {
      for (const d of decorItems(MAX_AREAS).filter((d) => d.pos[1] < 0.5)) {
        const b = turDunyaKutu(d.kind, d.rot);
        const k = b
          ? { minX: d.pos[0] + b.cx - b.hx, maxX: d.pos[0] + b.cx + b.hx, minZ: d.pos[2] + b.cz - b.hz, maxZ: d.pos[2] + b.cz + b.hz }
          : { minX: d.pos[0] - 0.35, maxX: d.pos[0] + 0.35, minZ: d.pos[2] - (d.len ?? 0.7) / 2, maxZ: d.pos[2] + (d.len ?? 0.7) / 2 };
        expect(kesisir(yuvaKutu(y), k, 0.05), `${y.id} ↔ ${d.kind}@${d.pos[2]}`).toBe(false);
      }
    }
  });
  it('her dönemde: katılara girmez, pad/yükseltme/servis/masa/kapı noktasına 1,0 br yaklaşmaz', () => {
    for (let a = 1; a <= MAX_AREAS; a++) {
      const masa = maxMasa(a);
      const sp = servicePlace(a);
      const noktalar = [entranceAt(a), sp.station, sp.pickup, sp.dish, sp.upgradeSpot, LAVABO.spot, LAVABO.coinSpot, ...staffIdleSpots(sp), ...Object.values(LAYOUT.padPos)];
      for (let i = 0; i < masa; i++) noktalar.push(LAYOUT.tables[i].table, LAYOUT.tables[i].seat, LAYOUT.tables[i].upgradeSpot);
      for (const y of VITRIN_YUVALARI.filter((v) => yuvaAlani(v) < a)) {
        const k = yuvaKutu(y);
        for (const s of activeSolids(masa, a)) {
          const sk = { minX: s.c[0] - s.h[0], maxX: s.c[0] + s.h[0], minZ: s.c[2] - s.h[1], maxZ: s.c[2] + s.h[1] };
          expect(kesisir(k, sk, 0.1), `alan ${a} · ${y.id} katıya giriyor`).toBe(false);
        }
        const en = Math.min(...noktalar.map((p) => kutuNokta(k, p[0], p[2])));
        expect(en, `alan ${a} · ${y.id}`).toBeGreaterThan(TABLE_UP_RADIUS);
      }
    }
  });
});

describe('ürünler ve kilit', () => {
  const urunler = vitrinUrunleri('decor');
  it('her ürünün yuvası var; her yuva en az bir ürün taşıyor', () => {
    for (const u of urunler) expect(vitrinYuva(u.yuva ?? ''), u.id).toBeDefined();
    for (const y of VITRIN_YUVALARI) expect(urunler.some((u) => u.yuva === y.id), y.id).toBe(true);
  });
  it('yılbaşı: dört renk tek yuvayı paylaşır, her rengin modeli diskte', () => {
    const yil = urunler.filter((u) => u.yuva === 'yilbasi');
    expect(yil.map((u) => u.id).sort()).toEqual(Object.keys(YILBASI_MODEL).sort());
    for (const m of [...Object.values(YILBASI_MODEL), 'carpet_round_small']) {
      expect(existsSync(path.join('public', HOLIDAY, `${m}.gltf`)), m).toBe(true);
    }
  });
  it('hepsi 💎 ister, paket ürünü yok', () => {
    for (const u of urunler) {
      expect(u.diamonds, u.id).toBeGreaterThan(0);
      expect(u.paket, u.id).toBeUndefined();
    }
  });
  it('kilit: yılbaşı 1. Salon\'dan açık, gerisi yalnız 3. Salon\'la', () => {
    for (const u of urunler) {
      const ilk = u.yuva === 'yilbasi' ? 1 : 3;
      for (let a = 1; a <= MAX_AREAS; a++) expect(dekorAcik(u.id, a), `${u.id} · ${a}`).toBe(a >= ilk);
    }
  });
  it('görünen dekor: sahip + yuvasında + yuvası açık (sahte/yanlış yuva düşer)', () => {
    const s = { ownedCosmetics: ['decor:radyo', 'decor:yilbasi-mavi'], satin: { baslangic: false } };
    const dekor = { radyo: 'radyo', yilbasi: 'yilbasi-mavi', semaver: 'semaver', koltuk: 'radyo' };
    expect(gorunenDekor({ ...s, dekor, areasOpen: 1 })).toEqual([{ yuva: 'yilbasi', id: 'yilbasi-mavi' }]);
    expect(gorunenDekor({ ...s, dekor, areasOpen: 3 }).map((d) => d.id).sort()).toEqual(['radyo', 'yilbasi-mavi']);
  });
  it('yerleştir / kaldır / renk değiştir (saf)', () => {
    let d = dekorDegistir({}, 'yilbasi-kirmizi');
    expect(d).toEqual({ yilbasi: 'yilbasi-kirmizi' });
    d = dekorDegistir(d, 'yilbasi-yesil');
    expect(d).toEqual({ yilbasi: 'yilbasi-yesil' });
    expect(dekorDegistir(d, 'yilbasi-yesil')).toEqual({});
  });
});

describe('satın alma (store)', () => {
  beforeEach(() => {
    useGame.getState().hardReset();
    useGame.setState({ diamonds: D(300), ownedCosmetics: [], dekor: {} });
  });
  it('yuvası kapalıysa satmaz, 💎 düşmez', () => {
    expect(useGame.getState().areasOpen).toBe(1);
    expect(useGame.getState().buyGemCosmetic('decor', 'semaver')).toBe(false);
    expect(useGame.getState().diamonds.toNumber()).toBe(300);
    expect(useGame.getState().ownedCosmetics).not.toContain('decor:semaver');
  });
  it('açık yuva: 💎 bir kez düşer, eşya yerine konur; ikinci basış kaldırır, üçüncü geri koyar (ücretsiz)', () => {
    const al = useGame.getState().buyGemCosmetic;
    expect(al('decor', 'yilbasi-kirmizi')).toBe(true);
    expect(useGame.getState().diamonds.toNumber()).toBe(200);
    expect(useGame.getState().dekor).toEqual({ yilbasi: 'yilbasi-kirmizi' });
    al('decor', 'yilbasi-kirmizi');
    expect(useGame.getState().dekor).toEqual({});
    al('decor', 'yilbasi-kirmizi');
    expect(useGame.getState().dekor).toEqual({ yilbasi: 'yilbasi-kirmizi' });
    expect(useGame.getState().diamonds.toNumber()).toBe(200);
  });
  it('ikinci renk alınınca yuvadaki renk değişir, ilki sahiplikte kalır', () => {
    const al = useGame.getState().buyGemCosmetic;
    al('decor', 'yilbasi-kirmizi');
    al('decor', 'yilbasi-mavi');
    const s = useGame.getState();
    expect(s.dekor).toEqual({ yilbasi: 'yilbasi-mavi' });
    expect(s.ownedCosmetics).toEqual(expect.arrayContaining(['decor:yilbasi-kirmizi', 'decor:yilbasi-mavi']));
    expect(s.diamonds.toNumber()).toBe(100);
  });
  it('💎 yetmezse almaz', () => {
    useGame.setState({ diamonds: D(10) });
    expect(useGame.getState().buyGemCosmetic('decor', 'yilbasi-yesil')).toBe(false);
    expect(useGame.getState().dekor).toEqual({});
  });
  it('dekor kayda girer ve geri okunur', () => {
    useGame.getState().buyGemCosmetic('decor', 'yilbasi-kahve');
    const kayit = JSON.parse(Object.values(mem).find((v) => v.includes('"dekor"'))!);
    expect(kayit.dekor).toEqual({ yilbasi: 'yilbasi-kahve' });
    expect(kayitCoz(kayit).data.dekor).toEqual({ yilbasi: 'yilbasi-kahve' });
  });
  it('eski kayıt (alan yok) boş dekorla açılır', () => {
    const eski = { ...defaultSave() } as Record<string, unknown>;
    delete eski.dekor;
    expect(kayitCoz(eski).data.dekor).toEqual({});
  });
});
