# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-23 — T8a KAPANDI · D-142; sıradaki T8b)

```
T8a SONUÇ       : 2. garson Salon 1 sonunda ₺800 · garson 2'li tepsi (tavan 4) · tepsi T1 ₺30 ·
                  4. masa ₺250 · seviye tabanı 90 · garson tepsi-3 görevi · seviye ₺ (Sv 5'ten, son
                  60 sn'nin kazancı) + seviye ÖDÜL EKRANI · yükseltme noktası yalnız kendi görevinde ·
                  kayıt v34 · 2. garson pad'i (−10,5 · 9,75)
BEDEL           : Kat 1 6,05 → 5,58 sa (−%7,7), eşikler temiz; K5b (2. salonu geciktir) SEÇİLMEDİ
YAN BULGU       : sim D-124'ü oynamıyordu (T8a'dan beri taban tek hedef) · bardak havuzu bağlamıyor ·
                  T6 aracının havuzu 22'ydi (42 değil) · D1'in g1 kolu artık iyileştiriyor (3 → 2)
KARELER         : docs/gorsel/ss/t8a-{garson2-pad,seviye-odul}.png
```

## ⏭️ SIRADAKİ ADIM

1. **T8b** turunu aç: tezgâh arkası — G-85 tost noktası (ayrı obje mi, aynı merdiven mi) + G-90 tost
   asset'i (KayKit önce; yoksa ikinci paket TEKLİF edilir) + K9 bulaşık kuyruğu + K10 tezgâhın duvar
   payı (kullanıcı: *"duvardan çıkmasın"*, en küçük yeterli açıklık). Görsel çatalda adayları aynı
   kadrajda göster (`feedback_show_dont_ask`).

## AÇIK KALEMLER
- **g1 kolu (garson merdiveni ucuzlatma) D-142 sonrası ölçütü iyileştiriyor** — elenme gerekçesi düştü;
  açılacaksa varyant kapısından (tempo-olcutu bekçisi kayda geçirdi).
- **Seviye ekranının "İzle, 2× al"ı** pasif — F3 (reklam) kararına bağlı.
- **C kolu ölçülmedi:** "tavan + çıkış payı" (T6). **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi (`docs/reklam-raporu-f3.md`). YouTube Playables
  mağaza yayınından SONRA (adaptör; dış URL yasak: Draco gstatic + troika jsdelivr kapatılmalı).
- **`npm run lint` 66 hatayla kırmızı** — `tools/` altında, T9.
- **Sıra kilidi yanlış pozitifleri** (D-133/134/138/139/T6) — aracı düzeltmek kullanıcının kararı.

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. ~~T8a — zincir + T3 denge~~ ✅ D-142 · **T8b — tezgâh arkası (G-85 · G-90 · K9 · K10)** ← buradan başla
4. **T9 — G-88 genel tarama** (kod + oynanış, ağırlık performans) + N2 yol önbelleği + lint 66 + tick ~5 ms (T6b Bulgu C)
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
