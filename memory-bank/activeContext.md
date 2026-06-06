# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz (2026-06-06)
Faz 0 + Faz 1 ✅. **Faz 2 (2a–2f) BİTTİ.** SAVE_VERSION **10**, max tepsi **6**.
**YENİ TASARIM KİLİDİ: D-016** (kullanıcı onayı 2026-06-06) — D-012 "açık-alan salon"u **kat + zone ızgarası** ile
DEĞİŞTİRDİ. Çok turlu tasarım tartışması sonucu yol haritası revize edildi (aşağı bak). **Sıradaki: Faz 2g** (his/yerleşim/
collision/tuning, tek zone). docs'a yazıldı: decisions.md D-016, progress.md (2g/2h/2i + revize Faz 3).

**D-016 özeti (tam metin decisions.md):**
- **ZONE = atomik birim:** 1 ocak + 1 bulaşık + 1→4 masa (pad) + ops. garson/bulaşıkçı. **1 ocak:4 masa, paylaşımsız.**
  Başlangıç 1 ocak(L1)+TEK masa; 2.→3.→4. masa omurga pad'iyle.
- **Tek kapı + rastgele oturma**; oturma havuzu global, **servis kaynakları (ocak kuyruğu/garson/bulaşıkçı) zone'a bölünür.**
- **KAT modeli:** kat = max ~4 zone (2×2); kat dolunca merdiven→kararma→üst kat. Üst katlar: balkon/okey/nargile.
- **Açma SIRALI** (omurga, büyük yeşil disk) **vs Yükseltme SERBEST/paralel** (sıra yok, açılan her obje; küçük altın
  halka+rozet, parası yetince parlar). Yükseltme kavramı **2. masa açılınca** tanıtılır.
- **Masa yükseltme = BAHŞİŞ↑ (`tipBase×seviye`, öneri tipBase=2) + sabır↑**, zone-başı. Çay fiyatı SABİT (D-010).
  Bekleme-süreli bahşiş Faz 4'e ERTELENDİ.
- **Bulaşık zone'a özel; Tuvalet+Depo KATA özel** (kâğıt döngüsü: depodan al→tak→temizlikçi).
- **Yerleşim:** mutfak sol-üst duvara 0 (arkası geçilemez), masalar sağda, dar başlangıç, **collision**. Şekil değişimi Faz 6 asset.
- **Onboarding** ilk sefere özel (masa-açma). **Garson yavaşlatılır**, tempo simulate ile dengelenir.

