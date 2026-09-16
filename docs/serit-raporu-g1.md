# G1 — GÖREV ŞERİDİ RAPORU (ölçüm)

**Soru:** Bir görev bittiğinde ekranda kaç ses aynı anda konuşuyor, hangi sırayla — ve kamera
yeni hedefe hangi anda gidiyor?

**Kapsam:** kullanıcının 2026-09-16 geri bildiriminden G-41…G-44
(`docs/geribildirim-oyun-testi-2026-09-16.md`). Dördü tek kök.

**Araç:** `tools/olcum-serit-g1.ts` · **ham çıktı:** `docs/olcum-serit-g1.txt` (tam koşu, damgalar temiz)
**Kareler:** `docs/gorsel/ss/g1-serit-normal.png` · `docs/gorsel/ss/g1-serit-bitti.png`

---

## §0 — ÖLÇÜMDEN ÖNCE: KÖK SEBEP KODDA BULUNDU

G-41 ve G-43'ün şikâyet ettiği tebrik toast'ı **2026-09-09'da kullanıcı kararıyla zaten
kaldırılmıştı** (G-04). Kaldıran satır bugün kodda yok:

```
f4b1a52 (S3 turu) —  {notice && notice.kind !== 'quest' && (     ← silindi
                     {notice && (                                ← yerine bu geldi
```

Silme gerekçesi commit mesajında yazılı: *"tsc -b HUD'da S2'den kalan ölü bir dal buldu
(notice.kind !== 'quest', oysa tip artık 'level' | 'reveal')"*. O an tip gerçekten daralmıştı,
yani derleyici haklıydı. Ama **karar dalla birlikte silindi**: `kind: 'quest'` sonradan tipe geri
geldi (`rules.ts:345`) ve `tick.ts:1452` o toast'ı hâlâ kuyruğa koyuyor. Bugün HUD'un içindeki
yorum *"görev tamamlanma toast'ı ARTIK ÇİZİLMEZ"* diyor — **çiziliyor.**

> **Ders:** derleyicinin "ölü dal" uyarısı, dalın taşıdığı KARARIN öldüğü anlamına gelmez.
> Bir kullanıcı kararını kod içinde tutan tek şey bir `if` ise, o karar bir tip daralmasıyla
> sessizce geri alınabilir. Bekçisi olmayan karar, karar değil yorumdur.

---

## §Bulgular

### 1) Tebrik ile yeni görev 2,20 sn boyunca ÜST ÜSTE duruyor (G-41 · G-43)

Tam koşu, yedi senaryonun **yedisinde de** aynı sayıyı verdi:

| kol | ne | yeniKart sn | toast sn | **ORTÜŞME sn** | ses | panSapma sn |
|---|---|---|---|---|---|---|
| **T** | taban (bugünkü kod) | 1,33 | 3,53 | **2,20** | **2** | −0,65 |
| **V1** | tebrik toast'ı çizilmez | 1,33 | 0,00 | **0,00** | **1** | −0,65 |
| **V2** | toast ttl 3,5 → 1,3 sn | 1,33 | 1,30 | **0,00** | 2 | −0,65 |
| **V3** | gap 0,8 → 3,0 sn (yeni kart geç) | **3,58** | 3,53 | **0,00** | 2 | −1,77 |
| **V4** | geçişte kamera panı kapısı | 1,33 | 3,53 | **2,20** | 2 | **0,00** |

Okunuşu: görev bittiği an tebrik toast'ı doğuyor ve **3,53 sn** yaşıyor; yeni görev kartı ise
**1,33 sn** sonra geliyor (0,5 sn `completing` + 0,8 sn `gap`). Aradaki **2,20 sn** boyunca
ekranda aynı cümleyi söyleyen **iki ayrı kutu** duruyor. Kullanıcının *"yeni görev hemen gelirken
onun üstünde biten görevin tebrikleri var"* cümlesinin sayısı budur.

**Bu bir ritim sorunu değil, bir SAYI sorunu:** toast 3,53 sn, pencere 1,33 sn. Toast penceresine
sığmıyor ve sığması da beklenmemiş — iki sistem birbirinin süresini hiç görmüyor.

