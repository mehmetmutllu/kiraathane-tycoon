# F6 tur 3 — DÖNDÜRME ANI raporu (ekran yönü K0)

**Tur:** F6 tur 3 · Faz F · 2026-09-17
**Araç:** `tools/olcum-donme-f6.mjs`
**Ham çıktı:** `docs/olcum-donme-f6.txt` (TAM koşu damgalı)
**Kareler:** `docs/gorsel/ss/f6-donme-*.png`

> **Bu rapor commit #1'de KARAR BÖLÜMÜ BOŞ olarak yayımlanır** (D-084 sıra kilidi).
> Karar paketi sunulup kol seçildikten sonra §Karar ve §Uygulama doldurulur.

---

## SORU

Kullanıcı ① ekran yönünü seçti:

> *"şimdi ekran yönü dikey olacak ama kullanıcı isterse yataya dönebilir veya tablette oynarsa
> yatay gibi tepki verecek ya uygulama ona göre davranmalı. kısaca ana tema dikey ama yatayda da
> kullanılabilir olmalı uygulama."*

Bu **K0 SERBEST**'tir: kilit yok, dört yön de açık, portre ana tema.

Karar verildi — ama K0'ın **bedeli ölçülmedi.** D-131 üç DURAN kareyi ölçtü (412×915 · 915×412 ·
1280×800) ve hepsini yeşile boyadı. Duran kare K0'ın sorusunu cevaplamıyor: kilidi kaldırınca
yeni olan şey kare değil **geçiş**. Oyuncu oynarken çeviriyor; üstelik açık bir ekran varken
D-131'in **ray ↔ üst şerit takası** tam o anda oluyor. O an bugüne dek hiç denenmedi.

**Sorulan:** canlı bir oturumu çevirmek bir şeyi bozuyor mu?

---

## YÖNTEM — kendi referansını üreten ölçüt

Ana ölçüt **TAZE ↔ DÖNEREK**. Her hedef kadraj aynı boyuta **iki yoldan** varılarak ölçülür:

| yol | nasıl |
|---|---|
| **taze** | tarayıcı doğrudan B boyutunda açılır — *D-131'in ölçtüğü yol* |
| **dönerek** | A boyutunda açılır, oyun kurulur, sonra **canlı olarak** B'ye çevrilir |

İkisi eşitse geçiş temizdir. Eşit değilse ortada **bayat hâl** vardır: bir şey ilk düzene göre
hesaplanmış, döndürme onu tazelememiştir.

Bu ölçüt **dışarıdan eşik gerektirmez** — "%19 iyi mi kötü mü" tartışması yok; tutarsızlığın
kendisi bulgudur. Bu turda bilerek böyle seçildi, çünkü D-131 duran karelerin sayılarını zaten
onaylattı; burada sorulan onların doğru olup olmadığı değil, **geçişte korunup korunmadıkları**.

Üç bölüm:

| bölüm | ne ölçer | hücre |
|---|---|---|
| **§J1** | HUD döndürme — 4 yön çifti | 4 |
| **§J2** | açık ekranla döndürme — 4 çift × 5 panel | 20 |
| **§J3** | gidiş-dönüş A→B→A — birikimli bozulma | 4 |

Yön çiftleri **iki yönde de** koşuldu (P→Y ve Y→P ayrı satır): hangi düzenin "ilk" kurulduğu
bayat hâli belirler ve D-131'in dalları **asimetrik** (ray yalnız kısa yatayda açılır), yani
dönüş yolu ayrı bir yüzeydir.

### Araç doğrulandı — kanarya

Bu ölçümün bütün bulgusu `fark()`in **boş** çıkmasına dayanıyor. `fark()` her zaman boş dönen
bozuk bir işlev olsaydı ölçüm de tertemiz görünürdü, üstelik **hiçbir tutarsızlık üretmeden** —
F1b tur 1'in İYİMSER hatası tam bu biçimdeydi (*"sonucun kendisinden anlaşılmıyordu"*). Bu yüzden
araç, iki FARKLI kadrajı karşılaştırıp farkın boş çıkması hâlinde **kendini geçersiz ilan
ediyor** (`KANARYA OLDU` ile durur). Koşuda kanarya yeşil.

