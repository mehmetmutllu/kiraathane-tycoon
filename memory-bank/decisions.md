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

## D-065 — B5a: masa TİPİ bir alan özelliği, koltuk sayısı tipin merdiveni (2026-09-07)

**Bağlam.** B5 kat masasını 12 → 20'ye çıkarıyor ama alanlar eşit büyümüyor: ön çeyrekler 4'er
dörtlü masada kalıyor, orta şerit 12 banket ikilisi alıyor. İki eski varsayım aynı anda kırıldı.

**Karar 1 — alan başına masa slotu bir TABLO, sabit değil.** `TABLES_PER_AREA = 4` kalktı;
`TABLE_SLOTS_PER_AREA = [4, 4, 12]` ve prefix toplamı `AREA_TABLE_START = [0, 4, 8, 20]` geldi.
`i / 4` aritmetiği (world · rules · config · DevSandbox) sınır sorgusuna döndü. Gerekçe: B3-1'de
alanların KENDİSİ eş olmaktan çıkmıştı, masa sayısı ise hâlâ tek sabite bağlıydı — formül artık
yanlış cevap veriyordu (12. masa a2'nin 5. slotu, "3. alan" değil).

**Karar 2 — koltuk merdiveni masanın TİPİNE ait.** `seatsByLevel` tek listeden ikiye ayrıldı:
`four` 1/2/2/**4**/4 · `deuce` 1/2/2/**2**/2. Banket ikilisinin dört kişilik hâli YOKTUR (sırtında
ada, karşısında tek sandalye). Tip alanın PLANINDAN gelir (`TABLE_KIND_PER_AREA`), koltukların YERİ
layout'tan; bir test ikisini bağlar (`seats.length === SEATS_OF_KIND[kind]`). B3-2'nin `seatsAtTable`
kelepçesi doğru cevabı tesadüfen veriyordu (min(4, 2) = 2); artık cevabı merdiven verir, kelepçe
yerleşim ile config'in ayrışmasına karşı savunma olarak kalır.

**Karar 3 — L3 basamağı iki tipte de TEK değişim, ama farklı geometri.** Dörtlü masa kare büyür
(`table_medium`), ikili bistroya döner (`table_medium_long`: banka paralel uzar, derinliği azalır).
Alternatif "ikili L3'te de büyüsün" reddedildi: dört sandalyelik tabla taşıyan iki kişilik masa
oyuncuya yalan söyler. Eşleme `tableLook()` tek kaynağında; greybox ve instancing hatları ikisi de
oradan okur (ayrı ayrı `level >= 3` demeleri B5a'da yalana dönüşmüştü).

**Karar 4 — denge B5a'da DEĞİŞMEZ, ölçülür (kullanıcı).** Yeni sekiz pad'in maliyeti uydurulmadı:
a2'nin kendi son adımının oranı (3200/2200 = ×1,4545) sürdürüldü. Görevleri hattın SONUNA eklendi
ve önlerine `q_stationMax` (tezgâh L6) kondu — arz tavandayken yeni masa hiçbir şeyi hızlandırmaz.
Sonuç ölçüldü: `simulate.ts`'in var olan yirmi bir satırı **birebir aynı**. `allAreaTablesLevel`
`count` alanı da bu yüzden geldi (`waiter3`'ün eşiği alanın büyümesiyle sessizce üç katına
fırlamasın). Eğrinin kendisi B5b'nin konusu.

**Bu adımın kalıcı dersi.** *Bir sabit yalana dönüştüğünde en tehlikeli yeri kod değil TESTTİR.*
`layout-b32`'nin `STRIP = [8,9,10,11]` dizisi ve `layout-b31`'in `[3, 12]` kademesi yazıldıkları gün
doğruydu; şerit 12 birime çıkınca ikisi de sessizce KÖRLEŞTİ — bekçilik ettikleri iki kural yeni
sekiz birimde hiç sınanmayacaktı. Aralıkları yerleşimden türetince test hemen gerçek bir kusur
yakaladı: `waiter2`/`waiter3` pad'leri yeni sütunların yükseltme noktalarının 0,50 ve 1,77 br
yakınına düşüyordu (eşik 2,3) — oyuncu garson pad'ini doldurmak için durunca masayı da yükseltmeye
başlıyordu. Elle yazılmış index dizisi bir varsayımdır ve varsayımlar da tıpkı kod gibi bayatlar.
B1 aracın ÇIKTISI · B2 aracın VARSAYIMI · B3-1 aracın GÜRÜLTÜSÜ · B3-2 kaynağın KAPSAMI ·
**B5a bekçinin KÖR NOKTASI.**


---

## D-066 — B5b: MASA ALAN SATAR, GELİR SATMAZ (gelirin üçüncü tavanı ölçüldü) (2026-09-07)

**Bağlam.** B5a şeridin sekiz masasını a2'nin kendi son oranıyla (×1,4545 → toplam 194.300₺)
fiyatlamış ve kararı B5b'ye bırakmıştı: "eğri dik mi kalsın, yoksa kuyruk yassılaşsın mı?"
B5b modeli söktü ve sorunun eğri OLMADIĞINI buldu. Tam rapor: `docs/denge-raporu-b5b.md`.

**Bulgu 1 — masa açmak bu ekonomide hiçbir zaman gelir kolu olmadı.**
`gelir = min(talep, arz, taşıma) × (fiyat + bahşiş)`. Arz = tek servis noktasının demleme hızı ve
sadeleşince **bir servis noktası en fazla `(yürüme+içme)/demleme + 1` koltuğu doyuruyor** — L6'da
**5,69 koltuk**. Kat ise masa L4'te **56 koltuk**. Yani `table3`'ten (≈3. dakikadan) itibaren
talep hep en büyük terim: açılan HİÇBİR masa geliri artırmıyor. 16 masa pad'i, ~350.000₺,
ölçülebilir gelir katkısı sıfır. Simülasyonun "B5a dengeyi hiç değiştirmedi" demesinin sebebi de
buydu — masa sayısı bu modelde geliri zaten değiştiremiyor.

**Bulgu 2 — asıl sorun eğri değil, PLATO.** Gelirin iki ₺ kolu da şerit başlamadan tükeniyor:
servis L6 (₺ tavanı) Normal profilde 3,72 sa'de, masa L4 bahşişi 43 dk'da. Sonra oran donuyor ve
şeridin sekiz masası tam o donmuş bandın içinde duruyor → **~6,6 saatlik sabit hızlı plato**
(onaylı tempo kuralı "zone ~1 sa+" iken 3. Alan ~8,5 saat sürüyordu).

**Bulgu 3 — gelirin ÜÇÜNCÜ tavanı vardı ve sim onu hiç görmüyordu: TAŞIMA.** Çayı biri taşımalı;
oyuncu + garson havuzu saniyede taşıyabildiğinden fazlasını satamaz. Bu tavan verim çarpanının
(0,80/0,55/0,35) içinde saklıydı, yani garson/tepsi/karakter fiyatları ÖLÇÜLEMİYORDU.
`simulate.ts`'e gerçek BFS yollarıyla eklendi (`avgServeDist` · `carryRateOf` · `bindingArm`) ve
formüle üçüncü bir `min` terimi olarak girdi. Ölçüm: **tezgâhtan (L4) sonra darboğaz TAŞIMA**;
L6'da oran sanılan 15,62 değil **13,13 ₺/sn**, 3. garson alınınca 15,62 (**+%19**, 6000₺ ~40 dk'da
amorti). Kol tükendiğinde (3 garson + tam karakter, taşıma 1,25) darboğaz yine arza dönüyor —
**taşıma platoyu ~45 dk geciktiriyor, kaldırmıyor.**

**Karar 1 — şerit eğrisi ×1,4545 → ×1,15** (194.300 → **51.100₺**):
3700 · 4250 · 4900 · 5650 · 6500 · 7500 · 8650 · 9950 (fillRate = maliyet / 3,5 sn).
Bir masa gelir çarpanı değilse fiyatı da gelir çarpanı fiyatı olamaz; eğri masanın gerçekte
sattığı şeye (alan + atmosfer + yükseltilecek yüzey) göre yassıltıldı. Ölçüldü: şerit dolumu
Normal 10,31 → **5,28 sa**, Rahat profil ilk kez bitirebiliyor (**8,30 sa**). Servis L6'ya kadarki
her satır birebir aynı — erken oyuna dokunulmadı. ×1,08'in getirisi ~0,5 sa olduğu için elendi.

**Karar 2 — arzı ŞİŞİRMEK reddedildi.** Masaların gelir getirmesi için arzın ~10 katına çıkması
gerekirdi; o zaman taşıma tavanı (1,25) ve müşteri geliş tavanı (`spawnInterval` 1,6 sn/grup ≈
1,38 kişi/sn) yolu keser, ekranda aynı anda 58 NPC olur. Üçünü birden açmak "elle servis, aşırı
otomasyon yok" kuralını (D-014) iptal etmek demek. **Bu oyunun throughput tavanı ~1 bardak/sn'dir
ve bu bilinçli bir tasarım sonucudur** — uyumsuz olan arz değil, masa sayısının ekonomik iddiası.

**Karar 3 — plato kolu B4'ün lavabosudur; PLAN SIRASI DÜZELTİLDİ.** B4 zaten "lavabo: oturma
eklemez, pasif çarpan, kendi seviyeleri" diye planlıydı; yani platoyu kıracak kol defterde vardı
ama şeridin ARKASINA konmuştu. Sıra: **B4 → şeridin son fiyatı yeniden ölçülür.** (D-063 gibi bir
plan düzeltmesi; kullanıcı onayı 2026-09-07.)

**Karar 4 — a2'nin masa yükseltme eşiği `z3table4`'te KALIR.** Bahşiş kolu servis L6'dan da önce
tavanına ulaştığı için eşiği ileri atmak yeni derinlik açmaz, yalnız platoyu uzatır.

**Karar 5 — müşteri boş masalar arasında EN YÜKSEK SEVİYELİYİ seçer** (`findTableForGroup`, alan
round-robin'i korunarak: önce seviye, sonra boş koltuk, eşitlikte düşük index). Sebep gerçek bir
kusurdu: servis edilen bardak sayısı arz tavanıyla SABİT, yani yeni açılan bir L0 masa o sabit
bardakların bir kısmını üstüne çekip bahşişsiz ödüyordu → **masa AÇMAK ortalama bahşişi, yani
geliri kısa vadede DÜŞÜRÜYORDU.** Oyuncunun 13. masayı açtığı için cezalandırıldığı bir tycoon
olmaz. Yeni masa artık yalnız TAŞMA alıyor (iyi masa dolduğunda), böylece seyrelme kapanıyor ve
masa yükseltmesi ekranda okunur hâle geliyor: iyi masalar hep dolu.

**Karar 6 — `waiter3` OMURGAYA girdi; `optional` kategorisi boşaldı.** Ö5'in ölçümü 3. garsonu
her oyuncu için her zaman doğru bir alım yaptı (+%19 gelir, ~40 dk amortisman) — böyle bir alım
gerçek bir tercih değil, **eksik bir zincir adımıdır**. `optional: true` kalktı; gate
`allAreaTablesLevel {a2, L2, count 4}` → **`minStationLevel: 6`** oldu (ölçümün söylediği gerçek
koşul: arz tavana çıktığı anda darboğaz taşımaya geçer). Görevi `q_waiter3`, tam karşılığı olan
`q_stationMax`'in hemen ardına kondu ve şerit ondan sonra başlıyor → sekiz masalık kuyruk 13,13
değil **15,62 ₺/sn**'de akıyor. Tempo bedeli yok denecek kadar az (şerit dolumu 5,28 → 5,35 sa,
Normal); kazanç hızda değil histe: L6'ya varan oyuncu düz bir platoya değil görünür bir sıçramaya
giriyor. **Yan sonuç:** waiter3 oyundaki tek `optional` pad ve `allAreaTablesLevel`'ın tek
kullanıcısıydı → iki mekanizmanın da bugün üyesi yok. Silinmediler (Faz D'nin meta katmanı
opsiyonel pad getirebilir) ama boşluk teste yazıldı ki kaza değil KARAR olduğu görünsün.

**Karar 7 — görev hattı ile pad zincirinin hizası artık BEKÇİLİ** (`tests/chain-b5b.test.ts`).
İlerlemeyi iki ayrı sıra anlatıyor — `pads[].requires` (yapısal zincir) ve `quests[]` (oyuncunun
gördüğü tek-odak sırası) — ve ayrıştıklarında hiçbir şey bağırmıyordu, çünkü `visiblePads` AKTİF
görevin hedef pad'inde tempo gate'lerini **bilerek atlar** (2026-06-11 fix). Yani hattın işaret
ettiği bir pad, zincir "sırası gelmedi" dese bile ekranda belirir ve gate bir süse dönüşür.
waiter3'ün eski gate'i tam olarak buydu. Üç değişmez yazıldı, üçü de config'den TÜRER (elle
yazılmış sıra listesi yok — B5a'nın dersi): (1) görev hedefi olan pad yalnız hattın
sıralayabildiği gate'leri taşır, (2) hat yürütülünce her pad görevi gate'i karşılanmışken gelir,
(3) omurganın pad sırası ile hattaki pad sırası birebir aynıdır.

**Karar 8 — ödüllü video = geçici DEMLEME çarpanı ("Semaver kaynadı", ×2 / 60 sn; uygulama
Faz 5). Ödül tam bağlayıcı tavanın (arz) üstüne biner → oyuncuya oyunun kendi darboğazını
öğretir. Kullanıcının "para eksik kalırsa reklamla pad'i tamamla" fikri **reddedildi**: kural
ihlali değil ama gereksiz — Karar 1'den sonra oyunda ~20 dk'yı aşan tek bir alım kalmadı, ve bir
tempo sorununu eğriyi düzeltmek varken reklamla geçiştirmek türün bilinen tuzağıdır.

**Bu adımın kalıcı dersi.** *Bir sayının arkasındaki VARSAYIM, sayının kendisinden daha uzun
yaşar.* 194.300₺'lik eğri aritmetik olarak kusursuzdu — a2'nin kendi oranının dürüst devamıydı;
yanlış olan tek şey, o oranın sessizce dayandığı "masa açmak geliri büyütür" cümlesiydi ve o cümle
hiç yazılmamış, hiç sınanmamıştı. Aynı oturumda aynı hatayı bir kez daha yaptım: raporun ilk hâli
taşıma tavanını elle tahmin edip "3. garson hiçbir şey satın almıyor" dedi; ölçünce tam tersi
çıktı (+%19). **Ölçülmeden yazılan her cümle bir varsayımdır — elle yazılmış bir test dizisi kadar
da bayatlar.** B1 aracın ÇIKTISI · B2 aracın VARSAYIMI · B3-1 aracın GÜRÜLTÜSÜ · B3-2 kaynağın
KAPSAMI · B5a bekçinin KÖR NOKTASI · **B5b sayının ARKASINDAKİ CÜMLE.**

---

## D-067 — B4a: ODA (lavabo) = Kat 1'in SON gelir kolu; kol MÜŞTERİ BAŞINA biner ve MEKÂNDA toplanır
**Tarih:** 2026-09-07 · **Durum:** UYGULANDI · **Rapor:** `docs/denge-raporu-b4.md`

D-066 platoyu bulmuştu ama kolu "lavabo = pasif gelir çarpanı" diye tarif etmişti. B4 önce kolun
NEREYE binmesi gerektiğini ölçtü, sonra kullanıcı biçimini düzeltti.

**Karar 1 — Kat 1'de throughput kolu TÜKENDİ; kalan tek yön müşteri başına ₺ (ÖLÇÜLDÜ).**
Servis merdiveni ₺ ile L6'da bittiği için arz **0,78 fincan/sn**'de tavan; taşıma tavanı tam
kadroda **1,25**. Çay/dk'da kalan tüm baş boşluğu ×1,6 ve arkası ölü (garson havuzu 3'te sabit,
karakter kademeleri bitiyor). Yani "ekonomi = throughput" kuralı iptal olmadı — **Kat 1 için
tükendi**; yeni throughput Kat 2 ile gelir. Bu ölçüm olmadan B4'ün kolu keyfî bir tercih gibi
görünüyordu; ölçümle birlikte tek seçenek hâline geldi.

**Karar 2 — Aktif kâğıt döngüsü B4'ten ÇIKARILDI (yanlış değil, yanlış zamanda).**
Eski tasarım (`zone34-wc-floor2-design.md`) kâğıt ikmalini aktif angarya olarak kurmuştu. Ölçüm:
platonun tam olduğu pencerede (L6 · 12 masa · 3 garson) oyuncunun taşıma kolundaki **boş zaman
payı yalnız %5**, kâğıt turu ise zamanının **%31**'i → döngü tam orada geliri KESER. Şerit
dolduktan sonra boş pay %74'e çıkıyor ve aynı döngü bedava sığıyor. → Faz C/D'ye ertelendi.

**Karar 3 — Kolun biçimi: çarpan DEĞİL, odanın KENDİ İSTİFİ (kullanıcı düzeltmesi).**
Önerilen "bahşiş çarpanı" reddedildi. Doğrusu: müşteri masasında ödeyip kalkar, çıkmadan
lavaboya uğrar (girer–çıkar, içeride görünmez), çıkışta parasını **odanın önündeki istife**
bırakır; oyuncu gidip toplar. Üç kazancı var: (a) para SUNUMU değişmiyor — aynı `Coin`, aynı
Model B′ istifi, yalnız ikinci bir düşme noktası; (b) gelir "sayının büyümesi" değil MEKÂNSAL
bir kazanç (aktif oynanış, D-012 ruhu); (c) fiyat ve bahşiş kollarına hiç dokunulmuyor →
**D-010 delinmiyor**, çay 5 ₺ sabit kalıyor.

**Karar 4 — Sayılar (onaylı ivme ×1,38/adım).** Kol `uğrama olasılığı × bırakılan ₺` olarak
müşteri başına biner ve İKİ okunur sinyalle taşınır (tek sinyal yetmez kuralı): uğrama %30 → %55
(gözle daha çok müşteri girer) ve ücret 18 → 86 ₺. Oda pad'le L1 doğar (3.000 ₺), L2..L6
yükseltme noktasından gelir (4.000/5.000/7.000/9.000/11.500). Ölçülen sonuç: en uzun DÜZ aralık
**1,42 sa → 13,4 dk**, zincir süresi **5,35 → 5,21 sa** (tempo bedeli yok), servis L6'ya kadarki
her satır taban ile birebir. **Seviye maliyet eğrisinin DİKLİĞİ çarpanın kendisinden daha
belirleyici çıktı:** dik eğri düz aralığı 41 dk'ya çıkarıyor, düz eğri 13 dk'da tutuyor.

**Karar 5 — Görev hattı DÖNÜŞÜMLÜ.** Bir şerit masası → bir lavabo seviyesi → bir masa...
Seviyeler şeridin ARASINA girmezse gelir yine donuyor ve kuyruk sabit hızda akıyor. Zincirde
lavabo `waiter3`'ten sonra, `z3table5`'ten önce.

**Karar 6 — Oda ile SEVİYE farklı kaynaklardan gelir.** Odanın kendisi `padsDone`'dan TÜRETİLİR
(D-015; `world.rooms`), seviye ayrı persist edilir (yükseltme noktasından büyüdüğü için
türetilemez). İkisinin çelişmesi store init'inde kelepçelendi: oda kapalıysa seviye 0, açıksa en
az 1. `lavaboLevel` **additive** bir kayıt alanı → SAVE_VERSION 31'de kaldı (showFps deseni).

**Karar 7 — Pad ile yükseltme noktası AYNI yerde.** Oda açılınca pad listeden düşer ve aynı
nokta odanın yükseltme noktası olur; ikisi asla aynı anda etkin olmadığı için çakışma da
imkânsız. "Her obje kendi yerinde yükselir" kuralının en sade hâli.

**Bu adımın kalıcı dersi.** *Bir mekaniğin YANLIŞ olması ile YANLIŞ ZAMANDA olması ayrı
şeylerdir ve ikincisi ölçülebilir.* Kâğıt döngüsü tasarım olarak sağlamdı; onu B4'ten çıkaran şey
zevk değil, oyuncunun o penceredeki zaman bütçesiydi (%5 boşluğa %31'lik angarya). Aynı şekilde
platoyu kıran şey de "daha büyük sayı" değil, **kolun zincire hangi aralıkla serpiştirildiğiydi**.
B5b sayının ARKASINDAKİ CÜMLE idi · **B4 mekaniğin ZAMANI.**

---

## D-068 — B4b KALDIRILDI (kapsamı B6b'ye katıldı) · B6'nın çalışma biçimi: önce Claude, Fable 5.1 destekli, Astra sonra
**Tarih:** 2026-09-07 · **Durum:** PLAN KARARI (kod değişmedi) · **Bağlam:** B4a bitti, sıra B6'da

**Karar 1 — B4b ayrı bir adım olmaktan çıktı.** B4b'nin kapsamı (lavabonun içi · yıkık merdiven ·
arka bandın içi) ile B6b'nin kapsamı ("arka yarı + bant … servis bloğunun içi, bandın okunur hâli")
**aynı işti**. B4b'yi greybox'la şimdi yapmak, aynı yüzeyleri KayKit'le B6b'de yeniden yapmak
demekti — planın kendi cümlesi: *"yanlış sırada yapılan iş iki kez yazılır."* B4b'nin tek mantık
parçası merdivenin *"Kat 2 çok yakında"* demesiydi; o bir oturumu hak etmeyecek kadar küçük ve
B6b'nin ilk maddesi olarak giriyor. **Faz B 8/10 oldu** (eski 8/11), sıra: **B6a → B6b**.
Kullanıcı onayı: *"şimdi önerine göre hareket edelim."*

**Karar 2 — Astra: önce Claude, sonra gerekirse ölçüm.** D-051 arayüz için "önce ben tam gücümle,
A/B sonra" demişti; kullanıcı aynı kuralı 3B sanat katmanına da uyguladı: *"önce sen dene ona göre
astraya geçeriz."* **Gerekçe kanıt tarafında da duruyor:** Astra'nın ölçülmüş 3B üstünlüğü
Blender/geometri işinde (%95,9 vs %84,3), bizim iş ise react-three-fiber'da **kod yazarak** sahne
kurmak — o eksende karşılaştırma YOK, yani "daha iyi olur" bir varsayım (bkz. B5b'nin dersi:
ölçülmeden yazılan her cümle bir varsayımdır).

**Karar 3 — tasarım turunda Fable 5.1 desteği.** Kullanıcı: *"tasarım aşamasında fable 5.1'den
destek alman faydalı olabilir."* Uygulama: dekor/kompozisyon turu için `model: "fable"` alt ajanı
çağrılır; **kararı ve kodu Claude yazar**, Fable görsel yön için ikinci göz olur. Bu, D-045'in
"görsel iş topluca devredilmez" kuralını bozmaz — devir değil, danışma.

