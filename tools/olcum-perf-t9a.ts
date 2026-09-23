/**
 * olcum-perf-t9a.ts — T9a: oyun adımı (tick) ~5 ms, NEREYE gidiyor; N2-kesin ne kazandırır?
 *
 * T6b Bulgu C: kısıksız karede tick ~5 ms (~58 NPC) — karenin üçte biri; telefonda darboğaz çizim
 * değil simülasyon. T5 Bulgu 6: T5'ten sonra bile nav karenin %28-31'i. Bu araç iki soruyu ölçer:
 *
 *   A  BÖLÜŞÜM — tick'in toplamı, sistem başına ms, içinde `findNavPath` (çağrı + ms).
 *      "Toplamı ölçmek kolun yerini göstermez" (D-138): kol, bölüşümden seçilir.
 *   B  N2-KESİN — `findNavPath` çağrı önbelleği (anahtar: ızgara + başlangıç HÜCRESİ + hedef +
 *      reach). İddia: çıktı BİREBİR aynı. Damga bunu parmak iziyle sınar (T5'in N2'si yolu
 *      bayatlatıyordu; bu kol bayatlatamaz — sınanmadan iddia edilmez).
 *
 * Dünya: T6 aracınınki (bütün pad'ler açık, masalar L4, ocak tavanda, görev hattı bitmiş).
 * Kollar ABBA sırasıyla koşar (JIT ısınması bir kola yazılmasın); her kol kendi tohumuyla sıfırdan.
 *
 * Koşu:  OLCUM=tam npx tsx tools/olcum-perf-t9a.ts > docs/olcum-perf-t9a.txt
 */
import { KIP, KISA, kipBandi, damga, damgaOzeti, seedRandom, izOlustur, yuzdelik, ort } from './olcum-lib';
import { useGame, parkSpot, stationSoftMaxLevel, totalCupPool } from '../src/game/store';
import { navOnbellekAyarla } from '../src/game/nav';
import { olcumAc, olcumKapat, olcumOku } from '../src/game/olcum';
import { D } from '../src/game/decimal';
import { economyConfig } from '../src/config/economy.config';

const DT = 1 / 60;
const ISINMA_SN = KISA ? 60 : 240;
const KAYIT_SN = KISA ? 60 : 300;
const TOHUM = 20260923;

const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);

function gecOyunKur(): void {
  seedRandom(TOHUM);
  useGame.getState().hardReset();
  useGame.setState({
    padsDone: economyConfig.pads.map((p) => p.id),
    wallet: D(1e12),
    diamonds: D(1e6),
    questIndex: economyConfig.quests.length,
  } as never);
  const s0 = useGame.getState();
  useGame.setState({
    tableLevels: s0.tableLevels.map(() => 4),
    stationLevels: s0.stationLevels.map(() => stationSoftMaxLevel()),
    cleanCups: totalCupPool(s0.areasOpen, s0.stationLevels.map(() => stationSoftMaxLevel())),
  } as never);
  const s1 = useGame.getState();
  useGame.setState({ player: parkSpot(s1.areasOpen, s1.tables) } as never);
}

interface Kosu {
  kol: string;
  tickMs: number[];
  sistem: Record<string, { n: number; ms: number }>;
  npcOrt: number;
  /** Garsonun kayıt boyunca masaya bıraktığı ürün — oyun döndü mü + kolun servise etkisi. */
  servis: number;
  iz: string;
}

function kos(kol: 'taban' | 'N2-kesin'): Kosu {
  navOnbellekAyarla(kol === 'N2-kesin');
  gecOyunKur();
  const tick = useGame.getState().tick;
  for (let i = 0; i < Math.round(ISINMA_SN / DT); i++) tick(DT);

  const h = izOlustur();
  const tickMs: number[] = [];
  const npc: number[] = [];
  const k0 = useGame.getState().stats.waiterServed;
  olcumAc();
  const n = Math.round(KAYIT_SN / DT);
  for (let i = 0; i < n; i++) {
    const t = performance.now();
    tick(DT);
    tickMs.push(performance.now() - t);
    if (i % 60 === 0) {
      const s = useGame.getState();
      npc.push(s.npcs.length);
      h.ekle(s.stats.waiterServed, s.npcs.length, s.dishes.length);
      for (const p of s.npcs) h.ekle(p.pos[0], p.pos[2]);
      for (const w of s.waiters) h.ekle(w.pos[0], w.pos[2]);
    }
  }
  const sistem = olcumOku();
  olcumKapat();
  navOnbellekAyarla(true); // üretim varsayılanı (D-145)
  return {
    kol,
    tickMs,
    sistem,
    npcOrt: ort(npc),
    servis: useGame.getState().stats.waiterServed - k0,
    iz: h.deger,
  };
}

