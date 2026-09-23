/**
 * olcum-nav-t5.ts — T5: `findNavPath` KARENİN %31,5'İ. Maliyeti BÖLÜŞTÜR, sonra kol seç.
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-nav-t5.ts > docs/olcum-nav-t5.txt
 *        (OLCUM verilmezse KISA koşar — korpus kısalır, rapora sayı GİRMEZ.)
 *
 * ## Neden bu araç var
 * T4 karenin TOPLAMINI ölçtü ve kolların hepsini çizim tarafına yazdı; bölüşüm ölçülünce
 * `useFrame`in %49,4 olduğu ve `findNavPath`in tek başına %31,5 tuttuğu görüldü (D-138).
 * Aynı hata bir kademe aşağıda tekrar edilebilir: "`findNavPath` pahalı" demek kolun YERİNİ
 * göstermez. Bu araç `findNavPath`in İÇİNİ bölüşür — ayırma mı, gezinme mi, hedef testi mi —
 * ve kolları GERÇEK çağrılarla yarıştırır.
 *
 * ## Üç kolon, üçü birden okunmadan karar verilemez
 *   1) MALİYET   kol başına ms/çağrı ve bunun kareye çevirisi (çağrı/kare korpustan ölçülür).
 *   2) ÇIKTI     kol AYNI yolu mu döndürüyor? Birebir aynı kol varyant kapısı istemez;
 *                farklı kol (N2/N3) davranışı değiştirir ve kullanıcı kararı ister.
 *   3) TAKAS     farklı kolda sapmanın BÜYÜKLÜĞÜ (kaç çağrıda ilk waypoint değişti, yol ne kadar uzadı).
 *
 * ## Korpus neden gerçek koşudan
 * BFS'in maliyeti hedefin uzaklığına ve ızgaranın doluluğuna bağlı. Uydurma çiftler kolları
 * yanlış sıralar: uzak hedef ızgaranın tamamını gezdirir, yakın hedef hiç gezdirmez. `nav.ts`in
 * `navKorpusAc()` kancası geç-oyun koşusundaki çağrıları argümanlarıyla kaydeder.
 *
 * ## Damgalar (bu koşu gerçekten ölçüm mü?)
 *   · korpus doldu       — çağrı yoksa ölçülecek bir şey yok (dünya kurulmamış demektir).
 *   · ızgara geç-oyun    — §F'nin ölçtüğü 114×90 ızgara; küçük ızgara kolları yanlış sıralar.
 *   · sayaçlı kopya (N0) — §B'nin sayaçlı N0'ı ÜRETİM `findNavPath` ile birebir aynı yolu vermeli,
 *                          yoksa bütün bölüşüm bir kopyanın sayılarıdır.
 *   · kol farkı          — birebir-aynı iddia eden kol korpusta bir kez bile sapmamalı.
 */
import {
  KIP, KISA, kipBandi, damga, damgaOzeti, yuzdelik, ort, seedRandom,
} from './olcum-lib';
import { useGame, LAYOUT, parkSpot, stationSoftMaxLevel, totalCupPool } from '../src/game/store';
import { D } from '../src/game/decimal';
import { economyConfig } from '../src/config/economy.config';
import {
  findNavPath, navKorpusAc, navKorpusOku, navKorpusKapat,
  type NavGrid, type NavCagri,
} from '../src/game/nav';
// TABAN, uretim kodu DEGIL donmus oracle'dir: T5'in kollari uygulandiktan sonra `findNavPath`
// zaten N1c'dir; taban olarak onu kullanmak kolu kendisiyle karsilastirmak olurdu.
import { navPathOracle } from './nav-oracle';

const f1 = (x: number) => x.toFixed(1);
const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);
const yuz = (a: number, b: number) => (b === 0 ? '—' : `%${((100 * a) / b).toFixed(1)}`);

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

// ===========================================================================
// KORPUS — geç-oyun dünyası kurulur, çağrılar kaydedilir
// ===========================================================================

/**
 * §F'nin ölçtüğü hâl: tüm padler açık, masalar tavanda, OCAK TAVANDA, görev hattı bitmiş, oyuncu parkta.
 * 2026-09-23'e kadar `stationLevels` yazılmıyordu ("20 masaya seviye-0 ocak", T6 rapor §1); o
 * tarihten önceki `docs/olcum-nav-t5.txt` o dünyadan. Kurulum artık T6 aracınınkiyle birebir.
 */
function gecOyunKur(isinmaSn: number, dt: number): void {
  seedRandom(20260919);
  useGame.getState().hardReset();
  useGame.setState({
    padsDone: economyConfig.pads.map((p) => p.id),
    wallet: D(1e12),
    diamonds: D(1e6),
    questIndex: economyConfig.quests.length,
  } as never);
  const s0 = useGame.getState();
  const ocak = s0.stationLevels.map(() => stationSoftMaxLevel());
  useGame.setState({
    tableLevels: s0.tableLevels.map(() => 4),
    stationLevels: ocak,
    cleanCups: totalCupPool(s0.areasOpen, ocak),
  } as never);
  const s1 = useGame.getState();
  useGame.setState({ player: parkSpot(s1.areasOpen, s1.tables) } as never);
  // Mekân dolsun: NPC akışı kararlı hâle gelene kadar ileri sar. Isınma KAYDEDİLMEZ.
  const tick = useGame.getState().tick;
  for (let i = 0; i < Math.round(isinmaSn / dt); i++) tick(dt);
}

interface Korpus {
  cagrilar: NavCagri[];
  /** Her çağrının hangi karede yapıldığı (aynı indeks). */
  kareNo: number[];
  kare: number;
  npc: number;
  grid: NavGrid;
}

function korpusTopla(sureSn: number, dt: number): Korpus {
  const tick = useGame.getState().tick;
  const kare = Math.round(sureSn / dt);
  navKorpusAc();
  const sinir: number[] = [];
  for (let i = 0; i < kare; i++) {
    tick(dt);
    sinir.push(navKorpusOku().length);
  }
  const cagrilar = navKorpusOku().slice();
  navKorpusKapat();
  const kareNo = new Array<number>(cagrilar.length);
  let j = 0;
  for (let f = 0; f < sinir.length; f++) for (; j < sinir[f]; j++) kareNo[j] = f;
  return { cagrilar, kareNo, kare, npc: useGame.getState().npcs.length, grid: cagrilar[0]?.grid as NavGrid };
}

