# Kullanıcı geri bildirimi — 2026-09-21 (yazılı notlar)

Tek kaynak: kullanıcının aynı oturumdaki iki mesajı. Kalemler **kendi cümleleriyle** kayıtlı
(R turlarının dersi: parafraz bir tur sonra "aslında ne demişti" tartışmasına dönüyor).
Numaralar `G-` serisinin devamı — son kullanılan **G-81** (2026-09-18).

**Bu turda hiçbiri UYGULANMADI.** Kayıt + plan + karar önce, kod sonra (D-084 varyant kapısı).
Her kalemin yanında **kodda doğrulanmış** kök var — "ilk okuma" değil, dosya + satır + sayı.

Kullanıcının kapanış cümlesi turların hedefini belirliyor:
> *"bunlar bitince de yavaştan yayına gidicez"*

---

## A · YERLEŞİM HATASI (ölçüldü, tek satırlık kök)

| # | Bulgu | Kullanıcının sözü | Kök (ÖLÇÜLDÜ) |
|---|---|---|---|
| **G-82** | **`zone3` pad'i ile Salon 2'nin 3. masasının yükseltme noktası çakışıyor** | *"Salon 3 açma padi ile salon 2 masa 3ün padi hafif üst üste geliyo"* | `layout.ts:688` `zone3: [2.0, 0, 1.8]` ↔ `ALL_TABLES[6].upgradeSpot` arası **1,773 br**. Eşik `PAD_RADIUS + TABLE_UP_RADIUS` = **2,30**. → **0,53 br ihlal.** Aynı eşik `waiter2`/`waiter3` için B5a'da bilerek kovalanmıştı (layout.ts yorumu), `zone3` o taramanın dışında kalmış. Oyuncu salon pad'ini doldurmak için durunca masa 6'yı da yükseltmeye başlıyor. |

**Not:** aynı ölçüm taraması `z3table2…z3table12`'nin kendi masalarının yükseltme noktasına 1,50 br
kaldığını da gösterdi — bunlar **çakışma değil**: pad dolunca kaybolur, nokta ondan sonra doğar,
ikisi aynı anda sahnede olmaz. `zone3 ↔ masa6` ise aynı anda sahnededir (zincir sırası:
`z2table3 → dishwasher → z2table4 → zone3`).

---

## B · BANKET ŞERİDİ — "donanım" kararı geri alınıyor

| # | Bulgu | Kullanıcının sözü | Kök (doğrulandı) |
|---|---|---|---|
| **G-83** | **Banket adaları tam boyda doğuyor; sonradan yalnız masa asılıyor** | *"banketler tamamen açık geliyor sadece masa ekliyorum. banketler de mesela oranın ortasında zaten çift veya tek masalı gelmeli ben 3. salonu açınca gözükmeli veya farklı bir yol olmalı"* | `layout.ts:396-412` **bilerek böyle**: *"Şerit açılınca (a2'nin ilk masası) iki ada birden TAM BOYDA kurulur: adalar şeridin DONANIMI, masalar sonradan gelen içeriktir."* `banketIslands()` `tables`'a bakar ama `len`'i **sabit** (`banketLen(BANKET.cols)`) üretir. Yani büyüme kablosu yazılmış ama kullanılmamış. |
| **G-84** | **Yükseltme banketi de büyütmeli + renk gelişmesi olmalı** | *"ben yükseltme yaptıkça yeni masa ile birlikte banket boyutu da büyüsün renk gelişmeleri falan olsun"* | Banket rengi `palette.ts:58-61` **tek takım sabit** (`banketBase`/`banketBody`/`banketCushion`/`banketPillow`); masa seviyesine bağlı hiçbir yolu yok. Masa tarafında kademe görseli var (`tableLook.ts`), banket tarafında **yok**. |

> Bu, eski bir tasarım kararının **kullanıcı tarafından geri alınmasıdır**, bir hata değil.
> Yeni hâl `feedback_locked_object_renovation` + `feedback_design_progression_first` ile hizalı:
> kilitli obje silinmez, **tadilat hâlinde** durur ve **yerinde kademe kademe büyür**.

---

## C · SERVİS MİMARİSİ — tost ile çayın mekânsal ilişkisi

| # | Bulgu | Kullanıcının sözü | Kök (doğrulandı) |
|---|---|---|---|
| **G-85** | **Tost noktası ile çay noktasının ilişkisi belirsiz** | *"tost alınan yer ile çay alınan yerler yan yana veya iç içe ya ayrı ayrı da olabilir bilemedim. bir sistem kur kısaca"* | Bugün **ayrı obje yok**: tost, tezgâhın **L5'i**. `economy.config.ts` `q_tost` → `stationLevel: 5`. Yani "tost alınan yer" = "çay alınan yer". Kullanıcı bunu oynarken ayırt edememiş → sistem kodda var ama **ekranda okunmuyor**. |

