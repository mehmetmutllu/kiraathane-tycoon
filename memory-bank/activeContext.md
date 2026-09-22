# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-23 — **T6 KAPANDI**, sıradaki tur T7)

```
SORU            : Kapı önünde NPC birikiyor ve kare sürükleniyor. Kök ne, doğru politika hangisi?
SAYILAR         : docs/izdiham-raporu-t6.md §Bulgular + §Karar (final tam koşu)
KARAR           : D-140 — S1 (`leaving` ayrışmasız). Final taban S1 satırını tohum tohum birebir verdi.
UYGULAMA        : ✅ tick.ts AYRISMASIZ'a 'leaving'. Ölçüm kolu S2/S3/S4 alanlarıyla duruyor (C kolu için).
BEKÇİ           : ✅ tests/izdiham-t6.test.ts (5) · mutasyon 5/5 (tools/mutasyon-izdiham-t6.mjs)
```

## ⏭️ SIRADAKİ OTURUM BURADAN BAŞLAR

1. **Tarayıcıda 10 dk kare kayma ölçümü (T6'nın performans yansıması)** — kullanıcı "son testimden
   beri performans ne kadar gelişti" diye sordu; node sayısı var (NPC 494 → 59, ayrışma çifti
   ~27.700 → ~1.700), **tarayıcı ms'si yok**. T5b aracıyla (masaüstü + telefon profili) T6 öncesi
   (`583f75a`) ↔ sonrası aynı dünyada. Not: araçların `dunyaKur`u hâlâ `stationLevels` yazmıyor —
   önce onu düzelt (aşağıda).
2. Sonra **T7** (tur kartını aç, D-084 sırası).

## AÇIK KALEMLER
- **C kolu ölçülmedi:** "tavan + çıkış payı". Yeni taban S1; S1+S4 servisi −%2,1 kısıyor (rapor §Karar).
- **KORUNUM çözünürlük sınırında** (rapor Bulgu 6) — S1 artık taban, soru kapandı sayılabilir.
- **Bardak havuzu masa sayısıyla ölçeklenmiyor** (20 masaya 42) → **T8**.
- **`olcum-nav-t5.ts` + tarayıcı `dunyaKur` `stationLevels` yazmıyor** → "20 masaya seviye-0 ocak".
- **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`. G-89 yayından hemen önce.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi (`docs/reklam-raporu-f3.md`). Reklam/kayıt
  katmanını adaptörle kur: **YouTube Playables** mağaza yayınından SONRA denenecek (kullanıcı
  2026-09-23; davetle giriş, AdMob/IAP orada yasak → `ytgame.ads`/`saveData`; dış URL yasak:
  drei Draco gstatic + troika font yedeği jsdelivr kapatılmalı).
- **`npm run lint` 66 hatayla kırmızı** — `tools/` altında, T9.
- **Sıra kilidi yanlış pozitifleri** (D-133/134/138/139/T6) — aracı düzeltmek kullanıcının kararı.
- **`progress.md` 86 KB** — başlangıç bütçesi ≤ 15 KB; tarihçe paragrafı + bitmiş faz anlatısı
  `arsiv/`e taşınmalı (pano aracının denetlediği tablo/başlıklar korunarak). Kullanıcıya sor.

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · tarayıcı kayma ölçümü ← buradan başla
2. **T7 — G-82 pad çakışması + G-83/G-84 banket kademeli büyüme** (tasarım kanadı GÖSTERİLEREK)
3. **T8 — G-85 tost/çay mimarisi + G-90 tost asset'i + G-86 zincir denetimi + T3 denge + bardak havuzu**
4. **T9 — G-88 genel tarama** (kod + oynanış, ağırlık performans) + N2 yol önbelleği + lint 66
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
