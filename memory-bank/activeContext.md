# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-28, 3. oturum — YAYIN SPRİNTİ + İKİ DİL · D-158/D-159)

**Bitenler (bu oturum):**
- ASC: 5 IAP ürünü açıldı (READY_TO_SUBMIT) — fiyat USD 0,99/1,99/3,99 · TR elle 34,99/64,99/129,99 ₺, EN/TR ad+açıklama,
  inceleme görseli. Uygulama adı her iki dilde "Tea House Tycoon", TR açıklamadan kıraathane çıktı, kategori, yaş 4+,
  telif, sürüm 1.0.0, metinler. **Mor bantlı 24 görsel yüklendi** (iPhone 6,9" + iPad 13", en-US + tr).
- Codemagic: uygulama eklendi (`6aba443b9e5dcc12b726ba2b`), CERTIFICATE_PRIVATE_KEY `appstore_kimlik` grubunda;
  `codemagic.yaml` (ios-yayin, VITE_REKLAM=gercek bekçisi). Henüz DERLEME BAŞLATILMADI.
- Gizlilik/destek sitesi: mehmetmutllu.github.io/tea-house-tycoon/ (EN+TR); Ayarlar'da gizlilik/destek + UMP tercih (Y-06).
- İkon: `docs/logotasarim/ikon-1024.png` → iOS AppIcon. iPad açık, tablet HUD zoom 1,4. Müşteri kapsül sorunu ölçüldü: 0.
- **i18n (yarım, ama yeşil):** `src/i18n` (t, dil, cihazDili, baslat), EN sözlük 390 giriş, `settings.dil`, UI + game
  dosyaları `tools/i18n-sar.mjs` ile sarıldı; yüzde biçimi/tabela büyük harf/varsayılan ad dile bağlı. Duman `locale: tr-TR`.
- Testler: 1742 ✓ · duman 71/71 · lint/tsc temiz.

## ⏭️ SIRADAKİ ADIM (i18n'i bitir)
1. **Ayar dosyalarındaki VERİ metinleri ekrana basıldığı yerde çevrilmedi:** `economy.config.ts` (görev başlık/açıklama,
   pad/masa adları, kozmetik/dekor/tema adları, hedef adları), `onboarding.ts`, `playGames.config.ts` (Android). Görüntülendiği
   yerlerde `t(x.label)` / `t(q.title)` sar (`.label`, `.title`, `.desc`, `.ad`, `.aciklama` kullanımlarını grep'le).
   Sözlükte hepsi VAR (docs/i18n/sozluk.json).
2. Ayarlar'a **Dil** satırı ekle (Otomatik / Türkçe / English → `setSetting('dil')`; metinler sözlükte: "Dil", "Otomatik",
   "Dil değişince oyun yeniden yüklenir").
3. Bekçi `tests/i18n.test.ts`: (a) `t('…')` literal'lerinin hepsi en.ts'te; (b) `node tools/metin-tara.mjs` UI'da açık
   metin 0 (config hariç); (c) EN kipte HUD'da Türkçe harf kalmıyor (duman'a EN koşusu: `locale: 'en-US'`). ≥2 mutasyon.
4. Kalan ufaklar: bulut.ts/iap.ts iç metinleri (dev), `Semaver ısınıyor…` → yükleme ekranı işi.
5. **Yükleme ekranı:** kullanıcı SEÇENEK 2'yi seçti (oyun moru + ışık, logo-maskot-saydam) — `SplashScreen.tsx`e uygula,
   görsel `public/assets/ui/logo-acilis.webp` (720 px) üret + manifest; iOS yerel açılış görseli (Splash.imageset, şu an
   Capacitor'ın mavi X'i!) aynı zeminle 2732² üret. Önizleme: artifact 6qVMUGhxRJgv9KxjiWJY9n.
6. Oyunun kendi fontu Lilita One'da İ/ğ/ş yok (incelip yedek fonta düşüyor) → kullanıcıya sor/öner (Luckiest Guy tam).
7. Sonra: TestFlight derlemesi (Codemagic API ile başlat), RevenueCat iOS + ASC In-App Purchase anahtarı (Chrome),
   Paid Apps sözleşmesi (kullanıcı), App Privacy formu (Chrome), incelemeye gönderim (kullanıcı onayı).

## KULLANICIYA SORULACAKLAR
- Oyun fontu (madde 6). Mağaza EN açıklamasındaki "Language: the game is currently in Turkish." satırı i18n bitince SİLİNMELİ.

## AÇIK KALEMLER (öncekiler)
- Duman erken akışı (q_coin) ara sıra düşüyor (bu oturumda 4 koşuda 2) — yeniden koşunca geçiyor; ayrıca bakılmalı.
- AdMob iOS: UMP + IDFA açıklama mesajı yayımlanmalı. Play Console: DONDURULDU (D-158).
