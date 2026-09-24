/**
 * olcum-dekor-yuva-f4c2.ts — F4c-2: 💎 DEKOR YUVALARI salonun bugünkü düzenine sığıyor mu?
 *
 * ## Soru
 * Kullanıcı (2026-09-24): dekor adayları haritada gösterilsin, **düzen değişmesin** (masa · tezgâh ·
 * duvar · yol yerinde kalır), dekor BOŞ yerlere sığsın; aday karelerinde dekor duvara gömülüyordu.
 * "Boş yer" gözle seçilmez: dekorun collision'ı yok (`config/decor.ts` salt görsel), yani yürüme
 * yolunun üstüne düşen bir koltuğun içinden müşteri geçer. Bu araç her yuva için şunları ÖLÇER:
 *
 *  - **trafik** : kayıt boyunca yuvanın gövdesine (aktör yarıçapı kadar şişirilmiş) en az bir
 *                 aktörün (müşteri · garson · bulaşıkçı) girdiği karelerin oranı.
 *  - **nokta**  : gövde kenarından en yakın ETKİLEŞİM noktasına (pad · yükseltme · servis · masa ·
 *                 koltuk · kapı) mesafe. `TABLE_UP_RADIUS` altı = işaretin üstüne biniyor.
 *  - **katı**   : gövde ∩ sahnedeki katı engeller (tezgâh · masa · sandalye · banket).
 *  - **duvar**  : gövde ile duvar PROFİLİ arasındaki en küçük boşluk. Duvar üç katmanlı
 *                 (`wallPanel`: lambri 0,22 · çıta 0,26 · gövde 0,18); yere oturan eşyanın sırtı
 *                 ÇITAYA değer, asılanınki gövdeye. Eksi = duvara gömülü (kullanıcının kusuru).
 *  - **dekor**  : gövde ∩ bugünkü dekor (`decorItems`) ve ∩ öteki yuvalar.
 *
 * Dönemler: 1 (yalnız ön-sol salon) · 2 (ön iki salon) · 3 (tam kat, geç oyun). Yuvanın alanı
 * kapalıysa o dönemde "kapalı" yazılır — kilitli alanın dekoru çizilmez (D-057).
 *
 * Koşu:  npx tsx tools/olcum-dekor-yuva-f4c2.ts            (kısa)
 *        OLCUM=tam npx tsx tools/olcum-dekor-yuva-f4c2.ts > docs/olcum-dekor-yuva-f4c2.txt
 * Isı haritası: docs/gorsel/ss/f4c2-isi-<dönem>.json (plan karesinin üstüne `dekor-harita` çizer).
 */
import { writeFileSync } from 'node:fs';
import { KIP, KISA, kipBandi, damga, damgaOzeti, seedRandom } from './olcum-lib';
import { useGame, parkSpot, stationSoftMaxLevel, totalCupPool } from '../src/game/store';
import {
  LAYOUT, FLOOR_HALF, TABLE_UP_RADIUS, activeSolids, entranceAt, servicePlace, BAND, LAVABO,
} from '../src/game/layout';
import { D } from '../src/game/decimal';
import { economyConfig } from '../src/config/economy.config';
import { ACTOR_RADIUS } from '../src/config/actor';
import { decorItems, type DecorItem } from '../src/config/decor';
import { turDunyaKutu } from '../src/components/three/decorLook';
import { WAINSCOT_H, WALL_H, WALL_M, WALL_T_BODY, WALL_T_WAINSCOT } from '../src/components/three/wallPanel';

const DT = 1 / 60;
const ISINMA_SN = KISA ? 60 : 240;
const KAYIT_SN = KISA ? 120 : 900;
const ORNEK_KARE = 6; // 0,1 sn
const HUCRE = 0.5;

// ---- Duvar profili (wallPanel'in sayıları; çıta kalınlığı dosyada dışa açık değil → maketin 0,26'sı) ----
const T_CITA = 0.26;
const CITA_UST = 0.98;
/** Duvar hattından oda tarafına taşan kalınlık, verilen y aralığında (en kalın katman kazanır). */
function profil(y0: number, y1: number): number {
  let t = 0;
  if (y0 < WAINSCOT_H) t = Math.max(t, WALL_T_WAINSCOT / 2);
  if (y0 < CITA_UST && y1 > WAINSCOT_H) t = Math.max(t, T_CITA / 2);
  if (y1 > WAINSCOT_H) t = Math.max(t, WALL_T_BODY / 2);
  return t;
}
const SALON_HAT = FLOOR_HALF + WALL_M; // 17,5
const WC_ON_HAT = BAND.front; // −9,8 (lavabo odasının ön duvarı, yükseklik 2,2)
const WC_ON_H = 2.2;
const WC_KAPI = [LAVABO.door[0] - 0.7, LAVABO.door[0] + 0.7];

