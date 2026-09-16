/**
 * olcum-erisim-h1.ts — H1 ÖLÇÜM: üç oynanış hatası sayıya çevrilir (G-01 · G-02 · G-03).
 *
 * NE SORUYOR. Kullanıcı üç şikâyet bıraktı ve üçü de "bazen oluyor bazen olmuyor" diliyle
 * yazılmıştı: *"çay/bulaşık toplama masanın her tarafından olmuyor"* (G-01) · *"çay ocağından
 * alma güvenilmez, tepside yer varken"* (G-02) · *"2. masa görevinde kamera kendiliğinden
 * kayıyor"* (G-03). "Bazen" bir ölçü değildir. Bu araç üçünü de ORANLA söyler: oyuncunun
 * fiziksel olarak DURABİLDİĞİ yaklaşma yönlerinin yüzde kaçından tetik ateşliyor, erişim deliği
 * kaç br, kamera kaç kez ve kaç saniye oyuncudan ayrılıyor.
 *
 * TAKLİT YOK — ÇALIŞAN KODDAN OKUR. Yarıçaplar `economy.config.ts`ten, gövde yarıçapı ve katı
 * engeller `layout.ts`in KENDİ `activeSolids`/`hitsSolid`/`clampToOpenAreas` fonksiyonlarından
 * gelir; ikinci bir geometri yazılmaz. Tek istisna kirli kabın saçılma genişliğidir: o sayı
 * bugün `tick.ts` içinde düz bir sabittir (`(Math.random() - 0.5) * 0.6`) ve dışarı verilmez —
 * araç onu KAYNAKTAN regex ile okur ve damgalar. Desen değişip damga kırılırsa bu çıktı ölçüm
 * sayılmaz.
 *
 * ERİŞİLEBİLİRLİK GERÇEK: "durulabilir hücre" yetmez, hücrenin oyuncunun BAŞLANGIÇ noktasından
 * yürünerek varılabilir olması da gerekir. Kat dar açıklıklarla dolu (H3/D-098: 20 masanın 12'si
 * geçilemiyor), yani "boş görünen ama girilemeyen cep" bu katta kuraldır. O yüzden önce
 * `LAYOUT.player`dan taşma-doldurma yapılır; yön taraması yalnız BAĞLI bileşenin hücrelerini
 * durak sayar. Aksi hâlde araç, oyuncunun hiç gidemeyeceği bir noktadan "erişiliyor" derdi.
 *
 * YEDİ KOL (hiçbiri uygulanmaz; hepsi ölçülür — varyant kapısı, D-084):
 *   M1  masa/taban   — bugünkü hâl: r = cups.collectRadius, merkez KİRLİ KABIN rastgele noktası
 *   M2  masa/yarıçap — aynı merkez, r süpürülür (1,40 → 2,40): deliği kapatan en küçük r kaç?
 *   M3  masa/kutu    — tetik masanın ÇİZİLEN katısından (AABB + pay); kabın nereye düştüğü
 *                      tetiği SEÇMEZ — masaya yanaşan her yönden toplanır
 *   O1  ocak/taban   — bugünkü hâl: r = serving.pickupRadius, merkez TEZGÂHIN MERKEZİ
 *   O2  ocak/yarıçap — aynı merkez, r süpürülür (1,60 → 2,60)
 *   O3  ocak/kutu    — tetik tezgâhın ÇİZİLEN kutusundan (AABB + pay) — S24/D-120'nin dersi
 *   K1  kamera/taban — görev panının kendi sayıları (kaç pan · kaç sn · hedef ZATEN ekranda mıydı)
 *
 * HER KOL İÇİN ÜÇ SAYI (masa/ocak):
 *   yon%      erişilebilir YAKLAŞMA YÖNLERİNİN yüzde kaçından tetik ateşliyor
 *   korYon    hiçbir kap noktası için ateşlemeyen yön sayısı → kullanıcının "her tarafı" bu
 *   sizinti   tetiğin KOMŞU objenin işine karışması (yanlış masadan toplama / yükseltmeyi yemek)
 *
 * `sizinti` genişletmenin BEDELİDİR ve tahminle değil taramayla bulunur. Ocakta bedelin adı
 * bellidir: `tick.ts`in 1138. satırındaki gardiyan, oyuncu ocağın menzilindeyken servis
 * YÜKSELTME dolumunu tamamen durdurur. Menzil büyürse yükseltme noktası ölür; o mesafe ölçülür.
 *
 * KAMERA BÖLÜMÜ GERÇEK GEÇİŞİ KULLANIR. `__setQuest` tek başına pan ATEŞLEMEZ: odak isteği
 * tick'in `gap → active` geçişinde doğar (tick.ts, görev geçiş ritmi). Araç da tam o durumu
 * kurar (`questPhase: 'gap'`) ve tick'in kendi geçişini koşturur — ölçülen yol oyundakinin
 * aynısıdır, ayrı bir kamera taklidi yazılmaz.
 * KARARI VERECEK SAYI "pan oldu mu" DEĞİL: **hedef, pan başlamadan önce zaten ekranda mıydı.**
 * Ekranda duran bir şeye kamerayı kaydırmak yönlendirme değil gürültüdür. Aynı izdüşümle
 * oyuncunun pan sırasında ekran dışına çıkıp çıkmadığı da ölçülür — asıl şikâyet budur.
 * İzdüşüm sahnenin GERÇEK `projectionMatrix` × `matrixWorldInverse` çarpımıdır (kare kare
 * okunur); "kamera şuraya bakıyordur" diye bir varsayım kurulmaz.
 *
 * KOŞU KİPİ (D-084): `OLCUM=tam` → ızgara 0,02 br · 360 yön · TÜM masalar · her iki servis yeri ·
 * kamera 7 görev. Kısa koşu → 0,05 br · 120 yön · ilk salon · kamera 3 görev. Rapora yalnız tam
 * koşu girer.
 *
 * Çalıştır:
 *   OLCUM=tam npx tsx tools/olcum-erisim-h1.ts > docs/olcum-erisim-h1.txt
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import {
  LAYOUT,
  activeSolids,
  clampToOpenAreas,
  hitsSolid,
  servicePlace,
  type Solid,
} from '../src/game/layout.ts';
import { MAX_AREAS } from '../src/game/world.ts';
import { economyConfig as C } from '../src/config/economy.config.ts';
import { KIP, KISA, damga, damgaOzeti, kipBandi } from './olcum-lib.ts';
// @ts-expect-error — duman.mjs türsüz (tools/ tsc -b kapsamında değil).
import { adres, hazirSinyali, sunucuKomutu, sunucuyuBekle } from './duman.mjs';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number.parseInt(process.env.H1_PORT ?? '', 10) || 5237;
/** Izgara adımı (br) — hem taşma-doldurma hem yön taraması bunu kullanır. */
const HUCRE = KISA ? 0.05 : 0.02;
/** Yaklaşma yönü sayısı (360 = 1°). */
const YON = KISA ? 120 : 360;
/** Yön taramasında merkezden en fazla bu kadar uzağa bakılır (br). */
const EN_UZAK = 4.0;

