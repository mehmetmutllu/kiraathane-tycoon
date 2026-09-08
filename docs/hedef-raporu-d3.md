# D3 — Hedefler (koleksiyon): ödülün tempoya etkisi

**Tur:** Faz D · D3 · 2026-09-08 · varyant kapısı (D-084) devrede
**Araç:** `tools/hedef-kollari.ts` (varyant katmanı) + `tools/olcum-hedefler.ts` (tarayıcı)
**Ham çıktı:** `docs/olcum-hedefler.txt` (tam koşu) · damgalar `docs/olcum-hedefler.damga.txt`
**Model:** D-086 yürürlükteki model (`k1b` + `k2`) · `economy.config.ts` bu tur **DEĞİŞMEDİ**

---

## 1. Soru

Hedeflerin (koleksiyon sistemi, plan §6) ödülü **₺ içermeli mi, hangi dozda?**

Bu bir denge sorusudur: hedef ödülü `economy.config.ts`'e girecek yeni bir ₺ akışıdır ve
görev hattının M1 ödüllerinin üstüne biner. Kapı gereği önce ölçülür.

Sorunun ikinci yarısı D1'den devralındı. D-087 kapanırken şu yazılmıştı:

> **Faz D bitince yeniden okunacak ölçüm:** meta katman geç-oyun bekleme pencerelerini gerçekten
> dolduruyor mu — `tools/olcum-gec-oyun.ts` hazır, elenen kolların kodu duruyor.

D1'de ölçülen dokuz düzeltici kolun **hepsi** elenmişti; ortak gerekçe şuydu: ihlali kapatıyorlar
ama karşılığında Kat 1 içeriğinden **%7-42** götürüyorlardı. Hedef ödülü de bir ₺ kaldıracıdır —
yani aynı sınavı vermek zorundadır. Bu turun eleme ölçütü D1'inkiyle **birebir aynı**: zinciri
kısaltarak alınan iyileşme, iyileşme sayılmaz.

## 2. Zeminde ne vardı

Faz E1'de arayüz iskeleti kurulurken `GoalsSheet` ("Hedefler") ve `RewardModal` (ortak ödül
ekranı) **bileşen olarak** yazılmıştı. Ama:

| | Bugünkü hâl |
|---|---|
| Eşikler | HUD'a **gömülü** (`500` · `200` · `1_000_000`) — CLAUDE.md "sayı koda gömme" ihlali |
| Kademe | Yok — kategori başına tek eşik |
| Ödül | Yok (`"Hedef ödülleri bir sonraki güncellemede toplanabilir olacak."`) |
| Toplama | Yok — dört durumun (kilitli · ilerliyor · toplanabilir · toplandı) hiçbiri yok |
| Elmas | Store'da ve kayıtta var, HUD'da görünür — ama **hiçbir kaynağı ve harcaması yok** |

Yani D3'ün işi sıfırdan bir ekran çizmek değil; **var olan ekranı gerçek bir sisteme bağlamak.**
Bu raporun cevapladığı tek soru o sistemin ₺ tarafıdır.

## 3. Yöntem

### 3.1 Kollar (`tools/hedef-kollari.ts`)

`economy.config.ts` dosyasına dokunulmadı. Kollar, `simulate.ts`'e bu turda eklenen **hedef-akışı
kancasına** takılır ve koşu sonunda geri alınır — `denge-kollari.ts`'in D1'de kullandığı sözleşmenin
aynısı, farkı hiçbir config alanına yazmaması.

| Kol | Ne ölçüyor | Doz |
|---|---|---|
| **h0** | Hedefler **yalnız 💎** verir, ₺ akışı yok | — (atıl beklenir) |
| **hA** | **Kazanç** eşikleri (1k · 5k · 25k · 100k · 300k · 1M ₺) · ödül = eşik × doz | oran |
| **hB** | **Mekân** eşikleri (3 · 6 · 10 · 14 · 18 · 24. pad) · ödül = o pad'in maliyeti × doz | oran |
| **hC** | hA + hB **birlikte** (plan §6: iki kategori de ₺ verir) | oran |
| **hD** | **YOĞUNLUK**: toplam ödül SABİT, kademe **sayısı** doz | adet |

