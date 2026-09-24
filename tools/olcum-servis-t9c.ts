/**
 * olcum-servis-t9c.ts — K5 (D-146 · B6) ÖLÇÜM: masaya servis tetiği merkezden mi, gövdeden mi?
 *
 * SORU. Bugün oyuncu masaya çayı MERKEZDEN `serving.serveRadius` (1,6 br) daireyle bırakıyor
 * (`tick.ts` serveSystem). Dörtlü masa dikdörtgen: köşeye dayanan oyuncu merkeze ~1,85 br'de kalır,
 * çay bırakılmaz. H1 aynı kusuru kirli kap toplamada kapatmıştı (tetik = masa gövdesi + pay,
 * `atTableBody`, `cups.collectReach` 0,70). Kullanıcı kararı (D-146 K5): servis de GÖVDEDEN, her
 * kenar/köşe eşit — ama `tick.ts`e dokunduğu için varyant kapısı: önce kollar ölçülür.
 *
 * KOLLAR (hiçbiri uygulanmaz; formülle ölçülür):
 *   S0  taban        — merkez dairesi r = 1,60 (bugünkü)
 *   G5  gövde + 0,50 — oyuncunun gövdesi kutuya en fazla 0,47 yaklaşır (push-out) → alt sınır
 *   G7  gövde + 0,70 — kirli kap toplama ile AYNI pay (`cups.collectReach`, H1 §PAY)
 *   G8  gövde + 0,80 — köşe payı (+ ızgara) için
 *   G9  gövde + 0,90 — gevşek
 *
 * SAYILAR (her kol, her masa; iki dünya):
 *   yanasik%   gövdesiyle masaya DEĞEBİLDİĞİ yaklaşma yönlerinin yüzde kaçında servis olur
 *   korYon     servis olmayan yanaşık yön sayısı (köşe şikâyeti bu)
 *   alan       tetiğin ateşlediği, oyuncunun YÜRÜYEREK varabildiği zemin (br²) — affedicilik
 *   sizinti    o alanın, BAŞKA bir masanın tetiğiyle de örtüşen kısmı (br²) — bir durakta iki
 *              masaya birden servis; toplu servis zaten serbest, ama "neden o masaya gitti"yi ölçer
 *   enUzak     tetiğin ateşlediği en uzak durak, masa MERKEZİNE (br) — "masaya gelmeden veriyor" hissi
 *
 * TAKLİT YOK: katılar/erişim `layout.ts`in kendi `activeSolids`/`hitsSolid`/`clampToOpenAreas`
 * fonksiyonlarından, gövde `tableHalfFor`dan, taban yarıçapı config'ten okunur (damgalı).
 *
 * KOŞU KİPİ (D-084): `OLCUM=tam` → ızgara 0,02 br · 360 yön · iki dünya. Kısa → 0,05 · 120 · ilk salon.
 *   OLCUM=tam npx tsx tools/olcum-servis-t9c.ts > docs/olcum-servis-t9c.txt
 */
import {
  LAYOUT,
  activeSolids,
  clampToOpenAreas,
  hitsSolid,
  tableHalfFor,
  boxDist2D,
  type Solid,
} from '../src/game/layout.ts';
import { MAX_AREAS } from '../src/game/world.ts';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { KIP, KISA, damga, damgaOzeti, kipBandi } from './olcum-lib.ts';

const HUCRE = KISA ? 0.05 : 0.02;
const YON = KISA ? 120 : 360;
const EN_UZAK = 4.0;
/**
 * YANAŞIK = masaya DAYANAN durak: yaklaşma ışınındaki ilk durulabilir nokta, bir adım içerisi
 * MASANIN KENDİ katısına çarpıyorsa. H1'in "kutuya ≤ yarıçap + hücre" tanımı köşeyi dışarıda
 * bırakıyordu: çarpışma kare (`hitsSolid` AABB + yarıçap), köşede gövde kutuya ancak ~0,67 br
 * yaklaşır — kullanıcının "köşeden servis olmuyor"u tam bu duraklardır.
 */

const TABAN_R = C.serving.serveRadius;
damga('taban yaricapi config 1.6', Math.abs(TABAN_R - 1.6) < 1e-9, `serveRadius=${TABAN_R}`);

type Kol = { ad: string; tetik: (x: number, z: number, i: number) => boolean };
const govde = (pay: number) => (x: number, z: number, i: number) =>
  boxDist2D(x, z, LAYOUT.tables[i].table, tableHalfFor(i)) <= pay;
