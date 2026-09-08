/**
 * olcum-kuyruk.ts — D-046'nın SİPARİŞ KUYRUĞU iddialarını ÖLÇER (Faz C3).
 *
 * Çalıştır:  npx tsx tools/olcum-kuyruk.ts > docs/olcum-kuyruk.txt
 *
 * NEDEN: D-046 (2026-09-06) beş kural yazdı — global havuz · bağlayıcı üstlenme · "en acil"
 * önceliği · sipariş boyuna bağlı sabır · türetilen garson sayısı — ve doğrulama satırında
 * *"'hiçbir masa X saniyeden fazla beklemedi' iddiası TESTE yazılır"* dedi. O test hiç yazılmadı;
 * iddia iki turdur ölçülmeden devrediliyor. Bekçi yazmadan önce SAYIYI görmek gerekiyor
 * (D-078/D-080 dersi: ölçülmeden yazılan cümle bir varsayımdır).
 *
 * NASIL: ikinci bir model KURULMAZ. `simulate.ts` analitik bir debi modelidir (kim darboğaz?);
 * kuyruk sorusu ise KONUM ve ZAMAN sorusudur, o yüzden burada oyunun KENDİ `tick()`'i başsız
 * koşturulur (tick-fingerprint.ts deseni: tohumlu Math.random + sahte localStorage) ve her
 * karede NPC durumları örneklenir. Ölçülen şey kodun kendi davranışı; burada hiçbir kural
 * yeniden yazılmaz.
 *
 * OYUNCU SOKAKTA PARK EDİLİR (`streetAt`): ölçülmek istenen şey GARSON HAVUZUNUN kendi başına
 * ne yaptığı. Oyuncu servise karışsaydı ölçüm "oyuncu ne kadar iyi oynadı"yı ölçerdi. Bu aynı
 * zamanda gerçek bir oyun durumudur (idle/AFK).
 *
 * DARBOĞAZ AYRIŞTIRMASI: "müşteri bekledi" tek başına garsonu suçlamaz — bekleme demlemeden
 * (hazır yok), temiz bardaktan (havuz bitti) veya taşımadan (garson yetişmedi) gelebilir.
 * Üçü de ayrı sayılır, yoksa çıkan sayı yanlış kola yazılır.
 */
import { useGame, LAYOUT, servicePlace, streetAt } from '../src/game/store';
import { getNavGrid, REACH_TABLE } from '../src/game/layout';
import { findNavPath } from '../src/game/nav';
import { writeSave, defaultSave, type SaveData } from '../src/game/save';
import {
  economyConfig as C,
  tablePatience,
  waiterSpeedFor,
  waiterTrayCapacityFor,
  type WaiterUpgrades,
} from '../src/config/economy.config';
import { THE_SERVICE, MAX_SERVICES, areaOfTable } from '../src/game/world';
import type { NpcState, Vec3 } from '../src/game/types';

/** simulate.ts'in taşıma modelindeki bardak başına alma+bırakma payı (sn) — aynı sayı, aynı isim. */
const CARRY_HANDLE = 0.5;

// --- Tohumlu rastgelelik (mulberry32) — tick-fingerprint.ts ile aynı, ölçüm tekrarlanabilir olsun.
function seedRandom(seed: number): void {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const g = globalThis as unknown as Record<string, unknown>;
if (!g.localStorage) {
  const mem: Record<string, string> = {};
  g.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
}

const d2 = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const n1 = (n: number) => n.toFixed(1);
const n2 = (n: number) => n.toFixed(2);
const pct = (a: number, b: number) => (b === 0 ? '—' : `%${((100 * a) / b).toFixed(1)}`);

function yuzdelik(xs: number[], p: number): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}
const ort = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

/** Pad zinciri TEK KAYNAKTAN: economy.config'in kendi sırası (elle liste tutulmaz). */
const ZINCIR = C.pads.map((p) => p.id);
const zincireKadar = (son: string): string[] => {
  const i = ZINCIR.indexOf(son);
  if (i < 0) throw new Error(`pad yok: ${son}`);
  return ZINCIR.slice(0, i + 1);
};

