/**
 * olcum-mutfak.ts — S20 ÖLÇÜM: mutfak odası (erişim · çaycı · doluluk).
 *
 * NEDEN BU ARAÇ — 2026-09-15 gecesi alınan üç taban karesinde mutfak "güzel ama ölü" duruyordu:
 * arka duvar tıka basa dolu, odanın ORTASI boş, içeride bir çaycı gidip geliyor ve oyuncu
 * oraya hiç giremiyor. Üç soru birbirine benziyor ama üçü ayrı iş kalemi; hangisinin yapılmaya
 * DEĞDİĞİNİ tek bir sayı belirler: **o yer ekranda görünüyor mu.**
 *
 * S6'nın dersi (karşı binalar üç kamera kipinde de %0 görünür çıktı, 10.389 üçgenlik iş
 * ölçülmeseydi yapılacaktı) ve S7'nin dersi (WC odasının önünde 2,2'lik duvar var) burada
 * ÜST ÜSTE biniyor: mutfağın önünde 0,90 boyunda üç tezgâh gövdesi var ve kamera 45°'den
 * bakıyor. Bu yüzden §G (görünürlük) §E/§Ç/§D'den ÖNCE gelir ve üçünün de süzgecidir.
 *
 * ÜÇ SORU — üçü de `tools/shot-s20-mutfak.mjs`in başlığından, kullanıcının gece verdiği tarifle:
 *   §E  mutfağa girilebilen bir açıklık var mı? (E0 kapalı kalsın · E1 açıklık + yürünebilir)
 *   §Ç  çaycı ne yapıyor gibi duruyor? (Ç0 salt görsel kalsın · Ç1 servise görsel bağlansın)
 *   §D  oda içi ne kadar dolu? (D0 orta boş kalsın · D1 ada/istif ile dolsun)
 *
 * Bu araç HİÇBİR ŞEYİ DEĞİŞTİRMEZ; ölçer ve `docs/olcum-mutfak.txt` üretir.
 * Kullanım: npx tsx tools/olcum-mutfak.ts                                   (kısa — yön gösterir)
 *           OLCUM=tam npx tsx tools/olcum-mutfak.ts > docs/olcum-mutfak.txt  (rapora giren koşu)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ACTOR_HEIGHT, CAMERA_LOOK_Y, PLAYER_RADIUS } from '../src/config/actor';
import { CAMERA_DIST, CAMERA_FOV } from '../src/config/camera';
import { BAND, BAND_SHELL, FLOOR_HALF, LAYOUT, WAITER_STATION, clampToOpenAreas, servicePlace } from '../src/game/layout';
import {
  BACK_Z, CAYCI_TEMPO, COUNTER_TOP_Y, FAYANS, FRONT_Z, FRONT_TOP_Y, KITCHEN_S, KITCHEN_UNITS, LEFT_X, MODULE_W,
  NATIVE, RIGHT_X, cayciHali, cayciHizCarpani, sinirBolmeleri, unitBox,
} from '../src/components/three/kitchenLook';
import { KIP, damga, damgaOzeti, kipBandi } from './olcum-lib';

const cikti: string[] = [];
const yaz = (s = '') => {
  cikti.push(s);
  console.log(s);
};
const n2 = (v: number) => v.toFixed(2).padStart(7);
const yz = (v: number) => `${(v * 100).toFixed(0).padStart(4)}%`;
const cizgi = (n = 112) => yaz('='.repeat(n));

yaz('='.repeat(112));
yaz('S20 ÖLÇÜM — MUTFAK ODASI: erişim · çaycı · doluluk');
yaz('='.repeat(112));
kipBandi();
yaz();

// Tarama adımları: kısa koşu yön gösterir, tam koşu rapora girer.
// ÜÇÜ AYRI, çünkü maliyetleri ayrı: doluluk ızgarası ışın atmaz (ucuz, ince olabilir);
// görünürlük ızgarası her hücre için duruş × gövde kadar ışın atar (pahalı).
const ADIM = KIP === 'tam' ? 0.05 : 0.25;        // doluluk ızgarası
const ADIM_GOR = KIP === 'tam' ? 0.25 : 0.5;     // görünürlük ızgarası
const ADIM_OYUNCU = KIP === 'tam' ? 0.5 : 1.0;   // oyuncunun duruş noktaları

// =============================================================================================
// §O — ODANIN KUTUSU (hiçbir sayı elle yazılmaz; hepsi kaynaktan okunur)
// =============================================================================================
cizgi();
yaz('§O — ODANIN KUTUSU');
cizgi();
yaz();
const ODA = { x0: FAYANS.x0, x1: FAYANS.x1, z0: FAYANS.z0, z1: FAYANS.z1 };
const odaEn = ODA.x1 - ODA.x0;
const odaBoy = ODA.z1 - ODA.z0;
const odaAlan = odaEn * odaBoy;
yaz(`fayans dikdörtgeni   x ${n2(ODA.x0)} … ${n2(ODA.x1)}   z ${n2(ODA.z0)} … ${n2(ODA.z1)}`);
yaz(`ölçü                 ${odaEn.toFixed(2)} × ${odaBoy.toFixed(2)} br   = ${odaAlan.toFixed(2)} br²`);
yaz(`duvar iç yüzleri     arka z ${n2(BACK_Z)} · sol x ${n2(LEFT_X)} · doğu x ${n2(RIGHT_X)} (merdiven ara duvarı)`);
yaz(`ön sınır (dekor)     z ${n2(FRONT_Z)}  = işleyen servis tezgâhının ARKA yüzü`);
yaz(`bandın ön yüzü       z ${n2(BAND.front)}  = OYUNCUNUN durabildiği en arka çizgi (AREA_RECTS[2].minZ)`);
yaz(`modül eni            ${MODULE_W.toFixed(2)} br · paket ölçeği ${KITCHEN_S} · tezgâh üstü ${COUNTER_TOP_Y.toFixed(2)}`);
yaz();

// =============================================================================================
// §G — GÖRÜNÜRLÜK (S6 + S7 süzgeci) — §E/§Ç/§D'nin HEPSİ buna bağlı
// =============================================================================================
//
// İKİ SÜZGEÇ ÜST ÜSTE (S7 ile birebir aynı yöntem):
//   1) KADRAJ — nokta kameranın görüş konisinde mi?
//   2) ÖRTME  — kameradan noktaya giden ışın ÖN HATTIN gövdelerini ya da odanın KENDİ
//               ünitelerini kesiyor mu? Mutfakta örten şey bir duvar değil, 0,90 boyundaki
//               tezgâh sırası; 45°'den bakan kamera onun arkasına ne kadar giriyor?
const YARIM_DUSEY = (CAMERA_FOV * Math.PI) / 360;
const YARIM_YATAY = Math.atan(Math.tan(YARIM_DUSEY) * (16 / 9));

interface Kutu { x: number; y: number; z: number; w: number; h: number; d: number }

/** ÖN HAT — oyunun işleyen üç gövdesi. COLLISION kutularından türer (çizim birleştirmesi değil). */
const SP = servicePlace(3);
const ON_HAT: Kutu[] = [
  { x: SP.station[0], y: FRONT_TOP_Y / 2, z: SP.station[2], w: SP.half[0] * 2, h: FRONT_TOP_Y, d: SP.half[1] * 2 },
  { x: WAITER_STATION.pos[0], y: FRONT_TOP_Y / 2, z: WAITER_STATION.pos[2], w: WAITER_STATION.half[0] * 2, h: FRONT_TOP_Y, d: WAITER_STATION.half[1] * 2 },
  { x: SP.dish[0], y: FRONT_TOP_Y / 2, z: SP.dish[2], w: SP.dishHalf[0] * 2, h: FRONT_TOP_Y, d: SP.dishHalf[1] * 2 },
];

