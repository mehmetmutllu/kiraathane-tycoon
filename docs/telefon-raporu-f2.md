# F2 — Telefon yükü raporu

**Tur:** Faz F 1/5 · **Tarih:** 2026-09-16 · **Araç:** `tools/olcum-telefon-f2.mjs`
**Ham çıktı:** `docs/olcum-telefon-f2.txt` (TAM koşu, 12 sn/kol)

## Soru

Telefonda ne kadar ağırız ve ağırlığın kaynağı hangi kol — **gölge** mi, **piksel** mi,
**indirilen bayt** mı? Oyun 101 tur boyunca ölçüldü; ölçülmeyen tek yanı cihazdaki maliyetiydi.

## Kapsam damgası — hangi sayı ne kadar sağlam

Kullanıcı kararı (2026-09-16): cihaz bağlanmadı (`adb devices` boş), masaüstünden ölçüldü.
Bu yüzden üç bölüm **aynı güvende değil** ve rapor bunları karıştırmaz:

| Bölüm | Ne ölçüyor | Güven |
|---|---|---|
| §A ölü yük | diskteki bayt ↔ gerçekten istenen bayt | **KESİN** — cihazdan bağımsız |
| §B indirme | üretim çıktısının bayt dökümü | **KESİN** — dosya sisteminden |
| §C kare süresi | gölge/piksel kollarının maliyeti | **VEKİL** — cihazda doğrulanmadı |

§C'yi üreten donanım ham çıktıya yazıldı: `ANGLE (NVIDIA GeForce RTX 3060, D3D11)`, CPU 4×
kısık, 412×915 @ dpr 2,625. **Kollar arası sıralama için yeterli, mutlak ms için değil.**

## Aracın doğrulanması — kısa koşu dört kusur yakaladı

Sayılar rapora girmeden önce araç dört kez çürütüldü. Hepsi kısa koşuda çıktı; tam koşuya
yalnız düzeltilmiş hâli girdi.

| # | Kusur | Belirti | Düzeltme |
|---|---|---|---|
| 1 | **Yazılım GPU'su** | headless Chromium SwiftShader'a düşüyordu; kare süresi 233 ms, dpr kolu %64 "kazanç" gösteriyordu | GPU bayrakları + sürücü adı ham çıktıya yazılır; SwiftShader ise koşu kendini damgalar |
| 2 | **Kollar farklı dünya ölçüyordu** | gölge AÇIKKEN çizim çağrısı 30, KAPALIYKEN 40 — gölge çağrı ekler, azaltmaz | her kol ölçümden önce birebir aynı dünyaya kurulur (24 pad açık, masa L6, oyuncu parkta) |
| 3 | **Tek anlık okuma** | `gl.info.render.calls` kare başına sıfırlanır; rastgele anda okumak kolu değil o kareyi anlatır | her karede okunur, ortancası alınır |
| 4 | **Tohum kayması** | 2 düzeltildikten sonra bile gölge-kapalı kollarda üçgen **%17,2** sapıyordu: yükleme sırası rastgele sayı tüketimini kaydırıyor | `Math.random` tohumlu üreteçle değiştirilir **ve** simülasyondan hemen önce yeniden tohumlanır |

**Tam koşuda bekçilerin hepsi geçti:** üçgen aralığı 227.167…227.167 (**sapma %0,0**) · çizim
çağrısı 143 sabit · NPC nüfusu altı kolda da **31** · altı kolun altısı da **ETKİLİ** (gölge
bayrağı ve harita kenarı metinden değil **renderer'dan** okunuyor — sorgu dizesi doğru yazılıp
kod yolunda kaybolsaydı fark sessizce 0 çıkardı).

---

## §Bulgular

### §A1 — Model paketlerinin yarısına hiçbir kod yolu ulaşamıyor

Model yolları her bileşende **elle yazılı paket klasöründen** kurulur
(`const KAY = '/assets/models/kaykit-furniture-bits/'`). Ortak çözücü **yoktur** — bu aracın
varsayımı değil, `src/`de doğrulanan olgu. Dolayısıyla adı hiçbir kaynak dosyada geçmeyen paket
"kullanılmıyor gibi" değil, **ulaşılamaz**.

