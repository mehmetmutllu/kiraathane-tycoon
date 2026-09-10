# S5 — Dekor KayKit'e geçer mi? (ÖLÇÜM RAPORU)

Ham çıktı: `docs/olcum-dekor.txt` · araç: `tools/olcum-dekor.ts` (`npx tsx tools/olcum-dekor.ts`)
Tarih: 2026-09-10 · karakter boyu **1,75** · `WALL_H` **3,20** · lambri çıtası **0,98**

> Ölçüm commit'i `3938163` (karar bölümü boştu) → karar paketi → uygulama commit'i.
> Karar **D-101**, `memory-bank/decisions.md`.

---

## Soru

Elle çizilen 17 dekor parçasının hangileri KayKit karşılığına geçebilir — **ölçüsü, biçimi,
ayak izi, duvar bandı ve rengi** oyunun bandına oturuyor mu?

Faz S planı (`docs/plan-faz-s-sanat.md`) sekiz parça sayıyordu: `trash_A/B` · `lamp_standing` ·
`lamp_table` · `rug_*` · `pictureframe_*` · `cabinet_*` · `cactus_*`. Bu liste **model adlarına
bakılarak** yazıldı, ölçüye bakılarak değil. Ölçüm o listeyi doğrulamak için var.

## Yöntem — ve yöntemin kendi iki hatası

Araç üç şeyi modelin **kendi gltf'inden** okur (elle tahmin yok): sınır kutusu (`model-olc.mjs`),
atlas gözü (`atlas-goz.mjs`), gözün gerçek rengi (`atlas-renk.mjs`).

