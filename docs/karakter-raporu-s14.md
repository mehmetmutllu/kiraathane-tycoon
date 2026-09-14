# S14 — Karakterler: kaynak, sivilleştirme bedeli, iskelet, ölçek, perf (ÖLÇÜM RAPORU)

Ham çıktı: `docs/olcum-karakter.json` · `docs/olcum-karakter.txt` · `docs/olcum-skin-perf.txt`
Araçlar: `tools/olcum-karakter.mjs` (yeni) · `tools/karakter-bak.mjs|.html` (yeni) ·
`tools/skin-perf.mjs|.html` (yeni) · indirme: `tools/indir-itch.ps1`
Kareler: `docs/gorsel/ss/s14-kaykit-ham.png` · `s14-sivil-idle.png` · `s14-olcek-kollari.png`
Tarih: 2026-09-14 · aktör boyu **1,75** · dünya birimi = **metre**

> Bu raporun §Bulgular bölümü **ölçüm commit'iyle** yazıldı ve §Karar o commit'te BOŞTUR
> (D-084 varyant kapısı). Karar paketi sunulacak, kullanıcı seçecek, §Karar ikinci commit'te dolar.

---

## Soru

Faz S'nin son asset kalemi: **sahip · garson · bulaşıkçı · çaycı · müşteri** bugün elle yazılmış
ilkel gövdeler. `docs/asset-secim-panosu.html` §3 altı kol (A…F) yazmıştı ve tek bir hüküm bütün
panoyu taşıyordu:

> *"KayKit'in karakter paketlerinin hepsi fantezi temalı… 'KayKit al, bitsin' diye temiz bir yol
> yok; her kolun bir bedeli var."* — ve A kolunun bedeli: *"Silüet fantezi: zırh, pelerin, kılıç.
> Sivil görünüm için **mesh düzenleme + yeniden dokulama** işi bende — birkaç oturum."*

O pano **2026-09-09'da, hiçbir paket indirilmeden** yazıldı. S13 aynı panonun altı görevinden
**üçünün çürüdüğünü** ölçtü (Holiday süs değil mobilya · Prototype ok değil kapı · Block hacim
değil voxel). Dolayısıyla bu turun ilk işi kolları **dosyadan** yeniden ölçmekti.

## Yöntem

- **İndirme:** `indir-itch.ps1`, itch'in kendi uçları (`project_network_powershell`).
  Beş ücretsiz KayKit + üç ücretsiz Quaternius paketi indirildi; **hiçbiri repoya girmedi**,
  hepsi scratchpad'te. Görsel karşılaştırma için adaylar `public/assets/models/_aday-karakter/`e
  kopyalandı ve o yol `.gitignore`'a yazıldı.
- **Yapı ölçümü:** `tools/olcum-karakter.mjs` — glTF/GLB'yi doğrudan okur (JSON parçası + accessor
  min/max), düğüm başına üçgen/kutu, iskelet adı, kemik sayısı, animasyon klip adları.
  Ekipman ayrımı parçanın **rolüne** (adın son bölümü) bakar.
- **Görsel:** `tools/karakter-bak.mjs|.html` — adayı oyunun **donmuş mobilyasıyla** aynı sahnede
  çizer (masa tabla üstü **0,795**, tabure oturağı **0,45**, 1,75 m insan kütlesi). `sivil=1`
  ekipman düğümlerini gizler; `poz=dosya:klip` başka bir dosyadaki klibi gövdeye uygular.
- **Perf:** `tools/skin-perf.mjs|.html` — bugünkü InstancedMesh kapsül ile N adet skinned gövdeyi
  aynı tarayıcıda, 120 kare ortalamasıyla karşılaştırır; kullandığı sürücüyü yazdırır.

### §Y — Araçta bu turda düzeltilen dört şey (dördü de ölçümün kendisi gerektirdi)

1. **`pwsh` yok.** `indir-itch.ps1`'in başlığı `pwsh tools/indir-itch.ps1` diyor; bu makinede
   PowerShell 7 kurulu değil, betik `powershell.exe`den (5.1) koşuyor. Komut satırı çalışıyor,
   yalnız belgesi yanlış.
2. **Ekipman ayrımı adın tamamına bakıyordu.** İlk koşuda `Rogue_Hooded_Head` "hood" içerdiği için
   ekipman sayıldı ve karakterin **başı** sökülecek parça listesine düştü. Karşılaştırma artık
   adın **son bölümüne** (role) bakıyor.
