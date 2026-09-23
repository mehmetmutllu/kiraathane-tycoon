/**
 * olcum-tezgah-t8b.ts — T8b: TEZGÂH ARKASI. K10 (sol duvar payı) + K9 (bulaşık kuyruğu).
 *
 * Koşu:  npx tsx tools/olcum-tezgah-t8b.ts                                   (KISA)
 *        OLCUM=tam npx tsx tools/olcum-tezgah-t8b.ts > docs/olcum-tezgah-t8b.txt (TAM)
 *
 * SORU (kullanıcı, G-68): *"tezgâh ve bulaşığın arkasında olması gereken adam önünde duruyor …
 * tezgah olduğu yerde kalsın adam da arkasına geçsin … belki tezgah duvardan biraz uzaklaşır ama
 * farklı bir şey olmamalı, duvardan çıkmasın"*. Bugün gövde ile duvar arası 0,30 br, aktör gövdesi
 * 0,56 br: adam oraya SIĞMIYOR. Kol serbest değil — **en küçük yeterli açıklık** aranır.
 * (G-70'in tam kolu, K9): *"birkaç tane bıraktıktan sonra kirlenip, o adam oraya geldiğinde
 * temizlenmesi gerek"* — bırakılan kirli leğende birikir ve süreyle yıkanır.
 *
 * İKİ BÖLÜM
 *   §A GEOMETRİ (statik, tick yok): her pay için personel ızgarasında arka şerit var mı, oyuncu
 *      arkaya girebiliyor mu, ön koridor kaç br kaldı, noktalar (çay alma · yükseltme · pad'ler ·
 *      garson postaları) bir gövdeye çarpıyor mu, arkadaki postadan leğene/masaya rota.
 *   §B OYUN (oyunun kendi `tick`'i, oyuncu parkta — `olcum-bardak-t8.ts` kurulumu): kolun servis/dk,
 *      temiz bardak, kuyruk boyu etkisi. İki dikiş de varsayılanda kapalı: `solDuvarKoluAyarla`
 *      (layout) · `bulasikKoluAyarla` (tick). Tick parmak izi dikişlerle birebir aynı (doğrulandı).
 *
 * DAMGALAR: korunum (temiz + hazır + taşınan + müşteride + masada kirli + LEĞEN KUYRUĞU = havuz) ·
 * varyant etkili (parmak izi tabandan farklı) · rejim · dikişler koşu sonunda kapalı.
 */
import { KISA, kipBandi, damga, damgaOzeti, seedRandom, korunumDamgasi, varyantDamgasi, izOlustur } from './olcum-lib';
import { useGame, parkSpot, stationSoftMaxLevel, totalCupPool } from '../src/game/store';
import { D } from '../src/game/decimal';
import { deriveWorld } from '../src/game/world';
import { dirtyTables } from '../src/game/rules';
import { economyConfig as C } from '../src/config/economy.config';
import {
  FLOOR_HALF, LAYOUT, SOL_DUVAR_PAYI, servicePlace, solDuvarKoluAyarla, solDuvarKoluOku, activeSolids,
  getNavGrid, getPlayerNavGrid, reachWash, waiterHomeAt, REACH_TABLE, tableHalfFor, type Solid,
} from '../src/game/layout';
import { findNavPath, type NavGrid } from '../src/game/nav';
import { bulasikKoluAyarla, lavaboKuyruguOku } from '../src/game/tick';
import { ACTOR_RADIUS, PLAYER_RADIUS } from '../src/config/actor';

const f2 = (x: number) => x.toFixed(2);
const f1 = (x: number) => x.toFixed(1);
const yuzde = (x: number) => `%${(x * 100).toFixed(1)}`;
const PAYLAR = [0.3, 0.6, 0.75, 0.9, 1.05];

kipBandi();
console.log('=== T8b — TEZGÂH ARKASI: K10 sol duvar payı + K9 bulaşık kuyruğu ===');
console.log(`aktör yarıçapı ${ACTOR_RADIUS} (gövde ${f2(ACTOR_RADIUS * 2)}) · oyuncu yarıçapı ${PLAYER_RADIUS} (gövde ${f2(PLAYER_RADIUS * 2)}) · nav hücresi 0,30`);
console.log('');

/* ── §A GEOMETRİ ─────────────────────────────────────────────────────────────────────────── */

