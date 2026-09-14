# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S17: SES ASSETLERİ · ÖLÇÜM TURU AÇIK** · Faz S 15/16 · 90/100)

```
SORU            : S9 kapanıyor — Kenney dosyaları repoya künyesiyle girsin; seri ivmesinin
                  PERDE BASAMAĞI ne olsun ve ortam uğultusu HANGİ kaynaktan gelsin?
ÖLÇÜLECEK KOLLAR:
  K — dosya mı sentez mi (ses ses, 9 olayın her biri için ayrı hüküm)
    K1 sentez kalsın (bugünkü)  |  K2 Kenney dosyası üstüne yazsın
    ölçü: dosyalar aynı 36-çift ayırt matrisine sokulur (`olcum-ses-ayirt`) + süre/RMS/tepe
    + dosya↔sentez yükseklik farkı (normalizasyon gerekiyor mu)
  İ — seri ivmesi (perde basamağı) · KAYNAKTAN BAĞIMSIZ, D-106'nın ikinci yarısı
    İ1 basamak yok (bugünkü)  |  İ2 +1 yarım ses, tavan 5  |  İ3 +2 yarım ses, tavan 8
    ölçü: tavana varma süresi · tavan perdesi · basamak JND · sıfırlama penceresi
  O — ortam uğultusu (`settings.music` bugün HİÇBİR ŞEYE bağlı değil, B9)
    O1 sentez uğultu (lisans yüzeyi 0)  |  O2 Kenney içinden döngülenebilir aday
    O3 tek-dosya CC0 istisnası (stil kilidi S-C'yi kırar mı)
    ölçü: Kenney envanterinde döngü adayı sayısı · maskeleme (ambient gain coin'i hangi
    seviyede bastırıyor) · döngü dikişi
SAYILAR         : (adım 2 — `docs/ses-raporu-s17.md` §Bulgular)
KARAR           : (adım 3 — kullanıcı seçer, D-0xx)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (adım 4 — manifest ↔ dosya ↔ katalog üçlüsü + seri ivmesi saf fonksiyonu)
```

**Turun girdiği yerde bilinen durum:** `public/assets/audio/` **YOK** (D-096 bilerek boş
bırakmıştı) · paketler indirilmişti ama repoya hiç girmedi ve bu makinede de yok → turun ilk
işi **yeniden indirme** (PowerShell) · `pour` **kalıcı boşluk**, hiçbir pakette akan sıvı yok,
sentezde kalıyor · Casino Audio D-106 ile **Kat 2'ye** ayrıldı, bu tura girmez.

## SIRADAKİ TAM ADIM

**Bu tur (S17) Faz S'in SON kalemi.** Bitince **Faz H** (H1 üç hata · H2 yükseltme sırası ·
H3 masa aralığı — son ikisi DENGE, varyant kapısına tabi).

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
