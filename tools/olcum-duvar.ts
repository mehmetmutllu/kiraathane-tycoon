/**
 * olcum-duvar.ts — S4 ÖLÇÜM: oyunun duvar/zemin geometrisi KayKit modülüne oturuyor mu?
 *
 * NEDEN ARAÇ: S3'ün en pahalı dersi *"paketin modül karosu her obje için ölçek değildir"*di.
 * Duvarda risk daha büyük, çünkü duvar tek bir obje değil bir IZGARA: KayKit duvarı 4,0 birimlik
 * SABİT bir modüldür, oyunun duvar hatları ise serbest uzunluktadır. "Ölçekle ve döşe" demeden
 * önce hatların bu modüle bölünüp bölünmediği SAYIYLA bilinmeli — bölünmüyorsa fark ya
 * gerdirmeyle (doku bozulur) ya boşlukla (duvar delinir) kapanır, ve ikisi de KARARdır.
 *
 * ÖLÇME YÖNTEMİ — düşük-poli modelde "vertex say" ÇALIŞMAZ: düz bir yüzün içinde hiç vertex
 * yoktur, o yüzden vertex histogramı duvarın ortasını "delik" sanır (ilk denemede kapı boşluğu
 * 0,68 çıktı, gerçeği 1,28). Delikler bu yüzden ÜÇGENE IŞIN atılarak ölçülür (Möller-Trumbore):
 * bir (x,y) noktasından +z yönünde giden ışın hiçbir üçgeni kesmiyorsa orası GERÇEKTEN boştur.
 *
 * Bu araç hiçbir şeyi değiştirmez; ölçer ve `docs/olcum-duvar.txt` üretir.
 * Kullanım: npx tsx tools/olcum-duvar.ts
 */
import { writeFileSync, readFileSync } from 'node:fs';
import { BAND, BAND_SHELL, FLOOR_HALF, LAYOUT, activeSolids, doorX, servicePlace } from '../src/game/layout';
import { MAX_AREAS } from '../src/game/world';
// @ts-expect-error — .mjs araç, tip bildirimi yok (tools/ tsconfig kapsamında değil)
import { bbox } from './model-olc.mjs';
import { BAND_SHELL_RUNS, WALL_RUNS, WALL_T, wallDikey, wallSideLine, wallUzunluk, type WallRun } from '../src/components/three/wallLook';

const KOK = 'public/assets/models/kaykit-restaurant-bits/';
const cikti: string[] = [];
const yaz = (s = '') => {
  cikti.push(s);
  console.log(s);
};
const n3 = (v: number) => v.toFixed(3).padStart(8);
const n2 = (v: number) => v.toFixed(2).padStart(7);
const olc = (ad: string) => bbox(`${KOK}${ad}.gltf`) as { mn: number[]; mx: number[]; boyut: number[] };

// ---------------------------------------------------------------- gltf geometri okuyucu
type Ucgen = [number[], number[], number[]];

function oku(ad: string): { pos: Float32Array; idx: Uint32Array } {
  const dosya = `${KOK}${ad}.gltf`;
  const g = JSON.parse(readFileSync(dosya, 'utf8'));
  const bin = readFileSync(dosya.replace(/\.gltf$/, '.bin'));
  const al = (i: number) => {
    const a = g.accessors[i];
    const bv = g.bufferViews[a.bufferView];
    return { a, base: (bv.byteOffset ?? 0) + (a.byteOffset ?? 0) };
  };
  const pr = g.meshes[0].primitives[0];
  const { a: pa, base: pb } = al(pr.attributes.POSITION);
  const pos = new Float32Array(pa.count * 3);
  for (let i = 0; i < pa.count * 3; i++) pos[i] = bin.readFloatLE(pb + i * 4);
  const { a: ia, base: ib } = al(pr.indices);
  const idx = new Uint32Array(ia.count);
  // 5121 = UNSIGNED_BYTE · 5123 = UNSIGNED_SHORT · 5125 = UNSIGNED_INT
  const boy = ia.componentType === 5121 ? 1 : ia.componentType === 5123 ? 2 : 4;
  for (let i = 0; i < ia.count; i++)
    idx[i] = boy === 1 ? bin.readUInt8(ib + i) : boy === 2 ? bin.readUInt16LE(ib + i * 2) : bin.readUInt32LE(ib + i * 4);
  return { pos, idx };
}

