/**
 * ses.test.ts — SES SİSTEMİNİN BEKÇİSİ (Faz E · E3a).
 *
 * Ses doğrulanamaz: "duyuldu mu" diye bir test yok, 3B sahnenin görsel doğrulanamaması gibi
 * (CLAUDE.md). O yüzden bu bekçi başka bir şey iddia ediyor — **hangi durum değişiminin hangi
 * olayı doğurduğunu** ve motorun üç kelepçesinin gerçekten tuttuğunu.
 *
 * NE İDDİA EDİYOR:
 *   1. Olaylar durumun FARKINDAN doğar; ilk kare SESSİZDİR. Bu, sistemin en kolay kaçırılacak
 *      kuralı: kıyas noktası olmadan bir kayıt yüklenince oyuncunun bütün geçmişi bir anda
 *      çalardı (20 masa, 50 görev, 250 💎 — tek karede).
 *   2. Sayaçlar yalnız ARTIŞTA ses üretir. Azalma (yükleme, göç, prestij) sessizdir.
 *   3. `settings.sound` gerçekten BAĞLI. Ayar kayıtta v17'den beri duruyordu ama hiçbir şeye
 *      bağlı değildi; bu turun asıl işi o bağlantı, dolayısıyla bekçisi de bu.
 *   4. Tarayıcı ses kilidi açılmadan hiçbir şey çalınmaz ve çalınmayanlar KUYRUĞA ALINMAZ
 *      (birikip kilit açılınca hep birden patlamasın).
 *   5. Aynı ses `aralik`tan sık çalınmaz — Tek Odak'ın (D-080) ses karşılığı. Kelepçe olmasa
 *      tek bir mıknatıs turunda onlarca `coin` üst üste binerdi.
 *   6. Dosya yoksa TON çalınır (`Model.tsx` fallback deseni) — dosyalar E3b'de gelecek,
 *      oyun bugün de tam sesli oynanır.
 *   7. `tick.ts`'e DOKUNULMADI: ses bir denge kolu değil, sunum katmanı.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  sesOlaylari, sesMotoruKur, SES_KATALOG,
  type SesKesit, type SesId, type SesArkaUc, type SesTanim,
} from '../src/game/audio';

const TABAN: SesKesit = {
  coinsCollected: 0, teaPickups: 0, served: 0, yukseltmeToplam: 0,
  padSayisi: 0, questIndex: 0, seviye: 1, ustaSayisi: 0, odulSayisi: 0,
};
const ile = (y: Partial<SesKesit>): SesKesit => ({ ...TABAN, ...y });

/** Sahte arka uç: neyin çalınmaya ÇALIŞILDIĞINI kaydeder. Saat elle ilerletilir. */
function sahteArkaUc(opts: { dosyaVar?: boolean } = {}) {
  const kayit = { dosyalar: [] as string[], tonlar: [] as SesTanim['ton'][], kilitAcildi: 0 };
  let t = 0;
  const arkaUc: SesArkaUc = {
    simdi: () => t,
    kilidiAc: () => { kayit.kilitAcildi += 1; },
    dosyaCal: (yol) => { if (!opts.dosyaVar) return false; kayit.dosyalar.push(yol); return true; },
    tonCal: (ton) => { kayit.tonlar.push(ton); },
  };
  return { arkaUc, kayit, ilerlet: (sn: number) => { t += sn; } };
}

describe('1 — olaylar durumun FARKINDAN doğar; ilk kare sessiz', () => {
  it('önceki kesit yoksa HİÇBİR ses yok (yükleme anında geçmiş çalmaz)', () => {
    const dolu = ile({ coinsCollected: 900, padSayisi: 24, seviye: 13, questIndex: 50, ustaSayisi: 10 });
    expect(sesOlaylari(null, dolu)).toEqual([]);
  });

  it('hiçbir şey değişmediyse ses yok', () => {
    expect(sesOlaylari(TABAN, TABAN)).toEqual([]);
  });
});

