# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-10 — **S6 BİTTİ** · Faz S 6/12 · 81/96)

```
SORU            : Kıraathanenin DIŞI KayKit'e geçebilir mi + WC lavabosu gri musluklu modele geçsin mi?
ÖLÇÜLECEK KOLLAR: A ölçek · B binalar · C yol karosu · D sokak mobilyası · E pencere · F tente · G lavabo.
SAYILAR         : `docs/dis-cephe-raporu-s6.md` · ham `docs/olcum-dis-cephe.txt`.
                  **§V GÖRÜNÜRLÜK — turun ana bulgusu:** karşı binalar üç kamera kipinde de **%0**.
                  Kamera oyuncunun +z'sinde (z tavanı 25,50), binalar 26,5'te → HER ZAMAN arkada.
                  city-builder çarpanı **3,636** (0,90 kolu −%66…−%81 saptı).
                  Pencere modülünün deliği **1,28 × 1,28** ↔ oyunun bandı 3,20 × 1,65; oluğu 1,60 ↔ lambri 0,94.
                  Tente: kapı eşiği **17/22 konumda (%77) görünmez**; %0 veren hücre YOK.
                  Gri lavabo = `kitchentable_sink` (TEK atlas gözü #828c91, doygunluk 0,11).
KARAR           : **D-102.** A1 global 3,636 · **B ve C GİRMEDİ** (bugünkü 9 kutu da silindi) ·
                  D girdi · **E3 pencere duvara GÖMÜLDÜ** · **F1 tente (kullanıcı bedeli kabul etti)** ·
                  **G1 lavabo bugünkü kutuya çekildi** (çarpıtma 2,62, yerleşim korunuyor).
UYGULAMA        : yeni `streetLook.ts` + `wcLook.ts` · `wallLook.wallPieces` + `wallBoxes.y0`
                  (duvarda gerçek açıklık, yeri `config/decor.ts`ten türer) · `Scene.Street` yeniden
                  yazıldı · `Decor.Pencere` nişe göre kuruldu (lento kapağı hack'i kalktı) ·
                  `MERDIVEN_DERINLIK` ölçü katmanına taşındı.
BEKÇİ           : `street-look` (19) + `pencere-nis` (19) · **16 mutasyon, hepsi yakalandı**.
                  vitest **856** · duman **42/42** · `tsc -b` temiz · beş kadraj gözle doğrulandı.
```

**Turun en pahalı dersi: "hangisi daha güzel" sorusundan ÖNCE "ekrana giriyor mu" sorulmalıydı.**
Faz S planı S6'yı *"dış cephe: `building_A…H`, yollar…"* diye yazmıştı ve ölçüm o binaların
**hiçbir kadrajda görünmediğini** söyledi. 10.389 üçgenlik bir iş, ölçülmeseydi yapılacaktı ve
ekranda hiçbir şey değişmeyecekti. Görünürlük ölçütü artık `streetLook.GORUNUR_Z_SON` olarak
bekçili — buranın ötesine model konamıyor.

**İkinci ders — araç üç kez kendi hatasını buldu, üçü de TEK EŞİĞE güvenmemekten çıktı.**
① "tezgâh üstü" ölçütü enin YARISINA bakıyordu, çanağın üstündeki parçaya yapıştı (1,146 okundu,
gerçeği 0,996) → **en profili** eklenince yakalandı. ② "dikey yüzey kadrajı kesmez" yazılacaktı,
tarama 0,90'dan itibaren %14 gösterdi: belirleyici olan yüzeyin YÖNÜ değil **üst kenarın
yüksekliği**. ③ `propKutu` kutuyu simetrik sanıyordu; test asimetriyi söylüyordu ama kutu onu
KULLANMIYORDU (S4'ün "sucuk" dersinin aynısı, farklı dosyada).

**Üçüncü ders — çizim değişikliği bir MANTIK testini kırdı.** `maketParts.tsx` lavabo için `Model`i
import edince zincir `recolor` → `Image`e uzandı; `tests/logic.test.ts` oradan `MERDIVEN_DERINLIK`
alıyordu. Ölçü sabiti R3F dosyasında durursa bu her seferinde olur → sabit `wallLook.ts`e taşındı.

**KULLANICI GÖRDÜ VE ONAYLADI, ama görsel sayıdan sert konuşuyor:** tentenin ekran görüntüsünde
kapı **tamamen** kayboluyor (`docs/gorsel/ss/s6-sokak.png`). Dönülmek istenirse hazır kol **F4**:
dikey tabela 0,34 → **0,72** (üst kenar 1,97 = %0 kapanmanın ölçülen sınırı). Kod değişikliği tek
sayı; ölçüm zaten yapıldı.

## SIRADAKİ TAM ADIM

**S7 — lavabo / WC odası.** Kabin kapıları bugün düz kutu (`boxGeometry 1,36 × 1,95 × 0,06`, tek
renk kahve) ve kullanıcı *"kötü"* dedi. Karşılığı diskte: `door_A` · `door_B` · `wall_doorway` ·
bölme için `wall_half` + `pillar_A/B`. **S6'dan devreden:** lavabolar artık KayKit
(`kitchentable_sink`, G1 dönüşümü) — kabin kapıları onunla aynı dilde olmalı. Klozet karşılığı
üç pakette de YOK, elle çizim kalacak (S5'in çöp kovası dersi).

**KULLANICI KARARI BEKLEYEN ÜÇ ŞEY** (hiçbiri S7'yi bloklamıyor):
1. **Ses kaynağı** (S8) — asset panosu §7, dört kol. D-096'yı kısmen geri alır.
2. **Karakter kolu** (S12) — asset panosu §3, altı kol, bedelleri yazılı.
3. **H2 yükseltme sırası** (A tek hedef / B kuşak) ve **H3 masa aralığı** (K1 aralığı aç /
   K2 oturak küçült — K2 önerilmiyor, `feedback_reference_scale_trap`).

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **S5'te söz verilip YAPILMAYAN:** ① banket masası `table_round_A_small`e geçecekti ② mağaza
  kartlarının gerçek oyun render'ı (`tools/tema-kapak.mjs` kadrajı bozuk). Kullanıcı 2026-09-10'da
  **kendi turunda kalsın** dedi; ikisi de ölçüm ister.
- **`tsc -b` kapanışa girmeli** — dört turdur elle yakalanıyor, kural olmadıkça yine kaçar.
- **Tente kapıyı tamamen örtüyor (F1, kullanıcı kararı).** Sayı biliniyordu (%77), görsel daha
  sert çıktı. Geri dönüş kolu F4 hazır ve ölçülü: dikey tabela 0,34 → 0,72, sınır üst kenar 1,97.
- **KayKit `bench` düz bir plaka gibi okunuyor** (0,36 br boyunda, sırtlıksız). Model bu; sokak
  kadrajında turuncu bir set gibi duruyor. Değişecekse başka paket ister.
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
