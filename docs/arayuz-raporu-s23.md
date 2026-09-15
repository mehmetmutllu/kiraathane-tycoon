# S23 raporu — karakter menüsü · panel doluluğu · yükseltme oku

**Tur:** S23 (Faz S) · **Damga:** 2026-09-15 · **Kural:** `docs/oturum-akisi-mantik.md` (D-084)
**Ham çıktı:** `docs/olcum-arayuz-s23.txt` · `docs/olcum-arayuz-s23.json` (tam koşu, hata 0)
**Araçlar:** `tools/olcum-arayuz-s23.mjs` (ölçüm) · `tools/ok-bak.{html,mjs}` (biçim adayları)
**Kareler:** `docs/gorsel/ss/s23-ok-adaylari.png` · `s23-karakter-{player,waiter,dish}.png` ·
`s23-panel-{gorevler,hedefler,magaza,ayarlar}.png` · `s23-karakter-{telefon,masaustu}.png`

## Soru

Kullanıcının 2026-09-14 gecesi verdiği yedi kalemin kalan dördünden **görsel üçü**. Dördüncüsü
(yükseltme tetiği pad'in tam üstünde) `rules.ts`'e dokunuyor, varyant kapısına tabi ve kullanıcı
kararıyla **ayrı tura** bırakıldı — "görevi en fazla ikiye böl". Kalemlerin asıl metni git'te:
`git show 67aeca2:memory-bank/activeContext.md` satır 24-44.

1. **K — karakter menüsünde yeni tasarımlar.** *"panel hâlâ `Player.tsx`'in ESKİ ilkel
   `OwnerBody`sini gösteriyor; KayKit gövdesine geçecek. Garson/bulaşıkçı sekmeleri de."*
2. **E — paneller ekranı tam ve düzgün kullansın.** *"karakter menüsü ve diğerleri."*
3. **O — yükseltmenin solundaki ok.** *"ya kalkacak ya düzeltilecek; şu an çerçeveye
   değiyor/içinde kalıyor."* Daha eski hâli (G-12) *"altı kesikli nitro tarzı ok"* istiyordu.

Üçü de denge dosyasına (`economy.config.ts` · `tick.ts` · `rules.ts`) dokunmuyor; varyant kapısı
denge tarafından tetiklenmiyor. Ama üçü de **ölç → sor → uygula** sırasına tabidir.

## Yöntem

Üç bölüm de **çizilenden** okur, kaynak metinden değil — çünkü üçünün de kaynaktaki cevabı
yalancı: panelin CSS'i "tam ekran" diyor ama içerik ekranın yarısında bitebilir; panel
"önizleme" diyor ama içindeki gövde salondakinden başkası olabilir; ok `OK_GENIS = 0,34` diyor
ama çizilen üçgen o bloktan geniş olabilir.

- **§E** DOM kutularından: 5 ekran × 2 kadraj (telefon 390×844 · masaüstü 1280×800).
- **§K** karenin PİKSELLERİNDEN: önizleme tuvalinin altına ölçüm süresince düz kroma zemin
  konur, silüet kesin ayrılır. Yanında salonun kendi gövdesinin rol başına bedeli durur.
- **§O** GERÇEK sahnenin üçgenlerinden: `GroundMarker`ın parçaları adlandırıldı
  (`ok-govde` · `ok-uc` · `parantez0..3` · `etiket`) ve açıklık **üçgen üçgene** ölçüldü.

### Ölçümün kendi üç kazası (yöntem notu)

Üçü de aracı kırdı ve üçü de düzeltildi; not düşülüyor çünkü her biri bir sonraki ölçüm turunda
tekrar edebilir.

1. **Tek adımda tam ilerleme §E'nin 10 satırının 10'unu birden düşürdü.** Masa pad'leri
   tamamlanmış sayılınca alan açılış kaplaması geliyor ve alt gezinmeyi tıklanamaz yapıyor.
   Panel ölçümü ile ok ölçümü **aynı oyun hâlinde yapılamıyor** → iki evre.
2. **§O bir koşuda 5, sonrakinde 0 satır döndürdü.** Masa 1 ₺ tavanına çekilince oyuncu Usta
   noktasının üstünde kalıyor, bekleme doluyor, modal açılıyor ve modal açıkken işaretler
   çizilmiyor. Oyuncu artık nötr noktaya ışınlanıyor; boş çıktı da sessiz kalmıyor, hata basıyor.
3. **AABB "çakışıyor" dedi, ekranda çakışma yoktu.** Parantez bir **L**'dir ve kutusu L'nin boş
   iç köşesini de kaplar. Kutuyla ölçülen açıklık dördünde de negatif çıktı; üçgen üçgene
   ölçülünce gerçek sayı **+0,010 r** oldu. Kutu bu soruyu cevaplayamaz.

## Bulgular

### §O — OK (sayı burada; karar kolu bu tabloya dayanır)

Ölçü birimi işaretin kendi yarıçapı **r** (masa/Usta noktası r = 0,60 · servis noktası r = 0,85).
Kaynakta ayrılan yerleşim: `OK_GENIS 0,340 r` · `OK_BOSLUK 0,160 r` · `KENAR_PAYI 0,180 r`.

| işaret | r | okun GERÇEK eni | ayrılan blok | sol pay | yazıya açıklık | parantez açıklığı |
|---|---|---|---|---|---|---|
| YÜKSELT (servis) | 0,85 | **0,554 r** | 0,340 r | **0,073 r** | **0,053 r** | **0,010 r** = 0,0085 br |
| SV 2 (masa ×3) | 0,60 | **0,554 r** | 0,340 r | **0,073 r** | **0,053 r** | **0,010 r** = 0,0060 br |
| YÜKSELT (Usta) | 0,60 | **0,554 r** | 0,340 r | **0,073 r** | **0,053 r** | **0,010 r** = 0,0060 br |

Beş işaretin beşinde de aynı üç sayı çıkıyor; kusur bir yerleşim kazası değil, **geometrinin
kendisi**:

- **Okun ucu ayrılan bloğundan %63 geniş.** Uç `circleGeometry(r·0,32, 3)` — 3 kenarlı çember,
  yani kenar uzunluğu yarıçapın √3 katı: `0,32 · √3 = 0,554 r`. Ayrılan blok 0,340 r. Blok
  yazıyla yarışmasın diye konmuştu, ama okun kendisi bloğa hiç sorulmadan çiziliyor.
- **Sol kenar payının %59'unu ok yiyor:** 0,180 r yazılı, geriye **0,073 r** kalıyor.
- **Yazıya kalan açıklık amaçlananın üçte biri:** `OK_BOSLUK` 0,160 r, gerçekte **0,053 r**.
- **Parantez açıklığı 0,010 r.** Mutlak değerle **0,006 birim** (küçük işaret). Yani ok
  parantezin içine girmiyor ama ona **değiyor sayılır** — kullanıcının *"çerçeveye
  değiyor/içinde kalıyor"* cümlesinin sayısı budur. Kadrajda (`s23-ok-adaylari.png` O0 kartı)
  gözle de ayrılmıyor.

**Biçim adayları** `docs/gorsel/ss/s23-ok-adaylari.png`'de, sekizi tek kadrajda, **gerçek
çerçeve ve gerçek boyda** (r = 0,60, oyunun 45° kamerası, fov 50). Her kartta çerçeve ve yazı
gerçek `GroundMarker`dır; aday olan yalnız ok:

| kol | ne | not |
|---|---|---|
| **O0** | bugün (referans) | yukarıdaki üç sayı |
| **O1** | ok YOK | yazı ortalanır, çerçeve daralır (kartta çerçeve hâlâ geniş çizilidir — blok rezerve) |
| **O2** | aynı ok, bloğa sığmış | biçim aynı, uç 0,554 → 0,340 r. Kusur sadece ölçüyse bu yeter |
| **O3** | ince uzun ok | şaft uzar, uç daralır — dikey vurgu |
| **O4** | NİTRO, altı kesikli | G-12'nin tarifi: gövde üç dilim, yukarı büyür |
| **O5** | çift chevron | ok değil yön işareti, en hafif kol |
| **O6** | üç chevron (dar) | nitroya en yakın, dolu üçgen yok |
| **O7** | kalın tek chevron | küçük işarette en okunaklı, sade |

### §K — KARAKTER MENÜSÜ

**Panelin çaycısı oyunun çaycısı değil — dört kimlik işaretinin DÖRDÜ de ters.** Panel
`OwnerBody`yi (ilkel gövde) çiziyor, salon `KayActor`ü (KayKit Ranger). `KAY_KIYAFET.owner`
satırı: `{ kasket: false, onluk: false, havlu: true, sivaliKol: true }`.

| kimlik işareti | panelde | oyunda | tutuyor mu |
|---|---|---|---|
| kasket | var | **yok** (S15'te kaldırıldı) | HAYIR |
| önlük | var | **yok** (önlük personelin üniforması, patronun değil — S18) | HAYIR |
| omuz havlusu | **yok** | var (D-116 · P7) | HAYIR |
| sıvalı kol | **yok** | var (D-116 · P7) | HAYIR |

Yani panel, oyunda iki turdur var olmayan bir adamı gösteriyor. Garson ve bulaşıkçı sekmeleri
daha da geride: ikisi de hâlâ **kapsül** (`capsuleGeometry` ×2), salonda ikisi de skinned.

**Önizleme kutusu da boş duruyor.** Kutu 356×134 CSS (712×268 fiziksel piksel):

| sekme | silüet (px) | dikey doluluk | **yatay doluluk** | merkez Y | alt kırpık |
|---|---|---|---|---|---|
| Oyuncu | 167×221 | 0,825 | **0,235** | 0,537 | EVET |
| Garson | 153×199 | 0,743 | **0,215** | 0,578 | EVET |
| Bulaşıkçı | 162×200 | 0,746 | **0,228** | 0,576 | EVET |

Gövde önizleme kutusunun eninin yalnız **%22-24'ünü** kullanıyor; kutunun yaklaşık **dörtte üçü
boş**. Üçünde de ayak alt kenara dayanıyor (kadraj gövdeyi kesiyor).

**Geçişin bedeli** (salondan okundu — panelin geçeceği gövdeler bunlar):

| rol | gövde | mesh | üçgen |
|---|---|---|---|
| owner | Ranger | 8 | 8.900 |
| waiter | Knight | 9 | 5.800 |
| dishwasher | Rogue | — | (sahnede o an yoktu) |
| kitchenHand | Barbarian | 7 | 7.123 |

Sahnede toplam 28 skinned mesh / 34.171 üçgen. Panel aynı anda **tek** gövde çiziyor, yani
ek yük en çok bir rolün üçgeni kadar; ayrıca `Ranger_Cape` · `Ranger_Quiver` · `Knight_Helmet`
gibi ekipman düğümleri `KayActor` içinde zaten gizleniyor.

### §E — PANEL DOLULUĞU

Kabuk zaten tam ekran (D-106, S12) — ölçülen şey **içeriğin** o ekranı doldurup doldurmadığı.

**Telefon (390×844):**

| ekran | içerik yüksekliği | dikey doluluk | en büyük boşluk | **alt kuyruk** |
|---|---|---|---|---|
| Görevler | 708 | 0,905 | 36 | 58 |
| Hedefler | 757 | 0,968 | 40 | 8 |
| **Mağaza** | 428 | **0,548** | **224** | **342** |
| **Karakter** | 425 | **0,543** | 37 | **353** |
| **Ayarlar** | 243 | **0,311** | 48 | **525** |

Beş ekranın **üçünde içerik ekranın yarısında bitiyor** ve altında 342-525 px ölü alan kalıyor.
Ayarlar ekranında içerik 782 px'lik gövdenin yalnız **%31'ini** dolduruyor. Mağazanın ayrıca
**224 px'lik bir iç deliği** ve asimetrik kenarı var (sol pay 75 px, sağ pay 14 px).

**Masaüstü (1280×800):** kart 520 px genişlikte ve x = 380'de — yani **kart ekranın %40,6'sı**,
kalan %59 perde. Yatay doluluk 0,31-0,38. Telefonda kart ekranın tamamı (1,000); masaüstünde
panel ortada dar bir sütun.

## Karar

*(bu bölüm bilerek boştur — karar paketi kullanıcıya sunulacak, seçilen kol buraya yazılacak)*

## Uygulama

*(karar sonrası)*
