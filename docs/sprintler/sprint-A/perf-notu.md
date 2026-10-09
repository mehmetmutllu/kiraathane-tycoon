# Sprint A ④ — Performans Paket 1 ara notu

Araçlar (bu klasörde, `perf/`): `perf-olc.mjs shot|kare <etiket>` · `fark.mjs <a> <b> [fark]`. Sunucu: `vite dev --port 4100`.

## Kare işi — telefon öykünmesi (412×915 @2,625 · CPU 4× · gerçek GPU RTX 3060/D3D11 · gölge açık `?f2golge=2048`)
Geç oyun (tüm pad, masa/ocak tavanda, 120 sn ısınma, ~58 NPC). `perf.isMs` = `advance()` süresi; 3 × 6 sn dilim, ortanca.
Sıralı koşu (ABBA değil — iki ayrı kod sürümü); ham: `perf/kare-once.json`, `perf/kare-sonra.json`.

| durum | önce isMs p50 | sonra isMs p50 | çizim çağrısı önce → sonra |
|---|---|---|---|
| oyun (panel yok) | 60,2 · 64,0 · 69,9 | 39,4 · 41,3 · 43,5 (≈ −%36) | 209–225 → 115–119 |
| mağaza açık | 64,3 · 58,9 · 69,7 | 11,2 · 12,0 · 13,5 (≈ −%81) | sahne 0 kare/sn |

## Görüntü (sabit kadraj, sahte saat, sim dondurulmuş, SwiftShader)
- Gürültü tabanı (önce↔önce): sahne 0 px, sahne2 1 px.
- Önce↔sonra: sahne **2 px** (%0,001), sahne2 **0**, zemin/duvar/dekor önizlemeleri **0**.
- İlk sürümde 374 px fark vardı: görünmeyen müşterinin biriken animasyonu, yürürken değişen hızla tek adımda
  ilerliyordu. Klip VEYA hız değişince birikenin boşaltılmasıyla 2 px'e indi. Deney: animasyon atlama kapalıyken
  (yalnız kırpma + paylaşılan geometri + Merged + PCF) fark 0.
- Masa teması önizlemesi çekilemedi (geç oyun kurulumunda sekme kilitli) — aynı `demand` deseni, model yüklenmesi
  React commit'iyle çizimi tetikliyor.

## Duman
- Taban (değişiklikten önce): 28/29 — görevler paneli başka ajanın yarım işinde kırıktı; kare denetimine varılmadı.
- Sonra: **74/74**. Yeni: panel açıkken sahne 0 kare, önizleme ≥1, durağan dekor önizlemesi çizdi, kapanınca sahne sürüyor.
- Kararlı durumda durağan önizleme 0 kare/2 sn (zemin, duvar, kilitli dekor); kıyafet önizlemesi (animasyonlu) ~40/sn.
