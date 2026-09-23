# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-24 — T9b KAPANDI · D-146; sıradaki T9c)

```
T9b SONUÇ       : 34 bulgu (`docs/tarama-raporu-t9b.md`) — A1 hat 30/50'de KİLİT (`q_tost5`: `serveTost` değerlendiricisi
                  yok) · A2 `q_tableL2x2` oku yanlış masada · A3 sıcak dönüşte çevrimdışı gelir yok · A4 geri tuşu yok
KARAR           : D-146 — K1 günlük kart · K2 para biçimi · K3 Sv 2-4 ₺ yok · K4 Usta pad gibi · K5 servis gövdeden
                  (ölçümle) · K6 Çaycı/Seviye · K7 günlük sabit · K8 kapanışta para topla · K9 bildirim anahtarı kalkar · K10 araç
ARAÇ            : `tools/tarama-botu-t9b.txt` — oku izleyen bot (tarayıcıda eval); kilit/yanlış ok bununla bulundu
```

## ⏭️ SIRADAKİ ADIM

**T9c — mantık/kilit düzeltmeleri** (D-146 §Sıra): A1 `serveTost` değerlendiricisi + bekçi "her sayaçlı hedefin
değerlendiricisi var" · A2 odak = `tableUpgradeTarget` · A3 `visibilitychange` visible → çevrimdışı · A4 geri tuşu ·
A5/A6 kayıt (yeni sürüm yazma kilidi + derin birleştirme) · A7 `levelUp` kayda · D2 saat geri · D6 garson ·
K4 Usta pad · K5 servis gövdeden (VARYANT KAPISI: ölç → sor değil, karar verildi → kol ölçülür) · K7 · K8 · K10.
Sonra **T9d** arayüz/metin, sonra **Faz F**.

## AÇIK KALEMLER
- **Seviye ekranının "İzle, 2× al"ı** pasif — F3 (reklam) kararına bağlı.
- **C kolu ölçülmedi:** "tavan + çıkış payı" (T6). **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`.
- **F3 (AdMob) kararı VERİLDİ: C1′ 3 dk** (2026-09-23), uygulama Faz F'de (`docs/reklam-raporu-f3.md`). YouTube Playables
  mağaza yayınından SONRA (adaptör; dış URL yasak: Draco gstatic + troika jsdelivr kapatılmalı).
- **T2a tipi yanlış pozitif** sıra kilidinde kalıyor: `tick.ts`e ölçümsüz MANTIK değişikliği `olcum-yok` sayılır (davranış parmak izi ister).

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. ~~T8a — zincir + T3 denge~~ ✅ D-142 · ~~T8b — tezgâh arkası~~ ✅ D-143 (F kapandı: A)
4. ~~T9a — performans + kod~~ ✅ D-145 · ~~T9b — oynanış taraması~~ ✅ D-146 · **T9c mantık** ← buradan · T9d arayüz
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
