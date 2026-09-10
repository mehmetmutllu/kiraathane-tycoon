/**
 * olcum-dis-cephe.ts — S6 ÖLÇÜM: kıraathanenin DIŞI KayKit'e geçebilir mi?
 *
 * NEDEN AYRI ARAÇ — bu tur öncekilerden bir yönüyle farklı: **paket ayrı ölçekte.**
 * S3/S4/S5'in üç dersi (modül karosu ölçek değildir · ada bakma ölç · biçim oranı ölçekten
 * önemli) burada tek bir soruda birleşiyor: `kaykit-city-builder-bits` bir ŞEHİR paketi,
 * yani karosu bir ODA değil bir SOKAK. Aynı 2,0'lık karo mutfakta 1,80 dünya birimiydi;
 * burada bir yol karosu, yani ~7 metre. **Bu paketin çarpanı hesaplanmadan hiçbir modeli
 * sahneye konamaz** — S5 bunu ölçtü ve karar S6'ya devretti.
 *
 * İKİNCİ RİSK — D-100. Duvar KayKit'e GEÇMEDİ, çünkü modülün kendi yatay oluğu (dünya 1,60)
 * maketin lambri hattıyla (0,94) çakışmıyordu ve kullanıcı ekranda *"duvar 2'ye bölünük"*
 * dedi. `wall_window_open` AYNI modül ailesinden. Bu araç o kolu elemez, **bedelini basar.**
 *
 * ÜÇÜNCÜ RİSK — bugünkü dikey tabela şeridi bir TERCİHTİ: *"eğik tente kamera +z'den bakınca
 * ekranı kapatıyordu"*. Bu gerekçe hiç SAYIYLA sınanmadı. §F kamera ışınıyla sınar.
 *
 * Bu araç hiçbir şeyi değiştirmez; ölçer ve `docs/olcum-dis-cephe.txt` üretir.
 * Kullanım: npx tsx tools/olcum-dis-cephe.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { ACTOR_HEIGHT, CAMERA_LOOK_Y, PLAYER_RADIUS } from '../src/config/actor';
import { CAMERA_DIST, CAMERA_FOV, CAMERA_PORTRAIT_CLAMP, CAMERA_ZOOM_OUT_MUL } from '../src/config/camera';
import { WINDOW } from '../src/config/decor';
import { BAND, BAND_SHELL, FLOOR_HALF, LAYOUT, doorX, entranceAt, streetAt } from '../src/game/layout';
import { DENIZLIK_DERINLIK } from '../src/components/three/decorLook';
import { DOOR, WAINSCOT_H, WALL_H } from '../src/components/three/wallPanel';
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

type Paket = 'kaykit-city-builder-bits' | 'kaykit-restaurant-bits' | 'kaykit-furniture-bits';
const DOKU: Record<Paket, string> = {
  'kaykit-city-builder-bits': 'citybits_texture.png',
  'kaykit-restaurant-bits': 'restaurantbits_texture.png',
  'kaykit-furniture-bits': 'furniturebits_texture.png',
};
type Ham = { mn: number[]; mx: number[]; boyut: number[] };
const yol = (p: Paket, ad: string) => `public/assets/models/${p}/${ad}.gltf`;
const olc = (p: Paket, ad: string): Ham => bbox(yol(p, ad)) as Ham;

/** Modelin üçgen sayısı — çizim bütçesi kararı tahminle verilmesin (dekor instancing v1.1'e ertelendi). */
function ucgenSayisi(p: Paket, ad: string): number {
  const g = JSON.parse(readFileSync(yol(p, ad), 'utf8'));
  let n = 0;
  for (const m of g.meshes ?? [])
    for (const pr of m.primitives ?? [])
      n += (pr.indices !== undefined ? g.accessors[pr.indices].count : g.accessors[pr.attributes.POSITION].count) / 3;
  return n;
}

// ============================================================================================
//  §0 ÖLÇEK — city-builder paketi hangi çarpanla dünyaya girer?
// ============================================================================================
//
// YÖNTEM: her model için ONE dimension seçilir (dikey eşya → BOY, uzun eşya → UZUNLUK; S5'in
// "düz parçada boy karşılaştırması sahte sapma üretir" dersinin genellemesi) ve o ölçünün
// GERÇEK dünya karşılığına bölünür. Çıkan sayı o modelin ima ettiği çarpandır.
//
// GERÇEK ÖLÇÜLER — hepsi yaygın kabul, her biri satırında yazılı; tahmin diye geçiştirilmiyor.
interface Kalem {
  ad: string;
  eksen: 0 | 1 | 2; // 0 = en(x) · 1 = boy(y) · 2 = derinlik(z)
  gercek: number;
  neden: string;
  aile: 'mobilya' | 'bina' | 'yol' | 'arac' | 'bitki';
}
const KALEMLER: Kalem[] = [
  { ad: 'bench', eksen: 0, gercek: 1.5, neden: 'park bankı uzunluğu 1,5 m', aile: 'mobilya' },
  { ad: 'streetlight', eksen: 1, gercek: 4.0, neden: 'sokak lambası direği 4 m', aile: 'mobilya' },
  { ad: 'firehydrant', eksen: 1, gercek: 0.75, neden: 'yangın musluğu 0,75 m', aile: 'mobilya' },
  { ad: 'dumpster', eksen: 0, gercek: 1.8, neden: 'çöp konteyneri eni 1,8 m', aile: 'mobilya' },
  { ad: 'trafficlight_A', eksen: 1, gercek: 3.5, neden: 'trafik lambası direği 3,5 m', aile: 'mobilya' },
  { ad: 'car_taxi', eksen: 2, gercek: 4.5, neden: 'sedan taksi uzunluğu 4,5 m', aile: 'arac' },
  { ad: 'car_sedan', eksen: 2, gercek: 4.5, neden: 'sedan uzunluğu 4,5 m', aile: 'arac' },
  { ad: 'bush', eksen: 1, gercek: 1.0, neden: 'sokak çalısı 1,0 m', aile: 'bitki' },
  { ad: 'building_A', eksen: 1, gercek: 6.0, neden: '2 katlı bina 6 m (kat 3 m)', aile: 'bina' },
  { ad: 'building_H', eksen: 1, gercek: 11.0, neden: 'en yüksek bina ≈ 3,5-4 kat', aile: 'bina' },
  { ad: 'road_straight', eksen: 0, gercek: 7.0, neden: 'iki şeritli yol 2 × 3,5 m', aile: 'yol' },
];

yaz('='.repeat(112));
yaz('S6 ÖLÇÜM — DIŞ CEPHE · SOKAK · PENCERE · TENTE · LAVABO MUSLUĞU');
yaz('Bu dosya KARAR İÇERMEZ. Kollar `docs/dis-cephe-raporu-s6.md` §Bulgular\'da; seçim kullanıcının.');
yaz(`dünya birimi = METRE (ACTOR_HEIGHT ${ACTOR_HEIGHT} = 1,75 m insan)`);
yaz('='.repeat(112));
yaz();

yaz('§0 ÖLÇEK — city-builder-bits paketi hangi çarpanla dünyaya girer? (S5\'ten DEVREDEN soru)');
yaz('-'.repeat(112));
yaz('KRİTİK: bu paketin karosu bir ODA değil bir SOKAK. Mutfağın 0,90\'ı buraya UYGULANAMAZ.');
yaz();
yaz('model'.padEnd(18) + 'eksen  ham    gerçek   ima edilen çarpan   aile');
const imalar: { k: Kalem; ima: number }[] = [];
for (const k of KALEMLER) {
  const b = olc('kaykit-city-builder-bits', k.ad);
  const ham = b.boyut[k.eksen];
  const ima = k.gercek / ham;
  imalar.push({ k, ima });
  yaz(
    k.ad.padEnd(18) +
      ['x', 'y', 'z'][k.eksen] +
      n3(ham) +
      n3(k.gercek) +
      n3(ima).padStart(12) +
      '   ' +
      k.aile.padEnd(9) +
      '  ' +
      k.neden,
  );
}
const siraliIma = imalar.map((i) => i.ima).sort((a, b) => a - b);
const ORTANCA = siraliIma[Math.floor(siraliIma.length / 2)];
const ortalama = siraliIma.reduce((a, b) => a + b, 0) / siraliIma.length;
yaz();
yaz(`ORTANCA çarpan  = ${n3(ORTANCA)}   ortalama = ${n3(ortalama)}   yayılım = ${n3(siraliIma[0])} … ${n3(siraliIma[siraliIma.length - 1])}`);
yaz(`paketin karosu  = 2,000 ham → ${n3(2 * ORTANCA)} dünya (ortancayla). Bir yol karosu ≈ bu kadar metre.`);
yaz();

