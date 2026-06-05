# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz (2026-06-06)
Faz 0 + Faz 1 ✅. Faz 2: 2a ✅, 2b ✅, 2-UX (D-009) ✅, 2-EKO (D-010) ✅,
**2c — Manuel tepsi servisi (D-011) ✅ UYGULANDI.**
**Sıradaki: Faz 2d — bölge-başı garson + harita dengesi (1 ocak : 4 masa).**

Servis/personel/zone modeli kullanıcı onayıyla KİLİTLENDİ:
- **D-011** (servis) ✅, **D-012** (zone/salon + bölge-başı personel + **KASA YOK** + tuvalet=oda + para toplama kalıcı manuel),
  **D-013** (primitive = nihai sanat stili). Tam tasarım: `docs/serving-and-automation.md`.

## En son ne yapıldı (bu oturum — 2c)
- Çay artık OTOMATİK servis EDİLMEZ. NPC FSM `ordering` → **`waitingForTea`** + **sabır timer'ı**
  (`npc.patience`=18sn; aşınca sessizce `leaving`, ödeme yok → çocuk-güvenli).
- **Ocak hazır-kuyruğu:** `readyCups` + `brewProgress`; kapasite `brewQueueCapacity(level)`=3+1·level
  (config.brew). Kuyruk doluyken demleme durur.
- **Tepsi:** `tray` (kapasite `trayCapacity()`=config.serving.trayCapacityBase=2). Tick'te: ocak
  yakınında (pickupRadius 1.6) tepsi dolar; `waitingForTea` müşterinin koltuğu yakınında (serveRadius 1.6)
  tepsiden çay bırakılır → müşteri `drinking`.
- `tray/readyCups/brewProgress` **TRANSIENT** (kaydedilmez) → kalıcı şema değişmedi, **SAVE_VERSION 4**.
- Görsel: Player tepsi+bardak, TeaStation tezgâhta hazır çaylar (`readyCups` prop), Customers baloncuğu
  `waitingForTea`'ye bağlandı. HUD: 🫖 tepsi/kap + ☕ hazır. devHooks: readyCups/tray/trayCap/
  waitingCount/stationPos/firstWaitingSeat.
- Testler: **Vitest 15/15 ✅** (hazır-kuyruk cap, sabır-aşımı sessiz-gider, tam servis→ödeme→toplama),
  **smoke 12/12 ✅**, build temiz, simulate 84sn (ekonomi değişmedi).
- Değişen dosyalar: economy.config.ts, types.ts, store.ts, devHooks.ts, Player.tsx, TeaStation.tsx,
  Scene.tsx, Customers.tsx, HUD.tsx, tools/simulate.ts, tools/smoke.mjs, tests/logic.test.ts,
  docs/serving-and-automation.md, memory-bank/decisions.md, progress.md.
- **Henüz COMMIT EDİLMEDİ** — oturum-bitir bekliyor.

## TAM sıradaki adım (Faz 2d — bölge-başı garson + harita dengesi)
1. **Harita dengesi:** LAYOUT'u 1 ocak : 4 masa oranına çek (D-012). Mevcut 2 ocak/geniş alan
   yeniden düzenlenecek; pad pozisyonları yeni yerleşime uydurulacak.
2. **Garson FSM:** ocak→tepsi→en yakın `waitingForTea` masa→bırak→dön. Oyuncudan **yavaş** ve/veya
   **küçük tepsi** (config.waiter: speed, trayCapacity, requires). Tek garson büyüyen mekânı tek
   başına döndüremez (kısmi assist).
3. `hasWaiter` **persist** → SAVE_VERSION 4→5 + migrasyon. Garson bir pad'le açılır (prev:['table2'] sonrası).
4. devHooks: `hasWaiter`. Vitest + smoke: garson teslimi, kısmi-assist (oyuncu hâlâ gerekli).
5. simulate.ts'e garson hız/tepsi katkısını ekle (servis darboğazı modeli).

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
