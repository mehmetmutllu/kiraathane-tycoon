# F3 tur 1 — REKLAM ALTYAPISI raporu (eklenti · R8 · doğal ara)

**Tur:** F3 tur 1 · Faz F · 2026-09-17
**Araç:** `tools/olcum-reklam-f3.mjs`
**Ham çıktı:** `docs/olcum-reklam-f3.txt` · §B/§E ham kayıt: `docs/olcum-reklam-f3-b.json`

> **Bu rapor commit #1'de KARAR BÖLÜMÜ BOŞ olarak yayımlanır** (D-084 sıra kilidi).
> Karar paketi sunulup kol seçildikten sonra §Karar ve §Uygulama doldurulur.

---

## SORU

F3 (AdMob) iki soruyla açılıyor ve ikisinin de cevabı bugün yok.

**① Hangi eklenti?** `docs/monetization.md` §4 şöyle yazıyor:

> *"Reklam: Capacitor AdMob eklentisi (güncel/bakımlı olan doğrulanacak — örn.
> @capgo/capacitor-admob)."*

Bir ad geçiyor ama seçim yapılmamış, üstelik doğrulama açıkça ertelenmiş. Bu tam olarak varyant
kapısının yasakladığı biçimdir: bir kol koda yazılıp öbürü sonradan ölçülemez.

**② R8 hâlâ güvenli mi?** D-130 küçültmeyi açtı ve gerekçesini `android/app/build.gradle`a yazdı:

> *"Capacitor kendi koruma kurallarını AAR içinde getiriyor ve R8 onları uyguluyor (eklenti ·
> CapacitorWebView · @JavascriptInterface); **kurulu eklenti sayısı 0 olduğu için yansıma yüzeyi
> en dar hâlinde. F3 (AdMob) ve F4 (IAP) eklenti getirdiğinde bu gerekçe geçersizleşir ve kol
> YENİDEN ölçülmelidir.**"*

Eklenti bu turda geliyor → gerekçe bu turda düşüyor. Kendi yazdığı koşulu tetikleyen bir karar,
o koşul çalıştırılmadan kapatılamaz.