/** Kolun adı → çarpanı. A2 aile-başı ortanca, A3 mobilya ölçeği (kontrol kolu). */
const aileCarpan = (aile: Kalem['aile']): number => {
  const g = imalar.filter((i) => i.k.aile === aile).map((i) => i.ima).sort((a, b) => a - b);
  return g[Math.floor(g.length / 2)];
};
const A1 = ORTANCA;
const A2: Record<Kalem['aile'], number> = {
  mobilya: aileCarpan('mobilya'),
  bina: aileCarpan('bina'),
  yol: aileCarpan('yol'),
  arac: aileCarpan('arac'),
  bitki: aileCarpan('bitki'),
};
const A3 = 0.9; // kontrol kolu — mutfağın/dekorun ölçeği
yaz('KOLLAR:');
yaz(`  A1 TEK GLOBAL ÇARPAN  = ${n3(A1)}  (ortanca; tüm paket aynı ölçek → paket kendi içinde tutarlı kalır)`);
yaz(
  `  A2 AİLE BAŞI ÇARPAN   = mobilya ${n3(A2.mobilya)} · bina ${n3(A2.bina)} · yol ${n3(A2.yol)} · araç ${n3(A2.arac)} · bitki ${n3(A2.bitki)}`,
);
yaz(`  A3 KONTROL 0,90       = mobilyanın ölçeği — paket sokak olduğu için bekleniyor ki SAÇMA çıksın`);
yaz();
yaz('  ⚠ A2 KOLUNUN YÖNTEM KUSURU (araç kendi kusurunu basar): bir ailede TEK ölçülen model varsa');
for (const aile of ['mobilya', 'bina', 'yol', 'arac', 'bitki'] as const) {
  const say = imalar.filter((i) => i.k.aile === aile).length;
  yaz(
    `     ${aile.padEnd(9)} ${say} model` +
      (say <= 1
        ? '  ← TAUTOLOJİ: çarpan o modelden türüyor, sapması zorunlu olarak %0 çıkar. A2 sütunu bu satırda BİLGİ TAŞIMAZ.'
        : say === 2 && aile === 'arac'
          ? '  ← iki model AYNI ölçüde (car_sedan = car_taxi); bağımsız kanıt yine tek.'
          : ''),
  );
}
yaz();
yaz('Her kolun her modelde ürettiği DÜNYA ölçüsü ve gerçekten sapması:');
yaz('model'.padEnd(18) + '  gerçek |    A1     sapma |    A2     sapma |    A3     sapma');
for (const { k } of imalar) {
  const b = olc('kaykit-city-builder-bits', k.ad);
  const ham = b.boyut[k.eksen];
  const sat = [A1, A2[k.aile], A3].map((s) => {
    const d = ham * s;
    return n2(d) + yz(d / k.gercek - 1).padStart(8);
  });
  yaz(k.ad.padEnd(18) + n2(k.gercek) + ' |' + sat.join(' |'));
}
yaz();

const z1 = LAYOUT.area.maxZ + 0.5; // ön duvar hattı — Scene.Street ile aynı türetme
const dx0 = doorX(1);
const giris = entranceAt(1);
const sokak = streetAt(1);

// ============================================================================================
//  §V GÖRÜNÜRLÜK — §B/§C/§D'den ÖNCE sorulması gereken soru
// ============================================================================================
//
// Kamera oyuncunun **+z'sinde** durur (`pz + 8,50`) ve **−z'ye** bakar. Sokak ise oyuncunun
// +z'sinde, yani KAMERANIN ARKASINDA olabilir. "Şu model şu kadar güzel/pahalı" diye tartışmadan
// önce ölçülmesi gereken şey: o model EKRANA GİRİYOR MU?
//
// Ölçüt: nokta kameranın önünde mi (ileri yönle iç çarpım > 0) ve görüş konisinin içinde mi.
// fov 50 düşey → yarım açı 25°; landscape 16:9'da yatay yarım açı atan(tan25° × 16/9).
const YARIM_DUSEY = (CAMERA_FOV * Math.PI) / 360;
const YARIM_YATAY = Math.atan(Math.tan(YARIM_DUSEY) * (16 / 9));
/** Oyuncu (px,pz) iken P noktası kadrajda mı? */
function kadrajda(px: number, pz: number, P: number[], d = CAMERA_DIST): boolean {
  const C = [px, d, pz + d];
  const T = [px, CAMERA_LOOK_Y, pz];
  const f = [T[0] - C[0], T[1] - C[1], T[2] - C[2]];
  const fn = Math.hypot(...f);
  const fu = f.map((v) => v / fn);
  const v = [P[0] - C[0], P[1] - C[1], P[2] - C[2]];
  const ileri = v[0] * fu[0] + v[1] * fu[1] + v[2] * fu[2];
  if (ileri <= 0) return false;
  // kamera sağ ekseni: f × yukarı(0,1,0), normalize
  const r = [fu[2] * 1 - 0, 0, -(fu[0] * 1)];
  const rn = Math.hypot(...r) || 1;
  const ru = r.map((x) => x / rn);
  const u = [ru[1] * fu[2] - ru[2] * fu[1], ru[2] * fu[0] - ru[0] * fu[2], ru[0] * fu[1] - ru[1] * fu[0]];
  const sag = v[0] * ru[0] + v[1] * ru[1] + v[2] * ru[2];
  const yuk = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
  return Math.abs(Math.atan2(sag, ileri)) < YARIM_YATAY && Math.abs(Math.atan2(yuk, ileri)) < YARIM_DUSEY;
}
/** Oyuncunun yürüyebildiği tüm kat taranır: nokta kaç konumdan kadrajda? */
function gorunurluk(P: number[], d = CAMERA_DIST): number {
  let var_ = 0;
  let toplam = 0;
  for (let px = -FLOOR_HALF + 1; px <= FLOOR_HALF - 1; px += 2)
    for (let pz = BAND.front + 1; pz <= FLOOR_HALF - 0.5; pz += 1) {
      if (kadrajda(px, pz, P, d)) var_++;
      toplam++;
    }
  return var_ / toplam;
}