/**
 * AKTÖR İZLERİ — `nav.ts`in `start` referans kimliği burada İŞE YARAMAZ: `tick.ts:229`
 * her karede `pos: [...n.pos]` ile diziyi klonluyor, yani her çağrı yeni bir nesne.
 * (Araç bunu kısa koşuda yakaladı: "yol soran aktör 9040" = çağrı sayısının kendisi.)
 *
 * İzler çağrılardan YENİDEN KURULUR: ardışık iki karede AYNI hedefe (tx,tz,reach) giden ve
 * başlangıcı bir kare adımından yakın olan çağrılar aynı aktördür. Hedef değişince iz biter —
 * yol önbelleği zaten orada geçersiz olacağı için ölçüm etkilenmez.
 */
function izleriKur(k: Korpus, maxAdim: number): number[] {
  const iz = new Array<number>(k.cagrilar.length).fill(-1);
  let sayac = 0;
  let oncekiKare: number[] = [];
  let f = 0;
  let i = 0;
  while (i < k.cagrilar.length) {
    const bu: number[] = [];
    while (i < k.cagrilar.length && k.kareNo[i] === f) bu.push(i++);
    const kullanildi = new Set<number>();
    for (const b of bu) {
      const c = k.cagrilar[b];
      let enIyi = -1;
      let enIyiD = maxAdim;
      for (const o of oncekiKare) {
        if (kullanildi.has(o)) continue;
        const p = k.cagrilar[o];
        if (p.tx !== c.tx || p.tz !== c.tz || p.reach !== c.reach) continue;
        const d = Math.hypot(p.start[0] - c.start[0], p.start[2] - c.start[2]);
        if (d < enIyiD) { enIyiD = d; enIyi = o; }
      }
      if (enIyi >= 0) { iz[b] = iz[enIyi]; kullanildi.add(enIyi); } else { iz[b] = sayac++; }
    }
    oncekiKare = bu;
    f++;
  }
  return iz;
}

// ===========================================================================
// KOLLAR
// ===========================================================================

type Kol = (g: NavGrid, s: readonly [number, number, number], tx: number, tz: number, r: number) => [number, number][] | null;

const hucreMerkez = (g: NavGrid, c: number, r: number): [number, number] => [
  g.minX + (c + 0.5) * g.cell,
  g.minZ + (r + 0.5) * g.cell,
];

function baslangicHucresi(g: NavGrid, x: number, z: number): [number, number] {
  let c = Math.floor((x - g.minX) / g.cell);
  let r = Math.floor((z - g.minZ) / g.cell);
  c = Math.max(0, Math.min(g.cols - 1, c));
  r = Math.max(0, Math.min(g.rows - 1, r));
  return [c, r];
}

/** N0'ın `nearestFreeIdx`i — bloklu başlangıcı en yakın açığa snap eder (her çağrıda Uint8Array). */
function enYakinAcikN0(g: NavGrid, sc: number, sr: number): number {
  const { cols, rows, blocked } = g;
  const start = sr * cols + sc;
  if (!blocked[start]) return start;
  const seen = new Uint8Array(cols * rows);
  seen[start] = 1;
  const q: number[] = [start];
  let h = 0;
  while (h < q.length) {
    const idx = q[h++];
    if (!blocked[idx]) return idx;
    const r = Math.floor(idx / cols);
    const c = idx - r * cols;
    for (const [dc, dr] of NEIGHBORS) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const ni = nr * cols + nc;
      if (seen[ni]) continue;
      seen[ni] = 1;
      q.push(ni);
    }
  }
  return start;
}

/** Sayaçlar — §B bölüşümü bunlardan okunur (kol seçimini DEĞİL, maliyetin yerini gösterir). */
interface Sayac {
  pop: number;       // kuyruktan çekilen hücre
  push: number;      // kuyruğa giren hücre
  hedefTesti: number; // isGoal çağrısı
  komsu: number;     // bakılan komşu
  bayt: number;      // ayrılan tampon (bayt)
}
const sayac: Sayac = { pop: 0, push: 0, hedefTesti: 0, komsu: 0, bayt: 0 };
const sayacSifirla = (): void => { sayac.pop = 0; sayac.push = 0; sayac.hedefTesti = 0; sayac.komsu = 0; sayac.bayt = 0; };

/**
 * N0 SAYAÇLI — bugünkü `navPathAra`nın birebir kopyası + sayaçlar.
 * Kopya olduğu için damgayla korunur: üretim `findNavPath` ile aynı yolu vermezse ölçüm geçersiz.
 */
const n0Sayacli: Kol = (g, start, tx, tz, reach) => {
  const { cols, rows, blocked } = g;
  const [sc, sr] = baslangicHucresi(g, start[0], start[2]);
  const startIdx = enYakinAcikN0(g, sc, sr);
  const reach2 = reach * reach;
  const prev = new Int32Array(cols * rows).fill(-2);
  sayac.bayt += cols * rows * 4;
  prev[startIdx] = -1;
  const queue: number[] = [startIdx];
  sayac.push++;
  let head = 0;
  let goalIdx = -1;
  while (head < queue.length) {
    const idx = queue[head++];
    sayac.pop++;
    const cr = Math.floor(idx / cols);
    const cc = idx - cr * cols;
    if (idx !== startIdx) {
      sayac.hedefTesti++;
      const [cx, cz] = hucreMerkez(g, cc, cr);
      const dx = cx - tx;
      const dz = cz - tz;
      if (dx * dx + dz * dz <= reach2) { goalIdx = idx; break; }
    }
    for (const [dc, dr] of NEIGHBORS) {
      sayac.komsu++;
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nidx = nr * cols + nc;
      if (prev[nidx] !== -2 || blocked[nidx]) continue;
      if (dc !== 0 && dr !== 0 && (blocked[cr * cols + nc] || blocked[nr * cols + cc])) continue;
      prev[nidx] = idx;
      queue.push(nidx);
      sayac.push++;
    }
  }
  if (goalIdx < 0) return null;
  const path: [number, number][] = [];
  let cur = goalIdx;
  while (cur !== -1 && cur !== startIdx) {
    const cr = Math.floor(cur / cols);
    const cc = cur - cr * cols;
    path.push(hucreMerkez(g, cc, cr));
    cur = prev[cur];
  }
  path.reverse();
  return path;
};

// --- Kalıcı tamponlar (N1a ve üstü) --------------------------------------------------
let tPrev = new Int32Array(0);
let tDamga = new Int32Array(0);
let tKuyruk = new Int32Array(0);
let tSnap = new Int32Array(0);
let tHedef = new Int32Array(0);
let kusak = 0;
let snapKusak = 0;
let hedefKusak = 0;

