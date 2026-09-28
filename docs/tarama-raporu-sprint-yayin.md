# YAYIN ÖNCESİ TAM TARAMA — sprint "yayın" (WIP)

> Tur tipi: **tarama**. Oyun koduna dokunulmadı. Araç: `tools/tarama-yayin.mjs` (+ `tools/tarama-vite.config.mjs`).
> Kareler/ham çıktı: `docs/kareler/tarama-yayin/` (`sonuc-hat.json`, `sonuc-reklam.json`, `sonuc-ag.json`, `gec-kayit.json`).
> **WIP — kullanıcı PC'yi kapattığı için yarıda commit edildi.** Taranmamış alanlar en altta.

## Özet

| Önem | Adet |
|---|---|
| Engelleyici | 6 |
| Yüksek | 8 |
| Orta | 12 |
| Düşük | 13 |
| Cila | 5 |

**Yayını engelleyenler (iOS App Store):**
1. **Y-01** iOS platformu yok (`ios/` yok, `@capacitor/ios` bağımlılıkta yok).
2. **Y-02** AdMob test kipinde + yalnız Android test kimlikleri; iOS `GADApplicationIdentifier` yok.
3. **Y-03** ATT (App Tracking Transparency) istemi + `NSUserTrackingUsageDescription` + SKAdNetwork yok.
4. **Y-04** RevenueCat anahtarı `null` (iOS anahtarı alanı bile yok) → cihazda satın alma kapalı.
5. **Y-05** `viewport-fit=cover` yok → iOS'ta `env(safe-area-inset-*)` 0; üst şerit çentiğin/Dynamic Island'ın, alt gezinme ev çubuğunun altında kalır.
6. **Y-06** Uygulama içinde Gizlilik Politikası bağlantısı ve UMP "reklam tercihleri" girişi yok (Guideline 5.1.1).

## Düzeltme durumu (2026-09-28 ikinci oturum)

| Bulgu | Durum | Nerede |
|---|---|---|
| Y-01…Y-05 | ✅ iOS dalında (birleşti) | `ios/`, `platform.ts`, `ads.ts` ATT/UMP |
| Y-06 | 🔧 yarım: UMP girişi var mı doğrulanmadı; gizlilik bağlantısı gizlilik sayfası yayınlanınca | — |
| Y-16 · Y-17 | ✅ bayrak ödül ekranının kendisinde (`RewardModal`, `SatinOdulu`) — geri tuşu da kapsanır | duman "Ödül ekranından sonra geçişli yok" · 2 mutasyon |
| Y-23 | ✅ yüklemede pad onarımı `eksikPadGorevi` | `gorev-kimligi.test.ts` Y-23 · 2 mutasyon |
| Y-25 | ✅ `satin.islemElmas` (additive) · bulut birleşirken yerel işlemin 💎'ı taşınır | `play-games-f4b.test.ts` Y-25 · 2 mutasyon |
| Y-34 | ✅ "Bulaşık birikiyor" | — |
| Paketler "Google hesabında" | ✅ `magazaHesabi()` iOS'ta "Apple hesabında" | `ios-platform.test.ts` |

## Yöntem

