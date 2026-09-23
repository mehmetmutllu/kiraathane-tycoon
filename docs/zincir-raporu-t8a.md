# T8a — ZİNCİR SIRASI (G-86) + T3 DENGE KOLLARI + BARDAK HAVUZU

> Karar: **D-142** (2026-09-23) — PK2 · garson tepsi tavanı 4 · seviye ₺ 60 sn (Sv 5'ten) · nokta kapısı
> Araçlar: `tools/olcum-t8a.ts` → `docs/olcum-t8a.txt` (sim, HRE + D-124) ·
> `tools/olcum-bardak-t8.ts` → `docs/olcum-bardak-t8.txt` (oyunun kendi `tick`'i)
> Sim'e iki kanca eklendi (`garsonTepsiTabani` · `durtusel`), ikisi de varsayılanda kapalı: taban
> çıktısı birebir aynı (`sim-model` · `meta-pencere` · `tempo-olcutu` bekçileri yeşil).
> Commit #1 (`aa387c8` · `e0c9f7b`) denge dosyasına dokunmadı; commit #2 kararı uyguladı.

## §0 Soru

Kullanıcı, 2026-09-21 (`docs/geribildirim-oyun-testi-2026-09-21.md`):

> **G-86** *"garson veya bulaşıkçı sıralaması görev sıralamaları vs mantıksal olarak sence okey mi?
> bazı yerlerde sanki saçma ya ama bilemedim"*

Beş şüphe (aynı dosya §D): ① elle bulaşık dönemi uzun · ② garson bulaşıkçıdan çok önce ·
③ 2. garson Salon 3'ün iki masası açılmadan · ④ tost geç ve seviye olarak · ⑤ garson tepsi-3 hatta yok.
④ G-85 ile aynı kök → **T8b**. Ayrıca 2026-09-18 planının T3 kolları (K1-K11,
`docs/plan-geribildirim-2026-09-18.md`) T8'e bağlanmıştı; K9/K10 mekân işi olduğu için T8b'de.
T6'nın yan bulgusu (bardak havuzu 20 masaya 42) da bu turda.

**T8'in bölünmesi:** T8a = sayı · T8b = tezgâh arkası (G-85 tost noktası · G-90 asset · K9 bulaşık
kuyruğu · K10 duvar payı). Kesme çizgisi mantık/görsel (`feedback_task_splitting`).

## §Bulgular

Tüm sayılar tam koşu (`OLCUM=tam`, damgalar temiz). Ölçütler: ilk alım < 90 sn · açılış boşluğu
≤ 2 dk · otomasyon (garson) < 15 dk · HÜKÜM = İdealize'de 20 dk'yı aşan alım (D-087, ≤ 1) · GÖZLEM =
Normal'de aşan alım (D-095 bandı) · KAT 1 = Normal profilde 20. masa.

### Bulgu 1 — sim'in tabanı oyunun sıra kuralını oynamıyordu: D-124 Kat 1'i %6,7 kısaltıyor

Sim masa yükseltmesini SERBEST sırayla (en ucuz) alıyordu; oyunda D-124'ten beri TEK HEDEF kuralı
geçerli. T7 dahil bütün yığın ölçümleri serbest sırayla koştu. Bu turun tabanı (T0) tek hedeftir;
eski taban `K6T` satırıdır ve T7'nin sayısını birebir verir (damga: 23 323 sn · aşan 2/0).

| kol | Kat 1 | GÖZLEM (Normal aşan · en uzun) | 20 dk'yı aşanlar |
|---|---|---|---|
| **T0 tek hedef (oyundaki kural)** | **6,05 sa** | **1 · 29,7 dk** | servis L6 |
| K6T serbest + en ucuz (T7'nin tabanı) | 6,48 sa (+%7,1) | 2 · 29,5 dk | zone3 · servis L6 |
| K6B genişlik-önce (1111→2222) | 6,49 sa (+%7,3) | 2 · 29,5 dk | zone3 · servis L6 |

- **G-76'nın cevabı:** genişlik-önce (K6B) bugünkü kuraldan **%7,3 yavaş** ve D-095 bandını 1 → 2'ye
  çıkarıyor. D-124'ün gerekçesi (H2'de %20,6) yığın açıkken küçülüyor ama yön aynı.
- **Yan sonuç:** yürürlükteki oyunun gözlem bandı 2 değil **1**, Kat 1'i 6,48 değil **6,05 sa**.
  D-095'in "zincir borcu"nun tabanı da bu yüzden kayar (ölçülmedi, not).

### Bulgu 2 — G-86 zincir sırası: yalnız 2. garson yer değiştirmeye aday, bulaşıkçı yerinde

| kol | ne | Kat 1 | GÖZLEM | otomasyon | Garson | Bulaşıkçı | 2. Garson | 2. Salon |
|---|---|---|---|---|---|---|---|---|
| T0 | bugün | 6,05 sa | 1 · 29,7 | 6,1 dk | 11,1 | 60,4 | **151,9** | 34,3 |
| K3a | 2. garson Salon 1 sonu · ₺1.600 | +%2,0 | **2** · 30,4 | 6,1 | 11,1 | 84,8 | 51,0 | 60,7 |
| **K3b** | 2. garson Salon 1 sonu · **₺800** | **−%2,1** | 1 · 29,9 | 6,1 | 11,1 | 69,2 | **35,3** | 45,0 |
| K3c | 2. garson Salon 2 başı · ₺1.600 | +%2,3 | **2** · 30,2 | 6,1 | 11,1 | 85,8 | 65,5 | 34,3 |
| D1 | bulaşıkçı Salon 1 sonu · ₺900 | +%1,2 | 1 · 29,7 | 6,1 | 11,1 | **37,2** | 156,3 | 49,6 |
| D2 | bulaşıkçı garsondan önce (₺130 / garson ₺900) | +%1,4 | 1 · 29,6 | **31,4** ✗ | 56,8 | 11,1 | 157,3 | 32,5 |
| W3 | garson tepsi-3 hatta (3. garsondan sonra) | **−%2,3** | 1 · 29,7 | 6,1 | 11,1 | 60,4 | 151,9 | 34,3 |

(uğrak sütunları Normal profilde dakika)

- **Şüphe ③ (2. garson geç) GERÇEK:** bugün 2. garson 152. dakikada, Salon 3'ün ortasında geliyor.
  Salon 1'in sonuna ₺1.600'la taşınırsa (K3a) kendi 30,4 dk'lık beklemesini doğuruyor ve gözlem bandı
  1 → 2 kırılıyor. Aynı yer **₺800'la** (K3b) bandı korur, 2. garsonu **117 dk öne** çeker ve Kat 1'i
  %2,1 kısaltır. Bedeli: bulaşıkçı 60 → 69 dk, 2. salon 34 → 45 dk (arada bir kalem daha var).
- **Şüphe ① / ② (bulaşıkçı geç / garsondan sonra):** D1 bulaşıkçıyı 23 dk öne çekiyor ama Kat 1'e
  +%1,2 ekliyor; D2 (angaryayı önce devret) otomasyonu **6,1 → 31,4 dk**'ya itiyor ve D-079'u kırıyor.
  Garson → bulaşıkçı sırası tempo açısından doğru. Elle bulaşık dönemi D-083 (boştaki garson yıkar)
  ile zaten kısmen kapalı; oyuncunun hissi sim'de ölçülemez.
- **Şüphe ⑤ (tepsi-3 hatta yok) GERÇEK ve bedava:** W3 görevi eklemek Kat 1'i %2,3 kısaltıyor, hiçbir
  eşiği oynatmıyor. D-093'ün "personel Usta hedefleri 12 saatte açılmıyor" kalemini de açar.
- D1/D2'de bulaşıkçı pad'i Salon 1'e (`area 0`) taşındı; mekândaki yeri T8b'nin işi.

### Bulgu 3 — T3 fiyat kolları: ikisi etkisiz, biri güçlü

| kol | kalem | Kat 1 | GÖZLEM | açılış | otomasyon | not |
|---|---|---|---|---|---|---|
| K1a | G-65 tepsi T1 ₺75 → ₺30 | −%0,4 | 1 · 29,7 | 1,6 | **5,2** | otomasyon 55 sn erken |
| K1b | tepsi T1 → ₺50 | −%0,2 | 1 · 29,7 | 1,6 | 5,6 | |
| **K2a** | G-72 garson tepsi tabanı 1 → 2 | **−%4,2** | 1 · **28,5** | 1,6 | 6,1 | en uzun bekleme de kısalır |
| K2b | taban 2 + ilk kademe düşer (₺1.200/2.500) | −%1,3 | 1 · 29,8 | 1,6 | 6,1 | tavan aynı (4) |
| K4a | G-74 4. masa ₺380 → ₺250 | −%0,6 | 1 · 29,7 | 1,6 | 6,1 | 2. salon 2,6 dk erken |
| K4b | 4. masa → ₺300 | −%0,4 | 1 · 29,7 | 1,6 | 6,1 | |

- K1 ve K4 tempoya neredeyse hiç dokunmuyor (≤ %0,6): bunlar **his** kararıdır, denge kararı değil.
  K1a otomasyonu 6,1 → 5,2 dk'ya çekiyor, D-079 bandında.
- K2a (garson hep 2 bardakla başlar) turun en güçlü tek fiyat kolu. Tavanı 5'e çıkarıyor. K2b
  tavanı korur ama kazancın üçte birini verir.

### Bulgu 4 — G-75 (2. salonu geciktir) oyunu KISALTIYOR

| kol | ne | Kat 1 | GÖZLEM | 2. Salon | 2. Garson |
|---|---|---|---|---|---|
| K5a | 2. salondan önce "4 masayı Seviye 2 yap" | **−%7,5** | 1 · 30,0 | 34 → 47,5 dk | 152 → 123 |
| K5b | + "2 masayı Seviye 3 yap" | −%7,8 | 1 · 30,0 | 47,5 dk | 122 |

Salon 1'in masa yükseltmesini 2. salondan önce yaptırmak (bahşiş erken gelir) 2. salonu 13 dk
geciktiriyor ama Kat 1'i **27 dk** kısaltıyor. Kullanıcının "2. salon çok erken" hissi ile tempo
aynı yönde. İkinci basamak (K5b) neredeyse hiçbir şey eklemiyor.

### Bulgu 5 — seviye eğrisi (K7) ve seviye ₺'si (K8)

| kol | ne | Kat 1 | ilk alım | açılış | otomasyon | 12 sa seviye | ₺ toplam |
|---|---|---|---|---|---|---|---|
| K7a | eğri tabanı 60 → 90 | +%1,5 | 22 | 1,6 | 6,1 | 13 → 12 | — |
| K7b | eğri büyümesi 1,5 → 1,6 | +%1,6 | 22 | 1,6 | 6,1 | 13 → 11 | — |
| K8a | seviye başına gelirin 30 sn'si | −%1,6 | **3** | 1,5 | 4,8 | 13 | ₺1.860 |
| K8b | 60 sn | −%3,1 | **3** | 1,5 | 3,6 | 13 | ₺3.726 |
| K8c | 120 sn | −%5,8 | **3** | **0,7** | **1,3** | 13 | ₺9.088 |

- **K7:** iki zorlaştırma kolu da seviyeyi 1-2 basamak geri alıyor ve Kat 1'e ~%1,5 ekliyor (D-092'nin
  taşıma ödülü daha geç geliyor). Eşik kırılmıyor.
