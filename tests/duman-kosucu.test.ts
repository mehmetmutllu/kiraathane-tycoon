/**
 * duman-kosucu.test.ts — `npm run duman`ın BEKÇİSİ (Faz E · duman testinin bağlanması).
 *
 * Faz E'nin kapısı "duman testi `package.json`'a bağlı ve yeşil". Bir koşucunun yeşil olması
 * tek başına yetmez: **yanlış şeyi ölçerken de yeşil olabilir.** Bu bekçi tam olarak o üç
 * sessiz sapmayı kapatıyor.
 *
 * NE İDDİA EDİYOR:
 *   1. Komut `package.json`'da GERÇEKTEN bağlı ve koşucuyu çağırıyor — kapının kendisi.
 *   2. Koşucu 5173'ten AYRI bir port kullanıyor ve `--strictPort` veriyor. İkisi birlikte
 *      olmazsa geliştiricinin açık dev sunucusu varken vite sessizce başka porta kayar ve
 *      duman testi BAŞKA bir uygulamayı ölçer — yeşil, ama anlamsız.
 *   3. Çıkış kodu duman testinden gelir. Sunucu SIGTERM ile indirildiği için sıfırdan farklı
 *      biter; o kod sonuca karışırsa kırmızı bir koşu yeşil görünebilir (ya da tersi).
 *   4. Varsayılan kip DEV sunucusu. 41/41'lik taban orada ölçüldü; kipi sessizce `preview`e
 *      çevirmek ölçülmemiş bir değişikliği araç bağlama işinin içine gizlemek olurdu.
 *   5. Adres `localhost`, `127.0.0.1` DEĞİL — bu bir stil tercihi değil, koşucunun ilk
 *      hâlinde gerçekten yaşanan hata: vite `localhost`a bağlanıyor, o ad bu makinede IPv6
 *      `::1`e çözülüyor ve IPv4 yoklaması sunucu ayaktayken "ayağa kalkmadı" diyordu.
 *   6. Yoklama gerçekten YOKLUYOR: ilk denemede hazır olmayan sunucuyu beklemeli, hiç
 *      hazır olmayanda ise süreyi doldurup `false` dönmeli (sonsuza kadar asılmamalı).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { portSec, cikisKodu, kipAyari, sunucuyuBekle, sunucuKomutu, adres, hazirSinyali, HAZIR_KALIBI } from '../tools/duman.mjs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const kosucu = readFileSync(new URL('../tools/duman.mjs', import.meta.url), 'utf8');

describe('1 — komut package.json`a bağlı (Faz E kapısı)', () => {
  it('`npm run duman` var ve koşucuyu çağırıyor', () => {
    expect(pkg.scripts.duman).toBe('node tools/duman.mjs');
  });

  it('playwright bir bağımlılık — koşucu onsuz çalışamaz', () => {
    expect(pkg.devDependencies.playwright).toBeTruthy();
  });
});

describe('2 — koşucu YANLIŞ uygulamayı ölçemez', () => {
  it('varsayılan port 5173 DEĞİL (geliştiricinin dev sunucusuyla çakışmaz)', () => {
    expect(portSec({})).not.toBe(5173);
    expect(portSec({})).toBe(5199);
  });

  it('port elle verilebiliyor ama saçma değer varsayılana düşüyor', () => {
    expect(portSec({ DUMAN_PORT: '4000' })).toBe(4000);
    for (const kotu of ['', 'abc', '0', '-1', '70000']) {
      expect(portSec({ DUMAN_PORT: kotu })).toBe(5199);
    }
  });

  it('`--strictPort` GERÇEKTEN argümanlarda — port doluysa sessizce kaymak YASAK', () => {
    // İLK HÂLİ BUNU DOSYA METNİNDE ARIYORDU ve mutasyon kaçtı: bayrak yorumda da geçtiği için
    // argümanlardan SİLİNDİĞİ hâlde metin araması hâlâ buluyordu. Bekçi artık kodun ne
    // yazdığını değil ne ÇALIŞTIRDIĞINI okuyor.
    expect(sunucuKomutu(5199, undefined, '/k').argv).toContain('--strictPort');
  });

  it('seçilen port GERÇEKTEN vite`a geçiyor', () => {
    const { argv } = sunucuKomutu(4123, undefined, '/k');
    expect(argv[argv.indexOf('--port') + 1]).toBe('4123');
  });

  it('sunucu bir kabuk üstünden DEĞİL, doğrudan node ile açılıyor', () => {
    // npx/npm bir kabuk süreci doğurur; Windows'ta kill() kabuğu öldürüp torunu bırakabilir
    // ve port bir sonraki koşuda dolu kalır.
    expect(sunucuKomutu(5199, undefined, '/k').dosya).toBe(process.execPath);
    expect(sunucuKomutu(5199, undefined, '/k').argv[0]).toMatch(/vite[\\/]bin[\\/]vite\.js$/);
    expect(kosucu).not.toMatch(/shell:\s*true/);
  });
});

describe('3 — çıkış kodu duman testinden gelir', () => {
  it('duman testinin kodu aynen geçiyor', () => {
    expect(cikisKodu(0)).toBe(0);
    expect(cikisKodu(1)).toBe(1);
    expect(cikisKodu(7)).toBe(7);
  });

  it('kod okunamazsa BAŞARISIZ sayılır (sinyalle ölen süreç null döner)', () => {
    // `0` dönseydi, sinyalle ölen bir duman koşusu yeşil raporlanırdı.
    expect(cikisKodu(null)).toBe(1);
    expect(cikisKodu(undefined)).toBe(1);
  });
});

describe('4 — varsayılan kip DEV sunucusu (41/41 tabanının ölçüldüğü yer)', () => {
  it('kip verilmezse dev', () => {
    expect(kipAyari(undefined).komut).toBe('dev');
    expect(kipAyari('').komut).toBe('dev');
  });

  it('preview ayrı bir kip olarak duruyor (Faz F kapısı)', () => {
    expect(kipAyari('preview').komut).toBe('preview');
  });

  it('kip GERÇEKTEN vite`a geçiyor — seçilen kip argümanlarda', () => {
    expect(sunucuKomutu(5199, undefined, '/k').argv).toContain('dev');
    expect(sunucuKomutu(5199, 'preview', '/k').argv).toContain('preview');
  });
});

describe('5 — adres localhost (koşucunun ilk hâlindeki gerçek hata)', () => {
  it('yoklanan adres localhost, 127.0.0.1 DEĞİL', () => {
    expect(adres(5199)).toBe('http://localhost:5199/');
    expect(adres(5199)).not.toContain('127.0.0.1');
  });
});

describe('6 — yoklama gerçekten yokluyor ve asılmıyor', () => {
  it('sunucu geç kalkarsa BEKLİYOR (ilk denemede pes etmiyor)', async () => {
    let n = 0;
    const getir = async () => {
      n += 1;
      if (n < 3) throw new Error('ECONNREFUSED');
      return { ok: true } as Response;
    };
    await expect(sunucuyuBekle('http://yok/', { toplamMs: 5_000, araMs: 1, getir })).resolves.toBe(true);
    expect(n).toBe(3);
  });

  it('sunucu hiç kalkmazsa süreyi doldurup false dönüyor (sonsuz bekleme yok)', async () => {
    const getir = async () => { throw new Error('ECONNREFUSED'); };
    await expect(sunucuyuBekle('http://yok/', { toplamMs: 60, araMs: 1, getir })).resolves.toBe(false);
  });

  it('200 olmayan bir cevap "hazır" sayılmıyor (vite 404 veren bir kabuk açarsa)', async () => {
    const getir = async () => ({ ok: false } as Response);
    await expect(sunucuyuBekle('http://yok/', { toplamMs: 60, araMs: 1, getir })).resolves.toBe(false);
  });
});

describe('7 — hazır sinyali SUNUCUNUN KENDİSİNDEN gelir, portu yoklayarak değil', () => {
  /* Bu bölüm bir ÖLÇÜMDEN doğdu. `--strictPort`in yeterli olduğu varsayılmıştı; port bilerek
   * doldurulup sınandı ve varsayım ÇÜRÜDÜ: koşu kırmızıya dönüyordu ama yanlış sebeple —
   * yoklama, portu tutan YABANCI sunucunun 200'ünü "hazır" sanıyor, duman testi başka bir
   * uygulamaya bağlanıyor ve hata "canvas bulunamadı" diye görünüyordu. Yani mesaj gerçek
   * sebebi (port dolu) hiç söylemiyordu. Bu testler o davranışı kilitliyor. */
  const sahteSunucu = () => {
    const s = new EventEmitter() as EventEmitter & { stdout: EventEmitter };
    s.stdout = new EventEmitter();
    return s;
  };

  it('vite`ın "ready in" satırı hazır sayılıyor', async () => {
    const s = sahteSunucu();
    const p = hazirSinyali(s, { toplamMs: 2_000 });
    s.stdout.emit('data', Buffer.from('  VITE v8.0.16  ready in 182 ms'));
    await expect(p).resolves.toBe('hazir');
  });

  it('süreç ölürse ANINDA `oldu` dönüyor — 60 sn boşuna beklenmiyor', async () => {
    const s = sahteSunucu();
    const p = hazirSinyali(s, { toplamMs: 30_000 });
    const t = Date.now();
    s.emit('exit', 1);
    await expect(p).resolves.toBe('oldu');
    expect(Date.now() - t).toBeLessThan(1_000);
  });

  it('hiçbir sinyal gelmezse zaman aşımı', async () => {
    await expect(hazirSinyali(sahteSunucu(), { toplamMs: 40 })).resolves.toBe('zamanasimi');
  });

  it('sunucunun ALAKASIZ çıktısı hazır SAYILMIYOR', async () => {
    const s = sahteSunucu();
    const p = hazirSinyali(s, { toplamMs: 60 });
    s.stdout.emit('data', Buffer.from('warning: bir sey'));
    await expect(p).resolves.toBe('zamanasimi');
  });

  it('kalıp vite`ın gerçek çıktısını tanıyor, rastgele 200`ü değil', () => {
    expect(HAZIR_KALIBI.test('  VITE v8.0.16  ready in 182 ms')).toBe(true);
    expect(HAZIR_KALIBI.test('  ➜  Local:   http://localhost:5199/')).toBe(true);
    expect(HAZIR_KALIBI.test('BASKA-UYGULAMA')).toBe(false);
  });
});
