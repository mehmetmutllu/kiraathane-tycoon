# Denge raporu — B5b (2026-09-07)

> Girdi: B5a'nın ölçümü ("şeridin son 8 masası 194.300₺, gelir orada sabit").
> Bu rapor o girdiyi doğrulamak için modeli sökmüş ve **sorunun eğri olmadığını** bulmuştur.
> Sayılar `tools/simulate.ts` + `src/config/economy.config.ts`'ten türetilmiştir; hiçbir sayı
> koda uygulanmamıştır — bu rapor KARAR ister.

---

## 0. Tek cümlelik özet

Şeridin kuyruğu pahalı olduğu için değil, **Kat 1'in gelir tavanına şerit başlamadan ÖNCE
ulaşıldığı için** grind. Masa açmak bu ekonomide hiçbir zaman gelir kolu olmadı; eğriyi
yassılaştırmak beklemeyi kısaltır ama platoyu kaldırmaz.

---

## 1. Modelin söylediği: arz tek noktanın demleme hızı, ve o hız 5,7 KOLTUK besliyor

`gelir = min(talep, arz) × (fiyat + bahşiş)` · `talep = koltuk / döngü` · `arz = 1 / demleme`

Talep ≤ arz koşulu sadeleşince: **koltuk ≤ (yürüme + içme) / demleme + 1**

| servis | demleme | arz (bardak/sn) | **doyurduğu koltuk** | ortalama fiyat |
|---|---|---|---|---|
| L0 | 6,00 sn | 0,167 | **2,00** | 5,00 ₺ |
| L1 | 4,44 sn | 0,225 | **2,35** | 5,00 ₺ |
| L2 | 3,29 sn | 0,304 | **2,82** | 5,00 ₺ |
| L3 | 2,44 sn | 0,410 | **3,46** | 5,00 ₺ |
| L4 (TEZGÂH) | 1,81 sn | 0,554 | **4,32** | 5,00 ₺ |
| L5 (TOST) | 1,62 sn | 0,618 | **4,71** | 10,00 ₺ |
| L6 (₺-max) | 1,28 sn | 0,781 | **5,69** | 12,00 ₺ |

Katın koltuk sayısı ise (B5a sonrası): masa L0'da 20, **masa L4'te 56 koltuk**.

### Sonuç: oyun 3. masadan itibaren ARZ-kelepçeli

| durum | koltuk | talep | arz | kim kelepçeliyor | gelir |
|---|---|---|---|---|---|
| 2 masa · servis L0 | 2 | 0,17 | 0,17 | tam sınırda | 0,83 ₺/sn |
| 3 masa · servis L1 | 3 | 0,29 | 0,23 | **arz** (1,3×) | 1,13 ₺/sn |
| 4 masa · servis L2 | 4 | 0,43 | 0,30 | **arz** (1,4×) | 1,52 ₺/sn |
| 8 masa · servis L3 | 8 | 0,95 | 0,41 | **arz** (2,3×) | 2,05 ₺/sn |
| 12 masa · L6 · masa L2 | 24 | 3,30 | 0,78 | **arz** (4,2×) | 12,50 ₺/sn |
| 20 masa · L6 · masa L4 | 56 | 7,69 | 0,78 | **arz** (9,8×) | 15,62 ₺/sn |

**Yani `table3`'ten (≈3. dakika) itibaren açılan HİÇBİR masa geliri artırmıyor.** B5a'nın 8 masası
bu gerçeğin yalnız son ve en pahalı dilimi; 16 masa pad'i, toplam ~350.000₺, ölçülebilir gelir
katkısı **sıfır**. Simülasyonun "B5a dengeyi hiç değiştirmedi" demesinin sebebi de budur: masa
sayısı bu modelde geliri zaten değiştiremez.

---

## 2. Asıl sorun: gelir tavanına şerit BAŞLAMADAN ulaşılıyor

Gelirin iki kolu var ve ikisi de şeritten önce tükeniyor:

| kol | tavan | ne zaman dolar (idealize / Normal) |
|---|---|---|
| **Arz** — servis merdiveni | L6 (₺ tavanı; L7+ Faz D'nin 💎 katmanı) | 2,03 sa / **3,69 sa** |
| **Bahşiş** — masa seviyesi | L4 (₺ tavanı), bahşiş 8₺ | ~24 dk / 43,5 dk |

L6'dan sonra oran **15,62 ₺/sn'de donuyor** ve bir daha hiç değişmiyor. Bugünkü zincirde
şeridin sekiz masası tam bu donmuş bandın içinde duruyor:

| (Ö5'ten sonraki ölçüm, Ö1'den önce) | Yoğun | **Normal** | Rahat |
|---|---|---|---|
| Servis ₺-max L6 (tavan) | 2,56 sa | **3,72 sa** | 5,85 sa |
| ŞERİT DOLDU (20. masa) | 7,09 sa | **10,31 sa** | 12 sa'de bitmiyor |
| **plato süresi** | 4,5 sa | **6,6 sa** | — |

Taşıma kolu (§5) bu platonun ilk ~45 dk'sını gerçek ilerlemeye çeviriyor (garson + tepsi
yükseltmeleri); geri kalanı sabit.

