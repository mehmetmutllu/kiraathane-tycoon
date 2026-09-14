/**
 * mutfak-kademe-s22.test.ts — S22 / D-119 BEKÇİSİ: mutfak seviyeyle büyüyor mu?
 *
 * NE BEKÇİLİYOR: S20 ölçümü mutfağın seviyeden bağımsız olduğunu saydı (19 sabit ünite,
 * `Kitchen.tsx` seviye okuması 0). S22 yedi kalıbı varyant olarak ölçtü, kullanıcı **K5 + Y1**
 * kolunu seçti ve merdiven ELLE yazıldı. Elle yazılan bir merdiven sessizce bozulabilir:
 * bir ünite index'i kayar, bir zincir üyesi düşer, bir basamak boşalır. Buradaki denetimler
 * o sessiz bozulmaların her birini kırmızıya çevirir.
 *
 * SAYILAR NEREDEN: `docs/mutfak-kademe-raporu-s22.md` §Bulgular · ham çıktı
 * `docs/olcum-mutfak-kademe.txt` (tam koşu). Test SAYIYI değil KURALI bekçiliyor — S20'nin
 * dersi bu: "sayıyı bekçileyen damga, kuralı bekçileyen damgadan daha kırılgan."
 */
import { describe, expect, it } from 'vitest';
import { PLAYER_RADIUS } from '../src/config/actor';
import { economyConfig } from '../src/config/economy.config';
import { servicePlace } from '../src/game/layout';
import {
  ADA_DERINLIK,
  ADA_KORIDOR,
  ADA_UNITS,
  ADA_ZINCIR,
  KADEME_MAX,
  KADEME_MERDIVENI,
  KADEME_ZINCIR,
  KITCHEN_S,
  KITCHEN_UNITS,
  MODULE_W,
  NATIVE,
  UST_HIZALI,
  WALL_UNIT_Y,
  adaModeli,
  adaZ,
  asiliY,
  modulX,
  mutfakSeviyesi,
  uniteAsamasi,
  uniteModeli,
  uniteY,
  unitBox,
  type KitchenKey,
} from '../src/components/three/kitchenLook';
import { WALL_H } from '../src/components/three/wallPanel';

const SEVIYELER = [1, 2, 3, 4, 5, 6];

/** Bir ünitenin L seviyesindeki dünya AABB'si — çizilen gövdeyle. */
function kutuSeviyede(i: number, level: number) {
  const u = KITCHEN_UNITS[i];
  const model = uniteModeli(u, i, level);
  const n = NATIVE[model];
  const S = u.olcek ?? KITCHEN_S;
  const hw = (n.w / 2) * S;
  const z0 = n.minZ * S;
  const z1 = n.maxZ * S;
  const y = uniteY(u, model);
  const dus = { minY: y + n.minY * S, maxY: y + (n.minY + n.h) * S };
  switch (u.ceyrek) {
    case 0: return { minX: u.x - hw, maxX: u.x + hw, minZ: u.z + z0, maxZ: u.z + z1, ...dus };
    case 2: return { minX: u.x - hw, maxX: u.x + hw, minZ: u.z - z1, maxZ: u.z - z0, ...dus };
    case 1: return { minX: u.x + z0, maxX: u.x + z1, minZ: u.z - hw, maxZ: u.z + hw, ...dus };
    default: return { minX: u.x - z1, maxX: u.x - z0, minZ: u.z - hw, maxZ: u.z + hw, ...dus };
  }
}

/** Adanın L seviyesindeki dünya AABB'si (yoksa null). */
function adaKutusu(s: number, level: number) {
  const model = adaModeli(s, level);
  if (!model) return null;
  const n = NATIVE[model];
  const x = modulX(ADA_UNITS[s].modul);
  const z = adaZ(3);
  return {
    minX: x - (n.w / 2) * KITCHEN_S, maxX: x + (n.w / 2) * KITCHEN_S,
    minZ: z + n.minZ * KITCHEN_S, maxZ: z + n.maxZ * KITCHEN_S,
    minY: n.minY * KITCHEN_S, maxY: (n.minY + n.h) * KITCHEN_S,
  };
}

