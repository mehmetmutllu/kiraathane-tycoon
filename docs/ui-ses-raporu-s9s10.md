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

**DOLU** (2026-09-14) — turun bütün kararları en alttaki *ALT GEZİNME* bölümünde toplandı:
ses **S-C** (Kenney tek sanatçı; coin = RPG Audio `handleCoins`) + seri ivmesi · ekran **K3** tam ekran ·
mağaza içi **M2** · pad **Y2** · kit **yolu 2** (biçimi al, dosyaları alma) · **G-18** masanın kendi
noktası vurgulanır · alt gezinme **geometrisi bugünküyle aynı kalır** (A/B/C elendi).
Tek açık kalem: alt gezinme **paleti** (P1/P2/P3 ölçüldü, kullanıcı seçecek → S11).
Karar künyesi: `decisions.md` **D-106**.

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

---

## ALT GEZİNME — geometri kapandı, palet ölçüldü (2026-09-14, turun kapanışı)

Karar paketi sunuldu (kol | sayı | takas | öneri). **Üç kalem kapandı, dördüncüsü soruyu değiştirdi.**

### Kapanan kararlar

| Soru | Seçilen | Elenen | Gerekçe |
|---|---|---|---|
| Mağaza içi | **M2** — büyük önizleme + seçim şeridi + tek satın alma | M1 ızgara | Ürün önizlemesi ~74 → **~230 px** (3,1×). Satın alınan şey görünür hâle geliyor; bedeli tek seferde tek ürün. |
| Kit yolu | **2** — biçimi al, dosyaları alma | 1 doğrudan entegre · 3 sadece ikon | Kitin değerli kısmı şekil dili; PNG entegrasyonu **palet kilidi** getiriyor. İkonlar Kenney'in **434 CC0 SVG**'sinden. |
| G-18 masa seviyesi | **Masanın kendi noktası vurgulanır** | havada seviye kartı · hiçbir şey | Dünyaya yeni yüzen arayüz öğesi girmiyor (`feedback_interaction_model`); seviye zaten mekânsal noktanın yanında okunuyor. |

### Dördüncü kalem: soru A/B/C değildi

Kullanıcı alt gezinme kollarını seçmedi, **soruyu düzeltti**:

> *"bugünki gibi ama tasarımı daha güzel olsun şu an kötü. renkler de bilemedim — mağaza açılınca
> mor iyi ama olduğu yerde iyi mi bilmiyorum."*

İki şey birden söylüyor ve ikisi ayrı: **geometri kapandı** (bugünkü tam-genişlik levha kalıyor;
kompakt hap B ve yüzen düğme C elendi), **biçim + palet açıldı**. Bu, `feedback_ui_form_not_color`
kuralının üçüncü kez doğrulanması: kullanıcının cümlesindeki isimler doğrudan kola çevrilir.

### Yeni ölçüm: bar, sahnenin karşısında

Araç `tools/olcum-altnav.mjs` · ham çıktı `docs/olcum-altnav.txt` ·
maket `docs/alt-gezinme-maketi.html` · https://claude.ai/code/artifact/7e1aded9-9387-4f51-a95c-25787fbe95fb

Ölçünün fikri: bir barın rengi tek başına değil, **arkasındaki sahneye karşı** yargılanır. Gerçek
oyun karesinin (`s10-hud.png`) barın hemen üstündeki 72 px'lik şeridi okundu — sahnenin baskın rengi
**h 23°**, doygunluk %36, açıklık %20.

| Kol | Gövde | Δh sahneden | Doygunluk | ΔL | Etiket | Aktif | Ne ödüyor |
|---|---|---|---|---|---|---|---|
| **Bugün** | rgb(38,27,19) | **2°** | %33 | 8 | — | — | Bar sahnenin renk diliminde; ayrım yalnız açıklıkla. Aktif sekme okunmuyor. |
| **P1** ceviz | rgb(58,35,18) | **2°** | %53 | 5 | 11,22 | 6,66 | Biçim düzelir, **renk bulgusu barda aynen durur**. |
| **P2** gece nötr | rgb(36,34,42) | **128°** | **%11** | 5 | **13,25** | 6,66 | Gövde renkten çıkar, sıcaklık **tek aksana** iner — B2'nin reçetesi. |
| **P3** mor-lacivert | rgb(52,44,108) | **136°** | %42 | **−10** | 9,83 | 7,49 | Tek leke çözülür ama yerine **ikinci renk kütlesi** kurulur; bar sahneden açık kalıyor. |

