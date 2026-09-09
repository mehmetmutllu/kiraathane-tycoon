/**
 * olcum-dekor.ts — S5 ÖLÇÜM: elle çizilen dekor parçaları KayKit karşılığına geçebilir mi?
 *
 * NEDEN ARAÇ — S3/S4'ün iki dersi burada birleşiyor:
 *  1. **Paketin modül karosu ölçek değildir** (S3, kasa dersi). KayKit mobilyası 2×2'lik bir
 *     karoda yazılı; o karoyu KÜÇÜK bir eşyaya (çöp kovası, masa lambası, saksı) uygulayınca
 *     eşya palet sandığına dönüşüyor. Dekorun 17 parçasının çoğu küçük eşya → tek ölçek
 *     kararı bu turda EN RİSKLİ sayı.
 *  2. **Ayak izi merkezden büyüktür** (yeni). Bugünkü bekçi (`tests/layout-b6a.test.ts`) dekoru
 *     yalnız MERKEZ noktasıyla denetliyor: "saksının merkezi pad'den 1,3'ten uzak mı". Model
 *     geçince merkez aynı kalıp GÖVDE büyüyebilir; o zaman kutu pad'in içine sarkar ama bekçi
 *     yeşil kalır. Bu araç açıklıkları GÖVDE KENARINDAN ölçer.
 *
 * ÜÇÜNCÜ DERS (S4, sucuk): modelin origin'i görsel merkezinde OLMAK ZORUNDA DEĞİL. Her aday
 * için merkez kayması da basılır, telafi tahminle yazılmasın.
 *
 * Bu araç hiçbir şeyi değiştirmez; ölçer ve `docs/olcum-dekor.txt` üretir.
 * Kullanım: npx tsx tools/olcum-dekor.ts
 */
import { writeFileSync } from 'node:fs';
import { ACTOR_HEIGHT } from '../src/config/actor';
import { LAYOUT, PAD_RADIUS, TABLE_UP_RADIUS, dist2D, servicePlace, tableSolids } from '../src/game/layout';
import { MAX_AREAS, areaTableSlots, areaTableStart } from '../src/game/world';

/** Bir alan sayısında sahnedeki en çok masa (tests/layout-b6a.test.ts ile aynı türetme). */
const maxTablesFor = (areasOpen: number): number => areaTableStart(areasOpen - 1) + areaTableSlots(areasOpen - 1);
import { decorItems, type DecorItem, type DecorKind } from '../src/config/decor';
import { WAINSCOT_H, WALL_H } from '../src/components/three/wallPanel';
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
const n2 = (v: number) => v.toFixed(2).padStart(6);
const n3 = (v: number) => v.toFixed(3).padStart(7);
const yz = (v: number) => `${(v * 100).toFixed(0).padStart(4)}%`;

// ---------------------------------------------------------------- paketler
type Paket = 'kaykit-furniture-bits' | 'kaykit-restaurant-bits' | 'kaykit-city-builder-bits';
const DOKU: Record<Paket, string> = {
  'kaykit-furniture-bits': 'furniturebits_texture.png',
  'kaykit-restaurant-bits': 'restaurantbits_texture.png',
  'kaykit-city-builder-bits': 'citybits_texture.png',
};
type Ham = { mn: number[]; mx: number[]; boyut: number[] };
const olc = (p: Paket, ad: string): Ham => bbox(`public/assets/models/${p}/${ad}.gltf`) as Ham;

/** Mutfağın dondurduğu mobilya ölçeği (`kitchenLook.KITCHEN_S` = `tableLook.STOOL_S`). */
const S_MOBILYA = 0.9;

// ---------------------------------------------------------------- bugünkü elle çizim
/**
 * BUGÜNKÜ PARÇALARIN DÜNYA ÖLÇÜSÜ — `components/three/Decor.tsx`teki mesh'lerden EL İLE
 * toplanmış sınır kutusu. Neden elle: o dosya ölçü katmanı taşımıyor (S5'in işi zaten onu
 * `decorLook.ts`e çıkarmak); ölçüm turunda karşılaştırma tabanı gerekiyor.
 *
 * `gercek`: o eşyanın GERÇEK dünya ölçüsü [en, boy] — `feedback_reference_scale_trap`: ölçek
 * kararı önce insan/eşya oranıyla sağlanır, sonra ekrana bakılır.
 */