type Kutu = ReturnType<typeof kutuSeviyede>;
const kesisiyor = (a: Kutu, b: Kutu): boolean =>
  a.minX < b.maxX - 1e-6 && a.maxX > b.minX + 1e-6 &&
  a.minZ < b.maxZ - 1e-6 && a.maxZ > b.minZ + 1e-6 &&
  a.minY < b.maxY - 1e-6 && a.maxY > b.minY + 1e-6;

describe('S22 · merdivenin bütünlüğü', () => {
  it('merdiven servis noktasının kademe sayısı kadar basamak taşır', () => {
    expect(KADEME_MAX).toBe(economyConfig.service.upgrade.maxLevel);
    expect(KADEME_MERDIVENI).toHaveLength(KADEME_MAX);
  });

  it('L1 başlangıçtır: hiçbir ünite ilk basamakta değişmez', () => {
    expect(KADEME_MERDIVENI[0]).toHaveLength(0);
    KITCHEN_UNITS.forEach((_, i) => expect(uniteAsamasi(i, 1)).toBe(0));
  });

  it('merdivenin her adımı var olan bir üniteyi ve var olan bir zincir üyesini gösterir', () => {
    KADEME_MERDIVENI.forEach((basamak, s) => {
      basamak.forEach((adim) => {
        expect(adim.u, `L${s + 1} adımı olmayan üniteyi gösteriyor`).toBeLessThan(KITCHEN_UNITS.length);
        const zincir = KADEME_ZINCIR[KITCHEN_UNITS[adim.u].key];
        expect(zincir, `L${s + 1}: ${KITCHEN_UNITS[adim.u].key} zinciri yok`).toBeDefined();
        expect(adim.asama).toBeGreaterThan(0);
        expect(adim.asama).toBeLessThan(zincir!.length);
      });
    });
  });

  it('HİÇBİR BASAMAK KÖR DEĞİL — her yükseltmede ekranda bir şey değişir (S7/D-104)', () => {
    for (let L = 2; L <= KADEME_MAX; L++) {
      const degisen = KITCHEN_UNITS.filter((_, i) => uniteAsamasi(i, L) !== uniteAsamasi(i, L - 1)).length
        + ADA_UNITS.filter((_, s) => adaModeli(s, L) !== adaModeli(s, L - 1)).length;
      expect(degisen, `L${L - 1} → L${L} kör basamak`).toBeGreaterThan(0);
    }
  });

  it('merdiven geri gitmez: her ünitenin aşaması seviyeyle artar ya da sabit kalır', () => {
    KITCHEN_UNITS.forEach((_, i) => {
      for (let L = 2; L <= KADEME_MAX; L++) {
        expect(uniteAsamasi(i, L)).toBeGreaterThanOrEqual(uniteAsamasi(i, L - 1));
      }
    });
  });

  it('L6 bugünkü odayı verir: her ünite kendi özgün gövdesine döner', () => {
    KITCHEN_UNITS.forEach((u, i) => {
      expect(uniteModeli(u, i, KADEME_MAX), `#${i} L6'da özgün gövdesinde değil`).toBe(u.key);
    });
  });

  it('zincirlerin son üyesi ünitenin kendi anahtarıdır (L6 = taban tasarım)', () => {
    for (const [anahtar, zincir] of Object.entries(KADEME_ZINCIR)) {
      expect(zincir![zincir!.length - 1]).toBe(anahtar);
    }
  });
});

describe('S22 · seviyenin kelepçesi', () => {
  it('oda çiziliyorsa seviye en az 1, en çok KADEME_MAX (wcSeviye deseni)', () => {
    expect(mutfakSeviyesi(0)).toBe(1);
    expect(mutfakSeviyesi(-5)).toBe(1);
    expect(mutfakSeviyesi(99)).toBe(KADEME_MAX);
    expect(mutfakSeviyesi(3)).toBe(3);
  });

  it('kelepçe dışı seviyeler çizimi bozmaz', () => {
    KITCHEN_UNITS.forEach((u, i) => {
      expect(NATIVE[uniteModeli(u, i, 0)]).toBeDefined();
      expect(NATIVE[uniteModeli(u, i, 999)]).toBeDefined();
    });
  });
});

