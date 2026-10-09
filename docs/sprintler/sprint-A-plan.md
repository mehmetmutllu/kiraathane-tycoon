# Sprint A planı — mağaza güvenliği · kayıp önleme · performans Paket 1

> Durum: **ONAY BEKLİYOR (2026-10-09).** Kaynak: `docs/tarama-raporu-2026-10-09.md` §2 (P1) · §3 (P2+P3) · §5 Paket 1 · D-162.
> Düzen (hafıza `feedback_sprint_yontemi`): Claude orkestratör → ortak sözleşmeyi yazar → 4 paralel Opus ajanı
> (commit yok, rapor ≤ 25 satır, ara not `docs/sprintler/sprint-A/<ajan>-notu.md`) → Claude birleştirir, test + ≥ 2 mutasyon,
> faz commit'i → `sprint-A-defter.md`. Fazlar arası "devam edeyim mi" sorulmaz.
> Ön karar: **Başlangıç Paketi geri yüklemesi kıyafet + 100 💎 verir (kol A, 2026-10-09)**; bir kayıtta en fazla bir kez.

## Neden bu kapsam
Oyun mağazaya çıkmak üzere; para ödeyen ya da saatlerce oynayan oyuncunun bir şey kaybetmesi en pahalı hata.
Sprint A, görüntüyü değiştirmeyen ama "param/ilerlemem gitti", "reklam takıldı", "telefon ısındı" şikâyetlerini kapatan iş.
Denge sayısına dokunmaz (P4 saat hilesi varyant kapısıyla sonraya). Görsel/UI dili Sprint B-C'de.

