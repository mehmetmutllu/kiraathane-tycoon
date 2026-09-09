# Elmas raporu — D7a (2026-09-09)

**Soru.** Elmas bugün **kazanılıyor** (hedeflerden 250 💎) ama **harcanamıyor** — sink sıfır.
D3'ün `h0` kolu "💎 tempoya girmez" sonucunu tam bu yüzden vermişti (D-089) ve D7 o ölçümü
bayatlatıyor. D7 hem harcamayı (**Usta katmanı**) hem ek arzı (**günlük görev**) getiriyor; ikisi
de `economy.config.ts`'e girecek denge sayısıdır ve hiçbiri ölçülmedi. Plan §6 *"hiç reklam
izlemeyen ~2,5 günde bir Usta alır"* diyor; oysa 250 💎, planın 15 💎'lık fiyatında **16 Usta**
demek. Kuyruk daha doğmadan çöküyor mu — ve planın *"üstüne ×2"*si zinciri ne kadar yiyor?

**Tur bölünmesi.** D7 kullanıcı kararıyla ikiye ayrıldı: **D7a = ölçüm** (bu rapor) ·
**D7b = UI** (Usta paneli + günlük görev kartları). Bu turda hiçbir arayüz yazılmadı.

**Araç.** `tools/olcum-elmas.ts` + varyant katmanı `tools/usta-kollari.ts` · sim kancası
`ustaAyarla` (`tools/simulate.ts`). **`economy.config.ts` DEĞİŞMEDİ.**
Ham çıktı: `docs/olcum-elmas.txt` — **tam koşu** (`OLCUM=tam`), damgalar temiz.

**Kancanın kendi denetimi.** Kanca eklendikten sonra D6'nın tam koşusu (`docs/olcum-itibar.txt`)
yeniden üretildi ve **birebir aynı** çıktı — yani `ustaAyarla` kapalıyken sim'in davranışı zerre
kadar değişmiyor. Tablodaki `eKAPI` satırı bunun koşu içindeki ikinci kanıtı.

---

## §0 Model sınırı — bu turda ölçülen şey bir TÜREV

Sim elması **hiç modellemiyor.** Arz sim durumundan türetilir: `kademeAkisi()` hangi hedef
kademesinin ne zaman açıldığını verir, `goals.diamondByTier` o kademenin 💎'ını söyler; günlük
görev arzı sürekli akış olarak eklenir. Beş sınır, sonuçları okurken geçerlidir:

| # | Sınır | Yönü |
|---|---|---|
| ① | Pencere **12 sa** = yarım gün; günlük görev gün ölçeğindedir | `e5` tanım gereği küçük → §5 defter |
| ② | Ödüllü reklam ve IAP arzı **yok** sayılır | arz **ALT** sınır |
| ③ | Usta hedefleri: servis (1) + masa (20) + personel (5) = **26**, planla örtüşüyor | — |
| ④ | Oyuncu 💎'ı biriktiği **anda** harcar (personel → servis → masa) | etki **ÜST** sınır |
| ⑤ | Personel Usta'sı taşımaya orantılı biner; gerçekte mıknatıs para toplamaya, bulaşıkçı yıkamaya biner | `e6X` **ÜST** sınır |

②+④ birleşince kural şu olur: **üst sınır bile küçükse kol güvenle elenir** — bu turun iki eleme
kararı da bu mantıkla verildi.

**Tabanın seçimi.** D6 kendi kanalını yalıtmak için hedef çarpanını kapatmıştı. D7'de soru bir
**içerik kuyruğu** sorusudur ve kuyruk ₺ merdiveninin bittiği yerde başlar — bu yüzden taban
**bugünkü dünyadır**: D-090'ın kalıcı çarpanı (`hUYGF`) ve D-092'nin taşıma ödülü (`rUYG`)
**açık**. Kapalı bir dünyada ölçmek tavana varış zamanını olduğundan geç gösterirdi.

---

## §1 Taban (Usta katmanı YOK)

| Profil | 20 dk'yı aşan alım | En uzun bekleme |
|---|---|---|
| İdealize (**hüküm**, D-087) | **0** | 19,0 dk → servis L6 |
| Yoğun | 1 | 23,6 dk → servis L6 |
| Normal (gözlem) | 2 | 33,8 dk → servis L6 |
| Rahat | 9 | 52,2 dk → servis L6 |

