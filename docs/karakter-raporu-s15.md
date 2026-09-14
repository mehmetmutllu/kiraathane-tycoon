# Karakter raporu — S15 (müşteri skinned + üç görsel kusur)

**Tur:** S15 · **Tarih:** 2026-09-14 · **Kural:** `docs/oturum-akisi-mantik.md` (D-084)
**Ham çıktı:** `docs/olcum-yuruyus.json` · **Araç:** `tools/olcum-yuruyus.mjs` · `tools/skin-perf.html` (kol 3)
**Kareler:** `docs/gorsel/ss/s15-kafa-telafili.png` · `s15-kafa-telafisiz.png` · `s15-kafa-iki-govde.png` ·
`s15-oturus.png` · `s15-oturus-yakin.png` · `s15-oyun-genis.png` · `s15-oyun-yakin.png`

## Soru

Müşteriler skinned'e geçerken üç görsel kusur aynı turda kapanır: kafa/gövde oranı, yürüyüş ↔
ilerleme senkronu, sahibin kasketi. Hangi ölçek, hangi katsayı?

**Turu açan geri bildirim (kullanıcı, 2026-09-14):** "karakterler havada süzülüyor gibi, yürüme
efekti ile ilerleme senkron değil · ana karakterdeki kasketi çıkar · garsonlar falan küçülsün,
kafalar falan çok büyük duruyo baya küçült".

---

## §Bulgular

### S — SENKRON: "havada süzülme"nin sayısı

Bir yürüme klibi belli bir **yer hızı** için çizilir: basılı ayak gövde sabitken geriye kayar ve
kaydığı mesafe o döngünün ilerlemesidir. Klibin yazılı hızı = (döngüde basılı ayakların kat ettiği
yol) / süre. Karakter bundan hızlı giderse ayak kayar — "süzülme" budur.

**Kliplerin yazılı yer hızı** (ham rig birimi → `KAY_SCALE` 0,794 ile dünya birimi):

| klip | süre (sn) | döngü yolu | **dünya hızı (br/sn)** | kadans (adım/sn) | kök kayması |
|---|---:|---:|---:|---:|---:|
| Walking_A (bugün kullanılan) | 1,067 | 0,766 | **0,571** | 1,87 | 0 |
| Walking_B (taşıma) | 1,067 | 0,880 | 0,655 | 1,87 | 0 |
| Walking_C | 1,600 | 0,790 | 0,392 | 1,25 | 0 |
| Running_A | 0,800 | 1,257 | **1,247** | 2,50 | 0 |
| Running_B | 0,800 | 1,264 | 1,254 | 2,50 | 0 |

**Kök kayması beş klipte de 0** → klipler "yerinde"; `timeScale` ile senkronlamanın önünde engel yok.

**Oyunun hızları ve gereken `timeScale`** (bugün hepsi 1,00 — kusurun kaynağı):

| aktör | hız (br/sn) | Walking_A gerekli ts | oluşan kadans | Running_A gerekli ts | oluşan kadans |
|---|---:|---:|---:|---:|---:|
| garson k0 | 1,5 | 2,63 | 4,9 | **1,20** | 3,0 |
| garson k1 · bulaşıkçı k0 | 2,0 | 3,50 | 6,5 | **1,60** | 4,0 |
| müşteri | 2,6 | 4,55 | 8,5 | **2,09** | 5,2 |
| bulaşıkçı k2 | 2,8 | 4,90 | 9,2 | **2,25** | 5,6 |
| oyuncu k0 | 4,5 | 7,88 | 14,7 | 3,61 | 9,0 |
| oyuncu k3 | 5,4 | 9,46 | 17,7 | 4,33 | 10,8 |

Gerçek insan kadansı: yürüyüş ~2,0 · koşu ~2,8 · **sprint ~4,5 adım/sn**. Üstü bacak değil pervane.

**Okuma:**
1. **Bugün `Walking_A` timeScale 1'de çalıyor.** Oyuncu 4,5-5,4 br/sn gidiyor, klip 0,571 için
   çizilmiş → **ayak 7,9-9,5 katı kayıyor.** Kullanıcının gördüğü tam olarak budur.
