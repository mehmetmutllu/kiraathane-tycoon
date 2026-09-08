/**
 * olcum-tek-odak.ts — D-038 "Tek Odak" kuralının EKRANDA kaç işaretle karşılandığını ölçer.
 *
 * Çalıştır:  npx tsx tools/olcum-tek-odak.ts
 *
 * NE ÖLÇÜLÜYOR: sahnede aynı anda çizilen zemin işareti (`GroundMarker`) sayısı. Dört kaynak var
 * ve HEPSİ canlı kodun kendi yüklemiyle sorgulanır (ikinci bir doğru kaynak yazılmaz):
 *   1. `Pad.tsx`                     → `visiblePads(questIndex, gate)`
 *   2. `StationUpgradeSpots` (Scene) → `stationUpgradeUnlocked` + seviye < tavan
 *   3. `TableUpgradeMarkers` (Scene) → masa başına `tableUpgradeUnlockedIn` + seviye < tavan
 *   4. Lavabo yükseltme noktası      → oda açık + `lavaboUpgradeCost != null`
 *
 * NASIL: zaman/para SİMÜLE EDİLMEZ — işaret sayısı DURUMUN fonksiyonu, sürenin değil. Görev hattı
 * adım adım yürütülür (sim'in `trySpend` sırası: hattın istediği alınır, hat bitince serbest oyun)
 * ve her durumda işaretler sayılır. Sayaç görevleri (çay al/servis et/para topla/bulaşık) oynanışla
 * dolar, para harcamaz → sim'deki gibi ANINDA tamam sayılır.
 *
 * `lifetime`/`waiterServed` 0 verilir: tempo gate'leri yalnız pad'lerde var ve `visiblePads` AKTİF
 * görevin pad'inde onları zaten atlıyor; klasik omurga sırası hattın kapsamadığı durumlar için
 * güvenlik ağıdır (normalde boş kalır).
 */
import {
  economyConfig as C,
  lavaboMaxLevel,
  lavaboUpgradeCost,
  type GateState,
  type QuestTarget,
} from '../src/config/economy.config.ts';
import {
  stationUpgradeUnlocked,
  stationSoftMaxLevel,
  tableUpgradeUnlockedIn,
  tableSoftMaxLevel,
  visiblePads,
} from '../src/game/rules.ts';
import { deriveWorld, areaOfTable } from '../src/game/world.ts';
import { LAVABO, LAYOUT, servicePlace } from '../src/game/layout.ts';
import { markerTier, type ActiveStep } from '../src/game/activeStep.ts';

interface Walk {
  padsDone: string[];
  stationLevel: number;
  tableLevels: number[];
  lavabo: number;
  questIdx: number;
}

interface Marker {
  kind: 'pad' | 'servis' | 'masa' | 'lavabo';
  label: string;
  pos: readonly [number, number, number];
}

function gateOf(w: Walk): GateState {
  return {
    padsDone: w.padsDone,
    tables: deriveWorld(w.padsDone).tables.length,
    stationLevel: w.stationLevel,
    lifetime: 0,
    waiterServed: 0,
    tableLevels: w.tableLevels,
  };
}

/** Sahnede O AN çizilen bütün zemin işaretleri — dördü de canlı kodun yüklemiyle. */
function markersOf(w: Walk): Marker[] {
  const g = gateOf(w);
  const d = deriveWorld(w.padsDone);
  const tables = d.tables.length;
  const out: Marker[] = [];

  for (const p of visiblePads(w.questIdx, g)) {
    out.push({ kind: 'pad', label: p.label, pos: LAYOUT.padPos[p.id] });
  }
  if (w.stationLevel < stationSoftMaxLevel() && stationUpgradeUnlocked(g)) {
    out.push({ kind: 'servis', label: 'Çay/Tezgâh Yükselt', pos: servicePlace(d.areasOpen).upgradeSpot });
  }
  for (let i = 0; i < tables; i++) {
    if (!tableUpgradeUnlockedIn(areaOfTable(i), g)) continue;
    if ((w.tableLevels[i] ?? 0) >= tableSoftMaxLevel()) continue;
    out.push({ kind: 'masa', label: `Masa ${i + 1}`, pos: LAYOUT.tables[i].upgradeSpot });
  }
  if (w.lavabo >= 1 && lavaboUpgradeCost(w.lavabo) != null) {
    out.push({ kind: 'lavabo', label: 'Lavaboyu Büyüt', pos: LAVABO.spot });
  }
  return out;
}

/** İşaret hangi alanın sınırları içinde (kamera bir salonu çerçeveler → alan = kadraj vekili). */
function areaOfPos(pos: readonly [number, number, number]): number {
  for (let a = 0; a < LAYOUT.areaBounds.length; a++) {
    const b = LAYOUT.areaBounds[a];
    if (pos[0] >= b.minX && pos[0] <= b.maxX && pos[2] >= b.minZ && pos[2] <= b.maxZ) return a;
  }
  return -1; // alan dışı (servis köşesi / lavabo — arka bant)
}

