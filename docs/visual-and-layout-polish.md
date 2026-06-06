# Faz 2f — Görsel / Animasyon / Yerleşim Cilası (✅ UYGULANDI 2026-06-06)

> DURUM: TAMAMLANDI. 4 madde de uygulandı (A taşıma öne 3×2 ızgara + eli-boşken kısıtı, B max 8→6/SAVE_VERSION 10,
> C ocak+bulaşık köşe mutfak bloğu + bounds 7→5, D juice: para süzülme/+₺ floating/radial/buhar/idle bob/yön dönüşü).
> Vitest 40/40, build temiz, sim 84sn, smoke 19/19. Detay: memory-bank/progress.md + activeContext.md.


> Kaynak: kullanıcı build incelemesi (2026-06-06). **Çalışan mantık doğru**; bunlar sunum katmanı.
> Araştırma: My Perfect Hotel / arcade-idle konvansiyonları + R3F juice teknikleri. D-013 (primitive = nihai
> sanat stili) ve docs/serving-and-automation.md §10 ile uyumlu. Faz 3a (zone genişleme) ÖNCESİ yapılır.

## Kullanıcı tespitleri → kod karşılığı
- **Max tepside bardak taştı:** `Player.Tray` tek sıra `-0.18 + i*0.12`, 8 bardak ~0.5 br tepside → taşar.
- **Boşları kafaya topluyor:** `Player.DirtyStack` [0,1.05,-0.4] (sırt/baş); elde tepsi yerine başın arkasında.
- **İstasyonlar bitişik + sol köşe:** ocak [0,0,-5] ortada, bulaşık [-4.8,0,-3] ayrı; bitişik değil.
- **Alan daha küçük başlasın:** `bounds: 7`, geniş zemin.
- **Animasyon eksik:** her şey anlık (pop/akış/juice yok).

## Araştırma bulguları (özet)
- Taşıma = **ellerin önünde derli toplu istif/sütun**, yükseklik sınırlı, TAŞMAZ; toplananlar cüzdana iz bırakıp absorbe.
- **Baş üstü = radial (halka) progress bar** (taşıma DEĞİL, görev/doluluk göstergesi).
- Geri bildirim: floating "+₺", scale-pop, para uçuşu.
- Alan **küçük başlar**, bölümler sırayla açılır (zone).
- R3F: en hafif `useFrame + lerp` / `THREE.MathUtils.damp`; ambient için drei `<Float>`; tek-seferlik pop için
  kendi mini-spring (yeni ağır dep YOK — react-spring gerekmez).

## Yapılacaklar (dilimlenebilir)
**A) Taşımayı tek "el tepsisi"nde topla (kafadan kaldır)** — Player.tsx (+ Waiter/Dishwasher)
   - Temiz (kırmızı) + kirli (gri) aynı ÖNDEKİ tepside; baş üstü yalnız radial bar.
   - Dizilim 2×N ızgara veya istif (cup-in-cup) → taşmaz, kapasiteyle ölçeklenir.

**B) Max kapasite taşma çözümü** — economy.config.ts + carry bileşenleri
   - Seçenek 1: maxLevel kapasitesi 8→6. Seçenek 2: 8 kalsın, ızgara/istif + büyük tepsi.
   - maxLevel/kapasite DÜŞERSE: eski kayıttaki `trayLevel` clamp (küçük migrasyon/sınır).

**C) Yerleşim: ocak+bulaşık bitişik, sol-arka köşe, daha küçük alan** — store.ts LAYOUT + Scene
   - bounds küçült (örn. 7→5); ocak+bulaşık sol-arka köşede bitişik; masaları sıkılaştır; kamera/sınır uysun.
   - Faz 3a zemini: başlangıç = sol köşede tek "salon bloğu"; 3a'da sağa/öne çoğalır.

**D) Juice/animasyon** — bileşenler + küçük yardımcı (useFrame/damp)
   - pickup/drop scale-pop; coin oyuncuya uçar + "+₺" floating (drei Html); pad/yükseltme baş üstü radial bar;
     semaver buharı; müşteri idle bob; yürüyenler hareket yönüne döner (damp rotation).

## Açık kararlar (sonraki oturum başında kullanıcıya SOR)
1. ✅ KARAR (2026-06-06): Max tepsi kapasitesi **8→6'ya İNDİRİLECEK** (kullanıcı: "max kapasite kesin
   azalmalı, 6 olabilir"). Düşerse eski kayıttaki `trayLevel` clamp + küçük migrasyon. Sunum dizilimi
   (3×2 ızgara mı / istif mi) HENÜZ açık — "sunumlara sonra karar veririz". NOT: 6 = 3×2 (3×3 değil, o 9 olur).
2. ✅ KARAR (2026-06-06): **"Eli boşken" kısıtı.** Temiz çay taşırken (`tray>0`) kirli TOPLANAMAZ; temiz tepsi
   boşalınca kirli toplama başlar. Simetrik: kirli taşırken (`carriedDirty>0`) ocaktan temiz ALINAMAZ. Tek seferde
   tek tür → tepside hep tek renk; "götür → topla → yıka" ritmi; arcade-idle "her turda tek istif". UYGULAMA:
   store.ts servis bloğu `tray<trayCap && carriedDirty===0` koşulu; kirli toplama bloğu `tray===0` koşulu.
3. Alan/yerleşim: 2f'de tek-blok mu, yoksa doğrudan 3a ile mi?
4. Bağımlılık: react-spring eklemeden hafif useFrame/damp ile mi (öneri: evet)?

## Doğrulama beklentisi
Mantık değişmediği için ekonomi sim 84sn sabit kalmalı; vitest yeşil; smoke (yeni carry/yerleşim kancalarıyla)
yeşil; konsol temiz. Görsel his Playwright/smoke ile DEĞİL gözle değerlendirilir (3D render doğrulanamaz).
