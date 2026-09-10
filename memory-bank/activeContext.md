# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-10 — **S7 ölçüm turu AÇIK** · Faz S 6/12 · 81/96)

```
SORU            : (S7) WC odasının içi EKRANA GİRİYOR MU — giriyorsa kabin kapıları KayKit'e
                  geçer mi (kullanıcı: "kötü"), lavabo seviyesi MEKÂNSAL okunur mu (G-36),
                  müşteri kapıda niye buharlaşıyor (G-35)?
ÖLÇÜLECEK KOLLAR: §V GÖRÜNÜRLÜK — her aday parça (kabin kapısı · bölme · lavabo · ayna · klozet)
                    kaç oyuncu konumundan kadrajda VE 2,2'lik ön duvarın arkasına saklanmıyor?
                    S6'nın dersi: "hangisi güzel"den ÖNCE "ekrana giriyor mu" sorulur.
                  §K KAPI — K1 bugünkü kutu (1,36 × 1,95 × 0,06, tek renk kahve) · K2 `door_A`
                    · K3 `door_B`; bölme için B1 bugünkü kutu · B2 `wall_half` · B3 `pillar_A/B`.
                    Ölçü · çarpıtma oranı · üçgen · atlas gözü (gri karşılığı var mı).
                  §L SEVİYE (G-36) — L1 bugünkü sabit 3 lavabo (sinyal YOK) · L2 seviye = lavabo
                    SAYISI (1→6, maxLevel 6 ile birebir) · L3 sayı sabit, başka mekânsal sinyal.
                    Doğu duvarı kaç lavabo alır, aralık kaça iner?
                  §M KAYBOLUŞ (G-35) — M1 oda yürünür olsun (nav + bant kütlesi bedeli) ·
                    M2 kayboluş ÖRTÜLSÜN (kapıdan içeri yürüyüp solma / kabin kapısı geçişi) ·
                    M3 bugünkü (kapı eşiğinde anında yok ol).
SAYILAR         : (adım 2'den sonra dolar — `docs/wc-odasi-raporu-s7.md` §Bulgular)
KARAR           : (adım 3 — kullanıcı seçer, D-1xx)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (adım 4)
```

**Giriş cephesi cam bu turda YOK** — kullanıcı kararı 2026-09-10: kapı bloğuna (söve · lento ·
alınlık) ve duvar temasına dokunduğu için kendi turunu alacak. S7 = WC odası.

**S6'nın dersi bu turun §V'sini doğurdu:** karşı binalar üç kamera kipinde de %0 görünürdü;
10.389 üçgenlik iş ölçülmeseydi yapılacaktı. WC odası aynı riski taşıyor — oda bandın İÇİNDE,
önünde 2,2 birimlik bir duvar var. Kabin kapısını KayKit'e geçirmeden önce o kapının ekranda
kaç kareden göründüğü ölçülür.

**S6/②'nin dersi:** dokuz şikâyetin çoğu TEK bir tahmini sayıydı (`WALL_FACE` 17,32 ≠ 17,41);
sayı duvarın kalınlığından türetilince altı parça birden düzeldi. **S6/③'ün dersi:** "şu şeyi
kaldır" denince neyin kastedildiği ekran görüntüsünde İŞARETLENMEDEN varsayılmamalı — yanlış
parça (lento) kalktı, bir tur kaybedildi.

## SIRADAKİ TAM ADIM

**Adım 2 — ÖLÇ.** `tools/olcum-wc-odasi.ts` yazılır (iskelet `olcum-lib.ts`, görünürlük yöntemi
`olcum-dis-cephe.ts` §V'den devralınır, artı bu turda YENİ: **2,2'lik ön duvarın örtmesi**).
Kısa koşuyla araç doğrulanır → `OLCUM=tam` taban → tüm kollar varyant olarak
`docs/wc-odasi-raporu-s7.md` §Bulgular'a → **commit #1 (karar bölümü BOŞ)** → karar paketi.

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
