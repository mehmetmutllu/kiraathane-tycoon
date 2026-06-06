# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz (2026-06-06)
Faz 0 + Faz 1 ✅. Faz 2: 2a ✅, 2b ✅, 2-UX (D-009) ✅, 2-EKO (D-010) ✅, 2c (D-011) ✅,
2d-garson (D-014) ✅, **2d-harita — başlangıç salonu 1 ocak : 4 masa (D-012) ✅ UYGULANDI.**
**Sıradaki: D-015 — state tek-doğru-kaynaktan türetme refactor'ı (kullanıcı onayladı, sonraki oturuma ertelendi); Faz 2e ondan sonra.**

Servis/personel/zone modeli kullanıcı onayıyla KİLİTLENDİ:
- **D-011** (servis) ✅, **D-012** (zone/salon + bölge-başı personel + **KASA YOK** + tuvalet=oda + para toplama kalıcı manuel),
  **D-013** (primitive = nihai sanat stili), **D-014** (garson = opsiyonel/omurgayı kilitlemeyen pad ✅).
  Tam tasarım: `docs/serving-and-automation.md`.

## En son ne yapıldı (bu oturum — 2d-harita, D-012 1 ocak : 4 masa)
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

## TAM sıradaki adım (D-015 — state tek-doğru-kaynaktan türetme refactor'ı; Faz 2e'den ÖNCE)
> Kullanıcı bu refactor'ı onayladı ama uygulamayı SONRAKİ OTURUMA erteledi (2026-06-06). Faz 2e'den önce yapılacak.
**Sorun:** `tables/stations/serviceSpeedMult/hasWaiter` hem ayrı state/kayıt alanı hem `padsDone`'da örtük →
desenkronize olunca masa+pad çakışması gibi açıklar (bu oturumda v6/v7 migration patch'iyle yamandı, kök çözüm değil).
**Yapılacak (D-015 detayında):**
1. economy.config'e saf `derivedFromPads(padsDone)` → {tables, stations, serviceSpeedMult, hasWaiter}.
2. store: pad açılınca SADECE `padsDone`'a ekle; gerisini türet (tek yazım); tick'teki `tables++`/`serviceSpeedMult*=` kalkar.
3. save: türetilenleri KAYDETME (yüklemede türet); **SAVE_VERSION 7→8** + migrasyon (eski kayıt padsDone'undan türet);
   v5/v6/v7 addTable-senkron patch'leri sadeleşir.
4. Testler: desenkronizasyonun artık üretilemediğini ispatla. Vitest + smoke + build yeşil; docs güncelle.

## Ondan SONRA (Faz 2e — bardak/bulaşık döngüsü)
1. **Bardak kaynağı:** servis edilen her çay bir "kirli bardak" üretir (masada/tepside birikir). Bardak kapasitesi
   ocak seviyesine bağlı (L0~4, +2/lvl) → bardak biterse demleme/servis durur (yeni darboğaz).
2. **Kirli→topla→yıka:** oyuncu kirli bardakları toplar → bulaşık istasyonuna götürür → yıkanır (temiz havuza döner).
   Yeni bulaşık istasyonu + (opsiyonel) **bulaşıkçı** personel pad'i (garson deseni: optional, omurgayı kilitlemez).
3. **Tepsi yükseltme** (Faz 2e): trayCapacityBase 2→4→6→8 (mekânsal yükseltme noktası, çay yükseltme gibi).
4. SAVE_VERSION bump + migrasyon; Vitest + smoke + sim yeşil; docs güncelle.

## Sonraki dilimler (kilitli plan — docs/serving-and-automation.md §11)
- **Faz 3:** 3a salon genişleme (yeni salon + oto ocak/masa + personel slotu) · 3b tuvalet odası + temizlikçi · 3c menü (kahve/tost) + masa-yükseltme işlevi.

## Faydalı dev kancaları (konsol)
`__game()` (artık readyCups/tray/trayCap/waitingCount/stationPos/firstWaitingSeat de var),
`__advanceTime(60)`, `__addMoney(1000)`, `__upgradeStation()`, `__teleport(x,z)`, `__resetGame()`.
Servis testi: ocağa ışınla (`__game().stationPos`) → tick → tepsi dolar; bekleyen koltuğa ışınla
(`__game().firstWaitingSeat`) → tick → servis.

## Hızlı komutlar
- `npm run dev` · `npm run build` · `npm run test` · `npm run sim`
- Duman testi: `npm run dev` (ayrı) → `node tools/smoke.mjs`
