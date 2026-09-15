/**
 * ses-seviye-s9.test.ts — SES/MÜZİK SEVİYESİNİN ve MÜZİK MOTORUNUN BEKÇİSİ (S9 · D-122).
 *
 * ÜÇ AYRI İDDİA, üçü de farklı bir kusuru kapatıyor:
 *
 *  1. **Seviye anahtardan AYRI.** Kullanıcının isteği *"ayarlara ses kıs falan koy"*: tek bir
 *     aç/kapa anahtarı "kıs"ı karşılamıyordu. Bekçi ikisinin bağımsızlığını tutuyor — seviye 0
 *     olunca anahtar KAPANMAZ, anahtar kapanınca seviye SIFIRLANMAZ.
 *  2. **Eski kayıt sessizleşmiyor.** `loadSave` yüzeysel yayılım yapıyordu ve `parsed.settings`
 *     varsayılan ayar nesnesinin TAMAMINI eziyordu: yeni bir ayar alanı, GÜNCEL SÜRÜMLÜ eski bir
 *     kayıtta `undefined` kalırdı ve göç bile çalışmazdı (sürüm zaten güncel). `undefined` bir
 *     çarpan sesi tamamen susturur — yani bu, kullanıcının kaydını sessizce bozacak bir hataydı.
 *  3. **"Müzik" anahtarı gerçekten bağlı.** S10'dan beri kayıtta duruyor ve hiçbir şeye bağlı
 *     değildi (rapor B9). Motor artık var; bekçi anahtarın döngüyü başlattığını/durdurduğunu
 *     ve seviyenin ÖLÇÜLEN TAVANI aşmadığını tutuyor.
 */
import { describe, it, expect } from 'vitest';
import { sesMotoruKur, SES_KATALOG, type SesArkaUc, type SesId } from '../src/game/audio';
import { muzikMotoruKur, muzikKazanci, SALON_MUZIGI, type MuzikArkaUc } from '../src/game/music';
import { ayarlariBirlestir, defaultSettings } from '../src/game/save';

// ── Sahte ses arka ucu: hangi KAZANÇLA çalındığını kaydeder ───────────────
function sesHarness(seviye = 1, acik = true, dosyaVar = false) {
  const kazanclar: number[] = [];
  const calanlar: SesId[] = [];
  let t = 0;
  const arkaUc: SesArkaUc = {
    simdi: () => t,
    kilidiAc: () => {},
    // Dosya yolu da ÖLÇÜLÜYOR: ilk yazımda hep `false` dönüyordu ve o yol hiç sınanmıyordu —
    // mutasyon M6 (dosya yolu seviyeyi yutuyor) tam oradan kaçtı.
    dosyaCal: (_yol, gain) => {
      if (!dosyaVar) return false;
      kazanclar.push(gain);
      return true;
    },
    sentezCal: (id, _k, _y, gain) => { calanlar.push(id); kazanclar.push(gain); },
  };
  const motor = sesMotoruKur(arkaUc, acik, seviye);
  motor.kilidiAc();
  return { motor, kazanclar, calanlar, ilerlet: (sn: number) => { t += sn; } };
}

// ── Sahte müzik arka ucu ──────────────────────────────────────────────────
function muzikHarness(acik = true, seviye = 1) {
  const gunluk: string[] = [];
  let caliyor = false;
  let sonKazanc = -1;
  const arkaUc: MuzikArkaUc = {
    get caliyor() { return caliyor; },
    basla: (yol, k) => { caliyor = true; sonKazanc = k; gunluk.push(`basla ${yol} ${k.toFixed(4)}`); },
    dur: () => { caliyor = false; gunluk.push('dur'); },
    kazanc: (v) => { sonKazanc = v; gunluk.push(`kazanc ${v.toFixed(4)}`); },
  };
  const motor = muzikMotoruKur(arkaUc, SALON_MUZIGI, acik, seviye);
  return { motor, gunluk, get caliyor() { return caliyor; }, get sonKazanc() { return sonKazanc; } };
}

