/**
 * olcum-tepsi.mjs — S16: "elde tepsi tutma" kusurunun sayısı.
 *
 * NEDEN: kullanıcı 2026-09-14'te *"şu an elde tepsi tutma falan sorun ama ya"* dedi. Kare
 * (`docs/gorsel/ss/s16-tepsi-yakin.png`) kusuru gösteriyor: tepsi GÖĞSE yapışık duruyor ve
 * kollar aşağıda sarkıyor — eller tepsiye değmiyor. Sebep kodda açık:
 *
 *   - Tepsi ele DEĞİL, gövdenin yanında dünya-uzayında sabit bir noktaya asılı
 *     (`KAY_TEPSI_KAYMA`, `Player.tsx` / `Waiter.tsx` içinde `<group position={...}>`).
 *   - Taşırken oynayan klip normal yürüme/durma klibi; kollar boşta sallanıyor.
 *   - Rig'in `handslot.l` / `handslot.r` kemikleri (KayKit'in EŞYA ÇAPALARI) hiç kullanılmıyor.
 *   - `Holding_A/B/C` klipleri repoda duruyor ve hiç çalınmıyor.
 *
 * Bu araç adayları ölçer: her klipte iki `handslot` nerede, iki el birbirine ne kadar yakın
 * (tek elle mi iki elle mi tutuyor), el yüksekliği ne. Tepsi çapası iki handslot'un ORTASIdır.
 *
 * Kullanım: node tools/olcum-tepsi.mjs
 *           OLCUM_YAZ=1 node tools/olcum-tepsi.mjs   → docs/olcum-tepsi.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Matrix4, Vector3, Quaternion } from 'three';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAY = path.join(KOK, 'public/assets/models/kaykit-characters');

const ACTOR_HEIGHT = 1.75;
const KAY_AUTHORED = 2.204;
const KAY_SCALE = ACTOR_HEIGHT / KAY_AUTHORED;

/** Bugünkü çapa (`actor.ts` → KAY_EL_Y / KAY_EL_Z) — karşılaştırma tabanı. */
const BUGUNKU = { y: +(1.2 * KAY_SCALE).toFixed(3), z: +(0.55 * KAY_SCALE).toFixed(3) };

/** Aday klipler: dosya → klip. Taşıma pozunun nereden geleceği bunlar arasından seçilecek. */
const ADAYLAR = [
  ['Rig_Medium_General', 'Idle_A'],
  ['Rig_Medium_MovementBasic', 'Walking_A'],
  ['Rig_Medium_MovementBasic', 'Walking_B'],
  ['Rig_Medium_MovementBasic', 'Running_A'],
  ['Rig_Medium_Tools', 'Holding_A'],
  ['Rig_Medium_Tools', 'Holding_B'],
  ['Rig_Medium_Tools', 'Holding_C'],
  ['Rig_Medium_Tools', 'Working_A'],
];

function glbOku(dosya) {
  const b = readFileSync(dosya);
  let o = 12;
  let j = null;
  let bin = null;
  while (o < b.length) {
    const len = b.readUInt32LE(o);
    const typ = b.readUInt32LE(o + 4);
    const govde = b.slice(o + 8, o + 8 + len);
    if (typ === 0x4e4f534a) j = JSON.parse(govde.toString('utf8'));
    if (typ === 0x004e4942) bin = govde;
    o += 8 + len;
  }
  return { j, bin };
}

const BILESEN = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const ADET = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function accessorOku(j, bin, idx) {
  const acc = j.accessors[idx];
  const n = ADET[acc.type];
  const cikti = new Float32Array(acc.count * n);
  if (acc.bufferView === undefined) return cikti;
  const bv = j.bufferViews[acc.bufferView];
  const taban = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const adim = bv.byteStride ?? BILESEN[acc.componentType] * n;
  for (let i = 0; i < acc.count; i++) {
    for (let k = 0; k < n; k++) {
      cikti[i * n + k] = bin.readFloatLE(taban + i * adim + k * BILESEN[acc.componentType]);
    }
  }
  return cikti;
}

/** Klibi örnekler ve istenen kemiklerin KÖK'e göre konumlarını döndürür. */
function klipOrnekle(j, bin, klip, kemikAdlari, orneklem = 60) {
  const adlar = j.nodes.map((n) => n.name);
  const kanal = new Map();
  let sure = 0;
  for (const c of klip.channels) {
    const s = klip.samplers[c.sampler];
    const t = accessorOku(j, bin, s.input);
    const v = accessorOku(j, bin, s.output);
    kanal.set(`${c.target.node}|${c.target.path}`, { t, v, n: v.length / t.length });
    sure = Math.max(sure, t[t.length - 1]);
  }
  const ornek = (k, zaman, varsayilan) => {
    if (!k) return varsayilan;
    const { t, v, n } = k;
    if (zaman <= t[0]) return Array.from(v.slice(0, n));
    if (zaman >= t[t.length - 1]) return Array.from(v.slice((t.length - 1) * n, t.length * n));
    let i = 0;
    while (i < t.length - 2 && t[i + 1] < zaman) i++;
    const a = (zaman - t[i]) / (t[i + 1] - t[i]);
    const out = [];
    for (let k2 = 0; k2 < n; k2++) out.push(v[i * n + k2] * (1 - a) + v[(i + 1) * n + k2] * a);
    return out;
  };
  const hedefler = kemikAdlari.map((ad) => adlar.indexOf(ad));
  const izler = kemikAdlari.map(() => []);
  const M = j.nodes.map(() => new Matrix4());
  for (let s = 0; s < orneklem; s++) {
    const zaman = (s / orneklem) * sure;
    const yerel = j.nodes.map((n, i) => {
      const T = ornek(kanal.get(`${i}|translation`), zaman, n.translation ?? [0, 0, 0]);
      const R = ornek(kanal.get(`${i}|rotation`), zaman, n.rotation ?? [0, 0, 0, 1]);
      const S = ornek(kanal.get(`${i}|scale`), zaman, n.scale ?? [1, 1, 1]);
      return new Matrix4().compose(new Vector3(...T), new Quaternion(R[0], R[1], R[2], R[3]), new Vector3(...S));
    });
    const yur = (i, u) => {
      M[i].multiplyMatrices(u, yerel[i]);
      for (const c of j.nodes[i].children ?? []) yur(c, M[i]);
    };
    for (const r of j.scenes?.[0]?.nodes ?? []) yur(r, new Matrix4());
    hedefler.forEach((h, k) => {
      if (h >= 0) izler[k].push(new Vector3().setFromMatrixPosition(M[h]));
    });
  }
  return { sure, izler };
}