**Kat 1'in geç-oyununda 6 saatlik, tamamen sabit hızlı bir plato var.** Kullanıcının onaylı
tempo kuralı ise "zone ~1 sa+ aktif" idi (`feedback_economy_pacing_offline`); 3. Alan bugün
1,83 sa'de açılıp 9,74 sa'de bitiyor → **~8 saat**.

---

## 3. Eğriyi yassılaştırmak sorunu ÇÖZMÜYOR (ölçüldü)

Şeridin sekiz pad'i dört ayrı eğriyle ölçüldü (başka hiçbir sayı değiştirilmedi):

(Taşıma kolu aktif — Ö5'ten sonraki ölçüm.)

| eğri | 8 masanın toplamı | 16. masa (Normal) | **20. masa** (Yoğun / Normal / Rahat) |
|---|---|---|---|
| **×1,4545 (B5a)** | 194.300 ₺ | 4,92 sa | 7,09 / **10,31** / — |
| ×1,25 | 79.300 ₺ | 4,47 sa | 4,31 / **6,27** / 9,86 sa |
| **×1,15 (seçilen)** | 51.100 ₺ | 4,31 sa | 3,63 / **5,28** / 8,30 sa |
| ×1,08 | 36.850 ₺ | ~4,1 sa | ~3,2 / **~4,8** / ~7,5 sa |

Fiyatı **beşte bire** indirmek şeridin dolumunu yalnızca 10,31 → ~4,8 sa'e çekiyor; çünkü kalan
sürenin çoğu şeridin fiyatı değil, **onun arkasındaki donmuş oran**. ×1,15 ile ×1,08 arasındaki
fark ~0,5 sa — eğriyi daha da ezmenin getirisi yok, tek etkisi masayı bedavaya yaklaştırmak.

---

## 4. Üçüncü tavan: müşteri GELİŞİ katla büyümüyor

`spawnInterval` sabit 1,6 sn/grup (ortalama grup 2,2 kişi) → **geliş tavanı ≈ 1,38 kişi/sn**,
kat ne kadar büyürse büyüsün. Config'in kendi yorumu ("talep kapasiteyi takip eder, boşalan
koltuk bu sürede dolar") ile kod uyuşmuyor: timer küresel ve sabit.

Sonuçları:
- Arz 0,78 < geliş 1,38 → gelen müşterinin **~%43'ü** çay gelmeden sabrı taşıp gidiyor.
- Aynı anda dolu tutulabilen koltuk ≈ geliş × ortalama kalış ≈ **~28 koltuk** →
  **56 koltuğun yarısı hiçbir zaman dolmuyor.** Şerit görsel olarak da tam dolmayacak.

---

## 5. Taşıma kolu — ÖLÇÜLDÜ (ilk tahmin yanlıştı)

`simulate.ts` taşımayı hiç modellemiyordu; verim çarpanının (0,80/0,55/0,35) içinde saklıydı.
Bu bölüm önce geometriden **tahmin** ediyordu ("taşıma ~1,1 > arz 0,78, yani darboğaz değil").
**Ö5 uygulanıp gerçek BFS yollarıyla ölçülünce bu tahmin YANLIŞ çıktı** — ortalama yol
sanılandan uzun ve garson turu tepsiyle ölçeklenmiyor:

| durum | ort. yol | talep | arz | **taşıma** | darboğaz | gelir |
|---|---|---|---|---|---|---|
| 4 masa · L2 · 1 garson | 6,3 br | 0,43 | 0,30 | 0,81 | arz | 1,52 ₺/sn |
| 8 masa · L3 · 1 garson | 15,0 br | 1,90 | 0,41 | 0,59 | arz | 2,87 ₺/sn |
| **12 masa · L6 · 2 garson** | 19,6 br | 5,49 | 0,78 | **0,66** | **TAŞIMA** | **13,13 ₺/sn** |
| 12 masa · L6 · **3 garson** | 19,6 br | 5,49 | 0,78 | 0,80 | arz | **15,62 ₺/sn** |
| 20 masa · L6 · 3 garson (tam karakter) | 17,5 br | 7,69 | 0,78 | 1,25 | arz | 15,62 ₺/sn |

**Düzeltmeler:**
- **Taşıma, tezgâhtan (L4) sonra gerçek darboğaz.** Oran L6'da 15,62 değil **13,13 ₺/sn**;
  eski ölçümler bu kaybı görmüyordu (şerit dolumu 9,74 değil **10,31 sa** imiş).
- **3. garson ölçülebilir bir şey satın alıyor: +%19 gelir** (13,13 → 15,62), 6000₺ **~40 dk**'da
  amorti. Bu bölümün ilk hâli "hiçbir şey satın almıyor" diyordu — yanlıştı.
- Karakter tepsi/hız ve garson tepsi kademeleri de gerçek gelir kolu: taşımayı 0,66 → 1,25'e
  çıkarıyorlar. L6 döneminde **~45 dk'lık gerçek ilerleme** bu koldan geliyor.
- Garsonlar yalnız başına arzı taşıyamıyor → D-014'ün "kısmi assist" niyeti DOĞRU çalışıyor.

**Ama plato bulgusu duruyor:** taşıma kolu da tükendiğinde (3 garson + tam karakter) darboğaz
yine arza (0,78) dönüyor ve oran 15,62'de donuyor. Kol platoyu ~45 dk geciktiriyor, kaldırmıyor.

> **Yeni bulgu — `waiter3` görünmüyor.** Sim'in güttüğü oyuncu (görev hattı) 3. garsonu HİÇ
> tutmuyor: `waiter3` kritik yol dışı (`optional: true`) ve görev hattında yok. Yani oyunun
> o andaki EN İYİ alımı (+%19, 40 dk amortisman) oyuncuya hiç söylenmiyor. → Ö6.

> Bu bölümün ilk hâli B5a'nın dersinin tekrarıydı: elle yapılan bir tahmin de tıpkı elle yazılmış
> bir test dizisi gibi bayatlar. Ölçmeden önce yazılan cümle bir varsayımdır.

---

## 6. Neden "arzı şişirmek" ÇÖZÜM DEĞİL

Masaların gelir getirmesi için arzın ~10 katına çıkması gerekir (0,78 → 7,7 bardak/sn). O zaman:
- Taşıma tavanı (~1,1) yolu keser → oyuncu ve garsonlar yetişemez;
- Geliş tavanı (1,38) yolu keser → müşteri yok;
- Ekranda aynı anda **58 NPC** olur (`maxConcurrent = koltuk + 2`) → mobil performans.

Üçünü birden açmak "elle servis + aşırı otomasyon yok" kuralını (`feedback_active_play_no_overautomation`,
D-014) iptal etmek demek. **Bu oyunun throughput tavanı ~1 bardak/sn'dir ve bu bilinçli bir
tasarım sonucudur.** 56 koltuk o tavanla uyumsuzdur — düzeltilmesi gereken arz değil, **masa
sayısının ekonomik iddiasıdır**.

---

## 7. ÖNERİ — "Masa ALAN satar, gelir satmaz"

### Ö1 · Şerit eğrisi ×1,4545 → **×1,15** (194.300 → 51.100 ₺) — ✅ UYGULANDI
`3700 · 4250 · 4900 · 5650 · 6500 · 7500 · 8650 · 9950` (fillRate = maliyet / 3,5 sn)
Gerekçe: masa gelir çarpanı değil, alan/atmosfer/oturma alımı — fiyatı da öyle olmalı.
Ölçüldü (taşıma kolu aktifken): şerit dolumu 10,31 → **5,28 sa** (Normal); Rahat profil ilk kez
bitirebiliyor (**8,30 sa**; eskiden 12 saatte bitmiyordu). ×1,08'in getirisi 0,5 sa → gereksiz.
Servis L6'ya kadarki HER satır birebir aynı kaldı (erken oyuna dokunulmadı).

### Ö2 · Geç-oyun gelir kolu **B4'ün lavabosudur** — plan sırası düzeltilsin
B4 zaten "lavabo: oturma eklemez, **pasif çarpan**, kendi seviyeleri" diye planlı; yani platoyu
kıracak kol defterde VAR, ama şeridin ARKASINA konmuş. Öneri: **B4 önce, sonra şeridin fiyatı
yeniden ölçülür.** (D-063 gibi bir plan düzeltmesi.) Ö1 bu arada beklemeyi yarıya indirir.
- Taşıma kolu (garson/tepsi) platoyu ~45 dk geciktiriyor ama kaldırmıyor (§5) — B4 hâlâ gerekli.

### Ö6 · `waiter3` kritik yol dışında kalmasın (YENİ — §5'in bulgusu, onay bekliyor)
3. garson o andaki en iyi alım (+%19, ~40 dk amortisman) ama `optional: true` ve görev hattında
yok → güdülen oyuncu onu hiç tutmuyor ve L6 dönemini %19 eksik gelirle geçiyor.
Seçenekler: (a) görev hattına eklensin (kritik yol olur), (b) opsiyonel kalsın ama görev
hattı ona bir kez işaret etsin, (c) `count: 4` eşiği düşsün de daha erken görünsün.
**Öneri: (b)** — omurga şişmez, oyuncu körlüğü kalkar, "opsiyonel derinlik" kararı korunur.

### Ö3 · Bahşiş seyrelmesi kapatılsın
Bugün servis edilen bardak sayısı sabit olduğu için **yeni açılan L0 masa ortalama bahşişi
DÜŞÜRÜR** — yani 13. masayı açmak geliri kısa vadede azaltır. Öneri: müşteri boş masalar
arasında **en yüksek seviyeliyi** seçsin (konfor arar). Hem seyrelme kapanır hem masa
yükseltmesi gözle görülür olur (iyi masalar hep dolu). Davranış değişikliği → **kendi adımı**
(`findTableForGroup`).

### Ö4 · Ödüllü video = **geçici demleme çarpanı** (×2, 60 sn)
Kullanıcının fikri buraya tam oturuyor: kol arz tarafında, opsiyonel, yalnız hızlandırır,
ilerleme için zorunlu değil (`docs/monetization.md`). Faz 5'in işi; kararı burada kayda geçer.

### Ö5 · `simulate.ts`'e TAŞIMA kolu eklensin
`gelir = min(talep, arz, TAŞIMA) × ...`. Aksi hâlde garson/tepsi/karakter fiyatları ölçülemez
ve her ölçüm §5'teki kör noktayı tekrarlar.

---

## 8. B5b'nin dört sorusuna cevaplar

| # | Soru | Cevap | Gerekçe |
|---|---|---|---|
| 1 | Eğri ×1,4545 kalsın mı? | **Hayır → ×1,15** | Masa gelir üretmiyor; fiyatı alan fiyatı olmalı (§1, §3) |
| 2 | L6 sonrası throughput kolu? | **Evet, şart — ama B4'ün lavabosu** | Garson/tepsi kol değil (§5); arzı şişirmek kuralları bozar (§6) |
| 3 | a2 eşiği `z3table4`'te kalsın mı? | **Evet, kalsın** | Bahşiş kolu L6'dan önce zaten tükeniyor; ileri atmak platoyu uzatır (§2) |
| 4 | `waiter3`'ün `count: 4`'ü büyüsün mü? | **Hayır — eşik değil, GÖRÜNÜRLÜK sorunu** | Ö5 ölçtü: 3. garson +%19 gelir alıyor ama oyuncuya hiç söylenmiyor → Ö6 |

> Soru 4'ün ilk cevabı ("3. garson hiçbir şey satın almıyor, dokunma") elle yapılmış bir
> tahmine dayanıyordu ve Ö5'in ölçümü onu çürüttü. Kayda geçen cevap yukarıdakidir.

---

## 9. Durum

| | iş | durum |
|---|---|---|
| **Ö5** | `simulate.ts` taşıma kolu (üçüncü tavan + darboğaz teşhisi) | ✅ uygulandı |
| **Ö1** | şerit eğrisi ×1,15 (51.100₺) | ✅ uygulandı · vitest 255/255 |
| **Ö4** | ödüllü video kararı `docs/monetization.md`'ye | ✅ yazıldı (uygulama Faz 5) |
| **Ö2** | plan sırası: **B4 → şeridin son fiyatı** | ✅ `progress.md` + D-066 |
| **Ö3** | müşteri en yüksek seviyeli boş masayı seçsin | ⏳ kendi adımı (davranış) |
| **Ö6** | `waiter3` görünürlüğü | ⏳ **onay bekliyor** (a/b/c) |

### Reddedilen: "eksik kalırsa reklamla masayı aç"
Kullanıcının fikri; `monetization.md` bu ödülü zaten meşru sayıyor ("anında pad"), yani kural
ihlali değil — **gereksiz**. Bu düğmenin yeri "tek bir alım çok uzun sürüyor" olurdu; Ö1'den
sonra hiçbir tek alım ~20 dk'yı geçmiyor (şeridin en pahalı masası 9.950₺ ≈ 10,6 dk; oyundaki
en büyük tek harcama karakter tepsisi T4, 18.000₺ ≈ 19,2 dk). Ayrıca tempo sorununu eğriyi
düzelterek çözmek varken reklamla geçiştirmek türün bilinen tuzağı: **duvarı indirmek varken
duvarı aşmayı satmak.** B4 ölçümünden sonra 20 dk'yı aşan tek bir alım kalırsa yeniden açılır.
