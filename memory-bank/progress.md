# progress — Durum Panosu

Durum: ✅ bitti · 🔧 devam · ⏳ bekliyor

> **Bu dosya kısa tutulur** (pano tablosu + aktif faz). Oturum başına **1-2 satır**;
> anlatı yok — sayı raporda, karar `decisions.md`'de, zaman çizelgesi git'te.
> Bitmiş fazların tam anlatısı: `memory-bank/arsiv/progress-tamamlanan.md`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## İLERLEME PANOSU — oturum sayacı
`docs/pano/ilerleme-panosu.html` · https://claude.ai/code/artifact/04588e2c-0761-4e69-82d4-2f068ca5750a
Bu tablo **kaynaktır**; pano JSON'u buradan **türetilir**: `npm run pano` (elle sayı yazılmaz).

**Oturum bütçesi (TOPLAM 79 · YAPILAN 71 · %90):**

| Dönem | Faz | Yapılan/Toplam |
|---|---|---|
| Kuruluş (5 Haz – 11 Ağu) | F0 planlama · F1 greybox · F2 servis · F2Q görev · F3 roller · F6 sanat · DN denetim | **28/28 ✅** |
| Yayın programı (1 Eyl →) | P plan ve maket | 6/6 ✅ |
| | G görsel taban | 4/4 ✅ |
| | A temizlik | 3/3 ✅ |
| | B model geçişi + maket taşıması | 13/13 ✅ |
| | **C zincir ve denge** | **5/5 ✅** |
| | İA iş akışı hızlandırma (D-084) | 3/3 ✅ |
| | D meta katman | 8/8 ✅ |
| | E arayüz ve cila | 1/4 🔧 |
| | F paketleme ve yayın | 0/5 ⏳ |
| **Program toplam** | | **43/51** |

Kuruluş dönemi sayısı commit kaydından türetildi (114 commit / 14 çalışma günü); oturum-başı
defter tutmak yayın programıyla başladı. **Bütçe düzeltmesi 2026-09-08:** iş akışı hızlandırma
(D-084 P1-P3) üç kalemlik yeni faz olarak eklendi → toplam 73 → 76. **2026-09-09:** D3'ün ödül
KALIBI kendi turunu istedi (D3b) → Faz D 5 → 6 kalem, toplam 76 → 77. **Aynı gün:** nav ızgarası ↔
oyuncu çarpışması bilinen-hata listesinden çıkıp kendi turu oldu (D5) → Faz D 6 → 7, toplam 77 → 78.
**Aynı gün:** D7 kullanıcı kararıyla ölçüm (D7a) ve UI (D7b) olarak ikiye bölündü → Faz D 7 → 8,
toplam 78 → 79.

**v1 kapsam çizgisi:** prestij · Kat 2 · sipariş nesnesi · aktif WC döngüsü · dekor instancing
**v1.1'e**; v1 = Kat 1 + elmas/Usta + offline tavan + reklam/IAP + mağaza.

---

## Faz C — ZİNCİR VE DENGE (5/5) ✅
- ✅ **C1 — ölçü donduktan sonraki tek ölçüm (D-078)** · geometri dengeyi bozmadı (zincir +%0,8),
  "plato" bulgusu çürüdü, tempo denetiminin 3 ölçütü de ölçülür oldu · `docs/denge-raporu-c1.md`
  · vitest 463 · denge sayısı değişmedi.
