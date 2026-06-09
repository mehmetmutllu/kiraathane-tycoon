# Görsel Kimlik — Türk Kıraathanesi (gece 4/7, 2026-06-10)

Stil kilidi: flat-shaded LOW-POLY, primitive = nihai sanat (D-013). Renklerin TEK kaynağı
`src/config/palette.ts` (varyant denemek = sadece o dosyayı değiştirmek).

## Palet gerekçesi
Çay (kırmızı-kahve), bakır (semaver/tepsi), koyu ahşap (lambri/mobilya), krem badana,
kırmızı kilim. Gerçek mahalle kıraathanesinin malzeme dili; doygun ama pastel-dışı.

## Yükseltme görsel evrim tablosu (ÇOK NET — kullanıcı isteği)
| Öğe | L1 (iç 0) | L2 | L3 | L4 | L5 Usta (Faz 4) |
|---|---|---|---|---|---|
| **Masa** | çıplak ahşap tabla + tabure | YEŞİL çuha örtü | BORDO örtü | LACİVERT örtü | ALTIN örtü |
| **Çay ocağı** | küçük mat semaver | büyür + ısınır | büyür | parlak pirinç, geniş kuyruk | altın + 💎 efekt |
| (ileride) zemin/duvar | — | — | kilim desen değişimi | lambri koyulaşır | — |
Masa örtüsü = `PALETTE.tableclothByLevel[tableLevel]`; sabır+bahşiş veren seviye GÖRSEL okunur.

## Uygulanan parçalar
- **Zemin:** sıcak ahşap parke; her zone'un masa bölgesinde kilim (ana + bordür dikdörtgeni).
- **Duvar:** krem üst + koyu ahşap LAMBRİ kuşağı (alt ~0.5 br) — tüm duvar/bölme segmentlerinde.
- **Masa:** yuvarlak ahşap tabla + merkez ayak + İKİ TABURE (minderli; koltuk kutusu emekli).
  Müşteri oturma noktası DEĞİŞMEDİ (seat collision aynı; ikinci tabure salt görsel, masanın yanında).
- **TV köşesi:** zone-1 arka duvarda askılı TV (açık yeşil ekran) — zone-4 "TV salonu" konseptinin öncüsü.
- **Sokak:** her kapının üstünde YEŞİL TENTE; kapı önünde 2 bahçe masası + tabureler (salt görsel,
  kaldırımda); saksı bitkiler. Karşı cephe binaları korundu.

## Bilinçli ertelemeler
- Zemin/duvar kozmetik MAĞAZASI (Fable brief §6) Faz 4+.
- Zone-3/4 tema dekorları (tost tezgâhı, TV salonu oturma) zone'lar açılırken.
- Karakter redesign gece madde 6 (ayrı).
