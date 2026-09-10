# S7 — WC odası: kabin kapıları · seviye sinyali · müşterinin kayboluşu (ÖLÇÜM RAPORU)

Ham çıktı: `docs/olcum-wc-odasi.txt` · araç: `tools/olcum-wc-odasi.ts` (`OLCUM=tam npx tsx tools/olcum-wc-odasi.ts`)
Görsel: `docs/gorsel/s7-kapi-adaylari.png` · `docs/gorsel/s7-kapi-yan.png` · `docs/gorsel/ss/s7-*.png`
Yeni araçlar: `tools/model-bak.mjs` + `tools/model-bak.html` (modeli çizip gösterir) · `tools/shot-wc-s7.mjs`
Tarih: 2026-09-10 · karakter boyu **1,75** · oda duvarı **2,20** · kabin bölmesi **2,00**

> Bu rapor **ölçüm commit'iyle** yazıldı; **§Karar bölümü bilerek BOŞ.** Karar paketi kullanıcıya
> sunulur, seçilen kol ikinci commit'te uygulanır (D-084 varyant kapısı).

---

## Soru

Üçü de kullanıcıdan gelen, hepsi aynı odaya bakan üç iş:

1. **Kabin kapıları** bugün düz kutu (`1,36 × 1,95 × 0,06`, tek renk `#5d4037`) ve kullanıcı
   *"kötü"* dedi. Diskteki `door_A` · `door_B` · `wall_half` · `pillar_A/B` karşılık veriyor mu?
2. **G-36 — seviye sinyali.** S6/③'te kapının üstündeki sarı daireler kullanıcı isteğiyle
   kaldırıldı; onlar lavabo seviyesinin **tek** görsel sinyaliydi. Şimdi seviye hiçbir yerden
   okunmuyor. Aday: sinyal **MEKÂNSAL** olsun — seviye arttıkça lavabo **sayısı** artsın.
3. **G-35 — müşteri kapı eşiğinde buharlaşıyor.** Oda çizilmeden önce bu bir TASARIMDI
   (`layout.LAVABO`: *"oda YÜRÜNMEZ, müşteri kapıda kaybolur"*); oda çizildikten ve kamera içini
   gördükten sonra kullanıcı onu **hata** olarak okudu.

**Giriş cephesi cam bu turda YOK** — kullanıcı kararı: kapı bloğuna ve duvar temasına dokunduğu
için kendi turunu alacak.

## Yöntem

Sayılar odanın kendi kodundan (`MaketLavaboBlock`, `layout.BAND*`, `wcLook`) ve modellerin kendi
gltf'lerinden okunur. Bu turda **iki** yöntem katmanı var:

- **§V görünürlük** — S6'nın yöntemi (kamera konisi) + bu turda **YENİ** olan ikinci süzgeç:
  kameradan noktaya giden ışın odanın **2,20'lik ön duvarını** kesiyor mu (ışın–kutu, slab).
  S6'da böyle bir engel yoktu; WC odasında asıl soru bu.
