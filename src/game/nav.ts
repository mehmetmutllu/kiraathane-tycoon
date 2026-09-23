import { olcEkle, olcumAcik } from './olcum';
/**
 * nav.ts — Personel (garson/bulaşıkçı) için kaba ızgara BFS yol bulma.
 *
 * Neden: eski `moveAvoid` (eksen-başı kayma) GERÇEK yol bulma değildi → bir masa, aktör ile
 * hedef arasında TAM ortadaysa (mutfak arka duvarda, ön masa arka masayı kolonda kapatıyor)
 * eksen-kayması engeli dolaşamayıp KİLİTLENİYORDU (garson ön masada takılı kalır, arka masa
 * sabırdan ölür, salınım yapar). BFS gerçek bir rota bulur → her masaya her zone'da ulaşılır.
 *
 * Saf modül: LAYOUT'a bağlı değil (store circular import'u olmasın). Çağıran `area` + `solids`
 * verir. Personel hareketi ızgara hücre merkezlerini izler; masanın AÇIK komşu hücresinden
 * yaklaşıp kenara gelince teslim/al yapar. Oyuncu BUNU KULLANMAZ (input + kendi collision'ı).
 */

export interface NavArea {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Engel: merkez (x,y,z) + yarı-boyut [hx,hz] (store'daki Solid ile uyumlu). */
export interface NavSolid {
  c: readonly [number, number, number];
  h: readonly [number, number];
}

export interface NavGrid {
  cols: number;
  rows: number;
  cell: number;
  minX: number;
  minZ: number;
  /** rows*cols; 1 = engel (geçilemez). */
  blocked: Uint8Array;
}

/** Izgarayı engellerden kur. `inflate` = aktör yarıçapı (engeller bu kadar şişirilir →
 *  hücre merkezini izleyen aktörün gövdesi masa kenarına tam değer, içine girmez). */
export function buildNavGrid(area: NavArea, cell: number, solids: NavSolid[], inflate: number): NavGrid {
  const cols = Math.max(1, Math.ceil((area.maxX - area.minX) / cell));
  const rows = Math.max(1, Math.ceil((area.maxZ - area.minZ) / cell));
  const blocked = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const z = area.minZ + (r + 0.5) * cell;
    for (let c = 0; c < cols; c++) {
      const x = area.minX + (c + 0.5) * cell;
      // ceil yüzünden son satır/sütun merkezi alanın DIŞINA taşabilir (z≈5.05 > maxZ 5.0) —
      // bu hücreler KAPALI: kapıdan girip sağa kıracak müşterinin ilk waypoint'i buraya düşünce
      // "içeri gir" eşiğiyle (z>5.0 → kapıya dön) sonsuz salınım yapıyordu (telefon 2026-06-11).
      if (x > area.maxX || z > area.maxZ) {
        blocked[r * cols + c] = 1;
        continue;
      }
      for (const s of solids) {
        if (Math.abs(x - s.c[0]) < s.h[0] + inflate && Math.abs(z - s.c[2]) < s.h[1] + inflate) {
          blocked[r * cols + c] = 1;
          break;
        }
      }
    }
  }
  return { cols, rows, cell, minX: area.minX, minZ: area.minZ, blocked };
}

function clampCell(grid: NavGrid, x: number, z: number): [number, number] {
  let c = Math.floor((x - grid.minX) / grid.cell);
  let r = Math.floor((z - grid.minZ) / grid.cell);
  c = Math.max(0, Math.min(grid.cols - 1, c));
  r = Math.max(0, Math.min(grid.rows - 1, r));
  return [c, r];
}

function cellCenter(grid: NavGrid, c: number, r: number): [number, number] {
  return [grid.minX + (c + 0.5) * grid.cell, grid.minZ + (r + 0.5) * grid.cell];
}

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

// ---------------------------------------------------------------------------
// KALICI TAMPONLAR (T5 · D-139) — ayırma sıcak yoldan çıktı
// ---------------------------------------------------------------------------
/**
 * `findNavPath` geç oyunda karenin **%31,5'iydi** (T4 §F). T5 maliyeti bölüştürdü
 * (`docs/nav-raporu-t5.md`): tampon ayırma+sıfırlama tabanın yalnız **%10,3'ü**, asıl para
 * gezinmede — çağrı başına **2.551 hücre pop** (ızgaranın %24,9'u) ve **20.400 komşu denetimi**.
 * Uygulanan üç kol da ÇIKTIYI DEĞİŞTİRMEZ (bekçi: `tests/nav-kol-t5.test.ts`, oracle
 * `tools/nav-oracle.ts`):
 *
 *   N1a  KALICI TAMPON + KUŞAK DAMGASI — `new Int32Array(10.260).fill(-2)` (41 KB/çağrı,
 *        1,06 MB/kare) kalktı. "Ziyaret edildi mi" artık `tDamga[i] === kusak`.
 *   N1b  HEDEF TESTİ POP YERİNE PUSH'TA — kuyruk FIFO olduğu için kuyruğa İLK giren hedef
 *        hücresi kuyruktan da İLK çıkandır; aynı hücre bulunur, son katmanın kalanı
 *        genişletilmez. `start` hiç push edilmediğinden eski kodun `idx !== startIdx` ayrımı
 *        da kendiliğinden korunur.
 *   N1c  HEDEF HÜCRE MASKESİ ÖNCEDEN — `reach` küçük (0,40–1,68) ve hücre 0,30; hedefe `reach`
 *        mesafede yalnız birkaç düzine hücre var. Bunlar önden işaretlenir, sıcak döngüde
 *        `cellCenter` + mesafe hesabı yerine tek dizi okuması kalır.
 *
 * Ölçülen: **×2,37** (0,343 → 0,145 ms/çağrı), §F karesinde 12,71 → 5,36 ms.
 * A* kolu (×3,04) ELENDİ: 1,2 ms için ilk waypoint'in %27,5'inde farklı rota seçiyordu ve
 * yol kalitesi aynıydı (×1,003). Yol önbelleği (×423) KENDİ TURUNA kaldı (T9a'da ÇAĞRI önbelleği olarak geldi, aşağıda): bu turda denenen
 * saf politika duvardan geçen adımı %0,1'den %1,9'a çıkarıyordu.
 *
 * TEK İŞ PARÇACIĞI VARSAYIMI: `findNavPath` yeniden-girişli değildir (özyineleme/async yok),
 * tamponlar çağrılar arasında paylaşılır. Snap araması ana BFS'ten ÖNCE biter, ikisi aynı
 * kuyruğu kullanabilir.
 */
let tPrev = new Int32Array(0);
let tDamga = new Int32Array(0);
let tKuyruk = new Int32Array(0);
let tSnap = new Int32Array(0);
let tHedef = new Int32Array(0);
let kusak = 0;
let snapKusak = 0;
let hedefKusak = 0;

/** Kuşak sayacı Int32'nin tepesine yaklaşırsa damgalar sıfırlanır (taşma yanlış "ziyaret edildi" der). */
const KUSAK_TAVAN = 0x7ffffffe;

function tamponHazirla(n: number): void {
  if (tPrev.length < n) {
    tPrev = new Int32Array(n);
    tDamga = new Int32Array(n);
    tKuyruk = new Int32Array(n);
    tSnap = new Int32Array(n);
    tHedef = new Int32Array(n);
    kusak = 0;
    snapKusak = 0;
    hedefKusak = 0;
    return;
  }
  if (kusak >= KUSAK_TAVAN || snapKusak >= KUSAK_TAVAN || hedefKusak >= KUSAK_TAVAN) {
    tDamga.fill(0);
    tSnap.fill(0);
    tHedef.fill(0);
    kusak = 0;
    snapKusak = 0;
    hedefKusak = 0;
  }
}

/** Başlangıç hücresi engelin İÇİNDEyse (aktör footprint'e yapışık/gömülü) en yakın AÇIK hücreye snap
 *  et (engel içinden de geçerek genişler) → aktör buradan rota izleyip engelin dışına çıkar. */
function nearestFreeIdx(grid: NavGrid, sc: number, sr: number): number {
  const { cols, rows, blocked } = grid;
  const start = sr * cols + sc;
  if (!blocked[start]) return start;
  snapKusak++;
  tSnap[start] = snapKusak;
  tKuyruk[0] = start;
  let son = 1;
  let h = 0;
  while (h < son) {
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
      tKuyruk[son++] = ni;
    }
  }
  return start;
}

