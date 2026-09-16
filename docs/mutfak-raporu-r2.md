# R2 — MUTFAK YERLEŞİMİ VE ÇARPIŞMA RAPORU (ölçüm)

**Soru:** İlk salonun sol duvarındaki servis tezgâhı ile bulaşık — çizilen gövde ile çarpışma
kutusu aynı yerde mi, hat bitişik mi okunuyor, tezgâhın seviyesi gözle kaç sinyalden okunuyor?

**Kapsam:** kullanıcının 2026-09-16 geri bildiriminden G-35 · G-36 · G-37 · G-38
(`docs/geribildirim-oyun-testi-2026-09-16.md`). **G-39 bu rapora girmez** — denge/kural
dosyasına dokunuyor, kendi varyant kapısına tabi.

**Araç:** `tools/olcum-mutfak-r2.ts` · **ham çıktı:** `docs/olcum-mutfak-r2.txt`
(tam koşu, ızgara 0,02 br, damgalar temiz)
**Kare aracı:** `tools/shot-r2-sol-duvar.mjs` · **kareler:** `docs/gorsel/ss/r2-taban-*.png`

---

## §0 — ÖLÇÜMDEN ÖNCE: KÖK SEBEP KODDA BULUNDU

Dört şikâyetin ilk ikisi tek bir satırdan doğuyor. `kitchenLook.onHatGovdeleri` ön hattın üç
gövdesinin ÇİZİM ölçüsünü çarpışma kutusundan türetiyor — ama **dünya eksenlerinden**:

```ts
const kutu = (x: number, h: readonly [number, number]) => ({ x, hx: h[0], hz: h[1] });
//                                     w = hx × 2 (dünya x)   d = hz × 2 (dünya z)
```

İki çağıranın ikisi de o gövdeyi `place.rot` ile **zaten döndürülmüş** bir grubun içine çiziyor:

```tsx
// Scene.tsx · Stations()
<group position={[p[0], 0, p[2]]} rotation={[0, place.rot, 0]}>  <ServicePoint … /> </group>
// DishSink.tsx
<group position={[pos[0], 0, pos[2]]} rotation={[0, rot, 0]}>    <KayTezgah … /> </group>
```

`rot = 0` olan **arka bant** döneminde iki eksen aynı, fark yok — hattın bugün doğru görünmesinin
sebebi bu. **Sol duvar** döneminde `rot = π/2` ve yerel x dünya z'ye gidiyor: gövde kendi
kutusuna dik çiziliyor.

