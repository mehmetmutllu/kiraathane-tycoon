# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-24 — T9c KAPANDI · D-147; sıradaki T9d)

```
SORU            : T9b'nin mantık/kilit bulguları (A · D · K4 · K5 · K7 · K8 · K10) + K5 servis payı kaç br?
ÖLÇÜLECEK KOLLAR: K5 — S0 merkez 1,60 · G5/G7/G8/G9 gövde + 0,50/0,70/0,80/0,90
SAYILAR         : `docs/servis-raporu-t9c.md` §Bulgular — S0 %69,3 (köşe kör) · G7 %100, sızıntı 0 · alt sınır 0,672
KARAR           : D-147 — G7 (pay = cups.collectReach); q_tost5 elle süresi T9d'de ölçülür
UYGULAMA        : A1-A7 D2 D6 K4 K5 K7 K8 K10 (serveRadius config'ten kalktı · A4 = @capacitor/app + duman denetimi)
BEKÇİ           : `tests/mantik-t9c.test.ts` 23 test · mutasyonla doğrulanan: A1 A2 A4 A6 D2 D6 K4 K8 · K5 (iki); A3 A5 A7 K7 yalnız testle
```

## ⏭️ SIRADAKİ ADIM

**T9d — arayüz/metin düzeltmeleri** (D-146): B1 karakter görevinde ilk dokunuş · B2 tepsi ipucu ilk servis ortasında ·
B3/K1 hat sonu günlük kartı · B4 garson sekmesi · B7 çok-adımlı sayaç · B8 bant/zemin tutarı · B9 bildirim taşması ·
B11 çevrimdışı "Al" (₺ şu an ekran açılırken ekleniyor) · B12 pasif neden · B13 dokunma hedefleri · C/K2 para biçimi ·
K3 Sv 2-4 ekranı · K6 "Çaycı"/"Seviye" · K9 bildirim anahtarı · **q_tost5 elle süresi ölçümü** (garsonlar tostu önce
kapıyor — uzunsa seçenek getir). Sonra **Faz F**.

## AÇIK KALEMLER
- **Seviye ekranının "İzle, 2× al"ı** pasif — F3 (reklam) kararına bağlı.
- **C kolu ölçülmedi:** "tavan + çıkış payı" (T6). **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`.
- **F3 (AdMob) kararı VERİLDİ: C1′ 3 dk** (2026-09-23), uygulama Faz F'de (`docs/reklam-raporu-f3.md`). YouTube Playables
  mağaza yayınından SONRA (adaptör; dış URL yasak: Draco gstatic + troika jsdelivr kapatılmalı).
- **`gunluk-gorev.test.ts` 💎 tavanı testi** tam pakette bir kez 10 sn süre aşımına düştü (tek başına ve ikinci koşuda
  yeşil) — yük altında yavaş; tekrar ederse süre sınırı/boyut ele alınır.
- **T2a tipi yanlış pozitif** sıra kilidinde kalıyor: `tick.ts`e ölçümsüz MANTIK değişikliği `olcum-yok` sayılır (davranış parmak izi ister).

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. ~~T8a — zincir + T3 denge~~ ✅ D-142 · ~~T8b — tezgâh arkası~~ ✅ D-143 (F kapandı: A)
4. ~~T9a — performans + kod~~ ✅ D-145 · ~~T9b — oynanış taraması~~ ✅ D-146 · ~~T9c mantık~~ ✅ D-147 · **T9d arayüz** ← buradan
5. **Faz F — F3 reklam · F4 IAP · F5 mağaza + G-89 store görseli/videosu (EN SON)**

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