- **hat** — taze kayıt → T9b botu (tek düzeltmeyle: hedefin tam üstünde 0/0 = NaN yön) gerçek `tick` + klavye girdisiyle
  görev hattını yürütür. 15 dk (sim) ilerleme yoksa: pad görevinde para verilir (botun kuralı "cüzdan ≥ TAM fiyat"),
  pad dışında `__setQuest` ile atlanır. **Sonuç: 50/50 görev, 21.120 sn sim; sayı hatası 0 (para/elmas/xp sonlu ve ≥ 0,
  DOM'da NaN/Infinity/undefined yok); konsol yalnız 2 three.js kullanımdan kaldırma uyarısı; WebGL bağlamı kaybı yok;
  dış alan adına istek 0.**
- **reklam** — geçişli reklam kuralı canlı (`__ads.saat` ile soğuma dolduruldu), 5 senaryo.
- **kayit** — kaydet-yenile, çevrimdışı 3 sa, saat geri, yeni sürüm, v33/v32/v31 göçü, bozuk kayıt (yarıda kaldı, bkz. sonu).
- Statik okuma: monetizasyon + App Store · metin/i18n · kayıt/ilerleme (T9b bulgularının durumu dahil).
- **Tezgâh notu:** git worktree'de `node_modules` bağlantı olduğundan vite `@fontsource` yazı tiplerini 403 ile reddediyordu
  → `tools/tarama-vite.config.mjs` (fs.allow). Ürün hatası değil.

## §Bulgular

Doğrulama: **canlı** = araçta gözlendi · **kod** = satır okundu · **betik** = izole deneme.
Denge sütunu: **evet** = `economy.config.ts` / `tick.ts` / `rules.ts` sayısına/davranışına dokunur → varyant kapısı.

### A — App Store (iOS) / yayın

| Kimlik | Önem | Bulgu | Yeniden üretim / kanıt | Önerilen düzeltme · dosyalar | Denge |
|---|---|---|---|---|---|
| Y-01 | engelleyici | iOS platformu yok | `ios/` klasörü yok; `package.json`'da `@capacitor/ios` yok; betikler yalnız Android (`cap:sync`, `apk`, `yayin`) | `npm i @capacitor/ios@^8` · `npx cap add ios` · `cap:sync:ios` betiği · `package.json`, `capacitor.config.ts` | hayır |
| Y-02 | engelleyici | AdMob test kipi + yalnız Android test birimleri | `ads.config.ts:11` `test: true`; `:13-14` Google test kimlikleri; platform ayrımı yok; iOS `Info.plist` `GADApplicationIdentifier` yok | `birim` platform başına (`Capacitor.getPlatform()`), gerçek kimlikler, `test:false` · `src/config/ads.config.ts`, `src/game/ads.ts`, `ios/App/App/Info.plist` | hayır |
| Y-03 | engelleyici | ATT istemi + SKAdNetwork yok | `ads.ts:76-82` `kur()` AdMob'u ATT sormadan başlatıyor; `requestTrackingAuthorization` çağrısı yok | iOS'ta UMP'den sonra ATT, sonra `AdMob.initialize`; `NSUserTrackingUsageDescription` + `SKAdNetworkItems` · `src/game/ads.ts`, `Info.plist` | hayır |
| Y-04 | engelleyici | RevenueCat anahtarı yok, iOS alanı yok | `iap.config.ts:12` `revenueCatAnahtar: null` ("Android public SDK key"); cihazda IAP kapalı (`iap.ts:117-118`) | `{ android, ios }` anahtarları; App Store Connect'te aynı ürün kimlikleri (reklamsız/başlangıç = non-consumable, elmas = consumable) · `src/config/iap.config.ts`, `src/game/iap.ts` | hayır |
| Y-05 | engelleyici | Güvenli alan iOS'ta 0 | `index.html:14` viewport `viewport-fit=cover` içermiyor; CSS `env(safe-area-inset-*)` kullanıyor (`index.css:71-73`, `hud.css:16` …) | viewport'a `viewport-fit=cover`; çentikli cihazda doğrula · `index.html` | hayır |
| Y-06 | engelleyici | Gizlilik politikası bağlantısı + UMP tercih düğmesi yok | `src/`'de "gizlilik/privacy" yok; `showPrivacyOptionsForm` çağrılmıyor | Ayarlar'a "Gizlilik Politikası" bağlantısı + "Reklam tercihleri" · `src/components/ui/HUD.tsx` (Ayarlar), `src/game/ads.ts` | hayır |
| Y-07 | yüksek | iOS'ta Android/Google metinleri | `HUD.tsx:605` "Play Games'e bağlıysan buluta da yedeklenir" · `HUD.tsx:1694` "Aldıkların Google hesabında saklanır" (Guideline 2.3.10) | platforma göre metin ("mağaza hesabında"); bulut satırı yalnız Play Games kullanılabilirken · `HUD.tsx` | hayır |
| Y-08 | yüksek | iOS'ta bulut kaydı/başarım yok | `bulut.ts:46` yalnız `PlayGames` eklentisi; Game Center/iCloud karşılığı yok (güvenle kapanıyor) | v1'de kabul et ya da aynı arayüzün arkasına Game Center · `src/game/bulut.ts` | hayır |
| Y-09 | orta | iOS yön/iPad çoklu görev ayarı yok | Android `fullUser` (D-132); iOS `UISupportedInterfaceOrientations` / `UIRequiresFullScreen` belirlenmedi | `Info.plist` | hayır |
| Y-10 | orta | Gizlilik bildirimi dosyası + App Privacy etiketleri + şifreleme beyanı + sürüm otomasyonu yok | `PrivacyInfo.xcprivacy` yok; `ITSAppUsesNonExemptEncryption` yok; sürüm yalnız Android'de `package.json`'dan | iOS projesi kurulunca eklenir · `ios/…` | hayır |
| Y-11 | orta | Yaş derecesi ↔ kısıtsız reklam | D-151: SDK kısıtı yok → App Store yaş anketi buna göre doldurulmalı, Kids kategorisi YOK, AdMob panelinde olgun kategoriler engelli olmalı | mağaza beyanı (kod değil) | hayır |
| Y-12 | düşük | Draco çözücü CDN'den inebilir | drei `useGLTF` varsayılanı Draco'yu gstatic'ten yükler; bugün Draco'lu model yok → **canlıda dış istek 0** (`sonuc-ag.json` boş) | `useGLTF(url, false)` ya da çözücüyü yerel paketle (ileride sıkıştırılmış model sessizce çevrimdışı kırılmasın) · `src/components/three/*` | hayır |
| Y-13 | düşük | Geri yükle yalnız Ayarlar'da | Var (`HUD.tsx:603`, `2056`) — 3.1.1 karşılanıyor; inceleyici paket listesinin yanında arar | `<GeriYukle/>` Paketler sekmesine de · `HUD.tsx:1693` | hayır |
| Y-14 | cila | Uygulama adı İngilizce, iOS yerel adı yok | `index.html:16`, `capacitor.config.ts:17` "Tea House Tycoon"; Türkçe ad yalnız Android `strings.xml` | `CFBundleDisplayName` + `tr.lproj/InfoPlist.strings` | hayır |
| Y-15 | yüksek (web yayını varsa) | Web derlemesinde sahte mağaza | `iap.ts:117-119` yerel olmayan her platformda sahte arka uç → üretim web derlemesinde satın alma bedava | `import.meta.env.DEV` kapısı · `src/game/iap.ts` | hayır |

### B — Monetizasyon etiği (canlı: `sonuc-reklam.json`)

| Kimlik | Önem | Bulgu | Yeniden üretim / kanıt | Önerilen düzeltme · dosyalar | Denge |
|---|---|---|---|---|---|
| Y-16 | yüksek | **Gerçek parayla 💎 alımının "Harika!" ekranından sonra geçişli reklam çıkıyor** | R1: soğuma dolu → Mağaza › Paketler › 25 💎 → "Harika!" → Tamam → mağazayı kapat → `gecisli` +1 (beklenen 0). Kare `reklam-r1-satin-odul.jpg` | `Paketler.al` başarılıysa `odulAlindi()` · `HUD.tsx:1631-1635` + bekçi testi | hayır |
| Y-17 | yüksek | **Çevrimdışı ödül ekranından sonra geçişli reklam çıkıyor** | R2: Hedefler açık → çevrimdışı ödülü gelir (panelin üstünde) → "Al" → paneli kapat → `gecisli` +1 (beklenen 0). Kare `reklam-r2-cevrimdisi-panel-ustu.jpg`. Sıcak dönüşte gerçek yol: panel açıkken arka plana → dönüş | `claimOffline` (ve Usta alımı) `odulAlindi()` çağırsın ya da `arkaPlanaGec`/`onPlanaDon` paneli kapatsın · `HUD.tsx:666-667`, `store.ts:1435-1458` | hayır |
| Y-18 | orta | Ödüllü video geçişli soğumasını sıfırlamıyor | kod: `ads.ts:214-224` `sonGecisli` güncellenmiyor. **Canlı R3'te çıkmadı** (videonun ödül kartı `odulAlindi` tetikledi olabilir) → video kartından DEĞİL başka yoldan ödüllü (Usta videosu) sonrası doğrulanmalı | `odulluIzle` hak edince `sonGecisli = Date.now()` · `src/game/ads.ts` | hayır |
| Y-19 | orta | Oturum/gün tavanı yok; sıcak dönüşte soğuma sıfırlanmıyor | kod: `ads.ts:147,168` `oturumBasi` yalnız soğuk açılışta; arka plandan dönüşte ilk panel kapanışı hemen reklam; ilk görevler reklamsız değil | oturum tavanı + dönüşte soğuma + ilk N görev muafiyeti · `src/config/ads.config.ts`, `src/game/ads.ts` | hayır |
| Y-20 | düşük | Geçişli ile başlangıç teklifi art arda gelebilir | kod: `ekranKanali.ts:87` teklif ekran boşalınca | reklamdan sonra ~30 sn teklif bastır · `src/game/ekranKanali.ts` | hayır |
| Y-21 | cila | "Elmas Sandığı" adı loot-box çağrıştırır | `economy.config.ts:1049` (içerik sabit miktar) | "Elmas Yığını" | hayır (metin) |
| — | ✅ | Kontrol senaryoları | R0 düz kapanış → +1 (doğru) · R4 seviye ödülü sonrası → 0 (doğru) · banner yok · Reklamsız ödüllüye dokunmuyor · 💎 paketleri sabit (loot-box yok) · fiyat mağazanın `priceString`'inden | — | — |

### C — İlerleme / kayıt

| Kimlik | Önem | Bulgu | Yeniden üretim / kanıt | Önerilen düzeltme · dosyalar | Denge |
|---|---|---|---|---|---|
| Y-22 | — (✅) | **Görev hattı sonuna kadar yürüyor** | canlı: 50/50, hat sonu bandı "Görev hattı tamamlandı — kıraathane senin." Bot takılmaları (11): 9'u pad (botun "tam fiyat" kuralı — para verildi), `q_tost5` (bot tost servis etmez; betikle `tostServed` +3 → görev ilerledi ✅), `q_stationMax` (1000 sn'de maliyet dolmadı — tempo, kilit değil) | — | — |
| Y-23 | yüksek | **v31 kaydı göçünde hat pad'siz kilitlenebilir** | kod (statik ajan): `save.ts:387-402` `migrateV31` eski index'i BUGÜNKÜ hatla kimliğe çeviriyor; T8a hattı değiştirdi → pad görevi "bitti" işaretlenip pad `padsDone`'da yok → sonraki pad görünmez. `gorev-kimligi.test.ts:112-128` fikstürü tam bu durum, ama test yalnız kimliklere bakıyor. **Canlı göç karesi alındı (`kayit-goc-v31.jpg`), sonuç JSON'u yarıda kaldı** | yüklemede onarım: `padsDone`'da olmayan en erken pad görevini etkinleştir; "göç edilmiş kayıt ilerleyebilir" testi · `src/game/questProgress.ts`, `store.ts` init, `rules.ts` | mantık (sayı yok) |
| Y-24 | orta | v32/v33 kaydında `waiter2` hat sonuna kadar gelmez | kod: `questProgress.ts:36-43` + T8a sırası | `migrateV33`'te onarım · `src/game/save.ts` | hayır |
| Y-25 | yüksek | **Bulut kaydı yüklenince satın alınan 💎 kaybolur** | kod: `bulut.ts:103-118,214-218` yeniden kur → Play Games'e girmeden 💎 al → gir → buluttaki kayıt yereli ezer, işlem kimlikleri `islenen`'e birleşir → yeniden verilmez | `bulutlaBirlestir` bulutta olmayan işlemlerin 💎'sini taşısın · `src/game/bulut.ts` | hayır |
| Y-26 | orta | **Bozuk/eksik alanlı kayıtla oyun AÇILMIYOR olabilir** | canlı: `stats` silinmiş + `padsDone:null` + `wallet:'abc'` + `settings:{}` kaydıyla yeniden yükleme → 90 sn'de canvas görünmedi (araç `eksik-alan` senaryosunda zaman aşımı). **Tek koşu, tekrar doğrulanmalı** (aracın yazma-dondurma kancası etkilemiş olabilir) | `kayitCoz`'da Decimal dizgeleri (`isFinite`, ≥ 0) ve dizi öğelerini doğrula · `src/game/save.ts` | hayır |
| Y-27 | orta | Bozuk JSON kaydı sessizce silinir | kod: `save.ts:473-475` parse hatası → `defaultSave()`, 2 sn sonra üzerine yazılır | son iyi kaydın `.bak`'ı ya da parse hatasında yazma kilidi · `src/game/save.ts` | hayır |
| Y-28 | orta | Saati ileri-geri alarak Reklamsız günlük 💎 tekrar alınıyor | kod: `rules.ts:878` `!==` (D2 deseni uygulanmamış), `rules.ts:814-821` | `gun > s.gunlukGun` · `src/game/rules.ts` | mantık (sayı yok) |
| Y-29 | düşük | Daha yeni sürümlü kayıtta oturum sessizce kaydedilmiyor | kod: `save.ts:438-464` kilit var, oyuncuya bildirim yok (T9b A5 kısmi) | HUD bildirimi · `save.ts`, `HUD.tsx` | hayır |
| Y-30 | düşük | Girdi/konum NaN'a karşı kelepçe yok | canlı (bot): `inputKeyboard` NaN → oyuncu konumu NaN → kamera boşluğa bakar, ekran kalıcı kararır. Gerçek joystick NaN üretmiyor (`Joystick.tsx:20-23`) → savunma | `tick.ts:718` girdi `Number.isFinite` değilse 0 · `src/game/tick.ts` | evet (tick.ts, sayı yok) |
| Y-31 | düşük | Görev ödülü gelir izine giriyor → seviye/video ₺'si şişer | kod: `tick.ts:1526` vs `store.ts:637` | `izKaydir(qReward)` | **evet — varyant kapısı** |
| Y-32 | düşük | Sıcak dönüş, açık çevrimdışı ekranının "İzle" ekini eziyor · reklam açıkken arka plan süresi sayılmıyor · kilitli kayıtta bulut yükleme sessizce olmuyor · `teasServedByArea` yerinde değişiyor | kod: `store.ts:1440-1456`, `App.tsx:100-101`, `store.ts:1477-1481`, `tick.ts:286,854` | ayrı küçük düzeltmeler | `tick.ts` kısmı evet (sayı yok) |
| Y-33 | düşük | Hedefler "Mekân" son kademe = toplam pad sayısı (24), "Usta" 20 = toplam masa | kod: `economy.config.ts:979-980` — tek pad kalkarsa ulaşılamaz | `tiers[son] ≤ pads.length` bekçi testi | yapılandırma |

