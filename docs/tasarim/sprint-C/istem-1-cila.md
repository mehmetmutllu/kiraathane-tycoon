# Sprint C · ChatGPT istemi 1 — görsel cila (yerleşim AYNEN kalır)

Ek: `mevcut-4-ekran.png` (Mağaza · Paketler · Görevler · Çaycı, açık lila hâli, 2026-10-13). Aşağıdaki metin ChatGPT'ye
OLDUĞU GİBİ verilir. Ders (D-164): baştan yön istemek iki turda reddedildi; bu tur yalnız CİLA ister, düzen kilitli.

---

Mobil bir 3D idle-tycoon oyunu yapıyorum: **Tea House Tycoon**. Oyuncu bir Türk kıraathanesini (çay evi) işletiyor. 3B dünya
KayKit tarzı, düz gölgeli low-poly; sıcak ahşap tonlarında. Referans tür: My Perfect Hotel, Burger Please, Eatventure.
Hedef kitle geniş ve çocuk-güvenli: sıcak, samimi, oyuncak gibi okunur bir arayüz.

Ekteki resim oyunun **bugünkü** dört ekranı (soldan: Mağaza · Paketler · Görevler · Çaycı yükseltme paneli). Açık lila zemin
rengini seviyoruz. **Sorun: ekranlar çok dolu ve ağır duruyor.** Her şeyin etrafında kontur var, her kart aynı ağırlıkta, göz nereye
bakacağını bilmiyor.

**Senden istediğim:** aynı dört ekranı, **yerleşimi hiç değiştirmeden**, yeniden çiz; yalnız görsel dili cilala.

**DEĞİŞMEYECEKLER (kilit):**
- Her öğenin yeri, sırası ve boyutu aynı kalır: sol üstte geri düğmesi, ortada başlık, sağ üstte para + elmas cüzdanı; Mağaza'da
  tek satır yana kayan 7 sekme (ikon + yazı), büyük 3B önizleme, altında küçük resimli seçim şeridi, ad satırı, en altta tek büyük
  düğme; Paketler'de üstte Başlangıç Paketi afişi, ortada 3 elmas paketi yan yana, altta Reklamları Kaldır şeridi; Görevler'de
  kart listesi; Çaycı'da üstte önizleme, altta 3 yükseltme satırı.
- 3B önizleme kutularının İÇİ (karakter, masa, zemin) aynı kalır — onlar oyundan canlı geliyor.
- Metinler aynı (Türkçe). İngilizcesi %30 uzun olabilir, kesilmeyecek yer bırak.
- Dokunulan her şey en az 48×48 dp.

**DEĞİŞEBİLECEKLER (senin işin):**
1. **Çizgiler:** konturların kalınlığı, nerede olup nerede olmayacağı. Hangi kartın çerçeveye ihtiyacı yok, hangisi gölgeyle ayrışır.
2. **Renk dağılımı:** zemin / kart / vurgu oranı. Açık lila temel kalsın ama neyin öne çıkacağını renkle sırala (birincil düğme,
   seçili sekme, fiyat, ödül). Şu an geri düğmesi, seçili sekme ve satın al düğmesi aynı turuncu; bunları ayrıştır.
3. **Yazı:** başlık ve gövde fontu, ağırlıklar, boyut kademeleri. Oyun fontu olmalı ama okunur; Türkçe karakterleri (ç ğ ı İ ö ş ü)
   eksiksiz olan bir font öner, adını yaz (Google Fonts'tan olursa iyi).
4. **İkonlar:** sekme ikonları (Kıyafet · Tepsi · Dekor · Paketler · Masa · Zemin · Duvar), para ve elmas, yükseltme ikonları
   (Tepsi · Para Mıknatısı · Hareket Hızı). Daha iyi bir ikon dili önerirsen göster; beğenirsek ayrı bir turda bütün ikon setini
   sana çizdireceğiz.
5. **Boşluk:** ekran ferahlasın. Kenar boşlukları, kartlar arası boşluk, satır yüksekliği.

**Çıktı:** tek resimde yan yana aynı 4 ekran (390×844 pt dikey telefon), cilalanmış hâlleriyle. Resmin altına kısa bir liste:
renk kodları (zemin, kart, metin, ikincil metin, vurgu, birincil düğme, ikincil düğme), font adları + boyutlar, kontur kalınlığı,
köşe yarıçapı, gölge.
