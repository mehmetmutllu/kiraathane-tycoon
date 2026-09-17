/**
 * shot-cevre-r4.mjs — R4 ADAY KARELERİ (G-50): "çözümler sun ve öner".
 *
 * `feedback_show_dont_ask`: estetik çatalda kol METİNLE anlatılmaz. On iki aday, GERÇEK oyunun
 * içinde, AYNI kadrajdan, aynı ışıkla render edilir; kullanıcı eleyerek seçer.
 *
 * ADAYLAR KODA GİRMEZ — hepsi burada, tarayıcı tarafında, sahneye geçici bir `__R4_ADAY`
 * grubu eklenerek çizilir ve kare alınınca sökülür. Sebebi D-084'ün varyant kapısı: seçilmemiş
 * bir kol depoda kod olarak durursa "zaten yazılmış" diye seçilir. Yalnız KAZANAN kol, karardan
 * sonra, kendi turunda gerçek koda yazılır.
 *
 * KADRAJ SEÇİMİ ÖLÇÜMDEN GELİYOR (`docs/olcum-cevre-r4.txt`):
 *   - §E boşluğun %97'sinin YAN kenarlarda olduğunu söylüyor → çevre/boşluk adayları,
 *     boşluğun en çok göründüğü açılış karesinde (−14, 3) gösterilir.
 *   - §A zeminin karenin %63'ü olduğunu söylüyor → zemin/duvar adayları, salonun dolu
 *     karesinde (−6, 4) gösterilir; orada boşluk %0, yani kol kendi işini yapıyor mu görülür.
 * Aynı kol iki kadrajda ayrı ayrı çizilmez: karşılaştırma ancak AYNI kadrajda anlamlıdır.
 *
 * Kullanım: node tools/shot-cevre-r4.mjs
 */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const KOK = path.resolve('.');
const OUT = `${KOK}/docs/gorsel/ss`;
const PORT = Number(process.env.R4_PORT || 5418);
const PADS =
  'table2 table3 waiter table4 zone2 z2table2 z2table3 dishwasher z2table4 zone3 z3table2 waiter2 z3table3 z3table4 waiter3 lavabo z3table5 z3table6 z3table7 z3table8 z3table9 z3table10 z3table11 z3table12'.split(
    ' ',
  );

/**
 * KADRAJLAR — üçü de `docs/olcum-cevre-r4.txt` §A'dan SEÇİLDİ, göz kararı değil. Her kol,
 * kendi yüzeyinin karede en çok yer tuttuğu kareden gösterilir; yoksa kol kendini anlatamaz
 * (ilk denemede duvar kolları %1,9 duvarlı bir kareden çizildi ve hiçbiri görünmedi).
 */
const KADRAJLAR = {
  // ZEMIN 49,4 · DUVAR 18,5 · BOŞ-ufuk-altı 20,0 — boşluğun en büyük olduğu kare
  bos: { durum: 'acilis', pads: [], konum: [-14, 3] },
  // ZEMIN 77,2 — zeminin en baskın olduğu kare
  zemin: { durum: 'tam', pads: PADS, konum: [-6, 4] },
  // DUVAR 17,2 · ZEMIN 69,7 — İKİ İÇ DUVAR YÜZÜ de kadrajda, lambri hattı boydan boya okunuyor.
  // (-8,5 · 1) daha yüksek duvar payı veriyordu ama orada görünen şey duvarın ÜSTÜ ve DIŞ yüzü;
  // yüzdeye bakıp kadraj seçmek yetmiyor, o yüzdenin HANGİ yüz olduğu da sorulmalı.
  duvar: { durum: 'acilis', pads: [], konum: [-8.5, 8] },
};

