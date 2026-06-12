# Telefon feedback turu-5 (2026-06-12, a96a478 sonrası — kullanıcının ham listesi + triyaj)

Kaynak: kullanıcı telefonda turu-4 APK'sını (15:37) test etti. 14 madde. Uygulama SONRAKİ oturumda
(taze context); sıra ve kapsam başlangıçta kullanıcıyla netleştirilecek.

## A — DENGE (config ağırlıklı; sim ile doğrulanacak)
1. **Çay ocağına 1-2 ₺ seviyesi daha** (şu an soft max L4, L5=Usta 💎). Kullanıcı: "çaydanlığa 1-2
   yükseltme daha gerek". Eğri geometrik devam eder; sim eğrisine etkisi raporlanacak.
2. **Tost arzı talebe yetmiyor — AŞIRI darboğaz** (2 kez söylendi). Adaylar: prepTime 14→~10-11
   ve/veya tost tezgâhına ek seviye; round-robin talebi artırdı, arz aynı kaldı. Sim + canlı test şart.
3. **Garson tepsi yükseltmesi ERKENE + UCUZA**: çay 800/2400/6000 pahalı/geç; "garson bensiz
   yetemiyor". Quest sırası da öne alınabilir → DİKKAT: quest reorder = save v29 + İD-eşleme migrasyonu.
4. **Genel fiyat indirimi (ertelenen karar)**: "biraz düşmeli ama ÇOK AZ veya aynı; belki sadece en
   baştaki (garson öncesi, tek başına satış) dönem azıcık ucuzlasın". KARAR BİRLİKTE VERİLECEK —
   öneri hazırlanıp onaya sunulacak.
5. **Karakter yükseltme fiyatları "absürt" artıyor** (tepsi/mıknatıs/hız costs eğrisi yumuşatılmalı).
6. **Garson hız/tepsi**: "yetiyor mu anlayamadım ama hız veya tepsi gelebilir" — 3'le birlikte ele al;
   garson taban hızına DOKUNMA (2026-06-11 onaylı yavaşlatma), gerekirse L3 hız kademesi öner.

## B — UX / GÖRSEL (orta boy, kod)
7. **Açılmamış karakter panelde GÖRÜNMESİN**: kilitli "Tostçu/Bulaşıkçı" sekmeleri yerine sekme hiç
   çizilmesin (tutulunca belirsin).
8. **Onboarding çakışması**: q_charTray1 karakter-butonu spotlight'ı ile "çaydanlığı yükselt" hedefi
   AYNI ANDA yanıp söndü / kamera yanlışa kaydı. İkisi aynı anda tetiklenmemeli (spotlight yalnız
   ilgili görev aktifken; kamera odak önceliği gözden geçir).
9. **Karakterler birbirinin İÇİNDEN GEÇEBİLMELİ**: oyuncu NPC/personel kalabalığında neredeyse
   yürüyemiyor. Oyuncu-aktör çarpışmasını kaldır/yumuşat (aktörler engel olmasın).
10. **Tost masası görseli seviyeye göre**: 1-2 sandalyede KARE görünmeli; 4 sandalyeye (L3+)
    çıkınca dikdörtgene dönsün ("uzun masa + tek sandalye garip").
11. **Tost bulaşığı tepside BARDAK görünüyor → TABAK olmalı** (oyuncu tepsisi carried-dirty görseli
    kind-bilinçli değil).
12. **Kamera daha yakın + map ferahlasın**: masa araları açılabilir veya map genel genişleyebilir.
    TASARIM TURU gerektirir (nav/koordinatlar/pad konumları zincirleme etkilenir) — ayrı milestone.

## C — PERFORMANS (araştırma gerektirir)
13. **FPS ilerledikçe düşüyor; kapa-aç düzeltiyor; boş mapte akıcı.** "Kapa-aç düzeltiyor" güçlü
    ipucu: birikim/sızıntı (coins/dishes/NPC leaving temizliği? three.js geometri/material dispose?
    notice/quest ikon yeniden yaratımı?) + içerik arttıkça draw-call (instancing eksikliği).
    Profiling → önce sızıntıyı bul, sonra instancing/dpr optimizasyonu.

## D — DOĞRULAMA
14. **Müşteri gelişi "adam akıllı optimize olsun"**: round-robin (a96a478) bu turda telefonda henüz
    hissedilmemiş olabilir; turu-5 testinde gözlemlenip kalan pürüz varsa çözülecek.

## KULLANICI ŞARTI (2026-06-12 kapanış): denge/para işleri İNCE HESAPLA yapılacak
"Bu dengelerde ve para meselesinde her şeyi en ince detayına kadar hesapla, ona göre çöz."
→ Denge paketi (A maddeleri) uygulanmadan ÖNCE: gelir/sn eğrisi, her pad/yükseltmenin
amortisman süresi, garson-öncesi vs sonrası tempo, tost arz/talep oranı (koltuk×döngü vs
prepTime×tepsi) SAYISAL raporlanır (tools/simulate.ts + el hesabı), öneriler bu rapora
dayandırılıp ONAYA sunulur; onaydan sonra uygulanır. Göz kararı sayı değişikliği YOK.

## Önerilen uygulama sırası (sonraki oturum[lar])
1. Hızlı UX paketi: 7, 8, 11, 10 (+9 araştır-uygula) — tek milestone, APK.
2. Denge paketi: 1, 2, 3, 5 (+4 önerisi onaya) — sim raporuyla; v29 gerekirse quest İD-eşleme.
3. Performans: 13 (profiling ayrı oturum — odak ister).
4. Tasarım turu: 12 (kamera+map) — plan dokümanı + onay, sonra uygulama.