/**
 * TABAN DEĞERLER — H1 ÖNCESİ hâl. Uygulama bu ikisini config'ten kaldırdığı (yarıçap → pay)
 * için burada sabit dururlar: taban satırı raporun "önce" sütunudur ve sonradan kaymamalıdır.
 * (`cups.collectRadius` config'te kaldı ama anlamı değişti — artık PERSONELİN varış mesafesi.)
 */
const MASA_TABAN = 1.4;
const OCAK_TABAN = 1.6;

const f2 = (n: number) => n.toFixed(2);
const yuzde = (a: number, b: number) => (b === 0 ? '—' : ((100 * a) / b).toFixed(1));

// =============================================================================================
//  KAYNAKTAN OKUNAN SABİT — kirli kabın saçılma genişliği (bugün tick.ts içinde gömülü)
// =============================================================================================
function kapSacilmasi(): number {
  const src = readFileSync(path.join(KOK, 'src/game/tick.ts'), 'utf8');
  const m = /slot\.table\[0\]\s*\+\s*\(Math\.random\(\)\s*-\s*0\.5\)\s*\*\s*([\d.]+)/.exec(src);
  damga('kap sacilmasi kaynaktan okundu', m != null, 'tick.ts deseni bulunamadi');
  return m ? Number.parseFloat(m[1]) : Number.NaN;
}
const SACILMA = kapSacilmasi();

// =============================================================================================
//  DÜNYA + ERİŞİLEBİLİRLİK ALANI
// =============================================================================================
type Dunya = { ad: string; tables: number; areasOpen: number };

/** Kısa koşu tek dünya (ilk salon); tam koşu iki dünya — servis YER DEĞİŞTİRİYOR (D-062). */
function dunyalar(): Dunya[] {
  const tam: Dunya[] = [
    { ad: 'erken (1 salon · sol duvar)', tables: 4, areasOpen: 1 },
    { ad: 'gec (3 salon · arka bant)', tables: LAYOUT.tables.length, areasOpen: MAX_AREAS },
  ];
  return KISA ? tam.slice(0, 1) : tam;
}

/**
 * Oyuncunun GERÇEKTEN varabildiği hücreler. Katı yok + açık alan içi olmak yetmez; hücre
 * `LAYOUT.player`dan yürünerek varılabilir olmalı (taşma-doldurma, 4 komşulu).
 */
class Alan {
  readonly minX: number;
  readonly minZ: number;
  readonly nx: number;
  readonly nz: number;
  private readonly bagli: Uint8Array;
  readonly durulabilirSayi: number;
  readonly bagliSayi: number;

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
    const durulabilir = new Uint8Array(this.nx * this.nz);
    let sayi = 0;
    const r = LAYOUT.playerRadius;
    for (let ix = 0; ix < this.nx; ix++) {
      const x = minX + ix * HUCRE;
      for (let iz = 0; iz < this.nz; iz++) {
        const z = minZ + iz * HUCRE;
        const [cx, cz] = clampToOpenAreas(x, z, d.areasOpen);
        if (Math.abs(cx - x) > 1e-9 || Math.abs(cz - z) > 1e-9) continue; // açık alanın dışı
        if (hitsSolid(x, z, solids, r)) continue;
        durulabilir[ix * this.nz + iz] = 1;
        sayi++;
      }
    }
    this.durulabilirSayi = sayi;
    const bagli = new Uint8Array(this.nx * this.nz);
    const s0 = this.indeks(LAYOUT.player[0], LAYOUT.player[2]);
    let bagliSayi = 0;
    if (s0 >= 0 && durulabilir[s0]) {
      const yigin: number[] = [s0];
      bagli[s0] = 1; bagliSayi = 1;
      while (yigin.length) {
        const k = yigin.pop()!;
        const ix = Math.floor(k / this.nz), iz = k % this.nz;
        const komsu = [
          ix > 0 ? k - this.nz : -1,
          ix < this.nx - 1 ? k + this.nz : -1,
          iz > 0 ? k - 1 : -1,
          iz < this.nz - 1 ? k + 1 : -1,
        ];
        for (const n of komsu) {
          if (n < 0 || bagli[n] || !durulabilir[n]) continue;
          bagli[n] = 1; bagliSayi++; yigin.push(n);
        }
      }
    }
    this.bagli = bagli;
    this.bagliSayi = bagliSayi;
    damga(`erisim alani dolu (${d.ad})`, bagliSayi > 1000, `${bagliSayi} hucre`);
  }

  private indeks(x: number, z: number): number {
    const ix = Math.round((x - this.minX) / HUCRE);
    const iz = Math.round((z - this.minZ) / HUCRE);
    if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) return -1;
    return ix * this.nz + iz;
  }

  /** Oyuncu buraya YÜRÜYEREK gelip durabilir mi? */
  durak(x: number, z: number): boolean {
    const k = this.indeks(x, z);
    return k >= 0 && this.bagli[k] === 1;
  }

  /** θ yönünden objeye yaklaşan oyuncunun durabildiği EN YAKIN nokta; yoksa null (yön kapalı). */
  yaklas(merkez: readonly number[], th: number, basla: number): [number, number] | null {
    const dx = Math.cos(th), dz = Math.sin(th);
    for (let r = basla; r <= EN_UZAK; r += HUCRE) {
      const x = merkez[0] + dx * r, z = merkez[2] + dz * r;
      if (this.durak(x, z)) return [x, z];
    }
    return null;
  }
}

