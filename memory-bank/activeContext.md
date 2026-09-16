# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-16 — **H2 BİTTİ: yükseltme sırası tek hedefli** · Faz H 2/3 · 101/108)

```
SORU            : Masa yükseltmelerinin sırası serbest. Bu serbestlik oyuncuya ne kadar İŞARET
                  ödetiyor, ve yanlış sırayı seçen oyuncu kendini ne kadar CEZALANDIRABİLİYOR?
ÖLÇÜLECEK KOLLAR: T serbest/en-ucuz (taban) · D serbest/derin · P serbest/en-pahalı ·
                  R serbest/rastgele · A tek-hedef kapısı · B kuşak kapısı (altısı da ölçüldü)
SAYILAR         : docs/sira-raporu-h2.md §Bulgular · ham: docs/olcum-sira-h2.txt (TAM koşu)
KARAR           : D-124 — A (tek hedef), GLOBAL kapsam
UYGULAMA        : rules.ts tableUpgradeTarget (tek kaynak) · tick.ts tetiği · Scene.tsx tek nokta
                  + gate'e tableLevels · revealKeys canlı masadan türüyor · olcum-tek-odak eşlendi
BEKÇİ           : sira-h2 (19 den. · 12 mut.) · kaçan 0 (ilk turda 3 kaçtı, üçü de kapatıldı)
FINAL           : vitest 1189 ✓ · duman 45/45 ✓ · tsc temiz · nokta ort 3,48→0,54 (tepe 12→1)
```

**Turun kalıcı üç dersi:**
1. **Kapının bedeli, kapının aldığı özgürlükle ölçülmez — kolun parmak iziyle ölçülür.** "Tek
   hedef oyuncudan seçim alıyor, demek ki bir bedeli var" sezgisi ölçüldü ve sıfır çıktı: A ile
   kapısız-derin kol BİREBİR aynı dünyayı üretiyor (`fd6d3dfd`). Kapı bir takas değildi, çünkü
   aldığı seçenek zaten **kaybeden** seçenekti. A'nın 1,06 saatlik "ölü para"sı da kapının değil,
   kazanan stratejinin kendi maliyeti — D'de kapı hiç yokken aynı sayı çıkıyor. Bir maliyeti
   kime yazacağını, onu **kapısız kolda da ölçmeden** bilemezsin.
2. **Mekanizmayı bulmak, hipotezi doğrulamak değildir.** "Derin kol kazanıyor" görülünce sebep
   hemen bulundu: koltuk merdiveninde L1 ile L2 aynı koltuğu veriyor, yani L2 ölü basamak ve
   "en ucuzu al" tam orada oyalanıyor. Kulağa kesin geliyordu; karşı-deney **çürüttü** (tuzak
   %20,6 → yalnız %19,0, koltuk açığının üçte ikisi kapandığı hâlde). Sebep kapasitede değil,
   bahşiş ortalamasının aritmetiğindeydi. Hipotez kurulduğu turda ölçülmeseydi, "config'i
   düzeltip sırayı serbest bırakalım" diye üçüncü bir kol karar paketine yanlış girerdi.
3. **Bekçi neyi ölçmediğini söylemez — mutasyon söyler.** 19 denetim yeşilken üç mutasyon kaçtı
   ve üçü de aynı boşluğu gösterdi: bekçi TETİĞİ ölçüyordu, ÇİZİMİ hiç. Yani "ekranda 12 nokta
   var, yalnız biri para alıyor" kusuru serbestti. (M4 ayrıca kurgunun kendi tuzağıydı: denetim
   `g.tables` sınırının alan kapısını kazara taklit ettiği bir dünyada duruyordu.)

**Yolda bulunan sessiz kusur:** ölçüm penceresi milestone listesiyle kapanıyordu — `runProfile`
son milestone'da `break` ediyor, masa seviyeleri ise listenin çok ötesinde sürüyor. İlk tam koşu
"20 masa TAVANDA" için her kolda `—` bastı; okunsa "masa yükseltmeleri hiç bitmiyor" diye rapora
girecekti. `tamPencere` bayrağı eklendi, sayı `—`'dan 8,69 sa'ya döndü.

## SIRADAKİ TAM ADIM

**H3 — masa aralığı / geçilemeyen açıklıklar** (Faz H 3/3). ÖLÇÜLDÜ ve KULLANICI KARARI BEKLİYOR
(D-098): geçiş için 2 × playerRadius = **0,94 br** gerekiyor; ön salon 3,50 br (rahat), **arka
salon 0,68 br** → 20 masanın 12'si geçilemez, çarpışma katılarında eşik altında **52 açıklık**
(en darı 0,04 br). Onaylı maket düzenine dokunuyor. H1'in tarama aracı hazır:
`tools/olcum-erisim-h1.ts`in taşma-doldurması "girilemeyen cep" sayısını zaten veriyor (iki
dünyada da %0 — yani cep yok, **dar geçit** var).

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
· G-06 tepsi ilk yükseltme 75 → ~50 · G-07 dwell para-bağımsız (son ikisi DENGE, varyant kapısına
tabi) · masalar geçilmiyor (açıklık 0,68 br, geçiş 0,94 ister — 20 masanın 12'si) — **H3,
kullanıcı kararı bekliyor.**

**Altyapı:** ~~`npm run apk` kırıktı~~ → **KAPANDI (2026-09-16):** Gradle 8.14.3'ün `gradlew.bat`'ı
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
