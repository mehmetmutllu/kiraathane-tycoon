# F1 — KABUK VE İMZA raporu

**Tur:** Faz F · F1 (Capacitor kabuğu + imzalı sürüm) — **kabuk ve imza yarısı.**
Kullanıcı 2026-09-17'de turu ikiye böldü: bu tur **kabuk + imza**, ikon ve açılış ekranı
**ayrı tasarım turu** (aday render'ı ister, metinle sorulmaz — `feedback_show_dont_ask`).

**Araç:** `tools/olcum-paket-f1.mjs` · **Ham çıktı:** `docs/olcum-paket-f1.txt`
**Damga:** `OLCUM=tam` · dört kol · gerçek gradle derlemesi · 2026-09-17

## SORU

Mağazaya gidecek imzalı sürümü üretirken hangi kol ne kadar **bayt** ve ne kadar **risk**
getiriyor — küçültme (R8) mi, çıktı biçimi (APK ↔ AAB) mi, yoksa ikisi birden mi?

## KAPSAM DAMGASI — bölümlerin güveni aynı değil

| Bölüm | Güven | Neden |
|---|---|---|
| §A kimlik | **KESİN** | manifest/gradle'dan okunur, derleme bile gerekmez |
| §B taban | **KESİN** | diskteki bayt; her koldan önce çıktı klasörü silinir |
| §C kollar | **BAYT kesin, DAVRANIŞ değil** | boyut ölçüldü; uygulamanın AÇILDIĞI ölçülmedi — cihaz gerek |
| §D native | **KESİN** | APK içi `.so` dökümü |
| §E R8 riski | **DOLAYLI** | R8'in kendi çıktısı okunur; çalışma kanıtı değil, risk göstergesi |

**Cihaz bağlı değil.** F2 turundan devreden damga bu turda da geçerli: kol seçimi bayta
bakarak yapılabilir, ama R8 kolunun **çalıştığı** ancak telefonda görülür.

## §Bulgular

> **Bu bölüm KARARDAN ÖNCEKİ ölçümdür ve öyle bırakılmıştır** — kararın hangi sayılara bakarak
> verildiği ancak böyle okunabilir. Uygulamadan sonraki final koşunun sayıları §Uygulama'da.
> İki koşu arasında release APK 10,58 → 10,59 MB ve AAB 10,36 → 10,42 MB oynadı: aradaki fark
> **imzanın kendisi** (final koşuda çıktılar artık imzalı). Kolların sıralaması değişmedi.

### §A — Kabuğun ölçüm anındaki kimliği (karar öncesi)

| Alan | Değer | Not |
|---|---|---|
| `appId` / `applicationId` / `namespace` | `com.kosekiraathanesi.game` | üçü de aynı, tutarlı |
| `appName` | Köşe Kıraathanesi | `strings.xml` ile aynı |
| `versionCode` / `versionName` | `1` / `1.0` | **elle**, `package.json` ile bağlı değil |
| `package.json` version | `0.0.0` | **sürüm iki yerde ve türetilmiyor** |
| minSdk / target / compile | 24 / 36 / 36 | Play'in targetSdk 35+ şartı karşılanıyor |
| izinler | `INTERNET` | tek izin; reklam/IAP gelince artacak |
| `screenOrientation` | **YOK** | cihaz serbest döndürür |
| `allowBackup` | `true` | Android otomatik yedeği kaydı taşır |
| `signingConfig` | **YOK** | `assembleRelease` **imzasız** çıkıyor |
| `android/keystore.properties` | **YOK** | keystore henüz üretilmedi |

**Bulgu A1 — sürümün iki kaynağı var.** `build.gradle` `1.0` diyor, `package.json` `0.0.0`.
İkisi bugün hiçbir yerde karşılaştırılmıyor; yani yayın günü hangisinin doğru olduğunu
söyleyen bir şey yok. Bu, F2'nin *"gradle bayat dosyanın üzerine yazıyor"* kusuruyla aynı
cinsten: **sessiz ve ancak yayın anında pahalı.**

**Bulgu A2 — release bugün imzasız.** `app-release-unsigned.apk` üretiliyor. Debug APK
Android'in ortak hata ayıklama anahtarıyla imzalı (`CN=Android Debug`, SHA-256
`5c35ac9e…3d20`) — bu anahtar mağazaya gidemez ve cihazda da "bilinmeyen kaynak" olarak durur.

