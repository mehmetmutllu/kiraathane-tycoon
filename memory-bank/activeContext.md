# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-10 — **S7 BİTTİ** · Faz S 7/12 · 82/96)

```
SORU            : (S7) WC odasının içi ekrana giriyor mu — giriyorsa kabin kapıları KayKit'e
                  geçer mi, seviye MEKÂNSAL okunur mu (G-36), müşteri niye buharlaşıyor (G-35)?
SAYILAR         : `docs/wc-odasi-raporu-s7.md` · taban `docs/olcum-wc-odasi-taban.txt` ·
                  final `docs/olcum-wc-odasi-final.txt` · görsel `docs/gorsel/ss/s7-*.png`
KARAR           : **D-104** — K2 `door_A` (yeşil kanat) · L lavabo+kabin sayısı birlikte ·
                  M içeri yürü + yana sap + sön.
BEKÇİ           : `tests/wc-odasi.test.ts` (26 denetim) · **15 mutasyon** (biri kaçtı, ölçüt sıkıldı)
                  vitest **889** · duman **42/42** · `tsc -b` temiz · 7 kadraj gözle.
```

**S7'nin dersi: sayı ile ekran birbirinin yerine geçmiyor.** `door_A`nın köşe histogramı x'te
0,48…1,12 arasında boşluk gösterdi ve *"ortası boş, demek ki kasa"* diye okudum — yanlıştı, orası
düz bir panelin İÇİ (düz yüzün ortasında vertex yoktur). Bu ders S4'te öğrenilmiş ve S6 raporunda
**yazılıydı**; yazılı kural yetmedi, araç gerekti → **`tools/model-bak.mjs`** modeli çizip gösteriyor.

**İkinci ders: görsel tur, testlerin bulamadığını buluyor.** Oda açıkken BOŞ çizilebiliyordu
(`padsDone` ile `lavaboLevel` dev kancasında ayrışıyor). 889 test yeşilken ekran görüntüsü
yakaladı. Yama değil türetme: `wcSeviye()`.

**Üçüncü ders: kaçan mutasyon bazen kodu değil BEKÇİYİ gösterir** — kaynak denetimi `door_A.gltf`
metnini bir yorumdan buluyordu, ölçüt gerçek `src=` ifadesine çevrildi.

**En pahalı bulgu:** doğu duvarı `maxLevel` kadar (6) lavabo **almıyor** (7,40 br, en çok 5) ve en
öndeki slot **%0** görünüyor → sinyal lavabo + kabin diye ikiye bölündü.

## SIRADAKİ TAM ADIM

