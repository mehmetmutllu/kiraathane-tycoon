# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S15 BİTTİ: KAFA KÜÇÜLDÜ · YÜRÜYÜŞ SENKRON · MÜŞTERİ SKINNED, D-113** · Faz S 14/15 · 89/99)

```
SORU            : Müşteriler skinned'e geçerken üç görsel kusur aynı turda kapanır — kafa/gövde
                  oranı, yürüyüş ↔ ilerleme senkronu, sahibin kasketi.
ÖLÇÜLECEK KOLLAR: Ç çizim · K kafa ölçeği · Ö gövde boyu · S senkron · (kasket ölçümsüz)
SAYILAR         : docs/karakter-raporu-s15.md · ham docs/olcum-yuruyus.json · commit #1 93282ae
                  S  Walking_A 0,571 br/sn icin cizilmis; kok kaymasi 5 klipte de 0 (yerinde)
                     oyuncu 4,5-5,4 -> ayak 7,9-9,5x kayiyordu
                  K  bas payi %42-52 (ilkel govdede %33) · TELAFILI ×0,80'de blob kirilir
                     (omuz 0,616 > 0,60) · TELAFISIZ omuz 0,552 sabit, boy 1,75→1,57/1,48/1,39
                  Ö  1,75 gercek orandan +%6 · 1,60 +%16 · 1,50 +%24 (gercek bozulma)
                  Ç  kapsul 0,04 ms/1 cizim · 6 parca 1,78 ms/216 · SEVK (bas+govde) 0,52 ms/48
                     48 musteri 1,00 ms/96 · 80 musteri 1,57 ms/112 · oyunda 38 esZamanli olculdu
                  Oturus  Sit_Chair_Idle kalca dunyada 0,382 → kok kaldirma +0,068
KARAR           : D-113 — K-B telafisiz ×0,75 · S3 (klip hizdan secilir + tavan 1,80) ·
                  Ö1 (ACTOR_HEIGHT 1,75 KALIR) · Ç2 birlesik skinned · kasket yalniz sahipten.
                  IKINCI TUR: tavan 80 ("kapsul hic gorunmesin") + oturan musteri MASAYA doner.
                  Paket: https://claude.ai/code/artifact/1cad1b62-df57-4ffb-b00b-32f0b9be9565
UYGULAMA        : actor.ts (KAY_KAFA_OLCEK · KLIP_HIZI · TIMESCALE_TAVAN/TABAN ·
                  KAY_OTURMA_KALDIRMA · NPC_SKIN_CAP 80 · KAY_MUSTERI_GOVDE · owner.kasket=false)
                  KayActor.tsx (kafaKucult · head.scale izi sokuldu · lokomosyonSec) ·
                  Customers.tsx (48 yuvali skinned havuz, govde basina iki mesh) ·
                  tools/olcum-yuruyus.mjs · skin-perf sevk kolu · karakter-bak kafa kolu ·
                  tools/shot-s15.mjs · tools/mutasyon-s15.mjs
BEKÇİ           : tests/karakter-senkron.test.ts — 23 denetim, **21 mutasyonla** dogrulandi,
                  kacan 0 · tsc -b ✓ · vitest 966 ✓ · duman 42/42 ✓ · sira ✓
```

## SIRADAKİ TAM ADIM

**S16 — Faz S'in son kalemi: S9 ses** (kaynak karari yazili, D-106 · S-C). Ardindan **Faz H**
(H1 uc hata · H2 yukseltme sirasi · H3 masa araligi — son ikisi DENGE, varyant kapisina tabi).

### S15'ten DEVREDEN (ölçüldü/görüldü, bilerek yapılmadı)

