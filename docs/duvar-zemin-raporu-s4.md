# S4 — Duvar + zemin KayKit'e geçer mi? (ÖLÇÜM RAPORU)

**Tur:** Faz S kalem 4 · 2026-09-09
**Araç:** `tools/olcum-duvar.ts` → ham çıktı `docs/olcum-duvar.txt`
**Kapı:** bu tur `economy.config.ts` / `tick.ts` / `rules.ts`'e DOKUNMAZ — varyant kapısı
tetiklenmiyor. Yine de ölç→sor→uygula sırası uygulanıyor: takas görsel ve **geri dönülemez
görünüyordu**, kullanıcı da bu turda açıkça *"beğenmezsek eskisine dönebilir olalım"* dedi.

---

## Soru

KayKit `restaurant-bits` duvar ve zemin modülleri oyunun duvar hatlarına oturuyor mu; oturmuyorsa
fark nasıl kapanır ve bunun bedeli nedir?

## Yöntem — ve yöntemin kendi hatası

Ölçüm iki kez yapıldı, çünkü **ilk yöntem yanlıştı ve yanlış olduğu sayıdan anlaşıldı.**

İlk denemede delikler (kapı/pencere boşluğu) *vertex histogramıyla* arandı: modelin köşe
noktaları x eksenine kovalanıp boş kovalar "delik" sayıldı. Düşük-poli modelde bu **çalışmaz** —
düz bir yüzün ortasında hiç vertex yoktur. `wall`ın 152 vertex'inin **tamamı** x = ±1,9 / ±2,0'da;
panelin ortası tek bir dörtgenle geçiliyor. Yöntem kapı boşluğunu **0,68** ölçtü, gerçeği **1,28**.

İkinci yöntem: **üçgene ışın atma** (Möller-Trumbore). Bir (x,y) noktasından +z yönünde giden ışın
hiçbir üçgeni kesmiyorsa orası gerçekten boştur. Aynı ışın, kestiği yerin z'sini de verdiği için
yüzey profili (kabartma, oluk, pah) de bununla ölçüldü.

> İlk uygulamada ışın testinin kendisi de sessizce yanlıştı: `h = d × e2` çapraz çarpımının
> işareti terstiydi. `u` doğru çıkıyordu (işaret determinantla sadeleşiyor) ama `v` ve `t` ters
> dönüyor, sonuç olarak **hiçbir üçgen kesilmiyordu** ve araç duvarın tamamını "delik" ilan
> ediyordu. Sayı absürt olduğu için (4,00 genişliğinde bir kapı) yakalandı — sessizce makul bir
> sayı üretseydi rapora girerdi.

Duvar hatlarının kendisi de ölçülemiyordu: parça listesi `Scene.Walls`ın içinde bir `for`
döngüsünün gövdesindeydi ve `Scene.tsx` vitest'te import edilemiyor (`recolor` → `Image`). Liste
`src/components/three/wallLook.ts`'e çıkarıldı — S3'ün `kitchenLook.ts` deseni. **Görüntü
değişmedi** (aynı `m`, aynı `t`, aynı kapı kesmesi, aynı sıra); değişen tek şey, artık
ölçülebilir ve bekçilenebilir olması.

---

## §Bulgular

### B1 — Mimari ölçek 0,80, modül eni 3,20; hiçbir hat buna tam bölünmüyor

KayKit duvarı native **4,000 × 4,000 × 0,500**. Oyunun duvarı `WALL_H` = **3,20** →
**S = 3,2 / 4 = 0,800**. Bu **mobilyanın 0,90'ı değildir** (D-099 §1 bunu zaten ölçmüştü:
mobilya insana göre, duvar odaya göre ölçeklenir).