/** Tasarım kuralı: sırt, profilin EN KALIN katmanından bu kadar önde durur. */
const PAY = 0.05;

type Duvar = 'sol' | 'sag' | 'wc';
interface Yuva {
  id: string;
  kod: string;
  ad: string;
  duvar: Duvar;
  /** Duvar boyunca merkez (sol/sağ → z, wc → x). */
  boy: number;
  /** Duvar boyunca genişlik · duvardan derinlik · alt/üst y. */
  w: number;
  d: number;
  y0: number;
  y1: number;
  /** Aynı ürünün öbür yuvası (öneri A/B) — çakışma sayımında birbirini dışlar. */
  alt?: string;
}

/**
 * ÖNERİLEN YUVALAR — iki arka köşe (sol: okuma/radyo · sağ: semaver/gramofon), lavabo duvarında
 * saat, yılbaşı takımı için iki aday yer. Ölçüler aday modellerinden (`model-olc.mjs`):
 * table_small/cabinet_small 1,0 → ×0,9 · armchair 1,8 × 1,6 → ×0,70 (insan oranı) ·
 * lamp_standing 1,55 m · holiday chair_large 1,83 × 1,62 × 2,14 → ×0,50 · carpet_round_small 2,0 → ×0,80.
 */
const YUVALAR: Yuva[] = [
  { id: 'd1', kod: 'D1', ad: 'radyo (dolap + radyo)', duvar: 'sol', boy: -2.2, w: 0.9, d: 0.9, y0: 0, y1: 1.28 },
  { id: 'd7a', kod: 'D7a', ad: 'koltuk', duvar: 'sol', boy: -4.1, w: 1.26, d: 1.12, y0: 0, y1: 0.86 },
  { id: 'd7b', kod: 'D7b', ad: 'ayaklı lamba', duvar: 'sol', boy: -5.5, w: 0.62, d: 0.62, y0: 0, y1: 1.55 },
  { id: 'd10', kod: 'D10', ad: 'İstanbul tablosu (duvar)', duvar: 'sol', boy: -4.1, w: 1.1, d: 0.05, y0: 1.45, y1: 2.2 },
  { id: 'd3', kod: 'D3', ad: 'semaver köşesi', duvar: 'sag', boy: -2.2, w: 0.9, d: 0.9, y0: 0, y1: 1.4 },
  { id: 'd6', kod: 'D6', ad: 'gramofon', duvar: 'sag', boy: -4.0, w: 0.9, d: 0.9, y0: 0, y1: 1.45 },
  { id: 'd5', kod: 'D5', ad: 'kanarya kafesi', duvar: 'sag', boy: -5.6, w: 0.45, d: 0.45, y0: 0, y1: 1.67 },
  { id: 'd2', kod: 'D2', ad: 'sarkaçlı saat (duvar)', duvar: 'wc', boy: 8.2, w: 0.42, d: 0.16, y0: 1.0, y1: 2.1 },
  { id: 'yA', kod: 'Y', ad: 'yılbaşı koltuğu + halı · A sol-ön (TV ile askı arası)', duvar: 'sol', boy: 13.05, w: 0.92, d: 1.6, y0: 0, y1: 1.07, alt: 'yB' },
  { id: 'yB', kod: 'Y', ad: 'yılbaşı koltuğu + halı · B sağ-ön pencere altı', duvar: 'sag', boy: 12.2, w: 1.6, d: 1.6, y0: 0, y1: 1.07, alt: 'yA' },
];

interface Kutu { minX: number; maxX: number; minZ: number; maxZ: number }

/** Yuvanın dünya kutusu: sırt = duvar hattı − profil(y aralığı) − PAY. */
function yuvaKutu(y: Yuva): Kutu {
  if (y.duvar === 'wc') {
    const sirt = WC_ON_HAT + profil(y.y0, y.y1) + PAY;
    return { minX: y.boy - y.w / 2, maxX: y.boy + y.w / 2, minZ: sirt, maxZ: sirt + y.d };
  }
  const s = y.duvar === 'sol' ? -1 : 1;
  const sirt = s * (SALON_HAT - profil(y.y0, y.y1) - PAY);
  const [a, b] = [sirt, sirt - s * y.d].sort((p, q) => p - q);
  return { minX: a, maxX: b, minZ: y.boy - y.w / 2, maxZ: y.boy + y.w / 2 };
}