function questMet(w: Walk, t: QuestTarget): boolean {
  switch (t.type) {
    case 'pad': return w.padsDone.includes(t.id);
    case 'stationLevel': return w.stationLevel >= t.level;
    case 'lavaboLevel': return w.lavabo >= t.level;
    case 'tableLevel': return w.tableLevels.some((l) => l >= t.level);
    case 'tablesAtLevel': return w.tableLevels.filter((l) => l >= t.level).length >= t.count;
    // Sayaç + personel/karakter kademesi görevleri para/durum kelepçesi değil → anında tamam.
    default: return true;
  }
}

/** Görev hattının O ANKİ adımını UYGULA. Bir şey değiştiyse true. */
function applyQuest(w: Walk, t: QuestTarget): boolean {
  switch (t.type) {
    case 'pad': {
      const pad = C.pads.find((p) => p.id === t.id);
      if (!pad || w.padsDone.includes(pad.id)) return false;
      w.padsDone.push(pad.id);
      if (pad.effect.type === 'openRoom') w.lavabo = Math.max(w.lavabo, 1);
      return true;
    }
    case 'stationLevel': w.stationLevel = t.level; return true;
    case 'lavaboLevel': w.lavabo = t.level; return true;
    case 'tableLevel': {
      const i = w.tableLevels.findIndex((l) => l < t.level);
      if (i < 0) return false;
      w.tableLevels[i] = t.level;
      return true;
    }
    case 'tablesAtLevel': {
      const tables = deriveWorld(w.padsDone).tables.length;
      let changed = false;
      for (let i = 0; i < tables && w.tableLevels.filter((l) => l >= t.level).length < t.count; i++) {
        if ((w.tableLevels[i] ?? 0) < t.level) { w.tableLevels[i] = t.level; changed = true; }
      }
      return changed;
    }
    default: return false;
  }
}

/** Hat bittikten sonraki serbest oyun: kalan omurga pad'i, sonra servis, sonra masalar, sonra lavabo. */
function applyFree(w: Walk): boolean {
  const g = gateOf(w);
  const pad = visiblePads(w.questIdx, g)[0];
  if (pad) return applyQuest(w, { type: 'pad', id: pad.id });
  if (w.stationLevel < stationSoftMaxLevel() && stationUpgradeUnlocked(g)) {
    w.stationLevel += 1;
    return true;
  }
  const tables = deriveWorld(w.padsDone).tables.length;
  for (let i = 0; i < tables; i++) {
    if (!tableUpgradeUnlockedIn(areaOfTable(i), g)) continue;
    if ((w.tableLevels[i] ?? 0) < tableSoftMaxLevel()) {
      w.tableLevels[i] = (w.tableLevels[i] ?? 0) + 1;
      return true;
    }
  }
  if (w.lavabo >= 1 && w.lavabo < lavaboMaxLevel()) {
    w.lavabo += 1;
    return true;
  }
  return false;
}

interface Sample {
  adim: number;
  etiket: string;
  m: Marker[];
}

/**
 * C2 KATMAN AYRIMI'ndan SONRA: bu durumda oyuncu nereye giderse gitsin aynı anda en çok kaç işaret
 * KONUŞUR (yazı + maliyet gösterir)? Çizilen sayı değişmedi — obje-başı nokta kuralı korunuyor —
 * değişen sesin bütçesi. Oyuncu tek tek her işaretin üstüne konularak taranır (en kötü hâl).
 */
function enCokKonusan(m: Marker[], step: ActiveStep): number {
  let enCok = 0;
  for (const nokta of m) {
    const n = m.filter((b) => markerTier(b.pos, step, nokta.pos) !== 'sessiz').length;
    if (n > enCok) enCok = n;
  }
  return enCok;
}