| | native | dünya (×0,80) |
|---|---|---|
| `wall` eni | 4,000 | **3,200** |
| `wall` kalınlığı | 0,500 | **0,400** |
| `wall_half` eni | 2,000 | **1,600** (origin x 0…2 — **ortalanmamış**) |
| `pillar_A` boyu | 4,100 | 3,280 (duvardan 0,08 **uzun**) |

Oyunun duvar hatları (ölçülen, `docs/olcum-duvar.txt` §2):

| uzunluk | nerede | tam modül | kalan | kalan/modül |
|---|---|---|---|---|
| 35,00 | bandın arka kabuğu | 10 | 3,00 | 0,937 |
| 18,00 | yan duvarlar | 5 | 2,00 | 0,625 |
| 15,30 | ön cephe (kapı kesilmiş) | 4 | 2,50 | 0,781 |
| 10,80 | arka yarının yanları | 3 | 1,20 | 0,375 |
| 7,60 | bandın yanları | 2 | 1,20 | 0,375 |
| 6,80 | tek alanlık ön cephe | 2 | 0,40 | 0,125 |

**Hiçbiri tam bölünmüyor.** Fark ya gerdirmeyle ya artık parçayla kapanır → §B3'ün dört kolu.

### B2 — Modülün kendi profili: yatay oluğu **1,60**'ta, oyununki **0,94**'te

Bu turun en pahalı bulgusu, ve adına bakarak asla görülemezdi.

`wall` düz bir levha değil, **kendi profili olan bir pano**:

| y native | y dünya | ön yüz z | duvar kalınlığı |
|---|---|---|---|
| 0,50 | 0,40 | 0,250 | 0,400 |
| 1,50 | 1,20 | 0,250 | 0,400 |
| **2,00** | **1,60** | **0,150** | **0,240** ← yatay oluk |
| 2,50 | 2,00 | 0,250 | 0,400 |
| 3,50 | 2,80 | 0,250 | 0,400 |

- **① Yatay oluk** — modülün yüzü **dünyada y = 1,60**'ta, 0,16 derin bir kuşakla bölünüyor.
  Bu KayKit'in kendi lambri hattı. **Oyunun maket duvarında aynı hat 0,94'te** (`WAINSCOT_H` 0,9
  + çıta 0,94). Yani duvar yüksekliğinin **%29**'unda. KayKit'inki **%50**'sinde, tam ortada.
  **Takas bu hattı 0,66 yukarı taşır** — bu bir doku farkı değil, odanın oranının değişmesidir.
  Maketin duvarı "koyu lambri + üstünde badana" okunur; KayKit'inki "iki eşit kuşak".
- **② Çevre pahı** — x 1,90 → 2,00 arasında yüz 0,250'den 0,171'e iniyor: **0,08 enli bir pah**.
  İki modül yan yana gelince dikişte **0,16 enli bir V-oluk** okunur. Çıkıntı değil **girinti**;
  paketin kendi döşeme ritmi bu. Modülleri **bindirmek** (üst üste kaydırmak) bu yüzden işe
  yaramaz: pah panelin ortasına düşer.
- **③** x ekseninde gerdirme yalnız bu **dikey** pahı gerer; **yatay oluk etkilenmez.**

### B3 — Döşeme kolları: eş dağıtım diğer üçünü ezip geçiyor

| kol | parça | gerilen | en kötü gerilme | ortalama | pah en kötü (norm. 0,080) |
|---|---|---|---|---|---|
| K1 her hat tek modül, boyuna gerilir | 20 | 20 | **994 %** | 382 % | 0,875 |
| K2 tam modüller + gerilmiş artık | 105 | 20 | **87,5 %** | 42,8 % | 0,150 |
| K3 tam + yarım + gerilmiş artık | 119 | 20 | **75,0 %** | 55,6 % | 0,140 |
| **K4 eş dağıtım** (n = yuvarla(L/3,2), hepsi aynı oranda) | 99 | 99 | **18,7 %** | **6,1 %** | **0,095** |

K4'ün hat başına gerçek gerilmesi:

