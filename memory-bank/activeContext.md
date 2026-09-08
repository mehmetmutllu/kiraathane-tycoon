# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **D3 BİTTİ** · Faz D 3/5 · 66/76)

```
SORU            : Hedeflerin (koleksiyon) ödülü ₺ içermeli mi, hangi dozda? Meta katmanın ₺ akışı
                  geç-oyunun bekleme pencerelerini dolduruyor mu?                      [KAPANDI]
ÖLÇÜLECEK KOLLAR: h0 (yalnız 💎) · hA (kazanç eşikleri) · hB (mekân) · hC (ikisi) · hD (YOĞUNLUK,
                  toplam sabit) · hE (yoğun+kısık) · hUYG (uygulanan config)
SAYILAR         : docs/hedef-raporu-d3.md §4 — 10 bulgu, tam koşu, damgalar temiz
KARAR           : D-089 — kullanıcı `hE %2` + kategoriler Servis·Mekân·Kazanç·Usta·Temizlik
UYGULAMA        : `goals.ts` (yeni) · `economy.config.ts` +goals bloğu · `save.ts` goalsClaimed
                  (additive, SÜRÜM ARTMADI) · `store.ts` claimGoal · `HUD.tsx` GoalsSheet+RewardModal
                  `tick.ts`/`rules.ts` DEĞİŞMEDİ · mevcut hiçbir denge sayısı düzenlenmedi
BEKÇİ           : tests/hedefler.test.ts — 20 test, SEKİZ mutasyonla doğrulandı (ikisi kaçtı → bant
                  daraltıldı; çözünürlük ~%10 olarak kayda geçti) · vitest 604 · duman 31/31
```

**Bu turun asıl dersi — `hUYG` kolu:** "seçilen doz iyiydi, config'e yazdığım da ona denktir" bir
VARSAYIMDI ve iki kez çürüdü. ① Ortak ödül merdiveni toplamı bakımından denk görünüyordu ama
gerçekleşen ödeme 3k değil **11k** çıktı. ② Kısıldı, toplam tuttu, ödemelerin **YERİ** tutmadı —
ödül kademe *index*'ine bağlıydı, oyuncunun oraya *ulaştığı zamana* değil. Ödül kategori başına
merdivene çevrildi. Yürürlükteki sayılar **üçüncü** ölçümün sonucu.

**KABUL EDİLEN EKSİK (gizlenmedi):** seçilen kolun BEDELİ tutturuldu (%-3,2), vaat ettiği FAYDA
gelmedi — ihlal 6'da, en uzun bekleme 43,4 dk'da kaldı. D-087'nin açık kalemi **kapanmadı**.

## SIRADAKİ TAM ADIM

**Faz D — meta katman (3/5).** Aday sırası: ① **D4 İtibar + günlük görevler** (ortak ödül ekranı
hazır, seviye atlama modali onu devralır) · ② **nav ızgarası ↔ oyuncu çarpışması** (bilinen hata,
tek başına duruyor) · ③ D5 elmas harcaması + Usta katmanı — **D5 geldiğinde D-089'un elmas hükmü
bayatlar** (bekçideki `h0` beklentisi bilerek o gün kırılacak şekilde yazıldı).

**SONRAKİ OTURUMDA SORULACAK (bu turdan taştı):** hedeflerin ₺ kolu bu hâliyle kalsın mı? Fayda
ölçülemediğine göre `h0` (yalnız 💎, bedel tam sıfır) hâlâ savunulabilir; karar ₺ lehine verilirken
faydanın ölçülebilir olduğu varsayılmıştı.

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

**Bekleyen denge kararı:** hedeflerin ₺ kolu kalsın mı (yukarıda) — sonraki oturumda sorulacak.

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
