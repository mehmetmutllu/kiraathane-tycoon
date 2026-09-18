/**
 * onarim-g58-g81.test.ts — 2026-09-18 GERİ BİLDİRİMİNİN ONARIM TURU (T1) BEKÇİSİ.
 *
 * Kapsam: G-78 (kısmi ödenmiş yükseltme kayıtta durur) · G-69 (bulaşık tezgâhı mekanikle aynı
 * anda doğar) · G-70 (tezgâh yalnız ona gelen kapla kirlenir).
 * Kalemlerin tam metni: `docs/geribildirim-oyun-testi-2026-09-18.md`. Plan: `docs/plan-geribildirim-2026-09-18.md`.
 *
 * ── G-78 · KISMİ ÖDENMİŞ YÜKSELTME KAYITTA DURUR
 *
 * Kusur (kullanıcı, 2026-09-18): *"çay ocağında yükseltmede 800 altından 300'ünü falan ödeyerek
 * bıraktım, sonra da geri girdim; para zaten verilmişti ama yükseltmede sıfırdan başlıyordu."*
 *
 * Kök neden: `padFills` kayıt şemasındaydı ama `upgradeFills` / `tableUpgradeFills` / `lavaboFill`
 * DEĞİLDİ; `store.init` üçünü de her yüklemede 0'a çekiyordu. Para cüzdandan çıkmıştı → oyuncunun
 * ilerlemesi yanıyordu. CLAUDE.md: *"Kayıt: saveVersion + migrasyon. Şema değişince eski kayıt
 * migrate edilir; ilerleme kaybolmaz."*
 *
 * Şema EKLEMELİ değişti (`lavaboLevel` / `goalsClaimed` / `mastersOwned` deseni) → sürüm ARTMADI:
 * eksik alanı `defaultSave()` yayılımı doldurur, eski kayıt sağlam açılır. Bu dosya üç şeyi tutar:
 *   ① gidiş-dönüş: kaydedilen kısmi dolum yüklemede geri gelir,
 *   ② kelepçe: dolum, o slotun BUGÜNKÜ maliyetini aşamaz (bozuk kayıt / maliyet düşmesi),
 *   ③ geri uyum: alanları HİÇ taşımayan eski kayıt sıfırla açılır, patlamaz.
 */
import { describe, it, expect } from 'vitest';
import { economyConfig as C, tableUpgradeCost } from '../src/config/economy.config';
import { defaultSave, SAVE_VERSION } from '../src/game/save';
import { useGame, stationUpgradeCost } from '../src/game/store';
import { WASH_QUEST_INDEX, dishStationVisible, sinkDirty } from '../src/game/rules';

const KEY = 'kiraathane.save';

/** localStorage'ı bellek sözlüğüyle değiştirir (logic.test.ts / gorev-kimligi.test.ts deseni). */
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

describe('G-78 ① kısmi yükseltme dolumu gidiş-dönüşte kaybolmaz', () => {
  it('ocağın yarım ödenmiş yükseltmesi yüklemede geri gelir', () => {
    withStorage(null, () => {
      useGame.getState().hardReset();
      const seviye = useGame.getState().stationLevels[0] ?? 0;
      const yari = Math.floor(stationUpgradeCost(seviye) / 2);
      expect(yari).toBeGreaterThan(0);

      const fills = useGame.getState().upgradeFills.slice();
      fills[0] = yari;
      useGame.setState({ upgradeFills: fills });
      useGame.getState().saveNow();

      // Yeniden yükleme: eskiden burada 0 dönüyordu.
      useGame.getState().init();
      expect(useGame.getState().upgradeFills[0]).toBe(yari);
    });
  });

  it('masanın yarım ödenmiş yükseltmesi yüklemede geri gelir', () => {
    withStorage(null, () => {
      useGame.getState().hardReset();
      const yari = Math.floor(tableUpgradeCost(0, 0) / 2);
      expect(yari).toBeGreaterThan(0);

      const fills = useGame.getState().tableUpgradeFills.slice();
      fills[0] = yari;
      useGame.setState({ tableUpgradeFills: fills });
      useGame.getState().saveNow();

      useGame.getState().init();
      expect(useGame.getState().tableUpgradeFills[0]).toBe(yari);
    });
  });
});

describe('G-78 ② kelepçe: dolum bugünkü maliyeti aşamaz', () => {
  it('maliyetin üstünde yazılmış dolum, maliyete kırpılır', () => {
    withStorage(null, () => {
      useGame.getState().hardReset();
      const cost = stationUpgradeCost(useGame.getState().stationLevels[0] ?? 0);
      const fills = useGame.getState().upgradeFills.slice();
      fills[0] = cost * 10; // bozuk kayıt / denge turunda düşen maliyet
      useGame.setState({ upgradeFills: fills });
      useGame.getState().saveNow();

      useGame.getState().init();
      expect(useGame.getState().upgradeFills[0]).toBe(cost);
    });
  });

  it('negatif / sayı olmayan dolum 0 okunur', () => {
    withStorage(null, () => {
      useGame.getState().hardReset();
      useGame.getState().saveNow();
      const raw = JSON.parse(localStorage.getItem(KEY) as string);
      raw.upgradeFills = [-500, 'bozuk', null];
      raw.tableUpgradeFills = [Number.NaN];
      raw.lavaboFill = -1;
      localStorage.setItem(KEY, JSON.stringify(raw));

      useGame.getState().init();
      expect(useGame.getState().upgradeFills[0]).toBe(0);
      expect(useGame.getState().tableUpgradeFills[0]).toBe(0);
      expect(useGame.getState().lavaboFill).toBe(0);
    });
  });

  it('lavabo KAPALIYKEN dolum 0 kalır (kapalı oda için yarım ödeme doğamaz)', () => {
    withStorage(null, () => {
      useGame.getState().hardReset();
      useGame.setState({ lavaboFill: 999 });
      useGame.getState().saveNow();
      useGame.getState().init();
      // Taze kayıtta lavabo pad'i açılmamıştır → oda kapalı → dolum sıfırlanır.
      expect(useGame.getState().lavaboLevel).toBe(0);
      expect(useGame.getState().lavaboFill).toBe(0);
    });
  });
});

