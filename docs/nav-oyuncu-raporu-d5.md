# D5 — Nav ızgarası ↔ oyuncu çarpışması: iki dünyanın ölçümü

**Araç:** `tools/olcum-nav-oyuncu.ts` (analitik — tick koşmaz) ·
**Ham çıktı:** `docs/olcum-nav-oyuncu.txt` (tam koşu, 20 açıklık) · `docs/olcum-nav-oyuncu.damga.txt`
**Koşu:** `OLCUM=tam npx tsx tools/olcum-nav-oyuncu.ts` · damgalar temiz · çıkış kodu 0

## 1. Soru

Oyuncunun **yürüdüğü** dünya ile rotaların **kurulduğu** dünya aynı değil:

| | katılar | şişirme | alan kelepçesi |
|---|---|---|---|
| **personel/NPC** (`getNavGrid`) | `navSolids` — masa + servis + banket, **sandalyesiz** | `actorRadius` **0,28** | yok |
| **oyuncu** (`playerMoveSystem`) | `activeSolids` — üstüne **sandalyeler** | `playerRadius` **0,47** | `clampToOpenAreas` |

Bu fark iki yerde ısırdığı **bilinerek** yamayla geçilmişti — `tools/olcum-bardak.ts` botunun
±30/60/90° kayma + kara liste + kurtulma yığını, ve D-084 P2 damgalarının bulup açık bıraktığı
"B1 · oyuncu kipinde bot hiç yürümüyor" kusuru. **Hiç ölçülmemişti.** Ölçülen dört kol:

- **k1 ayrışma** — personele açık olup oyuncuya kapalı hücre oranı
- **k2 ulaşılabilirlik** — her etkileşim noktası oyuncunun doğuş bileşeninden erişilebilir mi
- **k3 tuzak cepler** — oyuncu dünyasının bağlı bileşenleri
- **k4 pay** — her noktada oyuncuya kalan pay (tetik yarıçapı − en yakın erişilebilir hücre)
- **k5 rota izlenebilirliği** — bugün kurulan rota oyuncunun dünyasında kaç hücreden geçemiyor

Denge dosyalarına (`economy.config.ts` · `tick.ts` · `rules.ts`) dokunulmuyor; varyant kapısı
devrede değil. Ölç-önce disiplini yine de uygulandı (iki commit).

## 2. Bulgular

### Bulgu 1 — ayrışma gerçek ve içerikle büyüyor (k1)

| açıklık | personele açık | oyuncuya açık | **ayrışan** |
|---|---|---|---|
| 1 alan · 1 masa | 2.931 | 2.952 | 91 · **%3,1** |
| 1 alan · 4 masa | 2.770 | 2.676 | 206 · **%7,4** |
| 2 alan · 8 masa | 5.709 | 5.428 | 394 · **%6,9** |
| 3 alan · 20 masa | 9.082 | 8.337 | **745 · %8,2** |

Ayrışma masa sayısıyla tek yönlü artıyor (her masa iki dünyaya farklı katkı yapıyor: nav yalnız
masa gövdesini, oyuncu ayrıca sandalyeyi görüyor). Alan açılışında oran **düşüyor** (7,4 → 4,3),
çünkü yeni alan önce boş zemin getiriyor; sonra kendi masalarıyla yine tırmanıyor.

### Bulgu 2 — hiçbir içerik kilitli kalmıyor (k2 + k3)

**20 açıklığın 20'sinde de:** ulaşılamayan etkileşim noktası **0**, oyuncu dünyasının bağlı
bileşeni **1**, doğuş bileşeni dışında kalan hücre **0**.

Yani bu hatanın "oyuncu içeriğe ulaşamıyor / bir cebe hapsoluyor" biçiminde bir zararı **yok** —
ölçüm bu hipotezi çürüttü. Ölçülen etkileşim kümesi: her açıklıkta sahnede olan pad'ler, masa ve
servis yükseltme noktaları, tepsi alma noktası, ve **paranın düştüğü kutunun dört köşesi**
(müşteri parayı `masa ± 0,5 · masa_z + 0,6 ± 0,5` kutusuna bırakıyor).

### Bulgu 3 — zarar ROTADA (k5)

| açıklık | rota | **kirli rota** (≥1 kapalı ara nokta) | kirli ara nokta | oyuncu yolu / personel yolu |
|---|---|---|---|---|
| 1 alan · 1 masa | 13 | 3 · %23,1 | 12/207 · %5,8 | ×1,085 |
| 1 alan · 4 masa | 25 | 14 · %56,0 | 55/433 · %12,7 | ×1,100 |
| 2 alan · 8 masa | 45 | 33 · %73,3 | 238/1.481 · %16,1 | ×1,074 |
| 3 alan · 20 masa | 108 | **80 · %74,1** | 775/5.380 · %14,4 | ×1,069 |

