# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S19a BİTTİ: ölçüldü + karar alındı, KOD YAZILMADI** · Faz S 18/20 · 93/104)

```
SORU            : Kullanicinin yedi kaleminden ilk uc + ikinci turda gelen uc yeni yon.
OLCULEN KOLLAR  : O oturus capasi · P patron dokunusu · G glif · A onluk · Y yemek asseti
SAYILAR         : docs/olcum-oturus.txt · docs/patron-oturus-glif-raporu-s19a.md §Bulgular
KARAR (D-116)   : O3 capa 0,26 · A2 saran onluk · P7 havlu + kollari sivali ·
                  Y1 Kenney Food Kit (STIL KILIDI ACILIYOR) · B1 ince belli bardak (bizim)
UYGULAMA        : S19b — kullanici bilerek sonraki oturuma birakti
BEKCI           : S19b'de (kod bu turda yazilmadi)
```

## SIRADAKİ TAM ADIM

**S19b — D-116'nın kolları koda girer.** Sıra: ölçüm bitti, karar alındı, geriye yalnız uygulama
+ bekçi kaldı. Dokunulacak yerler ve bilinen tuzaklar:

1. **Oturuş çapası** — `actor.ts`'e tek sabit (`KAY_OTURMA_ILERI = 0.26`), `Customers.tsx` onu
   koltuk açısıyla döndürerek uygular (yerel **+z** ileri; dünya ofseti `sin/cos(aci) × dz`).
   Kapsül kolu dokunulmaz. Bekçi: çapa uygulanmazsa/ters uygulanırsa kırmızı yanan test.
2. **Önlük A2** — `KayActor.kiyafetTak` kutudan yüzeye: göğüslük yay 110° / yarıçap 0,335-0,365 /
   boy 0,40, çapa `chest` (0, 0,82, 0,02) · etek yay 220° / 0,315→0,40 / boy 0,32, çapa `hips`
   (0, 0,50−boy/2, 0,02) · bel bağı yay 320° / 0,305 / 0,075 · iki askı (±0,13 · 1,07 · 0,27).
   **Yay +z'de ortalanır** (`thetaStart = −yay/2`) — `Math.PI/2` yanlış eksen.
   **AÇIK KUSUR (kullanıcı 2026-09-14):** gövdenin göğsündeki **rozet süsü önlüğün içinden
   çıkıyor**, önlük parçalanmış gibi duruyor. Önce ölç: süs ayrı düğüm mü, gövde mesh'inin
   parçası mı → ayrıysa önlüklü aktörde gizle, değilse önlüğü 1-2 mm öne al.
3. **Patron P7** — omuz havlusu (bordo `#a83232`, omuz kemiğinin kendi dünya konumundan çapa,
   dilimler z ±0,26) + kolları sıvalı (mesh BÖLÜNMEZ: alt kol/bilek/el kemiklerine ağırlığı > 0,5
   olan tepe noktaları ten rengine, **vertex color** katmanı). Lacivert gömlek geri alınır
   (`PALETTE.ownerShirt` kalkar, `parcaRenk` sadeleşir).
4. **Balonun içi** — `siparisBalonu.ts` Canvas2D çiziminden **model render'ına** geçer
   (`WebGLRenderTarget` → `readRenderTargetPixels` → `CanvasTexture`; balon çerçevesi/kuyruğu
   aynen kalır, glif ortak iç dikdörtgene sığdırılır). Tost = Kenney `sandwich`/`sub`,
   çay = bizim ince belli bardak (Lathe profili raporda).
5. **Asset girişi** — `public/_aday/`deki Kenney modelleri seçilenle birlikte
   `public/assets/models/kenney-food-kit/`e taşınır, `public/assets/README.md` manifestine künye
   + **stil kilidinin bilerek açıldığı** notu, `.gitignore`dan `public/_aday/` satırı kalkar.

**Sonra:** S19'un kalan dört kalemi (karakter menüsü KayKit gövdesine · paneller tam ekran ·
yükseltme tetiği pad'in üstünde → **varyant kapısı** · yükseltmenin solundaki ok) · S9 SES karar
paketi · sonra **Faz H**.

### S9 SES — ÖLÇÜM BİTTİ, KARAR PAKETİ BEKLİYOR

`docs/olcum-ses-s17.txt` hazır (tam koşu damgalı). 9 CC0 Kenney paketi · 706 .ogg · 36 aday
Chromium `decodeAudioData` ile çözüldü. **Bulgular:** dosyalı dokuzlu 36/36 AYRI (sentezle aynı
hüküm) · dosyalar sentezden **16,6 dB yüksek** (normalizasyon gerek) · **7/9** seçilen dosya
`aralik` kelepçesini taşıyor · akan sıvı **0 aday** · ortam/döngü **0 aday** (O2 kolu düştü).

