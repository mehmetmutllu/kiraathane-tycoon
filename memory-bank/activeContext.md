# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-17 — **F1b TUR 2 ÖLÇÜLDÜ, KARAR BEKLİYOR** · Faz F 2/6 · 107/112)

```
SORU            : G-54 deliği — açılan ekranlar yatayda/tablette hiç görülmedi; yön kararı
                  bunlar bilinmeden verilemez. + G-51/G-52 (ortala) + G-55 (tablet basamağı).
ÖLÇÜLEN KOLLAR  : §F 5 panel × 3 kadraj = 15 hücre · §G Y0/YD/YD+ × 2 kadraj · §H T0/T+/T+D
                  · §I P0/PA/PB/PC × 5 panel (KAREDEN doğdu) = 44 hücre + 2 sonda
SAYILAR         : docs/kabuk-raporu-f1b.md §F–§I · ham: docs/olcum-panel-f1b.txt (TAM, 667 sn)
                  + docs/olcum-panel-sonda-f1b.txt · commit #1 `d4e65b5`
KARAR           : **BEKLİYOR.** Revize paket sunuldu, üç soru da açık.
UYGULAMA        : yok (kod yazılmadı; kollar CSS katmanı olarak canlı oyuna enjekte edildi)
BEKÇİ           : yok (karar gelmedi)
PAKET (v2)      : https://claude.ai/artifact/JGzwnM3N9rDXbt8Rbbz4jE
```

**TUR 2'NİN DÖRT BULGUSU:**

1. **Sorun YÖNDE değil, TELEFON YATAYINDA.** Portrede 5/5 ekran kusursuz (1,00× kaydırma,
   %100 içerik, gizli ödül düğmesi 0). Tablette en kötü 1,06×. Telefon yatayında Görevler
   **%47**, Hedefler **%45**, Ayarlar **%49** ve Hedefler'in **tek ödül-alma düğmesi ilk ekranda
   görünmüyor**. Hiçbir kadrajda kesilme yok (0/15) — panel bozulmuyor, **gömülüyor**.
   → **Yön kararı artık iki taraflı:** K1 dükkânı 2× gösterir ama üç ekranı gömer.

2. **G-51 BEDAVA.** YD+ (ortalı) ile YD (sola yaslı) aynı sayıyı verdi — HUD %19,0 ↔ %19,0
   (telefon), %7,1 ↔ %7,0 (tablet), açık zemin 596,9 ↔ 596,8. Değişen tek şey **kaçıklık**:
   −233 → 0 (telefon), −415 → 0 (tablet). Hipotez "sayı genişlikten gelir, hizadan değil" tuttu.

3. **`index.css`'in İKİ RESPONSIVE DALI DA ÖLÜ KOD — turun en pahalı bulgusu.**
   `max-width:400px` blogunda 15 seçiciden **2'si**, landscape blogunda 18'den **3'ü** canlı;
   `--pill-h` jetonu tamamen ölü (`.pill` TSX'te 0 kez geçiyor). Sebep `fc061a0` (2026-09-06,
   Arayüz v2): HUD yeniden adlandırıldı, medya sorguları onunla gelmedi.
   → **TUR 1'İN B-3 BULGUSUNU AÇIKLIYOR** ("alt bant her yönde 186 px sabit"): onu kısaltacak
   dal hiç çalışmıyor. **D-128'in dar-ekran kuralı bugün fiilen uygulanmıyor.**

4. **Telefon yatayı UCUZ bir CSS koluyla kurtarılamıyor.** PA (geniş kabuk) ve PC (tam en)
   **tek hücre bile** oynatmadı — kartlar tam satır, kabuk genişleyince içerik genişliyor.
   PB (iki sütun) yalnız Ayarlar'ı çözdü (dışarıda kalan öğe 23 → 1). Görevler/Hedefler hiç
   değişmedi: içeriklerini tek `<ul>`de taşıyorlar, gride tek hücre giriyor.
   → Yatay kilidi seçilirse iş **beş panelin gövdesini düzleştirmek**; kendi turunu ister.

