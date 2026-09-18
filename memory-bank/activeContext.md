# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-18 — **K-A BİTTİ · K-E/K-C YENİDEN SORULDU**)

```
SORU            : T4'ün seçilen üç kolu (D-136) koda nasıl iner ve kabul ölçütleri tutuyor mu?
KARAR (önceki)  : D-136 — K-A + K-C + K-E seçilmişti
UYGULAMA        : K-A ✅ (60 fps tavanı, DÖRT tuvalin hepsinde) · K-E ⛔ · K-C ⛔
BEKÇİ           : tests/kare-tavani-t4.test.ts (17) → 4 mutasyon · duman +3 denetim → 2 mutasyon
SAYILAR         : docs/olcum-perf-t4-son.{txt,json} (TAM, temiz makine) · rapor §F
KARAR (yeni)    : D-137 — K-E ve K-C'nin TARİFİ ölçümle çürüdü, kod yazılmadı, kullanıcıya soruldu
FİNAL           : vitest 1380/1380 · duman 48/48 · tsc temiz
```

**K-A — tuttu:** erken oyun **116,7 → 59,9 fps**; §E aynı koşuda kanıtladı (tavan YOK 133,8 →
tavan 60 **59,7** → tavan 30 29,9) ve karenin **İŞİ** üç kolda da 6,4-7,9 ms, çizim çağrısı
birebir **36** — yani tavan hiçbir şeyi ucuzlatmıyor/bozmuyor, **boşa çizilen kareyi** kesiyor.
Gölge açık kaldı, §B'de sızıntı yok (yığın %0,0).

**NEDEN K-E/K-C DURDU (ikisi de ölçüldü, ikisi de tarifine uymadı):**
- **K-E** "commit 0,38 → 0" idi. React `<Profiler>`: geç oyun karesinin **%3,1'i** (2,12 ms /
  ~64 ms). Ve "0" ulaşılamaz — commit'i doğuran `notice`/`wallet`/`cleanCups`/`dishes`/`xp`
  **gerçek arayüz içeriği**; her-kare-değişen veri zaten D-055'te çıkarılmıştı.
- **K-C** "instancing: masa/sandalye/para/NPC" idi. Geometri **151 nesne / 88 şekil**, materyal
  **132 / 77** (%42 boşa kopya) — ama **en çok tekrarlayan 11 şeklin 10'u iskeletli**;
  `InstancedMesh` iskeletli mesh'i instance EDEMEZ. K-C tek iş değil, dört ayrı iş (§F4).

## SIRADAKİ OTURUMUN İŞİ — kullanıcının KARAR PAKETİ cevabı
Rapor §F4'teki dört kol (C-1 paylaşım · C-2 gölge dökenleri · C-3 BatchedMesh · C-4 iskeletli
karakterler) + K-E'nin %3,1'i sürüp sürmeyeceği. Seçilen kol uygulanır → bekçi → final tam koşu.

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
