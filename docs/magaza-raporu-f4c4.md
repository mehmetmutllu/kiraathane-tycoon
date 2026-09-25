# F4c-4 — dekor yerinde önizleme + satın alma metinleri raporu

**Soru (kullanıcı 2026-09-25):** *"dekorları oyunda nasıl görünecek görse o an daha iyi olmaz mı uzak bir açıdan 21.
fotodaki gibi ama daha profesyonel · metinler üzerinde microcopy üzerinde çalışılması gerek, satın alımlar için olan
uyarılar çok boğuk geldi gözüme mesela 23'teki"* (kareler: https://claude.ai/artifact/WSH385msDgxYkCZUMbwbMj).

Denge dosyasına dokunmayan görsel/metin turu; ölçü = aday kareleri (feedback_show_dont_ask).
Karar paketi: https://claude.ai/artifact/Uysjk79bfpLWpP7r35ntQi

## Araçlar
- `tools/aday-dekor-f4c4.mjs` — gerçek sahne, ayrı kamera, önizleme kutusunun en-boyunda (720 × 660). 5 eşya × (boş · A oyun
  açısı uzak · B vitrin yakın · C vitrin uzak). Oyun kodu değişmez (tuval geçici boyutlanır, `gl.render` + `toDataURL`).
- `tools/aday-teklif-f4c4.mjs` — teklif kartı oyunun içinde yerinde değiştirilir (gerçek font/ışık/önizleme): T0 bugün · T1 · T2 · T3.
- `tools/shot-magaza-son.mjs` — mağaza turu (22 kare), bulguların kaynağı.

## Bulgular
| # | Bulgu | Kaynak |
|---|---|---|
| B1 | Oyun kamerası yuvaya odaklanınca dikey karenin ~yarısı dış çimene düşüyor (duvar kenarı) → oyun kamerası önizleme için uygun değil; ayrı kamera gerek | ilk aday turu |
| B2 | Vitrin açısı duvara dik bakınca yan duvar eşyasında kare boş duvar; duvar boyunca (güneyden) 3/4 bakınca oda karenin yarısı | ikinci aday turu |
| B3 | A (oyun açısı uzak) semaver/tablo'yu kutuda ~20-30 px boyda gösteriyor — okunmuyor | montaj |
| B4 | Teklif kartında 100 💎 = kartın en küçük yazılarından (p4); kıyafet gri cümle içinde; CTA'da yalnız fiyat | kare 23 |
| B5 | Satın alma sonrası geri bildirim YOK (bildirim/ses/ödül ekranı) — kart sessizce "Sahipsin" olur | `HUD.tsx` Paketler/ShopPanel |
| B6 | Paketler alt notu kesiliyor (yarım satır) | kare 13 |
| B7 | Kilitli dekorun düğmesi yeşil (yalnız soluk); satır ve düğme aynı cümle | kare 11 |
| B8 | 3 elmas paketi aynı adla ("Elmas"); "Mağaza hazır değil" sebep/çözüm söylemiyor | kare 13 |

## Kollar
- **Dekor:** A oyun açısı uzak · B vitrin yakın · C vitrin uzak (küçük eşyada B mesafesi). Öneri C.
- **Teklif:** T1 büyük sayı · T2 iki karo · T3 ışıklı kart. Öneri T3 ("Bir kereye özel" → "Bir kez alınabilir").
- **Metin:** 14 satır eski → yeni (karar paketinde tablo). 14. satır yeni davranış (alım bildirimi + ses + paket ödül ekranı).

## §Karar
_(boş — kullanıcı seçecek)_
