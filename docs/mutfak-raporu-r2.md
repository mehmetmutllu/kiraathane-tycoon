# R2 — MUTFAK YERLEŞİMİ VE ÇARPIŞMA RAPORU (ölçüm)

**Soru:** İlk salonun sol duvarındaki servis tezgâhı ile bulaşık — çizilen gövde ile çarpışma
kutusu aynı yerde mi, hat bitişik mi okunuyor, tezgâhın seviyesi gözle kaç sinyalden okunuyor?

**Kapsam:** kullanıcının 2026-09-16 geri bildiriminden G-35 · G-36 · G-37 · G-38
(`docs/geribildirim-oyun-testi-2026-09-16.md`). **G-39 bu rapora girmez** — denge/kural
dosyasına dokunuyor, kendi varyant kapısına tabi.

**Araç:** `tools/olcum-mutfak-r2.ts` · **ham çıktı:** `docs/olcum-mutfak-r2.txt`
(tam koşu, ızgara 0,02 br, damgalar temiz)
**Kare aracı:** `tools/shot-r2-sol-duvar.mjs` · **kareler:** `docs/gorsel/ss/r2-taban-*.png`

---

## §0 — ÖLÇÜMDEN ÖNCE: KÖK SEBEP KODDA BULUNDU

Dört şikâyetin ilk ikisi tek bir satırdan doğuyor. `kitchenLook.onHatGovdeleri` ön hattın üç
gövdesinin ÇİZİM ölçüsünü çarpışma kutusundan türetiyor — ama **dünya eksenlerinden**:

```ts
const kutu = (x: number, h: readonly [number, number]) => ({ x, hx: h[0], hz: h[1] });
//                                     w = hx × 2 (dünya x)   d = hz × 2 (dünya z)
```

İki çağıranın ikisi de o gövdeyi `place.rot` ile **zaten döndürülmüş** bir grubun içine çiziyor:

```tsx
// Scene.tsx · Stations()
<group position={[p[0], 0, p[2]]} rotation={[0, place.rot, 0]}>  <ServicePoint … /> </group>
// DishSink.tsx
<group position={[pos[0], 0, pos[2]]} rotation={[0, rot, 0]}>    <KayTezgah … /> </group>
```

`rot = 0` olan **arka bant** döneminde iki eksen aynı, fark yok — hattın bugün doğru görünmesinin
sebebi bu. **Sol duvar** döneminde `rot = π/2` ve yerel x dünya z'ye gidiyor: gövde kendi
kutusuna dik çiziliyor.

