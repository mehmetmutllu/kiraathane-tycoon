# S9+S10 — ARAYÜZ DİLİ + SES KAYNAĞI · ölçüm raporu

**Tur:** S9 (ses assetleri) + S10 (UI tasarım dili) — kullanıcı ikisini tek araştırmada birleştirdi.
**Tarih:** 2026-09-10 · **Kod yazılmadı** (S10 tanımı gereği: araştırma + maket + onay).
**Araçlar:** `tools/shot-ui-s10.mjs` (ekran) · `tools/olcum-ui.ts` (çözümleme)
**Ham çıktı:** `docs/olcum-ui-ses.txt` · `docs/olcum-ui-ekran.json`
**Görsel tur:** `docs/gorsel/ss/s10-*.png` (6 kadraj)
**Maket:** `docs/arayuz-dili-maketi.html` · https://claude.ai/code/artifact/b690a386-80ff-4687-8951-0b9f0f5d2d6d

---

## Turun sorusu

Kullanıcı iki şikâyet verdi ve ikisi de HİS ifadesiydi:
*"panodaki seslere çok ısınmadım… para toplama vs güzel coin sesi gibi olsa güzel olur"* ve
*"hâlâ genel olarak UI çok kötü… mavi şart değil ama görsel olarak güzel ve çalışılmış hissettirsin."*

Bir his koda çevrilemez. Bu turun işi hissi **sayıya** çevirmek: arayüz neden "çalışılmamış"
hissettiriyor, ve coin sesinin neresi eksik?

İkisinin ortak sorusu aynı çıktı: **bu oyunun bir SİSTEMİ var mı, yoksa her parça kendi
kararını mı veriyor?** Arayüzde bunun ölçüsü kaç farklı gölge/punto/yarıçap çizildiği; seste
kaç farklı "sanatçı"nın konuştuğu.

---

## §Bulgular

| # | Bulgu | Sayı |
|---|---|---|
| **B1** | **Ölçek dağınıklığı** — kaç farklı görsel karar çiziliyor | **17 punto · 9 yarıçap · 27 gölge · 29 zemin · 23 metin rengi** = 108 karar (sistemli karşılığı ~29) |
| **B2** | **Palet kütlesi** — "kahverengi/iç karartıcı" (G-16) | zeminlerin **%92,7**'si h **31°** çevresindeki **60°**'lik tek dilimde · **R = 0,91** · ort. açıklık %42,3 |
| **B3** | **Kabuk boyu** — "ekranlar tutarsız" (G-17) | 5 ekran, **4 farklı yükseklik** (430 · 471 · 530 · 675 · 675 px) → ekranın %50,9…%80,0'i |
| **B4** | **Kontrast** | **45/184** metin öğesi WCAG AA altında (**%24,5**) · en düşük 2,32 : 4,5 (`navtab-bang`) |
| **B5** | **Oyun fontu sızıntısı** | **13 öğe Arial'a düşüyor** — `button` font-family mirası yok; sızanlardan biri **görev şeridi** |
| **B6** | **Kendi kuralımızın ihlali** | **17 metin glifi** + mağaza panelinde **🔒 EMOJİ** (plan §9: yalnız SVG) |
| **B7** | **Krom kaplaması** | **%23,1** — sağlıklı. Sorun kromun MİKTARI değil KALİTESİ; yeni tasarım bunu büyütmemeli |
| **B8** | **Coin sesi** | **0,111 sn · 2 katman** · katalogun en kısa 2. sesi · **çoklu toplamada perde basamağı YOK** |
| **B9** | **Ortam sesi** | katalogda **9/9 tek atış**, döngü YOK · `settings.music` **hiçbir sese bağlı değil** (3 referans, hepsi kayıt) |
| **B10** | **Lisans yüzeyi** | bugün **0 dosya** · **Pixabay ve Zapsplat ELENDİ** (CC0 değil) · CC0 kalan kollar: S-B / S-C / S-D |

---

## Bulguların okunması

### ① "UI çok kötü" bir renk şikâyeti değil, bir SİSTEM şikâyeti (B1)

En sert sayı B1. 390 piksel genişliğinde bir telefon ekranında **17 farklı punto** çiziliyor:
9,5 · 10 · 10,5 · 11 · 11,5 · 12 · 12,5 · 13 · 13,5 · 14 · 14,5 · 15 · 16 · 17 · 21 · 22 · 30.
Yarım piksel adımlar (10,5 → 11 → 11,5) bir ölçek DEĞİLDİR; göz o farkı seçemez. Onlar tek tek,
o bileşen yazılırken "biraz büyük geldi" diye ayarlanmış değerlerdir — ve bir tasarım sisteminin
yokluğunun matematiksel kanıtıdır.