const ADAYLAR = [
  { id: 'C1', kadraj: 'bos', ad: 'Çimenlik kuşağı' },
  { id: 'C2', kadraj: 'bos', ad: 'Bahçe: çim + çit + ağaç' },
  { id: 'C3', kadraj: 'bos', ad: 'Taş avlu + saksılar' },
  { id: 'C4', kadraj: 'bos', ad: 'Komşu kütleler (sokak dokusu)' },
  { id: 'K1', kadraj: 'bos', ad: 'Arka planı ısıt (tek satır)' },
  { id: 'K2', kadraj: 'bos', ad: 'Zemini genişlet (sonsuz ahşap)' },
  { id: 'Z1', kadraj: 'zemin', ad: 'Tahta derzi (D-073 geri alınır)' },
  { id: 'Z2', kadraj: 'zemin', ad: 'Alan başına ton + bordür' },
  { id: 'Z3', kadraj: 'zemin', ad: 'Yıpranma yaması (desen yok)' },
  { id: 'D1', kadraj: 'duvar', ad: 'Lambri yükselt + koyult' },
  { id: 'D2', kadraj: 'duvar', ad: 'Çini kuşağı' },
  { id: 'D3', kadraj: 'duvar', ad: 'Duvar dibi kademeli gölge' },
];

const KUR = async () => {
  const url =
    performance
      .getEntriesByType('resource')
      .map((e) => e.name)
      .find((n) => /deps\/three\.js/.test(n)) || '/node_modules/three/build/three.module.js';
  const THREE = await import(/* @vite-ignore */ url);
  window.__R4 = { THREE, url };
  return typeof THREE.Raycaster === 'function';
};

/**
 * ADAYI KUR — sahneye `__R4_ADAY` grubunu ekler, geri alma bilgisini `window.__R4.geri`ye yazar.
 * Hiçbir aday mevcut bir nesneyi SİLMEZ; ya üstüne katman koyar ya da arka plan rengini
 * değiştirir (o da geri alınır). Böylece iki aday arasında artık kalamaz.
 */