T9b bulgularının durumu (statik ajan, kodla): **32 düzeldi · 4 kısmi (A5 → Y-29, C3, D2 → Y-28, D5 tasarım) · 1 açık (D3: "bardak yıka" günlüğü `q_wash`tan önce gelebilir, düşük).**

### D — Metin

| Kimlik | Önem | Bulgu | Kanıt | Düzeltme · dosya | Denge |
|---|---|---|---|---|---|
| Y-34 | yüksek | Yazım hatası "Bulaşık **biriyor**" | `HUD.tsx:854` (öğretme kartı başlığı) | "Bulaşık birikiyor" | hayır |
| Y-35 | düşük | Ayarlar'da geliştirici bilgisi "Kayıt şeması v34" | `HUD.tsx:596` | kaldır ya da "Sürüm 0.9.0" | hayır |
| Y-36 | orta | "Hedef" iki anlamda: "Hedefe git" (görev) ↔ "Hedefler" sekmesi (koleksiyon) | `HUD.tsx:436,803` ↔ `478` | "Göreve git" / "Göreve bak" | hayır |
| Y-37 | orta | Usta penceresinde masa no genel indeks ("Masa 6"), hat salon başına ("Salon 2: 2. masa") | `HUD.tsx:939,950` | "Salon 2 · 2. masa" | hayır |
| Y-38 | düşük | Seviye kısaltmaları karışık: görev "(L2)…(L6)", masa "Sv n", diğerleri "Seviye" | `economy.config.ts:867-875`, `markerFrame.ts:94` | tek biçim | metin (config) |
| Y-39 | düşük | Büyük harf tutarsızlığı ("2. Masayı aç", "Satın Al" ↔ "Oyunu sıfırla", pad "Garson Tut" ↔ görev "Garson tut"); "Salon'u/Salon'da" gereksiz kesme | `economy.config.ts:808-878`, `HUD.tsx:1963,2006,1999-2014` | cümle düzeni her yerde | metin (config) |
| Y-40 | düşük | Salon 3'ün iki adı ("ŞERİT" ↔ "SALON 3") · "nokta" jargonu · Çaycı panelinde birim karışık (bardak/ürün, "Hız"/"Hareket Hızı"), sonraki değer kodda `cap+1`/`cap+2` | `economy.config.ts:866-878`, `HUD.tsx:600,1275`, `CharacterPanel.tsx:110-259` | tek ad; değer config'ten | metin |
| Y-41 | düşük | Biçimleyici dışı sayılar: XP çubuğu `cur/need` (Sv 7+ "1025"), 💎 miktarları, görev `cur/total`; `toLocaleString` doğrudan | `HUD.tsx:1252,427,1140,960,1281,722…`; `dailyQuests.ts:191`; `fmt(NaN)` → "NaN Mn" | `fmt`/`sayi` | hayır |
| Y-42 | cila | Oyun parası gerçek "₺" işaretiyle, gerçek fiyatlarla yan yana | `HUD.tsx:597,1970`, `economy.config.ts:981,1094`, `playGames.config.ts:51-53` | sikke simgesi / oyun parası adı | metin |
| Y-43 | cila | Bildirimlerde emoji (🪑 ☕ 🍞 🔓) — tasarım notu emojiyi yasaklıyor | `rules.ts:535,543,546` | kaldır | hayır |
| Y-44 | cila | "{N} para topla" miktar gibi okunuyor · "Reklamla Usta yarın yeniden" eksik cümle · "Müşteriler çayını içince" | `economy.config.ts:1092`, `HUD.tsx:974,856` | "{N} kez para topla" vb. | metin |
| — | bilgi | İngilizce sürüm yok (i18n altyapısı yok; yalnız `decimal.ts` `Dil`) → eksik çeviri listesi yok | — | — | — |

