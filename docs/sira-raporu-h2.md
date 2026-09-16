# H2 raporu — masa yükseltmelerinin SIRASI

**Tur:** Faz H 2/3 · 2026-09-16
**Araç:** `tools/olcum-sira-h2.ts` + `tools/sira-kollari.ts` · ham çıktı: `docs/olcum-sira-h2.txt` (TAM koşu)
**Kapı:** D-084 varyant kapısı — `rules.ts` ve `economy.config.ts` bu turda **değişmedi**.

---

## Soru

Bugün bir alanın masa yükseltme kapısı açılınca (`tableUpgradeUnlockedIn`, yalnız ALANIN
`upgradeRequiresByArea` koşuluna bakar) o alandaki masaların **hepsi aynı anda ve herhangi bir
sırayla** yükseltilebiliyor. Masanın kendi seviyesi de, komşusunun seviyesi de kapıya girmiyor.

İki şey birden bilinmiyordu:

1. **Dikkat** — bu serbestlik ekranda kaç zemin noktası doğuruyor? `olcum-tek-odak.ts` masa
   işaretini *ort 7,82 · en çok 16* sayıyor ama **ADIM** başına; bir adım 3 saniye de sürer
   40 dakika da. Oyuncunun gerçekten baktığı sayı **saniyeyle** ağırlıklı olandır ve o hiç
   ölçülmemişti.
2. **Tuzak** — sıra serbestse, oyuncunun seçtiği sıra sonucu değiştiriyor mu? Değiştiriyorsa
   fark oyuncunun **kendine verebileceği cezadır**. Fark küçükse zorlama boşuna özgürlük alır;
   büyükse serbest sıra bir tuzaktır ve bugünkü hâli savunulamaz.

Kullanıcının önerdiği iki kol: **A tek hedef** (aynı anda tek masanın noktası canlı; tavana
varmadan sonraki açılmaz) · **B kuşak** (hepsi L'ye varmadan hiçbiri L+1'e çıkamaz).

---

## Yöntem

Ölçüm `tools/simulate.ts`'e eklenen **masa sırası kancasına** (`masaSirasiAyarla`) dayanıyor.
Kanca iki şeyi birden tarif ediyor, çünkü soru ikisini birden soruyor:

| parça | ne demek | kimin kararı |
|---|---|---|
| **KAPI** (`isaretler`) | o an noktası CANLI masaların kümesi = ekranda çizilen işaret | tasarımın |
| **POLİTİKA** (`tercih`) | oyuncu o kümeden hangisini önce alır | oyuncunun |

Bu ayrım turun çekirdeği. "Serbest sıra kötü mü?" sorusu, **kapıyı değiştirmenin etkisiyle
oyuncunun kendi seçiminin etkisi ayrılmadan** cevaplanamaz: T ile P arasındaki fark oyuncunun
kendine yaptığıdır, T ile B arasındaki fark kapının oyuncuya yaptığıdır.

**Altı kol** (hiçbiri koda uygulanmadan):

| kod | kapı | oyuncu politikası |
|---|---|---|
| **T** | serbest (bugünkü kural) | en ucuzu al — **TABAN**, bugünkü sim davranışı |
| **D** | serbest | derin: bir masayı tavana çıkar, sonra ötekine geç |
| **P** | serbest | hep en pahalı yükseltmeyi al |
| **R** | serbest | canlı noktalardan rastgele biri (tohumlu) |
| **A** | **tek hedef** — aynı anda 1 nokta canlı | (kapı tek seçenek bırakır) |
| **B** | **kuşak** — yalnız en düşük seviyedekiler canlı | kuşak içinde en ucuzu al |

Model: **D-086 yürürlükteki** (k1b çok duraklı tur + k2 masa kalem kalem). Hüküm **Normal**
profilde (verim 0,55) okunur — soru "oyuncu ne görüyor / ne kaybediyor", "tavan nerede" değil.
İdealize (1,0) ikinci bant olarak basılır. Pencere 12 saat.

### Damgalar — bu koşu gerçekten ölçüm mü