- **K8 açılışı yiyor:** ilk seviye atlamaları öğretici görevlerle ilk saniyelerde geliyor (her görev
  25 XP, eşik 60), ödül o anda düşüyor → **ilk alım 22 → 3 sn**. K8c otomasyonu 6,1 → 1,3 dk'ya
  çekiyor; bu D-079'un "öğretici tempo" ruhunu kırar (eşiği sayı olarak kırmasa da). Plan kararı
  (2026-09-18) "D-079 açılış üçlüsünü yemeyecek doz" demişti: **hiçbir doz bunu sağlamıyor.** Yapısal
  çare: ödül ilk N seviyede kapalı → **Bulgu 8'de ölçüldü (K8d/K8e).**
- Model sınırı: ödül seviye atlandığı an cüzdana düşüyor (oyunda modal kapanınca) → üst sınır.

### Bulgu 6 — G-61 / K11: kapı Kat 1'i değiştirmiyor, 2. salonun yerini değiştiriyor

| kol | ne | Kat 1 | GÖZLEM | Bulaşıkçı | 2. Garson | 2. Salon |
|---|---|---|---|---|---|---|
| T0 | kapılı dünya ≡ görev hattını takip eden oyuncu | 6,05 | 1 · 29,7 | 60,4 | 151,9 | 34,3 |
| K11 | KAPISIZ dünyada dürtüsel oyuncu | −%0,3 | 1 · 25,2 | 74,0 | 167,6 | **67,6** |