### 2) İki kutu, aynı cümle, 8 px ara (G-43)

`docs/gorsel/ss/g1-serit-bitti.png` — telefon portresi, gerçek çerçeve:

| ekran | kutu sayısı | bant [x,y,w,h] | toast [x,y,w,h] | aradaki boşluk |
|---|---|---|---|---|
| telefon portre 390×844 | **2** | 10, 714, 370, 58 | 82, 659, 226, 47 | **8 px** |
| masaüstü 1280×800 | **2** | 10, 666, 1260, 58 | 523, 606, 234, 49 | 11 px |

İkisi de "5 çay servis et" yazıyor; biri `+15` rozetiyle, diğeri `TAMAMLANDI` alt yazısıyla.
Kullanıcının *"görev bitti o kendi görev çubuğunda olsun, kısaca her şey tek çubukta"* dediği hâl
**bandın kendisinde zaten var** (yeşil kenar + onay işareti + TAMAMLANDI) — fazlalık olan toast.

### 3) Bant kendi içeriğine 2,0 px YETMİYOR (G-42)

| ekran | oyun fontu | taşan kicker | kısalan başlık | bant iç yükseklik | gövdenin istediği | **AÇIK** | ÜST/ALT taşma |
|---|---|---|---|---|---|---|---|
| telefon portre 390×844 | yüklü ✓ (Baloo 2) | 0/50 | 1/50 | 52,0 px | 54,0 px | **−2,0 px** | 0,9 / 1,0 px |
| masaüstü 1280×800 | yüklü ✓ (Baloo 2) | 0/50 | 0/50 | 52,0 px | 54,0 px | **−2,0 px** | 0,9 / 1,0 px |

Kullanıcı *"görev çubuğu da üstte yazısı kesiliyor"* dedi. Ölçüm bunu doğruluyor ama sebebi
yatay taşma DEĞİL: 50 görevin 50'sinde lakap yatayda taşmıyor, hiçbiri iki satıra düşmüyor.
Kesilen şey **dikey**: bant `height: 58px` (iç 52,0 px) sabit, gövdesi 54,0 px istiyor → içerik
bandın üstünden **0,9 px**, altından **1,0 px** taşıyor. Bizim ölçüm ortamımızda 2 px; farklı
yazı-tipi ölçeği veya erişilebilirlik ayarı olan bir cihazda bu pay **büyür** — yani kullanıcının
gördüğü kesilme bu açığın aynısıdır, daha görünür hâli.

> **Kapsam damgası:** ölçüm masaüstü Chromium'da, oyunun kendi fontu (Baloo 2) yüklü hâlde
> yapıldı — `document.fonts` listesi çıktıya basılıyor. Cihazın kendi yazı-tipi ölçeği (Android
> "yazı boyutu" ayarı) ölçülmedi; açığın oradaki gerçek büyüklüğü bilinmiyor. **Yön kesin,
> büyüklük bu turda telefonda doğrulanmadı.**

Ayrıca: 50 görevin **1'inde** başlık kısalıyor — `q_z1allL4` *"Salonun 4 masasını Seviye 4 yap"*,
**32 px** kırpılıyor (üç nokta ile). Tek vaka; bandın yapısal kusuru değil, o cümlenin uzunluğu.

### 4) Erken zoom GERÇEK — ama yalnız SALON açılışında (G-44)

| senaryo | panSapma | panı isteyen |
|---|---|---|
| q_pickup · q_table2 · q_serve5 · q_station1 · q_table3 | — | pan atılmadı |
| q_coin | 0,00 | görev geçişi (prio 2) |
| **q_zone2 (salon açılışı)** | **−1,30 sn** | **reveal/alan — GEÇİŞ SIRASINDA (prio 1/3)** |

Kullanıcının *"başarılı işareti gelmeden ve yeni görev yazılmadan o gelecek yeni göreve zoom
atılmasın"* dediği şey **oluyor**, ama beklenenden dar bir yerde: görev geçişinin kendi panı
(prio 2) zaten tam yeni kartla birlikte atılıyor (sapma 0,00). Erken pan `tick.ts:1241`'den
geliyor — `unlockArea` pad'i açıldığı **tick'te** yeni salonun merkezine prio 3 odak kuruyor.
Yani kamera, bant daha "TAMAMLANDI" derken **1,30 sn önceden** yeni salona kayıyor.