/** Noktanın AABB'ye (merkez c, yarı h) mesafesi — kutu tetiği bunu kullanır. */
function kutuMesafe(x: number, z: number, c: readonly number[], h: readonly number[]): number {
  const dx = Math.max(0, Math.abs(x - c[0]) - h[0]);
  const dz = Math.max(0, Math.abs(z - c[2]) - h[1]);
  return Math.hypot(dx, dz);
}

// =============================================================================================
//  BÖLÜM A1 — MASADAKİ KİRLİ KABA ERİŞİM (G-01)
// =============================================================================================
/** Kirli kabın düşebileceği noktalar — tick.ts'in dağılımı ızgaraya açılır (köşeler dahil). */
function kapNoktalari(masa: readonly number[]): [number, number][] {
  const n = KISA ? 5 : 7;
  const yari = SACILMA / 2;
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      out.push([
        masa[0] - yari + (2 * yari * i) / (n - 1),
        masa[2] - yari + (2 * yari * j) / (n - 1),
      ]);
    }
  }
  return out;
}

/**
 * YANAŞIK YÖN — ölçünün tabanı. "Oyuncunun durabildiği her yön" yanlış bir payda olurdu:
 * sandalyenin ARKASINDA duran oyuncu masaya gelmiş sayılmaz, tetiğin orada ateşlememesi de
 * kusur değildir. Payda bu yüzden **gövdesiyle masaya değebildiği** yönlerdir: durağın masa
 * kutusuna mesafesi ≤ gövde yarıçapı + bir hücre. Kullanıcının *"masanın her tarafından"*
 * dediği küme tam olarak budur.
 */
const YANASIK_PAY = LAYOUT.playerRadius + HUCRE;

type MasaSatir = {
  dunya: string; i: number; kind: string; yanasikYon: number;
  m1yon: string; m1kor: number; m1enKotuKap: string; m2r: number;
  sizintiM2: number; sizintiM3: number;
};

function masaOlc(d: Dunya, alan: Alan): MasaSatir[] {
  const R0 = MASA_TABAN;
  const satirlar: MasaSatir[] = [];
  for (let i = 0; i < d.tables; i++) {
    const t = LAYOUT.tables[i];
    const half = t.kind === 'deuce' ? LAYOUT.deuceHalf : LAYOUT.tableHalf;
    const kaplar = kapNoktalari(t.table);
    const basla = Math.min(half[0], half[1]) * 0.5;
    const yanasik: [number, number][] = [];
    for (let k = 0; k < YON; k++) {
      const p = alan.yaklas(t.table, (2 * Math.PI * k) / YON, basla);
      if (p && kutuMesafe(p[0], p[1], t.table, half) <= YANASIK_PAY) yanasik.push(p);
    }
    // M1 — bugünkü hâl. (yön × kap) çiftlerinin kaçında ateşliyor · hiç ateşlemeyen yön sayısı ·
    // EN KÖTÜ kap noktasının yakalandığı yön yüzdesi (kap oraya düşerse oyuncunun yaşadığı şey).
    let m1ok = 0, m1toplam = 0, m1kor = 0;
    const kapBasina = kaplar.map(() => 0);
    for (const p of yanasik) {
      let birTane = false;
      kaplar.forEach((kp, ki) => {
        m1toplam++;
        if (Math.hypot(p[0] - kp[0], p[1] - kp[1]) < R0) { m1ok++; kapBasina[ki]++; birTane = true; }
      });
      if (!birTane) m1kor++;
    }
    const enKotu = kapBasina.length ? Math.min(...kapBasina) : 0;
    // M2 — her (yanaşık yön × kap) çiftini yakalayan en küçük yarıçap (0,05 adım).
    let m2r = Number.NaN;
    for (let r = R0; r <= 2.4001; r += 0.05) {
      let hepsi = true;
      for (const p of yanasik) {
        for (const kp of kaplar) {
          if (Math.hypot(p[0] - kp[0], p[1] - kp[1]) >= r) { hepsi = false; break; }
        }
        if (!hepsi) break;
      }
      if (hepsi) { m2r = r; break; }
    }
    // SIZINTI — genişletmenin bedeli. M3'ün payı tanımı gereği YANASIK_PAY'dir (kutuya değmek),
    // yani M3 yön%'i 100'dür; M3'ün ödediği yer burasıdır: aynı durakta KOMŞU masa da tetikleniyor mu.
    const m2Uyg = Number.isNaN(m2r) ? 2.4 : m2r;
    let sizM2 = 0, sizM3 = 0;
    for (const p of yanasik) {
      let m2Carpti = false, m3Carpti = false;
      for (let j = 0; j < d.tables; j++) {
        if (j === i) continue;
        const tj = LAYOUT.tables[j];
        const hj = tj.kind === 'deuce' ? LAYOUT.deuceHalf : LAYOUT.tableHalf;
        if (!m2Carpti) {
          for (const kp of kapNoktalari(tj.table)) {
            if (Math.hypot(p[0] - kp[0], p[1] - kp[1]) < m2Uyg) { m2Carpti = true; break; }
          }
        }
        if (!m3Carpti && kutuMesafe(p[0], p[1], tj.table, hj) <= YANASIK_PAY) m3Carpti = true;
      }
      if (m2Carpti) sizM2++;
      if (m3Carpti) sizM3++;
    }
    satirlar.push({
      dunya: d.ad, i, kind: t.kind ?? 'four', yanasikYon: yanasik.length,
      m1yon: yuzde(m1ok, m1toplam), m1kor, m1enKotuKap: yuzde(enKotu, yanasik.length),
      m2r, sizintiM2: sizM2, sizintiM3: sizM3,
    });
  }
  return satirlar;
}

