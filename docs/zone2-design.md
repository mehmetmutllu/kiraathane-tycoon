# Zone-2 Tasarımı (gece 3/7, 2026-06-10) — uygulama spesifikasyonu

D-022 (per-zone TEMALI ocak+bulaşık) + Faz 3a (yeni zone'da oto 1 ocak + 1 masa) + floorplan-master.md.
Bu doküman context-devri içindir: yarıda kalırsa sonraki pencere buradan devam eder.

## Model (kararlar)
- **LAYOUT şablonlaşır:** zone-1 iç yerleşimi AYNEN kalır (bugünkü mutlak koordinatlar = zone origin [0,0]).
  Zone-2 = aynı şablon **+X offset (dx=12.0)**. `makeZone(originX)` üretir; `LAYOUT.zones[0|1]`.
  Global düz diziler: `LAYOUT.tables` 8 slot (0-3 z1, 4-7 z2), `stations[2]`, `dishStations[2]`,
  `entrances[2]`, `streets[2]`, `upgradeZones[2]`, `waiterHomes[2]`, `dishwasherHomes[2]`,
  `waiterUpgradeSpots[2]`.
- **Müşteri kendi zone kapısından girer** (sokak tüm cepheye uzar; NPC tableIndex→zone→o zone'un
  entrance/street'i). moveAvoid zone-içi kalır → bölme duvarında takılma riski yok.
- **Bölme duvarı:** iki zone arasında, OYUNCU collision'ı (activeSolids) + navSolids'e girer; ortada
  GEÇİT (z≈1.5, genişlik ~1.6). Zone-2 KİLİTLİYKEN geçit de katı (kapalı kapı) + zone-2 alanı fiilen
  erişilmez; pad tamamlanınca geçit açılır. `area` HEP tam genişlik (clamp değişmez; duvar engeller).
- **Bardak havuzu (cleanCups) GLOBAL** (tek depo): her ocak ortak havuzdan demler, her lavabo ortak
  havuza döndürür → korunum değişmezi global kalır (oyuncu zone'lar arası taşısa da bozulmaz).
  Kapasite = poolBase + poolPerLevel × (tüm ocak seviyeleri toplamı).
- **Per-zone state:** `stationLevels[z]` (persist), `readyCupsArr[z]`, `brewProgressArr[z]`,
  `upgradeFills[z]`, `waiterLevels[z]` (persist), `waiterUpgradeFills[z]`, `waiters[z]`,
  `dishwashers[z]` (transient). tableLevels 8 slota uzar (persist).
- **Personel per-zone:** garson/bulaşıkçı SADECE kendi zone'unun masaları/ocağı/lavabosuyla ilgilenir
  (D-012 bölge-başı). Zone-2'de yeniden tutulur (kendi pad'leri).
- **Pad'ler (config):** pad'e `zone?: number` (default 0). Yeni zincir:
  `zone2` (effect unlockZone; geçitte, cost başlangıç 1200 — curve raporu sabah) →
  `z2table2/z2table3/z2table4` (addTable zone:1; oto-açılan 4. slot zaten unlock'la gelir) →
  `z2waiter`/`z2dishwasher` (hire zone:1). Sıra quest hattıyla: q_zone2 → q_z2serve (sayaç) →
  q_z2table2 → q_z2waiter → q_z2table3 → q_z2dishwasher → q_z2table4.
- **derivedFromPads → per-zone:** `{ zonesOpen, tablesByZone[z], hasWaiter[z], hasDishwasher[z] }`;
  `openTableIdx(derived)` global açık masa index listesi (z1: 0..n0-1; z2: 4..4+n1-1; zone-2 unlock
  = slot 4 otomatik açık). Eski `tables` sayısı = liste uzunluğu (HUD/test uyumu).
- **SAVE v17→v18:** stationLevel→stationLevels[], waiterLevel→waiterLevels[] (eskiler index 0'a),
  tableLevels normalize (8). padsDone aynen.
- **FILL id'leri:** 'tea:z', 'waiterUp:z' (FILL_TEA/FILL_WAITER önek olur); tableUp:i global index.
- **Gating:** zone-2 içi her şey `prev` zinciriyle (minStationLevel/minTables zone-karmaşası yok).
  Zone-2 ocak yükseltme requires prev:['zone2']; masa yükseltme requires değişmez (table4 = z1).
- **Sim:** idealize global (masa toplamı × fiyat / döngü; ocak arzı zone toplamı) — ilk-alım 60sn
  ETKİLENMEZ (zone-2 geç oyun). Denge SABAH onayına (madde 5 raporu); gece sayıları başlangıç değeri.
- **devHooks geri-uyum:** stationLevel/readyCups/hasWaiter... = zone-1 değerleri (smoke bozulmaz);
  yeni `zones[]` alanı per-zone döker.

## Görsel (Scene)
Her zone kendi 4 duvarı + ön kapı boşluğu; bölme duvar çift (z1 sağ + z2 sol) ortak geçitle; sokak
şeridi tüm cepheye uzar. Zone-2 kilitliyken: duvar arkası görünür ama girilmez (pad geçidin z1
tarafında). TeaStation/DishStation/markers zone index'iyle parametrik çizilir.

## Sıra (her adım yeşil + commit)
1. economy.config: zones/pads/quests/derived (+helpers) — SAVE v18 save.ts migrasyon.
2. store.ts: LAYOUT şablon + per-zone tick blokları + fill id'leri + guard'lar.
3. Scene + bileşenler (TeaStation/Pad/Waiter/Dishwasher/Customers/GroundMarker) zone-parametrik.
4. devHooks + vitest + smoke + sim güncelle; Playwright canlı zone-2 senaryosu + screenshot.
