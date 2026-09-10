# S6 — Kıraathanenin dışı KayKit'e geçer mi? (ÖLÇÜM RAPORU)

Ham çıktı: `docs/olcum-dis-cephe.txt` · araç: `tools/olcum-dis-cephe.ts` (`npx tsx tools/olcum-dis-cephe.ts`)
Tarih: 2026-09-10 · karakter boyu **1,75** · dünya birimi = **metre** · `WALL_H` **3,20**

> Bu rapor **ölçüm commit'iyle** yazıldı; **§Karar bölümü bilerek BOŞ.** Karar paketi kullanıcıya
> sunulur, seçilen kol ikinci commit'te uygulanır (D-084 varyant kapısı).

---

## Soru

İki soru bir turda:

1. **Dış dünya** (karşı binalar · yol · kaldırım mobilyası · pencere · tente) elle çizilen
   kutulardan KayKit'e geçebilir mi?
2. **Kullanıcı isteği 2026-09-10:** *"lavabodaki musluklar var ya, mutfakta oraya uygun
   sırıtmayacak musluklu bir şeyler var, onları koy — ama pakette gri renkli hali var, onu
   kullan."* WC'nin üç elle çizilen lavabosu paketin modeline geçsin mi?

## Yöntem

Araç her sayıyı modelin **kendi gltf'inden** okur: sınır kutusu (`model-olc.mjs`), atlas gözü
(`atlas-goz.mjs`), gözün ölçülen rengi (`atlas-renk.mjs`), delik/profil için **ışın testi**
(Möller-Trumbore — S4 dersi: düz yüzün ortasında vertex yoktur, vertex saymak yanlış sonuç verir).

**Bu turun kendi yöntem hatası (araç düzeltildi, iz burada duruyor):** §G'de "tezgâh üstü"
ölçütü önce *"en, tam enin yarısından büyük"* yazılmıştı ve çanağın üstündeki 1,10 enindeki
küçük parçaya yapıştı → tezgâh üstü **1,146** okundu, gerçeği **0,996**. G1 ve G3'ün ölçekleri
o yanlış ankrajdan türüyordu. Eşik %90'a çekildi; sağlaması paketin öbür tezgâhları
(`kitchencounter_straight_A` = 1,000) ve `kayGovde`'nin zaten varsaydığı 1,0 düzlemi.
Hatayı yakalayan şey, araca eklenen **en profili** oldu — tek eşiğe güvenilmedi.

---

## §Bulgular

### A — city-builder-bits paketinin çarpanı (S5'ten devreden soru)

Paketin karosu bir **oda** değil bir **sokak**: mutfağın 0,90'ı buraya uygulanamaz. Onbir model
kendi gerçek karşılığıyla kıyaslandı (her satırın gerekçesi ham çıktıda yazılı).

| model | eksen | ham | gerçek | ima edilen çarpan |
|---|---|---|---|---|
| bench | en | 0,400 | 1,50 m | **3,750** |
| streetlight | boy | 0,960 | 4,00 m | **4,167** |
| firehydrant | boy | 0,225 | 0,75 m | **3,339** |
| dumpster | en | 0,566 | 1,80 m | **3,181** |
| trafficlight_A | boy | 0,729 | 3,50 m | **4,798** |
| car_taxi / car_sedan | derinlik | 0,938 | 4,50 m | **4,797** |
| bush | boy | 0,381 | 1,00 m | **2,628** |
| building_A | boy | 1,650 | 6,00 m | **3,636** |
| building_H | boy | 3,050 | 11,00 m | **3,607** |
| road_straight | en | 2,000 | 7,00 m | **3,500** |

**Ortanca 3,636 · ortalama 3,836 · yayılım 2,628 … 4,798.**
Paketin 2,0'lık karosu ortancayla **7,27 br** eder — yani bir yol karosu ≈ 7 metre.

| kol | çarpan | en kötü sapma | not |
|---|---|---|---|
| **A1 tek global** | 3,636 | bush **+%38** · araç/trafik lambası **−%24** | paket kendi içinde tutarlı kalır |
| **A2 aile başı** | mobilya 3,750 · bina 3,636 · yol 3,500 · araç 4,797 · bitki 2,628 | dumpster **+%18** · trafik lambası **−%22** | *yöntem kusuru aşağıda* |
| **A3 kontrol 0,90** | 0,90 | **−%66 … −%81** | beklendiği gibi saçma — paket sokak ölçeğinde |

