# Faz G — Görsel taban

Plan: `docs/plan-kat1-yayin.html` §"Görsel taban". Bu klasör G adımlarının kararlarını ve
öncesi/sonrası kanıtını tutar. Ekran görüntüleri `ss/` altında (412×915, gerçek oyun, DEV
sandbox'la açılmış durum).

---

## G0 — Işık ✅ (2026-09-06)

Değiştirilen dosyalar: `src/config/palette.ts` (yeni `LIGHTING` bloğu) ·
`src/components/three/Scene.tsx` (Canvas ışık bloğu). Draw-call değişmedi.

### Ne değişti

| | Önce | Sonra |
|---|---|---|
| Dolgu ışığı | `ambientLight 0.6` (yönsüz, düz) | `hemisphereLight` gök `#ffe9c8` / yer `#6b5a4a` @ **0.35** |
| Yönlü ışık | beyaz, `1.1` | krem `#fff2d8`, **`1.6`** |
| **Güneş konumu** | **`[6,12,6]` (~55°)** | **`[9,9,7]` (~40°)** |
| Gölge kamerası | −12/24/12/−20 | −13/28/15/−15 (1024) |
| Sis | yok | `#1f2933`, 34 → 72 |
| Tone mapping | ACESFilmic (r3f varsayılanı) | aynı + `toneMappingExposure 1.05` |

### Ölçüm — asıl kaldıraç şiddet değil AÇI çıktı

Plan G0'ı "hemisphere + fog + ACESFilmic" diye tarif ediyordu. Uygulayınca görüldü ki:

1. **ACESFilmic zaten açıktı.** r3f v9 `gl.toneMapping`'i varsayılan olarak ACESFilmic yapıyor
   (`flat` prop'u verilmediği sürece; `node_modules/@react-three/fiber` içinde doğrulandı).
   Bu maddede yapılacak tek iş `toneMappingExposure` idi.
2. **Yalnız hemi/sun şiddetini oynatmak sahneyi neredeyse hiç değiştirmedi.** Üç ayrı ayar turu
   (0.42/1.25, 0.58/1.25, 0.40/1.45) yan yana konunca hepsi "önce"den ayırt edilemiyordu.
3. **Sebep: gölge yoktu sanılıyordu, aslında gölge objenin ALTINDA kalıyordu.** Sahneye geçici
   3×3 test kutusu eklenince gölge haritasının çalıştığı görüldü — güneş ~55° yükseklikte
   olduğu için gölgeler kısacıktı ve tepeden bakan kamera onları göremiyordu.
4. Güneş `[9,9,7]`'ye (~40°) indirilince her masa, tabure ve müşteri zemine **oturdu**.
   Bu, G1'in (temas gölgesi) çözeceği "yüzme" hissinin yarısını bedelsiz kapatıyor.
5. Güneş alçalınca gölgeler uzadı ve eski gölge kamerası sağ-üst köşede kırpıyordu →
   sınırlar salonu + hemen önündeki sokağı kapsayacak şekilde genişletildi (1024 haritada
   ~25 teksel/birim; eskisi 28 — kayıp ihmal edilebilir).

**Daha da alçaltmak** (`[9,8,7]`, ~35°) denendi: gölgeler dramatikleşiyor ama telefonda
oynanışı örten uzun lekeler oluşturuyor. `[9,9,7]` bilinçli orta yol.

### Maliyet
- Draw-call **91 → 91** (değişmedi; ışık geometri eklemez).
- Sis maliyeti ölçüldü: **~0,04 ms/kare** (200 karelik `gl.render` döngüsü, gürültü seviyesi).
- Kare süresi 1,1–1,3 ms (masaüstü, tam dolu salon, 3 salon açık, 40k üçgen).
  Not: headless tarayıcıda `window.__perf().fps` arka plan kısıtlaması yüzünden anlamsız
  (1 gösteriyor) — ölçüm doğrudan `gl.render` döngüsüyle yapıldı.

### Kanıt
`ss/g0-once.png` ↔ `ss/g0-sonra.png` — AYNI kamera (oyuncu `__teleport(2,1)`, genel bakış açık),
tek fark ışık. `ss/g0-genis.png` üç salon açıkken, `ss/g0-baslangic.png` sıfırdan öğretici salonu.

### Doğrulama
`npm run test` 186/186 · `npm run build` temiz · Playwright 0 konsol hatası.

### Bu adımdan artakalan (G fazının ilerisi)
- UI içindeki küçük Canvas'lar (`CharacterPanel`, `SalonSlice`, `DioramaPreview`,
  `TableThemePreview`) hâlâ eski düz `ambientLight` ile aydınlanıyor. Dünya sıcaklaşınca
  mağaza önizlemeleri soğuk kalıyor — G fazının sonunda ortak bir ışık kurulumuna alınmalı.
- `shadow.bias`/`normalBias` **0'da bırakıldı**: bu açıda akne görülmedi, normalBias eklemek
  ince çıtalarda (0,04–0,08) ışık sızdırma riski taşıyor. Yeni açı denenirse tekrar bakılmalı.

---

## G1 — Temas gölgesi ✅ (2026-09-06)

Yeni dosyalar: `src/components/three/ContactShadows.tsx` · `src/game/visualActors.ts`.
Değişenler: `src/config/palette.ts` (`CONTACT_SHADOW` bloğu) · `src/game/types.ts` (`Footprint`) ·
`src/game/store.ts` (`LAYOUT.decor`) · `src/components/three/Tables.tsx` (`tableFootprints`) ·
`src/components/three/Scene.tsx` (bileşen + çaycı kaydı + `DecorProps` veri-güdümlü oldu).

### Ne yapıldı
Her objenin tabanına zemine yatık **yumuşak elips** konur. Hepsi **tek InstancedMesh** —
geometri önceden yatırıldığı için per-instance matris yalnız öteleme + ölçek taşır (rotasyon yok).
Doku çalışma anında çizilen 64px radyal degrade (`alphaMap`; renk materyalden gelir) → **0 byte asset**.

| | Kapsam |
|---|---|
| Statik | masa + oturak (her seviyede, büyüyen masa dâhil) · ocak/tezgâh · bulaşık modülü · çöp kovaları · saksılar |
| Dinamik (her kare) | oyuncu · garsonlar (2/salon) · bulaşıkçılar · **ayakta** müşteriler · çaycı/tost ustası |

**Tek kaynak kuralı:** masa/oturak ayak izleri yerleşimi yeniden hesaplamaz — `buildFurniture`'ın
ürettiği instance listesini okur (`tableFootprints`), yani masa nereye/hangi ölçekle konuyorsa gölge
de oraya düşer. Tezgâh/bulaşık `LAYOUT.stationHalves`/`dishHalf`'ten (zaten dünya eksenli yarı-boyut,
aynalı salonlarda da doğru). Dekor konumları `LAYOUT.decor`'a taşındı; `DecorProps` ve gölge aynı
listeyi okur.