---

## D · GÖREV / PERSONEL SIRASI — mantık denetimi istendi

| # | Bulgu | Kullanıcının sözü |
|---|---|---|
| **G-86** | **Zincir sırası mantık denetimi** | *"garson veya bulaşıkçı sıralaması görev sıralamaları vs mantıksal olarak sence okey mi? bazı yerlerde sanki saçma ya ama bilemedim"* |

Mevcut hat (`economy.config.ts` `quests`), üç bölüm:

```
B1 (Salon 1) : çay al → servis → para → masa2 → tepsi1 → 5 servis → ocak L1
               → BULAŞIK (elle yıka) → masa3 → tepsi2 → GARSON → ocak L2 → masa4 → mıknatıs
B2 (Salon 2) : salon2 → masa2 → ocak L3 → garson hızı → masa sv → masa3
               → garson tepsisi → BULAŞIKÇI → masa4 → 2 masa L3
B3 (Salon 3) : salon3 → masa2 → TEZGÂH(L4) → 2. garson → masa3
               → TOST SACI(L5) → 5 tost → masa4 → garson tepsi2 → salon1 bakımı
```

Denetime giren **beş şüphe** (hiçbiri henüz ölçülmedi — T-B turunun konusu):
1. **Elle bulaşık dönemi çok uzun.** `q_wash` B1'in ortasında açılıyor, `dishwasher` B2'nin
   ortasında geliyor — arada ~10 görev. D-083 boştaki garsonu bulaşığa koşuyor, yani delik
   kısmen kapalı; ama oyuncunun HİSSİ ölçülmedi.
2. **Garson bulaşıkçıdan çok önce.** İkisinin sırası tempoyla (`simulate.ts`) seçilmişti; oyuncu
   mantığıyla ("önce angaryayı devret") ters düşebilir.
3. **2. Garson, Salon 3'ün daha iki masası açılmamışken geliyor** (`waiter2` ↔ `z3table3` arası).
4. **Tost çok geç ve bir SEVİYE olarak geliyor** — B3'ün sonlarında; G-85 ile aynı kök.
5. **`waiterTray` kademe 3 hatta yok** (bilinen açık kalem, D-093): personel Usta hedefleri
   12 saatte hiç açılmıyor.

---

## E · PERFORMANS + GENEL TARAMA

| # | Bulgu | Kullanıcının sözü | Durum |
|---|---|---|---|
| **G-87** | **Performans optimizasyonu şart** | *"bir de net bir şekilde performans optimizasyonu şart"* | Faz T zaten açık. T4 kare tavanı bitti, T5 nav bitti ama **kare kazancı tarayıcıda doğrulanamadı**; T5b + N2 (yol önbelleği) + C-kolları bekliyor. |
| **G-88** | **Genel tarama** | *"buna da ek olarak genel bir tarama da gerek"* | Kapsamı açık: kod denetimi mi, oynanış taraması mı, ikisi mi — **karar paketinde sorulacak.** Bilinen kırmızı: `npm run lint` 66 hata (hepsi `tools/`). |

---

## Kapanış hedefi

> *"bunlar bitince de yavaştan yayına gidicez"*

Yayına kalanlar (Faz F, 3/6): **F3 reklam** (C1′ önerildi, onay bekliyor) · **F4 IAP** ·
**F5 mağaza vitrini + uyum**.

---

## F · İKİNCİ MESAJ — kapsam netleşmesi + iki yeni kalem

**G-88'in kapsamı belirlendi** (kullanıcı):
> *"genel taramada da o bahsettiğin ikisi de var aslında. ama önemli olanı biraz da performans."*
→ kod taraması **VE** oynanış taraması, **ağırlık performansta**.

**Sıra serbest bırakıldı, ama eksiksizlik şart:**
> *"istediğinle başla sorun yok. yarım kalan şeyleri de tamamla eksiksiz devam ediyor olalım."*
→ T5'in açık ucu (tarayıcı A/B) kapatılmadan yeni tura geçilmez.

| # | Kalem | Kullanıcının sözü | Zamanlama |
|---|---|---|---|
| **G-89** | **Mağaza görselleri + tanıtım videosu** | *"yayın için içerik foto çekimleri yayın store fotoları ayarlanacak veya bir de video istiyorum oynanışa dair ama reklam vari bir video da olabilir"* | **EN SON İŞ — yayından hemen önce.** Kullanıcı: *"bu en son iş yayından hemen önce sadece not et sonra devam ederiz."* Faz F5'in (mağaza vitrini) parçası. |
| **G-90** | **Tost + tost makinesi asset'i internetten bulunacak** | *"tost ve tost makinesi için de internetten asset bul şu an sanki kendi çizdiğin var gibi ve o da kötü duruyor sanki"* | G-85 (tost/çay mimarisi) turuyla birlikte. |