function ucgenler(ad: string): Ucgen[] {
  const { pos, idx } = oku(ad);
  const t: Ucgen[] = [];
  const v = (k: number) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]];
  for (let i = 0; i < idx.length; i += 3) t.push([v(idx[i]), v(idx[i + 1]), v(idx[i + 2])]);
  return t;
}

/** Möller-Trumbore: (x,y,−9) noktasından +z yönünde giden ışın üçgeni kesiyor mu? */
function vurusZ(tri: Ucgen, x: number, y: number): number | null {
  const [a, b, c] = tri;
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  // d = (0,0,1) → h = d × e2 = (e2[1], −e2[0], 0)
  const h = [-e2[1], e2[0], 0];
  const det = e1[0] * h[0] + e1[1] * h[1];
  if (Math.abs(det) < 1e-9) return null;
  const inv = 1 / det;
  const s = [x - a[0], y - a[1], -9 - a[2]];
  const u = inv * (s[0] * h[0] + s[1] * h[1]);
  if (u < 0 || u > 1) return null;
  const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
  const v = inv * q[2];
  if (v < 0 || u + v > 1) return null;
  const t = inv * (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]);
  return t > 0 ? -9 + t : null;
}

/** Işın hiçbir üçgeni kesmiyor mu? (delik testi) */
const kesiyor = (tri: Ucgen, x: number, y: number): boolean => vurusZ(tri, x, y) !== null;

/** Modelin `y` yüksekliğinde, x ekseninde GERÇEKTEN boş olan aralıklar (ışın testiyle). */
function delikler(ad: string, y: number, adim = 0.02): [number, number][] {
  const tri = ucgenler(ad);
  const b = olc(ad);
  const bos: [number, number][] = [];
  let bas: number | null = null;
  for (let x = b.mn[0] + adim / 2; x <= b.mx[0]; x += adim) {
    const dolu = tri.some((t) => kesiyor(t, x, y));
    if (!dolu && bas === null) bas = x - adim / 2;
    if (dolu && bas !== null) {
      if (x - bas > 0.05) bos.push([bas, x - adim / 2]);
      bas = null;
    }
  }
  if (bas !== null && b.mx[0] - bas > 0.05) bos.push([bas, b.mx[0]]);
  return bos;
}

/** Modelin farklı x düzlemleri — söve/çıkıntı kalınlığını okumak için. */
function xDuzlemleri(ad: string): number[] {
  const { pos } = oku(ad);
  const set = new Set<number>();
  for (let i = 0; i < pos.length; i += 3) set.add(Math.round(pos[i] * 1000) / 1000);
  return [...set].sort((p, q) => p - q);
}

/**
 * (x,y) noktasında modelin en ÖNE taşan yüzeyinin z'si — kabartma/söve derinliği için.
 * Vertex'e bakmak YETMEZ: düz bir yüzün ortasında vertex yoktur (`wall`ın tüm 152 vertex'i
 * x = ±1,9 / ±2,0'da; panelin ortası tek bir dörtgenle geçiliyor). Işınla ölçülür.
 */
function onYuz(ad: string, x: number, y = 2.0): number {
  let z = -Infinity;
  for (const t of ucgenler(ad)) {
    const v = vurusZ(t, x, y);
    if (v !== null) z = Math.max(z, v);
  }
  return z;
}

// ---------------------------------------------------------------- §1 ÖLÇEK
yaz('S4 DUVAR + ZEMİN ÖLÇÜMÜ — ' + new Date().toISOString().slice(0, 10));
yaz('='.repeat(98));
yaz();
yaz('§1 ÖLÇEK — paketin duvarı oyunun duvarına nasıl oturur');
yaz('-'.repeat(98));
const W = olc('wall');
const OYUN_H = 3.2; // wallPanel.WALL_H
const S = OYUN_H / W.boyut[1];
const MOD_W = W.boyut[0] * S;
const MOD_T = W.boyut[2] * S;
const HALF = olc('wall_half');
const HALF_W = HALF.boyut[0] * S;
const PIL = olc('pillar_A');
yaz(`KayKit wall native       : ${n3(W.boyut[0])} en × ${n3(W.boyut[1])} yük × ${n3(W.boyut[2])} der`);
yaz(`oyunun duvarı (WALL_H)   : ${n3(OYUN_H)} yük · taban kalınlığı ${n3(WALL_T)} (gövde 0,18 · lambri 0,22 · çıta 0,26)`);
yaz(`MİMARİ ÖLÇEK  S = 3,2/4  = ${S.toFixed(4)}   ← mobilyanın 0,90'ı DEĞİL (S3/D-099 §1)`);
yaz(`→ modül eni              : ${n3(MOD_W)}`);
yaz(`→ modül kalınlığı        : ${n3(MOD_T)}   (oyunun bugünkü hattından ${n3(MOD_T - WALL_T)} kalın)`);
yaz(`→ yarım modül wall_half  : ${n3(HALF_W)}   native ${n3(HALF.boyut[0])}, origin x ${n3(HALF.mn[0])}…${n3(HALF.mx[0])} — ORTALANMAMIŞ`);
yaz(`→ sütun pillar_A         : ${n3(PIL.boyut[1] * S)} boy · duvardan ${n3((PIL.boyut[1] - W.boyut[1]) * S)} UZUN, tabanı ${n3(PIL.boyut[0] * S)} kare`);
yaz();

