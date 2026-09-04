# Tasarım Maketleri (2026-09-03 oturumu)

Bu klasör, 3 Eylül 2026 tasarım oturumunda üretilen **gezilebilir 3B kat maketlerini** ve
**geliştirme planını** saklar. Hepsi tek dosyalık, bağımsız HTML (three.js r128 CDN'den).
Tarayıcıda doğrudan açılmaz (charset/CORS) — bir HTTP sunucuyla servis et:

```bash
cd docs/maket && python -m http.server 8899
# http://localhost:8899/maket-v2-ONAYLI.html
```

## Dosyalar

| Dosya | Durum | Açıklama |
|---|---|---|
| `maket-v10-v2-duzen.html` | ✅ **Yayında olan sürüm (v11 içerik)** | **Sabit omurga + üç kanat.** v2 iskeleti (ortada kapı, ortada yolluk, ortada merdiven) korunur; kat omurganın sağına → soluna → arkasına kanatlanır, açık alan her adımda dikdörtgen, kapalı tarafta net duvar. Halı = yol işareti. Kasa/kuyruk/vitrin yok. **Mutfak binanın dışına çıkıntı** (üstü açık). **Ocakbaşı = tezgâh.** Arka yarı **Tavla/Okey odası**. |
| `maket-v9-kare.html` | ❌ Reddedildi | **Kare plan, üç alan, tek ızgara.** 32 × 32 bina üç alan hâlinde açılır (güney-batı 16×16 → güney-doğu 16×16 → kuzey bandı 32×16). Kullanıcının v6-v8 boyunca verdiği tüm düzeltmeler burada: zemin tek renk (halı ve ada yaması yok), iç bölme duvarı yok, mutfak batı duvarında + üstü tamamen açık (asma tavan yok) + ilk kademede ufak, kapalı alanın içi hiç görünmez (net duvar + dışarıda kepenkli komşu dükkân), ana giriş ilk adımdan itibaren ana caddede. |
| `maket-v8-tek-salon.html` | ❌ Reddedildi | Yana doğru büyüyen tek uzun salon (36 × 17, dört bölme). Kullanıcı: "yana doğru büyüme çok kötü, mutfak alanı ilk seviyede çok geniş, bir önceki kare yapıya dön". Sadeleştirme kararları (tek renk zemin, duvarsız mutfak, görünmeyen kilitli alan) buradan geldi ve v9'a taşındı. |
| `maket-v7-duzen.html` | 📌 Referans (yarım) | Dört eşit çeyrek + aks haçı + duvarsız köşe mutfağı (asma tavanlı). Kullanıcı yarıda kesti; asma tavan ve çeyrek bölmeleri reddedildi. |
| `maket-v6-buyume.html` | 📌 Referans | **Kat 1 büyüme haritası** — altı adım. Önceki maketler bitmiş katı gösteriyordu, bu maket oraya varılan yolu gösterir: mutfak **arka-sol köşede iki tezgâh karosuyla doğar** ve beş kademede yerinde büyür (Kd.3 yarı duvar = v5'in B varyantı, Kd.4 tam duvar + sipariş penceresi = v5'in A varyantı), kat **üç bölüm** hâlinde açılır (oyunun `MAX_ZONES = 3` yapısıyla birebir), açılmamış bölüm toz örtüsü + iskele + tahta perdenin arkasında durur. |
| `maket-v5-mutfak.html` | 📌 Referans (v6'nın çıkış noktası) | v4 + **mutfak odası**. Sol duvardaki 22 birimlik mutfak şeridi kaldırıldı, yerine 6,5 × 8,6 **dört duvarlı mutfak odası** kuruldu; boşalan sol bant A adasına verildi (ada 9,8 → 12,8, 3×2 ünite). Sekmelerde **iki varyant**: A kapalı oda, B yarı açık (lambri + cam). Mutfağın içi ikisinde birebir aynı. |
| `maket-v4-duzen.html` | 📌 Referans (v5'in çıkış noktası) | v2 + **ada disiplini** düzen revizyonu (şu an yalnız **Kat 1**; Kat 2-3 hâlâ v2 yerleşimi). Her oturma bölgesi tek dikdörtgen ada: zemin yaması + kilim + mobilya aynı merkezde, kilim grubun altında, yama kilimden ~0,9 taşar. Orta aks yolluğu, mutfak şeridi eşit 4,5 ritim, Ocakbaşı gerçek U, bekleme köşeleri. |
| `maket-v2-ONAYLI.html` | 📌 Referans (dokunulmadı) | Genişletilmiş yerleşim, dış çevre (cadde+komşu binalar), alt kat kütleleri, WC, terasa dönüşlü merdiven. v4'ün çıkış noktası; olduğu gibi saklanıyor. |
| `maket-v3-REDDEDILDI.html` | ❌ Reddedildi | Kat 1 ızgara yeniden dizilimi (L mutfak, Ana Salon/Cam Kenarı/Sedir Köşesi), 3.6 duvar. Kullanıcı: "çok kötü oldu". **Geri dönülecek: v2.** |
| `plan-v2.html` | Referans | Geliştirme planı (teşhis, servis modelleri, oyun akışı, arayüz, faz planı, performans bütçesi, kararlar, asset listesi). |
| `ss/kat1-v2.png` `ss/kat2-v2.png` `ss/kat3-v2.png` | Referans | v2'nin ekran görüntüleri. |
| `ss/kat1-v4.png` | Referans | v4 Kat 1 (ada disiplini). |
| `ss/kat1-v5A.png` `ss/kat1-v5B.png` | Referans | v5 Kat 1, iki varyantın tam kat görünümü. |
| `ss/mutfak-A.png` `ss/mutfak-B.png` | Referans | v5 mutfak odası yakın plan (kapalı / yarı açık). |
| `ss/v6-adim1.png` … `ss/v6-adim6.png` | Referans | v6'nın altı büyüme adımı, sırayla. |
| `ss/v8-a1.png` … `ss/v8-a5.png` | Referans (reddedilen) | v8'in beş adımı. |
| `ss/v9-a1.png` … `ss/v9-a4.png` | Referans | v9'un dört adımı. |

## Yayınlanmış Artifact linkleri

- **Plan:** https://claude.ai/code/artifact/c45e15a9-9dd1-4bd1-ae00-cd1d35ed0aa8
- **Maket (bitmiş kat, v2→v5):** https://claude.ai/code/artifact/d8bbf576-e755-46b7-9608-3ebd0ab57245
  (2026-09-04: v2 → v4 düzen revizyonu → **v5 mutfak odası (A/B varyant)** — link hep aynı)
- **Büyüme haritası (v6):** https://claude.ai/code/artifact/0c63ef60-ebb5-4b16-89e6-d0a587583f27
- **Tek salon (v8, reddedildi):** https://claude.ai/code/artifact/41325892-3b1c-4a66-a1fc-ed190e3339b9
- **Kare plan (v9, reddedildi):** https://claude.ai/code/artifact/35d2b29d-f91f-4495-b3bd-e1b8db77c81f
- **YAYINDA (v11):** https://claude.ai/code/artifact/9d8c6d5a-5bd9-464b-a4e3-975c214236cd

## Düzen kuralları (v4, Kat 1'de uygulandı; Kat 2-3 bekliyor)

1. Her oturma bölgesi **tek dikdörtgen ada**: zemin yaması, kilim ve mobilya aynı merkezde; kilim grubun altını kaplar, yama kilimden ~0,9 taşıp görünür pervaz bırakır.
2. Ada içi üniteler **eşit aralıkta**, her ünite (masa + oturanlar + para istifi) tek grup olarak **±3,5° serbest** sapar — hizalı ama CAD gibi ölü değil.
3. **Bölge başına tek tip mobilya YASAK** (v3'ün hatası): çeşitlilik korunur, yalnız hizalama disipline edilir.
4. Para istifi hep ünitenin **+x/+z köşesinde**.
5. Duvar öğeleri (tezgâh, raf, tablo, aplik) **kendi duvarı içinde eşit aralıklı**.
6. Orta koridor bir **aks**: açık tonlu yolluk + iki yanda simetrik lamba/saksı ritmi; ölü boşluk bırakılmaz.

## Mutfak odası kuralları (v5)

Kullanıcı geri bildirimi: *"mutfak şeridi bi mutfakmış gibi izlenim uyandırmıyo; mutfak dediğin 4 köşe bir yer olur."*

1. Mutfak bir **hacim**dir, duvar kenarı değil: 6,5 × 8,6 oda, x∈[-16,9, -10,4] × z∈[-7,6, 1,0].
2. Kamera -x/+z köşesinden baktığı için **doğu ve güney duvarları arka plandır** — beyaz fayans, davlumbaz
   ve raflar yalnız orada okunur, bu yüzden o iki duvar iki varyantta da tam yüksekliktedir.
3. Mutfağı mutfak yapan sinyaller: gri seramik karo zemin + gider · tezgâh üstü beyaz fayans ·
   kesintisiz tezgâh · çelik davlumbaz + tavana giren baca · asılı tencere rayı · serbest hazırlık
   tezgâhı · boy dolabı/kasa/damacana deposu · asma tavan çerçevesi + **soğuk beyaz** aydınlatma
   (salonun sıcak ışığından ayrışır).
4. Salonla tek bağ **sipariş çıkış penceresi** (çelik tezgâh, adisyon askısı, ısı lambası, hazır tepsiler)
   + ayrı personel kapısı. Garson mutfağa girmez. (Karar 3: tek çıkış penceresi.)
5. Kapalı varyantta salona bakan duvar **menü tahtasını** taşır — mutfak, salondan bakınca da kendini anlatır.
6. **Açık uç:** mutfak solda kaldığı için B (Cam Kenarı) ve D (Vitrin) adaları çıkış penceresine ~19-23 birim
   uzakta; karar 5'teki "≤10 birim" kısıtı bu yerleşimde sağlanmıyor. Gerçek oyunda ya ikinci servis noktası
   ya da mutfağın merkeze kaydırılması gerekecek.


## Büyüme kuralları (v6, 2026-09-04) — kullanıcı: *"sırayla ilerleme adımlarını da tasarlayıp ona göre hareket etmemiz gerek"*

1. **Mutfak bir köşede DOĞAR, bitmiş gelmez.** Arka-sol köşe (kullanıcı seçimi); 7,8 × 8,4;
   binanın kendi kuzey ve batı duvarını arka plan olarak kullanır, bu yüzden başlangıçta hiç
   duvar maliyeti yoktur.
2. **Beş kademe, hepsi YERİNDE:** Kd.1 cezve ocağı + semaver tezgâhı (2 karo) → Kd.2 evye +
   bulaşık (4 karo) → Kd.3 tost sacı + davlumbaz + buzdolabı + **yarı duvar (lambri + cam)** →
   Kd.4 **tam duvar + sipariş çıkış penceresi** + hazırlık adası (8 karo) → Kd.5 fırın + kiler +
   asma tavan + menü tahtası.
   **A/B varyant seçimi kalktı:** v5'in "B — yarı açık"ı Kd.3, "A — kapalı"sı Kd.4'tür.
   Oyuncu ikisini de sırayla yaşar.
3. **Modüler ızgara.** Tezgâh 1 birimlik karolardan oluşur; her yükseltme bir karo ekler veya
   takas eder. Karşılığı hazır: **KayKit Restaurant Bits 1.0** (CC0, Furniture Bits ile aynı
   sanatçı → tek stil kilidi bozulmaz): `kitchencounter_straight_A/B` `_backsplash` `_innercorner`
   `_outercorner` `_sink` · `stove_single/multi` · `oven` · `fridge_A/B` · `extractorhood` ·
   `kitchencabinet` · `kitchentable_*` · `dishrack` · `wall_orderwindow` · `wall_half` ·
   `wall_doorway` · `floor_kitchen` · `menu` · `shelf_papertowel` · `crate_*`.
   Kaynak: https://github.com/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0
4. **Kat üç bölüm hâlinde açılır** (oyunun `MAX_ZONES = 3` zone yapısıyla birebir):
   **1** arka-sol x[−17, −4,6] z[−17, 0,2] (mutfak + ilk salon) → **2** ön, tam genişlik
   z[0,2, 17] (ana cephe + giriş holü + kasa + Giriş Salonu + Cam Kenarı) → **3** arka-sağ
   x[−4,6, 17] z[−17, 0,2] (Ocakbaşı Köşesi + WC + depo + **merdiven → Kat 2**).
5. **Kilitli bölüm boş zemin DEĞİLDİR:** çıplak şap, toz örtüsü altında istiflenmiş mobilya,
   iskele, moloz sandıkları ve açık bölümle arasında **tahta perde**. Oyuncu ne satın alacağını görür.
6. **Bir bölümün AÇILMASI ile DOLMASI ayrı iki adım** (adım 4 bölümü açar, adım 5 sağ yarısını döşer).
   Boşluk sıradaki hedefi gösterir.
7. **Yan sokak kapısı.** "Köşe Kıraathanesi" bir köşe parselde: güneyde ana cadde, batıda yan sokak.
   Oyun batı duvarındaki küçük kapıyla başlar; ana cephe adım 4'te açılınca **aynı kapı mutfağın
   personel/malzeme girişi** olur. Tek öğe, iki dönem.
8. **Servis mimarisi (Karar 3+5 revizyonu — ONAY BEKLİYOR):** yemek YALNIZ ana mutfakta pişer ve
   tek sipariş çıkış penceresinden verilir; uzak adaların kenarında **pişirme yapmayan servis
   noktaları** (aktarma tezgâhı: hazır tepsi rafı + adisyon askısı + ısı lambası) durur. Böylece
   "her oturma bölgesi servise ≤ 10 birim" kısıtı 34×34 katta da sağlanır: en uzak ünite kendi
   servis noktasına 4,6–6,4 birim, ilk salon doğrudan pencereye 9 birim.
   *34×34 bir katta köşedeki tek mutfaktan ≤10 kuralı matematiksel olarak sağlanamaz — bu yüzden
   ya servis noktası ya da katın küçültülmesi gerekiyordu; servis noktası seçildi.*
9. **Kamera:** mutfak arka-sol köşede olduğu için erken adımlarda kamera **+x/+z (güney-doğu)**
   köşesinden bakar (azi pozitif), tam kat adımlarında cepheye yaklaşır (azi ≈ 0,2) — böylece
   iki yan duvar da kenara çekilir ve hiçbiri salonu kapatmaz.

> `maket-v6-buyume.html` dosyası, yerel sunucuda da doğru görünsün diye baştaki
> `<meta charset="utf-8">` satırını taşır (v2–v5'te yoktu, Türkçe karakterler bozuk çıkıyordu).


## v9 kuralları (2026-09-04 akşamı — kullanıcının iki kesintisinden çıkan kesin liste)

Kullanıcının aynen söyledikleri ve karşılıkları:

| Söylenen | v9'daki karşılığı |
|---|---|
| "halı vs koyma, zemini tek renk ayarla yeter" | Zemin tek renk ahşap. Halı, kilim, ada yaması YOK. **Tek istisna:** mutfağın karo lekesi. |
| "mutfak altındaki zemin ufacık çay ocağıyken bile var, seviye atladıkça değişsin" | Karo leke Kd.1'de 5,4 × 3,8; her kademede büyüyerek Kd.4'te 5,4 × 9,4 olur. |
| "aradaki duvarlar çirkin, aşırı duvarları kaldır" | İç bölme duvarı, alçak duvar, kolon, portal YOK. Düzen artık **tek ızgarayla** kuruluyor. |
| "mutfak üstünde asma tavan olmasın, üstü kesinlikle açık olmalı" | Asma tavan YOK. Yalnız tost sacının üstünde küçük bir davlumbaz (duvara ait). |
| "mutfak sol altta kötü, arkadan bakıyor gibiyiz; içi görünecek bir yerde olmalı" | Mutfak **batı duvarı** boyunca, ön servis tezgâhı **+x'e (salona ve kapıya) bakıyor**; kamera güney-doğudan baktığı için tezgâhın önü ve arkasındaki ekipman birlikte görünüyor. |
| "mutfak alanı ilk seviyede çok geniş" | Kd.1 = 2 tezgâh karosu + 3,4 servis tezgâhı. Kalan mutfak hattı boş; kademeyle doluyor. |
| "açılmayan yerde net duvar olsun, açtıkça genişler" | Kapalı alanın sınırı normal duvar. Alan alınınca duvar kalkar. |
| "kapalı alanlar gözükmesin" | Kilitli alanın İÇİ hiç çizilmez. Dışarıdan aynı bloktaki **kepenkli komşu dükkân** kütlesi görünür. Toz örtüsü / iskele / moloz YOK. |
| "yan kapı tasarımı kötü" | Yan kapı kaldırıldı. Ana giriş ilk adımdan itibaren ana caddede, tenteli ve tabelalı. |
| "ana giriş var ama masalar solda, önündeki halı işe yaramıyor" | Kapı, masa ızgarasının iki sütunu arasındaki koridorun aksında (x = −4,8); koridor kapıdan mutfağın servis tezgâhına gider. Halı yok. |
| "yana doğru büyüme çok kötü, kare yapıya dön" | Bina yine **kare** (32 × 32); üç alan: güney-batı 16×16 → güney-doğu 16×16 → kuzey bandı 32×16. |

**Tek ızgara:** sütunlar x = −7,4 · −2,2 · 3,0 · 8,2 · 13,4 · satırlar z = 12,4 · 7,2 · 2,0 · −3,4 · −8,8.
Ünite başına ±3° serbest sapma korunur (hizalı ama CAD gibi ölü değil).

**Asset kaynakları (hepsi CC0, hepsi Kay Lousberg → tek stil kilidi):**
Restaurant Bits · Furniture Bits · City Builder Bits.
`https://kaylousberg.itch.io/restaurant-bits` · `https://kaylousberg.itch.io/city-builder-bits`
Restaurant Bits'in **mimari ve mobilya** parçaları alınır, **yemek propları alınmaz** (burger/ketçap/biftek
Türk menüsüne uymaz; semaver, çay bardağı, cezve, tost, baklava kendi modellerimiz kalır).
City Builder Bits sokak için: `road_straight/corner/junction/crossing`, `building_A…H`, `car_*`,
`streetlight`, `trafficlight`, `bench`, `bush`, `dumpster`, `firehydrant`, `trash_A`, `watertower`.


## v11 kuralları (2026-09-04 gece — KULLANICI ONAYLADI)

Kullanıcının maddelediği yedi sorun ve karşılıkları:

| Şikâyet | Karar |
|---|---|
| "Kapı bu alanın ortasında olur, yan taraf açılınca kayar" | **SABİT OMURGA.** Kapı ön duvarın, merdiven arka duvarın tam ortasında; hiç kaymaz. Adım 1'de açık alan kapıya simetrik 12 birimlik merkez dilim. Kat sağa → sola → arkaya kanatlanır; açık alan her adımda **dikdörtgen**, kapalı tarafta **net duvar**. |
| "Halı adım 1'de kaplıyor, adım 3'te kaplamıyor" | Halı **zemin kaplaması değil YOL İŞARETİ**: kapıdan merdivene 3 birimlik sabit yolluk + her salona kısa dal halı. |
| "Girişteki masa ne, neden para toplanıyor / sıra var?" | **Kasa ve kuyruk kaldırıldı** — oyunda kasada ödeme ve sipariş kuyruğu yok (Model B′), o yüzden mekânda da yok. Yerine **karşılama tezgâhı**: askılık, gazete-tavla rafı, temiz bardak istifi (oyuncunun ilk tepsi noktası). |
| "Tatlı vitrini olmasın" | **Katta hiç vitrin yok.** |
| "Mutfak ocakbaşının alanından çalıyor... duvardan dışarı çıkıntı gibi olsun" | **Mutfak binanın batı duvarından dışarı taşan 8 × 9 ek hacim**, **üstü açık** (içi görünür). Kat içi 34 × 34 tamamen salon. Salona tek bağ: servis penceresi (adisyon askısı + hazır bardaklar) + ayrı personel kapısı; davlumbaz bacası dış cepheden yükselir. Adım 1-2'de mutfak = omurganın dibinde küçük çay ocağı, **servis tezgâhı yok**. |
| "Ayaküstü köşesi saçma, dar alanlar var" | **İptal.** Arka yarı **Tavla / Okey Odası**: tek tip 4 kişilik oyun masası, geniş koridor, skor tahtası. Yüksek masa ve karışık mobilya yok. |
| "Ocakbaşı ocakbaşı gibi değil, sipariş nereye gidecek?" | **Ocakbaşı = TEZGÂH.** Servis penceresine paralel uzun tezgâh, önünde 5 tabure, tezgâh üstünde ısıtıcı hattı, arkasında personel koridoru. Sipariş tezgâh üstüne konur; **para istifi her taburenin önünde tezgâhta birikir.** |

### Genel ilkeler (Fable 5.1 danışması, uygulandı)
1. **Sabit omurga:** kapı–yolluk–merdiven ekseni hiç değişmez, kat onun etrafında kanatlanır.
2. **Her salonun tek mobilya dili** (normal masa / oyun masası / tezgâh) — karışık tip yok.
3. **Kapalı hacimler** (mutfak, WC) salon alanından değil bina dışından/arka duvardan alınır.
4. **Oyunda olmayan hiçbir şey mekânda yok** (kasa, kuyruk, vitrin).
5. **Her yüzey bir sinyal:** halı = yol, tezgâh = servis noktası, istif = para.

### Adımlar
| Adım | Açılan | Mutfak |
|---|---|---|
| 1 | Merkez omurga `x[−6,6] z[0,2,17]` — kapı, yolluk, 4 masa, karşılama tezgâhı | omurganın dibinde küçük çay ocağı (semaver) |
| 2 | + Sağ kanat: **Cam Kenarı** (3 pencere, 2×2 ünite) | + cezve ocağı + bulaşık |
| 3 | + Sol kanat: **Ocakbaşı tezgâhı** (5 tabure) | **binanın dışına çıkar** (tost sacı, bulaşık, davlumbaz, servis penceresi) |
| 4 | + Arka yarı: **Tavla/Okey Odası**, WC, **merdiven → Kat 2** | değişmez |