const KUR_ADAY = (id) => {
  const { THREE } = window.__R4;
  const { scene } = window.__three;
  const g = new THREE.Group();
  g.name = '__R4_ADAY';
  const geri = { bg: null, fog: null };

  const YARI = 17.6; // zemin düzleminin yarı kenarı (35,2 / 2)
  const W = 16; // kuşak genişliği — §E: P90 taşma 9,11 · en uzak 14,65 → 16 hepsini kapatır
  const rnd = (n) => {
    const h = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return h - Math.floor(h);
  };
  const mal = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, ...o });
  const kutu = (w, h, d, c, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mal(c));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const duzlem = (w, d, c, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mal(c));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  /** Zemin karesinin DIŞINDA dört şerit. Orta kare çizilmez (zemin zaten orada). */
  const kusak = (c, y = -0.06, w = W) => {
    duzlem(YARI * 2 + w * 2, w, c, 0, y, -YARI - w / 2);
    duzlem(YARI * 2 + w * 2, w, c, 0, y, YARI + w / 2);
    duzlem(w, YARI * 2, c, -YARI - w / 2, y, 0);
    duzlem(w, YARI * 2, c, YARI + w / 2, y, 0);
  };
  /**
   * KUŞAĞIN ÜSTÜNE SERPİŞTİRME — binanın kenarını KUCAKLAYARAK, tek düze değil.
   *
   * İlk sürüm ±33'lük kareye tek düze dağıtıyordu ve ekrana tek bir ağaç bile girmiyordu:
   * §E'ye göre boşluğun ORTANCA taşması 4,3 br, P90'ı 11,1 br — yani görünen şey kenardan
   * yalnız ilk birkaç birim. Uzağa konan süs, konmamış süstür (S6'nın karşı bina dersi).
   */
  const serp = (n, fn) => {
    for (let i = 0; i < n; i++) {
      const t = (i + rnd(i * 3.1) * 0.6) / n; // çevre boyunca yürü
      const d = 1.4 + rnd(i * 7.7 + 5) * 7.0; // kenardan 1,4 … 8,4 br dışarı (görünen kuşak)
      const kenar = Math.floor(t * 4);
      const u = (t * 4 - kenar) * 2 - 1; // kenar boyunca −1..+1
      const L = YARI + 3;
      const x = kenar === 0 ? -YARI - d : kenar === 1 ? u * L : YARI + d;
      const z = kenar === 0 ? u * L : kenar === 1 ? -YARI - d : kenar === 2 ? u * L : YARI + d;
      const xx = kenar === 2 ? YARI + d : kenar === 3 ? u * L : x;
      const zz = kenar === 2 ? u * L : kenar === 3 ? YARI + d : z;
      if (zz > YARI && Math.abs(xx) < 6) continue; // kapı önü koridoru boş kalır
      fn(xx, zz, i);
    }
  };
  const agac = (x, z, i) => {
    const h = 2.6 + rnd(i * 13.3) * 1.8;
    kutu(0.34, h * 0.42, 0.34, '#6b4a33', x, (h * 0.42) / 2, z);
    const y0 = h * 0.42;
    const yap = (r, hh, yy, c) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 7), mal(c));
      m.position.set(x, yy, z);
      m.castShadow = true;
      g.add(m);
    };
    yap(1.25, h * 0.6, y0 + h * 0.3, '#4f8f45');
    yap(0.95, h * 0.5, y0 + h * 0.62, '#62a755');
  };
  const cali = (x, z, i, c = '#5a9a55') => {
    const r = 0.5 + rnd(i * 19.1) * 0.45;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mal(c));
    m.position.set(x, r * 0.78, z);
    m.castShadow = true;
    g.add(m);
  };

  /** Duvar YÜZEYLERİ — sınıflandırma kuralıyla aynı biçim testi (dik · boy ≥ 2 · yatayda ince). */
  const duvarYuzeyleri = () => {
    const out = [];
    const bb = new THREE.Box3();
    const ekle = (kutuDunya) => {
      const s = new THREE.Vector3();
      const c = new THREE.Vector3();
      kutuDunya.getSize(s);
      kutuDunya.getCenter(c);
      const yatayDar = Math.min(s.x, s.z);
      const yatayEn = Math.max(s.x, s.z);
      if (s.y >= 2 && yatayDar <= 0.6 && yatayEn >= 1.5) out.push({ c, s, xUzun: s.x > s.z });
    };
    scene.traverse((o) => {
      if (!o.visible || !o.geometry || o.name === '__R4_ADAY' || (o.parent && o.parent.name === '__R4_ADAY')) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      o.updateWorldMatrix(true, false);
      if (o.isInstancedMesh) {
        const im = new THREE.Matrix4();
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, im);
          bb.copy(o.geometry.boundingBox).applyMatrix4(im).applyMatrix4(o.matrixWorld);
          ekle(bb);
        }
      } else if (o.isMesh) {
        bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
        ekle(bb);
      }
    });
    return out;
  };
  /** Duvarın İKİ yüzüne de ince bir levha koyar (hangi yüzün kameraya baktığını bilmeye gerek yok). */
  const duvaraSerit = (d, y0, h, c, disari = 0.012) => {
    const kal = 0.02;
    if (d.xUzun) {
      for (const s of [-1, 1]) kutu(d.s.x, h, kal, c, d.c.x, y0 + h / 2, d.c.z + s * (d.s.z / 2 + disari));
    } else {
      for (const s of [-1, 1]) kutu(kal, h, d.s.z, c, d.c.x + s * (d.s.x / 2 + disari), y0 + h / 2, d.c.z);
    }
  };

  switch (id) {
    // ---------------------------------------------------------------------------- ÇEVRE
    case 'C1':
      kusak('#6ea952');
      break;
    case 'C2':
      kusak('#6ea952');
      // çit: binanın kenarından 1,2 dışarıda, alçak
      for (const s of [-1, 1]) {
        kutu(0.22, 0.85, YARI * 2 + 2.4, '#8a6a45', s * (YARI + 1.2), 0.42, 0);
        kutu(YARI * 2 + 2.4, 0.85, 0.22, '#8a6a45', 0, 0.42, s * (YARI + 1.2));
      }
      serp(14, agac);
      serp(22, (x, z, i) => cali(x, z, i, i % 3 ? '#5a9a55' : '#7fb862'));
      break;
    case 'C3':
      kusak('#cdc3b2');
      // derz: kuşağın üstünde seyrek koyu çizgiler (taş dili)
      for (let i = -5; i <= 5; i++) {
        duzlem(0.1, W, '#b3a894', -YARI - W / 2 + 0.0 + i * 0, -0.055, 0);
      }
      for (const s of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
          const z = -YARI + 4 + i * 7.5;
          kutu(1.5, 0.75, 1.5, '#a8785a', s * (YARI + 2.4), 0.375, z);
          cali(s * (YARI + 2.4), z, i * 3 + 1, '#5a9a55');
        }
      }
      break;
    case 'C4':
      kusak('#4a4642');
      for (const s of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          const z = -YARI + 3 + i * 6.4;
          const h = 5 + rnd(i * 31.7 + (s + 1) * 9) * 5.5;
          const renk = ['#b9a48a', '#9c8b7a', '#c4a98c', '#8f7f72'][i % 4];
          kutu(7.5, h, 5.2, renk, s * (YARI + 5.6), h / 2, z);
          kutu(7.9, 0.4, 5.6, '#6f5f52', s * (YARI + 5.6), h + 0.2, z);
        }
      }
      break;
    case 'K1': {
      geri.bg = scene.background;
      geri.fog = scene.fog ? scene.fog.color.clone() : null;
      const c = new THREE.Color('#d9c9a8');
      scene.background = c;
      if (scene.fog) scene.fog.color.copy(c);
      break;
    }
    case 'K2':
      duzlem(95, 95, '#b98a5a', 0, -0.06, 0);
      break;

    // ---------------------------------------------------------------------------- ZEMİN
    case 'Z1': {
      // derz = ALTTAKİ koyu düzlem; tahtalar onun üstünde boşluklu quad'lar (floorPattern dili)
      duzlem(YARI * 2, YARI * 2, '#9c7248', 0, 0.005, 0);
      const LEN = 2.2;
      const GEN = 0.55;
      const GAP = 0.045;
      const geo = new THREE.PlaneGeometry(1, 1);
      const say = Math.ceil((YARI * 2) / LEN) * Math.ceil((YARI * 2) / GEN) + 64;
      const im = new THREE.InstancedMesh(geo, mal('#ffffff'), say);
      im.receiveShadow = true;
      const d = new THREE.Object3D();
      const col = new THREE.Color();
      const taban = new THREE.Color('#b98a5a');
      let k = 0;
      for (let j = 0; j * GEN < YARI * 2 && k < say; j++) {
        const z = -YARI + j * GEN + GEN / 2;
        const kayma = j % 2 ? LEN / 2 : 0;
        for (let i = -1; (i + 1) * LEN - kayma < YARI * 2 && k < say; i++) {
          const x = -YARI + i * LEN - kayma + LEN / 2;
          d.position.set(x, 0.007, z);
          d.rotation.set(-Math.PI / 2, 0, 0);
          d.scale.set(LEN - GAP, GEN - GAP, 1);
          d.updateMatrix();
          im.setMatrixAt(k, d.matrix);
          const t = 1 + (rnd(i * 41.3 + j * 7.9) * 2 - 1) * 0.04;
          im.setColorAt(k, col.copy(taban).multiplyScalar(t));
          k++;
        }
      }
      im.count = k;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      g.add(im);
      break;
    }
    case 'Z2': {
      // üç alan, üç yakın ton + her alanın kenarında koyu bordür
      const alanlar = [
        { x0: -17, x1: 0, z0: 0, z1: 17, c: '#bd8e5d' },
        { x0: 0, x1: 17, z0: 0, z1: 17, c: '#b48554' },
        { x0: -17, x1: 17, z0: -9.8, z1: 0, c: '#c0925f' },
      ];
      for (const a of alanlar) {
        duzlem(a.x1 - a.x0, a.z1 - a.z0, a.c, (a.x0 + a.x1) / 2, 0.006, (a.z0 + a.z1) / 2);
        const B = 0.45;
        duzlem(a.x1 - a.x0, B, '#8f6740', (a.x0 + a.x1) / 2, 0.008, a.z0 + B / 2);
        duzlem(a.x1 - a.x0, B, '#8f6740', (a.x0 + a.x1) / 2, 0.008, a.z1 - B / 2);
        duzlem(B, a.z1 - a.z0, '#8f6740', a.x0 + B / 2, 0.008, (a.z0 + a.z1) / 2);
        duzlem(B, a.z1 - a.z0, '#8f6740', a.x1 - B / 2, 0.008, (a.z0 + a.z1) / 2);
      }
      break;
    }
    case 'Z3': {
      /**
       * DESEN DEĞİL, LEKE. İlk çizim 26 eksen-hizalı dikdörtgendi ve ekranda tahta yaması
       * değil BOZUK KARE gibi okundu (keskin dikey/yatay kenarlar). Üç şey değişti: parçalar
       * DÖNÜK (ızgara hissi yok), ÖRTÜŞÜYOR (kenar kenar üstüne biner, tek kontur kalmaz),
       * ve genlik parça başına küçük ama üst üste binince derinleşiyor.
       */
      const taban = new THREE.Color('#b98a5a');
      for (let i = 0; i < 46; i++) {
        const w = 4 + rnd(i * 5.5) * 9;
        const d2 = 3.5 + rnd(i * 9.3 + 2) * 8;
        const x = (rnd(i * 2.7) * 2 - 1) * YARI;
        const z = (rnd(i * 6.1 + 9) * 2 - 1) * YARI;
        const t = 1 + (rnd(i * 17.7) * 2 - 1) * 0.075;
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(w, d2),
          mal('#' + taban.clone().multiplyScalar(t).getHexString(), { transparent: true, opacity: 0.55 }),
        );
        m.rotation.set(-Math.PI / 2, 0, rnd(i * 23.9) * Math.PI);
        m.position.set(x, 0.006 + i * 0.0002, z);
        g.add(m);
      }
      break;
    }

    // ---------------------------------------------------------------------------- DUVAR
    case 'D1':
      for (const d of duvarYuzeyleri()) duvaraSerit(d, 0, 1.25, '#5b3d33');
      for (const d of duvarYuzeyleri()) duvaraSerit(d, 1.25, 0.1, '#e8dcc0', 0.02);
      break;
    case 'D2':
      for (const d of duvarYuzeyleri()) {
        const uzun = d.xUzun ? d.s.x : d.s.z;
        const n = Math.max(1, Math.round(uzun / 0.52));
        const boy = uzun / n;
        for (let i = 0; i < n; i++) {
          const o = -uzun / 2 + boy * (i + 0.5);
          const c = i % 2 ? '#3f6c8f' : '#dbe7ee';
          const kal = 0.02;
          if (d.xUzun)
            for (const s of [-1, 1]) kutu(boy * 0.9, 0.46, kal, c, d.c.x + o, 1.62, d.c.z + s * (d.s.z / 2 + 0.012));
          else for (const s of [-1, 1]) kutu(kal, 0.46, boy * 0.9, c, d.c.x + s * (d.s.x / 2 + 0.012), 1.62, d.c.z + o);
        }
      }
      break;
    case 'D3': {
      /**
       * DİP GÖLGESİ KOYUDUR. İlk deneme açık tonlar koydu (#8d7a5e → #d3c4a3) ve mevcut KOYU
       * lambrinin (#6d4c41) üstünü açarak duvarı taban kareden daha SOLUK yaptı — "gölge"
       * diyen bir kol, ekranda ışık ekliyordu. Kademe artık zeminden yukarı doğru AÇILIYOR:
       * en dipte en koyu, üstte lambrinin kendi tonuna kavuşuyor (yapay ortam gölgelemesi).
       */
      const kademe = [
        [0.0, 0.16, '#2e2019'],
        [0.16, 0.2, '#422e23'],
        [0.36, 0.26, '#573c2f'],
      ];
      for (const d of duvarYuzeyleri()) for (const [y0, h, c] of kademe) duvaraSerit(d, y0, h, c);
      break;
    }
  }

  scene.add(g);
  window.__R4.geri = geri;
  return { nesne: g.children.length };
};

