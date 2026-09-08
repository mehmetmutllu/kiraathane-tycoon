# ÖLÇÜ DONDURULDU — Kat 1 ankraj listesi

**Karar:** D-072 (üç katman) · **Dondurma tarihi:** 2026-09-08 (BM adım 6) ·
**Bekçi:** `tests/olcu-donduruldu.test.ts`

---

## Neden donduruldu

D-072 karışıklığı üç katmana ayırdı ve aralarına tek yönlü bir sıra koydu:

| Katman | İçerik | Kural |
|---|---|---|
| **1 · ÖLÇÜ/ANKRAJ** | kat · duvar · masa · koltuk · aktör · kamera · pad noktaları · nav katıları | Kabul kriteri **sayı listesi**. Bitince **DONAR** — bu belge o an |
| **2 · SİSTEM** | denge TEK KEZ ölçülür → Faz 4 → 5 → 7 → 8 | ankrajlara dokunmaz |
| **3 · SANAT CİLASI** | dekor · materyal · renk · ışık · animasyon | ankrajlara **dokunamaz** (sınırsız tur) |

Sebep bütçeyle ilgili: katman 2'nin denge ölçümleri bu sayıların üstüne kurulur. Ölçü sonradan
değişirse o ölçümler ikinci kez yapılır — Faz B'nin bütçesi (9 → 12 oturum) tam bu yüzden
düzeltilmişti.

