# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **D1 denge turu**: geç-oyun eğrisi · 63/76)

```
SORU            : Geç-oyun eğrisi 20 dk ölçütünü Normal profilde 6 kez aşıyor (D-086 Bulgu 7).
                  Ölçüt mü bayat, eğri mi pahalı — ve düzeltilecekse HANGİ kaldıraçtan?
ÖLÇÜLECEK KOLLAR: taban · f1 servis L5-L6 ucuzlat · f2 aşan dört pad ucuzlat · f3 (f1+f2)
                  · g1 taşıma tavanını aç (garson tepsi/hız kademesi) · g2 ₺/müşteri (masa tipBase)
                  · o1 ölçütün PROFİLİ pinlensin (kod yok, hüküm değişir)
                  Her kolun parametresi TAHMİN değil ÇÖZÜLÜR: "ihlali 6 → hedefe indiren en
                  küçük değişiklik nedir" — takas kolonu ŞERİT süresi + açılış ölçütleri +
                  model↔gerçek sapmasıyla birlikte okunur.
SAYILAR         : (adım 2'den sonra dolar — docs/gec-oyun-raporu-d1.md §Bulgular)
KARAR           : (adım 3, kullanıcı seçer — D-0xx)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Turun zemini (ölçülmüş, D-086 sonrası yürürlükteki model):** ihlallerin tamamı `taşıma`
darboğazının içinde — 8 masadan sonra bağlayıcı kol hiç değişmiyor (taşıma 0,32→0,52 bardak/sn,
talep 1,90→7,69). Gelir throughput'tan değil ₺/müşteriden büyüyor; bu, `feedback_economy_throughput`
sınırının ("Kat 1'de bu kol tükendi") sayıyla görünen hâli.

**Kolları okurken üstünde durulacak iki mevcut kural:** `feedback_economy_pacing_offline` —
*garson sonrası ölçülü pahalı* (f-kolları buna karşı basınç yapar) · `feedback_economy_throughput` —
*geç oyun ₺/müşteriden büyür* (g2'yi destekler, g1'e karşı).

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
