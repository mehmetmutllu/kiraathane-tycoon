# S13 — Altı ücretsiz KayKit paketi: indirme engeli, envanter, repo bedeli (ÖLÇÜM RAPORU)

Ham çıktı: `docs/olcum-yeni-paketler.json` · araç: `tools/olcum-yeni-paketler.mjs` ·
indirme: `tools/indir-itch.ps1` · görsel: `docs/gorsel/s13-*.png`
(`tools/model-bak.mjs <paket> <modeller> <çıktı> vitrin`)
Tarih: 2026-09-14 · karakter boyu **1,75** · dünya birimi = **metre**

> Bu rapor **ölçüm commit'iyle** yazıldı; **§Karar bölümü bilerek BOŞ.** Karar paketi kullanıcıya
> sunulur, seçilen kol ikinci commit'te uygulanır (D-084 varyant kapısı).

---

## Soru

Faz S'nin asset kalemi (`docs/plan-faz-s-sanat.md` §S6, panoda **S13**) altı ücretsiz KayKit
paketini istiyordu: **Board Game · Forest Nature · Holiday · Resource · Prototype · Block.**
İki şey açıktı:

1. **İndirme engeli.** `tools/indir-itch.ps1` itch akışının 3/4 adımını yapıyor, 4. adım **404**
   veriyordu (`activeContext`, S12 turu). Paketler bu makineye hiç inmemişti.
2. **Repoya ne girecek?** "Ücretsiz olduğu sürece her asseti çek" kararı **indirmeyi** serbest
   bırakır, **repoyu** değil. `public/assets/models/` APK'ya giriyor; "hepsini al" ile "yalnız
   gerekeni al" arasındaki fark bir sayı olmadan tartışılamaz.

