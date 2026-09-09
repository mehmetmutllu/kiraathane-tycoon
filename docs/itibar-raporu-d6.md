# İtibar raporu — D6 (2026-09-09)

**Soru.** `docs/plan-kat1-yayin.html` §6, İtibar'a (eski XP) şunu yazdı: *"Her seviye
+%2 müşteri akışı, +%1 bahşiş."* İkisi de `economy.config.ts`'e girecek **denge sayısı**dır ve
hiç ölçülmedi. Ama B4 Kat 1'de throughput kolunun **tükendiğini** ölçmüştü. Talep zaten
bağlayıcı değilse planın ödülü hiçbir şey yapmaz — bu bir varsayım olarak değil, tablonun bir
**satırı** olarak kararlaştırılır (D-084 varyant kapısı).

**Araç.** `tools/olcum-itibar.ts` + varyant katmanı `tools/itibar-kollari.ts` · sim kancası
`itibarAyarla` (`tools/simulate.ts`). **`economy.config.ts` DEĞİŞMEDİ.**
Ham çıktı: `docs/olcum-itibar.txt` — **tam koşu** (`OLCUM=tam`, 1 dk 41 sn), damgalar temiz.

---

## §0 Model sınırı — bu turda ölçülen şey bir TÜREV

Sim XP'yi **hiç modellemiyor.** Seviye eğrisi sim durumundan türetilir: servis akışı ×
oyuncu/garson payı (`perTeaServed` / `perWaiterServed`) + `perQuest` × görev + `perPad` × pad
+ `perUpgrade` × yükseltme. Üç sınır, sonuçları okurken geçerlidir:

| # | Sınır | Yönü |
|---|---|---|
| ① | `perDishWashed` **sıfır** sayılır — oyuncunun eliyle bulaşık yıkaması sim'de yok (AFK kurulumu) | eğri gerçeğin **ALT** sınırı |
| ② | Oyuncu/garson payı taşıma **kapasitesi** payından okunur; gerçekte kimin taşıdığı anlıktır | eğri yaklaşık |
| ③ | Seviye atladığı an ödül yürürlüğe girer; gerçekte oyuncu modali kapatana kadar bekler | etki **ÜST** sınır |

③ nedeniyle **üst sınır bile küçükse kol güvenle elenir** — bu turun iki eleme kararı da bu
mantıkla verildi. Ayrıca **SEVİYE kolonu koşu sonuyla kırpılır:** `runProfile` tüm milestone'lar
bitince durur, dolayısıyla zinciri kısaltan bir kol daha az XP biriktirmiş görünür (r2 %5/%10
satırları L12'de görünüyor, oysa birim zamanda taban'dan **hızlı** seviye atlıyor). Seviye
sayıları satırlar arasında doğrudan kıyaslanmaz; kıyas kolonu **d.ŞERİT**tir.

---

## §1 Taban (İtibar ödülü YOK)

| Profil | 20 dk'yı aşan alım | En uzun bekleme |
|---|---|---|
| İdealize (**hüküm**, D-087) | 1 | 23,9 dk → servis L6 |
| Yoğun | 1 | 29,8 dk → servis L6 |
| Normal (gözlem) | 6 | 43,4 dk → servis L6 |
| Rahat | 11 | 68,2 dk → servis L6 |

İlk alım **22 sn** · açılış en uzun **1,6 dk** · otomasyon **6,1 dk** · ŞERİT **8,48 sa** ·
model↔gerçek sapması **%8**. (D-086/D-090 ile birebir aynı taban — dört damga bunu doğruluyor.)

---

## §2 Bulgular

### Bulgu 1 — Gelirin kelepçesi zamanın **%93,0**'ünde TAŞIMADA

