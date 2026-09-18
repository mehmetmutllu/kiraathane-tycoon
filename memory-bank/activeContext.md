# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-19 — **T5 NAV BİTTİ · KARE KAZANCI TARAYICIDA DOĞRULANAMADI**)

```
SORU            : findNavPath karenin %31,5'i. Maliyetin nesi pahalı, birebir-aynı kollar yeter mi?
ÖLÇÜLECEK KOLLAR: N1a kalıcı tampon · N1b hedef testi PUSH'ta · N1c hedef maskesi (birebir aynı)
                  N2 yol önbelleği · N3 A* (davranış değişir)
SAYILAR         : docs/nav-raporu-t5.md §3 · ham docs/olcum-nav-t5.txt (TAM koşu, damgalar temiz)
                  taban (oracle) 0,456 ms/çağrı · N1a ×1,17 · N1b ×2,11 · N1c ×2,29
                  ÜRETİM ×2,52 · N3 ×3,00 (ilk waypoint'in %27,5'i farklı)
                  N2 BFS'i %0,6'ya indiriyor AMA duvardan geçen adım %0,1 → %1,9
                  AÇILIŞ VARSAYIMI ÇÜRÜDÜ: tampon ayırma tabanın yalnız %10,3'ü
KARAR           : D-139 — kullanıcı "N1c uygula, dur" dedi. N3 elendi, N2 kendi turuna.
UYGULAMA        : src/game/nav.ts — kalıcı tamponlar + kuşak damgası, hedef testi push'ta,
                  hedef maskesi önceden. Dışarıya bakan hiçbir şey değişmedi.
BEKÇİ           : tests/nav-kol-t5.test.ts (9 denetim · oracle tools/nav-oracle.ts · ~4.200 çift)
                  tools/mutasyon-nav-t5.mjs ile 7/7 GERÇEK mutasyon (+1 eşdeğer)
```

**⚠️ TURUN AÇIK UCU — kare kazancı KANITLANMADI.** Node'da ×2,52 sağlam (aynı süreç, donmuş
oracle, 97.486 gerçek çağrı, iki dünyada aynı oran). Ama tarayıcı koşusu
(`docs/olcum-perf-t4-t5.txt`) bunu **göstermedi** ve T4 tabanıyla **karşılaştırılamaz**:
T4'ün §F'i gölge KAPALI ölçmüş (0,2 ms), bu koşu gölge AÇIK (17,5 ms); ayrıca makine genel
olarak %22-38 yavaş (nav'la ilgisiz kalemler de büyümüş). Üstelik normalize edilince
`findNavPath` çağrı başına ×1,66 artmış, genel yavaşlama ×1,22-1,38 — yani **kareye göre daha
pahalı** görünüyor. Açıklaması bulunamadı. Detay: `docs/nav-raporu-t5.md` §6.

## SIRADAKİ OTURUMUN İŞİ
1. **T5b — tarayıcı A/B'si AYNI OTURUMDA.** Üretim kodu ve `tools/nav-oracle.ts` arka arkaya,
   **gölge durumu sabitlenmiş**, aynı makine yükünde. §G'nin dersi (oran karşılaştır, mutlak
   değil) tarayıcı tarafında da uygulanmalı. Bu, T5'in kare iddiasını ya doğrular ya çürütür.
   Çürütürse: kod yine de doğru ve çıktı-eşdeğer, ama "hızlandırdı" cümlesi geri alınır.
2. Sonra **N2 turu** (yol önbelleği): güvenli politika (waypoint'i komşu hücreyle sınırla +
   kuşak damgasıyla tazele) yazılıp duvardan geçen adım **0**'a inmeli; kazanç potansiyeli
   BFS çağrılarının %99,4'ü.
3. Sonra C-kolları (T4 §F4) ve **T3 denge turu**.

## AÇIK KALEMLER
- **T3 denge turu** (varyant kapısı, iki commit): K1 tepsi 75₺ · K2 garson tepsi tabanı ·
  K3 1. salonda 2. garson · K4 masa4 380₺ · K5 2. salonu geciktir · **K6 masa sırası
  (D-124 yeniden okunacak)** · K7/K8 seviye eğrisi+ödülü (**D-092 yeniden okunacak**) ·
  K9 bulaşık istifi · K10 tezgâhın duvar payı (+G-71 takılma) · K11 yükseltme noktası kapısı.
  **Artık koşabilir:** `npm run sim` ve tüm tsx ölçüm araçları T5'te onarıldı (D-139 §0).
- **F3 (AdMob) kararı HÂLÂ bekliyor** — C1′ önerildi, onay gelmedi (`docs/reklam-raporu-f3.md`).
- **`npm run lint` 66 hatayla kırmızı** ama hepsi bu turdan ÖNCE vardı ve `tools/` altında.
- **Sıra kilidi uyarısı DÖRDÜNCÜ kez çıktı** (D-133 · D-134 · D-138 · şimdi D-139): araç
  `tick.ts`i denge dosyası sayıyor, T5'te oraya dokunan şey **tek satırlık** node-güvenlik
  düzeltmesiydi. Diff'le doğrulandı, hiçbir denge sayısı değişmedi. Aracın ayırt etme
  yeteneğini düzeltmek kullanıcının kararı — bu turda dokunulmadı.

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
