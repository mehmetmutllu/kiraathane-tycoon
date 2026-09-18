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

| kol | ms/çağrı | × taban | §F nav ms | §F kare ms | çıktı |
|---|---|---|---|---|---|
| **N0** taban (bugünkü) | 0,343 | 1,00 | 12,71 | 40,30 | taban |
| **N1a** kalıcı tampon | 0,286 | 1,20 | 10,60 | 38,19 | **birebir aynı** |
| **N1b** + hedef PUSH'ta | 0,164 | 2,10 | 6,06 | 33,65 | **birebir aynı** |
| **N1c** + hedef maskesi | 0,145 | **2,37** | **5,36** | **32,95** | **birebir aynı** |
| **N3** A* (oktil) | 0,113 | 3,04 | 4,18 | 31,77 | **farklı** |
| **N1c + N2** önbellek | — | 423 | 0,03 | 27,62 | **farklı** |

*Kareye çeviri ORAN üzerinden:* node'un mutlak ms'i tarayıcıya taşınmaz (başka makine, başka
JIT, başka NPC sayısı). Taşınabilir olan kolun tabana göre oranıdır: `12,71 ms × (kol / N0)`.
"Kare ms" bu turda ölçülmedi, §F'nin 40,3 ms'inden doğrusal çıkarımdır; **tarayıcı sayısı final
tam koşusunda doğrulanacak.**

N1a→N1b→N1c birikimlidir (N1c = üçü birden). Üçü de birebir aynı çıktıyı verdi:
**12.000 çağrıda 0 fark**, ve N1b'nin eşitliği §2'de kanıtla da duruyor.

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

## §4 KARAR

*(BOŞ — D-084: karar paketi kullanıcıya sunulmadan doldurulmaz.)*

---

## §5 UYGULAMA

*(BOŞ)*
