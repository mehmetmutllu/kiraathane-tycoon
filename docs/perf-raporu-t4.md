# T4 — PERFORMANS RAPORU (G-80)

**Tur:** 2026-09-18 geri bildirimi · T4 · **Araç:** `tools/olcum-perf-t4.mjs`
**Ham çıktı:** `docs/olcum-perf-t4.txt` + `docs/olcum-perf-t4.json` (**TAM koşu damgalı**)

## Soru

Kullanıcı 2026-09-18: *"çok ciddi şarj yiyo ve çok hızlı kasmaya başlıyo, optimizasyon kötü.
Mesela mekânda müşteri sınırı olmalı, biri çıkmadan diğeri girmesin… **OPTİMİZASYONU TEKRAR
SÖYLÜYORUM ŞART**."*

İki ayrı şikâyet var ve **aynı şey değiller**: ① şarj ② kasma. Ölçüm ikisini ayırdı, çünkü
çözümleri de ayrı: 8 ms'lik bir kare de saniyede 120 kez çizilirse pil yakar.

## Bu ölçüm neden F2'nin tekrarı değil

`docs/telefon-raporu-f2.md` (2026-09-16) **DONDURULMUŞ** bir dünyada gölge/dpr/bayt ölçtü.
Kullanıcının şikâyeti "zamanla artıyor" diyor; donmuş dünya bu soruyu tanım gereği cevaplayamaz.
T4 dünyayı **canlı** ölçer ve üç şeyi ayrı tutar: YÜK (§A) · SÜRÜKLENME (§B) · NÜFUS (§C).

## Kapsam damgası — hangi sayı ne kadar sağlam

| Bölüm | Güven |
|---|---|
| §A/§B/§C **oranlar ve eğilimler** | **SAĞLAM** — aynı koşuda, aynı tohumla, aynı donanımda |
| Mutlak ms | **VEKİL** — cihaz bağlı değil |

Donanım ham çıktıda: `ANGLE (NVIDIA GeForce RTX 3060, D3D11)`, 412×915 @ dpr 2,625,
**CPU 4× kısık** (F2 ile aynı kısma → iki tur karşılaştırılabilir).

## Aracın doğrulanması — kısa koşu İKİ kusur yakaladı

Sayılar rapora girmeden önce araç iki kez çürütüldü; tam koşuya yalnız düzeltilmiş hâli girdi.

| # | Kusur | Belirti | Düzeltme |
|---|---|---|---|
| 1 | **vsync kilidi** | kare süreleri tam olarak **16,7 / 33,4 / 50,0** çıkıyordu — ölçülen şey işin maliyeti değil ekranın aralığıydı; bir vsync basamağının altındaki her kol farkı **0** okunuyordu | `--disable-gpu-vsync --disable-frame-rate-limit`; kullanıcının GÖRDÜĞÜ fps ayrı sütunda kalır |
| 2 | **Bulaşık döngüsü hiç çalışmıyordu** | kurulum yalnız `padsDone` yazıyor, `questIndex` 0'da kalıyordu; kirli bardak `questIndex >= WASH_QUEST_INDEX` kapısından doğduğu için ölçüm **"kirli kap: 0"** raporluyordu ve bu "sorun yok" diye okunacaktı | dünya **hat bitmiş** kurulur (50/50 görev) → kirli kap 2–6 arası ölçüldü |

---

# §Bulgular

## §A — YÜK 6,6 KAT BÜYÜYOR, VE KIRILMA GEÇ OYUNDA

| kademe | masa | NPC | para | kirli | **ms** | p95 | **fps** | çağrı | üçgen | commit/kare |
|---|---|---|---|---|---|---|---|---|---|---|
| A1 erken (1 salon · 1 masa) | 1 | 2 | 0 | 0 | **8,3** | 10,9 | **116,7** | 36 | 20.139 | 0,00 |
| A2 orta (2 salon · L3) | 5 | 7 | 7 | 6 | **15,6** | 33,5 | **62,0** | 86 | 59.263 | 0,00 |
| A3 geç (tüm pad · tavan) | 20 | 31 | 20 | 4 | **55,1** | 84,6 | **15,1** | 171 | 242.409 | 0,38 |