**Karar 4 — B6 A/B'ye HAZIR kurulur.** Dekor katmanı salt görsel (collision yok) olduğu için
`layout.ts`'in nav/collision kısmından ayrılıp **tek bir veri dosyasına** iner. Böylece aynı
şartname iki tarafa verilebilir, aynı kadrajdan ekran görüntüsü karşılaştırılır (D-045'in "tek
ekranda A/B" kuralı). `store.ts` / `economy.config.ts` / `save.ts` / testler **bölünmez**.

**Bu kararın kalıcı dersi.** *İki adım aynı yüzeye dokunuyorsa, aralarındaki sınır plan hatasıdır.*
B4b ile B6b'yi ayıran şey iş değil, planın yazıldığı sıraydı: B4 "odalar" başlığı altında
doğduğu için mekân işi ekonomiden ayrılmıştı, oysa lavabonun İÇİ bir ekonomi işi değil bant
işiydi. Adımı silmek kapsam kaybı değil, **iki kez yazılacak işin bir kez yazılması**.

## D-071 — SIRA GERİ ALINDI: tasarım EN SONA, önce oynanış (2026-09-07 gece)

**Karar:** D-070'in *"önce tasarım komple geçsin"* SIRASI geri alındı. Kullanıcı:
*"tasarıma en son döneriz artık yapacak bir şey yok"*. Bundan sonra **önce oynanış/mantık tarafı
eksiksiz tamamlanır**, maket taşıması (BM) **en sona** bırakılır.

**D-070'in geri kalanı AYNEN DURUYOR** — yalnız sıra değişti:
- **Maket v13 tek doğru kaynaktır**; tasarım sırası geldiğinde oyunun statik dünyası onun
  transkripsiyonu olur.
- **Kural:** maketten transkripsiyon yapılır, esinlenilmez. Sapma varsa yanında gerekçesi yazar;
  gerekçe ancak (a) oynanışa bağlı koordinat ya da (b) maketin kendi parametresi olabilir.
- **Maket BİTMİŞ HÂLDİR:** en üst kademe maketin ölçüsüne eşitlenir, ara kademeler geriye türetilir.

**BM adım 1 (duvar) PARK EDİLDİ, SİLİNMEDİ.** `worktree-maket-tasima` dalı uzakta duruyor
(`6e61e4c`): duvar maketin `wall()`'ı oldu (3,20 · lambri 0,90 · üç katman · koyu çıta), dekorun
asma bandı maketin değerlerinde, vitest 277/277 · smoke 28/28. Tasarım sırası gelince oradan
devam edilir ya da o dal referans alınarak yeniden yazılır. **Silinmemeli.**

**BEDELİ — bilerek kabul edildi (sonra sürpriz olmasın):** tasarım en sonda taşınınca
(1) o ana kadar yapılan her görsel/yerleşim işi bir kez daha yazılır, (2) mesafeler değişeceği için
o güne kadarki tüm denge ölçümleri (taşıma süreleri, `simulate.ts` çıktısı) geçersizleşir ve
yeniden ölçülür. D-070'te bu risk yazılıydı; kullanıcı bilerek bu sırayı seçti.

**Ayrıca kayda geçen ölçüm (`docs/olcum-kaykit-ve-yerlesim.md`):**
- **KayKit duvarları 4 × 4 × 0,5 modül** (yarım 2), 144 modelin hepsi tek materyal + tek atlas
  paylaşıyor. Ama kat 34 × 34 dörde bölünmüyor (→ 32 ya da 36 gerekir), duvar 4,0 (maket 3,2) ve
  kapı modülün içinde sabit (oyunun kapısı kayıyor). **Öneri: KayKit duvarı istenirse ÖNCE MAKET
  güncellenir, sonra transkribe edilir** — yoksa iki ayrı doğru kaynak sorunu geri gelir.
- **Ön çeyrek kümeleri maketle eşleşmiyor:** masa aralığı 6,40 → 3,20 · tabla 1,75 → ~0,90 ·
  koltuk 1,45 → 0,78 · kümenin ayak izi maketin **dörtte biri**. **Orta şerit ise eşleşiyor**
  (3,20 · 1,85 · 1,00 birebir). Teşhis: oyun ŞERİDİN masasını ve ızgarasını ön çeyreklere de
  uygulamış; makette iki ayrı mobilya dili var.

---

## D-070 — MAKET = TEK DOĞRU KAYNAK. Kat komple tek geçişte taşınıyor (2026-09-07 gece)

**Karar:** Faz B'nin "adım adım maket görselliğine geçiş" planı DURDURULDU. Yerine tek bir adım
geldi: **oyunun statik dünyası `docs/maket/maket-v13.html`'in `buildFloor1`'inden TRANSKRİPSİYONdur.**
Duvarlar (yükseklik + profil + birleşim), zemin, mobilya ölçüleri, aralıklar, kamera — hepsi. Oda oda
değil, **kat komple, tek geçişte**. İş ayrı bir worktree'de yapılır, 4-5 kadrajdan maket↔oyun yan yana
konur, kullanıcı onaylayınca birleşir.

**Neden (bu gece üç kez başarısız olundu):**
Lavabo odası üç kez denendi. (1) Maketin programı alınıp ×0,72 ile küçültüldü ve 1,15'lik banda
kırpıldı → kabin 2,00 yerine 1,00 oldu, "kabin değil kanat" diye reddedildi. (2) Maketin sayılarıyla
birebir transkribe edildi (`maketParts.tsx`) → geometri düzeldi ama yine "maketle alakası yok" denildi.
(3) Işık ve renk ölçülerek maketin ailesine çekildi → yine yetmedi.

Üçüncü denemeden sonra ÖLÇÜLDÜ ve asıl sebep çıktı — **oyun maketin küçültülmüş hâli değil, BAŞKA
BİR BİNA:**

| | maket v13 | oyun (bugün) |
|---|---|---|
| duvar yüksekliği | 3,20 | **1,20** |
| duvar profili | gövde 0,18 + lambri 0,90 + çıta 0,08 | gövde + lambri 0,50 + süpürgelik + çıta + kartonpiyer |
| masa tablası | 1,75 × 1,75 | **~0,90 × 0,90** |
| masa yüksekliği | 0,75 | **0,50** |
| masa tipi | tek tip | **seviyeye göre üç ayrı boy** (makette yok) |
| kamera | fov 34 | fov 50 |

Farklar YEREL DEĞİL SİSTEMİK. Bir odayı taşırken her parçayı bu eski geometriyle uzlaştırmak
gerekiyor ve **o uzlaştırmanın kendisi tasarım kararı** — kullanıcının reddettiği şey tam olarak o.
Kabuk tek seferde maketin olursa uzlaştıracak bir şey kalmaz.

**Sıra gerekçesi (kullanıcı "önce tasarım" dedi, gerekçe kayda geçiyor):**
1. Parça parça taşıma bu gece kanıtlanmış biçimde çalışmıyor.
2. Aradaki her görsel iş, sonra yer değiştirecek bir geometrinin üstünde durur → iki kez yazılır
   (planın kendi cümlesi: *"yanlış sırada yapılan iş iki kez yazılır"*).
3. Mantık katmanı koordinata AZ bağlı: ekonomi/görev/kayıt `LAYOUT.tables[i]` · `LAVABO.spot` gibi
   İSİMLERE bakıyor. Geometriyi altlarından değiştirmek ucuz — yeter ki tek geçişte olsun ve
   isimler korunsun.

**Bedeli (bilerek kabul edildi):** nav/collision yarı-boyları · pad konumları · personel bekleme
noktaları · yükseltme işaretleri yeniden türetilir; `simulate.ts` bir kez yeniden ölçülür (mesafeler
değişince taşıma süreleri değişir). B4/B5/B6a'nın denge sayıları bu ölçümde tazelenir.

**MASA ÇELİŞKİSİ — kullanıcı kararı:** oyun masa BOYUTUNU seviye sinyali olarak kullanıyor, makette
tek tip masa var. Karar: ***"makette durum SON DURUMDA o şekilde olacak; biz ona göre oyunu yaparken
geçmişe dönük seviyeleri tamamlarken ayar vereceğiz."*** Yani **maket bitmiş hâldir**: en üst kademe
maketin ölçüsüne eşitlenir, ara kademeler ondan geriye doğru türetilir. Aynı kural masa dışındaki
her kademeli obje için de geçerli.

**ASTRA:** kullanıcı "bu senin en iyi halinse Astra 6 ile deneyeceğim" dedi. Kayda geçen değerlendirme:
bu geceki hatalar 3B kodu hatası değil, **transkripsiyon yapılması gereken yerde tasarım yapılması**
hatasıydı; transkripsiyon işi farklı bir model değil, maket dosyasını açık tutmak ister. Bu yüzden
sıra: **önce sadık transkripsiyon, yargı ondan sonra.** Kat taşındıktan sonra hâlâ beğenilmezse sorun
gerçekten tasarımdır ve ikinci model anlamlıdır. Bu yüzden iş A/B'ye hazır kurulur: aynı şartname +
aynı kadrajlar Astra'ya olduğu gibi verilebilsin (D-045/D-068 §3 deseni).

**KURAL (dosya başına yazılıyor):** *maketten TRANSKRİPSİYON yapılır, maketten ESİNLENİLMEZ.* Bir sayı
maketten farklıysa hemen yanında gerekçesi yazar ve gerekçe ancak şu ikisinden biri olabilir:
(a) oynanışa bağlı bir koordinat (pad/işaret/hedef noktası), (b) maketin kendi dosyasında zaten
parametre olan bir değer.

---

## D-069 — B6a: DEKOR KENDİ DOSYASINDA; KESİK DUVARDA AĞIR ÖĞE ASILMAZ, ZEMİNE OTURUR (2026-09-07 gece)

**Bağlam.** B6a maket v13/v14'ün ön çeyrek (a0 + a1) sanat katmanını oyuna taşıyacaktı. Maketin
programı olduğu gibi kopyalanamadı, çünkü maket ile oyunun iki sert farkı ölçüldü.

**Karar 1 — Dekor `src/config/decor.ts`'e taşındı; `LAYOUT.decor` KALKTI.**
Dekorun geometriyle tek ortak yanı koordinat sistemi: collision'ı, nav'ı, kaydı yok. `layout.ts`
artık yalnız YÜRÜNEN dünyayı anlatıyor, `decor.ts` BAKILAN dünyayı. Yan kazanç: D-068 §3'ün
istediği A/B kurulumu bedava geldi (tek veri dosyası) ve "LAYOUT.decor hâlâ eski 21 × 21
koordinatlarında" açık kalemi patch'le değil taşımayla kapandı.

**Karar 2 — KESİK DUVARA AĞIR ÖĞE ASILMAZ.** Oyunun duvarı 1,2 birim (`wallPanel.WALL_H`);
maketinki 3,2. Maketin y = 1,85…2,20'deki programı (TV · konsol · tablo · aplik · saat) bu duvara
sığmıyor — nitekim TV bugüne kadar **y = 1,85'te, duvarın ÜSTÜNDE havada** duruyordu. Kural:
- **Ağır öğe (TV · konsol) duvardan iner, kendi ayaklı ünitesine oturur.** Bedava gelen iki şey:
  "havada obje" kusuru kökten kapanır, ve 45°'lik kameraya bir ÜST YÜZEY doğar.
- Duvarda yalnız İNCE öğeler kalır (tablo · aplik · saat · askı rayı · pencere) ve hepsi lambri
  çıtası (0,54) ile kartonpiyer (1,15) arasındaki banda sığar. Bekçi: `tests/layout-b6a.test.ts`.

**Karar 3 — YAN DUVARDA "DÜZ ASILAN" HİÇBİR ŞEY OKUNMUYOR; sinyal ODAYA TAŞMALI.** Kamera yatayda
tam −z'ye baktığı için z ekseninde uzanan yan duvarlar neredeyse PROFİLDEN görünüyor. İlk denemede
maketin penceresi birebir küçültülmüştü (koyu doğrama + yarı saydam cam) ve ekranda **koyu kahve
dikey çubuklara** dönüştü (`docs/gorsel/ss/b6a-pencere-yakin.png`). Pencere üç sinyale bölündü:
derin denizlik (odaya 0,30 taşar, ÜST yüzeyi görünür) · AÇIK doğrama (koyu olan camı yutuyordu) ·
**duvarın TEPESİNE basılan cam bandı** (mimari kesitte camın taranması gibi; profilden bakışta bile
"burada açıklık var" okunuyor). Aplik kolu da 0,18 → 0,30'a uzadı.

**Karar 4 — ÖN DUVARIN İÇ YÜZÜ HİÇBİR KADRAJDA GÖRÜNMEZ.** Kamera hep onun iç tarafında ve sırtı
ona dönük. Maketin "giriş holü" duvar öğeleri (tablo · saat) oraya asılırsa hiç okunmaz → giriş
hissi duvarla değil **kapının iki yanındaki düşey siluetlerle** kuruluyor (askılık · şemsiyelik ·
lamba · saksı), hepsi arkadan da okunan hacimler; kapıyla birlikte taşınıyorlar (`entryAtDoor`).

**Karar 5 — a0 ile a1 AYNALI DEĞİL, AYRI KİMLİK.** Masa kümeleri aynalı kalır (ekonomi + ızgara
ritmi), dekor ayrışır: **a0 "ocak duvarı"** (TV ünitesi · konsol · palto · ahşap) ↔ **a1 "cam
kenarı"** (üç pencere · petek · denizlik çiçeği · aydınlık). Aynalı olsalardı iki çeyrek "aynı
odanın kopyası" okunur ve kullanıcının şikâyet ettiği düzensizlik hissi sürerdi.

**Tasarım turu.** D-068 §2 uygulandı: kompozisyon için Fable 5.1 danışıldı; kararlar 2, 3, 5 onun
ikinci gözünden çıktı. **Alınmayan üç öneri:** soba + kömür kovası (maket sobayı arka salona
koyuyor — B6b'nin işi, katta iki soba olurdu) · ayaklı kül tablası (D-032 nargileyi yaş sınırı için
kaldırmıştı, küllük aynı sinyali geri getirir) · kümelerin üstüne sarkıt lamba (Fable'ın kendisi de
"önce mockup onayı" dedi; B6b'de sorulacak).

**HALI YOK kuralı korundu:** zemindeki tek dokuma parça kapı paspası (maket v13 de ön çeyreklerde
halı taşımıyor).

**Ölçüm.** Çizim çağrısı en yoğun kadrajda (cam kenarı) 104 → **167** (pencere dilimleri ve petek
kaburgaları kırpıldıktan sonra; kırpma öncesi 177). Üçgen 10.502 → 12.310. Sol duvar ve giriş
kadrajlarında fark +1 ve +18. Dekorun tek InstancedMesh'e toplanması (duvar/zemin deseninde olduğu
gibi) Faz F'ye açık kalem olarak yazıldı.

---

## D-072 — TASARIM ↔ SİSTEM KARIŞIKLIĞININ ÇÖZÜMÜ: ÜÇ KATMAN + ÖLÇÜ DONDURMA (2026-09-07 gece)

**Bağlam.** Kullanıcı: *"bu tasarım ve geliştirme meselesi aşırı karıştı, buna bir çözüm bulmak
şart… önce tasarım mı kusursuzlaştırılmalı yoksa sistem mi"*. Sıra iki gecede iki kez döndü
(D-070 tasarım-önce → D-071 tasarım-sona). Karışıklığın dört kök nedeni ölçüldü:

1. **İki doğru kaynak, ikisi de ayrı PROGRAM.** `docs/maket/maket-v13.html` three r128 + varsayılan
   renderer (LinearEncoding, ton eşlemesi yok); oyun three 0.184 (sRGB + ACESFilmic). Aynı görüntüyü
   **hiçbir zaman** veremezler (ölçüm: zemin L201↔L118 · fayans L255↔L151). "Yan yana koy, aynı mı"
   kabul kriteri bu yüzden **yapısal olarak kapanamaz** → B6b'nin üç turu, maket v3/v12, blob
   shadow'un üç turu.
2. **Geometri hem sanat hem oynanış.** `layout.ts`'te masa aralığı = yürüme süresi = çay/dk = ekonomi.
   Tasarım her oynadığında denge ölçümü (simulate.ts, taşıma süreleri) geçersizleşiyor. Ters yön
   geçerli değil. **Bağımlılık TEK YÖNLÜ** — karışıklığın motoru bu.
3. **"Tasarım" tek kelime, iki ayrı iş:** (a) sanat arayışı — açık uçlu, öznel, yüksek ret;
   (b) onaylı maketi port etme — kapalı, ölçülebilir. Maket v13 zaten onaylı → kalan iş (b).
4. **Asıl darboğaz ikisi de değil:** yayın katmanı (Faz 5/7/8) %0-5 ve geometriden bağımsız.

**KARAR — üç katman, aralarında tek yönlü sıra:**

| Katman | İçerik | Ne zaman | Kural |
|---|---|---|---|
| **1 · ÖLÇÜ/ANKRAJ** | kat, duvar yüksekliği+profili, masa tablası/yükseklik/aralık, koltuk, kamera fov, servis yüzü, pad noktaları, nav katıları | **İLK**, tek geçiş, sonra **DONAR** | Kabul kriteri **sayı listesi** (ölçü testi), "aynı görünüyor mu" DEĞİL |
| **2 · SİSTEM** | denge TEK KEZ yeniden ölçülür → Faz 4 → 5 → 7 → 8 | Katman 1 donduktan sonra | Ankrajlara dokunmaz |
| **3 · SANAT CİLASI** | dekor, materyal, renk, ışık, animasyon | EN SON, sınırsız tur | Ankrajlara **dokunamaz** → tur sayısı dengeyi bozmaz |

**Üç yapısal kilit (bir daha karışmasın):**
- Maketin ölçüleri `src/config/maket.ts`'te isimli sabit olur; `layout.ts` onlardan türer.
- Ankraj mesafeleri **snapshot testine** bağlanır — sanat turu dengeyi sessizce bozamaz.
- Transkripsiyon bitince **maket ARŞİVLENİR**; tek yetkili oyunun kendisi olur. Yeni tasarım fikri
  artık maketde değil oyunun içinde denenir (iki-program sorunu geri gelmesin).

**Ölçü hedefi — KULLANICI KARARI: A.** Kat **34 × 34**, duvar **3,20** (maket v13 aynen).
Rapor: `docs/olcu-plan-karar.html` · https://claude.ai/code/artifact/a17055c1-de75-4017-9036-54a893c1992b
- **Reddedilen B:** maketi 32 × 32 + KayKit duvarı (4,00) olacak şekilde güncellemek. Ölçüm 32'nin
  üç ritme birden bölündüğünü gösteriyordu (3,20→10 · 4,00→8 · 6,40→5; 34'te sırasıyla 10,625 · 8,5 ·
  5,3125). Gerekçe: onaylanmış maketi yeniden açmak estetik arayışı yeniden başlatır, kayan kapı
  (x −8,5 → 0) KayKit'in sabit kapı modülüyle çatışır, taban %11 küçülür.
- **KayKit yalnız mobilya/obje tarafında kalır.** Mobilyada çatışma yok: KayKit `table_medium`
  2 × 2, maketin 1,75'ine ~0,875 ölçekle oturuyor (oyun bugün `table_small`'ı küçük ölçekte
  kullandığı için yarım boy kalmış).

**Ölçülen fark (bu gecenin kareleri, `docs/gorsel/ss/olcu-plan-*.png`):**
- Ön çeyrek masası: maket **1,75 tabla · 6,40 küme ızgarası · ∓1,45 koltuk** ↔ oyun **~0,90 · 3,20 ·
  ∓0,78**; kümenin ayak izi maketin **dörtte biri**. Orta şerit birebir eşleşiyor (3,20 · 1,85 · 1,00).
- Duvar: oyun **1,20** (insan 1,60'ın omzunun altında; tablo 1,95 · saat 2,20 · aplik 2,05 havada
  kalıyor) ↔ maket **3,20** ↔ KayKit **4,00**.

**Yeni araç (kullanıcı isteği, aynı oturum): dev panelinde ÜSTTEN PLAN.** `Plan (üstten)` satırı:
kamera oyuncuyu bırakır, katın merkezine dik tepeden bakar (34 × 34 kadraja sığar); yanında **ölçü
ızgarası** (3,20 / 4,00) zemine kırmızı ağ çizer. Betikten: `window.__devPlan({ topDown, zoom, gridStep })`.
Kareler `tools/shot-plan.mjs` (oyun) ve `tools/shot-maket.mjs` (maket, oyunla aynı kadraj) ile çekilir.

**SIRA (bundan sonra):** BM adım 1 (duvar — `worktree-maket-tasima` dalı) main'e alınır → adım 2
ön çeyrek mobilya dili (1,75 · 6,40 · ∓1,45; şeride dokunulmaz) → adım 3 arka bant + odalar →
adım 4 kamera → **DONDURMA + arşiv damgası** → denge tek kez yeniden ölçülür → Faz 4/5/7/8.

---

## D-073 — GÖLGE GERİ AÇILDI · ZEMİN MAKETİN DÜZ AHŞABI · MASA ÖLÇÜLERİ MAKETTEN (2026-09-07 gece)

**Kullanıcı (maketi üstten gördükten sonra):** *"maketteki ışık ve gölgeler baya iyiymiş, ben
gölgeleri tekrar istiyorum, zemin duvar renkleri vs de aynı olsun. ek olarak masaların boyutları
arasında çok ciddi fark var, o boyut oranları da uygulansın, aralardaki mesafe vs de aynı şekilde.
zemin kesinlikle parke değil maketteki gibi olmalı, bunları da araya kat planı ona göre yap."*

### 1. GÖLGE AÇIK — **D-054 GERİ ALINDI**
Takım maket v13'ün `init()`'inden birebir: `shadows="soft"` (PCFSoftShadowMap) · mapSize **2048** ·
bias **−0,0012** · normalBias **0,14** (duvarlar 0,18–0,26 kalınlığında; gölge dış yüze sızmasın) ·
ortografik **±30** · near 1 / far 80. Güneş konumu da maketin: **[14, 26, 16]** (~52°); eski
[9, 9, 7] (~40°) gölge KAPALIYKEN objeyi zemine oturtmak için seçilmişti (D-053) ve gölge açılınca
telefonda oynanışı örten uzun lekeler bırakıyor. Işık ŞİDDETLERİ oyunun ölçülmüş değerlerinde kaldı
(hemi 0,72 · güneş 1,45 · dolgu 0,28 · pozlama 1,60) — maketin ham değerleri farklı bir renk boru
hattına ait (r128 + LinearEncoding, ton eşlemesi yok). Bedeli D-054'te ölçülmüştü (~+0,6 ms/kare);
Faz 7'de telefonda yeniden ölçülecek. **Mağaza önizlemeleri gölgesiz** (`SceneLights` `shadows`
prop'u; 34 × 34'lük gölge kamerası küçük diorama'ya uymaz).