// =============================================================================================
//  BÖLÜM A2 — OCAKTAN / TEZGÂHTAN ÜRÜN ALMA (G-02)
// =============================================================================================
type OcakSatir = {
  dunya: string; yer: string; yanasikYon: number; o1yon: string; o1kor: number;
  oluOn: number; canliOn: number; o2r: number; upMesafe: number;
  o2Yukseltme: string; o3Yukseltme: string;
};

function ocakOlc(d: Dunya, alan: Alan): OcakSatir {
  const sp = servicePlace(d.areasOpen);
  const R0 = OCAK_TABAN;
  const basla = Math.min(sp.half[0], sp.half[1]) * 0.5;
  const acik: [number, number][] = [];
  for (let k = 0; k < YON; k++) {
    const p = alan.yaklas(sp.station, (2 * Math.PI * k) / YON, basla);
    if (p && kutuMesafe(p[0], p[1], sp.station, sp.half) <= YANASIK_PAY) acik.push(p);
  }
  let o1ok = 0;
  for (const p of acik) if (Math.hypot(p[0] - sp.station[0], p[1] - sp.station[2]) < R0) o1ok++;
  // ÖLÜ ÖN YÜZ: tezgâhın UZUN kenarı boyunca oyuncunun yanaşabildiği hattın kaç br'si tetiklemiyor.
  const uzunX = sp.half[0] >= sp.half[1];
  let oluOn = 0, canliOn = 0;
  {
    const yarim = uzunX ? sp.half[0] : sp.half[1];
    const derin = (uzunX ? sp.half[1] : sp.half[0]) + LAYOUT.playerRadius + HUCRE;
    for (let t = -yarim; t <= yarim + 1e-9; t += HUCRE) {
      for (const yon of [-1, 1]) {
        const x = uzunX ? sp.station[0] + t : sp.station[0] + yon * derin;
        const z = uzunX ? sp.station[2] + yon * derin : sp.station[2] + t;
        if (!alan.durak(x, z)) continue;
        if (Math.hypot(x - sp.station[0], z - sp.station[2]) >= R0) oluOn += HUCRE;
        else canliOn += HUCRE;
      }
    }
  }
  let o2r = Number.NaN;
  for (let r = R0; r <= 2.6001; r += 0.05) {
    if (acik.every((p) => Math.hypot(p[0] - sp.station[0], p[1] - sp.station[2]) < r)) { o2r = r; break; }
  }
  // BEDEL — tick.ts 1138 gardiyanı: oyuncu ocağın menzilindeyken servis YÜKSELTME dolumu başlamaz.
  // Menzil yükseltme noktasını yutarsa o nokta ölür; O3'te menzil kutunun payı kadardır.
  const upMerkez = Math.hypot(sp.upgradeSpot[0] - sp.station[0], sp.upgradeSpot[2] - sp.station[2]);
  const upKutu = kutuMesafe(sp.upgradeSpot[0], sp.upgradeSpot[2], sp.station, sp.half);
  const o2Uyg = Number.isNaN(o2r) ? 2.6 : o2r;
  return {
    dunya: d.ad, yer: d.areasOpen >= 3 ? 'arka bant' : 'sol duvar',
    yanasikYon: acik.length, o1yon: yuzde(o1ok, acik.length), o1kor: acik.length - o1ok,
    oluOn, canliOn, o2r, upMesafe: upMerkez,
    o2Yukseltme: upMerkez < o2Uyg ? 'ÖLÜR' : 'yasar',
    o3Yukseltme: upKutu <= YANASIK_PAY ? 'ÖLÜR' : 'yasar',
  };
}

// =============================================================================================
//  BÖLÜM B — GÖREV PANI (G-03)
// =============================================================================================
/** Kamera bölümünde ateşlenecek görevler (kısa koşuda ilk üçü). */
const KAMERA_GOREVLER = (KISA
  ? ['q_serve1', 'q_coin', 'q_table2']
  : ['q_serve1', 'q_coin', 'q_table2', 'q_charTray1', 'q_serve5', 'q_station1', 'q_wash']
).map((id) => ({ id, idx: C.quests.findIndex((q) => q.id === id) }));

type Ornek = {
  t: number;
  focus: [number, number, number] | null;
  cam: [number, number, number];
  player: [number, number, number];
  pv: number[]; // projectionMatrix × matrixWorldInverse (16, sütun-öncelikli — three.js düzeni)
};

type PanSatir = {
  gorev: string;
  panOldu: boolean;
  hedefEkranda: string;
  hedefUzak: number;
  panSure: number;
  oyuncuDisi: number;
  enBuyukSapma: number;
};

