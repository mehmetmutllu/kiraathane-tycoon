/**
 * olcum-onluk.mjs — S19b: önlüğün GÖVDEDEN ne kadar açıkta durması gerektiğini ölçer.
 *
 * S19a önlüğü kutudan yüzeye çevirdi (A2) ama kullanıcı bir kusur bildirdi: *"gövdenin
 * göğsündeki rozet önlüğün içinden çıkıyor, önlük parçalanmış gibi duruyor"*. Önce sorulan:
 * rozet AYRI bir düğüm mü (gizlenebilir), yoksa gövde mesh'inin parçası mı (gizlenemez,
 * önlük onun önüne geçmeli)?
 *
 * Cevap ölçüldü: dört gövdenin hiçbirinde ayrı bir süs düğümü YOK (`Knight_Body` tek parça).
 * Yani sayı şu: gövdenin göğüs kuşağındaki EN İLERİ tepe noktası. Önlüğün yarıçapı bunun
 * üstünde olmalı, yoksa rozet önlüğü deler.
 *
 * Ölçü HAM rig biriminde (gövde 2,204 ham = 1,75 dünya) — `kiyafetTak` da o birimde çalışır.
 * BIND pozu okunur (KayKit'te A-poz); önlük `chest` kemiğine takıldığı ve o kemik bind
 * pozunda kıpırdamadığı için göğüs kuşağı bu pozda doğru okunur.
 */
import { readFileSync } from 'node:fs';

const GOVDELER = ['Knight', 'Rogue', 'Barbarian', 'Ranger', 'Mage'];
const KOK = 'public/assets/models/kaykit-characters/';