Ayrıca üç AÇIK KALEM bu paketlerde karşılık arıyordu: **`door_A`nın itme barı** ("başka paket
gelirse ilk bakılacak kalem"), **WC çöp kutusu** (iki kez "karşılığı yok" diye ölçülmüştü),
**çiçek** ("kendi çizdiğin çiçekler yerine").

## Yöntem

- **İndirme:** `indir-itch.ps1`, itch'in kendi uçları. Üçüncü parti yok. Bash'in ağı yok,
  PowerShell'in var (`project_network_powershell`).
- **Envanter:** paketler önce scratchpad'e açıldı; `Assets/gltf/` + `Textures/` alındı,
  fbx/obj/unity varyantları atıldı (mevcut üç paketin deseni).
- **Ölçü:** `tools/model-olc.mjs` (sınır kutusu, modelin kendi gltf sayısı) ve üçgen sayımı
  doğrudan gltf accessor'larından.
- **Görsel:** `tools/model-bak.mjs` — **bu turda `vitrin` kipi eklendi** (§Y).
- **Bedel:** `tools/olcum-yeni-paketler.mjs`, `public/assets/models/` üzerinde dosya boyu.

### §Y — Araçta bu turda değişen iki şey (ikisi de ölçümün kendisi gerektirdi)

1. **`indir-itch.ps1` 4. adım.** 404'ün sebebi uç noktanın yeri: süreli **indirme sayfasına**
   POST atılıyordu, itch ise **oyun sayfasını** istiyor. Üç varyant denendi, üçü de ölçüldü:

   | uç nokta | sonuç |
   |---|---|
   | `{indirme sayfası}/file/{id}` (eski) | **404** |
   | `{oyun sayfası}/file/{id}?key={token}` | 200 · `{"errors":["invalid key"]}` |
   | `{oyun sayfası}/file/{id}?source=game_download` | **200 · `{"url": …}`** ✓ |

   Süreli indirme sayfası yine de gerekli: `upload_id` yalnız orada duruyor. İkinci bulgu:
   KayKit yüklemeleri CDN adresinde **dosya adı taşımıyor** (son parça = upload id) → ad artık
   oyun sayfasının slug'ından türetiliyor.

2. **`model-bak.html` `vitrin` kipi.** Mevcut kip her modeli 1,75 m'lik insan çubuğunun yanına
   koyuyor. Board-game ve holiday parçaları **0,20…0,38 br**; o kadrajda 20 px'lik lekeye
   düşüyorlar ve biçimleri ayırt edilemiyor — ilk koşu bunu gösterdi. Vitrinde her model **en
   büyük kenarı 1 br** olacak şekilde normalize edilir (gerçek ölçü etikette durur), ızgaraya
   dizilir, insan çubuğu çizilmez. **Seçim turunun sorusu "ne kadar büyük" değil "bu NE".**

---

## §Bulgular

### B1 — İndirme: engel kalktı, altı paketin altısı indi

| paket | itch sayfası | upload | boyut |
|---|---|---|---|
| Board Game Bits 1.0 | `kaylousberg.itch.io/board-game-bits` | 17150670 | 35,28 MB |
| Forest Nature Pack 1.0 | `…/kaykit-forest` | 13520330 | 6,14 MB |
| Prototype Bits 1.1 | `…/prototype-bits` | 15362979 | 4,80 MB |
| Block Bits 1.0 | `…/block-bits` | 13197456 | 5,30 MB |
| Holiday Bits 1.0 | `…/holiday-bits` | 15777030 | 12,79 MB |
| Resource Bits 1.0 | `…/resource-bits` | 13266824 | 8,13 MB |

Toplam indirilen **72,4 MB** zip. Hepsi "ne verirsen" katmanının FREE sürümü.

**Lisans (CLAUDE.md: belirsiz asset commit'lenmez):** beşinde paket içinde `License.txt` var ve
**CC0** yazıyor (Kay Lousberg, kaylousberg.com; kredi opsiyonel). **Holiday Bits'te License.txt
YOK** — lisans itch sayfasının kendi alanından doğrulandı: *"Asset license: Creative Commons Zero
v1.0 Universal"* + açıklama metni *"Free for personal and commercial use, no attribution required
(CC0 Licensed)"*. Yani belirsiz değil, ama künyesi pakette değil sayfada.

### B2 — Envanter: 553 model, 6 atlas

| paket | model | gltf hattı | atlas |
|---|---|---|---|
| kaykit-board-game-bits | 162 | 9 564 KB | 34 KB |
| kaykit-forest-nature | 105 | 1 567 KB | 48 KB |
| kaykit-holiday-bits | 98 | 4 431 KB | 16 KB |
| kaykit-resource-bits | 76 | 3 542 KB | 25 KB |
| kaykit-prototype-bits | 72 | 1 027 KB | 29 KB |
| kaykit-block-bits | 40 | 1 709 KB | 30 KB |

Klasör deseni mevcut üç paketle **birebir aynı** (gltf + bin + tek atlas png, göreli yol) →
`Model.tsx` yükleyicisi değişmeden çalışır, yeni klasör bırakmak yeter.

### B3 — Beklenti ↔ gerçek: altı paketin **üçü** beklenen işi yapmıyor

Asset panosu (`docs/asset-secim-panosu.html` §2) her pakete bir görev yazmıştı. Ölçüm üçünü
doğruladı, üçünü **çürüttü**:

| paket | panoda yazan görev | gerçekte çıkan | hüküm |
|---|---|---|---|
| Board Game | okey pulu + tavla | domino taşı ×28 · **`playerstand` (taş rafı)** ×5 renk · D6/D4/D8/D20 zar · meeple · jeton · `container_A` tepsi | **tutuyor** (okey taşı değil domino taşı) |
| Resource | çuval/sandık/kasa stoğu | kereste yığını · palet · taş tuğla yığını · **`Textiles_*` kumaş balyası** · kütük | **tutuyor** |
| Forest | **çiçek** + dış yeşil | çalı ×22 · çim ×20 · kaya ×40 · ağaç ×23 — **tek bir çiçek yok**, hepsi `_Color1` (tek yeşil; renk varyantları ücretli katmanda) | **yarısı** — dış yeşil var, çiçek YOK |
| Holiday | süs/askı/ışık dizisi, flama | askı süsü ve ışık dizisi **yok**; çıkanlar: **`chair_large_*` koltuk ×4 renk** · `footstool_*` ×4 renk · `stool` · `carpet_round_*` halı · `lantern` (3,94 br sokak feneri) · `lantern_mini` · `plate_*` ×8 · `hot_chocolate` kupa | **çürüdü** — ama BAŞKA bir işe yarıyor (mobilya + renk varyantı) |
| Prototype | G-12 yukarı ok · pad çerçevesi | ok **yok**, işaret **yok**; çıkanlar: `Primitive_*` duvar/rampa/merdiven ailesi · **`Door_A` itme barsız kapı** · `Wall_Window_Open` · varil/kutu/kola kutusu | **çürüdü** — ama `door_A` açık kalemini çözüyor (§B4) |
| Block | `feedback_room_volume` — mekân hacmi | Minecraft tarzı **voxel küpleri** (2,00 br: grass/dirt/stone/lava/water), doymuş palet | **çürüdü** — hacim için parça değil, palet de KayKit'in yumuşak tonuyla uyumsuz |

Görseller: `s13-oyun-adaylari.png` · `s13-doga-adaylari.png` · `s13-holiday-adaylari.png` ·
`s13-resource-adaylari.png` · `s13-prototype-adaylari.png` · `s13-prototype-kucuk.png` ·
`s13-block-adaylari.png`.

### B4 — `door_A`nın itme barı: karşılığı ÇIKTI, ankraj birebir

Açık kalem: *"`door_A`nın İTME BARI duruyor — tek mesh (188 üçgen), sökülemiyor. Başka paket
gelirse ilk bakılacak kalem."* Prototype Bits'in `Door_A`sı **itme barsız, pencereesiz, tokmaklı
düz panel kapı**:

| | en × yük × der | üçgen | okunuş |
|---|---|---|---|
| `kaykit-restaurant-bits/door_A` (bugün) | 1,600 × 2,800 × **0,771** | 188 | yeşil yangın kapısı · pencere · **itme barı** |
| `kaykit-prototype-bits/Door_A` | 1,600 × 2,800 × **0,546** | 296 | kahve panelli kapı · **yuvarlak tokmak** |
| `kaykit-prototype-bits/Door_A_Decorated` | 1,600 × 2,800 × 0,627 | 392 | aynısı + üstte küçük levha |
| `kaykit-prototype-bits/Door_B` | 1,600 × 2,800 × 0,536 | 167 | kırmızı + uyarı üçgeni (kıraathaneye uymaz) |

**Ayak izi ve ankraj aynı** (minX 0 · minY 0 · z ortalı) → yer değişimi ölçü istemez, yalnız
`src` değişir. Bedel: derinlik 0,771 → 0,546 (itme barı payı **0,225 br** düşer) · üçgen
188 → 296 (**+108**) · **yeni atlas** (prototypebits, 29 KB) · ve **renk**: bugünkü WC kimliği
`door_A`nın **%73 [0,3] #828c91 grisi** üzerine kurulu (`wcLook.ts`, D-104) — panel kapıda o gri
kasa yok, kapı kahverengi bir kütle olur.

### B5 — WC çöp kutusu: ÜÇÜNCÜ kez ölçüldü, yine karşılığı yok

Prototype'ın `Can_A`/`Can_B`si (0,30 × 0,48 × 0,30) **içecek kutusu** — kola kutusu gövdesi,
kapaklı silindir değil. Varil (`Barrel_A/B/C`, 1,00 br) fıçı. Diğer beş pakette de kapaklı çöp
kutusu yok. **Dokuz paketin hiçbirinde karşılığı yok** → `MaketTrash` elle çizim kalıyor; bu
kalem artık "geçici" değil **kapanmış** sayılabilir.

### B6 — Repo bedeli: "hepsini al" 4,6 kat, "gerekeni al" 1,4 kat

| kol | ne girer | models/ | fark |
|---|---|---|---|
| **taban** | bugünkü üç paket (restaurant · furniture · city) | **5,9 MB** | — |
| **A — hepsi** | altı paket TAM, 553 model, 6 atlas | **27,2 MB** | **+21,3 MB (×4,6)** |
| **B — gerekenler** | eşleşen 117 model + 5 atlas (block hiç) | **8,4 MB** | **+2,5 MB (×1,4)** |

Kol B'nin paket başına dökümü (desenler araçta yazılı, `GEREKEN`):

| paket | gerekçe | seçili model | KB |
|---|---|---|---|
| board-game | okey/tavla masası (Kat 2 kimliği) | 39 | 590 |
| forest-nature | saksı bitkisi + dış yeşil | 33 | 472 |
| holiday | koltuk/tabure/halı/fener/tabak — renk varyantlı | 21 | 490 |
| resource | depo stoğu + kilitli obje "tadilat hâli" | 21 | 962 |
| prototype | itme barsız kapı | 3 | 81 |
| block | — eşleşme yok | 0 | 0 |

Not: her paketten **bir model bile** alınsa o paketin **atlası** (16…48 KB) da girer; kol B'nin
KB'ları atlası içeriyor. Asıl ağırlık modellerin `.bin`lerinde.

---

## §Karar

*(BOŞ — karar paketi kullanıcıya sunulacak, seçilen kol ikinci commit'te uygulanacak.)*
