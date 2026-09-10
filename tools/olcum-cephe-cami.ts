/**
 * olcum-cephe-cami.ts — S6/② ÖLÇÜM: GİRİŞ CEPHESİ CAMI (vitrin).
 *
 * NEDEN AYRI TUR: D-037 (2026-09-05) *"Kat 1'in sokağa bakan yüzü düz duvar değil VİTRİN"*
 * diye karara bağlandı — kaide 0…0,40 · cam 0,40…2,65 · lento · alınlık 2,65…3,20. Karar
 * yazıldı, **oyuna hiç geçmedi**: bugün ön duvar (z 17,50) iç duvarla birebir aynı badana
 * (gövde + lambri + çıta), cam yalnız SAĞ duvarda ("cam kenarı", `config/decor.ts`).
 * S6 cepheyi ölçtü ama pencere kolu (§E) sağ duvar içindi; S7'de kullanıcı bu turu ayırdı,
 * çünkü vitrin **kapı bloğuna** (söve · lento · alınlık) ve **`wallThemeByArea`ya** dokunuyor.
 *
 * ASIL SORU §Ö2'DE: cam bir SÜS değil, bir DELİK. Kamera oyuncunun +z'sinde (pz + 8,50) durur
 * ve oyuncu cepheye yaklaştıkça kamera BİNANIN DIŞINA çıkar — o an 3,20'lik ön duvar kameranın
 * ve salonun arasına girer. Yani ölçülecek şey "cam güzel mi" değil: **ön duvar salonun ne
 * kadarını gizliyor ve vitrin bunun ne kadarını geri veriyor?**
 *
 * S6'nın ve S7'nin dersleri burada da geçerli:
 *   · S4/S6 dersi — modülün deliği IŞINLA ölçülür, vertex sayarak değil (düz yüzün ortasında
 *     vertex yoktur). §M ışın testi kullanır.
 *   · S6 dersi — "hangi model güzel" sorusundan ÖNCE "o şerit ekrana giriyor mu" sorulur (§V).
 *   · S7 dersi — sayı ile ekran birbirinin yerine geçmiyor; karar öncesi `tools/model-bak.mjs`.
 *
 * Bu araç hiçbir şeyi değiştirmez; ölçer ve `docs/olcum-cephe-cami.txt` üretir.
 * Kullanım: npx tsx tools/olcum-cephe-cami.ts        (kısa — yön gösterir)
 *           OLCUM=tam npx tsx tools/olcum-cephe-cami.ts > docs/olcum-cephe-cami.txt
 */
import { readFileSync } from 'node:fs';
import { ACTOR_HEIGHT, CAMERA_LOOK_Y } from '../src/config/actor';
import { CAMERA_DIST, CAMERA_FOV, CAMERA_PORTRAIT_CLAMP, CAMERA_ZOOM_OUT_MUL } from '../src/config/camera';
import { BAND, FLOOR_HALF, LAYOUT, doorX, entranceAt } from '../src/game/layout';
import { DOOR, WAINSCOT_H, WALL_H, WALL_M } from '../src/components/three/wallPanel';
import { WALL_RUNS, wallDikey, wallUzunluk } from '../src/components/three/wallLook';
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
};
const n2 = (v: number) => v.toFixed(2).padStart(7);
const n3 = (v: number) => v.toFixed(3).padStart(8);
const yz = (v: number) => `${(v * 100).toFixed(0).padStart(4)}%`;

kipBandi();

// ============================================================================================
//  §Ö ÖLÇÜ TABANI — cephenin bugünkü sayıları (hepsi koddan, elle yazılan sayı yok)
// ============================================================================================
const AREAS = 2; // vitrin sorusunun sorulduğu hâl: iki alan açık, kapı cephenin ortasında
const CEPHE_Z = LAYOUT.areaBounds[0].maxZ + WALL_M; // 17,50 — duvarın ORTA hattı
const DX0 = doorX(AREAS);
/** Kapı bloğunun parçaları (Scene.Walls) — söve dış kenarı vitrin gözünün başladığı yer. */
const SOVE_DIS = DOOR.half + 0.4 / 2; // 2,40
const KAPI_BLOK_YARI = DOOR.half + 0.6 / 2; // lento/kordon eni doorHalf*2 + 0,6 → 2,50

const onRuns = WALL_RUNS(AREAS).filter((r) => r.side === 'front');
const cepheHat = onRuns.reduce((a, r) => a + wallUzunluk(r), 0);

yaz('='.repeat(112));
yaz('S6/② ÖLÇÜM — GİRİŞ CEPHESİ CAMI (vitrin). D-037 karar verdi, oyuna hiç geçmedi.');
yaz('='.repeat(112));
yaz();
yaz('§Ö ÖLÇÜ TABANI — cephenin BUGÜNKÜ sayıları');
yaz('-'.repeat(112));
yaz(`duvar yüksekliği WALL_H ${n2(WALL_H)} · lambri üstü WAINSCOT_H ${n2(WAINSCOT_H)} · çıta y 0,94`);
yaz(`cephe hattı z ${n2(CEPHE_Z)} · kapı ekseni x ${n2(DX0)} · kapı boşluğu ${n2(DOOR.half * 2)} · kapı boyu ${n2(DOOR.height)}`);
yaz(`kapı bloğu dış yarı-eni ${n2(KAPI_BLOK_YARI)} (lento/kordon) · söve dış kenarı ${n2(SOVE_DIS)}`);
yaz();
yaz('ön duvar parçaları (WALL_RUNS, areasOpen = 2):');
yaz('  parça'.padEnd(12) + '     x0      x1  uzunluk   alan');
for (const r of onRuns) {
  const uz = wallUzunluk(r);
  const c = wallDikey(r) ? r.z : r.x;
  yaz('  ' + `${r.side}`.padEnd(10) + n2(c - uz / 2) + n2(c + uz / 2) + n2(uz) + `${r.area}`.padStart(7));
}
yaz(`  → TOPLAM CEPHE HATTI ${n2(cepheHat)} br (kapı boşluğu ${n2(DOOR.half * 2)} br hariç)`);
yaz();
yaz('D-037 PROGRAMI (yazıldı, kodda YOK): kaide 0…0,40 · CAM 0,40…2,65 · lento · alınlık 2,65…3,20');
yaz(`BUGÜN KODDA OLAN      : gövde ${n2(WAINSCOT_H)}…${n2(WALL_H)} (krem) · lambri 0…${n2(WAINSCOT_H)} · çıta 0,94 — CAM YOK`);
yaz(`  → cam bandının boyu ${n2(2.65 - 0.4)} br · cephe hattı ${n2(cepheHat)} br → aday cam yüzeyi ${n2(cepheHat * 2.25)} m²`);
yaz();
damga('cephe hattı iki parça', onRuns.length === 2, `${onRuns.length} parça bulundu`);
damga('cephe simetrik', Math.abs(wallUzunluk(onRuns[0]) - wallUzunluk(onRuns[1])) < 0.01, 'iki parça eşit değil');