/** Kutu ile duvar profili arası en küçük boşluk (eksi = gömülü). */
function duvarPay(y: Yuva, k: Kutu): number {
  if (y.duvar === 'wc') {
    if (y.y1 > WC_ON_H) return -(y.y1 - WC_ON_H); // duvarın üstünden taşıyor
    if (k.maxX > WC_KAPI[0] && k.minX < WC_KAPI[1]) return -1; // kapı boşluğunun önünde
    return k.minZ - (WC_ON_HAT + profil(y.y0, y.y1));
  }
  if (y.y1 > WALL_H) return -(y.y1 - WALL_H);
  const yuz = SALON_HAT - profil(y.y0, y.y1);
  return y.duvar === 'sol' ? k.minX + yuz : yuz - k.maxX;
}

const kesisir = (a: Kutu, b: Kutu, pay = 0) =>
  a.minX < b.maxX + pay && a.maxX > b.minX - pay && a.minZ < b.maxZ + pay && a.maxZ > b.minZ - pay;
const kutuNokta = (k: Kutu, x: number, z: number) =>
  Math.hypot(Math.max(0, k.minX - x, x - k.maxX), Math.max(0, k.minZ - z, z - k.maxZ));

/** Bugünkü dekorun kabaca gövdesi (KayKit parçası ölçülü; elle çizilenlere 0,35 yarıçap). */
function dekorKutu(d: DecorItem): { k: Kutu; y0: number; y1: number } {
  const b = turDunyaKutu(d.kind, d.rot);
  const asili = d.pos[1] > 0.5;
  const yuk = d.h ?? 0.6;
  const y0 = asili ? d.pos[1] - yuk / 2 : 0;
  const y1 = asili ? d.pos[1] + yuk / 2 : d.kind === 'ayakliLamba' ? 1.55 : 1.0;
  if (b) return { k: { minX: d.pos[0] + b.cx - b.hx, maxX: d.pos[0] + b.cx + b.hx, minZ: d.pos[2] + b.cz - b.hz, maxZ: d.pos[2] + b.cz + b.hz }, y0, y1 };
  const yl = (d.len ?? 0.7) / 2;
  const duvarda = Math.abs(Math.abs(d.pos[0]) - FLOOR_HALF) < 1 && (d.kind !== 'saksi' && d.kind !== 'buyukSaksi');
  const hx = duvarda ? 0.25 : 0.35;
  const hz = duvarda ? yl : 0.35;
  return { k: { minX: d.pos[0] - hx, maxX: d.pos[0] + hx, minZ: d.pos[2] - hz, maxZ: d.pos[2] + hz }, y0, y1 };
}

/** Yuvanın alanı: merkez noktası hangi alan dikdörtgenine düşüyor (0 ön-sol · 1 ön-sağ · 2 arka). */
function yuvaAlan(k: Kutu): number {
  const cx = Math.max(-FLOOR_HALF + 0.01, Math.min(FLOOR_HALF - 0.01, (k.minX + k.maxX) / 2));
  const cz = Math.max(BAND.front + 0.01, Math.min(FLOOR_HALF - 0.01, (k.minZ + k.maxZ) / 2));
  return LAYOUT.areaBounds.findIndex((a) => cx >= a.minX && cx <= a.maxX && cz >= a.minZ && cz <= a.maxZ);
}

const DONEM_PADS: Record<number, string[]> = {
  1: ['table2', 'table3', 'waiter', 'table4', 'waiter2'],
  2: ['table2', 'table3', 'waiter', 'table4', 'waiter2', 'zone2', 'z2table2', 'z2table3', 'dishwasher', 'z2table4'],
  3: economyConfig.pads.map((p) => p.id),
};

function donemKur(donem: number, tohum: number): void {
  seedRandom(tohum);
  useGame.getState().hardReset();
  useGame.setState({ padsDone: DONEM_PADS[donem], wallet: D(1e12), diamonds: D(1e6), questIndex: economyConfig.quests.length } as never);
  const s0 = useGame.getState();
  const lv = donem === 3 ? stationSoftMaxLevel() : Math.min(3, stationSoftMaxLevel());
  useGame.setState({
    tableLevels: s0.tableLevels.map(() => 4),
    stationLevels: s0.stationLevels.map(() => lv),
    cleanCups: totalCupPool(s0.areasOpen, s0.stationLevels.map(() => lv)),
  } as never);
  const s1 = useGame.getState();
  useGame.setState({ player: parkSpot(s1.areasOpen, s1.tables) } as never);
}

