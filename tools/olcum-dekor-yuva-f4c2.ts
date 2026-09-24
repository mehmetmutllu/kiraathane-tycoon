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
import { LAYOUT, FLOOR_HALF, TABLE_UP_RADIUS, activeSolids, entranceAt, servicePlace, BAND, LAVABO } from '../src/game/layout';
import { D } from '../src/game/decimal';
import { economyConfig } from '../src/config/economy.config';
import { ACTOR_RADIUS } from '../src/config/actor';
import {
  DUVAR_PAYI, VITRIN_YUVALARI, decorItems, yuvaAlani, yuvaDuvarPayi, yuvaKutu, type DecorItem, type Kutu2 as Kutu,
} from '../src/config/decor';
import { turDunyaKutu } from '../src/components/three/decorLook';

const DT = 1 / 60;
const ISINMA_SN = KISA ? 60 : 240;
const KAYIT_SN = KISA ? 120 : 900;
const ORNEK_KARE = 6; // 0,1 sn
const HUCRE = 0.5;

/**
 * YUVALAR TEK KAYNAKTAN (commit #2, D-155): commit #1'de bu dosyada duran öneri listesi ve profil
 * hesabı `config/decor.ts`e taşındı (`VITRIN_YUVALARI` · `yuvaKutu` · `yuvaDuvarPayi`); ölçüm, çizim
 * ve bekçi aynı sayıyı okur. Commit #1'deki kod adları: D1 radyo · D7a koltuk · D7b lamba ·
 * D10 tablo · D3 semaver · D6 gramofon · D5 kanarya · D2 saat · yA yılbaşı (seçilen) · yB (elendi).
 */
const PAY = DUVAR_PAYI;
const YUVALAR = VITRIN_YUVALARI.map((y) => ({ ...y, kod: y.id, ad: y.id, alt: undefined as string | undefined }));
const duvarPay = (y: (typeof YUVALAR)[number]) => yuvaDuvarPayi(y);
const yuvaAlan = (_k: Kutu, y: (typeof YUVALAR)[number]) => yuvaAlani(y);

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
  const duvarda = Math.abs(Math.abs(d.pos[0]) - FLOOR_HALF) < 1 && d.kind !== 'saksi' && d.kind !== 'buyukSaksi';
  const hx = duvarda ? 0.25 : 0.35;
  const hz = duvarda ? yl : 0.35;
  return { k: { minX: d.pos[0] - hx, maxX: d.pos[0] + hx, minZ: d.pos[2] - hz, maxZ: d.pos[2] + hz }, y0, y1 };
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
  yuvalar: YUVALAR.map((y) => ({ ...y, kutu: yuvaKutu(y), alan: yuvaAlani(y) })),
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
  const pay = duvarPay(y);
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
    const alan = yuvaAlan(k, y);
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
