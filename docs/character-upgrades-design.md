# Karakter Yükseltme Sistemi — Tasarım Önerisi (ONAY BEKLİYOR)

> 2026-06-11 · Kullanıcı isteği: "tepsi yükseltme istiyorum… sağda karakter butonu olur… tepsi 2 ile
> başlar 6'ya gider… karakterde başka neler gelişebilir… özellik özellik mi komple karakter mi…
> detaylıca planla raporla onayımla yaparız." KOD YAZILMADI — bu doküman onay içindir.

## 1. Model kararı: ÖZELLİK-BAZLI satın alma + TÜRETİLMİŞ karakter seviyesi (önerim)

İki seçenek değerlendirildi:

| | A) Özellik-bazlı (önerim) | B) Komple karakter seviyesi |
|---|---|---|
| Oyuncu kararı | Var — "önce tepsi mi mıknatıs mı?" | Yok — tek butona para bas |
| Denge kontrolü | Her eğri ayrı ayarlanır | Tek eğri her şeyi sürükler |
| UI | 3 kart, MPH'deki gibi | Tek bar |
| His | "Karakterimi ben şekillendirdim" | Düz para-batırma |

**Önerim A** — ama ikisinin iyi yanını birleştirerek: özellikler tek tek ₺ ile alınır,
**karakter seviyesi = alınan toplam kademe** (salt görsel rozet + kıyafet/önlük renk evrimi).
Böylece hem seçim hissi hem "karakterim büyüyor" hissi olur. (Aktif oynanış ilkesi D-014 ile uyumlu:
yükseltmeler OYUNCUYU güçlendirir, oyunu otomatikleştirmez.)

## 2. Özellikler (3 çekirdek + gelecek)

### T — Tepsi Kapasitesi (5 kademe: 2→3→4→5→6)
- Şu an config'te `serving.trayCapacity = 4` SABİT. Yeni oyuncu **2** ile başlar (kullanıcı isteği).
- Paylaşımlı tepsi kuralı aynen kalır (çay+kirli aynı tepsi — deadlock-geçirmez yapı bozulmaz).
- CupTray görseli 3×2 ızgara → 6'ya kadar zaten çiziyor; kademede tepsi tabanı da büyür (görsel juice).
- ⚠️ MEVCUT KAYITLAR: bugünkü oyuncular 4 taşıyor. Migrasyonda tepsi kademesi **T2 (=4) hediye**
  verilir → kimse nerf yemez ("ilerleme kaybolmaz" kuralı).

### M — Para Mıknatısı (4 kademe: 2.6 → 3.4 → 4.2 → 5.0 birim)
- Kullanıcının kendi önerisi ("altın çektiğin alan artabilir"). `money.attractRadius` kademeli.
- Geç oyunda masa başı bahşiş yağmurunda koşturmayı azaltır ama TOPLAMA eylemi kalır (otomasyon değil).

### H — Hareket Hızı (4 kademe: 4.5 → 4.8 → 5.1 → 5.4)
- Küçük adımlar; %20 tavan. Garson 1.5/2.0'ken oyuncunun "ben daha hızlıyım" hissi büyür.
- Daha agresif artış oyunu kolaylaştırır → tavan bilinçli düşük.

### Gelecek fikirleri (bu fazda YOK, panelde "yakında" kilidi olarak gösterilebilir)
- **Bahşiş çekiciliği:** elle servis edilen çayda +%X bahşiş şansı (aktif oynanışı ödüllendirir).
- **Çaycı prestiji:** kıyafet/şapka kozmetikleri (Dekor Mağazası'nın karakter rafı; ₺/💎).
- Demleme hızı ve oto-toplama BİLEREK YOK: ilki ocak yükseltmesiyle çakışır, ikincisi D-012'ye aykırı.

## 3. Fiyat eğrisi taslağı (economy.config.character — tek kaynak)

| Kademe | Tepsi (₺) | Mıknatıs (₺) | Hız (₺) |
|---|---|---|---|
| 1 | 150 | 250 | 400 |
| 2 | 600 | 900 | 1.400 |
| 3 | 2.000 | 2.800 | 4.500 |
| 4 | 6.000 | — | — |

- Mantık: tepsi-1 zone-1 başında alınabilir (ilk "karakterim gelişti" anı erken); son kademeler
  zone-2 ekonomisine denk (10k+ mağaza alımlarıyla yarışmasın diye altında kalır).
- Onay sonrası `tools/simulate.ts`'e karakter alımları eklenip ilk-alım temposu sim ile doğrulanır.

## 4. UI

- **Buton:** SAĞ-ÜST, para/elmas çipinin ALTINDA yuvarlak karakter (çaycı portre) butonu
  (kullanıcı tarifi "sağda karakter butonu"). Görev kartı onun altına kayar.
- **Panel:** mevcut modal ailesi (ayarlar/mağaza stiliyle): üstte karakter görseli + seviye rozeti
  (yıldız değil — HUD seviyesiyle karışmasın diye fincan rozeti) + 3 özellik kartı:
  ikon · ad · `mevcut → sonraki` değer · fiyat butonu (yetersiz ₺ = soluk).
- **Posta entegrasyonu:** posta kutusu "boş" duruyor; karakter sistemi AYRI butonda kalmalı
  (yükseltme sık kullanılan bir döngü, postanın 2 tık derinliğine gömülmemeli). Posta ileride
  tek-seferlik ödül/teklif kutusu olarak değerli (ör. "ustadan hediye: 1 bedava kademe").

## 5. Görev entegrasyonu (kullanıcı isteği)

- Quest hattına eklenir (economy.config.quests):
  - `q_charTray` "Tepsini büyüt" — q_serve5 SONRASI (taşıma darlığını hissettiği an) → kart
    tıklanınca kamera oyuncuya değil, sağdaki butona dikkat çekemez (3D odak yok) → görev fotoğrafı
    tepsi ikonu olur + toast "Sağ üstteki karakter butonuna dokun".
  - `q_charAny` "Karakterini geliştir (herhangi bir özellik)" — zone-2 açılışı civarı.
- Quest zoom kuralı: karakter görevlerinde `questFocusPos` OYUNCUNUN kendisine döner (kamera zaten
  oyuncuda — sıçrama olmaz, sorun çıkarmaz).

## 6. Teknik plan (onay sonrası uygulama sırası)

1. `economy.config.character` (kademeler+fiyatlar) + `trayCapacity()/attractRadius()/playerSpeed()`
   türetici fonksiyonlar (kademe → değer; ham config okuma kalkar).
2. Store: `charUpgrades: { tray, magnet, speed }` + `buyCharUpgrade(stat)` →
   **SAVE v19→v20** migrasyonu (eski kayda `tray:2` hediye = bugünkü 4 kapasite korunur; yeni oyun 0).
3. HUD: karakter butonu + panel + satın alma (gerçek-tıklama Playwright testi).
4. Quest hattına 2 görev + foto ikonları.
5. vitest: eğri, satın alma, v20 migrasyon, kapasite türetme; sim güncelle; smoke.

## 7. Kullanıcıdan onay beklenen kararlar

1. Model: **A (özellik-bazlı + türetilmiş seviye)** OK mi?
2. 3 çekirdek özellik (tepsi/mıknatıs/hız) OK mi? Çıkarılacak/eklenecek var mı?
3. Fiyat taslağı (§3) makul mü? (Sim ile ince ayar yapılacak.)
4. Yeni oyuncu tepsisi 2'ye düşüyor (mevcut kayıtlar 4'te korunur) — onay?
5. Buton sağ-üstte para çipinin altı — OK mi?
