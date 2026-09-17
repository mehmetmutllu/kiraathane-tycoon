# Kullanıcı geri bildirimi — 2026-09-17 (F1b karar paketi turu)

Kullanıcı F1b karar paketine bakarken yedi yeni kalem verdi (**G-51 … G-57**) ve
*"bunları da not et hatta istersen şu an oturumu kaydet sonraki chatte devam ederiz"* dedi →
**bu turda hiçbiri uygulanmadı.**

Kalemler kullanıcının KENDİ cümleleriyle kayıtlı. Parafraz etmek, bir turu sonra
"aslında ne demişti" tartışmasına çeviriyor (R turlarının dersi).

---

## Kullanıcının ham cümleleri (kesintisiz)

> "tamam da görev neden sola yaslı ortada olamaz mı? ve bence navbar da görev de ortada daha iyi
> tablette tüm ekran kaplayınca kötü duruyor bir de bana açılan ekranlar nasıl duracak onları da
> göstermen gerek tablette level barını vs biraz daha büyütebilirsin aynı şekilde kaynaklar ve
> butonları da. he bir de şunu da ekle kaynaklara tıkalyınca parayla satın alınabilir kaynaklar
> olsun bir de onu mağaza gibi düşün oradan tıklanarak mağazanın o sekmesine girilsin ve
> reklamları kaldır vs de olur zaten orada. bir de mesela 2 saatte 1 4 video hakkı olsun her
> videoda 1 elmas verelim veya 200 para vs. veya seviye arttıkça o da artar vs vs."

Ayrıca ikon kalemi hakkında:

> "ikonu sen sal ben onu chatgptye yaptırıcam"

---

## HUD YERLEŞİMİ (G-51 … G-55) — F1b'nin devamı

### G-51 · Görev şeridi ORTADA olsun
> *"görev neden sola yaslı ortada olamaz mı?"*

Ölçülen YD kolu şeridi **sola** yasladı (`right:auto` + sabit genişlik). Kullanıcı genişliği
onaylıyor, **hizayı** reddediyor. Düzeltme: doğal genişlik korunur, yatay hizada ortalanır.
YD'nin sayıları (HUD %38,4 → %19,0) hizadan bağımsızdır — genişlikten geliyor.

### G-52 · Alt gezinme de ORTADA
> *"bence navbar da görev de ortada daha iyi"*

YD zaten navı ortalıyordu (`left:50%` + `translateX(-50%)`). Kullanıcı bunu onaylıyor. Yani
**hedef hâl: iki blok da doğal genişlikte ve ortalanmış, dikey olarak üst üste.**

### G-53 · Tablette tam ekranı kaplamasın
> *"tablette tüm ekran kaplayınca kötü duruyor"*

**YD kolunun tablet kanadı ONAYLANDI.** Ölçüm: tablette HUD %18,9 → **%7,1**.
Bu kalemin kökü `docs/kabuk-raporu-f1b.md` §B-3'te: şerit ve nav `left:0; right:0` ile ekranın
tamamına geriliyor; ekran büyüdükçe öğe büyüyor ama içeriği büyümüyor.

### G-54 · AÇILAN EKRANLAR GÖSTERİLMEDİ — kapsam deliği
> *"bana açılan ekranlar nasıl duracak onları da göstermen gerek"*

F1b ölçümü **yalnız HUD'u** ölçtü. Görevler · Hedefler · Mağaza · Karakter panelleri
(`Sheet.tsx`, `CharacterPanel.tsx`) yatayda ve tablette **hiç görülmedi**. Bu bir eksiklik değil
**delik**: yön kararı verilirken açılan ekranların o yönde ne yaptığı bilinmiyordu.

Sonraki turun ilk işi: dört panelin de portre / telefon yatayı / tablet yatayı kadrajlarında
karesi + ölçüsü. Kısa ekranda panel yüksekliği en olası kırılma noktası.

### G-55 · Tablette HUD öğeleri büyütülsün
> *"tablette level barını vs biraz daha büyütebilirsin aynı şekilde kaynaklar ve butonları da"*

Ölçüm bunu destekliyor: tablet yatayında HUD ekranın yalnız **%18,9'u** (YD ile %7,1) ve en küçük
yazı her kadrajda **11 px** — yani tablette HUD hem oransal olarak küçük hem de yazı telefondaki
boyutta kalıyor. Kalem: tablet dalında `--pill-h`, madalyon, kese ve yuvarlak düğmeler bir
basamak yukarı.