| uzunluk | n | gerilme | modül eni |
|---|---|---|---|
| 35,00 | 11 | **−0,6 %** | 3,182 |
| 18,00 | 6 | −6,3 % | 3,000 |
| 15,30 | 5 | −4,4 % | 3,060 |
| 6,80 | 2 | +6,2 % | 3,400 |
| 10,80 | 3 | +12,5 % | 3,600 |
| 7,60 | 2 | **+18,7 %** | 3,800 |

En kötü hâlde dikey pah 0,080 → 0,095 oluyor. K2'de aynı sayı 0,150 — ve orada bozulma **tek bir
parçada toplanır**, yani gözle "yamalı" okunur. K4'te bozulma hatta eşit dağıldığı için dikiş
ritmi düzgün kalır.

**Parça sayısı draw-call değildir:** her duvar modeli tek node / tek mesh / tek materyal
(`restaurant` atlası) → `<Merged>` ile model başına **1 draw-call**. Kıyas: `Tables.tsx` bugün 5
mobilya modelini ~8 draw-call'da çiziyor.

### B4 — Kalınlık 0,26 → 0,40; hiçbir şeyi kesmiyor

Hat merkezinden iç yüze bugün 0,130 (en kalın katman olan çıta), KayKit'te 0,200 →
**içeri 0,07 fazladan taşma**. Duvar collision değil (`activeSolids` duvarı içermez), yani
yürümeyi etkilemez. Katıları kesip kesmediği ölçüldü:

| duvar hattı | en yakın katı | KayKit sonrası |
|---|---|---|
| 0/left @ −17,50 | 4,960 | 4,890 |
| 0/front @ 17,50 | 4,050 | 3,980 |
| 2/left @ −17,50 | 2,900 | **2,830** ← en dar |
| 2/back @ −17,40 | 6,600 | 6,530 |

**Kesişen hat: 0.** En dar kalan boşluk 2,83 (oyuncu yarıçapı 0,47). Bu kalem risk değil.

### B5 — Kapı: modülün deliği oyunun kapısının **%29**'u

| | dünya |
|---|---|
| `wall_doorway` deliği | **1,28 × 2,28** |
| `door_A` kanadı | 1,28 × 2,24 (deliğe tam oturuyor) |
| `wall_window_open` boşluğu | 1,28 en · y 1,00 … 2,28 |
| **oyunun kapısı** | **4,40 × 2,65** |

Oyunun kapısı **1,37 modül** geniş — tek `wall_doorway` yetmez, **3,12 dar** kalır. Modülün
deliği oyuncu çapından (0,94) geniş, yani geçilebilir ama **tek kişilik**. Ana giriş bugün
maket v13'ün transkripsiyonu (söve + lento + **alınlık** + kordon) ve D-070 gereği maket kazanır.

### B6 — `wall_decorated` düz duvar DEĞİL

bbox 4,005 × 4,000 × **2,912**. Profil (ön yüz z, ışınla):

| y dünya | salona taşma |
|---|---|
| 0,32 | **1,576** |
| 0,80 | 1,560 |
| 1,60 | −0,080 (yatay oluk) |
| 2,08 | 0,387 |
| 2,40 – 2,88 | 0,640 |

Alt yarısı **1,56 salona taşan bir oturma bloğu**, üst yarısı 0,64 taşan bir raf/tente. Salon
duvarında kullanılırsa **collision listesine girmek zorunda**, yoksa içinden geçilir. Adı "süslü
duvar" ama işlevi duvar+mobilya — S3'ün dersi (*ada bakma, ölç*) burada bir kez daha çıktı.

### B7 — Zemin: `floor_kitchen` mutfağa oturur, salona oturmaz

