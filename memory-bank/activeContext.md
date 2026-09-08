# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **Faz C BİTTİ 5/5** · 63/76 · sırada Faz D)

```
SORU            : simulate.ts'in modeli gerçeğe ne kadar uzak — hüküm değişiyor mu?  [KAPANDI]
ÖLÇÜLECEK KOLLAR: k1a · k1b · k2 · k3 · k4 · hepsi · secilen (uygulanan birleşim de ölçüldü)
SAYILAR         : docs/sim-gercek-raporu-c5.md §Bulgular · ham docs/olcum-sim-kollar.txt
KARAR           : D-086 — k1b + k2 ALINDI; k1a (totoloji) · k4 (sıfır etki) · k3 ELENDİ
UYGULAMA        : tools/simulate.ts VARSAYILAN = {k1b, k2}; SIMKOL=eski eski modeli koşturur
BEKÇİ           : tests/sim-model.test.ts — 17 test, ÜÇ mutasyonla doğrulandı
```

Model↔gerçek sapması **%36 → %8** · sahte masa beklemesi **21,4 → 4,5 dk** · **denge sayısı
değişmedi** (`economy.config.ts`'e dokunulmadı). D-079'un açılış hükmü kollardan bağımsız çıktı:
ilk üç ölçüt yedi kolun hepsinde birebir aynı (22 sn · 1,6 dk · 6,1 dk).

k3 ertelenmedi — kullanıcı *"işten kaçma"* dedi, iki kusuru düzeltilip yeniden ölçüldü ve
**ölçüm elemesi** oldu (birleşim %46 → %15, ama k1b tek başına %8).

**İA faz kapısı ölçüldü:** 31 dk (tahmin ~95). Karşılaştırma birebir değil — gerekçe
`progress.md` faz kapısı notunda; asıl sınav tick-temelli bir denge turu.

## SIRADAKİ TAM ADIM

**Faz D — meta katman (0/5).** Faz C kapandı. D'nin ilk kalemi seçilmeli; **`kiraathane-devam`
oturumunda kullanıcıya sorulacak.** Faz D'de bekleyen bilinen iş: **nav ızgarası ↔ oyuncu
çarpışması aynı dünyayı görmüyor** (`actorRadius` sandalyesiz, `playerRadius` sandalyeler katı;
personelin geçtiği boşluktan oyuncu geçemiyor).

**Denge tarafında bekleyen ama Faz D'ye ait OLMAYAN iki kalem** (ikisi de ölçüm turu ister):
① geç-oyun eğrisi 20 dk ölçütünü 6 kez ihlal ediyor (D-086'nın açtığı; `economy.config.ts`) ·
② sim'in taşıma tavanı 4 masada fazla kötümser (elenen k3'ün önündeki tek engel).

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- Yukarıdaki ① ve ② · D-046 ④ kaba hâlde, ⑤ yok · sipariş nesnesi v1.1'de.
- **Nav ızgarası ↔ oyuncu çarpışması** — Faz D.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,17 MB (Faz F kod-bölme).
- **C4'ten kalan ölçüm kusuru:** B1 · oyuncu kipinde bot hiç yürümüyor (0,0 br/dk); C4 kararları
  `park` kipinden alındığı için karar etkilenmiyor. (`iade:0.25` kusuru C4 raporunda düzeltilmişti.)

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
