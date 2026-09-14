# S19a raporu — patron dokunuşu · oturuş çapası · sipariş balonu glifleri

**Tur:** S19a (Faz S) · **Damga:** 2026-09-14 · **Kural:** `docs/oturum-akisi-mantik.md` (D-084)
**Ham çıktı:** `docs/olcum-oturus.txt` · `docs/olcum-oturus.json`
**Kareler:** `docs/gorsel/ss/s19-oturus.png` · `docs/gorsel/ss/s19-patron.png` · `docs/gorsel/ss/s19-glif.png`
**Araçlar:** `tools/olcum-oturus.{html,mjs}` · `tools/patron-dokunus.{html,mjs}` · `tools/glif-bak.{html,mjs}`

## Soru

Kullanıcının 2026-09-14 gecesi verdiği yedi kalemin ilk üçü. Üçü de görsel; hiçbiri
`economy.config.ts` / `tick.ts` / `rules.ts`'e dokunmuyor, yani varyant kapısı denge tarafından
tetiklenmiyor — ama üçü de **ölç → sor → uygula** sırasına tabi.

1. **P — patron dokunuşu.** S18'de patron koyu lacivert gömlekle ayrılmıştı; kullanıcı geri aldı:
   *"üstü garip olmuş, beyaz daha ayırt ediciydi o kalabilir ama diğerlerinde olmayan farklı bir
   dokunuş yap"*. Gömlek krem kalacak, ayıran şey başka bir parça olacak.