**DÖRT ARAÇ KUSURU, DÖRDÜNÜ DE GÖZ YAKALADI** (tur 1'de iki, tur 2'de iki):
③ tablet kolu var olmayan sınıfları hedefledi (`.lvl-star`/`.cur-item` → `null`); ayrıca
`.round-btn{46px}` kolu `hud.css`'teki `.round-btn.gear` (0,2,0) karşısında özgüllükten düştü —
**kol kavramsal değil YAZIM olarak** başarısız oldu · ④ **`scrollHeight` taşan çocukları
saymıyor**, altı hücrenin **beşinde** yanlış (PB/Mağaza: 350 diyor, gerçek 426). Güvenilir
sütun `dışarıda`. §F'nin `kaydırma` sütunu bu yüzden **olduğundan iyi** gösteriyor — yön doğru,
şiddet eksik.

**BEKÇİ KIRMIZI YANDI ve gevşetilmedi:** T2 imzası `n2`, P1/L1 `n3`. Yapısal dünya üçünde de
aynı (t20|s0|a3), ayrışan tek terim canlı NPC sayısı ve ölçülen hiçbir büyüklük ona bağlı değil.
Yine de kırmızıyı gördükten sonra imzayı "yapısal + canlı" diye bölmek D-084'ün yasakladığı şey
(sonuca göre aracı yumuşatmak) — ayrıştırma **ayrı bir tur kalemi**.

**GÜRÜLTÜ TABANI ölçüldü:** aynı konfigürasyon iki kez koştu (T2 taban), açık zemin 507,5 ↔ 514,4
= **%1,4**. Bu metrikte **%1,5 altı farklar gürültü**.

**Tur 1'in (ölçüm, commit `d4c6cac` + `41162b6`) kalıcı üç dersi:**
1. **Aracın İYİMSER hatası da kaçar — ve onu ancak GÖZ yakalar.** F1a'nın dersi "karamsar hata
   kaçar"dı; bu tur tersini gösterdi. HUD sayımı yalnız `background-color` alfasına bakıyordu,
   oyunun en büyük iki bloğu (`.band`, `.botnav`) zeminini `linear-gradient` ile verdiği için
   sayımdan düştü → yatayda HUD "%8,5" çıktı. Kullanıcı kareye bakıp *"yatayda ekran çok dolu"*
   dediğinde **ölçüm ona karşı çıkıyordu.** Gerçek: **%38,3**. Hata sonucun kendisinden
   anlaşılmıyordu çünkü tutarsızlık üretmiyordu, sadece kolu temiz gösteriyordu.
2. **Metrik ALAN ölçer, GERİLME ölçmez — ve bu aynı turda ikinci kez oldu.** Tablet yatayı bütün
   sayılara göre en iyi konfigürasyondu (533 br², karakter 90 px, HUD %18,9). Kullanıcı
   *"tablette kötü durur"* dedi; kareye bakınca haklıydı — görev şeridi 1280 px'e gerilip
   ilerleme çubuğunu boş bir çizgiye çeviriyor. Sayı "yeterince küçük" diyordu, göz "yanlış
   biçimde" dedi. **İki kere aynı ders: kare ölçümün denetleyicisidir, süsü değil.**
