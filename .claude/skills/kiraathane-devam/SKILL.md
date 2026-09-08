---
name: kiraathane-devam
description: Köşe Kıraathanesi 3D idle-tycoon projesinde önceki oturumdan devam eder — hafızayı okur, durumu özetler, sıradaki adımı önerir. Tetik: kullanıcı "/kiraathane-devam" veya "kıraathane-devam" dediğinde.
---

# kiraathane-devam — Oturuma devam

Köşe Kıraathanesi 3D idle-tycoon projesinde önceki oturumdan devam ediyorsun.

## Adımlar
1. **Başlangıç okuma seti — SADECE bu üçü (toplam ≤ 15 KB, D-084):**
   - `memory-bank/activeContext.md` — TUR KARTI: şu an, tam sıradaki adım, açık kalemler.
   - `memory-bank/progress.md` — pano tablosu + aktif faz (oturum başına 1-2 satır).
   - `memory-bank/projectBrief.md` — oyun ne, çekirdek döngü.

   **Bunların dışını KENDİLİĞİNDEN OKUMA.** Gerektiğinde, hedefli:
   - `memory-bank/decisions.md` → `D-0xx` ile ara (grep), baştan okuma.
   - `docs/<konu>-raporu-<faz>.md` → sayılar burada; activeContext'te tekrarlanmaz.
   - `memory-bank/arsiv/` → eski oturum anlatısı; yalnız geçmişi araştırırken.
   - `memory-bank/architecture.md` → stack/APK/asset pipeline gerekince.
2. Ortamı hızlı doğrula (yalnız gerekiyorsa): `node`, `git`, `gh auth status`, Playwright MCP.
3. Kullanıcıya **KISA** bir özet ver (tek mesaj):
   - **Şu an buradayız:** aktif faz + en son yapılan
   - **Sıradaki adım:** activeContext'teki TAM sıradaki adım
   - **Açık sorular:** varsa
4. **Onay al.** Onaylanınca tur kartını aç (aşağıdaki sıra).

## OTURUM SIRASI (D-084 — `docs/oturum-akisi-mantik.md`)
```
0 BAŞLA   okuma seti → özet → onay
1 SORU    activeContext tur kartını doldur: SORU · ÖLÇÜLECEK KOLLAR · (boş) SAYILAR · KARAR · UYGULAMA · BEKÇİ
2 ÖLÇ     kısa koşu ile aracı doğrula (bot yürüdü? varyant etkili? korunum 0?) → tam koşu TABAN
          → tüm kollar VARYANT olarak → rapor §Bulgular
          → commit #1: araç + ham çıktı + rapor (KARAR BÖLÜMÜ BOŞ)
3 KARAR   TEK karar paketi mesajı: kol | sayı | takas | öneri ✓ → kullanıcı seçer
4 UYGULA  yalnız kararın kolu → bekçi testi → en az 2 mutasyonla doğrula → final TAM koşu
          → commit #2: kod + test + rapor tamam + D-0xx
5 KAPAT   oturum-bitir
```

## Kurallar
- `CLAUDE.md`'deki tüm kurallara uy (greybox-first, data-driven ekonomi, Decimal, saveVersion,
  etik monetizasyon, test kancaları).
- **VARYANT KAPISI:** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan denge değişikliği,
  raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz. İkilikler (A mı B mi)
  adım 2'de **iki varyant satırıdır** — biri uygulanıp diğeri sonradan ölçülmez.
- **Koşu kipi:** geliştirirken `OLCUM=kisa` (< 60 sn). `OLCUM=tam` yalnız TABAN ve FİNAL koşusu;
  rapora yalnız tam-koşu damgalı sayı girer.
- **Soru turu en fazla 2:** başlangıç onayı + karar paketi. Arada çıkan soru pakete beklemeye
  alınır; sığmayan "sonraki oturumda sor" olarak tur kartına yazılır.
- Faz bitmeden sonrakine geçme. Bir kararda takılırsan kod yazmadan önce sor.
- Oturum sonunda `oturum-bitir` protokolünü uygula.