## Ortak sözleşme (ajanlardan ÖNCE Claude yazar; ajanlar değiştirmez, ihtiyacı rapora yazar)
- `npm i @capacitor/preferences@8.0.1` (package.json/lock Claude'da).
- `src/game/kalicilik.ts` **arayüzü**: `kalicilikHazirla(): Promise<void>` · `kaliciOku(anahtar)` / `kaliciYaz(anahtar, deger)` (senkron okuma, önbellekten) · `rcKimlik(): string`.
- `src/game/satinAlimTipleri.ts`: `SatinAlSonuc = 'tamam'|'vazgecti'|'bekliyor'|'zatenSahip'|'hata'` · `MagazaDurumu = 'hazir'|'yukleniyor'|'yok'` ·
  `OdulluSonuc = 'odul'|'yarida'|'gosterilemedi'` · `SatinAlim` ek alanları `uzlasmaBasi`, `baslangicElmas`, `hakKimlik` (tip; store'a Claude işler).
- `BulutArkaUcu` arayüzü (`yaz/oku/varMi`) — iOS KVS ve Play Games aynı kalıba oturur.

## Ajanlar (paralel; dosya sahipliği ayrı)

| Ajan | İş (rapor maddesi) | SENİN dosyaların | DOKUNMA | Kabul ölçütü |
|---|---|---|---|---|
| **① Mağaza** | P1 #1 `magazaYenile` tek uçuş + geri çekilme 2→4→8→16→30 sn ×5 · P1 #3 fiyat ≠ meşgul (`satinAlmaMesgul`) · P1 #6 sonuç birleşimi (RC kodları 1/20/6/10) + `useSatinAl()` · P2 `rcKimlik` ile `configure({appUserID})`/`logIn` · `magazaUzlas(info)` saf fonksiyonu (tarih sıralı, `uzlasmaBasi`, `islenen` sınırı 50) · sahte `${urun}:${Date.now()}` kimliği kalkar · reklamsız asimetrik eşitleme kuralı (saf) · Android sessiz `syncPurchases` | `src/game/iap.ts` · `src/config/iap.config.ts` · yeni `src/game/satinAlimUzlas.ts` · yeni `src/components/ui/useSatinAl.ts` · ilgili `tests/iap*.test.ts` | store.ts, HUD.tsx, App.tsx, save.ts | sahte RC ile: kur() düşer → 5 denemede kalkar; satın alma sırasında fiyat görünür; iptal/bekleyen/zaten sahip ayrı sonuç; aynı işlem iki kez gelirse 💎 bir kez; uzlasmaBasi öncesi işlem yok sayılır; reklamsız true→false yalnız aynı kimlikte |
| **② Reklam + kabuk** | P1 #2 rıza → (form) → iOS görünürlük ≤ 3 sn + ATT ayrı try → `canRequestAds` ise `initialize` · P1 #5 geri çekilmeli yeniden yükleme 15→300 sn, `reklamYenidenKur()`, `kapanisiBekle` zaman aşımı (Showed yoksa 10 sn, üst 180 sn, finally) · `reklamAcik=false` her yolda · perf #5 arka planda `ctx.suspend()` + müzik/zamanlayıcı durur, reklam sırasında müzik yok · ErrorBoundary + `webglcontextlost` kurtarma · ödüllü sonucu `OdulluSonuc` | `src/game/ads.ts` · `src/config/ads.config.ts` · `src/App.tsx` · `src/game/audioWeb.ts` · `src/game/musicWeb.ts` · yeni `src/components/ui/HataSiniri.tsx` · `tests/ios-platform.test.ts` + ilgili ads testleri | iap.ts, save.ts, bulut.ts, store.ts, HUD.tsx | rıza hata atınca ATT yine sorulur; rıza yokken SDK başlamaz; takılan reklam 180 sn'de çözülür ve arka plana geçişte kayıt yine yazılır; yükleme hatası sonrası yeniden dener; gizlenince AudioContext suspended |
| **③ Kayıt + bulut** | P3 kalıcılık: Preferences ana depo + localStorage hızlı kopya; `main.tsx` render öncesi `await kalicilikHazirla()` · zarf `{v,n,sum,data}` + `yedek.0..2` (≈5 dk) + `bozuk` karantina, sessiz sıfırlama YOK · `kayitDogrula` (NaN cüzdan → yedek) `kayitCoz` içinde · `BulutArkaUcu` + seçim kuralı `sifirlamaNo > lifetime > xp > lastSaved` · iOS iCloud KVS yerel eklenti (`eklentiler/bulut-kayit/`, Swift + Package.swift) + `App.entitlements` + pbxproj + codemagic grep'i · Android `dataExtractionRules` + `fullBackupContent` · `PrivacyInfo.xcprivacy` | `src/game/save.ts` · `src/game/bulut.ts` · `src/game/kalicilik.ts` (gövde) · `src/main.tsx` · `eklentiler/bulut-kayit/**` · `ios/App/App/App.entitlements` · `ios/App/App.xcodeproj/project.pbxproj` · `ios/App/App/PrivacyInfo.xcprivacy` · `codemagic.yaml` · `android/app/src/main/AndroidManifest.xml` · `android/app/src/main/res/xml/yedek-*.xml` · `tests/save*.test.ts`, `tests/bulut*.test.ts` | store.ts, iap.ts, ads.ts, App.tsx | eski (v-öncesi) kayıt kayıpsız açılır; bozuk sağlamada yedekten döner, ham veri karantinada durur; NaN cüzdan yüklenmez; KVS sahte arka uçla daha ileri kayıt kazanır; `npm run build` + `npx cap sync` temiz |
| **④ Performans P1** | #2a/b opak panel açıkken sahne çizimi atlanır (tick sürer) + durağan önizlemeler `frameloop="demand"` · #1 müşteri kırpma açık (küre ×1,5) + görünmeyende animasyon atlama · #3a `PERF_SURUM` · #9 `Merged frames={3}` · `shadows="percentage"` · #8 joystick ref+rAF · #11 müşteri geometrisi paylaşımı · `fmt` Intl önbelleği · üretimde `kiraathane-olcum` ile `__perf` | `src/components/three/**` · `src/components/ui/Sheet.tsx` · `Joystick.tsx` · `DioramaPreview.tsx` · `TableThemePreview.tsx` · `DekorOnizleme.tsx` · `src/game/cihazSinifi.ts` · `src/game/perf.ts` · `src/game/decimal.ts` (yalnız önbellek) · duman `__kareSayaci` denetimi | store.ts, tick.ts, HUD.tsx, App.tsx, audio/music | görüntü birebir (önce/sonra aynı kadraj ekran görüntüsü); duman yeşil; telefon öykünmesinde kare işi önce/sonra sayıyla raporda; panel açıkken kare sayacı durur, kapanınca sürer |

**Claude'da kalan (orkestratör):** `store.ts` · `tick.ts` · `HUD.tsx` · `CharacterPanel.tsx` · `i18n/*` · `yasal.config.ts` · package.json.
- Mağaza/reklam bağlama: `SatinAlim` alanları + kayıt migrasyonu (`saveVersion` ↑) · `magazaUzlas` store'a · HUD'da "Tekrar dene" gerçek yol, uyarı yalnız `yok` + hiç fiyat yokken · "Geri Yükle" Paketler altına da · düğmede "Bekleniyor…".
- P3 görev hattı: `questsDone` tek kaynak, `questIndex` ondan türetilir (ikinci ödeme biter) · `tick.ts` `teasServedByArea` klonu · gece yarısı günlük reklam ödülü (`DailyState.onceki`). Üçü de NÖTR — denge sayısı değişmez; bekçi testleri yazılır.
- Küçükler: EN "Buy" → ödülde ayrı anahtar · `CharacterPanel` 'bardak'/'alan' t()'ye · gizlilik linki dile göre `#tr/#en` · görev bandı "0/1" · yeni metinler TR+EN `_taslak` işaretli (ChatGPT mikrometin turu Sprint B'de).
- HUD #7 (dolumda her kare render) Claude'da, ④'ün `fmt` önbelleği gelince.

## Sıra ve birleştirme
1. Claude sözleşmeyi + bağımlılığı yazar, kısa duman → ajanlar paralel başlar.
2. Her biten ajan: tip kontrolü + kendi testleri + ≥ 2 mutasyon (Claude) → faz commit'i.
3. Claude bağlama işini yapar (store/HUD/tick) → `npm run test` + `npm run duman` (+ EN) + `npm run build`.
4. `npm run play:paket` → zip arkadaşa (Android 1.0.1). iOS parçaları dalda hazır **bekler**: inceleme bitip onay gelince
   Apple portalında App ID → iCloud kutusu açılır, profil yeniden üretilir, 1.0.1 gönderilir. (İnceleme sürerken iOS'a build GİTMEZ.)
5. `sprint-A-defter.md` (eski → yeni, görünmeyen davranış, senin dilinde "nasıl kontrol edersin") + progress/tur kartı.

## Sprint sonu kabul (senin göreceğin)
- İnterneti kapatıp Paketler'i aç → "Tekrar dene" çalışır, internet gelince fiyatlar kendiliğinden döner.
- Satın almayı iptal et → "vazgeçtin" mesajı; tekrar dene → normal.
- Android'de oyunu sil-kur (yedek açık) → ilerleme geri gelir.
- Reklam izlerken müzik susar; uygulamayı arka plana al → ses/pil tüketimi durur.
- Panel açıkken telefon daha az ısınır (sayı defterde).

## Sprint A'nın DIŞINDA
- P4 saat hilesi (denge kapılı, ayrı tur) · perf Paket 2/3 · UI tasarım dili (Sprint B/C) · ChatGPT mikrometin turu.
- Android Block Store (Auto Backup yeterli; gerekirse sonra) · Play Games APP_ID (arkadaştan gelince tek satır).
- Daha önce reddedilenler tekrar önerilmez: gölge harita boyutu, gölgeyi kapatma, blob, kod bölme, müşteri tavanı, A*.

## Riskler
- `logIn` takma adı: mevcut iOS satın alımı yok (inceleme sürüyor) → geçiş riski düşük; Android kapalı test kullanıcıları `syncPurchases` ile eşleşir.
- `kalicilikHazirla` açılışı ~ms geciktirir → yükleme ekranı zaten var; duman açılış süresine bakılır.
- iCloud KVS eklentisi web'de denenemez → sahte arka uç testi + Codemagic derlemesinde entitlement grep'i; gerçek cihaz turu 1.0.1'de.
- Dış kontrol (arkadaş): RevenueCat'te Android `kiraathane_baslangic` + `kiraathane_reklamsiz` **Non-consumable** olmalı.

## Toplu sorular
Yok — tüm kollar raporda tasarlandı, denge değişikliği yok. Çıkan soru defterin sonuna yazılır.
