# activeContext — ŞU AN

> En sık güncelleyen dosya. Her anlamlı adımdan sonra güncelle.

## ŞU AN (2026-09-06 — PLANLAMA OTURUMU; KOD DEĞİŞMEDİ, SAVE v30)

`src/` DOKUNULMADI. Bu oturum tamamen denetim + tasarım + planlama.
**Ana çıktı: `docs/plan-kat1-yayin.html`** — artifact https://claude.ai/code/artifact/62027184-9196-4da4-83ce-b7bd347d78ac
Maket de güncellendi: `docs/maket/maket-v13.html` (içerik v15) — artifact https://claude.ai/code/artifact/813bdc4c-3052-46ca-ac3b-23076f425b23

### >>> SONRAKİ OTURUMDA İLK İŞ <<<
Kullanıcı: *"sen oturumu kaydet, sonraki chatte planı netleştirelim ona göre hareket ederiz."*
**Yani: önce PLANI BİRLİKTE GÖZDEN GEÇİR, sonra koda başla.** Plan artifact'ini aç, §14'teki açık
kararları kapat, sonra **Faz G**'den (ışık → temas gölgesi → plank geometrisi → duvar bitimi) başla.

### Bu oturumda ne oldu — üç bölüm

**1. Maket v14–v15** (`docs/maket/maket-v13.html`, dosya adı v13 kaldı):
Kat 1'in dört eksiğinden ikisi kapandı — sokak cephesine **cam vitrin** (`shopFront` · `shopGlass`
· `shopWins` · `doorLeaf`) ve **sol duvar programı** (askı rayı · konsol raf · **televizyon** ·
gazetelik). Sonra kullanıcı *"güzel ama düzgün durmadı"* dedi → dört ayrı kusur bulundu:
- duvar 2,7 iken kapı boşluğu 2,9'du, **kapı duvardan taşıyordu** → `WALL_H = 3.2` sabiti
- cam bandının üstünde **alınlık yoktu** → kaide 0–0,4 · cam 0,4–2,65 · lento · **alınlık
  2,65–3,2 (tabela)** · üst kordon
- tente alınlığın **üstündeydi** ve **eğimi tersti** (dış kenar yukarı kalkıyordu) →
  lentonun altına indi, `rotation.x` −0,18 → **+0,18**
- kapı kanadı içi dolu ahşap kutuydu, camın arkasında tahta kalıyordu → `doorLeaf` iki dikme +
  üç kayıt olarak yeniden yazıldı, **çift kanatlı camlı**, sağ kanat içeri açık
**Gölge sızması** da düzeldi: içerideki rafların gölgesi duvarın DIŞ yüzüne sızıyordu →
`shadow.normalBias` 0,02 → **0,14** (duvar kalınlığından küçüktü), `bias` −0,0004 → −0,0012.
Yan etki kabul edildi: Kat 2–3 duvarları da 3,2 oldu; sınır duvarları 2,9 → `WALL_H` (7 yer).

**2. Denetim ve araştırmalar**
- Fable 5.1 ile `src/` tam tarandı (9.669 satır); bulgular kodda **doğrulandı**.
- Üç araştırma daha: asset/doku kaynakları · idle tempo kıyaslaması · GPT-6 Astra.

**3. Plan** — `docs/plan-kat1-yayin.html`, 14 bölüm, karar defteri K1–K18, açık 4 karar.

### Bu oturumun KALICI kararları (decisions.md D-037 … D-048)
- **D-038 Tek Odak Kuralı** — pad + seviye + görev TEK listede; dünyadaki işaret, alt bant metni,
  kamera odağı ve kenar oku dördü de tek `activeStepId`'den türer. **Kök sebep kodda doğrulandı:**
  `visiblePads` pad'leri göreve göre filtreliyor ama `optional:true` pad'ler ve
  `upgradeFills` / `tableUpgradeFills` bu filtrenin **tamamen dışında** çiziliyor.
  Usta (L4) noktaları listeye GİRMEZ — rozet olarak görünür.
- **D-039 L1–L3 para, L4 "Usta" reklam/💎, KRİTİK YOL DIŞI, masa başına** (20 masa = 20 hedef).
  Reklam hazır değilse **pad yine görünür**, yalnız buton pasifleşir.
- **D-040 "Reklamları Kaldır" IAP elmas geliri satar** (kalıcı günde 10 💎) — L4'ü parayla satmaz.
- **D-041 Zemin/duvar DOKUSU KULLANILMAZ** — `d08c445` canvas-tile parke denendi, `d29b7d9`
  geri alındı. Çözüm sırası: ışık → temas gölgesi → plank/karo geometrisi → duvar bitimi →
  KayKit. **Kod Lambert değil `meshStandardMaterial` (153 yer), `flatShading` hiç yok.**
- **D-042 KayKit CC0 + 5 Türk objesi elle.** AI ücretsiz planları **YASAK**: Meshy free =
  CC BY 4.0 atıf zorunlu · Tripo free = ticari yok · Hunyuan3D (Spline AI dahil) = AB/UK yasak.
  Semaver zaten makette var (`samovar()`), taşınacak.
- **D-043 Tost tezgâh seviyesiyle gelir**, alanla değil. Ürün makinesi zaten tamamen kurulu;
  ürünü bölgeye bağlayan tek şey `zoneProduct(z)` — 12 çağrı noktası ondan geçiyor.
- **D-044 Kritik yol 5–7 saat**; tekrarlı yükseltmeler kritik yol DIŞI (+6–10 sa isteğe bağlı
  derinlik), Usta katmanı açık uçlu. Uzatma ×6 değil **×3,5**.
  Başarı ölçütü saat değil **retention: D1 ≥ %40 · D7 ≥ %10 · oturum 8–12 dk.**
- **D-045 Astra: disipline göre bölme yok, tek ekranda A/B.** `store.ts` / `economy.config.ts` /
  `save.ts` / testler bölünmez.
- **D-046 Global garson havuzu + sipariş tabanlı servis** (son turda eklendi, aşağıda).
- **D-047 Servis noktası tek merdiven:** L1–L3 Çay Ocağı · **L4 → TEZGÂH** · **L5 TOST açılır** ·
  L6 son ₺ · Usta (L7). Mevcut `costsByLevel` altı girdiyle birebir → **şema değişmiyor**.
- **D-048 Astra kullanımı zorunlu değil**; karar arayüz A/B çıktısından sonra verilecek.

### Kullanıcının son turda eklediği şartlar (D-046'nın kaynağı)
- **Çay garsonu / tost garsonu ayrımı KALKACAK** — *"öyle bir masa ve alan ayrımı da kalmadı,
  globalleşmesi lazım."*
- **Senkronizasyon çok iyi olmalı:** hiçbir masa **starvation** çekmemeli · garson yanından
  geçtiği masaya **elindekini bırakmamalı**, kime gidecekse ona gitmeli · **garson sayısı ideal**
  olmalı.
- **Sipariş toplanmalı:** *"bir masa 2 tost 1 çay istiyorsa ona göre sipariş toplanıp gitmeli"* —
  sabır, bekleme ve hazırlanma süreleri buna göre ayarlanmalı.
- **Retention verisi tutulacak** (onaylandı).
- **Frontend merakı:** kullanıcı benim *"çok uğraştığım"* arayüz denememi görmek istiyor;
  o denemede **asset'ler de elde olacak**. Astra kararı ondan sonra.

### Kalan açık kararlar (planın §14'ü)
1. 5–7 saatlik kritik yol onayı — zincirin bütün fiyatlarını bu belirliyor
2. Kat 2'nin ürünü (Türk kahvesi önerildi; pizza da mümkün)
3. Arayüz A/B testi yapılacak mı
4. Interstitial sıklığı (plan 3 dk; kıyas: My Perfect Hotel ~90 sn)

### Bilinen, ertelenmiş bug
Maket girişinin üst çıtasında renk yalpalanması (z-fighting) — kullanıcı *"oyuna geçerken
hallederiz"* dedi.

## ŞU AN (2026-09-05 — v15: CEPHE ORANLARI DÜZELTİLDİ; KOD DEĞİŞMEDİ, SAVE v30)

Kullanıcı v14 vitrinine baktı: *"dışarıdaki camlar güzel ama düzgün durmadı sanki, acaba duvarları
az daha mı yükseltsek ne diyosun? ve ön taraf cam olarak daha güzel durabilir belki o şekilde."*
Haklıydı — dört ayrı kusur vardı, hepsi düzeltildi. **Karar: `decisions.md` D-037.**
SS: `docs/maket/ss/v15-cephe.png` · `v15-adim1.png` · `v15-adim6.png` · `v15-kat2.png` · `v15-kat3.png`

### Teşhis (dört kusur) ve çözümü
1. **Duvar 2,7 iken kapı boşluğu 2,9'du → kapı duvardan taşıyordu.**
   → `WALL_H = 3.2` sabiti eklendi (`wall()` varsayılanı buradan gelir); kapı boşluğu 2,65.
2. **Cam bandının üstünde tabelaya yer yoktu**, bina alçak bir baraka gibi duruyordu.
   → Cephe dizilimi: kaide 0–0,4 · cam 0,4–2,65 · lento · **alınlık 2,65–3,2** · üst kordon.
   Alınlığa çerçeveli koyu levha + küçük pirinç harfler (ortada kelime boşluğu).
3. **Tente alınlığın ÜSTÜNDEYDİ ve tabelayı kapatıyordu; üstelik eğimi tersti** (dış kenar yukarı
   kalkıyordu; `rotation.x = -0.18`). → Tente lentonun ALTINA indi, eğim `+0.18` (dış kenar aşağı).
   Not: `buildingBelow` zaten `+0.18` kullanıyordu, cephe tutarsızdı.
4. **Kapı kanadı içi dolu ahşap kutuydu**, camın arkasında tahta kalıyordu → cam cam görünmüyordu.
   → `doorLeaf(w,h)` iki dikme + üç kayıt olarak yeniden yazıldı, gövde içi boş; üstte cam göz,
   altta ahşap etek, pirinç dikey kol. **Çift kanatlı, sağ kanat içeri açık** (menteşe sağ sövede,
   ry = −1,15 · merkez x+1,77 · z 16,04).

### Yan etki (bilinçli kabul edildi)
`wall()` varsayılanı değiştiği için **Kat 2 ve Kat 3'ün duvarları da 3,2** oldu; kilitli alan sınır
duvarları 2,9'dan `WALL_H`'e çekildi (7 yerde). `windowWall` (sağ duvar) da h = WALL_H, pencere başı
2,45 → 2,80 (cephe camıyla aynı hiza). Üç kat da Playwright'la kontrol edildi: **0 konsol hatası**,
kamera görünürlüğü bozulmadı — iç mekân aksine daha oranlı okunuyor.
`archCol()` (2,7) artık 3,2'lik duvarda bir geçit portalı; doğru okunuyor, dokunulmadı.

## ŞU AN (2026-09-05 — v14: CAM CEPHE + SOL DUVAR; KOD DEĞİŞMEDİ, SAVE v30)

`src/` DOKUNULMADI. **Çalışılan dosya: `docs/maket/maket-v13.html`** (dosya adı v13 kaldı, içerik v14).
**Artifact (canlı, aynı link):** https://claude.ai/code/artifact/813bdc4c-3052-46ca-ac3b-23076f425b23
SS: `docs/maket/ss/v14-adim1.png` · `v14-adim3.png` · `v14-adim6.png` · `v14-cephe-sokak.png` ·
`v14-cephe-yakin.png` · `v14-solduvar.png`

### Bu oturumda ne yapıldı
Kullanıcı iki seçenekli soruya cevap verdi: **"önce eksikleri kapat, sonra entegrasyon haritası"**
ve **"maket devam"** (src/ donuk kalsın). Kat 1'in dört eksiğinden **ilk ikisi kapatıldı**:

1. ✅ **CAM CEPHE (eksik #1, en büyüğü).** Ön duvar (z = +17) artık düz duvar değil, **vitrin**.
   Yeni yapı taşları: `shopGlass(w,h)` · `shopWins(len)` · `shopFront(x1,z1,x2,z2)`.
   `windowWall`'dan farkı: kaide 0,5 (yerine 1,15 denizlik değil), cam 0,5 → 2,5, üstte lento,
   ~1,9'da bir ince ahşap dikme, vasistas kaydı, camda pirinç isim şeridi. Bölümleme otomatik:
   uçlarda 0,9 · aralarda 1,5 ayak, gözler ~5,8'i geçmez. Adım 1'de iki 4,5'lik göz, adım 2+'de
   kapının iki yanında ikişer 5,75'lik göz. **Kapı ve tente aynen kaldı.**
2. ✅ **SOL DUVAR PROGRAMI (eksik #2).** Adım 3'te ocak arkaya taşınınca boşalan z 2…14 arası
   13 birim dolduruldu — **oturma EKLENMEDİ** (masa sayısı ve ekonomi zinciri bozulmasın diye):
   askı rayı (z 3,0) · uzun konsol raf + üstünde tablo (z 7,0) · **TELEVİZYON** (z 10,8) ·
   gazetelik (z 13,2) · iki aplik · ayakta TV izleyen bir müşteri.
   Yeni yapı taşları: `askiRayi(len)` · `konsol(len)`.
   **TV kararı:** kıraathanenin en tanımlayıcı duvar öğesi; ileride kendi seviyesi olan bir obje
   olabilir (henüz karar değil, not).
3. ✅ **Yeni inceleme kancası:** `window.__bak(azi, ele, dist, tx, ty, tz)` — Playwright'ın belirli
   bir açıdan ekran görüntüsü alabilmesi için. `window.__maketScene` ile aynı amaçta.
4. ✅ Adım 1 ve adım 3 açıklama metinleri (STEPS[1]) yeni eklemelere göre güncellendi.
5. ✅ Playwright MCP 1440×960: adım 1/3/6 çizildi, **0 konsol hatası**. Vitest 186/186.

### Geri alınabilirlik (yorum işaretli bloklar)
- `>>> CAM CEPHE (vitrin) ... <<<` — `buildFloor1` içindeki iki `shopFront(...)` çağrısı
  `wall(...)` yapılırsa cephe eski hâline döner; başka hiçbir yeri etkilemez.
- `>>> SOL DUVAR PROGRAMI ... <<<` — `buildFloor1` içindeki `if (s >= 3)` bloğu silinirse duvar
  yeniden boşalır.

### >>> SONRAKİ OTURUMDA İLK İŞ <<<
**Adım adım oyuna entegrasyon haritası** (kullanıcının ifadesi: *"bunu oyuna entegre etmek için
her adımda sırayla ne olacak onu tasarlarız"*): hangi pad neyi açıyor, hangi seviye neyi artırıyor,
`economy.config.ts` pad zinciri + `LAYOUT` (store.ts) koordinatlarına nasıl bağlanıyor.
Haritadan önce **kullanıcı onayı bekleyen üç karar** (aşağıdaki "KULLANICI ONAYI BEKLEYEN"):
banket seviyesi = boy · lavabo erken-kalkma mekaniği · 12 adımlık açılış zinciri.
Ayrıca yeni: **cam cephe ve TV birer pad/seviye olacak mı**, olacaksa zincirin neresinde?

### Kat 1'de KALAN iki eksik (2 tanesi bu oturumda kapandı)
3. **Tek tezgâh 20 masaya yetmiyor** — garson mekaniği veya ikinci servis noktası şart olacak.
   Tasarım hatası değil, ekonomi tasarımının çözmesi gereken gerçek.
4. **Merdiven kovasının ağzı tanımsız** — 9,2 birimlik çerçevesiz açıklık; `archCol()` portalı
   iki yanına konsa okunur.

## ŞU AN (2026-09-05 gece — KAT 1 PLANI KESİNLEŞTİ; KOD DEĞİŞMEDİ, SAVE v30)

`src/` DOKUNULMADI. Bu oturum da tamamen maket. **Çalışılan dosya: `docs/maket/maket-v13.html`**
**Artifact (canlı, aynı link):** https://claude.ai/code/artifact/813bdc4c-3052-46ca-ac3b-23076f425b23

### >>> SONRAKİ OTURUMDA İLK İŞ <<<
Kullanıcı: *"şimdi oturumu kaydet sonraki chatte devam ederiz"*. Sıradaki iş **adım adım oyuna
entegrasyon haritası** (kullanıcının ifadesiyle: *"bunu oyuna entegre etmek için her adımda sırayla
ne olacak onu tasarlarız"*): hangi pad neyi açıyor, hangi seviye neyi artırıyor,
`economy.config.ts` pad zinciri ve `LAYOUT` (store.ts) koordinatlarına nasıl bağlanıyor.
**Ama önce cevaplanmamış soru:** aşağıdaki dört eksikten ilk ikisi (cam cephe + boş sol duvar)
haritadan ÖNCE mi yapılsın, sonra mı?

### Kat 1 — ONAYLANMIŞ hâl (v13, ALTI adım)
Bina 34 × 34, bölme eksenleri x = 0 ve z = 0. Arka bant z = −17 … −9,8; üç blok **aynı hizada biter**:

```
┌──────────────────────┬──────────────┬──────────────────────┐
│ SERVİS BLOĞU+TEZGÂH  │   MERDİVEN   │       LAVABO         │  z = −17
│ 12,2 × 7,0 (adım 3)  │ 9,2×7 (ad.5) │  12,3 × 7,0 (adım 4) │
├──────────────────────┴──────────────┴──────────────────────┤  z = −9,8
│      ORTA ŞERİT 34 × 9,8 (adım 6): iki banket adası        │
│      + 12 ikili masa + garson servis istasyonu             │  banket z = −2,95
├────────────────────────────────────────────────────────────┤  z = 0
│   1. ALAN (adım 1)          │        2. ALAN (adım 2)      │
│   4 dörtlü masa             │        4 dörtlü masa         │  z = +17 cephe
└────────────────────────────────────────────────────────────┘
```

- **Adım 1** ön-sol çeyrek: 4 masa + sol duvarda çay ocağı; kapı bu cephenin ortasında (x = −8,5).
- **Adım 2** ön-sağ çeyrek: birebir aynısı; cephe tamamlanınca **kapı x = 0'a kayar**.
- **Adım 3** arka yarının tamamı + **servis bloğu**; bloğun salona bakan yüzü **TEZGÂH**
  (semaver + temiz bardak istifleri + hazır tepsiler önde; cezve ocağı, hazırlık tezgâhı, menü
  tahtası, bulaşık arkada). Tezgâhın ortasında **2 birimlik geçit**. Ön iki alandaki ocak kalkar.
- **Adım 4** lavabo: 4 kabin + sağ duvarda 3 lavabo, kapısı salona bakar.
- **Adım 5** merdiven: 14 basamak, Kat 2'nin tek çıkışı.
- **Adım 6** orta şerit: sırt sırta iki **banket adası** (boy 7,6 · derinlik 2,5) + **12 ikili masa**
  + **garson servis istasyonu** (sürahi, peçete, temiz bardak, kirli tepsi).
- Toplam: **20 masa · 56 koltuk · tek tezgâh.**

### Bu oturumun KALICI kararları (decisions.md D-033…D-036)
- **D-033 — Kilitli obje üç hâlde görünür.** ① Kilitli ALAN hiç çizilmez. ② Kilitli ODA (lavabo)
  tahta perde + uyarı bandı + duba, arkasında iskele/moloz — arkası görünmez. ③ Kilitli YAPI
  (merdiven) **perdesiz**, kendisi yıkık hâlde görünür (eksik basamak tahtaları, kırık korkuluk,
  moloz) ve önüne yalnız **uyarı şeridi** + dubalar konur. Gerekçe: perde çekilince orası yeni bir
  oda gibi görünüyor ve oyuncu üst kat olduğunu göremiyor.
- **D-034 — Kat 1 ızgarası.** Sütunlar x = ∓5,3 · ∓8,5 · ∓11,7 (3,2 aralık), satırlar
  z = −1,1 · 5,3 · 11,7 (6,4 aralık), ortada x ∈ [−4,6, 4,6] kapı–merdiven geçidi. Yan duvarlarla
  mobilya arasında ~4,5 birimlik **çevre koridoru**; duvara yalnız servis/tezgâh/depo yapışır.
- **D-035 — Servis bloğunun yüzü tezgâh.** Kafede tezgâh mekânın yüzüdür, mutfak arkasında kalır.
- **D-036 — Orta şerit: banket adası + ikili masa.** Katın eksiği masa sayısı değil masa
  **çeşidi**ydi; en çok eksik olan ikili masa. Duvar olmadığı için banket adası kullanıldı.

### Bu oturumda REDDEDİLENLER (tekrarlanmasın)
- **Soba / kuzine köşesi** ve **ocakbaşı tezgâhı (tabureli bar)** — kullanıcı: *"soba ve ocakbaşı
  hiç mantıklı gelmiyor ya"*.
- **"4 masa daha koyalım"** — kullanıcı da zayıf buldu (*"masa da çok eksik gibi"*).
- **Merdiven kovasına tahta perde** — *"yeni bir oda izlenimi oluyor o da hoş değil"*.

### KULLANICI ONAYI BEKLEYEN
1. **Banket seviyeleri.** Önerim: seviye = **boy**; dış uç sabit, içe doğru uzar, her seviye iki
   masa ekler (her yüze bir). Sol ada: L1 x −12,3…−9,7 (masa −11,7) → L2 −12,3…−6,5 (+ masa −8,5)
   → L3 −12,3…−4,7 (+ masa −5,3). Var olan masalar hiç yer değiştirmez; yükseltme noktası bankın
   uzayan ucunda kayar. Kullanıcı: *"onu adım adım ne olacak ayarlıcaz, orada kararını veririz."*
2. **Lavabo mekaniği.** Sert tavan YOK; lavabosuzken müşterilerin ~%20'si oturumun ~%60'ında
   **erken kalkar** (görünür: kalkma + küçük para istifi), yaklaşınca *"lavabo olmadığı için erken
   kalkıyorlar"* yazısı çıkar. ~%12 gelir kaybı. Kullanıcının kendi fikri, onay bekliyor.
3. **Açılış zinciri.** Kullanıcının fikri doğrulandı: *"3. alanla birlikte bir tanesi gelsin,
   seviyeyi biz artıralım, 2.'yi biz açalım."* Alan açılınca **çalışır hâlde** gelir (1. ve 2. alan
   da 4 masayla geldi), gerisi kazanılır.

### Kat 1'in TESPİT EDİLEN dört eksiği (kullanıcıya sunuldu, karar bekliyor)
1. **Sokak cephesinde hiç cam yok** — ön duvarda sadece kapı. Kıraathanenin en tanımlayıcı özelliği
   büyük cam cephedir; bina dışarıdan depo gibi duruyor. **En büyük eksik.**
2. **Sol duvarın ön yarısı bomboş** — 13 birim çıplak duvar (adım 3'te ocak arkaya taşınınca
   boşaldı). Gerçek kafede orası duvar boyu banket ya da uzun raf/askılık olur.
3. **Tek tezgâh 20 masaya yetmiyor** — garson mekaniği veya ikinci servis noktası şart olacak.
   Tasarım hatası değil, ekonomi tasarımının çözmesi gereken gerçek.
4. **Merdiven kovasının ağzı tanımsız** — 9,2 birimlik çerçevesiz açıklık; `archCol()` portalı iki
   yanına konsa okunur.

Bilinçli ertelenenler: zemin dekoru/halılar, aydınlatma ince ayarı, Kat 2-3'ün aynı dile çevrilmesi.

### Önerilen açılış zinciri (onay bekliyor)
| # | Tür | Ne gelir | Etki |
|---|---|---|---|
| — | başlangıç | 1. Alan: 4 masa + küçük çay ocağı | döngü öğrenilir |
| 1 | seviye | Ocak L2 | çay/dk ↑ |
| 2 | pad | 2. Alan + 4 masa | kapasite ↑ |
| 3 | seviye | Ocak L3 | çay/dk ↑ |
| 4 | pad | 3. Alan → arka yarı + servis bloğu + tezgâh + **1. Banket L1** (2 masa) | yeni oturma tipi |
| 5 | seviye | 1. Banket L2 (4 masa) | kapasite ↑ |
| 6 | pad | Lavabo | erken kalkma biter |
| 7 | seviye | 1. Banket L3 (6 masa) | kapasite ↑ |
| 8 | pad | Servis istasyonu | servis yolu kısalır |
| 9 | pad | 2. Banket L1 (2 masa) | kapasite ↑ |
| 10-11 | seviye | 2. Banket L2 → L3 | kapasite ↑ |
| 12 | pad | Merdiven | **Kat 2 açılır** |

Paralelde tezgâhın kendi seviye hattı (demleme hızı) devam eder.

### Geri alınabilirlik (kullanıcı: *"her an geri aldırabilirim"*)
`maket-v13.html` içinde yorum işaretleriyle sınırlı bloklar:
- `>>> ÖN TEZGÂH ... <<<` (adım 3) — silinirse semaver sol duvara (−16,4 · −13,4 · PI/2) döner.
- `>>> ADIM 6 — ORTA ŞERİT ... <<<` — silinirse şerit yeniden boşalır.
- `>>> TADİLAT ... <<<` (adım 3) — lavabo perdesi.

Commit sınırları: `a5d8982` (arka bant + tezgâh + banket) · `9d6f997` (ızgara + tadilat) ·
`4bf8790` (kalın banket) · `a52daf1` (yıkık merdiven).

### Bu oturumda eklenen yapı taşları (maket-v13.html)
`lavaboBlock` · `banketIsland` · `cafeTable2` · `banketUnit` · `servisIstasyonu` ·
`tadilatPerde` · `duba` · `iskele` · `moloz` · `uyariSeridi` · `merdivenHarap`

### Düzeltilen bug
1. adımda `z = 0` sınır duvarı 34 birim tam boy çiziliyordu ve açık alanın sağ köşesinin ötesine
taşıyordu. Artık `s < 2` iken x = 0'da kesiliyor.

## ŞU AN (2026-09-04 gece — MAKET v11: SABİT OMURGA + ÜÇ KANAT; KOD DEĞİŞMEDİ, SAVE v30)

Uzun bir maket iterasyonu oturumu. `src/` içinde HİÇBİR değişiklik yok — yalnız `docs/maket/`.
**Kullanıcı v11'i onayladı** ("tamam bir sonraki sefere net anlatımlı yaparız şimdi oturumu kaydet").

### Yayında olan maket
`docs/maket/maket-v10-v2-duzen.html` (dosya adı v10 kaldı, içerik v11).
**Artifact:** https://claude.ai/code/artifact/9d8c6d5a-5bd9-464b-a4e3-975c214236cd
Ekran görüntüleri: `docs/maket/ss/v11-adim1..4.png`. Tüm kurallar: `docs/maket/README.md`.

### v11'in kesin kararları (kullanıcının yedi şikâyetinin karşılığı)
1. **SABİT OMURGA.** Ana kapı ön duvarın, merdiven arka duvarın tam ortasında; hiç kaymaz.
   Adım 1'de açık alan kapının iki yanına SİMETRİK 12 birimlik merkez dilim. Kat, omurganın
   sağına → soluna → arkasına kanat olarak açılır. Açık alan her adımda DİKDÖRTGEN.
   Adımlar: ① merkez omurga x[−6,6] z[0,2,17] ② + sağ kanat (Cam Kenarı) ③ + sol kanat
   (Ocakbaşı) + mutfak dışarı ④ + arka yarı (Tavla/Okey + WC + merdiven).
2. **HALI = YOL İŞARETİ**, zemin kaplaması değil: kapıdan merdivene 3 birimlik sabit yolluk +
   her salona kısa dal halı. Hiçbir adımda salon kaplanmaz.
3. **KASA ve KUYRUK YOK** (oyunda kasada ödeme/sipariş kuyruğu yok — Model B′). Yerine
   KARŞILAMA TEZGÂHI: askılık, gazete-tavla rafı, temiz bardak istifi = oyuncunun ilk tepsi noktası.
4. **VİTRİN YOK** (tatlı vitrini tamamen kaldırıldı).
5. **MUTFAK BİNANIN DIŞINA ÇIKINTI:** batı duvarına yapışık 8 × 9 ek hacim, ÜSTÜ AÇIK (içi görünür).
   Kat içi 34 × 34 tamamen salon kalır. Salona tek bağ: servis penceresi (adisyon askısı + hazır
   bardaklar) + ayrı personel kapısı; davlumbaz bacası dış cepheden yükselir.
   Adım 1-2'de mutfak = omurganın dibinde küçük çay ocağı (semaver/cezve/bulaşık), SERVİS TEZGÂHI YOK.
6. **ARKA YARI = TAVLA / OKEY ODASI:** tek tip 4 kişilik oyun masası, geniş koridor, skor tahtası.
   ("Ayaküstü köşesi" iptal — yüksek masa yok, karışık mobilya yok.)
7. **OCAKBAŞI = TEZGÂH:** servis penceresine paralel uzun tezgâh, önünde 5 tabure, tezgâh üstünde
   ısıtıcı hattı, arkasında personel koridoru. Sipariş tezgâh üstüne konur; **para istifi her
   taburenin önünde tezgâhta birikir.**

### Fable 5.1'in genel ilkeleri (kullanıcı isteğiyle danışıldı, uygulandı)
- Sabit omurga: kapı-yolluk-merdiven ekseni hiç değişmez, kat onun etrafında kanatlanır.
- Her salonun TEK mobilya dili (normal masa / oyun masası / tezgâh); karışık tip yok.
- Kapalı hacimler (mutfak, WC) salon alanından değil bina dışından/arka duvardan alınır.
- **Oyunda olmayan hiçbir şey mekânda yok** (kasa, kuyruk, vitrin).
- Her yüzey bir sinyal: halı = yol, tezgâh = servis noktası, istif = para.

### Reddedilen ara denemeler (dosyalar duruyor, referans)
- **v7** dört eşit çeyrek + asma tavanlı köşe mutfağı → kullanıcı yarıda kesti (asma tavan reddedildi).
- **v8** tek uzun salon, yana doğru büyüme → *"yana doğru büyüme çok kötü"*.
- **v9** kare plan üç alan → *"v2'deki yapı çok daha iyiydi, ona geri dön"*.
- v8/v9'un doğru kararları v10/v11'e taşındı: tek renk zemin eğilimi, mutfak üstü açık,
  ilk kademede küçük mutfak, iç bölme duvarlarının azaltılması, kilitli alanın görünmemesi.

### Asset kararı (kullanıcı iki paketi de onayladı)
Hepsi CC0 ve **aynı sanatçı (Kay Lousberg)** → tek stil kilidi korunuyor:
- **KayKit Restaurant Bits** https://kaylousberg.itch.io/restaurant-bits — mutfak mimarisi/mobilyası
  (`kitchencounter_*`, `stove_single`, `oven`, `fridge_A`, `extractorhood`, `dishrack`,
  `wall_orderwindow`, `floor_kitchen`, `menu`, `crate_*`). **Yemek propları ALINMAYACAK**
  (burger/ketçap/biftek Türk menüsüne uymaz; semaver, çay bardağı, cezve, tost, baklava kendi modelimiz).
- **KayKit City Builder Bits** https://kaylousberg.itch.io/city-builder-bits — sokak/şehir
  (`road_*`, `building_A…H`, `car_*`, `streetlight`, `trafficlight`, `bench`, `bush`, `firehydrant`).
- Mevcut **Furniture Bits** zaten kurulu. **Hiçbiri henüz indirilmedi** — Faz 6 işi.

### >>> SONRAKİ OTURUMDA İLK İŞ <<<
1. **Kullanıcı notu:** *"bir sonraki sefere net anlatımlı yaparız"* → maket değişikliklerini
   uygulamadan önce ne yapılacağını KISA ve NET yaz, sonra uygula. Bu oturumda çok iterasyon oldu.
2. Kat 2 ve Kat 3'ü aynı v11 diline çevir (omurga, halı=yol, tek mobilya dili, dış hacimler).
3. Onaylanınca **koda entegrasyon**: v11'in dört adımını `economy.config.ts` pad zincirine ve
   `LAYOUT` (store.ts) koordinatlarına bağla. Hangi pad hangi kanadı açıyor, mutfak dışarı
   çıkma hangi pad — bu haritayı çıkar.
4. Kod tarafında bekleyen **Faz A (Zemin)**: dev kancalarını DEV'e kapat, Capacitor Preferences
   kalıcı kayıt, perf paketi, kamera çerçeveleme, ses sistemi, Android paketleme.

## AÇIK DÜZELTME LİSTESİ — MAKET (2026-09-04 gecesi, kullanıcı maddeledi)

Kullanıcı v10'un dört-salon sürümünü gezdi ve şunları saydı. **Hepsi çözülmeden maket onaylanmaz.**

1. **Kapı ve orta halı, adım 1'de açık alanın ortasında değil.** Kullanıcı: *"kapı bu alanın
   ortasında olur, yan taraf açılınca sola kayar vs"* → kapı/aks büyümeyle birlikte konum değiştirmeli.
2. **Halı tutarsız:** adım 1'de alanı boydan boya kaplıyor, adım 3'te kaplamıyor.
3. **Girişteki kasa ve kuyruk SAÇMA:** *"girişteki masa ne orada, neden para toplanıyor veya sıra var?"*
   Oyunda kasada ödeme YOK (Model B′: para masa yanındaki istiften toplanır), sipariş kuyruğu YOK.
4. **Tatlı vitrini istenmiyor** — kaldırılacak.
5. **Mutfak ocakbaşı salonundan yer çalıyor.** Kullanıcı önerisi: *"duvar sınırı dışında duran bir
   halde... duvardan dışarı doğru bir çıkıntı gibi ama o ocakbaşı alanını da etkilemesin."*
6. **"Ayaküstü Köşesi" saçma:** yüksek masalar ile oturma alanı iç içe, *"çok fazla dar alan var"*.
7. **Ocakbaşı ocakbaşı gibi değil:** *"insanlar oturuyor önlerinde masa yok, sipariş nereye gidecek?"*
8. Kullanıcının genel eleştirisi: *"bunların hepsini düşünüp ona göre hareket etmen gerek ama etmiyosun."*
   → Maket değişikliğinden ÖNCE servis akışı ve boşluk/dolaşım kontrol edilecek.

**Süreç kararı (kullanıcı):** genel tablo için önce **Fable 5.1**'den ucuz fikir alınacak, sonra
**Opus** uygulayacak, **kullanıcı onay verince** oturum kaydedilecek.

## ŞU AN (2026-09-04 — MAKET v6: KAT 1 BÜYÜME HARİTASI; KOD DEĞİŞMEDİ, SAVE v30)

Oturum "devam" ile açıldı. Plan, önceki oturumun bıraktığı üç soruyu tek tek sormaktı.
**Kullanıcı 2. soruda yönü değiştirdi** ve oturumun asıl işi bu oldu.

### Kullanıcının sözleri (aynen, kritik)
> "ilk katta da mutfağın yeri bence çok kötü... mutfak bir köşede olmalı ve **yükseltilebilir** olmalı
> çünkü normalde oyun ilk başladığında oyunda **1 masa ve mutfak** olmalı ki müşteriler geldiğinde
> sipariş taşıyayım... biz **son duruma göre tasarım yaptık ama sırayla ilerleme adımlarını da
> tasarlayıp ona göre hareket etmemiz gerek**... bir kaykit var ya onun gibi bir **mutfak asseti**
> vardı ona benzer bir şey... **konumlandırma ve seviye tasarımı çok çok önemli**."

### Soruların durumu
1. **A mı B mi?** → Kullanıcı "ikisi de dursun, sonra karar" dedi. **Sonra v6 bu soruyu ortadan
   kaldırdı:** B (yarı açık) = mutfak Kd.3, A (kapalı) = Kd.4. Seçim değil, kademe.
2. **Kat 2 servis köşesi?** → Cevaplanmadı; kullanıcı yukarıdaki yön değişikliğini yaptı. AÇIK.
3. **Servis mesafesi?** → v6'da **servis noktası** modeliyle çözüldü (aşağıda), ONAY BEKLİYOR.

### Bulunan asset (kullanıcının hatırladığı paket)
**KayKit Restaurant Bits 1.0** — CC0, 140+ low-poly model, **Furniture Bits ile aynı sanatçı**
(Kay Lousberg) → CLAUDE.md'deki tek-stil kilidi bozulmuyor.
https://github.com/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0
Elle çizdiğimiz her şeyin hazır karşılığı var: `kitchencounter_straight/innercorner/outercorner/sink`
(+`_backsplash`), `stove_single/multi`, `oven`, `fridge_A/B`, `extractorhood`, `kitchencabinet`,
`kitchentable_*`, `dishrack`, **`wall_orderwindow`**, `wall_half`, `wall_doorway`, `floor_kitchen`,
`menu`, `shelf_papertowel`, `crate_*`. **Tezgâhlar modüler karo** → mutfak karo karo büyütülebilir.
Paket HENÜZ İNDİRİLMEDİ (Faz 6 işi; indirilince `public/assets/models/` + manifest).

### Verilen karar
**Mutfak = arka-sol köşe** (kullanıcı üç seçenek arasından seçti: arka-sol köşe / arka duvar ortası /
giriş-sol köşe). Gerekçe: köşede başlama sıcaklığı + oyunun mevcut zone-açma koduyla uyum;
bedeli, uzak adaların servise uzak kalması → **servis noktası** satın almasıyla karşılanıyor.

### Üretilen: `docs/maket/maket-v6-buyume.html` (v5'e DOKUNULMADI, yeni dosya)
**Artifact (YENİ link):** https://claude.ai/code/artifact/0c63ef60-ebb5-4b16-89e6-d0a587583f27
Altı sekme = altı büyüme adımı. Ekran görüntüleri: `docs/maket/ss/v6-adim1..6.png`.
Tüm kurallar yazılı: `docs/maket/README.md` → "Büyüme kuralları (v6)".

- **Mutfak beş kademe, hepsi yerinde:** Kd.1 cezve ocağı + semaver (2 karo, duvar yok) → Kd.2 evye +
  bulaşık (4 karo) → Kd.3 tost sacı + davlumbaz + buzdolabı + **yarı duvar** → Kd.4 **tam duvar +
  sipariş çıkış penceresi** + hazırlık adası (8 karo) → Kd.5 fırın + kiler + asma tavan + menü tahtası.
- **Kat üç bölüm** (oyunun `MAX_ZONES = 3` yapısıyla birebir): 1 arka-sol · 2 ön (cephe+hol) · 3 arka-sağ
  (ocakbaşı + WC + **merdiven → Kat 2**).
- **Kilitli bölüm boş zemin değil:** çıplak şap, toz örtüsü altında mobilya, iskele, **tahta perde**.
- **Bir bölümün açılması ile dolması ayrı iki adım** (adım 4 açar, adım 5 sağ yarısını döşer).
- **Yan sokak kapısı:** oyun batı duvarındaki küçük kapıyla başlar; ana cephe adım 4'te açılınca
  aynı kapı mutfağın personel/malzeme girişi olur. Tek öğe, iki dönem.
- Adım adları `economy.config.ts` pad zinciriyle hizalı (`table2 · table3 · waiter · dishwasher ·
  table4 · zone2 · zone3`).
- Doğrulama: Playwright MCP 1440×960, **0 konsol hatası**, altı sekme de çizildi.

### >>> SONRAKİ OTURUMDA İLK İŞ — ÜÇ ONAY SORUSU <<<
Maketi aç (artifact linki), sekmeleri sırayla gez, sonra **tek tek** sor:
1. **Büyüme sırası onaylanıyor mu?** (bölüm 1 arka-sol → 2 ön/cephe → 3 arka-sağ/merdiven)
   Özellikle: oyun **yan sokak kapısıyla** başlasın mı, yoksa ana kapı baştan açık mı olsun?
2. **Servis noktası modeli** (Karar 3+5 revizyonu): yemek yalnız ana mutfakta pişer, uzak adaların
   kenarında pişirme yapmayan aktarma tezgâhı durur. Onay? (Alternatif: katı küçültmek.)
3. **Kat 2 servis köşesi** aynı çekirdeğin küçük hâli mi olsun (Kd.1-3'te kalan), yoksa Kat 2
   tamamen oturma katı olup her şey Kat 1 mutfağından mı taşınsın?
Onaylanınca sıra **koda**: bu büyüme haritası `economy.config.ts` pad zinciri + `LAYOUT` (store.ts)
üstünde uygulanacak. Ondan önce **Faz A (Zemin)** hâlâ duruyor: dev kancalarını DEV'e kapat,
Capacitor Preferences kalıcı kayıt, perf paketi, kamera çerçeveleme, ses sistemi, Android paketleme.

## ŞU AN (2026-09-04 — MAKET v5: MUTFAK ODASI, iki varyant; KOD DEĞİŞMEDİ, SAVE v30)

Bir önceki oturum elektrik kesintisiyle kullanıcının mesajının ÜSTÜNDE kesildi (asistan hiç cevap veremedi).
Kaldığı yer: **"mutfak şeridi bi mutfakmış gibi izlenim uyandırmıyo; mutfak dediğin 4 köşe bir yer olur.
onu nasıl yapabilirsin bi öneride bulun bakalım."** Bu oturumda önce öneri verildi, sonra uygulandı.
`src/` içinde HİÇBİR değişiklik yok — yalnız `docs/maket/`.

### Yapılan
- **Teşhis:** v4'te mutfak = sol duvara dizilmiş 5 ayrı tezgâh (22 birim şerit). Hacim yok, tezgâh kopuk,
  dikey öğe (davlumbaz/dolap/raf) yok, salonla arasında eşik yok. Ayrıca batı duvarı (x=-17) bu kamerada
  şeridin önünü ~1,6 birim **kapatıyor** — tezgâhlar yarı görünmez. Bu yüzden "mutfak" okunmuyordu.
- **Öneri (3 seçenek sunuldu):** ① kapalı mutfak odası ② yarı açık ③ çay ocağı kabini + arkada mutfak.
  Kullanıcı: **"iki varyasyon görsem iyi olur: kapalı ve yarı açık"** + boşalan bant için
  **"A adasını genişlet + duvar dekoru"**. İkisi de yapıldı.
- **`docs/maket/maket-v5-mutfak.html`** (v4'e dokunulmadı, yeni dosya). Sekmeler: *Kat 1 · Mutfak A — kapalı*,
  *Kat 1 · Mutfak B — yarı açık*, Kat 2, Kat 3. FLOORS anahtarları sayıdan string'e ('1a','1b','2','3').
- **Artifact aynı URL'de güncellendi:** https://claude.ai/code/artifact/d8bbf576-e755-46b7-9608-3ebd0ab57245

### Mutfak odasının tasarım kuralları (docs/maket/README.md'de de yazılı)
- Oda **6,5 × 8,6**: x∈[-16,9,-10,4] × z∈[-7,6,1,0]. C adasıyla 0,6, A adasıyla 0,5 boşluk.
- **Kamera -x/+z köşesinden bakar** → doğu ve güney duvarları ARKA PLAN: fayans, davlumbaz, raflar
  yalnız orada okunur; bu yüzden o iki duvar **iki varyantta da tam yükseklikte**. Fark yalnız
  salona bakan yüzde: A = tam duvar + pencere/kapı boşluğu, B = 1,05 lambri + cam + köşe dikmeleri.
- İçerik (ikisinde birebir aynı): gri seramik karo + gider · tezgâh üstü beyaz fayans (`tileBand`) ·
  tost sacı + **çelik davlumbaz + tavana giren baca** (`kitchenHood`) · güney duvarında bulaşık +
  cezve ocağı + raflar · batı duvarında boy dolabı/kasa/damacana/çöp · ortada **serbest hazırlık
  tezgâhı** (`prepIsland`) + **asılı tencere rayı** (`hangRail`) · kuzey duvarında semaver ·
  asma tavan kirişleri + **soğuk beyaz** floresan panel (salonun sıcak ışığından ayrışır).
- **Sipariş çıkış penceresi** doğu duvarında z∈[-2,4, 0,4]: çelik tezgâh, **adisyon askısı**
  (`ticketRail`), ısı lambası, bekleyen hazır tepsiler; ayrı **personel kapısı** z∈[-4,2, -2,8]
  (aralık duran kanat). Garson mutfağa GİRMEZ (Karar 3: tek çıkış penceresi).
- Kapalı varyantta salona bakan duvarda **menü tahtası** — mutfak salondan da kendini anlatıyor.
- Servis koridoru (x∈[-10,4,-3,6]) doldu: pencereden tepsi alan garson + **servis arabası**
  (`serviceCart`) + bekleme cebi (bank, sehpa, gazetelik, kilim).
- **A adası büyüdü:** 9,8 → 12,8 (x[-16,4,-3,6]), 2×2 → **3×2 çay ünitesi**; boşalan sol duvar bandına
  tatlı vitrini + tablolar + lamba/saksı ritmi. Alçak bölmenin batı ucu -13,4 → **-8,6** (mutfak geçidi).

### Yeni yardımcı fonksiyonlar (maket dosyasında)
`wallSeg` (delikli duvar parçası) · `tileBand` (fayans) · `kitchenHood` · `hangRail` · `tallCabinet` ·
`prepIsland` · `ticketRail` · `serviceCart` · `glassWall` (lambri+cam) · `kitchenRoom(semi)` ·
`buildFloor1(variant)`. `checker()` artık karo boyu parametresi alıyor. Ayrıca konsol kancası:
**`__view(mesafe, azimut, yükseklik, hedefX, hedefZ)`** — maketi belli bir açıdan incelemek için.

### AÇIK UÇ (kullanıcıya söylendi)
Mutfak solda kaldığı için **B ve D adaları çıkış penceresine ~19-23 birim uzakta** — karar 5'teki
"her oturma bölgesi çıkışa ≤10 birim" kısıtı bu yerleşimde sağlanmıyor. Gerçek oyunda ya ikinci bir
servis noktası ya da mutfağın merkeze kaydırılması gerekecek. Kullanıcı henüz karar vermedi.

### KULLANICININ KAPANIŞ SÖZÜ (2026-09-04)
> "gayet iyi ama çok karmaşık oldu. **sonraki chatte sor.**"

Yani: v5 mutfağı BEĞENİLDİ ama oturum sonunda karar verilecek kadar çok başlık birikti; kararlar
temiz kafayla, yeni oturumda verilecek. Bu oturumda başka bir şey uygulanmadı.

### >>> SONRAKİ OTURUMDA İLK İŞ — BU ÜÇ SORUYU SOR (kullanıcının talimatı) <<<
Önce maketi aç (`docs/maket/maket-v5-mutfak.html` veya artifact linki), sonra **tek tek, sade** sor —
hepsini aynı anda yığma, kullanıcı "çok karmaşık oldu" dedi:
1. **A mı B mi?** Kapalı mutfak odası mı, yarı açık (lambri + cam) mı? Seçilen, Kat 1'in referansı olur.
2. **Kat 2'nin servis köşesi** de aynı "oda" diline çevrilsin mi (şu an v2 yerleşiminde, duvar kenarı şerit)?
3. **Servis mesafesi:** B ve D adaları çıkış penceresine ~19-23 birim uzakta (karar 5: ≤10). İkinci servis
   noktası mı, mutfağı merkeze mi çekelim, yoksa kısıtı mı gevşetelim?

Kod tarafında sıradaki iş hâlâ **Faz A (Zemin)**: dev kancalarını DEV'e kapat, Capacitor Preferences
kalıcı kayıt, perf paketi, kamera çerçeveleme, ses sistemi, Android paketleme.

## ŞU AN (2026-09-03 — BÜYÜK TASARIM OTURUMU: yol haritası v2 + servis mimarisi + 3B kat maketi; KOD DEĞİŞMEDİ, SAVE v30)

Kullanıcı sırayla şunları istedi: (1) projeyi incele + telefonda oynanır mı + asset/texture eksikleri +
ekonomi değerlendirmesi + AdMob nereye; (2) çok detaylı YENİ PLAN (artifact); (3) oyun akışı/salonlar/kat
sırası + arayüz yeniden tasarımı + A/B/C servis modellerinin tam mekaniği; (4) tamamlanmış katların
GÖRSEL MAKETİ. `src/` içinde HİÇBİR değişiklik yapılmadı — bu oturum tamamen araştırma/tasarım.

### Üretilen kalıcı çıktılar
- **Plan artifact:** https://claude.ai/code/artifact/c45e15a9-9dd1-4bd1-ae00-cd1d35ed0aa8
- **Maket artifact:** https://claude.ai/code/artifact/d8bbf576-e755-46b7-9608-3ebd0ab57245
- Repoya kopyalandı: `docs/maket/` (v2 ONAYLI + v3 REDDEDİLDİ + plan + ekran görüntüleri, README ile)
- Mevcut oyunun denetim ekran görüntüleri: `docs/denetim-2026-09-03/`

### >>> SONRAKİ OTURUMDA İLK İŞ (kullanıcının son talimatı) <<<
**Maket artifact'ini `docs/maket/maket-v2-ONAYLI.html` içeriğiyle YENİDEN YAYINLA** (aynı URL).
Kullanıcı v3'ü tümüyle reddetti: "hayır hepsini bir önceki sefere çevirmeni isticem çünkü çok kötü oldu".
v3'ten HİÇBİR ŞEY taşınmayacak. Yayınlamadan önce kullanıcıya sor: v2 üstünde hangi ince ayarlar istiyor.

### Bu oturumda VERİLEN KARARLAR (kod henüz yazılmadı)
1. **Para modeli B′ (kullanıcı kararı):** Yere dağınık sikke YOK. Her masanın yanında **tek para istifi**,
   oyuncu üstünden geçince **tamamı tek seferde** cebe. Hesabı kasaya taşıma fikri İPTAL edildi.
   **Garson parayı ASLA toplamaz.** Kayıp yok; istifin görsel tavanı var (sayaç sürer); oto-toplama erken
   oyunda KAPALI, geç oyunda "Muhasebeci" yükseltmesiyle açılır; offline dönüşte Kasa Raporu'nda toplanır.
   (Eski D-012/D-016 "KASA YOK" ve eski "para sunumuna dokunma" kuralları kullanıcı tarafından kaldırıldı.)
2. **Ürün-silosu KALKTI (global menü):** "her salona bir ürün" yapay bulundu. Artık tek mutfak şeridi,
   her masada her ürün istenebilir. Salonlar ürün değil KARAKTER bölgeleri.
3. **Tek sipariş çıkış penceresi (pass):** Siparişin TAMAMI hazır olunca tek noktada hazır tepsi olur;
   servis eden tezgâh tezgâh dolaşmaz, yarım sipariş taşınmaz. İstasyonlar "gidilecek" değil
   "yükseltilecek" yerler. Bu yol bulmayı bugünkünden UCUZLATIR (3 ocak+3 bulaşık → 1 çıkış+1 bulaşık).
4. **Ekonomi 3 kaldıraca oturuyor:** gelir = min(kapasite, üretim, servis) × ortalama sepet.
   `tools/simulate.ts` bu modele göre yeniden yazılacak. Hiçbir denge sayısı ONAYSIZ değişmez.
5. **Yerleşim kısıtı:** her oturma bölgesinin merkezi sipariş çıkışına ≤ ~10 birim (tur ~12sn < sabır 18sn).
6. **Garson bölge-başı kalıyor** (D-012 korunuyor); sadece ortak çıkıştan alıyor.
7. **İçerik hedefi:** 3 kat / 9 salon / ilk tur ~5 sa; renovasyon + 4 şube ile 25-30 sa.
8. **Her kat kendi servis üçgenini taşır** (ocak + bulaşık + WC + merdiven). WC her kata konulacak.
9. **Terasa çıkış:** dönüşlü (switchback) merdiven — kat 1'in merdivenine dokunulmadan.
10. **Cam bölme:** sadece kat 3'te kapalı/açık teras arasında; iç katlarda YOK.
11. **Arayüz yeniden tasarımı DİREKTİF** (öneri değil): paneller "kıraathane kâğıt işleri" metaforu
    (adisyon fişi, menü tahtası, katalog defteri, personel künyesi, tapu, kasa raporu). Emoji ikon YASAK.
12. **Yaş kategorisi önerisi:** Kids DIŞI 12+ (Kids'te AdMob kullanılamıyor). Kullanıcı henüz onaylamadı.
13. **AdMob:** `@capacitor-community/admob` v8.1.0 Capacitor 8'i destekliyor → mevcut kurulumla uyumlu.

### AÇIK KALAN KARARLAR (kullanıcı cevaplamadı)
- Yaş kategorisi 12+ mı çocuk-güvenli mi (Faz F'yi bloke ediyor)
- Nargile katı planda kalsın mı (yaş derecesine bağlı)
- Offline tavanı 1 sa → 2,5 sa gevşesin mi
- Eşzamanlı müşteri tavanı ~50 → 28'e insin mi
- Önce kat mı şube mi (öneri: önce kat 2)
- Stok/hammadde katmanı ne kadar girsin (öneri: yalnız vitrin)

### DENETİM BULGULARI (ölçümlü, 2026-09-03)
vitest **186/186** ✅ · build temiz **1.457 MB / 410 KB gzip** · tam kurulu sahnede **98 draw call /
37.092 üçgen / masaüstü 133 FPS** · içerik sim'e göre **~3,2 saat** · elmas hiç kazanılmıyor/harcanmıyor ·
prestige kodda yok · **ses dosyası SIFIR** ama Ayarlar'da 3 ölü anahtar · müşteriler tek renkli kapsül
(`Customers.tsx:11`) · çay bardağı KIRMIZI silindir (`Player.tsx:171`) · `App.tsx:28` `installDevHooks()`
KOŞULSUZ (hile kapısı) · `?proto` üretim bundle'ında · kayıt yalnız localStorage · varsayılan Android ikonu ·
`minifyEnabled false` · `index.html lang="en"` · iOS platformu YOK.
Telefon çerçevesinde ekranın üst ~%20'si boş arka plan; taze oyunda ilk karede masa görünmüyor.

### PERFORMANS RAPORU (dış çevre maliyeti — kullanıcı istedi)
Statik + merged + GÖLGESİZ yapılırsa: sokak+komşu binalar+ağaç/araba+alt kat kütleleri ≈ **+7-9 draw call,
+7k üçgen, kare başı 0 CPU**. Makette doğrulandı: dış çevre 982 mesh, hepsi gölge geçişinin DIŞINDA.
Gölgeli/ayrı mesh yapılırsa +60 call/+30k üçgen olurdu — o yol kapalı.

### FAZ PLANI (planın tamamı artifact'te; sıra: A → B → C → D → F → G, E paralel)
- **A Zemin (5-6 oturum, hiçbir karara bağlı değil):** dev kancalarını DEV'e kapat · Capacitor Preferences
  kalıcı kayıt · perf paketi (dpr≤1.5, gölge 512, NPC tavanı 28, ≤60 call/≤25k üçgen) · kamera çerçeveleme ·
  ses sistemi · Android paketleme (ikon/minify/imza/AAB/lang=tr)
- **B Kasa pivotu (save v31):** para istifi + toplu toplama + harita revizyonu + sim kalibrasyonu
- **C Meta (save v32):** elmas kazanma/harcama + Renovasyon(İtibar) + offline + günlük döngü
- **D İçerik (save v33+):** menü ağacı · müşteri arketipleri · gün döngüsü/etkinlikler · kat 2-3 · şubeler
- **E Sanat/arayüz (paralel):** E1 müşteri modeli (en yüksek etki) · E2 arayüz · E3 Türk objeleri · E4 ışık/dekor
- **F Monetizasyon:** yaş kararı → ads.ts+UMP+AdMob → yerleşimler → RevenueCat
- **G Yayın:** iOS · mağaza evrakı · TR soft launch

### ASSET LİSTESİ
Plan artifact'inde bölüm 10'da tam liste (P1/P2/P3 öncelikli, 6 grup). Özet: müşteri gövdesi (P1, en yüksek
etki) · ince belli bardak/semaver/cezve/sac (P1) · KayKit'te VAR ama entegre edilmemiş halı/tablo/lamba/
dolap/kanepe (P2, bedava) · zemin-duvar-kilim dokuları (P2) · ses seti (P1, şu an sıfır) · SVG ikon seti (P1).
**NOT:** Maket artifact'i gerçek KayKit .gltf dosyalarını YÜKLEYEMEZ (yerel dosyalar + CSP) — makette her şey
ilkel şekil; gerçek oyunda KayKit couch/armchair kullanılacak.


## ŞU AN (2026-09-01 — YAYINA HAZIRLIK DENETİMİ (kod yazılmadı, sadece araştırma+rapor); SAVE v30 kaldı)
Kullanıcı sordu: "uygulama yayına hazır mı? App Store'a çıkacağız, reklam eklenecek." Kod DEĞİŞMEDİ
(çalışma ağacı temiz). Bu bölüm denetimin sonucudur; sonraki oturum buradan devam eder.

**ORTAM DÜZELTMESİ (bu makine):** `npm run test` ve `npm run build` rolldown native binding eksikliğinden
patlıyordu (`Cannot find module './rolldown-binding.win32-x64-msvc.node'`). Çözüm:
`npm install --no-save @rolldown/binding-win32-x64-msvc@1.0.3` (rolldown 1.0.3 ile eşleşmeli).
Sonrasında **vitest 186/186 geçti, build temiz: 1.457 MB JS / 410 KB gzip.** node_modules gitignore'da,
commit'e girmedi. Diğer makinede aynı hata çıkarsa aynı komut.

**DENETİM SONUCU: yayına HAZIR DEĞİL.** Oynanış ~%60-65, yayın katmanı ~%0-5.

**A) iOS tarafı SIFIR:** `ios/` klasörü yok, `@capacitor/ios` bağımlılığı yok. Windows'tan iOS build
alınamaz → Mac + Xcode + Apple Developer ($99/yıl) + vergi/banka gerekli. Ayrı bir iş kalemi.

**B) Monetizasyon (Faz 5) hiç başlamamış:** `src` içinde admob/rewarded/interstitial/purchase geçen TEK
satır yok. `docs/monetization.md` yalnızca kural metni.

**C) Faz 4 eksikleri doğrudan reklamı bloke ediyor:** 💎 elmas HUD'da var ama kodda hiç KAZANILMIYOR ve
HARCANMIYOR (`store.ts`'te sadece init/save/load). Ödüllü reklamın verecek ödülü yok → **sıra Faz 4 → Faz 5
olmak zorunda.** Prestige de yok; sim'e göre içerik ~1.7 saatte bitiyor (retention yok).

**D) Yayın-engelleyici teknik borçlar (hepsi doğrulandı):**
1. `src/App.tsx:28` — `installDevHooks()` KOŞULSUZ çağrılıyor → `__addMoney/__setState/__advanceTime`
   üretim bundle'ında = hile kapısı. `import.meta.env.DEV` ile sarılmalı.
2. `?proto` (FurniturePrototype) sayfası da üretim bundle'ında.
3. **SES/MÜZİK HİÇ YOK** (public'te tek .mp3/.ogg yok) ama Ayarlar'da "Ses"/"Müzik"/"Bildirimler"
   anahtarları duruyor → 3 ölü anahtar (Apple "çalışmayan özellik" diye reddedebilir).
4. Kayıt YALNIZCA localStorage → iOS WKWebView 7 gün kullanılmayan uygulamanın site verisini silebilir =
   ilerleme kaybı. Capacitor Preferences/Filesystem'e taşınmalı.
5. Android ikonu hâlâ VARSAYILAN Capacitor/Android robot ikonu; `versionCode 1`, `minifyEnabled false`.
6. `index.html` `lang="en"`, tek dil; gizlilik politikası yok; crash/analytics yok; mağaza görselleri yok.

**E) REKLAM MİMARİSİ — kullanıcıya açıklandı (kavramsal):** App Store reklam SAĞLAMAZ; Apple'ın kendi ağı
(iAd) 2016'da kapandı, Apple Search Ads = kendi oyununun reklamı (gider, gelir değil). Reklam üçüncü-parti
ağlardan gelir: AdMob / AppLovin MAX / Unity LevelPlay (ironSource) / Meta Audience Network / Mintegral vb.
**AdMob ZORUNLU DEĞİL** — ama bizim stack'te (Capacitor, Unity değil) native köprü gerekiyor ve bakımlı
Capacitor eklentisi pratikte yalnız AdMob'da var (`@capacitor-community/admob`); diğerleri için köprüyü
kendin yazarsın. İleride AdMob Mediation ile AppLovin/Unity talebi aynı SDK altına eklenebilir.
Ağdan bağımsız Apple şartları: ATT izni + `NSUserTrackingUsageDescription`, SKAdNetwork ID listesi
(Info.plist), App Privacy beyanı, AB için onay formu (UMP), IAP gelince "Satın Alımları Geri Yükle" butonu.
Ödeme: AdMob → AdSense altyapısı, vergi+banka, 100 $ eşiği, Türkiye sorunsuz.

**>>> AÇIK KARAR (kullanıcı verecek, Faz 4 VE Faz 5 tasarımını etkiliyor) <<<**
`docs/monetization.md` "çocuğa-yönelik mod" diyor AMA App Store **Kids kategorisi üçüncü-parti reklam ağına
izin vermiyor** (AdMob orada kullanılamaz) + kişiselleştirilmemiş reklam geliri ~yarıya düşer. Ayrıca yol
haritasındaki **nargile (tütün göndermesi)** ve **okey/tavla (simüle kumar)** yaş derecesini yukarı çeker.
İKİSİ AYNI ANDA OLMAZ → seçim: (a) Kids kategorisi DIŞI, 9+/12+, normal reklam geliri; (b) çocuk-güvenli
kal, düşük gelir. Karar verilmeden Faz 5'e girilmemeli; karar `decisions.md`'ye D-0xx olarak yazılacak.

**SONRAKİ OTURUM — sıra:** (0) yaş/reklam kararı → (1) Faz 4: elmas kazanma+harcama, prestige, içerik
uzunluğu → (2) Faz 5: AdMob + RevenueCat + izin akışları → (3) D maddeleri (dev kanca kapatma, ses, kalıcı
kayıt, ikon, minify) → (4) iOS platformu (Mac/Xcode/TestFlight) → (5) Faz 8 mağaza evrakı.
İstenirse ilk iş: `@capacitor-community/admob` bakım durumu + Capacitor 8 uyumu doğrulaması.

## ÖNCEKİ (2026-06-17 — GÖREV SENKRON & SIRALAMA DÜZELTMESİ: A) ritim + B) bildirim kuyruğu + C) suppression/okunabilirlik)
Telefon feedback'i: görev gösterimi senkron/sıralama sorunu (üst üste binme, anlık takas, karartma altında okunmama,
"yükseltebilirsin" reveal'ı görev sanılması). Kullanıcı onayı: boşluk 0.8sn · ③→(a) · ⑤⑥→(a). UYGULANDI.
tsc temiz, **vitest 186/186** (2 yeni test), build temiz, MCP **0 konsol hatası**. HENÜZ COMMIT YOK (onay bekliyor).

**Kök neden:** Ekranda 5 ayrı yönlendirme kanalı koordinatörsüz, aynı tick'te bağımsız ateşleniyordu (quest kartı /
notice toast / karakter spotlight / tepsi spotlight / reveal toast); tek slot ezilme, anlık takas, karartma altında kart.

**A — Görev geçiş ritmi (`store.ts`):** `questPhase` durum makinesi (active→completing 0.5s→gap 0.8s→active). Hedef
tamamlanınca kart ANINDA takas OLMAZ: completing'de kart %100 dolar + yeşil onay flash'ı (`QuestView.done`), gap'te
tamamlanmış görev tutulur, sonra questIndex ilerler + yeni kart `cardPop` ile girer. Ödül/toast/xp completing-start'ta
bir kez. Zincirli tamamlamalar artık sıraya girer (instant skip yok). `QUEST_COMPLETE_DUR`/`QUEST_GAP_DUR` sabit.
Transient (saveVersion DEĞİŞMEDİ): questPhase/questPhaseT default+load'da 'active'/0.

**B — Bildirim kuyruğu (`store.ts`):** tek `notice` slotu yerine `noticeQueue` FIFO; bitiş/reveal/seviye/autoCollect
toast'ları `enqueueNotice` ile sıraya girer, birbirini EZMEZ. Tick sonunda boşsa sıradakini gösterir.

**C1 — Reveal suppression (⑤⑥, `store.ts`):** bir reveal'ın açtığı özelliği AYNI/İLERİDEKİ bir görev öğretiyorsa
(stationLevel→upgrade:z, tableLevel/tablesAtLevel→tableUp:z, pad→opt:id) reveal toast'ı GÖSTERİLMEZ (sessizce
revealSeen'e tüketilir). "Çay ocağını yükseltebilirsin ☕" gibi mesajlar görev cümlesiyle çakışmaz; tek talimat = görev kartı.

**C2 — Spotlight okunabilirliği (③, `HUD.tsx`+`index.css`):** spotlight/traySpot aktifken görev kartına `.lit`
(z-index 35, karartmanın ÜSTÜ + altın halka) → "Tepsini büyüt" karartma altında kalmıyor. `.done` = yeşil onay flash'ı.

**Testler:** `completePad` helper'ı questPhase'i 'active'e sıfırlar (önceki tamamlamadan kalan faz yeni pad fill'ini
bozmasın). `flushQuestTransition()` helper'ı (faz active'e dönene kadar tikler) eylem→ilerleme bekleyen testlerde.
turu-6 reveal testi yeniden yazıldı (artık upgrade:0 q_station2 tarafından kapsanıp suppress edilir). 2 yeni test:
A ritmi (completing→gap→advance + done) + B kuyruğu (iki toast sırayla). MCP doğrulama: q_pickup→1.3s→q_serve1;
q_charTray1 spotlight'ında kart `lit` + okunur (`sync-spotlight-lit.jpeg`).

**SIRADAKİ:** kullanıcı telefonda test (yeni APK gerek); commit+push onayı bekleniyor. Sonra: önceki fikir listesi
(KayKit dekor / tema çeşit / per-zone masa teması / Türk objeleri Meshy).

## ÖNCEKİ (2026-06-17 — ÖNİZLEME DOĞALLAŞTIRMA (A) + MASA TEMASI GATING (3 salon + tüm masalar max))
İki ertelenmiş iş de bitti. tsc temiz, vitest **184/184** (yeni gate testi), build temiz, MCP **0 konsol hatası**.

**1) Önizleme doğallaştırma — Seçenek A (ONAYLI) UYGULANDI:** `SalonSlice.tsx` yeniden yazıldı. Eski L köşe
(sol+arka duvar) + ahşap çerçeveli dar zemin "inşaat/kutu" görünüyordu. ŞİMDİ: `FloorPatch` tema base'i
40×40 tam-taşan plane → kenarda void/çerçeve YOK (zemin tüm canvas'ı doldurur) + merkez checker (`checkerHalf`).
`WallCornerL` → `WallBack` (TEK arka duvar, z/width param; L köşe yok) = ferah salon kesiti. Kameralar biraz
uzaklaştı: TableThemePreview d 2.9→3.4 ty 0.42, WallBack z=-2.1, checkerHalf=3; DioramaPreview d 4.0→3.8 ty 0.42,
WallBack z=-2.6, checkerHalf=4, referans masa (0.4,0.5). `PALETTE` importu kalktı (çerçeve gitti).
DOĞRULANDI (MCP): masa/zemin(parke)/zemin(checker fayans)/duvar — hepsi salon kesiti gibi, zemin canvas'ı dolduruyor.
Screenshot: `slice-after-table.jpeg`, `slice-after-floor.jpeg`, `slice-after-checker.jpeg` (önce: `slice-before-*`).

**2) Masa teması gating — KARAR (kullanıcı 2026-06-17): 3 salon AÇIK + TÜM açık masalar MAX seviye ("seviyeler
fullenince", açılınca değil).** Zemin/duvar temaları ETKİLENMEZ (sadece MASA sekmesi). Uygulama:
- `store.ts`: `tableThemeUnlocked({zonesOpen,tables,tableLevels})` = zonesOpen≥MAX_ZONES(3) && tüm açık masalar
  ≥ `tableSoftMaxLevel()`. `buyCosmetic('table')` başında guard (kilitliyken satın alma/uygula reddedilir; default
  'mavi' kalır). saveVersion DEĞİŞMEDİ (sadece türetilen kilit; persist alan yok).
- `HUD.tsx ShopPanel`: kilitliyken Masa sekmesi önizleme+kart yerine `.shop-locked` paneli (kilit ikonu + açıklama +
  "✓ Salon z/3" & "• Max masa m/n" rozetleri). Masa sekme butonunda 🔒. Açılınca normal önizleme+kartlar döner.
- `index.css`: `.shop-locked*`, `.shop-tab-lock` stilleri. testid: `shop-table-locked`.
- Test: `tests/logic.test.ts` "masa teması KİLİTLİ" — taze/yalnız-3-salon kilitli, 3 salon+tüm masa max açılır.
DOĞRULANDI (MCP): taze save (3 salon ama 1/10 masa max) → kilit paneli; `__setState` ile 10 masa lv4 → kilit açıldı,
önizleme+kartlar geldi. Screenshot: `gate-locked.jpeg`, `gate-unlocked.jpeg`.

**SIRADAKİ FİKİRLER:** (a) tema mağazasına daha fazla çeşit; (b) masa teması per-zone (şu an global); (c) telefon/APK
testi (splash+instancing gerçek cihaz FPS); (d) kalan perf riskli kalemler (GroundMarker/dekor) ancak ölçüm gösterirse.

## ÖNCEKİ (2026-06-15 — BUG FIX: uzak salonda mobilya kayboluyordu + 2 açık tasarım sorusu)
**BUG (kullanıcı bildirdi, çözüldü):** Salon 2/3'e yaklaşınca masaların KayKit modelleri kaybolup sadece
örtü plakaları kalıyordu. KÖK NEDEN: instanced mobilya (`<Merged>` InstancedMesh) ve dama zemini (`<Instances>`)
sınır küresi LOCAL origin'de → kamera uzak salona odaklanınca tüm batch FRUSTUM CULLED. Örtüler ayrı mesh
olduğundan kalıyordu. ÇÖZÜM: `frustumCulled={false}` (Tables.tsx `<Merged>` + Scene.tsx CheckerTiles `<Instances>`).
DOĞRULANDI (MCP 390×844, padsDone tam + tableLevels=4, salon 2 ve 3'e teleport): mobilya+dama her salonda
render. tsc temiz, vitest 183/183, 0 hata. Screenshot: `bug-salon2-now.jpeg` (önce), `fix-salon2.jpeg`/`fix-salon3.jpeg` (sonra).
NOT: dev save `__setState` ile tam-kurulu hale geldi (kullanıcının önceki ilerlemesi üzerine yazılmış olabilir).

**>>> SONRAKİ OTURUM İŞLERİ (kullanıcı 2026-06-15 erteledi) <<<**
1. **Önizleme doğallığı — SEÇENEK A ONAYLANDI, sonraki oturumda yapılacak:** Canlı 3B kesiti daha dolu/doğal
   yap (tema ile anında güncellenir). Şu an sorun: SalonSlice L köşe (sol+arka duvar, sağ açık) "inşaat gibi"
   duruyor (kullanıcı). HEDEF (A): kapalı köşe kutu hissini bırak → oyundaki gibi FERAH çerçeve — zemin tüm
   canvas'ı doldursun (kenar boşluğu/void görünmesin), tek arka duvar (veya yumuşak köşe), kamera biraz daha
   uzak; "salondan kes-yapıştır" doğal dursun. (B reddedildi: statik SS tema-başı recolor edilemez.)
   Dosyalar: `src/components/ui/SalonSlice.tsx` (FloorPatch/WallCornerL/FixedCam), `TableThemePreview.tsx`,
   `DioramaPreview.tsx`.
2. **Tema mağazası gating — HÂLÂ AÇIK SORU (kullanıcı a/b/c/d seçmedi):** "Seviyeler tamamlandıktan sonra
   açılsın" (başta masalar renksiz). Koşul: (a) 3 salon açık · (b) tüm masalar max · (c) oyuncu seviyesi · (d) başka.
   → Ekonomi/progression gate; ONAYSIZ uygulanmaz. Sonraki oturumda önce bunu SOR, sonra uygula.

Sıralama: ÖNCE iş #1 (önizleme A), gating (#2) kullanıcı koşulu seçince.

## ÖNCEKİ (2026-06-15 — TEMA MAĞAZASI ÖNİZLEME: SAYFA-İÇİ + "SALONDAN KESİT")
Kullanıcı iki aşamada istedi: (1) "karta tıklayınca MODAL açılmasın, önizleme aynı sayfada zaten dursun,
kompakt"; (2) "önizleme oyun-anı gibi olsun — AÇI/DURUŞ/UZAKLIK direk salonun bir parçasını kes-yapıştır gibi;
masa/zemin/duvar HEPSİ için." Her ikisi de uygulandı.

**Sayfa-içi (modal kaldırıldı):**
- `TableThemePreview` + `DioramaPreview`: modal sarmalayıcı (modal-backdrop/preview-card + onClose) → `.shop-preview`
  bloğu; satın al/uygula + per-salon butonları yerinde. `ShopPanel` (HUD.tsx): `preview` modal state → sekme başına
  `sel:{table,floor,wall}` (önizlenen çeşit; varsayılan = uygulanmış tema). Önizleme sekmenin ALTINDA, kartların ÜSTÜNDE.
  Karta tıkla → `setSel` ile üstteki önizleme güncellenir. Kart `.sel` = önizlenen; swatch ✓ = uygulanmış.

**"Salondan kesit" (oyun kamerası birebir):**
- YENİ `src/components/ui/SalonSlice.tsx`: `FixedCam` (oyun açısı = izometrik offset (0,d,+d), bakış (0,ty,0),
  fov 50 — Scene.tsx CameraRig dili; OrbitControls KALDIRILDI, sabit duruş), `SalonLights` (ambient 0.6 + dirLight
  [6,12,6]), `FloorPatch` (dış ahşap taban + tema base overlay + checker quad — Ground ile birebir), `WallCornerL`
  (L köşe; WallPiece ile birebir: krem üst h-wh + lambri wh=0.5, h=1.2).
- `TableThemePreview`: FloorPatch(parke) + WallCornerL(krem) + temalı masa (table_medium + 4 recolor tabure + örtü
  plakası); d=2.9. `DioramaPreview`: FloorPatch(seçili zemin) + WallCornerL(seçili duvar) + **gerçek `Table`** (Tables.tsx
  export, level 1) referans; d=4.0. Soyut diorama (DioramaScene) ve OrbitControls SİLİNDİ.
- CSS: `.preview-backdrop`/`.preview-card`/`.preview-hint` kaldırıldı; `.shop-preview` eklendi; `.preview-canvas` 150px.
- DOĞRULANDI (MCP 390×844): üç sekme de salon köşesi kesiti gibi render (masa→mavi temalı masa+köşe duvar;
  zemin→dama checker+masa; duvar→yeşil tema duvar+masa), kart seçimi önizlemeyi günceller, **0 konsol hatası**.
  tsc temiz, vitest **183/183**. Screenshot: `shop-slice-table.jpeg`, `shop-slice-floor.jpeg`, `shop-slice-wall.jpeg`.
- NOT: testid'ler korundu (`shop-card-*`, `preview-buy-*`, `preview-<kind>-<id>-z<z>`); henüz commit YOK.

## ÖNCEKİ (2026-06-15 GECE — PERF + SPLASH + TEMA MAĞAZASI TAM BİTTİ; 8 commit)
Kullanıcı bu oturumda: "#1 doğrula → sonra FPS optimizasyonu YAPABİLDİĞİN KADAR + tema mağazası, HİÇ DURMA".
Tamamlanan milestone'lar (hepsi test+commit+push'lu, vitest 183/183, tsc temiz, MCP 0 hata):
1. **Mobilya instancing** (commit 6e241a9): KayKit mobilya (tek mesh+ortak atlas) `drei <Merged>` ile model
   tipi başına 1 InstancedMesh (~37 primitive → 8). Görsel birebir. Greybox fallback korundu (`Table greybox`
   prop + Suspense/error boundary). PerfProbe'a DEV-only `window.__three` (sahne/kamera) teşhis kancası.
2. **Dama zemini instancing** (commit 9af6506): CheckerTiles ~40 plane → 1 InstancedMesh (birim plane +
   per-instance scale). Düz mesh 323→288.
3. **Açılış splash/loading** (commit 3e51054): `SplashScreen.tsx` + `useProgress`; asset hazır olana kadar
   sıcak temalı ekran sahneyi örter → greybox→model "pop"u + ilk-kare FPS sıçraması GÖRÜNMEZ (talimat #2/#3).
4. **Masa teması 5a** (commit a183c8d): mağazaya MASA bölümü + `tableThemes` (mavi/bordo/zümrüt/altın 30k).
   Seçilen tema mobilya minderini (ortak atlas recolor swap) + örtü plakasını boyar → TÜM mobilya tek swap'le
   renklenir (instancing 8 draw-call korunur). saveVersion 29→30 (`tableTheme`, default 'mavi'). `buyCosmetic('table')`
   GLOBAL (zone'suz, key `table:id`). UÇTAN UCA doğrulandı (mağazadan altın al → 30k düştü → tüm mobilya altın).

**ÖNEMLİ KEŞİF:** Zaten bir "Dekor Mağazası" var (HUD shop butonu → `ShopPanel`): zemin+duvar temaları
ZONE-başına (`floorThemeByZone`/`wallThemeByZone`, `buyCosmetic(kind,id,zone)`, `ownedCosmetics`). 5a bunun
üstüne MASA bölümü ekledi. Tema mağazası SIFIRDAN değil, bu panelin üstüne kuruluyor.

**PERF DRAW-CALL ANALİZİ (window.__three ile, tam kurulu 12 masa/3 zone):** en büyük kaynaklar mobilya DEĞİL:
zemin dama (40→1 yapıldı), pad işaretçileri (GroundMarker daire+halka+Text ~52; Text+dinamik tint → instancing
RİSKLİ, UX hassas, DOKUNULMADI), dekor (saksı/ağaç ~seyrek, el-yerleştirme → küçük kazanç, dokunulmadı).
İki büyük temiz kazanç (mobilya+dama) alındı. Kalan perf fırsatları düşük ROI/yüksek risk.

5. **Tema mağazası 5b** (commit 5345c7c): Dekor Mağazası tek-scroll → SEKME (Masa/Zemin/Duvar). Masa sekmesi
   kaydırılabilir çeşit kartları; karta tıkla → `TableThemePreview.tsx` modalı: parmakla DÖNDÜRÜLEBİLİR 3D
   masa (drei OrbitControls; minder+örtü temaya boyalı) + Satın Al + ücret. Önizleme Canvas'ında gölge KAPALI
   (PCFSoftShadowMap deprecation spam'i giderildi).
6. **Tema mağazası 5c** (commit 96abcc3): Zemin/Duvar da çift-renk swatch'lı kartlara döndü → `DioramaPreview.tsx`:
   bağlamlı KÖŞE diorama (zemin + L-duvar + referans masa, döndürülebilir) + per-salon (Salon 1/2/3) satın al +
   ücret. Floor önizleme seçili zemini, wall önizleme seçili duvarı bağlamda gösterir. TÜM sekmeler artık tutarlı:
   sekme → kart şeridi → 3D önizleme modalı → satın al. UÇTAN UCA doğrulandı (masa/zemin/duvar al → para düşer).

**TEMA MAĞAZASI TAM BİTTİ** — kullanıcının istediği TAM redesign uygulandı (sekme + kart + döndürülebilir 3D
önizleme + diorama + satın al). Çay masası önizlemesi ayrı (TableThemePreview), zemin/duvar diorama (DioramaPreview).

**PERF SONUÇ (taze oyun ölçümü):** eski baz ~88 draw-call / ~5k üçgen → ŞİMDİ **56 call / 3.2k üçgen** (instancing
erken oyunu da kazandırdı). Tam kuruluda mobilya 45→8, dama 40→1. **SIRADAKİ PERF FIRSATLARI (düşük ROI/risk):**
GroundMarker pad işaretçileri (Text+dinamik tint, gerçek oyunda kademeli açıldığından worst-case değil), dekor
(seyrek el-yerleştirme), dpr/gölge (kalite ödünü → onay ister). İki büyük temiz kazanç alındı; kalan riskli.

**SIRADAKİ OTURUM FİKİRLERİ:** (a) tema mağazasına daha fazla çeşit (duvar/zemin/masa renkleri); (b) opsiyonel
masa teması PER-ZONE'a çevirme (şu an global — instancing'i bozmadan zone-başı atlas batch gerekir); (c) telefon
testi (APK) — açılış splash + instancing gerçek cihazda FPS; (d) kalan perf riskli kalemler ancak ölçüm gösterirse.

## ÖNCEKİ (2026-06-15 gündüz — MOBİLYA TIER PROTO'DA OTURDU (rev10))
Bu oturum tamamen **prototip sayfasında (`?proto`) mobilya tier tasarımı** iterasyonuydu. Sonuç (rev10):

**PROTO SAYFASI (`src/components/three/FurniturePrototype.tsx`, App.tsx `?proto` ile):** numaralı KATALOG
(tüm sandalye+masa, #1-#15 isimli) + ÇAY/YEMEK ilerleme satırları + **ok tuşları/WASD serbest gezme**
(FreeMove; Q/E yukarı-aşağı, fare döndür, tekerlek zoom). **BU SAYFAYI SİLME** — genişlete genişlete
çalışılacak (kullanıcı emri).

**KESİNLEŞEN TIER YAPISI (Tables.tsx, gerçek oyun da kullanır; seatsByLevel 1/2/2/4/4 — ekonomi değişmedi):**
- **ÇAY (Seçenek A):** Sv1 çıplak 1 tabure · Sv2 +1 tabure (2) · **Sv3 tabureler minderli, masa ÇIPLAK** ·
  **Sv4 +2 tabure (4) + masa büyür (table_medium), masa hâlâ çıplak** · **Sv5 ÖRTÜ gelir** (finalde).
  Tabure HEP `chair_stool` (kullanıcı: "kıraathanede tabure kalmalı"); şekil değişmez.
- **YEMEK:** Sv1-2 ahşap chair_A_wood (tekli masa, sandalyeler ORTALI) · Sv3 örtü+minderli chair_A ·
  Sv4 masa büyür (table_medium_long, 4) · **Sv5 dolu `chair_C`** (premium şekil). Sv0-2 tekli küçük masa.
- **RENK: HER ŞEY MAVİ** (asset native mavisi `defaultTone #5a93cf`). ALTIN/teal YOK → **tema mağazasında**
  satılacak (pahalı tema). Renk artık TIER DEĞİL.
- **recolor sistemi** (`src/components/three/recolor.ts` + Model.tsx `recolor` prop): asset'in gömülü
  mavisini DÜZ renge boyar (overlay değil). Şu an kullanılmıyor (varsayılan native mavi) ama tema
  mağazası için HAZIR — tema seçilince `chairRecolor` ile devreye girer.
- Örtü = `meshStandardMaterial` düz renk plakası tabla üstünde; minder = asset native (boyanırsa recolor).
- `window.__setState(patch)` dev kancası eklendi (devHooks.ts) — tam pad listesiyle tamamlanmış oyun zorlama.

Doğrulandı: vitest 183/183, tsc temiz, canlı MCP 0 hata. Screenshot: `proto-rev10.jpeg`, `proto-rev10-right.jpeg`.

## DOĞRULAMA (2026-06-15 — talimat #1: mobilya tier GERÇEK OYUNDA gezildi/doğrulandı ✅)
`__setState` ile tam oyun zorlandı (padsDone = tüm pad listesi → tables=12, zonesOpen=3 kalıcı; tableLevels
gradyanı [0,1,2,3, 4,3,2,1, 1,2,3,4]). Oyuncu zone'lara `__teleport` ile gezildi (MCP, 390×844). Bulgular:
- **KayKit modelleri gerçek oyunda yükleniyor** (ağ: table_small/medium, chair_stool/_wood, chair_A/_wood/C,
  table_medium_long, texture → hepsi 200). **GREYBOX FALLBACK YOK.** Tabureler/masalar/sandalyeler zeminde,
  zone yerleşimine oturmuş; ölçek/konum doğru.
- **Çay tier görünür:** tabure kahve→mavi (chair_stool_wood→chair_stool), sayı 1/2/2/4/4, masa büyür
  (table_small→table_medium), Sv5'te örtü katmanı. **Yemek tier görünür:** chair_A_wood→chair_A→chair_C,
  örtü Sv3+, checker "yemek" zemini, büyük masa table_medium_long.
- **Perf (tam kurulu 12 masa/3 zone, masaüstü):** 56 FPS / 214 draw-call / 25.6k üçgen / **0 konsol hatası**.
  NOT: mobilya INSTANCE EDİLMEMİŞ → 214 call tam kuruluda; talimat #2/#3 (preload/splash/FPS) için akılda tut.
- **Küçük gözlem (bug değil, tasarım gereği):** Çay Sv5 örtüsü native maviyle aynı renk → tier sinyali olarak
  ince kalıyor (renk bilerek hep mavi, altın tema mağazasına kaldı). Şekil katmanı yine de ekleniyor.
- Kod DEĞİŞMEDİ (saf doğrulama). Screenshot: `verify-zone0-row.jpeg`, `verify-zone2-food.jpeg`, `verify-zone1-tea.jpeg`.
- SONUÇ: talimat #1 ✅. Sıradaki = #2 ASSET PRELOAD FIX (açılışta greybox→model "pop"u engelle).

## >>> SONRAKİ OTURUM — KULLANICI TALİMAT PAKETİ (uyumadan önce sıraladı) <<<
1. **Mobilya tier'ını GERÇEK OYUNA tam entegre + doğrula** (Tables.tsx zaten ortak; oyunda gez/gör).
   - NOT: tabure sayısı değişmedi (1/2/2/4/4) ama ileride sayı oynanırsa **garson/bulaşıkçı mantığı** da
     düzenlenmeli (kullanıcı uyarısı). Şimdilik gerek yok.
2. **ASSET YÜKLEME FIX:** oyun açılışında assetler yüklenene kadar ÖNCE eski/greybox hali görünüp sonra
   "pop"luyor — bu OLMASIN. Modelleri PRELOAD et (useGLTF.preload + atlas) → hazır olunca göster.
3. **SPLASH / YÜKLENİYOR EKRANI:** oyun başında loading ekranı (assetler + atlas preload). Açılışta
   greybox-flash ve FPS sıçraması yaşanmasın.
4. **TEMA MAĞAZASI (tasarla + kur):** karakter paneli gibi **üstte SEKME** (masalar / duvar / zemin / ...).
   - Altta çeşitler (örn. mavi/sarı masa) sağa-sola **kaydırılabilir/sekmeli**.
   - Bir çeşide tıkla → **MODAL**: ortada **ÖNİZLEME** (3D, kullanıcı eliyle **DÖNDÜREBİLİR**, hafif/ağır
     değil; "oyunda nasıl duracaksa öyle"), altında **SATIN AL butonu + ücret**.
   - Duvar/zemin için **küçük diorama sahne** → seçilen duvar/zemin önünde/üstünde anlık önizleme
     (örn. duvar çeşit-3 seçiliyse masa o duvar önünde / o zemin üstünde önizlensin).
   - **ÇAY masası önizlemesine farklı bir yaklaşım gerekir** (kullanıcı notu).
   - **Ücretleri sen belirle** (sonra ayarlanır). ALTIN tema burada PAHALI olarak satılır.
   - Etik monetizasyon kuralları geçerli (kozmetik, pay-to-win değil).
5. **FPS:** preload/splash ile açılış FPS sorunu olmasın.
ÖNCE bunlar; SONRA proto'yu genişleterek tema mağazası önizlemelerini orada deneyebiliriz.

## ÖNCEKİ (2026-06-14 — KAYKIT MOBİLYA ENTEGRE EDİLDİ; KULLANICI DEV-SERVER'DA BAKACAK)
Bu oturum: KayKit Furniture Bits (CC0) asset entegrasyonu (Faz 6a). Kullanıcı paketi `public/models/`'e
dağınık koymuştu → **modüler yapıya** taşındı: `public/assets/models/kaykit-furniture-bits/` (53 gltf+bin+
tek atlas). fbx / fbx(unity) / obj+mtl / ekstra png / License.txt / .url SİLİNDİ (CC0 → künye manifestte).
Manifest (`public/assets/README.md`) modüler tabloyla güncellendi.

KOD:
- `Model.tsx`: scale/position/rotation prop'ları (yalnız yüklenen modele uygulanır; greybox fallback
  oyun-ölçeğinde kalır, dokunulmaz).
- `Tables.tsx`: KayKit çiziyor (greybox fallback korunur, oynanış değişmedi):
  - Çay: `table_small` (L0-2 ufak kıraathane masası) → `table_medium` (L3+). Tabure
    `chair_stool_wood` (KAHVE, L0-1) → `chair_stool` (MAVİ minder, L2+); sayı 1/2/2/4.
  - Yemek: `table_medium_long` + `chair_A` (arkalık dışta, masaya bakar; yön DÜZELTİLDİ).
  - **TIER SİNYALİ (kullanıcı şartı):** tabla ÜSTÜNE ÖRTÜ mesh'i — sadece üst, seviyeye göre renk
    (çıplak→yeşil→bordo→lacivert→altın). Kullanıcı: "seviye atışı gözle belli olmalı; sandalye
    sayısını bilmeyen hepsini aynı sanmamalı" → çoklu sinyal (örtü+tabure tipi+sayı+L3 masa büyür).
  - Ölçek sabitleri Tables.tsx başında (TEA_TABLE_S/M, STOOL_S, FOOD_*, *_CLOTH) — canlı ayarlandı.
- `devHooks.ts`: `window.__setState(patch)` ham setState kancası eklendi (canlı görsel ayar; `tables`
  padsDone'dan TÜRER → tam pad listesiyle tamamlanmış oyun zorlanır, tableLevels ile tier sergilenir).

DOĞRULAMA: vitest 183/183, `tsc -b` temiz, canlı MCP 390×844 konsol 0 hata. Screenshot'lar kökte:
`kay-tiers-overview.jpeg` (çay L0-L3 tier), `kay-food-tiers.jpeg` (yemek örtü+sandalye yön),
`kay-t3-closeup.jpeg`, `kay-row-L0L1.jpeg`, `kay-food-v2.jpeg`.

SIRADAKİ (kullanıcı sırası): **Kullanıcı dev server'da (localhost, `npm run dev`) bakacak. BEĞENMEZSE
ESKİ GREYBOX MASAYA DÖNÜLECEK** (kullanıcı aynen: "olmadı eski masa haline çevireceğiz güzel olmazsa").
Geri dönüş kolay: Tables.tsx Model `src`/örtü mesh'i kaldırılır, fallback greybox zaten yerinde; Model.tsx
xform prop'ları + devHooks `__setState` kalabilir (zararsız). Beğenirse açık tweak'ler: mavi minderi
tint'leyip örtüyle uyumlu üst renk; örtü boyut/yükseklik ince ayar; KayKit dekor (cactus/pictureframe/
lamp/rug) ekleme; Türk objeleri (semaver/çay bardağı/nargile) Meshy AI.

## ÖNCEKİ (2026-06-14 — YENİDEN TASARIM GERİ ALINDI; ESKİ ZONE MODELİ DEVAM; SONRAKİ = ASSET)
Bu oturum: (1) FPS Tier 2 (coins/NPC/dishes instancing + FPS sayacı) + reveal bug fix bitti, commit'li
(HEAD 8e69893), APK hazır (`android/app/build/outputs/apk/debug/app-debug.apk`). (2) Kıraathane
"tek-mekân + alan çeşitliliği" yeniden tasarımı DENENDİ → kullanıcı REDDETTİ ("nefret ettim") → TÜM
artefaktlar silindi (preview, ?layout, plan doc, activeContext asset notu). **ESKİ ZONE-BAZLI MODEL
aynen geçerli, oyun mantığı hiç değişmedi.** Çalışan oyun yedeği: git tag `checkpoint-2026-06-14-calisan-oyun`.

SONRAKİ OTURUM (kullanıcı sırası): **1) ASSET entegrasyonu → 2) telefon testi.**
- **ASSET PLANI (KayKit, kullanıcı onaylı yön):** **KayKit Furniture Bits Bundle 1** (glTF, CC0,
  statik=ucuz, hatta instance edilebilir). ÇAY masası seviye-bazlı OTURAK: küçük masa+1 tabure → 2 → 4;
  tier'lar = model değişimi + RENK recolor (atlas-swap: kahve→mavi-üst→altın). Masa sabit (yalnız üst
  rengi değişebilir). YEMEK alanı: geniş masa + sandalye (çaydan SONRA). DEKOR: saksı bitki/çerçeve
  (duvar tablosu)/lamba/halı paketten (büyük AĞAÇ YOK → Forest Nature paketinde). Mevcut
  seatsByLevel/tableLevels/tableclothByLevel kancasına eldiven gibi oturur; glb fallback loader'a
  (Model.tsx) kod değişmeden takılır. Recolor yolu = atlas-swap/tint (önceki konuşma). İŞ: koltuk
  pozisyonlarına ölçek/hizalama + tier recolor varyantları. Faz 6 işi ama düşük risk.
  KULLANICI ADIMI: paketi `public/assets/`'e koyacak → sonra model adları+atlas incelenip tier
  eşlemesi netleşir. (Karakter paketi planı da auto-memory'de: KayKit Adventurers sivil + ele tepsi.)
- **TELEFON TESTİ (bekliyor):** FPS sayacı+instancing (yer parayla/salon insanla dolunca FPS sabit mi?),
  reveal fix, turu-6 tost bulaşıkçısı kirli TABAK görseli. Sonuca göre statik bina merge gerekli mi karar.
- **4. alan = "maç salonu"** (ESKİ model içinde, ileride; tost alanı belki bahçe — kullanıcı sonra netleştirir).
NOT: auto-memory'de asset zevki (KayKit evet/Kenney hayır) + sonraki oyun fikirleri (ortaçağ/uzay) duruyor.

## ÖNCEKİ (2026-06-13 — FPS TIER 2 BAŞLADI: SAYAÇ + COINS/NPC INSTANCING + REVEAL BUG FIX; commit'li)
Turu-6 zaten commit'liydi (f07f4a6); bu oturum FPS Tier 2'ye girdi. Yapılanlar (hepsi vitest 183/183,
build, canlı MCP 390×844 konsol 0 hata):
1. **FPS SAYACI (dev/teşhis):** `src/game/perf.ts` singleton {fps,calls,tris}; Scene.tsx `PerfProbe`
   (Canvas-içi useFrame, 0.5sn pencere FPS + gl.info.render kare-başı draw-call/üçgen); HUD Ayarlar →
   "FPS Sayacı" toggle (`set-showfps`) + sol-üst canlı overlay (`fps-overlay`, rAF ~4Hz, renk FPS'e göre);
   `settings.showFps` (save.ts additive default false, SÜRÜM ARTMADI); `window.__perf()` devHook.
   Baz ölçüm (taze oyun): ~60 FPS / ~88 draw-call / ~5k üçgen.
2. **COINS INSTANCING:** Coins.tsx tek InstancedMesh (COIN_CAP 1024). Eskiden her coin ayrı draw-call
   (~215 → ~215 call); şimdi 1. Görsel BİREBİR (aynı COIN_GEO/COIN_MAT; per-instance matris: doğuş-pop
   + dönüş; üniform ölçek dönüşle komütatif → T·S·R=T·R·S). Floater mantığı AYNEN. Canlı: altın disk
   masada doğru (coin-instanced.jpeg). PARA SUNUMU DEĞİŞMEDİ (feedback_coin_presentation korunur).
3. **NPC INSTANCING:** Customers.tsx 2 InstancedMesh — gövde (paylaşımlı kapsül + per-instance renk
   instanceColor) + "çay bekliyor" baloncuğu (NPC_CAP 128). facing(useFacing math)/bob matriste birebir
   türetildi. Greybox fallback kapsülü instance edilir (Model src'siz); Faz 6 .glb = AYRI karar (skinned
   instancing farklı, NOT). Canlı: teal kapsül + sarı baloncuk doğru (npc-instanced2.jpeg).
4. **BUG FIX — "Çay ocağını yükseltebilirsin" reveal'ı (kullanıcı bildirdi):** KÖK NEDEN: table2 açılınca
   görev q_charTray1'e (charStat) geçip ekranı karartırken (spotlight) AYNI tick'te `upgrade:0` reveal
   toast'ı çıkıp eski m.8 yalnız PANI bastırıyor ama toast'ı gösterip reveal'ı KALICI tüketiyordu →
   "yükseltebilirsin" yazısı kararma altında pan'sız çıkıp o pad bir daha gösterilmiyordu. FIX (store.ts
   ~1688): spotlight beklerken PAN'lı reveal TAMAMEN ertelenir (toast+tüketim dahil); panel görülünce
   reveal doğru anda toast+pan ile gelir. m.8 testi yeni davranışa güncellendi. Canlı doğrulandı.
5. **DISHES INSTANCING:** Dishes.tsx 3 InstancedMesh — bardak (çay), tabak diski + kırıntı (tost; kırıntı
   d.pos'a sabit ofset). Statik → matris yalnız konum. DISH_CAP 256. Görsel birebir; "koku bulutu" düşük
   sayı + saydam → instance edilmedi. Canlı: gri bardak masada doğru (dish-instanced.jpeg); tost tabağı
   varyantı tost salonu gerektiğinden canlı test edilmedi (kod orijinali birebir yansıtır).
SONRAKİ: kullanıcı kararı → commit/push (+APK) → TELEFONDA gerçek FPS ölç (sayaç hazır) → ölçüme göre
sıradaki hedef. Hafıza notu: "telefonda gerçek bütçeyi gör, körlemesine optimize etme" — coins+NPC+dishes
en yüksek dinamik sayımlardı, güvenli temiz kazanç.
Beklemede (YAPILMADI): sandalye/tabure statik instancing (seviyeye göre değişken, kazanç düşük), statik
bina merge (Walls/Street/DecorProps — farklı materyaller → sınırlı kazanç), StinkCloud (düşük sayı).

## ESKİ ŞU AN (2026-06-13 — TURU-6 PAKETİ ✅ UYGULANDI; SAVE v28→v29; COMMIT BEKLİYOR)
Kullanıcının 2026-06-13 talimat paketi (6 madde) tek oturumda uygulandı; vitest **183/183**,
build, smoke **26/26** (waiterUp adımı panele taşındı → 1 adım birleşti), Playwright canlı
390×844 konsol 0 hata (screenshot'lar kökte `night2-*.jpeg`). Telefon APK testi bekleniyor.
1. **Map ferahlama (m.12 kalan yarı):** BASE_TABLES kolonlar −1.4/3.7 (aralık 5.1, koridor ~2.2),
   sıralar 2.55/−0.95 (aralık 3.5, koridor ~0.6). Plandaki −1.6 OLMADI: arka-sol masa ocağın
   çay-al+servis birleşik dairesine giriyordu (3.00<3.2) → −1.4 + açılım öne; ayrım 3.33 ✓.
   zone2 pad z 0.6→0.8 (yeni koridor merkezi). Zone alanı sabit.
2. **Kamera:** taban d 6.4→**6**, portrait clamp 1.4→**1.3** (= ilk APK dönemi ~7.8; kullanıcı
   "ilk zamandaki gibi yakın"). + **Genel-bakış TOGGLE butonu** (sağ-alt, tepsi butonlarının
   altında, CamZoomIcon): camZoomOut transient ×1.45. Basılı-tut DEĞİL toggle (analiz: başparmak
   joystick/tepsiyle meşgul). data-testid="cam-zoom".
3. **Masa fiyatları:** AÇMA −%10 + 5'in katı (table2 20, table3 115, table4 380, z2: 200/485/900,
   z3: 485/1125/2025; fillRate'ler dwell süresi korunarak ölçekli). YÜKSELTME zone-kademeli:
   `tables.upgrade.zoneCostMult [1, 1.5, 2.5]` — z1 BİREBİR eski (60/108/194/349), z2 90/160/290/525,
   z3 150/270/485/875 (5'e yuvarlı). tableUpgradeCost(level, zone). YAN ETKİ: offline
   capNextPadFrac 1.2→1.15 (z2table2 200'e inince "zone açılır ama içi bitmez" değişmezi bozuluyordu).
   Sim: garson 10.3dk, z3 dolu 1.62sa, ocak ₺-max 1.81sa — tempo korunuyor.
4. **Personel HIZ → karakter paneli (SAVE v29):** mekânsal waiterUp pad'i/waiterLevels TAMAMEN
   kalktı (LAYOUT.waiterUpgradeSpots, FILL_WAITER, reveal, Scene marker, devHooks dahil).
   WaiterUpgrades += teaSpeed/tostSpeed/dishSpeed. Garson hızı AYNI değerler (1.5→2.0, 250₺;
   kullanıcı "böyle kalsın"); BULAŞIKÇI YENİ hız merdiveni 2.0→2.4→2.8 (₺700/2200 — kullanıcı
   "net şekilde eklenmeli"). Migrasyon v29: teaSpeed=max(wl0,wl1), tostSpeed=wl2 (₺ kaybolmaz).
   Quest q_waiterL2 AYNI id/sıra, hedef tipi waiterLevel→waiterSpeed (quest migrasyonu GEREKMEDİ).
   HUD char-buton nabzı artık waiterTray/waiterSpeed görevlerinde de yanar ("görev orayı göstersin").
5. **Coin OTO-TOPLAMA:** money.autoCollectAfter **180sn** (+config'te gerekçe), mıknatıs alanı
   muaf, stats.coinsCollected ARTMAZ (manuel sayaç). Toast TOPLU: autoCollectToastEvery 20sn —
   "Bekleyen paralar otomatik toplandı +X" (canlı doğrulandı; coin tavanı ~215 → m.13 FPS bulgusunun
   kalıcı çözümü, InstancedMesh kararı gereksizleşti). Para SUNUMU değişmedi (feedback_coin_presentation).
6. **Bug fix:** TOST salonu bulaşıkçısının taşıdığı kirli artık TABAK çizilir (Dishwasher.tsx
   CarriedDirty food prop — zone'dan türer; oyuncu m.11 kalıbı). NOT: canlıda taşıma anı kareye
   yakalanamadı — telefon testinde göz at.
SONRAKİ: kullanıcı onayı → commit/push (+APK derleme) → telefon feedback turu-6.
Beklemede kalanlar: garson tepsi geç-seviye fiyat indirimi "belki ileride" (kullanıcı), para
sunumu ferahlama sonrası yeniden değerlendirilecek (mockup onayı şartı sürüyor).

## >>> SONRAKİ OTURUM: FPS Tier 2 (INSTANCING) — KULLANICI ONAYLI <<<
2026-06-13 FPS tartışması yapıldı (canlı A/B screenshot fps-A-yuksek.png vs fps-B-dusuk.png).
KARARLAR:
- **Tier 2 = bu oturumda DEĞİL, sonraki taze oturumda** (bağlam doldu; kullanıcı "önce kaydet").
  Görsel bedeli SIFIR (instancing birebir aynı üçgenleri tek draw-call'da çizer). Kapsam:
  InstancedMesh'e geçir → sandalye/tabure (12 masa × ~4), coin'ler (Coins.tsx, m.13 "Seçenek A"),
  kirli kaplar (Dishes), NPC gövdeleri (aynı kapsül, per-instance renk via instancedColor).
  + statik bina geometrisini (Walls/Ground/dekor) merged BufferGeometry'ye indir. Hedef: 200-400
  draw-call → bir avuç. ÖNCE telefonda FPS sayacı devHook'u ekle (gerçek bütçeyi gör, körlemesine
  optimize etme). Mevcut render: Scene.tsx dpr [1,2], antialias true, shadows 1024, ~7 useFrame
  bileşeni (her NPC'de useFacing + bob = 2/NPC), drei Html floater (batch'li) + Text marker.
- **Tier 1 (dpr/AA/shadow düşürme) ERTELENDİ → Faz 7 (asset turu).** Gerekçe: kullanıcı haklı —
  flat low-poly aliasing'i gizliyor (A/B'de fark ~yok) AMA gerçek dokulu .glb gelince düşük dpr
  sırıtır. Çözüm: SABİT düşük değer GÖMME → uyarlanabilir yap (drei PerformanceMonitor/AdaptiveDpr
  + Ayarlar'da Düşük/Orta/Yüksek). dpr runtime değer, tek satır — kalıcı taahhüt değil.
- **Gölge uzun-vade planı:** bina STATİK → statik gölgeyi BAKE et, sadece karakterlere dinamik
  gölge → hem ucuz hem daha kaliteli (production hissi çözünürlükten değil bundan gelir).
- m.13 InstancedMesh kararı: oto-toplama (180sn) coin sayısını ~215'te tavanladı → acil değil,
  ama Tier 2'de yine de yapılacak (kalıcı temizlik).

## ESKİ (2026-06-12 GECE OTURUMU — TURU-5 UX PAKETİ ✅; şema değişmedi, v28 kaldı)
Gece protokolü: kullanıcı uyuyor, onaylı turu-5 listesi sırayla işleniyor. 1. milestone (hızlı UX
paketi, maddeler 7/8/9/10/11) TAMAM:
- **m.7 kilitli sekme gizle**: CharacterPanel sekmeleri dinamik liste — tutulmamış karakterin
  sekmesi HİÇ çizilmez; tek sekme kalırsa çubuk komple gizli. WaiterTab/DishTab kilit dalları +
  `.char-locked` CSS kaldırıldı (ulaşılamaz oldu).
- **m.8 spotlight çakışması**: KÖK NEDEN table2 bitişi AYNI anda (a) ertesi tick 'upgrade:0'
  reveal panı (prio 1) + (b) q_charTray1 spotlight'ı tetikliyordu → kamera "Çay Yükselt"e kayarken
  ekran kararıp char butonunu gösteriyordu. FIX (store.tick 2 nokta): spotlightPending
  (aktif görev charStat + !charPanelSeen) iken reveal panı BASTIRILIR + görev geçişinde camFocus
  null. Reveal toast'ı korunur; q_station2 zaten sonra oraya pan atar. Eski reveal-pan testi
  charPanelSeen:true ile güncellendi + yeni bastırma testi.
- **m.11 tabak görseli**: yeni TRANSIENT `carriedDirtyFood` (persist YOK — v28 kaldı); toplama
  `d.kind==='plate'` ayrımı, kapasite/yıkama toplamdan (havuz ortak). CupTray `dirtyFood` prop →
  yayvan disk + kırıntı; devHooks.carriedDirtyFood. Canlı doğrulandı (tabak toplandı=1).
- **m.10 tost masası kare→dikdörtgen**: Tables.tsx `rect = food && tableSeats(level)>2` —
  L0-L2 KARE (0.475), L3+ dikdörtgen (0.675/0.425). SALT görsel; collision foodTableHalf SABİT
  (nav cache + büyüme-tuzağı riski yüzünden bilinçli). Canlı: L0 kare + L3 dikdörtgen screenshot'lı.
- **m.9 aktör çarpışması kaldırıldı**: store.tick'teki oyuncu-aktör (NPC/garson/bulaşıkçı) bloğu
  + LAYOUT.actorHalf silindi — oyuncu kalabalığın içinden geçer. Personel navStep separation'ı
  (oyuncuya yol verme) KORUNDU. Mobilya collision'ı aynı. Yeni vitest: NPC içinden geçiş.
Doğrulama: vitest **182/182** (3 yeni), build, smoke **27/27**, sim eğri AYNI (z3 dolu @1.63sa),
Playwright canlı (390×844): taze oyunda sekme çubuğu YOK, gelişmiş v28 kayıtla 4 sekme, tabak
toplama, kare/dikdörtgen masalar; konsol 0 hata. Screenshot'lar kökte `night-ux*.png`.
NOT: kayıt enjeksiyonunda yine "Storage.prototype.setItem no-op" hilesi gerekti (unload-autosave eziyor).

**2. milestone — DENGE RAPORU ✅ (uygulama YOK):** `docs/denge-raporu-2026-06-13.md` — sim 3 profil +
el hesabı: m.1 ocak +2 ₺ seviyesi önerisi (çay 102/153, tost 2040/3060, Usta L7'ye, şema değişmez);
m.2 tost arz/talep 1:5-8 ÖLÇÜLDÜ → prepTime 14→11 + m.1A paketi; m.3 garson tepsi maliyet indirimi
(800/2400/6000→400/1500/4500; quest yeri AYNI = v29 GEREKMEZ — Öneri A) vs reorder (B, v29 ister);
m.5 karakter köprülü eğri (tepsi T3 15k→5k, T4 60k→18k...); m.4 seçenek A(dokunma)/B(garson-öncesi
−%15, önerilen)/C(genel −%10 ÖNERMEM). 5 onay sorusu raporun sonunda.

**3. milestone — FPS (m.13) ✅ kanıtlı 2 bulgu (`docs/fps-bulgulari-2026-06-13.md`):**
1) FLOATER SIZINTISI (FIX ✅): MoneyFloater useEffect deps [onDone] → her toplamada timer reset →
   395 floater DOM'da birikti (ölçüldü), FPS 12-16. Fix: onDoneRef + mount'ta tek timer →
   1.5sn'de 0 floater, FPS 39. "Kapa-aç düzeltiyor"un ana açıklaması (floaters React state'i).
2) COIN BİRİKİMİ (rapora): AFK 10dk = 377 coin → FPS 24 (masaüstü); money.lifetime 0 bilinçli.
   Paylaşımlı COIN_GEO/COIN_MAT uygulandı (görsel sıfır fark); InstancedMesh (A, önerilen) vs
   para-yığını merge (B) kararı sabaha. dishes/NPC/notice/navGrid temiz çıktı.
**4. milestone — KAMERA+MAP PLANI (m.12) ✅ (uygulama YOK):** `docs/kamera-map-plan-2026-06-13.md` —
ölçüm: sıralar arası net koridor 0.0 br (tabureler değiyor); öneri B+A-hafif (kolon 4.4→5.2,
sıra 2.9→3.5, kamera d 7→6.4; zone alanı sabit); ×1.15 genel ölçek ÖNERİLMEDİ. 3 onay sorusu.

**GECE OTURUMU KAPANIŞI:** `GECE-RAPORU-2026-06-13.md` kökte (screenshot'lı, "SABAH KARARLARI"
bölümlü). FPS fix'li FINAL APK 22:46 (~5.3MB).

## >>> SIRADAKİ OTURUM: para desteleri (m.6-B) + kamera/map (m.7) + APK testi feedback'i <<<
KULLANICI KARARLARI GELDİ (2026-06-12 gece, 2. tur) ve **DENGE PAKETİ UYGULANDI** (şema v28 kaldı,
migrasyon yok):
- Ocak +2 ₺ seviyesi: `costsByLevel [20,30,45,67,150,300]` (L1-L4 eski floor'larla birebir;
  L5/L6 kuyruğu kullanıcı isteğiyle DİK — saf eğri 102/153 az bulundu), masterLevel 5→**7**
  (Usta 💎 L7'ye). Tost tezgâhı ×20 → 400/600/900/1340/**3000/6000**. Canlı doğrulandı
  (45→67→150→300 ödendi, L6'da ₺ tavanı).
- Tost prepTime **14→11** (arz/talep 1:5-8 darboğazı; L1 tezgâh 5.45sn/tost → max bekleme ~16sn
  < sabır 28.8sn).
- Garson tepsisi: çay **400/1200/2500**, tost **1200/3000** (kullanıcının rakamları; quest sırası
  aynı → v29 GEREKMEDİ).
- Karakter: tepsi [75,**130**,**5000**,**18000**], mıknatıs [200,**700**,**2200**], hız
  [400,**1100**,**3200**].
- 5B kısmen: garson pad **150→130** (fillRate 60 kaldı ~2.2sn). table3 130→110 YAPILMADI —
  **MASA RAKAMLARI ERTELENDİ** (kullanıcı: "masa rakamlarına şimdi dokunma, sonra bakarız" —
  açma −%10 + yükseltme 100/200/400/800 önerisi denge raporunda beklemede).
Sim SONRASI (Normal): garson 11.1dk, z3 dolu 1.69sa, ocak ₺-max L6 @1.87sa (yeni geç-oyun hedefi);
tempo hedefleri korunuyor. simulate.ts milestone etiketi dinamik oldu (`₺-max L${SOFT_MAX}`).
vitest 182/182 (3 test yeni sayılara güncellendi; usta testi masterLevel'dan türetilir oldu),
build, smoke 27/27. Rapor güncel: `docs/denge-raporu-2026-06-13.md` SONUÇ bölümü.

**PARA REVİZYONU-3 (TAM GERİ ALMA — kullanıcı: "böyle de çok kötü, eski haline dönder"):**
moneySpot saçılımı DA reddedildi → coin spawn ORİJİNAL satırına döndü (masa önü ±0.5 saçılım),
moneySpot LAYOUT'tan tamamen kalktı, ilgili test silindi. KORUNAN: toplu floater + paylaşımlı
COIN_GEO/COIN_MAT (FPS fix'leri, görsel fark yok) + kamera 6.4. vitest 182/182, smoke 27/27.
DERS (hafızaya da yazıldı — feedback_coin_presentation): para sunumu 2 kez geri alındı; bir daha
dokunmadan önce telefonda mockup ONAYI şart, "kullanıcı tarif etti" yetmiyor.

(Aşağıdaki blok TARİHÇE — kuleler geri alındı:)
**PARA DESTELERİ (m.6-B) + KAMERA UYGULANDI (aynı oturum devamı, kullanıcı netleştirmesiyle):**
Kullanıcı: "paralar masa altında kalıyor; YERDE üst üste, yan yana 3-4 KULE gibi, görünür yerde
biriksin (havada değil); kamera biraz daha yaksın." Uygulama:
- `BASE_TABLES.moneySpot` (masanın ÖN-DIŞ çaprazı; upgradeSpot ön-İÇ'te) → `LAYOUT.tables[i].moneySpot`.
- `Coin.tableIndex?` (transient; yoksa serbest coin — eski testler/davranış korunur).
- Ödeme coin'i moneySpot'a `tableIndex`'le düşer; tick'te İSTİF DÖNGÜSÜ (mıknatıs bloğundan önce):
  masa başına 4 kule z-yönlü (aralık 0.46), kat yüksekliği 0.062; mıknatıs alanındaki coin istiflenmez;
  HER TICK yeniden derlenir → kısmi toplamada havada coin kalmaz. attractR tek yerden.
- Çakışma doğrulandı: waiterUp [-3.5,3.4] 1.17 br, ocak yükseltme [-4.35,-0.5] 1.95 br (>1.3 pad yarıçapı).
- Coins.tsx: coin YERDE YATIK (X-rotasyon + spin kalktı), pos.y store'dan, id-bazlı hafif açı;
  floater'lar TEK TOPLU "+toplam" yazısına birleşti (kule toplamada spam/Html maliyeti yok).
- Kamera d 7→**6.4** (Scene.tsx; m.12'nin kamera yarısı — masa araları HENÜZ açılmadı).
vitest **184/184** (2 yeni: istif+yeniden derleme, ödeme→moneySpot), build, smoke 27/27, Playwright
canlı: 392 coin'le kuleler masa yanında görünür (`night-ux5b-para-desteleri.png`), konsol 0.

SONRAKİ OTURUMDA SIRADA:
1. **Map ferahlama (m.12'nin kalan yarısı):** masa aralarını aç (kolon 4.4→5.2, sıra 2.9→3.5,
   docs/kamera-map-plan-2026-06-13.md) — kamera 6.4 YAPILDI.
2. Masa rakamları: kullanıcı APK testi + feedback sonrası karar verecek (öneri denge raporunda).
3. Kullanıcı en yeni APK'yı (denge + desteler + kamera) test edip feedback verecek.

## >>> SIRADAKİ: FEEDBACK TURU-5 LİSTESİ (2026-06-12 akşam — UX PAKETİ ✅, kalanlar aşağıda) <<<
Kullanıcı turu-4 APK'sını (a96a478, 15:37) test etti; 14 maddelik feedback verdi. TAM LİSTE +
triyaj + önerilen sıra: `docs/feedback-2026-06-12-turu5.md`. Özet sıra: 1) hızlı UX paketi
(kilitli panel sekmesi gizle, onboarding spotlight çakışması, tepside tost bulaşığı TABAK görseli,
tost masası seviyeye göre kare→dikdörtgen, oyuncu-aktör çarpışması kalksın) → 2) denge paketi
(ocak +1-2 seviye, tost arz darboğazı, garson tepsi erken+ucuz [quest reorder = v29 İD-eşleme!],
karakter eğrisi yumuşat, GENEL FİYAT İNDİRİMİ ÖNERİSİ ONAYA — "çok az veya aynı; belki sadece
garson öncesi dönem") → 3) FPS profiling ("kapa-aç düzeltiyor" = birikim/sızıntı ipucu) →
4) kamera+map ferahlama tasarım turu. Sonraki oturum bu listeyle başlar.
KULLANICI ŞARTI: denge/para maddeleri "en ince detayına kadar HESAPLANARAK" yapılacak — önce
sayısal rapor (sim + amortisman/tempo hesabı), onay, sonra uygulama (docs dosyasındaki şart bloğu).

## ŞU AN (2026-06-12 — FEEDBACK TURU-4 başladı: TOST SALONUNA MÜŞTERİ GELMİYOR fix'i ✅)
Kullanıcı telefon testine başladı; ilk bulgu: "tost servis et görevi var ama tost yemeye kimse
gelmiyor". KÖK NEDEN: `findTableForGroup` GLOBAL "en çok boş koltuklu masa" seçiyordu (eşitlikte
düşük index) — tost masaları L0=1 koltukla açılırken çay masaları L1+ (2-4 koltuk) olduğundan tost
salonu spawn'ı neredeyse HİÇ kazanamıyordu (q_tost5 ilerlemiyor; aynı açlık z3 açılan HER yeni
salonda yaşanacaktı). FIX: spawn ZONE ROUND-ROBIN — transient `spawnZone` imleci (persist YOK,
şema değişmedi); her spawn imleçten başlayıp boş koltuğu olan İLK zone'u seçer, zone İÇİNDE eski
kural (en çok boş koltuk, düşük index); başarıda imleç seçilen zone'un SONRAKİNE geçer → her açık
salon ~eşit grup payı alır (L0 tost masası 1 kişi, L4 çay masası 4 kişi aldığından koltuk-temelli
sim talebiyle de doğal uyumlu). `findTableForGroup` artık export (unit test edilir).
Doğrulama: vitest **172/172** (4 yeni dağılım testi: starvation fix, zone-içi seçim, dolu/kirli
sarma + -1, STORE tick 3-salon entegrasyonu), build, smoke **27/27**. Sıradaki: YENİ APK + kalan
telefon feedback'i.

İKİNCİ FEEDBACK: "bulaşıkçı kesinlikle yetmiyor — 2. bulaşıkçı mı yükseltme mi?" → KARAR: 2.
bulaşıkçı DEĞİL (3 yeni pad + 4. dolaşan aktör = yer/kalabalık; kapasite 2 kalınca 2 kişi de
yetmez), LEĞEN KAPASİTE YÜKSELTMESİ (SAVE **v28**). Kök neden: carryCapacity 2 SABİTTİ — Y2
grupları tek L4 masada 4 kirli bırakıyor, bulaşıkçı bir masayı bile tek turda temizleyemiyordu.
Uygulama: `waiterUpgrades.dishCarry` (v28 alanı; migrasyon default 0 + kelepçe — init() de kelepçeler,
DERS: init() waiterUpgrades'i alan alan kurar, yeni alan oraya DA eklenmeli yoksa undefined kalır),
`dishCarryCapacityFor(tier)=2+2×tier` (2→4→6→8), maliyet config `dishwasher.carryUpgrades.costs
[600,2000,5000]` (tüm salonların bulaşıkçılarına ORTAK; carryCapacity config'ten KALKTI — tek
kaynak), `buyDishCarry()` aksiyonu, CharacterPanel 4. SEKME "Bulaşıkçı" (kilit: hiç bulaşıkçı
yoksa; DishwasherPreviewModel TEK Canvas'ta), sahnede CarriedDirty 4'lük sıralar (8'e kadar, leğen
genişler). Doğrulama: vitest **176/176** (4 yeni v28 testi: eğri+kelepçe, buyDishCarry, FSM tek-tur
4 kirli vs taban 2, v27→v28 migrasyon), build, smoke **27/27**, Playwright CANLI: v27 kayıt enjeksiyonu
(setItem no-op hilesi) → v28 (teaTray 1 korundu, dishCarry 0 eklendi), Bulaşıkçı sekmesi "Leğen 2→4",
satın alma −600₺ → "4→6"+2K buton + önizlemede 4 bardak; konsol 0. Sıradaki: YENİ APK (iki fix
birlikte) + kalan telefon feedback'i.

ÜÇÜNCÜ FEEDBACK PAKETİ (4 başlık, onaylı uygulandı):
1) "Tostta müşteri sabırdan kaçıyor" → SABIR ÜRÜN-BAZLI: PRODUCTS.patienceMult (çay ×1, tost ×1.6
   → L0 ~28.8sn > hazırlık 14sn + servis turu); tablePatience(level, product) — store oturma anında
   zoneProduct'tan geçirir. (Tost talebi round-robin fix'iyle artınca arz/sabır dengesizliği açığa çıktı.)
2) "Garsonlar/temizlik yetişmiyor, masalar hep kirli" → bulaşıkçı hızı 1.8→2.0 (leğen v28 ile birleşik;
   oyuncudan hâlâ yavaş — kısmi assist korunur). Garson hızına DOKUNULMADI (kullanıcı 2026-06-11'de
   yavaşlatmayı onaylamıştı); tepsi yükseltmeleri zaten Y3 panelinde.
3) SVG TUTARLILIĞI: TrayIcon'a `food` prop (tost dilimli tepsi) → q_tostTray1 rozeti + panel Tostçu
   sekmesi; DishTab "Leğen" satırı BasinIcon (WashIcon türevi — çay tepsisi görünmez); QuestPhoto 'pad'
   case'i includes('waiter'/'dishwasher') ile eşleşir (z2waiter/z3waiter/waiter2... MASA ikonu alıyordu;
   z3'lüler tostçu hardal kişi ikonu).
4) PAD DOLUM TAVANI 3.5sn (kullanıcı önce "max 5sn" dedi, push öncesi "3-3.5sn olsun"a indirdi):
   table4 120, zone2 315, z2table3 155, z2dishwasher 206, z2table4 286, zone3 1030 (8→3.5sn!),
   z3table2 155, z3waiter 229, z3table3 358, z3dishwasher 458, z3table4 643, waiter2 229,
   z2waiter2 343, z3waiter2 572; upgradeFillRateFor kelepçe 1-3.5sn (tost L4 3.5sn). Öğretici
   pad'ler (1.5-3sn) AYNI kaldı.
Doğrulama: vitest **179/179** (3 yeni turu-4 testi + 2 güncellenen dolum testi), build, smoke 27/27,
sim eğri AYNI (z3 dolu @1.63sa — sabır/dolum sim'de yok), Playwright CANLI: Tostçu sekmesi tost
dilimli tepsi ikonu, Leğen leğen ikonu, q_tostTray1 görev rozeti tost tepsisi (ekran görüntüleri);
konsol 0. NOT: package.json `apk` script'i `.\gradlew.bat` oldu (PowerShell'de çıplak ad bulunamıyor).

## ŞU AN (2026-06-12 — TELEFON FEEDBACK TURU-3 oturumu; M-A ✅ + M-B ✅, SAVE v27)
Kullanıcı feedback'i (onaylı plan: M-A fixler → M-B görev redesign → M-C=Y3 → M-D=Y4; fiyat
indirimi son teste ERTELENDİ):
- ✅ **M-A** (commit 5727b07): pad fiyat yazısı büyüdü (GroundMarker sub 0.29/başlık 0.3);
  garson hız noktası [-3.5,3.4]'e (duvar arkasında kayboluyordu); merdiven kaldırıldı;
  dolum süreleri — pad fillRate = cost/hedef-dwell (öğretici 1.5-3sn, orta 3-5sn, açılış max 8sn),
  yükseltmeler `upgradeFillRateFor(cost)` süre 1-6sn kelepçe (tost L4 22.5→6sn).
- ✅ **M-B GÖREV REDESIGN (SAVE v27)**: q_z2serve KALDIRILDI, q_z3serve→q_tost5 ("5 tost servis et");
  yeni çeşitler: q_z2station/q_z3station (zone'lu stationLevel), q_tableL2x2 (tablesAtLevel 2×L2),
  q_waiterTray1/q_tostTray1 (waiterTray — Y3 panel satın alımı M-C'DE GELİYOR, o görevlere kadar
  oyuncu ulaşamadan M-C bitmiş olmalı!). Kamera: serveTea→stations[z] (boş salon ortası bitti),
  stationLevel zone'lu, tablesAtLevel→ilk eksik masa. QuestPhoto: tost dilimi ikonları (zone 2).
  v27 migrasyonu: İD-eşleme (alias q_z2serve→q_z2table2, q_z3serve→q_tost5) + GENEL güvenlik ağı
  (aktif görevin gerisinde alınmamış pad görevi → geri çek; hattı bitmiş kayda dokunma) + questBase
  tutarlılığı (sayaç değilse 0; eşdeğer sayaçsa korunur). `waiterUpgrades {teaTray,tostTray}` persist
  v27'de AÇILDI (default 0; Y3 UI M-C'de). vitest 156/156, build, smoke 27/27, sim z3 @1.63sa.
- ✅ **M-C (Y3)**: CharacterPanel SEKMELİ (Oyuncu|Çay Garsonu|Tostçu; kilit: garson tutulmadan
  garson sekmesi kilitli mesaj). `buyWaiterTray(kind)` store aksiyonu; garson FSM tepsiyi
  `waiterTrayCapacityFor`'dan okur (çay=teaTray z0+z1 ortak, tost=tostTray) + TEK durakta masadaki
  HERKESE bırakır (artan tepsiyle sıradaki masa). Waiter görseli: tepside N birim (genişleyen tepsi),
  TOSTÇU hardal gövde + beyaz kep (y 1.24 — 1.06 kapsül içinde kalıyordu). ÖNEMLİ DERS: panelde
  sekme başına AYRI <Canvas> WebGL context limitine takılıp önizlemeyi karartıyor → TEK Canvas,
  sekme modeli değiştirir. config.waiter.trayCapacity KALDIRILDI (tek kaynak: waiterTrayCapacityFor).
  Playwright canlı: v26 enjeksiyon → v27 (q_z3serve→q_tost5 1/5 taban korunmuş ✓), panel satın alma
  (tost 1→2, cüzdan −2000 ✓), sahnede tostçu+büyük fiyat yazısı+tost görev ikonu ekran görüntüleri;
  unload-autosave enjeksiyonu ezer → testte Storage.prototype.setItem no-op hilesi. vitest 161/161.
- ✅ **M-D (Y4)**: 2. garson pad'leri waiter2/z2waiter2/z3waiter2 (800/1200/2000, OPSİYONEL;
  requires yeni türü `allZoneTablesLevel {zone,level:4}` — GateState'e opsiyonel tableLevels eklendi).
  Pad konumları = kendi salonunun 1. garson pad'inin TAM yeri (prev:waiter → eski pad yok olmuş;
  sıfır çakışma riski). `derivedFromPads.waiterCountByZone` (hasWaiter = count>0; max 2).
  **visiblePads artık availableOptionalPads'ı DA döndürür** (eskiden opsiyonel pad hiç çizilmiyor/
  doldurulamıyordu!); q_waiter2 görevinde çiftleme filtreli. FSM: `waiters2` paralel dizi + CLAIM
  (runWaiter closure; 1. garson en acil masayı claim eder, 2. garson o masayı hariç tutar; ev ofseti
  +0.7). Görevler APPEND: q_z1allL4 (tablesAtLevel 4×L4 z0, 400₺) + q_waiter2 (300₺). Sim: talep
  koltuk-temelli (tablesByZone × tableSeats(tableLevel) — L0'da çarpan 1 → ölçülen eğri AYNI:
  z3 dolu @1.63sa). vitest 168/168 (7 yeni Y4 testi), build, smoke 27/27, Playwright canlı (L4 salon
  + waiter2 pad'de 4.5sn dur → −800₺ → 2. garson spawn + servis, waiterServed 80→88; konsol 0).
- ⏳ Sıradaki: **YENİ APK** (`npm run apk`) → kullanıcı Y3+Y4 TOPLU telefon testi → feedback turu;
  fiyat indirimi kararı bu testten sonra. Sonra: arka-sol rezerv arsa içeriği + üst kat tasarım turu.

## ŞU AN (2026-06-11 — Y2 ✅ KOLTUK + GRUP SİSTEMİ; kayıt şeması DEĞİŞMEDİ, v26 kaldı)
Onaylı planın (docs/yemek-alani-garson-plan.md §2) Y2 milestone'u uygulandı:
- **Koltuk türetme:** `tables.seatsByLevel` [1,2,2,4,4] + `tableSeats(level)` (economy.config — tek
  kaynak). Görsel sandalye sayısı = oturulabilir koltuk (Tables.tsx `tableSeats`; eski level+1
  kuralında L2 3 sandalyeydi, plan gereği 2'ye indi). Koltuk POZİSYONLARI `ALL_TABLES.seats`
  (CHAIR_SPOTS/FOOD_CHAIR_SPOTS store.ts'e taşındı; Tables.tsx LAYOUT.chairSpots/foodChairSpots'tan
  çizer; seats[0] eski .seat ile birebir).
- **Grup spawn:** `npc.groupChances` %30/35/20/15 (1-4 kişi; `rollGroupSize(roll)` SAF fonksiyon —
  deterministik test); hedef = en çok BOŞ koltuklu temiz masa (eşitlikte düşük index); koltuk
  yetmezse grup KÜÇÜLÜR; üyeler sokakta saçılıp AYNI masada FARKLI koltuklara (`Npc.seatIndex`,
  transient — migrasyon yok); çay/timer/ödeme/bahşiş BİREYSEL (ekonomi korunumu).
- **Tavan + kirli eşik:** müşteri tavanı = max(8, toplam KOLTUK+2); kirli eşik koltukla ölçeklenir
  (`dirtyTables(dishes, tableLevels)` → eşik 2×koltuk; L0 eski davranış >2). Dishes.tsx koku işareti
  + devHooks aynı imzayla tutarlı. Yeni dev kancası: `__setTableLevel(i, lvl)`.
- **FLAKY TEST FIX (öncesinden):** bahşiş testi "uzak" oyuncuyu [0,0.6,99]'a koyuyordu → z=5'e
  kelepçelenip ~%10 olasılıkla parayı mıknatısla topluyordu (aynı-tick attract→pickup) → gerçek
  uzak alan-içi nokta [5.2,0.6,-5.2]. HEAD'de de reproduce edildi (bizden değildi).
- Doğrulama: vitest **145/145** (8 yeni Y2 testi; 8 ardışık tam koşu stabil), build, sim AYNI
  (z3 dolu @1.67sa normal — sim grup/koltuğu Y4'te öğrenecek, plan §6), smoke **27/27**, Playwright
  canlı: L3 masada 4 kişilik grup farklı taburelerde (ekran görüntüsü), L2'de 2 karşılıklı koltuk,
  tepsiyle TEK durakta 2 müşteriye servis → 2 AYRI para, 10dk hızlı-sarma soak; konsol 0.

## >>> SIRADAKİ: TELEFON FEEDBACK'İ → Y3 → Y4 (kullanıcı kararı, 2026-06-11 oturum sonu) <<<
APK DERLENDİ ✅ (`android/app/build/outputs/apk/debug/app-debug.apk`, beee864 içerikli) — kullanıcı
telefonda KISA test yapacak. Akış: **1)** Sonraki chat: telefon feedback'i alınır, gerekirse fix.
**2)** Sonraki chat(ler): **Y3** (sekmeli karakter paneli Oyuncu|Çay Garsonu|Tostçu + garson tepsi
yükseltmeleri çay 800/2400/6000, tost 2000/5000 + tostçu kıyafet farklılaşması; SAVE **v27**
`waiterUpgrades`) → **Y4** (2. garson 800/1200/2000, gating: salonun 4 masası L4 + claim + görevler
APPEND + sim kalibrasyonu — grup/koltuk talebi sim'e burada işlenir). **3)** Y3+Y4 bitince TOPLU
telefon testi (yeni APK).

## ŞU AN (2026-06-11 — Y1 ✅ YEMEK ALANI KİMLİK PAKETİ, SAVE v26)
Onaylı planın (docs/yemek-alani-garson-plan.md) Y1 milestone'u uygulandı:
- **Y1a counter:** tost tezgâhı (z2) ARKA duvara paralel, önü güneye — `FOOD_ZONE/FOOD_STATION`
  [10.6,-14.65], stationRots[2]=0, per-zone `stationHalves` (yemek [1.1,0.4]); pickup ön yüzde
  [10.6,-13.8], garson evi [11.5,-13.8], yükseltme pad'i [8.6,-14.65] (pad↔pickup değişmezi 2.0 ✓);
  `dishRots` ayrıldı (bulaşık yan duvarda kaldı); z3dishwasher pad'i [13.3,-14.3]'e taşındı (eski
  nokta counter footprint'i içinde kalıyordu); KitchenHand z2'de tezgâh arkasında x-boyu yürür.
- **Y1b masa:** yemek masaları DİKDÖRTGEN (1.35×0.85, `foodTableHalf` [0.7,0.45], collision+nav dahil)
  + ARKALIKLI sandalye (chairWood+petrol minder) 2'ye 2 karşılıklı (FOOD_CHAIR_SPOTS); oturma yeri
  G-BATI sandalyesi (ALL_TABLES seat dünya x −0.35); çay tarafı kare+tabure aynen.
- **Y1c zemin:** FLOOR_THEMES `yemek` (düşük kontrast iri karo, #e3dac6/#d8cdb4) tost salonunun
  DOĞUŞTAN teması (`defaultFloorTheme`); mağazada ücretsiz satır olarak da var; zemine primitive
  ÇATAL-BIÇAK/TOST amblemi (FoodCorner — daire plaka + işaretler).
- **Y1d pano:** menü panosu counter üstündeki arka duvarda (kara tahta + tebeşir satırları + fiyat
  pirinçleri + tost silüeti).
- **Y1e buton:** `emptyTray(kind:'tea'|'food')`; HUD'da AYRI tost-bırak butonu (kendi TostEmptyIcon
  SVG'si, data-testid empty-tray-food) — yalnız ilgili sayaçla görünür, korunum ayrı ayrı.
- **SAVE v25→v26:** z2 zemini eski varsayılan 'parke' ise 'yemek'e migrate; satın alınan tema korunur.
  **NOT: Y3'ün garson-tepsi şeması artık v27 olacak** (plan dokümanı v26 diyordu, Y1 aldı).
- Doğrulama: vitest **137/137** (6 yeni Y1 testi: counter geometrisi, pad-dışı footprint, dikdörtgen
  masa+koltuk hizası, nav rotaları, v26 migrasyonu, yeni-oyun defaults), build, sim AYNI (z3 dolu
  @1.67sa), smoke **27/27**, Playwright canlı: v25 kayıt → v26 'yemek' zemini; counter+pano+amblem+
  sandalyeli masalar ekran görüntüsüyle doğrulandı; tost/çay butonları ayrı çalışıyor; konsol 0.

## >>> SIRADAKİ: Y2 — KOLTUK + GRUP SİSTEMİ (EN RİSKLİ) <<<
`docs/yemek-alani-garson-plan.md` §2: seatIndex (transient), grup spawn (%30/35/20/15), koltuk =
masa seviyesi (1/2/2/4/4), müşteri tavanı koltuk+2, kirli eşik koltukla ölçeklenir; gerçek-dt
regresyon testleri ŞART. **Kullanıcı kararı (2026-06-11): Y2 sonraki oturumda; Y2 bitince YENİ APK
derlenip telefonda test edilecek** (`npm run apk`). Sonra Y3 (sekmeli panel + garson tepsi
yükseltmeleri, SAVE v27) → Y4 (2. garson + claim + gating).

## ŞU AN (2026-06-11 — KULLANICI KARARI: M4+M5 GERİ ALINDI, TOST SALONU ARKA-SAĞA TAŞINDI, SAVE v25)
Kullanıcı gece oturumu çıktısını tarayıcıda gördü: "tasarımsal olarak çok kötü — geri al, zone zone
düzenleyelim; 3. zone sağ üstte olsun, 4. zone ve lavabo/depoyu kaldır" → ONAYLI uygulandı:
- **git revert** ab6e02e (M5 maç salonu) + e494aee (M4 tuvalet+depo) — temiz geçti.
- **MAX_ZONES=3**; z2 (TOST) arka-SAĞA taşındı (`zoneCol = z<2?z:1`), arka-SOL hücre kalıcı
  REZERV arsa: `zoneAt(col,row)` yardımcıyla duvar komşulukları ızgaradan; rezerv hücre nav'da
  DAİMA bloke; L-köşe dikmesi aynalandı (bx−m/2); DEPO görseli rezerv arsada kalıcı, TUVALET
  görseli zone-3 açılınca kalkar; zone3 unlock pad'i z1 arka şeridine ([7.7,0,-4.3], sağ geçit x 9.0).
- **SAVE v25 migrasyonu**: v24 kayıtlardaki kaldırılan pad'ler (wc/cleaner/zone4 zinciri) düşülür,
  harcanan + yarım dolan ₺ İADE edilir; silinen görevler hep listenin SONUNDAYDI → questIndex clamp
  yeter; tost ilerlemesi (z2 index'i değişmedi) aynen korunur.
- Doğrulama: vitest **131/131** (v25 iade testi + sağ-geçit/rezerv-arsa kelepçe testleri), build,
  sim (zone-3 dolu @1.25sa idealize), smoke **27/27**, Playwright canlı (v24 kayıt → v25 + iade
  10K→27.4K, tost salonu sağ üstte istasyonuyla, rezerv arka-sol duvarlı; konsol 0).
- **DENGE + GÖRSEL TURU (aynı gün, kullanıcı ONAYLI, uygulandı):**
  1. Mıknatıs M1 250→200 (M2/M3 aynı).
  2. Offline: rateMult 0.2→0.5 + masa BAHŞİŞLERİ orana dahil (incomeRate tipTotal parametresi;
     ilerleme offline'ı da büyütür) + capNextPadFrac 0.6→1.2 (sıradaki pad + birkaç yükseltme;
     zone unlock sıradaysa açılır ama İÇİ bitmez).
  3. z2/z3 zincir pad'leri −%10 yuvarlanmış (zone2 1100, z2 zinciri 225-1000; zone3 3600,
     z3 zinciri 540-2250). Öğretici pad'leri + yükseltme eğrileri AYNI. Sim: zone-3 dolu
     1.81→1.67sa normal (~%8 — "çok az" bandı ✓).
  4. **z1↔z2 (alan 2↔3) arası duvar TAMAMEN kaldırıldı** (rowWallSegments + rowPassageX/Half silindi;
     kilitli z2 blokajı lockedZoneSolids+clampToOpenZones'ta sürer; z0 arka duvarı + corner dikme durur).
  5. **Zemin redesign**: orta KİLİM kaldırıldı (PALETTE.carpet/carpetBorder silindi); parke teması
     soft kum tonuna (#c9a87d) yumuşatıldı; Ground komşulukları zoneAt(col,row) ile ızgaradan.
  Doğrulama: vitest 131/131 (offline tavan/oran + bahşiş-oran testleri güncellendi), build,
  smoke 27/27, Playwright canlı (duvarsız sınır + halısız soft zemin + 90sn akış; konsol 0).
- **YEMEK ALANI + KOLTUK + GARSON PLANI ONAYLANDI** (aynı gün, iki compute raporu sonrası):
  TAM PLAN → `docs/yemek-alani-garson-plan.md` (görsel kimlik, koltuk 1/2/2/4/4 + karışık gruplar,
  2. garson L4-masa gating'li + claim, sekmeli karakter paneli + garson tepsi yükseltmeleri SAVE v26,
  ayrı tost-bırak butonu, zemine kendi amblemimiz). Bu oturumda ayrıca KÜÇÜK FİX girdi: tepsi-boşalt
  butonu artık tray+trayFood toplamıyla görünüyor (elde sadece tost varken de çıkar; Y1'de ikiye ayrılır).

## >>> SONRAKİ OTURUM: ONAYLI PLANIN UYGULANMASI (Y1→Y4) <<<
`docs/yemek-alani-garson-plan.md` sırasıyla; her milestone: vitest+sim+smoke+Playwright+commit+PUSH.
1. **Y1** Yemek alanı kimliği: tost tezgâhı arka duvara paralel (önü güneye) + restoran masa düzeni
   (dikdörtgen + 2'ye 2 arkalıklı sandalye) + farklı zemin tonu + zemine kendi çatal-bıçak/tost
   amblemi + menü panosu + AYRI tost-bırak butonu (kendi SVG).
2. **Y2** Koltuk+grup sistemi (EN RİSKLİ): seatIndex (transient), grup spawn (%30/35/20/15),
   koltuk = masa seviyesi (1/2/2/4/4), tavan koltuk+2, kirli eşik ölçekleme; gerçek-dt testler.
3. **Y3** Sekmeli karakter paneli (Oyuncu|Çay Garsonu|Tostçu) + garson tepsi yükseltmeleri
   (çay 800/2400/6000; tost 2000/5000) + tostçu kıyafet farklılaşması; SAVE v25→v26.
4. **Y4** 2. garson pad'leri (800/1200/2000; gating: salonun 4 masası L4) + claim sistemi +
   görevler APPEND + sim kalibrasyonu.
Ayrıca bekleyen: istek üzerine yeni APK; arka-sol rezerv arsa içeriği + üst kat tasarım turu
kullanıcıyla.

## GECE OTURUMU 2026-06-12 — 1. KAT TAMAMLAMA (onaylı plan: docs/zone34-wc-floor2-design.md §5b)
**NOT (2026-06-11): M4+M5 bu sabah kullanıcı kararıyla GERİ ALINDI (üstteki blok).**
Kullanıcı uyuyor; onay: "zone-3 tost planıyla devam + 1. kattaki her şeyi görevlerle planla-yap +
görev para ödülleri + yemek masaları farklı/seviyeyle artan görsel". Milestone başına test+commit+push.
- ✅ **M1 GÖREV ÖDÜLLERİ** (commit b4d8ac7): QuestDef.reward — tamamlanınca cüzdan+lifetime,
  toast'ta coin+tutar, görev kartında rozet; tüm görevlere ödül (öğretici 3-15, z2 zinciri 50-200);
  sim'e quest-ödül modeli (ilk alım 60→34sn idealize). vitest 120/120, smoke 27/27, Playwright canlı.
- ✅ **M2 2×2 IZGARA**: MAX_ZONES=4 (z2 arka-sol TOST rezervi, z3 arka-sağ MAÇ rezervi); zonePoint
  (ayna+sıra kaydırma); sıra-arası GEÇİTLİ duvar (rowWallSegments — collision+nav+çizim TEK liste);
  kilitli zone nav'da bloke; oyuncu AÇIK-zone-birleşimi kelepçesi (L-şekil); duvarlar zone-kenarı
  başına üretilir (L-köşe dikmesi 3-zone halinde); zone3/zone4 pad zincirleri config'te (görevler
  M3/M5'te; zone-3 şimdilik çay olarak açılabilir — M3 tost'a çevirir); Ground/ReservedRooms/
  KitchenStaff/gölge kamerası genellendi. vitest 124/124 (4 yeni: zincir türetme, geçit segmentleri,
  gerçek-dt müşteri nav'ı arka salona, union kelepçe), sim (z3 @44dk, kat dolu @1.8sa idealize),
  smoke 27/27, Playwright canlı 3-zone + 4-zone görsel (konsol 0).
- ✅ **M3 TOST HATTI (zone-3)**: `PRODUCTS` (tea 5₺/6sn ↔ tost 25₺/14sn; dish cup/plate;
  upgradeCostMult ×20) + `ZONE_PRODUCTS` (z2=tost); teaStation.basePrice/npc.orderTime artık
  PRODUCTS.tea'dan (tek kaynak). Tepside ayrı `trayFood` (kapasite paylaşımlı); tost müşterisi
  ÇAYLA doyurulamaz; ödeme ürün fiyatından; kirli TABAK görseli; emptyTray tostu da döndürür.
  Görsel: TostStation (sac+ısınan pres kapakları, L2+ çift pres, ekmek kasası) + tost ustası
  (hardal önlük/beyaz kep) + YEMEK masası evrimi (kırmızı muşamba→turuncu→petrol→altın + L1
  peçetelik/L2 ketçap-mayo/L3 servis tabağı) + garson tepsisinde tost. Görevler q_zone3..q_z3table4
  APPEND (İD-eşleme gerekmedi; SAVE v23 kaldı — şema değişmedi). **BUG FIX: maxConcurrent 8 sabitti,
  9+ masada arka salon müşterisiz kalıyordu → tavan masalarla ölçeklenir (tables+2).** Sim ürün-
  farkındalı (zone-3 dolu @60dk idealize). vitest 130/130, build, smoke 27/27, Playwright canlı
  (tost al→servis→25₺ ödeme→görev 1/5; tabak; "Tost Tezgâhı" etiketi; konsol 0).
- ⏳ M4 tuvalet+depo → M5 maç salonu + APK.

## ŞU AN (2026-06-11 — TELEFON FEEDBACK TURU-2 ✅ UYGULANDI, SAVE v23)
Kullanıcı v22 APK'yı CANLI test ederken 8 maddelik turu-2 feedback'i verdi; HEPSİ onaylanıp uygulandı:
1. **Bulaşıkçı pad 330→200** (kullanıcı verdi — "git gel bitmiyor").
2. **Pad'lerde KALAN tutar**: 4 işaret tipi de (pad + çay/masa/garson yükseltme) `ceil(maliyet−dolum)`
   gösterir; `afford` da kalana bakar (100'e 50 verdiysen "50" yazar + 50'yle parlar).
3. **Müşteri kapı-önü takılması KÖK ÇÖZÜM**: `buildNavGrid` ceil yüzünden son satır hücre merkezleri
   alanın DIŞINA taşıyordu (z≈5.05 > maxZ 5.0) → kapıdan girip SAĞA kıracak müşterinin ilk waypoint'i
   oraya düşünce "içeri gir" eşiğiyle (z>5.0→kapıya dön) SONSUZ SALINIM (çöp kovası hizası, kullanıcının
   gördüğü bug). Alan-dışı hücreler artık BLOKE. 2 yeni vitest: gerçek dt (1/60) ile sokaktan SAĞ masaya
   oturma (eski dt=0.1 testleri bug'ı atlıyordu — kırmızı→yeşil) + ızgara sınır değişmezi. Çöp kovası
   kapı şeridinden ön duvar dibine ([1.6,4.5]→[2.5,4.85]) taşındı (salt görsel).
4. **Görev senkronu v23**: q_z2serve, q_zone2'nin HEMEN arkasına (salon açılınca kamera oraya pan
   atarken görev zone-1'e geri yollamıyordu çelişkisi bitti); yeni sıra ...q_charMagnet → q_zone2 →
   q_z2serve → q_waiterL2 → q_tableL2 → q_z2table2... + **stats.teasServedByZone** (zone'lu serveTea
   hedefi YALNIZ o salonu sayar — eski global sayaç "Yeni salonda 5 çay"ı z1'de de dolduruyordu).
   **SAVE v22→v23**: İD-eşlemeli questIndex (entryV≥22; eski aktif q_waiterL2/q_tableL2 → q_z2serve'e
   alınır, yoksa görev sessizce atlanırdı), q_z2serve aktifse questBase=0, teasServedByZone tohumu
   [global, 0].
5. **Semaver/bardak çakışması**: semaver tezgâhın yanına (lokal x+0.55), hazır bardaklar sol yarıda
   2 sıra × 4 (max kuyruk 8) — gömülme bitti.
6. **Garson SADECE ÖNDEN çay alır**: `LAYOUT.stationPickups` (modül ön yüzü, z2 aynalı) + REACH_PICKUP
   0.45; eski merkez+geniş-yarıçap hedefi arka çaycı koridorunu da kabul ediyordu. Canlı 60sn örnekleme:
   ocak bandında hiç arkaya geçmedi.
7. **Garson boşta ÜST SIRADA bekler**: waiterHomes sol-alt [-4.7,4.2] → mutfak bloğu yanı [-3.5,-3.4]
   (z2 aynalı); bulaşıkçı zaten üstteydi (yerinde).
8. **Tepsiyi Boşalt butonu** (onaylı tasarım): tepside ≥1 çay varken sağ-alt buton (TrayEmptyIcon SVG +
   adet rozeti); basınca çaylar gider, bardaklar TEMİZ havuza döner (korunum; kirliler kalır). İlk
   belirişte spotlight + açıklama balonu (`trayTipSeen` persist; charPanelSeen kalıbı). `emptyTray`/
   `markTrayTipSeen` store aksiyonları. NOT: ocak önünde basılırsa canlı döngü tepsiyi anında yeniden
   doldurur (pickup yarıçapı) — bug değil, bilinçli.
**Doğrulama:** vitest **119/119** (7 yeni) · build temiz · sim (etiketler artık config'ten; bulaşıkçı
~19dk, zone-2 ~45dk normal — tempo korunmuş) · smoke **27/27** · Playwright canlı: tepsi butonu+spotlight,
pad'de kalan ("80" = 200−120), v22→v23 migrasyon enjeksiyonla birebir (q_dish korundu, dolum 120 korundu),
zone-sayaçlı q_z2serve (z1 servisi ilerletmedi, z2 ilerletti), garson önden alım + üst sıra idle, konsol 0 hata.
NOT (canlı test tekniği): sayfanın beforeunload-otosave'i localStorage enjeksiyonunu eziyor —
enjeksiyon+`Storage.prototype.setItem=noop`+reload AYNI evaluate bloğunda yapılmalı.
**SIRADAKİ:** yeni APK (v23) kullanıcıya; oynadıkça turu-3 feedback'leri gelecek.

## İÇERİK TASARIM ARAŞTIRMASI ✅ RAPOR YAZILDI — ONAY BEKLİYOR (2026-06-11)
Rapor: **`docs/zone34-wc-floor2-design.md`** (kod yazılmadı). Öneri özeti:
- **Seçenek A (önerilen):** Zone-3 = TOST OCAĞI (ikinci ürün hattı; tost pahalı+yavaş, D-010
  "fiyat artışı yeni menüyle"; tost ustası NPC + kirli tabak döngüsü) + Zone-4 = MAÇ SALONU
  (çay iskeleti + büyük TV; MVP dekor+hafif bahşiş, maç rush event'i Faz 4 anahtarıyla).
- **Bahçe zone REDDi gerekçeli:** duvar/nav/kat ızgarası bozulur; bahçe hissi = sokak masaları
  (görsel) + üst kat nargile balkonu.
- **Tuvalet+Depo MVP:** arka şerit rezervlerinde (depo sol, tuvalet sağ); tek pad'le birlikte
  açılır (zone-3↔zone-4 arası omurga); döngü = %~25-30 müşteri kullanır → 1 kâğıt + kapı önüne
  ödeme; kâğıt bitti → depodan koli taşı; temizlikçi personeli ikmali otomatikler (kısmi).
- **Üst kat = OYUN KATI:** okey/tavla zone'ları (4 müşteri birlikte, uzun oturum, kalkışta yüksek
  masa ücreti + periyodik çay) + servis çay-zone'u + nargile balkonu (ön cephe) + kata özel
  tuvalet+depo. Kumarsız/çocuk-güvenli sunum.
- Uygulama sırası önerisi: zone-3 → tuvalet/depo → zone-4 → Faz 3b üst kat (her biri ayrı plan).
**SIRADAKİ:** kullanıcı raporu onaylar/değiştirir → onaylanan kısım uygulama planına çevrilir.
(Feedback turu-3 [v23 APK telefon testi] hâlâ beklemede — kullanıcı sonra verecek.)

## (ÖNCEKİ HEDEF) >>> İÇERİK TASARIM ARAŞTIRMASI (kod YOK — önce araştır+raporla+onay) <<<
Kullanıcı istedi (2026-06-11 gece): **sonraki 2 zone + lavabo/depo + üst kat** detaylı tasarlanacak.
- **Sonraki 2 zone ne olacak?** Kullanıcının aklındakiler: yemek salonu (sıcak bakıyor) + bahçe
  ("bahçe mantıksız olur gibi" — şüpheli). Mekânı KOMPLE restorana çevirmek İSTEMİYOR (kıraathane
  kimliği korunmalı). Kararı BANA bıraktı — tür araştırması yap (My Perfect Hotel/Idle Miner katman
  desenleri + gerçek Türk kıraathane kültürü: tost/sahanda yumurta/gazoz tarzı atıştırmalık, okey/tavla
  salonu, nargile, TV/maç köşesi...), 2-3 seçenekli kısa rapor + NET önerimle gel.
- **Yemek alanı seçilirse detay:** hangi çalışan(lar) (aşçı? tost ustası?), hangi yemekler (menü =
  yeni ürün hattı mı, çay hattına paralel ikinci kaynak mı), istasyon/teçhizat tasarımı (ocak modülü
  deseninde mi), ekonomi kancası (fiyat/throughput D-010'a uyum).
- **Lavabo (tuvalet) + DEPO:** ne olacak, NEREDE olacak (progress 3c taslağı: kata özel, parayla
  açılır, tuvalet kâğıdı döngüsü depodan al→tak + temizlikçi — bu taslak detaylandırılacak/revize).
  Zone içinde mi kat koridorunda mı, hangi döngüyle oyuncuya iş üretir, hangi personel.
- **ÜST KAT ne olmalı?** (Faz 3b kat geçişi merdivenle) — kat konsepti + zone dağılımı önerisi.
- Çıktı: `docs/`'a kısa tasarım raporu (seçenekler+öneri+yerleşim krokisi metni) → kullanıcı onayı →
  ancak ondan sonra uygulama planı. (Planla-onayla-uygula kuralı; onaysız denge/yerleşim değişikliği yok.)

## (ÖNCEKİ — 2026-06-11 — TELEFON FEEDBACK TURU-1 ✅ COMMIT+PUSH (6aa7325) + YENİ APK, SAVE v22)
Kullanıcı v21 APK telefon testinden 6 maddelik feedback verdi; HEPSİ uygulandı:
1. **Müşteri takılma bug'ı (KÖK çözüm):** "masaya müşteri gelmiyor / müşteriler kümeleniyor" =
   müşteriler hâlâ `moveAvoid` (eksen-kayma) kullanıyordu; yerleşim v3'te ÖN-SIRA masa, kapı ile
   ARKA koltuk arasına TAM giriyor → müşteri kilitlenip masayı SÜRESİZ rezerve ediyordu (garsondaki
   eski deadlock'un aynısı). Müşteri de salon içinde **navStep (BFS)** kullanır (kapı↔koltuk);
   sokak segmenti düz `moveToward`. +30sn vazgeçme sigortası (toTable'da timer). `moveAvoid` SİLİNDİ
   (çağıran kalmadı). 2 yeni vitest (arka masaya oturur + çıkışta takılmaz).
2. **Zone-2 gizleme → 4 GERÇEK DUVAR:** karanlık hacim telefonda AYDINLIK göründü + kelepçe
   "görünmez engel" hissi verdi → `LockedZoneShade` SİLİNDİ. Duvarlar yalnız AÇIK zone'ları sarar
   (sağ duvar kilitliyken zone sınırında = kelepçe duvara dönüşür; standoff dış duvarlarla birebir).
   Kilitliyken zone-2 zemin overlay/kilim + tuvalet/merdiven ÇİZİLMEZ (yanı boş arsa). Açılınca bina
   sağa uzar (kamera panı mevcuttu). Ground/Walls/ReservedRooms zonesOpen'a bağlandı.
3. **Çay yükseltme pad'i ocağın ALTINA:** upgradeZones [-2.4,-2.5]→[-4.35,-0.5] (sol duvar, modülün
   kapı tarafı; ocak merkez ayrımı 2.0 > pickup 1.6). Garson pad'i çakışmasın diye [-4.6,1.5]→[-4.6,2.2]
   (ayrım 2.71 > 2×PAD_RADIUS 2.6). z2 aynalı otomatik.
4. **Tepsi fiyatları (kullanıcı verdi):** T1/T2 150/500 → **75/150**. T3/T4 (15k/60k) DOKUNULMADI
   (onaysız denge değişikliği yok — kullanıcı isterse sonra).
5. **Toast redesign + ALT-ORTA:** üstte görev kartına biniyordu + "çirkin" → alt-orta (bottom 88px),
   krem kart + tür-bazlı SVG madalyon (görev=yeşil CheckBadge, seviye=StarBadge, reveal=altın BangBadge),
   emoji prefix'leri ('✓','🎉') metinden çıktı; `GameNotice.kind` eklendi.
6. **Zone-2 gating — yükseltmesiz:** q_zone2 görevi yükseltme görevlerinin (q_waiterL2/q_tableL2)
   ÖNÜNE alındı (yeni sıra: q_charMagnet → q_zone2 → q_waiterL2 → q_tableL2 → q_z2serve). Pad zinciri
   zaten tüm z1 pad'lerini istiyordu (table4←dishwasher←waiter←table3). **SAVE v21→v22**: questIndex
   İD-EŞLEMELİ (yalnız entryV≥20) + GÜVENLİK kelepçesi (aktif görev q_zone2'nin ilerisinde ama zone2
   pad'i alınmamışsa q_zone2'ye geri çekilir — yoksa hat q_z2serve'de kilitlenirdi; tamamlanmış sonraki
   görevler tick auto-advance ile anında geçilir).
**Doğrulama:** vitest **110/110** (4 yeni: 2 müşteri-nav + 3 v22 migrasyon/sıra) · build temiz ·
sim (zone-2 ~32dk, tempo korunmuş) · smoke **27/27** · Playwright canlı: kilitli duvar görünümü,
zone-2 satın alma + duvar uzaması, v21→v22 kelepçesi canlı (questIndex 14 → q_zone2), toast alt-orta
DOM+görsel, arka masada oturan müşteriler, konsol 0 hata.
**Commit 6aa7325 push'landı + YENİ APK derlendi (kök `KoseKiraathanesi-debug.apk`, 5.1MB, v22).**
**SIRADAKİ:** kullanıcı yeni APK'yı telefonda test eder; feedback turu-2 ile devam.

## (ÖNCEKİ — 2026-06-11/12 — KARAKTER YÜKSELTME v20 ✅ + ZONE-2 TAM GİZLEME ✅ + ÇAYCI v2 ✅ + YENİ APK)
**Karakter yükseltme sistemi UYGULANDI** (commit 0955e21 — onaylı tasarım birebir):
- `economy.config.character` (tepsi [2..6] 150/500/15k/60k · mıknatıs [2.6..5.0] · hız [4.5..5.4])
  + türeticiler (`trayCapacityFor/attractRadiusFor/playerSpeedFor`, `charNextCost`, `charLevel`).
  Eski sabitler (serving.trayCapacity, money.attractRadius, player.moveSpeed) KALKTI — kademeden türetilir.
- **SAVE v19→v20**: eski kayda `tray:2` HEDİYE (kapasite 4 korunur); yeni oyun tepsi 2;
  `questIndex` İD-EŞLEMELİ migrasyon (entryV≥16 ise; v<16 zaten yeni listeyle tohumlanır,
  seedQuestIndex charStat'ı hediye değerleriyle değerlendirir). `charPanelSeen` persist (spotlight 1 kez).
- 3 charStat görevi onaylı zamanlamada (q_charTray1 q_table2→q_serve5; q_charTray2 q_table3→q_waiter;
  q_charMagnet q_table4→q_waiterL2); charStat'ta kamera SIÇRAMAZ (questFocusPos null).
- HUD: sol küme YATAY 4-buton (⚙✉🖌👤, genişlik ≤ seviye pill — 390px'te 116≤130 ölçüldü);
  görev aktifken altın nabız + "!"; ilk seferde spotlight karartma. `CharacterPanel.tsx`:
  mini Canvas 3/4 açı + canlı tepsi önizleme (satın almada pop) + 3 kart. `__buyChar` dev kancası.
**Kullanıcı feedback turu aynı oturumda yapıldı:**
- **Zone-2 TAM GİZLİ** (commit 2c80a20): kilitliyken opak karanlık HACİM (void — hiçbir şey görünmez);
  pad açılınca ~1.8sn karanlıktan aydınlığa fade + kamera panı. zone2 pad'i eşiğin zone-1 tarafına
  (x 5.3→4.55) alındı (halka/etiket karanlığa taşmasın).
- **Çaycı v2**: ayrı bacaklar+ayakkabı, tepsiye uzanan simetrik kollar+ten eller, göz/burun;
  panel kamera kadrajı düzeltildi (tam gövde 3/4).
- **YENİ APK**: kök `KoseKiraathanesi-debug.apk` (5.1MB) — kullanıcı telefona kuracak.
Doğrulama: vitest **99/99** · build temiz · smoke **27/27** · sim (T1 ~4dk idealize, akış sağlıklı) ·
Playwright gerçek-tıklama (panel satın alma, spotlight, zone reveal) · konsol 0 hata.
**SIRADAKİ ADAY İŞLER:** kullanıcının APK/telefon feedback'i; T3/T4 fiyatlarının gerçek oyunda hissi;
karakter kıyafet kozmetikleri (Dekor Mağazası rafı — gelecek); UAL Pro/asset kararı hâlâ açık.

## >>> SONRAKİ OTURUM: KULLANICI TELEFON TESTİ FEEDBACK'LERİYLE GELECEK <<<
Kullanıcı yeni APK'yı (kök, 5.1MB, v21) kurup test ediyor. Oturum feedback'leri dinleyerek başlar.
Test edilmesi beklenenler: (a) salon-2 yükseltmelerinin sıralı açılışı (ocak→z2 2. masa sonrası,
masalar→z2 dolunca, garson hız→kendi 20 taşıması), (b) kilitli salonun TAM karanlık görünümü +
açılışta karanlıktan aydınlığa fade, (c) karakter yükseltme akışı (görev zamanlaması, panel,
spotlight, T1-T2 fiyat hissi), (d) çaycı v2 gövdesi, (e) yeni oyun tepsi-2 temposu (eski kayıtta T2 hediye).

## EK (2026-06-12 — ZONE-2 YÜKSELTME GATING'İ v21 ✅, kullanıcı isteği "zone-2'de de düzen olmalı")
Tür araştırması (önce kapasite, sonra verim — Idle Miner/Dino Park konvansiyonu) + zone-1 deseni AYNALANDI:
- **z2 ocak yükseltmesi**: salon açılır açılmaz DEĞİL → z2table2 sonrası (`teaStation.upgradeRequiresByZone`).
- **z2 masa yükseltmeleri**: z2table4 sonrası, per-zone gate (`tables.upgradeRequiresByZone` + `tableUpgradeUnlockedZ`).
- **z2 garson hızlandırma**: KENDİ garsonunun 20 taşıması (`stats.waiterServedByZone`, **SAVE v20→v21**:
  global→z1; z2waiter zaten tutulmuşsa eşik tohumu — görünür işaret elinden alınmaz). z0 global ile harman (geri-uyum).
- **Reveal toast'ları zone-başına** (`upgrade:z/waiterUp:z/tableUp:z`, "Salon 2:" öneki + pan hedefi revealKeys'ten).
Doğrulama: vitest **104/104** (6 yeni gating/migrasyon testi) · sim (z2L1 artık z2table2 SONRASI, tempo aynı) ·
smoke **27/27** (anahtar adları güncellendi) · Playwright canlı (upgrade:1 doğru anda, waiterUp:1 doğru şekilde YOK) ·
konsol 0. YENİ APK kökte. NOT: dev sunucu artık 5178 portunda olabilir (5173-5177 dolu).

## (ÖNCEKİ — 2026-06-11 FEEDBACK TURU-3 — D-025 rev. A: TEK MUTFAK BLOĞU + yavaş garson; SAVE v19)
Kullanıcı turu-2'ye "bulaşık ayrı garip" dedi; iki seçenek sunuldu, **A'yı seçti** (uygulandı):
- Bulaşık kendi ocağının HEMEN BİTİŞİĞİNDE (z1 sol/z2 sağ duvar TEK mutfak bloğu; dishHalf döndü).
- GARSON YAVAŞLATILDI (onaylı): [1.8,2.3]→[1.5,2.0] — tur ~12sn < sabır 18sn (ölçüm 51 servis/180sn).
- Masa sıraları hafif yukarı (-1.0/1.9); bulaşıkçı pad'i [0.2,-4.5] (pad daireleri kesişmez).
- Görev zoom'ları canlı doğrulandı (yeni bulaşık/ocak/çay pad'i/zone-2 merkez).

## (ÖNCEKİ — 2026-06-11 FEEDBACK TURU-2 UYGULANDI — YERLEŞİM v3, D-025; SAVE v19 değişmedi)
Kullanıcı PC başında değildi; tasarım+uygulama+doğrulama tek oturumda bitirildi (agent'sız, bizzat):
- **Per-zone AYNALI mutfak:** z2'nin kendi ocağı (sağ duvar) + bulaşık arka duvarda ocaktan AYRI →
  zone-2 garson turu ~21sn→~10sn (sabır 18sn artık dolmuyor; 180sn ölçümünde 50 servis, kaçan yok).
- **Masalar sağa+yukarı**, masa pad'leri kapı çaprazında; çay pad'i ocağın yanında ferah alanda.
- **KARE masa evrimi** + seviye başına sandalye (4'e kadar) + yakın oturma (0.78).
- **Mağaza fix:** dama=quad satranç deseni; zemin overlay duvara kadar; kilim yumuşak toprak-bordo.
- **KARAR (raporlandı): 2 GARSON** (salon başına 1) — 3.sü fazla otomasyon, L2 hız yedek var.
Kullanıcı dönünce: telefonda/tarayıcıda OYNAYIP yerleşim v3 hissini değerlendirecek; masa açılış
sırası ÖN sıradan (t0 ön-sol) — feedback'e açık. APK hâlâ ESKİ (istenirse yeni derlenir).

## (ÖNCEKİ — 2026-06-11 SABAH FEEDBACK'İ UYGULANDI — WP3/WP4 kısmi GERİ ALMA; SAVE v19 değişmedi)
Kullanıcı gece-2 paketine feedback verdi: **"assetler çok kötü oldu — karakterler küçük, zemin
iğrenç, çay ocağı birleşmesi kötü; konsept My Hotel tarzı olmalı."** Yapılan (detay progress.md):
- Karakterler/zemin/çay ocağı/bulaşık ESKİYE döndü (primitive + düz zemin + semaver + lavabo/koku).
  Quaternius glb'leri ve pipeline repo'dan SİLİNDİ. WP5 (tek gösterge) + WP6 (mağaza, düz renkle) korundu.
- Çay yükseltme pad'i ocağın hemen yanına (kullanıcı "soluna" dedi — solda duvar/çaycı koridoru var,
  salon tarafına bitişik koyuldu; kullanıcı görüp onaylayacak). Geometri testi gevşetildi (pickup-guard asıl).
- Zone'lar bitişik (ZONE_DX 10.6, sınır x=5.3) — duvarsız "ölü boşluk" kapandı. Duvar yine YOK.
**AÇIK KONU — YENİ KARAKTER/ASSET SEÇİMİ:** kullanıcı $9.99 listesini inceleyecek (UAL Pro:
https://quaternius.itch.io/universal-animation-library · B planı Synty POLYGON City $29.99).
Karakter paketi BİRLİKTE seçilecek; seçilmeden karakter asset'i ekleme. APK henüz YENİLENMEDİ
(eski APK'da silinen karakterler var — kullanıcı isterse yeni APK derle).
Kalan sabah kararları: curve Ö1-Ö4 (docs/curve-report.md) + telefon tempo testi.

## (ÖNCEKİ) >>> ☀️ SABAH: kullanıcı GECE-RAPORU-2026-06-11.md'yi okumuş olacak <<<
GECE-2 (2026-06-11→12) TAMAMLANDI: WP1-WP6 hepsi uygulandı + yeni APK (kök
`KoseKiraathanesi-debug.apk`, 8.8MB — karakter modelleri dahil) + GECE-RAPORU-2026-06-11.md.
**Sabah kullanıcıdan beklenen kararlar (rapor sonunda):**
1. Kirli masa A (koku bulutu) / B (leke+sünger, AKTİF) — night2-wp4-dirty-A/B.png.
2. UAL Pro $9.99 (Sit/Carry animasyonu — oturan müşteri gömülme çözümü; satın alma kullanıcıda).
3. Curve Ö1-Ö4 (docs/curve-report.md) + dünya-v2 sonrası zone-2 servis mesafesi/tempo telefon testi.
4. Telefon testi: tek salon hissi, karakterler, mağaza, offline kapa-aç (artık ≤ pad %60 tavanlı).
NOT: `npm run apk` script'i Git-Bash'ten `gradlew.bat`'ı bulamaz — bash'te
`cd android && cmd //c ".\gradlew.bat assembleDebug"` kullan (npm/cmd'den sorunsuz).

## ŞU AN (2026-06-11 GECE-2 🌙 — WP1-WP6 HEPSİ ✅; sırada SABAH PAKETİ: APK + rapor; SAVE v19)
**TÜM iş paketleri UYGULANDI** (detay progress.md): WP1 bug paketi · WP2 dünya v2 (D-024) ·
WP3 Quaternius karakterler (10 CC0 glb + Character.tsx) · WP4 görsel kimlik v2 (canvas parke,
masa şekil evrimi, klasik ocak, TV maç, kirli masa B + A/B screenshot, dekor) · WP5 tek gösterge ·
WP6 kozmetik mağaza (SAVE v18→v19; buyCosmetic; per-zone tema; gerçek-tıklama doğrulandı).
vitest 91/91 · build temiz · smoke 27/27 · Playwright canlı ✓ · konsol 0 hata.
**SABAH PAKETİ DE BİTTİ:** yeni APK (kök, 8.8MB) + GECE-RAPORU-2026-06-11.md yazıldı.
⚠️ Sabah kararları (yukarıdaki blok): kirli masa A/B, UAL Pro $9.99, curve Ö1-Ö4 + z2 tempo,
telefon testi.

## (ÖNCEKİ — 2026-06-11 GÜNDÜZ: FEEDBACK ALINDI + ARAŞTIRMA/PLAN BİTTİ; kod değişmedi, SAVE v18)
Kullanıcı feedback'i işlendi → docs/feedback-2026-06-11.md (A-D feedback, E bug kök nedenleri,
F asset araştırması [öneri: Quaternius Modular Men+Women CC0 + UAL], G dünya-v2/kat planı revizyonu
[duvarsız tek salon = fiilen MERKEZİ SERVİS modeli → D-022 revizyon karar noktası], H iş paketleri
WP1-WP6 + 5 karar sorusu). Offline 7k bug'ı doğrulandı: oran×0.5×min(geçen,1sa), zone-2'de oran
~4₺/sn → 1sa tavanda ~7.2k; tavan süreye var paraya yok.

## (ÖNCEKİ — 2026-06-11 SABAH: 🌙 GECE OTURUMU TAMAMLANDI 7/7 ✅; SAVE v18)
Gece listesi bitti (detay aşağıdaki ✅'lı maddeler + progress.md): (1) ocak-yükseltme para yeme fix'i,
(2) kat master planı (docs/floorplan-master.md), (3) **ZONE-2 ÇALIŞIR** (per-zone ocak+bulaşık D-022,
SAVE v17→v18, quest +7), (4) görsel kimlik (palette.ts + kilim/lambri/tabure/örtü-evrimi/TV/tabela),
(5) curve raporu (docs/curve-report.md — **Ö1-Ö4 SABAH ONAYI BEKLİYOR, uygulanmadı**), (6) çaycı
karakter prototipi, (7) YENİ APK (kök `KoseKiraathanesi-debug.apk`, 5.1MB) + **`GECE-RAPORU-2026-06-10.md`**
(kökte — kullanıcı sabah BUNU okusun). vitest 85/85 · smoke 27/27 · sim 60sn · konsol 0 hata · 6 commit push'lu.
**SABAH KARARLARI:** (a) curve Ö1-Ö4 (önerim Ö1+Ö2), (b) lavabo mekaniği zamanı (önerim zone-3 ile),
(c) görsel kimlik feedback'i (renkler palette.ts'te tek dosya), (d) telefonda zone-2 akışı testi.

## (ÖNCEKİ — 2026-06-10 GECE BAŞI: HUD SIFIRDAN REDESIGN + LEVEL/XP + AYARLAR; SAVE v17)
Kullanıcının "UI oyun gibi değil / ikonlar AI slop" feedback'i üzerine TAM UI redesign UYGULANDI (onaylı akış:
gerçek tycoon HUD referans araştırması → mock → kullanıcı onayı → uygulama → Playwright didik didik):
- **Referans araştırması:** My Perfect Hotel (gerçek HUD ×2 YouTube karesi), MPH-Empire, My Mini Mart, Burger
  Please! App Store görüntüleri indirilip görsel incelendi (kullanıcı: 2D oyunlara BAKMA, MPH-benzeri 3D'lere bak).
  Ortak gramer çıkarıldı: konturlu bold yuvarlak font, 3D-görünümlü ikonlar, K/M kısaltma, yıldız+XP barı,
  alt ekran boş. (Telifli referans görselleri repo'ya KONMADI.)
- **Yerleşim (kullanıcı tarifi, MPH birebir):** SOL-ÜST yıldız rozet (seviye) + yeşil XP barı; altında küçük
  dişli + posta butonu. SAĞ-ÜST chip'siz para+elmas (SVG ikon + Lilita konturlu rakam). SAĞ-ÜST ALTI görev
  kartı: görev FOTOĞRAFI (hedef tipine göre SVG sahne) + ad + yeşil ilerleme barı / maliyet; dokun → kamera odak.
- **İkonlar:** `src/components/ui/icons.tsx` — elle çizilmiş gradyanlı SVG seti (CoinIcon/GemIcon/StarBadge/
  GearIcon/MailIcon/QuestPhoto). Emoji + CSS-circle coin TAMAMEN gitti.
- **Font:** Baloo 2 (metin) + Lilita One (rakam) @fontsource'tan YEREL bundle (main.tsx; CDN yok). 3D zemin
  yazıları (GroundMarker drei Text) `public/assets/fonts/Baloo2.ttf` (OFL, manifestte) — troika CDN default'u
  kalktı, D-018'in "fontu yerele bundle'la" Faz 7 TODO'su KAPANDI.
- **LEVEL/XP sistemi (kullanıcı onayladı; ileride kat L-kapısı + kozmetik mağaza):** `economy.config.xp`
  (eylem-temelli: servis 2 / garson 1 / yıkama 1 / görev 25 / pad 15 / yükseltme 10; eğri 60×1.5^L),
  `xpForLevel`/`levelProgress` helper. xp PERSIST → **SAVE_VERSION 16→17 + migrasyon** (xp eski stats/quest/
  pad/seviyelerden TOHUMLANIR — eski oyuncu L1'e düşmez). Level-up toast "🎉 Seviye N!".
- **Ayarlar modalı:** dişli → Ses/Müzik/Bildirimler toggle'ları (`settings` persist v17, `setSetting` anında
  kaydeder) + Oyunu Sıfırla (confirm) + Tamam. Posta butonu → "Posta kutun boş" modalı (ileride gelen kutusu).
  Eski `.reset-btn`/dişli-menü kalktı. Offline modal yeni krem/altın stile geçti.
- **🐛→✅ Duplicate-key bug (kök neden):** floater'lar coin id'siyle key'liydi; reset sonrası store nextId başa
  dönünce id çakışıp her kare React hatası basıyordu → floater'a bağımsız monoton sayaç (Coins.tsx).
- **Doğrulama:** vitest **77/77** (5 yeni: eğri, eylem-XP, pad-XP+level-up, v17 tohumlama, ayar persist),
  build temiz, sim ilk-alım 60sn DEĞİŞMEDİ, smoke **27/27**, konsol 0 hata; Playwright görsel: 320/390/768
  portrait + 844×390 landscape taşma YOK; ayar toggle persist canlı doğrulandı.
- **Mock artefaktı:** `tools/hud-mock.html` (+backdrop png) — onay sürecinde kullanıldı, referans olarak duruyor.
### HUD v2 ince ayarları (kullanıcı 1. tur feedback'i AYNI OTURUMDA uygulandı, 2026-06-10 gece):
- **🐛 KRİTİK tıklama fix:** dişli/posta/görev karta DOKUNULAMIYORDU — touch-layer (z:5) üst HUD öğelerinin
  üstündeydi (reset-btn dersinin tekrarı). Tüm üst widget'lar z-index:10. DERS: tıklanabilirlik testini
  evaluate .click() ile DEĞİL gerçek hit-testing yapan Playwright click ile doğrula (bu kez öyle doğrulandı).
- **Bütünleşik level ünitesi:** ayrı duran yıldız+bar "çirkin" → TEK ceviz-kahve pill (yıldız kenara gömülü,
  XP barı içinde); para+elmas da AYNI pill ailesinde chip'e girdi (kullanıcının "chip olmalı mı?" tereddütüne
  cevap: tutarlılık) ve level ile AYNI hizada (hizaFarki=0 ölçüldü). Renk: tutarlı ceviz ailesi (kullanıcı
  alternatif renk bulamadı; istenirse bordo accent denenir).
- **Zemin yazıları bold:** GroundMarker drei Text `fontWeight 700` (Baloo2 variable TTF ekseni) — HUD fontuyla uyumlu.
- **Bulaşık onboarding gate:** q_wash görevi gelmeden kirli bardak HİÇ çıkmaz (bardak temize geri döner —
  korunum bozulmaz, demleme kilitlenmez); görev gelince mekanik başlar. WASH_QUEST_INDEX store'da.
- **Doğrulama:** vitest **78/78**, build temiz, smoke 27/27, 320/landscape taşma yok, gerçek-click ayar+posta+görev ✓.
### ✅ ZONE KARARI ONAYLANDI (D-022): per-zone TEMALI ocak+bulaşık; kat başına 4 zone (2×2).
Zemin kat = çay teması (zone 1-2 çay salonu; zone 3-4 FARKLI konsept: tost/TV adayları); okey/tavla ÜST kat + balkon.

### >>> SONRAKİ OTURUM = 🌙 GECE OTURUMU (kullanıcı UYUYOR — "devam" deyince DURMADAN çalış) <<<
KULLANICI TALİMATI (2026-06-10 gece): "sabaha kadar kesintisiz çalış; kaliteli iş yapabildiğin sürece yap,
context'i hesaba katarak sağlıklı iş yapabildiğin son ana kadar git; sabah kalktığımda telefonumda güzel bir
oyun oynayayım. Çizgi güzel — tasarım/mantık/görev yoğunluğunda küçük değişiklikler olabilir sadece."
**GECE GÖREV LİSTESİ (kullanıcı ONAYLI, sırayla; her milestone: test+screenshot+memory-bank+commit+PUSH):**
1. ✅ **Ocak-yükseltme para yeme fix'i (BİTTİ 2026-06-10 gece):** KÖK = daire kesişimi (tezgâh önü oyuncu
   pozisyonu upgradeZone PAD_RADIUS'u içindeydi; eski yorum merkez-merkez 1.8'e bakıyordu). Fix: upgradeZone
   [-1.6,-1.7]'ye (merkez mesafe 3.1 ≥ 1.6+1.3) + pickup-yarıçapı guard'ı + 2 vitest (geometri değişmezi +
   davranış). Vitest 80/80, smoke 27/27, sim 60sn, Playwright canlı ✓ (para sabit kaldı, çay alındı; yeni
   noktada dolum çalışıyor). Screenshot: night-1-upgradezone-fix.png (kök, git-ignored).
2. ✅ **Kıraathane araştırması → KAT MASTER PLANI (BİTTİ):** web araştırması (Yahya Kaptan bölümlü kahvehane
   örneği, Ticaret Bakanlığı kıraathanecilik kılavuzu, tipoloji) → **`docs/floorplan-master.md`**: zemin kat
   ASCII planı (zone1-2 önde çay salonları, zone3 tost / zone4 TV-köşesi arka sırada, DEPO sol-arka +
   TUVALET sağ-arka köşe odaları rezerve, merdiven ön-sağ, sokak bahçe masaları); üst kat okey/tavla+balkon
   notu; gerçek-kıraathane → oyun karşılığı tablosu. Lavabo mekaniği sabaha (zone-3 önerisi).
3. ✅ **Zone-2 ÇALIŞIR (BİTTİ; SAVE v17→v18):** per-zone ocak+bulaşık (D-022); LAYOUT zone-şablonu (+X offset 12);
   global bitişik masa indeksleri (0-3 z1 / 4-7 z2); bölme duvarı + HEP açık geçit (z=-0.75) + kilitliyken karanlık
   örtü; zone2 pad'i geçitte ₺1200 (sabah curve onayıyla kalibre edilecek); per-zone personel + müşteri kendi
   kapısından; cleanCups GLOBAL depo; quest hattı +7 görev. vitest 85/85, smoke 27/27, sim 60sn, Playwright canlı ✓
   (geçit input'la geçilir, duvar bloklar, 2. ocak demler, z2 müşterisi oturur). Detay: progress.md + docs/zone2-design.md.
4. ✅ **Türk kıraathane GÖRSEL KİMLİĞİ (BİTTİ):** YENİ `src/config/palette.ts` (TEK renk kaynağı — varyant
   denemek = tek dosya) + `docs/visual-identity.md` (evrim tablosu). Uygulanan: ahşap parke zemin + zone-başına
   kırmızı KİLİM (bordürlü; ilk deneme 8.6×6.2 "bilardo masası" gibiydi → 6.6×4.6 küçültüldü); duvarlar krem +
   koyu ahşap LAMBRİ kuşağı (WallPiece helper — bölme dahil); masa redesign: yuvarlak tabla + merkez ayak + İKİ
   MİNDERLİ TABURE (koltuk kutusu emekli; seat collision AYNI, 2. tabure salt görsel); **masa örtüsü = seviye
   evrimi** (L1 çıplak → çuha yeşili → bordo → lacivert → altın; tableclothByLevel) — Playwright'ta L3 lacivert
   doğrulandı; TV köşesi (zone-1 arka duvar, ışıldayan ekran); sokak: kapı üstü TABELA şeridi (eğimli tente
   kamera +z'den bakınca ekranı kapatıyordu → dikey şerit), kapı önü bahçe masaları+tabureler+saksılar.
   **vitest 85/85, build temiz, smoke 27/27, konsol 0 hata.** Screenshots: night-4-visual-v3.png, night-4-table-evolution.png.
5. ✅ **Curve raporu (BİTTİ — SABAH ONAYI BEKLİYOR, uygulanmadı):** `docs/curve-report.md` — sim zone'lu
   bottleneck modeline genişletildi (per-zone arz/talep + 3-profil verim 0.80/0.55/0.35; idealize ilk-alım
   60sn SABİT). Bulgular: zone-1 ömrü hedefin altında (Normal ~25dk; hedef ~1sa), zone-2 kapısı 39dk, zone-2
   içi 25dk (düz). **ÖNERİLER (onay bekliyor): Ö1 zone2 1200→2000; Ö2 z2 zinciri ×1.3; Ö3 q_z2serve 5→10;
   Ö4 (alt.) zone2'ye minLifetime 6000.** Offline Faz-4 notu: zone-2 sonu oran ~11₺/sn → offline tek giriş ~20k.
6. ✅ **Karakter prototipi (BİTTİ):** Player altın kapsül → PARÇALI çaycı gövdesi (`OwnerBody`, Player.tsx;
   her uzuv ayrı mesh = Faz 6 animasyon hazırlığı): kasket+vizör, ten baş+bıyık, krem gömlek, bordo önlük,
   koyu pantolon, iki kol; renkler palette.ts'te. Screenshot: night-6-character.png. vitest 85/85, smoke 27/27.
7. **SABAH PAKETİ:** en sonda `npm run apk` ile YENİ APK + screenshot'lı gece raporu (kullanıcı telefonda test edecek).
İLKELER: çizgiyi koru; görsel beğeni işlerinde varyant bırak, geri dönüşü zor şey yapma; mağazaya dokunma;
context tükenmeden düzenli commit+push + memory-bank güncelle (sonraki pencere kaldığı yerden alır).

## (ÖNCEKİ — 2026-06-10 GÜNDÜZ: FABLE 5 BRIEF ADIM 1+2 UYGULANDI: quest sistemi + UI game-feel; D-021)
Fable brief'in onaylı 4-adımlı planından **Adım 1 (quest/görev sistemi + kamera) ve Adım 2 (reveal arka-plan şartları)
TAMAM**; HUD game-feel revizyonu da (kullanıcı isteğiyle) Adım 1'e dahil edildi. Tam karar: **decisions.md D-021.**
- **Quest hattı:** `quests[]` 13 sıralı görev; üst-orta görev barı (dokun → kamera hedefe pan/zoom, joystick iptal eder);
  görev geçişi + reveal + ilk açılışta otomatik kamera panı. Ekranda TEK pad (`visiblePads`). Personel ZORUNLU omurga
  (D-014 geçersiz). Garson-hız işareti garson 20 çay taşımadan görünmez (`minWaiterServed`, stats sayaçları persist).
- **HUD:** sadece para (altın coin ikonu — ₺ display'den tamamen kalktı) + 💎 chip; offline = modal kart [Tamam];
  sıfırla dişli menüsünde; coach + next-step silindi. GroundMarker fiyatları coin puluyla.
- **SAVE 15→16** + questIndex/stats tohumlamalı migrasyon (eski oyuncu başa düşmez; garson tutulmamışsa hat q_waiter'da durur).
- **Doğrulama:** vitest 72/72, build temiz, sim ilk-alım 60sn, smoke 27/27, Playwright görsel ✓ (görev barı/kamera/modal).
  Dev kancaları: `__setQuest(id)`, `__grantStat(k,v)`. Kullanıcı oturum sırasında canlı önizlemede bizzat oynamaya başladı.
### >>> SONRAKİ OTURUM ANA GÖREVİ — KULLANICI FEEDBACK'İ (2026-06-10, oturum kapanışında verildi) <<<
Kullanıcı quest sistemini gördü ama **UI'dan memnun DEĞİL** ("üstteki chip'ler, ekran dağılımı, görev barı —
hiçbir şey istediğim gibi değil; hâlâ oyun gibi değil"). İstekler:
1. **UI'ı SIFIRDAN tasarla — GERÇEK tycoon oyunlarının arayüz fotoğraflarını inceleyerek.** Birden fazla oyunun
   (My Perfect Hotel, Idle Miner, vb.) HUD ekran görüntülerini araştır/incele; chip yerleşimi, görev barı, ekran
   dağılımını onlara bakarak yeniden kur. (Web araştırması + görsel referans analizi gerekir.)
2. **İkonlar "aşırı AI slop"** — düzgün asset istiyor: "gerekirse Claude ile asset üret veya farklı bir yapay zeka
   kullan, ama çöz." → SVG/sprite ikon seti üret (para, elmas, görev, ayarlar...), CSS-circle coin gibi geçici
   çözümler yerine gerçek ikonografi. (Kenney CC0 UI pack de değerlendirilebilir — asset stil kilidiyle uyumlu.)
3. **Font düzenlemesi:** system-ui yerine oyun hissi veren font (yuvarlak/bold, TR karakter destekli; bundle'a
   yerel olarak eklenmeli — D-018 font-CDN dersi: networkidle bozulmasın).
4. **Zone sorusu:** "zone mantığını ŞU AN getirmek ne kadar mantıklı, öyle de mi test etsek?" → Kullanıcı zone-2'yi
   erken getirip denemeye açık. Adım 3 (curve) ile Adım 4 (zone) sıralaması sonraki oturumda kullanıcıyla netleşsin.
5. **Zone mimarisi HÂLÂ AÇIK:** per-zone ocak+bulaşık mı, yoksa ANA SERVİS NOKTASI (merkezi ocak+bulaşık) + zone-başı
   garson/bulaşıkçı mı? D-021'deki per-zone önerim ONAYLANMADI — kullanıcı iki seçeneği tekrar sordu. Sonraki oturumda
   iki modeli artı/eksi tablosuyla (taşıma mesafesi, darboğaz, ekran karmaşası, balance grind) kısaca karşılaştırıp
   NET öneri + onay al; istenirse prototip karşılaştırması.
Sıra önerisi: (1) UI redesign (referans araştırması → mock → onay → uygula) → (2) zone modeli kararı + zone-2
prototipi → (3) curve hesabı (Adım 3) zone yapısına göre.

### (genel sıradaki — değişmedi)
- Adım 3: simulate.ts 3-profil curve hesabı · Adım 4: Faz 3a zone-2 · Faz 4+: prestige/elmas/mağaza.

## >>> (TAMAMLANDI 2026-06-10) ÖNCEKİ ANA GÖREV: FABLE 5 BRIEF (2026-06-09) <<<
Kullanıcı büyük tasarım/denge geri bildirimi verdi → tek brief'e döküldü: **`docs/fable5-progression-redesign-brief.md`**.
Sonraki sohbette kullanıcı `/model` ile **Claude Fable 5**'e (9 Haz 2026 çıktı, Mythos-sınıfı) geçip o brief'i çalıştıracak;
Fable kendi yapar veya alt-agent'lara dağıtır. Kapsam (8 başlık): (1) **görev/quest tabanlı progression, ekranda TEK pad**;
(2) **4-zone mimarisi** — per-zone servis mi tek servis mi (KARAR araştırmayla) + üst kata çıkış; (3) **aktif↔idle dengesi**
(My Hotel: yavaş temizlikçi → flip yok); (4) **onboarding (hareketli) + UI/menü + üst chip + para birimi ₺→jenerik money ikonu**;
(5) **karakter + görsel-evrim** (seviyeyle değişen Türk/kıraathane estetiği); (6) **kozmetik mağaza** (parke/duvar kağıdı);
(7) **tam denge geçişi** (çay fiyatı, garson/bulaşıkçı hız+zaman, her yükseltme neyi ne kadar etkiler). **Yöntem:**
araştır→öner→kullanıcı onayı→uygula (kod yazmadan önce sor). Bu oturumda kod YAZILMADI, sadece brief hazırlandı.
**NOT:** onboarding "hareketli olmalı" feedback'i + telefon test feedback'i hâlâ beklemede (aşağıdaki blok) — Fable önce bunu sorsun.

## Şu an neredeyiz (2026-06-09 — EKONOMİ TEMPO + OFFLINE + KAMERA AYARI → kullanıcı telefonda test edecek)
Kullanıcı telefon feedback'i: (1) başta AŞIRI yavaş; (2) 1 gece sonra ~18k birikip ilk zone tek seferde bitti (offline
kısıtsız hissi); (3) garson+bulaşıkçı açılınca her şey çok hızlı/ucuz; (4) kamera çok yakın. 2 agent (idle-tycoon tempo
araştırması + kod tarama) + bizzat Playwright/devHooks taraması yapıldı. **KÖK:** tek darboğaz = MANUEL SERVİS (yardımcılar
açılınca açık/kapalı gibi flip); offline = idealize aktif oranın %100'ü × 2h cap = gelişmiş dükkânda ~18k (ölçümle teyit:
120sn pasif=0 gelir; offline matematiği 2.56₺/sn×7200=18.4k).
**UYGULANAN (kullanıcı onayıyla, SAVE_VERSION 15 DEĞİŞMEDİ — hepsi config/kod, şema değişmedi):**
- **Offline sert kısıldı:** YENİ `offline.rateMult 0.5` + `baseCapHours 2→1` (store.ts init çarpanı uygular) → built shop
  18.4k→**~4.6k** (4× az), orta dükkân ~1.7k. Hedef: "birkaç yükseltme parası, oyuncu nefes alsın; zone'u tek seferde bitirmesin."
- **Eğri garson noktasında ayarlandı:** garson ÖNCESİ ucuz (table2 35→25 & minLifetime 30→20; çay yük. tabanı 25→20) →
  **ilk alım 84sn→60sn**; SONRASI ölçülü pahalı (table3 120→130, table4 300→420, bulaşıkçı 280→330, masa yük. growth
  1.6→1.8 = L1-4 **60/108/194/349**, garson L2 hız 2.6→2.3 & maliyet 200→250). "Abartma, akış sürsün, zone ~1sa+ aktif oyunda bitsin."
- **Kamera uzaklaştırıldı:** Scene.tsx CameraRig d 6→7, portrait clamp 1.3→1.4.
- **🐛→✅ DEADLOCK FIX + PAYLAŞIMLI TEPSİ (kullanıcı bug raporu 2026-06-09):** Eski "eli boşken / tek renk tepsi"
  kısıtı (Faz 2f) deadlock yapıyordu: elinde çay + TÜM masalar kirli → bırakacak bekleyen masa yok (kirli masada
  müşteri oturmaz) + çay elindeyken kirli toplanamaz (`tray===0` şartı) → ne bırakır ne temizler = sonsuz kilit.
  Kullanıcı "neden hep böyle olmasın" dedi → **PAYLAŞIMLI kapasiteli karışık tepsi:** `serving.trayCapacity 2→4`,
  çay + kirli AYNI tepsiyi paylaşır (toplam ≤ trayCap); iki gate (`carriedDirty===0` / `tray===0`) KALDIRILDI →
  yapısal kilit-geçirmez + solo angarya azalır. store.ts servis+toplama blokları `tray+carriedDirty<trayCap`;
  Player.tsx tek CupTray çay(kırmızı)+kirli(gri) ardışık dizer (üst üste binmez). Yeni vitest "DEADLOCK YOK" testi.
  SAVE değişmedi (trayCap transient/config). vitest 70/70, build temiz, smoke 22/22 (tray 3/4, kirli 4 toplandı).
- **✅ ONBOARDING (Faz 2i) + SIFIRLAMA BUTONU (kullanıcı isteği 2026-06-09):** İlk-oyun koç ipucu `onboardingHint(g)` saf helper —
  2. masa açılana kadar çekirdek döngüyü ADIM ADIM öğretir (ocağa git→çayı al → müşteriye götür → parayı topla → "2. Masa"
  işaretinde bekle), açılınca null. KALICI durum YOK, oyun durumundan türetilir (SAVE değişmedi); mevcut kayıtta table2 zaten
  açıksa hiç görünmez; **sıfırlayınca tekrar belirir.** HUD `.coach` yeşil bant (sade, havada kart yok); onboarding aktifken
  `.next-step` gizlenir; `store.onboardHint` transient (init+tick). **Sıfırlama butonu** `.reset-btn` sol-altta (window.confirm
  onaylı → hardReset=clearSave+init) cihazda test için. devHooks `onboardHint`. Yeni vitest (5 adım). **vitest 71/71, build temiz,
  smoke 22/22, Playwright gözle doğrulandı (onboarding-reset.png).** Faz 2'de açık tek kalem (onboarding) BİTTİ.
- **🐛→✅ Sıfırla butonu dokunuş çakışması (kullanıcı 2026-06-09):** drag-anywhere `.touch-layer` (z:5) butonla aynı z-index'te
  olduğu için DOM sırasıyla üstte kalıp dokunuşu çalıyordu (joystick tetikleniyor, buton tıklanmıyordu). Fix: `.reset-btn`
  z-index 5→**10** (touch-layer 5 + joystick 6 üstünde). Playwright doğruladı: butonun merkezinde en üst eleman reset-btn,
  butona pointerdown joystick'i TETİKLEMİYOR. CSS-only (test/şema etkilenmez).
**Doğrulama:** sim ilk-alım **60sn** / 10k @35.7dk (idealize → gerçek solo ~1-1.5sa); **vitest 71/71**, build temiz, **smoke 22/22**,
konsol temiz. Önizleme: http://localhost:5201/.
### >>> SONRAKİ OTURUM — KULLANICI FEEDBACK BEKLENİYOR (2026-06-09) <<<
Kullanıcı telefonda kısa test etti, APK push'landı (commit 902cac9). Erken geri bildirim: **"onboarding HAREKETLİ olmalı"**
→ şu anki onboarding sade STATİK koç metin bandı (`.coach`); kullanıcı bunun yerine **hareketli/dinamik** bir onboarding
istiyor (muhtemelen: hedefe doğru animasyonlu işaretçi/ok, yanıp sönen/zıplayan ipucu, ya da kameranın ilgili objeye yönelmesi —
SONRAKİ oturumda kullanıcıya tam ne hayal ettiğini SOR: ok/parıltı mı, animasyonlu el/işaretçi mi, zoom mu). Etkileşim modeli
korunur (havada kart YOK, hareket-temelli). Kullanıcı: "bir sonraki chatte feedback vereceğim, ben test edip döneceğim" →
SONRAKİ oturumda özet verdikten sonra **başka iş yapmadan kullanıcının test feedback'ini bekle/iste**, sonra onboarding'i
hareketlendir + gelen bulguları uygula.
**SIRADAKİ (feedback sonrası):** onboarding'i hareketli yap; ekonomi/akış ince ayarı; sorun yoksa Faz 3a. **İkinci ilerleme
ekseni** (nakit-dışı zone gate) + **tost/yemek (tost makinesi)** Faz 3a/3d'ye ertelendi (bkz. D-020).

## (önceki) MOBİL CİLA + ANDROID APK (kullanıcı cihazda test etti)
Kullanıcı önizleme sonrası mobil istekleri verdi; hepsi yapıldı + Android APK derlendi (arkadaşına da gönderecek).
**Mobil cila (5):** (1) **drag-anywhere joystick** — ekranın her yerine basıp sürükle, joystick parmağın yerinde belirir
(`touch-layer` tüm ekran + floating `.joystick`); (2) **alttaki WASD/ipucu yazısı KALDIRILDI** (`.hint` silindi); (3) **kamera
BAYA yakın** (CameraRig d 9→6, portrait geri-çekme 1.7→1.3); (4) **üst chip'ler responsive** (`.hud-top` flex-wrap + küçült +
portrait media query); (5) **sokak/kapı z-fighting** giderildi (sokak düzlemleri y-ayrımı + polygonOffset; kapı çerçevesi
duvarın tamamen önüne, kesişme yok). Playwright ile portrait + drag-anywhere görsel doğrulandı.
**ANDROID APK (Capacitor 8.4, Faz 7 öne çekildi):** `npx cap add android` → debug APK derlendi →
**`KoseKiraathanesi-debug.apk` (~4.6 MB)** proje kökünde (git-ignored). Ortam: SDK `C:\flutter\bin`, build JDK = Android Studio
JBR 21 (`gradle.properties org.gradle.java.home`; sistem JDK 23 AGP'yi kırıyor). Yeniden derleme: `npm run apk`. Telefon
tarayıcısı testi: `npm run dev:host` → LAN URL. Detay: architecture.md "Android APK derleme".
**Doğrulama:** vitest 69/69, web build temiz, sim 84sn, smoke 22/22, APK BUILD SUCCESSFUL (JAVA_HOME'suz da çalışıyor).

### >>> SONRAKİ OTURUM — İLK İŞ: KULLANICIDAN FEEDBACK İSTE <<<
Kullanıcı APK'yı **telefonda test etti (2026-06-08)** ve dedi ki: "bir sonraki oturumda bana feedback sor, orada gördüklerimi
yazacağım, ona göre hareket edeceğiz." → **Bu oturum commit+push ile kaydedildi.** SONRAKİ oturumda (`/kiraathane-devam`),
özet verdikten SONRA başka iş yapmadan **kullanıcıya telefonda ne gördüğünü/neyi beğenmediğini SOR** (drag-anywhere kontrol,
kamera yakınlığı, z-fighting/titreme, chip'ler, genel his, Faz 2 akışı). Aldığın bulgulara göre düzelt/ayarla; bulgu yoksa Faz 3a
(zone çoğaltma) önerisini getir. Feedback almadan yeni özelliğe/refactor'a girme.

## (önceki) FAZ 2 TEK-ZONE TAMAM
**Bu oturumda kalan tek-zone işleri bitti (3 parça):**
1. **D-018 adım 6 — GARSON L2:** garson hızı seviyeli (`waiter.moveSpeedByLevel [1.8, 2.6]`), ₺200 mekânsal yükseltme noktası
   (`LAYOUT.waiterUpgradeSpot [-4.6,0,-0.9]`, tutma pad'inin ARKASINDA → tutar tutmaz akmaz; `WAITER_UP_RADIUS 1.0`). `waiterLevel`
   PERSIST → **SAVE_VERSION 14→15 + v14→v15** (eksikse 0, clamp). `FILL_WAITER` dwell dolum (biriken ₺ korunur). Scene `WaiterUpgradeMarker`
   (altın sade işaret, L2'de kaybolur). Ekonomi DEĞİŞMEZ (sim 84sn sabit).
2. **D-019 madde 4 — YENİ-ÖZELLİK BİLDİRİMİ:** özellik İLK açılınca üst-orta toast (`notice`, HUD `.notice` pop). `revealKeys` helper +
   `revealSeen` baseline init'te kurulur → yeniden-yükleme spam'ı YOK (persist gerekmez). Reveal: çay yükseltme / garson / bulaşıkçı /
   garson hız / masa yükseltme (omurga masa pad'leri HARİÇ — onlar nextStep).
3. **D-017 §6 — KAMERA DAMPING:** CameraRig kare-hızı BAĞIMSIZ damping `1-exp(-8·dt)` konuma VE pürüzsüz lookAt hedefine AYNI katsayı
   (rijit offset → sallanma yok) + dt clamp + fit/d yalnız resize'da + ilk kare anında yerleşir.

**Doğrulama:** Vitest **69/69**, build temiz, sim **84sn SABİT**, smoke **22/22** (garson L1→L2 + reveal upgrade/opt:waiter/waiterUp/
opt:dishwasher/tableUp), konsol temiz, Playwright ekran görüntüsü ile görsel kontrol (4 masa + sade yükseltme işaretleri + toast üretildi).
SAVE_VERSION **15**.

### >>> SIRADAKİ (kullanıcı planı) <<<
Kullanıcı: "tek zonedakileri tamamla → ben uçtan uca test edeyim → bulgularla OPSİYONEL bir ara-faz olabilir → sonra Faz 3 (zone çoğaltma)."
**Bu oturumda Faz 2 tek-zone TAMAMLANDI.** Sonraki adım: **kullanıcı oyunu baştan sona oynayıp test etsin** (gözle onay + his). Bulgular
gelirse önce onları gider (ara-faz), yoksa **Faz 3a (zone çoğaltma / kat-ızgara modeli, D-016)** başlar. Henüz commit/push YAPILMADI
(kullanıcı test etmeden bekletiliyor; "oturumu bitir" denince oturum-bitir protokolü çalışır).

**ÖNİZLEME:** `npm run dev` → http://localhost:5200/ (port değişebilir). Test edilecekler: garson tut → garson hız noktasında (sol kenar,
tutma yerinin arkasında) L2 yap; her yeni özellik açılınca toast çıkıyor mu; yürürken kamera sallanmıyor mu; masa/çay/garson yükseltme akışı.

---
## (önceki) D-019 madde 2-3 (reveal sırası + gating) + L1-başlangıç
**Pad/yükseltme ÇIKIŞ SIRASI sadeleştirildi (kullanıcı: "2. masa açılınca birden 4 yükseltme geldi").** Yeni reveal:
başta sadece 2.Masa → 2.Masa açılınca **çay ocağı yükseltme + 3.Masa** → ocak bir kez yükselince **garson** belirir
→ 3.Masa açılınca **bulaşıkçı** → **4 masa da açılınca masa yükseltme işaretleri** (geç oyun). Böylece 2.masada 4 işaret
patlamaz. Config gating: `table3`'ten `minStationLevel:1` KALKTI (D-019 §2 — masa açmak yükseltme gerektirmez);
`waiter`'a `minStationLevel:1` EKLENDİ (garson reveal); `tables.upgradeRequires` `prev:['table2']`→**`prev:['table4']`**.
**L1-BAŞLANGIÇ (kullanıcı isteği):** çay ocağı + masalar GÖRSEL olarak **L1**'den başlar (iç stationLevel/tableLevels
0-tabanlı KALIR — ekonomi değişmez; sadece `activeZone.label` `seviye+1` gösterir; soft max → "Usta 💎"). **Sim BOTTLENECK
modeli:** `rate = min(talep tables/cycle, arz 1/brewTime) × (fiyat+bahşiş)` → tek ocak gerçek darboğaz; `trySpend` ocak
darboğazsa masadan ÖNCE ocağı yükseltir (akıllı oyuncu). **İlk-alım 84sn SABİT** (1 masada talep<arz → değişmez); ocak L1
@1.9dk emergent, 4.masa @8dk, masa-yük @15.7dk. SAVE_VERSION **13** (değişmedi). **Vitest 60/60, build temiz, sim 84sn,
smoke 20/20, konsol temiz.** Değişen: economy.config.ts (gating), store.ts (L1 etiket ×2), tools/simulate.ts (bottleneck+
akıllı ocak), tests/logic.test.ts (gating testleri yeni sıraya), tools/smoke.mjs (ocak→garson→table3/4→masa-yük sırası).
**ÖNİZLEME (gözle onay):** http://localhost:5199/ — 2.masa açınca artık 4 işaret patlıyor mu, ocak/masa L1'den mi başlıyor kontrol et.

### D-018 adım 5 — SEMAVER = OCAK ÜST YÜKSELTMESİ (samovar ayrı pad KALDIRILDI) — gözle onay bekliyor
Kullanıcı: "semavere geç pad'i kalkacaktı, ne zaman?" → ayrı `samovar` omurga pad'i (₺850, serviceSpeed ×0.7) **KALDIRILDI**.
Semaver artık çay ocağının üst yükseltmesidir (TeaStation seviyeyle büyüyen semaveri zaten çiziyor); omurga zinciri **table4'te
biter**. `derivedFromPads`'ten `serviceSpeed` case'i silindi (serviceSpeedMult hep 1; Faz 3a addStation için alan duruyor).
**EKONOMİ (sim bottleneck ile doğrulandı):** tek ocak ₺ L4 (throughput ×3.32) 4 masaya YETİŞİR → arz 0.553 > talep 0.512;
ilk-alım **84sn SABİT**, ocak L4 @8.7dk, masa-yük @10.2dk, lifetime 10k @35dk (samovar tasarrufu kalkınca biraz hızlandı).
"Usta" master tier (💎/video) Faz 4'e kaldı. **SAVE_VERSION 13→14 + v13→v14 migrasyon** (samovar padsDone+padFills'ten düşer,
ilerleme korunur). **Vitest 61/61, build temiz, sim 84sn, smoke 20/20, konsol temiz.** Değişen: economy.config.ts (samovar pad
+ serviceSpeed case sil, SAVE_VERSION 14), save.ts (v13→v14), store.ts (LAYOUT.padPos.samovar sil), simulate.ts (milestone),
tests/logic.test.ts (samovar referansları + v13→v14 testi).
**SIRADAKİ:** D-018 adım 6 (garson L2: 1.4→1.8, yan-kenar yükseltme kartı, persist waiterLevel) + D-019 madde 4 (yeni-özellik
bildirimi: özellik açılınca kamera zoom/pinboard) + D-017 §6 kamera damping.

### >>> KULLANICI PLANI (2026-06-07, oturum sonu) <<<
Kullanıcı kararı: **"tek zone'da olan HER ŞEYİ hallet → sonra ben baştan sona test edeyim → ardından zone yükseltme (Faz 3a)
kısmına geçeriz."** Yani Faz 2'nin tek-zone cilası TAM bitmeli (kalan: D-018 adım 6 + D-019 madde 4 + D-017 §6 kamera),
sonra kullanıcı tek zone'u uçtan uca oynayıp onaylayacak, SONRA Faz 3a (zone çoğaltma) başlayacak. **Bu oturum BURADA kaydedildi.**
Sonraki oturum: kalan tek-zone işleriyle başla (adım 6 garson L2 önce önerilir — küçük, izole, persist waiterLevel + SAVE bump).

### (önceki) D-019 madde 1 — KİRLİ MASA mekaniği (BİTTİ, gözle onaylandı)
**D-019 madde 1 (KİRLİ MASA) BİTTİ.** Her kirli bardak bırakıldığı masaya etiketlenir (`Dish.tableIndex`); bir
masada `cups.dirtyThreshold` (2)'den FAZLA = **3+ kirli → masa KİRLİ**: (a) masa üstünde alçak primitive yeşilimsi
"koku" bulutu (StinkCloud, Dishes.tsx; hafif bob), (b) **garson o masaya çay GÖTÜRMEZ** (`waitingNpcs` kirli masayı
filtreler), (c) **YENİ MÜŞTERİ OTURMAZ** (`findFreeTable(npcs, tables, dirty)` kirli masayı boş saymaz). Oyuncu
≤2'ye indirince masa normale döner. `dirtyTables(dishes)` helper export; devHooks `dirtyTables`+`dishesByTable`.
SAVE_VERSION **13** (DEĞİŞMEDİ — dishes transient, persist alan yok). **Vitest 60/60 (3 yeni: eşik/oturmaz/garson-götürmez),
build temiz, sim 84sn (1.4dk; ekonomi etkilenmez), smoke 19/19, konsol temiz.** Değişen: types.ts (Dish.tableIndex),
economy.config.ts (cups.dirtyThreshold), store.ts (dirtyTables/findFreeTable/spawn/garson/dish-push+export), Dishes.tsx
(StinkCloud), devHooks.ts, tests/logic.test.ts.
**ÖNİZLEME (gözle onay):** http://localhost:5199/ — kirli masada koku bulutu + müşteri o masaya oturmuyor mu kontrol et.
(Test: bir masaya servis et, parayı/kirliyi toplama, 3 müşteri çevriminden sonra masa kirlenmeli.)

### (önceki) D-018 adım 1+2+3 (BİTTİ)
**D-018 DEVAM. Adım 1 (bug-fix) + 2 (tray kaldır) BİTTİ. Adım 3: KART TASARIMI KULLANICI TARAFINDAN REDDEDİLDİ →
SADE işaretlere geri alındı; DWELL süre-sayma yerine HAREKET-TEMELLİ yapıldı. Kenar-yerleşim KORUNDU.**
SAVE_VERSION **13**. **Vitest 57/57, build temiz, sim 84sn (1.4dk), smoke 19/19, konsol temiz.**

### D-018 adım 3 — kullanıcı feedback'i (2026-06-07): "kart çok kötü oldu, eski haline çevir; dwell süre saymasın"
- **(1) GroundMarker GERİ ALINDI:** kesik-köşeli billboard kart → **eski SADE düz zemin işareti** (D-017 §2 stili:
  şeffaf beyaz çember + ince kategori halkası + DÜZ zemin yazısı + ₺ + dolum yayı). Kart denemesi terk.
  **DERS:** kullanıcı havada/dik kart sevmiyor → mekânsal sade zemin işareti tercih (feedback_*).
- **(2) KENAR-YERLEŞİM KORUNDU:** `tables[i].upgradeSpot` sol kolon **−3.7** / sağ kolon **+3.7** (orta koridor boş);
  personel pad'leri masa satırları ARASINA **z=1.5** (waiter/dishwasher [∓4.6,0,1.5]) → −3.7 spot ile çakışma yok.
  (Kullanıcı placement'i ayrıca eleştirmedi; istenirse merkeze geri alınabilir.)
- **(3) DWELL → HAREKET-TEMELLİ (süre YOK):** Kullanıcı "önce 1.5sn sayıyor sonra başlıyor — HAYIR; üstünden geçerken
  almasın ama durduğu anda HEMEN başlasın, bekleme süresi de dolmasın." → süre sayacı (`dwellId`/`dwellTime`/`dwellDelay`)
  KALDIRILDI. Yeni: `fillReady = hypot(input) <= 0.1` (oyuncu DURUYOR mu). Para yalnız oyuncu durunca akar → geçerken
  (hareket) hiç alınmaz, input bırakınca HEMEN başlar, countdown görseli yok. `onFillId` (pad.id/FILL_TEA/FILL_TABLE+i)
  tek aktif nokta seçer; üç dolum bloğu `fillReady && wallet>0` ile akar. Çay-fill leave'de SIFIRLANMIYOR (biriken korunur).
  3 vitest: geçerken(hareket) akmaz + durunca hemen akar + biriken korunur.
- Değişen: economy.config.ts (interaction bloğu kaldırıldı), store.ts (fillReady hareket gate, dwell state çıkarıldı,
  LAYOUT spot/pad korundu), GroundMarker.tsx (sade haline döndü), Pad.tsx + Scene.tsx (dwell prop çıkarıldı),
  tests/logic.test.ts (hareket-temelli 3 test). FILL_TEA/FILL_TABLE store-içi export (onFillId için).

### >>> SIRADAKİ İŞ: D-019 madde 2-4 + kalan D-018 <<<
Kullanıcı feedback 2026-06-07 (tam metin decisions.md **D-019**). Ana kaygı: "her şey çok yer kaplıyor" → sade ekran.
1. ✅ **KİRLİ MASA mekaniği — UYGULANDI (gözle onay bekliyor; yukarı bak).**
2. **(SIRADAKİ) Çay ocağı yükseltme noktasını ÇAY-ALMA'dan AYIR + SOL DUVAR ile ocak arasına koy** (çay alırken zorla tetiklenmesin;
   ocaktan >2.9 br). **`table3`'ten `minStationLevel:1` KALK** (masa açmak yükseltme gerektirmesin).
3. **Yükseltme gating (sade ekran):** ÖNERİ → çay ocağı yükseltme 2. masadan sonra; MASA yükseltmeleri table4 sonra. (Kesinleştir,
   simülasyonla denge, ilk-alım 84sn sabit.)
4. **Personel pad'leri SAĞ-ARKA köşe** (garson+bulaşıkçı tutma; ör. [4.6,−1.5] / [4.6,−3.2]).
5. **YENİ-ÖZELLİK BİLDİRİMİ:** özellik açılınca kamera zoom / "pinboard" bildirim (garson tutma vb.) — D-018 §4 reveal/onboarding ile.
Ayrıca kalan D-018: adım 5 (semaver=ocak L4 + ekonomi denge), adım 6 (garson L2), §6 kamera damping.

### (eski plan) D-018 adım 4 — SIRALI REVEAL zinciri (D-019 §5 ile birleşti)
"Al-pad → (inşa) → o nesnenin yükseltmeleri" zinciri; hepsi birden dökülmez; yakınlık-gizleme YOK. padsDone'dan
türetilir, ek persist yok. Sonra adım 5 (semaver=ocak L4 + ekonomi denge) + adım 6 (garson L2). Detay: decisions.md D-018 §4/§5/§6.

### (önceki) D-018 adım 1+2

### D-018 adım 1 — BUG-FIX (BİTTİ, gözle ✓)
- **(b) table2 açılınca KARARMA fix (KÖK):** drei `<Text>` (GroundMarker) troika fontunu ilk mount'ta yükler ve
  SUSPEND eder; Suspense sınırı yoktu → tüm sahne kararıyordu. ÇÖZÜM: Scene.tsx'te DÜNYA (Ground/Walls/Tables/Player/
  mutfak) Suspense DIŞINDA; SADECE Text içeren marker'lar (`Pad`/`UpgradeZone`/`TableUpgradeMarkers`) ayrı
  `<Suspense fallback={null}>` içinde → font yüklenirken yalnız küçük işaret yazısı bekler, dünya HİÇ kararmaz.
  NOT: troika modern sürümü `font` belirtilmezse unicode-font-resolver'dan **CDN (jsdelivr)** font verisi çeker.
  İlk denenen module-scope `preloadFont` boot'ta bu CDN fetch'i tetikleyip smoke `networkidle`'ı bozdu (+ offline
  Faz 7 riski) → KALDIRILDI; font artık lazy (ilk marker'da) yüklenir, nested-Suspense kararmayı zaten önler.
  **Faz 7 TODO: fontu YERELE bundle'la (offline + CDN bağımsız).**
- **(a) kapı z-fighting fix:** lento + 2 yan direk ön duvarla eş-düzlemdeydi (z=z1) → `z1+0.06` offset + derinlik t.

### D-018 adım 2 — TRAY YÜKSELTME KALDIRILDI (BİTTİ, gözle ✓)
- Tepsi SABİT 2 (`C.serving.trayCapacity`). Silinen: economy.config `trayUpgrade`+`trayUpgradeRequires`+helper'lar
  (`trayCapacityForLevel`/`trayUpgradeCost`); store `trayLevel`/`trayUpgradeFill` state + tick yükseltme bloğu +
  `trayMaxLevel`/`trayNextCost`/`trayUpgradeZoneUnlocked`/`LAYOUT.trayUpgradeZone`; Scene `TrayUpgradeZone`; devHooks
  `trayLevel`/`trayUpgradeZonePos`; HUD trayLevel. `trayCapacity()` artık no-arg sabit döner.
- **SAVE_VERSION 12→13 + v12→v13 migrasyon** (trayLevel persist alanı DÜŞER; v9/v10 adımları artık sadece sürüm
  ilerletir). Eski v9/v10 tray clamp testleri → tek "v12→v13 trayLevel düşer" testine indirgendi.
- Değişen: economy.config.ts, store.ts, save.ts, Scene.tsx, devHooks.ts, HUD.tsx, tests/logic.test.ts, tools/smoke.mjs.

### >>> SIRADAKİ: D-018 adım 3 — KESİK-KÖŞELİ KART + KENAR-YERLEŞİM + DWELL <<<
GroundMarker çember→dashed/kesik-köşeli yuvarlatılmış kare kart (eylem/lvl/₺ + dolum çubuğu + yeşil/gri, yazı kart
hizasında küçük DİK-OKUNUR). Masa yükseltme işaretleri MERKEZDEN KENARA (sol masa→sol x≈−3.7, sağ→sağ x≈+3.7; orta
omurga boş). DWELL ~1.5sn (noktaya girince halka hemen, para sonra akar; çıkınca sıfırlanır, biriken korunur →
"üstünden geçince param gidiyor" çözülür). Detay: decisions.md D-018 §1/§2/§3.

### (eski) D-017 adım 1+2 (önceki sohbet, SAVE 12 — GÖZLE ONAYLANDI)

### Bu turda yapılanlar (kullanıcı feedback 2026-06-07: "masa içinde hapsoldum + padler çirkin/her yerde + duvar/kapı/sokak istiyorum")
- 🐛→✅ **Masa açınca hapsolma (KRİTİK):** Masa pad'i oyuncunun DURDUĞU yerde belirince oyuncu masanın içinde kalıp hareket
  edemiyordu. KÖK NEDEN: mobilya collision'ında (store.ts) "zaten içindeyse çıkışa izin" guard'ı YOKtu (aktör collision'ında
  vardı). Düzeltme: `stuckInFurn = hitsSolid(oldX,oldZ,furn,pr)` → içindeyken eksen blokları atlanır (çıkışa izin; "zorlasan da
  GİRİŞ engellenir" korunur) + masa pad'i tamamlanınca oyuncu yeni masanın footprint'i DIŞINA itilir (anında temiz konum). Yeni
  vitest (masa merkezine koy → input ver → footprint dışına çıkar). Gözle doğrulandı (table3 açıldı, oyuncu z 3.0→3.95'e itildi).
- ✅ **Adım 2 — SADE ZEMİN İŞARETLERİ (D-017 §2):** Havadaki Html rozetler + iri disk/koni KALDIRILDI. Yeni `GroundMarker.tsx`
  (drei `<Text>`): yerde UFAK şeffaf beyazımsı çember + ortasında DÜZ zemin yazısı (ne yapacağı: "2. Masa"/"Garson Tut"/"Çay
  Yükselt"/"Masa") + ₺maliyet alt satır; ince kategori halkası (yeşil=aç/mavi=opsiyonel/altın=yükseltme); parası yetince parlar
  (afford) + dolum yayı (progress). Uygulandı: Pad.tsx, Scene UpgradeZone/TrayUpgradeZone/TableUpgradeMarkers. DishStation "🧼
  Bulaşık" + TeaStation "Çay Lv" havada etiketleri SİLİNDİ (lavabo/semaver görseli zaten anlatır).
- ✅ **Sıralı reveal (light, D-017 §3 kısmi):** Pad.tsx artık opsiyonel pad'lerin HEPSİNİ değil AYNI ANDA TEK ilk alınabiliri
  gösterir (garson → alınınca bulaşıkçı). Personel pad/home konumları arka köşeden GÖRÜNÜR orta-kenara taşındı (waiter/dishwasher
  pad [∓4.6,0,0.0], home [∓4.6,0,-1.6]) — eski "bulaşıkçı dairesi yarı ekran-dışı" şikayeti çözüldü. TAM onboarding (reveal-on-
  interact + kamera zoom + "Yeni" rozeti + onboardStep persist) HÂLÂ BEKLİYOR (step 3 proper).
- ✅ **DIŞ DÜNYA (kullanıcı isteği — D-017 dışı ek):** Ön duvar + **kapı boşluğu** (x=0, doorHalf 1.3, söve+çerçeve) eklendi
  (Walls front 2 parça). Müşteriler artık `LAYOUT.street [0,_,8.0]` SOKAKTA belirir → kapıya yürür → koltuğa (toTable goingIn);
  çıkarken kapı→sokak→kaybolur (leaving goingOut). Yeni `Street()` (kaldırım + asfalt + yol çizgileri + karşı binalar; salt görsel).
  NOT: kamera mağazaya (-z) baktığı için karşı binalar pratikte görünmüyor (sokak/kaldırım + kapıdan giren müşteri görünür); daha
  fazla "dış dünya" istenirse kamera açısı (step 6) ile birlikte ele alınmalı.
- **Değişen:** store.ts (LAYOUT street/personel konum + bug-fix + NPC kapı akışı + masa-eject), tests/logic.test.ts (escape testi),
  YENİ GroundMarker.tsx + Street, Pad.tsx (sade+reveal), Scene.tsx (zones sade + Walls kapı + Street), TeaStation.tsx (badge sil).
### >>> SIRADAKİ İŞ (SONRAKİ SOHBET): D-018 ONAYLANDI — Faz 2 cila v2 <<<
Kullanıcı ikinci tur feedback + onay (2026-06-07). Tam karar: **decisions.md D-018** (araştırma destekli — My Perfect Hotel modeli).
Özet (uygulama sırası):
1. **BUG-FIX:** (a) kapı z-fighting (lento/çerçeve ön duvarla eş-düzlem → z offset). (b) table2 açılınca KARARMA = App.tsx'te Canvas
   çevresinde `<Suspense>` YOK → drei `<Text>` font SDF suspend edip sahneyi karartıyor → `<Suspense fallback={null}>` + `preloadFont({characters})`.
2. **TRAY YÜKSELTME KALDIR** (gereksiz; tepsi sabit 2). trayUpgrade/TrayUpgradeZone/trayLevel/trayUpgradeFill/helper/test/smoke/devHooks sil.
3. **KESİK-KÖŞELİ ZEMİN KARTI + KENAR-YERLEŞİM + DWELL:** GroundMarker çember→dashed-köşe kare kart (eylem/lvl/₺ + dolum çubuğu +
   yeşil/gri, yazı kart hizasında küçük DİK-OKUNUR). Masa yükseltme işaretleri MERKEZDEN KENARA (sol masa→sol x≈−3.7, sağ→sağ x≈+3.7;
   orta omurga boş). Dwell: noktaya girince halka hemen, para ~1.5sn sonra akar; çıkınca sıfırlanır (biriken korunur). YAKINLIK-GİZLEME YOK.
4. **SIRALI REVEAL zinciri:** al-pad→(inşa)→o nesnenin yükseltmeleri; hepsi birden dökülmez; opsiyonel tek tek (zaten). padsDone'dan türetilir (ek persist yok).
5. **SEMAVER = OCAK L4 (premium 💎/video, şimdilik GÖRÜNÜR-KİLİTLİ):** ayrı `samovar` pad kalkar; ocak L1-L3 ₺, L4=semaver (hız×0.7+throughput
   sıçraması); masterLevel 4. EKONOMİ: tek ocak L3 (2.46x) 4 masaya yetişmeli → simülatörle yeniden denge (ilk-alım 84sn SABİT). 
6. **GARSON L2:** L1=1.4 (yavaş) → L2=1.8 (şimdiki); garson yanında yan-kenar yükseltme kartı (tutulunca açılır). Yeni persist waiterLevel.
- **SAVE_VERSION 12→13** (tek migrasyon: trayLevel düşer, samovar padsDone/padFills'ten düşer, waiterLevel=0 eklenir; ilerleme korunur).
- Etkileşim KARARI: yürü+dur (dwell), TIKLAMA YOK (araştırma: tür standardı stand-to-fill). Alan GENİŞLEMEZ (placement sorunu).
- Kalan D-017 §4 gating / §5 bağımsız çay+kirli taşıma / §6 kamera sallanması bu işlerle birlikte ele alınır.

### >>> SIRADAKİ İŞ: D-017 redesign — adım 1 BİTTİ (gözle onay), sonra adım 2 <<<
Faz 2 cila redesign'ı (decisions.md **D-017**, progress.md "2-REDESIGN"). 6 adım (sırayla, her biri Vitest+sim+smoke yeşil + gözle onay):
1. ✅ **Yerleşim UYGULANDI (LAYOUT v6, D-017 §1):** Mutfak ARKA DUVARDA KÜME — ocak `[-1.6,-4.8]` + bulaşık `[0.6,-4.8]`
   (bitişik, AYRILMAZ) + semaver pad `[-3.8,-4.8]`. Masalar ÖNE UZAK 2×2 (kolon x ∓2.4, satır z 0.0/3.0) → her masa↔ocak
   >2R=3.2 (ön sıra ~4.9, başlangıç masası table0 ocaktan **4.87**; eski **2.26** idi = tek noktada her şey bug'ı çözüldü).
   area derinleşti `{minX-5.3,maxX5.3,minZ-5.3,maxZ5.0}`. Çay-yükseltme noktası ocağın TAM önü `[-1.6,-3.0]` (pickup+personel
   pad çakışması yok — taşınmasaydı garson pad'iyle para çekişirdi, bug bulundu&düzeltildi). trayUpgradeZone `[0,4.3]`, personel
   pad/home arka köşeler (waiter `[-4.8,-3.0]`/home`[-4.8,-1.6]`; dishwasher `[4.8,-3.0]`/home`[4.8,-1.6]`). player start `[0,1.5]`,
   entrance `[0,4.8]`. nav ızgarası/garson yolu/masa-yükseltme noktaları LAYOUT'tan türediği için otomatik uydu. YENİ "çakışma yok"
   testleri (masa ocak pickup+serve birleşiğinde DEĞİL; masa bulaşık wash+collect birleşiğinde DEĞİL; table0 ocaktan >4 br).
   **Değişen:** store.ts (LAYOUT + upgradeZone), tests/logic.test.ts (3 invariant testi + nav yorumları). Gözle: ekran görüntüsü
   (layout-v6-start.png) — mutfak arkada, önde geniş yürüme alanı, başlangıç masası uzakta. Ekonomi/persist SABİT (SAVE_VERSION 12).
1-eski. ~~Yerleşim: masalar ocaktan UZAK (>3.2, hedef ~5)~~ → yukarı (uygulandı).
2. **Pad/işaret:** küçük (~0.5) + **zeminde DÜZ yazı** (havada rozet YOK); renk: yeşil=aç/mavi=opsiyonel/altın=yükseltme.
3. **Sıralı reveal + onboarding (ilk oyun):** öncekiyle etkileşilene dek gizli; 2.masa→garsona zoom(atlanabilir)→"3.Masayı Aç"→
   ocak yükseltme sonra; sonraki açılış "Yeni" rozeti; onboardStep persist.
4. **Gating:** table3'ten minStationLevel:1 kalkar; simulate denge (84sn sabit kalmalı).
5. **Servis kısıtı GEVŞET:** çay+kirli BAĞIMSIZ taşınır (eli-boşken kısıtı deadlock → kirli birikip toplanamıyordu).
6. **Kamera sallanması fix (kök neden TEŞHİS EDİLDİ):** CameraRig (Scene.tsx) `lerp(desired, dt*4)` kare-hızı bağımlı +
   `lookAt(tam oyuncu)` → trailing mesafe dalgalanınca dünya sallanıyor; dt clamp yok; fit/d her kare size'dan. Çözüm: kare-hızı
   bağımsız damping (`1-exp(-k*dt)`) konum+lookAt'a TUTARLI + dt clamp + fit/d yalnız resize'da. NOT: sim deterministik & pürüzsüz,
   sorun yalnız kamerada.

- **Faz 2h (MASA-BAŞI, son hali):** Kullanıcı ilk "zone-başı/toplu + merkez altın disk + ★L rozet" uygulamasını REDDETTİ →
  **her masanın AYRI seviyesi** (`tableLevels[i]`), **her masanın YANINDA ayrı nokta** (`LAYOUT.tables[i].upgradeSpot`, +1.2x merkeze),
  My Hotel oda mantığı. Çay fiyatı SABİT; OTURULAN masanın seviyesi BAHŞİŞ↑ (coin=5+tipBase×lvl) + SABIR↑ (+2/lvl). 2. masa açılınca belirir.
  Görsel: masanın yanında **sade küçük işaret** (altın halka YOK, dünya-içi L yazısı YOK; parası yetince yeşil parlar); bilgi HUD bar'ında.
  Sayılar (data-driven): tipBase 2, patience +2/lvl, maliyet 60×1.6^lvl (60/96/153/245), soft max L4. SAVE 10→11→12 migrasyon zinciri.
  Karar: D-016 §5 "zone-başı"→"masa-başı" güncellendi (decisions.md). Hafıza: feedback_upgrade_per_object.md.
- **Baş üstü radial ilerleme cızırtı düzeltmesi (2026-06-07):** Kullanıcı "dolma animasyonu cızırtılı" dedi. İki neden: (1) arka halka
  ile dolan yay TAM aynı düzlemdeydi → z-fighting; (2) `ringGeometry` sabit 32 segmenti değişen yay uzunluğuna her frame yeniden
  dağıtıyordu → tüm yay titriyordu. Düzeltme (Player.tsx HeadRadial): yay `position z +0.003` + her iki materyal `depthWrite=false` +
  `renderOrder` (z-fighting yok); segment sayısı ilerlemeyle ORANTILI (`round(progress*48)`) → sabit açısal dilim, sadece uçta yeni
  dilim eklenir (titremez). build temiz, smoke 20/20, konsol temiz. **GÖZLE onay bekliyor.**
- **Test sıfırlama (kullanıcıya):** tarayıcı **DevTools Console** sekmesinde `__resetGame()` (çift alt çizgi + parantez). AMPİRİK
  DOĞRULANDI çalışıyor (playwright: tables 2→1, padsDone temizlendi, localStorage null). En garantili: `localStorage.clear()` sonra F5.
  Para: `__addMoney(500)`, zaman: `__advanceTime(60)`. E2E: testten önce `localStorage.clear()` + reload.
- **Garson/bulaşıkçı oyuncudan KAÇINIR (2026-06-07):** Kullanıcı "garson benim içimden geçiyor, bana göre hareket etmeli." navStep'e
  opsiyonel `avoid`(oyuncu)+`avoidSolids`(masa) eklendi: personel oyuncunun üstüne binmeyip kenarına ayrılır (boids separation;
  masaya itecekse itmez). Oyuncu otoriter (input), personel yer açar → "garson etrafından geçer" hissi. Garson+bulaşıkçı tüm navStep
  çağrılarına player+obstacles geçti. Vitest 54/54, build temiz, smoke 20/20. GÖZLE onay bekliyor.
- **Sıradaki:** 2h gözle onaylanırsa → **Faz 2i** (onboarding/işaretçi: ilk masa-açma + sonraki açılışlar "Yeni ▲" rozet).

## (eski) Şu an neredeyiz (2026-06-06)
Faz 0 + Faz 1 ✅. **Faz 2 (2a–2f) BİTTİ.** SAVE_VERSION **10**, max tepsi **6**.
**YENİ TASARIM KİLİDİ: D-016** (kullanıcı onayı 2026-06-06) — D-012 "açık-alan salon"u **kat + zone ızgarası** ile
DEĞİŞTİRDİ. Çok turlu tasarım tartışması sonucu yol haritası revize edildi (aşağı bak). **Sıradaki: Faz 2g** (his/yerleşim/
collision/tuning, tek zone). docs'a yazıldı: decisions.md D-016, progress.md (2g/2h/2i + revize Faz 3).

**D-016 özeti (tam metin decisions.md):**
- **ZONE = atomik birim:** 1 ocak + 1 bulaşık + 1→4 masa (pad) + ops. garson/bulaşıkçı. **1 ocak:4 masa, paylaşımsız.**
  Başlangıç 1 ocak(L1)+TEK masa; 2.→3.→4. masa omurga pad'iyle.
- **Tek kapı + rastgele oturma**; oturma havuzu global, **servis kaynakları (ocak kuyruğu/garson/bulaşıkçı) zone'a bölünür.**
- **KAT modeli:** kat = max ~4 zone (2×2); kat dolunca merdiven→kararma→üst kat. Üst katlar: balkon/okey/nargile.
- **Açma SIRALI** (omurga, büyük yeşil disk) **vs Yükseltme SERBEST/paralel** (sıra yok, açılan her obje; küçük altın
  halka+rozet, parası yetince parlar). Yükseltme kavramı **2. masa açılınca** tanıtılır.
- **Masa yükseltme = BAHŞİŞ↑ (`tipBase×seviye`, öneri tipBase=2) + sabır↑**, zone-başı. Çay fiyatı SABİT (D-010).
  Bekleme-süreli bahşiş Faz 4'e ERTELENDİ.
- **Bulaşık zone'a özel; Tuvalet+Depo KATA özel** (kâğıt döngüsü: depodan al→tak→temizlikçi).
- **Yerleşim:** mutfak sol-üst duvara 0 (arkası geçilemez), masalar sağda, dar başlangıç, **collision**. Şekil değişimi Faz 6 asset.
- **Onboarding** ilk sefere özel (masa-açma). **Garson yavaşlatılır**, tempo simulate ile dengelenir.

Önceki kilitler korunur: **D-011** (servis) ✅, **D-013** (primitive=nihai stil), **D-014** (garson opsiyonel pad) ✅,
**D-009** (mekânsal etkileşim), **D-015** (state türetme). D-012'nin KASA-YOK/bölge-başı-personel/manuel-toplama parçaları geçerli.
Tam servis tasarımı: `docs/serving-and-automation.md` (zone/kat detayı D-016'da).

## En son ne yapıldı (bu oturum — Faz 2g his/yerleşim/collision/tuning, D-016) — YERLEŞİM v3
Çok turlu tasarım → D-016 kilitlendi. Yerleşim 4 kez revize edildi (kullanıcı önizleme feedback'leri); **v5 GEÇERLİ.**
- **v5 (2026-06-07 #4 — GEÇERLİ):** Kullanıcı: "iğrenç, sandalyelerden yürüyemiyorum (koridorlar tıkalı); karakterler
  alana göre çok iri → ALAN BÜYÜMELİ HEM DE BAYA." → ölçek düzeltmesi: alan büyütüldü + masalar köşelere yayıldı.
  - **BÜYÜK alan** `area={minX:-5.5,maxX:5.5,minZ:-5.0,maxZ:4.5}`; masalar **köşelere yayık 2×2** (kolon x -2.5/2.5 gap 5,
    satır z -2.2/1.4 gap 3.6) → orta geniş yürüme alanı, sandalyeler kenarda (koridor tıkanmaz). Kamera d 7→9 (karakterler
    alana göre küçük görünür). Mutfak arka duvarda: ocak[-3.0,-4.4], bulaşık[-1.0,-4.4] (dist 2.0>washR), semaver[1.0,-4.4].
    upgradeZone ocağın solu [-3.5,-3.0]; trayUpgradeZone [0,3.8]; entrance/player orta-ön [0,..]; personel x±4.8.
  - Önceki davranışlar korunur: müşteri+garson+bulaşıkçı masa gövdesinden DOLAŞIR (`moveAvoid`+`tableSolids`); oyuncu
    collision HAPSETMEZ; bulaşıkçı toplama mesafe-tabanlı; `hitsSolid(r)` yarıçaplı. smoke park (5.2,4.2).
  - Görsel doğrulandı (ekran görüntüsü): büyük ferah salon, 4 masa dört köşede, orta açık, karakterler uygun ölçekte.
  - **Collision footprint düzeltmesi (kullanıcı: "masaya çok sokulmam gerekiyor, arada boşluk fazla"):** `*Half`'lar
    GÖRSEL mesh'e yaslandı → "değiyor gibi" sokulma, boşluk yok. stationHalf [0.8,0.6]→[1.1,0.4] (ocak tezgah 2.2×0.8),
    dishHalf →[0.7,0.4] (bulaşık 1.4×0.8), tableHalf →[0.5,0.5] (masa r0.5), chairHalf →[0.22,0.22] (sandalye 0.42).
    playerRadius 0.35 (=kapsül görsel yarıçapı → standoff görsel kenara denk). **'samovar' collision KALDIRILDI** (ayrı
    görünür mesh'i yok → görünmez duvardı); `activeSolids(tables)` (padsDone param atıldı). Vitest 44/44, smoke 19/19, build temiz.
  - **Mobilya KATI (zorlasan da geçilmez):** oyuncu collision'ı ayrıştı — MOBİLYA katı (hapsetme istisnası YOK → zorlasan da
    içine geçmez), eksen-başı kayma (diyagonalde süzülür, kafa kafaya gelince DURUR); AKTÖRLER (npc/garson/bulaşıkçı) yumuşak
    (hapsetmez). NOT: kısa süre denenen "kafa kafaya kenardan otomatik kayma (deflection)" kullanıcı isteğiyle GERİ ALINDI
    (daha kötü hissettirdi); sadece "zorlayınca içine geçmesin" kaldı. Vitest 44/44, smoke 19/19, build temiz.
- **v4 (terk):** orta-boy/hizalı ama sandalyeler koridor tıkadı + iri ölçek. v3 çapraz-geniş, v2 dar (hepsi terk).

**Eski v2 detayı (referans, geçerli değil):**
- **Yerleşim v2 (LAYOUT, store.ts) — SOLA-YASLI KOMPAKT BLOK:** mutfak (ocak `[-2.7,0,-3.0]` + bulaşık `[-1.0,0,-3.0]` +
  semaver `[0.6,0,-3.0]`) sol-ARKA köşede duvara 0; **masalar mutfağın TAM ÖNÜNDE** (aynı sol blok) — 2×2 x -2.0/0.0,
  z -1.2/0.9 (seat=table z+1.0). "Çapraz/geniş" duruş gitti. **Asimetrik oynanabilir alan** `area={minX:-3.5,maxX:2.5,
  minZ:-3.6,maxZ:3.4}` (içeriği sıkı sarar → boş sağ taraf yok; `bounds` alanı KALDIRILDI). upgradeZone `[-2.7,0,-2.0]`
  (ocak-masa arası boşluk; oyuncu ocağa dayanır, PAD_RADIUS 1.3 içinde → dolar); trayUpgradeZone `[-1.0,0,3.0]`; waiter/
  dishwasher pad `[-3.0,0,3.0]`/`[2.0,0,3.0]`, home `[-3.0,0,2.0]`/`[2.0,0,2.0]`; entrance `[-1.0,..,3.3]`, player `[-1.0,..,1.8]`.
- **Collision (D-016) — SABİT + DİNAMİK:** sabit = ocak/bulaşık/açık-masa/sandalye(seat)/(semaver alınmışsa); **dinamik =
  her müşteri + garson + bulaşıkçı** (`actorHalf`/`chairHalf`). `activeSolids()` sabitleri, hareket bloğu liveNpcs+waiter+
  dishwasher'ı ekler. Çözüm **yalnız input'la harekette** (eksen-başı kayma) → doğrudan setState/__teleport input'suz
  konumu ETKİLEMEZ → testler korunur. Oyuncu artık mobilya/müşteri/garson/sandalye içine giremiyor.
- **Tuning:** `waiter.moveSpeed 1.8→1.5`. Kamera `d 8→7`. Walls asimetrik `area`'ya göre çizilir (arka+sol+sağ; ön açık).
- **Smoke uyarlaması:** "uzağa park" konumları `(0,2)`/`(0,6.5)` → `(2.5,-3.0)` (sol-yaslı yerleşimde sağ-arka köşe tüm
  masalardan attract-yarıçapı dışı → garson-assist/kirli-birikim testleri sağlam).
- **Doğrulama:** **build temiz ✅, Vitest 44/44 ✅** (collision: önünde durma + input'suz teleport collision'sız),
  **sim 84sn sabit ✅, smoke 19/19 ✅, konsol temiz.** Önizleme: http://localhost:5173/
- Değişen: economy.config.ts, store.ts (LAYOUT v2+area+collision), Scene.tsx (Walls/kamera), tools/smoke.mjs,
  tests/logic.test.ts; decisions.md (D-016), progress.md, activeContext.md. **Henüz commit yok** (ortam git repo'su değil).
- **2g servis-her-taraftan + garson kilitlenme düzeltmesi (2026-06-07 #2 — kullanıcı: "garson sol-üst masanın önünde takıldı, servis yapamıyor; engeli dolaşamıyor; alan büyük, garson eski hızına dönsün"):**
  - **KÖK NEDEN:** garson teslimatı KOLTUK noktasına (`seat`) gidip oraya VARMAYI (`moveAvoid===true`) bekliyordu. Koltuk masanın bir tarafında; garson ters/mutfak tarafından gelince masa TAM aradadır → `moveAvoid`'in basit eksen-kayması tek engeli dolaşamayıp KİLİTLENİYORDU (gerçek pathfinding yok).
  - **ÇÖZÜM:** servis MASA MERKEZİNE yakınlıkla (her taraftan). Garson teslimat: `seat`→`table` merkez, teslim koşulu `moveAvoid===true` yerine `dist2D(w.pos, table) < serveRadius(1.6)` → masaya yaklaşınca (hangi yön olursa) bırakır, engelin ardına geçmek gerekmez (bulaşıkçının çalışan deseni). Oyuncu servisi de `seat`→`table` yakınlığı (arkadan da servis). En-acil hedef seçimi korunur (timer önce; mesafe `table`'a göre tie-break). Bardak toplama zaten masa-yarıçaplı (her taraftan) → değişmedi.
  - **GARSON HIZI:** `waiter.moveSpeed 1.4→1.8` (eski hız). Alan büyüdüğü için 1.5/1.4 çok yavaş kalıyordu; kullanıcı "eski hızına dönsün". Müşteri geliş hızı AYNI (spawnInterval 1.6, orderTime 6 — "müşteriler aynı hızda").
  - **Doğrulama:** Vitest 44/44 ✅ (anti-starvation + servis testleri geçer: koltuk masaya 1.0 < serveRadius 1.6), build temiz, sim 84sn (garson hesabı etkilemez), smoke **19/19** ✅ — garson assist düşen para **1→8** (önceden 1→2; artık gerçekten servis ediyor, takılmıyor). SAVE_VERSION değişmedi. **Faz 2g BİTTİ → sıradaki Faz 2h.**
  - Değişen: economy.config.ts (waiter.moveSpeed), store.ts (oyuncu+garson servis masa-yakınlığı).
- **2g GERÇEK YOL BULMA — garson kilitlenme KÖK çözüm (2026-06-07 #3 — kullanıcı: "yine bug; tam masaya gelmeden veriyor; ön masada takılı kalıp arka masaya gidemiyor, engeli anlamıyor → arka masa sabrı doluyor; elinde çayla sol-üst↔sağ-üst↔sol-alt salınıyor; SERVİSE OPTİMİZASYON + harita düzeni ŞART"):**
  - **TEŞHİS:** `moveAvoid` (eksen-başı kayma) GERÇEK pathfinding değildi → masa aktör ile hedef arasında TAM ortadaysa (mutfak arka duvarda, ön masa arka masayı x-kolonunda kapatıyor) tek engeli dolaşamayıp KİLİTLENİYORDU. Tüm belirtiler bunun (deadlock + en-acil hedef değişince yarı-yaklaşıp salınım). "Uzaktan veriyor" = serveRadius 1.6 (kenardan 1.1).
  - **KULLANICI KARARI:** "sen mantıklı olanı yap, layout'a karar veremedim, olmazsa değişiriz ama mantıksal sorun çözülsün." → pathfinding eklendi, **layout v5 KORUNDU** (görseli zaten onaylıydı).
  - **ÇÖZÜM — `src/game/nav.ts` (YENİ):** kaba ızgara (NAV_CELL 0.3) BFS yol bulma. `buildNavGrid(area,cell,solids,inflate=actorRadius)` + `findNavPath(grid,start,tx,tz,reach)` (8-yön, köşe-kesme engelli, bloklu-başlangıç en yakın açığa snap). Saf modül (LAYOUT'tan bağımsız → circular import yok; store solid'leri verir). **store.ts:** `navSolids`(ocak+bulaşık+masalar; koltuk/semaver hariç) + `getNavGrid(tables)` cache + `navStep(pos,target,step,grid,reach)`. Garson + bulaşıkçı artık `moveAvoid` yerine `navStep` → engeli GERÇEKTEN dolaşır. **Oyuncu DEĞİŞMEDİ** (input+kendi collision). Müşteriler de moveAvoid'te kaldı (kendi koltuğuna gider, blokaj yok).
  - **Teslim mesafesi (geometrik, footprint+actorRadius+pay):** REACH_TABLE ~1.05 (servis), REACH_STATION/WASH ~1.08, REACH_HOME 0.4. Masaya BİTİŞİK teslim → "tam masaya gelmeden veriyor" biter.
  - **Doğrulama:** **Vitest 47/47** (3 yeni nav testi: ocaktan HER masaya yol var + engel-tam-aradayken dolaşır + garson kolon-bloklu ARKA masaya gerçekten servis eder/deadlock yok), build temiz, sim 84sn (garson hesabı etkilemez), smoke 19/19. SAVE_VERSION değişmedi.
  - Değişen: YENİ nav.ts; store.ts (nav entegrasyonu, garson+bulaşıkçı). **GÖZLE doğrulama BEKLİYOR** (kullanıcı önizlemede garsonun artık takılmadan tüm masalara servis ettiğini teyit etmeli — 3D nav kod testiyle değil gözle onaylanır).
- ~~**2g KALAN (opsiyonel):** müşteri spawn/sipariş tempo ince-ayarı + "sayı düzeni". NOT: SAVE_VERSION değişmedi (persist alan yok).~~ (tempo yapıldı — yukarı bak)

## (önceki oturum — Faz 2f görsel/animasyon/yerleşim cilası)
Kullanıcı 4 kararı onayladı: ızgara (istif değil), yerleşim bana bırakıldı (taşmasın yeter), react-spring'siz hafif
animasyon. (Asset sorusu yanıtlandı: animasyonlar = kod/bedava; 3D modeller = Faz 6, CC0 Quaternius/Kenney + AI Türk objeleri.)
- **(B) Max tepsi 8→6:** `economy.config.serving.trayUpgrade.maxLevel` 3→2 (L0=2/L1=4/L2=6). **SAVE_VERSION 9→10** +
  v9→v10 migrasyonu (eski L3 → max'a clamp) + store init savunmacı clamp.
- **(A) Taşıma öne tepsiye:** `Player.tsx` kafadaki DirtyStack KALDIRILDI; temiz(kırmızı)+kirli(gri) ellerin önünde tek
  tepside **3×2 ızgara** (CupTray, taşmaz). **"Eli boşken" kısıtı (store.ts):** servis `tray<cap && carriedDirty===0`,
  kirli toplama `tray===0` → tepside hep tek renk. Waiter/Dishwasher zaten önde taşıyor → değişmedi.
- **(C) Yerleşim (LAYOUT):** ocak `[-3.6,0,-3.6]` + bulaşık `[-1.7,0,-3.6]` sol-ARKA köşede BİTİŞİK mutfak bloğu;
  **bounds 7→5**; 4 masa 2×2 sıkı (x 0/2.6, z ∓1.2); upgradeZone/samovar/trayUpgrade/personel pad'leri eş-zamanlı
  çakışmayacak aralıkta (aktif fill ≥2.6, yıkama/fill ≥2.9); Scene kamera d 9→8. Render bileşenleri LAYOUT'tan okur → otomatik uydu.
- **(D) Juice (useFrame/damp, react-spring YOK):** para mıknatısı (aşağı bug-fix), toplanınca "+₺" floating (CSS `floatUp`
  keyframe, per-frame JS yok); `Player.tsx` baş üstü radial ilerleme (activeZone fill/cost; pad=yeşil, yükseltme=altın);
  `TeaStation.tsx` semaver buharı (Puff, 2 adet); `Customers.tsx` otururken idle bob; yeni `useFacing.ts` (damp yön
  dönüşü) Player/Waiter/Dishwasher/Customer'a uygulandı.
- **🐛→✅ Para mıknatısı bug-fix (kullanıcı gözlemi: "bir coin peşime takılıp arkama yapıştı"):** İlk uygulamada süzülme
  GÖRSEL-only'di (Coins.tsx mesh'i oyuncuya damp'lerken store toplamayı paranın ESKİ düşme konumuna göre yapıyordu) →
  oyuncu 1.4'e girmeden geçince para görsel olarak yapışıp asla toplanmıyordu. **Çözüm:** mıknatıs STORE'a taşındı —
  `economy.config.money.attractRadius 2.6/attractSpeed 9` (>oyuncu 4.5 → daima yetişir); tick'te attract içindeki coin
  `moveToward(player)` ile GERÇEKTEN akar, pickupRadius'a varınca toplanır. Coins.tsx artık yalnız `c.pos`'u çizer
  (görsel=mantık → "yapışan para" yapısal imkansız). coins map'inde `pos` klonlandı (mutasyon güvenliği). Yeni vitest:
  pickup'a hiç girilmeden mıknatısla toplanır + attract dışı çekilmez.
- **Doğrulama:** **Vitest 40/40 ✅** (eli-boşken kısıtı + v9→v10 clamp + kapasite 2→4→6 testleri eklendi), **build temiz ✅,
  sim 84sn ✅ (mantık değişmedi), smoke 19/19 ✅, konsol temiz, gözle doğrulandı** (kompakt köşe mutfağı, derli masalar, çakışma yok).
- Değişen: economy.config.ts, save.ts, store.ts (LAYOUT+kısıt), Scene.tsx, Player.tsx, Coins.tsx, Customers.tsx,
  TeaStation.tsx, Waiter.tsx, Dishwasher.tsx, index.css, tests/logic.test.ts, +yeni useFacing.ts; progress.md, activeContext.md.
  (Henüz commit'lenmedi — oturum-bitir'de.)

## (önceki — 2e-B tepsi yükseltme)
- **Tepsi kapasitesi yükseltilebilir** mekânsal noktayla (çay yükseltme deseni): **2→4→6→8** (`trayCapacityForLevel`
  = trayCapacityBase 2 + perLevel 2 × level; maxLevel 3). `LAYOUT.trayUpgradeZone` [0,0,4.5] (giriş önü, doğal yol).
  Gating `C.serving.trayUpgradeRequires` = prev table3. Maliyet `trayUpgradeCost` (costBase 80, growth 1.8), fillRate 60.
- **`trayLevel` PERSIST** (stationLevel deseni): store GameState + init(save.trayLevel) + saveNow yazar; tick'te
  `trayCapacity(trayLevel)` hem servis tepsisi hem kirli-toplama kapasitesi için. Ayrı transient `trayUpgradeFill`
  biriktirici (çay `upgradeFill` gibi). **SAVE_VERSION 8→9 + v8→v9 migrasyonu** (trayLevel eksikse 0, varsa korunur).
- Render: Scene.TrayUpgradeZone (mavi disk + 🫖). HUD tepsi chip'i `trayCapacity(trayLevel)`. devHooks: trayLevel,
  trayUpgradeZonePos, trayCap seviyeli. Yardımcılar: `trayMaxLevel`, `trayNextCost`, `trayUpgradeZoneUnlocked`.
- **NOT (test ortamı):** vitest **node** ortamında (jsdom yok) → `localStorage` yok, writeSave/loadSave sessizce no-op.
  Kalıcılık şema-düzeyinde migrate() ile test edilir; canlı yazımı **smoke** (gerçek tarayıcı) doğrular.
- **Doğrulama:** **Vitest 37/37 ✅, build temiz ✅, sim 84sn ✅, smoke 19/19 ✅** (3. masa aç → tepsi 2→6, L2).
- Değişen: economy.config.ts, save.ts, store.ts, devHooks.ts, Scene.tsx, HUD.tsx, tests/logic.test.ts, tools/smoke.mjs,
  progress.md, activeContext.md.

## (önceki — 2e-A bardak döngüsü + bulaşıkçı, commit f93de78)
- **Bardak SINIRLI kaynak:** demleme bir TEMİZ bardak harcar (`cleanCups`); temiz biterse demleme DURUR
  (yeni darboğaz → kirli topla/yıka çemberi zorunlu). İçen müşteri masada KİRLİ bardak bırakır (`dishes[]`,
  coins gibi mekânsal nesne). Oyuncu yakınlıkla toplar (`carriedDirty`, kapasite = trayCapacity) → **bulaşık
  noktasında** (`LAYOUT.dishStation` [-4.8,0,-3]) yıkar → temiz havuza döner. Havuz ocak seviyesine bağlı
  (`cupPoolCapacity` poolBase 10 + 2/lvl); seviye artınca (zone + upgradeStation) cleanCups += poolPerLevel.
- **Bulaşıkçı** = opsiyonel pad (`dishwasher`, ₺280, requires prev table3, garson deseni). `hasDishwasher`
  derivedFromPads'ten (D-015, effect `hireDishwasher`). FSM: en yakın kirliyi topla (kapasiteye kadar) →
  bulaşığa götür → yıka → boşta dishwasherHome [-4.8,0,1.5]. Oyuncudan yavaş/küçük → kısmi assist.
- **KORUNUM:** toplam bardak = havuz değişmezi (clean+ready+tray+carried+dishes+drinking+waiter.tray+
  dishwasher.tray); her geçiş atomik tek bardak taşır. Vitest'te totalCups() ile doğrulandı.
- **Kalıcılık:** bardak sayıları TRANSIENT (her oturum dolu-temiz başlar) → **şema değişmedi, SAVE_VERSION 8'de KALDI**
  (bulaşıkçı=pad zaten padsDone'da). Migrasyon gerekmedi.
- **Render:** Dishes.tsx (gri kirli), Dishwasher.tsx (gri-mavi kapsül + gri yığın), Scene.DishStation (lavabo),
  Player DirtyStack (sırtta gri), HUD 🧼 temiz / 🧽 kirli chip'leri, hint güncellendi.
- **devHooks:** cleanCups, dirtyCount, carriedDirty, dishStationPos, firstDishPos, hasDishwasher, dishwasherTray/Pos.
- **Doğrulama:** **Vitest 32/32 ✅, build temiz ✅, sim 84sn ✅ (idealize tempo değişmedi), smoke 18/18 ✅** (kirli üret→topla→yıka).
- Değişen: economy.config.ts, types.ts, store.ts, devHooks.ts, Player/Scene/HUD + yeni Dishes.tsx/Dishwasher.tsx,
  tools/simulate.ts (not), tests/logic.test.ts, tools/smoke.mjs, progress.md, activeContext.md.

## (önceki — garson anti-starvation)
- **Sorun (kullanıcı gözlemi):** Garson "en yakın bekleyene" gidiyordu → ön masalar sürekli dolunca arka masalara
  hiç gidemiyor, sabırları (18sn) dolup sessizce gidiyordu (kaçan gelir, kötü dağılım).
- **Çözüm:** `store.ts` garson teslimat bloğunda hedef "en yakın" → **"en acil" (sabrı en az kalan = en düşük `timer`)**;
  eşitlikte en yakın (`bestTimer`/`bestDist`, 1e-6 epsilon). Timer'lar aynı hızda azaldığından kararlı FIFO, salınım yok.
  Garson hız/tepsi limiti AYNI → D-014 "partial assist" tasarımı korunur (oyuncu hâlâ gerekli). Ekonomi etkilenmez.
- **Test:** Yeni vitest — garsonu yakın masanın koltuğuna tepsi-dolu koy; yakın(timer17) vs uzak(timer2) bekleyen →
  yakın masa SERVİS EDİLMEZ (nearest olsa anında içerdi), garson uzak-acil masaya yaklaşır. **Vitest 26/26, build temiz, smoke 15/15.**
- Değişen: store.ts, tests/logic.test.ts, progress.md, activeContext.md. (Henüz commit'lenmedi.)

## (önceki — D-015 state türetme refactor'ı; commit 61b4e07)
- **`economy.config.ts`:** saf `derivedFromPads(padsDone) → {tables, stations, serviceSpeedMult, hasWaiter}` +
  `DerivedState` tipi. `SAVE_VERSION 7→8`. (stations şu an hep 1; Faz 3a addStation pad'leriyle artacak.)
- **`store.ts`:** GameState yine `tables/stations/serviceSpeedMult/hasWaiter` alanlarını TUTAR (bileşenler okur) ama
  bunlar artık YALNIZ `derivedFromPads`'ten set edilir. init save.padsDone'dan türetir (eski `min(stations,...)`
  kelepçesi kalktı). tick: başta `derived` (frame anlık görüntüsü, const); pad tamamlanınca SADECE `padsDone += id`,
  switch-effect mutasyonları silindi; sonda `out = derivedFromPads(padsDone)` → set + garson varlığı kurulur.
  saveNow türetilenleri yazmaz.
- **`save.ts`:** SaveData/defaultSave'den 4 türetilen alan çıkarıldı. migrate gevşek `d: Record` üstünde çalışır,
  sonda yalnız v8 alanlarını üretir; **v7→v8 adımı:** eski `hasWaiter:true` → `padsDone`'a `waiter` taşınır.
- **`tools/simulate.ts`:** State'ten tables/stations/serviceSpeedMult çıktı; rate/brewTime/gate `derivedFromPads`'ten
  okur; pad alımında yalnız `padsDone.push`. Ekonomi SABİT (ilk alım 84sn, table4 @7.5dk, semaver 14.9dk).
- **Testler:** garson testi `padsDone:['table2','waiter']` ile kuruldu (sahte `hasWaiter` set artık işe yaramaz);
  yeni testler: derivedFromPads tutarlılığı, **kayıttaki çelişen sahte `tables/hasWaiter` türetmeye SIZAMAZ**,
  **store pad açıldıkça daima `derivedFromPads(padsDone)` ile tutarlı (desenkronizasyon üretilemez)**.
- **Doğrulama:** **Vitest 25/25 ✅, build temiz ✅, sim 84sn ✅, smoke 15/15 ✅.**
- Değişen dosyalar: economy.config.ts, store.ts, save.ts, tools/simulate.ts, tests/logic.test.ts, progress.md,
  decisions.md, activeContext.md. (Henüz commit'lenmedi — oturum-bitir'de.)

## (önceki oturum — 2d-harita, D-012 1 ocak : 4 masa)
- **Başlangıç salonu 1 ocak : 4 masa'ya çekildi.** Omurga pad zinciri: 2.Masa → (ocak L≥1) → 3.Masa →
  **4.Masa (YENİ, addTable, cost 300/fillRate 75, requires prev table3)** → Semaver (requires prev table4).
- **`station2` omurgadan ÇIKARILDI** (D-012: 2. ocak Faz 3a'da yeni salonla otomatik gelir). `addStation` effect
  tipi pads'ten düştü → store.ts ve simulate.ts'teki `case 'addStation'` (ölü) kaldırıldı; `extraStationSpeedFactor`
  config'te Faz 3a için kaldı. tick'teki `stations` artık `const`.
- **LAYOUT:** tek ana ocak `[0,0,-5]`; 4 masa 2×2 derli toplu (x ±2.5, z -1.5/1.2; seat = table + z+1.1).
  padPos table2/table3/table4 masa slotlarında; **samovar sağ-ön [1.6,-3.4]**, **upgradeZone sol-ön [-1.6,-3.4]**
  (çakışmaz); waiter [-4.5,4], waiterHome [4.5,4]; player start [0,2.5]. `stations` artık tek elemanlı dizi.
- **SAVE_VERSION 5→6 + migrasyon (v5→v6):** station2 padsDone/padFills'ten çıkarılır, `stations=1` kelepçe
  (ilerleme/₺ korunur). init'te de savunmacı `min(save.stations, LAYOUT.stations.length)` → eski çok-ocaklı kayıt taşmaz.
- Render bileşenleri (Pad/Scene/Tables/Stations) veri-güdümlü → table4 otomatik geldi, station2 düştü, kod değişmedi.
  smoke.mjs de pozisyonları kancalardan okur → değişmedi.
- Testler: **Vitest 21/21 ✅** (table4 omurga adımı, v4→v6 + v5→v6 migrasyon), **build temiz**, **sim ilk-alım 84sn**
  (omurga ~15dk, table4 @7.5dk), **smoke 15/15 ✅** (tek-ocak yerleşiminde servis+garson assist+yükseltme L0→L4).
- Değişen dosyalar: economy.config.ts, store.ts, save.ts, tools/simulate.ts, tests/logic.test.ts, progress.md, activeContext.md.
- Commit `2105083` push'landı.

## Takip düzeltmesi (aynı oturum — eski-kayıt masa+pad çakışması)
- **Bulgu:** Kullanıcı eski kayıtla açınca "4. masa zaten var + üstünde pad" gördü. Tanı (geçici playwright scripti,
  A/B/C senaryoları): `tables=4` AMA `table4` padsDone'da yokken, `table4` pad'i çizili 4. masayla TAM aynı konumda
  ([2.5,0,1.2]) çakışıyor. Kök neden: `addTable` gating'i masa SAYISINA bakmıyordu (sadece `prev:table3`).
- **Düzeltme:** `addTable` pad'lerini masa sayısıyla senkronlama (i. addTable = (i+2). masa; masa çiziliyse pad done).
  **ÖNEMLİ:** kullanıcının kaydı ilk commit'te zaten v6'ya yükseldiği için (loadSave güncel sürümde migrate'i atlar)
  senkron ayrı **v6→v7** adımına konuldu ve **SAVE_VERSION 6→7** yapıldı → v6'da takılı bozuk kayıt da düzelir.
  Çakışma giderildi (currentPad=samovar). Kalıcı vitest testleri (v6→v7 senaryosu dahil).
- **Doğrulama:** Vitest **22/22**, build temiz. Commit `c0e9e24` (v6 fix) + sonraki commit (v7 bump) push'landı.

## TAM sıradaki adım (Faz 2g — his & yerleşim & collision & tuning, TEK zone)
D-016 kararıyla, çoğaltmadan ÖNCE tek zone'u mükemmel hissettir (şablon olsun). İş kalemleri:
1. **Yerleşim:** mutfak şeridi sol-üst köşede duvara 0 (ocak + bulaşık bitişik, arkası geçilemez); tost/kahve için sağına
   yer ayır; **masalar sağda** 2×2; **bounds küçült** (dar başlangıç → boş-büyük-alan hissi biter); kamera/duvar uydur.
2. **Collision:** ocak/bulaşık/masa = katı AABB engel; oyuncu içine giremez (kenardan kayar). (Personel hedefleri obje ÖNÜ;
   gerekirse onlara da uygula.) Yeni: footprint tanımı LAYOUT'a; store hareket çözümüne AABB push-out.
3. **Tuning:** `waiter.moveSpeed` düşür (çok hızlı); müşteri `spawnInterval`/`orderTime` temposu simulate ile yeniden
   dengele (frantik değil akışkan, ilk-alım hedefini koru); sayıları tek şablona topla.
4. Vitest + sim + smoke yeşil; progress/activeContext + (gerekirse) docs güncelle; SAVE_VERSION yalnız persist alan değişirse bump.
   NOT: tek-masa başlangıç ZATEN var (derivedFromPads tables=1); 2g'de masa SAYISI değil ALAN/HİS düzeltilir.

## Sonraki dilimler (kilitli plan — D-016)
- **2h:** masa yükseltme + bahşiş (zone-başı; 2. masa açılınca; bahşiş `tipBase×seviye` + sabır↑; SAVE bump).
- **2i:** onboarding/işaretçi katmanı (ilk masa-açma; sonraki açılışlar "Yeni ▲" rozeti).
- **Faz 3:** 3a zone çoğaltma (kat başına ~4 zone, 2×2 ızgara, zone-açma pad'i, stations türetme) · 3b kat geçişi
  (merdiven/kararma/üst kat) · 3c tuvalet+depo+temizlikçi (kata özel) · 3d menü (tost/kahve mutfak şeridine).

## Faydalı dev kancaları (konsol)
`__game()` (readyCups/tray/trayCap/trayLevel/waitingCount/stationPos/firstWaitingSeat + bardak döngüsü:
cleanCups/dirtyCount/carriedDirty/dishStationPos/firstDishPos/hasDishwasher/dishwasherTray/Pos +
trayUpgradeZonePos/upgradeZonePos), `__advanceTime(60)`, `__addMoney(1000)`, `__upgradeStation()`, `__teleport(x,z)`, `__resetGame()`.
Servis testi: ocağa ışınla (`__game().stationPos`) → tick → tepsi dolar; bekleyen koltuğa ışınla
(`__game().firstWaitingSeat`) → tick → servis.

## Hızlı komutlar
- `npm run dev` · `npm run build` · `npm run test` · `npm run sim`
- Duman testi: `npm run dev` (ayrı) → `node tools/smoke.mjs`
