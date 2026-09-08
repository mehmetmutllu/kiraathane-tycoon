# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-08 — **Faz İA BİTTİ 3/3** · Faz C 4/5 · 62/76)

Son tamamlanan oyun turu hâlâ **C4** (bardak kilidi, D-083). Son iki tur oyun koduna
dokunmadı; ikisi de iş akışıydı ve **Faz İA kalemleri bitti** (P1 hafıza kesimi · P2 ortak
ölçüm iskeleti + damgalar · P3 kapanış otomasyonu — **D-085**).

**P3'te olan:** kapanışın elle yapılan iki adımı makineye geçti.
- `npm run pano` — sayaçlar `progress.md` tablosundan **türer**; araç defterin dört sayı
  yerini (bütçe satırı · tablo · faz başlığı · kalem listesi) bağımsız okuyup karşılaştırır,
  tutmuyorsa panoyu **yazmaz**. İlk koşusunda **üç gerçek sapma** buldu.
- `npm run sira` — denge dosyasına dokunan ilk commit'ten önce ölçüm commit'i yoksa çıkış 1.
  Gerçek geçmişte sınandı: **C3 temiz · C4 ihlal**.
- Bekçi: `tests/pano-guncelle.test.ts` + `tests/sira-kilidi.test.ts` · **40 test, 9 mutasyon**.
- Anlatı (özet · sıradaki · günlük kartı · faz açıklaması) **elle yazılmaya devam ediyor** —
  türetilebilir değil.

## SIRADAKİ TAM ADIM

**C5 — `simulate.ts`'i gerçeğe yaklaştırmak.** Dört kalem: taşıma modeli (G4'te gerçekleşen
**%58**, model ideal taşıyıcı varsayıyor) · masa yükseltmesi kalem kalem (sahte 21,4 dk kapanır)
· bardak döngüsü artık **D-083'ü de saymalı** · müşteri sabrı modelde hiç yok.

**Bu tur aynı zamanda İA'nın FAZ KAPISI:** yeni akışla koşulacak ve süresi git damgalarıyla
ölçülüp `docs/oturum-akisi-mantik.md` §4 tahminiyle (168 → ~95 dk) karşılaştırılacak; sapma
**> %15** ise hızlandırma mantığı düzeltilir. Kapı ayrı bir oturum değil.

**C5 denge dosyalarına dokunacak → varyant kapısı DEVREDE:** iki commit sırası zorunlu ve
kapanışta `npm run sira` bunu denetleyecek.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- `servis L6` 23,4 dk beklemesi · D-046 ④ kaba hâlde, ⑤ yok · sipariş nesnesi v1.1'de.
- **Nav ızgarası ↔ oyuncu çarpışması aynı dünyayı görmüyor** (`actorRadius` sandalyesiz,
  `playerRadius` sandalyeler katı): personelin geçtiği boşluktan oyuncu geçemiyor. **Faz D.**
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski).
- `docs/olcum-bardak.txt` ve `docs/olcum-kuyruk.txt` D-083 ÖNCESİNDEN kalma; C5'in tam koşusu
  bunları tazeleyecek.
- **C4'ten kalan iki ölçüm kusuru** (kod bilerek değiştirilmedi, ölçüm değişikliği kendi turunu
  ister): ① `iade:0.25` varyantı hiç tetiklenmemiş — düzeltme `docs/bardak-raporu-c4.md` §4'te,
  **Bulgu 3'ün sonucu değişmedi**. ② B1 · oyuncu kipinde bot hiç yürümüyor (0,0 br/dk); C4
  kararları `park` kipinden alındığı için karar etkilenmiyor.

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

**Sıra (D-084 §3.2) — ihlali commit yapısı engeller, kapanışta `npm run sira` denetler:**
`0 BAŞLA → 1 SORU (kart açılır) → 2 ÖLÇ → commit #1 (araç + ham çıktı + rapor, KARAR BÖLÜMÜ BOŞ)
→ 3 KARAR (tek karar paketi) → 4 UYGULA + bekçi + mutasyon + final tam koşu
→ commit #2 (kod + test + rapor tamam + D-0xx) → 5 KAPAT`

**Varyant kapısı:** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan denge değişikliği,
raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz.

**Kapanış (D-085):** `npm run sira` → `npm run pano` → `npm run test` → commit → push.
Pano denetimi kırmızıysa önce `progress.md` düzeltilir; anlatı elle yazılır.
