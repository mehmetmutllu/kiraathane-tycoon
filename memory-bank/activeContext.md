# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-09 — **E2 BİTTİ** · Faz E 2/4 · 73/80)

```
SORU            : Duman testi 41 denetime çıktı ama ELLE koşuluyordu (sunucuyu aç → ayrı
                  terminalde koştur → kapat) ve protokolde "mümkünse" diye geçiyordu.
                  Fazın kapısı tam olarak bu: bağlı ve yeşil.  [KAPANDI]
ÖLÇÜLECEK KOLLAR: YOK — denge dosyasına dokunulmadı, varyant kapısı devrede değil.
SAYILAR         : `npm run duman` → **41/41 · çıkış 0 · 25 sn** (taban dev sunucusunda)
KARAR           : ürün kararı gerekmedi; iki TASARIM iddiası ölçümle düzeltildi (aşağıda)
UYGULAMA        : `tools/duman.mjs` (YENİ) · `package.json` `duman` script'i ·
                  `CLAUDE.md` + `oturum-bitir` protokolü ("mümkünse" kalktı)
BEKÇİ           : tests/duman-kosucu.test.ts — 21 test, **18 mutasyon, on sekizi de yakalandı**
                  · vitest 705 · duman 41/41
```

**Ders — ARAÇ YEŞİLKEN DE YANLIŞ ŞEYİ ÖLÇEBİLİR; iki kez aynı ders.** ① Koşucu `127.0.0.1`
yokluyordu: vite `localhost`a bağlanıyor, o ad bu makinede IPv6 `::1`e çözülüyor → sunucu
AYAKTAYKEN "ayağa kalkmadı" deyip 60 sn bekliyordu. ② `--strictPort` yeterli SANILDI; port
bilerek doldurulup sınandı ve varsayım çürüdü — koşu kırmızıya dönüyor **ama yanlış sebeple**:
yoklama, portu tutan YABANCI sunucunun 200'ünü hazır sanıyor ve hata "canvas bulunamadı" diye
görünüyor. Düzeltme: hazır sinyali **vite'ın kendi stdout'undan**; süreç ölürse anında bilinir.
③ Aynı ders bekçide de çıktı: `--strictPort` dosya METNİNDE aranıyordu, yorumda da geçtiği için
argümanlardan silinince bile bulunuyordu — mutasyon KAÇTI. Bekçi artık kodun ne yazdığını değil
**ne çalıştırdığını** okuyor (`sunucuKomutu` ayrı fonksiyona çıkarıldı).

## SIRADAKİ TAM ADIM

**Faz E 3/4 — SES.** Teknik iş değil, önce **kaynak + lisans kararı** ister: tek stil kilidi
seslerde de geçerli (`feedback_asset_taste` · "belirsiz lisanslı hiçbir asset commit'lenmez").
Ardından **E4 — hareketli onboarding** (ilk 22 sn zaten ölçülü; öğretici yeni tempo icat etmez,
var olanı görünür kılar).

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