**Dikkat (`feedback_ui_form_not_color` + D-128):** "responsive diye yeni punto uydurma" kuralı
`index.css`'te yazılı — dar ekranda basamak AŞAĞI iniliyor (p3 → p2). Tablet için doğru hamle
yeni punto icat etmek değil, **var olan ölçeğin bir basamak YUKARISI**.

---

## MONETİZASYON (G-56, G-57) — Faz F'nin F3/F4 kalemleri

> **İkisi de bu turda TASARLANMADI bile.** Buraya kullanıcının niyeti olarak yazıldı;
> ekonomiye dokunan her sayı **varyant kapısına tabi** (CLAUDE.md): ölç → sor → uygula.

### G-56 · Kaynak rozetleri mağazaya kapı olsun
> *"kaynaklara tıkalyınca parayla satın alınabilir kaynaklar olsun bir de onu mağaza gibi düşün
> oradan tıklanarak mağazanın o sekmesine girilsin ve reklamları kaldır vs de olur zaten orada"*

HUD'daki ₺ ve 💎 rozetleri bugün **salt gösterge**. İstenen: tıklanınca Mağaza sayfasının ilgili
sekmesi açılsın (₺ → para sekmesi, 💎 → elmas sekmesi). "Reklamları Kaldır" IAP'si de orada.

**Etik kapı (CLAUDE.md · D-007):** "Reklamları Kaldır" ödüllü reklamlara DOKUNMAZ; gerçek parayla
loot-box YOK. Kaynak satışı doğrudan ve şeffaf olmalı, kutu/çark değil.

### G-57 · Ödüllü video hakkı — DENGE KALEMİ
> *"mesela 2 saatte 1 4 video hakkı olsun her videoda 1 elmas verelim veya 200 para vs.
> veya seviye arttıkça o da artar vs vs."*

Kullanıcının taslağı: **2 saatte yenilenen 4 hak · video başına 1 💎 ya da 200 ₺ · seviyeyle artar.**

Bunlar **taslak sayı, karar değil** — hiçbiri ölçülmedi. Uygulanmadan önce cevaplanması gerekenler:
- 4 hak × 1 💎 = 8 saatte 16 💎'un ekonomideki yeri ne? Elmasın bugünkü tek kaynağı hedefler/günlükler.
- 200 ₺ oyunun hangi anında anlamlı, hangi anında görünmez olur? (Geç oyunda 200 ₺ sıfırdır —
  ödül **mutlak** değil, ilerlemeye **oranlı** olmalı; "seviyeyle artar" sezgisi bunu söylüyor.)
- İki ödül tipi (💎 / ₺) oyuncunun **seçimi** mi, rastgele mi? Rastgele olursa çark olur → D-007'ye takılır.
- Sayılar `economy.config.ts`e girer → **varyant kapısı**: kollar ölçülmeden kod yazılmaz.

**Bağlam:** ödüllü reklam kuralları ve Kat 1 ödülü D-066'da zaten yazılı; bu kalem onu
genişletiyor. Yeri **F3 (AdMob)**, tur sırası F1b'den sonra.

---

## F1b'nin DURUMU — karar verilmedi

Üç sorudan **hiçbiri kapanmadı**:

1. **Ekran yönü** — kullanıcı premisi sorguladı (*"ekran yönü neyi değiştirecek? neden
   kilitliyoruz?"*). Paket cevabı taşıyor (K0 / K0+ / K1 / K2), seçim yapılmadı.
2. **Yatay/tablet HUD** — YD kolu kazandı ama **G-51 ile revize edilecek** (ortala).
   Ayrıca G-54 (açılan ekranlar) görülmeden karar tamamlanmamalı.
3. **Açılış ekranı** — çay-dolan-bardak animasyonu + dile bağlı başlık önerildi, onay alınmadı.

**İkon kalemi F1b'den ÇIKTI** — kullanıcı kendisi yaptıracak. Üretilen 12 aday ve araçlar
(`tools/ikon-adaylari.html`) depoda duruyor; istenirse referans olur, istenmezse silinir.
Kullanıcının getireceği ikon `mipmap-*` + adaptive foreground olarak takılır.

**Karar paketi:** https://claude.ai/artifact/JGzwnM3N9rDXbt8Rbbz4jE