/**
 * BFS: `start` dünya konumundan, merkezi (tx,tz)'ye `reach` mesafesindeki ilk AÇIK hücreye yol.
 * Dönüş: izlenecek hücre-merkezi waypoint'leri (start hariç) ya da ulaşılamazsa null.
 * Başlangıç hücresi engelin içinde olsa bile (aktör masa kenarına yapışıksa) komşulara çıkış serbest.
 */
export function findNavPath(
  grid: NavGrid,
  start: readonly [number, number, number],
  tx: number,
  tz: number,
  reach: number,
): [number, number][] | null {
  // ÖLÇÜM DİKİŞİ: bu fonksiyon T4 §F'de karenin %31,5'iydi; T5 sonrası %13,3 (oran çevirisi).
  // Kapalıyken bedel tek boolean.
  const olc = olcumAcik(); // DEV kapısı `olcum.ts`te (node'da `import.meta.env` yok)
  const t0 = olc ? performance.now() : 0;
  if (korpus) korpusaYaz(grid, start, tx, tz, reach);
  const yol = onbellekAcik && kolAra === navPathAra
    ? onbellektenAra(grid, start, tx, tz, reach)
    : // A/B KOLU (T5b) — `kolAra` normalde `navPathAra`dır; ölçüm aracı oracle'ı takarsa BU çağrı
      // eski algoritmayı koşar. Kapalıyken bedel tek referans okumasıdır (dal bile yok).
      kolAra(grid, start, tx, tz, reach);
  if (olc) olcEkle('findNavPath', performance.now() - t0);
  return yol;
}

