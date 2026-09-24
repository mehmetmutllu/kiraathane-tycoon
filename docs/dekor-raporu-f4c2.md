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

## Karar

*(boş — karar paketi sonrası)*
