# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz (2026-06-06)
Faz 0 + Faz 1 ✅. **Faz 2 TAMAMEN BİTTİ:** 2a, 2b, 2-UX (D-009), 2-EKO (D-010), 2c (D-011),
2d-garson (D-014), 2d-harita 1 ocak:4 masa (D-012), D-015 türetme, **2e-A (bardak döngüsü + bulaşıkçı) ✅,
2e-B (tepsi yükseltme 2→4→6→8) ✅.** SAVE_VERSION şu an **9**.
**Sıradaki: Faz 2f — görsel/animasyon/yerleşim cilası** (kullanıcı build incelemesi geri bildirimi; mantık
değişmez). Plan: `docs/visual-and-layout-polish.md`. **Faz 2f, Faz 3a'dan ÖNCE.** Ardından Faz 3a (zone genişleme).
**ÖNEMLİ:** 2f'ye başlamadan kullanıcıya 4 açık kararı sor (max tepsi 6 mı/istif mi, carry tek-tepsi-iki-renk
mi/kısıt mı, yerleşim 2f mi/3a mı, react-spring'siz hafif animasyon mı).

Servis/personel/zone modeli kullanıcı onayıyla KİLİTLENDİ:
- **D-011** (servis) ✅, **D-012** (zone/salon + bölge-başı personel + **KASA YOK** + tuvalet=oda + para toplama kalıcı manuel),
  **D-013** (primitive = nihai sanat stili), **D-014** (garson = opsiyonel/omurgayı kilitlemeyen pad ✅).
  Tam tasarım: `docs/serving-and-automation.md`.

## En son ne yapıldı (bu oturum — 2e-B tepsi yükseltme)
- **Tepsi kapasitesi yükseltilebilir** mekânsal noktayla (çay yükseltme deseni): **2→4→6→8** (`trayCapacityForLevel`
  = trayCapacityBase 2 + perLevel 2 × level; maxLevel 3). `LAYOUT.trayUpgradeZone` [0,0,4.5] (giriş önü, doğal yol).
  Gating `C.serving.trayUpgradeRequires` = prev table3. Maliyet `trayUpgradeCost` (costBase 80, growth 1.8), fillRate 60.
- **`trayLevel` PERSIST** (stationLevel deseni): store GameState + init(save.trayLevel) + saveNow yazar; tick'te
  `trayCapacity(trayLevel)` hem servis tepsisi hem kirli-toplama kapasitesi için. Ayrı transient `trayUpgradeFill`
  biriktirici (çay `upgradeFill` gibi). **SAVE_VERSION 8→9 + v8→v9 migrasyonu** (trayLevel eksikse 0, varsa korunur).
- Render: Scene.TrayUpgradeZone (mavi disk + 🫖). HUD tepsi chip'i `trayCapacity(trayLevel)`. devHooks: trayLevel,
  trayUpgradeZonePos, trayCap seviyeli. Yardımcılar: `trayMaxLevel`, `trayNextCost`, `trayUpgradeZoneUnlocked`.
- **NOT (test ortamı):** vitest **node** ortamında (jsdom yok) → `localStorage` yok, writeSave/loadSave sessizce no-op.
  Kalıcılık şema-düzeyinde migrate() ile test edilir; canlı yazımı **smoke** (gerçek tarayıcı) doğrular.
- **Doğrulama:** **Vitest 37/37 ✅, build temiz ✅, sim 84sn ✅, smoke 19/19 ✅** (3. masa aç → tepsi 2→6, L2).
- Değişen: economy.config.ts, save.ts, store.ts, devHooks.ts, Scene.tsx, HUD.tsx, tests/logic.test.ts, tools/smoke.mjs,
  progress.md, activeContext.md.

## (önceki — 2e-A bardak döngüsü + bulaşıkçı, commit f93de78)
- **Bardak SINIRLI kaynak:** demleme bir TEMİZ bardak harcar (`cleanCups`); temiz biterse demleme DURUR
  (yeni darboğaz → kirli topla/yıka çemberi zorunlu). İçen müşteri masada KİRLİ bardak bırakır (`dishes[]`,
  coins gibi mekânsal nesne). Oyuncu yakınlıkla toplar (`carriedDirty`, kapasite = trayCapacity) → **bulaşık
  noktasında** (`LAYOUT.dishStation` [-4.8,0,-3]) yıkar → temiz havuza döner. Havuz ocak seviyesine bağlı
  (`cupPoolCapacity` poolBase 10 + 2/lvl); seviye artınca (zone + upgradeStation) cleanCups += poolPerLevel.