> **A2'nin yöntem kusuru, araç kendisi basıyor:** `yol` ailesinde 1, `bitki` ailesinde 1, `araç`
> ailesinde 2 model var ama ikisi **aynı ölçüde**. Bu ailelerde çarpan o modelden türediği için
> sapma zorunlu olarak %0 çıkar — **o satırlar bilgi taşımaz.** A2'nin gerçek kanıtı yalnız
> `mobilya` (5 model) ve `bina` (2 model) satırlarında.

### V — Görünürlük: **§B ve §C'den önce sorulması gereken soru**

Kamera oyuncunun **+z'sinde** durur (`pz + 8,50`) ve **−z'ye** bakar. Sokak da oyuncunun
+z'sinde. Yani "hangi model daha güzel" diye tartışmadan önce ölçülmesi gereken şey: **o model
ekrana giriyor mu?** Oyuncunun yürüyebildiği tüm kat tarandı; her şerit için o şeridin kadrajda
olduğu konum oranı (fov 50 → yarım düşey 25,0° · yarım yatay 16:9 → 39,7°):

| şerit | z | y | taban (8,50) | uzaklaş (11,48) | portre (11,05) |
|---|---|---|---|---|---|
| salonun ön duvarı | 17,50 | 1,60 | %8 | %15 | %12 |
| **kapı önü / tente** | 17,90 | 2,57 | **%7** | **%14** | **%12** |
| **kaldırım (bahçe masaları)** | 18,65 | 0,40 | **%5** | **%11** | **%11** |
| kaldırım dış kenarı | 19,90 | 0,10 | %3 | %9 | %6 |
| müşteri beliriş noktası | 20,50 | 0,90 | %3 | %6 | %6 |
| asfaltın ön kenarı | 20,00 | 0,10 | %3 | %8 | %6 |
| asfalt cadde (orta) | 23,00 | 0,10 | %0 | %2 | %0 |
| **karşı binalar (bugünkü kutular)** | 26,50 | 3,00 | **%0** | **%0** | **%0** |
| **karşı binalar — ön yüzü** | 25,50 | 4,00 | **%0** | **%0** | **%0** |
| **karşı binalar — tepesi** | 26,50 | 7,00 | **%0** | **%0** | **%0** |
| **KayKit binası (7,27 derin)** | 29,90 | 5,00 | **%0** | **%0** | **%0** |
| **KayKit binası tepesi (11,09)** | 29,90 | 11,09 | **%0** | **%0** | **%0** |

**Karşı binalar üç kamera kipinin hiçbirinde ekrana girmiyor.** Sebep aritmetik: oyuncunun z
tavanı 17,00 → kameranın z tavanı **25,50**; binalar 25,5'in ötesinde, yani her zaman
**kameranın arkasında.** Yükseklik de kurtarmıyor — kameranın üstüne çıkan nokta kadrajın
(ufkun altındaki 17°…67° kuşağı) dışında kalıyor.

> **Bu bulgu §B ve §C'yi anlamsız kılıyor.** Aşağıdaki üçgen ve döşeme sayıları doğru, ama
> hepsi **görünmeyen** bir şeridin sayıları. Ekrana giren tek şerit **z 17,5 … 20,5 arası
> kaldırım bandı**dır (%3–14).

### B — Karşı binalar *(ölçüldü; §V görünürlüğü %0 çıkardı)*

Bugün: **9 renkli kutu**, 3,00 en, adım 3,40, boy 4…7, toplam hat 30,20 br (asfalt eni 56 br).

| model | ham boy | A2-bina dünya (en × boy × der) | üçgen | insan katı |
|---|---|---|---|---|
| building_A | 1,650 | 7,27 × **6,00** × 7,27 | 828 | 3,43 |
| building_B | 1,650 | 7,27 × 6,00 × 7,27 | 1082 | 3,43 |
| building_C | 2,977 | 7,27 × 10,82 × 7,27 | 1020 | 6,19 |
| building_D | 2,970 | 7,27 × 10,80 × 7,35 | 1118 | 6,17 |
| building_E/F | 2,350 | 7,30 × 8,55 × 7,27 | 1356 / 1389 | 4,88 |
| building_G | 2,976 | 7,30 × 10,82 × 7,27 | 1711 | 6,18 |
| building_H | 3,050 | 7,30 × **11,09** × 7,27 | 1885 | 6,34 |

