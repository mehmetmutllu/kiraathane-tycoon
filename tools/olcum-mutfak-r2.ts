/**
 * olcum-mutfak-r2.ts — R2 ÖLÇÜM: mutfak yerleşimi + çarpışma sayıya çevrilir (G-35…G-38).
 *
 * NE SORUYOR. Kullanıcı dört şikâyet bıraktı:
 *   G-35 *"sol duvara paralel olması gerekirken tam 90 derece açıyla duruyor"*
 *   G-36 *"biz tezgahın vs içinden geçiyoruz öyle olmamalı"*
 *   G-37 *"başlangıçta tezgahlar da bitişik olsun"*
 *   G-38 *"tezgah yükseltmeleri de nasıl oluyor bilmiyorum bunları tamamla"*
 * "90 derece" bir his değil bir SAYIDIR ve ölçülebilir: çizilen gövdenin dünya ayak izi ile
 * çarpışma kutusunun ayak izi ne kadar örtüşüyor, eksenler takas olmuş mu. "İçinden geçiyoruz"
 * da öyle: çizilen gövdenin içinde oyuncunun DURABİLDİĞİ ve oraya YÜRÜYEREK varabildiği kaç br².
 *
 * TAKLİT YOK — ÇALIŞAN KODDAN OKUR. Gövde ölçüsü `kitchenLook.onHatGovdeleri`in kendisinden,
 * kutular `layout.activeSolids`ten, durulabilirlik `layout.hitsSolid` + `clampToOpenAreas`tan,
 * seviye kimliği `world.isCounter`/`sellsTost`tan gelir. İkinci bir geometri yazılmaz.
 * Tek istisna `ServicePoint.tsx`in İÇİNDE yazılı görsel sabitlerdir (gövde yüksekliği formülü,
 * semaver rengi dizisi, kapak rengi dizisi): onlar dışarı verilmiyor, araç KAYNAKTAN regex ile
 * okur ve damgalar. Desen değişip damga kırılırsa bu çıktı ölçüm sayılmaz.
 *
 * ERİŞİLEBİLİRLİK GERÇEK (H1'in dersi): "durulabilir hücre" yetmez, hücreye oyuncunun
 * BAŞLANGIÇ noktasından yürünerek varılabilmesi de gerekir. Kat dar açıklıklarla dolu; "boş
 * görünen ama girilemeyen cep" bu katta kuraldır. O yüzden önce `LAYOUT.player`dan taşma-doldurma
 * yapılır, sonra yalnız BAĞLI bileşenin hücreleri sayılır. Aksi hâlde araç, oyuncunun hiç
 * gidemeyeceği bir cebi "içinden geçiliyor" diye sayardı.
 *
 * ALTI KOL (hiçbiri uygulanmaz; hepsi ölçülür — varyant kapısı, D-084):
 *   T   taban       — bugünkü hâl, İKİ DÖNEM birden (sol duvar: areasOpen 1-2 · arka bant: 3+)
 *   A1  çizim döner — gövde ölçüsü dönüşten SONRAKİ eksene göre türer (kutu el değmez)
 *   A2  kutu döner  — collision gövdenin bugün çizildiği yere döndürülür (çizim el değmez)
 *   B1  erken birleşme — `onHat` sol duvar döneminde de koşar (bugün bilerek koşmuyor)
 *   B2  bulaşık yanaşır — bulaşığın KOORDİNATI tezgâha yaklaşır (erişim/tempo bedeli ölçülür)
 *   C1  seviye sinyali — L0→L6 arası gözle değişen kaç bağımsız işaret var (G-38)
 *
 * A1 ve A2 aynı kusurun iki zıt cevabıdır ve ikisi de ölçülür: biri çizimi kutuya, diğeri kutuyu
 * çizime uydurur. A2 bedava değildir — kutu dönünce salondan yürünebilir alan gider ve tezgâhın
 * kendi erişim noktaları (çay alma, yükseltme) kutunun içine düşebilir. O bedel sayılır.
 *
 * KOŞU KİPİ (D-084): `OLCUM=tam` → ızgara 0,02 br · tüm dönemler · tüm seviyeler.
 * Kısa koşu → ızgara 0,08 br · iki dönem · aynı kollar. Rapora yalnız tam koşu girer.
 *
 * Çalıştır:
 *   OLCUM=tam npx tsx tools/olcum-mutfak-r2.ts > docs/olcum-mutfak-r2.txt
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FLOOR_HALF,
  LAYOUT,
  WAITER_STATION,
  activeSolids,
  clampToOpenAreas,
  hitsSolid,
  servicePlace,
  waiterStationOpen,
  type ServicePlace,
  type Solid,
} from '../src/game/layout.ts';
import {
  GECIS_ESIGI,
  SERVIS_ISARETLERI,
  eksenTakasi,
  onHat,
  onHatGovdeleri,
  servisIsaretleri,
  type OnHatGovde,
} from '../src/components/three/kitchenLook.ts';
import { PLAYER_RADIUS } from '../src/config/actor.ts';
import { MAX_AREAS, isCounter, sellsTost } from '../src/game/world.ts';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { KIP, KISA, damga, damgaOzeti, kipBandi } from './olcum-lib.ts';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Izgara adımı (br) — hem taşma-doldurma hem alan sayımı bunu kullanır. */
const HUCRE = KISA ? 0.08 : 0.02;

const f2 = (x: number) => x.toFixed(2).replace('.', ',');
const yuzde = (a: number, b: number) => (b === 0 ? '—' : `%${((100 * a) / b).toFixed(1)}`);

// =============================================================================================
//  ORTAK GEOMETRİ
// =============================================================================================

