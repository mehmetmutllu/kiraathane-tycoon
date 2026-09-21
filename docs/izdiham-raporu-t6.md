# T6 — KAPI ÖNÜNDEKİ İZDİHAM (G-91)

> **Karar bölümü bu commit'te BOŞ** (D-084 adım 2).
> Araç: `tools/olcum-izdiham-t6.ts` · ham çıktı `docs/olcum-izdiham-t6.txt`
> Ölçüm kolu (varyant katmanı): `src/game/tick.ts` → `izdihamKoluAyarla` (varsayılan `null`).

## §0 Soru

Kullanıcı, 2026-09-21:

> *"girişte bir süre sonra kapı dışında izdiham oluyor içeri girmeye çalışan 100lerce npc
> birikiyor ona da bir kontrol getirilmeli artık dışarı biri çıkmadan biri spawn edilmez mi
> yaparız yoksa farklı bir yol vs mi düşünürsün bilemem."*

T5b'nin kısıksız tam koşusu aynı şeyi **bağımsız olarak** ölçmüştü (`docs/olcum-nav-ab-t5b-masaustu.txt` §1):
dünya 240 sn ısıtılmış olmasına rağmen 2 dakikada üçgen **+%80**, kare işi **+%31**,
NPC **39 → 56** — T4 §C'nin ölçtüğü tavan 39'du ve tırmanış bitmemişti.

## §1 Ölçüm dünyasının kusuru — turun ilk bulgusu

Aracın ilk işi kol ölçmek değil, **büyümenin bu ortamda yeniden üretilip üretilemediğini**
sınamaktı (T4 §B sürüklenmeyi DÜZ bulmuştu, %0,5; T5b aynı dünyada +%31 gördü — çelişkiyi
çözmeden üçüncü bir sayı eklemek anlamsızdı).

İlk koşu büyümeyi yeniden üretti **ama yanında bir kurulum kusuru gösterdi**:

| | ölçülen |
|---|---|
| temiz bardak havuzu | koşu boyunca **0-2** |
| hazır çay | **0** |
| `drinking` (içen müşteri) | **0** |
| gelir | **47 ₺/dk** (20 masalık geç oyunda) |

Sebep: `gecOyunKur` tüm pad'leri açıyor ama **`stationLevels`e hiç dokunmuyor**. Pad listesi
servis merdivenini taşımaz — tezgâh (L4) ve tost (L5) `stationLevel` **görevleriyle** gelir.
Yani "tüm pad'ler açık" kurulumu pratikte **20 masaya seviye-0 ocak** demekti; bardak havuzu
`3 alan × poolBase 10 = 30` ve 20 masa onu anında tüketiyor.

**Bu kurulum `tools/olcum-nav-t5.ts`ten devralındı** ve tarayıcı tarafındaki `dunyaKur`
(`tools/olcum-perf-t4.mjs`, `tools/olcum-nav-ab-t5b.mjs`) da `stationLevels` yazmıyor.
→ T4/T5/T5b'nin ölçtüğü "geç oyun" dünyası **sanılan dünya değildi.**

**O turların sonuçları geçersiz DEĞİL:** nav maliyeti ızgaraya, doluluğa ve mesafeye bağlıdır,
servis zincirine değil — ve T5b'nin A/B'si iki kolu *aynı* dünyada karşılaştırıyor, yani
dünyanın ne olduğu oranı etkilemez. Ama **dünyanın ne olduğu yanlış biliniyordu** ve bu, ileride
servis/denge ölçen bir tur için sessiz bir tuzaktı. T6'da düzeltildi (ocak tavana alınıyor).

> **Ve düzeltme bulguyu değiştirmedi:** ocak tavandayken servis akıyor (gelir 78-552 ₺/dk,
> `drinking` > 0) ve büyüme **aynen duruyor**. Yani izdiham, servis tıkanmasının sonucu değil.

## §2 Kök neden — ölçüldü, tahmin edilmedi