| damga | ne denetliyor | sonuç |
|---|---|---|
| **kanca saydam** | T kolunun parmak izi, kanca KAPALI tabanınkiyle **aynı** olmalı | ✓ (iki profilde de birebir) |
| **varyant etkili** | D/P/R/A/B'nin izi tabandan **farklı** olmalı (C4 tuzağı ②) | ✓ (beşi de) |
| **kapı tutarlı (A)** | A'da canlı nokta hiçbir tick'te 1'i aşamaz | ✓ (tepe = 1) |
| **kuşak tutarlı (B)** | B'de canlı küme TEK seviyeden oluşmalı | ✓ (0 sn sapma) |
| **ölçüt kör değil** | aynı sayaç TABAN'da sıfırdan büyük çıkmalı | ✓ (1,88 sa) |
| **ölü basamak kolu etkili** | karşı-deney merdiveni izi değiştirmeli | ✓ |
| **merdiven geri alındı** | `economy.config.ts` koşudan sonra eski hâlinde | ✓ |

Ayrıca sim'in taban çıktısı (`npx tsx tools/simulate.ts`) kanca eklendikten **sonra da birebir
aynı** — kancanın ölçtüğü şeyi değiştirmediğinin kanıtı bir yorum satırı değil, bir diff.

### Ölçümün kendi iki kazası (yöntem notu)

**① Yanlış damga, doğru kol.** İlk koşuda "B'de yayılım ≤ 1" damgası kırıldı ve bir an kuşak
kolu bozuk göründü. Bozuk olan **damgaydı**: salon geneli yayılımı tavana varmış masaları da
sayıyor, oysa tavandaki masa canlı kümeden çıkar — kapı geçmişe dokunamaz. Kuralın makine
karşılığı "salon yayılımı" değil, **"canlı kümenin tek seviyeden oluşması"**. Damga yeniden
yazıldı ve yanına **karşı-denetim** kondu: aynı sayaç TABAN'da sıfırdan büyük çıkmazsa B'nin
temiz çıkması hiçbir şey kanıtlamaz (kör ölçüt kendini "geçti" diye gösterir).

**② Ölçüm penceresi milestone listesiyle kapanıyordu.** İlk tam koşuda "20 masa TAVANDA" her
kolda `—` çıktı; okunsa "masa yükseltmeleri hiç bitmiyor" diye rapora girecekti. Sebep oyunda
değil araçtaydı: `runProfile` **son milestone'da `break` ediyor** (hız için), masa seviyeleri
ise o listenin çok ötesinde sürüyor. Gözlemli koşular için `tamPencere` bayrağı eklendi; taban
koşuları bayrağı vermediği için eski çıktı korunuyor. Sayı `—`'dan **8,69 sa**'ya döndü.

---

## §Bulgular

### Ö1 — DİKKAT: ekranda aynı anda canlı masa noktası (Normal, ZAMAN ağırlıklı)

| kol | ort | tepe | >1 noktanın süre payı | en yoğun TEK ALAN (ort/tepe) |
|---|---|---|---|---|
| **T (bugün)** | **3,48** | **12** | **%54,5** | 2,23 / 8 |
| D | 1,70 | 8 | %37,5 | 1,60 / 8 |
| P | 1,76 | 8 | %38,0 | 1,59 / 8 |
| R | 3,47 | 12 | %54,5 | 2,23 / 8 |
| **A** | **0,54** | **1** | **%0,0** | 0,54 / 1 |
| B | 2,95 | 12 | %53,3 | 2,07 / 8 |

Oyun süresinin **yarıdan fazlasında** (%54,5) ekranda birden çok masa noktası duruyor, tepede
12 tanesi birden. A bunu **yapısal olarak** sıfırlıyor (tepe 1, %0,0). **B neredeyse hiçbir şey
kazandırmıyor: 3,48 → 2,95.**

### Ö2 — TEMPO (Normal profil)

| kol | masa L1 | ŞERİT DOLDU | lifetime 10k | 20 masa TAVANDA | masa alımı |
|---|---|---|---|---|---|
| **T (bugün)** | 39,0 dk | 8,48 sa | 2,13 sa | 8,69 sa | 80 |
| D | 39,0 dk | **8,00 sa** | 2,09 sa | **8,21 sa** | 80 |
| P | 39,0 dk | 8,05 sa | 2,12 sa | 8,26 sa | 80 |
| R | 39,0 dk | 8,48 sa | 2,13 sa | 8,68 sa | 80 |
| **A** | 39,0 dk | **8,00 sa** | 2,09 sa | **8,21 sa** | 80 |
| B | 39,0 dk | **8,49 sa** | 2,13 sa | **8,70 sa** | 80 |

### Ö3 — BİRİKİM ve MEKANİZMA (Normal; ₺ / koltuk / koltuk-ağırlıklı ort. bahşiş)