// ---------------------------------------------------------------- §2 HATLAR
yaz('§2 DUVAR HATLARI — her açık-alan durumunda, gerçek uzunluklarıyla');
yaz('-'.repeat(98));
yaz('Kaynak: `wallLook.WALL_RUNS` — `Scene.Walls`tan çıkarıldı, sayı ORADA tek yerde durur.');
yaz();
for (let ao = 1; ao <= MAX_AREAS; ao++) {
  yaz(`— areasOpen = ${ao} (kapı x = ${doorX(ao).toFixed(2)})`);
  yaz('    #  alan kenar     hat      uzunluk   tam modül    kalan   kalan/modül');
  const runs = WALL_RUNS(ao);
  runs.forEach((r, i) => {
    const uz = wallUzunluk(r);
    const tam = Math.floor(uz / MOD_W);
    yaz(
      `   ${String(i).padStart(2)}  ${String(r.area).padStart(4)} ${r.side.padEnd(6)} ${n2(wallSideLine(r))} ${n3(uz)}   ${String(tam).padStart(6)}  ${n3(uz - tam * MOD_W)}       ${((uz - tam * MOD_W) / MOD_W).toFixed(3)}`,
    );
  });
  const toplam = runs.reduce((a, r) => a + wallUzunluk(r), 0);
  yaz(`   TOPLAM hat ${n3(toplam)} · parça ${runs.length} · tam modül karşılığı ${(toplam / MOD_W).toFixed(2)}`);
  yaz();
}
yaz("— arka bandın bina kabuğu (BackBand, areasOpen = 3'te görünür)");
yaz('    #  kenar        hat      uzunluk   tam modül    kalan   kalan/modül');
BAND_SHELL_RUNS().forEach((r, i) => {
  const uz = wallUzunluk(r);
  const tam = Math.floor(uz / MOD_W);
  yaz(
    `   ${String(i).padStart(2)}  ${r.side.padEnd(6)} ${n2(wallSideLine(r))} ${n3(uz)}   ${String(tam).padStart(6)}  ${n3(uz - tam * MOD_W)}       ${((uz - tam * MOD_W) / MOD_W).toFixed(3)}`,
  );
});
yaz();

// ---------------------------------------------------------------- §3 MODÜLÜN YÜZÜ
yaz('§3 MODÜLÜN KENDİ PROFİLİ — duvarın nereden bölündüğü ZATEN yazılı');
yaz('-'.repeat(98));
const xd = xDuzlemleri('wall');
yaz(`  wall'ın x düzlemleri : ${xd.map((v) => v.toFixed(2)).join(' · ')}`);
yaz('  → panelin ORTASINDA hiç vertex yok: düz yüz tek dörtgenle geçiliyor. Profil ışınla ölçüldü.');
yaz();
yaz('  panelin ön yüzü, yükseklik boyunca (x = 0):');
yaz('     y native   y dünya    ön yüz z    dünyada duvar kalınlığı');
let olukY = 0;
let olukZ = 0.25;
for (let y = 0.1; y <= 3.95; y += 0.1) {
  const z = onYuz('wall', 0, y);
  if (z < olukZ - 1e-6) {
    olukZ = z;
    olukY = y;
  }
}
for (const y of [0.5, 1.5, 1.9, 2.0, 2.1, 2.5, 3.5]) {
  const z = onYuz('wall', 0, y);
  yaz(`    ${n3(y)}  ${n3(y * S)}    ${n3(z)}    ${n3(z * 2 * S)}${Math.abs(y - 2.0) < 1e-6 ? '   ← YATAY OLUK' : ''}`);
}
yaz();
yaz(`  ① YATAY OLUK: modülün yüzü y = ${n3(olukY)} native = ${n3(olukY * S)} DÜNYA'da bir kuşakla bölünür`);
yaz(`     (z ${n3(0.25)} → ${n3(olukZ)}, yani ${n3((0.25 - olukZ) * 2 * S)} derin). Bu KayKit'in kendi lambri hattıdır.`);
yaz(`     OYUNUN maket duvarında aynı hat ${n3(0.94)}'te (WAINSCOT_H 0,9 + çıta) — yani duvar yüksekliğinin`);
yaz(`     %${((0.94 / 3.2) * 100).toFixed(0)}'inde. KayKit'inki %${((olukY / 4) * 100).toFixed(0)}'inde, tam ORTADA. Takas bu hattı ${n3(olukY * S - 0.94)} YUKARI taşır.`);
yaz();
const bevelZ = onYuz('wall', 1.97, 1.0);
yaz(`  ② ÇEVRE PAHI: x ${n3(1.9)} → ${n3(2.0)} arasında yüz ${n3(0.25)}'ten ${n3(bevelZ)}'e iner`);
yaz(`     (${n3(0.1 * S)} eninde bir pah). İki modül yan yana gelince dikişte ${n3(0.2 * S)} enli`);
yaz('     bir V-OLUK okunur — çıkıntı değil, GİRİNTİ. Paketin kendi döşeme ritmi budur.');
yaz(`  ③ x ekseninde gerdirme yalnız bu DİKEY pahı gerer; yatay oluk etkilenmez (yataydır).`);
yaz(`     Bindirme (modülleri üst üste kaydırma) işe yaramaz: pah panelin ortasına düşer.`);
yaz();

