## R2 — mutfak yerleşimi + çarpışma (2026-09-16, D-127) — turun kalıcı üç dersi

**Turun kalıcı üç dersi:**
1. **İki dönemden biri doğru çalışıyorsa kusur ölümsüzdür.** Ölçü DÜNYA ekseninde üretilip YEREL
   eksende tüketiliyordu; `rot = 0` olan arka bant hep doğru göründüğü için hata S3'ten R2'ye
   kadar yaşadı. Bekçinin kuralı bu yüzden "her denetim İKİ DÖNEMİ birden gezer" — tek dönemi
   denetleyen bekçi, bu kusurun tam olarak kaçtığı bekçidir.
2. **Kaçan mutasyon bir delik değil bir HARİTA.** M2 ve M4 yakalanmadı; sebebi bekçinin zayıflığı
   değil, yanlışladıkları dalın canlı kodda ÖLÜ olmasıydı (birleştirme yalnız `rot = 0` döneminde
   koşuyor). Sözleşme `yerelKutu()` olarak dışarı alındı ve doğrudan koşturuldu.
3. **Ölçümün kapsamı, kararın kapsamı değildir.** Araç yalnız `ServicePlace` içindeki noktaları
   geziyordu; bulaşıkçı PAD'i listede yoktu ve B2 uygulanınca boş zemini işaretler hâlde kalacaktı.
   Kolun gereği olduğu için taşındı ve bekçiye kondu — ama asıl açık, ankraj listesinin hâlâ elle
   türetiliyor olması.

**Yolda düzeltilen üç araç kusuru:** "oda dışı" ölçütü arka bantta anlamsızdı (bant tanım gereği
salon dışı) → kutunun merkezi salonda değilse satır ölçülmüyor · kare aracının dönem damgası
`window.__game`i ALAN sanıyordu, okunamayan değeri "geçti" sayıyordu (fonksiyon) · düzeltme
uygulanınca "A1 kolu" adı yalanlaştı → "TAKAS (geri alınsa)" oldu, arm tablosu bekçinin
karşılaştırma koluna dönüştü.

**KARARSIZ BEKÇİ — yeni veri, teşhis DEĞİŞTİ.** Bu turda bir kez daha görüldü (1242/1243) ve
hemen ardından **beş koşu üst üste temiz**. İki gözlemin ortak yanı: ikisi de bir dosya
YAZILDIKTAN hemen sonraki ilk koşuda oldu — yani şüphe artık `sira-kilidi`/`pano-guncelle`de
değil, koşucunun yazım-zamanlaması. Ayrıca R1'in *"çıktı dosya adını göstermiyor"* notu YANLIŞ
çıktı: `--reporter=verbose` (ve varsayılan da) kırık testin adını basıyor — R1'de `tail` çıktıyı
kesmişti. Kip eklemeye gerek yok, `| grep -E '×|FAIL'` yeter.


---


## R1 — görev şeridi (2026-09-16, D-126) — turun kalıcı üç dersi

**Turun kalıcı üç dersi:**
1. **Bekçisi olmayan karar, karar değil yorumdur.** Bu toast 2026-09-09'da kullanıcı kararıyla
   kaldırılmıştı; `f4b1a52`de `tsc -b` onu tutan koşulu "ölü dal" dedi (tip o an daralmıştı),
   dal silindi ve **karar da onunla gitti**. Tip genişleyince toast döndü, HUD yorumu bugüne
   kadar "çizilmez" dedi. Kural artık olumsuzlama değil **liste** (`CIZILEN_TOAST`): tip yine
   daralırsa ölü dal olmaz, kısalır. Mutasyon M1 tam olarak o silmedir.
2. **Ölçüm neyi sayacağını bilir; kare neyi sormadığını gösterir.** Araç kutuları, süreleri ve
   taşmayı saydı — hepsi doğru. Kullanıcı karede bandın üst kenarındaki gri iç parlamayı gördü;
   ölçümde öyle bir sütun yoktu. Kare gösterilmeseydi tur "G-42 kapandı" diye kapanırdı.
3. **Düzeltme uygulanınca bekçinin kendisi kör olabilir.** Araç örtüşmeyi türden sayıyordu
   (`kind === 'quest'`); HUD kapısı devreye girince sıfır basardı ve sıfır kendini doğrulardı.
   İki kapı: araç artık HUD'un kendi fonksiyonundan okuyor, ve **kontrol kolu K** tebriği
   çizilebilir türe çevirip 2,20 sn'yi geri getiriyor — parmak izi eski tabanla birebir.

**Yolda düzeltilen dört araç kusuru:** açılış panı ölçüm penceresine sızıyordu (sahte erken pan) ·
DOM 12 görevin 7'sini İLK görevin kopyası olarak ölçüyordu · kollar aynı dünyayı ölçmüyordu
(her ölçüm artık kendi taze sayfasında) · V4'ün ölçecek şeyi yoktu (salon senaryosu eklendi).


---


## R3 — HUD çerçeveleri (2026-09-17, D-128) — turun kalıcı üç dersi

1. **Bir kusuru kaldırmak, onun ÜSTÜNDEKİ kusuru kaldırmaz.** Kullanıcı madalyonda *"arkada bir
   çizgi"* gördü; yıldızı kaldırdığımızda çizgi DURUYORDU. `-webkit-text-stroke` köşeleri MITER
   birleştiriyor ve Lilita One'ın sivri "4"ünde 5 px kontur ekrana mızrak olarak çıkıyor. Aynı
   56 px'te iki ayrı kusur üst üste duruyordu; biri diğerini gizliyordu.
2. **Kullanıcının sorduğu her çatal bir seçim değildir — bazısı ölçümle kapanır.** *"Yan yana mı
   alt alta mı bilemedim"* bir zevk sorusu gibi duruyordu; ölçüm yan yana kolunun 999.99M'de
   ekranı 42,7 px aştığını gösterdi. Kol seçime SUNULMADAN elendi ve kullanıcıya sebebi yazıldı.
3. **Kaçan mutasyon bekçinin zayıf yerinin haritası.** M6 (bonus satırı deltaya döner) kaçtı:
   bekçi geçişin yalnız SAĞ ucunu tutuyordu, sol uç deltaya dönünce satır "+%0,4 → %3,6" oluyor
   ve ekran hem artışı hem toplamı vaat ediyordu. İki uç da denetleniyor.

**Yolda düzeltilen üç araç kusuru** (hepsi rapora sayı girmeden): React metni tek düğüm sanıldı
(JSX `{yuzde(bonus)} kalıcı gelir` ÜÇ metin düğümü üretiyor → D ve E kolları taban metniyle aynı
çıktı) · ikinci tur, birinci turun bıraktığı etiketi temizlemiyordu · G madalyon kolu `.rep-num`a
`position: relative` verip sayıyı diskin dışına düşürüyordu.
