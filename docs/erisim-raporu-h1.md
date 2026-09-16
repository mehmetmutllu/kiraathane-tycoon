# H1 raporu — masadan toplama · ocaktan alma · görev panı

**Tur:** H1 (Faz H) · **Damga:** 2026-09-16 · **Kural:** `docs/oturum-akisi-mantik.md` (D-084)
**Ham çıktı:** `docs/olcum-erisim-h1.txt` (TAM koşu · ızgara 0,02 br · 360 yön · damgalar temiz)
**Araç:** `tools/olcum-erisim-h1.ts`

## Soru

Kullanıcının 2026-09-09 oyun testinden kalan üç oynanış hatası (`docs/geribildirim-oyun-testi-2026-09-09.md`).
Üçü de "bazen oluyor bazen olmuyor" diliyle yazıldı; bu bir ölçü değil, bu yüzden hiçbiri
koda dokunulmadan önce **orana** çevrildi.

1. **G-01** — *"çay/bulaşık toplama masanın her tarafından olmuyor."*
2. **G-02** — *"çay ocağından alma güvenilmez (tepside yer varken)."*
3. **G-03** — *"2. masa görevinde kamera kendiliğinden kayıyor."*

Üçü de `tick.ts`e dokunuyor (G-01/G-02 tetik yarıçapları `economy.config.ts`te) → **varyant
kapısı**: hiçbir kol, o kolun sayı satırı §Bulgular'da olmadan uygulanmaz.

## Yöntem

**Taklit yok.** Yarıçaplar `economy.config.ts`ten, gövde yarıçapı ve katı engeller `layout.ts`in
kendi `activeSolids` / `hitsSolid` / `clampToOpenAreas` fonksiyonlarından okunur; araç ikinci bir
geometri yazmaz. Tek istisna kirli kabın saçılma genişliğidir — o sayı bugün `tick.ts` içinde düz
bir sabittir (`(Math.random() - 0.5) * 0.6`) ve dışarı verilmez, bu yüzden **kaynaktan regex ile**
okunur ve damgalanır.

**Erişilebilirlik gerçek.** "Katı yok + açık alan içi" bir hücreyi durak yapmaz; hücrenin
`LAYOUT.player`dan **yürünerek varılabilir** olması da gerekir (taşma-doldurma). Bu kat dar
açıklıklarla dolu (H3/D-098), yani "boş görünen ama girilemeyen cep" burada kuraldır. Ölçülen iki
dünyada da bağlı bileşen durulabilir alanın **%100'ü** çıktı — yani bu turda cep YOK, ama kontrol
aracın içinde kaldı.

**Paydanın adı: YANAŞIK YÖN.** "Oyuncunun durabildiği her yön" yanlış bir payda olurdu: sandalyenin
arkasında duran oyuncu masaya gelmiş sayılmaz, tetiğin orada ateşlememesi kusur değildir. Payda bu
yüzden oyuncunun **gövdesiyle objeye değebildiği** yönlerdir (durağın obje kutusuna mesafesi ≤ gövde
yarıçapı + bir hücre = 0,49 br). Kullanıcının *"masanın her tarafından"* dediği küme tam olarak budur.

**Kamera gerçek geçişi kullanır.** `__setQuest` tek başına pan ateşlemez: odak isteği tick'in
`gap → active` geçişinde doğar. Araç da tam o durumu kurar ve tick'in kendi geçişini koşturur.
İzdüşüm sahnenin **gerçek** `projectionMatrix × matrixWorldInverse` çarpımıdır, kare kare okunur.

### Ölçümün kendi üç kazası (yöntem notu)

Üçü de aracı kırdı, üçü de damgayla kapatıldı — not düşülüyor çünkü üçü de bir sonraki turda
tekrar çıkmaya hazır tuzaklar:

1. **Payda yanlıştı.** İlk sürüm "oyuncunun durabildiği HER yön"ü payda saydı ve masanın
   `M2 gereken r` sütununa `>2,40` yazdı — çünkü sandalyenin arkasında kalan yön hiçbir yarıçapla
   kapanmaz. Sayı doğruydu, sorusu yanlıştı. Payda yanaşık yöne çevrilince kol ayrıştı.