// ---------------------------------------------------------------- §4 DÖŞEME KOLLARI
yaz('§4 DÖŞEME KOLLARI — kalan nasıl kapanır? (dört kol, hepsi aynı hatlarda ölçüldü)');
yaz('-'.repeat(98));
yaz('K1 TEK PARÇA        : her hat TEK `wall`, hattın boyuna gerilir.');
yaz('K2 TAM + ARTIK      : tam modüller 1:1 döşenir, ARTAN tek bir modülün gerilmişidir.');
yaz('K3 TAM + YARIM + ARTIK: `wall` (3,20) ve `wall_half` (1,60) ile döşenir, artan yine gerilir.');
yaz('K4 EŞ DAĞITIM       : n = yuvarla(L / 3,20) modül, HEPSİ aynı oranda gerilir → dikiş eşit.');
yaz();
type Kol = { ad: string; parca: number; gerSay: number; gerMax: number; gerTop: number };
const HEPSI: WallRun[] = [];
for (let ao = 1; ao <= MAX_AREAS; ao++) HEPSI.push(...WALL_RUNS(ao));
HEPSI.push(...BAND_SHELL_RUNS());

function olcKol(ad: string, kip: 'tek' | 'tam' | 'yarim' | 'es'): Kol {
  let parca = 0;
  let gerSay = 0;
  let gerMax = 0;
  let gerTop = 0;
  const say = (f: number) => {
    gerSay++;
    gerMax = Math.max(gerMax, Math.abs(1 - f));
    gerTop += Math.abs(1 - f);
  };
  for (const r of HEPSI) {
    const uz = wallUzunluk(r);
    if (kip === 'tek') {
      parca++;
      say(uz / MOD_W);
      continue;
    }
    if (kip === 'es') {
      const n = Math.max(1, Math.round(uz / MOD_W));
      parca += n;
      const f = uz / (n * MOD_W);
      for (let i = 0; i < n; i++) say(f);
      continue;
    }
    const birim = kip === 'tam' ? [MOD_W] : [MOD_W, HALF_W];
    let kalan = uz;
    for (const b of birim) {
      const k = Math.floor((kalan + 1e-6) / b);
      parca += k;
      kalan -= k * b;
    }
    if (kalan > 0.01) {
      parca++;
      // Artık, kendisine EN YAKIN birimin gerilmişidir (yarım varken tam modülü germek haksız kıyas).
      const taban = birim.reduce((a, b) => (Math.abs(1 - kalan / b) < Math.abs(1 - kalan / a) ? b : a));
      say(kalan / taban);
    }
  }
  return { ad, parca, gerSay, gerMax, gerTop };
}
const kollar = [
  olcKol('K1 tek parça', 'tek'),
  olcKol('K2 tam + artık', 'tam'),
  olcKol('K3 tam + yarım + artık', 'yarim'),
  olcKol('K4 eş dağıtım', 'es'),
];
yaz('kol                       parça   gerilen   en kötü gerilme   ortalama gerilme   pah en kötü');
for (const k of kollar)
  yaz(
    `${k.ad.padEnd(25)} ${String(k.parca).padStart(5)}   ${String(k.gerSay).padStart(7)}   ${(k.gerMax * 100).toFixed(1).padStart(14)}%   ${((k.gerTop / Math.max(1, k.gerSay)) * 100).toFixed(1).padStart(15)}%   ${((0.1 * S) * (1 + k.gerMax)).toFixed(3).padStart(11)}`,
  );
