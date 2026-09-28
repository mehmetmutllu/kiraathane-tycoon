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

## ⏭️ SIRADAKİ ADIM — İNCELEMEDE (2026-09-28 17:06)
- ✅ **iOS 1.0.0 (derleme 1) + 5 IAP incelemeye GÖNDERİLDİ** (kullanıcı onayıyla). "İncelemeden sonra otomatik yayımla"
  açık → onaylanınca mağazada. Fiyat Ücretsiz, 175 ülke, Mac/Vision Pro KAPALI (denenmedi), içerik hakları "var + hakkım
  var", inceleme notu EN yazıldı, iletişim bilgisini kullanıcı girdi.
- RevenueCat tamam (5 ürün + 2 hak + appl_ anahtar). TestFlight iç grup "Ekip" (kullanıcı eklendi, davet gitti).
- Android test APK (debug, test reklam, IAP kapalı) kullanıcıya verildi.
1. Apple sonucu (≤ 48 sa): RED gelirse gerekçeyi oku → düzelt → Codemagic yeni derleme (derleme no otomatik artar).
2. AdMob (hesap mutlubadem.dev — Chrome'da açık DEĞİL): GDPR mesajı + IDFA açıklayıcı + ödeme profili → kullanıcı o
   hesapla girince. (mutlubadem4456 AdMob hesabı ayrı, boş — orada bir şey yapılmadı.)
3. Sonra: F5 kapanışı, v1.1 listesi.

## AÇIK KALEMLER
- Duman erken akışı ara sıra düşüyor (bu oturum 3 koşuda 1: garson pad'i görünmedi) — yeniden koşunca geçiyor.
- Play Console: DONDURULDU (D-158).
- Yeni EN metinler (bu oturum ~20: "{1} short", "STATION", "Language"…) ChatGPT turuna girmedi — sonraki metin turunda.