interface Bugun {
  kind: DecorKind;
  ad: string;
  w: number;
  h: number;
  d: number;
  gercek: [number, number];
  /**
   * DÜZ parça (paspas/halı): boy karşılaştırması anlamsızdır — 1 cm kalınlık ile 10 cm kalınlık
   * arasındaki "%650 fark" hiçbir şey anlatmaz. Düz parçada ölçek ENDEN, uyum AYAK İZİNDEN
   * okunur. İlk koşu bunu yapmadı ve rapora sahte bir sapma yazacaktı.
   */
  duz?: boolean;
  not?: string;
}
const BUGUN: Bugun[] = [
  { kind: 'saksi', ad: 'saksı (küçük)', w: 0.53, h: 0.92, d: 0.48, gercek: [0.28, 0.75] },
  { kind: 'buyukSaksi', ad: 'saksı (büyük, ×1,25)', w: 0.66, h: 1.15, d: 0.6, gercek: [0.45, 1.2] },
  { kind: 'denizlikSaksi', ad: 'denizlik saksısı', w: 0.22, h: 0.31, d: 0.22, gercek: [0.16, 0.3] },
  { kind: 'copKovasi', ad: 'çöp kovası (len 1,0)', w: 0.42, h: 0.66, d: 0.42, gercek: [0.3, 0.65] },
  { kind: 'copKovasi', ad: 'çöp kovası (len 0,85)', w: 0.36, h: 0.56, d: 0.36, gercek: [0.3, 0.65] },
  { kind: 'ayakliLamba', ad: 'ayaklı lamba', w: 0.52, h: 1.45, d: 0.52, gercek: [0.45, 1.55] },
  { kind: 'gazetelik', ad: 'gazetelik', w: 0.6, h: 0.9, d: 0.4, gercek: [0.5, 0.85] },
  { kind: 'paspas', ad: 'kapı paspası', w: 2.8, h: 0.012, d: 1.2, gercek: [0.75, 0.45], duz: true, not: 'bugünkü paspas ENİ gerçeğin 3,7 katı — kapı paspası değil KORİDOR KİLİMİ ölçüsünde' },
  { kind: 'konsol', ad: 'konsol/büfe (len 3,0)', w: 3.08, h: 1.19, d: 0.51, gercek: [1.4, 0.8], not: 'h 1,19 üstündeki eşyalarla (radyo/tepsi/saksı); gövde tablası 0,75' },
  { kind: 'tablo', ad: 'duvar tablosu', w: 1.2, h: 0.42, d: 0.05, gercek: [0.6, 0.45] },
];

