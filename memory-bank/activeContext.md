# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **C5 turu AÇIK** · Faz C 4/5 · 62/76)

```
SORU            : simulate.ts'in modeli gerçeğe ne kadar uzak — ve gerçeğe yaklaştırılınca
                  üç tempo ölçütünün HÜKMÜ değişiyor mu? (Değişiyorsa denge kararı doğar.)
ÖLÇÜLECEK KOLLAR: dört model kusuru, HER BİRİ AYRI VARYANT (kod kalıcı yazılmadan):
                  K1 taşıma realizasyonu — model ideal taşıyıcı sayıyor (G4'te gerçekleşen %58,4)
                  K2 masa yükseltmesi kalem kalem — sim 20 masayı TEK kalemde alıyor (sahte 21,4 dk)
                  K3 bardak tavanı — D-083 sonrası yıkama debisi dördüncü tavan olarak modele girer
                  K4 müşteri sabrı — terk modelde HİÇ yok, talep kolu abartılı
                  + K5 = hepsi birden (kollar birbirini gizleyebilir; tek tek + toplu ölçülür)
SAYILAR         : (adım 2 — docs/sim-gercek-raporu-c5.md §Bulgular)
KARAR           : (adım 3 — kullanıcı seçer)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (adım 4)
```

**Kalibrasyon gerçek koddan gelir, tahminden değil:** `olcum-kuyruk.ts` zaten senaryo başına
*"simulate.ts modelinin beklediği X · gerçekleşen %Y"* basıyor; `olcum-bardak.ts` yıkama debisini
basıyor. İkisi de **D-083 ÖNCESİNDEN kalma** — tam koşuyla tazelenecek (açık kalemdi, bu tur kapanır).

**Bu tur aynı zamanda İA FAZ KAPISI:** başlangıç damgası `2026-09-08T17:56Z`; süre
`docs/oturum-akisi-mantik.md` §4 tahminiyle (168 → ~95 dk) karşılaştırılacak, sapma > %15 ise
hızlandırma mantığı düzeltilir.

**Varyant kapısı DEVREDE** (kollardan biri seçilirse `economy.config.ts` ihtimali var):
iki commit sırası zorunlu, kapanışta `npm run sira` denetler.

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