interface Kutu {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const kutuEn = (k: Kutu) => k.maxX - k.minX;
const kutuBoy = (k: Kutu) => k.maxZ - k.minZ;
const kutuAlan = (k: Kutu) => kutuEn(k) * kutuBoy(k);
const kutuMerkez = (k: Kutu): [number, number] => [(k.minX + k.maxX) / 2, (k.minZ + k.maxZ) / 2];

function kesisim(a: Kutu, b: Kutu): number {
  const w = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const d = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  return w <= 0 || d <= 0 ? 0 : w * d;
}

/** IoU — 1,00 tam örtüşme, 0 hiç örtüşmeme. */
function iou(a: Kutu, b: Kutu): number {
  const k = kesisim(a, b);
  return k / (kutuAlan(a) + kutuAlan(b) - k);
}

const solidKutu = (s: Solid): Kutu => ({
  minX: s.c[0] - s.h[0],
  maxX: s.c[0] + s.h[0],
  minZ: s.c[2] - s.h[1],
  maxZ: s.c[2] + s.h[1],
});

/**
 * ÇİZİLEN gövdenin DÜNYA ayak izi.
 *
 * Gövde yerel eksende `w` (x) × `d` (z) ve merkezi `dx` kadar yerel x'te kaymıştır; çağıran onu
 * `rot` ile DÖNMÜŞ bir grubun içine koyar (`Scene.Stations` · `DishSink`). Yani `rot = ±π/2`
 * olduğunda yerel x dünya z'ye, yerel z dünya x'e gider. Oyunun yaptığı dönüşüm birebir budur.
 */
function cizimKutusu(merkez: readonly [number, number, number], rot: number, g: OnHatGovde): Kutu {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  // Yerel (dx, 0) → dünya. three.js Y dönüşü: x' = x·cos + z·sin · z' = −x·sin + z·cos
  const ox = g.dx * c;
  const oz = -g.dx * s;
  // Eksene hizalı kutu: yerel yarı-boyutlar dönüşle takas olur (rot yalnız 0 / ±π/2 kullanılıyor).
  const hx = Math.abs(c) * (g.w / 2) + Math.abs(s) * (g.d / 2);
  const hz = Math.abs(s) * (g.w / 2) + Math.abs(c) * (g.d / 2);
  return {
    minX: merkez[0] + ox - hx,
    maxX: merkez[0] + ox + hx,
    minZ: merkez[2] + oz - hz,
    maxZ: merkez[2] + oz + hz,
  };
}

/**
 * Çizilen gövdenin ODANIN DIŞINA taşan kısmı (br²) — açık alanların birleşimine göre.
 * Duvarın içine giren tezgâh "90 derece" kusurunun ikinci yüzüdür: gövde uzun ekseni yanlış
 * yöne uzayınca kendi duvarını deler. Ölçüt oyunun kendi kelepçesidir (`clampToOpenAreas`).
 */
function odaDisi(c: Kutu, areasOpen: number, adim = 0.02): { alan: number; enFazla: number } {
  let alan = 0;
  let enFazla = 0;
  for (let x = c.minX + adim / 2; x < c.maxX; x += adim)
    for (let z = c.minZ + adim / 2; z < c.maxZ; z += adim) {
      const [cx, cz] = clampToOpenAreas(x, z, areasOpen);
      const d = Math.hypot(cx - x, cz - z);
      if (d > 1e-9) {
        alan += adim * adim;
        enFazla = Math.max(enFazla, d);
      }
    }
  return { alan, enFazla };
}

// `eksenTakasi` KAYNAKTAN gelir (kitchenLook) — araç ikinci bir tanım yazsaydı, düzeltme
// uygulandığında araç eski tanımla ölçmeye devam edebilirdi.

// =============================================================================================
//  DÖNEMLER VE GÖVDELER
// =============================================================================================

/** Ölçülen dönemler: sol duvar (areasOpen 1-2) ve arka bant (3+). */
const DONEMLER = [
  { ad: 'SOL DUVAR', areasOpen: 2, tables: 6 },
  { ad: 'ARKA BANT', areasOpen: MAX_AREAS, tables: 14 },
] as const;

type GovdeAd = 'tezgah' | 'garson' | 'bulasik';

interface GovdeKaydi {
  ad: GovdeAd;
  /** Çarpışma kutusunun merkezi + dönüşü. */
  merkez: readonly [number, number, number];
  rot: number;
  half: readonly [number, number];
  /** `onHatGovdeleri`in verdiği ÇİZİM ölçüsü (yerel eksende). */
  govde: OnHatGovde;
}

function govdeler(areasOpen: number): GovdeKaydi[] {
  const p: ServicePlace = servicePlace(areasOpen);
  const g = onHatGovdeleri(areasOpen);
  const out: GovdeKaydi[] = [
    { ad: 'tezgah', merkez: p.station, rot: p.rot, half: p.half, govde: g.station },
    { ad: 'bulasik', merkez: p.dish, rot: p.dishRot, half: p.dishHalf, govde: g.dish },
  ];
  if (waiterStationOpen(areasOpen))
    out.push({ ad: 'garson', merkez: WAITER_STATION.pos, rot: WAITER_STATION.rot, half: WAITER_STATION.half, govde: g.waiter });
  return out;
}

/**
 * TAKAS KOLU — **düzeltme geri alınırsa** ne olur.
 *
 * R2 öncesinde `onHatGovdeleri` ölçüyü dünya ekseninde veriyordu ve çağıran onu yerel eksende
 * tüketiyordu; kol tam olarak o takası geri koyar. D-127 uygulandıktan sonra bu artık bir
 * "seçenek" değil **bekçinin karşılaştırma kolu**dur: taban ile bu kol aynı sayıyı verirse
 * düzeltme dünyaya dokunmamış demektir (varyant damgası bunu kontrol eder).
 */
function takasliGovde(k: GovdeKaydi): OnHatGovde {
  if (!eksenTakasi(k.rot)) return k.govde;
  return { w: k.govde.d, d: k.govde.w, dx: k.govde.dx };
}

/** Aynı takasın KUTU tarafı — elenen A2 kolunun kalıntısı, karşılaştırma için durur. */
function takasliHalf(k: GovdeKaydi): readonly [number, number] {
  return eksenTakasi(k.rot) ? [k.half[1], k.half[0]] : k.half;
}

// =============================================================================================
//  §A — ÇİZİM ↔ KUTU
// =============================================================================================

interface AKayit {
  donem: string;
  ad: GovdeAd;
  kutu: Kutu;
  cizim: Kutu;
  a1: Kutu;
  a2: Kutu;
}

function bolumA(): AKayit[] {
  console.log('');
  console.log('=============================================================================');
  console.log('§A — ÇİZİLEN GÖVDE ↔ ÇARPIŞMA KUTUSU (G-35: "tam 90 derece açıyla duruyor")');
  console.log('=============================================================================');
  console.log('');
  console.log('kutu  = layout.activeSolids (oyuncunun çarptığı şey)');
  console.log('cizim = kitchenLook.onHatGovdeleri, çağıranın uyguladığı `rot` ile (gözle görülen şey)');
  console.log('takas = dönüş eksenleri değiştiriyor mu (rot = ±π/2)');
  console.log('IoU   = 1,00 tam örtüşme · 0,00 hiç örtüşmeme');
  console.log('');
  const kayitlar: AKayit[] = [];
  for (const d of DONEMLER) {
    console.log(`--- ${d.ad} (areasOpen = ${d.areasOpen}) ---`);
    console.log('');
    console.log('gövde    | rot   takas | kutu en×boy  | çizim en×boy | IoU   | açı     | ODA DIŞI br² (takas kolu)');
    console.log('---------|-------------|--------------|--------------|-------|---------|------------------------');
    for (const k of govdeler(d.areasOpen)) {
      const kutu = solidKutu({ c: k.merkez, h: k.half });
      const cizim = cizimKutusu(k.merkez, k.rot, k.govde);
      const a1 = cizimKutusu(k.merkez, k.rot, takasliGovde(k));
      const a2 = solidKutu({ c: k.merkez, h: takasliHalf(k) });
      // Uzun eksen aynı mı: ikisinin de en/boy oranı aynı yöne mi bakıyor.
      const kUzunX = kutuEn(kutu) >= kutuBoy(kutu);
      const cUzunX = kutuEn(cizim) >= kutuBoy(cizim);
      const aci = kUzunX === cUzunX ? '0°' : '**90°**';
      /**
       * ODA DIŞI yalnız SALONUN İÇİNDE duran gövdeler için anlamlıdır. Arka bandın servis bloğu
       * tanım gereği `AREA_RECTS`in dışındadır (bant yürünmez kütle) — orada bu ölçüt "hepsi
       * dışarıda" der ve bu bir kusur değil, ölçütün yanlış yere uygulanmasıdır. Kutunun
       * MERKEZİ açık alanların dışındaysa satır ölçülmez, "—" basılır.
       */
      const [mx, mz] = kutuMerkez(kutu);
      const [kx2, kz2] = clampToOpenAreas(mx, mz, d.areasOpen);
      const salonda = Math.hypot(kx2 - mx, kz2 - mz) < 1e-9;
      const dis = salonda ? odaDisi(cizim, d.areasOpen) : null;
      const disA1 = salonda ? odaDisi(a1, d.areasOpen) : null;
      console.log(
        `${k.ad.padEnd(8)} | ${(k.rot === 0 ? '0' : 'π/2').padEnd(5)} ${(eksenTakasi(k.rot) ? 'EVET' : 'hayır').padEnd(5)} | ` +
          `${f2(kutuEn(kutu))} × ${f2(kutuBoy(kutu))}  | ${f2(kutuEn(cizim))} × ${f2(kutuBoy(cizim))}  | ` +
          `${iou(kutu, cizim).toFixed(2).replace('.', ',')}  | ${aci.padEnd(7)} | ` +
          `${dis && disA1 ? `${f2(dis.alan)} (${f2(dis.enFazla)})  → takas ${f2(disA1.alan)} (${f2(disA1.enFazla)})` : '— (bant: salon dışı, ölçüt geçersiz)'}`,
      );
      kayitlar.push({ donem: d.ad, ad: k.ad, kutu, cizim, a1, a2 });
    }
    console.log('');
  }

  console.log('--- TAKAS KOLU: DÜZELTME GERİ ALINIRSA (D-127 bekçisinin karşılaştırma kolu) ---');
  console.log('');
  console.log('dönem      gövde    | T IoU | takas çizim | takas kutu | T açı   | takas açı');
  console.log('---------------------|-------|-------------|------------|---------|----------');
  for (const r of kayitlar) {
    const ac = (a: Kutu, b: Kutu) => ((kutuEn(a) >= kutuBoy(a)) === (kutuEn(b) >= kutuBoy(b)) ? '0°' : '90°');
    console.log(
      `${r.donem.padEnd(10)} ${r.ad.padEnd(8)} | ${iou(r.kutu, r.cizim).toFixed(2).replace('.', ',')}  | ` +
        `${iou(r.kutu, r.a1).toFixed(2).replace('.', ',')}        | ${iou(r.a2, r.cizim).toFixed(2).replace('.', ',')}       | ` +
        `${ac(r.kutu, r.cizim).padEnd(7)} | ${ac(r.kutu, r.a1)}`,
    );
  }
  console.log('');
  return kayitlar;
}

// =============================================================================================
//  §B — İÇİNDEN GEÇME (G-36)
// =============================================================================================

/**
 * Oyuncunun yürüyerek varabildiği hücreler — `LAYOUT.player`dan taşma-doldurma.
 * Durulabilirlik oyunun KENDİ iki kapısıdır: açık alan kelepçesi + katı engel çarpışması.
 */
function erisilebilirKume(tables: number, areasOpen: number, solids: Solid[], alan: Kutu): Set<string> {
  const anahtar = (i: number, j: number) => `${i},${j}`;
  const i0 = Math.floor(alan.minX / HUCRE);
  const i1 = Math.ceil(alan.maxX / HUCRE);
  const j0 = Math.floor(alan.minZ / HUCRE);
  const j1 = Math.ceil(alan.maxZ / HUCRE);
  const durabilir = (i: number, j: number): boolean => {
    const x = (i + 0.5) * HUCRE;
    const z = (j + 0.5) * HUCRE;
    if (i < i0 || i > i1 || j < j0 || j > j1) return false;
    const [cx, cz] = clampToOpenAreas(x, z, areasOpen);
    if (Math.abs(cx - x) > 1e-9 || Math.abs(cz - z) > 1e-9) return false;
    return !hitsSolid(x, z, solids, PLAYER_RADIUS);
  };
  const bas: [number, number] = [
    Math.floor(LAYOUT.player[0] / HUCRE),
    Math.floor(LAYOUT.player[2] / HUCRE),
  ];
  const gorulen = new Set<string>();
  if (!durabilir(bas[0], bas[1])) {
    damga('oyuncu başlangıcı durulabilir', false, 'taşma-doldurma tohumu katı engelin içinde');
    return gorulen;
  }
  const yigin: [number, number][] = [bas];
  gorulen.add(anahtar(bas[0], bas[1]));
  while (yigin.length) {
    const [i, j] = yigin.pop()!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const ni = i + di;
      const nj = j + dj;
      const a = anahtar(ni, nj);
      if (gorulen.has(a)) continue;
      if (!durabilir(ni, nj)) continue;
      gorulen.add(a);
      yigin.push([ni, nj]);
    }
  }
  return gorulen;
}

