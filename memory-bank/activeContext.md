# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-14 — **S19a ÖLÇÜM** · Faz S 18/19 · 92/103)

```
SORU            : Kullanicinin yedi kaleminin ilk ucu — patron ayirt edici dokunusu (lacivert
                  gomlek GERI) · oturus capasi ("gotleri disarda") · siparis balonu glifleri.
OLCULECEK KOLLAR: P) patron dokunusu — sekiz aday, garson referansiyla ayni kadrajda
                  O) oturus — klipte kalcanin ILERI ekseni (z); bugun capa YOK, kok tabure
                     merkezinde; kollar: O1 bugun · O2 kalca-merkezli capa · O3 kismi capa
                  G) glif — bardak ve tost icin aday cizimler, bugunkusu referans kartta
SAYILAR         : docs/olcum-oturus.txt · docs/patron-oturus-glif-raporu-s19a.md §Bulgular
                  kareler: ss/s19-oturus.png · ss/s19-patron.png · ss/s19-glif.png
KARAR           : (adim 3 — kullanici secer)
UYGULAMA        : (adim 4 — yalniz kararin kolu)
BEKCI           : (adim 4)
```

## SIRADAKİ TAM ADIM

**S19 — kullanıcının 2026-09-14 (gece) verdiği YEDİ KALEM.** Hepsi görsel/arayüz; hiçbiri denge
dosyasına dokunmuyor (yükseltme tetiği hariç, o `rules.ts`e bakabilir → varyant kapısı).

1. **PATRON DOKUNUŞU — lacivert gömlek GERİ ALINACAK.** Kullanıcı: *"üstü garip olmuş, beyaz daha
   ayırt ediciydi o kalabilir ama diğerlerinde olmayan farklı bir dokunuş yap"*. Yani gömlek krem
   kalsın; ayırt edici sinyal BAŞKA bir şey olsun (önlüksüzlük duruyor, üstüne tek bir kişisel
   parça — yelek/plaka DEĞİL, o kol S18'de karede elendi).
2. **OTURMA POZU — "götleri biraz dışarda kalıyor"**: `KAY_OTURMA_KALDIRMA` (0,068) kalçayı
   oturağa getiriyor ama İLERİ/GERİ kayma ölçülmedi. Kalçanın taburenin ORTASINA gelmesi için
   z ekseninde de bir çapa gerekiyor. Ölçüm: `Sit_Chair_Idle` klibinde kalça ham z'si.
3. **SİPARİŞ BALONU GLİFLERİ yeterince iyi değil** — bardak ve tost yeniden çizilecek
   (`siparisBalonu.ts`, Canvas2D). Ölçü ve gramer duruyor, çizim zayıf.
4. **KARAKTER MENÜSÜNDE YENİ TASARIMLAR** — panel hâlâ `Player.tsx`'in ESKİ ilkel `OwnerBody`sini
   gösteriyor (S15'ten beri açık kalem); KayKit gövdesine geçecek. Garson/bulaşıkçı sekmeleri de.
5. **PANELLER EKRANI TAM VE DÜZGÜN KULLANSIN** — karakter menüsü ve diğerleri.
6. **YÜKSELTME TETİĞİ PAD'İN TAM ÜSTÜNDE** — *"yanında falan değil, çerçeve içinde olayım"*.
   Bugün `TABLE_UP_RADIUS` 1,0 / `PAD_RADIUS` 1,3 daire; istenen ÇERÇEVE İÇİ. Yarıçap daralırsa
   ya da kare teste dönerse `rules.ts`e dokunur → **varyant kapısı**, ölçüm ister.
7. **YÜKSELTMENİN SOLUNDAKİ OK** — ya kalkacak ya düzeltilecek; şu an çerçeveye değiyor/içinde
   kalıyor (`s18-durum-hud.png`de "SV 3" kartının solundaki yukarı ok).

**Ardından:** S9 SES (ölçüm bitti, karar bekliyor — aşağıda) · sonra **Faz H**.

### S9 SES — ÖLÇÜM BİTTİ, KARAR PAKETİ BEKLİYOR

`docs/olcum-ses-s17.txt` hazır (tam koşu damgalı). 9 CC0 Kenney paketi · 706 .ogg · 36 aday
Chromium `decodeAudioData` ile çözüldü. **Bulgular:** dosyalı dokuzlu 36/36 AYRI (sentezle aynı
hüküm) · dosyalar sentezden **16,6 dB yüksek** (normalizasyon gerek) · **7/9** seçilen dosya
`aralik` kelepçesini taşıyor · akan sıvı **0 aday** · ortam/döngü **0 aday** (O2 kolu düştü).
Karar paketi sunulmadı; tur bu yüzden kapanmadı.

## AÇIK KALEMLER (ölçüldü/görüldü, bilerek duruyor — tam listesi `memory-bank/arsiv/`de)

**Karakter/sanat:** Rogue'un omzu 0,709 (blob sınırı 0,60 aşılıyor) · önlük düz plaka · klip
dosyaları mankenin gövdesini de taşıyor (dosya başına 6.916 üçgen ölü yük) · müşteri gövdeleri
personelle aynı · `Rogue_Hooded` süzgece takılmıyor.

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
bakıyor · **oyuncuda 2,0× artık kayma** (taban hızda; düşürmek D-095 kilitlerini oynatıyor,
S18'de ölçüldü) · **panel dönüşünde T-poz temiz koşuda ÜRETİLEMEDİ** — kullanıcı HMR sırasında
görmüş olabilir, repro aracı hazır (`tools/olcum-panel-donusu.mjs`).

**Önizlemeler**
**S19a KARAR PAKETİ:** https://claude.ai/code/artifact/a8d02997-974d-4f2a-a00c-f916820a69c7
**S19a kareler:** `ss/s19-oturus.png` · `ss/s19-patron.png` · `ss/s19-glif.png`
**S18 patron adayları (sekiz kart):** `docs/gorsel/ss/s18-patron.png`
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
