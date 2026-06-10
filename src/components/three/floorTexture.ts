// Canvas-tile zemin doku üreteci (WP4, 2026-06-11; feedback §C12 — kilim değil parke/fayans).
// İndirme yok: 128px tile canvas'ta çizilir, RepeatWrapping ile döşenir (MPH referansı: düz pastel +
// ÇOK hafif desen). Kozmetik mağaza (WP6) temaları da AYNI üreteçten çıkar — tema = renk seti + tür.
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

export interface FloorTheme {
  kind: 'parquet' | 'tile';
  /** Ana zemin rengi. */
  base: string;
  /** İkincil ton (parke şerit / fayans damalı). */
  alt: string;
  /** Derz/çizgi rengi. */
  seam: string;
}

const cache = new Map<string, CanvasTexture>();

export function makeFloorTexture(theme: FloorTheme, repeatX: number, repeatY: number): CanvasTexture {
  const key = `${theme.kind}|${theme.base}|${theme.alt}|${theme.seam}|${repeatX}|${repeatY}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = theme.base;
  g.fillRect(0, 0, S, S);
  if (theme.kind === 'parquet') {
    // 4 sıra tahta; sıra başı yarım ofset (gerçek parke düzeni). Hafif ton farkı + ince derz.
    const rowH = S / 4;
    const plankW = S / 2;
    for (let r = 0; r < 4; r++) {
      const off = (r % 2) * (plankW / 2);
      for (let px = -1; px < 3; px++) {
        const x = px * plankW + off;
        g.fillStyle = (px + r) % 2 === 0 ? theme.base : theme.alt;
        g.fillRect(x, r * rowH, plankW, rowH);
      }
      g.fillStyle = theme.seam;
      g.fillRect(0, r * rowH, S, 1.2);
      for (let px = -1; px < 3; px++) g.fillRect(px * plankW + off, r * rowH, 1.2, rowH);
    }
  } else {
    // Damalı fayans: 2×2 kare + derz.
    const t = S / 2;
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        g.fillStyle = (i + j) % 2 === 0 ? theme.base : theme.alt;
        g.fillRect(i * t, j * t, t, t);
      }
    g.fillStyle = theme.seam;
    for (let i = 0; i <= 2; i++) {
      g.fillRect(i * t - 1, 0, 2, S);
      g.fillRect(0, i * t - 1, S, 2);
    }
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}
