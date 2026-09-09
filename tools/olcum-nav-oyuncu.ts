/**
 * olcum-nav-oyuncu.ts — İKİ DÜNYA ÖLÇÜMÜ (D5).
 *
 * SORU: oyuncunun YÜRÜDÜĞÜ dünya ile rotaların KURULDUĞU dünya aynı değil. Nav ızgarası
 * `navSolids` + `actorRadius` (0,28) ile, SANDALYESİZ kurulur; oyuncu ise `activeSolids` +
 * `playerRadius` (0,47) ile, sandalyeler KATI olarak çarpışır. Yani personelin geçtiği
 * boşluktan oyuncu geçemeyebilir. Bu fark bugüne kadar hiç ÖLÇÜLMEDİ; iki yerde ısırdığı
 * biliniyordu ve iki yerde de yamayla geçildi:
 *   · `tools/olcum-bardak.ts` botu ±30/60/90° kayma + kara liste + kurtulma yamalarıyla dolu,
 *   · D-084 P2 damgaları "B1 · oyuncu kipinde bot hiç yürümüyor" kusurunu buldu ve açık bıraktı.
 *
 * BU ARAÇ TICK KOŞMAZ — analitiktir (geometri + BFS). Ölçtüğü dört kol:
 *   k1 AYRIŞMA        personele açık olup oyuncuya kapalı hücrelerin oranı (her açıklık için)
 *   k2 ULAŞILABİLİRLİK her etkileşim noktası oyuncunun dünyasında GERÇEKTEN erişilebilir mi
 *                      (yalnız "yakınında boş hücre var mı" değil: o hücre doğduğu yere BAĞLI mı)
 *   k3 TUZAK CEPLER   oyuncu dünyasının bağlı bileşenleri — doğuş bileşeni dışında kalan boşluk
 *   k4 PAY            her etkileşim noktasında oyuncuya kalan pay (yarıçap − en yakın erişilebilir
 *                      hücre mesafesi); pay ne kadar küçükse yerleşim o kadar kıl payı geçiyor
 *
 * KOŞU
 *   npx tsx tools/olcum-nav-oyuncu.ts                 # kısa (4 açıklık)
 *   OLCUM=tam npx tsx tools/olcum-nav-oyuncu.ts > docs/olcum-nav-oyuncu.txt   # 20 açıklık
 */
import {
  LAYOUT,
  NAV_CELL,
  activeSolids,
  navSolids,
  clampToOpenAreas,
  getNavGrid,
  PAD_RADIUS,
  TABLE_UP_RADIUS,
  LAVABO,
  servicePlace,
  openServices,
} from '../src/game/layout';
import { buildNavGrid, findNavPath, type NavGrid } from '../src/game/nav';
import { MAX_AREAS, areaTableSlots, areaTableStart } from '../src/game/world';
import { economyConfig as C } from '../src/config/economy.config';
import { KISA, kipBandi, damga, damgaOzeti, pct } from './olcum-lib';

// ---------------------------------------------------------------------------
// İKİ DÜNYA
// ---------------------------------------------------------------------------

/** Nokta AÇIK alanların birleşiminde mi? (`clampToOpenAreas` noktayı değiştirmiyorsa içeridedir.) */
function acikAlanda(x: number, z: number, areasOpen: number): boolean {
  const [cx, cz] = clampToOpenAreas(x, z, areasOpen);
  return cx === x && cz === z;
}

/**
 * OYUNCUNUN DÜNYASI — nav ızgarasıyla AYNI hücre ızgarası, farklı kurallar: katılar
 * `activeSolids` (sandalyeler dahil), şişirme `playerRadius`, ve açık alanların dışı kapalı
 * (oyuncu `clampToOpenAreas` ile kelepçeli — personel değil).
 */
function oyuncuIzgarasi(tables: number, areasOpen: number): NavGrid {
  const g = buildNavGrid(LAYOUT.area, NAV_CELL, activeSolids(tables, areasOpen), LAYOUT.playerRadius);
  for (let r = 0; r < g.rows; r++) {
    const z = g.minZ + (r + 0.5) * g.cell;
    for (let c = 0; c < g.cols; c++) {
      const x = g.minX + (c + 0.5) * g.cell;
      if (!acikAlanda(x, z, areasOpen)) g.blocked[r * g.cols + c] = 1;
    }
  }
  return g;
}

