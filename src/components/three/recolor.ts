// KayKit atlas RECOLOR (kullanıcı 2026-06-15 "c şıkkı"): asset'in gömülü MAVİ minderini doğrudan
// hedef renge boyar (overlay değil). Tek-atlas tek-malzeme olduğu için: orijinal PNG'yi RUNTIME'da
// canvas'a çizip MAVİ piksellerini bul → hedef renge çevir (gradyanı koru) → CanvasTexture döndür.
// ORİJİNAL DOSYAYA DOKUNULMAZ (bellekte kopya). Sonuç hex bazında cache'lenir.
import { CanvasTexture, SRGBColorSpace } from 'three';

const ATLAS_URL = '/assets/models/kaykit-furniture-bits/furniturebits_texture.png';

let base: ImageData | null = null;
const cache = new Map<string, CanvasTexture>();
const listeners = new Set<() => void>();

const img = new Image();
img.onload = () => {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  base = ctx.getImageData(0, 0, c.width, c.height);
  listeners.forEach((fn) => fn());
};
img.src = ATLAS_URL;

export function atlasReady(): boolean {
  return !!base;
}
export function onAtlasReady(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Atlas'taki "minder mavisi": B baskın + doygun (düşük doygunluklu gri/beyaz bloklar hariç).
function isCushionBlue(r: number, g: number, b: number): boolean {
  const mn = Math.min(r, g, b);
  return b - r > 30 && b - g > 10 && b - mn > 50 && b > 110;
}

/** hedef hex için maviyi o renge boyamış atlas dokusu (cache'li). Atlas yüklenmediyse null. */
export function recoloredAtlas(hex: string): CanvasTexture | null {
  if (!base) return null;
  const key = hex.toLowerCase();
  const hit = cache.get(key);
  if (hit) return hit;
  const [tr, tg, tb] = hexToRgb(hex);
  const id = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    if (isCushionBlue(d[i], d[i + 1], d[i + 2])) {
      // DÜZ renk (gradyan yok) → minder, örtü mesh'iyle BİREBİR aynı renk olsun (kullanıcı isteği).
      // Form/gölge zaten meshStandardMaterial ışıklandırmasından gelir.
      d[i] = tr;
      d[i + 1] = tg;
      d[i + 2] = tb;
    }
  }
  const c = document.createElement('canvas');
  c.width = id.width;
  c.height = id.height;
  c.getContext('2d')!.putImageData(id, 0, 0);
  const tex = new CanvasTexture(c);
  tex.flipY = false; // glTF UV kuralı
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}
