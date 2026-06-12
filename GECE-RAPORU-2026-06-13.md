# 🌙 GECE RAPORU — 2026-06-13 (turu-5 gece oturumu)

Günaydın! Turu-5 listesinin gece yapılabilir kısmının TAMAMI bitti: **UX paketi uygulandı**,
**denge raporu hazırlandı (uygulanmadı — onayını bekliyor)**, **FPS'in kök nedeni bulundu ve
ana sızıntı düzeltildi**, **kamera+map planı yazıldı**. Telefonda test için **YENİ APK hazır**:
`android/app/build/outputs/apk/debug/app-debug.apk` (UX paketi + FPS fix'leri dahil).

## ✅ 1) HIZLI UX PAKETİ (m.7/8/9/10/11) — uygulandı, commit 7f84ec1
- **m.7** Kilitli karakter sekmeleri artık HİÇ görünmüyor; karakter tutulunca sekme beliriyor.
  Hiç personel yokken sekme çubuğu tamamen gizli. 📸 `night-ux1-panel-tek-sekme.png` (taze oyun),
  `night-ux2-panel-4-sekme.png` (gelişmiş kayıt).
- **m.8** Spotlight çakışması: kök neden table2 bitişinin AYNI anda hem "çay yükselt" reveal
  kamera panını hem karakter-butonu spotlight'ını tetiklemesiydi → spotlight beklerken reveal panı
  bastırılıyor; ekranda TEK yönlendirme kalıyor (toast yine çıkar; sonraki görev kamerayı zaten götürür).
- **m.11** Tost bulaşığı tepside artık TABAK (yayvan disk + kırıntı); bardak/tabak ayrı sayılıyor,
  yıkama/havuz ortak. 📸 `night-ux3-tabak-ve-kare-masa.png`.
- **m.10** Tost masası 1-2 koltukta KARE, 4 koltuğa çıkınca (L3+) DİKDÖRTGEN.
  📸 `night-ux4b-tost-L3-dikdortgen.png` (sağ-altta L3 dikdörtgen, solda L0 kareler).
- **m.9** Oyuncu-aktör çarpışması KALKTI — kalabalığın içinden geçersin; personel sana yol
  vermeye devam ediyor; masalar/mobilya katı.

## 📊 2) DENGE RAPORU (m.1/2/3/4/5+6) — `docs/denge-raporu-2026-06-13.md` — **UYGULANMADI**
Şartın gereği her şey hesaplandı (sim 3 profil + el hesabı). Özet öneriler:
- **Ocak:** +2 ₺ seviyesi (çay L5 102 / L6 153; tost 2040/3060; Usta L7'ye kayar; migrasyon GEREKMEZ).
- **Tost darboğazı ÖLÇÜLDÜ:** arz/talep **1:5-8** (!) → `prepTime 14→11` + yukarıdaki +2 seviye paketi.
- **Garson tepsisi:** maliyet indirimi 800/2400/6000 → **400/1500/4500** (quest yeri AYNI kalır →
  **v29 migrasyonu GEREKMEZ**); amortisman 32dk→16dk. (Reorder isteseydin v29 gerekirdi — rapora koydum.)
- **Karakter eğrisi:** tepsi T3 15.000→**5.000**, T4 60.000→**18.000** (köprülü eğri tablosu raporda).
- **Fiyat indirimi:** önerim **Seçenek B** — YALNIZ garson-öncesi −%15 (table3 110, garson 130,
  tepsiT2 130); genel indirim ÖNERMEM (z2/z3 zaten −%10 almıştı; "salon ~1sa+" şartını bozar).

## 🔥 3) FPS (m.13) — KÖK NEDEN BULUNDU — `docs/fps-bulgulari-2026-06-13.md`, commit b6e7008
"Kapa-aç düzeltiyor" iki kanıtlı birikimle açıklandı:
1. **FLOATER SIZINTISI (DÜZELTİLDİ ✅):** "+para" yazıları toplama sürdükçe hiç silinmiyordu
   (timer her toplamada resetleniyordu). Ölçüm: 395 floater DOM'da, FPS 12-16 → fix sonrası
   0 floater, FPS 39. Uzun oturum çöküşünün ana nedeni buydu; APK'da test etmeni bekliyor.
2. **PARA BİRİKİMİ (KARARINI BEKLİYOR):** paralar hiç kaybolmadığından (bilinçli tasarım) AFK'da
   10dk'da 377 para birikti → FPS 24. Geometri/materyal paylaşımı uygulandı (görsel fark sıfır);
   asıl çözüm için karar senin: **A) InstancedMesh** (görsel aynı, tek draw call — önerim) /
   **B) para yığını birleştirme** (klasik tycoon "deste" görseli — tasarım değişikliği).

## 🗺️ 4) KAMERA+MAP PLANI (m.12) — `docs/kamera-map-plan-2026-06-13.md` — **UYGULANMADI**
Ölçüm: sıralar arası net koridor **0.0 br** (tabureler değiyor — "yürünmüyor" hissinin kanıtı).
Önerim: **masa aralarını aç (kolon 4.4→5.2, sıra 2.9→3.5) + kamera d 7→6.4** (zone alanı sabit,
zincirleme etki dar). Map genel ölçek ×1.15'i ÖNERMEM (tempo/sabır dengesini oynatır).

## ✔️ Doğrulama (her milestone'da)
vitest **182/182** (4 yeni test) · build · smoke **27/27** · sim eğri AYNI (z3 dolu @1.63sa) ·
Playwright canlı 390×844, konsol 0 hata · 3 commit push'landı (7f84ec1, b6e7008, + kapanış).

## ☀️ SABAH KARARLARI (sırayla cevaplaman yeterli)
1. Denge raporu 5 onay sorusu (`docs/denge-raporu-2026-06-13.md` en altta) — özellikle
   fiyat için A mı B mi?
2. FPS para çözümü: InstancedMesh (A) mı para-yığını (B) mi?
3. Kamera+map: B+A-hafif paket onay mı? d 6.4 mü 6.0 mı? (3. soru: zone alanı da büyüsün mü?)
4. Telefon testi: yeni APK'da özellikle → panel sekmeleri, tost masaları/tabaklar, kalabalıkta
   yürüme, UZUN oturumda FPS (floater fix'i bunun için) ve tost salonuna müşteri dağılımı (m.14).
