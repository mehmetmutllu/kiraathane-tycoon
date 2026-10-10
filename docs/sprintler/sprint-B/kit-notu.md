# Sprint B · ② Kit kesimi — ara not (2026-10-10)

## Ne var
- `tools/ui-kit/anahtar.py` (çekirdek), `kes.py` (parça sayfası → `public/assets/ui/kit/*.webp` + `MANIFEST.json`),
  `izgara.py` (N×M ikon → `public/assets/ui/ikon/*.webp`), `ornek/sina.py` (sentetik sınama), `README.md`, `.gitignore`
  (örnek çıktı + önizleme repoya girmez; `sina.py` aynı sayfaları yeniden üretir).
- Kaynak: AI Dungeon `tools/icons/{key_magenta,s18_cut,slice,s25_cards}.py`. Alınan: macentalık ölçüsü `min(R,B)−G`, bağlı bileşen
  kesimi, satır sırası, s18'in 9-slice renk-profili yöntemi, önizleme. Değişen: alfa eğrisi + renk çözme (aşağıda).
- Ortam: Python 3.12, Pillow 12.3 (WebP var), numpy 2.5.3, scipy 1.18.1 — kurulum gerekmedi.
- `public/assets/ui/kit/**` ve `public/assets/README.md` satırı **henüz yok**: gerçek parça sayfası gelince yazılacak.

## Ölçümler (tam koşu, `python -I tools/ui-kit/ornek/sina.py`, ~16 sn)
Sentetik sayfa: 1536×1024, 20 parça (anti-aliased, gölgeli, biri parıltılı, biri kopuk rozetli, birinde mor taş) + 12 gürültü lekesi;
ikon: 1024×1024 4×4 (biri kopuk kıvılcımlı, biri hücre çizgisine taşan, mor/pembe içerikli), PNG ve JPEG q80.

| Girdi | Bulunan | Leke atıldı | En kötü sızıntı | Kenar alfa hatası (0-255) | IoU < 0.90 |
|---|---|---|---|---|---|
| UI PNG | 20/20 | 11 | %0.000 | 0.65–12.8 (ort ~5) | 0 |
| İkon PNG | 16/16 | 4 | %0.000 | 1.0–5.4 | 0 |
| UI JPEG | 20/20 | 10 | %0.015 | 7–19 | 5 (0.84–0.90, blok gürültüsü kutuyu birkaç px büyütüyor) |
| İkon JPEG | 16/16 | 14 | %0.000 | 9–17 | 0 |

- Alfa eğrisi ayarı (kenar ort. hata, PNG): eski sabit eğri payları (12/20) −13.6 yanlı / 15.1 → doğrusal (0/0) + taban 0.04: −3.6 / 5.3.
- **Mutasyon 1** renk çözme kapalı → 20/20 parçada sızıntı eşiği aşıldı (en kötü %99.8): denetim yakalıyor.
- **Mutasyon 2** `--koru 0` → mor taş/pembe ikon alfa hatası 0.9 → 9.6/11.4 (yarı saydam kalıyor); koru açıkken düzeliyor.
- `koru` ilk sürümü (yalnız uzaklık) parıltıyı ve gölge üstündeki kenarı opak yapıyordu (kare-secili 41, kıvılcım sızıntısı %1.4) →
  "düz ton + tohumdan yayılma" ile düzeldi.
- WebP `method=6` parça başı 0.74 sn → `method=4` (toplam 99 sn → 16 sn).

## Bilinen sınırlar
- **Parıltı + gölge üst üste** (kare-secili): üç renk karışımı tek ön renge çözülemez → kenar renk hatası 26 (PNG); dış kenarda
  hafif kırmızımsı ton. İstemde "dış parıltı yerine sert kontur" kuralı; gerekirse parıltı Sprint C'de CSS `filter: drop-shadow`.
- 9-slice'a uymayanlar: ilerleme çubuğu dolusu (sağ pay 144 → ray + dolgu ayrı kurulmalı), merkezinde süs olan kart. Rozet/nokta/
  kapatma haritada `dokuz:false`.
- Parçalar arası boşluk `2 × --birlestir` (12 px) altındaysa iki parça birleşir; istemde ≥ 24 px.
- JPEG yalnız yedek: kutular ±3-10 px oynar, kenar hatası ~2 kat. ChatGPT'den PNG indirilecek.

## Gerçek sayfa gelince
1. Sayfayı `docs/tasarim/sprint-B/` altına koy, `kes.py` haritasız bir kez çalıştır → `onizleme/kit.png` ile sırayı gör.
2. `tools/ui-kit/harita.json` yaz (sıra → ad, `dokuz:false`, gerekirse `pay`) → yeniden çalıştır; UYARI 0 olmalı.
3. `public/assets/README.md`'ye kit satırı (kaynak: ChatGPT, lisans: kendi üretimimiz) + defter.
