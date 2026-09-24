# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-24 — F4c-2 adım 2 ÖLÇ bitti · karar paketi bekliyor)

```
SORU            : F4c-2 — 💎 dekor bugünkü düzene nereye sığar (düzen değişmez, duvara gömülmez) + tabela
ÖLÇÜLECEK KOLLAR: 10 yuva (sol arka D1 D7a D7b D10 · sağ arka D3 D6 D5 · lavabo duvarı D2 · yılbaşı A/B)
SAYILAR         : docs/dekor-raporu-f4c2.md §Bulgular · harita https://claude.ai/artifact/YbqrWF1n4H9F96QMsMr1tv
KARAR           : (boş — paket: yuvalar onay? · yılbaşı A mı B mi · 3. Salon öncesi vitrinde dekor kilitli mi)
UYGULAMA        : —
BEKÇİ           : — (plan: gövde ∩ duvar profili = 0 · trafik yok · nokta > 1,0)
```

## ⏭️ SIRADAKİ ADIM

**Karar paketi (kullanıcı):** harita sayfası + 3 soru → sonra UYGULA: yuvalar `config/decor.ts`e veri olarak,
modeller, vitrin sekmesi, bekçi, en az 2 mutasyon. Yılbaşı paketi diske geri alındı ama COMMIT'LENMEDİ
(`asset-olu-yuk.test` src referansı ister) — commit #2'de koda bağlanınca girer.
- **Ek bulgu B5:** bugünkü konsol/TV ünitesi de çıtaya 0,04 gömülü (`WALL_BACK` gövde yüzünde) — aynı turda düzeltilebilir.
- Tabela: cephe görünürlük ölçümü hâlâ yapılmadı (C2 C4 C7 C8) — F4c-2'nin ikinci yarısı.
- **Sonraki oturumda sor:** 💎 fiyatları (TASLAK) ayrı fiyat oturumunda. Yelek-tepsi görünürlüğü oynarken.
Sonra **F5** mağaza + G-89 (EN SON).

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
