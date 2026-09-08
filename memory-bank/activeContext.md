# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D3b ölçüm** · Faz D · hedef ödülünün KALIBI)

```
SORU            : Hedef (koleksiyon) ödülü hangi KALIPTA olmalı? Sabit ₺ merdiveni (bugünkü hâl)
                  sektörün terk ettiği kalıp; kalıcı çarpan ve gelire-oranlı ₺ ölçülmedi.
ÖLÇÜLECEK KOLLAR: hUYG (yürürlükteki sabit merdiven — kıyas) · h0 (yalnız 💎, bedel sıfır) ·
                  **hF** (KALICI ÇARPAN: kademe toplandıkça kalıcı ₺/müşteri çarpanı) ·
                  **hG** (GELİRE ORANLI ₺: ödül = o anki ₺/sn × N sn, kademe index'ine DEĞİL)
SAYILAR         : docs/hedef-raporu-d3.md §6.3 — 6 bulgu, TAM koşu, damgalar temiz
                  hG ELENDİ (geç pencere 6 dozda da 43,4 dk · açılışı eziyor: otom. 6,1→1,7 dk)
                  hF çalışıyor (enUzun 43,4→34,4 · açılış SABİT) · tempo verimi hE ile DENK
KARAR           : (adım 3)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (tests/hedefler.test.ts genişletilir)
```

**Neden bu tur açıldı:** D3'ün kapanışında "hedeflerin ₺ kolu kalsın mı (A) / h0'a dön (B) /
ucuzlat (C)" diye sorulmuştu; kullanıcı üçünü de reddedip **sektörde kaliteli olanın ne olduğunu**
sordu. Cevap üçünün dışında: idle/tycoon'da koleksiyon ödülü ya **sert para** (değeri enflasyona
uğramaz) ya **kalıcı çarpan** (AdVenture Capitalist milestone · Cookie Clicker milk · Egg Inc.)
olur; yumuşak para kullanılacaksa **gelire oranlı** tanımlanır ("şu anki gelirin N saniyesi"),
sabit sayı olarak değil. Bizim ölçümümüz aynı şeyi zaten söylemişti — `hA %50`de 66.000 ₺ ödendi,
geç pencerelere düşen **0** — ve Bulgu 10 ② kusuru yapısal olarak adlandırmıştı: ödül kademe
*index*'ine bağlıydı, oyuncunun oraya *ulaştığı zamana* değil. A/B/C üçü de o kalıbı koruyor,
siliyor ya da küçültüyordu; hiçbiri değiştirmiyordu.

## SIRADAKİ TAM ADIM

**Faz D — meta katman (3/5).** Aday sırası: ① **D4 İtibar + günlük görevler** (ortak ödül ekranı
hazır, seviye atlama modali onu devralır) · ② **nav ızgarası ↔ oyuncu çarpışması** (bilinen hata,
tek başına duruyor) · ③ D5 elmas harcaması + Usta katmanı — **D5 geldiğinde D-089'un elmas hükmü
bayatlar** (bekçideki `h0` beklentisi bilerek o gün kırılacak şekilde yazıldı).

**Bu tur bitince:** karar hangi kola giderse gitsin D-090 yazılır; ardından **D4 İtibar + günlük
görevler** açılır (ödül ekranı hazır) — günlük görevler de aynı ödül kanalını kullanacağı için
kalıp kararı ondan ÖNCE verilmek zorundaydı.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **Normal profil 43,4 dk beklemesi** — D-087'de bilerek ödenmedi; **D3 de kapatamadı** (D-089:
  hedef ödülü tempo olarak doldurmuyor). Gözlem bandında görünür kalıyor.
- **Bekçi bandının çözünürlüğü ~%10** — `tests/hedefler.test.ts`'in ödenen-₺ bandı tek kategoride
  %20'lik ince bir ödül artışını yakalamıyor (M9 mutasyonu kaçtı). Daha incesi için ölçüm aracı
  koşulur; bandı ±%3'e indirmek sim'in her küçük değişiminde testi kırardı.
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; oysa ÜÇ KOL
  tablosu 20 masada `waiterTray: 3` varsayıyor — tempo kalemi DEĞİL, görev/HUD tutarlılığı.
- **`outputMultByLevel` yok** — servis çıktı çarpanı merdiven-geneli; `b1` erken oyuna
  dokunmadan denenemiyor.
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5) — model kalemi, bugün zarar vermiyor.
- **Nav ızgarası ↔ oyuncu çarpışması** — Faz D (D3'ten sonraki aday).
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün iki oturum kapanınca
  sessiz kalıyor. C5 ve D1'in anlatısı bu yüzden iki tur yayınlanmadı (2026-09-08'de düzeltildi,
  araç değişmedi). Kural "sayaç arttıysa kart sayısı da artmalı" olmalı.
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,17 MB (Faz F kod-bölme).
- C4'ten kalan ölçüm kusuru: B1 · oyuncu kipinde bot hiç yürümüyor (karar etkilenmedi).

**Bekleyen denge kararı:** hedef ödülünün KALIBI — bu turda ölçülüyor (yukarıdaki tur kartı).

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