> **Ders (R1'in birinci dersinin kardeşi):** bir ölçü DÜNYA ekseninde üretilip YEREL eksende
> tüketilirse, hata yalnız dönüşün sıfır olmadığı dönemde görünür. İki dönemden biri doğru
> çalıştığı sürece kimse bakmaz. Bu yüzden R2'nin bekçisi tek dönemi değil **her iki dönemi**
> birden denetlemeli.

---

## §Bulgular

### 1) Sol duvarda gövde kutusuna DİK duruyor — 90°, IoU 0,19 (G-35)

Tam koşu, iki gövdede de aynı şeyi söylüyor:

| dönem | gövde | rot | kutu en×boy | **çizim en×boy** | IoU | açı | oda dışı br² (en fazla) |
|---|---|---|---|---|---|---|---|
| **SOL DUVAR** | tezgâh | π/2 | 1,00 × 3,20 | **3,20 × 1,00** | **0,19** | **90°** | **0,80 (0,79 br)** |
| **SOL DUVAR** | bulaşık | π/2 | 1,00 × 2,00 | **2,00 × 1,00** | **0,33** | **90°** | **0,20 (0,19 br)** |
| ARKA BANT | tezgâh | 0 | 3,20 × 1,00 | 3,30 × 1,00 | 0,97 | 0° | — (bant salon dışı) |
| ARKA BANT | bulaşık | 0 | 2,00 × 1,00 | 2,10 × 1,00 | 0,95 | 0° | — |
| ARKA BANT | garson | 0 | 2,60 × 1,00 | 2,80 × 1,00 | 0,93 | 0° | — |

"90 derece" kullanıcının abartısı değil, **tam sayı**: uzun eksen doğru eksenin dikinde.
Yan etkisi de ölçülü — tezgâh 3,20 br boyuyla duvara dik uzandığı için arka ucu **duvarı
0,79 br deliyor** (0,80 br² gövde odanın dışında kalıyor).

**Arka bant dönemi sağlam** (IoU 0,93-0,97). Aradaki 0,03-0,07 fark kusur değil, S4'ün bilinçli
birleştirmesidir (`onHat` her gövdeyi komşusuyla arasındaki boşluğun ortasına kadar uzatır).

### 2) Çizilen tezgâhın beşte biri YÜRÜNEBİLİR, kutusunun üçte ikisi GÖRÜNMEZ (G-36)

Aynı ızgarada (0,02 br), oyuncunun başlangıç noktasından taşma-doldurmayla:

| dönem | gövde | çizim br² | **GEÇİLEN br²** | % | **GÖRÜNMEZ br²** | % |
|---|---|---|---|---|---|---|
| **SOL DUVAR** | tezgâh | 3,20 | **0,62** | **%19,4** | **2,20** | **%68,7** |
| **SOL DUVAR** | bulaşık | 2,00 | 0,02 | %1,0 | **1,00** | **%50,0** |
| ARKA BANT | tezgâh | 3,30 | 0,00 | %0,0 | 0,00 | %0,0 |
| ARKA BANT | bulaşık | 2,10 | 0,00 | %0,0 | 0,00 | %0,0 |
| ARKA BANT | garson | 2,80 | 0,00 | %0,0 | 0,00 | %0,0 |

İki ayrı kusur, tek kök:
- **GEÇİLEN** — kullanıcının gördüğü şey. Tezgâhın gövdesinin **%19,4**'ünün içinden gerçekten
  yürünüyor (bulaşıkta %1,0: onun çizimi şişirilmiş katının gölgesinde kalıyor, yani bulaşığın
  şikâyeti saf görsel).
- **GÖRÜNMEZ** — kullanıcının henüz söylemediği ama aynı kökten gelen şey: kutunun **%68,7**'sinde
  hiçbir gövde çizilmiyor. Orada oyuncu boş zemine çarpıyor.

`geçilen = 0,62` sayısının `çizim = 3,20` kadar olmamasının sebebi oyuncunun 0,47 br'lik gövde
yarıçapıdır: kutunun şişirilmiş hâli çizimin ortasını kapatıyor, taşan uçları kapatmıyor.

### 3) Başlangıçta iki gövde arasında 3,20 br boşluk var (G-37)

Hattın uzun ekseni sol duvarda z'dir. Kollar ve **her kolun bedeli**, aynı ızgarada:

| kol | hat boşluğu | **GEÇİLEN br²** | **GÖRÜNMEZ br²** | notu |
|---|---|---|---|---|
| **T** taban | **3,20** | 0,64 | 3,20 | bugünkü hâl |
| **A1** tek başına | **1,60** | **0,00** | **0,00** | boşluk kalır, oyuncu (eşik 0,94) içinden geçer |
| **A1 + B1** birleşme | **0,00** | **0,66** | 0,00 | hat kesintisiz ama dolgunun katısı YOK |
| **A1 + B2** yanaşma | **0,00** | **0,00** | **0,00** | kutu da taşınır; 3 ankraj noktası oynar |

**B1 bedava değil.** `onHat` boşluğu ÇİZİMLE doldurur, kutuya dokunmaz (tasarımı böyle: arka
bantta doldurduğu boşluklar 0,20 br). Sol duvarda boşluk 3,20 br olduğu için aynı kural
**0,66 br² yeni yürünebilir gövde** üretir — yani G-37'yi kapatırken G-36'yı kısmen geri getirir.

**B2'nin bedeli koordinattır, sayı değil.** Bulaşık 1,60 br kuzeye kayar (z 10,60 → 9,00) ve
yanında duran üç nokta da taşınmak zorunda kalır:

| nokta | bugünkü z | bulaşığa mesafe |
|---|---|---|
| `dishwasherHome` (bulaşıkçının postası) | 12,60 | 2,00 br |
| `waiterHome` (garson sırası başı) | 8,60 | 2,00 br |
| `staffWalk.b` (çaycı yolunun ucu) | 11,40 | 0,80 br |

Üçü de bulaşığın YENİ kutusunun (z ∈ [8,00 … 10,00]) dışında kalıyor, yani hiçbiri kutunun
içine düşmüyor — ama `waiterHome` yeni kutuya 0,60 br kalıyor ve `staffWalk` bulaşığın önünden
geçiyor. B2 seçilirse bu üç nokta aynı turda gözden geçirilmeli.

### 4) Son yükseltme basamağı HİÇBİR görsel sinyal vermiyor (G-38)

`ServicePoint.tsx`in görsel sabitleri kaynaktan okundu (damgalı). Bir basamağın "ayırt edilir"
sayılması için renk farkının ~30 eşiğini geçmesi ya da kimlik/ürün değişmesi gerekir; gövde
yüksekliğinin sabit 0,12 br'lik adımı tek başına sayılmadı (oyuncu kamerasında piksel düzeyinde).

| L→L+1 | gövde Δ | semaver renk Δ | kapak renk Δ | kimlik | tost | **sinyal** |
|---|---|---|---|---|---|---|
| L0→L1 | 0,12 | 59 ✓ | 54 ✓ | — | — | 2 |
| L1→L2 | 0,12 | 74 ✓ | 81 ✓ | — | — | 2 |
| L2→L3 | 0,12 | 40 ✓ | 90 ✓ | — | — | 2 |
| L3→L4 | 0,12 | 133 ✓ | 85 ✓ | **TEZGÂH** | — | **3** |
| L4→L5 | 0,12 | 38 ✓ | 0 ✗ | — | **TOST** | 2 |
| **L5→L6** | 0,12 | **0 ✗** | **0 ✗** | — | — | **0** |

**L6 boş basamak.** Hem semaver hem kapak dizisi 6 üyeli ve `Math.min(level, uzunluk − 1)` ile
kelepçeleniyor; L5 zaten son üyeye varıyor, L6'da hiçbir şey değişmiyor. Yani oyunun **en pahalı
yükseltmesi (9.000 ₺, geç-oyunun ana para emicisi)** ekranda hiçbir iz bırakmıyor.

Bağlam, G-38'in asıl ağırlığını buraya koyuyor:

> **SOL DUVAR döneminde mutfak odası hiç çizilmiyor** (`Scene.BackBand`: `areasOpen < 3 → null`).
> S22'nin kademe merdiveni — odanın L1'den L6'ya büyüyen tezgâh zincirleri, adalar — o dönemde
> ekranda **yok**. L0-L3 boyunca oyuncunun gördüğü tek yükseltme yüzeyi bu tek gövdedir ve o
> gövdede basamak başına 2 sinyal vardır: semaverin rengi ve kapağın rengi. İkisi de aynı
> objenin aynı bölgesinde, ikisi de yalnız RENK.

Bu, `feedback_upgrade_legibility`'nin doğrudan ihlalidir: *"tek sinyal yetmez, çoklu redundant
sinyal"* ve *"renk sadece ÜST yüzey"*. Bugün elde iki sinyal var ama ikisi de aynı türden (renk),
biri de (gövde yüksekliği) sayılamayacak kadar küçük.

---

## §Kareler

| önce | sonra |
|---|---|
| `ss/r2-taban-plan.png` · `ss/r2-taban-hat.png` | `ss/r2-son-plan.png` · `ss/r2-son-hat.png` |
| `ss/r2-taban-tezgah.png` · `ss/r2-taban-bulasik.png` | `ss/r2-son-tezgah.png` · `ss/r2-son-bulasik.png` |
| — | `ss/r2-son-seviye-L0.png` · `-L3.png` · `-L6.png` (C2'nin merdiveni, tek kadraj) |

Kuşbakışı kare kusuru en açık gösteren kadraj: önce tezgâh ve bulaşık sol duvara **paralel değil
dik** duruyor ve aralarında geniş bir boşluk var; sonra ikisi duvara yaslanmış tek bir banko.

---

## §Karar — D-127

Kullanıcı 2026-09-16, karar paketi (https://claude.ai/artifact/WYbL5mcuqcchywVLy3QrFY) üzerinden:

| kalem | seçilen kol | elenen |
|---|---|---|
| G-35 · G-36 | **A1** — çizim kutuya uyar (ölçü yerel eksene çevrilir) | **A2** (kutuyu çizime döndür): kullanıcının kendi cümlesi *"sol duvara paralel olması gerekir"* diyor, A2 tam tersini kalıcılaştırırdı. Sorulmadı, gerekçesiyle elendi. |
| G-37 | **B2** — bulaşık KUTUSUYLA BİRLİKTE tezgâha yanaşır | **A1 tek başına** (1,60 br boşluk kalır) · **B1** (boşluğu yalnız çizimle doldurur, 0,66 br² yürünebilir gövde üretir) |
| G-38 | **C2** — her basamağa renk DIŞI bir biçim işareti | **C1** (yalnız boş basamağı doldur, sinyal yine tek türden) · **C3** (mutfak odasını erken döneme getir — kendi turunu ister) |

---

## §Uygulama

**A1 — `kitchenLook.onHatGovdeleri`.** Ölçü artık yerel eksende teslim ediliyor: dönüş eksenleri
takas ediyorsa yarı-boyutlar da takas edilir ve hattın uzun ekseni yerel x'e çevrilir. Eksen
sözleşmesi `yerelKutu()` olarak DIŞARI alındı (gerekçe §Bekçi). **Kutulara dokunulmadı** —
`activeSolids` R2 öncesiyle birebir aynı.

**B2 — `layout.PLACE_LEFT_WALL`.** Bulaşığın z'si elle yazılı 10,60 değil artık TÜREMİŞ:
`SOL_DUVAR_TEZGAH_Z + SOL_DUVAR_TEZGAH_HZ + SOL_DUVAR_BULASIK_HZ = 9,00`. Yarı-derinlikler
değişirse bitişiklik kendiliğinden korunur. Bulaşıkla birlikte taşınanlar (hepsi türemiş):
`dishwasherHome` (bulaşığın 2,0 br kuzeyi) · `staffWalk.a`/`b` (hattın iki ucu) ·
`LAYOUT.padPos.dishwasher` (bulaşığın tam yanı — pad hedefin konumundadır).

> **Ölçümde olmayan dördüncü ankraj:** karar paketi üç nokta saymıştı (`dishwasherHome` ·
> `waiterHome` · `staffWalk`); bulaşıkçı PAD'i listede yoktu çünkü araç yalnız `ServicePlace`in
> içindeki noktaları geziyordu. Pad eski z'sinde bırakılsaydı boş zemini işaretliyor olurdu, o
> yüzden B2'nin parçası olarak taşındı ve bekçiye kondu. Aracın kapsamı da genişletilmedi —
> genişletilmesi gereken yer bu değil, **ankraj listesinin nereden türediği**; not §Açık uçlarda.

**C2 — `kitchenLook.SERVIS_ISARETLERI` + `ServicePoint.tsx`.** Dört yeni biçim işareti
(`tepsi@L1` · `bardakIstifi@L2` · `surahi@L3` · `ikinciSemaver@L6`) ve kodda zaten çizilen ama
hiçbir yerde SAYILMAYAN bir beşincisi (`ikinciPres@L6`, eskiden düz bir `level >= 6` koşuluydu).
Liste hem eşiği hem KONUMU taşıyor: ilk yazımda koordinatlar bileşende, bekçinin kopyası testte
duruyordu — yani bir eşyayı kaydırmak bekçiyi hiç uyandırmıyordu.

Yerleşim karede düzeltildi: üç işaret önce kuzey ucundaki 0,70 br'lik boşluğa sığdırılmıştı ve
ilerleme gibi değil **kalabalık** gibi okunuyordu; tablanın iki serbest ucuna dağıtıldılar.

### Sonuç (final tam koşu — `docs/olcum-mutfak-r2.txt`)

| ölçü | önce | sonra |
|---|---|---|
| sol duvar tezgâh IoU / açı | 0,19 / **90°** | **1,00 / 0°** |
| sol duvar bulaşık IoU / açı | 0,33 / **90°** | **1,00 / 0°** |
| çizimin içinde yürünen (tezgâh) | 0,62 br² (%19,4) | **0,00 br²** |
| görünmez duvar (tezgâh) | 2,20 br² (%68,7) | **0,00 br²** |
| gövde odanın dışında | 0,80 br² (0,79 br) | **0,00 br²** |
| hat boşluğu | 3,20 br | **0,00 br** |
| basamak başına sinyal | 3 · 3 · 3 · 3 · 2 · **0** | 3 · 3 · 3 · 3 · 2 · **2** |
| bunun BİÇİM olanı | 0 · 0 · 0 · 1 · 1 · **0** | 1 · 1 · 1 · 1 · 1 · **2** |
| arka bant (üçü) | 0,93-0,97 · geçilen 0,00 | **değişmedi** |

---

## §Bekçi

`tests/mutfak-r2.test.ts` — **25 denetim**, mutasyonla doğrulandı:
`node tools/mutasyon-mutfak-r2.mjs` → **17 mutasyon, kaçan 0**.

**Her denetim İKİ DÖNEMİ birden gezer.** Tek dönemi denetleyen bir bekçi, bu kusurun tam olarak
kaçtığı bekçidir: `rot = 0` tarafı S3'ten R2'ye kadar hep yeşil yandı.

**İlk turda İKİ mutasyon KAÇTI ve kodun zayıf yerini gösterdi.** M2 ve M4 eksen sözleşmesinin
uzun-eksen koordinatını bozuyordu; ikisi de yakalanmadı çünkü **o dal canlı kodda ölü**:
birleştirme yalnız garson istasyonu sahnedeyken olur, o da yalnız `rot = 0` döneminde — yani
"dönmüş hat + birleştirme" bileşimi bugün hiç koşmuyor. Sözleşme `yerelKutu()` olarak dışarı
alındı ve bekçi onu DOĞRUDAN koşturuyor (iki gövde, bir boşluk, dünyaya geri taşıma): gövdeler
kendi taraflarında kaldı mı, dış kenarlar yerinde mi, dikiş boşluğun ortasında mı. B1 (erken
birleşme) bir gün açılırsa kural sessizce yanlış çalışmayacak.

**`tests/olcu-donduruldu.test.ts` iki dondurulmuş ölçüyü yakaladı** (`servis.solDuvar.bulasik` ve
`pad.bulasikci`) — dondurma testinin işi tam bu: değişikliği bilinçli yapmaya zorlamak. İkisi de
D-127 referansıyla güncellendi.

---

## §Açık uçlar

1. **Ankraj listesi hâlâ elle:** bulaşığa bağlı noktalar (`dishwasherHome` · `staffWalk` · pad)
   bugün tek tek türetiliyor. Bir dördüncüsü eklenirse ne araç ne bekçi kendiliğinden görür —
   pad'in ölçümde çıkmaması bunun küçük provasıydı. Yapısal çözüm: bir gövdeye "bağlı noktalar"
   ilanı ve hepsinin tek yerden türemesi. Bu turda yapılmadı.
2. **Semaverin boyu L6'da 1,42 br** (`0,70 + L × 0,12`). Karede (`ss/r2-son-seviye-L6.png`) tezgâhın
   üstünde baskın duruyor. R2 öncesinden gelen bir davranış, kullanıcı şikâyet etmedi, bilerek
   dokunulmadı — bir sanat turunun kalemi.
3. **C3 (mutfak odasını erken döneme getir) duruyor.** Ölçüm sol duvar döneminde odanın hiç
   çizilmediğini yazdı; kullanıcı C2'yi seçti. C3 bandın erken çizilmesini, dolayısıyla
   duvar/kamera/kelepçe kararlarını açar — kendi turunu ister.
