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

### §A — Kabuğun bugünkü kimliği

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

_(boş — karar paketi kullanıcıya sunulacak)_

## §Uygulama

_(boş)_

## §Bekçi

_(boş)_
