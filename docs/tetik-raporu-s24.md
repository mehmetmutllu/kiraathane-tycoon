# S24 — yükseltme tetiği: DAİRE mi ÇERÇEVE mi (ölçüm raporu)

**Soru.** Kullanıcı: *"yanında falan değil, çerçeve içinde olayım."* Bugün yükseltme dolumu tek
bir daire testine bağlı (`tick.ts` → `dist2D(player, spot) < TABLE_UP_RADIUS | PAD_RADIUS`).
Ekranda ise daire çizilmiyor: çizilen şey köşe parantezli bir **dikdörtgen**
(`GroundMarker`, yarı-ölçüleri `hw` × `hh`).

**Araç.** `tools/olcum-tetik-s24.ts` — gerçek sahneden okur, kaynaktan yeniden hesaplamaz.
`isaret:*` düğümlerinin `userData.olcum`u ve `parantez0..3` mesh'lerinin dünya kutusu birleşimi
alınır; erişilebilirlik `activeSolids` + `playerRadius` ile 0,01 br ızgarada taranır.
**Ham çıktı:** `docs/olcum-tetik-s24.txt` · `docs/olcum-tetik-s24.json`
(tam koşu, damga `2026-09-15T21:2x`, damgalar temiz, 13 işaret · 12 masa · 3 salon · 29 katı).

**Beş ölçü.** `disarı%` tetikleyen alanın çerçeve **dışında** kalan yüzdesi (kullanıcının
"yanında"sı) · `ölü%` çerçeve içinde **tetiklemeyen** alan · `erişim%` tetiğin oyuncunun
fiziksel olarak girebildiği kısmı · `durakR` tetik∩erişilebilir bölgeye sığan en büyük dairenin
yarıçapı ("duracak yer" — oyuncu yarıçapı 0,47 ile karşılaştırılır) · `çakışma` komşu işaretle
örtüşen çift sayısı.

---

## §Bulgular

### 1. Bu S23'ün tekrarı DEĞİL: çizilen çerçeve, yazan çerçeveyle birebir aynı

| | yazan hw | çizilen hw | sapma | yazan hh | çizilen hh | sapma |
|---|---|---|---|---|---|---|
| YÜKSELT (servis, r 0,85) | 1,0467 | 1,0467 | **0,0000** | 0,8500 | 0,8500 | **0,0000** |
| SV 2 (masa ×12, r 0,60) | 0,6300 | 0,6300 | **0,0000** | 0,6000 | 0,6000 | **0,0000** |

S23'te gizli bir √3 çarpanı vardı (D-120). Burada yok: **en büyük sapma 0,0000 br.** Yani kusur
bir ölçü hatası değil. Kusur, tetik ile çerçevenin **birbirinden türemeyen iki ayrı geometri**
olması.

### 2. Bugün tetikleyen alanın YARISI çerçevenin dışında

| kol | açıklama | disarı% | ölü% | erişim% | durakR | tetik alanı (br²) |
|---|---|---|---|---|---|---|
| **T** | **taban — bugünkü daire** (masa 1,0 · pad 1,3) | **%50,4** | %0,0 | %94,1 | 0,909 | 3,309 |
| A1 | daire → tek küresel yarıçap (0,600 br) | %0,0 | **%28,5** | %98,9 | 0,562 | 1,131 |
| A2 | daire → işaret başına min(hw, hh) | %0,0 | **%26,0** | %98,9 | 0,579 | 1,219 |
| _G_ | _görsel "üstündesin" kabarması (hw × 1,35) — **aday değil**_ | _%34,3_ | _%0,1_ | _%95,5_ | _0,804_ | _2,580_ |
| **B** | **çerçeve — çizilen dikdörtgenin kendisi** | **%0,0** | **%0,0** | %97,6 | 0,605 | 1,669 |

Taban satırı kullanıcının cümlesinin sayısı: tetikleyen alanın **%50,4'ü** çerçevenin dışında,
ölü bölge **%0,0** — yani çerçeve tamamen dairenin içinde kalıyor, daire her yönde taşıyor.
İşaret başına: masa noktalarında **%51,9**, servis noktasında **%33,2**.
Menzil olarak: tetik merkezden **1,023 br** uzanıyor, çerçeve ise **0,662 / 0,619**.

### 3. Geometri iki değil ÜÇ: görsel geri bildirim de ayrı bir sınır kullanıyor

`GroundMarker` oyuncu "işaretin üstünde" sayılınca çerçeveyi 1,12 kat kabartıyor, ama bu
"üstünde" testi kendi dairesini kuruyor (`hw × UZERINDE_PAYI`, bugün 1,35). Ölçülen:
kabarma sınırının **%34,3'ü** çerçevenin dışında (satır _G_). Yani oyuncuya *"buradasın"* diyen
sınır, parayı akıtan sınır ve gözle görülen çerçeve **üç ayrı şey**. Kararın kapsamı buna bağlı:
tetik çerçeveye bağlanır da kabarma bağlanmazsa, kusur biçim değiştirip kalır.

### 4. Daireyi daraltmak "yanında"yı kapatıyor ama ÖLÜ BÖLGE açıyor

Çerçeveler ne aynı boyda ne de kare: masa 0,630 × 0,600, servis **1,047 × 0,850**. Tek daire bu
dikdörtgenlerin içine ancak **en kısa kenarından** girer.

- **A1** (tek küresel yarıçap 0,600): ortalama ölü bölge **%28,5**, servis noktasında **%68,2** —
  yani gözle görünen çerçevenin üçte ikisinde durmak işe yaramıyor.
- **A2** (işaret başına min(hw,hh)): ortalama **%26,0**, servis **%36,1**. İşaret başına ayarlamak
  sorunu yalnızca biraz küçültüyor, çünkü asıl uyumsuzluk **kare olmayan çerçeve**.

### 5. Çerçeve testinin erişim/çakışma riski ÖLÇÜLDÜ — ikisi de yok

- **Çakışma: dört kolun dördünde de 0 çift.** İki işaret arası en yakın mesafe **4,065 br**;
  en geniş tetik bile 1,023. Komşu masayı yanlışlıkla doldurma riski hiçbir kolda doğmuyor.
- **Erişim:** B kolunda **%97,6** (T'de %94,1). Ada/banket masalarının dördünde T yalnız %80,6-80,8
  erişilebilirken B **%91,7-92,5** — daire katıların içine taştığı için tabanda daha kötü.
  Hiçbir kolda erişimi 0 olan işaret yok.
- **Duracak yer:** B'de `durakR` ortalama **0,605**, en dar işarette **0,55**. Oyuncu yarıçapı
  **0,47** olduğundan oyuncu her işaretin içine sığıp durabiliyor.

### 6. B kolunun bedeli (açıkça)

Tetik alanı **3,309 → 1,669 br² (−%49,6)**; eksende menzil **1,023 → 0,662 / 0,619 br**. Yani
oyuncu bugünkünden ortalama **~0,4 br daha yakına** yürümek zorunda. Bu bir kayıp değil, istenen
şeyin fiyatı: "yanında" alanı tam olarak bu alandı.

---

## §Karar

_(boş — karar paketi kullanıcıya sunulacak, D-084 adım 3)_

## §Uygulama

_(boş — yalnız seçilen kol uygulanacak, D-084 adım 4)_