/**
 * Bir ÇİZİM kutusu ile bir KATI kutu için iki sayı:
 *   gecilen  — çizimin içinde oyuncunun durabildiği + oraya yürüyebildiği alan (br²)
 *   gorunmez — katı olup çizilmemiş alan (br²)
 * `erisilir` taşma-doldurmanın sonucudur; hücre anahtarı ızgarayla aynıdır.
 */
function gecisSay(ciz: Kutu, kutu: Kutu, erisilir: Set<string>): { gecilen: number; gorunmez: number } {
  const hucreAlan = HUCRE * HUCRE;
  let gecilen = 0;
  let gorunmez = 0;
  const i0 = Math.floor(Math.min(ciz.minX, kutu.minX) / HUCRE);
  const i1 = Math.ceil(Math.max(ciz.maxX, kutu.maxX) / HUCRE);
  const j0 = Math.floor(Math.min(ciz.minZ, kutu.minZ) / HUCRE);
  const j1 = Math.ceil(Math.max(ciz.maxZ, kutu.maxZ) / HUCRE);
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++) {
      const x = (i + 0.5) * HUCRE;
      const z = (j + 0.5) * HUCRE;
      const icCizim = x >= ciz.minX && x <= ciz.maxX && z >= ciz.minZ && z <= ciz.maxZ;
      const icKutu = x >= kutu.minX && x <= kutu.maxX && z >= kutu.minZ && z <= kutu.maxZ;
      if (icCizim && erisilir.has(`${i},${j}`)) gecilen += hucreAlan;
      if (icKutu && !icCizim) gorunmez += hucreAlan;
    }
  return { gecilen, gorunmez };
}

