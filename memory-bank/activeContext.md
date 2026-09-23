# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-23 — T9a AÇIK · açık sorular kapandı: A · C1′ 3 dk · iki parça · g1 ölç · kilit düzelt)

```
SORU            : T9a — oyun adımı neden ~5 ms, nereye gidiyor; N2 yol önbelleğinin GÜVENLİ politikası var mı;
                  g1 kolu (garson merdiveni ucuzlatma) D-142 sonrası ne kazandırır? + araç borcu (lint 66, sıra kilidi)
ÖLÇÜLECEK KOLLAR: tick profili (sistem başına ms) · N2 politikaları (saf / waypoint görünürlük denetimli / süreli) ·
                  g1 taban vs g1 (tempo ölçütü, Kat 1 süresi)
SAYILAR         : docs/performans-raporu-t9a.md §Bulgular — tick ×10,1 node (birebir) · telefon kare işi −%21,4 · g1 ETKİSİZ (eski "iyileşme" hat tıkanmasıydı)
KARAR           : (karar paketi)
UYGULAMA        : —
BEKÇİ           : —
ARAÇ (kapısız)  : sıra kilidi: itilmiş commit #1'i görür + commit #1 dikişini ayırt eder · lint 66 → 0
```

Kullanıcının 2026-09-23 cevapları (açık sorular sayfası https://claude.ai/artifact/KeoLC7rpqJXgVGdRCPvwkd):
tost yeri **A** (aynı tezgâh, D→E — oyundaki hâl kalır, F kapandı) · F3 **C1′ 3 dk** (panel kapanışında,
ödül ekranından sonra asla; Faz F'de uygulanır) · T9 **iki parça** (T9a perf+kod · T9b oynanış taraması) ·
g1 **T9a'da ölçülür** · sıra kilidi **düzeltilir**.

## ⏭️ SIRADAKİ ADIM

T9a: araç borcu (sıra kilidi + lint) → tick profili + N2 + g1 ölçümü → commit #1 → karar paketi.
Sonra **T9b — oynanış taraması** (bulgu listesi kullanıcıya).

## AÇIK KALEMLER
- **Seviye ekranının "İzle, 2× al"ı** pasif — F3 (reklam) kararına bağlı.
- **C kolu ölçülmedi:** "tavan + çıkış payı" (T6). **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`.
- **F3 (AdMob) kararı VERİLDİ: C1′ 3 dk** (2026-09-23), uygulama Faz F'de (`docs/reklam-raporu-f3.md`). YouTube Playables
  mağaza yayınından SONRA (adaptör; dış URL yasak: Draco gstatic + troika jsdelivr kapatılmalı).
- **`npm run lint` 66 hatayla kırmızı** — `tools/` altında, T9.

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. ~~T6 commit #2~~ ✅ · ~~tarayıcı kayma ölçümü~~ ✅
2. ~~T7 — banket + pad + WC kabini~~ ✅ D-141
3. ~~T8a — zincir + T3 denge~~ ✅ D-142 · ~~T8b — tezgâh arkası~~ ✅ D-143 (F kapandı: A)
4. **T9 — G-88 genel tarama** ← T9a açık, sonra T9b (kod + oynanış, ağırlık performans) + N2 yol önbelleği + lint 66 + tick ~5 ms (T6b Bulgu C)
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