Bugün yan yükseltme noktaları görevden bağımsız canlı. Parası yeten ucuz noktaya basan oyuncu
Kat 1'i aynı sürede bitiriyor ama **2. salonu iki kat geç açıyor** (34 → 68 dk). Görev hattının
tasarlanan ritmi yalnız hattı takip eden oyuncuda doğru. "Yükseltme noktası yalnız kendi görevi
aktifken canlı" kapısı bu ritmi zorunlu kılar; ekonomik bedeli sıfır. Takası şu: oyuncunun serbestliği
azalır (dikkat bütçesi D-124'ün masa kapısıyla aynı sınıf).

### Bulgu 7 — bardak havuzu bağlamıyor; T6'nın "42 bardak, temiz 0" ölçümü bir kurulum hatasıydı

Oyunun kendi `tick`'i, oyuncu parkta (AFK alt sınırı), 2 tohum × 420 sn (180 sn ısınmadan sonra).

| dünya | kol | havuz | servis/dk | temiz ort | temiz = 0 payı | masada kirli ort |
|---|---|---|---|---|---|---|
| W20 (20 masa · L4 · ocak tavan) | **B0 bugün** | 42 | **6,2** | 18,3 | %0,0 | 11,8 |
| | B1 havuz × 1,5 | 63 | 6,2 | 39,3 | %0,0 | 11,8 |
| | B2 havuz × 2 | 84 | 6,2 | 60,3 | %0,0 | 11,8 |
| | Y1 bulaşıkçı tavanda | 42 | 6,4 | 19,4 | %10,1 | 10,4 |
| | Y2 havuz × 2 + bulaşıkçı tavanda | 84 | 6,4 | 56,8 | %0,0 | 14,7 |
| W8 (Salon 2 dolu · 8 masa · ocak L3) | **B0 bugün** | 26 | **3,6** | 18,6 | %0,0 | 0,3 |
| | B1 / B2 | 39 / 52 | 3,6 / 3,6 | 31,6 / 44,6 | %0,0 | 0,3 |
| | Y1 / Y2 | 26 / 52 | 3,6 / 3,6 | 18,9 / 44,9 | %0,0 | 0,2 |

- Havuzu iki katına çıkarmak servisi **hiç** değiştirmiyor. Fazla bardak temiz rafta bekliyor
  (D-083'ün cümlesi ölçüldü). 20 masada ortalama 18 temiz bardak boşta; bağlayan kol TAŞIMA.
- **T6'nın yan bulgusu yanlış kurulumdan geldi:** `store` `areasOpen`'ı yalnız yüklemede türetir.
  Araç havuzu `setState`'ten sonra bayat kalan `areasOpen = 1` ile hesapladı; ölçülen dünyada
  **22** bardak vardı, rapordaki "42" elle hesaplanmıştı. Bu araçta `deriveWorld`'den okunuyor.
  (`olcum-izdiham-t6.ts` aynı satırı taşıyor; S1 kararı buna bağlı değil: kolların hepsi aynı
  22'lik dünyada ölçüldü.)
- **Sonuç: bardak havuzu kalemi kapanır, sayıya dokunulmaz.**

### Bulgu 8 — K8'in kapılı dozu açılışı korur; kullanıcı kollarının birleşimi Kat 1'i %15,8 kısaltır

Bulgu 5'in yapısal çaresi ölçüldü: seviye ₺'si **Seviye 5'ten önce yok** (G-66'nın "ilk 4 seviyede
modal"ı ile aynı çizgi, o seviyeler yalnız modal).

| kol | ne | Kat 1 | ilk alım | açılış | otomasyon | GÖZLEM | ₺ toplam |
|---|---|---|---|---|---|---|---|
| K8b | 60 sn, kapısız | −%3,1 | **3** | 1,5 | 3,6 | 1 · 28,8 | ₺3.726 |
| **K8d** | 60 sn, Sv 5'ten önce yok | −%2,4 | **22** | 1,6 | 6,1 | 1 · 28,8 | ₺3.482 |
| K8e | 120 sn, Sv 5'ten önce yok | −%4,6 | 22 | 1,6 | 6,1 | 1 · 27,9 | ₺7.248 |

Kapı açılış üçlüsünü birebir geri getiriyor (22 sn · 1,6 dk · 6,1 dk).

**Birleşim tek kol olarak** — kullanıcının kendi cümlelerine en yakın kollar (G-65 "30'a düşür" →
K1a · G-72 → K2b · G-73 → K3b · G-74 → K4a · G-75 "olabildiğince geciktir" → K5b · G-66 → K7a ·
G-67 → K8d · şüphe ⑤ → W3):

| kol | Kat 1 | GÖZLEM | HÜKÜM | otomasyon | Bulaşıkçı | 2. Garson | 2. Salon | seviye |
|---|---|---|---|---|---|---|---|---|
| T0 bugün | 6,05 sa | 1 · 29,7 | 0 | 6,1 | 60,4 | 151,9 | 34,3 | 13 |
| **PKT** (hepsi) | **5,09 sa (−%15,8)** | 1 · 30,5 | 0 | 5,2 | 53,3 | 40,9 | 44,5 | 11 |
| **PK2** (K5b hariç) | 5,58 sa (−%7,7) | 1 · 30,5 | 0 | 5,2 | 57,9 | 29,1 | 38,9 | 12 |

- Hiçbir eşik kırılmıyor. Ama iki paket de Kat 1'i D1'in **%7 eleme eşiğinin** üstünde kısaltıyor
  (D-092 %15,5'lik borcu bilerek kabul etmişti; aynı sınıf karar).
- Tek kolların toplamı −%18,5, ölçülen birleşim −%15,8: kollar birbirini **yiyor** (D-090 Bulgu 10).
- PKT'nin 58 dakikasının yarısı K5b'den geliyor. Paradoks Bulgu 4'teki: 2. salonu geciktirmek
  oyunu kısaltıyor, çünkü erken bahşiş Kat 1'in geri kalanını hızlandırıyor.
- Kısalma bir **içerik** sorunudur, tempo sorunu değil: bekleme hükmü aynı. Telafi kolu (geç zincirde
  fiyat artırmak) bu turda ölçülmedi.

### Özet — hangi kol hangi kapıdan geçiyor

| kol | Kat 1 | eşik kırar mı | okuma |
|---|---|---|---|
| K3b 2. garson Salon 1 sonu · ₺800 | −%2,1 | hayır | G-73 + şüphe ③ |
| W3 garson tepsi-3 hatta | −%2,3 | hayır | şüphe ⑤, bedava |
| K2a garson tepsi tabanı 2 | −%4,2 | hayır | G-72, en güçlü fiyat kolu |
| K5a 2. salondan önce 4 masa Sv 2 | −%7,5 | hayır | G-75 |
| K11 yan noktalar görevle canlı | ±0 | hayır | G-61, ritim kapısı |
| K1a / K4a | −%0,4 / −%0,6 | hayır | his kararı |
| K7a/b | +%1,5 | hayır | G-66 |
| K8a/b/c | −%1,6…−%5,8 | **açılışı yiyor** (ilk alım 22 → 3 sn) | G-67, kapısız yazılamaz |
| K8d/e (Sv 5'ten önce ₺ yok) | −%2,4 / −%4,6 | hayır | G-67'nin kapılı hâli |
| PKT / PK2 birleşim | −%15,8 / −%7,7 | %7 içerik eşiği | Bulgu 8 |
| K3a / K3c | +%2 | **gözlem 1 → 2** | ₺1.600'da elenir |
| D2 | +%1,4 | **otomasyon 31 dk** (D-079) | elenir |
| K6T / K6B | +%7 | gözlem 1 → 2 | D-124 kalır |
| B1/B2/Y | 0 | — | havuz kalemi kapanır |

**Birleşim ayrı ölçülür:** kollar toplanmaz (D-090 Bulgu 10). Seçilen paket commit #2'den önce tek
kol olarak koşturulur, final tam koşu o satırdır.

## §Karar

**D-142 (kullanıcı, 2026-09-23).** Karar paketi: https://claude.ai/artifact/24vke4Lg2CCEj5yuJJJZtV —
dört sorunun dördünde önerilen kol.

| soru | seçilen | kodda |
|---|---|---|
| birleşim | **PK2** (K5b hariç) | tepsi T1 ₺30 · 4. masa ₺250 · 2. garson Salon 1 sonu ₺800 · seviye tabanı 90 · tepsi-3 görevi |
| garson tepsisi | **tavan 4** (K2b) | `waiter.trayBase: 2` · kademeler ₺1.200/2.500 · `q_waiterTray1` hattan çıktı |
| seviye ₺ | **60 sn, Sv 5'ten** (K8d) | `xp.levelRewardSec/FromLevel` · `rules.levelRewardAmount` · tick'te kazanç izi |
| nokta kapısı | **evet** | `rules.upgradeSpotLive(Now)` → Scene (çizim) · tick (tetik) · revealKeys (bildirim) |

**Kararın getirdiği iki yan iş (soru turu açılmadı, teknik):**
- **Seviye ekranı:** atlama artık toast değil ortak `RewardModal` (G-66'nın "modal" isteği + G-67'nin ₺'si
  aynı ekranda). Ekran kanalı `seviye`: çevrimdışı/Usta'dan sonra, kutlama/panel/bildirim bitene kadar
  bekler. Aynı anda birden çok seviye atlanırsa ₺ tek ekranda birikir.
- **2. garson pad'i taşındı:** eski yeri (−14,7 · −5,0) Salon 3'ün bandıydı — Salon 1 döneminde yürünemez.
  Yeni yer (−10,5 · 9,75) tarama ile seçildi: bütün çerçevelere, personel noktalarına ve çaycı yoluna
  ≥ 0,4 br. İlk aday (−14,75 · 6,5) karede 1. garsonun ALTINDA kaldı; kare olmasa görülmezdi.
  Kare: `docs/gorsel/ss/t8a-garson2-pad.png` · `t8a-seviye-odul.png`.
- **Kayıt v34:** garson tepsi kademesinin anlamı değişti → göç kademeyi bir indirir, kapasite korunur.

### Final tam koşu (commit #2 · `docs/olcum-t8a.txt`)

Taban artık oyunun kendisi (HRE + D-124 + D-142). **Parmak izi `aabcd5d5` = commit #1'in PK2 satırı:**
uygulanan kod ölçülen kolun kendisi (damga). Kat 1 **5,58 sa** · gözlem 1 · hüküm 0 · açılış 22 sn /
1,6 dk / 5,2 dk. Uygulanmayan kollar yeni taban üstünde: K5b −%8,7 · tavan 5 +%0,6 · 120 sn −%2,3 ·
seviye ₺ yok +%2,3 · serbest sıra +%6,7 · genişlik-önce +%6,9 · kapısız dürtüsel oyuncu +%3,0 (2. salon
38,9 → 61,6 dk).

**Kararın eski bekçilere etkisi (sayılar güncellendi, gerekçeler test içinde):**
- `meta-pencere`: gözlem bandı M0 6 → **3**, HRE 2 → **1** · R'nin tek başına borcu %15,5 → **%12,1** ·
  taşımanın kelepçe payı %93 → **%69,9** (arz %29,1). Zincir borcu **%18,7** — D-095 bandında (%18-22).
- `tempo-olcutu`: **D1'in g1 kolu artık İYİLEŞTİRİYOR** (3 → 2) — elenme gerekçesi düştü, kol
  uygulanmamış bir aday olarak bekliyor (varyant kapısından geçer).
- `sim-model`: G1-G4 ölçümleri eski dünyada alınmıştı → sim o dünyayı sabitler (1'li tepsi, 2. garson
  Salon 3'te); sabitlemeden sapma sahte biçimde %12 → %35 çıkıyordu.

### Bekçi
`tests/zincir-t8a.test.ts` (17 test: sayılar · zincir · kapı gerçek tick · seviye ekranı gerçek tick ·
birikim · kanal sırası · v33/v32 göçü). Mutasyon `tools/mutasyon-zincir-t8a.mjs` **6/6**. Duman
`tools/smoke.mjs` 50/50 (görevsiz nokta kapalı + seviye ekranı çıktı/kapandı denetimleri eklendi).