Görev hattında bu durumu üreten iki görev var: `q_zone2` ve `q_zone3`. V4 kolu (geçiş fazı
boyunca odak kapısı) sapmayı **−1,30 → 0,00** yapıyor ve diğer kolonların hiçbirine dokunmuyor.

### 5) Kollar birbirinin işini yapmıyor — ikisi gerekiyor

V1 ortüşmeyi ve ses sayısını kapatıyor ama panı düzeltmiyor (−0,65 sn duruyor).
V4 panı kapatıyor ama ortüşmeye dokunmuyor (2,20 sn duruyor). **Dikey iki kusur, dikey iki kol.**
V2 ve V3 ortüşmeyi kapatan alternatifler: V2 tebriği 1,30 sn'ye kısar (ses hâlâ 2), V3 yeni kartı
3,58 sn'ye erteler (ritim **%169 yavaşlar**).

---

## §Aracın kendi kusurları (dördü kısa koşuda çürütüldü)

Ölçülen şeyden önce aracın kendisi dört kez düştü; hiçbiri raporda sayı olarak kalmadı:

1. **Açılış panı pencereye sızıyordu.** Taze oyun ilk hedefe kamera odağı kurarak başlıyor.
   Temizlenmeden ölçülünce araç, ortada hiç reveal olmayan sayaç senaryolarında bile
   *"pan yeni karttan 1,33 sn önce atıldı"* diye **sahte bir erken pan** basıyordu — yani G-44'ü
   olmadığı yerde doğruluyordu. Pencere artık temiz başlıyor.
2. **DOM ölçümü tek kartın kopyasıydı.** `__setQuest` yalnız `questIndex`i yazıyor; bandın çizdiği
   görünüm tick'te türüyor. Sabit sayıda kare beklemek yetmedi: 12 görevin 7'si hâlâ İLK görevin
   lakabıyla ölçülüyordu ve "0/12 taşma" sonucu bu yüzden temiz görünüyordu. Araç artık kare
   saymıyor, **çizilen yazının kendisini** bekliyor.
3. **Kollar aynı dünyayı ölçmüyordu.** Aynı kol, aynı tohum, donmuş dünya — yine de sayfadaki
   koşu sırasına göre parmak izi kayıyordu (431eba5f ↔ 189a8bbb). Tohum ve `__zaman(0)` yetmedi.
   Kaynağı aramak yerine koşul eşitlendi: **her ölçüm kendi taze sayfasında** koşuyor.
   Tekrarlanabilirlik artık damga (`tekrarlanabilir`).
4. **V4 kolunun ölçecek şeyi yoktu.** İlk senaryo listesinde salon açılışı yoktu; erken pan hiç
   üretilmediği için V4 tabanın birebir kopyası çıktı ve `varyant etkili` damgası bunu yakaladı.
   Senaryo listesine `q_zone2` eklendi — G-44'ün TEK gerçek kaynağı orasıymış.

Ayrıca `document.fonts.check()` yanılttı: Lilita One'ın yalnız 400 ağırlığı yüklüyken "700 var mı"
sorusuna **evet** dedi, Baloo 2 için **hayır**. Araç artık soru sormuyor, **yüklü yüzleri sayıyor**.

---

## §Karar — D-126 (kullanıcı, 2026-09-16)

