# C2 — "Tek Odak" ölçümü (D-038'in kodda karşılığı)

**Tarih:** 2026-09-08 · **Araç:** `tools/olcum-tek-odak.ts` (ham çıktı `docs/olcum-tek-odak.txt`) ·
**Kareler:** `docs/gorsel/ss/tekodak-plan.png` · `tekodak-salon3.png` · `tekodak-salon2.png`
(`node tools/shot-tek-odak.mjs`, dev sunucusu açıkken)

## 0. Neden ölçüldü

C1 raporu Faz C'nin kalan işi olarak *"Tek Odak kuralı deliniyor — opsiyonel pad'ler ve yükseltme
dolumları görev filtresinin dışında çiziliyor"* diyordu. Bu cümle **D-038'den (2026-09-05)
devralınmıştı**. C1'in kendi dersi tam da buydu: *devralınan bir bulgu, yeni yazılan bir tahmin
kadar bayatlar.* Bu yüzden kod değişmeden önce bulgunun kendisi ölçüldü.

**Ne ölçülüyor:** sahnede aynı anda çizilen zemin işareti (`GroundMarker`) sayısı. Dört kaynak var,
dördü de **canlı kodun kendi yüklemiyle** sorgulanıyor (ikinci bir doğru kaynak yazılmadı):
`Pad.tsx`→`visiblePads` · `StationUpgradeSpots` · `TableUpgradeMarkers` · lavabo noktası.

**Nasıl:** zaman/para simüle edilmiyor — işaret sayısı **durumun** fonksiyonu, sürenin değil. Görev
hattı sim'in `trySpend` sırasıyla adım adım yürütülüyor (142 durum), her durumda işaretler sayılıyor.

## 1. Bulgunun YARISI bayat çıktı

