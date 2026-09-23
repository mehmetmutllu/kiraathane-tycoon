/**
 * sira-h2.test.ts — H2 / D-124 BEKÇİSİ: masa yükseltmelerinin sırası tek hedeflidir.
 *
 * NE KORUYOR: `tableUpgradeTarget` tek bir masa döndürür ve ÇİZEN (Scene) ile TETİKLEYEN
 * (tick) aynı kaynaktan okur. Bekçinin işi "fonksiyon çalışıyor mu" değil, kuralın
 * KIRILAMAZ olduğunu göstermek: ilerlemenin her adımında canlı nokta bir taneyi aşmamalı,
 * kural hiçbir durumda oyuncuyu kilitlememeli, ve tetik çizilmeyen bir masada ateşlememeli.
 *
 * Doğrulaması: `node tools/mutasyon-sira-h2.mjs` (kaynağa kusur geri konur, bu dosya kırmızı
 * yanmazsa o kolun bekçisi yok demektir).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  tableUpgradeTarget,
  tableUpgradeUnlockedIn,
  tableSoftMaxLevel,
  revealKeys,
} from '../src/game/rules';
import { economyConfig as C, type GateState } from '../src/config/economy.config';
import { deriveWorld, areaOfTable, MAX_AREAS } from '../src/game/world';
import { LAYOUT } from '../src/game/layout';
import { useGame } from '../src/game/store';
import type { Vec3 } from '../src/game/types';

const TAVAN = tableSoftMaxLevel();

function gate(padsDone: string[], tableLevels: number[]): GateState {
  return {
    padsDone,
    tables: deriveWorld(padsDone).tables.length,
    stationLevel: 6,
    lifetime: 1e9,
    waiterServed: 1e6,
    tableLevels,
  };
}

/** Bütün pad'ler açık dünya — 20 masa, üç alanın da kapısı açık. */
const HEPSI = C.pads.map((p) => p.id);
const TUM_MASA = deriveWorld(HEPSI).tables.length;

/** Bugünkü ALAN kapısının canlı bıraktığı masalar (D-124 öncesi kural) — karşılaştırma için. */
function alanKapisiCanli(g: GateState): number[] {
  const out: number[] = [];
  for (let i = 0; i < g.tables; i++) {
    if (!tableUpgradeUnlockedIn(areaOfTable(i), g)) continue;
    if ((g.tableLevels?.[i] ?? 0) >= TAVAN) continue;
    out.push(i);
  }
  return out;
}