interface GeoDunya { ad: string; masa: number; alan: number }
const GEO: GeoDunya[] = [
  { ad: 'G4 Salon 1 dolu (4 masa · 1 alan)', masa: 4, alan: 1 },
  { ad: 'G8 Salon 2 dolu (8 masa · 2 alan)', masa: 8, alan: 2 },
];

/** Izgaranın (x,z) hücresi kapalı mı. */
const kapali = (g: NavGrid, x: number, z: number): boolean => {
  const c = Math.floor((x - g.minX) / g.cell);
  const r = Math.floor((z - g.minZ) / g.cell);
  if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return true;
  return g.blocked[r * g.cols + c] === 1;
};

/** Arka şerit: duvar ile gövdenin arka yüzü arasında, gövdenin z-boyu boyunca TAM açık sütun sayısı. */
function arkaSerit(g: NavGrid, arkaYuz: number, z0: number, z1: number): { sutun: number; hucre: number } {
  let sutun = 0;
  let hucre = 0;
  for (let c = 0; c < g.cols; c++) {
    const x = g.minX + (c + 0.5) * g.cell;
    if (x >= arkaYuz || x <= -FLOOR_HALF) continue;
    let tam = true;
    for (let r = 0; r < g.rows; r++) {
      const z = g.minZ + (r + 0.5) * g.cell;
      if (z < z0 || z > z1) continue;
      if (g.blocked[r * g.cols + c] === 1) tam = false;
      else hucre++;
    }
    if (tam) sutun++;
  }
  return { sutun, hucre };
}

const yolBoyu = (y: [number, number][] | null, bas: readonly [number, number, number]): number => {
  if (!y) return Infinity;
  let L = 0;
  let px = bas[0];
  let pz = bas[2];
  for (const [x, z] of y) {
    L += Math.hypot(x - px, z - pz);
    px = x;
    pz = z;
  }
  return L;
};

/** Noktanın en yakın gövde kenarına uzaklığı (içindeyse negatif). */
function govdeyeUzaklik(x: number, z: number, solids: Solid[]): number {
  let en = Infinity;
  for (const s of solids) {
    const dx = Math.abs(x - s.c[0]) - s.h[0];
    const dz = Math.abs(z - s.c[2]) - s.h[1];
    const d = dx < 0 && dz < 0 ? Math.max(dx, dz) : Math.hypot(Math.max(dx, 0), Math.max(dz, 0));
    en = Math.min(en, d);
  }
  return en;
}

