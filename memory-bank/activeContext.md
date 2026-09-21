# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-21 — **T6: İZDİHAM / SÜRÜKLENME (G-91)** · T5b BİTTİ)

```
SORU            : Kapı önünde NPC birikiyor ve kare 2 dk'da +%31 sürükleniyor. Kök ne,
                  ve doğru doğma politikası hangisi?
ÖLÇÜLECEK KOLLAR: S0 taban (bugünkü hâl, sürüklenme eğrisi)
                  S1 tavan TÜM nüfusa (leaving/WC dâhil) — kapsam düzeltmesi
                  S2 çıkış hattı tavanı ayrı (leaving için kendi kotası)
                  S3 kapı kapasitesi (aynı anda geçen NPC sınırı / geçiş şeridi)
                  S4 uzaktaki leaving NPC'yi erken sil (görüş dışı despawn)
                  ÖLÇÜT: 10 dk'da nüfus düz mü · kare düz mü · GELİR DEĞİŞMEMELİ (korunum)
SAYILAR         : (adım 2'den sonra dolar — docs/izdiham-raporu-t6.md §Bulgular)
KARAR           : (boş)
UYGULAMA        : (boş)
BEKÇİ           : (boş)
```

**VARYANT KAPISI AÇIK:** kollar `tick.ts` + `economy.config.ts`e dokunuyor → sayı satırı
olmadan hiçbiri uygulanmaz. **Korunum şartı:** hiçbir kol ₺/dk'yı düşürmemeli — izdihamı
çözmek gelir kısmakla karıştırılmaz.

**Piyasa standardı ARAŞTIRILDI** (`docs/geribildirim-oyun-testi-2026-09-21.md` §G):
Restaurant Tycoon 2/3 müşteriyi **oranla değil kapasiteyle** doğuruyor ("uygun masa yoksa hiç
doğma"). Kuramı Little yasası (`N = λ×W`). Kodumuz bunu ZATEN yapıyor — kusur kapsamda:
`activeCount` `leaving`/WC durumlarını saymıyor, yani ekrandaki toplam nüfusun tavanı yok.

## T5b — BİTTİ (2026-09-21, commit 8bde1ac)
§6.4'ün açık ucu kapandı. İki TAM koşu, denetim kolu TEMİZ, gölge SABİT, 20/20 damga.
- tarayıcıda oran ×1,09/×1,13 (node ×2,52 değil) · aynı korpus node'da ×2,82/×2,46 →
  **korpus temsilî, fark ORTAMDA** (node blok ölçer, GC dâhil; tarayıcı çağrı-içi ölçer)
- **T5'in kaçırdığı asıl kazanç:** ayırma 178,6 → 33,5 MB/sn (×5,34), çağrı başı −130,6 KB
- **kare kazancı KANITLANDI ama küçük: %5,9-7,1** (üç koşudan biri ters, raporda duruyor)
- eşitlik 16.687 gerçek tarayıcı çağrısında 0 sapma · oracle üretim paketinde YOK
- **nav hâlâ karenin ~%30'u** → N2 (yol önbelleği) sıraya girdi, elenmedi
Rapor: `docs/nav-raporu-t5.md` §7.

## SIRADAKİ TURLAR (kullanıcı onaylı sıra)
1. **T6 — izdiham/sürüklenme (G-91)** ← ŞU AN
2. **T7 — G-82 pad çakışması + G-83/G-84 banket kademeli büyüme** (tasarım kanadı GÖSTERİLEREK)
3. **T8 — G-85 tost/çay mimarisi + G-90 tost asset'i + G-86 zincir denetimi + T3 denge (K1-K11)**
4. **T9 — G-88 genel tarama** (kod + oynanış, ağırlık performans) + N2 + lint 66
5. **Faz F — F3 reklam · F4 IAP · F5 mağaza + G-89 store görseli/videosu (EN SON)**

## AÇIK KALEMLER
- **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`. G-82 ÖLÇÜLDÜ (1,773 br < 2,30).
  G-89 **yayından hemen önce**, kullanıcı notu.
- **T3 denge turu** (K1-K11) T8'e bağlandı.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi (`docs/reklam-raporu-f3.md`).
- **`npm run lint` 66 hatayla kırmızı** — hepsi `tools/` altında, T9'a bağlandı.
- **Sıra kilidi uyarısı DÖRDÜNCÜ kez çıktı** (D-133/134/138/139): araç `tick.ts`i denge dosyası
  sayıyor. Aracın ayırt etme yeteneğini düzeltmek kullanıcının kararı.
- **T4 §B sürüklenmeyi DÜZ ölçmüştü (%0,5)** ama T5b aynı dünyada +%31 gördü — T4'ün sürüklenme
  ölçümünün neyi kaçırdığı T6'da anlaşılmalı (araç güveni sorusu).

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