**hD neden sonradan eklendi:** ilk üç kolun ortak bulgusu, ödülün *büyüklüğünü* artırmanın 20 dk'yı
aşan pencerelerin içine düşen ₺'yi artırmadığıydı — altı kademe, altı pencereyle örtüşmüyordu. Yani
asıl kaldıraç "ne kadar" değil "kaç tane" olabilirdi. hD tam onu ayırır: toplam sabit, tek değişken
yoğunluk. Plan §6 zaten ~30 hedef diyor; bu kol o sayının tempo karşılığını ölçer.

### 3.2 Okunan beş kolon

Beşi birden okunmadan karar verilemez — bu turun tuzağı tam olarak tek kolona bakmaktır:

1. **ÖDENEN** — Normal profil koşusunda hedeflerden düşen toplam ₺ (12 sa penceresi).
2. **PENCERE** — bunun **20 dk'yı aşan bekleme aralıklarının içine** düşen kısmı. Asıl soru budur:
   toplam büyük ama hepsi ilk saatte düşüyorsa geç-oyun pencereleri boş kalır.
3. **İHLAL (N/I)** — 20 dk'yı aşan alım sayısı. **Hüküm İdealize profilde** (D-087), Normal
   gözlem bandıdır.
4. **ŞERİT / d.ŞERİT** — zincirin uzunluğu ve tabana göre kısalması → **D1'in eleme ölçütü**.
5. **AÇILIŞ** — D-079'un üç ölçütü (ilk alım < 90 sn · açılış enUzun ≤ 2 dk · otomasyon < 15 dk):
   ödül erken oyuna sızıp açılışı bozuyor mu.

### 3.3 Modelin sınırları (karar bunları bilerek verilmeli)

- **Ödül anında cüzdana geçer sayılır.** Gerçekte oyuncu paneli açıp "Al"a basana kadar bekler →
  buradaki etki bir **ÜST SINIR**dır. Üst sınır bile küçükse kol güvenle elenir; büyükse
  gecikmenin kendisi ayrıca konuşulmalıdır.
- **Beş kategorinin ikisi ölçüldü.** Sim'de karşılığı olan Kazanç ve Mekân ölçüldü. *Servis*
  kategorisi kümülatif servisle, yani lifetime ile neredeyse monoton aynı şeydir — ayrı kol olarak
  ölçmek hA'nın zamanlamasını tekrarlardı (C5'in `k4` dersi: yapısal olarak sıfır çıkacak kol
  ölçülmez, gerekçesi yazılır). *Usta* D5'e bağlı, *Alışkanlık* gün-temelli — ikisi de tek oturum
  simülasyonunda tanımsız.
- **Ödül `lifetime`'a da eklenir.** Sim bunu görev ödülüyle aynı şekilde yapar; oyunun kendi
  kodunda da öyledir (`tick.ts:1281-1282`) — yani hA'nın kendini besleme etkisi model uydurması
  değil, oyunun gerçek davranışıdır.

### 3.4 Damgalar

Araç ilk koşusunda **kendi hatasını yakaladı**: kanca kapalıyken ödeme kaydı bir önceki koştan
kalıyordu ve taban satırına ait olmayan bir "ödenen" sayısı basıyordu (`taban odeme yok` damgası
kırıldı). `odemeleriSifirla()` ile düzeltildi. Yürürlükteki damgalar:

- `h0 ATIL kaldi (beklenen)` — farkı değil **aynılığı** arar. D5'te elmas tempoya bağlanırsa bu
  damga kırılır ve buradaki hüküm yeniden okunmak zorunda kalır.
- `hX (en uc doz)` — varyant parmak izi tabandan farklı mı (C4 tuzağı ②).
- `hX odeme dustu` — kanca gerçekten tetiklendi mi. D1'de `iade:0.25` varyantı tam bu şekilde hiç
  tetiklenmemiş ve rapora sahte bir "fark yok" satırı girmişti.
- `taban geri donusu` · `taban odeme yok` · `taban ihlal 6 (Normal)` · `taban hukum 1 (Idealize)` —
  son ikisi bu turun sayılarını D-086 Bulgu 7 ve D-087 ile aynı zemine bağlar.

---

## 4. Bulgular

*(tam koşu — `docs/olcum-hedefler.txt` · damgalar temiz)*

**TABAN:** ilk alım 22 sn · açılış enUzun 1,6 dk · otomasyon 6,1 dk · ŞERİT **8,48 sa** ·
ihlal **6/1** (Normal/İdealize) · en uzun bekleme **43,4 dk → `servis L6`** · model sapması %8.