Dolu katta **her dört rotadan üçü** oyuncunun içine giremeyeceği en az bir ara noktadan geçiyor;
ara noktaların **%14-16'sı** oyuncuya kapalı hücre. Erken oyunda bile 1 masada %23, 4 masada %56.

Bot bugün bu rotayı izlemeye çalışıp masaya dayanıyor — `olcum-bardak.ts`'teki kayma/kara
liste/kurtulma yığını bu satırın yamasıdır.

### Bulgu 4 — doğru rota neredeyse bedava (k5, son kolon)

Oyuncunun **kendi** dünyasında her hedefe yol var ve o yol yalnız **×1,05-1,14** daha uzun
(dolu katta ×1,069). Yani bu bir yerleşim darlığı değil, **eksik bir ızgara**: doğru dünyada
rota kurmanın bedeli yolun %5-14 uzaması, karşılığı rotaların %74'ünün geçerli hâle gelmesi.

### Bulgu 5 — en dar pay yapısal ve sabit (k4)

En kıl-payı geçen nokta **20 açıklığın 20'sinde de aynı**: `masa1:para(−x,−z)` — masanın
uzak köşesine düşen para, payı **0,34 br**. Sabit olması içerik yoğunluğunun bu payı
daraltmadığını söylüyor: pay masanın ayak izi + `playerRadius` ile `money.pickupRadius` (1,4)
arasındaki geometriden geliyor, kalabalıktan değil. Masa ayak izi büyürse ya da toplama
yarıçapı küçülürse **ilk kırılacak yer burasıdır**.

### Bulgu 6 — aracın kendisi bir sahte bulgu üretti ve düzeltildi

İlk kısa koşu "`pad:table2/3/4` ulaşılamıyor (0,05-0,15 br açık)" dedi. Doğru cümle, ölçülen şey
yok: **masa pad'i açacağı masanın tam yerinde durur** (`padPos.table2 = ALL_TABLES[1].table`),
yani masa kurulduğu anda pad biter. Araç pad'i masa varken soruyordu. `padAktif()` eklendi —
pad yalnız **henüz kurulmamış** hedefi için sorulur (alan pad'leri de aynı: `zone2`, alan 2
açılınca biter). Düzeltmeden sonra k2 tamamen temizlendi.

D-084'ün kuralının bu tura düşen hâli: **araç bir şeyin NEREDE olduğunu değil, NE ZAMAN var
olduğunu da modellemek zorunda.**

### Bulgu 7 — sim botunun göçü DENENDİ, ölçüldü ve GERİ ALINDI

`tools/olcum-bardak.ts` botu bugün rotasını personelin ızgarasında kuruyor (bu raporun sebebi).
Botu `getPlayerNavGrid`'e bağlamak bu turun doğal ikinci adımıydı; denendi ve **çalışmadı**:

| | B1 | B2 | B3 | B4 |
|---|---|---|---|---|
| taban (personel ızgarası, HEAD) | 0,0 | **159,1** | ölçülü | ölçülü |
| oyuncu ızgarasına bağlanınca | 0,0 | **0,0** | 0,0 | 0,0 |

*(br/dk — botun yürüdüğü yol. B1 tabanı da 0,0'dı: D-084 P2'nin bulup açık bıraktığı kusur.)*

Yolda **üç gerçek tuzak ölçüldü** (üçü de personelin dünyasında görünmez, çünkü orada yasaldılar):

1. **Bot işe katının İÇİNDE başlıyor.** Başlangıç `place.dish + [0,0,1]`; leğenin yarı-boyu
   `dishHalf` 1,0 ve `playerRadius` 0,47 → oyuncu için 1,47'ye kadar KATI. Ölçüldü:
   `hitsSolid(başlangıç, activeSolids, playerRadius) === true`. İlk yasal nokta `+1,5`.
2. **Botun `×0,7` rota payı oyuncunun dünyasında olanaksız.** Yıkama 1,12 br → oyuncu dünyasında
   **yol YOK** (personelde 6 ara nokta); bardak toplama 0,98 br → **her iki dünyada da yol yok**
   (yani bot tabanda da düz-çizgi yedeğiyle yürüyormuş).
