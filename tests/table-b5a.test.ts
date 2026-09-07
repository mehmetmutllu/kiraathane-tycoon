/**
 * table-b5a.test.ts — Faz B5a: MASA TİPLERİ ve orta şeridin 12 birimi (kat 12 → 20 masa).
 *
 * B5a iki kelepçeyi birden kaldırdı:
 *   1. `TABLES_PER_AREA = 4` — "her alan aynı sayıda masa alır" varsayımı. B3-1'de alanların
 *      KENDİSİ eş olmaktan çıkmıştı (17 × 17 · 17 × 17 · 34 × 9,8); masa sayısı hâlâ tek bir
 *      sabite bağlıydı, yani `i / 4` aritmetiği bir yalana dönüşmüştü.
 *   2. `seatsByLevel` tek liste — "her masa L3'te dört kişilik olur". Banket ikilisinin dört
 *      kişilik hâli YOKTUR (sırtında ada, karşısında tek sandalye var).
 *
 * Bu paketin bekçilik ettiği asıl değişmez: **yerleşim ile config aynı şeyi söylemek zorunda.**
 * Masanın kaç koltuğu olduğunu config'in tipi (SEATS_OF_KIND) söyler, o koltukların NEREDE
 * olduğunu layout söyler; ikisi ayrışırsa spawn "boş koltuk var" sanıp kimseyi yerleştiremeden
 * sayacı harcar (B3-2'de `seatsAtTable` kelepçesinin kapattığı açığın kök hâli).
 *
 * DENGE bu adımda DEĞİŞMEDİ (ölçüm: `npx tsx tools/simulate.ts`) — yeni pad'ler zincirin sonunda,
 * tezgâhın son basamağının ARKASINDA duruyor. Eğrinin kendisi B5b'nin işi.
 */
import { describe, it, expect } from 'vitest';
import {
  economyConfig,
  AREA_TABLE_START,
  MAX_AREAS,
  MAX_TABLES,
  SEATS_OF_KIND,
  TABLE_KIND_PER_AREA,
  TABLE_SLOTS_PER_AREA,
  areaOfTableIndex,
  areaTableSlots,
  areaTableStart,
  requiresMet,
  tableKindOf,
  tableSeats,
  type PadDef,
} from '../src/config/economy.config';
import { deriveWorld, areaOfTable } from '../src/game/world';
import { LAYOUT, banketUnit, banketUnitsOpen, useGame, parkSpot, streetAt } from '../src/game/store';
import { seatsAtTable } from '../src/game/rules';
import { tableLook } from '../src/components/three/tableLook';

/** a2'nin (orta şerit) global masa index'leri. */
const STRIP = Array.from({ length: areaTableSlots(2) }, (_, k) => areaTableStart(2) + k);
/** Zincirin tamamı açık: 3 alan + 20 masa. */
const ALL_PADS = economyConfig.pads.filter((p) => !p.optional).map((p) => p.id);

describe('B5a — alan başına masa slotu artık EŞ DEĞİL', () => {
  it('slot tablosu 4 · 4 · 12 = 20 ve sınırlar tek prefix toplamından gelir', () => {
    expect([...TABLE_SLOTS_PER_AREA]).toEqual([4, 4, 12]);
    expect(TABLE_SLOTS_PER_AREA.length).toBe(MAX_AREAS);
    expect([...AREA_TABLE_START]).toEqual([0, 4, 8, 20]);
    expect(MAX_TABLES).toBe(20);
    // Kat toplamı = adaların altı sütunu × iki yüz + ön çeyreklerin iki 2×2 kümesi.
    expect(areaTableSlots(2)).toBe(12);
  });

  it('global index → alan: bölme aritmetiği DEĞİL, sınır sorgusu (i/4 artık yanlış cevap verir)', () => {
    for (let a = 0; a < MAX_AREAS; a++) {
      for (let k = 0; k < areaTableSlots(a); k++) {
        const i = areaTableStart(a) + k;
        expect(areaOfTableIndex(i), `masa ${i}`).toBe(a);
        expect(areaOfTable(i), `masa ${i}`).toBe(a); // world de aynı cevabı vermeli
      }
    }
    // Eski formülün yanlışlaştığı yer: 12. masa a2'nin 5. slotu, "3. alan" değil.
    expect(Math.floor(12 / 4)).toBe(3);
    expect(areaOfTableIndex(12)).toBe(2);
    expect(areaOfTableIndex(19)).toBe(2);
  });

  it('deriveWorld a2 için 12 slota kadar açar ve masa index’leri BİTİŞİK kalır', () => {
    const w = deriveWorld(ALL_PADS);
    expect(w.areasOpen).toBe(3);
    expect(w.tables.length).toBe(MAX_TABLES);
    expect(w.tables.map((t) => t.index)).toEqual(Array.from({ length: MAX_TABLES }, (_, i) => i));
    for (const t of w.tables) expect(t.areaIndex).toBe(areaOfTableIndex(t.index));
    // Ara durum: şeridin yarısı açıkken de bitişik (atlanmış slot yok).
    const half = deriveWorld(
      ALL_PADS.filter((id) => !['z3table9', 'z3table10', 'z3table11', 'z3table12'].includes(id)),
    );
    expect(half.tables.map((t) => t.index)).toEqual(Array.from({ length: 16 }, (_, i) => i));
  });
});