İlk şüpheli yapısaldı ve kodda doğrulanmıştı: `tick.ts` doğma tavanını yalnız `!hasLeftTable`
olan NPC'lere uyguluyor, yani `leaving`/WC sayılmıyor → ekrandaki toplam nüfusun tavanı yok.
**Bu doğru ama YETERSİZ bir açıklama:** tavanın yokluğu birikmeye *izin verir*, birikmeyi
*yaratmaz*. Yaratan şey ölçümle bulundu.

### 2.1 Büyümenin tamamı tek bir durumda

| 5 dakikada | başlangıç | son | değişim |
|---|---|---|---|
| toplam NPC | 93 | 291 | **+%213** |
| tavanın **gördüğü** nüfus (`!hasLeftTable`) | 45 | 55 | +%22 ✓ kelepçe çalışıyor |
| tavanın **görmediği** (`leaving` + WC) | 48 | 236 | **+%392** |
| `leaving` | 48 | 236 | **+%392** |
| kapı kuşağı (z > 14) | 47 | 250 | **+%432** |

### 2.2 Çıkış yavaş değil, KIRIK

Araç `leaving` NPC'lerin z dağılımını ve bir önceki örnekten kaç tanesinin **hâlâ** `leaving`
olduğunu saydı — "yavaş" ile "takılmış"ı ayıran tek ölçü budur:

| 300. sn | sayı |
|---|---|
| salonda (z < 14) | 8 |
| kapı önü (14 – 16,4) | 6 |
| **eşikte (16,4 – 20)** | **98** |
| **sokakta (z > 20)** | **124** |
| **10 sn önceki örnekte de `leaving` olan** | **231 / 236** |

236 NPC'nin 231'i on saniye önce de aynı durumdaydı. Salon tarafı temiz; yığılma **tamamen
kapının dışında**. Kullanıcının cümlesi birebir bu.

### 2.3 Mekanizma

`leaving` durumundaki her NPC **aynı tek noktaya** yürüyor:

```ts
const nStreet = streetAt(areasOpen);           // [kapı x, 0.6, 20.5] — TEK nokta
if (moveToward(n.pos, nStreet, step)) removed.push(n.id);
```

