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

## G1 — Gölge modeli ✅ (2026-09-06) — **SAHNEDE GÖLGE YOK**

**Karar: D-054.** Kıraathanede hiçbir gölge çizilmez — ne yönlü gölge haritası, ne zemine yatık
temas lekesi. My Hotel'in düz görünümü. Son hâl: `ss/g1-son-golgesiz.png`.

### Nasıl bu noktaya gelindi — üç tur
1. **rev1 reddedildi.** Obje başına ayrı temas lekesi + o anki sert yönlü gölge. Kullanıcı:
   *"bu kötü duruyo her şeyin altında bi yuvarlak var"*. Masa + 4 tabure = 5 yuvarlak (puanlı
   kumaş), üstelik gerçek gölgenin ÜSTÜNE biniyordu.
2. Kullanıcı asıl şikâyeti netleştirdi: *"hem gölge hem de alttaki yuvarlak kötü duruyo AYNI
   ANDA... zınk diye keskin çizgi gibi duruyo... bak mesela myhotelde hiç gölge yok"*.
3. **Dört varyant aynı kareden çekilip gösterildi.** Önce D seçildi, sonra kullanıcı vazgeçti:
   *"vazgeçtim hiç gölge olmasın kötü duruyor komple kaldır"* → **B**.

| | Varyant | Kare süresi (412×915) | Sonuç |
|---|---|---|---|
| A | Sert yönlü gölge (eski hâl) | 1,31 ms | kenar merdiveni — `ss/g1-var-A-sert-golge.png` |
| **B** | **Hiç gölge yok** | **0,67 ms** | **SEÇİLDİ** — `ss/g1-var-B-golgesiz.png` |
| C | Yumuşak yönlü gölge (VSM, radius 7) | ~1,5 ms | ışık sızıyor, lekeli, en pahalı — `ss/g1-var-C-yumusak.png` |
| D | Gölge yok + masa başına tek soluk havuz | 0,74 ms | önce seçildi, sonra vazgeçildi — `ss/g1-var-D-havuz.png` |

### Yan kazanç — performans
Gölge haritası tek başına kare süresinin **yarısını** yiyordu:
- Telefon kadrajı (412×915, üç salon dolu): **1,31 → 0,56 ms** (%57 hızlı), 91 draw call, 37k üçgen.
- PC (1920×1080): **2,02 → 1,44 ms** (%29 hızlı) — **ama 245 draw call**, geniş oranda bütün
  dükkân görünür oluyor. Kullanıcının bildirdiği *"PC'de tam ekran hayvan gibi kasıyo"*
  sorununun kalanı için ilk bakılacak yer burası.

### Sert kenarın sebebi (ölçüldü)
1024'lük gölge haritası ~30 birimlik alana yayılıyordu (ortografik −13/28/15/−15, ~25
teksel/birim). Bu yoğunlukta kenar merdiven merdiven çıkar. Çözünürlüğü artırmak çözebilirdi
ama C zaten en pahalı çıktı ve görsel olarak da istenmedi.

### Uygulama
- `<Canvas>`'tan `shadows`, directional'dan `castShadow` + `shadow-*` kaldırıldı.
  `LIGHTING.shadow` bloğu kaldırıldı; geri açılırsa kullanılacak değerler yorumda duruyor.
- Mesh'lerdeki `castShadow`/`receiveShadow` bayrakları **duruyor** (bedelsiz; geri açmak iki satır).
- Yönlü ışık gölge dökmüyor ama **duruyor** — yüzey yönüne göre aydınlatma (hacim hissi) ondan geliyor.
- `LAYOUT.decor` kaldı: dekor konumları (çöp kovaları, saksılar) JSX'ten tek listeye çıktı —
  gölge denemesi için yapılmıştı, bağımsız bir sadeleşme olduğu için tutuldu.

### Doğrulama
`npm run test` 186/186 · `npm run build` temiz · Playwright 0 konsol hatası ·
`tools/smoke.mjs` 8/15 (bu oturumdan ÖNCE de 8/15 — değişmedi).