İlk alım **22 sn** · açılış en uzun **1,6 dk** · otomasyon **6,1 dk** · ŞERİT **6,88 sa** ·
model↔gerçek sapması **%8**. (D-092 sonrası dünya — İdealize hükmü 0, D-092'nin ödediği kalem.)

---

## §2 Bulgular

### Bulgu 1 — Kelepçe hâlâ TAŞIMADA: zamanın %91,5'i

| Profil | taşıma | arz | talep |
|---|---|---|---|
| İdealize | **%91,6** | %7,1 | %1,3 |
| Normal | **%91,5** | %7,2 | %1,3 |

D-092'nin ölçtüğü dağılımın aynısı (orada %93,0 idi; taşıma ödülü yürürlüğe girince arz payı
%5,9 → %7,2'ye çıktı, sıra değişmedi). **Bu tablo turun geri kalanını baştan belirliyor:** Usta'nın
hangi kanala bindiği, ne verdiğinden daha önemli.

### Bulgu 2 — Planın kolu (servis noktasına "üstüne ×2") ATIL

`e3 · yalnız servis`: 1 Usta alındı (4,75 sa), zincir **%0,0**, en uzun bekleme **33,8 dk sabit**,
ihlal 2/0 sabit. Yani plan §5'in servis merdivenine yazdığı *"Usta → üstüne ×2"*, ölçümde
**hiçbir şey yapmıyor.**

Sebep Bulgu 1: arz zamanın yalnız %7,2'sinde bağlayıcı. Bu, **D-092'nin talep kolunu elediği
ölçümün birebir tekrarı** — plan aynı hatayı ikinci kez yaptı: ödülü, kelepçe olmayan bir tavana
bağladı.

### Bulgu 3 — Etkinin TAMAMI masa (bahşiş) kanalından geliyor

| Kapsam | ALIM | d.ŞERİT | en uzun |
|---|---|---|---|
| yalnız servis | 1 | %0,0 | 33,8 dk |
| **yalnız masa** | 8 | **%-5,9** | **27,6 dk** |
| yalnız personel | 0 | %0,0 | 33,8 dk |
| servis+masa | 8 | %-5,6 | 27,6 dk |
| hepsi | 8 | %-5,6 | 27,6 dk |

Servis'i kapsama eklemek etkiyi **artırmıyor, azaltıyor** (%-5,9 → %-5,6): 15 💎 masadan alınıp
hiçbir şey yapmayan servise gidiyor. Kapsamın genişletilmesi bu tabloda net bir **kayıp**.

### Bulgu 4 — Personel kanalı ATIL DEĞİL, **ULAŞILAMAZ** (ve en güçlü kanal)

`e6` (bugünkü kural: Usta ancak ₺ tavanında açılır) dört dozun dördünde de **0 alım**. Sebep
ölçüldü: **12 saatlik pencerede hiçbir personel merdiveni ₺ tavanına varmıyor.** Normal profilde
alınanlar: karakter tepsi 2/4 · mıknatıs 1/3 · karakter hız **0/3** · garson tepsi 2/3 · garson
hız 1/1 · bulaşıkçı **0**. Garson tepsinin 3. kademesi (₺2.500) zaten görev hattında yok —
progress'te duran bilinen açık kalem burada ilk kez tempo sonucu doğurdu.

Sıfır satır tek başına "kol etkisiz" ile "kanca takılmamış"ı ayırmaz (D1'de `iade:0.25` tam böyle
kaçmıştı), bu yüzden tavan şartı kaldırılmış denetim satırı ölçüldü:

| `e6X` (tavan şartı YOK) | ALIM | ilk Usta | ihlal(N/I) | en uzun | d.ŞERİT |
|---|---|---|---|---|---|
| ×1,25 | 5 | 0,59 sa | 1/0 | 27,0 dk | **%-13,4** |
| ×1,50 | 5 | 0,59 sa | 1/0 | 22,5 dk | **%-22,4** |
| ×2,00 | 5 | 0,59 sa | 1/0 | 22,3 dk | **%-26,1** |
| ×3,00 | 5 | 0,59 sa | 1/0 | 22,3 dk | %-26,4 |

Kanal takılı ve **taşıma kanalı açık ara en güçlüsü** — ama en küçük dozu bile (%-13,4) D1'in
%7'lik eleme eşiğinin iki katı. Yani bu kanal bugünkü hâliyle **iki kez kapalı**: hem tavan şartı
yüzünden ulaşılamıyor, hem de ulaşılsa Kat 1 içeriğini yiyor.

`e6X`in ×2 ile ×3 arasında **doyması** (%-26,1 → %-26,4) taşıma çarpanının kendi tavanına
dayandığını gösteriyor: bir noktadan sonra kelepçe taşımadan çıkıp arza geçiyor.

### Bulgu 5 — Etki dozu: planın ×2'si %7 eşiğinin ALTINDA

| `e1` doz | en uzun | d.ŞERİT |
|---|---|---|
| ×1,25 | 32,0 dk | %-1,6 |
| ×1,50 | 30,4 dk | %-3,0 |
| **×2,00 (plan)** | **27,6 dk** | **%-5,6** |
| ×3,00 | 23,4 dk | %-9,8 |

Eşik ×2 ile ×3 arasında. Planın dozu geçiyor — **ama ihlal sayısını hiç kıpırdatmıyor** (dört dozda
da 2/0). Kazanç yalnız en uzun beklemenin kısalmasında: 33,8 → 27,6 dk.

### Bulgu 6 — Fiyat kuyruğu belirliyor, tempoyu belirlemiyor

| `e2` fiyat | ALIM | KUYRUK | d.ŞERİT |
|---|---|---|---|
| 15 💎 | 8 | 5 | %-5,6 |
| 25 💎 | 5 | 8 | %-3,0 |
| 40 💎 | 3 | 10 | %-2,0 |
| 60 💎 | 2 | 11 | %-1,1 |

Fiyat ile zincir bedeli neredeyse doğrusal takas: pahalı Usta = az alım = az bedel. Dört fiyatın
dördünde de ihlal 2/0 ve açılış üç ölçütü sabit. Yani **fiyat bir tempo kolu değil, bir kuyruk
kolu** — seçim tempo tablosundan çıkmaz (D-090 Bulgu 13 ve D-092'nin tekrarı: tablo eler, seçmez).

### Bulgu 7 — Kuyruk 12 saatte ÇÖKMÜYOR; "16 Usta anında" korkusu yanlış çıktı

Turun açılış varsayımı çürüdü. 250 💎'ın **12 saatte yalnız 132'si düşüyor** (hedef kademelerinin
geri kalanı 12 saatten sonra açılıyor), 120'si harcanıyor, 12'si elde kalıyor ve **kuyrukta 5
uygun hedef bekliyor**.

| `e4` hedef arzı | ALIM | KUYRUK | d.ŞERİT |
|---|---|---|---|
| 0 💎 | 0 | 13 | %0,0 |
| 80 💎 | 2 | 11 | %-1,1 |
| 150 💎 | 5 | 8 | %-3,0 |
| **250 💎 (bugün)** | **8** | **5** | %-5,6 |

Hiçbir dozda kuyruk sıfırlanmıyor. Bugünkü arz ilk 12 saatte **fazla değil**.

### Bulgu 8 — Usta ilk oturumda YOK: ilk Usta 3,59 saatte

Bütün etkili satırlarda ilk Usta **3,59 sa**'te alınıyor (yalnız servis kapsamında 4,75 sa).
Alım hattı yığılmalı: `masa1@3,59 · masa2@3,61 · masa3@3,64 · masa4@3,66 · masa5@3,85 ·
masa6@3,91 · servis@4,92 · masa7@6,50`. Yani meta katman ilk üç buçuk saat **boş**, sonra altı
Usta yarım saate sığışıyor. `e6X`te ilk Usta 0,59 sa — fark tamamen **tavan şartından** geliyor.

### Bulgu 9 — Günlük görev ilk 12 saatte HİÇBİR ŞEY yapmıyor (eşik 30 💎/gün)

| `e5` günlük arz | 12 sa'de biriken | ALIM |
|---|---|---|
| 6 💎/gün (plan) | 3,0 💎 | 0 |
| 12 💎/gün | 6,0 💎 | 0 |
| 20 💎/gün | 10,0 💎 | 0 |
| 40 💎/gün | 20,0 💎 | 0 |
| 80 💎/gün | 40,0 💎 | 1 |

12 sa yarım gün olduğu için günlük arzın 15 💎'lık fiyatı geçmesi **30 💎/gün** gerektiriyor —
planın dozunun beş katı. Bu bir eleme değil, **ölçek uyuşmazlığı**: günlük görevin işi ilk oturumu
değil, 2.–10. günü doldurmak. Sayısı §5'te.

### Bulgu 10 — Açılış üç ölçütü HİÇBİR kolda kıpırdamadı

35 satırın 35'inde: ilk alım **22 sn** · açılış en uzun **1,6 dk** · otomasyon **6,1 dk**.
Usta tavan-üstü bir basamak olduğu için beklenen sonuç — ama D-090 Bulgu 10'un dersi gereği
beklenti ölçülmeden doğrulanmış sayılmadı. D-079'un üç ölçütü bu turda **risk altında değil**.

### Bulgu 11 — Hedef kategorisi "Usta", bugün ₺ tavanını sayıyor (ve bu iyi)

`goals.categories.master` metriği `masterTables`, bugün `tableSoftMaxLevel()` = **L4**'ü, yani
₺ tavanını sayıyor. Usta seviyesi gelince bu sayaç "Usta olmuş masa"yı sayarsa **arz kendi
harcamasına bağlanır**: 250 💎'ın 50'si Usta kategorisinden geliyor, yani oyuncu 3 💎 kazanmak
için 15 💎 harcamak zorunda kalır — kapalı döngü. Bugünkü hâl (L4 sayması) bu döngüyü açıyor.
Karar kalemi: sayaç **L4'te kalsın mı**, yoksa iki ayrı kategori mi olsun.

### Bulgu 12 — Damgalar

`eKAPI` (kanca açık, etki 1, fiyat ulaşılmaz) tabanın **birebir** kopyası çıktı → kancanın kendisi
koşuyu kımıldatmıyor. **💎 korunumu** (kazanılan − harcanan = kalan) alım yapan bütün satırlarda
**0 sapma**. Taban geri dönüşü, taban alım yokluğu ve şerit geri dönüşü de temiz.

---

## §3 Ne ÖLÇÜLMEDİ

- **Ödüllü reklam arzı.** Plan Usta'yı "15 💎 **veya** 1 reklam" diye tanımlıyor; reklam kolu
  sim'de yok (model sınırı ②). Reklam açıksa 💎 fiyatı bir **tavan** değil, bir alternatiftir.
- **Kozmetik harcaması** (30–60 💎). Bu turda yalnız Usta harcaması ölçüldü; kozmetik ikinci bir
  sink ve Usta kuyruğuyla aynı 💎'ı paylaşıyor.
- **Offline uzatma** (`offline.diamondExtendHours: 8`) — konfigürasyonda duruyor, harcama tarafı
  hiç bağlanmamış.
- **Usta'nın GÖRÜNÜR olması.** D-090'ın kabul edilen eksiğinin aynısı: mermer tezgâh / cilalı pirinç
  görsel ödüldür ve sim'in ölçebileceği bir şey değil. D7b'ye ve telefonda okumaya kalıyor.

---

## §4 Karar

<!-- BOŞ — karar paketi kullanıcıya sunulacak, seçim buraya D-093 olarak yazılacak. -->

---

## §5 Defter — gün ölçeği (tick ile ölçülemez, model sınırı ①)

Tick tablosu ilk 12 saati okuyor; planın vaadi ("~2,5 günde bir Usta") gün ölçeğinde. Aşağıdaki
gün sayıları **hedef 💎'ı bittikten sonra kalan kuyruk** içindir. Hedef sayısı 26 (servis 1 +
masa 20 + personel 5).

| Fiyat | Hedef 💎 kaç Usta alır | Kalan kuyruk | Reklamsız (6 💎/gün) | Reklamları Kaldır (16 💎/gün) | Ödüllü izleyen (51 💎/gün) |
|---|---|---|---|---|---|
| **15 💎** | 16 | 10 | 25,0 gün · **2,50 gün/Usta** | 9,4 gün · 0,94 gün/Usta | 2,9 gün · 0,29 gün/Usta |
| 25 💎 | 10 | 16 | 66,7 gün · 4,17 gün/Usta | 25,0 gün · 1,56 gün/Usta | 7,8 gün · 0,49 gün/Usta |
| 40 💎 | 6 | 20 | 133,3 gün · 6,67 gün/Usta | 50,0 gün · 2,50 gün/Usta | 15,7 gün · 0,78 gün/Usta |
| 60 💎 | 4 | 22 | 220,0 gün · 10,00 gün/Usta | 82,5 gün · 3,75 gün/Usta | 25,9 gün · 1,18 gün/Usta |

**Planın vaadi 15 💎'te birebir tutuyor: 2,50 gün/Usta.** Ama tablonun ikinci kolonu vaadin
yanında durmayan şeyi söylüyor: 26 hedefin **16'sı** hedef 💎'ıyla peşin alınıyor, geriye
**10** kalıyor. Yani "2,5 günde bir Usta" temposu kuyruğun yalnız son %38'inde geçerli;
ilk %62 tek bir gün içinde biter.

Kozmetikler (30–60 💎) aynı 💎'ı paylaşıyor: bir kozmetik, iki–dört Usta demek.

---

## §6 Bekçi

<!-- BOŞ — karar verildikten sonra yazılacak (test dosyası + mutasyon sayısı). -->