/**
 * KARE OKU — çizim tamponunu `window.__R4` içinde saklar (aktarılmaz; sadece sayı döner).
 * İki taban karesi arasındaki fark GÜRÜLTÜ MASKESİ olur: simülasyon `__zaman(0)` ile
 * dondurulsa bile iskelet klipleri oynamaya devam edebilir, ve o pikseller adaya
 * yazılırsa "bu kol karenin %8'ini değiştirdi" cümlesi yalan olur.
 */
const KARE_OKU = (anahtar) => {
  const { gl, scene, camera } = window.__three;
  gl.render(scene, camera);
  const ctx = gl.getContext();
  const W = gl.domElement.width;
  const H = gl.domElement.height;
  const px = new Uint8Array(W * H * 4);
  ctx.readPixels(0, 0, W, H, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
  window.__R4[anahtar] = { px, W, H };
  return { W, H };
};

/** Gürültü maskesi: iki taban karesinde oynayan pikseller işaretlenir ve farktan DÜŞÜLÜR. */
const MASKE_KUR = () => {
  const ESIK = 10;
  const a = window.__R4.t1;
  const b = window.__R4.t2;
  const n = a.W * a.H;
  const maske = new Uint8Array(n);
  let oynayan = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const d = Math.abs(a.px[o] - b.px[o]) + Math.abs(a.px[o + 1] - b.px[o + 1]) + Math.abs(a.px[o + 2] - b.px[o + 2]);
    if (d > ESIK) {
      maske[i] = 1;
      oynayan++;
    }
  }
  window.__R4.maske = maske;
  return { oynayanPay: oynayan / n };
};