- Bina eni **7,27 br** → 56 br cepheye **7 bina** sığar (bugün 9 kutu var).
- **Üçgen bedeli: 8 bina = 10.389 üçgen ↔ bugünkü 9 kutu = 108 üçgen → ×96.**
- `_withoutBase` varyantı var (1,207 × 1,550 × 1,450, minY 0,100): base'li varyant zemine **kendi
  2×2 karosunu** basıyor; bizim sokağımızda zaten asfalt düzlemi var → çakışma riski.

### C — Yol karosu *(ölçüldü; §V görünürlüğü %0–2 çıkardı)*

Bugün: asfalt **56 × 6** düzlem @ z 23,00 · kaldırım **40 × 2,40** @ z 18,70.

Paketin bütün yol karoları **2,000 × 0,100 × 2,000 ham** → A2-yol ile **7,00 × 0,35 × 7,00**.

- 56 br cepheye **tam 8 karo** sığıyor, artık **0,00 br**, gerilme **%0**. (Bu, D-100'ün duvarda
  çuvalladığı yerin tersi: hat modüle **tam bölünüyor**.)
- **Ama derinlik tutmuyor:** karo 7,00 derin, asfalt bandı **6,00**. Karo döşenecekse yol bandı
  6 → 7 büyümek zorunda (ya da karo derinlikte gerilir).
- Üçgen: `road_straight` 58 · `road_corner` 152 · `road_junction` 170.
- **Karo kendi kaldırım payını taşıyor:** uv gözlerine bakıldığında asfalt şeridi yalnız **1,24 ham**
  (dünyada 4,51), kalan **0,38+0,38** ham karo zemini — yani tek bir yol karosu döşenirse oyunun
  kendi 2,40'lık gri kaldırımıyla **iki kaldırım yan yana** gelir. Orta çizgi dizisi **z ekseninde**
  uzanıyor (x −0,02…0,02 · z −0,90…0,90), yani karo yola dik gelmesi için π/2 döndürülmeli.

### D — Sokak mobilyası (kaldırım 2,40 br derin)

| model | A2 dünya (en × boy × der) | ayak izi | kaldırıma | üçgen |
|---|---|---|---|---|
| streetlight | 1,01 × **3,60** × 0,26 | 1,01 | sığar (1,39 pay) | 176 |
| bench | **1,50** × 0,38 × 0,56 | 1,50 | sığar (0,90 pay) | 44 |
| bush | 0,50 × 1,00 × 0,52 | 0,52 | sığar (1,88 pay) | 72 |
| **car_taxi** | 2,01 × 2,08 × **4,50** | 4,50 | **SIĞMAZ (2,10 taşar)** | 1256 |
| firehydrant | 0,51 × 0,84 × 0,49 | 0,51 | sığar (1,89 pay) | 180 |
| dumpster | 2,12 × 1,19 × 1,32 | 2,12 | sığar (0,28 pay) | 126 |
| trash_A / trash_B | 0,48 × 0,20 × 0,50 / 0,26 × 0,15 × 0,27 | 0,50 / 0,27 | sığar | 18 / 18 |
| trafficlight_A | 0,65 × 2,74 × 0,56 | 0,65 | sığar (1,75 pay) | 508 |
| box_A | 0,75 × 0,66 × 0,76 | 0,76 | sığar (1,64 pay) | 32 |

- **`car_taxi` kaldırıma sığmaz** — zaten sığmamalı: yeri **asfalt**, kaldırım değil.
- Kaldırımda bugün elle çizilen iki bahçe masası (kapı ∓2,30) ve iki saksı (kapı ∓1,70) var;
  yeni mobilya bunların dışına konmalı.
- `trash_A/B`, S5'te **çöp kovası değil yer çöpü** olduğu ölçülüp elenmişti (18 üçgen). Sokakta
  yer çöpü olarak kullanılabilir — orada doğru okunur.

### E — Pencere (kullanıcı: *"pencere duvardan ayrı duruyor"*)

`wall_window_open` ham **4,000 × 4,000 × 0,500**; deliği ışınla ölçüldü: **1,600 × 1,600 ham**
(y 1,250 … 2,850). Oyunun pencere bandı: denizlik **1,15** · baş **2,80** → boy **1,65**, en **3,20**.

