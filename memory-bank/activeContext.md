# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S11 BİTTİ: MOR DİL KODA GİRDİ, D-109** · Faz S 10/14 · 85/98)

```
SORU            : D-107'nin mor dili ve D-108'in ikon grameri koda nasıl girer — ekranların
                  YAPISINA (K3/M2/Y2) dokunmadan?
ÖLÇÜLECEK KOLLAR: YOK — karar zaten yazılıydı (D-106/107/108). Bu tur doğrudan adım 4 UYGULA.
SAYILAR         : docs/ui-ses-raporu-s9s10.md §S11 · ham docs/olcum-ui-ekran.json
                  punto 17→5 (tanımlı 6) · gölge 27→3 · yarıçap 9→6 dizge (=3 basamak+hap+
                  daire+köşe-başı) · font 3→2 · zemin 29→10 · metin 23→8 · glif 17→13 ·
                  AA altı 45/184 → 12/177
KARAR           : D-109 — mor dil koda girdi; DURUM gölgeyle değil KENARLIKLA anlatılır
                  (maket dördüncü bir gölge yazıyordu, D-107 "3 kademe" dedi → halka kenara).
                  Dört token eklendi (vitrin·perde·parilti·uyari) · --uyari ölçümle koyulaştı.
UYGULAMA        : index.css + hud.css token katmanı · icons.tsx D-108 gramerinde yeniden ·
                  🔒✕↺✓•→ SVG'ye · button{font:inherit} · S11 ikiye bölündü (S12 = YAPI)
BEKÇİ           : tests/mor-dil.test.ts — 9 denetim, **8 mutasyonla** doğrulandı
                  vitest 916 ✓ · duman 42/42 ✓ · tsc -b ✓ · tam koşu ölçümü ✓
```

## SIRADAKİ TAM ADIM

**S12 — UI YAPISI (K3 kabuğu).** Dil hazır, sıra ekranların iskeletinde. Kapsam D-106:
- **K3 tam ekran + TEK kabuk** (sol üstte geri · ortada başlık · sağ üstte cüzdan); alt sayfa
  kabuğu kalkar. Bugün beş ekran **dört farklı yükseklikte** açılıyor (430 · 471 · 530 · 675 ·
  675 px) — *"ekranlar tutarsız"* hissinin ölçülen kaynağı bu. `BackIcon` hazır, kullanılmıyor.
- **Mağaza M2**: önizleme 74 → **230 px** + seçim şeridi + tek büyük satın alma.
- **Pad Y2** (köşe-parantezli kare) · **G-18** masanın kendi mekânsal noktası vurgulanır.
- **Chip'siz üst şerit**: para/elmas/seviye doğrudan sahnenin üstünde, okunabilirliği KONTUR
  taşır (`.cur-val` sınıfı bunu zaten yapıyor, kutuları kaldırmak kalıyor).
- **G-05** görev metinleri (altta net hedef, üstte kısa lakap).
**Denge dosyalarına DOKUNULMAZ** — G-06 (tepsi 75 → ~50) bu turun da işi değil.

### S12'nin başında sorulacak TEK soru (ölçüldü, uygulanmadı)

