import type { BufferGeometry } from 'three';

/**
 * atlasUV.ts — KAYKIT ATLASINDA GÖZ DEĞİŞTİRME (S4).
 *
 * KayKit'in dokusu 8×4'lük bir RENK ŞERİDİ: her model UV'siyle bir "göz"e (swatch) bakar,
 * doku değil renk seçer. `tools/atlas-goz.mjs` bir modelin hangi gözlere düştüğünü söylüyor
 * (S3'te bunun için yazılmıştı).
 *
 * NEDEN ATLAS KOPYASI DEĞİL: mutfak zeminini kahveye çevirmenin iki yolu var —
 *  (a) atlasın kopyasını çıkarıp o gözleri boyamak (`recolor.ts` hattı),
 *  (b) modelin UV'sini BAŞKA bir göze taşımak.
 * (a) BURADA YANLIŞ: zemin `[0,4]` (beyaz) gözünü kullanıyor ve o gözü `kitchentable_sink_
 * large_decorated` gibi başka modeller de kullanıyor — boyarsak lavabo da renk değiştirir.
 * (b) yalnız zeminin geometrisine dokunur, atlas ortak kalır, ek doku belleği sıfırdır.
 *
 * Ayrıca materyal rengiyle ÇARPMAK da yanlış çıktı (ilk deneme): çarpım siyahı boyayamaz,
 * "kahve + siyah" verir, "açık kahve + koyu kahve" vermez. Kullanıcı 2026-09-09 farkı gördü.
 */

/** Şeridin göz ızgarası (KayKit standardı). */
export const ATLAS = { kolon: 8, satir: 4 } as const;

/** Bir göz: [satır, kolon]. */
export type Goz = readonly [number, number];

/** Gözün UV kutusu. */
const kutu = (g: Goz) => ({
  u0: g[1] / ATLAS.kolon,
  v0: g[0] / ATLAS.satir,
  du: 1 / ATLAS.kolon,
  dv: 1 / ATLAS.satir,
});

/** Bir UV'nin hangi gözde olduğunu söyler. */
const gozBul = (u: number, v: number): Goz => [
  Math.min(ATLAS.satir - 1, Math.max(0, Math.floor(v * ATLAS.satir))),
  Math.min(ATLAS.kolon - 1, Math.max(0, Math.floor(u * ATLAS.kolon))),
];

const ayni = (a: Goz, b: Goz) => a[0] === b[0] && a[1] === b[1];

/**
 * Geometrinin KOPYASINI döndürür; `esleme`deki her `[kaynak, hedef]` çifti için o gözdeki
 * UV'ler hedef göze taşınır (göz İÇİNDEKİ konum korunur, yani gradyan/kenar aynı yerde kalır).
 * Orijinal geometriye dokunulmaz — aynı model başka yerde eski rengiyle kullanılabilsin.
 */
export function gozDegistir(geo: BufferGeometry, esleme: readonly (readonly [Goz, Goz])[]): BufferGeometry {
  const yeni = geo.clone();
  const uv = yeni.getAttribute('uv');
  if (!uv) return yeni;
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const g = gozBul(u, v);
    const hedef = esleme.find(([kaynak]) => ayni(kaynak, g))?.[1];
    if (!hedef) continue;
    const k = kutu(g);
    const h = kutu(hedef);
    // Göz içindeki oransal konum korunur.
    uv.setXY(i, h.u0 + ((u - k.u0) / k.du) * h.du, h.v0 + ((v - k.v0) / k.dv) * h.dv);
  }
  uv.needsUpdate = true;
  return yeni;
}