const KOLLAR: Kol[] = [
  { ad: 'S0 merkez 1,60', tetik: (x, z, i) => Math.hypot(x - LAYOUT.tables[i].table[0], z - LAYOUT.tables[i].table[2]) < TABAN_R },
  { ad: 'G5 govde+0,50', tetik: govde(0.5) },
  { ad: 'G7 govde+0,70', tetik: govde(C.cups.collectReach) },
  { ad: 'G8 govde+0,80', tetik: govde(0.8) },
  { ad: 'G9 govde+0,90', tetik: govde(0.9) },
];
damga('G7 = collectReach 0.70', Math.abs(C.cups.collectReach - 0.7) < 1e-9, `collectReach=${C.cups.collectReach}`);

type Dunya = { ad: string; tables: number; areasOpen: number };
const DUNYALAR: Dunya[] = [
  { ad: 'erken (1 salon)', tables: 4, areasOpen: 1 },
  { ad: 'gec (3 salon)', tables: LAYOUT.tables.length, areasOpen: MAX_AREAS },
];

/** Oyuncunun yürüyerek varabildiği hücreler (taşma-doldurma, `LAYOUT.player`dan) — H1 aracının aynısı. */
class Alan {
  readonly minX: number; readonly minZ: number; readonly nx: number; readonly nz: number;
  readonly bagli: Uint8Array; readonly bagliSayi: number;
  constructor(d: Dunya, solids: Solid[]) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let a = 0; a < d.areasOpen; a++) {
      const ab = LAYOUT.areaBounds[a];
      minX = Math.min(minX, ab.minX); maxX = Math.max(maxX, ab.maxX);
      minZ = Math.min(minZ, ab.minZ); maxZ = Math.max(maxZ, ab.maxZ);
    }
    this.minX = minX; this.minZ = minZ;
    this.nx = Math.ceil((maxX - minX) / HUCRE) + 1;
    this.nz = Math.ceil((maxZ - minZ) / HUCRE) + 1;
    const dur = new Uint8Array(this.nx * this.nz);
    for (let ix = 0; ix < this.nx; ix++) {
      for (let iz = 0; iz < this.nz; iz++) {
        const x = minX + ix * HUCRE, z = minZ + iz * HUCRE;
        const [cx, cz] = clampToOpenAreas(x, z, d.areasOpen);
        if (Math.abs(cx - x) > 1e-9 || Math.abs(cz - z) > 1e-9) continue;
        if (hitsSolid(x, z, solids, LAYOUT.playerRadius)) continue;
        dur[ix * this.nz + iz] = 1;
      }
    }
    const bagli = new Uint8Array(this.nx * this.nz);
    const s0 = this.indeks(LAYOUT.player[0], LAYOUT.player[2]);
    let n = 0;
    if (s0 >= 0 && dur[s0]) {
      const yigin = [s0]; bagli[s0] = 1; n = 1;
      while (yigin.length) {
        const k = yigin.pop()!;
        const ix = Math.floor(k / this.nz), iz = k % this.nz;
        for (const m of [ix > 0 ? k - this.nz : -1, ix < this.nx - 1 ? k + this.nz : -1, iz > 0 ? k - 1 : -1, iz < this.nz - 1 ? k + 1 : -1]) {
          if (m < 0 || bagli[m] || !dur[m]) continue;
          bagli[m] = 1; n++; yigin.push(m);
        }
      }
    }
    this.bagli = bagli; this.bagliSayi = n;
    damga(`erisim alani dolu (${d.ad})`, n > 1000, `${n} hucre`);
  }
  indeks(x: number, z: number): number {
    const ix = Math.round((x - this.minX) / HUCRE), iz = Math.round((z - this.minZ) / HUCRE);
    if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) return -1;
    return ix * this.nz + iz;
  }
  durak(x: number, z: number): boolean {
    const k = this.indeks(x, z);
    return k >= 0 && this.bagli[k] === 1;
  }
  yaklas(m: readonly number[], th: number, basla: number): [number, number] | null {
    const dx = Math.cos(th), dz = Math.sin(th);
    for (let r = basla; r <= EN_UZAK; r += HUCRE) {
      const x = m[0] + dx * r, z = m[2] + dz * r;
      if (this.durak(x, z)) return [x, z];
    }
    return null;
  }
}

kipBandi();
console.log(`# K5 servis tetigi — kip ${KIP} · hucre ${HUCRE} br · ${YON} yon · oyuncu yaricapi ${LAYOUT.playerRadius}`);

