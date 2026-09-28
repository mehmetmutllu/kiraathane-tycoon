# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-28, 4. oturum — YAYIN SPRİNTİ · D-160)

**Bitenler (bu oturum):**
- i18n BİTTİ: config verisi ekranda `t()`, Ayarlar › Dil, bekçi `tests/i18n.test.ts` (3 mutasyon), İngilizce duman
  `tools/smoke-en.mjs` (`npm run duman` TR 71 + EN 4). Yüzde/süre/"eksik"/"elmas" parçaları tek metin.
- Yükleme ekranı seçenek 2 + iOS yerel açılış görseli (mavi X gitti) + WebView zemini mor.
- Rakam fontu Luckiest Guy (Lilita kalktı); yazı olan yerlerde metin fontu (i noktasız sorunu).
- ASC: EN açıklamadan "Language: …Turkish" satırı silindi · App Privacy dolduruldu ve YAYIMLANDI (D-160).
- Paid Apps sözleşmesi, banka, vergi formları zaten AKTİF (kontrol edildi).
- İki makine senkron betiği: oturum aç/kapa aynı anda koşunca (/clear) yarış → kilit eklendi.

## ⏭️ SIRADAKİ ADIM
- ✅ RevenueCat: App Store uygulaması (IAP anahtarı 598KB7HRD8, "Valid credentials") · 5 ürün · reklamsiz/baslangic
  haklarına bağlı · iOS public key `iap.config.ts`e girdi (57461ed). Ürünler "Could not check": RC'ye ASC API anahtarı
  verilmedi (opsiyonel, yalnız içe aktarma/fiyat için).
- 🔧 Codemagic `ios-yayin` derlemesi `6aba6bdacc1aa81a99853c6b` başlatıldı → TestFlight.
1. Derleme bitince: TestFlight'ta işlenmesini bekle → kullanıcı telefonda dener (satın alma sandbox, reklam, ATT, açılış, dil).
2. ASC sürüm sayfasında derlemeyi seç → incelemeye gönder (KULLANICI ONAYIYLA; "incelemeden sonra otomatik yayımla" açık).
3. AdMob (hesap mutlubadem.dev — bu Chrome'da açık DEĞİL): GDPR mesajı + IDFA açıklayıcı + ödeme profili kontrolü →
   kullanıcı o hesapla giriş yapınca. Yayını engellemez (ATT penceresi kod içinden açılıyor).

## AÇIK KALEMLER
- Duman erken akışı ara sıra düşüyor (bu oturum 3 koşuda 1: garson pad'i görünmedi) — yeniden koşunca geçiyor.
- Play Console: DONDURULDU (D-158).
- Yeni EN metinler (bu oturum ~20: "{1} short", "STATION", "Language"…) ChatGPT turuna girmedi — sonraki metin turunda.