## AÇIK KALEMLER (ölçüldü/görüldü, bilerek duruyor — tam listesi `memory-bank/arsiv/`de)

**Karakter/sanat:** **rozet süsü önlükten çıkıyor (S19b'de çözülecek)** · Rogue'un omzu 0,709
(blob sınırı 0,60) · **Ranger'ın kalçası taburenin kendisinden geniş (yan taşma 0,094 — çapa
sorunu değil, gövde/mobilya oranı)** · klip dosyaları mankenin gövdesini de taşıyor (dosya başına
6.916 üçgen ölü yük) · müşteri gövdeleri personelle aynı · `Rogue_Hooded` süzgece takılmıyor.

**Mekân:** vitrin ardındaki giriş holü düzenlenmedi (10 dekor duvar diplerinde) · WC odasının
ORTASI boş + tavan ışığı yok · banket masası `table_round_A_small`e geçmedi · mağaza kartlarının
gerçek render'ı yok · KayKit `bench` düz plaka gibi · bulaşık gövdesi kutusundan geniş çizilemiyor
· WC çöp kutusu elle çizim KESİN (dokuz pakette karşılığı yok).

**Oynanış (Faz H):** G-01 masa her taraftan toplanmıyor · G-02 ocaktan alma güvenilmez ·
G-03 kamera kayıyor · G-06 tepsi ilk yükseltme 75 → ~50 · G-07 dwell para-bağımsız (son ikisi
DENGE, varyant kapısına tabi) · masalar geçilmiyor (açıklık 0,68 br, geçiş 0,94 ister — 20 masanın
12'si).

**Altyapı:** `npm run lint` 31 hata (hepsi eski `tools/olcum-*.ts`) · `.gitattributes` YOK
(`core.autocrlf` her checkout'ta CRLF'e çeviriyor) · `npm run pano` günlük uyarısı yalnız TARİHE
bakıyor · **oyuncuda 2,0× artık kayma** · **panel dönüşünde T-poz temiz koşuda ÜRETİLEMEDİ**
(repro aracı `tools/olcum-panel-donusu.mjs`).

**Önizlemeler**
**S19a KARAR PAKETİ (v2):** https://claude.ai/code/artifact/a8d02997-974d-4f2a-a00c-f916820a69c7
**S19a kareler:** `ss/s19-oturus.png` · `ss/s19-onluk.png` · `ss/s19-patron.png` · `ss/s19-glif.png` · `ss/s19-yemek.png`
**S18 son durum:** `docs/gorsel/ss/s18-son.png` · **HUD'lu:** `docs/gorsel/ss/s18-durum-hud.png`
**S15 karar paketi:** https://claude.ai/code/artifact/1cad1b62-df57-4ffb-b00b-32f0b9be9565
**S13 paketler:** https://claude.ai/code/artifact/dcbaaee3-8889-4665-83b2-feff02a60c13
**S12 arayüz:** https://claude.ai/code/artifact/a83eade2-32f6-4a64-ae34-6743a93922a3
**Mor arayüz maketi:** https://claude.ai/code/artifact/6cc7a95e-c0a3-4802-8ea3-99398d637981
**İlerleme panosu:** https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a

---

## TUR KARTI ŞABLONU (her yeni tur bunu doldurur, öncekinin üstüne)

```
SORU            : (tek cümle — bu tur neyi çözüyor)
ÖLÇÜLECEK KOLLAR: (varyant olarak ölçülecek seçenekler; kod YAZILMADAN)
SAYILAR         : (adım 2'den sonra dolar — rapor §Bulgular'a link)
KARAR           : (adım 3, kullanıcı seçer — D-0xx)
UYGULAMA        : (adım 4, yalnız kararın kolu)
BEKÇİ           : (test dosyası + kaç mutasyonla doğrulandı)
```

**Sıra (D-084 §3.2) — ihlali commit yapısı engeller, kapanışta `npm run sira` denetler:**
`0 BAŞLA → 1 SORU (kart açılır) → 2 ÖLÇ → commit #1 (araç + ham çıktı + rapor, KARAR BÖLÜMÜ BOŞ)
→ 3 KARAR (tek karar paketi) → 4 UYGULA + bekçi + mutasyon + final tam koşu
→ commit #2 (kod + test + rapor tamam + D-0xx) → 5 KAPAT`

**Varyant kapısı:** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan denge değişikliği,
raporun §Bulgular tablosunda o kolun **sayı satırı** olmadan yapılmaz.

**Kapanış (D-085):** `npm run sira` → `npm run pano` → `npm run test` → commit → push.
Pano denetimi kırmızıysa önce `progress.md` düzeltilir; anlatı elle yazılır.