// ---------------------------------------------------------------- adaylar
interface Aday {
  kind: DecorKind | 'yeni';
  paket: Paket;
  ad: string;
  /** Gerçek dünya ölçüsü [en, boy] — "gerçek boy" kolunun ölçeği buradan türer. */
  gercek: [number, number];
  /** Duvara asılıyorsa asma yüksekliği (bant denetimi bunu okur). */
  asmaY?: number;
  /** Düz parça — ölçek ENDEN türetilir (bkz. `Bugun.duz`). */
  duz?: boolean;
}
const ADAYLAR: Aday[] = [
  // ---- çöp kovası
  { kind: 'copKovasi', paket: 'kaykit-city-builder-bits', ad: 'trash_A', gercek: [0.3, 0.65] },
  { kind: 'copKovasi', paket: 'kaykit-city-builder-bits', ad: 'trash_B', gercek: [0.3, 0.65] },
  { kind: 'copKovasi', paket: 'kaykit-city-builder-bits', ad: 'dumpster', gercek: [1.8, 1.2] },
  // ---- ayaklı lamba / masa lambası
  { kind: 'ayakliLamba', paket: 'kaykit-furniture-bits', ad: 'lamp_standing', gercek: [0.45, 1.55] },
  { kind: 'yeni', paket: 'kaykit-furniture-bits', ad: 'lamp_table', gercek: [0.32, 0.45] },
  // ---- konsol
  { kind: 'konsol', paket: 'kaykit-furniture-bits', ad: 'cabinet_medium', gercek: [1.4, 0.8] },
  { kind: 'konsol', paket: 'kaykit-furniture-bits', ad: 'cabinet_medium_decorated', gercek: [1.4, 0.8] },
  { kind: 'konsol', paket: 'kaykit-furniture-bits', ad: 'cabinet_small', gercek: [0.7, 0.8] },
  { kind: 'konsol', paket: 'kaykit-furniture-bits', ad: 'cabinet_small_decorated', gercek: [0.7, 0.8] },
  { kind: 'konsol', paket: 'kaykit-furniture-bits', ad: 'shelf_B_large_decorated', gercek: [1.4, 0.4] },
  // ---- duvar tablosu (asma yüksekliği `MOUNT.mid` = 1,95)
  { kind: 'tablo', paket: 'kaykit-furniture-bits', ad: 'pictureframe_large_A', gercek: [0.7, 0.9], asmaY: 1.95 },
  { kind: 'tablo', paket: 'kaykit-furniture-bits', ad: 'pictureframe_large_B', gercek: [1.2, 0.7], asmaY: 1.95 },
  { kind: 'tablo', paket: 'kaykit-furniture-bits', ad: 'pictureframe_medium', gercek: [0.6, 0.75], asmaY: 1.95 },
  { kind: 'tablo', paket: 'kaykit-furniture-bits', ad: 'pictureframe_small_A', gercek: [0.4, 0.5], asmaY: 1.95 },
  { kind: 'tablo', paket: 'kaykit-furniture-bits', ad: 'pictureframe_small_B', gercek: [0.5, 0.35], asmaY: 1.95 },
  { kind: 'tablo', paket: 'kaykit-furniture-bits', ad: 'pictureframe_small_C', gercek: [0.4, 0.4], asmaY: 1.95 },
  // ---- paspas (HALI YOK: `rug_*` yalnız paspas adayı — `config/decor.ts` başlığı)
  { kind: 'paspas', paket: 'kaykit-furniture-bits', ad: 'rug_rectangle_A', gercek: [0.75, 0.45], duz: true },
  { kind: 'paspas', paket: 'kaykit-furniture-bits', ad: 'rug_rectangle_B', gercek: [0.75, 0.45], duz: true },
  { kind: 'paspas', paket: 'kaykit-furniture-bits', ad: 'rug_rectangle_stripes_A', gercek: [0.75, 0.45], duz: true },
  { kind: 'paspas', paket: 'kaykit-furniture-bits', ad: 'rug_rectangle_stripes_B', gercek: [0.75, 0.45], duz: true },
  { kind: 'paspas', paket: 'kaykit-furniture-bits', ad: 'rug_oval_A', gercek: [0.75, 0.45], duz: true },
  { kind: 'paspas', paket: 'kaykit-furniture-bits', ad: 'rug_oval_B', gercek: [0.75, 0.45], duz: true },
  // ---- saksı
  { kind: 'saksi', paket: 'kaykit-furniture-bits', ad: 'cactus_small_A', gercek: [0.28, 0.75] },
  { kind: 'saksi', paket: 'kaykit-furniture-bits', ad: 'cactus_small_B', gercek: [0.28, 0.75] },
  { kind: 'buyukSaksi', paket: 'kaykit-furniture-bits', ad: 'cactus_medium_A', gercek: [0.45, 1.2] },
  { kind: 'buyukSaksi', paket: 'kaykit-furniture-bits', ad: 'cactus_medium_B', gercek: [0.45, 1.2] },
  { kind: 'buyukSaksi', paket: 'kaykit-city-builder-bits', ad: 'bush', gercek: [0.9, 0.9] },
  // ---- gazetelik
  { kind: 'gazetelik', paket: 'kaykit-furniture-bits', ad: 'shelf_A_small', gercek: [0.8, 0.3] },
  { kind: 'gazetelik', paket: 'kaykit-furniture-bits', ad: 'shelf_B_small_decorated', gercek: [0.8, 0.75] },
  { kind: 'gazetelik', paket: 'kaykit-furniture-bits', ad: 'book_set', gercek: [0.3, 0.25] },
];

