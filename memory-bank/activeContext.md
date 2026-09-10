# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-10 — **S5 BİTTİ** · Faz S 5/12 · 80/96)

```
SORU            : Elle çizilen dekor parçaları KayKit karşılığına geçebilir mi?
ÖLÇÜLECEK KOLLAR: ölçek (0,90 · fit · gerçek boy) · aday · ayak izi · duvar bandı · renk.
SAYILAR         : `docs/dekor-raporu-s5.md` · ham `docs/olcum-dekor.txt`.
                  `trash_A/B` = 0,127 × **0,052**, 18 üçgen ikosfer (kova değil).
                  `lamp_standing` 0,90'da **2,27 br = karakterin %130'u**.
                  `cactus_*` biçim oranı 0,91–1,06 ↔ saksı **0,37** (2,4–2,8 kat).
                  `rug_*` en −%4 (en uyumlu), derinlik +%50. Ayak izi en dar **0,51 br**, ihlal yok.
KARAR           : **D-101 — sekiz tür GEÇTİ.** Kullanıcı: kaktüs geçsin · paspas **mavi** ·
                  gazetelik kitaplığa. Çöp kovası aday yok → elle kaldı.
                  **Ölçek kuralı: mobilya 0,90, aydınlatma GERÇEK BOY.**
UYGULAMA        : yeni `decorLook.ts` (ölçü katmanı) · `Decor.tsx` (elle çizimler **fallback**) ·
                  `config/decor.ts` (gazetelik zeminden asma bandına) · `DENIZLIK_DERINLIK`
                  tek kaynağa çıktı · kaktüsler A/B dönüşümlü.
BEKÇİ           : `decor-look` **20 test / 8 mutasyon** (M6 kaçtı → düzeltildi → yakalandı).
                  vitest **818** · duman **42/42** · `tsc -b` temiz · 5 kadraj gözle doğrulandı.
```

**Turun en pahalı dersi: aday listesi model ADINA bakılarak yazılmıştı.** Faz S planındaki sekiz
kalemin **ikisi ölçümde düştü** — `trash_A/B` bir çöp kovası değil 18 üçgenlik yer çöpü,
`cactus_*` bir yaprak bitkisi değil. İkisi de dosya adından "doğru" görünüyordu. Ölçüm bu turda
plana değil, **modelin kendi geometrisine** baktı ve plan yanıldı.

**İkinci ders — biçim oranı ölçek kadar önemli.** Ölçek her zaman ayarlanabilir, **biçim
ayarlanamaz**: bir adayın en/boy oranı gerçeğinden uzaksa hangi ölçeğe konursa konsun yanlış
okunur. Araç ilk koşuda bunu hiç ölçmüyordu; sütun eklenince iki aday elendi. Aynı koşuda ikinci
bir yöntem hatası daha çıktı: düz parçada (paspas) **boy** karşılaştırması %650'lik sahte sapma
üretiyor — düz parçada ölçek ENDEN türer.

**Üçüncü ders — bekçi neyi denetlediğine dikkat etmeli.** Kaçan mutasyon (M6) `DENIZLIK_S`
**sabitinin** denetlendiğini ama **kullanımının** denetlenmediğini gösterdi; arkasında daha derin
bir açık vardı — saksının denizliğe *sığdığı* hiçbir yerde ölçülmüyor, denizliğin derinliği
`Decor.tsx`te gömülü bir sayıydı. Sayı tek kaynağa çıktı, ölçüt "gövde sığar" oldu.

**Bekçi kod yazılırken bir hatayı da yakaladı:** halının ayak izi ölçütü gövdeyi DİSK sanıyordu
(köşe yarıçapı 1,62) ve yanlış alarm verdi; halının uzun kenarına dik yönde gövde yalnız 0,90 br.
Ölçüt kutuya çevrildi (`turDunyaKutu`).

## SIRADAKİ TAM ADIM

**S6 — dış cephe + pencere + tente.** `building_A…H` · yollar · `streetlight` · `bench` · `bush` ·
`car_taxi`; pencere `wall_window_open` (kullanıcının *"pencere duvardan ayrı duruyor"* şikâyetinin
doğrudan karşılığı); tente maket-v13'ten (`box(6.4, 0.18, 1.9, 0x2e6b4f)`, x-rot 0,18, kapının
üstünde). Hepsi diskte.

**S5'ten S6'ya DEVREDEN ÖLÇÜM (tekrar ölçülmesin):** city-builder-bits **AYRI ÖLÇEKTE** —
sokak mobilyası gerçeğin ~1/4'ü yazılmış (`bench` 0,400 ↔ 1,50 m · `firehydrant` 0,135 ↔ 0,32 ·
`dumpster` 0,566 ↔ 1,80). **O pakete 0,90 uygulanamaz**, kendi çarpanı hesaplanmalı.
Araç hazır: `npx tsx tools/olcum-dekor.ts` §0.

**KULLANICI KARARI BEKLEYEN ÜÇ ŞEY** (hiçbiri S6'yı bloklamıyor):
1. **Ses kaynağı** (S8) — asset panosu §7, dört kol. D-096'yı kısmen geri alır.
2. **Karakter kolu** (S12) — asset panosu §3, altı kol, bedelleri yazılı.
3. **H2 yükseltme sırası** (A tek hedef / B kuşak) ve **H3 masa aralığı** (K1 aralığı aç /
   K2 oturak küçült — K2 önerilmiyor, `feedback_reference_scale_trap`).

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **S5'te söz verilip YAPILMAYAN:** ① banket masası `table_round_A_small`e geçecekti ② mağaza
  kartlarının gerçek oyun render'ı (`tools/tema-kapak.mjs` kadrajı bozuk). Kullanıcı 2026-09-10'da
  **kendi turunda kalsın** dedi; ikisi de ölçüm ister.
- **`tsc -b` kapanışa girmeli** — üç turdur elle yakalanıyor, kural olmadıkça yine kaçar.
- **`npm run lint` 31 hata veriyor** (hepsi ESKİ `tools/olcum-*.ts` dosyalarında, kullanılmayan
  değişkenler). S5'in dosyaları temiz; lint kapanış protokolünde olmadığı için birikmiş.
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