/** Personelin dünyası, oyuncununkiyle KIYASLANABİLİR olsun diye aynı alan kelepçesiyle. */
function personelIzgarasi(tables: number, areasOpen: number): NavGrid {
  const src = getNavGrid(tables, areasOpen);
  const g: NavGrid = { ...src, blocked: src.blocked.slice() };
  for (let r = 0; r < g.rows; r++) {
    const z = g.minZ + (r + 0.5) * g.cell;
    for (let c = 0; c < g.cols; c++) {
      const x = g.minX + (c + 0.5) * g.cell;
      if (!acikAlanda(x, z, areasOpen)) g.blocked[r * g.cols + c] = 1;
    }
  }
  return g;
}

const merkez = (g: NavGrid, idx: number): [number, number] => {
  const r = Math.floor(idx / g.cols);
  const c = idx - r * g.cols;
  return [g.minX + (c + 0.5) * g.cell, g.minZ + (r + 0.5) * g.cell];
};

const KOMSU: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/** Bağlı bileşenler — `findNavPath` ile AYNI köşe-kesme kuralı (çapraz adımda iki ortogonal açık). */
function bilesenler(g: NavGrid): Int32Array {
  const { cols, rows, blocked } = g;
  const bil = new Int32Array(cols * rows).fill(-1);
  let n = 0;
  for (let s = 0; s < bil.length; s++) {
    if (blocked[s] || bil[s] >= 0) continue;
    bil[s] = n;
    const q = [s];
    let h = 0;
    while (h < q.length) {
      const idx = q[h++];
      const r = Math.floor(idx / cols);
      const c = idx - r * cols;
      for (const [dc, dr] of KOMSU) {
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
        const ni = nr * cols + nc;
        if (blocked[ni] || bil[ni] >= 0) continue;
        if (dc !== 0 && dr !== 0 && (blocked[r * cols + nc] || blocked[nr * cols + c])) continue;
        bil[ni] = n;
        q.push(ni);
      }
    }
    n++;
  }
  return bil;
}

/** Verilen dünya noktasının hücresi (alan dışına taşarsa −1). */
function hucre(g: NavGrid, x: number, z: number): number {
  const c = Math.floor((x - g.minX) / g.cell);
  const r = Math.floor((z - g.minZ) / g.cell);
  if (c < 0 || c >= g.cols || r < 0 || r >= g.rows) return -1;
  return r * g.cols + c;
}

