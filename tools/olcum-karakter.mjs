/**
 * olcum-karakter.mjs — S14: karakter kollarının GERÇEK bedelini ölçer.
 *
 * NEDEN: `docs/asset-secim-panosu.html` §3'teki altı kol (A…F) 2026-09-09'da **paketler
 * indirilmeden** yazıldı. S13 aynı panonun 6 görevinden 3'ünün çürüdüğünü gösterdi
 * (Holiday süs değil mobilya · Prototype ok değil kapı · Block hacim değil voxel), yani
 * indirmeden yazılmış hüküm bu projede güvenilir değil. Bu araç kolları dosyadan ölçer:
 *
 *   - karakter başına: parça mesh'leri (AD AD) · skinned mi · üçgen · ham boy · KB
 *   - EKİPMAN parçası ayrı düğüm mü → "sivilleştirme" mesh düzenleme mi, düğüm silme mi
 *   - iskelet ADI → animasyon paketleri aynı rig'e mi oturuyor (retarget gerekir mi)
 *   - animasyon paketlerinin KLİP ADLARI → tycoon'un istediği (yürü/dur/al/ver) var mı
 *   - ACTOR_HEIGHT 1,75'e çekme ölçeği + o ölçekte en/derinlik (blob kuralı: CAPSULE_RADIUS)
 *   - bugünkü ilkel gövdelerin bedeli (kol F tabanı) ve müşteri InstancedMesh'i
 *
 * Kullanım: node tools/olcum-karakter.mjs <paket-kökü>
 *           OLCUM_YAZ=1 node tools/olcum-karakter.mjs <paket-kökü>   → docs/olcum-karakter.json
 * Ham çıktı KARAR ÖNCESİ durumun damgasıdır; ancak OLCUM_YAZ=1 ile üzerine yazılır.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Matrix4, Vector3, Box3, Quaternion, CapsuleGeometry, SphereGeometry } from 'three';

/** Hedef aktör boyu — src/config/actor.ts'in TEK kaynağıyla aynı sayı olmalı. */
const ACTOR_HEIGHT = 1.75;
const CAPSULE_RADIUS = 0.3;
const NPC_TIPIK = 24; // salonda tipik müşteri (npcCount ~10-30)

/**
 * Fantezi/ekipman parçası: SİVİL gövdeye girmeyecek mesh. Karşılaştırma parçanın ROLÜNE
 * (adın son bölümü) bakar, adın tamamına değil — yoksa `Rogue_Hooded_Head` "hood" diye
 * ekipman sayılır ve karakterin BAŞI sökülür (ilk koşuda birebir bu oldu).
 */
const EKIPMAN = [
  'cape', 'cloak', 'helmet', 'visor', 'hood', 'hat', 'crown', 'shoulder', 'pauldron', 'pauldrons',
  'armor', 'sword', 'shield', 'staff', 'wand', 'bow', 'quiver', 'dagger', 'axe', 'spellbook',
  'horn', 'backpack', 'mask',
];
const ekipmanMi = (ad) => {
  const rol = ad.split('_').pop().toLowerCase();
  return EKIPMAN.some((k) => rol.startsWith(k) || rol.endsWith(k));
};

// ---------- glTF/GLB okuma ----------
export function gltfOku(dosya) {
  const b = readFileSync(dosya);
  if (b.slice(0, 4).toString() !== 'glTF') {
    return { j: JSON.parse(b.toString('utf8')), dosyaBayt: b.length };
  }
  let o = 12;
  let j = null;
  while (o < b.length) {
    const len = b.readUInt32LE(o);
    const typ = b.readUInt32LE(o + 4);
    if (typ === 0x4e4f534a) j = JSON.parse(b.slice(o + 8, o + 8 + len).toString('utf8'));
    o += 8 + len;
  }
  return { j, dosyaBayt: b.length };
}

