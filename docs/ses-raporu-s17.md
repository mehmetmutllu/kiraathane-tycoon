# S9 (tur S17) — SES ASSETLERİ · ölçüm raporu

**Tur:** S9 ses kalemi — Faz E'nin son kalemi. **Kod yazılmadı.**
**Araçlar:** `tools/olcum-ses-s17.ts` (üç kol) · `tools/olcum-ses-karma.ts` (karma bölüşüm, bu tur eklendi)
**Ham çıktı:** `docs/olcum-ses-s17.txt` · `docs/olcum-ses-karma.txt` — **ikisi de tam koşu damgalı**
**Önceki karar:** D-106 kaynağı **S-C**'ye (tek CC0 sanatçı = Kenney) bağladı; bu tur o kararın
**kapsamını** ölçer. Kaynak künyeleri ve ilk araştırma: `docs/ui-ses-raporu-s9s10.md`.

---

## Turun sorusu

D-106 "Kenney" dedi, ama **hangi sesin dosyadan geleceğini** söylemedi. Kullanıcının cümlesi tekti:

> *"panodaki seslere çok ısınmadım… **para toplama vs güzel coin sesi** gibi olsa güzel olur"*
> ve *"fazla para topladıkça **ses de ivme almalı**, fazla topladığını sezgisel olarak
> hissettirmek için."*

Üç şey açık kaldı: **K** hangi olay dosyadan çalar · **İ** seri ivmesinin basamağı ne kadar ·
**O** ortam uğultusu nereden gelir.

---

## §Bulgular

