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

Toplam **108 hücre** ölçüldü (TAM koşu). **Dünya denetimi 18/18 TEMİZ**: her dünya+nokta+zoom
hücresinde bütün kadrajlar birebir aynı sahneyi ölçtü (tek imza). Konsol hatası **0**. HUD taşması
**hiçbir kadrajda yok** (`tasan 0`). Canlı portre→yatay→portre döndürme sınaması: **0 yeni hata**.

> **ÖLÇÜM DÜZELTMESİ — bu bölümün ilk sürümü YANLIŞTI.** İlk koşuda HUD yalnız `background-color`
> alfasına bakılarak sayılıyordu; oyunun en büyük iki bloğu (`.band` görev şeridi ve `.botnav`)
> zeminini `linear-gradient` ile verdiği için ikisi de sayımdan düştü. HUD yatayda "%8,5" çıktı.
> Kullanıcı kareye bakıp *"yatayda ekran çok dolu görevlerle"* dediğinde **ölçüm ona karşı
> çıkıyordu ve araç haksızdı.** Hata İYİMSERDİ (kolu olduğundan temiz gösteriyordu), bu yüzden
> sonucun kendisinden anlaşılmadı — yalnız GÖZLE yakalandı. Artık zemin rengi, zemin görseli
> (gradyan dahil) ve görünür kenarlık üçü de sayılıyor. **Açık zemin sayıları HUD'dan türediği
> için onlar da değişti**; aşağıdakiler düzeltilmiş koşudandır.

#### B-1. Taban karşılaştırma — D1 tam açık · N1 oda merkezi · Z0 varsayılan

| Kadraj | CSS px | oran | açık zemin | oda % | ankraj | oyuncu | HUD ekranın | alt bant |
|---|---|---|---|---|---|---|---|---|
| **P1 portre 20:9** | 412×915 | 0,45 | **178,2 br²** | %16,5 | **1/26** | 84,8 px | %19,7 | %20,3 |
| **L1 yatay 20:9** | 915×412 | 2,22 | **570,8 br²** | %57,8 | **22/26** | 48,4 px | **%38,3** | **%45,2** |
| P2 portre 16:9 (dar) | 360×640 | 0,56 | 207,4 br² | %20,7 | 5/26 | 58,9 px | %29,2 | %29,1 |
| L2 yatay 16:9 (dar) | 640×360 | 1,78 | 422,0 br² | %50,2 | 17/26 | 44,0 px | **%45,9** | %40,3 |
| T1 tablet portre 4:3 | 800×1280 | 0,63 | 246,5 br² | %22,0 | 5/26 | **124,0 px** | %12,6 | %14,5 |
| T2 tablet yatay 4:3 | 1280×800 | 1,60 | 533,2 br² | %49,2 | 17/26 | 89,9 px | %18,9 | %23,3 |

Oda merkezinde durup etrafa bakınca portre **26 ankrajdan 1'ini**, yatay **22'sini** gösteriyor.

**Oranın dayanıklılığı:** 54 karşılaştırmada yatay/portre açık zemin oranı **1,37× … 3,36×**
(ortalama **2,03×**). Yön hiçbir dünyada, hiçbir noktada, hiçbir kamera kademesinde tersine dönmüyor.

#### B-2. Kelepçe kolu — portre kendi içinde kurtarılabiliyor mu?

Bu kolu ölçmek zorunluydu: portrede dükkânın görünmemesi portrenin **doğası** değil,
`CAMERA_PORTRAIT_CLAMP = 1,3` sayısının sonucu olabilirdi (oranın istediği açılma `1/aspect = 2,22`).
Ölçülmeseydi karar yanlış öncüle otururdu.

D1 tam açık · N1 oda merkezi · portre 20:9:

| Kademe | kamera y | açık zemin | ankraj | oyuncu |
|---|---|---|---|---|
| Z0 varsayılan | 11,0 | 178,2 br² (1,00×) | 1 | 84,8 px (1,00×) |
| Z1 HUD "genel bakış" düğmesi | 14,8 | 242,2 br² (1,36×) | 5 | 61,5 px (0,73×) |
| Z2 kelepçe kalkık | 18,8 | 312,1 br² (1,75×) | 7 | 48,0 px (**0,57×**) |

**Bulgu — turun kritik sayısı.** Kelepçeyi açmak portreyi gerçekten iyileştiriyor, ama
**altı dünya+nokta hücresinin altısında da** portrenin EN İYİ hâli yatayın **TABANINI**
yakalayamıyor:

| Hücre | portrenin en iyisi (Z2) | yatayın tabanı (Z0) | fark | oyuncu (portre ↔ yatay) |
|---|---|---|---|---|
| D0 · N0 park | 482,1 br² | 598,8 br² | 1,24× | 47,7 ↔ 50,2 px |
| D0 · N1 merkez | 316,4 br² | 565,4 br² | 1,79× | 47,7 ↔ 50,5 px |
| D0 · N2 salon | 419,3 br² | 527,5 br² | 1,26× | 47,7 ↔ 50,4 px |
| D1 · N0 park | 235,4 br² | 329,6 br² | 1,40× | 48,4 ↔ 50,5 px |
| D1 · N1 merkez | 312,1 br² | 570,8 br² | 1,83× | 48,0 ↔ 48,4 px |
| D1 · N2 salon | 413,1 br² | 526,3 br² | 1,27× | 48,9 ↔ 49,9 px |

Son sütun kolun belini kırıyor: **karakter ikisinde de aynı boyda**. Yani yatayın avantajı
"daha uzaktan bakıyor" değil — **aynı yakınlıkta 1,24–1,83× daha fazla dükkân gösteriyor.**
Sebep geometrik: portrede dikey görüş açısı 50° ama yatay görüş açısı oran yüzünden yalnız ~24°
(D-061 bunu portre içinde ölçmüştü; **yatayla karşılaştırmamıştı**).