### 2. ZEMİN DÜZ AHŞAP — G2'nin plank deseni kalktı
Maketin salonu `floorPatch(..., C.floorWood)` yani TEK DÜZ renk. `FLOOR_THEMES.parke` artık
`kind: 'flat'`, base **#b98a5a** (id korundu: kayıt + mağaza uyumu). Plank mekanizması ölmedi,
'ceviz' temasında sürüyor ve testleri oraya taşındı. G2'nin gerekçesi "zeminde ölçek referansı yok"
idi; referansı artık **gölge** veriyor. Duvar (#e6d7b8) ve lambri (#6d4c41) renkleri zaten maketle
BİREBİR aynıydı — ölçüldü, değişmedi.

### 3. MASA ÖLÇÜLERİ VE ARALIKLAR MAKETTEN (BM adım 2)
Makette **iki mobilya dili** var ve aralarındaki fark büyük; oyun ikisini de ~0,90'a indirmişti:

| | maket v13 | oyun (önce) | oyun (şimdi) |
|---|---|---|---|
| ön çeyrek çay masası | 1,75 × 1,75 @ 0,75 | ~0,90 @ 0,50 | **1,75 @ 0,75** |
| küme ızgarası (masa aralığı) | 6,40 | 3,20 | **6,40** |
| koltuk ofseti | ∓1,45 | ∓0,78 | **∓1,45** |
| şeridin ikili masası | 1,00 | ~0,99 | 0,99 (değişmedi) |

Uygulama: `tableLook.ts` ölçekleri (`table_small` ×1,10 → L0-L2 · `table_medium` ×0,875 → **1,75**
L3+; y hep 0,75), `CHAIR_SPOTS` = maketin `SEATS4`'ü, `TABLE_SPOTS` ön çeyrekleri küme merkezinden
∓3,2, yükseltme noktası ∓1,25 → **∓2,15** (koltuğun dışında kalmalı). Collision artık **tipe bağlı**:
`tableHalf` 0,875 (dörtlü) · `deuceHalf` 0,50 (ikili); `tableHalfFor(i)` masanın tipinden türetir.
`REACH_TABLE` bundan türediği için 1,10 → **1,505** (personel büyük masanın kenarına aynı mesafede
durur). `chairHalf` 0,22 → 0,30 (maket taburesi r 0,27).

**Yan etki (kapatıldı):** koridor saksıları ∓4,6'da artık oturma alanının içinde kalıyordu ve
yükseltme noktalarıyla çakışıyordu → koridorun gerçek genişliğine ve masa sıralarının arasına
çekildi (∓3,0 · z 6,6 / 10,4).

**Testler:** ölçü değişiminin sızdığı 5 test güncellendi (koltuk ofseti · nav REACH artık
footprint'ten türer · banket-masa çakışması ikili footprint'le ölçülür · zemin plank testleri
'ceviz'e taşındı) + "salon zemini DÜZ" testi eklendi. **280/280 yeşil, tsc temiz.**

**Rapor:** `docs/olcu-plan-karar.html` — https://claude.ai/code/artifact/a17055c1-de75-4017-9036-54a893c1992b

---

## D-074 — İKİLİ MASA KARE · TABURE ORANI MAKETTEN · MUTFAK EŞYALARI MUTFAĞIN İÇİNDE (2026-09-08 gece)

**Kullanıcı (BM adım 3 kareleri geldikten sonra):** *"banketlerin masaları küçük… o diğer masaların
tabureleri orantı olarak çok küçük geldi gözüme. ek olarak mutfak eşyaları şu an mutfak dışında,
onları da koy… banketlerin masaları ideal boyda olsun ama KARE olsun; küçük dememin sebebi
dikdörtgen olmasıydı, diğer tek masalar kadar büyük olmasın."*

### 1 · İkili (banket) masa KARE
`table_medium_long` (0,99 × 0,70 bistro) elendi. B5a'nın gerekçesi doğruydu — ikili masa dört
kişilik okunmamalı — ama çözümü yanlış kanaldan veriyordu: farkı tablanın ORANIYLA anlatıyordu ve
dikdörtgen tabla 1,75'lik dörtlünün yanında hem küçük hem çarpık okunuyordu. Fark artık BOYDA:

| | L0-L2 | L3+ |
|---|---|---|
| dörtlü | 1,10 | **1,75** (maketin `teaTable`'ı) |
| ikili | **1,00** (maketin `cafeTable2`'si) | **1,20** |

1,20'nin üst sınırı geometriden: banket adasının görsel yarı-derinliği 1,25, masa merkezi ondan
1,85'te → tabla yarısı 0,60'ı geçerse tabla adanın oturağının ÜSTÜNE biner (`layout-b32` bekçisi).
`deuceHalf` 0,50 → **0,60**.

### 2 · Tabure oranı maketin `stool()`'undan
KayKit `chair_stool` native 0,75 × **0,50**; ölçek 0,6'da oturak yüksekliği **0,30** kalıyordu.
Masa D-073'te 0,75'e çıkıp tablanın üstü 0,795'e gelince tabure masanın yarısı kadar alçak kaldı.
Maketin `stool()`'u: oturak üstü **0,555**, çap 0,54. Ölçek buradan kilitlendi: 0,555 / 0,50 =
**1,11**. Greybox yedeği de maketin dört parçasına (taban diski · ince ayak · geniş oturak · minder)
çevrildi — asset yoksa silüet aynı kalsın.

### 3 · Servis kümesi mutfağın İÇİNE
Bant katı kütleyken servis kümesi onun 1,2 br önünde, salonun zemininde duruyordu (z = −8,6).
BM adım 3 bandı odalara çevirince küme mutfağın DIŞINDA kaldı. Küme 1,70 geri alındı
(z = −10,3): tezgâhın ön yüzü tam bandın hattında (−9,8) — maketin kurgusu, *"semaver ve bardaklar
müşterinin gördüğü yerde, hazırlık arkada"*. Çaycının yürüme hattı tezgâhın arkasına geçti
(−9,6 → −11,3). `WAITER_STATION` tezgâhla aynı hizada kaldı.
**ERİŞİM DEĞİŞMEDİ:** hem tezgâh hem oyuncunun durabildiği en yakın nokta aynı miktarda kaydı,
aradaki 0,85 br sabit (`serving.pickupRadius` 1,6).

**Bunun açtığı test sorusu:** "servis kümesi AÇIK bir alanın İÇİNDE" değişmezi iki farklı rolü tek
kurala bağlıyordu. Ayrıldı: **aktörün bastığı noktalar** (pickup · yükseltme · personel köşeleri)
alanın içinde olmak zorunda; **obje gövdeleri** (tezgâh · bulaşık) alana DEĞMEK zorunda ve alanın
en yakın noktasından `pickupRadius` içinde kalmak zorunda. Bir tezgâhın gövdesinin duvarın içinde
olması normaldir, ERİŞİLEMEZ olması değil.

**Testler:** 281/281 yeşil (3'ü yeniden yazıldı, biri "ikili her seviyede KARE" iddiasıyla
güçlendirildi). tsc + eslint + build temiz, smoke 28/28.

---

## D-075 — MOBİLYA ÖLÇEĞİ KARAKTERE GÖRE AYARLANDI (2026-09-08 gece)

**Kullanıcı (D-074'ün kareleri üzerine):** *"bu sefer de tabureler aşırı büyük oldu biraz daha
ufaltabilirsin ve banketlerdeki masalar da biraz daha küçülebilir. ek olarak banketlerdeki
masaları banketten azıcık daha uzaklaştır, oradaki tabureleri de ona göre ayarla. hatta normal
masalar da belki emin olmamakla birlikte çok ama çok az ufalabilir çünkü **karaktere göre masalar
ve tabureler çok büyük durdu**."*

### KÖK SEBEP — maketin insanı 1,80, oyunun karakteri 1,30
D-070 "maket bitmiş hâldir, ölçüler ondan alınır" dedi ve doğruydu; ama maketin mobilyası
**maketin insanına** göre tasarlanmış. Oyunun karakteri 1,30 (eski karar) — yani maketin
mobilyası 1:1 alındığında karakterin yanında **%38 büyük** kalıyor. D-073 ve D-074'ün her turda
"biraz daha küçült" ile bitmesinin sebebi bu: kısılan hep PLAN ölçüsü, oysa oranı bozan
**yükseklik**.

| | maket | oyun (bugün) | maketin oranı 1,30'luk karaktere uygulansaydı |
|---|---|---|---|
| insan / karakter | 1,80 | **1,30** | — |
| masa yüksekliği | 0,75 (%42) | **0,75 (%58)** | 0,54 |
| tabla üstü | 0,795 | 0,795 (%61) | 0,57 |
| tabure oturağı | 0,555 (%31) | 0,45 (%35) | 0,40 |

### BU TURDA YAPILAN (yalnız PLAN ölçüsü)
| | D-074 | D-075 |
|---|---|---|
| tabure ölçeği | 1,11 (oturak 0,555 · çap 0,83) | **0,90** (oturak 0,45 · çap 0,675) |
| ikili masa | 1,00 → 1,20 | **0,90 → 1,05** |
| dörtlü masa | 1,10 → 1,75 | **1,05 → 1,68** |
| banket: masa ↔ ada | 1,85 (boşluk 0,10) | **2,00** (boşluk 0,225) |
| banket: sandalye | 2,95 | **3,02** (masayla arası 0,16 korunur) |

`tableHalf` 0,875 → 0,84 · `deuceHalf` 0,60 → 0,525. Koridordaki yükseltme noktası (`aisleDz`
3,50) **yerinde bırakıldı**: 3,65'e çıkarılınca güney yüzündeki nokta `waiter` pad'inin dairesine
giriyordu (2,26 < 2,30) — `layout-b32` bekçisi yakaladı.

### AÇIK KALAN — kullanıcıya soruldu
**Masa YÜKSEKLİĞİ 0,75'e dokunulmadı.** D-073'te kullanıcı kararıyla maketten alınmıştı ve ölçü
katmanının dondurulacak listesinde. Oranı asıl bozan o; iki çıkış var ve ikisi de kullanıcının:
**(a)** masa yüksekliği 0,75 → ~0,60 (mobilya karaktere uyar, maketten sapılır),
**(b)** karakter 1,30 → ~1,75 (maket aynen kalır, karakter büyür — koltuk/pad/kamera mesafeleri
yeniden ölçülür). Karar verilmeden ölçü DONDURULMAMALI.

**Testler:** 281/281 yeşil. "banket birim geometrisi maketle birebir" testi yeniden yazıldı:
artık sabit sayıları değil **sırayı ve boşlukları** bekçiliyor (ada → masa → sandalye → koridor,
her aralık > 0,10). tsc + eslint + build temiz, smoke 28/28.

---

## D-076 — KARAKTER 1,29 → 1,75 (aktör ölçüsünün tek kaynağı)
**Tarih:** 2026-09-08 · **Karar:** kullanıcı, D-075'in (b) seçeneği.

### Verilen üç karar (BM adım 3-4'ün önündeki tıkaç)
| # | soru | karar | kod etkisi |
|---|---|---|---|
| 1 | arka bant AÇIK mı kalsın (servis köşesi + merdiven kovası salondan görünüyor) | **açık kalsın** | yok — mevcut hâl |
| 2 | kamera fov 50 · 42 · 34 | **50 kalsın** | yok — mevcut hâl |
| 3 | mobilya/karakter oranı: mobilyayı kıs ↔ karakteri büyüt | **karakteri büyüt (1,75)** | bu bölüm |

Karar 3'ün gerekçesi kullanıcının kendi kuralı: *oranı mobilyayı kısarak kovalama.* Böylece
D-073/D-074/D-075'te dondurulan mobilya sayıları (masa 0,75 · tabla üstü 0,795 · tabure oturağı
0,45 · aralık 6,40) **hiç değişmedi**; değişen yalnız aktör tarafı.

### ÖLÇÜM — "karakter boyu" diye tek bir sayı hiç yokmuş
Beş gövde, beş farklı boy, **ikisi zemine gömülü** (koddan okundu, `tools/shot-oran.mjs` doğruladı):

| aktör | author boy | zeminden GÖRÜNEN | kusur |
|---|---:|---:|---|
| sahip | 1,29 | 1,29 | — |
| garson | 1,24 | 1,17 | kapsül 0,07 zeminin altında |
| bulaşıkçı | 1,24 | 1,17 | aynı kapsül |
| müşteri | 1,20 | **0,60** | kapsül y=0'da MERKEZLİ → yarısı gömülü |
| çaycı | 1,08 | 1,08 | belirgin kısa |

Müşterinin gömülmesi instancing'den (ff417dc) ÖNCE de vardı; küçükken "oturuyor" gibi
okunduğu için aylarca görünmemiş. Yürüyen müşteri de aynı miktarda gömülüydü — numara değil kusur.

### ÇÖZÜM — `src/config/actor.ts` (yeni, TEK KAYNAK)
`ACTOR_HEIGHT = 1,75`; gövdeler yazıldıkları ham boyda kalır, **mount noktasında** `actorScale()`
ile hedefe çekilir. Gövdeyi düzenleyen `AUTHORED_HEIGHT`'ı da günceller, test bunu bekçiler.

**İki gövde ailesi, iki kural** (ilk turda hepsi düzgün ölçeklendi ve kapsüller **blob**'a döndü —
yarıçap 0,30 → 0,44 = 88 cm omuz, oturunca tabureyi yutuyorlardı; kare `oran-sonra-masa.png`):
- **PARÇALI gövde** (sahip · çaycı): omuz/kol/baş kendi tasarımı → **düzgün ölçeklenir**.
- **KAPSÜL gövde** (garson · bulaşıkçı · müşteri): **boyuna uzar, enine ŞİŞMEZ**.
  `CAPSULE_RADIUS = 0,30` (60 cm genişlik = gerçek omuz + low-poly payı); `authoredRadius(kind)`
  gövdenin içine yazılacak ham yarıçapı verir, mount ölçeği uygulanınca tam 0,30'a gelir —
  böylece tepsi gibi aksesuarlar gövdeyle ölçeklenip elde kalmaya devam eder.

### TÜREYEN SAYILAR
| sayı | eski | yeni | gerekçe |
|---|---:|---:|---|
| `playerRadius` | 0,35 | **0,47** | sahibin PARÇALI gövdesi enine de büyüdü (omuz 0,29 → 0,39) |
| `actorRadius` | 0,28 | **0,28** | kapsüller enine büyümedi → nav'ın gördüğü kesit aynı |
| `REACH_TABLE` | türetik | türetik | formül değişmedi (`tableHalf + actorRadius + NAV_CELL + 0,05`) |
| `chairHalf` | 0,30 | **0,30** | footprint TABURENİN; aktör collision katısı DEĞİL (yorum düzeltildi) |
| kamera bakış y | 0,60 | **0,80** | gövdenin aynı oranı (%46) |
| kamera mesafesi | 8,5 | **8,5** | o sayı ODANIN kadrajı (D-061); oda büyümedi — karakterin kadrajda %36 büyümesi işin AMACI |
| `SEATED_DROP` | (yok) | **−0,45** | kapsül oturamaz: oturan müşteri iner, baş tepesi ≈ 1,30 (tabure 0,45 + oturma 0,85) |
| baloncuk y | 1,10 | **1,90** (+drop) | baştan türer |

### KABUL KRİTERİ (sayı listesi — D-072'nin kuralı) → `tests/actor-scale.test.ts`
| oran | 1,29'da | 1,75'te | gerçek hayat |
|---|---:|---:|---|
| tabla üstü / boy | %62 | **%45** | %43 |
| tabure oturağı / boy | %35 | **%26** | %26 |
| kapsül yarıçapı / boy | (ölçeklenseydi %25) | **%17** | insan siluetinde |

**Testler:** vitest **300/300** (281 → +19: yeni bekçi dosyası) · smoke **28/28** ·
tsc + build temiz · eslint'te yeni hata yok (kalan 19'un hepsi dokunulmayan eski dosyalarda).
**Kareler:** `docs/gorsel/ss/oran-once-*.png` ↔ `oran-sonra-*.png` (`node tools/shot-oran.mjs`).

---

## D-077 — ÖLÇÜ DONDURULDU (bekçi testli)

**Tarih:** 2026-09-08 · **Faz:** BM adım 6 (Faz B'nin son adımı) · **Kullanıcı onayı:** *"evet,
bekçi testli dondurmayla devam et"*

**Karar:** D-072'nin 1. katmanı (ölçü/ankraj) **dondu**. Dondurma bir belge değil bir **TEST**:
`tests/olcu-donduruldu.test.ts` (163 bekçi) canlı kodun türettiği her ankrajı dondurulmuş sayıyla
karşılaştırır. İnsan tarafı `docs/olcu-donduruldu.md`.

### Neden test, neden belge yetmedi
"Ölçüyü değiştirme" yazılı bir kural olarak D-072'den beri vardı ve **üç turda üst üste ihlal
edildi** (D-074 · D-075 · D-076'da mobilya ölçüsü üç kez değişti). Yazılı kuralın yakalayamadığı
şey sessiz sapmadır: bir cila turu `STOOL_S`'i 0,90 → 0,85 çekse hiçbir test kırılmaz ve katman
2'nin denge ölçümü yanlış zemine oturur. Bekçi mutasyonla doğrulandı (0,85 denendi → 2 test kırıldı,
biri de türev `tabure.oturakUstu`).

### Liste İKİNCİ BİR DOĞRU KAYNAK DEĞİL
Çalışan kod kendi dosyalarından okumaya devam ediyor (`actor.ts` · `camera.ts` · `layout.ts` ·
`tableLook.ts` · `wallPanel.tsx`); test o dosyalardan **türeyen** değeri dondurulmuş sayıyla
karşılaştırıyor. Tablo yalnız testin gördüğü fotoğraf.

### Dondurmanın AÇTIĞI iki kusur (ikisi de "bekçilenemiyordu" sınıfı)
1. **Kamera ölçü katmanındaydı ama test edilemiyordu.** fov/mesafe/clamp `Scene.tsx`'in `useFrame`
   gövdesinde gömülüydü ve Scene.tsx vitest'te import EDİLEMEZ (Canvas + `recolor` → `Image`).
   → **`src/config/camera.ts`** açıldı (`actor.ts` deseni): `CAMERA_FOV 50` · `CAMERA_DIST 8,5` ·
   `PORTRAIT_CLAMP 1,3` · `ZOOM_OUT_MUL 1,35` · `FOCUS_MUL 0,72` + `cameraDistance(aspect)`.
   `CAMERA_LOOK_Y` bilerek `actor.ts`'te kaldı — o sayı kameranın değil AKTÖRÜN türevi.
2. **Tabure ölçeği aynı sebeple bekçisizdi** (`Tables.tsx` → `Image`). `STOOL_S/STOOL_REF` +
   ölçülen `TABLE_TOP_Y 0,795` + türev `STOOL_SEAT_Y 0,45` **`tableLook.ts`**'e taşındı (o dosya
   zaten "ölçek eşlemesi React'siz olsun" diye ayrılmıştı). `actor-scale.test.ts` bu sayıları artık
   elle yazmıyor, oradan okuyor — aynı sayı iki yerde durursa biri değişip diğeri kalabilirdi.

Ayrıca `NAV_CELL` export edildi (ankraj) ve `layout.ts`'teki bayat yorum düzeltildi
(`actorRadius` "(0,40)" yazıyordu, değeri 0,28 — ilk turdan kalma).

### Dondurulan (7 blok, 42 sayı + 21 nokta)
kat kabuğu (17 · 3,20 · 2,65 …) · mobilya (1,68 · 1,05 · 0,90 · 0,795 · 0,45 …) · yerleşim ritmi
(küme aralığı 6,40 · banket birimi) · aktör (1,75 + türeyen yarıçaplar) · kamera (fov 50 · 8,5) ·
nav/erişim (0,30 · 1,47 · pad yarıçapları) · noktalar (pad'ler · kapı · servisin iki dönemi).

**Kasten DONMAYAN:** dekor koordinatları · renk/materyal/ışık · `economy.config.ts` (katman 2'nin
konusu; ölçü donduğu için artık ölçülebilir).

### Değiştirme yolu (testin başlığında da yazılı)
kullanıcı kararı → `decisions.md` D-xxx → testteki değer + `karar` alanı → belge.
Testi susturarak ya da toleransı gevşeterek geçilmez. Belge ile liste arasındaki sapmayı da bir
bekçi tutuyor: her ankraj adı `docs/olcu-donduruldu.md`'de geçmek zorunda (biçim değil VARLIK).

### Maket arşiv damgası
`docs/maket/README.md` başına damga: **maket v13'ün Kat 1 ölçü kaynağı olarak işi bitti.** Maketler
program/sıra/atmosfer için okunmaya devam eder ama **yeni sayı transkribe edilmez** — oyunun odası
maketinkinden 0,5 geniş, karakteri 1,75 (maketinki 1,80). Kalıcı ders D-075'ten: *maketten ölçü
almadan önce insan boyunu karşılaştır.*

**Testler:** vitest **463/463** (300 → +163 bekçi) · smoke **28/28** · tsc + build temiz ·
eslint tabanı zaten kırık (122 ayrıştırma hatası, sebep bayat `.claude/worktrees/maket-tasima`;
dokunulan dosyalarda yeni hata yok).

---

## D-078 — FAZ C1: ölçü donduktan sonraki TEK denge ölçümü

**Tarih:** 2026-09-08 · **Faz:** C, 1. oturum · **Rapor:** `docs/denge-raporu-c1.md` ·
**Ham çıktı:** `docs/denge-olcum-c1.txt` · **Önkoşul:** D-077

**Neden:** D-073 masa aralığını 3,20 → 6,40 yaptı; `simulate.ts` yürüme sürelerini canlı
`layout.ts` + gerçek BFS ile hesapladığı için (`getNavGrid`/`REACH_TABLE`/`findNavPath`) tempo
tablosunun tamamı geçersiz sayılmıştı. Ölçü D-077'de donduğu için artık TEK KEZ ölçülebilir.

### Bulgu 1 — geometrinin bedeli ÖLÇÜLDÜ ve KÜÇÜK
Yollar %2-6 uzadı (19,6 → 20,7 br), taşıma kolu %4 zayıfladı (L6/2 garson 13,13 → 12,57 ₺/sn),
**zincir 5,08 → 5,12 sa (+%0,8)**. Darboğazın kim olduğu HİÇBİR satırda değişmedi.
Sebep: uzayan mesafe ön çeyrekte MASALAR ARASI; garsonun turunu belirleyen servis→masa ekseninde
kat büyümedi. **Geometri donması dengeyi bozmadı** — yeni taban bu, eski sayılar arşiv.

### Bulgu 2 — tempo denetiminin ÜÇTE İKİSİ ölçülmüyormuş
`simulate.ts` üç ölçütü de yazıyordu ama yalnız birincisini ÖLÇÜYORDU; kalan ikisi düz yazıydı ve
göz kararıyla bakılıyordu. Üçü de ölçülür oldu (**denge sayısına dokunulmadan**):
| ölçüt | ölçülen | |
|---|---|---|
| ilk satın alma < 90 sn | 22 sn | ✓ |
| ilk 5-10 dk her ~20-40 sn bir alım | medyan boşluk **1,4 dk**, en uzun 3,7 dk | ✗ |
| otomasyon < 15 dk | 6,1 dk | ✓ |
İlk 10 dk'de 8 alım var, hedef ~15-30 demek. **AÇIK SORU (kullanıcı kararı):** ölçüt geçerli mi
(açılış ucuzlar) yoksa bayat mı (D-010 §3.6 güncellenir; `feedback_economy_pacing_offline`'ın
"garson öncesi ucuz, sonrası ölçülü pahalı" kuralı tek ölçüt kalır — bugünkü eğri zaten onu yapıyor).

### Bulgu 3 — "PLATO" YOK. Rapor bir kez yanlış yazıldı ve düzeltildi
İlk hâli B5b'nin bulgusunu DEVRALIP *"L6'dan sonra oran 15,62 ₺/sn'de donuyor"* diyordu. Çıktı
çürüttü: lavabo açıldıktan sonra oran **12,57 → 19,40 → 31,09 → 52,57 ₺/sn**. Plato **B4a'da
kapatılmıştı** ve kapalı; oda tavanından sonra oran donuyor ama zincirin bitmesine 6 dk kalıyor.
**Yanlış inancın kaynağı simülatörün KENDİ TABLOSU:** `ÜÇ KOL` senaryolarında `lavabo` alanı hiç
verilmiyordu (hepsi lavabo = 0) → geç-oyun gelirini **3,4 kat eksik** gösteriyor ve kapanmış bir
bulguyu açıkmış gibi okutuyordu. Tam kadro satırı lavabosuyla eklendi (raporlama düzeltmesi,
denge sayısı değişmedi); darboğaz iki satırda da ARZ (0,78 bardak/sn).

**DERS: devralınan bir bulgu, yeni yazılan bir tahmin kadar bayatlar.** B5b "ölçmeden yazılan her
cümle bir varsayımdır" demişti; buradaki cümle tahmin değil GERÇEK BİR ÖLÇÜMÜN devralınmasıydı ve
aradaki B4a turuyla geçersizleşmişti. Üstelik sim'in tablosu onu doğruluyor gibi görünüyordu.

### Kapanan / duran kalemler
- **Kapandı:** B5b Ö6 — `waiter3` artık `optional: false` + görev hattında `q_waiter3` var.
- **Duruyor (bilinen):** `servis L6` 23,4 dk (merdivenin son basamağı, bilerek) · `masa seviyesi
  L4` 21,4 dk (**sim kusuru**: tüm masalar TEK kalemde yükseliyor, oyunda masa-başı alınıyor).

### Faz C'nin kalan işi (bu ölçümden sonra netleşen)
Tek Odak kuralının delinmesi · sipariş kuyruğunun hiç ölçülmemesi (D-046'nın "hiçbir masa X sn
beklemedi" iddiası teste yazılmadı) · sim'in gerçeğe yaklaşması (masa-başı yükseltme · bardak
döngüsü · sabır) · açılış temposu kararı.

**Pano defteri düzeltildi:** dondurma Faz B'nin işiydi ama faz 12/12 kapatılmıştı → **B 13/13,
toplam 72 → 73**, kilometre taşları 57/71 → 58/72. Bütçeyi doğru göstermek, kapanmış görünmesinden
önemli. Pano 56/73: https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a

**Testler:** vitest 463/463 · tsc + build temiz. Denge sayısı DEĞİŞMEDİ.

---

## D-079 — Açılış temposu ölçütü BAYAT ilan edildi ve güncellendi

**Tarih:** 2026-09-08 · **Faz:** C1 · **Kullanıcı kararı:** *"b, ölçütü güncelle"*

**Eski ölçüt (D-010 3.6, ölçüt 2):** *"ilk 5-10 dk her ~20-40 sn bir alım (sık dopamin)"*.
C1'de ilk kez ÖLÇÜLDÜ ve tutmadı: ilk 10 dakikada **8 alım**, medyan boşluk **1,4 dk**.

**Neden bayat:** o ölçüt oyunun ilk günlerinden (kat 21 x 21, tek salon, dört masa) ve sonraki
kullanıcı kararıyla **çelişiyor**: `feedback_economy_pacing_offline` → *"garson öncesi ucuz,
garson sonrası ölçülü pahalı"*. Bugünkü eğri tam olarak ikincisini yapıyor (garson 6,1 dk).
İki kural aynı anda tutulamaz; yeni olan kullanıcının kendi kararı.

**Yeni ölçüt 2:** **garsona kadar hiçbir alım boşluğu 2 dakikayı aşmaz.**
Ölçülen: 6 alım, medyan 1,4 dk, **en uzun 1,6 dk** ✓ (marj %20 — açılış pahalılaşırsa bekçi öter).
Garson SONRASI tempo zaten ayrı bekçide: "20 dk'yı aşan alım kalmasın" (EN UZUN BEKLEME).
İki ölçüt birlikte kuralın iki yarısını tutuyor.

**Uygulandı:** `tools/simulate.ts` (ölçüt 2 yeniden yazıldı, `OPENING_GAP_MAX = 2 * 60`) ·
`docs/progression-and-economy-v2.md` 3.6 · `docs/economy.md` 4 · `docs/denge-raporu-c1.md` 2.

**HİÇBİR DENGE SAYISI DEĞİŞMEDİ** — değişen yalnız ölçüt. Tempo denetiminin üç ölçütü de artık
yeşil ve üçü de gerçekten ÖLÇÜLÜYOR (C1'den önce yalnız birincisi ölçülüyordu).

---

## D-080 — Tek Odak'ın dördüncü kanalı: nokta silinmez, SES katmanlanır

**Tarih:** 2026-09-08 · **Faz:** C2 · **Kullanıcı kararı:** *"Katman ayrımı"*
**Rapor:** `docs/tek-odak-c2.md` · **Ölçüm:** `tools/olcum-tek-odak.ts` → `docs/olcum-tek-odak.txt`

### Devralınan bulgunun YARISI bayat çıktı
C1 raporu Faz C'nin kalan işini *"opsiyonel pad'ler VE yükseltme dolumları görev filtresinin
dışında çiziliyor"* diye yazıyordu; cümle D-038'den (2026-09-05) devralınmıştı. Ölçüldü:
**`optional:true` pad KALMAMIŞ** (26 pad'in hepsi `false`; son kalan `waiter3` C1'de omurgaya
alınmıştı) → `availableOptionalPads` her çağrıda boş dönüyor, **pad işareti en çok 1**.
D-078'in dersi ikinci kez tuttu: *devralınan bulgu, yeni yazılan tahmin kadar bayatlar.*

### Ölçülen gerçek delik
Ekranda **ortalama 7,8 · en çok 16** zemin işareti (tek salonda 12); durumların **%90'ında** birden
çok. Kaynağı neredeyse tamamen **masa yükseltme noktaları** (ort. 7,82). Ama asıl kusur sayı değil:
aktif adımın işareti ile bir masa noktası **aynı bileşen, aynı boy, aynı yazı ağırlığı** — tek fark
halka rengi. Yani "hangisi ŞU ANKİ adım" okunmuyordu. Kadraj bunu doğruladı: tek ekranda altı halka,
hepsinde aynı kelime ("Masa"), alt bant başka şey diyor ve o hedefin işareti kadrajda yok.

D-038'in dört kanalından **üçü zaten tek görevden türüyordu** (alt bant · kamera odağı · kenar oku);
delinen yalnız dördüncüsü, dünyadaki işaret.

### Karar: silme, katmanla
D-038'in lafzı ("yalnız aktif adım çizilir") sonraki kullanıcı kararıyla ÇELİŞİYORDU
(`feedback_upgrade_per_object`: her masanın noktası kendi yanında, My Hotel modeli). Harfiyen
uygulamak o noktaları silmek olurdu. Kullanıcı **katman ayrımını** seçti — nokta kalır, ses ayrılır:

| katman | görünüm | ne zaman |
|---|---|---|
| `aktif` | yazı + maliyet + TAM parlak halka + hafif nabız | aktif adımın ankrajı (en fazla 1) |
| `konusan` | yazı + maliyet, nabız yok | oyuncu 3,2 br yakınında |
| `sessiz` | küçük (0,55×), YAZISIZ halka; dolum yayı durur | gerisi |

**Sonuç ölçüldü: çizilen 16 → aynı anda KONUŞAN en çok 3** (ortalama 2,39), ve bunların
**en fazla biri aktif**.

### Yapısal kısım (asıl iş bu)
`src/game/activeStep.ts` açıldı: `activeStep` singleton'ı **Scene'in `QuestPointer`'ı tarafından,
kenar okuyla AYNI `questFocusPos` çağrısından** yazılıyor. Böylece dördüncü kanal da öbür üçüyle tek
kaynaktan besleniyor — iki kanalın ayrı hesaplayıp ayrışması artık mümkün değil. `markerTier` saf
fonksiyon (vitest edilebilir); `GroundMarker` her karede onu çağırıp `useFrame` içinde damp'liyor,
React'e dokunmuyor (her kare setState = 60 render/sn olurdu).

### Bekçi: `tests/tek-odak.test.ts` (13 test)
1. `markerTier` davranışı — aktiflik MESAFEDEN değil aktif adımdan gelir.
2. **En fazla bir aktif** — ankrajlar pairwise ayrı (tek kasıtlı istisna: lavabo pad'i ile lavabo
   yükseltme noktası aynı noktada, ikisi asla birlikte çizilmez; onu ayrı bir bekçi tutuyor).
3. **Her işaretli görev hedefi tam bir ankraja oturur** — `questFocusPos` ile işaretlerin çizim yeri
   ayrışırsa aktif işaret sessizce HİÇ yanmaz; korunan sessiz sapma budur.
4. Yakınlık bütçesi (tavan 4: yürüyüşte ölçülen 3 + kümenin yanına düşebilecek 1 pad).

**Mutasyonla doğrulandı:** `SPEAK_RADIUS` 3,2 → 4,5 → bütçe bekçisi kırıldı; `questFocusPos`'un
`stationLevel` dalı `upgradeSpot` → `station` → ankraj bekçisi kırıldı. İkisi de geri alındı.

**Kareler:** `docs/gorsel/ss/tekodak-once-*.png` ↔ `tekodak-*.png` (`node tools/shot-tek-odak.mjs`).
**Doğrulama:** vitest **476/476** (463 → +13) · smoke **28/28** · tsc + build temiz · dokunulan
dosyalarda eslint temiz. **Hiçbir denge sayısı değişmedi.**

**Yan kazanç:** bayat `.claude/worktrees/maket-tasima` worktree'si silindi (D-077'nin temizlik
kalemi) → eslint tabanı **122 ayrıştırma hatasından 19 gerçek lint hatasına** düştü.

**Donmayan:** `SPEAK_RADIUS` (3,2) · `SILENT_SCALE` (0,55) · nabız genliği — üçü de KATMAN 3
(sunum), dondurulmuş ölçü değil. Masa sütun aralığı 3,20 olduğu için eşik oraya oturtuldu:
iki masanın arasında durunca ikisi de konuşur (seçim anı), üçüncüsü susar.


## D-081 — Garson üstlenmesi BAĞLAYICI (D-046 ②'nin uygulanması) (2026-09-08)

**Karar:** Garson bir masayı üstlenince, o masaya **teslim edene kadar** bırakmaz. Üstlenme yalnız
şu hâllerde düşer: müşteri kalktı · masa kirlendi · tepside o ürün kalmadı · tepsi boşaldı · boşta
kalındı. Öncelik ③'teki gibi **en acil** kalır (ilk seçim değişmedi). İkinci parça: **önceki karenin
üstlenmeleri, bu karenin yeni seçimlerinden ÖNCE yer tutar** — yoksa bağlayıcılık yarım kalır,
1. garsonun taze seçimi 2. garsonun yolun yarısında olduğu masayı kapar.

**Gerekçe:** D-046 (2026-09-06) bu kuralı zaten yazmıştı ama **kodda karşılığı yoktu**: `claimed`
kümesi yalnız o kare için tutuluyor, hedef her karede yeniden seçiliyordu. C3'te ölçüldü
(`docs/kuyruk-raporu-c3.md`, `tools/olcum-kuyruk.ts`): garson ilk durağına giderken hedefinden
**başlangıç mesafesinin 5,6 katı** kadar uzaklaşabiliyor, tam turu modelin beklediğinin **2,35
katına** çıkıyordu. Ayrıca ③ tek başına amacını (starvation) **karşılamıyordu** — mesafe↔terk
korelasyonu +0,53…+0,83.

**Kullanıcı kararı:** ölçülen beş seçenek arasından **"bağlayıcı + acil"**. Debi ile adalet ters
yönde çalışıyor ("yakın" en hızlı ama korelasyon 0,96); seçilen seçenek **en adil** olan ve
bugünkünden de hızlı — yani yeni bir denge kararı değil, alınmış kararın uygulanması.

**Ölçülen etki (aynı tohum · aynı senaryolar):** servis edilen müşteri G3 101 → **124**,
G4 172 → **239**; mesafe↔terk korelasyonu G4 0,53 → **0,24**; gezinme G3 0,47 → **0,07**;
tam tur / model katı G4 ×2,35 → **×1,54**. G2 (tek garson · 8 masa) %11 debi kaybediyor —
kabul edilen takas, karşılığında o senaryonun terk yayılımı %58-100'den **%77-89**'a daralıyor.
**Beklenmeyen kazanç:** dt duyarlılığı %-9'dan **%+1,6**'ya düştü.

**Uygulama:** `Waiter.claim` (transient, kayıt şeması değişmedi) + `waiterSystem`'de ön-rezervasyon
ve üstlenme koruma. **Hiçbir denge sayısı değişmedi** (`economy.config.ts`'te yalnız bayat bir
yorum güncellendi).

**Bekçi:** `tests/kuyruk.test.ts` (6 test) — eşik listesi değil **davranış sözleşmesi**. Beş elle
kurulan durum + gerçek akışta her kareyi denetleyen bütün-akış testi. **İki mutasyonla
doğrulandı:** üstlenme koruma kaldırıldı → iki test kırıldı (akış testi ping-pong'u da gösterdi:
"masa 5 → 8", üç kare sonra "masa 8 → 5"); ön-rezervasyon kaldırıldı → ayrı test kırıldı.

**Kayda geçen tuzak:** akış testinin ilk hâli ocak L0 ile koşuyordu; o rejimde demleme kilitli
olduğu için kuyruk hiç doymuyor ve test **hiçbir mutasyonu yakalamıyordu** — üstelik uzun koşuda
vitest zaman aşımına düşüp "kırıldı" gibi görünüyordu (sahte yakalama). *Bir bekçinin kırılması,
onu KIRAN şeyin ne olduğu doğrulanmadan yakalama sayılmaz.*

**Açık kalan:** ④ (sabır sipariş boyuna bağlı) hâlâ kaba hâlde, ⑤ (garson sayısı türetilir + HUD
uyarısı) yok, sipariş nesnesi bilerek v1.1'de.

**Doğrulama:** vitest **482/482** (476 → +6) · smoke **28/28** · tsc + build temiz · dokunulan
dosyalarda eslint temiz.

## D-082 — Erken oyun BARDAK KİLİDİ ayrı kalem açıldı (2026-09-08)

**Karar:** 4 masa · bulaşıkçı yok · oyuncu yokken karelerin **%90,8'inde temiz bardak sıfır** ve 15
dakikada yalnız **18 müşteri** oturuyor (C3 ölçümü §5). Kullanıcı bunu tasarım gereği saymadı:
*"sorun, ayrı kalem olarak incelensin"* — oyuncu telefonu bıraktığında mekânın tamamen durması
istenmiyor.

**Kapsam (sonraki tur):** bardak havuzu boyu (`cups.poolBase/poolPerLevel`) · bulaşıkçının
zincirdeki yeri (bugün 2. Alan'da, `dishwasher` pad'i) · ya da minimum sızıntı (AFK'da tam durmasın).
Karar verilmeden **hiçbir denge sayısına dokunulmaz**; önce ölçülür (C3 deseni).

**Not:** bu bir garson/kuyruk kalemi DEĞİL — C3 ölçümünde G1'in taşıma değil bardak kolunda
kilitlendiği ayrıştırma sayesinde ortaya çıktı (darboğaz ayrıştırması olmasaydı sayı yanlış kola
yazılırdı).

## D-083 — Boşta kalan GARSON bulaşık toplar (D-082'nin cevabı) (2026-09-08)

**Karar:** Servis edecek kimsesi kalmayan garson, bekleme noktasına dönmek yerine masadan **tek**
kirli alır, leğende yıkar, servise döner. Elinde ürün varken kirliye başlamaz; elinde kirli varken
tezgâha yüklemeye gitmez (ürün ile kirli aynı anda taşınmaz).

**Gerekçe (ölçüm):** `docs/bardak-raporu-c4.md` · `tools/olcum-bardak.ts`. Bardak KAPALI bir
sistemdir, temiz bardağın tek kaynağı yıkamadır ve bulaşıkçı zincirde 8. paddir. Oyuncu elini
çektiğinde 4 masalı mekân 15 dakikada 12 müşteri (= tam havuz kadar) ağırlayıp **dakika 3'te
KALICI olarak duruyordu** — üç ayrı tohumda birebir aynı, yani zarın değil yapının sonucu.
- **Havuz boyu çıkmaz sokak:** havuz ×2 ve ×4'te debi **0,80 servis/dk'da sabit** (kilit "bardak
  bitti"den "masa kirlendi"ye taşınıyor, o kadar).
- **Servise ORANTILI çare de çözmüyor** ("müşteri bardağını götürsün": %25'te SIFIR fark, %50'de
  bile son çeyrek %100 kilitli). Servis durunca çare de durur.
- Kilidi ancak **servisten BAĞIMSIZ** bir kaynak açar.

**Kullanıcı kararı iki adımda oluştu:** önce "sabit sızıntı 2/dk" seçildi (bardak kendiliğinden
temize dönsün), sonra kullanıcı *"garsonlar hem bulaşıkçı hem çaycı gibi davransa?"* diye sordu ve
*"sen mantıklı olanı yap"* dedi. Garson kolu ölçüldü, en iyisi çıktı, sızıntı kolu ELENDİ.
Ardından kullanıcı otomasyon beklentisini netleştirdi: *"bulaşığı ben yapmak istemiyorum, bir süre
sonra otomatize olmalı."*

**Tetik neden GENİŞ (dar tetik denendi ve bırakıldı):** ilk uygulama yalnız "temiz bardak bitince"
tetikleniyordu. Ölçüm gösterdi ki dar/geniş tetik **AFK debisinde neredeyse aynı** (B2 6,80 ↔ 7,27);
fark OYUNCU OYNARKEN: dar tetikte bulaşık hep oyuncuya kalıyordu — yani kullanıcının istemediği şey.
Geniş tetikte otomasyon takvimi net: `q_wash` (~3 dk) elle öğretir → **garson (6-11 dk) boş
vaktinde devralır** → bulaşıkçı (~33 dk) mekân doluyken de devralır. Kısmi assist (D-014) korunur:
mekân doldukça garsonun boş vakti biter, oyuncu yine gerekir.

**Doz 1 bardak, ÖLÇÜLEREK seçildi** (7 masa · AFK): taşıma 1 → **5,53 servis/dk · terk %38,7 ·
son çeyrek %14,6** · taşıma 2 → 2,87 · %56,1 · %100 · taşıma 4 → 2,47 · %62,2 · %100. Sebep: garson
kirliyi alınca leğene kadar bağlanıyor, tek bardak = kısa taahhüt = servise hemen dönüş. Büyük leğen
**bulaşıkçının ayrıcalığı** olarak kalıyor (2→8).

**Ölçülen etki (AFK · park):** B2 (4 masa) 0,80 → **7,53** servis/dk, terk %33 → **%5**, kalıcı ölüm
kalktı · B3 (7 masa) 1,40 → **5,53**, terk %72 → %38,7 · B4/B5 (bulaşıkçılı) pratikte değişmedi.

**GEÇ OYUN ZATEN TAM OTOMATİK — eski "vergi" cümlesi bayattı.** 20 masada bulaşıkçının leğen VE hız
yükseltmeleri TAVANDAYKEN temiz bardak 0 olan kare **%0,0** (servis 18,87/dk); ölçtüğüm %22'lik
darboğaz **yükseltmeleri alınmamış** bulaşıkçınındı. Yani 10.300 ₺ ödendiğinde bulaşık işi tamamen
oyuncudan çıkıyor. Kalan %66 terk bardak değil **taşıma** darboğazı (C3'ün bilinen kalemi).

**BEKÇİLERİN YAKALADIĞI ÜÇ GERÇEK DELİK** (üçü de kural yazıldıktan SONRA, test sayesinde):
1. **Kural kilidi hiç açmıyordu:** temiz bardak bitince garson tezgâha gidip *asla gelmeyecek* çayı
   bekliyor, "boşta" sayılmıyordu → `demlemeKilidi` (*hazır 0 + temiz 0 ⇒ yükleme beklemesi
   anlamsızdır*).
2. **Çayla kirli aynı anda taşınabiliyordu:** bekleyenlerin HEPSİ kirli masadaysa `waiting` boşalır
   ve garson elinde çayla bulaşık dalına düşerdi (iki tepsi görseli üst üste binerdi) → `urunVar`.
3. **Elde kirliyle tezgâha yükleme:** aynı kaynaktan ikinci yol → yükleme dalına da koşul.

**Uygulama:** `economy.config.ts` → `waiter.idleDishCarry: 1` (TEK yeni denge sayısı) ·
`tick.ts/waiterSystem` · `types.ts` → `Waiter.dirtyCarry`/`dirtyCarryFood` (transient, kabın türü
korunur) · `Waiter.tsx` + yeni `carriedDirty.tsx` (taşınan kirli GÖRÜNÜR; çizim bulaşıkçıyla ORTAK).
**Düzeltme:** garsonun yıkadığı `stats.dishesWashed`'e YAZILMAZ — o sayaç oyuncunundur (`q_wash` +
"Temizlik" başarımı + XP); bulaşıkçı da yazmıyor, aynı kural.

**Bekçi:** `tests/bardak.test.ts` (3 test) — ① servis önce gelir + karışık taşıma yok ② boşta kalınca
toplar ve yıkar ③ AFK'da mekân kalıcı olarak durmaz **ve aynı test kuralı kapatıp mekânın gerçekten
öldüğünü kanıtlar**. **Dört mutasyonla doğrulandı**, dördü de bekçiyi kırdı. Korunum her karede
denetleniyor (bardak yoktan var olmaz/yok olmaz).

**`tests/logic.test.ts` güncellendi:** kirli-masa testi "50 kare sonra hâlâ bekliyor" diyordu; garson
artık masayı temizleyip servis ettiği için kurulum sabit durmuyor. Test kuralın KENDİSİNİ ölçüyor:
*masa o an kirliyken servis olamaz*, her karede.

**Kayda geçen tuzaklar (ölçüm aracının kendi hataları):** ① bot sokakta başlatılmıştı,
`clampToOpenAreas` yüzünden hiç içeri giremedi, sonuçlar park kipiyle BİREBİR aynı çıktı —
"oyuncunun faydası yok" diye okunabilirdi ② bulaşıkçı varyantında config geri alma `kur()`'dan hemen
sonraydı, `world` her karede yeniden türetildiği için varyant sessizce etkisiz kaldı ve **sahte bir
"fark yok"** üretti ③ uzun bekçi koşusu paralel takımda zaman aşımına düşüp "kırıldı" gibi göründü
(C3'ün aynı tuzağı) — sıcak döngüden `expect` çıkarıldı ④ elle kurulan durumda hiç tetiklenmeyen bir
değişmez mutasyonu YAKALAMADI; gerçek akış testine taşınınca yakaladı.

**Açık kalan (bu turun kalemi değil):** nav ızgarası (`actorRadius`, sandalyesiz) ile oyuncu
çarpışması (`playerRadius`, sandalyeler katı) aynı dünyayı görmüyor — personelin geçtiği boşluktan
oyuncu geçemiyor (Faz D kalemi).

**Doğrulama:** vitest **485/485** (482 → +3) · smoke **28/28** · tsc + build temiz.

---

## D-084 — Oturum akışı: varyant kapısı + tek-kaynak belge + tur kartı (2026-09-08)
**Karar (kullanıcı, dört soru da önerilen seçenekle):** oturum akışı ölçülerek yeniden kuruldu.
① Denge/tick değişikliği, raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz;
kilit sıraya gömülü — **commit #1** (araç + ham çıktı + rapor, karar bölümü BOŞ) → karar paketi →
**commit #2** (kod + bekçi + final koşu). ② Ölçüm koşusu `OLCUM=kisa|tam`; tam koşu yalnız taban ve
final. ③ Her bilgi bir yerde: sayı → rapor · karar ≤ 12 satır → bu defter · durum → progress'te
1-2 satır · anlatı → hiçbir yerde ikinci kez. ④ `activeContext` = üzerine yazılan tur kartı (≤ 80
satır); geçmiş `memory-bank/arsiv/`'e.
**Belirleyici sayılar:** tam ölçüm koşusu **8 dk 02 sn** × 7 koşu = C4'ün 168 dakikasının **%33'ü**
(en büyük tek kalem) · C4'ün 11 anahtar sayısının **9'u dört markdown dosyanın dördünde de** var.
**Gerekçe:** C4'e "önce ölç, sonra sor" talimatı **yazılı girilmişti** ve yine ihlal edildi — yazılı
kural yetmiyor, kilit commit yapısına gömülmeli. Bekçi/mutasyon/final tam koşu **dokunulmadı**.
**Rapor:** `docs/oturum-akisi-mantik.md` (Fable 5.1, ölçümlü).

## D-085 — Kapanış otomasyonu: pano TÜREV, sıra kilidi MAKİNEDE (2026-09-08)
**Karar:** D-084'ün kalan parçası (P3) uygulandı. ① Pano sayaçları elle yazılmaz, `progress.md`
tablosundan **türetilir** (`npm run pano`); araç önce defterin dört sayı yerini (bütçe satırı ·
tablo · faz başlığı · kalem listesi) **bağımsız okuyup** karşılaştırır, tutmuyorsa panoyu YAZMAZ.
② Varyant kapısının commit sırası artık denetleniyor (`npm run sira`): denge dosyasına dokunan
ilk commit'ten önce bir ölçüm commit'i yoksa çıkış kodu 1. Uyarıdır, geri alma değil — sebep
`decisions.md`'ye yazılır. İkisi de `oturum-bitir` adım 2-3'e bağlandı.
**Belirleyici sayılar:** denetim ilk koşusunda **üç gerçek sapma** buldu (faz başlığı 1/2 ↔ tablo
2/3 · bütçesiz kalem P4 · kilometre taşı 73→76'da 75'te kalmış) · sıra kilidi gerçek geçmişte
sınandı: **C3 turu temiz, C4 turu ihlal** (D-084 tam o turdan doğmuştu) · **40 test, 9 mutasyon**.
**Gerekçe:** D-084 "yazılı kural yetmiyor" demişti; P3 aynı ilkeyi kapanışa uyguluyor. Anlatı
(özet · sıradaki · günlük kartı · faz açıklaması) türetilebilir değil, **elle yazılmaya devam eder**.
**Kayda geçen ders:** mutasyonların ilk turunda üçü kaçtı ve üçü de aracın **gerçek kusuruna**
işaret etti (sessiz seçim yapan kural · hiç test edilmemiş yazma yolu · ölü koşul) — kaçan mutasyon
testin değil kodun zayıf yerini gösterir. **Rapor yok:** denge değişmedi, ölçüm turu değil.

## D-086 — simulate.ts gerçeğe yaklaştırıldı: taşıma çok duraklı, masa kalem kalem (2026-09-08)

**Karar:** Modelin dört bilinen kusurundan **ikisi** yürürlüğe girdi, üçü ölçülerek elendi.
Yürürlükteki model = `k1b` (taşıma turu çok duraklı) + `k2` (masa yükseltmesi kalem kalem).

**Gerekçe (ölçüm):** `docs/sim-gercek-raporu-c5.md` · ham çıktı `docs/olcum-sim-kollar.txt`.
Sınav: modelin tahmini ile `olcum-kuyruk.ts`in **oyunun kendi tick'iyle** ölçtüğü G1-G4 debisi.
- Taban model 4 masada gerçeğin **%85'ini**, 20 masada **%169'unu** söylüyordu (ort. sapma %36) —
  "biraz iyimser" değil, erken oyunda kötümser + geç oyunda iyimser.
- `k1b` sapmayı **%36 → %8**'e indirdi ve **tek bir uydurma sabit kullanmıyor**: N bardaklık tepsi
  N ayrı masaya gider, mesafeler düzenin kendi BFS'inden (tur tabanın ~1,8 katı).
- `k2` C1 §4'ün sahte beklemesini kapattı: **21,4 dk → 4,5 dk**, başka hiçbir ölçüte dokunmadan.
- Uygulanan **birleşim de uygulanmadan önce ölçüldü** (`secilen`): %8 · 4,5 dk · açılış aynı.

**Elenenler, gerekçesiyle:**
- `k1a` (ölçülen oranı çarpan yapmak) — sapması %0 ama **totoloji**: çarpan kendi sınav
  sorularından aradeğerleniyor, örneklem dışı öngörüsü yok.
- `k4` (sabır) — ölçülen etki **SIFIR**. Talep hiçbir senaryoda bağlayıcı değil; doygun kuyrukta
  terk eden müşteri servis kapasitesini düşürmez. Kolun cevabı yapısal, tesadüfi değil.
- `k3` (bardak tavanı) — **ertelenmedi, düzeltildi ve yine de elendi.** Kullanıcı "işten kaçma"
  dedi; Bulgu 5'in iki kusuru (kirliye tam tur yazılması · sim'in bulaşıkçı merdivenini hiç
  almaması) kapatıldı, birleşim %46 → %15'e düzeldi ama **k1b'nin %8'inden hâlâ kötü**. Kalan
  sapmanın tamamı G1'de ve sebebi ölçüldü: orada modelin **taşıma tavanı zaten gerçeğin altında**
  (6,36 < 7,53 müşteri/dk). Kodu duruyor, G1 kalemi çözülünce yeniden ölçülecek.

**Kayda geçen iki ders:**
1. **Yanlış çözücü, doğru modeli çürük gösterir.** k3'ün sabit noktası `min` yinelemesiyle
   aranınca hep sıfıra iniyordu ve model "mekân tamamen kilitli" diyordu; ikiye bölme kararlı
   kökü buldu. Sayıdan önce sayıyı üreten yöntem sınanır.
2. **Kolları toplamak modeli iyileştirmiyor:** `hepsi` %15, parçalarının en iyisi %8. k1b ile k3
   aynı garsonun aynı boş vaktini iki kez kısıyor — kollar bağımsız değil.

**Açılan kalem (uygulanmadı, kullanıcı kararı):** model gerçeğe yaklaşınca *"20 dk'yı aşan tek
alım kalmasın"* ölçütü Normal profilde **2 → 6** ihlale düşüyor (en uzun 43,4 dk → `servis L6`).
Geç-oyun eğrisi `economy.config.ts`'e dokunur ve o kolun **ölçülmüş sayı satırı yok** — varyant
kapısı gereği kendi turunda ölçülecek. D-079'un açılış hükmü ise **dokunulmadan sağlam**: ilk üç
ölçüt yedi kolun hepsinde birebir aynı (22 sn · 1,6 dk · 6,1 dk).

**Bekçi:** `tests/sim-model.test.ts` — 17 test, **üç mutasyonla** doğrulandı (masalar-arası terim
silindi → 4 test · k2 geri alındı → 1 test · elenen k3 varsayılana sokuldu → 4 test). C5 öncesi
model `SIMKOL=eski` ile hâlâ koşuyor; karşılaştırma zemini silinmedi.

## D-087 · Dördüncü tempo ölçütünün PROFİLİ sabitlendi; ekonomiye dokunulmadı (2026-09-08)
**Karar (kullanıcı seçimi):** D-010 §3.6'nın *"20 dk'yı aşan tek alım kalmasın"* ölçütü,
**kardeş üç ölçütle AYNI profilde (İDEALİZE, verim 1,0) hüküm verir.** Normal/Rahat sayıları
silinmez, **hükümsüz GÖZLEM BANDI** olarak basılır. `economy.config.ts` DEĞİŞMEDİ.
**Sorun:** D-086 Bulgu 7, model gerçeğe yaklaşınca Normal profilde ihlalin 2 → 6 çıktığını
açmıştı. D1 turu ölçtü ki ölçütün profili **hiç yazılmamış**: kardeş üçü İdealize'de okunuyor,
bu dördüncüsü Normal'de. Aynı eğri **İdealize 1 · Yoğun 1 · Normal 6 · Rahat 11** veriyor —
hüküm eğriden değil, okuyanın seçtiği profilden geliyordu. Kardeşlerinin profilinde ölçüt
**bugün de geçiyor**: aşan 1, en uzun 23,9 dk → `servis L6` (D-078'in bilerek bıraktığı).
**Neden düzeltici kol ALINMADI (ölçülerek):** ölçütü tutturabilen dört kolun hepsi Kat 1
içeriğini kısaltıyor — `f4` ×0,80 → 7,90 sa (−%7) · `c1` → 7,33 sa · `f3` → 7,22 sa ·
`g2` tipBase 3,5 → 7,04 sa (−%17); tam temizlik (=0) −%19…−%42. Taban 8,48 sa. Yani "ölçütü
tuttur" ile "Kat 1 uzun olsun" aynı anda istenemiyor. Üstelik bu bekleme pencerelerini
dolduracak katman (**Faz D meta**: elmas, günlük görev, hedefler, ödül ekranı, offline) henüz
yok — içerik uzunluğu ödemek erken. Faz D bitince aynı ölçüm yeniden okunacak.
**Ölçülerek ELENENLER:** `f1` (4'ün altına inmiyor) · `f2` (2'nin altına inmiyor) ·
`b1` basamak bölme (4'ün altına inmiyor) · `g1` taşıma tavanı (ihlali **6 → 7 ARTIRIYOR** —
`feedback_economy_throughput`'un "Kat 1'de bu kol tükendi" sınırının görev-hattı yolundan da
ölçülmüş hâli) · `f3` (`f4` tarafından domine ediliyor) · `m1` (**ATIL** — sim'de serbest oyun
bloğu görev hattı bitmeden hiç koşmuyor; tempoyu görev hattı belirliyor).
**Kabul edilen risk:** Normal oyuncu 6. saatte `servis L6` için 43,4 dk bekliyor; bu tur
bunun için bir şey ödenmedi, sayı gözlem bandında görünür kalıyor.
**Uygulama:** `simulate.ts`'te ölçüt sabitleri tek yerde (`BEKLEME_SINIRI`/`BEKLEME_IZIN`/
`OLCUT_VERIM`), dördüncü ölçüt artık ✓/✗ hükmüyle kardeşlerinin yanında, üç-profil bloğu
`GÖZLEM BANDI` oldu ve aşanların TAMAMINI listeliyor. Araçlar kalıcı: `tools/denge-kollari.ts`
(varyant katmanı) + `tools/olcum-gec-oyun.ts` (doz→ihlal tarayıcı; doz tahmin edilmez çözülür).
Bekçi `tests/tempo-olcutu.test.ts` — 15 test, **dört mutasyonla** doğrulandı.
**Kayda geçen ders:** ikinci mutasyon (ölçütü Yoğun'a kaydır) ilk hâlinde YAKALANMADI — üst
sınır 30 dk'ydı, Yoğun'un 29,8 dk'sı içinden geçiyordu. **Kaçan mutasyon testin zayıf yerini
gösterdi**; sınır 26 dk'ya çekildi. Bir bekçinin "geçti" demesi, kilitlediğini göstermez.
**Detay:** `docs/gec-oyun-raporu-d1.md` · ham `docs/olcum-gec-oyun.txt`.

## D-088 · Görev hattının kimliği sıra numarası olmaktan çıktı (kayıt v32) (2026-09-08)
**Karar (kullanıcı "en kalitelisi ne ise o olsun" dedi, kol seçimi bana bırakıldı):** kayıtta
**yalnız `questsDone: string[]`** (tamamlanan görev kimlikleri) durur; aktif görev **türetilir**:
listedeki EN GEÇ görevden SONRAKİ ilk yapılmamış görev (`src/game/questProgress.ts`).
`questIndex` ÇALIŞMA ZAMANININ kodlaması olarak kalır — hat sıralı ve tempo sıraya bağlı; kimlik
listesi de DEPONUN kodlaması. İkisi aynı anda saklanmaz, biri diğerinden türer (`padsDone` deseni,
D-015). Yanında tek bir etiket: `questBaseId` — sayaç tabanının hangi göreve ait olduğu; konum
bilgisi değil, tabanın bayat olup olmadığını anlamak için.
**Sorun:** hattın kimliği sıra numarasıydı; hatta her ekleme/sıra değişikliği kayda elle bir
kimlik eşleme listesi yazdırıyordu — plan §D'ye göre **beş tane birikmiş**. Görev tanımlarının
`id`si zaten vardı; eksik olan tek şey KAYDIN onu değil index'i saklamasıydı.
**Değerlendirilen üç kol (kod yazılmadan):** ① yalnız `questsDone`, aktif = listede olmayan İLK
görev → tek doğru kaynak ama hattın ORTASINA eklenen görev ilerlemiş kaydı GERİ ÇEKİYOR ve HUD'un
index dilimlerini bozuyor · ② `questId` + `questsDone` → geri çekmiyor ama kayıtta iki kaynak ·
③ **seçilen:** ①'in tek alanı + ②'nin "geriye gitmez" güvencesi. Ortaya eklenen görev o kayıt için
atlanır, sona eklenen normal sıraya girer, silinen/yeniden adlandırılan görev konumu bozmaz.
**Migrasyon (v31 → v32):** D-058'in temiz-sıfırlaması meşruydu (zincir kimliklerinin yeni modelde
karşılığı YOKTU); burada öyle bir durum yok — hattın görevleri aynı, değişen yalnız kaydın o hattı
nasıl işaret ettiği. CLAUDE.md gereği **gerçek göç** yazıldı: eski `questIndex` bugünkü hattın o
index'ine kadarki kimliklere çevrilir. **v31'den ESKİ kayıt hâlâ sıfırlanır** (D-058 yerinde).
**Yan iş — SAVE_VERSION `economy.config.ts`'ten `save.ts`'e taşındı:** bir denge sayısı değil,
kayıt katmanının kendi kavramıydı; orada dururken **her sürüm artışı varyant kapısının commit
denetimini boşuna tetikliyordu**. `economyConfig.saveVersion` alanı da kalktı (hiçbir çağıranı
yoktu ve config → save döngüsü açardı).
**SIRA KİLİDİ UYARISI — kayda geçirilerek geçildi (aracın kendi talimatı):** bu tur
`economy.config.ts`'e dokunuyor (SAVE_VERSION'ın SİLİNMESİ) ve öncesinde ölçüm commit'i yok, o
yüzden `npm run sira` **ihlal** dedi. Bu bir yanlış-pozitif: turda **tek bir denge sayısı
değişmedi**, dokunulan satır zaten dosyadan ÇIKAN satır. Ve bu, o yanlış-pozitifin **son kez**
görülmesi — sürüm artık başka dosyada. Araç değiştirilmedi (kendi turunu ister).
**Bekçi:** `tests/gorev-kimligi.test.ts` — 17 test, **beş mutasyonla** doğrulandı (geri-gitme
koruması kaldır · izdüşümde bir kaydırma · göç taban sahibini yazmaz · taban sahipliği
doğrulanmaz · göç hiç çağrılmaz); beşi de yakalandı. Ayrıca modelin sessiz ön koşulu teste
yazıldı: **hattaki kimlikler benzersiz olmalı.**
**Uçtan uca doğrulandı (tarayıcı):** açılıştan önce ekilen gerçek bir v31 kaydı (12. görev, 7.500 ₺,
3 pad) göç etti — HUD *"4. Masayı aç"* (hattın tam 12. görevi), para ve ayarlar yerinde; oyunun
geri yazdığı kayıt **v32**, `questIndex` alanı yok, `questsDone` 12 kimlik, `questBaseId: q_table4`.
vitest **584** (567 → +17) · duman **28/28** · derleme temiz · **denge sayısı DEĞİŞMEDİ.**

## D-089 — Hedefler (koleksiyon): ödül YOĞUNLUKTAN gelir, büyüklükten değil (2026-09-08, D3)

**Karar (kullanıcı seçti):** hedefler hem ₺ hem 💎 verir; ₺ tarafı **kol `hE %2`** — yani tek
büyük ödül değil, **25 küçük kademeye yayılmış** akış. Kategoriler: Servis · Mekân · Kazanç ·
Usta · **Temizlik** (plan §6'nın "Alışkanlık"ı D4'e ertelendi; gün-temelli olduğu için bugün ölü
dururdu).
**Ölçüm:** `docs/hedef-raporu-d3.md` · araç `tools/hedef-kollari.ts` + `tools/olcum-hedefler.ts`.
**Ana bulgu:** ödülün BÜYÜKLÜĞÜ bekleme penceresini doldurmuyor — `hA %50`'de 66.000 ₺ ödense
bile 20 dk'yı aşan aralıkların içine düşen **sıfır**; ihlali yalnız zinciri %29,4 kısaltarak
indiriyor (D1'in elediği kolların aynısı). YOĞUNLUK dolduruyor: aynı iyileşme `hE`'de **%2,7**
bedelle geliyor, ~11 kat ucuz.
**💎 tempoya GİRMEYE BİLİR — ölçüldü, varsayılmadı:** `h0` kolu (yalnız elmas) tabanın **birebir**
kopyası çıktı, çünkü elmasın bugün hiçbir harcaması yok. Hüküm D5 Usta katmanına kadar geçerli;
bekçi bunu kilitler ve o gün kırılır.
**UYGULANAN CONFIG DE ÖLÇÜLDÜ (`hUYG` kolu — C5'in `secilen` deseni) ve varsayımı İKİ KEZ
çürüttü:** ① ortak ödül merdiveni toplamı bakımından seçilen kola denk görünüyordu ama gerçekleşen
ödeme 3k değil **11k** çıktı (zincir %-8,7) — sentetik merdivenin üst kademeleri Kat 1'de hiç
dolmuyordu. ② Merdiven kısıldı, toplam tuttu, ama ödemelerin **YERİ** tutmadı: ödül kademe
INDEX'ine bağlıydı, oyuncunun oraya ULAŞTIĞI zamana değil — geç açılan "Usta" ilk kademesinde 5 ₺
veriyordu. Bu yüzden ödül **kategori başına** merdivene çevrildi; geç açılan kategori büyük başlar.
Yürürlükteki hâl üçüncü ölçümündür: **3.175 ₺ · 13 ödeme · zincir %-3,2 · otomasyon 6,0 dk.**
**KABUL EDİLEN EKSİK:** seçilen kolun vaat ettiği **ihlal iyileşmesi gelmedi** (ihlal 6'da, en uzun
43,4 dk'da kaldı). Bedel bandında, fayda ölçüm gürültüsünde. Yani D-087'nin açık kalemi
**kapanmadı**: meta katmanın hedefler kanadı geç-oyun pencerelerini *tempo olarak* doldurmuyor;
doldurduğu şey oyuncunun o pencerede gördüğü ilerleme. Ödemeyi pencereye denk getirmek kırılgan
bir optimizasyon olurdu (ekonominin başka kalemi değişince pencere kayar) — **yapılmadı.**
**Sonraki oturumda sorulacak:** fayda ölçülemediğine göre ₺ kolu bu hâliyle kalsın mı, yoksa `h0`
(yalnız 💎, bedel tam sıfır) mı? Karar ₺ lehine verilirken faydanın ölçülebilir olduğu
varsayılmıştı.
**Kayıt:** `goalsClaimed: string[]` **additive** → `SAVE_VERSION` **artmadı** (v32 kaydı hedefsiz
ama sağlam açılır — `lavaboLevel` deseni). Konum SAKLANMAZ, kimliklerden türetilir (D-088 deseni).
**Değişmeyen:** `tick.ts` · `rules.ts` dokunulmadı · mevcut hiçbir denge sayısı düzenlenmedi
(`goals` bloğu EKLENDİ) · görev hattının M1 ödülleri aynen duruyor.
**Bekçi:** `tests/hedefler.test.ts` — 20 test, **sekiz mutasyonla** doğrulandı. Biri KAÇTI ve
bekçinin zayıf yerini gösterdi: yalnız zincir bedeline bakan bant (%5) tek kategorinin ödülü 3'e
katlandığında geçiyordu. Bant %4'e daraltıldı ve **ödenen ₺'ye doğrudan bir bant** eklendi (zincir
bedeli dolaylı ve gürültülü, ödenen ₺ doğrudan).
**Uçtan uca (tarayıcı) İKİ GERÇEK KUSUR buldu, ikisi de vitest'in göremeyeceği türden:** ① panel
hiç açılmıyordu — `useGame((s) => goalMetricsOf(s))` her render'da yeni nesne döndürüp zustand'ı
sonsuz render'a sokuyordu (metrikler alan alan seçilir yapıldı). ② Duman testinde uyuyan
kırılganlık: panel kapatma tıklaması backdrop'un MERKEZİNE gidiyordu ve açılış animasyonu bitince
kart orayı kaplıyor — test bugüne dek yalnız animasyon tamamlanmadığı için geçiyormuş.
**Duman 28/28 → 31/31 · vitest 604.**

## D-090 — Hedef ödülünün KALIBI: sabit ₺ değil KALICI GELİR ÇARPANI (2026-09-09, D3b)
**Soru** D3 kapanırken açık kalmıştı: "hedeflerin ₺ kolu bu hâliyle kalsın mı?" Sunulan üç seçenek
(kalsın · yalnız 💎 · ucuzlat) reddedildi — üçü de **aynı kalıbın** varyasyonuydu. Kullanıcı sektörde
kaliteli olanı sordu. Idle/tycoon'da koleksiyon ödülü ya sert para, ya **kalıcı çarpan** (AdVenture
Capitalist milestone · Cookie Clicker milk · Egg Inc.), ya da **gelire oranlı** yumuşak para olur;
sabit ₺ lump'ı yalnız erken oyunda kullanılır çünkü gelir süperlineer büyürken ödül büyümez.
**Ölçüldü** (`docs/hedef-raporu-d3.md` §6, tam koşu, damgalar temiz): iki yeni kol, üçü de config'in
GERÇEK 5×5 merdivenini yürütüyor, tek fark ödülün kalıbı.
**`hG` (gelire oranlı ₺) ELENDİ:** geç pencere ALTI dozun altısında da 43,4 dk — %-27,5 bedel
ödense bile kıpırdamadı; buna karşılık açılışı ezdi (otomasyon 6,1 → 1,7 dk), çünkü 13 ödemenin
beşi ilk 5,4 dakikaya düşüyor. "N saniyelik gelir" tekdüze bir zaman atlamasıdır ve kısa olan erken
zincirde oransal olarak çok daha ağır basar. Bulgu 10 ②'nin TEŞHİSİ doğruydu, ilacı bu değildi.
**`hF` (kalıcı çarpan) SEÇİLDİ, doz %10:** en uzun bekleme 43,4 → 41,2 dk, ihlal 6 → 5, zincir
bedeli %-4,0 (D1'in eleme eşiği %7; `hF` %20 = %-7,6 tam bu yüzden alınmadı) ve **açılış sabit**
(ilk alım 22 sn · otomasyon 6,1 dk). Sebep: çarpan bileşikleniyor, ağırlığı kendiliğinden geç oyuna
düşüyor — `hG`'nin tekdüzeliğinin tam tersi.
**Kararın hangi eksende verilmediği de yazıldı (Bulgu 13):** tempo verimi `hF` 0,53-0,63 ·
`hE` 0,50-0,57 dk/% — **denk.** Tablo ELEME yaptı (hA/hB/hC/hG verimi sıfır), kalan iki kalıbı
ayırmadı. Seçim sim'in ölçmediği eksende verildi: ödül bayatlıyor mu (sabit ₺ 6. saatte 3 dakikalık
gelir) ve "yazılan ≠ ödenen" hata sınıfı mümkün mü. **D-084 kuralı burada tersine de işledi: sayı,
kararın hangi eksende VERİLEMEYECEĞİNİ de söyleyebilir.**
**Uygulanan:** `goals.incomeBonusTotal: 0.10` (TEK sayı; kademe payı `goals.ts`te türetilir =
+%0,4/hedef) · `categories[].rewards` **silindi** · çarpan ₺'nin yaratıldığı ÜÇ yere biner
(müşteri ödemesi + lavabo ücreti `tick.ts` · çevrimdışı oran `rules.ts`). Aktif ve çevrimdışı AYNI
çarpanı görür — görmeseydi oyuncu oyunu kapatarak bonusunu kaybederdi.
**Kayıt:** çarpan `goalsClaimed`ten TÜRETİLİR, saklanacak yeni alan yok → **`SAVE_VERSION` yine
artmadı** (v32). D-088/D-015 deseni.
**Uygulanan config KENDİ satırıyla ölçüldü (`hUYGF`):** 41,2 dk · %-4,0 · ihlal 5 — sentetik
`hF` %10'un birebir aynısı. D-089'da bu bir varsayımdı ve iki kez çürümüştü; artık bekçi ±0,5
puanlık bantla kilitliyor.
**KABUL EDİLEN EKSİKLER:** ① bedel %-3,2 → %-4,0'a çıktı (Kat 1 içeriğinden 0,8 puan daha fazla)
② D-087'nin açık kalemi hâlâ kapanmadı — 41,2 dk hâlâ 20 dk ölçütünün üstünde, kapatmak `hF` %35+
ister (%-12,6) ③ çarpan GÖRÜNMEZ bir ödüldür; panelde iki yerde yazılıyor (kademe payı + kümülatif
toplam) ve 💎 anlık ödülü taşıyor, ama oyuncu üzerindeki etkisi ÖLÇÜLMEDİ — sim'in ölçebileceği bir
şey değil, telefonda oynanınca yeniden okunacak.
**Bekçi iki dosya, DOKUZ mutasyon:** `tests/hedefler.test.ts` (denge bandı + kalıp regresyonu;
sim kolunu ölçer) + **`tests/hedef-gelir-kablosu.test.ts` (YENİ)**. İkincisi bu turda açılan gerçek
bir boşluğu kapatır: denge testleri SİM'in kolunu ölçüyordu, oyunun `tick.ts` kablolamasını değil —
biri `* incomeMult` çarpanını oradan silse hepsi yeşil kalırdı (M5-M8 tam bunu sınar). Sekizi
yakalandı; **M9 kaçtı** (doz %10 → %11 zincir bandının içinde kalıyor) ve bekçiyi değiştirdi:
bandı daraltmak yerine ölçülen sayı DOĞRUDAN çivilendi — dolaylı ölçüt gürültülü, doğrudan olan
her değişikliği yakalar. O test bilerek kırılgandır: dozu değiştirmek meşrudur ama varyant
kapısından geçmek zorundadır.
**Uçtan uca:** `window.__game().goalMult` eklendi (ödül cüzdana ₺ koymadığı için duman testinin
okuyabileceği tek kanıt) — hedef toplanınca ×1,004 okundu. **Duman 31/31 → 32/32.**

## D-091 — Oyuncunun dünyasına kendi ızgarası (2026-09-09, D5)
**Soru** Rotalar PERSONELİN dünyasında kuruluyordu (`navSolids`, sandalyesiz, `actorRadius` 0,28,
alan kelepçesi yok); oyuncu ise `activeSolids` (sandalyeler katı) + `playerRadius` 0,47 +
`clampToOpenAreas` ile yürüyor. Fark biliniyordu, hiç ölçülmemişti.
**Ölçüldü** (`docs/nav-oyuncu-raporu-d5.md`, tam koşu 20 açıklık, damgalar temiz): ayrışma %3,1 →
**%8,2** (745 hücre). **İçerik kilitli DEĞİL** — ulaşılamayan etkileşim noktası 0, bağlı bileşen 1,
cep 0 (20 açıklığın 20'sinde). Zarar ROTADA: dolu katta rotaların **%74,1'i** oyuncuya kapalı en az
bir ara noktadan geçiyor, ara noktaların %14,4'ü kapalı.
**Karar** `getPlayerNavGrid` (`layout.ts`) — `activeSolids` + `playerRadius` + alan kelepçesi.
Gerekçe: oyuncunun kendi dünyasında her hedefe yol VAR ve yalnız **×1,069** daha uzun; yani bu
yerleşim darlığı değil, eksik ızgara. **Dünyaları birleştirmek elendi** (personel masaya erişmek
zorunda; `REACH_TABLE` ve yerleşim testleri `actorRadius`'a çivili).
**Bekçi** `tests/oyuncu-dunyasi.test.ts` — 8 test, **8 mutasyon**, sekizi de yakalandı. Bekçi ve
ölçüm aracı ızgarayı yeniden KURMAZ, `getPlayerNavGrid`'i çağırır (D-090'ın dersi).
**Denge sayısı değişmedi.** **Kabul edilen eksik ①:** oyunda bugün bu ızgarayı çağıran tüketici
yok (oyuncu joystick ile sürülüyor) — bekçili bir doğruluk, henüz görünen davranış değil.
**② Sim botunun göçü denendi, ölçüldü, GERİ ALINDI:** B2 159,1 → 0,0 br/dk. Yolda üç tuzak
ölçüldü (bot katının içinde başlıyor · `×0,7` rota payı oyuncu dünyasında olanaksız · tetik
yarıçapı ızgara yuvarlamasına yetmiyor, `+NAV_CELL` çözüyor); üçü düzeltildi, B2 yine 0,0 kaldı.
Araç ölçülmüş hâline döndürüldü — botun göçü kendi turunu ister.
**Turun süreç dersi (D-084'e ek):** kolları önceden yazmak GEREKLİ ama YETERLİ değil — asıl zararı
gösteren `k5` (rota izlenebilirliği) tur kartında yoktu, ilk sayılar okununca eklendi. Beklenen
zarar ("içerik kapalı") çürüdü. Kural: adım 2'nin ilk çıktısı hangi kolun EKSİK olduğunu da
söyler; kol eklemek kapıyı delmez, kol eklemeden karar vermek deler.

## D-092 — İtibarın ödülü: taşıma hızı (2026-09-09, D6)
**Soru** Plan §6 İtibar'a "her seviye +%2 müşteri akışı, +%1 bahşiş" yazmıştı — iki denge sayısı,
ikisi de hiç ölçülmemişti. XP kazanılıyor, HUD'da görünüyor, kutlanıyor ve hiçbir şeye yaramıyordu.
**Ölçüldü** (`docs/itibar-raporu-d6.md`, tam koşu 2 dk 45 sn, damgalar temiz): gelirin kelepçesi
zamanın **%93,0**'ünde TAŞIMADA (arz %5,9 · talep %1,1). Planın kolu bu yüzden **atıl**: %10/sv
dozunda bile zincir %-0,1, 20 dk ihlalleri hiç kıpırdamıyor. Arz kolu da neredeyse atıl (%-1,8).
İşe yarayan iki kol — gelir (`r2`) ve taşıma (`r6`) — tempoda **ayırt edilemedi** (fark ≤ 0,2 puan,
D-090 Bulgu 13'ün tekrarı: tempo tablosu ELER, SEÇMEZ).
**Karar** `xp.carryBonusPerLevel: 0.02` — İtibar seviyesi oyuncunun ve garsonun HAREKET hızını
seviye başına %2 büyütür (`tick.ts` · `carryMult`, `incomeMult` deseni; kayıtta alan yok, `xp`ten
türer, kayıt sürümü ARTMADI). Yürürlükteki hedef çarpanı açıkken: en uzun bekleme **41,2 → 33,8 dk**,
ihlal **5 → 2** (Normal), hüküm **1 → 0** (İdealize), açılışın üç ölçütü de **değişmedi**.
**Seçimi tempo tablosu vermedi, AÇILIŞ verdi:** taşıma kolu D-079'un üç ölçütüne hiçbir dozda
dokunmuyor, gelir kolu her dozda yiyor (D4'te `hG` tam buradan elenmişti). İkinci gerekçe: gelir
kolu D-090'ın kalıcı çarpanıyla aynı GÖRÜNMEZ kanalda birikirdi; taşıma ödülü tepside görünür —
toast artık "Seviye 7! Servis hızı +%12" yazıyor.
**Eğri korundu** (`levelGrowth ×1,5`): ölçüm eğrinin tempoya hiç dokunmadığını gösterdi (altı dozda
da ŞERİT 8,48 sa), değiştirmek için sayı yoktu.
**Bekçi** `tests/itibar.test.ts` — 8 test, **8 mutasyon, sekizi de yakalandı**. Bekçinin ilk hâli
M1'i (garson çarpanının silinmesi) KAÇIRIYORDU: formülü doğruluyor, `waiterSystem`i koşturmuyordu —
yani D-090'ın dersini ıskalıyordu. Gerçek kareye çevrildi, garsonun kat ettiği yol ölçülüyor.
`rUYG` kolu uygulanan config'i kendi satırıyla ölçtü; sentetik `r6 %2/sv` ile **birebir**.
**KABUL EDİLEN BEDEL (kullanıcı kararı):** zincir **%-15,5**, D1/D-090'ın %7'lik eleme eşiğinin
üstünde. Karşılığında D-087'den beri açık duran 41,2 dk kalemi ödendi; bunu ödeyen ölçülmüş başka
kol yok. **Eşiğin bilerek aşıldığı ilk karardır** — emsal değil, sayısı yazılı istisna.
**Turun süreç dersi:** `r6` tur kartında YOKTU. Darboğaz dağılımı okununca tur kartındaki dört
kanaldan hiçbirinin gerçek kelepçeye dokunmadığı görüldü ve kol ölçüm sırasında eklendi — D-091'in
ekindeki dersin ikinci doğrulanması. **Günlük görevler D7'ye bırakıldı:** 💎 harcama tarafı
yazılmadan arz tarafını çivilemek ölçülemeyen bir sayıyı config'e yazmak olurdu.

## D-093 — Usta katmanı: ödeyen tek kanal MASA BAHŞİŞİ (2026-09-09, D7a)

**Karar.** `master.tipMult: 1.5` · `master.diamondCost: 25` · `dailyQuests.diamondsPerDay: 10`.
Elmasın ilk HARCAMASI kuruldu; D-089'un "💎 tempoya girmez" hükmü bilerek bayatlatıldı.

**Planın iki sayısı da ölçümde düzeltildi** (`docs/elmas-raporu-d7.md`, tam koşu):
① *"servis noktasına üstüne ×2"* ELENDİ — yalnız servis kapsamı zinciri %0,0 kıpırdatıyor, çünkü
arz zamanın yalnız %7,2'sinde bağlayıcı (kelepçe %91,5 TAŞIMADA). Bu D-092'nin planın talep
kolunu elediği ölçümün birebir tekrarı: plan ödülü ikinci kez kelepçe OLMAYAN bir tavana bağladı.
Kapsama servis eklemek etkiyi AZALTIYOR (%-5,9 → %-5,6). ② *"15 💎"* 25'e çıkarıldı — 15'te
26 hedefin 16'sı ilk gün peşin alınıyor, kuyruğun %62'si bitiyor.

**Personel kanalı atıl DEĞİL, ULAŞILAMAZ** (Bulgu 4): 12 sa penceresinde hiçbir personel merdiveni
₺ tavanına varmıyor (garson tepsi 2/3 — 3. kademe görev hattında yok · karakter hız 0/3 ·
bulaşıkçı 0), o yüzden `e6` dört dozda da 0 alım. Tavan şartı kaldırılmış denetim satırı `e6X`
kanalın hem TAKILI hem de en güçlüsü olduğunu gösterdi (×1,25'te %-13,4, ×2'de %-26,1) — eleme
eşiğinin iki katı. Bu yüzden **tavan şartı KALKMAZ**: kanal ulaşılamaz kalarak korunuyor.

**Doz ve fiyat kullanıcı kararı.** ×2 eşiğin altındaydı (%-5,6) ama alınmadı: D-092 bir tur önce
zincirden %15,5 aldı, iki tur bileşikleniyor ve hiçbir doz 20 dk ölçütünü kurtarmıyor. 25 💎
kuyruğu 10 peşin / 16 bekleyen yapıyor; 10 💎/gün planın "~2,5 gün/Usta" vaadini korur.

**UYGULANAN HÂL İKİ KNOB'UN TOPLAMI ÇIKMADI (Bulgu 13).** Etki ×1,5 ve fiyat 25 💎 tabloda AYRI
ölçülmüştü (ikisi de %-3,0 / 30,4 dk); birleşimleri **%-1,6 / 32,0 dk** — yaklaşık yarısı, çünkü
ikisi de aynı yönü çekiyor (biri alım başına değeri, diğeri alım sayısını düşürüyor). D-090
Bulgu 10 ve D-092 `rUYG`den sonra **üçüncü kez**: "seçtiğim dozlar iyiydi, birlikte de öyledir"
varsayımı çürüdü. Yönü güvenli tarafta (bedel ucuz, ödül küçük) ve dört ölçüt de geçiyor, ama
kullanıcı ×1,5'i 30,4 dk sayısına bakarak seçti — **açık kalem**: aynı bedele daha çok ödül
istenirse tek satır `tipMult` ×2 (o zaman %-3,0 / 30,4 dk).

**Veri kalemleri (sorulmadı, gerekçesiyle seçildi).** `masterTables` sayacı L4'te (₺ tavanı)
KALDI: Usta seviyesini sayarsa arz kendi harcamasına bağlanır (250 💎'ın 50'si Usta
kategorisinden gelir → 3 💎 için 15 💎 harcamak, kapalı döngü). Kayıtta yalnız `mastersOwned`
KİMLİK listesi durur, çarpan ondan türer (`goalsClaimed`/`padsDone` deseni) → **kayıt sürümü
ARTMADI (v32)**.

**Bekçi.** `tests/usta.test.ts` 11 test, **10 mutasyon, onu da yakalandı**. Kritik olan M7:
çarpanı ürün fiyatına da bindirmek — beklenti "daha çok ödüyor" diye yazılsaydı kaçardı, tam
değere yazıldığı için yakalandı. `tests/hedefler.test.ts`in bayat elmas hükmü daraltıldı ve
bayatlamayı kilitleyen iki damga eklendi. vitest 639 · duman 32/32.

**D7 ikiye bölündü** (kullanıcı): D7a = ölçüm + denge (bu karar) · D7b = UI (Usta paneli +
günlük görev kartları). Günlük görev SİSTEMİ henüz yok — yalnız ölçülmüş sayısı config'te durur.

## D-094 — Usta ve günlük görevin ETKİLEŞİMİ: aynı nokta, 💎 kimliği (2026-09-09, D8)

**Karar (üç ürün kararı, tek pakette sorulup seçildi).**
① **Usta noktası = masanın MEVCUT yükseltme noktası.** ₺ tavanında işaret kaybolmuyor, elmas
kimliğine dönüyor (mavi halka + dörtgen pul + "Usta"). Yeni görsel dil açılmadı, para birimi
değişti. Planın "yaklaşınca panel açılır"ı **elendi**: oyuncu masanın yanından her geçtiğinde
ekranı kapatan modal hem hareketi keser hem Tek Odak'ı kırar. Onayı **alt bant** alır (`MasterBar`),
dwell ile satın alma YOK — 25 💎 premium harcamadır, yürürken kazara gitmemeli.
② **Günlük görev = havuzdan gün-index'iyle DETERMİNİSTİK 3 görev**, eşik açık masa sayısına ölçekli.
Kayıtta rastgelelik tohumu yok; seçilen kimlikler duruyor çünkü havuz gate'li (garson/tost kapalıysa
seçilmez — imkânsız görev o günün ölçülen 💎'ını sessizce yok ederdi).
③ **`master.tipMult` ×1,5'te KALDI** (D-093'ün açık kalemi kapandı): ×2'nin ölçülmüş satırı
(%-3,0 / 30,4 dk) reddedildi, yürürlükteki %-1,6 / 32,0 dk korundu.

**Denge sayısı DEĞİŞMEDİ.** `diamondsPerDay 10` ve `count 3` aynen duruyor; eklenen tek şey görev
TANIMLARI. Ödülün üçe dağılımı config'e yazılmadı, **toplamdan türetilir** (3+3+4 = 10) —
`goals.incomeBonusTotal` dersinin aynısı (D-090): parçalar toplamdan ayrışamaz. Günlük görev
**XP VERMEZ**: İtibar D-092'de ölçülen taşıma çarpanına biniyor, XP takmak ölçülmemiş bir
hızlanma enjekte ederdi.

**SIRA KİLİDİ BİLEREK AŞILDI** (araç uyardı, sessiz geçilmedi). `npm run sira` `economy.config.ts`
dokunuşunu görüp ölçüm commit'i istedi. Bu turda ölçüm YOK çünkü değişen sayı tempo kolu değil:
ölçülen arz sabit, eklenen tanımların tek denge şartı **ulaşılabilirlik** ve o şart bekçiyle
kilitlendi (havuzun tamamı akış sayacı; "yükseltme al" gibi tükenebilir bir görev yok).

**Bekçi.** `tests/gunluk-gorev.test.ts` 22 test, **14 mutasyon, on dördü de yakalandı**. Bekçi
yazarken GERÇEK bir hata buldu: gün dönümü tabanı çevrimdışı gelirden ÖNCE alınıyordu → gece
kazanılan ₺ bugünün "kazan" görevini bedava dolduruyordu. Taban artık offline SONRASI alınıyor.
vitest **661** · duman **41/41** (32 → 41: dokuz yeni denetim) · **kayıt sürümü artmadı** (v32,
`daily` additive).

## D-095 — Meta katmanın yığını ölçüldü: D-087 KAPANDI, zincir borcu %20,1 KABUL (2026-09-09, D9)

**Ölçüm turu — kod yazılmadı, `economy.config.ts` hiç değişmedi.** Faz D üç ödül kanadı ekledi
(H hedef çarpanı D-090 · R İtibar taşıma D-092 · E Usta+günlük görev D-093/094) ama **her tur
ötekilerin kancasını kapatarak ölçtü**; yürürlükteki oyunun tempo penceresi hiçbir tabloda yoktu.
Sekiz bileşim tek koşuda ölçüldü. `docs/meta-pencere-raporu-d9.md`.

**① D-087 KAPANDI.** Yığın açıkken (HRE) hüküm profilinde 20 dk'yı aşan alım **0**, en uzun
bekleme **18,0 dk** — ölçütün 2 dk altında. Gözlem bandı 6 → 2 ihlal, 43,4 → 32,0 dk. Beş turdur
açık duran kalem bitti.

**② Kapatan katman R'dir, "meta katman" değil.** H ve E tek başlarına hükmü kımıldatmıyor
(23,9 → 22,7 ve 22,6 dk, ikisi de eşiğin üstünde); yalnız R kapatıyor. Ters yönde okunuşu:
**R geri alınırsa D-087 yeniden açılır** (HE satırı: hüküm 1, en uzun 39,0 dk).

**③ Katmanlar TOPLANIYOR — D-090 Bulgu 10 bir kat yukarıda TEKRARLAMADI.** İki ihlal sayısında
fark **tam sıfır**, sürekli iki ölçüde %1,5-2,9. Bu, Bulgu 10'un sınırını da adlandırıyor:
toplanamama **knob'lar arasında** çıkıyor (aynı tavana biniyorlar), **katmanlar arasında**
çıkmıyor (üçü üç ayrı yere biniyor: gelir · taşıma · bahşiş+arz).

**④ KARAR: zincir borcu %−20,1 kabul edildi, eşik yazıldı.** Kat 1 ömrü 8,48 → **6,77 sa**.
Üç ölçülmüş geri-alma kolu da reddedildi: R'yi kısmak D-087'yi yeniden açıyor · H'yi kısmak %3,1
zincir için ölçülen tempoyu veriyor · E'yi kısmak %1,2 için Usta katmanını siliyor. Zincirin
%78'ini yiyen katman aynı zamanda hükmü kapatan tek katman — **"pahalıyı kıs, ucuzlarla idare et"
diye bir kol ölçümde YOK.**

**Yürürlükteki eşik artık İKİ sayı:** tek kol için D1'in **%7'si aynen duruyor**; yığın için
yeni ve yazılı sayı **%−20,1 · ŞERİT tabanı 6,77 sa**. D-092'nin "sayısı yazılı istisna"sı
istisna olmaktan çıktı, yığının ölçülmüş hâli oldu.

**⑤ Açılış sağlam; tek sızıntı 1 saniye ve yalnız H'den.** Rapor önce "sekiz satırın sekizinde
birebir aynı" diye yazılmıştı — **bekçi o cümleyi çürüttü**: aracın dakikaya yuvarlaması
otomasyondaki 366 → 365 sn farkını gizliyordu. Sızıntı %0,27 ve D-079'un üç ölçütü sekiz
bileşimin sekizinde de geçiyor. **Süreç dersi: yuvarlanmış bir kolon "fark yok" diye okunamaz.**

**⑥ Kelepçe hâlâ TAŞIMADA** (%93,0 → %91,3) — üçüncü kez aynı sonuç (D6 · D7 · D9). Bir sonraki
denge kolunun kanalı değişmedi.

**Bekçi.** `tests/meta-pencere.test.ts` 22 test, **10 mutasyon, dokuzu yakalandı**. M5
(`tipMult` 1,5 → 1, Usta etkisi ölür) **ilk hâlde kaçtı** — E'nin ihlal sayısındaki izi zaten
sıfır olduğu için 21 testin 21'i de geçiyordu; eklenen iddia E'nin tek ölçülebilir izini
(ŞERİT %−1,7) kilitledi. M8 (`diamondsPerDay` 10 → 0) **bilerek kaçıyor**: ölçüldü, 12 sa
penceresinde tempo saniyesi saniyesine aynı (ŞERİT 30.017 sn her iki hâlde de) — yalnız elmas
defteri kımıldıyor. O kanal `tests/gunluk-gorev.test.ts`te kilitli; **bir sayı iki bekçiye
birden yazılmaz, onu ölçen bekçide kalır.**

**Açılan kalem:** zinciri UZATAN kollar hiç ölçülmedi. `outputMultByLevel` yok ve `b1` (basamak
bölme) erken oyuna dokunmadan denenemiyor — ikisi de tam oraya bakıyor, kendi turunu ister.

---

## D-096 — Ses kaynağı: dosya değil KOD. Motor büyütüldü, sentez NİHAİ stil oldu (E4)

**Bağlam.** E4 "hangi CC0 kaynaktan ses dosyası alalım" turu olarak açıldı. Ölçüm o sorunun
önündeki soruyu sordu: motor dosya olmadan da çalışıyordu, yani "sentez nihai olsun" gerçek bir
koldu. `docs/ses-raporu-e4.md`.

**① İddia ölçüldü ve AYAKTA çıktı.** E3'ün "kulaktan ayırt edilebilir" iddiası sınanmamıştı.
36 çiftin 35'i ayrı; sentez yer tutucu gibi davranmıyor. Tek gerçek kusur `quest ↔ reward`:
ikisi de triangle, iki nota, aynı +5 aralık, süre farkı 0,6 JND — **aynı jestin transpozesi**,
jest mesafesi 0,13 dB ve jest tabanının (0,22) ALTINDA.

**② Ölçüm İKİ KANALLI olmak zorundaydı ve bunu ölçümün kendisi öğretti.** Tek kanalla sonuç
36/36 "AYRI" çıkıyordu. Metrik yanlış değildi — **sorulan soru eksikti**: oyunda sesler art arda
değil dakikalarca arayla duyulur (`coin` saniyede bir, `level` saatte bir), o zaman mutlak perde
hafızada tutulmaz, kalan şey JESTtir. Perde silinince kusur görünür oldu.

**③ Karar: kullanıcı "en kalitelisi olsun" dedi, kol bana bırakıldı → MOTORU BÜYÜT.**
Elenen üçü: (A) tek osilatörle kalmak Bulgu 3'ün üstünü örterdi; (B) hazır CC0 seti seslerde hiç
kurulmamış stil kilidini karışık sanatçıyla açardı ve gerçekçi kayıt flat-shaded sahnede yabancı
durur, üstelik ölçülmüş bir sistemi ölçülmemişle değiştirirdi; (C) hibrit, `settings.music`
kablosuz olduğu için bugün "2 dosya bırak"a inmiyor.

**④ Sentez NİHAİDİR, dosya opsiyonel ÜSTÜNE YAZMADIR.** E3'te sıra tersti. `dosya` alanı duruyor:
bir `.ogg` bırakılırsa üstüne yazar, tek satır kod değişmeden — **karar geri alınabilir**, hiçbir
kapı kapanmadı. Stil kilidi `docs/assets.md` §7'ye yazıldı (eski satır bir seçim değil aday
listesiydi), künye manifeste; `public/assets/audio/` **bilerek boş**. Lisans yüzeyi SIFIR.
Gerekçe D-013'ün aynısı: primitive yer tutucu değil nihai stil.

**⑤ Motor üç kaynağa çıktı ve katalog İKİ AİLEYE ayrıldı.** Gürültü + bant süzgeci · inharmonik
kısmiler · band-limitli klasik dalgalar. FİZİKSEL olaylar gürültü ailesinde (`pour` bant merkezi
yükselen akış · `serve` cam şıngırtısı + tok gövde), İLERLEME olayları tonal; `coin` arada
(tonal ama inharmonik = metalik). D-080 Tek Odak'ın ses karşılığı: aileler aynı dili konuşmuyor.
Sonuç: **36/36 AYRI · ikiz 0 grup · tını 3 → 6 · gürültü-baskın ses 0 → 2** ·
`quest↔reward` taban altından **×12,45 tabana** çıktı.

**⑥ En kalıcı parça: sentez TEK YERDE üretiliyor — ölçülen şey birebir duyulan şey.** E3'te
sentez `audioWeb.ts` içinde WebAudio düğümleriyle kuruluydu ve ölçüm aracı o zinciri TAKLİT
etmek zorunda kaldı; iki ayrı kod vardı ve sapmayı hiçbir şey tutmuyordu. Artık `audioSynth.ts`
saf/deterministik PCM üretiyor, tarayıcı çalıyor, araç aynı fonksiyonu çağırıyor.
**Süreç dersi: bir ölçüm aracı ölçtüğü şeyi yeniden yazıyorsa, ölçtüğü şey o değildir.**

**Bekçi.** `tests/ses-sentez.test.ts` (19 test · YENİ) + `tests/ses.test.ts` (43 test) =
62 test, **18 mutasyon, on sekizi de yakalandı**. **Üçü ilk turda kaçtı ve üçü de gerçek delikti:**
M3 `zarf`ın gecikme dalının ÖLÜ KOD olduğunu gösterdi (döngü zaten gecikmeden başlıyordu — iki
mekanizma, biri bekçisiz; döngü 0'a çekildi, gecikmeyi yalnız zarf uyguluyor). M15/M16 "en az bir
gürültü + en az bir ton sesi olsun" testinin fazla gevşek olduğunu gösterdi (biri çökünce öteki
aileyi tek başına dolduruyordu) — kural **hangi sesin hangi ailede olduğu** diye ses ses yazıldı.
Ayrıca `serve`in katman kazançları 0,10/0,10 ile **beraberdi** ve teşhis katman sırasına bağlıydı;
0,11/0,09 yapıldı, beraberlik test tarafından yasaklandı.

**Aracın kendi kusuru da bulundu:** `oruntu` teşhisi "çok değerli İLK katman"ı okuyordu ve
`padFill`in gürültü süpürmesi tonal üçlüyü gölgeleyip **+28** yazdırıyordu (kulağın duyduğu jest
**+7,+5**). İkiz denetimi bu kolona baktığı için gerçek bir ikizi kaçırabilirdi; teşhisler artık
**baskın katmanı** okuyor.

**Denge sayısı DEĞİŞMEDİ** — `economy.config.ts` / `tick.ts` / `rules.ts` hiç açılmadı, varyant
kapısı tetiklenmedi. vitest **767** · duman **41/41** · kayıt sürümü artmadı.

**Kabul edilen kapsam sınırı.** `settings.music` + ortam sesi bu tura GİRMEDİ; kesme çizgisi
bilerek orada. E4 bir SENTEZ turu, ortam sesi bir YAŞAM DÖNGÜSÜ işi. Motorun gürültü kaynağı
ortam uğultusunu üretebilir — eksik olan **kablo, kabiliyet değil**. `settings.music` bugün
`settings.sound`un E3 öncesi hâlinde: kayıtta duruyor, hiçbir şeye bağlı değil. Kendi turunu ister.

**Yan iş (denge dışı, kayda geçsin).** APK derlemesi iki makine arasında kırıktı:
`android/gradle.properties` diğer makinenin Android Studio JBR yolunu MUTLAK yazıyordu ve o yol bu
makinede yok. Mutlak yol committed dosyadan çıkarıldı, makineye özel JDK seçimi
`~/.gradle/gradle.properties`e (git'te değil) taşındı. Ayrıca **Capacitor 8 JDK 21 istiyor**
(JDK 17 "invalid source release: 21" veriyor); bu makineye Temurin 21 kuruldu. Debug APK: 7,3 MB.

---

## D-097 — Faz S açıldı; pad dili yeniden yazıldı, iki eski karar kullanıcı isteğiyle döndü

**Bağlam.** Kullanıcı oyunu oynadı ve 25 kalemlik geri bildirim verdi (G-01…G-25,
`docs/geribildirim-oyun-testi-2026-09-09.md`). En ağır iddiası: *"her şeyi yaptık ama KayKit'i
hiçbir yere eklemedik."* **İddia sayıyla doğrulandı:** depoda 238 KayKit modeli var,
`grep kaykit src/` yalnız **4 satır** buluyor ve dördü de masa/sandalye — yani **restaurant-bits'in
144, city-builder'ın 41 modeli, toplam 185 model, sıfır satır kod tarafından çağrılıyor.**

**Karar.** Kullanıcı *"ücretsiz olduğu sürece her asseti çek ve yap"* dedi → **Faz S — sanat ve
arayüz geçişi** açıldı, 6 kalem (`docs/plan-faz-s-sanat.md`). Faz adı **S**, çünkü defterde zaten
bir Faz G (görsel taban) var; `G-0x` numaraları geri bildirimin, fazın kalemleri `S1…S6`.
Faz denge dosyalarına dokunmaz → varyant kapısı ve iki-commit kilidi tetiklenmez; kapı test+duman.

**S1'de yapılan (pad ve yükseltme dili).** Çember → **köşe parantezli kare** (kenar ortaları boş) ·
dolum büyüyen disk → **alttan üste dolan kare** · "Masa"/"Çay Yükselt"/"Usta" → hepsinde
**YÜKSELT** + solunda düz yukarı ok · yazı 700 → 800 · 💎 pulu "mavi kare" → gerçek taş silüeti.
Etiketin tekleşmesi bilinçli: hangi obje olduğunu **metin değil KONUM** anlatır — oyunun zaten
kurduğu mekânsal dil (`feedback_spatial_tycoon_ux`).

**İKİ KARAR GERİ DÖNDÜ — ikisi de kullanıcı isteği, ikisi de yazılı gerekçenin üstüne.**
① **D-094'ün Usta ŞERİDİ → MODAL (G-14).** D-094 modali gerekçesiyle reddetmişti: *"oyuncu masanın
yanından her geçtiğinde ekranı kapatan bir modal hareketi keser."* Kullanıcı oynadıktan sonra
şeridi reddetti. Karar kullanıcınındır — **ama eski gerekçe geçersiz değil**, o yüzden modal
kapatılabilir ve oyuncu o masadan uzaklaşana kadar geri açılmaz. Yani modal geldi, tuzağı gelmedi.
② **Görev tamamlanma toast'ı KALKTI (G-04).** Toast ile alt bandın "tamamlandı" hâli aynı anda
konuşuyordu ve oyuncu ikisini yeni görev sanıyordu. Tamamlanma artık **bandın kendi hâli**
(yeşil zemin + onay ikonu + "TAMAMLANDI"), sonra yeni görev geliyor. **`tick.ts`e DOKUNULMADI** —
olay hâlâ üretiliyor, yalnız HUD çizmiyor (E3/D-096'nın sunum-katmanı deseni; tick parmak izi
korundu, `devHooks` anlık görüntüsü ve ona bağlı testler değişmedi).

**Yan iş — `npm run pano` kendi bekçisini göremiyormuş.** Kapanışta pano testleri kırmızıydı ve
**değişikliklerden ÖNCE de kırmızıydı** (temiz ağaçta doğrulandı). İlk teşhis CRLF'ti, yanlış çıktı:
aracın yazma şartı *"veri değişti mi"* idi, oysa pano elle düzenlenince **biçimi** kayabiliyor —
JSON bloğunda **830 `\uXXXX` kaçışı ile 15.020 ham karakter yan yana** bulundu. Veri aynı, bayt
farklı → araç "zaten güncel" deyip çıkıyor, `panoYaz` bekçisi sessizce kırmızı kalıyor. Şart
`yazmaliMi()` olarak dışa alındı ve **bayta** bakıyor; bekçi 3 test aldı, **iki mutasyonla
doğrulandı**. **Ders: bir aracın yazma şartı ürettiği çıktıya bakmıyorsa, kendi bekçisini göremez.**
Açık kalemlerdeki "pano aracı kendi turunu ister" maddesi bu kadarıyla kapandı; `.gitattributes`
eksiği DURUYOR.

**Ölçülen engel.** Bu ortamdan internete çıkılamıyor (`curl` HTTP 000, çıkış 43) → yeni ücretsiz
KayKit paketlerini araç indiremez. S1-S5 zaten gerektirmiyor; **S6 kullanıcının indirmesini bekler.**

**Karakter kolu CEVAPLANMADI.** KayKit'in bütün karakter paketleri fantezi temalı; altı kol
bedelleriyle asset panosuna yazıldı (https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0).

vitest **770** · duman **41/41** · **denge sayısı DEĞİŞMEDİ** · kayıt sürümü artmadı ·
yeni pad tarayıcıda **gözle doğrulandı** (3D sahne testle doğrulanamaz).

---

## D-098 — S2: pad/modal etkileşimi kullanıcı testiyle düzeltildi; işaret biçimi TEKLEŞTİ

**Bağlam.** Kullanıcı S1'i oynadı ve altı kusur bildirdi (G-26…G-31 + ölçek). Hepsi kapandı;
ikisi ölçüldü ama karar bekliyor.

**① Ok ile yazı üst üste biniyordu.** Çerçeve `radius`tan türüyor, yazı ortalanıyordu — ikisi
aynı genişlik için yarışıyor ve **kimse ölçmüyordu**. Genişlik artık yazıdan ÇÖZÜLÜYOR:
`ok bloğu + harf ilerlemesi (0,58 em) × punto`. Ölçü tahmin değil hesap; `maxWidth` üst sınırı
ayrıca kilitler, yani hata payı taşmaya değil sarmaya gider.

**② Köşeler keskindi** → parantezlerin dış köşesi `quadraticCurveTo` ile yuvarlatıldı.

**③ Modal YAKLAŞINCA açılıyordu.** Artık işaret oyuncu **hareketsizken** 1,1 sn'de yeşil dolar,
dolunca açılır (`dwellState` modül değişkeni — 60 fps setState yok). Yürüyünce dolum sıfırlanır.

**④ "Modal dedim hâlâ alttan açılıyor."** Haklıydı: alt-sayfa kabuğu (`.modal-card`,
`align-items: flex-end`) yeniden kullanılmıştı. Usta artık kendi **merkezî** kabuğunda
(`.usta-card`). Duman testine bu kararı kilitleyen bir denetim eklendi — alt sayfaya geri düşüş
artık testle yasak.

**⑤ İşaret biçimi TEKLEŞTİ (aynı gün ikinci geri bildirim).** Usta noktası önce kalın çerçeveli
YUVARLAK yapılmıştı (kullanıcının ilk tarifi). Oynayınca *"yuvarlak yapma, direkt yükseltme gibi
olsun"* dedi → yuvarlak dal tamamen kaldırıldı. Geriye tek fark kaldı: dolumun KAYNAĞI (₺ değil
bekleme) ve RENGİ (yeşil). **Ders: iki biçim tutmak iki bakım yeri demekti; tek biçim + tek
farklı kanal daha ucuz ve daha okunur.**

**⑥ Ölçek mesafeye göre değişmiyor artık.** İşaret uzakta 0,55, yaklaşınca 1,00 ölçekteydi —
kullanıcı: *"yaklaşınca büyümesi çirkin duruyor"*. Boy SABİT; yalnız oyuncu işaretin ÜZERİNDEYKEN
×1,12 kabarır. **Tek Odak (D-080) katmanlaması ölçekten değil YAZIDAN devam ediyor** (uzaktaki
işaret hâlâ yazısız) — yani D-080 iptal olmadı, kanalı değişti.

**⑦ Modal yazıları görünmezdi.** `.usta-head` / `.usta-note` renk taşımıyordu ve HUD kabuğunun
`color: #fff`ini miras alıyordu; krem kartta beyaz yazı kayboluyor. Renk açıkça yazıldı.

**ÖLÇÜLDÜ AMA YAPILMADI — kullanıcı kararı bekliyor.** *"Masalar birbirine çok yakın mı"* ve
*"mutfağa yakın yerde yürüyemiyorum"* aynı kökten: geçiş için **2 × `playerRadius` = 0,94 br**
gerekiyor. Ön salon boşluğu **3,50 br** (rahat), **arka salon 0,68 br** — 20 masanın 12'si
geçilemez. Çarpışma katılarında eşiğin altında **52 açıklık**, en darı **0,04 br**. Yani
"yürüyemiyorum" bir his değil geometri. Düzeltme `layout.ts` ve **onaylı maket düzenine**
dokunuyor (`feedback_layout_order`: v2 onaylı, katı ızgara v3 reddedilmişti) → iki kol
sayılarıyla `docs/geribildirim-oyun-testi-2026-09-09.md`'ye yazıldı, uygulanmadı.

**İndirme engeli KALKTI (yan bulgu).** Bash'in ağı yok (`curl` HTTP 000) ama **PowerShell'in var**.
`tools/indir-itch.ps1` yazıldı; itch akışının 3/4 adımı çalışıyor (csrf → indirme sayfası →
dosya listesi), son adım 404 veriyor. Kendi turunu ister. **Not:** PS 5.1 `.ps1` dosyasını
BOM'suz UTF-8'de ANSI okuyor — Türkçe karakterli betikler **BOM'lu** yazılmalı.

vitest **770** · duman **42/42** · **denge sayısı DEĞİŞMEDİ** · kare işaret tarayıcıda gözle
doğrulandı (ok/yazı çakışması gitti, köşeler yuvarlak).

## D-099 — S3: mutfak KayKit'e geçti; ÖLÇEK insan boyundan, PALET KayKit'ten (2026-09-09)

**Karar.** Servis köşesinin tamamı — arka duvar hattı, batı dönüşü, depo **ve oyunun işleyen ön
hattı** (çay ocağı · garson istasyonu · bulaşık) — KayKit restaurant-bits'e geçti. Elle çizilen
maket parçaları silinmedi, `Model`'in **yedeği** oldu (greybox-first kuralı gerçekten çalışıyor).

**① Paket ölçeği ölçüldü, tahmin edilmedi: 0,90.** KayKit restaurant-bits, furniture-bits ile
aynı ham ölçekte yazılmış (`chair_A` iki pakette de 0,75 geniş) → projenin dondurduğu
`STOOL_S = 0,90` burada da geçerli. Sağlama insan boyuyla yapıldı (`feedback_reference_scale_trap`):
tezgâh üstü **0,90** = 1,75'lik karakterin **%51**'i (gerçekte 0,90/1,75 = %51), masa üstü %45.
**0,80 neden değil:** KayKit'in duvarı native 4,0, oyununki `WALL_H` 3,2 → mimari ölçek 0,80
çıkıyor, ama o ölçekte tezgâh üstü 0,80'e yani **masa üstüyle aynı hizaya** düşerdi. Mobilya insana,
duvar odaya göre ölçeklenir; ikisi tek sayıya zorlanmadı. Duvar dolabı/davlumbaz farkı **üst
hizadan** kapatır: tepesi `WALL_H`'a oturur, altı 1,40'a düşer (tezgâhla arası 0,50).

**② Ön hat modele değil COLLISION'a uyar.** Arka hat serbestçe derinleşebiliyordu (bant yürünmez,
7,1 br derin); ön hat üç collision kutusudur. KayKit modülü 1,84 derin, kutu 1,00 — model kutuya
eksen başına ÇEKİLDİ (`kayGovde`). Modelin z aralığı asimetrik (−1,000 → +1,042), o yüzden
ölçekten sonra bir de **ortalama kayması** gerekiyor; olmazsa gövde kutunun 2 cm önüne oturur.
Tabla üstü **0,90** seçildi çünkü elle çizilen gövdelerin tablası da tam oradaydı → semaver,
hazır bardaklar, tost sacı, sürahiler, peçetelik **tek koordinat değişmeden** yerinde kaldı.

**③ Çekmeceler mutfağa bakar (kullanıcı, aynı gün).** İlk uygulamada ön yüz salona bakıyordu;
gerçek bir bankoda dolap personelin durduğu yüzde açılır. Arka hat bunun İSTİSNASI değil aynı
kuralın kendisi — orada da personel tezgâhın önünde (mutfağın içinde) durur.

**④ Kasa ölçeği ayrı: 0,45.** KayKit'in kasası da 2×2 modül karosunda yazılı; 0,90'da 1,80 br
enine çıkıp arkasındaki fırının önünü kapatıyordu (kullanıcı: *"kasa olduğu için daha küçük
yapabilirsin"*). 0,45 → 0,90 × 0,36: hem gerçek kasa oranı, hem iki kasa yan yana tam bir modül
eni. **Ders: paketin modül karosu her obje için ölçek değildir — küçük prop kendi boyunu ister.**

**⑤ PALET KayKit'in kendi paleti KALDI (kullanıcı kararı).** Turuncu tezgâh / nane yeşili soğutucu /
kırmızı fırın salonun kahve-krem diline göre yüksek sesli; kıraathane tonuna boyanmış varyant
üretildi ve gösterildi (`docs/gorsel/ss/mutfak-varyant-*.png`). Kullanıcı: *"her şey çok kahve
kalıyor, biraz daha renkli olsun istiyorum … şu an KayKit'in kendi paleti kalsın"* ve ekledi:
**farklı renkler ileride TEMA olarak satılabilir.** Yani renk bir kusur değil, bir **ürün kalemi** —
`PALETTE`'in tema mağazası notuyla (Faz 5) aynı hatta girdi. Boyama hattı ölçülü ve hazır bekliyor:
`tools/atlas-goz.mjs` hangi gözün hangi modele gittiğini söylüyor ([3,6] tezgâh · [1,1] fırın/ocak ·
[1,2] soğutucu), `tools/atlas-ton.mjs` gözü gradyanı bozmadan boyuyor.

**⑥ Menü panosu kaldırıldı (kullanıcı).** Ön hattın üstünde asılı duran pano istenmedi; L6'nın
görsel karşılığıydı, `MenuBoard` tamamen silindi. Seviye okunurluğu tezgâhın kendi basamaklarında
(pirinç bant, cezve ocağı, tost hattı) duruyor.

**⑦ Yan bulgu — `npm run build` TEMİZ AĞAÇTA DA KIRIKTI.** `tsc -b` HUD'da S2'den kalmış ölü bir
dal buldu (`notice.kind !== 'quest'`, oysa tip artık `'level' | 'reveal'`). `npm run test` bunu
görmüyor çünkü vitest tip denetlemiyor; kapanış protokolü de `build` çalıştırmıyor. Dal silindi.
**Ders: yeşil test paketi derlenebilirlik demek değil — kapanışa `tsc -b` girmeli.**

Bekçi: `tests/kitchen-look.test.ts` (15 test) — oda sınırları, ayak izi çakışması, ızgara adımı,
düşey ankraj, ön hat türetmesi. **Dört mutasyonla doğrulandı** (ölçek 0,90→1,00 · kasa 0,45→0,90 ·
ortalama kayması silindi · ön hat salona döndürüldü); dördü de yakalandı.
vitest **785** · duman **42/42** · `tsc -b` temiz · **denge dosyalarına DOKUNULMADI** (varyant
kapısı tetiklenmedi).

## D-100 — Duvar KayKit'e GEÇMEZ; mutfak geçer, zemin mağaza kalemi olur (S4, 2026-09-09)

**Karar.** KayKit duvar modülleri ölçüldü, kuruldu, ekranda denendi ve **reddedildi**. Duvar
maketin üç katmanlı hâlinde kalıyor. Mutfak zemini KayKit karosuna geçti (küçük karo,
siyah-beyaz); kahve varyantı **mağaza teması** oldu (10.000 ₺).

**Neden reddedildi — biri ölçülmüştü, biri kaçırıldı.**
1. Modülün KENDİ yatay oluğu y = **1,60**'ta; maketin lambri hattı **0,94**'te. Rapor §B2 bunu
   önceden söyledi, kullanıcı ekranda gördü: *"duvar 2'ye bölünük."*
2. K4 eş dağıtım gerilmeyi **hat içinde** eşitliyor, **hatlar arasında** eşitlemiyor: modül eni
   3,00…3,80 (%27 fark) ve köşede yan yana düşüyor. **Bu ölçülmedi.** Tekrar denenirse çözüm
   bina için tek ortak adım.

**Geri dönüş bir AYAR, revert değil** (kullanıcı şartı: *"beğenmezsek eskisine dönebilir olalım"*).
Eski duvar silinmedi; `KayWalls` yanına kondu, ikisi de aynı parça listesini okuyor,
`config/kabuk.ts` tek satır. Varsayılan `'maket'`.

**Renk paketin, birleşim bizim.** Paket kahve zemin MODELİ içermiyor (üç paket tarandı) ama
dokusu bir resim değil 8×4'lük **renk şeridi** ve kahve gözleri var. Kahve tema boyayarak değil
**UV taşıyarak** kuruldu (`atlasUV.gozDegistir`) — renk KayKit'in paletinden, stil kilidi sağlam.
Atlas kopyalanmadı: `[0,4]` gözünü lavabo da kullanıyor, boyansa o da renk değiştirirdi.

**Kapsam sınırı.** Tezgâh+dolap rengini de kapsayan beş kollu bir tema seti kuruldu ve kullanıcı
reddetti: *"bunları sen kendin uydurmuşsun."* **Ders:** renk paletten gelse bile KOMBİNASYON bir
tasarım kararıdır ve onaysız çoğaltılmaz. Mutfak bugünkü hâliyle kaldı, satılan tek kalem zemin.

**Yöntem dersi.** Düşük-poli modelde delik/profil ölçümü **vertex sayımıyla yapılamaz** (düz yüzün
ortasında vertex yoktur): kapı 0,68 ölçüldü, gerçeği 1,28. Doğrusu üçgene ışın atmak. Renk seçimi
de tahminle yapılamaz — `tools/atlas-renk.mjs` yazıldı.

## D-101 — Dekorun yedi türü KayKit'e geçer; ölçek kuralı: mobilya 0,90, aydınlatma gerçek boy (S5, 2026-09-10)

**Karar.** Elle çizilen 17 dekor türünün **sekizi** pakete geçti (saksı · büyük saksı · denizlik
saksısı · ayaklı lamba · konsol · tablo · paspas · gazetelik) + konsolun üstüne yeni bir masa
lambası. Dokuzu elle kaldı. Sayılar `docs/dekor-raporu-s5.md`, ham çıktı `docs/olcum-dekor.txt`.

**Planın iki maddesi ÖLÇÜMDE düştü.** Faz S planı adayları **model adına** bakarak yazmıştı:
1. `trash_A/B` çöp kovası değil, **18 üçgenlik ikosfer** (0,127 × 0,052) = yerde duran çöp.
   `dumpster` gerçek konteyner ama iç mekân kovası değil (oran 1,78 ↔ kova 0,46 = 3,9 kat).
   Üç paket tarandı, kova yok → **elle çizilen kova ASIL kalıyor** (ölçüsü gerçeğin ×1,02'si).
2. `cactus_*` yaprak bitkisi değil; biçim oranı saksının 2,4–2,8 katı. Bu bir ölçü değil
   **kimlik** sorunu, o yüzden kullanıcıya soruldu — *kaktüs geçsin* dedi.

**Ölçek kuralı: mobilya 0,90 · aydınlatma GERÇEK BOY.** S3 bunu kasa için bulmuştu (`KASA_S`),
"paketin modül karosu her obje için ölçek değildir". Dekorda iki kez daha ısırdı: `lamp_standing`
0,90'da 2,27 br = karakterin **%130'u**; `lamp_table` 0,90'da 0,90 × 0,92 = masa lambası değil
yer lambası. Artık kural, tesadüf değil — `tests/decor-look.test.ts` 0,90'a dönüşü yasaklıyor.

**Ölçüm yönteminin kendi iki hatası düzeltildi** (S4'ün "yöntem de ölçülmeli" dersinin devamı):
düz parçada (paspas) **boy** karşılaştırması %650'lik sahte sapma üretiyordu — düz parçada ölçek
ENDEN türer. Ve **biçim oranı** (en/boy) hiç ölçülmüyordu: ölçek her zaman ayarlanabilir, biçim
ayarlanamaz. Oran sütunu eklenince planın iki maddesi elendi.

**Yeni ölçüt: AYAK İZİ.** Eski dekor bekçisi parçaları yalnız MERKEZLE denetliyordu — model
geçince merkez aynı kalıp gövde büyüyebiliyor ve bekçi kör kalıyordu. Açıklık artık gövde
KENARINDAN ölçülüyor (`turDunyaKutu` · `govdeMesafe`). Ölçülen en dar açıklık 0,51 br; ihlal yok.

**Kullanıcı kolları:** kaktüs GEÇER · paspas `rug_rectangle_B` **MAVİ** · gazetelik kitaplığa
geçer (ölçüm o modelin **duvar rafı** olduğunu söyledi → zeminden asma bandına taşındı).
S4'ün iki sözü (banket masası · mağaza kartı render'ı) kendi turunda kaldı.

**Kaçan mutasyon bir zayıflık gösterdi (M6).** Bekçi `DENIZLIK_S` sabitini denetliyordu, o
sabitin KULLANIMINI değil; ayrıca saksının denizliğe *sığdığı* hiçbir yerde ölçülmüyordu ve
denizliğin derinliği `Decor.tsx`te gömülü bir sayıydı. Üçü birden düzeltildi: sayı tek kaynağa
çıktı (`DENIZLIK_DERINLIK`), ölçüt "gövde denizliğe sığar" oldu, mutasyon yakalandı.

## D-102 — Sokakta yalnız GÖRÜNEN şerit; pencere duvara gömüldü; tente bilerek kabul edildi (S6, 2026-09-10)

**Turun ana bulgusu ölçüm sırasında çıktı ve planı çürüttü: KARŞI BİNALAR EKRANA HİÇ GİRMİYOR.**
Kamera oyuncunun +z'sinde durup −z'ye bakıyor; oyuncunun z tavanı 17 → kameranın z tavanı
**25,50**, binalar ise 26,5'te. Üç kamera kipinde de (taban · uzaklaş ×1,35 · portre ×1,30)
görünürlük **%0** — binanın tepesi dahil. Gölgeleri de kurtarmıyor (7 boyunda kütlenin gölgesi
z ≈ 22,2'ye düşüyor, görünür şerit z ≤ 20,5).

**Sonuç:** `building_A…H` GEÇMEDİ (10.389 üçgen, %0 karşılık) ve bugünkü 9 renkli kutu SİLİNDİ.
Yol karosu da girmedi: karo kendi kaldırım payını taşıyor (asfalt şeridi karonun yalnız
1,24/2,00'si) → oyunun 2,40'lık gri kaldırımıyla **iki kaldırım** yan yana gelirdi; ayrıca karo
7,00 derin, asfalt bandı 6,00. **Bütün harcama görünen şeride yapıldı** (z 17,5…20,5, %3–14):
lamba ×3 · bank ×2 · çalı ×4 · yangın musluğu · yer çöpü ×2 · taksi. Ölçek **3,636**
(city-builder paketi ORTANCASI; mutfağın 0,90'ı burada −%66…−%81 sapıyor).

**Pencere — kullanıcının *"duvardan ayrı duruyor"* şikâyeti geometriydi, his değil.** Doğrama
duvar yüzünün **0,055 önündeydi**, arkasında hiçbir boşluk yoktu. KayKit `wall_window_open`
ölçüldü ve SEÇİLMEDİ: deliği 1,28 × 1,28 (oyunun bandı 3,20 × 1,65 — pencere yarıya inerdi) ve
modülün kendi yatay oluğu 1,60'ta, lambri 0,94'te → D-100'de reddedilen *"duvar 2'ye bölünük"*
düzenine dönülürdü. Boşluk **duvarın kendisinde** açıldı (`wallLook.wallPieces` + `wallBoxes.y0`);
hangi hattın nerede delineceği `config/decor.ts`ten TÜRÜYOR, iki yere yazılmıyor. Bekçi ölçütü
**korunum**: çizilen duvar alanı = eski alan − açıklık alanı.

**Tente — kullanıcı bedeli GÖREREK kabul etti (F1).** Maket v13'ün tentesi birebir kondu.
Ölçülen bedel: kapı eşiği kameradan **17/22 konumda (%77) görünmez**; bugünkü dikey tabela %0'dı.
Kaçamak arandı ve YOK: yükseklik × derinlik düzlemi tarandı, hiçbir hücre %0'a inmiyor (en iyi
geçilebilir hücre %45), çünkü tente giriş yolunun tam üstünde YATAY bir levha. Ölçüm ayrıca
maketin kendi notunu doğruladı: tentenin duvar YÜZÜNDEKİ yüksekliği 2,64 ≈ lento 2,65.
**Ekran görüntüsü sayıdan daha sert konuşuyor** (`docs/gorsel/ss/s6-sokak.png`): kapı tamamen
kayboluyor. Karar kullanıcının, kayıt burada duruyor; dönülürse kol F4 (dikey tabela 0,34 → 0,72,
%0 kapanmanın sınırı üst kenar 1,97).

**Lavabo — kullanıcının tarifi ölçümle birebir tuttu.** *"Gri renkli hali"* = `kitchentable_sink`
(TEK atlas gözü #828c91, doygunluk 0,11); mutfaktaki `kitchencounter_sink` turuncu ahşap gövdeli.
Model bir MUTFAK MODÜLÜ (0,90'da 1,80 br eninde tezgâh), o yüzden ölçek 0,90 değil bugünkü lavabo
KUTUSUNDAN türedi (G1): çarpıtma 2,62 kabul edildi, karşılığında yerleşim/nav/collision hiç
değişmedi ve tezgâh üstü insan oranı (%49) korundu. Ayna modelde yok, elle çizim olarak kaldı.

**Araç üç kez kendi hatasını buldu — üçü de tek eşiğe güvenmemekten çıktı.** ① "tezgâh üstü"
ölçütü enin YARISINA bakıyordu ve çanağın üstündeki parçaya yapıştı (1,146 okundu, gerçeği 0,996);
eklenen **en profili** yakaladı. ② "dikey yüzey kadrajı hiç kesmez" yazılacaktı, tarama 0,90'dan
itibaren %14 gösterdi — belirleyici olan yüzeyin YÖNÜ değil **üst kenarın yüksekliği**.
③ `propKutu` kutuyu origin etrafında simetrik sanıyordu; `streetlight`in kolu −x'e uzanıyor
(minX −0,239 · maxX 0,030) ve test asimetriyi söylüyordu ama kutu onu KULLANMIYORDU.

**Yan iş — `MERDIVEN_DERINLIK` ölçü katmanına taşındı.** Bir R3F dosyasında (`maketParts.tsx`)
duruyordu ve `tests/logic.test.ts` oradan import ediyordu; o dosya lavabo için `Model`i import
edince zincir `recolor` → `Image`e uzandı ve bir ÇİZİM değişikliği bir MANTIK testini kırdı.
Sabitler `wallLook.ts`e geçti.

Ölçüm `docs/olcum-dis-cephe.txt` · rapor `docs/dis-cephe-raporu-s6.md` · bekçiler
`tests/street-look.test.ts` (19) + `tests/pencere-nis.test.ts` (19), **16 mutasyonla doğrulandı.**

## D-103 — "Duvardan ayrı duruyor" tek bir sayıydı; pencere sadeleşti, lavabo dolaplı-griye geçti (S6/②, 2026-09-10)

Kullanıcı S6'yı ekranda gördü ve dokuz kalem verdi. Turun bulgusu: **şikâyetlerin çoğu ayrı ayrı
kusur değil, TEK bir tahmini sayının farklı yerlerdeki yansımasıydı.**

**KÖK — `WALL_FACE` bir tahmindi.** `FLOOR_HALF + 0.32` = 17,32 yazıyordu; gerekçesi *"krem
gövdenin yüzünün ~0,1 önü (tüm profilleri geçer)"*di. Duvarın gövde yüzü ise **17,41**. Yani
duvara asılan HER ŞEY 0,09 br havada duruyordu. Kullanıcı bunu iki ayrı parçada gördü:
*"sağ en altta bir raf … o duvardan ayrı duruyo"* ve *"alttaki kalorifer duvardan uzakta"*
(petek `WALL_BACK` = 17,15'teydi, üstüne kendi yerelinde 0,04 daha → **0,30 boşluk**).
Sayı artık duvarın kendi kalınlığından TÜRÜYOR (`FLOOR_HALF + WALL_M − WALL_T_BODY/2`) ve
`WALL_BACK` de aynı hat. Bir kalem düzeltildi, altı parça düzeldi.
Aynı kök **lavabolarda da vardı ve kimse bakmamıştı**: maketin `x2 − 0,45`'i gövde 0,66 derin
olduğu için sırtı duvarın 0,12 önünde bırakıyordu → pay da türetildi.

**PENCERE SADELEŞTİ.** S6/E3 boşluğu duvarda açmıştı ama eski çözümün süsleri de taşınmıştı.
Kullanıcı: *"altlarındaki o şerit olmasın, üzerlerindeki kaktüslere de gerek yok, düz cam ve
ışıklar yeter."* Kalktı: derin denizlik · altındaki koyu konsol · orta kayıt · `denizlikSaksi`
(tür listeden tamamen çıktı). Kalan: cam · dış aydınlık panel · ince kasa.
**GÖLGE KAPANDI** — *"gölgeleri havadalarmış gibi duruyo."* Haklıydı: kasa `castShadow`
taşıyordu ve odaya düşen dikdörtgen gölgelerin dayanacağı bir kütle yoktu. Aynı artefaktın
küçük ölçeklisi apliklerde de vardı (zeminde kopuk kahverengi lekeler) → o da kapandı.

**LAVABO — "gri hali" ayrı bir MODEL değil ayrı bir GÖZ.** Kullanıcı: *"dolaplı ama gri olan
var; mutfaktaki turuncular var ya, onların gri halleri olsun."* 238 model tarandı, `*_grey`
varyantı YOK. Ama `kitchencounter_sink` **zaten %70 gri**; turuncu olan yalnız %16'lık [3,6]
gözü — mutfağın tezgâhlarını da turuncu yapan göz. `atlasUV.gozDegistir` ile [3,6] → [0,3]:
yalnız bu modelin geometrisi değişir, mutfak turuncu kalır. (`recolor.ts` seçilseydi aynı gözü
paylaştıkları için mutfak da grileşirdi — D-100'ün "göz ortaktır" dersi.) `Model` bileşenine
`esleme` kolu eklendi. Ayaklı `kitchentable_sink` (S6/G1) bu yüzden geri alındı.

**AYNA KayKit'ten, ÇÖP KUTUSU YOK.** Üç pakette "mirror" modeli yok; `pictureframe_medium`in
TUVALİ ([0,7], 4 köşe, z = 0,150) cam mavisine, ÇERÇEVESİ ([0,3], 84 köşe, turuncuya çalan
kiremit) lavabonun grisine taşındı. **Çöp kutusu ölçüldü ve YOK** (S5'te de ölçülmüştü):
`trash_A/B` 18 üçgenlik yer çöpü, `dumpster` konteyner, biçim oranı tutmuyor → elle çizim kaldı.

**WC girişi:** kapının üstündeki koyu lento şeridi ve kabin kapılarındaki pirinç düğmeler
kaldırıldı (kullanıcı: *"üstteki şeridi ve üzerindeki sarılıkları da kaldır"*).

**GİRİŞ DUVARI CAM — kullanıcı bana bıraktı, ERTELENDİ.** Ölçüm cephenin görünür olduğunu
söylüyor (§V: %8–15, salonun en görünür ikinci şeridi) ve maket de camdı, yani DEĞER. Ama
kapı bloğuna, alınlığa ve duvar temasına dokunuyor; bu turdaki yedi kalemin yanına sıkıştırmak
yerine S7'nin başlığı oldu.

**İki mutasyon KAÇTI ve ikisi de gerçek zayıflık gösterdi.** ① Ayna bekçisi bir ARALIK
denetliyordu ("−0,45 < ön yüz < 0"); aynayı havaya geri asan mutasyon aralıktan geçti → ölçüt
eşitliğe çevrildi ve pay türetildi. ② Gölge kararı `Decor.tsx`teydi, yani vitest'te import
edilemiyordu → karar ölçü katmanına (`PENCERE_GOLGE` · `DUVAR_GOLGE`) çıktı ve bekçilendi.

Bekçi `tests/pencere-nis.test.ts` 29 test · toplam **26 mutasyon** (S6 + S6/②) ·
vitest **864** · duman **42/42** · `tsc -b` temiz · lint taban seviyesinde · beş kadraj gözle
doğrulandı (`docs/gorsel/ss/s6-*.png`).

## D-104 — WC odası: kabin kapısı KayKit'e geçti, seviye MEKÂNSAL okunuyor, müşteri artık kapıda buharlaşmıyor (S7, 2026-09-10)

**Turun ana bulgusu S6'nın tersi çıktı: WC odası EKRANDA.** S6'da karşı binalar üç kamera kipinde
de %0 görünürdü ve 10.389 üçgenlik iş ölçülmeseydi yapılacaktı; burada aynı soru sorulduğunda oda
kapının önünde **%100**, kat genelinde %24–31 görünüyor. Ölçüm ikinci bir şeyi de düzeltti:
2,20'lik ön duvarın örtmesi bir yarım-uzay değil **bant** — duvarın dibi kör, içeri gidildikçe
oda duvarın üstünden yeniden açılıyor. Bu yüzden odaya ne kadar İÇERİ konursa o kadar görünür ve
**öne** eklenen her şey kaybolur.

**KABİN KAPISI → `door_A` (kullanıcı seçimi).** Model gri kasa + kapalı kanat + üstte küçük cam +
iki yüzde itme barı; **%73'ü `[0,3] #828c91`**, yani lavabo ve aynanın S6/②'de taşındığı gri →
**göz taşıması gerekmedi**. Kalan %25 kanadın **yeşili** ve o bilerek duruyor: WC tek bir kahve
kütle olarak okunuyordu (`feedback_color_variety`). Ölçek tekdüze DEĞİL, çünkü tekdüze kollar
ölçülüp elendi — boydan 1,11 br kanat (gözde 0,25 boşluk), enden 2,38 boy (bölmenin 2,00'ını 0,38
aşar). Çarpıtma **1,221**, D-103'ün kabul ettiği 2,715'in altında. Menteşe modelin sol kenarında
olduğu için aralık kapı artık **gerçek menteşeden** dönüyor. `wall_half` · `wall_doorway` ·
`pillar_A/B` kolları ÖLDÜ: hepsi 4,00 (pillar 4,10) boyunda duvar modülü, bölme değil.

**SEVİYE SİNYALİ (G-36) → lavabo VE kabin sayısı birlikte.** Sarı daireler S6/③'te kalkınca
seviye hiçbir yerden okunmuyordu. Ölçüm tek başına lavabonun yetmediğini gösterdi: doğu duvarı
**7,40 br** ve en çok **5** lavabo alıyor, üstelik en öndeki slot duvarın kör bandında **%0**
görünüyor → mekânsal sayı gerçekte **4** kademe taşıyor, `maxLevel` ise **6**. Kabin kapısı kolu
(%27 ile odanın en görünür parçası) kalan kademeleri taşıyor. Eşleme L1(2+2) → L2(3+2) → L3(3+3)
→ L4(4+3) → L5(4+4) → L6(4+5): **her yükseltme tam bir şeyi büyütür.** Lavabo aralığı 1,70 → 1,36
(gövde eniyle aynı). **Denge hiç oynamadı** — `rooms.lavabo`ya dokunulmadı, varyant kapısı açılmadı.
Dürüst not: kaldırılan sarı daireler görünmez değildi (%22/%100); kullanıcı onları biçimleri için
istememişti, yerleri için değil.

**KAYBOLUŞ (G-35) → içeri yürüyüp yana sapma + sönme.** Ölçüm iki şeyi söyledi: kayboluş noktası
kapı önündeyken **%100** görülüyor (her ~2 müşteriden biri uğruyor) ve kapı EKSENİNDE içeri
yürüyen müşteri **hiç saklanmıyor** — saklanma yalnız yana sapınca ve duvar dibindeki 0,2–1,2 br
bantta oluyor. Yol o yüzden **iki bacaklı**: önce kapı boşluğundan düz içeri (tek bacaklı düz yol
duvarın köşesini 0,01 br payla yalıyordu), sonra yana. Final koşu uygulanan yolu doğruladı:
görünürlük t = 0,0'da %100 → t = 0,8'de %0. **Nav'a ve dengeye dokunmadı:** `clampToOpenAreas`
yalnız OYUNCUYA uygulanıyor, müşteri konumu zaten doğrudan yazılıyordu; yeni `wcGiris`/`wcCikis`
durumları `hasLeftTable`'a girdiği için koltuk ve `maxConcurrent` tavanı eskisi gibi kalkış anında
serbest kalıyor. Lavabo ücreti `inWc` bitişinden `wcCikis` bitişine taşındı (aynı kablo).

**BU TURUN ASIL DERSİ — sayı ile ekran birbirinin yerine geçmiyor.** `door_A`nın köşe histogramı
x'te 0,48…1,12 arasında hiç köşe göstermedi ve ilk okumam *"ortası boş, demek ki kasa"* oldu.
Yanlıştı: orası düz bir panelin içi, düşük-poli modelde düz yüzün ortasında vertex yoktur. Aynı
ders S4'te öğrenilmiş ve `docs/dis-cephe-raporu-s6.md` §Yöntem'de **yazılıydı**, yine de ısırdı.
Yazılı kural yetmedi; araç gerekti → **`tools/model-bak.mjs`** (modeli çizip ekran görüntüsü alır).
İkinci kez aynı şey oldu: `padsDone` ile `lavaboLevel` dev kancasında ayrışıyor ve oda açık ama
BOŞ çiziliyordu — testler yeşilken **görsel tur** yakaladı (`feedback_visual_polish`), kural
`wcSeviye()` olarak türetildi.

**Bekçi:** `tests/wc-odasi.test.ts` (26 denetim), **15 mutasyon**. Biri KAÇTI ve zayıf yeri
gösterdi: kaynak denetimi `door_A.gltf` metnini bir YORUMDAN da bulabiliyordu → ölçüt gerçek
`src=` ifadesine çevrildi. vitest **889** · duman **42/42** · `tsc -b` temiz.
Sayılar: `docs/wc-odasi-raporu-s7.md` · taban `docs/olcum-wc-odasi-taban.txt` · final
`docs/olcum-wc-odasi-final.txt`.