/**
 * Adayın bir başka kareye göre DEĞİŞTİRDİĞİ piksel payı (gürültü maskesi dışarıda).
 *
 * EŞİK 10 (kanal toplamı). İlk sürümde 24'tü ve Z3'ü (±%6 ton yaması) %0,3 diye okudu:
 * (185,138,90) üstünde %6, kanal toplamında tam 24 eder — yani kolun yarısı eşiğin altında
 * kalıyordu. Eşik ölçtüğü şeyden büyük olursa ölçüm "etkisiz" der ve bu bir bulgu sanılır.
 *
 * `kime` = 't1' (taban) ya da 'ref' (grubun ilk kolu). İkincisi şu soruyu ayırır: iki kol
 * karenin AYNI bölgesini dolduruyorsa (boşluk kolları hep %17,8) aralarındaki gerçek fark
 * nedir? Tabana göre fark bunu göstermez, birbirine göre fark gösterir.
 */
const FARK = (kime) => {
  const ESIK = 10;
  const a = window.__R4[kime];
  const c = window.__R4.aday;
  const maske = window.__R4.maske;
  const n = a.W * a.H;
  let sayilan = 0;
  let degisen = 0;
  let deltaTop = 0;
  for (let i = 0; i < n; i++) {
    if (maske[i]) continue;
    sayilan++;
    const o = i * 4;
    const d = Math.abs(a.px[o] - c.px[o]) + Math.abs(a.px[o + 1] - c.px[o + 1]) + Math.abs(a.px[o + 2] - c.px[o + 2]);
    if (d > ESIK) {
      degisen++;
      deltaTop += d / 3;
    }
  }
  return { degisenPay: degisen / sayilan, ortDelta: degisen ? deltaTop / degisen : 0 };
};