/** Düğümün dünya matrisi (TRS zinciri) — bbox'ı doğru yere taşımak için. */
function dunyaMatrisleri(j) {
  const m = j.nodes.map(() => new Matrix4());
  const yerel = j.nodes.map((n) => {
    const mt = new Matrix4();
    if (n.matrix) return mt.fromArray(n.matrix);
    const q = n.rotation ?? [0, 0, 0, 1];
    return mt.compose(
      new Vector3(...(n.translation ?? [0, 0, 0])),
      new Quaternion(q[0], q[1], q[2], q[3]),
      new Vector3(...(n.scale ?? [1, 1, 1])),
    );
  });
  const yur = (i, ust) => {
    m[i].multiplyMatrices(ust, yerel[i]);
    for (const c of j.nodes[i].children ?? []) yur(c, m[i]);
  };
  for (const r of j.scenes?.[0]?.nodes ?? []) yur(r, new Matrix4());
  return m;
}

/**
 * Bir karakter dosyasının ölçüsü. SKINNED mesh'in POSITION accessor'ı BIND pozundadır
 * (KayKit'te A-poz); bu yüzden X açıklığı OMUZ değil KOL AÇIKLIĞIdır — araç ikisini
 * ayırmaz, sayıyı olduğu gibi verir, yorumu rapora bırakır.
 */
export function karakterOlc(dosya) {
  const { j, dosyaBayt } = gltfOku(dosya);
  const M = dunyaMatrisleri(j);
  const kutu = new Box3();
  let ucgen = 0;
  const parcalar = [];

  for (let i = 0; i < j.nodes.length; i++) {
    const n = j.nodes[i];
    if (n.mesh === undefined) continue;
    const mesh = j.meshes[n.mesh];
    let pUcgen = 0;
    const pKutu = new Box3();
    for (const pr of mesh.primitives) {
      const say = pr.indices !== undefined ? j.accessors[pr.indices].count : j.accessors[pr.attributes.POSITION].count;
      pUcgen += say / 3;
      const acc = j.accessors[pr.attributes.POSITION];
      if (acc.min && acc.max) {
        const a = new Box3(new Vector3(...acc.min), new Vector3(...acc.max));
        // SKINNED mesh'te düğüm dönüşümü iskelete aittir; geometri zaten model uzayındadır.
        if (n.skin === undefined) a.applyMatrix4(M[i]);
        pKutu.union(a);
      }
    }
    kutu.union(pKutu);
    ucgen += pUcgen;
    const ad = mesh.name ?? n.name ?? `mesh${n.mesh}`;
    const pBoyut = pKutu.isEmpty() ? new Vector3() : pKutu.getSize(new Vector3());
    parcalar.push({
      ad,
      ucgen: Math.round(pUcgen),
      skinned: n.skin !== undefined,
      ekipman: ekipmanMi(ad),
      yBoy: +pBoyut.y.toFixed(3),
      xBoy: +pBoyut.x.toFixed(3),
    });
  }

  const boyut = kutu.getSize(new Vector3());
  const olcek = boyut.y > 0 ? ACTOR_HEIGHT / boyut.y : 0;
  const ekipmanlar = parcalar.filter((p) => p.ekipman);
  // Kafa oranı ve OMUZ eni: gövde parçasının X'i (kollar hariç — A-poz kol açıklığı omuz değildir).
  const bas = parcalar.find((p) => /head|skull/i.test(p.ad) && !p.ekipman);
  const govde = parcalar.find((p) => /body|torso/i.test(p.ad));
  return {
    dosya: path.basename(dosya),
    kb: Math.round(dosyaBayt / 1024),
    ucgen: Math.round(ucgen),
    parca: parcalar.length,
    skinned: parcalar.some((p) => p.skinned),
    iskelet: (j.scenes?.[0]?.nodes ?? []).map((i) => j.nodes[i].name).join('+'),
    kemik: j.skins?.[0]?.joints?.length ?? 0,
    doku: (j.images ?? []).map((im) => im.name ?? im.uri ?? 'gömülü'),
    hamBoy: +boyut.y.toFixed(3),
    hamEn: +boyut.x.toFixed(3),
    hamDerinlik: +boyut.z.toFixed(3),
    olcek: +olcek.toFixed(3),
    enOlcekli: +(boyut.x * olcek).toFixed(3),
    derinlikOlcekli: +(boyut.z * olcek).toFixed(3),
    /** Kafanın boydaki payı — bugünkü sahip gövdesinde 0,42/1,29 = %33 (Player.tsx baş küresi). */
    basOrani: bas && boyut.y > 0 ? +((bas.yBoy / boyut.y) * 100).toFixed(1) : null,
    /** Omuz eni 1,75'e ölçeklenmiş — D-076 blob kuralı: kapsül eni 2×CAPSULE_RADIUS = 0,60. */
    omuzOlcekli: govde ? +(govde.xBoy * olcek).toFixed(3) : null,
    parcalar,
    ekipmanParca: ekipmanlar.map((p) => p.ad),
    ekipmanUcgen: ekipmanlar.reduce((s, p) => s + p.ucgen, 0),
    sivilUcgen: Math.round(ucgen) - ekipmanlar.reduce((s, p) => s + p.ucgen, 0),
  };
}

