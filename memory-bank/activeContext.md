# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz
İlk oturum TAMAMLANDI. Faz 0 (planlama) + Faz 1 (3D greybox dikey kesit) bitti ve test edildi.
Bir sonraki iş: **Faz 2 — Mutfak + garson.**

## En son ne yapıldı
- Ortam doğrulandı, Playwright MCP eklendi, Vite + React 19 + R3F stack kuruldu.
- memory-bank + docs + economy.config.ts + simulate.ts + asset manifesti + CLAUDE.md + 2 skill.
- Faz 1 oyun kodu yazıldı: store (zustand + Decimal sim), sahne/oyuncu/istasyon/NPC/coin/pad,
  HUD, joystick, kayıt+offline, dev kancaları, fallback Model loader.
- Testler: Vitest 6/6 ✅, headless duman (tools/smoke.mjs) 6/6 ✅, build temiz, konsol temiz.

## TAM sıradaki adım (Faz 2)
1. **Yardımcı garson** mekaniği: bir pad ile aç; açılınca sipariş istasyondan masaya
   OTOMATİK taşınır (sahip artık çoğunlukla para toplar/büyütür). Garson varlık + basit
   yol (istasyon→masa→istasyon) durum makinesi store'a eklenecek.
2. **Çaydanlık yükseltme seviyeleri** L1-L4 (₺) UI butonu: `economy.config` upgrade spec
   zaten var; store'a `stationLevel++` + maliyet düş + HUD/menü butonu ekle.
3. **Semavere geçiş** ve **yeni çaydanlık yeri** pad'leri (pad sistemini çoğul yap:
   şu an tek `pads.table2`; generic pad listesine genişlet).
4. Her özellik için Vitest + smoke testi ekle; faz bitince oturum-bitir.

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
