# Kullanıcı geri bildirimi — 2026-09-18 (ilk 5 dakika oynanış + yazılı notlar)

İki kaynak, tek liste:
① **Ses kaydı** — `feedback/Kiraathane feedback 1_original.txt` (UTF-16, 00:00–05:11).
  Kullanıcının kendi sözü: *"Henüz 5 dakika olarak oynayarak bunları söylüyorum."*
② **Yazılı notlar** — aynı mesajda, kayıtta olmayan ek kalemler.

Kalemler kullanıcının KENDİ cümleleriyle kayıtlı (R turlarının dersi: parafraz bir tur sonra
"aslında ne demişti" tartışmasına dönüyor). Numaralar `G-` serisinin devamı (son kullanılan: G-57).

**Bu turda hiçbiri UYGULANMADI.** Kullanıcı: *"bunları planlamanı ve olabildiğince kaliteli
şekilde halletmeni istiyorum."* → önce kayıt + plan + karar, sonra kod (D-084 varyant kapısı).

Her kalemin yanında **kodda doğrulanmış** kök neden var — "ilk okuma" değil, dosya+satır.

---

## A · GÖREV AKIŞI — "hepsi tek sıra hattı" (kaydın omurgası)

Kullanıcı aynı şeyi dört kez farklı sözle söyledi; tek kalem değil tek SİSTEM:

> *"Yani hepsi sıraya bağlıymış gibi olsun"* · *"Bir nevi bunların hepsini tek sıra hattındaymış
> gibi düşünebilirsin"* · *"onların bence bir sıralaması olması gerekiyor"*

| # | Bulgu | Kullanıcının sözü | Kökü (doğrulandı) |
|---|---|---|---|
| **G-58** | **Görev bitiş efekti zayıf** | *"görev tamamlayınca altta ikon işte etrafı yeşile boyanıyor… Onun efektinin biraz daha güzel olması sağlanabilir. Kayarak gelme veya tamamlandığını böyle sallanma, şirin tarzda bir efekt"* | `HUD.tsx:284` — tamamlanma bandın KENDİ hâli (G-04). Bugün yalnız renk değişiyor, hareket yok. |
| **G-59** | **Sıra karışık: yeni görevin pad'i, tebrik gelmeden açılıyor** | *"Diğer görev tostu gelmeden direkt görevin pedi açılabiliyor"* · *"görev bitince o tostun üzerine güzel bir efekt olmalı… sonra yeni görev geldi"* · *"yeni görev kartı geldikten sonra ikinci masa pedi açılacak ve oraya zum atılacak"* | `visiblePads()` (`rules.ts:598`) doğrudan `questIndex`e bakıyor; `questIndex` artar artmaz pad aynı karede görünüyor. Aradaki "kutlama → kart → pad → zoom" hattı YOK. |
| **G-60** | **Uyarı ile görev tostu ÇAKIŞIYOR** | *"çay butonu var ya onun üzerine [basınca] uyarı geliyor, uyarı geldiği anda altta biten göreve de var"* · *"kimse yokken çayları tezgâha geri bırakabilirsiniz… O anda hiçbir görev olmamalı"* | `enqueueNotice` kuyruğu var ama toast + görev bandı + modal AYRI kanallar; aralarında öncelik yok. |
| **G-61** | **Görevi olmayan yükseltme noktası açık duruyor** | *"çay yükseltmesi ocağı yükseltmesinde görev gelmez. Gelmese bile o yükseltme pedi açık olmasın"* | Pad'lerde "ekranda tek pad" var (`visiblePads`), YÜKSELTME noktalarında yok — `noticeSystem`/`revealSeen` ayrı yoldan açıyor (`tick.ts:1130+`). |
| **G-62** | **Tamamlanınca Görevler düğmesi işaret vermiyor** | *"sol altta görevler şeyi var ya, o buton böyle etrafı sarılsın, kamera bir an oraya kaysın öyle bir efekt ver"* | Alt navda rozet var (`goalsReady`/`dailyReady`) ama tamamlanma ANINDA vurgu/kamera yok. |

**Hedef hâl (kullanıcının tarifi, tek cümle):** biten görev kendi çubuğunda kapanır → başarı
efekti → yeni görev kartı yazılır → **ancak o zaman** pad/yükseltme noktası belirir ve kamera
oraya kayar. Ekranda uyarı/modal varken zoom gelmez.

> Bu G-41…G-44'ün (2026-09-16) devamı ve onların kapanmadığının kanıtı. Aynı sistem.

---

## B · ÖĞRETME — "oyun en başta öğrenirken bir şeyleri göstermiş olsun"

