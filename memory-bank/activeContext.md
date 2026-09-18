# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-19 — **T5 · NAV TURU · ÖLÇÜM AÇIK**)

```
SORU            : findNavPath karenin %31,5'i (12,71 ms · 20,5 çağrı/kare · 0,62 ms/çağrı).
                  Bu maliyetin NE KADARI tampon ayırma, ne kadarı BFS'in kendisi?
                  Birebir-aynı kollar yetiyor mu, yoksa davranış değiştiren kol mu gerekiyor?
ÖLÇÜLECEK KOLLAR: (kod YAZILMADAN, hepsi varyant)
                  — BİREBİR AYNI ÇIKTI (varyant kapısı gerekmez, bekçi kanıtlar):
                    N1a kalıcı tampon + kuşak damgası (41 KB Int32Array alloc+fill/çağrı kalkar,
                        kuyruk dizisi ve nearestFreeIdx'in Uint8Array'i de kalıcıya döner)
                    N1b hedef testi POP yerine PUSH'ta (son katman genişletilmez)
                    N1c hedef hücre maskesi önceden (her pop'ta cellCenter + mesafe kalkar)
                  — DAVRANIŞ DEĞİŞİR (seçilirse varyant kapısı + kullanıcı kararı):
                    N2  yol önbelleği (navStep kare-atlamalı yeniden kullanım)
                    N3  A* / en-iyi-öncelikli (ziyaret edilen hücre düşer, yol TIE-BREAK değişir)
SAYILAR         : docs/nav-raporu-t5.md §3 · ham docs/olcum-nav-t5.txt (TAM koşu, damgalar temiz)
                  taban 0,343 ms/çağrı · N1a ×1,20 · N1b ×2,10 · N1c ×2,37 (üçü BİREBİR AYNI,
                  12.000 çağrıda 0 fark) · N3 A* ×3,04 ama ilk waypoint'in %27,5'i farklı ·
                  N2 önbellek BFS'i %0,6'ya indiriyor AMA duvardan geçen adım %1,9 (kontrol %0,1)
                  AÇILIŞ VARSAYIMI ÇÜRÜDÜ: tampon ayırma tabanın yalnız %10,3'ü
KARAR           : (adım 3 — karar paketi kullanıcıya sunulacak)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Turun dayanağı (D-138, `docs/olcum-perf-t4-son.txt` §F):** kare 40,3 ms · ana geçiş %50,1 ·
useFrame %49,4; `tick()` içinde `npcSystem` %24,5, ve bunların İÇİNDEN `findNavPath` **%31,5**.
Izgara 114×90 = 10.260 hücre. `navStep` her karede tam BFS yapıp dönen yolun yalnız ilk
waypoint'ini kullanıyor. **Uyarı (D-138'in dersi):** toplamı ölçmek kolun yerini göstermez —
bu tur da `findNavPath`in İÇİNİ bölüşür, kol seçmeden önce.

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