| kol | ölçek | modül eni × boyu | deliği (en × boy) | duvarla boy farkı | kalınlık fazlası | **D-100 riski**: modülün oluğu |
|---|---|---|---|---|---|---|
| **E1** modül mimari ölçekte | 0,800 | 3,20 × 3,20 | **1,28 × 1,28** | 0,00 ✓ | +0,14 (her yüzden 0,07) | **1,60** ↔ lambri 0,94 → **sapma 0,66** |
| **E2** modül pencere bandına çekilir | 1,031 | 4,13 × 4,13 | 1,65 × 1,65 | **+0,93 ✗** | +0,26 | **2,06** → **sapma 1,12** |

- **E1'in deliği oyunun bandının yarısı:** 1,28 × 1,28 ↔ 3,20 × 1,65. Yani modül konsa bile
  oyunun penceresi o delik olmaz — pencere küçülür ve **duvar hattı 3,20'lik modüllere bölünür**,
  yani D-100'ün reddedilen düzenine geri dönülür.
- **E2 duvarı 4,13 yapıyor** — oyunun duvarı 3,20. Duvar boyu ölçü katmanında **dondurulmuş**
  (D-070/D-073).
- **E3 — çizimi duvara GÖMME (model yok).** Bugünkü çizimin duvar yüzünden taşması: doğrama
  yüzü **+0,055**, duvarın en kalın katmanı 0,26 → yüz 0,13'te. Yani pencere duvarın **yüzeyine
  yapışık bir levha**; niş yok. **Kullanıcının gördüğü "ayrı duruyor" tam olarak budur.**
  Gömme = duvar gövdesinden 1,65 × 3,20'lik parça kesilir + kasa eklenir; bedel `wallBoxes`'ın
  üç katmanını da etkiler.
- **E4 bugünkü (kontrol)** — 3 pencere × 8 mesh = 24 mesh; üç sinyal (derin denizlik + açık
  doğrama + duvar tepesinde lento kapağı).

### F — Tente: *"eğik tente ekranı kapatıyor"* gerekçesi **doğrulandı**

Kamera: konum `(px, 8,50, pz + 8,50)`, bakış `(px, 0,80, pz)`. Maket v13 tentesi
**6,40 × 0,18 × 1,90 @ (kapı, 2,57, 17,90), x-rot 0,18**. Bugünkü tabela **3,40 × 0,34 × 0,06 @ y 1,42**.

| ölçüt | maket tentesi | bugünkü tabela |
|---|---|---|
| oyuncu kapıya yürürken kamera ışınını kapatma | **2/8 konum** (z 15,20 ve 16,40 — yani **kapı eşiğinde**) | 0/8 |
| kapı eşiğini kameradan gizleme | **17/22 konum = %77** | **0/22 = %0** |

- Tentenin arka kenarı **y 2,74**, ön kenarı **2,40**; kapı lentosu **2,65** → tente **lentonun
  ÜSTÜNDEN** çıkıyor, oysa maketin kendi notu *"lentonun ALTINDAN çıkar, alınlıktaki tabela
  kapanmasın"* diyor. Yani maketin sayıları oyunun kapısına birebir taşınırsa **maketin kendi
  kuralı da bozuluyor.**
- Altından geçen 1,75'lik biri **0,65 br** boşlukla geçiyor (geçilebilir).
- **Sonuç: eski gerekçe bir his değildi, sayı onu doğruluyor.**

**F3 — "tente kalsın ama kadrajı kapatmasın" kolu ARANDI ve BULUNAMADI.** *(Seçenek koda değil
varyanta yazılır: tenteyi alçaltmak/inceltmek bir seçenekti, o yüzden ölçüldü.)* Yükseklik ×
derinlik düzlemi tarandı (z sabit 17,90); hücrelerde **kapı eşiğinin görünmediği konum yüzdesi**:

| y \ derinlik | 0,90 | 1,30 | 1,90 | geçiş payı (ön kenar − 1,75) |
|---|---|---|---|---|
| 1,90 | **%32** | %50 | %68 | **−0,02 → kafaya çarpar** |
| 2,15 | %45 | %55 | %73 | 0,23 |
| 2,40 | %50 | %64 | **%77** | 0,48 |
| 2,57 *(maket)* | %55 | %64 | **%77** | 0,65 |
| 2,80 | %50 | %68 | %82 | 0,88 |

