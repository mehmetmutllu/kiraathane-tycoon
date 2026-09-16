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
| **M3 kutu** (yanaşma payı 0,49) | four + deuce | 231 / 201 | 100 (tanım gereği) | 0 | 100 | — | **0 yön** |

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
| **O3 kutu** (yanaşma payı 0,49) | her ikisi | 183 / 123 | 100 | 0 | 0 | 3,22 | — | **yaşar** |

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

### §PAY — kutu tetiğinin payı (M3/O3'ün uygulama parametresi)

M3/O3 satırlarındaki 0,49, "gövdeyle değebiliyor mu" sınavının payıdır; UYGULANACAK pay ayrı bir
sorudur ve ayrı süpürüldü. Payda burada daha geniş: objeye doğru yürüyüp 0,90 br içinde durabilen
**her** yön (sandalye arkası duraklar dahil), yani kapsama kasten zor bir sınav.

| pay (br) | masa kapsama% | masa sızıntı | tezgâh kapsama% | tezgâh sızıntı |
|---|---|---|---|---|
| 0,45 | 0,0 | 0 | 0,0 | 0 |
| 0,50 | 72,4 | 0 | 85,6 | 0 |
| 0,55 | 83,6 | 0 | 91,1 | 0 |
| 0,60 | 89,6 | 0 | 93,8 | 0 |
| 0,65 | 96,5 | 0 | 96,6 | 0 |
| **0,70 ← seçildi** | **99,2** | **0** | **97,9** | **0** |
| 0,80 | 99,5 | 0 | 99,3 | 0 |
| 0,90 | 100,0 | 0 | 100,0 | 0 |

- **0,45 satırı aracın kendi kontrolüdür:** gövde standoff'u 0,47, yani payı onun altına indirince
  hiçbir şey tetiklenmez. Sıfır çıkması taramanın doğru çalıştığını söylüyor.
- **Sızıntı penceresi 0,90'a kadar açık.** Yani seçim bir takas değil: pay kapsamanın bittiği yerde
  durdurulabiliyor, komşuya karışma hiçbir değerde başlamıyor.
- Kalan ~%1 (0,70'te) sandalyenin arkasında kalan duraklar — onların tetiklememesi kusur değil tanım.

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

## §Karar — D-123

Kullanıcı üç soruda da ölçümün önerdiği kolu seçti: **M3 + O3 + K2.**

| kol | seçilen | seçmenin gerekçesi (sayı) | elenen |
|---|---|---|---|
| G-01 | **M3** — tetik masanın gövdesinden | yön% 42,2 → 100 · en kötü kap 23,8 → 100 · sızıntı 0 | M2 (r 2,05): delik kapanır ama tetiği hâlâ `Math.random()` besler |
| G-02 | **O3** — tetik tezgâhın gövdesinden | ölü ön yüz 0,72 → 0 br · yükseltme noktası yaşar | O2 (r 2,20): merkeze bağlı kalır, tezgâh uzarsa uçlar yine ölür |
| G-03 | **K2** — hedef ekrandaysa pan yok | 6 pan → 0 · ekran dışı 11,02 sn → 0,00 sn | K3 (pan tamamen kalksın): uzak hedefte tek yönlendirme giderdi · K4 (süre kısalt): sebep durur |

Üç kol tek bir ilkenin üç nüshası: **tetik, ÇİZİLEN ŞEYİN kendisinden türer.** S24'te (D-120/D-121)
bu yükseltme işareti için yapılmıştı; H1 aynı ilkeyi kirli kaba, tezgâha ve kameraya taşıyor.
Kamerada "çizilen şey" görüntünün kendisidir — bu yüzden kapı mesafe eşiğiyle değil gerçek
izdüşümle kuruldu.

## §Uygulama

**Pay değeri tahminle seçilmedi.** Kutu tetiğinin payı ayrı bir süpürmeyle ölçüldü (§PAY,
`docs/olcum-erisim-h1.txt`): 0,45'te hiçbir şey tetiklenmiyor (gövde standoff'u 0,47), 0,70'te
masa kapsaması **%99,2**, tezgâh **%97,9**, ve **0,90'a kadar sızıntı 0**. Kalan ~%1 sandalyenin
arkasında kalan duraklar — onların tetiklememesi kusur değil tanım.