**Okunuşu:** kare maliyeti 8,3 → 55,1 ms (**×6,6**), çizim çağrısı 36 → 171 (**×4,8**), üçgen
20 bin → 242 bin (**×12,0**). Geç oyunda **15 fps** — bu, kullanıcının "kasma" dediği şeyin
kendisi. p95 84,6 ms, yani en kötü kareler 12 fps'e iniyor.

## §B — "HIZLA KASIYOR" BİR SIZINTI DEĞİL

Aynı dünyada 20 sn'lik **9 dilim** (3 dakika gerçek zaman):

| | ilk dilim | son dilim | değişim |
|---|---|---|---|
| kare süresi | 48,1 ms | 45,6 ms | **−%5,2** |
| JS yığını | 141,1 MB | 141,1 MB | **%0,0** |
| gölgelendirici programı | 43 | 43 | **0** |
| çizim çağrısı | 172 | 174 | +2 |
| geometri / doku | 365 / 105 | 380 / 111 | +15 / +6 |

**Hiçbir eğilim yok.** Kare süresi gürültü bandında oynuyor (42,3–48,1), yığın **birebir sabit**,
program sayısı sabit. Yani oyun **oynadıkça yavaşlamıyor**; oyun **büyüdükçe** yavaşlıyor (§A).

> **Bu, çözümün yerini değiştirir.** "Sızıntı ara" kolu ölçümle ELENDİ — kod aramaya değmez.
> Yapılacak iş kare BAŞINA maliyeti düşürmek, sızıntı avlamak değil. Geometri/doku +15/+6'lık
> küçük artış, geç oyunda yeni objelerin kadraja girmesi (yükleme), sürüklenme değil.

## §C — NÜFUS: kullanıcının önerdiği kol tam olarak neyi keserdi

20 masalık geç oyunda, 5 sn aralıkla 60 örnek:

| | min | ortalama | max |
|---|---|---|---|
| NPC | 32 | **35,3** | 39 |
| yerdeki para | 17 | **20,9** | 25 |
| kirli kap | 2 | **3,6** | 6 |

Bugünkü tavan `npc.maxConcurrent: 8` **değil**: gerçek tavan *toplam koltuk + 2*. Kullanıcının
*"biri çıkmadan diğeri girmesin"* önerisi bu ~35 kişilik nüfusu keserdi — ama aynı kesme
**gelir akışını da** keser: NPC = müşteri = ₺. Yani bu kol **hem perf hem DENGE** kolu.

## §D — GÖLGE HÂLÂ EN BÜYÜK TEK KALEM; **dpr KOLU ÖLÜ**

| kol | gölge | ms | p95 | fps | çağrı | dpr | tabana fark |
|---|---|---|---|---|---|---|---|
| **D0** taban | açık | 55,8 | 81,1 | 16,4 | 171 | 2,00 | — |
| **D1** gölge KAPALI | kapalı | **43,7** | 61,8 | 20,7 | 179 | 2,00 | **−12,1 ms (−%21,7)** |
| **D2** dpr tavanı 1 | açık | 59,5 | 87,0 | 15,1 | 179 | 1,00 | **+3,7 ms (+%6,6)** |
| **D3** gölge kapalı + dpr 1 | kapalı | 46,6 | 74,8 | 18,9 | 177 | 1,00 | −9,2 ms (−%16,5) |

1. **Gölge geç oyunda da en büyük tek kalem** ama payı F2'deki %40'tan **%21,7**'ye düşmüş —
   çünkü geç oyunda gölge DIŞI maliyet (çizim çağrısı, tick, React) çok büyümüş. Yani gölgeyi
   kapatmak tek başına 15 fps'i 21 fps yapıyor, **60'a çıkarmıyor**.
