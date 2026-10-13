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
1. **SEÇİLDİ (kullanıcı 2026-10-13, D-167) — UYGULA:** zemin **C Ametist** + Başlangıç Paketi afişi **8 Koyu mor + sandık**.
   `index.css` `--lila-*` (g1 · g2 · kart · kart2 · oyuk · tx · tx2 · ot · madalyon) =
   `#9d8fe0 #8576d2 #faf8ff #eee8ff #d9cff8 #1c1450 #4c4090 #2c226e #c4b7f5` · zemine doğrudan yazılan soluk yazı (tx2/g2 2,3:1) koyulaştır.
   Afiş (`.paket-afis`, index.css ~1427): ışıltı (4 beyaz nokta) + `repeating-conic-gradient(from 0deg at 20% 50%, rgba(255,255,255,.07) 0 10deg, transparent 10deg 20deg)`
   + `radial-gradient(110% 130% at 20% 50%, #7f6fe0, #4a3da6 60%, #2f2577)`; başlık/içerik beyaz + koyu yazı gölgesi;
   sağda `elmas-sandik` ikonu (HUD.tsx afiş JSX'ine `Ikon`). **Kullanıcı: sandık konumu KÖTÜ** (sağ altta taşıyor, düğmeye yakın) →
   daha iyi yer için 2-3 konum çek, göster. Alınmış hâl: `.full` opacity 0,75 boğuyor → ayrıca düşün. Görseller: artifact FHxaDEgDNa4kqUeuWLbSXe.
   Sonra sarı sayıların (amber/kart 2,1–2,5:1) okunurluğuna bak.
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
