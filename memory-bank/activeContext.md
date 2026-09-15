# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-15 — **S23 BİTTİ: ok bloğuna girdi, panel oyunun gövdesini gösteriyor** · Faz S 22/23 · 97/107)

```
SORU            : S19'un kalan dört kaleminin GÖRSEL üçü — (K) karakter menüsü hangi gövdeyi
                  gösteriyor · (E) paneller ekranı ne kadar dolduruyor · (O) ok çakışıyor mu?
SAYILAR         : docs/arayuz-raporu-s23.md §Bulgular · ham: docs/olcum-arayuz-s23.txt (tam koşu)
                  sekiz ok adayı gerçek çerçevede · 10 panel satırı × 2 kadraj · 3 sekme silüeti
KARAR           : D-120 — O7 (kalın tek chevron) + K3 (gövde + salon dilimi) + E3 (boşluk işe yarasın)
UYGULAMA        : ok eni artık OK_GENIS'in KENDİSİ (0,554 → 0,400 r) · üç açıklık hedefine oturdu ·
                  üç önizleme modeli tek Onizleme+KayActor'e indi · vitrin SalonSlice'a katıldı ·
                  mağaza satılabilir sekmede açılıyor · Ayarlar'a künye bloğu
BEKÇİ           : tests/arayuz-s23.test.ts — 16 denetim, 12 MUTASYON kırmızı yandı, kaçan 0
FINAL           : vitest 1091 ✓ · duman 42/42 ✓ · tsc -b temiz · denge dosyasına dokunulmadı
```

**Turun kalıcı iki dersi:**
1. **Kusur "ölçü" değil İKİ AYRI DOĞRU'ydu.** Blok 0,34 r yazılıyken ok 0,554 r çiziliyordu;
   arada 3 kenarlı çemberin √3 çarpanı vardı ve **hiçbir yerde yazmıyordu**. Sayıyı düzeltmek
   kusuru kapatmazdı — çizilen eni bloğun KENDİSİNDEN türetmek kapattı.
2. **Mutasyon turu bekçiyi de yakalar.** İlk koşu YALANCI 12/12 verdi: testteki dört regex'e
   kaçış hatasıyla `backspace` karakteri girmişti, o testler zaten kırmızıydı ve mutasyonlar
   "tuttu" sayılıyordu. Ayrıca `toMatch(/FloorPatch/)` kaldırılmış bir bileşende bile yeşildi —
   adı import satırında duruyor. **Bekçi KULLANIMA bakar, isme değil.**

## SIRADAKİ TAM ADIM

**S24 — yükseltme tetiği pad'in TAM ÜSTÜNDE** (S19'un kalan dört kaleminin mantık yarısı).
Kullanıcı sözü: *"yanında falan değil, çerçeve içinde olayım."* Bugün `TABLE_UP_RADIUS` 1,0 /
`PAD_RADIUS` 1,3 **daire**; istenen ÇERÇEVE İÇİ. `rules.ts`'e dokunur → **VARYANT KAPISI**:
iki kol ölçülmeden uygulanmaz (daire yarıçapını daraltmak · kare/çerçeve testine geçmek).

**Sonra:** S9 SES karar paketi (ölçüm hazır) · sonra **Faz H** (E1 yürünebilir mutfak orada).
### S19b'DEN KALAN KÜÇÜK KUSUR

Bel bağının ucu çeyrek açıdan ince bir dudak bırakıyor (`docs/gorsel/ss/s19b-kiyafet.png`).
Ölçü değil biçim; pay 0,035 → 0,012 ile küçültüldü, sıfırlanmadı. Bir sonraki sanat turunda.

### S9 SES — ÖLÇÜM BİTTİ, KARAR PAKETİ BEKLİYOR

`docs/olcum-ses-s17.txt` hazır (tam koşu damgalı). 9 CC0 Kenney paketi · 706 .ogg · 36 aday
Chromium `decodeAudioData` ile çözüldü. **Bulgular:** dosyalı dokuzlu 36/36 AYRI (sentezle aynı
hüküm) · dosyalar sentezden **16,6 dB yüksek** (normalizasyon gerek) · **7/9** seçilen dosya
`aralik` kelepçesini taşıyor · akan sıvı **0 aday** · ortam/döngü **0 aday** (O2 kolu düştü).

