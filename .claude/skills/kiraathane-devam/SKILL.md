---
name: kiraathane-devam
description: Köşe Kıraathanesi projesinde kaldığın yerden devam et. Hafıza bankasını okur, "şu an buradayız / sıradaki adım" özetini verir, onay alır, devam eder. Tetik: kullanıcı /kiraathane-devam yazınca veya "kıraathane-devam" / "kaldığımız yerden devam" dediğinde.
---

# kiraathane-devam — Oturuma devam

Köşe Kıraathanesi 3D idle-tycoon projesinde önceki oturumdan devam ediyorsun.

## Adımlar
1. Şu dosyaları SIRAYLA oku (proje kökünden):
   - `memory-bank/projectBrief.md` — oyun ne, çekirdek döngü.
   - `memory-bank/architecture.md` — stack, skill/MCP, asset pipeline.
   - `memory-bank/progress.md` — faz durumu, alt görevler, bilinen buglar, sıradaki kilometre taşı.
   - `memory-bank/activeContext.md` — ŞU AN ne, en son ne yapıldı, TAM sıradaki adım, açık sorular.
   - Gerekirse `memory-bank/decisions.md` ve ilgili `docs/`.
2. Ortamı hızlı doğrula (gerekirse): `node`, `git`, `gh auth status`, Playwright MCP.
3. Kullanıcıya KISA bir özet ver:
   - **Şu an buradayız:** (aktif faz + en son yapılan)
   - **Sıradaki adım:** (activeContext'teki TAM sıradaki adım)
   - **Açık sorular:** (varsa)
4. **Onay al** ("Bu adımdan devam edeyim mi?"). Onaylanınca devam et.
5. İlerledikçe `activeContext.md`'yi (ve anlamlı adımda `progress.md`'yi) güncelle.

## Kurallar
- `CLAUDE.md`'deki tüm kurallara uy (greybox-first, data-driven ekonomi, Decimal, saveVersion,
  etik monetizasyon, test kancaları).
- Faz bitmeden sonrakine geçme. Bir kararda takılırsan kod yazmadan önce sor.
- Oturum sonunda `oturum-bitir` protokolünü uygula.
