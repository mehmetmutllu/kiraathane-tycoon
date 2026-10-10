# Sprint B · Faz 1 — Arayüz bileşen envanteri

> Kaynak: `tools/ekran-envanter.mjs` (Playwright, 390×844 · 360×640, TR + EN, dev kancaları) + `HUD.tsx`, `CharacterPanel.tsx`,
> `Sheet.tsx`, `hud.css`, `icons.tsx` okuması. Sayılar 390×844 TR çekiminde **görünür** DOM'dan (`docs/sprintler/sprint-B/envanter-ham.json`).
> Ekranlar: `docs/tasarim/sprint-B/ekranlar/<boyut>-<dil>-<ekran>.png` · kontakt: `kontakt-tr.png` · temiz sahne: `sahne-temiz.png`
> (+ `sahne-temiz-genis.png`, genel bakış kamerası). Çekim anındaki oyun: 7 masa, 2. Salon açık, garson + bulaşıkçı tutulu, Seviye 8.

## Ortak kabuklar (her ekranda tekrar eden parça)

| Parça | Sınıf | Nerede | Not |
|---|---|---|---|
| Tam ekran panel | `.modal-backdrop.screen-backdrop` › `.modal-card.screen` | Görevler · Hedefler · Mağaza · Çaycı · Ayarlar | Opak; altında sahne çizilmez |
| Panel üst şeridi | `.screen-top` = geri `.sheet-back` (sol) + `.screen-title` + `.screen-purse` (2 × `.screen-cur`: ₺ + 💎) | aynı 5 panel | Geri tek çıkış |
| Merkezî ödül kartı | `.modal-card.reward-card` (+ `.reward-glow`, `.reward-title`, `.reward-amount`) | Kafe adı · Seviye ödülü · Satın alma ödülü · Başlangıç teklifi | Çerçeve aynı, içerik farklı |
| Merkezî küçük kart | `.usta-backdrop` › `.usta-card` (+ `.usta-badge` madalyon, `.sheet-x` kapat ✕) | Usta modalı · Video kartı | Tek kapatma: sağ üst ✕ (ve zemine dokunma) |
| Birincil düğme (geniş) | `.sheet-cta` | ödül kartları, Ayarlar "geri yükle", Paketler alt | amber dolgu |
| İkincil düğme (geniş) | `.sheet-cta.ad` / `.sheet-cta` ikinci | "İzle, 2× al", "Şimdi değil" | koyu mor zemin + amber kontur |
| Satır düğmesi / fiyat hapı | `.goal-claim` (Ödülü al / Test / fiyat) · `.char-buy` (₺ fiyat hapı) · `.master-buy` (💎 fiyat + ad) | Görevler · Hedefler · Paketler · Çaycı · Usta · Video | |
| Devre dışı | `button[disabled]` | `shop-buy` (sahip olunan/uygulanan: "Uygulandı"), `master-buy.ad.off` (video hazır değil) | yalnız soluklaşma |
| İlerleme çubuğu | `.goal-track` › `.goal-fill` · `.rep-bar` › `.rep-fill` (HUD + Hedefler hero) · `.splash__bar` | | yeşil dolgu |
| Kilit | `LockIcon` (`.shop-tab-lock`, `.shop-locked-icon`, dekor `.kilitli`) | Mağaza Masa sekmesi + kilitli dekor kareleri | |
| Rozet / nokta | `.navtab-bang` (alt bar ünlem) · `.shop-chip-badge` (✓ uygulanan) · `.tray-count` (sayaç) · `.qrow-dot`/`.qrow-check` | | |
| Kozmetik pulu | `.shop-chip` › `.shop-chip-swatch` (çapraz iki renk gradyan; zemin/duvar `linear-gradient(135deg, a 50%, b 50%)`) · seçili `.sel` | Mağaza 6 sekme | Sprint B'de küçük resimle değişecek |

## Ekran ekran

