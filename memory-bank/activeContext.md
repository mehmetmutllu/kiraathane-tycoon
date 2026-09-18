# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-18 — **2026-09-18 geri bildirimi · T1 ONARIM BİTTİ** · sıradaki: T2 görev akışı)

```
SORU            : Kullanıcının 5 dakikalık oynanışından (ses kaydı) + yazılı notlarından çıkan
                  24 kalem (G-58…G-81) hangi sırayla, hangileri ölçümsüz kapanır?
ÖLÇÜLEN KOLLAR  : (T1'de kol YOK — bu kova "doğrusu tek" olan kalemler. Ölçüm T3/T4'te.)
                  Turda ölçülen tek sayı G-68'in payı: duvar–tezgâh 0,30 br · aktör çapı 0,56 br.
SAYILAR         : docs/geribildirim-oyun-testi-2026-09-18.md (24 kalem, kodda doğrulanmış kökler)
PLAN            : docs/plan-geribildirim-2026-09-18.md — T1→T2→T4→T3→T5 (kullanıcı onaylı)
KARAR           : **D-133** — sıra + G-69 "hiç olmasın" + G-68 "duvardan çıkmasın, en az pay" +
                  G-67 "ikisi birden" (D-092'nin hızı KALIR, üstüne ₺)
UYGULAMA        : T1 · G-78 · G-79 · G-77 · G-69 · G-70
BEKÇİ           : tests/onarim-g58-g81.test.ts (14) + gorev-kimligi.test.ts'e G-77 bekçisi
                  → **2 mutasyonla doğrulandı** (saveNow'dan alan çıkarma · kelepçe kaldırma)
```

**T1'DE KAPANANLAR — dördü de D-133'te, burada tek satır:**
① **G-78 veri kaybıydı.** `upgradeFills`/`tableUpgradeFills`/`lavaboFill` kayıt şemasında YOKTU;
`padFills` vardı. Yarım yükseltmeye ödenen para her yüklemede yanıyordu. Şema EKLEMELİ büyüdü
(sürüm artmadı — `lavaboLevel` deseni), dolum bugünkü maliyete kelepçeli.
② **G-79'un kökü doğum yeri DEĞİL, tetiğin tanımıydı.** Dwell "duruyor"a bakıyordu ve yüklemenin
ilk karesinde oyuncu tanım gereği duruyor → noktanın üstünde AÇILMAK, oraya YÜRÜMEKLE aynı
sayılıyordu. Artık kenar-tetikli; ayrıca Usta modali `!showOffline` ile kelepçeli.
③ **G-77 sessiz bir off-by-one'dı:** dünya `L${sv+1}` yazıyor, görev başlıkları İÇ sayıyı
yazıyordu. Başlık düzeltildi, **hedef sayısına dokunulmadı** (o tempo olurdu → varyant kapısı).
④ **G-69/G-70 yanlış DURUM okuyordu**, sunum hatası değil: tezgâh kattaki HER bardakla kirleniyor
ve mekanik açılmadan sahnede duruyordu. İkisi de saf yükleme olarak `rules.ts`e alındı
(`dishStationVisible` · `sinkDirty`) — bileşenin içinde kalsalar ölçülemezlerdi.

**KAPSAM SINIRI (bilerek yapılmadı):** kullanıcının *"birkaç tane bıraktıktan sonra"* dediği
**tezgâhta biriken istif** bugün yok (yıkama teslimde anlık). Eklemek bardak döngüsünün hızını
değiştirir → **T3-K9**. Bu tur yanlış olanı düzeltti, yeni mekanik açmadı.

**SIRADAKİ TUR — T2 · GÖREV AKIŞI "TEK SIRA HATTI" (G-58…G-64, G-71, G-81)**
Kullanıcının dört ayrı cümlesi tek sistem: `çalışıyor → KUTLAMA → YENİ KART → HEDEF AÇILIR →
KAMERA`, ve ekranda modal/uyarı varken zoom gelmez. Bugün `visiblePads()` doğrudan `questIndex`e
bakıyor, pad aynı karede beliriyor. **Zemin var:** `rules.ts`te `QUEST_COMPLETE_DUR` /
`QUEST_GAP_DUR` ve store'da `questPhase`/`questPhaseT`/`questDoneIndex` zaten duruyor — T2 sıfırdan
kurmayacak, var olan faz makinesini pad/yükseltme/kamera/bildirim kanallarına BAĞLAYACAK.
Bu G-41…G-44'ün (2026-09-16) kapanmadığının kanıtı; bekçi bu turda kesilmez.

**AÇIK KALAN ÖNCEKİ TUR:** F3 (AdMob) tur 1 ölçümü bitti, **karar hâlâ bekliyor** (C1′ önerildi,
onay gelmedi) — `docs/reklam-raporu-f3.md`, progress.md Faz F. G-67'nin video ×2 kanadı buna bağlı.

---

**G1 KARAR PAKETİ (görev şeridi · kareler + sayılar):** https://claude.ai/artifact/F2jowE134dyDnzEQPBsAgy
**G1 kareler:** `ss/g1-serit-normal.png` · `ss/g1-serit-bitti.png` (ikisi de UYGULAMA SONRASI)
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
**İlerleme panosu (v48 · 101/108):** https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs

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