// ---------------------------------------------------------------------------
// N2-KESİN — BAŞLANGIÇ HÜCRESİ ANAHTARLI YOL ÖNBELLEĞİ (T9a · D-145 — varsayılan AÇIK)
// ---------------------------------------------------------------------------
/**
 * T5'in N2'si aktörün yolunu tutuyordu ("waypoint'e yaklaşınca sıradakine geç") → yol bayatlıyor,
 * duvardan geçen adım %0,1 → %1,9. Bu kol yol değil ÇAĞRI önbelleği: `navPathAra`nın çıktısı
 * yalnız (ızgara, başlangıç HÜCRESİ, tx, tz, reach)'e bağlıdır — `start` ızgaraya `clampCell` ile
 * girer, snap de hücreden türer, ızgara kurulduktan sonra değişmez (`getNavGrid` anahtarı değişince
 * YENİ nesne kurar). Aktör bir hücreyi ~12 karede geçtiği için aynı anahtar ardışık karelerde
 * tekrarlanır; dönen yol BİREBİR aynıdır, bayat olamaz.
 *
 * Ölçülen (`docs/performans-raporu-t9a.md`): geç oyunda tick 4,06 → 0,40 ms (×10,1, node); telefon
 * tarayıcısında nav ×0,24, karenin işi −%21,4. Tam durum parmak izi iki kolda birebir.
 * Bekçi: `tests/nav-onbellek-t9a.test.ts`. Kapatma anahtarı ölçüm araçları için durur.
 *
 * VARSAYIM: ızgara kurulduktan sonra `blocked` yerinde DEĞİŞMEZ (değişecekse yeni nesne kurulur).
 * Dönen dizi paylaşılır: çağıran (`navStep`) yalnız `path[0]`ı OKUR, yazmaz.
 */
let onbellekAcik = true;
let onbellekIzgara: NavGrid | null = null;
const onbellek = new Map<string, [number, number][] | null>();
/** Hedef sayısı sınırlı (masa, ocak, leğen, kapı…); büyüme yine de bir tavanla kesilir. */
const ONBELLEK_TAVAN = 4096;

export function navOnbellekAyarla(acik: boolean): void {
  onbellekAcik = acik;
  onbellek.clear();
  onbellekIzgara = null;
}
export const navOnbellekAcik = (): boolean => onbellekAcik;

function onbellektenAra(
  grid: NavGrid,
  start: readonly [number, number, number],
  tx: number,
  tz: number,
  reach: number,
): [number, number][] | null {
  if (grid !== onbellekIzgara) {
    onbellek.clear();
    onbellekIzgara = grid;
  }
  const [sc, sr] = clampCell(grid, start[0], start[2]);
  const anahtar = `${sr * grid.cols + sc}|${tx}|${tz}|${reach}`;
  const hit = onbellek.get(anahtar);
  if (hit !== undefined) return hit;
  const yol = navPathAra(grid, start, tx, tz, reach);
  if (onbellek.size >= ONBELLEK_TAVAN) onbellek.clear();
  onbellek.set(anahtar, yol);
  return yol;
}

