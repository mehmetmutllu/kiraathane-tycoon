# decisions — Tasarım/Teknik Karar Günlüğü

## D-025 · YERLEŞİM v3: PER-ZONE AYNALI MUTFAK + bulaşık ayrı + kare masa evrimi (2026-06-11, kullanıcı feedback'i; D-024 revizyonu)
**Bağlam:** Kullanıcı sabah feedback'i: (a) "çay ocağı ile bulaşığı tek yerde toplamışsın" (L-köşe kümesi);
(b) zone-2 servisi sol şeritten → garson turu ~21sn > sabır 18sn (müşteri kaçar — kullanıcı öngördü, ölçümle doğrulandı);
(c) yükseltme pad alanı dar; (d) masa pad'leri ocağa giriyor; (e) ekran alt duvara yakın, üstler boş;
(f) masa KARE kalarak evrilsin (yuvarlak/sekizgen formlar gitti); (g) seviye başına +1 sandalye (4'e kadar), sandalye yakın;
(h) kilim rengi cırtlak; (i) mağaza: dama düz beyaz görünüyor + duvar dibinde eski renk zemin şeridi.
**Karar:** D-024'ün L-şeridi kaldırıldı → **HER salonun mutfağı KENDİ içinde, AYNALI şablon** (mir: x→ZONE_DX−x):
ocak z1 SOL duvar ortası [-4.35,-2.5] / z2 SAĞ duvar ortası [14.95,-2.5] (stationRots ±90°); bulaşık ARKA duvarda
ocaktan AYRI [1.8,-4.85]/[8.8,-4.85]; çay pad'i ocağın yanında [-2.4,-2.5]/[13.0,-2.5]; her zone'un kendi çaycı NPC'si.
Masalar sağa+yukarı (kolon -1.2/3.2, sıra -0.6/2.2; açılış sırası ÖN sıradan — başlangıç masası ocaktan >4 br);
masa pad'leri kapı-tarafı ÇAPRAZDA (orta koridor; dolum hareketsizken aktığından yürüyerek geçmek para çekmez).
Garson turu artık zone'dan bağımsız ~10sn < sabır 18sn (ölçüm: 180sn'de 50 garson servisi, kaçan yok).
**2 GARSON kararı:** salon başına 1 garson (toplam 2) YETERLİ — 3.sü fazla otomasyon (D-014) + zone modelini bozar;
tempo gerekirse L2 hız (1.8→2.3) var. Görsel: kare masa + örtü/etek/pirinç bant evrimi; sandalye=min(4,seviye+1)
(S=oturma collision'lı, N/E/W salt görsel); kilim toprak-bordo (#84504a) ve masa bloğuna ortalanır (LAYOUT.tables'tan
türetilir); dama=BÜYÜK düz-renk quad satranç deseni (canvas doku değil); zone zemin overlay'i DUVARA kadar (+0.55).
Geometri testi: pad merkezi pickup dışı +0.3 (eski 2.9 toplamı yerine; pickup-guard asıl emniyet) + tüm zone'lar döngüde.
**Doğrulama:** vitest 91/91, build temiz, smoke 27/27, Playwright canlı: iki zone tam kurulu, bulaşıkçılar yeni
konumda çalışıyor (oyuncu yol üstünde DURURSA personel bekler — önceden de olan davranış), dama+yeşil duvar satın
alımı görsel doğru, masa L4 kare+altın+4 tabure, konsol 0 hata.
**REV. A (aynı gün, kullanıcı seçimi):** "Bulaşığın ocaktan ayrı durması garip" → iki seçenek sunuldu;
kullanıcı A'yı seçti: bulaşık kendi ocağının HEMEN BİTİŞİĞİNE (aynı yan duvar; z1 sol/z2 sağ TEK MUTFAK BLOĞU;
dish [-4.35,-4.2] aynalı, dishHalf [0.4,0.7] döndü, görsel rotasyon stationRots). Bulaşıkçı pad'i [0.2,-4.5]
(çay pad'iyle dolum daireleri kesişmez: 3.28 > 2.6). Masa sıraları hafif yukarı (-1.0/1.9). GARSON YAVAŞLATILDI
(kullanıcı onaylı): moveSpeedByLevel [1.8,2.3]→[1.5,2.0] — per-zone mutfakla "çok hızlı" hissetti; tur ~12sn <
sabır 18sn korunur (canlı ölçüm: 180sn'de 51 servis, kaçan yok). Görev zoom'ları canlı doğrulandı (q_wash→yeni
bulaşık, q_station2→çay pad'i, q_pickup→ocak, q_z2serve→zone-2 merkez).

## D-024 · DÜNYA v2: duvarsız tek salon + TEK kapı + SOL DUVARDA L MUTFAK ŞERİDİ (2026-06-11 gece; D-022 revizyonu)
**Bağlam:** Kullanıcı feedback'i (feedback-2026-06-11.md §B): "zone'lar arasında duvar OLMAMALI, alan genişleyince
tek salon dursun; müşteriler TEK kapıdan girsin; çay ocağı+bulaşık BİTİŞİK sol duvara paralel L-şerit; duvar-tezgah
arasında çalışan biri (çaycı); yükseltme noktaları tezgahın önünde." Gece oturumu varsayılan kararı (itiraz gelmedi).
**Karar:** D-022'nin "per-zone TEMALI ocak" FİZİKSEL kısmı revize edildi: **per-zone MEKANİK AYNEN KORUNUR**
(stations[z]/dishStations[z]/per-zone personel/readyCupsByZone — kod ve SAVE v18 değişmedi), ama TÜM modüller
**sol duvar L-şeridinde** durur: ocak modülleri sol duvara paralel (zone açıldıkça şerit ÖNE uzar; ileride tost
makinesi eklenir), bulaşık modülleri arka duvar dibinde L'nin kısa kolu. Taşıma mesafesi zone uzaklığıyla doğal
zorluk üretir (zone-2 masaları kapı/şeritten uzak). **Bölme duvarı + per-zone kapılar KALKTI** (divider solid +
görsel + geçit silindi); kilitli zone = karanlık örtü + zemin sınır çizgisi; oyuncu AÇIK zone'lara kelepçeli
(openMaxX clamp — görünmez duvar yok, karanlığa girilmez). zone2 pad'i sınır çizgisi üstünde.
**Yerleşim sabitleri:** stations [-4.35,-3.6]/[-4.35,-1.3] (stationHalf [0.4,1.1] döndü); dish [-2.8,-4.85]/
[-1.3,-4.85]; upgradeZones [-1.4,-3.4]/[0.5,-3.4] (HER modüle ≥2.9 = pickup 1.6 + PAD 1.3 değişmezi korunur);
waiterHome/upgradeSpot sol-ÖN köşeye taşındı (eski yer şeridin içinde kalıyordu; masa marker çakışması ölçülüp
düzeltildi). ÇAYCI NPC (KitchenStaff, salt görsel) duvar-tezgah koridorunda yürür/eğilir. Rezervler: DEPO sol-arka
ek oda, TUVALET sağ-arka ek oda, MERDİVEN ön-sağ basamak silüeti (floorplan-master.md ile uyumlu).
**Doğrulama:** vitest 89/89 (geometri değişmezi dahil), build temiz, smoke 27/27, Playwright canlı: şeritten pickup,
zone-2 müşterisi tek kapıdan masaya oturdu, z2 görev kamerası [12,0,1.5], konsol 0 hata.

## D-023 · HUD REDESIGN v1+v2 (MPH grameri) + LEVEL/XP + AYARLAR + bulaşık onboarding gate (2026-06-10 gece)
**Bağlam:** Kullanıcı D-021 HUD'unu reddetti ("oyun gibi değil, ikonlar AI slop") → onaylı akış: gerçek tycoon HUD
araştırması (YALNIZ 3D arcade-idle: MPH gerçek HUD/MPH-Empire/My Mini Mart/Burger Please; 2D'ler elendi) → mock →
onay → uygulama → Playwright (GERÇEK click ile) doğrulama.
**Kararlar (kullanıcı onaylı):**
- **Yerleşim MPH birebir:** sol-üst BÜTÜNLEŞİK level pill'i (yıldız gömülü + XP barı), altında yuvarlak dişli+posta;
  sağ-üst para+elmas AYNI pill ailesinde chip (hiza piksel-eş); sağ-üst altı görev kartı (hedef-tipine göre SVG
  fotoğraf + ad + ilerleme/maliyet; dokun→kamera). Ceviz-kahve pill ortak dil; alt ekran boş.
- **İkon:** elle çizilmiş gradyanlı SVG seti `icons.tsx` (emoji/CSS-shape yasak — kalıcı kural).
- **Font:** Baloo 2 + Lilita One @fontsource YEREL; 3D zemin yazıları `public/assets/fonts/Baloo2.ttf` (OFL)
  + fontWeight 700 → troika CDN default'u kalktı (D-018 TODO kapandı).
- **LEVEL/XP (v17):** eylem-temelli XP (config.xp; servis 2/garson 1/yıkama 1/görev 25/pad 15/yükseltme 10;
  eğri 60×1.5^L); xp persist + v16→v17 migrasyonu eski ilerlemeden TOHUMLAR; level-up toast. İleride kat L-kapısı +
  kozmetik mağaza (mağaza HUD yeri: sol buton sütunu, posta altı).
- **Ayarlar modalı:** ses/müzik/bildirim toggle (persist `settings`) + Oyunu Sıfırla; posta = boş gelen kutusu.
- **Bulaşık onboarding gate:** q_wash görevi gelmeden kirli bardak çıkmaz (bardak temize döner — korunum/deadlock
  korunur); mekanik görevle öğrenilir.
- **Bug dersleri:** (1) üst HUD öğeleri touch-layer altında kaldı → z-index 10; tıklanabilirlik GERÇEK Playwright
  click ile test edilir (evaluate .click() hit-testing yapmaz). (2) Floater key'i coin id → reset sonrası id çakışması;
  bağımsız monoton sayaç.
**Durum:** vitest 78/78, smoke 27/27, build temiz, sim 60sn sabit, 320/390/768/landscape taşma yok.

## D-022 · ZONE MİMARİSİ: per-zone TEMALI servis + kat planı (2026-06-10 gece, kullanıcı onaylı)
**Bağlam:** "Tek merkezi servis mi, per-zone ocak+bulaşık mı?" sorusu artı/eksi tablosuyla karara bağlandı.
**Karar:** **PER-ZONE ocak+bulaşık** — gerekçe: sabır 18sn vs merkezi servisin 15-20 br taşıma mesafesi (müşteri
çay gelmeden gider), garson "kısmi assist"inin korunması, zone-paralel temiz idle matematiği, her zone'un servis
köşesinin yükseltmeyle GÖRSEL evrimi ("köşeyi döşeme" isteği per-zone'da yaşar). Kopyala-yapıştır değil TEMALI.
**Kat planı (kullanıcı düzeltmesi — D-016 ile uyumlu):** kat başına 4 zone (2×2). **Zemin kat = çay teması**:
zone 1-2 çay salonu (per-zone ocak+bulaşık), **zone 3-4 FARKLI konsept** (mutfak/tost şeridi, TV köşesi adayları).
Kata özel ortak alanlar: tuvalet/lavabo + depo (3c), TV köşesi (maç saati rush — mekanik Faz 4), dış bahçe
masaları (sokak vitrini). **Okey/tavla/nargile ÜST katlar** (3b merdiven) + üst katta BALKON. Lavabo mekaniği
önerisi: zone-3 ile birlikte (gece sadece yer rezerve edilir) — sabah kullanıcıyla netleşecek.

## D-021 · QUEST SİSTEMİ + zorunlu personel + kamera odak + HUD game-feel (2026-06-10, Fable brief §1+§4)
**Bağlam:** Kullanıcı telefon feedback'i (2026-06-09): erken oyun sıkıcı grind; offline ~1.9k kalan TÜM içeriği aldı
("oyun bitti"); onboarding vizyonu = üstte görev barı + tıklayınca kamera hedefe kayar + yeni açılan şeye otomatik pan +
reveal'lere arka-plan şartı; "UI oyun gibi hissettirsin, AI-slop değil". Araştırma: My Perfect Hotel (Jurasek 900s +
Udonis + ARPU deconstruction) + Pecorella idle matematiği.
**Kararlar (kullanıcı onaylı):**
- **Sıralı GÖREV HATTI** `economy.config.quests[]` (13 görev): pickup→serve→coin→table2→5-servis→ocak L2→3-yıkama→
  table3→garson→bulaşıkçı→table4→garson-hız→masa-yük. "Garsonla ₺X kazan" görevi kullanıcı isteğiyle ÇIKARILDI (görev
  enflasyonu olmasın). Sayaç görevleri `questBase`'ten DELTA sayılır. `questIndex/questBase` persist.
- **Personel ZORUNLU omurga halkası** (D-014 "opsiyonel" kararı GEÇERSİZ): pads zinciri table2→table3→waiter→
  dishwasher→table4; `optional` kavramı fiilen kalktı (`availableOptionalPads` boş döner).
- **EKRANDA TEK PAD:** `visiblePads(questIndex, gate)` — pad görevi sırasında YALNIZ o pad; pad-dışı görevde hiç pad;
  hat bitince klasik omurga güvenlik ağı. Tick (dolum) + Pad.tsx (çizim) AYNI helper'ı kullanır.
- **Yükseltme noktaları My Hotel gibi KALICI-sade** (görevle tanıtıldıktan sonra hep görünür, parası yetince parlar).
- **Arka-plan reveal şartı:** `Requires.minWaiterServed` — garson hız yükseltmesi garson 20 çay taşımadan görünmez
  (kullanıcı: "tutar tutmaz hızlandırma gelmesin"). Sayaçlar `stats{teaPickups,teasServed,coinsCollected,dishesWashed,
  waiterServed}` persist.
- **Kamera odak:** transient `camFocus{pos,ttl 2.2s}`; tetik = görev barına dokunma + görev geçişi + reveal + ilk-oyun
  açılışı (ilk görevin hedefine pan). CameraRig odakta d×0.72 zoom + k=5 damping; joystick girdisi ANINDA iptal eder.
- **HUD game-feel:** chip'ler yalnız PARA (CSS altın coin ikonu; ₺/TL display'den TAMAMEN kalktı — 3D'de pul mesh) +
  💎; tepsi/hazır/temiz/kirli/masa chip'leri SİLİNDİ (bilgi dünyada). Offline = açılışta modal kart "[Tamam]" (köşe
  yazısı değil). Sıfırla → sağ-üst dişli menüsüne. Coach bandı + next-step silindi → görev barı tek yönlendirme.
- **SAVE_VERSION 15→16 + migrasyon:** stats/questIndex/questBase eklendi; questIndex eski kayıttan TOHUMLANIR (ilk
  karşılanmamış görevde durur — garson hiç tutulmamışsa hat q_waiter'da bekler, atlanmaz); garson zaten tutulmuşsa
  waiterServed=20 tohumu (işaret elinden alınmaz).
- **Zone mimarisi önerisi (Faz 3a, kullanıcı onayı BEKLİYOR):** per-zone ocak+bulaşık+personel (Idle Miner şaft modeli;
  merkezi tek servis taşıma mesafelerini saçmalatır + tek mega-darboğaz). Zone'lar sıralı açılır (zone-2 ~₺6-8k);
  kat = düz devam (prestige değil); lavabo event'leri Faz 4+'a ertelendi.
**Doğrulama:** vitest 72/72, build temiz, sim ilk-alım 60sn, smoke 27/27 (quest akışı dahil), Playwright görsel ✓
(görev barı + kamera odak + offline modal + coin ikonları). Dev kancaları: __setQuest, __grantStat eklendi.
**Sonraki:** Adım 3 = curve'ü 3-profil simülasyonla ciddi hesapla (aktif/yarı-aktif/offline); Adım 4 = Faz 3a zone-2.

## D-020 · Ekonomi tempo + offline kıs + karışık tepsi + onboarding (2026-06-09)
**Bağlam:** Kullanıcı telefon testi feedback'i: (1) başta aşırı yavaş; (2) 1 gece sonra ~18k birikip ilk zone tek
seferde bitti; (3) garson+bulaşıkçı sonrası çok hızlı/ucuz; (4) kamera çok yakın. + bug: elinde çay & masalar kirliyken
deadlock. + istek: onboarding, sıfırlama butonu, ses/nice-to-have araştırması, tost/yemek tasarımı.
**Kararlar:**
- **Offline sert kıs:** `offline.rateMult 0.5` (idealize aktif oranın yarısı) + `baseCapHours 2→1` → built shop
  18.4k→~4.6k. Gerekçe: %100 idealize oran gerçek aktiften fazla ödüyordu; "birkaç yükseltme parası, zone bitmesin."
- **Eğri garson noktasında:** garson ÖNCESİ ucuz (table2 35→25, minLifetime 30→20, çay yük. tabanı 25→20 → ilk-alım
  84→60sn); SONRASI ölçülü pahalı (table3 120→130, table4 300→420, bulaşıkçı 280→330, masa yük. growth 1.6→1.8, garson
  L2 2.6→2.3 & 200→250). Gerekçe: tek darboğaz manuel servisti → yardımcılar açılınca tempo "flip" yapıyordu. Abartma yok.
- **İkinci ilerleme ekseni (nakit-dışı zone gate) ERTELENDİ → Faz 3a** (tek-zone için offline kıs yeterli).
- **Kamera:** d 6→7, portrait clamp 1.3→1.4 (telefonda çok yakındı).
- **Karışık (paylaşımlı) tepsi — D-018 "eli boşken/tek renk" kısıtını GEÇERSİZ KILAR:** `trayCapacity 2→4`, çay+kirli AYNI
  tepsiyi paylaşır (toplam ≤ trayCap). Gerekçe: eski kısıt deadlock yapıyordu (elinde çay + tüm masalar kirli → ne bırakır
  ne toplar). Yapısal kilit-geçirmez + solo angarya azalır. Render tek CupTray ardışık (çay kırmızı / kirli gri).
- **Onboarding (Faz 2i) = sade koç ipucu:** `onboardingHint(g)` 2. masa açılana kadar çekirdek döngüyü öğretir; kalıcı
  durum YOK (durumdan türetilir, SAVE değişmedi), sıfırlayınca tekrar belirir. Kamera-zoom'lu rehber tur YOK (sade yeterli).
- **Sıfırlama butonu** (HUD sol-alt, confirm'li) — cihazda test için.
- **Tost/yemek (tost makinesi + 2. istasyon):** Faz 3d'ye ait; karışık tepsi altyapısı hazır; tek garson hem çay hem tost
  servis eder. Erken mi 3d'de mi yapılacağı kullanıcı kararına bırakıldı (öneri: zone sisteminden sonra).
**Doğrulama:** vitest 71/71, build temiz, sim ilk-alım 60sn, smoke 22/22, Playwright görsel ✓. SAVE_VERSION 15 (değişmedi).

## D-001 · Unity yerine TS + Vite + React + R3F (2026-06-05)
**Karar:** Oyun motoru olarak Unity yerine TypeScript / Vite / React / React Three Fiber.
**Gerekçe:**
- Tüm-metin kod tabanı Claude Code akışını akıcı kılar: memory-bank, `/clear`+resume,
  Playwright MCP ile gerçek tarayıcı testi, diff-tabanlı kod incelemesi. Unity'nin
  binary sahne/asset dosyaları bu akışla kötü çalışır.
- Web build anında çalışır → her özellik küçük adımda test edilebilir.
- Monetizasyon Capacitor + RevenueCat (IAP) + AdMob (reklam) ile zaten çözülmüş.
- R3F ekosistemi (drei/rapier/postprocessing) low-poly stilize idle oyun için yeterli.
**Bedel/risk:** Capacitor WebView performansı native'in altında → Faz 7'de instancing/
atlas/LOD ile orta-segment Android 60fps hedefi. Kabul edildi.

## D-002 · Data-driven ekonomi (economy.config.ts) (2026-06-05)
**Karar:** Tüm denge sayıları `src/config/economy.config.ts`'te; kod oradan okur.
**Gerekçe:** İnce ayar oynayarak yapılır; sayıların tek yerde olması simülasyon
(`tools/simulate.ts`) ve hızlı dengelemeyi mümkün kılar.

## D-003 · Büyük sayılar için break_infinity.js (2026-06-05)
**Karar:** Para/itibar gibi büyüyen değerler `Decimal` (break_infinity.js).
**Gerekçe:** Idle oyunlar Number sınırını aşar; geç oyunda taşma/hassasiyet kaybı olmaz.
Faz 1'de değerler küçük ama altyapı baştan Decimal üstüne kurulur (sonradan migrasyon acısı yok).

## D-004 · Greybox-first + fallback loader (2026-06-05)
**Karar:** Oyun ilkel şekillerle tam oynanır; `.glb` yoksa otomatik ilkele düşülür.
**Gerekçe:** Oynanış sanata bağımlı olmasın; mekanik önce kanıtlansın, sanat Faz 6'da
tek seferde geçsin. Loader sarmalayıcı sayesinde model takılınca oynanış kodu değişmez.

## D-005 · Tek asset stili kilidi: Quaternius/Kenney CC0 (2026-06-05)
**Karar:** Başlangıç stili CC0 low-poly (Quaternius/Kenney). Türk objeleri AI üretimi.
**Gerekçe:** Bütçe belirtilmedi; CC0 ile lisans riski sıfır. Karışık sanatçı görüntüyü
bozar → tek kaynak kilidi. Bütçe gelirse Synty POLYGON'a topluca geçiş kullanıcı onayıyla.

## D-006 · Kayıt: localStorage + saveVersion + migrasyon (2026-06-05)
**Karar:** Backend yok; cihaz = veritabanı. `saveVersion` alanı + migrasyon zinciri.
**Gerekçe:** Mobil idle için yeterli; bulut kayıt en sona opsiyonel. Şema değişince eski
kayıtlar migrate edilir, kullanıcı ilerlemesi kaybolmaz.

## D-010 · Ekonomi v2: throughput modeli + sıralı gating (2026-06-05)
**Karar:** Yükseltmeler çay FİYATINI değil **throughput'u (servis edilen çay/dk)** artırır.
Gelir, kapasite zincirinin **darboğazına** bağlı (talep→masa→ocak→garson). Tüm açılış/
yükseltmeler **önkoşullu sıra** (gating) ile gelir. Fiyat hacim-tabanlı (sabit taban; artış
prestige/menü ile). Maliyet eğrisi geometrik (r≈1.12).
**Gerekçe:** Kullanıcı feedback'i — fiyatın seviyeyle artması gerçekçi değil; "sistem/fiyat
politikası" ve net sıra şart. Idle Miner / restoran-idle araştırması bottleneck dengesini
doğruluyor (darboğaz = israf).
**Durum:** ✅ UYGULANDI (2026-06-06). `teaPrice(level)` kaldırıldı (coin=sabit TEA_PRICE);
stationLevel demleme süresini kısaltır (brewTime/brewThroughputMult); `Requires`+`requiresMet`
gating (pad + upgrade zone); `currentPad(GateState)`, `nextStep` HUD rehberi; simulate.ts
bottleneck modeli (ilk alım 84sn). Vitest 14/14, smoke 9/9.
**Alt kararlar (kullanıcı onayı 2026-06-05):** (1) Çay fiyatı şimdilik **sabit**; artış sonra
**yeni menü ürünleriyle** (tost/kahve/pizza). (2) Talep **kapasiteyi otomatik takip eder**
(~%15 önde, mekân hep dolu); Tabela/İtibar + ödüllü video opsiyonel/sonra. (3) Gating omurgası
**"önceki alındı" önkoşul zinciri**; lifetime-₺ eşikleri destekleyici ikinci katman.

## D-015 · State tek-doğru-kaynaktan türetilir (denormalizasyon yasak) — ✅ UYGULANDI (2026-06-06)
**Durum:** ✅ UYGULANDI (2026-06-06). `economy.config.ts`'e saf `derivedFromPads(padsDone)` eklendi; store
(init+tick) ondan okur, pad açılınca yalnız `padsDone` büyür (tick mutasyonları kalktı); SaveData'dan
`tables/stations/serviceSpeedMult/hasWaiter` çıkarıldı; **SAVE_VERSION 7→8** + v7→v8 migrasyon (eski
`hasWaiter:true` → `padsDone`'a `waiter`). simulate.ts da türetir. Çelişen sahte alanların türetmeye
sızamadığı + store'un daima tutarlı kaldığı testlerle ispatlandı. Vitest 25/25, build temiz, sim 84sn, smoke 15/15.
**Karar:** Pad'lerden **türetilebilen** değerler ayrı state/kayıt alanı olarak TUTULMAZ; tek doğru kaynak
`padsDone`'dan türetilir. Türetilenler: `tables` (1 + addTable sayısı), `stations` (1 + addStation sayısı),
`serviceSpeedMult` (serviceSpeed/addStation çarpanlarının çarpımı), `hasWaiter` (`padsDone.includes('waiter')`).
Bağımsız kalanlar (türetilemez): `stationLevel` (upgradeZone), `wallet`/`lifetime`/`diamonds`, `padsDone`/`padFills`.
**Gerekçe:** `tables` hem ayrı sayaç hem `padsDone` içinde örtük tutuluyordu → desenkronize olunca 4. masa çizildi
ama `table4` "açılmamış" sayılıp masayla aynı konumda çakıştı (bu oturumda v6/v7 migration patch'iyle yamandı).
Kullanıcı: "masa sayısı 4 ama kayıtta 3 açıldı diyor — bunun BİLE olmaması, olmadan hallolması gerek; benzer açıklara
önlem alınmalı." Yani savunmacı yama değil, çelişkiyi **yapısal imkansız** kılan kök çözüm isteniyor.
**Uygulama planı (sonraki oturum):** (1) economy.config'e saf `derivedFromPads(padsDone)` → {tables,stations,
serviceSpeedMult,hasWaiter}. (2) store: pad açılınca SADECE `padsDone`'a ekle, gerisini türet (tek yazım noktası);
tick'teki `tables++`/`serviceSpeedMult*=` kaldırılır. (3) save: türetilenleri KAYDETME (yüklemede türet) → kayıt
küçülür, çelişki imkansız; **SAVE_VERSION 7→8** + migrasyon (eski kayıt `padsDone`'undan türet); v5/v6/v7 addTable-senkron
patch'leri gereksizleşir (sadeleşir). (4) Testler: desenkronizasyonun artık ÜRETİLEMEDİĞİNİ ispatla.
**Etki:** Bu sınıftaki tüm tutarlılık açıkları (masa/ocak/garson sayacı vs pad listesi) kapanır. Faz 3a salon/oto-kurulum
da bu türetme modeline oturur.

## D-012 · Mekân (zone/salon) + bölge-başı personel modeli; KASA YOK (2026-06-06)
**Karar (kullanıcı onayı 2026-06-06):** My Perfect Hotel arcade-idle döngüsü uyarlanır.
- **KASA/kayıt/karşılama İPTAL** (eski D-011 önerisinden çıkarıldı): müşteri girer, direkt oturur.
- Mekân **salonlara** bölünür (~1 ocak : 4 masa); salon dolunca **yeni salon + oto 1.ocak/1.masa +
  personel slotları** açılır. Başlangıç dengesi 1 ocak : 4 masa'ya çekilecek (mevcut geniş alan rebalance).
- **Tuvalet başlangıçta YOK** → açılan salonda **parayla alınan ODA**; açılınca tuvalet kâğıdı işi + temizlikçi.
- Personel **bölge-başı** (global havuz değil): her salonun kendi garson/bulaşıkçı/temizlikçi'si.
- **Para toplama kalıcı MANUEL** (oto toplayıcı YOK; en fazla Faz 4 prestige kısmi).
- **Masa yükseltmesi:** fiyatı değil **müşteri sabrını** (+kozmetik/imaj) artırır → D-010 ile uyumlu.
**Gerekçe:** Kullanıcı kasa istemedi (akış sade kalsın); My Hotel'in "her işi önce sen yap → personele
devret → kat/zone genişlet" döngüsü 3D yürüme-tycoon'a birebir oturuyor (araştırma `docs/serving-and-automation.md` §13).
**Etki:** Faz 3 "çeşitlilik" zone/rol/oda sistemiyle yeniden çerçevelendi (doküman §11).
**GÜNCELLEME:** D-012'nin "açık-alan salon" çerçevesi **D-016 ile değiştirildi** (kat + zone ızgarası modeli).
Geçerli kalanlar: KASA YOK, bölge-başı personel, para toplama manuel, tuvalet=oda. Değişen: salon→zone+kat.

## D-016 · Zone (atomik birim) + KAT modeli; açma-sırali / yükseltme-serbest; bahşiş; tuvalet+depo (2026-06-06)
**Karar (kullanıcı onayı 2026-06-06):** D-012'yi somutlaştırır ve "açık-alan salon"u **kat+zone ızgarası** ile değiştirir.

**1. ZONE = atomik birim (her şey zone'a özel):**
- 1 ZONE = 1 ocak + 1 bulaşık + 1→4 masa (pad ile açılır) + (ops.) 1 garson + (ops.) 1 bulaşıkçı.
- **Ekonomi: 1 ocak : 4 masa, paylaşımlı DEĞİL** (1 ocak 8 masayı değil). Gerekçe: her zone birebir aynı
  throughput matematiğini (D-010) yaşar → simetrik denge; personel 1:1; B zone'u A'nın ocağı meşgul diye beklemez.
- **Başlangıç: 1 ocak (L1) + TEK masa.** Para birikince 2.→3.→4. masa pad'i (omurga, sıralı). Zone dolunca yeni zone.

**2. Tek kapı + rastgele oturma + zone'a bölünmüş servis:**
- Tek giriş kapısı; müşteri girer, herhangi boş masaya oturur (oturma havuzu GLOBAL).
- Ama **servis kaynakları zone'a bölünür** (ocağın hazır-kuyruğu, garson, bulaşıkçı). Müşteri hangi zone'un
  masasındaysa o zone'un ocağı/garsonu bakar; oyuncu hepsine bakabilir. ("Görsel birleşik, arka plan ayrı.")

**3. KAT (floor) modeli — "alan çok büyük" sorununun kök çözümü:**
- 1 kat = kompakt ızgara, **en fazla ~4 zone (2×2; ayarlanabilir 6)**. Kat dolunca **merdiven → ekran kararma → üst kat**.
- Aynı anda TEK kat görünür → kamera hep dar/kompakt çerçeveler. Üst katlar: balkon / okey salonu / nargile terası.

**4. Açma (SIRALI) vs Yükseltme (SERBEST) ayrımı — D-009'u genişletir:**
- **Açma = omurga, SIRALI, gated, tek seferde bir adım** (currentPad). Büyük yeşil disk pad.
- **Yükseltme = serbest/paralel, sıra YOK.** Açılmış her objenin (ocak, masalar, tepsi, ileride tost) kendi
  yükseltme noktası var, hepsi aynı anda erişilebilir; kullanıcı parası varsa istediğini istediği sırayla yükseltir.
- **Belirme zamanı:** yükseltme kavramı **2. masa açılınca** tanıtılır (ocak + masa yükseltmesi o an belirir);
  öncesi sadece açma öğretilir. Sonrası tamamen serbest.
- **Clutter çözümü:** yükseltme = objenin dibinde **küçük altın halka + minik rozet** (`▲L2 ₺X`); normalde soluk,
  **parası yetince altın parlar/nabız** → aksiyon alınabildiğinde dikkat çeker, yer kaplamaz. Açma(yeşil disk) ile
  yükseltme(altın halka+rozet) gözle anında ayrışır.

**5. Masa yükseltme = BAHŞİŞ + sabır:** ⚠️ **GÜNCELLEME (kullanıcı 2026-06-07): "zone-başı/toplu" → MASA-BAŞI.**
- Çay fiyatı SABİT kalır (D-010 bozulmaz). Masa seviyesi her müşteriden düşen **ek bahşiş**'i artırır:
  `bahşiş = tipBase × masaSeviyesi` (tipBase=2 → L1 +2, L2 +4...). + hafif **sabır↑** (`patiencePerLevel×seviye`).
- **MASA-BAŞI (My Hotel oda yükseltme mantığı):** HER masanın KENDİ seviyesi (`tableLevels[i]`), HER masanın
  YANINDA ayrı yükseltme noktası (`LAYOUT.tables[i].upgradeSpot`, masadan +1.2x merkeze). Toplu DEĞİL — bir masayı
  yükseltmek diğerlerini etkilemez. Bahşiş+sabır müşterinin OTURDUĞU masanın seviyesinden. Müşteri öderken para =
  çay(5) + o masanın bahşişi. (İlk uygulama yanlışlıkla zone-başı/merkez altın disk+L rozetiydi → kullanıcı reddetti.)
- **Görsel:** masanın yanında SADE küçük işaret (altın halka YOK, dünya-içi "L" yazısı YOK); parası yetince hafif
  yeşil parlar. Seviye/maliyet bilgisi HUD alt bar'ında (activeZone) gösterilir.
- **Gelecek opsiyon (Faz 4 meta):** bekleme-süresine bağlı bahşiş (zamanında servis=tam, sabır sınırına yakın=kırpık).
  Şimdilik ERTELENDİ (sabır/garson ile çakışır, çekirdek his oturmadan erken).

**6. Tuvalet + Depo = KATA özel (bulaşık zone'a özel):**
- **Bulaşık (kirli bardak yıkama) = ZONE'a özel** (bardak döngüsü o zone'un ocağının throughput'una bağlı).
- **Tuvalet + Depo = KATA özel** (paylaşımlı), 2. zone civarı parayla açılan oda. Döngü: müşteri kullanır →
  tuvalet kâğıdı biter → oyuncu DEPO'dan kâğıt alır → tuvalete takar → sonra temizlikçi devralır (My Hotel deseni).

**7. Yerleşim & his (greybox, D-013 stili):**
- Mutfak şeridi **sol-üste, duvara 0** (arkası geçilemez), sağında tost/kahve için yer ayrık; **masalar sağda**.
- **Dar başlangıç** (tek masa → boş büyük alan hissi yok), **bounds küçülür**, **collision** (ocak/bulaşık/masa katı engel).
- Şekil değişimi greybox'ta minimal (rozet + hafif boyut/renk); **tam görsel ilerleme assetlerle Faz 6**.

**8. Onboarding (ilk sefere özel):** sadece **ilk masa-açma akışı** öğretilir (hareket + "pad'e gel" işaretçisi/zoom).
Sonraki açılışlar küçük "Yeni ▲" rozetiyle geçer; tam tutorial tekrar etmez.

**9. Tuning:** garson **yavaşlatılır** (çok hızlı); müşteri gelme + sipariş/demleme temposu simulate.ts ile yeniden
dengelenir; tüm zone/kat/maliyet/bahşiş sayıları config'te tek simetrik şablona bağlanır ("sayı düzeni").

**Gerekçe:** Kullanıcı feedback'i (2026-06-06) + araştırma (My Perfect Hotel: küçük başla, mikro-görev, oda/kat
genişlet, personelle otomatikleştir; Idle Restaurant Tycoon: masa-merkezli, garson+aşçı önce). Tek-hat yatay büyüme
dünyayı uzun-ince yapıp kamerayı bozar → kompakt kat+ızgara. "Çalışan mantığını oturt, görsel sonra çözülür" → önce his.
**Etki / revize yol haritası:** Faz 2g (his/yerleşim/collision/tuning, tek zone) → 2h (masa yükseltme+bahşiş) →
2i (onboarding/işaretçi) → 3a (zone çoğaltma, kat başına 4) → 3b (kat geçişi/merdiven/kararma) → 3c (tuvalet+depo+temizlikçi) →
3d (menü: tost/kahve). Her dilim Vitest+sim+smoke yeşil. D-009 (mekânsal etkileşim) ve D-014 (opsiyonel personel pad) korunur.

## D-018 · Faz 2 cila v2: kenar-yerleşimli kesik-köşeli kart işaretler, dwell, tray kaldır, semaver=ocak L4, garson L2, sıralı reveal (2026-06-07)
**Karar (kullanıcı onayı 2026-06-07; bu oturumda KARARLAŞTI, uygulama SONRAKİ sohbette). Araştırma destekli (My Perfect Hotel
analizi + idle-tycoon UX + drei Text/troika + Roblox ProximityPrompt dwell). Bu oturumda UYGULANAN kısımlar D-017 altında işaretli;
D-018 kalan + yeni kullanıcı feedback'idir (2026-06-07 ikinci tur: "masa içinde hapsoldum [fix'lendi] + her yer pad + üstünden
geçince param gidiyor + tray gereksiz + semaver ocak seviyesi olsun + garson level + kapı paraziti + kararma").**

**1. KARGAŞA KÖK ÇÖZÜM — alan GENİŞLEMEZ, işaretler KENARA (My Perfect Hotel modeli):**
- Araştırma: MPH koridoru aslında DAR; ferahlık boş zeminden değil YERLEŞİM+SIRALI REVEAL'dan gelir; fazla boş zemin "ölü" durur.
  → Sorun placement, footprint DEĞİL. Mevcut hata: masa yükseltme noktası MERKEZE (+1.2 içeri) → dar orta koridor tıkanıyor,
  oyuncu sürekli pad üstünde.
- **Yeni yerleşim:** her masa yükseltme işareti masanın DUVAR-KENARI tarafına: sol kolon masalar (x −2.4) → işaret SOLA (x ≈ −3.7);
  sağ kolon (x +2.4) → SAĞA (x ≈ +3.7). Orta "omurga" koridor tamamen boş. Ocak yükseltme = mutfak sol-kenarı; garson/bulaşıkçı
  yükseltme = yan duvar kenarları. (Kullanıcı: "sağdakilerin sağına soldakilerin soluna.")

**2. ETKİLEŞİM — yürü+dur (dwell), tıklama YOK:** Araştırma türün tamamı stand-to-fill kullanıyor (tıklama mekânsal hissi bozar).
- **Dwell:** dolum noktasına girince dolum halkası HEMEN başlar (görsel) ama para ~**1.5 sn** sonra akmaya başlar; çıkınca sayaç
  sıfırlanır (biriken ₺ korunur). "Üstünden geçince param gidiyor" çözülür. (Roblox ProximityPrompt.HoldDuration deseni.) Transient.
- Kenara taşıma + dwell birlikte "sürekli pad üstündeyim" hissini bitirir.

**3. GÖRSEL — kesik-köşeli zemin kartı:** GroundMarker çember → **dashed/kesik-köşeli yuvarlatılmış kare kart**; içinde eylem+hedef
("3. Masa Aç"/"Masa Yükselt"), Lvl, ₺fiyat; fiyat çubuğu = dolum; **yeşil=parası yeter / gri=yetmez**. **Yazı: kart hizasında küçük
DİK-OKUNUR** (kullanıcı onayı; MPH böyle, daha net; yine alçak — havada değil). Yatık-zemin yazısına kolayca dönülebilir.

**4. SIRALI REVEAL (zincir, yakınlık-gizleme YOK):** "Al-pad → (inşa) → o nesnenin yükseltmeleri" zinciri; hepsi birden dökülmez.
Bizde: başta yalnız "2. Masa"; alınınca ocak-yükseltme + açık masaların kart-işaretleri (kenarlarda) + garson (tek opsiyonel).
İşaretler PERSİSTENT görünür (yalnız-yakında değil) ama kenara yayık + küçük → dağınık durmaz. Türetme padsDone'dan; ek persist YOK.

**5. TRAY YÜKSELTME KALDIRILIR:** "garson alan kimse kullanmaz, gereksiz." trayUpgrade config/TrayUpgradeZone/trayLevel/
trayUpgradeFill/helper/test/smoke/devHooks silinir; tepsi sabit taban (2). Persist `trayLevel` düşer → SAVE_VERSION 12→13.

**6. SEMAVER = ÇAY OCAĞI L4 (premium 💎/video), ayrı pad YOK:** Şu an ocak L1-L4 ₺ (soft max 4) + L5 elmas + AYRI samovar pad
(850₺, hız ×0.7). Yeni: ocak **L1-L3 ₺**, **L4 = Semaver = premium (💎 VEYA ödüllü video)** — semaver görseli + hız ×0.7 +
throughput sıçraması L4'te; masterLevel 4'e iner, soft max 3. `samovar` omurga pad'i kalkar (omurga: 2.→3.→4.Masa). Reklam/elmas
Faz 4/5'te → **L4 şimdilik GÖRÜNÜR-KİLİTLİ** ("Yakında 💎/video"), gerçek harcama sonra. **EKONOMİ RİSKİ:** tek ocak Faz 2'de L3
(throughput 1.35³≈2.46x) 4 masaya yetişmeli → simülatörle yeniden dengele (gerekirse outputMult yukarı; ilk-alım 84sn SABİT kalır).
SAVE 13 migrasyonunda `samovar` padsDone/padFills'ten düşürülür.

**7. GARSON L2 (yavaş L1 → hızlı L2):** Garson taban hızı düşer (**L1 = 1.4**), **L2 = 1.8** (şimdiki). Ocak/masa desenindeki gibi
garsonun yanında (yan kenar) mekânsal yükseltme kartı, garson tutulunca açılır. Yeni persist `waiterLevel` → SAVE 13'e dahil.

**8. BUG FIX:** (a) **Kapı z-fighting:** lento/çerçeve ön duvarla eş-düzlemde (z=z1) → z'de hafif öne/ayrı kalınlık. (b) **table2
açılınca kararma:** App.tsx'te Canvas çevresinde `<Suspense>` YOK → drei `<Text>` font SDF'sini suspend edip sahneyi karartıyor;
çözüm `<Suspense fallback={null}>` + `preloadFont({characters})` (kullanılan harf/₺/rakam önceden üretilir) + aynı anda az işaret.

**SAVE_VERSION 12→13 (tek migrasyon):** `trayLevel` düşer, `samovar` padsDone/padFills'ten düşer, `waiterLevel=0` eklenir; ilerleme
korunur. Her adım: Vitest + sim (84sn sabit) + smoke + gözle onay.
**UYGULAMA SIRASI (öneri):** (1) bug-fix (kapı+Suspense/preloadFont) → (2) tray kaldır → (3) kesik-köşeli kart + kenar-yerleşim +
dwell → (4) sıralı reveal zinciri → (5) semaver=L4 + ekonomi yeniden denge → (6) garson L2. (Kalan D-017 §4 gating / §5 bağımsız
taşıma / §6 kamera bu işlerle birlikte ele alınır.)
**UYGULAMA DURUMU (2026-06-07):** adım 1 (bug-fix) ✅ + adım 2 (tray kaldır) ✅ + adım 3 (sade işaret + HAREKET-temelli fill, kart REDDEDİLDİ)
✅ + adım 4 (sıralı reveal, D-019 §2/§3 ile) ✅ + adım 5 (semaver=ocak L4) ✅ + **adım 6 (GARSON L2) ✅ UYGULANDI**. Garson L2: hız seviyeli
`moveSpeedByLevel [1.8, 2.6]` (NOT: orijinal §7'deki "L1 1.4→L2 1.8" yerine **L1 1.8→L2 2.6** — 2g'de alan büyüyünce 1.4 çok yavaş
bulunmuştu, taban 1.8'de kaldı, L2 belirgin hızlanma; HER seviye oyuncudan çok yavaş → D-014 kısmi-assist korunur). Mekânsal yükseltme
noktası tutma pad'inin ARKASINDA (tutar tutmaz akmaz). `waiterLevel` persist → **SAVE_VERSION 14→15**. **TÜM D-018 BİTTİ.**

## D-019 · Kirli masa mekaniği + yükseltme yer/gating sadeleştirme + yeni-özellik bildirimi (2026-06-07; sonraki oturumda uygulanır)
**Karar (kullanıcı feedback 2026-06-07; bu oturumda KARARLAŞTI, uygulama SONRAKİ oturumda). Ana sürücü kaygı: "her şey çok yer
kaplıyor" → ekran sade kalsın.**

**1. KİRLİ MASA mekaniği (YENİ oynanış):**
- Her kirli bardak (`dish`) bırakıldığı MASAYA etiketlenir (`tableIndex`); masa-başı kirli sayısı tutulur.
- Bir masada **2'den FAZLA (3+) kirli bardak** → masa **KİRLİ** sayılır. Kirli masada:
  - üstünde **küçük ALÇAK primitive "kirli/koku" işareti** (havada UI/rozet DEĞİL; sade zemin/obje işareti — feedback_interaction_model),
  - **garson o masaya çay GÖTÜRMEZ** (teslimat hedef seçiminde kirli masa atlanır),
  - **YENİ MÜŞTERİ HİÇ OTURMAZ** (kullanıcı kararı: `findFreeTable` kirli masayı boş saymaz) → masa temizlenene (≤2) kadar.
- Oyuncu kirlileri toplayıp eşik altına indirince masa normale döner. Amaç: temizlik önceliği baskısı.

**2. Yükseltme YER + GATING (clutter azalt):**
- **Çay ocağı yükseltme noktası ÇAY-ALMA alanından AYRI** + **SOL DUVAR ile ocak arasına** konur (kullanıcı: çay alırken zorla
  yükseltme tetiklenmesin). Ocaktan >2.9 br (pickup 1.6 + PAD_RADIUS 1.3) → çakışma yok.
- **`table3`'ten `minStationLevel:1` KALKAR** → masa açmak ASLA yükseltme gerektirmez (4 masa yükseltmeden açılabilir).
- **Gating (kullanıcı bana bıraktı, "mantıklı olanı yap"; öneri):** çay ocağı yükseltmesi **2. masadan sonra** açık;
  **MASA yükseltmeleri tüm masalar (table4) açılınca**. (Kesinleştir; tek kriter: erken ekran sade.) Eski "tüm yükseltmeler 4 masadan
  sonra" katı kuralı gevşedi → çay yükseltme erken, masa yükseltme geç. Ekonomi: simülasyonla yeniden dengele, ilk-alım 84sn SABİT.

**3. Personel pad'leri SAĞ-ARKA (sağ üst) köşe:** garson + bulaşıkçı TUTMA pad'leri sağ-arka köşeye (ör. waiter ~[4.6,−1.5],
dishwasher ~[4.6,−3.2]); masa yükseltme noktalarıyla çakışmaz.

**4. YENİ-ÖZELLİK BİLDİRİMİ (onboarding):** bir özellik (garson tutma vb.) AÇILINCA oyuncuya HABER verilmeli — oraya **kamera ZOOM**
veya **"pinboard"/bildirim** tarzı işaret. (D-018 §4 sıralı reveal + onboarding ile birleşir; "Yeni" rozeti/nabız + ilk-açılış nudge.)

**Gerekçe:** Kullanıcı önizleme feedback'i (2026-06-07): yükseltmeler erken belirince ekran kalabalık+çirkin; çay alırken istemeden
yükseltme tetikleniyor; personel pad konumu; yeni özellik açıldığında fark edilmiyor. **Etki:** D-018 adım 3 rafine + adım 4 (reveal/
bildirim) bu kararla birleşir; kirli-masa yeni mekanik olarak Faz 2'ye eklenir (servis döngüsüne temizlik-baskısı katmanı).
**UYGULAMA DURUMU (2026-06-07):** madde 1 (kirli masa) ✅ + madde 2-3 (yükseltme yer/gating + L1-başlangıç) ✅ + **madde 4 (YENİ-ÖZELLİK
BİLDİRİMİ) ✅ UYGULANDI** — "kamera zoom" yerine daha güvenli/sade **HUD toast** seçildi (kullanıcı kamera sallanmasına hassas + "ekran
sade"; zoom kontrolü ele geçirir). `notice` transient + `revealSeen` baseline init'te (yeniden-yükleme spam yok, persist gerekmez). **TÜM
D-019 BİTTİ.**

## D-017 · Faz 2 cila redesign: yürüme döngüsü, küçük zemin-etiketli pad'ler, sıralı onboarding, servis kilidi, kamera sallanması (2026-06-07)
**Karar (kullanıcı onayı 2026-06-07, eklemelerle). Bu oturumda KARARLAŞTI; uygulama SONRAKİ sohbette.**

**1. Yerleşim — yürüme döngüsünü ZORLA:**
- İki etkileşim dairesi (R≈1.6) çakışmamalı: her masa↔ocak merkez mesafesi **>2R=3.2** (hedef ~5 br) → tek noktada
  "çay-al+servis" veya "kirli-al+yıka" İMKÂNSIZ. (Mevcut bug: ilk masa ocağa ~2.3 br, tek noktada her şey yapılıyor.)
- **Bulaşık ocaktan AYRILMAZ** (kullanıcı net: ayırma) → mutfak arka duvarda KÜME kalır; **masalar uzaklaşır**,
  gerekirse **alan derinliği (area minZ/maxZ) artar**. Başlangıç tek masası da uzakta.
- nav ızgarası + garson yolu + masa-yükseltme noktaları + semaver yeni yerleşime uyar. Yeni test: "hiçbir dünya noktası
  aynı anda ocak R'si + herhangi masa R'sinde değil".

**2. Pad/işaret görseli — küçük + ZEMİN etiketli:**
- Tüm etkileşim daireleri küçük (~0.5; masa-yanı yükseltme işaretleri kadar). İri disk+koni+HAVADAKİ Html rozet KALDIRILIR.
- Etiket **zeminde DÜZ yazı** (objenin üstünde havada DEĞİL — "yer kaplıyor" hissi veriyor): "3. Masayı Aç"/"Yeni Masa",
  "Yükselt", "Masa Lvl", "Garson" + maliyet. (Kullanıcı: "zeminde yazıyor gibi olsun".)
- Renk dili: **yeşil=aç (omurga) / mavi=opsiyonel (garson, bulaşıkçı) / altın=yükseltme.** Dolum halka radyal; parası yetince parlar.

**3. Sıralı reveal + onboarding (yalnız ilk oyun):**
- Hepsi-birden YOK; her işaret öncekiyle ETKİLEŞİLENE kadar gizli (az vakit farkı kabul). Pad'ler küçük olduğundan
  birlikte çıksa bile rahatsız etmez (kullanıcı: "çıksa bile şimdiki kadar büyük olmasın").
- Akış: 2.Masa → kamera **Garson'a zoom + parlama** (opsiyonel, ATLANABİLİR — D-014 korunur) → çözülünce **"3. Masayı Aç"**
  belir → Ocak yükseltme DARBOĞAZ olunca SONRA tanıtılır.
- İlk oyun sonrası kamera ele geçirmez; yeni açılış = küçük **"Yeni" rozeti + nabız**. `onboardStep` persist.

**4. Gating:** table3'ten **`minStationLevel:1` KALKAR** (sıra: 2.masa→garson→3.masa). İlk-alım 84sn sabit kalır;
sonraki kilometre taşları simulate ile yeniden doğrulanır.

**5. Servis kısıtı GEVŞER (YENİ — kullanıcı bug'ı):** "eli boşken tek tür" kısıtı (Faz 2f) deadlock yapıyor — çay hep
elde olunca kirli HİÇ toplanamıyor, masada birikiyor. Çözüm: çay ve kirli **BAĞIMSIZ** taşınabilir (ayrı kapasite/görsel);
kirli her zaman toplanabilsin. Taşma yok, derli yerleşim korunur (D-016 §7 / görsel cila feedback'i).

**6. Kamera sallanması (YENİ — kullanıcı: "map bazen yürürken sallanıyor"):** Sim deterministik & pürüzsüz (sabit
input'ta collision salınmıyor) → sorun **CameraRig** (Scene.tsx). Kök neden: `camera.position.lerp(desired, dt*4)`
**kare-hızına BAĞLI** yumuşatma + `lookAt(TAM oyuncu)` → kare süresi oynayınca kamera-oyuncu trailing mesafesi dalgalanır,
lookAt her kare tam oyuncuya nişan alınca dünya SALLANIR; ayrıca dt clamp YOK (hitch'te sıçrar) + `fit/d` her kare `size`'dan
(mobil viewport oynaması). **Çözüm (uygulama):** kare-hızı BAĞIMSIZ damping (`1-exp(-k*dt)`) konuma VE lookAt hedefine
TUTARLI uygulanır (birlikte hareket → rijit offset → sallanma yok) + dt clamp + `fit/d` yalnız gerçek resize'da.

**Gerekçe:** Kullanıcı önizleme feedback'i (2026-06-07) + araştırma (My Perfect Hotel / Idle Restaurant Tycoon: mesafe =
türün temel sürtünmesi, no-overlap >2R hedef 3–4R; sıralı reveal — bir şey öncekiyle etkileşilene dek gizli; kompakt etiket;
opsiyonel personel nudge'lanır ama bloklamaz; tam tutorial yalnız ilk oyun, sonra "Yeni" rozeti).
**Uygulama sırası (sonraki sohbet):** (1) yerleşim+mesafe+nav+"çakışma yok" testi → (2) küçük zemin-etiketli pad redesign +
renk dili → (3) sıralı reveal + ilk-oyun onboarding (zoom/parlama) + "Yeni" rozeti → (4) gating + simulate yeniden denge →
(5) servis kısıtı gevşetme (çay+kirli bağımsız) → (6) kamera damping. Her adım Vitest+sim+smoke yeşil + GÖZLE onay.
D-013 (primitive stili) / D-014 (garson opsiyonel) / D-016 §5 (masa-başı yükseltme) korunur.

## D-014 · Garson = OPSİYONEL (omurgayı kilitlemeyen) pad; personel hep böyle (2026-06-06)
**Karar:** Garson, omurga (sıralı) pad zincirine konmaz. `pads`'te `optional:true` ile işaretlenir;
table2 sonrası **alınabilir ama zorunlu değil**. Oyuncu istemezse masa açmaya devam eder ve kendi
gezerek servis eder. `currentPad` opsiyonelleri ATLAR; `availableOptionalPads` ayrı döndürür. Eş zamanlı
omurga + opsiyonel dolum için tek `padFill` sayısı **`padFills` kaydına** (pad id → ₺) çevrildi (SAVE v5).
İleride bütün personel (bulaşıkçı, temizlikçi) aynı opsiyonel-pad desenini kullanır.
**Gerekçe:** Kullanıcı isteği: "ikinci masadan sonra garson ekleme padi gelsin ama kullanıcı isterse
eklesin." Aktif-oynanış/aşırı-otomasyon-yok prensibine (garson YALNIZ kısmi assist) ve seçim özgürlüğüne uyar.
**Etki:** Personel kararları tempoyu kilitlemez; ekonomi omurgası garsondan bağımsız doğrular (sim 84sn sabit).

## D-013 · Primitive = nihai (kasıtlı) sanat stili; .glb geçişi opsiyonel (2026-06-06)
**Karar:** Greybox primitive'ler (box/cylinder/capsule + düz renk + flat/toon shading + yumuşak gölge)
placeholder değil, **kasıtlı low-poly sanat stili** kabul edilir. Cila = renk paleti + shading + juice + ışık.
Faz 6 .glb geçişi **opsiyonel/hafif** olur; Türk objeleri (semaver, ince bardak, nargile) CC0/AI ile eklenebilir ama zorunlu değil.
**Gerekçe:** My Perfect Hotel da "kodla çizilmiş" değil — Unity'de düz-gölgeli dokusuz low-poly model
kullanıyor (Asset Store'da "Perfect Hotel" template'leri). Bu görünüm bizim greybox yaklaşımımızla birebir;
asset almadan mağaza-kalitesi look mümkün. D-004'ü (greybox-first) güçlendirir.
**Etki:** Faz 6 sanat geçişi "zorunlu .glb seti" → "opsiyonel cila + seçili Türk objeleri" olur.

## D-011 · Servis sistemi: manuel çay taşıma (tepsi) + garson kısmi otomasyon (2026-06-06)
**Durum:** ✅ KARARLAŞTI (kullanıcı onayı 2026-06-06). Detay: `docs/serving-and-automation.md`.
Uygulama dilimlere bölündü: 2c (tepsi servisi+hazır-kuyruk+sabır), 2d (garson), 2e (bardak/bulaşık).
**Bağlam (kullanıcı feedback'i 2026-06-06):**
- Para toplama + yükseltmeler **oyuncuda kalsın** (mekânda yürümek çekirdek eğlence; fazla
  otomasyon olursa "yürüyecek yer kalmaz").
- Şu an garson yokken bile çay OTOMATİK servis ediliyor — bu yanlış. Oyuncu çayı kendi
  taşımalı; ama "sürekli tek tek taşımak" istenmiyor → **tepsi** (birden çok çay taşı).
- **Garson** açılınca o da taşır ama yavaş; **o ana kadarki tüm ilerlemeyi tek başına
  taşıyamamalı** → kısmi yardım, oyuncu hâlâ aktif.
**Önerilen model (özet):**
1. **Ocak ready-kuyruğu:** demlenen çaylar tezgâhta "hazır" birikir (kapasite = brewing throughput).
2. **Tepsi:** oyuncu ocaktan tepsiye N çay alır (kapasite upgradable), tek turda birçok masaya dağıtır.
3. **Sabır/bottleneck:** oturan müşterinin sabır timer'ı; zamanında servis edilmezse sessizce
   gider (çocuk-güvenli, sert ceza yok). Ready-kuyruk dolarsa brewing durur (teslimat darboğaz),
   boşsa oyuncu bekler (brewing darboğaz) → zincir SAHNEDE gerçek olur (D-010 §3.1'i tamamlar).
4. **Garson = kısmi assist:** aynı döngüyü (ocak→tepsi→masa) özerk ama yavaş/küçük tepsiyle yapar;
   tek garson büyüyen mekânı yetiştiremez → oyuncu yardım eder + parayı toplar. Ek/upgrade garson = daha çok otomasyon (gated).
5. **Para toplama kalıcı manuel** (çekirdek). Otomatik toplayıcı en fazla Faz 4'te yavaş/kısmi assist; çekirdeği değiştirmez.
**Gerekçe (araştırma):** Idle Restaurant Tycoon — otomasyon kademeli (yeterli garson yoksa
müşteri aç kalır = bottleneck baskısı); Roblox tycoon — erken manuel etkileşim/toplama, otomasyon
ilerlemeyle açılır. İki elli aktif döngü (servis ↔ toplama) 3D yürüme-tycoon'unu eğlenceli tutar.
**Çözülen sorular (kullanıcı 2026-06-06):** sabır aşımında müşteri **sessizce gider** (ceza yok);
tepsi **yükseltilebilir** (2→4→6→8); garson **bölge-başı** (global değil), 2. masa sonrası gated;
otomatik toplayıcı **YOK**; ocak hazır-kuyruğu **ocak seviyesine bağlı** (ayrı upgrade değil);
ek olarak **bardak/bulaşık döngüsü** eklenecek (bardak=ocak seviyesine bağlı) + bulaşıkçı.
**Etki:** Eski "garson çayı otomatik taşır" planının yerini alır — NPC FSM'e `waitingForTea`, ocak
hazır-kuyruğu, oyuncu/garson tepsi durumu eklenir. 2c'de bunlar transient → SAVE_VERSION değişmez.

## D-009 · Mekânsal (Roblox-tycoon) etkileşim — havada buton yok (2026-06-05)
**Karar:** Satın alma/yükseltmeler **mekânsal**: oyuncu objenin yerine gider, üstünde durur,
**ekranın altında bir bar dolar**. Pad'ler açtıkları objenin TAM yerinde durur (girişte
genel noktada değil). Havada UI butonu kullanılmaz.
**Gerekçe:** Kullanıcı çalışan oyunu görüp belirtti — yeni ocak pad'den uzakta belirince
kafa karıştı, alttaki yükseltme butonunu sevmedi. Tür beklentisi (Roblox tycoon) ile uyumlu.
**Uygulama:** LAYOUT.padPos pad'leri hedef konuma taşıdı; çay yükseltmesi `LAYOUT.upgradeZone`
noktası (ocağın önü) — tick'te doldurma + seviye artışı; HUD'da `activeZone` ile alt-orta bar.
Eski 2a UI butonu kaldırıldı. Ocak seviyesi 3D rozet + semaver büyümesi/renk ile gösterilir.
**Not:** Faz 4'te onlarca yükseltme gelirse "objeye dokun → panel" hibrit düşünülebilir;
temel akış mekânsal kalır.

## D-008 · Ekran yönü: portrait birincil, landscape destekli, kilit YOK (2026-06-05)
**Karar:** Oyun **dikey (portrait)** tasarım hedefi; ama ekran çevrilince **yatay
(landscape)** da oynanabilir. Orientation kilidi konmaz; arayüz responsive.
**Gerekçe:** Idle/tycoon mobilde tek elle dikey oynanış birincil; landscape'i de
desteklemek R3F'in otomatik resize'ı sayesinde düşük maliyetli (kamera çerçeveleme +
birkaç CSS kuralı). Kullanıcı isteği.
**Uygulama:** `CameraRig` (Scene.tsx) ekran oranına göre kamerayı çerçeveler
(aspect<1 → geri çek, fit = clamp(1/aspect,1,1.7)); `index.css`'te safe-area insets +
orientation media query'leri; smoke testinde portrait kontrolü.

## D-007 · Etik + çocuk-güvenli monetizasyon (2026-06-05)
**Karar:** İnterstitial sıklık-sınırlı + sadece doğal aralarda; rewarded hep opsiyonel;
gerçek parayla loot-box yok; reklam SDK'sı çocuğa-yönelik/sınırlı-veri modunda.
**Gerekçe:** Bu türü çocuklar oynar; mağaza aile politikaları + COPPA/GDPR-K uyumu zorunlu.
Detay: `docs/monetization.md`.

## D-030 — Para akışı: masa yanında İSTİF, toplu toplama, garsonsuz (2026-09-03)
**Karar (kullanıcı):** Yere dağınık sikke düşmez. Her masanın yanında sabit noktada **tek para istifi**
birikir; oyuncu üstünden geçince **tamamı tek seferde** cüzdana girer (tek büyük "+₺").
**Parayı YALNIZ oyuncu toplar — garson asla toplamaz.**
- Kayıp yok (ceza yok ilkesi). İstifin **görsel tavanı** var, sayaç sürer (mesh sayısı da sınırlanır).
- Oto-toplama erken oyunda KAPALI; geç oyunda "Muhasebeci" yükseltmesiyle açılır.
- Offline dönüşte bekleyen istifler Kasa Raporu ekranında topluca toplanır.
**Gerekçe:** Dağınık sikke hem görsel gürültü hem ölçülmüş FPS yükü (AFK'de 377 coin) idi; ama "gidip topu
topunu toplama" tycoon'un en tatmin edici anı ve oyunu aktif tutan fiil — otomasyona devredilemez.
**Geçersiz kılar:** D-012/D-016'nın "KASA YOK" maddesi (kasa artık pastane salonunda var ama para akışında
değil) ve eski "para sunumu dağınık kalsın" kuralı. Alternatif kaldıraç (sert tavan + bahşiş durması)
oynanış testinden sonra ONAYA sunulacak.

## D-031 — Ürün-silosu kalktı: GLOBAL MENÜ + tek sipariş çıkış penceresi (2026-09-03)
**Karar:** "Her salona bir ürün" (D-010 M3 ürün hattı) yapay bulundu — gerçek kıraathanede tost salonu/çay
salonu ayrımı yok. Artık **tek mutfak şeridi**, her masada her ürün istenebilir. Salonlar ürün değil
**karakter bölgeleri** (giriş salonu, cam kenarı, sedirli köşe vb.).
**Servis mekaniği:** sipariş = ürün listesi → kalemler ilgili istasyonun kuyruğuna → **TAMAMI hazır olunca**
mutfağın önündeki **TEK sipariş çıkış penceresinde** hazır tepsi olur → oyuncu/garson o tek noktadan alır.
Tezgâh tezgâh dolaşmak YOK, yarım sipariş taşımak YOK. İstasyonlar "gidilecek" değil "yükseltilecek" yerler.
**Performans:** bu model bugünkünden UCUZ — 3 ocak + 3 bulaşık yerine 1 çıkış + 1 bulaşık; nav ızgarası aynı,
hedef seçimi basitleşir, hedefler olay-güdümlü hesaplanır.
**Ekonomi:** gelir = **min(kapasite, üretim, servis) × ortalama sepet**. Üç kaldıraç net ayrışır ve her
birinin kendi görsel darboğaz sinyali olur. `tools/simulate.ts` bu üç kısıtlı modele göre yeniden yazılacak;
ilk alım <90 sn ve erken zincir temposu korunacak. **Denge sayıları ONAYSIZ değişmez.**
**Yerleşim kısıtı:** her oturma bölgesinin merkezi sipariş çıkışına ≤ ~10 birim (tur ~12 sn < sabır 18 sn).
**Korunan:** garson **bölge-başı** kalır (D-012); sadece ortak çıkıştan alır.

## D-032 — NARGİLE KALDIRILDI: yaş sınırı yükseltilmeyecek (2026-09-05)
**Karar (kullanıcı, net):** *"nargile olmasın, yaş sınırı yükselmesin."* Nargile/tütün oyundan tamamen
çıkarıldı. Kat 3 terası nargilesiz kurulacak.
**Gerekçe:** tütün içeriği App Store / Google Play yaş derecelendirmesini yukarı çeker (Kids kategorisi
kapanır), reklam ağlarında çocuk-güvenli/sınırlı-veri modunu ve envanter kalitesini kısıtlar.
`progress.md`'deki "yaş/reklam kararı" yayın blokerinin tütün ayağı böylece **kapandı**.
**Etkisi:** `projectBrief.md` "nargile terası" ifadesi düzeltildi. `docs/` içindeki eski nargile geçen
belgeler (assets, economy, gameDesign, floorplan-master, zone34-wc-floor2-design, serving-and-automation)
kat programı kesinleşince topluca temizlenecek. Maket v2-v5 HTML dosyaları arşivdir, dokunulmaz.
**Yerine ne gelecek:** teras nargilesiz de çekici olmalı — alternatifler araştırılıyor (semaver/çay bahçesi,
açık hava sinema, kış bahçesi/sera, canlı müzik köşesi). Seçim onay sonrası D-0xx olarak kaydedilecek.
**Korunan:** okey/tavla KALIYOR — oyun masaları kumar değil, oyun kütüphanesi/board-game café dilinde
kurulacak (bahis, kasa, jeton yok). Derecelendirme için okey/tavla ayağı ayrıca değerlendirilecek.

## D-033 — Kilitli obje tadilat hâlinde durur (2026-09-05)
**Karar:** Kilitli *alan* hiç çizilmez (zemin bile yok, sınırda net duvar). Ama açık alanın içindeki
kilitli *obje* görünür ve **tadilat hâlinde** durur: tahta perde, sarı-siyah uyarı bandı, dubalar,
arkasında iskele + moloz + kalaslar. Satın alınınca perde kalkar, bitmiş obje çıkar.
**Gerekçe:** Kullanıcı: *"lavabo en başta harabe yıkık gibi dursun, sonradan parasını vererek açılsın."*
Kilitli alanı göstermek "boş oda satın aldım" hissi verir; açık alandaki açıklanmamış boşluk ise mekânı
sahte gösterir. Tadilat hâli hem sebebi anlatır hem satın alma isteğini doğurur.
**İlk uygulama:** Kat 1 adım 3 — lavabo köşesi perdeli; adım 4'te perde kalkıyor.
`tadilatPerde()`, `duba()`, `iskele()`, `moloz()` (docs/maket/maket-v13.html).
**İki ayrı hâl var (2026-09-05 düzeltmesi):**
- **Kapalı hacim inşa ediliyorsa** (lavabo gibi bir oda) → tahta perde + uyarı bandı + dubalar,
  arkasında iskele ve moloz. Arkası görünmez, çünkü orada gerçekten bir oda kuruluyor.
- **Var olan bir yapı onarılacaksa** (merdiven gibi) → **perde YOK**, obje kendisi yıkık hâlde
  görünür durur: basamak tahtaları eksik, korkuluk kırık, üstünde moloz; önüne yalnız
  **uyarı şeridi** (iki dikme arasında sarı-siyah bant) ve dubalar konur.
  Kullanıcı: *"merdiven merdiven hâliyle yıkık dökük dursun ve önünde de şerit olsun,
  bu şekilde yeni bir oda izlenimi oluyor o da hoş değil."* Ayrıca oyuncu ilk günden
  üst kat olduğunu görmeli — perde bu bilgiyi saklıyordu.
**Fonksiyonlar:** `tadilatPerde()` `duba()` `iskele()` `moloz()` `uyariSeridi()` `merdivenHarap()`.

## D-034 — Kat 1 mobilya ızgarası (2026-09-05)
**Karar:** Kat 1'in bütün oturma grupları tek ızgarada: sütunlar x = ∓5,3 · ∓8,5 · ∓11,7 (3,2 aralık),
satırlar z = −1,1 · 5,3 · 11,7 (6,4 aralık); ortada x ∈ [−4,6, 4,6] kapı–merdiven geçidi.
Yan duvarlarla mobilya arasında ~4,5 birimlik **çevre koridoru** bırakılır; duvara yalnız servis,
tezgâh ve depo yapışır.
**Gerekçe:** Kullanıcı banket adaları için: *"çok sağ ve sol duvarlara yakın duruyolar ... alttaki 4lü
masa grubuna göre hizalamaları daha düzgün olsa."* Katı ızgara (v3) reddedilmişti, hizasız dağılım da
dağınık; ortası bu.

## D-035 — Servis bloğunun yüzü tezgâh (2026-09-05)
**Karar:** Arka-sol servis bloğunun salona bakan yüzü **tezgâh**: semaver, temiz bardak istifleri ve
hazır tepsiler müşterinin gördüğü yerde; cezve ocağı, hazırlık tezgâhı, menü tahtası ve bulaşık arkada.
Tezgâhın ortasında 2 birimlik geçit — personel ve oyuncu tepsiyi oradan alır.
**Gerekçe:** Kullanıcı *"bir kafe olsa bu katta ne olurdu"* diye sordu; planın en kafe-olmayan tarafı
servis alanının dört duvarla salona kapatılmış olmasıydı. Gerçek kafede tezgâh mekânın yüzüdür.
**Not:** Kullanıcı bunu *"her an geri aldırabilirim"* kaydıyla onayladı; kod yorum işaretleriyle
sınırlandı (`>>> ÖN TEZGÂH ... <<<`).

## D-036 — Orta şerit: banket adası + ikili masa (2026-09-05)
**Karar:** Kat 1'in orta şeridine (34 × 9,8) sırt sırta iki yüzlü **banket adası** ve **ikili masalar**
girer; tezgâhın ucunda **garson servis istasyonu** (sürahi, peçete, temiz bardak, kirli tepsi).
İki segment, aralarında kapı–merdiven geçidi.
**Gerekçe:** Katın gerçek eksiği masa sayısı değil, **masa çeşidi**ydi — 8 özdeş dörtlü masa vardı,
hiçbir kafe böyle değil; en çok eksik olan ikili masa. Duvar olmadığı için kafelerin standart çözümü
(banket adası) kullanıldı. Soba ve ocakbaşı tezgâhı önerileri kullanıcı tarafından reddedildi
(*"hiç mantıklı gelmiyor"*).
**Kat okuması:** arkada servis · ortada ikili/hızlı devir · önde dörtlü/grup.

## D-037 — Sokak cephesi vitrin, kat yüksekliği 3,2 (2026-09-05)
**Karar:** Kat 1'in sokağa bakan yüzü (z = +17) düz duvar değil **vitrin**; ve tüm duvar yüksekliği
**2,7 → 3,2** çıkarıldı (`WALL_H` sabiti; kat aralığı zaten 3,2 — `buildingBelow` bu ölçüyle çalışıyor).
Cephe dizilimi: kaide 0–0,4 · **cam 0,4–2,65** · lento · **alınlık 2,65–3,2 (tabela)** · üst kordon.
Kapı boşluğu da 2,65 — cam ile aynı hizada biter. Tente lentonun **altından** çıkar ve dış kenarı
aşağı iner; kapı **çift kanatlı camlı** (sağ kanat içeri açık).
**Gerekçe:** Kullanıcı ilk vitrin denemesi için *"güzel ama düzgün durmadı, acaba duvarları az daha
mı yükseltsek"* dedi. Teşhis: ① duvar 2,7 iken kapı boşluğu 2,9'du, kapı **duvardan taşıyordu**;
② cam bandının üstünde tabelaya yer kalmıyordu, bina alçak bir baraka gibi duruyordu; ③ tente
alınlığın üstündeydi ve tabelayı kapatıyordu, üstelik eğimi ters yöndeydi (dış kenarı yukarı
kalkıyordu); ④ kapı kanadı içi dolu ahşap kutuydu, camın arkasında tahta kalıyordu.
**Yan etki (kabul edildi):** `wall()` varsayılanı değiştiği için Kat 2 ve Kat 3'ün duvarları da 3,2
oldu; kilitli alan sınır duvarları 2,9'dan `WALL_H`'e çekildi. Üç kat da kontrol edildi, kamera
görünürlüğü bozulmadı — aksine iç mekân daha oranlı okunuyor.

## D-038 — Tek Odak Kuralı: pad, seviye ve görev tek listede (2026-09-05)
**Karar:** Pad'ler, mekânsal yükseltmeler ve işe alımlar **tek sıralı adım listesinde** birleşir
(`Step = pad | upgrade | hire`, tek `activeStepId`). Dünyadaki işaret, alt bant metni, kamera odağı
ve ekran kenarı oku — dördü de bu tek adımdan türer. Toast yalnız "az önce ne oldu" der, asla
yönlendirmez. Usta (L4) noktaları adım listesine GİRMEZ; obje L3'e ulaşınca üstünde **rozet**
belirir (işaret değil: yanıp sönmez, ok çıkarmaz, kamera çekmez).
**Gerekçe:** Kullanıcının geçmiş deneyimindeki en büyük sorun — "görev metni altta bir şey diyor,
ekran çay ocağına kayıyor". Kök sebep kodda doğrulandı: `visiblePads` pad'leri göreve göre
filtreliyor ama `optional:true` pad'ler ve `upgradeFills`/`tableUpgradeFills` bu filtrenin
TAMAMEN dışında çiziliyor. Tek liste olunca çakışma engellenmez, **mümkün olmaz**.

## D-039 — L1-L3 para, L4 "Usta" reklam/elmas, kritik yol DIŞI (2026-09-05)
**Karar:** Her yükseltilebilir objede L1-L3 parayla alınır; **L4 = "Usta"** yalnız ödüllü reklam
veya 15 💎 ile açılır ve **kritik yolun dışındadır** — Kat 1 her şey L1-L3'teyken bitirilebilir.
Usta **masa başına** uygulanır (20 masa = 20 hedef, `Usta masalar 7/20` sayacıyla).
Reklam hazır değilse **pad yine görünür**, yalnız buton pasifleşir; elmas butonu hep açık.
**Gerekçe:** Kullanıcı "4. seviye parayla alınamasın, şart olsun" dedi. Sert kapı üç riski
taşıyordu: reklam dolum oranı %70-95 → envanter kuruyunca oyuncu KALICI tıkanır; "Reklamları
Kaldır" alan oyuncu içerikten kilitlenir; proje kuralı "ödüllü ilerleme için zorunlu değil"
ihlal edilir. Kritik yol dışına alınca üçü birden çözülür ve kullanıcının asıl istediği
("para L4'e harcanamasın") korunur.

## D-040 — "Reklamları Kaldır" IAP elmas geliri satar (2026-09-05)
**Karar:** IAP interstitial'ları kaldırır **+ kalıcı günde 10 💎** verir. Ödüllü videolara
dokunmaz (isteyen izler).
**Gerekçe:** IAP'nin L4'ü parayla satması tasarımın mantığını yıkardı. Elmas satmak aynı yere
varır, çelişki yaratmaz, oyuncu tek reklam izlemez. Sonuç: reklamsız ~2,5 günde 1 Usta ·
IAP sahibi ~1,5 günde · reklam izleyen günde 3-5.

## D-041 — Zemin/duvar DOKUSU kullanılmaz; çözüm geometri + ışık + temas gölgesi (2026-09-05)
**Karar:** Tileable doku yolu kapalı. Sıra: ışık (hemisphere + fog + ACESFilmic) → instanced
temas gölgesi → `CheckerTiles`'ın genellenmiş `plank`/`tile` geometrisi (tahta başına ±%4 renk
sapması, derz = boşluk) → duvar bitim çıtaları → KayKit Restaurant + City Builder Bits.
**Gerekçe:** Bu yol ZATEN DENENDİ: `d08c445` canvas-tile parke getirdi, `d29b7d9` geri aldı
("zemin iğrenç oldu"). Başarısızlık sebebi ölçüldü: 128px doku yüksek repeat ile moiré ·
sert yüksek kontrastlı derz · tahta başına varyasyon yok · kamera zemine yakın-tepeden bakıyor.
**Asıl teşhis:** `dama` salonu `parke` salonundan daha bitmiş duruyor ve **ikisi de düz renk** —
fark dokuda değil **ölçek referansında**. Ayrıca kod Lambert değil `meshStandardMaterial`
kullanıyor (153 yer), `flatShading` hiç yok.

## D-042 — Asset yolu: KayKit CC0 + 5 Türk objesi; AI ücretsiz planları YASAK (2026-09-05)
**Karar:** Mobilya/mutfak/sokak → KayKit (Restaurant Bits + City Builder Bits, CC0, atıfsız,
GitHub'da .gltf). KayKit'te olmayan beş Türk objesi: **semaver (makette zaten var, taşınacak)**,
ince belli çay bardağı, cezve, yuvarlak tepsi, okey ıstakası → Blender'da elle.
**AI 3B kullanılacaksa yalnız ücretli plan:** Meshy Pro veya Tripo Professional.
**Gerekçe/yasak:** Meshy ücretsiz plan çıktısı **CC BY 4.0 — atıf zorunlu**, sonradan Pro'ya
geçmek geriye dönük düzeltmiyor. Tripo ücretsiz plan **ticari kullanım yok**. Hunyuan3D tabanlı
araçlar (Spline AI dahil) lisansen çıktının **AB ve İngiltere'de kullanılmasını yasaklıyor**.
Mağaza görselleri AI ile üretilmeyecek (Play'de beyan zorunlu + "AI" etiketi).

## D-043 — Tost tezgâh seviyesiyle gelir; ürün makinesi zaten kurulu (2026-09-05)
**Karar:** Tost, ALANLA değil **tezgâh L3** ile açılır. İlk iki alan yalnız çay. Tezgâh merdiveni
altı seviye + Usta: L1 servis bloğu/tezgâh yüzü · L2 cezve ocağı + hazırlık · **L3 tost sacı +
davlumbaz → TOST** · L4 hazırlık adası + menü · L5 ikinci semaver + raf · L6 fırın + kiler.
Masalar 3 seviye + Usta, tezgâh 6 seviye + Usta.
**Üst katlar aynı kalıpla:** Kat 2 servis köşesi → üçüncü ürün (Türk kahvesi önerildi),
Kat 3 teras ocağı → sahlep/ayran (mevsim çarpanına kanca).
**Kod gerçeği (doğrulandı):** `PRODUCTS` tablosu, tost'un tam tanımı (25₺/11sn/tabak/sabır ×1,6/
yükseltme ×20), ayrı kap döngüsü, ayrı "Tostçu Garson", yemek alanı masa yerleşimi ve zemin teması
— hepsi ÇALIŞIYOR. Ürünü bölgeye bağlayan tek şey `zoneProduct(z)`; 12 çağrı noktası ondan geçiyor.
Ayrıca bu merdiven maket v6'da zaten onaylanmıştı ("mutfak beş kademede yerinde büyür").

## D-044 — Kritik yol 5-7 saat; tekrarlı yükseltmeler kritik yol DIŞI (2026-09-05)
**Karar:** "Kat tamam" = 7 mekanik yenilik + 4 alan + tezgâh L3 (tost) + lavabo + servis istasyonu
+ iki banket L1 → **5-7 saat**. Banket L2/L3, 20 masanın kalan seviyeleri ve tezgâh L4-L6
**isteğe bağlı derinlik** (+6-10 sa). Usta katmanı açık uçlu.
**Gerekçe (piyasa kıyaslaması):** ① Tür başarıyı saatle değil retention'la ölçüyor — rakipler için
geliştirici teyitli "ilk bölüm = X saat" verisi YOK; olanlar dakika (ilk oturum) veya gün (prestige)
cinsinden. ② AdVenture Capitalist gibi saf idle oyunlar bile eğriyi 1.-2. günde sıfırlıyor; bizde
v1.0'da prestige yok → 10-12 saatlik doğrusal kuyruğun sonunda düşecek döngü de yok.
③ 7 yenilik ÷ 6 saat ≈ 50 dk'da bir; 12 saate yayılsa 100+ dk'da bir olurdu.
**Sonuç:** içerik kısalmıyor, "bitti" tanımı düzeliyor. Uzatma ×6 değil **×3,5**.
**Asıl başarı ölçütü:** D1 ≥ %40 · D7 ≥ %10 · oturum 8-12 dk (arcade-idle üst 20: D1 %48-52,
D7 %7-13, oturum ~10 dk). Kat 2'nin eğrisi tahminle değil BU veriyle ayarlanacak.

## D-045 — GPT-6 Astra: disipline göre bölme yok, tek ekranda A/B (2026-09-05)
**Karar:** Görsel iş GPT'ye topluca devredilmez. §9 arayüz şartnamesi tek ekrana indirilir, aynı
şartname iki tarafa verilir, ekran görüntüleri karşılaştırılır. `store.ts`/`economy.config.ts`/
`save.ts`/testler **bölünmez** (çok dosyalı mimari + kayıt migrasyonu + denge zinciri).
**Kanıt:** WebDev Arena Astra 1797 · Claude Fable 5.1 1762 → 35 puan (~%51-52), gerçek ama küçük.
Design Arena'da (saf estetik) Astra henüz yok → "görsel olarak daha iyi" doğrudan ölçülmemiş.
Astra'nın ölçülmüş 3B gücü Blender/geometri (%95,9 vs %84,3), react-three-fiber'da kod yazarak
ışık/materyal kurmada karşılaştırma yok. Codex CLI çok dosyalı refactor'da zayıf işaretleniyor.
Fiyat Astra 10$/50$ vs Opus 5 5$/25$ → iki katı.
**Not:** Farkın bir kısmı model farkı olmayabilir — oyun HUD'unda `impeccable`/`frontend-design`
yetenekleri hiç kullanılmadı.

## D-046 — Global garson havuzu + sipariş tabanlı servis (2026-09-06)
**Karar:** Garsonlar bölgeye ve ürüne bağlı olmaktan çıkar. Tek **global havuz**; "Çay Garsonu /
Tostçu Garson" ayrımı ve `waiters[z]`/`waiters2[z]` bölge dizileri kalkar, tepsi/hız yükseltmeleri
tek hatta birleşir.
**Sipariş nesnesi:** masa tek ürün değil **sipariş** verir — `{ çay:1, tost:2 }`. Tezgâh kalemleri
ayrı ayrı üretir, garson **siparişin tamamı hazır olunca** alır; yarım servis yok.
**Beş kural:** ① havuz global ② **üstlenme (claim) bağlayıcı** — siparişi üstlenen garson teslim
edene kadar başka masaya servis yapmaz, yanından geçtiği masaya elindekini BIRAKMAZ ③ öncelik
"en yakın" değil **"en acil"** — kalan sabır + bekleme yaşlandırması, böylece tezgâha uzak masalar
**starvation** çekmez ④ **sabır sipariş boyuna bağlı** — taban + Σ(kalem hazırlık süresi) × pay
(bugünkü ürün-başı `patienceMult` bunun kaba hâli) ⑤ **garson sayısı türetilir** — ideal ≈ talep ÷
garson debisi; eksikse kuyruk uzar ve HUD "garsonlar yetişemiyor" der.
**Tepsi ilişkisi:** tepsi N kalem taşıyorsa garson tek turda toplam N kalemlik sipariş paketler →
tepsi yükseltmesi "kaç masa tek turda" sorusuna dönüşür.
**Gerekçe:** Kullanıcı bildirdi — tek katta tek tezgâh olunca ürün/alan bazlı garson ayrımının
karşılığı kalmadı; ayrıca "garson yakınından geçtiği masaya elindekini bırakmamalı" ve
"hiçbir masa starvation çekmemeli" şartları var.
**Doğrulama:** Faz C'de simülatöre sipariş kuyruğu + üstlenme + starvation ölçümü eklenir;
**"hiçbir masa X saniyeden fazla beklemedi"** iddiası TESTE yazılır. Bugün bu davranışların
hiçbiri test edilmiyor.

## D-047 — Servis noktası tek merdiven: ocak L1-L3, tezgâh L4-L6 (2026-09-06)
**Karar:** Çay ocağı ve tezgâh ayrı objeler değil, **aynı servis noktasının** iki kimliği.
Seviye sıfırlanmaz: **L1-L3 Çay Ocağı** (adım 1-2 dönemi) · **L4 → TEZGÂH'a dönüşür** (servis
bloğu kurulur, ocak yerini bırakır) · **L5 TOST AÇILIR** (tost sacı + davlumbaz) · **L6** son ₺
seviyesi (hazırlık adası + menü + fırın/kiler) · **Usta (L7)** 💎/reklam.
**Gerekçe:** Kullanıcı "çay ocağı kaç seviye olacak sana bıraktım" dedi. Altı ₺ seviyesi + Usta,
mevcut `costsByLevel` [20,30,45,67,150,300] ve `masterLevel 7` ile **birebir örtüşüyor → şema
değişmiyor**. Tost'un alanla değil seviyeyle gelmesi (D-043) bu merdivende L5'e oturuyor.

## D-048 — GPT-6 Astra kullanımı: zorunlu değil, karar ertelendi (2026-09-06)
**Karar:** Astra 6 kullanmak zorunlu değil; katkı sağlarsa kullanılır. Kullanıcı kararı **arayüz
A/B çıktısını gördükten sonra** verecek. Önce Claude (Opus 5 / Fable 5.1) en iyi hâliyle denenecek —
kullanıcı: *"belki de çok uğraşmamışımdır dedin, çok uğraştığın halini de merak ediyorum"*.
**Not:** O denemede asset'ler de elde olacak (KayKit + ikon seti), yani karşılaştırma boş
şablonla değil gerçek malzemeyle yapılacak.

## D-049 — Kritik yol 5-7 saat ONAYLANDI (2026-09-06)
**Karar:** v1.0 Kat 1'in "bitti" suresi **5-7 saat aktif oynanis**. Tekrarli yukseltmeler kritik
yolun DISINDA (+6-10 sa istege bagli derinlik), Usta katmani acik uclu. Uzatma x3,5 (x6 degil).
**Gerekce:** Kullanici onayladi. Zincirin butun fiyatlari bu sayidan turer; degisirse plan §5'teki
kaldirac agirliklari yeniden hesaplanir.
**Basari olcutu saat degil retention:** D1 >= %40 · D7 >= %10 · oturum 8-12 dk. (D-044'un onayi.)

## D-050 — Kat 2 urunu ERTELENDI (2026-09-06)
**Karar:** Kat 2'nin urunu (Turk kahvesi / pizza) v1.0 kapsaminda karara baglanmiyor.
Kat 2 zaten v1.2 isi. Karar Kat 1 yayinlandiktan sonra verilecek.
**Etki:** `zoneProduct(z)` soyutlamasi (D-043) urun eklemeyi tek noktaya indirdigi icin bu
erteleme v1.0 mimarisini bloklamiyor. Kat 1 zinciri cay + tost ikilisiyle kapali.

## D-051 — Arayuz: once tam guclu tek deneme, A/B sonra (2026-09-06)
**Karar:** Astra ile es zamanli A/B YOK. Once ben (Claude) tam gucumle, **gercek asset'lerle**
bir arayuz tasarimi yapacagim; kullanici kontrol edecek; **gerekirse** Astra sonra olculecek.
**Kullanici sozu:** *"once senin tum gucunle bir tasarim yapmani istiyorum ... bahsettigimiz
assetleri de indirip cekerek hareket etmeni isticem, ardindan kontrol edicem, astrayi da
gerekirse olcucem."*
**Sart:** Tasarim bos sablonla degil gercek malzemeyle yapilir — KayKit paketleri indirildi
(restaurant-bits + city-builder-bits, CC0), font zaten yerel (Baloo 2 + Lilita One, OFL).
Emoji ve CSS ikon YASAK (plan §9 zorunlu kurali) — gercek SVG ikon seti cizilir.
**Sira notu:** Bu is Faz E'nin tasarim adimi ama STATIK MOCKUP olarak one alindi; maket 3B icin
ne ise, bu dosya arayuz icin odur. Faz G-D boyunca elde hedef gorsel bulunur. `src/` beklemez.

## D-052 — Interstitial sikligi 2 dakika (2026-09-06)
**Karar:** Interstitial araligi **120 sn**, ustune uc kisit: (a) ilk oturumun ilk **5 dakikasi
muaf** (onboarding korunur), (b) yalnizca dogal aralar — adim/gorev tamamlanmasi, panel kapanisi;
**eylem ortasinda asla**, (c) gunluk tavan. Odullu reklam bu sayacin disinda.
**Gerekce:** Kullanici *"3 ile 2 arasindayim, 90 saniye cok erken gibi, ideali sec sen"* dedi.
90 sn (My Perfect Hotel) erken terk riskini artiriyor; 180 sn gelirden feragat. 120 sn + muafiyet
penceresi ikisinin ortasi. **Config'ten tek satir** — retention verisine gore ayarlanacak.

## D-053 — Sahnenin "duzlugunu" cozen sey isik RENGI degil GUNES ACISI (2026-09-06, Faz G0)
**Karar:** Yonlu isik `[6,12,6]` (~55 derece) yerine **`[9,9,7]` (~40 derece)**. Dolgu isigi
`ambientLight 0.6` yerine `hemisphereLight` (gok `#ffe9c8` / yer `#6b5a4a`) **0.35**; yonlu isik
krem `#fff2d8` **1.6**; sis `#1f2933` 34->72; `toneMappingExposure` 1.05. Butun sayilar
`src/config/palette.ts` icindeki **`LIGHTING`** blogunda (renk koda gomulmez kurali).

**Gerekce (olcumle bulundu, plandan gelmedi):** Plan G0'i "hemisphere + fog + ACESFilmic" diye
tarif ediyordu. Uygulaninca iki sey cikti:
1. **ACESFilmic zaten acikti** — @react-three/fiber v9 `gl.toneMapping`'i varsayilan olarak
   ACESFilmic yapiyor (`flat` prop'u verilmedigi surece; kutuphane kaynaginda dogrulandi).
   O maddede yapilacak tek is `toneMappingExposure` idi.
2. **Yalniz hemi/sun siddetini oynatmak sahneyi HIC degistirmedi.** Uc ayar turu (0.42/1.25 ·
   0.58/1.25 · 0.40/1.45) ayni kameradan cekilip yan yana konunca hicbiri "once"den ayirt
   edilemiyordu. Sahneye gecici 3x3 test kutusu eklenince sebep gorundu: **golge haritasi
   calisiyordu**, ama gunes ~55 derece dik oldugu icin golge objenin ALTINDA kaliyor ve tepeden
   bakan kamera onu hic gormuyordu. Aci 40 dereceye inince her masa, tabure ve musteri zemine
   **oturdu** — G1'in (temas golgesi) cozecegi "yuzme" hissinin yarisi bedelsiz kapandi.

**Reddedilen:** `[9,8,7]` (~35 derece) — golgeler dramatiklesiyor ama telefonda oynanisi orten
uzun lekeler yapiyor. `[9,9,7]` bilincli orta yol.

**Yan etki:** Alcalan gunes golgeleri uzattigi icin eski golge kamerasi (-12/24/12/-20) sag-ust
kosede kirpiyordu -> **-13/28/15/-15**. 1024 haritada ~25 teksel/birim (eskisi 28).

**Maliyet:** draw-call 91->91, sis ~0,04 ms/kare (olculdu). Isik bedava; bu yuzden G0 plandaki
en yuksek etki/caba orani.

**Kalici ders:** Bu sahnede gorsel bir iddia **ayni kameradan A/B ekran goruntusuyle** olculur
(oyuncuyu `__teleport` ile sabitle, `camZoomOut` ac, `git stash` ile once/sonra cek). "Daha iyi
oldu" demeden once iki kareyi yan yana koy. Ayrica headless tarayicida `__perf().fps` arka plan
rAF kisitlamasi yuzunden anlamsiz (1 gosterir) — kare suresi dogrudan `gl.render` dongusuyle olculur.

**Detay:** `docs/gorsel/README.md` · kanit `docs/gorsel/ss/g0-*.png`.

## D-054 — SAHNEDE GOLGE YOK (2026-09-06, Faz G1)

**Karar:** Kiraathanede **hicbir golge cizilmez** — ne yonlu golge haritasi, ne zemine yatik
temas lekesi. My Hotel'in duz gorunumu. `<Canvas shadows>` ve directional `castShadow`
KALDIRILDI; mesh'lerdeki `castShadow`/`receiveShadow` bayraklari duruyor (bedelsiz, geri
acmak iki satir).

### Kullanicinin sozleri (uc turda netlesti)
1. rev1 (obje basina temas lekesi + o anki sert golge): *"bu kotu duruyo her seyin altinda bi
   yuvarlak var"*.
2. *"hem golge hem de alttaki yuvarlak kotu duruyo AYNI ANDA... zink diye keskin cizgi gibi
   duruyo... bak mesela myhotelde hic golge yok bu da dusunulebilir benlik sorun yok"*.
3. Dort varyant gosterildikten sonra: *"vazgectim hic golge olmasin kotu duruyor komple kaldir"*.

### Olculen dort varyant (AYNI kare, 412x915)

| | Varyant | Kare suresi | Sonuc |
|---|---|---|---|
| A | Sert yonlu golge (eski hal) | 1,31 ms | kenar merdiveni ("zink") |
| **B** | **Hic golge yok** | **0,67 ms** | **SECILDI** |
| C | Yumusak yonlu golge (VSM, radius 7) | ~1,5 ms | kenar yumusak ama isik siziyor, lekeli, EN PAHALI |
| D | Golge yok + masa basina tek soluk havuz | 0,74 ms | once secildi, sonra vazgecildi |

Ekran goruntuleri: `docs/gorsel/ss/g1-var-A..D-*.png`, son hal `g1-son-golgesiz.png`.

### Yan kazanc — performans
Golge haritasi tek basina kare suresinin **yarisini** yiyordu.
- Telefon kadraji (412x915, 3 salon dolu): **1,31 -> 0,56 ms** (%57 hizli).
- PC (1920x1080): **2,02 -> 1,44 ms** (%29 hizli).
Bu, kullanicinin bildirdigi *"PC'de tam ekran hayvan gibi kasiyo"* sorununun en buyuk tek parcasi.

### Sert kenarin sebebi (olculdu)
1024'luk golge haritasi ~30 birimlik alana (ortografik −13/28/15/−15) yayiliyordu, ~25
teksel/birim. Bu cozunurlukte kenar merdiven merdiven cikiyor. Cozum cozunurluk artirmak
olabilirdi ama zaten en pahali gecti (C) ve gorsel olarak da istenmedi.

### Bir daha "objeler yuzuyor" denirse
Blob shadow ONERME (uc turda reddedildi). Sirayla: (1) **G2 zemin geometrisi** — zeminde olcek
referansi olunca bu his buyuk olcude kapanir, (2) hemisphere/directional dengesiyle yuzey
ayrimi, (3) en son care olarak golge haritasi (bedeli yukarida yazili).

### Kalan sadelesme
`LAYOUT.decor` — dekor konumlari (cop kovalari, saksilar) JSX'ten tek listeye cikti; golge
denemesi icin yapilmisti ama bagimsiz bir iyilestirme oldugundan kaldi.

### Kalici ders
**Olcumun "hedefini tutturdu" demesi, kullanicinin begenecegi anlamina gelmiyor.** rev1 A/B
olcumunde hedefini tutturmustu ve reddedildi. Gorsel adimda dogru yontem: birden fazla varyanti
AYNI kareden cekip yan yana koymak ve sormak — tek bir "sonra" goruntusu karar icin yetmez.
(Gorunmeyen bir seyi teshis etmek icin abartma numarasi ayrica gecerli: `ss/g1-teshis-kirmizi.png`.)

**Detay + arsiv:** `docs/gorsel/README.md` §G1.

---

## D-055 — PERFORMANS: HER-KARE-DEGISEN DURUM REACT'E GIRMEZ (2026-09-06)

**Karar:** Oyun durumunun her karede degisen kismi (konum, NPC/coin/kap listeleri) **React'e
girmez**; useFrame icinde `getState()` ile okunur ve dogrudan three nesnesine yazilir. Ayrica
`tick()`'in `set()` yuku, icerigi degismemis degerleri **eski referansina** cevirerek yazilir
(`keepIdentity`).

**Neden.** Kullanici *"PC'de tam ekran hayvan gibi kasiyo"* dedi. Uc ayri metrikle olculdu
(render gonderme · tick · React commit) ve suclu ucuncusuydu: **kare basina 3,23 React commit**.
`tick()` her karede diziyi/nesneyi kopyalayip tek `set()` ile yaziyordu → icerik ayni olsa bile
referans degisiyor, Zustand secicisi "degisti" saniyor, abone bilesen her kare render oluyordu.
12 anahtar (`tableLevels` `stationLevels` `stats` `quest` `dishes` `upgradeFills` …) karelerin
**%100'unde SADECE kimlik** degistiriyordu — masa seviyeleri hic degismedigi halde 12 masa her
kare yeniden render ediliyordu.

**Sonuc:** commit/kare **3,23 → 0,23** · rAF kare suresi **10,24 → 6,05 ms** · `tick()`
**0,268 → 0,058 ms**. Saf cizim maliyeti (1,35 ms) ve draw call (190) DEGISMEDI — sorun orada degildi.

**Ortak kanca:** `components/three/actorTransform.ts` → `useActorTransform(outerRef, ref, read)`.
Eski `useFacing` bunun icine girdi (yalniz yon donduruyordu, konum hala prop'tu).

**Cozunurluk tavani (ayni kararin ikinci yarisi):** `AdaptiveResolution` piksel butcesi **2,3 M**.
`dpr={[1,2]}` telefonda dogru ama PC'de tam ekran + Windows ekran olceklemesi (%125-150) arka
tamponu 2,25 kata cikariyordu. Kucuk tuvalde (telefon, UI onizlemeleri) hicbir sey degismez;
**dpr 1'in ALTINA inmez** — bulaniklik gorsel bir karardir, olcum karari degil.

**Olcum uyarisi (kalici):** `gl.render` dongusu **GPU'yu olcmez** (JS, GPU isi bitmeden doner) —
dpr'yi 4 katina cikarinca bu sayi kipirdamiyor. GPU tarafi ancak gercek makinede gorulur.

**Detay:** `docs/fps-bulgulari-2026-09-06.md`.

---

## D-056 — ZEMIN DESENI DOKU DEGIL GEOMETRI (G2, 2026-09-06)

**Karar:** Zemin deseni (parke tahtasi, fayans karosu) **geometriyle** cizilir: her tahta/karo
ayri bir quad, alan basina tek InstancedMesh. Doku (texture) yolu **kapali** (D-041).

**Neden.** Planin teshisi: *"dama temali salon parke temalidan daha bitmis duruyor — ve ikisi de
duz renk. Fark dokuda degil, OLCEK REFERANSINDA."* D-054 ile golge de kalktigi icin olcek
referansinin tek kaynagi zemin geometrisi kaldi. Doku denemesi (d08c445 → d29b7d9) moire, sert
derz cizgileri ve tahta basina varyasyon olmamasi yuzunden geri alinmisti.

**Iki kural:**
1. **Derz cizgi DEGIL bosluk** — quad hucresinden `gap` kadar kucuk cizilir, aradan alttaki koyu
   `theme.grout` gorunur. Cizgi ince geometride aliasing yapar, bosluk yapmaz.
2. **Tahta basina ±%4 ton sapmasi** (karoda ±%2), konuma bagli ve KARARLI. Tekrar deseninin gozle
   sayilabilmesini engeller — doku denemesinin basarisizlik sebeplerinden biri buydu.

**Olculer:** plank 2,20 × 0,55 (uzun kenar X'te, satir basi yarim tahta kaydirma) · tile 0,70
(`yemek` iri karo 1,05) · `dama` 1,30 satranc **bilerek degismedi** (zaten olcek veriyordu).

**Tek kaynak:** `floorQuads()` saf fonksiyon (6 birim testi); sahne ve **magaza onizlemesi** ayni
bileseni cizer — magazada gordugun tahta olcusu salonda gorecegin. `CheckerPatch` kopyasi silindi.

**drei `<Instances>` KULLANILMADI:** kaynakta dogrulandi ki matrisleri HER KARE yeniden hesaplayip
buffer'i yeniden yukluyor (`frames = Infinity`); zemin ise hic kipirdamiyor → matrisler mount'ta
bir kez yazilan ham `instancedMesh`.

**Detay + A/B goruntu:** `docs/gorsel/README.md` §G2 · `ss/g2-oncesi.png` ↔ `ss/g2-sonrasi.png`.

---

## D-057 — TARAYICIDA DURUM DEGISTIRIRKEN `window.__setState` KULLAN (2026-09-06)

**Karar:** Playwright/konsoldan oyun durumu degistirilecekse **uygulamanin kendi kancasi**
(`window.__setState`, `__advanceTime`, `__teleport`…) kullanilir. `await import('/src/game/store.ts')`
ile alinan `useGame` **yanilticidir**.

**Neden.** Vite HMR bir modulu guncelleyince uygulama artik `/src/game/store.ts?t=1788…` ornegini
kullaniyor; parametresiz dinamik import ESKI ornegi getiriyor → farkli bir Zustand store'u.
Ondan yapilan `setState` calisiyormus gibi gorunuyor (`getState()` yeni degeri donduruyor) ama
sahne hic degismiyor. G2'de "tema degismiyor" sanilarak yarim saat kaybedildi; sahnedeki instance
sayilari sayilinca ortaya cikti.

---

## D-059 — B1 UYGULAMA KARARLARI: dort kavramin kodda nasil durdugu (2026-09-06)

B1'de `ZONE` tek index'i ALAN / SERVIS / MASA / ODA olarak ayrildi (D-058'in 1. adimi).
Uygulama sirasinda verilen kararlar:

1. **Dort kavram TEK dosyada: `src/game/world.ts`.** `economy.config.ts` yalniz SAYI tutar
   (data), `layout.ts` yalniz KOORDINAT, `world.ts` MODEL. `derivedFromPads` config'ten cikip
   `deriveWorld` olarak buraya tasindi. Bagimlilik yonu: config → world → layout → tick/store.

2. **Servis ↔ alan bagi tek sabit liste: `SERVICE_AREAS = [0, 1, 2]`.** "Servis index'i = alan
   index'i" varsayimi koda dagilmasin diye. B2 bu listeyi `[0]` yapacak; `serviceInArea()` her
   alan icin 0 dondurecek ve **cagiranlarin hicbiri degismeyecek**. B1'in asil kazanci budur.

3. **Pad efekti ALANDA durur, personel etkisi o alanin SERVISINE gider.** `PadDef.zone → .area`
   (pad'in fiziksel yeri); `hireWaiter`/`hireDishwasher` efektleri `serviceInArea(pad.area)` ile
   servise cevrilir. Ayri bir `PadDef.service` alani ACILMADI — pad mekansal bir nesnedir,
   hangi servise dokundugu alanindan turetilir.

4. **Masa artik SAYAC degil LISTE.** `world.tables[i] = {index, areaIndex, serviceIndex}`.
   `areaOfTable(i)` ile `serviceOfTable(i)` iki AYRI sorudur (bugun ayni cevap, B2'de ayrisir).
   Bitisik-index degismezi yorumda degil, turetmenin kendisinde duruyor.

5. **Pad ve gorev KIMLIKLERI B1'de DEGISMEDI** (`zone2`, `z2table2`, `q_zone2` …). Gerekce:
   parmak izi `padsDone`'u dokumluyor; kimlik degisirse birebir karsilastirma imkansizlasirdi.
   Zincir zaten B2/B3'te yeniden yazilacak — iki degisikligi ayni ada koymanin faydasi yok.

6. **Fingerprint'in CIKTI ANAHTARLARI sozlesme sayildi.** Ic alan adi degisse de
   (`zonesOpen → areasOpen`) cikti anahtari sabit kaldi → `diff` literal olarak bos cikabiliyor.
   Olcum araci ile olculen sey ayri tutuldu.

7. **Yalan adlar duzeltildi**, en onemlisi `activeZone → activeSpot`: bu alan bolge DEGIL,
   "oyuncunun uzerinde durup doldurdugu nokta" demekti — kavram karisikligini buyuten adlardan biriydi.
   Ayrica `upgradeZones → stationUpgradeSpots`, `teasServedByZone → teasServedByArea`,
   `waiterServedByZone → waiterServedByService`, `floor/wallThemeByZone → *ByArea`,
   quest hedefinde `stationLevel.zone → .service` ve `serveTea/tablesAtLevel .zone → .area`.

**Olculdu:** tick parmak izi (2014 satir) BIREBIR ayni — taban, HEAD'in worktree'sinde ayni
(duzeltilmis) araccla yeniden alindi. `simulate.ts` denge sayilari da birebir ayni.
`save.ts` 751 → 188 satir (migrasyon silindi). Test 206 → 207. smoke 26/26.

**Olcum aracinin kendi hatasi (kayda gecti):** fingerprint `{...s.stats}` sig kopya yaptigi icin
`teasServedBy*` dizisi TUM anlik goruntulerde paylasilmisti; dort karenin dordu de son degeri
gosteriyordu. Yani ilk alinan taban dosyasi sessizce yanlisti. Ders: refactor guvencesi,
olcum aracinin da dogrulanmasini gerektirir.


## D-058 — FAZ B GECIS HARITASI: DORT KARAR (2026-09-06)

Faz A kapandiktan sonra, Faz B'nin ilk isi olarak **maket v13'un alti adimi ile bugunku pad
zinciri esleştirildi**. Rapor: `docs/faz-b-harita.html` (artifact:
https://claude.ai/code/artifact/114662f8-0d0e-4a4d-ba03-1e84cd17e81c).

**Haritanin bulgusu:** ilk uc maket adimi bugunku zincirin uzerinde duruyor; son uc adim
(lavabo · merdiven · orta serit) kodda hic karsiligi olmayan iki yeni kavram istiyor: **ODA** ve
**banket**. Celiski pad'lerde degil modelde — `zone2` bugun "yeni salon + YENI OCAK + yeni bulasik"
demek, makette 2. Alan'in ocagi YOK; `zone3` ise masa getirmiyor, **servis noktasini tezgaha
donusturuyor** (tost bolgeden degil L5'ten gelir).

**Olcum:** kod tabaninda `zone` gecen **1090 satir** (248'i `tests/logic.test.ts`'te).
Bugunku zemin 21,2 × 20,6 (437 birim²) → maket 34 × 34 (1156 birim², **×2,6**); masa 12 → 20;
servis noktasi 3 → 1 + 1 aktarma.

**ESKI NOTUN DUZELTMESI:** `activeContext`'te Faz B'nin ilk isi "mutfak disari cikma hangi pad"
diye yaziliydi — **bu soru gecersiz**. "Mutfak binanin disina tasan ek hacim" **v11'in** karariydi,
**v13 iptal etti**; servis blogu arka bandin sol ucunda, kat icinde. Karsiligi olan adim
**3. Alan**'dir ve o adim ayni anda hem arka yariyi acar hem ocagi tezgaha cevirir.

### Kullanicinin verdigi dort karar

1. **Siparis nesnesi Faz C'de.** Faz B yalniz YAPIYI kurar: tek servis noktasi + global garson
   havuzu. Masa `{cay:1, tost:2}` siparisi, garsonun siparisi ustlenmesi (claim) ve "en acil once"
   onceligi Faz C'ye kalir — bunlar simulator ve tempo tablosuyla birlikte dogrulanir.
2. **Merdiven satin alinamaz, ama sessiz durmaz.** Yikik kalir; oyuncu ustune basinca
   **"Kat 2 cok yakinda"** der. (Kullanicinin kendi ifadesi: *"su anlik sadece kat 2 cok yakinda
   desin oraya basinca"*.) Pad degil, ama olu dekor da degil.
3. **Kayit v31 = TEMIZ SIFIRLAMA, migrasyon YOK.** Yalniz ayarlar (ses · muzik · FPS) korunur.
   Eski kayit `padsDone: ['table2','zone2','z3table4'…]` gibi yeni zincirde karsiligi olmayan
   kimlikler tasiyor; artik var olmayan bir zincir icin migrasyon yazilmaz.
   **CLAUDE.md'nin "ilerleme kaybolmaz" kurali v1.0 magazaya ciktigi andan itibaren baglayici
   olur** — bugun ortada tek bir test kaydi var. Bu karar Faz B'yi belirgin olcude kisaltti.
4. **B3'un yerlesimi kadraj onayi alinmadan yazilmaz.** Kat 2,6 katina cikiyor; portre ekranda ne
   gorundugu tasarim karari. B3'e baslarken uc kamera kademesi AYNI KAREDEN cekilip kullaniciya
   sunulur (G1/G3'te bir tur geri alma tasarruf eden yontem).

### Faz B'nin bes adimi (sira gerekcesiyle)

**Once model degisir ama icerik sabit kalir** (davranis birebir olculebilir), **sonra icerik
degisir** (artik parmak izi degil tempo olculur). Tersi yapilirsa iki degisiklik birbirinin
arkasina saklanir.

- **B1** Model donusumu, icerik SABIT: `ZONE` → `ALAN / SERVIS / MASA / ODA`; masa listesi turetilir;
  servis noktasi alandan ayrilir. Icerik hala 3 alan × 4 masa → **tick parmak izi birebir ayni
  olmali**. Kayit v31 (temiz sifirlama) burada.
- **B2** Servis tekilleşir: 3 ocak → 1 servis noktasi (L1-L3 cay ocagi, L4 tezgah, L5 tost, L6 son
  ₺ seviyesi); urun seviyeden gelir; garson havuzu global ("Tostcu Garson" ayrimi kalkar).
  **Davranis burada degisir** — guvence parmak izi degil tempo olcumu.
- **B3** Yerlesim maket olcegine (`layout.ts` tek dosya): 34 × 34, dort alan, arka bant
  (servis blogu · merdiven · lavabo, ucu de z = −9,8 hizasinda), orta serit. **Kadraj olcumu burada.**
- **B4** Odalar: lavabo (pasif carpan, kendi seviyeleri) + yikik merdiven ("Kat 2 cok yakinda").
- **B5** Masa tipleri: dortlu (8) · ikili (12) · banket (2 ada; **seviyesi boyudur**, her seviye
  iki ikili masa dogurur, dis uc sabit, var olan masalar yer degistirmez).

**Bitti sayilir:** maketin gezilebilir bes adimi sirayla aciliyor + yikik merdiven konusuyor ·
`npm run test` yesil, test sayisi dusmeden (bugun 206) · smoke 26/26 · build temiz ·
v31 sifirlamasi testli · **B1 sonunda tick parmak izi birebir ayni**.

## D-060 — B2: SERVİS TEKİLLEŞTİ (üç ocak → bir tezgâh; ürün seviyeden; personel havuzu) (2026-09-06)

**Bağlam:** B1 modeli ayırmıştı (ALAN · SERVİS · MASA · ODA) ama içerik sabitti: 3 alan = 3 servis,
ürün bölgenin özelliğiydi (`SERVICE_PRODUCTS = ['tea','tea','tost']`), personel alan başınaydı.
Maket v13 tek katta TEK servis anlatıyor; 2. Alan'ın ocağı yok, 3. Alan yeni ocak değil var olanın
**tezgâha dönüşmesi**, tost ise bir salonun değil **L5'in** ürünü.

**Kararlar (kullanıcı onaylı, 2026-09-06):**
1. **`SERVICE_AREAS = [0]`** — kat tek noktadan döner. `serviceInArea()` yerleşim sorusu olarak kaldı
   (yalnız 1. alanda servis DURUR); `serviceOfTable()` üretim sorusu olarak sabit 0 döner. B1'in bu
   iki soruyu ayırması B2'yi tek satırlık bir bağ değişikliğine indirdi.
2. **Ürün seviyeden gelir:** L1-L3 çay ocağı · **L4 TEZGÂH** (obje yer değiştirmez, seviye
   sıfırlanmaz — yalnız kimlik değişir) · **L5 TOST açılır** · L6 son ₺ basamağı.
   Talep: müşteri otururken ürününü SEÇER, tost payı `tostShareByLevel` (L5 %25, L6 %35).
   Sipariş nesnesi `{çay:1, tost:2}` **Faz C'de** (D-058 karar 1) — B2 yalnız talebin doğduğu yeri kurar.
3. **Personel havuzu GLOBAL: 3 garson + 1 bulaşıkçı** (kullanıcı seçimi). Alan-başı personel pad'leri
   (`z2waiter` `z2dishwasher` `z3waiter` `z3dishwasher` `z2waiter2` `z3waiter2`) zincirden çıktı;
   "Tostçu Garson" ayrımı ve ayrı tepsi/hız eğrileri tek hatta birleşti. Bulaşıkçı plan §4'ün
   14. adımına (Bölüm 2) taşındı → Bölüm 1 dört adımda biter, otomasyon 12 dakikadan önce gelir.
4. **Tezgâh merdiveni kendi ağırlığını taşır.** Eski `costsByLevel` üst basamakları 150/300'dü çünkü
   tost AYRI bir servisin ×20 çarpanıyla geliyordu; aynı merdivene binince 300₺'lik bir tost
   ortaya çıktı. Yeni eğri **20/30/45/800/2400/9000** — L1-L3 erken oyun DOKUNULMADI (plan §5
   kaldıraç 2: "erken oyuna dokunulmaz"), üst yarı geç oyunun ana para emicisi oldu.
5. **Bardak havuzu ALANLA ölçeklenir** (servisle değil): `unlockArea` etkisi zaten `poolBase`
   ekliyordu; servis tekilleşince "açık servis başına taban" okuması havuzu sessizce tutarsız
   bırakıyordu. `totalCupPool(areasOpen, …)`.

**Simülatörün düzeltilmesi (bu adımın ikinci bulgusu):** eski `trySpend` "her an en ucuz darboğaz
ocağı al" diyordu; oyun ise ekranda TEK aktif görev gösterip oyuncuyu ona yönlendiriyor. Ocak ucuzken
fark küçüktü, tezgâh/tost pahalılaşınca **hangi sırayla alındığı tempoyu belirleyen şeyin kendisi**
oldu. Sim artık görev hattını takip ediyor ve personel/masa yükseltmelerini de GERÇEKTEN satın alıyor
(eskiden bedava sayılıyorlardı). Tempo iddiası ancak bu düzeltmeden sonra anlam taşıyor.

**Ölçüm (simulate.ts, Normal profil 0,55 — plan §5 hedef bantları):**
| Kilometre taşı | Hedef | Ölçülen |
|---|---|---|
| İlk alım | ≤ 60 sn | 40 sn ✓ |
| Garson | 8-12 dk | 11,1 dk ✓ |
| 2. Alan | 25-35 dk | 34,6 dk ✓ |
| Bulaşıkçı | 45-60 dk | 60 dk ✓ |
| 3. Alan + Tezgâh | 1,5-2 sa | 1,83 / 1,99 sa ✓ |
| Tost (L5) | 2-2,5 sa | 2,55 sa ≈ |

"Kat tamam" 2,69 sa — plan §5'in 5-7 saati B3'ün 20 masası + B5 banketleri + Faz C eğrisiyle gelecek.
Olmayan içeriği pahalılıkla taklit etmek grind üretirdi; yapılmadı.

**Doğrulama:** vitest **209/209** (B1: 207 — düşmedi), smoke **26/26**, build temiz, `tsc -b` temiz,
eslint 15 (B1 ile aynı). Tarayıcı: 12 masa + 2 garson + bulaşıkçı + L5 tezgâh canlı, konsol temiz.

---
## D-061 — B3-1 KADRAJ: TABAN 8,5 · HUD DUGMESI B ↔ C (2026-09-06 gece)

**Baglam:** D-058 karar 4 baglayiciydi — kat 21,2×20,6 → 34×34 (alan ×2,6) buyurken portre
ekranda ne gorunecegi muhendislik degil TASARIM karari; uc kamera kademesi AYNI kareden
cekilip onaylanmadan `layout.ts` yazilmayacakti.

**Arac:** `docs/gorsel/kadraj-b3.html` — maket v13'un kutlesi uzerinde oyunun KENDI kamera
formulu (`Scene.tsx`: fov 50°, 45° egim, `taban × min(1,3, 1/en-boy)`), uc canli portre cerceve
+ kat plani ustunde olculmus gorus alanlari + surukle-birak oyuncu.
Artifact: https://claude.ai/code/artifact/6a9edb37-cb90-4312-968b-f8d9e63ad814

**Olcumun bulgusu (kararin cercevesini degistirdi):** portrede kadraj DERIN ama DAR — dikey
gorus acisi 50°, yatay ise en-boy orani yuzunden yalniz **24°**. Kamera geri cekildikce
kazanilan sey agirlikla derinlik; genislik cok yavas buyur. Bir 17×17'lik alani tek kareye
sigdirmak icin tabanin **~22** olmasi gerekir, o mesafede karakter birkac piksel kalir.
Yani soru "katin tamami gorunsun mu" degil — **katin tamami hicbir kademede gorunmuyor**;
karar oyuncunun cevresinde kac birimlik KOMSULUK okunacagi.

| Kademe | taban | oyuncu hizasinda en | ayak izi (yakin→uzak) | derinlik |
|---|---|---|---|---|
| A (eski) | 6 | 4,6 birim | 3,3 → 10,0 | 21,2 |
| **B** | **8,5** | **6,5 birim** | 4,6 → 13,7 | 28,8 |
| **C** | **11,5** | **8,9 birim** | 6,3 → 18,1 | 38,1 |

**Kullanicinin karari:** *"hani sagda altta bir buton vardi ya kucuk buyuk moda gecen orada b ve
c olsun en yakini cok kotu. default b veya c basinca da b c arasi gecis yapilir"*
- **Taban 6 (A) ELENDI.** 34×34'te surekli koridor hissi veriyor, komsu ada kadraja hic girmiyor.
- **Varsayilan B (8,5)**; HUD'daki genel-bakis dugmesi artik "genel bakis" degil **kademe
  degistirici**: `camZoomOut` carpani **×1.45 → ×1.35** (8,5 × 1,35 ≈ 11,5 = C kademesi).
- Uygulama iki sayi: `Scene.tsx` `st.current.d = 8.5 * fit` ve `zoomMul = 1.35`.
  `fit` clamp'i (1,3) ve odak zoom'u (×0,72) degismedi.

**Not:** taban buyudugu icin BUGUNKU 21×21 katta oyun gecici olarak fazla uzak gorunur —
kadraj 34×34 icin secildi, ayni alt adimda (B3-1) yerlesim de o olcege tasiniyor.

## D-062 — B3-1: KAT 34 × 34 · SERVİS 3. ALAN'DA ARKA BANDA TAŞINIR (2026-09-07)

**Bağlam:** D-061'de kadraj onaylandıktan sonra yerleşim maket v13 ölçeğine taşındı:
**21,2 × 20,6 → 34 × 34** (alan ×2,6). İÇERİK büyümedi (12 masa · tek servis · aynı pad zinciri) —
büyüyen katın kendisi. Orta şerit + dolgu B3-2'nin, odalar B4'ün, masa tipleri B5'in işi.

### Kullanıcının kararı: servis TAŞINIR (v13'e sadık)
Maket v13'ün 1-2. adımında çay ocağı ilk salonun SOL DUVARINDA durur; 3. adımda arka bandın servis
bloğuna taşınır ("bütün servis buradan verilir"). Üç seçenek sunuldu (taşınır · baştan bantta ·
hiç taşınmaz); kullanıcı **taşınır**'ı seçti. Sonucu: servis koordinatları artık SABİT DEĞİL,
`servicePlace(areasOpen)` ile gelir. Seviye korunur — D-060'ın "obje yer değiştirmez" kuralı
SEVİYE merdiveni içindir (L4 tezgâh dönüşümü yerinde olur); buradaki taşınma alan açılışının kendisidir.

### Modelde kalkan iki varsayım
1. **Alanlar artık EŞ DEĞİL.** Tek alan şablonunun (10,6 × 10,3) 2×2 ızgarada aynalanması
   (`AREA_DX/AREA_DZ/mir/areaCol/areaRow/areaAt`) kalktı: iki ön çeyrek 17 × 17, arka yarı 34 × 9,8.
   Alanlar açık dikdörtgen listesi (`AREA_RECTS`); duvarlar ızgara sorgusundan değil geometriden
   türer (**`wallSpans(alan, kenar, açık)`**) — bir kenarı BİRDEN ÇOK komşu kapatabilir (arka yarının
   ön kenarını iki ön çeyrek birlikte kapatır), eski `areaAt(col±1,row)` bunu anlatamıyordu.
2. **`SERVICE_AREAS` world'den kalktı.** "Servis hangi alanda duruyor" bir KOORDİNAT sorusu olduğu
   ortaya çıktı → layout'a taşındı (`serviceInArea(area, areasOpen)`); world yalnız ÜRETİM sorusuna
   bakar (`serviceOfTable` hep 0). `Service.areaIndex` alanı da kalktı.

### Yerleşim (maket v13)
- Zemin x, z ∈ [−17, 17]. **Arka bant** z ∈ [−16,9, −9,8]: servis bloğu (x −17…−4,6) · merdiven
  (−4,6…4,6) · lavabo (4,6…17). Bant YÜRÜNMEZ kütledir; içi B4'te açılır.
- Alanlar: a0 ön-sol 17×17 · a1 ön-sağ 17×17 · a2 arka yarı 34 × 9,8 (bandın önü).
- Masalar: ön çeyreklerde 2×2 küme (merkez ∓8,5 / 8,5, aralık 3,2); arka yarıda tek sıra z = −5,6.
- Kapı x = −8,5'te SABİT kalır (v13'ün kapıyı ortaya kaydırması cephe işi → B3-2).

### Ölçümler
- **Denge DEĞİŞMEDİ:** `simulate.ts` altı kilometre taşının altısı da B2 ile birebir aynı
  (ilk alım 40 sn · garson 11,1 dk · 2. Alan 34,6 dk · bulaşıkçı 60 dk · 3. Alan 1,83 sa ·
  tezgâh 1,99 sa · tost 2,55 sa).
- **Yürüme maliyeti ARTTI (geometrik gerçek):** garsonun pickup → masa düz-çizgi ortalaması
  1 alan 6,06 → 7,02 (**+16%**) · 2 alan 9,77 → 15,33 (**+57%**) · 3 alan 11,47 → 19,00 (**+66%**);
  en uzak masa 17,8 → 29,1 br.
- **Ama servis SONUCU değişmedi:** tohumlu 5 koşuluk sonda (oyuncu parkta, yalnız garsonlar,
  bardak havuzu nötr) eski ve yeni yerleşim BİREBİR aynı çıktı verdi — 1 alan 79,6 servis / 24,0
  kaçış, 3 alan 105,6 / 144,0. Yani darboğaz yürüme DEĞİL. Gerçek tempo doğrulaması oyuncu
  döngüdeyken Faz C'nin işi; uzak masaların yolunu kısaltan **garson servis istasyonu** zaten
  maket v13'te var (B3-2).

### Bu adımın bulduğu GERÇEK kusur (eski koddan geliyordu)
`REACH_TABLE` (garsonun masaya teslim mesafesi) nav ızgarasının hücre boyuna **gizliden bağlıydı**:
BFS masanın footprint'ini `tableHalf + actorRadius` kadar şişirir, üstüne hücre yuvarlaması biner.
Eski 1,03 bu payı taşımıyordu; masa koordinatı ızgara merkezine denk gelirse en yakın BOŞ hücre
1,1 br'ye kayıyor, BFS "yol yok" diyor ve `navStep` düz-çizgi yedeğine düşüyordu — **garson masaya
varıyor ama engelden kaçmadan.** Kusur eski yerleşimde de vardı, masa koordinatları şans eseri
ızgaraya denk düşmediği için görünmüyordu. 34 × 34'te arka sıra tam hücre merkezine oturunca ortaya
çıktı. Çözüm: `REACH_TABLE = tableHalf + actorRadius + NAV_CELL + 0,05` (1,03 → 1,13; garson masa
kenarına 0,53 yerine 0,63 br kalıyor). `tests/layout-b31.test.ts`'teki ROTA testi kalıcı bekçi.

### Bu adımın kalıcı dersi
**Ölçüm gürültüsü bulguyu TERS ÇEVİREBİLİR.** Tohumsuz koşulan ilk sonda aynı kod iki kez
54 ve 105 servis verdi; ilk sayı "34 × 34 servisi kırdı (%77 kaçış)" gibi okunuyordu. Tohumlanınca
sonuç eski yerleşimle birebir aynı çıktı. Üstelik sondanın İLK sürümü yanlış şeyi ölçüyordu:
oyuncu parkta hiç bulaşık yıkamadığı için bardak havuzu bitiyor ve ölçülen şey yürüme değil
BARDAK oluyordu. B1: aracın çıktısı yanılabilir · B2: aracın varsayımı yanılabilir ·
**B3-1: aracın gürültüsü ve neyi ölçtüğü yanılabilir.**

**Doğrulama:** vitest **222/222** (209 + yeni `tests/layout-b31.test.ts` 13), smoke **26/26**,
build temiz, `tsc -b` temiz, eslint 15 (B2 ile aynı), `simulate.ts` birebir aynı.

## D-063 — PLAN DÜZELTMESİ: MAKETİN SANAT KATMANI TAHTADAN DÜŞMÜŞ (2026-09-07)

**Nasıl çıktı:** B3-1 bitince kullanıcı ekrana bakıp sordu — *"bu direk maketteki hal değil ki
zemini duvarları yerleşimi tasarımı falan direk ora gibi yapsana... bu geçici tasarım mı yoksa
tüm maketi geçirdin mi?"* Cevap: **maketin yalnız İSKELETİ geçmişti** (ölçü, alan sınırları, bant
hizası, masa küme merkezleri, servisin taşınması). Sanat katmanının hiçbiri geçmedi.
Sayıyla: maket v13'te **107 obje/yardımcı fonksiyon**, oyunda **16 dosya**.

**Kayıtta bulunan:** bu iş plansız değildi — `plan-kat1-yayin.html`'de Faz G altı adımdı
(G0 ışık · G1 gölge · G2 zemin · G3 duvar bitimi · **G4 KayKit Restaurant Bits** ·
**G5 KayKit City Builder Bits**) ve `progress.md` şunu yazmıştı: *"Yerleşime BAĞLI olan G4/G5
zaten Faz B'ye ertelendi"*. Faz A kapanışı da Faz B'nin işlerini sayarken 4. madde olarak
"G4/G5 KayKit" yazmıştı.

**Hata iki yerdeydi:**
1. **D-058'in B haritası (B1…B5) G4/G5'i içermiyor** — harita çıkarılırken düştü, sonraki hiçbir
   adım onu geri koymadı (B3'ü ikiye bölerken de fark edilmedi).
2. **Pano yalan söylüyordu:** Faz G satırı `4/4 bitti` ve açıklaması *"…duvar bitimi · KayKit
   yerleşimi"*. KayKit yerleşimi HİÇ yapılmadı; paketler indirildi (144 + 41 model, CC0 doğrulandı),
   entegrasyon yok.

**Kullanıcının kararı: "önce yapı, sonra sanat."** Yeni sıra:
**B3-2** (orta şerit + banket adaları) → **B5** (masa tipleri, 12 → 20 masa) → **B4** (odalar)
→ **B6a/B6b** (sanat katmanı, alan alan).

**Sıra gerekçesi:** propleri/kilimleri bugünkü 4 masanın etrafına dizersek B5 masaları taşıyınca
hepsi yeniden dizilir — planın kendi cümlesi: *"yanlış sırada yapılan iş iki kez yazılır."*
Ayrıca kullanıcının asıl şikâyeti olan **boşluk bir prop sorunu değil DOLULUK sorunu**: 1. alan
109 → 289 birim²'ye çıktı ama hâlâ 4 masa var (birim başına **2,6× seyrek**). Onu kapatan şey
şerit + banket + 20 masa, yani yapı.

**Kat ölçüsü:** kullanıcı 34 × 34'ü "aşırı büyük" buldu ama **kalsın** dedi — boşluk dolulukla
çözülecek (maket v13'ün onaylı ölçüsü; 20 masa + banket + propler onun için tasarlandı).

**Bütçe etkisi:** Faz B 6 → **8 oturum** (B6 iki oturum), toplam 66 → **68**. Bu iş zaten vardı,
tahtada görünmüyordu; sayıyı şişiren şey yeni iş değil, düzeltilen defter.

**Ders:** *tahtanın "bitti" dediği şey gerçekten bitmemiş olabilir.* Faz G kapanırken G4/G5
bilerek ertelenmişti ama pano satırı buna göre güncellenmedi; erteleme bir sonraki fazın
haritasına da yazılmayınca iş iki belge arasındaki boşluğa düştü. **Bir adım ertelenirken
nereye ertelendiği hedef fazın adım listesine YAZILMALI** — "sonra yaparız" bir yer değildir.

---

## D-064 — B3-2: ORTA ŞERİT · BANKET ADALARI · KAPI ORTAYA (2026-09-07 gece)

**Bağlam:** B3-1 katı 34 × 34 yaptı ama arka yarının önü (34 × 9,8) boş kaldı — maket v13'ün 6.
adımı orayı **sırt sırta banket adalarıyla** dolduruyor. Bu adım o yapıyı kurar; propler/cephe
süsü B6'nın.

### 1. Kesme çizgisi: yapı bu adımda, masa sayısı B5'te
Kayıtta iki satır çelişiyordu — `activeContext` handoff'u "B3-2 = iki ada + **12 ikili masa** +
servis istasyonu", D-063 sıra satırı ise "B3-2 (şerit+banket) → **B5 (12 → 20 masa)**". İkisi aynı
anda doğru olamaz: maketteki 12 ikili masa, masayı 8 + 12 = 20'ye çıkaran şeyin ta kendisi.
Kullanıcıya soruldu, cevap: *"makette 2 banket 8 masa var, oradaki gibi olsun… ilk açılıştan
bahsediyorsan mantıklı olan ne ise o olsun."*
**Karar:** BİTMİŞ HÂL maket (2 ada · 12 ikili masa); bu adımda **masa 12'de kalır** (a2'nin dört
slotu banket birimi olur), denge dokunulmaz, B5'in 12 → 20 defteri aynen durur.

### 2. Ada TAM BOY doğar; büyüyen şey MASA sayısıdır (B5'in stub'ına düzeltme)
B5'in taslağı "ada seviyesi BOYUDUR, dış uç sabit, ada içeri uzar" diyordu. Önce öyle yapıldı:
tek sütunluk ada = 1,2 × 2,5. **Ekranda bank gibi değil DOLAP gibi duruyor** (derinliği boyundan
büyük, üstelik sırtlık + başlıkla 1,38 yüksek). Ekran görüntüsüyle görüldü ve karar değişti:
adalar maketin ölçüsünde (**boy 7,6 · merkez x = ∓8,5**) doğar, seviye adanın üstündeki **birim
sayısını** artırır. Gerekçe mekânsal: bank mekânın sabit donanımıdır, kafede uzayan şey bank değil
bankın önüne dizilen masa sayısıdır. B5'in asıl sözü (**var olan masalar yer değiştirmez**) aynen
duruyor — `banketUnit(u)` u büyüdükçe yalnız YENİ birim üretir, eskiler sabit sütunlarında kalır.
Yan kazanç: şerit AÇILDIĞI ANDA mobilyalı görünür (kullanıcının boşluk şikâyetine doğrudan cevap).

### 3. Adanın COLLISION derinliği görselin üçte biri (0,8 · görsel 2,5) — zorunluluk, tercih değil
Adayı görsel derinliğiyle katı yapmak **bank koltuğunu yol bulmaya kapatıyor**: masanın şişirilmiş
ayak izi (±0,78) ile adanın şişirilmiş kenarı üst üste biniyor, aradaki koltuğa BFS'in girebileceği
tek bir boş hücre kalmıyor → `navStep` sessizce **düz-çizgi yedeğine** düşüyor. Bu B3-1'in bulduğu
`REACH_TABLE` kusurunun birebir aynısı, bu yüzden hemen tanındı. `BANKET.coreHalf = 0,4` (sırtlık
çekirdeği) masa ile ada arasında bir hücrelik servis boşluğu bırakır; garson banket masasına oradan
yanaşır. Bedeli: oyuncu oturak minderinin dış yarısına basabilir — sandalyelerin zaten collision'ı
yok (D-016 deseni), **adanın içinden geçilememesi** asıl kural ve o duruyor. Karar teste bağlandı:
`layout-b32.test.ts` her koltuğa GERÇEK rota arar + canlı oyunda müşteriyi banka oturtur.

### 4. Şerit maketten 0,85 br geri (BANKET.z = −3,8; makette −2,95)
Maket kâğıt üstünde doğru ama iki oyun nesnesini taşımıyor: şeridin **iki yüzü** ve her yüzün
**yükseltme noktası**. −2,95'te güney sandalyesi tam z = 0'a, yani a2 ile ön çeyreklerin dikişine
düşüyor; güney yükseltme noktası alanın dışına taşıyordu. −3,8 iki yüzü de kendi alanının içinde
tutar ve kuzey koridoruna tezgâh yüzünden 0,45 br pay bırakır. **Birim geometrisi maketle birebir**
(bank 0,74 · masa 1,85 · sandalye 2,95); değişen yalnız şeridin ekseni ve oyuna özgü koridor ofseti.

### 5. Masa artık kendi koltuklarını taşır (B5'in tohumu)
`seats` global `CHAIR_SPOTS`ten türüyordu (her masa dört yanı tabure). Banket birimi **iki** koltuk
taşır ve biri **banktır** (ayrı tabure çizilmez, ada zaten orada). `TableSpot.seats/kinds` +
`seatOffsets/seatKinds` geldi; `Tables.tsx` (hem instancing hem greybox) tabureleri masanın kendi
listesinden çizer → "görsel sandalye = oturulabilir koltuk" (Y2) korunur.
Yanında **gerçek bir açık kapandı**: `tableSeats(level)` seviyeden 4'e kadar çıkıyor ama banketin
iki yeri var — kelepçesiz kalsa spawn "boş koltuğu var" deyip hedefler, kimseyi yerleştiremez ve
sayacı harcardı. `seatsAtTable(i, level) = min(tableSeats(level), koltuk sayısı)` iki çağıranda da
kullanılıyor.

### 6. Garson servis istasyonu: YALNIZ obje + collision (kullanıcı seçimi)
Maket "tezgâhın sağ ucunda" bir aktarma tezgâhı koyuyor (sürahi · peçetelik · temiz bardak · kirli
tepsi). Oyunda ana tezgâh x ∈ [−14,6, −11,4], bulaşık x ∈ [−8,4, −6,4]; aradaki 3,0 br açıklığa
2,6 br'lik istasyon oturdu (x = −9,9). **Garson tepsisini hâlâ ana tezgâhtan alır** — aktarma
mekaniği oyun davranışını değiştirir ve kendi tempo ölçümünü ister, bu adım yapı adımıdır.

### 7. Kapı 2. Alan açılınca cephenin ortasına kayar (maket v13 adım 2)
`LAYOUT.entrances/streets` dizileri kalktı (alan başına ayrı kapı zaten yoktu, üç girdi de aynıydı);
yerine `doorX/entranceAt/streetAt(areasOpen)` — servisin taşınmasıyla aynı desen: **kapı da bir
koordinat sorusu**. `doorX(1) = −8,5 · doorX(2+) = 0`.
**Test gerçek bir kusur yakaladı:** duvar kapı boşluğunu "kapı bu parçanın İÇİNDE mi" diye kesiyordu;
x = 0'a kayınca kapı tam iki ön duvar parçasının DİKİŞİNE düşüyor, ikisi de "hayır" diyor ve
**kapının önüne duvar örülüyordu**. Kesme artık çıkarma ile yapılıyor (parça ∖ kapı aralığı).

### 8. Yerleşimden kopmuş hayalet objeler temizlendi
B3-1 kat ölçüsünü değiştirince bunlar sahipsiz kalmıştı ve tam B3-2'nin şeridinin üstünde
duruyorlardı: **DEPO + TUVALET kutuları** (eski 2×2 ızgaranın "rezerv arsa"sına aitti; z ≈ −1,6'ya,
yani KİLİTLİ a2'nin ortasına düşüyorlardı — D-057'ye de aykırı) → `ReservedRooms` kaldırıldı,
gerçek karşılıkları B4'te bandın içinde gelecek. **TV** (3,6 / −5,1) ve **duvar saati** (−1,6 / −5,18)
havada asılıydı (dayandıkları arka duvar kalkmıştı) → maketin dediği yere, **sol duvara** taşındı.
Duvar programının gerisi (askı rayı · konsol · gazetelik) B6a'nın.

**Ölçüldü:** `simulate.ts` altı kilometre taşı da B2/B3-1 ile **birebir aynı** (ilk alım 40 sn ·
garson 11,1 dk · 2. Alan 34,6 dk · bulaşıkçı 1,00 sa · 3. Alan 1,83 sa · tezgâh 1,99 sa ·
tost 2,55 sa) — denge dokunulmadı. Yürüme: tezgâhtan masaya ortalama BFS yolu **19,6 br**, en uzak
**30,4 br** (B3-1'de 29,1); şeridin sol adası tezgâha çok yakın (5,1 ve 1,3 br), sağ adası uzak
(25,9 / 24,4) — şerit yürüme yükünü hem artırıyor hem hafifletiyor.

**Doğrulama:** vitest **242/242** (222 + `layout-b32.test.ts` 20) · smoke 26/26 · build temiz ·
`tsc -b` temiz · eslint 19 (HEAD ile aynı — B3-1 notundaki "15" yanlışmış, gerçek taban 19) ·
tarayıcıda beş kare çekildi (`docs/gorsel/ss/b32-*.png`), konsol temiz.

**Ders:** *bir ölçünün doğruluğu, onu doğuran maketin taşımadığı nesneyle sınanır.* Maket v13
banket birimini kâğıtta doğru kuruyor ama maket ne **yol bulma ızgarası** ne de **yükseltme noktası**
taşıyor. Şerit maketin koordinatına birebir konsa iki şey sessizce kırılacaktı: bank koltuğu
erişilemez olacak (BFS değil düz çizgi) ve güney yükseltme noktası alan dışına düşecekti. İkisi de
ekranda GÖRÜNMEZ — biri test, biri ekran görüntüsü yakaladı. **Makete sadakat koordinat kopyalamak
değil, maketin ANLATTIĞI şeyi oyunun kendi kısıtlarıyla kurmaktır.**
