/**
 * banketGeo.ts — BANKET ADASININ TEK PARÇA GEOMETRİSİ (T7, D-141).
 *
 * Ada onlarca parçadan kurulur (kaide · çerçeveli gövde · çıta · uç kolu · minder · kapitone …) ama
 * sahneye **ada başına TEK mesh** gider: parçalar köşe rengiyle birleştirilir. T7 ölçümünde parçalı
 * çizici 24 → 88 çizim çağrısı çıkarıyordu (rapor Bulgu 3); birleştirince iki ada = 2 çağrı.
 * Geometri yalnız ada biçimi veya kademe değişince yeniden kurulur.
 *
 * Koordinat: x DÜNYA x'i, z adanın eksenine (BANKET.z) göre, y zeminden. React'siz → vitest'te sınanır.
 */
import { BoxGeometry, BufferGeometry, Color, Float32BufferAttribute, IcosahedronGeometry, Matrix4 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BANKET, banketLen } from '../../game/layout';
import { PALETTE } from '../../config/palette';
import { banketGorunus, type BanketSutun } from './banketLook';

/** Ahşap tonları: kaide koyu · gövde sedir · çıta/uç kolu kapı ahşabı · çıplak oturak açık. */
const AHSAP = {
  kaide: '#3e2a22',
  govde: PALETTE.banketBody,
  cita: PALETTE.banketBase,
  pano: '#9c6a47',
  oturak: '#b07a52',
  dugme: '#d4af37',
} as const;

/** Ölçüler (br). Oturak y 0,44 → minder üstü ~0,59: taburenin oturağıyla aynı yükseklik. */
export const BANKET_OLCU = {
  cekirdekYari: 0.17,
  oturakOn: 1.25,
  oturakY: 0.44,
  kaideY: 0.08,
  sirtUst: 1.2,
  kolY: 0.72,
} as const;

interface Parca {
  g: BufferGeometry;
  renk: string;
}

function kutu(w: number, h: number, d: number, r = 0): BufferGeometry {
  return r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new BoxGeometry(w, h, d);
}

function yerlestir(g: BufferGeometry, x: number, y: number, z: number, rx = 0, ry = 0): BufferGeometry {
  const m = new Matrix4().makeRotationY(ry).multiply(new Matrix4().makeRotationX(rx));
  g.applyMatrix4(m);
  g.translate(x, y, z);
  return g;
}