/** Animasyon paketi: hangi rig, kaç klip, klip adları. */
export function animOlc(dosya) {
  const { j, dosyaBayt } = gltfOku(dosya);
  // Klip dosyası mesh de taşıyor mu: KayKit'in animasyon .glb'leri mankenin gövdesini de
  // içinde taşır, yani "yalnız klip" değildir — repo bedeli bunu bilmeden hesaplanamaz.
  const ucgen = (j.meshes ?? []).reduce(
    (s, m) => s + m.primitives.reduce((t, pr) => t + (pr.indices !== undefined ? j.accessors[pr.indices].count : j.accessors[pr.attributes.POSITION].count) / 3, 0),
    0,
  );
  return {
    dosya: path.basename(dosya),
    kb: Math.round(dosyaBayt / 1024),
    iskelet: (j.scenes?.[0]?.nodes ?? []).map((i) => j.nodes[i].name).join('+'),
    kemik: j.skins?.[0]?.joints?.length ?? 0,
    meshUcgen: Math.round(ucgen),
    klip: (j.animations ?? []).map((a) => a.name),
  };
}

/** Kol F tabanı: bugünkü müşteri kapsülü + baloncuk (Customers.tsx'in birebir geometrisi). */
export function bugunkuKapsul() {
  const ucgen = (x) => (x.index ? x.index.count : x.attributes.position.count) / 3;
  return {
    kapsulUcgen: ucgen(new CapsuleGeometry(CAPSULE_RADIUS, ACTOR_HEIGHT - 2 * CAPSULE_RADIUS, 6, 10)),
    baloncukUcgen: ucgen(new SphereGeometry(0.14, 10, 10)),
  };
}

/** Bugünkü gövdeler: kaç ayrı <mesh> elle yazılmış (bakım yükü + "parça" karşılığı). */
export function ilkelGovdeler() {
  const say = (f) => ((readFileSync(f, 'utf8').match(/<mesh[\s>]/g) ?? []).length);
  return {
    'Player.tsx': say('src/components/three/Player.tsx'),
    'Waiter.tsx': say('src/components/three/Waiter.tsx'),
    'Dishwasher.tsx': say('src/components/three/Dishwasher.tsx'),
    'Customers.tsx': say('src/components/three/Customers.tsx'),
  };
}