### Ölçümle çıkan üç şey
1. **Oturan müşteriye gölge konmaz.** Konunca altındaki oturağın lekesiyle üst üste binip o koltuk
   komşularından belirgin koyu çıkıyordu. Ayakta olan (`toTable` / `leaving`) müşteri leke alır.
2. **Kaldırımda leke gömülüyordu.** Sokak düzlemleri z-fighting yüzünden y 0,02–0,06'ya
   yükseltilmiş ve OPAK — salon yüksekliğindeki (0,008) leke derinlik testinde eleniyor, kapıdan
   çıkan müşteri gölgesini kaybediyordu. Çözüm: ön duvar hattının DIŞINDAKİ lekeler
   `CONTACT_SHADOW.streetY` = 0,075'e çıkar (tek karşılaştırma, `put()` içinde).
3. **Koyuluk A/B ile seçildi.** 0,40 açık zeminde (kaldırım) yetiyor ama ahşap salon zemininde
   ancak fark ediliyor; 0,58 okunaklı fakat güneş gölgesiyle çakışınca ağırlaşıyor → **0,50**.

### Maliyet (aynı kameradan, `blob.visible` açık/kapalı ölçümü)
- Draw-call **+1** (107 → 108; salon başına değil, TOPLAM bir çağrı).
- Uzak kamera, 91 leke: **~0,03 ms/kare**. Yakın kamera, 28 büyük leke: **~0,13 ms/kare**
  (fill-rate bağlı — lekeler ekranda büyüdükçe artar, ~16 ms bütçenin %1'i).
- Kare süresi 1,06 → 1,20 ms (masaüstü). Üçgen sayısı +56.

### Kanıt
`ss/g1-once.png` ↔ `ss/g1-sonra.png` — AYNI kamera/durum (`__teleport(0, 0.2)`, 4 masa L1–L4),
tek fark temas gölgesi. `ss/g1-kaldirim.png` sokağa çıkan müşterinin lekesi (madde 2),
`ss/g1-mutfak.png` tezgâh/bulaşık lekesi. `ss/g1-teshis-kirmizi.png` teşhis turu: materyal geçici
olarak kırmızı/opak yapılıp lekelerin konumu ve yumuşaklığı doğrulandı — **görsel bir iddiayı
"göremiyorum"a dayandırmama** yöntemi (G0'ın test kutusu kalıbının aynısı).

### Doğrulama
`npm run test` 186/186 · `npm run build` temiz · Playwright 0 konsol hatası ·
`tools/smoke.mjs` **8/15 (bu oturumdan ÖNCE de 8/15 — değişmedi**, kök neden `q_coin` yarışı).

### Bilinen sınır
- Leke elips; dikdörtgen tezgâhın köşeleri tam kapanmaz. İkinci bir doku ikinci draw-call demek
  olduğundan tezgâhlarda daha DAR yayılım (`counterSpread` 1,18) seçildi — köşe boşluğu görünmüyor.
- Kaldırım geçişinde leke 0,008 → 0,075'e "zıplar"; bu kamera açısında algılanmıyor.