/** Odanın KENDİ üniteleri de örter (buzdolabı arkasındaki duvar görünmez). */
const UNITE_KUTU: Kutu[] = KITCHEN_UNITS.map((u) => {
  const b = unitBox(u);
  return {
    x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2, z: (b.minZ + b.maxZ) / 2,
    w: b.maxX - b.minX, h: b.maxY - b.minY, d: b.maxZ - b.minZ,
  };
});

const ORTENLER = [...ON_HAT, ...UNITE_KUTU];

/** Işın–eksen hizalı kutu kesişimi (slab yöntemi, o→hedef parçası). S7 ile birebir. */
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

/** Oyuncu (px,pz) iken P noktası kadrajda mı? (S6 §V / S7 §V ile birebir) */
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

/** Kameradan noktaya giden ışın herhangi bir gövdeyi kesiyor mu? (noktanın KENDİ kutusu hariç) */
const ortulu = (px: number, pz: number, P: number[], d: number, haric: Kutu | null = null): boolean =>
  ORTENLER.some((k) => k !== haric && kesisiyor(k, kameraKonum(px, pz, d), P));

/**
 * OYUNCUNUN MUTFAĞA BAKABİLDİĞİ TÜM DURUŞLAR — mutfağın önündeki koridor şeridi.
 * Kelepçe yüzünden oyuncu z ≥ BAND.front; şerit oradan 4,5 br salona kadar.
 */
function durusNoktalari(): number[][] {
  const out: number[][] = [];
  for (let px = ODA.x0; px <= ODA.x1; px += ADIM_OYUNCU)
    for (let pz = BAND.front + 0.5; pz <= BAND.front + 4.5; pz += ADIM_OYUNCU) out.push([px, pz]);
  return out;
}
const DURUSLAR = durusNoktalari();

/**
 * P noktası oyuncunun kaç duruşundan görünür? TEK GEÇİŞ — "hiç görünür mü" ile "duruş oranı"
 * ayrı ayrı sorulursa ızgara iki kez taranır ve tam koşu iki katına çıkar.
 */
function gorunurluk(P: number[], haric: Kutu | null = null): { oran: number; hic: boolean } {
  let g = 0;
  for (const [px, pz] of DURUSLAR) if (kadrajda(px, pz, P, CAMERA_DIST) && !ortulu(px, pz, P, CAMERA_DIST, haric)) g++;
  return { oran: g / DURUSLAR.length, hic: g > 0 };
}
const gorunurOran = (P: number[], haric: Kutu | null = null): number => gorunurluk(P, haric).oran;
const hicGorunurMu = (P: number[], haric: Kutu | null = null): boolean => gorunurluk(P, haric).hic;