describe('S22 · asılı ünitelerin üst hizası', () => {
  it('ÇİZİLEN üyenin tepesi duvarın tepesindedir — hangi basamakta olursa olsun', () => {
    for (const L of SEVIYELER) {
      KITCHEN_UNITS.forEach((u, i) => {
        if (u.kat !== 'duvar') return;
        const model = uniteModeli(u, i, L);
        if (!UST_HIZALI.includes(model)) return;
        const k = kutuSeviyede(i, L);
        expect(k.maxY, `L${L} · #${i} ${model} üst hizada değil`).toBeCloseTo(WALL_H, 5);
      });
    }
  });

  it('asiliY tam dolabın donmuş ankrajıyla aynı sayıyı verir (geriye uyum)', () => {
    expect(asiliY('kitchencabinet')).toBeCloseTo(WALL_UNIT_Y, 10);
  });

  it('yarım dolap tam dolapla aynı üst hizadan asılır, aşağı doğru kısalır', () => {
    expect(asiliY('kitchencabinet_half')).toBeCloseTo(asiliY('kitchencabinet'), 10);
    const yarim = NATIVE.kitchencabinet_half;
    const tam = NATIVE.kitchencabinet;
    expect(yarim.h).toBeLessThan(tam.h);
  });

  it('sade peçetelik rafı süslü hâlin ankrajına YAPIŞMAZ (kendi üst hizasını alır)', () => {
    expect(asiliY('shelf_papertowel')).not.toBeCloseTo(asiliY('shelf_papertowel_decorated'), 2);
  });
});

describe('S22 · adalar (Y1)', () => {
  it('ada ekseni çaycının koridorunu tam açıklıkta bırakır', () => {
    const yolZ = servicePlace(3).staffWalk.a[2];
    const on = adaZ(3) + ADA_DERINLIK / 2;
    expect(yolZ - on, 'ada çaycının koridorunu daraltıyor').toBeCloseTo(ADA_KORIDOR, 10);
    expect(ADA_KORIDOR).toBeCloseTo(PLAYER_RADIUS * 2, 10);
  });

  it('adalar geç basamaklarda doğar: L1-L3 arasında hiç ada yoktur', () => {
    for (const L of [1, 2, 3]) {
      ADA_UNITS.forEach((_, s) => expect(adaModeli(s, L), `L${L} ada${s} erken doğmuş`).toBeNull());
    }
    expect(adaModeli(0, 4)).not.toBeNull();
    expect(adaModeli(1, 6)).not.toBeNull();
  });

  it('doğan ada bir daha kaybolmaz ve zincirinde geri gitmez', () => {
    ADA_UNITS.forEach((a, s) => {
      let once = -1;
      for (const L of SEVIYELER) {
        const i = a.asama[L - 1];
        if (once >= 0) expect(i, `ada${s} L${L}'de geriledi`).toBeGreaterThanOrEqual(once);
        if (i >= 0) once = i;
        expect(i).toBeLessThan(ADA_ZINCIR.length);
      }
    });
  });

  it('BÜYÜYEN ADALAR BİRBİRİNE GİRMEZ — slot atlama kuralı', () => {
    for (const L of SEVIYELER) {
      for (let a = 0; a < ADA_UNITS.length; a++) {
        for (let b = a + 1; b < ADA_UNITS.length; b++) {
          const ka = adaKutusu(a, L);
          const kb = adaKutusu(b, L);
          if (!ka || !kb) continue;
          expect(kesisiyor(ka, kb), `L${L}: ada${a} ∩ ada${b}`).toBe(false);
        }
      }
    }
  });

  it('adalar modül ritmine oturur (elle x yazılmamış)', () => {
    ADA_UNITS.forEach((a) => {
      expect(modulX(a.modul)).toBeCloseTo(modulX(a.modul), 10);
      expect(Number.isInteger(a.modul)).toBe(true);
    });
    // Büyüyen ada bitişik slota konamaz: en geniş üyenin yarısı × 2 > slot aralığı.
    const enGenis = Math.max(...ADA_ZINCIR.map((k) => NATIVE[k].w)) * KITCHEN_S;
    const aralik = Math.abs(modulX(ADA_UNITS[1].modul) - modulX(ADA_UNITS[0].modul));
    expect(aralik, 'adalar bitişik slota konmuş — büyüyünce çakışırlar').toBeGreaterThanOrEqual(enGenis);
    expect(enGenis).toBeGreaterThan(MODULE_W);
  });
});

