/**
 * tick-fingerprint.ts — tick()'in DAVRANIŞ PARMAK İZİ.
 *
 * Faz A2 (tick'i sistemlere bölme) gibi "davranış değişmeyecek" refactor'larında
 * güvence aracı: Math.random tohumlanır, senaryo adım adım koşturulur ve her kontrol
 * noktasında oyun durumunun tamamı JSON'a yazılır. Refactor ÖNCESİ ve SONRASI çıktı
 * BİREBİR aynı olmalı:
 *
 *   npx tsx tools/tick-fingerprint.ts > before.json
 *   ...refactor...
 *   npx tsx tools/tick-fingerprint.ts > after.json
 *   diff before.json after.json
 *
 * ÖNEMLİ: çıktının ANAHTAR ADLARI ölçüm aracının SÖZLEŞMESİDİR — kod içindeki alan adı değişse de
 * (Faz B1: zone → alan/servis) anahtar sabit kalır, böylece diff literal olarak boş çıkar.
 */
import { useGame, LAYOUT, servicePlace } from '../src/game/store';

/** Servis kümesinin O ANKİ yeri (B3-1/D-062: 3. Alan açılınca arka banda taşınır). */
const SP = () => servicePlace(useGame.getState().areasOpen);
import { economyConfig } from '../src/config/economy.config';

// --- Tohumlu rastgelelik (mulberry32): NPC spawn/renk/kirli konumu deterministik olsun.
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

// localStorage yok (node) → kayıt yazma/okuma no-op.
const g = globalThis as unknown as Record<string, unknown>;
if (!g.localStorage) {
  const mem: Record<string, string> = {};
  g.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
}

const round = (n: number, d = 4) => +n.toFixed(d);

/** Durumun TAMAMINA yakın, karşılaştırılabilir anlık görüntüsü. */
function snapshot(label: string) {
  const s = useGame.getState();
  return {
    label,
    wallet: round(s.wallet.toNumber(), 3),
    lifetime: round(s.lifetime.toNumber(), 3),
    diamonds: round(s.diamonds.toNumber(), 3),
    xp: s.xp,
    tables: s.tables,
    stations: s.stations,
    zonesOpen: s.areasOpen,
    stationLevels: [...s.stationLevels],
    tableLevels: [...s.tableLevels],
    padsDone: [...s.padsDone],
    padFills: Object.fromEntries(Object.entries(s.padFills).map(([k, v]) => [k, round(v, 3)])),
    upgradeFills: s.upgradeFills.map((n) => round(n, 3)),
    tableUpgradeFills: s.tableUpgradeFills.map((n) => round(n, 3)),
    tray: s.tray,
    trayFood: s.trayFood,
    cleanCups: s.cleanCups,
    carriedDirty: s.carriedDirty,
    carriedDirtyFood: s.carriedDirtyFood,
    ready: { tea: s.ready.tea, tost: s.ready.tost },
    brewProgress: { tea: round(s.brewProgress.tea, 3), tost: round(s.brewProgress.tost, 3) },
    npcs: s.npcs.map((n) => ({
      id: n.id, state: n.state, tableIndex: n.tableIndex, seatIndex: n.seatIndex,
      product: n.product, timer: round(n.timer, 3), pos: n.pos.map((v) => round(v, 3)),
    })),
    coins: s.coins.map((c) => ({ id: c.id, value: round(c.value, 3), pos: c.pos.map((v) => round(v, 3)) })),
    dishes: s.dishes.map((d) => ({ id: d.id, tableIndex: d.tableIndex, kind: d.kind, pos: d.pos.map((v) => round(v, 3)) })),
    waiters: s.waiters.map((w) => ({ tray: w.tray, trayFood: w.trayFood, pos: w.pos.map((v) => round(v, 3)) })),
    dishwasher: s.dishwasher
      ? { tray: s.dishwasher.tray, trayFood: s.dishwasher.trayFood, pos: s.dishwasher.pos.map((v) => round(v, 3)) }
      : null,
    player: s.player.map((v) => round(v, 3)),
    // Anahtar adları SÖZLEŞME (bkz. dosya başlığı): iç alan adları değişse de çıktı sabit kalır.
    stats: {
      teaPickups: s.stats.teaPickups,
      teasServed: s.stats.teasServed,
      coinsCollected: s.stats.coinsCollected,
      dishesWashed: s.stats.dishesWashed,
      waiterServed: s.stats.waiterServed,
      waiterServedByZone: [...s.stats.waiterServedByService],
      teasServedByZone: [...s.stats.teasServedByArea],
    },
    questIndex: s.questIndex,
    questBase: s.questBase,
    questPhase: s.questPhase,
    questPhaseT: round(s.questPhaseT, 3),
    quest: s.quest ? { id: s.quest.id, cur: s.quest.cur, total: s.quest.total, done: !!s.quest.done } : null,
    revealSeen: [...s.revealSeen],
    notice: s.notice ? { text: s.notice.text, kind: s.notice.kind } : null,
    noticeQueue: s.noticeQueue.map((n) => n.text),
    activeZone: s.activeSpot ? { kind: s.activeSpot.kind, label: s.activeSpot.label } : null,
    camFocus: s.camFocus ? { pos: s.camFocus.pos.map((v) => round(v, 3)), ttl: round(s.camFocus.ttl, 3) } : null,
    nextId: s.nextId,
    spawnTimer: round(s.spawnTimer, 3),
    spawnZone: s.spawnArea,
  };
}