İkinci, bağımsız kaynak aynı sayıyı verdi: yerleşimin kendi `ServicePlace.pickup` noktası (garsonun
çay aldığı yer) tezgâh gövdesine tam **0,70 br** uzakta. Önce 0,60 denendi ve o noktayı dışarıda
bıraktı; `logic.test.ts` yakaladı. Oyuncunun tetiği mekânın kendi durak noktasından dar olamaz.

| dosya | ne yapıldı |
|---|---|
| `economy.config.ts` | `serving.pickupRadius` → **`pickupReach: 0,70`** · yeni **`cups.collectReach: 0,70`**. `cups.collectRadius` kaldı ama anlamı değişti: artık PERSONELİN varış mesafesi. |
| `layout.ts` | `boxDist2D` (noktanın kutuya mesafesi) · `atTableBody` · `atServiceBody` · `tableHalfFor` dışa açıldı. Tetik geometrisi collision geometrisiyle AYNI `Solid`'i okuyor. |
| `tick.ts` | üç çağrı yerinde: ürün alma · yükseltme gardiyanı · kirli toplama. Alma ile gardiyan **aynı yüklemi** çağırıyor (ayrışamazlar). |
| `cameraView.ts` (yeni) | sahne yazar / tick okur tekili (`dwellState` deseni, D-038). `hedefEkranda` gerçek `projection × matrixWorldInverse` ile çalışır. Kamera yoksa **false** → H1 öncesi davranış (vitest/sim deterministik kalır). |
| `Scene.tsx` | `CameraRig` her karede, kamera yerleştikten sonra matrisi yazar. |
| `tick.ts` `requestFocus` | kapı: `if (hedefEkranda(pos)) return;` — **öncelikten bağımsız** (alan açılışı dahil). HUD'un "hedefi göster" düğmesi (`store.focusQuest`) kapıdan GEÇMEZ: orada panı oyuncu istemiştir. |

**Yarıçap modeline yazılmış 10 değişmez** silinmedi, gövde modeline çevrildi (`logic.test.ts`,
`layout-b31.test.ts`): "park noktası tetiğin dışında", "yükseltme noktası menzilin dışında",
"hiçbir masa al+servis birleşiğinde değil" hepsi artık kutudan ölçülüyor. Üç bardak-döngüsü
fikstürü de düzeltildi: oyuncuyu salonun ortasındaki `[1, 1]` noktasına koyup kaba `tableIndex: 0`
etiketi veriyorlardı — ikisi birbirini tutmuyordu, eski nokta-tetiği bunu göremediği için sorun
çıkmamıştı.

### Bekçi ve mutasyon

`tests/erisim-h1.test.ts` (16 denetim) · `tools/mutasyon-erisim-h1.mjs` (16 mutasyon) →
**16/16 kırmızı, kaçan 0.**

Bir mutasyon ilk turda KAÇTI ve kaçması bir şey öğretti: `M15 görüş testi derinliği yok sayıyor`.
Tarandı — bugünkü kamera ankrajında (8,5 br yukarıdan ~45°) **y = 0,6 düzleminde** kameranın
arkasında kalıp x/y sınavını geçen **tek bir nokta yok** (160 × 160 br). Yani derinlik satırı zemin
hedefleri için ölüydü. Ama `hedefEkranda` yükseklik alıyor ve kamera kipleri mesafeyi değiştiriyor:
y yükselince taban kipte **3.773**, portrede **862** nokta "ekranda" sanılıyor. Kat 3 çatı terası gibi
yükseltilmiş bir hedef geldiğinde kapı sessizce ters çalışırdı. Denetim 16 o sınırı tutuyor.

### Final tam koşu (uygulamadan sonra)

`docs/olcum-erisim-h1.txt` · damgalar temiz · vitest **1170 ✓** · duman **45/45 ✓** · tsc temiz.

| | önce | sonra |
|---|---|---|
| görev panı (7 görevlik erken zincir) | 6 pan · 6'sı gereksiz | **0 pan** |
| oyuncunun ekran dışı kaldığı süre | 11,02 sn | **0,00 sn** |
| masa tetiği kapsaması (pay 0,70) | — | **%99,2** · sızıntı 0 |
| tezgâh tetiği kapsaması (pay 0,70) | — | **%97,9** · sızıntı 0 |

G-01/G-02 tablolarındaki M1/O1 satırları **taban ölçümüdür** (H1 öncesi yarıçaplar araç içinde
damgalı sabit olarak duruyor) — "önce" sütunu sonradan kaymasın diye.
