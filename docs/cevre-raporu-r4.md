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

## §Karar

*(BOŞ — adım 3'te kullanıcı seçer. D-084: bu bölüm karar paketinden önce doldurulmaz.)*

---

## §Uygulama

*(BOŞ — adım 4.)*

## §Bekçi

*(BOŞ — adım 4.)*