/** Aday hangi bugünkü parçanın yerine geçiyor (ilk eşleşen — çöp kovası iki örnekli, büyüğü esas). */
const bugunOf = (a: Aday): Bugun | undefined => BUGUN.find((b) => b.kind === a.kind);

// ================================================================ §0 SAĞLAMA
yaz('='.repeat(112));
yaz('S5 DEKOR ÖLÇÜMÜ — elle çizilen dekor ↔ KayKit adayları');
yaz(`tarih: ${new Date().toISOString().slice(0, 10)} · karakter boyu ${ACTOR_HEIGHT} · WALL_H ${WALL_H} · lambri çıtası ${WAINSCOT_H + 0.08}`);
yaz('='.repeat(112));
yaz();
yaz('§0 SAĞLAMA — paketler AYNI ham ölçekte mi? (S3 sağlaması: `chair_A` her pakette 0,750 ise evet)');
yaz();
const REF: [Paket, string, number][] = [
  ['kaykit-restaurant-bits', 'chair_A', 0.45],
  ['kaykit-furniture-bits', 'chair_A', 0.45],
  ['kaykit-city-builder-bits', 'bench', 1.5],
  ['kaykit-city-builder-bits', 'firehydrant', 0.32],
  ['kaykit-city-builder-bits', 'dumpster', 1.8],
];
yaz('paket'.padEnd(30) + 'model'.padEnd(14) + '  ham en   gerçek en   ham/gerçek');
for (const [p, ad, g] of REF) {
  const b = olc(p, ad);
  yaz(p.padEnd(30) + ad.padEnd(14) + n3(b.boyut[0]) + n3(g) + '   ×' + (b.boyut[0] / g).toFixed(2));
}
yaz();
yaz('  furniture ≡ restaurant (chair_A ikisinde de 0,750) → `KITCHEN_S = 0,90` dekor için de geçerli.');
yaz('  CITY paketi AYRI ÖLÇEKTE: sokak mobilyası gerçeğin ~1/4,3\'ü yazılmış (bench 0,400 ↔ 1,50 m).');
yaz('  → city modeline 0,90 uygulanamaz; kendi ölçeği hesaplanmalı (aşağıda "gerçek boy" kolu).');
yaz();

// ================================================================ §A bugünkü parçalar
yaz('='.repeat(112));
yaz('§A BUGÜNKÜ ELLE ÇİZİM — taban (Decor.tsx) + gerçek eşya oranı');
yaz();
yaz('parça'.padEnd(24) + '   en    boy    der   | boy/kar. | oran en/boy | gerçek oran | gerçek en×boy | çizim/gerçek');
for (const b of BUGUN) {
  // Düz parçada ölçüt ENDİR (kalınlık karşılaştırması sahte sapma üretiyor).
  const carpan = b.duz ? b.w / b.gercek[0] : b.h / b.gercek[1];
  const oran = b.duz ? b.w / b.d : b.w / b.h;
  const gOran = b.duz ? b.gercek[0] / b.gercek[1] : b.gercek[0] / b.gercek[1];
  yaz(
    b.ad.padEnd(24) + n2(b.w) + n2(b.h) + n2(b.d) + '  |' + yz(b.h / ACTOR_HEIGHT).padStart(9) +
      ' |' + n2(oran).padStart(12) + ' |' + n2(gOran).padStart(12) +
      ` | ${b.gercek[0].toFixed(2)}×${b.gercek[1].toFixed(2)}`.padEnd(15) + '| ×' + carpan.toFixed(2) + (b.duz ? ' (enden)' : ''),
  );
}
yaz();
yaz('  ORAN sütunu neden var: ölçek her zaman ayarlanabilir, BİÇİM ayarlanamaz. Adayın en/boy oranı');
yaz('  gerçeğinden uzaksa o model o eşya DEĞİLDİR ve hangi ölçekte konursa konsun yanlış okunur.');
yaz();
for (const b of BUGUN) if (b.not) yaz(`  ! ${b.ad}: ${b.not}`);
yaz();
const sayim = new Map<string, number>();
for (const d of decorItems(MAX_AREAS)) sayim.set(d.kind, (sayim.get(d.kind) ?? 0) + 1);
yaz('SAHNEDEKİ ÖRNEK SAYISI (areasOpen = ' + MAX_AREAS + '): ' + [...sayim].map(([k, n]) => `${k}×${n}`).join(' · '));
yaz();

