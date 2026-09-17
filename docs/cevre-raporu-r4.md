# Çevre sanatı raporu — R4 (G-50)

**Soru:** kullanıcının *"zemin ve duvarlar hep ve yan taraflar hep böyle daha yapılmamış asset
gibi hissettiriyor"* cümlesi ekranda HANGİ yüzeyden geliyor, o yüzey karenin yüzde kaçı, ve
ne kadar düz?

**Araç:** `tools/olcum-cevre-r4.mjs` (ölçüm) · `tools/shot-cevre-r4.mjs` (aday kareleri)
**Ham çıktı:** `docs/olcum-cevre-r4.txt` — **TAM KOŞU** · 18 kare · 80×80 = 6.400 ışın/kare
**Kareler:** `docs/gorsel/ss/r4-taban-*.png` (taban) · `docs/gorsel/ss/r4-aday-*.png` (12 aday)

---

## Yöntem — ve aracın kendi sınaması

Ekranın kendisi örneklenir, sahne grafı değil. Gerçek oyun kamerasından bir ışın ızgarası
atılır; her ışının vurduğu nesne biçimine göre sınıflanır, vurmayan ışın BOŞLUK sayılır. **Aynı
karenin gerçek pikselleri** `readPixels` ile okunur ve her ışının pikseli kendi kovasına yazılır
— böylece "düz mü" sorusu kanaat değil sayı olur.

Işın ızgarası ile piksel ızgarası aynı noktayı göstermiyorsa bütün düzlük tablosu SESSİZCE
yanlış olurdu (zemin kovasına duvarın pikselleri yazılır, sayı yine "makul" görünür). Bu yüzden
her sayfada önce **hiza sınaması** koşuyor: arka plan saf kırmızı yapılır, sonra ekranda kırmızı
piksel ancak boşluk ışınının yerinde olabilir.

| sayfa | boşluk ışını kırmızı | dolu ışın kırmızı DEĞİL |
|---|---|---|
| yatay/açılış | **%100,0** (706/706) | %98,9 (884/894) |
| yatay/tam | **%100,0** (604/604) | %100,0 (996/996) |
| portre/açılış | **%100,0** (547/547) | %99,8 (1051/1053) |
| portre/tam | **%100,0** (493/493) | %100,0 (1107/1107) |

Kalan %1,1'lik pay siluet kenarındaki kenar-yumuşatma pikselleri (sınama 110° fov ile zorlanıyor).

**Araç yolda üç kez kendini çürüttü** ve üçü de rapora sayı girmeden düzeltildi:

1. **Duvarlar `InstancedMesh`.** Gövde `matrixWorld`den okununca duvar 1,0 br'lik BEYAZ bir
   kutu görünüyordu; karenin %15,3'ü "İÇERİK" kovasına düşmüş, DUVAR payı sahte biçimde %1,5
   okunmuştu. Rengi malzemede değil `instanceColor`da, gövdesi instans matrisinde.
2. **Tek eşikli kabuk kuralı yetmedi.** "Gövde ≥ 8 br = kabuk" hem 2,2'lik ara duvarı dışarıda
   bırakıyor hem 7,5'lik banket minderini içeri alıyordu. Kural artık BİÇİM soruyor:
   duvar = dik yüzeyli · boy ≥ 2,0 · yatayda ince levha.
3. **Fark eşiği ölçtüğü şeyden büyüktü.** Aday etki tablosu 24 kanal-toplamı eşiğiyle koşunca
   Z3'ü (±%6 ton yaması) "%0,3 — etkisiz" diye okudu; oysa o kolun kendi genliği tam 24 ediyor.
   Eşik 10'a indi. *Eşik ölçtüğü şeyden büyük olursa ölçüm "etkisiz" der ve bu bir bulgu sanılır.*

---

## §Bulgular

### §A — Piksel bütçesi: karenin yüzde kaçı hangi yüzey?

18 kare (2 kadraj × 2 durum × 4-5 konum), kare başına 6.400 ışın.