**Neden belge değil TEST:** "ölçüyü değiştirme" yazılı bir kural olarak zaten vardı ve üç turda
üst üste ihlal edildi (D-074 · D-075 · D-076'da mobilya ölçüsü üç kez değişti). Yazılı kuralın
yakalayamadığı şey **sessiz sapma**dır: bir cila turu `STOOL_S`'i 0,90'dan 0,85'e çekse hiçbir
test kırılmaz, kimse fark etmez, ve denge ölçümü yanlış zemine oturur.

## Bu liste ikinci bir doğru kaynak DEĞİL

Çalışan kod hâlâ kendi dosyalarından okur — `src/config/actor.ts` · `src/config/camera.ts` ·
`src/game/layout.ts` · `src/components/three/tableLook.ts` · `src/components/three/wallPanel.tsx`.
Test, o dosyalardan **türeyen** değeri dondurulmuş sayıyla karşılaştırır. Buradaki tablo yalnız
testin gördüğü fotoğraftır; kod ondan okumaz.

## Değiştirmek için

Sayıyı kodda değiştirmek testi kırar — ve **kırması amaçtır**. Doğru sıra:

1. Kullanıcı kararı (ölçü ankrajı kendiliğinden değiştirilmez),
2. `memory-bank/decisions.md`'ye D-xxx,
3. `tests/olcu-donduruldu.test.ts`'teki değer + `karar` alanı,
4. Bu belge.

Testi susturarak ya da `toBeCloseTo` toleransını gevşeterek geçme.

---

## Dondurulan ankrajlar

### 1 · Kat kabuğu

| Ankraj | Değer | Karar |
|---|---:|---|
| `kat.yariBoy` | 17 (kat 34 × 34) | D-061 — maket v13 ölçeği; 32 × 32 ölçüldü ve reddedildi |
| `kat.enArkaKenar` | −9,80 | D-062 — yürünen alanlar bandın önünde biter |
| `bant.arkaKenar` | −16,90 | D-062 |
| `bant.odaDuvariY` | 2,20 | BM adım 3 — maketin gerekçesi: *"kamera içeri görsün"* |
| `duvar.yukseklik` | 3,20 | D-073 — maket v13 `WALL_H`; oyunun 1,20'si reddedildi |
| `duvar.lambri` | 0,90 | D-073 |
| `kapi.yariGenislik` | 2,20 | BM adım 1 — maketin giriş bloğu transkribe edildi |
| `kapi.yukseklik` | 2,65 | BM adım 1 — maket `DH` |

### 2 · Mobilya

Bu blok üç turda üst üste değişti (D-073 → D-074 → D-075). Onu durduran şey mobilyayı daha da
kısmak değil, **karakterin büyütülmesi** oldu (D-076) — kök sebep maketin 1,80'lik insanıyla
oyunun 1,29'luk karakteri arasındaki farktı.

| Ankraj | Değer | Karar |
|---|---:|---|
| `masa.dortlu.tablaL0` | 1,05 | D-075 |
| `masa.dortlu.tablaL3` | 1,68 | D-075 — D-073'ün 1,75'i kısıldı |
| `masa.ikili.tablaL0` | 0,90 | D-075 |
| `masa.ikili.tablaL3` | 1,05 | D-075 — D-074'ün 1,20'si kısıldı |
| `masa.tablaUstu` | 0,795 | D-073 — masa **yüksekliği** (0,75) kullanıcı kararıyla dondu |
| `tabure.olcek` | 0,90 | D-075 — D-074'ün 1,11'i *"aşırı büyük"* bulundu |
| `tabure.greyboxReferans` | 1,11 | maketin `stool()`'u; greybox yedeği bu ölçekte yazılı |
| `tabure.oturakUstu` | 0,45 | D-075 türevi (0,555 × 0,90/1,11) |
| `masa.dortlu.footprint` | 0,84 | D-075 |
| `masa.ikili.footprint` | 0,525 | D-075 |
| `tabure.footprint` | 0,30 | D-076 — tabure gövdesi; **oturan kişi katı değil** |
| `koltuk.ofset` | 1,45 | D-073 — maketin `SEATS4`'ü |

### 3 · Yerleşim ritmi

| Ankraj | Değer | Karar |
|---|---:|---|
| `masa.kumeAraligi` | 6,40 | D-073 — 1,6'lık şerit ızgarası yanlışlıkla ön çeyreğe de uygulanmıştı |
| `masa.yukseltmeOfseti` | 2,15 | D-073 — nokta koltuğun 1,45'inin dışında kalmalı |
| `banket.ekseni` | −3,80 | B3-2 — maketin −2,95'i 0,85 geri alındı (iki yüz de kendi alanının içinde) |
| `banket.gorselDerinlik` | 2,50 | B3-2 |
| `banket.collisionYariDerinlik` | 0,40 | B3-2 — yalnız sırtlık çekirdeği; 2,5 katı olursa BFS koltuğa giremiyor |
| `banket.sutunAraligi` | 3,20 | B3-2 |
| `banket.ucPayi` | 0,60 | B3-2 |
| `banket.disUc` | 12,30 | D-064 — ada tam boy doğar, uç sabit |
| `banket.sutunSayisi` | 3 | D-064 — boy 7,6 |
| `banket.bankOturagi` | 0,74 | B3-2 |
| `banket.masaMesafesi` | 2,00 | D-075 — kullanıcı masayı banketten uzaklaştırdı |
| `banket.sandalyeMesafesi` | 3,02 | D-075 — masayla arasındaki 0,16 korundu |
| `banket.koridorNoktasi` | 3,50 | D-075 — 3,65 denendi, `waiter` pad'inin dairesine giriyordu |

### 4 · Aktör (D-076)

| Ankraj | Değer | Not |
|---|---:|---|
| `aktor.boy` | 1,75 | 1,29 → 1,75; mobilya kısılmadı |
| `aktor.kapsulYaricapi` | 0,30 | kapsül gövde boyuna uzar, **enine şişmez** |
| `aktor.oyuncuYaricapi` | 0,47 | sahibin parçalı gövdesi enine de büyüdü |
| `aktor.personelYaricapi` | 0,28 | **değişmedi** — kapsülün nav kesiti aynı kaldı |
| `aktor.oturmaKaymasi` | −0,45 | oturan müşterinin baş tepesi 1,30 |
| `aktor.baloncukY` | 1,90 | türev: boy + 0,15 |
| `govde.sahip` · `govde.garson` · `govde.bulasikci` · `govde.cayci` | 1,29 · 1,24 · 1,24 · 1,08 | gövdelerin **yazıldığı ham boy**; ölçek bunlardan türer |

### 5 · Kamera

| Ankraj | Değer | Karar |
|---|---:|---|
| `kamera.fov` | 50 | D-076 — 34 ölçüldü ve **reddedildi**: %16 düzleşme kazancına karşı uzak kenarda sis %29 → %84 |
| `kamera.mesafe` | 8,50 | D-061 — bir banket adası tam sığar; D-076'da bilerek değişmedi (mesafe *odanın* kadrajı) |
| `kamera.portreTavani` | 1,30 | D-061 |
| `kamera.uzaklasKademesi` | 1,35 | D-061 — 8,5 ↔ 11,5 |
| `kamera.odakYakinlasmasi` | 0,72 | quest odağı |
| `kamera.bakisY` | 0,80 | D-076 — gövdenin %46'sı (1,29'daki 0,60'ın karşılığı) |

> Kamera sayıları BM adım 6'da `Scene.tsx`'in `useFrame` gövdesinden **`src/config/camera.ts`**'e
> çıkarıldı. Sebep: Scene.tsx vitest'te import edilemiyor (Canvas + `recolor` → `Image`), yani
> kamera ölçü katmanında olmasına rağmen bekçilenemiyordu.

### 6 · Nav + erişim katıları

Yürüme döngüsünün geometrisi. **Katman 2'nin denge ölçümü doğrudan bunların üstüne oturur.**

| Ankraj | Değer | Karar |
|---|---:|---|
| `nav.hucreBoyu` | 0,30 | B3-1 |
| `erisim.masa` | 1,47 | B3-1 **türevi** (`tableHalf + actorRadius + NAV_CELL + 0,05`) — ızgara yuvarlaması dahil |
| `erisim.tepsi` | 0,45 | 2026-06-11 — çay ön yüzden alınır |
| `erisim.kose` | 0,40 | boştayken köşeye dönüş |
| `pad.yaricap` | 1,30 | Faz 2 |
| `masa.yukseltmeYaricapi` | 1,00 | Faz 2h — pad'den küçük, komşu masayı tetiklemez |
| `personel.beklemeAraligi` | 0,70 | B6a |
| `npc.hiz` | 2,60 | Faz 2 |

### 7 · Noktalar (x / z)

| Ankraj | Değer | Karar |
|---|---:|---|
| `kapi.x.tekAlan` | −8,50 / 16,60 | maket v13 adım 1 |
| `kapi.x.ikiAlan` | 0 / 16,60 | maket v13 adım 2 — kapı binanın ortasına kayar |
| `kaldirim` | −8,50 / 20,50 | müşterinin belirdiği nokta |
| `oyuncu.dogusYeri` | −8,50 / 13,40 | B3-1 |
| `pad.garson` | −12,40 / 2,00 | B3-1 |
| `pad.bulasikci` | −13,40 / 10,60 | B3-1 |
| `pad.alan2` | −1,60 / 8,50 | B3-1 — alanın eşiğinde, açık tarafta |
| `pad.alan3` | 2,00 / 1,80 | B3-1 |
| `pad.garson2` | −14,70 / −5,00 | B5a — koridordan adanın dış ucunun ötesine çekildi |
| `pad.garson3` | 14,70 / −5,00 | B5a |
| `lavabo.kapi` | 13,40 / −9,30 | B4 — pad + yükseltme noktası + müşteri hedefi aynı nokta |
| `lavabo.paraIstifi` | 13,40 / −8,40 | B4 |
| `servis.solDuvar.tezgah` | −16,20 / 6,40 | maket v13 adım 1-2 |
| `servis.solDuvar.tepsi` | −15,00 / 6,40 | D-025 |
| `servis.solDuvar.bulasik` | −16,20 / 10,60 | D-025 — bulaşık ocağın yanında |
| `servis.arkaBant.tezgah` | −13,00 / −10,30 | D-074 — küme mutfağın içine alındı, ön yüz bandın hattında |
| `servis.arkaBant.tepsi` | −13,00 / −9,30 | D-074 — erişim 0,85 br sabit kaldı |
| `servis.arkaBant.bulasik` | −7,40 / −10,30 | D-074 |
| `servis.arkaBant.garsonIstasyonu` | −9,90 / −10,30 | D-074 — tezgâhla aynı hizada |
| `personel.garsonBeklemesi` | −14,60 / −6,60 | B6a — yükseltme işaretinin üstünden çekildi |
| `personel.bulasikciBeklemesi` | −6,90 / −7,75 | B6a — iki işaret sütununun arasına |

---

## Donmayan şeyler (kasten)

Bunlar ölçü katmanında **değil**, o yüzden listede yok ve serbestçe değişebilir:

- **Dekor koordinatları** (`src/config/decor.ts`) — collision'ı, nav'ı, kaydı yok; katman 3.
- **Renk · materyal · ışık** (`palette.ts`) — gölge takımı dahil; katman 3.
- **Denge sayıları** (`economy.config.ts`) — katman 2'nin konusu; ölçü donduğu için artık
  ölçülebilir hâle geldi.
- **Yükseklikte duran dekorun asma bandı** — `WALL_H`'ın altında kalmak zorunda
  (`tests/layout-b6a.test.ts`), ama tek tek yükseklikleri serbest.

## Maket ile ilişki

Maket v13 (`docs/maket/maket-v13.html`) **arşivlendi**: Kat 1'in ölçü kaynağı olarak işi bitti.
Bundan sonra ölçü sorusunun cevabı maket dosyası değil **bu liste + kod**tur. Maket okunmaya devam
eder (program, sıra, atmosfer, malzeme fikri), ama ondan **yeni sayı transkribe edilmez** — oyunun
odası maketinkinden 0,5 geniş, karakteri 1,75 (maketinki 1,80), ve bu farklar bilinçli.

Kalıcı ders (D-075'ten): **maketten ölçü almadan önce insan boyunu karşılaştır.** Maketin
mobilyası 1:1 alındığında oyunun karakterinin yanında %38 büyük kalıyordu ve üç tur boyunca
yanlış kol (mobilyayı kısmak) çekildi.