interface DonemSonuc {
  donem: number;
  areasOpen: number;
  tables: number;
  ornek: number;
  aktorOrt: number;
  yuva: Record<string, number>; // trafik oranı
  /** KONTROL — öneri değil: kapının 1,5 br içindeki 1,2'lik kutu (her dönemin gerçek yürüme yolu).
   *  Burada trafik %0 çıkarsa ölçüm kördür ve yuvaların %0'ı bir şey söylemez. */
  kontrol: number;
  isi: number[]; // hücre başına aktör-örnek sayısı
  nx: number;
  nz: number;
}

function donemOlc(donem: number): DonemSonuc {
  donemKur(donem, 20260924 + donem);
  const tick = useGame.getState().tick;
  for (let i = 0; i < Math.round(ISINMA_SN / DT); i++) tick(DT);
  const kutular = YUVALAR.map((y) => ({ y, k: yuvaKutu(y) }));
  const nx = Math.round((2 * FLOOR_HALF) / HUCRE);
  const z0 = BAND.front;
  const nz = Math.round((FLOOR_HALF - z0) / HUCRE);
  const isi = new Array(nx * nz).fill(0);
  const say: Record<string, number> = Object.fromEntries(YUVALAR.map((y) => [y.id, 0]));
  let ornek = 0;
  let kontrolSay = 0;
  const kapi = entranceAt(useGame.getState().areasOpen);
  const kontrolK: Kutu = { minX: kapi[0] - 0.6, maxX: kapi[0] + 0.6, minZ: kapi[2] - 2.1, maxZ: kapi[2] - 0.9 };
  let aktorTop = 0;
  const kare = Math.round(KAYIT_SN / DT);
  for (let i = 0; i < kare; i++) {
    tick(DT);
    if (i % ORNEK_KARE) continue;
    const s = useGame.getState();
    const aktorler = [
      ...s.npcs.filter((n) => n.state !== 'inWc').map((n) => n.pos),
      ...s.waiters.map((w) => w.pos),
      ...(s.dishwasher ? [s.dishwasher.pos] : []),
    ];
    ornek++;
    aktorTop += aktorler.length;
    for (const p of aktorler) {
      const cx = Math.floor((p[0] + FLOOR_HALF) / HUCRE);
      const cz = Math.floor((p[2] - z0) / HUCRE);
      if (cx >= 0 && cx < nx && cz >= 0 && cz < nz) isi[cz * nx + cx]++;
    }
    if (aktorler.some((p) => kutuNokta(kontrolK, p[0], p[2]) < ACTOR_RADIUS)) kontrolSay++;
    for (const { y, k } of kutular) {
      if (aktorler.some((p) => kutuNokta(k, p[0], p[2]) < ACTOR_RADIUS)) say[y.id]++;
    }
  }
  const s = useGame.getState();
  return {
    donem, areasOpen: s.areasOpen, tables: s.tables, ornek, aktorOrt: aktorTop / Math.max(1, ornek),
    yuva: Object.fromEntries(Object.entries(say).map(([k, v]) => [k, v / Math.max(1, ornek)])),
    kontrol: kontrolSay / Math.max(1, ornek),
    isi, nx, nz,
  };
}

/** Etkileşim noktaları (layout.interactionPoints ile aynı küme — o fonksiyon dışa açık değil). */
function noktalar(areasOpen: number, tables: number): (readonly [number, number, number])[] {
  const pts: (readonly [number, number, number])[] = [entranceAt(areasOpen)];
  const sp = servicePlace(areasOpen);
  pts.push(sp.station, sp.pickup, sp.dish, sp.upgradeSpot);
  for (let i = 0; i < tables; i++) pts.push(LAYOUT.tables[i].table, LAYOUT.tables[i].seat, LAYOUT.tables[i].upgradeSpot);
  for (const p of Object.values(LAYOUT.padPos)) pts.push(p);
  pts.push(LAVABO.spot, LAVABO.coinSpot);
  return pts;
}

// ---------------------------------------------------------------------------
kipBandi();
const f2 = (x: number) => (x >= 0 ? ' ' : '') + x.toFixed(2);
const yuzde = (x: number) => `%${(100 * x).toFixed(1)}`;
console.log(`# F4c-2 dekor yuvaları · kip ${KIP} · ısınma ${ISINMA_SN} sn · kayıt ${KAYIT_SN} sn/dönem · örnek 0,1 sn · PAY ${PAY}`);

