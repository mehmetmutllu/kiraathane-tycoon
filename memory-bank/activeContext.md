# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **E4 BİTTİ** · Faz E 4/5 · 75/81)

```
SORU            : E4 "hangi CC0 kaynaktan ses dosyası" diye açıldı. Önündeki soru sınanmamıştı:
                  motor dosyasız da çalışıyor, yani "sentez NİHAİ olsun" gerçek bir kol.
                  E3'ün "kulaktan ayırt edilebilir" iddiası doğru mu?  [KAPANDI]
ÖLÇÜLECEK KOLLAR: ölçüm — 36 çift, iki kanal (MUTLAK perde + JEST perde-siz) + süre JND'si.
                  Kaynak kolları (A sentez / B CC0 set / C hibrit / D motoru büyüt) karar paketinde.
SAYILAR         : TABAN: KARIŞIR 0 · AYNI JEST 1 (quest<->reward, 0,13 dB < taban 0,22) · AYRI 35
                  FİNAL: KARIŞIR 0 · AYNI JEST 0 · AYRI 36/36 · quest<->reward x12,45 taban
                  ikiz 1 grup → 0 · tını 3 → 6 · gürültü-baskın ses 0 → 2 · docs/ses-raporu-e4.md
KARAR           : D-096 — kullanıcı "en kalitelisi olsun" dedi, kol bana bırakıldı → MOTORU BÜYÜT.
                  Sentez NİHAİ, dosya opsiyonel üstüne yazma. Klasör bilerek boş, lisans yüzeyi 0.
UYGULAMA        : src/game/audioSynth.ts (YENİ, saf+deterministik) · audio.ts katalog iki AİLEYE
                  ayrıldı · audioWeb.ts artık üretmiyor sadece ÇALIYOR · docs/assets.md §7 stil
                  kilidi · manifest yeniden yazıldı
BEKÇİ           : tests/ses-sentez.test.ts (19, YENİ) + tests/ses.test.ts (43) = 62 test,
                  **18 mutasyon, on sekizi de yakalandı**
```

**En kalıcı parça mimarî:** E3'te sentez `audioWeb.ts` içinde WebAudio düğümleriyle kuruluydu ve
ölçüm aracı o zinciri **TAKLİT** etmek zorundaydı — ölçülen kod ile duyulan kod ayrıydı, sapmayı
hiçbir şey tutmuyordu. Artık tek üretim yeri var. **Ders: bir ölçüm aracı ölçtüğü şeyi yeniden
yazıyorsa, ölçtüğü şey o değildir.**

**İkinci kanalı ölçümün kendisi doğurdu.** Tek kanalla 36/36 "AYRI" çıkıyordu; metrik yanlış
değil, SORULAN SORU eksikti — oyunda sesler art arda değil dakikalarca arayla duyulur (`coin`
saniyede bir, `level` saatte bir), o zaman mutlak perde hafızada kalmaz, JEST kalır.

**Üç mutasyon ilk turda kaçtı, üçü de gerçek delikti:** M3 `zarf`ın gecikme dalının ÖLÜ KOD
olduğunu gösterdi (döngü zaten gecikmeden başlıyordu — iki mekanizma, biri bekçisiz; döngü 0'a
çekildi). M15/M16 "en az bir gürültü + bir ton sesi olsun" testinin fazla gevşek olduğunu gösterdi
(biri çökünce öteki aileyi tek başına dolduruyordu) — kural ses ses yazıldı. Ayrıca aracın KENDİ
teşhisi kusurluydu: `oruntu` ilk katmanı okuyordu ve `padFill`in gürültü süpürmesi tonal üçlüyü
gölgeleyip "+28" yazdırıyordu (gerçek jest +7,+5); artık BASKIN katman okunuyor.

## SIRADAKİ TAM ADIM

