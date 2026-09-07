/**
 * chain-b5b.test.ts — GÖREV HATTI ile PAD ZİNCİRİ aynı şeyi söylemeli (B5b · D-066).
 *
 * Bu projede tekrar eden bir kusur sınıfı var: ilerlemeyi İKİ ayrı sıra anlatıyor —
 *   1. `pads[].requires` (yapısal zincir: neyin neyden sonra geldiği),
 *   2. `quests[]` (oyuncunun gördüğü tek-odak sırası).
 * İkisi ayrı yerlerde yazıldığı için sessizce ayrışabiliyorlar, ve ayrıştıklarında kimse
 * bağırmıyor: `visiblePads` AKTİF görevin hedef pad'inde tempo gate'lerini bilerek ATLAR
 * (2026-06-11 fix — görev hattı sıralı olduğu için tempo kaynağı odur). Yani hattın işaret
 * ettiği bir pad, zincirin "daha sırası gelmedi" dediği hâlde ekranda belirir; gate bir
 * SÜSE dönüşür ve kimse fark etmez.
 *
 * B5b bunu somut olarak yaşadı: `waiter3`'ün gate'i `allAreaTablesLevel` idi — masa
 * yükseltmeleri SERBEST sırayla alındığı için görev hattının sırasıyla hizalanması imkânsız
 * bir koşul. Gate ölçümün söylediği gerçek koşulla (`minStationLevel`) değiştirildi ve tam
 * karşılığı olan görev (`q_stationMax`) hemen önüne kondu.
 *
 * Buradaki iki bekçi o hizayı kalıcı kılar. Elle yazılmış hiçbir sıra listesi yok — ikisi de
 * config'in kendisinden türer (B5a'nın dersi: elle yazılmış dizi bir varsayımdır ve bayatlar).
 */
import { describe, it, expect } from 'vitest';
import {
  economyConfig,
  requiresMet,
  type PadDef,
  type Requires,
  type GateState,
} from '../src/config/economy.config';
import { deriveWorld } from '../src/game/world';

const PADS = economyConfig.pads as readonly PadDef[];
const padById = (id: string) => PADS.find((p) => p.id === id);

/** Görev hattının SIRALAYABİLDİĞİ gate'ler: hattın kendisi bunları adım adım karşılar. */
const SIRALANABILIR: (keyof Requires)[] = ['prev', 'minStationLevel', 'minTables'];
/** Hattın bilerek ATLADIĞI tempo gate'i (visiblePads: "görev hattı sıralı = tempo kaynağı odur"). */
const TEMPO: (keyof Requires)[] = ['minLifetime'];

describe('B5b — görev hattı ↔ pad zinciri hizası (D-066)', () => {
  it('görev hedefi olan bir pad, YALNIZ hattın sıralayabildiği gate’leri taşır', () => {
    // Aksi hâlde iki sıra ayrışır: hat pad'i gösterir, zincir "hazır değil" der, gate süse döner.
    // (Tempo gate'i istisna: hattın onu atladığı YAZILI bir karar — visiblePads'e bak.)
    const izinli = new Set<string>([...SIRALANABILIR, ...TEMPO] as string[]);
    for (const q of economyConfig.quests) {
      if (q.target.type !== 'pad') continue;
      const pad = padById(q.target.id);
      expect(pad, q.id).toBeDefined();
      const gates = Object.keys((pad!.requires ?? {}) as object);
      const kacak = gates.filter((g) => !izinli.has(g));
      expect(kacak, `${q.id} → ${pad!.id}: hattın sıralayamadığı gate`).toEqual([]);
    }
  });

  it('hat yürütülünce her pad görevi, pad’in gate’i KARŞILANMIŞKEN geliyor', () => {
    // Hattı baştan sona oynat: her görev sırası geldiğinde durum ne ise gate ONA sorulur.
    // Bu, "q_stationMax'ten sonra waiter3" gibi hizaların gerçekten tuttuğunun kanıtı — ve bir
    // görev araya sokulup sıra bozulursa burada patlar.
    const padsDone: string[] = [];
    let stationLevel = 0;
    for (const q of economyConfig.quests) {
      if (q.target.type === 'pad') {
        const pad = padById(q.target.id)!;
        const g: GateState = {
          padsDone: [...padsDone],
          tables: deriveWorld(padsDone).tables.length,
          stationLevel,
          lifetime: Number.MAX_SAFE_INTEGER, // tempo gate'i bilerek atlanır (yukarıdaki karar)
          tableLevels: [],
        };
        expect(requiresMet(pad.requires, g), `${q.id} → ${pad.id}`).toBe(true);
        padsDone.push(pad.id);
      } else if (q.target.type === 'stationLevel') {
        stationLevel = Math.max(stationLevel, q.target.level);
      }
    }
    // Hat bittiğinde omurganın TAMAMI alınmış olmalı — görevsiz kalan bir omurga pad'i,
    // "görev bitti ama ekranda hâlâ pad var" hâli demektir.
    const omurga = PADS.filter((p) => !p.optional).map((p) => p.id);
    expect([...padsDone].sort()).toEqual([...omurga].sort());
  });

  it('omurganın PAD sırası ile görev hattındaki pad sırası birebir aynı', () => {
    const omurga = PADS.filter((p) => !p.optional).map((p) => p.id);
    const hattaki = economyConfig.quests
      .filter((q) => q.target.type === 'pad')
      .map((q) => (q.target as { id: string }).id);
    expect(hattaki).toEqual(omurga);
  });
});
