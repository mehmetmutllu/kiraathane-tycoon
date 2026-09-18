# activeContext — TUR KARTI

> **Bu dosya ÜZERİNE YAZILIR.** ≤ 80 satır, yalnız "şu an". Geçmiş anlatı buraya
> yığılmaz: karar → `decisions.md` · sayı → `docs/*-raporu-*.md` · durum → `progress.md`
> tek satır · zaman çizelgesi → git · eski anlatı → `memory-bank/arsiv/`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## ŞU AN (2026-09-18 — **T1 + T2a + T2b bitti · T4 ÖLÇÜMÜ BİTTİ, KARAR BEKLİYOR**)

```
SORU            : Kullanıcının 5 dakikalık oynanışından (ses kaydı) + yazılı notlarından çıkan
                  24 kalem (G-58…G-81) hangi sırayla, hangileri ölçümsüz kapanır?
ÖLÇÜLEN KOLLAR  : (T1'de kol YOK — bu kova "doğrusu tek" olan kalemler. Ölçüm T3/T4'te.)
                  Turda ölçülen tek sayı G-68'in payı: duvar–tezgâh 0,30 br · aktör çapı 0,56 br.
SAYILAR         : docs/geribildirim-oyun-testi-2026-09-18.md (24 kalem, kodda doğrulanmış kökler)
PLAN            : docs/plan-geribildirim-2026-09-18.md — T1→T2→T4→T3→T5 (kullanıcı onaylı)
KARAR           : **D-133** (kalemler+sıra) · **D-134** (T2a) · **D-135** (T2b) — sıra + G-69 "hiç olmasın" + G-68 "duvardan çıkmasın, en az pay" +
                  G-67 "ikisi birden" (D-092'nin hızı KALIR, üstüne ₺)
UYGULAMA        : T1 · G-78 G-79 G-77 G-69 G-70  |  T2a · G-59 G-60 (G-61 yarısı → T3-K11)
                  T2b · G-58 G-62 G-63 G-64 G-81 + lang=tr (G-71 → T3-K10)
BEKÇİ           : onarim-g58-g81 (14) + gorev-hatti-t2 (15) + kutlama-ogretme-t2b (24)
                  + gorev-kimligi'ye G-77 bekçisi → **her tur 2 mutasyonla doğrulandı**
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

**T2a BİTTİ (D-134) — GÖREV AKIŞI, MANTIK KANADI**
Kök neden dardı: `questIndex` hedef karşılanır karşılanmaz ilerliyor (bu BİLEREK böyle, q_coin
dominosu) ama dünyayı çizen/tetikleyen her yer o HAM sayıyı okuyordu → kart hâlâ biten görevi
yazarken pad çoktan beliriyor, kenar oku çoktan yeni hedefe atlıyordu. Çözüm yeni durum değil
TÜREV: `cardQuestIndex` — "kart hangi görevi gösteriyorsa dünya da onu gösterir". G-60'ta reveal
uyarıları pencerede hiç işlenmiyor (silinmiyor, bekliyor) ve ekran kanalları tek sıraya alındı
(`src/game/ekranKanali.ts`: çevrimdışı > Usta > ipucular; ipucular bildirim/kutlama/panel varken
bekler). **G-61 ikiye bölündü** — kalıcı kapı tempo olduğu için T3-K11'e taşındı.
**Turun kalıcı dersi:** `logic.test.ts`in *"reveal toast + pan tetikler"* testi yıllardır yeşildi
ama ikisi de reveal'ın eseri değildi (toast biten görevin, odak bayat). Davranış değişmeseydi
görülmeyecekti; iddia gerçekten kapsanmayan bir kuruluma taşındı.

**T2b BİTTİ (D-135) — KUTLAMA · FARKINDALIK · ÖĞRETME**
G-58 kutlama artık bir AN (bant hiç yeniden monte olmadığı için ekranda HİÇ hareket yoktu) ·
G-62/G-81 sekme halkası zamanlayıcısız (iki tekrar çalıp durur, bayrak var olandan türer) ve
hedef panosunda hazır ödül üstte · G-63 öğretme kartı ÜST BANTTA (modal olsaydı kamerayı
çevirmenin anlamı kalmazdı) · G-64 spotlight artık konuşuyor.
**Yan bulgu:** `<html lang="en">` Türkçe büyük harfi bozuyordu — kart ekranda "BULAŞIK BIRIYOR"
yazdı; yedi `uppercase` yeri aynı kusuru taşıyordu, hata testte değil KAREDE çıktı → `lang="tr"`.
**Turun dersi:** ölçüm aracının kendisi kusuru taklit edebilir — `shot-t2b.mjs`in ilk hâli kutlama
karesinde YENİ görevin kartını çekiyordu (oyun kare alınırken akmaya devam ediyor).
**G-71 bilerek yapılmadı:** kök G-68; emniyet kemeri aktör hareketine dokunur → T3-K10'da ölçülür.
**Görsel kanıt:** `docs/gorsel/ss/t2b-{1..4}-*.png` · `node tools/shot-t2b.mjs`

**T4 · PERFORMANS — ÖLÇÜM BİTTİ, KARAR BEKLİYOR (kod YAZILMADI)**
Araç: `tools/olcum-perf-t4.mjs` · rapor: `docs/perf-raporu-t4.md` · ham: `docs/olcum-perf-t4.{txt,json}`
(TAM koşu damgalı). Araç kısa koşuda İKİ kez çürütüldü: ① kare süreleri vsync'e kilitliydi
(16,7/33,4/50,0 — kol farkları 0 okunuyordu) ② `questIndex` 0 kaldığı için **bulaşık döngüsü hiç
çalışmıyordu** ve "kirli kap: 0" "sorun yok" diye okunacaktı.

**Dört bulgu:**
① **Yük ×6,6** — 8,3 ms/117 fps (erken) → 55,1 ms/**15,1 fps** (geç). Çağrı 36→171, üçgen ×12.
② **SIZINTI YOK** — aynı dünyada 3 dakika: kare −%5,2, yığın **%0,0**, program sabit. Yani oyun
   *oynadıkça* değil *büyüdükçe* yavaşlıyor → "sızıntı ara" kolu ÖLÇÜMLE ELENDİ.
③ **dpr kolu ÖLÜ, hatta ters** (+%6,6): piksel 4 kat azaldı, kare uzadı ⇒ darboğaz CPU tarafında.
   Gölge hâlâ en büyük tek kalem ama payı F2'deki %40'tan **%21,7**'ye düşmüş.
④ **ŞARJIN KAYNAĞI KASMA DEĞİL:** `frameloop` verilmemiş, fps tavanı YOK — erken oyunda
   **116,7 fps**. Oyuncu 60 üstünü göremez; 120 Hz telefonda bu doğrudan pil.

**KARAR GELDİ (D-136) — KOD HÂLÂ YAZILMADI.** Şarj → **K-A 60 fps tavanı**. Kasma → kullanıcı
*"kalite bozmadan ve düşürmeden en mantıklı hamleler"* dedi; bu cümle kolları kendisi eledi:
**K-C** (instancing — aynı piksel/gölge, yalnız daha az çağrı) ve **K-E** (React commit 0,38→0)
SEÇİLDİ · **K-B** (gölgeyi kapat) kaliteyi düşürdüğü + D-073 kullanıcının kendi kararı olduğu için
ELENDİ · **K-D** (müşteri tavanı) geliri düşürür → T3.

**SIRADAKİ OTURUMUN İŞİ — T4 commit #2 (sıra: K-A → K-E → K-C)**
Kabul ölçütü SAYI LİSTESİ (`docs/perf-raporu-t4.md` §Karar): erken fps ≤ 62 · geç çizim çağrısı
171'den düşer · commit/kare ≤ 0,05 · **gölge AÇIK kalır** · §B'de eğilim yok.
Final koşu: `OLCUM=tam node tools/olcum-perf-t4.mjs`.
Ondan sonra **T3 denge turu** (K1…K11 + G-70'in istif kolu + G-71/G-68 yerleşimi).

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
