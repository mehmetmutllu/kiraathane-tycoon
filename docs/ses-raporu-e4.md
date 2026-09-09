# E4 — Ses kaynağı kararı: önce sentezin kendisi ölçüldü

> Ham çıktı: `docs/olcum-ses-ayirt.txt` · Araç: `tools/olcum-ses-ayirt.ts`
> Koşu: `OLCUM=tam npx tsx tools/olcum-ses-ayirt.ts` · damgalar temiz (7/7)
> Kaynak: `src/game/audio.ts` → `SES_KATALOG` (ikinci bir doğru kaynak yazılmadı)

## §1 Soru

E4, "ses dosyalarını hangi CC0 kaynaktan alalım" turu olarak açıldı. Fakat o sorunun **önünde**
duran bir soru var ve E3 onu cevapsız bıraktı:

`src/game/audio.ts` sentez tonları için şunu iddia ediyor — *"Ton değerleri 'müzik' değil
OKUNABİLİRLİK için seçildi… Amaç, dosyalar gelene kadar bile olayların KULAKTAN ayırt
edilebilmesi."* Bu bir **tasarım iddiası** ve hiç sınanmadı.

İddia önemli, çünkü motor **dosya yokken sentez tonuna düşüyor** — yani "dosya HİÇ gelmesin,
sentez nihai olsun" hayali bir seçenek değil, bugün çalışan **gerçek bir koldur**. Bu kol
D-013'ün (*primitive = placeholder değil, nihai sanat stili*) sesteki tam karşılığıdır. Kol ancak
iddia ölçülürse tartışılabilir; ölçülmeden yapılacak "hadi dosya bulalım" hamlesi, çalışan bir
sistemi ölçmeden değiştirmek olurdu.

**Bu turun ölçtüğü:** 9 sesin ikişerli (36 çift) ayırt edilebilirliği.

## §2 Yöntem ve model sınırı (karara aynen geçer)

Ses duyulamaz ama sesin **fiziği** hesaplanabilir. Her ton, `audioWeb.ts`in `tonCal`i birebir
taklit edilerek PCM'e çevrilir (band-limitli toplamsal sentez · faz sürekliliği · üstel zarf),
log-frekans bantlı spektrogramı çıkarılır, çiftler arası mesafe ölçülür.

**İki kanal, çünkü iki dinleme durumu var:**

| Kanal | Neyi ölçer | Hangi duruma karşılık gelir |
|---|---|---|
| **MUTLAK** | spektrumun kendisi | sesler **art arda** duyulursa; mutlak perde güçlü bir ipucu |
| **JEST** | perde silinmiş hâli (her ton ilk notası 440 Hz'e taşınır) | sesler **dakikalarca arayla** duyulursa; kalan tek şey dalga + aralık örüntüsü |

Jest kanalı sonradan eklendi ve **eklenme sebebi ölçümün kendisidir**: tek kanalla sonuç 36/36
"AYRI" çıkıyordu, oysa `quest` (660-880) ile `reward` (988-1319) aynı dalga, aynı nota sayısı,
aynı yükselen aralık ve süre farkı 0,6 JND. Metrik yanlış değildi — **sorulan soru eksikti.**
Oyunun gerçek hâli jest kanalıdır: `coin` saniyede bir, `level` saatte bir duyulur; oyuncu ikisini
yan yana koyup karşılaştırmaz.

**Süre üçüncü ve bağımsız kanaldır.** Spektrogram zamanda 32 kareye normalize edilir (yani ŞEKİL
karşılaştırılır), bu yüzden süre mesafeye girmez; ayrıca Weber oranıyla (%15) "kaç JND" olarak
ölçülür ve her iki hükme de ikinci koşul olarak girer. 0,09 sn ile 0,42 sn, spektrumları ne olursa
olsun benzemez.

**Eşikler kalibrasyondan gelir, sihirli sayı yoktur.** Her kanalın kendi tabanı ölçülür:
mutlak taban = aynı sesin 1 yarım ses tizleştirilmişi; jest tabanı = aynı jestin aralığı 1 yarım
ses kaydırılmışı. Bir çift kendi kanalının tabanının altındaysa, o kanalda ayrı ses sayılamaz.

**Model sınırı 1 — metriğin çözünürlüğü, yönü İYİ tarafa.** 24 bant 80 Hz–12 kHz arasını kaplıyor,
yani bir bant ~3,6 yarım ses. Tek yarım seslik bozma çoğunlukla bant içinde kalıyor ve tabanları
olduğundan **düşük** çıkarıyor (3-4 notalı seslerde jest tabanı ~0,0). Düşük taban = dar eşik =
araç karışan çifti **eksik** bildirir, fazla değil. Dolayısıyla "KARIŞIR 0" iyimser olabilir;
"AYNI JEST 1" sağlamdır.

**Model sınırı 2 — eş zamanlılık ölçülmedi.** `sesOlaylari` tek karede birden çok olay
döndürebiliyor ve motor onları aralıksız çalıyor. Hangi bileşimlerin gerçekten ulaşılabilir olduğu
oyun kurallarının işi, bu aracın değil. Karışan çiftin **zararı** bu yüzden ölçümde değil, kararda
tartışılır.

**Model sınırı 3 — kataloğun 2 olay-dışı sesi (`ambience_loop`, `okey_tile`) ölçüme girmedi**,
çünkü ikisinin de `SES_KATALOG`ta tanımı yok: `ambience` `settings.music`e bağlı değil (manifest
bunu zaten yazıyor), okey masası v1.1'de. Ölçüm 9 olay sesini kapsar.

## §Bulgular

### Bulgu 1 — İddia AYAKTA: 36 çiftin 35'i ayrı, karışan çift **yok**

| Hüküm | Sayı | Çiftler |
|---|---|---|
| KARIŞIR (mutlak taban altı + süre yakın) | **0/36** | — |
| AYNI JEST (jest taban altı + süre yakın) | **1/36** | `quest ↔ reward` |
| AYRI | **35/36** | — |

Kalibrasyon: mutlak taban **1,39 dB** · jest tabanı **0,22 dB**.
En uzak çift `serve ↔ purchase` = jest **8,81 dB** (×39,7 taban).

E3'ün "kulaktan ayırt edilebilir" iddiası ölçüldü ve **bir istisna dışında doğrulandı**. Sentez
tonları bir yer tutucu gibi davranmıyor; katalog gerçekten ayrışmış.

### Bulgu 2 — Tek gerçek kusur: `quest` ile `reward` **aynı jestin transpozesi**

| | dalga | nota | aralık örüntüsü | süre | frekanslar |
|---|---|---|---|---|---|
| `quest` | triangle | 2 | **+5** | 0,26 sn | 660-880 |
| `reward` | triangle | 2 | **+5** | 0,24 sn | 988-1319 |

Jest mesafesi **0,13 dB** — jest tabanının (0,22) **altında**. Yani bu iki ses birbirinden, "aynı
jestin bir notası yarım ses kaydırılmış hâli" kadar bile ayrı değil. Süre farkı 0,6 JND (ayırt
edici değil). Mutlak mesafe 5,98 dB, yani **art arda çalınırsa** ayırt edilirler — ama oyunda art
arda çalınmazlar.

