# F4c-3 — cephe / tabela görünürlüğü raporu

**Soru.** 💎 vitrininin son kalemi tabela. Adaylar (`tools/vitrin-adaylari.html?sayfa=tabela`: C2 C4 C7 C8) cepheyi bir
ürün gibi boyuyor: tente rengi, fırfır ve alınlıkta yazılı tabela. Aday kareleri cepheyi tam karşıdan çiziyor.
Oyunun kamerası ise oyuncunun arkasında, 42° yukarıdan bakıyor. İki şeyi bilmemiz gerekiyor:
1. Cephe oyun kamerasında ne zaman ekrana giriyor ve ne büyüklükte?
2. Yazı nereye konursa okunur?

**Araç.**
- `tools/olcum-tabela-f4c3.ts`: T9b'nin oyun botu node'a taşındı. Bot görev hattını oynuyor, her kare kaydediliyor. Kamera
  `CameraRig`'in formülüyle kuruluyor. İzdüşüm oyunun kendi `cameraView.izdusur`'u. HUD kutuları ve örtücüler hesaba
  katılıyor. Yazı kolları (K0…K5) levha tanımı olarak ölçülüyor; kod yazılmadı.
- `tools/tabela-kadraj-f4c3.mjs`: gerçek tarayıcıdan dört çıktı alıyor: HUD'un opak kutuları, lento ve üst kordon
  örtücüleri, tabelanın macenta piksel sayımı (doğrulama) ve aday dokusunun yazı oranları (`measureText`).
  `KARE=kollar` kipi her yazı kolunu sahneye geçici koyup oyun kamerasından çekiyor (`f4c3-kol-*.png`).

**Ham çıktı.** `docs/olcum-tabela-f4c3.txt` (tam koşu). Kareler `docs/gorsel/ss/f4c3-*.png`.

**Doğrulama.** Node izdüşümü `__izdusur` ile birebir (0,00 px). Görünen pay (ışın testi) 10 kadrajda macenta piksel
sayımıyla en fazla 0,028 farklı. Yolda iki araç hatası bulundu ve düzeltildi:
- Piksel paydasına kutunun üst yüzü giriyordu (fark 0,15'ten 0,03'e indi).
- T9b botu ışınlandıktan sonra eski mesafeyle yön hesaplıyordu. 0/0 bölmesi oyuncuyu NaN yapıyor, koşu bellek taşmasıyla
  düşüyordu. Oyunun kendi çarpışması temiz çıktı. Bot düzeltildi, "konum sonlu" damgası eklendi.

## Bulgular (tam koşu: 3 tohum × 6 sa, görev hattı 46–47/50, saniyede 1 kare → 32.400 kare)

**Tanımlar.**
- **Okunur:** yazının harf yüksekliğindeki orta şeridinin ≥ %90'ı görünür (ekranda, HUD altında değil, lento/kordon
  arkasında değil) ve büyük harf ≥ 8 px.
- **Ekran payı:** yüzeyin görünen alanı bölü ekran alanı.
- **Profiller:** dikey telefon 390×844 · uzaklaş ×1,35 · yatay telefon 844×390 · dikey tablet 820×1180.