| # | Bulgu | Kullanıcının sözü | Kökü (doğrulandı) |
|---|---|---|---|
| **G-63** | **Bulaşık mekaniği ÖĞRETİLMEDEN "3 bulaşık yıka" görevi geliyor** | *"'bulaşık yıka' diyor ama öyle bir şey olmaması gerekiyor. Ona bir uyarıcı, bir modal tarzı bir şey… 'müşteriler çay içtikten sonra masalarda kirli çay birikmeye başlar, bunları alıp bulaşık tezgâhına bırakman gerekiyor' falan tarzı bir şey yazabilir, ondan sonra 'üç tane bulaşık yıka' görevi gelmeli"* + *"oraya birden zoom yapar ve ekranda bir yazı çıkar… bulaşığın görüldüğü yeri KAPATMAYACAK şekilde"* | `q_wash` hattın 9. görevi; kirli bardak tam o görevle doğuyor (`tick.ts:497`, `WASH_QUEST_INDEX`). Yani mekanik ile görev AYNI anda geliyor, arada öğretme yok. |
| **G-64** | **Tepsi yükseltmesinin NEREDEN yapıldığı bilinmiyor** | *"tepsi yükseltmesi yapılması gerekiyor, o hani en başta kullanıcı bilmiyor ya… karakter kısmına bir zum atması lazım, oraya tıklaması… Tepsiyi yükselteceğini bilmesi lazım"* | `HUD.tsx:132` `spotlight` var (karakter sekmesi vurgulanıyor) ama kullanıcı 5 dakikada FARK ETMEDİ → vurgu yetmiyor; zoom + açık yönlendirme isteniyor. |

---

## C · SEVİYE VE ÖDÜL

| # | Bulgu | Kullanıcının sözü | Kökü (doğrulandı) |
|---|---|---|---|
| **G-65** | **İlk tepsi yükseltmesi 75 ₺ pahalı** | *"ilk seviye yükseltmesi 75, onun daha çok düşürülmesi gerekiyor… 30'a falan düşür. Çünkü ilk görevleri yaptıktan sonra cebinde 30 altın falan kalmış oluyor, direkt ona tıklayıp hemen yapabilsin"* | `economy.config.ts:412` — `tray.costs[0] = 75`. **DENGE → varyant kapısı.** |
| **G-66** | **Her seviye atlamada modal gelsin; atlamak biraz zorlaşsın** | *"Belki seviye atlamayı biraz daha zorlaştırabiliriz… Her seviyede ekrana modal gelmeli"* (*"Şimdilik ilk 4 levele kadar"*) | Bugün seviye atlama yalnız TOAST (`tick.ts:1560`). Zorluk `xp.levelBase/levelGrowth` (60 / ×1,5). **DENGE.** |
| **G-67** | **Seviye ödülü ₺ olsun (+ altta "2× için video izle")** | *"o ödülde 'artı 4 bilmem ne gelir' yerine örneğin 1000 altın, 100 altın, 200 altın… o anki ekonomi ne kadar gerektiriyorsa o kadar ödül verir. Altta da 2 için videoyu izleme butonu olur"* | Bugünkü ödül **+%2 taşıma hızı/seviye** ve bu D-092'de ÖLÇÜLEREK seçildi; gelir kolu o turda AÇILIŞI yediği için ELENDİ. **Kullanıcı D-092'yi yeniden açıyor → varyant kapısı + F3 (ödüllü reklam) bağımlılığı.** |
| **G-81** | **Hedeflerde tamamlanma farkındalığı + panelde en üste kayma** | *"hedeflerde bir şey tamamlanınca bir şeyler olsun, farkındalık olsun diye; içine girince de görev neredeyse ona kaysın, 'al' butonunu görüp bassın diye, veya yapılan en üste gelsin"* | `goals.ts` panel her kategoriden tek satır veriyor; toplanabilir olan listede YUKARI ÇIKMIYOR, tamamlanma anında da ekranda iz bırakmıyor. |

---

## D · YERLEŞİM VE PERSONEL DAVRANIŞI