cizgi();
yaz('§G — GÖRÜNÜRLÜK: mutfağın içi ekranda var mı? (§E/§Ç/§D bu tablodan sonra okunur)');
cizgi();
yaz();
yaz(`kamera oyuncunun +z'sinde (pz + ${n2(CAMERA_DIST)}), −z'ye bakıyor · fov ${CAMERA_FOV} · bakış y ${CAMERA_LOOK_Y}`);
yaz(`örten gövde sayısı: ön hat ${ON_HAT.length} + oda ünitesi ${UNITE_KUTU.length} = ${ORTENLER.length}`);
yaz(`tarama adımı: doluluk ${ADIM} br · görünürlük ${ADIM_GOR} br · duruş ${ADIM_OYUNCU} br`);
yaz(`oyuncunun denenen duruşu: ${DURUSLAR.length} nokta (x ${n2(ODA.x0)}…${n2(ODA.x1)} · z ${n2(BAND.front + 0.5)}…${n2(BAND.front + 4.5)})`);
yaz();

/** Oda zemininin z-şeritleri — "arka duvar dibi" ile "odanın ortası" ayrı okunur. */
const SERIT: { ad: string; z0: number; z1: number }[] = [
  { ad: 'arka duvar dibi', z0: ODA.z0, z1: ODA.z0 + 1.2 },
  { ad: 'tezgâh hattı', z0: ODA.z0 + 1.2, z1: ODA.z0 + 2.4 },
  { ad: 'ODANIN ORTASI', z0: ODA.z0 + 2.4, z1: ODA.z0 + 4.2 },
  { ad: 'çaycı koridoru', z0: ODA.z0 + 4.2, z1: ODA.z0 + 5.6 },
  { ad: 'ön sınır şeridi', z0: ODA.z0 + 5.6, z1: ODA.z1 },
];

/** Göz yükseklikleri: zemin eşyası · tezgâh üstü · insan başı. */
const YUKSEKLIK: [string, number][] = [['zemin 0,25', 0.25], ['tezgâh 0,90', COUNTER_TOP_Y], ['baş 1,60', 1.6]];

yaz('ZEMİN ŞERİTLERİNİN GÖRÜNÜRLÜĞÜ — (a) hiç görünen nokta oranı  (b) ortalama duruş oranı');
yaz('  şerit'.padEnd(20) + 'z aralığı'.padEnd(20) + YUKSEKLIK.map(([a]) => a.padStart(16)).join(''));
const seritSonuc: Record<string, number[]> = {};
for (const s of SERIT) {
  const satirA: string[] = [];
  const oranlar: number[] = [];
  for (const [, y] of YUKSEKLIK) {
    let hic = 0;
    let toplam = 0;
    let ortToplam = 0;
    for (let x = ODA.x0 + ADIM_GOR / 2; x < ODA.x1; x += ADIM_GOR)
      for (let z = s.z0 + ADIM_GOR / 2; z < s.z1; z += ADIM_GOR) {
        toplam++;
        const g = gorunurluk([x, y, z]);
        if (g.hic) hic++;
        ortToplam += g.oran;
      }
    satirA.push(`${yz(hic / toplam)}/${yz(ortToplam / toplam)}`.padStart(16));
    oranlar.push(hic / toplam);
  }
  seritSonuc[s.ad] = oranlar;
  yaz('  ' + s.ad.padEnd(18) + `${s.z0.toFixed(1)} … ${s.z1.toFixed(1)}`.padEnd(20) + satirA.join(''));
}
yaz();
yaz('  OKUMA: (a) o şeritte HİÇ görünen nokta oranı — %0 ise oraya konan şey hiçbir duruştan görülmez.');
yaz('         (b) ortalama duruş oranı — nokta kaç duruşta görünüyor; "ara sıra" ile "hep" farkı.');
yaz();

/** Her ÜNİTENİN kendisi görünüyor mu — tek tek, ünitenin ÜST yüzü örnek alınır. */
yaz('ÜNİTE ÜNİTE — hangisi ekranda var? (ünitenin üst-ön köşesi örneklenir; kendi kutusu hariç)');
yaz('  ünite'.padEnd(42) + 'x'.padStart(8) + 'z'.padStart(8) + 'üst y'.padStart(8) + '  hiç görünür?   duruş oranı');
let gorunmeyenUnite = 0;
for (let i = 0; i < KITCHEN_UNITS.length; i++) {
  const u = KITCHEN_UNITS[i];
  const b = unitBox(u);
  const kendi = UNITE_KUTU[i];
  const P = [(b.minX + b.maxX) / 2, b.maxY - 0.02, b.maxZ - 0.02];
  const { hic, oran } = gorunurluk(P, kendi);
  if (!hic) gorunmeyenUnite++;
  yaz('  ' + `${u.key} (${u.kat})`.padEnd(40) + n2(u.x) + n2(u.z) + n2(b.maxY) + '   ' + (hic ? 'EVET' : ' HAYIR').padEnd(8) + '   ' + yz(oran));
}
yaz();
yaz(`  hiçbir duruştan GÖRÜNMEYEN ünite: ${gorunmeyenUnite} / ${KITCHEN_UNITS.length}`);
yaz();