/** Tek ada (bir `side`) için birleşik geometri; sütun yoksa null. */
export function banketAdaGeo(sutunlar: readonly BanketSutun[], kademe: number): BufferGeometry | null {
  if (sutunlar.length === 0) return null;
  const side = sutunlar[0].side;
  const O = BANKET_OLCU;
  const g = banketGorunus(kademe);
  const parca: Parca[] = [];
  const ekle = (geo: BufferGeometry, renk: string) => parca.push({ g: geo, renk });
  // d (dış uçtan içeri uzaklık) → dünya x. Ada iç uca (d = tam boy) sabitli, dışa doğru uzar.
  const X = (d: number) => side * (BANKET.outerX - d);
  const dIc = banketLen(BANKET.cols);
  const dOf = (s: BanketSutun) => [BANKET.outerX - side * s.x - s.len / 2, BANKET.outerX - side * s.x + s.len / 2];
  const dDis = Math.min(...sutunlar.map((s) => dOf(s)[0]));

  // ---- ortak sırtlık: çekirdek + üst başlık (açık sütunların tamamı boyunca, kesintisiz) ----
  const boy = dIc - dDis;
  const xm = X((dDis + dIc) / 2);
  ekle(yerlestir(kutu(boy, O.sirtUst, O.cekirdekYari * 2, 0.02), xm, O.sirtUst / 2, 0), AHSAP.govde);
  ekle(yerlestir(kutu(boy + 0.06, 0.08, 0.5, 0.03), xm, O.sirtUst + 0.03, 0), AHSAP.cita);

  for (const f of [1, -1] as const) {
    const yi = f === 1 ? 0 : 1;
    const acik = sutunlar.filter((s) => s.yuz[yi]);
    // Sırt minderi olmayan yüz düz levha kalmasın: iki çerçeveli pano (yüzü açılmamış sütunda da).
    const panolu = g.sirt ? sutunlar.filter((s) => !s.yuz[yi]) : sutunlar;
    for (const s of panolu) {
      for (const k of [-1, 1]) {
        ekle(yerlestir(kutu(s.len / 2 - 0.3, 0.7, 0.03, 0.01), s.x + (k * s.len) / 4, 0.62, f * (O.cekirdekYari + 0.01)), AHSAP.pano);
      }
    }
    if (acik.length === 0) continue;
    const d0 = Math.min(...acik.map((s) => dOf(s)[0]));
    const run = dIc - d0;
    const xr = X((d0 + dIc) / 2);
    const zOrta = f * (O.cekirdekYari + O.oturakOn) / 2;
    const derin = O.oturakOn - O.cekirdekYari;

    // kaide (içeri çekik) · oturak kasası · ön üst çıta
    ekle(yerlestir(kutu(run - 0.16, O.kaideY, derin - 0.12), xr, O.kaideY / 2, zOrta - f * 0.06), AHSAP.kaide);
    ekle(yerlestir(kutu(run, O.oturakY - O.kaideY, derin, 0.03), xr, (O.oturakY + O.kaideY) / 2, zOrta), AHSAP.govde);
    ekle(yerlestir(kutu(run + 0.02, 0.05, 0.07, 0.015), xr, O.oturakY - 0.005, f * (O.oturakOn - 0.02)), AHSAP.cita);

    // uç kolları: yüzün iki ucunda, oturak derinliği boyunca
    for (const d of [d0 + 0.05, dIc - 0.05]) {
      ekle(yerlestir(kutu(0.1, O.kolY, derin + 0.02, 0.04), X(d), O.kolY / 2, zOrta), AHSAP.cita);
    }

    for (const s of acik) {
      const L = s.len;
      // ön yüzde iki çerçeveli pano (sütun = bir masa)
      for (const k of [-1, 1]) {
        ekle(yerlestir(kutu(L / 2 - 0.34, 0.2, 0.03, 0.01), s.x + (k * L) / 4, 0.25, f * (O.oturakOn + 0.01)), AHSAP.pano);
      }
      const oL = L - 0.16;
      if (!g.oturak) {
        // çıplak ahşap sedir: üç tahta
        for (let i = 0; i < 3; i++) {
          const z = f * (O.cekirdekYari + 0.2 + i * 0.33);
          ekle(yerlestir(kutu(oL, 0.045, 0.3, 0.01), s.x, O.oturakY + 0.022, z), AHSAP.oturak);
        }
      } else {
        ekle(yerlestir(kutu(oL, 0.15, 0.98, 0.06), s.x, O.oturakY + 0.075, zOrta + f * 0.02), g.oturak);
        if (g.biye) ekle(yerlestir(kutu(oL - 0.04, 0.025, 0.025), s.x, O.oturakY + 0.08, f * (O.oturakOn - 0.02)), g.biye);
      }
      if (g.sirt) {
        const aci = -f * 0.12;
        const zS = f * (O.cekirdekYari + 0.075);
        ekle(yerlestir(kutu(oL, 0.52, 0.13, 0.05), s.x, 0.88, zS, aci), g.sirt);
        if (g.kapitone) {
          const m = new Matrix4().makeRotationX(aci);
          for (let i = 0; i < 4; i++) {
            for (const dy of [-0.12, 0.12]) {
              const dx = -oL / 2 + (oL / 4) * (i + 0.5);
              const b = new IcosahedronGeometry(0.038, 0);
              b.translate(0, dy, f * 0.065);
              b.applyMatrix4(m);
              b.translate(s.x + dx, 0.88, zS);
              ekle(b, AHSAP.dugme);
            }
          }
        }
      }
      if (g.yastik) {
        const n = L > 2.6 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const dx = n === 1 ? L * 0.18 * side : (i === 0 ? -1 : 1) * L * 0.24;
          const renk = g.yastik[(i + (f === 1 ? 0 : 1)) % g.yastik.length];
          ekle(yerlestir(kutu(0.56, 0.46, 0.2, 0.1), s.x + dx, 0.8, f * (O.cekirdekYari + 0.28), -f * 0.35, (i === 0 ? 1 : -1) * 0.18), renk);
        }
      }
    }
  }

  const c = new Color();
  const hazir = parca.map(({ g: geo, renk }) => {
    const ni = geo.index ? geo.toNonIndexed() : geo;
    if (ni !== geo) geo.dispose();
    c.set(renk);
    const n = ni.getAttribute('position').count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    ni.setAttribute('color', new Float32BufferAttribute(col, 3));
    return ni;
  });
  const out = mergeGeometries(hazir, false);
  for (const h of hazir) h.dispose();
  return out;
}
