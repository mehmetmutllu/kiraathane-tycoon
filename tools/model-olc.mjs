// KayKit .gltf ölçü aracı — modelin YEREL sınır kutusunu (bbox) verir.
// Neden: bir asset'i elle çizilen maket parçasının yerine koyarken ölçü TAHMİN edilemez;
// ankraj (taban y, tezgâh üstü, en/derinlik) modelin kendi sayısından türemeli.
// Kullanım: node tools/model-olc.mjs <paket> <model...>   (uzantısız ad)
import { readFileSync } from 'node:fs';

const KOK = 'public/assets/models/';

function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
function trs(n) {
  if (n.matrix) return n.matrix;
  const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale ?? [1, 1, 1];
  const [tx, ty, tz] = n.translation ?? [0, 0, 0];
  const m = [
    (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + z * w)) * sx, (2 * (x * z - y * w)) * sx, 0,
    (2 * (x * y - z * w)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + x * w)) * sy, 0,
    (2 * (x * z + y * w)) * sz, (2 * (y * z - x * w)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1,
  ];
  return m;
}
function uygula(m, p) {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
  ];
}

/** Bir gltf dosyasının tüm mesh köşelerini kapsayan bbox (min/max accessor'larından, node dönüşümüyle). */
export function bbox(dosya) {
  const g = JSON.parse(readFileSync(dosya, 'utf8'));
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  const gez = (i, ana) => {
    const n = g.nodes[i];
    const m = mul(ana, trs(n));
    if (n.mesh !== undefined)
      for (const pr of g.meshes[n.mesh].primitives) {
        const a = g.accessors[pr.attributes.POSITION];
        if (!a?.min) continue;
        // bbox köşelerinin 8'i de dönüştürülür (dönme varsa min/max yetmez)
        for (let k = 0; k < 8; k++) {
          const p = uygula(m, [k & 1 ? a.max[0] : a.min[0], k & 2 ? a.max[1] : a.min[1], k & 4 ? a.max[2] : a.min[2]]);
          for (let d = 0; d < 3; d++) {
            if (p[d] < mn[d]) mn[d] = p[d];
            if (p[d] > mx[d]) mx[d] = p[d];
          }
        }
      }
    for (const c of n.children ?? []) gez(c, m);
  };
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const s of g.scenes[g.scene ?? 0].nodes) gez(s, I);
  return { mn, mx, boyut: [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]] };
}

if (process.argv[1].endsWith('model-olc.mjs')) {
  const [paket, ...adlar] = process.argv.slice(2);
  const s = (v) => v.toFixed(3).padStart(7);
  console.log('model'.padEnd(34), 'en(x)  yük(y)  der(z)   |  minY    maxY    minX    maxX    minZ    maxZ');
  for (const ad of adlar) {
    const b = bbox(`${KOK}${paket}/${ad}.gltf`);
    console.log(
      ad.padEnd(34),
      s(b.boyut[0]), s(b.boyut[1]), s(b.boyut[2]), ' |',
      s(b.mn[1]), s(b.mx[1]), s(b.mn[0]), s(b.mx[0]), s(b.mn[2]), s(b.mx[2]),
    );
  }
}
