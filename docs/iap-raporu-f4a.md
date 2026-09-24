# F4a — SATIN ALIMLAR raporu

**Tur:** F4a · Faz F · 2026-09-24
**Araç:** `tools/olcum-iap-f4a.ts` · **Ham çıktı (TAM koşu):** `docs/olcum-iap-f4a.txt`
**Sim kancası:** `usta-kollari.ts` `eIAP`: yürürlükteki Usta kolu (`eUYG`) + t=0'da peşin 💎. Peşin 0 = taban, birebir (damga).

> **Bu rapor commit #1'de KARAR BÖLÜMÜ BOŞ olarak yayımlanır** (D-084 sıra kilidi).

---

## SORU

F4 üç ürün satacak (kullanıcı, 2026-09-24):

1. **Reklamları Kaldır:** geçişli reklam kalkar, ödüllüye dokunmaz, günde +10 💎 (D-040). Sayı zaten kararlı.
2. **Başlangıç paketi:** 💎 + yalnız bu pakette olan bir kozmetik. Tempo, ₺ ya da çarpan yok; bir kez satın alınır.
   **Kaç 💎?** → `economy.config.ts`, varyant kapısı.
3. **Elmas paketleri:** sınırsız satın alınabilir. **Hangi boylar?** 💎 neye harcanıyor?

Fiyatlar bu turun konusu değil: mağazada ülke başına girilir, kod mağazanın yerel fiyat metnini gösterir.

## KAPSAM DAMGASI

- **§1 sim ÜST SINIRDIR:** paket oyunun ilk saniyesinde alınmış sayılıyor ve 💎, Usta uygun olduğu anda harcanıyor.
  Taban **reklamsız** oyuncu. Satın alan oyuncunun reklam izlemesi ayrıca ölçülmedi, çünkü o yol D-150'de ölçüldü.
