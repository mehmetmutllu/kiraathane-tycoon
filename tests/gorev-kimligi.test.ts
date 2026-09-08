/**
 * gorev-kimligi.test.ts — GÖREV HATTININ KİMLİĞİ (D2 / D-088) BEKÇİSİ.
 *
 * Neyi tutuyor: kayıt görev konumunu SIRA NUMARASIYLA değil KİMLİKLE saklar, ve o kimlikten
 * türetilen konum hattın değişmesine dayanıklıdır. Bu bir eşik listesi değil, üç davranış
 * sözleşmesi:
 *   ① index ↔ kimlik listesi gidiş-dönüşü kayıpsız (aynı hatta),
 *   ② hattın ORTASINA sonradan eklenen görev, oraya varmış bir kaydı GERİ ÇEKMEZ (kararın kendisi),
 *   ③ v31 kaydı ilerlemesini kaybetmeden v32'ye göç eder.
 * Ayrıca modelin sessiz ön koşulu: hattaki kimlikler BENZERSİZ olmalı.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { economyConfig as C, type QuestDef } from '../src/config/economy.config';
import { activeQuestIndex, completedQuestIds } from '../src/game/questProgress';
import { loadSave, defaultSave, SAVE_VERSION } from '../src/game/save';
import { useGame } from '../src/game/store';

const KEY = 'kiraathane.save';

/** localStorage'ı bellek sözlüğüyle değiştirir (logic.test.ts'teki desen). */
function withStorage(seed: string | null, fn: () => void): void {
  const mem: Record<string, string> = {};
  if (seed != null) mem[KEY] = seed;
  const g = globalThis as Record<string, unknown>;
  const orig = g.localStorage;
  g.localStorage = {
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
  try { fn(); } finally { if (orig === undefined) delete g.localStorage; else g.localStorage = orig; }
}

/** Sentetik hat — gerçek hattın sırası değişse de bu testler aynı şeyi ölçsün. */
const q = (id: string): QuestDef =>
  ({ id, title: id, target: { type: 'collectCoin', count: 1 }, reward: 0 }) as QuestDef;
const HAT = ['a', 'b', 'c', 'd', 'e'].map(q);

describe('D-088 ① index ↔ kimlik gidiş-dönüşü', () => {
  it('gerçek hattın HER konumu kayıpsız dönüyor (0 … length)', () => {
    for (let i = 0; i <= C.quests.length; i++) {
      expect(activeQuestIndex(C.quests, completedQuestIds(C.quests, i))).toBe(i);
    }
  });

  it('hat bitmiş kayıt "bitti" olarak kalır (length döner, 0a düşmez)', () => {
    const done = completedQuestIds(C.quests, C.quests.length);
    expect(done).toHaveLength(C.quests.length);
    expect(activeQuestIndex(C.quests, done)).toBe(C.quests.length);
  });

  it('bozuk/aşırı index kelepçelenir (negatif → boş, taşan → tam hat)', () => {
    expect(completedQuestIds(C.quests, -5)).toEqual([]);
    expect(completedQuestIds(C.quests, 9999)).toHaveLength(C.quests.length);
    expect(completedQuestIds(C.quests, Number.NaN)).toEqual([]);
  });

  it('boş liste = taze oyun (ilk görev)', () => {
    expect(activeQuestIndex(C.quests, [])).toBe(0);
  });

  it('MODELİN ÖN KOŞULU: hattaki görev kimlikleri BENZERSİZ', () => {
    const ids = C.quests.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('D-088 ② hat değişince ilerleme GERİYE gitmez', () => {
  it('ORTAYA eklenen görev, oraya varmış kaydı geri çekmez (atlanır)', () => {
    const done = completedQuestIds(HAT, 4); // a b c d bitti, sırada e
    const yeni = [HAT[0], HAT[1], q('YENI'), HAT[2], HAT[3], HAT[4]];
    expect(activeQuestIndex(yeni, done)).toBe(5); // hâlâ 'e'
    expect(yeni[activeQuestIndex(yeni, done)].id).toBe('e');
  });

  it('SONA eklenen görev normal şekilde sıraya girer', () => {
    const done = completedQuestIds(HAT, HAT.length); // hat bitmişti
    const yeni = [...HAT, q('YENI')];
    expect(yeni[activeQuestIndex(yeni, done)].id).toBe('YENI');
  });

  it('ÖNDEKİ (henüz varılmamış) göreve ekleme normal oynanır', () => {
    const done = completedQuestIds(HAT, 2); // a b bitti, sırada c
    const yeni = [HAT[0], HAT[1], HAT[2], q('YENI'), HAT[3], HAT[4]];
    expect(yeni[activeQuestIndex(yeni, done)].id).toBe('c');
    const sonra = completedQuestIds(yeni, 3); // c de bitti
    expect(yeni[activeQuestIndex(yeni, sonra)].id).toBe('YENI');
  });

  it('SİLİNEN görev konumu bozmaz (kalan kimliklerden okunur)', () => {
    const done = completedQuestIds(HAT, 3); // a b c bitti, sırada d
    const yeni = HAT.filter((x) => x.id !== 'b'); // 'b' hattan çıktı
    expect(yeni[activeQuestIndex(yeni, done)].id).toBe('d');
  });

  it('YENİDEN ADLANDIRILAN görev kaydı başa atmaz (komşu kimlikler taşır)', () => {
    const done = completedQuestIds(HAT, 3);
    const yeni = HAT.map((x) => (x.id === 'b' ? q('b2') : x));
    expect(yeni[activeQuestIndex(yeni, done)].id).toBe('d');
  });

  it('hattın TAMAMI yeniden adlandırılırsa taze oyuna düşer (tanınan kimlik yok)', () => {
    const done = completedQuestIds(HAT, 3);
    const yeni = HAT.map((x) => q(`x_${x.id}`));
    expect(activeQuestIndex(yeni, done)).toBe(0);
  });
});

describe('D-088 ③ v31 → v32 göçü (ilerleme kaybolmaz)', () => {
  beforeEach(() => { useGame.setState({ questIndex: 0, questBase: 0 }); });

  it('eski questIndex kimliklere çevrilir ve AYNI göreve oturur', () => {
    const eski = 12;
    withStorage(JSON.stringify({
      ...defaultSave(), saveVersion: 31, questsDone: undefined,
      questIndex: eski, questBase: 7, wallet: '5000', padsDone: ['table2', 'table3'],
      lastSaved: Date.now(),
    }), () => {
      const s = loadSave();
      expect(s.saveVersion).toBe(SAVE_VERSION);
      expect(s.wallet).toBe('5000');                       // ilerleme KAYBOLMADI (sıfırlama değil)
      expect(s.padsDone).toEqual(['table2', 'table3']);
      expect(s.questsDone).toEqual(C.quests.slice(0, eski).map((x) => x.id));
      expect(activeQuestIndex(C.quests, s.questsDone)).toBe(eski);
      expect(s.questBaseId).toBe(C.quests[eski].id);       // taban sahibi = aktif görev
      expect(s.questBase).toBe(7);
      expect('questIndex' in s).toBe(false);               // eski alan kayda geri sızmaz
    });
  });

  it('v31 kaydı hattı BİTİRMİŞSE bitmiş olarak gelir', () => {
    withStorage(JSON.stringify({
      ...defaultSave(), saveVersion: 31, questsDone: undefined,
      questIndex: C.quests.length, questBase: 0, lastSaved: Date.now(),
    }), () => {
      const s = loadSave();
      expect(s.questsDone).toHaveLength(C.quests.length);
      expect(s.questBaseId).toBe('');
    });
  });

  it('v31den ESKİ kayıt hâlâ SIFIRLANIR (göç yalnız 31i alır — D-058 yerinde)', () => {
    withStorage(JSON.stringify({
      saveVersion: 30, wallet: '9999', questIndex: 20, lastSaved: Date.now(),
    }), () => {
      const s = loadSave();
      expect(s.saveVersion).toBe(SAVE_VERSION);
      expect(s.wallet).toBe('0');
      expect(s.questsDone).toEqual([]);
    });
  });
});

describe('D-088 ④ kayıt ↔ oyun turu', () => {
  it('oyundaki konum kaydedilip yüklenince BİREBİR geri geliyor', () => {
    withStorage(null, () => {
      const idx = 9;
      useGame.getState().hardReset();
      useGame.setState({ questIndex: idx, questBase: 4 });
      useGame.getState().saveNow();
      const s = loadSave();
      expect(s.questsDone).toEqual(C.quests.slice(0, idx).map((x) => x.id));
      expect(s.questBaseId).toBe(C.quests[idx].id);
      useGame.getState().init();
      expect(useGame.getState().questIndex).toBe(idx);
      expect(useGame.getState().questBase).toBe(4);
    });
  });

  it('taban BAYATSA (sahibi başka görev) sıfırdan kurulur — delta 0', () => {
    withStorage(null, () => {
      useGame.getState().hardReset();
      const idx = C.quests.findIndex((x) => x.target.type === 'collectCoin');
      expect(idx).toBeGreaterThanOrEqual(0);
      useGame.setState({ questIndex: idx, questBase: 0 });
      useGame.getState().saveNow();
      // Kayıt yazıldıktan SONRA sayaç ilerledi ve taban başka bir göreve etiketlendi:
      const raw = JSON.parse(localStorage.getItem(KEY) as string);
      raw.questBaseId = 'q_baska_bir_gorev';
      raw.questBase = 0;
      raw.stats = { ...raw.stats, coinsCollected: 41 };
      localStorage.setItem(KEY, JSON.stringify(raw));
      useGame.getState().init();
      // Taban bayat olduğu için 0 değil GÜNCEL sayaç değeri olur → görev sıfırdan sayar.
      expect(useGame.getState().questIndex).toBe(idx);
      expect(useGame.getState().questBase).toBe(41);
      expect(useGame.getState().quest?.cur).toBe(0);
    });
  });

  it('taban SAHİBİYSE olduğu gibi korunur (bayat sanılıp sıfırlanmaz)', () => {
    withStorage(null, () => {
      useGame.getState().hardReset();
      const idx = C.quests.findIndex((x) => x.target.type === 'collectCoin');
      useGame.setState({ questIndex: idx, questBase: 0 });
      useGame.getState().saveNow();
      const raw = JSON.parse(localStorage.getItem(KEY) as string);
      raw.questBase = 30;
      raw.stats = { ...raw.stats, coinsCollected: 41 };
      localStorage.setItem(KEY, JSON.stringify(raw));
      useGame.getState().init();
      expect(useGame.getState().questBase).toBe(30);
      // cur = 41 − 30 = 11, hedefe (count) kelepçelenir → dolu görünür; bayat hâlde 0 idi.
      expect(useGame.getState().quest?.cur).toBe(C.quests[idx].target.type === 'collectCoin' ? 1 : 0);
    });
  });
});
