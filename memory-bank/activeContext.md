# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S12 BİTTİ: EKRANLAR TEK TAM-EKRAN KABUKTA, D-110** · Faz S 11/14 · 86/98)

```
SORU            : D-106'nın YAPI kararları (K3 · M2 · Y2 · chip'siz şerit · G-05 · G-18) koda
                  nasıl girer — S11'in mor DİLİNE ve denge sayılarına dokunmadan?
ÖLÇÜLECEK KOLLAR: YOK — kararlar yazılıydı; açık tek kol T2 kullanıcı tarafından seçildi.
SAYILAR         : docs/ui-ses-raporu-s9s10.md §S12 · ham docs/olcum-ui-ekran.json
                  kabuk 5/5 alt sayfa → 5/5 TAM EKRAN · farklı yükseklik 4 → 1 (844) ·
                  ekran payı %51,1…%80,0 → %100 · çıkış "✕+arka" → tek jest: geri ·
                  mağaza vitrini 150 → 230 px taban (~460 gerçek) · satın alma 3 → 1 düğme ·
                  AA altı 12/177 → 0/184 · yarıçap dizgesi 6 → 5
                  KORUNDU: punto 5 · gölge 3 · font 2 · glif 13 · krom %23,2
KARAR           : D-110 — T2 uygulandı (renk değil ZEMİN değişti). Karar dışına üç çıkış,
                  hepsi yazılı: cüzdan kabuğa girdi · "Tamam" düğmeleri kalktı ·
                  salon seçimi satın alma olmaktan çıktı.
UYGULAMA        : Sheet.tsx K3 kabuğu · hud.css + index.css · ShopPanel M2 · 50 göreve lakap ·
                  Scene.tsx masa noktası "SV n" · smoke + shot araçları geri düğmesine geçti
BEKÇİ           : tests/ekran-kabugu.test.ts — 8 denetim, **8 mutasyonla** doğrulandı
                  vitest 924 ✓ · duman 42/42 ✓ · tsc -b ✓ · tam koşu ölçümü ✓
```

## SIRADAKİ TAM ADIM

**S13 — yeni ücretsiz KayKit paketleri.** Arayüz kalemi bitti (S10 maket → S11 dil → S12 yapı);
Faz S'de kalan üç kalem sahne işi:
- **S13** Board Game Bits (okey/tavla) · Forest Nature (çiçek) · Holiday · Resource · Prototype ·
  Block. İndirme engeli kalktı: `tools/indir-itch.ps1` itch akışının 3/4 adımını yapıyor,
  son adım 404 (`project_network_powershell`).
- **S14 karakterler** — ana karakter · garson · bulaşıkçı · müşteriler. Altı kol bedeliyle asset
  panosunda; **kullanıcı seçimi bekliyor, seçilmeden tur açılamaz.**
- **S9 ses** (dosyalar + seri ivmesi) ayrı tur; kaynak kararı yazılı (D-106 · S-C), paketler
  indirildi ama repoya GİRMEDİ — yalnız kullanılacak dosyalar künyesiyle girecek.

Ardından **Faz H** (H1 üç hata · H2 yükseltme sırası · H3 masa aralığı). H2 ve H3 DENGE
kalemleri — varyant kapısına tabi, ölçülmeden uygulanmaz.

### S12'den DEVREDEN (ölçüldü/görüldü, bilerek yapılmadı)

- **Karakter ekranı tam ekranda altta boş kalıyor** — tek karakter varken doldurulacak içerik yok.
  Mağaza vitrini boşluğu yutuyor, Görevler/Hedefler zaten doluyor. Bu bir İÇERİK kalemi (S14),
  yerleşim kalemi değil.
- **`DEV` rozeti K3'ün üstüne biniyor** (`devSandbox.css` z-index). Yalnız `npm run dev`'de çizilir,
  oyuncuya gitmez; bekçinin kapsamı dışında bırakıldı.

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0
**Paketten çıkanlar:** https://claude.ai/code/artifact/e2917b1e-64c9-4f9f-96e6-7d3ba5a719a9
**Mor arayüz maketi:** https://claude.ai/code/artifact/6cc7a95e-c0a3-4802-8ea3-99398d637981
**S11 önizlemesi:** https://claude.ai/code/artifact/f82648fa-18dd-4e21-a3a2-8f252efd2210

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
