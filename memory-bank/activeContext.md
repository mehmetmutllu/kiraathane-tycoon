# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-10-13 — Sprint C tur 1 kapandı · D-165)

**Kural:** Play Console'u Claude KULLANMAZ. iOS'a inceleme bitmeden build GİTMEZ. Play kapalı teste güncelleme serbest.
**Çalışma düzeni:** kullanıcı önce SEÇENEK ister ("direkt değiştirme, seçenek sun"); görsel kararlar ekran görüntüsüyle gösterilir.

**Bu oturum (tek oturum, ajan yok):** ses arka planda susar · mağaza yeniden düzeni (kayan ikonlu sekmeler, küçük resimli şerit,
paket afişi + elmas ızgarası + reklamsız şeridi, "eksik" satırı yok) · askılı tepsi tek elde · dekor önizlemesi sabit arka plan ·
zemin/duvar önizleme ortalı · Kurucu yeleği belde biter · tam ekran paneller açık lila · ChatGPT cila turu (yerleşim kilitli) +
2×16 ikon. Ayrıntı: `docs/sprintler/sprint-C-plan.md`. Görseller: `docs/tasarim/sprint-C/`.

## ⏭️ SIRADAKİ ADIM — Sprint C tur 2 (kullanıcı onayladı)
- ✅ **İkonlar geçti (D-166):** 32 bitmap ikon `public/assets/ui/ikon/` · ekran görüntüleri `docs/tasarim/sprint-C/ikon-*.png`.
1. Zemin: lila → **boğmayan mor ara ton**. Adaylar ÇEKİLDİ, kullanıcı seçecek: https://claude.ai/artifact/G1mLiwdtpvW2sgCTYBib7s
   Seçilen harfi `index.css` `--lila-*`e yaz (g1 · g2 · kart · kart2 · oyuk · tx · tx2 · ot · madalyon):
   A Lavanta `#e2daf9 #d2c6f4 #ffffff #f6f2ff #cfc3f3 #261d5e #5f519f #3b2f86 #c9bbf6`
   B Orta lila `#c7baf0 #b2a2e8 #ffffff #f3eefe #c3b5ef #211857 #54479a #33287a #b9a9f0`
   C Ametist `#9d8fe0 #8576d2 #faf8ff #eee8ff #d9cff8 #1c1450 #4c4090 #2c226e #c4b7f5` (zemindeki soluk yazı 2,3:1 → koyulaştır)
   D Yumuşak gece `#5c51a6 #443a8c #6b60b6 #5f54aa #352c74 #f4f0ff #ddd6f8 #1d1650 #8a7be0` (açık metin; `--k3` gölgesini kontrol et)
   Sonra sarı sayıların (amber/kart 2,1–2,5:1) okunurluğuna bak.
   **Kullanıcı eğilimi: C Ametist** — ama Başlangıç Paketi afişi değişsin. Afiş seçenekleri (Ametist üstünde):
   https://claude.ai/artifact/FHxaDEgDNa4kqUeuWLbSXe · `.paket-afis` arka planı (index.css ~1427):
   1 Beyaz = `var(--kart)` · 2 ChatGPT = beyaz→#efe9ff→#d8cbff radyal + 4 beyaz ışıltı noktası + sağ altta `elmas-sandik` ikonu (92 px, mutlak)
   · 3 Altın = #fff6d8→#ffe08a→#f6b73c radyal + `repeating-conic-gradient` beyaz ışın (%35) · 4 Koyu = #7f6fe0→#4a3da6→#2f2577 + ışın %7, beyaz yazı.
   2. tur (aynı link, v2) kullanıcı 3/4 arasında kaldı; yeni: 5 Altın+sandık · 6 Koyu mor zemin + altın ışın/çerçeve/başlık
   · 7 Gün batımı (altın→mor 100° doğrusal + ışın %16, beyaz yazı) · 8 Koyu mor + sandık + ışıltı · 9 Beyaz + altın çerçeve/ışın + sandık.
   Not: `.paket-afis.full` opacity 0,75 alınmış afişi boğuk gösteriyor — seçenekler alınmamış hâlde çizildi; alınmış hâli ayrıca düşün.
2. ChatGPT revize tasarımı uygula (`chatgpt-2-revizyon.png`): kontursuz kartlar + yumuşak gölge, beyaz yuvarlak geri,
   "SIRADA" kilitli sakin satırlar, turuncu yalnız ana eylem (seçili sekme ayrışsın).
3. Sonra: test APK (`npm run apk`) kullanıcı telefonda dener.

## AÇIK KALEMLER
- iOS inceleme: 2026-10-12 Apple'a "App Review Status" sorgusu gönderildi (vaka 102994418818); cevap mutlubadem4456@gmail.com'a gelir. Gönderime dokunma, hızlandırılmış inceleme tekrar istenmez.
- Play: 1.0.1 zip arkadaşa (mikrometin değişti → yeni zip gerekirse `npm run play:paket`); servis hesabı JSON'u → RevenueCat; RC'de Android baslangic/reklamsiz = Non-consumable.
- Cihaz turu (Android 1.0.1): `sprint-A-defter.md` "Nasıl kontrol edersin" 5 adımı.
- Deyimix 1.0.1 "Pending Developer Release" — kullanıcı Release diyecek.
- AdMob "ABD eyalet yönetmelikleri" mesajı bakılmadı · ana görev ödülüne "video izle 2×" sorusu açık (varyant kapısı).
- Küçük resimde zayıf üç: semaver (ilkel silindir), Restoran ≈ Krem fayans, Klasik Parke desensiz.
- Duman erken akışı ara sıra düşüyor (DUMAN_PORT=4250) · `i18n/baslat` Preferences'tan önce okuyor (küçük).
