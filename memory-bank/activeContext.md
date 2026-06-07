# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz (2026-06-07 — GÜNCEL: D-019 madde 2-3 (reveal sırası + gating) + L1-başlangıç UYGULANDI, gözle onay bekliyor)
**Pad/yükseltme ÇIKIŞ SIRASI sadeleştirildi (kullanıcı: "2. masa açılınca birden 4 yükseltme geldi").** Yeni reveal:
başta sadece 2.Masa → 2.Masa açılınca **çay ocağı yükseltme + 3.Masa** → ocak bir kez yükselince **garson** belirir
→ 3.Masa açılınca **bulaşıkçı** → **4 masa da açılınca masa yükseltme işaretleri** (geç oyun). Böylece 2.masada 4 işaret
patlamaz. Config gating: `table3`'ten `minStationLevel:1` KALKTI (D-019 §2 — masa açmak yükseltme gerektirmez);
`waiter`'a `minStationLevel:1` EKLENDİ (garson reveal); `tables.upgradeRequires` `prev:['table2']`→**`prev:['table4']`**.
**L1-BAŞLANGIÇ (kullanıcı isteği):** çay ocağı + masalar GÖRSEL olarak **L1**'den başlar (iç stationLevel/tableLevels
0-tabanlı KALIR — ekonomi değişmez; sadece `activeZone.label` `seviye+1` gösterir; soft max → "Usta 💎"). **Sim BOTTLENECK
modeli:** `rate = min(talep tables/cycle, arz 1/brewTime) × (fiyat+bahşiş)` → tek ocak gerçek darboğaz; `trySpend` ocak
darboğazsa masadan ÖNCE ocağı yükseltir (akıllı oyuncu). **İlk-alım 84sn SABİT** (1 masada talep<arz → değişmez); ocak L1
@1.9dk emergent, 4.masa @8dk, masa-yük @15.7dk. SAVE_VERSION **13** (değişmedi). **Vitest 60/60, build temiz, sim 84sn,
smoke 20/20, konsol temiz.** Değişen: economy.config.ts (gating), store.ts (L1 etiket ×2), tools/simulate.ts (bottleneck+
akıllı ocak), tests/logic.test.ts (gating testleri yeni sıraya), tools/smoke.mjs (ocak→garson→table3/4→masa-yük sırası).
**ÖNİZLEME (gözle onay):** http://localhost:5199/ — 2.masa açınca artık 4 işaret patlıyor mu, ocak/masa L1'den mi başlıyor kontrol et.

### D-018 adım 5 — SEMAVER = OCAK ÜST YÜKSELTMESİ (samovar ayrı pad KALDIRILDI) — gözle onay bekliyor
Kullanıcı: "semavere geç pad'i kalkacaktı, ne zaman?" → ayrı `samovar` omurga pad'i (₺850, serviceSpeed ×0.7) **KALDIRILDI**.
Semaver artık çay ocağının üst yükseltmesidir (TeaStation seviyeyle büyüyen semaveri zaten çiziyor); omurga zinciri **table4'te
biter**. `derivedFromPads`'ten `serviceSpeed` case'i silindi (serviceSpeedMult hep 1; Faz 3a addStation için alan duruyor).
**EKONOMİ (sim bottleneck ile doğrulandı):** tek ocak ₺ L4 (throughput ×3.32) 4 masaya YETİŞİR → arz 0.553 > talep 0.512;
ilk-alım **84sn SABİT**, ocak L4 @8.7dk, masa-yük @10.2dk, lifetime 10k @35dk (samovar tasarrufu kalkınca biraz hızlandı).
"Usta" master tier (💎/video) Faz 4'e kaldı. **SAVE_VERSION 13→14 + v13→v14 migrasyon** (samovar padsDone+padFills'ten düşer,
ilerleme korunur). **Vitest 61/61, build temiz, sim 84sn, smoke 20/20, konsol temiz.** Değişen: economy.config.ts (samovar pad
+ serviceSpeed case sil, SAVE_VERSION 14), save.ts (v13→v14), store.ts (LAYOUT.padPos.samovar sil), simulate.ts (milestone),
tests/logic.test.ts (samovar referansları + v13→v14 testi).
**SIRADAKİ:** D-018 adım 6 (garson L2: 1.4→1.8, yan-kenar yükseltme kartı, persist waiterLevel) + D-019 madde 4 (yeni-özellik
bildirimi: özellik açılınca kamera zoom/pinboard) + D-017 §6 kamera damping.

