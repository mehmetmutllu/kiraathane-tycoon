# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz (2026-06-06)
Faz 0 + Faz 1 ✅. Responsive yön ✅. Faz 2: 2a ✅, 2b ✅, 2-UX (D-009) ✅,
**2-EKO Ekonomi v2 (D-010) ✅ UYGULANDI.** **Sıradaki: Faz 2c — yardımcı garson.**

## En son ne yapıldı (bu oturum — Ekonomi v2)
- **Fiyat→throughput:** `teaPrice(level)` KALDIRILDI. Coin değeri = sabit `TEA_PRICE` (5₺).
  stationLevel demleme süresini kısaltır (`brewTime`, `brewThroughputMult`) → çay/dk ↑.
- **Talep takibi:** `npc.spawnInterval` 4→1.6, boşalan koltuk hızla dolar (mekân hep dolu).
- **Gating:** config'e `Requires` + `requiresMet`; her pad'e ve `teaStation.upgradeRequires`'e
  önkoşul. `currentPad(GateState)` (eski `currentPad(padsDone)` imzası DEĞİŞTİ), yeni
  `upgradeZoneUnlocked`, `nextStep`. Zincir: 2.Masa(lifetime≥30) → ocak L≥1 → 3.Masa → 2.Ocak → Semaver.
- **HUD:** `nextStepLabel` (state'e eklendi, tick'te hesaplanıyor) → "👉 Sıradaki adım" rozeti.
- **simulate.ts** bottleneck modeline yeniden yazıldı (eski kırık array erişimi düzeldi);
  ilk alım 84sn, 3.masa ~4dk, otomasyon ~8dk.
- **Maliyetler (tempo):** table2=35, table3=120, station2=360, samovar=850; upgrade costGrowth 1.5.
- Testler: **Vitest 14/14 ✅, smoke 9/9 ✅, build temiz.** (Henüz COMMIT EDİLMEDİ — oturum-bitir bekliyor.)
- Değişen dosyalar: economy.config.ts, store.ts, devHooks.ts, Pad.tsx, Scene.tsx, HUD.tsx,
  index.css, tools/simulate.ts, tools/smoke.mjs, tests/logic.test.ts.

## ⚠️ Faz 2c YENİDEN TASARLANDI — servis sistemi önerisi (D-011, ONAY BEKLİYOR)
Kullanıcı (2026-06-06) eski "garson çayı otomatik taşır" planını eleştirdi; yeni öneri yazıldı:
`docs/serving-and-automation.md` + D-011 (TASLAK). **Kod YAZILMADI; sonraki oturumda kullanıcı
onayı alınıp uygulanacak.** Özet:
- Şu an garson yokken bile çay otomatik servis ediliyor — YANLIŞ. Oyuncu çayı kendi taşımalı.
- **Tepsi** mekaniği: ocaktan N çay al (kapasite upgradable), tek turda birçok masaya dağıt
  ("sürekli tek-tek taşıma" istenmiyor).
