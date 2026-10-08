# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-10-08 — iOS YENİDEN İNCELEMEDE · Play paketi arkadaşta · D-161)

**Kural:** Play Console'u Claude KULLANMAZ (kalıcı yasak). Play'i kullanıcının arkadaşı yükler; Claude zip + PDF rehber hazırlar.

**Bitenler (bu oturum, Claude in Chrome, mutlubadem.dev):**
- AdMob Android uygulaması `ca-app-pub-9532352817217002~7822557727` · geçişli `/1423661177` · ödüllü `/7797497835`
  → `AndroidManifest.xml` + `ads.config.ts` `birim.android`.
- AdMob GDPR mesajı ("tüm uygulamalar") iki Tea House uygulamasını da (iOS dahil!) kapsamıyordu → gizlilik URL'siyle eklendi.
- RevenueCat Play uygulaması `appc0cb3555a3` (paket `com.mutlubadem.teahouse`) · `goog_` anahtar → `iap.config.ts`
  · 5 ürün iOS'un aynısı (elmas consumable, reklamsiz/baslangic non-consumable + haklara bağlı).
- `npm run play` → gerçek reklamlı imzalı AAB 15,7 MB (Windows'ta `gradlew.bat` → `.\gradlew.bat` düzeltildi).
- `npm run play:paket` → `dist-play/TeaHouseTycoon-GooglePlay.zip` (TAM, 67 MB, git'e girmez). Testler 1746 + duman 71/71 + EN 4/4.

## ⏭️ SIRADAKİ ADIM
1. Kullanıcı zip'i arkadaşına iletir (SendUserFile 502 verdi; dosya yerelde).
2. Arkadaştan servis hesabı JSON'u gelince → RevenueCat Play uygulamasına yükle (Chrome, mutlubadem.dev).
3. Play'de yayına çıkınca AdMob Android uygulamasını mağaza kaydına bağla (AdMob → Uygulama ayarları).
4. iOS: 2026-10-08 eski gönderim (28 Eyl, 10 gün takılı; Deyimix aynı hesapta 1 günde onaylandı) geri çekildi → Codemagic build 2 (0760916, görev halkası dahil) + 5 IAP 15:22'de yeniden incelemeye gönderildi → sonucu izle.
5. Görevler halka düzeltmesi iOS 1.0.0 build 2'de; Play AAB'sine henüz girmedi (Play zip'i 6cbfeba'dan).
6. Kullanıcıya açık soru: ana görev ödülüne "video izle 2×" eklensin mi? → denge+reklam sıklığı değişir, önce ölçüm (varyant kapısı).

## AÇIK KALEMLER
- Deyimix 1.0.1 (aynı ASC hesabı) onaylı, "Pending Developer Release" — kullanıcı Release diyecek.
- Tea House 1.0.0 'Version Release' ayarı (elle/otomatik) bu turda kontrol edilmedi; onay gelince bak.
- AdMob "ABD eyalet yönetmelikleri" mesajı Tea House'u kapsıyor mu bakılmadı (GDPR eklendi).
- IAP fiyatları rehberde App Store ÖNERİ tablosundan; kullanıcı ASC'de farklı girdiyse rehberi düzelt.
- Play Games v1'de kapalı (APP_ID boş) — istenirse arkadaş Play Console'da kurar, ID gelir.
- Duman erken akışı ara sıra düşüyor — yeniden koşunca geçiyor (bu oturumda da 1 kez).
- Yeni EN metinler (~20) ChatGPT turuna girmedi; Play mağaza metinleri de (ASC metninden uyarlandı).
