## ŞU AN (2026-09-16 — **R2 BİTTİ: mutfak yerleşimi + çarpışma** · Faz R 2/4 · 104/111)

```
SORU            : Sol duvardaki tezgâh ve bulaşık — çizilen gövde ile çarpışma kutusu aynı yerde
                  mi, hat bitişik mi, seviye gözle kaç sinyalden okunuyor?
ÖLÇÜLEN KOLLAR  : T taban (İKİ dönem) · A1 çizim döner · A2 kutu döner · B1 erken birleşme ·
                  B2 bulaşık yanaşır · C2 seviye sinyali (hepsi ETKİLİ doğrulandı)
SAYILAR         : docs/mutfak-raporu-r2.md §Bulgular · ham: docs/olcum-mutfak-r2.txt (TAM)
KARAR           : D-127 — A1 + B2 + C2. A2 SORULMADAN elendi (kullanıcının kendi cümlesi zaten
                  paraleli istiyor); B1 ölçülüp elendi (boşluğu yalnız çizimle doldurur)
UYGULAMA        : kitchenLook.onHatGovdeleri + yerelKutu + SERVIS_ISARETLERI ·
                  layout.PLACE_LEFT_WALL (bulaşık z TÜREMİŞ) + padPos.dishwasher ·
                  ServicePoint.tsx (5 biçim işareti) · olcu-donduruldu 2 ölçü güncellendi
BEKÇİ           : mutfak-r2 (25 den. · 17 mut.) · kaçan 0 (ilk turda 2 kaçtı, delik kapatıldı)
FINAL           : vitest 1245 ✓ · duman 45/45 ✓ · tsc temiz · IoU 0,19 → 1,00 · açı 90° → 0° ·
                  geçilen 0,62 → 0,00 br² · görünmez 2,20 → 0,00 br² · hat boşluğu 3,20 → 0,00 br
```

---

## ŞU AN (2026-09-16 — **F2 BİTTİ: telefon yükü** · Faz F 1/5 · 102/107)

```
SORU            : Telefonda ne kadar ağırız ve ağırlığın kaynağı hangi kol — GÖLGE mi, PİKSEL mi,
                  İNDİRİLEN BAYT mı?
ÖLÇÜLEN KOLLAR  : §A ölü yük · §B bayt dökümü · §C: T taban · G0 gölge kapalı · G1 harita 1024 ·
                  G2 harita 512 · P1 dpr 1 · G0+P1 (altısı da ETKİLİ doğrulandı)
SAYILAR         : docs/telefon-raporu-f2.md §Bulgular · ham: docs/olcum-telefon-f2.txt (TAM)
KARAR           : D-125 — A1 (4 ulaşılamaz paket silinsin) + gölge CİHAZ SINIFINA bağlansın
UYGULAMA        : 4 paket çıkarıldı · game/cihazSinifi.ts + Ayarlar "Gölgeler" satırı ·
                  tools/apk-temizle.mjs (bayat APK kusuru) · manifest geri-alma komutuyla
BEKÇİ           : asset-olu-yuk (4 den. · 3 mut.) + golge-cihaz (12 den. · 5 mut.) · kaçan 0
FINAL           : vitest 1205 ✓ · duman 45/45 ✓ · tsc temiz · APK 20,93 → 11,84 MB (−%43,4)
```

**Turun kalıcı üç dersi:**
1. **Ölçüm aracı, ölçtüğü şeyden önce kendisi çürütülür.** Kısa koşu aracı DÖRT kez düşürdü:
   yazılım GPU'su (SwiftShader'da kare 233 ms, dpr sahte %64 kazanç) · kollar farklı dünya
   ölçüyordu (gölge açıkken çizim çağrısı 30, kapalıyken 40 — ters) · sayaçlar tek anlık
   okunuyordu · tohum kayması (üçgen %17,2 sapma). Bunlardan biri bile kalsaydı rapor sayı
   değil kanaat basardı. **Tam koşu bir kez daha çürüttü:** `?f2dpr=1` kolu tutmuyordu ve bunu
   yakalayan şey varyant etki denetimiydi — sorgu dizesi doğruydu, kod yolunda kayboluyordu.
2. **"Ucuz" ile "ölçülemedi" aynı şey değil.** dpr kolu 4× az piksele rağmen kıpırdamadı;
   doğru okuma "piksel bedava" değil, **"bu donanımda fragment bağlayıcı değil"**. Vekil ölçüm
   kendi körlüğünü söylemez — kapsam damgası söyler. Cihaz turu bu yüzden açık bırakıldı.
3. **En büyük kazanç kodda değil, envanterde çıktı.** 101 tur boyunca kare süresi, zincir,
   tempo ölçüldü; kimse "ne gönderiyoruz" diye sormadı. Tek soru 9,09 MB getirdi — APK'nın
   **%43,4'ü**. Gölge (asıl şüpheli) ise D-073 yüzünden zaten dokunulamayan bir koldu.

**Yolda bulunan sessiz kusur:** `npm run apk` **9 MB fazla** raporluyordu — gradle çıktı APK'sını
KISALTMADAN üzerine yazıyor, 11,66 MB'lık içerik 21,88 MB'lık kabukta duruyordu. Yayın günü
mağazaya yanlış boyut yazılırdı. `tools/apk-temizle.mjs` zincire takıldı; uçtan uca 11,84 MB.