### §B — Taban: debug APK'nın ağırlığı nereden geliyor

**11,84 MB** (12.419.009 bayt) · 962 girdi. F2 turunun bildirdiği sayı **birebir doğrulandı**
(o tur `apk-temizle.mjs` ile bayat kabuğu silmişti; bu araç da her koldan önce siliyor).

| Kova | Adet | Sıkışık | Açık | APK payı |
|---|---:|---:|---:|---:|
| assets · modeller (.glb) | 500 | 5,00 MB | 11,92 MB | %42,2 |
| kod (.dex) | 6 | 3,21 MB | 8,35 MB | %27,1 |
| assets · ses | 1 | 1,70 MB | 1,70 MB | %14,3 |
| assets · js + css | 11 | 0,61 MB | 1,68 MB | %5,2 |
| res + resources | 380 | 0,61 MB | 0,71 MB | %5,2 |
| assets · yazı tipleri | 15 | 0,51 MB | 0,90 MB | %4,3 |
| diğerleri + META-INF | 49 | 0,01 MB | 0,04 MB | %0,1 |

**Bulgu B1 — ikinci ağırlık kod, ve kodun tamamı bizim değil.** Modellerden sonra en ağır
kova **3,21 MB `.dex`** (%27,1). Oyunun kendi Java'sı tek satırdır (`MainActivity extends
BridgeActivity`); bu 3,21 MB androidx + Capacitor'dır. F2 turu ağırlığı **asset** tarafında
aramıştı ve 11 MB bulmuştu; ağırlığın geri kalanının dörtte biri **kod** tarafında duruyor ve
oraya hiç bakılmamıştı.

**Bulgu B2 — ses tek dosya ve hiç sıkışmıyor.** `muzik_salon.ogg` 1,70 MB → 1,70 MB (oran
1,00). Zaten sıkıştırılmış bir biçim, bu doğru davranış; ama APK'nın **%14,3'ü tek parça
müzik** demek. (S9'un *"müziğin telefondaki gerçek maliyeti ölçülmedi"* açık ucu: **indirme**
tarafı artık ölçülü — 1,70 MB. Çözme maliyeti hâlâ ölçülmedi.)

### §C — Kollar (release çıktı)

| Kol | Çıktı | Boyut | V0 farkı | dex | `.so` |
|---|---|---:|---:|---:|---:|
| TABAN | debug APK | 11,84 MB | — | — | 0 |
| **V0** | release APK · küçültme **kapalı** (bugünkü ayar) | **10,58 MB** | — | 2,37 MB | 0 |
| **V1** | release APK · **R8 + kaynak budama** | **8,58 MB** | **−%18,9** | 0,45 MB | 0 |
| **V2** | AAB · küçültme kapalı | **10,36 MB** | −%2,0 | 2,37 MB | 0 |
| **V3** | AAB · **R8 + kaynak budama** | **8,83 MB** | −%16,5 | 0,45 MB | 0 |

Süreler karşılaştırılamaz (gradle önbelleği kollar arasında ısınıyor); karşılaştırılabilir
olan **boyut** sütunudur.

**Bulgu C1 — kazancın tamamı kod tarafından geliyor.** V0 → V1 farkı 1,99 MB; aynı geçişte
`.dex` 2,37 → **0,45 MB** (−1,92 MB). Yani küçültmenin getirdiği baytın **%96'sı** dex'ten.
Kaynak budama (`shrinkResources`) kendi başına 0,58 → 0,50 MB, yani **0,08 MB**. Kol tek
kalemdir ama içindeki iki ayarın ağırlığı 24 kat farklı.

**Bulgu C2 — debug → release geçişi tek başına 1,26 MB.** Hiçbir küçültme açmadan, sırf
release derlemesi APK'yı 11,84 → 10,58 MB'a indiriyor (−%10,6). Bugüne kadar konuşulan
*"APK 11,84 MB"* rakamı **debug** rakamıydı; mağazaya giden sayı bundan küçük.

**Bulgu C3 — AAB, APK'dan küçük değil; farklı bir şey ölçüyor.** V3 (8,83 MB) V1'den
(8,58 MB) **büyük**. Bu bir gerileme değil: AAB tüm ekran yoğunluklarını ve dilleri taşıyan
bir **dağıtım kabıdır**, kullanıcı onu indirmez — Play ondan cihaza özel APK üretir.
**Ölçülmedi:** indirilen boyut (bundletool kurulu değil). **Üst sınır verilebilir:** AAB'deki
`res + resources` payı **0,36 MB** olduğu için, yoğunluk/dil bölünmesinden gelebilecek kazanç
bu değerin altındadır. Yani indirilen boyut ≈ V1 ile V1−0,36 MB arası.

### §D — Native kütüphane / Play 16 KB sayfa şartı

APK içinde **`.so` YOK** (dört kolun dördünde de 0). Play'in 16 KB sayfa hizalama şartı
native kütüphaneleri bağlar; bu projede native kütüphane olmadığı için **kol boştur**.
Bu, F2'nin *"Capacitor'da ağ yok"* tespitinin kardeşi: şart var, bize dokunan yüzeyi yok.

### §E — R8 kolunun risk kanıtı

Boyut kazancını ölçmek kolay; asıl soru **silinen 1,92 MB kodun içinde uygulamanın açılması
için gereken bir şey var mıydı** ve buna cihazsız cevap verilemez. Verilebilecek en yakın
cevap AGP'nin kendi bıraktığı üç dosyadır (`configuration.txt` · `seeds.txt` · `usage.txt` ·
`mapping.txt`):

| Gösterge | Değer |
|---|---|
| R8'in uyguladığı `-keep` kuralı | **85** |
| Capacitor eklenti kuralı (`* extends com.getcapacitor.Plugin`) | **VAR** |
| `CapacitorWebView` kuralı | **VAR** |
| `@JavascriptInterface` kuralı | **VAR** |
| `MainActivity` çıktıda | **EVET** |
| `Bridge` · `BridgeActivity` · `WebViewLocalServer` çıktıda | **üçü de EVET** |
| `com.getcapacitor` TAMAMEN silinen sınıf | **15** |
| `com.getcapacitor` budanan (duruyor, üyesi atıldı) | **47** |
| Çekirdek sınıf silindi mi | **HAYIR** |
| Kurulu Capacitor eklentisi | **0** |

**Bulgu E1 — Capacitor kendi koruma kurallarını getiriyor ve R8 onları uyguluyor.** Eklenti,
WebView ve `@JavascriptInterface` kurallarının üçü de `configuration.txt`te. Capacitor'da R8
riskinin ana kaynağı **yansımayla bulunan eklentiler**dir; bu projede kurulu eklenti
**sıfır** (`capacitor.plugins.json` = `[]`). Yani bugünkü yansıma yüzeyi en dar hâlinde.

**Bulgu E2 — kalan belirsizlik iki sınıfta toplanıyor.** Tamamen silinen 15 sınıfın on üçü
kullanılmayan istisna/kaynak/iç sınıf. İkisi yönlendirmeyle ilgili: `ProcessedRoute` ve
`ServerPath$PathType`. R8 bunları erişilemez saydı; `WebViewLocalServer` duruyor. **Bu bir
hata kanıtı değil, denetlenmemiş tek nokta** — cihaz koşusunda ilk bakılacak yer burası.

**Bulgu E3 — F3/F4 bu kolu yeniden açacak.** Reklam (AdMob) ve IAP (RevenueCat) birer
Capacitor eklentisi getirir; eklenti sayısı 0'dan çıktığı anda §E'nin *"yansıma yüzeyi en
dar"* gerekçesi geçersizleşir ve R8 kolu **yeniden ölçülmelidir**.

### §F — Paket adını değiştirmenin bedeli

Kullanıcı 2026-09-17'de `com.memedobro.kosekiraathanesi` önerisini onayladı; kabukta bugün
**`com.kosekiraathanesi.game`** yazılı. Değişikliğin maliyeti sayıldı:

| Dokunulacak | Adet | Not |
|---|---:|---|
| Kod/yapılandırma dosyası | **4** | `capacitor.config.ts` · `android/app/build.gradle` (2 geçiş) · `strings.xml` (2 geçiş) · `MainActivity.java` |
| Java paket dizini | **1** | `java/com/kosekiraathanesi/game/` → yeni yola taşınır |
| Belge | **3** | `architecture.md` · `docs/karar/yayina-kalanlar.html` · arşiv |

**Bulgu F1 — bedel bugün küçük, yarın sonsuz.** Toplam yedi dosya ve bir dizin taşıması; yarım
saatlik iş. Ama `applicationId` Play'de **kalıcı kimliktir**: uygulama yayımlandıktan sonra
değiştirilemez, değiştirmek yeni bir uygulama listelemek demektir. Yani bu kalem **ucuz
olduğu son turdadır**.

## §Karar

**D-130 — kullanıcı seçimi 2026-09-17: `1C · 2A · 3A`.**

| Kalem | Seçilen | Elenen |
|---|---|---|
| Paket adı | **`com.memedobro.teahousetycoon`** (1C) | 1A `com.kosekiraathanesi.game` · 1B `com.memedobro.kosekiraathanesi` |
| Küçültme | **R8 + kaynak budama AÇIK** (V1) | küçültme kapalı |
| Sürüm | **`0.9.0`** · versionCode 900 | `1.0.0` · `0.1.0` |

**Karar 1 paket sunulduktan SONRA değişti — ve asıl karar orada oldu.** Pakette iki kol vardı
(mevcut ad ↔ onaylanmış ad); kullanıcı ikisini de eledi ve soruyu büyüttü: *"kosekiraathanesi
olmayacak, cafe tycoon gibi bir şey düşünüyorum ki genel kullanıcıya hitap etsin."* Yani kalem
bir **kimlik** kalemi değil bir **konumlandırma** kalemiymiş. Ölçüldü:

- **Jenerik ad rafı dolu:** "Cafe Tycoon" ile neredeyse birebir aynı başlıkta en az beş oyun var
  (Idle Cafe Tycoon: Coffee Shop · Café Tycoon Idle Coffee Shop · CoffeeAddict · Idle Coffee Shop
  Tycoon · Idle Burger Shop: Cafe Tycoon). O kelimede sıralanmak indirme hızıyla olur; sıfır
  indirmeli bir uygulama o başlığı taksa da getirisi **sıfır**, bedeli ayırt ediciliğin tamamı.
- **Çayhane rafında kelime kalabalık ama MEKÂN boş:** Tsuki Tea House · My Dream TeaHouse ·
  Little Corner Tea House — üçü de Japon/Çin estetiği. Türk kıraathanesi rafta yok.
- **Adı İngilizceleştirmek oyunu uluslararası yapmaz:** oyun metninin tamamı Türkçe. Genel
  kullanıcı hedefinin gerçek bedeli ad değil **yerelleştirme** ve o panoda hiç yok.

**Çözülme biçimi — ad ile kimlik ayrıldı.** Mağaza başlığı her sürümde ve **dil başına** ayrı
yazılabilir; kalıcı olan yalnız `applicationId`. Bu yüzden kimlik adı taşımayan bir kök aldı
(`com.memedobro`), başlıklar ise iki dilde ayrı seçildi ve **"cafe" anahtar kelimesi başlığı
feda etmeden İngilizce başlığın içine kondu**:

| | Başlık | Karakter |
|---|---|---|
| İngilizce | **Tea House Tycoon: Idle Cafe** | 27/30 |
| Türkçe | **Köşe Kıraathanesi: Tycoon** | 25/30 |

Cihazdaki simge adı da dile bağlandı: `values/strings.xml` → *Tea House Tycoon*,
`values-tr/strings.xml` → *Köşe Kıraathanesi*.

**Sorulmayanlar (teknik çatal — `feedback_technical_forks`):** çıktı biçimi **ikisi de** (Play
AAB ister, APK cihaz denemesi için) · sürüm **tek kaynağa** bağlandı · keystore RSA 4096 /
10.000 gün / `C:\dev-ortam` · `allowBackup` açık kaldı.

**Bilerek sorulmayan:** ekran yönü. Cevabı *oyunun yatayda nasıl göründüğü*, yani sayısı bu
turda yok → **F1b'de ölçülüp gösterilerek sorulacak.** Kalıcı kalem değil.

## §Uygulama

| Dosya | Ne oldu |
|---|---|
| `capacitor.config.ts` | `appId` + `appName` yeni kimliğe |
| `android/app/build.gradle` | kimlik · `package.json`'dan sürüm türetme · `signingConfigs.release` · `minifyEnabled` + `shrinkResources` |
| `android/app/src/main/java/com/memedobro/teahousetycoon/MainActivity.java` | paket satırı + **dizin taşındı** |
| `android/app/src/main/res/values/strings.xml` | varsayılan ad İngilizce; kimlik alanları burada |
| `android/app/src/main/res/values-tr/strings.xml` | **yeni** — Türkçe cihazda "Köşe Kıraathanesi" |
| `package.json` | `0.0.0` → **`0.9.0`** (tek kaynak) + `npm run yayin` betiği |
| `.gitignore` | `android/keystore.properties` · `android/*.jks` |
| `tools/apk-temizle.mjs` | bayat çıktı temizliği **AAB'yi de** kapsıyor |
| `C:\dev-ortam\topla.ps1` · `kur.ps1` | keystore iki makine arasında senkronlanıyor |

**Üretilen imzalı çıktılar** (`npm run yayin`):

| Çıktı | Boyut | İmza |
|---|---:|---|
| `app-release.apk` | **8,58 MB** (9.000.474 bayt) | ✅ doğrulandı — v2 şeması · `CN=Tea House Tycoon, O=memedobro, C=TR` · SHA-256 `ab2b4f60…c874` |
| `app-release.aab` | **8,89 MB** (9.318.507 bayt) | ✅ imzalı (Play'e giden dosya) |

Debug APK 11,84 MB'dan mağazaya giden APK 8,58 MB'a indi: **−%27,5.**

## §Bekçi

`tests/paket-f1.test.ts` — **19 denetim** · `tools/mutasyon-paket-f1.mjs` — **18 mutasyon,
18'i de kırmızı.**

Mutasyonlar beş kümede: kimlik (yarım yeniden adlandırma · namespace ayrışması · capacitor ·
url şeması) · sürüm (elle yazma · sabit kod · bozuk semver · basamak taşıran formül) · imza
(parola gömme · iki `.gitignore` satırı · koşulsuz kırılma) · küçültme (iki ayar ayrı ayrı) ·
dil ve kabuk (kimlik sızması · varsayılan ad · yeni izin · `allowBackup`).

**İlk koşuda 2 mutasyon kaçtı (M10 · M11) ve delik gerçekti.** Bekçi `.gitignore`ın METNİNDE
kalıp arıyordu; satırın başına `#` koyan mutasyon kuralı **öldürdüğü hâlde** metni bozmadığı
için testi yeşil bıraktı — yani bekçi dosyanın ne YAZDIĞINI denetliyordu, ne YAPTIĞINI değil.
Artık git'in kendisine soruluyor (`git check-ignore`), üstelik bir **karşı örnekle** birlikte:
`android/app/build.gradle` yok sayılmamalı, yoksa fazla geniş bir kural kabuğu depodan düşürür.

### Aracın kendisinde bulunan altı kusur

Bu turun en pahalı dersi araçta çıktı. `tools/olcum-paket-f1.mjs` altı kez yanlış okudu ve
**altısı da kolu daha karamsar gösteriyordu** — yani düzeltilmese, doğru kol sessizce elenirdi:

1. Node 18.20+ bir `.bat`ı doğrudan `spawn` etmeyi reddediyor (CVE-2024-27980), hem de sessizce:
   `status` null, `stderr` boş. **Çıkış kodu null ise komut çalışmadı demektir, kırıldı demek
   değildir.**
2. `usage.txt`in iki satır dilbilgisi var: iki noktayla biten satır sınıfın DURDUĞUNU, bitmeyen
   satır TAMAMEN silindiğini söyler. Ayırmayan sayaç budanmış her sınıfı "silinmiş" saydı.
3. Aynı dosya CRLF: satır sonundaki `\r` yüzünden iki nokta sınaması hiç tutmadı.
4. `Bridge$Builder` atılmışken `Bridge` duruyordu; `\b` ile biten kalıp `$`ta sınır bulup **iç
   sınıfı çekirdek sandı** ve R8 kolunu "ölü" ilan etti.
5. **Kol yaması, ölçtüğü dosyanın şeklini varsayıyordu.** D-130 `release` bloğuna `signingConfig`
   ekleyince yama imza satırını düşürdü ve dört kolun dördü birden "KIRILDI" çıktı. Ders aracın
   kendi cinsinden: bir ölçüm aracı kaynağın şeklini varsayarsa, kaynak değiştiği gün ölçüm
   değil ARAÇ kırılır.
6. **İmza sınaması yanlış katmana bakıyordu.** Zip içinde `META-INF/*.RSA` aramak **v1 (JAR)**
   imzasını arar; minSdk 24 olduğu için AGP yalnız **v2** ile imzalıyor ve v2 imzası zip girdisi
   değil, APK İmza Bloğu'nda duruyor. Araç imzalı APK'ya "imzasız" dedi. Kusuru gizleyen şey,
   iki çıktıdan birinin (AAB jar-imzalı) doğru cevap vermesiydi.

### Final tam koşu

`vitest` **1292 ✓** (58 dosya) · `npm run duman` **45/45 ✓** · `tsc -b` temiz ·
`OLCUM=tam` ölçüm yeniden koşuldu ve ham çıktı bugünkü kaynakla damgalandı.

## §Açık uçlar

1. **R8 kolu cihazda doğrulanmadı.** §E'nin kanıtı güçlü ama dolaylı; imzalı APK telefona
   kurulup açılana kadar kol "ölçüldü, denenmedi" durumunda. Açılmazsa tek satırla geri alınır.
2. **Denetlenmemiş iki sınıf:** `ProcessedRoute` ve `ServerPath$PathType` R8 tarafından atıldı.
   Cihazda bir sorun çıkarsa ilk bakılacak yer burası.
3. **F3/F4 bu kolu yeniden açar.** AdMob ve RevenueCat birer Capacitor eklentisi getirir;
   eklenti sayısı 0'dan çıktığı anda "yansıma yüzeyi en dar" gerekçesi geçersizleşir.
4. **AAB'nin indirilen boyutu ölçülmedi** (bundletool yok). Üst sınır biliniyor: `res +
   resources` payı 0,37 MB, kazanç bundan azdır.
5. **Yerelleştirme panoda yok.** "Genel kullanıcıya hitap etsin" hedefinin gerçek bedeli bu ve
   ölçülmedi — oyun metninin tamamı Türkçe. Kendi turunu ister.
6. **v3 imza şeması kapalı** (yalnız v2). Play App Signing paketi yeniden imzaladığı için
   bugün sonucu yok; anahtar döndürme (key rotation) gündeme gelirse bakılır.
7. **Ekran yönü** — F1b'ye bırakıldı (§Karar).
