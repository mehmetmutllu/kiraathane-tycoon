// Quaternius karakter gltf'lerini oyuna hazırlar (WP3, 2026-06-11):
//   - YALNIZ kullanılan animasyonlar kalır (Idle/Walk/Run/Wave/Interact) — 24 anim boyutun çoğu
//   - resample (yoğun keyframe'leri inceltir) + dedup + prune + quantize (KHR_mesh_quantization,
//     three.js native destekler — runtime decoder GEREKMEZ; draco/CDN yasak: D-018)
//   - .gltf (base64 gömülü) → .glb (binary)
// Kullanım: node tools/optimize-chars.mjs <girdi-klasörü> <çıktı-klasörü>
import { NodeIO } from '@gltf-transform/core';
import { KHRMeshQuantization } from '@gltf-transform/extensions';
import { resample, prune, dedup, quantize } from '@gltf-transform/functions';
import { readdirSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const KEEP_ANIMS = new Set(['Idle', 'Idle_Neutral', 'Walk', 'Run', 'Wave', 'Interact']);
const [inDir, outDir] = process.argv.slice(2);
if (!inDir || !outDir) {
  console.error('kullanım: node tools/optimize-chars.mjs <girdi> <çıktı>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const io = new NodeIO().registerExtensions([KHRMeshQuantization]);

for (const f of readdirSync(inDir).filter((f) => f.endsWith('.gltf'))) {
  const doc = await io.read(join(inDir, f));
  for (const anim of doc.getRoot().listAnimations()) {
    if (!KEEP_ANIMS.has(anim.getName())) anim.dispose();
  }
  await doc.transform(resample(), dedup(), prune(), quantize());
  const out = join(outDir, basename(f, '.gltf') + '.glb');
  await io.write(out, doc);
  console.log(out);
}
