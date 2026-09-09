# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D7a BİTTİ** · Faz D 7/8 · 70/79)

D7 kullanıcı kararıyla İKİYE BÖLÜNDÜ: **D7a = ölçüm + denge** (bu tur, bitti) ·
**D7b = UI** (Usta paneli + günlük görev kartları — sıradaki).

```
SORU            : Elmas kazanılıyor (250 💎) ama harcanamıyor. Usta katmanının ETKİSİ ve
                  FİYATI ölçülmemiş iki denge sayısı; 250 💎 kuyruğu doğmadan çökertiyor mu?
                                                                                  [KAPANDI]
ÖLÇÜLECEK KOLLAR: e0 taban · eKAPI araç denetimi · e1 etki dozu · e2 fiyat · e3 kapsam ·
                  e4 hedef arzı · e5 günlük görev · **e6 personel/taşıma** (tur kartında
                  YOKTU — darboğaz dağılımı okununca eklendi) · **e6X** tavan şartı yok
                  (kanal denetimi) · eUYG uygulanan config
SAYILAR         : docs/elmas-raporu-d7.md §2 — 13 bulgu, tam koşu, damgalar temiz
KARAR           : D-093 — `master.tipMult 1.5` · `master.diamondCost 25` ·
                  `dailyQuests.diamondsPerDay 10`; planın iki sayısı da ölçümde düzeltildi
UYGULAMA        : `economy.config.ts` (2 blok) · `rules.ts` (Usta yardımcıları) · `tick.ts`
                  `masterTip` (kimlikten TÜRER, `incomeMult` deseni) · `store.ts` `buyMaster`
                  · kayıt sürümü ARTMADI (v32, `mastersOwned` additive)
BEKÇİ           : tests/usta.test.ts — 11 test, **10 mutasyon, onu da yakalandı** ·
                  vitest 639 · duman 32/32
```

**Turun asıl dersi — UYGULANAN HÂL İKİ KNOB'UN TOPLAMI DEĞİL (Bulgu 13).** Etki ×1,5 ve fiyat
25 💎 tabloda AYRI ölçülmüştü (ikisi de %-3,0 / 30,4 dk); birleşimleri **%-1,6 / 32,0 dk** —
yaklaşık yarısı, çünkü ikisi de aynı yönü çekiyor (biri alım başına değeri, diğeri alım
sayısını düşürüyor). D-090 Bulgu 10 ve D-092 `rUYG`den sonra **üçüncü kez** aynı varsayım
çürüdü. `eUYG` satırı olmasaydı rapor yürürlükte olmayan bir sayıyı savunacaktı.

**İkinci ders — sıfır satır iki farklı şey olabilir.** `e5` ve `e6` ikisi de 0 alım ölçtü ama
sebepleri farklıydı: `e5` ÖLÇEK uyuşmazlığı (12 sa yarım gün), `e6` ULAŞILAMAZLIK (personel
merdivenleri tavana varmıyor). Ayırmak için iki ayrı denetim satırı gerekti (`e5` ızgarası
80 💎/gün'e uzatıldı · `e6X` tavan şartı kaldırıldı) — yoksa ikisi de "kol etkisiz" diye
okunurdu ve `e6X`in %-26,1'i hiç görülmezdi.

## SIRADAKİ TAM ADIM

**D7b — UI: Usta paneli + günlük görev kartları.** Faz D'nin son kalemi. Mekanik ve sayılar
D7a'da çivilendi ve bekçili; eksik olan ETKİLEŞİM: (a) oyuncu Usta'ya yaklaşınca panel
(plan §5: "adım listesine girmez, rozet + Hedefler paneli üzerinden"), (b) günlük görev
SİSTEMİ (bugün yalnız ölçülmüş sayısı config'te duruyor — 3 görev/gün, toplam 10 💎),
(c) `buyMaster` çağıran buton + "İzle ve Usta yap" reklam yeri (Faz 5'te bağlanacak).
Faz D bitince D-087'nin tempo penceresi yeniden okunacak (araç hazır).
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