| sınıf | ortalama | en yüksek kare |
|---|---|---|
| **ZEMİN** | **%59,6** | **%82,8** (portre · açılış · −8,5 / 8) |
| İÇERİK (mobilya · aktör · mutfak) | %25,5 | %46,2 |
| **DUVAR** | **%8,0** | **%18,5** (yatay · açılış · −14 / 3) |
| **BOŞLUK — ufuk ALTI** | **%4,2** | **%20,0** (yatay · açılış · −14 / 3) |
| SOKAK | %2,6 | %20,7 (portre · açılış · kapı önü −4 / 14) |
| TAVAN | %0,0 | %0,0 |
| **BOŞLUK — ufuk ÜSTÜ** | **%0,0** | **%0,0 (18 karenin hiçbirinde)** |

**İlk bulgu: şikâyetin ağırlık merkezi zemindir.** Zemin tek başına karenin ortalama %59,6'sı;
duvar onun yedide biri. Kullanıcı üç şeyi birlikte saydı ("zemin ve duvarlar ve yan taraflar")
ama ekranda üçü eşit değil — duvarı mükemmelleştirmek karenin %8'ini, zemini düzeltmek %59,6'sını
oynatır.

**İkinci bulgu: GÖKYÜZÜ HİÇ GÖRÜNMÜYOR.** Ufuk üstü boşluk 18 karenin 18'inde tam %0,0. Kamera
oyuncuya 45°'den bakıyor ve kadrajın tamamı ufkun altında kalıyor.

### §B — Düzlük: "düz renk okunuyor" kaç ediyor?

Aynı kareden okunan gerçek pikseller. Sapma = parlaklık standart sapması (0-255).

| kova | ort. pay | sapma | ayrık renk |
|---|---|---|---|
| ZEMİN `#b98a5a` (alan kaplaması 18,1) | %51,3 | **6,25** | 36 |
| ZEMİN `#b98a5a` (alan kaplaması 17,5) | %41,5 | **7,61** | 77 |
| ZEMİN `#b98a5a` (alan kaplaması 35,1) | %22,7 | **8,19** | 44 |
| ZEMİN `#b98a5a` (taban düzlemi 35,2) | %11,0 | **1,39** | **11** |
| DUVAR `#e6d7b8` (18,0) | %11,8 | **7,02** | **10** |
| DUVAR `#e6d7b8` (35,0) | %4,7 | 9,75 | 10 |
| DUVAR `#e6d7b8` (10,8) | %2,7 | **3,04** | **7** |
| BOŞLUK (ufuk altı) | %5,9 | 2,99 | 4 |
| — karşılaştırma: mutfak tezgâhı (gltf) | %5,6 | **36,78** | **372** |
| — karşılaştırma: aktör gövdesi (gltf) | %1,9 | **34,88** | **208** |
| — karşılaştırma: aktör (gltf, 0,7) | %2,0 | **39,32** | **144** |

**Üçüncü bulgu — ve turun asıl cümlesi:** aynı karede yan yana duran iki şeyin bilgi yoğunluğu
**5-6 kat** farklı. Oyuncunun baktığı mobilya ve karakterler 144-372 ayrık renk taşıyor; onların
üstünde durduğu zemin 36-77, arkalarındaki duvar **7-10**. Göz "bu yüzey bitmemiş" derken tam
olarak bunu ölçüyor.

