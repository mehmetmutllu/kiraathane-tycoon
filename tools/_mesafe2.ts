// Gecici olcum: ESKI (B2, 21,2x20,6) ve YENI (B3-1, 34x34) yerlesimde
// garsonun pickup -> masa DUZ-CIZGI mesafesi (elma-elma karsilastirma).
import { LAYOUT, servicePlace } from '../src/game/store';

const AREA_DX = 10.6, AREA_DZ = 10.3;
const col = (a: number) => (a < 2 ? a : 1);
const row = (a: number) => (a < 2 ? 0 : 1);
const mir = (a: number, v: [number, number]): [number, number] => [col(a) ? AREA_DX - v[0] : v[0], v[1] - row(a) * AREA_DZ];
const BASE: [number, number][] = [[-1.4, 2.55], [3.7, 2.55], [-1.4, -0.95], [3.7, -0.95]];
const OLD_TABLES: [number, number][] = [0, 1, 2].flatMap((a) => BASE.map((t) => mir(a, t)));
const OLD_PICKUP: [number, number] = [-3.5, -2.5]; // mir(0, [-3.5,-2.5])

const d = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const stat = (ds: number[]) => `ort ${(ds.reduce((x, y) => x + y, 0) / ds.length).toFixed(2)} | en uzak ${Math.max(...ds).toFixed(2)}`;

for (const [areasOpen, n] of [[1, 4], [2, 8], [3, 12]] as const) {
  const oldD = OLD_TABLES.slice(0, n).map((t) => d(OLD_PICKUP, t));
  const sp = servicePlace(areasOpen);
  const newD = Array.from({ length: n }, (_, i) => d([sp.pickup[0], sp.pickup[2]], [LAYOUT.tables[i].table[0], LAYOUT.tables[i].table[2]]));
  const om = oldD.reduce((x, y) => x + y, 0) / n, nm = newD.reduce((x, y) => x + y, 0) / n;
  console.log(`${areasOpen} alan/${n} masa  ESKI: ${stat(oldD)}  |  YENI: ${stat(newD)}  |  fark ort ${(((nm / om) - 1) * 100).toFixed(0)}%`);
}
