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

```
kol   | ilk alim | acilis enUzun | otomasyon | SERIT(N) | en uzun bekleme (Normal) | >20dk | masa enUzun
taban |    22 sn |        1.6 dk |    6.1 dk |  5.12 sa | 23.4 dk -> servis L6     |     2 |     21.4 dk
k1a   |    22 sn |        1.6 dk |    6.1 dk |  6.27 sa | 30.9 dk -> servis L6     |     2 |     28.3 dk
k1b   |    22 sn |        1.6 dk |    6.1 dk |  8.12 sa | 43.4 dk -> servis L6     |     6 |     39.7 dk
k2    |    22 sn |        1.6 dk |    6.1 dk |  5.36 sa | 23.4 dk -> servis L6     |     1 |      2.5 dk
k3    |    22 sn |        1.6 dk |    6.1 dk |  8.56 sa | 45.7 dk -> servis L6     |     7 |     41.9 dk
k4    |    22 sn |        1.6 dk |    6.1 dk |  5.12 sa | 23.4 dk -> servis L6     |     2 |     21.4 dk
hepsi |    22 sn |        1.6 dk |    6.1 dk | 11.96 sa | 62.6 dk -> servis L6     |    12 |      6.5 dk
```

### Tablo 2 — MODEL ↔ GERÇEK (asıl sınav)

Model tahmini, `olcum-kuyruk.ts`in oyunun kendi `tick()`'iyle ölçtüğü debiyle karşılaştırılır.
Senaryolar birebir aynı kurulur (aynı pad zinciri, aynı ocak seviyesi, aynı garson kademeleri,
karakter yükseltmesi yok); ölçümde oyuncu olmadığı için modelin taşıma tavanı da **oyuncusuz**
hesaplanır. Tek fark modelin kendisidir.

```
olculen|   7.53/dk (G1) |   5.93/dk (G2) |   8.27/dk (G3) |  16.13/dk (G4) | ORT SAPMA
taban  |     6.39 (85%) |    7.49 (126%) |   11.08 (134%) |   27.28 (169%) |       %36
k1a    |    7.53 (100%) |    5.93 (100%) |    8.26 (100%) |   16.12 (100%) |        %0
k1b    |     6.39 (85%) |     5.35 (90%) |     8.00 (97%) |    15.26 (95%) |        %8
k2     |     6.39 (85%) |    7.49 (126%) |   11.08 (134%) |   27.28 (169%) |       %36
k3     |     3.20 (42%) |    7.49 (126%) |     7.41 (90%) |    11.69 (72%) |       %30
k4     |     6.39 (85%) |    7.49 (126%) |   11.08 (134%) |   27.28 (169%) |       %36
hepsi  |     3.20 (42%) |     5.35 (90%) |     6.56 (79%) |     9.70 (60%) |       %32
```

### Tablo 3 — geç-oyun darboğazı (20 masa · L6 · garson 3 · lavabo L6)

```
taban  talep 7.69 · arz 0.78 · tasima 1.21 · bardak    — -> ARZ    · gelir 52.57 ₺/sn
k1a    talep 7.69 · arz 0.78 · tasima 0.71 · bardak    — -> TAŞIMA · gelir 47.93 ₺/sn
k1b    talep 7.69 · arz 0.78 · tasima 0.52 · bardak    — -> TAŞIMA · gelir 35.15 ₺/sn
k2     talep 7.69 · arz 0.78 · tasima 1.21 · bardak    — -> ARZ    · gelir 52.57 ₺/sn
k3     talep 7.69 · arz 0.78 · tasima 1.21 · bardak 0.38 -> BARDAK · gelir 35.95 ₺/sn
k4     talep 3.38 · arz 0.78 · tasima 1.21 · bardak    — -> ARZ    · gelir 52.57 ₺/sn
hepsi  talep 2.26 · arz 0.78 · tasima 0.52 · bardak 0.10 -> BARDAK · gelir 23.79 ₺/sn
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

## §Karar

<!-- BOŞ — karar paketi kullanıcıya sunuldu, seçim bekleniyor (D-084 sıra kilidi: adım 3). -->

## §Uygulama

<!-- BOŞ — yalnız seçilen kol uygulanır (adım 4). -->