**E5 — hareketli onboarding** (Faz E'nin son kalemi). Ardından **Faz F — paketleme ve yayın**
(0/5); APK iş hattı bu turda zaten çalışır hâle geldi, F'nin işi kod-bölme + gölge maliyeti +
mağaza hazırlığı.

**APK:** debug derlemesi çalışıyor (7,8 MB, yeni ses motoruyla). Komut:
`npm run apk` değil — bash'te `export JAVA_HOME=~/.jdks/jdk-21.0.12.1+1 && npm run build &&
npx cap sync android && cd android && ./gradlew assembleDebug`.

## AÇIK KALEMLER (bilinen, bilerek duruyor)

- ~~Usta'nın uygulanan hâli beklenenden zayıf~~ → **D8'de KAPANDI (D-094):** kullanıcı ×1,5'te
  kalmayı seçti; ×2'nin ölçülmüş satırı (%-3,0 / 30,4 dk) reddedildi. Yürürlükte %-1,6 / 32,0 dk.
- **`getPlayerNavGrid`in oyunda tüketicisi YOK** — oyuncu joystick ile sürülüyor; bekçili bir
  doğruluk, görünen bir davranış değil. İlk gerçek tüketici yol gösterme/oto-yürüme olacak.
- **Sim botunun yeni ızgaraya göçü** — denendi, ölçüldü, geri alındı (D-091 ②). Kendi turunu
  ister: üç tuzağın ölçülmüş sayıları `nav-oyuncu-raporu-d5.md` Bulgu 7'de.
- **Kalıcı çarpan GÖRÜNMEZ bir ödüldür** (D-090 ③) ve **`carryMult` oyuncunun GENEL hızına
  biniyor** (D-092): ikisi de sim'in ölçemediği eksende — **telefonda oynanınca okunacak**
  (L13'te +%24 hız fazla mı çevik?).
- **Zincir eşiği artık İKİ sayı (D-095):** tek kol için D1'in **%7'si aynen duruyor**; YIĞIN
  için yeni ve yazılı sayı **%−20,1 · ŞERİT tabanı 6,77 sa**. D-092'nin istisnası istisna
  olmaktan çıktı. **Kat 1 ömrü 8,48 → 6,77 sa** — Faz F içerik planı bunu böyle okumalı.
- ~~D-087'nin tempo penceresi~~ → **D9'da KAPANDI (D-095).** **Yeni kalem:** zinciri UZATAN
  kollar hiç ölçülmedi — `outputMultByLevel` ve `b1` tam oraya bakıyor, kendi turunu ister.
- **Masa parasının payı 0,34 br** (D5 Bulgu 5) — yapısal: masa ayak izi büyürse ya da
  `money.pickupRadius` küçülürse ilk kırılacak yer burası.
- **Bekçi bandının çözünürlüğü** — `tests/hedefler.test.ts`'in zincir-bedeli bandı %3-5.
- Sim'in taşıma tavanı 4 masada fazla kötümser (elenen `k3`'ün önündeki tek engel).
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok; ÜÇ KOL tablosu
  20 masada `waiterTray: 3` varsayıyor. D7a'da İÇERİK kalemi oldu: personel merdiveni tavana
  varmadığı için o kanalın Usta hedefleri 12 saatte hiç açılmıyor.
- **`outputMultByLevel` yok** — servis çıktı çarpanı merdiven-geneli; `b1` erken oyuna
  dokunmadan denenemiyor. **D7a'nın Usta kolu bu eksiğin üstüne biniyor** (tavan üstü tek basamak).
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5) — model kalemi, bugün zarar vermiyor.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün iki oturum kapanınca
  sessiz kalıyor; kural "sayaç arttıysa kart sayısı da artmalı" olmalı. **Araç kendi turunu ister.**
- **`core.autocrlf=true` + `.gitattributes` YOK** — her `git checkout` metin dosyalarını CRLF'e
  çeviriyor. `pano-guncelle.mjs` D8'de satır sonundan bağımsız hâle getirildi (bekçili), ama
  başka bir araç aynı tuzağa düşebilir. Kalıcı çözüm bir `.gitattributes` — kendi turunu ister.
- **Tam takım koşusunda `tests/kuyruk.test.ts` ara sıra 30 sn zaman aşımına düşüyor** (tek başına
  4,6 sn · üç ardışık koşuda temiz). Yük altında paralel çakışma; ölçüm sonucunu etkilemiyor.
- **Usta olmuş masanın DÜNYADA görünen bir işareti yok** — alım sonrası nokta kalkıyor, masa
  aynı kalıyor. Rozet/malzeme farkı Faz 6 sanat işi (`feedback_upgrade_legibility`).
- **`settings.music` KAYITTA DURUYOR ama hiçbir şeye bağlı değil** — `settings.sound`un E3
  öncesi hâli. Ortam sesi (kıraathane uğultusu) E4'e bilerek girmedi: motorun gürültü kaynağı onu
  üretebiliyor, eksik olan **kablo, kabiliyet değil**. Kendi turunu ister (D-096 kapsam sınırı).
- **`okey_tile` sesi yok** — okey masası v1.1 içeriği; motor hazır, olay yok.
- **Sentezin telefonda nasıl DUYULDUĞU ölçülmedi** — araç ayırt edilebilirliği ölçtü, hoşluğu
  değil. `feedback_visual_polish`in ses karşılığı: mantık+test yeşil ≠ bitti. APK elde,
  telefonda dinlenince okunacak.
- **"İzle ve Usta yap" + "İzle, 2× al" butonları PASİF** — yer tutuyor, reklam SDK'sı Faz 5.
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi (Faz F riski) · bundle ~1,49 MB (Faz F kod-bölme).
- C4'ten kalan ölçüm kusuru: B1 · oyuncu kipinde bot hiç yürümüyor — sebebi D5'te bulundu
  (B1'de hiç servis yok → kirli bardak doğmuyor → bot boşta). Botun kendi turuna yazıldı.

**Bekleyen denge kararı:** yok — bu tur ÖLÇÜM turu; kol açılacaksa karar paketinden çıkar.

---

## TUR KARTI ŞABLONU (her yeni tur bunu doldurur, öncekinin üstüne)

```
SORU            : (tek cümle — bu tur neyi çözüyor)
ÖLÇÜLECEK KOLLAR: (varyant olarak ölçülecek seçenekler; kod YAZILMADAN)
SAYILAR         : (adım 2'den sonra dolar — rapor §Bulgular'a link)
KARAR           : (adım 3, kullanıcı seçer — D-0xx)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Sıra (D-084 §3.2) — ihlali commit yapısı engeller, kapanışta `npm run sira` denetler:**
`0 BAŞLA → 1 SORU (kart açılır) → 2 ÖLÇ → commit #1 (araç + ham çıktı + rapor, KARAR BÖLÜMÜ BOŞ)
→ 3 KARAR (tek karar paketi) → 4 UYGULA + bekçi + mutasyon + final tam koşu
→ commit #2 (kod + test + rapor tamam + D-0xx) → 5 KAPAT`

**Varyant kapısı:** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan denge değişikliği,
raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz.

**Kapanış (D-085):** `npm run sira` → `npm run pano` → `npm run test` → commit → push.
Pano denetimi kırmızıysa önce `progress.md` düzeltilir; anlatı elle yazılır.
