# C3 — Sipariş kuyruğu ölçümü (D-046'nın kodda karşılığı)

**Tarih:** 2026-09-08 · **Araç:** `tools/olcum-kuyruk.ts`
**Ham çıktı:** `docs/olcum-kuyruk.txt` (mevcut kod) · `docs/olcum-kuyruk-varyant.txt` (beş kural karşılaştırması)
**Kod değişmedi:** karşılaştırma için `tick.ts`'e geçici enjeksiyon yapıldı, ölçüm bitince geri alındı.
Kontrol koşusu ile doğrulandı: enjeksiyonlu "acil" çıktısı, enjeksiyonsuz çıktıyla **birebir aynı**.

## 0. Neden ölçüldü

D-046 (2026-09-06) garson servisini beş kurala bağladı ve doğrulama satırında şunu yazdı:

> *Faz C'de simülatöre sipariş kuyruğu + üstlenme + starvation ölçümü eklenir; **"hiçbir masa X
> saniyeden fazla beklemedi" iddiası TESTE yazılır**. Bugün bu davranışların hiçbiri test edilmiyor.*

O test yazılmadı ve cümle iki tur devredildi. C1'in dersi (*devralınan bir bulgu, yeni yazılan bir
tahmin kadar bayatlar*) burada da geçerli olduğu için **bekçi yazmadan önce ölçüldü**.

**Nasıl:** ikinci bir model kurulmadı. `simulate.ts` analitik bir **debi** modelidir (kim darboğaz?);
kuyruk ise **konum ve zaman** sorusudur. Bu yüzden oyunun **kendi `tick()`'i** başsız koşturuldu
(`tick-fingerprint.ts` deseni: tohumlu `Math.random` + sahte `localStorage`) ve her karede NPC
durumları örneklendi. Dört senaryo × 900 sn × dt 0,1.

**Oyuncu sokakta park edildi.** Ölçülmek istenen şey garson havuzunun **kendi başına** ne yaptığı;
oyuncu servise karışsaydı ölçüm "oyuncu ne kadar iyi oynadı"yı ölçerdi. Bu aynı zamanda gerçek bir
oyun durumudur (idle/AFK). **Bu bir kısıttır:** aşağıdaki terk oranları, oyuncunun hiç servis
yapmadığı hâli gösterir — tasarım gereği (`feedback_active_play_no_overautomation`) oyuncu asıl
taşıyıcıdır. Bu yüzden **terk oranı bir kusur ölçütü değildir**; kusur ölçütleri debi, tur süresi
ve masalar arası **yayılım**dır.

## 1. D-046'nın beş kuralı — kodda ne var, ne yok

| # | Kural | Durum |
|---|---|---|
| ① | Havuz **global** | ✅ D-060'ta uygulandı |
| ② | **Üstlenme bağlayıcı** — hedef teslim edilene kadar değişmez | ❌ **YOK** (aşağıda ölçüldü) |
| ③ | Öncelik "en yakın" değil **"en acil"** | ✅ uygulandı — ama işe yaramıyor (§3) |
| ④ | Sabır sipariş boyuna bağlı | 🟡 kaba hâli var (`PRODUCTS.patienceMult`) — D-046 bunu kendisi "kaba hâl" diye niteliyordu |
| ⑤ | Garson sayısı türetilir + HUD "garsonlar yetişemiyor" der | ❌ yok (`grep`: böyle bir bildirim yok) |

Sipariş nesnesi `{çay:1, tost:2}` **bilerek** v1.1'de (v1.0 kapsam çizgisi, `progress.md`).

**②'nin kodda karşılığı yok, çünkü `claimed` kümesi yalnız O KARE için geçerli** (`tick.ts`
`waiterSystem`): garsonun hedefi **her karede yeniden** "sabrı en az kalan"a göre seçiliyor. Bir
kare sonra listedeki en acil kişi değişirse garson yolun ortasında dönüyor.

## 2. Ölçülen: üstlenme gerçekten dağılıyor