// ================================================================ §B adaylar: ham → dünya
yaz('='.repeat(112));
yaz('§B ADAYLAR — ham sınır kutusu, üç ÖLÇEK KOLU ve insan oranı');
yaz();
yaz('  K1 0,90     : mobilya ölçeği (KITCHEN_S/STOOL_S) — hattın ritmiyle aynı sayı');
yaz('  K2 fit      : bugünkü parçanın BOYUNA çek (ölçek = bugünBoy / hamBoy)');
yaz('  K3 gerçekBoy: gerçek eşya boyuna çek (ölçek = gerçekBoy / hamBoy) — KASA_S deseni');
yaz();
yaz(
  'aday'.padEnd(26) + 'parça'.padEnd(13) + '  hamEn  hamBoy  hamDer | oran  ↔gerçek | K1 en×boy×der      ins% | K2 ölçek en   | K3 ölçek en×boy  | merkez kayması',
);
interface Satir extends Aday {
  ham: Ham;
  k1: [number, number];
  k2: number;
  k3: number;
  kayma: [number, number];
}
const SATIR: Satir[] = [];
for (const a of ADAYLAR) {
  const ham = olc(a.paket, a.ad);
  const bg = bugunOf(a);
  const k1: [number, number] = [ham.boyut[0] * S_MOBILYA, ham.boyut[1] * S_MOBILYA];
  // Düz parçada (paspas/halı) ölçek ENDEN türer; kalınlıktan türetmek 13,5 br'lik halı veriyordu.
  const k2 = bg ? (a.duz ? bg.w / ham.boyut[0] : bg.h / ham.boyut[1]) : 0;
  const k3 = a.duz ? a.gercek[0] / ham.boyut[0] : a.gercek[1] / ham.boyut[1];
  // BİÇİM oranı: düz parçada en/derinlik, ayaklı parçada en/boy.
  const oran = a.duz ? ham.boyut[0] / ham.boyut[2] : ham.boyut[0] / ham.boyut[1];
  const gOran = a.gercek[0] / a.gercek[1];
  // Görsel merkez ↔ origin kayması (S4 sucuk dersi): kutu ortası origin'de mi?
  const kayma: [number, number] = [(ham.mn[0] + ham.mx[0]) / 2, (ham.mn[2] + ham.mx[2]) / 2];
  SATIR.push({ ...a, ham, k1, k2, k3, kayma });
  const biçim = Math.abs(oran - gOran) / gOran;
  yaz(
    a.ad.padEnd(26) + String(a.kind).padEnd(13) + n3(ham.boyut[0]) + n3(ham.boyut[1]) + n3(ham.boyut[2]) + ' |' +
      n2(oran) + n2(gOran) + (biçim > 0.5 ? '*' : ' ') + '|' +
      ` ${n2(k1[0])}×${k1[1].toFixed(2)}×${(ham.boyut[2] * S_MOBILYA).toFixed(2)}`.padEnd(20) + yz(k1[1] / ACTOR_HEIGHT) + ' |' +
      (bg ? ` ${k2.toFixed(3)} ${(ham.boyut[0] * k2).toFixed(2)}` : ' —          ').padEnd(15) + '|' +
      ` ${k3.toFixed(3)} ${(ham.boyut[0] * k3).toFixed(2)}×${(ham.boyut[1] * k3).toFixed(2)}`.padEnd(18) + '| ' +
      `x ${kayma[0] >= 0 ? '+' : ''}${kayma[0].toFixed(3)} · z ${kayma[1] >= 0 ? '+' : ''}${kayma[1].toFixed(3)}`,
  );
}
yaz();
yaz("  * = BİÇİM oranı gerçeğinden %50'den fazla sapıyor → o model o eşya olmayabilir.");
yaz();
yaz('  ! K1 (0,90) SAPMASI — aday bugünkü parçadan yüzde kaç farklı (düz parçada ENDEN):');
for (const s of SATIR) {
  const bg = bugunOf(s);
  if (!bg) continue;
  const olcut = s.duz ? 'en ' : 'boy';
  const aday = s.duz ? s.k1[0] : s.k1[1];
  const bugun = s.duz ? bg.w : bg.h;
  const sap = (aday - bugun) / bugun;
  const bayrak = Math.abs(sap) > 0.35 ? '  <<< 35% ÜSTÜ' : '';
  yaz(`    ${s.ad.padEnd(26)} ${olcut} ${n2(aday)} ↔ bugün ${n2(bugun)}  = ${(sap * 100 >= 0 ? '+' : '') + (sap * 100).toFixed(0)}%${bayrak}`);
}
yaz();

