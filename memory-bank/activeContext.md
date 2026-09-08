# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **D1 BİTTİ** · Faz D 1/5 · 64/76)

```
SORU            : Geç-oyun eğrisi 20 dk ölçütünü Normal'de 6 kez aşıyor — ölçüt mü bayat,
                  eğri mi pahalı, düzeltilecekse hangi kaldıraçtan?   [KAPANDI]
ÖLÇÜLECEK KOLLAR: m1 · f1 · f2 · f3 · f4 · g1 · g2 · b1 · c1 · o1  (dokuz kol + ölçüt kolu)
SAYILAR         : docs/gec-oyun-raporu-d1.md §Bulgular · ham docs/olcum-gec-oyun.txt
KARAR           : D-087 — o1 ALINDI (ölçütün PROFİLİ sabitlendi); dokuz kolun tamamı elendi
UYGULAMA        : simulate.ts ölçüt sabitleri + 4. ölçüt hükümlü + üç-profil GÖZLEM BANDI
                  economy.config.ts DEĞİŞMEDİ (iki commit'te de 0 satır)
BEKÇİ           : tests/tempo-olcutu.test.ts — 15 test, DÖRT mutasyonla doğrulandı
```

Ölçütün profili hiç yazılmamıştı: kardeş üç ölçüt İdealize'de okunuyor, bu dördüncüsü
Normal'de. Aynı eğri **İdealize 1 · Yoğun 1 · Normal 6 · Rahat 11**. Kardeşlerinin profilinde
ölçüt bugün de geçiyor (23,9 dk → `servis L6`, D-078'in bilerek bıraktığı).

Düzeltici kolların hepsi Kat 1 içeriğinden **%7-42** götürüyordu (8,48 sa → 7,90 / 7,04 / …).
`g1` (taşıma tavanı) ihlali **artırdı** · `m1` **atıl** çıktı · `f1`/`f2`/`b1` tabana takıldı ·
`f3`'ü `f4` domine etti. **Kabul edilen risk:** Normal oyuncu 6. saatte 43,4 dk bekliyor.

## SIRADAKİ TAM ADIM

**Faz D — meta katman (1/5).** Sıradaki kalem seçilmeli; iki güçlü aday, ikisi de bu turda
gerekçelendi: ① **görev kimlikleri** (`questIndex: number` → `questId: string` + migrasyon) —
plan "bu düzeltilmeden meta katmana başlamak borcu ikiye katlar" diyor, ve D1 ölçtü ki sim'de
tempoyu belirleyen şey **görev hattının kendisi** · ② **nav ızgarası ↔ oyuncu çarpışması**
(`actorRadius` sandalyesiz, `playerRadius` sandalyeler katı).

**Faz D bitince yeniden okunacak ölçüm:** meta katman geç-oyun bekleme pencerelerini gerçekten
dolduruyor mu — `tools/olcum-gec-oyun.ts` hazır, elenen kolların kodu duruyor.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **Normal profil 43,4 dk beklemesi** — D-087'de bilerek ödenmedi, gözlem bandında görünür.
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; oysa ÜÇ KOL
  tablosu 20 masada `waiterTray: 3` varsayıyor — tempo kalemi DEĞİL, görev/HUD tutarlılığı.
- **`outputMultByLevel` yok** — servis çıktı çarpanı merdiven-geneli; `b1` erken oyuna
  dokunmadan denenemiyor.
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5) — model kalemi, bugün zarar vermiyor.
- **Nav ızgarası ↔ oyuncu çarpışması** — Faz D.
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,17 MB (Faz F kod-bölme).
- C4'ten kalan ölçüm kusuru: B1 · oyuncu kipinde bot hiç yürümüyor (karar etkilenmedi).

**Bekleyen denge kararı YOK.**

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