yaz();
yaz(`  ("pah en kötü": normalde ${(0.1 * S).toFixed(3)} olan dikey pahın en çok gerildiği hâli.)`);
yaz();
yaz('PARÇA SAYISI DRAW-CALL DEĞİLDİR: her duvar modeli tek node/tek mesh/tek materyal');
yaz("(`restaurant` atlası) → `<Merged>` ile masalarda olduğu gibi MODEL BAŞINA 1 draw-call.");
yaz('Kıyas: `Tables.tsx` bugün 5 mobilya modelini ~8 draw-call\'da çiziyor.');
yaz();
yaz('  K4 eş dağıtımın hat başına gerçek gerilmesi:');
yaz('    uzunluk    n    gerilme     modül eni');
const gorulen = new Set<number>();
for (const r of HEPSI) {
  const uz = Math.round(wallUzunluk(r) * 100) / 100;
  if (gorulen.has(uz)) continue;
  gorulen.add(uz);
  const n = Math.max(1, Math.round(uz / MOD_W));
  yaz(`    ${n3(uz)} ${String(n).padStart(4)}   ${((uz / (n * MOD_W) - 1) * 100).toFixed(1).padStart(7)}%   ${n3(uz / n)}`);
}
yaz();

// ---------------------------------------------------------------- §5 KALINLIK
yaz('§5 KALINLIK — modül 0,40, oyunun hattı 0,20 (en kalın katmanı çıta 0,26). Fazlalık nereye?');
yaz('-'.repeat(98));
const icTasma = MOD_T / 2 - 0.26 / 2; // gözle görülen yüz en kalın katmandır → kıyas ona göre
yaz(`hat merkezinden iç yüze  : bugün ${n3(0.26 / 2)} (çıta) → KayKit ${n3(MOD_T / 2)}`);
yaz(`İÇERİ FAZLADAN TAŞMA     : ${n3(icTasma)}`);
yaz();
yaz('Duvar collision DEĞİL (`activeSolids` duvarı içermez) → bu taşma yürümeyi engellemez.');
yaz('Ama katı bir objeyi KESERSE gözle hata olarak okunur. Hat başına en yakın katı:');
yaz();
yaz('  duvar hattı                    en yakın katı   KayKit sonrası');
const solids = activeSolids(LAYOUT.tables.length, MAX_AREAS);
let kesen = 0;
let enDar = Infinity;
for (const r of [...WALL_RUNS(MAX_AREAS), ...BAND_SHELL_RUNS()]) {
  const dikey = wallDikey(r);
  const line = wallSideLine(r);
  const p0 = (dikey ? r.z : r.x) - wallUzunluk(r) / 2;
  const p1 = (dikey ? r.z : r.x) + wallUzunluk(r) / 2;
  let enYakin = Infinity;
  for (const s of solids) {
    // Solid.h = [hx, hz] — İKİ elemanlı (layout.ts:607). Üçüncü indis YOKTUR.
    const boyC = dikey ? s.c[2] : s.c[0];
    const boyH = dikey ? s.h[1] : s.h[0];
    if (boyC + boyH < p0 || boyC - boyH > p1) continue; // hattın uzunluğu boyunca değil
    const c = dikey ? s.c[0] : s.c[2];
    const h = dikey ? s.h[0] : s.h[1];
    enYakin = Math.min(enYakin, Math.abs(c - line) - h);
  }
  if (!isFinite(enYakin)) continue;
  const sonra = enYakin - icTasma;
  enDar = Math.min(enDar, sonra);
  if (sonra < 0) kesen++;
  yaz(
    `  ${String(r.area)}/${r.side.padEnd(6)} @${n2(line)} L${n2(wallUzunluk(r))}      ${n3(enYakin)}         ${n3(sonra)}${sonra < 0 ? '  ← KESİYOR' : ''}`,
  );
}
yaz(`  → kesişen hat: ${kesen} · en dar kalan boşluk ${n3(enDar)} (oyuncu yarıçapı 0,47)`);
yaz();

