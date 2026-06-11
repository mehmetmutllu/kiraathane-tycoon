# YEMEK ALANI + KOLTUK + GARSON PLANI (kullanıcı ONAYLI — 2026-06-11)

> Durum: TASARIM ONAYLANDI, uygulama SONRAKİ OTURUMDA (Y1→Y4 sırasıyla).
> Kaynak: kullanıcı istekleri 2026-06-11 öğleden sonra turu + iki compute raporu.
> Önkoşul commit'ler: a1412f9 (M4+M5 revert, tost salonu arka-sağ, SAVE v25),
> d29b7d9 (denge: mıknatıs 200 / offline 0.5+bahşiş+1.2 / pad −%10; duvar+kilim kaldırıldı).

## 0. Kullanıcı istekleri (özet — kendi sözleriyle eşleşik)
1. Yemek alanı (zone-3, arka-sağ) NET farklı olmalı: masalar, renkler, seviye renkleri, zemin.
2. Tezgâh (tost) ÜST/arka duvara paralel, ÖNÜ kullanıcıya (güneye) dönük — counter hissi.
3. Masa seviyesiyle SANDALYE/koltuk artar: müşteri grupları gelir (karışık 1/2/3/4 — gerçekçi).
4. Her salona +1 garson (toplam 2) — AMA yalnız o salonun 4 masası da L4 olunca (en yoğun an).
5. Garson tepsisine aldığı kadar çayı TEK masada bekleyenlere tek durakta bırakır.
6. Karakter panelinde SEKME: Oyuncu | Çay Garsonu | Tostçu Garson — garson tepsi yükseltmeleri.
7. Tostçu garson görsel olarak farklı + kendi gelişim eğrisi.
8. Çay bırakma butonunun YANINA ayrı TOST bırakma butonu (kendi SVG'miz — hazır ikon yasak).
9. Zemine yemek amblemi (çatal-bıçak/tost silüeti — kendi ürettiğimiz şekil).
10. Görevler senkron/sıra hatasız (APPEND-only; v22/v23 İD-eşleme dersleri).

## 1. GARSON MATEMATİĞİ (compute edilmiş — onaylı)
Sabitler: garson L2 2.0 br/sn · ocak→masa ort. ~6.5 br (BFS dolambaçlı) · tur 13 br ≈ 6.5sn ·
sabır 18+2×masaL sn · istasyon: çay L0 10/dk, L4 ~33/dk (1.35^4=3.32) · tost L4 ~14/dk.

### Senaryo A — bugün (4 masa × 1 koltuk, garson tepsisi 1), oyuncu dokunmuyor:
- Garson 6.5sn/tur → 9.2 çay/dk; 4 masaya sırayla → masa başına ~26sn'de bir uğrar.
- Sabır 18sn (L0) → kısmi kaçış; gelir ~46₺/dk (oyunculu idealin ~%30'u).
- SONUÇ: yetişir ama tam değil — kilitlenme yok, bilinçli "kısmi yardımcı" tasarımı.

### Senaryo B — hedef (masalar L4 → 16 koltuk/salon, karışık gruplar):
| Konfig | Taşıma | Sonuç |
|---|---|---|
| 1 garson, tepsi 1 | 9.2/dk | %15 — herkes kaçar |
| 1 garson, tepsi 3 | 27.6/dk | yetersiz |
| 2 garson, tepsi 3 (claim) | ~55/dk teorik | İSTASYON tavanı 33/dk'ya dayanır ✓ tam döner |
| 2 garson, tepsi 4 | 73/dk teorik | israf (istasyon 33/dk) |
- ANAHTAR: tepsi yükseltmesi tur süresini DEĞİŞTİRMEZ (aynı masaya tek durakta T çay) →
  throughput doğrusal katlanır. 3 kişilik grup + tepsi-3 = TEK seferde hepsi.
- Aşırı otomasyon OLMAZ: parayı garson toplamaz — coin'ler masada birikir, oyuncu (mıknatıs)
  toplamadan ekonomi akmaz. Bahşiş optimizasyonu + kirli baskısı + tost salonu oyuncuda (D-014 ✓).
- Tost salonu notu: darboğaz istasyon (14/dk) — premium ürün, kabul.

## 2. KOLTUK + GRUP SİSTEMİ
- Koltuk sayısı = masa seviyesinden TÜRETİLİR (kayıt şeması değişmez): L0:1 → L1:2 → L2:2 → L3:4 → L4:4.
- Çay masaları: koltuklar 4 yana (tabure). YEMEK masaları: dikdörtgen + 2'ye 2 KARŞILIKLI arkalıklı sandalye.
- Spawn GRUP üretir: %30→1, %35→2, %20→3, %15→4 (ort. 2.2); hedef = en çok boş koltuklu masa;
  koltuk yetmezse grup küçülür. Üyeler aynı masaya farklı koltuk; bireysel çay/timer/ödeme/bahşiş
  (ekonomi korunumu bozulmaz). Müşteri tavanı: koltuk+2 (masa değil).
- Kirli-masa eşiği koltukla ölçeklenir (yoksa masa sürekli kilitlenir).
- NPC modeli: + seatIndex (transient — NPC'ler kaydedilmez, migrasyon GEREKMEZ).

## 3. GARSON SİSTEMİ
- 2. garson pad'leri: `waiter2` / `z2waiter2` / `z3waiter2` — gating: O SALONUN 4 MASASI DA L4
  (yeni requires türü: zone'un tüm masa seviyeleri ≥4). Maliyet: 800 / 1200 / 2000₺.
- CLAIM sistemi: aciliyet-sıralı hedef seçimi; 1. garson en acil müşteriyi, 2. garson onu HARİÇ
  sıradakini alır (deterministik — salınım/çift-hedef kargaşası yok).
- Teslim: garson masada bekleyen TÜM müşterilere tepsisi yettiğince tek durakta bırakır;
  artan çayla sıradaki acil masaya devam eder.
- Karakter paneli SEKMELERİ: Oyuncu | Çay Garsonu | Tostçu Garson.
  - Çay garsonu tepsisi (z0+z1 ortak): 1 → 2 (800₺) → 3 (2400₺) → 4 (6000₺ lüks).
  - Tostçu tepsisi: 1 → 2 (2000₺) → 3 (5000₺) — tavan 3 (tost büyük).
  - Garson HIZ yükseltmesi mevcut mekânsal pad olarak KALIR.
- Persist: `waiterUpgrades: { teaTray, tostTray }` → SAVE **v27** (default 0; basit migrasyon).
  (NOT: v26'yı Y1 aldı — z2 zemin varsayılanı migrasyonu, 2026-06-11.)
- Tostçu garson: farklı kıyafet (çay garsonundan ayrışır; M3 tost ustası diliyle uyumlu) + kendi eğrisi.

## 4. YEMEK ALANI KİMLİĞİ (görsel)
1. Tost tezgâhı ARKA duvara paralel, önü güneye (stationRots/stations z2 override; stationPickups/
   upgradeZones/waiterHomes/KitchenStaff konumları birlikte taşınır).
2. Dikdörtgen yemek masaları (≈1.4×0.9) + arkalıklı sandalye; çay tarafı yuvarlak+tabure kalır.
3. Zemin: yemek alanı varsayılanı FARKLI — açık krem-gri "büyük fayans" tonu (kozmetik mağaza
   satın alımı yine üstüne yazabilir).
4. Zemine yemek amblemi: çatal-bıçak/tost silüeti — primitive mesh'lerle KENDİ şeklimiz.
5. Arka duvara menü panosu (salt görsel). Masa örtüsü evrimi (foodTableclothByLevel) zaten ayrı.

## 5. UI
- Tepsi butonları AYRIŞIR: çay bırak (mevcut) + TOST bırak (yeni buton, kendi tost SVG'si).
  emptyTray(kind: 'tea' | 'food'). (Geçici birleşik fix bu oturumda girdi — Y1'de ikiye ayrılır.)
- Görevler: yeni görevler APPEND (2. garson, garson tepsi, koltuk tanıtımı); zone'lu sayaçlar mevcut
  desenle (teasServedByZone). İD-eşleme gerekmez (sona ekleme).

## 6. UYGULAMA SIRASI (her milestone: vitest + sim + smoke + Playwright + commit + PUSH)
- Y1: ✅ UYGULANDI (2026-06-11, SAVE v26) — yemek alanı kimliği (görsel paket) + ayrı tost butonu.
- Y2: Koltuk + grup sistemi (EN RİSKLİ — NPC mekaniği; gerçek-dt regresyon testleri şart).
- Y3: Sekmeli karakter paneli + garson tepsi yükseltmeleri + tostçu farklılaşması (SAVE v27).
- Y4: 2. garson (claim) + gating + görevler + sim kalibrasyonu.

## 7. PLAN TAMAMLANINCA PROJENİN SON HALİ
- Zemin kat: 3 salon — 2 çay salonu (ön sıra) + sağ-arka TAM KİMLİKLİ TOST RESTORANI
  (counter tezgâh, restoran masa düzeni, farklı zemin + amblem, menü panosu).
- Masalar L0→L4: 1→2→2→4→4 koltuk; müşteriler gerçekçi karışık GRUPLAR halinde gelir.
- Salon başına 2 garsona kadar (2.si geç oyun, L4-masa gating'li); garsonlar tepsi yükseltmeli,
  gruba tek durakta servis; tostçu garson ayrı kimlikli. Oyuncu yine merkezde (para toplama,
  bahşiş optimizasyonu, kirli yönetimi, yeni alan açma).
- Karakter paneli 3 sekmeli yönetim ekranı. Offline kazanç ilerlemeyle ölçekli (bahşiş dahil).
- Arka-sol REZERV arsa: bir sonraki içerik turu kullanıcıyla tasarlanacak (üst kat/okey-tavla
  tasarım turu da sırada — progress.md Faz 3b).