3. **Kullanıcının cümlesi kolun kendisidir.** *"görev normal gerektiği kadar genişlikte
   kalabilir"* yorum olarak bırakılmayıp **YD kolu** olarak ölçüldü ve **her iki kadrajda da
   kazandı** (telefon yatayı %38,4 → %19,0 · tablet %18,9 → %7,1). Benim ürettiğim dört koldan
   üçünü geçti. (`feedback_ui_form_not_color`'ın doğrudan uygulaması.)

**Bu turun en pahalı bulgusu — karar dışı:** on bir splash dosyası (**106,9 KB**) **hiçbir API
sürümünde çizilmiyor.** Tema yalnız `android:background`ı (`0x010100d4`) eziyor, o bir GÖRÜNÜM
niteliği; pencereyi çizen `windowBackground`/`windowSplashScreenBackground` androidx'in kendi
çizimlerinde kalıyor (v31 varyantı dahil denetlendi), `installSplashScreen()` hiç çağrılmıyor.
Android 12+ sistem splash'ı **uygulama ikonunu** gösteriyor. → **İkonu düzeltmek açılış ekranını
da düzeltiyor.**

**İKON KALEMİ F1b'DEN ÇIKTI:** kullanıcı kendisi yaptıracak (*"ikonu sen sal ben onu chatgptye
yaptırıcam"*). Üretilen 12 aday + `tools/ikon-adaylari.html` depoda duruyor; gelen ikon
`mipmap-*` + adaptive foreground olarak takılır.

## SIRADAKİ TAM ADIM

**SIRADA: adım 3 — KARAR.** Ölçüm bitti (adım 2 ✅, commit #1 `d4e65b5`), revize paket sunuldu.
Kullanıcı seçince adım 4 (uygula + bekçi + en az 2 mutasyon + final TAM koşu + commit #2).

**Karar bekleyen üç soru:**
1. **Ekran yönü** — K0 serbest · **K2 portre kilidi (önerilen)** · K1 yatay kilidi · K2+ portre+kelepçe.
   Öneri tur 1'de K1'di, **tur 2'de K2'ye döndü**: yatayın dükkân avantajı duruyor ama bedeli
   artık görünür (3 ekran gömülü, 1 ödül düğmesi kayıp, 5 panel gövdesi yeniden yazılmalı).
2. **Yatay/tablet HUD** — **YD+ (ortalı) önerilen, takas yok**, yön kararından bağımsız.
3. **Açılış ekranı** — çay-dolan-bardak + dile bağlı başlık.

**Yön kararını BEKLEMEYEN iki iş** (kullanıcı isterse aynı turda biter):
① YD+ uygulaması · ② **28 ölü responsive seçicinin temizlenmesi** — temizlik tek başına bir şeyi
düzeltmez ama D-128'in kuralını yeniden *uygulanabilir* kılar.

**G-55 KOLU ÇÜRÜDÜ, KALEM DURUYOR:** kullanıcının "tablette büyüt" isteği karşılanmadı çünkü
büyütülecek sınıflar yok. Kalem, ölü dallar temizlenip **bugünkü sınıf adlarıyla yeniden
yazıldıktan sonra** ölçülmeli. Ayrıca karede görüldü: tablette **seviye çubuğu uzun ve boş**
duruyor (`ss/f1b-yd-YDp-T2.png`) — bu G-55'in somut hedefi.

**Yeni kalemler G-51…G-57:** `docs/geribildirim-oyun-testi-2026-09-17.md` (kullanıcının kendi
cümleleriyle). G-56 (kaynak rozeti → mağaza sekmesi) ve **G-57 (ödüllü video: 2 sa'de 4 hak,
video başına 1 💎 / 200 ₺, seviyeyle artar)** **Faz F'nin F3/F4 kalemleri** — G-57 `economy.config.ts`e
dokunacağı için **VARYANT KAPISINA TABİ**, taslak sayılar karar değildir.

**Ondan sonra F3 (AdMob) → F4 (IAP) → F5 (mağaza vitrini).** F3'ün ilk işi R8 kolunu yeniden
ölçmek olmalı: eklenti sayısı 0'dan çıkınca D-130'un "yansıma yüzeyi en dar" gerekçesi düşer.

**FAZ R — kullanıcının 2026-09-16 geri bildirimi, 16 kalem (G-35…G-50).** Tam liste ve
kullanıcının KENDİ cümleleri: `docs/geribildirim-oyun-testi-2026-09-16.md`.
Bölünme kullanıcı onayıyla dört tur oldu; **dördü de bitti.**

1. ~~**Görev şeridi** (G-41…G-44)~~ → **R1'de KAPANDI (D-126).**
2. ~~**Mutfak yerleşimi + çarpışma** (G-35…G-38)~~ → **R2'de KAPANDI (D-127).**
   **G-39 (masa yükseltmeleri sırayla) hâlâ açık — DENGE kapısına tabi, ayrı tutulur.**
3. ~~**HUD çerçeveleri** (G-45…G-49)~~ → **R3'te KAPANDI (D-128).**
4. ~~**G-50 — çevre sanatı**~~ → **R4'te KAPANDI (D-129).** Bahçe ilkel şekillerle çizildi
   (`feedback_primitive_art_style`), `kaykit-forest-nature` geri getirilmedi — ihtiyaç kalmadı.

**FAZ R BİTTİ (4/4).**

**R2'nin bıraktığı üç açık uç:** ① **ankraj listesi elle** — bir gövdeye bağlı noktalar
(`dishwasherHome` · `staffWalk` · pad) tek tek türetiliyor; dördüncüsü eklenirse ne araç ne bekçi
kendiliğinden görür (pad'in ölçümde çıkmaması bunun provasıydı). Yapısal çözüm: gövdenin "bağlı
noktalar" ilanı · ② **semaverin boyu L6'da 1,42 br**, karede tezgâhın üstünde baskın
(`ss/r2-son-seviye-L6.png`) — R2 öncesinden gelen davranış, sanat turunun kalemi ·
③ **C3 ölçüldü, seçilmedi:** sol duvar döneminde mutfak odası hiç çizilmiyor
(`areasOpen < 3 → null`), yani S22 kademe merdiveni L0-L3'te ekranda yok. Kendi turunu ister.

**R1'in bıraktığı açık uç:** cihazın kendi yazı-tipi ölçeği (Android "yazı boyutu" ayarı)
ölçülmedi. Bant artık içerikten türeyen yükseklikte, yani ölçek büyüse de kesmemeli — ama bu
DOĞRULANMADI, sadece yapısal olarak kapatıldı. Cihaz turunda §B yeniden koşulmalı.

**F1a KAPANDI (D-130).** Keystore üretildi ve `C:\dev-ortam` senkronuna girdi; sürüm adı/kodu
çözüldü. Kalan ikon ve açılış ekranı **F1b**'ye taşındı. Gradle JDK'sı
`C:\Users\Mehmet Mutlu\.jdks\jdk-21.0.12.1+1` (makineye özel `~/.gradle/gradle.properties`'te).

**F2'nin bıraktığı açık uç:** **dpr kolu cihazda ölçülmedi.** Telefon bağlanınca §C yeniden
koşulmalı ve `ZAYIF_ESIGI_MS` (22 ms) gerçek cihaz dağılımına göre doğrulanmalı. Ayrıca §A2'nin
18,5 MB'lık üst sınırı (kullanılan paketlerin içindeki istenmeyen dosyalar) **el değmeden duruyor**
— A2 kolu bilerek elendi, geri açılabilir.

**H2'nin bıraktığı iki açık uç:**
① **`tools/simulate.ts`in taban oyuncu politikası artık oyunun kuralıyla ÇELİŞİYOR:** sim hâlâ
"en ucuz masayı al" (serbest sıra) oynuyor, oyun tek hedefli. Fark ölçülü: ŞERİT DOLDU 8,48 sa
(sim tabanı) ↔ 8,00 sa (yeni kural) → model zinciri **%6 uzun** gösteriyor. Tazelenmesi D-087'nin
yayımlanmış tempo sayılarını oynatır → **kendi turunu ister**, bu turda bilerek dokunulmadı.
② **Sessiz salon:** yeni açılan bir salon en fazla **27 dk** hiç canlı nokta göstermeyebiliyor
(serbest kapıda imkânsızdı). Görsel bedel; `feedback_locked_object_renovation` kalıbıyla
kapatılabilir — sırası gelmemiş masa boş durmaz, "sırada" görünür. Yapılmadı.

**H1'in bıraktığı iki açık uç:** ① kirli kabın saçılma genişliği (0,60) hâlâ `tick.ts` içinde düz
bir sabit, config'e çıkmadı · ② `cups.collectRadius` artık yalnız PERSONELİN varış mesafesi;
garson/bulaşıkçı toplaması hâlâ kabın noktasına yürüyor, gövdeye geçmedi (ölçülmedi).
**H1'in bıraktığı sessiz kapı:** `hedefEkranda`'nın derinlik denetimi bugünkü kamera ankrajında
zemin hedefleri için ölü; y yükselince (Kat 3 çatı terası) kamera ARKASINDAKİ noktayı "ekranda"
sanıyor (taban kipte 3.773, portrede 862 nokta).

**S9'un bıraktığı iki açık uç:** ① müziğin telefonda gerçek maliyeti ölçülmedi (1740 KB indirme +
sürekli çözme; APK turunda okunacak) · ② `2024-q4` paketi indirilmedi, profili tutan 2 aday
ölçülmedi — parça değiştirilmek istenirse orası ilk bakılacak yer.

### S19b'DEN KALAN KÜÇÜK KUSUR

Bel bağının ucu çeyrek açıdan ince bir dudak bırakıyor (`docs/gorsel/ss/s19b-kiyafet.png`).
Ölçü değil biçim; pay 0,035 → 0,012 ile küçültüldü, sıfırlanmadı. Bir sonraki sanat turunda.

## PANO — v53 YAYINDA (2026-09-17)

**https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs** · 107/112 (%96) · aktif faz **F (2/6)**.
Faz F bu turda **5 → 6 kaleme** çıktı: F1 ikiye bölündü, kabuk+imza kalem **F1**'de kaldı,
ikon+açılış ekranı+ekran yönü **yeni kalem F6** oldu. **F2-F5 numaraları KAYDIRILMADI** —
"F2 telefon yükü" adı D-125'ten beri belgelerde geçiyor, kaydırmak her referansı bayatlatırdı.
Kart sayısı 8'de tutuldu (taşan S9 kartı arşive gitti, sayaç 62 → **63**). Faz F'nin pano
açıklaması da tazelendi: eskisi hâlâ *"Capacitor iOS · CI derlemesi"* diyordu, yani F2 ve F1'in
hiçbirini anmıyordu.

## AÇIK KALEMLER (ölçüldü/görüldü, bilerek duruyor — tam listesi `memory-bank/arsiv/`de)

**Karakter/sanat:** ~~rozet süsü önlükten çıkıyor~~ → **S19b'de KAPANDI (D-117):** süs ayrı düğüm
değilmiş, önlük gövdenin profilinden türeyerek onun önüne geçti · Rogue'un omzu 0,709
(blob sınırı 0,60) · **Ranger'ın kalçası taburenin kendisinden geniş (yan taşma 0,094 — çapa
sorunu değil, gövde/mobilya oranı)** · klip dosyaları mankenin gövdesini de taşıyor (dosya başına
6.916 üçgen ölü yük) · müşteri gövdeleri personelle aynı · `Rogue_Hooded` süzgece takılmıyor.

**Mekân:** vitrin ardındaki giriş holü düzenlenmedi (10 dekor duvar diplerinde) · WC odasının
ORTASI boş + tavan ışığı yok · banket masası `table_round_A_small`e geçmedi · mağaza kartlarının
gerçek render'ı yok · KayKit `bench` düz plaka gibi · bulaşık gövdesi kutusundan geniş çizilemiyor
· WC çöp kutusu elle çizim KESİN (dokuz pakette karşılığı yok).

**Oynanış (Faz H):** ~~yükseltme tetiği "yanında"~~ → S24'te KAPANDI (D-121) · ~~G-01/G-02/G-03~~
→ **H1'de KAPANDI (D-123)** · ~~yükseltme sırası serbest~~ → **H2'de KAPANDI (D-124: tek hedef)**
· ~~G-41…G-44 görev şeridi~~ → **R1'de KAPANDI (D-126)** · G-06 tepsi ilk yükseltme 75 → ~50 ·
G-07 dwell para-bağımsız · G-39 masa yükseltmeleri sırayla · G-40 para gelirinde fazla ondalık
(son dördü DENGE, varyant kapısına tabi) · ~~masalar geçilmiyor~~ → **H3 ELENDİ (2026-09-16):** banket adası geçişinden sonra
açıklık 2,15 br (gereken 0,94) — premis düştü, kalem geçersiz. Faz H **3/3 ✅ kapandı.**

**Altyapı:** **kararsız bekçi — teşhis R2'de değişti:** iki gözlemin (1242/1243) ortak yanı,
ikisinin de bir dosya YAZILDIKTAN sonraki İLK koşuda olması → şüphe `sira-kilidi`/`pano-guncelle`de
değil, koşucunun yazım-zamanlamasında. R1'in *"çıktı dosya adını göstermiyor"* notu YANLIŞ çıktı:
varsayılan raportör kırık testin adını basıyor, `tail` kesmişti — `| grep -E '×|FAIL'` yeter. · ~~`npm run apk` kırıktı~~ → **KAPANDI (2026-09-16):** Gradle 8.14.3'ün `gradlew.bat`'ı
`CLASSPATH`'i boş kurup `-classpath ""` geçiriyordu, Java reddediyordu (*"-classpath requires class
path specification"*) — kabuk değil BETİK kusuruydu (PowerShell'de de aynı). `-jar` zaten verildiği
için boş `-classpath` silindi. **APK üretildi: 21,9 MB** (`android/app/build/outputs/apk/debug/`),
içindeki paket bugünkü derleme. Wrapper güncellenirse kusur geri gelir — `npm run apk` ilk koşuda
denenmeli. · pano ARTIFACT'i **bu turda da kapatıldı** (v45 · 98/108) — borç birikmedi. Yayının bedeli yazılı: canlı sürümün **1611 satırının tamamı** okunmadan publish
reddediliyor (~130k token) — yani atlanırsa borç büyüyor, her turda kapatmak ucuz. ·
`npm run lint` 31 hata (hepsi eski `tools/olcum-*.ts`) · ~~`.gitattributes` YOK~~ → **S24'te
KAPANDI:** `* text=auto eol=lf` autocrlf'i eziyor, `.bat`/`.ps1` CRLF, ikililer `binary`;
`git add --renormalize .` 0 dosya bozdu (depo zaten LF'ti, kilitlenen çalışma ağacı) ·
`npm run pano` günlük uyarısı yalnız TARİHE
bakıyor · mutfağın kuşbakışı karesi OYUNDAN çekilemez (tepeden kamera oyuncunun üstünde, oyuncu mutfağa giremiyor) — plan ölçüm aracının işi · **oyuncuda 2,0× artık kayma** · **panel dönüşünde T-poz temiz koşuda ÜRETİLEMEDİ**
(repro aracı `tools/olcum-panel-donusu.mjs`).

**Önizlemeler**
**F1a KARAR PAKETİ (kabuk ve imza · dört kol + R8 risk kanıtı):** https://claude.ai/artifact/XFvtNfMyomeqYKw3UT6vaZ
**F1a ÇIKTI:** `android/app/build/outputs/apk/release/app-release.apk` (8,58 MB, imzalı) ·
`.../bundle/release/app-release.aab` (8,89 MB) — ikisi de `npm run yayin` ile üretilir
**R4 SONUÇ KARELERİ:** `ss/r4-son-alan{1,2,3}.png` (bahçenin geri çekilişi) ·
`ss/r4-son-alan1-{kenar,sag}.png` · `ss/r4-son-alan3-dis.png` (pencereden bahçe)
**R4 KARAR PAKETİ (çevre sanatı · 12 aday + ölçüm):** https://claude.ai/artifact/KoKfXtRZ3CAxMsLgcd3f3s
**R4 kareler:** `ss/r4-taban-*.png` (18 ölçüm karesi) · `ss/r4-aday-{bos,zemin,duvar}-*.png`
**R3 SONUÇ KARELERİ:** `ss/r3-son-{serit,ayarlar,odul,hedefler}.png` (UYGULAMA SONRASI)
**R3b KARAR PAKETİ (madalyon 9 + ödül 7 aday + kese ölçümü):** https://claude.ai/artifact/EZbPh6oo7CF8Eeh3jsu36n
**R3 KARAR PAKETİ (HUD · rozet 8 + kese 6 aday):** https://claude.ai/artifact/HRL1fvnWccYwRSZwpVUUKr
**R2 KARAR PAKETİ (mutfak · kareler + sayılar):** https://claude.ai/artifact/WYbL5mcuqcchywVLy3QrFY
**R2 kareler:** `ss/r2-taban-{plan,hat,tezgah,bulasik}.png` (ÖNCE) ·
`ss/r2-son-{plan,hat,tezgah,bulasik}.png` + `ss/r2-son-seviye-L{0,3,6}.png` (SONRA)
**G1 KARAR PAKETİ (görev şeridi · kareler + sayılar):** https://claude.ai/artifact/F2jowE134dyDnzEQPBsAgy
**G1 kareler:** `ss/g1-serit-normal.png` · `ss/g1-serit-bitti.png` (ikisi de UYGULAMA SONRASI)
**S9 SES KARAR PAKETİ (DİNLENEBİLİR):** https://claude.ai/artifact/49KsxE368xVHWbw4wHdkSy
**S24 KARAR PAKETİ:** https://claude.ai/artifact/84hN6nieCHVXHMcBS81d4u
**S23 KARAR PAKETİ:** https://claude.ai/artifact/Cysj2inCDguC4gQxuu3X2o
**S23 kareler:** `ss/s23-ok-adaylari.png` (sekiz aday, gerçek çerçeve) ·
`ss/s23b-{player,waiter,dish}.png` (uygulanan vitrin) · `ss/s23-panel-*.png` (panel doluluğu)
**S22 KARAR PAKETİ + UYGULANAN MERDİVEN (v2):** https://claude.ai/artifact/QXhU6FVWtETAzdAvY8qby1
**S22 kareler:** ss/s22-kademe-L{1..6}.png (altı basamak, tek kadraj) · ss/s22-ada-L{4,6}.png
**S20 KARAR PAKETİ:** https://claude.ai/artifact/NzUs9PeHqzj48bekL78fqm
**S20 kareler:** önce `ss/s20-mutfak-{taban,npc,plan}.png` · sonra `ss/s20-mutfak-{taban,npc,plan}-son.png`
**S19b kareler:** `ss/s19b-kiyafet.png` (önlük + patron) · `ss/s19b-oyun-yakin.png` · `ss/s19b-oturus-yakin.png`
**S19a KARAR PAKETİ (v2):** https://claude.ai/code/artifact/a8d02997-974d-4f2a-a00c-f916820a69c7
**S19a kareler:** `ss/s19-oturus.png` · `ss/s19-onluk.png` · `ss/s19-patron.png` · `ss/s19-glif.png` · `ss/s19-yemek.png`
**S18 son durum:** `docs/gorsel/ss/s18-son.png` · **HUD'lu:** `docs/gorsel/ss/s18-durum-hud.png`
**S15 karar paketi:** https://claude.ai/code/artifact/1cad1b62-df57-4ffb-b00b-32f0b9be9565
**S13 paketler:** https://claude.ai/code/artifact/dcbaaee3-8889-4665-83b2-feff02a60c13
**S12 arayüz:** https://claude.ai/code/artifact/a83eade2-32f6-4a64-ae34-6743a93922a3
**Mor arayüz maketi:** https://claude.ai/code/artifact/6cc7a95e-c0a3-4802-8ea3-99398d637981
**İlerleme panosu (v48 · 101/108):** https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs

---

## TUR KARTI ŞABLONU (her yeni tur bunu doldurur, öncekinin üstüne)

```
SORU            : (tek cümle — bu tur neyi çözüyor)
ÖLÇÜLECEK KOLLAR: (varyant olarak ölçülecek seçenekler; kod YAZILMADAN)
SAYILAR         : (adım 2'den sonra dolar — rapor §Bulgular'a link)
KARAR           : (adım 3, kullanıcı seçer — D-0xx)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Sıra (D-084 §3.2) — ihlali commit yapısı engeller, kapanışta `npm run sira` denetler:**
`0 BAŞLA → 1 SORU (kart açılır) → 2 ÖLÇ → commit #1 (araç + ham çıktı + rapor, KARAR BÖLÜMÜ BOŞ)
→ 3 KARAR (tek karar paketi) → 4 UYGULA + bekçi + mutasyon + final tam koşu
→ commit #2 (kod + test + rapor tamam + D-0xx) → 5 KAPAT`

**Varyant kapısı:** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan denge değişikliği,
raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz.

**Kapanış (D-085):** `npm run sira` → `npm run pano` → `npm run test` → commit → push.
Pano denetimi kırmızıysa önce `progress.md` düzeltilir; anlatı elle yazılır.