/** §B'nin damgası için: dönem başına taşma-doldurmanın ulaştığı hücre sayısı. */
const ERISILEN: Record<string, number> = {};

interface BKayit {
  donem: string;
  ad: GovdeAd;
  /** Çizilen gövdenin içinde oyuncunun durabildiği ve oraya YÜRÜYEBİLDİĞİ alan (br²). */
  gecilen: number;
  /** Çizilen gövdenin ayak izi (br²). */
  cizimAlan: number;
  /** Katı olup hiçbir şey çizilmemiş alan — görünmez duvar (br²). */
  gorunmez: number;
  kutuAlanBr: number;
  /** A1 uygulanmış hâlde aynı iki sayı. */
  gecilenA1: number;
  gorunmezA1: number;
}

function bolumB(): BKayit[] {
  console.log('');
  console.log('=============================================================================');
  console.log('§B — İÇİNDEN GEÇME (G-36: "biz tezgahın vs içinden geçiyoruz")');
  console.log('=============================================================================');
  console.log('');
  console.log(`ızgara ${f2(HUCRE)} br · oyuncu yarıçapı ${f2(PLAYER_RADIUS)} · taşma-doldurma LAYOUT.player'dan`);
  console.log('gecilen  = ÇİZİLEN gövdenin içinde oyuncunun durabildiği + oraya yürüyebildiği alan');
  console.log('gorunmez = KATI olup hiçbir gövde çizilmemiş alan (görünmez duvar)');
  console.log('');
  const kayitlar: BKayit[] = [];
  for (const d of DONEMLER) {
    const solids = activeSolids(d.tables, d.areasOpen);
    const gs = govdeler(d.areasOpen);
    const erisilir = erisilebilirKume(d.tables, d.areasOpen, solids, {
      minX: -FLOOR_HALF,
      maxX: FLOOR_HALF,
      minZ: -FLOOR_HALF,
      maxZ: FLOOR_HALF,
    });
    ERISILEN[d.ad] = erisilir.size;
    console.log(`--- ${d.ad} (areasOpen = ${d.areasOpen} · ${d.tables} masa · erişilebilir ${erisilir.size} hücre) ---`);
    console.log('');
    console.log('gövde    | çizim br² | GEÇİLEN br² |   %   | GÖRÜNMEZ br² |   %   || takas geçilen | takas görünmez');
    console.log('---------|-----------|-------------|-------|--------------|-------||---------------|---------------');
    for (const k of gs) {
      const cizim = cizimKutusu(k.merkez, k.rot, k.govde);
      const cizimA1 = cizimKutusu(k.merkez, k.rot, takasliGovde(k));
      const kutu = solidKutu({ c: k.merkez, h: k.half });
      const t = gecisSay(cizim, kutu, erisilir);
      const a1 = gecisSay(cizimA1, kutu, erisilir);
      console.log(
        `${k.ad.padEnd(8)} | ${f2(kutuAlan(cizim)).padStart(9)} | ${f2(t.gecilen).padStart(11)} | ` +
          `${yuzde(t.gecilen, kutuAlan(cizim)).padStart(5)} | ${f2(t.gorunmez).padStart(12)} | ` +
          `${yuzde(t.gorunmez, kutuAlan(kutu)).padStart(5)} || ${f2(a1.gecilen).padStart(10)} | ${f2(a1.gorunmez).padStart(11)}`,
      );
      kayitlar.push({
        donem: d.ad,
        ad: k.ad,
        gecilen: t.gecilen,
        cizimAlan: kutuAlan(cizim),
        gorunmez: t.gorunmez,
        kutuAlanBr: kutuAlan(kutu),
        gecilenA1: a1.gecilen,
        gorunmezA1: a1.gorunmez,
      });
    }
    console.log('');
  }
  return kayitlar;
}