| Paket | Bayt | Kodda geçiş |
|---|---|---|
| kaykit-board-game-bits | **9,3 MB** | ❌ **ULAŞILAMAZ** |
| kaykit-characters | 5,9 MB | ✅ |
| kaykit-restaurant-bits | 3,4 MB | ✅ |
| kaykit-city-builder-bits | 1,7 MB | ✅ |
| kaykit-resource-bits | **0,9 MB** | ❌ **ULAŞILAMAZ** |
| kaykit-furniture-bits | 0,8 MB | ✅ |
| kaykit-holiday-bits | **0,5 MB** | ❌ **ULAŞILAMAZ** |
| kaykit-forest-nature | **0,5 MB** | ❌ **ULAŞILAMAZ** |
| kaykit-prototype-bits | 0,1 MB | ✅ |
| kenney-food-kit | 0,0 MB | ✅ |

**Erişilebilir 11,9 MB · ULAŞILAMAZ 11,2 MB (%48,5).**

### §A2 — Dünya TAM açıkken bile 1006 asset dosyasının 898'i hiç istenmiyor

Ölçüm zayıf hâli değil, **en yüklü hâli** ölçtü: 24 pad'in hepsi açık, masaların hepsi L6,
üstüne 30 dakika simülasyon. Bu dünyada tarayıcının istediği her `/assets/` yanıtı sayıldı.

| | Dosya | Bayt |
|---|---|---|
| Diskte | 1.006 | 25,6 MB |
| Gerçekten istenen | **108** | **7,1 MB** |
| **Hiç istenmeyen** | **898** | **18,5 MB (%72,4)** |

İstenen 108 dosyanın paket dağılımı: `furniture-bits` 41 · `restaurant-bits` 37 ·
`city-builder-bits` 15 · `characters` 9 · `prototype-bits` 3 · `kenney-food-kit` 2 · font 1.

**Doku tarafı daha keskin:** diskte **33 PNG / 7,4 MB**, istenen **5 PNG** (her paketin tek
atlası + Kenney'in colormap'i). KayKit paketleri her modelin yanında ayrı ayrı örnek dokular
taşıyor; oyun yalnız paket atlasını kullanıyor.

> **İki sayı iki farklı şey söylüyor, karıştırma:** §A1'in 11,2 MB'ı *bütün paket erişilemez*
> demek (silinmesi risksiz). §A2'nin 18,5 MB'ı *bu koşuda istenmedi* demek — içinde kullanılan
> paketlerin kullanılmayan dosyaları da var ve onlar nadir bir kod yolundan istenebilir.
> §A1 kesin alt sınır, §A2 üst sınır.

### §B1 — Üretim çıktısının %85'i model ve doku

| Tür | Bayt | Pay |
|---|---|---|
| model (glb/gltf/bin) | 15,7 MB | %57,4 |
| doku (png/jpg) | 7,5 MB | %27,5 |
| ses | 1,7 MB | %6,2 |
| javascript | 1,5 MB | %5,4 |
| font | 0,9 MB | %3,3 |
| css + diğer | 0,1 MB | %0,3 |
| **TOPLAM** | **27,4 MB** | |
| **APK (debug, sıkıştırılmış)** | **20,9 MB** | |

Sesin 1,7 MB'ı **tek dosya**: `muzik_salon.ogg` (1.781.451 bayt). Açılışta istenmiyor —
tarayıcı ses kilidi açılınca yükleniyor, yani ölü değil **gecikmeli**. Ses efektleri zaten
sentez (D-096), diskte dosyaları yok.

JS paketi tek parça **1,5 MB** — vite uyarıyor (*"chunks are larger than 500 kB"*), kod-bölme yok.

### §C — Gölgenin VARLIĞI %40, ÇÖZÜNÜRLÜĞÜ sıfır

Altı kol, birebir aynı dünyada (227.167 üçgen, 143 çizim çağrısı, 31 NPC), 12 sn örnekleme.