console.log('§A GEOMETRİ — personel ızgarası (şişirme 0,28) · oyuncu ızgarası (şişirme 0,47, alan kelepçesi)');
for (const w of GEO) {
  console.log(`--- ${w.ad} ---`);
  const bas =
    'pay  | aktör yan payı | arka şerit (sütun/hücre) | oyuncu arkada | ön koridor | çay alma↔gövde | yükseltme↔gövde | bulaşıkçı pad↔gövde | posta1↔gövde | arka→leğen | arka→masa1';
  console.log(bas);
  console.log('-'.repeat(bas.length));
  for (const pay of PAYLAR) {
    solDuvarKoluAyarla(pay === SOL_DUVAR_PAYI ? null : { pay, arkada: true });
    const sp = servicePlace(w.alan);
    const arkaYuz = sp.station[0] - sp.half[0];
    const onYuz = sp.station[0] + sp.half[0];
    const z0 = sp.station[2] - sp.half[1];
    const z1 = sp.dish[2] + sp.dishHalf[1];
    const g = getNavGrid(w.masa, w.alan);
    const pg = getPlayerNavGrid(w.masa, w.alan);
    const serit = arkaSerit(g, arkaYuz, z0, z1);
    const oyuncu = arkaSerit(pg, arkaYuz, z0, z1).hucre;
    const govdeler = activeSolids(w.masa, w.alan);
    const servisGovdeleri: Solid[] = [
      { c: sp.station, h: sp.half },
      { c: sp.dish, h: sp.dishHalf },
    ];
    const digerleri = govdeler.filter((s) => !servisGovdeleri.some((q) => q.c === s.c));
    // Ön koridor: gövdenin ön yüzünden doğuya, gövdenin z-boyuyla örtüşen en yakın katının batı yüzü.
    let koridor = Infinity;
    for (const s of digerleri) {
      if (s.c[2] + s.h[1] < z0 - 0.5 || s.c[2] - s.h[1] > z1 + 0.5) continue;
      const bati = s.c[0] - s.h[0];
      if (bati > onYuz) koridor = Math.min(koridor, bati - onYuz);
    }
    const aktorDuvar = (pay - ACTOR_RADIUS * 2) / 2;
    const ark = sp.dishwasherHome;
    const leğen = findNavPath(g, ark, sp.dish[0], sp.dish[2], reachWash(w.alan));
    const masa1 = LAYOUT.tables[0].table;
    const masaYol = findNavPath(g, ark, masa1[0], masa1[2], REACH_TABLE);
    void tableHalfFor;
    console.log(
      `${f2(pay)} | ${f2(aktorDuvar).padStart(13)} | ${`${serit.sutun} / ${serit.hucre}`.padStart(24)} | ${String(oyuncu).padStart(13)} | ${f2(koridor).padStart(10)} | ${f2(govdeyeUzaklik(sp.pickup[0], sp.pickup[2], servisGovdeleri)).padStart(14)} | ${f2(govdeyeUzaklik(sp.upgradeSpot[0], sp.upgradeSpot[2], govdeler)).padStart(15)} | ${f2(govdeyeUzaklik(-13.4, sp.dish[2], servisGovdeleri)).padStart(19)} | ${f2(govdeyeUzaklik(waiterHomeAt(sp, 0)[0], waiterHomeAt(sp, 0)[2], govdeler)).padStart(12)} | ${Number.isFinite(yolBoyu(leğen, ark)) ? f1(yolBoyu(leğen, ark)) : 'YOK'}`.padEnd(0) +
        ` | ${Number.isFinite(yolBoyu(masaYol, ark)) ? f1(yolBoyu(masaYol, ark)) : 'YOK'}`,
    );
  }
  console.log('');
}
solDuvarKoluAyarla(null);
console.log('  aktör yan payı: arka şeridin ORTASINDA duran aktörün iki yana kalan payı (negatif = gövdeye/duvara girer).');
console.log('  arka şerit: personel ızgarasında gövde boyunca TAM açık sütun (0 = arkadan yol yok) / açık hücre.');
console.log('  oyuncu arkada: oyuncu ızgarasında arka şeritteki açık hücre (0 = oyuncu arkaya giremez).');
console.log('  ön koridor: gövdenin ön yüzü ile z-boyunda örtüşen en yakın katı (masa/sandalye) arası; oyuncu geçişi ≥ 0,94.');
console.log('  arka→leğen / arka→masa1: bulaşıkçının ARKA postasından rota boyu (br; YOK = BFS ulaşamadı).');
console.log('');

/* ── §B OYUN ─────────────────────────────────────────────────────────────────────────────── */

const DT = 1 / 60;
const ISINMA_SN = KISA ? 45 : 180;
const KAYIT_SN = KISA ? 90 : 420;
// Tohumlar arası yayılım ±1 servis/dk (tanı koşusu: 300 sn · 3 tohum) — tam koşu 4 tohum ve yayılımı basar.
const TOHUMLAR = KISA ? [20260923] : [20260923, 20260924, 20260925, 20260926];

interface Dunya { ad: string; padSon: string; masaSv: number; ocak: number | 'tavan'; solDuvar: boolean }
const W4: Dunya = { ad: 'W4 Salon 1 dolu (4 masa · 2 garson · bulaşıkçı YOK · ocak L3)', padSon: 'waiter2', masaSv: 2, ocak: 3, solDuvar: true };
const W8: Dunya = { ad: 'W8 Salon 2 dolu (8 masa · masalar L2 · ocak L3 · bulaşıkçı yeni)', padSon: 'z2table4', masaSv: 2, ocak: 3, solDuvar: true };
const W20: Dunya = { ad: 'W20 geç oyun (20 masa · masalar L4 · ocak tavan · arka bant)', padSon: 'z3table12', masaSv: 4, ocak: 'tavan', solDuvar: false };

interface Kol { kod: string; ad: string; pay: number | null; yikamaSn: number | null; topluSn?: number; yalnizSolDuvar?: boolean }

