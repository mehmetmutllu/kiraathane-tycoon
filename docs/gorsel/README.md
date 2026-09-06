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
