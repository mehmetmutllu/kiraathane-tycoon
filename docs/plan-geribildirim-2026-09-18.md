# PLAN — 2026-09-18 geri bildirimi (G-58 … G-81)

Kaynak: `docs/geribildirim-oyun-testi-2026-09-18.md` (24 kalem, kodda doğrulanmış kökleriyle).
Kural: `CLAUDE.md` §Oturum akışı (D-084) — **ölç → sor → uygula**, iki commit, kısa/tam koşu.

**Çıkış ölçütü kalem sayısı değil:** kullanıcı bunlar kapanınca oyuna yeniden başlayacak
(*"bunları düzelttikten sonra bir oyuna bir tekrar başlayalım"*). Plan, **ikinci bir 5 dakikalık
oturumun aynı kalemleri üretmemesi** için kuruldu.

---

## Kalemlerin üç kovası

| Kova | Kalemler | Varyant kapısı? | Neden |
|---|---|---|---|
| **ONARIM** — yanlış davranış, kol yok | G-69 G-70 G-77 G-78 G-79 | **Hayır** | Doğrusu tek. Sayı seçimi yok, sunum/kayıt hatası. |
| **SİSTEM** — yeni davranış, denge sayısına dokunmaz | G-58 G-59 G-60 G-61 G-62 G-63 G-64 G-71 G-81 | **Hayır** (görev SIRASI değişmiyor, sunum sırası değişiyor) | Ama bekçi testi ZORUNLU: bu tam olarak G-41…G-44'ün kapanmadığı yer. |
| **DENGE / ÖLÇÜM** | G-65 G-66 G-67 G-68 G-72 G-73 G-74 G-75 G-76 G-80 | **EVET** | `economy.config.ts` · `rules.ts` · `layout.ts` ölçüleri ve cihaz performansı. Sayı satırı olmadan kod yazılmaz. |

---

## T1 · ONARIM TURU  (denge sıfır · tek commit · ~kısa)