function run() {
  const w: Walk = {
    padsDone: [],
    stationLevel: 0,
    tableLevels: LAYOUT.tables.map(() => 0),
    lavabo: 0,
    questIdx: 0,
  };
  const samples: Sample[] = [];
  let adim = 0;
  const push = (etiket: string) => {
    samples.push({ adim: adim++, etiket, m: markersOf(w) });
  };
  push('başlangıç');

  const MAX_STEPS = 500;
  for (let k = 0; k < MAX_STEPS; k++) {
    let moved = false;
    while (w.questIdx < C.quests.length && questMet(w, C.quests[w.questIdx].target)) {
      w.questIdx += 1;
      moved = true;
    }
    if (moved) push(`görev ${w.questIdx}/${C.quests.length}`);
    if (w.questIdx < C.quests.length) {
      const q = C.quests[w.questIdx];
      if (applyQuest(w, q.target)) {
        push(`✔ ${q.text ?? q.target.type}`);
        continue;
      }
      w.questIdx += 1; // uygulanamayan hedef (sayaç vb.)
      continue;
    }
    if (!applyFree(w)) break;
    push('serbest oyun');
  }

  const line = (s: string) => console.log(s);
  line('=== TEK ODAK ÖLÇÜMÜ (D-038) — ekranda aynı anda kaç zemin işareti var? ===');
  line(`Yürüyüş: ${samples.length} durum · görev hattı ${C.quests.length} adım · masa slotu ${LAYOUT.tables.length}`);
  line('');

  const total = samples.map((s) => s.m.length);
  const maxTotal = Math.max(...total);
  const worst = samples[total.indexOf(maxTotal)];

  let maxArea = 0;
  let worstAreaSample: Sample | null = null;
  let worstAreaIdx = -1;
  for (const s of samples) {
    const byArea = new Map<number, number>();
    for (const m of s.m) {
      const a = areaOfPos(m.pos);
      byArea.set(a, (byArea.get(a) ?? 0) + 1);
    }
    for (const [a, n] of byArea) {
      if (n > maxArea) { maxArea = n; worstAreaSample = s; worstAreaIdx = a; }
    }
  }

  const overOne = samples.filter((s) => s.m.length > 1).length;
  // Aktif adım işaretlerden BİRİ olabilir (en kötü hâl: aktif olan, konuşan komşuların dışında bir yerde
  // değil, tam onların arasında). Aktif adımı kümenin ilk elemanına koyup tarıyoruz.
  const konusan = samples.map((s) =>
    enCokKonusan(s.m, s.m.length ? { has: true, x: s.m[0].pos[0], z: s.m[0].pos[2] } : { has: false, x: 0, z: 0 }),
  );
  const maxKonusan = Math.max(...konusan);
  const ortKonusan = konusan.reduce((a, b) => a + b, 0) / konusan.length;

  line('--- ÖZET ---');
  line(`  Durumların %${((overOne / samples.length) * 100).toFixed(0)}'inde ekranda BİRDEN ÇOK işaret ÇİZİLİYOR (${overOne}/${samples.length}).`);
  line(`  EN YOĞUN durum: ${maxTotal} çizilen işaret  →  "${worst.etiket}" (adım ${worst.adim})`);
  line(`  EN YOĞUN TEK ALAN (kamera vekili): ${maxArea} işaret  →  salon ${worstAreaIdx + 1}, "${worstAreaSample?.etiket}"`);
  line('');
  line('--- KATMAN AYRIMI SONRASI: kaçı KONUŞUYOR? ---');
  line(`  En çok KONUŞAN (yazı + maliyet): ${maxKonusan}  ·  ortalama ${ortKonusan.toFixed(2)}`);
  line(`  Bunların EN FAZLA BİRİ aktif adım (kaynak tek \`activeStep\` hedefi — yapısal garanti).`);
  line(`  Gerisi sessiz: küçük, yazısız halka. Çizilen ${maxTotal} → konuşan ${maxKonusan}.`);
  line('');

  line('--- KAYNAK KIRILIMI (işaret sayısı: ortalama / en çok) ---');
  for (const kind of ['pad', 'servis', 'masa', 'lavabo'] as const) {
    const counts = samples.map((s) => s.m.filter((m) => m.kind === kind).length);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    line(`  ${kind.padEnd(7)} ort ${avg.toFixed(2)}  ·  en çok ${Math.max(...counts)}`);
  }
  line('');

  line('--- EN YOĞUN DURUMDA EKRANDA NE VAR ---');
  for (const m of worst.m) {
    const a = areaOfPos(m.pos);
    line(`  [${m.kind.padEnd(6)}] ${m.label.padEnd(22)} ${a < 0 ? 'bant ' : `salon ${a + 1}`}  @ ${m.pos[0].toFixed(1)},${m.pos[2].toFixed(1)}`);
  }
  line('');

  line('--- ZAMAN ÇİZGİSİ (işaret sayısı her değiştiğinde) ---');
  let prev = -1;
  for (const s of samples) {
    if (s.m.length === prev) continue;
    prev = s.m.length;
    const br = (['pad', 'servis', 'masa', 'lavabo'] as const)
      .map((k) => `${k[0]}${s.m.filter((m) => m.kind === k).length}`)
      .join(' ');
    line(`  adım ${String(s.adim).padStart(3)}  ${String(s.m.length).padStart(2)} işaret  (${br})  ${s.etiket}`);
  }
  line('');
  line('(kırılım: p=pad · s=servis · m=masa · l=lavabo)');
}

run();