| | dünya |
|---|---|
| `floor_kitchen` karosu | 3,20 × 3,20 · **kalınlık 0,40** (zemine gömülmeli, y kayması −0,40) |
| `floor_kitchen_small` | 1,60 × 1,60 |
| mutfak fayans alanı | **12,71 × 7,46** |
| büyük karoyla | 3,97 × 2,33 → eş dağıtımla **4 × 2**, gerilme **−0,7 % × +16,6 %** |
| küçük karoyla | 7,94 × 4,66 → eş dağıtımla **8 × 5**, gerilme **−0,7 % × −6,8 %** |

Küçük karo z ekseninde belirgin daha iyi oturuyor (−6,8 % ↔ +16,6 %). Bugünkü hâli tek
`planeGeometry` + düz renk `#d9cdb4` (2 üçgen).

**Salon zemini bu turun konusu değil:** D-073'te karardır (*"kesinlikle parke değil, maketteki
gibi tek düz ahşap"*) ve mağaza ürünüdür (5 kalem). Büyük karoyla 113 karo ederdi.

### B8 — Duvar teması bir MAĞAZA ÜRÜNÜ

`economy.config.cosmetics.wallThemes`: **krem 0 ₺ · Çay Yeşili 10.000 ₺ · Çini Mavisi 14.000 ₺.**

Bugün tema üç **kutu rengidir** (`cream` / `wainscot` / `rail`) ve `wallPanel.wallBoxes` doğrudan
boyar: tema değişince üç instance rengi değişir, başka hiçbir şey olmaz. KayKit duvarı tek
`restaurant` atlasına bağlı — renk artık materyalden değil **atlastan** gelir.

Hattın karşılığı S3'te ölçüldü ve **hazır bekliyor**: `tools/atlas-goz.mjs` + `tools/atlas-ton.mjs`
(+ `recolor.ts`'in çalışma-zamanı atlas kopyası, masalarda 8 draw-call'da kalıyor). Yani tema
kaybolmak zorunda değil — ama **üç temanın da atlasta karşılığı üretilmeli**, yoksa 24.000 ₺'lik
iki mağaza kalemi hiçbir şey yapmaz hâle gelir.

### B9 — Geri dönüş bir revert değil, bir AYAR olabilir

Kullanıcı şartı: *"duvarı direkt komple KayKit'e bağlama, beğenmezsek eskisine dönebilir olalım."*

Eski duvar `wallPanel.tsx`te ve kendi başına çalışıyor: `wallBoxes()` saf fonksiyon, `WallPanels`
tek InstancedMesh (9 parça × 3 kutu = 27 instance, 1 draw-call). KayKit hattı onun **yerine**
geçmek zorunda değil, **yanına** konabilir — `wallLook.WALL_RUNS` ikisini de aynı parça
listesiyle besler.

- **Maliyet:** iki çizim hattı bakımda kalır.
- **Kazanç:** kip değiştirmek tek satır; geri dönüş bir commit revert'ı değil bir ayar.
  `Model.tsx`in fallback deseni zaten bunun aynısı (`.gltf` yoksa ilkel şekle düş).

---

## Karar (D-100)

Karar paketi dört soruyla sunuldu; kullanıcı **"önce deneyelim, gözle karar vereyim"** dedi ve
tur ölçümden **denemeye** döndü. Sonuçlar:

| Kol | Karar | Gerekçe |
|---|---|---|
| Duvar KayKit'e geçsin mi | **HAYIR** | ekranda görüldü ve reddedildi (aşağıda) |
| Döşeme kolu | K4 eş dağıtım | ölçülen dört koldan açık ara kazanan (%18,7 ↔ %87,5) |
| Ana giriş | maket kalır | modülün kapı deliği 1,28, oyunun kapısı 4,40 (D-070) |
| `wall_decorated` | kullanılmaz | salona 1,93 taşıyor, duvar değil duvar+mobilya |
| Dikiş ritmi | sütunsuz | `pillar_A` 3,28 boyunda, duvarı 0,08 aşıyor; paketin tasarımı dikişli |
| Mutfak zemini | **küçük karo · siyah-beyaz** | dört kare karşılaştırıldı (`docs/gorsel/ss/s4-zemin-*.png`) |
| Kahve zemin | **mağaza teması** (10.000 ₺) | paket kahve zemin MODELİ içermiyor, rengi içeriyor |
| Mutfak teması (tezgâh+dolap) | **REDDEDİLDİ** | *"bunları sen kendin uydurmuşsun"* |

