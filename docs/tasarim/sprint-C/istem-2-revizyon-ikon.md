# Sprint C · ChatGPT istemi 2 — revizyon + ikon setleri (aynı sohbet: istem 1'in devamı)

Kullanıcı (2026-10-13): "Sırada" bölümü güzel olmamış · zemin biraz daha mor · ikonlar (sekme, görev, elmas, altın…) oyun tarzında
ChatGPT'ye çizdirilsin. Izgaralar `tools/ui-kit/izgara.py` ile kesilir (macenta #FF00FF zemin, 4×4).

## 2a — revizyon
Çok güzel olmuş, bu yönde devam. Aynı 4 ekranı şu düzeltmelerle yeniden çiz:
1. Zemin biraz daha mor olsun (şu an neredeyse beyaz; lila tonu belirgin ama yine açık kalsın). Kartlar beyaz kalsın.
2. Görevler'deki "SIRADA" bölümü zayıf: kesik çizgili boş kutular soluk ve bitmemiş gibi duruyor. Sıradaki görevleri daha
   iyi göster (ör. kilitli/sırada olduğu belli, okunur, ama asıl görev kartlarından daha sakin).
3. Geri düğmesi, seçili sekme ve ana satın al düğmesi hâlâ aynı turuncu. Ana eylem düğmesi (Uygulandı / Satın Al / Test /
   fiyat) turuncu kalsın; geri düğmesi ve seçili sekme farklı ama uyumlu bir dil alsın.
Yerleşim yine aynen kalsın. Altına güncel renk kodlarını yaz.

## 2b — ikon seti 1
Şimdi bu arayüzün ikonlarını oyun tarzında çiz. TEK resim, 4×4 ızgara, 16 ikon. Kurallar:
- Zemin tamamen düz macenta #FF00FF (kesip saydam yapacağız). Zemine gölge düşürme, macentaya yakın renk (pembe/mor-pembe) kullanma.
- Her ikon kendi hücresinin ortasında, hücreler arasında bol boşluk; ikonlar birbirine değmesin. Yazı/etiket YOK.
- Stil: sıcak, oyuncak gibi, hafif hacimli (yumuşak gölgelendirme + üstten parlama), koyu mor (#3B2F86 civarı) yumuşak kontur.
  Mobil tycoon oyunlarının (My Perfect Hotel, Royal Match) ikon kalitesi. Hepsi aynı ışık, aynı kontur, aynı ölçek.
- Sıra (soldan sağa, yukarıdan aşağı):
  1 altın sikke yığını · 2 mavi elmas · 3 görev panosu (onay işaretli) · 4 hedef (dart tahtası) ·
  5 mağaza (tenteli dükkân) · 6 çaycı (kasketli karakter başı) · 7 ayarlar (dişli) · 8 kıyafet (yelek/gömlek) ·
  9 çay tepsisi (iki ince belli çay bardağıyla) · 10 dekor (ayaklı lamba) · 11 elmas kesesi · 12 kıraathane masası ·
  13 zemin (karo döşeme) · 14 duvar (lambrili duvar parçası) · 15 asma kilit · 16 reklamları kaldır (üstü çizili "AD" ekranı)

## 2c — ikon seti 2
Aynı kurallarla ikinci 4×4 ızgara (görev ve yükseltme ikonları):
  1 ince belli Türk çay bardağı (kırmızı çay) · 2 tepside çay servisi (el + tepsi) · 3 yerde parlayan para · 4 bulaşık leğeni (köpüklü) ·
  5 yeni masa açma (masa + artı) · 6 çay ocağı / semaver · 7 garson hızı (koşan ayakkabı + hız çizgisi) · 8 lavabo kapısı ·
  9 masa yükseltme (masa + yukarı ok) · 10 garson tepsisi (dolu) · 11 para mıknatısı · 12 hareket hızı (kanatlı ayakkabı) ·
  13 tost · 14 itibar (yıldızlı rozet) · 15 video izle (oynat düğmesi) · 16 ödül sandığı (açık, elmaslı)
