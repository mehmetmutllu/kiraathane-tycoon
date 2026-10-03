# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-10-03 — GOOGLE PLAY TESLİM PAKETİ · D-161)

**Kural:** Play Console'u Claude KULLANMAZ (kalıcı yasak). Play'i kullanıcının arkadaşı yükler; Claude zip + PDF rehber hazırlar.

**Bitenler (bu oturum):**
- Teslim zip'i TASLAK: `npm run play:paket` → `dist-play/TeaHouseTycoon-GooglePlay-TASLAK.zip` (git'e girmez).
  İçinde 16 sayfalık PDF rehber (10 adım: hesap türü, uygulama oluşturma, App content cevapları, mağaza sayfası TR+EN,
  ülkeler, dahili test, 5 ürün, RevenueCat servis hesabı, 9A kapalı test 12 kişi/14 gün · 9B üretim, sık hatalar),
  ikon 512, öne çıkan 1024×500, telefon 1080×1920 ×12, tablet ×12, metinler (`docs/play/metin/`).
- `npm run play` = kimlik bekçisi + gerçek reklamlı imzalı AAB + damga. Bekçi bugün 3 eksiği yakaladı (doğru).
- AAB zinciri doğrulandı (`npm run yayin` → 15,7 MB imzalı; test reklamlı → zip'e girmez).

## ⏭️ SIRADAKİ ADIM (kullanıcı Chrome oturumunu açınca)
1. **AdMob** (mutlubadem.dev): Android uygulaması "Tea House Tycoon" (henüz yayında değil) + geçişli + ödüllü birim →
   `AndroidManifest.xml` APPLICATION_ID + `ads.config.ts` `birim.android`. (GDPR/UMP mesajı da Android'i kapsasın.)
2. **RevenueCat** (proje a54ea25c): Play Store uygulaması ekle, paket `com.mutlubadem.teahouse` → `goog_` anahtar →
   `iap.config.ts`. 5 ürünü Play app'e ekle; elmaslar consumable, reklamsiz/baslangic non-consumable → haklara bağla.
   Servis hesabı JSON'u arkadaştan sonra gelir → RC'ye yükle.
3. `npm run play` → `npm run play:paket` → TAM zip kullanıcıya (SendUserFile).
4. iOS: Apple incelemesinin sonucu (2026-09-28 gönderildi) — kontrol et.

## AÇIK KALEMLER
- IAP fiyatları rehberde App Store ÖNERİ tablosundan; kullanıcı ASC'de farklı girdiyse rehberi düzelt.
- Play Games v1'de kapalı (APP_ID boş) — istenirse arkadaş Play Console'da kurar, ID gelir.
- Duman erken akışı ara sıra düşüyor — yeniden koşunca geçiyor.
- Yeni EN metinler (~20) ChatGPT turuna girmedi; Play mağaza metinleri de (ASC metninden uyarlandı).
