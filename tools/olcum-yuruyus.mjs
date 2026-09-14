/**
 * olcum-yuruyus.mjs — S15: "havada süzülüyor" kusurunun SAYISI + kafa/ölçek kollarının bedeli.
 *
 * NEDEN: kullanıcı 2026-09-14'te üç şey söyledi — ① yürüme efekti ilerlemeyle senkron değil
 * ② kafalar çok büyük ③ gövdeler küçülsün. Üçü de görsel yargı ama ÜÇÜNÜN DE sayısı var ve
 * o sayı olmadan hangi kolun ne kadar oynayacağı bilinmiyor:
 *
 *   S (senkron) — bir yürüme klibi belli bir YER HIZI için çizilir: basılı ayak, gövde
 *     sabitken geriye kayar ve kaydığı mesafe o döngünün ilerlemesi kadardır. Klibin yazılı
 *     hızı = (bir döngüde basılı ayakların kat ettiği yol) / (klip süresi). Karakter bundan
 *     HIZLI giderse ayak kayar ("süzülme"), yavaş giderse yerinde tepinir. Araç bu sayıyı
 *     klipten çıkarır ve her aktörün hızı için gereken `timeScale`i verir.
 *   K (kafa) — baş mesh'inin gövde boyundaki payı; K2/K3/K4 kollarında baş KEMİĞİ ölçeklenince
 *     payın nereye düştüğü. Bugünkü ilkel gövdede %33'tü (ölçüm S14).
 *   Ö (boy) — ACTOR_HEIGHT adayları ve her adayda D-076'nın kabul kriteri olan mobilya oranları.
 *   Ç (çizim) — müşteri skinned'e geçerse gövde başına kaç çizim; birleştirme neye iner.
 *
 * Kullanım: node tools/olcum-yuruyus.mjs
 *           OLCUM_YAZ=1 node tools/olcum-yuruyus.mjs   → docs/olcum-yuruyus.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Matrix4, Vector3, Quaternion, Box3, CapsuleGeometry } from 'three';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAY = path.join(KOK, 'public/assets/models/kaykit-characters');

/** src/config/actor.ts'in TEK kaynağıyla aynı sayılar olmalı (tests/karakter.test.ts denetler). */
const ACTOR_HEIGHT = 1.75;
const KAY_AUTHORED = 2.204;
const KAY_SCALE = ACTOR_HEIGHT / KAY_AUTHORED;

/** Oyunun hareket hızları (br/sn) — economy.config.ts + layout.ts'ten. */
const HIZLAR = {
  'oyuncu k0': 4.5,
  'oyuncu k3': 5.4,
  'garson k0': 1.5,
  'garson k1': 2.0,
  'bulasikci k0': 2.0,
  'bulasikci k2': 2.8,
  'musteri': 2.6,
};

/** Bugünkü müşteri gövdesi: Customers.tsx'in birebir kapsülü — Ç kolunun tabanı. */
const KAPSUL_UCGEN = (() => {
  const g = new CapsuleGeometry(0.3, ACTOR_HEIGHT - 0.6, 6, 10);
  return Math.round((g.index ? g.index.count : g.attributes.position.count) / 3);
})();

/** Donmuş mobilya ölçüleri (D-073/D-075) — Ö kolunun kabul kriteri bunlarla oran. */
const MOBILYA = { masa: 0.795, tabure: 0.45, tezgah: 0.95 };
/** Gerçek hayattaki karşılıkları (1,75 m insan) — "doğru oran" çizgisi. */
const GERCEK = { masa: 0.75 / 1.75, tabure: 0.45 / 1.75, tezgah: 0.9 / 1.75 };

// ───────────────────────── glTF okuma (JSON + BIN) ─────────────────────────

function glbOku(dosya) {
  const b = readFileSync(dosya);
  if (b.slice(0, 4).toString() !== 'glTF') throw new Error(`GLB degil: ${dosya}`);
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
  return { j, bin, bayt: b.length };
}

const BILESEN = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const ADET = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

/** Accessor'ı Float32Array olarak oku (animasyon girdileri float; sıkıştırma yok). */
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
      const p = taban + i * adim + k * BILESEN[acc.componentType];
      cikti[i * n + k] = acc.componentType === 5126 ? bin.readFloatLE(p) : bin.readUInt16LE(p);
    }
  }
  return cikti;
}

