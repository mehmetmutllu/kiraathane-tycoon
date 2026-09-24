# F4c-2 — 💎 dekor yuvaları raporu

**Soru.** Kullanıcı (2026-09-24) şunu istedi: dekor adayları salonun bugünkü planında gösterilsin, **düzen değişmesin**, dekor boş yerlere sığsın. Aday karelerinde dekor duvara gömülüyordu.

**Araç.**
- `tools/olcum-dekor-yuva-f4c2.ts`: yuva geometrisi, yürüme trafiği, etkileşim noktasına mesafe, katı engeller ve duvar profili payı.
- `tools/dekor-harita.mjs`: oyunun üstten plan karesi ve oyun kamerası kareleri. Kareler DEV `__izdusur` kancasıyla çekilir.
- `tools/dekor-harita-sayfa.mjs`: inceleme sayfası.

**Ham çıktı.** `docs/olcum-dekor-yuva-f4c2.txt` (tam koşu). Isı haritası `docs/gorsel/ss/f4c2-isi-{1,2,3}.json`.
**İnceleme sayfası:** https://claude.ai/artifact/YbqrWF1n4H9F96QMsMr1tv

## Bulgular (tam koşu: dönem başına 240 sn ısınma + 900 sn kayıt, örnek 0,1 sn)

| # | Bulgu | Sayı |
|---|---|---|
| B1 | Ölçüm kör değil. Kapının 1,5 br içindeki 1,2 br'lik denetim kutusunda trafik ölçüldü. | dönem 1 %41,1 · dönem 2 %42,6 · dönem 3 %62,6 |
| B2 | 10 yuvanın 10'unda, üç dönemin hepsinde, aktör gövdeye girmiyor. | trafik %0,0 |
| B3 | En yakın etkileşim noktası (pad, yükseltme, servis, masa, koltuk, kapı, lavabo) sınırın dışında. Sınır `TABLE_UP_RADIUS` 1,0. | en az 1,81 (D6) · en çok 4,72 (D1) |
| B4 | Katı engelle ve bugünkü dekorla çakışma yok. Yuvalar birbiriyle de çakışmıyor. | 0 / 0 / 0 |
| B5 | Duvar profili üç katmanlı: lambri 0,22 · çıta 0,26 · gövde 0,18. Yere oturan eşyanın sırtı ÇITAYA değer. Bugünkü `WALL_BACK` gövde yüzüne (17,41) dayanıyor, yani konsol/TV ünitesi lambriye 0,02, çıtaya 0,04 gömülü. Yuvalar çıtanın 0,05 önünde. | yuva payı 0,050 (hepsi) · bugünkü konsol −0,04 |
| B6 | Görünürlük dönemi: arka köşeler ve lavabo duvarı (8 yuva) 3. Salon açılmadan çizilmiyor (D-057). Yılbaşı A 1. Salon'da, yılbaşı B 2. Salon'da açılıyor. | 1. Salon'da 1 yuva · 2. Salon'da 2 · 3. Salon'da 10 |
| B7 | Kadraj: dikey telefonda yan duvardaki eşya ancak oyuncu o köşeye yürüyünce okunuyor. Lavabo duvarı tam karşıdan görünüyor. | kadrajlar `f4c2-kadraj-*.png` |

## Karar (D-155 · kullanıcı 2026-09-24)

1. **Yerleşim olduğu gibi** — 9 ürün yuvası (commit #1 kodları: D1 radyo · D7a koltuk · D7b lamba · D10 tablo · D3 semaver ·
   D6 gramofon · D5 kanarya · D2 saat) · yuvalar `config/decor.ts` `VITRIN_YUVALARI`.
2. **Yılbaşı A** (sol ön) — B (sağ ön pencere altı) elendi. Koltuk ×0,50 + halı ×0,70 → yuva 1,40 × 1,45.
3. **Kilitli** — yuvanın salonu açılmadan vitrinde "N. Salon açılınca", satılmaz, çizilmez.

## Uygulama ve final (tam koşu, PAY 0,02)

| Kalem | Sayı |
|---|---|
| Final trafik (9 yuva × 3 dönem) | %0,0 · denetim %41,1 / %42,6 / %62,6 |
| En yakın etkileşim noktası | 1,83 (gramofon) … 4,74 (radyo) |
| Duvar payı (profil) | 0,020 hepsi · konsol/TV/petek 17,41 → 17,35 (B5 kapandı) |
| Çizim ⊆ yuva | 9/9 (ilk koşuda radyo 0,9018 > 0,90 yakalandı → yuva 0,91) |
| Bekçi | `tests/vitrin-dekor-f4c2.test.ts` 22 test · mutasyon 14/14 · duman 60/60 · vitest 1626 |
| Kareler | `docs/gorsel/ss/f4c2-oyun-*.png` · `f4c2-magaza-*.png` (`tools/shot-f4c2.mjs`) |

**Mutasyonun gösterdiği zayıflık:** ilk sınavda M4/M5 (yuva petek/TV'nin içine) KAÇTI. Sebep: test `MAX_AREAS`ı `layout`tan
alıyordu (dışa açık değil → undefined); dönem döngüleri dönmüyor, `decorItems(undefined)` yalnız kapı takımını veriyordu.
Düzeltildi ve "boş küme" bekçisi eklendi (üç dönem · konsol/TV/petek listede · 9 yuva).
**Duman:** 4 koşudan birinde "İzle, 2× al" adımı zaman aşımına düştü; sonraki 3 koşu 60/60 — kararsız, dekor adımıyla ilişkisi görülmedi.