// ============================================================================================
//  §V GÖRÜNÜRLÜK — cephenin hangi ŞERİDİ ekrana giriyor? (S6 §V yöntemi)
// ============================================================================================
const YARIM_DUSEY = (CAMERA_FOV * Math.PI) / 360;
const YARIM_YATAY = Math.atan(Math.tan(YARIM_DUSEY) * (16 / 9));
interface Kutu {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

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

// --- ÖN DUVARIN KATI KUTULARI, iki kolda ayrı ayrı ---------------------------------------
const T_BODY = 0.18;
const parcaKutu = (y0: number, y1: number): Kutu[] =>
  onRuns.map((r) => ({ x: r.x, y: (y0 + y1) / 2, z: r.z, w: r.w, h: y1 - y0, d: T_BODY }));

/** C0 — bugünkü: ön duvar tepeden tırnağa katı. */
const KATI_C0: Kutu[] = parcaKutu(0, WALL_H);
/** C1 — vitrin: yalnız kaide (0…0,40) ve alınlık (2,65…3,20) katı; cam bandı DELİK. */
const VITRIN_KAIDE = 0.4;
const VITRIN_UST = DOOR.height; // 2,65 — kapıyla aynı hizada biter (D-037)
const KATI_C1: Kutu[] = [...parcaKutu(0, VITRIN_KAIDE), ...parcaKutu(VITRIN_UST, WALL_H)];
/** Kapı bloğu — İKİ KOLDA DA duruyor (söve · lento · alınlık kutusu). Kolların farkı değil. */
const KAPI_BLOK: Kutu[] = [
  { x: DX0, y: (DOOR.height + WALL_H) / 2, z: CEPHE_Z, w: DOOR.half * 2 + 0.4, h: WALL_H - DOOR.height, d: 0.18 },
  { x: DX0, y: DOOR.height + 0.08, z: CEPHE_Z + 0.22, w: DOOR.half * 2 + 0.6, h: 0.16, d: 0.34 },
  { x: DX0 - DOOR.half, y: DOOR.height / 2, z: CEPHE_Z + 0.22, w: 0.4, h: DOOR.height, d: 0.42 },
  { x: DX0 + DOOR.half, y: DOOR.height / 2, z: CEPHE_Z + 0.22, w: 0.4, h: DOOR.height, d: 0.42 },
];

const ADIM = KIP === 'tam' ? [1, 0.5] : [2, 1.5];
/** Oyuncunun yürüyebildiği tüm kat taranır; nokta kadrajda mı ve verilen katı kütle örtüyor mu. */
function tara(P: number[], d: number, kati: Kutu[]): { kadraj: number; gorunur: number; disarida: number } {
  let kad = 0;
  let gor = 0;
  let dis = 0;
  let toplam = 0;
  for (let px = -FLOOR_HALF + 1; px <= FLOOR_HALF - 1; px += ADIM[0])
    for (let pz = BAND.front + 1; pz <= FLOOR_HALF - 0.5; pz += ADIM[1]) {
      toplam++;
      if (pz + d > CEPHE_Z) dis++;
      if (!kadrajda(px, pz, P, d)) continue;
      kad++;
      const C = kameraKonum(px, pz, d);
      if (!kati.some((k) => kesisiyor(k, C, P))) gor++;
    }
  return { kadraj: kad / toplam, gorunur: gor / toplam, disarida: dis / toplam };
}

yaz('§V GÖRÜNÜRLÜK — cephenin hangi ŞERİDİ ekrana giriyor? (S6 §V yöntemi, birebir)');
yaz('-'.repeat(112));
yaz(`kamera oyuncunun +z'sinde (pz + ${n2(CAMERA_DIST)}), −z'ye bakıyor · fov ${CAMERA_FOV} · tarama ${ADIM[0]} × ${ADIM[1]}`);
const disariOran = tara([DX0, 1, CEPHE_Z], CAMERA_DIST, []).disarida;
const disariUzak = tara([DX0, 1, CEPHE_Z], CAMERA_DIST * CAMERA_ZOOM_OUT_MUL, []).disarida;
yaz(`KAMERA BİNANIN DIŞINDA (cz > ${n2(CEPHE_Z)}) olduğu konum oranı: taban ${yz(disariOran)} · uzaklaş ${yz(disariUzak)}`);
yaz('  → cephe ancak bu konumlarda kameranın ÖNÜNDE; geri kalanında kameranın ARKASINDA kalır.');
yaz();
const SERITLER: [string, number[]][] = [
  ['kaide (y 0,20)', [DX0 - 6, 0.2, CEPHE_Z]],
  ['lambri kuşağı (y 0,60)', [DX0 - 6, 0.6, CEPHE_Z]],
  ['lambri ÇITASI (y 0,94)', [DX0 - 6, 0.94, CEPHE_Z]],
  ['CAM BANDI alt (y 1,20)', [DX0 - 6, 1.2, CEPHE_Z]],
  ['CAM BANDI orta (y 1,80)', [DX0 - 6, 1.8, CEPHE_Z]],
  ['CAM BANDI üst (y 2,40)', [DX0 - 6, 2.4, CEPHE_Z]],
  ['ALINLIK / tabela (y 2,90)', [DX0 - 6, 2.9, CEPHE_Z]],
  ['üst kordon (y 3,15)', [DX0 - 6, 3.15, CEPHE_Z]],
  ['cam bandı — kapının 3 br solu', [DX0 - 3, 1.8, CEPHE_Z]],
  ['cam bandı — hattın UCU (x −16)', [-16, 1.8, CEPHE_Z]],
  ['cam bandı — hattın UCU (x +16)', [16, 1.8, CEPHE_Z]],
];
yaz('şerit'.padEnd(32) + '      x       y   kadraj  uzaklaş   portre');
for (const [ad, P] of SERITLER) {
  const t = tara(P, CAMERA_DIST, []);
  const tz = tara(P, CAMERA_DIST * CAMERA_ZOOM_OUT_MUL, []);
  const tp = tara(P, CAMERA_DIST * CAMERA_PORTRAIT_CLAMP, []);
  const hic = t.kadraj + tz.kadraj + tp.kadraj === 0;
  yaz(
    ad.padEnd(32) + n2(P[0]) + n2(P[1]) + '  ' + yz(t.kadraj) + '    ' + yz(tz.kadraj) + '    ' + yz(tp.kadraj) +
      (hic ? '   <<< HİÇ GÖRÜNMÜYOR' : ''),
  );
}
yaz();
// CEPHE HİÇ İÇERİDEN GÖRÜLÜYOR MU? Kamera oyuncunun +z'sinde durup −z'ye bakar; cephe de
// oyuncunun +z'sinde. Yani kamera cephenin İÇİNDEYKEN (cz < 17,50) cephe kameranın ARKASINDA
// kalır. Bu, camın İÇ yüzünün (lambri · kasa · tema) hiç görünmediği anlamına gelirse §T'nin
// bedeli de anlamını yitirir — o yüzden iddia edilmiyor, sayılıyor.
let icKadraj = 0;
let disKadraj = 0;
for (let px = -FLOOR_HALF + 1; px <= FLOOR_HALF - 1; px += ADIM[0])
  for (let pz = BAND.front + 1; pz <= FLOOR_HALF - 0.5; pz += ADIM[1]) {
    if (!kadrajda(px, pz, [DX0 - 6, 1.8, CEPHE_Z], CAMERA_DIST)) continue;
    if (pz + CAMERA_DIST < CEPHE_Z) icKadraj++;
    else disKadraj++;
  }
yaz(`CEPHE KADRAJA GİRDİĞİ ${icKadraj + disKadraj} konumun ${icKadraj}'inde kamera İÇERİDE, ${disKadraj}'inde DIŞARIDA.`);
yaz(
  icKadraj === 0
    ? '  → CEPHE HİÇ İÇERİDEN GÖRÜLMÜYOR. Kamera cephenin içindeyken cephe kameranın ARKASINDA'
    : `  → cephe ${((100 * icKadraj) / (icKadraj + disKadraj)).toFixed(0)}% oranında içeriden de görülüyor`,
);
if (icKadraj === 0) {
  yaz('    kalıyor (kamera −z ye bakar, cephe +z dedir). Sonuç: camın İÇ yüzü — kasa, lambri, tema —');
  yaz('    ekrana hiç girmiyor; vitrin bir DIŞ CEPHE kalemi, bir iç mekân kalemi değil.');
}
damga('cephe iç/dış ayrımı ölçüldü', icKadraj + disKadraj > 0, 'cephe hiçbir konumda kadraja girmiyor');
yaz();
// EKRAN PAYI — "%7 konumda kadrajda" ile "ekranda ne kadar yer kaplıyor" AYNI ŞEY DEĞİL.
// Görsel tur (docs/gorsel/ss/s6b-*.png) cephenin kadrajın alt üçte birini kapladığını gösterdi;
// bu, konum yüzdesinden okunamayan bir sayı. Burada dikey ekran payı hesaplanıyor: cephenin
// tabanı (y 0) ile tepesi (y 3,20) kadrajın düşey açısının yüzde kaçını kaplıyor?
yaz('EKRAN PAYI — cephe kadraja girdiğinde ekranın YÜZDE KAÇINI kaplıyor? (konum yüzdesi bunu');
yaz('söylemiyor: görsel tur cephenin alt üçte biri doldurduğunu gösterdi, ölçüm onu doğruluyor)');
yaz('  oyuncu pz'.padEnd(14) + 'kamera cz   taban ekran y   tepe ekran y   DİKEY EKRAN PAYI');
const ekranY = (C: number[], P: number[]): number => {
  // Kameranın bakış ekseni −z'ye ve aşağı; noktanın düşey açısı / yarım düşey fov → [−1, 1].
  const T = [C[0], CAMERA_LOOK_Y, C[2] - CAMERA_DIST];
  const f = [T[0] - C[0], T[1] - C[1], T[2] - C[2]];
  const fn = Math.hypot(...f);
  const fu = f.map((v) => v / fn);
  const r = [fu[2], 0, -fu[0]];
  const rn = Math.hypot(...r) || 1;
  const ru = r.map((x) => x / rn);
  const u = [ru[1] * fu[2] - ru[2] * fu[1], ru[2] * fu[0] - ru[0] * fu[2], ru[0] * fu[1] - ru[1] * fu[0]];
  const v = [P[0] - C[0], P[1] - C[1], P[2] - C[2]];
  const ileri = v[0] * fu[0] + v[1] * fu[1] + v[2] * fu[2];
  const yuk = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
  // `u` (ru × fu) kamera aşağı baktığı için AŞAĞIYI gösteriyor — işaret çevrilmeden taban,
  // tepenin üstünde çıkıyordu (ilk koşu: taban +0,50, tepe −0,03). `kadrajda` yalnız mutlak
  // değere baktığı için bu hatayı görmüyordu; ekran payı görüyor.
  return -Math.atan2(yuk, ileri) / YARIM_DUSEY; // −1 ekranın altı, +1 üstü
};
for (const pz of [12, 13.5, 15, 16, 16.5]) {
  const C = kameraKonum(DX0 - 9, pz, CAMERA_DIST);
  const alt = ekranY(C, [DX0 - 9, 0, CEPHE_Z]);
  const ust = ekranY(C, [DX0 - 9, WALL_H, CEPHE_Z]);
  const pay = Math.max(0, Math.min(1, (ust + 1) / 2) - Math.max(0, Math.min(1, (alt + 1) / 2)));
  yaz('  ' + n2(pz) + n2(pz + CAMERA_DIST) + '        ' + n2(alt) + '        ' + n2(ust) + '        ' + yz(pay));
}
yaz('  (ekran y: −1 kadrajın altı · +1 üstü · pay = cephenin kapladığı dikey oran)');
yaz();
// CEPHE HİÇ İÇERİDEN GÖRÜLÜYOR MU? Kamera oyuncunun +z'sinde durup −z'ye bakar; cephe de
// oyuncunun +z'sinde. Yani kamera cephenin İÇİNDEYKEN (cz < 17,50) cephe kameranın ARKASINDA
// kalır. Bu, camın İÇ yüzünün (lambri · kasa · tema) hiç görünmediği anlamına gelirse §T'nin
// bedeli de anlamını yitirir — o yüzden iddia edilmiyor, sayılıyor.
yaz('(Burada ÖRTME süzgeci YOK — şerit duvarın kendi yüzünde, onu örten bir şey yok. Örtme');
yaz(' sorusu §Ö2 de: duvarın SALONU örtmesi.)');
yaz();

// ============================================================================================
//  §Ö2 ÖRTME KAZANCI — ASIL SORU: ön duvar salonun ne kadarını gizliyor, cam ne kadarını verir?
// ============================================================================================
yaz('§Ö2 ÖRTME KAZANCI — cam bir SÜS değil bir DELİK. Ön duvar salonu ne kadar gizliyor?');
yaz('-'.repeat(112));
yaz('C0 = bugünkü (ön duvar 0…3,20 katı) · C1 = vitrin (yalnız kaide 0…0,40 + alınlık 2,65…3,20 katı)');
yaz('Kapı bloğu (söve · lento · alınlık kutusu) İKİ KOLDA DA duruyor — kolların farkı değil.');
yaz();
const C0 = [...KATI_C0, ...KAPI_BLOK];
const C1 = [...KATI_C1, ...KAPI_BLOK];
/**
 * HEDEFLER — hepsi KODDAN. İlk taslakta uydurma z'ler (15,0 · 12,0 · 8,0) vardı; ön sıra
 * masaların gerçek z'si **11,70** (`TABLE_SPOTS`), giriş **16,60** (`entranceAt`). Yani ön
 * sıra masalarla cephe arasında 5,80 br'lik bir GİRİŞ KORİDORU var ve uydurma sayılar bu
 * koridoru masa sanıyordu. (S6 dersinin küçük kardeşi: ölçüm koddan okunmazsa ölçüm değildir.)
 */
const onMasalar = LAYOUT.tables.slice(0, 8).map((t) => t.table).filter((t) => t[2] > 10);
const onMasaZ = Math.max(...onMasalar.map((t) => t[2]));
const onMasaX = onMasalar.find((t) => t[2] === onMasaZ)![0];
const GIRIS = entranceAt(AREAS);
const KORIDOR_Z = (onMasaZ + GIRIS[2]) / 2; // giriş koridorunun ortası
const HEDEFLER: [string, number[]][] = [
  [`ön sıra MASA ÜSTÜ (z ${onMasaZ.toFixed(2)})`, [onMasaX, 0.75, onMasaZ]],
  [`ön sıra müşteri BAŞI (z ${onMasaZ.toFixed(2)})`, [onMasaX, ACTOR_HEIGHT, onMasaZ]],
  [`ön sıra YERDEKİ PARA (z ${onMasaZ.toFixed(2)})`, [onMasaX, 0.1, onMasaZ]],
  ['ön sıra masa — İÇ sütun (x −5,30)', [-5.3, 0.75, onMasaZ]],
  ['ikinci sıra masa üstü (z 5,30)', [onMasaX, 0.75, 5.3]],
  ['ikinci sıra yerdeki para (z 5,30)', [onMasaX, 0.1, 5.3]],
  [`GİRİŞ KORİDORU — yerdeki para (z ${KORIDOR_Z.toFixed(2)})`, [DX0 - 4, 0.1, KORIDOR_Z]],
  [`GİRİŞ KORİDORU — müşteri başı (z ${KORIDOR_Z.toFixed(2)})`, [DX0 - 4, ACTOR_HEIGHT, KORIDOR_Z]],
  [`GİRİŞ (entranceAt, z ${GIRIS[2].toFixed(2)})`, [GIRIS[0], 1.0, GIRIS[2]]],
  ['oyuncunun kendi BAŞI (kapı önü)', [DX0, ACTOR_HEIGHT, 15.5]],
  ['sağ kanat masa üstü (x +11,70)', [11.7, 0.75, onMasaZ]],
];
/**
 * YAKIN TARAMA — asıl an. Duvar ancak kamera DIŞARIDAYKEN (pz > 9,00) araya girer; tüm katı
 * tarayınca o an %71'lik bir "duvarın hiç etkisi olmadığı" bölgeyle seyreltiliyor ve kazanç
 * sıfıra yakın okunuyor. Bu payda hatası S6'nın §V dersinin tersi: orada ölçüm bir işi
 * KURTARMIŞTI, burada yanlış payda bir işi haksız yere ELEYECEKTİ.
 */
function taraYakin(P: number[], kati: Kutu[]): { kadraj: number; gorunur: number } {
  let kad = 0;
  let gor = 0;
  for (let px = -FLOOR_HALF + 1; px <= FLOOR_HALF - 1; px += ADIM[0])
    for (let pz = 10; pz <= FLOOR_HALF - 0.5; pz += ADIM[1]) {
      if (!kadrajda(px, pz, P, CAMERA_DIST)) continue;
      kad++;
      if (!kati.some((k) => kesisiyor(k, kameraKonum(px, pz, CAMERA_DIST), P))) gor++;
    }
  return { kadraj: kad, gorunur: kad === 0 ? 0 : gor / kad };
}

yaz('İKİ PAYDA — "tüm kat" ve "YAKIN". Duvar ancak kamera dışarıdayken (oyuncu pz > 9,00) araya');
yaz('girer; tüm katı tarayınca kazanç, duvarın hiç etkisi olmadığı bölgeyle seyreliyor. YAKIN');
yaz('sütunları oyuncu ön yarıdayken (pz ≥ 10) ölçer ve KADRAJA GİREN konumları payda alır.');
yaz();
yaz('hedef'.padEnd(34) + '  kadraj  |  TÜM KAT C0→C1  kazanç  |  YAKIN C0→C1  kazanç');
let kazancToplam = 0;
let yakinToplam = 0;
let kazancSayi = 0;
for (const [ad, P] of HEDEFLER) {
  const a = tara(P, CAMERA_DIST, C0);
  const b = tara(P, CAMERA_DIST, C1);
  // tüm kat: kadraja giren konumların yüzdesi olarak görünürlük
  const a0 = a.kadraj === 0 ? 0 : a.gorunur / a.kadraj;
  const b0 = a.kadraj === 0 ? 0 : b.gorunur / a.kadraj;
  const ya = taraYakin(P, C0);
  const yb = taraYakin(P, C1);
  const kaz = b0 - a0;
  const yKaz = yb.gorunur - ya.gorunur;
  kazancToplam += kaz;
  yakinToplam += yKaz;
  kazancSayi++;
  yaz(
    ad.padEnd(34) + '  ' + yz(a.kadraj) + '  |  ' + yz(a0) + '→' + yz(b0) +
      '  ' + (kaz > 0.005 ? '+' : ' ') + yz(kaz).trim().padStart(5) +
      '  |  ' + yz(ya.gorunur) + '→' + yz(yb.gorunur) +
      '  ' + (yKaz > 0.005 ? '+' : ' ') + yz(yKaz).trim().padStart(5),
  );
}
yaz();
yaz(`ORTALAMA KAZANÇ — tüm kat: ${((100 * kazancToplam) / kazancSayi).toFixed(1)} puan · YAKIN: ${((100 * yakinToplam) / kazancSayi).toFixed(1)} puan`);
damga('yakın payda seyreltmiyor', yakinToplam >= kazancToplam, 'yakın kazanç tüm-kat kazancından küçük');
yaz();

// ÖRTME PROFİLİ — duvarın gölgesi salona kaç birim düşüyor?
yaz('ÖRTME PROFİLİ — oyuncu cepheye yaklaşırken (kamera dışarı çıkarken) ön duvarın gölgesi');
yaz('salona kaç birim giriyor? (x = kapının 5 br solu, yani duvarın arkasında)');
yaz('  oyuncu pz'.padEnd(14) + 'kamera cz  ' + [0.1, 0.75, 1.75].map((y) => `y=${y.toFixed(2)}`.padStart(11)).join('') + '   (C0 → C1)');
for (let pz = 9; pz <= 16.5; pz += 1.5) {
  const cz = pz + CAMERA_DIST;
  const hucreler = [0.1, 0.75, 1.75].map((y) => {
    let g0 = 0;
    let g1 = 0;
    let t = 0;
    for (let z = 10; z <= 16.5; z += 0.5) {
      const P = [DX0 - 5, y, z];
      if (!kadrajda(DX0, pz, P, CAMERA_DIST)) continue;
      t++;
      const C = kameraKonum(DX0, pz, CAMERA_DIST);
      if (!C0.some((k) => kesisiyor(k, C, P))) g0++;
      if (!C1.some((k) => kesisiyor(k, C, P))) g1++;
    }
    return t === 0 ? '     —     ' : `${yz(g0 / t).trim()}→${yz(g1 / t).trim()}`.padStart(11);
  });
  yaz('  ' + n2(pz) + n2(cz) + '  ' + hucreler.join('') + (cz > CEPHE_Z ? '   kamera DIŞARIDA' : ''));
}
yaz();

// ============================================================================================
//  §B BANT SINIRI — cam nerede başlayıp nerede bitmeli? (kaide × cam üstü taraması)
// ============================================================================================
//
// D-037 camı 0,40…2,65 diyor ve 2,65'i kapıyla hizalı olduğu için seçiyor. Ama örtmeyi belirleyen
// şey hiza değil, IŞININ DUVARI KESTİĞİ YÜKSEKLİK. Bu tablo o yüksekliği taradı: seçenek koda
// değil VARYANTA yazılır (D-084).
yaz('§B BANT SINIRI — cam nerede başlayıp nerede bitmeli? (kaide × cam üstü, YAKIN paydası)');
yaz('-'.repeat(112));
yaz('Her hücre: cephenin ARKASINDAKİ dört hedefin YAKIN görünürlük ORTALAMASI (C0 tabanı = ilk satır).');
yaz();
const BANT_HEDEF: number[][] = [
  [onMasaX, 0.1, onMasaZ],
  [onMasaX, 0.75, onMasaZ],
  [DX0 - 4, 0.1, KORIDOR_Z],
  [GIRIS[0], 1.0, GIRIS[2]],
];
const bantOrt = (kaide: number, ust: number): number => {
  const kati: Kutu[] = [...parcaKutu(0, kaide), ...parcaKutu(ust, WALL_H), ...KAPI_BLOK];
  const gecerli = kati.filter((k) => k.h > 1e-6);
  return BANT_HEDEF.reduce((a, P) => a + taraYakin(P, gecerli).gorunur, 0) / BANT_HEDEF.length;
};
const USTLER = [2.4, 2.65, 2.8, 3.0, WALL_H];
const KAIDELER = [0, 0.4, 0.6, WAINSCOT_H];
yaz('kaide | cam üstü'.padEnd(18) + USTLER.map((u) => `${u.toFixed(2)}`.padStart(9)).join('') + '     not');
// Bir ondalık: 2,65 ↔ 2,80 farkı tam sayıya yuvarlanınca kayboluyordu ve tablo "fark yok"
// diyordu; oysa ışın kesişmesi 2,69'da. Yuvarlama bir bulguyu silmesin.
const yz1 = (v: number) => `${(v * 100).toFixed(1)}%`;
const taban = bantOrt(WALL_H, WALL_H); // katı duvar = C0
yaz('C0 KATI DUVAR'.padEnd(18) + `${yz1(taban)}`.padStart(9) + ' '.repeat(9 * (USTLER.length - 1)) + '     bugünkü');
for (const k of KAIDELER) {
  const hucre = USTLER.map((u) => (u <= k ? '    —    ' : `${yz1(bantOrt(k, u))}`.padStart(9)));
  const not = k === 0 ? 'cam zemine iner' : k === 0.4 ? 'D-037' : k === WAINSCOT_H ? 'lambri korunur (C4b)' : '';
  yaz(`${k.toFixed(2)}`.padEnd(18) + hucre.join('') + '     ' + not);
}
yaz();
// IŞININ CEPHEYİ KESTİĞİ YÜKSEKLİK — §B tablosunun NEDENİ. Anlatı değil, türetilmiş sayı:
// kamera 45°'den bakarken ışın cepheyi hangi yükseklikte geçiyor? O yükseklik cam bandının
// İÇİNDE kalırsa vitrin kazandırır, ÜSTÜNDE kalırsa duvarın hangi bandı olduğu fark etmez.
yaz('IŞIN CEPHEYİ HANGİ YÜKSEKLİKTE KESİYOR? (§B tablosunun nedeni — kaide satırlarının aynı');
yaz('çıkmasının sebebi burada)');
yaz('hedef'.padEnd(38) + '  en yakın oyuncu  kesişme y   cam bandı 0,40…2,65 içinde mi?');
const KESISME: [string, number[]][] = [
  [`ön sıra masa üstü (z ${onMasaZ.toFixed(2)})`, [onMasaX, 0.75, onMasaZ]],
  [`giriş koridoru zemini (z ${KORIDOR_Z.toFixed(2)})`, [DX0 - 4, 0.1, KORIDOR_Z]],
  ['cephenin 1 br arkası — zemin (z 16,50)', [DX0 - 6, 0.1, 16.5]],
  ['cephenin 1 br arkası — bel hizası (z 16,50)', [DX0 - 6, 1.0, 16.5]],
];
for (const [ad, P] of KESISME) {
  // Oyuncu cepheye en yakın konumdayken (pz = FLOOR_HALF − 0,5) kameradan hedefe giden ışın.
  const pz = FLOOR_HALF - 0.5;
  const C = kameraKonum(P[0], pz, CAMERA_DIST);
  const t = (C[2] - CEPHE_Z) / (C[2] - P[2]);
  const y = C[1] + t * (P[1] - C[1]);
  const icinde = t > 0 && t < 1 && y > VITRIN_KAIDE && y < VITRIN_UST;
  const arkada = P[2] < CEPHE_Z && t > 0 && t < 1;
  yaz(
    ad.padEnd(38) + n2(pz) + '        ' + (arkada ? n2(y) : '    —  ') + '     ' +
      (!arkada ? 'ışın cepheyi hiç geçmiyor' : icinde ? 'EVET → vitrin kazandırır' : `hayır (${y > VITRIN_UST ? 'camın ÜSTÜNDEN' : 'camın ALTINDAN'} geçiyor)`),
  );
}
yaz();
const kaideYayilim = Math.max(...KAIDELER.map((k) => bantOrt(k, VITRIN_UST))) - Math.min(...KAIDELER.map((k) => bantOrt(k, VITRIN_UST)));
yaz(`OKUMA — KAİDE: dört kaide (0,00 · 0,40 · 0,60 · 0,90) arasındaki yayılım ${(kaideYayilim * 100).toFixed(1)} puan.`);
yaz('Kaidenin yüksekliği örtmeyi etkilemiyor; ışın cepheyi hep yukarıdan kesiyor. Kaide/lambri');
yaz('seçimi (C4a ↔ C4b) bu yüzden bir ÖLÇÜM sorusu değil, bir GÖRSEL tercih — karar paketine öyle gider.');
yaz('OKUMA — CAM ÜSTÜ: kazanç bandın üst kenarı yükseldikçe doğuyor (taban ' + yz1(taban) + '):');
for (const u of USTLER) {
  const fark = bantOrt(VITRIN_KAIDE, u) - taban;
  yaz(`  cam üstü ${u.toFixed(2)} → ${yz1(bantOrt(VITRIN_KAIDE, u))}  (${fark >= 0 ? '+' : ''}${(fark * 100).toFixed(1)} puan)` + (u >= WALL_H ? '   ← ALINLIK da yok demek: cephenin TABELASI gider' : ''));
}
yaz();

// ============================================================================================
//  §C VİTRİN MODÜLASYONU — cam hattı kaç göze bölünür? (C1 tam hat · C3 ayaksız)
// ============================================================================================
yaz('§C VİTRİN MODÜLASYONU — cam hattı kaç GÖZE bölünür?');
yaz('-'.repeat(112));
/** Kullanılabilir hat: söve dış kenarından duvarın ucuna (köşe payı `KOSE_PAY`). */
const KOSE_PAY = 0.6;
const yariHat = onRuns.map((r) => {
  const uz = wallUzunluk(r);
  const a = r.x - uz / 2;
  const b = r.x + uz / 2;
  return r.x < DX0 ? [a + KOSE_PAY, DX0 - SOVE_DIS] : [DX0 + SOVE_DIS, b - KOSE_PAY];
});
const kullanilir = yariHat[0][1] - yariHat[0][0];
yaz(
  `kullanılabilir yarı-hat: ${n2(yariHat[0][0])} … ${n2(yariHat[0][1])} → ${n2(kullanilir)} br ` +
    `(köşe payı ${n2(KOSE_PAY)}, söve dış kenarı ${n2(SOVE_DIS)})`,
);
yaz(`  → iki yarı toplam ${n2(kullanilir * 2)} br cam hattı adayı`);
yaz();
const AYAK = 0.36; // gözler arası düşey ayak
yaz('göz'.padEnd(6) + 'göz eni  ayak sayısı  ayak eni  toplam ayak    artık   göz eni / insan boyu');
for (let n = 2; n <= 7; n++) {
  const ayakSayisi = n - 1;
  const gozEni = (kullanilir - ayakSayisi * AYAK) / n;
  const artik = kullanilir - (n * gozEni + ayakSayisi * AYAK);
  yaz(
    `${n}`.padStart(4) + '  ' + n2(gozEni) + `${ayakSayisi}`.padStart(13) + n2(AYAK) + n2(ayakSayisi * AYAK) +
      n2(artik) + n2(gozEni / ACTOR_HEIGHT) + ' × insan boyu',
  );
}
yaz();
yaz(`C3 (ayaksız — yalnız kapının İKİ YANINDA birer göz): göz eni ${n2(kullanilir)} br × 2 göz,`);
yaz(`  cam yüzeyi ${n2(kullanilir * 2 * (VITRIN_UST - VITRIN_KAIDE))} m² · C1 (tam hat) ile AYNI yüzey —`);
yaz('  fark yalnız ayakların (düşey bölmelerin) olup olmaması. C3 "kısmi" değil, "ayaksız C1".');
yaz();

// ============================================================================================
//  §M KayKit MODÜLÜ Mİ? (C2) — S6 §E'nin sağ duvar için elediği soru, CEPHE için yeniden
// ============================================================================================
const RKOK = 'public/assets/models/kaykit-restaurant-bits/';
type Ucgen = [number[], number[], number[]];
function ucgenGeo(ad: string): Ucgen[] {
  const dosya = `${RKOK}${ad}.gltf`;
  const g = JSON.parse(readFileSync(dosya, 'utf8'));
  const bin = readFileSync(dosya.replace(/\.gltf$/, '.bin'));
  const al = (i: number) => {
    const a = g.accessors[i];
    const bv = g.bufferViews[a.bufferView];
    return { a, base: (bv.byteOffset ?? 0) + (a.byteOffset ?? 0) };
  };
  const t: Ucgen[] = [];
  for (const m of g.meshes)
    for (const pr of m.primitives) {
      const { a: pa, base: pb } = al(pr.attributes.POSITION);
      const pos = new Float32Array(pa.count * 3);
      for (let i = 0; i < pa.count * 3; i++) pos[i] = bin.readFloatLE(pb + i * 4);
      const { a: ia, base: ib } = al(pr.indices);
      const boy = ia.componentType === 5121 ? 1 : ia.componentType === 5123 ? 2 : 4;
      const v = (k: number) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]];
      for (let i = 0; i < ia.count; i += 3) {
        const g3 = [0, 1, 2].map((o) =>
          boy === 1
            ? bin.readUInt8(ib + i + o)
            : boy === 2
              ? bin.readUInt16LE(ib + (i + o) * 2)
              : bin.readUInt32LE(ib + (i + o) * 4),
        );
        t.push([v(g3[0]), v(g3[1]), v(g3[2])]);
      }
    }
  return t;
}
/** Möller-Trumbore: (x, y, −9) noktasından +z yönünde giden ışın üçgeni kesiyor mu? */
function vurusZ(tri: Ucgen, x: number, y: number): number | null {
  const [a, b, c] = tri;
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
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
const olcM = (ad: string) => bbox(`${RKOK}${ad}.gltf`) as { mn: number[]; mx: number[]; boyut: number[] };
function ucgenSayisi(ad: string): number {
  const g = JSON.parse(readFileSync(`${RKOK}${ad}.gltf`, 'utf8'));
  let n = 0;
  for (const m of g.meshes) for (const p of m.primitives) n += g.accessors[p.indices].count / 3;
  return n;
}
/** Bir y yüksekliğinde modelin BOŞ (ışının hiçbir üçgeni kesmediği) x aralıkları. */
function delikler(ad: string, tri: Ucgen[], y: number, adim = 0.02): [number, number][] {
  const b = olcM(ad);
  const bos: [number, number][] = [];
  let bas: number | null = null;
  for (let x = b.mn[0] + adim / 2; x <= b.mx[0]; x += adim) {
    const dolu = tri.some((t) => vurusZ(t, x, y) !== null);
    if (!dolu && bas === null) bas = x - adim / 2;
    if (dolu && bas !== null) {
      if (x - bas > 0.05) bos.push([bas, x - adim / 2]);
      bas = null;
    }
  }
  if (bas !== null && b.mx[0] - bas > 0.05) bos.push([bas, b.mx[0]]);
  return bos;
}

yaz('§M KayKit DUVAR MODÜLÜ CEPHEYE OLUR MU? (C2) — S6 §E sağ duvar için elemişti, cephe başka soru');
yaz('-'.repeat(112));
const MODULLER = [
  'wall',
  'wall_half',
  'wall_window_open',
  'wall_window_closed',
  'wall_orderwindow',
  'wall_orderwindow_decorated',
  'wall_doorway',
  'wall_decorated',
];
const KAY_S = WALL_H / 4; // mimari ölçek: modül boyu 4,00 ham → duvar 3,20 (S6 ile aynı sayı)
yaz(`mimari ölçek KAY_S = WALL_H / 4 = ${n3(KAY_S)} (S6 ile aynı gerekçe: modül 4,00 ham boy → duvar ${n2(WALL_H)})`);
yaz();
yaz('modül'.padEnd(30) + '  ham en   ham boy  ham kal   üçgen   dünya en  dünya boy   kalınlık');
const HAM: Record<string, { mn: number[]; mx: number[]; boyut: number[] }> = {};
for (const ad of MODULLER) {
  const b = olcM(ad);
  HAM[ad] = b;
  yaz(
    ad.padEnd(30) + n2(b.boyut[0]) + n2(b.boyut[1]) + n2(b.boyut[2]) + `${ucgenSayisi(ad)}`.padStart(8) +
      n2(b.boyut[0] * KAY_S) + n2(b.boyut[1] * KAY_S) + n2(b.boyut[2] * KAY_S),
  );
}
yaz();
yaz('DELİKLERİ IŞINLA (S4/S6 dersi: vertex saymak yanlış — düz yüzün ortasında vertex yoktur):');
yaz('modül'.padEnd(30) + ' delik alt delik üst delik eni   dünya delik (en × boy)   cam bandı 0,40…2,65 karşılığı');
const CAM_BOY = VITRIN_UST - VITRIN_KAIDE;
for (const ad of ['wall_window_open', 'wall_window_closed', 'wall_orderwindow', 'wall_orderwindow_decorated', 'wall_doorway']) {
  const tri = ucgenGeo(ad);
  const b = HAM[ad];
  let alt = Infinity;
  let ust = -Infinity;
  let en = 0;
  for (let y = b.mn[1] + 0.05; y < b.mx[1]; y += 0.05) {
    const d = delikler(ad, tri, y).filter(([p, q]) => q - p > 0.4);
    if (!d.length) continue;
    alt = Math.min(alt, y);
    ust = Math.max(ust, y + 0.05);
    en = Math.max(en, Math.max(...d.map(([p, q]) => q - p)));
  }
  yaz(
    ad.padEnd(30) +
      (en > 0
        ? n2(alt) + n2(ust) + n2(en) + '     ' + n2(en * KAY_S) + ' ×' + n2((ust - alt) * KAY_S) +
          '        boy ' + `${((((ust - alt) * KAY_S) / CAM_BOY) * 100).toFixed(0)}%`.padStart(5) + ' · en ' + n2(en * KAY_S) + ' br'
        : '   —        —        —      DELİK YOK'),
  );
}
yaz();
yaz('MODÜLÜN KENDİ YATAY OLUĞU ↔ maketin LAMBRİ ÇITASI (D-100 riski — kullanıcı "duvar 2ye bölünük" dedi):');
yaz('modül'.padEnd(30) + '  oluk ham y   oluk DÜNYA y   çıta y 0,94   sapma');
for (const ad of ['wall', 'wall_decorated', 'wall_window_open']) {
  const tri = ucgenGeo(ad);
  const b = HAM[ad];
  // Oluk = en profilinde ANİ daralma: her y'de dolu genişliği ölç, en büyük düşüşü bul.
  let oncekiEn = -1;
  let olukY = NaN;
  let enBuyukDusus = 0;
  for (let y = b.mn[1] + 0.05; y < b.mx[1] - 0.05; y += 0.05) {
    const bos = delikler(ad, tri, y, 0.05).reduce((a, [p, q]) => a + (q - p), 0);
    const dolu = b.boyut[0] - bos;
    if (oncekiEn >= 0 && oncekiEn - dolu > enBuyukDusus) {
      enBuyukDusus = oncekiEn - dolu;
      olukY = y;
    }
    oncekiEn = dolu;
  }
  const dunya = (olukY - b.mn[1]) * KAY_S;
  yaz(ad.padEnd(30) + (Number.isNaN(olukY) ? '   oluk yok' : n2(olukY) + n2(dunya) + n2(0.94) + n2(Math.abs(dunya - 0.94))));
}
yaz();
yaz('ATLAS GÖZLERİ (rengi addan değil dokudan oku — S6 §G dersi):');
const hx = (v: number) => Math.round(v).toString(16).padStart(2, '0');
const ATLAS = gozRenkleri('public/assets/models/kaykit-restaurant-bits/restaurantbits_texture.png') as {
  goz: [number, number];
  ort: number[];
}[];
const gozRenk = (k: string): string => {
  const [r, c] = k.split(',').map(Number);
  const g = ATLAS.find((o) => o.goz[0] === r && o.goz[1] === c);
  return g ? `#${hx(g.ort[0])}${hx(g.ort[1])}${hx(g.ort[2])}` : '?';
};
const doygunluk = (k: string): number => {
  const [r, c] = k.split(',').map(Number);
  const g = ATLAS.find((o) => o.goz[0] === r && o.goz[1] === c);
  if (!g) return 0;
  const mx = Math.max(...g.ort);
  const mn = Math.min(...g.ort);
  return mx === 0 ? 0 : (mx - mn) / mx;
};
for (const ad of ['wall', 'wall_window_open', 'wall_orderwindow']) {
  const gz = gozler('kaykit-restaurant-bits', ad).slice(0, 4) as [string, number][];
  yaz('  ' + ad.padEnd(28) + gz.map(([k, n]) => `[${k}] ${gozRenk(k)} doy ${doygunluk(k).toFixed(2)} ×${n}`).join('  '));
}
yaz();
const modulEni = HAM['wall'].boyut[0] * KAY_S;
yaz(`MODÜL SAYISI: cephe hattı ${n2(cepheHat)} br ÷ modül eni ${n2(modulEni)} br = ${(cepheHat / modulEni).toFixed(2)} modül`);
yaz(`  → tam bölünme olmuyor; artık ${n2((cepheHat / modulEni - Math.floor(cepheHat / modulEni)) * modulEni)} br (D-100'ün duvarda çuvalladığı yer)`);
yaz();

// ============================================================================================
//  §Ş ŞEFFAFLIK BEDELİ — kaç mesh, kaç üçgen, hangi kolda?
// ============================================================================================
yaz('§Ş ŞEFFAFLIK BEDELİ — cephe bugün TEK InstancedMesh içinde; cam onu böler mi?');
yaz('-'.repeat(112));
yaz('Bugün: ön duvarın iki parçası `WallPanels` tek InstancedMesh\'ine giriyor (gövde + lambri + çıta');
yaz(`= ${onRuns.length} × 3 = ${onRuns.length * 3} kutu, ek çizim çağrısı YOK — instans).`);
yaz();
yaz('kol'.padEnd(34) + '  duvar kutusu  cam mesh  kasa mesh  ek çizim çağrısı  üçgen (cam+kasa)');
const KOLLAR: [string, number][] = [
  ['C0 bugünkü (cam yok)', 0],
  ['C1 tam hat — 4 göz/yarı', 8],
  ['C1 tam hat — 3 göz/yarı', 6],
  ['C3 ayaksız — 1 göz/yarı', 2],
];
for (const [ad, gozSayisi] of KOLLAR) {
  const ayak = gozSayisi === 0 ? 0 : Math.max(0, gozSayisi - 2);
  const duvarKutu = gozSayisi === 0 ? onRuns.length * 3 : onRuns.length * 2 * 3 + ayak * 3;
  const camMesh = gozSayisi;
  const kasaMesh = gozSayisi * 4;
  yaz(
    ad.padEnd(34) + `${duvarKutu}`.padStart(14) + `${camMesh}`.padStart(10) + `${kasaMesh}`.padStart(11) +
      `${camMesh + kasaMesh}`.padStart(18) + `${(camMesh + kasaMesh) * 12}`.padStart(18),
  );
}
yaz();
yaz('NOT — sağ duvarın penceresi (`Decor.Pencere`) camın ARKASINA opak bir "dışarısı gündüz" paneli');
yaz('koyuyor. CEPHEDE O PANEL OLAMAZ: cephede camın arkası salonun kendisi. §Ö2 zaten cam ARDINDA');
yaz(`görülecek bir şey OLMADIĞINI ölçtü (kazanç ${((100 * kazancToplam) / kazancSayi).toFixed(1)} puan), ama panel konursa cam bir DELİK bile`);
yaz('olmaz — kapalı bir renk şeridi olur ve şeffaflığın çizim bedeli karşılıksız ödenir.');
yaz();

// ============================================================================================
//  §K KAPI BLOĞU HİZASI — vitrin kapı bloğuna değiyor mu?
// ============================================================================================
yaz('§K KAPI BLOĞU HİZASI — vitrin gelince kapı bloğunun neyi değişir?');
yaz('-'.repeat(112));
yaz('parça'.padEnd(28) + '        y0       y1        en   x aralığı (kapı ekseninden)');
const BLOK: [string, number, number, number][] = [
  ['söve (sol/sağ)', 0, DOOR.height, 0.4],
  ['lento', DOOR.height, DOOR.height + 0.16, DOOR.half * 2 + 0.6],
  ['alınlık (duvar hattında)', DOOR.height, WALL_H, DOOR.half * 2 + 0.4],
  ['üst kordon', WALL_H - 0.1, WALL_H, DOOR.half * 2 + 0.6],
  ['VİTRİN kaidesi', 0, VITRIN_KAIDE, kullanilir],
  ['VİTRİN camı', VITRIN_KAIDE, VITRIN_UST, kullanilir],
  ['VİTRİN alınlığı', VITRIN_UST, WALL_H, kullanilir],
];
for (const [ad, y0, y1, en] of BLOK)
  yaz(
    '  ' + ad.padEnd(26) + n2(y0) + n2(y1) + n2(en) +
      (ad.startsWith('VİTRİN') ? `   ∓${SOVE_DIS.toFixed(2)} … ∓${(SOVE_DIS + kullanilir).toFixed(2)}` : `   ∓${(en / 2).toFixed(2)}`),
  );
yaz();
const hiza = Math.abs(VITRIN_UST - DOOR.height);
yaz(`CAM ÜSTÜ ↔ KAPI ÜSTÜ hizası: ${n2(VITRIN_UST)} ↔ ${n2(DOOR.height)} → sapma ${n3(hiza)} ${hiza < 0.01 ? '✓ HİZALI (D-037in kendi kuralı)' : '✗'}`);
yaz(`VİTRİN ALINLIĞI ↔ KAPI ALINLIĞI: ikisi de ${n2(VITRIN_UST)}…${n2(WALL_H)} → cephe tepesi TEK ŞERİT olur ✓`);
yaz(`VİTRİN ↔ SÖVE çakışması: vitrin ∓${n2(SOVE_DIS)}'ten başlar, söve dış kenarı ∓${n2(SOVE_DIS)} → çakışma yok ✓`);
damga('cam üstü kapı üstüyle hizalı', hiza < 0.01, `${hiza.toFixed(3)} sapma`);
yaz();
yaz('LAMBRİ SORUSU (C4): bugün cephede lambri kuşağı 0…0,90 + çıta 0,94. Vitrin kaidesi 0…0,40.');
yaz(`  → lambri kaideden ${n2(WAINSCOT_H - VITRIN_KAIDE)} br YÜKSEK; ikisi bir arada duramaz.`);
yaz('  C4a kaide 0,40 (D-037) — lambri cepheden KALKAR, iç duvarlarda kalır (cephe ayrışır).');
yaz(
  `  C4b kaide ${n2(WAINSCOT_H)} (lambri boyu) — lambri korunur, cam bandı ${n2(VITRIN_UST - WAINSCOT_H)} br ` +
    `(D-037den ${n2(CAM_BOY - (VITRIN_UST - WAINSCOT_H))} br kısa).`,
);
yaz();

// ============================================================================================
//  §T TEMA KOLU — mağazadaki duvar teması cephede ne kadar görünür kalır?
// ============================================================================================
yaz('§T TEMA KOLU — `wallThemeByArea` cephede ne kadar yüzey kaybeder?');
yaz('-'.repeat(112));
const cepheYuzey = cepheHat * WALL_H;
const kalanC1 = cepheHat * (VITRIN_KAIDE + (WALL_H - VITRIN_UST));
const kalanC4b = cepheHat * (WAINSCOT_H + (WALL_H - VITRIN_UST));
yaz('kol'.padEnd(34) + '  temalı yüzey (m²)   cephe yüzeyinin  ·  kaybolan');
yaz('C0 bugünkü'.padEnd(34) + n2(cepheYuzey) + '            ' + yz(1) + '   ' + yz(0));
yaz('C1 vitrin (kaide 0,40)'.padEnd(34) + n2(kalanC1) + '            ' + yz(kalanC1 / cepheYuzey) + '   ' + yz(1 - kalanC1 / cepheYuzey));
yaz('C4b vitrin (kaide 0,90 = lambri)'.padEnd(34) + n2(kalanC4b) + '            ' + yz(kalanC4b / cepheYuzey) + '   ' + yz(1 - kalanC4b / cepheYuzey));
yaz();
yaz('NOT: tema `wallThemeByArea` üstünden ALAN başına seçiliyor ve cephe iki alanın da kenarı.');
yaz('Cephe camlaşırsa temanın cephedeki payı düşer — ama §V cephenin kadraja giren payını zaten');
yaz('düşük ölçüyor; temanın asıl gösterildiği yüzey İÇ duvarlar. Bu satır bir BEDEL, engel değil.');
yaz();

yaz('='.repeat(112));
yaz('SON — karar bölümü RAPORDA, bu dosyada YOK (D-084: ölç → sor → uygula).');
yaz('='.repeat(112));

console.log(cikti.join('\n'));
damgaOzeti();
