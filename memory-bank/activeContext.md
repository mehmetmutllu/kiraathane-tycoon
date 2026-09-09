# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **S4 BİTTİ** · Faz S 4/12 · 79/96)

```
SORU            : KayKit duvar ve zemin modülleri oyunun geometrisine oturuyor mu?
ÖLÇÜLECEK KOLLAR: dört döşeme kolu (tek parça · tam+artık · tam+yarım+artık · eş dağıtım) +
                  kalınlık · kapı deliği · zemin karosu · tema.
SAYILAR         : `docs/duvar-zemin-raporu-s4.md` · ham `docs/olcum-duvar.txt`.
                  Mimari ölçek **0,80** (D-099'un öngördüğü sayı doğrulandı), modül **3,20**.
                  9 hattın hiçbiri tam bölünmüyor. K4 eş dağıtım en kötü **%18,7** (K2 %87,5).
                  Kalınlık 0,26 → 0,40, **kesişen katı 0**. Kapı deliği **1,28** (oyunun 4,40).
KARAR           : **D-100 — duvar KayKit'e GEÇMEZ.** Mutfak zemini geçti; kahve varyant
                  mağaza teması (10.000 ₺). Tezgâh+dolap teması REDDEDİLDİ.
UYGULAMA        : `wallLook.ts` · `KayWalls.tsx` (kip, silinmedi) · `atlasUV.ts` · `DishSink.tsx`
                  · mutfak zemini + ön hat birleşmesi + batı duvarı aksesuarları · 2 HUD düzeltmesi.
BEKÇİ           : `wall-look` 11 test / **4 mutasyon** · `kitchen-look` 15→16 / **3 mutasyon** ·
                  v32→v33 göç bekçisi. vitest **798** · duman **42/42** · `tsc -b` temiz.
```

**Turun en pahalı dersi: ölçüm doğru soruyu sordu, ama YETERİNCE GENİŞ sormadı.** Rapor gerilmeyi
**her hat içinde** ölçtü ve K4'ü kazanan ilan etti (%18,7). Kullanıcı ekranda *"her parça arasında
fark var"* dedi — çünkü **hatlar arasında** modül eni 3,00…3,80 (%27 fark) ve iki hattın buluştuğu
köşede yan yana düşüyor. Ölçüt bir parçanın kendi içindeydi, oysa göz **komşuluğu** görüyor.
Tekrar denenirse çözüm bina için tek ortak adımdır.

**İkinci ders — kapsam.** Paketin paletinden renk SEÇMEK, o seçimi bir ürün hattına çevirmeye
yetmiyor. Tezgâh+dolap+zemini kapsayan beş kollu bir tema seti kuruldu ve kullanıcı
*"bunları sen kendin uydurmuşsun"* dedi. Renk paletten gelse bile **kombinasyon tasarım kararıdır
ve onaysız çoğaltılmaz.** Satılan tek kalem zemin kaldı, mutfak bugünkü hâliyle.

**Üçüncü ders — ölçüm yöntemi de ölçülmeli.** Düşük-poli modelde delik/profil **vertex sayımıyla
bulunamaz** (düz yüzün ortasında vertex yoktur): kapı 0,68 ölçüldü, gerçeği 1,28. Doğrusu üçgene
ışın atmak. Renk de tahminle seçilemez → `tools/atlas-renk.mjs`.

**Bekçi bu turda iki GERÇEK hata yakaladı** (kod yazılırken, gözle değil): peçetelik rafı duvarın
tepesini 0,17 aşıyordu · havluluk çay ocağının kutusuna 0,12 giriyordu. Ayrıca "her duvar
ünitesinin tepesi WALL_H'de" kuralı **daraltıldı, gevşetilmedi**.

## SIRADAKİ TAM ADIM

**S5 — dekor takası.** Elle çizilen 17 parçanın 8'i: `trash_A/B` · `lamp_standing` · `lamp_table` ·
`rug_*` · `pictureframe_*` · `cabinet_*` · `cactus_*` (hepsi furniture-bits, diskte). Kalan 6'sı
elde yok, elle kalır (askılık · duvar saati · aplik · askı rayı · şemsiyelik · petek).
**Not:** `atlasUV.gozDegistir` artık hazır — dekor renkleri de atlas kopyalamadan seçilebilir.

**KULLANICI KARARI BEKLEYEN ÜÇ ŞEY** (hiçbiri S5'i bloklamıyor):
1. **Ses kaynağı** (S8) — asset panosu §7, dört kol. D-096'yı kısmen geri alır.
2. **Karakter kolu** (S12) — asset panosu §3, altı kol, bedelleri yazılı.
3. **H2 yükseltme sırası** (A tek hedef / B kuşak) ve **H3 masa aralığı** (K1 aralığı aç /
   K2 oturak küçült — K2 önerilmiyor, `feedback_reference_scale_trap`).

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **S4'te söz verilip YAPILMAYAN:** ① banket masası `table_round_A_small`e geçecekti (kullanıcı
  istedi, tur doldu — `tableLook.ts`e dokunur, D-073'ün dondurduğu ölçülerin turudur) ·
  ② mağaza kartlarının **gerçek oyun render'ı** (kullanıcı: *"öbür masalardaki gibi kalitesiz
  olmasın"*) — `tools/tema-kapak.mjs` yazıldı ama kadrajı kötü (DEV rozeti, oyuncu, pad'ler
  kadrajda); kart hâlâ iki renkli swatch gösteriyor.
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