yaz('§V GÖRÜNÜRLÜK — sokaktaki hangi şerit EKRANA GİRİYOR? (§B/§C/§D\'den ÖNCEKİ soru)');
yaz('-'.repeat(112));
yaz(`kamera oyuncunun +z'sinde (pz + ${n2(CAMERA_DIST)}) ve −z'ye bakıyor → +z'deki sokak ARKADA kalabilir.`);
yaz(`fov ${CAMERA_FOV} → yarım düşey ${((YARIM_DUSEY * 180) / Math.PI).toFixed(1)}° · yarım yatay (16:9) ${((YARIM_YATAY * 180) / Math.PI).toFixed(1)}°`);
yaz(`oyuncunun z tavanı ${n2(FLOOR_HALF)} → kameranın z tavanı ${n2(FLOOR_HALF + CAMERA_DIST)}`);
yaz();
const SERITLER: [string, number, number][] = [
  ['salonun ön duvarı', z1, 1.6],
  ['kapı önü / tente', 17.9, 2.57],
  ['kaldırım (bahçe masaları)', z1 + 1.15, 0.4],
  ['kaldırım dış kenarı', z1 + 2.4, 0.1],
  ['müşteri beliriş noktası', 20.5, 0.9],
  ['asfaltın ÖN kenarı', 20.0, 0.1],
  ['asfalt cadde (orta)', z1 + 5.5, 0.1],
  ['KARŞI BİNALAR (bugünkü kutular)', z1 + 9, 3.0],
  ['KayKit binası (7,27 derin, ön yüzü 26,3)', 29.9, 5.0],
  ['KayKit binası TEPESİ (building_H)', 29.9, 11.09],
  ['bugünkü kutunun TEPESİ', 26.5, 7.0],
  ['bugünkü kutunun ÖN yüzü (en yakın nokta)', 25.5, 4.0],
];
yaz('şerit'.padEnd(42) + '     z      y   taban  uzaklaş  portre');
for (const [ad, z, y] of SERITLER) {
  const o = gorunurluk([dx0, y, z]);
  const oz = gorunurluk([dx0, y, z], CAMERA_DIST * CAMERA_ZOOM_OUT_MUL);
  const op = gorunurluk([dx0, y, z], CAMERA_DIST * CAMERA_PORTRAIT_CLAMP);
  yaz(ad.padEnd(42) + n2(z) + n2(y) + '  ' + yz(o) + '  ' + yz(oz) + '  ' + yz(op) + (o + oz + op === 0 ? '   <<< HİÇBİR KİPTE YOK' : ''));
}
yaz();
yaz('UZAKLAŞ = HUD düğmesi (×1,35 → 11,48) · PORTRE = dar ekran kelepçesi (×1,30 → 11,05).');
yaz('Üç kipin üçünde de %0 çıkan bir şey ekrana HİÇ girmiyor demektir — çizmenin bedeli var, karşılığı yok.');
yaz();

// ============================================================================================
//  §B KARŞI BİNALAR
// ============================================================================================
const BUGUN_BINA = { w: 3, d: 2, z: z1 + 9, adim: 3.4, n: 9, hMin: 4, hMax: 7 };

yaz('§B KARŞI BİNALAR — bugün 9 renkli KUTU; paket 8 gerçek bina veriyor');
yaz('-'.repeat(112));
yaz(`bugünkü hat: ${BUGUN_BINA.n} kutu × ${n2(BUGUN_BINA.w)} en, adım ${n2(BUGUN_BINA.adim)}, z = ${n2(BUGUN_BINA.z)}, boy ${BUGUN_BINA.hMin}…${BUGUN_BINA.hMax}`);
yaz(`hat uzunluğu: ${n2((BUGUN_BINA.n - 1) * BUGUN_BINA.adim + BUGUN_BINA.w)} br · kat cephesi (asfalt eni) 56 br`);
yaz();
yaz('model'.padEnd(24) + 'ham en × boy × der   |  A1 dünya en × boy × der  | üçgen | insan oranı (boy/1,75)');
const BINALAR = ['building_A', 'building_B', 'building_C', 'building_D', 'building_E', 'building_F', 'building_G', 'building_H'];
let binaUcgen = 0;
for (const ad of BINALAR) {
  const b = olc('kaykit-city-builder-bits', ad);
  const t = ucgenSayisi('kaykit-city-builder-bits', ad);
  binaUcgen += t;
  const s = A2.bina;
  yaz(
    ad.padEnd(24) +
      n2(b.boyut[0]) + n2(b.boyut[1]) + n2(b.boyut[2]) + '  |' +
      n2(b.boyut[0] * s) + n2(b.boyut[1] * s) + n2(b.boyut[2] * s) + '  |' +
      String(t).padStart(6) + ' |' +
      n2((b.boyut[1] * s) / ACTOR_HEIGHT) + ' kat insan',
  );
}
yaz();
const binaEn = olc('kaykit-city-builder-bits', 'building_A').boyut[0] * A2.bina;
yaz(`bina eni (A2) = ${n2(binaEn)} → 56 br cepheye ${Math.floor(56 / binaEn)} bina sığar (bugün ${BUGUN_BINA.n} kutu var)`);
yaz(`8 binanın toplam üçgeni = ${binaUcgen} · bugünkü 9 kutu = ${9 * 12} üçgen · fark ×${(binaUcgen / (9 * 12)).toFixed(1)}`);
yaz();
yaz('`_withoutBase` varyantı — paketin binası KENDİ 2×2 KAROSUYLA geliyor (base dahil):');
for (const ad of ['building_A', 'building_A_withoutBase']) {
  const b = olc('kaykit-city-builder-bits', ad);
  yaz(`  ${ad.padEnd(26)} ${n3(b.boyut[0])} × ${n3(b.boyut[1])} × ${n3(b.boyut[2])}  ·  minY ${n3(b.mn[1])}`);
}
yaz('  → base\'li varyant zemine karo basar; bizim sokağımızda zaten asfalt var → çakışma riski.');
yaz();

// ============================================================================================
//  §C YOL KAROSU
// ============================================================================================
const BUGUN_YOL = { asfaltW: 56, asfaltD: 6, asfaltZ: z1 + 5.5, kaldirimW: 40, kaldirimD: 2.4, kaldirimZ: z1 + 1.2 };
yaz('§C YOL — bugün 56 × 6 düz DÜZLEM; paket 2×2 karo veriyor');
yaz('-'.repeat(112));
yaz(`bugünkü asfalt : ${n2(BUGUN_YOL.asfaltW)} × ${n2(BUGUN_YOL.asfaltD)} @ z ${n2(BUGUN_YOL.asfaltZ)}`);
yaz(`bugünkü kaldırım: ${n2(BUGUN_YOL.kaldirimW)} × ${n2(BUGUN_YOL.kaldirimD)} @ z ${n2(BUGUN_YOL.kaldirimZ)}`);
yaz();
for (const ad of ['road_straight', 'road_straight_crossing', 'road_corner', 'road_junction', 'road_tsplit', 'base']) {
  const b = olc('kaykit-city-builder-bits', ad);
  const t = ucgenSayisi('kaykit-city-builder-bits', ad);
  yaz(
    ad.padEnd(24) + `ham ${n3(b.boyut[0])} × ${n3(b.boyut[1])} × ${n3(b.boyut[2])}  →  A2-yol ` +
      `${n2(b.boyut[0] * A2.yol)} × ${n2(b.boyut[1] * A2.yol)} × ${n2(b.boyut[2] * A2.yol)}  · ${String(t).padStart(5)} üçgen`,
  );
}
// Karo "yol" mu, "yol + kendi kaldırımı" mı? Bunu bbox söylemez — ATLAS GÖZÜ söyler: aynı göze
// düşen köşeler aynı boyanın parçasıdır, o kümenin x/z aralığı da o boyanın kapladığı şerittir.
// (S3 dersinin uygulaması: ada bakma, ölç. "road_straight" adı tek başına yolun eni demek değil.)
function uvKume(p: Paket, ad: string): { goz: string; n: number; x: [number, number]; z: [number, number] }[] {
  const dosya = yol(p, ad);
  const g = JSON.parse(readFileSync(dosya, 'utf8'));
  const bin = readFileSync(dosya.replace(/\.gltf$/, '.bin'));
  const al = (i: number) => {
    const a = g.accessors[i];
    const bv = g.bufferViews[a.bufferView];
    return { a, base: (bv.byteOffset ?? 0) + (a.byteOffset ?? 0) };
  };
  const pr = g.meshes[0].primitives[0];
  const { a: pa, base: pb } = al(pr.attributes.POSITION);
  const { a: ua, base: ub } = al(pr.attributes.TEXCOORD_0);
  const kume = new Map<string, { n: number; x: [number, number]; z: [number, number] }>();
  for (let i = 0; i < pa.count; i++) {
    const x = bin.readFloatLE(pb + i * 12);
    const z = bin.readFloatLE(pb + i * 12 + 8);
    const u = bin.readFloatLE(ub + i * 8);
    const v = bin.readFloatLE(ub + i * 8 + 4);
    const k = `${Math.floor(v * 4)},${Math.floor(u * 8)}`;
    const o = kume.get(k) ?? { n: 0, x: [9, -9] as [number, number], z: [9, -9] as [number, number] };
    o.n++;
    o.x = [Math.min(o.x[0], x), Math.max(o.x[1], x)];
    o.z = [Math.min(o.z[0], z), Math.max(o.z[1], z)];
    kume.set(k, o);
  }
  return [...kume].map(([goz, o]) => ({ goz, ...o })).sort((a, b) => b.n - a.n);
}
yaz('KARO GERÇEKTEN NE KADARI YOL? — atlas gözü kümeleri (ad değil geometri konuşuyor):');
for (const s of uvKume('kaykit-city-builder-bits', 'road_straight'))
  yaz(`  göz [${s.goz}] ${String(s.n).padStart(3)} köşe · x ${n2(s.x[0])} … ${n2(s.x[1])} · z ${n2(s.z[0])} … ${n2(s.z[1])}`);
