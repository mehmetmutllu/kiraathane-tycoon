# 🌙 Gece Raporu — 2026-06-11 → 12 sabahı

Günaydın! Feedback'indeki **WP1-WP6'nın 6'sı da bitti**. Telefon için yeni APK kökte:
**`KoseKiraathanesi-debug.apk`** (eskisini silip bunu kur; SAVE v19'a migrasyon otomatik,
ilerleme korunur). Ekran görüntüleri kökte `night2-*.png` (git'e girmez, yerelde).

## Ne yapıldı (commit sırasıyla)

### 1. WP1 — Hızlı bug paketi ✅ `96f6928`
Senin bildirdiğin 5 bug'ın hepsi:
- **"2. Masayı aç" pad'i görünmüyor:** aktif görevin pad'inde tempo şartları (minLifetime)
  artık atlanıyor (görev = tek doğru kaynak; omurga `prev` zinciri güvenlik ağı olarak duruyor).
- **Z2 görevinde kamera zone-1'e bakıyordu:** görevlere `zone` alanı eklendi; kamera artık
  doğru salona pan yapıyor (canlıda doğrulandı: odak [12,0,1.5]).
- **Görev geçişinde ekran kayması:** aynı karede üst üste binen kamera tetiklerine öncelik
  sırası (zone açılışı > görev > reveal) + iptal deadzone'u 0.1→0.25 (joystick titremesi
  odağı bozmuyor).
