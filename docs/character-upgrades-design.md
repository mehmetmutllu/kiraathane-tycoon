# Karakter Yükseltme Sistemi — ONAYLANDI ✅ (uygulama: SONRAKİ OTURUM)

> 2026-06-11 · Kullanıcı tasarımı ONAYLADI, revizyonlarıyla birlikte: "hepsi okey, sadece buton
> ayar/mağaza/posta kısmında olsun (yatayda 4 buton, seviye barından uzun olmasın); görevler
> sıralaması ve zamanlaması AŞIRI önemli; en başlarda tepsi yükseltme görevi gelsin; tepsi ilk 4
> basit, 5 ve 6 çok zor; görev gelince karakter butonuna efekt; karakter panelde ortada hafif
> yukarı-çapraz açıdan, tepsi yükseltince elindeki çay sayısı artsın." KOD HENÜZ YAZILMADI.

## 0. ONAYLANAN KARARLAR (özet)

1. ✅ Model: **özellik-bazlı satın alma + türetilmiş karakter seviyesi** (§1).
2. ✅ 3 çekirdek özellik: **Tepsi / Para Mıknatısı / Hareket Hızı** (§2).
3. ✅ Fiyatlar: tepsi T1-T2 ucuz, **T3-T4 ÇOK pahalı** (kullanıcı: "ilk 4 basit, 5-6 çok zor;
   zaten garson var, kimler yükseltir bilmem" → 5 ve 6 kapasite lüks/aspirasyonel) (§3).
4. ✅ Yeni oyuncu tepsisi **2** başlar; MEVCUT kayıtlara migrasyonda **T2 hediye** (bugünkü 4 korunur).
5. ✅ Buton: SAĞDA DEĞİL — **sol kümede** (ayar/posta/fırça yanına 4. buton; yatay tek sıra,
   toplam genişlik seviye pill'inden UZUN OLMAMALI) (§4).
6. ✅ Görev entegrasyonu + buton dikkat efekti (§5-6). Görev zamanlaması = birinci öncelik.

## 1. Model: özellik-bazlı + türetilmiş seviye

- Özellikler tek tek ₺ ile alınır (`buyCharUpgrade(stat)`).
- **Karakter seviyesi = alınan toplam kademe sayısı** — salt görsel: panelde rozet (fincan rozeti;
  HUD yıldız-seviyesiyle karışmasın) + kıyafet/önlük renk evrimi (ileride kademe eşiklerinde).
- Aktif oynanış (D-014) korunur: yükseltmeler OYUNCUYU güçlendirir, oyunu otomatikleştirmez.

## 2. Özellikler

### T — Tepsi Kapasitesi (4 kademe: 2→3→4→5→6)
- `serving.trayCapacity` SABİT 4 olmaktan çıkar → `trayCapacity()` kademeden türetir.
- Paylaşımlı tepsi kuralı aynen (çay+kirli aynı tepsi; deadlock-geçirmez yapı bozulmaz).
- CupTray 3×2 ızgara 6'yı zaten çizer; kademeyle tepsi TABANI da büyür (görsel juice).
- **Zorluk eğrisi (kullanıcı talimatı):** T1(→3) ve T2(→4) BASİT; T3(→5) ve T4(→6) ÇOK ZOR.

### M — Para Mıknatısı (3 kademe: 2.6 → 3.4 → 4.2 → 5.0 birim)
- `money.attractRadius` kademeden türetilir. Toplama EYLEMİ kalır (otomasyon değil, D-012).

### H — Hareket Hızı (3 kademe: 4.5 → 4.8 → 5.1 → 5.4)
- Tavan +%20 bilinçli düşük (oyun kolaylaşmasın). Garson 1.5/2.0'ken fark hissedilir.

### Gelecek rafı (bu fazda YOK; panelde kilitli "yakında" kartı GÖSTERİLMEZ — sade kalsın)
- Bahşiş şansı (elle serviste +%X) · karakter kıyafet kozmetikleri (Dekor Mağazası rafı).
- Demleme hızı YOK (ocak yükseltmesiyle çakışır) · oto-toplama YOK (D-012).

## 3. Fiyat eğrisi (economy.config.character — TEK kaynak; sim ile doğrulanacak)

| Kademe | Tepsi (₺) | Mıknatıs (₺) | Hız (₺) |
|---|---|---|---|
| 1 | **150** (basit — zone-1 başı) | 250 | 400 |
| 2 | **500** (basit — zone-1 ortası) | 900 | 1.400 |
| 3 | **15.000** (ÇOK ZOR — zone-2 ekonomisi) | 2.800 | 4.500 |
| 4 | **60.000** (ÇOK ZOR — uzun vade hedefi) | — | — |

- T3/T4 bilinçli uçurum: garson varken 5-6 kapasite lükstür; "para biriktirme hedefi" işlevi görür
  (kozmetik 10-18k bandının ÜSTÜNDE — kozmetikle yarışmaz, onu takip eder).
- Onay sonrası `tools/simulate.ts`'e karakter alımları eklenir; ilk-alım temposu ve T1'in
  q_charTray1 anında alınabilirliği sim ile doğrulanır.

## 4. UI

### Buton (kullanıcı revizyonu)
- **Sol kümede 4. buton:** ⚙️ ayar · ✉️ posta · 🖌️ dekor · 👤 KARAKTER (çaycı portre ikonu).
- Düzen: seviye pill'inin altında YATAY TEK SIRA; **4 butonun toplam genişliği seviye
  pill'inden uzun olamaz** → buton çapı/boşluk buna göre küçülür (CSS: pill genişliğine bağla).
- Mevcut dikey/karışık yerleşim bu sıraya toplanır (HUD.tsx sol sütun düzenlemesi).

### Karakter paneli (modal — ayarlar/mağaza ailesi stilinde)
- **Karakter ORTADA, hafif yukarı-ÇAPRAZ (3/4) açıdan** görünür: modal içinde küçük ayrı
  `<Canvas>` (OwnerBody primitive + elinde GERÇEK CupTray): kamera konumu ~[0.9, 1.4, 1.6],
  lookAt baş hizası; yavaş idle salınımı (juice).
- **Tepsi canlı önizleme (kullanıcı isteği):** karakterin elindeki tepside MEVCUT kapasite kadar
  çay bardağı dizili; tepsi yükseltilince +1 bardak ANINDA belirir (scale-pop animasyonu) ve
  tepsi tabanı büyür → satın almanın ödülü gözle görülür.
- Üstte: karakter seviye rozeti (fincan) + "Çaycı" adı. Altta: 3 özellik kartı —
  ikon · ad · `mevcut → sonraki` değer · fiyat butonu (yetersiz ₺ soluk; max kademe "MAX").
- Kapat: "Tamam" (mağaza modalıyla aynı dil).

## 5. GÖREV ENTEGRASYONU — sıralama/zamanlama (kullanıcı: "aşırı önemli")

Mevcut hat: q_pickup → q_serve1 → q_coin → q_table2 → q_serve5 → q_station2 → q_wash → q_table3 →
q_waiter → q_dish → q_table4 → q_waiterL2 → q_tableL2 → … → q_zone2 → z2 zinciri.

**Eklenen görevler (3 adet; yerleşim gerekçeli):**

1. **q_charTray1 "Tepsini büyüt"** → **q_serve5'ten HEMEN ÖNCE** (q_table2 sonrası).
   Gerekçe: 2 masa + tepsi 2 ile oyuncu taşıma darlığını TAM o anda yaşar ("en başlarda tepsi
   yükseltme gelsin"); T1=150₺ o noktada rahat karşılanır; sonraki "5 çay servis et" görevi
   tepsi 3 ile akıcı geçer (öğretilen şey hemen işe yarar).
   Hedef tipi: `charStat: { stat:'tray', tier:1 }`.
2. **q_charTray2 "Tepsini 4'e çıkar"** → **q_table3 ile q_waiter ARASINA**.
   Gerekçe: 3 masa solo dönerken (garson HENÜZ yok) kapasite 4 anlamlı; garson görevinden önce
   "kendi gücünü" tamamlar — sonra otomasyon gelir (aktif oynanış sıralaması).
3. **q_charMagnet "Para mıknatısını güçlendir"** → **q_table4 SONRASI** (q_waiterL2'den önce).
   Gerekçe: 4 masa + garson döneminde yere düşen para sayısı zirve yapar; mıknatıs ihtiyacı
   kendini göstermişken görev gelir.

- **T3/T4 için GÖREV YOK** (bilinçli): "çok zor" hedefler görevle dayatılmaz; panelde dururlar.
- Hız (H) için görev YOK: opsiyonel konfor; quest hattını şişirmeyelim.
- **Quest zoom kuralı:** karakter görevlerinde 3D hedef YOK → `questFocusPos` oyuncuya döner
  (kamera sıçramaz); yönlendirmeyi §6'daki buton efekti yapar. Görev fotoğrafı: tepsi/mıknatıs ikonu.
- Z2 zinciri ve diğer görevler DEĞİŞMEZ (sıra index'leri kayar — `questIndex` SAVE migrasyonunda
  id-eşlemeyle korunur, index'le DEĞİL!).

## 6. Buton dikkat efekti (görev gelince)

- Karakter görevi AKTİFKEN: butonda **altın nabız halkası** (CSS pulse) + sağ-üst "!" rozeti —
  görev tamamlanana dek sürer.
- **İlk kez** karakter görevi geldiğinde (q_charTray1): yarı saydam karartma + butona spotlight
  (tek seferlik, dokununca kapanır; `revealSeen` anahtarıyla bir daha çıkmaz). Kullanıcı
  "diğer taraflar kararabilir bilemedim sen ayarla" dedi → karartma YALNIZ ilk seferde
  (sürekli karartma rahatsız eder), sonrası sadece nabız+rozet.

## 7. Teknik plan (sonraki oturum uygulama sırası)

1. `economy.config.character`: kademeler+fiyatlar+değer dizileri (tray [2,3,4,5,6],
   magnet [2.6,3.4,4.2,5.0], speed [4.5,4.8,5.1,5.4]) + türetici fonksiyonlar
   `trayCapacity()/attractRadius()/playerSpeed()` (kademe → değer; ham config okumalar değişir).
2. Store: `charUpgrades:{tray,magnet,speed}` + `buyCharUpgrade(stat)` + karakter seviyesi selector.
   **SAVE v19→v20**: eski kayda `tray:2` (=kapasite 4) hediye; YENİ oyun 0 (=kapasite 2);
   `questIndex` id-eşlemeli migrasyon (yeni görevler araya girdiği için).
3. Quest config: 3 görev + `charStat` hedef tipi + sayaç/koşul (`charUpgrades[stat] >= tier`).
4. HUD: sol küme 4-buton yatay sıra (genişlik ≤ seviye pill) + karakter modalı (mini Canvas +
   canlı tepsi önizleme + 3 kart) + nabız/rozet + ilk-sefer spotlight (revealSeen).
5. Test: vitest (eğri, satın alma, v20 migrasyon + questIndex id-eşleme, kapasite türetme),
   sim güncelle (T1 alınabilirlik), smoke, Playwright gerçek-tıklama (panelden satın alma +
   tepsi önizleme değişimi) + görev akışı canlı.