function tamponHazirla(n: number): void {
  if (tPrev.length >= n) return;
  tPrev = new Int32Array(n);
  tDamga = new Int32Array(n);
  tKuyruk = new Int32Array(n);
  tSnap = new Int32Array(n);
  tHedef = new Int32Array(n);
  kusak = 0;
  snapKusak = 0;
  hedefKusak = 0;
}

/** `nearestFreeIdx`in kuşak damgalı hâli — `new Uint8Array` yok, çıktı birebir aynı. */
function enYakinAcikKalici(g: NavGrid, sc: number, sr: number): number {
  const { cols, rows, blocked } = g;
  const start = sr * cols + sc;
  if (!blocked[start]) return start;
  snapKusak++;
  tSnap[start] = snapKusak;
  tKuyruk[0] = start;
  let kuyrukSon = 1;
  let h = 0;
  while (h < kuyrukSon) {
    const idx = tKuyruk[h++];
    if (!blocked[idx]) return idx;
    const r = Math.floor(idx / cols);
    const c = idx - r * cols;
    for (const [dc, dr] of NEIGHBORS) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const ni = nr * cols + nc;
      if (tSnap[ni] === snapKusak) continue;
      tSnap[ni] = snapKusak;
      tKuyruk[kuyrukSon++] = ni;
    }
  }
  return start;
}

/**
 * N1a — KALICI TAMPON + KUŞAK DAMGASI. Kaldırdığı: çağrı başına `new Int32Array(10260).fill(-2)`
 * (41 KB) + `queue` dizisi + snap'ın `Uint8Array`i. Gezinme sırası ve çıktı DEĞİŞMEZ.
 * (Snap kuyruğu ile ana kuyruk aynı tamponu paylaşır: snap ana BFS'ten ÖNCE biter.)
 */
const n1a: Kol = (g, start, tx, tz, reach) => {
  const { cols, rows, blocked } = g;
  tamponHazirla(cols * rows);
  const [sc, sr] = baslangicHucresi(g, start[0], start[2]);
  const startIdx = enYakinAcikKalici(g, sc, sr);
  const reach2 = reach * reach;
  kusak++;
  tDamga[startIdx] = kusak;
  tPrev[startIdx] = -1;
  tKuyruk[0] = startIdx;
  let kuyrukSon = 1;
  let head = 0;
  let goalIdx = -1;
  while (head < kuyrukSon) {
    const idx = tKuyruk[head++];
    const cr = Math.floor(idx / cols);
    const cc = idx - cr * cols;
    if (idx !== startIdx) {
      const [cx, cz] = hucreMerkez(g, cc, cr);
      const dx = cx - tx;
      const dz = cz - tz;
      if (dx * dx + dz * dz <= reach2) { goalIdx = idx; break; }
    }
    for (const [dc, dr] of NEIGHBORS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nidx = nr * cols + nc;
      if (tDamga[nidx] === kusak || blocked[nidx]) continue;
      if (dc !== 0 && dr !== 0 && (blocked[cr * cols + nc] || blocked[nr * cols + cc])) continue;
      tDamga[nidx] = kusak;
      tPrev[nidx] = idx;
      tKuyruk[kuyrukSon++] = nidx;
    }
  }
  if (goalIdx < 0) return null;
  const path: [number, number][] = [];
  let cur = goalIdx;
  while (cur !== -1 && cur !== startIdx) {
    const cr = Math.floor(cur / cols);
    const cc = cur - cr * cols;
    path.push(hucreMerkez(g, cc, cr));
    cur = tPrev[cur];
  }
  path.reverse();
  return path;
};

/**
 * N1b — N1a + HEDEF TESTİ PUSH'TA. Kuyruk FIFO olduğu için kuyruğa İLK giren hedef hücresi,
 * kuyruktan da İLK çıkan hedef hücresidir → aynı hücre bulunur, ama son katmanın kalanı
 * genişletilmez. Çıktı birebir aynı; `start` hiç push edilmediği için `idx !== startIdx`
 * ayrımı da kendiliğinden korunur.
 */
const n1b: Kol = (g, start, tx, tz, reach) => {
  const { cols, rows, blocked } = g;
  tamponHazirla(cols * rows);
  const [sc, sr] = baslangicHucresi(g, start[0], start[2]);
  const startIdx = enYakinAcikKalici(g, sc, sr);
  const reach2 = reach * reach;
  kusak++;
  tDamga[startIdx] = kusak;
  tPrev[startIdx] = -1;
  tKuyruk[0] = startIdx;
  let kuyrukSon = 1;
  let head = 0;
  let goalIdx = -1;
  dis: while (head < kuyrukSon) {
    const idx = tKuyruk[head++];
    const cr = Math.floor(idx / cols);
    const cc = idx - cr * cols;
    for (const [dc, dr] of NEIGHBORS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nidx = nr * cols + nc;
      if (tDamga[nidx] === kusak || blocked[nidx]) continue;
      if (dc !== 0 && dr !== 0 && (blocked[cr * cols + nc] || blocked[nr * cols + cc])) continue;
      tDamga[nidx] = kusak;
      tPrev[nidx] = idx;
      tKuyruk[kuyrukSon++] = nidx;
      const [cx, cz] = hucreMerkez(g, nc, nr);
      const dx = cx - tx;
      const dz = cz - tz;
      if (dx * dx + dz * dz <= reach2) { goalIdx = nidx; break dis; }
    }
  }
  if (goalIdx < 0) return null;
  const path: [number, number][] = [];
  let cur = goalIdx;
  while (cur !== -1 && cur !== startIdx) {
    const cr = Math.floor(cur / cols);
    const cc = cur - cr * cols;
    path.push(hucreMerkez(g, cc, cr));
    cur = tPrev[cur];
  }
  path.reverse();
  return path;
};

/**
 * N1c — N1b + HEDEF HÜCRE MASKESİ. `reach` küçük (0,40–1,19), hücre 0,30 → hedefe `reach`
 * mesafede yalnız birkaç hücre var. Bunlar önden bulunur; sıcak döngüdeki `hucreMerkez` +
 * mesafe hesabı yerine kimlik karşılaştırması kalır. Çıktı birebir aynı.
 */
