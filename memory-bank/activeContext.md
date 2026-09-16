# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

> ## ⛔ BU OTURUM KOD YAZMADAN ÖNCE: KARAR SOR
> R3'ün ölçümü bitti, **karar alınmadı**. Kullanıcının kendi talimatı (2026-09-17):
> *"kararı sonraki chatte tekrar sor ve o artifact'ı yine ver oradan seçelim"*.
> **İlk mesajında karar paketi linkini VER ve seçimi sor:**
> **https://claude.ai/artifact/HRL1fvnWccYwRSZwpVUUKr**
> §A/§B/§C → önerim **A4 + B2 + C1** (tek "tamam" yeter) · §D rozet → bir harf (A-H) ·
> §E kese → bir harf (A-F) ya da "kutusuz kalsın".
> Seçim gelmeden `HUD.tsx` / `hud.css` / `index.css` dosyalarına **dokunma**.

## ŞU AN (2026-09-17 — **R3 ÖLÇÜM BİTTİ, KARAR BEKLİYOR** · Faz R 3/4 · 104/111)

```
SORU            : Üst şeridin seviye rozeti ile kesesi, ödül ekranının iki ödülü ve ayarlar
                  kaydırıcısının çerçevesi ekranda GERÇEKTE nasıl çiziliyor — kesik nerede,
                  hangi kutu hangi kutudan taşıyor, kaç satır kaplıyor?
ÖLÇÜLEN KOLLAR  : §A T · A1 topuz · A2 kapalı çerçeve · A3 hizalı L · A4 hizalı+bitişik L
                  §B T(oyun) · T(ayarlar) · B1 yalnız katman · B2 katman+anahtar+alan
                  §C T · C1 alt alta + "+"   §D T · D1 halka · D2 tek satır · D3 halka+tek satır
                  §E T kutusuz · E1 hap çerçeve            (hepsi ETKİLİ doğrulandı, hata 0)
SAYILAR         : docs/hud-raporu-r3.md §Bulgular · ham: docs/olcum-hud-r3.txt (TAM,
                  telefon 390x844@3 + masaustu 1280x800@2)
KARAR           : ((BOŞ — kullanıcıya SORULMADI. Karar paketi hazır:
                  docs/r3-karar-paketi.html · rozet 8 + kese 6 aday, hepsi gerçek oyundan))
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (test dosyası + mutasyon sayısı)
FINAL           : (tam koşu damgası)
```

