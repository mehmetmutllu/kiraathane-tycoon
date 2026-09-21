# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-21 — **T5b: nav kare kazancı TARAYICIDA A/B**)

```
SORU            : T5'in node'da ölçülen ×2,52'si KAREYE yansıyor mu? (T5'in açık ucu)
ÖLÇÜLECEK KOLLAR: A = üretim nav (T5 sonrası)  ·  B = oracle nav (T5 öncesi, donmuş)
                  AYNI sayfada, AYNI dünyada, gölge SABİT, A/B/A/B/A/B dönüşümlü.
                  Karşılaştırma ORAN üstünden (§G dersi) — mutlak ms değil.
                  DENETİM KOLU: çizim ms + üçgen + çağrı — bunlar iki kolda da AYNI kalmalı;
                  oynarsa koşu geçersizdir (makine sürüklenmesi kolun içine sızmış demektir).
SAYILAR         : (adım 2'den sonra dolar — docs/nav-raporu-t5.md §7)
KARAR           : (boş)
UYGULAMA        : (boş)
BEKÇİ           : (boş)
```

**Bu tur bir İDDİAYI sınıyor, kod hızlandırmıyor.** İki sonuç da kabul edilebilir:
doğrularsa T5 kapanır · çürütürse kod yine doğru ve çıktı-eşdeğer kalır (node'da 12.000 çağrıda
0 fark, 7/7 mutasyon), yalnız **"hızlandırdı" cümlesi geri alınır** ve kol N2'ye devredilir.

## SIRADAKİ OTURUMUN İŞİ
1. **T6 — G-82 pad çakışması + G-83/G-84 banket kademeli büyüme** (tasarım kanadı GÖSTERİLEREK
   sorulur, metinle değil).
2. **T7 — G-85 tost/çay mimarisi + G-90 tost asset'i + G-86 zincir denetimi + T3 denge (K1-K11).**
3. **T8 — G-88 genel tarama** (kod + oynanış, ağırlık performans) + N2 yol önbelleği + lint 66.
4. **Faz F — F3 reklam kararı · F4 IAP · F5 mağaza vitrini + G-89 store görseli/videosu (EN SON).**

## AÇIK KALEMLER
- **G-82…G-90** (2026-09-21 geri bildirimi): `docs/geribildirim-oyun-testi-2026-09-21.md`.
  G-82 ÖLÇÜLDÜ (1,773 br < 2,30 eşik). G-89 **yayından hemen önce**, kullanıcı notu.
- **T3 denge turu** (varyant kapısı, iki commit): K1 tepsi 75₺ · K2 garson tepsi tabanı ·
  K3 1. salonda 2. garson · K4 masa4 380₺ · K5 2. salonu geciktir · **K6 masa sırası
  (D-124 yeniden okunacak)** · K7/K8 seviye eğrisi+ödülü (**D-092 yeniden okunacak**) ·
  K9 bulaşık istifi · K10 tezgâhın duvar payı (+G-71 takılma) · K11 yükseltme noktası kapısı.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi, onay gelmedi (`docs/reklam-raporu-f3.md`).
- **`npm run lint` 66 hatayla kırmızı** — hepsi `tools/` altında, T8'e bağlandı.
- **Sıra kilidi uyarısı DÖRDÜNCÜ kez çıktı** (D-133 · D-134 · D-138 · D-139): araç `tick.ts`i
  denge dosyası sayıyor. Aracın ayırt etme yeteneğini düzeltmek kullanıcının kararı.

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