#### B-3. Alt bant — kullanıcının şikâyetinin sayısı

Alt yığın (görev şeridi + alt gezinme) **her yönde 186 px SABİT**:

| Kadraj | alt bant | ekran yüksekliğinin |
|---|---|---|
| Portre 20:9 (915 px yüksek) | 186 px | **%20,3** |
| **Telefon yatayı (412 px yüksek)** | 186 px | **%45,2** |
| Tablet yatayı (800 px yüksek) | 186 px | %23,3 |

Yani doluluk **yönün değil, kısa ekrana uyum sağlamayan HUD'un** kusuru — ve bu ayrım kararı
değiştirir, çünkü düzeltilebilir. Kolları `tools/shot-yatay-hud-f1b.mjs` ölçtü
(telefon yatayı 915×412, gerçek oyunun üstüne CSS katmanı olarak; depoya hiçbir şey yazılmadan):

| Kol | HUD ekranın | açık zemin |
|---|---|---|
| Y0 taban (bugün) | %38,4 | 588,4 br² |
| YA alt gezinme yan raya | %27,1 | −0,1% |
| YB görev şeridi köşe kartına | %28,2 | +1,9% |
| **YD doğal genişlik (kullanıcının önerisi)** | **%19,0** | **+3,5%** |
| YC yan ray + kompakt şerit | %18,1 | +1,0% |

Tablette aynı kural: HUD **%18,9 → %7,1**.

> **İKİNCİ ARAÇ KUSURU, YİNE GÖZLE YAKALANDI.** Metrik tablet yatayını "en iyi konfigürasyon"
> gösteriyordu (533 br², karakter 89,9 px, HUD %18,9) ve sayıya göre sorun yoktu. Kullanıcı
> *"tablette oynanırsa oyun çok kötü durur"* dedi; kareye bakınca haklıydı — görev şeridi
> 1280 px'e geriliyor, ilerleme çubuğu upuzun boş bir çizgiye dönüyor. **Metrik ALAN ölçüyor,
> GERİLME ölçmüyor.** Aynı turda iki kez: araç, gözün yakaladığını kaçırdı.

#### B-4. Dar telefon cezası

Portre 16:9 (360×640) ve yatay 16:9 (640×360) en dar durumlar: küçük yatay telefonda HUD
**ekranın %45,9'unu** yiyor — bütün kadrajların en kötüsü. Tablet portre (4:3) ise tam tersi:
oran 0,63'e gevşediği için portre orada sorun değil, karakter **124,0 px** ile en iri hâlinde.

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

# TUR 2 — AÇILAN EKRANLAR (G-54) · YD REVİZE (G-51/G-52) · TABLET BASAMAĞI (G-55)

**Araç:** `tools/olcum-panel-f1b.mjs` · **Ham çıktı:** `docs/olcum-panel-f1b.txt` (TAM koşu damgalı)
**Kareler:** `docs/gorsel/ss/f1b-panel-*.png` · `f1b-yd-*.png` · `f1b-tablet-*.png` · `f1b-yerlesim-*.png`

> Tur 1'in ölçümü (§A–§E) yerinde duruyor; bu bölüm onu **genişletiyor**, düzeltmiyor.
> Tur 2 de KARAR BÖLÜMÜ BOŞ olarak yayımlanır (D-084 sıra kilidi).

## NEDEN İKİNCİ TUR — eksiklik değil, DELİK

Tur 1 karar paketine kadar gitti ve karar **çıkmadı**. Sebebi kullanıcının tek cümlesi:

> *"bana açılan ekranlar nasıl duracak onları da göstermen gerek"*

Bu bir "şunu da ekle" talebi değil. Tur 1 yalnız HUD'u ölçtü; Görevler · Hedefler · Mağaza ·
Karakter · Ayarlar ekranları yatayda ve tablette **hiç açılmadı bile**. Yön kararı verilirken
"bu yönde açılan ekranlar ne yapıyor" sorusunun cevabı **yoktu** — yani karar eksik öncüle
oturacaktı. Kısa ekranda panel yüksekliği en olası kırılma noktasıdır ve tam oraya bakılmamıştı.

## ARACIN KURULUMU — tur 1'in iki dersi koda yazıldı

1. **HUD sayımı artık zemin GÖRSELİNİ de sayıyor.** Tur 1'de `.band`/`.botnav` `linear-gradient`
   zeminleri yüzünden sayımdan düşmüştü (İYİMSER hata, yalnız gözle yakalandı). Tur 2'nin
   sayacı `background-color` alfası · `background-image` · görünür kenarlık üçünü birden okur.
2. **Her hücre DÜNYA İMZASI basıyor** (`t<masa>|s<istasyon>|a<alan>|n<npc>`). Tur 1'de dünyanın
   hiç kurulmadığı ancak imza satırıyla anlaşılmıştı. İmzasız "ölçtüm", "aynı sahneyi ölçtüm"
   anlamına gelmiyor.

Kollar yine **gerçek oyunun üstüne CSS katmanı** olarak uygulanıyor (`addStyleTag`); depoya
hiçbir şey yazılmıyor. Kolun hem karesi hem sayısı karar ÖNCESİ elde ediliyor.

## §F — AÇILAN EKRANLAR (G-54)

Beş ekran × üç kadraj = 15 hücre. Ölçülen şey "güzel mi" değil, **ekranın ne kadarı ilk bakışta
var**:

| Sütun | Tanımı |
|---|---|
| `kaydirma` | gövdenin içeriği ÷ gövdenin yüksekliği. **1,00× = hiç kaydırma gerekmiyor.** |
| `ilkEkran%` | ilk bakışta görünen içerik oranı (1 ÷ kaydırma) |
| `dugme(gor/top)` | gövdede TAM görünen düğme ÷ toplam düğme |
| `gizliOdul` | ilk ekranda **görünmeyen ödül-alma düğmesi** — ekranın asıl işi budur |
| `yanBos` | kabuğun tek yanındaki boş zemin (px): yatayda bol eksenin kullanılmayan payı |
| `kesilen` | yatayda ekran dışına taşan öğe |