Ölçülen darboğaz dağılımı (her tick'te bağlayıcı kol, zamana göre ağırlıklı):

| Profil | taşıma | arz | talep |
|---|---|---|---|
| İdealize | **%93,0** | %5,9 | %1,1 |
| Normal | **%93,0** | %5,9 | %1,1 |

İki profilde de aynı — `eff` geliri ölçekler, hangi kolun bağladığını değiştirmez.
**Bu satır turun geri kalanını açıklıyor.**

### Bulgu 2 — Planın kolu (r1 · talep) ATIL

| doz | d.ŞERİT | ihlal (N/İ) | en uzun |
|---|---|---|---|
| %0,5/sv | %-0,0 | 6/1 | 43,4 dk |
| **%2/sv (planın sayısı)** | **%-0,0** | **6/1** | **43,4 dk** |
| %10/sv | %-0,1 | 6/1 | 43,4 dk |

L13'te ×2,2 talep demek olan **%10/sv dozunda bile** zincir %0,1 kısalıyor, ihlal sayısı hiç
kıpırdamıyor, en uzun bekleme aynen 43,4 dk kalıyor. Talep zamanın yalnız %1,1'inde bağlayıcı
(Bulgu 1) — kola verilen her şey bağlamayan bir tavana gidiyor. **Plan §6'nın "her seviye +%2
müşteri akışı" satırı ölçülebilir bir etkisi olmayan bir sayıdır.**

### Bulgu 3 — Arz kolu (r3) da neredeyse atıl

%10/sv → **%-1,8** ŞERİT, ihlal **6/1 değişmedi**, en uzun bekleme 43,4 dk. Arz üç tavandan
birine dokunuyor ama o tavan zamanın %5,9'unda bağlıyor. Ölçülen etki tamamen açılıştan geliyor
(otomasyon 6,1 → 5,2 dk), geç oyundan değil.

### Bulgu 4 — İki kol işe yarıyor ve verimleri DENK

| doz | r2 (gelir) d.ŞERİT | r6 (taşıma) d.ŞERİT | r2 ihlal | r6 ihlal |
|---|---|---|---|---|
| %0,5/sv | %-4,6 | %-4,5 | 5/1 | 5/1 |
| %1/sv | %-8,7 | %-8,5 | 4/1 | 4/1 |
| %2/sv | %-15,7 | %-15,6 | 3/1 | **3/0** |
| %5/sv | %-31,0 | %-29,6 | 1/0 | 1/0 |
| %10/sv | %-46,0 | %-37,5 | 1/0 | 1/0 |

%5'e kadar iki kol **ayırt edilemiyor** (fark ≤ %1,4 puan). Bu, D-090 Bulgu 13'ün birebir
tekrarı: **tempo tablosu eleme yapar, seçim yapmaz.** Dördü elemek için yeterli, ikisi arasında
karar vermek için değil.

### Bulgu 5 — Ayıran şey AÇILIŞ (D-079 ölçütleri)

| doz | r2 ilk alım | r2 açılış | r2 otom. | r6 ilk alım | r6 açılış | r6 otom. |
|---|---|---|---|---|---|---|
| taban | 22 sn | 1,6 dk | 6,1 dk | 22 sn | 1,6 dk | 6,1 dk |
| %2/sv | 22 sn | 1,5 dk | 5,8 dk | **22 sn** | **1,6 dk** | **6,1 dk** |
| %10/sv | 20 sn | 1,2 dk | 5,0 dk | **22 sn** | **1,6 dk** | **6,1 dk** |

**r6 açılışa hiçbir dozda dokunmuyor** — üç ölçüt de taban değerinde sabit. r2 her dozda biraz
yiyor. Mekanizma ölçülüyor: erken oyunda masa az, **koltuk/döngü** bağlıyor (talep), taşıma
kapasitesi zaten bol; bu yüzden taşıma çarpanı ilk saatte hiçbir şey yapmıyor. Gelir çarpanı ise
ilk saniyeden itibaren her müşterinin ₺'sini büyütüyor.

D4'te `hG` kolu **tam bu ölçütten** elenmişti (otomasyon 6,1 → 1,7 dk). Burada r2'nin bozması
çok daha küçük (%10'da 6,1 → 5,0 dk) ama yönü aynı.

### Bulgu 6 — Yoğunluk: eğri (r5) atlama sayısını belirliyor, tempoyu belirlemiyor

| levelGrowth | ulaşılan seviye | atlama | pencereye düşen |
|---|---|---|---|
| ×1,20 | L23 | 22 | 5 |
| ×1,30 | L18 | 17 | 4 |
| ×1,40 | L15 | 14 | 2 |
| **×1,50 (yürürlükte)** | **L13** | **12** | **3** |
| ×1,70 | L11 | 10 | 1 |
| ×2,00 | L9 | 8 | 1 |

Altı satırın altısında da ŞERİT **8,48 sa**, ihlal **6/1** — eğri ekonomiye hiç dokunmuyor,
yalnız ödülün **kaç kez ödendiğini** belirliyor. Pencereye düşen atlama sayısı büyümeyle
monoton azalıyor (×1,4'teki 2, ızgaranın gürültüsü: atlamalar pencere sınırlarına denk geliyor).

Yürürlükteki eğrinin çizelgesi (Normal profil, 12 sa): L2@0,00 · L3@0,03 · L4@0,05 · L5@0,14 ·
L6@0,26 · L7@0,45 · L8@0,70 · L9@1,13 · L10@1,78 · L11@2,98 · L12@4,64 · **L13@7,08 sa**.
Yani **son beş saatte yalnız bir atlama** var — ödül geç oyunda seyrekleşiyor.

### Bulgu 7 — ÖRTÜŞME düşük: İtibar hedeflerin kopyası DEĞİL

Yürürlükteki eğride pencereye düşen 3 atlamanın yalnız **1'i** bir hedef kademesiyle aynı
pencerede. İki dağılımın **şekli** farklı:

- **Seviye atlamaları** düzgün yayılı, geometrik seyrekleşen (yukarıdaki çizelge).
- **Hedef kademeleri** kümeli — 16 kademe: 0,05 · 0,18 · 0,18 · 0,31 · 0,59 · 0,67 · 2,13 ·
  2,13 · 2,13 · 4,23 · 4,29 · 4,60 · 4,69 · 6,10 · 6,25 · 8,48 sa. (Üçlü kümeler: bir eşik
  grubu aynı anda doluyor.)

Bu, "İtibar'ı ödül kanalı yapmak hedeflerin ikinci bir kopyasını üretir" itirazını **çürütüyor**:
iki kanal farklı anlarda konuşuyor.

### Bulgu 8 — r6 tur kartında YOKTU

Tur kartında dört kanal vardı (talep · gelir · arz · kapı). Darboğaz dağılımı okununca
görüldü ki **hiçbiri gerçek kelepçeye dokunmuyor**: kelepçe %93 taşımada. `r6` ölçüm sırasında
eklendi ve tablonun iki etkili kolundan biri çıktı. Bu D5'in süreç dersinin (D-091 eki) ikinci
kez doğrulanmasıdır: *kolları önceden yazmak gerekli ama yeterli değil; adım 2'nin ilk çıktısı
hangi kolun eksik olduğunu da söyler.*

---

## §3 Günlük görevler — bu tur ÖLÇMEDİ, defter hesabı

Günlük görevin asıl değeri **geri dönüş** (retention); sim'in ölçebileceği bir şey değil ve
12 saatlik pencereye bir günlük döngü sığmıyor. Bu yüzden tempo tablosuna girmedi. Elde olan
defter (plan §6 + yürürlükteki config):

| Kalem | Sayı | Kaynak |
|---|---|---|
| Hedeflerden toplam 💎 | **250** (25 kademe · `diamondByTier` [3·5·8·12·22] × 5 kategori) | `economy.config.ts` — yürürlükte |
| Günlük görev | ≈ **6 💎/gün** (3 görev) | plan §6 — **yazılmadı, ölçülmedi** |
| Usta seviyesi fiyatı | 15 💎 veya 1 reklam | plan §6 — **kod yok** |

Yani 💎 arz/talep dengesi bir **D7 kalemi**dir (elmas kaynak/harcama + Usta katmanı): harcama
tarafı yazılmadan arz tarafını sabitlemek, ölçülemeyen bir sayıyı config'e yazmak olurdu.
D-089'un `h0` hükmü ("💎 tempoya dokunmaz") D7'de bilerek bayatlayacak.

---

## §4 Karar

*(Adım 3 — karar paketi kullanıcıya sunulacak. Bu bölüm commit #1'de BOŞTUR: D-084 sıra kilidi.)*

---

## §5 Bekçi

*(Adım 4'te dolar.)*