/** Dünya noktasını NDC'ye taşır. `pv` three.js düzeninde (sütun-öncelikli) 16 sayı. */
function ndc(pv: number[], p: readonly number[]): [number, number, number] | null {
  const x = p[0], y = p[1], z = p[2];
  const w = pv[3] * x + pv[7] * y + pv[11] * z + pv[15];
  if (Math.abs(w) < 1e-9) return null;
  return [
    (pv[0] * x + pv[4] * y + pv[8] * z + pv[12]) / w,
    (pv[1] * x + pv[5] * y + pv[9] * z + pv[13]) / w,
    (pv[2] * x + pv[6] * y + pv[10] * z + pv[14]) / w,
  ];
}
const ekranda = (n: [number, number, number] | null) =>
  n != null && n[2] > -1 && n[2] < 1 && Math.abs(n[0]) <= 1 && Math.abs(n[1]) <= 1;

function panOlc(gorev: string, ornekler: Ornek[], gecisT: number): PanSatir {
  // Yalnız GEÇİŞTEN SONRAKİ odak sayılır; ön rulodaki (sıfırlama/reveal) panlar ölçüm değildir.
  const ilk = ornekler.findIndex((o) => o.t >= gecisT && o.focus != null);
  const sonrasi = ornekler.filter((o) => o.t >= gecisT);
  if (ilk < 0) {
    return { gorev, panOldu: false, hedefEkranda: '—', hedefUzak: 0, panSure: 0, oyuncuDisi: 0, enBuyukSapma: 0 };
  }
  const hedef = ornekler[ilk].focus!;
  // Pan BAŞLAMADAN önceki kare: hedef o an ekranda mıydı?
  const onceki = ornekler[Math.max(0, ilk - 1)];
  const hedefNdc = ndc(onceki.pv, [hedef[0], 0.6, hedef[2]]);
  const son = sonrasi.map((o) => (o.focus != null ? o.t : -1)).filter((t) => t >= 0);
  const panSure = son.length ? son[son.length - 1] - son[0] : 0;
  let disi = 0, sapma = 0;
  const dt = ornekler.length > 1 ? ornekler[1].t - ornekler[0].t : 0.05;
  for (const o of sonrasi) {
    const pn = ndc(o.pv, [o.player[0], 1.0, o.player[2]]);
    if (!ekranda(pn)) disi += dt;
    // Kameranın oyuncudan yatay sapması: odaksız kamera hep oyuncunun tam üstünde/arkasındadır.
    sapma = Math.max(sapma, Math.hypot(o.cam[0] - o.player[0], o.cam[2] - o.player[2] - (o.cam[1])));
  }
  return {
    gorev,
    panOldu: true,
    hedefEkranda: hedefNdc ? (ekranda(hedefNdc) ? 'EVET' : 'hayir') : '?',
    hedefUzak: Math.hypot(hedef[0] - onceki.player[0], hedef[2] - onceki.player[2]),
    panSure,
    oyuncuDisi: disi,
    enBuyukSapma: sapma,
  };
}

/**
 * Tarayıcıda koşar: `gap → active` geçişini kurar, tick'in KENDİ pan isteğini örnekler.
 *
 * ÖN RULO ŞART: "hedef pan başlamadan önce ekranda mıydı?" sorusunun cevabı pan'dan ÖNCEKİ
 * karede durur. O yüzden geçiş kurulmadan önce de örnek alınır — yoksa ilk örnek zaten odaklı
 * gelir ve soru kendi kendini yanıtlamış olur.
 */
/*
 * METİN OLARAK YAZILIYOR, FONKSİYON OLARAK DEĞİL — bu bir üslup tercihi değil, ölçülmüş bir
 * zorunluluk: `tsx` (esbuild) adlandırılmış her fonksiyonu `__name(...)` yardımcısıyla sarar;
 * fonksiyon sayfaya serileştirilince o yardımcı orada olmadığı için koşu
 * `ReferenceError: __name is not defined` ile düşüyor. Metin geçirilince esbuild dokunmuyor.
 * (`olcum-tetik-s24.ts` aynı sebeple metin kullanıyor.)
 */
const panKodu = (idx: number, onRuloMs: number, sureMs: number, araMs: number) => `(async () => {
  const w = window;
  const uyu = (ms) => new Promise((r) => setTimeout(r, ms));
  w.__resetGame();
  await uyu(400);
  // TUZAK (ilk koşuda yakalandı): \`hardReset\` 0. görevin odağını KURARAK başlıyor (store.ts).
  // Temizlenmezse ön rulonun ilk karesi zaten odaklıdır ve araç, ölçmek istediği görev geçişi
  // yerine SIFIRLAMANIN panını ölçer — üç görev de aynı hedefi, aynı uzaklığı yazar.
  // Odak sıfırlanır ve GERÇEKTEN söndüğü doğrulanır; sönmüyorsa damga kırılır.
  w.__setState({ camFocus: null });
  await uyu(250);
  const onRuloTemiz = w.__game().camFocus == null;
  const kayit = [];
  const t0 = performance.now();
  const ornekAl = () => {
    const g = w.__game();
    const cam = w.__three.camera;
    cam.updateMatrixWorld();
    const p = cam.projectionMatrix.elements, v = cam.matrixWorldInverse.elements;
    const pv = [];
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += p[k * 4 + r] * v[c * 4 + k];
        pv[c * 4 + r] = s;
      }
    }
    kayit.push({
      t: (performance.now() - t0) / 1000,
      focus: g.camFocus ? g.camFocus.pos.slice() : null,
      cam: [cam.position.x, cam.position.y, cam.position.z],
      player: [g.player[0], g.player[1], g.player[2]],
      pv,
    });
  };
  // ÖN RULO SABİT SÜRE DEĞİL, KOŞUL: sıfırlamadan sonra sahne kendi reveal panlarını da
  // ateşliyor (yeni açılan noktalar). Sabit beklemek bunu yalnız erteler — araç kameranın
  // GERÇEKTEN boşa düştüğünü bekler, sonra geçişi kurar.
  let sessiz = 0;
  while (performance.now() - t0 < ${onRuloMs} || sessiz < 6) {
    ornekAl();
    sessiz = kayit[kayit.length - 1].focus == null ? sessiz + 1 : 0;
    if (performance.now() - t0 > 12000) break;
    await uyu(${araMs});
  }
  const gecisT = (performance.now() - t0) / 1000;
  // Görev geçiş ritminin SON adımı: 'gap' dolunca tick yeni görevi aktif eder ve questFocusPos
  // ile kamera odağı ister. Pan bu yoldan doğar, başka yoldan değil.
  w.__setState({ questIndex: ${idx}, questPhase: 'gap', questPhaseT: 0.05, questDoneIndex: ${idx - 1}, camFocus: null });
  const bitis = performance.now() + ${sureMs};
  while (performance.now() < bitis) { ornekAl(); await uyu(${araMs}); }
  return { kayit, onRuloTemiz, gecisT, questId: w.__game().quest ? w.__game().quest.id : null };
})()`;