**Dördüncü bulgu: zeminin bütün değişkenliği ÖDÜNÇ.** Gölge almayan taban düzleminde sapma
**1,39 · 11 renk**; gölge alan alan kaplamalarında 6,25-8,19 · 36-77 renk. Yani zeminin kendi
malzemesi tam olarak **tek renk** (`parke` teması `kind: 'flat'`, D-073'ten beri) — ekranda
görünen bütün ton farkı objelerin gölgesidir. Gölge olmasa zemin 1 renk olurdu.

### §C — Kesik hattı: boşluk 18 karenin 13'ünde var

En büyükleri: yatay/açılış (−14 / 3) **%20,0** · yatay/tam (14 / 8) **%19,1** ·
yatay/tam (−13 / −6) **%11,7**. Boşluğun rengi `#1f2933` (koyu arduvaz, parlaklık 40,1) —
sıcak ahşabın (parlaklık 153) yanında **koyu bir delik**.

### §E — Boşluk NEREYE düşüyor? (kuşak hangi kenara, kaç birim?)

Ufuk altı boşluk ışını y = 0 düzlemini keser; o nokta "zemin orada olsaydı" noktasıdır.

| kenar | boşluğun payı |
|---|---|
| **SOL (−x)** | **%53,1** |
| **SAĞ (+x)** | **%27,3** |
| **ARKA (−z)** | **%17,9** |
| ÖN (+z, sokak tarafı) | **%1,6** |

Kenardan dışarı taşma: ortanca 1,0-10,1 br (kareye göre) · **P90 11,11 br** · en uzak **15,12 br**.

**Beşinci bulgu — kullanıcının fikri doğru, YERİ değil.** Kullanıcı *"mesela etraf bahçe veya
çimenlik gibi olabilir"* dedi ve "etraf" denince akla ilk gelen yer sokak cephesidir. Ölçüm
boşluğun **%1,6'sının** ön kenarda olduğunu söylüyor: sokağa konan yeşil ekrana girmez (S6 bunu
karşı binalar için zaten ölçmüştü, %0 görünürlük). Boşluk **sol · sağ · arka** kenarlarda ve
kuşak kenardan **en az 11,1 br** dışarı uzamadan kapanmaz.

### §F — Aday etki tablosu: kol karenin yüzde kaçını GERÇEKTEN değiştiriyor?

Simülasyon donduruldu (`__zaman(0)`), iki taban karesi arasındaki oynayan pikseller gürültü
maskesi olarak düşüldü (donmuş sahnede %0,03-0,28).

| kol | ad | kadraj | taban farkı | ort. delta | grup içi fark |
|---|---|---|---|---|---|
| **C1** | Çimenlik kuşağı | boşluk | %17,9 | 87,7 | (referans) |
| **C2** | Bahçe: çim + çit + ağaç | boşluk | %17,8 | 82,3 | **%2,6** |
| **C3** | Taş avlu + saksılar | boşluk | %17,9 | 139,9 | %18,0 |
| **C4** | Komşu kütleler (sokak dokusu) | boşluk | %17,9 | 57,2 | %18,0 |
| **K1** | Arka planı ısıt (tek satır) | boşluk | %17,8 | **153,9** | %17,9 |
| **K2** | Zemini genişlet (sonsuz ahşap) | boşluk | %17,9 | 102,8 | %17,8 |
| **Z1** | Tahta derzi (D-073 geri alınır) | zemin | %11,3 | 19,0 | (referans) |
| **Z2** | Alan başına ton + bordür | zemin | **%77,4** | 8,2 | %59,8 |
| **Z3** | Yıpranma lekesi (desen yok) | zemin | %1,0 | 28,7 | %18,9 |
| **D1** | Lambri yükselt + koyult | duvar | %9,4 | 38,2 | (referans) |
| **D2** | Çini kuşağı | duvar | %4,4 | 51,6 | %12,9 |
| **D3** | Duvar dibi kademeli gölge | duvar | %4,5 | 23,9 | %7,6 |

**Altıncı bulgu: altı boşluk kolunun hepsi karenin AYNI %17,8'ini dolduruyor** — aralarındaki
fark kapsamda değil içerikte. Grup içi fark bunu ayırıyor: **C2'nin bütün ağaçları, çiti ve
çalıları, düz çimenliğe göre karenin yalnız %2,6'sı.** 67 nesnelik bir kol, dört düzlemlik bir
kola göre ekranda 2,6 puan getiriyor.