// ================================================================ §C ayak izi eşikleri
yaz('  ! ODAYA TAŞMA — duvara yaslanan/asılan parçada derinlik (kamera yan duvarı PROFİLDEN görür:');
yaz('    D-068 dersi, taşma okunurluğu ARTIRIR ama yürüme koridorunu daraltır):');
for (const s2 of SATIR) {
  const bg = bugunOf(s2);
  if (!bg || (s2.kind !== 'konsol' && s2.kind !== 'tablo')) continue;
  const der = s2.ham.boyut[2] * S_MOBILYA;
  yaz(`    ${s2.ad.padEnd(26)} der ${n2(der)} ↔ bugün ${n2(bg.d)}  = ${((der / bg.d - 1) * 100 >= 0 ? '+' : '') + ((der / bg.d - 1) * 100).toFixed(0)}%`);
}
yaz();
yaz('='.repeat(112));
yaz('§C AYAK İZİ EŞİKLERİ — gövde KENARINDAN açıklık (bugünkü bekçi yalnız MERKEZE bakıyor)');
yaz();
yaz(`  eşikler: pad yarıçapı ${PAD_RADIUS} · masa yükseltme noktası ${TABLE_UP_RADIUS} · masa katısı kenarı 0`);
yaz('  ölçüm: parçanın her ÖRNEĞİ için, gövde yarı-eni çıkarılmış en küçük açıklık.');
yaz();
const yariEn = (w: number, d: number) => Math.hypot(w, d) / 2; // en kötü hâl: köşeden bakış
function enKotuAciklik(pos: DecorItem['pos'], r: number, areasOpen: number) {
  const tables = maxTablesFor(areasOpen);
  let en = Infinity;
  let nere = '';
  const bak = (mesafe: number, esik: number, ad: string) => {
    const a = mesafe - r - esik;
    if (a < en) {
      en = a;
      nere = ad;
    }
  };
  for (let i = 0; i < tables; i++) bak(dist2D(pos, LAYOUT.tables[i].upgradeSpot), TABLE_UP_RADIUS, `masa ${i} nokta`);
  for (const [id, p] of Object.entries(LAYOUT.padPos)) bak(dist2D(pos, p), PAD_RADIUS, `pad ${id}`);
  bak(dist2D(pos, servicePlace(areasOpen).upgradeSpot), 1.2, 'servis noktası');
  for (const s of tableSolids(tables)) {
    const dx = Math.max(0, Math.abs(pos[0] - s.c[0]) - s.h[0]);
    const dz = Math.max(0, Math.abs(pos[2] - s.c[2]) - s.h[1]);
    bak(Math.hypot(dx, dz), 0, 'masa katısı');
  }
  return { en, nere };
}
yaz('parça'.padEnd(22) + 'konum'.padEnd(18) + ' bugün r  → açıklık | K1 r    → açıklık | fark');
for (const areasOpen of [MAX_AREAS]) {
  for (const d of decorItems(areasOpen)) {
    const bg = BUGUN.find((b) => b.kind === d.kind);
    if (!bg) continue;
    const aday = SATIR.filter((s) => s.kind === d.kind);
    if (!aday.length) continue;
    // en BÜYÜK aday en kötü hâli verir
    const enBuyuk = aday.reduce((p, c) => (c.ham.boyut[0] * S_MOBILYA > p.ham.boyut[0] * S_MOBILYA ? c : p));
    const rB = yariEn(bg.w, bg.d);
    const rA = yariEn(enBuyuk.ham.boyut[0] * S_MOBILYA, enBuyuk.ham.boyut[2] * S_MOBILYA);
    const b = enKotuAciklik(d.pos, rB, areasOpen);
    const a = enKotuAciklik(d.pos, rA, areasOpen);
    const bayrak = a.en < 0 ? '  <<< İHLAL' : a.en < 0.2 ? '  <  0,20' : '';
    yaz(
      d.kind.padEnd(22) + `[${d.pos[0].toFixed(1)},${d.pos[2].toFixed(1)}]`.padEnd(18) +
        n2(rB) + ' →' + n2(b.en) + '   |' + n2(rA) + ' →' + n2(a.en) + '   |' + n2(a.en - b.en) + bayrak +
        `   (${a.nere})`,
    );
  }
}
yaz();