// =============================================================================================
// §E — ERİŞİM: mutfağa girilebilen bir açıklık var mı?
// =============================================================================================
cizgi();
yaz('§E — ERİŞİM: oyuncu mutfağa girebiliyor mu?');
cizgi();
yaz();
yaz('E-1 KELEPÇE TARAMASI — oda zemininin kaç noktası oyuncunun ERİŞEBİLDİĞİ bir nokta?');
let erisilen = 0;
let odaHucre = 0;
for (let x = ODA.x0 + ADIM / 2; x < ODA.x1; x += ADIM)
  for (let z = ODA.z0 + ADIM / 2; z < ODA.z1; z += ADIM) {
    odaHucre++;
    const [cx, cz] = clampToOpenAreas(x, z, 3);
    if (Math.abs(cx - x) < 1e-9 && Math.abs(cz - z) < 1e-9) erisilen++;
  }
yaz(`  oda hücresi ${odaHucre} · kelepçenin GEÇİRDİĞİ hücre ${erisilen}  → erişim ${yz(erisilen / odaHucre)}`);
yaz(`  (kelepçe: layout.clampToOpenAreas · 3 alan açık · AREA_RECTS[2] = z ${n2(BAND.front)} … ${n2(0)})`);
yaz();

const enYakinDurus = BAND.front;
yaz('E-2 MESAFE — oyuncunun durabildiği en arka çizgi ile odanın parçaları arasında kaç birim var?');
yaz(`  oyuncunun en arka z       ${n2(enYakinDurus)}`);
yaz(`  odanın ön sınırı (dekor)  ${n2(FRONT_Z)}   → aradaki fark ${n2(enYakinDurus - FRONT_Z)} br`);
yaz(`  odanın fayans önü         ${n2(ODA.z1)}   → aradaki fark ${n2(enYakinDurus - ODA.z1)} br`);
yaz(`  arka duvarın iç yüzü      ${n2(BACK_Z)}   → aradaki fark ${n2(enYakinDurus - BACK_Z)} br`);
yaz(`  oyuncu yarıçapı ${PLAYER_RADIUS} · geçiş için gereken açıklık ${(PLAYER_RADIUS * 2).toFixed(2)} br`);
yaz();

yaz('E-3 ÖN HATTIN BOŞLUKLARI — collision gövdeleri arasında yürünebilir bir aralık var mı?');
const hatX = ON_HAT.map((k) => ({ ad: k === ON_HAT[0] ? 'çay tezgâhı' : k === ON_HAT[1] ? 'garson istasyonu' : 'bulaşık', x0: k.x - k.w / 2, x1: k.x + k.w / 2 }))
  .sort((a, b) => a.x0 - b.x0);
yaz('  gövde'.padEnd(22) + 'x aralığı');
for (const g of hatX) yaz('  ' + g.ad.padEnd(20) + `${n2(g.x0)} … ${n2(g.x1)}`);
yaz();
yaz('  boşluklar (soldan sağa):');
let engenisBosluk = 0;
let solUc = ODA.x0;
const bosluklar: { x0: number; x1: number; w: number }[] = [];
for (const g of hatX) {
  const w = g.x0 - solUc;
  if (w > 0.01) bosluklar.push({ x0: solUc, x1: g.x0, w });
  solUc = Math.max(solUc, g.x1);
}
if (ODA.x1 - solUc > 0.01) bosluklar.push({ x0: solUc, x1: ODA.x1, w: ODA.x1 - solUc });
for (const b of bosluklar) {
  engenisBosluk = Math.max(engenisBosluk, b.w);
  yaz(`    x ${n2(b.x0)} … ${n2(b.x1)}   genişlik ${n2(b.w)} br   ${b.w >= PLAYER_RADIUS * 2 ? 'GEÇER' : 'geçmez'}`);
}
yaz();
yaz(`  en geniş boşluk ${n2(engenisBosluk)} br — ama KELEPÇE bunların hepsini kapatıyor (E-1).`);
yaz('  YANİ: mutfağın kapalılığı bir DUVAR değil, `clampToOpenAreas` kelepçesidir.');
yaz();

/**
 * E-3b — UYGULAMADAN SONRA (S20 · E2 · D-118). Bölmeler eklendikten sonra ön yüzde geçişe
 * yeten aralık kalmamalı. Bu blok kararın ÖNCESİNDE yoktu; final koşunun kanıtı budur.
 */
yaz('E-3b UYGULAMADAN SONRA — sınır bölmeleri eklendi, geriye ne kaldı?');
const bolmeler = sinirBolmeleri(3);
yaz(`  üretilen bölme: ${bolmeler.length}`);
for (const b of bolmeler)
  yaz(`    ${b.uc.padEnd(5)} x ${n2(b.x - b.w / 2)} … ${n2(b.x + b.w / 2)}   en ${n2(b.w)} br · z ${n2(b.z)} · derinlik ${n2(b.d)}`);
const kalanAciklik = (() => {
  const govdeler = [
    ...hatX.map((g) => ({ x0: g.x0, x1: g.x1 })),
    ...bolmeler.map((b) => ({ x0: b.x - b.w / 2, x1: b.x + b.w / 2 })),
  ].sort((a, b) => a.x0 - b.x0);
  const out: number[] = [];
  let uc = ODA.x0;
  for (const g of govdeler) {
    if (g.x0 - uc >= PLAYER_RADIUS * 2) out.push(g.x0 - uc);
    uc = Math.max(uc, g.x1);
  }
  if (ODA.x1 - uc >= PLAYER_RADIUS * 2) out.push(ODA.x1 - uc);
  return out;
})();
yaz(`  geriye kalan GEÇİŞE YETEN açıklık: ${kalanAciklik.length === 0 ? 'YOK' : kalanAciklik.map((w) => w.toFixed(2)).join(', ')}`);
yaz('  (dar dikişler bilerek açık: 0,20 br < 0,94 — kapatmak üç tezgâhı tek kütleye çevirirdi)');
yaz();