### >>> KULLANICI PLANI (2026-06-07, oturum sonu) <<<
Kullanıcı kararı: **"tek zone'da olan HER ŞEYİ hallet → sonra ben baştan sona test edeyim → ardından zone yükseltme (Faz 3a)
kısmına geçeriz."** Yani Faz 2'nin tek-zone cilası TAM bitmeli (kalan: D-018 adım 6 + D-019 madde 4 + D-017 §6 kamera),
sonra kullanıcı tek zone'u uçtan uca oynayıp onaylayacak, SONRA Faz 3a (zone çoğaltma) başlayacak. **Bu oturum BURADA kaydedildi.**
Sonraki oturum: kalan tek-zone işleriyle başla (adım 6 garson L2 önce önerilir — küçük, izole, persist waiterLevel + SAVE bump).

### (önceki) D-019 madde 1 — KİRLİ MASA mekaniği (BİTTİ, gözle onaylandı)
**D-019 madde 1 (KİRLİ MASA) BİTTİ.** Her kirli bardak bırakıldığı masaya etiketlenir (`Dish.tableIndex`); bir
masada `cups.dirtyThreshold` (2)'den FAZLA = **3+ kirli → masa KİRLİ**: (a) masa üstünde alçak primitive yeşilimsi
"koku" bulutu (StinkCloud, Dishes.tsx; hafif bob), (b) **garson o masaya çay GÖTÜRMEZ** (`waitingNpcs` kirli masayı
filtreler), (c) **YENİ MÜŞTERİ OTURMAZ** (`findFreeTable(npcs, tables, dirty)` kirli masayı boş saymaz). Oyuncu
≤2'ye indirince masa normale döner. `dirtyTables(dishes)` helper export; devHooks `dirtyTables`+`dishesByTable`.
SAVE_VERSION **13** (DEĞİŞMEDİ — dishes transient, persist alan yok). **Vitest 60/60 (3 yeni: eşik/oturmaz/garson-götürmez),
build temiz, sim 84sn (1.4dk; ekonomi etkilenmez), smoke 19/19, konsol temiz.** Değişen: types.ts (Dish.tableIndex),
economy.config.ts (cups.dirtyThreshold), store.ts (dirtyTables/findFreeTable/spawn/garson/dish-push+export), Dishes.tsx
(StinkCloud), devHooks.ts, tests/logic.test.ts.
**ÖNİZLEME (gözle onay):** http://localhost:5199/ — kirli masada koku bulutu + müşteri o masaya oturmuyor mu kontrol et.
(Test: bir masaya servis et, parayı/kirliyi toplama, 3 müşteri çevriminden sonra masa kirlenmeli.)

### (önceki) D-018 adım 1+2+3 (BİTTİ)
**D-018 DEVAM. Adım 1 (bug-fix) + 2 (tray kaldır) BİTTİ. Adım 3: KART TASARIMI KULLANICI TARAFINDAN REDDEDİLDİ →
SADE işaretlere geri alındı; DWELL süre-sayma yerine HAREKET-TEMELLİ yapıldı. Kenar-yerleşim KORUNDU.**
SAVE_VERSION **13**. **Vitest 57/57, build temiz, sim 84sn (1.4dk), smoke 19/19, konsol temiz.**

### D-018 adım 3 — kullanıcı feedback'i (2026-06-07): "kart çok kötü oldu, eski haline çevir; dwell süre saymasın"
- **(1) GroundMarker GERİ ALINDI:** kesik-köşeli billboard kart → **eski SADE düz zemin işareti** (D-017 §2 stili:
  şeffaf beyaz çember + ince kategori halkası + DÜZ zemin yazısı + ₺ + dolum yayı). Kart denemesi terk.
  **DERS:** kullanıcı havada/dik kart sevmiyor → mekânsal sade zemin işareti tercih (feedback_*).
