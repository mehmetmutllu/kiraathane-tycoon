# F1b — KABUĞUN YÜZÜ raporu

**Tur:** F1b (pano kalemi F6) · Faz F · 2026-09-17
**Araçlar:** `tools/olcum-kabuk-f1b.mjs` (ölçüm) · `tools/shot-kabuk-f1b.mjs` + `tools/ikon-adaylari.html` (kareler)
**Ham çıktı:** `docs/olcum-kabuk-f1b.txt` (TAM koşu damgalı)
**Kareler:** `docs/gorsel/ss/f1b-*.png`

> **Bu rapor commit #1'de KARAR BÖLÜMÜ BOŞ olarak yayımlanır** (D-084 sıra kilidi).
> Karar paketi kullanıcıya sunulup kol seçildikten sonra §Karar ve §Uygulama doldurulur.

---

## SORU

Mağazaya gidecek kabuğun **yüzü** — cihazda görünen İKON, açılışta görünen EKRAN ve oyunun
kilitleneceği EKRAN YÖNÜ. Üçü de bugün ya Capacitor varsayılanı ya kararsız. Hangi kol ne kadar
**okunuyor**, ne kadar **bayt** ve ne kadar **risk** getiriyor?

---

## KAPSAM DAMGASI — bölümlerin güveni aynı değil

Cihaz bağlı değil. Üç bölüm aynı güvende değil ve rapor bunu ayırmak zorunda (F2'nin damgasının
aynısı, aynı sebeple):

| Bölüm | Güven | Neden |
|---|---|---|
| **§A** kaynak dökümü | **KESİN** | Diskteki dosya, baytı, piksel ölçüsü + Capacitor şablonuyla bayt bayt karşılaştırma. Cihazdan bağımsız. |
| **§B** ekran yönü | **KESİN ama VEKİL EKRANDA** | Ölçülen şey "telefonda güzel mi" değil; *bu oranda kaç br² zemin ve kaç ankraj kadraja giriyor, HUD bunun ne kadarını yiyor.* Bunlar orana bağlı **geometrik** büyüklükler, masaüstü tarayıcıda da gerçek. Dokunma ergonomisi ölçülmedi. |
| **§D** açılış ekranı | **KESİN ama DOLAYLI** | Cihazda hangi ekranın çizildiği, derlenmiş APK'nın kaynak tablosundan (`aapt2 dump resources`) okundu — gözle değil. Telefonda açılıp bakılmadı. |

---

## §Bulgular

### §A — Bugün gerçekte ne çıkıyor

**İkon: 15 dosyanın 15'i de Capacitor şablonuyla BİREBİR AYNI.** Bu bir göz kararı değil;
şablon `node_modules/@capacitor/cli/assets/android-template.tar.gz` içinden açılıp bayt bayt
karşılaştırıldı.

| Küme | Dosya | Bayt | Şablonla birebir aynı |
|---|---|---|---|
| `mipmap-*/ic_launcher*.png` | 15 | **98,3 KB** | **15/15** |
| `drawable-{port,land}-*/splash.png` + `drawable/splash.png` | 11 | **106,9 KB** | **11/11** |

- Adaptive ikon zemini `drawable/ic_launcher_background.xml` — Android Studio'nun teal (`#26A69A`)
  ızgara vektörü. İkonun kendisi Capacitor'ın mavi **X** logosu.
- **Mağaza ikonu (512×512) depoda HİÇ YOK.** Play listelemesi bunsuz açılmaz.
- **Ekran yönü kilidi manifestte YOK.** `MainActivity`de `screenOrientation` yok; yalnız
  `configChanges` orientation'ı yutuyor (Android döndürür, Activity yeniden doğmaz).
- `MainActivity` gövdesi tek satır (`extends BridgeActivity`) — **`installSplashScreen()` çağrısı YOK.**

Yani bu üç kalem "cila" değil **eksik**: kabuk bu hâliyle listelenemez.

### §B — Ekran yönü