describe('S22 · kolun getirdiği çakışma yok', () => {
  it('hiçbir basamakta ünite ile ADA iç içe geçmez', () => {
    for (const L of SEVIYELER) {
      ADA_UNITS.forEach((_, s) => {
        const ada = adaKutusu(s, L);
        if (!ada) return;
        KITCHEN_UNITS.forEach((u, i) => {
          expect(kesisiyor(ada, kutuSeviyede(i, L)), `L${L}: ada${s} ∩ #${i} ${u.key}`).toBe(false);
        });
      });
    }
  });

  it('kademe hiçbir basamakta TABANDA olmayan yeni bir iç içe geçme getirmez', () => {
    const cift = (L: number) => {
      const out = new Set<string>();
      for (let i = 0; i < KITCHEN_UNITS.length; i++)
        for (let j = i + 1; j < KITCHEN_UNITS.length; j++)
          if (kesisiyor(kutuSeviyede(i, L), kutuSeviyede(j, L))) out.add(`${i}|${j}`);
      return out;
    };
    const taban = cift(KADEME_MAX); // L6 = bugünkü oda; kasıtlı iç içe çiftler burada
    for (const L of SEVIYELER) {
      for (const c of cift(L)) {
        expect(taban.has(c), `L${L}: tabanda olmayan çakışma ${c}`).toBe(true);
      }
    }
  });

  it('L6 kutuları bugünkü unitBox ile birebir aynı (taban tasarım korunuyor)', () => {
    KITCHEN_UNITS.forEach((u, i) => {
      const a = kutuSeviyede(i, KADEME_MAX);
      const b = unitBox(u);
      (['minX', 'maxX', 'minZ', 'maxZ', 'minY', 'maxY'] as const).forEach((k) => {
        expect(a[k], `#${i} ${u.key}.${k}`).toBeCloseTo(b[k], 10);
      });
    });
  });
});

describe('S22 · zincirlerin gövdeleri gerçek', () => {
  it('zincirdeki her üyenin ölçüsü NATIVE\'de yazılı', () => {
    for (const zincir of Object.values(KADEME_ZINCIR)) {
      zincir!.forEach((k) => expect(NATIVE[k], `${k} NATIVE'de yok`).toBeDefined());
    }
    ADA_ZINCIR.forEach((k) => expect(NATIVE[k], `${k} NATIVE'de yok`).toBeDefined());
  });

  it('GÖMME PARÇA zincire girmez — ocağın gözü ocağın kademesi değildir', () => {
    const ocak = KADEME_ZINCIR.stove_multi!;
    expect(ocak).not.toContain('stove_single_countertop' as KitchenKey);
    expect(ocak).not.toContain('stove_multi_countertop' as KitchenKey);
    // Kural: zincirin her üyesi ZEMİNDEN başlar (asılı ünite hariç), yani gövdedir.
    ocak.forEach((k) => expect(NATIVE[k].minY, `${k} havada başlıyor`).toBeCloseTo(0, 3));
  });

  it('zincir adımı gövdeyi GÖZLE KÜÇÜLTMEZ', () => {
    /**
     * Tam eşitlik değil %98 eşiği: `stove_single → stove_multi` adımı gövdeyi değil GÖZ
     * SAYISINI değiştiriyor ve modelin kutusu 0,008 ham birim kısalıyor (5,528 → 5,491,
     * %0,7). Kural "her adım büyütür" değil, "hiçbir adım küçülme olarak okunmaz".
     */
    for (const zincir of Object.values(KADEME_ZINCIR)) {
      for (let a = 1; a < zincir!.length; a++) {
        const o = NATIVE[zincir![a - 1]];
        const y = NATIVE[zincir![a]];
        const hacimO = o.w * o.h * (o.maxZ - o.minZ);
        const hacimY = y.w * y.h * (y.maxZ - y.minZ);
        expect(hacimY, `${zincir![a - 1]} → ${zincir![a]} gözle küçülüyor`).toBeGreaterThanOrEqual(hacimO * 0.98);
      }
    }
    for (let a = 1; a < ADA_ZINCIR.length; a++) {
      const o = NATIVE[ADA_ZINCIR[a - 1]];
      const y = NATIVE[ADA_ZINCIR[a]];
      expect(y.w * y.h * (y.maxZ - y.minZ)).toBeGreaterThan(o.w * o.h * (o.maxZ - o.minZ));
    }
  });
});