/** glTF'i JSON + BIN olarak açar (gltfOku yalnız JSON döndürüyor, tepe noktası gerek). */
export function glbAc(dosya) {
  const b = readFileSync(dosya);
  let o = 12, j = null, bin = null;
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

/** Bir accessor'ın vec3 değerleri (yalnız FLOAT/VEC3 — POSITION hep öyle). */
export function vec3Oku(j, bin, idx) {
  const acc = j.accessors[idx];
  const bv = j.bufferViews[acc.bufferView];
  const bas = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const adim = bv.byteStride ?? 12;
  const cik = [];
  for (let i = 0; i < acc.count; i++) {
    const p = bas + i * adim;
    cik.push([bin.readFloatLE(p), bin.readFloatLE(p + 4), bin.readFloatLE(p + 8)]);
  }
  return cik;
}

/**
 * ÖNLÜĞÜN GERÇEK SORUSU. Önlük bir SİLİNDİR DİLİMİ: ekseni (x=0, z=EKSEN_Z) dikey, yayı +z'de
 * ortalı. O yüzden "gövde ne kadar ileri" (zMax) YANLIŞ sayıdır — doğru sayı, gövdenin o
 * eksenden olan YARIÇAPIdır. İkisi yayın ortasında aynıdır, KENARINDA ayrışır: yassı bir gövde
 * yayın kenarında öne değil YANA taşar ve önlüğü tam orada deler. Kullanıcının *"önlük
 * parçalanmış gibi"* dediği kusurun kalıbı budur.
 */
const EKSEN_Z = 0.02;
/** Tepe noktasının önlük eksenine göre kutup koordinatı. */
const kutup = (v) => ({ r: Math.hypot(v[0], v[2] - EKSEN_Z), a: Math.atan2(v[0], v[2] - EKSEN_Z) });

/** Bir yükseklik aralığında, bir yay içinde kalan gövdenin EKSENDEN en büyük yarıçapı. */
function yayIcindeYaricap(tepeler, yAlt, yUst, yay) {
  const icinde = tepeler.filter((v) => v[1] >= yAlt && v[1] < yUst && Math.abs(kutup(v).a) <= yay / 2);
  if (!icinde.length) return null;
  return +Math.max(...icinde.map((v) => kutup(v).r)).toFixed(4);
}

/** Önlüğün iki parçası: S19a'nın A2 kolunda yazılı ölçüler (rapor §A). */
const PARCALAR = {
  gogus: { yAlt: 0.62, yUst: 1.02, yay: (110 * Math.PI) / 180 },
  etek: { yAlt: 0.34, yUst: 0.66, yay: (220 * Math.PI) / 180 },
};

/** Bir gövdenin `*_Body` mesh'indeki tepe noktaları (model uzayı, bind pozu). */
export function govdeTepeleri(ad) {
  const { j, bin } = glbAc(`${KOK}${ad}.glb`);
  const dugum = j.nodes.filter((n) => n.mesh !== undefined).find((n) => /_Body$/.test(n.name));
  const cik = [];
  for (const pr of j.meshes[dugum.mesh].primitives) cik.push(...vec3Oku(j, bin, pr.attributes.POSITION));
  return cik;
}

/** Bu dosya doğrudan çalıştırıldığında ölçer; içe aktarıldığında yalnız okuyucularını verir. */
const ANA = (process.argv[1] ?? '').includes('olcum-onluk');

const rapor = { damga: new Date().toISOString(), birim: 'ham rig', govdeler: [] };

if (ANA) for (const ad of GOVDELER) {
  const { j, bin } = glbAc(`${KOK}${ad}.glb`);
  const meshliDugumler = j.nodes.filter((n) => n.mesh !== undefined);
  const govdeDugum = meshliDugumler.find((n) => /_Body$/.test(n.name));
  const suslar = meshliDugumler.filter((n) => !/_Body$|_Arm|_Leg|_Head$/.test(n.name)).map((n) => n.name);

  const tepeler = [];
  for (const pr of j.meshes[govdeDugum.mesh].primitives) tepeler.push(...vec3Oku(j, bin, pr.attributes.POSITION));

  // 0,04'lük dilimler: önlüğün her yüksekliğinde gövde eksenden ne kadar uzakta.
  const dilimler = [];
  for (let y = 0.30; y < 1.10; y += 0.04) {
    const band = tepeler.filter((v) => v[1] >= y && v[1] < y + 0.04);
    if (!band.length) continue;
    dilimler.push({
      y: +y.toFixed(2),
      adet: band.length,
      // Yayın ORTASI (dar bir koridor): gövdenin göğsünden ileri çıkan süs burada görünür.
      rOrta: yayIcindeYaricap(band, y, y + 0.04, (30 * Math.PI) / 180),
      // Göğüslüğün yayı: önlüğün yarıçapı bunun ÜSTÜNDE olmalı.
      rGogusYayi: yayIcindeYaricap(band, y, y + 0.04, PARCALAR.gogus.yay),
      // Eteğin yayı — çok daha geniş, gövdenin yanlarını da kapsar.
      rEtekYayi: yayIcindeYaricap(band, y, y + 0.04, PARCALAR.etek.yay),
    });
  }

  const parcaOlcusu = {};
  for (const [ad, p] of Object.entries(PARCALAR)) {
    parcaOlcusu[ad] = {
      gerekenYaricap: yayIcindeYaricap(tepeler, p.yAlt, p.yUst, p.yay),
      enUstDilim: yayIcindeYaricap(tepeler, p.yUst - 0.08, p.yUst, p.yay),
      enAltDilim: yayIcindeYaricap(tepeler, p.yAlt, p.yAlt + 0.08, p.yay),
    };
  }

  rapor.govdeler.push({
    govde: ad,
    onlukTakar: ['Knight', 'Rogue', 'Barbarian'].includes(ad),
    ayriSusDugumu: suslar,
    parca: parcaOlcusu,
    dilimler,
  });
}

/** Kod tek ölçü yazar: ÖNLÜK TAKAN üç gövdenin en kötüsü karar sayısıdır. */
const takanlar = rapor.govdeler.filter((g) => g.onlukTakar);
rapor.hukum = {
  eksenZ: EKSEN_Z,
  ayriSusDugumuVarMi: takanlar.some((g) => g.ayriSusDugumu.some((n) => /badge|emblem|crest|medal/i.test(n))),
  gogusGereken: +Math.max(...takanlar.map((g) => g.parca.gogus.gerekenYaricap)).toFixed(4),
  etekGereken: +Math.max(...takanlar.map((g) => g.parca.etek.gerekenYaricap)).toFixed(4),
};

if (ANA) console.log(JSON.stringify(rapor, null, 1));