describe('B5a — MASA TİPİ: dörtlü küme ↔ banket ikilisi', () => {
  it('tip alanın planından gelir ve YERLEŞİM aynı sayıyı söyler (config ↔ layout bağı)', () => {
    expect([...TABLE_KIND_PER_AREA]).toEqual(['four', 'four', 'deuce']);
    for (let i = 0; i < MAX_TABLES; i++) {
      const t = LAYOUT.tables[i];
      const kind = tableKindOf(i);
      expect(t.kind, `masa ${i}`).toBe(kind);
      // Bu satır paketin kalbi: koltuk YERİ sayısı, tipin koltuk SAYISINDAN sapamaz.
      expect(t.seats.length, `masa ${i} (${kind})`).toBe(SEATS_OF_KIND[kind]);
      expect(t.seatOffsets.length).toBe(t.seats.length);
      expect(t.seatKinds.length).toBe(t.seats.length);
    }
  });

  it('banket ikilisi 2 koltukta TAVANLANIR; dörtlü masa L3’te dörde çıkar', () => {
    expect([0, 1, 2, 3, 4].map((l) => tableSeats(l, 'four'))).toEqual([1, 2, 2, 4, 4]);
    expect([0, 1, 2, 3, 4].map((l) => tableSeats(l, 'deuce'))).toEqual([1, 2, 2, 2, 2]);
    // seatsAtTable artık cevabı MERDİVENDEN alır; kelepçe savunma olarak kalır (ikisi de 2 der).
    for (const i of STRIP) {
      for (const l of [0, 1, 2, 3, 4]) expect(seatsAtTable(i, l), `masa ${i} L${l}`).toBe(l === 0 ? 1 : 2);
    }
    for (const i of [0, 4]) expect(seatsAtTable(i, 3)).toBe(4);
  });

  it('katın TAM koltuk sayısı 8 × 4 + 12 × 2 = 56', () => {
    let seats = 0;
    for (let i = 0; i < MAX_TABLES; i++) seats += seatsAtTable(i, 4);
    expect(seats).toBe(56);
  });

  it('GÖRÜNÜŞ: L3’te dörtlü BÜYÜR (kare), ikili BİSTROYA döner (uzun) — aynı basamak, farklı geometri', () => {
    for (const k of ['four', 'deuce'] as const) {
      expect(tableLook(k, 0).key).toBe('table_small');
      expect(tableLook(k, 2).key).toBe('table_small');
    }
    expect(tableLook('four', 3).key).toBe('table_medium');
    expect(tableLook('deuce', 3).key).toBe('table_medium_long');
    // İkili masa hiçbir seviyede kare-büyük tablayı (dört kişilik okuması) almaz.
    for (const l of [0, 1, 2, 3, 4]) expect(tableLook('deuce', l).key).not.toBe('table_medium');
    // Bistro tablası banka PARALEL uzar: eni derinliğinden büyük.
    const long = tableLook('deuce', 3);
    expect(long.cloth.hx).toBeGreaterThan(long.cloth.hz);
    // ...ve `LAYOUT.tableHalf` collision kutusunun dışına taşmaz (native table_medium_long eni 3).
    expect(long.scale[0] * 3).toBeLessThanOrEqual(LAYOUT.tableHalf[0] * 2);
  });
});