Önceki kilitler korunur: **D-011** (servis) ✅, **D-013** (primitive=nihai stil), **D-014** (garson opsiyonel pad) ✅,
**D-009** (mekânsal etkileşim), **D-015** (state türetme). D-012'nin KASA-YOK/bölge-başı-personel/manuel-toplama parçaları geçerli.
Tam servis tasarımı: `docs/serving-and-automation.md` (zone/kat detayı D-016'da).

## En son ne yapıldı (bu oturum — Faz 2g his/yerleşim/collision/tuning, D-016) — YERLEŞİM v3
Çok turlu tasarım → D-016 kilitlendi. Yerleşim 4 kez revize edildi (kullanıcı önizleme feedback'leri); **v5 GEÇERLİ.**
- **v5 (2026-06-07 #4 — GEÇERLİ):** Kullanıcı: "iğrenç, sandalyelerden yürüyemiyorum (koridorlar tıkalı); karakterler
  alana göre çok iri → ALAN BÜYÜMELİ HEM DE BAYA." → ölçek düzeltmesi: alan büyütüldü + masalar köşelere yayıldı.
  - **BÜYÜK alan** `area={minX:-5.5,maxX:5.5,minZ:-5.0,maxZ:4.5}`; masalar **köşelere yayık 2×2** (kolon x -2.5/2.5 gap 5,
    satır z -2.2/1.4 gap 3.6) → orta geniş yürüme alanı, sandalyeler kenarda (koridor tıkanmaz). Kamera d 7→9 (karakterler
    alana göre küçük görünür). Mutfak arka duvarda: ocak[-3.0,-4.4], bulaşık[-1.0,-4.4] (dist 2.0>washR), semaver[1.0,-4.4].
    upgradeZone ocağın solu [-3.5,-3.0]; trayUpgradeZone [0,3.8]; entrance/player orta-ön [0,..]; personel x±4.8.
  - Önceki davranışlar korunur: müşteri+garson+bulaşıkçı masa gövdesinden DOLAŞIR (`moveAvoid`+`tableSolids`); oyuncu
    collision HAPSETMEZ; bulaşıkçı toplama mesafe-tabanlı; `hitsSolid(r)` yarıçaplı. smoke park (5.2,4.2).
  - Görsel doğrulandı (ekran görüntüsü): büyük ferah salon, 4 masa dört köşede, orta açık, karakterler uygun ölçekte.
  - **Collision footprint düzeltmesi (kullanıcı: "masaya çok sokulmam gerekiyor, arada boşluk fazla"):** `*Half`'lar
    GÖRSEL mesh'e yaslandı → "değiyor gibi" sokulma, boşluk yok. stationHalf [0.8,0.6]→[1.1,0.4] (ocak tezgah 2.2×0.8),
    dishHalf →[0.7,0.4] (bulaşık 1.4×0.8), tableHalf →[0.5,0.5] (masa r0.5), chairHalf →[0.22,0.22] (sandalye 0.42).
    playerRadius 0.35 (=kapsül görsel yarıçapı → standoff görsel kenara denk). **'samovar' collision KALDIRILDI** (ayrı
    görünür mesh'i yok → görünmez duvardı); `activeSolids(tables)` (padsDone param atıldı). Vitest 44/44, smoke 19/19, build temiz.
  - **Mobilya KATI (zorlasan da geçilmez):** oyuncu collision'ı ayrıştı — MOBİLYA katı (hapsetme istisnası YOK → zorlasan da
    içine geçmez), eksen-başı kayma (diyagonalde süzülür, kafa kafaya gelince DURUR); AKTÖRLER (npc/garson/bulaşıkçı) yumuşak
    (hapsetmez). NOT: kısa süre denenen "kafa kafaya kenardan otomatik kayma (deflection)" kullanıcı isteğiyle GERİ ALINDI
    (daha kötü hissettirdi); sadece "zorlayınca içine geçmesin" kaldı. Vitest 44/44, smoke 19/19, build temiz.
- **v4 (terk):** orta-boy/hizalı ama sandalyeler koridor tıkadı + iri ölçek. v3 çapraz-geniş, v2 dar (hepsi terk).

**Eski v2 detayı (referans, geçerli değil):**
- **Yerleşim v2 (LAYOUT, store.ts) — SOLA-YASLI KOMPAKT BLOK:** mutfak (ocak `[-2.7,0,-3.0]` + bulaşık `[-1.0,0,-3.0]` +
  semaver `[0.6,0,-3.0]`) sol-ARKA köşede duvara 0; **masalar mutfağın TAM ÖNÜNDE** (aynı sol blok) — 2×2 x -2.0/0.0,
  z -1.2/0.9 (seat=table z+1.0). "Çapraz/geniş" duruş gitti. **Asimetrik oynanabilir alan** `area={minX:-3.5,maxX:2.5,
  minZ:-3.6,maxZ:3.4}` (içeriği sıkı sarar → boş sağ taraf yok; `bounds` alanı KALDIRILDI). upgradeZone `[-2.7,0,-2.0]`
  (ocak-masa arası boşluk; oyuncu ocağa dayanır, PAD_RADIUS 1.3 içinde → dolar); trayUpgradeZone `[-1.0,0,3.0]`; waiter/
  dishwasher pad `[-3.0,0,3.0]`/`[2.0,0,3.0]`, home `[-3.0,0,2.0]`/`[2.0,0,2.0]`; entrance `[-1.0,..,3.3]`, player `[-1.0,..,1.8]`.
- **Collision (D-016) — SABİT + DİNAMİK:** sabit = ocak/bulaşık/açık-masa/sandalye(seat)/(semaver alınmışsa); **dinamik =
  her müşteri + garson + bulaşıkçı** (`actorHalf`/`chairHalf`). `activeSolids()` sabitleri, hareket bloğu liveNpcs+waiter+
  dishwasher'ı ekler. Çözüm **yalnız input'la harekette** (eksen-başı kayma) → doğrudan setState/__teleport input'suz
  konumu ETKİLEMEZ → testler korunur. Oyuncu artık mobilya/müşteri/garson/sandalye içine giremiyor.
- **Tuning:** `waiter.moveSpeed 1.8→1.5`. Kamera `d 8→7`. Walls asimetrik `area`'ya göre çizilir (arka+sol+sağ; ön açık).
- **Smoke uyarlaması:** "uzağa park" konumları `(0,2)`/`(0,6.5)` → `(2.5,-3.0)` (sol-yaslı yerleşimde sağ-arka köşe tüm
  masalardan attract-yarıçapı dışı → garson-assist/kirli-birikim testleri sağlam).
- **Doğrulama:** **build temiz ✅, Vitest 44/44 ✅** (collision: önünde durma + input'suz teleport collision'sız),
  **sim 84sn sabit ✅, smoke 19/19 ✅, konsol temiz.** Önizleme: http://localhost:5173/
- Değişen: economy.config.ts, store.ts (LAYOUT v2+area+collision), Scene.tsx (Walls/kamera), tools/smoke.mjs,
  tests/logic.test.ts; decisions.md (D-016), progress.md, activeContext.md. **Henüz commit yok** (ortam git repo'su değil).
- **2g KALAN (opsiyonel):** müşteri spawn/sipariş tempo ince-ayarı + "sayı düzeni". NOT: SAVE_VERSION değişmedi (persist alan yok).

## (önceki oturum — Faz 2f görsel/animasyon/yerleşim cilası)
Kullanıcı 4 kararı onayladı: ızgara (istif değil), yerleşim bana bırakıldı (taşmasın yeter), react-spring'siz hafif
animasyon. (Asset sorusu yanıtlandı: animasyonlar = kod/bedava; 3D modeller = Faz 6, CC0 Quaternius/Kenney + AI Türk objeleri.)
- **(B) Max tepsi 8→6:** `economy.config.serving.trayUpgrade.maxLevel` 3→2 (L0=2/L1=4/L2=6). **SAVE_VERSION 9→10** +
  v9→v10 migrasyonu (eski L3 → max'a clamp) + store init savunmacı clamp.
- **(A) Taşıma öne tepsiye:** `Player.tsx` kafadaki DirtyStack KALDIRILDI; temiz(kırmızı)+kirli(gri) ellerin önünde tek
  tepside **3×2 ızgara** (CupTray, taşmaz). **"Eli boşken" kısıtı (store.ts):** servis `tray<cap && carriedDirty===0`,
  kirli toplama `tray===0` → tepside hep tek renk. Waiter/Dishwasher zaten önde taşıyor → değişmedi.
- **(C) Yerleşim (LAYOUT):** ocak `[-3.6,0,-3.6]` + bulaşık `[-1.7,0,-3.6]` sol-ARKA köşede BİTİŞİK mutfak bloğu;
  **bounds 7→5**; 4 masa 2×2 sıkı (x 0/2.6, z ∓1.2); upgradeZone/samovar/trayUpgrade/personel pad'leri eş-zamanlı
  çakışmayacak aralıkta (aktif fill ≥2.6, yıkama/fill ≥2.9); Scene kamera d 9→8. Render bileşenleri LAYOUT'tan okur → otomatik uydu.
- **(D) Juice (useFrame/damp, react-spring YOK):** para mıknatısı (aşağı bug-fix), toplanınca "+₺" floating (CSS `floatUp`
  keyframe, per-frame JS yok); `Player.tsx` baş üstü radial ilerleme (activeZone fill/cost; pad=yeşil, yükseltme=altın);
  `TeaStation.tsx` semaver buharı (Puff, 2 adet); `Customers.tsx` otururken idle bob; yeni `useFacing.ts` (damp yön
  dönüşü) Player/Waiter/Dishwasher/Customer'a uygulandı.
- **🐛→✅ Para mıknatısı bug-fix (kullanıcı gözlemi: "bir coin peşime takılıp arkama yapıştı"):** İlk uygulamada süzülme
  GÖRSEL-only'di (Coins.tsx mesh'i oyuncuya damp'lerken store toplamayı paranın ESKİ düşme konumuna göre yapıyordu) →
  oyuncu 1.4'e girmeden geçince para görsel olarak yapışıp asla toplanmıyordu. **Çözüm:** mıknatıs STORE'a taşındı —
  `economy.config.money.attractRadius 2.6/attractSpeed 9` (>oyuncu 4.5 → daima yetişir); tick'te attract içindeki coin
  `moveToward(player)` ile GERÇEKTEN akar, pickupRadius'a varınca toplanır. Coins.tsx artık yalnız `c.pos`'u çizer
  (görsel=mantık → "yapışan para" yapısal imkansız). coins map'inde `pos` klonlandı (mutasyon güvenliği). Yeni vitest:
  pickup'a hiç girilmeden mıknatısla toplanır + attract dışı çekilmez.
- **Doğrulama:** **Vitest 40/40 ✅** (eli-boşken kısıtı + v9→v10 clamp + kapasite 2→4→6 testleri eklendi), **build temiz ✅,
  sim 84sn ✅ (mantık değişmedi), smoke 19/19 ✅, konsol temiz, gözle doğrulandı** (kompakt köşe mutfağı, derli masalar, çakışma yok).
- Değişen: economy.config.ts, save.ts, store.ts (LAYOUT+kısıt), Scene.tsx, Player.tsx, Coins.tsx, Customers.tsx,
  TeaStation.tsx, Waiter.tsx, Dishwasher.tsx, index.css, tests/logic.test.ts, +yeni useFacing.ts; progress.md, activeContext.md.
  (Henüz commit'lenmedi — oturum-bitir'de.)

## (önceki — 2e-B tepsi yükseltme)
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

## TAM sıradaki adım (Faz 2g — his & yerleşim & collision & tuning, TEK zone)
D-016 kararıyla, çoğaltmadan ÖNCE tek zone'u mükemmel hissettir (şablon olsun). İş kalemleri:
1. **Yerleşim:** mutfak şeridi sol-üst köşede duvara 0 (ocak + bulaşık bitişik, arkası geçilemez); tost/kahve için sağına
   yer ayır; **masalar sağda** 2×2; **bounds küçült** (dar başlangıç → boş-büyük-alan hissi biter); kamera/duvar uydur.
2. **Collision:** ocak/bulaşık/masa = katı AABB engel; oyuncu içine giremez (kenardan kayar). (Personel hedefleri obje ÖNÜ;
   gerekirse onlara da uygula.) Yeni: footprint tanımı LAYOUT'a; store hareket çözümüne AABB push-out.
3. **Tuning:** `waiter.moveSpeed` düşür (çok hızlı); müşteri `spawnInterval`/`orderTime` temposu simulate ile yeniden
   dengele (frantik değil akışkan, ilk-alım hedefini koru); sayıları tek şablona topla.
4. Vitest + sim + smoke yeşil; progress/activeContext + (gerekirse) docs güncelle; SAVE_VERSION yalnız persist alan değişirse bump.
   NOT: tek-masa başlangıç ZATEN var (derivedFromPads tables=1); 2g'de masa SAYISI değil ALAN/HİS düzeltilir.

## Sonraki dilimler (kilitli plan — D-016)
- **2h:** masa yükseltme + bahşiş (zone-başı; 2. masa açılınca; bahşiş `tipBase×seviye` + sabır↑; SAVE bump).
- **2i:** onboarding/işaretçi katmanı (ilk masa-açma; sonraki açılışlar "Yeni ▲" rozeti).
- **Faz 3:** 3a zone çoğaltma (kat başına ~4 zone, 2×2 ızgara, zone-açma pad'i, stations türetme) · 3b kat geçişi
  (merdiven/kararma/üst kat) · 3c tuvalet+depo+temizlikçi (kata özel) · 3d menü (tost/kahve mutfak şeridine).

## Faydalı dev kancaları (konsol)
`__game()` (readyCups/tray/trayCap/trayLevel/waitingCount/stationPos/firstWaitingSeat + bardak döngüsü:
cleanCups/dirtyCount/carriedDirty/dishStationPos/firstDishPos/hasDishwasher/dishwasherTray/Pos +
trayUpgradeZonePos/upgradeZonePos), `__advanceTime(60)`, `__addMoney(1000)`, `__upgradeStation()`, `__teleport(x,z)`, `__resetGame()`.
Servis testi: ocağa ışınla (`__game().stationPos`) → tick → tepsi dolar; bekleyen koltuğa ışınla
(`__game().firstWaitingSeat`) → tick → servis.

## Hızlı komutlar
- `npm run dev` · `npm run build` · `npm run test` · `npm run sim`
- Duman testi: `npm run dev` (ayrı) → `node tools/smoke.mjs`
