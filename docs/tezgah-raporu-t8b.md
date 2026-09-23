# T8b — TEZGÂH ARKASI (K10 duvar payı · K9 bulaşık kuyruğu · G-85 tost noktası · G-90 tost asset'i)

> Karar: (boş — karar paketinden sonra)
> Araçlar: `tools/olcum-tezgah-t8b.ts` → `docs/olcum-tezgah-t8b.txt` (§A geometri + §B oyunun kendi
> `tick`'i) · `tools/shot-t8b.mjs` → `docs/gorsel/ss/t8b-k10-*.png` · `tools/tost-bak.mjs` →
> `docs/gorsel/ss/t8b-tost-aday.png`
> Dikişler (ikisi varsayılanda kapalı, tick parmak izi dikişlerle **birebir aynı** — `cmp` ile doğrulandı):
> `layout.solDuvarKoluAyarla` (sol duvar yerleşimi artık `SOL_DUVAR_PAYI`ndan türer) ·
> `tick.bulasikKoluAyarla` (leğen kuyruğu). Commit #1 denge dosyasına dokunmadı.

## §0 Soru

Kullanıcı, 2026-09-18 (`docs/geribildirim-oyun-testi-2026-09-18.md`):

> **G-68** *"tezgâh ve bulaşığın arkasında olması gereken adam önünde duruyor. Duvarla tezgâh
> arasında olması gerekirken tezgâhın öbür tarafında duruyor"* — *"tezgah olduğu yerde kalsın adam
> da arkasına geçsin… belki tezgah duvardan biraz uzaklaşır ama farklı bir şey olmamalı, duvardan
> çıkmasın… yine de kaliteli olsun"*
>
> **G-70** *"Ben bıraktığım zaman, birkaç tane bıraktıktan sonra kirlenip, o adam oraya geldiğinde
> temizlenmesi gerek"*

2026-09-21 (`docs/geribildirim-oyun-testi-2026-09-21.md`):

> **G-85** *"tost alınan yer ile çay alınan yerler yan yana veya iç içe ya ayrı ayrı da olabilir
> bilemedim. bir sistem kur kısaca"*
>
> **G-90** *"tost ve tost makinesi için de internetten asset bul şu an sanki kendi çizdiğin var gibi
> ve o da kötü duruyor sanki"*

Bugün: sol duvar döneminde (1-2 salon) gövde ile duvar arası **0,30 br**, aktör gövdesi **0,56 br** —
adam oraya sığmıyor, çaycı ve bulaşıkçı salon tarafında. Yıkama teslimde ANLIK; leğende bekleyen
kirli diye bir durum yok. Tost ayrı obje değil, tezgâhın L5 basamağı.

## §Bulgular

Tüm sayılar tam koşu (`OLCUM=tam`, damgalar temiz).

### Bulgu 1 — K10 geometri: en küçük yeterli pay 0,60; oyuncu 0,75'ten itibaren arkaya sızıyor

(§A — statik; iki dönem G4/G8 aynı sonucu veriyor, çünkü servis köşesinin çevresi iki dönemde aynı.)

| pay | aktör yan payı | arka şerit (sütun/hücre) | oyuncu arkada (hücre) | ön koridor | posta 1↔gövde | arka posta → masa 1 |
|---|---|---|---|---|---|---|
| **0,30 bugün** | −0,13 (sığmıyor) | 0 / 0 | 0 | 3,16 | 0,70 | (ön posta) 1,5 |
| 0,60 | 0,02 | 1 / 17 | **0** | 2,86 | 0,40 | 5,6 |
| 0,75 | 0,09 | 2 / 34 | **17** | 2,71 | 0,25 | 5,3 |
| 0,90 | 0,17 | 2 / 34 | **17** | 2,56 | 0,10 | 5,3 |
| 1,05 | 0,24 | 3 / 51 | 34 | 2,41 | **−0,05** (gövdeye girer) | 5,1 |

- **0,60 en küçük yeterli pay:** personel ızgarasında tek sütunluk sürekli şerit açılıyor, oyuncu
  ızgarası kapalı kalıyor. Ama aktörün iki yana payı **0,02** — karede kafa ve omuz duvara giriyor.
- **0,75'ten itibaren oyuncu da arkaya girebiliyor** (17 hücre). Arkada oyuncunun işi yok; seçilen pay
  ≥ 0,75 ise arka şerit oyuncuya ayrıca kapatılmalı (salt oyuncu katısı — personel ızgarasına dokunmaz).
- **Ön koridor sorun değil:** en darı 2,41 (oyuncu geçişi 0,94).
- **Garson postası 1** (−15 · 5) gövdeye yaklaşıyor ve 1,05'te içine giriyor → pay kadar kaydırılmalı
  (teknik, sayı değil).
- **Bulaşıkçının masa yolu uzuyor** (1,5 → ~5,3 br): arkadan çıkıp gövdenin ucunu dönüyor. Etkisi §B'de.
- Çay alma noktası, yükseltme noktası, bulaşıkçı pad'i: hiçbir payda çakışma yok (0,70 · 2,26 · ≥ 1,55).

**Kare** (`docs/gorsel/ss/t8b-k10-yanyana.png`, aynı kadraj, ocak L5, bulaşıkçı tutulmuş): 0,30'da
çaycı ve bulaşıkçı önde · 0,60'ta arkada ama duvara gömülü · 0,75 ve 0,90'da arkada, temiz.
**Kareden çıkan ek bulgu:** arkada ikisi AYNI şeritte — çaycının yolu bulaşığın ucuna kadar uzanıyor ve
bulaşıkçının postası bulaşığın arkasında, yani üst üste biniyorlar. Uygulamada çaycının yolu tezgâh
parçasına kısalır (teknik).

### Bulgu 2 — K10 oyun etkisi: hiçbir pay servisi düşürmüyor; bulaşıkçının uzayan yolu görünmüyor

(§B — oyunun kendi `tick`'i, oyuncu parkta, 180 sn ısınma + 420 sn kayıt, **4 tohum**; ± = tohumlar
arası yarı-aralık. Tanı koşusu tek tohumlu kısa pencerenin ±1-3 servis/dk oynadığını gösterdi — kısa
koşunun "P75 −%27" işareti gürültüydü, 300 sn × 3 tohumda P75 T0'ın ÜSTÜNDE çıktı.)

| kol | W8 servis/dk | W8 temiz=0 | W8 masada kirli | W4 servis/dk | W4 temiz=0 |
|---|---|---|---|---|---|
| **T0 bugün (0,30 · önde)** | **9,8 ± 1,8** | %22,9 | 13,3 | **8,0 ± 5,6** | %67,7 |
| P60 (0,60 · arkada) | 10,6 ± 2,1 | %3,5 | 9,4 | 10,6 ± 5,0 | %57,1 |
| P75 (0,75 · arkada) | 11,0 ± 1,9 | %23,7 | 13,7 | 13,9 ± 0,7 | %42,8 |
| P90 (0,90 · arkada) | 10,3 ± 2,9 | %23,1 | 12,6 | 12,8 ± 2,8 | %47,5 |
| P105 (1,05 · arkada) | 10,8 ± 0,8 | %9,3 | 10,3 | 12,0 ± 4,4 | %50,9 |

- **Yön: hiçbir kol servisi düşürmüyor**; bütün farklar tohum yayılımının içinde. Bulaşıkçının masa
  yolu 1,5 → ~5,3 br uzadı ama W8'de ölçülebilir bir bedeli yok (bulaşıkçı darboğaz değil).
- **W4 (bulaşıkçı yok, oyuncu AFK) kararsız bir rejim:** temiz bardak zamanın %43-68'inde sıfır, tohum
  yayılımı ±5,6. Bu tasarımın kendisi (bulaşık bu dönemde oyuncunun işi, D-083) — kol farkı değil.
- K10 denge kolu değil, **ölçü dondurma** kolu: seçim sayıyla değil karenin kalitesiyle yapılır.

### Bulgu 3 — K9: sürekli yıkama kuyruğu GÖRÜNMEZ; kullanıcının tarifi olan TOPLU yıkama görünür ve ucuz

Kullanıcının tarifi iki parçalı: *"birkaç tane bıraktıktan sonra kirlenip"* (leğende görünür yığın) ·
*"o adam oraya geldiğinde temizlenmesi"* (yıkama bir ANDA, adam gelince). İki biçim ölçüldü: kap başına
süre (Y) ve periyodik toptan yıkama (YT — ayrı tam koşu: `docs/olcum-tezgah-t8b-toplu.txt`, aynı taban).

| kol | W20 servis/dk | W20 kuyruk ort / maks | W8 servis/dk | W8 kuyruk maks | W4 servis/dk | W4 kuyruk maks |
|---|---|---|---|---|---|---|
| **T0 anlık (bugün)** | **9,0 ± 0,5** | 0 / 0 | **9,8 ± 1,8** | 0 | **8,0 ± 5,6** | 0 |
| Y05 · 0,5 sn/kap | 8,9 ± 0,7 | 0,1 / 2 | 9,2 ± 3,1 | 2 | 9,4 ± 4,5 | 2 |
| Y10 · 1,0 sn/kap | 8,9 ± 0,7 | 0,1 / 2 | 9,6 ± 2,2 | 3 | 11,3 ± 1,8 | 2 |
| Y20 · 2,0 sn/kap | 8,9 ± 0,6 | 0,3 / 3 | 9,0 ± 3,4 | 4 | 7,5 ± 4,1 | 2 |
| **YT10 · her 10 sn toptan** | **8,7 ± 1,0 (−%3)** | 0,5 / 4 | 8,9 ± 3,4 | **7** | 12,1 ± 0,4 | **6** |
| YT20 · her 20 sn toptan | 8,6 ± 1,2 (−%4) | 1,0 / 4 | 8,9 ± 3,4 | **10** | 11,1 ± 0,9 | **7** |

- **Sürekli yıkama (Y) istenen şeyi üretmiyor:** kuyruk ortalaması 0,1-0,3, en fazla 2-4 kap —
  leğende yığın ekranda neredeyse hiç oluşmuyor. Servise etkisi de yok (W20 9,0 → 8,9).
- **Toplu yıkama (YT) tarifi karşılıyor:** leğende 4-10 kaplık yığın birikiyor ve bir anda temizleniyor.
  Bedel en kararlı dünyada (W20, ±0,5) **−%3 (YT10) / −%4 (YT20)** — yayılım bandının kıyısında.
  W8'de −%9 ama ±3,4 yayılımla; W4'te gürültü yönü tersine çeviriyor.
- Yıkama anını ÇAYCI taşır (ölçümde sabit periyot; uygulamada çaycının leğene yürüyüp eğildiği an —
  görsel, sayı değil). Bardak havuzu değişmez (T8a Bulgu 7: havuz bağlamıyor).

### Bulgu 4 — G-85 tost noktası: bugün sistem VAR ama okunmuyor

Tost L5'te AYNI tezgâhtan çıkıyor (`service.tostLevel: 5`, tek pickup, tek merdiven). Kullanıcı bunu
ayırt edemedi — ekranda tost yeri koyu bir sac + küçük bir kapak, çay ile aynı tablada.
Üç kol, ikisi denge dışı:

| kol | ne | denge | ölçüm |
|---|---|---|---|
| **A** | aynı tezgâh, tost bölgesi okunur hâle gelir (gerçek makine + hazır tost istifi) | yok | gerek yok |
| **B** | ayrı tost MODÜLÜ tezgâhın yanında (kendi gövdesi, kendi makinesi); aynı merdivenle L5'te açılır, tek pickup | yok (pickup aynı) | gerek yok |
| C | ayrı tost noktası: kendi pad'i + kendi merdiveni + kendi pickup'ı | **VAR** (açılış zamanı, taşıma yolu, G-86 ④ "tost geç") | **ÖLÇÜLMEDİ** — seçilirse kendi turu (varyant kapısı) |

B'nin sol duvar döneminde yeri: tezgâhın güney ucu (z < 4,8) — yükseltme noktası 2,26 br uzakta; kesin
ölçü uygulamada donar.

### Bulgu 5 — G-90 tost asset'i: KayKit'te tost makinesi YOK; iki pakette de Türk tost makinesi yok

Taranan: dokuz KayKit paketi (tost/pres yok — S19a'da da ölçülmüştü), Kenney Food Kit (201 model:
`sandwich`, `bread`, `frying-pan`, `pan` var · makine yok), **Kenney Furniture Kit** (CC0, indirildi:
`toaster` = dikey ekmek kızartma makinesi, Türk tostu değil). Açık web'de CC0 low-poly pres/panini
makinesi bulunamadı (CGTrader/TurboSquid ücretli ve stil dışı; Meshy "CC0" etiketli ama AI üretimi,
tek model — paketin en kötü üyesi kuralı, D-122).

Aday kartı (`docs/gorsel/ss/t8b-tost-aday.png`, aynı tezgâh parçası + aynı ölçek işaretleri):

| aday | ne | stil kilidi | not |
|---|---|---|---|
| A | bugün: elle çizili sac + pres | ilkel | kullanıcı: *"kötü duruyor"* |
| B | Kenney `toaster` + `sandwich` | Kenney (2. paket, zaten istisna) | yanlış alet: dikey kızartma makinesi |
| C | KayKit `stove_single_countertop` + `pan_B` + tost | KayKit | tavada tost — okunur ama "makine" değil |
| D | Türk tost makinesi, yeniden çizim (tekli) | ilkel, KayKit oranları | nervürlü plaka, açık kapak, siyah kol |
| E | D'nin geniş plakalısı (L6 = ikinci pres yerine) | ilkel | seviye sinyali: plaka genişler |
| F | ayrı tost modülü (G-85 B): yan tezgâh + D + tahta + peynir kasası | KayKit + ilkel | G-85 B'nin görünüşü |

## §Karar

(boş — karar paketinden sonra doldurulur)