| # | Bulgu | Kullanıcının sözü | Kökü (doğrulandı) |
|---|---|---|---|
| **G-68** | **Tezgâhın/bulaşığın ARKASINDA durması gereken adam ÖNÜNDE duruyor** | *"tezgâh ve bulaşığın arkasında olması gereken adam önünde duruyor. Duvarla tezgâh arasında olması gerekirken tezgâhın öbür tarafında duruyor"* | **ÖLÇÜLDÜ — istenen yer BUGÜN FİZİKSEL OLARAK YOK.** Sol duvarın iç yüzü x = −17,0 (`FLOOR_HALF`); tezgâh `station:[−16,2…]` + `half[0]=0,5` → gövde x ∈ [−16,7 · −15,7]. Duvarla gövde arası **0,30 br**. Aktör gövde ÇAPI 2×`ACTOR_RADIUS` = **0,56 br**. Yani adam oraya SIĞMIYOR; `staffWalk` ve `dishwasherHome` salon tarafında olmak zorunda. İstenen hâl ⇒ **servis bloğu duvardan ≥0,5 br içeri çekilmeli** (arka bant döneminde bu koridor zaten var: *"arkasında çaycının çalıştığı koridor kalır"*, `layout.ts:518`). Ölçü dondurma turu gerektirir. |
| **G-69** | **Bulaşık açılmadan bulaşık tezgâhı sahnede** | *"bulaşık daha açılmadan, bulaşık tezgâh var, o da olmasın"* | `Scene.tsx:618` — `DishSink` KOŞULSUZ çiziliyor. Oysa kirli bardak `q_wash`tan (9. görev) önce hiç doğmuyor. |
| **G-70** | **Tezgâh, oyuncu hiç bulaşık bırakmadan kirli görünüyor** | *"bulaşık tezgâhında döngüsel olarak, ben bulaşık bırakmasam bile kirli birikmeye başlıyor. Ben bıraktığım zaman, birkaç tane bıraktıktan sonra kirlenip, o adam oraya geldiğinde temizlenmesi gerek"* | `DishSink.tsx:81` — `kirli` = **kattaki HER kirli** (`s.dishes.length > 0`), yani masadaki bardak tezgâhı kirletiyor. Ayrıca yıkama ANLIK (`tick.ts:851`): tezgâhta bekleyen bulaşık diye bir durum YOK. |
| **G-71** | **Garson, tezgâh önündeki NPC ile takılıyor** | *"bazen garson tezgâhla bulaşık tezgâhının önündeki NPC ile birbirine takılıyor, onun da düzenlenmesi gerek. O adam tezgâh arkasına giderse herhâlde bu sorun çözülür ama yine de her ihtimale karşı takılmalara önlem gerek"* | Aktörler birbirine KATI DEĞİL (`layout.ts` yorumu: *"NPC'ler birbirinden de geçer"*) — yani takılma çarpışmadan değil, **aynı hedef noktaya iki aktörün kilitlenmesinden**. G-68 ile aynı kökten. |

---

## E · DENGE (hepsi varyant kapısına tabi — ölç → sor → uygula)

| # | Bulgu | Kullanıcının sözü | Kökü (doğrulandı) |
|---|---|---|---|
| **G-72** | **Garson yetmiyor; tepsisi 2'li başlasın?** | *"garson optimizasyonu şart çünkü bazen garson çok geri kalıyor. En başta tepsisi 2'li başlayabilir belki… Garson yeterli mi, çünkü bulaşıkçı direkt kalktı ve yerine garson geldi"* | `waiterTrayCapacityFor(tier) = 1 + kademe` → taban **1**. `trayUpgrades.costs = [400,1200,2500]`. C3 ölçümü zaten *"garsonun turu sabrı ÇOKTAN aşıyor"* diyor (8 masada 19,7 sn tur / 18 sn sabır). **DENGE.** |
| **G-73** | **1. salonda 2. garson gerekli mi?** | *"ilk salondaki 2. garson daha açılmadı ve ilk salonda 2. garson olacak mı bilmiyorum, gerekiyor mu onu da araştır, çünkü tek garson yetmiyor net bir şekilde"* | `waiter2` pad'i bugün `requires: { prev:['z3table4'], minStationLevel:6 }` — yani **3. salonda**. **DENGE.** |
| **G-74** | **4. masa 380 ₺ pahalı** | *"şu an 4. masa 380 ve çok geldi bana, oyundan çıkardım sıkılıp sanki"* | `economy.config.ts:660` — `table4.cost = 380`. **DENGE.** |
| **G-75** | **2. salon çok erken; önce masa seviyeleri + "tüm masaları yükselt" görevleri** | *"2. salon hemen açılıyor; önce mesela tüm masalar sırayla 4 olsun falan. Ama bunun için de görevler verilmeli: tüm masaları 2 level yap vs."* · *"2. salonu olabildiğince geciktirmek gerek"* | Hatta `q_zone2` 15. görev; arasında yalnız `q_tableL2` (tek masa) var. `tablesAtLevel` hedef tipi ZATEN VAR, kullanılmıyor. **DENGE.** |
| **G-76** | **Masa seviye sırası GENİŞLİK-ÖNCE olmalı** | *"şu an 1 masa 4 level olmadan diğerinin seviye yükseltmesi gelmiyor ama sıralama 1 1 1 1 sonra 2 2 2 2 olmalı. 4 1 1 1 sonra 4 4 1 1 sonra 4 4 4 1 sonra 4 4 4 4 olmamalı bence"* | **D-124'ün tam tersi.** `tableUpgradeTarget()` (`rules.ts:72`) "başladığını bitir" diyor ve bu ÖLÇÜLMÜŞ bir karardı (serbest sıra 6 saatlik kazancı %20,6 oynatıyordu; H2 raporu). **D-124 yeniden okunmalı.** |
| **G-77** | **Görev metnindeki "Seviye N" ile ekrandaki "LN" tutmuyor** | (kullanıcının ifadesi: *"açık masa zaten lvl 1, ilk yükseltmeden sonra geleceği nokta lvl2 olmalı"*) | **Gerçek hata:** dünyada etiket 1-tabanlı (`tick.ts:1356` → `L${lv+1}`) ama görev başlığı iç sayıyı yazıyor: `q_tableL2x2` "**Seviye 2**'ye çıkar" hedefi `level:2` = ekranda **L3**; `q_z1allL4` "Seviye 4" = ekranda **L5**. |