| Kalem | Yapılacak | Bekçi |
|---|---|---|
| **G-78** | `upgradeFills` · `tableUpgradeFills` · `lavaboFill` kayıt şemasına girer + `saveVersion` artar + migrasyon (eski kayıtta yoksa 0). **Veri kaybı — sırası birinci.** | vitest: kaydet→yükle turunda kısmi dolum korunur; eski sürüm kaydı migrate olur |
| **G-79** | `UstaModal`a `!showOffline` kelepçesi (`spotlight`/`traySpot` deseninin aynısı) **+** dwell KENAR-TETİKLİ olur: yüklemede noktanın üstünde duran oyuncu, noktadan çıkıp yeniden girmeden tetiklemez (`feedback_interaction_model`). | vitest: dwell kenar tetiği; duman: açılışta tek modal |
| **G-77** | Görev başlıkları ekrandaki L ile hizalanır (`q_tableL2x2` → "Seviye 3", `q_z1allL4` → "Seviye 5") **veya** hedef `level` bir azaltılır. Hangisi seçilirse `tablesAtLevel`/`tableLevel` için TEK dönüşüm noktası yazılır ki bir daha kaymasın. | vitest: her görev başlığındaki sayı = hedefin ekran karşılığı |
| **G-69** | Bulaşık tezgâhı `questIndex < WASH_QUEST_INDEX` iken sahnede **yok / tadilat hâlinde** (→ **SORU 2**). | duman: 1. görevde `dishSink` görünmez |
| **G-70** | `DishSink.kirli` artık kattaki bardağa değil **tezgâha bırakılana** bakar. Ucuz kol: bırakma anında başlayan kısa "kirli" penceresi + var olan `Yikama` parlaması (tick'e dokunmaz). Tam kol (tezgâhta biriken kuyruk + bulaşıkçının süreyle yıkaması) **throughput değiştirir → T3'e taşınır.** | vitest: masadaki bardak tezgâhı kirletmez |

---

## T2 · GÖREV AKIŞI — TEK HAT  (sistem · denge sayısı yok · bekçi kesinlikle zorunlu)

Kullanıcının tarifi zaten bir durum makinesi:

```
çalışıyor → [hedef doldu] → KUTLAMA (görev bandı kendi içinde kapanır, efekt)
          → YENİ KART (yeni görev yazılır)
          → HEDEF AÇILIR (pad / yükseltme noktası belirir)
          → KAMERA (zoom)   ← ancak burada, ve ekranda modal/uyarı YOKSA
```

| Kalem | Yapılacak |
|---|---|
| **G-59** | `visiblePads()` doğrudan `questIndex`e bakmayı bırakır; **akış durumu**nu okur. Pad ancak `HEDEF AÇILIR` adımında görünür. |
| **G-61** | **İKİYE BÖLÜNDÜ.** T2'de: kutlama penceresi boyunca hiçbir yeni nokta/uyarı belirmez (1,3 sn — sunum, tempo etkisi yok). T3-K11'de: "yükseltme noktası yalnız kendi görevi aktifken canlı" kalıcı kapısı — o satın alma sırasını değiştirir, yani **tempo**, yani ölçülmeden yazılmaz. |
| **G-60** | Tek bildirim kuyruğu ve sabit öncelik: `modal > öğretme kartı > görev kartı > toast > ipucu`. Aynı karede iki kanal açılamaz. |
| **G-58** | Kutlama adımının efekti: banda kayarak giriş + kısa yaylanma (`useFrame`/damp, hafif — `feedback_visual_polish`). |
| **G-62** | Kutlama anında Görevler düğmesi halkalanır; kamera kısa bir an oraya yönelir. |
| **G-63** | `q_wash`tan ÖNCE öğretme adımı: kirli bardağın olduğu masaya zoom + metin **bulaşığı kapatmayacak yerde** (ekranın karşı yarısında). Mekanik (kirli bardak doğması) öğretme kartıyla birlikte açılır, görevle değil. |
| **G-64** | Tepsi görevinde karaktere zoom + "buraya dokun" yönlendirmesi; bugünkü sessiz `spotlight` yetmedi. |
| **G-71** | **T2'de YAPILMADI — bilerek.** Kullanıcının kendi teşhisi doğru çıktı: *"o adam tezgah arkasına giderse herhâlde bu sorun çözülür"*. Kök **G-68/K10**; aktörler zaten birbirine katı değil, yani "takılma" bir çarpışma değil AYNI NOKTAYA kilitlenme. Emniyet kemerini ölçmeden yazmak, aktör hareketine dokunup taşıma tavanını (ve tempoyu) sessizce oynatmak olurdu. **K10 ile aynı turda ölçülür:** iki personel aynı 0,56 br diskte ne sıklıkta ve ne kadar süre duruyor. |
| **G-81** | Hedefler panelinde toplanabilir satır **en üste** çıkar; tamamlanma anında ekranda kısa iz. |

**Ölçüm (kısa koşu yeter, denge değil):** bir oturum boyunca "aynı karede açık kanal sayısı"
(tepe ve ortalama) + "kutlama ile pad görünümü arasındaki süre". Bekçi: tepe = 1.

---

## T3 · DENGE ÖLÇÜM TURU  (İKİ COMMIT — kural budur)

> **Commit #1:** araç + ham çıktı + rapor, **karar bölümü BOŞ** → karar paketi → kullanıcı seçer
> **Commit #2:** yalnız seçilen kol + bekçi + final TAM koşu

Araç: `tools/simulate.ts` (+ gerekiyorsa `tools/denge-kollari.ts` kalıbı). Ölçütler sabit:
D-079 açılış üçlüsü (ilk alım · ilk yükseltme · otomasyon) · tempo bantları · en uzun bekleme ·
D-087 "20 dk aşan yok" hükmü · zincir süresi.

| Kol | Kalem | Taban (bugün) | Ölçülecek kollar |
|---|---|---|---|
| **K1** | G-65 | `character.tray.costs[0] = 75` | 30 · 50 · 75 |
| **K2** | G-72 | garson tepsi tabanı **1** (`1 + kademe`) | 1 · 2 (+ `trayUpgrades` maliyetlerinin kayması) |
| **K3** | G-73 | `waiter2` 3. salonda (`prev: z3table4`, `minStationLevel: 6`) | 1. salona çekme (hangi görevden sonra) · bugünkü yeri |
| **K4** | G-74 | `table4.cost = 380` | 250 · 300 · 380 |
| **K5** | G-75 | `q_zone2` 15. görev | araya `tablesAtLevel` görevleri koyarak geciktirme (2-3 basamak) |
| **K6** | G-76 | **D-124 derinlik-önce** ("başladığını bitir") | genişlik-önce (1111→2222) · bugünkü · karma. **D-124'ün %20,6'lık gerekçesi yeniden okunacak** — kullanıcı sırayı ekranda görüyor, ölçüm kazancı görmüyordu. |
| **K7** | G-66 | `xp.levelBase 60 · levelGrowth 1,5` | biraz zorlaştırma kolları + ilk 4 seviyede modal |
| **K8** | G-67 | seviye ödülü = **+%2 taşıma hızı** (D-092, ölçülerek seçildi) | ₺ · hız · ikisi birden (→ **SORU 4**). Ödüllü video ×2 kanadı **F3'e bağımlı** (reklam altyapısı kararı hâlâ bekliyor). |
| **K9** | G-70 tam kolu | tezgâhta bekleyen bulaşık kuyruğu + süreyle yıkama | throughput etkisi ölçülür |
| **K10** | G-68 | servis bloğu duvara **0,30 br** (gövde çapı 0,56) | bloğu duvardan EN AZ gerekli kadar açma (kullanıcı: *"duvardan çıkmasın"*) → yürüme yolu, pad çakışması, kamera. **Ölçü dondurma turu** |
| **K11** | G-61'in KALAN kanadı | yükseltme noktaları görevden BAĞIMSIZ açık | "yükseltme noktası yalnız kendi görevi aktifken canlı" kolu. T2'de yalnız **kutlama penceresi** kapatıldı (1,3 sn, tempo etkisi yok); kalıcı kapı satın alma SIRASINI değiştirir → tempo → ölçülür. D-124'ün masa kapısıyla aynı sınıf. |

---

## T4 · PERFORMANS  (G-80 — kullanıcı büyük harfle iki kez söyledi)

Eldeki ölçüm (`docs/fps-bulgulari-2026-09-06.md`) **masaüstünde** alındı ve React tarafını
kapattı. Yeni şikâyet **şarj** diyor → cihaz. Ölçüm bayat, yenisi gerekiyor.

Ölçülecekler: kare süresi cihaz profilinde (düşük DPR/GPU) · draw call · gölge maliyeti (D-073'te
gölge kullanıcı isteğiyle geri geldi) · NPC sayısı ↔ kare süresi eğrisi · yerdeki para sayısı ·
`useFrame` aboneleri.

Kullanıcının önerisi bir KOL: *"mekânda müşteri sınırı olmalı, biri çıkmadan diğeri girmesin"*.
Bugün tavan = *toplam koltuk + 2* → 12 masada **50 NPC**. Bu tavanı sertleştirmek **hem perf hem
denge** kolu → T3'ün ölçütleriyle birlikte okunur.

---

## T5 · CİLA
G-58/G-62 efektlerinin son hâli · G-81'in animasyonu · öğretme kartlarının yerleşimi.
(Bu tur T2'nin içinde başlar, burada bitirilir — `feedback_visual_polish`: mantık yeşil ≠ bitti.)

---

## KULLANICI KARARLARI (2026-09-18, plan onayı)

| Soru | Karar | Sonucu |
|---|---|---|
| Sıra | **T1 → T2 → T4 → T3 → T5** (öneri kabul) | T1 bu oturumda başlar |
| G-69 bulaşık tezgâhı | **"Hiç olmasın"** | `q_wash`a kadar sahnede çizilmez. `feedback_locked_object_renovation` burada UYGULANMAZ — kural "açık alandaki kilitli OBJE" içindi; bulaşık henüz oyunun bilmediği bir mekanik, kilitli obje değil. |
| G-68 tezgâh yeri | *"tezgah olduğu yerde kalsın adam da arkasına geçsin… belki tezgah duvardan biraz uzaklaşır ama farklı bir şey olmamalı, duvardan çıkmasın… yine de kaliteli olsun"* | **Blok taşınmaz, yalnız duvardan EN AZ gerekli kadar açılır.** Kısıt listesi: ① arkada aktörün geçebileceği pay (gövde çapı 0,56 + pay) ② tezgâh hâlâ "duvara yaslı" okunacak ③ yürüme yolu / pad / kamera bozulmayacak. T3-K10'da ölçülür; kol serbest değil, **en küçük yeterli açıklık** aranır. |
| G-67 seviye ödülü | **İkisi birden** | +%2 taşıma hızı (D-092) KALIR; üstüne modalde ekonomiye ölçekli ₺. T3-K8'de ₺ dozu, D-079 açılış üçlüsünü yemeyecek şekilde aranır. Video ×2 kanadı F3'e bağlı, ayrı. |

---

## Sıra (onaylandı)

`T1 → T2 → T4 → T3 → T5`

Gerekçe: **T1** veri kaybı taşıyor (para gidiyor) — beklemez. **T2** kullanıcının *"bak bu çok çok
önemli"* dediği kalem ve yeniden oynadığında ilk çarpacak şey o. **T4** her turun üstüne binen bir
vergi; denge ölçümünden ÖNCE kapanırsa T3'ün sayıları temiz cihazda doğrulanır. **T3** en uzun tur
(iki commit + karar paketi). **T5** en sona.