| Kol | Ortanca | p95 | Tabana fark |
|---|---|---|---|
| **T** taban (soft 2048, dpr bütçesi) | 22,10 ms | 24,60 | — |
| **G0** gölge KAPALI | **13,20 ms** | 14,90 | **−8,90 ms (−%40,3)** |
| **G1** gölge harita 1024 | 22,20 ms | 25,80 | +0,10 ms (+%0,5) |
| **G2** gölge harita 512 | 22,00 ms | 24,80 | −0,10 ms (−%0,5) |
| **P1** dpr tavanı 1 | 22,20 ms | 25,60 | +0,10 ms (+%0,5) |
| **G0+P1** gölge kapalı + dpr 1 | 14,00 ms | 16,30 | −8,10 ms (−%36,7) |

> **Bu tablo TABAN koşusudur** (uygulamadan önce). Uygulamadan sonraki final tam koşu
> gölge kolunu **−8,30 ms / −%37,6** ölçtü (13,80 ms). Fark koşular arası doğal oynama +
> taban kolunun artık açıkça sabitlenmesi: D-125'ten sonra sorgusuz yükleme 'oto' mantığına
> giriyor ve CPU 4× kısıkken ölçer cihazı zayıf ilan edip **örnekleme sırasında** gölgeyi
> kapatabiliyordu — taban kendi kendini kirletirdi. Taban artık `?f2golge=2048` ile pinlenir.

Üç okuma:

1. **Gölgenin bedeli varlığında, çözünürlüğünde değil.** Haritayı 2048 → 512'ye indirmek
   (bellekte 16 MB → 1 MB) kare süresine **hiç dokunmuyor** (−%0,5, gürültü içinde). Yani
   "gölgeyi ucuzlatalım" diye harita küçültmek boş bir kol — maliyet gölge geçişinin kendisinde
   (ekstra derinlik render'ı + her materyalde gölge örneklemesi).
2. **dpr kolu bu donanımda ölçülemedi.** Tampon 1.507.920 → 376.980 piksele indi (**4,00×**
   daha az) ve kare süresi değişmedi. RTX 3060'ta fragment maliyeti bağlayıcı değil. **Bu, dpr
   kolunun ucuz olduğunu göstermez — vekil ölçümün tam da burada kör olduğunu gösterir.**
   Telefon GPU'sunda piksel maliyeti tipik olarak bağlayıcıdır; bu satır cihaz turunu bekliyor.
3. **Açılış süresi:** tuval hazır **6.395 ms** (CPU 4× kısık, dev sunucusu). Üretim derlemesi ve
   gerçek cihaz bu sayıyı değiştirir; yine de 7,1 MB asset + 1,5 MB tek parça JS'in ağırlığını
   gösteriyor.

---

## §Karar (D-125 — kullanıcı, 2026-09-16)

| Kol | Seçim | Gerekçe |
|---|---|---|
| Ölü yük | **A1 — yalnız ulaşılamaz 4 paket silinsin** | 11,2 MB kesin kazanç, risk sıfır. A2 (18,5 MB) elendi: kullanılan paketlerin içindeki dosyalar nadir bir kod yolundan istenebilir. |
| Gölge | **Cihaz sınıfına göre otomatik + Ayarlar düğmesi** | D-073 korunur (gölge kendiliğinden kapanmaz), ama zayıf cihaz %37,6'yı geri alır. |
| Gölge haritası | **ELENDİ** | Ölçüldü: 2048 → 512 kare süresine dokunmuyor (−%0,4). Kol ölü. |
| Kod-bölme | **ELENDİ (araç kararı)** | Capacitor'da her dosya APK'nın içinden yerelden açılır; ağ yok, önbellek yok. Kod-bölmenin kazancı web'e ait, telefona değil. |

## §Uygulama

**1 — Dört ulaşılamaz paket depodan çıkarıldı** (`board-game-bits` 9,3 MB · `resource-bits`
0,9 · `holiday-bits` 0,5 · `forest-nature` 0,5). Manifest (`public/assets/README.md`) geri
alma komutuyla birlikte güncellendi: paketler Kat 2 için önden alınmıştı, Kat 2 v1.1'de.

**2 — Gölge cihaz sınıfına bağlandı** (`src/game/cihazSinifi.ts`). Sınıf `localStorage`ta
durur, **kayıtta değil**: "gölge açık olsun" oyuncunun tercihi (cihazdan cihaza taşınır),
"bu telefon gölgeyi kaldırıyor" ise bu cihazın olgusudur. Tek alanda tutulsalardı güçlü
telefonda "açık" diyen oyuncu, kaydını zayıf telefona taşıdığında takılırdı. Sınıf
`deviceMemory`/`hardwareConcurrency` gibi alanlardan DEĞİL, ilk 60 kare atlanıp sonraki 120
karenin **ortancasından** belirlenir — o alanlar GPU hakkında hiçbir şey söylemez, gölgenin
maliyeti ise GPU maliyetidir. Ayarlar'a "Gölgeler" satırı eklendi; dokunulduğu an tercih
açık hâle gelir ve ölçümü ezer. Ayar `saveVersion` **artırmadan** eklendi (`showFps` emsali).

**3 — `npm run apk` bayat boyut raporluyordu** (yolda bulunan sessiz kusur, aşağıda).

### Ölçülen kazanç — APK

Her iki uç da **temiz** üretimle ölçüldü (aşağıdaki kusur yüzünden):

| | Önce | Sonra | Fark |
|---|---|---|---|
| APK (debug) | 21.946.678 bayt · **20,93 MB** | 12.416.193 bayt · **11,84 MB** | **−9,09 MB (−%43,4)** |
| `dist/` | 27,4 MB | **16,1 MB** | −11,3 MB |
| Model dosyası | 1.002 | **500** | −502 |
| Doku (dist içinde) | 7,5 MB | **0,2 MB** | silinen paketler dokuların çoğunu taşıyormuş |

### Yolda bulunan sessiz kusur — `npm run apk` 9 MB fazla raporluyordu

Asset'ler silindikten sonra `npm run apk` hâlâ **21,88 MB** dedi. Dosya elle silinip yeniden
üretilince gerçek boyut **11,84 MB** çıktı: gradle çıktı APK'sının üzerine yazarken dosyayı
**kısaltmıyor**, 11,66 MB'lık içerik 21,88 MB'lık kabuğun içinde duruyordu (aradaki ~10 MB ölü
boşluk). Bu, yayın gününde yanlış okunacak türden bir kusur — mağaza için "APK ne kadar"
sorusuna 9 MB fazla cevap verilir, küçültme çalışması boşa gitmiş görünürdü. `tools/apk-temizle.mjs`
eklendi ve `npm run apk` zincirine takıldı; artık uçtan uca **11,84 MB** raporluyor.

### Son tam koşu — bekçiler

Altı kolun altısı da **ETKİLİ** (gölge bayrağı ve harita kenarı renderer'dan okunuyor) ·
üçgen 227.167 sabit (**sapma %0,0**) · çizim çağrısı 143 sabit · NPC nüfusu 31 sabit ·
sürücü gerçek GPU. Final sayılar: taban **22,10 ms** · gölge kapalı **13,80 ms**
(**−8,30 ms, −%37,6**) · harita 1024 **%0,0** · harita 512 **+%1,8** · dpr 1 **+%0,9**.

**Aracın kendisi tam koşuda bir kez daha çürüdü:** `?f2dpr=1` kolu "tutmadı" (dpr 1 beklenirken
2 kaldı). Sebep yarıştı — `AdaptiveResolution`ın `setDpr` efekti ile `<Canvas dpr>` prop'u
çakışıyor, hangisinin sonra geldiği montaj sırasına bağlı. Kol prop'a taşındı. **Bunu yakalayan
şey varyant etki denetimidir:** sorgu dizesi doğru yazılmıştı, kod yolunda kayboluyordu; denetim
olmasaydı rapor "dpr'nin faydası yok" diye YANLIŞ bir sonuç yazacaktı.

### Açık kalan — cihaz turu

**dpr kolu bu donanımda ölçülemedi.** Tampon 4,00× küçüldü, kare süresi değişmedi: RTX 3060'ta
fragment maliyeti bağlayıcı değil. Bu, dpr'nin ucuz olduğunu **göstermez** — vekil ölçümün tam
orada kör olduğunu gösterir. Telefon GPU'sunda piksel maliyeti tipik olarak bağlayıcıdır.
**Cihaz turu açık:** telefon bağlanınca §C yeniden koşulmalı ve `ZAYIF_ESIGI_MS` (22 ms) gerçek
cihaz dağılımına göre doğrulanmalıdır.