**Turun kapsamı (bölme kararı):** bu tur **altyapı** — eklenti, R8, çocuk-güvenliği bayrakları,
mock katman. Reklamın **içeriği** — G-57 ödüllü video ekonomisi (*"2 saatte 1 4 video hakkı olsun
her videoda 1 elmas verelim veya 200 para vs. veya seviye arttıkça o da artar"*) —
`economy.config.ts`e dokunur, **varyant kapısına tabidir** ve kendi turunda (F3b) ölçülür.
Bu turda tek bir denge sayısı yazılmaz.

---

## KAPSAM DAMGASI — bu ölçümün ÖLÇMEDİĞİ şey

Bu araç **reklamın gösterildiğini görmez.** Gerçek dolgu (fill), gerçek gecikme, gerçek rıza
formu ve `tagForChildDirectedTreatment`ın ağa ne yansıttığı yalnız **cihazda** ölçülür.

Burada ölçülen: hangi eklentinin o bayrağı **sunduğu**, paketin **derlendiği**, R8'in eklenti
sınıflarını **yeniden adlandırmadığı**. *"Derlendi"* ile *"çalışıyor"* ayrı şeylerdir — F2'nin dpr
kolu ve F1a'nın R8 kolu gibi bu da **cihaz turuna bir kalem bırakır.**

---

## BULGULAR

### §A — EKLENTİ ADAYLARI (3 aday, aynı ölçütler)

Her satır paketin **kendi içinden** okundu: registry alanları + `npm pack` ile açılan tarball'ın
`android/build.gradle`ı, manifesti ve `dist/*.d.ts`i. *"Şu SDK'yı kullanıyor"* iddiası ikinci
elden değil, paketin gradle satırından.

| | **A1** `@capacitor-community/admob` | **A2** `@capgo/capacitor-admob` | **A3** `@admob-plus/capacitor` |
|---|---|---|---|
| sürüm | 8.1.0 | **8.1.18** | 2.0.0-alpha.4 |
| son yayın | 2026-08-14 | **2026-09-15** | 2024-11-15 |
| **son KARARLI sürüm** | **8.1.0** (2026-08-14) | **8.1.18** (2026-09-15) | **1.24.0 (2022-08-14)** |
| toplam sürüm | 68 | 44 | 64 |
| `@capacitor/core` | `^8.0.0` | `>=8.0.0` | **`>=3`** |
| lisans | **MIT** | MPL-2.0 | MIT |
| tgz | 68,2 KB | **34,4 KB** | 24,1 KB |
| dosya | 184 | 42 | 44 |
| android / ios | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ |
| **Google SDK** | `play-services-ads` **25.4.+** | `ads-mobile-sdk` **0.25.0-beta01** | `play-services-ads` 23.0.0 |
| SDK kararlı mı? | **kararlı** | **BETA ⚠** | kararlı (ama eski) |
| **UMP (rıza SDK)** | **✓** | **✗** | **✗** |
| rıza API (JS) | **✓** | ✗ | ✗ |
| `tagForChildDirectedTreatment` | ✓ | ✓ | ✓ |
| `tagForUnderAgeOfConsent` | ✓ | ✓ | ✓ |
| `maxAdContentRating` | ✓ | ✓ | ✓ |
| banner / interstitial / ödüllü | ✓ / ✓ / ✓ | ✓ / ✓ / ✓ | ✓ / ✓ / ✓ |

**A3 ELENDİ — ölçüm kendi kendini kapattı.** `npm view` en yeni sürüm olarak `2.0.0-alpha.4`
gösteriyor; araç "son **kararlı** sürüm" sütununu ayrı hesapladığı için görülen şu: bu paketin
son kararlı yayını **1.24.0, 2022-08-14** — dört yıl önce. Alpha'sı bile iki yıllık. `peerDependency`
hâlâ `@capacitor/core >=3` (proje 8'de), SDK'sı `play-services-ads 23.0.0`. Rakam olmasa
"bakımlı görünüyor" denebilirdi; sütun ayrılınca tersi çıktı.

**Ayırt eden ölçüt tazelikte değil, RIZADA.** Üç aday da çocuk bayraklarını (`tagForChildDirected`
· `tagForUnderAgeOfConsent` · `maxAdContentRating`) sunuyor; yani `monetization.md` §3'ün
"çocuğa-yönelik / sınırlı-veri modu" şartını üçü de karşılayabilir. Ayrılan yer **UMP**
(User Messaging Platform — Google'ın rıza SDK'sı): yalnız **A1**de var.

Bu bizim için opsiyonel bir süs değil. `monetization.md` §3 Faz 5'in görevleri arasında
**GDPR-K (AB çocuk)** uyumunu sayıyor; AB'de kişiselleştirilmemiş reklam göstermek bile bir
rıza mesajı gerektiriyor. A2/A3 seçilirse o yüzey **elle yazılacak ikinci bir iş** olarak kalır.

**A2'nin kendine özgü riski: BETA SDK.** `@capgo/capacitor-admob` en taze yayınlanan paket
(2026-09-15) ve en küçüğü (34,4 KB / 42 dosya) — ama altında Google'ın **yeni nesil**
`com.google.android.libraries.ads.mobile.sdk:ads-mobile-sdk` **0.25.0-beta01** var. Paketin kendi
gradle yorumu bunu itiraf ediyor: *"Next Gen is currently published as a beta artifact."*
Mağazaya çıkacak bir yapıda para akışının altına beta bir SDK koymak, ölçülmemiş bir risk
değil — **bilinen** bir risktir.

**A1'in kendine özgü riski: DİNAMİK SÜRÜM.** `playServicesAdsVersion = '25.4.+'` — `+` demek,
iki ayrı günde yapılan iki derlemenin farklı SDK alabileceği demek. Bu, F1a'nın *"sürümün iki
kaynağı vardı ve hiçbir yerde karşılaştırılmıyordu"* kusuruyla aynı cinsten: sessiz ve ancak
yayın anında pahalı. İyi haber: eklenti `rootProject.hasProperty` ile okuduğu için
`android/variables.gradle`dan **sabitlenebilir** — kolun uygulanabilir bir eki var.

**Hiçbir eklenti kendi R8 kuralını getirmiyor.** İkisinde de `consumerProguardFiles` yok;
`build.gradle`daki `proguardFiles` satırları eklentinin **kendi** derlemesine ait, bizim
uygulamamıza geçmiyor. Bizi koruyan şey `@capacitor/android`ın consumer kuralı:

```
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { ... }
-keep public class * extends com.getcapacitor.Plugin { *; }
```

Yani D-130'un *"Capacitor kendi koruma kurallarını AAR içinde getiriyor"* cümlesi **doğru** —
ama artık bir varsayım olarak değil, §B'de sayıyla sınanıyor.

---

### §B — R8 EKLENTİYLE (beş kol, gerçek `assembleRelease` + `bundleRelease`)

Her kol aynı ağaçta, sırayla, gerçek imzalı yayın derlemesi. Önceki kolun eklentisi silinerek
başlanıyor — yoksa ölçülen şey *"A1 mi A2 mi"* değil *"A1+A2 birlikte"* olur ve iki kol da kirlenir.

| kol | eklenti | R8 | derlendi | APK | AAB | `.dex` | tabana göre (APK) |
|---|---|---|---|---|---|---|---|
| **taban** | (yok) | açık | ✓ | **8,58 MB** | 8,89 MB | 1,05 MB | — |
| **com-r8** | A1 | açık | ✓ | **11,27 MB** | 12,86 MB | 6,44 MB | **+2,69 MB** |
| **com-acik** | A1 | KAPALI | ✓ | 14,46 MB | 14,12 MB | 15,61 MB | +5,88 MB |
| **capgo-r8** | A2 | açık | ✓ | **10,95 MB** | 12,68 MB | 5,82 MB | **+2,37 MB** |
| **capgo-acik** | A2 | KAPALI | ✓ | 15,38 MB | 15,11 MB | 18,24 MB | +6,80 MB |

> `.dex` sütunu **sıkıştırılmamış** `.dex` toplamıdır (zip merkezî dizininden okunuyor).
> D-130'un *"2,37 → 0,45 MB"* rakamı APK içindeki **sıkıştırılmış** boyuttu — iki sütun
> doğrudan karşılaştırılmaz. Tabanın burada 1,05 MB çıkması o 0,45 MB ile tutarlı (~2,3× oran).

**BİRİNCİ BULGU — beş kolun beşi de derlendi.** Hiçbir eklenti+R8 birleşimi derlemeyi kırmadı.
Bu, D-130'un endişesinin *derleme* tarafını kapatıyor; *çalışma zamanı* tarafı §E'nin işi.

**İKİNCİ BULGU — D-130'un korkusu ters yönlüymüş: eklenti R8'i RİSKLİ yapmadı, DEĞERLİ yaptı.**

| | R8 kapalı → açık | kazanç |
|---|---|---|
| taban (D-130, eklentisiz) | 10,58 → 8,58 MB | −2,00 MB (**−%18,9**) |
| **A1 + AdMob** | 14,46 → 11,27 MB | **−3,19 MB (−%22,1)** |
| **A2 + AdMob** | 15,38 → 10,95 MB | **−4,43 MB (−%28,8)** |

`.dex` tarafında fark daha da keskin: A1'de 15,61 → 6,44 MB (**−%58,7**), A2'de 18,24 → 5,82 MB
(**−%68,1**). Sebep açık — Google reklam SDK'sı büyük ve uygulamanın onun yüzeyinin küçük bir
kısmını kullanıyor; budanacak şey artınca budamanın getirisi de artıyor.

**Yani R8'i kapatmak bir kol değil.** Ölçüm bunu bir seçenek olarak açık bıraktı ve seçenek
kendi kendini eledi: küçültmeyi kapatmak APK'yı A1'de 14,46 MB'a, A2'de 15,38 MB'a çıkarıyor —
F2'nin (20,93 → 11,84) ve F1a'nın (11,84 → 8,58) bütün kazancını geri veriyor.

**ÜÇÜNCÜ BULGU — AdMob'un fiyatı: ~2,4-2,7 MB.** R8 açıkken tabana göre A1 **+2,69 MB**,
A2 **+2,37 MB**. Aradaki fark **0,32 MB** — A2 lehine, ama §A'nın beta SDK + UMP yokluğu
karşısında 0,32 MB'ın ağırlığı yok.

**AAB, APK'dan BÜYÜK çıkıyor** (A1: 12,86 vs 11,27) — beklenen davranış, `.aab` bölünmemiş
hâlde bütün yoğunlukları/ABI'ları taşır; Play cihaza indirirken böler. Yayın boyutu olarak
oyuncunun indireceği şey AAB'nin kendisi değil, ondan üretilen bölünmüş APK'dır.

---

### §E — YANSIMA YÜZEYİ: **köprü sınıfı R8'den sağ çıktı**

§B'nin tek başına söyleyebildiği şey *"derlendi"*, ve bu turun sorusu için yeterli değil. R8'in
eklentiyi bozması **derleme hatası vermez**: yeniden adlandırılmış bir `@CapacitorPlugin` sınıfı
sorunsuz derlenir, APK'ya girer ve ancak cihazda, köprü sınıfı adıyla aranırken çöker. D-130'un
gerekçesi tam olarak bunu varsayıyordu. Sınanabilir hâli R8'in kendi `mapping.txt`i.

Aranacak sınıf **elle yazılmadı** — kurulu eklentinin android kaynağından `@CapacitorPlugin`
taşıyan dosya bulunup paket + sınıf adı ondan türetildi (R2'nin *"ankraj listesi elle"* açık
ucunun tekrarlanmaması için; dördüncü bir aday eklenirse araç onu da kendiliğinden bulur).

| kol | `mapping.txt` sınıf satırı | köprü sınıfı | durum |
|---|---|---|---|
| **com-r8** (A1) | 10.972 | `com.getcapacitor.community.admob.AdMob` | **korundu** |
| **capgo-r8** (A2) | 9.439 | `admob.plus.capacitor.AdMobPlusPlugin` | **korundu** |

**⇒ Turun ② sorusunun cevabı: EVET, R8 eklentiyle güvenli.** On bini aşkın sınıfın yeniden
adlandırıldığı bir çıktıda eklentinin köprü sınıfı adını birebir koruyor — yani `@capacitor/android`ın
consumer kuralı (`-keep @…CapacitorPlugin public class *`) gerçekten uygulanıyor. D-130'un
varsayımı **doğruymuş**, ama artık varsayım değil.

**Yan bulgu — ölçüm tekrarlanabilir çıktı.** §E için `com-r8` ve `capgo-r8` kolları ikinci kez
koşuldu: `com-r8` APK'sı **11.818.573 bayt**, ilk koşudakiyle **bayt bayt aynı**. Yani §B'nin
sayıları tek bir derlemenin şansı değil.

**Ölçülmeyen, dürüstçe:** bu, köprü sınıfının **adının** korunduğunu gösterir; SDK'nın kendi
içindeki yansımayı (Google'ın AAR'ının kendi consumer kuralları) doğrulamaz. Onu ancak cihazda
gerçek bir reklam isteği gösterir — **cihaz turunun kalemi.**

---

### §C — DOĞAL ARA: **interstitial'ın bugün oyunda meşru yeri yok**

D-066 interstitial'ı *"SADECE doğal aralarda (ör. prestige sonrası, uzun offline dönüşü özeti
sonrası)"* diye serbest bırakıyor ve *"eylem ortasında ASLA"* diyor. Kural yazılı — ama o aralar
bugüne dek **sayılmadı**. Araç koddan saydı:

| kesinti noktası | testid | yer | doğal ara? |
|---|---|---|---|
| offline dönüş özeti | `offline` | `src/components/ui/HUD.tsx:431` | **EVET** |
| günlük görev ödülü | `daily-reward` | `src/components/ui/HUD.tsx:641` | **EVET** |
| hedef ödülü | `goal-reward` | `src/components/ui/HUD.tsx:620` | **EVET** |
| usta satın alma | `master-bar` | `src/components/ui/HUD.tsx:537` | HAYIR — 💎 harcama anı, eylem ortası |

**DOĞAL ARA SAYISI: 3.**

**PRESTIGE YOK.** D-066'nın birinci örneği — *"prestige sonrası"* — kodda **hiç uygulanmamış**;
`prestige`/`renovasyon` geçen tek satır yok, kavram yalnız `projectBrief.md`de *"uzun vade"*
olarak duruyor. Yani D-066'nın iki örneğinden biri mevcut değil.

**Kalan üçü de zaten bir reklam taşıyor.** Üç doğal aranın üçü de `RewardModal` — ve o modal
zaten *"▶ İzle, 2× al"* ödüllü düğmesini gösteriyor (§D). Bir interstitial'ı oraya koymak,
oyuncunun **ödülünü aldığı ekrana** ikinci bir reklam istiflemek olur. `monetization.md`
lafzını ihlal etmez ("doğal ara"dır) ama ruhunu ihlal eder.

**⇒ Turun ikinci sorusunun cevabı:** interstitial için bugün **uygun boş yer yok**. Bu bir
uygulama eksiği değil, ölçülen bir durum — ve interstitial'ın bu turda bağlanıp bağlanmayacağı
artık bir **kol** (§Kollar C0/C1/C2).

---

### §D — BAĞLAMA NOKTALARI (bugün pasif duran düğmeler, D-039 kalıbı)

*"Yeri belli, işlevi yok."* Eklenti gelince bağlanacak yüzey tam olarak bunlar — 8 kod satırı:

| yer | ne |
|---|---|
| `HUD.tsx:557` | `<button className="master-buy ad off" data-testid="master-ad" disabled>` — usta modalinde "İzle" |
| `HUD.tsx:900` | `adReady = false` — `RewardModal`ın varsayılanı |
| `HUD.tsx:994` | `<button className={'sheet-cta ad' + (adReady ? '' : ' off')} disabled={!adReady} onClick={onClaim}>` |
| `HUD.tsx:995` | `▶ İzle, 2× al` etiketi |
| `icons.tsx:178` | `PlayAdIcon` |

Bu düğmeler **üç** `RewardModal` çağrısının (offline · günlük görev · hedef) hepsinde çiziliyor,
artı usta modalinde bir dördüncüsü var → **4 yüzey.**

#### §D'nin yakaladığı SESSİZ KUSUR — "2× al" düğmesi 1× veriyor

`HUD.tsx:994`te ödüllü düğmenin tıklaması `onClick={onClaim}` — yani **"Al" düğmesiyle birebir
aynı işlev.** Etiket *"İzle, 2× al"* diyor, kod tek kat veriyor.

Bugün zararsız: `adReady` varsayılanı `false`, düğme `disabled`, dört yüzeyin dördünde de basılı
değil. Ama bu kusur **ölü kodda değil, bekleyen kodda**. Reklam bağlanınca yapılacak ilk şey
`adReady`i `true` etmek olacak — ve o an düğme çalışır hâle gelip **vaat ettiğinin yarısını**
verecek. Hiçbir test bunu tutmuyor: `adReady` hiçbir yerde `true` geçilmediği için çarpan yolu
bugüne dek bir kez bile koşmadı.

Bu, F6 tur 3'ün dersinin aynısı: **kusur duran karede görünmüyor**, ancak durum değişince
ortaya çıkıyor.

---

## KOLLAR

Kollar ikiye ayrılıyor: **teknik çatallar** (ölçüm kendi kendini kapattı — `feedback_technical_forks`:
*"ürün/kapsam sorulur, kod yapısı/veri şeması sorulmaz: en iyisini seç ve gerekçelendir"*) ve
**ürün çatalları** (para ve oyuncu deneyimi — kullanıcı seçer).

### Teknik çatallar — SORULMUYOR, gerekçesi yazılıyor

| kol | seçilen | gerekçe (sayıyla) |
|---|---|---|
| **eklenti** | **A1** `@capacitor-community/admob` | tek UMP/rıza taşıyan aday; SDK'sı kararlı (A2 beta). Bedel A2'ye göre **+0,32 MB** — §A'nın iki riski karşısında ağırlığı yok |
| **SDK sürümü** | `variables.gradle`da **sabitlenir** | eklentinin varsayılanı `25.4.+` (dinamik); `android/variables.gradle` zaten bu işin dosyası ve `rootProject.ext` üzerinden okunuyor |
| **R8** | **açık kalır** | kapatmak APK'yı A1'de 11,27 → **14,46 MB** yapıyor (+3,19); F2+F1a'nın bütün kazancını geri verir. Kol ölçüldü ve kendi kendini eledi |
| **"2× al" kusuru** | **düzeltilir + bekçi** | §D: düğme bugün `onClick={onClaim}` — reklam bağlanınca vaadinin yarısını verecek. Çarpan tek yerden geçmeli ki F3b sayıyı koyduğunda tek satır değişsin |

### Ürün çatalları — KULLANICI SEÇER

**Q1 · Interstitial (tam ekran geçiş reklamı) bu turda bağlansın mı?**

| kol | ne olur | §C'nin sayısı ne diyor |
|---|---|---|
| **C0 — hiç koyma** ✓ öneri | interstitial kodu hiç yazılmaz; `monetization.md`ye "yeri yok, prestige gelince tekrar bakılacak" notu düşer | doğal ara **3**, üçü de zaten ödüllü düğme taşıyor; D-066'nın birinci örneği (prestige) **mevcut değil** |
| **C1 — yalnız offline dönüşünde** | oyun açılışındaki özet ekranından SONRA, sıklık sınırlı (≥ 3 dk) | 3 aradan **1**'i; oyuncunun ödül aldığı ekranın üstüne biner |
| **C2 — üç doğal aranın hepsinde** | offline + günlük görev + hedef ödülü | 3/3; ödül ekranı başına **iki** reklam yüzeyi olur |

**Q2 · Banner (alt şerit reklam) bu turda bağlansın mı?**

| kol | ne olur | bedeli |
|---|---|---|
| **B0 — yok** ✓ öneri | banner kodu yazılmaz | — |
| **B1 — altta, "Reklamları Kaldır" ile gizlenir** | ekranın altında kalıcı şerit | D-131/D-132 HUD'u yeni ölçüp yatayda %38,4 → %19,0'a indirdi; banner o kazancın üstüne ~50-60 px kalıcı şerit koyar ve alt gezinme ile çakışır |

**Önerim C0 + B0.** Gerekçe tek cümle: **oyunun bugün interstitial'a verecek boş yeri yok**, banner
ise F6'da yeni kazanılan ekran alanını geri alır. İkisi de kalıcı olarak reddedilmiyor — prestige
(Renovasyon) uygulandığında C kolu kendi turunda yeniden açılır.

### KULLANICININ YAPMASI GEREKEN — AdMob hesabı

Gerçek reklam kimliği (`ca-app-pub-…~…` uygulama kimliği + reklam birimi kimlikleri) yalnız
**AdMob hesabından** alınır; kod tarafından üretilemez. O gelene kadar Google'ın **resmî test
kimlikleri** kullanılır — geliştirme ve duman testi için doğru olan da budur (gerçek kimlikle
test etmek hesabın askıya alınma sebebidir). Gerçek kimlik geldiğinde tek dosyada değişir.

---

## KARAR

_(BOŞ — karar paketi sunulduktan sonra doldurulur · D-084 sıra kilidi)_

---

## UYGULAMA

_(BOŞ)_
