# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-23 — T7 KAPANDI · D-141; sıradaki T8)

```
T7 SONUÇ        : banket masayla ortadan dışa büyür (B4) · ada TEK kademe (dolunca en düşük masa
                  seviyesi: çıplak ahşap → keten → bordo+sırt → yastık → pirinç biye+kapitone) ·
                  ada başına tek mesh · Salon 3 pad'i 0/1,2 (G-82) · WC kabini elle çizildi (düz
                  laminat, yerden açık, ray) · prototype-bits söküldü
BEDEL           : B4 Kat 1'i −%4,3 kısalttı, aşan sayıları + D-095 bandı aynı (rapor Bulgu 7)
KARELER         : docs/gorsel/ss/t7-son-*.png
```

## ⏭️ SIRADAKİ ADIM

1. **T8** turunu aç (aşağıdaki sıra 3): önce kullanıcıya T7 karelerini göster, "genel çirkin çizim"
   taramasında bu turda yalnız banket + WC kabini değişti — başka rahatsız eden var mı sor.

## AÇIK KALEMLER
- **C kolu ölçülmedi:** "tavan + çıkış payı". Yeni taban S1; S1+S4 servisi −%2,1 kısıyor (rapor §Karar).
- **KORUNUM çözünürlük sınırında** (rapor Bulgu 6) — S1 artık taban, soru kapandı sayılabilir.
- **Bardak havuzu masa sayısıyla ölçeklenmiyor** (20 masaya 42) → **T8**.
- ~~T5 araçlarının `dunyaKur`u `stationLevels` yazmıyor~~ → 2026-09-23 düzeldi (ocak tavanda; eski çıktılar seviye-0 dünyadan).
- **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`. G-89 yayından hemen önce.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi (`docs/reklam-raporu-f3.md`). Reklam/kayıt
  katmanını adaptörle kur: **YouTube Playables** mağaza yayınından SONRA denenecek (kullanıcı
  2026-09-23; davetle giriş, AdMob/IAP orada yasak → `ytgame.ads`/`saveData`; dış URL yasak:
  drei Draco gstatic + troika font yedeği jsdelivr kapatılmalı).
- **`npm run lint` 66 hatayla kırmızı** — `tools/` altında, T9.
- **Sıra kilidi yanlış pozitifleri** (D-133/134/138/139/T6) — aracı düzeltmek kullanıcının kararı.
- **T6b worktree** `../kiraathane-t6once` silindi; gerekirse kurulum `tools/olcum-kayma-t6b.mjs` başlığında.
- ~~`progress.md` 86 KB~~ → 2026-09-23 kesildi (8,5 KB), tam metin `arsiv/progress-tamamlanan.md` sonunda.

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. **T8 — G-85 tost/çay mimarisi + G-90 tost asset'i + G-86 zincir denetimi + T3 denge + bardak havuzu** ← buradan başla
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