**BU OTURUM COMMIT #1'DE BİTTİ.** Sıra kilidinin istediği yapı budur: araç + ham çıktı + rapor,
karar bölümü BOŞ. Kod tek satır değişmedi (HUD.tsx / hud.css / index.css'e dokunulmadı);
bütün kollar sayfaya enjekte edilmiş CSS/DOM olarak ölçüldü.

**SONRAKİ OTURUMUN İLK İŞİ — kullanıcı bunu AÇIKÇA istedi (2026-09-17):** *"kararı sonraki
chatte tekrar sor ve o artifact'ı yine ver oradan seçelim"*. Karar paketi YAYINDA; linki
tekrar ver ve TEK karar paketi mesajıyla seçimi sor.
https://claude.ai/artifact/HRL1fvnWccYwRSZwpVUUKr
§A/§B/§C için önerim **A4 + B2 + C1** (tek "tamam" yeter); §D rozet ve §E kese biçim kararı,
kullanıcı harfle seçer. Seçim geldikten sonra commit #2: yalnız seçilen kol + bekçi + mutasyon.

**Turun kalıcı üç dersi:**
1. **Bir kolun İLAN ETTİĞİ ölçü, o kolun ölçüsü değildir.** Halka kolu `--kal: 6px` diyordu,
   çizilen halka ~17 px'ti: `radial-gradient(circle, … 50% …)` yüzdeyi kutunun yarıçapına değil
   varsayılan `farthest-corner` bitiş şekline (köşegene, ×1,41) göre ölçüyor. Kolun kendi
   değişkenini rapora yazmak, ölçmeden yazmaktır.
2. **Ölçüm, ölçtüğü kusurun üstüne kendi kusurunu koyabilir.** §A üç koşu boyunca "Ses seviyesi"
   satırının sol çizgisini 18,00 px / oran 0,400 ölçtü; çizgi 45,00 px'ti, **üstü FPS katmanıyla
   örtülüydü** — katmanı §B için ben açmıştım. Sayı üç koşuda birebir aynı çıktığı için gürültü
   sanılamazdı; tekrarlanabilir yanlış, en ikna edici yanlıştır.
3. **Aday karesi, sayının denetleyicisidir.** Halkanın yanlış kalınlığını hiçbir sayı yakalamadı;
   `ss/r3-aday-rozet-D.png`e bakınca bir bakışta görüldü. `feedback_show_dont_ask` yalnız
   kullanıcıya sormanın değil, kendi ölçümünü çürütmenin de yolu.

**Yolda düzeltilen ON araç kusuru** (hepsi kısa koşuda, rapora sayı girmeden): topuz çapı 194 px
(üstteki anahtarın topuzunu yakalıyordu) · sol çizgi satırdan uzun (ayıraçları çizgi sanıyordu) ·
halka yayı NaN (kolun CSS'i çubuğu zaten gizlemişti) · "arka parlaklık" kesenin kendisini
ölçüyordu · §E kırpması kola göre büyüyordu (kollar aynı dünyayı ölçmüyordu) · sahne/yatak ayrı
yürüyüşlerde ölçülüyordu · ortanca ölçütü fazla kaba (piksel-başı sapmaya geçildi) · §B çakışma
denetimi paneli hiç gezmiyordu · topuzun beyaz blobu iç daireydi, dış çap değil ·
halka kalınlığı sütun taramasıyla 54 → 70,7 px (kırpmanın kenarı arka plan değildi) → halkanın
KENDİ amber rengiyle ölçülüyor.

## SIRADAKİ TAM ADIM

**FAZ R — kullanıcının 2026-09-16 geri bildirimi, 16 kalem (G-35…G-50).** Tam liste ve
kullanıcının KENDİ cümleleri: `docs/geribildirim-oyun-testi-2026-09-16.md`.
Bölünme kullanıcı onayıyla dört tur oldu; **R1 ve R2 bitti**, **R3'ün ölçümü bitti**
(karar bekliyor), sırada R3'ün kararı + kodu, sonra R4.

1. ~~**Görev şeridi** (G-41…G-44)~~ → **R1'de KAPANDI (D-126).**
2. ~~**Mutfak yerleşimi + çarpışma** (G-35…G-38)~~ → **R2'de KAPANDI (D-127).**
   **G-39 (masa yükseltmeleri sırayla) hâlâ açık — DENGE kapısına tabi, ayrı tutulur.**
3. **ŞU AN: HUD çerçeveleri** (G-45…G-49) — ayarlar kaydırıcı çerçevesi kesik · FPS sayacını KALDIR ·
   iki ödül alt alta + arasına `+` · seviye rozeti Clash of Clans gibi BİRLEŞİK (bar yuvarlağın
   çevresinde, en üst satırda) · sağ üstteki elmas/paraya çerçeve.
4. **G-50 — çevre sanatı, KENDİ TASARIM TURU.** Kullanıcı: *"zemin ve duvarlar... yapılmamış
   asset gibi hissettiriyor, çözümler sun"*. `feedback_show_dont_ask`: metinle kol anlatılmaz,
   6-12 aday aynı kadrajda render edilir. Kullanıcının kendi yönü: bahçe/çimenlik kuşağı.
   **Not:** `kaykit-forest-nature` F2'de silindi; bu kol seçilirse
   `git checkout 13738b5^ -- public/assets/models/kaykit-forest-nature` ile geri gelir ve
   bekçi gereği entegrasyonu AYNI turda yapılır.

**R2'nin bıraktığı üç açık uç:** ① **ankraj listesi elle** — bir gövdeye bağlı noktalar
(`dishwasherHome` · `staffWalk` · pad) tek tek türetiliyor; dördüncüsü eklenirse ne araç ne bekçi
kendiliğinden görür (pad'in ölçümde çıkmaması bunun provasıydı). Yapısal çözüm: gövdenin "bağlı
noktalar" ilanı · ② **semaverin boyu L6'da 1,42 br**, karede tezgâhın üstünde baskın
(`ss/r2-son-seviye-L6.png`) — R2 öncesinden gelen davranış, sanat turunun kalemi ·
③ **C3 ölçüldü, seçilmedi:** sol duvar döneminde mutfak odası hiç çizilmiyor
(`areasOpen < 3 → null`), yani S22 kademe merdiveni L0-L3'te ekranda yok. Kendi turunu ister.

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

## PANO — v50 YAYINDA (2026-09-16)

**https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs** · 104/111 (%94) · Faz R 2/4.
Kart sayısı 8'de tutuldu (taşan S22 kartı `memory-bank/arsiv/pano-gunluk.json`'a gitti, sayaç 60).
Bu turda ayrıca **bayat bir risk kartı** düzeltildi: "arka salonda 12 masa arasından geçilemiyor"
hâlâ AÇIK görünüyordu, oysa H3 2026-09-16'da elenmişti (banket adasından sonra açıklık 2,15 br).
Yerine R2'nin yapısal açık ucu kondu (ankraj listesi elle türetiliyor).

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