- **Oyuncuda 2,0× artık kayma.** Hizi klibin tasiyabileceginin iki kati; kelepcede sifirlanmiyor
  (bugunku 7,9×'in dortte biri). Sifirlamak oyuncu hizini dusurmeyi ister — DENGE, olculmedi.
- **Rogue'un (bulasikci) omzu 0,709** — blob siniri 0,60'i BUGUN de asiyor; S14'un "omuz 0,58"
  satiri baska govdeden alinmis. Ya sinir ya govde secimi gozden gecmeli.
- **Karakter paneli hâlâ ESKİ ilkel gövdeyi gösteriyor** (`Player.tsx`'in `OwnerBody`'si). Oyunda
  sahip KayKit gövdesi — panel ile sahne ayrisik. Kendi turu.
- **Önlük düz bir plaka** — göğse asılı dikdörtgen, gövdeyi sarmıyor. Cila kalemi.
- **Rogue_Hooded** musteri kadrosunda YOK: kapusonu ekipman suzgecine takilmiyor (mesh adi
  `_Cape`/`_Mask` degil). Kullanilacaksa suzgec genisler.
- **Klip dosyaları mankenin gövdesini de taşıyor** (dosya başına 6.916 üçgen ölü yük, 4 dosya).
  Mesh'i atan bir araç ≈ 0,5-1,5 MB kazandırır.
- **Musteri gövdeleri personelle ayni** (Knight/Rogue/Mage/Barbarian/Ranger) — renk cesitliligi
  tasiyor ama govde tekrari var. Yeni gövde paketi kendi turunu ister.

**Önizlemeler**
**S15 karar paketi (kafa · senkron · çizim):** https://claude.ai/code/artifact/1cad1b62-df57-4ffb-b00b-32f0b9be9565
**S14 karakter turu (dokuz kare · vitrin · oyun içi):** https://claude.ai/code/artifact/e2034137-d5c6-4afb-9896-9bee43cd30c7
**S13 paketler (altı paket · altı hüküm):** https://claude.ai/code/artifact/dcbaaee3-8889-4665-83b2-feff02a60c13
**S12 arayüz (altı ekran önce/sonra):** https://claude.ai/code/artifact/a83eade2-32f6-4a64-ae34-6743a93922a3
**S11 arayüz dili:** https://claude.ai/code/artifact/f82648fa-18dd-4e21-a3a2-8f252efd2210
**Mor arayüz maketi:** https://claude.ai/code/artifact/6cc7a95e-c0a3-4802-8ea3-99398d637981
**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0
**İlerleme panosu:** https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a

## AÇIK KALEMLER (bilinen, bilerek duruyor)

### S8'den DEVREDEN (ölçüldü, bilerek yapılmadı)

- **Vitrinin ardındaki giriş holü artık GÖRÜNÜYOR ama vitrin için düzenlenmiş değil.** Şerit
  z 14,88…17,39; içindeki 10 dekor öğesi duvar diplerine dağılmış durumda. Kendi yerleşim turu.
- **Cephe temasının payı %100 → %45 düştü** (bilinerek, D-105).

### S7'den DEVREDEN (ölçüldü, bilerek yapılmadı)

- **WC odasının ORTASI hâlâ boş + TAVAN IŞIĞI yok** (`feedback_room_volume`). Zemin %2 görünür:
  dolgu zemine değil duvar kenarına/yüksekliğe gitmeli. Kendi turu.

- **S5'te söz verilip YAPILMAYAN:** ① banket masası `table_round_A_small`e geçecekti ② mağaza
  kartlarının gerçek oyun render'ı (`tools/tema-kapak.mjs` kadrajı bozuk). Kullanıcı 2026-09-10'da
  **kendi turunda kalsın** dedi; ikisi de ölçüm ister.
- **`tsc -b` kapanışa girmeli** — dört turdur elle yakalanıyor, kural olmadıkça yine kaçar.
- **Tente kapıyı tamamen örtüyor (F1, kullanıcı kararı).** Geri dönüş kolu F4 hazır ve ölçülü:
  dikey tabela 0,34 → 0,72, sınır üst kenar 1,97.
- **KayKit `bench` düz bir plaka gibi okunuyor** (0,36 br, sırtlıksız). Değişecekse başka paket
  ister — S13'ten sonra elde aday var: Holiday'in `chair_large_*` koltuğu (4 renk) ve `stool`ü.
- **WC ÇÖP KUTUSU elle çizim KESİN** — S13'te ÜÇÜNCÜ kez ölçüldü: **dokuz pakette** karşılığı yok
  (Prototype'ın `Can_A/B`si kola kutusu). Kalem artık "geçici" değil kapandı.
- **`npm run lint` 31 hata veriyor** (hepsi ESKİ `tools/olcum-*.ts`, kullanılmayan değişkenler).
- **G-01 çay/bulaşık toplama masanın her tarafından olmuyor · G-02 çay ocağından alma güvenilmez ·
  G-03 2. masa görevinde kamera kendiliğinden kayıyor** — üçü de HATA. (H1.)
- **G-06 tepsi ilk yükseltme 75 → ~50 · G-07 yükseltme dwell'i para-bağımsız sabit olsun** —
  ikisi de DENGE, varyant kapısına tabi, **ölçülmeden uygulanmaz** (Faz H'de H2 ile aynı turda).
- **Masalar geçilmiyor (ÖLÇÜLDÜ, uygulanmadı):** arka salonda açıklık **0,68 br**, geçiş 0,94
  ister → 20 masanın 12'si geçilemez. İki kol
  `docs/geribildirim-oyun-testi-2026-09-09.md` sonunda. (H3.)
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