### Duvar neden reddedildi — biri ölçülmüştü, biri KAÇIRILMIŞTI

1. **Duvar ikiye bölünüyor.** §B2 bunu önceden söylemişti: modülün yatay oluğu y = 1,60'ta,
   maketin lambri hattı 0,94'te. Kullanıcı ekranda görünce *"duvar 2'ye bölünük"* dedi.
2. **Parçalar birbirinden farklı.** K4 gerilmeyi **her hat İÇİNDE** eşitliyor ama **hatlar
   ARASINDA** eşitlemiyor: modül eni 3,00 · 3,06 · 3,18 · 3,40 · 3,60 · 3,80 çıkıyor (**%27
   fark**) ve iki hattın buluştuğu köşede yan yana düşüyor. Kullanıcı: *"her parça arasında fark
   var."* **Bu ölçülmedi** — rapor gerilmeyi hat içinde ölçtü, bina genelinde değil. Tekrar
   denenirse çözüm bina için TEK ortak adımdır.

Kullanıcı ayrıca *"düz duvarlı başka bir paket var mı"* diye sordu. Üç paket tarandı: yok.
`wall` yalnız iki düz renk gözü kullanıyor ([1,2] yeşil + [1,4] krem), karo ızgarası hiç yok.

### Kahve zemin: renk paketin, birleşim bizim

Kullanıcı paketin kendi kahve zemini olduğunu düşünüyordu. **Yok:** üç pakette zemin olarak
yalnız `floor_kitchen` ve `floor_kitchen_small` var, ikisi de aynı iki göze bakıyor. Ama KayKit'in
dokusu bir resim değil **8×4'lük bir renk şeridi**, ve şeritte kahve gözleri VAR. Paketin tanıtım
görselindeki kiremit zemin de böyle yapılmış: aynı model, başka göz. Bu yüzden kahve tema
**boyayarak değil UV'yi taşıyarak** kuruldu — renk KayKit'in paletinden geliyor, tek-stil kilidi
bozulmuyor. Atlas KOPYALANMADI: `[0,4]` gözünü `kitchentable_sink_large_decorated` de kullanıyor,
boyansaydı lavabo da renk değiştirirdi.

## Uygulama

- **`wallLook.ts`** — parça listesi + K4 döşeme matematiği (`esDagit` · `kayModuller`).
- **`KayWalls.tsx`** — KayKit duvar kipi. **Eski duvar SİLİNMEDİ**, yanında duruyor; geri dönüş
  bir revert değil `config/kabuk.ts`in tek satırı (kullanıcı şartı). Varsayılan `'maket'`.
- **`atlasUV.ts`** — atlas gözü değiştirme (UV taşıma). `recolor.ts`ten farkı: atlas kopyalanmaz.
- **`tools/atlas-renk.mjs`** — gözlerin GERÇEK rengini ölçer (bağımlılık yok; PNG node `zlib` ile
  çözülür). İlk denemede göz tahminle seçilmişti ve yanlış kahve çıkmıştı.
- **Mutfak zemini** `floor_kitchen_small` karolarıyla (8 × 5, eş dağıtım) + `kitchenTheme` mağaza
  kalemi (`klasik` 0 ₺ / `kahve` 10.000 ₺). Kayıt **v32 → v33** göçüyle taşındı.