2. **dpr kolu ölü, hatta ters.** Piksel sayısı 4 kat azaldığı hâlde kare süresi **arttı**
   (+%6,6). Bu, kare maliyetinin fragment tarafında DEĞİL **CPU tarafında** olduğunu söylüyor.
   (F2 bunu "vekil ölçüm burada kör" diye açık kalem bırakmıştı; T4 kolu canlı dünyada
   ölçtü ve kol **olumsuz** çıktı — telefon GPU'sunda işaret değişebilir, bu satır cihaz turunu
   bekliyor ama artık "muhtemelen işe yarar" diye varsayılamaz.)

## §E — ŞARJIN KAYNAĞI KASMA DEĞİL: **KARE-HIZI TAVANI YOK**

`<Canvas>`ta `frameloop` verilmemiş (r3f varsayılanı `always`) ve hiçbir yerde fps tavanı yok.

**A1 erken oyun: 116,7 fps.** Yani oyunun İLK dakikasında, neredeyse boş bir sahnede, cihaz
saniyede 117 kare çiziyor. 120 Hz telefonda bu doğrudan pil demektir ve oyuncu 60'ın üstünü
**göremez**. Kullanıcının iki şikâyetinden ① (şarj) tam olarak buraya oturuyor; ② (kasma) ise
§A'ya. İkisi ayrı kollarla çözülür.

---

# §Kollar — ÖLÇÜLDÜ, SEÇİLMEDİ

> Aşağıdakiler ölçümün gösterdiği kollardır. **Hiçbiri uygulanmadı.**

| Kol | Ne yapar | Ölçülen dayanak | Sınıf |
|---|---|---|---|
| **K-A** kare-hızı tavanı (30 / 45 / 60) | boşa çizilen kareyi keser | §E: erken oyunda 116,7 fps | saf perf · **denge YOK** |
| **K-B** gölge cihaz sınıfına göre | zayıf cihazda gölgeyi kapatır | §D1: −%21,7 | saf perf · D-073 kullanıcı kararına dokunur |
| **K-C** çizim çağrısı azaltma (instancing: masa/sandalye/para/NPC) | CPU tarafını keser | §A: 36 → 171 çağrı · §D2: dpr ölü ⇒ darboğaz CPU | saf perf · büyük iş |
| **K-D** müşteri tavanı (kullanıcının önerisi) | nüfusu keser | §C: ort 35,3 NPC | **DENGE** — NPC = gelir ⇒ T3 ölçütleriyle okunmalı |
| **K-E** React commit'i geç oyunda 0'a indirme | kare başına 0,38 commit | §A: erken 0,00 → geç 0,38 | saf perf |

**Elenen kol:** *dpr düşürme* (§D2, ters çıktı) · *sızıntı avı* (§B, sızıntı yok).

---

# §Karar (kullanıcı, 2026-09-18)

## ŞARJ kolu → **K-A: 60 fps tavanı**

Kullanıcı seçti. Gerekçe ölçümde: erken oyunda **116,7 fps** çiziliyor ve oyuncu 60 üstünü
göremez. Görünümde hiçbir kayıp yok, denge etkisi yok.

## KASMA kolu → **kaliteyi BOZMADAN en mantıklı hamleler**

Kullanıcının sözü: *"burada kalite bozmadan ve düşürmeden en mantıklı hamleler ne ise onlar olsun."*

Bu cümle kolları kendisi eliyor — ölçümdeki beş koldan ikisi kaliteyi düşürüyor, ikisi düşürmüyor:

| Kol | Kaliteye etkisi | Karar |
|---|---|---|
| **K-C** instancing (çizim çağrısı 36→171) | **YOK** — aynı piksel, aynı gölge, aynı sahne; yalnız daha az çağrı | ✅ **SEÇİLDİ** |
| **K-E** React commit 0,38 → 0 | **YOK** — sunum hiç değişmez | ✅ **SEÇİLDİ** |
| **K-B** gölge cihaz sınıfına göre kapat | **DÜŞÜRÜR** — gölge D-073'te kullanıcının kendi isteğiyle geri gelmişti | ❌ elendi |
| **K-D** müşteri tavanı | Kaliteyi değil **GELİRİ** düşürür (NPC = müşteri = ₺) | ❌ bu turda değil → **T3 denge turu** |
| dpr düşürme | — | ❌ zaten §D2'de ters çıktı |

