# S22 — Kademeli mutfak: oda 6 kademeyle nasıl büyür? (ÖLÇÜM RAPORU)

**Tarih:** 2026-09-15 · **Faz:** S 21/22 (kalem S22, tur adı S21) · **Sıra:** D-084 adım 2 tamam (ÖLÇ → commit #1)

**Ham çıktı:** `docs/olcum-mutfak-kademe.txt` (TAM koşu damgalı, 9 damga yeşil)
**Araç:** `tools/olcum-mutfak-kademe.ts` — hiçbir şeyi değiştirmez, ölçer
**Devraldığı ölçüm:** `docs/mutfak-raporu-s20.md` §K (D-118'in ertelenen D2 kolu)

---

## Soru

Mutfak, servis noktasının **6 kademesiyle** nasıl büyür — hangi kalıp **her** yükseltmede
ekranda okunan bir değişim bırakır, ve o değişim odanın **%42'lik görünür boşluğunu** mu doldurur?

S20 sayıyı vermişti: tezgâh 6 kademe çıkarken oda her seviyede aynı **19 sabit** üniteyi çiziyor
(`KitchenUnit`'te seviye alanı 0, `Kitchen.tsx`in seviye okuması 0), ve odanın %42'si %100 görünür
boş. Kullanıcı kuralı bu turun tarifini de yazmıştı: *"önce ilerleme adımlarını tasarla — objeler
küçük doğup yerinde büyür."*

---

## Yöntem

**Görünürlük süzgeci S6 + S7 + S20 ile BİREBİR aynı** (kadraj + ışın–kutu slab örtmesi):
kamera oyuncunun `+z`'sinde `CAMERA_DIST` = 8,50 br, `fov` 50, bakış yüksekliği 0,80.
Örten gövdeler: ön hattın **3** collision kutusu + odanın **19** ünitesi = **22 gövde**.
Oyuncunun denenen duruşu **234 nokta**. Tarama adımları (TAM koşu): doluluk 0,05 br ·
görünürlük 0,25 br · duruş 0,50 br.

Ölçüm kolları **kod yazılmadan**, plan fonksiyonu olarak kuruldu; kolların hiçbiri repoya girmedi.

**Araç kendi kusurunu iki kez yakaladı** (ikisi de ham çıktının yorumunu değiştirirdi):

| # | kusur | belirti | düzeltme |
|---|---|---|---|
| 1 | gövde kendi kendini örtüyordu | **bütün** deltalar %0 görünür çıktı — S20 aynı odada 0/19 görünmez ölçmüştü | eleme referansla değil GEOMETRİYLE: örnek noktasını içinde bulunduran kutu o noktanın kendi gövdesidir |
| 2 | çok ekli adlar ayrı köke düşüyordu | ocak zinciri **2** kademe göründü (gerçekte 5) | ekler tükenene kadar soyulur; sıra ÖNCE ölçek SONRA donanım |

---

## §Bulgular

### L — Merdiven ASİMETRİK, ve bu her şeyi belirliyor

| ölçüt | sayı |
|---|---|
| servis noktası `maxLevel` | **6** |
| kademe maliyetleri L1..L6 | 20 · 30 · 45 · **800** · **2400** · **9000** ₺ |
| kimlik dönüm noktaları | L4 TEZGÂH (ocak → tezgâh) · L5 TOST açılır |
| merdivenin toplam bedeli | 12.295 ₺ |
| **ilk ÜÇ basamağın payı** | 95 ₺ = **%0,77** |
| **son BİR basamağın payı** | 9.000 ₺ = **%73,20** |

Oyuncu ilk üç basamağı ilk dakikalarda çıkar (`simulate.ts`: tezgâh ~1,7 sa · tost ~2,1 sa ·
L6 ~3,4 sa). **Eşit büyüklükte altı görsel adım, ilk üçünü saniyeler içinde tüketip merdivenin
pahalı yarısını boş bırakır.** Bu yüzden her kola bir de **bedel–değişim uyumu** soruldu.

### S — Paket kademe taşıyor: 24 aile, en uzun zincir 5

| ölçüt | sayı |
|---|---|
| pakette model | 144 |
| ≥2 üyeli kademe ailesi | **24** |
| en uzun zincir | **5 kademe** (`stove_single → stove_single_countertop → stove_multi → stove_multi_countertop → stove_multi_decorated`) |
| bugünkü 15 gövdenin ailesi olan | **8** |
| 8 zincirin SİLUET değiştireni | **6** (kalan 2 aynı kutuda yalnız donanım ekliyor) |

Zincirlerin gerçek büyümesi (ham birim, `.gltf` accessor'larından):

| zincir | hacim | tür |
|---|---|---|
| `kitchencounter_straight_A → …_decorated` | ×2,33 | SİLUET |
| `kitchencabinet_half → kitchencabinet` | ×2,00 | SİLUET |
| `dishrack → dishrack_plates` | ×1,83 | SİLUET |
| `shelf_papertowel → …_decorated` | ×1,68 | SİLUET |
| `stove_single → stove_multi_decorated` | ×1,56 | SİLUET |
| `kitchencounter_straight_B → …_backsplash` | ×1,20 | SİLUET |
| `fridge_A → fridge_A_decorated` | ×1,00 | detay |
| `kitchencounter_sink → …_backsplash` | ×1,00 | detay |

**Hüküm: "yerinde büyüme" kolunun malzemesi VAR** — uydurulmuş bir asset gerekmiyor.

### Y — Büyümenin yeri: arka hat KAPALI, orta boşluk AÇIK

| ölçüt | sayı |
|---|---|
| **Y0 — arka hattın kalan yeri** | hattın doğu ucu x −4,81 · ara duvar x −4,60 → **0,21 br** |
| Y0'a sığan tam modül | **0** (modül eni 1,80) |
| **Y1 — en büyük boş dikdörtgen** | 8,95 × 4,45 = **39,83 br²** (odanın %42'si) |
| o boşluğun ortasının görünürlüğü | **%100** |
| modül ritmine oturan ada slotu | 7 · çakışan 3 · **temiz 4** |
| temiz slotların görünürlüğü | **%100** (dördü de) |
| çaycının yolu | x −14,60…−11,40 · z −11,30 (3,20 br) |
| adanın çaycıya bıraktığı pay | 0,82 br — **gereken 0,94** |
| koridoru açan düzeltme | ada ekseni z −13,16 (**0,12 br** geriye); boşluğun içinde **kalıyor** |

**Hüküm:** yeni gövde arka hatta **sığmıyor** (0,21 br). Büyüme ya yerinde olacak ya da
orta boşlukta. Orta boşluk 4 temiz slot veriyor ve ada 0,12 br geri çekilince çaycının
koridoru da tam açılıyor.

### K — Yedi kalıp, iki süzgeç

Kıyas ölçüsü: ortalama mutfak ünitesi **2,82 br³**.

| kol | ne yapar | kör basamak | yalnız detay | en zayıf basamağın kütlesi | bedel uyumu r | L1 → L6 doluluk |
|---|---|---|---|---|---|---|
| **K0** | bugünkü hâl | **5/5** | 0 | 0,00 br³ (×0,00) | — | %32 → %32 |
| **K1** | AÇILIM — ünite sayısı artar | 0/5 | 0 | 0,45 br³ (**×0,16**) | **−0,95** | **%11** → %32 |
| **K2** | TADİLAT — kilitliler tahta perde | 0/5 | 0 | 0,45 br³ (**×0,16**) | **−0,95** | %32 → %32 |
| **K3** | yerinde — her gövde kendi zincirini yayar | **1/5** | 0 | 0,00 br³ | +0,96 | %32 → %33 |
| **K3b** | yerinde — geçişler EŞİT dağıtılır | 0/5 | 0 | 2,04 br³ (×0,72) | **−0,30** | %32 → %33 |
| **K4** | yerinde — geçişler BEDELE orantılı | **1/5** | **1** | 0,00 br³ | +0,88 | %32 → %33 |
| **K5** | KARMA — erken takas, geç adada doğuş | **0/5** | **0** | **2,27 br³ (×0,80)** | **+0,89** | %32 → **%44** |

**İki süzgeç, ikisi de geçilmeli:**
1. **KÖR BASAMAK** — o yükseltmede ekranda hiçbir şey değişmiyor ya da değişen şey hiçbir
   duruştan görünmüyor. S7/D-104 bunu yasaklıyor (*"her seviye tam bir şeyi büyütür"*).
2. **DELTA KÜTLE** — bu odada her şey görünür (S20: 0/19 görünmez), o yüzden görünürlük tek
   başına hiçbir kolu elemiyor. Ayıran sayı, en zayıf basamağın **kaç ünite kadar** kütle
   değiştirdiği (`feedback_upgrade_legibility`: tek sinyal yetmez).

**Turun asıl bulgusu — K1/K2'nin merdiveni TERS akıyor (r = −0,95).**
Ünite-sayısı kalıbında delta kütle L1'de ×5,61, L2'de ×4,38 iken **L6'da ×0,16'ya** düşüyor:
merdivenin **%73'ünü ödeten** basamakta ekranda değişen şey bir **kasa kapağı**. Kalıp kendi
başına kör değil ama oyuncunun ödediği bedelle ters orantılı. Bu, S20'nin "vitrin" itirazının
kademeli hâli: iş görülüyor, ama yanlış yerde.

**K3'ün kör basamağı bir kalıp kusuru değil, MERDİVEN YAZIMI kusuru.** "Her gövde kendi zincirini
altı basamağa yaysın" kuralı 2 üyeli zincirlerin hepsini L6'ya yığıp **L2'yi boş bırakıyor**.
Aynı malzeme havuzlanınca (K3b/K4/K5) kör basamak kapanıyor. Yani yerinde büyüme
**elle yazılmış bir merdiven** ister — WC'nin `LAVABO_SAYI_BY_LEVEL` dizisinin yaptığı şey.

**K5 tek geçen kol:** kör 0 · detay 0 · en zayıf basamak ×0,80 ünite · bedel uyumu +0,89 ·
ve odanın görünür boşluğunu %32'den **%44'e** kapatan tek kol.

---

## §Kollar (karar paketine giden seçenekler)

Her kolun yanında **ölçülen sayı** var; sayısı olmayan kol pakete girmedi.

| kol | ne yapar | dayandığı sayı | maliyet |
|---|---|---|---|
| **K0** | kademesiz kalsın | 5/5 kör basamak — 6 kademe çıkan oyuncu odada hiçbir değişim görmez | 0 |
| **K1** | ünite sayısı seviyeyle artsın | kör 0 ama **r = −0,95**; L1'de oda %11 dolu (yarı kurulmuş görünür) | ünite listesine seviye alanı |
| **K2** | 19 gövde hep dursun, kilitliler tahta perde | kör 0, L1 %32 dolu; ama **r = −0,95** aynı kalıyor + 19 perde varyantı çizilecek | perde gövdesi + seviye alanı |
| **K3b** | yerinde büyüme, geçişler eşit dağıtılsın | kör 0 · en zayıf ×0,72 · ama **r = −0,30** (bedelle ilgisiz) | `KitchenUnit`'e zincir + seviye→üye tablosu |
| **K4** | yerinde büyüme, geçişler bedele orantılı | **r = +0,88** ama L2 kör + L3 yalnız detay (siluet aynı) | K3b ile aynı |
| **K5** | erken yerinde takas, geç basamakta adada yeni gövde | **kör 0 · detay 0 · en zayıf ×0,80 · r = +0,89 · doluluk %32 → %44** | K3b + 3 ada gövdesi + ada ekseni 0,12 br geri |
| **Y0** | büyüme arka hatta kalsın | **imkânsız** — kalan 0,21 br, modül 1,80 ister | — |
| **Y1** | büyüme orta boşluktaki adada | 4 temiz slot · hepsi %100 görünür · 39,83 br² boşluk | ada ekseni z −13,16 |

**Not — varyant kapısı:** kolların **hiçbiri** `economy.config.ts` / `tick.ts` / `rules.ts`'e
dokunmuyor. Hepsi çizim katmanında; seviye zaten var, okunmuyor. Bu turda denge sayısı değişmiyor.

---

## §Karar — **D-119** (kullanıcı, 2026-09-15)

Karar paketi: https://claude.ai/artifact/QXhU6FVWtETAzdAvY8qby1

| kol | karar |
|---|---|
| **K5 + Y1** | ✅ **SEÇİLDİ** — erken basamaklar yerinde büyür, geç basamaklarda orta boşlukta ada doğar |
| K0 | reddedildi — 5/5 kör basamak, bugünkü hâl |
| K1 · K2 | reddedildi — kör basamağı yok ama merdiven **ters akıyor** (r = −0,95) |
| K3 · K4 | elendi — kör basamak (türetilmiş dağıtım L2'yi boş bırakıyor) |
| K3b | reddedildi — kör basamağı yok ama bedelle ilgisiz (r = −0,30) ve odanın boşluğunu kapatmıyor |
| L1 doluluk | bugünkü hâlinde (%32) — "gözle seyrek başlasın" (%11) reddedildi |
| ada sayısı | üç ada + bir boş slot istendi; **uygulamada ikiye düştü** (aşağıya bak) |

---

## §Uygulama — kararın kolu, ama merdiven ELLE yazıldı

Karar kolu seçti; **basamakları ölçüm yazdı.** Uygulama sırasında K5'in türetilmiş dağıtımı
üç ayrı yerde çöktü ve üçü de ölçülerek düzeltildi — her biri rapora, çünkü üçü de
"kol iyi ama merdiven yazımı ayrı bir iş" tezinin kanıtı.

| # | ne çıktı | nasıl bulundu | ne yapıldı |
|---|---|---|---|
| 1 | K5 ocağın **5 kademelik** zincirinin dördünü birden L2'ye yığıyordu | K5y varyantı ölçüldü | merdiven elle yazıldı (**K5y**) |
| 2 | `stove_single_countertop` ocağın kademesi değil, tezgâha **gömülen göz** (h 0,278 · taban y 0,930) — zincire girse ocak kaybolup havada plaka kalırdı | türetilmiş **parça süzgeci** (§S) | iki `_countertop` modeli zincirden düştü; ocak zinciri 5 → **3** |
| 3 | `stove_multi_decorated` davlumbazın içine, `..._A_decorated` duvar dolabının içine, büyüyen komşu adalar birbirine giriyordu | **§Ç çakışma denetimi** — 17 yeni iç içe geçme | süslü gövdeler zincirden düştü · ada sayısı **3 → 2** (bir slot atlayarak) |

**Arka hattın düşey boşluğu dolu** — turun ikinci bulgusu. Süslü tezgâh 2,095 ham (1,89 br)
boyunda; hattın her modülünün üstünde ya duvar dolabı (alt yüzü 1,40) ya çay bardağı rafı
(alt kolu 1,40) var. Yani **geç basamakların kütlesi duvardan gelemez, adadan gelir** —
kullanıcının seçtiği Y1 kolu bu yüzden yalnız güzel değil, zorunlu.

**Bekçinin uygulamayı düzelttiği bir yer daha:** ilk yazımda soğutucuya
`fridge_A → fridge_A_decorated` zinciri konmuştu. Test yakaladı: o zincir L6'yı
`KITCHEN_UNITS`'in ilan ettiği gövdenin **ötesine** taşıyor, yani oda iki ayrı yerde
tanımlanmış oluyordu. Kural artık yazılı ve bekçili: **zincirin son üyesi = ünitenin kendi
anahtarı**, yani **L6 tam olarak bugünkü odadır.** Merdiven odayı büyütmez, oraya nasıl
varıldığını anlatır.

### Uygulanan merdiven

| seviye | bedel | ne değişir | delta |
|---|---|---|---|
| **L1** | 20 ₺ | derme çatma: ocak tek gözlü · hat sırtlıksız · dolaplar yarım · bulaşıklık boş | — |
| **L2** | 30 ₺ | ocak çoğalır · bulaşıklık dolar · doğu tezgâhı sırtlanır | ×0,40 |
| **L3** | 45 ₺ | batı tezgâhı sırtlanır · ilk duvar dolabı tam boya çıkar | ×0,75 |
| **L4** | 800 ₺ | **TEZGÂH**: iki hazırlık tezgâhı + lavabo sırtlanır · **ilk ada kurulur** | ×1,46 |
| **L5** | 2400 ₺ | **TOST**: ikinci duvar dolabı tam boya çıkar · **ikinci ada kurulur** | ×1,58 |
| **L6** | 9000 ₺ | peçetelik rafı donanır · **ilk ada tam donanımına geçer, ikincisi büyür** | ×2,69 |

Basamaklar cümleyle değil **adım kütlesi tablosuyla** yazıldı (§K'daki yeni tablo): "ocak
büyüsün" kulağa büyük geliyor ama `stove_single → stove_multi` adımının ölçüsü **×0,01**
(göz sayısı değişiyor, siluet değil) — o yüzden L2'de yanına iki gövde daha kondu.

---

## §Final koşu (uygulamadan sonra)

| ölçüt | K5 (ölçülen kol) | **K5y (uygulanan)** |
|---|---|---|
| kör basamak | 0 / 5 | **0 / 5** |
| yalnız-detay basamağı | 0 | **0** |
| en zayıf basamağın kütlesi | ×0,80 ünite | ×0,40 ünite |
| basamaklar tek yönlü artıyor mu | hayır | **evet** (×0,40 → 0,75 → 1,46 → 1,58 → 2,69) |
| bedel–değişim uyumu | r = +0,89 | **r = +0,92** |
| yeni çakışma | ölçülmemişti | **0 / 6 seviye** |
| doluluk L1 → L6 | %32 → %43 | **%32 → %42** |

En zayıf basamak K5'ten düşük (×0,40 vs ×0,80) ve bu bir bedel: karşılığında merdiven tek
yönlü akıyor, çakışma sıfır ve gövdelerin hepsi gerçek. ×0,40'lık basamak **L2**, yani
merdivenin **%0,24**'ünü ödeten adım — zayıflığı bedeliyle orantılı.

**Bekçi:** `tests/mutfak-kademe-s22.test.ts` — **24 denetim**, **4 mutasyonla** doğrulandı:

| mutasyon | ne yapıldı | sonuç |
|---|---|---|
| M1 | L2 basamağı boşaltıldı | **3 test kırmızı** (kör basamak · L6 = bugünkü oda · L6 kutuları) |
| M2 | adalar bitişik slota kondu | **2 test kırmızı** (adalar çakışıyor · slot atlama kuralı) |
| M3 | asılı ünite donmuş `y`'sini kullandı | **1 test kırmızı** (üst hiza) |
| M4 | zincir ünitenin kendi anahtarını aştı | **1 test kırmızı** (zincirin son üyesi) |

**Final:** vitest **1075 ✓** · duman **42/42 ✓** · tam ölçüm koşusu **damgalar temiz** ·
konsol hatası **YOK**.

**Kareler:** `docs/gorsel/ss/s22-kademe-L{1..6}.png` (altı basamak, tek kadraj) ·
`s22-ada-L{4,6}.png` (adaların doğuşu ve tam donanımı).
L1'de tek gözlü ocak · yarım dolaplar · boş bulaşıklık · sade raf · boş orta;
L6'da dört gözlü ocak · tam boy dolaplar · dolu bulaşıklık · donanmış raf · iki ada.

### Aracın kendi kusurları (koşu sırasında yakalandı, ikisi de sayıyı değiştirirdi)

| # | kusur | belirti | düzeltme |
|---|---|---|---|
| 1 | gövde kendi kendini örtüyordu | **bütün** deltalar %0 görünür çıktı — S20 aynı odada 0/19 görünmez ölçmüştü | eleme referansla değil GEOMETRİYLE |
| 2 | çok ekli adlar ayrı köke düşüyordu | ocak zinciri **2** kademe göründü (gerçekte 5, süzgeçten sonra 3) | ekler tükenene kadar soyulur |

Bir de **tepeden kare alınamadı** ve bu araç kusuru değil: tepeden kamera oyuncunun üstünde
duruyor, oyuncu da `clampToOpenAreas` yüzünden mutfağın 0,05 br önünde kalıyor (S20 §E).
Mutfağın kuşbakışı planı oyunun içinden çekilemez — o, ölçüm aracının işi.
