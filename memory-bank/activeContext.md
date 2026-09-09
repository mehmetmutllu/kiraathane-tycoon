# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D8 BİTTİ** · **Faz D 8/8 ✅** · 71/79)

```
SORU            : Usta ve günlük görevin MEKANİĞİ ve SAYISI vardı (D-093), ETKİLEŞİMİ yoktu.
                  Oyuncu 250 💎'ını nasıl harcayacak, günlük 10 💎'ı nasıl kazanacak?  [KAPANDI]
ÖLÇÜLECEK KOLLAR: YOK — denge sayısı değişmedi, varyant kapısı ürün kararına açılmadı.
SAYILAR         : gerekmedi · dayanak `docs/elmas-raporu-d7.md` §2, §5 (D7a'nın tam koşusu)
KARAR           : D-094 — ① Usta noktası = masanın MEVCUT yükseltme noktasının 💎 kimliği
                  (planın "yaklaşınca panel açılır"ı ELENDİ; onay alt bantta, dwell ile alım yok)
                  ② günlük görev = havuzdan gün-index'iyle deterministik 3 görev, eşik masaya
                  ölçekli, ödül TOPLAMDAN türetilir (3+3+4 = 10) ③ `tipMult` ×1,5'te KALDI
UYGULAMA        : `dailyQuests.ts` (YENİ) · `economy.config.ts` (yalnız görev TANIMLARI) ·
                  `save.ts` `daily` additive · `store.ts` türetici + `claimDailyQuest` +
                  `nearMaster` · `Scene.tsx` `TableMasterSpots` · `GroundMarker` `pip='gem'` ·
                  `HUD.tsx` `MasterBar` + BUGÜN kartları + Usta şeridi · kayıt sürümü ARTMADI (v32)
BEKÇİ           : tests/gunluk-gorev.test.ts — 22 test, **14 mutasyon, on dördü de yakalandı** ·
                  vitest 662 · duman **41/41** (32 → 41)
```

**Turun asıl dersi — BEKÇİ, KODDAN ÖNCE YAZILSAYDI BULUNAMAYACAK BİR HATA BULDU.** Gün dönümünün
sayaç tabanı çevrimdışı gelirden ÖNCE alınıyordu: gece kazanılan ₺ sabah açılışta o günün "kazan"
görevini bedavaya dolduruyor, yani D7a'da ÖLÇÜLEN 10 💎/gün arzı sessizce büyüyordu. Testin
yazıldığı sıra doğruydu (kod → bekçi), ama yakalayan şey testin *iddiası* oldu: "hiçbir görev
açılışta kendiliğinden toplanabilir olmamalı". Ölçülen sayıyı koruyan bekçiler, kodun ne yaptığını
değil **sayının ne kadar olması gerektiğini** yazmalı.

**İkinci ders — araç iki kez aynı yerden kırıldı ve sebebi dosyada değildi.** `npm run pano` CRLF
görünce "JSON bloğu bulunamadı" dedi. Bir önceki sefer dosya elle LF'e çevrilerek geçilmişti; bu
sefer görüldü ki depoda `core.autocrlf=true` açık, yani **her `git checkout` tuzağı yeniden
kuruyor**. Düzeltme dosyada değil araçta: okuma da yazma da satır sonundan bağımsız
(`tests/pano-guncelle.test.ts` CRLF koluyla kilitli).

## SIRADAKİ TAM ADIM

**Faz D BİTTİ (8/8).** Sıradaki iş, beş turdur açık duran ölçüm: **D-087'nin tempo penceresinin
yeniden okunması** — meta katman (Hedefler · çarpan · İtibar · Usta · günlük görev) 20 dk
ihlallerini doldurdu mu? Araç hazır (`tools/olcum-gec-oyun.ts` + `tools/denge-kollari.ts`), tek
tam koşu yeter. Aynı koşu D-092'nin borcunu da tartar (zincirden bilerek alınan %15,5).
Ardından **Faz E** (1/4): ses · hareketli onboarding · duman testinin `package.json`'a bağlanması.

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
- **D-087'nin tempo penceresi ARTIK OKUNABİLİR** — Faz D bitti, araç hazır. **Sıradaki iş bu.**
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

**Bekleyen denge kararı:** yok. Sıradaki tur ÖLÇÜM turudur (D-087 penceresi) — kolları o tur açar.

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