| Kadraj | Panel | Kabuk | yanBoş | Gövde | İçerik | kaydırma | ilkEkran | düğme gör/top | gizliÖdül | enKüçükYazı | kesilen |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **P1 portre** | Görevler | 412×915 | 0 | 853 | 853 | **1,00×** | %100 | 1/2 | 0/0 | 11 px | 0 |
| P1 portre | Hedefler | 412×915 | 0 | 853 | 853 | **1,00×** | %100 | 1/2 | **0/1** | 11 px | 0 |
| P1 portre | Mağaza | 412×915 | 0 | 853 | 853 | **1,00×** | %100 | 12/13 | 0/1 | 13 px | 0 |
| P1 portre | Karakter | 412×915 | 0 | 853 | 853 | **1,00×** | %100 | 6/7 | 0/3 | 11 px | 0 |
| P1 portre | Ayarlar | 412×915 | 0 | 853 | 853 | **1,00×** | %100 | 5/6 | 0/0 | 11 px | 0 |
| **L1 telefon yatayı** | Görevler | 520×412 | 198 | 350 | 748 | **2,14×** | **%47** | **0/2** | 0/0 | 11 px | 0 |
| **L1 telefon yatayı** | **Hedefler** | 520×412 | 198 | 350 | 783 | **2,24×** | **%45** | **0/2** | **1/1** | 11 px | 0 |
| L1 telefon yatayı | Mağaza | 520×412 | 198 | 350 | 403 | 1,15× | %87 | **3/13** | **1/1** | 13 px | 0 |
| L1 telefon yatayı | Karakter | 520×412 | 198 | 350 | 370 | 1,06× | %94 | 5/7 | **1/3** | 11 px | 0 |
| L1 telefon yatayı | Ayarlar | 520×412 | 198 | 350 | 713 | **2,04×** | **%49** | 4/6 | 0/0 | 11 px | 0 |
| T2 tablet yatayı | Görevler | 520×800 | 380 | 738 | 748 | 1,01× | %99 | 1/2 | 0/0 | 11 px | 0 |
| T2 tablet yatayı | Hedefler | 520×800 | 380 | 738 | 783 | 1,06× | %94 | 1/2 | **0/1** | 11 px | 0 |
| T2 tablet yatayı | Mağaza | 520×800 | 380 | 738 | 738 | **1,00×** | %100 | 12/13 | 0/1 | 13 px | 0 |
| T2 tablet yatayı | Karakter | 520×800 | 380 | 738 | 738 | **1,00×** | %100 | 6/7 | 0/3 | 11 px | 0 |
| T2 tablet yatayı | Ayarlar | 520×800 | 380 | 738 | 738 | **1,00×** | %100 | 5/6 | 0/0 | 11 px | 0 |

**Bulgu — delik kapandı ve cevabı tek cümle: sorun YÖNDE değil, TELEFON YATAYINDA.**

- **Portrede beş ekranın beşi de kusursuz:** 1,00× kaydırma, %100 içerik, gizli ödül düğmesi 0.
- **Tablet yatayında da sorun yok:** en kötüsü Hedefler 1,06× (bir ödül düğmesi ilk ekranın
  hemen altında). Kullanıcının tablet endişesi HUD'daydı, panellerde karşılığı çıkmadı.
- **Telefon yatayı kırılıyor:** Görevler **%47**, Hedefler **%45**, Ayarlar **%49** — yani
  ekranın yarısından fazlası kaydırma arkasında. Hedefler'de **tek ödül-alma düğmesi ilk
  ekranda görünmüyor**; Mağaza'da 13 düğmeden **yalnız 3'ü** görünüyor.
