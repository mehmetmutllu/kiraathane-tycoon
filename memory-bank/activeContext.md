# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-24 — F4a KAPANDI · D-152; sıradaki F4b Play Games)

```
SORU            : F4a — satın alımlar: başlangıç paketi kaç 💎 · elmas paketi neye harcanır · tempo satılıyor mu?
ÖLÇÜLECEK KOLLAR: §1 sim B50/B100/B250/P∞ (peşin 💎 → Kat 1) · §2 defter: 💎 talebi vs paket boyu (E0/U1/K)
SAYILAR         : `docs/iap-raporu-f4a.md` §Bulgular — B100 −%4,5 · P∞ −%7,0 · 💎 talebi 250 tavan (600'lük paket 350 ölü)
KARAR           : D-152 — B100 + özel kozmetik · elmas paketleri önce 💎 harcama yeri (vitrin kapalı, 25/60/150 kodda)
UYGULAMA        : iap.ts (RevenueCat / anahtarsız KAPALI / tarayıcıda sahte) · iap.config · rules/store/save · Paketler sekmesi · geri yükle · reklamsız hediye
BEKÇİ           : `iap-f4a.test.ts` 25 + 11/11 mutasyon · duman 55/55 · debug APK derlendi · kareler `docs/gorsel/f4a/`
```

**Kullanıcı kararları (2026-09-24):** pazara göre fiyat (mağazada; fiyat ayrı oturum) · RevenueCat hesabı açılacak ·
başlangıç paketi tempo/geri sayım yok, ilk Usta'dan sonra bir kez gösterilir (tetik F4c'de) ·
**F4b = Play Games: bulut kaydı + başarımlar (XP)**, iş yükü sorun değil.

## ⏭️ SIRADAKİ ADIM

**F4b (pano F7) — Play Games:** giriş + bulut kaydı (Saved Games; çakışmada DAHA İLERİ kayıt kazanır) + başarımlar (XP, toplam ~1000).
Capacitor eklentisi ya da kendi küçük native eklentimiz — araştır. Kullanıcıya adım listesi: Play Console'da Play Games
Services · imza SHA-1 · başarımların girişi. Sonra **F4c (F8)** 💎 kozmetik vitrini (adaylar render) → **F5** mağaza + G-89 (EN SON).

## AÇIK KALEMLER
- **RevenueCat (kullanıcı):** hesap → Android SDK anahtarı `iap.config.ts` · Play Console'da 5 ürün (`kiraathane_reklamsiz`, `_baslangic`, `_elmas_25/60/150`) + entitlement `reklamsiz`/`baslangic`.
- **Başlangıç paketi tetiği** (ilk Usta'dan sonra bir kez) F4c'de vitrinle birlikte.
- **Cihaz turu (F3):** gerçek dolgu · UMP formu AB'de açılıyor mu · reklam sırasında WebView sesi · R8 altında SDK'nın kendi yansıması.
- **D-151 — reklam SDK'sında kısıt yok** (içerik AdMob panelinden). F5'te Play Console hedef kitle beyanı buna uygun doldurulmalı.
- **Gerçek AdMob kimliği** kullanıcının AdMob hesabından gelecek → `ads.config.ts` + manifest `APPLICATION_ID`, `test: false`.
- **Görev ödülü ₺'si kazanç izinde** (tick içinde, küçük) — seviye/video ödülü onu da sayar (D-150 açık kalemi).
- **C kolu ölçülmedi:** "tavan + çıkış payı" (T6). **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`.
- YouTube Playables mağaza yayınından SONRA (adaptör; dış URL yasak: Draco gstatic + troika jsdelivr kapatılmalı).
- **Çevrimdışı ₺ para dili:** sayma animasyonu yok (juice, F sonrası cila).
- **T2a tipi yanlış pozitif** sıra kilidinde kalıyor: `tick.ts`e ölçümsüz MANTIK değişikliği `olcum-yok` sayılır.

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. ~~T8a — zincir + T3 denge~~ ✅ D-142 · ~~T8b — tezgâh arkası~~ ✅ D-143 (F kapandı: A)
4. ~~T9a — performans + kod~~ ✅ D-145 · ~~T9b — oynanış taraması~~ ✅ D-146 · ~~T9c mantık~~ ✅ D-147 · ~~T9d arayüz~~ ✅ D-148
5. Faz F — ~~F3 reklam~~ ✅ D-149/D-150 · ~~F4a IAP~~ ✅ D-152 · **F4b Play Games** ← buradan · F4c 💎 vitrini · F5 mağaza + G-89 (EN SON)

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