/** E1 kolunun bedeli: `BAND.front` kaç yerden okunuyor? (tahmin değil, sayım.) */
function kaynakDosyalari(kok: string): string[] {
  const out: string[] = [];
  const gez = (d: string) => {
    for (const ad of readdirSync(d)) {
      const p = join(d, ad);
      if (statSync(p).isDirectory()) gez(p);
      else if (/\.(ts|tsx)$/.test(ad)) out.push(p);
    }
  };
  gez(kok);
  return out;
}
const dosyalar = [...kaynakDosyalari('src'), ...kaynakDosyalari('tests')];
let bandFrontOkuma = 0;
const bandFrontDosya: string[] = [];
for (const f of dosyalar) {
  const n = (readFileSync(f, 'utf8').match(/BAND\.front/g) ?? []).length;
  if (n > 0) {
    bandFrontOkuma += n;
    bandFrontDosya.push(`${f.replace(/\\/g, '/')} (${n})`);
  }
}
yaz('E-4 E1 KOLUNUN BEDELİ — `BAND.front` kaç yerden okunuyor? (E1 seçilirse dokunulacak yüzey)');
yaz(`  toplam ${bandFrontOkuma} okuma · ${bandFrontDosya.length} dosya:`);
for (const d of bandFrontDosya) yaz('    ' + d);
yaz();