"Üstlenme" ölçütü = *yüklemeden **ilk** teslimata kadar, teslim edilen masaya olan mesafenin toplam
**artışı** ÷ başlangıç mesafesi.* Hedefini koruyan garsonda ~0 (engel dolanması küçük bir artış
üretir); hedef değiştirende büyür. Yalnız **ilk durağa** kadar ölçülür — sonraki duraklar meşru
olarak yön değiştirir.

| senaryo | mevcut kod (acil) | bağlayıcı | ulaşılır | yakın |
|---|---|---|---|---|
| G2 · 8 masa · 1 garson | ort **0,21** · en kötü **1,85** | 0,08 · 1,74 | 0,00 · 0,00 | 0,01 · 0,50 |
| G3 · 12 masa · 2 garson | ort **0,47** · en kötü **5,59** | 0,07 · 2,00 | 0,00 · 0,16 | 0,09 · 1,71 |
| G4 · 20 masa · 3 garson | ort **0,55** · en kötü **3,00** | 0,11 · 1,44 | 0,01 · 0,36 | 0,04 · 1,31 |

**Mevcut kural, dört kural içinde tek "gezinen" olan.** En kötü durumda garson, teslim ettiği
masadan **başlangıç mesafesinin 5,6 katı** kadar uzaklaşıp geri dönüyor. Bu yalnız debi kaybı
değil, **görsel bir kusur**: garson kararsız gidip geliyor.

Bedeli tur süresinde: G4'te tam tur **46,6 sn**, `simulate.ts` modelinin beklediği **19,8 sn**
(**×2,35**). `economy.config.ts`'in garson hız yorumundaki *"L1 tek yön ~5,8 sn, tur ~12 sn < sabır
18 sn"* cümlesi **bayat** — ölçülen tur 17,8 (G2) ile 46,6 sn (G4) arasında.

## 3. "En acil" kuralı starvation'ı ÖNLEMİYOR

③'ün gerekçesi *"tezgâha uzak masalar starvation çekmesin"*di. Ölçüm bunu **doğrulamıyor**:
masa mesafesi ile terk oranı arasındaki korelasyon mevcut kuralda **+0,53 … +0,83** — yani uzak
masa hâlâ daha çok terk ediyor.

Mekanizma: kural her karede **sabrı bitmek üzere olanı** seçiyor. Doygun mekânda bu kişi çoğu zaman
garson varmadan zaten kalkıyor; garson yeni "en acil"e dönüyor, o da kalkıyor. Sıra beklemeyi
azaltmıyor, garsonu **her zaman en umutsuz masaya** koşturuyor. (Çizelgeleme literatüründe bilinen
hâl: son-teslim-tarihi önceliği yalnız sistem doygun DEĞİLKEN optimaldir; doygunlukta savrulur.)

## 4. Beş kuralın karşılaştırması (900 sn'de servis edilen müşteri)

| kural | G2 (8/1) | G3 (12/2) | G4 (20/3) | G4 mesafe↔terk kor. | G4 terk yayılımı |
|---|---|---|---|---|---|
| **acil (MEVCUT)** | 100 | 101 | 172 | +0,53 | %57 – %100 |
| bağlayıcı + acil (D-046 harfiyen) | 89 | **122** | **214** | **+0,35** | %60 – %100 |
| ulaşılır | 278 | 209 | 285 | +0,90 | %19 – %94 |
| bağlayıcı + ulaşılır | 278 | 172 | 294 | +0,90 | %27 – %97 |
| yakın | **291** | 204 | **332** | +0,96 | %5,6 – %100 |