// ---------------------------------------------------------------------------
// A/B KOLU (T5b) — üretim ↔ oracle canlı takası, YALNIZ ölçüm için.
// ---------------------------------------------------------------------------
/**
 * NEDEN VAR: T5 node'da ×2,52 ölçtü ama KARE kazancı tarayıcıda doğrulanamadı — çünkü iki
 * koşu farklı günlerde, farklı gölge durumunda ve %22-38 farklı makine yükünde alınmıştı
 * (`docs/nav-raporu-t5.md` §6). Ayrı koşuları karşılaştırmak bu soruyu ÇÖZEMEZ; iki kolun
 * AYNI sayfada, AYNI dünyada, dönüşümlü koşması gerekir. Bu kanca onu mümkün kılar.
 *
 * Oracle T5 ÖNCESİNİN donmuş kopyasıdır (`tools/nav-oracle.ts`) ve imzası birebir aynıdır;
 * bekçi (`tests/nav-kol-t5.test.ts`) ikisinin ~4.200 çiftte aynı diziyi verdiğini zaten
 * doğruluyor — yani takas DAVRANIŞI değiştirmez, yalnız maliyeti değiştirir.
 *
 * ÜRETİMDE ERİŞİLEMEZ: kancayı `devHooks.ts` yalnız `import.meta.env.DEV` altında bağlar ve
 * oracle modülü oraya **dinamik** import edilir, yani üretim paketine hiç girmez.
 */
type NavAra = typeof navPathAra;
let kolAra: NavAra = navPathAra;

/** Ölçüm aracı bunu çağırır; `null` üretim koluna döner. */
export function navKolAyarla(f: NavAra | null): void {
  kolAra = f ?? navPathAra;
}

/** Şu an hangi kol takılı — çıktıya damga olarak yazılır (sessizce yanlış kol ölçülmesin). */
export function navKolAdi(): 'uretim' | 'oracle' {
  return kolAra === navPathAra ? 'uretim' : 'oracle';
}

// ---------------------------------------------------------------------------
// ÇAĞRI KORPUSU (T5) — ölçüm araçları için, varsayılan KAPALI.
// ---------------------------------------------------------------------------
/**
 * NEDEN: kolları uydurma başlangıç/hedef çiftleriyle karşılaştırmak yanlış kolu seçtirir —
 * BFS'in maliyeti hedefin UZAKLIĞINA ve ızgaranın doluluğuna bağlıdır, ikisini de yerleşim
 * ve o anki oyun durumu belirler. Bu kanca GERÇEK bir koşunun çağrılarını olduğu gibi
 * kaydeder; kollar aynı korpusta yarışır.
 *
 * AKTÖR KİMLİĞİ BURADAN OKUNMAZ. İlk sürüm `start` dizisinin referansını aktör kimliği saydı;
 * `tick.ts` her karede `pos: [...n.pos]` ile diziyi klonladığı için her çağrı ayrı bir "aktör"
 * göründü ve yol önbelleği ölçümü sahte bir "%100 BFS" verdi. `aktor` alanı bu yüzden yalnız
 * KABA bir ipucudur; izler ölçüm aracında çağrılardan yeniden kurulur (aynı hedefe giden,
 * başlangıcı bir kare adımından yakın ardışık çağrı = aynı aktör).
 * Değerler kopyalanır çünkü `pos` yerinde değişir. Kapalıyken bedel tek null okumasıdır.
 */
export interface NavCagri {
  /** `start` referansından türeyen KABA kimlik — güvenilir iz için yukarıdaki nota bak. */
  aktor: number;
  grid: NavGrid;
  start: [number, number, number];
  tx: number;
  tz: number;
  reach: number;
}

let korpus: NavCagri[] | null = null;
let aktorKimlik: WeakMap<object, number> | null = null;
let aktorSayac = 0;

