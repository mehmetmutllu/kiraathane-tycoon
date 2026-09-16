# R3 — HUD ÇERÇEVELERİ RAPORU (ölçüm)

**Soru:** Üst şeridin seviye rozeti ile kesesi, ödül ekranının iki ödülü ve ayarlar
kaydırıcısının çerçevesi ekranda GERÇEKTE nasıl çiziliyor — kesik nerede, hangi kutu hangi
kutudan taşıyor, kaç satır kaplıyor?

**Kapsam:** kullanıcının 2026-09-16 geri bildiriminden G-45 · G-46 · G-47 · G-48 · G-49
(`docs/geribildirim-oyun-testi-2026-09-16.md`). Beşi de ARAYÜZ; denge dosyalarına
(`economy.config.ts` / `tick.ts` / `rules.ts`) dokunmuyor.

**Araç:** `tools/olcum-hud-r3.mjs` · **ham çıktı:** `docs/olcum-hud-r3.txt` + `docs/olcum-hud-r3.json`
**Aday kareleri:** `tools/shot-hud-r3.mjs` → `docs/gorsel/ss/r3-aday-*.png`
**Kollar SAYFAYA enjekte edildi** (CSS/DOM); uygulama kaynağı ölçüm sırasında değişmedi.

---

## §0 — ÖLÇÜMDEN ÖNCE: KAYNAKTA BULUNAN ÜÇ KÖK SEBEP

### ① Kaydırıcının "çerçevesi" bir çerçeve değil, bir L (G-45)

`src/index.css` · `.setting-slider`:

```css
.setting-slider {
  padding: 8px 4px 10px 14px;
  border-bottom: 1.5px solid var(--oyuk);
  border-left: 3px solid var(--oyuk);
  margin-left: 4px;
}
```

Üç ayrı karar aynı anda "kesik" üretiyor:

1. **İki kenar var, dördü değil.** Sol ve alt çizilir; üst ve sağ yok. Kapanmayan bir dikdörtgen
   gözde "çerçeve" değil "kırık çerçeve" olarak okunur.
2. **İki kenarın kalınlığı farklı** (3 px ↔ 1,5 px) ve aynı rengi taşıyorlar. Aynı çerçevenin iki
   bacağı üç kat farklı ağırlıkta.
3. **`margin-left: 4px` köşeyi fiziken imkânsız kılıyor.** Üstteki ve alttaki yatay ayıraçlar
   (`.setting-row`'un `border-bottom`'ı) panelin tam genişliğinde; kaydırıcının sol çizgisi ise
   4 px içeride başlıyor. İki çizgi hiçbir noktada buluşmuyor.

Topuzun yatağa sığıp sığmadığı ise **kaynaktan okunamıyor**:

```css
.setting-slider input[type='range'] { height: 22px; }
.setting-slider input[type='range']::-webkit-slider-thumb { width: 20px; height: 20px; border: 2.5px solid var(--ot); }
```

20 + 2 × 2,5 = 25 px hesabı `border-box` kuralında yanlış olur, ve `* { box-sizing: border-box }`
sözde-öğeyi kapsamaz — hangi kutu modelinin geçerli olduğu ancak ÇİZİLENDEN okunur. §Bulgular
bu yüzden topuzun iç ve dış çapını ayrı ayrı piksellerden ölçüyor.

### ② İki ödül "yan yana" değil, AYNI METİN AKIŞINDA (G-47)

`HUD.tsx` · `RewardModal`:

```tsx
<div className="reward-amount">
  {bonus > 0 && (<><CoinIcon size={30} /> {yuzde(bonus)} kalıcı gelir</>)}
  {diamonds > 0 && (<><GemIcon size={30} /> +{diamonds}</>)}
</div>
```

İki ödül **ayrı eleman değil**. `.reward-amount`ın doğrudan çocukları: `svg`, metin düğümü,
`svg`, metin düğümü. Bu, kullanıcının isteğini bir CSS satırı olmaktan çıkarıyor:
`flex-direction: column` ödülleri alt alta koymaz, **her parçayı** alt alta koyar. "Alt alta +
aralarında `+`" istemek, önce ödülleri sarmalamak demek. Ölçüm bu yüzden çocukları `Range` ile
ölçüyor ve C1 kolu CSS'ten önce DOM'u yeniden kuruyor.

