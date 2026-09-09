# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D9 açıldı** · Faz D bitti (8/8) · ÖLÇÜM turu · 71/79)

```
SORU            : Meta katmanın DÖRT kanadı (hedef çarpanı · İtibar · Usta · günlük görev)
                  bugüne dek HEP AYRI AYRI ölçüldü — her tur ötekilerin kancasını KAPATTI.
                  Hepsi aynı anda açıkken, yani YÜRÜRLÜKTEKİ oyunda, D-087'nin 20 dk
                  penceresi ne? Ve D-092'nin bilerek ödediği %15,5 zincir borcu ne oldu?
ÖLÇÜLECEK KOLLAR: Yığın ablasyonu — 8 satır, hiçbiri config'e dokunmaz (dördü de KANCA):
                  M0   dört kanca KAPALI (D1 tabanı — ihlal 6 / 43,4 dk, kıyas noktası)
                  H    yalnız hedef çarpanı        (hUYGF · D-090)
                  R    yalnız İtibar taşıma çarpanı (rUYG  · D-092)
                  E    yalnız Usta + günlük görev   (eUYG  · D-093/094)
                  HR · HE · RE   ikili birleşimler (kaybın NEREDE olduğunu adresler)
                  HRE  ÜÇÜ BİRDEN = **yürürlükteki gerçek oyun** — bu satır hiç ölçülmedi
                  Okunan kolonlar: İdealize ihlal (HÜKÜM) · Normal ihlal (gözlem) · en uzun
                  bekleme · ŞERİT (zincir borcu) · açılışın üç ölçütü (D-079) · sapma
SAYILAR         : (adım 2'den sonra dolar → docs/meta-pencere-raporu-d9.md §Bulgular)
KARAR           : (adım 3 — kullanıcı seçer)
UYGULAMA        : (adım 4 — yalnız kararın kolu; bu tur ÖLÇÜM turudur, kol açılırsa açılır)
BEKÇİ           : (adım 4)
```

**Turun gerekçesi tek cümle:** D-090 Bulgu 10 "uygulanan hâl knob'ların toplamı çıkmadı"
dedi, D-093 aynı şeyi ÜÇÜNCÜ kez tekrarladı (`eUYG` %-1,6 · tek-knob satırları %-3,0).
Aynı hata bir kat yukarıda da duruyor olabilir: **katmanların toplamı da katmanların
toplamı olmayabilir.** Bu tur onu kapatır — beş turdur açık duran D-087 kalemi de burada.


## SIRADAKİ TAM ADIM

**Adım 2 — ÖLÇ.** `tools/olcum-meta-penceresi.ts` (YENİ): dört kancayı aynı koşuda açıp
kapatan ablasyon; kısa koşu ile araç doğrulanır (her kol izi kımıldattı mı, korunum 0 mı),
sonra `OLCUM=tam` TABAN + 8 satır → `docs/meta-pencere-raporu-d9.md` §Bulgular →
**commit #1 (KARAR BÖLÜMÜ BOŞ)**. Ardından adım 3: tek karar paketi.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- ~~Usta'nın uygulanan hâli beklenenden zayıf~~ → **D8'de KAPANDI (D-094):** kullanıcı ×1,5'te
  kalmayı seçti; ×2'nin ölçülmüş satırı (%-3,0 / 30,4 dk) reddedildi. Yürürlükte %-1,6 / 32,0 dk.
- **`getPlayerNavGrid`in oyunda tüketicisi YOK** — oyuncu joystick ile sürülüyor; bekçili bir
  doğruluk, görünen bir davranış değil. İlk gerçek tüketici yol gösterme/oto-yürüme olacak.
- **Sim botunun yeni ızgaraya göçü** — denendi, ölçüldü, geri alındı (D-091 ②). Kendi turunu
  ister: üç tuzağın ölçülmüş sayıları `nav-oyuncu-raporu-d5.md` Bulgu 7'de.
- **Kalıcı çarpan GÖRÜNMEZ bir ödüldür** (D-090 ③) ve **`carryMult` oyuncunun GENEL hızına
  biniyor** (D-092): ikisi de sim'in ölçemediği eksende — **telefonda oynanınca okunacak**
  (L13'te +%24 hız fazla mı çevik?).
- **Zincirin %7 eleme eşiği D-092'de BİLEREK aşıldı** (%-15,5) — emsal DEĞİL, sayısı yazılı
  istisna. **Kat 1 içeriği %15,5 hızlı tükeniyor**; Faz F öncesi yeniden okunmalı. D7a'nın
  Usta kolu aynı zincire dokunuyor: eleme eşiği bu turda yine %7 kabul edilir.
- **D-087'nin tempo penceresi BU TURDA ÖLÇÜLÜYOR** (D9) — sonuç §Bulgular'a düşecek.
- **Masa parasının payı 0,34 br** (D5 Bulgu 5) — yapısal: masa ayak izi büyürse ya da
  `money.pickupRadius` küçülürse ilk kırılacak yer burası.
- **Bekçi bandının çözünürlüğü** — `tests/hedefler.test.ts`'in zincir-bedeli bandı %3-5.
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; ÜÇ KOL tablosu
  20 masada `waiterTray: 3` varsayıyor. D7a'da İÇERİK kalemi oldu: personel merdiveni tavana
  varmadığı için o kanalın Usta hedefleri 12 saatte hiç açılmıyor.
- **`outputMultByLevel` yok** — servis çıktı çarpanı merdiven-geneli; `b1` erken oyuna
  dokunmadan denenemiyor. **D7a'nın Usta kolu bu eksiğin üstüne biniyor** (tavan üstü tek basamak).
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5) — model kalemi, bugün zarar vermiyor.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün iki oturum kapanınca
  sessiz kalıyor; kural "sayaç arttıysa kart sayısı da artmalı" olmalı. **Araç kendi turunu ister.**
- **`core.autocrlf=true` + `.gitattributes` YOK** — her `git checkout` metin dosyalarını CRLF'e
  çeviriyor. `pano-guncelle.mjs` D8'de satır sonundan bağımsız hâle getirildi (bekçili), ama
  başka bir araç aynı tuzağa düşebilir. Kalıcı çözüm bir `.gitattributes` — kendi turunu ister.
- **Tam takım koşusunda `tests/kuyruk.test.ts` ara sıra 30 sn zaman aşımına düşüyor** (tek başına
  4,6 sn · üç ardışık koşuda temiz). Yük altında paralel çakışma; ölçüm sonucunu etkilemiyor.
- **Usta olmuş masanın DÜNYADA görünen bir işareti yok** — alım sonrası nokta kalkıyor, masa
  aynı kalıyor. Rozet/malzeme farkı Faz 6 sanat işi (`feedback_upgrade_legibility`).
- **"İzle ve Usta yap" + "İzle, 2× al" butonları PASİF** — yer tutuyor, reklam SDK'sı Faz 5.
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,49 MB (Faz F kod-bölme).
- C4'ten kalan ölçüm kusuru: B1 · oyuncu kipinde bot hiç yürümüyor — sebebi D5'te bulundu
  (B1'de hiç servis yok → kirli bardak doğmuyor → bot boşta). Botun kendi turuna yazıldı.

**Bekleyen denge kararı:** yok — bu tur ÖLÇÜM turu; kol açılacaksa karar paketinden çıkar.

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
