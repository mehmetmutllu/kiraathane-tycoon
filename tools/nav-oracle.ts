/**
 * nav-oracle.ts — T5 ÖNCESİ `findNavPath`in DONMUŞ kopyası. **Değiştirilmez.**
 *
 * ## Neden var
 * T5'in kolları (N1a kalıcı tampon · N1b hedef testi push'ta · N1c hedef maskesi) hız için
 * seçildi, **davranış için değil**: üçünün de iddiası *"aynı ızgarada, aynı argümanlarla,
 * BİREBİR AYNI yolu döndürür"*. Böyle bir iddianın tek dürüst kanıtı, eski algoritmanın
 * yanında durup her çağrıda aynı diziyi vermesidir. Bu dosya o eski algoritmadır.
 *
 * İKİ YERDEN OKUNUR — ve ikisi de bunu ORACLE olarak kullanır, kopyalamaz:
 *   · `tests/nav-kol-t5.test.ts`  — bekçi: rastgele başlangıç/hedef çiftlerinde eşitlik.
 *   · `tools/olcum-nav-t5.ts`     — ölçüm: hız TABANI ve çıktı eşitliği damgası.
 *
 * ## Kural
 * Buraya **hiçbir iyileştirme girmez.** `src/game/nav.ts` hızlanmaya devam edebilir; bu dosya
 * T5 öncesinin davranışını temsil ettiği sürece bekçi anlamlıdır. Yerleşim kuralları gerçekten
 * değişirse (hücre boyu, komşuluk, köşe kesme) oracle DE değişir — ama o zaman değişiklik
 * bilerek yapılır ve kendi kararıyla (`decisions.md`) gelir.
 *
 * Kaynak: `src/game/nav.ts` @ ef6f4a9 (`navPathAra` + `nearestFreeIdx`), birebir.
 */
import type { NavGrid } from '../src/game/nav';

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

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

/** T5 öncesi BFS — her çağrıda `new Int32Array(cols*rows).fill(-2)`, hedef testi POP'ta. */
export function navPathOracle(
  grid: NavGrid,
  start: readonly [number, number, number],
  tx: number,
  tz: number,
  reach: number,
): [number, number][] | null {
  const { cols, rows, blocked } = grid;
  const [sc, sr] = clampCell(grid, start[0], start[2]);
  const startIdx = nearestFreeIdx(grid, sc, sr);
  const reach2 = reach * reach;
  const isGoal = (c: number, r: number): boolean => {
    const [cx, cz] = cellCenter(grid, c, r);
    const dx = cx - tx;
    const dz = cz - tz;
    return dx * dx + dz * dz <= reach2;
  };
  const prev = new Int32Array(cols * rows).fill(-2);
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