describe('2 — her sayaç KENDİ olayını doğuruyor', () => {
  const eslesme: [keyof SesKesit, SesId][] = [
    ['coinsCollected', 'coin'],
    ['teaPickups', 'pour'],
    ['served', 'serve'],
    ['yukseltmeToplam', 'purchase'],
    ['padSayisi', 'padFill'],
    ['questIndex', 'quest'],
    ['seviye', 'level'],
    ['ustaSayisi', 'master'],
    ['odulSayisi', 'reward'],
  ];

  for (const [alan, id] of eslesme) {
    it(`${alan} artınca "${id}" (ve BAŞKA ses yok)`, () => {
      const sonra = ile({ [alan]: (TABAN[alan] as number) + 1 } as Partial<SesKesit>);
      expect(sesOlaylari(TABAN, sonra)).toEqual([id]);
    });
  }

  it('kesitin HER alanı bir olaya bağlı — sessiz alan yok', () => {
    // Bu satır olmasa kesite eklenen yeni bir alan sessizce ses üretmeyen bir alan olurdu
    // ve kimse fark etmezdi.
    expect(eslesme.map(([a]) => a).sort()).toEqual(Object.keys(TABAN).sort());
  });

  it('her olay kimliği katalogda tanımlı', () => {
    for (const [, id] of eslesme) expect(SES_KATALOG[id]).toBeTruthy();
  });
});

describe('3 — AZALMA sessizdir (yükleme · göç · prestij)', () => {
  it('bütün sayaçlar düşerse tek ses bile yok', () => {
    const dolu = ile({ coinsCollected: 900, padSayisi: 24, seviye: 13, questIndex: 50, ustaSayisi: 10, odulSayisi: 30, served: 500, teaPickups: 500, yukseltmeToplam: 90 });
    expect(sesOlaylari(dolu, TABAN)).toEqual([]);
  });

  it('bir sayaç artar diğeri düşerse yalnız ARTAN ses üretir', () => {
    const onceki = ile({ coinsCollected: 10, padSayisi: 5 });
    const simdi = ile({ coinsCollected: 11, padSayisi: 2 });
    expect(sesOlaylari(onceki, simdi)).toEqual(['coin']);
  });
});

describe('4 — bir karede çok olay: sıra EN ANLAMLIDAN başlar', () => {
  it('seviye + pad + para aynı karede düşerse önce `level` çalar', () => {
    const sonra = ile({ seviye: 2, padSayisi: 1, coinsCollected: 3 });
    expect(sesOlaylari(TABAN, sonra)).toEqual(['level', 'padFill', 'coin']);
  });
});

describe('5 — `settings.sound` GERÇEKTEN bağlı', () => {
  it('kapalıyken tek ses bile çalınmıyor', () => {
    const { arkaUc, kayit } = sahteArkaUc();
    const m = sesMotoruKur(arkaUc, false);
    m.kilidiAc();
    expect(m.cal('coin')).toBe(false);
    expect(kayit.tonlar).toHaveLength(0);
    expect(kayit.dosyalar).toHaveLength(0);
  });

  it('çalışma anında kapatılabiliyor ve yeniden açılabiliyor', () => {
    const { arkaUc, ilerlet } = sahteArkaUc();
    const m = sesMotoruKur(arkaUc, true);
    m.kilidiAc();
    expect(m.cal('coin')).toBe(true);
    m.ayarla(false);
    ilerlet(10);
    expect(m.cal('coin')).toBe(false);
    m.ayarla(true);
    ilerlet(10);
    expect(m.cal('coin')).toBe(true);
  });
});

describe('6 — tarayıcı ses kilidi (mobil otomatik-oynatma kuralı)', () => {
  it('kilit açılmadan hiçbir şey çalınmıyor', () => {
    const { arkaUc, kayit } = sahteArkaUc();
    const m = sesMotoruKur(arkaUc, true);
    expect(m.cal('coin')).toBe(false);
    expect(kayit.tonlar).toHaveLength(0);
  });

  it('kilit açılınca çalıyor — ama BEKLEYENLER kuyruğa alınmamış', () => {
    const { arkaUc, kayit, ilerlet } = sahteArkaUc();
    const m = sesMotoruKur(arkaUc, true);
    for (let i = 0; i < 5; i++) { m.cal('coin'); ilerlet(1); }
    m.kilidiAc();
    ilerlet(1);
    m.cal('coin');
    // Kilitliyken düşen 5 çağrı BİRİKMEDİ: yalnız kilit açıldıktan sonraki tek ses çalındı.
    expect(kayit.tonlar).toHaveLength(1);
  });

  it('kilit yalnız BİR KEZ açılıyor (her karede resume çağrısı yok)', () => {
    const { arkaUc, kayit } = sahteArkaUc();
    const m = sesMotoruKur(arkaUc, true);
    m.kilidiAc(); m.kilidiAc(); m.kilidiAc();
    expect(kayit.kilitAcildi).toBe(1);
  });
});