yaz('  → orta çizgi dizisi Z ekseninde uzanıyor (karo yola dik gelmek için π/2 döner).');
yaz('  → asfalt şeridi karonun tamamı DEĞİL; kalan pay karonun kendi kaldırımı. Oyunun 2,40\'lık');
yaz('    gri kaldırımıyla yan yana gelirse EKRANDA İKİ KALDIRIM olur.');
yaz();
const karoW = olc('kaykit-city-builder-bits', 'road_straight').boyut[0] * A2.yol;
yaz();
yaz(`KARO ENİ (A2-yol) = ${n2(karoW)} br`);
yaz(`  56 br cepheye ${(56 / karoW).toFixed(2)} karo → ${Math.round(56 / karoW)} karo döşenirse artık ${n2(56 - Math.round(56 / karoW) * karoW)} br`);
yaz(`  asfalt bandı 6 br derin, karo ${n2(karoW)} derin → ${(6 / karoW).toFixed(2)} karo sığar (TAM SAYI DEĞİLSE yol bandı büyümek zorunda)`);
yaz(`  56 br'yi ${Math.round(56 / karoW)} karoya bölmek için gerekli gerilme: ${yz(56 / Math.round(56 / karoW) / karoW - 1)}`);
yaz();

// ============================================================================================
//  §D SOKAK MOBİLYASI — kaldırıma sığıyor mu, müşteri yolunu kapatıyor mu?
// ============================================================================================
const dx2 = doorX(2);
/** Müşteri yolu: kaldırımdaki beliriş noktasından kapı eşiğine düz hat; iki yanında oyuncu çapı kadar pay. */
const YOL_YARIM = PLAYER_RADIUS * 2; // çift yönlü akış: iki NPC yan yana geçebilmeli

yaz('§D SOKAK MOBİLYASI — kaldırım 2,40 br derin · müşteri yolu kapıdan kaldırıma iniyor');
yaz('-'.repeat(112));
yaz(`kapı x: 1 alan açıkken ${n2(dx0)} · 2+ alan açıkken ${n2(dx2)} (DOOR_MOVES_AT)`);
yaz(`müşteri yolu: sokak ${n2(sokak[0])},${n2(sokak[2])} → giriş ${n2(giris[0])},${n2(giris[2])} · koridor yarısı ${n2(YOL_YARIM)}`);
yaz();
yaz('model'.padEnd(18) + 'A1 dünya en×boy×der      | A2 dünya en×boy×der      | ayak izi | kaldırıma(2,40) | üçgen');
const MOBILYA = ['streetlight', 'bench', 'bush', 'car_taxi', 'firehydrant', 'dumpster', 'trash_A', 'trash_B', 'trafficlight_A', 'box_A'];
for (const ad of MOBILYA) {
  const b = olc('kaykit-city-builder-bits', ad);
  const t = ucgenSayisi('kaykit-city-builder-bits', ad);
  const aile: Kalem['aile'] = ad.startsWith('car_') ? 'arac' : ad === 'bush' ? 'bitki' : 'mobilya';
  const s2 = A2[aile];
  const ayak = Math.max(b.boyut[0], b.boyut[2]) * s2;
  const sigar = ayak <= BUGUN_YOL.kaldirimD ? `sığar (${n2(BUGUN_YOL.kaldirimD - ayak)} pay)` : `SIĞMAZ (${n2(ayak - BUGUN_YOL.kaldirimD)} taşar)`;
  yaz(
    ad.padEnd(18) +
      n2(b.boyut[0] * A1) + n2(b.boyut[1] * A1) + n2(b.boyut[2] * A1) + '  |' +
      n2(b.boyut[0] * s2) + n2(b.boyut[1] * s2) + n2(b.boyut[2] * s2) + '  |' +
      n2(ayak) + '  | ' + sigar.padEnd(16) + String(t).padStart(5),
  );
}
yaz();
yaz('BUGÜN kaldırımda duran elle çizimler (yerlerini bunlar dolduruyor — takas edilecekler):');
yaz(`  bahçe masası ×2  @ x = kapı ∓2,30, z = ${n2(z1 + 1.15)} · tabla çapı 0,72 · tabure ×4`);
yaz(`  saksı ×2         @ x = kapı ∓1,70, z = ${n2(z1 + 0.42)} · çap 0,32`);
yaz(`  → yeni sokak mobilyası bunların DIŞINA konmalı; ikisi de kapıya ${n2(1.7)}…${n2(2.3)} br mesafede.`);
yaz();