3. **Tetik yarıçapı ızgara yuvarlamasına yetmiyor.** `collectRadius` 1,40 ile masa 1 ve masa 3'ün
   merkezine oyuncu dünyasında yol YOK, masa 2 ve 4'e var. `+ NAV_CELL` (1,70) dördünü de açıyor —
   `REACH_TABLE`'ın belgelenmiş `+ NAV_CELL + 0,05` düzeltmesinin aynısı.

Üç düzeltme de uygulandı (yarıçap merdiveni + yasal başlangıç) ve **B2 yine 0,0 kaldı** — kalan
sebep bulunamadı. Araç ölçülmüş hâline **geri alındı**: C4 raporunun oyuncu-kipi sayıları
yeniden üretilebilir kalsın. Botun göçü kendi turunu ister (kendi ölçümü, kendi raporu).

## 3. Ölçümün söylemedikleri

- **Oyunun kendisinde bugün oyuncu rotası yok.** Oyuncu joystick/WASD ile sürülüyor; `findNavPath`'i
  oyuncu adına çağıran tek yer sim botu (`olcum-bardak.ts`). `tools/simulate.ts` ve
  `olcum-kuyruk.ts` personel yolu ölçüyor — onların personel ızgarasını kullanması **doğru**.
  Yani k5'in %74'ü bugün sim botunu, yarın yol gösterme/oto-yürüme gibi her oyuncu-rotası
  tüketicisini vuruyor.
- **Çözünürlük 0,3 br** (nav hücresi). Bundan ince geçitler ölçülmedi; hücre merkezine göre
  hüküm veriliyor.
- **Hareket modeli ızgara değil.** Oyuncu sürekli eksen-kayması ile hareket ediyor; ızgara
  bileşenleri bir yaklaşıklık. k3'ün "cep yok" hükmü bu yaklaşıklık altında geçerlidir.

## 4. Karar — D-091

**Uygulanan kol: `getPlayerNavGrid` (oyuncunun dünyasına kendi ızgarası).**
`src/game/layout.ts` · `activeSolids` + `playerRadius` + `clampToOpenAreas`, `getNavGrid` ile
aynı hücre ızgarası ve aynı tek-yuvalı önbellek deseni.

**Neden bu kol:** Bulgu 4 — oyuncunun kendi dünyasında her hedefe yol var ve yalnız ×1,069 daha
uzun. Yani sorun yerleşimin darlığı değil, eksik bir ızgara; bedeli yolun %5-14 uzaması,
karşılığı rotaların %74'ünün geçerli hâle gelmesi.

**Elenen kollar:**
- **Dünyaları birleştirmek** (personel de sandalyeye çarpsın / aynı yarıçap): personel masaya
  ERİŞMEK zorunda; `REACH_TABLE` ve yerleşim testleri `actorRadius`'a çivili, 0,47'ye şişirmek
  servis koridorlarını kapatır. Bulgu 4 ayrıca gereksiz kılıyor.
- **Hiçbir şey yapmamak:** Bulgu 2 (içerik kilitli değil) bunu savunulabilir kılıyordu, ama
  Bulgu 3 rotaların %74'ünün geçersiz olduğunu söylüyor ve bu her oyuncu-rotası tüketicisini
  vuruyor.

**Bekçi:** `tests/oyuncu-dunyasi.test.ts` — 8 test, **8 mutasyonla** doğrulandı, sekizi de
yakalandı: sandalyeleri düşürmek · yarıçapı `actorRadius` yapmak · alan kelepçesini silmek ·
kelepçeyi ters çevirmek · önbellek anahtarından `tables` düşürmek · `areasOpen` düşürmek ·
doğrudan personel ızgarasını döndürmek · hücre boyunu büyütmek.

Bekçi ızgarayı yeniden KURMAZ, `getPlayerNavGrid`'i çağırır (D-090'ın dersi). Ölçüm aracı da
öyle: `oyuncuIzgarasi()` artık yürürlükteki fonksiyonu döndürüyor ve tam koşu sayıları
birebir aynı çıkıyor — yani bu raporun sayıları yayınlanan fonksiyonu anlatıyor.

**Denge sayısı DEĞİŞMEDİ** (`economy.config.ts` · `tick.ts` · `rules.ts` 0 satır).

**Kabul edilen eksik:** oyunun kendisinde bugün bu ızgarayı çağıran bir tüketici yok (oyuncu
joystick ile sürülüyor). Tek doğal tüketici sim botuydu ve göçü Bulgu 7'de ölçülerek geri
alındı. Yani D-091 bugün **bekçili bir doğruluk**, henüz görünen bir davranış değil.