// ---------- doğrudan koşu ----------
const DOGRUDAN = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (DOGRUDAN) {
  const KOKLER = process.argv.slice(2).filter((p) => existsSync(p));
  if (!KOKLER.length) {
    console.error('kullanım: node tools/olcum-karakter.mjs <indirilen-paket-kökü> [başka-kök ...]');
    process.exit(1);
  }
  const bul = (dizin, f) => {
    const cik = [];
    for (const e of readdirSync(dizin)) {
      const p = path.join(dizin, e);
      if (statSync(p).isDirectory()) cik.push(...bul(p, f));
      else if (f(p)) cik.push(p);
    }
    return cik;
  };

  // Dosya ADINA değil İÇERİĞİNE göre ayır: iskeletli+meshli = karakter, klipli = animasyon.
  // (Ad kalıbı paketten pakete değişiyor; KayKit `Characters/gltf`, Quaternius `Base Characters`.)
  const hepsi = KOKLER.flatMap((k) => bul(k, (p) => /\.(glb|gltf)$/i.test(p)));
  const karakterDosya = [];
  const animDosya = [];
  let skinsizMesh = 0;
  for (const d of hepsi) {
    let j;
    try { ({ j } = gltfOku(d)); } catch { continue; }
    const meshli = (j.meshes?.length ?? 0) > 0;
    const iskeletli = (j.skins?.length ?? 0) > 0;
    // Klip taşıyan dosya ANİMASYON sayılır; içindeki manken gövdesi onu karakter yapmaz
    // (yoksa aynı manken 18 kez karakter tablosuna düşüyor — ilk koşuda öyle oldu).
    if ((j.animations?.length ?? 0) > 0) animDosya.push(d);
    else if (meshli && iskeletli) karakterDosya.push(d);
    else if (meshli) skinsizMesh++;
  }
  const karakterler = karakterDosya.map(karakterOlc);
  const animler = animDosya.map(animOlc);
  const taban = { ...bugunkuKapsul(), ilkel: ilkelGovdeler() };

  console.log('\n=== KARAKTERLER (indirilen, hepsi ücretsiz) ===');
  console.log(
    'dosya'.padEnd(26), 'KB'.padStart(5), 'üçgen'.padStart(7), 'parça'.padStart(6),
    'kemik'.padStart(6), 'iskelet'.padEnd(14), 'ölçek'.padStart(6), 'omuz'.padStart(6), 'baş%'.padStart(5), 'ekip'.padStart(5),
  );
  for (const k of karakterler) {
    console.log(
      k.dosya.padEnd(26), String(k.kb).padStart(5), String(k.ucgen).padStart(7),
      String(k.parca).padStart(6), String(k.kemik).padStart(6), k.iskelet.slice(0, 14).padEnd(14),
      String(k.olcek).padStart(6), String(k.omuzOlcekli ?? '—').padStart(6),
      String(k.basOrani ?? '—').padStart(5), String(k.ekipmanParca.length).padStart(5),
    );
  }
  console.log(`(iskeletsiz ama meshli ${skinsizMesh} dosya — silah/prop/mini-oyun maskotu, karakter sayılmadı)`);
  console.log('\n--- parça adları (sivilleştirme = düğüm silme mi, mesh düzenleme mi) ---');
  for (const k of karakterler) {
    console.log(`${k.dosya}  [${k.parcalar.map((p) => `${p.ad.replace(/^[^_]*_/, '')}${p.ekipman ? '*' : ''}:${p.ucgen}`).join(' ')}]`);
    if (k.ekipmanParca.length) {
      console.log(`   EKİPMAN(*) ${k.ekipmanParca.length} düğüm / ${k.ekipmanUcgen} üçgen → sökülünce sivil gövde ${k.sivilUcgen} üçgen`);
    }
  }

  console.log('\n=== ANİMASYON PAKETLERİ ===');
  for (const a of animler) {
    console.log(
      `${a.dosya.padEnd(32)} ${String(a.kb).padStart(5)} KB  rig=${a.iskelet.slice(0, 22)} kemik=${a.kemik} klip=${a.klip.length}` +
        (a.meshUcgen ? `  +gövde ${a.meshUcgen} üçgen` : ''),
    );
    console.log(`   ${a.klip.join(', ')}`);
  }

  console.log('\n=== BUGÜNKÜ (kol F tabanı) ===');
  console.log(`müşteri kapsülü ${taban.kapsulUcgen} üçgen · baloncuk ${taban.baloncukUcgen} · InstancedMesh: ${NPC_TIPIK} müşteri = 1 çizim, ${taban.kapsulUcgen * NPC_TIPIK} üçgen`);
  for (const [k, v] of Object.entries(taban.ilkel)) console.log(`   ${k.padEnd(18)} ${String(v).padStart(3)} adet <mesh>`);

  if (process.env.OLCUM_YAZ === '1') {
    writeFileSync(
      'docs/olcum-karakter.json',
      `${JSON.stringify({ tarih: new Date().toISOString().slice(0, 10), ACTOR_HEIGHT, CAPSULE_RADIUS, NPC_TIPIK, karakterler, animler, taban }, null, 2)}\n`,
    );
    console.log('\nham → docs/olcum-karakter.json (üzerine yazıldı)');
  } else {
    console.log('\n(ham dosya korundu — yazmak için OLCUM_YAZ=1)');
  }
}
