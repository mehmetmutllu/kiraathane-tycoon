# decisions — Tasarım/Teknik Karar Günlüğü

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