interface Senaryo {
  ad: string;
  sonPad: string;
  stationLevel: number;
  tableLevel: number;
  waiterUpgrades: WaiterUpgrades;
  sure: number;
}

/**
 * Zincirin dört durağı. Seviyeler o duraktaki görev hattıyla uyumlu seçildi (q_station1..q_stationMax,
 * q_waiterTray1/2, q_waiterL2, q_tableL2/x2/z1allL4); masa seviyeleri TEK DEĞER verilir ki sabır
 * masadan masaya değişmesin — ölçülen şey coğrafya, sabır dağılımı değil.
 */
const SENARYOLAR: Senaryo[] = [
  { ad: 'G1 · 1 garson · 4 masa', sonPad: 'table4', stationLevel: 1, tableLevel: 0,
    waiterUpgrades: { tray: 0, speed: 0, dishCarry: 0, dishSpeed: 0 }, sure: 900 },
  { ad: 'G2 · 1 garson · 8 masa · bulaşıkçı', sonPad: 'z2table4', stationLevel: 3, tableLevel: 1,
    waiterUpgrades: { tray: 1, speed: 1, dishCarry: 1, dishSpeed: 1 }, sure: 900 },
  { ad: 'G3 · 2 garson · 12 masa · tezgâh L5', sonPad: 'z3table4', stationLevel: 5, tableLevel: 2,
    waiterUpgrades: { tray: 1, speed: 1, dishCarry: 1, dishSpeed: 1 }, sure: 900 },
  { ad: 'G4 · 3 garson · 20 masa · L6 · lavabo', sonPad: 'z3table12', stationLevel: 6, tableLevel: 4,
    waiterUpgrades: { tray: 2, speed: 1, dishCarry: 2, dishSpeed: 1 }, sure: 900 },
];

interface Bekleme {
  masa: number;
  alan: number;
  urun: 'tea' | 'tost';
  sure: number;
  sonuc: 'servis' | 'terk';
  sabir: number;
}

interface Tur {
  /** Yüklenmeden İLK teslimata kadar. Hedefi tek olan tek parça — üstlenme burada okunur. */
  ilkTeslim: number;
  /** Yüklenmeden tepsinin BOŞALMASINA kadar (bacak; tepsi 3 ise 1-3 durak). */
  bacak: number;
  /** Bacakta kaç ayrı teslimat durağı oldu. */
  duraklar: number;
  /** İki yükleme arası (tam tur = bacak + tezgâha dönüş). */
  tur: number;
  /**
   * ÜSTLENME ölçütü: İLK teslim edilen masaya olan mesafenin, yüklemeden o teslimata kadar
   * TOPLAM artışı ÷ başlangıç mesafesi. Hedefini koruyan garsonda ~0; hedef değiştirende büyür.
   * (Engel dolanması küçük bir artış üretir → tam sıfır beklenmez, BÜYÜK olması anlamlıdır.)
   * ÖNEMLİ: yalnız İLK durağa kadar ölçülür — sonraki duraklar meşru olarak yön değiştirir.
   */
  geriGidis: number;
}

interface Sonuc {
  senaryo: Senaryo;
  beklemeler: Bekleme[];
  turlar: Tur[];
  kareBekleyenVar: number;
  kareHazirBos: number;
  kareBardakBitti: number;
  kareGarsonDolu: number;
  kareGarsonToplam: number;
  kareToplam: number;
  masaSayisi: number;
  garsonSayisi: number;
  mesafe: number[];
  /** simulate.ts'in `carryRateOf` modelinin bu duruma verdiği taşıma tavanı (müşteri/sn). */
  idealDebi: number;
  idealTur: number;
  idealMesafe: number;
  wHiz: number;
  wTepsi: number;
}

