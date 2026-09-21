# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-21 — **T6 KARAR ALINDI, UYGULAMA SIRADAKİ OTURUMDA**)

```
SORU            : Kapı önünde NPC birikiyor ve kare sürükleniyor. Kök ne, doğru politika hangisi?
ÖLÇÜLEN KOLLAR  : S0 taban · S1 leaving ayrışmasız · S2 çıkış dağıtımı · S3 silme yarıçapı
                  S4 tavan tüm nüfusa · S5 = S1+S4 · S6 = S1+S3
SAYILAR         : docs/izdiham-raporu-t6.md §Bulgular · ham docs/olcum-izdiham-t6.txt
                  (TAM: 3 tohum × 600 sn, damgalar temiz)
                  taban 10 dk'da NPC 193 → 494, kapıda 475
                  S1 +%168,7 → +%4,4, kapıda 461 → 12,3
                  S4 TEK BAŞINA ÇÜRÜDÜ: nüfus 58 sabit ama servis 6,9 → 0,1/dk (−%98,6)
KARAR           : D-140 — kullanıcı **S1**'i seçti (benim önerim). S4 uygulanmaz; C kolu
                  ("çıkış payı eklenmiş tavan") kendi ölçümünü ister.
UYGULAMA        : ⏳ **SIRADAKİ OTURUMUN İLK İŞİ** — commit #2 henüz atılmadı.
BEKÇİ           : ⏳ yazılmadı.
```

## ⏭️ SIRADAKİ OTURUM BURADAN BAŞLAR — T6 commit #2

1. **UYGULA:** `tick.ts` → `AYRISMASIZ` kümesine `'leaving'` eklenir (ölçüm kolundaki
   `leavingAyrismasiz` dalı kalıcı hâle gelir, kol kaldırılır).
2. **BEKÇİ:** `tests/izdiham-t6.test.ts` — en az şunlar: `leaving` ayrışmadan muaf ·
   kalabalık çıkışta kilitlenmiyor (N dakikada nüfus düz) · `AYRISMASIZ`ın diğer üyeleri
   bozulmadı · silme hâlâ sokak noktasında oluyor.
3. **MUTASYON:** `tools/mutasyon-izdiham-t6.mjs` ile **en az 2** gerçek mutasyon.
4. **FİNAL TAM KOŞU:** `OLCUM=tam npx tsx tools/olcum-izdiham-t6.ts` — uygulanmış hâl
   S1 satırını birebir vermeli.
5. **commit #2** + D-140 raporun §Karar bölümüne.

**Ölçüm kolu (`izdihamKoluAyarla`) SİLİNMEZ:** C kolu ve ileriki nüfus turları onu kullanacak.

## AÇIK KALEMLER
- **C kolu ölçülmedi:** "tavan + çıkış payı" (`totalSeats + 2 + pay`) — sert tavan ister ama
  bağlamasın. Kullanıcı bunu istiyor; sayısı yok, o yüzden uygulanamaz (varyant kapısı).
- **KORUNUM çözünürlük sınırında:** tüm düzeltme kolları −%9…−%12 servis gösteriyor ama üç
  tohumun biri yönü ters çeviriyor ve nedensel yol yok. Daha çok tohum ya da servisi doğrudan
  hedefleyen bir koşu gerekir.
- **Bardak havuzu masa sayısıyla ölçeklenmiyor** (20 masaya 42, sürekli 0) → **T8 denge turu**.
- **Ölçüm dünyası kusuru DÜZELTİLDİ ama yalnız T6'da:** `olcum-nav-t5.ts` ve tarayıcı
  araçlarının `dunyaKur`u hâlâ `stationLevels` yazmıyor → "20 masaya seviye-0 ocak".
  Sonuçları geçersiz kılmaz (nav servise bağlı değil) ama düzeltilmeli.
- **G-82…G-91**: `docs/geribildirim-oyun-testi-2026-09-21.md`. G-82 ÖLÇÜLDÜ (1,773 br < 2,30).
  G-89 **yayından hemen önce**, kullanıcı notu.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi (`docs/reklam-raporu-f3.md`).
- **`npm run lint` 66 hatayla kırmızı** — hepsi `tools/` altında, T9'a bağlandı.
- **Sıra kilidi BEŞİNCİ yanlış pozitif** (D-133/134/138/139 + bu tur): araç `tick.ts`e dokunan
  her şeyi denge sayıyor, oysa turların yarısı oraya ölçüm dikişi koyuyor. Bu turda parmak
  iziyle davranış-nötr olduğu **ölçüldü** (`91925927`). Aracı düzeltmek kullanıcının kararı.

## SONRAKİ TURLAR (kullanıcı onaylı sıra)
1. **T6 commit #2** ← buradan başla
2. **T7 — G-82 pad çakışması + G-83/G-84 banket kademeli büyüme** (tasarım kanadı GÖSTERİLEREK)
3. **T8 — G-85 tost/çay mimarisi + G-90 tost asset'i + G-86 zincir denetimi + T3 denge + bardak havuzu**
4. **T9 — G-88 genel tarama** (kod + oynanış, ağırlık performans) + N2 yol önbelleği + lint 66
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