Ayrıca her hücre **dünya imzası** basıyor (`t20|s0|a3|nN`): imzasız "ölçtüm" demek *aynı sahneyi*
ölçtüm demek değildir.

### `scrollHeight` KULLANILMADI

F1b'nin açık ucu ④: `scrollHeight` taşan çocukları saymıyor, altı hücrenin beşinde yanlıştı.
Bu araç onun yerine **`disarida`** sayıyor — gövdenin alt kenarını gerçekten aşan kart sayısı.
`display:contents` sarmalayıcılar yüzünden doğrudan çocuk listesi ızgaraya giren gerçek kartlarla
aynı olmadığı için, sarmalayıcılar bir düzey açılarak yapraklar geziliyor.

---

## KAPSAM DAMGASI — bu ölçümün ÖLÇMEDİĞİ şey

| konu | durum |
|---|---|
| geçişin geometrisi, tuval/kamera tazelenmesi, panel yerleşimi, oyun durumu | **KESİN** (vekil ekranda, geometrik büyüklükler) |
| **çentik / güvenli alan** | **ÖLÇÜLMEDİ.** Yatayda `env(safe-area-inset-*)` sol/sağa geçer; Playwright çentik taklit edemez, `--sal`/`--sar` her kadrajda 0. Bu rapor *"yatayda çentik HUD'u kesiyor mu"* sorusuna **cevap vermez** — cihaz turunun kalemi. |
| döndürme **animasyonunun** hissi | ölçülmedi (geometri ölçüldü, akıcılık değil) |
| gerçek cihazda `fullUser`ın davranışı | ölçülmedi — cihaz turu |

---

## ARACIN İKİ KUSURU — ölçümün kendisi bir kez GEÇERSİZ OLDU

Bu rapordaki sayılar aracın **ikinci** koşusundan. Birincisi geçersizdi ve iptal edilme sebebi
bulgunun kendisi kadar önemli:

**① `Escape` panelleri hiç kapatmıyordu.** Taze referans döngüsü beş paneli sırayla açıp
kapatıyordu; kapatma `Escape` tuşuyla yapılıyordu. Oysa **hiçbir sheet'te klavye kancası yok** —
`Sheet.tsx`te yalnız `.sheet-back` düğmesi `onClose` çağırıyor, `keydown` dinleyicisi sadece
`DevSandbox`ta. Yani ilk panel açılıyor, kapanmıyor, HUD düğmelerinin üstünü örttüğü için
sonraki dördü hiç açılamıyordu.

**② Ve bu, sessiz bir ÖLÇÜM YALANI üretiyordu.** `fark()` bir alanı iki taraftan birinde
`undefined` görünce atlıyor. Açılamayan paneller için referans `{yok:true}` kalmıştı, yani
bütün alanlar `undefined`, yani fark **boş** dönüyordu — karşılaştırma hiç yapılmadığı hâlde
çıktıda **"— temiz —"** yazıyordu. İlk koşunun *"§J2: 20/20 temiz"* satırlarının dördü bu
yüzden uydurmaydı.

**HUD kanaryası bunu yakalamadı, çünkü kanarya yalnız denetlediği yüzeyi korur.** HUD
karşılaştırıcısı gerçekten çalışıyordu; kırık olan panel referanslarıydı. Araca ikinci kanarya
eklendi (her panel için iki farklı kadrajın farkı boş çıkarsa dur) ve kapatma artık gerçek geri
düğmesine basıp **panelin gittiğini doğruluyor**; gitmiyorsa araç susmuyor, **duruyor**.