// =============================================================================================
// §Ç — ÇAYCI: ne yapıyor gibi duruyor?
// =============================================================================================
cizgi();
yaz('§Ç — ÇAYCI (Scene.KitchenHand): yolu · görünürlüğü · mekaniğe bağlılığı');
cizgi();
yaz();
const W = SP.staffWalk;
const yolBoy = Math.hypot(W.b[0] - W.a[0], W.b[2] - W.a[2]);
yaz(`  yol   a [${n2(W.a[0])},${n2(W.a[2])}]  →  b [${n2(W.b[0])},${n2(W.b[2])}]   uzunluk ${n2(yolBoy)} br`);
yaz(`  yolun z'si            ${n2(W.a[2])}`);
yaz(`  odanın z derinliği    ${n2(odaBoy)} br → yol TEK bir z hattında (derinlik kullanımı 0)`);
yaz(`  odanın x eni          ${n2(odaEn)} br → yol enin ${yz(yolBoy / odaEn)}'ini geziyor`);
yaz(`  arka duvara uzaklık   ${n2(W.a[2] - BACK_Z)} br`);
yaz(`  ön hat tezgâhına      ${n2(Math.abs(W.a[2] - SP.station[2]))} br`);
yaz(`  iş yaparken baktığı yön (face) ${W.face.toFixed(3)} rad`);
yaz();
yaz('Ç-1 YOLUN GÖRÜNÜRLÜĞÜ — çaycı yürürken ekranda kaç duruştan görülüyor?');
yaz('  t'.padEnd(8) + 'x'.padStart(9) + 'z'.padStart(9) + YUKSEKLIK.map(([a]) => a.padStart(16)).join(''));
const yolGorunur: number[] = [];
for (let i = 0; i <= 10; i++) {
  const t = i / 10;
  const x = W.a[0] + t * (W.b[0] - W.a[0]);
  const z = W.a[2] + t * (W.b[2] - W.a[2]);
  const hucre = YUKSEKLIK.map(([, y]) => {
    const g = gorunurluk([x, y, z]);
    return `${g.hic ? 'E' : 'H'} ${yz(g.oran)}`.padStart(16);
  });
  yolGorunur.push(gorunurOran([x, 1.6, z]));
  yaz(`  ${t.toFixed(1)}`.padEnd(8) + n2(x) + n2(z) + hucre.join(''));
}
const yolOrt = yolGorunur.reduce((a, b) => a + b, 0) / yolGorunur.length;
yaz();
yaz(`  çaycının BAŞI (1,60) ortalama ${yz(yolOrt)} duruşta görünür · gövdesi ${ACTOR_HEIGHT} br boyunda`);
yaz();
yaz('Ç-2 MEKANİĞE BAĞLILIK — kaynaktan sayım (Scene.KitchenHand):');
const sceneSrc = readFileSync('src/components/three/Scene.tsx', 'utf8');
const khBas = sceneSrc.indexOf('function KitchenHand');
const khSon = sceneSrc.indexOf('function KitchenStaff');
const kh = sceneSrc.slice(khBas, khSon);
const storeOkuma = (kh.match(/useGame\(/g) ?? []).length;
const voidEdilen = (kh.match(/void\s+\w+;/g) ?? []).length;
yaz(`  useGame() okuması           ${storeOkuma}  (areasOpen + çay bekleyen sayısı)`);
yaz(`  kullanılmadan void edilen   ${voidEdilen}  (service parametresi)`);
const kitchenHandYazma = (kh.match(/setState|\.set\(|dispatch|push\(|splice\(/g) ?? []).length;
yaz(`  sipariş/servis/kuyruk okuması  ${(kh.match(/orders|queue|tables|wallet|serve/gi) ?? []).length}`);
yaz(`  duruma YAZMA                ${kitchenHandYazma}  (0 olmalı — D-023: mekaniğe dokunmaz)`);
yaz(`  klip                        yüke bağlı: ${cayciHali(0)} (yük yok) / ${cayciHali(1)} (yük var)`);
yaz(`  yol denklemi                faz biriktirilir; temel hız ${CAYCI_TEMPO.temelHiz}`);
yaz();
yaz('Ç-3 UYGULAMADAN SONRA (S20 · Ç1 · D-118) — tempo salonun yükünden geliyor mu?');
yaz('  çay bekleyen'.padEnd(16) + 'hız çarpanı'.padStart(14) + '   klip');
for (const n of [0, 1, 2, 3, CAYCI_TEMPO.doyum, CAYCI_TEMPO.doyum + 3]) {
  yaz('  ' + String(n).padEnd(14) + cayciHizCarpani(n).toFixed(2).padStart(14) + '   ' + cayciHali(n) +
      (n === 0 ? '   << yük yok: faz donar, çaycı tezgâha dönüp dinlenir' : ''));
}
yaz();
yaz(`  boş ↔ dolu farkı: ${cayciHizCarpani(CAYCI_TEMPO.doyum).toFixed(2)} / ${cayciHizCarpani(1).toFixed(2)} = ` +
    `${(cayciHizCarpani(CAYCI_TEMPO.doyum) / cayciHizCarpani(1)).toFixed(2)}x · mekaniğe dokunmaz (salt görsel)`);
yaz();

// =============================================================================================
// §D — DOLULUK: oda içi ne kadar dolu?
// =============================================================================================
cizgi();
yaz('§D — DOLULUK: odanın zemini ne kadar dolu, boşluk NEREDE?');
cizgi();
yaz();

/** Zemin ızgarası: hücre bir ünitenin ayak iziyle kesişiyor mu? (üst üste binme sayılmaz) */
const nx = Math.max(1, Math.round(odaEn / ADIM));
const nz = Math.max(1, Math.round(odaBoy / ADIM));
const dx = odaEn / nx;
const dz = odaBoy / nz;
/** dolu[i][k] — i: x indeksi, k: z indeksi */
const dolu: boolean[][] = Array.from({ length: nx }, () => new Array<boolean>(nz).fill(false));
/**
 * ZEMİNİ KAPATAN GÖVDELER = mutfağın kendi üniteleri + ÖN HATTIN ÜÇ GÖVDESİ.
 * Ön hat unutulursa (kısa koşu yakaladı) "en büyük boş dikdörtgen" tezgâhın işgal ettiği
 * şeridi de boş sayar — fayansın ön kenarı (z ${FAYANS.z1}) gövdelerin içinden geçiyor.
 */
const zeminKutu = [
  ...KITCHEN_UNITS.map((u) => unitBox(u)).filter((b) => b.minY < 1.2), // duvar ünitesi zemini kapatmaz
  ...ON_HAT.map((k) => ({ minX: k.x - k.w / 2, maxX: k.x + k.w / 2, minZ: k.z - k.d / 2, maxZ: k.z + k.d / 2, minY: 0, maxY: k.h })),
];
for (let i = 0; i < nx; i++) {
  const cx = ODA.x0 + dx * (i + 0.5);
  for (let k = 0; k < nz; k++) {
    const cz = ODA.z0 + dz * (k + 0.5);
    dolu[i][k] = zeminKutu.some((b) => cx >= b.minX && cx <= b.maxX && cz >= b.minZ && cz <= b.maxZ);
  }
}
let doluHucre = 0;
for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) if (dolu[i][k]) doluHucre++;
const hucreAlan = dx * dz;
yaz(`  ızgara ${nx} × ${nz} (hücre ${dx.toFixed(3)} × ${dz.toFixed(3)} br)`);
yaz(`  DOLU  ${doluHucre} hücre = ${(doluHucre * hucreAlan).toFixed(2)} br²   → odanın ${yz(doluHucre / (nx * nz))}'i`);
yaz(`  BOŞ   ${nx * nz - doluHucre} hücre = ${((nx * nz - doluHucre) * hucreAlan).toFixed(2)} br²`);
yaz(`  (${zeminKutu.length} gövde sayıldı = mutfak ünitesi + ön hattın 3 tezgâhı; duvar üniteleri zemini kapatmaz)`);
yaz();

yaz('D-1 BOŞLUK NEREDE? — z şeritlerine göre doluluk');
yaz('  şerit'.padEnd(20) + 'z aralığı'.padEnd(18) + 'dolu'.padStart(10) + 'boş br²'.padStart(12) + '   GÖRÜNÜR(baş)');
for (const s of SERIT) {
  let d = 0;
  let t = 0;
  for (let i = 0; i < nx; i++)
    for (let k = 0; k < nz; k++) {
      const cz = ODA.z0 + dz * (k + 0.5);
      if (cz < s.z0 || cz >= s.z1) continue;
      t++;
      if (dolu[i][k]) d++;
    }
  const gor = seritSonuc[s.ad]?.[2] ?? 0;
  yaz('  ' + s.ad.padEnd(18) + `${s.z0.toFixed(1)} … ${s.z1.toFixed(1)}`.padEnd(18) + yz(t ? d / t : 0).padStart(10) +
      ((t - d) * hucreAlan).toFixed(2).padStart(12) + '   ' + yz(gor));
}
yaz();

/** En büyük BOŞ dikdörtgen (histogram yöntemi) — "ortası boş" lafını sayıya çevirir. */
function enBuyukBosDikdortgen(): { alan: number; x0: number; x1: number; z0: number; z1: number } {
  let best = { alan: 0, x0: 0, x1: 0, z0: 0, z1: 0 };
  const h = new Array<number>(nz).fill(0);
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz; k++) h[k] = dolu[i][k] ? 0 : h[k] + 1;
    // her satır için histogramın en büyük dikdörtgeni
    const yigin: number[] = [];
    for (let k = 0; k <= nz; k++) {
      const cur = k === nz ? 0 : h[k];
      while (yigin.length && h[yigin[yigin.length - 1]] >= cur) {
        const y = yigin.pop() as number;
        const sol = yigin.length ? yigin[yigin.length - 1] + 1 : 0;
        const genislikX = h[y] * dx;
        const genislikZ = (k - sol) * dz;
        const alan = genislikX * genislikZ;
        if (alan > best.alan) {
          best = {
            alan,
            x0: ODA.x0 + dx * (i + 1 - h[y]),
            x1: ODA.x0 + dx * (i + 1),
            z0: ODA.z0 + dz * sol,
            z1: ODA.z0 + dz * k,
          };
        }
      }
      yigin.push(k);
    }
  }
  return best;
}
const bos = enBuyukBosDikdortgen();
yaz('D-2 EN BÜYÜK BOŞ DİKDÖRTGEN — "odanın ortası boş" lafının sayısı');
yaz(`  x ${n2(bos.x0)} … ${n2(bos.x1)}   z ${n2(bos.z0)} … ${n2(bos.z1)}`);
yaz(`  ölçü ${(bos.x1 - bos.x0).toFixed(2)} × ${(bos.z1 - bos.z0).toFixed(2)} br = ${bos.alan.toFixed(2)} br²  → odanın ${yz(bos.alan / odaAlan)}'i`);
const bosOrta = [(bos.x0 + bos.x1) / 2, 1.0, (bos.z0 + bos.z1) / 2];
yaz(`  bu boşluğun ORTASI (${n2(bosOrta[0])}, ${n2(bosOrta[2])}) · 1,00 br yükseklikte ${yz(gorunurOran(bosOrta))} duruştan görünür · hiç görünür mü: ${hicGorunurMu(bosOrta) ? 'EVET' : 'HAYIR'}`);
yaz();

yaz('D-3 KARŞILAŞTIRMA — aynı ölçüm WC odası için yapılmıştı (S7); mutfak ne durumda?');
yaz(`  mutfak zemin alanı ${odaAlan.toFixed(2)} br² · dolu ${yz(doluHucre / (nx * nz))} · en büyük boşluk ${bos.alan.toFixed(2)} br²`);
yaz('  (WC odasının "ORTASI boş" kalemi activeContext AÇIK KALEMLER listesinde duruyor — aynı kusur.)');
yaz();

// =============================================================================================
// §K — KADEME: mutfak seviyeyle BÜYÜYOR mu?
// =============================================================================================
//
// Kullanıcının kuralı (feedback "önce ilerleme adımlarını tasarla"): mutfak gibi objeler küçük
// doğup YERİNDE büyür — modüler olmak varyant değil KADEME demektir. Bu bölüm o kuralın bugün
// kodda karşılığı olup olmadığını sayar; §D'nin (doluluk) hangi kolunun anlamlı olduğunu bu belirler.
cizgi();
yaz('§K — KADEME: mutfak seviyeyle büyüyor mu?');
cizgi();
yaz();
const kitchenSrc = readFileSync('src/components/three/Kitchen.tsx', 'utf8');
const kitchenUseGame = (kitchenSrc.match(/useGame\(/g) ?? []).length;
const kitchenSeviyeOkuma = (kitchenSrc.match(/stationLevels?|tableLevels?/g) ?? []).length;
/** `KitchenUnit` arayüzünde bir seviye/kademe alanı var mı? (regex değil dilim — kaçış tuzağı yok) */
const kitchenLookSrc = readFileSync('src/components/three/kitchenLook.ts', 'utf8');
const arayuzSatirlari: string[] = [];
let arayuzIcinde = false;
for (const satir of kitchenLookSrc.split('\n')) {
  if (satir.startsWith('export interface KitchenUnit')) arayuzIcinde = true;
  else if (arayuzIcinde && satir.startsWith('}')) break;
  else if (arayuzIcinde) arayuzSatirlari.push(satir);
}
const unitSeviyeAlani = (arayuzSatirlari.join('\n').match(/level|seviye|kademe/gi) ?? []).length;
/** Seviyeyle GERÇEKTEN değişen bileşenler — karşılaştırma tarafı. */
let seviyeOkuyanDosya = 0;
for (const f of kaynakDosyalari('src')) {
  if (/stationLevels|tableLevels/.test(readFileSync(f, 'utf8'))) seviyeOkuyanDosya++;
}
/** Servis noktasının kaç kademesi var? (görev hedeflerinden okunur, elle yazılmaz) */
const ekoSrc = readFileSync('src/config/economy.config.ts', 'utf8');
const stationSeviyeleri = [...ekoSrc.matchAll(/type: 'stationLevel'; level: (\d+)|type: 'stationLevel', level: (\d+)/g)]
  .map((m) => Number(m[1] ?? m[2]));
const enYuksekStation = stationSeviyeleri.length ? Math.max(...stationSeviyeleri) : 0;
yaz(`  servis noktasının kademesi        ${enYuksekStation} seviye (economy görev hedeflerinden)`);
yaz(`  mutfak ünitesi (KITCHEN_UNITS)    ${KITCHEN_UNITS.length} adet — SABİT liste`);
yaz(`  KitchenUnit'te seviye alanı       ${unitSeviyeAlani}`);
yaz(`  Kitchen.tsx useGame() okuması     ${kitchenUseGame}  (tek alan: kitchenTheme)`);
yaz(`  Kitchen.tsx seviye okuması        ${kitchenSeviyeOkuma}`);
yaz(`  seviye okuyan src dosyası (kıyas) ${seviyeOkuyanDosya}`);
yaz();
yaz(`  OKUMA: tezgâh ${enYuksekStation} kademe büyürken ARKASINDAKİ oda her seviyede AYNI ${KITCHEN_UNITS.length} üniteyi çiziyor.`);
yaz('  Mutfak bugün bir KADEME değil, tek seferde kurulmuş bir dekor.');
yaz();
// =============================================================================================
// DAMGALAR
// =============================================================================================
cizgi();
damga('oda kutusu tutarlı', ODA.x1 > ODA.x0 && ODA.z1 > ODA.z0, `${odaEn.toFixed(2)} × ${odaBoy.toFixed(2)}`);
damga('oda bandın İÇİNDE', ODA.z1 <= BAND.front + 1e-9, `oda ön z ${ODA.z1} · bant ön ${BAND.front}`);
damga('üniteler oda kutusunun içinde', KITCHEN_UNITS.every((u) => {
  const b = unitBox(u);
  return b.minX >= ODA.x0 - 0.35 && b.maxX <= ODA.x1 + 0.35 && b.minZ >= BAND_SHELL.back - 0.35 && b.maxZ <= ODA.z1 + 0.35;
}), 'bir ünite odanın dışına taşıyor');
damga('oyuncu odaya GİREMİYOR', erisilen === 0, `erişilen hücre ${erisilen} — 0 bekleniyordu (kelepçe)`);
damga('görünürlük süzgeci çalışıyor',
  !hicGorunurMu([SP.station[0], 0.2, SP.station[2] - 0.6]),
  'tezgâhın hemen ARKASINDAKİ alçak nokta görünür çıktı — örtme ölçümü çalışmıyor demektir');
damga('kadraj süzgeci çalışıyor',
  !kadrajda(0, FLOOR_HALF - 1, [0, 1, FLOOR_HALF + 5], CAMERA_DIST),
  'kameranın ARKASINDAKİ nokta kadrajda çıktı');
damga('çaycının yolu odanın içinde', W.a[2] < FRONT_Z && W.a[2] > BACK_Z, `yol z ${W.a[2]} · oda z ${BACK_Z}…${FRONT_Z}`);
/**
 * D-023 DEĞİŞMEZİ, Ç1'den SONRAKİ HÂLİYLE. Taban koşusunda bu damga "useGame okuması 1" diyordu
 * ve Ç1 onu kırdı — doğru davrandı. Korunan kural sayı değil KURAL: çaycı oyunun durumunu
 * OKUYABİLİR, ama hiçbir şeyini YAZAMAZ. Salt görsel olmak budur.
 */
damga('çaycı hâlâ SALT GÖRSEL (okur, yazmaz)',
  storeOkuma === 2 && kitchenHandYazma === 0 && voidEdilen === 1,
  `useGame okuması ${storeOkuma} · yazma ${kitchenHandYazma} · void ${voidEdilen}`);
damga('E2 — geçişe yeten açıklık KALMADI', kalanAciklik.length === 0,
  `kalan: ${kalanAciklik.map((w) => w.toFixed(2)).join(', ')} — bölmeler açıklığı kapatmıyor demektir`);
damga('E2 — dar dikişler açık bırakıldı', bolmeler.length === 2, `bölme sayısı ${bolmeler.length}, 2 bekleniyordu`);
damga('Ç1 — yük yokken çaycı duruyor', cayciHizCarpani(0) === 0 && cayciHali(0) === 'dur');
damga('Ç1 — dolu salon boştan hızlı', cayciHizCarpani(CAYCI_TEMPO.doyum) > cayciHizCarpani(1),
  `${cayciHizCarpani(CAYCI_TEMPO.doyum)} vs ${cayciHizCarpani(1)}`);
damga('boş dikdörtgen bulundu', bos.alan > 0, `${bos.alan.toFixed(2)} br²`);
damga('BAND.front okumaları sayıldı', bandFrontOkuma > 0, `${bandFrontOkuma} okuma`);
damga('mutfak seviyeden BAĞIMSIZ', kitchenSeviyeOkuma === 0 && unitSeviyeAlani === 0,
  `Kitchen.tsx seviye okuması ${kitchenSeviyeOkuma} · KitchenUnit seviye alanı ${unitSeviyeAlani} — biri sıfırdan büyükse mutfak artık kademeli demektir`);
damga('servis kademesi okundu', enYuksekStation >= 4, `en yüksek stationLevel hedefi ${enYuksekStation}`);
damga('çıktı üretildi', cikti.length > 80, `${cikti.length} satır`);

yaz();
cizgi();
yaz("BİTTİ — bu dosyada KARAR YOK. Kollar `docs/mutfak-raporu-s20.md` §Bulgular'da.");
cizgi();
damgaOzeti();