// ============================================================================================
//  §E PENCERE — kullanıcının "pencere duvardan ayrı duruyor" şikâyeti
// ============================================================================================
// Modülün deliği IŞIN testiyle ölçülür (S4 dersi: vertex saymak yanlış sonuç verir — düz yüzün
// ortasında hiç vertex yoktur ve tarama duvarın ortasını "delik" sanar).
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
  const pr = g.meshes[0].primitives[0];
  const { a: pa, base: pb } = al(pr.attributes.POSITION);
  const pos = new Float32Array(pa.count * 3);
  for (let i = 0; i < pa.count * 3; i++) pos[i] = bin.readFloatLE(pb + i * 4);
  const { a: ia, base: ib } = al(pr.indices);
  const idx = new Uint32Array(ia.count);
  const boy = ia.componentType === 5121 ? 1 : ia.componentType === 5123 ? 2 : 4;
  for (let i = 0; i < ia.count; i++)
    idx[i] = boy === 1 ? bin.readUInt8(ib + i) : boy === 2 ? bin.readUInt16LE(ib + i * 2) : bin.readUInt32LE(ib + i * 4);
  const t: Ucgen[] = [];
  const v = (k: number) => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]];
  for (let i = 0; i < idx.length; i += 3) t.push([v(idx[i]), v(idx[i + 1]), v(idx[i + 2])]);
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
function delikler(ad: string, y: number, adim = 0.02): [number, number][] {
  const tri = ucgenGeo(ad);
  const b = olc('kaykit-restaurant-bits', ad);
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

yaz('§E PENCERE — kullanıcı: "pencere duvardan ayrı duruyor". Modül mü, gömme mi?');
yaz('-'.repeat(112));
const KAY_S = WALL_H / 4; // mimari ölçek (wallLook.KAY_S ile aynı sayı, aynı gerekçe)
const pencHam = olc('kaykit-restaurant-bits', 'wall_window_open');
const genisDelik = (ad: string, y: number) => delikler(ad, y).some(([a, b]) => b - a > 1.0);
let pAlt = 9;
let pUst = 0;
for (let y = 0.2; y < 3.9; y += 0.05)
  if (genisDelik('wall_window_open', y)) {
    pAlt = Math.min(pAlt, y);
    pUst = Math.max(pUst, y + 0.05);
  }
const pencDelik = delikler('wall_window_open', (pAlt + pUst) / 2);
const delikEn = pencDelik.length ? pencDelik[0][1] - pencDelik[0][0] : 0;
const delikBoy = pUst - pAlt;
yaz(`modül ham        : ${n3(pencHam.boyut[0])} × ${n3(pencHam.boyut[1])} × ${n3(pencHam.boyut[2])}`);
yaz(`deliğin ham ölçüsü: en ${n3(delikEn)} · boy ${n3(delikBoy)} (y ${n3(pAlt)} … ${n3(pUst)})`);
yaz();
yaz('OYUNUN pencere bandı (config/decor.WINDOW · maket v13):');
yaz(`  denizlik ${n2(WINDOW.sill)} · pencere başı ${n2(WINDOW.top)} → BOY ${n2(WINDOW.top - WINDOW.sill)} · çizilen EN 3,20`);
yaz(`  duvar: yükseklik ${n2(WALL_H)} · lambri kuşağı 0…${n2(WAINSCOT_H)} · çıta ${n2(0.94)} · en kalın katman 0,26`);
yaz();
yaz('KOLLAR:');
const E1 = { s: KAY_S, ad: 'E1 modül mimari ölçekte (0,80 — duvarla aynı sayı)' };
const E2s = (WINDOW.top - WINDOW.sill) / delikBoy;
const E2 = { s: E2s, ad: 'E2 modül PENCERE BANDINA çekilir (delik boyu = 1,65 olsun)' };
for (const kol of [E1, E2]) {
  const s = kol.s;
  yaz(`  ${kol.ad}`);
  yaz(`     ölçek ${n3(s)} → modül eni ${n2(pencHam.boyut[0] * s)} · modül boyu ${n2(pencHam.boyut[1] * s)} · kalınlık ${n2(pencHam.boyut[2] * s)}`);
  yaz(`     delik  ${n2(delikEn * s)} en × ${n2(delikBoy * s)} boy   (oyunun bandı 3,20 × ${n2(WINDOW.top - WINDOW.sill)})`);
  yaz(`     delik alt kenarı y = ${n2(pAlt * s)}  (oyunun denizliği ${n2(WINDOW.sill)} → fark ${n2(pAlt * s - WINDOW.sill)})`);
  yaz(`     modül boyu ↔ duvar ${n2(WALL_H)}: fark ${n2(pencHam.boyut[1] * s - WALL_H)}  ${Math.abs(pencHam.boyut[1] * s - WALL_H) > 0.05 ? '<<< DUVARLA AYNI BOYDA DEĞİL' : ''}`);
  yaz(`     kalınlık ↔ oyunun hattı 0,26: ${n2(pencHam.boyut[2] * s - 0.26)} fazla → her iki yüzden ${n2((pencHam.boyut[2] * s - 0.26) / 2)} taşar`);
  yaz(`     D-100 RİSKİ — modülün kendi yatay oluğu ham y = 2,00 → dünya ${n2(2 * s)} · maketin lambrisi ${n2(0.94)} · SAPMA ${n2(2 * s - 0.94)}`);
}
yaz();
yaz('  E3 ÇİZİMİ DUVARA GÖMME (model yok — bugünkü Pencere\'nin duvar yüzünden taşması sıfırlanır)');
yaz(`     bugün cam z +0,015 · doğrama z +0,030 (kalınlık 0,05 → yüzü +0,055) · denizlik ${n2(DENIZLIK_DERINLIK)} derin`);
yaz(`     duvar yüzü = en kalın katman/2 = ${n2(0.26 / 2)} → doğrama duvarın önünde ${n2(0.055 - 0.0)} duruyor,`);
yaz(`     yani duvar YÜZEYİNE YAPIŞIK bir levha (niş yok). Kullanıcının gördüğü "ayrı duruyor" bu.`);
yaz(`     gömme = duvar gövdesinden ${n2(WINDOW.top - WINDOW.sill)} × 3,20'lik parça KESİLİR + kasa eklenir.`);
yaz(`     bedel: duvar parçası tek kutu değil, kesme `+`wallBoxes`+`'ı ${'(3 katman)'} etkiler.`);
yaz();
yaz('  E4 BUGÜNKÜ (kontrol) — üç sinyal: derin denizlik + açık doğrama + duvar tepesinde lento kapağı');
yaz(`     3 pencere × (cam 1 + doğrama 4 + denizlik 2 + lento 1) = ${3 * 8} mesh`);
yaz();

// ============================================================================================
//  §F TENTE — "eğik tente ekranı kapatıyor" gerekçesi SAYIYLA sınanıyor
// ============================================================================================
// Kamera (Scene.CameraRig): konum (px, d, pz + d) · bakış (px, CAMERA_LOOK_Y, pz) · d = CAMERA_DIST.
// Soru: kameradan oyuncuya giden ışın tentenin kutusunu kesiyor mu?
interface Kutu { x: number; y: number; z: number; w: number; h: number; d: number; rotX: number }
const TENTE: Kutu = { x: dx0, y: DOOR.height - 0.08, z: 17.9, w: 6.4, h: 0.18, d: 1.9, rotX: 0.18 };
const TABELA: Kutu = { x: dx0, y: 1.42, z: z1 + 0.3, w: 3.4, h: 0.34, d: 0.06, rotX: 0 };

/** Işın–kutu kesişimi (kutu x ekseninde döndürülmüş → ışın kutunun yerel eksenine taşınır). */
function kesisiyor(k: Kutu, o: number[], hedef: number[]): boolean {
  const d = [hedef[0] - o[0], hedef[1] - o[1], hedef[2] - o[2]];
  // yerel: merkeze taşı, −rotX ile döndür
  const c = Math.cos(-k.rotX);
  const s = Math.sin(-k.rotX);
  const don = (p: number[]) => {
    const y = p[1] - k.y;
    const z = p[2] - k.z;
    return [p[0] - k.x, y * c - z * s, y * s + z * c];
  };
  const o2 = don(o);
  const d2 = [d[0], d[1] * c - d[2] * s, d[1] * s + d[2] * c];
  const yari = [k.w / 2, k.h / 2, k.d / 2];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d2[i]) < 1e-9) {
      if (Math.abs(o2[i]) > yari[i]) return false;
      continue;
    }
    let a = (-yari[i] - o2[i]) / d2[i];
    let b = (yari[i] - o2[i]) / d2[i];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}