> **Turun kalıcı dersi: kanarya bir yüzeyi korur, aracı değil.** F1b tur 1'in dersi *"iyimser
> hata kaçar"*dı ve çaresi kanaryaydı. Bu tur onun sınırını gösterdi: kanarya koyduğum yer
> (HUD) sağlamdı, koymadığım yer (panel) çürüktü ve **aynı sahte-temiz biçiminde** çürüdü.
> Ölçümün "temiz" demesi, ölçümün çalıştığı anlamına gelmiyor.

---

## BULGULAR

Ham çıktı: `docs/olcum-donme-f6.txt` (TAM, 814 sn) · `docs/olcum-kol-donme-f6.txt` (TAM).
Dört çiftin dördünde de dünya imzası kuruldu (`t20|s0|a3|n2-3`).

### §J1 — HUD döndürme: TEMİZ (4/4)

| çift | hedef | HUD % | taşan | tuval dW/dH | tampon W×H | kamSapma | hata | durum |
|---|---|---|---|---|---|---|---|---|
| telefon portre → yatay | L1 | 19,0 | 0 | 0/0 | 1830×824 | 0 | **0** | ok |
| telefon yatay → portre | P1 | 19,7 | 0 | 0/0 | 824×1830 | 0 | **0** | ok |
| tablet portre → yatay | T2 | 6,7 | 0 | 0/0 | 1918×1198 | 0 | **0** | ok |
| tablet yatay → portre | T1 | 7,0 | 0 | 0/0 | 1198×1918 | 0 | **0** | ok |

- **konsol/sayfa hatası 0** — geçiş hiçbir şey fırlatmıyor;
- **oyun durumu korundu** (`wallet · diamonds · tables · npc · stations · areas` birebir) —
  döndürme ilerlemeyi yutmuyor;
- **tuval yeni kadraja tam oturuyor** (sapma 0/0) ve **çizim tamponu gerçekten yeniden
  boyutlanıyor** (boyutlar takas oluyor). Eski tampon kalsaydı sahne gerilirdi ve *HUD sayıları
  tertemiz çıkarken oyun bozuk görünürdü*;
- **kamera en-boyu tazeleniyor** (sapma 0) — bayat kamera yok; **taşan öğe 0.**

