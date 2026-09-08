# C5 — `simulate.ts`'i gerçeğe yaklaştırma raporu

**Soru:** Modelin gerçekten ne kadar uzağında olduğunu ve gerçeğe yaklaştırılınca **tempo
ölçütlerinin hükmünün değişip değişmediğini** ölçmek.

**Araçlar:** `tools/simulate.ts` (`SIMKOL=karsilastir`) · ham çıktı `docs/olcum-sim-kollar.txt`.
Gerçek taraf `tools/olcum-kuyruk.ts`in **tam koşusu** (`docs/olcum-kuyruk.txt`, oyunun kendi
`tick()`'i, D-083 SONRASI, 2026-09-08) — eski çıktı D-083 öncesinden kalmıştı, bu tur tazelendi.

**Kollar (her kusur AYRI varyant, hiçbiri kalıcı yazılmadan):**

| kol | ne düzeltiyor | uydurma sabit? |
|---|---|---|
| `k1a` | taşıma · ölçülen realizasyon oranını doğrudan çarpan yapar | **evet** (dört ölçüm noktası) |
| `k1b` | taşıma · N bardaklık tepsi N AYRI masaya gider (tur = git + (N-1)×masalar-arası + dön) | hayır (mesafe BFS'ten) |
| `k2` | masa yükseltmesi **kalem kalem** (sim 20 masayı tek kalemde alıyordu) | hayır |
| `k3` | **bardak tavanı** — kapalı sistem, temizin tek kaynağı yıkama (D-082/D-083) | hayır |
| `k4` | **müşteri sabrı** — sabrı aşan bekleme parasını ödemez | hayır |
| `hepsi` | k1b + k2 + k3 + k4 (kollar birbirini gizliyor mu?) | — |

**Taban dokunulmadı:** `SIMKOL` verilmeden koşan çıktı, kollar eklenmeden önceki çıktının
**birebir aynısı** (diff temiz). Kollar tabanın üstüne binen anahtarlar, tabanın yerine geçen
bir yeniden yazım değil.

---

## §Bulgular

### Tablo 1 — tempo ölçütleri, kol başına

> `k3` ve `hepsi` satırları **düzeltilmiş (v2)** hâldir — iki kusuru §K3'te kapatıldı.
> `secilen` = uygulanan birleşim (k1b + k2), uygulanmadan ÖNCE ölçüldü.

```
kol   | ilk alim | acilis enUzun | otomasyon | SERIT(N) | en uzun bekleme (Normal)       | >20dk | masa enUzun
taban |    22 sn |        1.6 dk |    6.1 dk |  5.12 sa | 23.4 dk -> servis L6           |     2 |     21.4 dk
k1a   |    22 sn |        1.6 dk |    6.1 dk |  6.27 sa | 30.9 dk -> servis L6           |     2 |     28.3 dk
k1b   |    22 sn |        1.6 dk |    6.1 dk |  8.12 sa | 43.4 dk -> servis L6           |     6 |     39.7 dk
k2    |    22 sn |        1.6 dk |    6.1 dk |  5.36 sa | 23.4 dk -> servis L6           |     1 |      2.5 dk
k3    |    22 sn |        1.6 dk |    6.1 dk |  5.73 sa | 27.9 dk -> servis L6           |     2 |     25.6 dk
k4    |    22 sn |        1.6 dk |    6.1 dk |  5.12 sa | 23.4 dk -> servis L6           |     2 |     21.4 dk
hepsi |    22 sn |        1.6 dk |    6.1 dk |  9.31 sa | 47.5 dk -> servis L6           |     6 |      4.9 dk
secilen|    22 sn |        1.6 dk |    6.1 dk |  8.48 sa | 43.4 dk -> servis L6           |     6 |      4.5 dk
```

### Tablo 2 — MODEL ↔ GERÇEK (asıl sınav)

Model tahmini, `olcum-kuyruk.ts`in oyunun kendi `tick()`'iyle ölçtüğü debiyle karşılaştırılır.
Senaryolar birebir aynı kurulur (aynı pad zinciri, aynı ocak seviyesi, aynı garson VE bulaşıkçı
kademeleri, karakter yükseltmesi yok); ölçümde oyuncu olmadığı için modelin taşıma tavanı da
**oyuncusuz** hesaplanır. Tek fark modelin kendisidir.

```
  Sapma = |model - olculen| / olculen. KUCUK olan model gercege YAKIN.
olculen|         7.53/dk |         5.93/dk |         8.27/dk |        16.13/dk |     —
kol   |              G1 |              G2 |              G3 |              G4 | ORT SAPMA
taban |      6.39 (85%) |     7.49 (126%) |    11.08 (134%) |    27.28 (169%) |       %36
k1a   |     7.53 (100%) |     5.93 (100%) |     8.26 (100%) |    16.12 (100%) |        %0
k1b   |      6.39 (85%) |      5.35 (90%) |      8.00 (97%) |     15.26 (95%) |        %8
k2    |      6.39 (85%) |     7.49 (126%) |    11.08 (134%) |    27.28 (169%) |       %36
k3    |      4.61 (61%) |     7.49 (126%) |    10.81 (131%) |    24.22 (150%) |       %37
k4    |      6.39 (85%) |     7.49 (126%) |    11.08 (134%) |    27.28 (169%) |       %36
hepsi |      4.61 (61%) |      5.35 (90%) |      8.00 (97%) |     14.87 (92%) |       %15
secilen|      6.39 (85%) |      5.35 (90%) |      8.00 (97%) |     15.26 (95%) |        %8
```

### Tablo 3 — geç-oyun darboğazı (20 masa · L6 · garson 3 · lavabo L6)

```
  taban  talep   7.69 · arz 0.78 · tasima  1.21 · bardak     — -> ARZ     · gelir 52.57 TL/sn
  k1a    talep   7.69 · arz 0.78 · tasima  0.71 · bardak     — -> TAŞIMA  · gelir 47.93 TL/sn
  k1b    talep   7.69 · arz 0.78 · tasima  0.52 · bardak     — -> TAŞIMA  · gelir 35.15 TL/sn
  k2     talep   7.69 · arz 0.78 · tasima  1.21 · bardak     — -> ARZ     · gelir 52.57 TL/sn
  k3     talep   7.69 · arz 0.78 · tasima  1.21 · bardak  1.36 -> ARZ     · gelir 52.57 TL/sn
  k4     talep   3.38 · arz 0.78 · tasima  1.21 · bardak     — -> ARZ     · gelir 52.57 TL/sn
  hepsi  talep   2.26 · arz 0.78 · tasima  0.52 · bardak  0.12 -> BARDAK  · gelir 31.63 TL/sn
  secilen talep   7.69 · arz 0.78 · tasima  0.52 · bardak     — -> TAŞIMA  · gelir 35.15 TL/sn
```
---

### Bulgu 1 — tabanın sapması masa sayısıyla BÜYÜYOR ve yönü tek değil

Taban model 4 masada gerçeğin **%85'ini**, 20 masada **%169'unu** söylüyor (ort. sapma %36).
Yani "sim biraz iyimser" cümlesi eksik: sim **erken oyunda kötümser, geç oyunda iyimser**.
C1/B5b'nin geç-oyun hesapları (taşıma tavanı, 3. garsonun ne satın aldığı) bu %169'luk modelden
geliyor.

### Bulgu 2 — K1b sapmayı %36 → %8'e indiriyor, hem de tek bir uydurma sabit olmadan

Yapısal düzeltme (N bardak N ayrı masaya gider) G2/G3/G4'te **%90 / %97 / %95** tutturuyor.
Kullandığı tek sayı, düzenin kendi BFS mesafeleri: masalar arası ortalama 6,9 / 12,8 / 16,7 / 15,6
birim → tur tabanın **~1,8 katı** (4/8/12/20 masada 1,84 / 1,78 / 1,75 / 1,79 — masa sayısından
neredeyse bağımsız).

**K1a'nın %0'ı bir başarı değil, bir totolojidir:** çarpan tam da bu dört ölçüm noktasından
aradeğerleniyor, yani model kendi sınavına cevap anahtarıyla giriyor. Örneklem dışı bir
öngörüsü yok ve kaybın taşımadan mı demlemeyi beklemekten mi geldiğini ayırt etmiyor (sim'de
arz ayrı bir kol — çifte sayma riski). k1b ile birlikte kullanılamaz.

### Bulgu 3 — K2 sahte beklemeyi kapatıyor: 21,4 dk → **2,5 dk**

C1 §4'ün "model kusuru" dediği kalem ölçülerek kapandı. K2 **başka hiçbir şeye dokunmuyor**:
ilk alım, açılış temposu, otomasyon aynı; model↔gerçek sapması **aynı %36** (Tablo 2'de taban
satırıyla birebir). Yani K2 bir denge değişikliği değil, saf bir **defter düzeltmesi** —
20 dk'yı aşan alım sayısı da 2 → 1'e iniyor ve kalan tek aşan `servis L6` (D-078'de bilerek
bırakılmış olan).

### Bulgu 4 — K4 (sabır) tempoda **SIFIR** etki

Sabır talep kolunu yarıya indiriyor (7,69 → 3,38 bardak/sn) ama **talep hiçbir senaryoda
bağlayıcı değil** — darboğaz her yerde arz ya da taşıma. Tablo 1'de k4 satırı taban satırının
birebir aynısı, Tablo 2'de de öyle.

Bu bir "kol etkisiz çıktı" değil, **yapısal bir cevap**: doygun kuyrukta servis eden zaten
meşguldür, terk eden müşteri servis kapasitesini düşürmez — yalnız koltuğun üretken payını
düşürür, o da bağlayıcı olmayan bir kol. Sabrın tempoyu belirleyebilmesi için önce talebin
darboğaz olması gerekir.

### Bulgu 5 — K3 doğru yönde, ama fazla sert; sertliğin sebebi ölçüldü

*(Bu bölümün sayıları K3'ün İLK hâline aittir; düzeltilmiş hâli §K3'te.)*

Dördüncü tavan gerçekten var (geç oyunda darboğaz ARZ → **BARDAK**'a geçiyor, 0,78 → 0,38) ve
G3/G4'te modeli gerçeğe yaklaştırıyor (%134 → %90, %169 → %72). Ama **G1'de 3,20 diyor,
ölçülen 7,53** (%42) — model orada mekânı gerçekte olmadığı kadar kilitli gösteriyor. İki sebep:

1. **Model kirli bardağa tam bir gidiş-dönüş yazıyor.** Gerçek garson kirliyi zaten yaptığı
   turda alıyor ve leğen dönüş yolunda; D-083'ün dozu (tek bardak) tam da bu kısa taahhüt için
   seçilmişti.
2. **Sim bulaşıkçının yükseltme merdivenini hiç satın almıyor** (leğen 2→8, hız 2,0→2,8;
   toplam 10.300 ₺). D-083 o merdiven tavandayken 20 masada temiz bardağın **hiç** bitmediğini
   ölçmüştü; model kademe 0'da donmuş bir bulaşıkçı varsayıyor.

> **Bir tuzak kayda geçsin:** K3'ün ilk çözücüsü `akış = min(akış, yıkama(akış))` yinelemesiydi.
> Her adım akışı yalnız aşağı çektiği için **hep sıfıra iniyordu** ve model G1'de "mekân tamamen
> kilitli" diyordu. Yanlış çözücü, doğru modeli çürük gösterdi; ikiye bölme kararlı kökü buluyor.
> Sayı üretmeden önce sayıyı üreten yöntemin kendisi sınanmalı.

### Bulgu 6 — üç tempo ölçütünün İLK ÜÇÜ hiçbir kolda değişmiyor

`ilk alım 22 sn` · `açılış en uzun 1,6 dk` · `otomasyon 6,1 dk` — **yedi kolun hepsinde aynı.**
Sebep yapısal: bu ölçütler garsondan ÖNCEKİ pencereye ait; orada tek taşıyıcı, tek tepsi, birkaç
masa var ve dört kusurun hiçbiri o pencerede çalışmıyor (k1b'nin masalar-arası terimi tepsi 1
iken sıfır, k3'ün bardağı ilk görevden sonra giriyor, k2'nin masası henüz yok, k4'ün talebi
bağlayıcı değil).

**Sonuç: D-079'un açılış hükmü modelin kusurlarından bağımsız — dokunulmadan sağlam kalıyor.**

### Bulgu 7 — dördüncü ölçüt (20 dk) tabanın iyimserliğiyle geçiyor

20 dk'yı aşan alım sayısı: taban **2** → k1a 2 → k2 **1** → k1b **6** → k3 **7** → hepsi **12**.
Yani *"20 dk'yı aşan tek alım kalmasın"* ölçütünün bugünkü geçer notu, modelin geç-oyunu %169
abartmasına dayanıyor. Model gerçeğe yaklaştıkça bu ölçüt **ihlale düşüyor** — geç-oyun eğrisi
(servis L6 basamağı, zone3, masa L4) gerçekte modelin söylediğinden uzun sürüyor.

### Bulgu 8 — `hepsi` kolları TOPLAMAK modeli iyileştirmiyor, kötüleştiriyor

`hepsi` ort. sapma **%32** — tek başına k1b'nin **%8**'inden kötü. Sebep: k1b ile k3 aynı
garsonun aynı boş vaktini iki kez kısıyor (k1b turu uzatır → boş vakit azalır → k3 yıkamayı
kısar → akış düşer → …). İki kol bağımsız değil, aynı kaynağı paylaşıyor.

`hepsi` satırının Tablo 1'deki `masa enUzun 6,5 dk` ve `SERİT 11,96 sa` değerleri de yanıltıcı:
koşu 12 saatlik pencerede zincirin sonuna zar zor varıyor, bekleme boşlukları yalnız ardışık
İKİ alım arasında ölçüldüğü için kuyruğun sonundaki duruş hiçbir boşluğa yazılmıyor.

---

## §K3'ün iki kusuru kapatıldı ve YENİDEN ölçüldü

Karar paketinde k3'ün ertelenmesi önerilmişti; kullanıcı *"en kalitelisi ne ise onu yap, işten
kaçma"* dedi. Bu yüzden k3 ertelenmedi: Bulgu 5'te adı konan iki kusur **düzeltilip yeniden
ölçüldü**, karar ölçüme bırakıldı.

| düzeltme | ne değişti |
|---|---|
| ① kirli için TAM tur yerine **sapma payı** | Boştaki garson tezgâha zaten dönüyor; kirlinin bedeli `d(masa→leğen) + d(leğen→tezgâh) − d(masa→tezgâh)`. Mesafeler leğenin gerçek `servicePlace().dish` konumundan, BFS ile. |
| ② bulaşıkçının **yükseltme merdiveni** | Sim leğen (2→4→6→8) ve hız (2,0→2,4→2,8) kademelerini artık satın alıyor — bardak darboğazken, servis merdiveniyle aynı "akıllı oyuncu" kuralıyla. Bulaşıkçı döngüsü de leğen↔masa mesafesinden türüyor. |

**Sonuç (aynı sınav, Tablo 2'nin ölçütü):**

```
kol      G1 (7.53)     G2 (5.93)     G3 (8.27)    G4 (16.13)  | ORT SAPMA
k3 v1   3.20 (42%)   7.49 (126%)   6.92  (84%)  11.02  (68%) |    %44 → düzeltmeden önce
k3 v2   4.61 (61%)   7.49 (126%)  10.81 (131%)  24.22 (150%) |    %37
hepsi v1 3.20 (42%)   5.35 (90%)   6.05  (73%)   8.33  (52%) |    %46
hepsi v2 4.61 (61%)   5.35 (90%)   8.00  (97%)  14.87  (92%) |    %15
k1b tek  6.39 (85%)   5.35 (90%)   8.00  (97%)  15.26  (95%) |     %8   ← hâlâ en iyisi
```

Düzeltmeler işe yaradı (hepsi %46 → %15) ama **k3 hâlâ modeli kötüleştiriyor** (%8 → %15) ve
kalan sapmanın tamamı **G1**'de. Sebep artık kesin: G1'de taban modelin **taşıma tavanı zaten
gerçeğin altında** (6,36 < 7,53 müşteri/dk — ölçülen %117,8'in kaynağı bu). Yıkama tavanını
eklemek o zaten dar olan tavanı bir kez daha kısıyor. **G1'in açığı yıkamada değil, taşıma
tavanının 4 masada fazla kötümser olmasında** — ayrı bir kalem.

## §Karar — D-086

| kol | karar | gerekçe (sayı) |
|---|---|---|
| **k1b** | **ALINDI** | sapma %36 → %8, tek bir uydurma sabit olmadan |
| **k2** | **ALINDI** | sahte bekleme 21,4 → 4,5 dk; sapmaya dokunmuyor (Tablo 2'de taban satırıyla birebir) |
| k1a | alınmadı | %0 bir totoloji — çarpan kendi sınav sorularından türüyor |
| k3 | alınmadı (iki kusuru kapatıldıktan SONRA) | sapmayı %8 → %15 kötüleştiriyor; kalan açık G1'in taşıma tavanında |
| k4 | alınmadı | ölçülen etki SIFIR; talep hiçbir senaryoda bağlayıcı değil |
| hepsi | alınmadı | %15 — parçalarının en iyisinden kötü |

**Uygulanan birleşim (`secilen` = k1b + k2) ayrı bir varyant olarak, uygulanmadan ÖNCE ölçüldü:**
ort. sapma **%8** (k1b ile aynı — iki kol birbirine karışmıyor), masa beklemesi **4,5 dk**,
açılışın üç ölçütü değişmemiş.

**Bulgu 7 kayda geçti, bu tur uygulanmadı** (kullanıcı kararı): model gerçeğe yaklaşınca
20 dk'yı aşan alım Normal profilde **2 → 6**'ya çıkıyor (en uzun 43,4 dk → `servis L6`).
Geç-oyun eğrisini ucuzlatmak `economy.config.ts`'e dokunur ve **o kolun ölçülmüş sayı satırı
yok** — varyant kapısı gereği kendi turunda ölçülüp karara bağlanacak.

## §Uygulama

- `tools/simulate.ts` — yürürlükteki model artık `VARSAYILAN = { k1b, k2 }`. C5 öncesi model
  `SIMKOL=eski` ile hâlâ koşuyor (karşılaştırma zemini silinmedi); `SIMKOL=karsilastir` tabloyu
  üretir. Elenen kollar (k1a/k3/k4) **kod olarak duruyor** — bir daha ölçülebilsinler diye.
- Bekçi: `tests/sim-model.test.ts` — 17 test, **üç mutasyonla** doğrulandı:
  1. k1b'nin masalar-arası terimi silindi → 4 test kırıldı (sapma, iki-kat, taşıma bağlayıcılığı, zemin).
  2. k2 geri alındı (tüm masalar tek kalemde) → "20 masa tek kalemde yükselmez" kırıldı.
  3. Elenen k3 varsayılana sokuldu → 4 test kırıldı (sapma, masa beklemesi, toplama, kol listesi).
- Final tam koşu: `docs/olcum-sim.txt` (yürürlükteki model) · `docs/olcum-sim-kollar.txt` (kol tablosu).
  D-079'un üç ölçütü yürürlükteki modelde de geçiyor: 22 sn ✓ · 1,6 dk ✓ · 6,1 dk ✓.

> **Bir tuzak daha kayda geçsin:** bekçinin yedi kolu koşan testi ilk hâlinde vitest'in 5 sn'lik
> varsayılan zaman aşımına düşüp *"kırıldı"* göründü — C3'ün ve C4'ün tuzağının üçüncü tekrarı.
> Uzun koşan test kırık test değildir; süre açıkça verilir.

## §Bu turun kapattığı açık kalemler

- C1 §4 — sahte 21,4 dk masa beklemesi (**kapandı**, 4,5 dk).
- C3 §6/§10 — "simulate.ts'in taşıma modeli iyimser" (**kapandı**, %36 → %8).
- `docs/olcum-kuyruk.txt` D-083 öncesinden kalmıştı (**tazelendi**; `olcum-bardak.txt` zaten
  D-083 sonrasıymış, değişmedi).
- C3 §6'nın G1 satırı (%12,5) **çürüdü**: o sayı taşımanın değil bardak kilidinin sayısıymış.

## §Bu turun AÇTIĞI kalemler

- **Bulgu 7** — geç-oyun eğrisi gerçek modelde 20 dk ölçütünü 6 kez aşıyor. Kendi ölçüm turunu ister.
- **G1'in taşıma tavanı fazla kötümser** (model 6,36 < ölçülen 7,53 müşteri/dk): 4 masada garson
  ortalama mesafeye değil, yakınına servis ediyor. k3'ün önündeki tek engel bu.
- **k3 hazır ama beklemede:** iki kusuru kapatıldı, kodu duruyor; G1 kalemi çözülünce yeniden ölçülür.