const run = (seconds: number, dt = 0.1) => {
  const tick = useGame.getState().tick;
  for (let t = 0; t < Math.round(seconds / dt); t++) tick(dt);
};
const at = (p: readonly number[]) => useGame.setState({ player: [p[0], 0.6, p[2]] as [number, number, number] });

seedRandom(20260906);
useGame.getState().hardReset();

const out: unknown[] = [];
out.push(snapshot('acilis'));

// 1) Ocakta bekle → tepsi dolsun; sonra ilk bekleyen müşteriye servis.
at(SP().station);
run(20);
out.push(snapshot('ocakta-20sn'));

for (let i = 0; i < 4; i++) {
  const w = useGame.getState().npcs.find((n) => n.state === 'waitingForTea');
  at(w ? LAYOUT.tables[w.tableIndex].seat : SP().station);
  run(6);
  at(SP().station);
  run(6);
}
out.push(snapshot('dort-servis-turu'));

// 2) Para topla (masaların çevresinde dolaş) + kirli bardak döngüsü.
for (let i = 0; i < 4; i++) { at(LAYOUT.tables[i].seat); run(3); }
at(SP().dish); run(4);
out.push(snapshot('toplama-ve-bulasik'));

// 3) Pad zinciri: pad YALNIZ kendi görevi aktifken görünür (ekranda tek pad) → göreve atlayıp üstünde bekle.
const jumpToPadQuest = (padId: string) => {
  const i = economyConfig.quests.findIndex(
    (q) => q.target.type === 'pad' && (q.target as { id: string }).id === padId,
  );
  if (i >= 0) useGame.setState({ questIndex: i, questBase: 0, questPhase: 'active', questPhaseT: 0, questDoneIndex: -1 });
};
useGame.getState().addMoney(5000);
for (const id of ['table2', 'table3', 'waiter', 'dishwasher', 'table4']) {
  jumpToPadQuest(id);
  const p = LAYOUT.padPos[id];
  if (p) { at(p); run(10); }
}
out.push(snapshot('omurga-padleri'));

// 4) Ocak + masa yükseltme noktaları (masa yükseltmesi table4 sonrası açılır).
useGame.getState().addMoney(20000);
at(SP().upgradeSpot); run(12);
at(LAYOUT.tables[0].upgradeSpot); run(12);
at(LAYOUT.tables[2].upgradeSpot); run(12);
out.push(snapshot('yukseltmeler'));

// 5) Zone-2 açılışı: yeni salon + oradaki garson (per-zone personel yolu).
useGame.getState().addMoney(50000);
for (const id of ['zone2', 'z2table2', 'z2waiter']) {
  jumpToPadQuest(id);
  const p = LAYOUT.padPos[id];
  if (p) { at(p); run(14); }
}
out.push(snapshot('zone2-acilisi'));

// 6) Oyuncu uzak köşede: personel tek başına çalışsın (garson + bulaşıkçı yolu).
at([7.5, 0.6, 6.5]); run(90);
out.push(snapshot('personel-yalniz-90sn'));

console.log(JSON.stringify(out, null, 1));