**Bugünkü barın Δh'ı 2°.** "Bar sahnenin devamı gibi duruyor" şikâyetinin sayısı budur ve B2'nin
(R = 0,91) barda görünen hâlidir.

**Üçü de WCAG AA geçiyor** (en düşük 6,66) — yani okunabilirlik seçimi belirlemiyor; B4'ün 45/184'ü
biçim gramerinin kendisiyle kapanıyor. Seçimi belirleyen tek sayı **Δh**.

**"Mor olduğu yerde iyi mi?" sorusunun cevabı:** mağaza tam ekranda mor **tek başına** — karşısında
kıraathane yok. Sahnenin üstünde ahşabın yanında **ikinci bir kimlik** kuruyor (Δh 136°) ve ΔL −10
ile sahneden açık kalıyor. P2 aynı ayrışmayı (128°) **renk kurmadan** yapıyor. **Öneri P2**; mor
gerçekten istenirse yeri mağaza gibi tam ekranlar, sürekli görünen bar değil.

**AÇIK:** palet seçimi (P1 / P2 / P3) — kullanıcı maketi görüp seçecek, uygulama S11'in turu.

---

## MOR ARAYÜZ — kapsam kararı (2026-09-14, aynı tur)

Kullanıcı alt gezinme maketini gördü ve kolu seçmek yerine **kapsamı büyüttü**:

> *"mor bayağı iyiymiş, direkt oyun temasını o kahverengiden mora çevirsek?"*

**Karar: mor = ARAYÜZÜN dili, 3B dünya sıcak kalır.**

Maket: `docs/mor-arayuz-maketi.html` · https://claude.ai/code/artifact/6cc7a95e-c0a3-4802-8ea3-99398d637981

### Neden dünya değil

Alt gezinme ölçümü P3'e "tek leke çözülür ama yerine **ikinci bir renk kütlesi** kurulur" demişti.
Bu bir *mor* sorunu değil bir **yalnızlık** sorunu: mor tek bir bileşende durduğunda kaçak leke.
Arayüzün tamamına yayılınca leke olmaktan çıkıp **katman** oluyor — sıcak ahşap dünyanın kimliği,
mor arayüzün kimliği. Bugünkü kusur zaten tersiydi: arayüz sahneyle **aynı** renkti (Δh 2°).

3B dünyanın mora çevrilmesi üç yazılı sebeple elendi:
- Dünyanın rengi bizim değil **KayKit'in paleti**. S3'te tam tersi denenmişti (modelleri kıraathane
  tonuna boyayan varyant üretildi ve kullanıcı reddetti: *"her şey çok kahve kalıyor"*); karar
  paketin kendi canlı paleti kalsın, renk varyantı **tema olarak satılsın** oldu (D-099).
- Mor bir kıraathane artık kıraathane gibi okunmuyor — `projectBrief`in çekirdek hedef hissi.
- 185 model + doku atlası; S12/S13'ün önünü tıkar.

### Maketin gösterdikleri (beş ekran, gerçek içerikle)

Tek sayfada: oyun ekranı (gerçek kare üstünde) · Görevler · Hedefler · Mağaza M2 · Mağaza kilitli ·
Çaycı. Hepsi **bugünkü gerçek metin ve sayılarla** çizildi.