- **ekranda doğrulama** — `tools/model-bak.mjs` modeli gerçekten çizer. Bu tur onsuz **yanlış**
  karar verecekti (aşağıda §K'nın ilk paragrafı).

Koşu: **tam** (`OLCUM=tam`), damgalar temiz. Tarama ızgarası 1 × 0,5 br.

---

## §Bulgular

### V — Görünürlük: S6'nın sorusu, bu kez cevabı **EVET**

S6'da karşı binalar üç kamera kipinde de **%0** çıkmış, 10.389 üçgenlik iş boşa gidecekken
durmuştu. Aynı soru burada sorulduğunda cevap tersine çıkıyor: **WC odası ekranda.**

| parça | kadraj | GÖRÜNÜR | uzaklaş | portre | **YAKIN** |
|---|---|---|---|---|---|
| kapı boşluğu (referans) | %31 | %31 | %53 | %51 | **%100** |
| kabin kapısı #1 → #4 | %29 → %24 | %29 → %24 | %54 → %48 | %50 → %43 | **%100** |
| kabin kapısı üst kenarı | %17 | %17 | %40 | %35 | **%100** |
| bölme #1 / #5 | %28 / %22 | %28 / %22 | %51 / %43 | %47 / %39 | **%100** |
| klozet (aralık kabin) | %30 | %30 | %53 | %51 | **%100** |
| lavabo #1 / #2 / #3 | %16 / %20 / %22 | %16 / %20 / **%10** | %35 / %38 / %23 | %32 / %34 / %21 | **%100** |
| ayna | %13 | %13 | %29 | %27 | **%100** |
| fayans zemin (oda ortası) | %39 | **%2** | %8 | %8 | %33 |
| müşterinin kaybolduğu nokta | %32 | %32 | %57 | %52 | **%100** |

**YAKIN = oyuncu kapının önündeyken** (yükseltme noktasının 3 br çevresi) — yani odanın asıl
görüldüğü an. Orada oda **%100 açık**; `docs/gorsel/ss/s7-kapi-onu.png` bunu gösteriyor.

Duvarın kestiği tek şey **zemin** (%39 kadraj → %2 görünür) ve **ön sıradaki** mobilya. Örtme
bir yarım-uzay değil, duvarın hemen arkasındaki **bir bant**:

| oda içindeki z | ön duvara uzaklık | y=0,20 | y=0,50 | y=1,00 | y=1,50 | y=1,95 |
|---|---|---|---|---|---|---|
| −10,30 | 0,50 | %0 | %0 | %0 | %0 | %17 |
| −11,30 | 1,50 | %0 | %0 | %0 | %58 | %100 |
| −12,30 | 2,50 | %0 | %0 | %58 | %100 | %100 |
| −13,30 | 3,50 | %33 | %58 | %100 | %100 | %100 |
| −15,30 | 5,50 | %100 | %100 | %100 | %100 | %100 |

**Okunuşu:** odaya ne kadar İÇERİ konursa o kadar görünür; duvarın DİBİ kördür. Bugünkü yerleşim
(kabinler en arkada, lavabolar arka yarıda) bu yüzden şanslı; **öne** eklenen her şey kaybolur.

### K — Kabin kapısı ve bölme

**ÖNCE BİR HATA, çünkü bu turun asıl dersi o.** `door_A` ölçüldü: `1,600 × 2,800 × 0,771`, tek
mesh, 188 üçgen. Köşe histogramı x'te **0,48…1,12 arasında hiç köşe olmadığını** söyledi ve ilk
okumam *"ortası boş, demek ki bu bir kapı KASASI"* oldu. **Yanlıştı.** Orası düz bir panelin
içi — düşük-poli modelde düz yüzün ortasında vertex yoktur. Bu ders `docs/dis-cephe-raporu-s6.md`
§Yöntem'de **S4 dersi olarak zaten yazılıydı** ve yine ısırdı; bu kez ışın testiyle değil,
modeli **çizdirerek** çözüldü (`tools/model-bak.mjs`, yeni araç).

Ekranda okunan (`docs/gorsel/s7-kapi-adaylari.png`):

- **`door_A` / `door_B`** — gri kasa + **kapalı kanat** + kanadın üstünde küçük cam + **iki yüzde
  itme barı**. Restoran mutfak kapısı. `door_A` kanadı yeşil, `door_B` kanadı kahve.
- **`wall_half` · `wall_doorway` · `pillar_A/B`** — hepsi **4,00 (pillar 4,10) boyunda duvar
  modülü**. Odanın duvarı 2,20, kabin bölmesi 2,00. **Bunlar bölme değil; B2/B3 kolları ölü.**

Boy profili (`door_A`, z kalınlığı):

| y dilimi | z kalınlığı | not |
|---|---|---|
| 0,00–0,20 | 0,300 | kasa tabanı |
| 0,80–1,20 | **0,735 / 0,771** | **itme barı** — iki yüzden de taşıyor |
| 1,60–2,40 | 0,100 | cam (girintili) |
| 2,60–2,80 | 0,300 | kasa üstü |
| — | **0,300** | **bar hariç gövde kalınlığı** |

Yani bbox'ın 0,771'i modelin kalınlığı değil, **barın taşması**. Gövde 0,300 ve kabin 1,60 derin —
derinlik sorun değil. Sorun **oran**:

| ölçek kaynağı | en | boy | kabin adımı | 4 kabin kaplar | bölme boyunu (2,00) aşar mı |
|---|---|---|---|---|---|
| **BOYDAN** (h → 1,95) | **1,11** | 1,95 | 1,25 | 5,02 | hayır |
| **ENDEN** (w → 1,36) | 1,36 | **2,38** | 1,50 | 6,00 | **EVET +0,38** |
| **TEKDÜZE OLMAYAN** | 1,36 | 1,95 | 1,50 | 6,00 | hayır |

Tekdüze olmayan kolun x/y çarpıtması **1,221** — D-103'ün lavabo gövdesinde kabul ettiği bedel
**2,715** idi, yani bunun **altında**.

**Renk — bu kolun en iyi haberi:** `door_A`/`door_B`'nin **%73'ü `[0,3] #828c91`**, yani S6/②'de
lavabonun ve aynanın taşındığı **tam o gri**. Kapı, WC'nin bugünkü diline **göz taşımadan** oturur.
Ayırt eden yalnız %25'lik kanat gözü: `door_A` **yeşil** `[1,2] #21a489`, `door_B` **kahve**
`[0,6] #995842`.

**İtme barı ayrı bir kalem:** bar bir mutfak kapısının parçası; WC kabininde yeri yok. Kalması,
gözünün taşınması ya da (bar ayrı bir alt-mesh olmadığı için) olduğu gibi bırakılması karar.

**Bugünkü hâl ekranda** (`docs/gorsel/ss/s7-oda-sol.png`): kabin kapıları ve bölmeler **aynı koyu
kahve**, kapı kasası/kolu/aralığı yok — blok tek bir kahve kütle, üstünde dikey yarıklar. Aynı
kadrajda lavabo duvarı (gri gövde + mavi ayna) düzgün duruyor; fark oradan okunuyor.

### L — Seviye sinyali (G-36)

`maxLevel = 6`, yani "seviye = lavabo sayısı" kolu doğu duvarından **6 lavabo** ister.
Duvarın z boyu **7,40 br**, lavabo z'de **1,36 br** kaplıyor:

| aralık | n=4 | n=5 | n=6 | en çok |
|---|---|---|---|---|
| 1,36 (bitişik) | 5,44 | 6,80 | 8,16 ✗ | **5** |
| 1,50 | 5,86 | 7,36 | 8,86 ✗ | **5** |
| 1,70 (bugünkü) | 6,46 | 8,16 ✗ | 9,86 ✗ | **4** |

**Duvar 6 lavabo almıyor.** Üstelik sığan 5 slotun hepsi kullanılabilir değil:

| slot z | ön duvara uzaklık | GÖRÜNÜR | YAKIN |
|---|---|---|---|
| −16,63 | 6,83 | %16 | %100 |
| −15,27 | 5,47 | %19 | %100 |
| −13,91 | 4,11 | %17 | %100 |
| −12,55 | 2,75 | %4 | **%78** |
| −11,19 | 1,39 | **%0** | **%0** |

Yani duvarın **öne bakan son slotu hiçbir kipte görünmüyor** (§V'nin ölçtüğü kör bant). Mekânsal
sayı sinyali **gerçekte 4 kademe** taşıyor, 6 değil.

**İkinci sinyal adayları** (`feedback_upgrade_legibility` çoklu redundant sinyal ister):

| aday | GÖRÜNÜR | YAKIN |
|---|---|---|
| kabin kapısı sayısı (arka duvar) | **%27** | %100 |
| kapı boşluğunun kendisi | %30 | %100 |
| kapının üstü (**kaldırılan sarı daireler**) | **%22** | %100 |
| lavabo sayısı (doğu duvarı) | %20 | %100 |
| ayna sayısı | %13 | %100 |
| fayans şeridi (zemin) | %2 | %33 |

**Dürüst not:** kaldırılan sarı daireler **görünmez değildi** — %22/%100 ile odanın en okunur
noktalarından biriydi. Kullanıcı onları biçimleri için istemedi, yerleri için değil. Aynı yer
başka bir biçimle (mekânsal bir şeyle) hâlâ kullanılabilir.

### M — Müşterinin kayboluşu (G-35)

Bugün: `toWc` → `LAVABO.spot` (13,40 · −9,30) → varınca `pos = LAVABO.door` (13,40 · −9,55) →
`inWc` + `scale 0` → **2,5 sn** → aynı yerde belirip parasını bırakıyor.
Kayboluş noktası ön duvarın **0,14 br önünde**, yani müşteri duvara **girmeden** yok oluyor ve o
nokta oyuncunun kat konumlarının **%32'sinden, kapı önündeyken %100'ünden** görünüyor.
Ziyaret sıklığı seviyeyle **%30 → %55**, yani her iki müşteriden biri civarı.

**M1 — oda yürünür olsun.** Bedeli: `a2` alanı bugün z ≥ −9,80'de bitiyor ve `clampToOpenAreas`
müşteriyi de oyuncuyu da **aynı kuralla** tutuyor; alan sınırını açmak ikisini birden açar.
Odanın yürünebilir iç ölçüsü **5,61 × 12,81 br** (kabin kapılarına kadar), lavabo duvarı 0,66
düşünce net en **12,15 br**. Kapı boşluğu 1,40, oyuncu yarıçapı 0,47 → geçiş payı **0,46 br**
(geçer). Bu kol, `v1.1`'e ertelenmiş **"aktif WC döngüsü"**nün ta kendisi.

**M2 — kayboluş örtülsün.** Geometri bunu **tek başına yapamıyor**:

| müşteri z | kapıdan içeri | (a) kapı ekseninde | (b) yana sapan |
|---|---|---|---|
| −9,50 | −0,30 | %100 | %100 |
| −10,00 | 0,20 | %100 | **%0** |
| −10,50 | 0,70 | %67 | **%0** |
| −11,00 | 1,20 | %100 | %33 |
| −12,00 | 2,20 | %78 | %44 |
| −12,50 | 2,70 | %81 | %59 |

Kapı ekseninde düz içeri yürüyen müşteri **hiç saklanmıyor** (boşluktan bakılıyor). Saklanma
yalnız **yana sapınca** ve yalnız duvarın dibindeki **0,2–1,2 br**'lik bantta oluyor; daha
içeride oda yeniden açılıyor. Yani "içeri yürüyüp gözden kaybolma" yazılmadan olmuyor: ya
**yana sapan bir hedef** ya **authorlanmış bir sönme** ya **kapanan bir kapı** gerekir.

**M3 — bugünkü** kalırsa: kayboluş, görüldüğü anların %100'ünde kapı eşiğinde ve anlık.

---

## §Karar

*(BOŞ — karar paketi kullanıcıya sunulacak, seçilen kol ikinci commit'te uygulanacak.)*