/** Servis noktasından açık masalara ORTALAMA GERÇEK (BFS) yol — simulate.ts `avgServeDist` ile aynı. */
function ortServisMesafesi(tables: number, areasOpen: number): number {
  const sp = servicePlace(areasOpen);
  const grid = getNavGrid(tables, areasOpen);
  let total = 0;
  let n = 0;
  for (let i = 0; i < tables; i++) {
    const t = LAYOUT.tables[i].table;
    const path = findNavPath(grid, [sp.pickup[0], 0, sp.pickup[2]], t[0], t[2], REACH_TABLE);
    if (!path || path.length === 0) continue;
    let d = Math.hypot(path[0][0] - sp.pickup[0], path[0][1] - sp.pickup[2]);
    for (let k = 1; k < path.length; k++) d += Math.hypot(path[k][0] - path[k - 1][0], path[k][1] - path[k - 1][1]);
    total += d;
    n += 1;
  }
  return n > 0 ? total / n : 0;
}

function kur(sn: Senaryo): void {
  const padsDone = zincireKadar(sn.sonPad);
  const save: SaveData = {
    ...defaultSave(),
    wallet: '0',
    lifetime: '999999',
    padsDone,
    stationLevels: Array.from({ length: MAX_SERVICES }, (_, i) => (i === THE_SERVICE ? sn.stationLevel : 0)),
    tableLevels: LAYOUT.tables.map(() => sn.tableLevel),
    lavaboLevel: padsDone.includes('lavabo') ? 1 : 0,
    waiterUpgrades: { ...sn.waiterUpgrades },
    charUpgrades: { tray: 0, magnet: 0, speed: 0 },
    // Görev hattı BİTMİŞ sayılır: ödül parası, toast ve kamera odağı ölçüme karışmasın.
    questIndex: C.quests.length,
  };
  writeSave(save);
  useGame.getState().init();
}