// ---------------------------------------------------------------- §6 KAPI / PENCERE
yaz('§6 KAPI VE PENCERE — modülün deliği ışın testiyle ölçüldü (vertex sayımı YANLIŞ sonuç verir)');
yaz('-'.repeat(98));
const kapiDelik = delikler('wall_doorway', 1.4);
const kapiEn = kapiDelik.length ? kapiDelik[0][1] - kapiDelik[0][0] : 0;
for (const [a, b] of kapiDelik)
  yaz(`  wall_doorway  @y1,4 : x ${n3(a)} … ${n3(b)} = ${n3(b - a)} native → ${n3((b - a) * S)} dünya`);
// lento yüksekliği: deliğin bittiği ilk y
// Delik ARANIRKEN en az 1,0 genişlik istenir: modelin üst kenarındaki pah, ışın tam kenara
// denk gelince "boş" görünebiliyor ve tarama tavanı 4,0 sanıyordu.
const genisDelik = (ad: string, y: number) => delikler(ad, y).some(([a, b]) => b - a > 1.0);
let lento = 0;
for (let y = 0.4; y < 3.9; y += 0.05) if (genisDelik('wall_doorway', y)) lento = y + 0.05;
yaz(`  wall_doorway lento  : y ≈ ${n3(lento)} native → ${n3(lento * S)} dünya`);
const pencDelik = delikler('wall_window_open', 1.5);
for (const [a, b] of pencDelik)
  yaz(`  wall_window_open @y1,5: x ${n3(a)} … ${n3(b)} = ${n3(b - a)} native → ${n3((b - a) * S)} dünya`);
let pAlt = 9;
let pUst = 0;
for (let y = 0.2; y < 3.9; y += 0.05)
  if (genisDelik('wall_window_open', y)) {
    pAlt = Math.min(pAlt, y);
    pUst = Math.max(pUst, y + 0.05);
  }
yaz(`  pencere boşluğu y   : ${n3(pAlt)} … ${n3(pUst)} native → ${n3(pAlt * S)} … ${n3(pUst * S)} dünya`);
const door = olc('door_A');
yaz(`  door_A kanadı       : ${n3(door.boyut[0])} × ${n3(door.boyut[1])} native → ${n3(door.boyut[0] * S)} × ${n3(door.boyut[1] * S)} dünya (deliğe TAM oturuyor)`);
yaz();
yaz(`  OYUNUN kapı boşluğu : ${n3(2 * 2.2)} (DOOR.half 2,2 × 2) · lento 2,65 · alınlık 2,65…3,20`);
yaz(`  → modülün deliği oyunun kapısının %${((kapiEn * S) / 4.4 * 100).toFixed(0)}'i · ${n3(4.4 - kapiEn * S)} DAR`);
yaz(`  → oyunun kapısı ${(4.4 / MOD_W).toFixed(2)} modül geniş; tek wall_doorway yetmez.`);
yaz(`  → oyuncu çapı 0,94 · modülün deliği ${n3(kapiEn * S)} → geçilebilir ama TEK KİŞİLİK.`);
yaz();

// ---------------------------------------------------------------- §7 SÜSLÜ DUVAR TUZAĞI
yaz('§7 `wall_decorated` — adı "süslü duvar", geometrisi ne? (S3 dersi: ada bakma, ölç)');
yaz('-'.repeat(98));
const wd = olc('wall_decorated');
yaz(`  bbox: ${n3(wd.boyut[0])} × ${n3(wd.boyut[1])} × ${n3(wd.boyut[2])} · z ${n3(wd.mn[2])} … ${n3(wd.mx[2])}`);
let uy1 = -Infinity;
let ux0 = Infinity;
let ux1 = -Infinity;
{
  const { pos } = oku('wall_decorated');
  for (let i = 0; i < pos.length; i += 3)
    if (pos[i + 2] > 0.3) {
      uy1 = Math.max(uy1, pos[i + 1]);
      ux0 = Math.min(ux0, pos[i]);
      ux1 = Math.max(ux1, pos[i]);
    }
}
yaz(`  duvar yüzeyinin ÖNÜNE taşan geometri: x ${n3(ux0)} … ${n3(ux1)} · tepe y ${n3(uy1)}`);
yaz(`  → dünyada salona ${n3((wd.mx[2] - 0.25) * S)} taşar, ${n3(uy1 * S)} boyunda, ${n3((ux1 - ux0) * S)} eninde.`);
yaz('  çıkıntının profili (ön yüz z, ışınla):');
yaz('     y native   y dünya    ön yüz z    salona taşma (dünya)');
for (const y of [0.4, 1.0, 2.0, 2.6, 3.0, 3.6]) {
  const z = onYuz('wall_decorated', 0, y);
  yaz(`    ${n3(y)}  ${n3(y * S)}    ${n3(z)}    ${n3((z - 0.25) * S)}`);
}
yaz('  KIYAS: oyuncu yarıçapı 0,47 · banket adası derinliği ~2,4 — bu bir DUVAR değil, duvar+mobilya.');
yaz('  Salon duvarında kullanılırsa collision listesine GİRMEK zorunda, yoksa içinden geçilir.');
yaz();

