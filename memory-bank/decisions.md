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