function enYakinMasa(pos: Vec3, tables: number): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < tables; i++) {
    const d = d2(pos, LAYOUT.tables[i].table);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function kosu(sn: Senaryo, dt: number): Sonuc {
  kur(sn);
  const s0 = useGame.getState();
  const place = servicePlace(s0.areasOpen);
  // Oyuncu sokakta park: servise karışmaz (bkz. dosya başlığı).
  const park = streetAt(s0.areasOpen);
  useGame.setState({ player: [park[0], 0.6, park[2] + 3] as Vec3 });
  const tick = s0.tick;

  const beklemeler: Bekleme[] = [];
  const turlar: Tur[] = [];
  const oncekiDurum = new Map<number, NpcState>();
  const bekleBas = new Map<number, { t: number; masa: number; urun: 'tea' | 'tost'; sabir: number }>();
  // Garson bacağı: yük anı + İLK durağa kadar izlenen konumlar + durak sayacı.
  interface Bacak { t: number; iz: Vec3[]; sonYuk: number; duraklar: number; ilkTeslim: number; geriGidis: number }
  const yuk = new Map<number, Bacak>();
  const oncekiYuk = new Map<number, number>();
  const oncekiYukZamani = new Map<number, number>();

  let t = 0;
  let kareBekleyenVar = 0;
  let kareHazirBos = 0;
  let kareBardakBitti = 0;
  let kareGarsonDolu = 0;
  let kareGarsonToplam = 0;
  let kareToplam = 0;
  const adim = Math.round(sn.sure / dt);

  for (let k = 0; k < adim; k++) {
    tick(dt);
    t += dt;
    kareToplam += 1;
    const s = useGame.getState();

    // --- Müşteri kuyruğu
    let bekleyen = 0;
    const canli = new Set<number>();
    for (const n of s.npcs) {
      canli.add(n.id);
      if (n.state === 'waitingForTea') bekleyen += 1;
      const onc = oncekiDurum.get(n.id);
      if (n.state === 'waitingForTea' && onc !== 'waitingForTea') {
        bekleBas.set(n.id, {
          t,
          masa: n.tableIndex,
          urun: n.product,
          sabir: tablePatience(s.tableLevels[n.tableIndex] ?? 0, n.product),
        });
      } else if (onc === 'waitingForTea' && n.state !== 'waitingForTea') {
        const b = bekleBas.get(n.id);
        if (b) {
          beklemeler.push({
            masa: b.masa,
            alan: areaOfTable(b.masa),
            urun: b.urun,
            sure: t - b.t,
            sonuc: n.state === 'drinking' ? 'servis' : 'terk',
            sabir: b.sabir,
          });
          bekleBas.delete(n.id);
        }
      }
      oncekiDurum.set(n.id, n.state);
    }
    for (const id of [...oncekiDurum.keys()]) {
      if (!canli.has(id)) { oncekiDurum.delete(id); bekleBas.delete(id); }
    }

    if (bekleyen > 0) {
      kareBekleyenVar += 1;
      if (s.ready.tea + s.ready.tost === 0) kareHazirBos += 1;
    }
    if (s.cleanCups === 0) kareBardakBitti += 1;

    // --- Garson turları
    for (let i = 0; i < s.waiters.length; i++) {
      const w = s.waiters[i];
      const dolu = w.tray + w.trayFood;
      const onc = oncekiYuk.get(i) ?? 0;
      kareGarsonToplam += 1;
      if (dolu > 0) kareGarsonDolu += 1;
      if (onc === 0 && dolu > 0) {
        // YÜKLENDİ: bacak başlar.
        const oncekiT = oncekiYukZamani.get(i);
        yuk.set(i, { t, iz: [[...w.pos] as Vec3], sonYuk: oncekiT ?? -1, duraklar: 0, ilkTeslim: NaN, geriGidis: NaN });
        oncekiYukZamani.set(i, t);
      } else {
        const y = yuk.get(i);
        if (y) {
          if (dolu < onc) {
            // TESLİMAT durağı. İlkiyse üstlenme ölçütü burada kapanır (hedefi tek olan tek parça).
            y.duraklar += 1;
            if (y.duraklar === 1) {
              const hedef = LAYOUT.tables[enYakinMasa(w.pos, s.tables)].table;
              let artis = 0;
              for (let j = 1; j < y.iz.length; j++) {
                const dOnce = d2(y.iz[j - 1], hedef);
                const dSonra = d2(y.iz[j], hedef);
                if (dSonra > dOnce) artis += dSonra - dOnce;
              }
              const d0 = d2(y.iz[0], hedef);
              y.ilkTeslim = t - y.t;
              y.geriGidis = d0 > 0.5 ? artis / d0 : 0;
            }
          } else if (dolu > 0 && y.duraklar === 0) {
            y.iz.push([...w.pos] as Vec3); // iz YALNIZ ilk durağa kadar tutulur
          }
          if (dolu === 0 && onc > 0) {
            turlar.push({
              ilkTeslim: y.ilkTeslim,
              bacak: t - y.t,
              duraklar: y.duraklar,
              tur: y.sonYuk >= 0 ? y.t - y.sonYuk : NaN,
              geriGidis: y.geriGidis,
            });
            yuk.delete(i);
          }
        }
      }
      oncekiYuk.set(i, dolu);
    }
  }

  const s = useGame.getState();
  const mesafe = Array.from({ length: s.tables }, (_, i) => d2(LAYOUT.tables[i].table, place.pickup));
  // İDEAL: simulate.ts'in taşıma modeli — tepsi dolusu götür, boş dön, hedef hiç değişmez.
  const wHiz = waiterSpeedFor(sn.waiterUpgrades.speed);
  const wTepsi = waiterTrayCapacityFor(sn.waiterUpgrades.tray);
  const idealMesafe = ortServisMesafesi(s.tables, s.areasOpen);
  const idealTur = (2 * idealMesafe) / wHiz + wTepsi * CARRY_HANDLE;
  return {
    senaryo: sn,
    beklemeler,
    turlar,
    idealDebi: (s.waiters.length * wTepsi) / idealTur,
    idealTur,
    idealMesafe,
    wHiz,
    wTepsi,
    kareBekleyenVar,
    kareHazirBos,
    kareBardakBitti,
    kareGarsonDolu,
    kareGarsonToplam,
    kareToplam,
    masaSayisi: s.tables,
    garsonSayisi: s.waiters.length,
    mesafe,
  };
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return NaN;
  const mx = ort(x);
  const my = ort(y);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    sxy += a * b;
    sxx += a * a;
    syy += b * b;
  }
  return sxx === 0 || syy === 0 ? NaN : sxy / Math.sqrt(sxx * syy);
}

