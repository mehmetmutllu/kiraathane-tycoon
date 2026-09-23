# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-23 — T8b KAPANDI · D-143; sıradaki T9)

```
T8b SONUÇ       : sol duvar payı 0,30 → 0,75 · çaycı + bulaşıkçı tezgâhın ARKASINDA · arka şerit oyuncuya
                  kapalı (`oyuncuKatilari`) · leğen birikir, 10 sn'de TOPTAN yıkanır (`cups.washBatchSec`) ·
                  Türk tost makinesi (L5 tekli, L6 geniş plaka) · L1 tepsisindeki iki beyaz bardak kalktı
BEDEL           : geç oyun servis 9,0 → 8,7 (−%3, yayılım bandında); K10'un servis bedeli yok
KARELER         : docs/gorsel/ss/t8b-final.png · t8b-k10-yanyana.png · t8b-tost-aday.png
```

## ⏭️ SIRADAKİ ADIM

1. **Açılışta kullanıcıya SOR (T8b'den kalan):** tost yeri **A (aynı tezgâh, D→E makine — şu an oyunda)** mı,
   **F (yan tezgâhta ayrı tost modülü)** mı? Kullanıcı *"bilemedim, ya d->e ya da f"* dedi; önce oyunda
   görsün. F seçilirse iki dönemde yer ölçüsü ister (arka bantta garson postaları batı cebinde) → küçük tur.
2. Sonra **T9 — G-88 genel tarama** (aşağıdaki sıra).

## AÇIK KALEMLER
- **g1 kolu (garson merdiveni ucuzlatma) D-142 sonrası ölçütü iyileştiriyor** — elenme gerekçesi düştü;
  açılacaksa varyant kapısından (tempo-olcutu bekçisi kayda geçirdi).
- **Seviye ekranının "İzle, 2× al"ı** pasif — F3 (reklam) kararına bağlı.
- **C kolu ölçülmedi:** "tavan + çıkış payı" (T6). **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi (`docs/reklam-raporu-f3.md`). YouTube Playables
  mağaza yayınından SONRA (adaptör; dış URL yasak: Draco gstatic + troika jsdelivr kapatılmalı).
- **`npm run lint` 66 hatayla kırmızı** — `tools/` altında, T9.
- **Sıra kilidi yanlış pozitifleri** (D-133/134/138/139/T6) — aracı düzeltmek kullanıcının kararı.

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. ~~T8a — zincir + T3 denge~~ ✅ D-142 · ~~T8b — tezgâh arkası~~ ✅ D-143 (F sorusu açık)
4. **T9 — G-88 genel tarama** ← buradan başla (kod + oynanış, ağırlık performans) + N2 yol önbelleği + lint 66 + tick ~5 ms (T6b Bulgu C)
5. **Faz F — F3 reklam · F4 IAP · F5 mağaza + G-89 store görseli/videosu (EN SON)**

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