**Bulgu metriğe bağlı değil.** §5'in metrikten tamamen bağımsız yapısal denetimi aynı çifti tek
başına buluyor: *"Aynı dalga + aynı aralık örüntüsü: 1 grup — quest/reward (triangle|5)."* İki
yöntem aynı yere işaret ediyor.

**Neden önemli:** D-080'in Tek Odak kuralı her kanalın **ayrı bir şey söylemesini** ister. `quest`
(görev hattı ilerledi) ile `reward` (hedef/günlük ödül toplandı) iki ayrı ilerleme kanalı; aynı
jesti paylaştıklarında oyuncu ikisini tek bir "iyi bir şey oldu" sinyaline indirger ve kanallardan
biri bilgi taşımayı bırakır.

### Bulgu 3 — Katalog tek bir kalıba sıkışmış: 9 sesin **7'si yükselen arpej**

```
Dalga dağılımı            : triangle 5 · sine 3 · square 1
Yükselen arpej            : 7/9 — coin · purchase · padFill · quest · level · master · reward
Yükselen OLMAYAN          : 2/9 — pour (tek nota) · serve (inen, -4)
```

Bulgu 1 bu kalıba rağmen temiz çıkıyor — nota sayısı, süre, dalga ve mutlak perde farkları
ayrışmayı taşıyor. Ama **ayrışma payı ince**: kataloğa yeni bir olay sesi eklenirse (v1.1'de okey
masası, sipariş nesnesi) aynı kalıptan bir sekizinci arpej neredeyse kesin bir çakışma üretir.
`quest ↔ reward` bunun ilk örneği; ikinci örnek katalog büyüdüğünde gelir.

Bu bir **kusur değil, kapasite sınırı**: tek osilatörlü motor yalnız "nota dizisi" üretebiliyor.
Gürültü bileşeni (şıngırtı, fokurdama, tıkırtı) motorun bugünkü hâlinde **üretilemez**.

### Bulgu 4 — Ölçülemeyen iki ses, kataloğun dışında duruyor

`ambience_loop` (ortam uğultusu) ve `okey_tile` (okey pulu) manifestte var, `SES_KATALOG`ta yok.
İkisi de **gürültü-temelli** seslerdir; Bulgu 3'ün kapasite sınırı tam olarak buraya çarpıyor.
Ayrıca `ambience`ın bağlanacağı `settings.music`, `settings.sound`un E3'ten önceki hâlinde:
**kayıtta duruyor, hiçbir şeye bağlı değil.**

Yani "ortam sesi" bu turda bir *dosya* sorunu değil, önce bir *kablo* sorunu.

## §3 Kaynak seçeneklerinin durumu (ölçümün karara taşıdığı kısıt)

Ölçüm, kaynak sorusunu şu hâle getirdi: **çalışan ve 35/36 ayrışmış bir sistemi neyle, neden
değiştiriyoruz?**

- `docs/assets.md` §7 bugün *"Kaynak: Kenney / Pixabay / Freesound (CC0)"* diyor. Bu satır
  **seçim değil, aday listesi** — ve seslerde tek stil kilidi (§3'ün model tarafındaki karşılığı)
  hiç kurulmadı. Manifestin kaynak/lisans kolonları E3'te bilerek `?` yapılmıştı.
- Lisans disiplini bağlayıcı (`assets.md` §8): belirsiz lisanslı hiçbir asset commit'lenmez.
  Dosya sayısı arttıkça **tek tek doğrulanacak lisans sayısı** artar.
- Bugün oyun sessiz değil. Dosya eklemek bir **eksik kapatmıyor**, çalışan bir katmanı
  değiştiriyor — ve fallback yüzünden bu değişim **her zaman geri alınabilir** (dosyayı
  klasörden kaldırmak sentezi geri getirir; tek satır kod değişmez).

## §Karar

*(Ölçüm turu — bu bölüm bilerek boş. Karar paketi kullanıcıya sunulacak; seçilen kol commit #2'de
buraya ve `decisions.md`'ye yazılır.)*

## §Bekçi

*(Karardan sonra.)*
