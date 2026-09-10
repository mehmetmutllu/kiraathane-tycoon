# S6/② — Giriş cephesi cam (vitrin) olacak mı? (ÖLÇÜM RAPORU)

Ham çıktı: `docs/olcum-cephe-cami.txt` · araç: `tools/olcum-cephe-cami.ts`
(`OLCUM=tam npx tsx tools/olcum-cephe-cami.ts`) · görsel: `docs/gorsel/ss/s6b-*.png`
(`tools/shot-cephe-s6b.mjs`)
Tarih: 2026-09-10 · karakter boyu **1,75** · dünya birimi = **metre** · `WALL_H` **3,20**

> Bu rapor **ölçüm commit'iyle** yazıldı; **§Karar bölümü bilerek BOŞ.** Karar paketi kullanıcıya
> sunulur, seçilen kol ikinci commit'te uygulanır (D-084 varyant kapısı).

---

## Soru

**D-037 (2026-09-05)** *"Kat 1'in sokağa bakan yüzü düz duvar değil **vitrin**"* diye karara
bağlandı ve dizilimi de yazdı: kaide 0…0,40 · **cam 0,40…2,65** · lento · alınlık 2,65…3,20.
**Karar yazıldı, oyuna hiç geçmedi.** Bugün ön duvar (z 17,50) iç duvarlarla birebir aynı
badana: gövde + lambri + çıta; cam yalnız **sağ** duvarda ("cam kenarı", `config/decor.ts`).

S6 dış cepheyi ölçmüştü ama pencere kolu (§E) **sağ duvar** içindi. Bu tur, vitrin **kapı
bloğuna** (söve · lento · alınlık) ve **`wallThemeByArea`ya** dokunduğu için S7'de kullanıcı
kararıyla ayrıldı.

## Yöntem

Her sayı **koddan** okunuyor: duvar parçaları `wallLook.WALL_RUNS`, kapı `wallPanel.DOOR`,
masa yerleri `layout.TABLE_SPOTS`, giriş `layout.entranceAt`, kamera `config/camera`.
Modellerin ölçüsü kendi `.gltf`'lerinden (sınır kutusu · atlas gözü · ışın testi).

Üç yöntem katmanı:

- **§V görünürlük** — S6'nın kamera konisi, birebir.
- **§Ö2 örtme** — kameradan noktaya giden ışın ön duvarı kesiyor mu (ışın–kutu, slab). S7'de
  WC odası için kurulmuştu, burada cepheye uygulanıyor.
- **görsel tur** — `tools/shot-cephe-s6b.mjs`, altı kadraj. S7'nin dersi: sayı ile ekran
  birbirinin yerine geçmiyor. **Bu turda ders ikinci kez ve TERS yönde çalıştı** (aşağıda §G).

Koşu: **tam** (`OLCUM=tam`), damgalar temiz. Tarama ızgarası 1 × 0,5 br.

**Bu turun kendi yöntem hataları (ikisi de araç içinde düzeltildi, izi burada duruyor):**

1. **Uydurma koordinat.** İlk taslakta hedefler z 15,0 / 12,0 / 8,0 diye elle yazılmıştı.
   Ön sıra masaların gerçek z'si **11,70**, giriş **16,60** — yani cepheyle ön sıra masalar
   arasında **5,80 br'lik bir giriş koridoru** var ve uydurma sayılar o koridoru masa sanıyordu.
   Koddan okunmayan sayı ölçüm değildir.