**Hiçbir hücre sıfıra inmiyor.** En iyi hücre (%32) tek geçilebilir olmayan satırda — 1,75'lik
biri kafasını çarpıyor. Geçilebilir en iyi hücre **%45**, yani bugünkü tabelanın (%0) hâlâ dört
katı. Sebep geometrik: kamera 45° yukarıdan +z'ye bakıyor ve tente **giriş yolunun tam üstünde
yatay bir levha** — o levha kadraja girmeden kapının üstünde duramıyor. **F3 ölçümle elendi.**

**F4 — kimliği DİKEY yüzeyle büyütmek.** Bugünkü tabela %0 kapatıyor; ne kadar büyüyebilir?

| tabela boyu | üst kenar | kapanma |
|---|---|---|
| 0,34 *(bugünkü)* | 1,59 | **%0** |
| 0,60 | 1,85 | **%0** |
| 0,90 | 2,15 | %14 |
| 1,20 | 2,45 | %32 |
| 1,60 | 2,85 | %45 |

> **İlk okuma yanlıştı ve tablo düzeltti.** "Dikey yüzey kadrajı hiç kesmez" yazılacaktı; tarama
> 0,90'dan itibaren %14 gösteriyor. **Belirleyici olan yüzeyin yönü değil ÜST KENARIN yüksekliği.**
> Yatay levha pahalı, çünkü üst kenarı zorunlu olarak yükseğe taşıyor.

**%0 kapanmanın sınırı: üst kenar 1,97.** Bugünkü tabelanın üstü 1,59 → kimlik **0,38 br daha
büyüyebilir** (boy 0,34 → **0,72**, iki katından fazla) ve kadraj hâlâ tertemiz kalır.

### G — Lavabo musluğu (kullanıcı isteği)

**Önce renk — "gri renkli hali" adından değil atlas gözünden ölçüldü:**

| model | atlas gözleri (ölçülen renk · doygunluk × köşe) | gri mi? |
|---|---|---|
| **`kitchentable_sink`** | **[0,3] #828c91 · doy 0,11 × 879 — TEK GÖZ** | **evet, tamamı gri** |
| `kitchentable_sink_large` | [0,3] #828c91 · doy 0,11 × 1043 — tek göz | evet, tamamı gri |
| `kitchencounter_sink` | [0,3] gri × 552 · **[3,6] #be5e2f doy 0,75 × 124** · [3,5] beyaz × 91 | hayır — turuncu ahşap gövdeli |
| `kitchencounter_sink_backsplash` | aynı karışım | hayır |

**Kullanıcının tarifi ölçümle birebir tuttu: gri olan `kitchentable_sink`.** (Mutfakta bugün
kullanılan `kitchencounter_sink` ahşap gövdeli olan.)

**Sonra musluk — kullanıcı "musluk" istedi, o yüzden ölçülen şey tezgâhın boyu değil musluğun boyu:**

| model | toplam ham | tezgâh üstü | **musluk boyu** | musluk eni |
|---|---|---|---|---|
| `kitchentable_sink` | 1,805 | 0,996 | **0,805** | 0,100 |
| `kitchentable_sink_large` | 1,802 | 0,980 | 0,822 | 0,080 |
| `kitchencounter_sink` | 1,802 | 0,980 | 0,822 | 0,100 |
| `kitchencounter_sink_backsplash` | 1,802 | 1,200 | 0,602 | 0,100 |

Musluk gerçek bir kol: tezgâhın **%81'i kadar** yükseliyor. En profili (0,02 adım) tezgâhı
y ≤ 1,00'de (en 1,98), çanak/kenarı 1,02–1,22'de, musluk kolunu 1,24'ten yukarıda (en 0,10)
gösteriyor.

**Ama model bir MUTFAK MODÜLÜ, WC lavabosu değil:** paketin 2,0'lık karosu 0,90'da **1,80 br
eninde bir tezgâh** eder. Bugünkü `MaketSink` 1,36 × 0,66; gerçek WC lavabosu 0,60 × 0,50.
Model, konulacağı yerin **1,3 katı eninde ve 2,7 katı derinliğinde.** Soru "geçsin mi" değil,
**"nasıl sığdırılsın"**:

| kol | ölçek | dünya (en × boy × der) | tezgâh üstü | **çarpıtma** | 1,70 aralıkta | odaya taşma |
|---|---|---|---|---|---|---|
| **G1** `kayGovde` ile bugünkü kutuya çekilir | [0,680 · 0,863 · **0,330**] | 1,36 × 1,56 × **0,66** | 0,86 = boyun **%49** ✓ | **2,62 — gözle okunur** | 0,34 boşluk ✓ | 0,66 (bugünküyle aynı) ✓ |
| **G2** tekdüze, **enden** türetilir | [0,680 × 3] | 1,36 × 1,23 × 1,36 | 0,68 = boyun **%39** ✗ | 1,00 (yok) ✓ | 0,34 boşluk ✓ | 1,36 (2,1 katı) |
| **G3** tekdüze, **tezgâh üstünden** türetilir | [0,863 × 3] | 1,73 × 1,56 × 1,73 | 0,86 = boyun **%49** ✓ | 1,00 (yok) ✓ | **0,03 çakışma** → aralık 1,93 olmalı | 1,73 (2,6 katı) |
| **G4** bugünkü `MaketSink` (kontrol) | — | 1,36 × 2,10 × 0,66 | 0,86 = **%49** ✓ | — | ✓ | 0,66 |

- Doğu duvarı **7,51 br** — üç kolda da 3 lavabo (hatta 4) sığıyor; WC'nin yürüme alanı hiçbir
  kolda daralmıyor (en kötü 11,50 br kalıyor, oyuncu çapı 0,94).
- **G4'ün adaylarda olmayan bir şeyi var: AYNA.** Elle çizim aynayı taşıyor, KayKit modeli taşımıyor.
- **G5 "yalnız musluğu al" ölçüldü ve elendi:** model **1 düğüm / 1 primitive** — musluk ayrı bir
  alt-nesne değil. Ayırmak mesh cerrahisi (y > 1,24 köşelerini kesip yeni .gltf yazmak) ister,
  çevrimdışı iş, bu turun dışı.

---

## §Karar — **D-102** (kullanıcı, 2026-09-10)

| kol | karar | gerekçe |
|---|---|---|
| **A ölçek** | **A1 tek global 3,636** | aile-başı kolun üç ailesinde tek model var → sapması tautolojik %0, bilgi taşımıyor. Tek çarpan paketin kendi iç oranlarını korur. |
| **B binalar** | **GİRMEDİ**, bugünkü kutular da **SİLİNDİ** | §V: üç kamera kipinde de %0 görünürlük. 10.389 üçgen, sıfır karşılık. |
| **C yol karosu** | **GİRMEDİ** | karo kendi kaldırım payını taşıyor (asfalt 1,24/2,00) → iki kaldırım yan yana; ayrıca 7,00 derin ↔ bant 6,00. |
| **D sokak mobilyası** | **GİRDİ** — lamba ×3 · bank ×2 · çalı ×4 · musluk · yer çöpü ×2 · taksi | görünen tek şerit burası (%3–14). |
| **E pencere** | **E3 — duvara GÖMÜLDÜ** | E1 deliği bandın yarısı + D-100'ün reddedilen düzeni; E2 duvarı 3,20 → 4,13 yapıyor. |
| **F tente** | **F1 — maket tentesi, bedeli kabul** | kullanıcı sayıyı görerek seçti. F3 ölçümle elendi (hiçbir hücre %0'a inmiyor). |
| **G lavabo** | **G1 — `kitchentable_sink`, bugünkü kutuya çekildi** | gri olan bu (atlas gözü). Çarpıtma 2,62 kabul; yerleşim/nav/insan oranı korunuyor. |

**Uygulama:** yeni `streetLook.ts` (sokağın ölçü katmanı) · `wcLook.ts` (lavabo) ·
`wallLook.wallPieces` + `wallBoxes.y0` (duvarda gerçek açıklık) · `Scene.Street` yeniden yazıldı ·
`Decor.Pencere` nişe göre yeniden kuruldu (lento kapağı hack'i kalktı) · `MERDIVEN_DERINLIK`
ölçü katmanına taşındı.

**Bekçi:** `tests/street-look.test.ts` (19) + `tests/pencere-nis.test.ts` (19), **16 mutasyon**.
vitest **856** · duman **42/42** · `tsc -b` temiz · beş kadraj gözle doğrulandı
(`docs/gorsel/ss/s6-*.png`, `tools/shot-dis-cephe-s6.mjs`).

**Görsel doğrulamanın söylediği fazladan şey:** tentenin ekran görüntüsü sayıdan daha sert —
kapı önü kadrajında kapı **tamamen** kayboluyor (`s6-sokak.png`). Karar kullanıcının; dönülmek
istenirse hazır kol **F4**: dikey tabela 0,34 → **0,72** (üst kenar 1,97 = %0 kapanmanın sınırı).
