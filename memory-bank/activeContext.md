# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-10 — **S6 + S6/② BİTTİ** · Faz S 6/12 · 81/96)

```
SORU            : (S6) dış cephe KayKit'e geçer mi · (S6/②) kullanıcı S6'yı oynadı, dokuz kalem verdi.
SAYILAR         : `docs/dis-cephe-raporu-s6.md` · ham `docs/olcum-dis-cephe.txt`.
KARAR           : **D-102** (S6) + **D-103** (S6/②).
BEKÇİ           : `street-look` (19) + `pencere-nis` (29) · toplam **26 mutasyon**.
                  vitest **864** · duman **42/42** · `tsc -b` temiz · lint tabanda · 5 kadraj gözle.
```

**S6'nın dersi: "hangisi daha güzel"den ÖNCE "ekrana giriyor mu" sorulmalı.** Karşı binalar üç
kamera kipinde de **%0** görünür (kameranın z tavanı 25,50, binalar 26,5'te) → 10.389 üçgenlik
iş ölçülmeseydi yapılacak ve ekranda hiçbir şey değişmeyecekti. Bugünkü 9 kutu da silindi.

**S6/②'nin dersi: dokuz şikâyetin çoğu TEK bir tahmini sayıydı.** `WALL_FACE` = 17,32 yazılıydı
(gerekçe: *"gövde yüzünün ~0,1 önü"*), duvarın yüzü **17,41** → asılan her şey 0,09 havada;
petek 0,30; lavabo 0,12. Sayı artık duvarın kalınlığından türüyor, bir düzeltme altı parçayı
düzeltti. **Kullanıcı bunu ben bulmadan önce iki ayrı yerde gördü** (raf ve kalorifer) — yani
görsel doğrulama turu, ölçüm turunun bulamadığını buluyor.

**Üçüncü ders: `Decor.tsx`te yazılı bir karar bekçilenemez.** Gölge kararı orada duruyordu ve
onu geri açan mutasyon KAÇTI; karar `decorLook.PENCERE_GOLGE`/`DUVAR_GOLGE`'ye çıktı.
Aynı tur bir de zayıf ölçüt yakaladı: ayna bekçisi ARALIK denetliyordu, eşitliğe çevrildi.

**Tente (F1) kullanıcı kararı, bedeli bilinerek kabul edildi** — kapı eşiği %77 konumda görünmez.
Geri dönüş kolu ölçülü ve hazır: **F4**, dikey tabela 0,34 → **0,72** (%0 sınırı üst kenar 1,97).

## SIRADAKİ TAM ADIM

**S7 — GİRİŞ DUVARI CAM + WC kabin kapıları.** İkisi de kullanıcıdan geldi:
1. **Giriş cephesi cam** (kullanıcı bana bıraktı, S6/②'de ERTELENDİ): maket v13'te cephe camdı.
   Ölçüm değer diyor — cephe salonun **en görünür ikinci şeridi** (%8–15, §V). Ertelenme sebebi
   kapsam: kapı bloğuna (söve · lento · alınlık) ve duvar temasına dokunuyor, kendi turunu ister.
2. **WC kabin kapıları** düz kutu (`1,36 × 1,95 × 0,06`, tek renk kahve) ve kullanıcı *"kötü"*
   dedi. Karşılığı diskte: `door_A` · `door_B` · `wall_doorway` · `wall_half` + `pillar_A/B`.
   S6/②'den devreden: lavabolar ve ayna artık gri KayKit — kapılar onunla aynı dilde olmalı.
   Klozet karşılığı üç pakette de YOK (S5'in çöp kovası dersi), elle çizim kalacak.

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