describe('7 — aralık kelepçesi: aynı ses yığılmıyor (Tek Odak`ın ses karşılığı)', () => {
  it('aynı ses `aralik`tan önce ikinci kez çalınmıyor', () => {
    const { arkaUc, ilerlet } = sahteArkaUc();
    const m = sesMotoruKur(arkaUc, true);
    m.kilidiAc();
    expect(m.cal('coin')).toBe(true);
    ilerlet(SES_KATALOG.coin.aralik / 2);
    expect(m.cal('coin')).toBe(false);
    ilerlet(SES_KATALOG.coin.aralik);
    expect(m.cal('coin')).toBe(true);
  });

  it('kelepçe ses BAŞINA — `coin` kelepçeliyken `level` çalabiliyor', () => {
    const { arkaUc } = sahteArkaUc();
    const m = sesMotoruKur(arkaUc, true);
    m.kilidiAc();
    expect(m.cal('coin')).toBe(true);
    expect(m.cal('coin')).toBe(false);
    expect(m.cal('level')).toBe(true);
  });

  it('tek mıknatıs turu: 40 para çağrısı bir avuç sese iniyor', () => {
    // Ölçülen kusur bu: mıknatıs bir karede birden çok parayı topluyor. Kelepçe olmasa
    // 40 ses üst üste binerdi.
    const { arkaUc, kayit, ilerlet } = sahteArkaUc();
    const m = sesMotoruKur(arkaUc, true);
    m.kilidiAc();
    for (let i = 0; i < 40; i++) { m.cal('coin'); ilerlet(1 / 60); }
    expect(kayit.tonlar.length).toBeLessThanOrEqual(12);
    expect(kayit.tonlar.length).toBeGreaterThan(0);
  });

  it('her sesin aralığı POZİTİF — sıfır olsaydı kelepçe hiç tutmazdı', () => {
    for (const [id, t] of Object.entries(SES_KATALOG)) {
      expect(t.aralik, id).toBeGreaterThan(0);
    }
  });
});

describe('8 — dosya yoksa TON (Model.tsx fallback deseni)', () => {
  it('dosya çalınamıyorsa sentez tonuna düşüyor', () => {
    const { arkaUc, kayit } = sahteArkaUc({ dosyaVar: false });
    const m = sesMotoruKur(arkaUc, true);
    m.kilidiAc();
    m.cal('level');
    expect(kayit.dosyalar).toHaveLength(0);
    expect(kayit.tonlar).toEqual([SES_KATALOG.level.ton]);
  });

  it('dosya varsa TON çalınmıyor (çift ses yok)', () => {
    const { arkaUc, kayit } = sahteArkaUc({ dosyaVar: true });
    const m = sesMotoruKur(arkaUc, true);
    m.kilidiAc();
    m.cal('level');
    expect(kayit.dosyalar).toEqual([SES_KATALOG.level.dosya]);
    expect(kayit.tonlar).toHaveLength(0);
  });

  it('her sesin hem dosyası hem tonu tanımlı — yarım tanım yok', () => {
    for (const [id, t] of Object.entries(SES_KATALOG)) {
      expect(t.dosya, id).toMatch(/^\/assets\/audio\/.+\.ogg$/);
      expect(t.ton.hz.length, id).toBeGreaterThan(0);
      expect(t.ton.sure, id).toBeGreaterThan(0);
      expect(t.ton.gain, id).toBeGreaterThan(0);
      // Ses seviyesi tavanı: sentez tonu bir DOLGU, oyunun sesi değil — yüksek olmamalı.
      expect(t.ton.gain, id).toBeLessThanOrEqual(0.25);
    }
  });
});

describe('9 — ses `tick.ts`e dokunmuyor (denge dosyası değil, sunum katmanı)', () => {
  it('tick.ts ses modüllerini import ETMİYOR', () => {
    // Bu satır bir mimari kararın bekçisi (bkz. audio.ts §1): tick bir DENGE dosyasıdır,
    // ona dokunan her değişiklik varyant kapısını açar ve ses bir denge kolu değildir.
    const tick = readFileSync(new URL('../src/game/tick.ts', import.meta.url), 'utf8');
    expect(tick).not.toMatch(/from '\.\/audio/);
    expect(tick).not.toMatch(/SesId|sesOlaylari|sesMotoruKur/);
  });
});