// =============================================================================================
//  §C — BİTİŞİKLİK (G-37)
// =============================================================================================

interface CKol {
  ad: string;
  /** Hattın uzun ekseni boyunca çizilen gövde aralıkları. */
  araliklar: { ad: GovdeAd; a: number; b: number }[];
}

function bolumC(): { tabanBosluk: number; b1Bosluk: number; b2Kayma: number; b2Bosluk: number } {
  console.log('');
  console.log('=============================================================================');
  console.log('§C — BİTİŞİKLİK (G-37: "başlangıçta tezgahlar da bitişik olsun")');
  console.log('=============================================================================');
  console.log('');
  console.log('Hattın UZUN ekseni sol duvar döneminde z, arka bant döneminde x.');
  console.log(`Geçiş eşiği (oyuncu sığar mı): ${f2(GECIS_ESIGI)} br.`);
  console.log('');

  let tabanBosluk = 0;
  let b1Bosluk = 0;

  for (const d of DONEMLER) {
    const gs = govdeler(d.areasOpen);
    const takas = eksenTakasi(gs[0].rot);
    const eksen = takas ? 'z' : 'x';
    // Taban: bugün çizilen gövdelerin uzun eksendeki aralıkları.
    const araligi = (k: GovdeKaydi, g: OnHatGovde) => {
      const c = cizimKutusu(k.merkez, k.rot, g);
      return takas ? { ad: k.ad, a: c.minZ, b: c.maxZ } : { ad: k.ad, a: c.minX, b: c.maxX };
    };
    const kollar: CKol[] = [
      { ad: 'T taban', araliklar: gs.map((k) => araligi(k, k.govde)).sort((p, q) => p.a - q.a) },
      { ad: 'TAKAS (geri alınsa)', araliklar: gs.map((k) => araligi(k, takasliGovde(k))).sort((p, q) => p.a - q.a) },
    ];
    // B1: `onHat` bu dönemde de koşarsa. onHat dünya x bekliyor; sol duvarda uzun eksen z olduğu
    // için parçalar UZUN EKSEN üzerinden verilir (fonksiyonun kendi mantığı eksen-bağımsızdır).
    const parcalar = gs.map((k) => ({
      x: takas ? k.merkez[2] : k.merkez[0],
      hx: takas ? k.half[1] : k.half[0],
      hz: takas ? k.half[0] : k.half[1],
    }));
    const birlesik = onHat(parcalar);
    const b1Araliklar = gs
      .map((k, i) => {
        const merkezUzun = takas ? k.merkez[2] : k.merkez[0];
        return { ad: k.ad, a: merkezUzun + birlesik[i].dx - birlesik[i].w / 2, b: merkezUzun + birlesik[i].dx + birlesik[i].w / 2 };
      })
      .sort((p, q) => p.a - q.a);
    kollar.push({ ad: 'B1 erken birleşme', araliklar: b1Araliklar });

    console.log(`--- ${d.ad} (uzun eksen: ${eksen}) ---`);
    console.log('');
    console.log('kol                | gövde sırası ve aralıkları                       | BOŞLUKLAR (br)');
    console.log('-------------------|--------------------------------------------------|----------------');
    for (const kol of kollar) {
      const sira = kol.araliklar.map((r) => `${r.ad}[${f2(r.a)}…${f2(r.b)}]`).join(' ');
      const bosluklar: number[] = [];
      for (let i = 0; i < kol.araliklar.length - 1; i++) bosluklar.push(kol.araliklar[i + 1].a - kol.araliklar[i].b);
      const metin = bosluklar.length ? bosluklar.map((b) => f2(b)).join(' · ') : '—';
      console.log(`${kol.ad.padEnd(18)} | ${sira.padEnd(48)} | ${metin}`);
      if (d.ad === 'SOL DUVAR' && kol.ad === 'T taban') tabanBosluk = Math.max(...bosluklar, 0);
      if (d.ad === 'SOL DUVAR' && kol.ad === 'B1 erken birleşme') b1Bosluk = Math.max(...bosluklar, 0);
    }
    console.log('');
  }

  /*
   * B2 — bulaşığın KOORDİNATI tezgâha yanaşır (kutular değsin). D-127'de UYGULANDI; bu bölüm
   * artık kolu önermiyor, uygulanmış hâli ÖLÇÜYOR ve geri alınmış hâliyle karşılaştırıyor.
   * `B2_ONCESI_Z` R2 öncesi elle yazılı değerdir ve burada sabit durur: raporun "önce" sütunu
   * sonradan kaymamalı (H1'in taban-değer deseni).
   */
  const B2_ONCESI_Z = 10.6;
  const p = servicePlace(2);
  const tezgahBitis = p.station[2] + p.half[1];
  const hedefMerkez = tezgahBitis + p.dishHalf[1];
  const kayma = B2_ONCESI_Z - p.dish[2];
  console.log('--- B2 (UYGULANDI): bulaşığın KOORDİNATI tezgâha yanaştı — SOL DUVAR dönemi ---');
  console.log('');
  console.log(`bulaşık merkezi ÖNCE z = ${f2(B2_ONCESI_Z)} · ŞİMDİ z = ${f2(p.dish[2])} (türemiş: ${f2(hedefMerkez)})`);
  console.log(`KAYMA = ${f2(kayma)} br (kuzeye)`);
  console.log('');
  console.log('B2 BEDELİ — bulaşıkla birlikte taşınan noktalar (uygulanmış hâlleriyle):');
  const bagli = [
    ['dishwasherHome (bulaşıkçının postası)', p.dishwasherHome],
    ['waiterHome (garson sırası başı)', p.waiterHome],
    ['staffWalk.b (çaycı yolunun ucu)', p.staffWalk.b],
  ] as const;
  for (const [ad, v] of bagli) {
    const mesafe = Math.abs(v[2] - p.dish[2]);
    console.log(`  ${ad.padEnd(38)} z = ${f2(v[2])} · bulaşığa ${f2(mesafe)} br`);
  }
  console.log('');
  console.log(`  Bulaşığın yeni kutusu: z ∈ [${f2(hedefMerkez - p.dishHalf[1])} … ${f2(hedefMerkez + p.dishHalf[1])}]`);
  console.log('');

  // --- G-37 KOLLARININ BEDELİ: birleştirme boşluğu ÇİZİMLE doldurur, KATI eklemez. ---
  // B1 hattı kesintisiz yapar ama doldurduğu yerde collision YOKTUR: yani G-36'yı geri
  // getirebilir. Bu bir tahmin değil, aynı ızgarayla sayılır.
  const solids2 = activeSolids(6, 2);
  const erisilir2 = erisilebilirKume(6, 2, solids2, {
    minX: -FLOOR_HALF, maxX: FLOOR_HALF, minZ: -FLOOR_HALF, maxZ: FLOOR_HALF,
  });
  const gs2 = govdeler(2);
  const parcalar2 = gs2.map((k) => ({ x: k.merkez[2], hx: k.half[1], hz: k.half[0] }));
  const birlesik2 = onHat(parcalar2);
  console.log('--- G-37 KOLLARININ BEDELİ (SOL DUVAR · aynı ızgara, aynı taşma-doldurma) ---');
  console.log('');
  console.log('kol                 | hat boşluğu | GEÇİLEN br² (çizimin içinde yürünen) | GÖRÜNMEZ br²');
  console.log('--------------------|-------------|--------------------------------------|-------------');
  /**
   * Bir kolun bedeli. `kutuKay` kolun collision kutusunu DA taşıyorsa (B2) hem kutu hem
   * erişilebilirlik o kola göre yeniden kurulur — yoksa araç, taşınmış bir gövdeyi eski
   * katının yanında ölçer ve sahte bir "görünmez duvar" üretirdi.
   */
  const kolBedeli = (
    ad: string,
    ciz: (k: GovdeKaydi, i: number) => Kutu,
    bosluk: number,
    kutuKay?: (k: GovdeKaydi) => number,
  ) => {
    const kutusu = (k: GovdeKaydi): Kutu =>
      solidKutu({ c: [k.merkez[0], 0, k.merkez[2] + (kutuKay ? kutuKay(k) : 0)], h: k.half });
    const erisilir = kutuKay
      ? erisilebilirKume(
          6,
          2,
          [
            ...solids2.filter(
              (sd) => !gs2.some((k) => sd.c[0] === k.merkez[0] && sd.c[2] === k.merkez[2] && sd.h === k.half),
            ),
            ...gs2.map((k) => ({ c: [k.merkez[0], 0, k.merkez[2] + kutuKay(k)] as const, h: k.half })),
          ],
          { minX: -FLOOR_HALF, maxX: FLOOR_HALF, minZ: -FLOOR_HALF, maxZ: FLOOR_HALF },
        )
      : erisilir2;
    let gecilen = 0;
    let gorunmez = 0;
    gs2.forEach((k, i) => {
      const r = gecisSay(ciz(k, i), kutusu(k), erisilir);
      gecilen += r.gecilen;
      gorunmez += r.gorunmez;
    });
    console.log(`${ad.padEnd(19)} | ${f2(bosluk).padStart(11)} | ${f2(gecilen).padStart(36)} | ${f2(gorunmez).padStart(12)}`);
    return { gecilen, gorunmez };
  };
  kolBedeli('T bugün (A1+B2)', (k) => cizimKutusu(k.merkez, k.rot, k.govde), tabanBosluk);
  const a1Bedel = kolBedeli('A1 geri alınsa', (k) => cizimKutusu(k.merkez, k.rot, takasliGovde(k)), 1.6);
  // B1 = A1 + erken birleşme: gövde uzun eksende boşluğun ortasına kadar uzar.
  const b1Bedel = kolBedeli(
    'B1 birleşme eklense',
    (k, i) => {
      const uzunMerkez = k.merkez[2] + birlesik2[i].dx;
      return {
        minX: k.merkez[0] - k.half[0],
        maxX: k.merkez[0] + k.half[0],
        minZ: uzunMerkez - birlesik2[i].w / 2,
        maxZ: uzunMerkez + birlesik2[i].w / 2,
      };
    },
    b1Bosluk,
  );
  // B2 = A1 + bulaşık yanaşır: kutu gövdeyle BİRLİKTE taşınır, boşluk kapanır, katı da kapanır.
  // B2 GERİ ALINSA: bulaşık (kutusuyla birlikte) R2 öncesi z'sine döner; A1 yerinde kalır.
  const b2Kay = (k: GovdeKaydi) => (k.ad === 'bulasik' ? B2_ONCESI_Z - k.merkez[2] : 0);
  const b2Bedel = kolBedeli(
    'B2 geri alınsa',
    (k) => cizimKutusu([k.merkez[0], 0, k.merkez[2] + b2Kay(k)], k.rot, k.govde),
    B2_ONCESI_Z - p.dishHalf[1] - tezgahBitis,
    b2Kay,
  );
  console.log('');
  console.log(`  A1 geri alınsa: 90° kusuru döner — ${f2(a1Bedel.gecilen)} br² gövdenin içinden yürünür.`);
  console.log(`  B2 geri alınsa: hat yine ${f2(B2_ONCESI_Z - p.dishHalf[1] - tezgahBitis)} br boşlukla ikiye ayrılır ` +
    `(oyuncu ${f2(GECIS_ESIGI)} eşiğinden geniş → aradan geçer); yürünen ${f2(b2Bedel.gecilen)} br².`);
  console.log(`  B1 bugün EKLENSE: boşluk zaten 0,00 olduğu için birleştirmenin yapacağı iş yok ` +
    `(yürünen ${f2(b1Bedel.gecilen)} br²) — kol gereksiz kaldı, bu yüzden uygulanmadı.`);
  const yeniKutu: Kutu = {
    minX: p.dish[0] - p.dishHalf[0],
    maxX: p.dish[0] + p.dishHalf[0],
    minZ: hedefMerkez - p.dishHalf[1],
    maxZ: hedefMerkez + p.dishHalf[1],
  };
  for (const [ad, v] of bagli) {
    const ic = v[0] >= yeniKutu.minX && v[0] <= yeniKutu.maxX && v[2] >= yeniKutu.minZ && v[2] <= yeniKutu.maxZ;
    if (ic) console.log(`  ⚠ ${ad} YENİ KUTUNUN İÇİNE düşüyor — o nokta da taşınmalı.`);
  }
  console.log('');
  return { tabanBosluk, b1Bosluk, b2Kayma: kayma, b2Bosluk: 0 };
}

