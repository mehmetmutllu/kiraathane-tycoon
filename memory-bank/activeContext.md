# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-10 — **S9+S10 ARAŞTIRMA TURU** · Faz S 8/13 · 83/97)

Kullanıcı iki kalemi birleştirdi: *"panodaki seslere çok ısınmadım… para toplama vs güzel coin
sesi gibi olsa güzel olur. bu tarz tycoon oyunlarının kullandığı veya bize uygun sesler için
ui araştırması ile birlikte araştırma başlat. sonra ikisine de karar verelim."* UI için:
*"mavi şart değil ama görsel olarak güzel ve çalışılmış hissettirsin."*

```
SORU            : (S9+S10) Ses hangi kaynaktan gelecek ve UI hangi tasarım dilini konuşacak?
                  İki soru tek turda ÖLÇÜLÜR, tek karar paketinde karara bağlanır. KOD YAZILMAZ.
ÖLÇÜLECEK KOLLAR:
  SES  S-A sentez kalsın, coin zenginleşsin + ortam sentezle    (lisans yüzeyi 0, tek sanatçı)
       S-B hibrit: yalnız coin + ortam DOSYA, gerisi sentez     (2 dosya, iki dil bir arada)
       S-C tek CC0 sanatçı seti (Kenney) baştan sona            (stil kilidi korunur, 9+ dosya)
       S-D serbest CC0 derleme (Freesound/OGA, ses ses seçilir) (karışık sanatçı — kilit kırılır)
  UI   U-1 palet yönü      (bugünkü ceviz+pirinç / mavi-gece / sıcak-nötr)
       U-2 ekran modeli    (hepsi tam ekran / hepsi modal / karma: kabuk TEK)
       U-3 pad şekli       (G-10 — yuvarlak / köşe-parantezli kare)
SAYILAR         : (adım 2'den sonra dolar)
KARAR           : (BOŞ — adım 3)
UYGULAMA        : (S10 kod yazmaz; UI uygulaması S11'in, ses uygulaması S9'un turu)
BEKÇİ           : (uygulama turunda)
```

## SIRADAKİ TAM ADIM

Ölçüm aracı `tools/olcum-ui.ts` → ham çıktı `docs/olcum-ui-ses.txt` → rapor
`docs/ui-ses-raporu-s9s10.md` (§Bulgular, KARAR BÖLÜMÜ BOŞ) → **commit #1** → maket artifact
→ **karar paketi**.

**KULLANICI KARARI BEKLEYEN** (bu turun paketine girecek): ses kaynağı · UI paleti · ekran
modeli · pad şekli · G-18 (masaya tıklayınca seviye).
**Bu turun DIŞINDA bekleyen:** karakter kolu (S13, asset panosu §3) · H2 yükseltme sırası ·
H3 masa aralığı.

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0

## AÇIK KALEMLER (bilinen, bilerek duruyor)

### S8'den DEVREDEN (ölçüldü, bilerek yapılmadı)

- **Vitrinin ardındaki giriş holü artık GÖRÜNÜYOR ama vitrin için düzenlenmiş değil.** Şerit
  z 14,88…17,39; içindeki 10 dekor öğesi duvar diplerine dağılmış durumda. Vitrinin "dolu"
  okunması için o şeridin kendi yerleşim turu gerekiyor.
- **Cephe temasının payı %100 → %45 düştü** (bilinerek, D-105). Mağazadaki duvar teması artık
  cephede yalnız kaide + alınlıkta görünüyor; §V camın iç yüzünün hiç görünmediğini ölçtü.

### S7'den DEVREDEN (ölçüldü, bilerek yapılmadı)

- **`door_A`nın İTME BARI duruyor.** Bar bir restoran mutfak kapısının parçası, WC kabininde
  yeri yok — ama modelde ayrı alt-mesh DEĞİL (tek mesh, 188 üçgen), sökülemiyor. Bedeli bilinerek
  kabul edildi. Başka paket gelirse ilk bakılacak kalem.
- **WC odasının ORTASI hâlâ boş + TAVAN IŞIĞI yok** (`feedback_room_volume`). §V zeminin %2
  görünür olduğunu söylüyor: dolgu zemine değil duvar kenarına/yüksekliğe gitmeli. Kendi turu.

- **S5'te söz verilip YAPILMAYAN:** ① banket masası `table_round_A_small`e geçecekti ② mağaza
  kartlarının gerçek oyun render'ı (`tools/tema-kapak.mjs` kadrajı bozuk). Kullanıcı 2026-09-10'da
  **kendi turunda kalsın** dedi; ikisi de ölçüm ister.
- **`tsc -b` kapanışa girmeli** — dört turdur elle yakalanıyor, kural olmadıkça yine kaçar.
- **Tente kapıyı tamamen örtüyor (F1, kullanıcı kararı).** Sayı biliniyordu (%77), görsel daha
  sert çıktı. Geri dönüş kolu F4 hazır ve ölçülü: dikey tabela 0,34 → 0,72, sınır üst kenar 1,97.
- **KayKit `bench` düz bir plaka gibi okunuyor** (0,36 br boyunda, sırtlıksız). Model bu; sokak
  kadrajında turuncu bir set gibi duruyor. Değişecekse başka paket ister.
- **WC ÇÖP KUTUSU elle çizim kalıyor** — üç pakette karşılığı YOK ve bu İKİNCİ kez ölçüldü
  (S5 + S6/②). `trash_A/B` 18 üçgenlik yer çöpü, `dumpster` konteyner. Kullanıcı istedi, yok.
  Yeni paket gelirse ilk bakılacak kalem.
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
  şekli** — kullanıcı "bilemedim" dedi; **maket görmeden koda girmemeli**. (S10.)
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
