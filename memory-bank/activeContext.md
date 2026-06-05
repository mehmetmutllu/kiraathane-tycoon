# activeContext — ŞU AN

> En sık güncellenen dosya. Her anlamlı adımdan sonra güncelle.

## Şu an neredeyiz (oturum kapandı 2026-06-05)
Faz 0 + Faz 1 ✅. Responsive yön ✅. Faz 2: 2a ✅, 2b ✅, 2-UX (mekânsal D-009) ✅.
Ardından **Ekonomi v2 tasarımı + kararları kilitlendi (D-010)** — kod henüz YAZILMADI.
**Sıradaki oturum (ÖNCELİK):** Ekonomi v2'yi UYGULA, SONRA Faz 2c (garson).

## En son ne yapıldı (bu oturumun sonu)
- Kullanıcı feedback'i → ekonomi/ilerleme yeniden tasarlandı (uygulama değil, plan):
  `docs/progression-and-economy-v2.md` + D-010.
- Kilitlenen kararlar: (1) çay fiyatı sabit, artış yeni menü ürünleriyle; (2) talep
  kapasiteyi otomatik takip eder (~%15 önde, mekân hep dolu) + Tabela/İtibar & ödüllü video
  opsiyonel; (3) gating omurgası "önceki alındı" önkoşul zinciri + lifetime-₺ destek.
- Daha öncesinde (aynı oturum): mekânsal etkileşim (D-009) — pad'ler objenin yerinde,
  çay yükseltme `LAYOUT.upgradeZone`'da (alt-orta bar), ocak seviyesi rozet+semaver görseli.
- Testler: Vitest 10/10 ✅, smoke 9/9 ✅. Tree temiz, origin/main ile senkron.

## ⚠️ Ekonomi v2 uygulanırken DİKKAT (sonraki oturum)
- Mevcut kodda `teaPrice(stationLevel)` çay değerini seviyeyle ARTIRIYOR — bu D-010 ile
  GEÇERSİZ. stationLevel etkisini **fiyattan → brewRate (çay/dk)** taşı; gelir = darboğaz×fiyat.
- Pad/zone'lara `requires` (prev/minTables/minStationLevel/minLifetime) ekle; görünürlüğü gate'le.
- `tools/simulate.ts`'i bottleneck modeline güncelle; tempo (ilk alım <90sn) doğrula.

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