describe('B5a — şeridin pad zinciri', () => {
  const stripPads = economyConfig.pads.filter((p) => p.area === 2 && p.effect.type === 'addTable');

  it('a2’nin 11 masa pad’i OMURGAYA kesintisiz bağlanır (alan açılışı 1. masayı getirir)', () => {
    expect(stripPads.length).toBe(areaTableSlots(2) - 1);
    const ids = stripPads.map((p) => p.id);
    expect(ids[0]).toBe('z3table2');
    expect(ids[ids.length - 1]).toBe('z3table12');
    // Zincir masadan masaya DEĞİL, omurga sırasındandır: aralarına personel pad'i girebilir
    // (z3table2 → waiter2 → z3table3). Değişmez olan şu: her masa pad'i kendinden HEMEN ÖNCEKİ
    // zorunlu pad'i ister — böylece hiçbir slot atlanamaz ve global index bitişik kalır.
    const backbone = economyConfig.pads.filter((p) => !p.optional).map((p) => p.id);
    for (const p of stripPads) {
      const at = backbone.indexOf(p.id);
      expect((p.requires as { prev?: string[] }).prev, p.id).toEqual([backbone[at - 1]]);
    }
  });

  it('her masa pad’i AÇTIĞI masanın üstünde durur (mekânsal tycoon)', () => {
    for (let k = 0; k < stripPads.length; k++) {
      const pos = LAYOUT.padPos[stripPads[k].id];
      expect(pos, stripPads[k].id).toBeDefined();
      expect(pos).toEqual(LAYOUT.tables[areaTableStart(2) + k + 1].table);
    }
  });

  it('şeridin eğrisi ×1,15 ve a2’den girişte SIÇRAMA yok (B5b · D-066)', () => {
    // B5a bu sekiz masayı a2'nin kendi son oranıyla (3200/2200 = ×1,4545) fiyatlamıştı ve o oran
    // bir VARSAYIMA dayanıyordu: "masa açmak geliri büyütür, öyleyse pahalı olabilir". B5b ölçtü,
    // varsayım yanlış (`docs/denge-raporu-b5b.md` §1): gelir min(talep, arz, taşıma) ile kelepçeli
    // ve talep `table3`'ten beri hep en büyük terim — masa sayısı geliri HİÇ değiştirmiyor.
    // Bu bekçi eğrinin sessizce yeniden dikleşmesine karşıdır: masa ALAN satar, gelir satmaz.
    const strip = stripPads.slice(3); // z3table5 … z3table12
    expect(strip.map((p) => p.id)).toEqual([5, 6, 7, 8, 9, 10, 11, 12].map((n) => `z3table${n}`));
    for (let i = 1; i < strip.length; i++) {
      expect(strip[i].cost / strip[i - 1].cost, `${i}. adım`).toBeCloseTo(1.15, 1);
    }
    // a2'nin son masasından şeride geçiş eğrinin DEVAMI, yeni bir basamak değil.
    expect(strip[0].cost / 3200).toBeLessThanOrEqual(1.2);
    // Şeridin tamamı, servis merdiveninin son basamağının (L6 = 9000₺) altı katını geçmez:
    // bir masa gelir çarpanı değilse fiyatı da gelir çarpanı fiyatı olamaz.
    expect(strip.reduce((a, p) => a + p.cost, 0)).toBeLessThan(6 * 9000);
  });

  it('banketUnitsOpen ve birim sırası: her sütun dört birim taşır, eskiler yer değiştirmez', () => {
    expect(banketUnitsOpen(areaTableStart(2))).toBe(0);
    expect(banketUnitsOpen(MAX_TABLES)).toBe(12);
    expect(banketUnitsOpen(MAX_TABLES + 5)).toBe(12); // bozuk kayda karşı kelepçe
    for (let u = 0; u < 12; u++) expect(banketUnit(u).col, `birim ${u}`).toBe(Math.floor(u / 4));
    // "Var olan masalar yer değiştirmez": şeridin ilk birimi B3-2'deki index'inde (8) duruyor.
    expect(areaTableStart(2)).toBe(8);
  });
});