describe('D-124 — masa yükseltme sırası tek hedeflidir', () => {
  it('dünya tam açıkken bile aynı anda TEK masa canlıdır', () => {
    const seviyeler = Array.from({ length: TUM_MASA }, () => 0);
    const g = gate(HEPSI, seviyeler);
    // Kural devredeyken: 1. Bugünkü alan kapısı aynı durumda 20 masayı birden canlı bırakıyordu —
    // yani ölçüt kör değil, gerçekten daraltılmış bir şey ölçüyor.
    expect(alanKapisiCanli(g).length).toBe(TUM_MASA);
    expect(tableUpgradeTarget(g)).not.toBeNull();
    expect(typeof tableUpgradeTarget(g)).toBe('number');
  });

  it('"başladığını bitir": yarım masa, daha küçük indeksli el değmemiş masayı yener', () => {
    const seviyeler = Array.from({ length: TUM_MASA }, () => 0);
    seviyeler[3] = 2; // 4. masa yarım
    const g = gate(HEPSI, seviyeler);
    expect(tableUpgradeTarget(g)).toBe(3);
  });

  it('birden çok yarım masa varsa EN KÜÇÜK indeksli seçilir (eski kayıt kilitlenmez)', () => {
    const seviyeler = Array.from({ length: TUM_MASA }, () => 0);
    // Kapı gelmeden önce serbest sırayla oynanmış bir kayıt: beş masa yarım kalmış.
    seviyeler[2] = 1;
    seviyeler[5] = 3;
    seviyeler[7] = 2;
    seviyeler[11] = 1;
    seviyeler[18] = 2;
    const g = gate(HEPSI, seviyeler);
    expect(tableUpgradeTarget(g)).toBe(2);
  });

  it('tavana varmış masa hedef olamaz; sıra bir sonrakine geçer', () => {
    const seviyeler = Array.from({ length: TUM_MASA }, () => 0);
    seviyeler[0] = TAVAN;
    const g = gate(HEPSI, seviyeler);
    expect(tableUpgradeTarget(g)).toBe(1);
    seviyeler[1] = TAVAN;
    expect(tableUpgradeTarget(gate(HEPSI, seviyeler))).toBe(2);
  });

  it('hepsi tavandayken hedef YOKtur (null) — hayalet nokta çizilmez', () => {
    const seviyeler = Array.from({ length: TUM_MASA }, () => TAVAN);
    expect(tableUpgradeTarget(gate(HEPSI, seviyeler))).toBeNull();
  });

  it('hedef her zaman ALAN kapısı açık bir masadır', () => {
    // Yalnız 1. salon açık: 2-3. salonun masaları var ama kapıları kapalı.
    const pads = C.pads.map((p) => p.id).filter((id) => !id.startsWith('z2') && !id.startsWith('z3') && id !== 'zone2' && id !== 'zone3');
    const g = gate(pads, Array.from({ length: TUM_MASA }, () => 0));
    const hedef = tableUpgradeTarget(g);
    expect(hedef).not.toBeNull();
    expect(tableUpgradeUnlockedIn(areaOfTable(hedef!), g)).toBe(true);
    expect(hedef!).toBeLessThan(g.tables);
  });

  it('KAPALI salonun masası hedef OLAMAZ — 1. salon bitince sıra durur, taşmaz', () => {
    // ALAN kapısı ile MASA VARLIĞI aynı şey DEĞİL: 2. salonun masaları `z2table2/3` ile
    // AÇILIR, ama o salonun yükseltme kapısı `z2table4`i bekler. Yani arada bir pencere var:
    // masalar duruyor, kapıları henüz kapalı. Denetimin kurgusu tam o pencere — `g.tables`
    // sınırı kapıyı kendiliğinden taklit edemesin (yoksa denetim kapıyı ölçmüyor olurdu).
    const pads = ['table2', 'table3', 'table4', 'zone2', 'z2table2', 'z2table3'];
    const w = deriveWorld(pads);
    const acikMasa = w.tables.length;
    const salon1 = w.tables.filter((_, i) => areaOfTable(i) === 0).length;
    expect(acikMasa, 'kurguda 2. salonun masaları AÇIK olmalı').toBeGreaterThan(salon1);

    const g = gate(pads, []);
    expect(tableUpgradeUnlockedIn(0, g), '1. salonun kapısı açık olmalı').toBe(true);
    expect(tableUpgradeUnlockedIn(1, g), '2. salonun kapısı KAPALI olmalı').toBe(false);

    // 1. salon tamamen tavanda, 2. salonun (kapısı kapalı) masaları el değmemiş.
    const seviyeler = Array.from({ length: TUM_MASA }, (_, i) => (i < salon1 ? TAVAN : 0));
    expect(tableUpgradeTarget(gate(pads, seviyeler))).toBeNull();
  });

  it('KURALIN KENDİSİ: tüm ilerleme boyunca canlı nokta hiçbir adımda 1i aşmaz', () => {
    // Sıfırdan başlayıp her adımda hedefi bir seviye yükselterek yürü. Her adımda
    // "kaç masa canlı" sayılır. Bu, Scene'in o karede çizeceği masa noktası sayısıdır.
    const seviyeler = Array.from({ length: TUM_MASA }, () => 0);
    let enCok = 0;
    let adim = 0;
    const gorulen = new Set<number>();
    for (; adim < 500; adim++) {
      const g = gate(HEPSI, seviyeler);
      const hedef = tableUpgradeTarget(g);
      const canli = hedef == null ? 0 : 1;
      if (canli > enCok) enCok = canli;
      if (hedef == null) break;
      gorulen.add(hedef);
      seviyeler[hedef] += 1;
    }
    expect(enCok).toBe(1);
    // Yürüyüş gerçekten bitmiş olmalı (döngü sınırına dayanıp sahte "geçti" üretmesin).
    expect(adim).toBeLessThan(500);
    // ...ve bütün masalar sırayla hedef olmuş olmalı: kural hiçbir masayı ebediyen kilitlemiyor.
    expect(gorulen.size).toBe(TUM_MASA);
    expect(seviyeler.every((l) => l === TAVAN)).toBe(true);
    expect(adim).toBe(TUM_MASA * TAVAN);
  });

  it('sıra SOLDAN SAĞA teker teker ilerler: bir masa tavana varmadan sonraki başlamaz', () => {
    const seviyeler = Array.from({ length: TUM_MASA }, () => 0);
    for (let adim = 0; adim < TUM_MASA * TAVAN; adim++) {
      const hedef = tableUpgradeTarget(gate(HEPSI, seviyeler))!;
      // Hedeften SONRAKİ her masa el değmemiş olmalı (yarım bırakılmış ikinci masa olamaz).
      for (let j = hedef + 1; j < TUM_MASA; j++) expect(seviyeler[j]).toBe(0);
      seviyeler[hedef] += 1;
    }
  });

  it('bildirim ve kamera panı ÇİZİLEN masadan türer (alanın ilk masasından değil)', () => {
    const seviyeler = Array.from({ length: TUM_MASA }, () => 0);
    seviyeler[2] = 1; // canlı masa 3. masa — alanın İLK masası değil
    const g = gate(HEPSI, seviyeler);
    const anahtarlar = revealKeys(g, MAX_AREAS, [6]);
    const masa = anahtarlar.filter((k) => k[0].startsWith('tableUp:'));
    expect(masa).toHaveLength(1); // alan başına bir tane değil, TEK tane
    expect(masa[0][2]).toEqual(LAYOUT.tables[2].upgradeSpot);
  });

  it('hiç hedef yokken masa bildirimi de yoktur', () => {
    const seviyeler = Array.from({ length: TUM_MASA }, () => TAVAN);
    const anahtarlar = revealKeys(gate(HEPSI, seviyeler), MAX_AREAS, [6]);
    expect(anahtarlar.filter((k) => k[0].startsWith('tableUp:'))).toHaveLength(0);
  });

  it('gate.tableLevels verilmezse kural el değmemiş dünya gibi davranır (çökmez)', () => {
    const g: GateState = { padsDone: HEPSI, tables: TUM_MASA, stationLevel: 6, lifetime: 1e9 };
    expect(tableUpgradeTarget(g)).toBe(0);
  });
});

