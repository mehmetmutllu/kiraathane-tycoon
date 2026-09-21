# T5 — `findNavPath`: kare payının bölüşümü ve kollar

**Tur:** T5 (nav) · **Araç:** `tools/olcum-nav-t5.ts` · **Ham çıktı:** `docs/olcum-nav-t5.txt`
**Dayanak:** T4 §F (D-138) — kare 40,3 ms, `findNavPath` 12,71 ms (**%31,5**), 20,5 çağrı/kare.

---

## §0 TURUN ÖNÜNDEKİ ENGEL — T4'ün ölçüm dikişi node tarafını kırmıştı

T4, kare bölüşümünü ölçmek için `nav.ts` ve `tick.ts`e `import.meta.env.DEV && olcumAcik()`
dikişini koydu. Vite bunu derlemede sabite çevirir; **node `import.meta.env`i hiç tanımaz.**
Sonuç: `tsx` ile koşan her araç ilk `findNavPath` / `runTick` çağrısında

```
TypeError: Cannot read properties of undefined (reading 'DEV')
```

ile ölüyordu. Ölen takım: `npm run sim` (`tools/simulate.ts`), `olcum-kuyruk`, `olcum-bardak`,
`olcum-nav-oyuncu`, `olcum-gec-oyun`, `tick-fingerprint` — yani **T3 denge turunun bütün aleti**.
Bu tur ölçüm aracını yazmaya çalışırken yakalandı; araç kendi ilk koşusunda bu hataya çarptı.

**Neden hiçbir test görmedi:** vitest vite altında koşar, testin içinde `import.meta.env.DEV`
**tanımlıdır**. Kapı vitest'te hep açık olduğu için sıradan bir çalışma-zamanı testi bu kusuru
yapısal olarak yakalayamaz.

**Kapatılış:** DEV kapısı çağıranlardan alınıp `olcum.ts`e, tek yere ve node-güvenli biçimde
taşındı (`(import.meta as { env?: { DEV?: boolean } }).env?.DEV === true`); kapı artık
`olcumAc()` tarafında, sıcak yol hâlâ TEK boolean okur ve üretimde `acik` hiç true olamaz.
Bekçi `tests/olcum-dikis.test.ts` (3 denetim): kaynak taraması + `olcum.ts`in güvenli biçimi +
gerçek `tsx` alt süreci. **3/3 mutasyonla doğrulandı** (nav.ts'i eski dikişe döndür → 2 denetim
düştü · olcum.ts kapısını çıplak okumaya çevir → 3/3 düştü · `economy.config.ts`e çıplak okuma
ekle → 1 denetim düştü).

---

## §1 SORU

`findNavPath` karenin %31,5'i. Bu maliyetin **nesi** pahalı — tampon ayırma mı, ızgarayı
gezmek mi, hedef testi mi? Ve: **birebir aynı çıktı veren** kollar yetiyor mu, yoksa
davranışı değiştiren bir kol mu gerekiyor?

