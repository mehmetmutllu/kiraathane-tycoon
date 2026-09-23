# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-23 — T8a AÇIK · adım 2 ÖLÇ)

T8 ikiye bölündü (`feedback_task_splitting`): **T8a = sayı** (G-86 zincir · T3 K1-K8 · K11 · bardak
havuzu) · **T8b = mekân/görsel** (G-85 tost noktası · G-90 tost asset'i · K9 bulaşık kuyruğu · K10
tezgâh duvar payı — üçü de tezgâh arkasının aynı ölçü dondurma işi).

```
SORU            : zincirin hangi halkası yerinde değil (G-86) ve T3'ün fiyat/doz kolları yürürlükteki
                  oyunda (HRE + D-124 tek hedef) tempoya ne ödüyor? Bardak havuzu bağlıyor mu?
ÖLÇÜLECEK KOLLAR: K3a/b/c 2. garson yeri · D1/D2 bulaşıkçı yeri · W3 garson tepsi-3 hatta · K5a/b
                  2. salonu geciktir · K1a/b tepsi T1 · K2a/b garson tepsi tabanı · K4a/b 4. masa ·
                  K6T/K6B masa sırası · K7a/b seviye eğrisi · K8a/b/c seviye ₺ · K11 dürtüsel oyuncu ·
                  B0-B2/Y1-Y2 havuz × yıkama (oyunun tick'i)
SAYILAR         : docs/zincir-raporu-t8a.md §Bulgular (olcum-t8a.txt · olcum-bardak-t8.txt)
KARAR           : (adım 3)
UYGULAMA        : (adım 4)
BEKÇİ           : (adım 4)
```

## ⏭️ SIRADAKİ ADIM

1. Tam koşular → rapor §Bulgular → commit #1 (karar bölümü boş) → TEK karar paketi.

## AÇIK KALEMLER
- **C kolu ölçülmedi:** "tavan + çıkış payı". Yeni taban S1; S1+S4 servisi −%2,1 kısıyor (rapor §Karar).
- **KORUNUM çözünürlük sınırında** (rapor Bulgu 6) — S1 artık taban, soru kapandı sayılabilir.
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