**Yedinci bulgu: Z2 zemini karenin %77,4'ünde değiştiriyor ama ortalama delta yalnız 8,2.**
Yani alan tonu + bordür, zeminin TAMAMINA dokunan ama hiçbir yerde bağırmayan tek kol. Z1 tersi:
%11,3 kare, delta 19 (derz çizgileri ince ama net).

---

## §Ölçümün ELEDİĞİ kollar (kullanıcıya sunulmadı — sebebiyle)

1. **Ufuk silueti / gökyüzü kuşağı.** Tur kartında Ç4 olarak açılmıştı. §A: ufuk üstü boşluk
   18 karenin 18'inde **%0,0**. Gökyüzü ekranda yok; gökyüzüne konan hiçbir şey görünmez.
2. **Sokak/ön cepheye bahçe.** §E: boşluğun **%1,6'sı** ön kenarda. S6'nın karşı bina ölçümü
   (%0 görünürlük) bu kenar için hâlâ geçerli.
3. **Vinyet/sis ile kesiği yumuşatma.** §C: boşluk 13 karede var ve payı %20'ye çıkıyor;
   yumuşatma bir %20'lik bölgeyi doldurmaz, bulanıklaştırır. K1 aynı işi tek satırla ve
   ekranda ölçülebilir biçimde (delta 153,9) yapıyor — ayrı kol olarak tutmanın bilgisi yok.

---

## §Karar — D-129 (kullanıcı, 2026-09-17)

Karar paketi: https://claude.ai/artifact/KoKfXtRZ3CAxMsLgcd3f3s

**Zemin ve duvar grupları TAMAMEN elendi.** Kullanıcı: *"zemin ve duvar şu anki haliyle kalsın."*
Yani Z1/Z2/Z3 ve D1/D2/D3 uygulanmadı; D-073 (düz ahşap zemin) ve bugünkü duvar dili duruyor.
Rapordaki §A/§B sayıları bu kollar için ÖLÇÜLDÜ ve duruyor — ileride açılmak istenirse yeniden
ölçüm gerekmez.

**Seçilen tek kol: C2 — bahçe (çim + çit + ağaç).** Ama kullanıcı kolun KAPSAMINI değiştirdi ve
kararın asıl maddesi budur:

> *"c2 Bahçe: çim + çit + ağaç çok güzel olur ama alan olarak açmadığım her yer öyle olsun,
> açtıklarım zaten oynanabilir olacak."*

Karar paketindeki C2 binanın DIŞINDAKİ kuşaktı. Kullanıcının istediği şey farklı ve daha geniş:
bahçe **binanın ayak izinin tümleyeni**. Açılmamış bir alan zemin karesinin İÇİNDE de olabilir
(1. alan açıkken 2. ve 3. alanların dikdörtgenleri tam orada) ve bandın yeri de bant çizilmeden
önce bahçedir. Bahçe böylece `areasOpen` ile **küçülür**: satın alınan her alan bahçeden düşüp
oynanabilir zemine döner.

Bu kapsam, §A'nın ölçtüğü ikinci bir kusuru da kapatıyor: kilitli alanın zemini bugüne kadar
çıplak taban ahşabıydı (sapma **1,39 / 11 ayrık renk**) — yani kullanıcının şikâyet ettiği yüzeyin
en düz hâli tam da oradaydı.

## §Uygulama

