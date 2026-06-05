# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz
Faz 0 + Faz 1 bitti. Responsive yön (portrait+landscape) eklendi. **Faz 2 başladı:**
2a (çay yükseltme L1-L4) bitti ve test edildi. Sıradaki: **2b (generic pad sistemi).**

## En son ne yapıldı
- Ortam doğrulandı, Playwright MCP eklendi, Vite + React 19 + R3F stack kuruldu.
- memory-bank + docs + economy.config.ts + simulate.ts + asset manifesti + CLAUDE.md + 2 skill.
- Faz 1 oyun kodu yazıldı: store (zustand + Decimal sim), sahne/oyuncu/istasyon/NPC/coin/pad,
  HUD, joystick, kayıt+offline, dev kancaları, fallback Model loader.
- Testler: Vitest 6/6 ✅, headless duman (tools/smoke.mjs) 6/6 ✅, build temiz, konsol temiz.

## TAM sıradaki adım (Faz 2b — generic pad sistemi)
1. `economy.config.pads`'i tek `table2`'den **pad listesine** çevir: her pad
   `{ id, label, cost, fillRate, effect }`. Faz 1 davranışı korunmalı (2. masa).
2. Store'daki tek `padFill` + sabit `LAYOUT.pad`'i **pad başına** duruma çevir
   (her açık pad'in fill'i; açılınca effect uygulanır: tables++ / yeni istasyon / semaver).
   Kayıt şemasını migrate et (saveVersion++; eski `padFill` → ilk pad'e map).
3. Pad'leri sahnede çoklu çiz; HUD pad ilerlemesini aktif pad'e göre göster.
4. Pad effect'leri: 2. masa (mevcut), **yeni çaydanlık yeri** (2. istasyon), **semavere
   geçiş** (görsel + kapasite/hız etkisi). Vitest + smoke ekle.
5. Sonra **2c (garson)**. Faz bitince oturum-bitir.

## Açık sorular / kararlar
- Pad sistemi şu an tek-amaçlı (2. masa). Faz 2'de generic "pad listesi" yapısına
  refactor gerekecek (id, hedef, maliyet, fillRate, açılınca etki).
- Ekonomi tempo ilk satın alımda yavaş (~6dk); Faz 2 dengelemede config ayarlanacak.
- Asset stili Quaternius/Kenney (CC0) varsayıldı; bütçe gelirse Synty (Faz 6) onayla.
- AdMob Capacitor eklentisi Faz 5'te doğrulanacak.

## Hızlı komutlar
- `npm run dev` · `npm run build` · `npm run test` · `npm run sim`
- Duman testi: `npm run dev` (ayrı) → `node tools/smoke.mjs`
- Dev konsol: `__game()`, `__advanceTime(60)`, `__resetGame()`
