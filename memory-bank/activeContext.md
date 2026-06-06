# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz (2026-06-06)
Faz 0 + Faz 1 ✅. Faz 2: 2a ✅, 2b ✅, 2-UX (D-009) ✅, 2-EKO (D-010) ✅, 2c (D-011) ✅,
**2d-garson — OPSİYONEL garson pad + garson FSM (D-014) ✅ UYGULANDI.**
**Sıradaki: Faz 2d-harita — harita dengesi 1 ocak : 4 masa (D-012).**

Servis/personel/zone modeli kullanıcı onayıyla KİLİTLENDİ:
- **D-011** (servis) ✅, **D-012** (zone/salon + bölge-başı personel + **KASA YOK** + tuvalet=oda + para toplama kalıcı manuel),
  **D-013** (primitive = nihai sanat stili), **D-014** (garson = opsiyonel/omurgayı kilitlemeyen pad ✅).
  Tam tasarım: `docs/serving-and-automation.md`.

## En son ne yapıldı (bu oturum — 2d-garson, D-014)
- **Garson OPSİYONEL** (kullanıcı isteği): table2 sonrası "Garson Tut" pad'i gelir ama ZORUNLU değil —
  alınmazsa oyuncu masa açmaya devam eder, kendi gezerek servis eder.
- **Pad sistemi "omurga + opsiyonel" ayrıldı:** `currentPad` artık `optional` pad'leri ATLAR (omurga
  kilitlenmez); yeni `availableOptionalPads(g)`. PadDef'e `optional?:boolean`; `waiter` pad'i
  (₺150, optional, requires prev table2, effect `hireWaiter`).
- **Çoklu eş zamanlı dolum:** tek `padFill` sayısı → **`padFills` kaydı** (pad id → ₺). **SAVE_VERSION 4→5**
  + migrasyon (eski dolum aktif omurga pad'ine taşınır; `migrate` artık export). `hasWaiter` **persist**.
- **Garson FSM** (sadece hasWaiter): ocaktan tek tepsi (`config.waiter.trayCapacity`=1) → en yakın
  `waitingForTea` masaya götür → bırak (drinking) → boşta `LAYOUT.waiterHome`'a dön. `config.waiter.moveSpeed`=1.8
  (oyuncudan yavaş) = kısmi assist. `waiter` TRANSIENT (konum/tepsi), hasWaiter persist.
- Görsel: **Waiter.tsx** (yeşil kapsül + küçük tepsi), **Pad.tsx** omurga+opsiyonel render (opsiyonel mavi +
  Html etiket "Garson Tut ₺150"), Scene'e Waiter eklendi. devHooks: hasWaiter/waiterTray/waiterPos/optionalPads;
  padFill artık aktif omurga pad'inin dolumunu gösterir.
- Testler: **Vitest 20/20 ✅** (opsiyonel pad omurgayı kilitlemez, hireWaiter, garson kısmi-assist oyuncu uzakta,
  v4→v5 migrasyon), **smoke 15/15 ✅** (garson tut + assist), build temiz, sim **84sn** (ekonomi sabit).
- Değişen dosyalar: economy.config.ts, types.ts, store.ts, save.ts, devHooks.ts, Pad.tsx, Scene.tsx,
  **Waiter.tsx (yeni)**, tools/simulate.ts, tools/smoke.mjs, tests/logic.test.ts,
  memory-bank/decisions.md (D-014), progress.md, activeContext.md.
- **Henüz COMMIT EDİLMEDİ** — oturum-bitir bekliyor.

## TAM sıradaki adım (Faz 2d-harita — 1 ocak : 4 masa dengesi)
1. **LAYOUT yeniden düzen:** D-012 hedefi 1 ocak : 4 masa. Mevcut 2 ocak ([-2,-5]/[2,-5]) + 4 masa
   yerleşimini 1 ana ocağın 4 masaya yetişebileceği orana çek; `station2` pad'ini bu orana göre gözden geçir.
2. **padPos/seat/waiterHome/upgradeZone** pozisyonlarını yeni yerleşime uydur (çakışma yok, bounds içinde).
3. Garson + oyuncu servis mesafeleri yeni haritada makul mü doğrula (smoke teleport testleri geçmeli).
4. (Opsiyonel) simulate.ts'e gerçek servis-darboğazı modeli: oyuncu+garson cups/sn vs talep; tempo etkisini ölç.

## Sonraki dilimler (kilitli plan — docs/serving-and-automation.md §11)
- **2e:** Bardak/bulaşık döngüsü (bardak=ocak seviyesine bağlı L0~4 +2/lvl; kirli→topla→yıka) + bulaşıkçı + tepsi yükseltme.
- **Faz 3:** 3a salon genişleme (yeni salon + oto ocak/masa + personel slotu) · 3b tuvalet odası + temizlikçi · 3c menü (kahve/tost) + masa-yükseltme işlevi.

## Faydalı dev kancaları (konsol)
`__game()` (artık readyCups/tray/trayCap/waitingCount/stationPos/firstWaitingSeat de var),
`__advanceTime(60)`, `__addMoney(1000)`, `__upgradeStation()`, `__teleport(x,z)`, `__resetGame()`.
Servis testi: ocağa ışınla (`__game().stationPos`) → tick → tepsi dolar; bekleyen koltuğa ışınla
(`__game().firstWaitingSeat`) → tick → servis.

## Hızlı komutlar
- `npm run dev` · `npm run build` · `npm run test` · `npm run sim`
- Duman testi: `npm run dev` (ayrı) → `node tools/smoke.mjs`