- **(2) KENAR-YERLEŞİM KORUNDU:** `tables[i].upgradeSpot` sol kolon **−3.7** / sağ kolon **+3.7** (orta koridor boş);
  personel pad'leri masa satırları ARASINA **z=1.5** (waiter/dishwasher [∓4.6,0,1.5]) → −3.7 spot ile çakışma yok.
  (Kullanıcı placement'i ayrıca eleştirmedi; istenirse merkeze geri alınabilir.)
- **(3) DWELL → HAREKET-TEMELLİ (süre YOK):** Kullanıcı "önce 1.5sn sayıyor sonra başlıyor — HAYIR; üstünden geçerken
  almasın ama durduğu anda HEMEN başlasın, bekleme süresi de dolmasın." → süre sayacı (`dwellId`/`dwellTime`/`dwellDelay`)
  KALDIRILDI. Yeni: `fillReady = hypot(input) <= 0.1` (oyuncu DURUYOR mu). Para yalnız oyuncu durunca akar → geçerken
  (hareket) hiç alınmaz, input bırakınca HEMEN başlar, countdown görseli yok. `onFillId` (pad.id/FILL_TEA/FILL_TABLE+i)
  tek aktif nokta seçer; üç dolum bloğu `fillReady && wallet>0` ile akar. Çay-fill leave'de SIFIRLANMIYOR (biriken korunur).
  3 vitest: geçerken(hareket) akmaz + durunca hemen akar + biriken korunur.
- Değişen: economy.config.ts (interaction bloğu kaldırıldı), store.ts (fillReady hareket gate, dwell state çıkarıldı,
  LAYOUT spot/pad korundu), GroundMarker.tsx (sade haline döndü), Pad.tsx + Scene.tsx (dwell prop çıkarıldı),
  tests/logic.test.ts (hareket-temelli 3 test). FILL_TEA/FILL_TABLE store-içi export (onFillId için).

### >>> SIRADAKİ İŞ: D-019 madde 2-4 + kalan D-018 <<<
Kullanıcı feedback 2026-06-07 (tam metin decisions.md **D-019**). Ana kaygı: "her şey çok yer kaplıyor" → sade ekran.
1. ✅ **KİRLİ MASA mekaniği — UYGULANDI (gözle onay bekliyor; yukarı bak).**
2. **(SIRADAKİ) Çay ocağı yükseltme noktasını ÇAY-ALMA'dan AYIR + SOL DUVAR ile ocak arasına koy** (çay alırken zorla tetiklenmesin;
   ocaktan >2.9 br). **`table3`'ten `minStationLevel:1` KALK** (masa açmak yükseltme gerektirmesin).
3. **Yükseltme gating (sade ekran):** ÖNERİ → çay ocağı yükseltme 2. masadan sonra; MASA yükseltmeleri table4 sonra. (Kesinleştir,
   simülasyonla denge, ilk-alım 84sn sabit.)
4. **Personel pad'leri SAĞ-ARKA köşe** (garson+bulaşıkçı tutma; ör. [4.6,−1.5] / [4.6,−3.2]).
5. **YENİ-ÖZELLİK BİLDİRİMİ:** özellik açılınca kamera zoom / "pinboard" bildirim (garson tutma vb.) — D-018 §4 reveal/onboarding ile.
Ayrıca kalan D-018: adım 5 (semaver=ocak L4 + ekonomi denge), adım 6 (garson L2), §6 kamera damping.

### (eski plan) D-018 adım 4 — SIRALI REVEAL zinciri (D-019 §5 ile birleşti)
"Al-pad → (inşa) → o nesnenin yükseltmeleri" zinciri; hepsi birden dökülmez; yakınlık-gizleme YOK. padsDone'dan
türetilir, ek persist yok. Sonra adım 5 (semaver=ocak L4 + ekonomi denge) + adım 6 (garson L2). Detay: decisions.md D-018 §4/§5/§6.

### (önceki) D-018 adım 1+2