// =============================================================================================
//  §D — SEVİYE SİNYALİ (G-38)
// =============================================================================================

/**
 * `ServicePoint.tsx`in İÇİNDE yazılı görsel sabitler dışarı verilmiyor. Araç onları KAYNAKTAN
 * okur ve damgalar — desen değişirse bu bölüm ölçüm sayılmaz (H1'in saçılma sabiti deseni).
 */
function servicePointSabitleri(): { bodyBase: number; bodyStep: number; renkler: string[]; kapaklar: string[] } | null {
  const src = readFileSync(path.join(KOK, 'src/components/three/ServicePoint.tsx'), 'utf8');
  const body = src.match(/const bodyH = ([\d.]+) \+ level \* ([\d.]+);/);
  const renk = src.match(/const LEVEL_COLOR = \[([^\]]+)\]/);
  const kapak = src.match(/const LID_HEAT = \[([^\]]+)\]/);
  const ok = damga('ServicePoint sabitleri okundu', !!(body && renk && kapak), 'regex desenleri tutmadı');
  if (!ok || !body || !renk || !kapak) return null;
  const ayikla = (s: string) => s.split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  return {
    bodyBase: Number(body[1]),
    bodyStep: Number(body[2]),
    renkler: ayikla(renk[1]),
    kapaklar: ayikla(kapak[1]),
  };
}

