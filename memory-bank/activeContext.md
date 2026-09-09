# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D7a ÖLÇÜM** · Faz D 7/7 · 69/79)

D7 kullanıcı kararıyla İKİYE BÖLÜNDÜ (2026-09-09): **D7a = ölçüm** (bu tur — 💎 arz/harcama
dengesi + Usta katmanının denge sayıları) · **D7b = UI** (Usta paneli + günlük görev kartları).
Kesme çizgisi yeşil ara durum: D7a bitince sayılar çivili ve bekçili, ama panel yok.

```
SORU            : Elmas bugün KAZANILIYOR ama harcanamıyor (kaynak: yalnız hedefler, 250 💎 ·
                  harcama: SIFIR). D7 harcamayı (Usta katmanı) ve ek arzı (günlük görev) getiriyor.
                  İki denge sayısı hiç ölçülmedi: (a) Usta'nın ETKİSİ — ₺ tavanının üstünde ×N
                  çıktı/bahşiş, (b) 💎 arzı ile Usta fiyatının kuyruğu. Plan §6 "hiç reklam
                  izlemeyen ~2,5 günde bir Usta alır" diyor; oysa hedefler tek başına 250 💎
                  ödüyor = 15 💎'lık fiyatta 16 Usta. Kuyruk daha doğmadan çöküyor mu?
ÖLÇÜLECEK KOLLAR: e0 taban (Usta yok — bugünkü hâl) · e1 Usta ETKİ dozu (×2 plan · ×1,5 · ×1,25)
                  · e2 Usta FİYATI (15 · 25 · 40 💎) · e3 KAPSAM (yalnız servis · yalnız masa ·
                  ikisi = ~26 hedef) · e4 hedef 💎 arzı (250 bugün · 150 · 80) · e5 günlük görev
                  arzı — **DEFTER kolu** (12 sa penceresi bir günü aşmıyor, tick ölçemez) ·
                  eUYG uygulanan config
SAYILAR         : (adım 2'den sonra dolar — docs/elmas-raporu-d7.md §Bulgular)
KARAR           : (adım 3 — kullanıcı seçer, D-093)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Turun bilinen MODEL SINIRI (rapora aynen geçer):** sim penceresi 12 sa KESİNTİSİZ aktif oyun
(`MAX_T`); günlük görev gün ölçeğindedir, bu pencerede en çok bir günlük arz (≈6 💎) düşer.
Yani günlük görev kolu tick ile ÖLÇÜLEMEZ — defter (analitik) kolu olarak yürür, D6'nın `g1`
kolunun aynısı. Ölçülebilen şey Usta'nın etkisi, fiyatı, kapsamı ve hedef arzının kuyruğa etkisi.

**Kodun bugünkü hâli (ölçüm öncesi doğrulandı):** Usta katmanı kodda **YOK** — planın "zaten
yazılmışlar (`masterLevel`, `masterDiamondCost`)" cümlesi BAYAT, iki ad da kod tabanında geçmiyor.
`tables.upgrade.maxLevel: 4` ₺ tavanı; `masterTables` hedef sayacı bugün **L4'ü** (₺ tavanı)
sayıyor — Usta gelince "Usta masa" L4 mü L5 mi, karar paketine girer.

## SIRADAKİ TAM ADIM

**D7a adım 2 (ÖLÇ):** `tools/usta-kollari.ts` + `tools/olcum-elmas.ts` · sim'e Usta kancası
(`ustaAyarla`, `itibarAyarla` deseni — `economy.config.ts` DEĞİŞMEZ) · kısa koşu ile araç
doğrulaması → tam koşu TABAN → kollar → `docs/elmas-raporu-d7.md` §Bulgular →
**commit #1 (karar bölümü BOŞ)**. Sonra karar paketi, sonra D7b (UI) ayrı tur.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **`tests/hedefler.test.ts`'in `h0` elmas beklentisi D7a'da BİLEREK kırılacak** (D-089): "💎
  tempoya girmez" damgası elmasın harcaması olmadığı için geçerliydi; harcama gelince bayatlar.
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