| kol | doz | ÖDENEN | PENCERE | ihlal N/I | en uzun | ŞERİT | d.ŞERİT |
|---|---|---|---|---|---|---|---|
| **taban** | — | 0 | 0 (0) | 6/1 | 43,4 dk | 8,48 sa | %0,0 |
| **h0** | — | 0 | 0 (0) | 6/1 | 43,4 dk | 8,48 sa | **%0,0** |
| hA | %0,5 | 655 | 25 (1) | 6/1 | 43,4 dk | 8,45 sa | %-0,4 |
| hA | %1 | 1k | 0 (0) | 5/1 | 43,4 dk | 8,41 sa | %-0,8 |
| hA | %5 | 7k | 0 (0) | 5/1 | 43,4 dk | 8,16 sa | %-3,8 |
| hA | %10 | 13k | 0 (0) | 5/1 | 43,4 dk | 7,84 sa | %-7,6 |
| hA | %20 | 26k | 0 (0) | 5/1 | 43,4 dk | 7,26 sa | %-14,3 |
| hA | %50 | 66k | 0 (0) | 4/**0** | **28,2 dk** | 5,99 sa | **%-29,4** |
| hB | %5 | 1k | 125 (1) | 6/1 | 43,4 dk | 8,42 sa | %-0,7 |
| hB | %20 | 4k | 500 (1) | 6/1 | 43,4 dk | 8,23 sa | %-2,9 |
| hB | %50 | 10k | 1k (1) | 6/1 | 43,4 dk | 7,87 sa | %-7,2 |
| **hD** | **6 kademe** | 4k | 0 (0) | 5/1 | 43,4 dk | 8,10 sa | %-4,5 |
| **hD** | **10 kademe** | 7k | 384 (1) | 4/1 | 43,4 dk | 7,98 sa | %-5,9 |
| **hD** | **16 kademe** | 7k | **2k (3)** | 6/1 | **38,1 dk** | 7,95 sa | %-6,3 |
| **hD** | **24 kademe** | 9k | **2k (3)** | 4/1 | **39,9 dk** | 7,91 sa | **%-6,8** |
| **hD** | **40 kademe** | 8k | 1k (**5**) | 4/1 | **38,9 dk** | 7,88 sa | %-7,1 |
| hC | %5 | 8k | 125 (1) | 5/1 | 43,4 dk | 8,09 sa | %-4,6 |
| hC | %20 | 30k | 500 (1) | 5/1 | 43,4 dk | 7,02 sa | %-17,3 |
| hC | %50 | 76k | 0 (0) | 4/**0** | **28,2 dk** | 5,37 sa | **%-36,7** |

*(ara dozlar — hA %2, hB %0,5/%1/%2/%10, hC %0,5/%1/%2/%10 — ham çıktıda; eğri monoton, tabloya
karar için gereken uçlar alındı.)*

### Bulgu 1 — `h0` tabanın BİREBİR kopyası: elmas ödülü tempoya dokunmuyor

Parmak izi tabanla aynı (damga `h0 ATIL kaldi (beklenen)` geçti). Bu bir "fark yok" satırı değil,
**yapısal bir sonuç**: elmasın bugün hiçbir harcaması yok (`masterLevel`/`masterDiamondCost`
yazılmış ama seviye kelepçesi önlerini kesiyor), dolayısıyla elmas ödülü ekonomiye hiçbir kanaldan
giremiyor. D5 Usta katmanı elması harcanabilir yaptığı anda bu damga kırılacak ve buradaki hüküm
yeniden okunmak zorunda kalacak — damga bilerek öyle yazıldı.

### Bulgu 2 — Ödülün BÜYÜKLÜĞÜ bekleme penceresini doldurmuyor

`hA`'nın hiçbir dozunda (%0,5'teki sembolik 25 ₺ dışında) 20 dk'yı aşan pencerelerin **içine**
ödeme düşmüyor. `hA %50`'de 66.000 ₺ ödense bile PENCERE **0**. İhlal 6 → 4'e iniyor ama bunun
sebebi pencerenin dolması değil, **zincirin toptan hızlanması** — ve bedeli **%29,4** zincir
kısalması, yani D1'in elediği dokuz kolun (%7-42) tam ortası.

Sebep yapısal: altı kademe, altı pencereyle örtüşmüyor. Ödül eşikleri oyuncunun *ilerlemesine*
bağlı; uzun bekleme aralıkları ise tam olarak **ilerlemenin durduğu** yerler — yani ödül oraya
tanımı gereği düşmüyor.

### Bulgu 3 — `hB` (Mekân) neredeyse bedava ama neredeyse etkisiz

%50 dozda bile ihlal **6'da sabit**; zincir yalnız %7,2 kısalıyor. PENCERE'ye bir ödeme düşüyor,
ama o da pencerenin **sonuna**: mekân eşiği pad açılışına bağlı, pad açılışı ise boşluğu BİTİREN
olay. Yani ödül beklerken değil, bekleme bittikten sonra geliyor. Tempo kaldıracı olarak
kullanılamaz — ama bedeli de yok (%0,5-%5 dozda d.ŞERİT %-0,1 … %-0,7).

### Bulgu 4 — Asıl kaldıraç YOĞUNLUK, büyüklük değil (bu turun ana bulgusu)

`hD` toplam ödülü sabit tutup yalnız kademe sayısını değiştirir. Sonuç:

| | ihlal 6 → 4 için | zincir bedeli |
|---|---|---|
| Büyüklük kolu (`hA`) | %50 doz · 66.000 ₺ | **%-29,4** |
| Yoğunluk kolu (`hD`) | 24 kademe · 9.000 ₺ | **%-6,8** |

**Yoğunluk aynı iyileşmeyi ~4 kat ucuza alıyor.** Dahası, *en uzun beklemeyi* kısaltan tek kol
ailesi budur: 43,4 → **38,1-39,9 dk** (hA/hB/hC hiçbir makul dozda 43,4'ün altına inemiyor;
inebildikleri tek yer %29-37 zincir bedelli %50 dozları). PENCERE'ye düşen ödeme sayısı
kademe sayısıyla birlikte artıyor: 6 kademe → 0 · 16 kademe → 3 · 40 kademe → **5**.

Plan §6'nın "~30 hedef" sayısı bu ölçümle örtüşüyor: 24-40 bandı, hem PENCERE'ye düşmenin
başladığı hem zincir bedelinin %7'de düzleştiği yer.

### Bulgu 5 — İhlal SAYISI gürültülü ölçüt, "en uzun bekleme" kararlı

`hD` ihlal sütunu monoton değil: 10 kademe → 4, 16 kademe → **6**, 24 kademe → 4. Sebebi ölçütün
kendisi: ödül bir alımı öne çekince komşu boşlukların sınırları kayıyor ve 20 dk'nın iki yanında
gezinen bir boşluk sayıyı bir aşağı bir yukarı oynatıyor. **Karar bu sütuna değil, `en uzun` ve
`d.ŞERİT` sütunlarına bakılarak verilmeli** — ikisi de her kolda monoton.

### Bulgu 6 — Açılış hiçbir kolda bozulmadı

İlk alım **22 sn** · açılış enUzun **1,6 dk** · otomasyon **6,1 dk** — 37 satırın hepsinde
değişmedi (D-079'un üç ölçütü: < 90 sn · ≤ 2 dk · < 15 dk ✓). En düşük kazanç eşiği 1.000 ₺,
garson ise 6,1 dk'da alınıyor: hedef ödülü erken oyuna yapısal olarak sızamıyor.

### Bulgu 7 — HÜKÜM zaten geçiyordu; bu tur onu değiştirmiyor

İdealize profil (D-087'nin hüküm profili) her satırda **1** — yani ölçüt taban hâliyle geçiyor ve
hedef ödülüne *ölçüt için* ihtiyaç yok. Değişebilen tek şey Normal profilin **gözlem bandındaki**
43,4 dk. D-087 o bandı bilerek ödenmemiş bir bedel olarak kayda geçirmişti; bu tur onun
kapatılabilir olup olmadığını değil, **kaça kapatılabileceğini** ölçtü.

### Bulgu 8 (araç) — damga kendi hatasını yakaladı

İlk koşuda `taban odeme yok` damgası kırıldı: kanca kapalıyken ödeme kaydı bir önceki koşudan
kalıyor ve **taban satırına 75.615 ₺ ödenmiş gibi** basıyordu. Bu, tablonun taban satırını
tamamen yalan yapardı. `odemeleriSifirla()` ile düzeltildi — D-084 P2'nin damga yatırımı bu turda
üçüncü kez gerçek bir kusur buldu.


---

## 5. Karar

<!-- BOŞ — karar paketi kullanıcıya sunulduktan sonra doldurulur (D-084 §3.2: commit #1'de bu
     bölüm BOŞ olmak zorundadır). -->
