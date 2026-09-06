# FPS BULGULARI — PC'de tam ekran kasması (2026-09-06, ölçümlü)

Kullanıcı semptomu: **"PC'de tam ekran oynarken hayvan gibi kasıyo."**
G1'de gölgenin kalkması kare süresinin bir kısmını çözmüştü (PC 1080p 2,02 → 1,44 ms) ama
şikâyet sürüyordu. Bu oturumda sorun **tahminle değil ölçümle** kapatıldı.

## Ölçüm düzeneği
Headless Chrome, **1920×1080**, tüm pad zinciri açık (3 salon · 12 masa · 14 NPC · ~64 coin yerde).
Üç ayrı metrik, çünkü hiçbiri tek başına yetmiyor:

| Metrik | Nasıl | Neyi ölçer |
|---|---|---|
| `gl.render` döngüsü (200 kare) | senkron çağrı | CPU'nun **çizim gönderme** maliyeti (GPU'yu DEĞİL) |
| `tick(0.016)` döngüsü (200 kare) | store'dan doğrudan | simülasyon CPU'su |
| rAF aralığı + `onCommitFiberRoot` sayacı | React DevTools kancası | **React'in kare başına iş yükü** |

> **Not (kalıcı):** `gl.render` döngüsü GPU'yu ölçmez — JS, GPU işi bitmeden döner. Bu yüzden
> `dpr` değiştirince bu sayı kıpırdamaz (ölçüldü: dpr 1 → 2'de 1,31 → 1,62 ms, tampon 4 kat).
> GPU tarafı ancak gerçek makinede görülür; bu yüzden fill-rate'e **ölçümle değil, üst sınır
> koyarak** yaklaşıldı (aşağıda §3).

## KÖK NEDEN — kare başına 3,2 React commit
`tick()` her karede bütün diziyi/nesneyi kopyalayıp **tek `set()`** ile yazıyordu. İçerik aynı
olsa bile referans değişiyor → Zustand seçicisi "değişti" sanıyor → abone bileşen render oluyor.

3 saniyelik ölçümde, kare başına **değişen** store anahtarları:

| Sadece KİMLİK değişti (içerik aynı) | Gerçekten değişti |
|---|---|
| `stationLevels` `tableLevels` `player` `dishwashers` `readyCupsByZone` `dishes` `upgradeFills` `tableUpgradeFills` `noticeQueue` `quest` `stats` (hepsi karelerin **%100'ünde**) · `waiters` %88 | `npcs` `coins` `waiters2` `brewProgressByZone` `spawnTimer` `saveTimer` `autoCollectToastCooldown` |

Sol sütun **tamamen boşa harcanan iş**: 12 masanın seviyesi değişmediği hâlde `Tables` her kare
yeniden render ediliyordu. Sağ sütun da bileşene GEREKMİYORDU — o değerler yalnız `useFrame`
içinde okunuyor, JSX'e girmiyor.

## Uygulanan üç düzeltme

### 1. Kimlik koruma (`keepIdentity`, `src/game/store.ts`)
`set()`'ten hemen önce, içeriği eskisiyle aynı olan değer **eski referansa** çevrilir
(sınırlı derinlikte karşılaştırma: dizi → aktör nesnesi → `pos` dizisi → sayı).
Maliyeti tek bir gereksiz React render'ından ucuz.

### 2. Her-kare-değişen veri React'ten çıkarıldı
- `Coins` · `Customers` · `Dishes`: liste artık abonelikle değil `useGame.getState()` ile
  useFrame içinde okunuyor (JSX'in listeyle işi yoktu — matrisler zaten useFrame'de yazılıyor).
  Coin toplama tespiti de `useEffect[coins]` yerine aynı useFrame'e taşındı.
- `Player` · `Waiter` · `Dishwasher`: **konum artık prop değil.** Yeni ortak kanca
  `useActorTransform` (`src/components/three/actorTransform.ts`, eski `useFacing`'in yerini alır)
  hem konumu hem yönü doğrudan three nesnesine yazar. React yalnız AYRIK değişimde çalışır
  (tepsi adedi, personelin var/yok olması) — bunun için string imzalı seçici kullanılır.

### 3. Çözünürlük bütçesi (`AdaptiveResolution`, `Scene.tsx`)
`dpr={[1,2]}` telefonda doğru ama PC'de **tam ekran + Windows ekran ölçeklemesi** (%125-150 çok
yaygın) arka tamponu 1920×1080 yerine 2400×1350 / 2880×1620 yapıyordu — aynı sahne için
**1,6-2,25 kat piksel**. Artık toplam piksel sayısına tavan var (`PIXEL_BUDGET = 2,3 M ≈ 1920×1200`):
küçük tuvalde (telefon, UI önizlemeleri) hiçbir şey değişmez; büyük tuvalde dpr 1'e kadar iner.
**1'in altına inmez** — bulanıklık görsel bir karardır, ölçüm kararı değil.

## SONUÇ (aynı sahne, aynı kadraj, 1920×1080)

| | Önce | Sonra |
|---|---|---|
| React commit / kare | **3,23** | **0,23** (14 kat az) |
| rAF kare süresi (ort.) | **10,24 ms** | **6,05 ms** (ekran tavanına dayandı) |
| rAF kare süresi (p95) | 16,30 ms | 6,80 ms |
| `tick()` maliyeti | 0,268 ms | **0,058 ms** (daha az/ucuz seçici) |
| `gl.render` gönderme | 1,35 ms | 1,40 ms (değişmedi — beklenen) |
| draw call | 190 | 196 (değişmedi — beklenen) |

Kare süresi artık headless ekranın 165 Hz tavanına dayandığı için gerçek taban daha da aşağıda;
ölçülebilen kısım **%41 azalma**. Kazanç tamamen CPU tarafında — yani zayıf CPU'lu makinede
(kullanıcının şikâyet ettiği durum) etkisi burada görünenden **daha büyük**.

## Doğrulama
`npm run test` **186/186** · `npx tsc --noEmit` temiz · `npx eslint src/` **13 hata — öncesiyle
BİREBİR aynı** (hepsi bu oturumdan önce vardı) · `tools/smoke.mjs` **8/15 — öncesiyle aynı,
regresyon yok** · Playwright'ta konsol **0 hata**; klavye hareketi, aktörlerin sahnedeki gerçek
konumu (store ile ±0,005 uyum) ve para toplama doğrulandı.

## Sıradaki şüpheliler (bu oturumda GEREK KALMADI)
1. **196 draw call / 281 mesh.** Sahnedeki duvar-zemin-dekor tek tek mesh. Statik geometrinin
   birleştirilmesi (merge) sayıyı ~30'a indirir. Modern masaüstü GPU'su için 196 sorun değil;
   telefon için Faz A/B'de bakılmalı.
2. **`antialias: true` + MeshStandardMaterial.** PBR fragment shader'ı entegre GPU'da pahalı.
   Çözünürlük bütçesi bunun etkisini zaten sınırlar; daha ileri gitmek görsel karar gerektirir.