const sonuclar = [1, 2, 3].map(donemOlc);
// Harita aracı (`dekor-harita.mjs`) yuvaları buradan okur — kutu iki yerde hesaplanmasın.
writeFileSync('docs/gorsel/ss/f4c2-yuvalar.json', JSON.stringify({
  yuvalar: YUVALAR.map((y) => ({ ...y, kutu: yuvaKutu(y), alan: yuvaAlan(yuvaKutu(y)) })),
  dekor: decorItems(3).map((d) => ({ kind: d.kind, ...dekorKutu(d) })),
}));
for (const r of sonuclar) {
  damga(`aktör var (dönem ${r.donem})`, r.aktorOrt >= 3, `ortalama ${r.aktorOrt.toFixed(1)} aktör`);
  damga(`kontrol yolu dolu (dönem ${r.donem})`, r.kontrol > 0.05, yuzde(r.kontrol));
  writeFileSync(`docs/gorsel/ss/f4c2-isi-${r.donem}.json`, JSON.stringify({ hucre: HUCRE, x0: -FLOOR_HALF, z0: BAND.front, nx: r.nx, nz: r.nz, ornek: r.ornek, isi: r.isi }));
  console.log(`dönem ${r.donem}: alan ${r.areasOpen} · masa ${r.tables} · örnek ${r.ornek} · ort. aktör ${r.aktorOrt.toFixed(1)} · KONTROL (kapı içi yol) trafik ${yuzde(r.kontrol)}`);
}

console.log('\n## Yuvalar — geometri (dönemden bağımsız)');
console.log('yuva  kod   duvar  kutu x[min,max] z[min,max]              duvar payı  dekor çakışma          yuva çakışma');
const kutular = YUVALAR.map((y) => ({ y, k: yuvaKutu(y) }));
for (const { y, k } of kutular) {
  const pay = duvarPay(y, k);
  const dekor = decorItems(3)
    .map((d) => ({ d, b: dekorKutu(d) }))
    .filter(({ b }) => kesisir(k, b.k, 0.05) && b.y0 < y.y1 && b.y1 > y.y0)
    .map(({ d }) => `${d.kind}@${d.pos[2].toFixed(1)}`);
  const yuvaC = kutular
    .filter((o) => o.y.id !== y.id && o.y.id !== y.alt && kesisir(k, o.k, 0.05) && o.y.y0 < y.y1 && o.y.y1 > y.y0)
    .map((o) => o.y.id);
  damga(`duvar payı ≥ ${PAY - 1e-9} (${y.id})`, pay >= PAY - 1e-9, pay.toFixed(3));
  console.log(
    `${y.id.padEnd(5)} ${y.kod.padEnd(5)} ${y.duvar.padEnd(6)} [${f2(k.minX)},${f2(k.maxX)}] [${f2(k.minZ)},${f2(k.maxZ)}]`.padEnd(64) +
      `${pay.toFixed(3).padStart(8)}    ${(dekor.join(' ') || '—').padEnd(22)} ${yuvaC.join(' ') || '—'}`,
  );
}

console.log('\n## Yuvalar × dönem — trafik (aktörün gövdeye girdiği örnek oranı) · en yakın nokta · katı');
console.log('yuva  ' + sonuclar.map((r) => `| dönem ${r.donem}: alan  trafik   nokta  katı `).join(''));
for (const { y, k } of kutular) {
  let satir = y.id.padEnd(6);
  for (const r of sonuclar) {
    const alan = yuvaAlan(k);
    const acik = alan >= 0 && alan < r.areasOpen;
    if (!acik) {
      satir += `| a${alan} KAPALI${' '.repeat(26)}`;
      continue;
    }
    const nokta = Math.min(...noktalar(r.areasOpen, r.tables).map((p) => kutuNokta(k, p[0], p[2])));
    const kati = activeSolids(r.tables, r.areasOpen).some((s) => kesisir(k, { minX: s.c[0] - s.h[0], maxX: s.c[0] + s.h[0], minZ: s.c[2] - s.h[1], maxZ: s.c[2] + s.h[1] }, 0.1));
    damga(`nokta > ${TABLE_UP_RADIUS} (${y.id} · d${r.donem})`, nokta > TABLE_UP_RADIUS, nokta.toFixed(2));
    satir += `| a${alan}   ${yuzde(r.yuva[y.id]).padStart(6)}  ${nokta.toFixed(2).padStart(5)}  ${kati ? 'VAR ' : 'yok '}`.padEnd(34);
  }
  console.log(satir);
}
damgaOzeti();
