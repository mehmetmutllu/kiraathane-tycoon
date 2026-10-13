# Sprint C — arayüz cilası (UI uygulama) · plan + defter

> Başlangıç: 2026-10-13. Kaynak görseller: `docs/tasarim/sprint-C/`. İstemler: `istem-1-cila.md`, `istem-2-revizyon-ikon.md`.
> Karar: D-165. ChatGPT sohbeti: "UI Tasarımını Cilalama" (kullanıcının hesabında).

## Tur 1 — bitti (2026-10-13)
| Konu | Ne yapıldı | Nerede |
|---|---|---|
| Ses arka planda | Android'de ana ekrana dönüşte `visibilitychange` gelmiyordu → `@capacitor/app` `appStateChange` de dinleniyor, tek durum bayrağıyla | `App.tsx` |
| Mağaza sekmeleri | Tek satır, yana kayar, eşit genişlik (`grid-auto-columns: 1fr`), ikon + tam yazı; alt çizgi yok | `HUD.tsx` · `index.css` · `icons.tsx` (Shirt/Lamp/Table/Floor/Wall) |
| Seçim şeridi | Renk pulu yerine ürünün küçük resmi (`/assets/thumbs/`) + altında fiyat/kilit; altı sekmenin hepsinde | `HUD.tsx` |
| Paketler | Başlangıç afişi (Kurucu resmi) + elmas ızgarası (avuç/kese/sandık `GemPackArt`) + Reklamları Kaldır şeridi. "En iyi değer" kurdelesi YOK (fiyat mağazadan, iddia doğrulanamaz) | `HUD.tsx` · `icons.tsx` |
| "{1} eksik" | Mağazadan kalktı (Usta + Çaycı'da kalır) | `HUD.tsx` · bekçi `arayuz-t9d` |
| Askılı tepsi | Tek elde, kol yanda sarkık (`ASKI_KOL` açılma 0,32 · öne 0,12 rad), tutuş klibi yok | `KayActor.tsx` · `actor.ts` · `Player.tsx` |
| Dekor önizleme | Modeller önceden yüklenir (kırmızı yedek kutu yok); kadraj yuva başına BİR kez ölçülür → aynı yuvada arka plan sabit | `VitrinDekor.tsx` · `DekorCekimi.tsx` |
| Zemin/Duvar önizleme | Referans masa ortada (x 0,4 → 0) | `DioramaPreview.tsx` |
| Kurucu kıyafeti | Yelek arkada etek gibi sarkıyordu → `YELEK.yAlt` 0,60 → 0,74 (belde biter); 4 yelekli kıyafetin küçük resmi yenilendi | `kiyafet.ts` · `public/assets/thumbs/` |
| Ekran rengi | Tam ekran paneller AÇIK LİLA (token'lar `.modal-card.screen` içinde yeniden bağlanır, kontur 2 px); HUD koyu kalır | `index.css` (`--lila-*`) · `hud.css` (sonda) |

Doğrulama: vitest 1861/1861 · duman 74/74 · test APK `npm run apk`.

## Tur 2 — SIRADAKİ (kullanıcı onayladı, 2026-10-13)
1. **Zemin rengi:** açık liladan tekrar MOR'a — ama boğmayan bir ara ton (D-107 koyu mor ile bugünkü `--lila-g1 #f1edff` arası).
   `--lila-*` token'larıyla 3-4 aday çekip yan yana göster → kullanıcı seçer. Kartlar beyaz/açık kalabilir; kontrast denetle.
2. **ChatGPT revize tasarımı esas** (`chatgpt-2-revizyon.png`): kart konturları kalkar, yumuşak mor gölge; geri düğmesi beyaz yuvarlak;
   Görevler "SIRADA" = kilit ikonlu sakin satırlar (koşul yazısı ancak oyunda gerçek koşul varsa); turuncu yalnız ana eylem.
   Not: ChatGPT'nin spec listesi resimle çelişiyor ("kontur 0 px") — resim esastır. Seçili sekme hâlâ turuncu → ayrıştır.
3. **İkon setleri (2 × 16, ChatGPT):** önizlemeler `chatgpt-3-ikon1-onizleme.png` · `chatgpt-4-ikon2-onizleme.png`.
   - ÖNCE asıl dosyaları indir (1254×1254, sohbetteki son iki görsel) — indirme izni kullanıcıdan alındı sayılmaz, oturumda sor.
   - Kes: `python -I tools/ui-kit/izgara.py <png> --harita tools/ui-kit/ikon-harita.json` (harita 32 adla güncellenir) →
     `public/assets/ui/ikon/*.webp`. Pembe hız çizgileri (set 2 #7, #12) kesimde silinebilir → gerekirse ikisi yeniden çizdirilir.
   - Bağla: sekme ikonları, para/elmas, alt gezinme (Görevler/Hedefler/Mağaza/Çaycı), ayarlar, kilit, reklamsız, görev fotoğrafları
     (`QuestPhoto`), yükseltme ikonları (tepsi/mıknatıs/hız/leğen…). Kapsam = kullanıcı "bu ikonları kullanalım" dedi: hepsi.
   - Bekçiler: `mor-dil` 7 (SVG ikon kuralı) bitmap ikonlara göre güncellenir; asset lisansı = kendi ürettiğimiz (manifest `public/assets/README.md`).
4. Sarı sayıların açık zeminde solukluğu ("0/14", "+3") — yeni renkte kontrol.
5. Mikrometin: "Ödüllü videolar kalır · her gün {1} elmas" ChatGPT'ye danışılmadı.

## Sprint C'nin dışında
P4 saat hilesi · perf Paket 2/3 · iOS 1.0.1 (inceleme bitmeden yok).