| Ekran (dosya adı) | Bileşenler + adet (390×844 TR) | En uzun TR | En uzun EN |
|---|---|---|---|
| `yukleme` | logo görseli 1 · ilerleme çubuğu `.splash__bar` 1 · ipucu metni 1 · düğme 0 | Semaver ısınıyor… | Warming up the samovar… |
| `kafe-adi` | ödül kartı 1 · başlık 1 · açıklama 1 · metin kutusu 1 (+ sayaç "9/20") · birincil `.sheet-cta` 1 (ilk açılışta Vazgeç yok) | Kapının üstündeki tabelada bu yazacak. Sonra Ayarlar'dan değiştirebilirsin. (76) | This will appear on the sign above the door. You can change it later in Settings. (82) |
| `ogretici` | taban şeridi `.ogretici-taban` 1 · adım noktaları `.ogretici-noktalar` 1 · sürükleyen el `HandIcon` 1 · "Atla" metin düğmesi 1 | Ekranı sürükle, yürü | Drag to move |
| `hud` | üst bar: itibar madalyonu+seviye rakamı 1 + `.rep-bar` 1 · cüzdan hapı 2 (₺, 💎) · ayar `.round-btn.gear` 1 · sağ kenar `.round-btn` 2 (kamera, video `.video-btn` + `.tray-count` rozeti) · kenar oku `.edge-arrow` 1 · görev bandı `.band` 1 (fotoğraf `QuestPhoto` + kicker + başlık + alt satır fiyat + ödül hapı + git oku) · alt bar `.botnav` 4 `.navtab` (ikon+etiket) + ünlem rozeti 2 + kutlama ışıması 2 · joystick (dokununca) | SALON 2 · Salon 2: 4. Masayı aç · 1.400 · +200 | HALL 2 · Hall 2: Unlock Table 4 · 1,400 · +200 |
| `gorevler` | tam ekran panel · bölüm başlığı `.sheet-sec` 4 · günlük görev kartı `.goal` 3 (2 hazır `.ready`) + ilerleme çubuğu 3 + "Ödülü al" `.goal-claim` 2 · alt not 1 · büyük aktif görev kartı `.qbig` 1 (fotoğraf + ödül) · görev hattı listesi `.qrow` 25 (✓ 22 · nokta 3) | 9 çayı kendi elinle götür · 0/9 · Her gün yenilenir | Today's remaining reward: 10 · three new tasks tomorrow (55) |
| `hedefler` | tam ekran panel · itibar hero `.rep-hero` 1 (madalyon + geniş çubuk) · Usta şeridi `.usta-strip` 1 (sayaç 0/7 + 💎 fiyat hapı) · bölüm başlığı 1 · hedef kartı `.goal` 5 (kademe `.goal-tier`, ilerleme çubuğu 5, ödül hapı 3, "Ödülü al" 2) | Her hedef seviyeni yükseltir · seviye bonusu +%14 servis hızı. (65) | Each goal raises your level · level bonus +14% service speed. (61) |
| `magaza-kiyafet` | tam ekran panel · sekme `.shop-tab` 7 (4 💎 sekmesi `.elmas`, Masa'da kilit 1) · 3B önizleme tuvali 1 · pul şeridi `.shop-chip` 7 (✓ rozet 1) · ad satırı 1 · satın al `.shop-buy` 1 (devre dışı "Uygulandı") | Klasik Çaycı · Şu an giyiyorsun | Classic Tea Maker · Currently Wearing |
| `magaza-tepsi` | aynı + pul 5 | Klasik Tepsi · Şu an elinde | Classic Tray · Currently Holding |
| `magaza-dekor` | aynı + pul 12 (kilitli `.kilitli` 1, seçili 1) · satın al 1 (kilitli: "3. Salon'da açılır") · `.shop-bildirim-capa` 1 | Lambalı Radyo · 3. Salon'u açınca alabilirsin | Table Radio · Available after unlocking Hall 3 |
| `magaza-masa` | sekme 7 · kilit paneli `.shop-locked` 1 (kilit ikonu + başlık + açıklama + 2 koşul satırı) · önizleme/pul YOK | Tüm salonları aç ve bütün masaları son seviyeye getir; sonra masalarını renklendirebilirsin. (93) | Unlock all Halls and max out every table; then you can customize your tables. (79) |
| `magaza-zemin` | sekme 7 · önizleme 1 · salon seçici `.shop-zone-btn` 2 · pul 5 · ad satırı · satın al (devre dışı) | Klasik Parke · Şu an salonda | Classic Parquet · Currently in the Hall |
| `magaza-duvar` | sekme 7 · önizleme 1 · salon seçici 2 · pul 3 · ad satırı · satın al (devre dışı) | Krem Badana · Şu an salonda | Cream Whitewash · Currently in the Hall |
| `magaza-paketler` | sekme 7 (başlık "Paketler") · paket satırı 5 (ad + açıklama + 💎 miktar hapı `.goal-reward` 4 + fiyat düğmesi `.goal-claim` 5 — dev'de "Test") · alt not 1 · "Satın alımları geri yükle" `.sheet-cta` 1 | Reklamları Kaldır — Oyunun arasına giren reklamlar kalkar. Ödüllü videoları yine istediğinde izlersin. Her gün 10 elmas hediye. (124) | Remove Ads — Ads between gameplay are removed. You can still watch rewarded videos whenever you want. Get 10 Gems every day. (125) |
| `satin-odul` | ödül kartı 1 (ışıma + başlık + 💎 miktarı) · birincil 1 | Bir Avuç Elmas | Handful of Gems |
| `cayci-oyuncu` | tam ekran panel · seviye madalyonu `.char-lvl` 1 · karakter sekmesi `.char-tab` 3 · 3B karakter tuvali 1 · stat satırı `.char-stat` 3 (ikon + ad + "a → b birim" + ₺ fiyat hapı `.char-buy`) | Para Mıknatısı · 2,6 → 3,4 alan | Money Magnet · 2.6 → 3.4 range |
| `cayci-garson` | aynı; stat satırı 2 · alt açıklama 1 | Garsonların ortak tepsisi ve hızı — hepsi tek havuzdan, her masaya. (66) | All waiters share one tray and speed pool across every table. (61) |
| `cayci-bulasikci` | aynı; stat satırı 2 · alt açıklama 1 | Tüm salonların bulaşıkçılarına ortak: leğen tek turda daha çok taşır, hız turu kısaltır. (89) | Shared by all dishwashers: the tub carries more per trip, while speed shortens each trip. (89) |
| `ayarlar` | tam ekran panel · ayar satırı `.setting-row` 5 · kafe adı düğmesi 1 · dil seçici 3'lü segment `.dil-secenek` · anahtar `.switch` 3 (ses, müzik, gölge) · kaydırıcı `.setting-slider` 2 · künye tablosu (5 sayı satırı) · bölüm başlığı 1 · "Satın alımları geri yükle" `.sheet-cta` 1 · tehlike `.danger-btn` 1 (Sıfırla) · yasal bağlantı 2 (Gizlilik, Destek) · alt not 1 | Kayıt bu cihazda tutulur. Oyunu sıfırlarsan geri alınamaz. (58) | The game reloads when you change the language (45) · Save data is stored on this device. Resetting the game can't be undone. (72) |
| `odul` (RewardModal — seviye) | ödül kartı 1 · başlık "Seviye 9!" · ₺ miktarı 1 · stat geçişi satırı 1 (eski → yeni, `ChevronIcon`) · birincil "Ücretsiz al" 1 · ikincil "İzle, 2× al" (`PlayAdIcon`) 1 | Servis hızı %2 → %2,5 | Service Speed 2% → 2.5% |
| `video` (VideoKarti) | küçük kart 1 · madalyon 1 · miktar 1 · not 2 · kapat ✕ 1 · "İzle" düğmesi 1 (bu çekimde DEVRE DIŞI: son dakika kazancı 0) | Bir reklam izle, son dakikada kazandığın kadar para al (53) | Watch an ad to earn as many coins as you made in the last minute (64) |
| `usta` (UstaModal) | küçük kart 1 · madalyon (💎) 1 · başlık "Masa 1 · Usta" · not 1 · kapat ✕ 1 · 💎 fiyat düğmesi 1 + reklamla düğmesi 1 | Bu masanın bahşişi kalıcı olarak ×1,5 olur | This table's tip becomes ×1.5 for good |
| `teklif` (BaslangicTeklifi) | ödül kartı `.teklif-card` 1 · üst etiket "BİR KEZ ALINABİLİR" · 3B önizleme 1 · içerik listesi 2 satır (ikon + metin, "Yalnız bu pakette" etiketi 1) · birincil "Al · fiyat" 1 · ikincil "Şimdi değil" 1 | Kurucu kıyafeti · Yalnız bu pakette · Bordo yelek ve fes | Founder Outfit · Only in this pack · Burgundy Vest and Fez |

**Taşma payı gözlemi:** EN metinler bu ekranlarda TR'den en çok **%25 uzun** (video notu 53 → 64, Ayarlar alt notu 58 → 72);
çoğu satırda ±%10. Plan "EN %30 uzun varsay" kuralı güvenli üst sınır. En dar yer: Mağaza sekme şeridi (7 sekme, 2 satır)
ve görev bandı başlığı (`Hall 2: Unlock Table 4`).

**Düğme türleri sayımı (tüm ekranlar):** birincil geniş `.sheet-cta` 9 · ikincil geniş (ad/şimdi değil) 2 · satır hapı
`.goal-claim` 9 · fiyat hapı `.char-buy` 7 · `.master-buy` 3 · devre dışı 6 (`shop-buy` 5, `master-buy.off` 1) · sekme
`.shop-tab` 7 / `.char-tab` 3 · alt bar `.navtab` 4 · yuvarlak `.round-btn` 3 · geri 5 · kapat ✕ 2 · metin düğmesi "Atla" 1 ·
anahtar 3 · segment 3 · tehlike 1.

## `icons.tsx` — tam ikon listesi (yeniden çizilecek)

Hepsi 24 ızgaralı SVG, koyu kontur (`--ot`) + tek aksan renk. `Glyph` olanlar `QuestPhoto`/stat ikonlarının iç çizimi.

| İkon | Nerede kullanılıyor | Ne anlatıyor |
|---|---|---|
| `CoinIcon` | HUD cüzdanı, panel üst cüzdanı (`Sheet`), fiyat hapları, ödül miktarı, Çaycı fiyatları (19 yer) | Para (₺) — madenî pul |
| `GemIcon` | HUD 💎 hapı, panel üst cüzdanı, mağaza fiyatları, Usta, paket miktarları (18 yer) | Elmas (premium para) |
| `QuestListIcon` | Alt bar "Görevler" sekmesi, günlük görev bandı | Görevler — pano + onay |
| `TargetIcon` | Alt bar "Hedefler" | Hedefler — nişan |
| `ShopAwningIcon` | Alt bar "Mağaza" | Mağaza — tenteli vitrin |
| `CharIcon` | Alt bar "Çaycı" | Karakter — omuz + baş |
| `GearIcon` | HUD sağ üst ayar düğmesi | Ayarlar |
| `BackIcon` | Tüm tam ekran panellerin sol üst geri düğmesi (`Sheet`) | Geri |
| `ChevronIcon` | Görev bandı "git" oku, günlük bant, kenar oku (`EdgeArrow`), ödül ekranı stat geçişi | Sağ ok / hedefe götür / "şuna çıkar" |
| `CloseIcon` | Video kartı ve Usta modalı ✕ | Kapat |
| `ResetIcon` | Ayarlar → Sıfırla düğmesi ve onay | Oyunu sıfırla |
| `LockIcon` | Mağaza: Masa sekmesi kilidi, kilit paneli, kilitli dekor | Kilitli |
| `PlayAdIcon` | HUD video düğmesi, Video kartı, Usta "reklamla", ödül "İzle, 2× al" | Ödüllü reklam izle |
| `TickIcon` | Paketler (sahip olunan), bildirim tostu, mağaza "Uygulandı", kilit koşul satırları | Tamam / sahip |
| `DotIcon` | Mağaza kilit koşul satırı (tamamlanmamış madde) | Boş madde işareti |
| `ToIcon` | Çaycı paneli stat satırları "a → b" (5 yer) | Şuna çıkar oku |
| `HandIcon` | Öğretici (sürükleyen el) | Ekranı sürükle |
| `StarBadge` | Bildirim tostu (seviye/kutlama) | Yıldız madalyonu (içine rakam) |
| `CheckBadge` | Görev bandı tamamlandı, günlük bant, Görevler listesi | Onay madalyonu (görev bitti) |
| `BangBadge` | Bildirim tostu (yeni özellik) | Ünlem madalyonu |
| `ReputationIcon` | HUD sol üst itibar/seviye, Hedefler hero | İtibar — çelenk + yıldız |
| `TrayIcon` (`TepsiGlyph`/`CayGlyph`) | Çaycı/Garson "Tepsi" stat satırı, eksik-para notu | Tepsi kapasitesi |
| `BasinIcon` (`LeganGlyph`) | Bulaşıkçı "Leğen" stat, bulaşık öğretme balonu | Leğen / bulaşık |
| `MagnetIcon` (`MiknatisGlyph`) | Çaycı "Para Mıknatısı" stat | Para toplama alanı |
| `BootIcon` (`HizGlyph`) | Oyuncu/garson/bulaşıkçı "Hız" stat (3 yer) | Hareket hızı |
| `DoorIcon` (`KapiGlyph`) | **Kullanılmıyor** (yalnız `QuestPhoto` içinde lavabo görevi) | Kapı / lavabo odası |
| `BrushIcon` | **Kullanılmıyor** (dışa açık, hiçbir yerde çağrılmıyor) | Boya fırçası (dekor mağazası) |
| `TrayEmptyIcon` | HUD "tepsiyi boşalt (çay)" düğmesi | Tepsiyi boşalt |
| `TostEmptyIcon` | HUD "tepsiyi boşalt (tost)" düğmesi | Tost tepsisini boşalt |
| `CamZoomIcon` (`out` iki hâl) | HUD sağ kenar kamera düğmesi | Genel bakış / yakınlaş |
| `QuestPhoto` (hedef tipine göre: çay, tost, para yığını, leğen, masa, kişi [garson yeşil / z3 aksan / bulaşıkçı elmas rengi], kapı + yukarı ok) | Görev bandı fotoğrafı, Görevler büyük kart | Görevin konusu |
| (satır içi) `char-lvl` madalyonu | `CharacterPanel` başlığı (icons.tsx dışında, elle SVG) | Çaycı seviyesi |

Yeniden çizim listesi (tekil çizim): 30 dışa açık ikon (2si kullanılmıyor) + 9 glif (`Cay`, `Tepsi`, `Miknatis`, `Hiz`, `Legen`, `Tost`, `Masa`, `Kapi`, `Kisi`) + para yığını + yükseltme oku.
