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
- ⏳ **2-REDESIGN (D-017, kullanıcı onayı 2026-06-07 — SONRAKİ SOHBETTE uygulanacak):** Faz 2 cila redesign'ı, 6 adım:
  1. **Yerleşim:** masalar ocaktan UZAK (>2R=3.2, hedef ~5), bulaşık ocaktan AYRILMAZ (mutfak arka duvarda küme), gerekirse
     alan derinliği artar → tek noktada çay-al+servis/kirli-al+yıka imkânsız (yürüme döngüsü). nav/garson/işaret konumları uyar +
     "çakışma yok" testi.
  2. **Pad/işaret redesign:** küçük (~0.5) + **zeminde DÜZ yazı** (havada Html rozet yok); renk dili yeşil=aç/mavi=opsiyonel/altın=yükseltme.
  3. **Sıralı reveal + onboarding (ilk oyun):** hepsi-birden yok (öncekiyle etkileşilene dek gizli); 2.masa→garsona zoom (atlanabilir)→
     "3.Masayı Aç"→ocak yükseltme sonra; ilk-oyun sonrası "Yeni" rozeti. onboardStep persist.
  4. **Gating:** table3'ten minStationLevel:1 kalkar (2.masa→garson→3.masa); simulate yeniden denge (ilk-alım 84sn sabit).
  5. **Servis kısıtı GEVŞER:** çay+kirli BAĞIMSIZ taşınır (eli-boşken kısıtı deadlock yapıyordu — kirli birikip toplanamıyor).
  6. **Kamera sallanması fix:** CameraRig dt-bağımlı lerp + lookAt(tam oyuncu) → sallanma; kare-hızı bağımsız damping (konum+lookAt
     tutarlı) + dt clamp + fit/d sadece resize'da. (Kök neden bu oturumda teşhis edildi.)
  Detay: decisions.md D-017. Her adım Vitest+sim+smoke yeşil + gözle onay.
- ⏳ **2i (onboarding/işaretçi katmanı):** D-017 §3'e taşındı (yukarı). Eski tanım: ilk açılışta hareket + ilk masa-açma
  işaretçisi/zoom; sonraki açılışlarda küçük "Yeni ▲" rozeti.

## Faz 3 — Kat & zone çoğaltma & roller ⏳ (D-016 ile yeniden çerçevelendi)
- ⏳ **3a:** Zone çoğaltma: zone'u atomik modül yap, **kat başına ~4 zone (2×2 ızgara)**; zone-açma omurga pad'i;
  yeni zone'da oto 1.ocak(L1)+1.masa; `stations` türetme (D-015 korunur); tek kapı + rastgele oturma + zone'a bölünmüş servis.
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