- ✅ **D-079 — açılış temposu ölçütü bayat ilan edildi ve güncellendi** (yeni ölçüt: garsona kadar
  hiçbir alım boşluğu 2 dk'yı aşmaz; ölçülen 1,6 dk ✓) · `docs/denge-raporu-c1.md` §2.
- ✅ **C2 — Tek Odak'ın dördüncü kanalı (D-080)** · nokta silinmedi, ses katmanlandı: çizilen 16 →
  aynı anda konuşan en çok 3 · `docs/tek-odak-c2.md` · vitest 476 · denge sayısı değişmedi.
- ✅ **C3 — sipariş kuyruğu ölçüldü, üstlenme BAĞLAYICI oldu (D-081)** · servis G4 172→239,
  mesafe↔terk korelasyonu 0,53→0,24 · `docs/kuyruk-raporu-c3.md` · vitest 482 · denge sayısı değişmedi.
- ✅ **C4 — bardak kilidi ölçüldü ve açıldı (D-082 → D-083)** · boştaki garson bulaşık topluyor:
  B2 0,80 → 7,53 servis/dk, terk %33 → %5 · `docs/bardak-raporu-c4.md` · vitest 485 ·
  tek yeni denge sayısı `waiter.idleDishCarry: 1`.
- ✅ **C5 — sim gerçeğe yaklaştırıldı (D-086)** · dört model kusuru varyant olarak ölçüldü, ikisi
  girdi (taşıma çok duraklı + masa kalem kalem), üçü ölçülerek elendi. Model↔gerçek sapması
  **%36 → %8**, sahte masa beklemesi **21,4 → 4,5 dk** · `docs/sim-gercek-raporu-c5.md` ·
  bekçi `tests/sim-model.test.ts` (17 test, 3 mutasyon) · vitest 552 · **denge sayısı değişmedi.**
  Açılan kalem: gerçek modelde 20 dk ölçütü 6 kez ihlal (kendi turunu ister).

## Faz İA — İŞ AKIŞI HIZLANDIRMA (3/3) ✅ — D-084
- ✅ **P1 — mantık kuruldu + hafıza kesimi.** Fable 5.1 ölçtü: tam ölçüm koşusu 8 dk 02 sn × 7 =
  168 dk'nın %33'ü (önceki %15 tahmini çürüdü) · activeContext 96 "ŞU AN" bloğu / silme %13 ·
  C4'ün 11 anahtar sayısının 9'u dört dosyanın dördünde de var. Rapor `docs/oturum-akisi-mantik.md`.
  Uygulanan: `memory-bank/arsiv/` kesimi · activeContext → 61 satırlık tur kartı · progress → bu hâl ·
  iki skill güncellendi. Hedef 168 → ~95 dk.
- ✅ **P2 — `tools/olcum-lib.ts` + üç damga + `OLCUM=kisa|tam`.** Kısa koşu bardak **11,0 sn** ·
  kuyruk **14,6 sn** (tabanları 8-13 dk); tam koşu çıktısı tabanla **birebir aynı** (ikisi de).
  Damga C4 tuzağı ② yeniden üretilince yakaladı (3 damga, çıkış kodu 1). Bekçi
  `tests/olcum-lib.test.ts` (10 test, iki mutasyonla doğrulandı). Üç araç lib'e bağlandı.
  **Damgalar ilk tam koşuda iki GERÇEK kusur buldu:** `iade:0.25` varyantı hiç tetiklenmemiş
  (C4 raporu §4 düzeltildi; Bulgu 3'ün sonucu değişmedi) · B1 oyuncu kipinde bot hiç yürümüyor.
- ✅ **P3 — kapanış otomasyonu:** `npm run pano` (sayı progress tablosundan türer + defterin dört
  sayı yerini denetler) · `npm run sira` (varyant kapısının commit sırasını denetler, ihlalde
  çıkış 1). İkisi de `oturum-bitir` adım 2-3'e bağlandı. Bekçi `tests/pano-guncelle.test.ts` +
  `tests/sira-kilidi.test.ts` (40 test, **dokuz mutasyonla** doğrulandı) · sıra kilidi gerçek
  geçmişte sınandı (C3 turu temiz, C4 turu ihlal). Araç ilk koşusunda **üç gerçek sapma** buldu.

**Faz kapısı ÖLÇÜLDÜ (C5 turu, 2026-09-08):** 17:56Z → 18:27Z = **31 dk** (tahmin ~95 dk).
**Ama karşılaştırma birebir DEĞİL ve öyle sayılmamalı:** C4'ün 168 dakikasının üçte biri
tick-temelli tam koşulardı; C5'in aracı ANALİTİK (2 sn) ve gereken iki tick koşusu arkaplanda
PARALEL döndü. Yani kapı geçildi, fakat ~95 dk tahmini bu turla ne doğrulandı ne çürütüldü —
**asıl sınav tick-temelli bir denge turu.** Ölçülen gerçek kazançlar: üç dosyalık okuma seti
(oturum başı), uzun koşuların paralel arkaplanı, hazır ölçüm iskeleti.

## Faz D — META KATMAN (8/8) ✅
- ✅ **D1 — geç-oyun eğrisinin 20 dk ihlali ölçüldü ve ölçütün PROFİLİ sabitlendi (D-087)** ·
  dokuz kol varyant olarak ölçüldü, dozlar tahmin değil **çözüldü**; hepsi elendi, ölçütün
  kendisi (`o1`) alındı. Ölçüt kardeş üçüyle aynı profilde (İdealize) hüküm verir ve geçiyor
  (23,9 dk · 1 aşan). Düzeltici kolların hepsi Kat 1 içeriğinden %7-42 götürüyordu; `g1`
  (taşıma tavanı) ihlali 6 → 7 **artırdı**. `docs/gec-oyun-raporu-d1.md` · araç
  `tools/denge-kollari.ts` + `tools/olcum-gec-oyun.ts` · bekçi `tests/tempo-olcutu.test.ts`
  (15 test, 4 mutasyon) · vitest 567 · **denge sayısı DEĞİŞMEDİ** (`economy.config.ts` 0 satır).
- ✅ **D2 — görev hattının kimliği sıra numarası olmaktan çıktı (D-088)** · kayıtta artık yalnız
  `questsDone` (tamamlanan kimlikler) durur, aktif görev türetilir; `questIndex` çalışma zamanının
  kodlaması olarak kalır (`padsDone` deseni, D-015). Hattın ortasına eklenen görev ilerlemiş kaydı
  **geri çekmez**, sona eklenen sıraya girer, silinen/yeniden adlandırılan konumu bozmaz.
  **Kayıt v32 + v31'den GERÇEK göç** (v31'in temiz-sıfırlaması yalnız daha eskiler için duruyor).
  Yan iş: `SAVE_VERSION` `economy.config.ts`'ten `save.ts`'e taşındı — bir denge sayısı değildi ve
  orada dururken her sürüm artışı sıra kilidini boşuna tetikliyordu. Bekçi
  `tests/gorev-kimligi.test.ts` (17 test, **5 mutasyon**) · uçtan uca tarayıcıda doğrulandı ·
  vitest 584 · duman 28/28 · **denge sayısı DEĞİŞMEDİ**.
- ✅ **D3 — hedefler (koleksiyon) kuruldu; ödül YOĞUNLUKTAN geliyor, büyüklükten değil (D-089)** ·
  beş kol varyant olarak ölçüldü. Ana bulgu: ödülün BÜYÜKLÜĞÜ bekleme penceresini doldurmuyor
  (`hA %50`de 66.000 ₺ ödense bile pencereye düşen **0**), YOĞUNLUĞU dolduruyor — aynı iyileşme
  `hE`de %2,7 bedelle, ~11 kat ucuz. **Uygulanan config de ölçüldü (`hUYG`) ve varsayımı İKİ KEZ
  çürüttü**: ortak ödül merdiveni önce toplamı (3k yerine 11k), sonra ödemelerin YERİNİ
  tutturamadı → ödül kategori başına merdivene çevrildi. Yürürlükte **3.175 ₺ · 13 ödeme · zincir
  %-3,2 · 250 💎**. `docs/hedef-raporu-d3.md` · bekçi `tests/hedefler.test.ts` (20 test,
  **8 mutasyon** — ikisi kaçtı ve bantları daralttı) · vitest 604 · duman **31/31** ·
  **kayıt sürümü artmadı** (v32,
  `goalsClaimed` additive). **Kabul edilen eksik:** vaat edilen ihlal iyileşmesi gelmedi (6'da,
  43,4 dk'da kaldı) — bedel bandında, fayda gürültüde; D-087'nin açık kalemi KAPANMADI.
- ✅ **D4 — hedef ödülünün KALIBI ölçüldü; sabit ₺ kalktı, KALICI GELİR ÇARPANI geldi (D-090)** ·
  *(tur kartında `D3b` adıyla açıldı — D3'ün açık kalemini kapattığı için; defter numarası D4.)*
  D3'ün açık kalemi ("₺ kolu kalsın mı?") üç seçenekle sorulmuştu; üçü de aynı kalıbın varyasyonu
  olduğu için reddedildi ve sektörün iki kalıbı varyant olarak ölçüldü. **`hG` (gelire oranlı ₺)
  elendi:** geç pencere altı dozun altısında da 43,4 dk, buna karşılık açılışı eziyor (otomasyon
  6,1 → 1,7 dk). **`hF` (kalıcı çarpan) %10 seçildi:** en uzun 43,4 → **41,2 dk**, ihlal 6 → **5**,
  zincir **%-4,0**, **açılış sabit**. Ana ders (Bulgu 13): tempo tablosu `hF` ile `hE`'yi AYIRMADI
  (verim denk) — tablo ELEME yaptı, seçim sim'in ölçmediği eksende verildi (ödül bayatlıyor mu).
  Uygulanan config kendi satırıyla ölçüldü (`hUYGF` = sentetik kolun birebir aynısı).
  `docs/hedef-raporu-d3.md` §6 · bekçi `tests/hedefler.test.ts` + **`tests/hedef-gelir-kablosu.test.ts`
  (YENİ — denge testleri sim'i ölçüyordu, oyunun `tick.ts` kablolamasını değil)** ·
  **dokuz mutasyon** (M9 kaçtı → ölçülen doz doğrudan çivilendi, sonra yakalandı) ·
  vitest **612** · duman **32/32** · **kayıt sürümü yine artmadı** (v32; çarpan `goalsClaimed`ten
  türer). **Kabul edilen eksik:** çarpan GÖRÜNMEZ bir ödüldür — panelde iki yerde yazılıyor ve 💎
  anlık ödülü taşıyor, ama oyuncu üzerindeki etkisi ölçülmedi (sim'in ölçebileceği bir şey değil).
- ✅ **D5 — oyuncunun dünyasına kendi ızgarası; iki dünya ölçüldü (D-091)** · rotalar personelin
  ızgarasında kuruluyordu (sandalyesiz, `actorRadius`), oyuncu `activeSolids` + `playerRadius` +
  alan kelepçesiyle yürüyor. Ayrışma %3,1 → **%8,2**; **içerik kilitli DEĞİL** (ulaşılamayan nokta
  0, cep 0, 20 açıklığın 20'sinde) ama dolu katta rotaların **%74,1'i** oyuncuya kapalı en az bir
  ara noktadan geçiyor. `getPlayerNavGrid` eklendi; doğru rota yalnız ×1,069 uzun.
  `docs/nav-oyuncu-raporu-d5.md` · araç `tools/olcum-nav-oyuncu.ts` · bekçi
  `tests/oyuncu-dunyasi.test.ts` (8 test, **8 mutasyon**) · vitest 620 · **denge sayısı DEĞİŞMEDİ.**
  **Açılan kalem:** sim botunun bu ızgaraya göçü denendi ve geri alındı (B2 159,1 → 0,0 br/dk;
  üç tuzak ölçüldü, düzeltildi, yetmedi) — kendi turunu ister.
- ✅ **D6 — İtibarın ödülü ÖLÇÜLDÜ; planın kolu elendi, taşıma hızı geldi (D-092)** · gelirin
  kelepçesi zamanın **%93,0**'ünde taşımada (arz %5,9 · talep %1,1), bu yüzden plan §6'nın
  "+%2 müşteri akışı" kolu %10/sv dozunda bile atıl (zincir %-0,1, ihlal sabit). İşe yarayan iki
  kol tempoda ayırt EDİLEMEDİ (≤ 0,2 puan); seçimi **açılış** verdi — taşıma kolu D-079'un üç
  ölçütüne hiçbir dozda dokunmuyor. Yürürlükte `xp.carryBonusPerLevel: 0.02`: en uzun bekleme
  **41,2 → 33,8 dk**, ihlal **5 → 2**, hüküm **1 → 0**, açılış sabit. `docs/itibar-raporu-d6.md`
  · araç `tools/olcum-itibar.ts` + `tools/itibar-kollari.ts` · bekçi `tests/itibar.test.ts`
  (8 test, **8 mutasyon**; ilk hâli M1'i kaçırıyordu → formül testi gerçek kareye çevrildi) ·
  vitest **628** · duman **32/32** · **kayıt sürümü artmadı** (v32, çarpan `xp`ten türer).
  **Kabul edilen bedel:** zincir %-15,5, %7'lik eleme eşiğinin üstünde — kullanıcı kararı,
  karşılığında D-087'nin 41,2 dk kalemi ödendi. **Günlük görevler D7'ye bırakıldı.**
- ✅ **D7 — Usta katmanı: ödeyen tek kanal MASA BAHŞİŞİ (D-093)**
  *(tur kartında `D7a` adıyla açıldı — D7 ikiye bölündü; defter numarası D7.)* · planın iki sayısı da ölçümde
  düzeltildi: *"servis noktasına üstüne ×2"* **elendi** (yalnız servis %0,0 — arz zamanın %7,2'sinde
  bağlayıcı, kelepçe **%91,5 taşımada**; D-092'nin talep kolunu elediği ölçümün tekrarı) ve *"15 💎"*
  **25**'e çıktı (15'te 26 hedefin 16'sı ilk gün peşin gidiyor). Personel kanalı atıl değil
  **ULAŞILAMAZ** — 12 sa'de hiçbir personel merdiveni ₺ tavanına varmıyor; tavan şartı kalkarsa
  ×1,25'te bile %-13,4, o yüzden **şart kalıyor**. Yürürlükte `master.tipMult 1.5` ·
  `master.diamondCost 25` · `dailyQuests.diamondsPerDay 10`. `docs/elmas-raporu-d7.md` · araç
  `tools/olcum-elmas.ts` + `tools/usta-kollari.ts` + sim kancası `ustaAyarla` · bekçi
  `tests/usta.test.ts` (11 test, **10 mutasyon, onu da yakalandı**) · vitest **639** · duman **32/32**
  · **kayıt sürümü artmadı** (v32, `mastersOwned` additive).
  **Kabul edilen eksik:** uygulanan hâl iki knob'un toplamı çıkmadı (`eUYG` %-1,6 / 32,0 dk;
  tek-knob satırları %-3,0 / 30,4 dk gösteriyordu) — D-090 Bulgu 10'un ÜÇÜNCÜ tekrarı.
- ✅ **D8 — Usta ve günlük görevin ETKİLEŞİMİ kuruldu (D-094)** *(tur adı `D7b`)* · Usta noktası
  masanın MEVCUT yükseltme noktasının 💎 kimliği oldu (planın "yaklaşınca panel açılır"ı elendi —
  modal hareketi keser; onayı alt bant alır, dwell ile alım yok). Günlük görev SİSTEMİ kuruldu:
  havuzdan gün-index'iyle deterministik 3 görev, eşik masaya ölçekli, ödül toplamdan türetilir
  (3+3+4 = 10 💎). `master.tipMult` ×1,5'te KALDI (D-093'ün açık kalemi kapandı; ×2'nin ölçülmüş
  %-3,0 / 30,4 dk satırı reddedildi). **Denge sayısı DEĞİŞMEDİ** — eklenen tek şey görev tanımları;
  **sıra kilidi bilerek aşıldı** (D-094'te gerekçesiyle yazılı). Bekçi `tests/gunluk-gorev.test.ts`
  (22 test, **14 mutasyon, on dördü de yakalandı**) — bekçi yazarken gerçek bir hata buldu: gün
  tabanı çevrimdışı gelirden ÖNCE alınıyordu, gece kazancı bugünün görevini bedava dolduruyordu.
  vitest **661** · duman **41/41** · **kayıt sürümü artmadı** (v32, `daily` additive).

> D2-D7 `docs/plan-kat1-yayin.html` §D kapsamından türetildi; **sırası açık** — her tur başında
> seçilir. Ayrıca Faz D'de bekleyen bilinen bir hata var: **nav ızgarası ↔ oyuncu çarpışması**.

## Bilinen açık kalemler
- ~~Hedeflerin ₺ kolu bu hâliyle kalsın mı?~~ → **D3b'de kapandı (D-090):** ₺ kolu tamamen kalktı,
  yerine kalıcı gelir çarpanı geldi. **Yeni açık kalem:** çarpan GÖRÜNMEZ bir ödüldür (panelde iki
  yerde yazılıyor + 💎 anlık ödülü taşıyor) ama oyuncu üzerindeki etkisi ölçülmedi — sim'in
  ölçebileceği bir şey değil, **telefonda oynanınca yeniden okunacak.**
- ~~Normal profil 6. saatte 43,4 dk bekliyor~~ → **D6'da ödendi (D-092):** 41,2 → **33,8 dk**,
  ihlal 5 → 2, İdealize hükmü 1 → **0**. Bedeli zincirin %15,5'i — %7'lik eleme eşiğinin
  bilerek aşıldığı **ilk** karar. Sonraki turlar bunu emsal değil, sayısı yazılı istisna okusun.
- ~~Geç-oyun eğrisi 20 dk ölçütünü ihlal ediyor~~ → **D1'de kapandı (D-087):** ölçütün profili
  sabitlendi, hüküm geçiyor. **Kabul edilen risk:** Normal profil oyuncusu 6. saatte `servis L6`
  için 43,4 dk bekliyor — bilerek ödenmedi, gözlem bandında görünür kalıyor. **Faz D bitince
  yeniden okunacak** (meta katman o pencereleri dolduruyor mu; araç hazır). **D3'ün cevabı, hedefler
  kanadı için: HAYIR** — tempo olarak doldurmuyor (D-089); doldurduğu şey oyuncunun o pencerede
  gördüğü ilerleme. Kalan kanatlar D4 (İtibar · günlük görev) ve D5.
- **Görev hattı `waiterTray` kademe 2'de bitiyor**, 3. kademe (₺2.500) hatta yok;
  oysa sim'in ÜÇ KOL tablosu 20 masada `waiterTray: 3` varsayıyor. **D7a'da ilk kez tempo
  sonucu doğurdu (D-093):** garson merdiveni tavana varmadığı için personel Usta hedefleri
  12 saatte hiç açılmıyor — artık yalnız görev/HUD tutarlılığı değil, İÇERİK kalemi.
- **`outputMultByLevel` yok** — servis çıktı çarpanı basamak-başı değil merdiven-geneli;
  `b1` (basamak bölme) erken oyuna dokunmadan denenemiyor.
- **Sim'de serbest oyun bloğu ölü kod** (D1 Bulgu 5): tempoyu görev hattı belirliyor.
- **Sim'in taşıma tavanı 4 masada fazla kötümser** (model 6,36 < ölçülen 7,53 müşteri/dk) —
  elenen `k3` bardak kolunun önündeki tek engel; kodu duruyor, bu kalem çözülünce yeniden ölçülür.
- ~~Nav ızgarası ↔ oyuncu çarpışması aynı dünyayı görmüyor~~ → **D5'te kapandı (D-091):**
  `getPlayerNavGrid` eklendi, bekçili. **Yeni açık kalem:** oyunda bu ızgarayı çağıran tüketici
  henüz yok (oyuncu joystick ile sürülüyor) ve tek doğal tüketici olan sim botunun göçü
  ölçülerek geri alındı — botun göçü kendi turunu ister.
- **`npm run pano`'nun günlük uyarısı yalnız TARİHE bakıyor** — aynı gün iki oturum kapanınca
  sessiz kalıyor; C5 ve D1'in anlatısı bu yüzden iki tur yayınlanmadan kaldı (2026-09-08'de elle
  düzeltildi, araç değişmedi). Kural "sayaç arttıysa günlük kartı da artmalı" olmalı.
- D-046 ④ kaba, ⑤ yok · sipariş nesnesi v1.1'de.
- Gölgenin telefondaki maliyeti ölçülmedi — **Faz F riski**.
- Bundle ~1.17MB (three.js) — Faz F'de kod-bölme.
