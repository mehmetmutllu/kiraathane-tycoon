# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S9+S10 KAPANDI, D-106** · Faz S 9/13 · 84/97)

```
SORU            : (S9+S10) Ses hangi kaynaktan gelecek, UI hangi tasarım dilini konuşacak?
ÖLÇÜLECEK KOLLAR: ses S-A…S-D · UI palet/ekran modeli/pad · (tur içinde eklendi) alt gezinme paleti
SAYILAR         : docs/ui-ses-raporu-s9s10.md §Bulgular + §ALT GEZİNME
                  ham: docs/olcum-ui-ses.txt · docs/olcum-altnav.txt
KARAR           : D-106 — ses S-C (Kenney; coin = RPG Audio handleCoins) + seri ivmesi ·
                  ekran K3 tam ekran · mağaza içi M2 · pad Y2 · kit YOLU 2 (biçimi al,
                  dosyaları alma) · G-18 masanın kendi noktası vurgulanır ·
                  alt gezinme GEOMETRİSİ bugünküyle aynı (A/B/C elendi)
                  D-107 — arayüzün TAMAMI mor, 3B dünya sıcak kalır (palet + ölçek kilitli)
UYGULAMA        : YOK — S10 tanımı gereği kod yazmaz. Uygulama S11 (UI) + S9 (ses).
BEKÇİ           : (uygulama turunda)
```

## SIRADAKİ TAM ADIM

**PALET SEÇİLDİ — MOR (D-107).** Kullanıcı P3'ü seçmekle kalmadı, kapsamı büyüttü:
*"mor bayağı iyiymiş, direkt oyun temasını o kahverengiden mora çevirsek?"* →
**arayüzün TAMAMI mor, 3B dünya sıcak kalır.** Beş ekranın maketi onaylanmayı bekliyor:
https://claude.ai/code/artifact/6cc7a95e-c0a3-4802-8ea3-99398d637981

**Sıradaki tur = S11 (UI uygulaması).** Kapsamı D-106 + D-107 birlikte belirliyor:
- Palet ve ölçek `index.css`'e token olarak girer (D-107'deki dokuz renk + punto 6 basamak +
  gölge 3 kademe + yarıçap 3 kademe). **Sayı koda gömülmez, token olur.**
- `button{font-family:inherit}` — 13 öğe Arial'a düşüyor, biri görev şeridi (B5).
- 🔒 emoji → SVG; ✕ → ↺ ₺ metin glifleri de (17 adet, B6).
- Beş ekran **K3 tam ekran** + tek kabuk (geri · başlık · cüzdan); alt sayfa kabuğu kalkar.
- Mağaza **M2** düzeni · pad **Y2** · alt bar geometrisi AYNI, dili mor.
- Chip'siz üst şerit: değerler sahnenin üstünde, okunabilirliği **kontur** taşır.
- G-05 görev metinleri (altta net hedef, üstte kısa lakap).
**Bekçi:** ekran kabuğu + token sayısı testi, en az 2 mutasyonla.
**Denge dosyalarına DOKUNULMAZ** — G-06 (tepsi 75 → ~50) bu turun işi değil.

**S9** (ses dosyaları + seri ivmesi) ayrı tur; kaynak kararı yazılı, paketler indirildi ama
repoya GİRMEDİ — yalnız kullanılacak dosyalar künyesiyle girecek.

**Bu turun DIŞINDA bekleyen:** karakter kolu (S13, asset panosu §3) · H2 yükseltme sırası ·
H3 masa aralığı.

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0
**Paketten çıkanlar:** https://claude.ai/code/artifact/e2917b1e-64c9-4f9f-96e6-7d3ba5a719a9

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
