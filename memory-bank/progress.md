# progress — Faz Takibi

Durum: ✅ bitti · 🔧 devam · ⏳ bekliyor

## Faz 0 — Planlama ✅
- ✅ Ortam doğrulama (node/git/gh/auth), Playwright MCP eklendi
- ✅ memory-bank/ (projectBrief, architecture, progress, activeContext, decisions)
- ✅ docs/gameDesign.md, economy.md, monetization.md, assets.md
- ✅ src/config/economy.config.ts (data-driven, tek sayı kaynağı)
- ✅ tools/simulate.ts (ekonomi curve simülasyonu)
- ✅ public/assets/README.md (manifest + lisans)
- ✅ CLAUDE.md (kurallar + oturum protokolü)
- ✅ .claude/skills/kiraathane-devam, oturum-bitir

## Faz 1 — 3D greybox dikey kesit ✅
- ✅ Sahne + ışık + gölge + yumuşak takip kamerası + duvarlar (Scene.tsx)
- ✅ Kontrol edilebilir sahip (altın kapsül, joystick + WASD/ok tuşları)
- ✅ 1 çay istasyonu (tezgah + semaver greybox)
- ✅ NPC akışı (gel→masaya yürü→sipariş timer→iç→öde→para düşür→çık)
- ✅ Karakterle para toplama (yakınlık) → cüzdan (Decimal)
- ✅ 1 satın-alma pad'i (üstünde dur→cüzdandan dolar→dolunca 2. masa açılır)
- ✅ Kayıt (localStorage + saveVersion 3 + migrasyon) + offline gelir (tavan 2sa)
- ✅ window.__game + window.__advanceTime(sn) + window.__resetGame dev kancaları
- ✅ HUD (₺, 💎, masa, pad ilerleme, offline kazanç bildirimi)
- ✅ Vitest mantık testleri (6/6 geçti): upgrade curve, fmt, NPC döngüsü, toplama, pad
- ✅ Headless tarayıcı duman testi (tools/smoke.mjs, 6/6): render+konsol temiz, klavye,
     NPC akışı, para düşme. (Playwright MCP bu oturumda eklendi; sonraki oturumda aktif.)
