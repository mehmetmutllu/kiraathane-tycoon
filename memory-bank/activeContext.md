# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D5 AÇILDI** · nav ızgarası ↔ oyuncu çarpışması · Faz D 4/6 · 67/77)

```
SORU            : Oyuncunun YÜRÜDÜĞÜ dünya ile rotaların KURULDUĞU dünya aynı değil
                  (nav: `navSolids` + actorRadius 0,28, sandalyesiz · oyuncu: `activeSolids` +
                  playerRadius 0,47, sandalyeler katı). Bu fark nerede ve NE KADAR ısırıyor?
ÖLÇÜLECEK KOLLAR: ölçüm turu (denge kolu YOK — economy.config/tick/rules'a dokunulmuyor):
                  k1 ayrışma (personele açık, oyuncuya kapalı hücre oranı, her açıklık için) ·
                  k2 ulaşılabilirlik (her etkileşim noktası oyuncunun dünyasında erişilebilir mi) ·
                  k3 tuzak cepler (oyuncu dünyasının bağlı bileşenleri) ·
                  k4 pay (en dar geçidin oyuncuya kalan payı)
SAYILAR         : (adım 2'den sonra dolar — docs/nav-oyuncu-raporu-d5.md §Bulgular)
KARAR           : (adım 3)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Bu tur neden şimdi:** hata tek başına duruyor ve iki yerde ısırdığı BİLİNİYOR ama hiç ölçülmedi
— (a) C4'ün ölçüm aracı bu yüzden ±30/60/90° kayma + kara liste + kurtulma yamalarıyla dolu
(`tools/olcum-bardak.ts` §rota), (b) P2 damgaları "B1 · oyuncu kipinde bot hiç yürümüyor"
kusurunu buldu ve açık bıraktı. İkisi de aynı kökü işaret ediyor: **oyuncunun dünyasının rota
planlayıcısı yok.** Denge dosyalarına dokunulmadığı için varyant kapısı devrede değil; ölç-önce
disiplini yine de uygulanıyor (iki commit).


## SIRADAKİ TAM ADIM

**Faz D — meta katman (4/6).** Aday sırası: ① **D5 İtibar + günlük görevler** (ödül ekranı hazır;
günlük görevlerin ödülü D-090'ın kalıbına yaslanacak) · ② **nav ızgarası ↔ oyuncu çarpışması**
(bilinen hata, tek başına duruyor) · ③ D6 elmas harcaması + Usta katmanı — **D6 geldiğinde
D-089'un elmas hükmü bayatlar** (bekçideki `h0` beklentisi bilerek o gün kırılacak şekilde yazıldı).

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **Kalıcı çarpan GÖRÜNMEZ bir ödüldür** — cebe uçan sayı yok. Panelde iki yerde yazılıyor
  (kademe payı +%0,4 · kümülatif "koleksiyon bonusu") ve anlık tatmini 💎 taşıyor, ama bunun
  oyuncu üzerindeki etkisi **ölçülmedi**: sim'in ölçebileceği bir şey değil. **Telefonda oynanınca
  yeniden okunacak.** (D-090'ın kabul edilen eksiği ③.)
- **Normal profil 41,2 dk beklemesi** — D-087'de bilerek ödenmedi. D3 hiç kısaltamamıştı; D4
  43,4 → 41,2'ye çekti ama 20 dk ölçütünün altına inmedi ve inmesi beklenmiyordu (kapatmak
  `hF` %35+ ister, bedeli %-12,6). Gözlem bandında görünür kalıyor.
- **Bekçi bandının çözünürlüğü** — `tests/hedefler.test.ts`'in zincir-bedeli bandı %3-5. Bandı
  daraltmak sim'in her küçük değişiminde testi kırardı; daha incesi için ölçüm aracı koşulur
  (`OLCUM=tam npx tsx tools/olcum-hedefler.ts`).
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; oysa ÜÇ KOL
  tablosu 20 masada `waiterTray: 3` varsayıyor — tempo kalemi DEĞİL, görev/HUD tutarlılığı.
- **`outputMultByLevel` yok** — servis çıktı çarpanı merdiven-geneli; `b1` erken oyuna
  dokunmadan denenemiyor.
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5) — model kalemi, bugün zarar vermiyor.
- **Nav ızgarası ↔ oyuncu çarpışması** — Faz D (D5'ten sonraki aday).
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün iki oturum kapanınca
  sessiz kalıyor. Bu turda yine sessiz kaldı (D3 ile aynı gün); günlük kartı elle eklendi.
  Kural "sayaç arttıysa kart sayısı da artmalı" olmalı. Araç kendi turunu ister.
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,49 MB (Faz F kod-bölme).
- C4'ten kalan ölçüm kusuru: B1 · oyuncu kipinde bot hiç yürümüyor (karar etkilenmedi).

**Bekleyen denge kararı yok** — D-090 hedef ödülünün kalıbını kapattı.

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