**G-90 notu — asset kuralları geçerli:** tek stil kilidi (KayKit önce; KayKit'te karşılığı yoksa
ikinci paket **teklif edilir**, kendiliğinden alınmaz) · lisansı belirsiz asset commit'lenmez ·
manifest `public/assets/README.md`'ye işlenir · **paket en kötü üyesiyle yargılanır** (D-122).
İndirme **PowerShell**'den yapılır (`tools/indir-itch.ps1`), Bash'ten değil.

---

## G · ÜÇÜNCÜ MESAJ — İZDİHAM (turun konusu oldu)

> *"girişte bir süre sonra kapı dışında izdiham oluyor içeri girmeye çalışan 100lerce npc
> birikiyor ona da bir kontrol getirilmeli artık dışarı biri çıkmadan biri spawn edilmez mi
> yaparız yoksa farklı bir yol vs mi düşünürsün bilemem. veya biri kalkmadan başkası spawn
> olmaz vs de olabilir ama senin araştırıp piyasa standardı ne ise bulman gerek onu uygularız
> en mantıklısı ne ise ve en kalitelisi ne ise o olsun."*

| # | Kalem | Durum |
|---|---|---|
| **G-91** | **Kapı önünde NPC izdihamı + kare sürüklenmesi** | **T6 turunun konusu.** T5b ölçümünün yan ürünü olarak SAYIYLA da görüldü (aşağıda). |

### G-91 sayıyla — T5b'nin kısıksız tam koşusu (`docs/olcum-nav-ab-t5b-masaustu.txt` §1)

Dünya 240 sn ısıtılmıştı, yani zaten "kararlı" sayılmalıydı. 20 dilim ≈ 2 dakika:

| | dilim 1 | dilim 20 | değişim |
|---|---|---|---|
| Üçgen | 284.028 | 512.499 | **+%80** |
| Çizim çağrısı | 170 | 240 | +%41 |
| Karenin işi | 9,3 ms | 12,2 ms | **+%31** |
| NPC | 39 | 56 | T4 §C'nin ölçtüğü tavan **39**'du |

Ve tırmanış durmamıştı. T4 §B sürüklenmeyi ölçüp **düz** bulmuştu (%0,5) — o koşu bunu kaçırdı.

### Kodda doğrulanan yapısal şüpheli

`tick.ts:389` — `activeCount = npcs.filter((n) => !hasLeftTable(n.state)).length`

`hasLeftTable` (`rules.ts:325`) şu durumları **SAYMIYOR**: `leaving` · `toWc` · `wcGiris` ·
`inWc` · `wcCikis`. Doğma tavanı (`maxConcurrent = max(8, toplam koltuk + 2)`) yalnız bu
filtreden GEÇEN NPC'lere uygulanıyor. Yani:

- **Oturan/gelen nüfusun tavanı var.** ✓
- **Ekrandaki TOPLAM nüfusun tavanı YOK.** ✗ Çıkış hattındaki (ve WC'deki) NPC'ler sayılmıyor;
  çıkış yavaşladıkça birikiyorlar ve yerlerine yenisi doğuyor.

Kapı ayrıca **tek nokta** (`doorX`: 2+ alan açıkken x = 0) ve hem girenler hem çıkanlar oradan
geçiyor — yani çıkış yavaşlamasının doğal bir sebebi de var.

### Piyasa standardı (araştırıldı)

**Kullanıcının önerisi zaten standart.** Türün en büyük referansları müşteriyi **oran**la değil
**kapasite**yle doğuruyor: Restaurant Tycoon 2/3'te müşteri ancak **uygun bir masa varsa**
belirir (masanın en az bir sandalyesi ola, başka grupça tutulmamış ola, üstünde para olmaya).
Yani "kuyruk dolunca müşteri küssün" değil, **"yer yoksa hiç doğmasın"**.

Kuramsal karşılığı **Little yasası**dır: `N = λ × W`. Doğma hızı `λ` sabitken, sistemde geçirilen
süre `W` sıkışma yüzünden büyürse nüfus `N` sınırsız büyür. Çözüm `λ`yı kısmak değil, doğmayı
**çıkışa bağlamak** (kapalı çevrim) — böylece `ρ = λ/μ < 1` yapısal olarak garanti edilir.

> **Bu, kodumuzun ZATEN yapmaya çalıştığı şey** (`findTableForGroup` boş koltuk arıyor).
> Kusur tasarımda değil **kapsamda**: tavan nüfusun bir ALT KÜMESİNE uygulanıyor.

Kaynaklar: [Restaurant Tycoon 3 Wiki — Customers](https://rt3.fandom.com/wiki/Customers) ·
[Restaurant Tycoon 2 Wiki — Customers](https://restaurant-tycoon-2.fandom.com/wiki/Customers) ·
[Little's Law](https://businessmap.io/continuous-flow/littles-law)