| # | Bulgu | Sayı |
|---|---|---|
| **B1** | **Envanter** — indirilen CC0 Kenney paketi | **9 paket · 706 `.ogg` · 14,28 MB** · tek sanatçı (S-C korunur) |
| **B2** | **İki KALICI boşluk** (ad taraması, metrikten bağımsız) | akan sıvı **0 aday** · ortam/döngü **0 aday** → **O2 kolu düştü** |
| **B3** | **Dosyalı dokuzlu kimlik matrisini bozmuyor** | **KARIŞIR 0/36 · AYRI 36/36** — sentezin kendi ölçüsüyle aynı hüküm |
| **B4** | **Yükseklik farkı** | dosyalar sentezden **16,6 dB yüksek** · tepesi 0,99 üstü **7/36** aday |
| **B5** | **`aralik` kelepçesi** | seçilen dosyanın **7/9**'u olayın kelepçesini **taşıyor** (coin 0,06 → 0,320 sn) |
| **B6** | **Basamaksız ivme bir basamak değil** | I1 adım↔adım **0,00 dB** — mutlak tabanın (**1,65 dB**) altında, yani kulakta yok |
| **B7** | **Yüksek basamak bandın dışına çıkıyor** | I3 tavanında kısmilerin **3/4'ü 12 kHz üstünde**, **2/4'ü 16 kHz üstünde** |
| **B8** | **Seri kırpılmıyor** | beş toplama 0,16 sn arayla: I1 tepe 0,169 · I2 0,196 · I3 0,188 — **üçünde de kırpılma yok** |
| **B9** | **Motor döngü üretemiyor** | katalogda **9/9 ses tek atış**, döngü alanı **0** → O1 seçilirse motora yeni kabiliyet |
| **B10** | **Ortam yatağının tavanı** | en kısıtlayıcı ses `purchase` → **yatak RMS ≤ 0,0095** (birim yatağın **%10,3'ü**) |
| **B11** | **Karma katalog kimliği bozmuyor** | **beş bölüşümün beşi de 0/36 KARIŞIR** — kimlik bu kararı **seçmiyor** |
| **B12** | **En zayıf çift SENTEZ tarafında ve coin değil** | `quest ↔ level` = **4,06 dB** (×2,46 taban) — K1, K3, K4'te **aynı** çift en zayıf |
| **B13** | **Okunabilirlik kazancı ilerleme ailesinde** | ort. en-yakın-komşu: K1 **6,41** → K4 6,87 → K3 7,28 → K5 **10,10** → K2 **10,97 dB** |
| **B14** | **Tek kazançla normalize edilemez** | gereken kazanç yayılımı **−34,8 … +0,1 dB** (**34,9 dB fark**) → kazanç **ses başına** yazılır |
| **B15** | **Çapraz mesafe geniş** | dosya↔yabancı-sentez en yakını **8,10 dB** (×4,91 taban) — iki kaynak aynı katalogta durabilir |

**B1-B10:** `docs/olcum-ses-s17.txt` · **B11-B15:** `docs/olcum-ses-karma.txt`

---

## Bulguların okunması

### ① Ölçüm turun kendi sorusunu çürüttü: kimlik bu kararı seçmiyor (B3, B11)

Turun kurulduğu varsayım şuydu: *hazır dosyalar kataloğun ayırt matrisini bozarsa giremezler.*
Bozmuyorlar. Dokuzu da dosya olduğunda **36/36 AYRI**; karma bölüşümlerin **beşinde de**
karışan çift **0**. Dosya↔yabancı-sentez en yakın mesafe **8,10 dB**, tabanın neredeyse **beş
katı** — yani bir dosya, başka bir olayın sentezine hiçbir yerde yaklaşmıyor.

Bu bir "geçti" notu değil, bir **eleme aracının boşa çıkması**: K kolu artık kimlikle
seçilemez. Seçen şeyler geriye kalanlar — **okunabilirlik payı**, **APK bedeli**, **süre
kelepçesi** ve **kulak**.

### ② Kullanıcının işaret ettiği ses, kataloğun en zayıf yeri DEĞİL (B12, B13)

Şikâyet `coin` üzerineydi. Ölçüm kataloğun en zayıf çiftini başka yerde buldu:
**`quest` ↔ `level`**, **4,06 dB**. Ve bu çift **K1'de de, K3'te de, K4'te de aynı kalıyor** —
çünkü üçünde de o iki ses sentezden geliyor. Yani yalnız coin'i dosyaya çevirmek (K4)
kataloğun en dar yerine **hiç dokunmuyor**: ortalama en-yakın-komşu 6,41 → 6,87 dB, taban
payı ×2,46'da çakılı kalıyor.

Kazanç, sezginin tersi yerde: **ilerleme ailesinde**. K5 (purchase · padFill · quest · level ·
master · reward dosyadan) ortalamayı **10,10 dB**'ye çıkarıyor ve en zayıf çifti 4,06 → **8,80
dB**'ye taşıyor — coin'e hiç dokunmadan. Dokuzu birden dosya olunca (K2) tavan **10,97 dB**.

Bu, D-080 Tek Odak'ın ses karşılığıyla da çelişmiyor, onu **tersinden** okuyor: fiziksel aile
(coin · pour · serve) sentezde zaten ayrık duruyor, çünkü gürültü temelli. Sıkışan yer, dokuz
sesin yedisinin bir zamanlar yükselen arpej olduğu **tonal** aile (E4 · Bulgu 3'ün kalıntısı).

### ③ Dosyanın bedeli kimlikte değil, SÜREDE ve SEVİYEDE (B4, B5, B14)

İki masraf ölçüldü ve ikisi de kaçınılmaz:

**Süre.** Seçilen dosyaların **7/9**'u olayın `aralik` kelepçesini taşıyor. En sert yer coin:
kelepçe **0,06 sn**, dosya **0,320 sn** — beş katı. Kelepçe dosyanın boyuna çekilirse coin sesi
saniyede 16 kez yerine ~3 kez çalabilir; dosya kelepçeye kırpılırsa **0,26 sn** kesilir, yani
sesin kendisi gider. Üçüncü yol da ölçüldü: coin'in üst üste binmesine **izin vermek** — beş
toplama 0,16 sn arayla üst üste bindiğinde sınırlayıcı sonrası tepe **0,196** ve **kırpılma yok**
(B8). Yığılma burada kusur değil, kullanıcının istediği "ivme" hissinin taşıyıcısı olabilir.

**Seviye.** Dosyalar sentezden ortalama **16,6 dB yüksek** ve **7/36** adayın tepesi 0,99'a
dayanıyor. Ama tek bir kazançla inmiyorlar: gereken kazanç `coin`de **+0,1 dB**, `pour`da
**−34,8 dB** — **34,9 dB'lik** bir yayılım. Yani normalizasyon bir çarpan değil, **katalogda ses
başına yazılan bir sayı**. Bu bir kol değil, ölçümün dayattığı biçim.

### ④ İvme: basamak ya yok, ya da kulağın dışına çıkıyor (B6, B7, B8)

Bugünkü hâl (I1) bir basamak **değil**: adım↔adım fark **0,00 dB**, mutlak tabanın (1,65 dB)
altında. Kullanıcının istediği "fazla topladığını hissettir" bu yüzden hiç doğmuyor.

I2 (+1 yarım ses, tavan 5) adım farkını **2,82 dB**'ye çıkarıyor — tabanın **1,7 katı**, yani
iki ardışık toplama kulakta ayrı perdede. I3 (+2 yarım ses, tavan 8) adımı **4,53 dB** yapıyor
ama tavanda ilk↔tavan farkı **3,18 dB**'ye *düşüyor*, çünkü sesin kısmileri ölçüm bandının
dışına taşıyor: tavanda **3/4 kısmi 12 kHz üstünde, 2/4'ü 16 kHz üstünde**. Yani merdiven
yükseldikçe **duyulan** şey azalıyor — coin'in metalik tınısı tepede kendini kaybediyor.
Kırpılma üç kolda da yok, yani bu bir yükseklik sorunu değil, **tını** sorunu.

### ⑤ Ortam: bir kol ölçümde düştü, kalan ikisi farklı bedel ödüyor (B2, B9, B10)

9 paketin **hiçbiri** ortam/döngü paketi değil (ad taraması: 0 eşleşme). **O2 düştü** —
Kenney'nin içinden ortam sesi çıkmıyor. Geriye:

- **O1 (sentez uğultu):** stil kilidi korunur, lisans yüzeyi 0. Bedel: motor bugün **9/9 tek
  atış** üretiyor, döngü alanı **0** — S16'dan beri ilk **motor genişlemesi**.
- **O3 (tek dosya CC0 istisnası):** motor işi yok. Bedel: lisans yüzeyi **1 sanatçıdan 2'ye**
  çıkar; stil kilidi S19a'da Kenney Food Kit için bir kez açılmıştı, bu ikinci açılış olur.

Hangisi seçilirse seçilsin yatağın tavanı yazılı: dokuz sesin **hepsini** +12 dB üstte tutmak
için **yatak RMS ≤ 0,0095** (en kısıtlayıcı ses `purchase`). Kesin değer kulakla seçilir.

Ayrıca bugün ayarlardaki **"Müzik" anahtarı hiçbir şeye bağlı değil** (`settings.music`
kaydediliyor, okuyan yok — S10 · B9). Ortam kolu ne olursa olsun bu anahtar ya **bağlanır** ya
**kaldırılır**; çalışmayan bir anahtar bırakmak seçenek değil.

---

## Kollar

### K — hangi olay dosyadan çalar (`docs/olcum-ses-karma.txt` §C)

| Kol | Ne | KARIŞIR | en zayıf çift | ort. en-yakın | APK | `aralik` taşan |
|---|---|---|---|---|---|---|
| **K1** | Sentez kalsın (bugünkü · D-096) | 0/36 | **4,06 dB** | 6,41 dB | **0 KB** | 0 |
| **K2** | **Dokuzu da dosya** (S-C harfiyen) | 0/36 | **9,34 dB** | **10,97 dB** | 116,7 KB | **7/9** |
| **K3** | Fiziksel aile dosya (coin·pour·serve) | 0/36 | 4,06 dB | 7,28 dB | 41,0 KB | 3/3 |
| **K4** | Yalnız coin dosya | 0/36 | 4,06 dB | 6,87 dB | 12,8 KB | 1/1 |
| **K5** | İlerleme ailesi dosya (K3 tersi) | 0/36 | 8,80 dB | 10,10 dB | 75,7 KB | 4/6 |

### İ — seri ivmesinin basamağı (`docs/olcum-ses-s17.txt` §5)

| Kol | Ne | adım↔adım | ilk↔tavan | tavan perde | tavana varış | 12 kHz üstü kısmi |
|---|---|---|---|---|---|---|
| **I1** | Basamak yok (bugünkü) | **0,00 dB** | 0,00 | 2200 Hz | — | 1/4 |
| **I2** | +1 yarım ses, tavan 5 | **2,82 dB** | **5,90** | 2937 Hz | 0,30 sn | 2/4 |
| **I3** | +2 yarım ses, tavan 8 | 4,53 dB | 3,18 | 5544 Hz | 0,48 sn | **3/4** |

### O — ortam uğultusu (`docs/olcum-ses-s17.txt` §6)

| Kol | Ne | Stil kilidi | Motor işi | Aday |
|---|---|---|---|---|
| ~~O2~~ | ~~Kenney içinden döngü~~ | — | — | **0 — KOL DÜŞTÜ** |
| **O1** | Sentez uğultu (döngü kabiliyeti eklenir) | korunur | **var** (ilk döngü kaynağı) | kod |
| **O3** | Tek dosya CC0 istisnası | **1 → 2 sanatçı** | yok | dış |
| **O4** | Bu turda ortam yok, "Müzik" anahtarı kaldırılır | korunur | yok | — |

### A — `aralik` taşması nasıl kapanır (`docs/olcum-ses-karma.txt` §E)

| Kol | Ne | coin'de sonucu |
|---|---|---|
| **A1** | `aralik` dosyanın kendi süresine çıkar | 0,06 → **0,32 sn** · üst üste binme yok, seri seyrekleşir |
| **A2** | Dosya `aralik`a kırpılır | coin'den **0,26 sn** kesilir — sesin gövdesi gider |
| **A3** | Kelepçe coin'de bilerek gevşek kalır, yığılmaya izin verilir | 5 çakışmada tepe **0,196**, kırpılma **yok** (B8) |

### Ölçümün zaten kapattığı iki soru (kol değil)

- **Normalizasyon ses başına yazılır** — tek kazanç 34,9 dB'lik yayılımı kapatamaz (B14).
- **O2 elendi** — Kenney'de ortam/döngü adayı yok (B2).

---

## §Karar — D-122

**K1 + I2 + A3 + O4**, artı yeni kol **O5** (arka plan müziği). Künye: `decisions.md` **D-122**.

| Kol | Seçilen | Ölçümün önerisi | Fark neden |
|---|---|---|---|
| **K** | **K1** sentez kalır | K2 (dokuzu da dosya) | Kullanıcı `pour` dosyasını KULAKTA reddetti: *"ocaktan çay alma kötü"*. Tek sesin düşmesi bütün paketi düşürdü. |
| **İ** | **I2** +1 yarım ses, tavan 5 | I2 | — |
| **A** | **A3** yığılmaya izin | A3 | — |
| **O** | **O4** ortam yok | O1 | *"uğultu da hiç olmasın"* |
| **O5** | *(açık)* arka plan müziği | Troubadeck 04 | Parça seçimi kullanıcıda |

**Kaynak kolunun dersi:** ölçüm kolları **ayırdı ama seçmedi**. Dokuz sesin dokuzu bir pakette
gelir; bir tanesi beğenilmezse paketin tamamı düşer. Yani kaynak sorusu "en iyi ortalama" değil,
**"en kötü üyesi ne"** sorusuydu — tablo bunu göstermiyordu. Bir sonraki asset turu kolu böyle
kurmalı.

**Ödenmeyen kazanç yazılı:** K1'de katalog 6,41 dB'lik okunabilirlikte kalıyor, en zayıf çift
`quest`↔`level` = **4,06 dB**. K2 bunu 9,34'e taşıyordu. Bedel bilerek ödenmedi ve kol geri
alınabilir: `dosya` üstüne yazma yolu duruyor, **seri ivmesini de taşıyor**.

---

## §Bulgular — O5 (arka plan müziği, `docs/olcum-muzik-s9.txt`)

| # | Bulgu | Sayı |
|---|---|---|
| **B16** | **Künyeden eleme** — bundle kendi verisini taşıyor | **253 parça** · profil süzgecini geçen **24** · indirilip çözülen **23** |
| **B17** | **Tavan kazanç dar** — müzik kısılmak zorunda | **−18,0 … −36,1 dB** · kısıtlayan ses hep `level` (bant 9) ya da `pour` (bant 10) |
| **B18** | **En "doğru" aday ölçümde SONUNCU** | Interior Birdecorator (gerçek oyun müziği, puan 5) → **−36,1 dB**, kalan RMS **0,00200** |
| **B19** | **Kazanan bir lavta parçası** | Troubadeck 04 → **−18,0 dB**, kalan RMS **0,01149** = dokuz sesin ort. RMS'inin **%59'u** |
| **B20** | **Dikiş kalitesi paket içinde bile değişiyor** | sıçrama 0,0027 … **0,2907** · baş/son seviye farkı +2,6 … **−14,5 dB** |
| **B21** | **Türkçe/Anadolu tınısı: temiz CC0 YOK** | saz/bağlama/ud → abonelikli kütüphane ya da lisansı belirsiz kullanıcı yüklemesi · en yakın komşu tek `desert` parçası |

**Kapsam sınırı:** `2024-q4` paketi indirilmedi → profili tutan **2 aday ölçülmedi** (biri
besteci puanı 5, 75,8 sn jazz).

---

## §Bekçi

`tests/seri-ivmesi-s9.test.ts` — **24 denetim**, sekiz blok: katalog · merdiven · kesilme ·
kelepçe etkileşimi · kaynaktan bağımsızlık · perdelemenin gerçekten uygulanması · tek kaynak ·
kol A3.

`tools/mutasyon-seri-s9.mjs` — **16/16 kırmızı, kaçan 0**. Mutasyon listesi bilerek iki ayrı
parçayı hedefliyor: sayacı (M1-M5, M12-M15) ve perdelemeyi (M6-M11). Biri doğru olup diğeri hiç
çalışmayabilirdi — motor basamağı doğru sayıp `perdele` hiçbir şey yapmasa bütün çalmalar aynı
perdeden çıkar ve "sayaç" testleri yine yeşil kalırdı.

**Kaçan mutasyon zayıf yeri gösterdi (D-085):** M16 (taslak kendi perdeleme kopyasını geri
alıyor) ilk turda KAÇTI — denetim `import`un **adına** bakıyordu, **kullanımına** değil. Bu,
S23'ün `toMatch(/FloorPatch/)` kusurunun birebir aynısı: import satırı yerinde dururken çağrı
satır içi bir kopyayla değiştirilebiliyordu. Denetim çağrının kendisine bağlandı.

**Final:** tsc temiz · vitest **1126** ✓ · duman 42/42 ✓ · `economy.config.ts` 0 satır.