kipBandi();
console.log(`=== T9a — tick bölüşümü + N2-kesin (${KIP} koşu) ===`);
console.log(`dünya: geç oyun (bütün pad'ler, masa L4, ocak tavanda) · ısınma ${ISINMA_SN} sn · kayıt ${KAYIT_SN} sn · dt 1/60 · tohum ${TOHUM}`);
console.log('sıra ABBA: taban · N2-kesin · N2-kesin · taban (JIT ısınması bir kola yazılmasın)');
console.log('');

const kosular = [kos('taban'), kos('N2-kesin'), kos('N2-kesin'), kos('taban')];
const kolOf = (ad: string) => kosular.filter((k) => k.kol === ad);

// Damga 1: bot/oyun gerçekten döndü mü (NPC var, kazanç var)
for (const k of kosular) damga(`oyun döndü (${k.kol})`, k.npcOrt > 10 && k.servis > 0, `NPC ${k.npcOrt.toFixed(1)} · garson servisi ${k.servis}`);
// Damga 2: aynı kolun iki koşusu aynı dünyayı oynadı mı (tohum tuttu mu)
damga('tohum tuttu (taban×2)', kolOf('taban')[0].iz === kolOf('taban')[1].iz);
damga('tohum tuttu (N2×2)', kolOf('N2-kesin')[0].iz === kolOf('N2-kesin')[1].iz);
// Damga 3: N2-kesin iddiası — çıktı BİREBİR aynı
const birebir = kolOf('taban')[0].iz === kolOf('N2-kesin')[0].iz;
damga('N2-kesin birebir (parmak izi tabanla aynı)', birebir, `${kolOf('taban')[0].iz} ≠ ${kolOf('N2-kesin')[0].iz}`);

console.log('--- A · tick toplamı (ms/kare) ---');
console.log('kol        | p50    | ort    | p95    | NPC ort | servis/dk | parmak izi');
for (const k of kosular) {
  console.log(
    `${k.kol.padEnd(10)} | ${f3(yuzdelik(k.tickMs, 0.5)).padStart(6)} | ${f3(ort(k.tickMs)).padStart(6)} | ${f3(yuzdelik(k.tickMs, 0.95)).padStart(6)} | ${k.npcOrt.toFixed(1).padStart(7)} | ${((k.servis / KAYIT_SN) * 60).toFixed(1).padStart(9)} | ${k.iz}`,
  );
}
console.log('');

/** İki koşunun ortalaması: sistem → ms/kare. */
function bolusum(ad: string) {
  const ks = kolOf(ad);
  const kare = Math.round(KAYIT_SN / DT);
  const adlar = [...new Set(ks.flatMap((k) => Object.keys(k.sistem)))];
  const satir = adlar.map((s) => ({
    s,
    ms: ort(ks.map((k) => (k.sistem[s]?.ms ?? 0) / kare)),
    n: ort(ks.map((k) => (k.sistem[s]?.n ?? 0) / kare)),
  }));
  return { satir, toplam: ort(ks.map((k) => ort(k.tickMs))) };
}

const bt = bolusum('taban');
const bn = bolusum('N2-kesin');
const sistemToplam = (b: ReturnType<typeof bolusum>) => b.satir.filter((x) => x.s !== 'findNavPath').reduce((a, x) => a + x.ms, 0);
console.log('--- A · bölüşüm (ms/kare, iki koşunun ortalaması; findNavPath sistemlerin İÇİNDE) ---');
console.log('sistem                 | taban ms | pay    | N2 ms   | çağrı/kare taban → N2');
const sirali = [...bt.satir].sort((a, b) => b.ms - a.ms);
for (const x of sirali) {
  const y = bn.satir.find((z) => z.s === x.s);
  console.log(
    `${x.s.padEnd(22)} | ${f3(x.ms).padStart(8)} | ${`%${((100 * x.ms) / bt.toplam).toFixed(1)}`.padStart(6)} | ${f3(y?.ms ?? 0).padStart(7)} | ${f2(x.n)} → ${f2(y?.n ?? 0)}`,
  );
}
const dis = (b: ReturnType<typeof bolusum>) => b.toplam - sistemToplam(b);
console.log(`${'(sistem dışı: bağlam+set)'.padEnd(22)} | ${f3(dis(bt)).padStart(8)} | ${`%${((100 * dis(bt)) / bt.toplam).toFixed(1)}`.padStart(6)} | ${f3(dis(bn)).padStart(7)} |`);
console.log(`${'TOPLAM tick'.padEnd(22)} | ${f3(bt.toplam).padStart(8)} | %100,0 | ${f3(bn.toplam).padStart(7)} | ×${(bt.toplam / bn.toplam).toFixed(2)}`);
console.log('');
console.log(`N2-kesin birebir: ${birebir ? 'EVET — parmak izi aynı' : 'HAYIR'}`);
damgaOzeti();
