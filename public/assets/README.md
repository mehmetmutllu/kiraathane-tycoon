# Asset Manifesti

> KURAL: Lisansı belirsiz hiçbir asset commit'lenmez. Greybox-first — her şeyin ilkel
> şekil karşılığı var, model olmadan oyun tam oynanır. Modeller `models/`, sesler `audio/`.

Stil kilidi: **KayKit (Kay Lousberg, CC0)** low-poly. Türk objeleri gerekirse AI üretimi (Meshy/Tripo).
Detay: `docs/assets.md`.

## Modüler model yapısı (`public/assets/models/<paket>/`)
Her asset paketi **kendi klasöründe**, self-contained (gltf + bin + texture göreli yolla bağlı).
Yeni paket eklemek = yeni klasör bırak; mevcut paketlere dokunma. Vite `public/`'i kökten
servis eder → URL: `/assets/models/<paket>/<isim>.gltf`. Loader: `components/three/Model.tsx`
(`useGLTF`, .gltf/.glb; src yoksa veya hata olursa ilkel şekle düşer — oynanış kodu değişmez).

| Paket klasörü | İçerik | Kaynak | Lisans | Durum |
|---|---|---|---|---|
| `kaykit-furniture-bits/` | 53 model (gltf+bin) + `furniturebits_texture.png` (ortak atlas) | KayKit Furniture Bits 1.0 — Kay Lousberg (kaylousberg.com) | **CC0** (kredi opsiyonel) | ✅ eklendi (entegrasyon ⏳) |

> Not: Pakette gelen fbx / fbx(unity) / obj+mtl / ekstra png (sample, contents) ve License.txt/url
> dosyaları silindi — yalnız glTF iş hattı tutuluyor (boyut + tekillik). CC0 olduğu için lisans
> dosyasını saklama zorunluluğu yok; künye bu manifestte.

### kaykit-furniture-bits — oyun eşlemesi (plan, kullanıcı onaylı yön)
Çay masası tier-bazlı OTURAK + recolor (kahve→mavi-üst→altın, atlas-swap/tint):
- **Çay masası L1:** `table_small` + 1× `chair_stool` · **L2:** + 2× stool · **L3:** `table_medium` + 4× `chair_A`/`chair_B`
- **Yemek alanı (çaydan sonra):** `table_medium_long` + `chair_A`/`chair_B`/`chair_C`
- **Dekor:** bitki=`cactus_*` (saksı yerine), duvar tablosu=`pictureframe_*`, lamba=`lamp_standing`/`lamp_table`, halı=`rug_*`
- **İleride/ops.:** `couch`/`armchair` (lounge), `cabinet_*`/`shelf_*` (tezgah/raf), `book_*`, `pillow_*`
- **Kullanılmaz (kıraathane dışı):** `bed_*`
- Mevcut kancalar: `seatsByLevel` / `tableLevels` / `tableclothByLevel` — model eşlemesi bunlara takılır.

## Karakterler — KALDIRILDI (2026-06-11 kullanıcı kararı)
WP3'te eklenen Quaternius Modular Men/Women glb'leri kullanıcı feedback'iyle geri alındı
("konsepte uygun değil; My Hotel tarzı olmalı"). Karakterler primitive (parçalı gövde) stile döndü.
Yeni karakter paketi seçimi kullanıcıyla birlikte yapılacak (aday: Synty POLYGON / Quaternius UAL).

## Türk'e özel modeller (henüz yok — greybox/ilkel kullanılıyor)
KayKit pakette OLMAYAN, kıraathaneye özgü objeler. Gerektiğinde AI üretimi (Meshy/Tripo) veya
ayrı CC0 paket; eklenince ayrı modüler klasöre (`public/assets/models/<paket>/`) konur.
| Obje | Greybox karşılığı | Aday kaynak | Durum |
|---|---|---|---|
| Semaver / çaydanlık | silindir+küre | AI (Meshy) | ⏳ greybox |
| İnce belli çay bardağı | küçük silindir | AI (Meshy) | ⏳ greybox (Dishes.tsx) |
| Okey takımı | box | AI (Meshy) | ⏳ greybox |
| Nargile | silindir+küre | AI (Meshy) | ⏳ greybox |
| Bakır demlik | silindir | AI (Meshy) | ⏳ greybox |
| Para (₺) | sarı silindir (instanced) | — | ⏳ greybox (Coins.tsx) |
| Satın-alma pad'i | düz zemin işareti | — | ⏳ greybox (sade tutulacak) |

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