**S8 — SES ASSETLERİ** ya da **giriş cephesi camı**. İkisi de hazır ama **ses kaynağı kararı
kullanıcıdan bekliyor** (asset panosu §7, dört kol; D-096'yı kısmen geri alır). Karar gelmezse
sıradaki iş **giriş cephesi cam turu**: S6/②'de ertelendi, S7'de kullanıcı kararıyla ayrıldı;
ölçüm değer diyor (cephe salonun en görünür ikinci şeridi, %8–15) ama kapı bloğuna (söve · lento
· alınlık) ve duvar temasına dokunduğu için kendi turunu ister.

**KULLANICI KARARI BEKLEYEN ÜÇ ŞEY** (hiçbiri sıradaki turu bloklamıyor):
1. **Ses kaynağı** (S8) — asset panosu §7, dört kol.
2. **Karakter kolu** (S12) — asset panosu §3, altı kol, bedelleri yazılı.
3. **H2 yükseltme sırası** (A tek hedef / B kuşak) ve **H3 masa aralığı** (K1 aralığı aç /
   K2 oturak küçült — K2 önerilmiyor, `feedback_reference_scale_trap`).

**Asset panosu:** https://claude.ai/code/artifact/2e7f92c0-15b6-4f72-814d-753cf79d74e0

## AÇIK KALEMLER (bilinen, bilerek duruyor)

### S7'den DEVREDEN (ölçüldü, bilerek yapılmadı)

- **`door_A`nın İTME BARI duruyor.** Bar bir restoran mutfak kapısının parçası, WC kabininde
  yeri yok — ama modelde ayrı alt-mesh DEĞİL (tek mesh, 188 üçgen), sökülemiyor. Bedeli bilinerek
  kabul edildi. Başka paket gelirse ilk bakılacak kalem.
- **WC odasının ORTASI hâlâ boş + TAVAN IŞIĞI yok** (`feedback_room_volume`). §V zeminin %2
  görünür olduğunu söylüyor: dolgu zemine değil duvar kenarına/yüksekliğe gitmeli. Kendi turu.

- **S5'te söz verilip YAPILMAYAN:** ① banket masası `table_round_A_small`e geçecekti ② mağaza
  kartlarının gerçek oyun render'ı (`tools/tema-kapak.mjs` kadrajı bozuk). Kullanıcı 2026-09-10'da
  **kendi turunda kalsın** dedi; ikisi de ölçüm ister.
- **`tsc -b` kapanışa girmeli** — dört turdur elle yakalanıyor, kural olmadıkça yine kaçar.
- **Tente kapıyı tamamen örtüyor (F1, kullanıcı kararı).** Sayı biliniyordu (%77), görsel daha
  sert çıktı. Geri dönüş kolu F4 hazır ve ölçülü: dikey tabela 0,34 → 0,72, sınır üst kenar 1,97.
- **KayKit `bench` düz bir plaka gibi okunuyor** (0,36 br boyunda, sırtlıksız). Model bu; sokak
  kadrajında turuncu bir set gibi duruyor. Değişecekse başka paket ister.
- **WC ÇÖP KUTUSU elle çizim kalıyor** — üç pakette karşılığı YOK ve bu İKİNCİ kez ölçüldü
  (S5 + S6/②). `trash_A/B` 18 üçgenlik yer çöpü, `dumpster` konteyner. Kullanıcı istedi, yok.
  Yeni paket gelirse ilk bakılacak kalem.
- **`npm run lint` 31 hata veriyor** (hepsi ESKİ `tools/olcum-*.ts` dosyalarında, kullanılmayan
  değişkenler). S5'in dosyaları temiz; lint kapanış protokolünde olmadığı için birikmiş.
- **G-01 çay/bulaşık toplama masanın her tarafından olmuyor · G-02 çay ocağından alma güvenilmez ·
  G-03 2. masa görevinde kamera kendiliğinden kayıyor** — üçü de HATA, kendi turunu ister. (H1.)
- **G-05 görev metinleri açıklayıcı değil** — altta net hedef, üstte kısa lakap (yazım işi).
- **G-06 tepsi ilk yükseltme 75 → ~50 · G-07 yükseltme dwell'i para-bağımsız sabit olsun** —
  ikisi de DENGE, varyant kapısına tabi, **ölçülmeden uygulanmaz** (Faz H'de H2 ile aynı turda).
- **Masalar geçilmiyor (ÖLÇÜLDÜ, uygulanmadı):** arka salonda açıklık **0,68 br**, geçiş 0,94
  ister → 20 masanın 12'si geçilemez. İki kol
  `docs/geribildirim-oyun-testi-2026-09-09.md` sonunda. (H3.)
- **G-16 arayüz kahverengi/iç karartıcı → mavi · G-17 ekranlar tam-ekran mı modal mı · G-10 pad
  şekli** — kullanıcı "bilemedim" dedi; **maket görmeden koda girmemeli**. (S9.)
- **G-18 masaya tıklayınca seviye gözüksün mü** — kullanıcı düşünüyor, açık soru.
- **`.gitattributes` YOK** — `core.autocrlf=true` her checkout'ta metin dosyalarını CRLF'e çeviriyor.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün ikinci oturumda sessiz
  kalıyor; kural "sayaç arttıysa kart da artmalı" olmalı.
- **Bulaşık gövdesi kutusundan geniş çizilemiyor** — `kitchentable_sink_large` native 3,0, kutu
  2,0 × 1,0; model kutuya çekiliyor ve hafif basık duruyor. Kutuyu büyütmek yürüme alanına dokunur,
  kendi ölçümünü ister.

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