### D-018 adım 1 — BUG-FIX (BİTTİ, gözle ✓)
- **(b) table2 açılınca KARARMA fix (KÖK):** drei `<Text>` (GroundMarker) troika fontunu ilk mount'ta yükler ve
  SUSPEND eder; Suspense sınırı yoktu → tüm sahne kararıyordu. ÇÖZÜM: Scene.tsx'te DÜNYA (Ground/Walls/Tables/Player/
  mutfak) Suspense DIŞINDA; SADECE Text içeren marker'lar (`Pad`/`UpgradeZone`/`TableUpgradeMarkers`) ayrı
  `<Suspense fallback={null}>` içinde → font yüklenirken yalnız küçük işaret yazısı bekler, dünya HİÇ kararmaz.
  NOT: troika modern sürümü `font` belirtilmezse unicode-font-resolver'dan **CDN (jsdelivr)** font verisi çeker.
  İlk denenen module-scope `preloadFont` boot'ta bu CDN fetch'i tetikleyip smoke `networkidle`'ı bozdu (+ offline
  Faz 7 riski) → KALDIRILDI; font artık lazy (ilk marker'da) yüklenir, nested-Suspense kararmayı zaten önler.
  **Faz 7 TODO: fontu YERELE bundle'la (offline + CDN bağımsız).**
- **(a) kapı z-fighting fix:** lento + 2 yan direk ön duvarla eş-düzlemdeydi (z=z1) → `z1+0.06` offset + derinlik t.

### D-018 adım 2 — TRAY YÜKSELTME KALDIRILDI (BİTTİ, gözle ✓)
- Tepsi SABİT 2 (`C.serving.trayCapacity`). Silinen: economy.config `trayUpgrade`+`trayUpgradeRequires`+helper'lar
  (`trayCapacityForLevel`/`trayUpgradeCost`); store `trayLevel`/`trayUpgradeFill` state + tick yükseltme bloğu +
  `trayMaxLevel`/`trayNextCost`/`trayUpgradeZoneUnlocked`/`LAYOUT.trayUpgradeZone`; Scene `TrayUpgradeZone`; devHooks
  `trayLevel`/`trayUpgradeZonePos`; HUD trayLevel. `trayCapacity()` artık no-arg sabit döner.
- **SAVE_VERSION 12→13 + v12→v13 migrasyon** (trayLevel persist alanı DÜŞER; v9/v10 adımları artık sadece sürüm
  ilerletir). Eski v9/v10 tray clamp testleri → tek "v12→v13 trayLevel düşer" testine indirgendi.
- Değişen: economy.config.ts, store.ts, save.ts, Scene.tsx, devHooks.ts, HUD.tsx, tests/logic.test.ts, tools/smoke.mjs.

### >>> SIRADAKİ: D-018 adım 3 — KESİK-KÖŞELİ KART + KENAR-YERLEŞİM + DWELL <<<
GroundMarker çember→dashed/kesik-köşeli yuvarlatılmış kare kart (eylem/lvl/₺ + dolum çubuğu + yeşil/gri, yazı kart
hizasında küçük DİK-OKUNUR). Masa yükseltme işaretleri MERKEZDEN KENARA (sol masa→sol x≈−3.7, sağ→sağ x≈+3.7; orta
omurga boş). DWELL ~1.5sn (noktaya girince halka hemen, para sonra akar; çıkınca sıfırlanır, biriken korunur →
"üstünden geçince param gidiyor" çözülür). Detay: decisions.md D-018 §1/§2/§3.

### (eski) D-017 adım 1+2 (önceki sohbet, SAVE 12 — GÖZLE ONAYLANDI)

### Bu turda yapılanlar (kullanıcı feedback 2026-06-07: "masa içinde hapsoldum + padler çirkin/her yerde + duvar/kapı/sokak istiyorum")
- 🐛→✅ **Masa açınca hapsolma (KRİTİK):** Masa pad'i oyuncunun DURDUĞU yerde belirince oyuncu masanın içinde kalıp hareket
  edemiyordu. KÖK NEDEN: mobilya collision'ında (store.ts) "zaten içindeyse çıkışa izin" guard'ı YOKtu (aktör collision'ında
  vardı). Düzeltme: `stuckInFurn = hitsSolid(oldX,oldZ,furn,pr)` → içindeyken eksen blokları atlanır (çıkışa izin; "zorlasan da
  GİRİŞ engellenir" korunur) + masa pad'i tamamlanınca oyuncu yeni masanın footprint'i DIŞINA itilir (anında temiz konum). Yeni
  vitest (masa merkezine koy → input ver → footprint dışına çıkar). Gözle doğrulandı (table3 açıldı, oyuncu z 3.0→3.95'e itildi).
- ✅ **Adım 2 — SADE ZEMİN İŞARETLERİ (D-017 §2):** Havadaki Html rozetler + iri disk/koni KALDIRILDI. Yeni `GroundMarker.tsx`
  (drei `<Text>`): yerde UFAK şeffaf beyazımsı çember + ortasında DÜZ zemin yazısı (ne yapacağı: "2. Masa"/"Garson Tut"/"Çay
  Yükselt"/"Masa") + ₺maliyet alt satır; ince kategori halkası (yeşil=aç/mavi=opsiyonel/altın=yükseltme); parası yetince parlar
  (afford) + dolum yayı (progress). Uygulandı: Pad.tsx, Scene UpgradeZone/TrayUpgradeZone/TableUpgradeMarkers. DishStation "🧼
  Bulaşık" + TeaStation "Çay Lv" havada etiketleri SİLİNDİ (lavabo/semaver görseli zaten anlatır).
- ✅ **Sıralı reveal (light, D-017 §3 kısmi):** Pad.tsx artık opsiyonel pad'lerin HEPSİNİ değil AYNI ANDA TEK ilk alınabiliri
  gösterir (garson → alınınca bulaşıkçı). Personel pad/home konumları arka köşeden GÖRÜNÜR orta-kenara taşındı (waiter/dishwasher
  pad [∓4.6,0,0.0], home [∓4.6,0,-1.6]) — eski "bulaşıkçı dairesi yarı ekran-dışı" şikayeti çözüldü. TAM onboarding (reveal-on-
  interact + kamera zoom + "Yeni" rozeti + onboardStep persist) HÂLÂ BEKLİYOR (step 3 proper).
- ✅ **DIŞ DÜNYA (kullanıcı isteği — D-017 dışı ek):** Ön duvar + **kapı boşluğu** (x=0, doorHalf 1.3, söve+çerçeve) eklendi
  (Walls front 2 parça). Müşteriler artık `LAYOUT.street [0,_,8.0]` SOKAKTA belirir → kapıya yürür → koltuğa (toTable goingIn);
  çıkarken kapı→sokak→kaybolur (leaving goingOut). Yeni `Street()` (kaldırım + asfalt + yol çizgileri + karşı binalar; salt görsel).
  NOT: kamera mağazaya (-z) baktığı için karşı binalar pratikte görünmüyor (sokak/kaldırım + kapıdan giren müşteri görünür); daha
  fazla "dış dünya" istenirse kamera açısı (step 6) ile birlikte ele alınmalı.
- **Değişen:** store.ts (LAYOUT street/personel konum + bug-fix + NPC kapı akışı + masa-eject), tests/logic.test.ts (escape testi),
  YENİ GroundMarker.tsx + Street, Pad.tsx (sade+reveal), Scene.tsx (zones sade + Walls kapı + Street), TeaStation.tsx (badge sil).
### >>> SIRADAKİ İŞ (SONRAKİ SOHBET): D-018 ONAYLANDI — Faz 2 cila v2 <<<
Kullanıcı ikinci tur feedback + onay (2026-06-07). Tam karar: **decisions.md D-018** (araştırma destekli — My Perfect Hotel modeli).
Özet (uygulama sırası):
1. **BUG-FIX:** (a) kapı z-fighting (lento/çerçeve ön duvarla eş-düzlem → z offset). (b) table2 açılınca KARARMA = App.tsx'te Canvas
   çevresinde `<Suspense>` YOK → drei `<Text>` font SDF suspend edip sahneyi karartıyor → `<Suspense fallback={null}>` + `preloadFont({characters})`.
2. **TRAY YÜKSELTME KALDIR** (gereksiz; tepsi sabit 2). trayUpgrade/TrayUpgradeZone/trayLevel/trayUpgradeFill/helper/test/smoke/devHooks sil.
3. **KESİK-KÖŞELİ ZEMİN KARTI + KENAR-YERLEŞİM + DWELL:** GroundMarker çember→dashed-köşe kare kart (eylem/lvl/₺ + dolum çubuğu +
   yeşil/gri, yazı kart hizasında küçük DİK-OKUNUR). Masa yükseltme işaretleri MERKEZDEN KENARA (sol masa→sol x≈−3.7, sağ→sağ x≈+3.7;
   orta omurga boş). Dwell: noktaya girince halka hemen, para ~1.5sn sonra akar; çıkınca sıfırlanır (biriken korunur). YAKINLIK-GİZLEME YOK.
4. **SIRALI REVEAL zinciri:** al-pad→(inşa)→o nesnenin yükseltmeleri; hepsi birden dökülmez; opsiyonel tek tek (zaten). padsDone'dan türetilir (ek persist yok).
5. **SEMAVER = OCAK L4 (premium 💎/video, şimdilik GÖRÜNÜR-KİLİTLİ):** ayrı `samovar` pad kalkar; ocak L1-L3 ₺, L4=semaver (hız×0.7+throughput
   sıçraması); masterLevel 4. EKONOMİ: tek ocak L3 (2.46x) 4 masaya yetişmeli → simülatörle yeniden denge (ilk-alım 84sn SABİT). 
6. **GARSON L2:** L1=1.4 (yavaş) → L2=1.8 (şimdiki); garson yanında yan-kenar yükseltme kartı (tutulunca açılır). Yeni persist waiterLevel.
- **SAVE_VERSION 12→13** (tek migrasyon: trayLevel düşer, samovar padsDone/padFills'ten düşer, waiterLevel=0 eklenir; ilerleme korunur).
- Etkileşim KARARI: yürü+dur (dwell), TIKLAMA YOK (araştırma: tür standardı stand-to-fill). Alan GENİŞLEMEZ (placement sorunu).
- Kalan D-017 §4 gating / §5 bağımsız çay+kirli taşıma / §6 kamera sallanması bu işlerle birlikte ele alınır.

### >>> SIRADAKİ İŞ: D-017 redesign — adım 1 BİTTİ (gözle onay), sonra adım 2 <<<
Faz 2 cila redesign'ı (decisions.md **D-017**, progress.md "2-REDESIGN"). 6 adım (sırayla, her biri Vitest+sim+smoke yeşil + gözle onay):
1. ✅ **Yerleşim UYGULANDI (LAYOUT v6, D-017 §1):** Mutfak ARKA DUVARDA KÜME — ocak `[-1.6,-4.8]` + bulaşık `[0.6,-4.8]`
   (bitişik, AYRILMAZ) + semaver pad `[-3.8,-4.8]`. Masalar ÖNE UZAK 2×2 (kolon x ∓2.4, satır z 0.0/3.0) → her masa↔ocak
   >2R=3.2 (ön sıra ~4.9, başlangıç masası table0 ocaktan **4.87**; eski **2.26** idi = tek noktada her şey bug'ı çözüldü).
   area derinleşti `{minX-5.3,maxX5.3,minZ-5.3,maxZ5.0}`. Çay-yükseltme noktası ocağın TAM önü `[-1.6,-3.0]` (pickup+personel
   pad çakışması yok — taşınmasaydı garson pad'iyle para çekişirdi, bug bulundu&düzeltildi). trayUpgradeZone `[0,4.3]`, personel
   pad/home arka köşeler (waiter `[-4.8,-3.0]`/home`[-4.8,-1.6]`; dishwasher `[4.8,-3.0]`/home`[4.8,-1.6]`). player start `[0,1.5]`,
   entrance `[0,4.8]`. nav ızgarası/garson yolu/masa-yükseltme noktaları LAYOUT'tan türediği için otomatik uydu. YENİ "çakışma yok"
   testleri (masa ocak pickup+serve birleşiğinde DEĞİL; masa bulaşık wash+collect birleşiğinde DEĞİL; table0 ocaktan >4 br).
   **Değişen:** store.ts (LAYOUT + upgradeZone), tests/logic.test.ts (3 invariant testi + nav yorumları). Gözle: ekran görüntüsü
   (layout-v6-start.png) — mutfak arkada, önde geniş yürüme alanı, başlangıç masası uzakta. Ekonomi/persist SABİT (SAVE_VERSION 12).
1-eski. ~~Yerleşim: masalar ocaktan UZAK (>3.2, hedef ~5)~~ → yukarı (uygulandı).
2. **Pad/işaret:** küçük (~0.5) + **zeminde DÜZ yazı** (havada rozet YOK); renk: yeşil=aç/mavi=opsiyonel/altın=yükseltme.
3. **Sıralı reveal + onboarding (ilk oyun):** öncekiyle etkileşilene dek gizli; 2.masa→garsona zoom(atlanabilir)→"3.Masayı Aç"→
   ocak yükseltme sonra; sonraki açılış "Yeni" rozeti; onboardStep persist.
4. **Gating:** table3'ten minStationLevel:1 kalkar; simulate denge (84sn sabit kalmalı).
5. **Servis kısıtı GEVŞET:** çay+kirli BAĞIMSIZ taşınır (eli-boşken kısıtı deadlock → kirli birikip toplanamıyordu).
6. **Kamera sallanması fix (kök neden TEŞHİS EDİLDİ):** CameraRig (Scene.tsx) `lerp(desired, dt*4)` kare-hızı bağımlı +
   `lookAt(tam oyuncu)` → trailing mesafe dalgalanınca dünya sallanıyor; dt clamp yok; fit/d her kare size'dan. Çözüm: kare-hızı
   bağımsız damping (`1-exp(-k*dt)`) konum+lookAt'a TUTARLI + dt clamp + fit/d yalnız resize'da. NOT: sim deterministik & pürüzsüz,
   sorun yalnız kamerada.

- **Faz 2h (MASA-BAŞI, son hali):** Kullanıcı ilk "zone-başı/toplu + merkez altın disk + ★L rozet" uygulamasını REDDETTİ →
  **her masanın AYRI seviyesi** (`tableLevels[i]`), **her masanın YANINDA ayrı nokta** (`LAYOUT.tables[i].upgradeSpot`, +1.2x merkeze),
  My Hotel oda mantığı. Çay fiyatı SABİT; OTURULAN masanın seviyesi BAHŞİŞ↑ (coin=5+tipBase×lvl) + SABIR↑ (+2/lvl). 2. masa açılınca belirir.
  Görsel: masanın yanında **sade küçük işaret** (altın halka YOK, dünya-içi L yazısı YOK; parası yetince yeşil parlar); bilgi HUD bar'ında.
  Sayılar (data-driven): tipBase 2, patience +2/lvl, maliyet 60×1.6^lvl (60/96/153/245), soft max L4. SAVE 10→11→12 migrasyon zinciri.
  Karar: D-016 §5 "zone-başı"→"masa-başı" güncellendi (decisions.md). Hafıza: feedback_upgrade_per_object.md.
- **Baş üstü radial ilerleme cızırtı düzeltmesi (2026-06-07):** Kullanıcı "dolma animasyonu cızırtılı" dedi. İki neden: (1) arka halka
  ile dolan yay TAM aynı düzlemdeydi → z-fighting; (2) `ringGeometry` sabit 32 segmenti değişen yay uzunluğuna her frame yeniden
  dağıtıyordu → tüm yay titriyordu. Düzeltme (Player.tsx HeadRadial): yay `position z +0.003` + her iki materyal `depthWrite=false` +
  `renderOrder` (z-fighting yok); segment sayısı ilerlemeyle ORANTILI (`round(progress*48)`) → sabit açısal dilim, sadece uçta yeni
  dilim eklenir (titremez). build temiz, smoke 20/20, konsol temiz. **GÖZLE onay bekliyor.**
- **Test sıfırlama (kullanıcıya):** tarayıcı **DevTools Console** sekmesinde `__resetGame()` (çift alt çizgi + parantez). AMPİRİK
  DOĞRULANDI çalışıyor (playwright: tables 2→1, padsDone temizlendi, localStorage null). En garantili: `localStorage.clear()` sonra F5.
  Para: `__addMoney(500)`, zaman: `__advanceTime(60)`. E2E: testten önce `localStorage.clear()` + reload.
- **Garson/bulaşıkçı oyuncudan KAÇINIR (2026-06-07):** Kullanıcı "garson benim içimden geçiyor, bana göre hareket etmeli." navStep'e
  opsiyonel `avoid`(oyuncu)+`avoidSolids`(masa) eklendi: personel oyuncunun üstüne binmeyip kenarına ayrılır (boids separation;
  masaya itecekse itmez). Oyuncu otoriter (input), personel yer açar → "garson etrafından geçer" hissi. Garson+bulaşıkçı tüm navStep
  çağrılarına player+obstacles geçti. Vitest 54/54, build temiz, smoke 20/20. GÖZLE onay bekliyor.
- **Sıradaki:** 2h gözle onaylanırsa → **Faz 2i** (onboarding/işaretçi: ilk masa-açma + sonraki açılışlar "Yeni ▲" rozet).

## (eski) Şu an neredeyiz (2026-06-06)
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
- **2g servis-her-taraftan + garson kilitlenme düzeltmesi (2026-06-07 #2 — kullanıcı: "garson sol-üst masanın önünde takıldı, servis yapamıyor; engeli dolaşamıyor; alan büyük, garson eski hızına dönsün"):**
  - **KÖK NEDEN:** garson teslimatı KOLTUK noktasına (`seat`) gidip oraya VARMAYI (`moveAvoid===true`) bekliyordu. Koltuk masanın bir tarafında; garson ters/mutfak tarafından gelince masa TAM aradadır → `moveAvoid`'in basit eksen-kayması tek engeli dolaşamayıp KİLİTLENİYORDU (gerçek pathfinding yok).
  - **ÇÖZÜM:** servis MASA MERKEZİNE yakınlıkla (her taraftan). Garson teslimat: `seat`→`table` merkez, teslim koşulu `moveAvoid===true` yerine `dist2D(w.pos, table) < serveRadius(1.6)` → masaya yaklaşınca (hangi yön olursa) bırakır, engelin ardına geçmek gerekmez (bulaşıkçının çalışan deseni). Oyuncu servisi de `seat`→`table` yakınlığı (arkadan da servis). En-acil hedef seçimi korunur (timer önce; mesafe `table`'a göre tie-break). Bardak toplama zaten masa-yarıçaplı (her taraftan) → değişmedi.
  - **GARSON HIZI:** `waiter.moveSpeed 1.4→1.8` (eski hız). Alan büyüdüğü için 1.5/1.4 çok yavaş kalıyordu; kullanıcı "eski hızına dönsün". Müşteri geliş hızı AYNI (spawnInterval 1.6, orderTime 6 — "müşteriler aynı hızda").
  - **Doğrulama:** Vitest 44/44 ✅ (anti-starvation + servis testleri geçer: koltuk masaya 1.0 < serveRadius 1.6), build temiz, sim 84sn (garson hesabı etkilemez), smoke **19/19** ✅ — garson assist düşen para **1→8** (önceden 1→2; artık gerçekten servis ediyor, takılmıyor). SAVE_VERSION değişmedi. **Faz 2g BİTTİ → sıradaki Faz 2h.**
  - Değişen: economy.config.ts (waiter.moveSpeed), store.ts (oyuncu+garson servis masa-yakınlığı).
- **2g GERÇEK YOL BULMA — garson kilitlenme KÖK çözüm (2026-06-07 #3 — kullanıcı: "yine bug; tam masaya gelmeden veriyor; ön masada takılı kalıp arka masaya gidemiyor, engeli anlamıyor → arka masa sabrı doluyor; elinde çayla sol-üst↔sağ-üst↔sol-alt salınıyor; SERVİSE OPTİMİZASYON + harita düzeni ŞART"):**
  - **TEŞHİS:** `moveAvoid` (eksen-başı kayma) GERÇEK pathfinding değildi → masa aktör ile hedef arasında TAM ortadaysa (mutfak arka duvarda, ön masa arka masayı x-kolonunda kapatıyor) tek engeli dolaşamayıp KİLİTLENİYORDU. Tüm belirtiler bunun (deadlock + en-acil hedef değişince yarı-yaklaşıp salınım). "Uzaktan veriyor" = serveRadius 1.6 (kenardan 1.1).
  - **KULLANICI KARARI:** "sen mantıklı olanı yap, layout'a karar veremedim, olmazsa değişiriz ama mantıksal sorun çözülsün." → pathfinding eklendi, **layout v5 KORUNDU** (görseli zaten onaylıydı).
  - **ÇÖZÜM — `src/game/nav.ts` (YENİ):** kaba ızgara (NAV_CELL 0.3) BFS yol bulma. `buildNavGrid(area,cell,solids,inflate=actorRadius)` + `findNavPath(grid,start,tx,tz,reach)` (8-yön, köşe-kesme engelli, bloklu-başlangıç en yakın açığa snap). Saf modül (LAYOUT'tan bağımsız → circular import yok; store solid'leri verir). **store.ts:** `navSolids`(ocak+bulaşık+masalar; koltuk/semaver hariç) + `getNavGrid(tables)` cache + `navStep(pos,target,step,grid,reach)`. Garson + bulaşıkçı artık `moveAvoid` yerine `navStep` → engeli GERÇEKTEN dolaşır. **Oyuncu DEĞİŞMEDİ** (input+kendi collision). Müşteriler de moveAvoid'te kaldı (kendi koltuğuna gider, blokaj yok).
  - **Teslim mesafesi (geometrik, footprint+actorRadius+pay):** REACH_TABLE ~1.05 (servis), REACH_STATION/WASH ~1.08, REACH_HOME 0.4. Masaya BİTİŞİK teslim → "tam masaya gelmeden veriyor" biter.
  - **Doğrulama:** **Vitest 47/47** (3 yeni nav testi: ocaktan HER masaya yol var + engel-tam-aradayken dolaşır + garson kolon-bloklu ARKA masaya gerçekten servis eder/deadlock yok), build temiz, sim 84sn (garson hesabı etkilemez), smoke 19/19. SAVE_VERSION değişmedi.
  - Değişen: YENİ nav.ts; store.ts (nav entegrasyonu, garson+bulaşıkçı). **GÖZLE doğrulama BEKLİYOR** (kullanıcı önizlemede garsonun artık takılmadan tüm masalara servis ettiğini teyit etmeli — 3D nav kod testiyle değil gözle onaylanır).
- ~~**2g KALAN (opsiyonel):** müşteri spawn/sipariş tempo ince-ayarı + "sayı düzeni". NOT: SAVE_VERSION değişmedi (persist alan yok).~~ (tempo yapıldı — yukarı bak)

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