// ---------------------------------------------------------------- §8 ZEMİN
yaz('§8 ZEMİN — `floor_kitchen` mutfak fayansına oturuyor mu?');
yaz('-'.repeat(98));
const fk = olc('floor_kitchen');
const fks = olc('floor_kitchen_small');
const KARO = fk.boyut[0] * S;
const KARO_S = fks.boyut[0] * S;
const sx0 = BAND_SHELL.innerLeft;
const sx1 = BAND.service.maxX - 0.1;
const sz0 = BAND_SHELL.innerBack;
const sz1 = BAND.front - 0.05;
yaz(`  floor_kitchen native  : ${n3(fk.boyut[0])} × ${n3(fk.boyut[1])} kalınlık × ${n3(fk.boyut[2])} · üst yüz y ${n3(fk.mx[1])}`);
yaz(`  → dünyada karo        : ${n3(KARO)} × ${n3(KARO)} · KALINLIK ${n3(fk.boyut[1] * S)} → zemine gömülmeli (y kayması ${n3(-fk.boyut[1] * S)})`);
yaz(`  → küçük karo          : ${n3(KARO_S)} × ${n3(KARO_S)}`);
yaz(`  mutfak fayans alanı   : ${n3(sx1 - sx0)} × ${n3(sz1 - sz0)}  (x ${n2(sx0)}…${n2(sx1)} · z ${n2(sz0)}…${n2(sz1)})`);
yaz(`  → büyük karo ile      : ${((sx1 - sx0) / KARO).toFixed(2)} × ${((sz1 - sz0) / KARO).toFixed(2)} · eş dağıtımla ${Math.round((sx1 - sx0) / KARO)} × ${Math.round((sz1 - sz0) / KARO)} karo, gerilme %${(((sx1 - sx0) / (Math.round((sx1 - sx0) / KARO) * KARO) - 1) * 100).toFixed(1)} × %${(((sz1 - sz0) / (Math.round((sz1 - sz0) / KARO) * KARO) - 1) * 100).toFixed(1)}`);
yaz(`  → küçük karo ile      : ${((sx1 - sx0) / KARO_S).toFixed(2)} × ${((sz1 - sz0) / KARO_S).toFixed(2)} · eş dağıtımla ${Math.round((sx1 - sx0) / KARO_S)} × ${Math.round((sz1 - sz0) / KARO_S)} karo, gerilme %${(((sx1 - sx0) / (Math.round((sx1 - sx0) / KARO_S) * KARO_S) - 1) * 100).toFixed(1)} × %${(((sz1 - sz0) / (Math.round((sz1 - sz0) / KARO_S) * KARO_S) - 1) * 100).toFixed(1)}`);
yaz('  bugünkü hâli          : tek planeGeometry + düz renk #d9cdb4 (1 draw-call, 2 üçgen)');
yaz(`  servis tezgâhının ön yüzü z = ${servicePlace(MAX_AREAS).station[2].toFixed(2)} — fayans buraya kadar geliyor.`);
yaz();
yaz(`  SALON zemini (kıyas)  : ${n3(2 * FLOOR_HALF)} × ${n3(2 * FLOOR_HALF)} → büyük karoyla ${(((2 * FLOOR_HALF) / KARO) ** 2).toFixed(0)} karo.`);
yaz(`  Salon zemini D-073'te KARARDIR: "kesinlikle parke değil, maketteki gibi TEK DÜZ AHŞAP"`);
yaz('  ve MAĞAZA ÜRÜNÜdür (5 kalem) — bu ölçüm salon zeminine dokunmaz, yalnız mutfağa.');
yaz();

