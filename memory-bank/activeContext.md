# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D6 BİTTİ** · Faz D 6/7 · 69/78)

```
SORU            : Plan §6 İtibar'a "her seviye +%2 müşteri akışı, +%1 bahşiş" yazdı — iki denge
                  sayısı, ikisi de hiç ölçülmedi. İtibar hangi KANALDAN ödesin?         [KAPANDI]
ÖLÇÜLECEK KOLLAR: t0 taban · r1 talep · r2 gelir · r3 arz · r4 kapı · r5 eğri · ö1 örtüşme ·
                  **r6 taşıma** (tur kartında YOKTU — darboğaz dağılımı okununca eklendi) ·
                  rUYG uygulanan config · g1 günlük görev (ölçülmedi, defter)
SAYILAR         : docs/itibar-raporu-d6.md §2 — 10 bulgu, tam koşu 2 dk 45 sn, damgalar temiz
KARAR           : D-092 — `xp.carryBonusPerLevel: 0.02`; talep ve arz kolları ölçümle elendi,
                  gelir kolu AÇILIŞ ölçütünden elendi, eğri (×1,5) korundu
UYGULAMA        : `economy.config.ts` (+1 sayı) · `tick.ts` `carryMult` (`incomeMult` deseni,
                  kayıtta alan yok) · oyuncu + garson hareket hızı · toast ve HUD bonusu yazıyor
BEKÇİ           : tests/itibar.test.ts — 8 test, **8 mutasyon, sekizi de yakalandı** ·
                  vitest 628 · duman 32/32 · kayıt sürümü ARTMADI (v32)
```

**Turun asıl dersi — tempo tablosu ELER, SEÇMEZ (D-090 Bulgu 13'ün tekrarı).** Gelir ve taşıma
kolları %5'e kadar ayırt edilemedi (fark ≤ 0,2 puan). Seçimi tablo değil **açılış ölçütü** verdi:
taşıma kolu D-079'un üçüne de hiçbir dozda dokunmuyor. İkinci gerekçe sim'in hiç ölçemediği
eksende: gelir kolu D-090'ın çarpanıyla aynı GÖRÜNMEZ kanalda birikirdi.

**İkinci ders — bekçi FORMÜLÜ değil KAREYİ koşturmalı.** İlk hâli garson satırında
`waiterSpeedFor(0) * carryMult` doğruluyordu; `tick.ts`ten çarpan silinse yeşil kalıyordu — yani
dosyanın var olma sebebini (D-090'ın dersi) ıskalıyordu. Mutasyon M1 bunu yakaladı.

## SIRADAKİ TAM ADIM

**Faz D — meta katman (6/7).** Sıradaki ve son kalem: **D7 — elmas kaynak/harcama + Usta katmanı
+ GÜNLÜK GÖREVLER.** Üçü tek turda: 💎 arzı (günlük görev ≈6/gün, hedefler 250) ile harcaması
(Usta 15 💎, kozmetik 30-60 💎) birbirini belirliyor, ayrı ölçülemez. **D7 geldiğinde D-089'un
elmas hükmü bayatlar** (`tests/hedefler.test.ts`teki `h0` beklentisi bilerek o gün kırılacak
şekilde yazıldı). Faz D bitince D-087'nin tempo penceresi yeniden okunacak (araç hazır).

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **`getPlayerNavGrid`in oyunda tüketicisi YOK** — oyuncu joystick ile sürülüyor; bugün bekçili
  bir doğruluk, görünen bir davranış değil. İlk gerçek tüketici yol gösterme/oto-yürüme olacak.
- **Sim botunun yeni ızgaraya göçü** — denendi, ölçüldü, geri alındı (D-091 ②). Kendi turunu
  ister: kalan sebep bulunmadı, üç tuzağın ölçülmüş sayıları `nav-oyuncu-raporu-d5.md` Bulgu 7'de.
- **Kalıcı çarpan GÖRÜNMEZ bir ödüldür** — panelde iki yerde yazılıyor, anlık tatmini 💎 taşıyor,
  ama oyuncu üzerindeki etkisi ölçülmedi (sim'in ölçebileceği bir şey değil). **Telefonda
  oynanınca yeniden okunacak.** (D-090'ın kabul edilen eksiği ③.)
- **Zincirin %7 eleme eşiği D-092'de BİLEREK aşıldı** (%-15,5). Karşılığında 41,2 dk kalemi
  ödendi (→ 33,8 dk, hüküm 1 → 0). Emsal DEĞİL, sayısı yazılı istisna: sonraki turlar eşiği
  yeniden %7 kabul eder. **Kat 1 içeriği %15,5 hızlı tükeniyor** — Faz F öncesi yeniden okunmalı.
- **`carryMult` oyuncunun GENEL hızına biniyor** — ölçülen kol taşıma debisiydi, ama oyuncu
  aynı hızla para da topluyor, mekânda da geziyor. Sim bunu ayırmıyor; L13'te +%24 hız
  **telefonda oynanınca his olarak okunmalı** (fazla mı çevik?).
- **Masa parasının payı 0,34 br** (D5 Bulgu 5) — 20 açıklıkta da aynı, yani yapısal: masa ayak izi
  büyürse ya da `money.pickupRadius` küçülürse ilk kırılacak yer burası.
- **Bekçi bandının çözünürlüğü** — `tests/hedefler.test.ts`'in zincir-bedeli bandı %3-5.
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; ÜÇ KOL tablosu
  20 masada `waiterTray: 3` varsayıyor — tempo kalemi DEĞİL, görev/HUD tutarlılığı.
- **Günlük görevler D7'ye taşındı** (D-092): 💎 harcama tarafı yazılmadan arz tarafı çivilenemez.
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

**Bekleyen denge kararı yok** — D-092'nin tek sayısı (`xp.carryBonusPerLevel: 0.02`) ölçüldü,
seçildi, çivilendi ve uygulanan hâli `rUYG` koluyla ayrıca doğrulandı.

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