Aynısı gölgede daha beter: **27 farklı `box-shadow`**. Yani neredeyse her bileşen kendi
gölgesini uyduruyor. Bir arayüzün "çalışılmış" hissettirmesi, aslında büyük ölçüde bu:
**az sayıda kararın çok yerde tekrarlanması.** Bugünkü arayüzde tekrar yok, çeşitlilik var.

Bu, işin iyi haberi de: B1'in tamamı **mekanik olarak düzeltilebilir** ve hiçbir tasarım
tercihine bağlı değil. 17 punto → 6 basamaklı bir ölçek, 27 gölge → 3 yükseklik kademesi.

### ② Palet: sorun "kahverengi" değil, KÜTLENİN TEK YÖNE BAKMASI (B2)

Kullanıcı "kahverengi = iç karartıcı" dedi ve haklı çıktı ama sebebi tahmin ettiğinden farklı.
Zemin renklerinin **%92,7'si** renk çemberinde h 31° çevresindeki **60°'lik tek dilimde**;
bileşke vektör boyu R = **0,91** (1 = hepsi tam aynı yöne bakıyor). Ekranda hiçbir yüzey bir
başkasından **renkle** ayrılmıyor — ayrım yalnız açıklıkla yapılıyor ve ortalama açıklık da
düşük (%42,3). Sonuç: her şey tek bir kahverengi lekeye düşüyor.

**Aracın kendisi burada bir tuzağa düştü ve düzeltildi** (kayda geçsin): ilk koşuda "renk yayı
216°" yazıyordu — yani palet GENİŞ görünüyordu — ama aynı çıktının bir satır altı "sıcak payı
%93,1" diyordu. İkisi çelişmiyordu: yay **uçları** ölçüyor, pay **kütleyi**. Tek bir yeşil rozet
ve tek bir mavi ipucu yayı 216°ye açıyordu. Ölçü ağırlıklı hâle getirildi ve paragraf artık
sayıdan türetiliyor.

**Görsel tur bunu doğruladı ve bir şey daha gösterdi:** Hedefler panelindeki tek açık mavi kart
("Usta masalar") ekranın tek soğuk öğesi. Öne çıkıyor — ama bir sisteme ait olduğu için değil,
**başka bir uygulamadan yapıştırılmış gibi durduğu için.** Yani bugün arayüzde renk zaten
"aksan" olarak kullanılmıyor; kazara kullanılıyor.

**Sonuç:** mavi ZORUNLU değil (kullanıcı da öyle dedi). Gereken şey kütleyi dağıtmak — nötr bir
gövde + **tek** doygun aksan. Sıcak kimlik korunarak da R düşürülebilir.

### ③ G-17 yanlış sorulmuş bir soru (B3)

Geri bildirim "ekranlar tutarsız, ya tam ekran ya modal olsun" diyordu. Ölçüm bunu çürüttü:
**beş ekranın beşi de zaten aynı kabuk** (alt sayfa), beşinde de aynı kapatma jesti (✕ + arkaya
tıklama), beşinde de aynı 22 px yarıçap. Kabuk tipi tutarlı.

Tutarsız olan **BOY**: 430 · 471 · 530 · 675 · 675 px. Her sekmede panelin üst kenarı başka bir
yere zıplıyor. "Tutarsız" hissi buradan geliyor — modal/tam-ekran seçiminden değil.
**Bu, seçenek sorulmadan düzeltilebilecek bir kusurdur:** tek bir yükseklik kuralı.

### ④ Görev şeridi Arial (B5) — tek satırlık bir kusur, en görünür yerde

`<button>` elemanları `font-family`'yi **miras almaz** ve projede hiçbir kuralda
`button { font-family: inherit }` yok. Görev şeridi (`.band`) bir `<button>` — yani **oyunun en
çok okunan metni** tarayıcı varsayılanı Arial'da çiziliyor. `.sheet-x`, `.qbig-title`,
`.qbig-kicker` de aynı sebeple sızıyor: toplam 13 öğe.

`feedback_ui_game_feel`in "system-ui font = AI slop" dediği şey tam olarak bu ve **kazara**
olmuş. Görsel turda çıplak gözle görülüyor (`s10-hud.png`: "Ocaktan çay al").

### ⑤ 🔒 emoji (B6) — kendi yazdığımız kuralın ihlali

