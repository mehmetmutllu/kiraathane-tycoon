# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-24 — F4c 💎 vitrini: adaylar SEÇİLDİ, uygulama sırada)

```
SORU            : F4c — 💎 kozmetik vitrini: ne satılır + başlangıç paketinin özel kozmetiği
ÖLÇÜLECEK KOLLAR: yok (denge dosyasına dokunmaz; fiyatlar ayrı oturum). Tabela görünürlüğü ölçülecek (C)
SAYILAR         : — · adaylar `tools/vitrin-adaylari.html` · kareler `docs/gorsel/ss/f4c-aday-*.png`
KARAR           : ₺ temalarıyla TEK vitrin · 4 tür · kurucu = K4 bordo yelek+fes · liste aşağıda
UYGULAMA        : F4c-1 (vitrin + kıyafet + tepsi + kurucu + başlangıç tetiği) → F4c-2 (tabela + dekor köşesi)
BEKÇİ           : —
```
Seçilen (kullanıcı + Claude, artifact https://claude.ai/artifact/TYJTkxPJsVD8c3yEu1h4AR):
- **K** kurucu K4 · vitrin K2 K5 K7 K8 K10 (K3 elendi: fes kurucuya özel)
- **T** T3 gümüş askılı (elden ASILI tutuş gerekir) · T4 altın · T2 bakır · T7 emaye
- **C** C2 C4 C7 C8 — önce oyun kamerasında görünürlük ölçümü
- **D** D1 radyo · D2 saat · D3 semaver · D5 kanarya · D6 gramofon · D10 tablo · D7a koltuk · D7b lamba (ayrı)
- **Y** yılbaşı paketi geri (`git checkout 13738b5^ -- public/assets/models/kaykit-holiday-bits`): büyük koltuk
  4 renk (tek ürün, ÖLÇEK KÜÇÜLECEK) + yuvarlak halı. `asset-olu-yuk.test` src'de referans ister.
- Dekor yerleşimi önerisi: salon başına sabit "süs köşesi" (yürüme yolu bozulmaz) — F4c-2'de onaylat.

## ⏭️ SIRADAKİ ADIM

**F4c-1:** vitrin ekranı (₺ temaları + 💎 ürünler tek yerde) · sahip kıyafeti seçimi (KayActor) · tepsi
görünümü (CupTray; askılı tutuş) · K4 yalnız başlangıç paketiyle · başlangıç paketi tetiği (ilk Usta'dan
sonra bir kez) · kayıt: saveVersion + migrasyon. Sonra **F4c-2** · sonra **F5** mağaza + G-89 (EN SON).

## AÇIK KALEMLER
- **Play Games (kullanıcı):** `docs/play-games-kurulum.md` adımları → proje kimliği `strings.xml` + 19 başarım kimliği
  `playGames.config.ts`. Başarım simgeleri (512×512 × 19) istenirse biz hazırlarız. Sonra gerçek cihazda giriş/bulut turu.
- **RevenueCat (kullanıcı):** hesap → Android SDK anahtarı `iap.config.ts` · Play Console'da 5 ürün (`kiraathane_reklamsiz`, `_baslangic`, `_elmas_25/60/150`) + entitlement `reklamsiz`/`baslangic`.
- **Başlangıç paketi tetiği** (ilk Usta'dan sonra bir kez) F4c'de vitrinle birlikte.
- **Cihaz turu (F3):** gerçek dolgu · UMP formu AB'de açılıyor mu · reklam sırasında WebView sesi · R8 altında SDK'nın kendi yansıması.
- **D-151 — reklam SDK'sında kısıt yok** (içerik AdMob panelinden). F5'te Play Console hedef kitle beyanı buna uygun doldurulmalı.
- **Gerçek AdMob kimliği** kullanıcının AdMob hesabından gelecek → `ads.config.ts` + manifest `APPLICATION_ID`, `test: false`.
- **Görev ödülü ₺'si kazanç izinde** (tick içinde, küçük) — seviye/video ödülü onu da sayar (D-150 açık kalemi).
- **C kolu ölçülmedi:** "tavan + çıkış payı" (T6). **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`.
- YouTube Playables mağaza yayınından SONRA (adaptör; dış URL yasak: Draco gstatic + troika jsdelivr kapatılmalı).
- **Çevrimdışı ₺ para dili:** sayma animasyonu yok (juice, F sonrası cila).
- **T2a tipi yanlış pozitif** sıra kilidinde kalıyor: `tick.ts`e ölçümsüz MANTIK değişikliği `olcum-yok` sayılır.

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. ~~T8a — zincir + T3 denge~~ ✅ D-142 · ~~T8b — tezgâh arkası~~ ✅ D-143 (F kapandı: A)
4. ~~T9a — performans + kod~~ ✅ D-145 · ~~T9b — oynanış taraması~~ ✅ D-146 · ~~T9c mantık~~ ✅ D-147 · ~~T9d arayüz~~ ✅ D-148
5. Faz F — ~~F3 reklam~~ ✅ D-149/D-150 · ~~F4a IAP~~ ✅ D-152 · ~~F4b Play Games~~ ✅ D-153 · **F4c 💎 vitrini** ← buradan · F5 mağaza + G-89 (EN SON)

---

**Karar paketleri ve kare arşivi** (birikimli liste, buradan ayrıldı): `memory-bank/karar-paketleri.md`

---

## TUR KARTI ŞABLONU (her yeni tur bunu doldurur, öncekinin üstüne)

```
SORU            : (tek cümle — bu tur neyi çözüyor)
ÖLÇÜLECEK KOLLAR: (varyant olarak ölçülecek seçenekler; kod YAZILMADAN)
SAYILAR         : (adım 2'den sonra dolar — rapor §Bulgular'a link)
KARAR           : (adım 3, kullanıcı seçer — D-0xx)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Sıra (D-084 §3.2) — ihlali commit yapısı engeller, kapanışta `npm run sira` denetler:**
`0 BAŞLA → 1 SORU (kart açılır) → 2 ÖLÇ → commit #1 (araç + ham çıktı + rapor, KARAR BÖLÜMÜ BOŞ)
→ 3 KARAR (tek karar paketi) → 4 UYGULA + bekçi + mutasyon + final tam koşu
→ commit #2 (kod + test + rapor tamam + D-0xx) → 5 KAPAT`

**Varyant kapısı:** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan denge değişikliği,
raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz.

**Kapanış (D-085):** `npm run sira` → `npm run pano` → `npm run test` → commit → push.
Pano denetimi kırmızıysa önce `progress.md` düzeltilir; anlatı elle yazılır.