// ---------------------------------------------------------------- §9 TEMA
yaz('§9 KOZMETİK TEMA — duvar teması MAĞAZA ÜRÜNÜ, KayKit dokusu tek renk getiriyor');
yaz('-'.repeat(98));
yaz('  economy.config.cosmetics.wallThemes : krem (0 ₺) · yeşil (10.000 ₺) · mavi (14.000 ₺)');
yaz('  Bugün tema üç KUTU RENGİDİR (cream/wainscot/rail) ve `wallPanel.wallBoxes` doğrudan boyar:');
yaz('  tema değişince üç instance rengi değişir, başka hiçbir şey olmaz.');
yaz('  KayKit duvarı tek `restaurant` atlasına bağlı → renk materyalden değil ATLASTAN gelir.');
yaz("  Hattın karşılığı S3'te ölçüldü ve HAZIR: `tools/atlas-goz.mjs` + `tools/atlas-ton.mjs`");
yaz("  (`recolor.ts` çalışma-zamanı atlas kopyası; masalarda 8 draw-call'da kalıyor).");
yaz('  Yani tema kaybolmak zorunda değil — ama üç temanın da atlasta karşılığı ÜRETİLMELİ.');
yaz();

// ---------------------------------------------------------------- §10 GERİ DÖNÜŞ
yaz('§10 GERİ DÖNÜŞ — kullanıcı şartı: "beğenmezsek eskisine dönebilir olalım"');
yaz('-'.repeat(98));
yaz('  Eski duvar `wallPanel.tsx`te ve KENDİ BAŞINA çalışıyor: `wallBoxes()` saf fonksiyon,');
yaz('  `WallPanels` tek InstancedMesh. Yani KayKit hattı onun YERİNE geçmek zorunda değil,');
yaz('  YANINA konabilir — `wallLook.WALL_RUNS` ikisini de besler (aynı parça listesi).');
yaz('  Maliyet: iki çizim hattı bakımda kalır; kazanç: kip değiştirmek tek satır, geri dönüş');
yaz('  bir commit revert\'ı değil bir AYAR. `Model.tsx` fallback deseni zaten bunun aynısı.');
yaz(`  Eski hattın bugünkü bedeli: ${WALL_RUNS(MAX_AREAS).length + 3} parça × 3 kutu = ${(WALL_RUNS(MAX_AREAS).length + 3) * 3} instance, 1 draw-call.`);
yaz();

// ---------------------------------------------------------------- BULGULAR
yaz('='.repeat(98));
yaz('§BULGULAR — karar bekleyen kollar (SAYILAR yukarıda; raporun KARAR bölümü BOŞ)');
yaz('='.repeat(98));
yaz();
const k4 = kollar[3];
yaz(`B1  modül eni ${MOD_W.toFixed(2)} · hiçbir hat tam bölünmüyor → K1 %${(kollar[0].gerMax * 100).toFixed(0)} · K2 %${(kollar[1].gerMax * 100).toFixed(0)} · K3 %${(kollar[2].gerMax * 100).toFixed(0)} · K4 %${(k4.gerMax * 100).toFixed(1)} en kötü gerilme`);
yaz(`B2  modülün ucunda ${(0.1 * S).toFixed(2)} enli PAH var → gerdirme pahı da geriyor; K4'te en kötü ${((0.1 * S) * (1 + k4.gerMax)).toFixed(3)}`);
yaz(`B3  kalınlık 0,26 → ${MOD_T.toFixed(2)} · içeri ${icTasma.toFixed(2)} taşma · kesişen hat ${kesen} · en dar boşluk ${enDar.toFixed(2)}`);
yaz(`B4  kapı deliği ${(kapiEn * S).toFixed(2)} × ${(lento * S).toFixed(2)} · oyunun kapısı 4,40 × 2,65 → ${(4.4 - kapiEn * S).toFixed(2)} dar`);
yaz(`B5  wall_decorated salona ${((wd.mx[2] - 0.25) * S).toFixed(2)} taşıyor — düz duvar DEĞİL, duvar+mobilya`);
yaz(`B6  floor_kitchen karosu ${KARO.toFixed(2)} · mutfak ${((sx1 - sx0) / KARO).toFixed(2)} × ${((sz1 - sz0) / KARO).toFixed(2)} karo`);
yaz('B7  duvar teması MAĞAZA ÜRÜNÜ (3 kalem · 24.000 ₺) — atlas boyama hattı gerekiyor');
yaz('B8  geri dönüş: eski hat silinmeden YANINDA durabilir (kip ayarı), bedeli iki hattın bakımı');
yaz();

writeFileSync('docs/olcum-duvar.txt', cikti.join('\n') + '\n');
console.error('\n→ docs/olcum-duvar.txt yazıldı');
