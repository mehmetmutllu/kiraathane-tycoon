# CLAUDE.md — Köşe Kıraathanesi (çalışma kuralları)

Üretim kalitesinde, mağazaya çıkacak 3D idle-tycoon mobil oyun. ÇOK OTURUMLU çalış.
Hafıza `/memory-bank/`'te; her oturum `/kiraathane-devam` ile başla, `oturum-bitir` ile bitir.

## Stack (kesin — Unity DEĞİL)
TypeScript · Vite · React 19 · @react-three/fiber + drei + rapier + postprocessing ·
three · Zustand · break_infinity.js (Decimal). Mobil: Capacitor (Faz 7). IAP: RevenueCat,
Reklam: Capacitor AdMob (Faz 5). Test: Vitest (mantık) + Playwright MCP (UI/duman).
Stil: LOW-POLY STİLİZE, gerçekçiye kaçma. Gerekçe: `memory-bank/decisions.md`.

## Klasör yapısı
```
memory-bank/  hafıza   |  docs/  planlama   |  tools/  simulate.ts
public/assets/ models/ audio/ + README manifest
src/config/   economy.config.ts (TEK sayı kaynağı)
src/game/     zustand store, sistemler, kayıt, decimal yardımcı
src/components/three/  sahne/oyuncu/istasyon/NPC/pad/para
src/components/ui/     HUD, joystick
.claude/skills/  kiraathane-devam, oturum-bitir
```

## Geliştirme kuralları
- **Her özellik küçük ve test edilebilir. Faz bitmeden sonrakine geçme.** (Fazlar: `progress.md`.)
- **Para/büyük sayı = break_infinity `Decimal`** (`src/game/decimal.ts`), ham Number değil.
- **Tüm denge sayıları `economy.config.ts`'te** (data-driven). Sayı koda gömme.
- **Kayıt: `saveVersion` + migrasyon.** Şema değişince eski kayıt migrate edilir; ilerleme kaybolmaz.
- Güvenlik/temiz kod; gereksiz soyutlama/yorum yok; mevcut dosyaları düzenle.
- Bir kararda takılırsan **kod yazmadan önce sor.**

## Test kancaları (dev) — 3D sahne görsel doğrulanamaz
- `window.__game` üstünde oyun durumunu aç: `wallet`, `diamonds`, `tables`, `stations`,
  `npcCount`, `pad` (doluluk). Salt-okunur anlık görüntü.
- `window.__advanceTime(sn)` dev kancası: simülasyonu o kadar saniye hızlı ileri sarar.
- Playwright testleri: konsol hatası YOK + DOM HUD değerleri + simüle klavye (WASD) girişi +
  yukarıdaki kancaları kontrol eder. Sahnenin görsel render'ı değil, DURUMU doğrulanır.

## Asset kuralları
- **Greybox-first:** model olmadan ilkel şekillerle tam oynanır.
- **Fallback loader:** `.glb` yoksa ilkel şekle otomatik düş (`components/three/Model.tsx`).
- **Tek stil kilidi:** Quaternius/Kenney (CC0). Karışık sanatçı yasak.
- **Lisans:** belirsiz hiçbir asset commit'lenmez. Manifest: `public/assets/README.md`.

## Monetizasyon kuralları (etik + çocuk-güvenli — zorunlu)
- Interstitial sadece doğal aralarda, sıklık-sınırlı, eylem ortasında asla.
- Rewarded hep opsiyonel, ilerleme için zorunlu değil (yalnız hızlandırır).
- "Reklamları Kaldır" IAP'si ödüllüye dokunmaz. Gerçek parayla loot-box YOK.
- Reklam SDK'sı çocuğa-yönelik/sınırlı-veri modunda. Detay: `docs/monetization.md`.

## Oturum bitirme protokolü ("oturumu bitir" denince veya anlamlı parça bitince)
1. `progress.md` + `activeContext.md` güncelle.
2. Testleri çalıştır (`npm run test`, mümkünse Playwright duman).
3. `git add -A && git commit -m "<anlamlı mesaj>"`.
4. `git push`.
5. Aynen şu mesajı ver:
   `✅ Kaydedildi ve push'landı. Artık /clear yapıp yeni oturumda /kiraathane-devam ile devam edebilirsin.`
Dosyaları her anlamlı adımdan sonra da güncelle.

## Komutlar
- Geliştirme: `npm run dev` · Build: `npm run build` · Test: `npm run test` ·
  Ekonomi simülasyon: `npx tsx tools/simulate.ts`
- Devam: `/kiraathane-devam` veya "kıraathane-devam" → kaldığım yerden.