describe('G-78 ③ geri uyum: alanları taşımayan eski kayıt sağlam açılır', () => {
  it('upgradeFills/tableUpgradeFills/lavaboFill içermeyen kayıt sıfırla yüklenir', () => {
    const eski = { ...defaultSave(), saveVersion: SAVE_VERSION } as Record<string, unknown>;
    delete eski.upgradeFills;
    delete eski.tableUpgradeFills;
    delete eski.lavaboFill;
    withStorage(JSON.stringify(eski), () => {
      useGame.getState().init();
      const s = useGame.getState();
      expect(s.upgradeFills.every((x) => x === 0)).toBe(true);
      expect(s.tableUpgradeFills.every((x) => x === 0)).toBe(true);
      expect(s.lavaboFill).toBe(0);
      // Şema EKLEMELİ değişti: sürüm artmadı, yani eski kayıt sıfırlama yoluna DÜŞMEZ.
      expect(s.questIndex).toBe(0);
    });
  });

  it('kayıt şeması bu üç alanı gerçekten taşıyor (alan sessizce düşerse yakalanır)', () => {
    const d = defaultSave() as unknown as Record<string, unknown>;
    expect(Object.keys(d)).toEqual(expect.arrayContaining(['upgradeFills', 'tableUpgradeFills', 'lavaboFill']));
    expect(C.quests.length).toBeGreaterThan(0); // hat boşsa yukarıdaki questIndex iddiası anlamsız olurdu
  });
});

/**
 * G-69 / G-70 BEKÇİSİ — BULAŞIK TEZGÂHININ SAHNEDE OLUŞU VE KİRLİLİĞİ.
 *
 * İkisi de sunum katmanı ama ikisi de yanlış bir DURUM okuyordu, o yüzden saf yükleme olarak
 * `rules.ts`e alındı (bileşenin içinde kalsalar ölçülemezlerdi).
 */
describe('G-69 · bulaşık tezgâhı mekanikle aynı anda doğar', () => {
  it('kirli bardağın doğduğu görevden ÖNCE tezgâh sahnede değildir', () => {
    expect(WASH_QUEST_INDEX).toBeGreaterThan(0); // hat gerçekten bir washDish görevi taşıyor
    for (let i = 0; i < WASH_QUEST_INDEX; i++) expect(dishStationVisible(i)).toBe(false);
  });

  it('o görevden itibaren tezgâh sahnededir ve bir daha kaybolmaz', () => {
    for (let i = WASH_QUEST_INDEX; i <= C.quests.length; i++) expect(dishStationVisible(i)).toBe(true);
  });

  it('tezgâhın gate\'i kirli bardağın gate\'iyle AYNI eşiktir (iki yerde ayrı sayı yok)', () => {
    expect(dishStationVisible(WASH_QUEST_INDEX)).toBe(true);
    expect(dishStationVisible(WASH_QUEST_INDEX - 1)).toBe(false);
  });
});

describe('G-70 · tezgâh yalnız ona GELEN kapla kirlenir', () => {
  const bos = { carriedDirty: 0, carriedDirtyFood: 0, dishwasher: null };

  it('hiç kirli taşınmıyorsa tezgâh temizdir', () => {
    expect(sinkDirty(bos)).toBe(false);
  });

  it('oyuncunun tepsisindeki kirli tezgâhı kirletir', () => {
    expect(sinkDirty({ ...bos, carriedDirty: 1 })).toBe(true);
    expect(sinkDirty({ ...bos, carriedDirtyFood: 1 })).toBe(true);
  });

  it('bulaşıkçının leğenindeki kirli tezgâhı kirletir', () => {
    expect(sinkDirty({ ...bos, dishwasher: { tray: 2, trayFood: 0 } })).toBe(true);
    expect(sinkDirty({ ...bos, dishwasher: { tray: 0, trayFood: 0 } })).toBe(false);
  });

  it('MASADAKİ kirli bardak tezgâhı kirletmez (kusurun kendisi)', () => {
    // `sinkDirty` girdisi masadaki bardağı (store.dishes) HİÇ görmüyor — eski hâl onu sayıyordu
    // ve kullanıcı *"ben bulaşık bırakmasam bile kirli birikmeye başlıyor"* diye bildirdi.
    // Yüklemin imzasında o alan yoksa, geri gelmesi için imzayı değiştirmek gerekir.
    expect(Object.keys(bos)).not.toContain('dishes');
    expect(sinkDirty(bos)).toBe(false);
  });
});