### E — Arayüz (kısmi — yalnız hat karelerinden)

| Kimlik | Önem | Bulgu | Kanıt | Düzeltme · dosya | Denge |
|---|---|---|---|---|---|
| Y-45 | orta | Kenar oku (sol üst sarı ">") seviye rozetinin ÜSTÜNE biniyor, rakamı örtüyor | `hat-22-q_z2table4.jpg`, `hat-son.jpg` (390×844) — hedef ekran dışında soldayken | kenar okunun üst sınırı HUD şeridinin altında kelepçelensin · `HUD.tsx` (edge-arrow), `hud.css` | hayır |

## Taranmamış / yarım kalanlar (WIP)

- **Kayıt fazı** yarıda: `eksik-alan` senaryosunda zaman aşımı → `sonuc-kayit.json` yazılmadı. Alınan kareler:
  `kayit-cevrimdisi-3sa`, `kayit-saat-geri`, `kayit-yeni-surum`, `kayit-goc-v33/v32/v31` (sayısal sonuçlar yok).
  Kalan: `oyuncu-null`, `cok-eski-v20`, bozuk JSON, **sıcak dönüş** (arka plan 3 sa).
  → Araç: senaryo başına try/catch eklenmeli (bir senaryo çökünce faz düşmesin).
- **UI fazı hiç koşmadı**: 4 görüntü alanı (390×844 · 375×667 · iPad dikey · iPad yatay) × taze/geç × tüm ekranlar
  (taşma/kesik/örtülme/< 44 px/< 11 px/güvenli alan — araçta hazır: `TARAMA_FAZ=ui`).
