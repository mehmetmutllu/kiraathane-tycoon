# Genel tarama raporu — 2026-10-09 (mantık · mağaza · kayıp · performans · UI)

> 9 Opus ajanı (salt-okunur) + App Store Connect kontrolü + WordMaster / AI Dungeon terminallerinden yöntem.
> Kod yazılmadı. Bu dosya Sprint A/B/C'nin **tasarım kaynağıdır**; plan dosyaları bundan türetilir.
> Ham görüntüler oturum scratchpad'indeydi (geçici): UI kontakt sayfası 58 kare — Sprint B'de yeniden çekilecek.

## 0. Kullanıcı kararları (2026-10-09)
- **Sıra:** Sprint A (mantık/mağaza/kayıp/perf, arayüze dokunmaz) ÖNCE → Sprint B (ChatGPT tasarım turu) → Sprint C (UI uygulama).
- **ChatGPT turu:** DÜZEN için katı kurallar (tam ekran panel, geri sol üst / cüzdan sağ üst, ≥48 px dokunma, 8'in katı boşluk, safe-area, TR+EN uzunluk payı). **RENK PALETİNİ ChatGPT kendisi seçer**, gerekirse 2-3 palet seçeneği sunar; biz cırt palet dayatmayız. Mor kalabilir ya da gidebilir — ChatGPT'nin önerisi + kullanıcı seçimi.
- ChatGPT'ye kullanıcının şikâyetleri **açıkça** yazılır: paneller boğuk/her şey aynı ton/neyin ne olduğu belli değil · alt bar kötü · **çapraz ikiye bölünmüş renk pulları** eşyayı anlatmıyor (yerine eşyanın küçük resmi) · dekor seçince önce kırmızı kutu görünmesi.
- **Alt bar:** uygulamanın ihtiyacına göre tasarlatılır; mevcut 4 sekme yeterliyse sayı korunur, yalnız tasarım yenilenir (D-106 geometrisi yeniden açılabilir).
- **Başlangıç Paketi:** kullanıcı "geri yüklemede bir kez daha 100 💎 vermek kayıp/bug değil mi?" diye sordu → §4.4'teki açıklama sonraki oturumda sunulacak, karar onun.
- Sprint yöntemi: hafıza `feedback_sprint_yontemi.md` (orkestratör + paralel Opus + dosya sahipliği + defter + token tasarrufu).

## 1. App Store durumu (Chrome, 2026-10-09)
- 1.0.0 + 5 IAP 2026-10-08 15:22'de yeniden gönderildi (6 öğe), hepsi Waiting for Review; eksik meta veri yok.
- Business: Free + Paid Apps sözleşmesi, banka, W-8BEN, DSA → hepsi **Active**. Export Compliance plist'te.
- Geri çekme bekleme süresini sıfırladı (≈1 gün). Eski hızlandırma isteği eski gönderime bağlı kalmış olabilir; pazartesiye dek hareket yoksa yeniden istenir.
- **İnceleme bitmeden iOS'a build gönderilmez** (sıra sıfırlanır). Play kapalı teste güncelleme serbest.

## 2. Mağaza ret riski + kullanıcıya geri bildirim (Paket P1)
| # | Sorun (doğrulandı) | Düzeltme tasarımı |
|---|---|---|
| 1 | `iap.ts:125` fiyatlar açılışta bir kez; `kur()` düşerse `arkaUc` hep null; HUD `:1750` "Tekrar dene" yazıyor ama yol yok; tek ürün eksikse uyarı tüm listeye | `kurulumDene()` + `fiyatYenile()` (birleştirerek) → `magazaYenile(neden)` tek uçuş kilidi; geri çekilme 2→4→8→16→30 sn ×5 (`iap.config.ts` `yeniden`); tetik: açılış, ön plana dönüş, Paketler sekmesi, "Tekrar dene" düğmesi; `magazaDurumu(): hazir/yukleniyor/yok`; uyarı yalnız `yok` ve hiç fiyat yokken |
| 2 | `ads.ts:83-95` ATT, `initialize`+`requestConsentInfo` ile tek try'da → onlar düşerse ATT hiç sorulmuyor; `initialize` rızadan önce; `canRequestAds` okunmuyor | Sıra: `requestConsentInfo` → (REQUIRED ise) form → **iOS: görünürlüğü bekle (≤3 sn) + ATT ayrı try** → `canRequestAds` ise `initialize` → yükle. Bilgi null ise SDK başlatılmaz, ön plana dönüşte yeniden. Test: sıra testi `ios-platform.test.ts:151-158` güncellenir; consent hata atınca ATT yine çağrılır |
| 3 | `iap.ts:131` `islemde` iken `urunFiyati` null → satın alırken "Mağazaya bağlanılamadı" + fiyatlar "—" | `urunFiyati` yalnız fiyat; ayrı `islemdeUrun()` / `satinAlmaMesgul()`; düğmede gösterge "Bekleniyor…" |
| 5 | `ads.ts:151-160,177` yükleme hatasında yeniden deneme yok; `kur` düşerse oturum boyu reklam yok; `kapanisiBekle` (`:68-79`) zaman aşımı yok, dinleyici await edilmeden `goster()`; takılırsa `reklamAcik` hep true → ödüllü ölür + `App.tsx:105` arka plana geçişte **kayıt/çevrimdışı çalışmaz** | Geri çekilmeli yeniden yükleme (15 sn → 300 sn, `ads.config.ts`); `reklamYenidenKur()`; `kapanisiBekle`: dinleyiciler await, Showed yoksa 10 sn'de red, 180 sn üst sınır, `finally` remove; `reklamAcik=false` her yolda finally |
| 6 | `Paketler.al`/`BaslangicTeklifi.al` sessiz; `satinAl` iptal/ağ/bekleyen hepsi `null` | Sonuç birleşimi `tamam/vazgecti/bekliyor/zatenSahip/hata` (RevenueCat kodları 1/20/6/10); ortak `useSatinAl()`; mesajlar TR+EN (ChatGPT mikrometin); ödüllü `odul/yarida/gosterilemedi` → "Reklam şu an yüklenemedi" |
| — | Diğer (UI taraması): EN'de ödül düğmesi "Al"→"Buy" (ücretsiz ödül satın alma gibi); `CharacterPanel.tsx:111-112` 'bardak'/'alan' t() dışında; EN öğretici satırları kesik; görev bandı "0/1" yarım; ErrorBoundary + webglcontextlost yok; gizlilik linki hep `#tr` (`yasal.config.ts:6-7`); `PrivacyInfo.xcprivacy` yok (uyarı, red değil); Restore yalnız Ayarlar'da (Paketler altına da) | Sprint A'ya küçük kalemler olarak (metinler ChatGPT turuna `_taslak`) |

## 3. İlerleme / para kaybı (Paket P2 + P3)
**Kalıcı kayıt + bulut (ücretsiz, yeni hizmet kaydı yok):**
- `@capacitor/preferences@8.0.1` ana depo (iOS UserDefaults / Android SharedPreferences; OS silmez), localStorage hızlı kopya. `main.tsx` render öncesi `await kalicilikHazirla()` (loadSave şu an senkron).
- Kayıt zarfı `{v, n, sum, data}` + dönen yedekler `yedek.0..2` (≈5 dk, yalnız sağlam kayıttan) + `kiraathane.save.bozuk` karantina; tüm adaylar bozuksa sessiz sıfırlama YOK (ham veri ezilmez) + kullanıcıya not. Kayıt ~1,2 KB boş / ~9 KB geç oyun.
- `kayitDogrula`: Decimal alanlar sonlu ≥0 (NaN cüzdan yedeğe düşürür), sayı/metin dizileri ve sözlükler eleman bazında temizlenir (`save.ts:425-443`). Doğrulama `kayitCoz` içine → bulut da korunur.
- **iOS:** iCloud Key-Value Storage, yerel Capacitor eklentisi `eklentiler/bulut-kayit/` (Swift ~70 satır + Package.swift, `file:` bağımlılık; SPM). Portal: App ID → iCloud kutusu (CloudKit'siz). `ios/App/App/App.entitlements` (`com.apple.developer.ubiquity-kvstore-identifier`) + pbxproj `CODE_SIGN_ENTITLEMENTS` + codemagic entitlement grep'i; profil yeniden üretilir. Gizlilik etiketi değişmez; hesap silme gerekmez. → **iOS 1.0.1 (onaydan sonra).**
- **Android:** Auto Backup açık (allowBackup) → `dataExtractionRules` + `fullBackupContent` açık yazılır (sharedpref dahil). İsteğe bağlı Block Store. Play Games: arkadaş APP_ID verirse tek satır.
- `bulut.ts` → genel `BulutArkaUcu`; seçim kuralı: `sifirlamaNo` (yeni) > lifetime > xp > lastSaved.
- Test: zarf/sağlama, yedek dönüşü, karantina, sifirlamaNo, KVS sahte arka uç; cihazda `adb shell bmgr backupnow` → kaldır/kur.

**Satın alma uzlaşması (P2):**
- RevenueCat **anonim** çalışıyor → tüketilen 💎 yeni cihazda hiçbir yoldan dönmez (Billing 8 + RC belgesi). Çözüm: kalıcı `rcKimlik` (UUID; Preferences + KVS/BlockStore + kayıt) → `configure({appUserID})`, mevcutlarda `logIn` (alias).
- `SatinAlim` ek alanları: `uzlasmaBasi` (bu tarihten önceki işlemler işlenmiş sayılır; eski kayıtta "şimdi"), `baslangicElmas`, `hakKimlik`.
- `magazaUzlas(info)`: `nonSubscriptionTransactions` tarih sıralı; `< uzlasmaBasi` veya `islenen`'de olan atlanır; açılış, `addCustomerInfoUpdateListener`, satın alma dönüşü, ön plan, geri yükleme. `ISLENEN_SINIRI=50` yalnız uzlasmaBasi ile güvenli.
- Sahte kimlik `${urun}:${Date.now()}` (`iap.ts:79`) kaldırılır; transaction yoksa customerInfo'dan gerçek kimlik.
- Ask-to-Buy/SCA/kapanma: onaylı işlemin 💎'ı sonraki açılışta bir kez gelir.
- **Reklamsız düşmesi** (`App.tsx:52`, `store.ts:1147-1154`): asimetrik eşitleme — false→true anında; true→false yalnız aynı `appUserID` (iade). Android açılışta sessiz `syncPurchases`; iOS'ta sessiz restore YOK.
- Dış kontrol (arkadaş): RevenueCat'te Android `kiraathane_baslangic` + `kiraathane_reklamsiz` türü **Non-consumable** olmalı (yoksa SDK tüketir).

**Görev hattı + küçükler (P3):**
- `store.ts:762` `eksikPadGorevi` geri sarar; `kayitVerisi` (`:262`) `questsDone = completedQuestIds(index)` → ilerideki kimlikler silinir; `questSystem` `questIndex += 1` → aradaki görevler ₺+XP'yi **ikinci kez** öder. Düzeltme: state'te `questsDone` kaynak, `questIndex` ondan türetilir (tek doğru kaynak). [NÖTR]
- `tick.ts:287` `teasServedByArea` klonlanmıyor (mutasyon). [NÖTR]
- Gece yarısı günlük görev reklamı ödülsüz: `DailyState.onceki` + `claimDailyQuest(id, izledi, gorulenGun)`. [NÖTR]

## 4. Saat hilesi + denge kapılı (Paket P4 — sonra)
- `rules.ts:885` `adFreeDailyReady` `!==` → tarih ileri/geri = **sınırsız 10 💎**. → `gun > gunlukGun`.
- Çevrimdışı gelir ileri-geri-düzelt döngüsü (`store.ts:774,1456-1474`) → `guvenliSimdi()` (RC `requestDate` farkı / `saatIzi.enIleriAn`), `lastSaved` hiç geri yazılmaz.
- `masterAdsLeft :815`, `videoRights :826` geri günde hak tazeleme; `dailyQuests.ts:163` saat ileri kayınca görev donması (dürüst oyuncu da).
- [DENGE] 12a görev ₺'si gelir izine girmiyor (`tick.ts:~1526`) · 12c `offlineIzleEki` eziliyor (`store.ts:1471`; topla mı max mı) → D-084 varyant kapısı.
- Test: `saat-hilesi.test.ts`; `npx tsx tools/simulate.ts` kısa koşu "dürüst oyuncu aynı".

### 4.4 Başlangıç Paketi — kullanıcı sorusu ve cevap taslağı
Soru: "Bir kez daha vermek bug/kayıp değil mi? Kullanıcı bir kez almış, kullanabilir."
Cevap taslağı: Normal oyunda (aynı telefon, aynı kayıt) geri yükleme **hiçbir şey vermez** — 💎 zaten kayıtta. Tek durum: oyuncu telefon değiştirdi / uygulamayı silip kurdu ve **kaydı gelmedi** (bulut yoksa sıfırdan başlar). O yeni kayıtta 100 💎 yoktur; Apple "geri yüklenebilir ürün, geri yüklemede satın alınan içeriği vermeli" der. Bulut kaydı (iCloud/Auto Backup) gelince eski kayıt bayrağıyla döner → tekrar verilmez. Yani ikinci kez ödeme değil, kaybolmuş içeriğin teslimi; sil-kur hilesi ilerlemeyi sıfırladığı için değersiz. Alternatif (kullanıcı isterse): geri yükleme yalnız Kurucu kıyafetini versin, 💎'ı hiç vermesin — Apple riski düşük ama mevcut ürün açıklaması "100 elmas" diyorsa açıklama güncellenmeli. Karar kullanıcıda.

## 5. Performans (doğrulandı; görüntü değişmeyenler önce)
**Paket 1 (kalite 0, Sprint A'ya):**
- #5 Android'de arka planda müzik/AudioContext + 10 sn/120 sn zamanlayıcılar sürüyor, reklam sırasında müzik çalıyor (`App.tsx:104-111`, `audioWeb.ts`, `musicWeb.ts`, `bulut.ts:283`) → gizlenince `ctx.suspend()` + döngüleri durdur, reklamda kazanç 0.
- #2a/b Tam ekran panel (opak) açıkken sahne 60 fps çiziliyor → `Sheet` sayacı + `useFrame(cb,1)` render atlama (tick sürer); durağan önizlemeler (Diorama/Masa teması/Dekor) `frameloop="demand"` (duman `__kareSayaci` denetimi "≥1 kare"e).
- #1 Müşteriler `frustumCulled=false` (`Customers.tsx:137-138,161-162`) + görünmeyende `mixer.update` (`:425`) → kırpma açık (bounding sphere ×1,5) + biriken dt ile görünmeyende animasyon atlama.
- #3a Cihaz sınıfı anahtarı sabit, güncellemede bile sıfırlanmıyor (`cihazSinifi.ts:22`) → `PERF_SURUM` ile sürümle (yanlış "zayıf" damgalı cihaz gölgeyi geri alır).
- #9 drei `Merged` `frames=Infinity` (`Tables.tsx:324`, `KayWalls.tsx:56`, `Kitchen.tsx:261`) → `frames={3}`.
- `shadows="soft"` → `"percentage"` (r184 zaten PCF çiziyor; birebir).
- #7 dolumda HUD/Pad her kare render → seçiciler biçimlenmiş metin döndürsün, çubuk `useFrame`+`getState`; `fmt` Intl önbelleği; #8 joystick ref+rAF; #11 müşteri geometrisi gövde türü başına paylaşılır.
- Ölçüm: üretimde `localStorage['kiraathane-olcum']==='1'` ile `__perf`; `npm run apk` + `chrome://inspect` + `dumpsys gfxinfo/batterystats`; ABBA.
**Paket 2:** kamerayı izleyen dar gölge kesiti (teksel yuvarlama; muhtemelen daha keskin) · tek kalıcı önizleme tuvali · müzik `HTMLAudioElement` akış (−20 MB; döngü kulakla) · Baloo2 alt küme · animasyon klip ayıklama · `Rogue_Hooded.glb` dist'ten dışla (test tuzağı, silinmez) · GroundMarker dispose · blur'lü modallerde sahne dondur.
**Paket 3 (kullanıcıya yan yana sorulur):** dpr/MSAA kademesi (cihaz ölçümüne bağlı) · cihaz sınıfının oyun içinde yeniden değerlendirilmesi · isteğe bağlı 30 fps pil ayarı · instanced duvar/mobilya/fayansta gölge bayrakları drei'de Group'a gidiyor (gölge düşürmüyor olabilir — kalite kararı).
**Daha önce reddedilenler (tekrar önerme):** gölge harita boyutu, gölgeyi kendiliğinden kapatma, blob, kod bölme, müşteri tavanı, A*, sızıntı avı, React commit 0, iskeletli instancing.

## 6. UI teşhisi (Sprint B girdisi)
- Mor payı (390 px): Görevler %94, Hedefler %90, Ayarlar %92, Paketler %94, Masa sekmesi %97, alt bar %94. Kart/zemin kontrastı **1,19:1** (ayrışma için ≥1,5-3), kontur 1,21:1. Tek amber aksan her yerde (geri, seçili sekme, satın al) → önemli düğme öne çıkmıyor; mağazada yanında yeşil "Satın Al" yarışıyor. İkincil metin 3,84:1.
- Alt bar (`hud.css:708`): ekranla aynı gradyan, sekme zemini yok, 25 px lavanta ikon, 13 px etiket.
- **Kırmızı kare kök nedeni:** dekor modelleri `useGLTF.preload` edilmiyor; Suspense yedeği kırmızı kutu (`VitrinDekor.tsx:154` koltuk #7c2230, `:249` yılbaşı #9b1c22, `:243` halı #b3262a); `DekorCekimi.tsx:60` yalnız boş kutuyu atlıyor → kutu fotoğraflanıyor, 0,5 sn sonra model. Düzeltme: preload + yedek çizilirken çekme yok + tarafsız yer tutucu. (Sprint A'da yapılabilir — saf hata.)
- **Çapraz pullar:** `HUD.tsx:1992-1997` `renderStrip` 135° iki renk; `kozmetik.ts:75-89` `DEKOR_PULU`; kıyafet/tepsi/zemin/duvar/kurucu da aynı. Okuma koltuğu pulu kahve, model camgöbeği. → **Öneri A:** build-time Playwright betiği oyunun kendi çekimiyle 38 kozmetiğin küçük resmini `public/assets/thumbs/*.webp` (≈0,3-0,5 MB) üretir; bekçi testi.
- Diğer: video kartı kapatma düğmesi tarayıcı varsayılanı (`.sheet-x` CSS yok); 360×640'ta dekor şeridi 7. pulda kesik (12'nin 5'i görünmüyor, kaydırma belli değil); "İZLE" Luckiest Guy ile yazıda (D-160 ihlali olası).
- Uyulacak kilitler (kullanıcı açmadıkça): tam ekran panel + geri/cüzdan (D-106/110), büyük önizleme + tek satın al, emoji/CSS ikon yok + oyun fontu, referans 3D arcade-idle (My Perfect Hotel, Burger Please), renk çeşitliliği, 6-12 adayı aynı kadrajda göstererek seçtir, karar sade+örnekli. D-107 (mor) ve `tests/mor-dil.test.ts` yeni karar gelirse güncellenir.

## 7. ChatGPT tasarım turu yöntemi (AI Dungeon'dan, Sprint B)
1. Envanter + ekran görüntüleri (390×844). 2. Claude in Chrome → ChatGPT: ekler (mevcut ekran + sahnenin sıcak ahşap görüntüsü), oyun tarifi, **şikâyet listesi (§0)**, düzen kuralları, "tek resimde 3 telefon: Mağaza · Görevler · Dekor seçimi + alt bar", altına ölçü/renk/font listesi; **palet ChatGPT'de** (2-3 palet yönü iste). 3. Adaylar tek artifact panoda yan yana; seçim sohbette. 4. Seçilen yönde **macenta (#FF00FF) zeminli parça sayfası** (panel, sekme seçili/seçisiz, birincil/ikincil düğme, kart, fiyat hapı, ilerleme çubuğu, kilit rozeti, kozmetik karesi boş/seçili/kilitli) → kesim betiği (AI Dungeon `F:\ai-dungeon\tools\icons\s18_cut.py`, `key_magenta.py`, `slice.py` uyarlanır; Python `-I`, rb/wb) → `public/assets/ui/kit/` + MANIFEST (9-slice) → CSS `border-image`. 5. İkon envanteri + stil cümlesi + 4×4 macenta ızgara. 6. Mikrometin: `_taslak` → ChatGPT "UX yazarı gözüyle eleştirel bak, YALNIZ değişenleri JSON ver, sınır…". 7. ChatGPT görsel hakkı dolarsa PushNotification + hesap değiştirt. Ders: ChatGPT'nin HTML/CSS'i yalnız oran referansı; Claude kendi yorumunu katmaz.
Kaynaklar: `F:\ai-dungeon\docs\tasarim\s18-istem-1-oyun-ekrani.md`, `docs\ikonlar.md`, `docs\metinler\chatgpt-gorsel-s23.md`, `docs\sprintler\s23-notlar\ORTAK-BRIFING.md`, `docs\ux-tahlil-raporu-2026-10-07.md`.

## 8. Önerilen sprintler
- **Sprint A (ilk):** P1 + P2 + P3 + perf Paket 1 + kırmızı kare + küçük UI/i18n hataları (ErrorBoundary, gizlilik `#en`, PrivacyInfo, "Buy"→ayrı anahtar taslak). Ajan bölünmesi (dosya sahipliği): ① iap.ts+iap.config (P1 #1,3,6 + P2) ② ads.ts+ads.config+App.tsx (P1 #2,5 + perf #5) ③ save.ts+bulut.ts+Preferences+Android backup kuralları (P3 kayıt) ④ perf Paket 1 (three/ bileşenleri). store.ts/HUD.tsx/tick.ts birleştirmesi orkestratörde. Sonunda Play AAB (`npm run play:paket`) → arkadaşa; iOS kısmı (iCloud eklentisi, entitlement) hazır bekler → onaydan sonra 1.0.1.
- **Sprint B:** ChatGPT tasarım turu + küçük resim betiği + mikrometin turu.
- **Sprint C:** UI uygulama (paralel ajan, defter, ekran görüntüleri).
- **Sonra:** P4 (varyant kapısıyla) + perf Paket 2/3.