`moveToward` ancak `d <= step` olunca `true` döner ve NPC silinir. `step = NPC_SPEED × dt`,
yani **0,023 br**. Aynı karede `npcAyristir` (S18'de eklenen müşteri-müşteri itme kuvveti)
onları birbirinden iterek dağıtıyor:

| | br/sn |
|---|---|
| `NPC_SPEED` (hedefe çeken) | **1,40** |
| `AYRISMA_HIZ` (birbirinden iten) | **2,40** |

**İtme kuvveti çekme kuvvetinden ×1,71 güçlü.** Kalabalık sokak noktasının etrafında bir denge
halkası kuruyor ve **hiç kimse `step` mesafesine giremiyor** → kimse silinmiyor → yığın büyüyor
→ itme daha da güçleniyor. Pozitif geri besleme.

`AYRISMASIZ` kümesi (`tick.ts`) şunları muaf tutuyor: `waitingForTea` · `drinking` · `inWc` ·
`wcGiris` · `wcCikis`. **`leaving` muaf değil** — ve o, herkesin aynı noktaya gittiği tek durum.

> **S18 bu dengeyi GÖRMÜŞ ama kusur saymamış.** `tick.ts`in kendi yorumu:
> *"kalan çakışma KAPI HUNİSİNDEN geliyor. Orada iki müşteri aynı noktaya yürüyor; ayrışma iter,
> hedefe gidiş geri toplar ve denge 0,413'te kuruluyor. Bu bir kusur değil dar geçidin kendisi."*
> İki müşteriyle bu doğru. **124 müşteriyle aynı denge bir kilittir.** Ders: bir kuvvetin
> ölçüldüğü nüfus, hükmünün geçerli olduğu nüfustur.

### 2.3b Çıkış, oyundaki TEK "tam varış" şartı

Kodda on üç hareket çağrısı var ve **on ikisinin bir varış payı var**:

| çağrı | pay (br) |
|---|---|
| masaya oturma (`navStep` → koltuk) | 0,50 |
| WC kapısı (`navStep` → `LAVABO.spot`) | 0,45 |
| `leaving` içerideyken kapıya (`navStep` → giriş) | 0,40 |
| garson/bulaşıkçı hedefleri | `REACH_TABLE` · `REACH_PICKUP` · `REACH_HOME` · `collectRadius` |
| **çıkış → sokak (SİLME ŞARTI)** | **`step` ≈ 0,023** |

Yani silme şartı en yakın kardeşinden **~17 kat**, en gevşeğinden **~22 kat** dar. Aynı `leaving`
durumu salon içindeyken 0,40 payla yürüyor, kapının dışına çıkınca pay **0,023**'e düşüyor.

**Kilit tam olarak bu iki şeyin üst üste gelmesidir:** oyunda başka hiçbir yerde "herkesin aynı
noktaya yürüdüğü" ile "tam varış şartı" bir arada değil. WC de tek noktadır ama payı 0,45'tir;
masa payı 0,50'dir ama hedefler zaten dağınıktır.

### 2.4 İkinci geri besleme: izdiham kareyi de ikinci kez vuruyor

Aynı fonksiyon — `npcAyristir` — **O(n²)**: muaf olmayan her NPC çifti her karede sınanıyor.
`leaving` muaf olmadığı için yığın doğrudan bu çarpana giriyor:

| | muaf olmayan NPC | kare başına çift denetimi |
|---|---|---|
| koşu başı | ~48 | ~1.100 |
| 5 dakika sonra | ~236 | **~27.700** |

Yani izdiham **×25 daha fazla çift denetimi** üretiyor. Bu, T5b'nin ölçtüğü kare işi
artışının (+%31, 2 dakikada) ikinci ve bağımsız kaynağıdır — ve T4 §G'nin *"`npcSystem` tek
başına karenin %27,3'ü"* satırının neden o kadar büyük olduğunu da açıklar.

**İki geri besleme aynı kökten çıkıyor:** yığın büyüdükçe ① itme kuvveti artıyor (daha az
silinme) ve ② çift denetimi karesel artıyor (daha ağır kare). Kökü kapatmak ikisini birden
kapatır; tavanı kapsamı düzeltmek (S4) yalnız ikincisini sınırlar.

## §3 Piyasa standardı (araştırıldı)

Kullanıcı *"senin araştırıp piyasa standardı ne ise bulman gerek"* dedi. Bulunan:

**Türün referansları müşteriyi ORANLA değil KAPASİTEYLE doğuruyor.** Restaurant Tycoon 3'te
müşteri ancak **uygun bir masa varsa** beliriyor; uygun masa = en az bir sandalyesi olan, başka
grupça tutulmayan, üstünde para bulunmayan masa. Restaurant Tycoon 2'de de grup ancak masa
müsaitse ve kapıda bekleyen yokken yaklaşıyor. Yani kalıp *"kuyruk dolunca müşteri küssün"*
değil, **"yer yoksa hiç doğmasın"**.

Kuramsal karşılığı **Little yasası**: `N = λ × W`. Doğma hızı `λ` sabitken sistemde geçirilen
süre `W` sıkışma yüzünden büyürse nüfus `N` sınırsız büyür; stabilite için `ρ = λ/μ < 1`
**yapısal olarak** garanti edilmelidir — yani doğma, çıkışa bağlanmalıdır (kapalı çevrim).

**Kullanıcının kendi önerisi** (*"dışarı biri çıkmadan biri spawn edilmez mi"* / *"biri kalkmadan
başkası spawn olmaz"*) tam olarak bu kalıptır ve **kodumuz bunu zaten yapıyor**
(`findTableForGroup` boş koltuk arar). Kusur tasarımda değil **kapsamda**: tavan nüfusun bir
alt kümesine uygulanıyor, ve asıl sorun tavanın kendisi değil **çıkışın tıkanmış olması**.

Kaynaklar: [Restaurant Tycoon 3 — Customers](https://rt3.fandom.com/wiki/Customers) ·
[Restaurant Tycoon 2 — Customers](https://restaurant-tycoon-2.fandom.com/wiki/Customers) ·
[Little's Law](https://businessmap.io/continuous-flow/littles-law)

## §4 Ölçülen kollar

Kollar `tick.ts`e dokunuyor → **varyant kapısı**: hiçbiri dosyaya yazılmadan, çalışma anında
takılıp geri alınarak ölçüldü (`izdihamKoluAyarla`; `nav.ts`in A/B kolu ile aynı desen).

| kol | ne yapar | hangi halkaya bakar |
|---|---|---|
| **S0** | bugünkü hâl | taban |
| **S1** | `leaving` ayrışmadan muaf | **kökün doğrudan karşılığı** (2.3) |
| **S2** | çıkış hedefi dağıtılır (her NPC kendi x'ine) | herkesin aynı noktaya gitmesi |
| **S3** | silme yarıçapı 0,8 br (tam varış yerine) | `d <= step`in dar olması |
| **S4** | doğma tavanı TÜM nüfusa | kapsam (piyasa standardının kelepçesi) |
| **S5** | S1 + S4 | kök düzeltmesi + emniyet kemeri |
| **S6** | S1 + S3 | kök düzeltmesi + yarıçap |

**KORUNUM ŞARTI:** hiçbir kol ₺/dk'yı düşürmemeli. İzdihamı "doğmayı kısarak" çözmek kolaydır
ama o, oyunu yavaşlatmaktır — **S4 tam olarak bu riski taşır** ve tablo onu görünür kılar.

### §Bulgular — TAM koşu (3 tohum × 600 sn · ham çıktı `docs/olcum-izdiham-t6.txt`)

**Taban tek başına (10 dk pencere):** toplam NPC **193 → 494 (+%156)** · tavanın gördüğü nüfus
51 → 53 (**+%3,9**, kelepçe çalışıyor) · `leaving` **142 → 441** · kapı kuşağı **157 → 475**.

| kol | NPC son | artış | leaving | kapıda | servis/dk | korunum | ₺/dk |
|---|---|---|---|---|---|---|---|
| **S0** taban | 485,7 | **+%168,7** | 433,0 | 461,0 | 6,9 | — | 133 |
| **S1** `leaving` ayrışmasız | **59,3** | **+%4,4** | 13,7 | 12,3 | 6,3 | −%9,2 | 127 |
| S2 çıkış dağıtımı 0,6 | 82,0 | +%26,4 | 37,3 | 36,3 | 6,3 | −%8,7 | 125 |
| S3 silme yarıçapı 0,8 | 63,0 | +%4,5 | 14,7 | 9,3 | 6,0 | −%12,6 | 121 |
| **S4** tavan tüm nüfusa | 58,0 | %0,0 | 56,0 | 58,0 | **0,1** | **−%98,6** | 23 |
| **S5** = S1 + S4 | **56,3** | **+%0,7** | 13,7 | 10,3 | 6,1 | −%11,1 | 114 |
| S6 = S1 + S3 | 59,3 | +%5,6 | 13,7 | 12,3 | 6,3 | −%9,2 | 127 |

#### Bulgu 1 — S1 kökü kapatıyor

Kapı kuşağı **461 → 12,3**, artış **+%168,7 → +%4,4**. Tek satırlık bir muafiyet (`leaving`
ayrışmadan muaf) §2.3'te ölçülen kilidi çözüyor. Beklenen sonuç: itme kuvveti kalkınca
`moveToward` hedefe varabiliyor ve NPC siliniyor.

#### Bulgu 2 — "doğmayı kıs" kolu ÖLÇÜLEREK çürüdü

**S4 tek başına en mantıklı duran koldu** (kullanıcının önerdiği kapsam düzeltmesi, piyasa
standardının kelepçesi) ve nüfusu gerçekten sabitliyor: 58,0, üç tohumda da birebir.
**Ama servis 6,9 → 0,1/dk (−%98,6) ve gelir 133 → 23 ₺/dk.**

Sebep mekanizmadan okunuyor: çıkış kırıkken `leaving` NPC'ler hiç silinmiyor, tavan tüm nüfusu
saydığı için **doğma tamamen duruyor** — mekân 56 kilitli müşteriyle doluyor ve yeni müşteri
gelmiyor. Yani S4, izdihamı çözmüyor; **izdihamı dondurup oyunu durduruyor.**

> Bu turun en pahalı satırı budur. Kol tabloya girmeseydi "nüfus 58'de sabit" sayısı tek başına
> onu kazanan kol gösterirdi. Korunum sütunu olmadan ölçüm, doğru cevabı yanlış okur.

#### Bulgu 3 — Emniyet kemeri BEDAVA DEĞİL (önceki okuma düzeltildi)

Kısa koşuya bakıp *"tavan yalnız çıkış kırıkken bağlayıcı, S1 varken bedava"* demiştim. **Tam
koşu bunu düzeltiyor:** S5'in toplam nüfusu **56,3** ve tavan (`totalSeats + 2` ≈ 57-58) tam
orada — yani kelepçe **bağlıyor**. Bağlamasının sebebi de ölçülü: çıkış hattındaki **13,7** kişi
tavanın içinde yer tutuyor, o kadar doğma yuvası kapanıyor.

Bedeli küçük ama sıfır değil: S1 → S5'te servis **6,3 → 6,1**, NPC 59,3 → 56,3.

#### Bulgu 4 — S3 gereksiz, S6 ≡ S1

S6 (S1 + S3) satırı S1 ile **birebir aynı** (59,3 / 13,7 / 12,3 / 6,3). Yarıçap S1 varken hiç
tetiklenmiyor, çünkü ayrışma kalkınca NPC zaten tam varışa ulaşıyor. S3 **tek başına** ise
çalışıyor (+%4,5) ama servisi en çok düşüren koldur (−%12,6). → eklenecek bir şey yok.

#### Bulgu 5 — S2 yetersiz

Çıkış hedefini dağıtmak yığını **azaltıyor ama kapatmıyor** (+%26,4, kapıda 36,3). Beklenir:
dağıtım yoğunluğu düşürüyor, ama itme kuvveti hâlâ çekme kuvvetinden güçlü — dokuz ayrı nokta
da dokuz ayrı küçük kilit kuruyor.

#### Bulgu 6 — KORUNUM: çözünürlüğün sınırında, dürüst hâli

Bütün düzeltme kolları tabandan **%9-12 daha az** servis gösteriyor. Bunu "kollar geliri
düşürüyor" diye okumak **veri tarafından desteklenmiyor**:

| kol | tohum 1 | tohum 2 | tohum 3 |
|---|---|---|---|
| S0 taban | 6,6 | 7,0 | 7,1 |
| S1 | **6,8** | 6,0 | 6,0 |
| S5 | 6,1 | 6,5 | 5,8 |

S1'in en iyi tohumu (6,8) tabanın en kötüsünün (6,6) **üstünde** — yani üç tohumun biri yönü
ters çeviriyor. Ayrıca **nedensel bir yol yok**: "kapıda kilitli kalanları daha hızlı sil"
ile "daha az müşteri servis et" arasında bir mekanizma bulunamadı; varsa ters yönde olmalı
(S0'da kapıdaki 461 kişi, içeri giren `toTable` müşterilerini de itiyor).

**Dürüst hüküm:** ±%10'luk korunum eşiği, bu ölçümün kendi çözünürlüğünün sınırında.
Kesin cevap için ya daha çok tohum ya da servis sayacını doğrudan hedefleyen ayrı bir koşu
gerekir. **S4'ün −%98,6'sı bu tartışmanın dışındadır** — o, gürültünün iki mertebe üstünde.

#### Yan bulgu — bardak havuzu masa sayısıyla ölçeklenmiyor (T6'nın konusu DEĞİL)

Ocak tavandayken bile: havuz **42** (`3 alan × 10 + 2 × 6`), ölçülen temiz bardak koşu boyunca
**0**, 2 dakikada **15 servis**. 20 masalık bir mekân 42 bardakla besleniyor. Bu bir denge
kalemidir ve **T8'in denge turuna** yazıldı; T6'da hiçbir kol buna dokunmadı.

## §Karar

_(boş — karar paketi kullanıcıya sunulacak; D-084 adım 3)_