yaz('§F TENTE — "eğik tente kamera +z\'den bakınca ekranı kapatıyor" gerekçesi ÖLÇÜLÜYOR');
yaz('-'.repeat(112));
yaz(`kamera: konum (px, ${n2(CAMERA_DIST)}, pz + ${n2(CAMERA_DIST)}) · bakış (px, ${n2(CAMERA_LOOK_Y)}, pz)`);
yaz(`maket v13 tentesi: ${n2(TENTE.w)} × ${n2(TENTE.h)} × ${n2(TENTE.d)} @ (${n2(TENTE.x)}, ${n2(TENTE.y)}, ${n2(TENTE.z)}) · x-rot ${TENTE.rotX}`);
yaz(`bugünkü tabela   : ${n2(TABELA.w)} × ${n2(TABELA.h)} × ${n2(TABELA.d)} @ (${n2(TABELA.x)}, ${n2(TABELA.y)}, ${n2(TABELA.z)}) · dikey`);
yaz();
yaz('oyuncu kapıya yaklaşırken kamera→oyuncu ışını engelleniyor mu? (px = kapı x)');
yaz('oyuncu z'.padEnd(10) + 'kamera z'.padEnd(10) + 'TENTE       TABELA      not');
let tenteKapatma = 0;
let tabelaKapatma = 0;
let n = 0;
for (let pz = 8; pz <= 16.6; pz += 1.2) {
  const o = [dx0, CAMERA_DIST, pz + CAMERA_DIST];
  const hedef = [dx0, CAMERA_LOOK_Y, pz];
  const t = kesisiyor(TENTE, o, hedef);
  const b = kesisiyor(TABELA, o, hedef);
  if (t) tenteKapatma++;
  if (b) tabelaKapatma++;
  n++;
  yaz(
    n2(pz).padEnd(10) + n2(pz + CAMERA_DIST).padEnd(10) +
      (t ? 'KAPATIYOR ' : 'açık      ').padEnd(12) +
      (b ? 'KAPATIYOR ' : 'açık      ').padEnd(12) +
      (pz > 15 ? 'kapı eşiği' : ''),
  );
}
yaz();
yaz(`TENTE  ${tenteKapatma}/${n} konumda oyuncuyu kapatıyor · TABELA ${tabelaKapatma}/${n}`);
yaz();
yaz('Aynı test KAPI EŞİĞİNİN KENDİSİ için (müşteri kapıdan girip çıkarken görünüyor mu?):');
for (const [ad, k] of [['TENTE', TENTE], ['TABELA', TABELA]] as const) {
  let kapali = 0;
  let toplam = 0;
  for (let pz = 8; pz <= 16.6; pz += 0.4) {
    const o = [dx0, CAMERA_DIST, pz + CAMERA_DIST];
    if (kesisiyor(k, o, [dx0, 0.9, giris[2]])) kapali++;
    toplam++;
  }
  yaz(`  ${ad.padEnd(8)} kapı eşiği ${kapali}/${toplam} konumdan görünmez (${yz(kapali / toplam)})`);
}
yaz();
yaz('TENTENİN ALT KENARI (eğim yüzünden) ve kapı lentosu:');
const arka = TENTE.y + (TENTE.d / 2) * Math.sin(TENTE.rotX);
const on = TENTE.y - (TENTE.d / 2) * Math.sin(TENTE.rotX);
yaz(`  arka kenar y = ${n2(arka)} · ön kenar y = ${n2(on)} · kapı lentosu ${n2(DOOR.height)} · duvar tepesi ${n2(WALL_H)}`);
yaz(`  → tente lentonun ${arka > DOOR.height ? 'ÜSTÜNDEN' : 'ALTINDAN'} çıkıyor; maketin notu "lentonun ALTINDAN çıkar, alınlıktaki tabela kapanmasın".`);
yaz(`  insan oranı: tentenin altından geçen 1,75'lik biri ${n2(on - ACTOR_HEIGHT)} br boşlukla geçer.`);
yaz();
// ÜÇÜNCÜ KOL — "tente olsun ama kadrajı kapatmasın" bir SEÇENEK; seçenek koda değil VARYANTA
// yazılır (D-084). Maketin sayıları tek nokta; kapanma o noktanın değil, GEOMETRİNİN sonucu.
// Bu yüzden (y, derinlik) düzlemi taranıp kapanmanın nerede sıfırlandığı ölçülür.
yaz('F3 KOLU — "tente kalsın ama kadrajı kapatmasın" mümkün mü? (y × derinlik taraması)');
yaz('kapanma ölçütü: kapı eşiği kaç konumdan görünmez (maket tentesi = %77 · bugünkü tabela = %0)');
yaz();
const kapanma = (k: Kutu): number => {
  let kapali = 0;
  let toplam = 0;
  for (let pz = 8; pz <= 16.6; pz += 0.4) {
    if (kesisiyor(k, [dx0, CAMERA_DIST, pz + CAMERA_DIST], [dx0, 0.9, giris[2]])) kapali++;
    toplam++;
  }
  return kapali / toplam;
};
yaz('  y \\ derinlik' + [0.9, 1.3, 1.9].map((d) => `   der ${d.toFixed(1)}`).join(''));
for (const y of [1.9, 2.15, 2.4, 2.57, 2.8]) {
  const hucre = [0.9, 1.3, 1.9].map((der) => {
    const o = kapanma({ ...TENTE, y, d: der });
    return yz(o).padStart(10);
  });
  yaz(`  y ${n2(y)}   ` + hucre.join('') + (y + (1.9 / 2) * Math.sin(TENTE.rotX) > DOOR.height ? '   (lentonun üstünde)' : '   (lentonun altında)'));
}
yaz();
yaz('  NOT — tarama tentenin z\'sini SABİT tutuyor (17,90). Kapanma z\'ye de bağlı; bu tabloda');
yaz('  değişen yalnız yükseklik ve derinlik. Sıfır kapanma çıkan bir hücre "tente olur" demek');
yaz('  DEĞİLDİR: 1,75\'lik biri altından geçebilmeli (aşağıdaki geçiş payı sütunu).');
yaz();
// F4 — "tente kimliği DİKEY yüzeyle kurulur" kolu. Bugünkü tabelanın %0 kapatmasının sebebi
// yatay levha olmaması; o hâlde tabela BÜYÜTÜLÜRSE (fırfırlı saçak gibi) nereye kadar %0 kalır?
yaz('F4 KOLU — kimlik DİKEY yüzeyle: tabela büyütülürse kapanma nerede başlar?');
yaz('  tabela boyu   kapanma   (z 17,80 sabit, kalınlık 0,06)');
for (const h of [0.34, 0.6, 0.9, 1.2, 1.6]) {
  const merkez = 1.42 + (h - 0.34) / 2; // alt kenar sabit kalsın, yukarı büyüsün
  const o = kapanma({ ...TABELA, y: merkez, h });
  yaz(`  ${n2(h)} (merkez y ${n2(merkez)}, üst ${n2(merkez + h / 2)})  ${yz(o)}`);
}
// Bu tablonun ilk okunuşu YANLIŞTI: "dikey yüzey kadrajı hiç kesmez" diye yazılacaktı, oysa
// tarama 0,90'dan itibaren %14 gösteriyor. Kapanmayı belirleyen şey yüzeyin yönü değil ÜST
// KENARIN YÜKSEKLİĞİ — yatay levha üst kenarı yükseğe taşıdığı için pahalı, dikey yüzey ise
// aşağıda kaldığı sürece bedava. Sınır ölçülerek yazılır, tahmin edilmez:
{
  let sinir = 0;
  for (let h = 0.3; h <= 1.8; h += 0.02) {
    const merkez = 1.42 + (h - 0.34) / 2;
    if (kapanma({ ...TABELA, y: merkez, h }) === 0) sinir = merkez + h / 2;
  }
  yaz(`  → belirleyici olan yüzeyin YÖNÜ değil ÜST KENARIN yüksekliği: %0 kapanmanın sınırı üst kenar ${n2(sinir)}.`);
  yaz(`     bugünkü tabelanın üstü 1,59 → kimlik ${n2(sinir - 1.59)} br daha BÜYÜYEBİLİR (boy 0,34 → ${n2(0.34 + (sinir - 1.59))}) bedelsiz.`);
  yaz('     yatay levha (F1/F3) bu sınırı kaçınılmaz aşıyor, çünkü kapının üstünde durmak zorunda.');
}
yaz();
yaz('  geçiş payı (tentenin ÖN kenarı − 1,75):');
for (const y of [1.9, 2.15, 2.4, 2.57, 2.8]) {
  const onK = y - (1.9 / 2) * Math.sin(TENTE.rotX);
  yaz(`     y ${n2(y)} → ön kenar ${n2(onK)} → pay ${n2(onK - ACTOR_HEIGHT)} ${onK - ACTOR_HEIGHT < 0.15 ? '<<< KAFAYA ÇARPAR' : ''}`);
}
yaz();