2. **Personel ve müşteride süzülme pratik olarak biter.** `Running_A` + hıza bağlı `timeScale`
   1,20-2,25 arası ister. Kelepçe 1,80'de durduğu için garsonda (1,5 ve 2,0 br/sn) kayma TAM
   sıfırlanır; **müşteri (2,6) ve bulaşıkçı kademe 2 (2,8) kelepçeye çarpar** ve geriye
   1,16× ile 1,25× artık kayma kalır — bugünkü 4,6× ve 4,9×'a göre görünmez mertebede.
   (Karar paketinde "tamamen biter" demiştim; kelepçe uygulanınca bu iki aktörde tam değil.)
3. **Oyuncuda çözülmez.** Hızı (4,5-5,4) klibin taşıyabileceğinin iki katı. Sprint kadansına
   kelepçelenirse (`timeScale` tavan 1,80) klip 2,24 br/sn taşır → **2,0× artık kayma kalır.**
   Bugünkü 7,9×'a göre dörtte bire iner ama sıfırlanmaz.

**Kelepçe tablosu** (tavan = sprint kadansı 4,5 adım/sn):

| klip | tavan timeScale | tavanda taşınan hız | oyuncu 4,5'te kalan kayma |
|---|---:|---:|---:|
| Running_A | 1,80 | 2,24 br/sn | **2,01×** |
| Walking_A | 2,41 | 1,37 br/sn | 3,28× |

Oyuncunun kaymasını sıfırlamanın tek yolu **hızı düşürmek** — o `economy.config.ts`'e dokunur,
varyant kapısına tabidir ve bu turda ölçülmedi (kendi turu gerekir).

### K — KAFA: baş payı ve iki alt kol

KayKit başı gövde boyunun **%42-52**'si (poz uygulanmış, ekipman gizli, tarayıcıda skinned ölçüm).
Bugünkü ilkel gövdede **%33**'tü. Kullanıcının gördüğü fark bu.

Baş `head` KEMİĞİ ölçeklenir. İki alt kol ve aradaki takas:

**K-A TELAFİLİ — toplam boy 1,75'te kalır** (`docs/gorsel/ss/s15-kafa-telafili.png`):

| kafa ölçeği | boy | baş payı | **omuz** | blob (sınır 0,60) |
|---|---:|---:|---:|---|
| ×1,00 (bugün) | 1,75 | %42,3 | 0,552 | ✓ |
| ×0,90 | 1,75 | %40,2 | 0,582 | ✓ |
| ×0,80 | 1,75 | %37,8 | 0,616 | **✗ aşıyor** |
| ×0,70 | 1,75 | %35,1 | 0,653 | **✗** |
| ×0,60 | 1,75 | %32,0 | 0,696 | **✗** |

Baş küçülünce gövde o boyu doldurmak için büyüyor: karakter tıknazlaşıyor, **×0,80'den itibaren
D-076'nın blob kuralı kırılıyor.** Karede kardan adam siluetine dönüyor.

**K-B TELAFİSİZ — gövde ölçeği sabit, karakter kısalır** (`s15-kafa-telafisiz.png`):

| kafa ölçeği | boy | baş payı | omuz | blob |
|---|---:|---:|---:|---|
| ×1,00 (bugün) | 1,75 | %42,3 | 0,552 | ✓ |
| ×0,90 | 1,66 | %40,2 | 0,552 | ✓ |
| ×0,80 | 1,57 | %37,8 | 0,552 | ✓ |
| ×0,70 | 1,48 | %35,1 | 0,552 | ✓ |
| ×0,60 | 1,39 | %32,0 | 0,552 | ✓ |

**Kritik okuma — telafisiz kolun mobilya bedeli ARİTMETİK, GÖRSEL DEĞİL.** Gövde ölçeği hiç
değişmiyor (omuz beş kolda da 0,552): bacak, gövde, kalça ve dolayısıyla **masa/tabure ile
gövdenin ilişkisi birebir aynı kalıyor.** Değişen tek şey siluetin tepesi. Aşağıdaki Ö tablosunda
"masa % yükseliyor" satırı bu koldan geçildiğinde gerçek bir bozulma anlatmıyor — payda kısalan
kafadan küçülüyor, mobilya karakterin gövdesine göre yerinde duruyor.

**Gövdeler arası fark büyük** (`s15-kafa-iki-govde.png`): Knight ×1'de baş %42,3 · Rogue ×1'de
**%52,3** (saç hacmi). Tek küresel kafa ölçeği her gövdede farklı sonuç verir; Rogue ×0,70'te
ancak Knight ×1,00'in payına (%42) iniyor.

