# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-24 — T9d KAPANDI · D-148; Faz T bitti, sıradaki Faz F)

```
SORU            : D-146 arayüz/metin kalemleri + q_tost5 elle kaç dk?
ÖLÇÜLECEK KOLLAR: q_tost5 — V0 yalnız oyuncu 5 · V3 yalnız oyuncu 3 · V1 herkes 5 (aktif) · V1a herkes 5 (AFK)
SAYILAR         : `docs/tost-raporu-t9d.md` §Bulgular — V0 5,1 dk (1,4-8,9) · V3 2,7 · V1 2,0 · V1a 1,9
KARAR           : D-148 — V3 (3 tost; öneri V0'dı) · masa etiketi "Sv 2" kalır
UYGULAMA        : K2 fmt · B1 B2 B4 B7 B8 B9 B11 B12 B13 · K1 günlük bant · K3 Harika! · K6 Çaycı/Seviye · C3 · K9 · C5
BEKÇİ           : `tests/arayuz-t9d.test.ts` 26 test · `tools/mutasyon-arayuz-t9d.mjs` 10/10 · kareler `docs/gorsel/t9d/`
```

## ⏭️ SIRADAKİ ADIM

**Faz F — F3 reklam (AdMob, karar C1′ 3 dk verildi, `docs/reklam-raporu-f3.md`)** → F4 IAP → F5 mağaza + G-89 görsel/video (EN SON).
F3'te bağlanacak pasif yerler: ödül ekranı "İzle, 2× al" (yalnız katlanacak ödül varken çizilir, D-148 K3) · Usta "İzle".
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
