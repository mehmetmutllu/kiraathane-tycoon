/**
 * gorev-hatti-t2.test.ts — "HEPSİ TEK SIRA HATTI" BEKÇİSİ (G-59 · G-60, 2026-09-18).
 *
 * Kullanıcı aynı şeyi dört ayrı cümleyle söyledi ve dördü tek sistem:
 *   *"Diğer görev tostu gelmeden direkt görevin pedi açılabiliyor"*
 *   *"yeni görev kartı geldikten sonra ikinci masa pedi açılacak ve oraya zum atılacak"*
 *   *"uyarı geldiği anda altta biten göreve de var — onların bir sıralaması olması gerekiyor"*
 *   *"Bir nevi bunların hepsini tek sıra hattındaymış gibi düşünebilirsin"*
 *
 * ## Kusurun kökü (kod)
 * `questIndex` hedef karşılanır karşılanmaz ilerler ve bu BİLEREK böyle (yoksa 1,3 sn'lik kutlama
 * penceresinde yapılan eylem yeni görevin tabanına yazılırdı — q_coin dominosu). Ama dünyayı
 * çizen/tetikleyen her yer o HAM sayıyı okuyordu: kart hâlâ biten görevi yazarken pad çoktan
 * belirmiş, kenar oku çoktan yeni hedefe atlamış oluyordu.
 *
 * ## Kural
 * Dünya, KARTIN gösterdiği görevi gösterir (`cardQuestIndex`). Pencere kapanınca kart · pad ·
 * kamera AYNI karede yeni göreve geçer. Reveal uyarıları da pencerede beklerler (silinmezler).
 *
 * Bu, G-41…G-44'ün (2026-09-16) devamıdır; o tur kamerayı hizaladı, pad'i ve uyarıyı bırakmıştı.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { economyConfig as C } from '../src/config/economy.config';
import { cardQuestIndex, questInTransition, visiblePads } from '../src/game/rules';
import { ekranKanali, type EkranGirdisi } from '../src/game/ekranKanali';
import { useGame } from '../src/game/store';
import type { Vec3 } from '../src/game/types';

const qIdx = (id: string) => C.quests.findIndex((q) => q.id === id);

beforeEach(() => {
  useGame.getState().hardReset();
});

describe('G-59 ① cardQuestIndex — dünya KARTIN görevini gösterir', () => {
  it('pencere dışında ham index ile aynıdır', () => {
    expect(cardQuestIndex({ questIndex: 7, questPhase: 'active', questDoneIndex: -1 })).toBe(7);
    expect(cardQuestIndex({ questIndex: 7, questPhase: 'active', questDoneIndex: 6 })).toBe(7);
  });

  it('kutlama/boşluk penceresinde BİTEN görevi gösterir', () => {
    expect(cardQuestIndex({ questIndex: 7, questPhase: 'completing', questDoneIndex: 6 })).toBe(6);
    expect(cardQuestIndex({ questIndex: 7, questPhase: 'gap', questDoneIndex: 6 })).toBe(6);
  });

  it('biten görev bilinmiyorsa (doneIndex −1) ham index\'e düşer — kilitlenmez', () => {
    expect(cardQuestIndex({ questIndex: 7, questPhase: 'completing', questDoneIndex: -1 })).toBe(7);
  });

  it('geçiş penceresi yalnız active DIŞINDA açıktır', () => {
    expect(questInTransition({ questPhase: 'active' })).toBe(false);
    expect(questInTransition({ questPhase: 'completing' })).toBe(true);
    expect(questInTransition({ questPhase: 'gap' })).toBe(true);
  });
});

describe('G-59 ② yeni görevin pad\'i kutlama penceresinde BELİRMEZ', () => {
  /** `table2` görevi bittikten sonraki durum: sıradaki görev q_charTray1, ama kart hâlâ table2'de. */
  const gate = {
    padsDone: ['table2'],
    tables: 2,
    stationLevel: 0,
    lifetime: 100,
    waiterServed: 0,
    tableLevels: [] as number[],
  };

  it('pencere içinde omurga pad\'i çizilmez, pencere kapanınca çizilir', () => {
    const i2 = qIdx('q_table2');
    const i3 = qIdx('q_table3');
    expect(i2).toBeGreaterThanOrEqual(0);
    expect(i3).toBeGreaterThan(i2);

    // q_table3 aktifken table3 pad'i görünür (referans).
    expect(visiblePads(i3, gate).map((p) => p.id)).toContain('table3');

    // Ama q_table2'nin kutlaması sürerken kart hâlâ table2'yi gösteriyor → yeni pad YOK.
    const pencere = cardQuestIndex({ questIndex: i3, questPhase: 'completing', questDoneIndex: i2 });
    expect(visiblePads(pencere, gate).map((p) => p.id)).not.toContain('table3');
    // Biten pad de geri gelmez (padsDone'da).
    expect(visiblePads(pencere, gate).map((p) => p.id)).not.toContain('table2');
  });

  it('GERÇEK tick: pad kutlama boyunca yok, pencere kapanınca var', () => {
    const i3 = qIdx('q_table3');
    const i2 = qIdx('q_table2');
    useGame.setState({
      padsDone: ['table2'],
      questIndex: i3,
      questDoneIndex: i2,
      questPhase: 'completing',
      questPhaseT: 0.5,
      questBase: 0,
      player: [0, 0.6, 0] as Vec3,
      inputKeyboard: [0, 0],
      inputJoystick: [0, 0],
    });
    useGame.getState().tick(0.05);
    // Pad listesi store'da durmuyor (her karede türetiliyor) → tick'in yaptığı ÇAĞRININ aynısı
    // burada yapılır; ikisi aynı fonksiyonu okuduğu için ayrışamazlar.
    const g = useGame.getState();
    const gateCanli = {
      padsDone: g.padsDone,
      tables: g.tables,
      stationLevel: g.stationLevels[0],
      lifetime: g.lifetime.toNumber(),
      waiterServed: g.stats.waiterServed,
      tableLevels: g.tableLevels,
    };
    expect(visiblePads(cardQuestIndex(g), gateCanli).map((p) => p.id)).not.toContain('table3');

    // Pencereyi akıt.
    for (let i = 0; i < 40 && useGame.getState().questPhase !== 'active'; i++) useGame.getState().tick(0.1);
    const g2 = useGame.getState();
    expect(g2.questPhase).toBe('active');
    expect(visiblePads(cardQuestIndex(g2), { ...gateCanli, padsDone: g2.padsDone }).map((p) => p.id)).toContain('table3');
  });

  it('tick de, çizim de AYNI çağrıdan geçer (iki kaynak ayrışamaz)', () => {
    // S23'ün dersi: "ad import edilmiş" testi yeşil tutuyordu. Burada ADIN varlığı değil,
    // HAM `questIndex` ile pad sorulmadığı denetleniyor.
    const tick = readSrc('src/game/tick.ts');
    const pad = readSrc('src/components/three/Pad.tsx');
    expect(tick).toContain('visiblePads(cardQuestIndex(c)');
    expect(pad).toContain('useGame(cardQuestIndex)');
    expect(tick).not.toMatch(/visiblePads\(\s*questIndex\s*,/);
    expect(pad).not.toMatch(/visiblePads\(\s*s\.questIndex\s*,/);
  });
});