// =============================================================================================
//  KOŞU
// =============================================================================================
kipBandi();

console.log('='.repeat(100));
console.log(`H1 ERİŞİM ÖLÇÜMÜ — ${KIP.toUpperCase()} koşu · ızgara ${HUCRE} br · ${YON} yön · ${new Date().toISOString().slice(0, 10)}`);
console.log(
  `gövde yarıçapı ${f2(LAYOUT.playerRadius)} · taban: collect ${f2(MASA_TABAN)} / pickup ${f2(OCAK_TABAN)} · ` +
  `pickupReach ${f2(C.serving.pickupReach)} · collectReach ${f2(C.cups.collectReach)} · kap saçılması ${f2(SACILMA)} · ` +
  `masa yarısı four ${f2(LAYOUT.tableHalf[0])} / deuce ${f2(LAYOUT.deuceHalf[0])}`,
);
console.log('='.repeat(100));

const masaSatirlari: MasaSatir[] = [];
const ocakSatirlari: OcakSatir[] = [];
for (const d of dunyalar()) {
  const solids = activeSolids(d.tables, d.areasOpen);
  const alan = new Alan(d, solids);
  console.log(
    `\n--- DÜNYA: ${d.ad} · ${d.tables} masa · erişilebilir ${(alan.bagliSayi * HUCRE * HUCRE).toFixed(1)} br² ` +
    `(durulabilirin %${yuzde(alan.bagliSayi, alan.durulabilirSayi)}'i — gerisi girilemeyen cep)`,
  );
  masaSatirlari.push(...masaOlc(d, alan));
  ocakSatirlari.push(ocakOlc(d, alan));
}

console.log(`\n### G-01 — MASADAKİ KİRLİ KABA ERİŞİM (payda: masaya GÖVDESİYLE yanaşılabilen yön · pay ${f2(YANASIK_PAY)} br)`);
console.log('dünya                        | masa | tip   | yanaşık yön | M1 yön% | M1 kör yön | M1 en kötü kap yön% | M2 gereken r | M2 sızıntı yön | M3 sızıntı yön');
for (const s of masaSatirlari) {
  console.log(
    `${s.dunya.padEnd(28)} | ${String(s.i).padStart(4)} | ${s.kind.padEnd(5)} | ${String(s.yanasikYon).padStart(11)} | ` +
    `${s.m1yon.padStart(7)} | ${String(s.m1kor).padStart(10)} | ${s.m1enKotuKap.padStart(19)} | ` +
    `${(Number.isNaN(s.m2r) ? '>2,40' : f2(s.m2r)).padStart(12)} | ` +
    `${String(s.sizintiM2).padStart(14)} | ${String(s.sizintiM3).padStart(14)}`,
  );
}
{
  const kor = masaSatirlari.filter((s) => s.m1kor > 0).length;
  const tam = masaSatirlari.filter((s) => s.m1yon === '100.0').length;
  const yonler = masaSatirlari.map((s) => Number.parseFloat(s.m1yon));
  console.log(
    `ÖZET: ${masaSatirlari.length} masanın ${kor}'sinde TÜMÜYLE kör yön var · ${tam}'sinde tetik her (yön × kap) çiftini yakalıyor · ` +
    `M1 yön% en kötü ${Math.min(...yonler).toFixed(1)} / medyan ${medyan(yonler).toFixed(1)} / en iyi ${Math.max(...yonler).toFixed(1)} · ` +
    `M2 medyan r ${f2(medyan(masaSatirlari.map((s) => (Number.isNaN(s.m2r) ? 2.4 : s.m2r))))} · ` +
    `M2 sızıntılı masa ${masaSatirlari.filter((s) => s.sizintiM2 > 0).length} · M3 sızıntılı masa ${masaSatirlari.filter((s) => s.sizintiM3 > 0).length}`,
  );
}

