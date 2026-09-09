# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D8 AÇIK** · Faz D 8/8 · 70/79)

D7 ikiye bölünmüştü: **D7a = ölçüm + denge** (bitti, D-093) · **D8 = UI** (bu tur, tur adı `D7b`).

```
SORU            : Usta ve günlük görevin MEKANİĞİ ve SAYISI var (D-093), ETKİLEŞİMİ yok.
                  Oyuncu 250 💎'ını nasıl harcayacak, günlük 10 💎'ı nasıl kazanacak?
ÖLÇÜLECEK KOLLAR: YOK — bu tur denge sayısı değiştirmiyor, **varyant kapısı tetiklenmiyor**
                  (`economy.config.ts`e eklenen tek şey görev TANIMLARI; arz `diamondsPerDay 10`
                  D7a'da ölçüldü ve DEĞİŞMİYOR). Karar ürün kararıdır, tempo kararı değil.
                  İSTİSNA: `master.tipMult` ×1,5 → ×2 sorusu D7a'nın ÖLÇÜLMÜŞ satırıdır
                  (`e2` 25 💎 · %-3,0 / 30,4 dk) — kapı sağlanıyor, yeni ölçüm gerekmiyor.
SAYILAR         : gerekmiyor (ölçüm turu değil) · dayanak `docs/elmas-raporu-d7.md` §2, §5
KARAR           : (karar paketi bekliyor)
UYGULAMA        : (kararın kolu)
BEKÇİ           : (test dosyası + mutasyon sayısı)
```

**Tur iki yeşil parçaya bölündü** (`feedback_task_splitting`: mantık ile görsel ayrı parçada):
**① günlük görev SİSTEMİ** (mantık + bekçi — 💎 gerçekten günlük akmaya başlar) →
**② UI** (Usta noktası + görev kartları + Hedefler'de Usta sayacı).

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **UYGULANAN HÂL BEKLENENDEN ZAYIF (D-093 Bulgu 13):** `eUYG` %-1,6 / 32,0 dk verdi, oysa
  kullanıcı ×1,5'i "%-3,0 / 30,4 dk" satırına bakarak seçti. Yönü güvenli tarafta (bedel ucuz,
  ödül küçük) ve dört ölçüt de geçiyor. **Aynı bedele daha çok ödül istenirse tek satır:**
  `tipMult` ×2 → `e2`nin 25 💎 satırına çıkar (%-3,0 / 30,4 dk). **Sonraki oturumda sorulacak.**
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
- **Faz D bitince D-087'nin tempo penceresi yeniden okunacak** (araç hazır) — meta katman o
  pencereleri doldurdu mu?
- **Masa parasının payı 0,34 br** (D5 Bulgu 5) — yapısal: masa ayak izi büyürse ya da
  `money.pickupRadius` küçülürse ilk kırılacak yer burası.
- **Bekçi bandının çözünürlüğü** — `tests/hedefler.test.ts`'in zincir-bedeli bandı %3-5.
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; ÜÇ KOL tablosu
  20 masada `waiterTray: 3` varsayıyor — tempo kalemi DEĞİL, görev/HUD tutarlılığı.
- **`outputMultByLevel` yok** — servis çıktı çarpanı merdiven-geneli; `b1` erken oyuna
  dokunmadan denenemiyor. **D7a'nın Usta kolu bu eksiğin üstüne biniyor** (tavan üstü tek basamak).
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5) — model kalemi, bugün zarar vermiyor.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — üç turdur aynı elle-düzeltme;
  kural "sayaç arttıysa kart sayısı da artmalı" olmalı. **Araç kendi turunu ister.**
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,49 MB (Faz F kod-bölme).
- C4'ten kalan ölçüm kusuru: B1 · oyuncu kipinde bot hiç yürümüyor — sebebi D5'te bulundu
  (B1'de hiç servis yok → kirli bardak doğmuyor → bot boşta). Botun kendi turuna yazıldı.

**Bekleyen denge kararı:** D7a'nın karar paketi (D-093) — ölçüm bitince gelir.

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