type Toplam = { yanasik: number; ok: number; kor: number; korMasa: number; alan: number; sizinti: number; sizMasa: number; enUzak: number };
for (const d of DUNYALAR.slice(0, KISA ? 1 : DUNYALAR.length)) {
  const alan = new Alan(d, activeSolids(d.tables, d.areasOpen));
  const hA = HUCRE * HUCRE;
  console.log(`\n## ${d.ad} — ${d.tables} masa`);
  console.log('kol            | masa | tip   | yanasik yon | servis% | kor yon | alan br2 | sizinti br2 | en uzak br');
  // Kolun dışında: yanaşık durakların kutuya en uzak mesafesi (köşe) — payın alt sınırı budur.
  const toplam = new Map<string, Toplam>(KOLLAR.map((k) => [k.ad, { yanasik: 0, ok: 0, kor: 0, korMasa: 0, alan: 0, sizinti: 0, sizMasa: 0, enUzak: 0 }]));
  // Yanaşık duraklar kol bağımsızdır → masa başına bir kez.
  const yanasik: [number, number][][] = [];
  for (let i = 0; i < d.tables; i++) {
    const t = LAYOUT.tables[i], h = tableHalfFor(i);
    const out: [number, number][] = [];
    const kendi: Solid[] = [{ c: t.table, h }];
    for (let k = 0; k < YON; k++) {
      const th = (2 * Math.PI * k) / YON;
      const p = alan.yaklas(t.table, th, Math.min(h[0], h[1]) * 0.5);
      if (!p) continue;
      const ix = p[0] - Math.cos(th) * HUCRE * 1.5, iz = p[1] - Math.sin(th) * HUCRE * 1.5;
      if (hitsSolid(ix, iz, kendi, LAYOUT.playerRadius)) out.push(p);
    }
    yanasik.push(out);
  }
  for (const kol of KOLLAR) {
    const T = toplam.get(kol.ad)!;
    for (let i = 0; i < d.tables; i++) {
      const t = LAYOUT.tables[i];
      const ys = yanasik[i];
      let ok = 0;
      for (const p of ys) if (kol.tetik(p[0], p[1], i)) ok++;
      // Alan taraması: tetiğin kapsadığı yürünebilir hücreler + başka masayla örtüşen kısım.
      let hucre = 0, siz = 0, enUzak = 0;
      const r = 2.6;
      for (let x = t.table[0] - r; x <= t.table[0] + r; x += HUCRE) {
        for (let z = t.table[2] - r; z <= t.table[2] + r; z += HUCRE) {
          if (!alan.durak(x, z) || !kol.tetik(x, z, i)) continue;
          hucre++;
          enUzak = Math.max(enUzak, Math.hypot(x - t.table[0], z - t.table[2]));
          for (let j = 0; j < d.tables; j++) {
            if (j !== i && kol.tetik(x, z, j)) { siz++; break; }
          }
        }
      }
      const kor = ys.length - ok;
      console.log(
        `${kol.ad.padEnd(14)} | ${String(i).padStart(4)} | ${(t.kind ?? 'four').padEnd(5)} | ${String(ys.length).padStart(11)} | ` +
        `${(ys.length ? (100 * ok) / ys.length : 0).toFixed(1).padStart(7)} | ${String(kor).padStart(7)} | ` +
        `${(hucre * hA).toFixed(2).padStart(8)} | ${(siz * hA).toFixed(2).padStart(11)} | ${enUzak.toFixed(2).padStart(10)}`,
      );
      T.yanasik += ys.length; T.ok += ok; T.kor += kor; if (kor > 0) T.korMasa++;
      T.alan += hucre * hA; T.sizinti += siz * hA; if (siz > 0) T.sizMasa++; T.enUzak = Math.max(T.enUzak, enUzak);
    }
  }
  console.log(`\n### ozet — ${d.ad}`);
  console.log('kol            | servis% (yanasik yon) | kor yon | kor masa | alan br2 | sizinti br2 | sizintili masa | en uzak br');
  for (const kol of KOLLAR) {
    const T = toplam.get(kol.ad)!;
    console.log(
      `${kol.ad.padEnd(14)} | ${((100 * T.ok) / Math.max(1, T.yanasik)).toFixed(1).padStart(21)} | ${String(T.kor).padStart(7)} | ` +
      `${String(T.korMasa).padStart(8)} | ${T.alan.toFixed(1).padStart(8)} | ${T.sizinti.toFixed(2).padStart(11)} | ` +
      `${String(T.sizMasa).padStart(14)} | ${T.enUzak.toFixed(2).padStart(10)}`,
    );
  }
  // PAY ALT SINIRI: yanaşık durakların masa kutusuna EN UZAK olanı (köşe). Her kenar/köşe eşit
  // servis bu mesafeden küçük bir payla olamaz.
  let gereken = 0;
  for (let i = 0; i < d.tables; i++) {
    for (const p of yanasik[i]) gereken = Math.max(gereken, boxDist2D(p[0], p[1], LAYOUT.tables[i].table, tableHalfFor(i)));
  }
  console.log(`gereken pay (yanasik duraklarin kutuya en uzagi): ${gereken.toFixed(3)} br`);
  damga(`yanasik yon var (${d.ad})`, [...toplam.values()][0].yanasik > d.tables * 10, `${[...toplam.values()][0].yanasik}`);
  damga(`varyant etkili (${d.ad})`, toplam.get('S0 merkez 1,60')!.alan !== toplam.get('G7 govde+0,70')!.alan, 'S0 = G7');
}
damgaOzeti();