3. **Animasyon dosyaları karakter tablosuna düşüyordu.** KayKit'in klip `.glb`'leri mankenin
   gövdesini de taşıyor; içerik sınıflaması "klip varsa animasyondur" diye düzeltilince aynı manken
   18 kez karakter sanılmaktan çıktı. (Bu kusurun kendisi bir bulgu: §B4.)
4. **Başsız Chromium yazılım rasterizer'ına düşüyor.** İlk perf koşusu 24 skinned gövde için
   **197 ms/kare** verdi — telefonla ilgisi olmayan bir sayı. GPU bayrakları açılınca aynı ölçüm
   **2,2 ms**. Sayfa artık sürücü adını çıktının içine yazıyor; **sürücüsüz perf sayısı okunmaz.**

---

## §Bulgular

### B1 — Ücretsiz KayKit karakter envanteri: 12 gövde, hepsi TEK iskelet

Pano yalnız "hepsi fantezi" diyordu, sayı vermiyordu. Ölçülen:

| paket | ücret | gövde | not |
|---|---|---:|---|
| KayKit Adventurers 2.0 FREE | ne verirsen (0 ₺) | 6 | Barbarian · Knight · Mage · Ranger · Rogue · Rogue_Hooded |
| KayKit Character Animations 1.1 | ne verirsen (0 ₺) | 2 | **Mannequin_Medium · Mannequin_Large** — ekipmansız nötr gövde |
| KayKit Skeletons 1.1 FREE | ne verirsen (0 ₺) | 4 | iskelet figürleri (kıraathaneye girmez) |
| KayKit Mini-Game Variety | ne verirsen (0 ₺) | 3 | Bear · Dog · Duck — **iskeletsiz** maskot, karakter değil |
| KayKit Series 4/5/6 | **$19,99/paket** | — | indirilemez, fiyat satırı olarak kalır |

- **12 iskeletli gövdenin 11'i `Rig_Medium`, 23 kemik.** Mannequin_Large tek başına `Rig_Large`.
  Yani paketler arası fark yok: **tek rig.**
- Dosya başına **259–529 KB**, **4.588–8.900 üçgen**, **tek materyal + tek gömülü atlas**.
- Panonun bilmediği ikinci paket: **Character Animations**, ve asıl değeri gövdede değil (§B2).

### B2 — Klip kütüphanesi: tycoon'un istediği fiil takımı ücretsiz ve hazır

`Rig_Medium` için **8 ayrı klip dosyası, 139 klip.** Dövüş klipleri **ayrı dosyalarda**, yani
alınmayabilir. Kıraathaneye doğrudan yarayanlar:

| dosya | KB | klip | kıraathanenin işine yarayan |
|---|---:|---:|---|
| `Rig_Medium_General` | 809 | 15 | **Idle_A · Idle_B · Interact · PickUp · Use_Item** |
| `Rig_Medium_MovementBasic` | 673 | 11 | **Walking_A/B/C · Running_A/B** |
| `Rig_Medium_Simulation` | 836 | 14 | **Sit_Chair_Down · Sit_Chair_Idle · Sit_Chair_StandUp · Waving · Cheering** |
| `Rig_Medium_Tools` | 1427 | 29 | **Holding_A/B/C · Work_A/B/C · Working_A/B/C** (tepsi taşıma / tezgâh) |
| CombatMelee · CombatRanged · MovementAdvanced · Special | 976+991+703+903 | 70 | — (alınmaz) |

**`Sit_Chair_*` doğrudan bir açık kalemi karşılıyor:** bugün oturan müşteri `SEATED_DROP`
(= 1,30 − 1,75 = −0,45) ile gövdesi zemine **indirilerek** oturuyormuş gibi gösteriliyor;
`actor.ts` bunu kendi yorumunda "gerçek oturuş pozu Faz 6'da skinned modelle gelir" diye yazmış.
Gerçek oturuş pozu **elimizde ve ücretsiz**.

### B3 — Panonun A kolu YANLIŞ: sivilleştirme mesh düzenleme değil, düğüm gizleme

Her gövde **ad ad ayrılmış parça mesh'lerinden** kurulu ve hepsi aynı iskelete bağlı:

```
Knight   [ArmLeft:622 ArmRight:622 Body:1288 Cape*:84 Head:1082 Helmet*:418
          HelmetVisor*:428 LegLeft:628 LegRight:628]   → ekipman 3 düğüm / 930 üçgen
Barbarian[... BearHat*:1030 ...]                        → ekipman 1 düğüm / 1030 üçgen
Mage     [... Cape*:84 Hat*:396 ...]                    → ekipman 2 düğüm /  480 üçgen
Ranger   [... Cape*:84 Quiver*:255 ...]                 → ekipman 2 düğüm /  339 üçgen
Rogue    [... Cape*:84 ...]                             → ekipman 1 düğüm /   84 üçgen
Mannequin_Medium [6 parça, ekipman YOK]
```

Yani "zırh, pelerin, kılıç" **ayrı düğümler**; `visible = false` bir satır. Kare:
`docs/gorsel/ss/s14-sivil-idle.png` — beşi de ekipmanı sökülmüş, `Idle_A` pozunda, masanın yanında.
Sökülünce ne kaldığı: Knight gri tunikli bir adam · Barbarian sakallı kel bir adam (yeleği kalıyor)
· Mage uzun mor paltolu biri · Ranger boyun atkılı bir adam · Rogue yeşil tunikli bir kadın.
**Hiçbiri kılıç/zırh okumuyor.** Panonun "birkaç oturum mesh düzenleme" bedeli ölçümde yok.

### B4 — Klipler karaktere BAĞLANIYOR: 69/69 kemik, retarget yok

Klip dosyası ile karakter dosyası ayrı paketlerden geliyor; üç.js izleri **kemik adıyla** eşler.
Ölçüldü (`karakter-bak.html` her gövde için eşleşen iz sayısını sayar):

| gövde | eşleşen iz | sonuç |
|---|---|---|
| Knight · Barbarian · Mage · Ranger · Rogue | **69 / 69** | tam |
| Mannequin_Medium | 63 / 69 | 6 iz boşta (21 kemik; eksikler el yuvaları) |

Konsol yalnız `handslotl` için uyardı — o da elde tutulan eşya yuvası. **Mixamo'ya, retarget'a,
üçüncü bir araca gerek yok.** Aynı ölçüm KayKit'in klip `.glb`'lerinin **mankeni de taşıdığını**
gösterdi (dosya başına 6.916 üçgen ölü yük): repoya girerken mesh'i atmak ayrı bir kazanç.

### B5 — Ölçek: KayKit gövdesinin BAŞI boyun %50'si (bugünkü gövdede %33)

| | bugünkü sahip gövdesi | KayKit Rig_Medium |
|---|---:|---:|
| baş + başlığın boydaki payı | **%33** (0,42 / 1,29) | **%50** (1,10 / 2,20) |
| omuz eni (1,75'e ölçekli) | 0,58 (kapsül 0,60) | **0,58** |

Omuz eni **birebir tutuyor** — D-076'nın blob sınırı (`CAPSULE_RADIUS` 0,30 → 60 cm) aşılmıyor.
Tutmayan şey **düşey oran**: baş yarıyı yiyince bacak+gövde kısalıyor ve **donmuş mobilya yukarı
kayıyor**. Üç ölçek kolu aynı karede ölçüldü (`docs/gorsel/ss/s14-olcek-kollari.png`, Ranger):

| kol | ölçek | toplam boy | masa tablası (0,795) gövdenin neresinde |
|---|---:|---:|---|
| **Ö1** toplam-boy | ×0,794 | 1,79 | **göğüs** — mobilya büyük okunur |
| **Ö2** ara | ×0,88 | 1,98 | göğüs altı |
| **Ö3** gövde-hizası | ×0,98 | 2,21 | **bel** — gerçek insan oranı |

Ö1, D-076'nın kabul kriterini (masa üstü = boyun %45'i) **tanım gereği** korur ama gözle
çocuk-masada okunur. Ö3 gözle doğrudur ama `ACTOR_HEIGHT` 1,75'ten çıkar; o sayıdan **türeyen
her şey** yeniden ölçülür: `PLAYER_RADIUS` · `CAMERA_LOOK_Y` · `BUBBLE_Y` · `SEATED_DROP` ·
`REACH_TABLE` · nav ızgarasının engel şişirmesi. Bu, kullanıcının kendi kuralına (*"oranı
mobilyayı kısarak kovalama"*, `feedback_reference_scale_trap`) uygun olan koldur.

### B6 — Perf: PERSONEL ucuz, MÜŞTERİ pahalı — ve bu iki ayrı karar

Bugün müşteriler **tek InstancedMesh** (`Customers.tsx`, `NPC_CAP` 128 → **1 çizim çağrısı**).
Skinned gövde instance EDİLEMEZ: her biri kendi iskeletini ve kendi `AnimationMixer`'ını taşır.
Ölçüm (RTX 3060, ANGLE/D3D11 — **mutlak sayı telefonla karşılaştırılamaz, oran taşınır**):

| N | instanced kapsül | N× skinned Ranger | kare süresi | çizim çağrısı |
|---:|---|---|---|---|
| 5 | 0,04 ms · 1 çizim | 0,60 ms · **40 çizim** | ×15 | ×40 |
| 12 | 0,04 ms · 1 çizim | 1,11 ms · **96 çizim** | ×28 | ×96 |
| 24 | 0,05 ms · 1 çizim | 2,20 ms · **192 çizim** | ×44 | ×192 |
| 48 | 0,04 ms · 1 çizim | 4,02 ms · **384 çizim** | ×101 | ×384 |

**Karakter başına 8 çizim çağrısı** — çünkü gövde 8 parça mesh'e bölünmüş (B3'ün sökülebilirliğinin
bedeli). Beş personel = 40 çağrı (taşınır); 24 müşteri = 192 çağrı (mobil bütçesi tipik 100–200).
Azaltma kolu ölçüldü ama denenmedi: **her gövdenin tek materyali var**, yani parçalar birleştirilebilir
→ karakter başına 1 çizim. Sökülebilirlik birleştirmeden ÖNCE uygulanırsa ikisi çelişmez.