function kur(w: Dunya, tohum: number): number {
  seedRandom(tohum);
  useGame.getState().hardReset();
  const son = C.pads.findIndex((p) => p.id === w.padSon);
  const qSon = C.quests.findIndex((q) => (q.target as { id?: string }).id === w.padSon);
  useGame.setState({
    padsDone: C.pads.slice(0, son + 1).map((p) => p.id),
    wallet: D(1e12),
    diamonds: D(1e6),
    questIndex: w.ocak === 'tavan' ? C.quests.length : qSon + 1,
  } as never);
  const s0 = useGame.getState();
  const ocak = w.ocak === 'tavan' ? stationSoftMaxLevel() : w.ocak;
  const lv = s0.stationLevels.map(() => ocak);
  const havuz = Math.round(totalCupPool(deriveWorld(s0.padsDone).areasOpen, lv));
  useGame.setState({ tableLevels: s0.tableLevels.map(() => w.masaSv), stationLevels: lv, cleanCups: havuz } as never);
  const s1 = useGame.getState();
  // Personel YENİ yerleşimin postasından başlasın (store yalnız yüklemede kurar).
  const sp = servicePlace(deriveWorld(s1.padsDone).areasOpen);
  useGame.setState({
    player: parkSpot(s1.areasOpen, s1.tables),
    dishwasher: s1.dishwasher ? { ...s1.dishwasher, pos: [...sp.dishwasherHome] } : s1.dishwasher,
  } as never);
  return havuz;
}

interface Olcum {
  servisDk: number;
  temizOrt: number;
  temizSifirPay: number;
  kirliOrt: number;
  kirliMasaOrt: number;
  kuyrukOrt: number;
  kuyrukMaks: number;
  korunum: number;
  rejim: boolean;
  iz: string;
}

function kos(w: Dunya, k: Kol, tohum: number): Olcum {
  solDuvarKoluAyarla(k.pay == null ? null : { pay: k.pay, arkada: true });
  bulasikKoluAyarla(k.topluSn ? { topluSn: k.topluSn } : k.yikamaSn == null ? null : { yikamaSn: k.yikamaSn });
  const havuz = kur(w, tohum);
  const tick = useGame.getState().tick;
  for (let i = 0; i < Math.round(ISINMA_SN / DT); i++) tick(DT);
  const bas = useGame.getState();
  const masa = bas.tables;
  const ocak = bas.stationLevels[0];
  const servisBas = (bas.stats?.waiterServed ?? 0) + (bas.stats?.teasServed ?? 0);
  const iz = izOlustur();
  let korunum = 0, temizTop = 0, sifir = 0, kirliTop = 0, kirliMasaTop = 0, kuyrukTop = 0, kuyrukMaks = 0, n = 0, rejim = true;
  for (let i = 0; i < Math.round(KAYIT_SN / DT); i++) {
    tick(DT);
    const s = useGame.getState();
    if (s.tables !== masa || s.stationLevels[0] !== ocak) rejim = false;
    const musteride = s.npcs.filter((x) => x.state === 'drinking').length;
    const garsonda = s.waiters.reduce((a, x) => a + x.tray + x.trayFood + (x.dirtyCarry ?? 0) + (x.dirtyCarryFood ?? 0), 0);
    const dw = s.dishwasher ? s.dishwasher.tray + s.dishwasher.trayFood : 0;
    const elde = s.tray + s.trayFood + s.carriedDirty + s.carriedDirtyFood;
    const kuyruk = lavaboKuyruguOku();
    const toplam = s.cleanCups + s.ready.tea + s.ready.tost + garsonda + elde + musteride + s.dishes.length + dw + kuyruk;
    korunum = Math.max(korunum, Math.abs(toplam - havuz));
    temizTop += s.cleanCups;
    if (s.cleanCups === 0) sifir++;
    kirliTop += s.dishes.length;
    kirliMasaTop += dirtyTables(s.dishes, s.tableLevels).size;
    kuyrukTop += kuyruk;
    kuyrukMaks = Math.max(kuyrukMaks, kuyruk);
    n++;
    if (i % 60 === 0) iz.ekle(s.cleanCups, s.dishes.length, s.npcs.length);
  }
  const s = useGame.getState();
  const dk = KAYIT_SN / 60;
  return {
    servisDk: ((s.stats?.waiterServed ?? 0) + (s.stats?.teasServed ?? 0) - servisBas) / dk,
    temizOrt: temizTop / n,
    temizSifirPay: sifir / n,
    kirliOrt: kirliTop / n,
    kirliMasaOrt: kirliMasaTop / n,
    kuyrukOrt: kuyrukTop / n,
    kuyrukMaks,
    korunum,
    rejim,
    iz: iz.deger,
  };
}

