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

## 7. Ses — SENTEZ (stil kilidi · D-096)
**Kaynak: `src/game/audioSynth.ts`. Dış ses paketi YOK, lisans yüzeyi SIFIR.**

Bu satır eskiden *"Kaynak: Kenney / Pixabay / Freesound (CC0)"* diyordu; o bir **seçim değil aday
listesiydi** ve seslerde §3'ün tek stil kilidi hiç kurulmamıştı. E4'te kuruldu ve ölçümle verildi
(`docs/ses-raporu-e4.md`): sentez kataloğu 36 çiftin 36'sında ayrışıyor, yani yer tutucu değil.

Gerekçe §2 ve D-013'ün aynısı: **primitive yer tutucu değil NİHAİ stil.** Sesin karşılığı da bu.
Sentez tek "sanatçı"dır — stil kilidi tanımı gereği sağlanır; hazır kayıt setleri ise iki sorunu
birden getiriyordu (karışık sanatçı + gerçekçi kaydın flat-shaded sahnede yabancı durması).

**İki ses ailesi** (D-080 Tek Odak'ın ses karşılığı):
- **Fiziksel** — gürültü + bant süzgeci. `pour` (bant merkezi yükselen akış) · `serve` (cam
  şıngırtısı + tok gövde). Metalik `coin` de buraya yakındır: tonaldir ama kısmileri inharmoniktir.
- **İlerleme** — tonal. `purchase` · `padFill` · `quest` · `level` · `master` · `reward`.
  Aralık örüntüleri bilerek ayrı: −5 · +7,+5 · +4,+3 · +7,+5,+4 · +5,+5 · +12.

**Dosya OPSİYONELDİR, kural değişmedi:** `public/assets/audio/`'ya bir `.ogg` bırakılırsa üstüne
yazar ve tek satır kod değişmez (`Model.tsx` fallback deseninin aynısı, yönü ters). Bırakılan her
dosya §8'in lisans disiplinine tabidir. Bugün klasör **bilerek boştur.**

**Henüz sentezlenemeyen:** ortam uğultusu (`settings.music` kablosu yok) ve okey pulu (masa v1.1).
İkisi de kendi turunu ister; motorun gürültü kaynağı ikisini de üretebilir.

## 8. Lisans disiplini (kural)
- `public/assets/README.md` = **manifest**: gereken her model + kaynağı + LİSANSI.
- **Lisansı belirsiz hiçbir şey commit'lenmez.** CC0 paketleri URL verilirse indirilir.

## 9. Manifest
Bkz. `public/assets/README.md` — model/ses listesi, kaynak, lisans, greybox karşılığı.
