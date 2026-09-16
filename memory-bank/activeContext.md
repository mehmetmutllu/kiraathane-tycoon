# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-16 — **H1 BİTTİ: üç tetik de çizilen gövdeye bağlandı** · Faz H 1/3 · 100/108)

```
SORU            : Oyuncu masadaki kirliye ve ocaktaki ürüne, fiziksel olarak DURABİLDİĞİ her
                  yerden erişebiliyor mu? Görev panı ne kadarını gürültüye harcıyor?
ÖLÇÜLECEK KOLLAR: M1/M2/M3 masa · O1/O2/O3 ocak · K1 pan kaydı (yedi kol, hiçbiri uygulanmadan)
SAYILAR         : docs/erisim-raporu-h1.md §Bulgular · ham: docs/olcum-erisim-h1.txt (TAM koşu)
KARAR           : D-123 — M3 + O3 + K2 (üçü de "tetik çizilen şeyden türer")
UYGULAMA        : layout.ts boxDist2D/atTableBody/atServiceBody · tick.ts üç çağrı yerinde ·
                  cameraView.ts (yeni tekil) · Scene.tsx matrisi her karede yazıyor ·
                  pay 0,70 (iki bağımsız kaynak) · yarıçap değişmezleri gövdeye çevrildi (10 test)
BEKÇİ           : erisim-h1 (16 den. · 16 mut.) · kaçan 0
FINAL           : vitest 1170 ✓ · duman 45/45 ✓ · tsc temiz · pan 6→0 · ekran dışı 11,02→0,00 sn
```

**Turun kalıcı üç dersi:**
1. **Kusur "yakınlık ayarı" değil ÖLÇEK uyumsuzluğuydu.** Banket masası (yarı 0,53) zaten %95,5
   temizdi; çöken dörtlü masaydı (yarı 0,84). Tetik yarıçapı (1,40) masanın kendi boyundan
   küçüktü — oyuncu kenardan en yakın 1,31 br'de durabiliyor, kap 0,30 br öteye düşüyordu.
   Yani aynı sayı küçük masada doğru, büyük masada yanlıştı: sabit bir yarıçap DEĞİŞEN bir
   gövdeyi tarif edemez. İlke S24'te (D-120) bulunmuştu, burada üç nüshası daha çıktı.
2. **Korkulan bedel hiç yoktu — ve bunu ancak tarama söyledi.** "Yarıçapı büyütürsek yanlış
   masadan toplar" sezgisi ölçüldü: pay **0,90'a kadar sızıntı 0**. Karar bir takas değildi.
   Tahminle gidilseydi muhtemelen 1,6 gibi ürkek bir sayıda durulur, delik yarı açık kalırdı.
3. **Kullanıcının işaret ettiği yer, kusurun EN HAFİF olduğu yerdi.** `q_table2`'nin hedefi
   3,62 br — en dar görüş yarıçapının (4,25) bile altında, yani zaten görünüyordu; pan orada
   1,49 sn sürüyor ve oyuncuyu ekrandan hiç çıkarmıyordu. Asıl zarar hiç şikâyet edilmemiş
   görevlerdeydi: `q_station1` 3,15 sn, `q_serve5` 2,58 sn. Şikâyet bir YÖN gösterir, ölçüm
   BÜYÜKLÜĞÜ söyler — ikisi aynı yerde durmuyor (S9'un 2. dersinin aynısı).

**Yolda bulunan sessiz hata:** üç bardak-döngüsü fikstürü oyuncuyu salonun ortasındaki `[1, 1]`
noktasına koyup kaba `tableIndex: 0` etiketi veriyordu — ikisi birbirini tutmuyordu ve eski
nokta-tetiği bunu göremediği için yıllardır yeşil yanıyorlardı. Gövde tetiği ilk günde yakaladı.

**Kaçan mutasyonun öğrettiği sınır:** `hedefEkranda`'nın derinlik denetimi bugünkü kamera
ankrajında **zemin** hedefleri için ölü (160 × 160 br tarandı, 0 nokta). Ama fonksiyon yükseklik
alıyor: y yükselince taban kipte 3.773, portrede 862 nokta kameranın arkasındayken "ekranda"
sanılıyor. **Kat 3 çatı terası** geldiğinde kapı sessizce ters çalışırdı.

## SIRADAKİ TAM ADIM

**H2 — yükseltme SIRASI** (Faz H 2/3). Bugün sıra YOK: bir alan açılınca o alandaki 4 masanın
4'ü de aynı anda ve serbest sırayla yükseltilebiliyor (`tableUpgradeUnlockedIn` yalnız ALANIN
kapısına bakıyor). **`rules.ts`'e dokunur → varyant kapısı**, iki kol ölçülmeden uygulanmaz:
*A: tek hedef* (aynı anda tek masanın noktası canlı, tavana varmadan sonraki açılmaz) ·
*B: kuşak* (hepsi L'ye varmadan hiçbiri L+1'e çıkamaz).

**Sonra H3 — masa aralığı.** ÖLÇÜLDÜ ve KULLANICI KARARI BEKLİYOR (D-098): geçiş için 0,94 br
gerekiyor, arka salonda 0,68 var → 20 masanın 12'si geçilemez, 52 açıklık eşik altında.
H1'in tarama aracı bu soruya hazır: `tools/olcum-erisim-h1.ts`in taşma-doldurması "girilemeyen
cep" sayısını zaten veriyor (bu turda iki dünyada da %0 çıktı — yani bugün cep yok, dar geçit var).

**H1'in bıraktığı iki açık uç:** ① kirli kabın saçılma genişliği (0,60) hâlâ `tick.ts` içinde düz
bir sabit, config'e çıkmadı — ölçüm aracı onu regex'le okuyor ve damgalıyor · ② `cups.collectRadius`
config'te kaldı ama artık yalnız PERSONELİN varış mesafesi; garson/bulaşıkçı toplaması hâlâ kabın
noktasına yürüyor, gövdeye geçmedi (oyuncunun şikâyeti onlarda yoktu, ölçülmedi).

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

**Oynanış (Faz H):** ~~yükseltme tetiği "yanında"~~ → S24'te KAPANDI (D-121) · ~~G-01 masa her
taraftan toplanmıyor~~ · ~~G-02 ocaktan alma güvenilmez~~ · ~~G-03 kamera kayıyor~~ → **üçü de
H1'de KAPANDI (D-123)** · G-06 tepsi ilk yükseltme 75 → ~50 · G-07 dwell para-bağımsız (son ikisi
DENGE, varyant kapısına tabi) · masalar geçilmiyor (açıklık 0,68 br, geçiş 0,94 ister — 20 masanın
12'si) — **H3, kullanıcı kararı bekliyor.**

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
**İlerleme panosu (v47 · 100/108):** https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs

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
