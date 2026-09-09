# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D6 ADIM 1/2** · Faz D 6/7 · 68/78)

```
SORU            : Plan §6 İtibar'a **"her seviye +%2 müşteri akışı, +%1 bahşiş"** yazdı — bu bir
                  DENGE sayısı ve hiç ölçülmedi. Ama B4 Kat 1'de throughput kolunun TÜKENDİĞİNİ
                  ölçmüştü (arz servis L6'da 0,78 fincan/sn, taşıma tavanı 1,25). Talep zaten
                  bağlayıcı değilse planın ödülü HİÇBİR ŞEY yapmaz. **İtibar hangi kanaldan
                  ödesin — ve ödemeleri hedeflerinkiyle ÖRTÜŞÜYOR mu (kanal mı, kapı mı)?**
ÖLÇÜLECEK KOLLAR: **t0** taban (XP sim'de türetilir, ödül YOK — seviye atlamaları zamanda nereye
                  düşüyor; ölçüm, kol değil) · **r1 talep** seviye başına +%N müşteri akışı
                  (PLANIN kolu) · **r2 gelir** seviye başına +%N müşteri başına ₺ (D-090 kalıbı)
                  · **r3 arz** seviye başına servis çıktısı (tavanın kendisine dokunan tek kol)
                  · **r4 kapı** tempoya sıfır dokunur, yalnız 💎 + kozmetik (doz 0 kıyas satırı)
                  · **r5 eğri** `levelGrowth` taranır — atlama YOĞUNLUĞU (D3'ün dersi: pencereyi
                  yoğunluk doldurur, büyüklük değil) · **ö1 örtüşme** seviye atlamaları ↔ hedef
                  ödemeleri aynı pencereye mi düşüyor · **g1** günlük görev 💎 arzı (D7'nin
                  15 💎'lik Usta fiyatına karşı; ₺'ye dokunmama varsayımı sınanır)
SAYILAR         : (adım 2'den sonra dolar → docs/itibar-raporu-d6.md §Bulgular)
KARAR           : (adım 3 — kullanıcı seçer)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Model sınırı, baştan yazılır:** XP sim'de HİÇ modellenmiyor. Araç onu sim durumundan TÜRETİR
(servis akışı × oyuncu/garson payı · görev · pad · yükseltme) — yani seviye eğrisi bir ölçüm
değil, ölçülmüş akışın üstüne kurulan bir türev. Günlük görevin geri dönüş (retention) değeri
sim'in ölçebileceği bir şey DEĞİL; 💎 arzı defter hesabıdır, tempo tablosuna girmez.

## SIRADAKİ TAM ADIM

**D6 adım 2 (ÖLÇ):** `tools/itibar-kollari.ts` + `tools/olcum-itibar.ts` → kısa koşuyla araç
doğrulanır (seviye atlıyor mu? kol etkili mi? taban birebir mi?) → tam koşu TABAN → sekiz kol
→ `docs/itibar-raporu-d6.md` §Bulgular → **commit #1 (karar bölümü BOŞ)**.
Sonra D7 (elmas harcaması + Usta katmanı) — **D7 geldiğinde D-089'un elmas hükmü bayatlar**
(bekçideki `h0` beklentisi bilerek o gün kırılacak şekilde yazıldı).

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **`getPlayerNavGrid`in oyunda tüketicisi YOK** — oyuncu joystick ile sürülüyor; bugün bekçili
  bir doğruluk, görünen bir davranış değil. İlk gerçek tüketici yol gösterme/oto-yürüme olacak.
- **Sim botunun yeni ızgaraya göçü** — denendi, ölçüldü, geri alındı (yukarıdaki ikinci ders).
  Kendi turunu ister: kalan sebep bulunmadı, üç tuzağın ölçülmüş sayıları raporda Bulgu 7'de.
- **Kalıcı çarpan GÖRÜNMEZ bir ödüldür** — panelde iki yerde yazılıyor, anlık tatmini 💎 taşıyor,
  ama oyuncu üzerindeki etkisi ölçülmedi (sim'in ölçebileceği bir şey değil). **Telefonda
  oynanınca yeniden okunacak.** (D-090'ın kabul edilen eksiği ③.)
- **Normal profil 41,2 dk beklemesi** — D-087'de bilerek ödenmedi; D4 43,4 → 41,2'ye çekti, 20 dk
  ölçütünün altına inmedi ve inmesi beklenmiyordu. Gözlem bandında görünür kalıyor.
- **Masa parasının payı 0,34 br** (D5 Bulgu 5) — 20 açıklıkta da aynı, yani yapısal: masa ayak izi
  büyürse ya da `money.pickupRadius` küçülürse ilk kırılacak yer burası.
- **Bekçi bandının çözünürlüğü** — `tests/hedefler.test.ts`'in zincir-bedeli bandı %3-5.
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; ÜÇ KOL tablosu
  20 masada `waiterTray: 3` varsayıyor — tempo kalemi DEĞİL, görev/HUD tutarlılığı.
- **`outputMultByLevel` yok** — servis çıktı çarpanı merdiven-geneli; `b1` erken oyuna dokunmadan
  denenemiyor.
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5) — model kalemi, bugün zarar vermiyor.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün üçüncü kez sessiz kaldı
  (D3 · D4 · D5 aynı gün); günlük kartı yine elle eklendi. Kural "sayaç arttıysa kart sayısı da
  artmalı" olmalı. **Araç kendi turunu ister** (üç turdur aynı elle-düzeltme).
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,49 MB (Faz F kod-bölme).
- C4'ten kalan ölçüm kusuru: B1 · oyuncu kipinde bot hiç yürümüyor — **D5'te sebebi bulundu ve
  nav DEĞİLMİŞ:** B1'de hiç servis yapılmıyor (terk %98,8), dolayısıyla kirli bardak da hiç
  doğmuyor; bot boşta bekliyor. Botun kendi turuna yazıldı.

**Bekleyen denge kararı yok** — D-091 denge dosyalarına dokunmadı.

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
