# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D4 BİTTİ** · Faz D 4/6 · 67/77)

```
SORU            : Hedef (koleksiyon) ödülü hangi KALIPTA olmalı? Sabit ₺ merdiveni sektörün terk
                  ettiği kalıp; kalıcı çarpan ve gelire-oranlı ₺ hiç ölçülmemişti.      [KAPANDI]
ÖLÇÜLECEK KOLLAR: hUYG (D-089'un sabit ₺ merdiveni — kıyas) · h0 (yalnız 💎) · **hF** (KALICI
                  ÇARPAN) · **hG** (GELİRE ORANLI ₺) · hUYGF (uygulanan config)
SAYILAR         : docs/hedef-raporu-d3.md §6.3 — 6 bulgu (11-16), tam koşu, damgalar temiz
KARAR           : D-090 — kullanıcı "en kalitelisi ne ise o olsun" → `hF` %10 + 💎
UYGULAMA        : `economy.config.ts` goals bloğu (`incomeBonusTotal: 0.10`, `rewards` SİLİNDİ) ·
                  `goals.ts` (bonus/collectionMult) · `tick.ts` + `rules.ts` (çarpan ₺'nin
                  yaratıldığı üç yere) · `store.ts` claimGoal artık cüzdana ₺ EKLEMİYOR ·
                  `HUD.tsx` (+%0,4 satırda, kümülatif üstte) · `devHooks` goalMult · kayıt v32
BEKÇİ           : tests/hedefler.test.ts + **tests/hedef-gelir-kablosu.test.ts (YENİ)** — DOKUZ
                  mutasyon; M9 kaçtı (doz %10→%11 bandın içinde) → ölçülen doz DOĞRUDAN çivilendi,
                  sonra yakalandı · vitest 612 · duman 32/32 (goalMult ×1,004 okundu)
```

**Bu turun asıl dersi — ölçümün NE SÖYLEMEDİĞİ:** tempo verimi `hF` 0,53-0,63 · `hE` 0,50-0,57
dk/% çıktı, yani **denk**. Tablo ELEME yaptı (`hA`/`hB`/`hC`/`hG` verimi sıfır) ama kalan iki
kalıbı ayırmadı. D-084'ün kuralı burada tersine de işledi: **sayı, kararın hangi eksende
VERİLEMEYECEĞİNİ de söyleyebilir.** Seçim sim'in ölçmediği eksende verildi — ödül bayatlıyor mu,
ve "yazılan ≠ ödenen" hata sınıfı mümkün mü (Bulgu 13-14).

**İkinci ders — bekçide bulunan gerçek boşluk:** denge testleri SİM'in kolunu ölçüyordu, oyunun
`tick.ts` kablolamasını değil. Biri `* incomeMult`'ı oradan silse hepsi yeşil kalırdı ve rapor
yürürlükte olmayan bir sayıyı savunurdu. `tests/hedef-gelir-kablosu.test.ts` ₺'nin yaratıldığı
**üç yeri** ayrı ayrı doğruluyor (müşteri ödemesi · lavabo ücreti · çevrimdışı oran).

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