### B7 — Kol D (Quaternius) ölçüldü: pano burada da yanlış, ve bedel 80 MB doku

Pano *"6 temel gövde + 62 parçalı modüler kıyafet… sivil giydirme buradan çıkar"* diyordu.

| iddia | ölçülen |
|---|---|
| 6 temel gövde | **2** (`Superhero_Male_FullBody` · `Superhero_Female_FullBody`) + 8 saç |
| 62 sivil kıyafet parçası | itch sayfasının adı **`modular-character-outfits-fantasy`**; ücretsiz katmanda 4 kıyafet (Peasant · Ranger), 20 parça |
| "oranlar KayKit'ten ince" | doğru ama asıl fark bu değil |

**Asıl fark doku hattı:** Quaternius **PBR** çalışıyor — karakter başına BaseColor + Normal +
Roughness/ORM. Ücretsiz taban karakterlerin Godot/UE doku klasörü **80,08 MB**; tek bir normal
haritası **4,2 MB**, `T_Peasant_Normal.png` **13,8 MB**. Tek bir sivil karakterin repo bedeli
≈ **22 MB** (gövde + dokular + UAL klip dosyası), bugünkü `models/` klasörünün TAMAMI 17,2 MB.
KayKit'in karşılığı: karakter başına **334–529 KB, doku gövdenin içinde gömülü.**
Bu, `docs/assets.md` §5'in zaten yazılı hükmüyle aynı yöne çıkıyor (foto-PBR düz gölgeli sahnede
yamalı durur + mobil bellek). Quaternius'un klip kütüphanesi (UAL1, 43 klip, **`Sitting_*`,
`PickUp_Table`, `Idle_Talking_Loop`**) iyi ama 65 kemikli **başka** bir rig — KayKit gövdesine
takılmaz.

### B8 — Kol F tabanı (bugünkü ilkel gövdeler)

| | değer |
|---|---|
| `Player.tsx` (sahip + tepsi) | **20** elle yazılmış `<mesh>` |
| `Waiter.tsx` (garson) | 4 |
| `Dishwasher.tsx` (bulaşıkçı) | 1 |
| müşteri | InstancedMesh kapsül **260 üçgen** + baloncuk 180 |
| lisans yüzeyi · stil riski · para | **sıfır · sıfır · sıfır** |
| gelmeyen | iskeletli animasyon; hareket `useFrame` parça salınımı olarak kalır |

### B9 — Repo bedeli (kol başına, `models/` bugün **17,2 MB**)

| kol | ne girer | +MB | toplam |
|---|---|---:|---:|
| **A-dar** | 1 gövde + General + MovementBasic | +1,9 | 19,1 |
| **A-orta** | 5 gövde (sahip/garson/bulaşıkçı/çaycı/müşteri) + General + MovementBasic + Simulation | +4,2 | **21,4** |
| **A-geniş** | 6 Adventurer + 2 manken + Tools dahil 5 klip | +7,5 | 24,7 |
| **A-tam** | 12 gövde + 8 Rig_Medium klip dosyası | +11,5 | 28,7 |
| **D** | 1 Quaternius sivil karakter + UAL1 | **+22,0** | 39,2 |
| **F** | — | 0 | 17,2 |

