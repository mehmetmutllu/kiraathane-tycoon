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

*(BOŞ — adım 3, kullanıcı seçer.)*