function korpusaYaz(
  grid: NavGrid,
  start: readonly [number, number, number],
  tx: number,
  tz: number,
  reach: number,
): void {
  const anahtar = start as unknown as object;
  let id = aktorKimlik!.get(anahtar);
  if (id === undefined) {
    id = aktorSayac++;
    aktorKimlik!.set(anahtar, id);
  }
  korpus!.push({ aktor: id, grid, start: [start[0], start[1], start[2]], tx, tz, reach });
}

export function navKorpusAc(): void {
  korpus = [];
  aktorKimlik = new WeakMap();
  aktorSayac = 0;
}
export function navKorpusOku(): NavCagri[] {
  return korpus ?? [];
}
export function navKorpusKapat(): void {
  korpus = null;
  aktorKimlik = null;
}

function navPathAra(
  grid: NavGrid,
  start: readonly [number, number, number],
  tx: number,
  tz: number,
  reach: number,
): [number, number][] | null {
  const { cols, rows, blocked } = grid;
  tamponHazirla(cols * rows);

  /* HEDEF MASKESİ (N1c) — merkezi (tx,tz)'ye `reach` mesafedeki hücreler.
   * Kutu neden yeterli: hücre merkezi `reach` içindeyse sütun farkı en çok `floor(reach/cell + 0,5)`,
   * ve bu her zaman `ceil(reach/cell)`i geçmez. Buradaki `+1` fazladan emniyet payıdır — mutasyon
   * sınavı bunu doğruladı, `+1`siz de aynı sonucu veriyor (`tools/mutasyon-nav-t5.mjs` M4).
   * Hedef ızgara dışındaysa kelepçe kutuyu kaydırır, ama o durumda geçerli hedef hücreleri de
   * kelepçe yönünde kalır (dışarı taşan tarafta hiç hücre yoktur). */
  const rad = Math.ceil(reach / grid.cell) + 1;
  const [tc, tr] = clampCell(grid, tx, tz);
  const reach2 = reach * reach;
  hedefKusak++;
  let hedefVar = false;
  for (let r = Math.max(0, tr - rad); r <= Math.min(rows - 1, tr + rad); r++) {
    const dz = grid.minZ + (r + 0.5) * grid.cell - tz;
    const dz2 = dz * dz;
    if (dz2 > reach2) continue;
    for (let c = Math.max(0, tc - rad); c <= Math.min(cols - 1, tc + rad); c++) {
      const dx = grid.minX + (c + 0.5) * grid.cell - tx;
      if (dx * dx + dz2 <= reach2) {
        tHedef[r * cols + c] = hedefKusak;
        hedefVar = true;
      }
    }
  }
  // Hiçbir hücre menzilde değilse eski kod da ızgarayı boşuna gezip null dönerdi.
  if (!hedefVar) return null;

  const [sc, sr] = clampCell(grid, start[0], start[2]);
  const startIdx = nearestFreeIdx(grid, sc, sr); // bloklu başlangıcı en yakın açığa snap et
  kusak++;
  tDamga[startIdx] = kusak;
  tPrev[startIdx] = -1;
  tKuyruk[0] = startIdx;
  let son = 1;
  let head = 0;
  let goalIdx = -1;
  // Hedef testi PUSH'ta (N1b): kuyruk FIFO → ilk push edilen hedef, ilk pop edilecek hedeftir.
  dis: while (head < son) {
    const idx = tKuyruk[head++];
    const cr = Math.floor(idx / cols);
    const cc = idx - cr * cols;
    for (const [dc, dr] of NEIGHBORS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nidx = nr * cols + nc;
      if (tDamga[nidx] === kusak || blocked[nidx]) continue;
      // Köşe kesmeyi engelle: çapraz adımda iki ortogonal komşu da açık olmalı.
      if (dc !== 0 && dr !== 0 && (blocked[cr * cols + nc] || blocked[nr * cols + cc])) continue;
      tDamga[nidx] = kusak;
      tPrev[nidx] = idx;
      tKuyruk[son++] = nidx;
      if (tHedef[nidx] === hedefKusak) { goalIdx = nidx; break dis; }
    }
  }
  if (goalIdx < 0) return null;
  const path: [number, number][] = [];
  let cur = goalIdx;
  while (cur !== -1 && cur !== startIdx) {
    const cr = Math.floor(cur / cols);
    const cc = cur - cr * cols;
    path.push(cellCenter(grid, cc, cr));
    cur = tPrev[cur];
  }
  path.reverse();
  return path;
}