- **Kesilme hiçbir kadrajda yok** (0/15). Yani panel *bozulmuyor*, **gömülüyor**.
- **Boş yan:** yatayda tek yanda 198 px (iki yan = ekranın **%43'ü**), tablette 380 px
  (**%59'u**). Kıt eksende gömülürken bol eksen kullanılmıyor — §I bunu ölçtü.

> **UYARI — `kaydırma` sütunu OLDUĞUNDAN İYİ gösteriyor.** Sütun `scrollHeight`tan türüyor ve
> §I'nin sondası bu değerin taşan çocukları saymadığını kanıtladı (aşağıda). Telefon yatayında
> gerçek içerik yüksekliği Mağaza'da 403 değil **426 px**, Karakter'de 370 değil **427 px**.
> Yani yukarıdaki tablonun yönü doğru, **şiddeti eksik**: telefon yatayı tablonun söylediğinden
> daha kötü. Güvenilir sütunlar `düğme gör/top` ve `gizliÖdül`'dür — ikisi de gerçek kutu
> geometrisinden sayılıyor.


## §G — YD REVİZE (G-51 + G-52)

Kullanıcı YD kolunun **genişliğini onayladı, hizasını reddetti**:

> *"görev neden sola yaslı ortada olamaz mı?"* (G-51)
> *"bence navbar da görev de ortada daha iyi"* (G-52 — nav zaten ortalıydı, onaylandı)

**YD+**, YD'nin birebir aynısıdır; tek fark şeridin `right:auto` yerine
`left:50% + translateX(-50%)` ile ortalanması. Sınanan hipotez: HUD yüzdesi ve açık zemin
**genişlikten** türediği için hizadan bağımsızdır, yani YD+ ile YD'nin sayıları aynı çıkmalı.
Hipotez ölçülmeden yazılmaz — ölçüldü.

G-51'in tek ölçülebilir büyüklüğü **kaçıklık**: bloğun merkezinin ekran merkezinden sapması (px).
**0 = tam ortalı.**

| Kadraj | Kol | HUD % | Açık zemin | şerit (genişlik/kaçıklık) | nav (genişlik/kaçıklık) | taşan | hata |
|---|---|---|---|---|---|---|---|
| L1 telefon yatayı | Y0 taban | %38,4 | 563,0 br² | 895 / **+0** | 915 / +0 | 0 | 0 |
| L1 telefon yatayı | YD sola yaslı (tur 1) | **%19,0** | 596,9 br² | 430 / **−233** | 362 / +0 | 0 | 0 |
| **L1 telefon yatayı** | **YD+ ORTALI (G-51)** | **%19,0** | 596,8 br² | 430 / **+0** | 362 / +0 | 0 | 0 |
| T2 tablet yatayı | Y0 taban | %19,1 | 507,5 br² | 1260 / +0 | 1280 / +0 | 0 | 0 |
| T2 tablet yatayı | YD sola yaslı (tur 1) | **%7,1** | 512,2 br² | 430 / **−415** | 362 / +0 | 0 | 0 |
| **T2 tablet yatayı** | **YD+ ORTALI (G-51)** | **%7,0** | 512,2 br² | 430 / **+0** | 362 / +0 | 0 | 0 |

**Bulgu — hipotez tuttu: G-51 BEDAVA.** YD ile YD+ arasındaki fark yalnız kaçıklıkta:
telefon yatayında **−233 → 0**, tablette **−415 → 0**. HUD yüzdesi (%19,0 ↔ %19,0 ·
%7,1 ↔ %7,0) ve açık zemin (596,9 ↔ 596,8 · 512,2 ↔ 512,2) **değişmedi**. Yani şeridi
ortalamak hiçbir sayıyı bozmuyor — kullanıcının reddettiği hizayı düzeltmenin bedeli yok.

**Gürültü tabanı — bu turda kendiliğinden ölçüldü.** Aynı konfigürasyon (T2 · taban) iki ayrı
bölümde iki kez koştu: §G'de **507,5 br²**, §H'de **514,4 br²**. Fark **%1,4**. Bu sayıyı
bilmeden "512,2 ↔ 507,5 farkı" bir bulgu sanılabilirdi; değil. **Açık zemin metriğinde
%1,5 altı farklar gürültüdür.**


## §H — TABLET BASAMAĞI (G-55)

> *"tablette level barını vs biraz daha büyütebilirsin aynı şekilde kaynaklar ve butonları da"*

**Kuralın kendisi `index.css`'te yazılı (D-128):** dar ekranda ölçek basamağı AŞAĞI inilir
(p3 → p2), *"responsive diye yeni punto uydurulmaz"*. Tabletin doğru hamlesi bunun simetriğidir:
**mevcut ölçeğin bir basamak YUKARISI**. Kolda kullanılan her sayı ölçekten alınmıştır:

| Jeton | Taban | Bir basamak yukarı |
|---|---|---|
| `--p1` etiket | 11 px | `--p2` **13 px** |
| `--p2` ikincil | 13 px | `--p3` **15 px** |
| `--p3` gövde | 15 px | `--p4` **18 px** |
| `--pill-h` | 32 px | **38 px** (dar dalı 28/26; 38 aynı ritmin bir üstü) |

Madalyon (`.lvl-star` 44 → 52), kese ikonu ve yuvarlak düğmeler aynı oranla (×1,18) ölçeklenir —
oran `--pill-h`in 32 → 38 adımından **türetildi**, ayrıca seçilmedi.

| Kol | HUD % | Açık zemin | en küçük yazı | 44 px altı hedef | taşan | hata |
|---|---|---|---|---|---|---|
| T0 tablet taban | %19,1 | 514,4 br² | **11 px** | 2/9 | 0 | 0 |
| T+ bir basamak yukarı | %19,2 | 497,3 br² | **11 px** | 1/9 | 0 | 0 |
| T+D basamak + YD+ | %7,5 | 518,2 br² | **11 px** | 1/9 | 0 | 0 |

### §H-1. KOL ÇÜRÜDÜ — ve çürümesi turun en pahalı bulgusunu açtı

**Kol kendi ölçümünde düştü:** HUD yüzdesi %19,1 → %19,2 (değişmedi), en küçük yazı
**11 px → 11 px**. Kullanıcının şikâyeti tam olarak *"tablette büyüt"* idi; kol büyütmedi.

"11 px değişmedi" bir bulgu değil bir **soru**dur: hangi öğe 11 px'te kaldı? Sonda
(`tools/olcum-tablet-sonda-f1b.mjs`) bunu sordu ve cevap kolu aşan bir şey çıktı:

```
## T0                                    ## T+
  madalyon      null                       madalyon      null
  seviye çubuğu null                       seviye çubuğu null
  kaynak rozeti null                       kaynak rozeti null
  yuvarlak düğme 34×34                     yuvarlak düğme 34×34   ← kol 46 px dedi, olmadı
```

**Kolun hedeflediği sınıfların çoğu DOM'da YOK.** `.lvl-star` · `.lvl-bar` · `.cur-item`
üçü de `null` döndü — bu sınıflar bugünkü HUD'da bulunmuyor.

### §H-2. ASIL BULGU — `index.css`'in İKİ RESPONSIVE DALI DA ÖLÜ KOD

Sonda bir kolu çürütmekle kalmadı; kolun neden çürüdüğünü kovalayınca **oyunun bugün fiilen
hiçbir responsive dalının çalışmadığı** ortaya çıktı.

| Medya sorgusu | Seçici | Canlı | Ölü |
|---|---|---|---|
| `@media (max-width: 400px)` | 15 | **2** (`.cur-val` · `.char-canvas`) | **13** |
| `@media (orientation: landscape) and (max-height: 480px)` | 18 | **3** (`.cur-val` · `.char-canvas` · `.char-card`) | **15** |

Ölü seçiciler: `.lvl-unit` · `.lvl-star` · `.lvl-num` · `.lvl-bar` · `.lvl-text` · `.cur-row` ·
`.cur-item` · `.icon-btn` · `.side-btns` · `.quest-card` · `.quest-photo` · `.quest-title` —
**hiçbiri hiçbir TSX dosyasında geçmiyor** (sayım: `className` içinde 0 eşleşme, CSS'te 45 kural).

`--pill-h` jetonu da ölü: onu kullanan tek kural `.pill`, o da TSX'te **0** kez geçiyor.

**Sebep git kaydında duruyor:** `fc061a0` (2026-09-06, *"Arayüz v2 (plan 9) gerçek oyunda"*)
HUD'u yeniden adlandırdı — `.pill`/`.lvl-*`/`.cur-item` yerine `.band`/`.rep-num`/`.cur`/`.navtab`
geldi. **Medya sorguları onunla birlikte yeniden adlandırılmadı** ve o gün bugündür kimse
fark etmedi, çünkü ölü CSS hata vermez: sessizce hiçbir şey yapmaz.

> **Bu, TUR 1'İN B-3 BULGUSUNU AÇIKLIYOR.** Tur 1 *"alt yığın her yönde 186 px SABİT"* diye
> ölçmüş ve *"kısa ekrana uyum sağlamayan HUD"* demişti. Sebebi şimdi biliniyor: **onu
> kısaltacak dal çalışmıyor.** Tur 1 semptomu ölçmüş, tur 2 sebebi buldu.
>
> Aynı şey D-128 için de geçerli: *"dar ekranda ölçek basamağı AŞAĞI inilir (p3 → p2)"* kuralı
> `index.css`'te yazılı duruyor ama **bugün fiilen uygulanmıyor.** Kural doğru, uygulaması ölü.

### §H-3. Aracın kusuru — dürüstlük payı

`.round-btn { width: 46px }` kolu uygulanmadı: `hud.css`'teki `.round-btn.gear` (özgüllük 0,2,0)
benim `.round-btn` seçicimden (0,1,0) güçlü. **Kol kavramsal olarak değil, YAZIM olarak düştü.**
Bu, §H tablosundaki "1/9" hedef iyileşmesinin de kısmi olduğunu söylüyor — ölçülen şey kolun
tamamı değil, uygulanabilen kısmı.


## §I — PANEL YERLEŞİMİ — bu bölüm ÖLÇÜM SIRASINDA DOĞDU

Planda yoktu. §F'nin ilk karesi (`ss/f1b-panel-goals-L1.png`) sayının söylemediğini gösterdi:
yatayda panel, 915 px'lik ekranın ortasında **520 px'lik dar bir sütun**; iki yanda boş zemin,
kıt olan eksende (yükseklik) 2,2× kaydırma ve ödül düğmesi alt kenarda kesiliyor.

**Sayı bunu tek başına söylemiyordu.** `kabuk 520×412` satırı "dar sütun" diye okunmuyor —
kare okuyor. Turun ikinci dersi (*kare ölçümün denetleyicisidir*) bu turda **üçüncü kez** işledi.

Kolların ortak fikri: **kıt ekseni bol eksene çevirmek.** Hiçbiri yeni punto ya da yeni renk
getirmiyor; yalnız kabuğun genişliğini ve gövdenin akışını değiştiriyor.

| Kol | Ne yapar |
|---|---|
| **P0** | taban — 520 px sütun |
| **PA** | geniş kabuk (820 px), tek sütun. *Kartlar tam satır olduğu için yüksekliğin düşmeyeceği* beklentisini SINAR; düşmezse kol düşer. |
| **PB** | iki sütun — geniş kabuk (880 px) + gövde gride akar. Bölüm kuşakları tam satır kalır ki ekranın iskeleti (S12) bozulmasın. |
| **PC** | tam en — panel kenardan kenara. Kullanıcının *"tüm ekran kaplayınca kötü duruyor"* cümlesi **HUD içindi**; panel için aynı şeyi söyleyip söylemediği BİLİNMİYOR, o yüzden varsayılmadı, ölçüldü. |

| Kol | Kabuk | yanBoş | ORTALAMA kaydırma | gizli ödül düğmesi | kesilen |
|---|---|---|---|---|---|
| **P0** taban 520 px | 520×412 | 198 | **1,73×** | 3 | 0 |
| **PA** geniş kabuk 820 px | 820×412 | 48 | **1,73×** | 3 | 0 |
| **PB** iki sütun 880 px | 880×412 | 18 | **1,48×** | **2** | 0 |
| **PC** tam en 915 px | 915×412 | 0 | **1,73×** | 3 | 0 |

Panel panel (telefon yatayı):

| Panel | P0 | PA | **PB** | PC |
|---|---|---|---|---|
| Görevler | 2,14× | 2,14× | **2,14×** | 2,14× |
| Hedefler | 2,24× | 2,24× | **2,24×** | 2,24× |
| Mağaza | 1,15× | 1,15× | **1,00×** | 1,15× |
| Karakter | 1,06× | 1,06× | **1,00×** | 1,06× |
| Ayarlar | 2,04× | 2,04× | **1,00×** | 2,04× |

**Bulgu 1 — GENİŞLİK TEK BAŞINA HİÇBİR ŞEY ÇÖZMÜYOR.** PA kabuğu 520 → 820 px'e çıkardı,
PC 915 px'e (kenardan kenara) çıkardı: **ikisi de 1,73×'te kaldı, tek hücre bile değişmedi.**
PA kolu bu beklentiyi sınamak için konmuştu ve **beklenti doğrulandı, kol düştü** — kartlar tam
satır olduğu için kabuk genişleyince içerik de genişliyor, yükseklik aynı kalıyor.

**Bulgu 2 — İKİ SÜTUN ÇALIŞIYOR, AMA EN ÇOK GEREKEN İKİ EKRANDA TUTMUYOR.** PB, Mağaza ·
Karakter · Ayarlar'ı **1,00×'e** indirdi (kaydırma tamamen bitti) ama **Görevler 2,14× ve
Hedefler 2,24× hiç değişmedi** — yani en kötü iki ekran olduğu yerde kaldı. Sebep yapısal:
iki sütun `.sheet-pad`'e `display: contents` ile açıldı; Görevler ve Hedefler içeriğini `<ul>`
gibi **tek bir çocukta** taşıyor, o da gride tek hücre olarak giriyor. **PB bugünkü DOM'da
5 ekranın 3'ünde tutuyor.**

### §I-1. DÖRDÜNCÜ ARAÇ KUSURU — ve PB'nin zaferi buharlaştı

PB'nin karesi (`ss/f1b-yerlesim-PB-shop.png`) tabloyla çelişti: sayı *"Mağaza 1,00× — hiç
kaydırma gerekmiyor"* diyordu, karede **kartlar alt kenarda kesikti**. Aynı koşunun başka bir
sütunu da çelişiyordu: `düğme gör/top` PB/Mağaza'da **4/13**, yani dokuz düğme gövdenin dışında.
*"Kaydırma yok"* ile *"9 düğme dışarıda"* aynı anda doğru olamaz.

Sonda (`tools/olcum-grid-sonda-f1b.mjs`) `scrollHeight` ile çocukların **gerçek en alt kenarını**
yan yana koydu:

| Kol | Panel | akış | gövde (client) | `scrollHeight` | GERÇEK içerik | dışarıda/toplam | doğru mu? |
|---|---|---|---|---|---|---|---|
| P0 | Mağaza | flex | 350 | 403 | **426** | 24/39 | **HAYIR** |
| P0 | Ayarlar | flex | 350 | 713 | 699 | 23/47 | **HAYIR** |
| P0 | Karakter | flex | 350 | 370 | **427** | 20/71 | **HAYIR** |
| PB | Mağaza | grid | 350 | **350** | **426** | 21/39 | **HAYIR** |
| PB | Ayarlar | grid | 350 | 350 | 352 | **1/46** | EVET |
| PB | Karakter | grid | 350 | **350** | **427** | 19/71 | **HAYIR** |

**`scrollHeight` altı hücrenin beşinde yanlış.** Kaydırma bölgesine girmeyen (konumlandırılmış,
dönüştürülmüş, tuval) çocuklar sayıma girmiyor. Grid'e çevrilince hata büyüyor: PB/Mağaza'da
`scrollHeight` 350 diyor, gerçek içerik **426**.

### §I-2. DÜZELTİLMİŞ SONUÇ — PB yalnız BİR ekranı çözüyor

Güvenilir sütun `dışarıda` (gövdenin alt kenarını aşan öğe sayısı):

| Panel | P0 taban | PB iki sütun | kazanç |
|---|---|---|---|
| Ayarlar | 23/47 | **1/46** | **çözüldü** |
| Mağaza | 24/39 | 21/39 | %13 |
| Karakter | 20/71 | 19/71 | %5 |
| **toplam** | **67** | **41** | — |

**PB'nin tek gerçek zaferi Ayarlar.** Mağaza ve Karakter neredeyse hiç iyileşmedi, Görevler ve
Hedefler hiç değişmedi (2,14× / 2,24×). Yani **iki sütun bugünkü DOM'da 5 ekranın 1'ini
çözüyor**, ilk okunan "3'ünü" değil.

Yani §I'nin dürüst cevabı: **ölçülen dört kolun hiçbiri telefon yatayını kurtarmıyor.**
*"Paneli genişletelim"* (PA/PC) hiçbir şey değiştirmiyor; *"iki sütuna akıtalım"* (PB) yalnız
düz liste taşıyan tek ekranda tutuyor. Panellerin gövde yapısı (Görevler/Hedefler'in `<ul>`i,
Mağaza'nın önizleme tuvali, Karakter'in canlı sahnesi) düzleştirilmeden bu yol açılmıyor —
bu, karar paketine bir **kol** olarak değil bir **maliyet** olarak girer.

## §Dünya imzası — BEKÇİ KIRMIZI YANDI, olduğu gibi raporlanıyor

```
P1: t20|s0|a3|n3
L1: t20|s0|a3|n3
T2: t20|s0|a3|n2        <- npcCount 3 degil 2
DENETIM: *** KIRMIZI: kadrajlar farkli dunya olctu ***
```

**Yapısal dünya üç kadrajda da aynı** (20 masa · 0 istasyon · 3 alan); ayrışan tek terim canlı
**NPC sayısı** (3 ↔ 2) ve §F/§G/§H/§I'nin hiçbir büyüklüğü NPC sayısına bağlı değil — panel
yükseklikleri, HUD dikdörtgenleri ve zemin taraması müşterilerden bağımsız.

**Buna rağmen imza gevşetilmedi.** Kırmızıyı gördükten sonra bekçiyi "yapısal + canlı" diye
ikiye bölmek, tam olarak D-084'ün yasakladığı şeydir: ölçüm sonucuna göre ölçüm aracını
yumuşatmak. Kırmızı raporda duruyor; imzanın ayrıştırılması **ayrı bir tur kalemi**dir.


---

## §Karar

**D-131 · 2026-09-17.** Kullanıcı ikinci karar paketinde şunu seçti:

> *"② Görev şeridi ortalansın — ölçtüm, bedava kısmı olsun istiyorum ama açılan ekranlar da
> düzgün olmalı piyasada böyle yatay yapanlar ne yapıyor bilmiyorum öyle bir şeyler olabilir.
> bunları da yap sonra oturumu kaydet sıradan devam ederiz"*

| # | Soru | Karar |
|---|---|---|
| ① | Ekran yönü | **AÇIK KALDI** — seçilmedi. Uygulanan iş bu karardan bağımsız: hangi kol seçilirse seçilsin geçerli. |
| ② | Yatay/tablet HUD | **YD+ — doğal genişlik + ORTALI.** Uygulandı. |
| — | Açılan ekranlar (G-54) | **DÜZELTİLECEK** — kullanıcı "düzgün olmalı" dedi ve piyasa kalıbına işaret etti. Uygulandı. |
| ③ | Açılış ekranı | **AÇIK KALDI** — seçilmedi. |

**①'in açık kalması bu turu bloke etmedi ve bu bilinçli:** §F ölçümü sorunun yönde değil telefon
yatayında olduğunu gösterdi, yani panel düzeltmesi hangi yön seçilirse seçilsin gerekli. Serbest
bırakılırsa (K0) yataya dönen oyuncu için gerekli; yatay kilitlenirse (K1) zaten şart; portre
kilitlenirse (K2) dal hiç çalışmaz ama zarar da vermez.

## §Uygulama

**Piyasa kalıbı doğrulandı, uydurulmadı.** Yatay mobil oyunlarda kullanılan hâl **master-detail
rail**: dikey eksen kıt olduğu için üst şerit yanda bir raya döner, içerik kalan genişliğe akar.
Ölçüm de bağımsız olarak aynı yeri göstermişti (§I: bol eksen yatay, kıt eksen dikey).

### 1. `@media (min-width: 560px)` — şerit ve nav doğal genişlikte, ORTALI (G-51 + G-52)

`.band` ve `.botnav` `left:0; right:0` gerilmesinden çıkıp `left:50% + translateX(-50%)` ile
ortalanıyor; nav hap biçimini alıyor (üst köşeler `var(--r2)`).

**Eşik neden YÖN değil GENİŞLİK:** sorunun kendisi gerilme, yani genişlik. 560 px telefon
portresinin (412) üstünde, tablet portresinin (768) altında — dar ekranlarda bugünkü tam-genişlik
davranışı aynen kalıyor.

### 2. `@media (orientation: landscape) and (max-height: 560px)` — panel RAY + İKİ SÜTUN (G-54)

- `.modal-card.screen` → `flex-direction: row` (kabuk yan yana)
- `.screen-top` → sol ray (`clamp(146px, 21vw, 200px)`), **62 px dikey yer geri kazanılır**
  (412 px'in %15'i). K3'ün üç bölge sözleşmesi (geri · başlık · cüzdan) korunuyor, yalnız ekseni
  dönüyor.
- `.sheet-body` → `grid-template-columns: 1fr 1fr`
- **Ara sarmalayıcılar `display: contents`** — `.sheet-pad`, `.goals`, `> ul`. **§I'nin PB kolu
  tam burada tutmamıştı**: Görevler/Hedefler içeriğini tek `<ul>`de taşıyor ve o ızgaraya tek
  hücre giriyordu.
- Ekranın iskeleti tam satır kalıyor (`.sheet-sec`, `.rep-hero`, `.usta-strip`, `.qbig`) ki
  S12/T2'nin bölüm ayrımı bozulmasın.

**Eşik 560 px:** telefon yatayı (412) girer, tablet yatayı (800) girmez — tablet ölçümde zaten
temizdi (1,00–1,06×), oraya dokunmak çalışan bir şeyi bozmak olurdu.

### 3. Ölü responsive dalların temizlenmesi

İki medya sorgusu da sıfırdan yazıldı; 28 ölü seçici silindi, yerine bugünkü sınıf adlarıyla
çalışan kurallar kondu.

### 4. YER DÜZELTMESİ — kurallar `index.css`'ten `hud.css`'e taşındı

**İlk uygulama çalışmadı ve sebebi bu turun ikinci sessiz ezilmesiydi.** Kurallar önce
`index.css`'e yazıldı; canlı ölçüm `transform`un uygulandığını ama `left`in uygulanmadığını
gösterdi. Sebep kaynak sırası: `hud.css` `HUD.tsx` içinden **sonra** yükleniyor ve medya sorgusu
özgüllük eklemiyor, yani `index.css`'teki `.botnav { left: 50% }` oradaki `.botnav { left: 0 }`
tarafından eziliyordu. Responsive dallar artık **değiştirdikleri taban kuralların yanında**.

### 5. Kendi kuralımı çiğnedim, bekçi yakaladı

İlk yazımda `font-size: 10px` (ölçek dışı punto) ve `border-radius: 18px/15px` (ölçek dışı
yarıçap) vardı — yani **D-128'in tam olarak alıntıladığım kuralını** çiğnemiştim.
`tests/mor-dil.test.ts` üçünü de yakaladı; punto kaldırıldı, yarıçaplar `var(--r2)`/`var(--r1)`
oldu. *Kuralı bilmek uymaya yetmiyor; bekçi yetiyor.*

## §Bekçi

`tests/responsive-canli.test.ts` — **7 denetim**, üç kolu var:

| Kol | Neyi yakalar |
|---|---|
| ① **canlılık** | Medya sorgularındaki her sınıf seçicisi hâlâ bir TSX dosyasında geçmeli. `fc061a0`'nın sessiz çürümesi bir daha olamaz. |
| ② **yer** | `index.css`'in medya sorgusu `hud.css` sınıfı hedefleyemez — kaynak sırası yüzünden sessizce ezilir. |
| ③ **kollar** | D-131'in kolları CSS'te duruyor mu: ortalama, ray, iki sütun, `display:contents`, ve eşik telefon portresini dışarıda bırakıyor mu. |

**4/4 mutasyonla doğrulandı** (`tools/mutasyon-responsive-d131.mjs`):

```
  M1  YAKALANDI   sinif yeniden adlandirildi, medya sorgusu guncellenmedi (OLU KOD)
  M2  YAKALANDI   kural index.css medya sorgusuna yazildi (SESSIZCE EZILIR)
  M3  YAKALANDI   esik telefon portresini icine aliyor (PORTREYI BOZAR)
  M4  YAKALANDI   display:contents dustu (Gorevler/Hedefler iki sutuna girmez)
```

M2 ilk denemede **kalıbı tutmadı** (`index.css`'te artık responsive dal kalmamıştı) ve araç bunu
"kaçtı" diye kırmızı bastı — mutasyon uygulanamayınca sessizce geçmiyor. Mutasyon, var olan bir
bloğu bozmak yerine **yeniden açacak** şekilde yazıldı; taklit ettiği hata da tam olarak bu:
bir sonraki tur *"responsive kuralı index.css'e yazayım"* der ve kural sessizce ezilir.


## §Final tam koşu — UYGULAMA SONRASI

Araç aynı, dünya aynı, kadrajlar aynı. **Dünya imzası TEMİZ** (`t20|s0|a3|n2` × 3 kadraj) —
ölçüm öncesi koşunun kırmızısı bu koşuda tekrarlanmadı, yani kırmızı yapısal değil **canlı NPC
zamanlamasıydı**. Konsol hatası **0**. Ham çıktı: `docs/olcum-panel-f1b-son.txt` (TAM · 663 sn).

### Telefon yatayı — beş ekranın hepsi (§F)

| Panel | kaydırma ÖNCE → SONRA | ilk ekranda ÖNCE → SONRA | görünen düğme ÖNCE → SONRA | gizli ödül |
|---|---|---|---|---|
| Görevler | 2,14× → **1,60×** | %47 → **%63** | 0/2 → **1/2** | 0 → 0 |
| **Hedefler** | 2,24× → **1,47×** | %45 → **%68** | 0/2 → **2/2** | **1 → 0** ✅ |
| Mağaza | 1,15× → **1,00×** | %87 → **%100** | 3/13 → **8/13** | **1 → 0** ✅ |
| Karakter | 1,06× → **1,00×** | %94 → **%100** | 5/7 → **6/7** | 1 → 1 |
| Ayarlar | 2,04× → **1,00×** | %49 → **%100** | 4/6 → **6/6** | 0 → 0 |
| **ORTALAMA** | **1,73× → 1,21×** | — | **12/30 → 23/30** | **3 → 1** |

**Üç ekranda kaydırma tamamen bitti** (Mağaza · Karakter · Ayarlar 1,00×). Kullanıcının
kaybolmuş ödül düğmesi (Hedefler) **geri geldi**. Kesilme hâlâ 0.

### HUD (§G)

| Kadraj | HUD ekranın ÖNCE → SONRA | şeridin kaçıklığı ÖNCE → SONRA |
|---|---|---|
| Telefon yatayı | %38,4 → **%19,0** | — → **0 px** |
| Tablet yatayı | %19,1 → **%7,0** | — → **0 px** |

Şerit ve nav artık **doğal genişlikte ve tam ortalı** (`430/+0` ve `362/+0` her iki kadrajda).

### DEĞİŞMEYENLER — kasıtlı

| Kadraj | Durum |
|---|---|
| **Portre (412×915)** | Beş ekran da **1,00× · %100** — dokunulmadı, eşik (560 px) portreyi dışarıda bırakıyor. |
| **Tablet yatayı panelleri** | 1,00–1,06× — dokunulmadı, eşik (max-height 560) tableti dışarıda bırakıyor. |

### KALAN İKİ EKSİK — dürüstlük payı

1. **Görevler 1,60× ve Hedefler 1,47×** — iyileşti ama **1,00×'e inmedi**. İkisi de en uzun
   içeriğe sahip ekranlar; iki sütun kaydırmayı yarıya indiriyor, bitirmiyor. Bitirmek için
   kart yüksekliklerinin kendisi kısalmalı — **sanat turunun kalemi**, CSS dalının değil.
2. **Karakter'de 3 ödül düğmesinden 1'i hâlâ ilk ekranda değil.** Karakter paneli canlı bir
   3B önizleme tuvali taşıyor (`.char-canvas`, kısa yatayda 120 px); tuval iki sütuna akmıyor,
   tam satır kalıyor. Ayrı kalem.

**Ayrıca (dev-only, sevk edilmiyor):** geliştirme rozetinin (`DEV`) ray başlığıyla çakıştığı
karelerde görülüyor (`ss/f1b-panel-quests-L1.png`). `import.meta.env.DEV` ile korunuyor, üretim
derlemesinde yok. Rayın orta bölümü de boş duruyor (cüzdan `margin-top:auto` ile dibe yaslı) —
üç bölge okunaklı ama ray zayıf; **sanat turunun kalemi**.

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

- **Ekran yönü (①) ve açılış ekranı (③) KARARA BAĞLANMADI.** İkisi de bu turda sunuldu, kullanıcı
  seçmedi. Uygulanan iş ikisinden de bağımsız.
- **Görevler/Hedefler 1,00×'e inmedi** (1,60× / 1,47×) — kart yüksekliği kalemi, sanat turu.
- **Karakter panelinde 1 ödül düğmesi ilk ekranda değil** — `.char-canvas` tam satır kalıyor.
- **G-55 (tablette büyütme) KARŞILANMADI.** Kol çürüdü çünkü hedeflediği sınıflar yoktu; ölü
  dallar temizlendi ama kalem **bugünkü sınıf adlarıyla yeniden yazılıp ölçülmeli**. Karede
  görülen somut hedef: tablette seviye çubuğu uzun ve boş duruyor.
- **Dünya imzasının yapısal/canlı ayrımı yapılmadı** — bu turda kırmızı yandı (canlı NPC sayısı),
  final koşusunda temiz çıktı. Ayrıştırma bilerek ertelendi (sonuca göre bekçi gevşetilmez).
- **`scrollHeight` kusuru araçta duruyor.** `kaydırma` sütunu taşan çocukları saymadığı için
  olduğundan iyi gösteriyor; güvenilir sütunlar `düğme gör/top` ve `gizliÖdül`. Aracın
  düzeltilmesi ayrı kalem.
- **Ray tasarımı ham:** orta bölüm boş. Sanat turunun kalemi.
