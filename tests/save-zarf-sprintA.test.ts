/**
 * BEKÇİ — Sprint A ③ kayıt sağlamlığı (`src/game/save.ts`).
 * Zarf `{...kayıt, zarf: {v, n, sum}}` · dönen yedekler (≈5 dk, yalnız sağlam kayıttan) · bozuk kayıt
 * karantinası · SESSİZ SIFIRLAMA YOK (ham veri durur + oyuncuya not) · eski zarfsız kayıt kayıpsız ·
 * NaN cüzdan reddedilir · doğrulama dizileri/sözlükleri eleman bazında temizler · sifirlamaNo.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSave, defaultSave, kayitCoz, kayitDogrula, kayitKilitli, kayitMetni, kayitMetniCoz, kayitSorunu,
  karantinadakiKayit, loadSave, SAVE_VERSION, writeSave, type SaveData,
} from '../src/game/save';
import { kalicilikBekle, kalicilikHazirla, type TercihDeposu } from '../src/game/kalicilik';

const KEY = 'kiraathane.save';
const Y = (i: number) => `${KEY}.yedek.${i}`;
let mem: Record<string, string>;

beforeEach(async () => {
  mem = {};
  (globalThis as Record<string, unknown>).localStorage = {
    get length() { return Object.keys(mem).length; },
    key: (i: number) => Object.keys(mem)[i] ?? null,
    getItem: (k: string) => (k in mem ? mem[k] : null),
    setItem: (k: string, v: string) => { mem[k] = v; },
    removeItem: (k: string) => { delete mem[k]; },
  };
  await kalicilikHazirla(null);
});
afterEach(() => vi.useRealTimers());

const kayit = (o: Partial<SaveData> = {}): SaveData => ({ ...defaultSave(), ...o });
const zarf = (ham: string) => (JSON.parse(ham) as { zarf: { v: number; n: number; sum: string } }).zarf;

describe('zarf + sağlama', () => {
  it('yazılan kayıt zarflı; gövde üst düzeyde okunur (duman/test okuyucuları değişmez)', () => {
    loadSave();
    writeSave(kayit({ wallet: '1234', kafeAdi: 'Çınar' }));
    const z = zarf(mem[KEY]);
    expect(z.v).toBe(1);
    expect(z.sum).toMatch(/^[0-9a-f]{8}$/);
    expect(JSON.parse(mem[KEY]).wallet).toBe('1234');
    expect(JSON.parse(mem[KEY]).kafeAdi).toBe('Çınar');
    const d = loadSave();
    expect(d.wallet).toBe('1234');
    expect(d).not.toHaveProperty('zarf');
    expect(kayitSorunu()).toBeNull();
  });

  it('sayaç her yazımda artar, yüklemeden sonra kaldığı yerden sürer', () => {
    loadSave();
    writeSave(kayit());
    writeSave(kayit());
    const n = zarf(mem[KEY]).n;
    expect(n).toBeGreaterThanOrEqual(2);
    loadSave();
    writeSave(kayit());
    expect(zarf(mem[KEY]).n).toBe(n + 1);
  });

  it('kayitMetniCoz: sağlam metin çözülür; tek karakteri değişmiş metin reddedilir', () => {
    const m = kayitMetni(kayit({ lifetime: '500' }), 3);
    expect(kayitMetniCoz(m)?.data.lifetime).toBe('500');
    expect(kayitMetniCoz(m.replace('"lifetime":"500"', '"lifetime":"900"'))).toBeNull();
    expect(kayitMetniCoz(m.slice(0, 40))).toBeNull();
  });
});

describe('eski (zarfsız) kayıt kayıpsız açılır', () => {
  it('güncel sürümlü düz JSON: ilerleme aynen, not yok', () => {
    mem[KEY] = JSON.stringify(kayit({ wallet: '777', padsDone: ['p1'], xp: 42 }));
    const d = loadSave();
    expect(d.wallet).toBe('777');
    expect(d.padsDone).toEqual(['p1']);
    expect(d.xp).toBe(42);
    expect(d.sifirlamaNo).toBe(0);
    expect(kayitSorunu()).toBeNull();
  });
  it('v33 düz JSON göç zincirinden geçer', () => {
    mem[KEY] = JSON.stringify({ ...kayit({ lifetime: '9000' }), saveVersion: 33, waiterUpgrades: { tray: 2, speed: 0, dishCarry: 0, dishSpeed: 0 } });
    const d = loadSave();
    expect(d.saveVersion).toBe(SAVE_VERSION);
    expect(d.lifetime).toBe('9000');
    expect(d.waiterUpgrades.tray).toBe(1);
  });
  it('daha yeni sürümlü kayıt: okunur, yazma kilidi (A5) zarflı kayıtta da çalışır', () => {
    mem[KEY] = kayitMetni({ ...kayit({ wallet: '5' }), saveVersion: SAVE_VERSION + 1 }, 9);
    const once = mem[KEY];
    expect(loadSave().wallet).toBe('5');
    expect(kayitKilitli()).toBe(true);
    writeSave(kayit());
    expect(mem[KEY]).toBe(once);
    clearSave();
  });
});

describe('bozuk kayıt: yedek + karantina, sessiz sıfırlama yok', () => {
  it('sağlaması tutmayan ana kayıt → son sağlam yedek; ham veri karantinada', () => {
    mem[Y(0)] = kayitMetni(kayit({ wallet: '100', lifetime: '100' }), 4);
    const ana = kayitMetni(kayit({ wallet: '150', lifetime: '150' }), 5).replace('"wallet":"150"', '"wallet":"999999"');
    mem[KEY] = ana;
    const d = loadSave();
    expect(d.wallet).toBe('100');
    expect(kayitSorunu()).toBe('yedekten');
    expect(JSON.parse(karantinadakiKayit()!).ana).toBe(ana);
    // Sonraki yazım ana kaydı ezer ama karantina durur.
    writeSave(d);
    expect(JSON.parse(karantinadakiKayit()!).ana).toBe(ana);
  });

  it('yarım yazılmış (JSON değil) ana, yedek yok → baştan başlar AMA ham veri durur ve not çıkar', () => {
    const ana = kayitMetni(kayit({ wallet: '5000' }), 7).slice(0, 120);
    mem[KEY] = ana;
    const d = loadSave();
    expect(d.wallet).toBe('0');
    expect(kayitSorunu()).toBe('sifirdan');
    expect(JSON.parse(mem[`${KEY}.bozuk`]).ana).toBe(ana);
    writeSave(d);
    expect(JSON.parse(mem[`${KEY}.bozuk`]).ana).toBe(ana);
  });

  it('yedekler de bozuksa ham yedekler de karantinaya girer', () => {
    mem[KEY] = '{"wallet":';
    mem[Y(0)] = 'çöp';
    mem[Y(1)] = '{}x';
    loadSave();
    const k = JSON.parse(karantinadakiKayit()!);
    expect(k.yedekler).toEqual(['çöp', '{}x', null]);
    expect(kayitSorunu()).toBe('sifirdan');
  });

  it('en taze sağlam yedek seçilir (büyük n)', () => {
    mem[KEY] = 'bozuk';
    mem[Y(0)] = kayitMetni(kayit({ wallet: '300' }), 9);
    mem[Y(1)] = kayitMetni(kayit({ wallet: '200' }), 8);
    mem[Y(2)] = 'bozuk-yedek';
    expect(loadSave().wallet).toBe('300');
  });
});

describe('NaN cüzdan', () => {
  it('NaN cüzdanlı ana kayıt yüklenmez, sağlam yedeğe düşülür', () => {
    mem[Y(0)] = kayitMetni(kayit({ wallet: '80' }), 1);
    mem[KEY] = kayitMetni(kayit({ wallet: 'NaN' }), 2);
    expect(loadSave().wallet).toBe('80');
    expect(kayitSorunu()).toBe('yedekten');
  });
  it('yedek yoksa: kayıt onarılarak açılır (cüzdan 0, gerisi korunur) + not', () => {
    mem[KEY] = kayitMetni(kayit({ wallet: 'NaN', padsDone: ['p1', 'p2'], xp: 300 }), 2);
    const d = loadSave();
    expect(d.wallet).toBe('0');
    expect(d.padsDone).toEqual(['p1', 'p2']);
    expect(d.xp).toBe(300);
    expect(kayitSorunu()).toBe('onarildi');
  });
  it('kayitCoz Decimal alanları reddeder: NaN · Infinity · negatif · boş', () => {
    for (const w of ['NaN', 'Infinity', '-5', '', 'abc']) {
      expect(kayitCoz({ ...kayit(), wallet: w }).red).toEqual(['wallet']);
    }
    expect(kayitCoz({ ...kayit(), diamonds: 'NaN', lifetime: '1e400' }).red).toEqual(['diamonds']);
  });
});

describe('kayitDogrula: eleman bazında temizlik', () => {
  it('sayı dizileri ≥ 0, küme dizileri yalnız metin, sözlükler yalnız tutan değer', () => {
    const ham = {
      ...kayit(),
      upgradeFills: [-500, 'bozuk', null, 40],
      stationLevels: [1, NaN, 3],
      padsDone: ['a', 5, null, 'b'],
      padFills: { a: 10, b: -3, c: 'x' },
      dekor: { y1: 'lamba', y2: 7 },
      floorThemeByArea: ['parke', 3, 'mermer'],
      stats: { ...kayit().stats, teasServedByArea: [2, -1, 'x'] },
      satin: { ...kayit().satin, islenen: ['t1', 2], islemElmas: { t1: 25, t2: 'x' } },
    } as unknown as SaveData;
    const { data, red } = kayitDogrula(ham);
    expect(red).toEqual([]);
    expect(data.upgradeFills).toEqual([0, 0, 0, 40]);
    expect(data.stationLevels).toEqual([1, 0, 3]);
    expect(data.padsDone).toEqual(['a', 'b']);
    expect(data.padFills).toEqual({ a: 10 });
    expect(data.dekor).toEqual({ y1: 'lamba' });
    expect(data.floorThemeByArea).toEqual(['parke', '', 'mermer']); // index kaymaz
    expect(data.stats.teasServedByArea).toEqual([2, 0, 0]);
    expect(data.satin.islenen).toEqual(['t1']);
    expect(data.satin.islemElmas).toEqual({ t1: 25 });
  });

  it('satın alım uzlaşma alanları: yoksa DOLDURULMAZ, varsa yaz/oku turunda korunur, bozuksa atılır', () => {
    loadSave();
    writeSave(kayit());
    expect(loadSave().satin).not.toHaveProperty('uzlasmaBasi');
    const satin = { ...kayit().satin, uzlasmaBasi: 1_700_000_000_000, baslangicElmas: true, hakKimlik: 'rc-1' };
    writeSave(kayit({ satin }));
    expect(loadSave().satin).toMatchObject({ uzlasmaBasi: 1_700_000_000_000, baslangicElmas: true, hakKimlik: 'rc-1' });
    const bozuk = kayitDogrula(kayit({ satin: { ...satin, uzlasmaBasi: 'dün' as unknown as number, hakKimlik: 5 as unknown as string } })).data.satin;
    expect(bozuk).not.toHaveProperty('uzlasmaBasi');
    expect(bozuk).not.toHaveProperty('hakKimlik');
    expect(bozuk.baslangicElmas).toBe(true);
  });
});

describe('dönen yedekler', () => {
  it('≈5 dk aralıkla, yalnız sağlam ana kayıttan; yedek.0 en yeni', () => {
    vi.useFakeTimers({ now: 1_000_000_000_000 });
    loadSave(); // yedek yok → ilk yedek bu oturumun 5. dakikasında
    writeSave(kayit({ wallet: '1' }));
    vi.advanceTimersByTime(60_000);
    writeSave(kayit({ wallet: '2' }));
    expect(mem[Y(0)]).toBeUndefined();
    vi.advanceTimersByTime(5 * 60_000);
    writeSave(kayit({ wallet: '3' })); // ana ('2') → yedek.0
    expect(JSON.parse(mem[Y(0)]).wallet).toBe('2');
    vi.advanceTimersByTime(60_000);
    writeSave(kayit({ wallet: '4' })); // aralık dolmadı
    expect(JSON.parse(mem[Y(0)]).wallet).toBe('2');
    vi.advanceTimersByTime(5 * 60_000);
    writeSave(kayit({ wallet: '5' }));
    vi.advanceTimersByTime(5 * 60_000);
    writeSave(kayit({ wallet: '6' }));
    vi.advanceTimersByTime(5 * 60_000);
    writeSave(kayit({ wallet: '7' }));
    expect([0, 1, 2].map((i) => JSON.parse(mem[Y(i)]).wallet)).toEqual(['6', '5', '4']);
    expect(mem[Y(3)]).toBeUndefined();
  });

  it('bozuk ana kayıt yedeğe KOPYALANMAZ', () => {
    vi.useFakeTimers({ now: 2_000_000_000_000 });
    mem[Y(0)] = kayitMetni(kayit({ wallet: '50' }), 1);
    loadSave();
    mem[KEY] = 'bozuk';
    vi.advanceTimersByTime(10 * 60_000);
    writeSave(kayit({ wallet: '60' }));
    expect(JSON.parse(mem[Y(0)]).wallet).toBe('50');
    expect(mem[Y(1)]).toBeUndefined();
  });

  it('açılışta yedek sayacı yedek.0\'dan okunur: eski yedek varsa ilk yazım hemen döndürür', () => {
    vi.useFakeTimers({ now: 3_000_000_000_000 });
    mem[Y(0)] = kayitMetni({ ...kayit({ wallet: '1' }), lastSaved: Date.now() - 3_600_000 }, 1);
    mem[KEY] = kayitMetni(kayit({ wallet: '2' }), 2);
    loadSave();
    writeSave(kayit({ wallet: '3' }));
    expect(JSON.parse(mem[Y(0)]).wallet).toBe('2');
    expect(JSON.parse(mem[Y(1)]).wallet).toBe('1');
  });
});

describe('bilinçli sıfırlama', () => {
  it('clearSave: kayıt + yedekler silinir, karantina durur, sifirlamaNo artar ve yazılan kayda geçer', () => {
    mem[KEY] = kayitMetni(kayit({ wallet: '9', sifirlamaNo: 2 }), 3);
    mem[Y(0)] = kayitMetni(kayit({ sifirlamaNo: 2 }), 2);
    mem[`${KEY}.bozuk`] = '{"ana":"eski"}';
    expect(loadSave().sifirlamaNo).toBe(2);
    clearSave();
    expect(mem[KEY]).toBeUndefined();
    expect(mem[Y(0)]).toBeUndefined();
    expect(mem[`${KEY}.bozuk`]).toBe('{"ana":"eski"}');
    const taze = loadSave();
    expect(taze.sifirlamaNo).toBe(3);
    writeSave(defaultSave());
    expect(JSON.parse(mem[KEY]).sifirlamaNo).toBe(3);
  });
});

describe('Preferences + localStorage ayrışması', () => {
  it('iki depoda farklı ana kayıt: büyük zarf sayacı (taze olan) açılır', async () => {
    const tercih = new Map<string, string>([[KEY, kayitMetni(kayit({ wallet: '10' }), 5)]]);
    const d: TercihDeposu = {
      keys: async () => ({ keys: [...tercih.keys()] }),
      get: async ({ key }) => ({ value: tercih.get(key) ?? null }),
      set: async ({ key, value }) => { tercih.set(key, value); },
      remove: async ({ key }) => { tercih.delete(key); },
    };
    mem[KEY] = kayitMetni(kayit({ wallet: '11' }), 6); // Preferences'a yetişemeyen son yazım
    await kalicilikHazirla(d);
    expect(loadSave().wallet).toBe('11');
    writeSave(kayit({ wallet: '12' }));
    await kalicilikBekle();
    expect(JSON.parse(tercih.get(KEY)!).wallet).toBe('12');
    expect(zarf(tercih.get(KEY)!).n).toBe(7);
  });
});
