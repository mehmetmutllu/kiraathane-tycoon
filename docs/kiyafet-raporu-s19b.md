# S19b raporu — D-116'nın uygulanması ve yolda çıkan beş ölçüm

**Tur:** S19b (Faz S) · **Damga:** 2026-09-14 · **Kural:** `docs/oturum-akisi-mantik.md` (D-084)
**Önceki tur:** `docs/patron-oturus-glif-raporu-s19a.md` (ölçüm + karar) · **Karar:** D-116
**Ham çıktı:** `docs/olcum-onluk.json` · `docs/olcum-patron.json` · `docs/olcum-oturus.json` (S19a'dan)
**Araçlar:** `tools/olcum-onluk.mjs` · `tools/olcum-patron.mjs` · `tools/kiyafet-dogrula.{html,mjs}` · `tools/shot-s19b.mjs`
**Kareler:** `docs/gorsel/ss/s19b-kiyafet.png` · `s19b-oyun-yakin.png` · `s19b-oturus-yakin.png`

## Soru

S19a ölçtü, kullanıcı seçti (D-116), kod yazılmadı. Bu tur yalnız **UYGULA** adımı: beş kol koda
girer, bekçilenir. Yeni bir kol açılmadı, hiçbir denge dosyasına dokunulmadı — **varyant kapısı
tetiklenmiyor**.

Ama uygulama beş yerde **ölçüm istedi**: S19a'nın bıraktığı sayılar üç noktada yetmiyordu ve
ikisi yanlıştı. Aşağıdaki §Bulgular o beş ölçümdür; hepsi seçilen kolun İÇİNDE, kol değiştirmiyor.

## Bulgular

### 1. Rozet ayrı düğüm DEĞİL — "gizle" kolu ölçümle düştü

S19a'nın açık kusuru: *"gövdenin göğsündeki rozet önlüğün içinden çıkıyor"*. Tur kartı iki kol
bırakmıştı: süs ayrı düğümse önlüklü aktörde gizle, değilse önlüğü 1-2 mm öne al.

Dört gövdenin meshli düğümleri sayıldı. **Gizlenebilecek bir süs düğümü yok** — göğüs `*_Body`
mesh'inin kendi geometrisi:

| gövde | meshli düğümler | süs düğümü |
|---|---|---|
| Knight | ArmLeft · ArmRight · **Body** · Cape · Head · Helmet · HelmetVisor · LegLeft · LegRight | yok |
| Rogue | ArmLeft · ArmRight · **Body** · Cape · Head · LegLeft · LegRight | yok |
| Barbarian | ArmLeft · ArmRight · BearHat · **Body** · Head · LegLeft · LegRight | yok |

Yani önlük o geometrinin **önüne geçmek** zorunda. Birinci kol elendi.

### 2. "1-2 mm öne al" da yetmiyor — açık 2 mm değil 8,8 cm

İkinci kol da düştü, ama sebebi S19a'nın ölçtüğü sayı değil, **ölçtüğü YER**. Önlük bir silindir
dilimi; doğru soru "gövde ne kadar ileri" (z) değil, "gövde önlüğün EKSENİNDEN ne kadar uzakta"
(yarıçap). İkisi yayın ortasında aynı, **kenarında ayrışıyor**: gövde yassı, silindir yuvarlak.

Göğüslüğün 110°'lik yayı içinde gövdenin eksenden en büyük yarıçapı (ham rig birimi, eksen z=0,02):

| gövde | göğüslük yayında gereken | etek yayında gereken | A2'nin sabit yarıçapı | durum |
|---|---:|---:|---:|---|
| Knight | 0,3529 | 0,4033 | 0,335-0,365 | sınırda |
| **Rogue** | **0,4526** | **0,5146** | 0,335-0,365 | **deliyor (8,8 cm)** |
| **Barbarian** | **0,4069** | 0,4144 | 0,335-0,365 | **deliyor** |

Delinme yayın **ortasında değil kenarında** oluyor — kullanıcının *"önlük parçalanmış gibi"*
dediği görüntünün kalıbı bu.

**Sonuç: yarıçap SAYI OLARAK YAZILAMAZ.** Önlük artık gövdenin kendi profilinden türüyor
(yükseklik halkası × açı dilimi ızgarasında en büyük yarıçap + sabit pay). Tek sayı payın
kendisi (`ONLUK_PAY = 0,02`). Bugün olmayan bir gövde eklense de sarar.

### 3. Yüzeyin kendisi de ölçüldü: iki geçiş yumuşatma, genişletme YOK

İlk kare (`s19b-onluk.png` v1) önlüğü **yırtık pırtık** gösterdi: ham ızgara "her hücrenin en
büyüğü" olduğu için testereye benziyordu. Denenen iki kol:

| kol | ne yapar | sonuç |
|---|---|---|
| 3×3 genişletme + yumuşatma | çukuru doldurur, tepeyi yanlara taşır | yırtık kapandı ama etek şişti — **TÜTÜ** (v2 karesi) |
| **iki geçiş yumuşatma, ham değerin altına inmeden** | yalnız çukuru doldurur | **seçilen** — örtme bozulmuyor, kumaş gibi duruyor |

Aynı karede iki ölçü daha düzeltildi: etek yayı **220° → 180°** (220'de yanlardan dönüp etek
okunuyordu), açılma **0,05 → 0,015**. Askılar kutu şerit olarak gövdenin İÇİNDE kalıyordu
(sabit z'de duruyorlardı); onlar da dar yaylı birer önlük parçası oldu, merkezleri ±26°.

### 4. Ten rengi paletten değil DOKUDAN — #f4b690

Sıvalı kolun ilk uygulaması `PALETTE.skin`i (#e0ac69) kullandı ve kol karede **turuncu eldiven**
gibi çıktı: o sayı oyunun kendi paletinden, gövde ise KayKit'in dokusundan geliyor.

Doku ölçüldü (PNG repo'da çözücü olmadığı için `zlib.inflateSync` üstüne küçük bir çözücü
yazıldı). Yolda iki ölçüm hatası çıktı ve ikisi de **yanlış hüküm üretiyordu**:

| hata | belirti | doğrusu |
|---|---|---|
| UV accessor'ı VEC3 adımıyla (12 bayt) okundu | eller "eldivenli", yüzler gri | VEC2 adımı **8** bayt |
| V ekseni çevrildi (`1 - v`, WebGL alışkanlığı) | yüz dokunun taş/metal bölgesine düştü | glTF'te UV başlangıcı sol-üst, **çevrilmez** |
| örnek tepe noktasından alındı | yama KENARI, iki rengin karışımı | üçgenin **ağırlık merkezi**, alanla ağırlıklı |

Düzeltilince: ten, dört başın da paylaştığı yama olarak okundu — **#f4b690** (saç her gövdede
farklı, ten aynı; en geniş yama Ranger'da saçtır, o yüzden ortanca değil KESİŞİM alındı).

### 5. Sıvalı kol gerçekten mesh bölmeden olur — sınır dirsekte

S19a'nın teknik iddiası sayıya çevrildi. Alt kol/bilek/el kemiklerine ağırlığı > 0,5 olan tepe
noktaları:

| gövde | kol tepesi | sıvanan | oran | sıvama sınırı \|x\| |
|---|---:|---:|---:|---|
| **Ranger (patron)** | 1336 | 772 | **0,578** | **0,528** |
| Knight | 1028 | 680 | 0,661 | 0,462 |
| Rogue | 1306 | 740 | 0,567 | 0,528 |
| Barbarian | 1178 | 830 | 0,705 | 0,462 |

Omuz kemiği \|x\| = 0,212, el ucu 0,971 → sınır tam **ortada**, yani dirsekte. Geometri
kesilmiyor, çizim sayısı artmıyor.

**Kemik adı tuzağı:** dosyada `lowerarm.r`, çalışma zamanında `lowerarmr` (three'nin
`PropertyBinding`i ayırıcıyı siliyor). İlk koşu noktalı adı aradı ve **0 tepe noktası** saydı —
ölçüm "sıvalı kol yapılamaz" diyecekti.

### 6. Havlunun ölçüsü omuzdan

İlk uygulama havluyu kemiğin 0,10 üstüne koydu ve boyunu 0,62 yaptı → omzun iki katı uzunlukta
bir **tahta** (v1 karesi). Omuz yüzeyi ölçüldü:

| gövde | omuz kemiği y | omuz DERİSİNİN tepesi | omzun z derinliği |
|---|---:|---:|---:|
| Ranger | 1,1068 | **1,2287** | **±0,147** |
| Knight | 1,1068 | 1,2472 | ±0,1357 |

Havlunun yüksekliği artık kemik ile deri tepesi arasındaki fark (**0,125**), boyu omzun kendi
derinliği (**0,147**).

## Uygulama (adım 4)

| kol | dokunulan yer | bekçi |
|---|---|---|
| O3 oturuş çapası 0,26 | `actor.ts` → `KAY_OTURMA_ILERI` · `Customers.tsx` (yerel +z, `sin/cos(açı)`) | 4 mutasyon |
| A2 saran önlük | **yeni** `onluk.ts` (profil → ızgara → yüzey) · `KayActor.kiyafetTak` | 4 mutasyon |
| P7 havlu + sıvalı kol | **yeni** `patron.ts` · `KAY_KIYAFET` genişledi · `PALETTE.ownerShirt` KALKTI | 5 mutasyon |
| Y1 + B1 balonun içi | `siparisBalonu.ts` model render'ı · `Customers.tsx` pişirme efekti | 5 mutasyon |
| Y1 asset girişi | `public/assets/models/kenney-food-kit/` · manifest · `.gitignore` | (aynı dosyada) |

Bekçi: `tests/oturus-kiyafet.test.ts` — **38 denetim, 18 mutasyonla doğrulandı.**
Final tam koşu: `npm run test` 1030 ✓ · `npm run duman` 42/42 ✓ · konsol hatası YOK.

### S18'in iki bekçisi D-116 ile düştü, silinmedi — yeri değişti

`karakter-senkron.test.ts` patronu RENKLE ayıran S18 kolunu bekçiliyordu (`ownerShirt` ≠ `shirt`).
Kullanıcı rengi geri aldı, yani o bekçi artık YANLIŞ bir şeyi koruyordu. Yerine olumsuz bir
bekçi kondu: *`ownerShirt` palette geri eklenirse kırmızı yan*. `karakter.test.ts`'in boyama
listesi denetimi de `parcaRenk` → `PARCA_RENK` çapasına taşındı (gömlek artık role bağlı değil).

## Açık kalan

- **Bel bağının ucu** çeyrek açıdan hâlâ ince bir dudak bırakıyor (`s19b-kiyafet.png`). Ölçü
  değil biçim sorunu; pay 0,035 → 0,012 ile küçültüldü, sıfırlanmadı.
- **Ranger'ın yan taşması 0,094** (S19a'dan devam) — kalçası taburenin kendisinden geniş, z
  çapası kapatmıyor. Gövde/mobilya oranı, kendi turunu ister.
- Kenney Food Kit'ten **yalnız `sandwich`** alındı. Paketin kalanı (201 model) repoya girmedi;
  yeni bir yemek gerekirse aynı yerden tek tek alınır — stil kilidi istisnası genişletilmez.