describe('B5a — gating: alanın büyümesi eşiği sessizce kaydırmaz', () => {
  it('waiter3 ŞERİDİN ÖNÜNDE ve gate’i TEZGÂHIN SON SEVİYESİ (B5b · D-066)', () => {
    // B5a'da waiter3 opsiyoneldi ve gate'i `allAreaTablesLevel {a2, L2, count 4}` idi — "şerit
    // kalabalıklaştı" demenin DOLAYLI yolu. B5b ölçtü: kalabalık değil TAŞIMA belirleyiciymiş
    // (12 masa · L6 · iki garson → taşıma 0,66 < arz 0,78; üçüncü garson +%19). Gate artık ölçümün
    // söylediği gerçek koşul, ve o koşulun görev hattındaki karşılığı (`q_stationMax`) hemen
    // önünde duruyor → görev sırası ile zincir gate'i AYNI şeyi söylüyor.
    const w3 = economyConfig.pads.find((p) => p.id === 'waiter3') as PadDef;
    expect(w3.optional ?? false).toBe(false); // artık omurgada
    const gate = (stationLevel: number, done: string[]) => ({
      padsDone: done, tables: MAX_TABLES, stationLevel, lifetime: 1e6,
      tableLevels: Array(MAX_TABLES).fill(0) as number[],
    });
    const upToZ3t4 = ALL_PADS.slice(0, ALL_PADS.indexOf('z3table4') + 1);
    expect(requiresMet(w3.requires, gate(5, upToZ3t4))).toBe(false); // tezgâh L6 değil → yok
    expect(requiresMet(w3.requires, gate(6, upToZ3t4))).toBe(true);
    // B4: waiter3 ile şerit arasına LAVABO girdi (D-066'nın plato kolu). Zincir hâlâ waiter3'ten
    // sonra devam ediyor ama sıradaki halka artık odadır — şerit ancak gelir yeniden BÜYÜMEYE
    // başladıktan sonra akar (waiter3 arzı tavana taşır, lavabo müşteri başına ₺'yi büyütür).
    const lav = economyConfig.pads.find((p) => p.id === 'lavabo') as PadDef;
    expect((lav.requires as { prev?: string[] }).prev).toEqual(['waiter3']);
    const t5 = economyConfig.pads.find((p) => p.id === 'z3table5') as PadDef;
    expect((t5.requires as { prev?: string[] }).prev).toEqual(['lavabo']);
    // Masa SEVİYESİ artık waiter3'ün koşulu değil (eski vekil gate tamamen kalktı).
    expect(JSON.stringify(w3.requires)).not.toContain('allAreaTablesLevel');
  });
});

describe('B5a — CANLI: şeridin son birimine gerçekten oturuluyor', () => {
  it('20 masa açıkken müşteri en İÇ sütunun banketine (masa 19) rotayla oturur', () => {
    useGame.getState().hardReset();
    useGame.setState({
      padsDone: [...ALL_PADS],
      npcs: [],
      spawnTimer: 1e9,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
    });
    useGame.getState().tick(0.05);
    expect(useGame.getState().tables).toBe(MAX_TABLES);
    useGame.setState({ player: [...parkSpot(3, MAX_TABLES)] as [number, number, number] });
    for (const [i, k] of [[19, 0], [19, 1], [15, 0]] as const) {
      const id = 9000 + i * 4 + k;
      const street = streetAt(3);
      useGame.setState({
        npcs: [
          {
            id,
            state: 'toTable',
            pos: [...street] as [number, number, number],
            tableIndex: i,
            seatIndex: k,
            timer: 0,
            product: 'tea',
            color: '#fff',
          },
        ],
        spawnTimer: 1e9,
      });
      let st = 'toTable';
      for (let f = 0; f < 40 * 60 && st === 'toTable'; f++) {
        useGame.getState().tick(1 / 60);
        st = useGame.getState().npcs.find((n) => n.id === id)?.state ?? 'gone';
      }
      expect(st, `masa ${i} koltuk ${k} (${LAYOUT.tables[i].seatKinds[k]})`).toBe('waitingForTea');
      const npc = useGame.getState().npcs.find((n) => n.id === id)!;
      expect(npc.pos[0]).toBeCloseTo(LAYOUT.tables[i].seats[k][0], 5);
      expect(npc.pos[2]).toBeCloseTo(LAYOUT.tables[i].seats[k][2], 5);
    }
  });
});