### Bir daha "objeler yüzüyor" denirse
Blob shadow **önerme** (üç turda reddedildi). Sırayla: (1) **G2 zemin geometrisi** — zeminde
ölçek referansı olunca bu his büyük ölçüde kapanır, (2) hemisphere/directional dengesiyle yüzey
ayrımı, (3) en son çare gölge haritası (bedeli yukarıda).

### Kalıcı ders
**Ölçümün "hedefini tutturdu" demesi, beğenileceği anlamına gelmiyor.** rev1 A/B'de hedefini
tutturmuştu ve reddedildi. Doğru yöntem: birden çok varyantı **aynı kareden** çekip yan yana
koymak ve sormak; tek bir "sonra" görüntüsü karar için yetmez. (Görünmeyen bir şeyi teşhis etmek
için abartma numarası ayrıca geçerli — `ss/g1-teshis-kirmizi.png`.)

---

## (arşiv) G1 rev1 — obje başına temas gölgesi, REDDEDİLDİ

> rev1 uygulandı, ölçüldü, gösterildi ve reddedildi: *"bu kötü duruyo, her şeyin altında bi
> yuvarlak var"*. Aşağısı o turun kaydıdır; **yürürlükteki karar yukarıdaki D varyantıdır.**
>
> **Gerekçe — teknik olarak da doğru olan itiraz:** blob shadow gerçek bir tekniktir ve yaygındır,
> ama neredeyse hep **gerçek gölgenin YERİNE** kullanılır (ucuz olduğu için). Bu sahnede G0'dan
> beri **çalışan bir yönlü gölge haritası var**; blob onun ÜSTÜNE ikinci bir katman koyuyor.
> Katkısı yalnız kontak noktasındaki yumuşama, bedeli ise her objenin altında ayrı bir daire —
> bir masa + 4 tabure = 5 ayrı yuvarlak, küme hâlinde puanlı kumaş gibi okunuyor.
>
> **Bir dahaki sefere:** "objeler yüzüyor" hissi tekrar gündeme gelirse çözüm blob DEĞİL; sırayla
> (1) güneş açısı/gölge yumuşaklığı, (2) G2'nin zemin geometrisi (ölçek referansı gelince yüzme
> hissi büyük ölçüde psikolojik olarak da kapanır), (3) gerekirse gölge haritası çözünürlüğü.
>
> Kod geri alındı (`ContactShadows.tsx`, `visualActors.ts`, `CONTACT_SHADOW`, `Footprint`,
> `tableFootprints` silindi). **`LAYOUT.decor` kaldı** — dekor konumlarının JSX'ten tek listeye
> çıkması bağımsız bir sadeleşme.
>
> Aşağıdaki kayıt, işin nasıl yapıldığını ve nelerin ölçüldüğünü belgelemek için duruyor.

### (arşiv) Ne yapılmıştı

Yeni dosyalar: `src/components/three/ContactShadows.tsx` · `src/game/visualActors.ts`.
Değişenler: `src/config/palette.ts` (`CONTACT_SHADOW` bloğu) · `src/game/types.ts` (`Footprint`) ·
`src/game/store.ts` (`LAYOUT.decor`) · `src/components/three/Tables.tsx` (`tableFootprints`) ·
`src/components/three/Scene.tsx` (bileşen + çaycı kaydı + `DecorProps` veri-güdümlü oldu).

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

---

# G2 — ZEMİNE ÖLÇEK REFERANSI, GEOMETRİYLE (2026-09-06) ✅

**Değişen:** `src/components/three/floorPattern.tsx` (YENİ) · `src/config/palette.ts`
(`FloorTheme` tipi + `FLOOR_THEMES` + `floorSwatch`) · `Scene.tsx` (`CheckerTiles` → `FloorPattern`) ·
`SalonSlice.tsx` (`CheckerPatch` silindi, mağaza önizlemesi aynı bileşeni kullanıyor) · `HUD.tsx` (swatch).
**Kanıt:** `ss/g2-oncesi.png` ↔ `ss/g2-sonrasi.png` (AYNI kare: `__teleport(0, 1.0)`, zoom-out,
NPC/coin temizlenmiş — tek fark zemin) · `ss/g2-karo.png` (fayans) · `ss/g2-magaza.png` (mağaza
önizlemesi) · `ss/g2-yakin.png` (oyun kadrajı).

