
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