2. **O — oturuş.** *"götleri biraz dışarda kalıyor"*. S15'te `KAY_OTURMA_KALDIRMA` ile DÜŞEY eksen
   kapatıldı (kalça 0,45'e geldi); YATAY eksen hiç ölçülmedi.
3. **G — sipariş balonu glifleri.** *"yeterince iyi değil"*. Balonun ölçüsü ve grameri (kalın koyu
   kontur, krem gövde, kuyruk) S18'de kabul edildi; yeniden çizilecek olan içerideki bardak ve tost.

## Bulgular

### O — oturuş çapası (sayı burada)

Ölçüm derinin kendisinde yapıldı: oturuş klibi çalınıp her tepe noktası `applyBoneTransform` ile
gerçekten deforme edildi, sonra taburenin **oturak çokgeniyle** (daire değil — 12 kenarlı, kenar
yarıçapı 0,437, köşe yarıçapı 0,450) karşılaştırıldı. Taşma üç yönde ayrı sayılır: **arka** =
kalçanın sarkması (sorulan kusur), **ön** = uyluk (oturuşun doğası), **yan** = kalçanın oturaktan
geniş olması (z çapası bunu düzeltmez).

**Kök sebep tek sayıda:** `Sit_Chair_Idle` klibinde kalça kemiği kökün **0,315 br ARKASINDA**
(beş gövdede de aynı — hepsi aynı rig). Oyun kökü taburenin merkezine koyuyor ve çapa yok; yani
gövde oturağın arka kenarına yaslanmış oturuyor.

| kol | dz | en kötü ARKA taşma | en kötü ÖN taşma | en ileri deri | masa açıklığı 0,61 |
|---|---:|---:|---:|---:|---|
| **O1 BUGÜN** (çapa yok) | 0 | **0,258** | 0 | 0,154 | temiz |
| O2 kalça merkezli | 0,32 | 0 | 0,136 | 0,474 | temiz |
| **O3 en küçük oturtan** | 0,26 | **0** | 0,076 | 0,414 | temiz |
| (ara) | 0,24 | 0,018 | 0,056 | 0,394 | temiz |
| (ara) | 0,20 | 0,058 | 0,016 | 0,354 | temiz |

Sütunlar beş müşteri gövdesinin (Knight · Rogue · Mage · Barbarian · Ranger) **en kötüsünü**
gösterir — kod tek sabit yazacağı için karar o sayıyla verilir. Gövde başına en küçük oturtan
çapa 0,17 (Mage) ile 0,26 (Rogue · Ranger) arasında.

Ek bulgu: **Ranger'ın yan taşması 0,094 br** — kalçası oturaktan geniş, z çapası bunu kapatmıyor
(açık kalemdeki "Rogue'un omzu 0,709" ile aynı aile: gövde/mobilya oranı). Bu tur bunu çözmüyor.

Masaya girme riski yok: en ileri deri 0,474 br, tabure merkezi ile tabla kenarı arası 0,61 br.

### P — patron dokunuşu (kare: `s19-patron.png`)

Sekiz kart, her kartta solda **sahip adayı**, sağda **değişmeyen garson** (krem gömlek + bordo
önlük). S18'in dersi uygulandı: göğse takılan levha kolları (yelek/plaka) bu turda hiç denenmedi —
önlükten ayrışmıyorlar. Adaylar omuz · bel · kol üzerinden:

| kol | dokunuş | not |
|---|---|---|
| P1 | bugünkü lacivert gömlek | geri alınacak olan; referans |
| P2 | yalın (krem + önlüksüz) | ayıran tek şey önlüğün yokluğu |
| P3 | **omuz havlusu** (bordo) | krem havlu krem gömlekte kayboldu → bordoya çekildi |
| P4 | **bel önlüğü** (bordo, kısa) | garsonunki göğüsten, patronunki belden |
| P5 | **kolları sıvalı** | alt kol + el ten rengine döner |
| P6 | bel kuşağı (bordo) | en sessiz kol |
| P7 | havlu + sıvalı | |
| P8 | bel önlüğü + sıvalı | |

**Kolları sıvalı** kolu bir teknik de getiriyor: KayKit'te kol TEK mesh, ama tepe noktalarının
kemik ağırlıkları dosyada yazılı. Alt kol/bilek/el kemiklerine ağırlığı yarıdan fazla olan tepe
noktaları ten rengine boyanıp renk bir **vertex color** katmanı olarak yazılıyor — geometri
kesilmiyor, malzeme tek kalıyor (çizim sayısı artmıyor), sınır dirsekte doğal duruyor.

### G — balon glifleri (kare: `s19-glif.png`)

Sekiz kart; her kart **iki boyda**: 200 px ve oyundaki gerçek boy **44 px** (D-108 kuralı: ikon
gerçek boyda sınanmadan seçilmez). Bugünkü çizim karta **kaynaktan** (`siparisDokusu()`) geliyor,
elle kopyalanmış taklidi değil.

Ölçülen ilk kusur zaten burada görünüyor: **bugünkü glif balonun içine sığmıyor** — bardak
balonun alt kenarını ve kuyruğu kesiyor, tost üçgeni de kenara dayanıyor. Adaylar ortak bir iç
dikdörtgene sığdırılarak çizildi, yani karede **eşit ağırlıkta** duruyorlar.

| kol | çay | | kol | tost |
|---|---|---|---|---|
| C1 | bugünkü (taşıyor) | | T1 | bugünkü tek üçgen |
| C2 | keskin ince bel (ağız açık, bel dar, tabak alçak) | | T2 | iki üçgen dilim, biri önde |
| C3 | bardak + kaşık + buhar | | T3 | dikdörtgen tost + ızgara izi |
| C4 | yalın büyük bardak (tabaksız) | | T4 | tabakta iki üçgen |

## Araç notu — bu turda düşülen tuzak

Ölçüm aracı üç kez yeniden yazıldı çünkü kare üç uygulamada da **birebir aynı PNG**'yi üretti.
Sebep render kolu değildi: kollar x ekseninde 6 birim aralıkla diziliydi ve her kamera bir sonraki
kolun 0,2 birim içine düşüyordu. Ayrıca yolun başında **portta asılı kalmış eski bir vite
sunucusu** bayat sayfa servis etti (`--strictPort` ile yeni sunucu doğamıyor, yoklama ise eskisini
"ayakta" sayıyor). İkisi de kalıcı olarak kapatıldı: araçlar artık **boş port tarıyor** ve sayfanın
**SURUM damgasını** denetleyip tutmazsa ölçümü durduruyor.

## Karar

<!-- adım 3'te kullanıcı seçer — D-0xx -->

## Uygulama

<!-- adım 4: yalnız kararın kolu -->
