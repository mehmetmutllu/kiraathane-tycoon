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

/** Başlangıç hücresi engelin İÇİNDEyse (aktör footprint'e yapışık/gömülü) en yakın AÇIK hücreye snap
 *  et (engel içinden de geçerek genişler) → aktör buradan rota izleyip engelin dışına çıkar. */
function nearestFreeIdx(grid: NavGrid, sc: number, sr: number): number {
  const { cols, rows, blocked } = grid;
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
  const { cols, rows, blocked } = grid;
  const [sc, sr] = clampCell(grid, start[0], start[2]);
  const startIdx = nearestFreeIdx(grid, sc, sr); // bloklu başlangıcı en yakın açığa snap et
  const reach2 = reach * reach;
  const isGoal = (c: number, r: number): boolean => {
    const [cx, cz] = cellCenter(grid, c, r);
    const dx = cx - tx;
    const dz = cz - tz;
    return dx * dx + dz * dz <= reach2;
  };
  const prev = new Int32Array(cols * rows).fill(-2); // -2 = ziyaret edilmedi, -1 = başlangıç
  prev[startIdx] = -1;
  const queue: number[] = [startIdx];
  let head = 0;
  let goalIdx = -1;
  while (head < queue.length) {
    const idx = queue[head++];
    const cr = Math.floor(idx / cols);
    const cc = idx - cr * cols;
    if (idx !== startIdx && isGoal(cc, cr)) {
      goalIdx = idx;
      break;
    }
    for (const [dc, dr] of NEIGHBORS) {
      const nc = cc + dc;
      const nr = cr + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nidx = nr * cols + nc;
      if (prev[nidx] !== -2 || blocked[nidx]) continue;
      // Köşe kesmeyi engelle: çapraz adımda iki ortogonal komşu da açık olmalı.
      if (dc !== 0 && dr !== 0 && (blocked[cr * cols + nc] || blocked[nr * cols + cc])) continue;
      prev[nidx] = idx;
      queue.push(nidx);
    }
  }
  if (goalIdx < 0) return null;
  const path: [number, number][] = [];
  let cur = goalIdx;
  while (cur !== -1 && cur !== startIdx) {
    const cr = Math.floor(cur / cols);
    const cc = cur - cr * cols;
    path.push(cellCenter(grid, cc, cr));
    cur = prev[cur];
  }
  path.reverse();
  return path;
}
