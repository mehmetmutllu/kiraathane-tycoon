# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-15 — **S20 BİTTİ: E2 + Ç1 koda girdi, bekçili** · Faz S 20/22 · 95/106)

```
SORU            : Mutfak odası oyuna ne veriyor — girilemeyen, mekaniğe bağlanmamış ve ortası
                  boş bir vitrin mi, yoksa kazanılacak bir alan mı?
SAYILAR         : docs/mutfak-raporu-s20.md §Bulgular · ham: docs/olcum-mutfak.txt (tam, 17 damga)
                  görünürlük %99 orta · erişim 0/37.846 · çaycı %100 görünür · boşluk 39,91 br²
KARAR           : D-118 — E2 + Ç1 uygulandı · D2 → S21 · E1 → Faz H (nav ızgarasıyla birlikte)
UYGULAMA        : E2 iki sınır bölmesi (2,81 + 1,70 br, salt görsel) ·
                  Ç1 çaycı temposu çay bekleyenden (0 / 0,60 / 2,00 — boş↔dolu 3,33×)
BEKÇİ           : tests/mutfak-s20.test.ts — 17 denetim, 3 MUTASYON kırmızı yandı
FINAL           : vitest 1051 ✓ · duman 42/42 ✓ · konsol hatası YOK
```

## SIRADAKİ TAM ADIM

**S22 — KADEMELİ MUTFAK (tur adı S21, D-118’in D2 kolu).** Ölçüm sayıyı verdi: tezgâh **6 kademe** büyürken oda her seviyede
aynı **19 sabit** üniteyi çiziyor (`KitchenUnit`'te seviye alanı 0), ve odanın **%42'si**
(39,91 br²) **%100 görünür** boş. Tur ÖNCE ilerleme adımlarını tasarlar (kullanıcı kuralı:
"objeler küçük doğup yerinde büyür"), sonra çizer.

**Sonra:** S19'un kalan dört kalemi (1) karakter menüsü KayKit gövdesine · (2) paneller tam ekran ·
(3) yükseltme tetiği pad'in üstünde — **varyant kapısı, `rules.ts`** · (4) yükseltmenin solundaki ok
· sonra S9 SES karar paketi · sonra **Faz H** (E1 yürünebilir mutfak orada, nav ızgarasıyla birlikte).

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

**Altyapı:** pano ARTIFACT'i **bu turda da kapatıldı** (v41 · 95/106) — borç birikmedi. Yayının bedeli yazılı: canlı sürümün **1611 satırının tamamı** okunmadan publish
reddediliyor (~130k token) — yani atlanırsa borç büyüyor, her turda kapatmak ucuz. ·
`npm run lint` 31 hata (hepsi eski `tools/olcum-*.ts`) · `.gitattributes` YOK
(`core.autocrlf` her checkout'ta CRLF'e çeviriyor) · `npm run pano` günlük uyarısı yalnız TARİHE
bakıyor · **oyuncuda 2,0× artık kayma** · **panel dönüşünde T-poz temiz koşuda ÜRETİLEMEDİ**
(repro aracı `tools/olcum-panel-donusu.mjs`).

**Önizlemeler**
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
**İlerleme panosu (v41 · 95/106):** https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a

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