- **`src/components/three/bahceLook.ts`** (yeni) — ölçü ve yerleşim katmanı. `binaAyakIzi(areasOpen)`
  TEK doğru kaynak; `cimAlanlari` · `citParcalari` · `citDirekleri` · `bitkiler` üçü de ondan türer.
  `dikdortgenFarki` eksen hizalı TAM fark (örtüşen parça üretmez → z-fighting yok).
  Sayılar §E'den: `disPay 30` (en uzak taşma 15,12'nin iki katı) · `citPay 6` (ortanca ile P90
  arası → çit görünür, arkasında çim kalır) · `bitkiMenzil 14` (P90 11,11'i geçer).
  Duvar payı elle yazılmıyor, `WALL_M + WALL_T_WAINSCOT / 2` ile duvarın kendi sayısından türüyor.
- **`src/components/three/Bahce.tsx`** (yeni) — çizim. Çim parça başına düzlem, ağaç/çalı/çit
  dört `InstancedMesh`. Çim TEK RENK DEĞİL: her parça konumundan türeyen bir ton alır — bu turun
  kendi bulgusu düz bir yeşil düzlemin aynı şikâyeti üreteceğini söylüyor.
- **`src/components/three/Scene.tsx`** — `<Bahce />`, `<Ground />`den sonra.
- **`src/config/palette.ts`** — yalnız iki renk eklendi (`lawn`, `fenceWood`); yapraklar mevcut
  `plant`/`plantAlt`, gövde `planter` ailesini kullanıyor (yeni renk dili açılmadı).
- **`src/components/three/streetLook.ts`** — `KALDIRIM_ARKA` eklendi, asfaltın derinliği ondan
  türüyor. Kaldırım 19,90'da bitip asfalt 20,00'de başlıyordu; **0,10 br'lik dikişten** arka plan
  görünüyordu. §E'nin "ön kenara düşen 80 ışının TAMAMI aynı taşmayı (2,37) veriyor" satırı ele
  verdi: dağılımı olmayan bir boşluk bölge değil ÇİZGİdir, ve 17,6 + 2,37 = 19,97 tam dikişin içi.
- **`src/components/three/wallPanel.tsx`** — `WALL_T_WAINSCOT` dışa verildi (bahçe payı için).

## §Bekçi

`tests/bahce-r4.test.ts` — **21 denetim**. Korunan şey çimin rengi değil KAPSAMI:
(a) açık alanın üstünde çim yok · (b) arsa içinde binaya ait olmayan her nokta çimle kaplı ·
(c) bahçe `areasOpen` ile küçülüyor · bant açılınca TAMAMI çimsiz · duvarın dış yüzü çimsiz
(örnekleme değil tam hesap) · kapı eşiği–sokak hattı hiçbir zaman çimde değil · çim sokağa
taşmıyor · kaldırım-asfalt dikişi sıfır · çim tek renk değil · bitki binanın dibinde/görünmez
uzaklıkta değil · yerleşim kararlı · çit ön kenarda yok ve arkasında çim kalıyor.

`node tools/mutasyon-bahce-r4.mjs` — **23/23 kırmızı**.

**İlk koşuda 4 mutasyon kaçtı ve ikisi delik değil ÖLÜ KOD gösterdi.** M12 (müşteri koridoru
elemesini tamamen kaldır) ve M13 (elemeyi kapıyla taşıtma) İKİSİ birden kaçtı — çünkü o eleme
hiçbir `areasOpen` değerinde ateşlenmiyor: kapı her zaman açık bir alanın ayak izinin içinde
(1 alanda x −8,5 → 0. alan; 2+ alanda x 0 → iki ön çeyreğin ortak kenarı) ve bahçe zaten sokak
hattında bitiyor. Ateşlenemeyen kural koruma değil gürültüdür; silindi, yerine gerçek değişmez
(kapı–sokak hattı çimsiz) doğrudan bekçiye kondu. Kalan ikisi gerçek delikti: M6 (duvar payı)
bekçi payı kendi kaynağından okuduğu için, M11 (bitki menzili) sınırı kendi sabitinden aldığı
için görünmüyordu — ikisi de dış kaynağa bağlandı (`wallPanel` sayıları, §E'nin 15,12'si).

## §Final

vitest **1273 ✓** (57 dosya) · duman **45/45 ✓** · tsc temiz · konsol hatası 0
Kareler: `ss/r4-son-alan1.png` · `alan2` · `alan3` · `alan1-kenar` · `alan1-sag` · `alan3-dis`
Çizim bütçesi: 1 alan 50 çağrı / 28.884 üçgen · 3 alan 182 çağrı / 77.016 üçgen.