/** Basit algısal renk uzaklığı (sRGB ağırlıklı öklid) — "gözle ayırt edilir mi" için yeterli. */
function renkFarki(a: string, b: string): number {
  const oku = (h: string): [number, number, number] => {
    const v = h.replace('#', '');
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = oku(a);
  const [r2, g2, b2] = oku(b);
  const rm = (r1 + r2) / 2;
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
}

function bolumD(): { sinyaller: number[]; bicimSinyalleri: number[]; maxLevel: number } {
  console.log('');
  console.log('=============================================================================');
  console.log('§D — SEVİYE SİNYALİ (G-38: "tezgah yükseltmeleri de nasıl oluyor bilmiyorum")');
  console.log('=============================================================================');
  console.log('');
  const s = servicePointSabitleri();
  const maxLevel = C.service.upgrade.maxLevel;
  if (!s) {
    console.log('SABİTLER OKUNAMADI — bu bölüm ölçüm değildir.');
    return { sinyaller: [], bicimSinyalleri: [], maxLevel };
  }
  console.log(`gövde yüksekliği = ${f2(s.bodyBase)} + L × ${f2(s.bodyStep)}`);
  console.log(`semaver rengi    = ${s.renkler.length} üye · kapak rengi = ${s.kapaklar.length} üye`);
  console.log(`kimlik basamakları: L${C.service.counterLevel} TEZGÂH · L${C.service.tostLevel} TOST`);
  console.log('');
  console.log(`biçim işaretleri (C2): ${SERVIS_ISARETLERI.map((i) => `${i.ad}@L${i.acilir}`).join(' · ')}`);
  console.log('');
  console.log('RENK FARKI EŞİĞİ: ~30 altı aynı kadrajda ayırt edilmez (sRGB ağırlıklı öklid).');
  console.log('BİÇİM sinyali: o basamakta gövdeye eklenen yeni nesne · kimlik (TEZGÂH) · tost sacı.');
  console.log('');
  console.log('L→L+1 | semaver Δ | kapak Δ | kimlik | tost | BİÇİM eklenen | renk | biçim | TOPLAM');
  console.log('------|-----------|---------|--------|------|---------------|------|-------|-------');
  const sinyaller: number[] = [];
  const bicimSinyalleri: number[] = [];
  for (let L = 0; L < maxLevel; L++) {
    const r0 = s.renkler[Math.min(L, s.renkler.length - 1)];
    const r1 = s.renkler[Math.min(L + 1, s.renkler.length - 1)];
    const k0 = s.kapaklar[Math.min(L + 1, s.kapaklar.length - 1)];
    const k1 = s.kapaklar[Math.min(L + 2, s.kapaklar.length - 1)];
    const dR = renkFarki(r0, r1);
    const dK = renkFarki(k0, k1);
    const kimlik = isCounter(L + 1) && !isCounter(L);
    const tost = sellsTost(L + 1) && !sellsTost(L);
    /*
     * SİNYAL SAYIMI — iki tür ayrı sayılır (`feedback_upgrade_legibility`: çoklu REDUNDANT sinyal).
     *   renk  : semaver ve pres kapağı, 30 eşiğini geçerse
     *   biçim : o basamakta gövdeye eklenen yeni nesne (C2 listesi) + kimlik (TEZGÂH) + tost sacı
     * Gövde yüksekliğinin 0,12 br'lik adımı hiçbirinde sayılmaz: oyuncu kamerasında piksel düzeyi.
     * Kimlik ve tost C2 LİSTESİNE ALINMADI, burada ayrı sayılıyorlar — aynı sinyal iki kaynaktan
     * sayılsaydı bekçi kendini kandırırdı.
     */
    const eklenen = servisIsaretleri(L + 1).filter((a) => !servisIsaretleri(L).includes(a));
    let renkN = 0;
    if (dR >= 30) renkN++;
    if (dK >= 30) renkN++;
    const bicimN = eklenen.length + (kimlik ? 1 : 0) + (tost ? 1 : 0);
    sinyaller.push(renkN + bicimN);
    bicimSinyalleri.push(bicimN);
    console.log(
      `L${L}→L${L + 1} | ${dR.toFixed(0).padStart(4)} ${(dR >= 30 ? '✓' : '✗')}    | ` +
        `${dK.toFixed(0).padStart(3)} ${(dK >= 30 ? '✓' : '✗')}   | ${(kimlik ? 'TEZGÂH' : '—').padEnd(6)} | ` +
        `${(tost ? 'TOST' : '—').padEnd(4)} | ${(eklenen.join(',') || '—').padEnd(13)} | ` +
        `${String(renkN).padStart(4)} | ${String(bicimN).padStart(5)} | ${renkN + bicimN}`,
    );
  }
  console.log('');
  console.log('SOL DUVAR DÖNEMİNDE MUTFAK ODASI ÇİZİLMEZ (Scene.BackBand: areasOpen < 3 → null).');
  console.log('Yani L0-L3 boyunca oyuncunun gördüğü TEK yükseltme yüzeyi bu gövdedir; S22 kademe');
  console.log('merdiveni (oda büyümesi) o dönemde ekranda hiç yok.');
  console.log('');
  return { sinyaller, bicimSinyalleri, maxLevel };
}

// =============================================================================================
//  KOŞU
// =============================================================================================

kipBandi();
console.log('OLCUM — MUTFAK YERLEŞİMİ VE ÇARPIŞMA (Faz R2 · G-35…G-38)');
console.log(`kip: ${KIP} · ızgara ${f2(HUCRE)} br · oyuncu yarıçapı ${f2(PLAYER_RADIUS)}`);

const a = bolumA();
const b = bolumB();
const c = bolumC();
const d = bolumD();

// --- DAMGALAR ---
// ① Araç GERÇEKTEN iki farklı dünya ölçüyor mu (dönemler aynı sayıyı vermemeli).
const solDuvar = a.filter((r) => r.donem === 'SOL DUVAR');
const arkaBant = a.filter((r) => r.donem === 'ARKA BANT');
damga(
  'dönemler ayrı dünya',
  solDuvar.length > 0 && arkaBant.length > 0 && solDuvar[0].kutu.minX !== arkaBant[0].kutu.minX,
  'iki dönem aynı kutuyu veriyor — servicePlace okunmamış olabilir',
);
// ② TAKAS kolu ETKİLİ mi: eksen takası olan en az bir gövdede tabandan farklı olmalı.
const takasliVar = a.some((r) => kutuEn(r.cizim).toFixed(3) !== kutuEn(r.a1).toFixed(3));
damga('takas kolu etkili', takasliVar, 'takas kolu hiçbir gövdede tabandan farklı çıkmadı');
// ③ Taşma-doldurma GERÇEKTEN katın içine yayıldı mı. Tohum katı engelin içine düşerse ya da
//    kelepçe hemen kesilirse küme küçük kalır ve §B'nin bütün "geçilen" sayıları sahte 0 olur —
//    sıfır kendini doğrular (R1'in üçüncü dersi). Eşik: katın açık alanının en az yarısı.
for (const d0 of DONEMLER) {
  const hucreSayisi = ERISILEN[d0.ad] ?? 0;
  const acikAlan = d0.areasOpen * (FLOOR_HALF * FLOOR_HALF); // kaba üst sınır (br²)
  const beklenen = (acikAlan / (HUCRE * HUCRE)) * 0.25;
  damga(
    `taşma-doldurma yayıldı (${d0.ad})`,
    hucreSayisi >= beklenen,
    `${hucreSayisi} hücre < ${Math.round(beklenen)} — küme kata yayılmadı, "geçilen 0" sahte olur`,
  );
}
damga('gövdeler ölçüldü', b.length > 0, 'hiç gövde ölçülmedi');
// ④ Seviye sinyali bölümü sayı üretti mi.
damga('seviye sinyali ölçüldü', d.sinyaller.length > 0, 'ServicePoint sabitleri okunamadı');
// ⑤ C2'nin kendi şartı: HER basamakta en az bir RENK DIŞI işaret. Bu damga kırılırsa D-127'nin
//    kararı uygulanmamış demektir — ölçüm değil, kod eksiktir.
damga(
  'her basamakta biçim sinyali (C2)',
  d.bicimSinyalleri.length > 0 && d.bicimSinyalleri.every((n) => n >= 1),
  `biçim dizisi [${d.bicimSinyalleri.join(' · ')}] — 0 olan basamak var`,
);

console.log('');
console.log('=============================================================================');
console.log('ÖZET (karar bölümü BOŞ — rapor §Bulgular doldurulur, kol kullanıcı seçer)');
console.log('=============================================================================');
console.log('');
for (const r of a) {
  const ac = (x: Kutu, y: Kutu) => ((kutuEn(x) >= kutuBoy(x)) === (kutuEn(y) >= kutuBoy(y)) ? '0°' : '90°');
  console.log(
    `${r.donem.padEnd(10)} ${r.ad.padEnd(8)} · taban açı ${ac(r.kutu, r.cizim).padEnd(3)} IoU ${iou(r.kutu, r.cizim).toFixed(2)} ` +
      `→ A1 açı ${ac(r.kutu, r.a1).padEnd(3)} IoU ${iou(r.kutu, r.a1).toFixed(2)}`,
  );
}
console.log('');
for (const r of b)
  console.log(
    `${r.donem.padEnd(10)} ${r.ad.padEnd(8)} · geçilen ${f2(r.gecilen)} br² (${yuzde(r.gecilen, r.cizimAlan)}) ` +
      `· görünmez ${f2(r.gorunmez)} br² → takas: ${f2(r.gecilenA1)} / ${f2(r.gorunmezA1)}`,
  );
console.log('');
console.log(`SOL DUVAR hat boşluğu: taban ${f2(c.tabanBosluk)} br → B1 ${f2(c.b1Bosluk)} br · B2 kayma ${f2(c.b2Kayma)} br`);
console.log(`Seviye başına ayırt edilir sinyal: [${d.sinyaller.join(' · ')}] (basamak sayısı ${d.maxLevel})`);
console.log(`  bunun BİÇİM olanı           : [${d.bicimSinyalleri.join(' · ')}] — hiçbiri 0 olmamalı`);
console.log('');

damgaOzeti();
