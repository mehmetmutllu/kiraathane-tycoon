# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-16 — **H1 açıldı: üç oynanış hatası ölçülüyor** · Faz H 0/3 · 99/108)

```
SORU            : Oyuncu masadaki kirliye ve ocaktaki ürüne, fiziksel olarak DURABİLDİĞİ her
                  yerden erişebiliyor mu — erişim deliği nerede ve kaç br? (G-01 · G-02)
                  "2. Masayı aç" görevinde kamera kaç kez / kaç saniye kendiliğinden kayıyor,
                  oyuncudan kaç br uzaklaşıyor? (G-03)
ÖLÇÜLECEK KOLLAR: M1 taban (r=1,4 · KİRLİ KABIN rastgele noktasından) · M2 yarıçap süpürmesi
                  1,4→2,4 · M3 tetik MASANIN çizilen katısından (kutu + pay)
                  O1 taban (r=1,6 · TEZGÂHIN MERKEZİNDEN) · O2 yarıçap süpürmesi 1,6→2,6 ·
                  O3 tetik tezgâhın çizilen KUTUSUNDAN (S24/D-120 dersi)
                  K1 pan kaydı: taban davranışı sayıyla (kaç pan · kaç sn · kaç br)
SAYILAR         : (adım 2'den sonra dolar — docs/erisim-raporu-h1.md §Bulgular)
KARAR           : (adım 3 — kullanıcı seçer)
UYGULAMA        : (adım 4 — yalnız kararın kolu)
BEKÇİ           : (test + mutasyon)
```

**Turun kalıcı üç dersi:**
1. **Ölçüm kolları AYIRDI ama SEÇMEDİ — ve seçen şey tek bir sesin kulakta düşmesi oldu.**
   Beş bölüşümün beşinde de karışan çift **0/36**; kimlik bu kararı seçemiyordu. Tablo K2'yi
   öneriyordu (6,41 → **10,97 dB**). Kullanıcı reddetti: *"ocaktan çay alma kötü"*. Dokuz sesin
   dokuzu bir pakette gelir; **bir tanesi beğenilmezse paketin tamamı düşer**. Yani kaynak
   sorusu "en iyi ortalama" değil, **"en kötü üyesi ne"**ydi — tablo bunu hiç göstermiyordu.
2. **Kataloğun en dar yeri kullanıcının işaret ettiği ses DEĞİLDİ.** En zayıf çift
   `quest`↔`level` = **4,06 dB** ve K1/K3/K4'te aynı kalıyor. Şikâyet coin'deydi; kazanç
   ilerleme ailesindeydi. İkisi hiç kesişmedi.
3. **Ölçüm müzikte de sezgiyi çürüttü — ama SEÇEN sayı yine başkası oldu.** Kataloğun en
   "doğru" adayı (gerçek bir dekorasyon oyununun müziği) **sonuncu** çıktı (−36,1 dB). Ölçümün
   birincisi bir **lavta** parçasıydı (−18,0 dB). Seçilen ise üçüncü bir sayıya bakan parça:
   **dikiş**. Troubadeck'in sonu başından 7,4 dB alçak — bir kerelik 4,4 dB'lik kısma payı,
   her 40 saniyede tekrarlayan bir kusura tercih edildi.

**Yolda bulunan sessiz hata (turun asıl kazancı):** `loadSave` yüzeysel yayılım yapıyordu ve
`parsed.settings` varsayılan ayar NESNESİNİN tamamını eziyordu — ayarlara eklenen her yeni alan
**güncel sürümlü** eski bir kayıtta `undefined` kalırdı, göç bile çalışmazdı. `undefined` bir ses
çarpanı oyunu tamamen susturur. `ayarlariBirlestir` ile tek yere alındı; bu, alan eklemenin değil
ALAN SINIFININ hatasıydı.

**Ayrıca:** `perdele` ve `YARIM_SES` `audioSynth.ts`e çıkarıldı; `ses-metrik` ve `ses-taslak`
oradan alıyor — panoda DUYULAN basamak ile oyunda ÇALAN basamak artık ayrışamaz.

## SIRADAKİ TAM ADIM

**Faz H** — oynanış düzeltmeleri. Sırada bekleyen kalemler: G-01 masa her taraftan toplanmıyor ·
G-02 ocaktan alma güvenilmez · G-03 kamera kayıyor · masa aralığı (0,68 br, geçiş 0,94 ister —
20 masanın 12'si) · E1 yürünebilir mutfak. G-06 ve G-07 DENGE, varyant kapısına tabi.

**S9'un bıraktığı iki açık uç:** ① müziğin telefonda gerçek maliyeti ölçülmedi (1740 KB indirme +
sürekli çözme; APK turunda okunacak) · ② `2024-q4` paketi indirilmedi, profili tutan 2 aday
ölçülmedi — parça değiştirilmek istenirse orası ilk bakılacak yer.

**Sonra:** **Faz H** (oynanış düzeltmeleri — G-01…G-07; E1 yürünebilir mutfak orada).

### S19b'DEN KALAN KÜÇÜK KUSUR

Bel bağının ucu çeyrek açıdan ince bir dudak bırakıyor (`docs/gorsel/ss/s19b-kiyafet.png`).
Ölçü değil biçim; pay 0,035 → 0,012 ile küçültüldü, sıfırlanmadı. Bir sonraki sanat turunda.

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

**Oynanış (Faz H):** ~~yükseltme tetiği "yanında"~~ → S24'te KAPANDI (D-121) · G-01 masa her taraftan toplanmıyor · G-02 ocaktan alma güvenilmez ·
G-03 kamera kayıyor · G-06 tepsi ilk yükseltme 75 → ~50 · G-07 dwell para-bağımsız (son ikisi
DENGE, varyant kapısına tabi) · masalar geçilmiyor (açıklık 0,68 br, geçiş 0,94 ister — 20 masanın
12'si).

**Altyapı:** pano ARTIFACT'i **bu turda da kapatıldı** (v45 · 98/108) — borç birikmedi. Yayının bedeli yazılı: canlı sürümün **1611 satırının tamamı** okunmadan publish
reddediliyor (~130k token) — yani atlanırsa borç büyüyor, her turda kapatmak ucuz. ·
`npm run lint` 31 hata (hepsi eski `tools/olcum-*.ts`) · ~~`.gitattributes` YOK~~ → **S24'te
KAPANDI:** `* text=auto eol=lf` autocrlf'i eziyor, `.bat`/`.ps1` CRLF, ikililer `binary`;
`git add --renormalize .` 0 dosya bozdu (depo zaten LF'ti, kilitlenen çalışma ağacı) ·
`npm run pano` günlük uyarısı yalnız TARİHE
bakıyor · mutfağın kuşbakışı karesi OYUNDAN çekilemez (tepeden kamera oyuncunun üstünde, oyuncu mutfağa giremiyor) — plan ölçüm aracının işi · **oyuncuda 2,0× artık kayma** · **panel dönüşünde T-poz temiz koşuda ÜRETİLEMEDİ**
(repro aracı `tools/olcum-panel-donusu.mjs`).

**Önizlemeler**
**S9 SES KARAR PAKETİ (DİNLENEBİLİR):** https://claude.ai/artifact/49KsxE368xVHWbw4wHdkSy
**S24 KARAR PAKETİ:** https://claude.ai/artifact/84hN6nieCHVXHMcBS81d4u
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
**İlerleme panosu (v45 · 98/108):** https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs

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
