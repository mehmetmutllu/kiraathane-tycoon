# Asset Manifesti

> KURAL: Lisansı belirsiz hiçbir asset commit'lenmez. Greybox-first — her şeyin ilkel
> şekil karşılığı var, model olmadan oyun tam oynanır. Modeller `models/`, sesler `audio/`.

Stil kilidi: **KayKit (Kay Lousberg, CC0)** low-poly. Türk objeleri gerekirse AI üretimi (Meshy/Tripo).
Detay: `docs/assets.md`.

> **STİL KİLİDİ BİR KEZ, BİLEREK AÇILDI (2026-09-14 · S19b · D-116).** Sipariş balonunun içine
> çizim değil NESNE koyma kararı tostu gerektirdi; repodaki **dokuz KayKit paketinde tost YOK**
> (en yakını yuvarlak hamburger ekmeği — ölçüldü, `docs/patron-oturus-glif-raporu-s19a.md` §G/Y).
> İkinci sanatçı olarak **Kenney Food Kit 2.0** (CC0) alındı. Kural silinmedi: kilit hâlâ KayKit,
> bu bir İSTİSNA ve kullanıcı kararı. Çay bardağı iki pakette de yoktu, o bizim ilkelimizden
> (ince belli bardak) çizildi — yani Kenney'ye "olur da lazım olur" diye genişletilmedi.

## Modüler model yapısı (`public/assets/models/<paket>/`)
Her asset paketi **kendi klasöründe**, self-contained (gltf + bin + texture göreli yolla bağlı).
Yeni paket eklemek = yeni klasör bırak; mevcut paketlere dokunma. Vite `public/`'i kökten
servis eder → URL: `/assets/models/<paket>/<isim>.gltf`. Loader: `components/three/Model.tsx`
(`useGLTF`, .gltf/.glb; src yoksa veya hata olursa ilkel şekle düşer — oynanış kodu değişmez).

