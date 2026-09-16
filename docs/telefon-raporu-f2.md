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

## §Karar

*(boş — kullanıcı kararı bekliyor; D-084 adım 3)*

## §Uygulama

*(boş — yalnız kararın kolu; D-084 adım 4)*
