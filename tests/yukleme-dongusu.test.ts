import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * YÜKLEME DÖNGÜSÜ BEKÇİSİ (S18).
 *
 * HATA NEYDİ: açılışta React "Maximum update depth exceeded" ile patlıyordu. Yığın
 * `DefaultLoadingManager.onProgress → forceStoreRerender` gösteriyordu: drei'nin `useProgress`
 * store'u her yüklenen dosyada güncelleniyor, ona ABONE olan `SplashScreen` her dosyada yeniden
 * render ediliyordu. Soğuk açılışta olaylar ağ süresine yayıldığı için zararsızdı; dosyalar
 * tarayıcı önbelleğinde SICAKken hepsi aynı karede bitiyor ve React'in iç içe güncelleme sınırı
 * aşılıyordu. **Ölçüldü: üç açılışın ikisinde** (ilk açılış temiz, sonrakiler patlıyor).
 *
 * NEDEN KAYNAK METNİ DENETLENİYOR: hata yalnız GERÇEK tarayıcıda ve yalnız ÖNBELLEK SICAKken
 * doğuyor; jsdom'da `LoadingManager` hiç çalışmıyor, yani davranışla yakalanamıyor. Duman testi
 * de yakalayamamıştı çünkü her koşuda temiz profille açılıyor. Geriye kalan tek bekçi, hatayı
 * üreten İKİ KALIBIN geri gelmemesi.
 *
 * S16 bu hatanın bir kaynağını (`Customers.tsx`teki yol dizisi) kapatmıştı ve "kapandı" demişti;
 * kapanmamıştı — `Tables.tsx` aynı kalıbı taşıyordu ve asıl yol (abonelik) hiç kapatılmamıştı.
 * Bu dosya iki katmanı da bekçiliyor.
 */
/**
 * YORUMLAR SÖKÜLÜR: bu dosyanın denetlediği kalıpların adı, aynı kaynakların AÇIKLAMA
 * satırlarında da geçiyor ("`useProgress()` çağrısı = abonelik…"). Yorum metni üzerinden
 * eşleşen bir bekçi, kodu değil belgeyi denetler — ve doğru kodu yanlış diye bildirir.
 */
const kodu = (metin: string) =>
  metin.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const oku = (p: string) => kodu(readFileSync(p, 'utf8'));
const SPLASH = oku('src/components/ui/SplashScreen.tsx');
const TABLES = oku('src/components/three/Tables.tsx');
const CUSTOMERS = oku('src/components/three/Customers.tsx');
const KAYACTOR = oku('src/components/three/KayActor.tsx');

describe('yükleme döngüsü — açılışta "Maximum update depth exceeded" geri gelmesin', () => {
  it('SplashScreen ilerlemeye ABONE OLMAZ, store\'u OKUR', () => {
    // `useProgress()` çağrısı = abonelik = dosya başına bir render. Yasak olan bu.
    expect(SPLASH).not.toMatch(/\buseProgress\(\)/);
    // Okuma yolu: render'sız anlık görüntü.
    expect(SPLASH).toMatch(/useProgress\.getState\(\)/);
  });

  it('SplashScreen\'in tamamlanma kancası `progress`e BAĞLI DEĞİL', () => {
    // Bağımlılıkta `progress` olsaydı her ilerleme olayı interval'i söküp yeniden kurardı —
    // hatanın ikinci çarpanı buydu.
    // ÇAPA DAR OLMALI: dosyada İKİ `useEffect` var ve ikisi de `}, [done]);` ile bitiyor
    // (ikincisi fade-out). Geniş bir dilimde arama yapan ilk hâli, yoklama kancasının
    // bağımlılığı bozulsa bile ikinci kancanın satırıyla YEŞİL kalıyordu — mutasyonla
    // yakalandı (M5 kaçtı). Dilim artık `const check =` ile o kancanın KENDİ kapanışı arası.
    const bas = SPLASH.indexOf('const check =');
    const kanca = SPLASH.slice(bas, SPLASH.indexOf('useEffect(', bas));
    expect(kanca).toMatch(/\}, \[done\]\);/);
    expect(kanca).not.toMatch(/\[[^\]]*(progress|pct)[^\]]*\]\);/);
  });

  it('useGLTF\'e verilen DİZİLER her render yeniden üretilmez', () => {
    // Kalıp: `useGLTF(<bir şey>.map(...))` — dizi kimliği her render değişir, yükleyici
    // yeniden sorgulanır. İki kabul edilebilir biçim var: modül sabiti ya da `useMemo`.
    for (const [ad, kaynak] of [['Tables', TABLES], ['Customers', CUSTOMERS], ['KayActor', KAYACTOR]] as const) {
      expect(kaynak, `${ad}: useGLTF'e satır içi .map() verilmiş`).not.toMatch(/useGLTF\([^)]*\.map\(/);
    }
  });

  it('Tables yol listesi MODÜL SABİTİ — bileşenin hiçbir render\'ına bağlı değil', () => {
    expect(TABLES).toMatch(/^const FURNITURE_URL = FURNITURE\.map\(/m);
    expect(TABLES).toMatch(/useGLTF\(FURNITURE_URL\)/);
    // preload da aynı listeden beslenmeli: iki ayrı liste zamanla ayrışır.
    expect(TABLES).toMatch(/FURNITURE_URL\.forEach\(\(u\) => useGLTF\.preload\(u\)\)/);
  });

  it('Customers ve KayActor yol dizilerini memoize eder', () => {
    expect(CUSTOMERS).toMatch(/const yollar = useMemo\(/);
    expect(KAYACTOR).toMatch(/const yollar = useMemo\(/);
  });
});
