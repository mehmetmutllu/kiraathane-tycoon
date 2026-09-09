// KayKit atlası 8×4 gözlü bir renk şeridi. Bu araç bir modelin UV'lerinin HANGİ gözlere
// düştüğünü söyler — "hangi swatch'i boyarsam ne değişir" sorusunun ölçülmüş cevabı.
import { readFileSync } from 'node:fs';
const N = 8;

/** Modelin gözleri, ÇOKTAN AZA sıralı: `[['satır,kolon', vertexSayısı], ...]`. */
export function gozler(paket, ad) {
  const dir = `public/assets/models/${paket}/`;
  const g = JSON.parse(readFileSync(`${dir}${ad}.gltf`, 'utf8'));
  const bin = readFileSync(dir + g.buffers[0].uri);
  const say = new Map();
  for (const m of g.meshes)
    for (const p of m.primitives) {
      const a = g.accessors[p.attributes.TEXCOORD_0];
      if (!a) continue;
      const bv = g.bufferViews[a.bufferView];
      const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
      const st = bv.byteStride || 8;
      for (let i = 0; i < a.count; i++) {
        const o = off + i * st;
        const u = bin.readFloatLE(o), v = bin.readFloatLE(o + 4);
        const c = Math.min(N - 1, Math.max(0, Math.floor(u * N)));
        const r = Math.min(3, Math.max(0, Math.floor(v * 4)));
        const k = `${r},${c}`;
        say.set(k, (say.get(k) || 0) + 1);
      }
    }
  return [...say].sort((a, b) => b[1] - a[1]);
}

if (process.argv[1].endsWith('atlas-goz.mjs'))
  for (const ad of process.argv.slice(3))
    console.log(ad.padEnd(38), gozler(process.argv[2], ad).map(([k, n]) => `[${k}]×${n}`).join(' '));
