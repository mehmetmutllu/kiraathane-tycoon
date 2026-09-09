# Plan — Faz S · Sanat ve arayüz geçişi (2026-09-09)

Kaynak: `docs/geribildirim-oyun-testi-2026-09-09.md` (G-01…G-25) + kullanıcı onayı
*"ücretsiz olduğu sürece her asseti çek ve yap"*.

## Kapsam kararı
**Faz adı neden S:** defterde zaten bir **Faz G (görsel taban)** var; `G-01…G-25` ise bu turun
GERİ BİLDİRİM numaraları. Karışmasın diye faz **S**, kalemleri **S1…S6**.

Bu faz **denge dosyalarına dokunmaz** (`economy.config.ts` / `tick.ts` / `rules.ts`) →
varyant kapısı ve iki-commit kilidi tetiklenmez. Kapı: `npm run test` + `npm run duman`.
G-06 (tepsi 75→50) ve G-07 (dwell süresi) **bu fazın dışında** — onlar ölçüm turu ister.

## Kalemler

| # | İş | Kaynak | İndirme? |
|---|---|---|---|
| **S1** | **Pad ve yükseltme dili** — köşe-parantezli kare, alttan dolum, "YÜKSELT", düz yukarı ok, kalın yazı, gerçek elmas pulu, Usta modali | kendi kodumuz | hayır |
| **S2** | **Mutfak bloğu KayKit'e geçer** — `MaketCounter`/`MaketSink`/`MaketDishSink`/`MaketCezveStation`/`MaketWaterRack`/`MaketCrates` yerine `kitchencounter_*`, `stove_multi`, `extractorhood`, `fridge_A`, `dishrack*`, `crate*` | restaurant-bits (elde) | hayır |
| **S3** | **Duvar + zemin** — `MaketWall` yerine `wall`/`wall_half`/`wall_decorated`/`pillar_A·B`; `floor_kitchen`. Kıraathane rengi `recolor.ts` atlas kopyasıyla | restaurant-bits (elde) | hayır |
| **S4** | **Dekor takası** — 8 elle çizilen parça → KayKit (`trash_A`, `lamp_standing`, `rug_*`, `pictureframe_*`, `cabinet_*`, `cactus_*`); 6'sı elle kalır | furniture + city (elde) | hayır |
| **S5** | **Dış cephe + pencere + tente** — `building_A…H`, yollar, `streetlight`, `bench`; pencere `wall_window_open`; **tente maket-v13'ten** (`box(6.4, 0.18, 1.9, 0x2e6b4f)`, x-rot 0.18, kapının üstünde) | city-builder (elde) + maket | hayır |
| **S6** | **Yeni paketler** — okey/tavla, çiçek, süs | Board Game · Forest · Holiday · Resource · Prototype · Block | **EVET** |

## İndirme engeli (2026-09-09 ölçüldü)
`curl` bu ortamda ağ göremiyor (`HTTP 000`, çıkış 43) → itch.io paketlerini **ben indiremiyorum**.
S1-S5'in hiçbiri indirme gerektirmiyor; **S6 kullanıcı indirmesini bekler.**

## Ayrı tutulanlar (Faz S değil)
- **Hata turu:** G-01 toplama yarıçapı · G-02 çay alma güvenilmezliği · G-03 kaçak kamera
- **Görev akışı turu:** G-04 toast kalkar/bar dönüşür · G-05 metinler
- **Ölçüm turu:** G-06 tepsi fiyatı · G-07 dwell süresi
- **Maket onayı isteyenler:** G-16 mavi palet · G-17 ekran modeli (Subway Surfers)
- **Cevaplanmamış:** karakter kolu (§3) — ücretsiz olanlar (Adventurers + Character Animations)
  indirilebilir ama ilkel karakterlerin yerine geçmesi kullanıcı gözü ister.
