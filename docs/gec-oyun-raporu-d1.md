# D1 — geç-oyun eğrisi: 20 dk ölçütünü kapatan kaldıraçlar

**Soru:** D-086 Bulgu 7 şunu açtı — model gerçeğe yaklaşınca (`k1b` + `k2`) Normal profilde
20 dk'yı aşan alım **2 → 6** oldu, en uzunu **43,4 dk → `servis L6`**. Bu tur onu karara
bağlıyor: **ölçüt mü bayat, eğri mi pahalı — düzeltilecekse hangi kaldıraçtan?**

**Araçlar:** `tools/olcum-gec-oyun.ts` (tarayıcı) + `tools/denge-kollari.ts` (varyant katmanı) ·
ham çıktı `docs/olcum-gec-oyun.txt` · damgalar `docs/olcum-gec-oyun.damga.txt`.
**`src/config/economy.config.ts` bu turda DEĞİŞMEDİ** — kollar çalışma anında uygulanıp geri
alınıyor (varyant kapısı, D-084).

**Doz tahmin edilmez, ÇÖZÜLÜR.** Her kol tek bir skaler dozla parametrelenir; tarayıcı ihlali
hedefe indiren **en küçük** dozu bulur. Böylece karar paketine "L6'yı 5.500 yapalım mı?" gibi
uydurma bir sayı değil, "bu kol ölçütü ancak şu dozla karşılıyor, karşılığında şunu ödüyor"
cümlesi gider. İki hedef ayrı ayrı çözülür: **≤ 1** (D-078'in bilerek bıraktığı `servis L6`
dışında temiz) ve **= 0** (tam temiz).

---

## §Kollar