### Ö — BOY: ACTOR_HEIGHT adayları

| boy | masa % (gerçek %43) | sapma | tabure % (gerçek %26) | sapma | KayKit ölçek | SEATED_DROP | playerRadius |
|---:|---:|---:|---:|---:|---:|---:|---:|
| **1,75** (bugün, D-076) | 45,4 | +6,0 | 25,7 | 0,0 | 0,794 | −0,45 | 0,47 |
| 1,65 | 48,2 | +12,4 | 27,3 | +6,1 | 0,749 | −0,35 | 0,45 |
| 1,60 | 49,7 | +15,9 | 28,1 | +9,4 | 0,726 | −0,30 | 0,43 |
| 1,50 | 53,0 | +23,7 | 30,0 | +16,7 | 0,681 | −0,20 | 0,41 |
| 1,40 | 56,8 | +32,5 | 32,1 | +25,0 | 0,635 | −0,10 | 0,38 |

**Okuma: gövdeyi kısaltmak mobilya oranını GERÇEKTEN bozar** (K-B'nin aritmetik bozulmasından
farklı olarak burada gövde de küçülüyor). 1,75 bugün gerçek orandan +%6 sapıyor; 1,60'ta +%16,
1,50'de +%24. `feedback_reference_scale_trap`'in uyardığı tuzak birebir bu yön. Ayrıca bu kol
`SEATED_DROP`, `PLAYER_RADIUS`, `BUBBLE_Y`, `CAMERA_LOOK_Y` ve nav ızgarasını birlikte oynatır.

### Ç — ÇİZİM: müşteri skinned'e geçerse bedel

Gövde başına **6 sivil mesh, TEK materyal**. İlk okuma "hepsi tek çizime iner" dedi;
**uygulamada çakıştı ve kol düzeltildi** (aşağıda).

#### Ölçüm kolu ile SEVK EDİLEN biçim neden farklı

