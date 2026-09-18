/**
 * KARE-HIZI TAVANI (K-A · T4 · D-136).
 *
 * ## Neden var
 * `docs/perf-raporu-t4.md` §E: `<Canvas>`ta `frameloop` verilmemişti (r3f varsayılanı `always`)
 * ve hiçbir yerde tavan yoktu. Ölçüm erken oyunda **116,7 fps** gördü — yani neredeyse boş bir
 * sahnede cihaz saniyede 117 kare çiziyor. Oyuncu 60 üstünü **göremez**; 120 Hz telefonda bu
 * doğrudan pildir. Kullanıcının "çok ciddi şarj yiyor" şikâyetinin kaynağı kasma değil burası.
 *
 * ## Neden burada (bileşende değil)
 * Zamanlama kararı saf bir fonksiyon: "şu an çizilsin mi, çizilecekse oyun saati kaça gelsin".
 * Ayrı dosya olunca bekçi testi onu ekransız koşturup **mutasyonla** çürütebiliyor — aşağıdaki
 * iki incelik (tolerans ve sabit tempo) sessizce silinirse kimse fark etmezdi, çünkü ekranda
 * "biraz dalgalı" görünürler, hata vermezler.
 *
 * ## İki incelik
 * 1. **TOLERANS.** Tavan ekranın yenileme periyoduna tam bölünmüyorsa (144 Hz'de 60 tavanı gibi)
 *    hedef zamanın bir saç altında kalan kareyi atmak, bir sonraki kareye kadar beklemek demek —
 *    efektif hız tavanın altına, en kötüde yarısına düşer. Yarım ekran karesi kadar erken çizmek
 *    ortalamayı tavanda tutar.
 * 2. **SABİT TEMPO + yakalama.** Hedef her çizimde `aralık` kadar ileri taşınır (çizimin GERÇEK
 *    anına sıfırlanmaz), yoksa her seferinde bir tolerans kadar erken başlayıp tavanın üstüne
 *    tırmanılır. Bir kareden fazla geride kalındıysa (sekme arka plandaydı, uzun takılma) tempo
 *    şimdiye sıfırlanır — yoksa kaçırılan kareler için arka arkaya çizim yapılır (spiral).
 */

/** Üretim tavanı: 60 üstü kare oyuncuya görünmez, yalnız pil yakar (rapor §E). */
export const KARE_TAVANI_FPS = 60;

/**
 * Bir karede oyun saatinin ilerleyebileceği en büyük adım (ms). Sekme arka plandan dönünce
 * rAF'ler arası fark saniyelere çıkar; kısılmazsa tek karede dakikalarca simülasyon koşar.
 */
export const EN_BUYUK_ADIM_MS = 100;

/**
 * Tavanlı kare zamanlayıcısı. Her rAF'te çağrılır.
 *
 * @param tavanFps saniyedeki en çok kare; `0` veya negatif = tavan yok (her çağrı çizer).
 * @returns `dene(simdi)` → çizilecekse **biriken oyun saati (saniye)**, atlanacaksa `null`.
 *   Dönen saniye doğrudan r3f `advance(timestamp)`e verilir: `frameloop="never"` kipinde
 *   delta bu saatten türer, o yüzden saat burada birikir ve `EN_BUYUK_ADIM_MS` ile kısılır.
 */
export function kareZamanlayici(
  tavanFps: number = KARE_TAVANI_FPS,
  enBuyukAdimMs: number = EN_BUYUK_ADIM_MS,
): (simdi: number) => number | null {
  const aralik = tavanFps > 0 ? 1000 / tavanFps : 0;
  let sonraki = Number.NEGATIVE_INFINITY;
  let oncekiCagri: number | null = null;
  let sonCizim: number | null = null;
  // rAF periyodu — tolerans bundan türer. İlk ölçülen aralıkla DOĞRUDAN kurulur (tahminle
  // başlayıp yumuşatsaydık ısınma boyunca tolerans gerçeğin kat kat üstünde kalır ve tavan
  // ilk saniyede aşılırdı); sonraki kareler onu yalnız yumuşatır.
  let ekranAralik: number | null = null;
  let gecen = 0; // biriken oyun saati (saniye)

  return function dene(simdi: number): number | null {
    if (oncekiCagri !== null) {
      const d = simdi - oncekiCagri;
      // Takılmalar ve arka plan sıçramaları EMA'yı bozmasın: yalnız makul aralıklar öğrenilir.
      if (d > 0 && d < enBuyukAdimMs) ekranAralik = ekranAralik === null ? d : ekranAralik * 0.9 + d * 0.1;
    }
    oncekiCagri = simdi;

    if (aralik > 0) {
      const tolerans = Math.min(ekranAralik ?? aralik, aralik) / 2; // §1
      if (simdi + tolerans < sonraki) return null;
      sonraki = simdi >= sonraki + aralik ? simdi + aralik : sonraki + aralik; // §2
    }

    const dt = sonCizim === null ? aralik || 16.7 : simdi - sonCizim;
    sonCizim = simdi;
    gecen += Math.min(Math.max(dt, 0), enBuyukAdimMs) / 1000;
    return gecen;
  };
}
