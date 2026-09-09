# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-10 — **S5 ÖLÇÜM AÇIK** · Faz S 4/12 · 79/96)

```
SORU            : Elle çizilen dekor parçaları KayKit karşılığına geçebilir mi — ölçüsü,
                  ankrajı, ayak izi ve rengi oyunun bandına oturuyor mu?
ÖLÇÜLECEK KOLLAR: ① ÖLÇEK — tek dekor ölçeği 0,90 (KITCHEN_S/STOOL_S) · parça-başı hedef-boya-çek
                    (fit) · karışık (mobilya 0,90, küçük eşya gerçek boy = KASA_S deseni)
                  ② ADAY — her parça için paketin adayları: copKovasi→`trash_A/B`·`dumpster` ·
                    ayakliLamba→`lamp_standing` · konsol→`cabinet_medium(_decorated)`·
                    `cabinet_small(_decorated)`·`shelf_B_large(_decorated)` · tablo→
                    `pictureframe_large_A/B`·`_medium`·`_small_A/B/C` · paspas→`rug_rectangle_*`·
                    `rug_oval_*` · saksı/buyukSaksi/denizlikSaksi→`cactus_small/medium_A/B`·`bush` ·
                    gazetelik→`shelf_A_small`·`shelf_B_small(_decorated)` · konsol üstü→`lamp_table`
                  ③ AYAK İZİ — aday büyüyünce pad / masa yükseltme noktası / masa katısı / koridor
                    eşikleri ihlal ediliyor mu (bugünkü bekçi yalnız MERKEZE bakıyor, ayak izine
                    bakmıyor — turun asıl riski bu)
                  ④ BANT — duvara asılan aday `WALL_H` altında ve lambri çıtası (0,98) üstünde mi
                  ⑤ RENK — her adayın atlas gözü + gözün gerçek rengi; paket paleti mi kalır,
                    `atlasUV.gozDegistir` mi gerekir (`feedback_color_variety`)
SAYILAR         : (adım 2'den sonra — `docs/dekor-raporu-s5.md` · ham `docs/olcum-dekor.txt`)
KARAR           : (adım 3 — kullanıcı seçer)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (adım 4 — `tests/decor-look.test.ts` + mutasyon sayısı)
```

**Turun bilinen tuzakları (S3/S4'ten devralınan, tekrar ısırmasın):**
- **Modül karosu ölçek değildir** (S3). Paketin 2×2'lik karosunda yazılı KÜÇÜK eşya 0,90'da absürt
  büyüyor (kasa dersi → `KASA_S = 0,45`). Çöp kovası, saksı, masa lambası aynı sınıfta.
- **Origin ortalı sanılmaz** (S4, sucuk dersi): görsel merkez kayması ölçülür, telafi edilir.
- **Kombinasyon onaysız çoğaltılmaz** (D-100): renk paletten gelse bile beş kollu tema kurulmaz.
- **HALI YOK** (kullanıcı üç kez reddetti — `config/decor.ts` başlığı): `rug_*` yalnız **paspas**
  adayıdır, salona halı serilmez.
- **Dekor collision'sız kalır**: hiçbir aday nav/çarpışma listesine girmez (M2 dersi).

## SIRADAKİ TAM ADIM

**Adım 2 — ÖLÇ.** `tools/olcum-dekor.ts` → kısa doğrulama (paket ham ölçeği gerçekten 0,90 mı:
`chair_A` sağlaması) → tam koşu → `docs/olcum-dekor.txt` + `docs/dekor-raporu-s5.md` §Bulgular
(KARAR BÖLÜMÜ BOŞ) → **commit #1**. Sonra tek karar paketi.

**KARAR PAKETİNE EKLENECEK (bu turda çıktı, sıraya alındı):**
- **S4'ün iki sözü** kendi turunda mı kalsın, S5'e mi binsin: ① banket masası
  `table_round_A_small` (`tableLook.ts`, D-073'ün dondurduğu ölçüler) ② mağaza kartlarının gerçek
  oyun render'ı (`tools/tema-kapak.mjs` kadrajı bozuk).

**KULLANICI KARARI BEKLEYEN ÜÇ ŞEY** (hiçbiri S5'i bloklamıyor):
1. **Ses kaynağı** (S8) — asset panosu §7, dört kol. D-096'yı kısmen geri alır.
2. **Karakter kolu** (S12) — asset panosu §3, altı kol, bedelleri yazılı.
3. **H2 yükseltme sırası** (A tek hedef / B kuşak) ve **H3 masa aralığı** (K1 aralığı aç /
   K2 oturak küçült — K2 önerilmiyor, `feedback_reference_scale_trap`).

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **`tsc -b` kapanışa girmeli** — iki turdur elle yakalanıyor, kural olmadıkça yine kaçar.
- **G-01 çay/bulaşık toplama masanın her tarafından olmuyor · G-02 çay ocağından alma güvenilmez ·
  G-03 2. masa görevinde kamera kendiliğinden kayıyor** — üçü de HATA, kendi turunu ister. (H1.)
- **G-05 görev metinleri açıklayıcı değil** — altta net hedef, üstte kısa lakap (yazım işi).
- **G-06 tepsi ilk yükseltme 75 → ~50 · G-07 yükseltme dwell'i para-bağımsız sabit olsun** —
  ikisi de DENGE, varyant kapısına tabi, **ölçülmeden uygulanmaz** (Faz H'de H2 ile aynı turda).
- **Masalar geçilmiyor (ÖLÇÜLDÜ, uygulanmadı):** arka salonda açıklık **0,68 br**, geçiş 0,94
  ister → 20 masanın 12'si geçilemez. İki kol
  `docs/geribildirim-oyun-testi-2026-09-09.md` sonunda. (H3.)
- **G-16 arayüz kahverengi/iç karartıcı → mavi · G-17 ekranlar tam-ekran mı modal mı · G-10 pad
  şekli** — kullanıcı "bilemedim" dedi; **maket görmeden koda girmemeli**. (S9.)
- **G-18 masaya tıklayınca seviye gözüksün mü** — kullanıcı düşünüyor, açık soru.
- **`.gitattributes` YOK** — `core.autocrlf=true` her checkout'ta metin dosyalarını CRLF'e çeviriyor.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün ikinci oturumda sessiz
  kalıyor; kural "sayaç arttıysa kart da artmalı" olmalı.
- **Bulaşık gövdesi kutusundan geniş çizilemiyor** — `kitchentable_sink_large` native 3,0, kutu
  2,0 × 1,0; model kutuya çekiliyor ve hafif basık duruyor. Kutuyu büyütmek yürüme alanına dokunur,
  kendi ölçümünü ister.

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