Turun açılışındaki varsayım (`activeContext` tur kartı, D-138'den devralınan) şuydu:
*"`navStep` her karede 41 KB `Int32Array` ayırıp sıfırlıyor ⇒ kare başına ~726 KB çöp;
**N-1** kalıcı tampon bunu kaldırır."* Bu turun ilk işi o varsayımı ölçmekti.

---

## §2 YÖNTEM

**Korpus gerçek koşudan.** BFS'in maliyeti hedefin uzaklığına ve ızgaranın doluluğuna bağlı;
uydurma başlangıç/hedef çiftleri kolları yanlış sıralar. `nav.ts`e kalıcı bir ölçüm kancası
eklendi (`navKorpusAc/Oku/Kapat`, kapalıyken bedeli tek null okuması): geç-oyun dünyası
kurulup ısıtılıyor, sonraki karelerin **bütün `findNavPath` çağrıları argümanlarıyla**
kaydediliyor. Kollar aynı korpusta yarışıyor.

**Kollar (kod yazılmadan, hepsi varyant):**

| kol | ne yapıyor | çıktı |
|---|---|---|
| **N0** | bugünkü kod — her çağrıda `new Int32Array(cols*rows).fill(-2)` + tam BFS | taban |
| **N1a** | kalıcı tampon + kuşak damgası (ayırma/sıfırlama yok) | birebir aynı |
| **N1b** | N1a + hedef testi **pop** yerine **push**'ta | birebir aynı |
| **N1c** | N1b + hedef hücre maskesi önceden (sıcak döngüde `cellCenter` yok) | birebir aynı |
| **N3** | A* (oktil sezgisel, ikili yığın) | **farklı** — eşit yollar arasında başka seçim |
| **N2** | yol önbelleği (`navStep` kare-atlamalı yeniden kullanım) | **farklı** — bayat yol |

**N1b'nin birebirliği ölçümle değil kanıtla duruyor:** kuyruk FIFO'dur ve hücreler push
sırasında pop edilir; dolayısıyla kuyruğa **ilk giren** hedef hücresi, kuyruktan da **ilk çıkan**
hedef hücresidir. Aynı hücre bulunur, yalnız son katmanın kalanı genişletilmez. `start` hiç
push edilmediği için N0'ın `idx !== startIdx` ayrımı da kendiliğinden korunur.

**N1c'nin maske kutusu da kanıtlı:** merkezi `reach` mesafedeki hücreler, hedefin hücresinden
en çok `ceil(reach/cell)+1` sütun/satır uzakta olabilir; hedef ızgara dışındaysa kelepçe kutuyu
kaydırır ama o durumda geçerli hedef hücreleri de kelepçe yönünde kalır.

**Ölçüm kipi:** `OLCUM=tam` (ısınma 240 sn, kayıt 60 sn, dt 1/60). Süreler medyan; her kol
aynı örnekte, JIT ısıtmasından sonra.

**Damgalar (bu koşu gerçekten ölçüm mü?):** korpus doldu · ızgara geç-oyun (114×90) ·
**sayaçlı kopya** (§B'nin sayaçlı N0'ı üretim `findNavPath` ile birebir aynı yolu vermeli) ·
**kol farkı** (birebir-aynı iddia eden kol korpusta bir kez bile sapmamalı).

**Aracın kendi kusuru, koşarken yakalandı:** ilk sürüm aktör kimliğini `start` dizisinin
referansından okuyordu; `tick.ts:229` her karede `pos: [...n.pos]` ile diziyi klonladığı için
"yol soran aktör" sayısı çağrı sayısının kendisi çıktı ve N2 ölçümü **%100 BFS** diye sahte bir
sonuç verdi. İzler artık çağrılardan yeniden kuruluyor (ardışık karede aynı hedefe giden ve
başlangıcı bir kare adımından yakın çağrı = aynı aktör). İkinci kusur: N1c'nin hedef kümesi
önce lineer taranıyordu ve kol N1b'den **yavaş** çıkmıştı; damgalı maskeye çevrildi.

---

## §3 BULGULAR

> Sayılar `docs/olcum-nav-t5.txt` (**tam koşu**, damgalar temiz) — bu bölüm ham çıktının özetidir.
> Korpus: geç-oyun, 3.600 kare, **97.486 çağrı**, ızgara 114×90 = 10.260 hücre.

### 3.1 Turun açılış varsayımı ÇÜRÜDÜ — tampon ayırma pahalı değil

| ölçü | çağrı başına | ızgaranın payı |
|---|---|---|
| kuyruktan çekilen hücre (pop) | **2.550,9** | **%24,9** |
| kuyruğa giren hücre (push) | 2.667,2 | %26,0 |
| bakılan komşu | **20.399,5** | — |
| hedef testi (`cellCenter` + mesafe) | 2.549,9 | — |
| ayrılan tampon | 40,1 KB | 1.085,3 KB/kare |
| dönen yol | ort **27,0** waypoint · p95 66,0 | `navStep` **yalnız ilkini** kullanır |

**Tampon ayırma + sıfırlamanın tek başına bedeli 0,035 ms/çağrı = tabanın %10,3'ü.** Tur kartının
devraldığı N-1 planı ("41 KB `Int32Array` her karede ⇒ ~726 KB çöp") bu kalemi turun ana kolu
sayıyordu; ölçülen kazancı **×1,20**. Maliyet ayırmada değil **gezinmede**: her çağrı ızgaranın
dörtte birini dolaşıyor ve 20 bin komşu denetimi yapıyor. Plan olduğu gibi uygulansaydı
vaat edilen kazancın altıda birini verirdi — D-138'in dersi ("toplamı ölçmek kolun yerini
göstermez") bir kademe aşağıda aynen tekrarlanmış olurdu.

### 3.2 Kollar — aynı korpus, medyan ms/çağrı

> **İki tam koşu var ve ikisi de rapora giriyor.** Ölçüm koşusu (commit #1) kolları seçmek için,
> **final koşusu** (commit #2) uygulanan kodu doğrulamak için. Final koşuda taban artık üretim
> kodu değil `tools/nav-oracle.ts` (T5 öncesinin donmuş kopyası) — yoksa kol kendisiyle
> karşılaştırılmış olurdu. Mutlak ms iki koşu arasında oynar (makine yükü); **oran** oynamaz.

**Final koşu** (`docs/olcum-nav-t5.txt`, damgalar temiz · 97.486 çağrı · ızgara 114×90):

| kol | ms/çağrı | × taban | §F nav ms | §F kare ms | çıktı |
|---|---|---|---|---|---|
| **N0** taban (T5 öncesi, oracle) | 0,456 | 1,00 | 12,71 | 40,30 | taban |
| **N1a** kalıcı tampon | 0,391 | 1,17 | 10,90 | 38,49 | **birebir aynı** |
| **N1b** + hedef PUSH'ta | 0,217 | 2,11 | 6,03 | 33,62 | **birebir aynı** |
| **N1c** + hedef maskesi | 0,199 | 2,29 | 5,54 | 33,13 | **birebir aynı** |
| **N3** A* (oktil) | 0,152 | 3,00 | 4,24 | 31,83 | **farklı** |
| **ÜRETİM** `findNavPath` | **0,181** | **2,52** | **5,05** | **32,64** | **birebir aynı** |
| **N1c + N2** önbellek | — | 409 | 0,03 | 27,62 | **farklı** |

**Uygulanan hâl `× 2,52`** — bu **node'da ölçülmüş** bir orandır. Üretim satırı araçta ayrı bir
koldur ve `uretim = oracle` damgası 12.000 çağrıda **0 fark** görmüştür; bu damga T5'ten sonra da
kalıcı bir gerileme dedektörüdür.

> ⚠️ **"§F nav ms" ve "§F kare ms" sütunları PROJEKSİYONDUR, ölçüm değil** — node oranının
> T4'ün 40,3 ms'lik karesine uygulanmasıyla bulunur. **Tarayıcı bu projeksiyonu DOĞRULAMADI**
> (§6). Kare seviyesindeki kazanç bu turda **kanıtlanmamıştır**.

*(Üretim kolunun ×2,52 ile araç içindeki N1c'nin ×2,29'unu geçmesi aynı algoritmanın farklı
JIT davranışıdır — üretim ayrı bir modülde ve sıcak yolda çağrılıyor.)*

*Kareye çeviri ORAN üzerinden:* node'un mutlak ms'i tarayıcıya taşınmaz (başka makine, başka
JIT, başka NPC sayısı). Taşınabilir olan kolun tabana göre oranıdır: `12,71 ms × (kol / N0)`.
"Kare ms" bu turda node'da ölçülmedi, §F'nin 40,3 ms'inden doğrusal çıkarımdır.

**Ölçüm koşusu** (commit #1, kolların seçildiği koşu) aynı sıralamayı vermişti:
N1a ×1,20 · N1b ×2,10 · N1c ×2,37 · N3 ×3,04, taban 0,343 ms/çağrı.

### 3.3 Korpus temsil ediyor mu (§G)

İkinci, bağımsız bir dünya kurulup (NPC 65 · 30.619 çağrı) aynı kollar yeniden ölçüldü:

| kol | × taban (dünya 1) | × taban (dünya 2) | fark |
|---|---|---|---|
| N1a | 1,20 | 1,20 | 0,00 |
| N1b | 2,10 | 2,10 | 0,00 |
| N1c | 2,37 | 2,35 | 0,02 |
| N3 A* | 3,04 | 3,24 | 0,20 |

Sıralama ve oranlar dünyadan bağımsız → korpus temsil ediyor. (Kısa koşuda A* ikinci dünyada
×1,96'ya düşmüş ve "kalabalığa bağlı" görünmüştü; **tam koşu bunu yalanladı** — kısa koşu
sayısının rapora girmeme kuralının bu turdaki karşılığı budur.)

### 3.4 N3 (A*) — kazanç küçük, bedel davranış

A* N1c'nin **1,2 ms** önünde (4,18 vs 5,36 ms), ama:

- yolların **%72,3'ü** birebir farklı, **ilk waypoint'in %27,5'i** farklı — `navStep`in
  kullandığı tek şey ilk waypoint;
- toplam yol uzunluğu ×1,003, yani yollar **aynı kalitede** — fark sadece eşit yollar arasındaki
  seçim (tie-break). Kazanılan şey yolun iyiliği değil, yalnız süre.

Yani N3, N1c'nin üstüne %22 hız için her dört karakter adımının birinde farklı bir rota seçimi
getiriyor. **Kolun kendisi sağlam, ama bu turda ödenecek bedeli yok.**

### 3.5 N2 (yol önbelleği) — en büyük kazanç, ama bu politika GÜVENLİ DEĞİL

`navStep` her karede tam BFS yapıp yolun yalnız ilk waypoint'ini kullanıyor; aktör bir hücreyi
(0,30 br) geçmek için ~12 kare yürüyor. Basit bir önbellek politikası korpusta oynatıldı
(hedef/ızgara değişince geçersiz, aktör waypoint'e yaklaşınca sıradakine geç):

- **kalan BFS 224/40.000 = %0,6** → çağrı/kare 27,1'den **0,2'ye**; kare payı 12,71 → 0,03 ms.
- **ama** ilk waypoint'in %14,9'u tabandan sapıyor · sapma ort **3,50 br**, p95 **14,66 br**;
  %7,1'i bir buçuk hücreden uzak.
- **Zarar ölçüsü (bu turda eklendi):** `navStep` waypoint'e `moveToward` ile **düz çizgide**
  gider. Önbellekli waypoint'e giderken **duvardan geçen adım %1,9**; kontrol (taban N0) %0,1.
  Yani bu politika **~19 kat** daha sık masanın içinden geçiriyor.

(Kontrolün 0 değil %0,1 çıkması beklenen: aktör şişirilmiş engelin kenarına yapışıkken
`nearestFreeIdx` onu en yakın açık hücreye snap eder, düz çizgi o kenarı sıyırabilir.)

**Sonuç:** N2'nin kazancı gerçek ve büyük, kusuru da gerçek. Güvenli bir politika (waypoint'i
komşu hücreyle sınırla, yolu kuşak damgasıyla tazele) yazılabilir ama o **kendi ölçümünü ister** —
bu turda kod yazılmadı, sayı da uydurulmadı.

---

## §4 KARAR — D-139

Karar paketi kullanıcıya §3'ün tablosuyla sunuldu. Seçilen: **"N1c uygula, dur."**

| kol | karar | gerekçe |
|---|---|---|
| **N1a + N1b + N1c** | **UYGULANDI** | Çıktı birebir aynı → varyant kapısı gerekmiyor, kullanıcıya da sorulmadı: bu bir kod yapısı çatalı, ürün çatalı değil (*"teknik çatalda seçim menüsü isteme"*). Node'da ×2,52; **kare seviyesindeki kazanç tarayıcıda doğrulanamadı (§6)**. |
| **N3** A* | **ELENDİ** | N1c'nin üstüne yalnız 1,2 ms, karşılığında ilk waypoint'in **%27,5**'inde farklı rota. Yol kalitesi aynı (×1,003) — kazanılan şey yolun iyiliği değil sadece süre. |
| **N2** yol önbelleği | **KENDİ TURUNA** | Kazanç en büyüğü (−12,7 ms) ama bu turda denenen saf politika duvardan geçen adımı **%0,1 → %1,9**'a çıkarıyor. Güvenli politika yazılabilir, **kendi ölçümünü ister**. |

**Turun asıl çıktısı bir sayı değil, bir düzeltme:** `activeContext`in devrettiği N-1 planı
("tampon ayırmak pahalı") ölçülünce çürüdü. Uygulansaydı vaadinin altıda birini verecekti.
D-138 *"toplamı ölçmek kolun yerini göstermez"* demişti; bu tur aynı hatanın bir kademe
aşağıda tekrarlanmasını, yine ölçerek engelledi.

---

## §5 UYGULAMA

**Kod** — `src/game/nav.ts`:
- Modül düzeyinde **kalıcı tamponlar** (`tPrev` · `tDamga` · `tKuyruk` · `tSnap` · `tHedef`),
  `tamponHazirla()` ile ızgara büyüyünce büyür. Kuşak sayacı Int32 tavanına yaklaşırsa damgalar
  sıfırlanır (taşma yanlış "ziyaret edildi" derdi).
- `nearestFreeIdx` kendi kuşak damgasına döndü — çağrı başına `new Uint8Array` kalktı.
- Hedef testi **push** tarafına taşındı (`dis:` etiketli çift döngü).
- Hedef hücre maskesi BFS'ten önce, hedefin çevresindeki `ceil(reach/cell)+1` yarıçaplı kutuda
  kuruluyor; hiçbir hücre menzilde değilse **erken `null`** (eski kod ızgarayı boşuna gezerdi).
- `findNavPath`in dışı hiç değişmedi: imza, dönüş tipi, ölçüm dikişi, korpus kancası yerinde.

**Bekçi** — `tests/nav-kol-t5.test.ts` (9 denetim), oracle `tools/nav-oracle.ts`:
gerçek dünya ızgaralarında 1.500 rastgele çift · gerçek hedeflere gerçek başlangıçlardan ·
başlangıç engelin içinde · hedef ızgara dışında / menzil ~0 · ulaşılamaz hedef · sentetik
ızgaralarda 2.400 çift · ızgara boyu değişimi · arka arkaya aynı çağrı (tampon sızdırmıyor) ·
`navSolids` ızgarası. **~4.200 çift, 0 fark.**

**Mutasyon sınavı** — `tools/mutasyon-nav-t5.mjs`: **7/7 gerçek mutasyon yakalandı** (+1 eşdeğer).
Sınav üç kez KENDİ kusurunu açtı ve üçü de kapatıldı:

| bulgu | ne çıktı | kapanış |
|---|---|---|
| M5 kaçtı | bekçinin "ızgara boyu değişince" denetimi 114×90 kullanıyordu, ama önceki denetimler tamponu zaten o boyda kurduğu için **büyüme hiç denenmiyordu** | denetim 200×160'a çıkarıldı, sıradan bağımsız |
| M2/M3 "kalıp bulunamadı" | depo CRLF, kalıplar LF → çok satırlı hiçbir kalıp tutmuyordu; sınav *"2/6 yakalandı"* derken o ikisini **hiç denememişti** | dosya LF'e normalize edilip aranıyor, bulunamayan kalıp çıkış kodunu düşürüyor |
| M5 sınavı **astı** | mutasyon testi düşürmüyor, sonsuz döngüye sokuyor; koşu dışarıdan öldürülünce `finally` çalışmadı ve `nav.ts` **mutasyonlu kaldı**, sonraki koşu onu "asıl" sandı | her mutasyona sert zaman aşımı (asmak da bir yakalamadır) + başlamadan **kirli başlangıç** denetimi |

**Final tam koşu:** `OLCUM=tam npx tsx tools/olcum-nav-t5.ts` — damgalar temiz, üretim kolu
oracle ile birebir aynı. Test takımı **1392/1392**.

**Tarayıcı doğrulaması:** `OLCUM=tam T4_ETIKET=t5 node tools/olcum-perf-t4.mjs` — §F kare
bölüşümü T5 sonrası yeniden okundu; sonuç §6'da.

---

## §6 TARAYICI DOĞRULAMASI — **SONUÇSUZ, kare kazancı KANITLANMADI**

`OLCUM=tam T4_ETIKET=t5 node tools/olcum-perf-t4.mjs` koşturuldu
(`docs/olcum-perf-t4-t5.txt`). Konsol hatası yok, koşu tamamlandı — **ama T4'ün tabanıyla
karşılaştırılabilir değil ve karşılaştırılabilir olan tek normalizasyon beklenenin TERSİNİ
gösteriyor.**

### 6.1 Ham sayılar

| | T4 tabanı (18 Eyl) | T5 (19 Eyl) |
|---|---|---|
| §F karenin işi | 40,3 ms | **64,9 ms** |
| §F gölge haritası | **0,2 ms** (gölge KAPALI) | **17,5 ms** (gölge AÇIK) |
| §F `findNavPath` | 12,71 ms · 20,5 çağrı/kare · **0,62 ms/çağrı** | 18,34 ms · 17,9 çağrı/kare · **1,03 ms/çağrı** |
| §A3 geç "iş ms" | 46,8 | **57,3** |
| §B dilim 0 "iş ms" | 38,8 | **53,7** |

### 6.2 Neden karşılaştırılamaz

1. **Gölge durumu farklı.** T4'ün §F'i gölge KAPALI ölçmüş (0,2 ms — D-138'in "KUSUR 3"ü:
   cihaz sınıflandırıcı gölgeyi kapatmıştı). Bu koşuda gölge AÇIK ve tek başına 17,5 ms.
   40,3 ile 64,9'u yan yana koymak iki farklı sahneyi karşılaştırmaktır.
2. **Makine bu koşuda genel olarak yavaş.** Nav'la hiç ilgisi olmayan kalemler de büyümüş:
   §A3 "iş ms" 46,8 → 57,3 (**+%22**), §B dilim 0 38,8 → 53,7 (**+%38**). Yani tabanın kendisi
   kaymış.

### 6.3 Yine de rahatsız edici olan

Genel yavaşlamayı normalize etsek bile hesap tutmuyor: toplam CPU işi ×1,22–1,38 artmışken
`findNavPath`in çağrı başı maliyeti **×1,66** artmış. Yani nav, kareye göre **daha ucuz değil,
daha pahalı** görünüyor — node'un ×2,52'siyle taban tabana zıt. Bunun açıklaması bu turda
bulunamadı. Olası hatlar (hiçbiri ölçülmedi): gölge açıkken GPU geri-basıncının kare içindeki
CPU zamanlamalarını şişirmesi · tarayıcı JIT'inin kalıcı tamponlu döngüyü node'dan farklı
derlemesi · iki koşu arasında değişen NPC/yol dağılımı.

### 6.4 Bu turun dürüst durumu

- **Kanıtlanan:** kod **çıktı olarak birebir aynı** (oracle bekçisi ~4.200 çift, 7/7 mutasyon).
- **Kanıtlanan:** node'da, aynı süreçte, donmuş oracle'a karşı, 97.486 gerçek çağrıda **×2,52**
  ve bu oran iki ayrı dünyada sabit (§G).
- **KANITLANMAYAN:** kare seviyesinde −7,7 ms. Tarayıcı bunu göstermedi.

**Sonraki tura yazıldı:** tarayıcı A/B'si **aynı oturumda** yapılmalı — üretim kodu ve oracle
arka arkaya, gölge durumu sabitlenmiş hâlde. T4'ün başka bir günkü sayısına karşı ölçmek
(§G'nin dersinin tarayıcı tarafındaki karşılığı) geçerli bir doğrulama değil.

---

# §7 — T5b: KARE KAZANCININ TARAYICI A/B'Sİ (2026-09-21)

> §6.4'ün açık ucunu kapatır. **Karar bölümü bu commit'te BOŞ** (D-084 adım 2).
> Araç: `tools/olcum-nav-ab-t5b.mjs` (tarayıcı) + `tools/olcum-nav-korpus-t5b.ts` (node oynatma).
> Ham çıktı: `docs/olcum-nav-ab-t5b-{masaustu,telefon}.txt` ·
> `docs/olcum-nav-korpus-t5b-{masaustu,telefon}.txt` · TAM koşu damgaları temiz.

## 7.0 Kurulum — §6'nın üç kusurunun üçü de kapatıldı

| §6'nın kusuru | T5b'de ne yapıldı |
|---|---|
| İki koşu **farklı günlerde** alınmıştı | İki kol **aynı sayfada**, aynı dünyada, saniyeler arayla |
| Gölge bir koşuda kapalı, diğerinde açıktı | Gölge **montajda** sabitlenir (`?f2golge`), her dilimde okunup damgalanır |
| Makine %22-38 yavaştı, ama bu ancak **sonradan** fark edildi | **DENETİM KOLU**: çizim ms · gölge ms · çağrı · üçgen · NPC. Oynarsa koşu geçersiz |
| — (yeni) | **ABBA deseni**: lineer sürüklenme birinci mertebeden gider |

İki TAM koşu, iki koşulda: **telefon** (412×915, CPU 4× kısık) ve **masaüstü** (kısıksız —
ölçümün kendisini sınamak için). Her ikisinde de **denetim kolu TEMİZ**, gölge tüm dilimlerde
SABİT, 20/20 dilim istenen kolu damgaladı, konsol hatası 0.

## 7.1 Araç iki gerçek kusur buldu (ikisi de kısa koşuda)

1. **Gölge koşunun ORTASINDA kendiliğinden kapandı.** `cihazSinifi.ts` (D-125) ilk ~100 kareyi
   örnekleyip 4× kısık CPU'da "zayıf cihaz" hükmü veriyor ve gölgeyi kapatıyor — dilim 1-3
   gölgeli, 4-8 gölgesiz ölçüldü. **Denetim kolu bunu KIRMIZI olarak yakaladı** ve koşuyu
   geçersiz saydı; araç `gl.shadowMap.enabled`ı elle yazmayı bırakıp `devPerf.ts`in montaj-zamanı
   koluna bağlandı. (§6'nın gölge kusuru, farklı bir kapıdan geri gelmişti.)
2. **`performance.memory` bayraksız CACHE'lenmiş değer döndürüyor** — ilk tam koşuda ayırma hızı
   `0,0 MB/sn` okundu. `--enable-precise-memory-info` ile canlı ve hassas hâle geldi.

## 7.2 §Bulgular

### Bulgu 1 — Tarayıcıda oran node'un yarısından az

| Koşul | nav ms/ÇAĞRI (üretim → oracle) | oran |
|---|---|---|
| masaüstü (kısıksız, TAM) | 0,159 → 0,174 | **×1,09** |
| telefon (4× kısık, TAM) | 0,905 → 1,026 | **×1,13** |
| *node tabanı (T5, §C)* | *0,181 → 0,456* | *×2,52* |

### Bulgu 2 — Şüpheli AYRIŞTIRILDI: korpus değil, ORTAM

Tarayıcının GERÇEK çağrıları diske döküldü (`__navKorpus`) ve **node'da oynatıldı**:

| ölçülen ortam \ korpus | node korpusu | tarayıcı korpusu (masaüstü) | tarayıcı korpusu (telefon) |
|---|---|---|---|
| **node** | ×2,52 | **×2,82** (13.330 çağrı) | **×2,46** (3.357 çağrı) |
| **tarayıcı** | — | ×1,09 | ×1,13 |

Aynı çağrılar node'da ×2,5-2,8, tarayıcıda ×1,1. → **Korpus temsilî.** `olcum-nav-t5.ts`in
başsız dünyası gerçek oyunu doğru temsil ediyor; N2 turu o araca güvenebilir.

### Bulgu 3 — Uçurumun SEBEBİ ölçüldü: ayırma bedeli çağrının DIŞINDA

| Koşul | heap ayırma hızı (üretim → oracle) | oran | çağrı başı fark |
|---|---|---|---|
| masaüstü | 33,5 → **178,6 MB/sn** | ×5,34 | **−130,6 KB/çağrı** |
| telefon | 7,0 → **47,3 MB/sn** | ×6,76 | **−128,2 KB/çağrı** |

Node korpusun TAMAMINI tek blokta ölçer: oracle'ın çağrı başına ayırdığı ~130 KB'ın GC bedeli
o bloğun İÇİNDE kalır. Tarayıcı ise `findNavPath`in kendi aralığını ölçer ve GC o aralığın
DIŞINDA koşar. İki sayı da doğru; **farklı şeyleri** ölçüyorlar.

> **T5'in kendi sonucu bu ışıkta yeniden okunmalı.** §3 "açılış varsayımı çürüdü: tampon ayırma
> tabanın yalnız %10,3'ü" demişti — bu ZAMAN cinsinden doğruydu. Ama ayırma bir **hız**tır:
> 178,6 → 33,5 MB/sn. Telefonda bunun karşılığı GC duraklaması (takılma) ve pildir; ikisi de
> T5'te hiç ölçülmemişti. Kolun en büyük ve en tartışmasız kazancı buymuş.

### Bulgu 4 — Kare kazancı var, ama ×2,52 değil

| Koşul | karenin işi (üretim → oracle) | üretim ne kadar ucuz | nav'ın kare payı |
|---|---|---|---|
| masaüstü | 10,5 → 11,3 ms | **%7,1** | %28,4 → %30,1 |
| telefon | 54,3 → 57,7 ms | **%5,9** | %31,5 → %37,5 |

nav ms/KARE oranı: masaüstü ×1,14 · telefon ×1,27.

> **Tek aykırı koşu vardı ve saklanmıyor:** bayraksız ilk TAM telefon koşusu `karenin işi`ni
> 55,9 → 53,8 (üretim %3,9 *pahalı*) ölçtü. Denetim kolu temizdi; fark dilim gürültüsüdür
> (`nav ms/çağrı` o koşuda dilimden dilime 0,751-1,309 arasında oynadı). Bayraklı tekrar ve
> masaüstü koşusunun ikisi de aynı yöne işaret ediyor. Bu satır, "üç koşudan ikisi" demenin
> dürüst hâlidir.

### Bulgu 5 — Eşitlik, artık oyunun KENDİ çağrılarında

Bekçi eşitliği üretilmiş çiftlerde doğruluyordu. T5b onu tarayıcının gerçek çağrılarında sınadı:

| korpus | çağrı | sapma | yol bulunamayan (üretim/oracle) |
|---|---|---|---|
| masaüstü | 13.330 | **0** | 0 / 0 |
| telefon | 3.357 | **0** | 0 / 0 |

### Bulgu 6 — nav HÂLÂ karenin ~%30'u

Kol uygulandıktan SONRA bile nav karenin %28,4-31,5'i. T4 §F tabanı %31,5'ti. Yani **T5 payı
anlamlı ölçüde küçültmedi** — asıl kol hâlâ masada: **N2 yol önbelleği** BFS çağrılarının
%99,4'ünü siliyor (T5 §5), ve duvardan geçen adım sorunu çözülürse kazanç bu payın tamamına yakını.

## 7.3 §6.4'ün üç cümlesinin bugünkü hâli

| §6.4 | T5b |
|---|---|
| Kanıtlanan: çıktı birebir aynı | **Güçlendi** — +16.687 gerçek tarayıcı çağrısı, 0 sapma |
| Kanıtlanan: node'da ×2,52 | **Doğrulandı** ve ANLAMI netleşti: blok ölçümü, GC dâhil |
| KANITLANMAYAN: kare seviyesinde kazanç | **KANITLANDI, ama küçük**: %5,9-7,1 (2 TAM koşu, denetim temiz) |

§6.3'ün "açıklaması bulunamadı" satırı kapandı: fark ayırma bedelinin çağrı aralığının dışında
kalmasından geliyor (Bulgu 3). §6.3'ün *"nav kareye göre daha pahalı görünüyor"* gözlemi ise
karşılaştırılamaz iki koşunun ürünüydü — aynı oturumda ölçülünce nav'ın payı üretimde
oracle'dan **düşük** çıkıyor (%28,4 < %30,1 · %31,5 < %37,5).

## §Karar

_(boş — karar paketi kullanıcıya sunulacak; D-084 adım 3)_