const n1c: Kol = (g, start, tx, tz, reach) => {
  const { cols, rows, blocked } = g;
  tamponHazirla(cols * rows);
  // Hedef hücre kümesi: merkezi (tx,tz)'ye `reach` mesafedeki hücreler — yalnız çevresi taranır.
  const rad = Math.ceil(reach / g.cell) + 1;
  const [tc, tr] = baslangicHucresi(g, tx, tz);
  const reach2 = reach * reach;
  const hedefler: number[] = [];
  for (let r = Math.max(0, tr - rad); r <= Math.min(rows - 1, tr + rad); r++) {
    const cz = g.minZ + (r + 0.5) * g.cell;
    const dz = cz - tz;
    for (let c = Math.max(0, tc - rad); c <= Math.min(cols - 1, tc + rad); c++) {
      const cx = g.minX + (c + 0.5) * g.cell;
      const dx = cx - tx;
      if (dx * dx + dz * dz <= reach2) hedefler.push(r * cols + c);
    }
  }
  if (hedefler.length === 0) return null;
  const [sc, sr] = baslangicHucresi(g, start[0], start[2]);
  const startIdx = enYakinAcikKalici(g, sc, sr);
  kusak++;
  tDamga[startIdx] = kusak;
  tPrev[startIdx] = -1;
  tKuyruk[0] = startIdx;
  let kuyrukSon = 1;
  let head = 0;
  let goalIdx = -1;
  // Maske DAMGALI tamponda: sıcak döngüde tek dizi okuması kalır (kısa koşuda lineer tarama
  // denendi ve N1b'den YAVAŞ çıktı — hedef kümesi küçük olsa bile push başına tarama pahalı).
  hedefKusak++;
  for (let i = 0; i < hedefler.length; i++) tHedef[hedefler[i]] = hedefKusak;
  dis: while (head < kuyrukSon) {
    const idx = tKuyruk[head++];
    const cr = Math.floor(idx / cols);
    const cc = idx - cr * cols;
    for (const [dc, dr] of NEIGHBORS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nidx = nr * cols + nc;
      if (tDamga[nidx] === kusak || blocked[nidx]) continue;
      if (dc !== 0 && dr !== 0 && (blocked[cr * cols + nc] || blocked[nr * cols + cc])) continue;
      tDamga[nidx] = kusak;
      tPrev[nidx] = idx;
      tKuyruk[kuyrukSon++] = nidx;
      if (tHedef[nidx] === hedefKusak) { goalIdx = nidx; break dis; }
    }
  }
  if (goalIdx < 0) return null;
  const path: [number, number][] = [];
  let cur = goalIdx;
  while (cur !== -1 && cur !== startIdx) {
    const cr = Math.floor(cur / cols);
    const cc = cur - cr * cols;
    path.push(hucreMerkez(g, cc, cr));
    cur = tPrev[cur];
  }
  path.reverse();
  return path;
};

/**
 * N3 — A* (oktil sezgisel, ikili yığın). Ziyaret edilen hücreyi hedefe DOĞRU daraltır.
 * DAVRANIŞ DEĞİŞİR: eşit uzunluktaki yollar arasında farklı seçim yapar → `navStep`in
 * kullandığı ilk waypoint değişebilir. §D sapmayı sayar.
 */
const n3: Kol = (g, start, tx, tz, reach) => {
  const { cols, rows, blocked } = g;
  tamponHazirla(cols * rows);
  const [sc, sr] = baslangicHucresi(g, start[0], start[2]);
  const startIdx = enYakinAcikKalici(g, sc, sr);
  const reach2 = reach * reach;
  const D_DUZ = 1;
  const D_CAP = Math.SQRT2;
  const sezgi = (c: number, r: number): number => {
    const [cx, cz] = hucreMerkez(g, c, r);
    const dx = Math.abs(cx - tx) / g.cell;
    const dz = Math.abs(cz - tz) / g.cell;
    return D_DUZ * (dx + dz) + (D_CAP - 2 * D_DUZ) * Math.min(dx, dz);
  };
  kusak++;
  const gSkor = new Map<number, number>();
  const yigin: [number, number][] = []; // [f, idx]
  const it = (): void => {
    let i = yigin.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (yigin[p][0] <= yigin[i][0]) break;
      [yigin[p], yigin[i]] = [yigin[i], yigin[p]];
      i = p;
    }
  };
  const cek = (): [number, number] => {
    const ust = yigin[0];
    const son = yigin.pop()!;
    if (yigin.length) {
      yigin[0] = son;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < yigin.length && yigin[l][0] < yigin[m][0]) m = l;
        if (r < yigin.length && yigin[r][0] < yigin[m][0]) m = r;
        if (m === i) break;
        [yigin[m], yigin[i]] = [yigin[i], yigin[m]];
        i = m;
      }
    }
    return ust;
  };
  gSkor.set(startIdx, 0);
  tPrev[startIdx] = -1;
  yigin.push([sezgi(startIdx % cols, Math.floor(startIdx / cols)), startIdx]);
  it();
  let goalIdx = -1;
  while (yigin.length) {
    const [, idx] = cek();
    if (tDamga[idx] === kusak) continue;
    tDamga[idx] = kusak;
    const cr = Math.floor(idx / cols);
    const cc = idx - cr * cols;
    if (idx !== startIdx) {
      const [cx, cz] = hucreMerkez(g, cc, cr);
      const dx = cx - tx;
      const dz = cz - tz;
      if (dx * dx + dz * dz <= reach2) { goalIdx = idx; break; }
    }
    const gc = gSkor.get(idx)!;
    for (const [dc, dr] of NEIGHBORS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nidx = nr * cols + nc;
      if (tDamga[nidx] === kusak || blocked[nidx]) continue;
      if (dc !== 0 && dr !== 0 && (blocked[cr * cols + nc] || blocked[nr * cols + cc])) continue;
      const yeni = gc + (dc !== 0 && dr !== 0 ? D_CAP : D_DUZ);
      const eski = gSkor.get(nidx);
      if (eski !== undefined && eski <= yeni) continue;
      gSkor.set(nidx, yeni);
      tPrev[nidx] = idx;
      yigin.push([yeni + sezgi(nc, nr), nidx]);
      it();
    }
  }
  if (goalIdx < 0) return null;
  const path: [number, number][] = [];
  let cur = goalIdx;
  while (cur !== -1 && cur !== startIdx) {
    const cr = Math.floor(cur / cols);
    const cc = cur - cr * cols;
    path.push(hucreMerkez(g, cc, cr));
    cur = tPrev[cur];
  }
  path.reverse();
  return path;
};

