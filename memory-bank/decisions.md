# decisions — Tasarım/Teknik Karar Günlüğü

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
