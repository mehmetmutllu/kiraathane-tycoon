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
- ⏳ **2d (SIRADAKİ):** Garson (bölge-başı, yavaş/küçük tepsi, 2. masa sonrası gated) + harita
     dengesi (1 ocak : 4 masa). `hasWaiter` persist → saveVersion bump.
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