// ===========================================================================
// KARŞILAŞTIRMA YARDIMCILARI
// ===========================================================================

const yolEsit = (a: [number, number][] | null, b: [number, number][] | null): boolean => {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  return true;
};

/**
 * DUVARDAN GEÇER Mİ? `navStep` waypoint'e `moveToward` ile **düz çizgide** gider. Waypoint
 * komşu hücredeyken bu güvenlidir. Bayat bir önbellek waypoint'i uzakta bırakırsa düz çizgi
 * masanın içinden geçer — sapmanın ZARARLI olup olmadığını ayıran ölçü budur, uzaklığın kendisi
 * değil. Segment hücre/4 adımla örneklenir.
 */
function duvardanGecer(g: NavGrid, a: readonly [number, number, number], b: readonly [number, number]): boolean {
  const dx = b[0] - a[0];
  const dz = b[1] - a[2];
  const uzak = Math.hypot(dx, dz);
  const adim = g.cell / 4;
  const n = Math.max(1, Math.ceil(uzak / adim));
  for (let i = 1; i <= n; i++) {
    const x = a[0] + (dx * i) / n;
    const z = a[2] + (dz * i) / n;
    const c = Math.floor((x - g.minX) / g.cell);
    const r = Math.floor((z - g.minZ) / g.cell);
    if (c < 0 || c >= g.cols || r < 0 || r >= g.rows) continue;
    if (g.blocked[r * g.cols + c]) return true;
  }
  return false;
}

/** `navStep`in gerçekten kullandığı tek şey: ilk waypoint. Sapma ORADA anlam taşır. */
const ilkEsit = (a: [number, number][] | null, b: [number, number][] | null): boolean => {
  const ay = a && a.length > 0 ? a[0] : null;
  const by = b && b.length > 0 ? b[0] : null;
  if (!ay || !by) return ay === by;
  return ay[0] === by[0] && ay[1] === by[1];
};

/** Ortanca koşu — tek koşu GC gürültüsüne açık; medyan gürültüyü yutar. */
function sure(kol: Kol, ornek: NavCagri[], tekrar: number): number {
  const olcumler: number[] = [];
  for (let t = 0; t < tekrar; t++) {
    const t0 = performance.now();
    for (const c of ornek) kol(c.grid, c.start, c.tx, c.tz, c.reach);
    olcumler.push(performance.now() - t0);
  }
  olcumler.sort((a, b) => a - b);
  return olcumler[olcumler.length >> 1] / ornek.length;
}

/** Korpusu seyrelt — zamanlama için temsilî ama koşulabilir boyutta örnek. */
function seyrelt(cagrilar: NavCagri[], hedef: number): NavCagri[] {
  if (cagrilar.length <= hedef) return cagrilar.slice();
  const adim = cagrilar.length / hedef;
  const out: NavCagri[] = [];
  for (let i = 0; i < hedef; i++) out.push(cagrilar[Math.floor(i * adim)]);
  return out;
}

// ===========================================================================
// KOŞU
// ===========================================================================

const DT = 1 / 60;
const ISINMA = KISA ? 60 : 240;
const KAYIT_SN = KISA ? 5 : 60;
const ORNEK = KISA ? 300 : 2500;
const TEKRAR = KISA ? 3 : 7;
const ESITLIK_ORNEK = KISA ? 1500 : 12000;

kipBandi();
console.log('=== T5 — findNavPath: kare payinin BOLUSUMU ve kollar ===');
console.log(`kip ${KIP} · isinma ${ISINMA} sn · kayit ${KAYIT_SN} sn · dt 1/60`);
console.log('');

gecOyunKur(ISINMA, DT);
const k = korpusTopla(KAYIT_SN, DT);

damga('korpus doldu', k.cagrilar.length > 0, `${k.cagrilar.length} cagri`);
if (k.cagrilar.length === 0) {
  damgaOzeti();
  process.exit(1);
}

const hucre = k.grid.cols * k.grid.rows;
damga('izgara gec-oyun', hucre >= (KISA ? 2000 : 9000), `${k.grid.cols}x${k.grid.rows} = ${hucre} hucre`);

/* ── §A KORPUS ─────────────────────────────────────────────────────────────── */
console.log('--- §A KORPUS: gercek gec-oyun kosusundan kaydedilen findNavPath cagrilari ---');
const cagriKare = k.cagrilar.length / k.kare;
// Bir karede aktörün alabileceği en büyük adım (en hızlı aktör × dt) — iz eşleştirme eşiği.
const IZ_ESIK = 0.25;
const izler = izleriKur(k, IZ_ESIK);
const izUzunluk = new Map<number, number>();
for (const id of izler) izUzunluk.set(id, (izUzunluk.get(id) ?? 0) + 1);
const aktorler = izUzunluk.size;
const izOrt = ort([...izUzunluk.values()]);
const mesafeler = k.cagrilar.map((c) => Math.hypot(c.start[0] - c.tx, c.start[2] - c.tz));
const reachler = [...new Set(k.cagrilar.map((c) => +c.reach.toFixed(3)))].sort((a, b) => a - b);
console.log(`  kare ${k.kare} · cagri ${k.cagrilar.length} · CAGRI/KARE ${f1(cagriKare)}`);
console.log(`  NPC ${k.npc} · yeniden kurulan IZ ${aktorler} · iz basina ort ${f1(izOrt)} cagri (ayni hedefe ardisik kare)`);
console.log(`  izgara ${k.grid.cols}x${k.grid.rows} = ${hucre} hucre (${k.grid.cell} br)`);
console.log(`  baslangic-hedef mesafesi: ort ${f2(ort(mesafeler))} br · p50 ${f2(yuzdelik(mesafeler, 0.5))} · p95 ${f2(yuzdelik(mesafeler, 0.95))} · max ${f2(Math.max(...mesafeler))}`);
console.log(`  reach degerleri: ${reachler.map((r) => f2(r)).join(' · ')}`);
console.log('');

/* ── §B TABAN BÖLÜŞÜMÜ ─────────────────────────────────────────────────────── */
const esitlikOrnek = seyrelt(k.cagrilar, ESITLIK_ORNEK);
// Esitlik REFERANSI oracle'dir (T5 oncesi davranis). Uretim kodu da bir KOL gibi olculur.
const uretimYollar = esitlikOrnek.map((c) => navPathOracle(c.grid, c.start, c.tx, c.tz, c.reach));

sayacSifirla();
const n0Yollar = esitlikOrnek.map((c) => n0Sayacli(c.grid, c.start, c.tx, c.tz, c.reach));
const n0Sayaclari: Sayac = { ...sayac };

