# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-10-10 — Sprint A bitti · Sprint B sırada · D-163)

**Kural:** Play Console'u Claude KULLANMAZ. iOS'a inceleme bitmeden build GİTMEZ (sıra sıfırlanır). Play kapalı teste güncelleme serbest.
**Çalışma düzeni:** SPRINT (hafıza `feedback_sprint_yontemi.md`). Sprint A: plan `docs/sprintler/sprint-A-plan.md` · defter `sprint-A-defter.md`.

**Bu oturum:** Sprint A — 4 paralel Opus ajanı (mağaza · reklam+kabuk · kayıt+bulut · perf P1) + orkestratör bağlama.
- Başlangıç Paketi geri yüklemesi **kol A** (kıyafet + 100 💎, kayıt başına bir kez).
- vitest 1856/1856 · duman 74/74 + EN 4/4 · build temiz · mutasyonlar defterde.
- Sürüm **1.0.1** (kod 10001). `npm run play` + `play:paket` → **`dist-play/TeaHouseTycoon-GooglePlay.zip` TAM (67,3 MB)** — kullanıcı arkadaşa iletecek.
- iOS parçaları **`ios-1.0.1` dalında** (19b385c): iCloud KVS eklentisi `eklentiler/bulut-kayit/`, entitlement, pbxproj, PrivacyInfo, codemagic denetimi.

## ⏭️ SIRADAKİ ADIM
1. iOS 1.0.0 incelemesi biterse: Apple portal → Identifiers → `com.mutlubadem.teahouse` → iCloud (CloudKit'siz) → `git merge ios-1.0.1`
   → Codemagic derleme → 1.0.1 gönder. Swift eklentisi Mac'te hiç derlenmedi: ilk Codemagic koşusu ilk sınav.
2. **Sprint B** (D-162): ChatGPT tasarım turu (düzen katı, palet ChatGPT'de, şikâyetler açıkça) + küçük resim betiği + mikrometin turu
   (Sprint A'nın ~15 yeni TR+EN taslak metni dahil: mağaza sonuçları, kayıt sorunu notları, "Reklam şu an yüklenemedi"). Önce plan dosyası → onay.
3. Sonra Sprint C (UI uygulama; görev bandı "0/1" yarım + EN öğretici satır kesilmesi burada) → P4 saat hilesi (varyant kapısı) + perf Paket 2.

## AÇIK KALEMLER
- iOS inceleme sonucu izlenecek; pazartesiye dek hareket yoksa hızlandırılmış inceleme yeniden istenir.
- Play: 1.0.1 zip arkadaşa; servis hesabı JSON'u gelince RevenueCat'e. Arkadaşa kontrol: RC'de Android baslangic/reklamsiz = **Non-consumable**.
- Cihaz turu (Android 1.0.1): defterin "Nasıl kontrol edersin" 5 adımı · RevenueCat işlem kimliği uzayı (satın alma dönüşü ↔ customerInfo) gerçek cihazda doğrulanmalı.
- Deyimix 1.0.1 "Pending Developer Release" — kullanıcı Release diyecek.
- AdMob "ABD eyalet yönetmelikleri" mesajı Tea House'u kapsıyor mu bakılmadı.
- Ana görev ödülüne "video izle 2×" sorusu açık (varyant kapısı).
- Duman erken akışı ara sıra düşüyor; port 4000 bu makinede dolu kalmış olabilir (DUMAN_PORT=4250 kullanıldı).
- Vitest tam takımda `bardak.test.ts` ③ bir kez düştü (2026-10-09) — yük altında kararsız test (bu oturum düşmedi).
- `i18n/baslat` kaydı Preferences hazırlanmadan okuyor: OS localStorage'ı silerse ilk açılışta dil "oto"ya düşer (küçük).