- **Toast görev kartının altında kalıyordu:** z-index 15 + taşma sınırı.
- **OFFLINE NERF (kapa-aç 7k bug'ı):** oran 0.5→0.2 + YENİ PARA TAVANI (sıradaki omurga
  pad maliyetinin %60'ı). Zone-1 sonunda kapa-aç artık en çok ~720₺ verir — zone'u tek
  girişte bitiremez. Endüstri normu: offline = aktifin %5-20'si (Idle Miner ~%10).

### 2. WP2 — Dünya v2: TEK SALON + sol duvarda L mutfak şeridi ✅ `92b111b` (D-024)
Senin tarifin birebir:
- **Bölme duvarı KALKTI** — alan genişleyince tek salon. Kilitli zone = karanlık örtü +
  zemin sınır çizgisi (duvar yok); oyuncu karanlığa giremez (açık zone kelepçesi).
- **TEK KAPI** (ön duvar ortası) — tüm müşteriler oradan girip çıkıyor.
- **Mutfak = SOL DUVARDA L-ŞERİT:** ocak modülleri sol duvara paralel, zone açıldıkça şerit
  ÖNE UZAR (2. modül eklenir; ileride tost makinesi de buraya); bulaşık arka duvar dibinde
  L'nin kısa kolu. Per-zone mekanik (senin onayladığın D-022) aynen duruyor — sadece fiziksel
  yer değişti.
- **Duvar-tezgah arasında ÇAYCI NPC** volta atıyor (salt görsel).
- **Ocak yükseltme pad'leri** tezgahın önünde, masalardan uzak (eski "ayak altında" şikayeti).
- **Rezervler:** DEPO sol-arka ek oda, TUVALET sağ-arka ek oda, MERDİVEN ön-sağ basamaklar.
- → `night2-wp2-strip.png`, `night2-wp2-landscape.png`

### 3. WP3 — GERÇEK KARAKTERLER (senin "en önemli" dediğin) ✅ `b4616d6`
- **Quaternius Ultimate Modular Men + Women** (CC0, lisans dosyaları indirildi) — 10 model.
- Kendi optimize pipeline'ımız (`tools/optimize-chars.mjs`): 24 animasyondan oyunda
  kullanılan 6'sı kaldı, mesh quantize, 3MB→~0.95MB/model.
- **OYUNCU = Worker** (koşarken Run, dururken Idle; tepsi önde) · **GARSON = Suit** ·
  **BULAŞIKÇI = Hoodie** · **MÜŞTERİLER = 8 modellik havuz** (kişiye sabit ama kalabalık
  hep farklı) · **ÇAYCI = kadın karakter** (tezgah arkası yürüyor).
- Yürüme/koşma animasyonları çalışıyor; model yüklenemezse eski primitive'e düşer.
- ⚠️ **Pakette SIT ve CARRY animasyonu YOK** → oturan müşteri tabure içine "gömülü" duruyor
  (masa bacakları gizliyor, üstten fena değil ama ideal değil). Çözüm: Universal Animation
  Library **Pro $9.99** (Sit/Carry dahil) — itch.io'da, satın alma sende. İstersen linki:
  https://quaternius.itch.io/universal-animation-library
- → `night2-wp3-scale2.png`, `night2-wp3-final.png`

### 4. WP4 — Görsel kimlik v2 ✅ `d08c445`
- **Zemin: PARKE** (canvas-tile üreteci — indirme yok, MPH tarzı hafif desen). Kilim artık
  masa halısı değil, ortada KÜÇÜK vurgu kilimi.
- **Masa SADECE RENK DEĞİL ŞEKİL değiştiriyor:** L0 klasik kare 4-ayak → L1 yuvarlak+çuha →
  L2 bordo+ETEK → L3 sekizgen+lacivert+pirinç bant → L4 ALTIN örtü (en gösterişli).
  → `night2-wp4-table-evolution.png`
- **KLASİK ÇAY OCAĞI:** paslanmaz tezgah + koyu kuzine + İKİ KATLI çaydanlıklar — **sayı
  seviyeyle artıyor** (L0 1 → L4 5 çaydanlık) + musluklu boyler + buhar.
  → `night2-wp4-station-l3.png`
- **TV'de MAÇ OYNUYOR:** yeşil saha, orta çizgi, gezen top, skor bandı, canlı yayın titremesi.
- **KİRLİ MASA A/B (kararın lazım):** şu an **B aktif** = masada lekeler + dönen sünger ikonu.
  A = eski yeşil koku bulutu. Screenshot'lar: `night2-wp4-dirty-A.png` / `night2-wp4-dirty-B.png`.
  Tek satırla geri alınır (`Dishes.tsx` → `DIRTY_VARIANT`).
- **Dekor:** detaylı çöp kovaları (kapı + mutfak), köşelerde saksılar, duvar saati.

### 5. WP5 — Tek dolum göstergesi ✅ `13f1d4f`
Alt bar + baş üstü halka KALKTI; tek gösterge = yerdeki pad halkası (senin istediğin gibi).

### 6. WP6 — KOZMETİK MAĞAZA ✅ `4597b85` (SAVE v19)
- Sol sütunda **fırça butonu** → Dekor Mağazası.
- **Zemin:** Klasik Parke (ücretsiz) · Krem Fayans 10k · Dama Fayans 14k · Ceviz Parke 18k.
- **Duvar:** Krem (ücretsiz) · Çay Yeşili 10k · Çini Mavisi 14k.
- **SALON BAŞINA satın alınır** (senin "tek zone için 10k+, para biriktirme hedefi" isteğin);
  bir kez alınca o salon için kalıcı — temalar arasında ücretsiz geçiş.
- Gerçek tıklamayla test edildi: 10k düştü, fayans+yeşil uygulandı, kayıt/yükleme korunuyor.
- → `night2-wp6-shop.png`, `night2-wp6-themes2.png`

## Doğrulama
**vitest 91/91** (6 yeni test) · build temiz · ekonomi sim İDEALİZE ilk-alım 60sn SABİT ·
smoke 27/27 · Playwright canlı uçtan uca · konsol 0 hata · 6 commit push'lu.

## ☀️ Sabah kararları (sırayla)
1. **Kirli masa:** A (koku bulutu) mı B (leke+sünger, şu an aktif) mi? → iki png kökte.
2. **UAL Pro $9.99:** oturma + taşıma animasyonu için alalım mı? (Satın alma sende; alırsan
   zip'i bana ver, entegrasyonu ben yaparım.)
3. **Curve Ö1-Ö4** hâlâ onay bekliyor (docs/curve-report.md): zone2 1200→2000 vb.
   ÖNEMLİ: dünya v2'de zone-2 servisi sol şeritten — mesafe arttı, garson turu uzadı.
   Telefonda zone-2 temposunu hissedip Ö1-Ö4'le birlikte karar verelim.
4. **Telefon testi:** yeni APK'da özellikle (a) tek kapı + tek salon hissi, (b) karakterler,
   (c) mağazadan tema alma, (d) offline kapa-aç (artık küçük olmalı).

İyi sabahlar! ☕