/** Hücre kapalıysa en yakın AÇIK hücreye kay (oyuncunun doğduğu nokta bir masanın içinde olabilir). */
function enYakinAcik(g: NavGrid, idx: number): number {
  if (idx < 0) return -1;
  if (!g.blocked[idx]) return idx;
  let best = -1;
  let bestD = Infinity;
  const [px, pz] = merkez(g, idx);
  for (let i = 0; i < g.blocked.length; i++) {
    if (g.blocked[i]) continue;
    const [x, z] = merkez(g, i);
    const d = (x - px) ** 2 + (z - pz) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// ETKİLEŞİM NOKTALARI — oyuncunun BU açıklıkta gerçekten varması gereken yerler
// ---------------------------------------------------------------------------

interface Nokta {
  ad: string;
  tur: 'pad' | 'yükseltme' | 'servis' | 'para';
  x: number;
  z: number;
  /** Oyuncunun bu noktayı tetiklediği yarıçap (tick.ts'teki eşiğin BİREBİR aynısı). */
  r: number;
}

/**
 * PAD HANGİ AÇIKLIKTA SAHNEDE? İlk koşu bunu sormadan ölçtü ve SAHTE bir bulgu üretti:
 * masa pad'i AÇACAĞI MASANIN TAM YERİNDE durur (`padPos.table2 = ALL_TABLES[1].table`), yani
 * masa kurulduğu anda pad biter. Pad'i masa varken sormak "pad'in üstünde masa var, oyuncu
 * ulaşamıyor" der — doğru cümle ama ölçülen şey yok. Pad yalnız HENÜZ KURULMAMIŞ hedefi için
 * sorulur. (Alan pad'leri de aynı: `zone2` alan 2 açılınca biter.)
 */
function padAktif(id: string, p: readonly number[], tables: number, areasOpen: number): boolean {
  const masaIdx = LAYOUT.tables.findIndex((t) => t.table[0] === p[0] && t.table[2] === p[2]);
  if (masaIdx >= 0) return tables <= masaIdx; // masa henüz kurulmadıysa pad orada
  if (id === 'zone2') return areasOpen < 2;
  if (id === 'zone3') return areasOpen < 3;
  return true; // personel/oda pad'leri: satın alınana kadar durur, yeri masayla çakışmaz
}

/** Bu açıklıkta hangi pad'ler sahnede? (`padPos` tüm zinciri taşır; ölçüm yalnız AÇIK alandaki
 *  ve HENÜZ HARCANMAMIŞ olanı sorar — kilitli alandaki pad zaten çizilmez.) */
function noktalar(tables: number, areasOpen: number): Nokta[] {
  const ns: Nokta[] = [];
  for (const [id, p] of Object.entries(LAYOUT.padPos)) {
    if (!acikAlanda(p[0], p[2], areasOpen)) continue;
    if (!padAktif(id, p, tables, areasOpen)) continue;
    ns.push({ ad: `pad:${id}`, tur: 'pad', x: p[0], z: p[2], r: PAD_RADIUS });
  }
  for (let i = 0; i < tables; i++) {
    const u = LAYOUT.tables[i].upgradeSpot;
    ns.push({ ad: `masa${i + 1}:yükseltme`, tur: 'yükseltme', x: u[0], z: u[2], r: TABLE_UP_RADIUS });
    // PARA: müşteri masanın yanına düşürür → kutu (tx ± 0,5 · tz + 0,6 ± 0,5). En KÖTÜ köşe ölçülür.
    const t = LAYOUT.tables[i].table;
    for (const [ox, oz] of [[-0.5, 0.1], [0.5, 0.1], [-0.5, 1.1], [0.5, 1.1]] as const) {
      ns.push({
        ad: `masa${i + 1}:para(${ox > 0 ? '+' : '−'}x,${oz > 0.5 ? '+' : '−'}z)`,
        tur: 'para',
        x: t[0] + ox,
        z: t[2] + oz,
        r: C.money.pickupRadius,
      });
    }
  }
  if (openServices(areasOpen).length > 0) {
    const sp = servicePlace(areasOpen);
    ns.push({ ad: 'servis:tepsi-al', tur: 'servis', x: sp.station[0], z: sp.station[2], r: C.serving.pickupRadius });
    ns.push({ ad: 'servis:yükseltme', tur: 'yükseltme', x: sp.upgradeSpot[0], z: sp.upgradeSpot[2], r: PAD_RADIUS });
  }
  // Lavabo: yükseltme noktası pad ile AYNI yerdir (yukarıdaki pad döngüsü kapsar); burada yalnız
  // odanın önündeki para istifi ölçülür. Oda arka bantta → alan kelepçesi kendiliğinden eler.
  if (acikAlanda(LAVABO.coinSpot[0], LAVABO.coinSpot[2], areasOpen)) {
    ns.push({ ad: 'lavabo:para', tur: 'para', x: LAVABO.coinSpot[0], z: LAVABO.coinSpot[2], r: C.money.pickupRadius });
  }
  return ns;
}

// ---------------------------------------------------------------------------
// ÖLÇÜM
// ---------------------------------------------------------------------------

interface Sonuc {
  areasOpen: number;
  tables: number;
  personelAcik: number;
  oyuncuAcik: number;
  ayrisan: number;
  bilesen: number;
  cepHucre: number;
  erisilmeyen: { ad: string; pay: number }[];
  enDarPay: { ad: string; pay: number } | null;
  /** k5 — bugun kurulan rota oyuncunun dunyasinda izlenebiliyor mu? */
  rotaToplam: number;
  rotaKirli: number;
  rotaHucre: number;
  rotaKirliHucre: number;
  rotaUzama: number[];
}

function olc(tables: number, areasOpen: number): Sonuc {
  const pg = personelIzgarasi(tables, areasOpen);
  const og = oyuncuIzgarasi(tables, areasOpen);
  let personelAcik = 0;
  let oyuncuAcik = 0;
  let ayrisan = 0;
  for (let i = 0; i < pg.blocked.length; i++) {
    if (!pg.blocked[i]) personelAcik++;
    if (!og.blocked[i]) oyuncuAcik++;
    if (!pg.blocked[i] && og.blocked[i]) ayrisan++;
  }

  const bil = bilesenler(og);
  const dogus = enYakinAcik(og, hucre(og, LAYOUT.player[0], LAYOUT.player[2]));
  const dogusBil = dogus >= 0 ? bil[dogus] : -1;
  let bilesen = 0;
  const boyut = new Map<number, number>();
  for (let i = 0; i < bil.length; i++) {
    if (bil[i] < 0) continue;
    boyut.set(bil[i], (boyut.get(bil[i]) ?? 0) + 1);
  }
  bilesen = boyut.size;
  let cepHucre = 0;
  for (const [b, n] of boyut) if (b !== dogusBil) cepHucre += n;

  // k2 + k4: her nokta için DOĞUŞ BİLEŞENİNE bağlı en yakın açık hücre.
  const erisilmeyen: { ad: string; pay: number }[] = [];
  let enDar: { ad: string; pay: number } | null = null;
  for (const n of noktalar(tables, areasOpen)) {
    let enYakin = Infinity;
    for (let i = 0; i < bil.length; i++) {
      if (bil[i] !== dogusBil) continue;
      const [x, z] = merkez(og, i);
      const d = Math.hypot(x - n.x, z - n.z);
      if (d < enYakin) enYakin = d;
    }
    const pay = n.r - enYakin;
    if (pay < 0) erisilmeyen.push({ ad: n.ad, pay });
    else if (!enDar || pay < enDar.pay) enDar = { ad: n.ad, pay };
  }
  // k5 - ROTA IZLENEBILIRLIGI. Bugun oyuncuya rota gereken her yerde (sim botu, ileride yol
  // gosterme / oto-yurume) yol PERSONELIN izgarasinda kuruluyor. Ayni rotayi oyuncunun dunyasinda
  // siniyoruz: kac ara nokta oyuncuya KAPALI hucreye dusuyor, ve oyuncunun kendi dunyasinda ayni
  // hedefe yol var mi / ne kadar uzun.
  const dogusPos: readonly [number, number, number] = [LAYOUT.player[0], LAYOUT.player[1], LAYOUT.player[2]];
  let rotaToplam = 0;
  let rotaKirli = 0;
  let rotaHucre = 0;
  let rotaKirliHucre = 0;
  const rotaUzama: number[] = [];
  for (const n of noktalar(tables, areasOpen)) {
    const pYol = findNavPath(pg, dogusPos, n.x, n.z, n.r); // personelin izgarasi = bugunku rota
    if (!pYol || !pYol.length) continue;
    rotaToplam++;
    let kirli = 0;
    for (const [wx, wz] of pYol) {
      const i = hucre(og, wx, wz);
      rotaHucre++;
      if (i < 0 || og.blocked[i]) kirli++;
    }
    rotaKirliHucre += kirli;
    if (kirli > 0) rotaKirli++;
    const oYol = findNavPath(og, dogusPos, n.x, n.z, n.r); // oyuncunun kendi dunyasindaki yol
    if (oYol && oYol.length) rotaUzama.push(oYol.length / pYol.length);
  }

  return {
    areasOpen, tables, personelAcik, oyuncuAcik, ayrisan, bilesen, cepHucre, erisilmeyen,
    enDarPay: enDar, rotaToplam, rotaKirli, rotaHucre, rotaKirliHucre, rotaUzama,
  };
}

// ---------------------------------------------------------------------------
// KOŞU
// ---------------------------------------------------------------------------

/** Zincirin GERÇEK açıklıkları: yeni alan açılmadan önce önceki alanların masaları dolar. */
function acikliklar(): { tables: number; areasOpen: number }[] {
  const hepsi: { tables: number; areasOpen: number }[] = [];
  for (let a = 1; a <= MAX_AREAS; a++) {
    const bas = areaTableStart(a - 1);
    for (let k = 1; k <= areaTableSlots(a - 1); k++) hepsi.push({ tables: bas + k, areasOpen: a });
  }
  return hepsi;
}

kipBandi();
const KOSU = KISA
  ? [
      { tables: 1, areasOpen: 1 },
      { tables: 4, areasOpen: 1 },
      { tables: 8, areasOpen: 2 },
      { tables: 20, areasOpen: 3 },
    ]
  : acikliklar();

console.log('# ÖLÇÜM — NAV IZGARASI ↔ OYUNCU ÇARPIŞMASI (D5)');
console.log(`# hücre ${NAV_CELL} · actorRadius ${LAYOUT.actorRadius} · playerRadius ${LAYOUT.playerRadius}`);
console.log(`# açıklık sayısı: ${KOSU.length}\n`);

const sonuclar = KOSU.map((k) => olc(k.tables, k.areasOpen));

console.log('## k1 AYRIŞMA + k3 TUZAK CEPLER');
console.log('alan masa | personel açık | oyuncu açık | AYRIŞAN (personele açık, oyuncuya kapalı) | bileşen | cep hücre');
for (const s of sonuclar) {
  console.log(
    `${String(s.areasOpen).padStart(4)} ${String(s.tables).padStart(4)} | ` +
      `${String(s.personelAcik).padStart(13)} | ${String(s.oyuncuAcik).padStart(11)} | ` +
      `${String(s.ayrisan).padStart(6)} ${pct(s.ayrisan, s.personelAcik).padStart(7)} | ` +
      `${String(s.bilesen).padStart(7)} | ${String(s.cepHucre).padStart(10)}`,
  );
}

console.log('\n## k2 ULAŞILAMAYAN ETKİLEŞİM NOKTALARI (oyuncunun doğuş bileşeninden)');
let toplamErisilmeyen = 0;
for (const s of sonuclar) {
  if (!s.erisilmeyen.length) continue;
  toplamErisilmeyen += s.erisilmeyen.length;
  console.log(`alan ${s.areasOpen} · masa ${s.tables} → ${s.erisilmeyen.length} nokta:`);
  for (const e of s.erisilmeyen) console.log(`    ${e.ad.padEnd(28)} açık ${(-e.pay).toFixed(2)} br`);
}
if (!toplamErisilmeyen) console.log('(yok — her etkileşim noktası erişilebilir)');

console.log('\n## k4 EN DAR PAY (her açıklığın en kıl-payı geçen noktası)');
console.log('alan masa | nokta | pay (br)');
for (const s of sonuclar) {
  const p = s.enDarPay;
  console.log(
    `${String(s.areasOpen).padStart(4)} ${String(s.tables).padStart(4)} | ${(p?.ad ?? '—').padEnd(28)} | ${p ? p.pay.toFixed(2) : '—'}`,
  );
}

console.log('\n## k5 ROTA IZLENEBILIRLIGI - bugunku rota (personel izgarasi) oyuncunun dunyasinda');
console.log('alan masa | rota | KIRLI rota (>=1 kapali ara nokta) | kirli ara nokta | oyuncu yolu / personel yolu');
for (const s of sonuclar) {
  const uz = s.rotaUzama.length ? s.rotaUzama.reduce((a, b) => a + b, 0) / s.rotaUzama.length : NaN;
  console.log(
    `${String(s.areasOpen).padStart(4)} ${String(s.tables).padStart(4)} | ${String(s.rotaToplam).padStart(4)} | ` +
      `${String(s.rotaKirli).padStart(4)} ${pct(s.rotaKirli, s.rotaToplam).padStart(7)} | ` +
      `${String(s.rotaKirliHucre).padStart(5)}/${String(s.rotaHucre).padEnd(6)} ${pct(s.rotaKirliHucre, s.rotaHucre).padStart(7)} | ` +
      `${Number.isNaN(uz) ? '-' : `x${uz.toFixed(3)}`}`,
  );
}

// --- DAMGALAR: "bu satır gerçekten ölçüm mü?"
const enBuyukAyrisma = Math.max(...sonuclar.map((s) => s.ayrisan));
damga(
  'iki dünya GERÇEKTEN ayrı',
  enBuyukAyrisma > 0,
  'hiçbir açıklıkta ayrışan hücre yok — ızgaralar aynı kurulmuş olmalı (ölçüm kendini ölçüyor)',
);
damga(
  'oyuncu doğuşu açık',
  sonuclar.every((s) => s.oyuncuAcik > 0),
  'bir açıklıkta oyuncuya açık hücre yok',
);
damga(
  'rota gercekten kuruldu',
  sonuclar.every((s) => s.rotaToplam > 0),
  'bir aciklikta hic rota kurulamadi - k5 kolu bos olcuyor',
);
damga(
  'nokta listesi dolu',
  KOSU.every((k) => noktalar(k.tables, k.areasOpen).length > 0),
  'bir açıklıkta hiç etkileşim noktası üretilmedi',
);
damgaOzeti();