Karar paketi sunuldu (https://claude.ai/artifact/F2jowE134dyDnzEQPBsAgy). Kullanıcı kareye
bakarak seçti ve iki kalem EKLEDİ:

| kol | seçim | kullanıcının sözü |
|---|---|---|
| **V1** — tebrik toast'ı çizilmez | **SEÇİLDİ** | *"tamamlanınca hâlâ üstte tamamlandı toastı gibi bir şey geliyor, tek yerde olması gerekiyor dedim ya"* |
| V2 / V3 | elendi | ikisi de kutuyu 2'de bırakıyor, yalnız süresini oynatıyor |
| **V4** — geçişte kamera kapısı | **SEÇİLDİ** | pakette önerildi, itiraz gelmedi; ölçülen −1,30 sn açıkta kalırdı |
| **C1** — bant yüksekliği içeriğe uyar | **SEÇİLDİ** | *"işler açılıyor o kadar üste yapışık olmasın"* |
| **YENİ — bandın üstündeki gri kalksın** | **eklendi** | *"çerçeve yeşil ya... üstte de gri bir gölge efekti var, onunla birlikte kötü duruyo. aslında iyi ama üstteki griyi kaldır"* |

Eklenen kalem ölçümde **yoktu**: araç kutuları, süreleri ve taşmayı sayıyordu; bandın üst
kenarındaki 3 px'lik iç parlamayı (`--k3`ün `inset` katmanı) kimse sormamıştı. Kare gösterilmeseydi
bu tur "G-42 kapandı" diye kapanır, kullanıcı aynı bandı üçüncü kez bildirirdi.
**Ders: ölçüm neyi sayacağını bilir, kare neyi sormadığını gösterir.**

## §Sonuç (uygulama sonrası TAM koşu — `docs/olcum-serit-g1.txt`)

| ölçüt | önce | sonra |
|---|---|---|
| tebrik ↔ yeni kart örtüşmesi | **2,20 sn** (7/7 senaryo) | **0,00 sn** (7/7) |
| "bitti" anında ekrandaki kutu | **2** (8 px arayla) | **1** |
| salon açılışında pan sapması | **−1,30 sn** (erken) | **0,00 sn** (kartla birlikte) |
| bandın gövde taşması (üst/alt) | 0,9 / 1,0 px | **0,0 / 0,0 px** |
| kırpılan başlık | 1/50 (32 px) | **0/50** |
| bant yüksekliği | 58 px sabit | 66 px (içerikten türer, taban 58) |

**Pan silinmedi, ERTELENDİ.** Salon açılışının "orada yeni bir dünya var" panı kullanıcının kendi
isteğiydi (2026-06-09); yanlış olan varlığı değil sırasıydı. Artık kutlama penceresinde beklemeye
alınıyor ve yeni kart gelince `requestFocus`tan yeniden geçiyor — yani öncelik karşılaştırması ve
H1'in "hedef zaten ekranda" kapısı bir kez daha uygulanıyor.

### Aracın kendi körlüğü — beşinci kusur, uygulamadan SONRA çıktı

Düzeltme uygulanınca araç örtüşmeyi 0,00 diye bastı ve `olcut kor degil` damgası kırıldı: "taban
sıfır" iki ayrı şeyin cevabı olabilir — örtüşme gerçekten yoktur, ya da **araç artık hiçbir tebriği
göremiyor**. İlk sürüm bildirimi TÜRÜNDEN sayıyordu (`kind === 'quest'`); HUD'un kapısı devreye
girdiği an bu sayaç kör kalırdı ve sıfırı kendi kendini doğrulardı.

İki değişiklik: ① araç artık ekranda olanı sayıyor — `devHooks` HUD'un kendi kapısını
(`toastCizilir`) yayımlıyor, yani ölçüm ile çizim aynı fonksiyondan okuyor; ② **kontrol kolu (K)**
eklendi: biten görevin tebriğini çizilebilir bir türe çevirir. K'de örtüşme **2,20 sn** ve kutu **2**
çıkıyor — hem de parmak izi eski tabanla **birebir aynı** (`431eba5f/189a8bbb/…`). Yani araç
gözünü kaybetmedi; tabandaki sıfır bir bulgu.

Ayrıca `varyant etkili` damgası artık bir kolun etkisi koda girdiğinde tabanın **sayısına bakarak**
"uygulandı" diyor — yoksa her uygulanan karar, kendi bekçisini kırmızıya düşürürdü.

**Final:** vitest **1220 ✓** · duman **45/45 ✓** · tsc temiz · mutasyon **15/15 kırmızı**
(`node tools/mutasyon-serit-g1.mjs`).
