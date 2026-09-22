import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from '../src/game/store';
import { AYRISMASIZ } from '../src/game/tick';
import { NPC_SPEED, streetAt } from '../src/game/layout';

/**
 * izdiham-t6.test.ts — T6'nın BEKÇİSİ (D-140).
 *
 * Kök (`docs/izdiham-raporu-t6.md` §2.3): çıkan müşterilerin hepsi TEK sokak noktasına yürür ve
 * yalnız tam varışta silinir. `leaving` ayrışmaya tabiyken itme (2,4 br/sn) yürüyüşten (1,4) güçlü
 * olduğu için kalabalık noktanın çevresinde halka kurup kilitleniyordu — 10 dakikada kapıda 461 NPC.
 * Karar: `leaving` ayrışmadan muaf. Bu dosya o muafiyeti, kilidin çözüldüğünü ve düzeltmenin
 * başka bir şeyi (oturanlar, silme noktası) bozmadığını davranışla denetler.
 */
type Npc = ReturnType<typeof useGame.getState>['npcs'][number];
const DT = 1 / 60;

/** Gerçek bir doğmuş NPC'yi şablon alır (alanlar elle yazılırsa şema değişince test sessizleşir). */
function sablon(): Npc {
  const tick = useGame.getState().tick;
  for (let i = 0; i < 2000 && useGame.getState().npcs.length === 0; i++) tick(0.1);
  const n = useGame.getState().npcs[0];
  if (!n) throw new Error('senaryo kurulamadı: hiç müşteri doğmadı');
  return n;
}

/** Kapının dışında, sokak noktasının çevresinde sıkışık bir çıkış kalabalığı. */
function cikisKalabaligi(sayi: number): number[] {
  const t = sablon();
  const [sx, , sz] = streetAt(useGame.getState().areasOpen);
  const npcs: Npc[] = [];
  for (let k = 0; k < sayi; k++) {
    const aci = k * 2.399963; // altın açı: deterministik, üst üste binmeyen sarmal
    const r = 0.3 + 0.12 * Math.sqrt(k);
    npcs.push({ ...t, id: 5000 + k, state: 'leaving', pos: [sx + Math.cos(aci) * r, 0.6, sz - 1.2 + Math.sin(aci) * r * 0.6] });
  }
  useGame.setState({ npcs, spawnTimer: 1e9 } as never);
  return npcs.map((n) => n.id);
}

