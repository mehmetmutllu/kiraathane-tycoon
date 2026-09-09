# D9 — Meta katmanın yığını: üç kanat ilk kez aynı koşuda

**Ham çıktı:** `docs/olcum-meta-penceresi.txt` (tam koşu · 23,7 sn · damgalar temiz)
**Araç:** `tools/olcum-meta-penceresi.ts`
**Model:** D-086 yürürlükteki model (`k1b` + `k2`) · `economy.config.ts` **hiç değişmedi**
(üç katman da sim'in kancalarına takılır)

## §1 Soru

Faz D üç ödül kanadı ekledi ve **her tur ötekilerin kancasını kapatarak ölçtü**:

| Katman | Ne | Nerede karara bağlandı | Ölçüldüğü dünya |
|---|---|---|---|
| **H** | hedef koleksiyonunun kalıcı gelir çarpanı | D-090 | İtibar ve Usta YOK |
| **R** | İtibar'ın taşıma çarpanı | D-092 | hedef çarpanı KAPALI |
| **E** | Usta katmanı + günlük görev 💎 arzı | D-093 / D-094 | H + R açık, ama E'nin kendi iki knob'u ayrı satırlardaydı |

Yani **bugünkü oyunun — üçü birden açık — tempo penceresi hiçbir tabloda yoktu.**
İki soru bu yüzden beş turdur açıktı:

1. **D-087:** meta katman 20 dk ölçütünün ihlallerini doldurdu mu?
2. **D-092:** zincirden bilerek alınan %15,5, yığın açıkken ne oldu?

Üstüne turun kendi sorusu: D-090 Bulgu 10 ("uygulanan hâl knob'ların toplamı çıkmadı")
D-093'te üçüncü kez tekrarlandı. **Aynı toplanamama bir kat yukarıda, katmanlar arasında da
duruyor olabilir** — öyleyse üç turun ayrı ayrı ölçtüğü kazanç bugün yürürlükte değildir.

## §2 Model sınırı (karara aynen geçer)

1. Her katman **kendi turunun model sınırını beraberinde getirir**: H 5 kategorinin 4'ünü
   modelliyor (alt sınır) · R'nin XP'si türetiliyor ve `perDishWashed = 0` (alt sınır) ·
   E'nin 12 sa penceresi yarım gün (günlük arz küçük kalır) ve ödül anında harcanıyor
   (üst sınır). **Yığın bu sınırların bileşimidir, daha dar değil.**
2. Hedeflerin ₺ akışı her satırda kapalı — D-090'da tamamen kalktı, bugün ödenen tek şey çarpan.
3. Hüküm profili **İdealize** (D-087); Normal satırı gözlem bandıdır.

## §Bulgular

### Bulgu 1 — D-087'nin hükmü TEMİZ: yığın açıkken 20 dk'yı aşan alım **sıfır**

| kol | H R E | HÜKÜM (İdealize) | GÖZLEM (Normal) | ilk alım | açılış | otom. | ŞERİT | ΔŞERİT |
|---|---|---|---|---|---|---|---|---|
| M0 | · · · | **1** · 23,9 dk | 6 · 43,4 dk | 22 sn | 1,6 dk | 6,1 dk | 8,48 sa | +0,0% |
| H | H · · | 1 · 22,7 dk | 5 · 41,2 dk | 22 sn | 1,6 dk | 6,1 dk | 8,14 sa | −4,0% |
| R | · R · | **0** · 19,9 dk | 3 · 35,5 dk | 22 sn | 1,6 dk | 6,1 dk | 7,16 sa | −15,6% |
| E | · · E | 1 · 22,6 dk | 6 · 41,1 dk | 22 sn | 1,6 dk | 6,1 dk | 8,34 sa | −1,7% |
| HR | H R · | **0** · 19,0 dk | 2 · 33,8 dk | 22 sn | 1,6 dk | 6,1 dk | 6,88 sa | −18,9% |
| HE | H · E | 1 · 21,5 dk | 5 · 39,0 dk | 22 sn | 1,6 dk | 6,1 dk | 8,01 sa | −5,6% |
| RE | · R E | **0** · 18,9 dk | 3 · 33,7 dk | 22 sn | 1,6 dk | 6,1 dk | 7,04 sa | −17,0% |
| **HRE** | **H R E** | **0** · **18,0 dk** | **2** · **32,0 dk** | 22 sn | 1,6 dk | 6,1 dk | **6,77 sa** | **−20,1%** |

**Beş turdur açık duran kalem kapandı.** Yürürlükteki oyun (HRE) hüküm profilinde 20 dk'yı
hiç aşmıyor; en uzun bekleme 18,0 dk (`servis L6`), ölçütün 2 dk altında. Gözlem bandı da
6 → 2 ihlal, 43,4 → 32,0 dk.

### Bulgu 2 — Hükmü kapatan tek katman **R**; H ve E tek başlarına kapatmıyor

İdealize kolonu üç tekil satırda da okunur: H **1**, E **1**, R **0**. Yani D-087'nin hükmünü
kapatan şey hedef koleksiyonu da Usta da değil, **İtibar'ın taşıma çarpanı**. H ve E hükmü
kımıldatmıyor (23,9 → 22,7 ve 22,6 dk — ikisi de 20 dk'nın üstünde kalıyor).

Bu, D-092'nin kararını geriye dönük doğruluyor: kelepçe taşımadaydı ve tek etkili ödeme
oraya yapıldı. Aynı şey ters yönde de okunur — **R geri alınırsa D-087 yeniden açılır.**

### Bulgu 3 — Katmanlar TOPLANIYOR: D-090 Bulgu 10 bir kat yukarıda TEKRARLAMADI

| ölçü | M0 | tekil delta (H · R · E) | beklenen (toplanır) | ölçülen HRE | fark |
|---|---|---|---|---|---|
| en uzun bekleme (Normal) | 43,4 dk | −2,1 · −7,8 · −2,3 | 31,1 dk | **32,0 dk** | +0,9 dk (%2,9) |
| ihlal sayısı (Normal) | 6 | −1 · −3 · 0 | 2 | **2** | **0** |
| ihlal sayısı (İdealize · HÜKÜM) | 1 | 0 · −1 · 0 | 0 | **0** | **0** |
| ŞERİT (zincir ömrü) | 8,48 sa | −0,34 · −1,32 · −0,14 | 6,67 sa | **6,77 sa** | +0,10 sa (%1,5) |

Turun asıl sorusuna cevap: **hayır, katmanlar arasında toplanamama yok.** İki ihlal sayısında
fark tam sıfır; sürekli iki ölçüde fark %1,5-2,9 — bekçi bandının çözünürlüğünün altında.

Bu, D-090 Bulgu 10'un sınırını da adlandırıyor: **toplanamama KNOB'lar arasında (aynı katmanın
iki ayarı) çıkıyor, KATMANLAR arasında çıkmıyor.** İki knob aynı tavana biniyor ve birbirinin
payını yiyor; üç katman ise üç ayrı yere biniyor (gelir · taşıma · bahşiş+arz).

### Bulgu 4 — Zincir borcu **%−20,1**: D-092'nin istisnası artık istisna değil, YIĞININ HÂLİ

D1'in eleme eşiği %7 idi. D-092 onu bilerek aştı (%−15,5) ve "emsal değil, sayısı yazılı
istisna" olarak kaydedildi. Yığın açıkken toplam **%−20,1**: Kat 1 içeriğinin ömrü
**8,48 sa → 6,77 sa**, yani **1 saat 43 dakika kısaldı.**

Katman başına bedel ve karşılığı:

| katman | ΔŞERİT | hükme katkısı | gözlem ihlaline katkısı |
|---|---|---|---|
| R | −15,6% | **1 → 0** (tek kapatan) | −3 |
| H | −4,0% | 0 (1'de kalıyor) | −1 |
| E | −1,7% | 0 (1'de kalıyor) | 0 |

Zincirin %78'ini R yiyor ve hükmü kapatan da o. **Ucuz olan iki katman (H %−4,0 · E %−1,7)
tempoyu zaten kımıldatmıyor** — yani "pahalı olanı kısıp ucuzlarla idare et" diye bir kol yok.

### Bulgu 5 — Açılış sağlam; tek sızıntı **1 saniye** ve yalnız H'den *(bekçi düzeltti)*

Tablo sekiz satırda da `ilk alım 22 sn · açılış en uzun 1,6 dk · otomasyon 6,1 dk` basıyor ve
bu rapor önce "sekiz satırın sekizinde birebir aynı" diye yazıldı. **Bekçi testi o cümleyi
çürüttü:** aracın dakikaya yuvarlaması bir farkı gizliyordu. Saniye çözünürlüğünde:

| bileşim | ilk alım | açılış en uzun | otomasyon |
|---|---|---|---|
| M0 | 22 sn | 93 sn | **366 sn** |
| H | 22 sn | 93 sn | **365 sn** |
| R | 22 sn | 93 sn | 366 sn |
| E | 22 sn | 93 sn | 366 sn |
| HRE | 22 sn | 93 sn | **365 sn** |

Sızıntı **gerçek ama tek saniye** (%0,27) ve **yalnız H'den** geliyor: hedef koleksiyonunun ilk
kazanç kademesi (1.000 ₺) garsondan önce açılıyor, çarpan bir tick sonra yürürlüğe giriyor.
D-079'un üç ölçütü (< 90 sn · ≤ 2 dk · < 15 dk) sekiz bileşimin sekizinde de geçiyor; D4'te
`hG` kolunun elendiği sızıntı (otomasyon 6,1 → 1,7 dk) burada **yok**.

Süreç dersi: **yuvarlanmış bir kolon "fark yok" diye okunamaz.** Bekçi sayıyı ham hâliyle
sorduğu için buldu; tabloya bakan göz bulamazdı.

### Bulgu 6 — Kelepçe hâlâ TAŞIMADA; yığın onu yerinden oynatmadı

| kanal | M0 | HRE | fark |
|---|---|---|---|
| talep | %1,1 | %1,4 | +0,3 |
| arz | %5,9 | %7,3 | +1,4 |
| **taşıma** | **%93,0** | **%91,3** | −1,7 |

Toplam tick M0 30.527 → HRE 24.379. Taşımanın payı 1,7 puan düştü ama hâlâ zamanın
**%91,3'ünde bağlayıcı**. Bir sonraki denge kolunun kanalı değişmedi — ve D-092'den beri
üçüncü kez aynı sonuç okunuyor (D6 %93,0 · D7 %91,5 · D9 %91,3).

### Bulgu 7 — Kalan iki ihlal: `zone3` (20,8 dk) ve `servis L6` (32,0 dk)

M0'ın altı ihlalinden dördü kapandı (`z2table4` · `z3table3` · `servis L5` · `waiter3`).
Kalan ikisi gözlem bandında; hüküm profilinde ikisi de eşiğin altına iniyor. `servis L6`
D-078'den beri bilerek bırakılan basamak.

### Bulgu 8 — E (Usta + günlük görev) tek başına tempoya dokunmuyor, ama BİLEŞİMDE ödüyor

Tekil E satırı Normal ihlali 6'da bırakıyor (M0 ile aynı) ve hükmü kımıldatmıyor. Ama
bileşimde katkısı tutarlı: H %−4,0 → HE %−5,6 · R %−15,6 → RE %−17,0 · HR %−18,9 → HRE %−20,1
— her seferinde ~1,5 puan. 12 sa'de **5 Usta** alınıyor, kalan 9,8 💎, korunum sapması 0.

D-093'ün "günlük görev 12 saatlik pencerede küçük kalır" model sınırı burada da geçerli:
E'nin gerçek işi gün ölçeğinde, bu tabloda değil.

---

## §Karar — D-095

**Zincir borcu %−20,1 KABUL EDİLDİ; eşik yazıldı. Kod değişmedi.**

Kullanıcıya üç ölçülmüş kol sunuldu:

| kol | ΔŞERİT | hüküm | en uzun (Normal) | sonuç |
|---|---|---|---|---|
| **HRE — kabul et** | −20,1% | **0** | 32,0 dk | **✓ SEÇİLDİ** |
| HE — R'yi kıs | −5,6% | 1 | 39,0 dk | reddedildi: D-087'yi yeniden açıyor |
| RE — H'yi kıs | −17,0% | 0 | 33,7 dk | reddedildi: %3,1 zincir için ölçülen tempoyu veriyor |
| HR — E'yi kıs | −18,9% | 0 | 33,8 dk | reddedildi: %1,2 zincir için Usta katmanını siliyor |

**Yürürlükteki eşik iki sayı oldu:**

- **Tek kol** için D1'in %7 eleme eşiği **aynen duruyor** — bir kaldıraç zincirden %7'den
  fazlasını alıyorsa gerekçe ister.
- **Yığın** için yeni ve yazılı sayı: **%−20,1 · ŞERİT tabanı 6,77 sa.** D-092'nin "sayısı
  yazılı istisna"sı böylece istisna olmaktan çıkıp yığının ölçülmüş hâli oldu.

**Gerekçe:** hüküm temiz (18,0 dk, ölçütün 2 dk altında), açılış temiz, ve ölçüm gösterdi ki
üç katmanın hiçbiri "ucuza geri alınabilir" değil — zincirin %78'ini yiyen R aynı zamanda
hükmü kapatan tek katman (Bulgu 2), ucuz iki katman ise tempoyu zaten kımıldatmıyor (Bulgu 4).
Kat 1 içeriğinin 6,77 saatlik ömrü mobil idle için kısa değil ve boşluğu meta katman içerikle
değil ilerlemeyle dolduruyor.

**Kapanan kalem:** D-087'nin beş turdur açık duran "meta katman pencereleri doldurdu mu"
sorusu — cevap **evet**, hüküm profilinde ihlal sıfır.

**Açılan kalem:** zinciri UZATAN kollar hiç ölçülmedi. Zaten açık duran iki kalem tam oraya
bakıyor (`outputMultByLevel` yok · `b1` basamak bölme erken oyuna dokunmadan denenemiyor).
Kendi turunu ister; bu turda kod yazılmadı.

## §Bekçi

`tests/meta-pencere.test.ts` — **22 test**, **10 mutasyon**, dokuzu bu bekçide yakalandı.

| mutasyon | sonuç |
|---|---|
| M1 `carryBonusPerLevel` 0,02 → 0 (R öldürüldü) | 7 test kırıldı ✓ |
| M2 `carryBonusPerLevel` → 0,04 | 5 test kırıldı ✓ |
| M3 `incomeBonusTotal` 0,10 → 0 (H öldürüldü) | 3 test kırıldı ✓ |
| M4 `incomeBonusTotal` → 0,30 | 5 test kırıldı ✓ |
| M5 `tipMult` 1,5 → 1 (Usta etkisi öldürüldü) | **İLK HÂLİNDE KAÇTI** → bant eklendi → ✓ |
| M6 `tipMult` → 3 | 6 test kırıldı ✓ |
| M7 `diamondCost` 25 → 500 (Usta alınamaz) | 1 test kırıldı ✓ |
| M8 `diamondsPerDay` 10 → 0 | **KAÇTI — bilerek** (aşağıda) |
| M9 `tipBase` 2 → 4 | 4 test kırıldı ✓ |
| M10 `tipMult` → 1,2 (hafif doz) | 1 test kırıldı ✓ |

**M5 kaçtı ve bekçinin zayıf yerini gösterdi:** Usta'nın etkisi tamamen ölürken 21 testin 21'i
de geçiyordu, çünkü E'nin ihlal sayısındaki izi zaten sıfırdı. Eklenen iddia E'nin **tek
ölçülebilir izini** kilitliyor: ŞERİT'i en az %1 kısaltmalı (ölçülen %−1,7).

**M8 bilerek kaçıyor ve bu bir eksik değil, ölçülmüş bir model sınırıdır.** Günlük görev arzı
kesilince 12 sa penceresinde değişen tek şey elmas defteridir:

| | kazanılan 💎 | kalan 💎 | Usta alımı | ŞERİT | en uzun | ihlal |
|---|---|---|---|---|---|---|
| `diamondsPerDay: 10` | 135,47 | 10,47 | 5 | 30.017 sn | 2465,0 sn | 6 |
| `diamondsPerDay: 0` | 132,00 | 7,00 | 5 | **30.017 sn** | **2465,0 sn** | 6 |

Tempo saniyesi saniyesine aynı — D-093'ün "12 sa yarım gündür, günlük arz bu tabloda küçük
kalır" model sınırının sayısal karşılığı. Kanal guardsız değil: `tests/gunluk-gorev.test.ts`
aynı mutasyonda kırılıyor (1 test). **Bir sayıyı iki bekçiye birden yazmak yerine, onu ölçen
bekçide bırakmak doğrudur.**