- **Perf fazı hiç koşmadı** (CPU 4×, taze/geç kare süresi, yığın, ilk yükleme — araçta hazır: `TARAMA_FAZ=perf`).
- Y-18 (ödüllü sonrası soğuma) Usta videosu yoluyla canlı doğrulanmadı · Y-26 tekrar koşusu.
- Koşu sırası (sonraki oturum): `TARAMA_FAZ=kayit,ui,perf node tools/tarama-yayin.mjs` (sunucuyu kendi açar, port 5305;
  `gec-kayit.json` hat fazının gerçek geç-oyun kaydıdır, yeniden üretmek için `TARAMA_FAZ=hat`, ~6 dk).

## Dosya çakışma grupları (paralel düzeltme için)

| Grup | Bulgular | Dosyalar |
|---|---|---|
| G1 iOS iskeleti | Y-01, Y-09, Y-10, Y-14 | `package.json`, `capacitor.config.ts`, `ios/**` (yeni) |
| G2 reklam | Y-02, Y-03, Y-06 (UMP kısmı), Y-18, Y-19, Y-20 | `src/config/ads.config.ts`, `src/game/ads.ts`, `src/game/ekranKanali.ts`, `Info.plist` |
| G3 IAP | Y-04, Y-15 | `src/config/iap.config.ts`, `src/game/iap.ts` |
| G4 HUD metin/akış | Y-06 (Ayarlar), Y-07, Y-13, Y-16, Y-17 (HUD kısmı), Y-34…Y-37, Y-41, Y-42, Y-45 | `src/components/ui/HUD.tsx`, `hud.css` |
| G5 kayıt | Y-23 (save), Y-24, Y-26, Y-27, Y-29 | `src/game/save.ts`, `src/game/questProgress.ts` |
| G6 store/tick (varyant kapısı) | Y-17 (store kısmı), Y-30, Y-31, Y-32 | `src/game/store.ts`, `src/game/tick.ts`, `src/App.tsx` |
| G7 kurallar | Y-23 (rules), Y-28 | `src/game/rules.ts` |
| G8 bulut | Y-08, Y-25 | `src/game/bulut.ts` |
| G9 config metinleri | Y-21, Y-33, Y-38, Y-39, Y-40, Y-43, Y-44 | `src/config/economy.config.ts`, `rules.ts` (emoji), `markerFrame.ts`, `CharacterPanel.tsx`, `playGames.config.ts` |
| G10 index | Y-05 | `index.html` |
| G11 model yükleme | Y-12 | `src/components/three/*` (`useGLTF`) |

Çakışmalar: G4 ↔ G9 (`HUD.tsx` yalnız G4'te; G9 HUD'a dokunmasın) · G6 ↔ G5 (`store.ts` init onarımı Y-23 G5'e verilirse G6 sonra) ·
G7 `rules.ts` ↔ G9 emoji (`rules.ts:535-546`) → aynı ajana.

## §Karar

*(boş — kullanıcı seçer)*
