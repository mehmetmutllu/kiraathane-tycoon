# FPS BULGULARI — turu-5 madde 13 (2026-06-13 gece, ölçümlü)

Kullanıcı semptomu: "FPS ilerledikçe düşüyor; KAPA-AÇ DÜZELTİYOR; boş mapte akıcı."
"Kapa-aç düzeltiyor" = birikim TRANSIENT state'te (kayda yazılmıyor) → iki kanıtlı kaynak bulundu.

## Bulgu 1 — FLOATER SIZINTISI (FIX UYGULANDI ✅)
- **Ölçüm:** 377 para toplatıldı → 3.5sn sonra DOM'da **395 `.floater`** (drei `<Html>`) hâlâ canlı;
  FPS 12-16'ya düştü. Her Html = DOM node + HER FRAME matrix/projeksiyon hesabı.
- **Kök neden:** `MoneyFloater` useEffect deps `[onDone]` — `onDone` inline closure olduğundan her
  `Coins` render'ında (yani HER toplamada) yeni referans → 900ms ömür timer'ı sürekli RESET →
  aktif oynayışta floater'lar pratikte hiç ölmüyor. Oturum uzadıkça birikir; reload (state sıfır)
  düzeltir — kullanıcı semptomuyla birebir.
- **Fix:** timer MOUNT'ta bir kez (`onDoneRef` deseni). Doğrulama: aynı senaryoda 1.5sn sonra
  **0 floater**, FPS 16→**39** (masaüstü, 377-coin sahnesi sonrası).

## Bulgu 2 — COIN BİRİKİMİ (öneri — UYGULANMADI, tasarım kararı)
- **Ölçüm:** oyuncu köşede AFK + 10dk simülasyon → **377 coin** sahnede; FPS **24** (masaüstü!).
  Telefonda çok daha sert düşer. `money.lifetime: 0` (paralar ASLA kaybolmaz — bilinçli tasarım,
  oto-toplayıcı Faz 4) + her coin AYRI mesh + castShadow + kendi useFrame aboneliği.
- Coins TRANSIENT → kapa-aç sıfırlıyor (semptomun ikinci yarısı).
- Paylaşımlı geometry/material UYGULANDI ✅ (görsel fark sıfır; GC/VRAM şişmesi gitti) ama draw
  call sayısı coin başına 1 sürüyor.
- **Sabah seçenekleri (onaya):**
  - **A) InstancedMesh (önerilen):** tüm coin'ler tek draw call; spawn-pop + dönüş instance
    matrix'le korunur. Davranış/görsel AYNI, orta boy render işi (~1 oturum).
  - **B) Para yığını birleştirme (merge):** aynı masanın altına düşenler tek "deste" objesinde
    toplanır (klasik tycoon görseli) — draw call yapısal sınırlanır AMA görsel/tasarım değişikliği.
  - C) İkisi birden (B görsel + A güvence).

## Bakılan ve TEMİZ çıkanlar
- `dishes` bardak havuzuyla sınırlı (~30 tavan) ✓ · NPC tavanı koltuk+2 (~28) ✓ ·
  notice/quest ikonları key'li, birikmiyor ✓ · navGrid cache'li (masa/zone değişiminde bir kez) ✓.
- r3f otomatik dispose: NPC mount/unmount'unda inline geometry'ler serbest kalıyor (sızıntı değil,
  yalnız GC churn).

## Telefonda beklenen etki
Floater fix'i tek başına uzun oturum çöküşünün ana eğrisini düzeltmeli (turu-5 APK'sında test).
Coin birikimi AFK/az-toplamalı oyunda hâlâ üst sınırı zorlar → A/B kararı sabah.