---

## F · HATA (denge değil — onarım)

| # | Bulgu | Kullanıcının sözü | Kökü (doğrulandı) |
|---|---|---|---|
| **G-78** | **Kısmi ödenmiş YÜKSELTME kayıtta durmuyor — para gidiyor, dolum sıfırlanıyor** | *"çay ocağında yükseltmede 800 altından 300'ünü falan ödeyerek bıraktım, sonra da geri girdim; para zaten verilmişti ama yükseltmede sıfırdan başlıyordu"* | **DOĞRULANDI, veri kaybı.** `save.ts` `padFills`'i kaydediyor (satır 140) ama **`upgradeFills` · `tableUpgradeFills` · `lavaboFill` YOK**; `store.ts:619-621` yükleme yolunda üçünü de 0'a çekiyor. Yani pad dolumu korunuyor, YÜKSELTME dolumu yanıyor. |
| **G-79** | **Açılışta offline modalının üstüne Usta modalı biniyor** | *"oyun ilk açıldığında yokkenki geliri görürken, o an bir usta padi üzerinde durduğu için otomatik ekrana direkt o modal geliyor; ya doğum yeri değişsin ya da o düzelsin"* | `HUD.tsx:264` — `UstaModal` yalnız `nearMaster && masterKapali!==nearMaster`e bakıyor; `showOffline` kelepçesi YOK. (Aynı dosyada `spotlight` ve `traySpot` `!showOffline` ile kelepçeli — desen var, Usta'ya uygulanmamış.) Ayrıca dwell açılışta **kenar-tetikli değil**: oyuncu yüklenirken noktanın üstündeyse hareket etmeden tetikliyor (`feedback_interaction_model`: etkileşim HAREKET-temelli olmalı). |

---

## G · PERFORMANS

| # | Bulgu | Kullanıcının sözü |
|---|---|---|
| **G-80** | **Şarj tüketimi + kasma — "OPTİMİZASYONU TEKRAR SÖYLÜYORUM ŞART"** | *"çok ciddi şarj yiyor ve çok hızlı kasmaya başlıyor, optimizasyon kötü. Mesela mekânda müşteri sınırı olmalı, biri çıkmadan diğeri girmesin, anladın mı; öyle bir şey koyabiliriz, belki de vardır bilmiyorum ama ciddi optimizasyon gerek"* |

**Bilinen zemin:** `docs/fps-bulgulari-2026-09-06.md` PC'de kare başına 3,2 React commit'i kapattı
(kimlik koruma + aktör transformlarının React'ten çıkarılması). **O ölçüm MASAÜSTÜNDE yapıldı.**
Kullanıcının bu şikâyeti şarjdan bahsediyor → **cihaz**. Yeni ölçüm gerekiyor; eskisi bayat.

**Müşteri sınırı zaten VAR ama tavan yüksek:** `npc.maxConcurrent: 8` (taban) ve gerçek tavan
= *toplam koltuk + 2* → 12 masa × 4 koltuk = **50 NPC**. Kullanıcının önerdiği "biri çıkmadan
diğeri girmesin" kuralı bu tavanı sertleştirmek demek → **hem perf hem DENGE kolu.**

---

## KAPSAM NOTU — kaydın son cümlesi

> *"Bu kadar şu anlık, bunları halledersin, ondan sonra tekrar devam ederiz."*

Yani bu liste bir turluk değil; **kullanıcı bunlar kapanınca oyuna yeniden başlayıp tekrar
bakacak.** (*"bunları düzelttikten sonra bir oyuna bir tekrar başlayalım"*) Planın çıkış ölçütü
"maddeler işlendi" değil, **ikinci bir 5 dakikalık oturumun bu kalemleri üretmemesi**.
