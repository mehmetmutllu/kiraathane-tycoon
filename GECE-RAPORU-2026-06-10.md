# 🌙 Gece Raporu — 2026-06-10 → 11 sabahı

Günaydın! Onaylı 7 maddenin **7'si de bitti**. Telefon için yeni APK kökte:
**`KoseKiraathanesi-debug.apk`** (eskisini silip bunu kur; SAVE v18'e migrasyon otomatik,
ilerleme korunur). Ekran görüntüleri kökte `night-*.png` (git'e girmez, yerelde).

## Ne yapıldı (commit sırasıyla)

### 1. Ocak-yükseltme para yeme fix'i ✅ `0b4d287`
Kök neden: tezgâh önünde çay alırken oyuncu, yükseltme dairesinin içinde kalıyordu
(eski kod merkez-merkez mesafeye bakmış, daire KESİŞİMİNİ ıskalamıştı). Çift katman:
nokta ileri taşındı (daireler artık kesişemez) + "pickup yarıçapındayken dolum asla
başlamaz" guard'ı. → `night-1-upgradezone-fix.png`

### 2. Kıraathane araştırması → kat master planı ✅ `fc20f9c`
Gerçek kıraathane tipolojisi (ocakbaşı/oyun bölümü/TV/tuvalet/depo/kaldırım masaları)
→ `docs/floorplan-master.md`: zemin kat ASCII planı (zone 1-2 çay salonları önde,
zone 3 tost / zone 4 TV arkada, depo+tuvalet köşe odaları REZERVE, merdiven ön-sağ),
üst kat okey/tavla+balkon notu.

### 3. ZONE-2 ÇALIŞIR ✅ `88bd526` — gecenin büyük işi
- **D-022 per-zone model:** zone-2'nin KENDİ ocağı + bulaşığı + garsonu + bulaşıkçısı.
- Bölme duvarı + geçit; geçit ortasında "2. Salon" pad'i (₺1200 — geçici, aşağıda Ö1).
- Kilitliyken karanlık boş salon; açılınca oto 1 ocak + 1 masa, müşteriler KENDİ
  kapısından girer. Görev hattına 7 yeni görev.
- **SAVE v17→v18** migrasyonlu; eski ilerleme korunur.
- vitest 85/85 (5 yeni zone testi), smoke 27/27, canlıda uçtan uca oynandı.
- → `night-3-zone2-station.png`, `night-3-zone2-locked.png`

### 4. Görsel kimlik ✅ `733de34`
`src/config/palette.ts` = TEK renk kaynağı (varyant denemek = tek dosya değiştirmek).
Ahşap parke + kilimler, krem duvar + lambri, **minderli tabureler**, **masa örtüsü =
seviye** (çıplak→çuha→bordo→lacivert→altın), TV köşesi, kapı tabelası + bahçe
masaları + saksılar. İki düzeltme turu: kilim küçültüldü ("bilardo masası" olmuştu),
eğimli tente ekranı kapatıyordu → dikey tabela. → `night-4-visual-v3.png`,
`night-4-table-evolution.png`

### 5. Curve raporu ✅ `a4933ad` — **ONAYIN GEREKLİ, uygulanmadı**
`docs/curve-report.md`: sim per-zone modele genişletildi + 3 profil (Yoğun/Normal/Rahat).
Ana bulgu: **zone-1 ömrü hedefin altında** (Normal ~25dk; hedefin ~1sa). Öneriler:
- **Ö1:** zone2 kapısı 1200→**2000** ₺
- **Ö2:** zone-2 içi maliyetler ×1.3
- **Ö3:** "yeni salonda servis" görevi 5→10
- **Ö4 (alternatif):** kapıya minLifetime 6000 şartı
Hangileri uygulansın? ("Ö1+Ö2" önerim.)

### 6. Çaycı karakteri ✅ `23c0805`
Altın kapsül emekli: kasketli, bıyıklı, bordo önlüklü çaycı (parçalı gövde — Faz 6
animasyona hazır). → `night-6-character.png`

### 7. Bu paket ✅
APK + bu rapor.

## Sabah karar bekleyenler
1. **Curve önerileri** (yukarıda Ö1-Ö4).
2. **Lavabo/tuvalet mekaniği** zone-3 ile mi gelsin (önerim) yoksa daha erken mi?
3. Görsel kimlikte beğenmediğin renk varsa `palette.ts`'te tek satır.

## Önizleme
Dev sunucu açık bırakıldı: **http://localhost:5173/** (kapanmışsa `npm run dev`).
Not: `npm run apk` sırasında gradle, vite'ın izlediği `android/` klasörünü yeniden yazınca
dev sunucu çöküyordu — vite.config'e watcher ignore eklendi (kalıcı fix).

## Doğrulama durumu
vitest **85/85** · build temiz · sim ilk-alım **60sn sabit** · smoke **27/27** ·
konsol 0 hata · 5 commit push'landı (`main`).