// ---------------------------------------------------------------------------------------------
//  §PAY — kutu tetiğinin payı TAHMİNLE seçilmez (M3/O3 uygulama parametresi)
// ---------------------------------------------------------------------------------------------
// Oyuncu gövdesi kutuya en fazla `playerRadius` (0,47) kadar yaklaşabiliyor; KÖŞEDE ise
// hypot(0,47 · 0,47) = 0,66 br kalıyor (push-out eksen başına çalışıyor, daire değil). Yani pay
// 0,47 ise köşeden yanaşan oyuncu dışarıda kalır, pay büyüdükçe komşu masanın da tetiklenmesi
// yaklaşır. İki uç arasındaki pencere burada süpürülür — kapsama ve sızıntı AYNI satırda.
{
  console.log('\n### §PAY — kutu tetiğinin payı (kapsama ↔ sızıntı penceresi)');
  console.log('pay (br) | masa kapsama% (yanaşabilen yönün) | masa sızıntı yön | tezgâh kapsama% | tezgâh sızıntı');
  const d = dunyalar()[dunyalar().length - 1];
  const solids = activeSolids(d.tables, d.areasOpen);
  const alan = new Alan(d, solids);
  const sp = servicePlace(d.areasOpen);
  // Yaklaşabilen yön: oyuncunun objeye doğru yürüyüp durabildiği HER yön (köşeler dahil).
  const duraklarFor = (merkez: readonly number[], half: readonly [number, number]) => {
    const out: [number, number][] = [];
    for (let k = 0; k < YON; k++) {
      const p = alan.yaklas(merkez, (2 * Math.PI * k) / YON, Math.min(half[0], half[1]) * 0.5);
      if (p && kutuMesafe(p[0], p[1], merkez, half) <= 0.9) out.push(p);
    }
    return out;
  };
  const masaDuraklar = Array.from({ length: d.tables }, (_, i) => {
    const t = LAYOUT.tables[i];
    return duraklarFor(t.table, t.kind === 'deuce' ? LAYOUT.deuceHalf : LAYOUT.tableHalf);
  });
  const ocakDuraklar = duraklarFor(sp.station, sp.half);
  for (let pay = 0.45; pay <= 0.9001; pay += 0.05) {
    let kapsar = 0, toplam = 0, sizar = 0;
    for (let i = 0; i < d.tables; i++) {
      const t = LAYOUT.tables[i];
      const h = t.kind === 'deuce' ? LAYOUT.deuceHalf : LAYOUT.tableHalf;
      for (const p of masaDuraklar[i]) {
        toplam++;
        if (kutuMesafe(p[0], p[1], t.table, h) <= pay) kapsar++;
        for (let j = 0; j < d.tables; j++) {
          if (j === i) continue;
          const tj = LAYOUT.tables[j];
          const hj = tj.kind === 'deuce' ? LAYOUT.deuceHalf : LAYOUT.tableHalf;
          if (kutuMesafe(p[0], p[1], tj.table, hj) <= pay) { sizar++; break; }
        }
      }
    }
    let oKapsar = 0, oSizar = 0;
    for (const p of ocakDuraklar) {
      if (kutuMesafe(p[0], p[1], sp.station, sp.half) <= pay) oKapsar++;
      if (kutuMesafe(p[0], p[1], sp.dish, sp.dishHalf) <= pay) oSizar++; // bulaşık noktasıyla karışma
    }
    const secili = Math.abs(pay - C.cups.collectReach) < 0.001 || Math.abs(pay - C.serving.pickupReach) < 0.001;
    console.log(
      `${f2(pay).padStart(8)} | ${yuzde(kapsar, toplam).padStart(33)} | ${String(sizar).padStart(16)} | ` +
      `${yuzde(oKapsar, ocakDuraklar.length).padStart(15)} | ${String(oSizar).padStart(14)}` +
      (secili ? '   ← config' : ''),
    );
  }
  console.log(`config: cups.collectReach = ${f2(C.cups.collectReach)} · serving.pickupReach = ${f2(C.serving.pickupReach)}`);
}

console.log('\n### G-02 — OCAKTAN / TEZGÂHTAN ÜRÜN ALMA (payda: tezgâha gövdesiyle yanaşılabilen yön)');
console.log('yer        | yanaşık yön | O1 yön% | O1 kör | ölü ön yüz (br) | canlı ön yüz (br) | O2 gereken r | O2: yükseltme | O3: yükseltme | yükseltme mesafesi');
for (const s of ocakSatirlari) {
  console.log(
    `${s.yer.padEnd(10)} | ${String(s.yanasikYon).padStart(11)} | ${s.o1yon.padStart(7)} | ${String(s.o1kor).padStart(6)} | ` +
    `${f2(s.oluOn).padStart(15)} | ${f2(s.canliOn).padStart(17)} | ${(Number.isNaN(s.o2r) ? '>2,60' : f2(s.o2r)).padStart(12)} | ` +
    `${s.o2Yukseltme.padStart(13)} | ${s.o3Yukseltme.padStart(13)} | ${f2(s.upMesafe).padStart(18)}`,
  );
}

