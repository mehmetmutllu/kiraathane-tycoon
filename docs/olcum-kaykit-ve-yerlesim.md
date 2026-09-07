# Ölçüm — KayKit duvarları + maket ↔ oyun yerleşim farkı

2026-09-07 gece. İki soru, ikisi de ölçüldü. Kaynak: `public/assets/models/kaykit-restaurant-bits/`
(144 model) · `docs/maket/maket-v13.html` · `src/game/layout.ts`.

---

## 1. KayKit duvarlarını tüm oyunda kullansak?

### Paketin gerçek ölçüleri

| parça | genişlik | yükseklik | derinlik |
|---|---|---|---|
| `wall` · `wall_doorway` · `wall_window_open/closed` | **4,0** | **4,0** | 0,5 |
| `wall_half` | **2,0** | 4,0 | 0,5 |
| `wall_decorated` | 4,0 | 4,0 | 2,91 (rafl/dolaplı) |
| `wall_orderwindow` | 4,0 | 4,0 | 0,9 |
| `pillar_A` | 0,6 | 4,1 | 0,6 |
| `door_A` | 1,6 | 2,8 | 0,77 |
| `floor_kitchen` | 4,0 | 0,5 | 4,0 |

**Paket bir 4-birim ızgara üstüne kurulu.** Duvar boyu 4'ün katı olmak zorunda (yarım duvarla 2'nin katı).

### Artıları
- **Tek materyal, tek atlas.** 144 modelin hepsi `restaurant` materyalini ve tek bir
  `restaurantbits_texture.png`'yi paylaşıyor → hepsi tek draw call'a toplanabilir. Şu anki elle
  yazılmış geometride her renk ayrı materyal demek; bu paket performansta net kazanç.
- Duvar ailesi tam: düz · yarım · kapı boşluklu · pencereli (açık/kapalı) · sipariş pencereli ·
  donatılmış · sütun · kapı kanadı · mutfak zemini.
- D-013'ün tek stil kilidi zaten KayKit; asset zevki de KayKit (Kenney reddedilmişti).
- 4 MB — bugünkü ~1,46 MB bundle'ın yanında ciddi ama kabul edilebilir (model dosyaları lazy).

### Kısıtları — belirleyici olan bunlar
1. **Kat 34 × 34, 4'e bölünmüyor** (8,5 modül). KayKit duvarına geçmek katı **32** (8 modül) veya
   **36** (9 modül) yapmayı gerektirir.
2. **Duvar yüksekliği 4,0**, maketin 3,2'si değil. "Maketle birebir" kuralı duvarda delinir.
3. **Kapı boşluğu modülün İÇİNDE sabit yerde.** Oyunun kapısı 2. alan açılınca x = −8,5'ten 0'a
   **kayıyor**; KayKit'te kapı ancak modül sınırlarına oturur.
4. Maketin üç penceresi 3,2 genişliğinde; KayKit penceresi 4,0'lık modülün içinde sabit.
5. Maketin duvarı düz renk + lambri kuşağı; KayKit'inki dokulu. Karışık kullanılırsa
   (bir yerde maket duvarı, bir yerde KayKit) tek stil kilidi bozulur.

### Öneri
**Soru aslında "maket mi KayKit'e uyacak, KayKit mi makete?" — ikisi birden olmuyor.**

Eğer KayKit duvarı isteniyorsa doğru sıra: **önce MAKET güncellenir** (32 × 32, 4-modül ızgara,
kapı modül sınırında, duvar 4,0), sonra BM o maketi transkribe eder. Çünkü maket tek doğru kaynak
(D-070); önce oyunu KayKit'e çevirip maketi eski bırakmak, bu gece kapattığımız "iki ayrı kaynak"
sorununu geri getirir.

BM'i şimdiki hâliyle (34 × 34, maket duvarı) bitirip sonra KayKit'e geçmek de mümkün ama duvar işi
**iki kez** yazılır ve katın boyutu değişince yerleşim ölçümleri ikinci kez geçersizleşir.

---

## 2. Maket ↔ oyun yerleşim farkı

### Ön çeyrek kümeleri (1. ve 2. Alan) — EŞLEŞMİYOR

Maket: `teaCluster(g, -8.5, 8.5, [...], 3.2)` → dört masa, merkeze ∓3,2 ofsetle.
Oyun: `TABLE_SPOTS` → dört masa, merkeze ∓1,6 ofsetle.

| | maket v13 | oyun | oran |
|---|---|---|---|
| küme merkezi | (−8,5 · 8,5) | (−8,5 · 8,5) | ✅ aynı |
| masa aralığı (merkez↔merkez) | **6,40** | **3,20** | **½** |
| masa tablası | **1,75 × 1,75** | ~0,90 × 0,90 | **½** |
| masa yüksekliği | 0,75 | 0,50 | 0,67× |
| koltuk mesafesi (masa merkezinden) | **1,45** | **0,78** | 0,54× |
| masa kenarları arası boşluk | **4,65** | **2,20** | 0,47× |
| kümenin kapladığı alan | 6,4 × 6,4 = **41 br²** | 3,2 × 3,2 = **10,2 br²** | **¼** |

**Teşhis:** kat planı (34 × 34, küme merkezleri) maketle **1:1**, ama mobilya ve aralıklar
**~½ ölçekte**. Yani oyun, maketin *tam boy zemini üstüne yarım boy mobilya* dizmiş durumda —
kümenin ayak izi maketin **dörtte biri**. "Boş görünüyor" hissinin sayısal karşılığı bu.

### Orta şerit (3. Alan) — EŞLEŞİYOR

| | maket | oyun |
|---|---|---|
| banket birim aralığı | 3,20 | **3,20** ✅ |
| masa ekseni (bankete uzaklık) | 1,85 | **1,85** ✅ |
| ikili masa tablası | 1,00 × 1,00 | ~1,00 ✅ |
| ada merkezleri | ∓8,5 | ∓8,5 ✅ |

Şerit B3-2'de maketten doğru transkribe edilmiş.

### Asıl bulgu
**Oyun, ŞERİDİN masasını ve ızgarasını ön çeyreklere de uygulamış.** Makette iki ayrı mobilya dili
var: ön çeyreklerde **büyük dörtlü çay masası** (1,75 · 6,4 ızgara), şeritte **küçük ikili kafe
masası** (1,00 · 3,2 ızgara). Oyunda ikisi de küçük masa ve 3,2 ızgara.

Düzeltme (BM adım 2): ön çeyrek masası maketin `teaTable`'ına (1,75 × 1,75 @ 0,75), küme ızgarası
6,4'e çıkar; koltuklar ∓1,45'e, çarpışma yarı-boyu ve yükseltme noktaları buna göre yeniden türer.
Şeride dokunulmaz. Kullanıcı kuralı (D-070): **maket bitmiş hâldir** — en üst kademe maketin
ölçüsü olur, ara kademeler ondan geriye türetilir.