const TUM_KOLLAR: Kol[] = [
  { kod: 'T0', ad: 'bugün: pay 0,30 · personel önde · yıkama anlık', pay: null, yikamaSn: null },
  { kod: 'P60', ad: 'pay 0,60 · personel ARKADA', pay: 0.6, yikamaSn: null, yalnizSolDuvar: true },
  { kod: 'P75', ad: 'pay 0,75 · personel ARKADA', pay: 0.75, yikamaSn: null, yalnizSolDuvar: true },
  { kod: 'P90', ad: 'pay 0,90 · personel ARKADA', pay: 0.9, yikamaSn: null, yalnizSolDuvar: true },
  { kod: 'P105', ad: 'pay 1,05 · personel ARKADA', pay: 1.05, yikamaSn: null, yalnizSolDuvar: true },
  { kod: 'Y05', ad: 'leğen kuyruğu · 0,5 sn/kap', pay: null, yikamaSn: 0.5 },
  { kod: 'Y10', ad: 'leğen kuyruğu · 1,0 sn/kap', pay: null, yikamaSn: 1.0 },
  { kod: 'Y20', ad: 'leğen kuyruğu · 2,0 sn/kap', pay: null, yikamaSn: 2.0 },
  { kod: 'YT10', ad: 'leğen birikir · her 10 sn TOPTAN yıkanır', pay: null, yikamaSn: null, topluSn: 10 },
  { kod: 'YT20', ad: 'leğen birikir · her 20 sn TOPTAN yıkanır', pay: null, yikamaSn: null, topluSn: 20 },
];
// KOL_SEC=T0,YT10 → yalnız bu kollar (sonradan eklenen kolun ayrı tam koşusu için; taban T0 hep başta).
const SECIM = process.env.KOL_SEC?.split(',');
const KOLLAR = (KISA ? TUM_KOLLAR.filter((k) => ['T0', 'P75', 'Y10', 'Y20'].includes(k.kod)) : TUM_KOLLAR)
  .filter((k) => !SECIM || SECIM.includes(k.kod));

console.log('§B OYUN — oyunun kendi tick\'i, oyuncu parkta (AFK alt sınırı)');
console.log(`Isınma ${ISINMA_SN} sn · kayıt ${KAYIT_SN} sn · tohum ${TOHUMLAR.length} · DT 1/60`);
console.log('');
for (const w of KISA ? [W8] : [W4, W8, W20]) {
  console.log(`--- ${w.ad} ---`);
  const bas = 'kol  | servis/dk (± yarı-aralık) | temiz ort | temiz=0 payı | masada kirli ort | kirli masa ort | leğen kuyruğu ort / maks';
  console.log(bas);
  console.log('-'.repeat(bas.length));
  let tabanIz = '';
  for (const k of KOLLAR) {
    if (k.yalnizSolDuvar && !w.solDuvar) continue;
    const r = TOHUMLAR.map((t) => kos(w, k, t));
    const o = (f: (x: Olcum) => number) => r.reduce((a, x) => a + f(x), 0) / r.length;
    const iz = r.map((x) => x.iz).join('');
    const et = `${w.ad.slice(0, 3)} ${k.kod}`;
    if (k.kod === 'T0') tabanIz = iz; else varyantDamgasi(et, tabanIz, iz);
    korunumDamgasi(et, Math.max(...r.map((x) => x.korunum)));
    damga(`rejim ${et}`, r.every((x) => x.rejim), 'masa/ocak koşu içinde değişti');
    console.log(
      k.kod.padEnd(4) + ' | ' + `${f1(o((x) => x.servisDk))} ± ${f1((Math.max(...r.map((x) => x.servisDk)) - Math.min(...r.map((x) => x.servisDk))) / 2)}`.padStart(23) + ' | ' + f1(o((x) => x.temizOrt)).padStart(9) +
      ' | ' + yuzde(o((x) => x.temizSifirPay)).padStart(12) + ' | ' + f1(o((x) => x.kirliOrt)).padStart(16) +
      ' | ' + f1(o((x) => x.kirliMasaOrt)).padStart(14) +
      ' | ' + `${f1(o((x) => x.kuyrukOrt))} / ${Math.max(...r.map((x) => x.kuyrukMaks))}`.padStart(24),
    );
  }
  console.log('');
}
solDuvarKoluAyarla(null);
bulasikKoluAyarla(null);
damga('dikişler kapalı', solDuvarKoluOku() === null && lavaboKuyruguOku() === 0, 'ölçüm kolu açık kaldı');
console.log('KOLLAR:');
for (const k of KOLLAR) console.log(`  ${k.kod.padEnd(4)} ${k.ad}`);

damgaOzeti();
