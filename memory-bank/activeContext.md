# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **E4 ÖLÇÜM BİTTİ, KARAR BEKLİYOR** · Faz E 3/5 · 74/81)

```
SORU            : E4 "hangi CC0 kaynaktan ses dosyası" turu olarak açıldı. Ama o sorunun ÖNÜNDE
                  duran soru sınanmamıştı: motor dosya yokken sentez tonuna düşüyor, yani
                  "dosya HİÇ gelmesin, sentez NİHAİ olsun" gerçek bir kol (D-013'ün sesteki
                  karşılığı). E3'ün "kulaktan ayırt edilebilir" iddiası doğru mu?
ÖLÇÜLECEK KOLLAR: kol değil ÖLÇÜM — 9 sesin 36 çifti, iki kanalda (MUTLAK perde + JEST perde-siz)
                  + süre JND'si. Kaynak kolları (sentez / CC0 dosya / hibrit) karar paketinde.
SAYILAR         : KARIŞIR 0/36 · AYNI JEST 1/36 (quest<->reward) · AYRI 35/36 · yükselen arpej 7/9
                  · mutlak taban 1,39 dB · jest tabanı 0,22 dB · docs/ses-raporu-e4.md §Bulgular
KARAR           : (BOŞ — karar paketi kullanıcıya sunuldu, bekliyor)
UYGULAMA        : (karardan sonra)
BEKÇİ           : (karardan sonra)
```

**Ölçüm iddiayı DOĞRULADI, tek istisnayla.** Sentez tonları yer tutucu gibi davranmıyor; katalog
gerçekten ayrışmış (35/36). Tek gerçek kusur `quest` ↔ `reward`: ikisi de triangle, iki nota,
**aynı +5 yarım ses aralığı**, süre farkı 0,6 JND — aynı jestin transpozesi. Jest mesafesi
0,13 dB, jest tabanının (0,22) ALTINDA. Bulgu metriğe bağlı değil: metrikten bağımsız yapısal
denetim de tek başına aynı çifti buluyor.

**İkinci kanal ölçümün kendisinden doğdu.** Tek kanalla sonuç 36/36 "AYRI" çıkıyordu; metrik
yanlış değil, SORULAN SORU eksikti — oyunda sesler art arda değil dakikalarca arayla duyulur,
o zaman mutlak perde değil JEST kalır.

**Kapasite sınırı (kusur değil):** tek osilatörlü motor yalnız nota dizisi üretebiliyor; 9 sesin
7'si yükselen arpej. Gürültü bileşeni (şıngırtı, fokurdama, tıkırtı) bugün ÜRETİLEMEZ — kataloğun
ölçüme girmeyen iki sesi (`ambience_loop`, `okey_tile`) tam oraya düşüyor. Ayrıca `ambience`ın
bağlanacağı **`settings.music` kayıtta duruyor ama hiçbir şeye bağlı değil** — `settings.sound`un
E3'ten önceki hâli. Yani ortam sesi önce bir DOSYA değil, bir KABLO sorunu.

## SIRADAKİ TAM ADIM

**Karar paketi bekliyor** (oturum akışı adım 3). Kollar: ① sentez nihai + tek kusuru düzelt
② CC0 dosya seti ③ hibrit (olay sesleri sentez, gürültü sesleri dosya). Karar gelince commit #2:
seçilen kol + bekçi + en az 2 mutasyon. Ardından **E5 — hareketli onboarding**.

**Yan iş (bu turda yapıldı, denge dışı):** APK derlemesi iki makine arasında kırıktı —
`android/gradle.properties` diğer makinenin Android Studio JBR yolunu mutlak yazıyordu ve bu
makinede o yol yok. Mutlak yol committed dosyadan çıkarıldı, makineye özel JDK seçimi
`~/.gradle/gradle.properties`e (git'te değil) taşındı. Ayrıca Capacitor 8 **JDK 21** istiyor
(JDK 17 "invalid source release: 21" veriyor); bu makineye Temurin 21 kuruldu. Debug APK çıktı:
7,3 MB, kullanıcıya gönderildi.

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