function rapor(r: Sonuc): void {
  const sn = r.senaryo;
  const servis = r.beklemeler.filter((b) => b.sonuc === 'servis');
  const terk = r.beklemeler.filter((b) => b.sonuc === 'terk');
  const sureler = servis.map((b) => b.sure);
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${sn.ad}`);
  console.log(`${r.masaSayisi} masa · ${r.garsonSayisi} garson · ocak L${sn.stationLevel} · masa L${sn.tableLevel} · ${sn.sure} sn`);
  console.log('='.repeat(80));
  console.log(`Oturan müşteri        : ${r.beklemeler.length}`);
  console.log(`  servis edildi       : ${servis.length}  (${pct(servis.length, r.beklemeler.length)})`);
  console.log(`  SABRI BİTTİ (terk)  : ${terk.length}  (${pct(terk.length, r.beklemeler.length)})`);
  console.log(
    `Bekleme (servis edilenler, sn): ort ${n1(ort(sureler))} · medyan ${n1(yuzdelik(sureler, 0.5))}` +
    ` · p95 ${n1(yuzdelik(sureler, 0.95))} · EN UZUN ${n1(Math.max(...sureler, 0))}`,
  );
  const sabirlar = [...new Set(r.beklemeler.map((b) => Math.round(b.sabir * 10) / 10))].sort((a, b) => a - b);
  console.log(`Sabır tavanı (tablePatience)  : ${sabirlar.map(n1).join(' / ')} sn`);

  console.log(`\nDARBOĞAZ AYRIŞTIRMASI (bekleyen varken hangi kol boştu):`);
  console.log(`  bekleyen müşteri olan kare    : ${r.kareBekleyenVar} / ${r.kareToplam}  (${pct(r.kareBekleyenVar, r.kareToplam)})`);
  console.log(`  ...ve tezgâhta hazır ürün 0   : ${r.kareHazirBos}  (${pct(r.kareHazirBos, r.kareBekleyenVar)} → DEMLEME darboğazı)`);
  console.log(`  temiz bardak 0 olan kare      : ${r.kareBardakBitti}  (${pct(r.kareBardakBitti, r.kareToplam)} → BARDAK darboğazı)`);
  console.log(`  garson tepsisi dolu geçen kare: ${pct(r.kareGarsonDolu, r.kareGarsonToplam)} (taşıma meşguliyeti)`);

  const ilk = r.turlar.map((x) => x.ilkTeslim).filter((x) => !Number.isNaN(x));
  const bacak = r.turlar.map((x) => x.bacak);
  const tur = r.turlar.map((x) => x.tur).filter((x) => !Number.isNaN(x));
  const geri = r.turlar.map((x) => x.geriGidis).filter((x) => !Number.isNaN(x));
  const duraklar = r.turlar.map((x) => x.duraklar);
  console.log(`\nDEBİ:`);
  console.log(`  servis edilen müşteri / dk     : ${n2((60 * servis.length) / sn.sure)}`);
  console.log(`  garson BAŞINA servis / dk      : ${n2((60 * servis.length) / sn.sure / Math.max(1, r.garsonSayisi))}`);
  // MODEL = simulate.ts'in `carryRateOf` beklentisi. TAVAN DEĞİL: ORTALAMA masa mesafesini
  // kullanır, yani yalnız yakın masalara servis eden bir kural bu sayıyı AŞABİLİR.
  console.log(`  simulate.ts modelinin beklediği: ${n2(60 * r.idealDebi)} müşteri/dk · gerçekleşen ${pct((60 * servis.length) / sn.sure, 60 * r.idealDebi)}`);
  console.log(`  model tam tur ${n1(r.idealTur)} sn (2×${n1(r.idealMesafe)} br BFS ÷ ${n1(r.wHiz)} br/sn + ${r.wTepsi}×${CARRY_HANDLE} sn)`);

  console.log(`\nGARSON BACAĞI (${r.turlar.length} bacak; bacak = yükleme → tepsi boşalması):`);
  console.log(`  yükleme → İLK teslimat (sn): ort ${n1(ort(ilk))} · p95 ${n1(yuzdelik(ilk, 0.95))} · en uzun ${n1(Math.max(...ilk, 0))}`);
  console.log(`  bacak boyu (sn)            : ort ${n1(ort(bacak))} · p95 ${n1(yuzdelik(bacak, 0.95))} · en uzun ${n1(Math.max(...bacak, 0))}`);
  console.log(`  tam tur (yükleme→yükleme)  : ort ${n1(ort(tur))} · p95 ${n1(yuzdelik(tur, 0.95))} · en uzun ${n1(Math.max(...tur, 0))}  [model ${n1(r.idealTur)}]`);
  console.log(`  bacak başına durak         : ort ${n2(ort(duraklar))} (tepsi kapasitesi ${r.wTepsi})`);
  console.log(`  ÜSTLENME — ilk durağa dek hedeften uzaklaşma: ort ${n2(ort(geri))} · p95 ${n2(yuzdelik(geri, 0.95))} · en kötü ${n2(Math.max(...geri, 0))}`);

  console.log(`\nSTARVATION — masa başına (mesafe = tezgâhtan kuş uçuşu):`);
  console.log(`  masa  alan  mesafe  oturan  terk   terk%   ort.bekleme  en uzun`);
  const satirlar: { i: number; oran: number; ort: number }[] = [];
  for (let i = 0; i < r.masaSayisi; i++) {
    const hepsi = r.beklemeler.filter((b) => b.masa === i);
    if (!hepsi.length) continue;
    const tt = hepsi.filter((b) => b.sonuc === 'terk');
    const ss = hepsi.filter((b) => b.sonuc === 'servis').map((b) => b.sure);
    satirlar.push({ i, oran: tt.length / hepsi.length, ort: ort(ss) });
    console.log(
      `  ${String(i).padStart(4)}  ${String(hepsi[0].alan).padStart(4)}  ${n1(r.mesafe[i]).padStart(6)}` +
      `  ${String(hepsi.length).padStart(6)}  ${String(tt.length).padStart(4)}  ${pct(tt.length, hepsi.length).padStart(6)}` +
      `  ${n1(ort(ss)).padStart(11)}  ${n1(Math.max(...ss, 0)).padStart(7)}`,
    );
  }
  const oranlar = satirlar.map((x) => x.oran);
  console.log(`  → terk oranı yayılımı: en düşük ${pct(Math.min(...oranlar), 1)} · en yüksek ${pct(Math.max(...oranlar), 1)}`);
  // Starvation coğrafyaya bağlıysa mesafe ile pozitif ilişki çıkar.
  const xs = satirlar.map((x) => r.mesafe[x.i]);
  console.log(`  → mesafe ↔ terk oranı korelasyonu   : ${n2(pearson(xs, oranlar))}`);
  console.log(`  → mesafe ↔ ort. bekleme korelasyonu : ${n2(pearson(xs, satirlar.map((x) => x.ort)))}`);
}

// ---------------------------------------------------------------------------
const DT = 0.1;
console.log("OLCUM — SİPARİŞ KUYRUĞU / ÜSTLENME / STARVATION (Faz C3, D-046 doğrulaması)");
console.log(`Oyunun kendi tick()'i · dt = ${DT} sn · oyuncu sokakta park (garson havuzu yalnız)`);
console.log(`Tohum 20260908 · sabır tabanı ${C.npc.patience} sn + masa L başına ${C.tables.patiencePerLevel} sn`);

for (const sn of SENARYOLAR) {
  seedRandom(20260908);
  rapor(kosu(sn, DT));
}

// dt DUYARLILIĞI: 0,1 sn'lik adım sonucu belirliyor mu? Tek senaryo daha ince adımla tekrarlanır.
// (KUYRUK_HIZLI=1 ile atlanır — karşılaştırmalı koşularda dört senaryo yeter.)
if (!process.env.KUYRUK_HIZLI) {
  console.log(`\n\n${'#'.repeat(80)}`);
  console.log('# dt DUYARLILIK KONTROLÜ — G3 aynı senaryo, dt = 1/30');
  console.log('#'.repeat(80));
  seedRandom(20260908);
  rapor(kosu(SENARYOLAR[2], 1 / 30));
}