let kopyaFark = 0;
for (let i = 0; i < uretimYollar.length; i++) if (!yolEsit(uretimYollar[i], n0Yollar[i])) kopyaFark++;
damga('sayacli kopya (N0)', kopyaFark === 0, `${kopyaFark}/${esitlikOrnek.length} cagri oracle'dan farkli`);

const nOrnek = esitlikOrnek.length;
const bosYol = uretimYollar.filter((y) => y === null).length;
const yolUzun = uretimYollar.filter((y): y is [number, number][] => y !== null).map((y) => y.length);

console.log('--- §B TABAN BOLUSUMU: bir findNavPath cagrisinin ICI (N0, bugunku kod) ---');
console.log(`  ornek ${nOrnek} cagri · yol bulunamayan ${bosYol} (${yuz(bosYol, nOrnek)})`);
console.log(`  kuyruktan cekilen hucre (pop)   ${f1(n0Sayaclari.pop / nOrnek).padStart(9)} / cagri · izgaranin ${yuz(n0Sayaclari.pop / nOrnek, hucre)}'i`);
console.log(`  kuyruga giren hucre    (push)   ${f1(n0Sayaclari.push / nOrnek).padStart(9)} / cagri · izgaranin ${yuz(n0Sayaclari.push / nOrnek, hucre)}'i`);
console.log(`  bakilan komsu                   ${f1(n0Sayaclari.komsu / nOrnek).padStart(9)} / cagri`);
console.log(`  hedef testi (hucreMerkez+mesafe)${f1(n0Sayaclari.hedefTesti / nOrnek).padStart(9)} / cagri`);
console.log(`  ayrilan tampon                  ${f1(n0Sayaclari.bayt / nOrnek / 1024).padStart(9)} KB / cagri · ${f1((n0Sayaclari.bayt / nOrnek) * cagriKare / 1024)} KB / kare`);
console.log(`  donen yol uzunlugu: ort ${f1(ort(yolUzun))} waypoint · p95 ${f1(yuzdelik(yolUzun, 0.95))} — navStep YALNIZ ILKINI kullanir`);
console.log('');

// Ayırma+sıfırlamanın TEK BAŞINA bedeli: aynı sayıda, aynı boyda tampon, BFS yok.
const tamponOrnek = ORNEK;
const tamponMs = (() => {
  const olcumler: number[] = [];
  for (let t = 0; t < TEKRAR; t++) {
    const t0 = performance.now();
    let yut = 0;
    for (let i = 0; i < tamponOrnek; i++) {
      const a = new Int32Array(hucre).fill(-2);
      yut += a[0];
    }
    olcumler.push(performance.now() - t0);
    if (yut === 12345) console.log('');
  }
  olcumler.sort((a, b) => a - b);
  return olcumler[olcumler.length >> 1] / tamponOrnek;
})();

/* ── §C KOLLAR ─────────────────────────────────────────────────────────────── */
const zamanOrnek = seyrelt(k.cagrilar, ORNEK);
// Isınma: JIT kollari optimize etsin, ilk kol cezali cikmasin.
for (const kol of [navPathOracle as Kol, findNavPath as Kol, n1a, n1b, n1c, n3]) {
  for (const c of seyrelt(zamanOrnek, Math.min(200, zamanOrnek.length))) kol(c.grid, c.start, c.tx, c.tz, c.reach);
}

interface KolSonuc {
  ad: string;
  not: string;
  ms: number;
  ayni: boolean;
  yolFark: number;
  ilkFark: number;
  uzunlukOran: number;
}

const KOLLAR: { ad: string; kol: Kol; not: string }[] = [
  { ad: 'N0 taban (T5 oncesi)', kol: navPathOracle as Kol, not: 'oracle — her cagrida 41 KB Int32Array + tam BFS' },
  { ad: 'N1a kalici tampon', kol: n1a, not: 'kusak damgasi — ayirma/sifirlama yok' },
  { ad: 'N1b + hedef PUSH ta', kol: n1b, not: 'N1a + son katman genisletilmez' },
  { ad: 'N1c + hedef maskesi', kol: n1c, not: 'N1b + hucreMerkez sicak dongude yok' },
  { ad: 'N3 A* (oktil)', kol: n3, not: 'DAVRANIS DEGISIR — yol tie-break farkli' },
  { ad: 'URETIM findNavPath', kol: findNavPath as Kol, not: 'src/game/nav.ts — T5 sonrasi N1c olmali' },
];

const sonuclar: KolSonuc[] = [];
for (const { ad, kol, not } of KOLLAR) {
  const ms = sure(kol, zamanOrnek, TEKRAR);
  const yollar = esitlikOrnek.map((c) => kol(c.grid, c.start, c.tx, c.tz, c.reach));
  let yolFark = 0;
  let ilkFark = 0;
  let toplamKol = 0;
  let toplamTaban = 0;
  for (let i = 0; i < yollar.length; i++) {
    if (!yolEsit(uretimYollar[i], yollar[i])) yolFark++;
    if (!ilkEsit(uretimYollar[i], yollar[i])) ilkFark++;
    toplamKol += yollar[i]?.length ?? 0;
    toplamTaban += uretimYollar[i]?.length ?? 0;
  }
  sonuclar.push({ ad, not, ms, ayni: yolFark === 0, yolFark, ilkFark, uzunlukOran: toplamTaban === 0 ? 1 : toplamKol / toplamTaban });
}

const taban = sonuclar[0];
console.log('--- §C KOLLAR: ayni korpusta, ms/cagri (medyan) ---');
console.log('kol                  | ms/cagri | x taban | kare ms | kare %F | cikti');
for (const s of sonuclar) {
  const kareMs = s.ms * cagriKare;
  const kareYuzde = yuz(kareMs, 40.3); // §F: karenin isi 40,3 ms (olcum-perf-t4-son.txt)
  const cikti = s.ayni ? 'BIREBIR AYNI' : `FARKLI (${yuz(s.yolFark, esitlikOrnek.length)} yol)`;
  console.log(
    `${s.ad.padEnd(20)} | ${f3(s.ms).padStart(8)} | ${f2(taban.ms / s.ms).padStart(7)} | ${f2(kareMs).padStart(7)} | ${kareYuzde.padStart(7)} | ${cikti}`,
  );
}
console.log(`  -> "kare ms" = ms/cagri x ${f1(cagriKare)} cagri/kare · "kare %F" = T4 §F'nin 40,3 ms'lik karesine gore`);
console.log(`  -> tampon ayirma+sifirlamanin TEK BASINA bedeli: ${f3(tamponMs)} ms/cagri (${yuz(tamponMs, taban.ms)} taban)`);
console.log('');

