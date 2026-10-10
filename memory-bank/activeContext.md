# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-10-10, 2. oturum — Sprint B kısmi kapandı · D-164)

**Kural:** Play Console'u Claude KULLANMAZ. iOS'a inceleme bitmeden build GİTMEZ (sıra sıfırlanır). Play kapalı teste güncelleme serbest.
**Çalışma düzeni:** SPRINT (hafıza `feedback_sprint_yontemi.md`). Sprint B planı `docs/sprintler/sprint-B-plan.md`.

**Bu oturum (Sprint B, 3 Opus ajanı + ChatGPT):**
- ✅ Ekran envanteri: `tools/ekran-envanter.mjs` · 22 ekran × 2 boy × 2 dil · `docs/tasarim/sprint-B/` (repoda yalnız 390×844 TR).
- ✅ 38 kozmetik küçük resmi `public/assets/thumbs/` (143 KB) · `tools/kucuk-resim.mjs` · bekçi `tests/kucuk-resim.test.ts`. HUD'a BAĞLANMADI.
- ✅ UI kit kesim betikleri `tools/ui-kit/` (sentetik 36/36) — gerçek parça sayfası yok.
- ✅ Mikrometin: 16 metin değişti (öğretici EN ≤ 25 harf, "Al"→"Ücretsiz al") · `docs/metinler/sprint-B-mikrometin.md`.
- ⛔ ChatGPT tasarım yönü: iki tur reddedildi; imzalı mağaza cilası çizildi, kullanıcı "boşver" dedi (D-164). D-107 mor geçerli.

## ⏭️ SIRADAKİ ADIM (kullanıcı seçer)
1. iOS 1.0.0 incelemesi biterse: Apple portal → `com.mutlubadem.teahouse` → iCloud → `git merge ios-1.0.1` → Codemagic → 1.0.1.
2. **Sprint C** (UI uygulama, mevcut imzayla): küçük resimleri mağaza şeridine bağla (çapraz pullar kalkar) · görev bandı "0/1" yarım ·
   kırmızı kutu (dekor preload) · video kartı kapat düğmesi CSS · 360 px'te dekor şeridi kesik. İstenirse ChatGPT'nin imzalı mağaza
   cilası (elmas kartı büyük + bonus kurdelesi + Başlangıç afişi) referans alınır — görsel ChatGPT sohbetinde, indirilmedi.
3. P4 saat hilesi (varyant kapısı) + perf Paket 2/3.

## AÇIK KALEMLER
- iOS inceleme sonucu izlenecek; hareket yoksa hızlandırılmış inceleme yeniden istenir.
- Play: 1.0.1 zip arkadaşa (mikrometin değişti → yeni zip gerekirse `npm run play:paket`); servis hesabı JSON'u → RevenueCat; RC'de Android baslangic/reklamsiz = Non-consumable.
- Cihaz turu (Android 1.0.1): `sprint-A-defter.md` "Nasıl kontrol edersin" 5 adımı.
- Deyimix 1.0.1 "Pending Developer Release" — kullanıcı Release diyecek.
- AdMob "ABD eyalet yönetmelikleri" mesajı bakılmadı · ana görev ödülüne "video izle 2×" sorusu açık (varyant kapısı).
- Küçük resimde zayıf üç: semaver (ilkel silindir), Restoran ≈ Krem fayans, Klasik Parke desensiz.
- Duman erken akışı ara sıra düşüyor (DUMAN_PORT=4250) · `i18n/baslat` Preferences'tan önce okuyor (küçük).