// ================================================================ §D duvar bandı
yaz('='.repeat(112));
yaz('§D BANT — duvara asılan aday `WALL_H` altında ve lambri çıtasının (0,98) üstünde mi?');
yaz();
yaz('aday'.padEnd(26) + 'ölçek  asmaY   altKenar  üstKenar |  çıta payı  tepe payı');
const CITA = WAINSCOT_H + 0.08;
for (const s of SATIR) {
  if (s.asmaY === undefined) continue;
  for (const [ad, ol] of [['K1 0,90', S_MOBILYA], ['K3 gerçek', s.k3]] as const) {
    const alt = s.asmaY + s.ham.mn[1] * ol;
    const ust = s.asmaY + s.ham.mx[1] * ol;
    const bayrak = alt < CITA || ust > WALL_H ? '  <<< BANDIN DIŞINDA' : '';
    yaz(
      s.ad.padEnd(26) + ad.padEnd(11) + n2(s.asmaY) + n2(alt) + n2(ust) + '  |' +
        n2(alt - CITA) + n2(WALL_H - ust) + bayrak,
    );
  }
}
yaz();

// ================================================================ §E renk
yaz('='.repeat(112));
yaz('§E RENK — her adayın atlas gözleri ve o gözlerin ÖLÇÜLEN rengi (tahmin yok, D-100 dersi)');
yaz();
const renkCache = new Map<Paket, { goz: number[]; ort: number[] }[]>();
const renkAl = (p: Paket) => {
  if (!renkCache.has(p)) renkCache.set(p, gozRenkleri(`public/assets/models/${p}/${DOKU[p]}`));
  return renkCache.get(p)!;
};
const hex = (v: number[]) => '#' + v.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
for (const s of SATIR) {
  const gz = gozler(s.paket, s.ad) as [string, number][];
  const renkler = renkAl(s.paket);
  const parca = gz.slice(0, 4).map(([k, n]) => {
    const [r, c] = k.split(',').map(Number);
    const rr = renkler.find((x) => x.goz[0] === r && x.goz[1] === c);
    return `[${k}]${rr ? hex(rr.ort) : '?'}×${n}`;
  });
  yaz(s.ad.padEnd(26) + parca.join(' '));
}
yaz();
yaz('='.repeat(112));
yaz('BİTTİ — karar bu dosyada YOK. Kollar `docs/dekor-raporu-s5.md` §Bulgular\'da, seçim kullanıcının.');
yaz('='.repeat(112));

writeFileSync('docs/olcum-dekor.txt', cikti.join('\n') + '\n');
