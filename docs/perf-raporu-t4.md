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
