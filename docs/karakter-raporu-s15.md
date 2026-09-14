# Karakter raporu — S15 (müşteri skinned + üç görsel kusur)

**Tur:** S15 · **Tarih:** 2026-09-14 · **Kural:** `docs/oturum-akisi-mantik.md` (D-084)
**Ham çıktı:** `docs/olcum-yuruyus.json` · **Araç:** `tools/olcum-yuruyus.mjs` · `tools/skin-perf.html` (kol 3)
**Kareler:** `docs/gorsel/ss/s15-kafa-telafili.png` · `s15-kafa-telafisiz.png` · `s15-kafa-iki-govde.png`

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
2. **Personel ve müşteri için süzülme tamamen çözülür.** `Running_A` + hıza bağlı `timeScale`
   1,20-2,25 arası kalır; oluşan kadans 3,0-5,6 adım/sn — gerçek koşu bandı.
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

Gövde başına **6 sivil mesh, TEK materyal** → birleştirme tek çizime iner.

Ölçüm (`tools/skin-perf.mjs 24 Knight`, ANGLE/RTX 3060, 120 kare ortalaması):

| kol | ms/kare | çizim | üçgen |
|---|---:|---:|---:|
| instanced kapsül (bugün) | **0,04** | 1 | 6.240 |
| 24× skinned, 6 parça | 3,44 | 216 | 139.200 |
| 24× skinned, **BİRLEŞİK** | **1,01** | **24** | 139.200 |

**Birleştirmenin kazancı: çizim 216 → 24, kare süresi 3,44 → 1,01 ms (%71).** Üçgen sayısı
değişmiyor — birleştirme çizim çağrısını toplar, geometriyi azaltmaz.

**Açık risk:** 24 müşteri **139-160 bin üçgen** demek; bugünkü kapsül 6.240. Masaüstünde 1,01 ms,
mobilde tipik 4-6×. Bu sayı telefonda ölçülmedi (APK turu gerekir).

### Devreden bulgu (bu turda ölçüldü, kolun parçası değil)

**Rogue'un (bulaşıkçı) omzu 0,709** — blob sınırı 0,60'ı **bugün de aşıyor**, kafa koluna
bakılmaksızın. S14'ün "omuz 0,58, sınır aşılmıyor" satırı başka gövdeden alınmış. Ya sınır ya
gövde seçimi gözden geçmeli; bu turun kolu değil.

---

## §Karar

*(boş — karar paketi kullanıcıya sunulacak, D-084 adım 3)*

## §Uygulama

*(boş)*

## §Bekçi

*(boş)*
