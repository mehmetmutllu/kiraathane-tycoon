# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **S2 BİTTİ** · Faz S 2/7 · 77/88)

```
SORU            : Kullanıcı oynadı ve 25 kalemlik geri bildirim verdi (G-01…G-25,
                  docs/geribildirim-oyun-testi-2026-09-09.md). En ağır iddia: "her şeyi yaptık
                  ama KayKit'i hiçbir yere eklemedik." Doğru mu, ve pad dili nasıl olmalı?
ÖLÇÜLECEK KOLLAR: yok — bu bir DENGE turu değil, sanat/arayüz turu. Varyant kapısı tetiklenmedi
                  (economy.config.ts / tick.ts / rules.ts hiç açılmadı). Kapı: test + duman.
SAYILAR         : İddia SAYIYLA doğrulandı — 238 KayKit modeli repoda, `grep kaykit src/` = 4 satır
                  (yalnız masa+sandalye) → **185 model, 0 satır kod**. Elle çizilen 17 dekorun
                  8'i birebir KayKit karşılığına sahip, 2'si yaklaşık, 6'sı yok.
KARAR           : Kullanıcı "ücretsiz olduğu sürece her asseti çek ve yap" dedi → **Faz S açıldı**
                  (6 kalem, docs/plan-faz-s-sanat.md). İki eski karar kullanıcı isteğiyle DÖNDÜ:
                  D-094'ün Usta ŞERİDİ → MODAL (G-14) · görev toast'ı → KALKTI (G-04).
UYGULAMA        : S1 · çember → köşe parantezli kare · YÜKSELT + ok · toast kalktı, bant
                  "TAMAMLANDI" oldu · Usta şeridi modal oldu.
                  S2 (D-098) · kullanıcı S1'i oynadı, altı kusur kapandı: çerçeve genişliği artık
                  YAZIDAN çözülüyor (ok/yazı çakışması bitti) · köşeler yuvarlatıldı · modal
                  yaklaşınca değil DURUNCA açılıyor (dwellState, 1,1 sn) · modal MERKEZÎ kabukta ·
                  Usta'nın yuvarlak biçimi kalktı, işaret TEK biçim · ölçek mesafeye göre
                  değişmiyor (yalnız üstündeyken ×1,12) · modal yazı rengi düzeldi
BEKÇİ           : vitest 770 · duman 42/42 (biri YENİ: "modal merkezî kabukta" — alt sayfaya
                  geri düşüş artık testle yasak) · kare işaret tarayıcıda gözle doğrulandı.
                  Yan iş: tools/pano-guncelle.mjs `yazmaliMi()` + 3 test, 2 mutasyon yakalandı.
```

**Turun en kalıcı parçası bir araç hatası:** kapanışta pano bekçisi kırmızıydı — **ve benim
değişikliğimden önce de kırmızıydı** (temiz ağaçta doğrulandı). Sebep CRLF sanılıyordu, değildi:
aracın yazma şartı *"veri değişti mi"* idi, oysa pano elle düzenlenince **biçimi** kayabiliyor
(blokta 830 `\uXXXX` kaçışı ile 15.020 ham karakter yan yana). Veri aynı, bayt farklı → araç
"zaten güncel" deyip çıkıyor, bekçi **sessizce** kırmızı kalıyor. **Ders: bir aracın yazma şartı
ürettiği çıktıya bakmıyorsa, kendi bekçisini göremez.**

**İkinci ders — şikâyetin cevabı çoğu zaman zaten diskte.** "Pencere duvardan ayrı duruyor" →
`wall_window_open` pencereyi duvarın parçası olarak modelliyor. "Texture lazım" → `floor_kitchen`
+ üç atlas PNG repoda. Foto-gerçekçi CC0 doku siteleri (Poly Haven / ambientCG) bu stile **uymaz**
ve panoya bilerek alınmadı.


