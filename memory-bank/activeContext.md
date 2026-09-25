# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-25 — F4c-4 ✅ KAPANDI · D-157)

```
SORU            : F4c-4 — dekor mağazada salondaki YERİNDE nasıl görünür? satın alma metinleri neden "boğuk"?
ÖLÇÜLECEK KOLLAR: dekor: oyun açısı · çapraz %30/%38/%45 → %30/%25/%22 · teklif T1/T2/T3 · metin 14 satır
SAYILAR         : `docs/magaza-raporu-f4c4.md` B1-B10 (oyun açısı yan duvarda tablo 0 px · alım geri bildirimi 0)
KARAR           : D-157 — çapraz uzak %25 + oto kadraj · T3 ("Bir kez alınabilir") · 14 metin + bildirim/ses/ödül kartı
UYGULAMA        : DEKOR_KADRAJ · dekorKadraj.ts · cizilenDekor · DekorCekimi.tsx · SatinOdulu · satinBildirimi · alimSayisi
BEKÇİ           : magaza-f4c4.test.ts 24 · mutasyon 12/12 · vitest 1670 · duman 67/67
```

## ⏭️ SIRADAKİ ADIM

**F8'in (💎 vitrini) kalanı:** 💎 fiyatları TASLAK → ayrı fiyat oturumu (kullanıcıya sor). Sonra **F5** mağaza vitrini + uyum + G-89 (EN SON).
Mağaza kareleri: `node tools/shot-magaza-son.mjs` (25 kare + 9 dekor önizlemesi).
- **Duman:** bu makinede 5199 takılıyor (sayfa 30 sn'de açılmıyor) → `DUMAN_PORT=4000 npm run duman`.
- **Python ile dosya yazma:** 'w' kipi Windows'ta CRLF yapar → `rb/wb` + LF kullan (kayıt bekçisi `\n}\n` ile böler).
- **Görsel açık:** yelek tepsinin arkasında (kullanıcı "şu an okey" dedi). Bildirim önizlemenin üst kenarına biniyor (3 sn) — gözle bakılsın.
- Kare araçları taze oyunda ad kutusuna takılır: `__setState({ kafeAdi: '…' })` ile geçilir.

## AÇIK KALEMLER
- **Play Games (kullanıcı):** `docs/play-games-kurulum.md` adımları → proje kimliği `strings.xml` + 19 başarım kimliği
  `playGames.config.ts`. Başarım simgeleri (512×512 × 19) istenirse biz hazırlarız. Sonra gerçek cihazda giriş/bulut turu.
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
5. Faz F — ~~F3 reklam~~ ✅ D-149/D-150 · ~~F4a IAP~~ ✅ D-152 · ~~F4b Play Games~~ ✅ D-153 · **F4c 💎 vitrini** ← buradan · F5 mağaza + G-89 (EN SON)

---
**Karar paketleri ve kare arşivi** (birikimli liste, buradan ayrıldı): `memory-bank/karar-paketleri.md`
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
