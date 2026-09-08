# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **D2 BİTTİ** · Faz D 2/5 · 65/76)

```
SORU            : Görev hattının kimliği sıra numarası; hatta ekleme yapılınca kayıt sessizce
                  BAŞKA bir görevi gösteriyor. Kimlik nasıl kalıcı hâle gelir?   [KAPANDI]
ÖLÇÜLECEK KOLLAR: (yok — denge kalemi DEĞİL; üç tasarım kolu kod yazılmadan tartışıldı)
SAYILAR         : (yok — bu tur ölçüm turu değil)
KARAR           : D-088 — kayıtta YALNIZ `questsDone`; aktif görev türetilir, ilerleme geriye
                  gitmez. Kullanıcı "en kalitelisi ne ise o olsun" dedi, kol seçimi bana bırakıldı.
UYGULAMA        : `questProgress.ts` (yeni) · `save.ts` v32 + gerçek göç · `store.ts` türetme
                  `rules.ts`/`tick.ts` DEĞİŞMEDİ · `economy.config.ts` yalnız SAVE_VERSION'ı KAYBETTİ
BEKÇİ           : tests/gorev-kimligi.test.ts — 17 test, BEŞ mutasyonla doğrulandı
```

Görev tanımlarının `id`si zaten vardı; eksik olan tek şey **kaydın** onu değil index'i saklamasıydı.
Artık index çalışma zamanının kodlaması, kimlik listesi deponun kodlaması — ikisi aynı anda
saklanmıyor (`padsDone` deseni). Uçtan uca tarayıcıda doğrulandı: ekilen gerçek bir v31 kaydı
(12. görev · 7.500 ₺ · 3 pad) göç etti, HUD *"4. Masayı aç"* dedi, oyun kaydı **v32** olarak geri
yazdı. vitest **584** · duman **28/28** · **denge sayısı değişmedi.**

**SIRA KİLİDİ UYARISI kayda geçirildi (D-088):** tur `economy.config.ts`'e dokunuyor — ama
dokunduğu tek şey SAVE_VERSION'ın **silinmesi**. Yanlış-pozitif, ve bu onun **son** görülüşü:
sürüm artık `save.ts`'te, gelecek kayıt sürümleri kapıyı tetiklemeyecek. Araç değiştirilmedi.

## SIRADAKİ TAM ADIM

**Faz D — meta katman (2/5).** Sıradaki kalem seçilmeli. Aday sırası: ① **D3 Hedefler
(koleksiyon) + ortak ödül ekranı** — `questsDone` artık hazır, bu ekranın istediği liste ta kendisi
· ② **nav ızgarası ↔ oyuncu çarpışması** (bilinen hata, tek başına duruyor) · ③ D4 İtibar +
günlük görevler.

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
- **Nav ızgarası ↔ oyuncu çarpışması** — Faz D (D2'den sonraki aday).
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün iki oturum kapanınca
  sessiz kalıyor. C5 ve D1'in anlatısı bu yüzden iki tur yayınlanmadı (2026-09-08'de düzeltildi,
  araç değişmedi). Kural "sayaç arttıysa kart sayısı da artmalı" olmalı.
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