- **Bilinen buglar/notlar:**
  - Bundle ~1.17MB (three.js) — Faz 7'de kod-bölme/optimizasyon.
  - Ekonomi tempo: ilk satın alma simülasyonda ~6 dk (hedef 20-40sn'den yavaş) —
    Faz 2/4 dengelemede economy.config ayarlanacak.
  - Çay servisi Faz 1'de timer ile otomatik; manuel taşıma Faz 2 (garson) ile gelecek.
- ✅ Responsive ekran yönü: portrait birincil + landscape destekli (kamera oran-uyumlu,
     safe-area + orientation CSS); smoke 7/7. (Karar D-008.)
- **Sıradaki kilometre taşı:** Faz 2 — yardımcı garson + çaydanlık yükseltme seviyeleri
  + semaver/yeni çaydanlık yeri pad'leri.

## Faz 2 — Mutfak + garson 🔧
- ✅ **2a:** Çay istasyonu yükseltme L1-L4 (₺). (NOT: UI butonu D-009 ile **mekânsal
     yükseltme noktasına** çevrildi — aşağı bak.) Çay değeri seviyeyle çarpan artar.
     L5 (Usta 💎/video) Faz 4.
- ✅ **2b:** Generic pad sistemi. Tek-amaçlı pad → config'te sıralı **pad listesi**
     (id/label/cost/fillRate/effect). Pad'ler: 2. Masa (addTable), Yeni Çaydanlık Yeri
     (addTableStation: +masa & +istasyon, 2. istasyon çizilir), Semavere Geçiş
     (serviceSpeed ×0.7 = daha hızlı servis). State: stations/serviceSpeedMult/padsDone;
     kayıt v3→v4 migrasyonu (eski tables≥2 → table2 done). __teleport dev kancası.
     Vitest 9/9, smoke 9/9 (tarayıcıda table2 pad'i açıldı).
- ✅ **2-UX (D-009):** Mekânsal etkileşim. Pad'ler açtıkları objenin yerinde (2.masa,
     3.masa, yeni ocak, semaver — her biri kendi konumunda). Çay yükseltme = ocağın
     önünde **upgradeZone**; üstünde dur → alt-orta barı dolar → seviye artar (havada buton
     yok). Ocak seviyesi 3D rozet (drei Html) + semaver büyümesi/renk ile görünür. Pad set
     güncellendi (table2/table3/station2/samovar); addStation servis hızını ×0.85 hızlandırır.
     Vitest 10/10, smoke 9/9.
- ✅ **2-EKO (D-010):** Ekonomi v2 UYGULANDI. Çay fiyatı SABİT (basePrice 5₺); stationLevel
     artık throughput'u (demleme süresini kısaltır = çay/dk ↑) artırır, FİYATI değil. Coin
     değeri = TEA_PRICE sabit. Talep kapasiteyi takip eder (spawnInterval 1.6 → mekân hep dolu).
     Gating: `Requires` (prev/minTables/minStationLevel/minLifetime) + `requiresMet`; pad'ler ve
     yükseltme zone'u gate'li (zincir: 2.Masa[lifetime≥30] → ocak L≥1 → 3.Masa → 2.Ocak →
     Semaver). `currentPad(GateState)`, `upgradeZoneUnlocked`, `nextStep` HUD rehberi. simulate.ts
     bottleneck modeline yeniden yazıldı: ilk alım **84sn (<90 hedef ✓)**, otomasyon ~8dk.
     Vitest 14/14, smoke 9/9, build temiz. (Maliyetler: table2=35, table3=120, station2=360,
     samovar=850; costGrowth 1.5.)
- ✅ **2c (D-011):** Manuel tepsi servisi. Çay artık OTO servis EDİLMEZ. NPC FSM: `ordering` →
     `waitingForTea` + **sabır timer'ı** (18sn, aşınca sessizce gider, ödeme yok). Ocak **hazır-kuyruğu**
     (`readyCups`+`brewProgress`, kapasite `brewQueueCapacity(level)`=3+level; dolunca demleme durur).
     Oyuncu **tepsi** (`tray`, kapasite 2; ocakta dol — yakınlık, bekleyen masaya bırak — yakınlık).
     `tray/readyCups/brewProgress` **transient** → kalıcı şema değişmedi, **SAVE_VERSION 4'te kaldı**.
     Görsel: oyuncu elinde tepsi+bardaklar, ocak tezgâhında hazır çaylar, bekleyen müşteri baloncuğu.
     HUD: 🫖 tepsi/kapasite + ☕ hazır çay. devHooks: readyCups/tray/trayCap/waitingCount/stationPos/
     firstWaitingSeat. Vitest **15/15**, smoke **12/12** (demle→tepsi→servis→ödeme→toplama), build temiz, sim 84sn.
- ✅ **2d-garson (D-014):** Garson **OPSİYONEL** pad (omurgayı kilitlemez). Pad sistemi "omurga +
     opsiyonel" ayrıldı: `currentPad` opsiyonelleri atlar, `availableOptionalPads` ayrı döner; tek
     `padFill` → **`padFills` kaydı** (eş zamanlı dolum), **SAVE_VERSION 4→5 + migrasyon** (eski dolum
     aktif omurga pad'ine taşınır). `waiter` pad'i (₺150, optional, requires prev table2, effect
     hireWaiter). `hasWaiter` **persist**. Garson FSM: ocaktan tek tepsi (config.waiter trayCapacity 1)
     → en yakın `waitingForTea` masaya götür → bırak → boşta personel köşesine dön; oyuncudan yavaş
     (moveSpeed 1.8) = kısmi assist. Render: Waiter.tsx (yeşil kapsül + tepsi), Pad.tsx omurga+opsiyonel
     (opsiyonel mavi + Html etiket). devHooks: hasWaiter/waiterTray/waiterPos/optionalPads. Vitest **20/20**,
     smoke **15/15** (garson tut + kısmi-assist: oyuncu uzakta coins↑), build temiz, sim 84sn (ekonomi sabit).
- ✅ **2d-harita (D-012):** Başlangıç salonu **1 ocak : 4 masa**'ya çekildi. Omurga pad zinciri:
     2.Masa → (ocak L≥1) → 3.Masa → **4.Masa (YENİ, addTable)** → Semaver; **`station2` omurgadan ÇIKARILDI**
     (Faz 3a'da yeni salonla otomatik gelir; `addStation` effect tipi & store/sim case'leri kaldırıldı, ölü kod yok).
     LAYOUT: tek ana ocak `[0,0,-5]`, 4 masa 2×2 derli toplu (x ±2.5), padPos/seat/upgradeZone/samovar/waiterHome
     yeni yerleşime uydu (semaver sağ-ön, upgradeZone sol-ön → çakışmaz). **SAVE_VERSION 5→6 + migrasyon**
     (station2 padsDone/padFills'ten çıkar, stations→1 kelepçe, init'te de savunmacı `min(stations, LAYOUT.stations.length)`).
     Maliyetler: table4=300 (fillRate 75); samovar 850 sabit. **Vitest 22/22, build temiz, sim ilk-alım 84sn,
     smoke 15/15** (tek-ocak yerleşiminde servis+garson assist+yükseltme L0→L4). Değişen: economy.config.ts, store.ts,
     save.ts, tools/simulate.ts, tests/logic.test.ts (smoke.mjs veri-güdümlü → değişmedi).
- ✅ **2d-garson anti-starvation:** Garson teslimat hedefi "en yakın" → **"en acil" (sabrı en az kalan = en düşük
     `timer`)**; eşitlikte en yakın. Ön masalar sürekli dolsa da arka masalar açlıktan ölmüyor (sabır timer'ları aynı
     hızda aktığından pratikte kararlı FIFO, salınım yok). Garson hız/tepsi limiti değişmedi → D-014 "partial assist"
     korunur. Yalnız `store.ts` garson bloğunda hedef seçimi değişti; anti-starvation vitest eklendi (yakın-ama-bol-sabır
     masa atlanır, uzak-acil masaya yönelir). **Vitest 26/26, build temiz, smoke 15/15.**
- 🐛→✅ **2d-harita çakışma düzeltmesi:** Eski kayıtta `tables=4` ama yeni `table4` "açılmamış" sayılınca,
     `table4` pad'i çizili 4. masayla **TAM aynı konumda** ([2.5,0,1.2]) çakışıyordu (gating sadece `prev:table3`'e
     bakıyordu, masa sayısına değil). Migration v5→v6'ya: `addTable` pad'lerini mevcut masa sayısıyla **senkronla**
     (i. addTable = (i+2). masa; masa zaten çiziliyse pad'i `padsDone`'a ekle → bir daha belirmez). Geçici playwright
     tanı scripti (tools/check-migration.mjs) ile A/B/C senaryoları doğrulandı, sonra silindi; kalıcı vitest testi eklendi.
- ✅ **D-015 (UYGULANDI):** State tek-doğru-kaynaktan türetme refactor'ı. `tables/stations/serviceSpeedMult/
     hasWaiter` artık ayrı saklanmıyor; `economy.config.ts` saf `derivedFromPads(padsDone)` ile türetilir →
     masa+pad çakışması gibi desenkronizasyon açıkları YAPISAL kapandı (v6/v7 patch'lerinin kök çözümü).
     **store:** init+tick `derivedFromPads`'ten okur; pad açılınca SADECE `padsDone` büyür, tick'teki `tables++`/
     `serviceSpeedMult*=`/`hasWaiter=true` mutasyonları kalktı; garson varlığı türetilen `hasWaiter`'dan kurulur.
     **save:** SaveData'dan 4 türetilen alan çıkarıldı (kayıt küçüldü, çelişki imkansız); migrate gevşek `d` kaydı
     üstünde sadeleşti; **SAVE_VERSION 7→8** + v7→v8 (eski `hasWaiter:true` → padsDone'a `waiter`). **simulate.ts**
     de türetmeyi kullanır (ekonomi SABİT: ilk alım 84sn, table4 @7.5dk, semaver 14.9dk). **Testler:** çelişen
     sahte `tables/hasWaiter` alanları türetmeye SIZAMAZ + store pad açıldıkça daima tutarlı (desenkronizasyon
     üretilemez) testleri eklendi. **Vitest 25/25, build temiz, sim 84sn, smoke 15/15.** Değişen: economy.config.ts,
     store.ts, save.ts, tools/simulate.ts, tests/logic.test.ts.
- ⏳ **2e:** Bardak/bulaşık döngüsü (bardak=ocak seviyesine bağlı, kirli→yıka) + bulaşıkçı + tepsi yükseltme.

## Faz 3 — My-Hotel zone & roller ⏳ (D-012 ile yeniden çerçevelendi)
- ⏳ **3a:** Salon (zone) genişleme: salon dol → yeni salon + oto 1.ocak/1.masa + personel slotları.
- ⏳ **3b:** Tuvalet ODASI (parayla açılır) + tuvalet kâğıdı yenileme + temizlikçi.
- ⏳ **3c:** Menü çeşitliliği (kahve/tost) + masa-yükseltme işlevi (sabır/imaj). Okey/tavla/nargile sonra.
- NOT: KASA YOK (D-012). Görsel: primitive = nihai sanat stili (D-013).

## Faz 4 — Ekonomi / meta ⏳
- ⏳ Evrensel 5-seviye yükseltme (L5 💎/video) tüm objelerde
- ⏳ Elmas ekonomisi (kaynak + harcama)
- ⏳ Prestige Renovasyon + İtibar yükseltmeleri
- ⏳ Offline tavan uzatma, otomatik para toplayıcı

## Faz 5 — Monetizasyon ⏳
- ⏳ AdMob (banner / interstitial sıklık-sınırlı / rewarded)
- ⏳ RevenueCat IAP (reklam kaldır, elmas paketleri, başlangıç)
- ⏳ Etik + çocuk-güvenli yapılandırma

## Faz 6 — Sanat geçişi ⏳
- ⏳ greybox → .glb seti, Mixamo animasyon, AI Türk objeleri
- ⏳ Işık / postprocessing / juice / ses

## Faz 7 — Mobil cila + performans ⏳
- ⏳ Capacitor build, dokunmatik kontrol, 60fps (instancing/atlas/LOD)

## Faz 8 — Yayın ⏳
- ⏳ Mağaza hesapları, politikalar, yaş/çocuk uyumu (COPPA/GDPR-K), derecelendirme
