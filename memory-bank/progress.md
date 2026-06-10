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
- ✅ **2e-A (bardak döngüsü + bulaşıkçı):** Bardak SINIRLI kaynak. Demleme bir TEMİZ bardak harcar
     (`cleanCups`); biterse demleme DURUR (yeni darboğaz). İçen müşteri masada KİRLİ bardak bırakır
     (`dishes[]` mekânsal nesne, coins gibi). Oyuncu yakınlıkla toplar (`carriedDirty`, kap = trayCapacity)
     → **bulaşık noktasında** (`LAYOUT.dishStation`) yıkar → temiz havuza döner. Havuz ocak seviyesine
     bağlı (`cupPoolCapacity` = poolBase 10 + 2/lvl); seviye artınca cleanCups += poolPerLevel. **Bulaşıkçı**
     = opsiyonel pad (`dishwasher`, ₺280, requires table3, garson deseni: yavaş/küçük taşıma, kısmi assist);
     `hasDishwasher` derivedFromPads'ten türetilir (D-015). FSM: kirli topla (kapasiteye kadar) → bulaşığa
     götür → yıka → boşta home. **KORUNUM değişmezi:** toplam bardak = havuz (clean+ready+tray+carried+
     dishes+drinking+waiter.tray+dishwasher.tray); transitions atomik. Bardak sayıları **TRANSIENT** (her
     oturum dolu-temiz başlar; readyCups/tray gibi) → **kalıcı şema değişmedi, SAVE_VERSION 8'de kaldı**
     (bulaşıkçı=pad). Render: Dishes.tsx (gri kirli bardak), Dishwasher.tsx (gri-mavi kapsül), DishStation
     (lavabo), Player kirli sırt-yığını, HUD 🧼 temiz + 🧽 kirli. devHooks: cleanCups/dirtyCount/carriedDirty/
     dishStationPos/firstDishPos/hasDishwasher/dishwasherTray/Pos. **Vitest 32/32, build temiz, sim 84sn, smoke 18/18.**
- ✅ **2e-B (tepsi yükseltme):** Tepsi kapasitesi mekânsal yükseltme noktasıyla (çay yükseltme deseni)
     **2→4→6→8** (`trayCapacityForLevel` = base 2 + 2/lvl, maxLevel 3). `LAYOUT.trayUpgradeZone` [0,0,4.5]
     (giriş önü); gating `trayUpgradeRequires` = prev table3. Maliyet `trayUpgradeCost` (costBase 80, growth 1.8;
     L1 80/L2 144/L3 259), fillRate 60. `trayLevel` **PERSIST** (stationLevel gibi) → **SAVE_VERSION 8→9 + v8→v9
     migrasyon** (eksikse 0, varsa korunur). Tepsi & kirli-toplama kapasitesi artık `trayCapacity(trayLevel)`.
     Render: Scene.TrayUpgradeZone (mavi disk + 🫖 etiket). HUD 🫖 kapasitesi seviyeye bağlı. devHooks: trayLevel/
     trayUpgradeZonePos, trayCap seviyeli. **Vitest 37/37, build temiz, sim 84sn (idealize değişmez), smoke 19/19**
     (3. masa aç → tepsi 2→6). **FAZ 2 TAMAMEN BİTTİ.**