> **Ders (R1'in birinci dersinin kardeşi):** bir ölçü DÜNYA ekseninde üretilip YEREL eksende
> tüketilirse, hata yalnız dönüşün sıfır olmadığı dönemde görünür. İki dönemden biri doğru
> çalıştığı sürece kimse bakmaz. Bu yüzden R2'nin bekçisi tek dönemi değil **her iki dönemi**
> birden denetlemeli.

---

## §Bulgular

### 1) Sol duvarda gövde kutusuna DİK duruyor — 90°, IoU 0,19 (G-35)

Tam koşu, iki gövdede de aynı şeyi söylüyor:

| dönem | gövde | rot | kutu en×boy | **çizim en×boy** | IoU | açı | oda dışı br² (en fazla) |
|---|---|---|---|---|---|---|---|
| **SOL DUVAR** | tezgâh | π/2 | 1,00 × 3,20 | **3,20 × 1,00** | **0,19** | **90°** | **0,80 (0,79 br)** |
| **SOL DUVAR** | bulaşık | π/2 | 1,00 × 2,00 | **2,00 × 1,00** | **0,33** | **90°** | **0,20 (0,19 br)** |
| ARKA BANT | tezgâh | 0 | 3,20 × 1,00 | 3,30 × 1,00 | 0,97 | 0° | — (bant salon dışı) |
| ARKA BANT | bulaşık | 0 | 2,00 × 1,00 | 2,10 × 1,00 | 0,95 | 0° | — |
| ARKA BANT | garson | 0 | 2,60 × 1,00 | 2,80 × 1,00 | 0,93 | 0° | — |

"90 derece" kullanıcının abartısı değil, **tam sayı**: uzun eksen doğru eksenin dikinde.
Yan etkisi de ölçülü — tezgâh 3,20 br boyuyla duvara dik uzandığı için arka ucu **duvarı
0,79 br deliyor** (0,80 br² gövde odanın dışında kalıyor).

**Arka bant dönemi sağlam** (IoU 0,93-0,97). Aradaki 0,03-0,07 fark kusur değil, S4'ün bilinçli
birleştirmesidir (`onHat` her gövdeyi komşusuyla arasındaki boşluğun ortasına kadar uzatır).

### 2) Çizilen tezgâhın beşte biri YÜRÜNEBİLİR, kutusunun üçte ikisi GÖRÜNMEZ (G-36)

Aynı ızgarada (0,02 br), oyuncunun başlangıç noktasından taşma-doldurmayla:

| dönem | gövde | çizim br² | **GEÇİLEN br²** | % | **GÖRÜNMEZ br²** | % |
|---|---|---|---|---|---|---|
| **SOL DUVAR** | tezgâh | 3,20 | **0,62** | **%19,4** | **2,20** | **%68,7** |
| **SOL DUVAR** | bulaşık | 2,00 | 0,02 | %1,0 | **1,00** | **%50,0** |
| ARKA BANT | tezgâh | 3,30 | 0,00 | %0,0 | 0,00 | %0,0 |
| ARKA BANT | bulaşık | 2,10 | 0,00 | %0,0 | 0,00 | %0,0 |
| ARKA BANT | garson | 2,80 | 0,00 | %0,0 | 0,00 | %0,0 |

İki ayrı kusur, tek kök:
- **GEÇİLEN** — kullanıcının gördüğü şey. Tezgâhın gövdesinin **%19,4**'ünün içinden gerçekten
  yürünüyor (bulaşıkta %1,0: onun çizimi şişirilmiş katının gölgesinde kalıyor, yani bulaşığın
  şikâyeti saf görsel).
- **GÖRÜNMEZ** — kullanıcının henüz söylemediği ama aynı kökten gelen şey: kutunun **%68,7**'sinde
  hiçbir gövde çizilmiyor. Orada oyuncu boş zemine çarpıyor.

`geçilen = 0,62` sayısının `çizim = 3,20` kadar olmamasının sebebi oyuncunun 0,47 br'lik gövde
yarıçapıdır: kutunun şişirilmiş hâli çizimin ortasını kapatıyor, taşan uçları kapatmıyor.

### 3) Başlangıçta iki gövde arasında 3,20 br boşluk var (G-37)

Hattın uzun ekseni sol duvarda z'dir. Kollar ve **her kolun bedeli**, aynı ızgarada:

| kol | hat boşluğu | **GEÇİLEN br²** | **GÖRÜNMEZ br²** | notu |
|---|---|---|---|---|
| **T** taban | **3,20** | 0,64 | 3,20 | bugünkü hâl |
| **A1** tek başına | **1,60** | **0,00** | **0,00** | boşluk kalır, oyuncu (eşik 0,94) içinden geçer |
| **A1 + B1** birleşme | **0,00** | **0,66** | 0,00 | hat kesintisiz ama dolgunun katısı YOK |
| **A1 + B2** yanaşma | **0,00** | **0,00** | **0,00** | kutu da taşınır; 3 ankraj noktası oynar |

**B1 bedava değil.** `onHat` boşluğu ÇİZİMLE doldurur, kutuya dokunmaz (tasarımı böyle: arka
bantta doldurduğu boşluklar 0,20 br). Sol duvarda boşluk 3,20 br olduğu için aynı kural
**0,66 br² yeni yürünebilir gövde** üretir — yani G-37'yi kapatırken G-36'yı kısmen geri getirir.

**B2'nin bedeli koordinattır, sayı değil.** Bulaşık 1,60 br kuzeye kayar (z 10,60 → 9,00) ve
yanında duran üç nokta da taşınmak zorunda kalır:

| nokta | bugünkü z | bulaşığa mesafe |
|---|---|---|
| `dishwasherHome` (bulaşıkçının postası) | 12,60 | 2,00 br |
| `waiterHome` (garson sırası başı) | 8,60 | 2,00 br |
| `staffWalk.b` (çaycı yolunun ucu) | 11,40 | 0,80 br |

Üçü de bulaşığın YENİ kutusunun (z ∈ [8,00 … 10,00]) dışında kalıyor, yani hiçbiri kutunun
içine düşmüyor — ama `waiterHome` yeni kutuya 0,60 br kalıyor ve `staffWalk` bulaşığın önünden
geçiyor. B2 seçilirse bu üç nokta aynı turda gözden geçirilmeli.

### 4) Son yükseltme basamağı HİÇBİR görsel sinyal vermiyor (G-38)

`ServicePoint.tsx`in görsel sabitleri kaynaktan okundu (damgalı). Bir basamağın "ayırt edilir"
sayılması için renk farkının ~30 eşiğini geçmesi ya da kimlik/ürün değişmesi gerekir; gövde
yüksekliğinin sabit 0,12 br'lik adımı tek başına sayılmadı (oyuncu kamerasında piksel düzeyinde).

| L→L+1 | gövde Δ | semaver renk Δ | kapak renk Δ | kimlik | tost | **sinyal** |
|---|---|---|---|---|---|---|
| L0→L1 | 0,12 | 59 ✓ | 54 ✓ | — | — | 2 |
| L1→L2 | 0,12 | 74 ✓ | 81 ✓ | — | — | 2 |
| L2→L3 | 0,12 | 40 ✓ | 90 ✓ | — | — | 2 |
| L3→L4 | 0,12 | 133 ✓ | 85 ✓ | **TEZGÂH** | — | **3** |
| L4→L5 | 0,12 | 38 ✓ | 0 ✗ | — | **TOST** | 2 |
| **L5→L6** | 0,12 | **0 ✗** | **0 ✗** | — | — | **0** |

**L6 boş basamak.** Hem semaver hem kapak dizisi 6 üyeli ve `Math.min(level, uzunluk − 1)` ile
kelepçeleniyor; L5 zaten son üyeye varıyor, L6'da hiçbir şey değişmiyor. Yani oyunun **en pahalı
yükseltmesi (9.000 ₺, geç-oyunun ana para emicisi)** ekranda hiçbir iz bırakmıyor.

Bağlam, G-38'in asıl ağırlığını buraya koyuyor:

> **SOL DUVAR döneminde mutfak odası hiç çizilmiyor** (`Scene.BackBand`: `areasOpen < 3 → null`).
> S22'nin kademe merdiveni — odanın L1'den L6'ya büyüyen tezgâh zincirleri, adalar — o dönemde
> ekranda **yok**. L0-L3 boyunca oyuncunun gördüğü tek yükseltme yüzeyi bu tek gövdedir ve o
> gövdede basamak başına 2 sinyal vardır: semaverin rengi ve kapağın rengi. İkisi de aynı
> objenin aynı bölgesinde, ikisi de yalnız RENK.

Bu, `feedback_upgrade_legibility`'nin doğrudan ihlalidir: *"tek sinyal yetmez, çoklu redundant
sinyal"* ve *"renk sadece ÜST yüzey"*. Bugün elde iki sinyal var ama ikisi de aynı türden (renk),
biri de (gövde yüksekliği) sayılamayacak kadar küçük.

---

## §Kareler

`docs/gorsel/ss/r2-taban-plan.png` (kuşbakışı — ayak izleri) kusuru en açık gösteren kadraj:
tezgâh ve bulaşık, sol duvara **paralel değil dik** duruyor; ikisi arasında geniş bir boşluk var.
`r2-taban-hat.png` aynı şeyi oyuncu kamerasından gösteriyor.

---

## §Karar

*(BOŞ — adım 3'te kullanıcı seçer. D-084: kod yalnız seçilen kola yazılır.)*

---

## §Uygulama

*(BOŞ)*

---

## §Bekçi

*(BOŞ)*
