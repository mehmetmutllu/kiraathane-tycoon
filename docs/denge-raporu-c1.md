# Denge raporu C1 — ölçü donduktan sonraki TEK ölçüm

**Tarih:** 2026-09-08 · **Faz:** C, 1. oturum · **Ham çıktı:** `docs/denge-olcum-c1.txt`
**Önkoşul:** D-077 (ölçü donduruldu) — bu ölçümün geçerli olmasının şartı buydu.

---

## 0. Bu ölçüm neden yapıldı

BM adım 2 (D-073) masa aralığını **3,20 → 6,40**'a çıkardı ve masa footprint'i 0,50 → 0,84 oldu.
`simulate.ts` yürüme sürelerini **canlı `layout.ts` + gerçek BFS rotasıyla** hesapladığı için
(`getNavGrid` · `REACH_TABLE` · `findNavPath`), geometri değişince **bütün tempo tablosu geçersiz**
hâle gelmişti. Ölçü D-077'de donduğu için artık tek seferde ölçülebilir — ve bir daha
ölçülmesi gerekmeyecek (ankraja dokunan her değişiklik testi kırar).

## 1. Geometrinin bedeli — ölçüldü, **küçük**

Beklenti "yürüme uzadı, tempo bozuldu" idi. Ölçüm bunu doğruladı ama büyüklüğü küçük çıktı:

| durum | yol (eski → **yeni**) | taşıma (bardak/sn) | gelir ₺/sn |
|---|---|---|---|
| 4 masa · L2 · 1 garson | 6,3 → **6,7** | 0,81 → **0,78** | 1,52 → **1,52** |
| 8 masa · L3 · 1 garson | 15,0 → **15,0** | 0,59 → **0,59** | 2,87 → **2,87** |
| 12 masa · L6 · 2 garson | 19,6 → **20,7** | 0,66 → **0,63** | 13,13 → **12,57** |
| 12 masa · L6 · 3 garson | 19,6 → **20,7** | 0,80 → **0,76** | 15,62 → **15,27** |
| 20 masa · L6 · 3 garson | 17,5 → **18,3** | 1,25 → **1,21** | 15,62 → **15,62** |

**Zincirin tamamı (Normal profil, ŞERİT DOLDU): 5,08 → 5,12 sa** (+2,4 dk, **+%0,8**).

> Ön çeyrekte masa aralığı ikiye katlandığı hâlde zincir yalnız %0,8 uzadı. Sebep: uzayan yol
> ön çeyrekteki **masalar arası** mesafe, oysa garsonun turunu belirleyen şey servisten masaya
> olan mesafe ve o eksende kat büyümedi. Taşıma kolu %4 zayıfladı ama **darboğazın kim olduğu
> hiçbir satırda değişmedi**.

**Sonuç: geometri donması dengeyi bozmadı.** Yeni taban bu tablodur; eski sayılar arşiv.

## 2. Tempo denetimi — ölçülür oldu, **ölçüt 2 güncellendi (D-079)**

Bu oturumda `simulate.ts`'in tempo bölümü **ölçülür** hâle getirildi. Önce yalnız birinci ölçüt
ölçülüyordu; kalan ikisi hedef cümlesi olarak yazılıydı ve göz kararıyla bakılıyordu.

Ölçünce **ikinci ölçüt kırmızı yandı**: hedef "ilk 5-10 dk her ~20-40 sn bir alım" idi, ölçülen
ilk 10 dakikada **8 alım** (medyan boşluk 1,4 dk). Bu bir hata mı bayat bir ölçüt mü diye soruldu.

**Kullanıcı kararı: ölçüt bayat (b).** Eski hâli oyunun ilk günlerinden kalmaydı — o zaman kat
21 × 21, tek salon, dört masaydı — ve sonraki kullanıcı kararıyla **çelişiyordu**:
*"garson öncesi ucuz, garson sonrası ölçülü pahalı"* (`feedback_economy_pacing_offline`).

**Yeni ölçüt 2:** *garsona kadar hiçbir alım boşluğu 2 dakikayı aşmaz.* Bu, o kuralın ölçülebilir
karşılığıdır. Garson **sonrası** tempo zaten ayrı bir bekçide: "20 dk'yı aşan alım kalmasın"
(EN UZUN BEKLEME) — yani iki ölçüt birlikte kuralın iki yarısını tutuyor.

| # | ölçüt (D-010 §3.6, ölçüt 2 D-079'da güncellendi) | ölçülen | |
|---|---|---|---|
| 1 | ilk satın alma < 90 sn | **22 sn** | ✓ |
| 2 | **garsona kadar hiçbir boşluk > 2 dk** | 6 alım · medyan 1,4 dk · **en uzun 1,6 dk** | ✓ |
| 3 | otomasyon < 15 dk | **6,1 dk** (Garson) | ✓ |

Marj dar (1,6 / 2,0 = %20): açılış eğrisi pahalılaşırsa bekçi hemen öter. **Hiçbir denge sayısına
dokunulmadı** — değişen yalnız ölçüt ve raporun kendisi.

## 3. **DÜZELTME — plato yok. Eski bulgu devralınmıştı, ölçüm çürüttü**

