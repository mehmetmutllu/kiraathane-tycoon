# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-10-14 — Sprint C tur 2 kapandı · D-166 · D-167 · D-168)

**Kural:** Play Console'u Claude KULLANMAZ. iOS'a inceleme bitmeden build GİTMEZ. Play kapalı teste güncelleme serbest.
**Çalışma düzeni:** kullanıcı önce SEÇENEK ister ("direkt değiştirme, seçenek sun"); görsel kararlar ekran görüntüsüyle gösterilir.

**Tur 2 bitti:** 32 bitmap ikon (D-166) · Ametist zemin + koyu mor sandıklı Başlangıç afişi (sandık sağ orta, alınmış hâl soluk
renk) + Ayarlar zemin metni 4,8:1 + kart sayıları koyu ton ≥ 4,5:1 (D-167) · ChatGPT revizesi: kontursuz kart + `--lila-golge`,
beyaz yuvarlak geri, mor seçili sekme, kilitli SIRADA (D-168; kullanıcı: "çok daha iyi"). Kareler: `docs/tasarim/sprint-C/`
(`ametist-afis.png` · `ametist-sayilar-s2.png` · `revize-uygulandi.png`).

## ⏭️ SIRADAKİ ADIM
1. **Test APK kullanıcıda** (debug, 20,9 MiB, 2026-10-14): `android/app/build/outputs/apk/debug/app-debug.apk` + masaüstü
   `TeaHouse-test-2026-10-14.apk`. Kullanıcının telefon geri bildirimini al: sandık dar ekranda başlığa çarpıyor mu · sayılar
   okunuyor mu · kontursuz kartlar zeminden ayrışıyor mu · mor sekme/beyaz geri net mi · Ametist boğucu mu. Düzeltmeleri yap.
2. ✅ **Play 1.0.2 hazır** (2026-10-14, versionCode 10002, imzalı AAB 15,8 MiB gerçek reklam kipi): `dist-play/TeaHouseTycoon-GooglePlay.zip`
   + masaüstü kopyaları (`…-1.0.2.zip`, `TeaHouseTycoon-1.0.2.aab`). Kullanıcı arkadaşına iletir. Telefon turunda düzeltme çıkarsa 1.0.3.
3. Küçükler: Usta kartındaki açık mavi "0/7" · küçük resimde zayıf üç (semaver, Restoran ≈ Krem fayans, Klasik Parke).
   Duman erken akışı 2026-10-13'te 4 kez üst üste düştü, sonra kendiliğinden geçti (Vite ısınması şüphesi).

## AÇIK KALEMLER
- iOS inceleme: Apple cevap verdi (2026-10-14, vaka 102987045833): 8 Eki'den beri "Waiting for Review", sorun yok; geri çekip yeniden göndermek sırayı baştan başlatıyor → BEKLE, gönderime dokunma, geri çekme, hızlandırılmış inceleme isteme. Bitince e-posta gelir.
- Play: 1.0.1 zip arkadaşa (mikrometin değişti → yeni zip gerekirse `npm run play:paket`); servis hesabı JSON'u → RevenueCat; RC'de Android baslangic/reklamsiz = Non-consumable.
- Cihaz turu (Android 1.0.1): `sprint-A-defter.md` "Nasıl kontrol edersin" 5 adımı.
- Deyimix 1.0.1 "Pending Developer Release" — kullanıcı Release diyecek.
- AdMob "ABD eyalet yönetmelikleri" mesajı bakılmadı · ana görev ödülüne "video izle 2×" sorusu açık (varyant kapısı).
- Duman erken akışı ara sıra düşüyor (DUMAN_PORT=4250) · `i18n/baslat` Preferences'tan önce okuyor (küçük).
