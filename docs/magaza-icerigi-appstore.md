# App Store mağaza içeriği — TASLAK (Köşe Kıraathanesi / Tea House Tycoon)

> **Durum:** taslak, 2026-09-28. App Store Connect'e hiçbir şey girilmedi. Sayılar ve kimlikler koddan
> (`src/config/iap.config.ts`, `economy.config.ts`, `capacitor.config.ts`) okundu. Fiyatlar **öneri**,
> son söz senin. Kareler: `docs/magaza-kareleri/appstore/` (araç: `node tools/shot-appstore.mjs`).

## 0. Senin yapman gerekenler (10 satır)

1. **iOS derlemesi henüz yok.** Projede yalnız Android var (`@capacitor/ios` eklenmemiş). iOS paketi için Mac + Xcode ya da bulutta derleme (Codemagic vb.) gerekir. Bu bir geliştirme turu.
2. **Oyunun arayüzü yalnız Türkçe.** İngilizce mağaza sayfası açılacaksa ya önce İngilizce arayüz gelmeli ya da açıklamaya "şimdilik Türkçe" notu yazılmalı (§1, §7).
3. App Store Connect'te **yeni uygulama** aç: Bundle ID `com.memedobro.teahousetycoon`, SKU (ör. `teahouse-001`), birincil dil Türkçe.
4. **Ücretli Uygulamalar Sözleşmesi** (Paid Apps Agreement) + banka + vergi formu. Bu olmadan satın alımlar çalışmaz.
5. **Üç adres** hazırla: Gizlilik Politikası URL (zorunlu), Destek URL (zorunlu), Pazarlama URL (isteğe bağlı; AdMob'un `app-ads.txt` dosyası bu alan adında durmalı).
6. **AdMob'da iOS uygulaması** + iOS reklam birimleri (geçişli + ödüllü) aç; iOS için UMP rıza mesajı ve IDFA açıklama mesajı yayımla.
7. **RevenueCat'e iOS uygulaması** ekle (App Store Connect uygulama içi satın alma anahtarı ile) → Apple SDK anahtarını geliştirmeye ver.
8. §5'teki **5 ürünü** App Store Connect'te aç, fiyat kademesini seç, her birine inceleme ekran görüntüsü yükle.
9. §3 **yaş anketini** ve §4 **gizlilik etiketini** bu taslaktaki cevaplarla doldur.
10. §1 metinlerini yapıştır, §6 karelerini yükle, §7 inceleme notunu yapıştır → incelemeye gönder.

---

## 1. Metinler (TR + EN-US)

Sınırlar Apple'ın: ad 30 · alt başlık 30 · tanıtım metni 170 · açıklama 4000 · anahtar kelimeler 100 ·
yenilikler 4000 karakter. Parantezdeki sayı karakter sayısı.

### Uygulama adı (≤ 30)
| Dil | Metin | Sayı |
|---|---|---|
| TR | `Köşe Kıraathanesi: Tycoon` | 25 |
| EN | `Tea House Tycoon: Idle Cafe` | 27 |

D-130'daki başlıklar. Ad App Store'da benzersiz olmalı: başkası aldıysa Connect uyarır; o zaman
TR `Köşe Kıraathanesi: Çay Tycoon` (29) / EN `Tea House Tycoon: Cozy Cafe` (27) yedektir.

### Alt başlık (≤ 30)
| Dil | Metin | Sayı |
|---|---|---|
| TR | `Çay Ocağından Koca Kahvehaneye` | 30 |
| EN | `Run a Cozy Turkish Tea Shop` | 27 |

### Tanıtım metni (≤ 170) — sürüm göndermeden her an değiştirilebilir
**TR (138):**
```
Semaver kaynadı! Mahallenin köşesindeki küçük çay ocağını yeni masalar, garsonlar ve salonlarla şehrin en sevilen kıraathanesine dönüştür.
```
**EN (145):**
```
The samovar is boiling! Turn a tiny corner tea stall into the busiest tea house in town with new tables, waiters, a kitchen and three cozy halls.
```

### Açıklama (≤ 4000)
**TR (1478):**
```
Mahallenin köşesinde küçük bir çay ocağı… Onu şehrin en sevilen kıraathanesine sen dönüştür!

Köşe Kıraathanesi, sıcak bir Türk kahvehanesini sıfırdan büyüttüğün 3D bir işletme (tycoon) oyunu. İnce belli bardaklarda çayı demle, tepsini doldur, müşterilerine servis et; kazandığın parayla yeni masalar, garsonlar ve salonlar aç.

NASIL OYNANIR
• Ocaktan çayı al, tepsiyle masalara taşı.
• Müşteriler çayını içip hesabı öder; parayı topla.
• Parayı mekânın içindeki noktalarda harca: yeni masa, daha hızlı ocak, garson, bulaşıkçı.
• Masaları yükselt; sade tabureler kanepeye, masalar daha şık hâllerine dönüşsün.

KIRAATHANENİ BÜYÜT
• Üç salon, yirmi masa: tek odadan kalabalık bir kahvehaneye.
• Mutfak açılınca menüye tost girer; garsonlar ve bulaşıkçı yükünü hafifletir.
• Masaları Usta'ya çıkar: o masanın bahşişi kalıcı olarak artar.
• Günlük görevler, hedefler ve seviye ödülleriyle her gün yeni bir amaç.

SENİN MEKÂNIN
• Kıraathaneye kendi adını ver; tabelada o yazsın.
• Radyo, semaver, gramofon, sarkaçlı saat, kanarya kafesi… Salonu kendi zevkine göre döşe.
• Çaycına yeni kıyafetler, tepsine yeni desenler seç.
• Masa, zemin ve duvar temalarıyla salonun rengini değiştir.

RAHAT OYNA
• Tek elle, dikey ekranda oynanır.
• Oyun kapalıyken de kıraathane bir süre kazanmaya devam eder.
• Reklam izlemek her zaman isteğe bağlı; ilerlemek için zorunlu değil.
• Sürpriz kutusu, şans çarkı ya da kumar yok. Ne aldığını görerek alırsın.

Bir çay daha? Kıraathane seni bekliyor.
```

**EN (1705, koşul satırı dahil):**
```
A tiny tea stall on the corner of the street… Turn it into the most loved tea house in town!

Tea House Tycoon is a cozy 3D tycoon game where you grow a traditional Turkish tea house from scratch. Brew tea in tulip-shaped glasses, load your tray, serve your customers, and spend what you earn on new tables, waiters and whole new halls.

HOW TO PLAY
• Pick up fresh tea from the stove and carry it to the tables.
• Customers drink up and pay. Collect the coins.
• Spend your coins right where things happen: new tables, a faster stove, waiters, a dishwasher.
• Upgrade your tables: simple stools become sofas and tables get fancier.

GROW YOUR TEA HOUSE
• Three halls and twenty tables: from a single room to a bustling tea house.
• Open the kitchen to add toast to the menu. Waiters and a dishwasher take work off your hands.
• Make a table a Master table and its tips grow for good.
• Daily tasks, goals and level rewards give you something new to aim for every day.

MAKE IT YOURS
• Name your tea house and see it on the sign above the door.
• Radio, samovar, gramophone, pendulum clock, canary cage… Decorate the hall your way.
• Pick new outfits for your tea maker and new designs for your tray.
• Change the look of the hall with table, floor and wall themes.

PLAY AT YOUR PACE
• One-handed, portrait play.
• Your tea house keeps earning for a while even when you are away.
• Watching ads is always optional and never required to progress.
• No mystery boxes, no wheels of fortune, no gambling. You always see what you buy.

[IF THE UI IS STILL TURKISH-ONLY, ADD:] Language: the game is currently available in Turkish. English is coming soon.

Fancy another glass of tea? Your tea house is waiting.
```
> Köşeli parantezli satır bir **koşul**: İngilizce arayüz gelmeden EN sayfası açılırsa satır kalır
> (köşeli parantez kısmı silinerek), gelirse satır tümden silinir. Apple, sayfanın vaat etmediği
> bir dili "desteklenen dil" diye göstermez ama açıklama dili yanıltıcı sayılabilir (2.3.1).

### Anahtar kelimeler (≤ 100, virgüllü, boşluksuz; ad/alt başlıktaki kelimeler tekrar edilmez)
**TR (98):**
```
kahvehane,çayhane,kafe,idle,işletme,simülasyon,restoran,garson,mutfak,tost,yönetim,semaver,offline
```
**EN (95):**
```
coffee,restaurant,simulator,manager,business,waiter,kitchen,diner,chai,empire,offline,3d,casual
```
Rakip oyun adı ve marka yok (2.3.7). Ad ve alt başlıktaki kelimeler (tea, house, tycoon, idle, cafe,
cozy, turkish, shop / köşe, kıraathanesi, tycoon, çay, ocak, kahvehane…) Apple tarafından zaten dizinlenir.
Not: TR'de "kahvehane" alt başlıkta "kahvehaneye" olarak geçiyor; ek farkı yüzünden anahtar listesinde bıraktım.

### Yenilikler (What's New)
İlk sürümde (1.0) bu alan **gösterilmez/doldurulamaz**. Aşağıdaki metin ilk güncelleme (1.0.1) içindir:

**TR (168):**
```
Köşe Kıraathanesi açıldı! İlk sürümde üç salon, yirmi masa, mutfak ve tost, Usta masalar, günlük görevler ve salonu süsleyen dekor eşyaları var. Görüşlerini bekliyoruz!
```
**EN (181):**
```
Tea House Tycoon is open! The first version brings three halls, twenty tables, a kitchen with toast, Master tables, daily tasks and décor for your hall. We would love your feedback!
```

### Adresler (sen dolduracaksın)
| Alan | Zorunlu mu | Ne olmalı |
|---|---|---|
| Gizlilik Politikası URL | **Evet** (her uygulama) | Herkese açık bir sayfa: hangi veriler (AdMob, RevenueCat — §4), neden, üçüncü taraflar, iletişim e-postası, çocuklarla ilgili bölüm, silme/itiraz yolu. TR + EN. `https://<alan-adın>/tea-house-tycoon/gizlilik` gibi. |
| Destek URL | **Evet** | İletişim e-postası ya da formu olan sayfa (SSS olursa iyi). `https://<alan-adın>/tea-house-tycoon/destek` |
| Pazarlama URL | Hayır | Oyunun tanıtım sayfası. **AdMob için önemli:** `app-ads.txt` bu sitenin kök alan adında olmalı. |
| Telif hakkı | Evet | `2026 <adın ya da şirket adın>` |

---

## 2. Kategori

| | Öneri | Gerekçe |
|---|---|---|
| Birincil | **Oyunlar** → alt kategori **Simülasyon** + **Gündelik (Casual)** | Tycoon/idle oyunlar App Store'da Simülasyon'da listelenir; Gündelik ikinci alt kategori aramada ve listelerde görünürlük verir. |
| İkincil | **Eğlence** (isteğe bağlı) | Oyun olmayan ikinci kategori; etkisi küçük. Boş da bırakılabilir. |
| Kids kategorisi | **Hayır** | Kids kategorisi kişiselleştirilmiş reklamı ve üçüncü taraf reklam/analitik SDK'larını fiilen yasaklar; D-151 (SDK'da kısıt yok) ile çelişir. |

