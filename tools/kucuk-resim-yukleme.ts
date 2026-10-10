/**
 * Yükleyici takibi — `kucuk-resim.tsx`in İLK import'u olmalı: oyun modülleri import anında
 * `useGLTF.preload` çağırıyor; sayaç onlardan önce kurulmazsa bitişleri başlangıçsız sayılır.
 * drei `useGLTF` → GLTFLoader → DefaultLoadingManager (doku + bin dahil).
 */
import { DefaultLoadingManager } from 'three';

export const yukleme = { bekleyen: 0, sonDegisim: performance.now(), hatalar: [] as string[] };

const m = DefaultLoadingManager;
const bas = m.itemStart.bind(m);
const son = m.itemEnd.bind(m);
const hata = m.itemError.bind(m);
m.itemStart = (u: string) => {
  yukleme.bekleyen++;
  yukleme.sonDegisim = performance.now();
  bas(u);
};
m.itemEnd = (u: string) => {
  yukleme.bekleyen--;
  yukleme.sonDegisim = performance.now();
  son(u);
};
m.itemError = (u: string) => {
  yukleme.hatalar.push(u);
  hata(u);
};