| kol | 1 sa | 3 sa | 6 sa |
|---|---|---|---|
| **T** | 3.891 ₺ / 8 klt / 0,50 ₺ | 14.942 ₺ / **18** klt / **3,56** ₺ | **48.182 ₺** / 40 klt / 8,00 ₺ |
| D | 3.891 ₺ / 8 klt / 0,50 ₺ | 17.536 ₺ / **32** klt / **7,25** ₺ | **58.097 ₺** / 41 klt / 7,80 ₺ |
| P | 3.891 ₺ / 8 klt / 0,50 ₺ | 17.361 ₺ / 32 klt / 7,25 ₺ | 57.117 ₺ / 41 klt / 7,80 ₺ |
| R | 3.891 ₺ / 8 klt / 0,50 ₺ | 14.947 ₺ / 18 klt / 3,56 ₺ | 48.217 ₺ / 40 klt / 8,00 ₺ |
| **A** | 3.891 ₺ / 8 klt / 0,50 ₺ | 17.536 ₺ / 32 klt / 7,25 ₺ | **58.097 ₺** / 41 klt / 7,80 ₺ |
| B | 3.891 ₺ / 8 klt / 0,50 ₺ | 14.942 ₺ / 18 klt / 3,56 ₺ | **48.033 ₺** / 40 klt / 8,00 ₺ |

**TUZAK ÖLÇÜSÜ (6 sa lifetime, serbest kapı içinde):** en iyi politika 58.097 ₺ · en kötü
48.182 ₺ · **fark 9.915 ₺ = %20,6**. (İdealize profilde %9,9.)

3 saatlik satır mekanizmayı veriyor: derin kol hem **koltuğu** (18 → 32) hem **bahşişi**
(3,56 → 7,25 ₺) öne çekiyor. İkisi çarpım hâlinde geliri besliyor.

### Ö4 — KAPININ BEDELİ ve OKUNABİLİRLİK (Normal)

| kol | ölü para | masa bekleme (en uzun) | 20 dk aşan | yarım masa (ort) | seviye yayılımı (ort/tepe) | çok-seviyeli küme |
|---|---|---|---|---|---|---|
| **T** | 0 sn | 3,49 sa | 4 | **2,51** | 0,96 / 4 | 1,88 sa |
| D | **1,06 sa** | 3,49 sa | 4 | 0,33 | 1,57 / 4 | 2,29 sa |
| P | 1,19 sa | 3,49 sa | 4 | 0,33 | 1,58 / 4 | 2,34 sa |
| R | 5,8 dk | 3,49 sa | 4 | 2,48 | 0,98 / 4 | 1,96 sa |
| **A** | **1,06 sa** | 3,49 sa | 4 | **0,33** | **1,57** / 4 | 0 sn |
| B | 5,2 dk | 3,49 sa | 4 | 2,58 | 0,91 / 4 | 0 sn |

### Ö4b — SESSİZ SALON: dar kapının tek gerçek riski (ölçüldü, tahmin edilmedi)

Dar kapının akla gelen riski şu: yeni bir salon açılır, masaları duruyordur ama sıra onlara
gelmediği için **hiçbirinin noktası canlı değildir** — salon bozuk görünür. Bu tahmin edilmedi,
sayıldı: "kapısı açık + tavan altı masası var + o alanda hiç canlı nokta yok" durumunun toplam
süresi ve **en uzun kesintisiz bloğu** (toplam küçük ama tek blok saatlerceyse sorun toplamda
gizlenir).

| kol | toplam süre | en uzun kesintisiz blok |
|---|---|---|
| T · D · P · R (serbest kapı) | **0 sn** | 0 sn |
| **A** | 34,7 dk | **27,0 dk** |
| B | 1,21 sa | 18,1 dk |

Serbest kapıda bu durum **yapısal olarak imkânsız** (her masa kendi noktasını taşır). A'da
oyuncu bir salonu en fazla **27 dakika** boyunca tamamen sessiz görebiliyor; B'de toplam daha
uzun (1,21 sa) ama bloklar daha kısa. Bu, A'nın ödediği tek gerçek bedeldir ve **ekonomik
değil görsel** bir bedeldir — sayılar A'nın tempoda ve dikkatte kazandığını zaten söylüyor.

### Ö5 — A ile D'nin parmak izi BİREBİR AYNI

| profil | T (=taban) | D | A |
|---|---|---|---|
| Normal | `8eddc0d5` | `fd6d3dfd` | **`fd6d3dfd`** |
| İdealize | `c00bee2d` | `2cf111cd` | **`2cf111cd`** |