2. **Ölçülen pan, ölçülmek istenen pan değildi.** `hardReset` 0. görevin odağını KURARAK başlıyor;
   temizlenmediği için ön rulonun ilk karesi zaten odaklıydı ve üç görev de **aynı** hedefi, aynı
   uzaklığı (10,41 br) yazdı. Üç eşit satır uyarıydı. Şimdi odak sıfırlanıyor, sönmesi **damgayla**
   doğrulanıyor, ve ön rulo sabit süre değil KOŞUL (kamera gerçekten boşa düşene kadar bekler —
   sahne kendi reveal panlarını da ateşliyor).
3. **Görüş yarıçapı sekiz yönün sekizinde de 0 çıktı.** Sebebi aynı: kamera oyuncuya oturmadan
   ölçülüyordu, oyuncu ekranda olmayınca yanındaki nokta da olmuyordu. Şimdi ölçümden önce
   kameranın oyuncuya oturduğu, oyuncunun ekranda olduğu damgayla doğrulanıyor.

## §Bulgular

### G-01 — masadaki kirli kaba erişim

Payda: masaya **gövdesiyle yanaşılabilen** yön (360 yönden). Kap noktaları `tick.ts`in kendi
0,60 br'lik dağılımından 7 × 7 ızgara.

| kol | masa tipi | yanaşık yön | **yön%** | kör yön | **en kötü kap yön%** | gereken r | sızıntı |
|---|---|---|---|---|---|---|---|
| **M1 taban** (r = 1,40) | four (8 salon masası) | 231 / 360 | **42,2** | 0 | **23,8** | — | — |
| **M1 taban** (r = 1,40) | deuce (12 banket) | 201 / 360 | **95,5** | 0 | **79,1** | — | — |
| **M2 yarıçap** | four | 231 | 100 | 0 | 100 | **2,05** | **0 yön** |
| **M2 yarıçap** | deuce | 201 | 100 | 0 | 100 | **1,60** | **0 yön** |
| **M3 kutu** (pay 0,49) | four + deuce | 231 / 201 | 100 (tanım gereği) | 0 | 100 | — | **0 yön** |

Okuma:

- **Kullanıcı haklı ve sayı büyük.** Dörtlü çay masasına gövde gövdeye yanaştığın yönlerin
  yalnız **%42,2'sinde** kirli kap alınıyor. Kap kötü köşeye düşmüşse bu oran **%23,8** — yani
  masanın dört yanından üçünde eğilip bekliyorsun ve hiçbir şey olmuyor.
- **Hata masada değil, MASA TİPİNDE.** Banket masası (deuce, yarı 0,53) %95,5 ile neredeyse temiz;
  dörtlü masa (yarı 0,84) çöküyor. Sebep aritmetik: oyuncu masa kutusunun kenarından en az
  0,84 + 0,47 = **1,31 br** uzakta durabiliyor, kap ise merkezden 0,30 br **öteye** düşebiliyor →
  1,61 br > 1,40. Tetik yarıçapı masanın kendi boyundan küçük.
- **Kör yön = 0** — yani yön hiçbir zaman tamamen ölü değil, KABIN NEREYE DÜŞTÜĞÜNE bağlı.
  Şikâyetin "bazen" demesinin sebebi tam olarak bu: tetiği rastgele bir sayı seçiyor.