function medyan(xs: number[]): number {
  if (!xs.length) return Number.NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

// --- Kamera bölümü (tarayıcı)
const komut = sunucuKomutu(PORT, 'dev');
const sunucu = spawn(komut.dosya, komut.argv, { cwd: KOK, stdio: ['ignore', 'pipe', 'pipe'] });
if ((await hazirSinyali(sunucu)) !== 'hazir') { console.error('sunucu kalkmadi'); process.exit(1); }
if (!(await sunucuyuBekle(adres(PORT)))) { console.error('sunucu yanit vermiyor'); process.exit(1); }

const tarayici = await chromium.launch();
const sayfa = await tarayici.newPage({ viewport: { width: 1280, height: 800 } });
const konsolHata: string[] = [];
sayfa.on('console', (m) => { if (m.type() === 'error') konsolHata.push(m.text().slice(0, 160)); });
await sayfa.goto(adres(PORT), { waitUntil: 'domcontentloaded' });
await sayfa.waitForSelector('canvas', { timeout: 20000 });
await sayfa.waitForFunction(() => typeof (window as never as { __game?: unknown }).__game === 'function', { timeout: 20000 });
await sayfa.waitForFunction(() => (window as never as { __three?: unknown }).__three != null, { timeout: 20000 });

/**
 * GÖRÜŞ YARIÇAPI — "hedef zaten ekrandaydı" bulgusunu doğum yerine bağlı olmaktan çıkarır.
 * Oyuncunun etrafında kaç br'lik daire ekranda duruyor? Ölçüm sekiz yönde, gerçek izdüşümle
 * (kamera eğik olduğu için yön yön değişir) — en dar ve en geniş yön ayrı yazılır. Bundan sonra
 * "hedef uzaklığı < en dar görüş yarıçapı" ise pan tanımı gereği gürültüdür, tesadüf değil.
 */
const GORUS_KODU = `(async () => {
  const w = window;
  const uyu = (ms) => new Promise((r) => setTimeout(r, ms));
  // Sıfırlamanın kendi odağı kamerayı oyuncudan ayırıyor; ölçüm kamera oyuncuya OTURDUKTAN
  // sonra alınır, yoksa sekiz yönün sekizi de 0 döner (ilk koşuda tam bu oldu).
  w.__resetGame();
  await uyu(400);
  w.__setState({ camFocus: null });
  await uyu(1200);
  const cam = w.__three.camera; cam.updateMatrixWorld();
  const p = cam.projectionMatrix.elements, v = cam.matrixWorldInverse.elements;
  const pv = [];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0; for (let k = 0; k < 4; k++) s += p[k * 4 + r] * v[c * 4 + k];
    pv[c * 4 + r] = s;
  }
  const g = w.__game();
  const ic = (x, z) => {
    const ww = pv[3]*x + pv[7]*0.6 + pv[11]*z + pv[15];
    const nx = (pv[0]*x + pv[4]*0.6 + pv[8]*z + pv[12]) / ww;
    const ny = (pv[1]*x + pv[5]*0.6 + pv[9]*z + pv[13]) / ww;
    const nz = (pv[2]*x + pv[6]*0.6 + pv[10]*z + pv[14]) / ww;
    return nz > -1 && nz < 1 && Math.abs(nx) <= 1 && Math.abs(ny) <= 1;
  };
  const yaricaplar = [];
  for (let i = 0; i < 8; i++) {
    const th = (Math.PI * 2 * i) / 8;
    let r = 0;
    while (r < 60 && ic(g.player[0] + Math.cos(th) * (r + 0.25), g.player[2] + Math.sin(th) * (r + 0.25))) r += 0.25;
    yaricaplar.push(r);
  }
  return { yaricaplar, oyuncuEkranda: ic(g.player[0], g.player[2]), player: [g.player[0], g.player[1], g.player[2]] };
})()`;

const gorus = (await sayfa.evaluate(GORUS_KODU)) as
  { yaricaplar: number[]; oyuncuEkranda: boolean; player: number[] };
damga('gorus olcumunde oyuncu ekranda', gorus.oyuncuEkranda, 'kamera oyuncuya oturmadan olculdu');
const gorusDar = Math.min(...gorus.yaricaplar);
const gorusGenis = Math.max(...gorus.yaricaplar);
damga('gorus yaricapi olculdu', gorusDar > 1, `en dar ${gorusDar}`);

const panSatirlari: PanSatir[] = [];
for (const g of KAMERA_GOREVLER) {
  damga(`gorev bulundu (${g.id})`, g.idx > 0, `${g.id} economy.config'te yok`);
  if (g.idx <= 0) continue;
  const sonuc = (await sayfa.evaluate(panKodu(g.idx, 500, KISA ? 2600 : 4000, 50))) as
    { kayit: Ornek[]; onRuloTemiz: boolean; gecisT: number; questId: string | null };
  damga(`gorev aktif oldu (${g.id})`, sonuc.questId === g.id, `ekranda ${sonuc.questId}`);
  damga(`on rulo odaksiz (${g.id})`, sonuc.onRuloTemiz, 'sifirlamanin odagi sonmedi — olculen pan gecisin degil');
  damga(
    `on rulo pansiz (${g.id})`,
    sonuc.kayit.filter((o) => o.t < sonuc.gecisT).slice(-6).every((o) => o.focus == null),
    'gecis kurulmadan hemen once odak vardi',
  );
  panSatirlari.push(panOlc(g.id, sonuc.kayit, sonuc.gecisT));
}
damga('konsol temiz', konsolHata.length === 0, konsolHata.slice(0, 2).join(' | '));

await tarayici.close();
sunucu.kill();

console.log('\n### G-03 — GÖREV PANI (K1 taban: bugünkü davranış)');
console.log(
  `GÖRÜŞ YARIÇAPI (oyuncunun etrafında ekranda duran daire, 8 yön): en dar ${f2(gorusDar)} br · ` +
  `en geniş ${f2(gorusGenis)} br — bu sayının ALTINDAKİ her hedef pan'dan önce zaten ekrandadır.`,
);
console.log('görev         | pan oldu | hedef PAN ÖNCESİ ekranda | hedef uzaklık (br) | pan süresi (sn) | oyuncu ekran dışı (sn)');
for (const s of panSatirlari) {
  console.log(
    `${s.gorev.padEnd(13)} | ${(s.panOldu ? 'evet' : 'HAYIR').padStart(8)} | ${s.hedefEkranda.padStart(24)} | ` +
    `${f2(s.hedefUzak).padStart(18)} | ${f2(s.panSure).padStart(15)} | ${f2(s.oyuncuDisi).padStart(22)}`,
  );
}
{
  const panli = panSatirlari.filter((s) => s.panOldu);
  const gereksiz = panli.filter((s) => s.hedefEkranda === 'EVET');
  console.log(
    `ÖZET: ${panSatirlari.length} görevin ${panli.length}'inde pan oldu · ` +
    `${gereksiz.length}'inde hedef PAN ÖNCESİ zaten ekrandaydı (gürültü) · ` +
    `oyuncu toplam ${f2(panli.reduce((a, s) => a + s.oyuncuDisi, 0))} sn ekran dışında kaldı`,
  );
}

damgaOzeti();
