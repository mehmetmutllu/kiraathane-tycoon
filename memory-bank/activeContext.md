# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-18 — **T4 ÖLÇÜMÜ BİTTİ, KARAR ALINDI, KOD YAZILMADI**)

```
SORU            : 2026-09-18 geri bildiriminin 24 kalemi (G-58…G-81) hangi sırayla kapanır,
                  hangileri ölçümsüz kapanamaz?
PLAN            : docs/plan-geribildirim-2026-09-18.md — T1→T2→T4→T3→T5 (kullanıcı onaylı)
KALEMLER        : docs/geribildirim-oyun-testi-2026-09-18.md (kodda doğrulanmış köklerle)
BİTEN           : T1 (G-78 G-79 G-77 G-69 G-70) · T2a (G-59 G-60) · T2b (G-58 G-62 G-63 G-64 G-81)
KARAR           : D-133 (kalemler+sıra) · D-134 (T2a) · D-135 (T2b) · **D-136 (T4 kolları)**
ÖLÇÜLEN         : T4 — docs/perf-raporu-t4.md · ham: docs/olcum-perf-t4.{txt,json} (TAM koşu)
UYGULAMA        : **T4'ün kodu YAZILMADI** — sıradaki oturumun işi
BEKÇİ           : onarim-g58-g81 (14) · gorev-hatti-t2 (15) · kutlama-ogretme-t2b (24)
                  + gorev-kimligi'ye G-77 bekçisi → her tur **2 mutasyonla** doğrulandı
FİNAL           : vitest 1361/1361 · duman 45/45 · tsc temiz
```

**T4'ÜN DÖRT BULGUSU (tamamı raporda, burada tek satır):**
① **Yük ×6,6** — 8,3 ms/117 fps (erken) → 55,1 ms/**15,1 fps** (geç); çağrı 36→171, üçgen ×12.
② **SIZINTI YOK** — 3 dk aynı dünyada kare −%5,2, yığın **%0,0**, program sabit. Oyun *oynadıkça*
   değil *büyüdükçe* yavaşlıyor ⇒ "sızıntı ara" kolu kod aramadan ölçümle **elendi**.
③ **dpr kolu ÖLÜ, hatta ters** (+%6,6) ⇒ darboğaz fragment değil **CPU**. Gölgenin payı F2'deki
   %40'tan **%21,7**'ye düşmüş (geç oyunda gölge DIŞI maliyet büyüdüğü için).
④ **Şarjın kaynağı kasma değil:** `frameloop` yok, fps tavanı yok — erken oyunda **116,7 fps**.
## SIRADAKİ OTURUMUN İŞİ — T4 commit #2 (sıra: K-A → K-E → K-C)

Kullanıcı kararı (D-136): şarj → **K-A 60 fps tavanı**; kasma → *"kalite bozmadan ve düşürmeden
en mantıklı hamleler"* → **K-C** (instancing) + **K-E** (React commit 0,38→0). **K-B** (gölgeyi
kapat) kaliteyi düşürdüğü ve D-073 kullanıcının kendi kararı olduğu için **elendi**; **K-D**
(müşteri tavanı) geliri düşürür → **T3**.

**Kabul ölçütü SAYI LİSTESİ** (`docs/perf-raporu-t4.md` §Karar): erken fps **≤ 62** · geç çizim
çağrısı **171'den düşer** · commit/kare **≤ 0,05** · **gölge AÇIK kalır** · §B'de eğilim yok.
Final koşu: `OLCUM=tam node tools/olcum-perf-t4.mjs`.
## AÇIK KALEMLER
- **T3 denge turu** (varyant kapısı, iki commit): K1 tepsi 75₺ · K2 garson tepsi tabanı ·
  K3 1. salonda 2. garson · K4 masa4 380₺ · K5 2. salonu geciktir · **K6 masa sırası
  (D-124 yeniden okunacak)** · K7/K8 seviye eğrisi+ödülü (**D-092 yeniden okunacak**) ·
  K9 bulaşık istifi · K10 tezgâhın duvar payı (+G-71 takılma) · K11 yükseltme noktası kapısı.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi, onay gelmedi (`docs/reklam-raporu-f3.md`).
  G-67'nin "video ×2" kanadı buna bağlı.
- **`npm run lint` 66 hatayla kırmızı** ama hepsi bu oturumdan ÖNCE vardı ve `tools/` altında;
  dokunulan dosyalarda yeni hata yok (dosya-başı sayımla doğrulandı).
- **Sıra kilidi uyarısı** T1 ve T2a commit'lerinde çıktı; gerekçe D-133 ve D-134'te kayıtlı —
  diff'le doğrulandı, iki turda da **hiçbir denge sayısı değişmedi**.

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