// ───────────────────────── FK: klibi t anında poz ver ─────────────────────────

/**
 * Klibi örnekler ve istenen kemiklerin KÖK'e göre konumunu döndürür.
 * Kök sahnede sabit durur; dolayısıyla buradaki konumlar "yerdeki" konumdur — basılı ayağın
 * geriye kayması doğrudan karakterin ilerlemesi gereken mesafedir.
 */
function klipOrnekle(j, bin, klip, kemikAdlari, orneklem = 240) {
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

  /** Doğrusal örnekleme (KayKit klipleri LINEAR; CUBICSPLINE kullanmıyor). */
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

/**
 * Bir yürüme/koşma klibinin YAZILI YER HIZI.
 *
 * Yöntem: ayağın en alçak olduğu bant "basılı" sayılır (en düşük y + açıklığın %15'i).
 * Basılıyken ayağın ileri eksende kat ettiği yol o adımın uzunluğudur; iki ayağın adımı
 * toplanınca bir döngünün yolu çıkar. Süreye bölünce hız.
 *
 * KÖK KAYMASI ayrıca ölçülür: klipte root ileri gidiyorsa klip "yerinde" değildir ve
 * timeScale hesabı değişir (o zaman kök hareketi sökülmeli).
 */
function adimHizi(j, bin, klip) {
  const { sure, izler } = klipOrnekle(j, bin, klip, ['foot.l', 'foot.r', 'root', 'hips']);
  const [sol, sag, kok, kalca] = izler;
  if (!sol.length || !sag.length) return null;

  // İleri eksen: iki ayağın toplam açıklığı hangi yatay eksende büyükse o.
  const acilim = (iz, eksen) => Math.max(...iz.map((p) => p[eksen])) - Math.min(...iz.map((p) => p[eksen]));
  const ileri = acilim(sol, 'z') + acilim(sag, 'z') >= acilim(sol, 'x') + acilim(sag, 'x') ? 'z' : 'x';

  const basiliYol = (iz) => {
    const ys = iz.map((p) => p.y);
    const alt = Math.min(...ys);
    const esik = alt + (Math.max(...ys) - alt) * 0.15;
    const basili = iz.filter((p) => p.y <= esik);
    if (basili.length < 2) return 0;
    return Math.max(...basili.map((p) => p[ileri])) - Math.min(...basili.map((p) => p[ileri]));
  };

  const solAdim = basiliYol(sol);
  const sagAdim = basiliYol(sag);
  const donguYolu = solAdim + sagAdim;
  const hamHiz = donguYolu / sure;
  return {
    sure: +sure.toFixed(3),
    ileriEksen: ileri,
    solAdim: +solAdim.toFixed(3),
    sagAdim: +sagAdim.toFixed(3),
    donguYolu: +donguYolu.toFixed(3),
    kokKayma: kok.length ? +(Math.max(...kok.map((p) => p[ileri])) - Math.min(...kok.map((p) => p[ileri]))).toFixed(4) : 0,
    kalcaSalinim: kalca.length ? +(Math.max(...kalca.map((p) => p.y)) - Math.min(...kalca.map((p) => p.y))).toFixed(4) : null,
    hamHiz: +hamHiz.toFixed(3),
    /** Oyundaki hız (br/sn): ham hız × gövde ölçeği. Karakter bu hızda giderse ayak KAYMAZ. */
    dunyaHizi: +(hamHiz * KAY_SCALE).toFixed(3),
    /**
     * KADANS — döngü başına 2 adım. `timeScale` büyüdükçe bacaklar hızlanır; bu sayı "klibi ne
     * kadar hızlandırırsak çizgi filme döner"in ölçüsüdür. Gerçek insan: yürüyüş ~2 adım/sn,
     * koşu ~2,8, tam sprint ~4,5. Üstü artık bacak değil pervane.
     */
    adimSn: +(2 / sure).toFixed(2),
  };
}

/** Gerçek insanın sprint kadansı — `timeScale` kelepçesinin üst sınırı bu sayıdan türer. */
const SPRINT_ADIM_SN = 4.5;

// ───────────────────────── K kolu: kafa oranı ─────────────────────────

const EKIPMAN = ['cape', 'cloak', 'helmet', 'visor', 'hood', 'hat', 'crown', 'shoulder', 'pauldron', 'pauldrons', 'armor', 'sword', 'shield', 'staff', 'wand', 'bow', 'quiver', 'dagger', 'axe', 'spellbook', 'horn', 'backpack', 'mask'];
const ekipmanMi = (ad) => {
  const rol = ad.split('_').pop()?.toLowerCase() ?? '';
  return EKIPMAN.some((k) => rol.startsWith(k) || rol.endsWith(k));
};

/**
 * Baş mesh'inin gövde boyundaki payı ve baş KEMİĞİ s katsayısıyla ölçeklenince düştüğü yer.
 * Kemik ölçeği başı kendi orijini (boyun eklemi) etrafında küçültür: baş tabanı yerinde kalır,
 * tepe iner — yani gövdenin TOPLAM boyu da kısalır. Telafi ölçeği o kısalmayı geri verir.
 */
function kafaOrani(dosya) {
  const { j } = glbOku(dosya);
  const kutu = new Box3();
  const basKutu = new Box3();
  for (const n of j.nodes) {
    if (n.mesh === undefined) continue;
    const mesh = j.meshes[n.mesh];
    const ad = mesh.name ?? n.name ?? '';
    if (ekipmanMi(ad)) continue;
    for (const pr of mesh.primitives) {
      const acc = j.accessors[pr.attributes.POSITION];
      if (!acc.min || !acc.max) continue;
      const b = new Box3(new Vector3(...acc.min), new Vector3(...acc.max));
      kutu.union(b);
      if (/head|skull/i.test(ad)) basKutu.union(b);
    }
  }
  const boy = kutu.max.y - kutu.min.y;
  const basY = basKutu.isEmpty() ? 0 : basKutu.max.y - basKutu.min.y;
  const basTaban = basKutu.isEmpty() ? 0 : basKutu.min.y;
  const kollar = {};
  for (const s of [1, 0.85, 0.75, 0.65]) {
    const yeniBas = basY * s;
    const yeniBoy = basTaban + yeniBas;
    kollar[s.toFixed(2)] = {
      basPayi: +((yeniBas / yeniBoy) * 100).toFixed(1),
      hamBoy: +yeniBoy.toFixed(3),
      telafiOlcek: +(boy / yeniBoy).toFixed(4),
      basEni: +((basKutu.max.x - basKutu.min.x) * s).toFixed(3),
    };
  }
  return {
    dosya: path.basename(dosya),
    hamBoy: +boy.toFixed(3),
    basYuksekligi: +basY.toFixed(3),
    basTabani: +basTaban.toFixed(3),
    basEni: +(basKutu.max.x - basKutu.min.x).toFixed(3),
    kollar,
  };
}

// ───────────────────────── Ö kolu: boy adayları ─────────────────────────

function boyKollari() {
  const satir = [];
  for (const boy of [1.75, 1.65, 1.6, 1.5, 1.4]) {
    const o = { boy, oranlar: {}, sapma: {} };
    for (const [ad, olcu] of Object.entries(MOBILYA)) {
      const pay = olcu / boy;
      o.oranlar[ad] = +(pay * 100).toFixed(1);
      o.sapma[ad] = +((pay / GERCEK[ad] - 1) * 100).toFixed(1);
    }
    o.kaykitOlcek = +(boy / KAY_AUTHORED).toFixed(4);
    o.seatedDrop = +(1.3 - boy).toFixed(3);
    o.playerRadius = +(0.35 * (boy / 1.29)).toFixed(2);
    o.bubbleY = +(boy + 0.15).toFixed(2);
    o.cameraLookY = +(boy * 0.457).toFixed(2);
    satir.push(o);
  }
  return satir;
}

// ───────────────────────── Ç kolu: çizim bedeli ─────────────────────────

/** Gövdenin kaç mesh/materyal taşıdığı → birleştirme mümkün mü, kaç çizime düşer. */
function cizimBedeli(dosya) {
  const { j, bayt } = glbOku(dosya);
  const parca = [];
  const malzemeler = new Set();
  for (const n of j.nodes) {
    if (n.mesh === undefined) continue;
    const mesh = j.meshes[n.mesh];
    const ad = mesh.name ?? n.name ?? '';
    const ek = ekipmanMi(ad);
    for (const pr of mesh.primitives) {
      if (pr.material !== undefined) malzemeler.add(pr.material);
      parca.push({
        ad,
        ekipman: ek,
        malzeme: pr.material,
        ucgen: Math.round((pr.indices !== undefined ? j.accessors[pr.indices].count : j.accessors[pr.attributes.POSITION].count) / 3),
      });
    }
  }
  const sivil = parca.filter((p) => !p.ekipman);
  const sivilMalzeme = new Set(sivil.map((p) => p.malzeme));
  return {
    dosya: path.basename(dosya),
    kb: Math.round(bayt / 1024),
    parcaToplam: parca.length,
    sivilParca: sivil.length,
    malzeme: malzemeler.size,
    sivilMalzeme: sivilMalzeme.size,
    /** Birleştirme ancak TEK materyal varsa tek çizime iner; iki materyal = iki çizim. */
    birlestirilmisCizim: sivilMalzeme.size,
    sivilUcgen: sivil.reduce((s, p) => s + p.ucgen, 0),
    parcaAdlari: sivil.map((p) => p.ad),
  };
}

// ───────────────────────── koş ─────────────────────────

const GOVDELER = ['Knight', 'Rogue', 'Ranger', 'Barbarian', 'Mage', 'Rogue_Hooded'];
const { j: hareket, bin: hareketBin } = glbOku(path.join(KAY, 'Rig_Medium_MovementBasic.glb'));

const senkron = {};
for (const klip of hareket.animations) {
  if (!/^(Walking|Running)_/.test(klip.name)) continue;
  const o = adimHizi(hareket, hareketBin, klip);
  if (!o) continue;
  o.gerekenTimeScale = {};
  o.olusanKadans = {};
  for (const [ad, hiz] of Object.entries(HIZLAR)) {
    const ts = hiz / o.dunyaHizi;
    o.gerekenTimeScale[ad] = +ts.toFixed(2);
    o.olusanKadans[ad] = +(o.adimSn * ts).toFixed(1);
  }
  /** Sprint kadansına oturan timeScale tavanı ve o tavanda KALAN kayma katsayısı. */
  o.kelepceTavan = +(SPRINT_ADIM_SN / o.adimSn).toFixed(2);
  o.kelepcedeHiz = +(o.dunyaHizi * (SPRINT_ADIM_SN / o.adimSn)).toFixed(2);
  senkron[klip.name] = o;
}

const rapor = {
  damga: new Date().toISOString(),
  kaynak: { ACTOR_HEIGHT, KAY_AUTHORED, KAY_SCALE: +KAY_SCALE.toFixed(4), hizlar: HIZLAR },
  S_senkron: senkron,
  K_kafa: GOVDELER.map((g) => kafaOrani(path.join(KAY, `${g}.glb`))),
  O_boy: boyKollari(),
  C_cizim: GOVDELER.map((g) => cizimBedeli(path.join(KAY, `${g}.glb`))),
};

const yz = (v) => String(v).replace('.', ',');
console.log('\n=== S - SENKRON: kliplerin YAZILI yer hizi ===');
console.log('klip        sure   dongu yolu  ham hiz  DUNYA HIZI  kok kaymasi');
for (const [ad, o] of Object.entries(senkron)) {
  console.log(
    `${ad.padEnd(11)} ${yz(o.sure).padStart(5)}  ${yz(o.donguYolu).padStart(10)}  ${yz(o.hamHiz).padStart(7)}  ${yz(o.dunyaHizi).padStart(10)}  ${yz(o.kokKayma).padStart(11)}`,
  );
}
console.log('\n--- her aktorun hizi icin GEREKEN timeScale (1,00 = klip oldugu gibi dogru) ---');
const klipAdlari = Object.keys(senkron);
console.log('aktor'.padEnd(14) + ' hiz ' + klipAdlari.map((k) => k.padStart(12)).join(''));
for (const [ad, hiz] of Object.entries(HIZLAR)) {
  console.log(ad.padEnd(14) + yz(hiz).padStart(4) + ' ' + klipAdlari.map((k) => yz(senkron[k].gerekenTimeScale[ad]).padStart(12)).join(''));
}

console.log('\n--- o timeScale`de OLUSAN kadans (adim/sn) - gercek: yurume 2,0 - kosu 2,8 - sprint 4,5 ---');
console.log('aktor'.padEnd(14) + ' hiz ' + klipAdlari.map((k) => k.padStart(12)).join(''));
for (const [ad, hiz] of Object.entries(HIZLAR)) {
  console.log(ad.padEnd(14) + yz(hiz).padStart(4) + ' ' + klipAdlari.map((k) => yz(senkron[k].olusanKadans[ad]).padStart(12)).join(''));
}

console.log('\n--- KELEPCE: sprint kadansina (4,5 adim/sn) oturan tavan ve o tavanda tasinabilen hiz ---');
for (const [ad, o] of Object.entries(senkron)) {
  console.log(
    `${ad.padEnd(11)} kadans ${yz(o.adimSn).padStart(5)} adim/sn - tavan timeScale ${yz(o.kelepceTavan).padStart(5)} - ` +
      `tavanda hiz ${yz(o.kelepcedeHiz).padStart(5)} br/sn` +
      (o.kelepcedeHiz < 4.5 ? `  (oyuncu 4,5 icin kalan kayma ${yz(+(4.5 / o.kelepcedeHiz).toFixed(2))}x)` : ''),
  );
}

console.log('\n=== K - KAFA: bas mesh payi ve kemik olcegi kollari ===');
console.log('govde            ham boy  bas yuk.   K1 %   K2 0,85   K3 0,75   K4 0,65');
for (const k of rapor.K_kafa) {
  console.log(
    `${k.dosya.replace('.glb', '').padEnd(15)} ${yz(k.hamBoy).padStart(7)}  ${yz(k.basYuksekligi).padStart(8)}  ` +
      `${yz(k.kollar['1.00'].basPayi).padStart(5)}  ${yz(k.kollar['0.85'].basPayi).padStart(8)}  ${yz(k.kollar['0.75'].basPayi).padStart(8)}  ${yz(k.kollar['0.65'].basPayi).padStart(8)}`,
  );
}

console.log('\n=== O - BOY: adaylar ve D-076 kabul kriteri (mobilya orani) ===');
console.log('boy    masa %  sapma   tabure %  sapma   KayKit olcek  SEATED_DROP  playerR');
for (const o of rapor.O_boy) {
  console.log(
    `${yz(o.boy).padStart(5)}  ${yz(o.oranlar.masa).padStart(6)}  ${yz(o.sapma.masa).padStart(6)}  ` +
      `${yz(o.oranlar.tabure).padStart(8)}  ${yz(o.sapma.tabure).padStart(6)}  ` +
      `${yz(o.kaykitOlcek).padStart(12)}  ${yz(o.seatedDrop).padStart(11)}  ${yz(o.playerRadius).padStart(7)}`,
  );
}

console.log('\n=== C - CIZIM: govde basina mesh ve materyal ===');
console.log('govde            sivil parca  materyal  BIRLESTIRILMIS cizim  sivil ucgen');
for (const c of rapor.C_cizim) {
  console.log(
    `${c.dosya.replace('.glb', '').padEnd(15)} ${String(c.sivilParca).padStart(11)}  ${String(c.sivilMalzeme).padStart(8)}  ${String(c.birlestirilmisCizim).padStart(20)}  ${String(c.sivilUcgen).padStart(11)}`,
  );
}
const tipik = rapor.C_cizim[0];
const ortUcgen = Math.round(rapor.C_cizim.reduce((s, c) => s + c.sivilUcgen, 0) / rapor.C_cizim.length);
console.log(`\n24 musteri: as-is ${24 * tipik.sivilParca} cizim - birlestirilmis ${24 * tipik.birlestirilmisCizim} cizim - bugunku instanced kapsul 1 cizim`);
console.log(`parca adlari (${tipik.dosya}): ${tipik.parcaAdlari.join(', ')}`);
console.log(`UCGEN: govde ortalama ${ortUcgen} - 24 musteri ${(24 * ortUcgen).toLocaleString('tr-TR')} - bugunku kapsul 24x${KAPSUL_UCGEN} = ${24 * KAPSUL_UCGEN}`);
rapor.C_ozet = {
  sivilParca: tipik.sivilParca,
  ortUcgen,
  npc24: { asIsCizim: 24 * tipik.sivilParca, birlesikCizim: 24 * tipik.birlestirilmisCizim, kapsulCizim: 1, ucgen: 24 * ortUcgen, kapsulUcgen: 24 * KAPSUL_UCGEN },
};

if (process.env.OLCUM_YAZ === '1') {
  const cikti = path.join(KOK, 'docs/olcum-yuruyus.json');
  writeFileSync(cikti, JSON.stringify(rapor, null, 2), 'utf8');
  console.log(`\nyazildi -> ${path.relative(KOK, cikti)}`);
}
