/**
 * olcum-wc-odasi.ts — S7 ÖLÇÜM: WC odası (kabin kapıları · lavabo seviyesi · müşterinin kayboluşu).
 *
 * NEDEN AYRI ARAÇ — bu tur S6'nın dersini bir kez daha sınıyor. S6'da karşı binalar üç kamera
 * kipinde de **%0** görünür çıktı ve 10.389 üçgenlik iş ölçülmeseydi yapılacaktı. WC odası AYNI
 * riski taşır, üstelik daha ağırını: oda bandın İÇİNDE ve önünde **2,2 birimlik bir duvar** var.
 * Yani burada iki soru üst üste biniyor — "kadraja giriyor mu" VE "duvar örtüyor mu". §V ikisini
 * birden ölçer; §K/§L/§M'nin hepsi §V'nin cevabına bağlıdır.
 *
 * ÜÇ SORU, ÜÇÜ DE KULLANICIDAN:
 *   §K  kabin kapıları bugün düz kutu (1,36 × 1,95 × 0,06, tek renk kahve) — kullanıcı "kötü" dedi.
 *   §L  G-36: seviye noktaları kaldırıldı, lavabo seviyesi artık HİÇBİR yerden okunmuyor.
 *       Aday: seviye = lavabo SAYISI (mekânsal sinyal). Doğu duvarı kaç lavabo alıyor?
 *   §M  G-35: müşteri kapı eşiğinde buharlaşıyor. Oda çizilmeden önce bu bir TASARIMDI; oda
 *       çizildikten sonra kullanıcı onu HATA olarak okudu.
 *
 * Bu araç hiçbir şeyi değiştirmez; ölçer ve `docs/olcum-wc-odasi.txt` üretir.
 * Kullanım: npx tsx tools/olcum-wc-odasi.ts        (kısa — yön gösterir)
 *           OLCUM=tam npx tsx tools/olcum-wc-odasi.ts > docs/olcum-wc-odasi.txt
 */
import { readFileSync } from 'node:fs';
import { ACTOR_HEIGHT, CAMERA_LOOK_Y, PLAYER_RADIUS } from '../src/config/actor';
import { CAMERA_DIST, CAMERA_FOV, CAMERA_PORTRAIT_CLAMP, CAMERA_ZOOM_OUT_MUL } from '../src/config/camera';
import { economyConfig } from '../src/config/economy.config';
import { BAND, BAND_SHELL, FLOOR_HALF, LAVABO, LAYOUT } from '../src/game/layout';
import {
  AYNA_H, AYNA_S, AYNA_Y, LAVABO_CARPITMA, LAVABO_DUVAR_PAYI, LAVABO_KUTU, LAVABO_NATIVE, LAVABO_SCALE,
} from '../src/components/three/wcLook';
import { KIP, damga, damgaOzeti, kipBandi } from './olcum-lib';
// @ts-expect-error — .mjs araçlar, tip bildirimi yok (tools/ tsconfig kapsamında değil)
import { bbox } from './model-olc.mjs';
// @ts-expect-error — .mjs
import { gozler } from './atlas-goz.mjs';
// @ts-expect-error — .mjs
import { gozRenkleri } from './atlas-renk.mjs';

const cikti: string[] = [];
const yaz = (s = '') => {
  cikti.push(s);
  console.log(s);
};
const n2 = (v: number) => v.toFixed(2).padStart(7);
const n3 = (v: number) => v.toFixed(3).padStart(8);
const yz = (v: number) => `${(v * 100).toFixed(0).padStart(4)}%`;

type Paket = 'kaykit-restaurant-bits' | 'kaykit-furniture-bits' | 'kaykit-city-builder-bits';
const DOKU: Record<Paket, string> = {
  'kaykit-restaurant-bits': 'restaurantbits_texture.png',
  'kaykit-furniture-bits': 'furniturebits_texture.png',
  'kaykit-city-builder-bits': 'citybits_texture.png',
};
type Ham = { mn: number[]; mx: number[]; boyut: number[] };
const yol = (p: Paket, ad: string) => `public/assets/models/${p}/${ad}.gltf`;
const olc = (p: Paket, ad: string): Ham => bbox(yol(p, ad)) as Ham;

/** Modelin üçgen sayısı — çizim bütçesi kararı tahminle verilmesin. */
function ucgenSayisi(p: Paket, ad: string): number {
  const g = JSON.parse(readFileSync(yol(p, ad), 'utf8'));
  let n = 0;
  for (const m of g.meshes ?? [])
    for (const pr of m.primitives ?? [])
      n += (pr.indices !== undefined ? g.accessors[pr.indices].count : g.accessors[pr.attributes.POSITION].count) / 3;
  return n;
}

/**
 * MODELİN PARÇALARI — bbox tek bir kutu verir ve o kutu YANILTABİLİR.
 *
 * Bu ölçüm S6'nın ayna dersinin doğrudan devamı: `pictureframe_medium`in bbox'ı "0,7 × 0,9 × 0,2"
 * diyordu, ama modelin hangi yüzünün öne baktığı ancak parçalar ayrı ayrı ölçülünce çıktı ve o
 * sayı bir hatayı (sırtı odaya bakan ayna) yakaladı. Kabin kapısında aynı risk var: `door_A`
 * 1,60 × 2,80 × **0,771** ölçülüyor — 0,771 derinlik düz bir kanat için FAZLA. İki ihtimal:
 * (a) model kasa + kanat birlikte, (b) kanat gltf'te ARALIK yazılmış (döndürülmüş). İkisi çok
 * farklı şeyler; hangisi olduğu tahmin edilmez, ölçülür.
 */
