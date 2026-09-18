# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-18 — **K-A BİTTİ · BÖLÜŞÜM ÖLÇÜLDÜ · DÜZELTME SIRADA**)

```
BİTEN (commit fc42a11) : K-A 60 fps tavanı — dört tuvalin hepsinde · bekçi 17 denetim / 4 mutasyon
                         + duman 3 denetim / 2 mutasyon · erken oyun 116,7 → 59,9 fps
KULLANICI KARARI       : K-E bırakıldı (tavanı karenin %3,1'i) · kasma kolu = "en mantıklı ve
                         kaliteli ne ise o" (delege edildi)
BU TURDA BULUNAN       : kollar bir tur boyunca YANLIŞ YARIYA bakmış — çizim karenin yarısı bile
                         değil; tek en büyük kalem `findNavPath` (her karede sıfırdan BFS)
ARAÇ                   : §F kare bölüşümü artık aracın kalıcı bölümü (`game/olcum.ts` dikişi,
                         DEV + opt-in) · `runTick` sistem listesi VERİYE çevrildi
SIRADAKİ               : N-1 (nav tamponunu yeniden kullan) — çıktısı BİREBİR aynı, bekçi kanıtlar
```

**§G'nin bulduğu (rapor `docs/perf-raporu-t4.md` §G, sayılar `olcum-perf-t4-son.txt` §F):**
`navStep` yürüyen her aktör için **her karede** tam BFS yapıyor, dönen yolun yalnız ilk
waypoint'ini kullanıp gerisini atıyor. Izgara **114×90 = 10.260 hücre**; her çağrı 41 KB
`Int32Array` ayırıp tamamını sıfırlıyor ⇒ kare başına ~726 KB çöp, ~180 bin hücre yazımı.
Seçilmiş C-kollarının (§F4) hepsi çizim tarafında ve gölgeye dokunamıyor — ortak tavanları
**ana geçiş**; `findNavPath` tek başına ondan büyük. C-kolları elenmedi, **sıraya alındı**.

## SIRADAKİ OTURUMUN İŞİ
1. **N-1** (`nav.ts`): kuşak damgalı kalıcı tampon → `new Int32Array(...).fill(-2)` kalkar.
   Bekçi: eski algoritmayı oracle alıp **birebir aynı yol** döndüğünü kanıtla (rastgele
   başlangıç/hedef çiftleri) + ≥ 2 mutasyon. Sonra `OLCUM=tam` ile §F'yi yeniden oku.
2. Kazanç yetmezse **N-2** (yol önbelleği) — o kol birebir aynı DEĞİL, ölçüp sormak gerekir.
3. Sonra C-kolları (§F4) ve T3 denge turu.

## AÇIK KALEMLER
- **T3 denge turu** (varyant kapısı, iki commit): K1 tepsi 75₺ · K2 garson tepsi tabanı ·
  K3 1. salonda 2. garson · K4 masa4 380₺ · K5 2. salonu geciktir · **K6 masa sırası
  (D-124 yeniden okunacak)** · K7/K8 seviye eğrisi+ödülü (**D-092 yeniden okunacak**) ·
  K9 bulaşık istifi · K10 tezgâhın duvar payı (+G-71 takılma) · K11 yükseltme noktası kapısı.
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi, onay gelmedi (`docs/reklam-raporu-f3.md`).
  G-67'nin "video ×2" kanadı buna bağlı.
- **`npm run lint` 66 hatayla kırmızı** ama hepsi bu oturumdan ÖNCE vardı ve `tools/` altında;
  dokunulan dosyalarda yeni hata yok (dosya-başı sayımla doğrulandı).
- **Sıra kilidi uyarısı** bu turun ölçüm commit'inde de çıktı (`tick.ts` ölçüm dikişi denge
  dosyası sayılıyor) — gerekçe D-138'de, diff'le doğrulandı, denge sayısı değişmedi.
  Ayrıca T1 ve T2a commit'lerinde çıkmıştı; gerekçe D-133 ve D-134'te kayıtlı —
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
