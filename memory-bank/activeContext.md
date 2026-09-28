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

## ⏭️ SIRADAKİ ADIM (engel: KULLANICI)
1. **Kullanıcı:** ASC › Users and Access › Integrations › In-App Purchase › Generate key → `SubscriptionKey_XXXX.p8` indir →
   RevenueCat (proje a54ea25c) › Apps › New › App Store: ad + bundle `com.mutlubadem.teahouse` (Claude doldurdu) + .p8 +
   Key ID + Issuer ID → Save. (.p8 = özel anahtar; Claude giremez.) .p8 yedeği özel gizli-dosya deposuna.
2. Claude: RevenueCat'te 5 ürün (kiraathane_reklamsiz/_baslangic/_elmas_25/60/150) + hak `reklamsiz`, `baslangic` →
   iOS public key `appl_…` → `iap.config.ts` `revenueCatAnahtar.ios`.
3. Claude: Codemagic `ios-yayin` derlemesi (API; token özel gizli-dosya deposunda (wordmaster notu), uygulama
   `6aba443b9e5dcc12b726ba2b`) → TestFlight. Kullanıcı telefonda dener (satın alma sandbox, reklam, UMP/ATT, açılış).
4. ASC sürüm sayfasında derlemeyi seç → incelemeye gönder (KULLANICI ONAYIYLA). Not: sürümde "incelemeden sonra otomatik
   yayımla" açık.

## AÇIK KALEMLER
- Duman erken akışı ara sıra düşüyor (bu oturum 3 koşuda 1: garson pad'i görünmedi) — yeniden koşunca geçiyor.
- AdMob iOS: UMP + IDFA açıklama mesajı AdMob panelinde yayımlanmalı (kontrol edilmedi). Play Console: DONDURULDU (D-158).
- Yeni EN metinler (bu oturum ~20: "{1} short", "STATION", "Language"…) ChatGPT turuna girmedi — sonraki metin turunda.
