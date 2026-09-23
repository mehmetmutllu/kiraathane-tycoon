# T7 — PAD ÇAKIŞMASI (G-82) + BANKET KADEMELİ BÜYÜME (G-83 / G-84)

> Karar: — (commit #2'de dolar, §Karar)
> Araçlar: `tools/olcum-pad-t7.ts` → `docs/olcum-pad-t7.txt` · `tools/olcum-banket-t7.ts` →
> `docs/olcum-banket-t7.txt` · kareler `tools/shot-banket-t7.mjs` → `docs/gorsel/ss/t7-*.png`
> Varyant katmanı (geçici, karar sonrası silinir): `src/game/banketAday.ts` (`?banket=&gorunus=`),
> çizici `src/components/three/banketLook.ts` + `Scene.tsx` `BanketAdaylari`.
> Denge dosyasına (economy.config / tick / rules) dokunulmadı. İki araç da saf geometri; kısa = tam.

## §0 Soru

Kullanıcı, 2026-09-21 (`docs/geribildirim-oyun-testi-2026-09-21.md`):

> **G-82** *"Salon 3 açma padi ile salon 2 masa 3ün padi hafif üst üste geliyo"*
> **G-83** *"banketler tamamen açık geliyor sadece masa ekliyorum. banketler de mesela oranın ortasında
> zaten çift veya tek masalı gelmeli ben 3. salonu açınca gözükmeli veya farklı bir yol olmalı"*
> **G-84** *"ben yükseltme yaptıkça yeni masa ile birlikte banket boyutu da büyüsün renk gelişmeleri
> falan olsun"*

G-83 bir hata değil, B3-2'deki "adalar şeridin donanımı" kararının (layout.ts `banketIslands`)
kullanıcı tarafından geri alınması.

## §Bulgular

### Bulgu 1 — G-82: zone3 tek çakışan pad; orta eksen iki komşuya da 1,618 br bırakıyor

Çakışma **çizilen çerçeveyle** ölçüldü (tetik D-121'den beri çerçeve) — `tetik-s24` §9'la aynı hesap.

| aday | x | z | çakışma | boşluk (br) | en yakın | durak | eşiğe (z) | kapı eksenine |
|---|---|---|---|---|---|---|---|---|
| **T** taban | 2,0 | 1,8 | **1** | **−0,100** | masa 6 | %100 | 1,8 | 2,0 |
| P1 orta | 0,0 | 1,8 | 0 | 1,618 | masa 3 | %100 | 1,8 | 0,0 |
| P2 orta-eşik | 0,0 | 1,2 | 0 | 1,618 | masa 3 | %100 | 1,2 | 0,0 |
| P3 sağ-eşik | 2,0 | 1,0 | 0 | 0,700 | masa 6 | %100 | 1,0 | 2,0 |
| P4 sağa-kay | 1,0 | 1,8 | 0 | 0,618 | masa 6 | %100 | 1,8 | 1,0 |
| P5 sağ-derin | 2,0 | 2,6 | 1 | −0,382 | masa 6 | %100 | 2,6 | 2,0 |

- Taban çakışması `tetik-s24` KABUL_EDILEN listesinin **tek** üyesi; pad nereye giderse gitsin
  o liste boşalır ve 10. denetim (istisnanın büyümediği) anlamını yitirir.
- P1 ve P2 simetrik: masa 3 ve masa 6'ya eşit uzak, boşluğu sınırlayan iki komşu da aynı.
  Aralarındaki tek fark eşiğe yakınlık (1,8 ↔ 1,2).
- Orta eksen (x = 0) 2. salondan beri kapının ekseni: müşteriler pad'in üstünden yürür.
  Pad'i yalnız oyuncu doldurur (NPC tetiklemez), yani işlevsel çakışma değil; görsel kalabalık.

### Bulgu 2 — G-83: bugün 1 masada 28,2 br masasız bank var

`docs/olcum-banket-t7.txt` (seviye 4). `bos` = masası olmayan oturak yüzü boyu, `isk` = tadilat iskeleti.

| kol | 1 masa boy / boş / iskelet | 3 masa | 6 masa | 12 masa | mesh (12 masa) |
|---|---|---|---|---|---|
| **B0** taban (tam boy) | 15,2 / **28,2** / 0 | 15,2 / 23,8 / 0 | 15,2 / 15,2 / 0 | 15,2 / 0 / 0 | **24** (bugünkü çizici) |
| B1 sütunla uzar (iki yüz birden) | 2,2 / 2,2 / 0 | 4,4 / 2,2 / 0 | 7,6 / 0 / 0 | 15,2 / 0 / 0 | 88 |
| B2 segment (masa başı yüz) | 2,2 / 0 / 0 | 4,4 / 0 / 0 | 7,6 / 0 / 0 | 15,2 / 0 / 0 | 88 |
| B3 tadilat iskeleti (tam iz) | 15,2 / 0 / **28,2** | 15,2 / 0 / 23,8 | 15,2 / 0 / 15,2 | 15,2 / 0 / 0 | 88 |
| B4 segment, içten dışa | 2,2 / 0 / 0 | 4,4 / 0 / 0 | 7,6 / 0 / 0 | 15,2 / 0 / 0 | 88 |

- Kullanıcının "tamamen açık geliyor" cümlesinin sayısı B0'ın **28,2 br**'sidir; B2/B4'te 0.
- B1 tek masada da iki yüzü çizer → 2,2 br boş yüz (masası gelmemiş karşı taraf).
- B3 boşluğu kapatmaz, **tadilata** çevirir (`feedback_locked_object_renovation`: açık alandaki kilitli
  obje tadilat hâliyle durur). Kare: `t7-B3-*.png` — kontrplak kasa + branda + duba.
- B3-2'nin eski gerekçesi ("tek sütunluk ada DOLABA benziyor", 1,2 × 2,5) bu turda ölçüldü:
  sütun sınırı masa ritminin ortasına çekilince tek sütun **2,2 br** (derinlikten uzun, tek yüzde
  1,25 derinlik) — `t7-B2-1.png`'de dolap değil kısa bank okunuyor.

### Bulgu 3 — parçalı banket çizim çağrısını ×3,7 artırıyor (24 → 88)

Bugünkü `BanketIslands` iki ada × 12 mesh = **24** sabit. Sütun × yüz parçalı çizici tam şeritte
**88** mesh. Telefon yükü turlarında (T4/T6) kare işi ölçülmüştü; bu fark **tarayıcıda ölçülmedi**.
Uygulamada sütun başına geometri birleştirme (tek mesh, köşe rengi) mümkün — o da ölçülmedi.

### Bulgu 4 — collision bugün TAM BOY; kısa çizilen adada görünmez duvar kalır

`banketIslands(tables)` (layout.ts) katıyı adanın **tam boyuyla** üretir; aday çizici yalnız görseli
değiştiriyor. B1/B2/B4'te çizilen ada kısayken collision tam boy kalırsa oyuncu boş zemindeki görünmez
kütleye çarpar. Seçilen kolda katı, çizilen sütunlardan türemeli (`feedback_single_source_of_truth`).
B3'te iskelet de katıdır — tutarlı.

### Bulgu 5 — B4 (içten dışa) masaların SIRASINI değiştirir

B4 `banketUnit`'te sütun sırasını çevirir: şeridin ilk masası dış uç (x = ∓11,7) yerine iç sütuna
(x = ∓5,3, kapı eksenine yakın) gelir. Kayıttaki açık şerit masaları **yer değiştirir** (seviye masa
index'ine bağlı → seviye yeni yerine taşınır; ilerleme kaybı yok). `z3tableK` pad'leri de yer değiştirir.
Kullanıcının "oranın ortasında gelmeli" cümlesinin karşılığı budur; B2 ile arasındaki TEK fark sıra.

### Bulgu 6 — G-84: görünüş kademesi masa merdiveninin basamaklarına oturuyor

Her yüz kendi masasının seviyesini taşır (obje-başı yükseltme). Basamaklar `Tables.tsx`'teki masa
merdiveniyle aynı: **L0-1** çıplak ahşap oturak · **L2** oturak minderi (taburenin minderlendiği
basamak) · **L3** sırt minderi (masanın büyüdüğü basamak) · **L4+** yastık (örtünün geldiği basamak).
Kareler `t7-gorunus-R*-sol.png` (L0 · L1 · L2) · `-sag.png` (L3 · L4 · L4).

| kol | L2 | L3 | L4+ | eski kuralla (renk = tema, tier değil) |
|---|---|---|---|---|
| R1 madde | bordo minder | + sırt minderi | + yastık | uyumlu |
| R2 madde + renk | **keten** minder | **bordo**'ya döner + sırt | + yastık + **pirinç biye** | kullanıcının G-84'ü ile eski kural çelişir |
| R3 madde + kilim | bordo minder | + sırt minderi | + **kilim şerit** + kilim yastık | desen ekler, rengi tier yapmaz |

`feedback_upgrade_legibility` (2026-06-15): *"renk rastgele/zorlama hissi verir; ilerleme MADDESEL"*.
G-84 (2026-09-21): *"renk gelişmeleri falan olsun"*. İki cümle aynı nesnede ters yönde — karar kullanıcının.

## §Karar

(boş — karar paketi sonrası)