Klip dosyalarındaki ölü manken gövdesi çıkarılırsa A kollarından ≈ 0,5–1,5 MB daha düşer (§B4).

### B10 — Oturma klibi çalışıyor; "tabureye oturuyor mu" bir ÖLÇEK sorusu değil, montaj parametresi

`Rig_Medium_Simulation:Sit_Chair_Idle` üç ölçekte de uygulandı (`docs/gorsel/ss/s14-oturma.png`),
**50/50 iz** tuttu. İlk okuma yanlıştı ve düzeltildi: gövde ayağı zemine yapışacak şekilde
konumlanınca kalça 0,193 / 0,213 / 0,238'e düşüyor, yani taburenin 0,45'inin **altında** kalıyor.
Bu modelin kusuru değil — oturma klibi gövdeyi **rig köküne** göre kurar, ayak zemine
yapıştırılmaz. Çıkan fark doğrudan **montaj kaldırmasıdır** (+0,257 / +0,237 / +0,212) ve bugünkü
`SEATED_DROP`un (−0,45) skinned karşılığıdır. **Ölçek kolu bu sayıya göre seçilmez;** ayakta
ölçülen ilişkiye (§B5) göre seçilir.

### B11 — İkinci tur (kullanıcı yönlendirmesi): "bunlar savaş karakteri, benzerini bulalım"

Karar paketine cevap: *"karakter tipleri yapısı boyutu proporsiyonu çok iyi ama bunlar savaş
karakteri, başka bir şey araştırıp bulamaz mıyız bunun gibi"*. Yani **oran onaylandı, konsept
reddedildi** — ve B3'ün hükmü bu noktada eksik kalıyor: ekipman düğümü sökülüyor ama altındaki
**kemer, bilek bandı, deri askı GEOMETRİDE** duruyor, renk değil.

| aranan | bulunan |
|---|---|
| CC0 + KayKit oranı + modern/sivil | **yok.** itch CC0/low-poly/rigged taramaları ya gerçekçi oran ya PSX/voxel veriyor |
| KayKit Mystery Monthly 4/5/6 ($19,99/paket) | aynı sanatçı, aynı rig, **hâlâ fantezi**: 14 karakterde sivil olan Series 6 *Farmers*, Series 5 *Hiker · Protagonists · Helpers* — paket başına 2-3, kıraathane değil |
| **Manken gövde** (ücretsiz, Character Animations içinde) | **ekipman 0 · deri 0 · aynı rig · 410 KB · 6 düz parça** |

**Parça = kıyafet.** `tools/olcum-karakter-goz.mjs` (yeni) UV gözlerini parça parça ölçtü:
Ranger'ın bacağı %87 tek göz (2,3 = pantolon) + %13 (1,7 = çizme), gövdesi 6 göze yayılı (tunik +
kemer + askı). Yani **renk taşınabilir, geometri taşınmaz** — mankende taşınacak geometri yok.

Mankenin gövdesi altı ayrı mesh olduğu için kıyafet doğrudan **parça rengi** oluyor ve bu, D-013'ün
(flat-shaded low-poly = nihai stil) tam istediği şey. Kimlik parçaları — **kasket · bıyık · önlük** —
bugün `Player.tsx`'te **zaten elle çizili**; tek fark artık `head` ve `chest` KEMİKLERİNE takılmaları,
yani yürüme/oturma klibi onları da taşıyor. Denendi ve çalıştı (`docs/gorsel/ss/s14-roller.png`,
üç rol: çaycı · garson · müşteri).

**Eksik kalan tek şey yüz:** manken boş kafayla geliyor. Göz/burun bugün `Player.tsx`'te çizili
(2 küre + 1 küre), aynı yolla başa takılır. Yani bu bir asset seçimi değil — **bizim karakterimiz,
KayKit'in iskeleti ve onaylanmış oranı üstünde.**

---

## §Karar

*(BOŞ — karar paketi kullanıcıya sunulacak, seçim buraya ve `decisions.md`'ye D-1xx olarak yazılacak.)*

## §Uygulama

*(BOŞ)*

## §Bekçi

*(BOŞ)*