describe('1 — ses seviyesi çalma kazancına gerçekten giriyor', () => {
  it('seviye 1 tam kazanç', () => {
    const h = sesHarness(1);
    h.motor.cal('purchase');
    expect(h.kazanclar).toEqual([1]);
  });

  it('seviye 0,5 yarım kazanç', () => {
    const h = sesHarness(0.5);
    h.motor.cal('purchase');
    expect(h.kazanclar).toEqual([0.5]);
  });

  it('seviye 0 = HİÇ çalmaz (sessiz tampon üretilmez)', () => {
    const h = sesHarness(0);
    expect(h.motor.cal('purchase')).toBe(false);
    expect(h.calanlar).toEqual([]);
  });

  it('kelepçe ve seri sayacı da seviye 0\'da durur — açınca merdiven ortasında başlamaz', () => {
    const h = sesHarness(0);
    for (let i = 0; i < 6; i++) { h.motor.cal('coin'); h.ilerlet(0.1); }
    h.motor.ayarla(true, 1);
    h.motor.cal('coin');
    // Sessiz geçen çağrılar basamak yemediği için ilk duyulan ses TABANDA olmalı.
    expect(h.kazanclar).toEqual([1]);
  });

  it('DOSYA yolu da seviyeyi taşıyor (bir .ogg bırakılırsa ayar kaybolmaz)', () => {
    const h = sesHarness(0.4, true, true);
    h.motor.cal('purchase');
    expect(h.kazanclar).toEqual([0.4]);
    expect(h.calanlar).toEqual([]); // sentez hiç çalmadı — dosya üstüne yazdı
  });

  it('seviye 0..1 aralığına kelepçelenir', () => {
    const h = sesHarness(5);
    expect(h.motor.seviye).toBe(1);
    h.motor.ayarla(true, -3);
    expect(h.motor.seviye).toBe(0);
  });
});

describe('2 — seviye ile ANAHTAR birbirinden bağımsız', () => {
  it('seviye 0 anahtarı kapatmıyor — KURULUŞTA', () => {
    const h = sesHarness(0, true);
    expect(h.motor.acik).toBe(true);
  });

  it('seviye 0 anahtarı kapatmıyor — ÇALIŞIRKEN de (ayarla yolu)', () => {
    // Bu satır mutasyon M8 yüzünden eklendi: üstteki test yalnız KURULUŞ yolunu sınıyordu,
    // oysa oyuncu kaydırıcıyı `ayarla` ile oynatıyor. Anahtarı orada söndüren bir satır
    // bekçisizdi — "kıs" ile "kapat" sessizce tekrar tek şeye düşebilirdi.
    const h = sesHarness(1, true);
    h.motor.ayarla(true, 0);
    expect(h.motor.acik).toBe(true);
    expect(h.motor.seviye).toBe(0);
    h.motor.ayarla(true, 0.8);
    h.motor.cal('purchase');
    expect(h.kazanclar).toEqual([0.8]);
  });

  it('anahtar kapalıyken seviye korunuyor — geri açınca eski ses gelir', () => {
    const h = sesHarness(0.35, true);
    h.motor.ayarla(false, 0.35);
    expect(h.motor.seviye).toBeCloseTo(0.35, 6);
    h.motor.ayarla(true, 0.35);
    h.motor.cal('purchase');
    expect(h.kazanclar).toEqual([0.35]);
  });

  it('anahtar kapalı + seviye 1 → yine ses yok', () => {
    const h = sesHarness(1, false);
    expect(h.motor.cal('purchase')).toBe(false);
  });
});

describe('3 — eski kayıt sessizleşmiyor (yüzeysel yayılım tuzağı)', () => {
  it('ayar alanı eksik kayıtta seviye VARSAYILANA düşer, undefined kalmaz', () => {
    const eski = { sound: true, music: true, notifications: true, showFps: false };
    const birlesik = ayarlariBirlestir(eski);
    expect(birlesik.soundVolume).toBe(1);
    expect(birlesik.musicVolume).toBe(1);
  });

  it('oyuncunun seçimi varsayılanı EZER', () => {
    const b = ayarlariBirlestir({ soundVolume: 0.25, musicVolume: 0, sound: false });
    expect(b.soundVolume).toBe(0.25);
    expect(b.musicVolume).toBe(0);
    expect(b.sound).toBe(false);
  });

  it('bozuk değer (NaN · metin · null) varsayılana düşer', () => {
    for (const bozuk of [NaN, Infinity, 'yarım', null, undefined, {}]) {
      expect(ayarlariBirlestir({ soundVolume: bozuk as never }).soundVolume).toBe(1);
    }
  });

  it('aralık dışı sayı kelepçelenir', () => {
    expect(ayarlariBirlestir({ soundVolume: 9 }).soundVolume).toBe(1);
    expect(ayarlariBirlestir({ musicVolume: -2 }).musicVolume).toBe(0);
  });

  it('ayar hiç yoksa tamamı varsayılan', () => {
    expect(ayarlariBirlestir(undefined)).toEqual(defaultSettings());
    expect(ayarlariBirlestir('bozuk')).toEqual(defaultSettings());
  });

  it('varsayılan seviye 1 — eski kayıt bugüne kadarki sesini AYNEN duyar', () => {
    expect(defaultSettings().soundVolume).toBe(1);
    expect(defaultSettings().musicVolume).toBe(1);
  });
});