---

## 3. Yaş derecelendirmesi anketi

Apple'ın güncel anketi (2025 sonrası: 4+ / 9+ / 13+ / 16+ / 18+). Koddan kontrol edildi:
okey/tavla masası v1 kodunda **yok** (oyun salonu Kat 2, v1.1'e kaldı — `progress.md` kapsam çizgisi);
nargile/tütün/küllük **yok** (D-032); alkol yok (yalnız çay ve tost); şiddet yok.

| Soru | Cevap | Not |
|---|---|---|
| Küfür veya kaba mizah | Yok | |
| Korku/dehşet temaları | Yok | |
| Alkol, tütün, uyuşturucu kullanımı/atfı | Yok | Çay + tost. Nargile D-032'de çıkarıldı. |
| Tıbbi veya tedavi bilgisi | Yok | |
| Sağlık/esenlik konuları | Yok | |
| Olgun veya müstehcen temalar | Yok | |
| Cinsel içerik veya çıplaklık | Yok | |
| Açık cinsel içerik ve çıplaklık | Yok | |
| Çizgi film/fantastik şiddet | Yok | |
| Gerçekçi şiddet | Yok | |
| Uzun süreli kanlı/sadistçe şiddet | Yok | |
| Silah | Yok | |
| Kumar (gerçek para) | Hayır | |
| Kumar simülasyonu | Yok | Okey/tavla v1'de yok. v1.1'de gelirse yalnız dekor/servis olarak kalmalı; oyuncunun oynadığı bir okey oyunu gelirse bu cevap **yeniden** değerlendirilir. |
| Yarışmalar | Yok | Günlük görevler yarışma değil (ödül oyun içi, kişisel). |
| Ganimet kutusu (loot box) | Hayır | 💎 ile belli bir eşya alınır; rastgele içerik yok. |
| Ebeveyn denetimi | Hayır | |
| Yaş doğrulama | Hayır | |
| Kısıtsız web erişimi | Hayır | Oyun dış web sayfası açmıyor. |
| Kullanıcı üretimi içerik | Hayır | Kafe adı yalnız oyuncunun kendi cihazında görünür, kimseyle paylaşılmaz. |
| Sosyal medya | Hayır | |
| Mesajlaşma ve sohbet | Hayır | |
| Reklam | **Evet** | Geçişli + ödüllü video (AdMob). |

**Beklenen derece: 4+.** Reklam cevabı "Evet" dereceyi yükseltmez (4+'da izinli). Ayrıca uygulama
içi satın alma derecenin değil sayfanın "Uygulama İçi Satın Alma" etiketinin konusudur.

---

## 4. App Privacy — gizlilik etiketi

Kodda **kendi analitiğimiz yok** (Firebase/Sentry/benzeri yok, `src/` içinde ağa giden tek istek
yerel ses dosyası yüklemesi). Kayıt cihazda. Play Games bulut kaydı yalnız Android — iOS'ta yok.
Veriyi toplayan iki SDK: **Google Mobile Ads (AdMob)** ve **RevenueCat**.

Etiketin ilk sorusu "Veri topluyor musunuz?" → **Evet**.

| Veri türü (Apple adı) | Kim | Amaç | Kullanıcıya bağlı mı | İzleme (tracking) mi |
|---|---|---|---|---|
| Tanımlayıcılar → **Cihaz Kimliği** (IDFA, izin verilirse) | AdMob | Üçüncü taraf reklam, Analitik | Evet | **Evet** |
| Konum → **Kaba Konum** (IP'den tahmin) | AdMob | Üçüncü taraf reklam, Analitik | Hayır | Evet (ihtiyatlı) |
| Kullanım Verisi → **Ürün Etkileşimi** (açılış, reklam tıklama/izleme) | AdMob | Üçüncü taraf reklam, Analitik | Evet | Evet (ihtiyatlı) |
| Kullanım Verisi → **Reklam Verisi** (görülen reklamlar) | AdMob | Üçüncü taraf reklam, Analitik | Evet | **Evet** |
| Tanılama → **Çökme Verisi** | AdMob | Analitik, Uygulama İşlevi | Hayır | Hayır |
| Tanılama → **Performans Verisi** | AdMob | Analitik, Uygulama İşlevi | Hayır | Hayır |
| Tanılama → **Diğer Tanılama Verisi** | AdMob | Analitik | Hayır | Hayır |
| Satın Alımlar → **Satın Alma Geçmişi** | RevenueCat | Uygulama İşlevi, Analitik | Hayır (anonim RevenueCat kimliği; `iap.ts` `logIn` çağırmıyor) | Hayır |
| Kişi bilgisi, e-posta, konum (hassas), kişiler, fotoğraf, sağlık, finans | — | — | Toplanmıyor | — |

Kaynak: Google'ın "Apple App Store veri beyanı" sayfası ve RevenueCat'in "Apple App Privacy"
rehberi (Eylül 2026'da okundu). "İhtiyatlı" işaretli satırlar Google'ın sayfasında net değil: fazla
beyan reddedilmez, eksik beyan reddedilir — bu yüzden "Evet" önerdim.

### ATT (Uygulama İzleme Şeffaflığı) izni
AdMob IDFA'yı okuduğu için iOS'ta **ATT izni sorulmalı** (kod henüz sormuyor — geliştirme işi:
AdMob eklentisindeki izin çağrısı + `Info.plist` `NSUserTrackingUsageDescription` + Google'ın
SKAdNetwork kimlikleri). İzin "Hayır" olursa oyun aynen çalışır, reklam kişiselleştirilmez.

Önerilen izin metni (`NSUserTrackingUsageDescription`):
- **TR (107):** `Bu izin yalnızca sana daha ilgili reklamlar göstermek için kullanılır. İzin vermesen de oyun aynen çalışır.`
- **EN (95):** `This is only used to show you more relevant ads. The game works exactly the same if you say no.`

Sıra: önce UMP rıza formu (AB/UK), sonra AdMob'un IDFA açıklama ekranı, sonra Apple'ın ATT penceresi.
Açılışın ilk saniyesinde değil, ilk servisten sonra sorulması kabul oranını artırır.

---

## 5. Uygulama içi satın alma ürünleri

Kimlikler `src/config/iap.config.ts`'ten; içerik `economy.config.ts` `iap` bloğundan (D-152, D-154, D-157).
Apple'da aynı kimlikler kullanılabilir. **Dikkat:** Apple'da bir ürün kimliği silinse bile bir daha
kullanılamaz. Görünen ad ≤ 35, açıklama ≤ 55 karakter.

| Ürün kimliği | Tür | Referans adı (yalnız sen görürsün) | İçerik |
|---|---|---|---|
| `kiraathane_reklamsiz` | Tüketilmeyen (Non-Consumable) | Remove Ads | Geçiş reklamları kalkar; ödüllü video isteğe bağlı kalır; her gün 10 💎 hediye (elle alınır). RevenueCat hakkı `reklamsiz`. |
| `kiraathane_baslangic` | Tüketilmeyen (Non-Consumable) | Starter Pack | 100 💎 (bir kez) + Kurucu kıyafeti (bordo yelek + fes, yalnız bu pakette). Hak `baslangic`. İlk Usta'dan sonra bir kez teklif edilir. |
| `kiraathane_elmas_25` | Tüketilen (Consumable) | Gems 25 | 25 💎 |
| `kiraathane_elmas_60` | Tüketilen (Consumable) | Gems 60 | 60 💎 |
| `kiraathane_elmas_150` | Tüketilen (Consumable) | Gems 150 | 150 💎 |

### Görünen ad ve açıklama
| Ürün | TR ad | TR açıklama | EN ad | EN açıklama |
|---|---|---|---|---|
| reklamsiz | Reklamları Kaldır (17) | Geçiş reklamları kalkar, her gün 10 elmas hediye. (49) | Remove Ads (10) | No more interstitial ads, plus 10 gems every day. (49) |
| baslangic | Başlangıç Paketi (16) | 100 elmas ve yalnız bu pakette olan Kurucu kıyafeti. (52) | Starter Pack (12) | 100 gems and the Founder outfit, only in this pack. (51) |
| elmas_25 | Bir Avuç Elmas (14) | 25 elmas. (9) | Handful of Gems (15) | 25 gems. (8) |
| elmas_60 | Elmas Kesesi (12) | 60 elmas. (9) | Pouch of Gems (13) | 60 gems. (8) |
| elmas_150 | Elmas Sandığı (13) | 150 elmas. (10) | Chest of Gems (13) | 150 gems. (9) |

TR adlar oyunun kendi etiketleriyle aynı (`diamondPackLabels`, D-157).

### Fiyat — ÖNERİ (kararı sen vereceksin)
| Ürün | USD öneri | TR önerisi (elle) | 💎 / USD | Gerekçe |
|---|---|---|---|---|
| Elmas 25 | 0,99 $ | 34,99 ₺ | 25 | Giriş kademesi: bir Usta = 25 💎, yani "bir Usta'lık" en ucuz alım. |
| Elmas 60 | 1,99 $ | 64,99 ₺ | 30 | Birim fiyat %20 iyi — orta paket her zaman daha iyi değer olmalı. |
| Elmas 150 | 3,99 $ | 129,99 ₺ | 38 | Birim fiyat %50 iyi. 4,99 $ olsaydı 60'lık paketle aynı birim fiyatı verirdi (30/$) → büyük paketi almanın sebebi kalmazdı. |
| Başlangıç | 1,99 $ | 64,99 ₺ | 50 + kozmetik | En iyi değer, bir kez — türün alışılmış "başlangıç fırsatı". 60'lık paketle aynı fiyat, daha fazlası. |
| Reklamları Kaldır | 3,99 $ | 129,99 ₺ | + günde 10 💎 | Türde reklam kaldırma genelde 2,99–4,99 $ bandında; günlük 💎 hediyesi 3,99'u haklı çıkarır. |

- Türün genel fiyat bandı (elmas paketleri 0,99 $'dan başlar; reklam kaldırma ve başlangıç paketi
  1,99–4,99 $) sektör bilgisidir; tek tek rakip mağaza sayfası taranmadı.
- **TRY:** Apple her ülke için otomatik eşdeğer fiyat üretir; Türkiye'de bu eşdeğer yerel alım gücüne
  göre yüksek kalabilir. Tablodaki ₺ fiyatlar "Türkiye için elle fiyat" önerisidir (Apple'ın fiyat
  noktalarından en yakını seçilir). App Store Connect'te görünen otomatik ₺ karşılığıyla karşılaştırıp karar ver.
- Fiyat kodda yok; oyun mağazanın yerel fiyat metnini gösterir (D-152). Fiyat değişimi güncelleme istemez.

---

## 6. Ekran görüntüleri

**Apple'ın güncel zorunlu setleri** (Eylül 2026, Apple "Screenshot specifications"):
- **iPhone 6,9"** — iPhone'da çalışan her uygulama için zorunlu: 1320×2868, 1290×2796 veya 1260×2736 (dikey). Küçük iPhone boyları bundan ölçeklenir.
- **iPad 13"** — yalnız uygulama iPad'de de çalışıyorsa zorunlu: 2064×2752 veya 2048×2732.
- Her dil için 1–10 kare; PNG/JPEG, **saydamlık (alfa) olmamalı**. Çekilen kareler RGB, alfa yok ✔.

**Öneri: ilk sürüm yalnız iPhone** (Xcode'da hedef cihaz = iPhone). Sebep: iPad'de mağaza paneli
telefon genişliğinde ortada kalıyor (`ipad13-5-dekor-magazasi.png`) — iPad için ayrı arayüz turu
gerekir. Yalnız iPhone seçilirse iPad karesi istenmez (iPad'de uyumluluk kipiyle yine açılır).
iPad karelerini de çektim; iPad desteği açılırsa hazır.

**Çekilen ham kareler** (`docs/magaza-kareleri/appstore/`, oyunun gerçek görüntüsü, çerçevesiz):

| # | iPhone 6,9" (1320×2868) | iPad 13" (2064×2752) | An |
|---|---|---|---|
| 1 | `iphone69-1-ilk-servis.png` | `ipad13-1-ilk-servis.png` | İlk dakikalar: ocak, ilk masalar, çay isteyen müşteri |
| 2 | `iphone69-2-dolu-salon.png` | `ipad13-2-dolu-salon.png` | Dolu salon: kanepeler, garsonlar, sipariş balonları |
| 3 | `iphone69-3-siparisler.png` | `ipad13-3-siparisler.png` | Masa başı yakın: çay ve tost siparişleri |
| 4 | `iphone69-4-mutfak.png` | `ipad13-4-mutfak.png` | Mutfak: semaverler, ocak, tost tezgâhı |
| 5 | `iphone69-5-dekor-magazasi.png` | `ipad13-5-dekor-magazasi.png` | Dekor mağazası: eşya salondaki yerinde |
| 6 | `iphone69-6-usta.png` | `ipad13-6-usta.png` | Usta: masanın bahşişi kalıcı ×1,5 |

Yeniden çekmek için: `node tools/shot-appstore.mjs` (yalnız biri: `SADECE=iphone` / `SADECE=ipad`).
Kareler oyunun Türkçe arayüzünü gösterir; EN sayfasında da aynı kareler kullanılabilir (arayüz Türkçe
olduğu sürece doğrusu da budur).

**Yükseltme anı çekilemedi:** masa noktası görev açıkken görünüyor, ama kare aracında para yettiği için
yükseltme anında bitiyor ve dolan bar kareye girmiyor. İstenirse ayrı bir turda (parayı bar yarıdayken
kısan bir kareyle) eklenir.

### Pazarlama çerçevesi — ÖNERİ (yapılmadı)
Mağazada en çok indirilen tycoon sayfaları kareyi ham koymaz: üstte 2-4 kelimelik büyük başlık, altta
oyun karesi (çoğu zaman telefon çerçevesiz, hafif eğik ya da taşan). İlk 3 kare arama sonucunda
görünür → en güçlü üçü başa. Önerilen başlıklar:

| # | TR başlık | EN başlık |
|---|---|---|
| 2 (ilk sıraya) | Kıraathaneni büyüt | Grow your tea house |
| 1 | Çayı demle, servis et | Brew tea, serve smiles |
| 4 | Mutfağı aç, tost ekle | Open the kitchen |
| 6 | Masalarını Usta yap | Make Master tables |
| 5 | Salonunu kendin döşe | Decorate your way |
| 3 | Her masa ayrı hikâye | Every table has a story |

Yazı tipi oyunun kendi fontu (Lilita One başlık, Baloo 2 alt metin), zemin oyunun mor-lacivert HUD
rengi + sıcak turuncu vurgu. Çerçeveli sürüm istenirse kareler aynı araçla ayrı bir turda üretilir.

---

## 7. App Review notu + risk kontrol listesi

### İnceleme notu (Connect → "App Review Information → Notes"; İngilizce yaz)
```
No account or login is needed. The game starts immediately; you will be asked to name your tea house once (any name works).

How to play: walk with the on-screen joystick, stand at the tea stove to pick up tea, then stand next to a customer's table to serve. Coins drop on the table; walk over them to collect.

In-app purchases: open "Mağaza" (Shop, bottom bar) → "Paketler" (Packs) tab. All five products are listed there: Remove Ads, Starter Pack and three gem packs. Gems buy cosmetic items in the other Shop tabs. "Satın alımları geri yükle" (Restore Purchases) is in Settings (gear icon, top right).

Ads: rewarded videos are always optional ("İzle" buttons on reward screens and on a Master table). Interstitial ads can appear at most once every 3 minutes, only when a panel is closed, never during gameplay and never after a reward screen. Remove Ads removes interstitials only.

The user interface is in Turkish. Tapping any button is safe; there is no destructive action outside Settings → "Oyunu Sıfırla" (reset game).
```

### Kontrol listesi
| Kural | Risk | Durum / yapılacak |
|---|---|---|
| **2.1 Uygulama bütünlüğü** | Test reklam kimlikleri (`ads.config.ts` `test: true`) ve `revenueCatAnahtar: null` ile gönderilirse satın alma "Mağaza hazır değil" der → red. | Gerçek iOS AdMob birimleri + RevenueCat Apple anahtarı ile derle. |
| **2.3.1 Doğru meta veri** | EN sayfa, Türkçe arayüzü İngilizce sanılacak şekilde anlatırsa. | EN açıklamadaki dil satırı (§1) ya da İngilizce arayüz. |
| **2.3.7 Anahtar kelimeler** | Rakip adı / alakasız kelime. | Listede yok ✔. |
| **2.3.10 Başka platform adı** | Mağaza → Paketler sekmesinin altındaki "Aldıkların **Google hesabında** saklanır" notu (`HUD.tsx` ~1694) — inceleme ekibinin satın alımları test ederken göreceği ilk yer. **Yüksek risk.** | iOS'ta "Apple hesabında" demeli — geliştirme işi. |
| **3.1.1 Uygulama içi satın alma** | Dijital içerik yalnız Apple IAP ile satılmalı; tüketilmeyenler geri yüklenebilmeli. | RevenueCat = StoreKit ✔. Geri yükleme düğmesi Ayarlar'da var ✔. Başlangıç paketinin 💎'ı geri yüklemede tekrar verilmiyor (yalnız kozmetik) — açıklamada "100 elmas bir kez" demek yeterli. |
| **3.1.1 Loot box** | Rastgele ücretli içerik varsa olasılık gösterilmeli. | Yok ✔. |
| **3.2.2 / 5.1.1 Reklam ve veri** | Reklam izleme ATT'siz IDFA okursa red. | ATT izni + metni eklenmeli (§4) — **geliştirme işi**. |
| **5.1.1(i) Gizlilik politikası** | Politika hem Connect'te hem **uygulama içinde** kolay erişilebilir olmalı. | Ayarlar'da gizlilik bağlantısı yok — eklenmeli (geliştirme işi). |
| **5.1.1(v) Hesap silme** | Hesap açılan uygulamalar için. | Hesap yok ✔. |
| **4.2 Asgari işlev** | Web sarmalayıcı sanılma riski (Capacitor). | Tam oyun, yerel reklam/IAP ✔. Düşük risk. |
| **4.3 Spam** | Türde çok benzer oyun var; şablon/klon sanılma. | Özgün tema (Türk kıraathanesi, kendi sanat düzeni), kendi hesabından tek sürüm ✔. Aynı oyunun ikinci bir kopyası (ör. farklı adla) gönderilmemeli. |
| **Yaş derecesi** | Okey/tavla v1.1'de oynanabilir hâle gelirse "kumar simülasyonu" (13+). | v1'de yok ✔; v1.1'de yalnız dekor/servis kalırsa 4+ korunur. |

---

## 8. Emin olunmayan noktalar
- Google'ın AdMob beyan sayfası "kaba konum" ve "ürün etkileşimi"nin izleme sayılıp sayılmadığını açık yazmıyor — ihtiyatlı "Evet" önerildi.
- Türkiye mağazasının hangi ikinci dili dizinlediği (anahtar kelime için) doğrulanmadı.
- TRY önerileri Eylül 2026 kurunda Apple'ın hangi fiyat noktalarına denk geldiği Connect'te görülmeden kesinleşmez.
- Yaş anketi soruları Apple'ın Eylül 2026 başvuru sayfasından alındı; Connect'teki ekran küçük adlandırma farkları gösterebilir.