**Ölçümün kurulumu.** Oda 34 × 34 = 1156 br² (`FLOOR_HALF = 17`, `layout.ts`ten okunur).
Zemin alanı köşe ışınıyla değil **sayılarak** ölçülür: oda 400 × 400 noktayla taranır, her nokta
kameraya "kadrajda mısın" diye sorulur, alan = (giren nokta oranı) × oda alanı. Gerekçesi §Aracın
kusurları bölümünde. Aynı ızgara ikinci kez HUD dikdörtgenlerine karşı taranır → **AÇIK ZEMİN**
(HUD'un altında kalan zemin görünmüyor sayılır).

Üç eksen birden gezilir ki sonuç tek bir anekdota dayanmasın:
**dünya** (D0 başlangıç · D1 tam açık) × **oyuncunun yeri** (N0 park · N1 oda merkezi · N2 salon içi)
× **kamera kademesi** (Z0 varsayılan · Z1 HUD "genel bakış" düğmesi · Z2 kelepçe kalkık)
× **kadraj** (portre/yatay 20:9 · 16:9 · tablet 4:3).

Toplam **90 hücre** ölçüldü (TAM koşu). **Dünya denetimi 18/18 TEMİZ**: her dünya+nokta+zoom
hücresinde bütün kadrajlar birebir aynı sahneyi ölçtü (tek imza). Konsol hatası **0**. HUD taşması
**hiçbir kadrajda yok** (`tasan 0`).

#### B-1. Taban karşılaştırma — D1 tam açık · N1 oda merkezi · Z0 varsayılan

| Kadraj | CSS px | oran | açık zemin | oda % | ankraj | oyuncu | HUD ekranın |
|---|---|---|---|---|---|---|---|
| **P1 portre 20:9** | 412×915 | 0,45 | **187,3 br²** | %16,6 | **1/26** | 84,2 px | %6,5 |
| **L1 yatay 20:9** | 915×412 | 2,22 | **629,4 br²** | %57,0 | **22/26** | 49,9 px | %8,5 |
| P2 portre 16:9 (dar) | 360×640 | 0,56 | 222,7 br² | %20,7 | 5/26 | 58,9 px | %10,3 |
| L2 yatay 16:9 (dar) | 640×360 | 1,78 | 489,6 br² | %50,2 | 17/26 | 44,1 px | %12,3 |
| T1 tablet portre 4:3 | 800×1280 | 0,63 | 259,7 br² | %22,6 | 5/26 | **120,5 px** | %3,0 |

Oda merkezinde durup etrafa bakınca portre **26 ankrajdan 1'ini**, yatay **22'sini** gösteriyor.

**Oranın dayanıklılığı:** 36 karşılaştırmada yatay/portre açık zemin oranı **1,58× … 3,36×**
(ortalama **2,31×**). Yön hiçbir dünyada, hiçbir noktada, hiçbir kamera kademesinde tersine dönmüyor.

#### B-2. Kelepçe kolu — portre kendi içinde kurtarılabiliyor mu?

Bu kolu ölçmek zorunluydu: portrede dükkânın görünmemesi portrenin **doğası** değil,
`CAMERA_PORTRAIT_CLAMP = 1,3` sayısının sonucu olabilirdi (oranın istediği açılma `1/aspect = 2,22`).
Ölçülmeseydi karar yanlış öncüle otururdu.

D1 tam açık · N1 oda merkezi · portre 20:9:

| Kademe | kamera y | açık zemin | ankraj | oyuncu |
|---|---|---|---|---|
| Z0 varsayılan | 11,1 | 187,3 br² (1,00×) | 1 | 84,2 px (1,00×) |
| Z1 HUD "genel bakış" düğmesi | 14,9 | 258,3 br² (1,38×) | 5 | 61,1 px (0,73×) |
| Z2 kelepçe kalkık | 18,9 | 336,4 br² (1,80×) | 7 | 47,7 px (**0,57×**) |

**Bulgu — turun kritik sayısı.** Kelepçeyi açmak portreyi gerçekten iyileştiriyor (1,80×), ama
**altı dünya+nokta hücresinin altısında da** portrenin EN İYİ hâli yatayın **TABANINI**
yakalayamıyor:

| Hücre | portrenin en iyisi (Z2) | yatayın tabanı (Z0) | fark | oyuncu (portre ↔ yatay) |
|---|---|---|---|---|
| D0 · N0 park | 488,2 br² | 605,3 br² | 1,24× | 47,7 ↔ 50,2 px |
| D0 · N1 merkez | 337,0 br² | 626,2 br² | 1,86× | 47,7 ↔ 50,4 px |
| D0 · N2 salon | 437,2 br² | 590,9 br² | 1,35× | 47,7 ↔ 50,4 px |
| D1 · N0 park | 248,9 br² | 341,2 br² | 1,37× | 47,7 ↔ 50,5 px |
| D1 · N1 merkez | 336,4 br² | 629,4 br² | 1,87× | 47,7 ↔ 49,9 px |
| D1 · N2 salon | 437,7 br² | 587,5 br² | 1,34× | 47,7 ↔ 50,3 px |

Son sütun kolun belini kırıyor: **karakter ikisinde de aynı boyda** (47,7 px ↔ ~50 px). Yani
yatayın avantajı "daha uzaktan bakıyor" değil — **aynı yakınlıkta 1,24–1,87× daha fazla dükkân
gösteriyor.** Sebep geometrik: portrede dikey görüş açısı 50° ama yatay görüş açısı oran yüzünden
yalnız ~24° (D-061 bunu portre içinde ölçmüştü; **yatayla karşılaştırmamıştı**).

#### B-3. Serbest bırakmanın (V0, bugünkü hâl) teknik maliyeti: yok

- Portre → yatay → portre canlı döndürme sınaması: **yeni konsol hatası 0**.
- HUD hiçbir kadrajda taşmıyor (`tasan 0`), en küçük yazı her kadrajda **11 px**.
- Yani V0 **kırık değil**. Maliyeti teknik değil ürünsel: oyuncunun gördüğü dükkân,
  telefonu nasıl tuttuğuna göre 1,6–3,4× değişiyor ve mağaza görselleri iki yönü de kapsamak zorunda.

#### B-4. Dar telefon cezası

Portre 16:9 (360×640) en dar durum: HUD **ekranın %10,3'ünü**, kadrajdaki **zeminin %21,1'ine
kadarını** yiyor (20:9'da bu %6,5 / %2,4). Tablet portre (4:3) ise tam tersi — oran 0,63'e
gevşediği için portre orada sorun değil, karakter **120,5 px** ile en iri hâlinde.

### §C — İkon adayları

12 aday, iki eksende: **obje** (ince belli bardak · bardak+buhar · semaver · tepsi · okey taşı ·
dükkân cephesi) × **zemin** (krem düz · tente şeridi · koyu rozet · ahşap).

Şekil dili sıfırdan uydurulmadı: oyunun kendi `icons.tsx` dosyasındaki `CayGlyph`/`TepsiGlyph`
profilinden ve D-107/S11'in *"chunky hissin kaynağı kalın koyu kontur"* gramerinden türetildi.
Renkler `src/config/palette.ts` + `src/index.css` jetonlarından **birebir** alındı.

**Android kısıtı (uydurma değil, kuralın kendisi):** adaptive ikon 108 dp tuvale çizilir ama
launcher hangi maskeyi uygularsa uygulasın **yalnız ortadaki 72 dp'nin görüneceği garantidir**.
Tüm adaylar objeyi 512'lik karenin ortadaki ~330 px'ine sığdırıyor; ne daire ne squircle maskesi
hiçbirini kesmiyor.

**Kareler iki boyda birden çekildi ve bu zorunluydu:** ikon kararı 512'de verilir ama ikon
**48 dp'de yaşar**. Büyükte güzel, küçükte lapa olan bir aday yalnız ikinci karede ele veriyor.

- `ss/f1b-ikon-tabaka.png` — 12 aday, 512×512 (mağaza ikonu boyu)
- `ss/f1b-ikon-launcher.png` — **aynı 12 aday 48 dp'de**, daire (Pixel) ve squircle (Samsung)
  maskeleriyle, gerçek ev ekranı zemininde
- `ss/f1b-ikon-<id>.png` — her aday tek tek 512×512

**Yolda düzeltilen iki tasarım kusuru** (ikisi de ilk turda üretildi, karar paketine girmeden
elendi — `feedback_asset_taste` D-122: *paket en kötü üyesiyle yargılanır*):

1. **Bardak ince belli değildi.** İlk çizim düz konik bir bardaktı, ikincisi huniye döndü.
   Türk çay bardağının kimliği tam olarak **bel**dir ve bel tek başına yetmiyor: profil üç
   yarıçapın oranıyla kuruluyor — ağız 86 · **bel 46** · **alt tümsek 62** · taban 40
   (ağız/bel = 1,87). Alt tümsek yoksa çizim huni olur. Profil bu yüzden elle eğri çizilerek
   değil **sayıyla** kuruldu; çay da ikinci bir gövde yoluyla değil `clipPath` ile dolduruluyor
   (elle yazılan ikinci yol, gövde her değiştiğinde sessizce bayatlıyordu).
2. **Semaver yüz gibi okunuyordu.** İlk çizim simetrikti: iki yanda aynı kulp, gövdenin ortasında
   koyu bir yarık. Göz simetrik iki yuvarlağı + altındaki yatay çizgiyi **yüz** olarak okuyor
   (pareidolia) ve cizim semavere değil robot suratına benziyordu. Düzeltme süslemek değil
   **simetriyi kırmak** oldu: musluk sağa tek başına çıkıyor, kulplar omuz hizasına yükselip
   açık halkaya döndü, orta yarık kalktı.

### §D — Açılış ekranı: on bir dosya çiziliyor mu?

**Bu bölümün ilk sorusu tasarım değil ölçüm.** Cevap, derlenmiş APK'nın kaynak tablosundan
okundu.

Zincir:

```
AppTheme.NoActionBarLaunch  (bizim)
  → tek nitelik: 0x010100d4 = @drawable/splash      ← android:background
  → parent: Theme.SplashScreen                       (androidx)
       varsayılan varyant: windowSplashScreenBackground = ?android:colorBackground
                           windowSplashScreenAnimatedIcon = @0x01080093
       (v31) varyantı    : 0x0101062c/d/e = ?attr/windowSplashScreen*
       → parent: Theme.SplashScreen.Common
            0x01010054 = @drawable/compat_splash_screen_no_icon_background   ← android:windowBackground
```

Aracın ham çıktısı bu soruyu açıkça soruyor ve cevabı basıyor:

```
***  KRITIK SORU: @drawable/splash PENCEREYI cizen bir nitelige bagli mi?  ***
CEVAP: HAYIR — hicbirine bagli degil.
```

**Bulgu: `android:background` (0x010100d4) bir GÖRÜNÜM niteliğidir, pencereyi çizmez.** Açılış
penceresinin zeminini kuran nitelikler `android:windowBackground` (0x01010054, API<31) ve
`android:windowSplashScreenBackground`/`...AnimatedIcon` (0x0101062c/d, API≥31). **`@drawable/splash`
bunların hiçbirine bağlı değil** — ne bizim temamızda, ne androidx'inkinde.

Sonuç: **on bir splash dosyası (106,9 KB) hiçbir API sürümünde çizilmiyor.** Pencere zemini
androidx'in kendi `compat_splash_screen_no_icon_background` çizimi; API 31+ cihazlarda sistem
kendi splash'ını çiziyor ve orada görünen **uygulama ikonu**dur — yani bugün Capacitor'ın mavi X'i.

> Bunun kararı ucuzlatan bir sonucu var: **ikonu düzeltmek açılış ekranını da düzeltiyor.**
> API 31+ sistem splash'ı ikonu kullandığı için iki kalem tek kalemde birleşiyor.

**Oyun içi açılış ekranı (`SplashScreen.tsx`) ayrı ve ÇALIŞIYOR.** Kareler:
`ss/f1b-acilis-portre.png` · `ss/f1b-acilis-yatay.png`. İki kusuru var:
① **tek dilde** — "Köşe Kıraathanesi" yazıyor, oysa D-130 başlığı iki dile ayırdı
(EN "Tea House Tycoon: Idle Cafe" / TR "Köşe Kıraathanesi: Tycoon") ·
② **markasız** — yalnız yazı + çubuk; ikon/logo yok.

### §E — Bayt dökümü

| Kalem | Dosya | Bayt |
|---|---|---|
| ikon (`mipmap-*`) | 15 | 98,3 KB |
| açılış ekranı toplam | 11 | **106,9 KB** |
| &nbsp;&nbsp;— `drawable-port-*` dalı | 5 | 51,5 KB |
| &nbsp;&nbsp;— `drawable-land-*` dalı | 5 | 51,4 KB |
| &nbsp;&nbsp;— yönsüz `drawable/` | 1 | 3,9 KB |

§D'ye göre bu 106,9 KB'ın **tamamı ölü**. Ayrıca yön kilitlenirse port/land ikilisinin bir dalı
tanım gereği zaten gereksizleşir — ama ikisi de zaten çizilmediği için bu ikincil.

---

## §Karar

<!-- BOŞ — karar paketi sunulacak, kullanıcı seçecek, sonra D-0xx ile doldurulacak (D-084) -->

---

## §Uygulama

<!-- BOŞ -->

---

## §Bekçi

<!-- BOŞ -->

---

## §Aracın kendisinde bulunan kusurlar

Ölçüm aracı ilk kurulumunda yedi kez yanlış okudu. Hepsi düzeltilmeden hiçbir sayı rapora
girmedi; kusurların listesi burada çünkü **hangi sayının neden güvenilir olduğu** ancak böyle
denetlenebiliyor.

1. **`npm` alt sürecin çıktısını yutuyordu** → araç *"vite 60 sn içinde açılmadı"* diye kırıldı.
   Düzeltme: vite doğrudan `node` ile çağrılıyor (F2 ile aynı karar).
2. **Şablon karşılaştırması sessizce ÖLÜYDÜ.** Capacitor şablonu dizin değil `tar.gz`; araç
   dizin arıyor ve her dosyaya "kaynak yok" diyordu. *"Karşılaştıramadım"* ile *"farklı"* ayrı
   şeylerdir — araç ikisini karıştırırsa varsayılan bir ikonu "özelleştirilmiş" diye geçirir.
3. **GNU tar `@capacitor` yolundaki `@`yı uzak sunucu ayracı sandı** (*"Cannot connect to
   capacitor\cli\…"*), sonra da `C:` sürücü harfini. Düzeltme: arşiv güvenli adla kopyalanıyor +
   `--force-local`. Hata `stdio:'ignore'` ile yutuluyordu — F1a'nın dersi: **aracın karamsar
   hatası gözden kaçar.**
4. **Stil regex'i çift kaçış yüzünden hiç tutmuyordu** → tema "TABLODA BULUNAMADI" görünüyordu,
   yani §D'nin tamamı boş dönüyordu ve bu bir "bulgu" gibi okunabilirdi.
5. **Dünya kurulumu kastedilen dünya değildi.** Pad listesi elle yazılmıştı ve zincirin ortasından
   iki kimlik içeriyordu; ayrıca zaman pad'lerden ÖNCE donduruluyordu — oysa `tick.ts` dünyayı
   her karede `padsDone`tan türetiyor (`deriveWorld`), zaman durunca türetme hiç koşmadı.
   24 pad açıkken sahne `tables:1, areasOpen:1`de kaldı. **Bunu yalnız dünya imzası satırı ele
   verdi.** Düzeltme: liste `economy.config.ts`ten türüyor + sıra "yaz → bir tur türet → dondur".
6. **Tek varyanta bakılıyordu.** `Theme.SplashScreen`in bir de `(v31)` varyantı var ve Android 12+
   cihazların gerçekte kullandığı O. Tek varyanta bakan araç, *"API 31'de ne oluyor"* sorusuna
   API 31 ÖNCESİNİN satırlarıyla cevap vermiş olurdu.
7. **Kare aracı açılış ekranını "yakaladı" sanıyordu, yakalayamamıştı.** `.splash` VAR MI diye
   soruyor, "var" cevabı alıyor, ama karede splash bulunmuyordu: bileşen sönerken 480 ms daha
   DOM'da duruyor (`splash--out`, opacity 0). Denetim öğenin **varlığına** bakıyordu,
   **görünürlüğüne** değil — bu sefer İYİMSER hata. Düzeltme: `.splash:not(.splash--out)` +
   kadraj başına ayrı bağlam (önbellek paylaşılınca ikinci kadrajda hiç yükleme görünmüyordu).

---

## §Açık uçlar

<!-- BOŞ — uygulama sonrası doldurulacak -->