Kalan **12 AA ihlalinin hepsi** aynı yerden: `--tx2` (#a99fd8) **gövde gradyanı** üstünde
**3,84** veriyor (AA 4,5 ister); **kart** üstünde 4,57 ile geçiyor. Yani sorun renk değil,
ikincil metnin kartsız zeminde durması. **T1** = `--tx2` bir tık açılır (#bfb6e6 → 4,91; ama
D-107'nin yazdığı renge dokunur) · **T2** = ikincil metinler kart zeminine alınır (K3 kabuğu
o satırları zaten yeniden diziyor). **Öneri: T2.**
Etkilenen: sheet-sec (4) · qrow-title (3) · char-stat-val (3) · sheet-foot-note (1) ·
shop-locked-desc (1).

**S9** (ses dosyaları + seri ivmesi) hâlâ ayrı tur; kaynak kararı yazılı (D-106 · S-C), paketler
indirildi ama repoya GİRMEDİ — yalnız kullanılacak dosyalar künyesiyle girecek.

**Bu turun DIŞINDA bekleyen:** karakter kolu (S14, asset panosu §3) · H2 yükseltme sırası ·
H3 masa aralığı.

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0
**Paketten çıkanlar:** https://claude.ai/code/artifact/e2917b1e-64c9-4f9f-96e6-7d3ba5a719a9
**Mor arayüz maketi:** https://claude.ai/code/artifact/6cc7a95e-c0a3-4802-8ea3-99398d637981


## AÇIK KALEMLER (bilinen, bilerek duruyor)

### S8'den DEVREDEN (ölçüldü, bilerek yapılmadı)

- **Vitrinin ardındaki giriş holü artık GÖRÜNÜYOR ama vitrin için düzenlenmiş değil.** Şerit
  z 14,88…17,39; içindeki 10 dekor öğesi duvar diplerine dağılmış durumda. Kendi yerleşim turu.
- **Cephe temasının payı %100 → %45 düştü** (bilinerek, D-105).

### S7'den DEVREDEN (ölçüldü, bilerek yapılmadı)

- **`door_A`nın İTME BARI duruyor** — tek mesh (188 üçgen), sökülemiyor. Başka paket gelirse
  ilk bakılacak kalem.
- **WC odasının ORTASI hâlâ boş + TAVAN IŞIĞI yok** (`feedback_room_volume`). Zemin %2 görünür:
  dolgu zemine değil duvar kenarına/yüksekliğe gitmeli. Kendi turu.

- **S5'te söz verilip YAPILMAYAN:** ① banket masası `table_round_A_small`e geçecekti ② mağaza
  kartlarının gerçek oyun render'ı (`tools/tema-kapak.mjs` kadrajı bozuk). Kullanıcı 2026-09-10'da
  **kendi turunda kalsın** dedi; ikisi de ölçüm ister.
- **`tsc -b` kapanışa girmeli** — dört turdur elle yakalanıyor, kural olmadıkça yine kaçar.
- **Tente kapıyı tamamen örtüyor (F1, kullanıcı kararı).** Geri dönüş kolu F4 hazır ve ölçülü:
  dikey tabela 0,34 → 0,72, sınır üst kenar 1,97.
- **KayKit `bench` düz bir plaka gibi okunuyor** (0,36 br, sırtlıksız). Değişecekse başka paket ister.
- **WC ÇÖP KUTUSU elle çizim kalıyor** — üç pakette karşılığı YOK, İKİNCİ kez ölçüldü (S5 + S6/②).
- **`npm run lint` 31 hata veriyor** (hepsi ESKİ `tools/olcum-*.ts`, kullanılmayan değişkenler).
- **G-01 çay/bulaşık toplama masanın her tarafından olmuyor · G-02 çay ocağından alma güvenilmez ·
  G-03 2. masa görevinde kamera kendiliğinden kayıyor** — üçü de HATA. (H1.)
- **G-06 tepsi ilk yükseltme 75 → ~50 · G-07 yükseltme dwell'i para-bağımsız sabit olsun** —
  ikisi de DENGE, varyant kapısına tabi, **ölçülmeden uygulanmaz** (Faz H'de H2 ile aynı turda).
- **Masalar geçilmiyor (ÖLÇÜLDÜ, uygulanmadı):** arka salonda açıklık **0,68 br**, geçiş 0,94
  ister → 20 masanın 12'si geçilemez. İki kol
  `docs/geribildirim-oyun-testi-2026-09-09.md` sonunda. (H3.)
- **Pano ARTIFACT'ı yayında 4 oturum geride (80/96).** Yerel `docs/pano/ilerleme-panosu.html`
  güncel (84/97) ve commit'te; yeniden yayın kapısı yayındaki sürümün TAMAMININ okunmasını
  şart koşuyor (114k token) ve diff kaybolacak içerik olmadığını gösterdi. Bir sonraki oturumda
  ilk iş olarak yapılabilir; link: /artifact/04588e2c-0761-4e69-82d4-2f068ca5750a
- **`.gitattributes` YOK** — `core.autocrlf=true` her checkout'ta metin dosyalarını CRLF'e çeviriyor.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün ikinci oturumda sessiz
  kalıyor; kural "sayaç arttıysa kart da artmalı" olmalı.
- **Bulaşık gövdesi kutusundan geniş çizilemiyor** — `kitchentable_sink_large` native 3,0, kutu
  2,0 × 1,0; model kutuya çekiliyor. Kutuyu büyütmek yürüme alanına dokunur, kendi ölçümünü ister.

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
