# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **D3 ölçüm turu** · Faz D 2/5 · 65/76)

```
SORU            : Hedeflerin (koleksiyon) ödülü ₺ içermeli mi, hangi dozda? Meta katmanın ₺ akışı
                  geç-oyunun bekleme pencerelerini DOLDURUYOR mu, yoksa zinciri mi kısaltıyor?
ÖLÇÜLECEK KOLLAR: hA kazanç eşikleri (lifetime) · hB mekân eşikleri (pad) · hC ikisi birlikte
                  · h0 ödül YALNIZ 💎 (₺=0, atıl beklenir — damga tabanın kopyasını doğrular)
                  Her kol tek skaler DOZ ile taranır (ödül = eşiğin/pad maliyetinin %p'si).
SAYILAR         : (adım 2 sonrası — docs/hedef-raporu-d3.md §Bulgular)
KARAR           : (adım 3 — kullanıcı seçer)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (adım 4)
```

**Neden bu tur ölçümlü:** hedef ödülü ₺ verirse `economy.config.ts`'e giren sayı bir DENGE
sayısıdır → varyant kapısı devrede. D1'in açık bıraktığı soru da tam buydu: *"Faz D bitince
yeniden okunacak — meta katman geç-oyun bekleme pencerelerini gerçekten dolduruyor mu."* Bu tur o
sorunun ilk yarısını ölçüyor.

**Zeminde bulunan (E1'den):** `GoalsSheet` ve `RewardModal` bileşen olarak VAR; ama hedef eşikleri
HUD'a gömülü (500 · 200 · 1.000.000 — CLAUDE.md "sayı koda gömme" ihlali), kademe yok, ödül yok,
toplama yok. Elmasın bugün hiçbir kaynağı ve harcaması yok. D3 bu üçünü kapatır.

## SIRADAKİ TAM ADIM

Adım 2 ÖLÇ: `tools/hedef-kollari.ts` + `tools/olcum-hedefler.ts` → kısa koşu doğrulaması → tam
koşu → `docs/hedef-raporu-d3.md` (KARAR BÖLÜMÜ BOŞ) → **commit #1** → karar paketi.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **Normal profil 43,4 dk beklemesi** — D-087'de bilerek ödenmedi, gözlem bandında görünür.
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; oysa ÜÇ KOL
  tablosu 20 masada `waiterTray: 3` varsayıyor — tempo kalemi DEĞİL, görev/HUD tutarlılığı.
- **`outputMultByLevel` yok** — servis çıktı çarpanı merdiven-geneli; `b1` erken oyuna
  dokunmadan denenemiyor.
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5) — model kalemi, bugün zarar vermiyor.
- **Nav ızgarası ↔ oyuncu çarpışması** — Faz D (D2'den sonraki aday).
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün iki oturum kapanınca
  sessiz kalıyor. C5 ve D1'in anlatısı bu yüzden iki tur yayınlanmadı (2026-09-08'de düzeltildi,
  araç değişmedi). Kural "sayaç arttıysa kart sayısı da artmalı" olmalı.
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,17 MB (Faz F kod-bölme).
- C4'ten kalan ölçüm kusuru: B1 · oyuncu kipinde bot hiç yürümüyor (karar etkilenmedi).

**Bekleyen denge kararı YOK.**

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