## Neden bu iş
Planın teşhisi: *"dama temalı salon parke temalıdan daha bitmiş duruyor — ve ikisi de düz renk.
Fark dokuda değil, ÖLÇEK REFERANSINDA."* Zeminde tekrar eden, boyutu bilinen bir birim yoksa göz
mekânın büyüklüğünü okuyamıyor; D-054 ile gölge yolu da kapandığı için ölçek referansının **tek**
kaynağı zemin geometrisi kaldı.

Doku yolu D-041 ile kapalı (denendi, geri alındı: 128px doku 38×30 zemine gerildi → moiré, sert
derz çizgileri, mipmap'te gri bulanık şerit, tahta başına varyasyon yok). Bu yüzden desen **geometri**.

## İki kural
1. **Derz çizgi DEĞİL boşluk.** Quad'lar hücrelerinden `gap` kadar küçük çizilir; aradan ALTTAKİ
   koyu taban (`theme.grout`) görünür. Çizgi çizmek ince geometride aliasing yapar, boşluk yapmaz.
2. **Tahta başına ±%4 ton sapması** (karoda ±%2). Sapma konuma bağlı ve KARARLI (`plankNoise`) —
   her yüklemede aynı tahta aynı tonu alır. Tekrar deseninin gözle sayılabilmesini engeller.

## Ölçüler
| Desen | Hücre | Derz | Sapma | Temalar |
|---|---|---|---|---|
| `plank` | 2,20 × 0,55 (uzun kenar X'te, satır başı **yarım tahta** kaydırma) | 0,045 | ±%4 | parke · ceviz |
| `tile` | 0,70 kare (`yemek` 1,05 — iri karo) | 0,06 | ±%2 | fayans · yemek |
| `checker` | 1,30 kare, derzsiz | — | yok | dama (**bilerek DEĞİŞMEDİ**) |

`dama` yüksek kontrastlı satrancıyla zaten ölçek veriyordu; ona dokunulmadı, yalnız çizim yolu
ortaklaştı.

## Tek kaynak
`floorQuads()` **saf fonksiyon** (6 birim testi: alan dışına taşmama · derzin boşluk olması ·
satır kaydırması · ton sapmasının kararlılığı · karo kareliği · damanın G2 öncesiyle aynı kalması).
Hem sahne (`Scene.tsx`) hem **mağaza önizlemesi** (`SalonSlice.FloorPatch`) aynı bileşenden çizer —
mağazada gördüğün tahta ölçüsü salonda göreceğinle birebir aynı, ayrı bir önizleme kopyası yok.
Mağaza kartının swatch'ı da `floorSwatch()` ile tahtanın yüzü + derz rengini gösterir.

## Maliyet
Alan başına **TEK InstancedMesh = 1 draw call** (parke ~126, fayans ~272, iri karo ~120 parça).
Matrisler ve renkler mount'ta **BİR KEZ** yazılır: drei `<Instances>` KULLANILMADI — kaynakta
doğrulandı ki o, matrisleri HER KARE yeniden hesaplayıp buffer'ı yeniden yüklüyor
(`frames = Infinity` dalı), zemin ise hiç kıpırdamıyor. Eski `CheckerTiles` drei kullandığından
bu adım aynı zamanda küçük bir CPU kazancı.

Ölçüm (1920×1080, 3 salon, zoom-out): draw call **234 → 239** · üçgen 16,6k → 23,8k ·
kare süresi ekranın 165 Hz tavanında kaldı (P0 perf işinden sonra ölçülebilir fark yok).

## Doğrulama
`npm run test` **192/192** (6 yeni) · `npm run build` temiz · `npx tsc --noEmit` temiz ·
Playwright **0 konsol hatası** · `tools/smoke.mjs` **8/15 — öncesiyle aynı, regresyon yok**.

## Bir tuzak (kayda geçsin)
Ölçüm sırasında "tema değişmiyor" sanıldı: Vite **HMR sonrası dinamik `import()` FARKLI bir modül
örneği** döndürüyor → o örnekten yapılan `useGame.setState` uygulamanın store'una yazmıyor.
Tarayıcıda durum değiştirirken **her zaman uygulamanın kendi kancası** (`window.__setState`)
kullanılmalı; `await import('/src/game/store.ts')` yanıltır.