D ve A aynı dünyayı üretiyor. **Tek-hedef kapısının ekonomik bedeli tam olarak sıfırdır:**
kapı, derin oynayan bir oyuncunun zaten gönüllü seçtiği sırayı zorunlu kılmaktan başka bir şey
yapmıyor. Ö4'teki **1,06 saatlik "ölü para" A'nın kapısının maliyeti değildir** — D'de, kapı
hiç yokken, aynı 1,06 saat çıkıyor. O süre kazanan stratejinin kendi bekleme maliyeti.

### Ö6 — KARŞI-DENEY: tuzağın kaynağı SIRA mı, KOLTUK MERDİVENİ mi? (hipotez ÇÜRÜDÜ)

Ö3'ün mekanizması bir şüphe doğurdu. Dörtlü masanın koltuk merdiveni
`seatsByLevel.four = [1, 2, 2, 4, 4]`: **L1 ve L2 aynı koltuğu veriyor**, yani L2 kapasite
açısından ölü bir basamak. "En ucuzu al" politikası tam orada oyalanır (her masanın L1/L2'si,
bir masanın L3'ünden ucuzdur). Tuzağın kaynağı buysa, basamağı canlandırmak tuzağı **sıraya
dokunmadan** kapatmalıydı. Kol koşu anında uygulanıp geri alındı (config dosyası değişmedi):

| merdiven | kol | 6 sa lifetime | 3 sa koltuk | ŞERİT DOLDU | derin sıranın üstünlüğü |
|---|---|---|---|---|---|
| 1·2·2·4·4 (bugün) | T | 48.182 ₺ | 18 | 8,48 sa | **%20,6** |
| 1·2·2·4·4 (bugün) | A | 58.097 ₺ | 32 | 8,00 sa | — |
| 1·2·3·4·4 (deney) | T | 48.597 ₺ | 26 | 8,45 sa | **%19,0** |
| 1·2·3·4·4 (deney) | A | 57.851 ₺ | 33 | 8,01 sa | — |

**Ölü basamak kaldırılınca tuzak %20,6'dan yalnız %19,0'a iniyor.** Koltuk açığının üçte ikisi
kapandığı (18 → 26) hâlde tempo farkı neredeyse hiç kıpırdamıyor. Yani tuzağı kuran şey
kapasite değil, **koltuk-ağırlıklı ortalama bahşiş**: aynı parayı bir masaya yığmak ₺/servisi,
dört masaya bölmekten hızlı büyütüyor. Bu sıranın kendi aritmetiğidir; config'ten çıkarılamaz.
Üçüncü seçenek ("sırayı serbest bırak, dengeyi düzelt") bu sayıyla **kapanmıştır**.

---

## §Sınırlar (model neyi söylemiyor)

1. **Model bahşişi KOLTUK-ağırlıklı ortalıyor** (`ortBahsis`), yani her koltuğun eşit dolduğunu
   varsayıyor. Oyunda müşteri **en yüksek seviyeli masayı seçiyor** (D-066 · Ö3). Gerçekte derin
   oynayan oyuncunun iyi masası daha dolu olacağı için **ortalama bahşiş modelin dediğinden
   yüksek** çıkar. Yani %20,6 bir **alt sınırdır**, tuzak muhtemelen daha derin.
2. **20 dk'yı aşan alım sayısı (4) altı kolda da aynı** — sıra bu ölçütü kıpırdatmıyor; H2'nin
   kararı D-010 §3.6 tempo ölçütüne dokunmuyor.
3. Ölçüm 12 saatlik tek pencerede, tek tohumla. R kolu tek tohumla koştu; iki koşu arasındaki
   oynaklık ölçülmedi (T ile farkı zaten %0,1 mertebesinde).
4. Kolların hiçbiri **çevrimdışı gelire** bakmadı; sıra kapısının offline kısıtla etkileşimi
   ölçülmedi.
5. A kolu **GLOBAL** ölçüldü: tek hedef bütün açık masalar arasında tekil. "Alan başına tek
   hedef" (her salonun kendi sırası) ayrı bir koldur ve **ölçülmedi** — seçilirse kendi sayı
   satırını ister (varyant kapısı).

---

## §Karar

*(boş — karar paketi kullanıcıya sunulacak; D-084 adım 3)*

---

## §Uygulama

*(boş — adım 4; yalnız seçilen kol yazılır)*
