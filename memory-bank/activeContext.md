# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-25 — F4c-3 ✅ KAPANDI · F4c-4 açıldı: dekor yerinde önizleme + satın alma metinleri)

```
SORU            : F4c-4 — (1) dekor mağazada salondaki YERİNDE, uzak/oyun açısından nasıl gösterilir?
                  (2) satın alma metinleri + teklif kartı neden "boğuk", nasıl netleşir? (kullanıcı 2026-09-25, kare 21/23)
ÖLÇÜLECEK KOLLAR: dekor: A yarım sayfa + canlı oyun odağı · B "Salonda gör" tam ekran · C kutu içinde oda köşesi
                  metin/teklif: aday kartlar GÖSTERİLEREK (feedback_show_dont_ask) · microcopy envanteri
SAYILAR         : —
KARAR           : — (karar paketi kullanıcıya)
UYGULAMA        : —
BEKÇİ           : —
```

## ⏭️ SIRADAKİ ADIM

**F4c-4 aday kareleri:** dekor A/B/C gerçek oyun karesinden (kamera `camFocus` ile yuvaya) + teklif kartı 3-4 aday +
satın alma metinleri envanteri (eski → yeni) → tek karar paketi. Kod YOK (seçilen kola). Mağaza turu kareleri:
`tools/shot-magaza-son.mjs` · https://claude.ai/artifact/WSH385msDgxYkCZUMbwbMj. Sonra **F5** mağaza + G-89 (EN SON).
- **Hata (düzeltilecek):** Paketler sekmesinin alt notu kesiliyor (kare 13). Kilitli dekor düğmesi yeşil kalıyor (kare 11).
- **Sonraki oturumda sor:** 💎 fiyatları (kıyafet/tepsi/dekor hepsi TASLAK) ayrı fiyat oturumunda.
- **Görsel açık:** yelek tepsinin arkasında · "Kaldır" satın al yeşilinde (nötr mü?) — kullanıcı "şu an okey" dedi (2026-09-25).
- Kare araçları taze oyunda ad kutusuna takılır: `__setState({ kafeAdi: '…' })` ile geçilir.
- F4c-3 final sırası: ölçüm (kollar.json yazar) → kadraj → ölçüm; ters sıra izdüşüm damgasını kırar.

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
