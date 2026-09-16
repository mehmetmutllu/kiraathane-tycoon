# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-16 — **R1 BİTTİ: görev şeridi** · Faz R 1/4 · 103/111)

```
SORU            : Bir görev bittiğinde ekranda kaç ses aynı anda konuşuyor, hangi sırayla —
                  ve kamera yeni hedefe hangi anda gidiyor?
ÖLÇÜLEN KOLLAR  : T taban · K KONTROL (tebrik çizilebilir türe çevrilir) · V1 toast yok ·
                  V2 toast kısa · V3 pencere uzun · V4 kamera kapısı (altısı da ETKİLİ doğrulandı)
SAYILAR         : docs/serit-raporu-g1.md §Bulgular · ham: docs/olcum-serit-g1.txt (TAM)
KARAR           : D-126 — V1 + V4 + taban yükseklik (C1); kullanıcı KAREYE bakıp bandın
                  üstündeki gri iç parlamayı da kaldırttı (ölçümde olmayan kalem)
UYGULAMA        : rules.ts CIZILEN_TOAST + toastCizilir · tick.ts geçiş kapısı (camBekleyen) ·
                  hud.css min-height + padding · index.css --k3duz · q_z1allL4 başlığı kısaldı
BEKÇİ           : gorev-seridi-g1 (14 den. · 15 mut.) + mor-dil 4c (türetme denetimi) · kaçan 0
FINAL           : vitest 1220 ✓ · duman 45/45 ✓ · tsc temiz · örtüşme 2,20 → 0,00 sn ·
                  ekrandaki kutu 2 → 1 · pan sapması −1,30 → 0,00 sn · bant taşması 2,0 → 0,0 px
```

**Turun kalıcı üç dersi:**
1. **Bekçisi olmayan karar, karar değil yorumdur.** Bu toast 2026-09-09'da kullanıcı kararıyla
   kaldırılmıştı; `f4b1a52`de `tsc -b` onu tutan koşulu "ölü dal" dedi (tip o an daralmıştı),
   dal silindi ve **karar da onunla gitti**. Tip genişleyince toast döndü, HUD yorumu bugüne
   kadar "çizilmez" dedi. Kural artık olumsuzlama değil **liste** (`CIZILEN_TOAST`): tip yine
   daralırsa ölü dal olmaz, kısalır. Mutasyon M1 tam olarak o silmedir.
2. **Ölçüm neyi sayacağını bilir; kare neyi sormadığını gösterir.** Araç kutuları, süreleri ve
   taşmayı saydı — hepsi doğru. Kullanıcı karede bandın üst kenarındaki gri iç parlamayı gördü;
   ölçümde öyle bir sütun yoktu. Kare gösterilmeseydi tur "G-42 kapandı" diye kapanırdı.
3. **Düzeltme uygulanınca bekçinin kendisi kör olabilir.** Araç örtüşmeyi türden sayıyordu
   (`kind === 'quest'`); HUD kapısı devreye girince sıfır basardı ve sıfır kendini doğrulardı.
   İki kapı: araç artık HUD'un kendi fonksiyonundan okuyor, ve **kontrol kolu K** tebriği
   çizilebilir türe çevirip 2,20 sn'yi geri getiriyor — parmak izi eski tabanla birebir.

**Yolda düzeltilen dört araç kusuru:** açılış panı ölçüm penceresine sızıyordu (sahte erken pan) ·
DOM 12 görevin 7'sini İLK görevin kopyası olarak ölçüyordu · kollar aynı dünyayı ölçmüyordu
(her ölçüm artık kendi taze sayfasında) · V4'ün ölçecek şeyi yoktu (salon senaryosu eklendi).

## SIRADAKİ TAM ADIM

**FAZ R — kullanıcının 2026-09-16 geri bildirimi, 16 kalem (G-35…G-50).** Tam liste ve
kullanıcının KENDİ cümleleri: `docs/geribildirim-oyun-testi-2026-09-16.md`.
Bölünme kullanıcı onayıyla dört tur oldu; **R1 bitti**, sırada **R2**.

