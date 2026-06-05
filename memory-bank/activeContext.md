# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz
Faz 0 + Faz 1 bitti. Responsive yön eklendi. **Faz 2:** 2a (yükseltme) ✅, 2b (generic pad) ✅,
**2-UX (mekânsal etkileşim D-009)** ✅ bitti ve test edildi. Sıradaki: **2c (yardımcı garson).**

## En son ne yapıldı (kullanıcı feedback'i sonrası)
Kullanıcı çalışan oyunu görüp istedi → mekânsal etkileşime geçildi (D-009):
- Pad'ler artık açtıkları objenin TAM yerinde (LAYOUT.padPos hedef konumlara taşındı).
- Çay yükseltme havada buton DEĞİL: ocağın önünde `LAYOUT.upgradeZone`; üstünde dur →
  HUD alt-orta bar dolar → seviye artar. `activeZone` state'i HUD barını sürer.
- Ocak seviyesi: 3D rozet (drei Html "Çay Lv N") + semaver büyür/renk ısınır.
- Pad set: table2, table3, station2 (addStation, servis ×0.85), samovar (servis ×0.7).

## En son ne yapıldı
- Ortam doğrulandı, Playwright MCP eklendi, Vite + React 19 + R3F stack kuruldu.
- memory-bank + docs + economy.config.ts + simulate.ts + asset manifesti + CLAUDE.md + 2 skill.
- Faz 1 oyun kodu yazıldı: store (zustand + Decimal sim), sahne/oyuncu/istasyon/NPC/coin/pad,
  HUD, joystick, kayıt+offline, dev kancaları, fallback Model loader.
- Testler: Vitest 6/6 ✅, headless duman (tools/smoke.mjs) 6/6 ✅, build temiz, konsol temiz.

## ÖNEMLİ — Ekonomi v2 yeniden tasarımı (kullanıcı feedback'i 2026-06-05)
Kullanıcı mevcut ekonomiyi eleştirdi; **uygulamadan önce** tasarım raporu yazıldı:
`docs/progression-and-economy-v2.md` (Karar D-010). Özet:
- Yükseltme **fiyatı değil throughput'u (çay/dk)** artırır; gelir = darboğaz × fiyat.
- Tüm açılış/yükseltmeler **önkoşullu sıra (gating)** ile (`requires`).
- Pad: yükseltme objenin yanında, açılış objenin yerinde; her pad tek slota bağlı.
- Fiyat sabit taban (hacim-tabanlı). Maliyet eğrisi r≈1.12. Tempo: ilk alım <90sn.
**Sıradaki oturum:** ÖNCE bu ekonomi v2'yi uygula (config+store+gating+simulate+test),
SONRA Faz 2c (garson). Açık sorular raporun §5'inde — kullanıcıya sor.

## TAM sıradaki adım (Faz 2c — yardımcı garson, ekonomi v2 SONRASI)
1. Garson, bir pad ile açılsın (config.pads'e `waiter` effekti ekle ya da ayrı bir
   "hasWaiter" pad'i). Açılınca state'e `hasWaiter=true` (persist).
2. Garson varlığı: store'da basit durum makinesi (istasyon→masaya yürü→servis→istasyona
   dön). Şu an servis timer ile otomatik; garson VARSA görsel taşıma + (opsiyonel) servis
   hızına/erişilebilirliğe etki. Sahip artık çoğunlukla para toplar/büyütür.
3. Sahnede garson kapsülü (farklı renk) + yol animasyonu. window.__game'e hasWaiter ekle.
4. Vitest + smoke. Faz 2 (2a+2b+2c) bitince Faz 2'yi ✅ işaretle, oturum-bitir.

## Faydalı dev kancaları (konsol)
`__game()`, `__advanceTime(60)`, `__addMoney(1000)`, `__upgradeStation()`,
`__teleport(x,z)` (pad'e ışınla: padPos `__game().padPos`), `__resetGame()`.

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