**Sıra (kolay→zor):** K-A → K-E → K-C.

## UYGULAMA — bu commit'te YAPILMADI, bilerek

Commit #1 kuralı gereği burada yalnız araç + ham çıktı + rapor var. **K-A/K-E/K-C ayrı bir
oturumda uygulanacak** ve o oturumun kapanışında `tools/olcum-perf-t4.mjs` **tam koşuyla
yeniden çalıştırılacak**: kabul ölçütü sayı listesidir, izlenim değil.

**Kabul ölçütleri (final koşuda doğrulanacak):**

| # | Ölçüt | Bugün | Hedef |
|---|---|---|---|
| 1 | erken oyun fps (§A · A1) | 116,7 | **≤ 62** (tavan tutuyor) |
| 2 | geç oyun kare süresi (§A · A3) | 55,1 ms | **belirgin düşüş** — K-C'nin kazancı ölçülecek |
| 3 | geç oyun çizim çağrısı | 171 | **düşmeli** (K-C'nin doğrudan ölçütü) |
| 4 | geç oyun commit/kare | 0,38 | **0,00–0,05** (K-E) |
| 5 | gölge | açık | **AÇIK KALIR** — kalite düşmedi denetimi |
| 6 | §B sürüklenme | eğilim yok | **eğilim yok** (yeni kod sızıntı getirmedi) |

---

# §F — UYGULAMA TURU (2026-09-18, ikinci oturum): K-A YAPILDI, K-E/K-C ÖLÇÜMÜ KOLLARI DEĞİŞTİRDİ

> Bu bölüm kararın (D-136) uygulanmasıdır. **K-A tamamlandı ve doğrulandı.** K-E ve K-C'ye
> dokunmadan önce ikisinin de *büyüklüğü* ölçüldü — çünkü ikisi de §Kollar tablosunda yalnız
> "saf perf" diye sınıflanmıştı, **kaç ms ettiği yazmıyordu.** Ölçülünce ikisinin de tarifi
> gerçeğe uymadı. Sayılar aşağıda; kararı kullanıcı verir.

## §F1 — K-A (60 fps tavanı) UYGULANDI

**Ne yapıldı.** `<Canvas frameloop="never">` + `KareSurucusu` (Scene.tsx): kareyi r3f'in kendi
döngüsü değil, tavanlı bir rAF sürücüsü ilerletir. Zamanlama kararı `src/game/kareTavani.ts`te
saf fonksiyon; bekçi `tests/kare-tavani-t4.test.ts` (17 denetim).

**İki incelik, ikisi de bekçide sayıya bağlandı:**

| # | İncelik | Silinirse ne olur | Hangi test yakalar |
|---|---|---|---|
| 1 | **Tolerans** (yarım ekran karesi erken çizme) | 144 Hz'de hedefin bir saç altındaki kare atılır → düzensiz tempo (judder) | "ekran tavanın katıysa tam düzenli kare atar" |
| 2 | **Sabit tempo + yakalama** | hedef her çizimde şimdiye sıfırlanır → hız tavanın ÜSTÜNE tırmanır (144 Hz'de 72 fps) | "tavan hiçbir frekansta aşılmaz" |

**Mutasyonla doğrulandı (4 mutasyon, 4'ü de yakalandı):** tolerans silindi → 2 test kırmızı ·
sabit tempo silindi → 5 test kırmızı · dt kısması silindi → 1 test kırmızı · EMA ilk kurulumu
tahminle → 1 test kırmızı.

**Aracın da düzeltilmesi gerekti (ve bu bir kusur kaydıdır).** Tavandan önce "rAF tiki" ile
"çizilen kare" aynı şeydi (`frameloop="always"` her tikte çizerdi), araç rAF'i sayıyordu. Tavanla
birlikte ikisi ayrıştı: araç rAF'i saymaya devam etseydi **"kare süresi 3 ms, fps 300"** gibi
anlamsız bir sayı üretir ve tavanı görmezdi. Örnekleyici artık `gl.info.render.frame`e bakar —
three bu sayacı her `render()`ta artırır, `info.reset()` onu sıfırlamaz. **Taban sayıları
etkilenmez** (o zaman tik = çizimdi), yani önce/sonra karşılaştırılabilir kalır.

**İkinci ölçüm sütunu — "iş ms".** Tavan konunca kareler-arası SÜRE artık işin maliyeti değil
tavanın aralığıdır (60 fps'te 16,7 ms, sahne ne kadar ucuz olursa olsun). Maliyet görünmez
olmasın diye `advance()` içinde geçen süre ayrı ölçülür (`perf.isMs`) ve tabloya girer.
Bu olmadan "tavan koydum, ms 8,3'ten 16,7'ye çıktı" diye yanlış okunurdu.

### §F1a — FİNAL TAM KOŞU: kabul ölçütleri

**Ham çıktı:** `docs/olcum-perf-t4-son.{txt,json}` (**TAM koşu damgalı**, taban dosyası ezilmedi).
Koşu makine boşken alındı; ilk deneme başka testlerle aynı anda koştuğu için **atıldı** (CPU
yarışı kare süresini şişirir, kirli sayı rapora girmez).

| # | Ölçüt | Taban | **Final** | Durum |
|---|---|---|---|---|
| ① | erken oyun fps (§A · A1) | 116,7 | **59,9** | ✅ ≤ 62 |
| ② | geç oyun kare süresi (§A · A3) | 55,1 ms | 53,8 ms | ⚠️ **açık — K-C yapılmadı** |
| ③ | geç oyun çizim çağrısı | 171 | 179 | ⚠️ **açık — K-C yapılmadı** |
| ④ | geç oyun commit/kare | 0,38 | 0,41 | ⚠️ **açık — K-E yapılmadı** |
| ⑤ | gölge | açık | **açık** (§D0/§D2) | ✅ kalite düşmedi |
| ⑥ | §B sürüklenme | eğilim yok | kare **−%5,5**, yığın **%0,0**, program **43 → 43** | ✅ yeni kod sızıntı getirmedi |

**②③④ bilerek açık.** Üçü de K-E ve K-C'nin ölçütleri; §F2/§F3 ikisinin de tarifini çürüttüğü
için kodları yazılmadı. ③'teki 171 → 179 artışı kolun gerilemesi değil **nüfus**: aynı koşuda
geç oyun NPC'si 38 → 40'a çıktı (§A) ve §B'de dilim 5'ten sonra 38 → 47'ye tırmandı, çizim
çağrısı da onunla birlikte 168 → 193 oldu. Yani çağrı sayısı NPC'yi izliyor — bu **§C'nin ve
K-D'nin** (müşteri tavanı, T3) alanı.

### §F1b — §E: TAVANIN KENDİSİ, AYNI KOŞUDA KANITLANDI

Erken oyun, aynı tohum, tek koşu. Kol `?f2fps=` ile seçilir (`game/devPerf.ts`).

| kol | **çizilen fps** | rAF fps | **iş ms** | çizim çağrısı |
|---|---|---|---|---|
| **E0** tavan YOK (K-A öncesi) | **133,8** | 134,0 | 6,4 | 36 |
| **E1** tavan 60 (**uygulanan**) | **59,7** | 89,3 | 7,1 | 36 |
| **E2** tavan 30 | 29,9 | 71,8 | 7,9 | 36 |

**Üç şeyi birden söylüyor:**
1. **Tavan tutuyor ve ayarlanabilir** — 133,8 → 59,7 → 29,9. Taban koşusundaki 116,7 ile aynı
   yöndeki bu 133,8, tavansız hâlin ekranın verdiği kadar çizdiğini doğruluyor.
2. **Hiçbir şey ucuzlamadı ya da bozulmadı** — karenin İŞİ üç kolda da 6,4-7,9 ms, çizim çağrısı
   **birebir 36**. Tavan işi hafifletmiyor; **boşa çizilen kareyi** kesiyor. Şarj kanadının
   istediği tam olarak buydu (§E: "8 ms'lik bir kare de saniyede 120 kez çizilirse pil yakar").
3. **"ms" sütunu artık yanıltmıyor** — tavanlı kolda 7,2 → 11,0 → 27,1 *artıyor*, çünkü o sütun
   kareler-arası ARALIK. Maliyet "iş ms"te ve o sabit. Bu ayrım olmasaydı final koşu
   *"tavan koydum, kare süresi %50 arttı"* diye okunurdu.

## §F2 — K-E'NİN BÜYÜKLÜĞÜ: React, geç oyun karesinin **%3,1'i**

Karar paketinde K-E "React commit'i 0,38 → 0" diye yazılıydı. *Commit sayısı* bir maliyet değil;
maliyet o commit'lerde harcanan **render süresidir** ve o hiç ölçülmemişti. React `<Profiler>`
ile ölçüldü (geç oyun, 20 masa, ~36 NPC, CPU 4× kısık, 10,5 sn):

| | ms / 10,5 sn | duvar saatinin payı | kare başına |
|---|---|---|---|
| DOM kökü (HUD, paneller) | 27,7 | %0,26 | 0,18 ms |
| Sahne kökü (r3f — üç boyut) | 297,2 | %2,83 | 1,94 ms |
| **TOPLAM React** | **324,9** | **%3,1** | **2,12 ms** |
| (aynı koşuda karenin İŞİ) | | | **~64 ms** |

**Yani K-E'nin tavanı 64 ms'lik karede 2,12 ms.** Sıfırlansa bile geç oyun 15,1 → ~15,6 fps olur.

**Üstelik "0" hedefi ulaşılabilir değil.** Commit'i hangi verinin doğurduğu ölçüldü (store
anahtarı ↔ commit eşleşmesi, 10 sn): commit ile **her seferinde** birlikte gelen anahtarlar
`notice` (7) · `ready` (3) · `cleanCups` (3) · `dishes` (3) · `autoCollectSum` (3) · `wallet` (2) ·
`lifetime` (2) · `stats` (1) · `xp` (1). Bunların hepsi **gerçek arayüz içeriği**: para değişti,
bildirim çıktı, temiz bardak sayısı değişti. Bunları React'ten çıkarmak "optimizasyon" değil,
HUD'u elle çizmeye başlamak olurdu. Her-kare-değişen veri (`npcs`, `coins`, konum) zaten
D-055'te React'ten çıkarılmış; kalan commit'ler o artığın değil, **içeriğin** kendisi.

## §F3 — K-C'NİN TARİFİ ÖLÇÜME UYMUYOR: tekrar edenler **iskeletli karakterler**

K-C "instancing: masa/sandalye/para/NPC" diye yazılıydı. Geç oyunda çizilen her mesh'in
geometri+materyal kimliği sayıldı (`onBeforeRender` ile — frustum kararını renderer'ın kendisi
verir, taklit edilmez):

| ölçü | sayı | okunuşu |
|---|---|---|
| kare başına çizilen mesh | 156 | (gl çizim çağrısı 147 — gölge geçişi dâhil) |
| **geometri NESNESİ / farklı ŞEKİL** | **151 / 88** | **63 kopya boşa** (%42) |
| **materyal NESNESİ / farklı GÖRÜNÜM** | **132 / 77** | **55 kopya boşa** (%42) |
| shader programı | 29 | |
| birden çok kez çizilen şekillerin toplam çizimi | **94 / 156** | instancing'in teorik hedefi |

**Ama tekrar edenlerin başı iskeletli:** en çok tekrarlanan 11 şeklin 10'u `skinIndex`/`skinWeight`
taşıyor (karakterler, 5-6 kopya). **`InstancedMesh` iskeletli mesh'i instance edemez** — her
NPC'nin kendi iskeleti ve kendi pozu var. Yani kolun adındaki "NPC" kanadı, bugünkü three
sürümünde doğrudan uygulanamaz. İskeletsiz tekrarlar ise küçük (12 üçgenlik kutu ×6).

**Sonuç:** K-C tek bir iş değil, en az dört ayrı iş ve hiçbiri "instancing" diye tek kelimeyle
yapılmıyor. Kollar ve büyüklükleri §F4'te.

## §F4 — K-C'NİN GERÇEK KOLLARI (ölçüldü, **seçilmedi**)

| Kol | Ne yapar | Ölçülen dayanak | Kalite | Büyüklük |
|---|---|---|---|---|
| **C-1** geometri/materyal paylaşımı | aynı şekli/görünümü tek nesneye indirir | §F3: 63 + 55 boşa kopya | değişmez | küçük-orta |
| **C-2** gölge DÖKENLERİ azalt (gölge AÇIK kalır) | çizim çağrısının gölge geçişi payını keser | §D1: gölge geç oyunda %21,7 · çağrının bir kısmı gölge geçişi | gölge kalkmaz, küçük objelerin gölgesi kalkar | küçük |
| **C-3** `BatchedMesh` (three r184) — tek materyalli duran objeler | çok mesh → **tek çizim çağrısı** | §F3: 94/156 çizim tekrar eden şekilden | değişmez | **büyük** |
| **C-4** iskeletli karakterler | tekrar edenlerin başı | §F3: en çok tekrarlanan 10 şekil iskeletli | — | **çok büyük** (doku-pişirme ister) |

---

# §G — KARE BÖLÜŞÜMÜ: KOLLAR BİR TUR BOYUNCA YANLIŞ YARIYA BAKMIŞ

> **Bu bölümün dersi, bulduğu sayıdan önemli.** T4'ün ilk turu karenin **toplamını** ölçtü
> (§A: geç oyunda 55,1 ms) ve beş kolun beşini de **çizim** tarafına yazdı: instancing, gölge,
> dpr, müşteri tavanı, React. Sonra karenin içi bölündü ve çizimin karenin **yarısı bile
> olmadığı** görüldü. Toplamı ölçmek darboğazın *büyüklüğünü* verir, **yerini vermez.**
> Bölüşüm artık aracın kalıcı bölümü (`§F`), her koşuda ölçülür.

## §G1 — Nasıl ölçülüyor

| kalem | nereden |
|---|---|
| `gl.render` toplamı ve **gölge geçişi** | sayfadan sarılarak (kaynağa dokunmadan) |
| `tick()` ve **18 sistemin her biri** | `src/game/olcum.ts` dikişi — DEV, **opt-in** |
| `findNavPath` | aynı dikiş; sistemlerin **içinden** çağrılır, ayrı kalem değil |
| karenin işi (`advance`) | `perf.isMs` (K-A ile eklendi) |

Dikiş kapalıyken sıcak yolda maliyeti **tek bir boolean okumasıdır**; üretim paketine girmez.
`runTick` bu turda sistem listesini **veriye** çevirdi (ad + fonksiyon): sıra tek yerde açıkça
duruyor ve ölçüm sistem adını oradan okuyor — liste iki yere yazılmıyor.

## §G2 — Bulgular

**SAYILAR:** `docs/olcum-perf-t4-son.txt` §F (**TAM koşu damgalı**, geç oyun, NPC 38, CPU 4× kısık).

| kalem | ms / kare | notu |
|---|---|---|
| **`findNavPath`** | **12,71** | **20,5 çağrı/kare · 0,62 ms/çağrı** |
| `npcSystem` (findNavPath dâhil) | 9,88 | tick'in en büyük sistemi |
| `waiterSystem` (findNavPath dâhil) | 2,51 | |
| `dishwasherSystem` | 0,59 | |
| kalan **15 sistem** toplamı | **< 0,25** | hiçbiri kendi başına %0,2'yi geçmiyor |
| `useFrame` (tick + dönüşüm) toplamı | 19,9 | |
| `gl.render` toplamı | 20,4 | |

**Okunuşu:** `tick()`in 18 sisteminden **üçü** ölçülebilir iş yapıyor ve üçü de aynı kaynağa
bağlı — `navStep`. `findNavPath` **12,71 ms/kare** ile karenin tek en büyük kalemi; `gl.render`in
TAMAMI 20,4 ms iken bir tek yol arama fonksiyonu 12,71 ms yiyor.

> ### ⚠ KUSUR 3 — bu koşuda §F'nin gölge kolu SABİT DEĞİLDİ
> §F sorgusuz açılıyordu; `CihazSinifiOlcer` (D-125) cihazı "zayıf" sayıp **gölgeyi kapattı** ve
> bölüşüm *"gölge haritası 0,2 ms"* raporladı — oysa **aynı koşunun §D'sinde gölge 12,5 ms**.
> Sayı yanlış değil, **karşılaştırılamaz**: §F başka bir yapılandırmayı ölçüyordu. Bu yüzden
> yukarıdaki tabloda **gölge/ana-geçiş ayrımı ve yüzdeler kullanılmadı** — yalnız `findNavPath`
> ve sistem başına **mutlak ms** okundu, o da gölgeden bağımsızdır (CPU tarafı).
> **Araç düzeltildi:** §F artık §D0 ile aynı kolda açılıyor (`?f2golge=2048`) ve gölge durumunu
> çıktıya yazıyor; kapalıysa satırın karşılaştırılamaz olduğunu kendisi bağırıyor. Yüzdeli tam
> bölüşüm **sıradaki koşuda** okunacak.

## §G3 — Kök: her karede sıfırdan yol arama

`navStep` (layout.ts) yürüyen her aktör için **her karede** `findNavPath` çağırıyor, dönen yolun
**yalnız ilk waypoint'ini** kullanıp gerisini atıyor. `findNavPath` ise tam BFS:

```
const prev = new Int32Array(cols * rows).fill(-2);   // her çağrıda YENİDEN
```

Izgara **114 × 90 = 10.260 hücre**. Yani her çağrı 41 KB ayırıp tamamını sıfırlıyor; kare başına
~17-18 çağrı ⇒ **~726 KB çöp ve ~180 bin hücre yazımı / kare**, arama maliyeti bunun üstüne.

## §G4 — Kollar (ölçüldü, **seçilmedi**)

| Kol | Ne yapar | Çıktı aynı mı | İş |
|---|---|---|---|
| **N-1** tamponu yeniden kullan (kuşak damgası ile `fill` kalkar) | ayırma + sıfırlama gider, arama aynı kalır | **BİREBİR AYNI** — bekçi testi kanıtlar | küçük |
| **N-2** yolu önbelleğe al (hedef değişince/yol tükenince yeniden ara) | çağrı sayısı 17,6 → ~1-2 / kare | çok yakın (ızgara durağan, BFS belirlenimci) ama birebir değil | orta |
| **N-3** görüş hattı kısayolu (engel yoksa BFS'siz) | açık zeminde aramayı tamamen atlar | yol biraz değişebilir | küçük |
| **N-4** aramayı karelere yay (aktör başına K karede bir) | maliyeti böler | duraksama görünebilir | küçük |

**Sıra önerisi: N-1 → ölç → gerekirse N-2.** N-1 tek başına *çıktısı birebir aynı* olan tek kol,
yani kaliteye dair sorulacak bir şey bırakmıyor; kazancı ölçüldükten sonra N-2'ye gerek olup
olmadığı sayıyla belli olur.

## §G5 — Bu, seçilmiş C-kollarını da yeniden sıralıyor

C-1…C-4'ün (§F4) hepsi çizim tarafında ve **gölge geçişine dokunamıyor**, yani hepsinin ortak
tavanı **ana geçiş**tir. `findNavPath` tek başına ondan büyük. Kasma kolu bu yüzden §G'ye kaydı;
C-kolları elenmedi, **sıraya alındı**.
