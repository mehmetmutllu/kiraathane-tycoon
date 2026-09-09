# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D5 BİTTİ** · Faz D 5/7 · 68/78)

```
SORU            : Oyuncunun YÜRÜDÜĞÜ dünya ile rotaların KURULDUĞU dünya aynı değil
                  (nav: `navSolids` + actorRadius 0,28, sandalyesiz · oyuncu: `activeSolids` +
                  playerRadius 0,47, sandalyeler katı). Nerede ve NE KADAR ısırıyor?     [KAPANDI]
ÖLÇÜLECEK KOLLAR: k1 ayrışma · k2 ulaşılabilirlik · k3 tuzak cep · k4 pay · **k5 rota
                  izlenebilirliği** (k5 ölçüm sırasında eklendi — asıl zararı o kol gösterdi)
SAYILAR         : docs/nav-oyuncu-raporu-d5.md §2 — 7 bulgu, tam koşu (20 açıklık), damgalar temiz
KARAR           : D-091 — `getPlayerNavGrid`; dünyaları birleştirmek elendi (personel masaya
                  erişmek zorunda, `REACH_TABLE` actorRadius'a çivili)
UYGULAMA        : `src/game/layout.ts` (+38 satır: activeSolids + playerRadius + alan kelepçesi,
                  `navCache` deseninde tek yuvalı önbellek) · ölçüm aracı da bu fonksiyonu ÇAĞIRIR
BEKÇİ           : tests/oyuncu-dunyasi.test.ts — 8 test, **8 mutasyon, sekizi de yakalandı**
                  (sandalye · yarıçap · kelepçe silme · kelepçe ters · önbellek anahtarı ×2 ·
                  doğrudan personel ızgarası · hücre boyu) · vitest 620
```

**Bu turun asıl dersi — ölçüm korkulan zararı ÇÜRÜTTÜ, başkasını buldu.** Beklenen zarar "içerik
oyuncuya kapalı kalmış olabilir"di; 20 açıklığın 20'sinde de ulaşılamayan nokta 0, cep 0. Zarar
ROTADA çıktı (%74,1) ve o kol (k5) tur kartında YOKTU — ölçerken eklendi. Yani kolları önceden
yazmak gerekli ama yeterli değil: ilk sayılar hangi kolun eksik olduğunu da söylüyor.

**İkinci ders — yarım geçiş bırakmamak.** Yeni ızgaranın tek doğal tüketicisi sim botuydu; göçü
denendi, üç gerçek tuzak ÖLÇÜLDÜ ve düzeltildi (bot katının içinde başlıyor · `×0,7` rota payı
oyuncunun dünyasında olanaksız · tetik yarıçapı ızgara yuvarlamasına yetmiyor), bot yine yürümedi
(B2 159,1 → 0,0 br/dk). Araç ölçülmüş hâline **geri alındı**: yarım geçiş bırakmak C4 raporunun
oyuncu-kipi sayılarını yeniden üretilemez kılardı.

## SIRADAKİ TAM ADIM

**Faz D — meta katman (5/7).** Sıradaki: **D6 İtibar (eski XP anlam kazanır) + günlük görevler.**
Ödül ekranı üç turdur hazır; günlük görevlerin ödülü D-090'ın kalıcı-çarpan kalıbına yaslanacak.
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
