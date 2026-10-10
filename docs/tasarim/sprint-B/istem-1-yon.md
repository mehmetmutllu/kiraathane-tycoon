# Sprint B · ChatGPT istemi 1 — tasarım yönü (palet seçenekleri)

Aşağıdaki metin ChatGPT'ye OLDUĞU GİBİ verilir. Ekler: `ekranlar/390x844-tr-{magaza-dekor,gorevler,hud,cayci-oyuncu,odul}.png`
(şu anki hâl) + `ekranlar/sahne-temiz.png` (arayüzsüz 3B sahne). Her palet yönü için ayrı bir görsel istenir; ilk mesaj YÖN 1'i ister,
sonrakiler "aynı kurallarla YÖN 2 / YÖN 3".

---

Mobil bir 3D idle-tycoon oyunu yapıyorum: **Tea House Tycoon**. Oyuncu bir Türk kıraathanesini (çay evi) işletiyor: karakteriyle
dolaşıp ocaktan çay alıyor, masalara servis ediyor, yere düşen parayı topluyor, yerdeki alanlarda durarak yeni masa ve istasyon
açıyor. 3B dünya KayKit tarzı düz gölgeli low-poly, sıcak ahşap ve tuğla tonlarında (ekteki son resim, arayüzsüz sahne).
Referans tür: **My Perfect Hotel, Burger Please, My Mini Mart** (3D arcade-idle). Hedef: çocuk-güvenli, sıcak, samimi, oyuncak gibi
okunur bir arayüz. Metinler Türkçe ve İngilizce (cihaz diline göre).

**Şu anki arayüzü (ekteki ilk 5 resim) beğenmiyoruz.** Somut şikâyetler:
1. Paneller boğuk; her şey aynı ton mor (ekranın %90-97'si aynı renk), kart ile zemin ayrışmıyor — neyin ne olduğu belli değil.
2. Alt bar kötü: ekranla aynı renk, sekmenin zemini yok, seçili sekme zor seçiliyor.
3. Mağazadaki eşya kareleri çapraz ikiye bölünmüş iki renkli pullar — eşyayı anlatmıyor. **Yerine eşyanın küçük resmi** gelecek
   (kare içinde eşyanın kendisi, ör. koltuk, saksı, semaver).
4. Önemli düğme öne çıkmıyor: geri, seçili sekme, satın al — hepsi aynı turuncu-sarı vurgu.

**Çizmeni istediğim:** tek resimde yan yana **5 dikey telefon ekranı** (390×844 pt, üstte çentik):
1. **Oyun içi HUD:** 3B sahne tam ekran arkada; sol üstte seviye yıldızı + XP çubuğu, altında küçük ayarlar düğmesi; sağ üstte para
   (₺) ve elmas sayacı; üstte ortada görev bandı (görev metni + ilerleme "2/5" + küçük ödül); altta **alt bar** (4 sekme: Görevler ·
   Hedefler · Mağaza · Çaycı; bildirim noktası birinde).
2. **Mağaza — Dekor sekmesi:** tam ekran panel; üstte geri (sol) ve cüzdan (sağ); yatay kategori sekmeleri (Kıyafet · Tepsi · Dekor ·
   Masa · Zemin · Duvar · Paketler); büyük önizleme alanı (seçili eşya 3B'de); altında eşya kareleri ızgarası (küçük resimli; boş /
   seçili / kilitli / uygulanan hâlleri görünsün); tek büyük satın al düğmesi (elmas fiyatlı).
3. **Görevler:** tam ekran panel; üstte günlük ödül kartı (hazır, "Ücretsiz al"); altında görev kartları listesi (ikon, metin, ilerleme
   çubuğu, ödül, biri tamamlanmış ve alınmaya hazır).
4. **Çaycı paneli (karakter yükseltme):** üstte karakter önizlemesi; sekmeler (Oyuncu · Garson · Bulaşık); yükseltme satırları
   (ikon, ad, seviye, mevcut → sonraki değer, fiyat düğmesi; biri parası yetmiyor hâlinde).
5. **Ödül penceresi:** sahnenin üstünde modal; "Seviye 5!" başlığı, ödül miktarı büyük, iki düğme: "Ücretsiz al" (ikincil) ve
   "İzle, 2×" (birincil, video ikonlu).

**Katı düzen kuralları:**
- Paneller tam ekran; geri düğmesi her zaman sol üstte, cüzdan sağ üstte (aynı bileşen her ekranda).
- Dokunulan her şey en az 48×48 dp; boşluklar 8'in katları; güvenli alan (çentik ve alt jest çubuğu) boş.
- Türkçe ve İngilizce metne yer: İngilizce %30 daha uzun olabilir, kesilme olmasın.
- Köşe yarıçapı, kenarlık, gölge ve yazı ölçeği her yerde aynı sistem.
- Birincil eylem (satın al, izle) ekranda TEK ve en belirgin; ikincil eylemler belirgin şekilde daha sakin.
- Emoji ikon yok; ikonlar çizilmiş, oyun tarzında (para, elmas, yıldız, çay bardağı, görev, hedef, mağaza, karakter, ayar, kilit, video).
- Yazı: başlıklarda kalın, yuvarlak bir oyun fontu (şu an Luckiest Guy); gövde metni küçük boyda da okunur olsun.

**Renk paleti senin seçimin:** sahnenin sıcak ahşap tonlarıyla uyumlu ama arayüz ondan ayrışsın (arayüz sahneyle aynı kahveye
boğulmasın). Bana **3 farklı palet yönü** öner: her birini kısa adı ve 1 cümle gerekçesiyle yaz; şimdi **YÖN 1**'i çiz, diğerlerini
ben isteyince çizersin. Mor kalabilir de gidebilir — hangisi daha iyi okunuyorsa.

Resmin altına kısa bir liste ver: her bölgenin yüksekliği (dp), tüm renk kodları (zemin, kart, kenarlık, birincil, ikincil, metin
ana/ikincil, vurgu, başarı, uyarı), köşe yarıçapları, yazı boyları.