- **Bulaşıkçı** = opsiyonel pad (`dishwasher`, ₺280, requires prev table3, garson deseni). `hasDishwasher`
  derivedFromPads'ten (D-015, effect `hireDishwasher`). FSM: en yakın kirliyi topla (kapasiteye kadar) →
  bulaşığa götür → yıka → boşta dishwasherHome [-4.8,0,1.5]. Oyuncudan yavaş/küçük → kısmi assist.
- **KORUNUM:** toplam bardak = havuz değişmezi (clean+ready+tray+carried+dishes+drinking+waiter.tray+
  dishwasher.tray); her geçiş atomik tek bardak taşır. Vitest'te totalCups() ile doğrulandı.
- **Kalıcılık:** bardak sayıları TRANSIENT (her oturum dolu-temiz başlar) → **şema değişmedi, SAVE_VERSION 8'de KALDI**
  (bulaşıkçı=pad zaten padsDone'da). Migrasyon gerekmedi.
- **Render:** Dishes.tsx (gri kirli), Dishwasher.tsx (gri-mavi kapsül + gri yığın), Scene.DishStation (lavabo),
  Player DirtyStack (sırtta gri), HUD 🧼 temiz / 🧽 kirli chip'leri, hint güncellendi.
- **devHooks:** cleanCups, dirtyCount, carriedDirty, dishStationPos, firstDishPos, hasDishwasher, dishwasherTray/Pos.
- **Doğrulama:** **Vitest 32/32 ✅, build temiz ✅, sim 84sn ✅ (idealize tempo değişmedi), smoke 18/18 ✅** (kirli üret→topla→yıka).
- Değişen: economy.config.ts, types.ts, store.ts, devHooks.ts, Player/Scene/HUD + yeni Dishes.tsx/Dishwasher.tsx,
  tools/simulate.ts (not), tests/logic.test.ts, tools/smoke.mjs, progress.md, activeContext.md.

## (önceki — garson anti-starvation)
- **Sorun (kullanıcı gözlemi):** Garson "en yakın bekleyene" gidiyordu → ön masalar sürekli dolunca arka masalara
  hiç gidemiyor, sabırları (18sn) dolup sessizce gidiyordu (kaçan gelir, kötü dağılım).
- **Çözüm:** `store.ts` garson teslimat bloğunda hedef "en yakın" → **"en acil" (sabrı en az kalan = en düşük `timer`)**;
  eşitlikte en yakın (`bestTimer`/`bestDist`, 1e-6 epsilon). Timer'lar aynı hızda azaldığından kararlı FIFO, salınım yok.
  Garson hız/tepsi limiti AYNI → D-014 "partial assist" tasarımı korunur (oyuncu hâlâ gerekli). Ekonomi etkilenmez.
- **Test:** Yeni vitest — garsonu yakın masanın koltuğuna tepsi-dolu koy; yakın(timer17) vs uzak(timer2) bekleyen →
  yakın masa SERVİS EDİLMEZ (nearest olsa anında içerdi), garson uzak-acil masaya yaklaşır. **Vitest 26/26, build temiz, smoke 15/15.**
- Değişen: store.ts, tests/logic.test.ts, progress.md, activeContext.md. (Henüz commit'lenmedi.)

## (önceki — D-015 state türetme refactor'ı; commit 61b4e07)
- **`economy.config.ts`:** saf `derivedFromPads(padsDone) → {tables, stations, serviceSpeedMult, hasWaiter}` +
  `DerivedState` tipi. `SAVE_VERSION 7→8`. (stations şu an hep 1; Faz 3a addStation pad'leriyle artacak.)
- **`store.ts`:** GameState yine `tables/stations/serviceSpeedMult/hasWaiter` alanlarını TUTAR (bileşenler okur) ama
  bunlar artık YALNIZ `derivedFromPads`'ten set edilir. init save.padsDone'dan türetir (eski `min(stations,...)`
  kelepçesi kalktı). tick: başta `derived` (frame anlık görüntüsü, const); pad tamamlanınca SADECE `padsDone += id`,
  switch-effect mutasyonları silindi; sonda `out = derivedFromPads(padsDone)` → set + garson varlığı kurulur.
  saveNow türetilenleri yazmaz.
- **`save.ts`:** SaveData/defaultSave'den 4 türetilen alan çıkarıldı. migrate gevşek `d: Record` üstünde çalışır,
  sonda yalnız v8 alanlarını üretir; **v7→v8 adımı:** eski `hasWaiter:true` → `padsDone`'a `waiter` taşınır.
- **`tools/simulate.ts`:** State'ten tables/stations/serviceSpeedMult çıktı; rate/brewTime/gate `derivedFromPads`'ten
  okur; pad alımında yalnız `padsDone.push`. Ekonomi SABİT (ilk alım 84sn, table4 @7.5dk, semaver 14.9dk).
- **Testler:** garson testi `padsDone:['table2','waiter']` ile kuruldu (sahte `hasWaiter` set artık işe yaramaz);
  yeni testler: derivedFromPads tutarlılığı, **kayıttaki çelişen sahte `tables/hasWaiter` türetmeye SIZAMAZ**,
  **store pad açıldıkça daima `derivedFromPads(padsDone)` ile tutarlı (desenkronizasyon üretilemez)**.
- **Doğrulama:** **Vitest 25/25 ✅, build temiz ✅, sim 84sn ✅, smoke 15/15 ✅.**
- Değişen dosyalar: economy.config.ts, store.ts, save.ts, tools/simulate.ts, tests/logic.test.ts, progress.md,
  decisions.md, activeContext.md. (Henüz commit'lenmedi — oturum-bitir'de.)

## (önceki oturum — 2d-harita, D-012 1 ocak : 4 masa)
- **Başlangıç salonu 1 ocak : 4 masa'ya çekildi.** Omurga pad zinciri: 2.Masa → (ocak L≥1) → 3.Masa →
  **4.Masa (YENİ, addTable, cost 300/fillRate 75, requires prev table3)** → Semaver (requires prev table4).
- **`station2` omurgadan ÇIKARILDI** (D-012: 2. ocak Faz 3a'da yeni salonla otomatik gelir). `addStation` effect
  tipi pads'ten düştü → store.ts ve simulate.ts'teki `case 'addStation'` (ölü) kaldırıldı; `extraStationSpeedFactor`
  config'te Faz 3a için kaldı. tick'teki `stations` artık `const`.
- **LAYOUT:** tek ana ocak `[0,0,-5]`; 4 masa 2×2 derli toplu (x ±2.5, z -1.5/1.2; seat = table + z+1.1).
  padPos table2/table3/table4 masa slotlarında; **samovar sağ-ön [1.6,-3.4]**, **upgradeZone sol-ön [-1.6,-3.4]**
  (çakışmaz); waiter [-4.5,4], waiterHome [4.5,4]; player start [0,2.5]. `stations` artık tek elemanlı dizi.
- **SAVE_VERSION 5→6 + migrasyon (v5→v6):** station2 padsDone/padFills'ten çıkarılır, `stations=1` kelepçe
  (ilerleme/₺ korunur). init'te de savunmacı `min(save.stations, LAYOUT.stations.length)` → eski çok-ocaklı kayıt taşmaz.
- Render bileşenleri (Pad/Scene/Tables/Stations) veri-güdümlü → table4 otomatik geldi, station2 düştü, kod değişmedi.
  smoke.mjs de pozisyonları kancalardan okur → değişmedi.
- Testler: **Vitest 21/21 ✅** (table4 omurga adımı, v4→v6 + v5→v6 migrasyon), **build temiz**, **sim ilk-alım 84sn**
  (omurga ~15dk, table4 @7.5dk), **smoke 15/15 ✅** (tek-ocak yerleşiminde servis+garson assist+yükseltme L0→L4).
- Değişen dosyalar: economy.config.ts, store.ts, save.ts, tools/simulate.ts, tests/logic.test.ts, progress.md, activeContext.md.
- Commit `2105083` push'landı.

## Takip düzeltmesi (aynı oturum — eski-kayıt masa+pad çakışması)
- **Bulgu:** Kullanıcı eski kayıtla açınca "4. masa zaten var + üstünde pad" gördü. Tanı (geçici playwright scripti,
  A/B/C senaryoları): `tables=4` AMA `table4` padsDone'da yokken, `table4` pad'i çizili 4. masayla TAM aynı konumda
  ([2.5,0,1.2]) çakışıyor. Kök neden: `addTable` gating'i masa SAYISINA bakmıyordu (sadece `prev:table3`).
- **Düzeltme:** `addTable` pad'lerini masa sayısıyla senkronlama (i. addTable = (i+2). masa; masa çiziliyse pad done).
  **ÖNEMLİ:** kullanıcının kaydı ilk commit'te zaten v6'ya yükseldiği için (loadSave güncel sürümde migrate'i atlar)
  senkron ayrı **v6→v7** adımına konuldu ve **SAVE_VERSION 6→7** yapıldı → v6'da takılı bozuk kayıt da düzelir.
  Çakışma giderildi (currentPad=samovar). Kalıcı vitest testleri (v6→v7 senaryosu dahil).
- **Doğrulama:** Vitest **22/22**, build temiz. Commit `c0e9e24` (v6 fix) + sonraki commit (v7 bump) push'landı.

## TAM sıradaki adım (Faz 2f — görsel/animasyon/yerleşim cilası)
Kullanıcı build incelemesi geri bildirimi (2026-06-06). Tam plan + araştırma: `docs/visual-and-layout-polish.md`.
**Çalışan mantık doğru — sunum katmanı.** ÖNCE 4 açık kararı sor (docs §Açık kararlar), SONRA uygula:
1. **Carry kafadan→tepsiye + "eli boşken" kısıtı (✅ KARAR):** `Player.tsx` DirtyStack [0,1.05,-0.4] (baş)
   kaldır; taşınan ellerin ÖNÜNDEKİ tek tepside (tek seferde tek tür); baş üstü yalnız radial bar. Aynı düzeltme
   Waiter/Dishwasher. **Mantık kısıtı:** servis bloğu `tray<trayCap && carriedDirty===0`; kirli toplama `tray===0`
   (simetrik: temiz taşırken kirli toplanmaz, kirli taşırken temiz alınmaz → tepside hep tek renk).
2. **Max taşma:** ✅ KARAR — max kapasite **8→6** indirilecek (kullanıcı onayı 2026-06-06). trayLevel clamp +
   küçük migrasyon gerek. Sunum dizilimi (3×2 ızgara / istif) açık — sunuma sonra karar verilecek.
3. **Yerleşim:** `store.ts LAYOUT` ocak+bulaşık sol-arka köşede BİTİŞİK; bounds 7→~5; masaları sıkılaştır;
   Scene/kamera uysun. (Faz 3a zone zemini: tek "salon bloğu".)
4. **Juice:** pickup/drop scale-pop (useFrame/damp), coin uçuşu + "+₺" floating (drei Html), baş üstü radial
   progress (pad/yükseltme), semaver buharı, müşteri idle bob, yürüyüş yön dönüşü (damp). react-spring EKLEME.
5. Doğrulama: vitest + smoke (yeni kancalar) + sim 84sn yeşil; görsel his GÖZLE değerlendirilir.

## Faz 2f SONRASI sıradaki adım (Faz 3a — salon/zone genişleme)
docs/serving-and-automation.md §7 kilitli tasarım:
1. **Salon dolunca yeni salon kilidi açılır** (mevcut salonun tüm omurga slotları = 4 masa + semaver tamam → genişleme gate'i).
2. **Yeni salon açılınca oto 1.ocak + 1.masa kurulu gelir** (oyuncu hemen servis edebilir); gerisini parayla açar.
   → `addStation` effect tipi ve `extraStationSpeedFactor` BURADA devreye girer (şu an config'te bekliyor); `derivedFromPads`
   `stations` artık 1'e sabit değil, salon pad'lerinden türetilir (D-015 korunur).
3. **Bölge-başı personel slotları:** her salonun kendi garson/bulaşıkçı'sı (global havuz değil).
4. LAYOUT çok-salonlu olur; SAVE_VERSION bump + migrasyon; Vitest + smoke + sim yeşil; docs güncelle.
   AÇIK SORU (kod yazmadan önce sor): salon yerleşimi (yan yana mı, kapıyla mı?) + kamera/sınır genişlemesi.

## Sonraki dilimler (kilitli plan — docs/serving-and-automation.md §11)
- **Faz 3:** 3a salon genişleme (yeni salon + oto ocak/masa + personel slotu) · 3b tuvalet odası + temizlikçi · 3c menü (kahve/tost) + masa-yükseltme işlevi.

## Faydalı dev kancaları (konsol)
`__game()` (readyCups/tray/trayCap/trayLevel/waitingCount/stationPos/firstWaitingSeat + bardak döngüsü:
cleanCups/dirtyCount/carriedDirty/dishStationPos/firstDishPos/hasDishwasher/dishwasherTray/Pos +
trayUpgradeZonePos/upgradeZonePos), `__advanceTime(60)`, `__addMoney(1000)`, `__upgradeStation()`, `__teleport(x,z)`, `__resetGame()`.
Servis testi: ocağa ışınla (`__game().stationPos`) → tick → tepsi dolar; bekleyen koltuğa ışınla
(`__game().firstWaitingSeat`) → tick → servis.

## Hızlı komutlar
- `npm run dev` · `npm run build` · `npm run test` · `npm run sim`
- Duman testi: `npm run dev` (ayrı) → `node tools/smoke.mjs`