### ③ Rozetin barı madalyondan ayrı bir kutu (G-48) · kese bilerek kutusuz (G-49)

`hud.css`:

```css
.rep { flex-direction: column; gap: 3px; }      /* madalyon ÜSTTE, çubuk ALTINDA */
.rep-bar { width: 50px; height: 10px; border: 2.5px solid var(--ot); }
```

Çubuk madalyonun **altında** ve **ondan dar**; ikisi iki ayrı kutu. Kullanıcının istediği Clash
of Clans kalıbı ise tek parçadır: ilerleme madalyonun çevresine sarılı.

Kese (`.purse`) ise **bilerek** kutusuz: D-106 kutuyu kaldırmış ve okunabilirliği yazı konturuna
bırakmıştı (kullanıcının o günkü cümlesi: *"veriler bar içinde değil, direk oyun üstünde
olsun"*). G-49 bu kararı **geri alıyor**. Rapor bu yüzden kutunun estetiğini değil, D-106'nın
dayandığı sayıyı ölçüyor: yazının altındaki zemin ne kadar oynuyor.

---

## §Bulgular

Tam koşu · damga `2026-09-16T21:23:48.965Z` · telefon (390×844 @3×) + masaüstü (1280×800 @2×) ·
hata 0. İki kadraj **bütün satırlarda** birbirini doğruluyor; aşağıda farklı çıkan yerler ayrıca
belirtildi.

### 1) Kaydırıcının çerçevesi çizilmiyor değil — DÖRT KENARIN İKİSİ HİÇ YOK (G-45)

| kol | kenar (sol/alt/üst/sağ) | kapalı kenar | çizilen sol çizgi | satıra oran | **üst köşe açıklığı** | **sol hizasızlık** | satır boyu |
|---|---|---|---|---|---|---|---|
| **T (bugün)** | **3,0 / 1,0 / 0 / 0** | **2** | 45,00 | 1,000 | **4,00** | **4,00** | 45,0 |
| A1 topuz sığsın | 3,0 / 1,0 / 0 / 0 | 2 | 51,00 | 1,000 | 4,00 | 4,00 | **51,0** |
| A2 kapalı çerçeve | 2,0 / 2,0 / 2,0 / 2,0 | **4** | 21,33 | 0,464 | 20,33 | 4,00 | 46,0 |
| A3 hizalı L | 1,0 / 1,0 / 0 / 0 | 2 | 45,00 | 1,000 | 4,00 | **0,00** | 45,0 |
| **A4 hizalı + bitişik L** | 1,0 / 1,0 / 0 / 0 | 2 | 50,00 | 1,020 | **−1,00** | **0,00** | 49,0 |

Üç şey ölçüldü ve üçü de kullanıcının "kesik yerler" cümlesini farklı bir yerden karşılıyor:

- **Çizgi kesik DEĞİL.** Taban kolunda sol çizginin çizilen boyu 45,00 px ve satır da 45,0 px —
  oran tam 1,000. Yani sorun çizginin kısalığı değil.
- **Kesik olan KÖŞE.** Sol çizgi, üstündeki yatay ayıraçtan hem yatayda 4,00 px içeride
  başlıyor (`margin-left: 4px`) hem dikeyde 4,00 px aşağıda. İki çizgi hiçbir noktada
  buluşmuyor — göz bunu "kırık çerçeve" olarak okuyor.
- **Dikey açıklığın kaynağı kaydırıcı değil PANEL.** A3 yatay hizayı kapattı (4,00 → 0,00) ama
  üst köşe 4,00'te kaldı. Sebep `.sheet-pad`in `display: flex; gap: 4px` kuralı: ayarlar
  ekranındaki HER satırın arasında 4 px hava var. Açıklığın yarısı kaydırıcının kuralı değil.
  A4 (`margin-top: -4px`) ikisini birden kapatıyor: üst köşe **−1,00** (çizgi ayıracın üstüne
  biniyor, yani köşe kapanıyor).

**A1 ÖLÇÜLDÜ VE ELENDİ.** "Topuz yatağa sığmıyor" hipotezi yanlış çıktı: topuzun çizilen dış
çapı **20,0 px**, yatak **22,0 px** — topuz zaten 2,0 px boşlukla sığıyor. A1 satırı 45 → 51 px
büyütüp (+%13) var olmayan bir sorunu çözüyor. §0'da kaynaktan çıkarılan "25 px" hesabı
`border-box` yüzünden yanlıştı; sayı ancak çizilenden okununca doğruyu söyledi.

**A2'nin 0,464 oranı bir kusur DEĞİL, ölçütün sınırı.** Kapalı çerçevede köşeler yuvarlak
(`border-radius`), dolayısıyla tek bir kesintisiz dikey koşu satırın tamamını kaplayamaz. A2'nin
doğru sayısı `kapalı kenar = 4`; "çizgi satırı kaplıyor mu" ölçütü yalnız L biçimi için anlamlı.

### 2) FPS katmanı ekranı kaplamıyor ama PANELİN ÜSTÜNE BİNİYOR (G-46)

| kadraj | sahne | kutu | alan | ekran % | **katmanın ALTINDA kalan** |
|---|---|---|---|---|---|
| telefon | oyun | 75,4 × 56,6 @12,96 | 4.268 px² | 1,30 | hud, **joystick** |
| telefon | **ayarlar** | 75,4 × 56,6 @12,96 | 4.268 px² | 1,30 | hud, menu, **setting-row, setting-slider**, joystick |
| masaüstü | oyun | 75,4 × 56,6 @12,96 | 4.268 px² | 0,42 | hud, joystick |
| masaüstü | ayarlar | 75,4 × 56,6 @12,96 | 4.268 px² | 0,42 | hud, menu, joystick |

Katmanın kapladığı alan küçük (telefonda ekranın %1,30'u). Asıl bulgu çakışma satırında:
**katman ayarlar panelinin içeriğinin üstüne biniyor** ve telefonda tam olarak "Ses seviyesi"
kaydırıcısının üstünü örtüyor. Bu ölçümün kendi kazasıyla ortaya çıktı — §A üç koşu boyunca o
satırın sol çizgisini 18,00 px / oran 0,400 diye ölçtü, oysa çizgi 45,00 px'ti; **üstü örtülüydü**
(`ss/r3-fps-ayarlar.png`). Katman ayrıca her iki kadrajda **joystick'in** üstünde duruyor.

**"Kaldır"ın kapsamı iki koldur ve farkları ölçülmedi, SAYILDI:**

- **B1 — yalnız katman gider** (`FpsOverlay` çizilmez): ekrandan 4.268 px² ve dört çakışma kalemi
  gider. Ayarlar ekranındaki "FPS Sayacı" anahtarı KALIR, `settings.showFps` alanı kalır.
- **B2 — katman + anahtar + alan gider:** ayarlar ekranı bir satır kısalır. Bedeli kayıt
  şemasında: `showFps` bugün `save.ts`de **üç ayrı yorumda emsal olarak anılıyor** ("ADDITIVE
  alan → saveVersion ARTMADI (`showFps` emsali)"). Alan silinirse o üç yorum var olmayan bir
  alana atıf yapar. Şema sürümü artmaz (`ayarlariBirlestir` bilinen alanları tek tek seçiyor,
  eski kayıttaki fazla alan sessizce düşer) — yani **kayıt güvenliği açısından bedel yok**,
  bedel yalnız belgelerde.

### 3) İki ödül "yan yana" durmuyor — TEK METİN AKIŞINDA akıyor (G-47)

| kadraj | kol | çocuk | dizilim | satır (w×h) | kart iç eni | satır/iç en | en büyük açıklık | görsel satır | "+" var mı |
|---|---|---|---|---|---|---|---|---|---|
| telefon | **T** | **6** | row | 266,0 × 70,0 | 272,0 | **0,980** | 9,58 | 1,00 | hayır |
| telefon | C1 | 3 | column | 266,0 × **92,0** | 272,0 | 0,980 | 0,00 | **2,63** | **EVET** |
| masaüstü | T | 6 | row | 274,0 × 70,0 | 280,0 | **0,980** | 12,74 | 1,00 | hayır |
| masaüstü | C1 | 3 | column | 274,0 × 92,0 | 280,0 | 0,980 | 0,00 | 2,63 | EVET |

Taban kolunun çocuk dökümü, §0'daki kök sebebi sayıya çeviriyor:

```
svg@62+21,6 · metin"+%0,4"@93,2+88,3 · metin"kalıcı gelir"@144,4+109,5 ·
svg@263,5+21,6 · metin"+"@294,1+18,1 · metin"3"@312,2+15,8
```

Altı çocuk, ikisi ödül değil: ödüller **ayrı eleman değil**. İki sayı:

- **Satır, kartın iç eninin %98'ini dolduruyor** (266,0 / 272,0). Yani bugünkü dizilime kalan
  pay **6,0 px**; ödül metni bir hane büyüse satır taşar. Bu, "kötü duruyor"un ölçülebilir
  karşılığı: satırda nefes payı yok.
- **İki ödülün arasındaki en büyük açıklık 9,58 px** (masaüstünde 12,74). Ödülü ödülden ayıran
  boşluk, bir ödülün kendi parçalarını ayıran boşlukla (9,0 px `gap`) neredeyse aynı — göz iki
  ödülü tek bir uzun cümle olarak okuyor.

C1 kolu satırı **70 → 92 px** büyütüyor (+%31) ve satır sayısını 1,00 → 2,63 yapıyor; en büyük
açıklık 0,00'a düşüyor (ödüller artık kendi satırlarında, aralarında yalnız "+" var). Genişlik
değişmiyor (266,0), çünkü birinci ödülün kendi metni ("🪙 +%0,4 kalıcı gelir") zaten 263,7 px.

### 4) Seviye rozeti: iki ayrı kutu, ve üst şerit ÜÇ SATIRA yayılmış (G-48)

| kol | madalyon | ilerleme | aray | rozet boyu | **üst şerit boyu** | **satır** | yol boyu | dolu yay | bar kalınlığı |
|---|---|---|---|---|---|---|---|---|---|
| **T (bugün)** | 56,0 × 56,0 | düz 50,0 × 10,0 | 3,0 | 69,0 | **69,0** | **3** | 50,0 | 12,4 | 10,0 |
| D1 halka | 56,0 × 56,0 | halka ç66,0 | — | 56,0 | 64,0 | 2 | _(açık)_ | _(açık)_ | _(açık)_ |
| D2 tek satır | 56,0 × 56,0 | düz 50,0 × 10,0 | — | 56,0 | **56,0** | **1** | 50,0 | 12,4 | 10,0 |
| **D3 = D1 + D2** | 56,0 × 56,0 | halka ç66,0 | — | 56,0 | **56,0** | **1** | _(açık)_ | _(açık)_ | _(açık)_ |

(İki kadrajda birebir aynı — üst şerit sabit ölçülü.)

Kullanıcının cümlesi iki ayrı şey istiyor ve ikisi de ayrı ayrı ölçüldü:

- ***"bar ve yuvarlak birleşik olmalı"*** → bugün madalyonla çubuk arasında **3,0 px boşluk**
  var ve çubuk madalyondan **dar** (50,0 ↔ 56,0). Halka kolunda boşluk kavramı ortadan kalkıyor,
  ilerleme madalyonun kendi çevresine biniyor.
- ***"en üst satırda yan yana olmalı"*** → bugün üst şerit **3 ayrı y-merkezine** yayılmış
  (madalyon · çubuk · para bir hizada değil, elmas ayrı satırda) ve **69,0 px** yer kaplıyor.
  Tek satıra alındığında 56,0 px'e iniyor (**−%18,8**).

Bugünkü çubuğun iç yüksekliği: 10,0 px'in 2,5 px'i kontura gittiği için **5 px**. Bir seviye
atlamasının hareketi bu yatakta neredeyse görünmüyor — %27,1'lik ilerleme 50,0 px'lik yolda
**12,4 px** olarak çiziliyor.

> **AÇIK KALDI — halkanın ÇİZİLEN kalınlığı ve yol uzunluğu.** Bu satırlar bilerek boş: üç ayrı
> ölçüm denemesi üç ayrı yanlış sayı verdi (CSS değişkeninden 6,0 · sütun taramasıyla 54,0 ·
> genişletilmiş kırpmayla 70,7) ve doğrulanmış bir değer henüz yok. Halkanın kendi amber
> renginden ölçen sürüm koşuyor. **Karar için gerekli değil:** §D'nin kararı "birleşik mi, tek
> satır mı" sorusudur ve onu yukarıdaki dört satır zaten kapatıyor; halka kalınlığı seçilen
> adayın UYGULAMA ölçüsüdür, commit #2'de kesinleşir.

### 5) Kese: çerçevenin ölçülebilir işi, zemini SABİTLEMEK (G-49)

| kadraj | kol | para kutusu | çerçeve | sahne sapma | **yatak sapma** | **geçirme** |
|---|---|---|---|---|---|---|
| telefon | **T (kutusuz)** | 72,4 × 34,0 | **0,0** | 5,80 | 5,68 | **0,979** |
| telefon | E1 hap çerçeve | 92,4 × 44,0 | 2,0 | 5,17 | **1,64** | **0,317** |
| masaüstü | T (kutusuz) | 72,4 × 34,0 | 0,0 | 14,54 | 14,53 | **0,999** |
| masaüstü | E1 hap çerçeve | 92,4 × 44,0 | 2,0 | 14,63 | **4,27** | **0,292** |

*Sapma* = kesenin arkasındaki bölgede her pikselin, oyuncu altı durakta yürütülürken ölçülen
standart sapmasının ortalaması. *Geçirme* = yatak sapması / sahne sapması.

Bu tablo D-106'yı çürütmüyor, **fiyatını yazıyor**:

- **Kutusuz kolda geçirme 0,979 ve 0,999** — yani yazının altındaki zemin, sahnenin
  oynamasını neredeyse **bire bir** üstleniyor. Okunabilirliği gerçekten yalnız kontur taşıyor;
  zemin hiçbir şey sabitlemiyor. Bu, D-106'nın bilerek aldığı riskin sayısı.
- **Hap çerçevede geçirme 0,317 ve 0,292** — çerçeve oynamanın yaklaşık **üçte ikisini**
  sönümlüyor (hap %82 mat olduğu için sıfırlamıyor; tam mat bir dolgu 0,00'a indirirdi).
- Bedeli yer: para kutusu **72,4 × 34,0 → 92,4 × 44,0** (+%27,6 en, +%29,4 boy).

Masaüstünde sahne sapması telefonun **2,5 katı** (14,54 ↔ 5,80): geniş kadrajda kesenin arkasına
daha çok hareketli sahne giriyor. Yani çerçevenin kazancı masaüstünde daha büyük.

### 6) Ölçümün kendi bulgusu: `.sheet-pad` bütün ayar satırlarını 4 px ayırıyor

A3 ile A4 arasındaki fark tek bir kuralı açığa çıkardı: ayarlar ekranındaki satırlar arasındaki
4 px'lik açıklık satırların kendi kuralı değil, kabın (`.sheet-pad`, `display: flex; gap: 4px`).
Bu yüzden ayıraç çizgileriyle satır kenarları **hiçbir satırda** hizalı değil — kusur yalnız
kaydırıcıda göze çarpıyor, çünkü orada dikey bir çizgi o açıklığı görünür kılıyor.

---

## §Karar

_(BOŞ — adım 3'te kullanıcı seçer; bu commit karar taşımaz)_
