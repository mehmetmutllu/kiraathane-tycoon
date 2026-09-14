# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S14 BİTTİ: PERSONEL SKINNED'E GEÇTİ, D-112** · Faz S 13/15 · 88/99)

```
SORU            : Beş karakter gövdesi hangi kaynaktan gelir, skinned'in KOD bedeli ne?
ÖLÇÜLECEK KOLLAR: A KayKit · A2 diğer ücretsiz KayKit paketleri · D Quaternius · F ilkel kalsın ·
                  B/C/E ücretli (fiyat satırı) · KOD BEDELİ personel ↔ müşteri ayrı
SAYILAR         : docs/karakter-raporu-s14.md · ham docs/olcum-karakter.json · olcum-skin-perf.txt
                  12 ücretsiz gövde, 11'i TEK rig (Rig_Medium, 23 kemik) · 259-529 KB · doku gömülü
                  ekipman AYRI düğüm (Rogue'da 1 düğüm/84 üçgen) · klipler 69/69 iz → retarget YOK
                  139 klip ücretsiz, Sit_Chair_* dahil · baş boyun %50'si (bugünkü gövdede %33)
                  omuz 0,58 ↔ kapsül 0,60 (blob sınırı aşılmıyor)
                  perf: 24 skinned = 192 çizim / 2,2 ms · instanced kapsül 1 çizim / 0,05 ms
                  Quaternius: 2 gövde (6 değil) · kıyafet paketi FANTASY · doku 80 MB
KARAR           : D-112 — kadro Adventurer gövdelerinden, palete boyalı, BAŞ boyanmaz.
                  Ölçek Ö1 (toplam 1,75 — türeyen hiçbir sayı kıpırdamadı). 6 gövde + 4 klip
                  (+5,9 MB → 23,1). Tur İKİYE bölündü: personel bu tur, müşteriler S15.
UYGULAMA        : KayActor.tsx (yeni) · actor.ts kaydı · Model.tsx SkeletonUtils · Player ·
                  Waiter · Dishwasher · Scene.KitchenHand · manifest künyesi
BEKÇİ           : tests/karakter.test.ts — 11 denetim, **15 mutasyonla** doğrulandı, kaçan 0
                  (ilk turda 2 kaçtı: kural İKİ yerde yazılıydı + klon denetimi dizgeye bakıyordu)
                  vitest 943 ✓ · duman 42/42 ✓ · tsc -b ✓
```

## SIRADAKİ TAM ADIM

**S15 — müşteriler skinned'e geçer** (tur kartında `S14b`). Kullanıcı "hepsinde skinned çok iyi
olur" dedi; bedel ölçülü ve kol hazır:
- Bugün `Customers.tsx` **tek InstancedMesh** (NPC_CAP 128 → 1 çizim çağrısı).
- Skinned'de karakter başına **8 çizim** (gövde 8 parça mesh) → 24 müşteri = **192**; mobil bütçe
  tipik 100-200. **Azaltma kolu ölçüldü ama denenmedi:** her gövdenin TEK materyali var, parçalar
  birleştirilebilir → karakter başına 1 çizim, 24 müşteri = 24.
- `Sit_Chair_Down/Idle/StandUp` klipleri repoda: bugünkü `SEATED_DROP` numarası (gövdeyi 0,45
  aşağı indirme) gerçek oturuş poziyle değişebilir. Montaj kaldırması ölçüldü (§B10).
- Gömlek rengi müşteri başına palet renginden seçilecek (`feedback_color_variety`).

Ardından **S9 ses** (kaynak kararı yazılı, D-106 · S-C), sonra **Faz H** (H1 üç hata · H2
yükseltme sırası · H3 masa aralığı — son ikisi DENGE, varyant kapısına tabi).

### S14'ten DEVREDEN (ölçüldü/görüldü, bilerek yapılmadı)

- **Karakter paneli hâlâ ESKİ ilkel gövdeyi gösteriyor** (`Player.tsx`'in `OwnerBody`'si export
  olarak duruyor ve `CharacterPanel` onu çiziyor). Oyunda sahip artık KayKit gövdesi — panel ile
  sahne ayrıştı. Kendi turu (panelin mini Canvas'ı skinned gövdeyi ve klibi taşımalı).
- **Önlük düz bir plaka** — göğse asılı bir dikdörtgen; gövdeyi sarmıyor. Oyun kamerasından
  okunuyor ama yakın kadrajda plaka gibi duruyor. Cila kalemi.
- **Rogue_Hooded'ın yeşil kapüşonu ekipman süzgecine takılmıyor** (mesh adı `_Cape`/`_Mask`
  değil). O gövde şu an hiçbir role atanmadı; müşteri turunda kullanılacaksa süzgeç genişler.
- **Klip dosyaları mankenin gövdesini de taşıyor** (dosya başına 6.916 üçgen ölü yük, 4 dosya).
  Yüklenirken sahneye eklenmiyor ama ayrıştırılıyor. Mesh'i atan bir araç ≈ 0,5-1,5 MB kazandırır.

**Önizlemeler**
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
