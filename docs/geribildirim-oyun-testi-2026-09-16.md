# Kullanıcı geri bildirimi — 2026-09-16 (F2 turunun içinde geldi)

Kullanıcı oyunu açtı ve on iki kalem verdi. Kendi sözü: *"bunları da not et işin bitince sonra
oturumu kaydedersin sonraki chatlerde bunları yaparsın."* → bu turda **hiçbiri uygulanmadı**,
hepsi sıraya alındı.

Numaralar `G-` serisinin devamı (son kullanılan: G-34, 2026-09-09).

## Oynanış / mantık

| # | Bulgu | Kullanıcının sözü | İlk okuma |
|---|---|---|---|
| **G-35** | **Mutfakta tezgâh ve bulaşık YANLIŞ AÇIDA** | *"sol duvara paralel olması gerekirken tam 90 derece açıyla duruyor"* | Yerleşim/dönüş kusuru. Ölçülmeli: `Kitchen.tsx` / `DishStation` rotasyonu ve duvar hattı. |
| **G-36** | **Tezgâhın İÇİNDEN geçiliyor** | *"biz tezgahın vs içinden geçiyoruz öyle olmamalı"* | Çarpışma katısı eksik. H1'in erişim aracı (`tools/olcum-erisim-h1.ts`) bunu ölçebilir. |
| **G-37** | **Başlangıçta tezgâhlar BİTİŞİK olsun** | *"başlangıçta tezgahlar da bitişik olsun"* | Yerleşim kararı; G-35 ile aynı tura girer. |
| **G-38** | **Tezgâh yükseltmeleri belirsiz** | *"tezgah yükseltmeleri de nasıl oluyor bilmiyorum bunları tamamla"* | S22'nin kademeli mutfağı tezgâha uygulanmamış olabilir; önce ölçülmeli. |
| **G-39** | **Masa yükseltmeleri AYNI ANDA geliyor** | *"her masanın yükseltmesi sırayla gelsin aynı anda zınk diye değil biri yükselmeden diğeri yükselmesin"* | **DENGE/kural dosyasına dokunur → varyant kapısına tabi.** D-124 (tek hedef) tetiği tekleştirdi ama GÖRSEL uygulanma hâlâ toplu olabilir. |
| **G-40** | **Para gelirinde fazla ondalık** | *"para gelirlerinde bazen noktadan sonra fazla hane oluyor o olmasın"* | Biçimlendirme; `Decimal` → metin dönüşümünde yuvarlama. Tek yerden çözülmeli. |

## Görev akışı (dördü aynı kökten)

| # | Bulgu | Kullanıcının sözü |
|---|---|---|
| **G-41** | Biten görevin tebriği YENİ görevin üstünde kalıyor | *"görevden sonra yeni görev hemen gelirken onun üstünde biten görevin tebrikleri var"* |
| **G-42** | Görev çubuğunda üstteki yazı KESİLİYOR | *"görev çubuğu da üstte yazısı kesiliyor"* |
| **G-43** | "Görev bitti" AYRI yerde duruyor — hepsi TEK çubukta olmalı | *"görev bitti o kendi görev çubuğunda olsun kısaca her şey tek çubukta"* |
| **G-44** | Yeni göreve ZOOM erken atılıyor | *"bir görev bitip de başarılı işareti gelmeden ve yeni görev yazılmadan da o gelecek yeni göreve zoom vs atılmasın"* |

→ Dördü tek turda, tek bir **görev şeridi** olarak ele alınmalı: biten görev kendi çubuğunda
kapanır → başarı işareti → yeni görev yazılır → **ancak o zaman** kamera yeni hedefe gider.

## Arayüz

| # | Bulgu | Kullanıcının sözü |
|---|---|---|
| **G-45** | Ayarlar'da ses/müzik seviyesi çerçeveleri bozuk | *"ses seviyesi ve müzik seviyesi kısımlarının çerçevesini düzenle kesik yerler falan var"* |
| **G-46** | **FPS sayacını KALDIR** | *"fps sayacını kaldır"* |
| **G-47** | İki ödül YAN YANA duruyor — ALT ALTA + aralarında `+` olmalı | *"2 ödül varsa alt alta olsun ve aralarında + olsun şu an yan yana kötü duruyor"* |
| **G-48** | **Seviye göstergesi kötü** — yuvarlak ile siyah bar AYRI | *"yuvarlak etrafı siyah bar da öyle bar ve yuvarlak birleşik olmalı clash of clansınki gibi düşün ve en üst satırda yan yana olmalı"* |
| **G-49** | Sağ üstteki elmas ve paraya çerçeve | *"sağ üstteki elmas ve paraya da çerçeve verebilirsin"* |

**G-48 referans ister:** Clash of Clans'ın seviye rozeti = dairesel seviye madalyonu, deneyim
barı madalyonun **çevresine** sarılı, ikisi tek parça. `feedback_ui_game_feel` kuralı gereği
gerçek referans kareleriyle çalışılmalı, tahminle değil.

## Sanat yönü — açık uçlu, çözüm ÖNERİLMESİ istendi

**G-50 — mekân "yapılmamış asset" gibi hissettiriyor.**
Kullanıcının sözü: *"zemin ve duvarlar hep ve yan taraflar hep böyle daha yapılmamış asset gibi
hissettiriyor ona da çözümler sun ve öner. mesela etraf bahçe veya çimenlik gibi olabilir vs vs."*

Bu bir hata kaydı değil, **tasarım turu**: kullanıcı seçenek görmek istiyor. `feedback_show_dont_ask`
gereği metinle anlatılmaz — **aynı kadrajdan 6-12 aday render edilip eleyerek** seçtirilir.
Kullanıcının kendi verdiği yön: çevreyi bahçe/çimenlik yapmak. Aday yönler (tur açılınca
görselleştirilecek):

- bina dışını çimenlik/bahçe kuşağı yapmak (kullanıcının önerisi)
- sokak dokusunu zenginleştirmek (kaldırım, bordür, ağaç dizisi — `city-builder-bits` elimizde)
- zemin/duvar malzemesine desen ve kirlilik katmanı (bugün düz renk okunuyor)
- ufuk çizgisi / arka plan siluet kuşağı (mekânın "kesilmiş" bitişini gizler)

> **Dikkat:** F2'de `kaykit-forest-nature` paketi silindi (D-125). Çimenlik/bahçe kolu seçilirse
> tek komutla geri gelir: `git checkout 13738b5^ -- public/assets/models/kaykit-forest-nature`.
> Bekçi (`tests/asset-olu-yuk.test.ts`) paketin kodda karşılığı olmadan geri gelmesine izin vermez —
> yani geri alınırsa entegrasyonu da aynı turda yapılır. Bu tesadüf değil, bekçinin işi.

## Sıraya alma önerisi

Üç tur gibi duruyor (kullanıcı onaylarsa):

1. **Görev şeridi** (G-41…G-44) — dördü tek kök, tek tur.
2. **Mutfak yerleşimi + çarpışma** (G-35…G-38) — ölçüm gerektirir; G-39 denge kapısına tabi,
   ayrı tutulmalı.
3. **HUD çerçeveleri** (G-45…G-49) — G-48 referans karesi ister, G-46 tek satırlık.

G-50 kendi tasarım turudur ve aday render'ı gerektirir.
