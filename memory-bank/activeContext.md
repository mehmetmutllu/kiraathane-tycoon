# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-24 — F3 tur 2 AÇIK: reklam altyapısı uygulaması + F3b ödüllü ekonomi)

```
SORU            : (a) F3 tur 1 kararlarını koda indir — A1 eklenti · SDK sabit · R8 açık · çocuk bayrakları + UMP ·
                  mock katman · geçişli C1′ (soğuma 3 dk kurar, panel kapanışı patlatır, ödülden sonra asla) · banner YOK
                  (b) F3b: ödüllü videonun ÖDÜLÜ ne — "İzle, 2× al" hangi ödülleri katlar, Usta kaç reklam?
ÖLÇÜLECEK KOLLAR: (a) teknik, D-144 + `reklam-raporu-f3.md` §Kollar — ölçüm yapıldı, varyant yok
                  (b) `economy.config.ts`e dokunur → varyant kapısı: kollar ölçüm sırasında yazılır
SAYILAR         : (a) `docs/reklam-raporu-f3.md` §B/§E · (b) `docs/odullu-raporu-f3b.md` §Bulgular — S2 −%2,3 · H2 −%3,9 ·
                  V60 −%2,3 · hepsi −%8,0 · O2 1 sa'te %100 boş · hedef 💎 2× kuyruğu 0 güne indirir · U1 0,71 gün/Usta
KARAR           : (a) D-144 ② → uygulandı D-149 ✅ · (b) karar paketi
UYGULAMA        : (a) önce, kod + bekçi + mutasyon · (b) yalnız seçilen kol
BEKÇİ           : (a) `tests/reklam-f3.test.ts` 19 · `tools/mutasyon-reklam-f3.mjs` 10/10 · duman 53/53 · (b) açılacak
```

## ⏭️ SIRADAKİ ADIM

~~(a) altyapı~~ ✅ D-149 → **(b) F3b ölçüm** → commit #1 → karar paketi → uygula → F4 IAP → F5 mağaza + G-89 (EN SON).
Bildirimler anahtarı Faz F'de bildirim gelince geri döner (`settings.notifications` kayıtta duruyor).

## AÇIK KALEMLER
- **"İzle, 2× al"** pasif — F3'te bağlanır (Sv 2-4 ekranında artık çizilmiyor, D-148).
- **C kolu ölçülmedi:** "tavan + çıkış payı" (T6). **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`.
- **F3 (AdMob) kararı VERİLDİ: C1′ 3 dk** (2026-09-23), uygulama Faz F'de (`docs/reklam-raporu-f3.md`). YouTube Playables
  mağaza yayınından SONRA (adaptör; dış URL yasak: Draco gstatic + troika jsdelivr kapatılmalı).
- **Çevrimdışı ₺ para dili:** "Al" artık görünen sayıyı büyütüyor ama sayma animasyonu yok (juice, F sonrası cila).
- **T2a tipi yanlış pozitif** sıra kilidinde kalıyor: `tick.ts`e ölçümsüz MANTIK değişikliği `olcum-yok` sayılır (davranış parmak izi ister).

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. ~~T8a — zincir + T3 denge~~ ✅ D-142 · ~~T8b — tezgâh arkası~~ ✅ D-143 (F kapandı: A)
4. ~~T9a — performans + kod~~ ✅ D-145 · ~~T9b — oynanış taraması~~ ✅ D-146 · ~~T9c mantık~~ ✅ D-147 · ~~T9d arayüz~~ ✅ D-148
5. **Faz F — F3 reklam · F4 IAP · F5 mağaza + G-89 store görseli/videosu (EN SON)** ← buradan

---

**Karar paketleri ve kare arşivi** (birikimli liste, buradan ayrıldı): `memory-bank/karar-paketleri.md`

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
