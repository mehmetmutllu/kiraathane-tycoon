# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-10-09 — genel tarama bitti · Sprint A sırada · D-162)

**Kural:** Play Console'u Claude KULLANMAZ. iOS'a inceleme bitmeden build GİTMEZ (sıra sıfırlanır). Play kapalı teste güncelleme serbest.
**Çalışma düzeni:** SPRINT (hafıza `feedback_sprint_yontemi.md`): plan dosyası → onay → paralel Opus ajan (dosya sahipliği,
commit yok, ≤25 satır rapor, ara not dosyası) → orkestratör birleştirir + test + ≥2 mutasyon + faz commit'i → değişiklik defteri.

**Bu oturum (kod yok):** 9 Opus ajanı salt-okunur tarama + tasarım. Hepsi tek dosyada: **`docs/tarama-raporu-2026-10-09.md`**
(§2 mağaza P1 · §3 kayıp P2/P3 · §4 saat P4 · §5 perf · §6 UI teşhisi · §7 ChatGPT yöntemi · §8 sprint bölünmesi).
- ASC (Chrome): 1.0.0 + 5 IAP 10-08 15:22'den beri Waiting for Review; sözleşme/banka/vergi/DSA Active. Sorun görünmüyor.
- WordMaster + AI Dungeon terminallerinden sprint + token tasarrufu + ChatGPT UI yöntemi öğrenildi (rapor §7).

## ⏭️ SIRADAKİ ADIM — Sprint A
1. Önce kullanıcıya **Başlangıç Paketi sorusunun cevabını** ver (rapor §4.4): "geri yükleme bir kez daha 💎 vermek kayıp mı?"
   → normalde aynı kayıtta hiçbir şey vermez; yalnız kaydı gelmeyen yeni cihazda kaybolan içeriği teslim eder. Alternatif: yalnız
   kıyafet. Karar onun.
2. `docs/sprintler/sprint-A-plan.md` yaz (rapor §8 ajan bölünmesi: ① iap ② ads+App ③ save+bulut+Preferences+Android backup
   ④ perf Paket 1; store.ts/HUD.tsx/tick.ts birleştirmesi orkestratörde) → kullanıcı onayı → ajanlar.
3. Sprint A sonu: test + duman + mutasyon → `npm run play:paket` → zip arkadaşa. iOS parçaları (iCloud KVS eklentisi,
   entitlement, Apple portalında App ID → iCloud kutusu) hazır bekler → onay gelince 1.0.1.
4. Sonra Sprint B (ChatGPT tasarım turu, D-162 kuralları: düzen katı, palet ChatGPT'de, şikâyetler açıkça) → Sprint C.

## AÇIK KALEMLER
- iOS inceleme sonucu izlenecek; pazartesiye dek hareket yoksa hızlandırılmış inceleme yeniden istenir.
- Play: zip arkadaşta; servis hesabı JSON'u gelince RevenueCat'e. Arkadaşa kontrol: RC'de Android baslangic/reklamsiz = Non-consumable.
- Deyimix 1.0.1 "Pending Developer Release" — kullanıcı Release diyecek.
- AdMob "ABD eyalet yönetmelikleri" mesajı Tea House'u kapsıyor mu bakılmadı.
- Ana görev ödülüne "video izle 2×" sorusu açık (varyant kapısı).
- Duman erken akışı ara sıra düşüyor — yeniden koşunca geçiyor.
- Yeni EN metinler (~20) ChatGPT turuna girmedi (Sprint B mikrometin turuna).
- Vitest tam takımda `bardak.test.ts` ③ bir kez düştü (2026-10-09), tek başına 3/3 geçiyor — yük altında kararsız test.