| # | Bulgu | Sayı |
|---|---|---|
| B1 | **Cephe oyunun çok küçük bir kısmında ekranda.** Kamera oyuncunun +z'sinde, cephe z 17,5'te. Cephe yalnız oyuncu ön 5-6 sıradayken (z ≥ 11) görünüyor. | dikey telefon TÜMÜ **%4,6** · ilk 2 dk %47,2 · 1. Salon %23,6 · 2. Salon %8,4 · **3. Salon %0,7** |
| B2 | Öteki profillerde de aynı tablo. | uzaklaş %11,4 · yatay %4,7 · tablet %8,3 (3. Salon'da hepsi ≤ %2,1) |
| B3 | Göründüğünde de küçük. Kameranın asıl gördüğü yüzey tentenin üstü; tabela onun dörtte biri. | dikey ekran payı (medyan): cephe %1,9 · tente %1,5 · tabela %0,4 |
| B4 | **Bugünkü tabelanın yarısı örtülü.** Lento (y 2,65–2,81) ve üst kordon (3,10–3,20) tabela yüzünün 6 cm önüne uzanıyor. | görünen pay %58–75 (piksel sayımı) |
| B5 | Bugünkü tabelaya aday yazısı konsaydı (K0) okunmazdı. | büyük harf 7,7 px (dikey) · 5,3 (yatay/uzaklaş) · 10,5 (tablet) · okunur dikey TÜMÜ %0,1 · ilk 2 dk %2,2 |
| B6 | **Yazıyı eni de sınırlıyor.** Aday dokusunda yazı eni büyük harfin 17,1 katı. Tabelayı yalnız yükseltmek harfi büyütmüyor. | 3,4 m tabelada harf en fazla 0,156 m |
| B7 | K1 (aynı tabela, örtücünün önüne): örtü kalkıyor ama harf aynı. | harf 7,7 px · okunur %0,1 |
| B8 | K2 (alınlığı doldur, 5,0 × 0,55): harf büyüyor, süre değişmiyor. | harf 12,2 px (dikey) · 16,5 (tablet) · okunur TÜMÜ %0,1 · yarısı okunur %1,3 |
| B9 | K3 (yazı tentenin üstünde, 5,4 × 0,8): en büyük harf. Yalnız 5,4 m'lik yazı dar ekranda yandan kırpılıyor, tamamı nadiren sığıyor. | harf 24,7 px (dikey) · 37 (tablet) · okunur %0,0 · yarısı okunur %0,4 |
| B10 | K4 / K4e (kordonun üstünde çatı tabelası 4,4 × 0,6 / 25° geriye eğik): cephenin en uzun görünen parçası. | ekranda %5,9 / %6,4 · harf 11,7 / **18,8 px** · okunur %0,1 · yarısı %1,7 |
| B11 | K5 (fırfıra yazı): hiçbir profilde okunmuyor. | harf 5,5 px · okunur %0,0 |
| B12 | **Kollar harfi büyütüyor ama görünme süresini değiştirmiyor.** En iyi kol cepheyi %4,6'dan %6,4'e çıkarıyor. Sınır kameranın yönü, yüzey değil. | K4e %6,4 vs K0 %3,2 (tabela) |
| B13 | Cephe en çok şu anlarda görünüyor: ön bölgedeki pad görevleri (garson 2, masa, bölge açılışı). | q_waiter2 %21,5 · q_z2table4 %11,8 · q_zone2 %9,9 |
| B14 | Adayların yazı karşıtlığı yeterli; C8'in tentesi duvardan en az ayrışan. | yazı/zemin C2 6,64 · C4 7,36 · C7 6,04 · C8 4,60 · tente/duvar C8 3,65 (en düşük) |
| B15 | Satın alma anı ayrı bir sahne: mağaza önizlemesi (`DekorOnizleme` deseni) cepheyi karşıdan gösterebilir. B1–B12 SATIN ALDIKTAN SONRA oyunda görünmeyi ölçüyor. | ölçülmedi (sabit kamera) |

**Kareler (dikey telefon, kapı önü ve doğuş noktası):** `f4c3-kol-{K0,K1,K2,K3,K4,K4e,K5}-{kapi,dogus}.png` (C2 renginde).
Gerçek HUD'la: `f4c3-kadraj-{dikey,yatay,tablet}-*.png`.

## §Karar (D-156 · kullanıcı 2026-09-25)

Karar sayfası: https://claude.ai/artifact/1Q5yzv5wykx5Md1RBYbx6q

1. **Tabela = K2, alınlığı dolduran büyük tabela** (5,0 × 0,55, lento ve kordonun önünde). Bedava. 💎 ile cephe satılmaz.
   Soru 2 (renk) bu yüzden kapandı.
2. **Tabelada oyuncunun verdiği kafe adı yazar.** Ad girişte bir kez sorulur, eski kayıtlara da güncellemeden sonra
   bir kez sorulur. Kutuda "Köşe Kıraathanesi" hazır gelir. En fazla 20 harf. Ayarlar'dan ücretsiz değişir.
3. **Yükleniyor ekranında ve sayfa başlığında oyunun adı: "Tea House Tycoon".** Cihaz simgesinin adı (D-130) değişmedi.

## Uygulama

| Kalem | Yer |
|---|---|
| Tabela geometrisi (tek kaynak) | `streetLook.TABELA` · `ALINLIK_ORTUCU_ON_Z` · `tabelaFontPx` |
| Çizim (ad dokusu, uzun adda harf küçülür) | `components/three/Tabela.tsx` |
| Ad kuralları | `game/kafeAdi.ts` (temizle · 20 harf · `tr` büyük harf · `OYUN_ADI`) |
| Kayıt | `kafeAdi: string \| null` additive (null = hiç sorulmadı), saveVersion artmadı |
| Sıra | `ekranKanali` → `kafe-adi` her şeyin önünde; geri tuşu taslağı kaydeder |
| Arayüz | `KafeAdiKutusu.tsx` (ilk / düzenle) · Ayarlar "Kafenin adı" · yazarken WASD yürütmez |
| Bekçi | `tests/tabela-f4c3.test.ts` 19 test · duman 65/65 (ad kutusu + WASD + Ayarlar adımları) · vitest 1645 |
| Ölçüm aracı | K0 artık `streetLook.TABELA`dan okunuyor (final koşuda K0 = K2 olmalı) |

## Final (tam koşu, 2026-09-25)

| Denetim | Sonuç |
|---|---|
| Mutasyon | **11/11** yakalandı (`tools/mutasyon-tabela-f4c3.mjs`) |
| İzdüşüm damgası | node ↔ tarayıcı **0,00 px** · görünen pay farkı 0,022 |
| K0 = K2 (B2, dikey telefon) | ekranda %4,1 · harf 12,2 / 12,8 px · yarısı okunur %1,3 — **birebir** |
| Konum haritası | K0 2/170 ↔ K2 4/170 hücre: fark levhanın ön yüzü (z 17,98 ↔ 17,95), okunan harf aynı |

Not: ilk final koşusunda izdüşüm damgası 104 px kırıldı — kadraj aracı `f4c3-kollar.json`'u ölçüm aracı
yenilemeden okumuştu (eski K0). Sıra düzeltilince (önce ölçüm → kollar, sonra kadraj → ölçüm) damga temiz.