for (const s of sonuclar.slice(1)) {
  damga(
    `kol farki (${s.ad})`,
    s.ad.startsWith('N3') ? true : s.yolFark === 0,
    `${s.yolFark} cagri farkli — birebir-ayni iddiasi cokuyor`,
  );
}
// URETIM kolu oracle ile birebir AYNI olmak ZORUNDA: bu damga T5'ten sonra da kalici
// bir gerileme dedektorudur — `findNavPath` davranisi degisirse ilk burasi kirilir.
{
  const u = sonuclar.find((x) => x.ad.startsWith('URETIM'))!;
  damga('uretim = oracle', u.yolFark === 0, `${u.yolFark}/${esitlikOrnek.length} cagri oracle'dan farkli`);
}

/* ── §D SAPMA (birebir olmayan kollar) ─────────────────────────────────────── */
console.log('--- §D SAPMA: birebir olmayan kol ne kadar farkli davranir ---');
for (const s of sonuclar.filter((x) => !x.ayni)) {
  console.log(`  ${s.ad}`);
  console.log(`    yol birebir farkli   ${s.yolFark}/${esitlikOrnek.length} (${yuz(s.yolFark, esitlikOrnek.length)})`);
  console.log(`    ILK WAYPOINT farkli  ${s.ilkFark}/${esitlikOrnek.length} (${yuz(s.ilkFark, esitlikOrnek.length)})  <- navStep yalniz bunu kullanir`);
  console.log(`    toplam yol uzunlugu  x${f3(s.uzunlukOran)} (1,000 = ayni uzunlukta)`);
}
if (sonuclar.every((x) => x.ayni)) console.log('  (birebir olmayan kol yok)');
console.log('');

/* ── §E N2 YOL ONBELLEGI ──────────────────────────────────────────────────── */
/**
 * N2 bir HIZLANDIRMA degil, CAGRI SAYISI dusurmedir: navStep her karede tam BFS yapip yolun
 * yalnız ilk waypoint'ini kullaniyor. Aktor bir hucreyi (0,30 br) gecmek icin ~12 kare
 * yuruyor — o sure boyunca BFS'in cevabi buyuk olcude ayni. Burada bir onbellek POLITIKASI
 * korpus uzerinde oynatilir: kac BFS kaliyor ve verdigi ilk waypoint tabandan ne kadar sapiyor.
 */
interface Onbellek { grid: NavGrid; tx: number; tz: number; reach: number; yol: [number, number][]; i: number }
function n2Oynat(cagrilar: NavCagri[], iz: number[], sapmaOrnekAdim: number) {
  const bellek = new Map<number, Onbellek>();
  let bfs = 0;
  let yeniIz = 0;
  let tuketildi = 0;
  let sapmaBakilan = 0;
  let sapma = 0;
  let sapmaBirCok = 0;
  let duvarOnbellek = 0;
  let duvarTaban = 0;
  const sapmaBr: number[] = [];
  cagrilar.forEach((c, i) => {
    const b = bellek.get(iz[i]);
    let ilk: [number, number] | null = null;
    // IZGARA KİMLİĞİ ŞART: masa/alan açılınca ızgara yeniden kurulur ve eski yol duvardan geçebilir.
    const hedefAyni = b !== undefined && b.grid === c.grid && b.tx === c.tx && b.tz === c.tz && b.reach === c.reach;
    if (hedefAyni) {
      // Aktor o anki waypoint'e yeterince yaklastiysa bir sonrakine gec.
      while (b!.i < b!.yol.length && Math.hypot(c.start[0] - b!.yol[b!.i][0], c.start[2] - b!.yol[b!.i][1]) <= c.grid.cell * 0.5) b!.i++;
      if (b!.i < b!.yol.length) ilk = b!.yol[b!.i];
      else tuketildi++;
    } else if (b === undefined) {
      yeniIz++;
    }
    if (ilk === null) {
      bfs++;
      const yeni = findNavPath(c.grid, c.start, c.tx, c.tz, c.reach);
      if (yeni && yeni.length) {
        bellek.set(iz[i], { grid: c.grid, tx: c.tx, tz: c.tz, reach: c.reach, yol: yeni, i: 0 });
        ilk = yeni[0];
      } else {
        bellek.delete(iz[i]);
      }
    }
    if (i % sapmaOrnekAdim === 0) {
      sapmaBakilan++;
      const dogru = findNavPath(c.grid, c.start, c.tx, c.tz, c.reach);
      const d = dogru && dogru.length ? dogru[0] : null;
      // ZARAR ÖLÇÜSÜ: aktör bu waypoint'e DÜZ ÇİZGİDE gidecek. Taban kolu kontroldür (0 olmalı).
      if (ilk && duvardanGecer(c.grid, c.start, ilk)) duvarOnbellek++;
      if (d && duvardanGecer(c.grid, c.start, d)) duvarTaban++;
      if (!(d === null && ilk === null) && (!d || !ilk || d[0] !== ilk[0] || d[1] !== ilk[1])) {
        sapma++;
        // Sapmanın BÜYÜKLÜĞÜ kararı belirler: komşu hücre (≤ 1 hücre) gözle görünmez,
        // uzak hücre aktörü başka yöne çevirir.
        if (d && ilk) {
          const uzak = Math.hypot(d[0] - ilk[0], d[1] - ilk[1]);
          sapmaBr.push(uzak);
          if (uzak > c.grid.cell * 1.5) sapmaBirCok++;
        } else {
          sapmaBirCok++;
        }
      }
    }
  });
  return { bfs, yeniIz, tuketildi, sapmaBakilan, sapma, sapmaBirCok, sapmaBr, duvarOnbellek, duvarTaban, toplam: cagrilar.length };
}

