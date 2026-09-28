# iOS kurulumu (App Store önce)

Kod ve Xcode projesi (`ios/`) Windows'ta hazırlandı. Derleme, imza ve yükleme **Mac'te** (ya da bulut derleyicide)
yapılır. Android/Play tarafına bu işte dokunulmadı; Play Games iOS'ta tamamen kapalı (Game Center bu sürümde yok).

## Kimlikler — nerede durur

| Ne | Değer | Dosya |
|---|---|---|
| Bundle ID | `com.mutlubadem.teahouse` (kullanıcı kararı 2026-09-28; Android `applicationId` ile aynı) | `ios/App/App.xcodeproj/project.pbxproj` → `PRODUCT_BUNDLE_IDENTIFIER` · `capacitor.config.ts` → `appId` |
| AdMob iOS uygulama kimliği | `ca-app-pub-9532352817217002~4395129824` (gerçek) | `ios/App/App/Info.plist` → `GADApplicationIdentifier` |
| AdMob iOS birimleri | geçişli `…/3082048152` · ödüllü `…/3787876732` (gerçek) | `src/config/ads.config.ts` → `birim.ios` |
| Test kipi | `test: true` iken HER platformda Google test birimleri istenir | `src/config/ads.config.ts` → `test` (yayın derlemesinde `false`) |
| RevenueCat iOS anahtarı | **boş** — girilene dek iOS'ta satın alma kapalı ("Mağaza hazır değil") | `src/config/iap.config.ts` → `revenueCatAnahtar.ios` (`appl_…`) |
| Ürün kimlikleri | `kiraathane_reklamsiz` · `kiraathane_baslangic` · `kiraathane_elmas_25/60/150` | `src/config/iap.config.ts` → `urun` (App Store Connect'te AYNI adla açılır) |
| Sürüm | `package.json` `version` → `MARKETING_VERSION`; derleme no = major·10000+minor·100+patch (0.9.0 → 900) | `tools/ios-duzelt.mjs` yazar |

> Android `namespace`/Java paketi `com.memedobro.teahousetycoon` olarak kaldı — o kaynak kodun paketi, mağaza kimliği değil.

## Mac'te adımlar

1. **Gerekenler:** Xcode 16+ (App Store'a yükleme için güncel Xcode şart), Node 22+, CocoaPods **gerekmez**
   (Capacitor 8 Swift Package Manager kullanır).
2. **Depoyu çek, bağımlılıkları kur:** `npm ci`
3. **Web'i derle + iOS'a eşitle:** `npm run ios:sync`
   (= `vite build` → `npx cap sync ios` → `node tools/ios-duzelt.mjs`: sürüm + SPM yolları).
4. **Xcode'u aç:** `npx cap open ios` (ya da `ios/App/App.xcodeproj`). İlk açılışta Xcode Swift paketlerini
   indirir (Capacitor, Google Mobile Ads 13.6, UMP 3.1, RevenueCat) — birkaç dakika sürer.
5. **Signing & Capabilities** (hedef *App*):
   - *Team*: Apple Developer hesabın. *Automatically manage signing* açık.
   - *Bundle Identifier*: `com.mutlubadem.teahouse` (projede yazılı; App Store Connect'teki kayıtla aynı olmalı).
   - **+ Capability → In-App Purchase** ekle.
   - Başka capability gerekmez (Push, Game Center, iCloud YOK).
6. **App Store Connect'te uygulama kaydı** (yoksa): *Uygulamalar → +* → iOS, bundle ID `com.mutlubadem.teahouse`,
   birincil dil, SKU. Ad: EN "Tea House Tycoon…" / TR "Köşe Kıraathanesi…" (yerelleştirme başına).
7. **Uygulama içi satın almalar** (App Store Connect → *Monetization → In-App Purchases*):
   - `kiraathane_reklamsiz` — **Non-Consumable**
   - `kiraathane_baslangic` — **Non-Consumable**
   - `kiraathane_elmas_25`, `kiraathane_elmas_60`, `kiraathane_elmas_150` — **Consumable**
   - Her birine fiyat, TR/EN ad-açıklama ve inceleme ekran görüntüsü. *Paid Apps* sözleşmesi + banka/vergi bilgisi
     imzalı olmalı, yoksa ürünler cihazda hiç gelmez.
8. **RevenueCat:** projeye iOS uygulaması ekle (bundle ID aynı), App Store Connect **In-App Purchase Key**
   (.p8) yükle, ürünleri içe aktar, entitlement'lar `reklamsiz` ve `baslangic` (Android'le aynı adlar).
   *Public API key* (`appl_…`) → `src/config/iap.config.ts` `revenueCatAnahtar.ios`.
9. **AdMob paneli (iOS uygulaması):**
   - *Privacy & messaging → GDPR* mesajı (AB/UK rıza formu) — Android'deki gibi.
   - *Privacy & messaging → IDFA explainer* mesajı **önerilir**: kuruluysa UMP, ATT penceresinden önce kendi
     açıklama ekranını gösterir ve ATT'yi kendisi açar. Kurulu değilse kod ATT'yi rıza formundan sonra kendisi ister.
   - `app-ads.txt` — geliştirici web sitesinde (App Store'daki "Developer Website" alanı).
10. **Yayın derlemesi için:** `src/config/ads.config.ts` → `test: false`, `npm run ios:sync`.
11. **Arşiv ve yükleme:** Xcode → cihaz hedefi *Any iOS Device (arm64)* → *Product → Archive* →
    Organizer → *Distribute App → App Store Connect → Upload*. İşlendikten sonra TestFlight'ta dene.
12. **App Store Connect formları:**
    - *App Privacy* ("gizlilik etiketi"): AdMob → Tanımlayıcılar (Cihaz kimliği), Kullanım verisi (Ürün etkileşimi,
      Reklam verisi), Tanılama; izleme için **"Evet, izleme için kullanılıyor"** (ATT soruluyor). RevenueCat →
      Satın almalar. Google'ın beyan rehberi: developers.google.com/admob/ios/privacy/data-disclosure
    - *Age Rating* anketi, *Export Compliance*: Info.plist'te `ITSAppUsesNonExemptEncryption = false` (yalnız HTTPS) —
      her yüklemede sorulmaz.
    - Gizlilik politikası URL'si (zorunlu).

## TestFlight'ta denetlenecekler (cihazda)

- İlk açılış: (AB/UK'de) rıza formu → ATT penceresi (Türkçe cihazda Türkçe metin) → oyun. İkinci açılışta pencere yok.
- Ayarlar: **Play Games bölümü YOK**, kayıt notu "Kayıt bu cihazda tutulur. Oyunu sıfırlarsan geri alınamaz."
- Çentik / Dynamic Island / ev çubuğu: üst şerit ve alt gezinme örtülmüyor (dikey + yatay).
- iPad: dört yönde dönüyor, HUD tablet düzeninde.
- Ses: ilk dokunuşta açılıyor; bir telefon çağrısı ya da arka plana geçiş sonrası ilk dokunuşta geri geliyor.
  Sessiz anahtarı açıkken oyun sesi kapalı (iOS'ta Web Audio varsayılanı; oyun için beklenen davranış).
- Satın alma: Sandbox hesabıyla alım + "Satın alımları geri yükle".
- Geçişli reklam (3 dk soğuma sonrası panel kapanışı) ve ödüllü video — test kipinde "Test Ad" etiketiyle.

## Windows'ta yapılamayanlar / açık kalemler

- **Derleme, imza, arşiv, yükleme** — Mac/Xcode ister. (`npx cap sync ios` Windows'ta çalışır ama SPM yollarını
  ters bölüyle yazar; `npm run ios:sync` bunu `tools/ios-duzelt.mjs` ile düzeltir.)
- **Uygulama simgesi ve açılış ekranı:** Android'de de iOS'ta da hâlâ **Capacitor'ın varsayılan görselleri** duruyor
  (mavi "X" logosu). Oyunun kendi simgesi yok → üretilmesi gerekiyor. Gelince:
  `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024×1024, saydamlıksız PNG — tek görsel yeter)
  ve `Splash.imageset/splash-2732x2732*.png` (3 kopya) değiştirilir; Android `res/mipmap-*` + `drawable*/splash.png`.
  Varsayılan (yer tutucu) simgeyle göndermek inceleme reddi riski taşır (Yönerge 2.3.8).
- **SKAdNetwork listesi** (Info.plist, 50 kimlik, 2026-09-28): Google güncelledikçe
  developers.google.com/admob/ios/3p-skadnetworks'ten yenilenmeli.
- **Durum çubuğu** görünür (Android'le aynı). Gizlenmesi istenirse Info.plist `UIStatusBarHidden` + ayrı karar.
- **Game Center** bu sürümde yok (kullanıcı kararı); iOS'ta bulut kaydı/başarım yok.
