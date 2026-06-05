# Köşe Kıraathanesi 🫖

Üretim kalitesinde, mağazaya çıkacak **3D idle-tycoon** mobil oyun. Bir Türk
kıraathanesini sıfırdan büyüt: çay servisi, mutfak, garsonlar, okey/tavla masaları,
nargile terası.

**Çekirdek döngü:** NPC sipariş verir → (garson) taşır → müşteri öder → para yere düşer
→ sahip karakteriyle topla → yükselt & pad'lerle mekânı büyüt → prestige (Renovasyon).

## Stack
TypeScript · Vite · React 19 · React Three Fiber (+ drei / rapier / postprocessing) ·
Zustand · break_infinity.js. Mobil (sonraki fazlar): Capacitor + RevenueCat + AdMob.
Stil: **low-poly stilize, greybox-first.** Motor olarak Unity DEĞİL — gerekçe
`memory-bank/decisions.md`.

## Komutlar
```bash
npm install
npm run dev      # geliştirme sunucusu (http://localhost:5173)
npm run build    # tip kontrolü + üretim derlemesi
npm run test     # Vitest mantık testleri
npm run sim      # ekonomi curve simülasyonu
node tools/smoke.mjs   # headless tarayıcı duman testi (dev sunucusu açıkken)
```

Dev konsol kancaları: `__game()`, `__advanceTime(60)`, `__resetGame()`.

## Proje düzeni
- `memory-bank/` — çok-oturumlu hafıza (brief, mimari, ilerleme, aktif bağlam, kararlar)
- `docs/` — oyun tasarımı, ekonomi, monetizasyon (etik/çocuk-güvenli), asset planı
- `src/config/economy.config.ts` — tüm denge sayılarının TEK kaynağı
- `src/game/` — zustand store + simülasyon, kayıt/migrasyon, Decimal
- `src/components/three|ui/` — 3D sahne ve HUD/joystick

## Durum
Faz 0 (planlama) + Faz 1 (3D greybox dikey kesit) tamam. Sıradaki: Faz 2 (mutfak + garson).
Detaylı faz takibi: `memory-bank/progress.md`.

## Çok-oturumlu çalışma
Yeni oturumda `/kiraathane-devam` ile kaldığın yerden devam et; `oturum-bitir` ile kapat.
