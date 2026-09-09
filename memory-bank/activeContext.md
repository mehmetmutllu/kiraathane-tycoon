# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **S3 BİTTİ** · Faz S 3/12 · 78/96)

```
SORU            : Mutfak KayKit'e nasıl geçer — modelin ölçeği ne, ve hangi parçalar
                  gerçekten takas edilebilir?
ÖLÇÜLECEK KOLLAR: yok — sanat turu, varyant kapısı tetiklenmedi (economy/tick/rules açılmadı).
                  Kapı: `npm run test` + `npm run duman` + `tsc -b`.
SAYILAR         : `tools/model-olc.mjs` (yeni): KayKit restaurant-bits 2×2 modül karosunda —
                  tezgâh 2,00 × 1,00 × 2,04 · duvar 4,00 · `chair_A` 0,75 (furniture-bits ile
                  AYNI ham ölçek) → paket ölçeği **0,90**, mimari ölçek 0,80 REDDEDİLDİ
                  (tezgâh üstü masa üstüyle aynı hizaya düşüyordu). `tools/atlas-goz.mjs` (yeni):
                  UV → atlas gözü — [3,6] tezgâh · [1,1] fırın/ocak · [1,2] soğutucu.
KARAR           : D-099. Ölçek 0,90 · kasa 0,45 · ön hat collision kutusuna çekilir · çekmeceler
                  MUTFAĞA bakar · **palet KayKit'in kendi paleti** (kullanıcı) · menü panosu kalktı.
UYGULAMA        : `kitchenLook.ts` (ölçü/ankraj, React'siz) + `Kitchen.tsx` (çizim) ·
                  arka duvarda 7 modül + batı dönüşü + depo · duvarda 2 dolap + davlumbaz ·
                  ön hattaki üç tezgâh (`kayGovde`) · maket parçaları SİLİNMEDİ, fallback oldu.
BEKÇİ           : `tests/kitchen-look.test.ts` 15 test · **4 mutasyon** (ölçek 0,90→1,00 ·
                  kasa 0,45→0,90 · ortalama kayması silindi · ön hat salona döndürüldü) — dördü
                  de yakalandı. vitest **785** · duman **42/42** · `tsc -b` temiz.
```

**Turun en pahalı bulgusu bir test boşluğu:** `npm run build` **temiz ağaçta da kırıktı.**
`tsc -b` HUD'da S2'den kalan ölü bir dal buldu (`notice.kind !== 'quest'`, oysa tip artık
`'level' | 'reveal'`). `npm run test` bunu göremez — vitest tip denetlemez — ve kapanış
protokolü `build` çalıştırmıyor. **Ders: yeşil test paketi "derleniyor" demek değil;
kapanışa `tsc -b` girmeli** (`oturum-bitir` adım 2'ye eklenmeli, henüz eklenmedi).

**İkinci ders — paketin modül karosu her obje için ölçek değildir.** KayKit her şeyi 2×2'lik
karoda yazıyor; kasa da öyle. 0,90'da kasa 1,80 br oldu ve arkasındaki fırını kapattı. Küçük
prop kendi gerçek boyunu ister (0,45 → 0,90 × 0,36; iki kasa yan yana tam bir modül eni).

**Renk bir kusur değil, bir ÜRÜN KALEMİ oldu.** Kıraathane tonuna boyanmış varyant üretildi ve
gösterildi (`docs/gorsel/ss/mutfak-varyant-*.png`); kullanıcı *"her şey çok kahve kalıyor, biraz
daha renkli olsun istiyorum"* deyip KayKit'in kendi paletinde kaldı ve ekledi: **farklı renkler
ileride TEMA olarak satılabilir.** Boyama hattı ölçülü ve hazır bekliyor (iki yeni araç).

## SIRADAKİ TAM ADIM

**S4 — duvar + zemin KayKit'e geçer.** `MaketWall` yerine `wall` / `wall_half` /
`wall_decorated` / `pillar_A·B`; mutfak zemini `floor_kitchen`. Dikkat: KayKit duvarı native
**4,0**, oyununki `WALL_H` **3,2** → mimari ölçek **0,80** (D-099 §1'de ölçüldü, mobilyanınkinden
farklı ve öyle kalmalı). Renk `recolor.ts` atlas kopyasıyla.
S4-S7 indirme ve onay İSTEMİYOR — diskteki 185 KayKit modeliyle yapılacak iş.

**KULLANICI KARARI BEKLEYEN ÜÇ ŞEY** (hiçbiri S4-S7'yi bloklamıyor):
1. **Ses kaynağı** (S8) — asset panosu §7, dört kol. D-096'yı kısmen geri alır.
   **Walla tuzağı yazılı:** hazır kafe ambiyansında anlaşılır yabancı konuşma var.
2. **Karakter kolu** (S12) — asset panosu §3, altı kol, bedelleri yazılı.
3. **H2 yükseltme sırası** (A tek hedef / B kuşak) ve **H3 masa aralığı** (K1 aralığı aç /
   K2 oturak küçült — K2 önerilmiyor, `feedback_reference_scale_trap`).

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- **`tsc -b` kapanışa girmeli** — bu turda elle yakalandı, kural olmadıkça yine kaçar.
- **G-01 çay/bulaşık toplama masanın her tarafından olmuyor · G-02 çay ocağından alma güvenilmez ·
  G-03 2. masa görevinde kamera kendiliğinden kayıyor** — üçü de HATA, kendi turunu ister.
- **G-05 görev metinleri açıklayıcı değil** — altta net hedef, üstte kısa lakap (yazım işi).
- **G-06 tepsi ilk yükseltme 75 → ~50 · G-07 yükseltme dwell'i para-bağımsız sabit olsun** —
  ikisi de DENGE, varyant kapısına tabi, **ölçülmeden uygulanmaz** (Faz H'de H2 ile aynı turda).
- **Masalar geçilmiyor (ÖLÇÜLDÜ, uygulanmadı):** geçiş 2 × playerRadius = 0,94 br ister; ön salon
  3,50 br rahat, **arka salon 0,68 br** → 20 masanın 12'si geçilemez, 52 açıklık eşik altında.
  İki kol `docs/geribildirim-oyun-testi-2026-09-09.md` sonunda. (H3.)
- **Oto-toplama toast'ı bir TOPLAMI tek olay gibi gösteriyor** — tek ödemenin tavanı 44 ₺;
  metne adet eklemek `tick.ts`'e dokunuyor, kullanıcı onayı bekliyor.
- **G-16 arayüz kahverengi/iç karartıcı → mavi · G-17 ekranlar tam-ekran mı modal mı · G-10 pad
  şekli** — kullanıcı "bilemedim" dedi; **maket görmeden koda girmemeli**.
- **G-18 masaya tıklayınca seviye gözüksün mü** — kullanıcı düşünüyor, açık soru.
- **`.gitattributes` YOK** — `core.autocrlf=true` her checkout'ta metin dosyalarını CRLF'e çeviriyor.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün ikinci oturumda sessiz
  kalıyor; kural "sayaç arttıysa kart da artmalı" olmalı.
- **Damacana rafı ve çay bardağı duvar rafı elle çizili kalıyor** — KayKit'te Türk kıraathanesi
  eşyası yok. Kendi modelini yaptırmak S12'nin (karakter/özel model) konusu.

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
