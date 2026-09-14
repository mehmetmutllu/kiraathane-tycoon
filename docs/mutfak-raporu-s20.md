# S20 — Mutfak odası: erişim · çaycı · doluluk (ÖLÇÜM RAPORU)

**Tarih:** 2026-09-15 · **Faz:** S 20/22 (kalem S21, tur adı S20) · **Sıra:** D-084 tamamlandı (ÖLÇ → KARAR → UYGULA → bekçi → final)

**Ham çıktı:** `docs/olcum-mutfak.txt` (TAM koşu damgalı, 17 damga yeşil — final hâli)
**Araç:** `tools/olcum-mutfak.ts` — hiçbir şeyi değiştirmez, ölçer
**Taban kareleri:** `docs/gorsel/ss/s20-mutfak-taban.png` · `-npc.png` · `-plan.png`
(2026-09-15 01:19'da alındı; elektrik kesintisi raporu değil kareleri bıraktı)

---

## Soru

Mutfak odası oyuna ne veriyor — girilemeyen, mekaniğe bağlanmamış ve ortası boş bir **vitrin** mi,
yoksa kazanılacak bir **alan** mı?

Üç alt soru, üçü de `tools/shot-s20-mutfak.mjs`in başlığından (kullanıcının gece verdiği tarif):

| | soru | kollar |
|---|---|---|
| **§E** | mutfağa girilebilen bir açıklık var mı? | E0 kapalı kalsın · E1 açıklık + yürünebilir · **E2** (ölçümden doğdu) |
| **§Ç** | çaycı ne yapıyor gibi duruyor? | Ç0 salt görsel kalsın · Ç1 yüke bağlansın · Ç2 yolu uzasın |
| **§D** | oda içi ne kadar dolu? | D0 orta boş kalsın · D1 dekorla dolsun · **D2** kademeli dolsun |

---

## Yöntem

**Görünürlük süzgeci S6 + S7 ile birebir aynı** (`kadrajda` + `ortulu`, ışın–kutu slab kesişimi):
kamera oyuncunun `+z`'sinde `CAMERA_DIST` = 8,50 br yukarıda ve geride, `fov` 50, bakış yüksekliği 0,80.
Örten gövdeler: ön hattın **3** collision kutusu (çay tezgâhı · garson istasyonu · bulaşık, tabla 0,90)
+ odanın **19** kendi ünitesi = **22 gövde**.

Oyuncunun denenen duruşu **234 nokta** — mutfağın önündeki koridor şeridi
(x −17,41…−4,70 · z −9,30…−5,30). Bir nokta "görünür" sayılır: o duruştan kadrajda VE örtülmemiş.

Tarama adımları (TAM koşu): doluluk 0,05 br · görünürlük 0,25 br · duruş 0,50 br.
Hiçbir koordinat elle yazılmadı — hepsi `layout.ts` / `kitchenLook.ts` / `economy.config.ts`'ten okundu.

**Odanın kutusu:** 12,71 × 7,46 br = **94,82 br²** (fayans dikdörtgeni, `FAYANS`).

---

## §Bulgular

### G — Görünürlük: S6'nın itirazı burada GEÇMİYOR

S6'da karşı binalar üç kamera kipinde de **%0** görünür çıkmıştı ve 10.389 üçgenlik iş
ölçülmeseydi yapılacaktı. Mutfakta durum **tersi**: oda ekranda fazlasıyla var.

| zemin şeridi | z aralığı | zemin 0,25 | tezgâh 0,90 | baş 1,60 |
|---|---|---|---|---|
| arka duvar dibi | −17,3 … −16,1 | 2% / 0% | 2% / 0% | 25% / 21% |
| tezgâh hattı | −16,1 … −14,9 | 33% / 30% | 33% / 32% | 66% / 64% |
| **ODANIN ORTASI** | −14,9 … −13,1 | **76% / 74%** | **86% / 86%** | **99% / 97%** |
| çaycı koridoru | −13,1 … −11,7 | 100% / 90% | 100% / 99% | 96% / 96% |
| ön sınır şeridi | −11,7 … −9,9 | 43% / 31% | 100% / 99% | 98% / 96% |

*(a) o şeritte HİÇ görünen nokta oranı · (b) ortalama duruş oranı.*

- **Hiçbir duruştan görünmeyen ünite: 0 / 19.** Odaya konan her şey ekranda.
- Tek ölü bölge **arka duvarın dibi** (zemin hizasında %2) — ama orayı zaten kendi üniteleri kapatıyor.
- Duvar dolapları %44-56 arası; üst hiza yalnız belli duruşlardan okunuyor.

**Hüküm: mutfakta yapılan iş görülür.** Üç kolun hiçbiri "görünmüyor" gerekçesiyle elenemez.

### E — Erişim: kapalılık bir DUVAR değil, bir KELEPÇE

| ölçüt | sayı |
|---|---|
| oda zemininde oyuncunun erişebildiği hücre | **0 / 37.846** (%0) |
| oyuncunun durabildiği en arka çizgi | z = −9,80 (`AREA_RECTS[2].minZ` = `BAND.front`) |
| odanın fayans ön kenarı | z = −9,85 → **aradaki fark 0,05 br** |
| odanın dekor ön sınırı | z = −10,80 → aradaki fark 1,00 br |
| arka duvarın iç yüzü | z = −17,31 → aradaki fark 7,51 br |
| oyuncu yarıçapı / geçiş için gereken açıklık | 0,47 / **0,94 br** |

**Ön hattın boşlukları** (collision gövdeleri arasında):

| x aralığı | genişlik | geçer mi? |
|---|---|---|
| −17,41 … −14,60 (batı ucu) | **2,81 br** | **GEÇER** |
| −11,40 … −11,20 | 0,20 br | geçmez |
| −8,60 … −8,40 | 0,20 br | geçmez |
| −6,40 … −4,70 (doğu ucu) | **1,70 br** | **GEÇER** |

İki uçta geçişe fazlasıyla yeten açıklık **var**; oyuncuyu durduran şey geometri değil,
`clampToOpenAreas` kelepçesi. Yani oyuncu odanın **5 cm** yanında durup, gözle açık duran
2,81 br'lik boşluktan içeri giremiyor.

**E1'in bedeli** — `BAND.front` **19 yerden, 10 dosyadan** okunuyor:
`kitchenLook.ts` (1) · `maketParts.tsx` (1) · `Scene.tsx` (2) · `wallLook.ts` (2) · `layout.ts` (2) ·
`tests/layout-b31` (6) · `tests/logic` (1) · `tests/olcu-donduruldu` (1) · `tests/wall-look` (2) ·
`tests/wc-odasi` (1).

### Ç — Çaycı: odanın en görünür kişisi, oyuna en az bağlı olanı

| ölçüt | sayı |
|---|---|
| yol | a [−14,60, −11,30] → b [−11,40, −11,30] · uzunluk **3,20 br** |
| odanın eninin ne kadarını geziyor | **%25** (12,71 br'nin 3,20'si) |
| odanın derinliğinin ne kadarını geziyor | **0** — tek bir z hattı |
| arka duvara uzaklık | 6,01 br (odanın dolu tarafı arkada, çaycı önde) |
| **başının görünürlüğü** | **234 duruşun %100'ünde** |
| `useGame()` okuması | 1 (yalnız `areasOpen`) |
| sipariş / servis / kuyruk okuması | **0** |
| klip | sabit `hal="calis"` — yürürken de aynı klip |
| yol denklemi | `sin(t·0,3)` — oyun hızından ve sipariş yükünden bağımsız |

**Hüküm:** ekranda her an duran karakter, oyunun durumundan hiçbir şey bilmiyor. Yoğun saatte de
bomboş salonda da aynı hızda, aynı klible gidip geliyor.

### D — Doluluk: oda %39 dolu, boşluk tam da görünen yerde

| ölçüt | sayı |
|---|---|
| oda zemini | 94,82 br² |
| DOLU | **36,83 br² (%39)** — 17 gövde (14 mutfak ünitesi + ön hattın 3 tezgâhı) |
| BOŞ | **57,99 br²** |
| en büyük boş dikdörtgen | **8,96 × 4,46 br = 39,91 br² (odanın %42'si)** |
| o boşluğun ortası görünür mü | **%100 duruştan görünür** (x −11,08 · z −13,03 · y 1,00) |

| şerit | dolu | boş br² | görünür (baş) |
|---|---|---|---|
| arka duvar dibi | 99% | 0,12 | 25% |
| tezgâh hattı | 61% | 5,98 | 66% |
| **ODANIN ORTASI** | **22%** | **17,95** | **99%** |
| **çaycı koridoru** | **0%** | **17,82** | **96%** |
| ön sınır şeridi | 32% | 16,12 | 98% |

Doluluk arka duvara yapışmış (%99), boşluk ortada ve önde toplanmış — ve boşluk **tam olarak
en görünür şeritte**. Bu, `activeContext`'te açık duran "WC odasının ORTASI boş" kaleminin aynısı.

### K — Kademe: mutfak seviyeyle BÜYÜMÜYOR

| ölçüt | sayı |
|---|---|
| servis noktasının kademesi | **6 seviye** (`economy.config` görev hedeflerinden) |
| mutfak ünitesi | **19 adet — sabit liste** |
| `KitchenUnit`'te seviye alanı | **0** |
| `Kitchen.tsx` `useGame()` okuması | 1 (`kitchenTheme`) |
| `Kitchen.tsx` seviye okuması | **0** |
| seviye okuyan `src` dosyası (kıyas) | 14 |

**Hüküm:** tezgâh 6 kademe büyürken arkasındaki oda her seviyede aynı 19 üniteyi çiziyor.
Mutfak bugün bir kademe değil, tek seferde kurulmuş bir dekor. Bu, kullanıcının
*"önce ilerleme adımlarını tasarla — objeler küçük doğup yerinde büyür"* kuralıyla doğrudan çelişiyor.

---

## §Kollar (karar paketine giden seçenekler)

Her kolun yanında **ölçülen sayı** var; sayısı olmayan kol pakete girmedi.

| kol | ne yapar | dayandığı sayı | maliyet |
|---|---|---|---|
| **E0** | kapalı kalsın | erişim %0, bugünkü hâl | 0 |
| **E1** | açıklık + yürünebilir mutfak | 2,81 br boşluk geçişe yeter (gereken 0,94) | `BAND.front` 19 okuma / 10 dosya + nav ızgarası + müşteri yolu |
| **E2** | kapalılığı **okunur** kıl: iki uçtaki 2,81 + 1,70 br açıklık bölmeyle kapansın | oyuncu odanın 0,05 br yanında duruyor ve açık görünen boşluktan giremiyor | 2 gövde, kural değişikliği yok |
| **Ç0** | salt görsel kalsın | bugünkü hâl | 0 |
| **Ç1** | çaycı sipariş yüküne göre hızlansın/dinlensin (hâlâ salt görsel) | başı %100 duruşta görünür, mekanik okuması 0 | `KitchenHand` bir alan daha okur; `rules.ts` DIŞINDA |
| **Ç2** | yolu uzat / ikinci personel | yol odanın eninin %25'i; doğu yarısı (bulaşık-fırın-depo) personelsiz | yol tanımı + `staffWalk` |
| **D0** | orta boş kalsın | bugünkü hâl | 0 |
| **D1** | orta boşluğa dekor ada/istif | 39,91 br² %100 görünür boşluk; ada `MODULE_W` 1,80 ritmine oturur | ünite listesi uzar |
| **D2** | orta boşluk **kademeli** dolsun (seviye 1→6 ile büyüyen mutfak) | oda 19 sabit ünite · seviye okuması 0 · tezgâh 6 kademe | `KitchenUnit`'e seviye alanı + `Kitchen.tsx` seviye okuması |

**Not — varyant kapısı:** kolların hiçbiri `economy.config.ts` / `tick.ts` / `rules.ts`'e
dokunmuyor. E1 `layout.ts`'in alan dikdörtgenine dokunur (denge değil yerleşim), D2 yalnız
çizim katmanına. Yani bu turda denge sayısı değişmiyor.

---

## §Karar — **D-118** (kullanıcı, 2026-09-15)

Karar paketi: https://claude.ai/artifact/NzUs9PeHqzj48bekL78fqm

| kol | karar |
|---|---|
| **E2** | ✅ **SEÇİLDİ** — kapalılık okunur kılındı, iki uçtaki açıklık bölmeyle kapandı |
| **Ç1** | ✅ **SEÇİLDİ** — çaycının temposu çay bekleyen müşteri sayısından geliyor |
| **D2** | ⏭ **S21'e** — mutfak seviyeyle büyüsün; önce ilerleme adımları tasarlanacak |
| E0 · E1 | E1 elenmedi, **Faz H'ye** bırakıldı: nav ızgarası orada zaten açılacak |
| Ç0 · Ç2 | Ç2 Ç1'den sonra anlamlı; bu turda alınmadı |
| D0 · D1 | D1 reddedildi — en görünür alanı sabit süse harcardı |

---

## §Final koşu (uygulamadan sonra)

**Araç güncellendi:** §E-3b ve §Ç-3 blokları karar SONRASINDA eklendi; final koşunun kanıtı bunlar.

| ölçüt | sonuç |
|---|---|
| üretilen bölme | **2** — batı x −17,41…−14,60 (2,81 br) · doğu x −6,40…−4,70 (1,70 br) |
| bölmelerin z / derinliği | −10,30 / 1,00 — ön hattın kendi hizası (banko tek çizgi okunur) |
| **geriye kalan geçişe yeten açıklık** | **YOK** |
| dar dikişler | açık bırakıldı (0,20 br < 0,94) — üç tezgâhın ayrımı korundu |
| çaycı çarpanı 0 / 1 / 2 / 3 / 4+ bekleyen | **0,00 / 0,60 / 1,07 / 1,53 / 2,00** — boş↔dolu **3,33×** |
| çaycı klibi | yük yok → `dur` · yük var → `calis` |
| çaycının duruma YAZMASI | **0** — D-023 bozulmadı (okur, yazmaz) |

**Bekçi:** `tests/mutfak-s20.test.ts` — 17 denetim, **3 mutasyonla** doğrulandı:

| mutasyon | ne yapıldı | sonuç |
|---|---|---|
| M1 | bölme üretimi kapatıldı (eşik 100) | **5 test kırmızı** |
| M2 | yük yokken çaycı yine yürüsün (`0` → `azCarpan`) | **1 test kırmızı** |
| M3 | dar dikişler de kapatılsın (eşik 0,01) | **5 test kırmızı** |

**Final:** vitest **1051 ✓** · duman **42/42 ✓** · tam ölçüm koşusu **17 damga yeşil** · konsol hatası YOK.

**Kareler:** önce `ss/s20-mutfak-{taban,npc,plan}.png` · sonra `ss/s20-mutfak-{taban,npc,plan}-son.png`

### Uygulamanın yakaladığı bir kusur

Taban koşusundaki **“çaycı mekaniğe bağlı DEĞİL”** damgası (`useGame okuması 1`) Ç1 uygulanınca
kırıldı — doğru davrandı. Korunması gereken şey o sayı değil, altındaki kuraldı: çaycı durumu
**okuyabilir, yazamaz**. Damga yeniden yazıldı (okuma 2 · yazma 0). Sayıyı bekçileyen damga,
kuralı bekçileyen damgadan daha kırılgan.