function parcalar(p: Paket, ad: string): { ad: string; mn: number[]; mx: number[]; aci: number }[] {
  const g = JSON.parse(readFileSync(yol(p, ad), 'utf8'));
  const out: { ad: string; mn: number[]; mx: number[]; aci: number }[] = [];
  const gez = (i: number, ofs: number[], aci: number) => {
    const nd = g.nodes[i];
    const t = nd.translation ?? [0, 0, 0];
    const q = nd.rotation ?? [0, 0, 0, 1];
    // y ekseni etrafındaki dönüş (kapı menteşesi bu eksende döner)
    const yAci = (Math.atan2(2 * (q[3] * q[1] + q[0] * q[2]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * 180) / Math.PI;
    const o = [ofs[0] + t[0], ofs[1] + t[1], ofs[2] + t[2]];
    const a = aci + yAci;
    if (nd.mesh !== undefined) {
      const mn = [Infinity, Infinity, Infinity];
      const mx = [-Infinity, -Infinity, -Infinity];
      for (const pr of g.meshes[nd.mesh].primitives) {
        const acc = g.accessors[pr.attributes.POSITION];
        if (!acc?.min) continue;
        for (let d = 0; d < 3; d++) {
          mn[d] = Math.min(mn[d], acc.min[d]);
          mx[d] = Math.max(mx[d], acc.max[d]);
        }
      }
      out.push({ ad: nd.name ?? g.meshes[nd.mesh].name ?? `mesh${nd.mesh}`, mn, mx, aci: a });
    }
    for (const c of nd.children ?? []) gez(c, o, a);
  };
  for (const i of g.scenes[g.scene ?? 0].nodes) gez(i, [0, 0, 0], 0);
  return out;
}

/**
 * MODELİN HAM KÖŞELERİ (yerel koordinat). Kesit ölçümü için: bbox "0,771 derinlik" diyor ama
 * o derinliğin KASA mı KANAT mı olduğunu ancak köşelerin x boyunca dağılımı söyler.
 * Yalnız TRS'siz tek-node modeller için yeterli (parça dökümü hepsinin y-açısını 0 ölçtü).
 */
function koseler(p: Paket, ad: string): number[][] {
  const g = JSON.parse(readFileSync(yol(p, ad), 'utf8'));
  const bin = readFileSync(`public/assets/models/${p}/${g.buffers[0].uri}`);
  const out: number[][] = [];
  for (const m of g.meshes ?? [])
    for (const pr of m.primitives ?? []) {
      const a = g.accessors[pr.attributes.POSITION];
      const bv = g.bufferViews[a.bufferView];
      const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
      const st = bv.byteStride || 12;
      for (let i = 0; i < a.count; i++) {
        const o = off + i * st;
        out.push([bin.readFloatLE(o), bin.readFloatLE(o + 4), bin.readFloatLE(o + 8)]);
      }
    }
  return out;
}

// --- ODANIN BUGÜNKÜ SAYILARI (MaketLavaboBlock'tan BİREBİR — tahmin yok) ---
const ROOM_H = 2.2;
const x1 = BAND.wc.minX;              // 4,60
const x2 = BAND_SHELL.innerRight;     // doğu duvarının İÇ yüzü
const zBack = BAND_SHELL.innerBack;   // arka duvarın İÇ yüzü
const zFront = BAND.front;            // −9,80
const doorX = LAVABO.door[0];         // 13,40
const p0 = x1 + 0.4;                  // ilk bölme
const zp = zBack + 0.8;               // bölmelerin z'si
const zd = zBack + 1.6;               // kabin kapılarının z'si
const KAPI_YARI = 0.7;                // ön duvardaki boşluğun yarı eni
const DUVAR_KALIN = 0.22;             // MaketWall'un en kalın parçası (lambri kuşağı)
const LAVABO_X = x2 - LAVABO_DUVAR_PAYI;
const LAVABO_Z0 = zBack + 2.4;        // bugünkü üçlünün ORTASI
const LAVABO_ARALIK = 1.7;            // bugünkü sabit dz

kipBandi();
yaz('='.repeat(112));
yaz(`S7 ÖLÇÜM — WC ODASI  ·  kip: ${KIP.toUpperCase()}  ·  ${new Date().toISOString().slice(0, 10)}`);
yaz('='.repeat(112));
yaz("Bu dosya KARAR İÇERMEZ. Kollar `docs/wc-odasi-raporu-s7.md` §Bulgular'da; seçim kullanıcının.");
yaz();
yaz(`ODANIN KUTUSU (MaketLavaboBlock'tan birebir): x ${n2(x1)} … ${n2(x2)}  ·  z ${n2(zBack)} … ${n2(zFront)}`);
yaz(`  → iç ölçü ${(x2 - x1).toFixed(2)} × ${(zFront - zBack).toFixed(2)} br · oda duvarı ${n2(ROOM_H)} · kapı boşluğu ${(KAPI_YARI * 2).toFixed(2)} br @ x ${n2(doorX)}`);
yaz(`  → bölmeler z ${n2(zp)} (5 adet, x ${n2(p0)} + i×1,50) · kabin kapıları z ${n2(zd)} (4 adet)`);
yaz(`  → lavabolar x ${n2(LAVABO_X)} · z ${n2(LAVABO_Z0)} ∓ ${n2(LAVABO_ARALIK)} (3 adet, SABİT)`);
yaz();

// ============================================================================================
//  §V GÖRÜNÜRLÜK — §K/§L/§M'den ÖNCE sorulması gereken soru
// ============================================================================================
//
// İKİ SÜZGEÇ ÜST ÜSTE:
//   1) KADRAJ — nokta kameranın görüş konisinde mi? (S6 §V'nin yöntemi, birebir)
//   2) ÖRTME  — kameradan noktaya giden ışın odanın ÖN DUVARINI kesiyor mu? Bu süzgeç S6'da
//               YOKTU çünkü sokakta önde duran bir duvar yoktu. WC odasında asıl soru bu:
//               2,2'lik duvar 45°'den bakan kameranın altına ne kadar gölge düşürüyor?
//
// Ön duvar İKİ parça (kapı boşluğunun iki yanı) + lento. Işın hangisini keserse kesin nokta örtülü.
const YARIM_DUSEY = (CAMERA_FOV * Math.PI) / 360;
const YARIM_YATAY = Math.atan(Math.tan(YARIM_DUSEY) * (16 / 9));

interface Kutu { x: number; y: number; z: number; w: number; h: number; d: number }
/** Odanın ÖN DUVARI — MaketLavaboBlock'un iki MaketWall'u + lento şeridi. */
const ON_DUVAR: Kutu[] = [
  { x: (x1 + doorX - KAPI_YARI) / 2, y: ROOM_H / 2, z: zFront, w: doorX - KAPI_YARI - x1, h: ROOM_H, d: DUVAR_KALIN },
  { x: (doorX + KAPI_YARI + x2) / 2, y: ROOM_H / 2, z: zFront, w: x2 - doorX - KAPI_YARI, h: ROOM_H, d: DUVAR_KALIN },
  { x: doorX, y: ROOM_H - 0.06, z: zFront, w: 1.6, h: 0.12, d: 0.3 },
];

/** Işın–eksen hizalı kutu kesişimi (slab yöntemi, o→hedef parçası). */
function kesisiyor(k: Kutu, o: number[], hedef: number[]): boolean {
  const d = [hedef[0] - o[0], hedef[1] - o[1], hedef[2] - o[2]];
  const o2 = [o[0] - k.x, o[1] - k.y, o[2] - k.z];
  const yari = [k.w / 2, k.h / 2, k.d / 2];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) {
      if (Math.abs(o2[i]) > yari[i]) return false;
      continue;
    }
    let a = (-yari[i] - o2[i]) / d[i];
    let b = (yari[i] - o2[i]) / d[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}

const kameraKonum = (px: number, pz: number, d: number) => [px, d, pz + d];
/** Oyuncu (px,pz) iken P noktası kadrajda mı? (S6 §V ile aynı) */
function kadrajda(px: number, pz: number, P: number[], d: number): boolean {
  const C = kameraKonum(px, pz, d);
  const T = [px, CAMERA_LOOK_Y, pz];
  const f = [T[0] - C[0], T[1] - C[1], T[2] - C[2]];
  const fn = Math.hypot(...f);
  const fu = f.map((v) => v / fn);
  const v = [P[0] - C[0], P[1] - C[1], P[2] - C[2]];
  const ileri = v[0] * fu[0] + v[1] * fu[1] + v[2] * fu[2];
  if (ileri <= 0) return false;
  const r = [fu[2], 0, -fu[0]];
  const rn = Math.hypot(...r) || 1;
  const ru = r.map((x) => x / rn);
  const u = [ru[1] * fu[2] - ru[2] * fu[1], ru[2] * fu[0] - ru[0] * fu[2], ru[0] * fu[1] - ru[1] * fu[0]];
  const sag = v[0] * ru[0] + v[1] * ru[1] + v[2] * ru[2];
  const yuk = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
  return Math.abs(Math.atan2(sag, ileri)) < YARIM_YATAY && Math.abs(Math.atan2(yuk, ileri)) < YARIM_DUSEY;
}
/** Kameradan noktaya giden ışın ön duvarı kesiyor mu? */
const ortulu = (px: number, pz: number, P: number[], d: number): boolean =>
  ON_DUVAR.some((k) => kesisiyor(k, kameraKonum(px, pz, d), P));

/** Oyuncunun yürüyebildiği tüm kat taranır (adım kipe göre). */
const ADIM = KIP === 'tam' ? [1, 0.5] : [2, 1.5];
function tara(P: number[], d: number): { kadraj: number; gorunur: number } {
  let kad = 0;
  let gor = 0;
  let toplam = 0;
  for (let px = -FLOOR_HALF + 1; px <= FLOOR_HALF - 1; px += ADIM[0])
    for (let pz = BAND.front + 1; pz <= FLOOR_HALF - 0.5; pz += ADIM[1]) {
      toplam++;
      if (!kadrajda(px, pz, P, d)) continue;
      kad++;
      if (!ortulu(px, pz, P, d)) gor++;
    }
  return { kadraj: kad / toplam, gorunur: gor / toplam };
}
/** ODAYA BAKARKEN — oyuncu lavabonun yükseltme noktasının çevresindeyken (asıl an). */
function taraYakin(P: number[], d: number): number {
  let gor = 0;
  let toplam = 0;
  for (let px = LAVABO.spot[0] - 3; px <= LAVABO.spot[0] + 3; px += 1)
    for (let pz = BAND.front + 0.5; pz <= BAND.front + 4.5; pz += 0.5) {
      toplam++;
      if (kadrajda(px, pz, P, d) && !ortulu(px, pz, P, d)) gor++;
    }
  return gor / toplam;
}

yaz("§V GÖRÜNÜRLÜK — WC odasının hangi parçası EKRANA GİRİYOR? (§K/§L/§M'den ÖNCEKİ soru)");
yaz('-'.repeat(112));
yaz(`kamera oyuncunun +z'sinde (pz + ${n2(CAMERA_DIST)}) ve −z'ye bakıyor · fov ${CAMERA_FOV}`);
yaz(`İKİ SÜZGEÇ: (1) kadraj konisi · (2) odanın ${n2(ROOM_H)} birimlik ÖN DUVARI ışını kesiyor mu`);
yaz(`taban = tüm kat taranır (${ADIM[0]} × ${ADIM[1]} adım) · YAKIN = oyuncu kapının önündeyken (asıl an)`);
yaz();
const cx = (i: number) => p0 + 0.75 + i * 1.5; // kabin kapılarının x'i

const PARCALAR: [string, number[]][] = [
  ['kapı boşluğu (referans)', [doorX, 1.0, zFront]],
  ['KABİN KAPISI #1 (x 5,75)', [cx(0), 0.975, zd]],
  ['KABİN KAPISI #2 (x 7,25)', [cx(1), 0.975, zd]],
  ['KABİN KAPISI #3 (aralık, x 8,75)', [cx(2), 0.975, zd]],
  ['KABİN KAPISI #4 (x 10,25)', [cx(3), 0.975, zd]],
  ['kabin kapısı ÜST kenarı (#2)', [cx(1), 1.95, zd]],
  ['BÖLME #1 (x 5,00)', [p0, 1.0, zp]],
  ['BÖLME #5 (x 11,00)', [p0 + 4 * 1.5, 1.0, zp]],
  ['KLOZET (aralık kabinin içi)', [cx(2), 0.4, zBack + 0.65]],
  ['LAVABO #1 (arka)', [LAVABO_X, LAVABO_KUTU.tablaY, LAVABO_Z0 - LAVABO_ARALIK]],
  ['LAVABO #2 (orta)', [LAVABO_X, LAVABO_KUTU.tablaY, LAVABO_Z0]],
  ['LAVABO #3 (ön)', [LAVABO_X, LAVABO_KUTU.tablaY, LAVABO_Z0 + LAVABO_ARALIK]],
  ['AYNA #2 (y 1,75)', [LAVABO_X, AYNA_Y, LAVABO_Z0]],
  ['fayans zemin (oda ortası)', [(x1 + x2) / 2, 0.02, (zBack + zFront) / 2]],
  ['MÜŞTERİNİN KAYBOLDUĞU NOKTA', [LAVABO.door[0], ACTOR_HEIGHT / 2, LAVABO.door[2]]],
  ['müşterinin BAŞI kaybolurken', [LAVABO.door[0], ACTOR_HEIGHT, LAVABO.door[2]]],
];
yaz('parça'.padEnd(36) + '      x       y       z   kadraj  GÖRÜNÜR  uzaklaş   portre    YAKIN');
for (const [ad, P] of PARCALAR) {
  const t = tara(P, CAMERA_DIST);
  const tz = tara(P, CAMERA_DIST * CAMERA_ZOOM_OUT_MUL);
  const tp = tara(P, CAMERA_DIST * CAMERA_PORTRAIT_CLAMP);
  const yakin = taraYakin(P, CAMERA_DIST);
  const hic = t.gorunur + tz.gorunur + tp.gorunur + yakin === 0;
  yaz(
    ad.padEnd(36) + n2(P[0]) + n2(P[1]) + n2(P[2]) + '  ' + yz(t.kadraj) + '   ' + yz(t.gorunur) +
    '    ' + yz(tz.gorunur) + '    ' + yz(tp.gorunur) + '    ' + yz(yakin) + (hic ? '   <<< HİÇ GÖRÜNMÜYOR' : ''),
  );
}
yaz();
yaz('KADRAJ = yalnız görüş konisi · GÖRÜNÜR = koni VE ön duvar örtmüyor. İkisi arasındaki fark');
yaz('duvarın kestiği paydır. Üç kipte de GÖRÜNÜR %0 çıkan parça ekrana HİÇ girmez (S6 dersi).');
yaz();

// ÖRTME PROFİLİ — duvarın gölgesi odanın içine kaç birim düşüyor?
yaz('ÖRTME PROFİLİ — oyuncu kapının önünde (x 13,40) dururken, odanın içindeki bir nokta');
yaz('hangi YÜKSEKLİKTE duvarın üstünden görünmeye başlıyor?');
yaz('  z'.padEnd(10) + 'derinlik  y=0,20  y=0,50  y=1,00  y=1,50  y=1,95  y=2,20');
const YUKSEKLIKLER = [0.2, 0.5, 1.0, 1.5, 1.95, 2.2];
for (let z = zFront - 0.5; z >= zBack; z -= 1.0) {
  const satir = YUKSEKLIKLER.map((y) => {
    let gor = 0;
    let toplam = 0;
    for (let pz = BAND.front + 0.5; pz <= BAND.front + 6; pz += 0.5) {
      toplam++;
      if (kadrajda(doorX, pz, [doorX - 3, y, z], CAMERA_DIST) && !ortulu(doorX, pz, [doorX - 3, y, z], CAMERA_DIST)) gor++;
    }
    return yz(gor / toplam);
  });
  yaz(n2(z) + n2(zFront - z) + '  ' + satir.join('  '));
}
yaz();
yaz('(x = kapı boşluğunun 3 br solu, yani DUVARIN arkasında — kapı deliğinden değil duvarın');
yaz(' ÜSTÜNDEN görünme sınırı ölçülüyor.)');
yaz();

// ============================================================================================
//  §K KABİN KAPILARI VE BÖLMELER — kullanıcı: "kötü"
// ============================================================================================
yaz('§K KABİN KAPISI + BÖLME — bugün düz kutu; pakette karşılığı ne veriyor?');
yaz('-'.repeat(112));
const KUTU_KAPI = { w: 1.36, h: 1.95, d: 0.06 };
const KUTU_BOLME = { w: 0.06, h: 2.0, d: 1.6 };
yaz(`bugünkü KAPI  : ${n2(KUTU_KAPI.w)} × ${n2(KUTU_KAPI.h)} × ${n2(KUTU_KAPI.d)} · tek renk #5d4037 (MC.doorWood) · 12 üçgen`);
yaz(`bugünkü BÖLME : ${n2(KUTU_BOLME.w)} × ${n2(KUTU_BOLME.h)} × ${n2(KUTU_BOLME.d)} · tek renk #6d4c41 (MC.wain) · 12 üçgen`);
yaz();

const ADAYLAR: [Paket, string, string][] = [
  ['kaykit-restaurant-bits', 'door_A', 'kapı adayı K2'],
  ['kaykit-restaurant-bits', 'door_B', 'kapı adayı K3'],
  ['kaykit-restaurant-bits', 'wall_doorway', 'kapı ÇERÇEVESİ adayı'],
  ['kaykit-restaurant-bits', 'wall_half', 'bölme adayı B2'],
  ['kaykit-restaurant-bits', 'pillar_A', 'bölme adayı B3'],
  ['kaykit-restaurant-bits', 'pillar_B', 'bölme adayı B3'],
];
yaz('model'.padEnd(22) + '        w        h        d     minX     minY     minZ   üçgen  rol');
const HAM: Record<string, Ham> = {};
for (const [p, ad, rol] of ADAYLAR) {
  const h = olc(p, ad);
  HAM[ad] = h;
  yaz(
    ad.padEnd(22) + n3(h.boyut[0]) + n3(h.boyut[1]) + n3(h.boyut[2]) +
    n3(h.mn[0]) + n3(h.mn[1]) + n3(h.mn[2]) + String(ucgenSayisi(p, ad)).padStart(8) + '  ' + rol,
  );
}
yaz();
yaz("minX ≈ 0 ise MENTEŞE MODELİN KENARINDA → kapı origin'i etrafında AÇILABİLİR (aralık kabin,");
yaz("ve G-35'in M2 kolundaki \"kapı açılıp kapanma\" geçişi bunu ister). minX ≈ −w/2 ise ortadan.");
yaz();
yaz('PARÇA DÖKÜMÜ — bbox tek kutu verir ve YANILTIR (S6\'nın ayna dersi). Kanat mı, kasa+kanat mı?');
yaz('model / parça'.padEnd(40) + '        w        h        d    y-açı');
for (const [p, ad] of ADAYLAR) {
  for (const pr of parcalar(p, ad)) {
    const b = [pr.mx[0] - pr.mn[0], pr.mx[1] - pr.mn[1], pr.mx[2] - pr.mn[2]];
    yaz(`${ad} / ${pr.ad}`.padEnd(40) + n3(b[0]) + n3(b[1]) + n3(b[2]) + `${pr.aci.toFixed(1)}°`.padStart(9));
  }
}
yaz();
yaz('y-açı hepsinde 0,0° → hiçbiri gltf içinde döndürülmemiş. Yani 0,771 derinlik bir DÖNÜŞ');
yaz('değil, modelin kendi çıkıntısı. Ne olduğunu BOY PROFİLİ söylüyor.');
yaz();
yaz('BOY PROFİLİ — 0,771 derinlik düz bir kapı için fazla. Hangi YÜKSEKLİKTE ne kadar kalın?');
yaz('');
yaz('  UYARI (bu turda ısırdı): düşük-poli modelde KÖŞE histogramı DOLULUK göstermez. door_A modelinin');
yaz('  x köşeleri 0,48…1,12 arasında hiç yok ve ilk okumam "ortası boş, demek ki kasa" oldu —');
yaz('  yanlıştı: orası düz bir panelin İÇİ, köşesi olmayan dolu yüzey. Doğrusunu ancak modeli');
yaz('  ÇİZDİRMEK söyledi (`tools/model-bak.mjs`, `docs/gorsel/s7-kapi-adaylari.png`). Sayı burada');
yaz('  ekranın YERİNE geçemedi; ekran sayının yerine geçemediği gibi.');
yaz('');
yaz('model'.padEnd(10) + '  y dilimi     z kalınlığı   x aralığı      not');
for (const ad of ['door_A', 'wall_half', 'wall_doorway']) {
  const vs = koseler('kaykit-restaurant-bits', ad);
  const yMax = HAM[ad].boyut[1];
  for (let y = 0; y < yMax; y += 0.2) {
    const c = vs.filter((v) => v[1] >= y && v[1] < y + 0.2);
    if (!c.length) continue;
    const zs = c.map((v) => v[2]);
    const xs = c.map((v) => v[0]);
    const kal = Math.max(...zs) - Math.min(...zs);
    yaz(ad.padEnd(10) + n2(y) + '…' + (y + 0.2).toFixed(2) + n3(kal) + '   ' +
        `${Math.min(...xs).toFixed(2)} … ${Math.max(...xs).toFixed(2)}`.padStart(14) +
        (kal > 0.55 ? '   << İTME BARI (iki yüzden de taşıyor)' : ''));
  }
  const govde = vs.filter((v) => v[1] < 0.8 || v[1] > 1.3).map((v) => v[2]);
  yaz(ad.padEnd(10) + '  BAR HARİÇ gövde kalınlığı: ' + (Math.max(...govde) - Math.min(...govde)).toFixed(3));
  yaz('');
}
yaz('door_A/door_B OKUNDU: kasa + KAPALI kanat + üstte küçük cam + iki yüzde İTME BARI.');
yaz('Gövde 0,300 kalın; bbox 0,771 degeri barin taşmasından geliyor (y 0,80…1,20).');
yaz('Bar bir RESTORAN MUTFAK kapısının parçası — WC kabin kapısında yeri yok, ayrı ölçülür.');
yaz('wall_half / wall_doorway / pillar_A / pillar_B: hepsi 4,00 (pillar 4,10) BOYUNDA duvar');
yaz('modülü. Odanın duvarı 2,20, kabin bölmesi 2,00 → bunlar BÖLME DEĞİL. B2/B3 kolları ölür.');
yaz('');
yaz('KABİN RİTMİ — kapı 1,60 × 2,80 (oran 0,571). Bugünkü kabin gözü 1,36 × 1,95 (oran 0,697).');
yaz('Tekdüze ölçek ikisini birden tutturamaz; hangisinden gidileceği KARAR:');
yaz('  ölçek kaynağı'.padEnd(26) + '  en      boy    kabin adımı   4 kabin kaplar   bölme boyunu aşar mı');
const KAPI_H = HAM['door_A'].boyut[1];
const KAPI_W = HAM['door_A'].boyut[0];
for (const [ad2, en, boy] of [
  ['BOYDAN (h → 1,95)', (KAPI_W * 1.95) / KAPI_H, 1.95],
  ['ENDEN (w → 1,36)', 1.36, (KAPI_H * 1.36) / KAPI_W],
  ['TEKDÜZE OLMAYAN', 1.36, 1.95],
] as [string, number, number][]) {
  const adim = en + 0.14;
  const asim = boy - 2.0;
  yaz('  ' + ad2.padEnd(24) + n2(en) + n2(boy) + n2(adim) + '       ' + n2(4 * adim) +
      '        ' + (asim > 0 ? `EVET +${asim.toFixed(2)}` : 'hayır'));
}
yaz('(bugünkü ritim: 5 bölme x 5,00…11,00 · adım 1,50 · 4 kabin · toplam 6,00 br · bölme boyu 2,00)');
yaz('TEKDÜZE OLMAYAN kolun x/y çarpıtması: ' +
    ((1.36 / KAPI_W) / (1.95 / KAPI_H)).toFixed(3) + ' — D-103 kabul ettiği bedel 2,715 idi.');
yaz();

yaz('HEDEF KUTUYA ÇEKME — bugünkü kutuya (1,36 × 1,95 × 0,06) oturtmanın bedeli:');
yaz('DİKKAT: sz sütunu ve ÇARPITMA yanıltıcıdır — bugünkü kutunun 0,06 DERİNLİĞİ elle çizilmiş bir');
yaz('levhanın sayısı, modelin taşıması gereken bir hedef değil. Kabin 1,60 br derin; kapı kendi');
yaz('0,300 gövdesiyle rahat oturur. Anlamlı çarpıtma yalnız x/y arasındadır (KABİN RİTMİ tablosu).');
yaz('model'.padEnd(22) + '      sx       sy       sz   ÇARPITMA  not');
for (const ad of ['door_A', 'door_B']) {
  const h = HAM[ad];
  const s = [KUTU_KAPI.w / h.boyut[0], KUTU_KAPI.h / h.boyut[1], KUTU_KAPI.d / h.boyut[2]];
  const carp = Math.max(...s) / Math.min(...s);
  const su = KUTU_KAPI.h / h.boyut[1]; // TEKDÜZE alternatif: boydan ölçekle
  yaz(
    ad.padEnd(22) + n3(s[0]) + n3(s[1]) + n3(s[2]) + n3(carp) +
    `  tekdüze(boydan) ${su.toFixed(3)} → en ${(h.boyut[0] * su).toFixed(2)} (hedef ${KUTU_KAPI.w}) · derinlik ${(h.boyut[2] * su).toFixed(2)}`,
  );
}
for (const ad of ['wall_half', 'pillar_A', 'pillar_B']) {
  const h = HAM[ad];
  const su = KUTU_BOLME.h / h.boyut[1];
  yaz(
    ad.padEnd(22) + '   —        —        —        —  ' +
    `tekdüze(boydan) ${su.toFixed(3)} → ${(h.boyut[0] * su).toFixed(2)} × ${KUTU_BOLME.h} × ${(h.boyut[2] * su).toFixed(2)} (hedef ${KUTU_BOLME.w} × ${KUTU_BOLME.d})`,
  );
}
yaz();
yaz('KARŞILAŞTIRMA — lavabo gövdesi bu turda ÇARPITMA ' + LAVABO_CARPITMA.toFixed(3) + ' ile kabul edildi (D-103).');
yaz('Ondan büyük bir çarpıtma "kabul edilmiş bedelin üstüne çıkıyor" demektir.');
yaz();

yaz("ATLAS GÖZLERİ — WC'nin dili GRİ/BEYAZ (lavabo + ayna S6/②'de griye geçti). Kapı hangi renk?");
// gozRenkleri DİZİ döndürür ({goz:[r,c], ort:[r,g,b], …}); göz anahtarına çevrilir.
const hx = (v: number) => Math.round(v).toString(16).padStart(2, '0');
const renkler: Record<string, Record<string, string>> = {};
for (const p of ['kaykit-restaurant-bits'] as Paket[]) {
  const liste = gozRenkleri(`public/assets/models/${p}/${DOKU[p]}`) as { goz: number[]; ort: number[] }[];
  renkler[p] = Object.fromEntries(liste.map((g) => [`${g.goz[0]},${g.goz[1]}`, `#${g.ort.map(hx).join('')}`]));
}
yaz('model'.padEnd(22) + 'gözler (çoktan aza, renk)');
for (const [p, ad] of ADAYLAR) {
  const gs = gozler(p, ad) as [string, number][];
  const top = gs.reduce((a, b) => a + b[1], 0);
  yaz(ad.padEnd(22) + gs.slice(0, 5).map(([k, n]) => `[${k}] ${renkler[p][k] ?? '?'} ${((100 * n) / top).toFixed(0)}%`).join('  '));
}
yaz();
yaz('Lavabo bu turda [3,6] turuncu → [0,3] gri taşındı (D-103). Kapı turuncu göz taşıyorsa AYNI');
yaz("taşıma gerekir; taşımasız konursa WC gri/beyaz iken kapı turuncu kalır (S6/②'nin şikâyeti).");
yaz();

// ============================================================================================
//  §L LAVABO SAYISI — G-36: seviye sinyali MEKÂNSAL olabilir mi?
// ============================================================================================
yaz('§L SEVİYE SİNYALİ (G-36) — "seviye arttıkça lavabo SAYISI artsın" kolu ölçülüyor');
yaz('-'.repeat(112));
const MAXLV = economyConfig.rooms.lavabo.maxLevel;
yaz(`lavabo maxLevel = ${MAXLV} → L2 kolu "seviye = lavabo sayısı" ise doğu duvarı ${MAXLV} lavabo ALMALI.`);
yaz(`lavabo z'de kapladığı en (rot −90° → LAVABO_KUTU.w) = ${n2(LAVABO_KUTU.w)} br`);
yaz();
const DUVAR_Z0 = zBack;                       // doğu duvarı arka duvardan başlar
const DUVAR_Z1 = zFront - DUVAR_KALIN / 2;    // ön duvarın iç yüzünde biter
const DUVAR_BOY = DUVAR_Z1 - DUVAR_Z0;
yaz(`doğu duvarının z boyu: ${n2(DUVAR_Z0)} … ${n2(DUVAR_Z1)} = ${n2(DUVAR_BOY)} br`);
yaz(`(kabin bloğu z ${n2(zBack)} … ${n2(zd + 0.3)} arasında ama x ${p0.toFixed(2)}…${(p0 + 6).toFixed(2)}'de — doğu duvarıyla ÇAKIŞMIYOR)`);
yaz();
yaz('kaç lavabo sığar? (aralık = merkezler arası mesafe; gövde ' + LAVABO_KUTU.w.toFixed(2) + ' br)');
yaz('aralık'.padEnd(10) + '  n=1     n=2     n=3     n=4     n=5     n=6     n=7   ← kaplanan boy (sığmayan ×)');
for (const ar of [1.36, 1.5, 1.7, 1.9]) {
  const hucre = [1, 2, 3, 4, 5, 6, 7].map((n) => {
    const boy = (n - 1) * ar + LAVABO_KUTU.w;
    return (boy <= DUVAR_BOY ? ` ${boy.toFixed(2)} ` : ` ${boy.toFixed(2)}×`).padStart(8);
  });
  yaz(ar.toFixed(2).padStart(6) + '    ' + hucre.join(''));
}
yaz();
yaz(`Bugünkü aralık ${LAVABO_ARALIK.toFixed(2)} br ve 3 lavabo var. Duvar boyu ${DUVAR_BOY.toFixed(2)} br.`);
const enBuyukN = (ar: number) => Math.max(1, Math.floor((DUVAR_BOY - LAVABO_KUTU.w) / ar) + 1);
for (const ar of [1.36, 1.5, 1.7, 1.9]) yaz(`  aralık ${ar.toFixed(2)} → en çok ${enBuyukN(ar)} lavabo`);
yaz();
yaz('HER SLOTUN GÖRÜNÜRLÜĞÜ — sayı artarsa yeni lavabolar NEREYE eklenir, oralar ekranda mı?');
yaz('slot z'.padEnd(12) + 'ön duvara uzaklık  GÖRÜNÜR  YAKIN   not');
for (let n = 0; n < 7; n++) {
  const z = DUVAR_Z0 + LAVABO_KUTU.w / 2 + n * 1.36;
  if (z > DUVAR_Z1) break;
  const P = [LAVABO_X, LAVABO_KUTU.tablaY, z];
  const t = tara(P, CAMERA_DIST);
  const yakin = taraYakin(P, CAMERA_DIST);
  const bugunku = [LAVABO_Z0 - LAVABO_ARALIK, LAVABO_Z0, LAVABO_Z0 + LAVABO_ARALIK].some((b) => Math.abs(b - z) < 0.7);
  yaz(n2(z) + '     ' + n2(zFront - z) + '            ' + yz(t.gorunur) + '   ' + yz(yakin) +
      (bugunku ? '   (bugünkü üçlünün yakınında)' : ''));
}
yaz();
yaz("İKİNCİ SİNYAL ADAYLARI — `feedback_upgrade_legibility`: tek sinyal yetmez, çoklu redundant.");
yaz('aday'.padEnd(34) + 'konum'.padEnd(28) + 'GÖRÜNÜR  YAKIN');
const SINYAL_ADAY: [string, string, number[]][] = [
  ['lavabo SAYISI (doğu duvarı)', `x ${LAVABO_X.toFixed(2)} · z değişken`, [LAVABO_X, LAVABO_KUTU.tablaY, LAVABO_Z0]],
  ['ayna SAYISI (lavabo başına)', `x ${LAVABO_X.toFixed(2)} · y ${AYNA_Y}`, [LAVABO_X, AYNA_Y, LAVABO_Z0]],
  ['kabin kapısı SAYISI (arka duvar)', `x 5,75…10,25 · z ${zd.toFixed(2)}`, [cx(1), 0.975, zd]],
  ['fayans şeridi (zemin, oda ortası)', 'y 0,02', [(x1 + x2) / 2, 0.02, (zBack + zFront) / 2]],
  ['kapı boşluğunun kendisi', `x ${doorX} · z ${zFront}`, [doorX, 1.2, zFront]],
  ['kapının ÜSTÜ (eski sarı daireler)', 'y 2,14 · lentonun 0,2 ÖNÜ', [doorX, 2.14, zFront + 0.2]],
];
for (const [ad, konum, P] of SINYAL_ADAY) {
  const t = tara(P, CAMERA_DIST);
  yaz(ad.padEnd(34) + konum.padEnd(28) + yz(t.gorunur) + '   ' + yz(taraYakin(P, CAMERA_DIST)));
}
yaz();

// ============================================================================================
//  §M MÜŞTERİNİN KAYBOLUŞU — G-35
// ============================================================================================
yaz('§M KAYBOLUŞ (G-35) — müşteri kapı eşiğinde buharlaşıyor; üç kol ölçülüyor');
yaz('-'.repeat(112));
yaz(`bugün: 'toWc' → LAVABO.spot ${JSON.stringify(LAVABO.spot)} · varınca pos = LAVABO.door ${JSON.stringify(LAVABO.door)}`);
yaz(`        → 'inWc' + scale 0 · ${economyConfig.rooms.lavabo.visitTime} sn · sonra AYNI yerde belirip parasını bırakır`);
yaz(`spot → door mesafesi: ${Math.hypot(LAVABO.spot[0] - LAVABO.door[0], LAVABO.spot[2] - LAVABO.door[2]).toFixed(3)} br`);
yaz(`kapı eşiği ön duvarın ${(LAVABO.door[2] - (zFront + DUVAR_KALIN / 2)).toFixed(3)} br ÖNÜNDE → müşteri duvara GİRMEDEN yok oluyor`);
yaz();
yaz('M1 — ODA YÜRÜNÜR OLSUN: bedel nedir?');
const a2 = LAYOUT.areaBounds[2];
yaz(`  bugün a2 alanı: x ${n2(a2.minX)} … ${n2(a2.maxX)} · z ${n2(a2.minZ)} … ${n2(a2.maxZ)} → oda (z < ${n2(zFront)}) DIŞARIDA`);
yaz(`  clampToOpenAreas müşteriyi de oyuncuyu da z ≥ ${n2(zFront)}'de tutuyor (tek kural, ikisi de aynı)`);
const icDerinlik = Math.abs(zd + 0.3 - zFront);  // ön duvardan kabin kapılarının önüne
const icEn = x2 - x1;
yaz(`  odanın YÜRÜNEBİLİR iç ölçüsü (kabin kapılarına kadar): ${icDerinlik.toFixed(2)} × ${icEn.toFixed(2)} br`);
yaz(`  lavabo duvarı ${LAVABO_KUTU.d.toFixed(2)} br yer kaplıyor → net en ${(icEn - LAVABO_KUTU.d).toFixed(2)} br`);
yaz(`  kapı boşluğu ${(KAPI_YARI * 2).toFixed(2)} br · oyuncu yarıçapı ${PLAYER_RADIUS.toFixed(2)} → geçiş payı ${(KAPI_YARI * 2 - 2 * PLAYER_RADIUS).toFixed(2)} br`);
yaz();
yaz('M2 — KAYBOLUŞ ÖRTÜLSÜN: müşteri içeri yürüyüp SOLARSA, hangi derinlikte gözden çıkar?');
yaz("  (oyuncu kapının önünde 0,5…4,5 br arasında dururken müşterinin kaç %'inden görünür)");
yaz('  İKİ HAT: (a) kapı ekseninde düz içeri — boşluktan geçer, duvar örtemez ·');
yaz('           (b) girip YANA sapan (x = kapı − 2,0) — ön duvarın arkasına girer.');
yaz('  müşteri z'.padEnd(14) + 'içeri   (a) kapı ekseni   (b) yana sapan');
// GÖVDE olarak ölç, nokta olarak değil: tek yükseklik lentonun altından geçerken sıçrıyor
// (kapının üstündeki 0,12'lik şerit gerçek bir engel ama tek nokta onu gürültüye çeviriyor).
const govdeGorunur = (mx: number, mz: number): number =>
  [0.25, 0.9, ACTOR_HEIGHT].reduce((a, y) => a + taraYakin([mx, y, mz], CAMERA_DIST), 0) / 3;
for (let mz = zFront + 0.3; mz >= zFront - 3.0; mz -= 0.5) {
  yaz(n2(mz) + '  ' + n2(zFront - mz) + '        ' + yz(govdeGorunur(doorX, mz)) +
      '            ' + yz(govdeGorunur(doorX - 2.0, mz)));
}
yaz();
yaz('M3 — BUGÜNKÜ: kayboluş noktası §V tablosunda. Oyuncu o an oraya bakıyorsa kayboluş GÖRÜLÜR.');
yaz();
yaz('ZİYARET SIKLIĞI — kaç müşteride bir görülür? visitChance seviyeye göre:');
yaz('  seviye'.padEnd(10) + economyConfig.rooms.lavabo.visitChanceByLevel.map((v, i) => `L${i + 1} %${(v * 100).toFixed(0)}`).join('  '));
yaz(`  visitTime ${economyConfig.rooms.lavabo.visitTime} sn — kayboluş ile beliriş arasındaki sessizlik bu kadar.`);
yaz();

// --- DAMGALAR ---
damga('oda kutusu tutarlı', x2 > x1 && zFront > zBack, `x ${x1}…${x2} · z ${zBack}…${zFront}`);
damga('ön duvar ışını kesiyor', ortulu(doorX, zFront + 4, [doorX - 4, 0.3, zFront - 2], CAMERA_DIST),
  'duvarın arkasındaki alçak nokta ÖRTÜLÜ olmalı — değilse kesişim ölçümü çalışmıyor');
damga('kapı boşluğu ışını GEÇİRİYOR', !ortulu(doorX, zFront + 4, [doorX, 1.0, zFront - 1], CAMERA_DIST),
  'boşluğun tam ekseni örtülü çıkıyor — kutular kapı deliğini kapatıyor demektir');
damga('adaylar diskte', ADAYLAR.every(([, ad]) => HAM[ad] && HAM[ad].boyut[1] > 0), 'bir model okunamadı');
damga('lavabo ölçeği okundu', LAVABO_SCALE.every((s) => s > 0) && LAVABO_NATIVE.h > 0 && AYNA_S > 0 && AYNA_H > 0);
damga('çıktı üretildi', cikti.length > 60, `${cikti.length} satır`);

yaz('='.repeat(112));
yaz("BİTTİ — bu dosyada KARAR YOK. Kollar `docs/wc-odasi-raporu-s7.md` §Bulgular'da.");
yaz('='.repeat(112));
damgaOzeti();