Taze ↔ dönerek karşılaştırmasında oynayan **tek alan `HUD %`** (−0,1 · −0,4 · −0,1 pp). Bu bayat
düzen değil: aynı hücrelerde **bütün geometrik alanlar birebir eşit** (şerit genişliği ve merkez
kaçıklığı, nav genişliği ve kaçıklığı, taşan sayısı, tuval sapması, tampon boyutu). Düzen bayat
kalsaydı **önce geometri** oynardı. `HUD %` 4 px ızgarayla örneklenen, **içeriğe duyarlı** bir
orandır (para basamağı, görev metni, NPC'ye bağlı rozet genişliği).

### §J3 — gidiş-dönüş: TEMİZ (4/4)

`A→B→A` dört çiftte de hatasız; geometri birebir, yalnız aynı `HUD %` gürültüsü.
**Birikimli bozulma yok.**

### §J2 — açık ekranla döndürme: 19/20 temiz, **1 KİRLİ**

Beş ekran × dört yön çifti. On dokuz hücrede panel açık kaldı, hata 0, kesilen 0 ve taze ↔
dönerek farkı **geometrik alanlar dahil** boş. D-131'in **ray ↔ şerit takası geçişte doğru
çalışıyor**: telefon yatayına dönünce üst bölge `192×412` (dikey = ray), portreye/tablete dönünce
`412×62` / `520×62` (yatay = şerit). Takas edilmeden kalan hâl yok.

**Tek kirli hücre:**

```
T1>T2   Karakter   disarida:0→1 · gorunurDugme:6→3 · gizliOdul:0→3
```

**Karakter ekranı tablet portresinde AÇIKKEN yatay çevrilirse, üç ödül düğmesinin üçü de
gövdenin dışında kalıyor.** Aynı ekran tablet yatayında **doğrudan açılınca tertemiz** (0/3).
Kusur duran karede YOK, yalnız geçişte var — D-131 onu göremezdi, çünkü D-131 duran kare ölçtü.

### ⇒ TURUN SORUSUNUN CEVABI

**K0'ın döndürme bedeli bir hücre.** Serbest yön; hata üretmiyor, ilerleme yutmuyor, tuval ve
kamerayı tazeliyor, açık ekranı kapatmıyor, düzeni doğru takas ediyor, gidiş-dönüşü kapatıyor.
Ölçülen 28 hücrenin 27'si temiz. **Biri değil** ve o bir hücre kapatılabilir (§M).

---

## §M — KUSURUN MEKANİZMASI ve KOLLAR

### Mekanizma: bir "yeniden hesaplama" eksiği değil, bir SHRINK KİLİDİ

```css
.sheet-body  { flex: 1; min-height: 0; overflow-y: auto; }   /* kaydıran kap */
.char-card   { flex: 1 0 auto; }                              /* ← shrink 0 */
.char-canvas { flex: 1 1 auto; min-height: 230px; }
```

Tablet portresinde (1280 px yüksek) kart gövdeyi doldurur, içindeki canlı 3B tuval büyür. Yatay
çevrilince gövde 738 px'e iner — **ama kartın `flex-shrink` değeri 0 olduğu için kart o
yüksekliği bırakmaz.** Küçülmesi gereken yerde küçülmüyor; içerik gövdenin altından taşıyor ve
`overflow-y: auto` onu kaydırmaya gömüyor. Taze açılışta kart en baştan 738'e göre kurulduğu için
sorun çıkmıyor.

Ölçüm mekanizmayı **sayıyla** gösteriyor (§M taban satırı):

| T1→T2 Karakter | taze | dönerek |
|---|---|---|
| gövde yüksekliği | 738 | 738 |
| **kart yüksekliği** | 722 | **1202** ← portre yüksekliğini bırakmıyor |
| **tuval yüksekliği** | 410 | **890** |
| dışarıda | 0 | **1** |
| görünür düğme | 6/7 | **3/7** |
| **gizli ödül** | 0/3 | **3/3** |

Gövde ikisinde de 738 — yani **kap doğru tazeleniyor, içerik tazelenmiyor.** Kusur kabuğun
responsive dallarında değil, kartın kendi flex kuralında.

### Kollar

Dört kol, her biri mekanizmanın **farklı bir halkasını** hedefliyor. Hepsi CSS katmanı olarak
gerçek oyunun üstüne uygulandı (depoda hiçbir şey değişmedi) ve **döndürme üzerinden** ölçüldü —
duran karede ölçmek kusuru göremezdi. Her kol ayrıca üç sonda çiftinde koşuldu (telefon P→Y,
telefon Y→P, tablet Y→P): **kusuru kapatmak yetmez, başka yeri bozmamak da şart.**

| kol | ne yapıyor | kusur hücresi (T1→T2 Karakter) | sonda |
|---|---|---|---|
| **R0** | taban (bugün) | ✗ `kartY 722→1202` · `tuvalY 410→890` · `dışarıda 0→1` · `görünür 6→3` · **`gizli ödül 0→3`** | — |
| **RA** | `.char-card { flex: 1 1 auto }` — shrink kilidini açar | ✅ **taze = dönerek, birebir** (722 · 410 · 0 · 6/7 · 0/3) | ✅ üçü de temiz |
| **RB** | `.char-canvas { min-height: min(230px, 26vh) }` | ✗ **hiç oynatmadı** — aynı `1202/890/3-3` | ✗ **L1→P1'i BOZDU** (`kartY 846→837` · `tuvalY 534→525`) |
| **RC** | D-131 dalının eşiği `560px → 900px` (tablet yatayı da ray+iki sütun) | ⚠ `gizli ödül` düzeliyor (0/3) **ama kart hâlâ bayat**: `kartY 574→688` · `tuvalY 262→376` | ✅ üçü de temiz |

### Kolların okunması

**RB neden düştü — yanlış halkayı tuttu.** Tuvalin taban payını yüksekliğe bağlamak, tuvalin
*kendi* küçülmesine izin verir; ama tuval zaten `flex: 1 1 auto`, yani küçülebiliyordu. Küçülmeyi
engelleyen **kart**tı. RB kilidin bulunmadığı halkayı gevşetti: kusur hiç oynamadı, üstelik
telefon yatayında kartın yüksekliğini 9 px kaydırarak **çalışan bir hücreyi kirletti.**

**RC neden yetmez — belirtiyi örtüyor, sebebi bırakıyor.** Tablet yatayını ray + iki sütuna
sokunca ödül düğmeleri görünür oluyor (0/3), çünkü iki sütunlu ızgarada kart zaten kısalıyor.
Ama `kartY 574→688` hâlâ eşitsiz: **shrink kilidi yerinde duruyor**, yalnız bugünkü içerikle
taşmaya yetmiyor. Kart bir satır büyüdüğü gün kusur geri gelir ve bu sefer sebebi gizlenmiş olur.
Ayrıca RC tablet yatayının **bütün düzenini** değiştiriyor — bu bir hata düzeltmesi değil,
görünüşe dair ayrı bir ürün kararı (G-55). Onu bu kusurun arkasına saklamak yanlış olur.

**RA neden kazandı — kilidin kendisi.** Tek özellik. Kusur hücresinde taze ile dönerek **birebir
eşit**; diğer üç çiftte taban satırlarıyla **karakter karakter aynı** (telefon yatayı 354/120,
telefon portresi 837/525, tablet portresi aynı) — yani hiçbir şeyi değiştirmiyor, yalnız
küçülmesi gereken şeyin küçülmesine izin veriyor.

### Bu bir ÜRÜN çatalı değil, TEKNİK çatal

`feedback_technical_forks`: *ürün/kapsam sorulur, kod yapısı sorulmaz — en iyisi seçilir ve
gerekçelendirilir.* "Hangi CSS özelliği flex kilidini açar" sorusunun kullanıcıya sorulacak bir
tarafı yok; sayı tek bir kolu gösteriyor. **RA seçildi.** Görünüşü değiştiren tek kol RC'ydi ve o
zaten ayrı bir kalem (G-55) olarak duruyor — bu turda kasıtla uygulanmıyor.

---

## KARAR — D-132

**① Ekran yönü: K0 SERBEST.** Kullanıcının kararı (paket v2'de sunulan dört koldan biri; bu turda
kendi cümlesiyle seçildi). Portre ana tema, dört yön de açık, kilit yok.

**Kusurun kolu: RA.** Bu bir TEKNİK çatal (`feedback_technical_forks`) — "hangi CSS özelliği flex
kilidini açar" sorusunun kullanıcıya sorulacak tarafı yok ve sayı tek kolu gösteriyor: RA kusuru
birebir kapatıyor, RB kapatmıyor üstelik çalışan bir hücreyi kirletiyor, RC belirtiyi örtüp
sebebi bırakıyor. Görünüşü değiştiren tek kol RC'ydi ve o zaten ayrı bir kalem (**G-55**) —
bir hata düzeltmesinin arkasına saklanmadı.

**③ Açılış ekranı + ikon: ERTELENDİ.** Kullanıcı: *"ikonu da en son hallederiz."*

---

## UYGULAMA

| dosya | değişiklik |
|---|---|
| `android/app/src/main/AndroidManifest.xml` | `android:screenOrientation="fullUser"` — K0 artık **yazılı**. Gerekçesi (neden `fullSensor` değil, `configChanges` neden kaldırılamaz) kuralın yanında. |
| `src/components/ui/hud.css` | `.char-card { flex-shrink: 1 }` — shrink kilidi açıldı. Yalnız `.char-card`; `.shop-card` aynı kilidi taşıyor ama ölçümde kirlenmedi, **ölçülmeyen yere dokunulmadı**. |
| `tests/ekran-yonu-f6.test.ts` | bekçi, 6 denetim |
| `tools/mutasyon-yon-f6.mjs` | bekçinin doğrulaması, 6 mutasyon |

### Bekçi — 6/6 mutasyon yakalandı

| mutasyon | taklit ettiği çiğneme |
|---|---|
| M1 yön `portrait`e kilitlenir | K0'ın doğrudan ihlali |
| M2 yön beyanı silinir | karar YAZISIZ kalır (bugüne kadarki hâl) |
| M3 yön `fullSensor` yapılır | dört yön açık **ama cihaz kilidini ezer** |
| M4 `orientation` configChanges'ten düşer | her döndürmede oturum sıfırlanır |
| M5 shrink düzeltmesi geri alınır | **duran karede görünmeyen** kusur geri gelir |
| M6 yön JS'ten kilitlenir | manifest serbestken arka kapı |

M5 bekçinin varlık sebebi: taklit ettiği kusuru **ne göz ne duman testi** yakalar, çünkü duran
karede yok.

### FİNAL — tam koşu, düzeltme gerçek kodda

`docs/olcum-donme-f6.txt` (TAM, 820 sn) · önceki hâl karşılaştırma için
`docs/olcum-donme-f6-once.txt` (TAM, 814 sn).

| | önce | sonra |
|---|---|---|
| §J2 açık ekranla döndürme | 19/20 temiz | **20/20 temiz** |
| T1→T2 Karakter gizli ödül | **3/3** | **0/3** |
| T1→T2 Karakter kart yüksekliği | 722 → **1202** | 722 → **722** |
| §J1 HUD döndürme | 4/4, hata 0 | 4/4, hata 0 |
| §J3 gidiş-dönüş | 4/4, hata 0 | 4/4, hata 0 |

vitest **1305/1305** ✓ · duman **45/45** ✓ · `tsc -b` temiz · dünya imzası her hücrede kuruldu.

---

## BU TURUN BIRAKTIĞI AÇIK UÇLAR

① **`.shop-card` aynı shrink kilidini taşıyor** — ölçümde kirlenmedi (Mağaza dört yön çiftinde de
temiz), o yüzden dokunulmadı. İçeriği bir gün uzarsa aynı kusuru üretir; bekçi onu denetlemiyor.

② **§L (tablet yatayının DURAN hâli) yarım kaldı.** Aracı var (`tools/olcum-tablet-f6.mjs`,
kapatma kusuru düzeltilmiş hâlde) ama tam koşusu yok — ilk koşusu `Escape` kusuru yüzünden
geçersizdi. Bu **G-55**'in turudur: RC kolu kısa koşuda tablet yatayında görünür düğmeyi
25/30 → 30/30 yapmıştı, ama KISA damgalı sayı rapora girmez.

③ **Çentik ölçülmedi** — Playwright safe-area taklit edemez. Yatayda `env(safe-area-inset-*)`
sol/sağa geçer ve HUD'u kesebilir. **Cihaz turunun kalemi**, bu rapor o soruya cevap vermiyor.

④ **Döndürmenin canlı denetimi duman testinde yok.** Bekçi statik (manifest metni + CSS kuralı);
bilinen sebebi tutuyor ama başka bir sebep aynı bayatlığı yeniden üretirse yakalamaz. Ucuz bir
duman denetimi (çevir → konsol hatası yok + tuval oturuyor) eklenebilir; bu turda kapsam
büyütmemek için eklenmedi.

⑤ **`tools/sira-kilidi.mjs` ölçüm kanıtı olarak yalnız `tools/olcum-*.ts` tanıyor**, ama proje
aylardır `.mjs` araç yazıyor (bu turun üç aracı dahil). Yalnız `.mjs` araç taşıyan bir ölçüm
commit'i sayılmıyor. Tek satırlık delik.