const SOK_ADAY = () => {
  const { scene } = window.__three;
  const g = scene.getObjectByName('__R4_ADAY');
  if (g) {
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    scene.remove(g);
  }
  const geri = window.__R4.geri || {};
  if (geri.bg) scene.background = geri.bg;
  if (geri.fog && scene.fog) scene.fog.color.copy(geri.fog);
  window.__R4.geri = {};
};

mkdirSync(OUT, { recursive: true });
const sunucu = spawn(
  process.execPath,
  [path.join(KOK, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
  { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] },
);
sunucu.stdout.on('data', () => {});
sunucu.stderr.on('data', () => {});
const bekle = async () => {
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) return true;
    } catch {
      /* bekle */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

try {
  if (!(await bekle())) throw new Error('vite kalkmadi');
  const b = await chromium.launch({ args: ['--use-angle=default', '--ignore-gpu-blocklist'] });
  const hatalar = [];

  const satirlar = [];
  for (const [kad, sen] of Object.entries(KADRAJLAR)) {
    const p = await b.newPage({ viewport: { width: 1100, height: 750 }, deviceScaleFactor: 1 });
    p.on('pageerror', (e) => hatalar.push('PAGEERROR ' + e.message));
    p.on('console', (m) => {
      if (m.type() === 'error') hatalar.push('CONSOLE ' + m.text());
    });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' });
    await p.waitForSelector('canvas', { timeout: 60000 });
    await p.waitForTimeout(3500);
    if (sen.pads.length) {
      await p.evaluate((pads) => window.__setState({ padsDone: pads, padFills: {} }), sen.pads);
      await p.waitForTimeout(1500);
      await p.evaluate(() => window.__setState({ tableLevels: new Array(24).fill(3), stationLevels: [5] }));
    }
    await p.evaluate(() => {
      document.body.classList.add('dsb-hide-hud');
      window.__devPlan({ topDown: false, gridStep: 0 });
    });
    if (!(await p.evaluate(KUR))) throw new Error('three modulu bulunamadi');
    await p.evaluate(([x, z]) => window.__teleport(x, z), sen.konum);
    await p.waitForTimeout(2800);
    // SİMÜLASYONU DONDUR — yoksa NPC'ler kareler arasında yürür ve "aday ne değiştirdi"
    // sorusunun cevabına onların hareketi de karışır.
    await p.evaluate(() => window.__zaman(0));
    await p.waitForTimeout(900);

    await p.evaluate(KARE_OKU, 't1');
    await p.screenshot({ path: `${OUT}/r4-aday-${kad}-TABAN.png` });
    await p.waitForTimeout(1400);
    await p.evaluate(KARE_OKU, 't2');
    const mk = await p.evaluate(MASKE_KUR);
    console.log(`
[${kad}] taban karesi alındı · donmuş sahnede oynayan piksel: ${(mk.oynayanPay * 100).toFixed(2)}%`);

    let grupRef = null;
    for (const a of ADAYLAR.filter((a) => a.kadraj === kad)) {
      const r = await p.evaluate(KUR_ADAY, a.id);
      await p.waitForTimeout(900);
      await p.evaluate(KARE_OKU, 'aday');
      const f = await p.evaluate(FARK, 't1');
      let fr = { degisenPay: 0, ortDelta: 0 };
      if (grupRef === null) {
        await p.evaluate(() => {
          window.__R4.ref = window.__R4.aday;
          window.__R4.aday = { px: window.__R4.aday.px.slice(), W: window.__R4.aday.W, H: window.__R4.aday.H };
        });
        grupRef = a.id;
      } else {
        fr = await p.evaluate(FARK, 'ref');
      }
      await p.screenshot({ path: `${OUT}/r4-aday-${kad}-${a.id}.png` });
      await p.evaluate(SOK_ADAY);
      await p.waitForTimeout(300);
      satirlar.push({ ...a, ...f, refId: grupRef, refPay: fr.degisenPay, nesne: r.nesne });
      console.log(
        `${a.id.padEnd(3)} ${a.ad.padEnd(32)} taban farkı ${(f.degisenPay * 100).toFixed(1).padStart(5)}% (delta ${f.ortDelta.toFixed(0).padStart(3)}) · ${grupRef}'e göre ${(fr.degisenPay * 100).toFixed(1).padStart(5)}% · ${String(r.nesne).padStart(3)} nesne`,
      );
    }
    await p.close();
  }

  console.log(String.fromCharCode(10) + '='.repeat(96));
  console.log('ADAY ETKİ TABLOSU — kol karenin yüzde kaçını GERÇEKTEN değiştiriyor?');
  console.log('(gürültü maskesi düşülmüş · delta = değişen pikselde ortalama kanal farkı 0-255)');
  console.log('-'.repeat(96));
  console.log('kol  kadraj   ad'.padEnd(52) + 'taban farkı  ort.delta   grup içi   nesne');
  for (const r of satirlar)
    console.log(
      `${r.id.padEnd(5)}${r.kadraj.padEnd(9)}${r.ad.padEnd(38)}${(r.degisenPay * 100).toFixed(1).padStart(7)}%${r.ortDelta.toFixed(1).padStart(11)}${(r.id === r.refId ? '  (ref)' : (r.refPay * 100).toFixed(1) + '%').padStart(11)}${String(r.nesne).padStart(8)}`,
    );
  console.log('='.repeat(96));

  console.log(hatalar.length ? 'KONSOL HATASI:\n' + hatalar.join('\n') : 'konsol temiz — 0 hata');
  await b.close();
} finally {
  sunucu.kill();
}