**"Opsiyonel pad'ler" diye bir delik KALMADI.** `economy.config.ts`'te `optional: true` pad
**yok** (26 pad'in hepsi `optional: false`); son kalan `waiter3` C1'de omurgaya alınmıştı.
`availableOptionalPads` her çağrıda boş dizi dönüyor. Ölçüm doğruluyor: **pad işareti en çok 1**,
142 durumun hiçbirinde 2 olmuyor.

`visiblePads`'in "Y4: opsiyonel pad'ler görev durumundan bağımsız görünür" dalı ve `Pad.tsx`'in
"mavi = opsiyonel" rengi artık **ölü kod**.

## 2. Deliğin GERÇEK yarısı: masa yükseltme noktaları

| kaynak | ortalama | en çok |
|---|---|---|
| pad | 0,17 | **1** |
| servis yükseltme | 0,31 | **1** |
| **masa yükseltme** | **7,82** | **16** |
| lavabo yükseltme | 0,14 | **1** |

- **Durumların %90'ında (128/142) ekranda birden çok işaret var.**
- **En yoğun durum: 16 işaret** — 1 pad (12. Masa) + 15 masa noktası.
- **En yoğun tek salon (kamera vekili): 12 işaret** — salon 3.
- Sayı masa açıldıkça tek yönde büyüyor: 4 masa → 5 işaret · 8 masa → 9 · 12 masa → 13 · 16 → 16.
  Ancak masalar L4'e (₺ tavanı) çıkınca geri iniyor; yani kalabalık **kalıcı değil, orta-oyunun hâli**.

**Kadraj bunu doğruluyor** (`tekodak-salon3.png`): tek ekranda altı ayrı sarı halka, hepsinde aynı
kelime — **"Masa"** — ve altında farklı bir sayı. Alt bant *"Ocaktan çay al"* diyor; o hedefin
işareti kadrajda **yok**. D-038'in gerekçesindeki kullanıcı şikâyeti birebir bu:
*"görev metni altta bir şey diyor, ekran başka yeri gösteriyor."*

## 3. Dört kanaldan üçü ZATEN tek kaynakta

D-038 dört kanal sayıyor. Kodda:

| kanal | durum |
|---|---|
| alt bant metni | ✅ tek görevden (`HUD.tsx` · `questView`) |
| kamera odağı | ✅ tek görevden (`CamFocus` · `questFocusPos`) |
| ekran kenarı oku | ✅ tek görevden (`QuestPointer` → `screenPointer`) |
| **dünyadaki işaret** | ❌ **tek değil** — aktif adımın işareti diğerlerinden görsel olarak **ayırt edilemiyor** |

Aktif adımın işareti ile bir masa yükseltme noktası **aynı bileşen, aynı boy, aynı yazı ağırlığı**;
tek fark halka rengi (yeşil/mavi ↔ altın). Yani sorun "fazla nokta var" değil, **"hangisi ŞU ANKİ
adım belli değil"**.

## 4. Karar neden kullanıcıya soruluyor

D-038'in lafzı ("tek liste, yalnız aktif adım") **sonradan alınmış bir kullanıcı kararıyla
çelişiyor**: yükseltmeler obje-başı olacak ve **her masanın noktası kendi yanında duracak**
(My Hotel modeli). D-038'i harfiyen uygulamak o noktaları silmek demek. Kullanıcı bu çelişkiyi
zaten öngörmüştü: *"Faz 4'te onlarca yükseltme gelince saf-mekânsal kalabalıklaşırsa, objeye
dokununca açılan panel gibi bir hibrit düşünülebilir — ama temel akış mekânsal kalsın."*

## 5. KARAR (kullanıcı): nokta silinmez, SES katmanlanır — D-080

Kullanıcı **katman ayrımını** seçti. Nokta yerinde kalır (obje-başı yükseltme kuralı korunur),
görsel ağırlık üçe ayrılır:

| katman | görünüm | ne zaman |
|---|---|---|
| `aktif` | yazı + maliyet + TAM parlak halka + hafif nabız | aktif adımın ankrajı — **en fazla 1** |
| `konusan` | yazı + maliyet, nabız yok | oyuncu 3,2 br yakınında |
| `sessiz` | 0,55× küçük, **YAZISIZ** halka; dolum yayı durur | gerisi |

**Ölçülen sonuç: çizilen 16 → aynı anda KONUŞAN en çok 3** (ortalama 2,39), ve bunların en fazla
biri aktif. Sessiz noktaların dolum yayı korunur — kısmi dolum kaybolmaz.

### Yapısal kısım (asıl iş)
`src/game/activeStep.ts` açıldı. Singleton'ı Scene'in `QuestPointer`'ı **kenar okuyla AYNI
`questFocusPos` çağrısından** yazıyor → dördüncü kanal da öbür üçüyle tek kaynaktan besleniyor;
iki kanalın ayrı hesaplayıp ayrışması artık mümkün değil. `markerTier` saf fonksiyon (vitest
edilebilir), `GroundMarker` her karede onu çağırıp `useFrame` içinde damp'liyor — React'e
dokunmuyor (her kare setState = 60 render/sn olurdu).

### Bekçi — `tests/tek-odak.test.ts` (13 test)
1. `markerTier` davranışı: aktiflik MESAFEDEN değil aktif adımdan gelir (uzaktaki aktif adım da aktif).
2. **En fazla bir aktif**: ankrajlar pairwise ayrı. Tek kasıtlı istisna lavabo pad'i ↔ lavabo
   yükseltme noktası (aynı yerde, asla birlikte çizilmez) — onu ayrı bir bekçi tutuyor.
3. **Her işaretli görev hedefi TAM BİR ankraja oturur.** `questFocusPos` ile işaretlerin çizildiği
   yer ayrışırsa aktif işaret sessizce HİÇ yanmaz; korunan sessiz sapma budur.
4. Yakınlık bütçesi — tavan 4 (yürüyüşte ölçülen 3 + kümenin yanına düşebilecek 1 pad).

**Mutasyonla doğrulandı:** `SPEAK_RADIUS` 3,2 → 4,5 (bütçe bekçisi kırıldı) ve `questFocusPos`'un
`stationLevel` dalı `upgradeSpot` → `station` (ankraj bekçisi kırıldı). İkisi de geri alındı.

### Kareler
`docs/gorsel/ss/tekodak-once-plan|salon3|salon2.png` ↔ `tekodak-plan|salon3|salon2|aktif.png`
(`node tools/shot-tek-odak.mjs`, dev sunucusu açıkken).

### Donmayan sayılar (katman 3 — sunum)
`SPEAK_RADIUS` 3,20 · `SILENT_SCALE` 0,55 · nabız genliği 0,04 / 0,52 Hz · damp 14.
Eşik masa sütun aralığına (3,20) oturtuldu: iki masanın arasında durunca ikisi de konuşur
(seçim anı), üçüncüsü susar.

**Doğrulama:** vitest **476/476** (463 → +13) · smoke **28/28** · tsc + build temiz ·
dokunulan dosyalarda eslint temiz. **Hiçbir denge sayısı değişmedi.**

## Yan kazanç — bayat worktree silindi

`.claude/worktrees/maket-tasima` (merge edilmiş, silinmemiş) kaldırıldı. eslint tabanı
**122 ayrıştırma hatasından 19 gerçek lint hatasına** düştü (19'u da bu işten önce vardı).
