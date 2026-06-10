# Asset Manifesti

> KURAL: Lisansı belirsiz hiçbir asset commit'lenmez. Greybox-first — her şeyin ilkel
> şekil karşılığı var, model olmadan oyun tam oynanır. Modeller `models/`, sesler `audio/`.

Stil kilidi: **Quaternius / Kenney (CC0)** low-poly. Türk objeleri: AI üretimi (Meshy/Tripo).
Detay: `docs/assets.md`.

## Karakterler (`public/assets/models/characters/` — WP3, 2026-06-11) ✅
Kaynak: **Quaternius Ultimate Modular Men + Women** (CC0 1.0 Universal — License.txt indirildi/doğrulandı;
https://quaternius.com/packs/ultimatemodularcharacters.html + ultimatemodularwomen.html).
`tools/optimize-chars.mjs` ile hazırlandı: yalnız Idle/Idle_Neutral/Walk/Run/Wave/Interact animasyonları
kaldı (24→6), resample+dedup+prune+quantize (KHR_mesh_quantization — three.js native, decoder yok),
.gltf→.glb (~3MB→~0.95MB/model). Yükleyici: `src/components/three/Character.tsx` (fallback: primitive).

| Dosya (.glb) | Oyundaki rol | Lisans | Durum |
|---|---|---|---|
| Worker.glb | OYUNCU (çaycı/sahip) | CC0 | ✅ |
| Suit.glb | Garson | CC0 | ✅ |
| Casual_Hoodie.glb | Bulaşıkçı + müşteri havuzu | CC0 | ✅ |
| W_Casual.glb | Çaycı NPC (tezgâh arkası) + müşteri havuzu | CC0 | ✅ |
| Casual_2 / Farmer / Punk / Adventurer / W_Formal / W_Suit .glb | Müşteri çeşitlilik havuzu | CC0 | ✅ |

> NOT: Pakette Sit/Carry animasyonu YOK (oturan müşteri tabure içine gömülür; tepsi elde sabit grup).
> Sit/Carry için Universal Animation Library **Pro ($9.99)** sabah kararı bekliyor (feedback §F).

## Modeller (`public/assets/models/`)
| Dosya (.glb) | Açıklama | Greybox karşılığı | Kaynak | Lisans | Durum |
|---|---|---|---|---|---|
| table.glb | Masa | box + 4 silindir | Kenney | CC0 | ⏳ greybox |
| chair.glb | Sandalye | box | Kenney | CC0 | ⏳ greybox |
| tea_station.glb | Çaydanlık/semaver istasyonu | box + silindir | AI (Meshy) | doğrula | ⏳ greybox |
| samovar.glb | Semaver (Türk) | silindir+küre | AI (Meshy) | doğrula | ⏳ greybox |
| tea_glass.glb | İnce belli çay bardağı | küçük silindir | AI (Meshy) | doğrula | ⏳ greybox |
| okey_set.glb | Okey takımı | box | AI (Meshy) | doğrula | ⏳ greybox |
| nargile.glb | Nargile | silindir+küre | AI (Meshy) | doğrula | ⏳ greybox |
| copper_pot.glb | Bakır demlik | silindir | AI (Meshy) | doğrula | ⏳ greybox |
| coin.glb | Para (₺) | sarı silindir | Kenney | CC0 | ⏳ greybox |
| pad.glb | Satın-alma pad'i | düz silindir | (basit) | — | ⏳ greybox |

## Fontlar (`public/assets/fonts/`)
| Dosya | Açıklama | Kaynak | Lisans | Durum |
|---|---|---|---|---|
| Baloo2.ttf | 3D zemin yazıları (drei Text/troika; TR latin-ext) — variable | Google Fonts (google/fonts repo) | OFL 1.1 | ✅ eklendi |

> UI fontları (Baloo 2 + Lilita One) npm `@fontsource/*` paketlerinden YEREL bundle'lanır
> (main.tsx; CDN yok). İkisi de OFL 1.1.

## Sesler (`public/assets/audio/`)
| Dosya | Açıklama | Kaynak | Lisans | Durum |
|---|---|---|---|---|
| ambience_loop.ogg | Kıraathane ortam uğultusu | Pixabay/Freesound | CC0/doğrula | ⏳ |
| coin_pickup.ogg | Para toplama | Kenney | CC0 | ⏳ |
| tea_pour.ogg | Çay dökme | Freesound | CC0/doğrula | ⏳ |
| okey_tile.ogg | Okey pulu | Freesound | CC0/doğrula | ⏳ |
| pad_fill.ogg | Pad dolma | Kenney | CC0 | ⏳ |
| purchase.ogg | Satın alma | Kenney | CC0 | ⏳ |

Durum: ⏳ greybox (model/ses yok, ilkel kullanılıyor) · ✅ eklendi (lisans doğrulanmış).