## AÇIK KALEMLER (ölçüldü/görüldü, bilerek duruyor — tam listesi `memory-bank/arsiv/`de)

**Karakter/sanat:** ~~rozet süsü önlükten çıkıyor~~ → **S19b'de KAPANDI (D-117):** süs ayrı düğüm
değilmiş, önlük gövdenin profilinden türeyerek onun önüne geçti · Rogue'un omzu 0,709
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

**Altyapı:** pano ARTIFACT'i **bu turda da kapatıldı** (v43 · 97/107) — borç birikmedi. Yayının bedeli yazılı: canlı sürümün **1611 satırının tamamı** okunmadan publish
reddediliyor (~130k token) — yani atlanırsa borç büyüyor, her turda kapatmak ucuz. ·
`npm run lint` 31 hata (hepsi eski `tools/olcum-*.ts`) · **`.gitattributes` YOK — S23'te SOMUT
ZARAR VERDİ:** `git stash pop` src'yi CRLF'e çevirdi ve mutasyon aracının çok satırlı kalıpları
sessizce bulunamadı (dört mutasyon birden "KALIP BULUNAMADI" düştü; araç satır-sonu bağımsız
yapıldı ama asıl eksik duruyor) · `npm run pano` günlük uyarısı yalnız TARİHE
bakıyor · mutfağın kuşbakışı karesi OYUNDAN çekilemez (tepeden kamera oyuncunun üstünde, oyuncu mutfağa giremiyor) — plan ölçüm aracının işi · **oyuncuda 2,0× artık kayma** · **panel dönüşünde T-poz temiz koşuda ÜRETİLEMEDİ**
(repro aracı `tools/olcum-panel-donusu.mjs`).

**Önizlemeler**
**S23 KARAR PAKETİ:** https://claude.ai/artifact/Cysj2inCDguC4gQxuu3X2o
**S23 kareler:** `ss/s23-ok-adaylari.png` (sekiz aday, gerçek çerçeve) ·
`ss/s23b-{player,waiter,dish}.png` (uygulanan vitrin) · `ss/s23-panel-*.png` (panel doluluğu)
**S22 KARAR PAKETİ + UYGULANAN MERDİVEN (v2):** https://claude.ai/artifact/QXhU6FVWtETAzdAvY8qby1
**S22 kareler:** ss/s22-kademe-L{1..6}.png (altı basamak, tek kadraj) · ss/s22-ada-L{4,6}.png
**S20 KARAR PAKETİ:** https://claude.ai/artifact/NzUs9PeHqzj48bekL78fqm
**S20 kareler:** önce `ss/s20-mutfak-{taban,npc,plan}.png` · sonra `ss/s20-mutfak-{taban,npc,plan}-son.png`
**S19b kareler:** `ss/s19b-kiyafet.png` (önlük + patron) · `ss/s19b-oyun-yakin.png` · `ss/s19b-oturus-yakin.png`
**S19a KARAR PAKETİ (v2):** https://claude.ai/code/artifact/a8d02997-974d-4f2a-a00c-f916820a69c7
**S19a kareler:** `ss/s19-oturus.png` · `ss/s19-onluk.png` · `ss/s19-patron.png` · `ss/s19-glif.png` · `ss/s19-yemek.png`
**S18 son durum:** `docs/gorsel/ss/s18-son.png` · **HUD'lu:** `docs/gorsel/ss/s18-durum-hud.png`
**S15 karar paketi:** https://claude.ai/code/artifact/1cad1b62-df57-4ffb-b00b-32f0b9be9565
**S13 paketler:** https://claude.ai/code/artifact/dcbaaee3-8889-4665-83b2-feff02a60c13
**S12 arayüz:** https://claude.ai/code/artifact/a83eade2-32f6-4a64-ae34-6743a93922a3
**Mor arayüz maketi:** https://claude.ai/code/artifact/6cc7a95e-c0a3-4802-8ea3-99398d637981
**İlerleme panosu (v43 · 97/107):** https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs

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