| Karar | Makette görünen hâli |
|---|---|
| **K3** tam ekran | Dört ekranın dördü; alt sayfa kabuğu kalktı, tek kabuk (geri · başlık · cüzdan) |
| **M2** mağaza | Önizleme 230 px + seçim şeridi + tek büyük satın alma |
| **Kit yolu 2** | Kalın kontur · katı kaydırılmış gölge · iki taraflı kabartma · 17 px yarıçap — PNG kullanılmadan |
| **Chip'siz üst** | Para/elmas/seviye doğrudan sahnenin üstünde; okunabilirliği **kontur** taşıyor |
| **Alt bar** | Geometri bugünküyle birebir; yalnız dili değişti |
| **B6** 🔒 emoji | Çizilmiş asma kilide döndü |
| **B1** 108 karar | Punto 17 → **6** · gölge 27 → **3** · yarıçap 9 → **3** |
| Tek aksan | Amber; yeşil yalnız **ilerleme** anlamında, mavi yalnız **elmas** |

**Palet (S11'in uygulayacağı):** gövde `#463C86`→`#221B52` · kart `#3A3178`/`#2E2764` ·
oyuk `#1B1443` · kontur `#100B2E` · aksan `#FFC24B`→`#E09415` · metin `#EAE3FF`/`#A99FD8` ·
ilerleme `#7BD46A`→`#4FA83E` · elmas `#7FD9FF` · para `#FFD45E`.

**Maketin dürüstlük notu:** oyun ekranı karesinde eski HUD'ın chip'leri, karenin **kendi duvar
rengiyle** örtüldü (sol 178,161,125 · orta 188,169,130 · sağ 173,153,116 — kareden ölçüldü).
Sahnenin kendisine dokunulmadı. Denge sayıları da bugünkü oyundan: tepsi 75 · mıknatıs 200 ·
hız 400 · günlük ödül 3/4 💎 · İtibar 0/60. **G-06 (tepsi 75 → ~50) bilerek değiştirilmedi.**

### İkon seti yeniden çizildi (aynı tur, kullanıcı isteği)

> *"ikonların bazıları anlaşılır değil gibi… mesela sağ en üstteki ayarlar kötü duruyor"*

**Tek gramer:** 24×24 ızgara · kontur **2,2** · hiçbir detay **2 birimden ince değil** · düz dolgu ·
**aksan her ikonda yalnız bir yerde**. Çarkın dişleri elle değil **hesaplanarak** çizildi
(8 diş, dış yarıçap 10,4, iç 7,8) — eski çark çok dişli bir yıldızdı ve 21 pikselde lekeye dönüyordu.

**Gerçek boyda sınandı ve üçü düzeltildi** (maketteki ikon sayfası her ikonu hem 64 px'te hem
oyundaki gerçek boyunda gösteriyor):

| İkon | Kusur | Düzeltme |
|---|---|---|
| Hedefler | 26 px'te üç ince halka birbirine giriyordu | disk + koyu iç disk + aksan gözbebeği |
| Para | ortadaki düz çubuk 17 px'te **yarık** gibi okunuyordu | iç elips (madenî para kenarı) |
| Elmas | iki çapraz kesim çizgisi 16 px'te tırtık yapıyordu | yalnız kuşak çizgisi |

**Kenney paketi neden kullanılmadı:** D-106 ikonların hazır CC0 paketten geleceğini söylüyordu,
ama aynı ölçüm Kenney UI Pack için *"kalın koyu kontur yok, chunky hissin asıl kaynağı o"* demişti.
Yani paketin ikonları bu gramere girmek için zaten yeniden konturlanacaktı; üstelik paketler bu
makinede yok (repoya hiç girmemişlerdi). Set doğrudan bu gramerde çizildi, paket S11'de **şekil
kaynağı** olarak açık kalıyor.

**Aynı turda düzelen iki şey daha:** değer yığını üstteki duvar şeridini aşıyordu (82 px'e sığdı) ·
görev çubuğundaki `0/1` sayacı geri geldi.

---

## S11 — MOR DİL KODA GİRDİ (2026-09-14, uygulama turu)

D-107/D-108 **kod yazılmadan** alınmış kararlardı; bu tur onları uyguladı. Görev kullanıcının
kuralı gereği ikiye bölündü: **S11 = DİL** (token · palet · font · ikon), **S12 = YAPI**
(K3 tam ekran · M2 mağaza · Y2 pad · chip'siz üst şerit). Ekranların yapısına DOKUNULMADI —
sayfalar hâlâ alttan açılıyor; değişen yalnız neyle çizildikleri.

### §Bulgular — taban ↔ sonra (ikisi de `tools/shot-ui-s10.mjs` tam koşusu, 390×844)

| Ölçü | Taban (S10) | S11 | Hedef (D-107) |
|---|---:|---:|---|
| punto (ekranda çizilen) | 17 | **5** | 6 basamak |
| gölge (box-shadow) | 27 | **3** | 3 kademe |
| yarıçap (hesaplanan dizge) | 9 | **6** | 3 kademe |
| font ailesi | 3 | **2** | 2 (oyun + rakam) |
| zemin rengi | 29 | **10** | — |
| metin rengi | 23 | **8** | — |
| SVG simge | 33 | **35** | — |
| metin glifi | 17 | **13** | 0 (ikon yerine geçen) |
| AA altı metin | 45/184 | **12/177** | 0 |

**Üç sayı olduğu gibi okunmamalı, künyesi var:**

- **punto 5, çünkü altıncı basamak (30 px) ölçülen ekranlarda çizilmiyor.** `--p6` yalnız ödül
  tutarında kullanılıyor (`.modal-amount` · `.reward-amount`) ve ölçüm ödül ekranını açmıyor.
  Tanımlı 6, çizilen 5 — bekçi testi tanımı sayar (`4b`), ölçüm ekranı.
- **yarıçap 6, çünkü ölçüm HESAPLANAN DİZGEYİ sayıyor, basamağı değil.** Altısı şunlar:
  `10px` · `17px` · `22px` (üç basamak) + `999px` (hap) + `50%` (daire) + `22px 22px 0 0`
  (sayfanın yalnız üst köşeleri). Hap ve daire bir ölçek basamağı değil BİÇİMDİR; sayfanın
  köşe-başı yazımı da aynı `--r3`ün kendisi. Yani D-107'nin "3 kademe"si tutuyor, ölçümün
  sayacı ondan başka bir şey sayıyor.
- **glif 13, ve ikisi bilerek kalıyor.** Kalanların örnekleri `+` ve `₺` — biri `+%0,4`
  (gelir bonusu), öteki `400 ₺ kazan` (günlük görev metni, `economy.config.ts`). İkisi de bir
  simgenin yerine geçmiyor, cümlenin kendisi; SVG'ye çevirmek metni bozar. B6'nın adını koyduğu
  glifler — `🔒` `✕` `↺` `✓` `→` `•` — gitti. Bekçi bu ayrımı liste olarak taşıyor.

### Uygulanan

| Kalem | Ne yapıldı |
|---|---|
| **Palet** | `index.css :root` = arayüzün TEK renk kaynağı. D-107'nin dokuz rengi + dört tane daha (aşağıda). Eski `--ink` `--cream` `--gold-*` `--green-*` `--w-*` `--br-*` `--paper-*` `--leaf*` SİLİNDİ, kullanımları yeni tokenlara taşındı. |
| **Ölçek** | `--p1…--p6` · `--r1…--r3` + `--rr` · `--k1…--k3`. `hud.css` ve `index.css`te **ham punto/yarıçap/gölge kalmadı**. |
| **B5 Arial** | `button, input, select, textarea { font: inherit }` → font ailesi 3 → 2, `fontOge` 3 → 2. |
| **B6 glif** | `🔒`→`LockIcon` · `✕`→`CloseIcon` · `↺`→`ResetIcon` · `✓`→`TickIcon` · `•`→`DotIcon` · `→`→`ToIcon`. |
| **D-108 ikonlar** | `icons.tsx` tek gramerde yeniden yazıldı: 24 ızgara, kontur 2,2, aksan ikon başına tek yerde, ham renk yok (hepsi `var(--…)`). |
| **Görev fotoğrafı** | Kutu mor kart diline döndü (oyuk zemin + kontur); içindeki çizim artık yükseltme simgeleriyle AYNI 24-ızgara çizimden geliyor, `scale` ile büyütülüyor. Eskiden üç ayrı aileden geliyordu. |
| **Karakter madalyonu** | 48'lik kutuya 24 ızgaralı tepsi çiziliyordu ve köşeye sıkışmıştı — aksan disk + karakter silüetine döndü. |

### Kararın DIŞINA çıkılan dört yer (hepsi burada, sessiz değil)

1. **Dört token eklendi.** `--vitrin` (önizleme sahne zemini — maketin kendi `radial-gradient`inden),
   `--perde` (modal perdesi; eskiden 0,55 ve 0,62 iki ayrı alfaydı, tek alfaya indi),
   `--parilti` (aksan halesi), `--uyari` (rozet/sayaç). Dördü de D-107'nin dokuz renginde yoktu
   ama maket bunları zaten çiziyordu; adı konmadan CSS'e sızmasınlar diye token oldular.
2. **`--uyari` maketteki `#e0402c`ten `#d43a26`ya koyulaştı.** Sebep ölçüm: beyaz yazıyla 4,25
   veriyordu (AA 4,5 ister) ve rozet 12 ölçümün **hepsinde** eşiğin altındaydı → 4,74. Bu renk
   D-107'nin dokuzundan biri değil, o yüzden ölçümle düzeltildi.
3. **Durum artık gölgeyle değil KENARLIKLA anlatılıyor.** Maket `.kart.hazir` için dördüncü bir
   `box-shadow` yazıyordu (altın halka). D-107 "3 kademe" dediği için halka kenarlığa taşındı;
   aynı sebeple `charPulse` ve `navPulse` nabızları `box-shadow` yerine `::after` halkasına geçti.
   Sonuç maketten **daha katı**: ekranda tam 3 gölge.
4. **`splash__title` `clamp(28px, 8vw, 44px)`ten `--p6`ya (30 px) indi.** Ölçek altı basamak;
   yedincisini açmaktansa açılış başlığı basamağa oturdu.

### Bekçi

`tests/mor-dil.test.ts` — 9 denetim: token dışı kromatik ham renk (stil + bileşen) · punto ·
yarıçap · gölge · ölçek sayısı · `button` font mirası · ikon-yerine-glif · ikon ızgarası.
**8 mutasyonla doğrulandı, sekizi de kırmızı yaktı:** ham renk (CSS) · ham punto · dördüncü gölge ·
geri gelen emoji · ham yarıçap · ikona sızan renk · bileşene sızan renk · geri gelen tik glifi.

İki gerekçeli istisna testte YAZILI: `meshStandardMaterial`/`WALL_THEMES`/`floorSwatch` (bunlar
**dünyanın** rengi — D-107 dünyayı bilerek dışarıda bıraktı, D-099) ve FPS sayacı (isteğe bağlı
tanı aracı; eşik renkleri palet değil ÖLÇÜ). `DevSandbox` hiç kapsamda değil — oyuncuya gitmez.

### Kullanıcı kararı bekleyen tek kalem

**Kalan 12 AA ihlalinin hepsi aynı yerden:** `--tx2` (#a99fd8) **gövde gradyanının** (`--g1`)
üstünde **3,84** veriyor; kart (`--kart`) üstünde 4,57 ile geçiyor. Yani sorun rengin kendisi değil,
ikincil metnin kartsız zeminde durması. İki kol var ve **ikisi de D-107'nin yazdığı renge dokunuyor**,
o yüzden ölçüldü ama uygulanmadı:

| Kol | Ne yapar | Sayı |
|---|---|---:|
| **T1** `--tx2` bir tık açılır (#bfb6e6) | palet kararına dokunur, tek satır | 3,84 → **4,91** |
| **T2** ikincil metinler kart zeminine alınır | S12'nin K3 kabuğu zaten bu satırları yeniden diziyor | 3,84 → 4,57 |

Etkilenen: `sheet-sec` (4) · `qrow-title` (3) · `char-stat-val` (3) · `sheet-foot-note` (1) ·
`shop-locked-desc` (1). **Öneri: T2** — S12 o ekranları zaten elden geçirecek, palete dokunmadan çözülür.

---

## S12 — UI YAPISI: TABAN ÖLÇÜMÜ (2026-09-14, commit #1)

S11 **dili** değiştirdi, yapıya dokunmadı. Bu tur yapıyı alıyor: **K3** tam ekran tek kabuk ·
**M2** mağaza · **Y2** pad · chip'siz üst şerit · **G-05** görev metni · **G-18** masa noktası.
Kararların hepsi D-106'da yazılı; son açık kol (**T1/T2**) kullanıcı tarafından **T2** seçildi.
Bu bölüm kod yazılmadan ÖNCEKİ hâli damgalar — sonrası aynı araçla ölçülüp altına yazılacak.

### §Bulgular — TABAN (tam koşu, `tools/shot-ui-s10.mjs` + `OLCUM=tam tools/olcum-ui.ts`, 390×844)

| Ölçü | Taban (S12 öncesi) | Hedef (D-106) |
|---|---:|---|
| kabuk tipi | 5/5 alt sayfa | 5/5 **tam ekran** |
| farklı kabuk yüksekliği | **4** (675 · 675 · 473 · 538 · 431 px) | **1** |
| kabuğun ekran payı | %51,1…%80,0 | %100 |
| geri jesti (`.sheet-back`) | 0/5 ekran | 5/5 |
| mağaza önizleme yüksekliği | 150 px | **230 px** |
| AA altı metin | **12/177** (%6,8) | 0 |
| AA altı SINIF | 5 — `sheet-sec`×4 · `qrow-title`×3 · `char-stat-val`×3 · `sheet-foot-note`×1 · `shop-locked-desc`×1 | 0 |
| en düşük kontrast | **3,84** (hepsi `--tx2` / `--g1` gövde gradyanı) | ≥ 4,5 |
| punto · gölge · yarıçap dizgesi | 5 · 3 · 6 | **değişmemeli** (S11 kazanımı) |
| font ailesi · SVG · glif | 2 · 35 · 13 | **değişmemeli** |

**Damga:** kabuk tipi tutarlı ama BOY tutarsız — bu, S10'un G-17 için bulduğu kök sebebin
aynısı ve dört turdur aynı sayıda duruyor. AA ihlalinin 12'sinin de tek sebebi var: ikincil
metnin kartsız gövde zemininde durması (kart üstünde aynı renk 4,57 ile geçiyor).

**Denge dosyası uyarısı:** bu tur `economy.config.ts`e dokunacak (**G-05 lakapları** — görev
tanımının yanına `kicker` metni). Bu bir DENGE değişikliği değil: hiçbir sayı, eşik, maliyet ya
da ödül değişmiyor. Varyant kapısı sayıya bakar; yine de sıra kilidi gereği ölçüm bu commit'te,
kod bir sonrakinde.

### KARAR — D-110

**T2 seçildi** (kullanıcı, 2026-09-14): ikincil metinler kart/oyuk zeminine alınır; `--tx2`
rengine DOKUNULMAZ. Kalan beş yapı kalemi D-106'da zaten yazılıydı, bu tur onları uyguladı.

### §Bulgular — TABAN ↔ SONRA (ikisi de tam koşu, `tools/shot-ui-s10.mjs`, 390×844)

| Ölçü | Taban | S12 | Hedef |
|---|---:|---:|---|
| kabuk tipi | 5/5 alt sayfa | **5/5 tam ekran** | tam ekran |
| farklı kabuk yüksekliği | 4 (675·675·473·538·431) | **1** (844) | 1 |
| kabuğun ekran payı | %51,1…%80,0 | **%100** | %100 |
| çıkış jesti | ✕ + arkaya tıklama | **tek jest: geri** | tek |
| mağaza vitrini | 150 px (ürün ~74 px) | **230 px taban, boşluğu yutarak ~460** | ≥ 230 |
| mağazada satın alma düğmesi | 3 bileşende dağınık (salon-başı N düğme) | **1** | 1 |
| AA altı metin | **12/177** (%6,8) | **0/184** (%0,0) | 0 |
| AA altı sınıf | 5 | **0** | 0 |
| en düşük kontrast | 3,84 | **≥ 4,5** (band 4,57 · oyuk 7,12) | ≥ 4,5 |
| punto · gölge · font | 5 · 3 · 2 | **5 · 3 · 2** | değişmemeli ✓ |
| yarıçap dizgesi | 6 | **5** | değişmemeli (düştü) |
| metin glifi · SVG | 13 · 35 | **13 · 39** | glif artmamalı ✓ |
| krom kaplaması | %23,2 | **%23,2** | büyümemeli ✓ |

**Yarıçap 6 → 5, çünkü bir DİZGE kalktı:** alt sayfanın `22px 22px 0 0` köşe-başı yazımı.
Basamak sayısı (üç) değişmedi; tam ekranın köşesi yok.

**SVG 35 → 39, glif 13 → 13:** artan dördü kabuğun kendi parçaları (geri oku + cüzdanın para ve
elmas pulu + satın alma düğmesinin parası). Metin glifi ARTMADI — mağazanın fiyat satırı `₺`
kullanıyor ama ölçüm aynı sayıda kalıyor, çünkü kalkan eski kart-başı fiyatlar onu dengeliyor.

### Uygulanan

| Kalem | Ne yapıldı |
|---|---|
| **K3 kabuğu** | `Sheet.tsx` tam ekran TEK kabuk: sol üstte geri · ortada başlık · sağ üstte cüzdan. Beş ekranın beşi de bundan geçiyor. Alt sayfanın başlık kuşağı, ✕ düğmesi, alttan açılma animasyonu ve perdesi SİLİNDİ. |
| **Cüzdan kabukta** | Tam ekran sahneyi örtüyor; üst şeridin parası görünmez oluyordu. Satın alma ekranında paranı göremezsen ekran yarım kalır. |
| **M2 mağaza** | Vitrin 150 → 230 px (ve boşluğu yutuyor) · çeşit kartları 58 px'lik SEÇİM ŞERİDİNE indi · ad+fiyat tek satırda · satın alma TEK büyük düğme. Salon seçimi de satın alma olmaktan çıkıp seçim oldu (3 salon = 3 düğme idi). |
| **Satın alma tek sahipte** | `buyCosmetic` çağrısı önizleme bileşenlerinden çıktı, `ShopPanel`e geçti. Vitrinler artık yalnız VİTRİN. |
| **Chip'siz üst şerit** | `.cur` kutusu (zemin+kenar+gölge) kalktı; okunabilirliği `-webkit-text-stroke` taşıyor. İtibar hapı da madalyonun ALTINDA 50×10'luk çubuğa indi. **D-023'ün chip maddesi geri alındı.** |
| **G-05 lakap** | 50 görevin hepsine `kicker` eklendi ("İLK ÇAY" · "GARSON TEPSİSİ" · "ŞERİT SONU"). Band artık üstte lakap, altında net hedef çiziyor; Görevler ekranındaki sabit "ŞU AN" da görevin kendi lakabına döndü. `q_charTray1`in hedefi somutlaştı ("Tepsini büyüt" → "Tepsini 3 bardağa çıkar"). |
| **G-18 masa seviyesi** | Masanın yükseltme noktası `YÜKSELT` yerine `SV 3` yazıyor. Dünyaya yüzen yeni öğe girmedi; yukarı ok zaten "yükselt" diyordu, yazı artık NEREDEN yükselttiğini söylüyor. |
| **T2** | `.sheet-sec` ve `.sheet-foot-note` gömülü kuşak oldu (7,12) · `.qrow.next` zeminini geri aldı (7,12) · `.char-stat` KART satırına döndü (4,57) · `.shop-locked` gömülü alan oldu (7,12). |
| **"Tamam" düğmeleri** | Ayarlar ve Karakter ekranlarından kalktı — K3'te tek çıkış geri düğmesi; iki çıkış iki farklı jest demekti. |

### Y2 zaten koddaydı

D-106 pad için **Y2** (köşe-parantezli kare) seçmişti. `GroundMarker` bunu **2026-09-09'da**
(G-10, kullanıcı *"yuvarlak yapma, direkt yükseltme gibi olsun"*) zaten uygulamıştı: dış köşesi
yuvarlatılmış L parantezleri, kenar ortaları boş, dolum alttan üste. Bu tur pad'e DOKUNMADI ve
dokunmamalıydı — yazılı karar ile koddaki durumu karşılaştırmadan "uygula" demek, çalışan bir
şeyi yeniden yazmak olurdu.

### Araç düzeltmeleri (ölçüm kendi anlatısıyla çelişiyordu)

Aracın kendi kuralı §U2'nin başında yazılı: *"sayı ile anlatı birbirini denetler."* S11 ve S12
sayıları değiştirdi, üç paragraf S10'da dondu ve ölçtükleri şeyin **tersini** söyler oldu:

1. **§U3** "beş ekranın **0**'i de alt sayfa, hepsinde ✕ + arkaya tıklama var" diyordu — ölçtüğü
   tablo tam ekran gösterirken. Hüküm artık tip/jest/boy sayısından türüyor.
2. **§U2** ölçtüğü yayın yerine sabit "216°" yazıyor, paleti "kahverengi leke" ilan ediyordu.
   Hüküm artık R'den türüyor (eşik 0,70) ve ton merkez açıdan okunuyor: bugün **R 0,42, mor**.
3. **§U4 ve §B6** S11'de silinmiş bir emojiyi (`🔒`) rapor ediyordu. Glif hükmü artık
   `mor-dil.test.ts` 6'daki **aynı listeyle** kıyaslanıyor: ikonun yerine geçen glif mi, yoksa
   cümlenin kendisi mi (`₺` · `+`).

Bir dördüncüsü gerçek bir ÖLÇÜM HATASIYDI ve bu turda doğdu: kök listesine `.screen` eklenince
`.modal-backdrop` ile aynı ağaç iki kez yürünüyor ve simge sayacı ikiye katlanıyordu (SVG 35 →
52, glif 13 → 19). `.screen` zaten `.modal-backdrop`un içinde; kök listesi geri alındı.

### Bekçi

`tests/ekran-kabugu.test.ts` — 8 denetim: tek kabuk · tam ekran (+ alt sayfanın izleri yok) ·
üç bölge ve sırası · M2 (vitrin ≥ 230, tek satın alma, vitrinler satın almaz) · chip'siz kese ·
G-05 lakapları · G-18 seviye · T2 kontrastı. **8 mutasyonla doğrulandı, sekizi de kırmızı yaktı.**

T2 denetimi string eşleştirmiyor: `:root` token'larını okuyup **WCAG oranını hesaplıyor**. Yani
`--tx2` ya da `--kart` ileride değişirse de yakalar — S11'in `--uyari` dersi buydu.

### Bu turun DIŞINDA bırakılanlar (bilerek)

- **Ekranların ortasındaki boşluk.** Mağaza vitrini boşluğu yutuyor; Görevler/Hedefler zaten
  doluyor. Karakter ekranı tek karakterken altta boş kalıyor — içerik kalemi (S14 karakterler),
  yerleşim kalemi değil.
- **`DEV` rozeti K3'ün üstüne biniyor** (`devSandbox.css`, z-index). Yalnız `npm run dev`'de
  çizilir, oyuncuya gitmez; bekçinin kapsamı dışında.
- **Denge sayısına dokunulmadı.** `economy.config.ts` değişti ama yalnız METİN: 50 `kicker`
  alanı + bir başlık netleştirmesi. Hiçbir eşik, maliyet, ödül ya da kademe değişmedi.