// =============================================================================================
//  GERÇEK TICK — tetik ÇİZİLEN tek noktadan türüyor mu?
//  (Yukarıdaki denetimler kuralı `rules.ts` düzeyinde koruyor. Buradakiler kuralın oyunda
//   GERÇEKTEN uygulandığını sınıyor: Scene ile tick aynı kaynağı okumazsa biri çizmediği
//   noktayı tetikler ve oyuncu görünmeyen bir yükseltmeyi satın alır.)
// =============================================================================================

/** 1. salonu tam açmış, parası bol, müşterisiz bir dünya kur. */
function salonSahnesi(seviyeler: number[]): void {
  const pads = ['table2', 'table3', 'table4'];
  useGame.setState({
    padsDone: pads,
    tableLevels: LAYOUT.tables.map((_, i) => seviyeler[i] ?? 0),
    tableUpgradeFills: LAYOUT.tables.map(() => 0),
    npcs: [], spawnTimer: 999,
    inputKeyboard: [0, 0], inputJoystick: [0, 0],
    // D-142: masa noktası yalnız masa görevinde canlı — bu testler SIRAYI sınar, kapıyı değil:
    // hat bitmiş kurulur (kapının bekçisi `tests/zincir-t8a.test.ts`).
    questIndex: C.quests.length, questPhase: 'active',
  });
  useGame.getState().addMoney(50_000);
}

/** Oyuncuyu masanın yükseltme noktasına koy, birkaç tik sür, o masanın dolumu aktı mı? */
function masaDoluyorMu(i: number): boolean {
  const pos = LAYOUT.tables[i].upgradeSpot;
  useGame.setState({ player: [pos[0], 0.6, pos[2]] as Vec3, inputKeyboard: [0, 0], inputJoystick: [0, 0] });
  for (let k = 0; k < 4; k++) useGame.getState().tick(0.05);
  return (useGame.getState().tableUpgradeFills[i] ?? 0) > 0;
}