describe('G-60 ③ ekran kanalları tek sıradan geçer', () => {
  const bos: EkranGirdisi = {
    cevrimdisiVar: false,
    ustaVar: false,
    panelAcik: false,
    bildirimVar: false,
    gecisPenceresi: false,
    karakterIpucuHazir: false,
    tepsiIpucuHazir: false,
  };

  it('hiçbir koşul yoksa ekran serbesttir', () => {
    expect(ekranKanali(bos)).toBeNull();
  });

  it('çevrimdışı ekranı her şeyin üstündedir (G-79 ile aynı kural)', () => {
    expect(ekranKanali({ ...bos, cevrimdisiVar: true, ustaVar: true, tepsiIpucuHazir: true })).toBe('cevrimdisi');
  });

  it('Usta modali ipucuların üstünde, çevrimdışının altındadır', () => {
    expect(ekranKanali({ ...bos, ustaVar: true, karakterIpucuHazir: true })).toBe('usta');
  });

  it('İPUCU SIRA BEKLER: bildirim ekrandayken çıkmaz', () => {
    expect(ekranKanali({ ...bos, tepsiIpucuHazir: true })).toBe('ipucu-tepsi');
    expect(ekranKanali({ ...bos, tepsiIpucuHazir: true, bildirimVar: true })).toBeNull();
  });

  it('İPUCU SIRA BEKLER: görev kutlaması sürerken çıkmaz (kullanıcının "o anda hiçbir görev olmamalı"sı)', () => {
    expect(ekranKanali({ ...bos, tepsiIpucuHazir: true, gecisPenceresi: true })).toBeNull();
    expect(ekranKanali({ ...bos, karakterIpucuHazir: true, gecisPenceresi: true })).toBeNull();
  });

  it('panel açıkken ipucu çıkmaz', () => {
    expect(ekranKanali({ ...bos, karakterIpucuHazir: true, panelAcik: true })).toBeNull();
  });

  it('iki ipucu hazırsa karakter ipucu önce gelir (talimat > kolaylık)', () => {
    expect(ekranKanali({ ...bos, karakterIpucuHazir: true, tepsiIpucuHazir: true })).toBe('ipucu-karakter');
  });

  it('HUD kendi koşulunu kurmuyor — kanalı tek yerden soruyor', () => {
    const hud = readSrc('src/components/ui/HUD.tsx');
    expect(hud).toContain('ekranKanali({');
    // Üç kanalın da TEK karardan türediği denetlenir. Eski hâlde bunlar elle yazılmış
    // `&& !showOffline && !spotlight` zincirleriydi; biri unutulduğunda iki kanal birden açılıyordu.
    expect(hud).toMatch(/const showOffline = kanal === 'cevrimdisi';/);
    expect(hud).toMatch(/const spotlight = kanal === 'ipucu-karakter';/);
    expect(hud).toMatch(/const traySpot = kanal === 'ipucu-tepsi';/);
    expect(hud).toMatch(/kanal === 'usta'/); // Usta modali de aynı karardan
  });
});

// --- yardımcı ---------------------------------------------------------------
import { readFileSync } from 'node:fs';
function readSrc(p: string): string {
  return readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
}