- **Bulaşık** `kitchentable_sink_large` ↔ `_decorated` çiftine geçti: kirli kap varken dolu model,
  bulaşıkçı yıkayınca boş model + kısa su halkası. **`tick.ts`e DOKUNULMADI** (E3/D-096 deseni:
  var olan `cleanCups` sayacının artışı okunuyor, yeni durum üretilmiyor).
- **Ön hat birleşti** (`onHat`): üç tezgâh komşusuyla arasındaki boşluğun ortasına kadar uzar,
  collision kutuları DEĞİŞMEDEN. Bulaşık bugüne kadar yanlış çiziliyordu — kutusu 2,00 × 1,00 iken
  çizimi elle 1,4 × 0,8 yazılmıştı; artık üçü de kutusundan türüyor.
- **Batı duvarı** paketin peçetelik rafı + havluluğuna geçti; oradaki çay bardağı rafı kalktı
  (arka duvardaki ikisi kaldı). Damacana rafı kaldırıldı. Depodaki açık kasaya sucuk kondu.
- **HUD:** oto-toplama toast'ı yuvarlanıyor (*"273.3333"* binlik ayracı gibi okunuyordu) ·
  görev hattı bitiş bandı 5 sn sonra kalkıyor (kalıcıydı).

**Denenip GERİ ALINANLAR** (ikisi de kullanıcı kararı): tezgâh arkası fayans bandı — pakette duvar
karosu yok, zemin karosunu dik çevirmek tutmadı · tezgâh üstü kavanoz/tencere/tahta süslemeleri.

## Bekçi

- `tests/wall-look.test.ts` — 11 test, **4 mutasyon** (`WALL_M` 0,5→0,4 · arka-kenar atlaması
  silindi · kapı kesmesi silindi · `WALL_T` 0,2→0,3). Dördüncüsü ÖNCE KAÇTI: kalınlık testi sabiti
  sabitle karşılaştırıyordu (`toBe(WALL_T)`), yani kendini doğruluyordu → beklenti raporun
  sayısına (0,20) bağlandı.
- `tests/kitchen-look.test.ts` 15 → **16 test**, **3 mutasyon** (havluluk ön sınıra dayandı · raf
  ankrajı elle 0,55'e döndü · v32 göçü kaldırıldı). Bekçi bu turda **iki gerçek hata yakaladı**:
  peçetelik rafı duvarın tepesini 0,17 aşıyordu, havluluk çay ocağının kutusuna 0,12 giriyordu.
  *"Her duvar ünitesinin tepesi WALL_H'de"* kuralı DARALTILDI (gevşetilmedi): üst hizalılar
  birebir hizada + HER duvar ünitesi duvarın içinde ve tezgâhın üstünde.
- `tests/logic.test.ts` — v32 → v33 göç bekçisi eklendi: ilerleme (para · pad · masa · kozmetik)
  korunur, yeni alan varsayılanla doğar.

**vitest 798 · duman 42/42 · `tsc -b` temiz · denge sayısı DEĞİŞMEDİ** (kozmetik fiyatı var olan
merdivenden kopyalandı; oynanışa etkisi yok).

---

## Bu turda ayrıca kapanan iki açık

- **`wallLook.ts` çıkarıldı** → duvar parçaları ilk kez bekçilendi: `tests/wall-look.test.ts`
  11 test, **4 mutasyonla** doğrulandı (`WALL_M` 0,5→0,4 · arka-kenar atlaması silindi · kapı
  kesmesi silindi · `WALL_T` 0,2→0,3). İlk hâlinde dördüncüsü **kaçtı**: kalınlık testi sabiti
  sabitle karşılaştırıyordu (`toBe(WALL_T)`), yani kendini doğruluyordu. Beklenti raporun
  sayısına (0,20) bağlandı, mutasyon yakalandı.
- **`tools/olcum-duvar.ts`** yeniden kullanılabilir: delik/profil ölçümü S6 (pencere + dış cephe)
  ve S7 (lavabo kapıları) turlarında aynen kullanılacak.
