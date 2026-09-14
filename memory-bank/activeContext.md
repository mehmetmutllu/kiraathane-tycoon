# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S13 BİTTİ: ALTI PAKET İNDİ, KOL B REPOYA GİRDİ, D-111** · Faz S 12/14 · 87/98)

```
SORU            : Altı ücretsiz KayKit paketi indirilebilir mi, içlerinde ne var, repoya NE girer?
ÖLÇÜLECEK KOLLAR: A hepsi TAM · B yalnız eşleşen modeller (ikisi de MB).
SAYILAR         : docs/yeni-paketler-raporu-s13.md · ham docs/olcum-yeni-paketler.json
                  indirme engeli KALKTI · 6/6 paket · 72,4 MB zip · 553 model · hepsi CC0
                  models/ 5,9 MB → kol A 27,2 (×4,6) · kol B 8,4 · SEÇİLEN 17,2 (B + board-game tam)
                  panonun 6 görevinden 3'ü ÇÜRÜDÜ · çöp kutusu 9 pakette yok · Forest'ta çiçek yok
                  kapı: ayak izi birebir · gövde 0,200 (kutuyu şişiren tokmak) · üçgen 188→296
KARAR           : D-111 — kol B + board-game istisnası; Block girmedi. Uygulama: paketler + kapı.
UYGULAMA        : models/ budandı · public/assets/README.md manifesti · wcLook KABIN_NATIVE ·
                  maketParts KAY_PROTO/Door_A · atlas-renk.mjs beş yeni dokuyu tanıyor
BEKÇİ           : tests/yeni-paketler.test.ts — 8 denetim + wc-odasi'nin 4 denetimi,
                  **11 mutasyonla** doğrulandı, kaçan 0
                  vitest 932 ✓ · duman 42/42 ✓ · tsc -b ✓
```

## SIRADAKİ TAM ADIM

**S14 — karakterler.** Faz S'de iki kalem kaldı:
- **S14 karakterler** — ana karakter · garson · bulaşıkçı · müşteriler. Altı kol bedeliyle asset
  panosunda; **kullanıcı seçimi bekliyor, seçilmeden tur açılamaz.**
- **S9 ses** (dosyalar + seri ivmesi) ayrı tur; kaynak kararı yazılı (D-106 · S-C), paketler
  indirildi ama repoya GİRMEDİ — yalnız kullanılacak dosyalar künyesiyle girecek.
  **İndirme artık engel değil:** `pwsh tools/indir-itch.ps1 -Sayfa <adres> -Hedef <klasör>`
  dört adımın dördünü de yapıyor (S13'te düzeltildi).

Ardından **Faz H** (H1 üç hata · H2 yükseltme sırası · H3 masa aralığı). H2 ve H3 DENGE
kalemleri — varyant kapısına tabi, ölçülmeden uygulanmaz.

### S13'ten DEVREDEN (ölçüldü, bilerek yapılmadı)

- **Yeni WC kapısı YEŞİLİ götürüp KAHVE getiriyor** — D-104'te kullanıcı `door_A`yı seçerken
  gerekçesi *"WC tek bir kahve kütle, yeşil onu kırıyor"* idi (`feedback_color_variety`).
  Ölçüldü: yeni kapı `[0,2] #828c91` gri ×194 (lavabo/aynanın AYNI gözü) + `[0,6] #995842`
  kahve ×212 — yani **gri kaldı, giden yeşil.** Kodla kapatmak `KABIN_GOZ`e bir göz çifti
  yazmak ama o D-099'u (atlas boyanmaz, renk TEMA kalemidir) deler → **kendi turu.**
- **Repoya giren 117 modelin 114'ü sahneye GİRMEDİ** — koltuk ×4 renk · puf ×4 · tabure · halı ·
  fener · tabak · çalı/çim/ağaç · kereste/palet/tuğla/kumaş yığını · board-game'in 162 modeli.
  Her biri kendi yerleşim turunu ister; repoda duruyorlar ve manifestte künyeleri var.
- **Çiçek hâlâ yok** (Forest'ın ücretsiz katmanında yok, olan her şey tek yeşil `_Color1`).
  İstenirse ya ücretli katman ya başka CC0 kaynak — kullanıcı kararı.

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
**S12 önizlemesi (altı ekran önce/sonra + M2 + sayılar):** https://claude.ai/code/artifact/a83eade2-32f6-4a64-ae34-6743a93922a3
**S13 ölçüm önizlemesi (altı paket · altı hüküm · bedel kolları):** https://claude.ai/code/artifact/dcbaaee3-8889-4665-83b2-feff02a60c13

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