| Paket klasörü | İçerik | Kaynak | Lisans | Durum |
|---|---|---|---|---|
| `kaykit-furniture-bits/` | 53 model (gltf+bin) + `furniturebits_texture.png` (ortak atlas) | KayKit Furniture Bits 1.0 — Kay Lousberg (kaylousberg.com) | **CC0** (kredi opsiyonel) | ✅ eklendi (entegrasyon ⏳) |
| `kaykit-restaurant-bits/` | 144 model (gltf+bin) + `restaurantbits_texture.png` | KayKit Restaurant Bits 1.0 — Kay Lousberg | **CC0** (kredi opsiyonel) | ✅ eklendi 2026-09-06 · **entegre edildi 2026-09-09 (S3: mutfak)** |
| `kaykit-city-builder-bits/` | 41 model (gltf+bin) + `citybits_texture.png` | KayKit City Builder Bits 1.0 — Kay Lousberg | **CC0** (kredi opsiyonel) | ✅ eklendi 2026-09-06 (entegrasyon ⏳ Faz G5) |
| `kaykit-board-game-bits/` | **162 model** (paketin tamamı) + `boardgame_bits_texture.png` + 16 rozet png | KayKit Board Game Bits 1.0 — Kay Lousberg | **CC0** (pakette `License.txt`) | ✅ eklendi 2026-09-14 (S13) · entegrasyon ⏳ **Kat 2** |
| `kaykit-forest-nature/` | 33 model (paketin 105'inden) + `forest_texture.png` | KayKit Forest Nature Pack 1.0 — Kay Lousberg | **CC0** (pakette `License.txt`) | ✅ eklendi 2026-09-14 (S13) · entegrasyon ⏳ |
| `kaykit-holiday-bits/` | 21 model (paketin 98'inden) + `holiday_bits_texture.png` | KayKit Holiday Bits 1.0 — Kay Lousberg | **CC0** — pakette `License.txt` YOK, lisans itch sayfasının kendi alanından: *Creative Commons Zero v1.0 Universal* | ✅ eklendi 2026-09-14 (S13) · entegrasyon ⏳ |
| `kaykit-resource-bits/` | 21 model (paketin 76'sından) + `resource_bits_texture.png` | KayKit Resource Bits 1.0 — Kay Lousberg | **CC0** (pakette `License.txt`) | ✅ eklendi 2026-09-14 (S13) · entegrasyon ⏳ |
| `kaykit-characters/` | **6 gövde** (Barbarian · Knight · Mage · Ranger · Rogue · Rogue_Hooded; doku gövdenin İÇİNDE gömülü) + **4 klip dosyası** (`Rig_Medium_General/MovementBasic/Simulation/Tools` — 69 klip) + iki `License-*.txt` | KayKit Adventurers 2.0 FREE + KayKit Character Animations 1.1 — Kay Lousberg | **CC0** (ikisinin de `License.txt`'i klasörde tutuldu) | ✅ eklendi 2026-09-14 (S14) · **personel entegre edildi aynı gün** (sahip · garson · bulaşıkçı · çaycı) · müşteriler ⏳ sonraki tur |
| `kenney-food-kit/` | **1 model** (paketin 201'inden: `sandwich`) + `Textures/colormap.png` (ortak atlas) | Kenney Food Kit 2.0 — kenney.nl | **CC0** (Kenney'nin tüm paketleri CC0; künye bu manifestte) | ✅ eklendi 2026-09-14 (S19b) · **entegre edildi aynı gün** (sipariş balonundaki tost) · **stil kilidi istisnası** |
| `kaykit-prototype-bits/` | **3 model** (paketin 72'sinden: `Door_A` · `Door_A_Decorated` · `Door_B`) + `prototypebits_texture.png` | KayKit Prototype Bits 1.1 — Kay Lousberg | **CC0** (pakette `License.txt`) | ✅ eklendi 2026-09-14 (S13) · **entegre edildi aynı gün** (WC kabin kapısı) |

> Not: Pakette gelen fbx / fbx(unity) / obj+mtl / ekstra png (sample, contents) ve License.txt/url
> dosyaları silindi — yalnız glTF iş hattı tutuluyor (boyut + tekillik). CC0 olduğu için lisans
> dosyasını saklama zorunluluğu yok; künye bu manifestte.

### S13'ten beri: paket = KLASÖR DEĞİL, SEÇİLMİŞ MODELLER (D-111)

İlk üç paket olduğu gibi girmişti. S13'te altı yeni paket indirildi ve kullanıcı **kol B**'yi
seçti: repoya yalnız bir açık kaleme bakan modeller girer. Sebep bir sayı — altısını da tam almak
`models/`i **5,9 → 27,2 MB** yapıyordu (×4,6) ve 553 modelin **436'sı** hiçbir işe bakmıyordu.
Seçilenle ağırlık **17,2 MB**. Tek istisna **board-game-bits**: TAM alındı, gerekçesi Kat 2 —
okey/tavla masası açılırken hangi taş/jeton/zar lazım olacağı bugün belli değil.
**Reddedilen:** Block Bits (voxel küpü; mekân hacmi için parça değil, paleti de uyumsuz) —
indirildi, ölçüldü, repoya girmedi.

Hangi modelin hangi desenle girdiği `tools/olcum-yeni-paketler.mjs` içindeki `GEREKEN` tablosunda;
bekçisi `tests/yeni-paketler.test.ts` (desen dışı model sızarsa kırmızı yanar).
İndirme: `pwsh tools/indir-itch.ps1 -Sayfa <itch adresi> -Hedef <klasör>`.
Sayılar: `docs/yeni-paketler-raporu-s13.md`.

### kaykit-restaurant-bits — **S3'te kullanıma girdi (2026-09-09)**
Yerleşimin tek kaynağı `src/components/three/kitchenLook.ts`, çizim `Kitchen.tsx`,
bekçi `tests/kitchen-look.test.ts`. Ölçüler `node tools/model-olc.mjs` çıktısıdır.

**Arka duvar hattı (7 modül, 1,80 adım, ölçek 0,90):** `fridge_A` ·
`kitchencounter_straight_A_backsplash` ×2 · `stove_multi` · `kitchencounter_straight_B_backsplash` ·
`kitchencounter_sink_backsplash` · `oven`. Duvarda: `kitchencabinet` ×2 · `extractorhood`.
Tezgâh üstü: `dishrack_plates`. Batı duvarı: bir `_straight_B_backsplash` (L dönüşü).
**Depo (ölçek 0,45):** `crate` · `crate_lid` · `crate_potatoes`.
**Ön hat (oyunun işleyen tezgâhları, `kayGovde` ile collision kutusuna çekilir, çekmeceler
mutfağa dönük):** çay ocağı `kitchencounter_straight_A` · garson istasyonu
`kitchencounter_straight_B` · bulaşık `kitchencounter_sink`.

**Palet KayKit'in kendi paleti (kullanıcı kararı 2026-09-09, D-099):** atlas boyanmadı.
Boyama aracı yine de duruyor (`tools/atlas-ton.mjs` + `tools/atlas-goz.mjs`) — renk artık
bir tema mağazası kalemi. Hangi gözün hangi modele gittiği ölçülü:
[3,6] tezgâh · [1,1] fırın/ocak gövdesi · [1,2] soğutucu.

**Henüz kullanılmayan (sonraki kalemler):** `shelf_papertowel` · `table_round_A` · `menu` ·
`wall_orderwindow` · duvar/zemin parçaları (S4). Tost hattı için: `pan_A` / `cuttingboard` /
`plate` / `food_ingredient_cheese_slice`.
**Karşılığı YOK (elle çizili kalır):** damacana rafı (`MaketWaterRack`) ve çay bardağı
duvar rafı (`MaketWallShelf`) — KayKit'te Türk kıraathanesi eşyası yok.

### kaykit-city-builder-bits — kıraathane önü sokak (plan §8 G5)
`building_A…H` · yol parçaları · `streetlight` · `bench` · `car_taxi`. Toplam atlas 3'te kalır.
İndirilirken yalnız `Assets/gltf/` + doku alındı (fbx/obj/unity varyantları atıldı);
lisans CC0 olarak `LICENSE.txt`ten doğrulandı, künye bu manifestte.

### kaykit-furniture-bits — oyun eşlemesi (plan, kullanıcı onaylı yön)
Çay masası tier-bazlı OTURAK + recolor (kahve→mavi-üst→altın, atlas-swap/tint):
- **Çay masası L1:** `table_small` + 1× `chair_stool` · **L2:** + 2× stool · **L3:** `table_medium` + 4× `chair_A`/`chair_B`
- **Yemek alanı (çaydan sonra):** `table_medium_long` + `chair_A`/`chair_B`/`chair_C`
- **Dekor:** bitki=`cactus_*` (saksı yerine), duvar tablosu=`pictureframe_*`, lamba=`lamp_standing`/`lamp_table`, halı=`rug_*`
- **İleride/ops.:** `couch`/`armchair` (lounge), `cabinet_*`/`shelf_*` (tezgah/raf), `book_*`, `pillow_*`
- **Kullanılmaz (kıraathane dışı):** `bed_*`
- Mevcut kancalar: `seatsByLevel` / `tableLevels` / `tableclothByLevel` — model eşlemesi bunlara takılır.

## Karakterler — KayKit gövdeleri (2026-09-14 · S14 · D-112)

**Geçmiş:** WP3'te eklenen Quaternius Modular Men/Women glb'leri kullanıcı geri bildirimiyle
geri alınmıştı ("konsepte uygun değil; My Hotel tarzı olmalı") ve karakterler ilkel parçalı
gövdeye dönmüştü. S14'te ölçülerek yeniden açıldı.

**Neden Quaternius DEĞİL (ölçüldü, `docs/karakter-raporu-s14.md` §B7):** ücretsiz katmanda 2 taban
gövde var (panonun yazdığı 6 değil), modüler kıyafet paketinin adı `...-outfits-**fantasy**`, ve
doku hattı PBR: taban karakterlerin Godot/UE doku klasörü **80 MB**, tek bir normal haritası
13,8 MB. Tek sivil karakterin repo bedeli ≈ **22 MB**; KayKit'in karşılığı **334-529 KB**,
doku gövdenin içinde gömülü.

**Ne alındı:** KayKit Adventurers'ın altı gövdesi + Character Animations'ın dört klip dosyası.
Gövdeler fantezi paketinden geliyor ama fantezi **sökülebilir**: ekipman (pelerin/miğfer/şapka)
ayrı düğüm, gizlemek bir satır; ortaçağ derisi gövdenin DOKUSUNDAydı, gövde ve bacak oyunun
paletine boyanıyor. **Baş boyanmaz** — yüz, saç ve sakal başın kendi dokusundan gelir.
Kasket ve önlük bizim ve `head`/`chest` kemiğine takılı, yani klipler onları da taşıyor.
Kod: `src/components/three/KayActor.tsx` · kayıt `src/config/actor.ts` · bekçi `tests/karakter.test.ts`.

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

## Sesler (`public/assets/audio/`) — **KLASÖR BİLEREK BOŞ**

**Kaynak seçildi ve seçim "dosya değil KOD" oldu (E4 · D-096).** Sesler
`src/game/audioSynth.ts` tarafından çalışma anında sentezlenir. Dış ses paketi yok, indirilecek
dosya yok, doğrulanacak lisans yok. Gerekçe `docs/assets.md` §7; sayılar `docs/ses-raporu-e4.md`.

Bu tablo bir **alışveriş listesi değil**: aşağıdaki `.ogg` adları, birileri o dosyayı bırakırsa
sentezin ÜSTÜNE YAZACAĞI yolları gösterir (`Model.tsx` fallback deseninin aynısı, yönü ters).
Bugün hiçbiri yok ve oyun tam sesli oynanıyor.

**Dosya adı katalogla BİREBİR eşleşmek zorunda** — `tests/ses.test.ts` her sesin yolunun
`/assets/audio/*.ogg` kalıbında olduğunu bekçiliyor, ama adın DOĞRU dosyayı gösterdiğini
doğrulayamaz; oradaki tek koruma bu tablodur. **Bırakılacak her dosya lisans disiplinine tabidir**
(`docs/assets.md` §8): belirsiz lisanslı hiçbir ses commit'lenmez.

| Üstüne yazma yolu | Olay (`SesId`) | Ne zaman | Sentezdeki karşılığı | Durum |
|---|---|---|---|---|
| coin_pickup.ogg | `coin` | Yerden para toplandı | metalik tık — inharmonik kısmiler + tiz gürültü geçişi | ✅ sentez |
| tea_pour.ogg | `pour` | Ocaktan tepsiye çay alındı | bant merkezi 650→1500 Hz yükselen süzülmüş gürültü + fokurdama | ✅ sentez |
| tea_serve.ogg | `serve` | Oyuncu masaya ürün bıraktı | dar bantlı cam şıngırtısı (q=8) + tok alçak gövde | ✅ sentez |
| purchase.ogg | `purchase` | ₺ yükseltme alındı | tahta tok + alçak registerda İNEN onay (−5) | ✅ sentez |
| pad_fill.ogg | `padFill` | Pad açıldı (alan/masa/personel) | yükselen gürültü süpürmesi + yükselen üçlü (+7,+5) | ✅ sentez |
| quest_done.ogg | `quest` | Görev tamamlandı | majör üçlü (+4,+3), triangle | ✅ sentez |
| level_up.ogg | `level` | İtibar seviyesi atladı | 4 notalı fanfar (+7,+5,+4) + oktav üstü parlaklık | ✅ sentez |
| master.ogg | `master` | 💎 ile Usta alındı | ÇAN — inharmonik kısmiler, uzun sönme (+5,+5) | ✅ sentez |
| reward.ogg | `reward` | Hedef / günlük görev ödülü toplandı | oktav sıçraması (+12) + kısa parıltı | ✅ sentez |
| ambience_loop.ogg | *(olay değil)* | Ortam uğultusu | **YOK** — `settings.music` kablosu çekilmedi, kendi turunu ister | ⏳ |
| okey_tile.ogg | *(olay değil)* | Okey pulu | **YOK** — okey masası v1.1 | ⏳ |

**Ölçüldü:** 36 çiftin 36'sı ayrı (KARIŞIR 0 · AYNI JEST 0 · ikiz 0 grup) ·
`docs/olcum-ses-ayirt.txt` · araç `tools/olcum-ses-ayirt.ts` · bekçi `tests/ses.test.ts` +
`tests/ses-sentez.test.ts`.

Durum: ⏳ greybox (model/ses yok, ilkel/ton kullanılıyor) · ✅ eklendi (lisans doğrulanmış).