- ✅ **2f (görsel/animasyon/yerleşim cilası):** Kullanıcı build incelemesi (2026-06-06). Mantık DEĞİŞMEDİ (sim 84sn sabit).
     **(B) Max tepsi 8→6:** `trayUpgrade.maxLevel` 3→2 (L0=2/L1=4/L2=6, 3×2 ızgara). **SAVE_VERSION 9→10 + v9→v10
     migrasyonu** (eski L3 yeni max'a clamp) + init savunmacı clamp. **(A) Taşıma kafadan→öne tepsiye:** Player'da
     kafadaki DirtyStack kaldırıldı; temiz (kırmızı) + kirli (gri) ellerin ÖNÜNDEKİ tek tepside **3×2 ızgara** (taşmaz).
     **"Eli boşken" kısıtı (store):** servis bloğu `carriedDirty===0`, kirli toplama `tray===0` → tepside hep TEK renk.
     Waiter/Dishwasher zaten önde taşıyor (değişmedi). **(C) Yerleşim:** LAYOUT yeniden — ocak+bulaşık sol-ARKA köşede
     BİTİŞİK "mutfak bloğu"; **bounds 7→5**; 4 masa 2×2 sıkı; tüm dolum noktaları eş-zamanlı çakışmayacak aralıkta
     (aktif fill ≥2.6, yıkama/fill ≥2.9); kamera d 9→8. **(D) Juice (react-spring YOK, useFrame/damp):** para oyuncuya
     süzülür (store mıknatısı — aşağı bug-fix) + doğuş pop'u + toplanınca "+₺" floating (CSS floatUp); baş üstü radial ilerleme
     (activeZone, pad=yeşil/yükseltme=altın); semaver buharı (Puff); müşteri idle bob; yürüyenlerde yön dönüşü
     (`useFacing` damp — Player/Waiter/Dishwasher/Customer). Yeni: useFacing.ts; değişen: Player/Coins/Customers/
     TeaStation/Waiter/Dishwasher/Scene, economy.config/save/store, index.css, logic.test (eli-boşken + clamp testleri).
     **Vitest 40/40, build temiz, sim 84sn, smoke 19/19, konsol temiz, görsel gözle doğrulandı (kompakt köşe mutfağı,
     derli masalar, çakışma yok).** **FAZ 2f BİTTİ → sıradaki Faz 3a (zone genişleme).**
- 🐛→✅ **Para mıknatısı bug-fix (2f sonrası — kullanıcı: "bir coin peşime takılıp arkama yapıştı"):** süzülme görsel-only'di
     (Coins.tsx mesh oyuncuya damp'lerken store toplaması paranın ESKİ düşme konumuna bakıyordu) → oyuncu pickup 1.4'e
     girmeden geçince para yapışıp asla toplanmıyordu. Mıknatıs STORE'a taşındı: `money.attractRadius 2.6/attractSpeed 9`
     (>oyuncu 4.5 → daima yetişir); tick'te attract içindeki coin `moveToward(player)` ile gerçekten akar, pickupRadius'ta
     toplanır. Coins.tsx artık yalnız `c.pos`'u çizer (görsel=mantık → yapışan para imkansız); coins map `pos` klonlandı.
     Yeni vitest: pickup'a hiç girilmeden mıknatısla toplanır + attract dışı çekilmez. **Vitest 42/42, build temiz, smoke 19/19.**

## Faz 2g/2h/2i — His & yerleşim & yükseltme & onboarding ⏳ (D-016 ile eklendi)
- ✅ **2g (his/yerleşim/collision/tuning, TEK zone):** **v5 GEÇERLİ** (kullanıcı feedback 2026-06-07 #4: sandalyeler koridor
  tıkıyor, karakterler iri → "alan baya büyümeli") — ✅ **BÜYÜK alan** `area`{minX-5.5,maxX5.5,minZ-5.0,maxZ4.5}; ✅ masalar
  **köşelere yayık 2×2** (kolon x-2.5/2.5 gap5, satır z-2.2/1.4 gap3.6) → orta geniş yürüme, sandalye kenarda (tıkanmaz);
  ✅ kamera d 9 (karakter alana göre küçük); mutfak arka duvarda (ocak[-3.0,-4.4], bulaşık[-1.0,-4.4], semaver[1.0,-4.4]);
  ✅ müşteri+garson+bulaşıkçı masa gövdesinden DOLAŞIR (`moveAvoid`+`tableSolids`; bulaşıkçı mesafe-tabanlı); ✅ oyuncu
  collision HAPSETMEZ; garson `moveSpeed 1.5`; `hitsSolid(r)`. **build temiz, Vitest 44/44, sim 84sn, smoke 19/19, konsol
  temiz, görsel doğrulandı.** **SERVİS-HER-TARAFTAN + garson kilitlenme fix (2026-06-07 #2):** garson teslimatı `seat`'e VARMAYI beklediği
  için (moveAvoid eksen-kayması tek engeli dolaşamaz) masanın arkasında KİLİTLENİYORDU → servis MASA MERKEZİNE yakınlıkla (oyuncu+garson:
  `seat`→`table`, teslim `dist<serveRadius 1.6`, her taraftan). Garson `moveSpeed 1.4→1.8` (eski hız; alan büyük). Müşteri geliş AYNI
  (spawnInterval 1.6). Vitest 44/44, smoke 19/19 (assist düşen para 1→8), build temiz, sim 84sn. SAVE_VERSION değişmedi. (v2/v3/v4 terk.)
  - 🐛→✅ **GERÇEK YOL BULMA (nav.ts, 2026-06-07 #3):** `moveAvoid` eksen-kayması GERÇEK pathfinding değildi → masa aktör ile hedef arasında TAM
    ortadayken (ön masa arka masayı kolonda kapatır) KİLİTLENİYORDU (ön masada takılma, arka masa açlığı, salınım, uzaktan-verme). YENİ `src/game/nav.ts`:
    kaba ızgara (0.3) BFS (`buildNavGrid`+`findNavPath`, 8-yön, köşe-kesme engelli, bloklu-başlangıç snap). store: `navSolids`/`getNavGrid` cache/`navStep`;
    GARSON + BULAŞIKÇI `moveAvoid`→`navStep` (oyuncu+müşteri değişmedi). Teslim masaya BİTİŞİK (REACH_TABLE~1.05). **Vitest 47/47** (3 nav testi),
    build temiz, sim 84sn, smoke 19/19. SAVE_VERSION değişmedi. **Faz 2g BİTTİ (gözle onay bekliyor).** Değişen: YENİ nav.ts, store.ts.
- ~~v2/v3/v4~~ **(TERK — referans):**
  mutfak (ocak `[-2.7,0,-3.0]`+bulaşık `[-1.0,0,-3.0]`+semaver `[0.6,0,-3.0]`) sol-arka duvara 0; masalar **mutfağın
  TAM ÖNÜNDE** 2×2 (x-2.0/0.0, z-1.2/0.9) → "çapraz/geniş" gitti; ✅ **asimetrik `area`** {minX-3.5,maxX2.5,minZ-3.6,maxZ3.4}
  (içeriği sıkı sarar; `bounds` kaldırıldı); ✅ **collision SABİT+DİNAMİK** (ocak/bulaşık/masa/sandalye + müşteri/garson/
  bulaşıkçı; `*Half`+playerRadius0.35; yalnız input'la harekette eksen-başı kayma → teleport/setState etkilenmez); ✅ garson
  `moveSpeed 1.8→1.5`; ✅ kamera `d 8→7`; Walls asimetrik area'ya göre. smoke "park" `(2.5,-3.0)`. **build temiz, Vitest
  44/44 (collision testleri+), sim 84sn, smoke 19/19, konsol temiz.** KALAN (ops.): spawn/sipariş tempo + "sayı düzeni". SAVE_VERSION değişmedi.
- 🔧→✅ **2h-rework (MASA-BAŞI, kullanıcı isteği 2026-06-07):** "toplu değil, her masanın yükseltmesi AYRI (My Hotel oda mantığı),
  masanın YANINDA, etrafında altın halka YOK, üzerinde L yazısı YOK." → `tableLevel`(number) **→ `tableLevels`(number[])**; her açık
  masanın YANINDA ayrı nokta (`LAYOUT.tables[i].upgradeSpot`, +1.2x merkeze; TABLE_UP_RADIUS 1.0); bahşiş+sabır OTURULAN masanın
  seviyesinden. Merkez altın TableUpgradeZone + ★L rozet KALDIRILDI → `TableUpgradeMarkers` (her masanın yanında sade küçük işaret;
  parası yetince yeşil parlar; yazı yok). **SAVE_VERSION 11→12 + v11→v12 migrasyon** (eski tek tableLevel → her masaya). simulate
  masa-başı (idealize tüm masalar eşit; 1 seviye = masa×maliyet). devHooks tableLevels+tableUpgradeSpots. **Vitest 54/54, build temiz,
  sim 84sn, smoke 20/20** (masa-başı: 0. masa 0→3, komşu sabit). decisions.md D-016 §5 "zone-başı"→"masa-başı" güncellendi. **GÖZLE onay bekliyor.**
- ~~**2h (masa yükseltme + BAHŞİŞ) — ilk uygulama (TERK, zone-başı):**~~ Masa ZONE-başı yükseltilir (4 masa birlikte), mekânsal nokta
  4 masanın ORTASINDA (`LAYOUT.tableUpgradeZone [0,0,-0.4]`); çay/tepsi yükseltme deseninin aynısı. **Çay fiyatı SABİT** (D-010
  bozulmadı). Seviye iki şeyi artırır: **BAHŞİŞ** (servis başına ek `tipBase×seviye` ₺ → coin value = TEA_PRICE + tip) + **SABIR**
  (`patiencePerLevel×seviye` sn). 2. masa açılınca belirir (`tables.upgradeRequires prev:table2`). `tableLevel` **PERSIST** →
  **SAVE_VERSION 10→11 + v10→v11 migrasyon** (eksikse 0, softMax'a clamp). Config sayıları: tipBase 2, patiencePerLevel 2,
  upgrade{costBase 60, growth 1.6 → 60/96/153/245, masterLevel 5 → soft max L4}, upgradeFillRate 60. Helper: tableUpgradeCost/
  tableTip/tablePatience (config) + tableSoftMaxLevel/tableNextCost/tableUpgradeZoneUnlocked (store). Render: Scene.TableUpgradeZone
  (altın disk 🪑) + Tables.tsx masa üstü ★L rozeti (level>0). devHooks: tableLevel/tableUpgradeZonePos. simulate: bahşiş gelire katıldı
  (rate = tables×(TEA_PRICE+tip)/cycle; idealize oyuncu omurga+ocak sonrası masa yükseltir). **İlk-alım 84sn SABİT** (table2 gate
  değişmedi); bahşiş geç-oyunu hızlandırır (lifetime 10k 68dk→36.5dk). **Vitest 53/53, build temiz, sim 84sn, smoke 20/20.**
  Değişen: economy.config.ts, store.ts, save.ts, Scene.tsx, Tables.tsx, devHooks.ts, tools/simulate.ts, tests/logic.test.ts, tools/smoke.mjs.
  **GÖZLE onay bekliyor** (yükseltme noktası ortada + masa rozetleri + bahşiş hissi).
- 🔧 **2-REDESIGN (D-017, kullanıcı onayı 2026-06-07 — UYGULAMA BAŞLADI):** Faz 2 cila redesign'ı, 6 adım:
  1. ✅ **Yerleşim UYGULANDI (LAYOUT v6):** mutfak ARKA DUVAR KÜMESİ (ocak[-1.6,-4.8]+bulaşık[0.6,-4.8] bitişik+semaver[-3.8,-4.8]);
     masalar ÖNE UZAK 2×2 (kolon ∓2.4, satır z 0.0/3.0) → masa↔ocak >2R=3.2 (başlangıç table0 ocaktan 4.87, eski 2.26); area
     derinleşti {minX-5.3,maxX5.3,minZ-5.3,maxZ5.0}; çay-yükseltme ocağın önü [-1.6,-3.0] (pickup/personel pad çakışması yok —
     garson-pad para çekişmesi bug'ı bulundu&düzeltildi); personel pad/home arka köşeler. nav/garson/masa-yükseltme LAYOUT'tan
     türeyip otomatik uydu. YENİ "çakışma yok" testleri (ocak/bulaşık dairesi masa dairesiyle birleşmez). GÖZLE ONAYLANDI.
  1b. 🐛→✅ **Masa açınca HAPSOLMA fix (kritik):** mobilya collision'ına "zaten içindeyse çıkışa izin" guard'ı (aktör deseni) +
     masa pad'i tamamlanınca oyuncu footprint dışına itilir. Yeni vitest. Gözle doğrulandı.
  2. ✅ **SADE ZEMİN İŞARETLERİ (D-017 §2):** havadaki Html rozet + iri disk/koni KALDIRILDI → YENİ GroundMarker.tsx (drei Text):
     yerde ufak şeffaf beyaz çember + zemin yazısı ("2. Masa"/"Garson"/"Çay Yükselt"/"Masa") + ₺maliyet; renk dili (yeşil=aç/
     mavi=opsiyonel/altın=yükseltme) + afford parıltı + progress yayı. Pad/UpgradeZone/TrayUpgradeZone/TableUpgradeMarkers + Dish/
     TeaStation havada etiketleri silindi. Sıralı reveal (light): opsiyonel pad AYNI ANDA tek; personel pad görünür orta-kenara taşındı.
  + ✅ **DIŞ DÜNYA (kullanıcı eki):** ön duvar+KAPI boşluğu (söve/çerçeve) + Street() (kaldırım/asfalt/yol/binalar) + müşteriler
     SOKAKTAN yürüyüp kapıdan girer/çıkar (LAYOUT.street, NPC toTable/leaving kapı akışı). **Vitest 58/58, build temiz, sim 84sn,
     smoke 20/20.** SAVE_VERSION 12. Değişen: store.ts, Scene.tsx, Pad.tsx, TeaStation.tsx, YENİ GroundMarker.tsx, logic.test.ts.
     GÖZLE ONAYLANDI (world-door-street.png, markers-3tables.png).
  3. 🔧 **D-018 (UYGULAMA BAŞLADI 2026-06-07) — Faz 2 cila v2:** Kullanıcı 2. tur feedback. Tam karar decisions.md **D-018**.
     - ✅ **adım 1 (bug-fix):** (a) kapı z-fighting → lento/direk `z1+0.06` offset. (b) table2 KARARMA → DÜNYA Suspense
       DIŞINDA, yalnız Text-marker'lar (Pad/UpgradeZone/TableUpgradeMarkers) ayrı `<Suspense fallback={null}>` →
       font yüklenirken dünya kararmaz. module-scope preloadFont CDN fetch'i smoke networkidle'ı bozdu → kaldırıldı
       (font lazy; **Faz 7 TODO: fontu yerele bundle'la**). Gözle ✓.
     - ✅ **adım 2 (tray yükseltme KALDIR):** tepsi sabit 2; tüm trayUpgrade/trayLevel/trayUpgradeFill/TrayUpgradeZone/
       helper/test/smoke/devHooks silindi. **SAVE_VERSION 12→13** + v12→v13 (trayLevel düşer). Vitest 54/54, build temiz,
       sim 84sn, smoke 19/19, konsol temiz, gözle ✓.
     - 🔧 **adım 3 (kenar-yerleşim + etkileşim):** KART denemesi kullanıcı tarafından REDDEDİLDİ ("çok kötü") → GroundMarker
       eski SADE zemin işaretine geri alındı (D-017 §2). KENAR-YERLEŞİM korundu (upgradeSpot ∓3.7; personel pad z=1.5).
       DWELL süre-sayma DEĞİL **HAREKET-TEMELLİ**: para yalnız oyuncu DURUNCA akar (`fillReady = hypot(input)<=0.1`) →
       geçerken alınmaz, durunca HEMEN, countdown yok; çay-fill leave'de sıfırlanmıyor. 3 hareket-temelli vitest.
       Vitest 57/57, build temiz, sim 84sn, smoke 19/19, gözle ✓ (sade işaret döndü).
     - ⏳ **adım 4+ (SIRADAKİ):** sıralı reveal zinciri → semaver=ocak L4 (+ekonomi denge) → garson L2.
     - ✅ **D-019 madde 1 (KİRLİ MASA mekaniği — YENİ oynanış, gözle onay bekliyor):** Her kirli bardak (`Dish.tableIndex`)
       bırakıldığı masaya etiketlenir; bir masada `cups.dirtyThreshold`(2)'den FAZLA = **3+ kirli → masa KİRLİ**. Kirli masaya
       (a) üstünde alçak primitive yeşilimsi **koku bulutu** (StinkCloud, Dishes.tsx, hafif bob — havada UI değil), (b) **garson
       çay GÖTÜRMEZ** (garson `waitingNpcs` kirli masayı filtreler), (c) **YENİ MÜŞTERİ OTURMAZ** (`findFreeTable(npcs,tables,dirty)`
       kirli masayı boş saymaz) → oyuncu ≤2 toplayınca masa normale döner (temizlik baskısı). `dirtyTables(dishes)` saf helper
       (export); devHooks `dirtyTables`+`dishesByTable`. **SAVE_VERSION 13 DEĞİŞMEDİ** (dishes transient, persist alan yok).
       Ekonomi etkilenmez (sim idealize oyuncu yetişir; **84sn sabit**). **Vitest 60/60** (3 yeni: eşik aşımı, oturmaz, garson-
       götürmez), build temiz, sim 84sn, smoke 19/19, konsol temiz. Değişen: types.ts, economy.config.ts, store.ts, Dishes.tsx,
       devHooks.ts, tests/logic.test.ts. (decisions.md D-019 madde 1.)
       **GÖZLE ONAYLANDI** (kullanıcı 2026-06-07: "3 kirli masada koku bulutu çıktı + müşteri gelmedi"; ileride koku yerine
       temizlik/kirli-bardak ikonu onboarding'de düşünülecek).
     - ✅ **D-019 madde 2-3 (reveal sırası + gating sadeleştirme) + L1-BAŞLANGIÇ (kullanıcı isteği, gözle onay bekliyor):**
       Kullanıcı: "2. masa açılınca birden 4 yükseltme geldi" → ÇIKIŞ SIRASI: başta 2.Masa → açılınca **çay yükseltme + 3.Masa**
       → ocak bir kez yükselince **garson** → 3.Masa açılınca **bulaşıkçı** → **4 masa açılınca masa yükseltme**. Config:
       `table3`'ten `minStationLevel:1` KALKTI (D-019 §2); `waiter`'a `minStationLevel:1` (reveal); `tables.upgradeRequires`
       `prev:['table4']`. **L1-başlangıç:** çay ocağı/masalar GÖRSEL L1'den (iç 0-tabanlı; `activeZone.label` +1; softmax→"Usta 💎").
       **Sim bottleneck:** `rate=min(talep, ocak-arzı)×(fiyat+bahşiş)`; `trySpend` ocak darboğazsa önce ocağı yükseltir. **İlk-alım
       84sn SABİT** (ocak L1 @1.9dk, 4.masa @8dk, masa-yük @15.7dk). SAVE_VERSION 13 değişmedi. **Vitest 60/60, build temiz, sim
       84sn, smoke 20/20.** Değişen: economy.config.ts, store.ts, simulate.ts, logic.test.ts, smoke.mjs. (decisions.md D-019 §2/§3.)
     - ✅ **D-018 adım 5 (SEMAVER = OCAK ÜST YÜKSELTMESİ — gözle onay bekliyor):** ayrı `samovar` omurga pad'i (₺850, serviceSpeed
       ×0.7) KALDIRILDI → semaver = çay ocağının üst yükseltmesi (TeaStation seviyeyle büyüyen semaveri zaten çiziyor); omurga
       table4'te biter. `derivedFromPads` serviceSpeed case silindi (serviceSpeedMult hep 1; Faz 3a için alan kaldı). EKONOMİ
       (sim bottleneck): tek ocak ₺ L4 (×3.32) 4 masaya yetişir (arz 0.553 > talep 0.512); ilk-alım **84sn SABİT**, ocak L4 @8.7dk,
       masa-yük @10.2dk, 10k @35dk. "Usta" master (💎/video) Faz 4. **SAVE_VERSION 13→14 + v13→v14** (samovar padsDone+padFills'ten
       düşer; ilerleme korunur). **Vitest 61/61, build temiz, sim 84sn, smoke 20/20.** Değişen: economy.config.ts, save.ts, store.ts,
       simulate.ts, tests/logic.test.ts. (decisions.md D-018 §5.)
     - ✅ **D-018 adım 6 (GARSON L2 — gözle onay bekliyor):** garson hızı seviyeli `moveSpeedByLevel [1.8, 2.6]` (L1 taban/L2);
       config `waiter.upgradeCost 200`, `upgradeFillRate 60`, `upgradeRequires prev:['waiter']`; helper `waiterSpeed`/`waiterSoftMaxLevel`.
       Mekânsal yükseltme noktası `LAYOUT.waiterUpgradeSpot [-4.6,0,-0.9]` (tutma pad'inin z=1.5 ARKASINDA → tutar tutmaz aynı noktada
       yükseltmeye akmaz; `WAITER_UP_RADIUS 1.0` masa-yük noktalarıyla çakışmaz). `waiterLevel` **PERSIST** → **SAVE_VERSION 14→15 +
       v14→v15 migrasyon** (eksikse 0, soft max'a clamp). `FILL_WAITER` dolum noktası (FILL_TEA deseni, dwell — biriken ₺ korunur).
       Scene `WaiterUpgradeMarker` (altın sade zemin işareti, L2'de kaybolur). Garson hareketi `waiterSpeed(waiterLevel)` kullanır.
       Ekonomi DEĞİŞMEZ (garson opsiyonel/idealize; sim 84sn sabit; simulate.ts info satırı L1→L2 gösterir). devHooks waiterLevel/
       waiterUpgradeSpotPos. **Vitest 66/66, build temiz, sim 84sn, smoke 21/21.**
     - ✅ **D-019 madde 4 (YENİ-ÖZELLİK BİLDİRİMİ — gözle onay bekliyor):** bir ikincil özellik (çay yükseltme/garson/bulaşıkçı/garson
       hız/masa yükseltme) İLK kez açılınca üst-orta **toast** (`notice {text,ttl 4.5}`, transient; HUD `.notice` CSS pop animasyonu,
       `key=text` ile remount). `revealKeys(gate,hasWaiter,waiterLevel)` saf helper; `revealSeen` baseline **init'te mevcut açık
       özelliklerle kurulur** → yeniden yüklemede spam YOK (persist GEREKMEZ). Omurga masa pad'leri DAHİL DEĞİL (nextStep ile yönlenir).
       devHooks notice/revealSeen. **Vitest 69/69** (3 yeni: açılınca tetikler / garson reveal / baseline suppress), smoke 22/22
       (reveal: upgrade, opt:waiter, waiterUp, opt:dishwasher, tableUp).
     - ✅ **D-017 §6 (KAMERA DAMPING — gözle onay bekliyor):** CameraRig kök-neden fix. Eski: konum `lerp(dt*4)` kare-hızına BAĞLI +
       `lookAt(TAM oyuncu)` → konum geriden gelirken bakış dalgalanıp dünya SALLANIYORDU. Yeni: kare-hızı BAĞIMSIZ damping `a=1-exp(-8·dt)`
       AYNI katsayıyla hem konuma hem **pürüzsüzleştirilmiş lookAt hedefine** (rijit offset → sallanma yok) + `dt` clamp 0.05 (hitch sıçramaz)
       + `fit/d` YALNIZ gerçek resize'da (her kare size okuması mobil viewport titremesini taşıyordu) + ilk kare `copy` (başlangıç sıçraması yok).
       (Görsel — kullanıcı gözle onaylayacak.) build temiz, smoke 22/22, konsol temiz.
     - ✅ **FAZ 2 TEK-ZONE TAMAM (gözle onay + uçtan uca kullanıcı testi bekliyor):** D-018 (6 adım) + D-019 (4 madde) + D-017 (§1-§6)
       bitti. Kullanıcı planı: tek zone'u uçtan uca test → bulgulara göre OPSİYONEL ara-faz → sonra Faz 3a (zone çoğaltma).
     - ✅ **MOBİL CİLA ara-fazı (kullanıcı feedback 2026-06-07, önizleme sonrası):** (1) **drag-anywhere joystick** (ekranın her
       yerinden sürükle; `touch-layer` + floating `.joystick`; Joystick.tsx yeniden yazıldı), (2) **alttaki `.hint` yazısı kaldırıldı**
       (HUD + CSS), (3) **kamera BAYA yakın** (CameraRig d 9→6, portrait 1.7→1.3), (4) **üst chip'ler responsive** (`.hud-top` flex-wrap +
       portrait media query), (5) **sokak/kapı z-fighting fix** (Scene Street düzlemleri y-ayrımı+polygonOffset; kapı çerçevesi duvar önüne).
       Playwright portrait + drag-anywhere doğrulandı. Değişen: Joystick.tsx, HUD.tsx, Scene.tsx, index.css. vitest 69/69, smoke 22/22.
     - ✅ **ANDROID APK (Capacitor 8.4 — Faz 7 öne çekildi; kullanıcı cihazda test + arkadaşına gönderecek):** `cap init`
       (`com.kosekiraathanesi.game`, webDir dist) + `cap add android` → **debug APK derlendi** (`KoseKiraathanesi-debug.apk` ~4.6MB,
       kök, git-ignored). Ortam: SDK `C:\flutter\bin` (local.properties), build JDK = Android Studio JBR 21 (gradle.properties;
       sistem JDK 23 AGP'yi kırar). Script'ler: `npm run apk` (yeniden derle), `npm run dev:host` (telefon tarayıcısı LAN testi),
       `npm run cap:sync`. Detay: architecture.md. (Faz 7 tam cila — instancing/atlas/60fps/AdMob/IAP — sonraya kalır.)
     - ✅ **EKONOMİ TEMPO + OFFLINE + KAMERA AYARI (kullanıcı telefon feedback'i 2026-06-09):** KÖK = tek darboğaz manuel servis
       (yardımcılar açılınca flip), offline %100 idealize × 2h = built shop ~18k. Onaylı düzeltmeler (SAVE_VERSION 15 SABİT, config/kod):
       (a) **offline sert kıs:** YENİ `offline.rateMult 0.5` + `baseCapHours 2→1` → built 18.4k→~4.6k, mid ~1.7k (store.ts init çarpan).
       (b) **eğri garson noktasında:** öncesi ucuz (table2 35→25 & minLifetime 30→20; çay yük. tabanı 25→20 → ilk-alım 84→60sn);
       sonrası ölçülü pahalı (table3 120→130, table4 300→420, bulaşıkçı 280→330, masa yük. growth 1.6→1.8 [60/108/194/349], garson L2
       2.6→2.3 & 200→250). (c) **kamera** Scene.tsx d 6→7, portrait clamp 1.3→1.4. **vitest 69/69, build temiz, sim ilk-alım 60sn, smoke
       22/22.** İkinci ilerleme ekseni (nakit-dışı zone gate) Faz 3a'ya ertelendi. Değişen: economy.config.ts, store.ts, Scene.tsx,
       tests/logic.test.ts. **Kullanıcı telefonda test edip feedback verecek.**
     - 🐛→✅ **DEADLOCK FIX + PAYLAŞIMLI TEPSİ (kullanıcı bug 2026-06-09):** elinde çay + tüm masalar kirli → bırakacak
       bekleyen masa yok + çay elindeyken kirli toplanamaz (eski Faz 2f "eli boşken/tek renk" kısıtı) → sonsuz kilit.
       Çözüm (kullanıcı "neden hep böyle olmasın"): **paylaşımlı karışık tepsi** `serving.trayCapacity 2→4`, çay+kirli
       aynı tepsiyi paylaşır (toplam ≤ trayCap); `carriedDirty===0`/`tray===0` gate'leri kaldırıldı → kilit-geçirmez +
       solo angarya az. store.ts servis/toplama `tray+carriedDirty<trayCap`; Player.tsx tek CupTray ardışık dizer.
       Yeni "DEADLOCK YOK" vitest. SAVE değişmedi. **vitest 70/70, build temiz, smoke 22/22 (tray 3/4, kirli 4).**
     (Orijinal sıra:) (1) bug-fix kapı z-fighting + table2-kararma (Suspense) → (2) TRAY YÜKSELTME KALDIR (tepsi sabit 2) → (3)
     KESİK-KÖŞELİ zemin kartı + masa yükseltme MERKEZDEN KENARA (sol→sol/sağ→sağ, orta boş) + DWELL (~1.5sn, üstünden geçince para
     gitmesin) → (4) sıralı reveal zinciri (yakınlık-gizleme YOK) → (5) SEMAVER=OCAK L4 (premium 💎/video, kilitli; ayrı pad kalkar;
     ekonomi simülatörle yeniden denge, 84sn sabit) → (6) GARSON L2 (L1 1.4→L2 1.8, yan-kenar yükseltme kartı). Etkileşim: yürü+dur
     (tıklama YOK). Alan GENİŞLEMEZ (placement çözümü, My Perfect Hotel modeli — araştırma destekli). **SAVE_VERSION 12→13** (trayLevel
     düşer, samovar düşer, waiterLevel eklenir). Kalan D-017 §4/§5/§6 bununla birlikte.
  2. **Pad/işaret redesign:** küçük (~0.5) + **zeminde DÜZ yazı** (havada Html rozet yok); renk dili yeşil=aç/mavi=opsiyonel/altın=yükseltme.
  3. **Sıralı reveal + onboarding (ilk oyun):** hepsi-birden yok (öncekiyle etkileşilene dek gizli); 2.masa→garsona zoom (atlanabilir)→
     "3.Masayı Aç"→ocak yükseltme sonra; ilk-oyun sonrası "Yeni" rozeti. onboardStep persist.
  4. **Gating:** table3'ten minStationLevel:1 kalkar (2.masa→garson→3.masa); simulate yeniden denge (ilk-alım 84sn sabit).
  5. **Servis kısıtı GEVŞER:** çay+kirli BAĞIMSIZ taşınır (eli-boşken kısıtı deadlock yapıyordu — kirli birikip toplanamıyor).
  6. **Kamera sallanması fix:** CameraRig dt-bağımlı lerp + lookAt(tam oyuncu) → sallanma; kare-hızı bağımsız damping (konum+lookAt
     tutarlı) + dt clamp + fit/d sadece resize'da. (Kök neden bu oturumda teşhis edildi.)
  Detay: decisions.md D-017. Her adım Vitest+sim+smoke yeşil + gözle onay.
- ✅ **2i (onboarding) + SIFIRLAMA BUTONU (2026-06-09):** İlk-oyun koç ipucu `onboardingHint(g)` saf helper — 2. masa
  açılana kadar çekirdek döngüyü adım adım öğretir (ocağa git→çayı al → müşteriye götür → parayı topla → "2. Masa" işareti),
  açılınca null. KALICI durum YOK (durumdan türetilir; SAVE değişmedi); mevcut kayıtta table2 açıksa görünmez; sıfırlayınca
  tekrar belirir. HUD `.coach` yeşil bant (havada kart yok), onboarding aktifken `.next-step` gizli. **Sıfırlama butonu**
  `.reset-btn` sol-altta (confirm → hardReset) cihazda test için. Yeni-özellik toast'ları (D-019 §4) "Yeni" bildirimini zaten
  karşılıyor. Yeni vitest (5 adım). **vitest 71/71, build temiz, smoke 22/22, Playwright gözle ✓.** Değişen: store.ts, HUD.tsx,
  index.css, devHooks.ts, tests/logic.test.ts. (Zoom/atlanabilir tur şimdilik YOK — sade koç ipucu yeterli; istenirse eklenir.)

## Faz 2-QUEST — Fable brief Adım 1+2: görev sistemi + UI game-feel ✅ (D-021, 2026-06-10)
- ✅ **Quest hattı (config-driven):** `economy.config.quests[]` 13 sıralı görev (pickup→serve→coin→table2→5-servis→
  ocak L2→3-yıkama→table3→garson→bulaşıkçı→table4→garson-hız→masa-yük). Sayaç görevleri questBase'ten DELTA;
  `questIndex/questBase` + `stats{teaPickups,teasServed,coinsCollected,dishesWashed,waiterServed}` PERSIST →
  **SAVE_VERSION 15→16 + tohumlamalı migrasyon** (ilk karşılanmamış görevde durur; garson tutulmuşsa waiterServed=20).
- ✅ **Personel zorunlu omurga** (D-014 geçersiz): pads zinciri table2→table3→waiter→dishwasher→table4; optional kalktı.
- ✅ **Ekranda TEK PAD:** `visiblePads(questIndex, gate)` — tick dolumu + Pad.tsx çizimi aynı kaynak.
- ✅ **Arka-plan reveal şartı:** `Requires.minWaiterServed:20` (garson hız yükseltmesi); revealKeys waiterServed'li gate.
- ✅ **Kamera odak:** `camFocus` transient; görev barı dokunuşu + görev geçişi + reveal + ilk açılış panı; CameraRig
  odakta d×0.72 + k=5 damping; girdi anında iptal. (Kullanıcının "hareketli onboarding" vizyonunun 1. fazı.)
- ✅ **HUD game-feel:** yalnız para (CSS altın coin ikonu; ₺ display'den TAMAMEN kalktı, 3D'de pul mesh) + 💎 chip;
  offline = modal kart [Tamam]; sıfırla → dişli menüsü; coach + next-step + onboardingHint/nextStep helper'ları SİLİNDİ.
- ✅ **Dev kancaları:** `__setQuest(id)`, `__grantStat(k,v)`; __game quest/stats/camFocus döner.
- **Doğrulama: vitest 72/72, build temiz, sim ilk-alım 60sn, smoke 27/27, Playwright görsel ✓** (görev barı, kamera
  odak, offline modal, coin pulları, tek-pad kuralı). Kullanıcı canlı önizlemede oynadı (feedback bekleniyor).
- 🔧 **KULLANICI FEEDBACK (2026-06-10, oturum kapanışı):** UI beğenilmedi — "chip'ler/ekran dağılımı/görev barı hiçbiri
  istediğim gibi değil, hâlâ oyun gibi değil; ikonlar aşırı AI slop". SONRAKİ OTURUM: (1) gerçek tycoon UI ekran
  görüntüleri araştırılıp HUD SIFIRDAN tasarlanacak, (2) gerçek ikon asset'leri üretilecek (SVG/sprite ya da Kenney
  CC0 UI), (3) oyun-hissi font (yerel bundle, TR destekli), (4) zone-2'yi erken getirme + per-zone vs merkezi-servis
  kararı netleşecek. Detay: activeContext "SONRAKİ OTURUM ANA GÖREVİ".
- ✅ **HUD SIFIRDAN REDESIGN + LEVEL/XP + AYARLAR (2026-06-10 gece; SAVE 16→17):** Kullanıcı "UI oyun gibi değil /
  ikonlar AI slop" dedi → onaylı akış (referans araştırması → mock → onay → uygulama → Playwright didik didik).
  (1) **Referans:** MPH gerçek HUD (YouTube kare) + MPH-Empire + My Mini Mart + Burger Please App Store görselleri
  görsel incelendi (yalnız 3D arcade-idle; 2D'ler elendi — kullanıcı isteği). (2) **Yerleşim MPH birebir** (kullanıcı
  tarifi): sol-üst yıldız(seviye)+XP barı, altında küçük dişli+posta; sağ-üst CHİP'SİZ para+elmas (SVG+Lilita konturlu
  rakam); altında görev kartı (görev FOTOĞRAFI+ad+ilerleme barı; dokun→kamera). (3) **icons.tsx** elle çizilmiş gradyanlı
  SVG seti (coin/gem/star/gear/mail/QuestPhoto) — emoji+CSS-circle bitti. (4) **Font yerel:** Baloo 2 + Lilita One
  (@fontsource, main.tsx); 3D zemin yazıları Baloo2.ttf (public/assets/fonts, OFL manifestte) → troika CDN default'u
  kalktı (D-018 Faz 7 TODO kapandı). (5) **LEVEL/XP:** config.xp (eylem-temelli; eğri 60×1.5^L) + xpForLevel/levelProgress;
  xp persist; tick'te servis/yıkama/garson/pad/yükseltme/görev XP'si; level-up toast. **v16→v17 migrasyon xp'yi eski
  ilerlemeden TOHUMLAR.** İleride: kat L-kapısı (3b) + kozmetik mağaza. (6) **Ayarlar modalı:** ses/müzik/bildirim
  toggle (persist, setSetting) + Oyunu Sıfırla; posta "boş" modalı. (7) **🐛 kök-neden fix:** floater key'i coin id →
  bağımsız sayaç (reset sonrası duplicate-key React hatası her kare basıyordu). **vitest 77/77 (5 yeni), build temiz,
  sim 60sn sabit, smoke 27/27, konsol 0 hata, 320/390/768/landscape taşma yok.** Değişen: economy.config, save, store,
  devHooks, HUD, index.css, main.tsx, Coins, GroundMarker, YENİ icons.tsx, assets/fonts, tests. **Kullanıcı feedback bekleniyor.**
- ✅ **HUD v2 ince ayar (kullanıcı 1. tur feedback, aynı oturum):** (1) 🐛 KRİTİK: üst HUD öğeleri touch-layer
  altında kaldığından TIKLANAMIYORDU → z-index 10 (reset-btn dersi tekrarı; bundan böyle tıklama testleri GERÇEK
  Playwright click ile). (2) Level ünitesi BÜTÜNLEŞİK tek pill (yıldız gömülü+bar içinde); para/elmas aynı pill
  ailesinde chip + level ile piksel hizalı. (3) Zemin yazıları fontWeight 700 (Baloo2 variable). (4) **Bulaşık
  onboarding gate:** q_wash görevi gelmeden kirli çıkmaz (bardak temize döner; korunum testli). **vitest 78/78,
  smoke 27/27, build temiz, 320/landscape taşma yok.**
- ✅ **ZONE KARARI (D-022, kullanıcı onaylı):** per-zone TEMALI ocak+bulaşık; kat başına 4 zone 2×2; zemin kat çay
  teması (zone 3-4 farklı konsept), okey/tavla üst kat + balkon; tuvalet+depo+TV köşesi+dış bahçe kat planında.
- 🌙 **SIRADAKİ = GECE OTURUMU (onaylı 7 maddelik liste activeContext'te):** ocak-yükseltme fix → kıraathane
  araştırması+kat planı → zone-2 çalışır → görsel kimlik+sokak → curve raporu → karakter → APK+sabah raporu.
- 🐛→✅ **GECE 1/7 — ocak-yükseltme para yeme fix'i (2026-06-10 gece):** KÖK: çay almaya gelen oyuncu tezgâh
  önünde (z≈-4.05) dururken upgradeZone'a [-1.6,-3.0] mesafesi 1.05 < PAD_RADIUS 1.3 → FILL_TEA tetikleniyordu
  (koddaki "dist 1.8 çakışmaz" yorumu merkez-merkez mesafeye bakmış, DAİRE KESİŞİMİNİ ıskalamıştı). İKİ katman:
  (a) upgradeZone [-1.6,-3.0]→**[-1.6,-1.7]** (merkez mesafesi 3.1 ≥ pickup 1.6 + PAD 1.3 = 2.9 → daireler
  kesişEMEZ); (b) GUARD: oyuncu HERHANGİ ocağın pickup yarıçapındaysa FILL_TEA hiç devreye girmez (geometri
  değişse de emniyet). PAD_RADIUS export edildi. 2 yeni vitest: geometri değişmezi (dist ≥ r1+r2) + davranış
  (tezgâh önünde 20sn dur: para sabit, dolum 0, çay tepsiye alınıyor). **Vitest 80/80, build temiz, sim 60sn
  sabit, smoke 27/27, Playwright canlı doğrulama (guard + yeni noktada dolum çalışıyor), konsol 0 hata.**
  Değişen: store.ts (LAYOUT.upgradeZone + guard), logic.test.ts. SAVE değişmedi.
- ⏳ **Adım 3:** curve'ü 3-profil simülasyonla ciddi hesapla + sayı tablosu onaya. ⏳ **Adım 4:** Faz 3a zone-2.
- ⏳ **Zone mimarisi kararı AÇIK (2026-06-11 feedback'iyle netleşmeye yakın):** kullanıcı "zone'lar arası duvar OLMASIN,
  tek salon, TEK kapı, mutfak sol duvara paralel L-şerit (zone açıldıkça uzar)" dedi → fiilen MERKEZİ SERVİS + zone-başı
  personel modeli; D-022 revizyonu onay bekliyor (docs/feedback-2026-06-11.md §G karar noktası).
- 📋 **KULLANICI BÜYÜK FEEDBACK (2026-06-11) → ARAŞTIRMA+PLAN BİTTİ, KOD YAZILMADI:** tamamı `docs/feedback-2026-06-11.md`.
  19 madde (buglar: table2 pad gate, z2 kamera odağı, toast z-index, offline 7k; dünya: duvarsız tek salon/tek kapı/L mutfak
  şeridi/çaycı NPC; görsel: parke-fayans zemin, masa ŞEKİL evrimi, klasik çay ocağı+çaydanlık sayısı, TV içeriği, karakter
  asset'leri [Quaternius önerisi], dekor; sistem: tek dolum göstergesi, kozmetik mağaza 10k+/zone). Bug kök nedenleri kodda
  doğrulandı (E tablosu); iş paketleri WP1-WP6 + 5 karar sorusu hazır. Sonraki oturum: onay → WP1'den başla.

## Faz 3 — Kat & zone çoğaltma & roller 🔧 (D-016 ile yeniden çerçevelendi)
- ✅ **3a ZONE-2 ÇALIŞIR (GECE 3/7, 2026-06-10; SAVE 17→18):** Per-zone TEMALI ocak+bulaşık (D-022) uygulandı.
  **Model:** LAYOUT zone-şablonlu (zone-1 koordinatları AYNEN = şablon; zone-2 = +X offset ZONE_DX 12);
  global düz diziler (tables 8 slot — 0-3 z1 / 4-7 z2, stations[2], dishStations[2], upgradeZones[2],
  waiterHomes/dishwasherHomes/waiterUpgradeSpots[2], entrances/streets[2]); eski tekil alanlar zone-1 alias.
  **Masa indeksleri GLOBAL BİTİŞİK** (zone2 pad'i table4 ister → yapısal; derived'da savunmacı kelepçe) →
  NPC/dish/tableLevels kodu neredeyse değişmedi. **Bölme duvarı** (x=6.0) oyuncu+nav solid'i, ortada HEP açık
  GEÇİT (z=-0.75±0.9); zone-2 kilitliyken karanlık örtü (LockedZoneShade) + boş salon; 'zone2' pad'i geçit
  ortasında (₺1200 GECE başlangıcı — sabah curve onayıyla kalibre). **Per-zone state:** stationLevels[]/
  waiterLevels[] PERSIST (**SAVE v17→v18 migrasyonu**: skalerler zone-1'e); readyCupsByZone/brewProgressByZone/
  upgradeFills/waiterUpgradeFills/waiters/dishwashers transient diziler. **cleanCups GLOBAL tek depo**
  (totalCupPool = zone×poolBase + Σseviye×perLevel; unlock poolBase ekler) → korunum değişmezi global sürer.
  **Personel per-zone:** garson/bulaşıkçı yalnız kendi zone'unun masa/ocak/lavabosuna bakar; zone-2'de yeniden
  tutulur (z2waiter/z2dishwasher pad'leri). **Müşteri kendi zone kapısından** girer/çıkar (streets/entrances per
  zone; moveAvoid zone-içi kalır). **Quest hattı +7 görev** (q_zone2 → q_z2serve → z2 masa/garson/bulaşıkçı
  zinciri). FILL id'leri zone'lu ('tea:z','waiterUp:z'). derivedFromPads → zonesOpen/tablesByZone/hasWaiterByZone/
  hasDishwasherByZone (+geri-uyum tables/hasWaiter=z1). Scene: çift kapı+söve, bölme duvarı, geniş zemin/sokak,
  per-zone ocak/lavabo/marker'lar; Waiter/Dishwasher bileşenleri dizi. devHooks geri-uyumlu (eski anahtarlar=z1,
  yeni `zones[]`). **Doğrulama: vitest 85/85 (5 yeni zone testi: derived/savunmacı/store-entegrasyon/korunum/
  v18 migrasyon), build temiz, sim ilk-alım 60sn SABİT, smoke 27/27, Playwright canlı: zinciri oyna→zone2 aç→
  2. ocak demler→oyuncudan pickup→z2 masasına müşteri→geçitten input'la GEÇİLİR (8.55) / duvar BLOKLAR (5.4),
  konsol 0 hata.** Screenshot: night-3-zone2-station.png + night-3-zone2-locked.png. Tasarım: docs/zone2-design.md.
- ✅ **WP1 hızlı bug paketi (GECE-2 1/6, 2026-06-11; feedback-2026-06-11.md §E):** 5 fix:
  (1) **table2 pad gate:** aktif görevin hedef pad'inde TEMPO gate'leri (minLifetime vb.) atlanır,
  `prev` omurga zinciri güvenlik ağı olarak kalır (visiblePads). (2) **questFocusPos zone parametresi**
  (+QuestDef.zone; z2 görevleri zone:1) → z2 görevinde kamera artık zone-2'ye bakar; serveTea odağı
  zone alanı ortası. (3) **camFocus tick-içi öncelik** (requestFocus: reveal 1 < görev 2 < zone 3;
  düşük yükseği ezemez) + TTL eşitlendi (zone +1 kalktı) + kamera-iptal deadzone 0.1→0.25 (joystick
  titremesi odağı bozmasın). (4) **toast z-index 15** + max-width (görev kartının altında kalmaz/taşmaz).
  (5) **OFFLINE NERF (kullanıcı bizzat istedi):** rateMult 0.5→0.2 + YENİ capNextPadFrac 0.6 = para
  tavanı (sıradaki omurga pad maliyetinin %60'ı; pad'ler bittiyse en pahalı pad referans) —
  `computeOfflineEarned` saf helper. Kapa-aç 7k bug'ı kapandı (z1-sonu tavan: 1200×0.6=720₺).
  **Doğrulama: vitest 89/89 (4 yeni), build temiz, sim İDEALİZE ilk-alım 60sn SABİT, smoke 27/27.**
- ✅ **WP2 DÜNYA v2 (GECE-2 2/6, 2026-06-11; D-024 — D-022 fiziksel revizyonu):** duvarsız TEK SALON
  (divider solid+görsel+geçit SİLİNDİ; kilitli zone = karanlık örtü + zemin sınır çizgisi; oyuncu açık
  zone'lara openMaxX clamp'li), TEK KAPI (entrances/streets tek nokta; Walls/Street uniq kapı), mutfak =
  SOL DUVAR L-ŞERİDİ (ocak modülleri sol duvara paralel +90° dönük, zone açıldıkça öne uzar; bulaşık arka
  duvar dibinde kısa kol; L-köşe dolgu tezgâhı), upgradeZones modül önünde (≥2.9 değişmezi), ÇAYCI NPC
  (KitchenStaff — koridorda yürür/eğilir, salt görsel), DEPO/TUVALET ek odaları + MERDİVEN rezervi.
  Per-zone MEKANİK ve SAVE v18 DEĞİŞMEDİ. waiterHome/upgradeSpot sol-ön köşeye (marker çakışması ölçülüp
  düzeltildi). **Doğrulama: vitest 89/89, build temiz, smoke 27/27, Playwright canlı (şerit pickup, z2
  müşterisi tek kapıdan, z2 kamera [12,0,1.5], konsol 0 hata).** Screenshots: night2-wp2-strip.png,
  night2-wp2-landscape.png, night2-wp2-frontleft.png (kök, git-ignored).
  ⚠️ Denge notu (sabah): zone-2 servis mesafesi arttı (şerit solda) — telefon testi + curve Ö1-Ö4 ile ele alınmalı.
- ✅ **WP3 KARAKTER ASSET'LERİ (GECE-2 3/6, 2026-06-11):** Quaternius Ultimate Modular Men+Women (CC0,
  License.txt doğrulandı) → 10 model `public/assets/models/characters/*.glb`. **Pipeline:**
  `tools/optimize-chars.mjs` (@gltf-transform: yalnız Idle/Walk/Run/Wave/Interact kaldı 24→6,
  resample+dedup+prune+quantize KHR_mesh_quantization=decoder'sız, gltf→glb ~3MB→~0.95MB).
  **`Character.tsx`:** SkeletonUtils.clone (bağımsız iskelet) + useAnimations crossfade + preload +
  primitive fallback (offline/hata güvenli). **Entegrasyon:** OYUNCU=Worker (Run/Idle, tepsi grupta),
  GARSON=Suit, BULAŞIKÇI=Casual_Hoodie (pos-delta'dan Walk/Idle), MÜŞTERİLER=8 modellik havuz
  (id→deterministik; hep farklı), ÇAYCI NPC=W_Casual (Walk volta). Ölçek 0.58 (masa oranı ölçüldü).
  Oturan müşteri tabure içine gömülür (Sit anim YOK — UAL Pro $9.99 sabah kararı; tepsi/carry de öyle).
  **Doğrulama: vitest 89/89, build temiz, smoke 27/27, Playwright canlı (karakterler+anim, konsol 0).**
  Screenshots: night2-wp3-scale2.png, night2-wp3-final.png. Manifest güncellendi (README.md).
- ✅ **WP4 GÖRSEL KİMLİK v2 (GECE-2 4/6, 2026-06-11):** (1) **Zemin = canvas-tile PARKE**
  (`floorTexture.ts` üreteci: 128px parke/fayans tile + RepeatWrapping, cache'li; WP6 mağaza temaları
  aynı üreteçten; renkler palette.ts) — kilim masa halısı olmaktan çıktı, zone ortasında KÜÇÜK vurgu
  kilimi (3.6×2.5). (2) **Masa ŞEKİL evrimi** (§C13): L0 kare 4-ayak → L1 yuvarlak+çuha → L2 +bordo
  etek → L3 sekizgen+laci+pirinç bant → L4 altın örtü+etek+bant (collision sabit). (3) **KLASİK ÇAY
  OCAĞI** (§C15): paslanmaz tezgah + koyu kuzine + İKİ KATLI çaydanlıklar (sayı=1+seviye, max 5; çelik
  kazan+kırmızı emaye demlik+kulp+ağız) + musluklu boyler (renk seviyeyle ısınır) + buhar. (4) **TV'DE
  MAÇ OYNAR** (§C16): saha+orta çizgi+gezen top+skor bandı+parlaklık titremesi. (5) **KİRLİ MASA A/B**
  (§C17): `DIRTY_VARIANT='dirty'` AKTİF (tabla lekeleri + dönen sünger+köpük ikonu); 'cloud' (eski
  yeşil duman) tek satırlık sabitle geri gelir — screenshots: night2-wp4-dirty-A.png (duman) /
  night2-wp4-dirty-B.png (kirli+sünger), SABAH SEÇİMİ. (6) **Dekor** (§C11): detaylı çöp kovaları
  (kapı+mutfak), iç saksılar (3 köşe), duvar saati. **Doğrulama: vitest 89/89, build temiz, smoke
  27/27, Playwright canlı (parke/ocak L3 4-çaydanlık/L4 masa/TV; konsol 0).** Screenshots:
  night2-wp4-kitchen.png, night2-wp4-station-l3.png, night2-wp4-table-evolution.png.
- ✅ **WP5 TEK DOLUM GÖSTERGESİ (GECE-2 5/6):** alt-orta zone-bar (HUD+CSS) + baş üstü HeadRadial
  (Player) KALDIRILDI; tek kaynak = dünya-içi pad halkası (GroundMarker progress). Feedback §D18.
- ✅ **WP6 KOZMETİK MAĞAZA (GECE-2 6/6, 2026-06-11; SAVE v18→v19):** zemin (4: parke/fayans/dama/ceviz)
  + duvar (3: krem/yeşil/mavi) temaları ZONE-BAŞINA ₺ ile satın alınır (10-18k; feedback §D19 "pahalı,
  para hedefi"). Config: `economy.config.cosmetics`; görsel: palette `FLOOR_THEMES/WALL_THEMES` +
  canvas-tile üreteci (WP4'tekiyle AYNI). Store: `floorThemeByZone/wallThemeByZone/ownedCosmetics`
  persist (v19 migrasyon) + `buyCosmetic(kind,id,zone)` (sahiplik kalıcı — geri dönüş ücretsiz; kapalı
  zone reddedilir). Sahne: Ground per-zone tema overlay; Walls zone-bölmeli tema (arka duvar sınırda
  ikiye, sol/sağ dış duvar kendi zone'u). UI: fırça `BrushIcon` butonu (dişli sütunu) → Dekor Mağazası
  modalı (swatch+ad+fiyat+S1/S2 uygula; seçili ✓ altın). **Doğrulama: vitest 91/91 (buy+v19 migrasyon),
  build temiz, smoke 27/27, Playwright GERÇEK tıklamayla satın alma (10k düştü, fayans+yeşil uygulandı,
  reload sonrası persist ✓), konsol 0 hata.** Screenshots: night2-wp6-shop.png, night2-wp6-themes2.png.
- ✅ **SABAH FEEDBACK GERİ ALMASI (2026-06-11, kullanıcı kararı):** WP3+WP4'ün bir kısmı GERİ ALINDI
  ("assetler çok kötü; karakterler küçük, zemin iğrenç, çay ocağı birleşmesi kötü; My Hotel tarzı olmalı"):
  (1) **Karakterler → primitive** (Quaternius 10 glb + Character.tsx + optimize-chars.mjs + @gltf-transform
  SİLİNDİ; Player/Waiter/Dishwasher/Customers/çaycı NPC eski parçalı-gövde/kapsül; HeadRadial GERİ GELMEDİ
  — WP5 korundu). (2) **Zemin → DÜZ renk** (floorTexture.ts canvas-tile silindi; WP6 mağaza temaları
  KORUNDU — zone overlay temanın düz base rengi, swatch base+alt; kilim eski büyük boy 6.6×4.6).
  (3) **Çay ocağı → eski semaver** (kuzine/çaydanlık katları/boyler gitti). (4) **Bulaşık → eski**
  (lavabo üniteleri + yeşil koku bulutu; leke+sünger B-varyantı gitti — A/B kararı kapandı).
  KORUNAN WP4: masa şekil evrimi, TV maç, dekor prop'ları. (5) **Çay yükseltme pad'i ocağın hemen
  yanına** (upgradeZones [-2.4,-3.4]/[-2.4,-0.8]; geometri testi "pad merkezi pickup dışında +0.3"
  olarak gevşetildi — pickup-guard testi asıl emniyet). (6) **Zone'lar bitişik** (ZONE_DX 12→10.6,
  zoneBorderX 5.3; duvarsız boşluk kapandı; TUVALET/MERDİVEN rezervleri kaydı). **Asset kararı açık:**
  yeni karakter paketi kullanıcıyla seçilecek (UAL/Synty linkleri verildi). **Doğrulama: vitest 91/91,
  build temiz, Playwright canlı (primitive karakterler, düz zemin, bitişik salonlar, pad ocak yanında,
  konsol 0 hata).**
- ✅ **YERLEŞİM v3 (2026-06-11, kullanıcı feedback turu-2; D-025):** per-zone AYNALI mutfak (z1 ocak
  sol / z2 ocak sağ duvar; bulaşık ARKA duvarda ocaktan ayrı; her zone kendi çaycısı) → zone-2 garson
  turu ~21sn→~10sn < sabır 18sn (ölçüm: 180sn'de 50 servis, kaçan yok). Masalar sağa+yukarı (kolon
  -1.2/3.2, sıra -0.6/2.2; açılış ön sıradan), masa pad'leri kapı-tarafı çaprazda (ocağa girmez),
  çay pad'i ocağın yanında ferah. KARE masa evrimi (örtü→etek→pirinç bant→altın; yuvarlak/sekizgen
  gitti) + sandalye=min(4,seviye+1) + sandalye masaya 0.78. Kilim toprak-bordo + masa bloğuna ortalı.
  Mağaza fix: dama=büyük quad satranç deseni (düz beyaz bug'ı), zemin overlay duvara kadar (eski renk
  şerit bug'ı). KARAR: 2 garson (salon başına 1; 3.sü fazla otomasyon — D-014). **vitest 91/91, build
  temiz, smoke 27/27, Playwright canlı (2 zone kurulu, dama+yeşil duvar gerçek satın alma, L4 masa),
  konsol 0 hata.**
- ✅ **D-025 rev. A (2026-06-11 turu-3, kullanıcı seçimi):** bulaşık kendi ocağının bitişiğine (yan
  duvarda TEK mutfak bloğu, z2 aynalı) + garson yavaşlatıldı [1.5,2.0] (onaylı; tur ~12sn < sabır 18)
  + masa sıraları yukarı + bulaşıkçı pad'i ferah + görev zoom'ları canlı doğrulandı. vitest 91/91,
  smoke 27/27, konsol 0.
- ✅ **KARAKTER YÜKSELTME SİSTEMİ v20 UYGULANDI (2026-06-11/12; tasarım: docs/character-upgrades-design.md):**
  `economy.config.character` (tepsi [2..6] 150/500/15k/60k · mıknatıs [2.6..5.0] 250/900/2.8k ·
  hız [4.5..5.4] 400/1.4k/4.5k) + türeticiler; eski sabitler (serving.trayCapacity / money.attractRadius /
  player.moveSpeed) kademeden türetilir oldu. **SAVE v19→v20**: eski kayda T2 hediye (kapasite 4 korunur),
  questIndex İD-EŞLEMELİ (entryV≥16; v<16 seedQuestIndex hediye değerleriyle), charPanelSeen persist.
  3 charStat görevi onaylı zamanlamada; charStat'ta kamera sıçramaz. HUD sol küme YATAY 4-buton
  (genişlik ≤ seviye pill, 390px'te 116≤130 ölçüldü) + CharacterPanel (mini Canvas 3/4 açı + canlı
  tepsi önizleme pop + 3 kart) + altın nabız/"!" + tek-seferlik spotlight. `__buyChar` kancası;
  sim'e karakter alımları (T1 ~4dk idealize). **vitest 99/99, build, smoke 27/27, Playwright
  gerçek-tıklama, konsol 0.** (commit 0955e21)
- ✅ **ZONE-2 TAM GİZLEME + REVEAL (2026-06-11/12 kullanıcı feedback'i):** kilitli salon opak karanlık
  HACİMLE örtülü (hiçbir şey görünmez); pad açılınca ~1.8sn karanlıktan aydınlığa fade + kamera panı.
  zone2 pad'i eşiğin zone-1 tarafına (x 4.55). **ÇAYCI v2:** ayrı bacak+ayakkabı, tepsiye uzanan
  simetrik kollar+eller, göz/burun; panel kadraj düzeltildi. YENİ APK kökte (5.1MB). (commit 2c80a20)
- ✅ **ZONE-2 YÜKSELTME GATING'İ v21 (2026-06-12, kullanıcı: "zone-2'de de düzen olmalı"):** zone-1
  deseni per-zone aynalandı — z2 ocak yük. z2table2 sonrası (`upgradeRequiresByZone`); z2 masa yük.
  z2table4 sonrası (`tableUpgradeUnlockedZ`); z2 garson hızlandırma KENDİ garsonunun 20 taşıması
  (`stats.waiterServedByZone`, **SAVE v21** migrasyonu: global→z1 + z2waiter tutulmuşsa eşik tohumu);
  reveal toast'ları zone-başına ("Salon 2:" öneki + kendi pan hedefi). vitest 104/104, sim tempo aynı,
  smoke 27/27, Playwright canlı gating doğrulandı, konsol 0.
- ✅ **TELEFON FEEDBACK TURU-1 (2026-06-11, v21 APK testi; SAVE v21→v22):** (1) müşteri takılma KÖK
  çözümü — müşteriler salon içinde navStep/BFS (moveAvoid SİLİNDİ; ön-sıra masa kapı↔arka-koltuk
  arasında kilitliyordu, masa süresiz rezerve kalıyordu) + 30sn vazgeçme sigortası; (2) karanlık örtü
  hacmi KALDIRILDI → duvarlar yalnız AÇIK zone'ları sarar (kilitli zone-2 = boş arsa: overlay/kilim/
  tuvalet/merdiven çizilmez; sağ duvar zone sınırında = "görünmez engel" duvara dönüştü); (3) çay
  yükseltme pad'i ocağın ALTINA sol duvara ([-4.35,-0.5]; garson pad'i [-4.6,2.2]'ye kaydı, ayrım 2.71);
  (4) tepsi T1/T2 75/150 (kullanıcı kararı; T3/T4 dokunulmadı); (5) toast ALT-ORTA + krem kart +
  tür-bazlı SVG madalyon (GameNotice.kind; emoji prefix kalktı); (6) q_zone2 yükseltme görevlerinin
  ÖNÜNE (yeni sıra ...q_charMagnet→q_zone2→q_waiterL2→q_tableL2→q_z2serve...; v22 İD-eşleme +
  q_zone2-atlanmış-kayıt güvenlik kelepçesi). vitest 110/110, build, sim (zone-2 ~32dk), smoke 27/27,
  Playwright canlı (duvar/reveal/migrasyon/toast/arka-masa müşterisi), konsol 0. (Henüz commit'lenmedi.)
- ⏳ **3a kalan:** zone 3-4 (tost/TV konsepti) + kat planındaki servis odaları (floorplan-master.md).
- ⏳ **3b:** Kat geçişi: kat dolunca **merdiven** açılır → ekran kararma → üst kat; dinamik bounds/kamera; SAVE bump.
- ⏳ **3c:** Tuvalet ODASI + DEPO (KATA özel, parayla açılır) + tuvalet kâğıdı döngüsü (depodan al→tak) + temizlikçi.
- ⏳ **3d:** Menü çeşitliliği (kahve/tost — mutfak şeridine eklenir). Okey/tavla/nargile üst katlar.
- NOT: KASA YOK (D-012/D-016). Bulaşık zone'a özel, tuvalet+depo kata özel. Görsel: primitive = nihai stil (D-013).

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