// ============================================================================================
//  §G LAVABO MUSLUĞU — kullanıcı isteği 2026-09-10
// ============================================================================================
// "lavabodaki musluklar var ya, mutfakta oraya uygun sırıtmayacak musluklu bir şeyler var,
//  onlar koy — ama GRİ renkli hali var pakette, onu kullan."
// Renk MODEL ADINDAN varsayılmaz (S5'in en pahalı dersi): atlas gözünden ÖLÇÜLÜR.
const MOBILYA_S = 0.9; // kitchenLook.KITCHEN_S — mutfağın dondurduğu ölçek
const BUGUN_LAVABO = { w: 1.36, h: 2.1, d: 0.66, govdeH: 0.86, cizim: 8 };
const x2 = BAND_SHELL.innerRight;
const zBack = BAND_SHELL.innerBack;
const wcMinX = BAND.wc.minX;

yaz('§G LAVABO MUSLUĞU — kullanıcı isteği: paketin GRİ musluklu modeli WC\'ye geçsin mi?');
yaz('-'.repeat(112));
yaz(`bugünkü MaketSink : ${n2(BUGUN_LAVABO.w)} en × ${n2(BUGUN_LAVABO.h)} boy (ayna dahil) × ${n2(BUGUN_LAVABO.d)} der · ${BUGUN_LAVABO.cizim} mesh`);
yaz(`  gövde üstü ${n2(BUGUN_LAVABO.govdeH)} · musluk + boru ayrı silindirler · üstünde ayna çerçevesi + camı`);
yaz(`GERÇEK lavabo     : 0,60 en × 0,85 boy × 0,50 der (yaygın kabul)`);
yaz(`WC odası          : x ${n2(wcMinX)} … ${n2(x2)} · z ${n2(zBack)} … ${n2(BAND.front)} · lavabolar doğu duvarında x = ${n2(x2 - 0.45)}, dz ∓1,70`);
yaz();
const LAVABO_ADAY = ['kitchentable_sink', 'kitchentable_sink_large', 'kitchencounter_sink', 'kitchencounter_sink_backsplash'];