// Seyreltme izleri koparir → N2 icin korpusun BASTAN KESINTISIZ dilimi kullanilir.
const N2_BOY = Math.min(k.cagrilar.length, KISA ? 3000 : 40000);
const n2s = n2Oynat(k.cagrilar.slice(0, N2_BOY), izler.slice(0, N2_BOY), KISA ? 7 : 25);
console.log('--- §E N2 YOL ONBELLEGI: BFS cagrisini AZALTMA (davranis degisir) ---');
console.log(`  korpus dilimi ${n2s.toplam} cagri (kesintisiz)`);
console.log(`  kalan BFS     ${n2s.bfs} (${yuz(n2s.bfs, n2s.toplam)}) -> cagri/kare ${f1((cagriKare * n2s.bfs) / n2s.toplam)}`);
console.log(`  sebep: yeni iz (aktor/hedef degisti) ${n2s.yeniIz} · yol tukendi ${n2s.tuketildi}`);
console.log(`  ILK WAYPOINT sapmasi ${n2s.sapma}/${n2s.sapmaBakilan} (${yuz(n2s.sapma, n2s.sapmaBakilan)})  <- davranis farki BU`);
console.log(`    sapma buyuklugu: ort ${f2(ort(n2s.sapmaBr))} br · p95 ${f2(yuzdelik(n2s.sapmaBr, 0.95))} br · 1,5 hucreden uzak ${n2s.sapmaBirCok} (${yuz(n2s.sapmaBirCok, n2s.sapmaBakilan)})`);
console.log(`  ZARAR OLCUSU — waypoint e DUZ CIZGIDE giderken DUVARDAN GECEN adim:`);
console.log(`    onbellekli  ${n2s.duvarOnbellek}/${n2s.sapmaBakilan} (${yuz(n2s.duvarOnbellek, n2s.sapmaBakilan)})`);
console.log(`    taban (N0)  ${n2s.duvarTaban}/${n2s.sapmaBakilan} (${yuz(n2s.duvarTaban, n2s.sapmaBakilan)})   <- KONTROL, 0 olmali`);
const n2KareMs = taban.ms * cagriKare * (n2s.bfs / n2s.toplam);
console.log(`  N0 ile birlikte kare payi ${f2(n2KareMs)} ms (${yuz(n2KareMs, 40.3)}) · en iyi N1 koluyla ${f2(sonuclar[3].ms * cagriKare * (n2s.bfs / n2s.toplam))} ms`);
console.log('');

/* ── §F KARE CEVIRISI ─────────────────────────────────────────────────────── */
const KARE = 40.3;
const OLCULEN_NAV = 12.71;
console.log('--- §F KAREYE CEVIRI: T4 §F kare 40,3 ms · findNavPath 12,71 ms (%31,5) ---');
console.log('Ceviri ORAN uzerinden: node`un mutlak ms`i tarayiciya tasinmaz (baska makine, baska JIT,');
console.log('baska NPC sayisi). Tasinabilir olan kolun TABANA GORE orani: 12,71 ms x (kol ms / N0 ms).');
console.log('');
console.log('kol                              | x taban | §F nav ms | kalan kare ms | kazanc');
for (const s of sonuclar) {
  const oran = s.ms / taban.ms;
  const navMs = OLCULEN_NAV * oran;
  const kalan = KARE - OLCULEN_NAV + navMs;
  console.log(
    `${s.ad.padEnd(32)} | ${f2(taban.ms / s.ms).padStart(7)} | ${f2(navMs).padStart(9)} | ${f2(kalan).padStart(13)} | ${f1(KARE - kalan)} ms`,
  );
}
{
  const oran = (sonuclar[3].ms / taban.ms) * (n2s.bfs / n2s.toplam);
  const navMs = OLCULEN_NAV * oran;
  const kalan = KARE - OLCULEN_NAV + navMs;
  console.log(`${'N1c + N2 onbellegi'.padEnd(32)} | ${f2(1 / oran).padStart(7)} | ${f2(navMs).padStart(9)} | ${f2(kalan).padStart(13)} | ${f1(KARE - kalan)} ms`);
}
console.log('  -> "kalan kare ms" bu turda OLCULMEDI, §F`nin 40,3 ms`inden dogrusal cikarimdir;');
console.log('     tarayici sayisi final TAM kosusunda (olcum-perf-t4.mjs §F) dogrulanir.');
console.log(`  -> UYARI: bu kosunun NPC sayisi ${k.npc} ve cagri/kare ${f1(cagriKare)}; §F'ninki NPC 38 / 20,5.`);
console.log('     Node dunyasi daha dolu — mutlak ms dogrudan karsilastirilmaz, ORAN karsilastirilir.');
console.log('');

/* ── §G KORPUS TEMSIL EDIYOR MU ───────────────────────────────── */
/**
 * Bu koşunun dünyası §F'ninkinden DOLU (NPC sayısı farklı). Kolların mutlak ms'i o yüzden
 * taşınmaz — ama karar kolların TABANA GÖRE oranına dayanıyor. O oran dünyanın doluluguna
 * bağlıysa karar da bağlıdır. Burada İKİNCİ, daha hafif bir dünya kurulup aynı kollar
 * yeniden ölçülür: sıralama ve oranlar tutuyorsa korpus temsil ediyor demektir.
 */
console.log('--- §G KORPUS TEMSIL EDIYOR MU: ikinci (daha hafif) dunyada ayni kollar ---');
gecOyunKur(KISA ? 20 : 60, DT);
const k2 = korpusTopla(KISA ? 4 : 15, DT);
const zaman2 = seyrelt(k2.cagrilar, ORNEK);
for (const { kol } of KOLLAR) {
  for (const c of seyrelt(zaman2, Math.min(200, zaman2.length))) kol(c.grid, c.start, c.tx, c.tz, c.reach);
}
const ms2 = KOLLAR.map(({ kol }) => sure(kol, zaman2, TEKRAR));
const taban2 = ms2[0];
console.log(`  dunya 2: NPC ${k2.npc} · cagri ${k2.cagrilar.length} · cagri/kare ${f1(k2.cagrilar.length / k2.kare)}`);
console.log('kol                  | x taban (dunya 1) | x taban (dunya 2) | fark');
let siraBozuldu = false;
for (let i = 0; i < KOLLAR.length; i++) {
  const o1 = taban.ms / sonuclar[i].ms;
  const o2 = taban2 / ms2[i];
  if (i > 0 && (o1 - 1) * (o2 - 1) < 0) siraBozuldu = true;
  console.log(`${KOLLAR[i].ad.padEnd(20)} | ${f2(o1).padStart(17)} | ${f2(o2).padStart(17)} | ${f2(Math.abs(o1 - o2))}`);
}
damga('kol sirasi dunyadan bagimsiz', !siraBozuldu, 'bir kol iki dunyada ters yone gitti — korpus temsil etmiyor');
console.log('');

console.log('KONSOL HATASI: yok (node kosusu)');
damgaOzeti();