2. **Yanlış payda.** Kazanç önce tüm katın konumlarına bölünüyordu ve %0,3 çıkıyordu; oysa ön
   duvar ancak kamera **dışarıdayken** (konumların %29'u) araya girebilir. Payda düzeltildi
   (§Ö2 "YAKIN" sütunları). *Bu, S6 dersinin tersi: orada ölçüm bir işi kurtarmıştı, burada
   yanlış payda bir işi haksız yere eleyecekti.*
3. **Ekran ekseninin işareti.** Ekran payı ilk koşuda duvarın **tabanını tepesinin üstünde**
   gösterdi (taban +0,50, tepe −0,03). Sebep: `u = ru × fu` kamera aşağı baktığı için aşağıyı
   gösteriyor. `kadrajda()` yalnız mutlak değere baktığından bu hatayı **dört turdur**
   göremiyordu; ekran payı görünce çıktı.

---

## §Bulgular

### Ö — Cephenin bugünkü ölçüsü

| ölçü | değer |
|---|---|
| cephe hattı z | **17,50** (duvarın orta hattı) |
| ön duvar parçası | **2 parça**, her biri **15,30 br** (x −17,50…−2,20 ve 2,20…17,50) |
| toplam cephe hattı | **30,60 br** (kapı boşluğu 4,40 br hariç) |
| kapı | boşluk 4,40 · boy **2,65** · söve dış kenarı ∓2,40 · lento/kordon ∓2,50 |
| bugünkü dizilim | lambri 0…0,90 · çıta 0,94 · badana gövde 0,90…3,20 — **cam yok** |
| D-037'nin istediği | kaide 0…0,40 · **cam 0,40…2,65** · alınlık 2,65…3,20 |
| aday cam yüzeyi | **68,85 m²** (30,60 × 2,25) |

### V — Görünürlük: cephe **yalnız dışarıdan** görülüyor

| şerit (y) | taban | uzaklaş | portre |
|---|---|---|---|
| kaide 0,20 | %8 | %15 | %14 |
| lambri çıtası 0,94 | %8 | %15 | %14 |
| **cam bandı 1,20 / 1,80 / 2,40** | **%8 / %7 / %8** | **%15 / %15 / %14** | **%14 / %13 / %14** |
| alınlık 2,90 | %7 | %15 | %13 |
| hattın ucu (x ∓16) | %4 | %8 | %7 |

**Kamera konumların %29'unda binanın dışında** (uzaklaş kipinde %41) — cephe ancak orada
kameranın önünde.

> **Cephe kadraja girdiği 125 konumun 125'inde kamera DIŞARIDA, 0'ında içeride.** Kamera −z'ye
> bakar, cephe +z'dedir: kamera binanın içindeyken cephe **kameranın arkasında** kalır. Yani
> **camın İÇ yüzü — kasa, lambri, tema — ekrana hiç girmiyor.** Vitrin bir dış cephe kalemi;
> iç mekân kalemi değil. (Görsel sağlaması: `s6b-cephe-ic.png`, cephe kadrajda yok.)

### Ö2 — Örtme kazancı: **0,0 puan.** Camın ardında görülecek bir şey yok

Cam bir süs değil bir deliktir; o yüzden asıl soru "güzel mi" değil, *"ön duvar salonun ne
kadarını gizliyor ve vitrin ne kadarını geri veriyor?"*

| hedef (hepsi koddan) | kadraj | TÜM KAT C0→C1 | YAKIN C0→C1 | kazanç |
|---|---|---|---|---|
| ön sıra masa üstü (z 11,70) | %17 | %100→%100 | %100→%100 | **0** |
| ön sıra müşteri başı / yerdeki para | %17 | %100→%100 | %100→%100 | **0** |
| ikinci sıra masa / para (z 5,30) | %32 | %100→%100 | %100→%100 | **0** |
| giriş koridoru — yerdeki para (z 14,15) | %16 | %68→%68 | %58→%58 | **0** |
| giriş (entranceAt, z 16,60) | %9 | %54→%54 | %60→%60 | **0** |
| oyuncunun kendi başı (kapı önü) | %12 | %90→%90 | %82→%82 | **0** |

**ORTALAMA KAZANÇ: 0,0 puan — hem tüm katta hem YAKIN paydasında.**

Sebep geometrik ve ölçüldü: kamera 45°'den bakıyor, ışın cepheyi **duvarın tepesinin üstünden**
geçiyor.

| hedef | ışının cepheyi kestiği y | cam bandı 0,40…2,65 içinde mi? |
|---|---|---|
| ön sıra masa üstü (z 11,70) | **4,13** | hayır — camın üstünden (duvarın bile üstünden) |
| giriş koridoru zemini (z 14,15) | **2,69** | hayır — camın 4 cm üstünden |
| cephenin 1 br arkası — zemin (z 16,50) | 1,09 | **evet** |
| cephenin 1 br arkası — bel hizası | 1,88 | **evet** |

Yani vitrin ancak **cephenin 1 br arkasındaki** şeyi açardı — ve orada oyunun hiçbir öğesi yok
(ön sıra masalar 5,80 br içeride). Örtme profili de bunu söylüyor: oyuncu pz 16,50'deyken
zemin şeridinde %43→%79'luk bir açılma var, ama o şerit **boş giriş koridoru**.

### B — Bant sınırı: kaide hiç fark etmiyor, cam üstü ancak alınlığı yiyerek kazandırıyor

Cephenin arkasındaki dört hedefin YAKIN görünürlük ortalaması:

| kaide \ cam üstü | 2,40 | 2,65 | 2,80 | 3,00 | 3,20 |
|---|---|---|---|---|---|
| C0 katı duvar (taban) | **%79,6** | | | | |
| 0,00 · 0,40 · 0,60 · 0,90 | %79,6 | %79,6 | %81,2 | %82,7 | **%87,0** |

- **Dört kaide de aynı sayıyı veriyor — yayılım 0,0 puan.** Kaidenin/lambrinin yüksekliği
  örtmeyi hiç etkilemiyor. **C4a ↔ C4b bir ölçüm sorusu değil, görsel tercih.**
- Cam üstü: 2,65 → **+0,0** · 2,80 → **+1,5** · 3,00 → **+3,1** · 3,20 → **+7,3 puan**.
  Ama 3,20 demek **alınlığın da olmaması** demek — yani cephenin tabelasını yok etmek.

### P — Camın ardında ne görünür? **Şerit boş değil: bir giriş holü var**

§Ö2 "cam örtme kazandırmıyor" dedi. Ama vitrin yine de bir delik açıyor ve o delikten bir şey
görünecek. Cam bandının alt (0,40) ve üst (2,65) kenarından geçen ışınlar salonun zeminini
nerede vuruyor?

| oyuncu pz | kamera cz | cam ALT → zemin z | cam ÜST → zemin z | şerit derinliği |
|---|---|---|---|---|
| 12,00 | 20,50 | 17,39 | 16,19 | 1,20 |
| 13,50 | 22,00 | 17,33 | 15,54 | 1,79 |
| 15,00 | 23,50 | 17,28 | 14,88 | 2,39 |
| 16,50 | 25,00 | 17,22 | 14,23 | **2,99** |

**Ortalama şerit derinliği 2,09 br · şeridin iç sınırı ≈ z 14,88.** Ön sıra masalar z 11,70 —
şerit masalara **3,18 br uzak**. Yani camdan bakınca masalar değil, **giriş bölgesi** görünür.

> **Ve o bölge boş değil.** `config/decor.ts` üstünden sayıldı: şeride **10 dekor öğesi**
> düşüyor — paspas · askılık · şemsiyelik · gazetelik · çöp kovası · iki ayaklı lamba · saksılar
> · askı rayı. Bu **bir giriş holü programı** ve bugün **kimse görmüyor**, çünkü cephe kapatıyor.
> `entranceAt` (z 16,60) da şeridin içinde: müşteriler tam oradan giriyor.

Bu §Ö2 ile çelişmiyor: §Ö2'nin hedefleri masa · para · müşteriydi (oynanış), bu şerit ise dekor.
**Cam bir oynanış kazancı değil, bir vitrin kazancı sağlıyor** — adı üstünde.

### C — Vitrin modülasyonu

Kullanılabilir yarı-hat **14,50 br** (söve dış kenarı ∓2,40'ten duvarın ucuna, 0,60 köşe payı);
iki yarı toplam **29,00 br**.

| göz/yarı | göz eni | ayak (0,36) | artık | göz eni / insan boyu |
|---|---|---|---|---|
| 2 | 7,07 | 1 | 0,00 | 4,04 × |
| 3 | 4,59 | 2 | 0,00 | 2,62 × |
| **4** | **3,35** | 3 | 0,00 | **1,92 ×** |
| 5 | 2,61 | 4 | 0,00 | 1,49 × |
| 6 | 2,12 | 5 | 0,00 | 1,21 × |
| 7 | 1,76 | 6 | 0,00 | 1,01 × |

- Hat **hiçbir göz sayısında artık vermiyor** (artık 0,00) — bölme serbest, D-100'ün duvarda
  çuvalladığı yerin tersi.
- **C3 "kısmi" diye bir kol yok:** kapının iki yanında birer göz, C1 ile **aynı cam yüzeyini**
  verir (65,25 m²); tek fark ayakların olup olmaması. C3 = "ayaksız C1".

### M — KayKit duvar modülü cepheye olur mu? (C2)

Mimari ölçek `KAY_S = WALL_H / 4 = 0,800` (S6 ile aynı gerekçe).

| modül | ham (en × boy × kal) | üçgen | dünya en × boy | deliği (ışınla) |
|---|---|---|---|---|
| `wall` | 4,00 × 4,00 × 0,50 | 76 | 3,20 × 3,20 | — |
| `wall_window_open` | 4,00 × 4,00 × 0,50 | 192 | 3,20 × 3,20 | **1,28 × 1,28** |
| `wall_window_closed` | 4,00 × 4,00 × 0,50 | 196 | 3,20 × 3,20 | **DELİK YOK** |
| `wall_orderwindow` | 4,00 × 4,00 × 0,90 | 206 | 3,20 × 3,20 | **2,08 × 1,28** |
| `wall_orderwindow_decorated` | 4,00 × 4,00 × 0,90 | 650 | 3,20 × 3,20 | 2,08 × 1,28 |
| `wall_doorway` | 4,00 × 4,00 × 0,50 | 162 | 3,20 × 3,20 | 1,28 × 2,24 |
| `wall_decorated` | 4,01 × 4,00 × 2,91 | 3880 | 3,20 × 3,20 | — |

- **En geniş deliği `wall_orderwindow` veriyor: 2,08 × 1,28.** Cam bandının boyu 2,25 — modülün
  deliği bandın **%57'si**. Yani modül konsa bile oyunun camı o delik olmaz.
- **Modül sayısı tutmuyor:** cephe hattı 30,60 ÷ 3,20 = **9,56 modül**, artık **1,80 br**.
  (D-100'ün duvarda çuvalladığı yerin ta kendisi.)
- **Atlas:** üç modül de baskın gözü **[1,2] #21a489 doy 0,80** — yani **turkuaz/yeşil** bir
  duvar. Oyunun cephesi krem (`WALL_THEMES`). Modül gelirse cephe paketin rengine döner.
- `wall_orderwindow`'un oluğu dünyada y 1,00, maketin çıtası 0,94 → sapma 0,06 (bu tek başına
  sorun değil); ama `wall`/`wall_decorated`'in oluğu **3,16**, sapma **2,22**.

### Ş — Şeffaflık bedeli

Bugün ön duvarın iki parçası `WallPanels`ın **tek InstancedMesh**'ine giriyor (2 × 3 = 6 kutu,
ek çizim çağrısı yok).

| kol | duvar kutusu | cam mesh | kasa mesh | ek çizim çağrısı | üçgen |
|---|---|---|---|---|---|
| C0 bugünkü | 6 | 0 | 0 | **0** | 0 |
| C1 tam hat — 4 göz/yarı | 30 | 8 | 32 | **40** | 480 |
| C1 tam hat — 3 göz/yarı | 24 | 6 | 24 | 30 | 360 |
| C3 ayaksız — 1 göz/yarı | 12 | 2 | 8 | 10 | 120 |

> **Sağ duvarın penceresi camın ARKASINA opak bir "dışarısı gündüz" paneli koyuyor
> (`Decor.Pencere`). Cephede o panel olamaz** — cephede camın arkası salonun kendisi. Ama §Ö2
> zaten camın ardında görülecek bir şey olmadığını ölçtü; panel konursa cam bir delik bile
> olmaz, kapalı bir renk şeridi olur ve şeffaflığın çizim bedeli karşılıksız ödenir.

### K — Kapı bloğu hizası: vitrin kapıya **değmiyor**

| parça | y0 | y1 | en | x |
|---|---|---|---|---|
| söve | 0 | 2,65 | 0,40 | ∓2,20 (dış kenar ∓2,40) |
| lento | 2,65 | 2,81 | 5,00 | ∓2,50 |
| alınlık | 2,65 | 3,20 | 4,80 | ∓2,40 |
| **vitrin camı** | **0,40** | **2,65** | 14,50 | **∓2,40 … ∓16,90** |

- **Cam üstü ↔ kapı üstü: 2,65 ↔ 2,65, sapma 0,000 ✓** (D-037'nin kendi kuralı tutuyor).
- Vitrin alınlığı ↔ kapı alınlığı ikisi de 2,65…3,20 → **cephe tepesi tek şerit olur ✓**.
- Vitrin ∓2,40'ten başlıyor, söve dış kenarı ∓2,40 → **çakışma yok ✓**.
- **Lambri (C4):** bugün cephede lambri 0…0,90 + çıta 0,94; vitrin kaidesi 0,40. İkisi bir
  arada duramaz — **C4a** lambri cepheden kalkar (cephe iç duvarlardan ayrışır), **C4b** kaide
  0,90'a çıkar, lambri korunur, cam bandı 2,25 → **1,75 br**'ye iner.

### T — Tema kolunun bedeli

| kol | temalı yüzey | cephe yüzeyinin | kaybolan |
|---|---|---|---|
| C0 bugünkü | 97,92 m² | %100 | %0 |
| C1 vitrin (kaide 0,40) | 29,07 m² | %30 | **%70** |
| C4b vitrin (kaide 0,90) | 44,37 m² | %45 | %55 |

Bedeldir, engel değil: §V cephenin **iç yüzünün hiç görünmediğini** ölçtü, temanın asıl
gösterildiği yüzey iç duvarlar.

### G — Görsel tur: **ölçümün söylemediği şey** (bu turun en önemli bulgusu)

`docs/gorsel/ss/s6b-*.png` · altı kadraj · konsol temiz.

Sayı tek başına *"vitrin hiçbir şey kazandırmıyor (0,0 puan), yapmayın"* diyordu. Ekran
başka bir şey söylüyor:

**Cephe, kadraja girdiğinde ekranın DİKEY OLARAK %27'sini kaplıyor** — ve bu 27 puanlık bant
**tamamen boş**: krem bir levha, altında koyu bir lambri şeridi, üstünde hiçbir şey.

| oyuncu pz | kamera cz | taban ekran y | tepe ekran y | **dikey ekran payı** |
|---|---|---|---|---|
| 12,00 | 20,50 | −1,14 | −0,73 | %13 |
| 13,50 | 22,00 | −0,80 | −0,30 | %25 |
| 15,00 | 23,50 | −0,50 | +0,03 | **%27** |
| 16,00 · 16,50 | 24,50 · 25,00 | −0,33 · −0,26 | +0,20 · +0,28 | **%27** |

> **Kadraj yüzdesi (%7–15) ile ekran payı (%27) aynı şey değil.** Birincisi *"kaç konumda
> görünüyor"*, ikincisi *"göründüğünde ne kadar yer kaplıyor"*. `s6b-cephe-sol-kanat.png`
> kadrajın alt üçte birinin bu boş bantla dolduğunu gösteriyor; ölçüm önce bunu söylemiyordu,
> çünkü **sorulmamıştı**.

**Bu turun dersi, S7'nin dersinin tersten tekrarı.** S7'de ekran, sayının *"yap"* dediği bir
şeyin yanlış olduğunu gösterdi. Burada sayı *"yapma"* diyor (kazanç 0,0), ekran ise **cephenin
gerçek probleminin örtme değil BOŞLUK** olduğunu gösteriyor. İkisi çelişmiyor: vitrin bir
**görünürlük** aracı olarak değersiz, bir **kimlik** aracı olarak ekranın dörtte birini
ilgilendiriyor. Karar bu ayrım üstünden verilmeli.

---

## §Karar — **D-105** (kullanıcı, 2026-09-10)

| kol | karar | gerekçe |
|---|---|---|
| **ana çatal** | **C1 vitrin** | Cam oynanışa hiçbir şey katmıyor (örtme kazancı **0,0 puan**) — ama cephenin sorunu örtme değil **boşluk**: kadraja girdiğinde ekranın dikey **%27'si** boş bir levha ve tam ardında **zaten yapılmış ama görünmeyen** bir giriş holü duruyor (§P, 10 dekor öğesi). |
| **göz sayısı** | **4 göz/yarı — 3,35 br** | Göz eni insan boyunun **1,92 katı** (dükkân vitrini oranı). Hat artıksız bölünüyor. |
| **kaide** | **C4b — lambri korunur** | §B: dört kaide arasında yayılım **0,0 puan** → ölçüm ayırt etmiyor, görsel tercih. Lambri korununca cephe iç duvarlarla tek dil konuşuyor. |
| **C2 KayKit modülü** | **GİRMEDİ** | deliği cam bandının %57'si · hat 9,56 modül (1,80 br artık) · atlas turkuaz #21a489 → D-100'ün reddedilen düzenine dönüş. |

**Uygulama:** yeni `cepheLook.ts` (vitrinin ölçü katmanı) · `Scene.Vitrin` (iki InstancedMesh:
kasa + cam) · `wallPanel.SOVE_W` / `SOVE_DIS` / `RAIL_TOP` dışa açıldı · vitrin açıklıkları
`pencereBosluklari` ile **aynı** `wallPieces` çağrısına giriyor (ayrı kod yolu yok).

**Kararın uygulamada doğurduğu iki ayrıntı — ikisi de kararın İÇİNDEN çıktı, yeni tercih değil:**

1. **Kaide 0,90 değil 0,98.** "Lambri korunur" tam 0,90'a konsaydı kuşak kalır ama **üstündeki
   ÇITA hiç doğmazdı** (`wallBoxes` çıtayı 0,90…0,98 üretir; parçanın tepesi 0,90 olunca o
   katman boş pencereye düşer). Kararın karşılığı kuşak + çıtasıdır → sınır `RAIL_TOP`.
   Bedeli: cam bandı 2,25 → **1,67 br**.
2. **Göz SAYISI değil göz ENİ sabitlendi.** "4 göz" kararı 14,50 br'lik yarı-hattı görüyordu
   (2 alan açık). Sayı koda sabitlenseydi 1 alan açıkken hat 6,00 br olduğu için göz eni
   1,23'e düşer, cephenin ritmi alan açıldıkça değişirdi. Hedef en sabit → 14,50'de sayı yine
   tam **4** çıkıyor ((14,50 + 0,36) / (3,35 + 0,36) = 4,005).

**Çizim bedeli rapordan DÜŞTÜ:** §Ş 4 göz/yarı için **40 ek çizim çağrısı** saymıştı; kasa ve
cam instanslandığı için gerçek bedel **2**.

**Bekçi:** `tests/cephe-vitrin.test.ts` — **17 denetim**, **23 mutasyon**, kaçan **0**.
`tsc -b` temiz · vitest **907** · duman **42/42** · altı kadraj gözle doğrulandı.

**Kaçan mutasyonun öğrettiği (S6/②'nin kendi dersi):** ilk turda 23 mutasyondan **biri kaçtı** —
söve ve köşe paylarını **yer değiştiren** mutasyon 16 denetimin hepsinden geçiyordu. Sebep
aritmetik: 0,60 + 0,20 iki yönde de aynı toplamı verir, yani hat **uzunluğu** değişmez, gözler
yalnız 0,40 **kayar**. O kayma masum değil — binanın köşesinde payanda kalmaz, cam köşeye
dayanır. Bekçi "gözler hattın içinde mi" diye soruyordu, "**hangi uçta hangi pay var**" diye
sormuyordu. Denetim eklendi (17.), mutasyon yakalandı.

**§S SON DURUM (ham çıktının sonunda):** araç artık `cepheLook`u okuyor — uygulanan göz sayısı,
göz eni, kaide, cam üstü, ayak, cam yüzeyi ve söve mesafesi **kararla birebir** çıkıyor. Final
koşu bir tekrar değil, "ölçülen kol ↔ sevk edilen kod" bağının makine denetimi.

**Bu turdan DEVREDEN (ölçüldü, bilerek yapılmadı):** camın ardındaki giriş holü şeridi
(z 14,88…17,39) artık **görünüyor** ama içeriği vitrin için düzenlenmiş değil — öğeler duvar
diplerine dağılmış durumda. Vitrinin gerçekten "dolu" okunması için o şeridin kendi yerleşim
turu gerekiyor.
