# assets — Asset Pipeline & Stil

## 1. Greybox-first (kural)
Oyun, **hiç model olmadan** ilkel şekillerle (box / cylinder / capsule / sphere) TAM
oynanır olmalı. Faz 1-5 tamamen greybox. Sanat Faz 6'da tek seferde geçer.

## 2. Fallback loader (kural)
`src/components/three/Model.tsx` sarmalayıcısı: ilgili `.glb` `public/assets/models/`'da
varsa onu yükler; yoksa parametreyle verilen **ilkel şekle otomatik düşer**. Böylece
model takıldığında oynanış kodu DEĞİŞMEZ.

## 3. Tek stil kilidi (kural)
Tutarlılık için **tek kaynak/stil**. Karışık sanatçı = bozuk görüntü.
- **Seçilen başlangıç stili:** Quaternius / Kenney (CC0) low-poly stilize.
- Bütçe gelirse Synty POLYGON (ücretli) topluca değerlendirilir — ama tek kaynakta kalınır,
  geçiş kullanıcı onayıyla. (Karar: `decisions.md` D-005.)

## 4. Format & optimizasyon
- Format: **.glb**.
- Tekrarlı mesh (masa/sandalye/NPC): **GPU instancing**.
- Texture atlas; **KTX2 / basis** sıkıştırma; gerekiyorsa **LOD**.
- Hedef: orta-segment Android'de **60fps** + makul draw-call (Faz 7).

## 5. Karakter animasyonları
- **Mixamo** (FBX → GLB çevirisi gerekir) veya **GLB-native animasyonlu Quaternius**.
- Greybox'ta animasyon yok; Faz 6'da takılır.

## 6. Türk'e özgü objeler (generic paketlerde YOK)
AI üretimi (Meshy / Tripo, low-poly mod, .glb) + temizlik + seçilen stile uydurma:
- **semaver**, **ince belli çay bardağı**, **okey takımı**, **nargile**, **bakır demlik**,
  tavla, çay tepsisi, şekerlik.

## 7. Ses (CC0)
Kaynak: Kenney / Pixabay / Freesound (CC0).
- Kısık **ortam kıraathane döngüsü** (uğultu, bardak şıngırtısı).
- SFX: para toplama, çay dökme, okey pulu, pad dolma, satın alma.
- Ses / mute kontrolü (ayarlar).

## 8. Lisans disiplini (kural)
- `public/assets/README.md` = **manifest**: gereken her model + kaynağı + LİSANSI.
- **Lisansı belirsiz hiçbir şey commit'lenmez.** CC0 paketleri URL verilirse indirilir.

## 9. Manifest
Bkz. `public/assets/README.md` — model/ses listesi, kaynak, lisans, greybox karşılığı.