| kol | ne değiştiriyor | doz |
|---|---|---|
| `m1` | **MODEL** (config değil): taşıma darboğazken oyuncu garson merdivenini alır | açık/kapalı |
| `f1` | servis merdiveninin son iki basamağı (L5 2.400₺ · L6 9.000₺) ucuzlar | çarpan |
| `f2` | 20 dk'yı aşan **dört pad** ucuzlar (`z2table4` · `zone3` · `z3table3` · `waiter3`) | çarpan |
| `f3` | garson **sonrası tüm eğri tektip** ucuzlar (pad'ler + servis L4-L6) | çarpan |
| `f4` | **cerrahi:** yalnız ihlal eden **altı** basamak ucuzlar (L5-L6 + dört pad) | çarpan |
| `g1` | **taşıma tavanı:** görev hattına eksik taşıyıcı kademeleri eklenir | +kademe |
| `g2` | **₺/müşteri:** masa bahşişi (`tipBase`) büyür | tipBase |
| `b1` | **basamak bölme:** servis merdiveni 6 → 6+n basamak; L4+ toplam ₺ ve toplam çıktı korunur | +basamak |
| `c1` | **karma:** `tipBase` 2→3 sabit + altı basamakta indirim (taranır) | çarpan |
| `o1` | **ölçütün kendisi:** hangi profilde geçerli — kod değişmez, hüküm değişir | — |

---

## §Bulgular

Tüm sayılar **tam koşu** (`OLCUM=tam`) damgalıdır; damgalar temiz (`docs/olcum-gec-oyun.damga.txt`).
Hiçbir kol modeli kaydırmadı: model↔gerçek sapması **her kolda %8** (C5'in sınavı) — yani bu tur
oyunu değiştiriyor, ölçü aletini değil.

### Tablo 1 — hedefi tutturan EN KÜÇÜK doz ve TAKASI

```
kol   | hedef | en kucuk doz                              | ihlal | enUzun  | SERIT   | sapma
taban |   —   | degisiklik yok                            |     6 | 43.4 dk | 8.48 sa |    %8
m1    | <=1   | ULASMIYOR — kol ATIL kaldi (bkz. Bulgu 5)
f1    | <=1   | ULASMIYOR — 4'un altina inmiyor
f2    | <=1   | ULASMIYOR — 2'nin altina inmiyor
f3    | <=1   | ×0.80  servis 650/1900/7200 · zone3 2000  |     1 | 34.3 dk | 7.22 sa |    %8
f3    | <=0   | ×0.45  servis 350/1100/4050 · zone3 1125  |     0 | 18.4 dk | 5.01 sa |    %8
f4    | <=1   | ×0.80  L5 1900/L6 7200 · pad 1120/2000/…  |     1 | 34.3 dk | 7.90 sa |    %8
f4    | <=0   | ×0.45  L5 1100/L6 4050 · pad 630/1125/990 |     0 | 18.4 dk | 6.91 sa |    %8
g1    | <=1   | ULASMIYOR — 2 kademede IHLALI ARTIRIYOR (6 -> 7)
g2    | <=1   | tipBase 2 -> 3.5                          |     1 | 32.5 dk | 7.04 sa |    %8
g2    | <=0   | tipBase 2 -> 8                            |     0 | 18.6 dk | 4.89 sa |    %8
b1    | <=1   | ULASMIYOR — 4'un altina inmiyor
c1    | <=1   | tipBase 3 + ×0.95 (L5 2300/L6 8550)       |     1 | 33.6 dk | 7.33 sa |    %8
c1    | <=0   | tipBase 3 + ×0.55 (L5 1300/L6 4950)       |     0 | 18.8 dk | 6.36 sa |    %8
```

`SERIT` = Normal profilde 20. masaya varış = **v1'in Kat 1 içeriğinin uzunluğu.** Taban 8,48 sa.

### Tablo 2 — ölçüt hangi profilde okunuyor? (`o1` kolunun tamamı)

```
profil    | verim | 20 dk'yi asan | en uzun bekleme
Idealize  | 1.00  |       1       | 23.9 dk -> servis L6
Yogun     | 0.80  |       1       | 29.8 dk -> servis L6
Normal    | 0.55  |       6       | 43.4 dk -> servis L6
Rahat     | 0.35  |      11       | 68.2 dk -> servis L6
```

---

### Bulgu 1 — ölçütün profili HİÇ SABİTLENMEMİŞ, ve hüküm tam da ona bağlı

D-079'un ilk **üç** ölçütü (ilk alım · açılış boşluğu · otomasyon) **İDEALİZE** profilde
(verim 1,0) okunuyor; dördüncüsü (20 dk) ise **Normal**'de (0,55). Bu, yazılı bir karar değil —
aracın kod akışından doğmuş bir alışkanlık.

**Kardeşlerinin profilinde dördüncü ölçüt BUGÜN DE geçiyor:** İdealize'de aşan alım **1**
(23,9 dk → `servis L6` — D-078'in bilerek bıraktığı basamağın ta kendisi). Yoğun'da da **1**.
Yani "6 ihlal" bir denge kusuru değil, **profil karışıklığının** sayısı.

Bu, hükmü tersine çevirmiyor ama sorusunu değiştiriyor: soru artık "eğri pahalı mı" değil,
**"bu ölçüt hangi oyuncu için yazıldı"**.

### Bulgu 2 — ihlalleri kapatan HER kol zinciri kısaltıyor; bedava kol yok

Ölçütü tutturabilen dört kolun (f3 · f4 · g2 · c1) hepsi ŞERİT süresini düşürüyor:
hedef ≤1'de **8,48 → 7,90 / 7,33 / 7,22 / 7,04 sa** (−%7 … −%17), hedef =0'da
**→ 6,91 / 6,36 / 5,01 / 4,89 sa** (−%19 … −%42).

Sebep yapısal ve kaçınılmaz: sim'in oyuncusu darboğaz kalemi için **biriktirir**, yani bir
beklemeyi kısaltmanın yalnız iki yolu var — beklenen şeyin fiyatı düşsün ya da bekleme
penceresindeki gelir artsın. İkisi de zincirin toplam süresini kısaltır. **"20 dk ölçütünü
tuttur" ile "Kat 1 içeriği uzun olsun" aynı anda istenemez**; bu turun asıl takası budur.

### Bulgu 3 — `f4` (cerrahi) `f3`'ü (tektip) HER İKİ hedefte de domine ediyor

İkisi de aynı dozda (×0,80) aynı ihlale (1) ve aynı en-uzun beklemeye (34,3 dk) varıyor —
ama f4 zinciri **7,90 sa**'da, f3 **7,22 sa**'da bırakıyor. Hedef =0'da fark daha da açılıyor:
**6,91 sa** vs **5,01 sa** (1,9 saat).

Yani indirimi ihlal etmeyen basamaklara da yaymanın hiçbir ölçüt karşılığı yok, yalnız bedeli
var. `f3` ölçülerek elendi.

### Bulgu 4 — `f1` ve `f2` tek başına YETMİYOR, ve nedeni toplanabilir değil

`f1` (yalnız servis L5-L6) **4**'ün altına inmiyor; `f2` (yalnız dört pad) **2**'nin altına
inmiyor — ne kadar ucuzlatılırsa ucuzlatılsın. Her biri kendi ailesindeki ihlalleri kapatıyor,
öteki aile ayakta kalıyor. `f4` ikisini AYNI anda uyguladığında ×0,80 gibi hafif bir dozla 1'e
iniyor: kollar toplanmıyor, **birlikte kapı açıyor.**

### Bulgu 5 — `m1` (akıllı oyuncu taşıyıcıyı yükseltir) ATIL; bu bir model bulgusu

`m1` açıkken parmak izi tabanla **birebir aynı** (damga bunu ispat olarak arıyor). Sebep:
sim'in oyuncusu **görev hattını** takip ediyor (Tek Odak, B2) ve `trySpend`in serbest-oyun
bloğu hat bitmeden neredeyse hiç çalışmıyor. Yani "darboğaz olan kolu yükselt" kuralının
serbest oyundaki karşılığı, zincirin ölçülen kısmında **ölü kod**.

Sonuç: sim'de ekonominin temposunu belirleyen şey serbest oyun değil, **görev hattının
kendisidir.** Bir kaldıraç ancak hatta girerse ölçülebilir — `g1` bu yüzden hat üzerinden
kuruldu.

### Bulgu 6 — `g1` (taşıma tavanı) ölçütü İYİLEŞTİRMİYOR, bir dozda kötüleştiriyor (6 → 7)

Görev hattına eksik taşıyıcı kademeleri eklemek (tepsi 4 · tepsi 5 · hız 2,5) ihlali
düşürmüyor; ikinci dozda **artırıyor**. İki sebep birlikte: eklenen her görev yeni bir
**alım** demek, yani yeni bir bekleme penceresi; ve ₺2.500/₺5.000'lik kademelerin açtığı
taşıma tavanı o parayı geri ödemiyor.

Bu, `feedback_economy_throughput`'un "Kat 1'de throughput kolu tükendi" sınırının
**görev-hattı yolundan da** ölçülmüş hâli: geç oyun ₺/müşteriden büyür, taşıma tavanından değil.

> Yan bulgu (kayda geçsin): görev hattı `waiterTray` kademe **2**'de bitiyor, üçüncü kademe
> (₺2.500 → tepsi 4) hattın hiçbir yerinde yok — oysa `q_waiter3`ün kendi yorumu "arz tavana
> dayanınca darboğaz TAŞIMAYA geçer" diyor ve `simulate.ts`'in ÜÇ KOL tablosunun 20-masa satırı
> `waiterTray: 3` varsayıyor. **Zincir, tablonun varsaydığı kadroyu teslim etmiyor.** g1
> ölçümü bunu düzeltmenin tempoyu iyileştirmediğini gösterdi; ama tutarsızlık ayrı bir kalem
> (HUD/görev tarafı), tempo kalemi değil.

### Bulgu 7 — `b1` (basamak bölme) 4'ün altına inmiyor

Servis merdivenini 6 → 7/8/9 basamağa bölmek (L4+ toplam ₺ ve toplam çıktı korunarak) tek uzun
beklemeyi ikiye bölüyor ama **pad ihlallerine dokunmuyor**, ve merdivenin kendi boşluğu yok
olmuyor, yer değiştiriyor.

Ayrıca bugünkü şemanın bir sınırı ölçüm sırasında görüldü: çıktı çarpanı **basamak-başı değil
merdiven-geneli** (`outputMult`), o yüzden tavanı korumak için çarpan seyreltiliyor ve bu
**erken oyunu da** etkiliyor. Erken oyuna dokunmadan bölmek `outputMultByLevel` gibi bir alan
ister — ayrı kalem.

### Bulgu 8 — açılışın üç ölçütü DOKUZ kolun hiçbirinde değişmedi

`22 sn` · `1,6 dk` · `6,1 dk` — taban dâhil her satırda birebir aynı. C5 Bulgu 6'nın aynı
yapısal sebebi: bu ölçütler garsondan ÖNCEKİ pencereye ait, bu turun kollarının hepsi
garsondan SONRASINA dokunuyor. **D-079'un açılış hükmü bu turdan da etkilenmiyor.**

## §Karar

*(BOŞ — karar paketi kullanıcıya sunulacak; D-084 sıra kilidi gereği bu bölüm commit #1'de
boştur ve kullanıcının seçiminden sonra doldurulur.)*

---

## §Uygulama

*(karar sonrası)*
