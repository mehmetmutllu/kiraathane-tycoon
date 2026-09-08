# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **oturum akışı mantığı kuruldu · D-084** · Faz C 4/5)

Son tamamlanan oyun turu: **C4 — bardak kilidi ölçüldü ve açıldı (D-083)**; garson boşta
bulaşık topluyor. vitest 485/485 · smoke 28/28. Rapor: `docs/bardak-raporu-c4.md`.

Bu tur oyun koduna dokunmadı: kullanıcının *"oturumlar neden 2 saat sürüyor"* sorusu
Fable 5.1 tarafından **ölçülerek** yanıtlandı → `docs/oturum-akisi-mantik.md` (216 satır).
Dört karar da önerilen seçenekle onaylandı (arşiv · pano script · decisions ≤12 satır ·
ölçüm/uygulama ayrı commit). **P1 (hafıza kesimi) bu turda uygulandı.**

## SIRADAKİ TAM ADIM

**P2 — `tools/olcum-lib.ts`** (1 oturum): ortak ölçüm iskeleti + üç damga
(bot-yürüdü · varyant-etkili · korunum) + `OLCUM=kisa|tam`. Üç araç lib'e bağlanır.
Kabul: kısa koşu < 60 sn · tam koşu çıktısı `docs/olcum-*.txt` ile **birebir aynı**
(`tick-fingerprint` deseni, Faz B1).
Sonra **P3** (½ oturum): `tools/pano-guncelle.mjs` + `oturum-bitir`'e sıra kilidi kontrolü.
Sonra **C5** yeni akışla; süre git damgalarıyla ölçülür ve §4 tahminiyle karşılaştırılır
(sapma > %15 → mantık düzeltilir).

**C5'in içeriği (değişmedi):** `simulate.ts`'i gerçeğe yaklaştırmak — taşıma modeli
(G4'te gerçekleşen %58, model ideal taşıyıcı varsayıyor) · masa yükseltmesi kalem kalem
(sahte 21,4 dk kapanır) · bardak döngüsü artık D-083'ü de saymalı · sabır.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- `servis L6` 23,4 dk beklemesi · D-046 ④ kaba hâlde, ⑤ yok · sipariş nesnesi v1.1'de.
- **Nav ızgarası ↔ oyuncu çarpışması aynı dünyayı görmüyor** (`actorRadius` sandalyesiz,
  `playerRadius` sandalyeler katı): personelin geçtiği boşluktan oyuncu geçemiyor. **Faz D.**
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski).
- Pano JSON'u C4'ü henüz saymadı (58/73 yazıyor); bu tur kapanışında düzeltilir.

**Bekleyen denge kararı YOK.**

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

**Sıra (D-084 §3.2) — ihlali commit yapısı engeller:**
`0 BAŞLA → 1 SORU (kart açılır) → 2 ÖLÇ → commit #1 (araç + ham çıktı + rapor, KARAR BÖLÜMÜ BOŞ)
→ 3 KARAR (tek karar paketi) → 4 UYGULA + bekçi + mutasyon + final tam koşu
→ commit #2 (kod + test + rapor tamam + D-0xx) → 5 KAPAT`

**Varyant kapısı:** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan denge değişikliği,
raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz.