**ÖLÇÜLDÜ, KARAR BEKLİYOR — masalar çok yakın ve bu bir HİS DEĞİL GEOMETRİ.** Kullanıcı
"birbirlerine çok mu yakın" diye sordu ve "mutfağa yakın yerde yürüyemiyorum" dedi; ikisi aynı kök:
geçiş için **2 × playerRadius = 0,94 br** gerekiyor · ön salon boşluğu **3,50 br** (rahat) ·
**arka salon 0,68 br** → 20 masanın **12'si geçilemez**. Çarpışma katılarında eşik altında
**52 açıklık**, en darı **0,04 br**. Düzeltme `layout.ts` ve ONAYLI maket düzenine dokunuyor →
iki kol sayılarıyla `docs/geribildirim-oyun-testi-2026-09-09.md` sonunda, **uygulanmadı.**

**İNDİRME ENGELİ KALKTI.** Bash'in ağı yok ama **PowerShell'in var**. `tools/indir-itch.ps1`
itch akışının 3/4 adımını yapıyor (csrf → indirme sayfası → dosya listesi), son adım 404.
Not: PS 5.1 BOM'suz UTF-8 `.ps1`i ANSI okuyor — Türkçe betikler **BOM'lu** yazılmalı.

## SIRADAKİ TAM ADIM

**S3 — mutfak bloğu KayKit'e geçer.** `maketParts.tsx`teki `MaketCounter` · `MaketSink` ·
`MaketDishSink` · `MaketCezveStation` · `MaketWaterRack` · `MaketCrates` yerine
`kitchencounter_straight_A/B(+_backsplash)` · `kitchencounter_sink` · `stove_multi` ·
`extractorhood` · `fridge_A` · `dishrack_plates` · `crate*`. Yükleyici hazır (`Model.tsx`,
fallback ilkel şekle düşer) ve `recolor.ts` atlas kopyasıyla renk değiştirilebiliyor.
Ardından S4 (duvar+zemin) · S5 (dekor takası) · S6 (dış cephe + pencere + **tente**, maket-v13'te
`box(6.4, 0.18, 1.9, 0x2e6b4f)` x-rot 0.18, kapının üstünde).

**S7 — UI TASARIM DİLİ ARAŞTIRMASI + paket indirme.** Kullanıcı "genel olarak UI çok kötü,
internette araştırma yap" dedi ve **sonraki sohbete** bıraktı. Piyasadaki tycoon'ların HUD/modal
dili + ücretsiz UI kit'leri araştırılacak; paketler artık indirilebilir (yukarı bak).
**UI ASSETİ HENÜZ HİÇ ARANMADI** — asset panosu yalnız 3D model kapsıyordu.

**CEVAPLANMAMIŞ:** karakter kolu (asset panosu §3 — altı kol, hepsinin bedeli yazılı).

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **G-01 çay/bulaşık toplama masanın her tarafından olmuyor · G-02 çay ocağından alma güvenilmez
  (tepside yer varken) · G-03 2. masa görevinde kamera kendiliğinden kayıyor** — üçü de HATA,
  kendi turunu ister; tasarım kararı beklemiyor.
- **G-05 görev metinleri açıklayıcı değil** — altta net hedef, üstte kısa lakap (yazım işi).
- **G-06 tepsi ilk yükseltme 75 → ~50 · G-07 yükseltme dwell'i para-bağımsız sabit olsun** —
  ikisi de DENGE, varyant kapısına tabi, **ölçülmeden uygulanmaz**.
- **G-16 arayüz kahverengi/iç karartıcı → mavi · G-17 ekranlar tam-ekran mı modal mı (Subway
  Surfers) · G-10 pad şekli** — kullanıcı "bilemedim" dedi; **maket görmeden koda girmemeli**.
- **G-18 masaya tıklayınca seviye gözüksün mü** — kullanıcı düşünüyor, açık soru.
- **`.gitattributes` YOK** — `core.autocrlf=true` her `git checkout`ta metin dosyalarını CRLF'e
  çeviriyor. Pano aracı artık satır sonundan da biçimden de bağımsız, ama başka araç düşebilir.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün ikinci oturum kapanınca
  sessiz kalıyor; bu turda kart ELLE eklendi. Kural "sayaç arttıysa kart da artmalı" olmalı.

**Bekleyen denge kararı:** G-06 ve G-07 bekliyor — ikisi de ölçüm turu ister, S fazında YAPILMAZ.

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
