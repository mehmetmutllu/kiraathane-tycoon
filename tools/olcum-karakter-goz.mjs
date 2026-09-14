/**
 * olcum-karakter-goz.mjs — S14/②: karakter gövdesinin PARÇA BAŞINA hangi atlas gözlerini
 * kullandığını ölçer.
 *
 * NEDEN: kullanıcı 2026-09-14'te oranı onayladı ama konsepti reddetti — *"karakter tipleri
 * yapısı boyutu proporsiyonu çok iyi ama bunlar savaş karakteri"*. Ekipmanı sökmek yetmiyor,
 * altından ortaçağ derisi/kemeri çıkıyor. O zaman soru şu: gövdenin KENDİSİ kalıp,
 * KIYAFETİ oyunun paletiyle yeniden boyanabilir mi?
 *
 * Cevap parçanın UV'sinde: KayKit atlası 8×4 gözlük düz bir renk şeridi (`atlas-goz.mjs`).
 * Bir parçanın bütün UV'leri TEK göze düşüyorsa o parça tek düz renktir → `atlasUV.gozDegistir`
 * ile başka bir göze taşınabilir, yani "gömlek rengi" bir satırlık iştir. Parça birden çok göze
 * yayılmışsa (desen, kemer, toka) boyama o parçayı bozar.
 *
 * Kullanım: node tools/olcum-karakter-goz.mjs <glb> [<glb> ...]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const N = 8; // atlas sütun sayısı (atlas-goz.mjs ile aynı)
const SATIR = 4;

/** GLB'yi aç: JSON parçası + BIN parçası (gltfOku yalnız JSON veriyor, burada ikisi de lazım). */
function glbAc(dosya) {
  const b = readFileSync(dosya);
  if (b.slice(0, 4).toString() !== 'glTF') {
    const j = JSON.parse(b.toString('utf8'));
    return { j, bin: readFileSync(path.join(path.dirname(dosya), j.buffers[0].uri)) };
  }
  let o = 12;
  let j = null;
  let bin = null;
  while (o < b.length) {
    const len = b.readUInt32LE(o);
    const typ = b.readUInt32LE(o + 4);
    const govde = b.slice(o + 8, o + 8 + len);
    if (typ === 0x4e4f534a) j = JSON.parse(govde.toString('utf8'));
    else bin = govde;
    o += 8 + len;
  }
  return { j, bin };
}

/** Bir parçanın gözleri: `[['satır,kolon', vertexSayısı], ...]`, çoktan aza. */
function parcaGozleri(j, bin, mesh) {
  const say = new Map();
  for (const p of mesh.primitives) {
    const a = j.accessors[p.attributes.TEXCOORD_0];
    if (!a) continue;
    const bv = j.bufferViews[a.bufferView];
    const off = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const st = bv.byteStride ?? 8;
    for (let i = 0; i < a.count; i++) {
      const u = bin.readFloatLE(off + i * st);
      const v = bin.readFloatLE(off + i * st + 4);
      const c = Math.min(N - 1, Math.max(0, Math.floor(u * N)));
      const r = Math.min(SATIR - 1, Math.max(0, Math.floor(v * SATIR)));
      const k = `${r},${c}`;
      say.set(k, (say.get(k) ?? 0) + 1);
    }
  }
  return [...say].sort((a, b) => b[1] - a[1]);
}

for (const dosya of process.argv.slice(2)) {
  const { j, bin } = glbAc(dosya);
  console.log(`\n=== ${path.basename(dosya)}`);
  for (const n of j.nodes) {
    if (n.mesh === undefined) continue;
    const mesh = j.meshes[n.mesh];
    const g = parcaGozleri(j, bin, mesh);
    const toplam = g.reduce((s, [, v]) => s + v, 0);
    const bas = g.slice(0, 4).map(([k, v]) => `${k}:${Math.round((v / toplam) * 100)}%`).join(' ');
    const tekRenk = g.length === 1 || (g[0][1] / toplam) > 0.97;
    console.log(
      `${(mesh.name ?? n.name).padEnd(30)} göz ${String(g.length).padStart(2)}  ${tekRenk ? 'TEK RENK ✓' : 'karışık   '}  ${bas}`,
    );
  }
}