// İLK KOŞUNUN HATASI (S5'in dersi tekrar çıktı): modelin TOPLAM boyu 1,80 ham, ama bunun
// büyük kısmı MUSLUK KOLU. Toplam boyu 0,85'lik bir lavaboyla kıyaslamak "%91 sapma" gibi
// sahte bir sayı üretiyordu. Gövde ile musluk AYRI ölçülür: hangi y'den sonra geometri
// daralıyorsa orası tezgâh üstüdür (ışın testiyle, vertex sayımıyla değil).
/** `y` yüksekliğinde modelin DOLU x aralığının genişliği (ışın testi). */
function doluEn(ad: string, y: number, adim = 0.02): number {
  const tri = ucgenGeo(ad);
  const b = olc('kaykit-restaurant-bits', ad);
  let lo = Infinity;
  let hi = -Infinity;
  for (let x = b.mn[0] + adim / 2; x <= b.mx[0]; x += adim)
    if (tri.some((t) => vurusZ(t, x, y) !== null)) {
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
  return hi >= lo ? hi - lo : 0;
}
/**
 * TEZGÂH ÜSTÜ: modelin TAM ENİNDE dolu olduğu en yüksek y.
 *
 * İLK EŞİK YANLIŞTI ve profil yakaladı: ölçüt "en > tam enin YARISI" yazılmıştı ve çanağın
 * üstündeki 1,10 enindeki küçük parçaya (y = 1,146) yapıştı — yani tezgâh üstü 1,00 iken
 * ölçü 1,146 diyordu ve G1/G3'ün ölçekleri o yanlış ankrajdan türüyordu. Tezgâh üstü
 * "yarıdan geniş bir şey var" değil, "TABLA hâlâ tam" demektir → eşik %90.
 */
const TABLA_ESIK = 0.9;
function govdeUstu(ad: string): number {
  const b = olc('kaykit-restaurant-bits', ad);
  const tam = b.boyut[0];
  let son = b.mn[1];
  for (let y = b.mn[1] + 0.02; y < b.mx[1]; y += 0.02) if (doluEn(ad, y) > tam * TABLA_ESIK) son = y;
  return son;
}

yaz('ÖNCE MUSLUK — modelin boyunun ne kadarı TEZGÂH, ne kadarı MUSLUK KOLU? (ışın testi)');
yaz('kullanıcı "musluk" istedi; bu yüzden ölçülen şey tezgâhın boyu DEĞİL, musluğun boyu.');
yaz();
yaz('model'.padEnd(34) + 'toplam ham | gövde üstü | MUSLUK boyu | musluk eni | musluk / gövde');
const GOVDE: Record<string, number> = {};
for (const ad of LAVABO_ADAY) {
  const b = olc('kaykit-restaurant-bits', ad);
  const gu = govdeUstu(ad);
  GOVDE[ad] = gu;
  const muslukBoy = b.mx[1] - gu;
  const muslukEn = doluEn(ad, gu + muslukBoy / 2);
  yaz(
    ad.padEnd(34) + n3(b.boyut[1]) + ' |' + n3(gu) + '   |' + n3(muslukBoy) + '   |' +
      n3(muslukEn) + '  |' + n2(muslukBoy / gu).padStart(10),
  );
}
yaz();
yaz('`kitchentable_sink` EN PROFİLİ — "gövde üstü" tek eşikten okundu, eşik doğru mu? (tek sinyale güvenme)');
yaz('  ham y   dolu en   ne olduğu');
{
  const b = olc('kaykit-restaurant-bits', 'kitchentable_sink');
  const satir = (y: number) => {
    const en = doluEn('kitchentable_sink', y);
    yaz(`  ${n2(y)}   ${n3(en)}   ${en > b.boyut[0] * 0.9 ? 'TEZGÂH gövdesi' : en > b.boyut[0] * 0.3 ? 'çanak/kenar' : en > 0 ? 'MUSLUK kolu' : 'boş'}`);
  };
  for (let y = 0.1; y <= 1.8; y += 0.1) satir(y);
  // Eşiğin DÜŞTÜĞÜ yer 0,10'luk adımda bulanık kalıyor ve `govdeUstu` oradan türüyor →
  // geçiş bölgesi 0,02 adımla ayrıca taranır (ölçünün ankrajı bulanık bırakılmaz).
  yaz('  — geçiş bölgesi 0,02 adımla:');
  for (let y = 0.96; y <= 1.32; y += 0.02) satir(y);
}
yaz();
yaz('ADAYLAR — ham ölçü ve 0,90 (mutfağın ölçeği) dünya karşılığı:');
yaz('model'.padEnd(34) + 'ham en×boy×der       | 0,90 dünya en×boy×der  | tezgâh üstü | üçgen');
for (const ad of LAVABO_ADAY) {
  const b = olc('kaykit-restaurant-bits', ad);
  const t = ucgenSayisi('kaykit-restaurant-bits', ad);
  yaz(
    ad.padEnd(34) +
      n2(b.boyut[0]) + n2(b.boyut[1]) + n2(b.boyut[2]) + '  |' +
      n2(b.boyut[0] * MOBILYA_S) + n2(b.boyut[1] * MOBILYA_S) + n2(b.boyut[2] * MOBILYA_S) + '  |' +
      n2(GOVDE[ad] * MOBILYA_S).padStart(11) + ' |' + String(t).padStart(6),
  );
}
yaz();
yaz('BU BİR MUTFAK MODÜLÜ — WC lavabosu DEĞİL. Ölçü bunu söylüyor:');
yaz(`  paketin karosu 2,00 ham → 0,90'da ${n2(2 * MOBILYA_S)} br ENİNDE bir tezgâh.`);
yaz(`  gerçek WC lavabosu 0,60 en × 0,50 der · bugünkü MaketSink ${n2(BUGUN_LAVABO.w)} × ${n2(BUGUN_LAVABO.d)}.`);
yaz(`  yani model, konulacağı yerin ${(2 * MOBILYA_S / BUGUN_LAVABO.w).toFixed(1)} katı eninde ve ${(2 * MOBILYA_S / BUGUN_LAVABO.d).toFixed(1)} katı derinliğinde.`);
yaz('  → soru "geçsin mi" değil, "NASIL sığdırılsın": dört kol aşağıda.');
yaz();
yaz('KOLLAR — hepsi `kitchentable_sink` üzerinden (renk ölçümü aşağıda hangisinin GRİ olduğunu söylüyor):');
yaz();
const ADAY = 'kitchentable_sink';
const ah = olc('kaykit-restaurant-bits', ADAY);
const agu = GOVDE[ADAY];
/** Doğu duvarında üç lavabonun aralığı (maketin dz ∓1,70'i). */
const ARALIK = 1.7;
const DUVAR_UZ = BAND.front - zBack; // doğu duvarının kullanılabilir boyu
interface Kol { ad: string; sx: number; sy: number; sz: number; not: string }
const KOLLAR: Kol[] = [
  {
    ad: 'G1 kayGovde — bugünkü lavabo KUTUSUNA çekilir (mutfağın ön hattıyla aynı desen)',
    sx: BUGUN_LAVABO.w / ah.boyut[0],
    sy: BUGUN_LAVABO.govdeH / agu,
    sz: BUGUN_LAVABO.d / ah.boyut[2],
    not: 'yer/nav/collision HİÇ değişmez; bedel çarpıtma',
  },
  {
    ad: 'G2 TEKDÜZE ölçek, ENDEN türetilir (en = bugünkü 1,36)',
    sx: BUGUN_LAVABO.w / ah.boyut[0],
    sy: BUGUN_LAVABO.w / ah.boyut[0],
    sz: BUGUN_LAVABO.w / ah.boyut[0],
    not: 'çarpıtma yok; derinlik bugünkünün 2,1 katı',
  },
  {
    ad: 'G3 TEKDÜZE ölçek, TEZGÂH ÜSTÜNDEN türetilir (üst = 0,86 — insan oranı doğru)',
    sx: BUGUN_LAVABO.govdeH / agu,
    sy: BUGUN_LAVABO.govdeH / agu,
    sz: BUGUN_LAVABO.govdeH / agu,
    not: 'çarpıtma yok; insan oranı G4 ile birebir aynı',
  },
];
for (const k of KOLLAR) {
  const en = ah.boyut[0] * k.sx;
  const boy = ah.boyut[1] * k.sy;
  const der = ah.boyut[2] * k.sz;
  const ust = agu * k.sy;
  const carpitma = Math.max(k.sx, k.sy, k.sz) / Math.min(k.sx, k.sy, k.sz);
  const sigar = Math.floor(DUVAR_UZ / Math.max(en, ARALIK));
  yaz(`  ${k.ad}`);
  yaz(`     ölçek [${k.sx.toFixed(3)}, ${k.sy.toFixed(3)}, ${k.sz.toFixed(3)}]  · ÇARPITMA oranı ${carpitma.toFixed(2)}  ${carpitma > 1.5 ? '<<< GÖZLE OKUNUR (musluk basıklaşır)' : carpitma > 1.05 ? '(hafif)' : '(yok)'}`);
  yaz(`     dünya ${n2(en)} en × ${n2(boy)} boy × ${n2(der)} der · tezgâh üstü ${n2(ust)} = boyun ${yz(ust / ACTOR_HEIGHT)}'i (gerçek %49)`);
  yaz(`     musluk tepesi ${n2(boy)} = boyun ${yz(boy / ACTOR_HEIGHT)}'i · tezgâhtan ${n2(boy - ust)} yukarı`);
  yaz(`     ${ARALIK.toFixed(2)} aralıkta: ${en <= ARALIK ? `${n2(ARALIK - en)} boşluk` : `${n2(en - ARALIK)} ÇAKIŞMA → aralık ${n2(en + 0.2)} olmalı`}`);
  yaz(`     doğu duvarı ${n2(DUVAR_UZ)} br → ${sigar} lavabo sığar (maket 3 istiyor)`);
  yaz(`     odaya taşma ${n2(der)} · duvardan lavabo yüzüne ${n2(x2 - 0.45)} → yürüme ${n2(x2 - 0.45 - der / 2 - wcMinX)} kalır (oyuncu çapı ${n2(PLAYER_RADIUS * 2)})`);
  yaz(`     not: ${k.not}`);
  yaz();
}
yaz(`  G4 BUGÜNKÜ MaketSink (kontrol) — ${n2(BUGUN_LAVABO.w)} × ${n2(BUGUN_LAVABO.h)} × ${n2(BUGUN_LAVABO.d)} · ${BUGUN_LAVABO.cizim} mesh · musluk + boru ayrı silindir`);
yaz(`     tezgâh üstü ${n2(BUGUN_LAVABO.govdeH)} = boyun ${yz(BUGUN_LAVABO.govdeH / ACTOR_HEIGHT)}'i · üstünde AYNA var (adayların hiçbirinde yok)`);
yaz();
// ÖLÇÜLÜP ELENEN BEŞİNCİ KOL — "yalnız musluğu al, çanağı elle çizili bırak".
{
  const g = JSON.parse(readFileSync(`${RKOK}kitchentable_sink.gltf`, 'utf8'));
  const dugum = (g.nodes ?? []).length;
  const prim = (g.meshes ?? []).reduce((a: number, m: { primitives?: unknown[] }) => a + (m.primitives?.length ?? 0), 0);
  yaz('  G5 YALNIZ MUSLUK (çanak elle çizili kalır) — ÖLÇÜLDÜ ve ELENDİ:');
  yaz(`     model ${dugum} düğüm / ${prim} primitive taşıyor → musluk ayrı bir alt-nesne DEĞİL.`);
  yaz('     ayırmak için mesh\'in y > 1,24 köşelerini kesip yeni .gltf yazmak gerekir (çevrimdışı iş, bu turun dışı).');
}
yaz();
yaz('ANKRAJ SAĞLAMASI — tezgâh üstü 0,996 ham; paketin öbür tezgâhları da 1,000 (kitchencounter_straight_A).');
yaz('Yani ölçü modelin kendi tesadüfü değil, PAKETİN tezgâh düzlemi. `kayGovde` zaten bu 1,0\'ı varsayıyor.');
yaz();
yaz('RENK — "gri renkli hali" ADINDAN değil ATLAS GÖZÜNDEN ölçüldü (S5 dersi):');
const renkCache = new Map<Paket, { goz: number[]; ort: number[] }[]>();
const renkAl = (p: Paket) => {
  if (!renkCache.has(p)) renkCache.set(p, gozRenkleri(`public/assets/models/${p}/${DOKU[p]}`));
  return renkCache.get(p)!;
};
const hex = (v: number[]) => '#' + v.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
/** Doygunluk: gri bir rengin R=G=B'ye yakınlığı. 0 = tam gri. */
const doygunluk = (v: number[]) => (Math.max(...v) - Math.min(...v)) / Math.max(1, Math.max(...v));
for (const ad of LAVABO_ADAY) {
  const gz = gozler('kaykit-restaurant-bits', ad) as [string, number][];
  const renkler = renkAl('kaykit-restaurant-bits');
  const parca = gz.slice(0, 5).map(([k, say]) => {
    const [r, c] = k.split(',').map(Number);
    const rr = renkler.find((x) => x.goz[0] === r && x.goz[1] === c);
    return rr ? `[${k}]${hex(rr.ort)} doy ${doygunluk(rr.ort).toFixed(2)} ×${say}` : `[${k}]? ×${say}`;
  });
  yaz(`  ${ad.padEnd(34)} ${parca.join('  ')}`);
}
yaz();
yaz('KIYAS — bugünkü elle çizimin renkleri (maketten): gövde MC.wc1 · tezgâh #f1ece0 · çanak porselen · musluk çelik');
yaz();

// ============================================================================================
yaz('='.repeat(112));
yaz('BİTTİ — bu dosyada KARAR YOK. Kollar `docs/dis-cephe-raporu-s6.md` §Bulgular\'da.');
yaz('='.repeat(112));

writeFileSync('docs/olcum-dis-cephe.txt', cikti.join('\n') + '\n');
