# KAMERA + MAP FERAHLAMA PLANI — turu-5 madde 12 (2026-06-13 gece; UYGULANMADI)

> Kullanıcı: "Kamera daha yakın olabilir + map ferahlasın — masa araları açılabilir veya map genel
> genişleyebilir." Bu iki istek tek başına ÇELİŞİR (yakın kamera = daha az alan görünür) →
> çözüm: araları fiziksel açmak + kamerayı ölçülü yaklaştırmak BİRLİKTE.

## 1) Mevcut durumun ölçüleri (kod gerçeği)

**Kamera (Scene.tsx CameraRig):** d = 7 × fit (portrait fit ≤1.4 → ~9.8 birim), 45° omuz-üstü,
fov 50. Görev odağında d×0.72 zoom var.

**Masa şablonu (store.ts BASE_TABLES, zone-yerel):** kolonlar x = −1.2 / 3.2 (**4.4 br aralık**),
sıralar z = 1.9 / −1.0 (**2.9 br aralık**). Masa yarısı 0.475 + tabure ofseti 0.78 + tabure yarısı ~0.19.
- **Kolonlar arası net koridor:** 4.4 − 2×(0.475+0.78+0.19) ≈ **1.5 br** (oyuncu çapı 0.7) — dar ama geçilir.
- **Sıralar arası net koridor:** 2.9 − 2×1.445 ≈ **0.0 br** (!) — kuzey/güney tabureler fiilen
  birbirine değiyor; iki sıra arasından YÜRÜNEMİYOR. Kullanıcının "yürünmüyor" hissinin geometrik
  kanıtı (m.9 aktör fix'i kalabalığı çözer ama mobilya koridoru bu).
- Zone alanı: ~10.3×10.3; ZONE_DX 10.6 / ZONE_DZ 10.3; duvar payı m=0.5.

## 2) Seçenekler

### A — Yalnız kamera (en düşük risk, 1 dosya)
`d = 7 → 6.2` (+portrait clamp aynı) ve/veya fov 50→46. Karakterler %10-13 büyük görünür.
Ferahlık HİSSİ vermez (araları açmaz), tek başına yarım çözüm.

### B — Masa aralarını aç (ÖNERİLEN çekirdek; zone alanı SABİT kalır)
Şablon: kolonlar −1.2/3.2 → **−1.6/3.6** (aralık 5.2; net koridor ~2.3) · sıralar 1.9/−1.0 →
**2.2/−1.3** (aralık 3.5; net koridor ~0.6 — dikey aradan artık geçilir; sırayı daha fazla açmak
zone alanını büyütmeden duvarlara dayanır). upgradeSpot'lar aynı ofsetle kayar.
- Zone alanı/duvar/sokak/mutfak DEĞİŞMEZ → zincirleme etki dar tutulur.
- Garson turu: ocak→en uzak masa ~8.7 → ~9.2 br → tur +0.7sn (L1 12→12.7sn < sabır 18sn ✓ marj korunur).
- Sim eğrisi etkilenmez (sim mesafe modellemiyor; canlı tempo marjı yukarıda).

### C — Map genel ölçek ×1.15 (ÖNERMEM)
Tüm LAYOUT ×1.15: yürüme/garson/bulaşıkçı süreleri +%15 → sabır/tempo dengesi oynar (denge şartı
kapsamına girer), duvar/sokak/kapı/FoodCorner/KitchenHand/pad'ler topluca elden geçer. Maliyet/risk
yüksek, kazancı B'den az.

### Önerilen paket: **B + A-hafif** (araları aç + d 7→6.4)
Ferahlık fiziksel olarak gelir; kamera yaklaşınca dar alan hissi geri gelmesin diye d indirimi ölçülü.

## 3) Zincirleme etki listesi (B+A uygulama kapsamı)
1. `BASE_TABLES` (masa+upgradeSpot) — koltuklar/işaretler OFSETTEN türediği için otomatik izler.
2. Masa pad konumları `LAYOUT.padPos` (table2/3/4, z2/z3 eşleri) — masa merkezleriyle eşitlenir.
3. navGrid — otomatik (solids LAYOUT'tan; cache key değişmiyor, build parametreleri aynı).
4. KORUNAN değişmezler (vitest'te var): pad↔pickup ayrımı ≥ pickupRadius+0.3; pad'ler masa
   footprint'ine girmez; upgradeSpot koridora bakar.
5. Hard-coded koordinat kullanan testler/smoke adımları gözden geçirilir (LAYOUT'tan okuyanlar otomatik).
6. Kamera d + (gerekirse) odak zoom 0.72 oranı yeniden ayar.
7. Playwright görsel tur + telefon APK testi (ferahlık öznel — son söz kullanıcının).

## 4) Uygulama planı (onay sonrası tek oturum)
1. BASE_TABLES + padPos güncelle → vitest değişmezleri koş.
2. Kamera d 6.4 dene; 390×844 screenshot seti (önce/sonra aynı açıdan).
3. Garson/bulaşıkçı canlı tur süreleri ölç (devHooks) — sabır marjı raporla.
4. build + smoke + APK → telefon onayı; beğenilmezse d/gap değerleri tek dosyadan geri alınır.

## ONAY SORULARI
1. Paket **B+A-hafif** onay mı? (yoksa yalnız A / yalnız B / C?)
2. Kamera yakınlığı: d 6.4 (hafif) mi 6.0 (belirgin) mi?
3. Sıra aralığı 3.5'te dikey koridor 0.6 br — yeterli mi, yoksa zone alanını da büyütelim mi
   (ZONE_DZ 10.3→11.5; duvar/sokak/rezerv arsa zinciri açılır — +yarım oturum)?