- **Ocak ready-kuyruğu** + müşteri **sabır timer'ı** → throughput zinciri SAHNEDE gerçek
  (D-010 §3.1'i tamamlar). Sabır aşınca müşteri sessizce gider (çocuk-güvenli).
- **Garson = kısmi assist:** yavaş/küçük tepsi; tek başına büyüyen mekânı döndüremez → oyuncu hâlâ aktif.
- **Para toplama + yükseltmeler kalıcı MANUEL** (çekirdek eğlence; aşırı otomasyon = "yürüyecek yer kalmaz").
- Uygulanırsa NPC FSM'e `waitingForTea`, ocağa `readyCups`, oyuncu/garsona `tray` eklenecek;
  saveVersion artır + migrasyon. Açık sorular doc §5'te — ÖNCE kullanıcıya sor.

## ÖNCE KULLANICIYA SOR (sonraki oturum açılışı)
D-011 açık soruları (doc §5): sabır cezası şiddeti · tepsi kapasite eğrisi · garson global mi
bölge-başı mı · otomatik toplayıcı hiç gelsin mi (öneri: erken-orta HAYIR) · ready-kuyruk upgradable mı.

## En son ne yapıldı
- Ortam doğrulandı, Playwright MCP eklendi, Vite + React 19 + R3F stack kuruldu.
- memory-bank + docs + economy.config.ts + simulate.ts + asset manifesti + CLAUDE.md + 2 skill.
- Faz 1 oyun kodu yazıldı: store (zustand + Decimal sim), sahne/oyuncu/istasyon/NPC/coin/pad,
  HUD, joystick, kayıt+offline, dev kancaları, fallback Model loader.
- Testler: Vitest 6/6 ✅, headless duman (tools/smoke.mjs) 6/6 ✅, build temiz, konsol temiz.

## ÖNEMLİ — Ekonomi v2 yeniden tasarımı (kullanıcı feedback'i 2026-06-05)
Kullanıcı mevcut ekonomiyi eleştirdi; **uygulamadan önce** tasarım raporu yazıldı:
`docs/progression-and-economy-v2.md` (Karar D-010). Özet:
- Yükseltme **fiyatı değil throughput'u (çay/dk)** artırır; gelir = darboğaz × fiyat.
- Tüm açılış/yükseltmeler **önkoşullu sıra (gating)** ile (`requires`).
- Pad: yükseltme objenin yanında, açılış objenin yerinde; her pad tek slota bağlı.
- Fiyat sabit taban (hacim-tabanlı). Maliyet eğrisi r≈1.12. Tempo: ilk alım <90sn.
**Sıradaki oturum:** ÖNCE bu ekonomi v2'yi uygula (config+store+gating+simulate+test),
SONRA Faz 2c (garson). Açık sorular raporun §5'inde — kullanıcıya sor.

## TAM sıradaki adım (Faz 2c — D-011 onayı + uygulama)
1. **ÖNCE** D-011 açık sorularını (yukarıda + doc §5) kullanıcıya sor, kararları kilitle.
2. economy.config'e `tray` (kapasite+upgrade), `brew.queueCapacity`, `npc.patience`, `waiter`
   (hız/tepsi/requires) ekle (data-driven).
3. store: NPC FSM'e `waitingForTea`; ocak `readyCups` kuyruğu + demleme timer'ı; oyuncu `tray`
   (ocakta dol, masada bırak — yakınlık). serviceSpeedMult artık demleme timer'ına değil
   üretim/teslimat hızlarına bağlanacak. saveVersion 4→5 + migrasyon.
4. Garson FSM (ocak→bekleyen masa→bırak→dön), yavaş/küçük tepsi; `hasWaiter` persist; bir pad'le açılır.
5. devHooks'a `tray`, `readyCups`, `hasWaiter`; Vitest + smoke (servis döngüsü, sabır-aşımı, garson teslimi).
6. Faz 2 (2a+2b+2-EKO+2c) bitince Faz 2'yi ✅ işaretle.

## Faydalı dev kancaları (konsol)
`__game()`, `__advanceTime(60)`, `__addMoney(1000)`, `__upgradeStation()`,
`__teleport(x,z)` (pad'e ışınla: padPos `__game().padPos`), `__resetGame()`.

## Açık sorular / kararlar
- Pad sistemi şu an tek-amaçlı (2. masa). Faz 2'de generic "pad listesi" yapısına
  refactor gerekecek (id, hedef, maliyet, fillRate, açılınca etki).
- Ekonomi tempo ilk satın alımda yavaş (~6dk); Faz 2 dengelemede config ayarlanacak.
- Asset stili Quaternius/Kenney (CC0) varsayıldı; bütçe gelirse Synty (Faz 6) onayla.
- AdMob Capacitor eklentisi Faz 5'te doğrulanacak.

## Hızlı komutlar
- `npm run dev` · `npm run build` · `npm run test` · `npm run sim`
- Duman testi: `npm run dev` (ayrı) → `node tools/smoke.mjs`
- Dev konsol: `__game()`, `__advanceTime(60)`, `__resetGame()`