describe('D-124 · gerçek tick — tetik yalnız ÇİZİLEN masada ateşler', () => {
  it('hedef masanın noktasında dolum AKAR', () => {
    salonSahnesi([0, 0, 0, 0]);
    const g = useGame.getState();
    const hedef = tableUpgradeTarget({
      padsDone: g.padsDone, tables: 4, stationLevel: 0,
      lifetime: g.lifetime.toNumber(), tableLevels: g.tableLevels,
    })!;
    expect(masaDoluyorMu(hedef)).toBe(true);
  });

  it('hedef OLMAYAN masanın noktasında dolum AKMAZ (eskiden akardı)', () => {
    salonSahnesi([0, 0, 0, 0]);
    const g = useGame.getState();
    const hedef = tableUpgradeTarget({
      padsDone: g.padsDone, tables: 4, stationLevel: 0,
      lifetime: g.lifetime.toNumber(), tableLevels: g.tableLevels,
    })!;
    // Aynı salonda, alan kapısı AÇIK, tavan altında bir başka masa. D-124 öncesinde burada
    // dolum akardı — ölçüt bu yüzden kör değil.
    const baska = [0, 1, 2, 3].find((i) => i !== hedef)!;
    expect(tableUpgradeUnlockedIn(areaOfTable(baska), {
      padsDone: g.padsDone, tables: 4, stationLevel: 0, lifetime: 1e9, tableLevels: g.tableLevels,
    })).toBe(true);
    expect(masaDoluyorMu(baska)).toBe(false);
  });

  it('hedef tavana varınca sıra bir sonraki masaya GEÇER (kilitlenme yok)', () => {
    salonSahnesi([TAVAN, 0, 0, 0]);
    expect(masaDoluyorMu(0)).toBe(false); // tavandaki masa artık tetiklemez
    expect(masaDoluyorMu(1)).toBe(true); // sıra ona geçti
  });

  it('yarım kalan masa, indeksi büyük olsa bile tetikler; komşusu tetiklemez', () => {
    salonSahnesi([0, 0, 2, 0]);
    expect(masaDoluyorMu(2)).toBe(true);
    expect(masaDoluyorMu(0)).toBe(false);
  });
});

// =============================================================================================
//  ÇİZİM TARAFI — KAYNAK DENETİMİ (davranış değil, YAPI)
//
//  Scene.tsx bir R3F ağacı; burada render edilmiyor. Bu yüzden aşağıdakiler DAVRANIŞ değil
//  YAPI denetimidir ve bunu saklamıyoruz: sınadıkları tek şey "çizen taraf da tetikleyenle
//  AYNI kaynağı okuyor mu". Bu bağ koparsa oyunda görünen ile çalışan ayrışır (12 nokta
//  çizilir, yalnız biri para alır) ve yukarıdaki tick denetimlerinin hiçbiri bunu göremez —
//  onlar tetiği ölçüyor, çizimi değil.
// =============================================================================================

const SCENE_KAYNAK = readFileSync('src/components/three/Scene.tsx', 'utf8');
/** Yorumları at — bir kuralı YORUMDA anlatmak onu uygulamak değildir. */
const yorumsuz = (t: string) =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const SCENE = yorumsuz(SCENE_KAYNAK);

describe('D-124 · çizen taraf tetikleyenle aynı kaynağı okuyor', () => {
  it('Scene masa noktasını `tableUpgradeTarget` ile seçer', () => {
    expect(SCENE).toContain('tableUpgradeTarget(gate)');
    expect(SCENE).toMatch(/i\s*!==\s*hedefMasa/);
  });

  it('Scene masa işareti için ARTIK alan kapısını taramaz', () => {
    // D-124 öncesi kalıp: her masa için `tableUpgradeUnlockedIn(areaOfTable(i), gate)`.
    expect(SCENE).not.toMatch(/tableUpgradeUnlockedIn\s*\(\s*areaOfTable/);
  });

  it('Scene kurala seviyeleri VERIR — tableLevels gate nesnesinin icinde', () => {
    // Scene'de birden çok `gate` nesnesi var (servis yükseltmesinin kendi gate'i de burada).
    // Denetim doğru olanı bulmalı: `tableUpgradeTarget(gate)` çağrısından ÖNCEKİ en yakın
    // gate tanımı. Yanlış satıra bakan bir denetim, kural bozulduğunda yeşil kalırdı.
    const cagri = SCENE.indexOf('tableUpgradeTarget(gate)');
    expect(cagri, 'Scene tableUpgradeTarget çağırmalı').toBeGreaterThan(0);
    const oncesi = SCENE.slice(0, cagri).split(String.fromCharCode(10));
    const satir = [...oncesi].reverse().find((l) => l.includes('const gate = {'));
    expect(satir, 'çağrıdan önce bir gate nesnesi kurulmalı').toBeTruthy();
    expect(satir!).toContain('tableLevels');
  });
});