Plan §9 ve `feedback_ui_game_feel`: *"emoji ve CSS ikon YOK, her simge SVG."* Mağaza panelinde
`HUD.tsx:1001` ve `1007`'de **🔒 emoji** çiziliyor. Görsel turda (`s10-magaza.png`) elle çizilmiş
kahve/krem bir panelin ortasında mor-turuncu bir sistem emojisi duruyor — turun **gözle en çabuk
görülen** kusuru. Ayrıca ✕ · → · ↺ · ₺ metin glifi olarak çiziliyor (17 adet).

### ⑥ Coin sesi: eksik olan SÜRE değil, ZİNCİR ve BASAMAK (B8)

Bugünkü `coin` 0,111 sn ve 2 katman — kataloğun en kısa ikinci sesi. **Bu bir kusur değil:**
saniyede birden çok kez çalıyor (`aralik` 0,06 sn), uzun olsa yığılırdı. D-096 zaten seslerin
birbirinden ayırt edildiğini ölçmüştü ve o ölçüm hâlâ ayakta.

Kullanıcının istediği "güzel coin sesi" iki başka şey:

1. **Gövde/zincir.** Piyasa tycoon'larının para sesi tek bir tık değil kısa bir OLAY zinciridir:
   tık → metalik tınlama → çok kısa "kasa/onay" kuyruğu. Bugünkü coin zincirin yalnız ilk
   halkası (metalik tık + tiz geçiş).
2. **Çoklu toplamada PERDE BASAMAĞI.** Ölçüm bunu doğruladı: `basamak/perde` mantığı kodda
   **YOK** — art arda toplanan her para birebir aynı perdede çalıyor. Oysa bu türün imzası,
   üst üste toplarken perdenin basamak basamak yükselmesidir; "yığın" hissini veren şey odur.
   Bu, **kaynaktan bağımsız** bir eksik: dosya da koysak, basamak olmadan yığın hissi doğmaz.

### ⑦ Ortam sesi yok ve `settings.music` boşa dönüyor (B9)

Katalogdaki 9 sesin 9'u tek atış; sürekli ses yok. `settings.music` üç yerde geçiyor ve üçü de
kayıt/ayar satırı — hiçbir sese bağlı değil. Kullanıcının istediği "kalabalık uğultusu" bu
kabloyu da kapatır. D-096 bunu bilerek kapsam dışı bırakmıştı ("kablo eksik, kabiliyet değil").

### ⑧ Lisans: iki popüler kaynak turun içinde ELENDİ (B10)

- **Pixabay — ELENDİ.** CC0 **değil**; kendi "Content License"ı içeriğin *Standalone* dağıtımını
  yasaklıyor, marka/logo taşıyan içeriği ticari kullanımdan çıkarıyor ve metnin kendisi "yalnız
  tam lisans bağlayıcıdır" diyor. CLAUDE.md kuralı net: **belirsiz hiçbir asset commit'lenmez.**
- **Zapsplat — ELENDİ.** Ücretsiz katmanda künye **zorunlu** ve lisans CC0 değil.
- **Ayakta kalanlar:** Kenney (CC0, tek sanatçı) · Freesound CC0 süzgeci · OpenGameArt (ses ses
  lisans doğrulaması ister).

---

## Kollar

### SES — dört kol

| Kol | Ne | Sanatçı | Lisans | Dosya | Stil kilidi |
|---|---|---|---|---|---|
| **S-A** | Sentez kalsın; coin zincir + basamak kazansın, ortam sentezle üretilsin | 1 (motor) | yok (kod) | 0 | korunur |
| **S-B** | Hibrit: yalnız **coin + ortam** dosya, gerisi sentez | 2 | CC0 | 2 | **kırılır** |
| **S-C** | Tek CC0 sanatçı seti (Kenney) baştan sona | 1 (Kenney) | CC0 | 9+ | korunur |
| **S-D** | Serbest CC0 derleme (Freesound/OGA, ses ses seçilir) | 9'a kadar | CC0 | 9+ | **kırılır** |