- **Genişletmenin bedeli ÖLÇÜLDÜ ve sıfır çıktı.** r = 2,05'te de, kutu tetiğinde de komşu masanın
  kabını yanlışlıkla toplayan **tek bir yön yok** (24 masanın 24'ünde 0). Yani "yarıçapı büyütürsek
  yanlış masadan toplar" korkusunun bu yerleşimde karşılığı yok.

### G-02 — ocaktan / tezgâhtan ürün alma

Payda: tezgâha gövdesiyle yanaşılabilen yön. "Ölü ön yüz" = tezgâhın uzun kenarı boyunca
oyuncunun yanaşabildiği hattın tetiklemeyen kaç br'si.

| kol | yer | yanaşık yön | **yön%** | kör yön | **ölü ön yüz** | canlı ön yüz | gereken r | yükseltme noktası |
|---|---|---|---|---|---|---|---|---|
| **O1 taban** (r = 1,60) | sol duvar (erken) | 183 | **57,4** | **78** | **0,72 br** | 2,50 br | — | — |
| **O1 taban** (r = 1,60) | arka bant (geç) | 123 | **85,4** | **18** | **0,72 br** | 2,50 br | — | — |
| **O2 yarıçap** | her ikisi | 183 / 123 | 100 | 0 | 0 | 3,22 | **2,20** | **yaşar** (3,93 / 3,62) |
| **O3 kutu** (pay 0,49) | her ikisi | 183 / 123 | 100 | 0 | 0 | 3,22 | — | **yaşar** |

Okuma:

- **Oyuncunun ilk tanıştığı ocak en kötüsü.** Sol duvar kurulumunda tezgâha değdiğin yönlerin
  **%42,6'sı ölü** (183'ün 78'i). Arka banda taşınınca düzeliyor (%14,6) — ama orası oyunun
  üçüncü bölümü; yeni oyuncu bozuk olanı görüyor.
- **Ölü bölge tezgâhın UÇLARINDA.** Tezgâhın önünde durulabilen 3,22 br'lik hattın **0,72 br'si**
  (%22,4) tetiklemiyor, üstelik iki kurulumda da aynı. Tetik tezgâhın **MERKEZİNDEN** ölçülüyor
  ama tezgâh 3,2 br uzunluğunda: uçta duran oyuncu merkeze 1,57–2,07 br uzakta kalıyor. Yani
  "semaverin tam önündeyim ama almıyor" — S24/D-120'nin (çizilen şekil ≠ tetik geometrisi)
  üçüncü nüshası.
- **Bedel ölçüldü, o da sıfır.** Genişletmenin bilinen tehlikesi `tick.ts`:1138 gardiyanıydı:
  oyuncu ocağın menzilindeyken servis **yükseltme** dolumu hiç başlamaz. Yükseltme noktası
  tezgâh merkezine **3,93 br** (erken) / **3,62 br** (geç) uzakta; gereken menzil 2,20. İki
  kolda da nokta **yaşıyor**.

### G-03 — görev panı

Görüş yarıçapı (oyuncunun etrafında ekranda duran daire, 8 yönde gerçek izdüşümle):
**en dar 4,25 br · en geniş 24,50 br**. Bu sayının altındaki her hedef, pan başlamadan önce
zaten ekrandadır — bu artık doğum yerine bağlı bir tesadüf değil, kuraldır.

| görev | pan | **hedef PAN ÖNCESİ ekranda** | hedef uzaklık | pan süresi | **oyuncu ekran dışı** |
|---|---|---|---|---|---|
| `q_serve1` | var | **EVET** | 10,41 br | 1,68 sn | **2,52 sn** |
| `q_coin` | var | **EVET** | 4,90 br | 1,70 sn | 1,03 sn |
| **`q_table2`** ← şikâyet | var | **EVET** | **3,62 br** | **1,49 sn** | 0,00 sn |
| `q_charTray1` | **yok** | — | — | — | 0,00 sn |
| `q_serve5` | var | **EVET** | 10,41 br | 1,75 sn | **2,58 sn** |
| `q_station1` | var | **EVET** | 12,71 br | 1,65 sn | **3,15 sn** |
| `q_wash` | var | **EVET** | 8,19 br | 1,57 sn | 1,74 sn |
| **toplam** | 6 / 7 | **6 / 6** | — | ~10,0 sn | **11,02 sn** |

Okuma:

- **Panın altı koşusunun altısında hedef zaten ekrandaydı.** Yani pan bir bilgi taşımıyor;
  taşıdığı tek şey hareket. Yönlendirme değil gürültü.
- **Kullanıcının işaret ettiği görev en masumu.** `q_table2`'nin hedefi **3,62 br** uzakta —
  en dar görüş yarıçapının (4,25) bile altında, yani kamera nereye dönük olursa olsun görünüyor.
  Buna rağmen kamera 1,49 sn kayıyor. Şikâyetin sebebi "hedefi kaçırmak" değil, **hiçbir şey
  kazandırmayan bir hareket**.
- **Asıl zarar başka görevlerde.** `q_station1`'de oyuncu **3,15 sn** ekran dışında kalıyor,
  `q_serve5`'te 2,58, `q_serve1`'de 2,52. Erken zincirin toplamı **11,02 sn** boyunca oyuncu
  kendi karakterini göremiyor. Kullanıcı bunu henüz yazmadı; sayı yazdı.
- **Bir kol zaten doğru davranıyor:** `q_charTray1` (charStat) pan atmıyor — tick'te ismiyle
  yazılmış bir istisna. Yani "pan atmama" kodda zaten var olan bir hâl, yeni bir kavram değil.

## §Karar

*(BOŞ — karar paketi kullanıcıya sunulacak, D-084 adım 3.)*

## §Uygulama

*(BOŞ — yalnız kararın kolu, D-084 adım 4.)*
