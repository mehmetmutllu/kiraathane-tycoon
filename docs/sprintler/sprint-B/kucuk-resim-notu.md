# Küçük resim notu (Sprint B · Faz 4 · ajan ③)

## Envanter — 38 kozmetik (`economy.config.ts` `cosmetics`)
kıyafet 7 (kurucu dahil) · tepsi 5 · dekor 12 · masa teması 4 · zemin 5 · duvar 3 · mutfak zemini 2.
Mutfak teması bugün mağaza sekmesinde yok (yalnız store + `Kitchen.tsx`), ama config'te olduğu için resmi çekildi.
Liste tek kaynaktan türer: `tools/kucuk-resim-liste.ts` (çekim sayfası + bekçi aynı fonksiyonu okur).

## Çekim yolu
- `tools/kucuk-resim.html` + `.tsx` (maskot.html kalıbı): oyunun bileşenleri doğrudan import edilir —
  `DekorGovde`, `KayActor kiyafet`, `CupTray gorunum`, `FloorPattern`, `WallPanels`, `Model` (+`esleme` mutfak,
  `recolor` masa), ışık `SceneLights`. `src/`'ye dokunulmadı.
- Tek istisna kopya: `TableThemePreview.ThemedTable` dışa açık değil → 12 satırlık aynısı sayfada (`TemaliMasa`).
  Sprint C'de istenirse `ThemedTable` export edilir, kopya silinir.
- Kadraj: her mesh kutusunun 8 köşesi (iskeletli/örnekli mesh'te mesh'in kendi kutusu) → tür başına sabit
  bakış (yaw + yükseliş) ile köşeler kareye sığdırılır, izdüşüm ortalanır. Masa/dolap üstü eşyada (semaver,
  gramofon, radyo, kanarya, lamba) kadraj tabladan başlar — 1. kontakt turunda semaver masanın üstünde lekeydi.
- Çıktı: 384² çizim → 192² küçültme → tarayıcının kendi WebP kodlayıcısı (q 0,86). **Yeni bağımlılık yok** (sharp gerekmedi).

## Boyut kararı: tek 192 px
Mağaza pulu ~64 css px; 3× dpr'de 192 px tam karşılık. 128+256 iki set hem iki kat dosya hem iki bekçi demek;
256'nın gerektiği büyük önizleme zaten canlı 3B. Toplam **142,7 KB** (en büyük 5,9 KB, en küçük 1,7 KB) — hedef ≤ 512 KB.

## Kırmızı kutu tuzağı — üç kat
1. **Bekleme:** sayaç `DefaultLoadingManager`'a İLK import'ta takılır (`kucuk-resim-yukleme.ts`; oyun modülleri import
   anında `useGLTF.preload` çağırıyor, sonra takılınca sayaç −16'ya düşmüştü). Yükleyici boş + 600 ms sessiz + renk atlası hazır olmadan çekim yok.
2. **Sahne denetimi (dekor):** yedek rengi (#7c2230/#9b1c22/#b3262a) taşıyan, yarıçapı > 0,25 m mesh → HATA.
3. **Piksel denetimi (dekor):** ton 340-12°, doygunluk ≥ 0,55 piksel oranı > %35 → HATA. `yilbasi-kirmizi` (gerçek kırmızı
   koltuk, %58,6) muaf; sahne denetimi onda da çalışır.
Sınama (dosyaya yazılmadığı md5 ile doğrulandı):
- `--bozuk=armchair` / `--bozuk=chair_large_blue` (404) → HATA, çıkış 1.
- `--gecikme=armchair:5000` → bekledi, gerçek model çekildi (kırmızı %0), çıkış 0.
- Mutasyon: bekleme kapatılıp gecikmeyle → kat 2 yakaladı ("sahnede kırmızı yedek kutu"); kat 2 de kapatılınca kat 3
  yakaladı ("piksellerin %100'ü yedek kırmızısı"). Geri alındı.

## Bekçi `tests/kucuk-resim.test.ts` (5 test, yeşil)
Mutasyonlar: `dekor-saat.webp` silindi → 1 düştü · `tepsi-aski` → `tepsi-askili` adı → 2 düştü (eksik + fazlalık) ·
`duvar-krem.webp`'e 30 KB eklendi → boyut testi düştü. Hepsi geri alındı, 5/5 yeşil. `asset-olu-yuk` da yeşil.

## Kontakt sayfası `docs/tasarim/sprint-B/kucuk-resimler.png` (1576×1216)
Hepsi tanınır. Zayıf noktalar oyunun kendi modelinden: semaver ilkel silindir (şişe gibi okunur); `yemek` ile `fayans`
zemini gerçekten çok yakın (iri/küçük karo farkı); `parke` düz tema (desensiz) → düz ahşap kare. Kadraj tür içinde tutarlı.

## Sprint C bağlama
`<img src={`/assets/thumbs/${tur}-${id}.webp`}>` — tür adları: kiyafet · tepsi · dekor · masa · zemin · duvar · mutfak.
Yeni kozmetik → `npx tsx tools/kucuk-resim.mjs --yalniz=<tur>-<id>` (port 5302); bekçi eksikliği yakalar.
