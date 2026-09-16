# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-16 — **R2 AÇILDI: mutfak yerleşimi + çarpışma** · Faz R 2/4 · 103/111)

```
SORU            : İlk salonun SOL DUVARINDAKİ servis tezgâhı ile bulaşık — ÇİZİLEN gövde ile
                  ÇARPIŞMA kutusu aynı yerde mi, hat bitişik mi okunuyor, tezgâhın seviyesi
                  gözle kaç sinyalden okunuyor?
ÖLÇÜLECEK KOLLAR: T  taban (bugünkü hâl, iki dönem: sol duvar ve arka bant)
                  A1 çizim kutuya uyar — gövde ölçüsü dönüşten SONRAKİ eksene göre türer
                  A2 kutu çizime uyar — collision gövdenin bugün çizildiği yere döndürülür
                  B1 erken dönemde de birleştir (`onHat` sol duvar döneminde de koşar)
                  B2 bulaşık tezgâha yanaşır (koordinat değişir → erişim/tempo bedeli ölçülür)
                  C1 seviye sinyali sayımı (G-38): L0→L6 arası gözle değişen kaç işaret var
SAYILAR         : (adım 2'den sonra dolar)
KARAR           : (adım 3 — kullanıcı seçer)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (test dosyası + mutasyon sayısı)
```

**Kod okumasının bulduğu şüpheli (ÖLÇÜLMEDEN karar değildir):** `onHatGovdeleri` gövde
ölçüsünü `half[0]`/`half[1]`ten, yani DÜNYA eksenlerinden türetiyor; iki çağıran da (`Stations`
ve `DishSink`) gövdeyi `place.rot` ile ZATEN dönmüş bir grubun içine çiziyor. `rot = 0` olan
arka bant döneminde fark yok; sol duvar döneminde (`rot = π/2`) iki eksen yer değiştiriyor.
Aynı kök hem G-35'i (90° açı) hem G-36'yı (çizilen gövdenin katısı başka yerde) açıklayabilir —
araç bunu doğrulayacak ya da çürütecek.

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

## PANO — BORÇ KAPANDI, YAPISAL ÇÖZÜM UYGULANDI (2026-09-16)

Pano yayında: **https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs** (v49 · 103/111 · Faz R eklendi).

**Kök sebep kapatıldı, borç ödenmedi sadece.** Yayın canlı sürümün TAMAMININ okunmasını şart
koşuyor ve pano her turda büyüyordu — 67 günlük kartı, 219 KB, toplam 1829 satır; okunanın
neredeyse tamamı bir daha bakılmayacak arşivdi ve maliyet tur başına ARTIYORDU. Kullanıcı onayıyla
projenin kendi kuralı (`eski anlatı → arsiv/`) panoya uygulandı:

- Pano **son 8 turu** gösterir; taşan kart `memory-bank/arsiv/pano-gunluk.json`'a taşınır.
- Arşivlenen **59 kart** kaybolmadı — arşiv dosyasında ve git'te duruyor; pano altında sayacı var
  (`gunlukArsiv`), yani kaç kartın nerede olduğu ekranda yazılı.
- **1829 → 981 satır · 317 → 116 KB.** Sonraki turların yayın maliyeti üçte bire indi ve
  bir daha birikmez.
- Defter notu da güncellendi: yeni kart eklerken listeyi 8'de tutmak ve sayacı güncellemek
  panonun kendi JSON başlığında yazılı.

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

**Altyapı:** **KARARSIZ BEKÇİ (2026-09-16, R1 kapanışı):** `npm run test` bir koşuda
**1219/1220** verdi, hemen ardından **beş koşu üst üste 1220/1220**. Kırılan testin ADI
yakalanamadı (çıktı kuyruğu sayıyı gösteriyor, dosyayı değil) ve tekrar üretilemedi. Şüpheli
ikisi de çevreyi okuyan bekçiler: `sira-kilidi` (git çalışma ağacını okur — o an 3 dosya
commit'siz) ve `pano-guncelle` (panoyu defterle karşılaştırır — o an pano yeni yazılmıştı).
**Yazıldı, yutulmadı:** bir daha görülürse önce koşucuya dosya adını bastıracak bir kip
eklenmeli; kararsız bekçi bekçi değildir. · ~~`npm run apk` kırıktı~~ → **KAPANDI (2026-09-16):** Gradle 8.14.3'ün `gradlew.bat`'ı
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