Tek materyal, başı boyamamakla bağdaşmıyor. Oyunun kuralı (D-112) başın dokusunu korumak
— yüz, saç ve sakal oradan geliyor — kıyafeti ise düz boyamak. Tek materyal ikisini birden
yapamaz: ya doku herkese uygulanır ya kimseye. Sevk edilen biçim bu yüzden **gövde başına iki
mesh**: baş dokulu materyalini korur, kol+gövde+bacak tek geometriye kaynar ve rengini
**köşe renginden** alır (gömlek ve pantolon aynı mesh'te, ayrı renkte).

Ölçüm (`tools/skin-perf.mjs`, ANGLE/RTX 3060, 120 kare ortalaması):

| müşteri | kol | ms/kare | çizim | üçgen |
|---:|---|---:|---:|---:|
| 24 | instanced kapsül (bugün) | 0,04 | 1 | 6.240 |
| 24 | skinned, 6 parça | 1,78 | 216 | 139.200 |
| 24 | skinned, **baş+gövde (sevk)** | **0,52** | **48** | 139.200 |
| 48 | skinned, baş+gövde | **1,00** | 96 | 278.400 |
| 80 | skinned, baş+gövde | **1,57** | 112 | 324.800 |

**Birleştirmenin kazancı %71** (çizim 216 → 48). Üçgen sayısı değişmiyor — birleştirme çizim
çağrısını toplar, geometriyi azaltmaz. 80 müşteride çizim 160 değil 112: frustum culling devrede.

**MUTLAK ms KOŞULAR ARASI OYNUYOR** — "6 parça" kolu iki koşuda 3,44 ve 1,78 ms verdi (sürücü
durumu/termal). **Oran ikisinde de aynı (%71).** Bu sayılar kol karşılaştırmasıdır, mobil
öngörüsü değil; telefonda ölçülmedi (APK turu gerekir).

#### Bütçe oyunda ölçüldü

`NPC_SKIN_CAP` önce 24 seçildi. Oyun içinde ölçünce yanlış çıktı: **yalnız 12 masa açıkken 38
eşzamanlı müşteri** vardı ve tavanı aşanlar kapsül olarak duruyordu — salonda karakterlerle
kapsüller yan yana (`docs/gorsel/ss/s15-oyun-genis.png` ilk sürümü). Tavan **48**'e çekildi;
ölçülen durumu paylı kapsıyor ve yeni karede kapsül kalmadı.

İkinci tur (kullanıcı, aynı gün): **tavan 80** — *"kapsül hiç görünmesin"*. 24 masa tam açıkken
müşteri 70'i geçebiliyor; 80 o tepenin üstünde kalır. Bedeli **1,57 ms / 112 çizim**. Kapsül kolu
silinmedi: tavan bir gün aşılırsa müşteri sessizce kaybolmasın, kapsüle düşsün.

### Oturuş çapası — `SEATED_DROP`un skinned karşılığı

Bugünkü `SEATED_DROP` (−0,45) bir NUMARAydı: kapsül oturamadığı için gövde aşağı indiriliyordu.
Gerçek `Sit_Chair_Idle` klibinde gövde zaten oturuyor.

| klip | kalça (ham) | kalça (dünya) | ayak (dünya) | kök kaldırma (0,45 için) |
|---|---:|---:|---:|---:|
| Sit_Chair_Idle | 0,481 | 0,382 | 0,322 | **+0,068** |
| Sit_Chair_Down | 0,457 | 0,363 | 0,241 | +0,087 |
| Sit_Chair_StandUp | 0,434 | 0,344 | 0,192 | +0,106 |

**Ölçüm yöntemi uyarısı:** bu rig'de `hips`/`head` kemikleri anatomik yerlerinde DEĞİL (baş kemiği
boyun değil, baş mesh'inin tabanında; `hips` kalça değil, ona yakın alt bir düğüm). Kemikten
türetilen ilk sayı bu yüzden yanıltıcıydı; kabul, kareyle verildi
(`docs/gorsel/ss/s15-oturus-yakin.png`) — +0,068'de kalça taburenin oturağına oturuyor.

### Devreden bulgu (bu turda ölçüldü, kolun parçası değil)

**Rogue'un (bulaşıkçı) omzu 0,709** — blob sınırı 0,60'ı **bugün de aşıyor**, kafa koluna
bakılmaksızın. S14'ün "omuz 0,58, sınır aşılmıyor" satırı başka gövdeden alınmış. Ya sınır ya
gövde seçimi gözden geçmeli; bu turun kolu değil.

---

## §Karar — D-113 (kullanıcı, 2026-09-14)

Karar paketi: https://claude.ai/code/artifact/1cad1b62-df57-4ffb-b00b-32f0b9be9565
Dört kolda da önerilen kol seçildi.

| kol | seçim | gerekçe |
|---|---|---|
| **K** kafa | **K-B telafisiz ×0,75** | baş payı %42 → ~%36, siluet ~1,52; omuz 0,552'de kalır, blob sağlam, mobilya ilişkisi aynı. Kullanıcının iki isteğini (kafa küçülsün + karakterler küçülsün) tek hamlede karşılar. |
| **S** senkron | **S3** | klip hızdan seçilir, katsayı hızdan türer, tavan 1,80 (sprint kadansı). |
| **Ö** boy | **Ö1 — dokunma** | 1,75 kalır; gövdeyi kısaltmak mobilya oranını gerçekten bozar ve K-B "küçülsün"ü bedavaya verir. |
| **Ç** müşteri | **Ç2 birleşik skinned** | çizim toplanır; bütçe ölçülür. |
| kasket | **yalnız sahipten kalkar** | mutfak elemanının kasketi usta kimliğini taşıyor. |

## §Uygulama

- `src/config/actor.ts` — `KAY_KAFA_OLCEK` 0,75 · `KLIP_HIZI` (ölçüm sayıları) · `TIMESCALE_TAVAN`
  1,80 / `TABAN` 0,60 · `KAY_OTURMA_KALDIRMA` +0,068 · `NPC_SKIN_CAP` 48 · `KAY_MUSTERI_GOVDE` ·
  `KAY_KIYAFET.owner.kasket` → false.
- `src/components/three/KayActor.tsx` — `kafaKucult()` (kıyafetten ÖNCE) · `head.scale` izinin
  sökülmesi · `lokomosyonSec()` + `LOKOMOSYON` aday tabloları · `useFrame`'de klip seçimi ve
  her kare `timeScale` yazımı · paylaşılan yardımcıların dışa açılması.
- `src/components/three/Customers.tsx` — instanced kapsülden **skinned havuza**: 48 yuva, gövde
  başına iki mesh (baş dokulu + gövde köşe renkli), kendi mixer'ı, gerçek oturuş klibi, WC sönmesi,
  tavanı aşan müşteri için kapsül kolu korunur.
- `tools/olcum-yuruyus.mjs` (yeni) · `tools/skin-perf.html` (sevk biçimi kolu) ·
  `tools/karakter-bak.html` (kafa kolu, telafili/telafisiz) · `tools/shot-s15.mjs` ·
  `tools/mutasyon-s15.mjs`.

### Uygulamada ortaya çıkan ve ÖLÇÜMÜ DEĞİŞTİREN iki şey

1. **Tek materyal kolu bölündü** — başın dokusunu korumak tek çizimle bağdaşmadı; sevk biçimi
   gövde başına iki mesh (48 çizim / 0,52 ms). Yukarıda §Ç'de yeniden ölçüldü.
2. **`NPC_SKIN_CAP` 24 → 48** — oyunda ölçülünce 12 masada bile 38 eşzamanlı müşteri çıktı ve
   24'lük tavanı aşanlar kapsül olarak görünüyordu.

## §Bekçi

`tests/karakter-senkron.test.ts` — **23 denetim**, `tools/mutasyon-s15.mjs` ile **21 mutasyonla**
doğrulandı, **kaçan 0**.

Yakaladığı mutasyonlar: klip hızının elle ayarlanması · koşu hızının bozulması · kelepçe tavanının
gevşetilmesi · tabanın kaldırılması · kafa ölçeğinin etkisizleştirilmesi · ölçeğin kafayı TELAFİ
etmesi · sahibin kasketinin geri gelmesi · önlüğün düşmesi · bütçenin eski tavana dönmesi ·
oturuş kaldırmasının kapsül numarasına dönmesi · koşu klibinin aday listesinden çıkması ·
`head` ölçek izinin sökülmemesi · kafanın kıyafetten SONRA küçültülmesi · katsayının yalnız klip
değişince yazılması · müşteri havuzunun her render kurulması · gömlek renginin müşteriden
alınmaması · başın gövde materyaliyle boyanması · oturan müşteriye kapsül numarasının uygulanması · **oturan müşterinin masaya dönmemesi** ·
**oturuş yönünün hareket yönüne yenilmesi** · **yuva devrinde açının snap etmemesi**.

**Final tam koşu:** `tsc -b` ✓ · vitest **966 ✓** (40 dosya) · `npm run duman` **42/42 ✓** ·
`npm run sira` ✓ · oyun içi kare `docs/gorsel/ss/s15-oyun-genis.png` (38 müşteri, kapsül yok).

## §İkinci tur (kullanıcı geri bildirimi, aynı gün)

1. **Tavan 80** — *"kapsül hiç görünmesin"*. `NPC_SKIN_CAP` 48 → 80 (1,57 ms / 112 çizim).
2. **Oturan müşteri masaya dönmüyordu** — *"oturmalar sıkıntı, masaya dönük değiller"*. Yön
   HAREKETTEN türüyordu; müşteri oturunca hareket bitiyor ve **geldiği yöne bakakalıyordu**.
   Koltuk masanın çevresinde herhangi bir yönde olabildiği için sabit açı işe yaramaz: yön artık
   koltuktan **masa merkezine** bakar (`LAYOUT.tables[i].table`). Ayrıca yuva el değiştirince açı
   SNAP ediyor — yeni müşteri önceki müşterinin yönünden dönerek gelmiyor.
   Kare: `docs/gorsel/ss/s15-oturus-yakin.png`.

## §Açık kalemler (bu turdan devreden)

- ~~Geç oyunda tavan yine aşılabilir.~~ **KAPANDI (kullanıcı, aynı gün):** tavan **80** —
  "kapsül hiç görünmesin". Bedeli 1,57 ms/kare. Kapsül kolu yine de silinmedi: tavan bir gün
  aşılırsa müşteri kaybolmasın, kapsüle düşsün.
- **Oyuncuda 2,0× artık kayma.** Sıfırlamanın tek yolu oyuncu hızını düşürmek — DENGE, varyant
  kapısına tabi, ölçülmedi.
- **Rogue'un omzu 0,709** — blob sınırı 0,60'ı bugün de aşıyor (S14'ün 0,58'i başka gövdeden).
- **Karakter paneli hâlâ eski ilkel gövdeyi çiziyor** (S14'ten devreden, bu turda dokunulmadı).