1. ~~**Görev şeridi** (G-41…G-44)~~ → **R1'de KAPANDI (D-126).**
2. **Mutfak yerleşimi + çarpışma** (G-35…G-38) — tezgâh/bulaşık 90° yanlış açıda (sol duvara
   paralel olmalı) · içinden geçiliyor · başlangıçta tezgâhlar bitişik olsun · tezgâh
   yükseltmeleri belirsiz. **G-39 (masa yükseltmeleri sırayla) DENGE kapısına tabi, ayrı tutulur.**
3. **HUD çerçeveleri** (G-45…G-49) — ayarlar kaydırıcı çerçevesi kesik · FPS sayacını KALDIR ·
   iki ödül alt alta + arasına `+` · seviye rozeti Clash of Clans gibi BİRLEŞİK (bar yuvarlağın
   çevresinde, en üst satırda) · sağ üstteki elmas/paraya çerçeve.
4. **G-50 — çevre sanatı, KENDİ TASARIM TURU.** Kullanıcı: *"zemin ve duvarlar... yapılmamış
   asset gibi hissettiriyor, çözümler sun"*. `feedback_show_dont_ask`: metinle kol anlatılmaz,
   6-12 aday aynı kadrajda render edilir. Kullanıcının kendi yönü: bahçe/çimenlik kuşağı.
   **Not:** `kaykit-forest-nature` F2'de silindi; bu kol seçilirse
   `git checkout 13738b5^ -- public/assets/models/kaykit-forest-nature` ile geri gelir ve
   bekçi gereği entegrasyonu AYNI turda yapılır.

**R1'in bıraktığı açık uç:** cihazın kendi yazı-tipi ölçeği (Android "yazı boyutu" ayarı)
ölçülmedi. Bant artık içerikten türeyen yükseklikte, yani ölçek büyüse de kesmemeli — ama bu
DOĞRULANMADI, sadece yapısal olarak kapatıldı. F1 cihaz turunda §B yeniden koşulmalı.

**Sonra F1 — Capacitor kabuğu + imzalı sürüm.** Kullanıcı kararı alınmış: *"sen üret,
dev-ortam'a koy"* → keystore `C:\dev-ortam`'a, parola oradaki gizli dosyaya, `android/`'e yalnız
dosya-dışı referans, `.gitignore` güncellenir. `keytool`: `C:\Program Files\Java\jdk-17.0.1\bin\keytool.exe`.
Kalan: sürüm adı/kodu, uygulama ikonu, açılış ekranı.

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

## PANO ARTIFACT BORCU — BİLEREK BIRAKILDI (2026-09-16)

Pano **HTML dosyası güncel ve commit'li** (`docs/pano/ilerleme-panosu.html`, v50 · 103/111 ·
R1 kartı + özet + sıradaki + yeni Faz R yazıldı, `npm run pano` denetimi yeşil). **Yayınlanmadı
— ikinci tur üst üste.**

**Sebep — ve bu bir kök sebep, tembellik değil:** artifact yayını canlı sürümün TAMAMININ
okunmasını şart koşuyor. Dosya her turda büyüyor: S23'te 1611 satırdı, bugün **1790**.
Yayın maliyeti artık ~130k token ve okunanın **neredeyse tamamı eski tur günlük kartları** —
yani her tur, bir daha asla okunmayacak arşivi baştan okumak için ödeme yapıyoruz. Maliyet
tur başına ARTIYOR; "her turda kapatmak ucuz" kuralı dosya küçükken yazılmıştı ve artık
geçerli değil.

**Önerilen yapısal çözüm (kullanıcı onayı ister, kod yazılmadı):** `gunluk` listesi panoda
**son 8 turla sınırlansın**, eskisi `memory-bank/arsiv/pano-gunluk.json`e taşınsın.
Bu, projenin kendi kuralının (`eski anlatı → arsiv/`) panoya uygulanmış hâli. Pano ~600
satıra iner, yayın maliyeti onda birine düşer ve borç bir daha birikmez. Arşivlenen kart
kaybolmaz — git'te ve arşiv dosyasında durur.

**Bu tur ne kaybedildi:** yayınlanmış bağlantı artık **iki tur** bayat (v48 · 101/108
gösteriyor). Sayıların kendisi depoda güncel. **Öneri hâlâ kullanıcı onayı bekliyor** — R1
turunda gündeme getirildi, kullanıcı görev şeridine odaklandı ve pano sorusu cevapsız kaldı;
zorlanmadı çünkü tur bütçesi oynanış düzeltmesine ayrılmıştı.

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