Bu bölümün ilk hâli B5b'nin ana bulgusunu devralıp *"L6'dan sonra oran 15,62 ₺/sn'de donuyor"*
diyordu. Ölçüm çıktısı bunu **çürüttü** — milestone satırlarındaki oran donmuyor, tırmanmaya
devam ediyor:

| milestone (idealize) | zaman | oran ₺/sn |
|---|---:|---:|
| Servis ₺-max L6 | 1,99 sa | 12,57 |
| LAVABO açıldı | 2,15 sa | **19,40** |
| Şerit yarısı (16. masa) | 2,51 sa | **31,09** |
| Lavabo L6 (oda tavanı) | 2,70 sa | **52,57** |
| ŞERİT DOLDU (20. masa) | 2,81 sa | 52,57 |

**Plato B4a'da kapanmıştı ve kapalı kalıyor.** Lavabo kolu geliri müşteri başına büyütüyor
(`rate()` içinde `lavaboIncomePerCustomer`), yani üç tavanı gevşetmeden aynı akışın ₺'sini
artırıyor. Oda tavanına varıldıktan sonra oran gerçekten donuyor ama zincirin bitmesine
**6 dakika** kalmış oluyor.

### Yanlışın kaynağı: simülatörün kendi tablosu yanıltıyordu

`ÜÇ KOL` tablosunun senaryolarında `lavabo` alanı **hiç verilmiyordu**, yani hepsi lavabo = 0
ile hesaplanıyordu. Tablo son satırında 15,62 ₺/sn diyordu; oyunun gerçek tavanı **52,57**.
Yani tablo geç-oyun gelirini **3,4 kat eksik** gösteriyor ve kapanmış bir bulguyu hâlâ açıkmış
gibi okutuyordu.

Tam kadro satırı lavabosuyla birlikte eklendi (raporlama düzeltmesi — denge sayısı değişmedi):

```
20 masa · L6 · garson 3            → darboğaz ARZ · gelir 15,62 ₺/sn
20 masa · L6 · garson 3 · lavabo L6 → darboğaz ARZ · gelir 52,57 ₺/sn
```

Darboğaz iki satırda da **arz** (0,78 bardak/sn) — lavabo kolu throughput'u değil, müşteri
başına ₺'yi büyütüyor. Zaten B4a'nın kararı da buydu.

> **Ders (üçüncü kez):** *ölçmeden yazılan cümle bir varsayımdır.* Bu bölümün ilk hâli yeni bir
> tahmin değildi — **eski bir ölçümün devralınmasıydı**, ve o ölçüm aradaki B4a turuyla
> geçersizleşmişti. Devralınan bulgu, yeni yazılan tahmin kadar bayatlar.

## 4. 20 dakika ölçütünü aşan iki bekleme (Normal) — bilinen, duruyor

| bekleme | süre | durum |
|---|---:|---|
| `servis L6` | 23,4 dk | **bilerek bırakıldı** — merdivenin son basamağı; B4a "eğrinin dikliği çarpandan belirleyici" demişti (aynı çarpan dik eğriyle 41 dk, düz eğriyle 13 dk ölü aralık üretiyordu) |
| `masa seviyesi L4` | 21,4 dk | **model kusuru** — sim tüm masaları TEK kalemde yükseltiyor, oyunda masa-başı alınıyor |
| `pad: zone3` | 19,6 dk | ölçütün altında (B6a'da 26,9'dan indirilmişti) |

İkincisi simülatörün kendi kusuru: gerçek oyunda oyuncu 12 masayı tek seferde değil tek tek
yükseltiyor, yani o 21,4 dk oyunda hiç yaşanmıyor. **Sim'i gerçeğe yaklaştırmak** Faz C'nin
tanımında var — masa yükseltmesini kalem kalem modellemek bu kalemi kapatır.

## 5. Kapanan eski açık kalem

B5b §5'in sonundaki **Ö6 kapanmış:** `waiter3` artık `optional: false` ve görev hattında
`q_waiter3` var. O zaman "oyunun en iyi alımı oyuncuya hiç söylenmiyor" denmişti; artık söyleniyor.

---

## Kararlar

- **Açılış temposu ölçütü → (b) bayat, güncellendi.** Bkz. §2 ve D-079.
- **Plato sorusu kapandı** (§3): ortada kırılacak bir plato yok, B4a onu zaten kapatmış.

**Açık denge sorusu kalmadı.**

## Faz C'nin kalan işi (bu ölçümden sonra netleşen)

1. **Tek Odak kuralı deliniyor** — opsiyonel pad'ler ve yükseltme dolumları görev filtresinin
   dışında çiziliyor, oyuncu aynı anda birden çok hedef görüyor (açık risk, Faz C'ye yazılı).
2. **Sipariş kuyruğu ölçülmüyor** — D-046 global havuz + üstlenme kuralları yazıldı ama
   *"hiçbir masa X saniyeden fazla beklemedi"* iddiası teste yazılmadı.
3. **Sim'i gerçeğe yaklaştırmak:** masa yükseltmesi kalem kalem modellenir (§4'teki sahte
   21,4 dk kapanır) · bardak döngüsü ve sabır hâlâ modellenmiyor.