- **§2 defter gün ölçeğinde** (F3b §3'ün modeli). Gün 0 = Kat 1 sonu, masalar ₺ tavanında, hedef 💎'ı düşmüş.
  Masalar aslında Kat 1 boyunca tek tek tavana çıkar; yani gün 0 talebi bir **üst sınırdır**.

---

## BULGULAR

### §1 — Para tempoyu çok az satın alabiliyor: sınırsız 💎 bile Kat 1'de −%7,0

Taban **5,58 sa**, parmak izi `38fd43d5`: F3b'nin reklamsız T0'ı ile aynı.

| kol | ne | Kat 1 | dKat1 | en uzun bekleme (Normal) | Usta alımı (12 sa) |
|---|---|---|---|---|---|
| T0 | paket yok | 5,58 sa | — | 30,5 dk | 5 |
| **B50** | peşin 50 💎 (2 Usta) | 5,45 | **−%2,4** | 29,4 | 7 |
| **B100** | peşin 100 💎 (4 Usta) | 5,33 | **−%4,5** | 28,5 | 9 |
| **B250** | peşin 250 💎 (10 Usta) | 5,20 | **−%6,8** | 26,3 | 14 |
| P∞ | sınırsız 💎 | 5,19 | **−%7,0** | 26,3 | 14 |

- **İlk Usta her kolda 1,31. saatte.** 💎 Usta'yı açamıyor: Usta yalnız ₺ tavanındaki masaya alınır. Para yalnız
  bekleyen kuyruğu öne çekiyor.
- **B250 ile P∞ neredeyse aynı** (−%6,8 / −%7,0): 12 saatte uygun olan Usta'nın hepsi 250 💎 ile alınıyor.
  Daha fazla 💎 Kat 1'e hiçbir şey eklemiyor.
- Eleme eşiği %7 (D1/D-090). **En çok ödeyen oyuncu eşiğin tam sınırında**, tek kalemlik başlangıç paketlerinin
  hepsi altında. Açılış üçlüsü ve HÜKÜM hiçbir kolda bozulmuyor.

### §2 — 💎'ın harcanacak yeri 250 ile sınırlı: büyük paketin çoğu ÖLÜ 💎

Oyunda 💎 **yalnız Usta'ya** harcanıyor: 20 masa × 25 💎 = **500 💎**, bunun **250'si** hedeflerden zaten geliyor.
Kod taraması: kozmetikler ₺ ile satılıyor, `offline.diamondExtendHours` tanımlı ama **hiçbir yerde kullanılmıyor**.

Kalan talep, yani o gün hâlâ bir şeye harcanabilecek 💎:

| oyuncu | gün 0 | gün 1 | gün 3 | gün 7 | gün 14 | talep biter |
|---|---|---|---|---|---|---|
| **E0** reklam izlemez, satın almaz | 250 | 240 | 220 | 180 | 110 | 25,0 gün |
| **U1** her gün Usta videosu izler | 250 | 215 | 145 | 5 | 0 | **7,1 gün** |
| **K** Reklamları Kaldır aldı | 250 | 230 | 190 | 110 | 0 | 12,5 gün |

Gün 0'da alınan paket (işe yarayan / ölü 💎 · kuyruğu kaç gün öne çeker):

| oyuncu | 25 💎 | 60 💎 | 150 💎 | 300 💎 | 600 💎 |
|---|---|---|---|---|---|
| E0 | 25 / 0 · 2,5 g | 60 / 0 · 6,0 g | 150 / 0 · 15,0 g | 250 / **50** · 25 g | 250 / **350** · 25 g |
| U1 | 25 / 0 · 0,7 g | 60 / 0 · 1,7 g | 150 / 0 · 4,3 g | 250 / **50** · 7,1 g | 250 / **350** · 7,1 g |
| K | 25 / 0 · 1,3 g | 60 / 0 · 3,0 g | 150 / 0 · 7,5 g | 250 / **50** · 12,5 g | 250 / **350** · 12,5 g |

- **Bir oyuncunun v1 boyunca 💎'a toplam ihtiyacı en fazla 250.** 300 💎'lık paket ilk gün bile 50 💎 artık
  bırakıyor, 600'lük paket 350. Üçüncü günde alınırsa U1 oyuncusu için 150'lik paketin bile 5 💎'ı ölü.
- **"Sınırsız alınabilir" bugün anlamsız:** 250 💎'dan sonra alınan her 💎 hiçbir şey yapmıyor. Harcanacak yeri
  olmayan para satmak iade talebi ve kötü yorum riski taşır. Ayrıca CLAUDE.md'nin "manipülatif desen yok" ilkesiyle çelişir.
- **Talep reklam izleyene göre daha da daralıyor:** U1 oyuncusu 7 günde bitiriyor. Satın almaya en yatkın,
  en bağlı oyuncunun satın alacak bir şeyi en erken onda bitiyor.

---

## KOLLAR (karar paketi için)

| soru | kollar |
|---|---|
| ① Başlangıç paketi kaç 💎 | B50 (−%2,4) · B100 (−%4,5) · B250 (−%6,8) |
| ② Elmas paketleri | (a) yalnız talep içindeki boylar (25/60/150) · (b) v1'de elmas paketi yok · (c) önce yeni bir 💎 harcama yeri (ayrı ölçüm turu) |

---

## §Karar (kullanıcı, 2026-09-24 · D-152 — iki soruda da önerilen kol)

1. **Başlangıç paketi → B100:** 100 💎 + yalnız bu pakette olan kozmetik. Kat 1 −%4,5 (eşik %7).
2. **Elmas paketleri → önce yeni bir 💎 harcama yeri:** 💎 ile alınan kozmetik vitrini ayrı turda, görsel adaylarla.
   O gelene dek paketler **25 / 60 / 150** (talebin içinde, gün 0'da ölü 💎 0) kodda hazır, vitrinde **kapalı**.
   Başlangıç paketinin kozmetiği de o turda seçilir; vitrini de o zamana dek kapalı.

## §Uygulama

| kalem | nerede |
|---|---|
| sayılar: `starterDiamonds 100` · `diamondPacks [25, 60, 150]` · `removeAdsDiamondsPerDay 10` | `economy.config.ts` `iap` |
| ürün/hak kimlikleri · RevenueCat anahtarı (null) · vitrin kapıları | `iap.config.ts` |
| arka uç: cihazda RevenueCat, anahtar yoksa KAPALI; tarayıcıda sahte · fiyat mağazanın yerel metni | `iap.ts` |
| `purchaseGrant` · `applyPurchase` (çift işlem yok, başlangıç 💎'ı bir kez) · `adFreeDailyReady` | `rules.ts` |
| `satinAlimIsle` · `sahiplikEsitle` (mağaza kaynak, iade düşer) · `claimAdFreeDaily` · sıfırlama satın alımı korur | `store.ts` |
| `satin` alanı kayıtta — ek alan, **sürüm artmadı** (`derinBirlestir` doldurur) | `save.ts` |
| geçişli kuralına `reklamsiz` koşulu (ödüllüye dokunmaz) | `ads.ts` |
| mağazada **Paketler** sekmesi · Ayarlar'da **Satın alımları geri yükle** · Görevler'de **Reklamsız paket hediyesi** | `HUD.tsx` · kareler `docs/gorsel/f4a/` |

**Final tam koşu** (`docs/olcum-iap-f4a.txt`): commit #1 çıktısıyla birebir · taban izi `38fd43d5` · damga "config = ölçülen kol" ✓.
**Bekçi:** `tests/iap-f4a.test.ts` 25 test · `tools/mutasyon-iap-f4a.mjs` **11/11** · duman **55/55** (yeni denetim: Reklamları
Kaldır satın alınınca soğuma dolu panel kapanışı reklamsız) · debug APK RevenueCat eklentisiyle derlendi.
**Kalan (kullanıcı):** RevenueCat hesabı → Android SDK anahtarı · Play Console'da üç ürün + iki "entitlement" (`reklamsiz`, `baslangic`).