describe('T6 · kapı önü izdihamı (D-140)', () => {
  beforeEach(() => {
    useGame.getState().hardReset();
  });

  it('AYRISMASIZ kümesi: leaving eklendi, eski üyeler yerinde', () => {
    for (const st of ['waitingForTea', 'drinking', 'inWc', 'wcGiris', 'wcCikis', 'leaving'] as const) {
      expect(AYRISMASIZ.has(st), st).toBe(true);
    }
    // Yürüyenler ayrışmaya TABİ kalmalı (S18'in kazanımı — `musteri-ayrisma.test.ts` davranışını denetler).
    expect(AYRISMASIZ.has('toTable')).toBe(false);
    expect(AYRISMASIZ.has('toWc')).toBe(false);
  });

  it('üst üste iki ÇIKAN müşteri birbirini itmez', () => {
    const t = sablon();
    const [sx, , sz] = streetAt(useGame.getState().areasOpen);
    const bas: Npc['pos'] = [sx + 1.5, 0.6, sz - 2];
    useGame.setState({
      npcs: [
        { ...t, id: 901, state: 'leaving', pos: [...bas] as Npc['pos'] },
        { ...t, id: 902, state: 'leaving', pos: [bas[0] + 0.05, bas[1], bas[2]] as Npc['pos'] },
      ],
      spawnTimer: 1e9,
    } as never);
    const tick = useGame.getState().tick;
    let denetim = 0;
    for (let i = 0; i < 30; i++) {
      tick(DT);
      const [a, b] = [901, 902].map((id) => useGame.getState().npcs.find((n) => n.id === id));
      if (!a || !b) break;
      // Aynı noktaya aynı hızla yürüyorlar: ara ancak ayrışma iterse açılır.
      expect(Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2])).toBeLessThan(0.06);
      denetim++;
    }
    expect(denetim, 'çift hiç birlikte gözlenmedi — senaryo boşa koştu').toBeGreaterThan(10);
  });

  /**
   * DİZİ SIRASI: `npcAyristir`in iki bekçisi var — dış döngü (`a`) ve iç döngü (`b`). Yürüyen dizide
   * ÖNDEYSE muaf olanı yalnız iç bekçi korur. İlk bekçi takımı muaf NPC'yi hep başa koyuyordu ve iç
   * bekçiyi silen mutasyon (M3) kaçtı. Burada yürüyen önde: çıkan, tek başına yürüdüğü yolun AYNISINI
   * yürümeli — yanından geçen kalabalık onu yolundan itemez.
   */
  it('ÖNDEKİ yürüyen, arkadaki çıkanı itemez (iç döngü bekçisi)', () => {
    const t = sablon();
    const [sx, , sz] = streetAt(useGame.getState().areasOpen);
    const bas: Npc['pos'] = [sx + 1, 0.6, sz - 2];
    const cikan: Npc = { ...t, id: 902, state: 'leaving', pos: [...bas] as Npc['pos'] };
    const yol = (npcs: Npc[]) => {
      useGame.getState().hardReset();
      useGame.setState({ npcs, spawnTimer: 1e9 } as never);
      const tick = useGame.getState().tick;
      const izler: number[][] = [];
      for (let i = 0; i < 20; i++) {
        tick(DT);
        const c = useGame.getState().npcs.find((n) => n.id === 902);
        if (c) izler.push([c.pos[0], c.pos[2]]);
      }
      return izler;
    };
    const yalniz = yol([{ ...cikan, pos: [...bas] as Npc['pos'] }]);
    const yuruyen: Npc = { ...t, id: 901, state: 'toTable', tableIndex: 0, seatIndex: 0, pos: [bas[0] + 0.1, bas[1], bas[2] + 0.1] };
    const kalabalik = yol([yuruyen, { ...cikan, pos: [...bas] as Npc['pos'] }]);
    expect(kalabalik.length).toBe(yalniz.length);
    for (let i = 0; i < yalniz.length; i++) {
      expect(Math.hypot(kalabalik[i][0] - yalniz[i][0], kalabalik[i][1] - yalniz[i][1]), `kare ${i}`).toBeLessThan(1e-9);
    }
  });

  it('60 kişilik çıkış kalabalığı KİLİTLENMEZ — hepsi silinir, hepsi sokak noktasında', () => {
    const idler = cikisKalabaligi(60);
    const sokak = streetAt(useGame.getState().areasOpen);
    const son = new Map<number, Npc['pos']>();
    const tick = useGame.getState().tick;
    // En uzak üye ~2,5 br ötede; 1,4 br/sn ile ~2 sn. 20 sn cömert pay — kilit varsa hiç bitmez.
    for (let i = 0; i < 20 / DT; i++) {
      for (const n of useGame.getState().npcs) if (n.id >= 5000) son.set(n.id, [...n.pos] as Npc['pos']);
      tick(DT);
      if (!useGame.getState().npcs.some((n) => n.id >= 5000)) break;
    }
    const kalan = useGame.getState().npcs.filter((n) => n.id >= 5000).length;
    expect(kalan, 'çıkış kalabalığı sokakta kilitlendi').toBe(0);
    // SİLME HÂLÂ SOKAK NOKTASINDA: her üyenin görüldüğü son konum, silindiği karedeki adımın içinde.
    const adim = NPC_SPEED * DT;
    for (const id of idler) {
      const p = son.get(id)!;
      expect(Math.hypot(p[0] - sokak[0], p[2] - sokak[2]), `NPC ${id} sokağa varmadan silindi`).toBeLessThanOrEqual(adim + 1e-6);
    }
  });

  /**
   * SÜREKLİ AKIŞ: izdiham tek seferlik bir kalabalık değil, pozitif geri beslemeydi (yığın büyüdükçe
   * itme artar, silinme azalır). Kapı eşiğine saniyede 3 çıkan bırakılır; kök açıkken sahnedeki
   * çıkan sayısı akışla birlikte büyür, kapalıyken birkaç saniyelik yolun doluluğunda düz kalır.
   * (Tam geç-oyun dünyası burada koşmaz — 16 bin tick; o ölçüm `tools/olcum-izdiham-t6.ts`in işi.)
   */
  it('sürekli çıkış akışında nüfus DÜZ kalır (30 sn, 3 kişi/sn)', () => {
    const t = sablon();
    const [sx, , sz] = streetAt(useGame.getState().areasOpen);
    useGame.setState({ npcs: [], spawnTimer: 1e9 } as never);
    const tick = useGame.getState().tick;
    let id = 7000;
    let enCok = 0;
    for (let i = 0; i < 30 / DT; i++) {
      if (i % 20 === 0) {
        const npcs = useGame.getState().npcs;
        const x = sx + ((id % 5) - 2) * 0.3;
        useGame.setState({ npcs: [...npcs, { ...t, id: id++, state: 'leaving', pos: [x, 0.6, sz - 2.5] as Npc['pos'] }] } as never);
      }
      tick(DT);
      const cikan = useGame.getState().npcs.filter((n) => n.id >= 7000).length;
      if (i > 10 / DT) enCok = Math.max(enCok, cikan);
    }
    // Yol ~2,5 br / 1,4 br/sn ≈ 1,8 sn → sahnede ~6 çıkan. 90 kişi bırakıldı; kilit varsa onlarca kalır.
    expect(id - 7000).toBe(90);
    expect(enCok, `ısınma sonrası en çok ${enCok} çıkan sahnede`).toBeLessThanOrEqual(10);
  });
});
