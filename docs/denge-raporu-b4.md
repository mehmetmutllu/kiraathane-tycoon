# Denge Raporu — B4 (ODA / lavabo): Kat 1'in SON gelir kolu

> 2026-09-07 · Ölçüm aracı `tools/simulate.ts` (B5b'de üç kollu hâle gelmişti) + geçici bir
> tarama betiği. Karar: **D-067**. Taban: `docs/denge-raporu-b5b.md` (D-066).

B5b bir plato bırakmıştı: oyuncu ~3,7 saatte hem tezgâhın hem masaların son ₺ seviyesine
ulaşıyor, oran **15,62 ₺/sn**'de donuyor ve şeridin sekiz masası tam o donmuş bandın içinde
akıyordu (Normal profilde **1,42 saat** boyunca gelir hiç büyümüyor). B4'ün işi bu platoyu
kırmaktı. Rapor önce **kolun nereye binmesi gerektiğini** ölçtü, sonra şeklini seçti.

---

## 1) Neden çarpan/throughput tartışması kapandı: Kat 1'de çay/dk kolu TÜKENMİŞ

Gelir üç tavanın en düşüğüyle sınırlı (B5b): `min(talep, arz, taşıma)`.

| durum | talep | arz | taşıma | darboğaz |
|---|---|---|---|---|
| L6 · 12 masa · 2 garson | 5,49 | 0,78 | 0,66 | taşıma |
| L6 · 12 masa · 3 garson | 5,49 | **0,78** | 0,80 | arz |
| L6 · 20 masa · 3 garson · tam karakter | 7,69 | **0,78** | 1,25 | arz |

Servis merdiveni ₺ ile L6'da bitiyor → **arz 0,78 fincan/sn'de tavan**. Taşıma tavanı tam
kadroda (3 garson + tepsi/hız kademeleri tamam) **1,25**. Yani throughput'ta kalan tüm baş
boşluğu **×1,6** ve arkası ölü: garson havuzu 3'te (onaylı), karakter kademeleri bitiyor,
`spawnInterval` zaten talebi arzın 7 katına çıkarmış durumda.

**Sonuç:** Kat 1'de gelirin büyüyebileceği tek yön **müşteri başına ₺**. Yeni throughput ancak
**Kat 2** ile gelir. ("Ekonomi = throughput" kuralı iptal olmadı — Kat 1 için tükendi.)

## 2) Aktif kâğıt döngüsü ölçüldü: yanlış değil, YANLIŞ ZAMANDA

Eski tasarım raporu (`docs/zone34-wc-floor2-design.md`) lavaboyu aktif kurmuştu: kâğıt biter,
oyuncu depodan taşır. Bu, oyuncunun **taşıma zamanını** yiyen bir angarya. Ölçüm:

| pencere | oyuncunun BOŞ zaman payı | kâğıt turu / sıklık | sonuç |
|---|---|---|---|
| L6 · 12 masa · 3 garson (**platonun tam yeri**) | **%5** (taşıma 0,80 vs arz 0,78) | 11 sn / 34 sn = zamanın **%31** | **geliri keser** |
| L6 · 20 masa · 3 garson (tam karakter) | %74 | 8 sn / 34 sn = %25 | bedava sığar |

Kâğıt taşıma, tam da platonun olduğu pencerede geliri **düşürür**; şerit dolduktan sonra bedava
sığıyor. → **Aktif WC döngüsü B4'ten çıkarıldı, Faz C/D'ye ertelendi** (o zaman taşıma kolunda
%74 boşluk var). B4 pasif kolu kurar.

## 3) Kolun BİÇİMİ — kullanıcı kararı: çarpan değil, ODANIN KENDİ İSTİFİ

İlk öneri "bahşiş çarpanı"ydı; kullanıcı reddetti (2026-09-07):

> *"lavabo geliri lavabo önünde istif olarak birikir... içeri gelen müşteriler çıkmadan lavaboya
> girip çıkabilir, girip çıkınca da ekstra orada da para birikir"*

Bu daha iyi bir karar, çünkü:
- **Para sunumu DEĞİŞMİYOR** — aynı `Coin`, aynı Model B′ istifi, yalnız ikinci bir düşme noktası.
- Gelir "sayının büyümesi" değil **mekânsal bir kazanç**: oyuncu gidip topluyor (aktif oynanış).
- Fiyat ve bahşiş kollarına hiç dokunulmuyor → **D-010 delinmiyor** (çay 5 ₺ sabit kalıyor).

## 4) Şekil taraması (Normal profil, taban: zincir sonu 5,35 sa · 8,59 ₺/sn · en uzun DÜZ 1,42 sa)

| şekil | zincir sonu | son oran | en uzun DÜZ aralık |
|---|---|---|---|
| taban (oda yok) | 5,35 sa | 8,6 (×1,0) | **1,42 sa** |
| 4 adım, adım başına ×1,62 | 4,82 sa | 28,8 (×3,4) | 19,3 dk |
| **6 adım, adım başına ×1,38** | **5,27 sa** | **28,9 (×3,4)** | **13,4 dk** |
| 6 adım ×1,30 | 5,49 sa | 21,7 (×2,5) | 17,8 dk |
| 6 adım ×1,45 | 5,12 sa | 37,1 (×4,3) | 11,9 dk |
| 8 adım ×1,28 | 5,70 sa | 29,9 (×3,5) | 15,3 dk |

**Kullanıcı ×1,38'i seçti.** Kritik nokta: seviye maliyet eğrisinin DİKLİĞİ, çarpanın kendisinden
daha belirleyici. Dik eğri (×1,7 büyüme) en uzun düz aralığı 41 dk'ya çıkarıyor; düz eğri
(4000/5000/7000/9000/11500) 13,4 dk'da tutuyor ve zincir süresini tabandan bile kısaltıyor.

## 5) Seçilen sayılar ve ölçülen sonuç

Kol MÜŞTERİ BAŞINA biner: `uğrama olasılığı × bırakılan ₺`. İki sinyal birlikte büyür (tek sinyal
yetmez kuralı): oda iyileştikçe **daha çok müşteri uğrar** (gözle görülür) **ve daha çok bırakır**.

| lavabo | uğrama | ücret | müşteri başına | idealize gelir |
|---|---|---|---|---|
| L0 (kapalı) | — | — | 0 | 15,62 ₺/sn |
| L1 (pad ile açılır, 3.000 ₺) | %30 | 18 ₺ | 5,4 | 19,84 |
| L2 (4.000 ₺) | %35 | 24 ₺ | 8,4 | ~22 |
| L3 (5.000 ₺) | %40 | 32 ₺ | 12,8 | ~26 |
| L4 (7.000 ₺) | %45 | 44 ₺ | 19,8 | ~31 |
| L5 (9.000 ₺) | %50 | 60 ₺ | 30,0 | ~39 |
| L6 (11.500 ₺) | %55 | 86 ₺ | 47,3 | **52,57** |

Simülatör çıktısı (idealize): `Servis L6 @2,05 sa → 13,13` · `LAVABO açıldı @2,20 sa → 19,84` ·
`Şerit yarısı @2,56 sa → 31,09` · `Lavabo L6 @2,75 sa → 52,57` · `ŞERİT DOLDU @2,86 sa`.
Normal profil: şerit **5,21 sa** (taban 5,35 — tempo bedeli YOK). **Servis L6'ya kadarki HER
satır taban ile birebir aynı** — erken/orta oyuna dokunulmadı.

**Görev hattı DÖNÜŞÜMLÜ:** bir şerit masası → bir lavabo seviyesi → bir masa... Dönüşümlü
olmazsa gelir yine donuyor; şeridin kuyruğu sabit hızda akıyor.

## 6) Modelin bilerek görmediği ve bunun yönü

Simülatör toplama kaybını `verim` çarpanına gömüyor; lavabo istifi **tek noktada** toplandığı
için 20 masaya dağılmış paradan daha VERİMLİ toplanır. Yani gerçek oyunda kol modelden biraz
**daha güçlü** çıkacak. Bekçi mantığı korunuyor: model iyimser değil karamsar tarafta.

## 7) Yan bulgu (B4'ün suçu değil, kayda geçti)

Normal profilde en uzun "hiçbir şey satın alınamayan" bekleme **26,9 dk** ve tabanda da var:
`zone3` pad'i (3.400 ₺). "20 dk'yı aşan tek alım kalmasın" ölçütünü aşan tek nokta. B4 bunu
değiştirmiyor (öncesinde duruyor); ayrı bir kalem olarak açık.