const ort = (iz, eksen) => iz.reduce((s, p) => s + p[eksen], 0) / iz.length;
const acilim = (iz, eksen) => Math.max(...iz.map((p) => p[eksen])) - Math.min(...iz.map((p) => p[eksen]));

function tepsiOlc(dosyaAd, klipAd) {
  const { j, bin } = glbOku(path.join(KAY, `${dosyaAd}.glb`));
  const klip = j.animations.find((a) => a.name === klipAd);
  if (!klip) return null;
  const { sure, izler } = klipOrnekle(j, bin, klip, ['handslot.l', 'handslot.r', 'hand.l', 'hand.r', 'head']);
  const [sl, sr] = izler;
  if (!sl.length || !sr.length) return null;

  // İki elin ORTASI = tepsi çapası. Ayrıca eller arası mesafe "iki elle mi tutuyor"u söyler.
  const orta = { x: (ort(sl, 'x') + ort(sr, 'x')) / 2, y: (ort(sl, 'y') + ort(sr, 'y')) / 2, z: (ort(sl, 'z') + ort(sr, 'z')) / 2 };
  const mesafe = Math.hypot(ort(sl, 'x') - ort(sr, 'x'), ort(sl, 'y') - ort(sr, 'y'), ort(sl, 'z') - ort(sr, 'z'));
  // Ellerin klip boyunca ne kadar oynadığı: taşıma pozunda eller SABİT olmalı, yoksa tepsi titrer.
  const oynama = Math.max(acilim(sl, 'x'), acilim(sl, 'y'), acilim(sl, 'z'), acilim(sr, 'x'), acilim(sr, 'y'), acilim(sr, 'z'));

  return {
    dosya: dosyaAd,
    klip: klipAd,
    sure: +sure.toFixed(3),
    /** Dünya birimi (ham × KAY_SCALE) — kodun kullanacağı ölçü. */
    ortaY: +(orta.y * KAY_SCALE).toFixed(3),
    ortaZ: +(orta.z * KAY_SCALE).toFixed(3),
    ortaX: +(orta.x * KAY_SCALE).toFixed(3),
    ellerArasi: +(mesafe * KAY_SCALE).toFixed(3),
    /** Eller klip boyunca ne kadar oynuyor — tepsi için düşük olmalı. */
    elOynamasi: +(oynama * KAY_SCALE).toFixed(3),
    /** Eller gövdenin ÖNÜNDE mi (z > 0) yanında mı (z ≈ 0)? */
    ellerOnde: orta.z * KAY_SCALE > 0.12,
  };
}

const sonuc = ADAYLAR.map(([d, k]) => tepsiOlc(d, k)).filter(Boolean);

const yz = (v) => String(v).replace('.', ',');
console.log('\n=== S16 · TEPSI CAPASI: handslot kemikleri klip klip ===');
console.log('bugunku capa (KAY_EL_Y/Z, ele bagli DEGIL): y', yz(BUGUNKU.y), '· z', yz(BUGUNKU.z), '\n');
console.log('klip            sure   ORTA y   ORTA z  eller arasi  el oynamasi  eller onde');
for (const o of sonuc) {
  console.log(
    `${o.klip.padEnd(14)} ${yz(o.sure).padStart(5)}  ${yz(o.ortaY).padStart(7)}  ${yz(o.ortaZ).padStart(7)}  ` +
      `${yz(o.ellerArasi).padStart(11)}  ${yz(o.elOynamasi).padStart(11)}  ${o.ellerOnde ? 'EVET' : 'hayir'}`,
  );
}
console.log('\nOkuma: tepsi capasi iki handslot ORTASIdir. "eller arasi" kucukse tek elle tutus,');
console.log('buyukse iki elle. "el oynamasi" buyukse klip boyunca tepsi titrer.');

if (process.env.OLCUM_YAZ === '1') {
  const cikti = path.join(KOK, 'docs/olcum-tepsi.json');
  writeFileSync(cikti, JSON.stringify({ damga: new Date().toISOString(), bugunku: BUGUNKU, KAY_SCALE: +KAY_SCALE.toFixed(4), adaylar: sonuc }, null, 2), 'utf8');
  console.log(`\nyazildi -> ${path.relative(KOK, cikti)}`);
}