**İlk koşu iki kez yanlış ölçtü ve düzeltildi** (S4'ün "ölçüm yöntemi de ölçülmeli" dersi):

1. **Düz parçada boy karşılaştırması sahte sapma üretiyor.** Paspas 1,2 cm kalın, `rug_*` 10 cm;
   araç "+%650" yazıyordu ve bu hiçbir şey anlatmıyor. Düz parçada ölçek **ENDEN** türetilir,
   uyum **ayak izinden** okunur. `gerçek boy` kolu da enden hesaplanmazsa 13,50 br'lik halı
   çıkıyordu (0,45 m "boy"a çekilmiş 3,0 br'lik model).
2. **Biçim oranı hiç ölçülmemişti.** Ölçek her zaman ayarlanabilir, **biçim ayarlanamaz.** Bir
   adayın en/boy oranı gerçeğinden uzaksa o model o eşya değildir ve hangi ölçeğe konursa konsun
   yanlış okunur. Oran sütunu eklendikten sonra planın iki maddesi **elendi** (B1, B5).

**Üç ölçek kolu her aday için hesaplandı:**

| kol | tanım | gerekçe |
|---|---|---|
| **K1 0,90** | mobilya ölçeği (`KITCHEN_S` = `STOOL_S`) | mutfak ve masalar bu sayıda donmuş; hattın ritmi |
| **K2 fit** | bugünkü parçanın boyuna çek | ekranda hiçbir şey yerinden oynamaz |
| **K3 gerçek boy** | gerçek eşya boyuna çek | `KASA_S = 0,45` deseni (S3: modül karosu ölçek değildir) |

---

## §Bulgular

### B0 — Paket ölçeği: furniture ≡ restaurant (0,90 geçerli); **city AYRI ölçekte**

| paket | model | ham en | gerçek en | ham/gerçek |
|---|---|---|---|---|
| restaurant-bits | `chair_A` | 0,750 | 0,45 | ×1,67 |
| furniture-bits | `chair_A` | **0,750** | 0,45 | **×1,67** |
| city-builder-bits | `bench` | 0,400 | 1,50 | ×0,27 |
| city-builder-bits | `firehydrant` | 0,135 | 0,32 | ×0,42 |
| city-builder-bits | `dumpster` | 0,566 | 1,80 | ×0,31 |

`chair_A` iki mobilya paketinde **birebir aynı** (0,750) → S3'ün dondurduğu **0,90** dekor için de
geçerli, yeni ölçek türetmeye gerek yok. **City paketi bunun ~1/5'inde yazılmış** (sokak
mobilyası gerçeğin ~1/4'ü): city modeline 0,90 uygulanamaz, kendi çarpanı gerekir. Bu sayı
S6'yı (dış cephe) da doğrudan bağlar — bina/yol/aydınlatma aynı paketten gelecek.

### B1 — `trash_A/B` çöp kovası **DEĞİL**: 18 üçgenlik yer çöpü

Planın ilk maddesi ölçümde düştü:

| model | ham en × boy × der | oran en/boy | kova oranı | mesh | üçgen |
|---|---|---|---|---|---|
| `trash_A` | 0,127 × **0,052** × 0,133 | 2,42 | 0,46 | `Icosphere.020` | **18** |
| `trash_B` | 0,068 × **0,040** × 0,071 | 1,69 | 0,46 | `Icosphere.021` | **18** |
| `dumpster` | 0,566 × 0,317 × 0,353 | 1,78 | 1,50 (konteyner) | `Cube.928` | 126 |

`trash_A/B` **enden geniş, boydan 5 cm**: bir kova değil, yerde duran buruşuk çöp. Geometri de
söylüyor (18 üçgenlik ikosfer). `dumpster` gerçek bir konteynerdir (oran 1,78 ↔ gerçek 1,50 ✓)
ama **iç mekân kovası değildir**: kova oranı 0,46 (boydan uzun), konteyner 1,78 (enden geniş) —
**3,9 kat** fark. Kova boyuna çekilirse 1,16 × 0,65 br'lik yayvan bir kutu oluyor.

**Üç paket tarandı; iç mekân çöp kovası karşılığı hiçbirinde yok.** Elle çizilen kova
(0,42 × 0,66 · gerçeğin ×1,02'si, `docs/olcum-dekor.txt` §A) bugünkü hâliyle ölçüsü **doğru**
olan parçadır.

### B2 — `lamp_standing` 0,90'da **karakterin %130'u**; iki alt kol var

| kol | ölçek | dünya en × boy | insan oranı | bugünküyle fark |
|---|---|---|---|---|
| K1 | 0,90 | 0,90 × **2,27** | **%130** | **+%56** |
| K2 fit | 0,575 | 0,58 × 1,45 | %83 | 0 |
| K3 gerçek | 0,615 | 0,62 × 1,55 | %89 | +%7 |

Biçim oranı **0,40 ↔ gerçek 0,29** — abajur payı; lamba lambadır, sorun ölçek. 0,90'da lamba
insandan uzun bir direk oluyor. K3 (0,615) hem gerçek lamba boyunda hem bugünkünün %7'sinde.
**Bu, "her şeye 0,90" kolunun ilk kanıtlı kırılma noktası.**

### B3 — `cabinet_medium` konsolun yerine oturuyor ve eni **tam bir mutfak modülü**

| aday | ham en×boy×der | oran ↔ gerçek | K1 dünya (en×boy×der) | insan | bugünküyle |
|---|---|---|---|---|---|
| `cabinet_medium` | 2,000 × 1,000 × 1,002 | 2,00 ↔ 1,75 ✓ | **1,80 × 0,90 × 0,90** | %51 | −%24 |
| `cabinet_medium_decorated` | 2,042 × 1,827 × 1,002 | 1,12 ↔ 1,75 | 1,84 × 1,64 × 0,90 | %94 | +%38 |
| `cabinet_small` | 1,000 × 1,000 × 1,002 | 1,00 ↔ 0,87 ✓ | 0,90 × 0,90 × 0,90 | %51 | −%24 |
| `cabinet_small_decorated` | 1,048 × 1,618 × 1,104 | 0,65 ↔ 0,87 | 0,94 × 1,46 × 0,99 | %83 | +%22 |
| `shelf_B_large_decorated` | 2,000 × 0,818 × 0,500 | 2,45 ↔ 3,50 | 1,80 × 0,74 × 0,45 | %42 | −%38 |

`cabinet_medium` **1,80 br** = `kitchenLook.MODULE_W` (2,0 × 0,90) — dekor mutfağın ızgara adımını
paylaşıyor, ayrı ritim doğmuyor. Ama bugünkü konsol yuvası **3,00 br**: bir dolap 1,20 boşluk
bırakır, `medium + small` 2,70 (0,30 boşluk), iki `medium` 3,60 (yuvayı 0,60 aşar).

**`_decorated` çiftler dolabın üstündeki eşyayı MODELE gömüyor** (boy 1,00 → 1,83) — bugünkü
konsolun üstündeki radyo/tepsi/saksı dizilişinin karşılığı, ama artık seçilemez: paket ne
koyduysa o. Oran da bozuluyor (1,12 ↔ 1,75).

**Odaya taşma:** dolap derinliği 0,90 ↔ bugünkü 0,51 = **+%77**. Kamera yan duvarı neredeyse
profilden görür (D-068), yani taşma **okunurluğu artırır**; ama koridordan 0,39 br yer alır.

### B4 — `pictureframe_*` tablonun yerine oturuyor, üçü bandın ortasında

Bugünkü tablo **1,20 × 0,42** (oran 2,86 ↔ gerçek 1,33 — bugünkü çizim gerçekten fazla yayvan).

| aday | K1 dünya en×boy | oran ↔ gerçek | asma 1,95'te alt/üst kenar | çıta payı | tepe payı |
|---|---|---|---|---|---|
| `pictureframe_large_B` | 1,80 × 1,08 | 1,67 ↔ 1,71 ✓ | 1,41 / 2,49 | 0,43 | 0,71 |
| `pictureframe_large_A` | 0,91 × 1,08 | 0,84 ↔ 0,78 ✓ | 1,41 / 2,49 | 0,43 | 0,71 |
| `pictureframe_medium` | 0,63 × 0,81 | 0,78 ↔ 0,80 ✓ | 1,54 / 2,36 | 0,56 | 0,84 |
| `pictureframe_small_B` | 0,63 × 0,40 | 1,59 ↔ 1,43 ✓ | 1,75 / 2,15 | 0,77 | 1,05 |
| `pictureframe_small_C` | 0,45 × 0,45 | 1,00 ↔ 1,00 ✓ | 1,72 / 2,18 | 0,74 | 1,02 |

**Altı adayın hepsi bandın içinde; hiçbiri lambri çıtasına inmiyor, hiçbiri duvarın tepesini
aşmıyor.** En sıkışığı `large` ve orada bile 0,43 + 0,71 pay var. Biçim oranları da gerçeğine
oturuyor (S4'te duvarın düştüğü yer buydu; çerçeveler düşmüyor).

**Duvardan çıkıntı 0,18 ↔ bugünkü 0,05 = +%260.** Yan duvar profilden görüldüğü için bu
**istenen yönde**: B6a'nın kendi notu ("odaya taşmayan aplik hiç okunmuyor") aynı şeyi söylüyor.

### B5 — `cactus_*` "saksı" değil **kaktüs**: biçim oranı 2,4–2,8 kat sapıyor

| aday | K1 dünya | oran en/boy | saksı bitkisi oranı | bayrak |
|---|---|---|---|---|
| `cactus_small_A/B` | 0,45 × 0,50 | 0,91 | 0,37 | **×2,5** |
| `cactus_medium_A/B` | 0,79 × 0,74 | 1,06 | 0,38 | **×2,8** |
| `bush` (city) | 0,17 × 0,34 | 0,50 | 1,00 (çalı) | ×2,0 (ölçek de yanlış paket) |

Bugünkü saksı **ince ve yukarı**, kaktüs **yayvan ve yuvarlak**. Ölçek ne olursa olsun okunuş
değişir: kaktüs bir ficus/sansevieria değil. Üç pakette **yaprak bitkisi yok**. Bu bir ölçü
sorunu değil **kimlik** sorunu: "kıraathanede kaktüs" bir stil kararıdır (`feedback_color_variety`
paketin canlı paletini korumayı söylüyor, ama bitkinin türünü değiştirmeyi söylemiyor).

`cactus_medium` **koridor saksısının yerine boy olarak** yakın (0,74 ↔ 1,15 = −%35); `cactus_small`
denizlik/köşe saksısı ölçüsünde (0,50).

**Üç pakette bitki/kova taraması yapıldı** (`plant|flower|pot|tree|bush|leaf|cact|vase|jar|bin|
trash|waste|basket|bucket|barrel|can`): yaprak bitkisi **yok**, iç mekân kovası **yok**. Çıkan tek
alternatif gövde `jar_D_large` (0,500 × 0,750 × 0,500 → 0,90'da **0,45 × 0,68**, saksı gövdesi
oranında) — ama "küp + kaktüs" bir **birleşim**dir ve D-100 birleşimin onaysız çoğaltılmayacağını
söylüyor. Ölçü olarak duruyor, karar paketinde bir kol; kurulmadı.

### B6 — `rug_*` paspas yuvasına **neredeyse birebir** oturuyor (en −%4)

| aday | ham en×der | K1 dünya en×der | bugünkü paspas | fark |
|---|---|---|---|---|
| `rug_rectangle_A/B` · `_stripes_A/B` · `rug_oval_A/B` | 3,000 × 2,000 | **2,70 × 1,80** | 2,80 × 1,20 | en −%4 · **der +%50** |

Altı halının **hepsi aynı ham kutuda** (3,0 × 2,0) — fark yalnız dokuda: `rug_rectangle` düz,
`_stripes` çizgili, `rug_oval` oval. Oran 1,50 ↔ kapı paspası 1,67: en uyumlu düz parça.

**Ama derinlik +%50:** paspas odaya 1,20 → 1,80 br sokuluyor. Ölçümün yan bulgusu şu:
**bugünkü paspas gerçeğin 3,7 katı** (2,80 br ↔ gerçek kapı paspası 0,75 m) — yani bugünkü
"paspas" zaten kapı paspası değil bir **koridor kilimi**. Bu, "HALI YOK" kuralıyla (kullanıcı üç
kez reddetti; `config/decor.ts` başlığı) sürtünen bir sayıdır: kural halıyı reddetti, ama zeminde
duran şey ölçüsüyle halı.

### B7 — `gazetelik` karşılığı: `shelf_B_small_decorated` boyu **birebir** tutuyor

| aday | K1 dünya en×boy×der | oran ↔ gerçek | bugünküyle |
|---|---|---|---|
| `shelf_B_small_decorated` | 0,90 × 0,91 × 0,51 | 0,99 ↔ 1,07 ✓ | **+%1** |
| `shelf_A_small` | 0,90 × 0,36 × 0,45 | 2,50 ↔ 2,67 ✓ | −%60 (duvar rafı, ayaklı değil) |
| `book_set` | 0,70 × 0,45 × 0,33 | 1,56 ↔ 1,20 | −%50 (üstüne konan eşya) |

`shelf_B_small_decorated` 0,90'da bugünkü gazeteliğin **%1** farkında (0,91 ↔ 0,90) ve oranı da
oturuyor. Ama bir **kitaplık**tır, eğik gazete rafı değil: gazete/dergi sinyali modelde yok.

### B8 — `lamp_table` yeni bir parça; 0,90'da masa lambası değil, **yer lambası** olur

`lamp_table` ham 1,000 × 1,022 → K1'de **0,90 × 0,92**: bir masa lambası için absürt (gerçek
0,32 × 0,45). K3'te 0,44 × 0,45 — gerçek boyunda. Konsol tablası bugün **0,75**'te; K3 lambası
oraya konursa tepe **1,20**, konsolun bugünkü toplam boyunun (1,19) hemen üstünde. Yeri var.

### B9 — AYAK İZİ: hiçbir kolda eşik ihlali yok; en dar açıklık **0,51 br**

Bugünkü bekçi (`tests/layout-b6a.test.ts`) dekoru yalnız **merkez noktasıyla** denetliyor: "saksının
merkezi pad'den 1,3'ten uzak mı". Model geçince merkez aynı kalıp **gövde büyüyebilir** ve bekçi
yeşil kalır. Bu ölçüm açıklıkları **gövde kenarından** aldı (15 örnek, `areasOpen = 3`):

| parça | konum | bugün açıklık | K1 (en büyük aday) | fark | en yakını |
|---|---|---|---|---|---|
| `buyukSaksi` | [−3,0 · 10,4] | 0,61 | **0,51** | −0,10 | pad `zone2` |
| `saksi` | [−3,0 · 6,6] | 0,70 | 0,74 | +0,04 | pad `zone2` |
| `buyukSaksi` | [3,0 · 10,4] | 1,08 | 0,98 | −0,10 | masa katısı |
| `copKovasi` | [−3,2 · 16,2] | 1,05 | 1,05 | 0,00 | masa 1 noktası |
| `paspas` | [0,0 · 16,1] | 1,35 | 1,25 | −0,10 | masa 1 noktası |
| `tablo` | [−17,3 · 6,0] | 3,76 | 3,46 | −0,30 | pad `table3` |
| `konsol` | [−17,1 · 6,0] | 2,63 | **3,17** | **+0,54** | pad `table3` |

**Sonuç: ihlal yok.** En kötü hâl koridor saksısının 0,51 br'si (pad kenarına), en büyük kayıp
0,30 br. Konsol **kazanıyor** (+0,54), çünkü `cabinet_medium` bugünkü 3,08 br'lik konsoldan dar.
Yani ayak izi kolu bu turda bir engel değil — ama bekçiye girmesi gereken bir ölçüttür (bugün
yok, ve bugün olmadığı için bu sayılar hiçbir yerde tutulmuyor).

### B10 — RENK: adaylar paketin **kendi** paletinde; kıraathane tonu için boyama gerekmiyor

Gözler ve gözlerin **ölçülen** rengi (tahmin yok — D-100 dersi):

| aday | baskın gözler (ölçülen hex) |
|---|---|
| `cabinet_medium` | `[0,4]` #b27052 · `[0,0]` #995842 · `[0,5]` #daae7d |
| `pictureframe_*` (altısı da) | `[0,3]` #b27052 · `[0,7]` #d5dcdf |
| `lamp_standing` | `[2,1]` #ddd2c6 · `[0,6]` #828c91 · `[2,0]` #d5dcdf |
| `lamp_table` | `[2,1]` #ddd2c6 · `[1,2]` **#63a0d0** (mavi) |
| `rug_rectangle_A` / `_stripes_A` / `oval_A` | `[1,0]` **#f9aa4f** (turuncu) |
| `rug_rectangle_B` / `_stripes_B` / `oval_B` | `[1,2]` **#63a0d0** (mavi) |
| `cactus_small_A` | `[2,7]` #53ab47 · `[1,7]` #bf5f30 (toprak saksı) |
| `shelf_B_small_decorated` | `[0,3]` #b27052 · `[2,6]` #66b46e · `[1,7]` #bf5f30 · `[1,0]` #f9aa4f |
| `dumpster` | `[2,2]` #008754 · `[0,4]` #343434 |

Dolap ve çerçeveler **mutfağın kullandığı kahve gözlerinde** (#b27052 · #995842) → hat ile tek
dilde. Halının **iki renk kolu var** (A turuncu · B mavi) ve `atlasUV.gozDegistir` hazır: renk
atlas kopyalamadan seçilebilir. `feedback_color_variety` "her şey kahve olmasın" diyor; halının
A/B kolu bunun bedava karşılığı.

---

## Kolların özeti (karar paketi bu tablodan çıkar)

| # | parça | en uygun aday | en uygun ölçek | ölçülen engel |
|---|---|---|---|---|
| 1 | çöp kovası ×2 | **yok** | — | `trash_A/B` yer çöpü (B1); `dumpster` oran ×3,9 |
| 2 | ayaklı lamba ×2 | `lamp_standing` | **K3 0,615** | 0,90'da insanın %130'u (B2) |
| 3 | konsol ×1 | `cabinet_medium` (+`cabinet_small`?) | K1 0,90 | yuva 3,00 ↔ dolap 1,80; derinlik +%77 (B3) |
| 4 | tablo ×1 | `pictureframe_large_B` / `_medium` | K1 0,90 | yok — altısı da bantta (B4) |
| 5 | saksı ×3 + büyük ×4 + denizlik ×2 | `cactus_medium` / `_small` | K1 0,90 | **kimlik**: kaktüs ≠ yaprak bitkisi (B5) |
| 6 | paspas ×1 | `rug_*` (A turuncu / B mavi) | K1 0,90 | derinlik +%50; "HALI YOK" kuralıyla sürtünme (B6) |
| 7 | gazetelik ×1 | `shelf_B_small_decorated` | K1 0,90 | kitaplık, gazete sinyali yok (B7) |
| 8 | konsol üstü (yeni) | `lamp_table` | **K3 0,44** | 0,90'da yer lambası olur (B8) |

**Ölçek kolu kapanıyor:** K1 (0,90) sekiz parçanın **altısında** doğru; iki lambada (B2, B8)
K3 gerekiyor — yani S3'ün kasa dersi burada da geçerli ve kural şudur: *mobilya 0,90, aydınlatma
gerçek boy.*

---

## Karar (D-101 — kullanıcı, 2026-09-10)

| kalem | karar | kim seçti |
|---|---|---|
| çöp kovası ×2 | **elle kalır** — aday yok | ölçüm eledi (B1) |
| ayaklı lamba ×2 | `lamp_standing` @ **K3 0,615** | ölçüm (B2), kullanıcı itiraz etmedi |
| konsol ×1 | `cabinet_medium` + `cabinet_small` @ K1 | ölçüm (B3), kullanıcı itiraz etmedi |
| tablo ×1 | `pictureframe_large_A` @ K1 | ölçüm (B4), kullanıcı itiraz etmedi |
| saksı ×3 · büyük ×4 · denizlik ×2 | **kaktüs GEÇSİN** — `cactus_medium/small` | **kullanıcı** (kimlik kararı) |
| paspas ×1 | `rug_rectangle_B` — **MAVİ** | **kullanıcı** (renk kolu) |
| gazetelik ×1 | `shelf_B_small_decorated` — kitaplığa geçsin | **kullanıcı** |
| konsol üstü | `lamp_table` @ **K3 0,44** | ölçüm (B8), kullanıcı itiraz etmedi |
| S4'ün iki sözü | **kendi turunda kalır** | **kullanıcı** |

**Ölçek kuralı yazıldı:** *mobilya 0,90 · aydınlatma gerçek boy.* S3 bunu kasa için bulmuştu
(`KASA_S`); dekorda iki kez daha ısırdı ve artık bir kural, bir tesadüf değil.

## Uygulama

- **Yeni `src/components/three/decorLook.ts`** — dekorun ölçü/ankraj katmanı (`tableLook` ·
  `kitchenLook` deseni). `NATIVE` ham kutular, üç ölçek sabiti, `DECOR_MODELS` eşlemesi,
  `parcaYerlesim` (sırt/origin telafisi), `turKutu`/`turDunyaKutu`/`govdeMesafe` (ayak izi),
  `asmaKenar` (bant), `varyant` (A/B kaktüs).
- **`Decor.tsx`** — `Model` ile yükleme; **elle çizimler silinmedi, fallback oldu**. Dosyada
  hâlâ tek koordinat yok, tek karar da yok: eşleme `decorLook`ta.
- **`config/decor.ts`** — gazetelik zeminden asma bandına taşındı (`WALL_FACE`, `MOUNT.mid`),
  çünkü ölçüm `shelf_B_small_decorated`ın **duvar rafı** olduğunu söyledi (`minZ = 0`).
- **Denizliğin derinliği (0,30) tek kaynağa çıktı** (`DENIZLIK_DERINLIK`): `Pencere` çizimi de,
  denizlik saksısının sığma bekçisi de artık aynı sayıyı okuyor.
- **Kaktüsler A/B dönüşümlü** — dokuz saksı aynı modelin kopyası değil; paketin kendi iki yeşili.

## Bekçi

`tests/decor-look.test.ts` — **20 test**, altısı yeni ölçütü (gövde kenarı) taşıyor.
**Sekiz mutasyon** çalıştırıldı:

| # | mutasyon | sonuç |
|---|---|---|
| M1 | aydınlatma ölçeği 0,90'a döner | yakalandı (ölçek + insan oranı) |
| M2 | duvar sırtı telafisi kalkar | yakalandı |
| M3 | kitaplık üst hiza ankrajı ters döner | yakalandı |
| M4 | ikinci dolap yuvadan taşar | yakalandı |
| M5 | elenen çöp kovası listeye geri girer | yakalandı |
| M6 | denizlik saksısı 0,90'a çıkar | **KAÇTI** → bekçi düzeltildi, sonra yakalandı |
| M7 | gövde kutusu dönüşe göre eksen değiştirmez | yakalandı |
| M8 | denizlik derinliği sessizce büyür | yakalandı |

**M6'nın gösterdiği zayıf yer** (`feedback_session_flow`: kaçan mutasyon kodun zayıf yerini
gösterir): bekçi `DENIZLIK_S` **sabitini** denetliyordu, o sabitin **kullanımını** değil — liste
0,90'a çevrilince test yeşil kalıyordu. Daha derin sorun şuydu: saksının denizliğe *sığdığı*
hiçbir yerde ölçülmüyordu; denizliğin derinliği `Decor.tsx`te gömülü bir 0,3'tü. Ölçüt artık
gövdenin denizliğe sığması ve sayı tek kaynakta.

**Bekçi kod yazılırken bir hatayı da yakaladı** (gözle değil): halının ayak izi testi yanlış
alarm verdi çünkü ölçütüm gövdeyi **disk** sanıyordu (köşe yarıçapı 1,62). Halının uzun kenarına
dik yönde gövde yalnız 0,90 br; gerçek mesafe 1,35 br. Ölçüt kutuya çevrildi.

## Final koşu

`tsc -b` temiz · vitest **818** (798 → +20) · duman **42/42**, konsol hatası yok ·
görsel doğrulama `docs/gorsel/ss/s5-dekor-*.png` (5 kadraj, `tools/shot-dekor-s5.mjs`).