describe('4 — müzik: "Müzik" anahtarı gerçekten bağlı', () => {
  it('kilit açılmadan müzik BAŞLAMAZ', () => {
    const h = muzikHarness(true, 1);
    expect(h.caliyor).toBe(false);
    h.motor.kilidiAc();
    expect(h.caliyor).toBe(true);
  });

  it('kilit kapalıyken AYAR DEĞİŞİMİ de başlatmaz', () => {
    // Mutasyon M11 buradan kaçtı: üstteki test yalnız kuruluş anına bakıyordu ve motor kuruluşta
    // zaten `esitle()` çağırmıyor — yani `!kilitli` şartı silinse bile test yeşil kalıyordu.
    // Oysa oyuncu dokunmadan önce ayar paneli açılıp kapanabilir; askıda kalan bir döngü
    // tarayıcıda sessizce ölür ve müzik bir daha hiç başlamaz.
    const h = muzikHarness(false, 1);
    h.motor.ayarla(true, 1);
    expect(h.caliyor).toBe(false);
    expect(h.gunluk).toEqual([]);
    h.motor.kilidiAc();
    expect(h.caliyor).toBe(true);
  });

  it('anahtar kapalıysa kilit açılsa da başlamaz', () => {
    const h = muzikHarness(false, 1);
    h.motor.kilidiAc();
    expect(h.caliyor).toBe(false);
  });

  it('anahtar açılınca başlar, kapanınca DURUR', () => {
    const h = muzikHarness(false, 1);
    h.motor.kilidiAc();
    h.motor.ayarla(true, 1);
    expect(h.caliyor).toBe(true);
    h.motor.ayarla(false, 1);
    expect(h.caliyor).toBe(false);
  });

  it('seviye 0 döngüyü DURDURUR (sessiz döngü pil yakar)', () => {
    const h = muzikHarness(true, 1);
    h.motor.kilidiAc();
    h.motor.ayarla(true, 0);
    expect(h.caliyor).toBe(false);
    h.motor.ayarla(true, 0.5);
    expect(h.caliyor).toBe(true);
  });

  it('değişmeyen ayar arka uca DOKUNMUYOR (her karede çağrılıyor)', () => {
    const h = muzikHarness(true, 1);
    h.motor.kilidiAc();
    const n = h.gunluk.length;
    for (let i = 0; i < 20; i++) h.motor.ayarla(true, 1);
    expect(h.gunluk.length).toBe(n);
  });

  it('çalarken seviye değişince yeniden BAŞLAMAZ, yalnız kazanç yazılır', () => {
    const h = muzikHarness(true, 1);
    h.motor.kilidiAc();
    h.gunluk.length = 0;
    h.motor.ayarla(true, 0.4);
    expect(h.gunluk).toEqual([`kazanc ${muzikKazanci(SALON_MUZIGI, 0.4).toFixed(4)}`]);
  });
});

describe('5 — müziğin seviyesi ÖLÇÜLEN tavanı aşmıyor', () => {
  it('slider tepede bile kazanç tavanın kendisi', () => {
    expect(muzikKazanci(SALON_MUZIGI, 1)).toBeCloseTo(SALON_MUZIGI.tavan, 10);
  });

  it('slider tavanın ÜSTÜNE çıkamaz', () => {
    expect(muzikKazanci(SALON_MUZIGI, 99)).toBeCloseTo(SALON_MUZIGI.tavan, 10);
  });

  it('tavan ölçülen −22,4 dB ile tutuyor', () => {
    const db = 20 * Math.log10(SALON_MUZIGI.tavan);
    expect(db).toBeGreaterThan(-22.6);
    expect(db).toBeLessThan(-22.2);
  });

  it('tavan her sesin BASKIN katmanından alçak — müzik geri bildirimi örtemez', () => {
    // Kıyas BASKIN katmanla yapılır, en sessiz ALT katmanla değil: bir sesin kimliğini en
    // yüksek kazançlı katmanı taşıyor (`ses-metrik.baskin` ile aynı tanım). İlk yazımda bu
    // test alt katmanlara bakıyordu ve `reward`ın 0,04'lük parıltı katmanına takılıp KIRMIZI
    // yandı — sayı değil, KIYASIN kendisi yanlıştı.
    //
    // Gerçek ölçüt bant-başına (`docs/olcum-muzik-s9.txt` §3). Bu satır onun yerini almıyor,
    // yalnız ölçütün YÖNÜNÜN koda ters geçmesini engelliyor.
    const baskinlar = (Object.keys(SES_KATALOG) as SesId[]).map((id) =>
      Math.max(...SES_KATALOG[id].katmanlar.map((k) => k.gain)));
    expect(SALON_MUZIGI.tavan).toBeLessThan(Math.min(...baskinlar));
  });

  it('parça künyesi manifestle aynı eseri gösteriyor', () => {
    expect(SALON_MUZIGI.kunye).toMatch(/CC0/);
    expect(SALON_MUZIGI.kunye).toMatch(/Abstraction/);
    expect(SALON_MUZIGI.dosya).toBe('/assets/audio/muzik_salon.ogg');
  });
});