Okunuşu: **debi ile adalet ters yönde.** "Yakın" en çok müşteri servis ediyor ama uzak masaları
tamamen bırakıyor (korelasyon 0,96). **"Bağlayıcı + acil" en adil** olan (korelasyon 0,53 → 0,35;
G2'de yayılım %58-100'den **%77-89**'a daralıyor) **ve mevcut kuraldan %21-24 daha hızlı** — yani
D-046'yı harfiyen uygulamak bugünkü hâlden her iki eksende de iyi.

"Ulaşılır" süzgeci en hızlılardan ama **dt'ye duyarlı**: aynı senaryo dt 1/30 ile koşulduğunda G3
209 → 120 servise düşüyor (%-43). Sert bir eşik olduğu için kırılgan; mevcut kuralın dt duyarlılığı
%-9, "yakın"ınki %+8.

## 5. G1 bir garson ölçümü değil — BARDAK ölçümü

4 masa · 1 garson · bulaşıkçı yok · oyuncu yok senaryosunda 15 dakikada **yalnız 18 müşteri**
oturuyor. Sebep taşıma değil: **karelerin %90,8'inde temiz bardak sıfır.** Garsonun tepsisi
karelerin yalnız %6,6'sında dolu ve turu (10,0 sn) modelin beklediğine (9,4 sn) çok yakın —
yani garson boş duruyor, çünkü demlenecek bardak yok.

Bu **tasarım gereği** olabilir (oyuncu bulaşığı yıkamalı, `cups` bölümünün amacı bu) ama
kayda geçmesi gerekiyor: **erken oyunda AFK, bardak havuzunda kilitleniyor**, garson kolunda değil.

## 6. simulate.ts'in taşıma modeli iyimser

`carryRateOf` garsonu **hedefi hiç değişmeyen, tepsi dolusu götürüp boş dönen** bir taşıyıcı
sayıyor. Gerçekleşen (mevcut kod):

| senaryo | modelin beklediği | ölçülen | oran |
|---|---|---|---|
| G2 | 7,49 müşteri/dk | 6,67 | %89 |
| G3 | 11,08 | 6,73 | **%61** |
| G4 | 27,28 | 11,47 | **%42** |

Model bir TAVAN değil (ortalama masa mesafesi kullanır — yalnız yakın masaya servis eden bir kural
onu aşabilir, "yakın" G2'de %259 veriyor). Ama **mevcut kuralla masa sayısı büyüdükçe açık da
büyüyor**: 8 masada %11, 20 masada %58 sapma. C1'in "taşıma kolu" hesapları bu iyimser modelden
geliyor → **C4/C5'in "sim'i gerçeğe yaklaştır" işinin somut ilk kalemi bu.**

## 7. "Hiçbir masa X saniyeden fazla beklemedi" — X ne?

Ölçülen (mevcut kod, servis EDİLENLER): en uzun bekleme G2 **19,9 sn** · G3 **34,9 sn** ·
G4 **41,4 sn**. Bu sayılar sabır tavanının (G2 20,0 · G3 22,0/35,2 · G4 26,0/41,6 sn) hemen
altında — çünkü **sabrı aşan bekleme zaten "terk" olarak sayılıyor, "bekleme" listesine girmiyor.**

Yani D-046'nın cümlesi bugünkü mimaride **kendiliğinden doğru ama boş**: bekleme süresi sabır
tavanıyla zaten kelepçeli. Anlamlı bekçi süre değil, **yayılım + debi** olmalı:

1. hiçbir masanın terk oranı, en iyi masanınkinin K katından fazla olmasın (adalet),
2. garsonun tam turu modelin beklediğinin N katını aşmasın (üstlenme/gezinme),
3. üstlenme ölçütü (ilk durağa dek uzaklaşma) bir eşiğin altında kalsın.

Eşikler kural kararı verildikten sonra, ölçülen değerden marjla donacak.

## 8. Sonuç ve karar noktası

**Kusur:** D-046'nın ② numaralı kuralı hiç uygulanmadı; ③ ise uygulandığı hâliyle amacını
(starvation'ı önlemek) **karşılamıyor** ve debiyi düşürüyor.

**Denge sayısı değişmedi; bu turda hiçbir davranış değişmedi.** Sıradaki adım bir **karar**:
garsonun teslimat önceliği ne olsun? Seçenekler ve ölçülen bedelleri §4'te. Karar verilmeden
bekçi testinin eşikleri donmaz, çünkü eşikler seçilen kuralın sayılarından türeyecek.

**Not:** hangi kural seçilirse seçilsin, `tests/logic.test.ts`'teki *"garson en ACİL (sabrı en az)
bekleyene gider — yakın ama sabrı bol masa atlanır (anti-starvation)"* testi (satır 351) mevcut
kuralı bekçiliyor; kural değişirse o test de değişir.