Kaynak künyeleri: Kenney *Interface Sounds* (100 ses, CC0, 2020) · Kenney *Casino Audio*
(50 ses, CC0, kart/zar/**jeton** foley) · Freesound CC0 "cafe crowd ambience" (44 sonuç, çoğu
48 kHz stereo, biri açıkça *loopable*). Hepsi 2026-09-10'da okundu.

**Her dört kolda da ayrıca yapılması gerekenler** (kaynaktan bağımsız, B8/B9):
çoklu toplamada perde basamağı · `settings.music` kablosunun bağlanması.

### UI — üç soru

- **U-1 palet yönü** — kütleyi nasıl dağıtacağız (B2'yi düşüren yön)
- **U-2 kabuk kuralı** — B3'ün cevabı; ayrıca tam-ekran/modal sorusunun hâlâ sorulup sorulmayacağı
- **U-3 pad şekli** (G-10) — yuvarlak mı köşe-parantezli kare mi

**Seçenek sorulmadan düzeltilecekler** (tasarım tercihi değil, kusur): B1 ölçek · B3 tek boy
kuralı · B4 kontrast · B5 Arial · B6 emoji/glif. Bunlar S11'in işi.

---

## KARAR

*(KISMEN DOLU — aşağıdaki DÜZELTME bölümüne bakın. İki kol hâlâ açık.)*

---

## DÜZELTME — ilk maket yanlış soruyu sordu (2026-09-10, aynı tur)

Kullanıcı palet sorusunu reddetti ve turu yeniden yönlendirdi:

> *"Sen şunu anlamadın, mesele renk değil. **Şekil.** Alttaki bar çok büyük geldi gözüme.
> Birine basınca alttan gelmesi kötü duruyo, **mağaza gibi hissettirmiyo**. Tam ekran veya modal
> gibi olsun istiyorum, bu yüzden de internetten UI asset bul dedim. My Hotel veya Subway
> Surfers gibi."*

**Ölçüm doğruydu, sorusu yanlıştı.** §Bulgular'daki on satır ayakta; ama turun ağırlığı renk
kütlesinden (B2) **biçime** kaydı. Palet kolu (U-1) masadan kalktı — renk, biçim çözülünce onun
içinden çıkar. Ders: bir ölçüm aracı doğru sayıyı üretip yanlış soruyu yanıtlayabilir; kolları
seçerken kullanıcının cümlesindeki **isimler** (bar · alttan gelme · mağaza hissi) kola
çevrilmeliydi, benim çıkardığım soyutlamalar değil.

### Asset araştırmasının dürüst sonucu

Kullanıcının iki kez istediği "internetten UI asset" **bulunamadı ve bulunamayacağı ölçüldü**:

| Kaynak | Ne var | Lisans | Uyar mı |
|---|---|---|---|
| Kenney *UI Pack* | 430 parça, düz/mat, ince kontur | CC0 | **Hayır** — referansların tersi: kabartmasız, gölgesiz |
| Kenney *UI Pack · Adventure* | 130 parça, ahşap/parşömen | CC0 | Kısmen — tema RPG, tycoon değil |
| itch.io ücretsiz GUI | ilk 20 sonucun **16'sı piksel-art** | karışık | **Hayır** — 3B low-poly sahneyle çelişir |
| OpenGameArt UI | RPG/sci-fi panel setleri | ses ses doğrulanmalı | **Hayır** — tür uyuşmuyor |

Sebep: Subway Surfers / My Perfect Hotel arayüzü satın alınmış bir kit değil, o oyunlar için
çizilmiş. Ama o görünümün **kuralları** var ve beş maddeye iniyor — ve bu beş kural, B1'in
108 kararını ~29'a indiren şeyin ta kendisi:

| # | Kural | Bugün | Gramer |
|---|---|---|---|
| 1 | Kontur her şeyin etrafında, koyu ve kalın | 1 px açık pirinç | **2,5 px koyu ceviz** |
| 2 | Gölge bulanık değil, **kaydırılmış katı** | 4 px bulanık, 27 çeşit | `0 4px 0`, tek çeşit |
| 3 | Kabartma: üstte ışık, altta oyuk | yalnız üstte, silik | iki taraflı, belirgin |
| 4 | Yarıçap büyük ve az basamaklı | 9 basamak, 8…22 px | 3 basamak: 14 · 22 · tam |
| 5 | Simge büyük, metin küçük | 19–25 px simge, 17 punto | 28 px simge, 6 punto |

### Yeni kollar (maketle gösterildi)

**Alt gezinme** — bugün `390×70 px`, ekranın **%8,3'ü**, tam genişlikte kesintisiz levha:

| Kol | Ne | Ekran payı |
|---|---|---|
| **A** | bugünkü levha, etiketli, 70 px | %8,3 |
| **B** | kompakt hap: kenarlardan içeri çekilmiş, etiketsiz, 46 px | **%5,5** |
| **C** | bar yok, sağ altta yüzen üç yuvarlak düğme | %4,1 |

**Mağaza içi** (tam ekran K3 seçildikten sonra kalan soru):

| Kol | Ne | Ürün önizlemesi |
|---|---|---|
| **M1** | ızgara: 6 ürün, her kartın kendi fiyat düğmesi | ~74 px |
| **M2** | büyük önizleme + seçim şeridi + tek büyük satın alma | **~230 px** |

### Kullanıcının verdiği kararlar

- **K3 — tam ekran** (sol üstte geri, sağ üstte para). Ölçüm K3'ü önermiyordu (kabuk zaten
  tutarlıydı, krom kaplaması sağlıklıydı); kullanıcı sahne görünürlüğü yerine "gerçek ekran"
  hissini seçti. Karar kullanıcınındır.
- **Y2 — köşe-parantezli kare pad.**
- **Ses: "en kalitelisi olsun, şu anki ses çok kötü"** + *"fazla para topladıkça ses de ivme
  almalı, fazla topladığını sezgisel olarak hissettirmek için."* İki ayrı iş:
  ① **seri ivmesi** (kaynaktan BAĞIMSIZ, kod): ~1,2 sn'lik seri penceresinde her toplama perdeyi
  bir basamak yükseltir, üst sınırda durur, seri kesilince tabana döner.
  ② **kaynak → S-C** (tek CC0 sanatçı seti: Kenney *Interface Sounds* 100 + *Casino Audio* 50).
  **Bu, D-096'nın "sentez nihaidir" kararını geri alır** — gerekçe: kullanıcı sentezi oyunda
  duydu ve reddetti; D-096 ③B'nin "ölçülmemişle değiştirme" itirazı, ölçülenin beğenilmediği
  durumda geçerliliğini yitiriyor.

**Açık kalan iki soru:** alt gezinme (A/B/C — önerim **B**) · mağaza içi (M1/M2 — önerim **M2**).

---

## ASSET İNDİRME TURU (2026-09-10, aynı tur) — "sen çizme, hazır assetleri değerlendirelim"

Kullanıcı önceki bölümdeki "aradığın görünüm indirilebilir bir kit değil" sonucunu kabul etmedi ve
haklıydı: o sonuç **dört sayfa okunarak** çıkarılmıştı, hiçbir paket indirilmemişti.
**Sekiz paket indirildi, açıldı, içine bakıldı** (PowerShell; Bash'in ağı yok —
`project_network_powershell`).

**Pano:** `docs/paketten-cikanlar.html` · https://claude.ai/code/artifact/e2917b1e-64c9-4f9f-96e6-7d3ba5a719a9

| Paket | İçerik | Lisans |
|---|---|---|
| Kenney UI Pack | 870 PNG · **434 SVG** · 6 ses | CC0 |
| Kenney UI Pack · Adventure | 260 PNG · 128 SVG | CC0 |
| Kenney UI Pack · RPG | 90 PNG (9-dilim çubuklar) | CC0 |
| Kenney Game Icons | 425 PNG (tek renk siluet) | CC0 |
| Kenney Interface Sounds | 100 ses | CC0 |
| Kenney RPG Audio | 50 ses | CC0 |
| Kenney Casino Audio | 54 ses | CC0 |
| Kenney Music Jingles | 85 jingle | CC0 |

### Ölçümün iki iddiası ÇÜRÜDÜ

1. **"Kenney UI Pack düz, mat, kabartmasız."** Yanlış — `button_*_depth_gloss` ve
   `depth_gradient` var, altı renkte. Doğru olan kısım: **kalın koyu kontur yok**, chunky hissin
   asıl kaynağı o. Aradığı şekle en yakın parça `Adventure/button_brown` (kalın kahve çerçeve +
   krem iç) ve o zaten ahşap dilinde.
2. **"Casino Audio jeton foley'i taşıyor, coin için uygun."** Yanlış — plastik poker jetonu, kart
   ve zar. Madenî para yok. Ama boşa gitmedi: **okey/tavla (Kat 2) için birebir.**

### Beklenmedik eşleşme: RPG Audio

`handleCoins` + `handleCoins2` (**gerçek madenî para**) · `metalPot1-3` (**semaver**) ·
`doorOpen/Close` (**kapı — bugün ses YOK**) · `footstep00-09` (**yürüyüş — bugün ses YOK**) ·
`metalClick`. Interface Sounds'tan `glass_001-006` (**bardak servisi**). Yani kıraathanenin
yaşam döngüsü tek bir CC0 sanatçının paketlerinden karşılanıyor — stil kilidi korunuyor.

**Kalıcı boşluk:** akan sıvı sesi (çay dökme) hiçbir pakette yok → `pour` sentezde kalır.

### Yeni araç: `tools/ses-disari.ts`

D-096 sesleri ölçtü ama kimse karar anında **duyamıyordu** — "panodaki seslere ısınmadım"ın
sebebi buydu. Araç `audioSynth.seslendir()`in TAM tamponunu WAV'a yazar (ölçülen = duyulan,
D-096 §6) ve ayrıca **seri ivmesi örneği** üretir: beş toplama düz perde vs beş toplama yarım-ton
basamaklı. Pano bu ikisini ve Kenney kaydının canlı `playbackRate` basamağını yan yana dinletiyor.

**Paketler henüz repoya EKLENMEDİ** — seçim yapılınca yalnız kullanılacak dosyalar künyesiyle
`public/assets/` altına girer.

---

## CHIP'SİZ ÜST ŞERİT (2026-09-10, aynı tur)

Kullanıcı Unity Asset Store'dan bir kit paylaştı (**2D Mobile Game UI Kit**, 300Mind, ücretsiz —
`assetstore.unity.com/packages/2d/gui/2d-mobile-game-ui-kit-355774`) ve yeni bir istek ekledi:
*"bizim üstteki veriler bar içinde değil, öyle **direk oyun üstünde** olsun istiyorum."*

**Maket:** `docs/chipsiz-hud-maketi.html` · https://claude.ai/code/artifact/d8440214-e478-4ebd-9abe-a7772f57b958

### Bu, D-023'ün bir maddesini GERİ ALIR

D-023 (2026-06-10, kullanıcı onaylı) şunu diyordu: *"sağ-üst para+elmas AYNI pill ailesinde chip
(hiza piksel-eş)"*. Yani chip'li üst şerit bir bozulma değil, **onaylanmış kararın kendisiydi.**
Bugünkü istek onu geri alıyor. Eski karar silinmez, geri alındığı not edilir.

### Kutunun görünmeyen işi: OKUNABİLİRLİK

Chip yalnız bir çerçeve değildi — metnin arkasına koyu bir zemin koyup her sahnede okunmasını
sağlıyordu. Kutu kalkınca o işi **kontur** devralmalı:
`-webkit-text-stroke: 5px` + `paint-order: stroke fill` + 2 px katı gölge; beyaz dolgu, koyu kontur.
Teknik projede **zaten var** (`index.css`'teki konturlu oyun yazısı), chip'lerin içinde kaldığı için
işe yaramıyordu. Maket dört zeminde sınadı: açık ahşap · yeşil çuha · koyu ceviz · badana —
dördünde de okunuyor, çünkü açık zeminde kontur, koyu zeminde dolgu taşıyor.

### Lisans: Unity Asset Store EULA bizi ENGELLEMİYOR

EULA varlığın *"Asset Store dışından gelen özgün içerikle birlikte bir elektronik uygulamaya"*
katılmasına izin veriyor; Unity motoru şartı **yok**. Sınır: varlık ürünün "substantial portion"ı
olamaz (bizde UI kromu, sorun değil). Yani üç yol da hukuken açık.

### Üç yol ve öneri

| Yol | Ne | Değerlendirme |
|---|---|---|
| **1** | Paketi olduğu gibi entegre et | PNG geldiği için **palet kilidi**; kıraathanenin sıcak ahşabına boyanamaz. Kit *bileşen* verir, *ekran* vermez — yerleşimi yine biz kurarız. |
| **2** | **Bizimkini bu tarza çevir + ikonları hazır paketten al** | **ÖNERİ.** Gövde CSS'te kalır ama şekil grameri kitten alınır (kalın kontur · katı kaydırılmış gölge · iki taraflı kabartma · büyük yarıçap). Her çözünürlükte keskin, her renge boyanabilir, APK şişmez. İkonlar hazır paketten — G-15'in ("SVG'ler zayıf") çözümü orada. |
| **3** | Sadece ikonları al | Yetmez: 108 farklı görsel karar (17 punto · 27 gölge) ikon değiştirerek düzelmiyor. |

**Gerekçe:** kitin değerli kısmı dosyaları değil **şekil dili**; onu kopyalamak için indirmeye
gerek yok ve indirirsek renk özgürlüğünü kaybediyoruz. İkon başka mesele — orada hazır asset
gerçekten kazandırıyor.
