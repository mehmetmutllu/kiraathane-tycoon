# progress — Durum Panosu

Durum: ✅ bitti · 🔧 devam · ⏳ bekliyor

> **Bu dosya kısa tutulur** (pano tablosu + aktif faz). Oturum başına **1-2 satır**;
> anlatı yok — sayı raporda, karar `decisions.md`'de, zaman çizelgesi git'te.
> Bitmiş fazların tam anlatısı: `memory-bank/arsiv/progress-tamamlanan.md`.
> Kural: `docs/oturum-akisi-mantik.md` (D-084).

## İLERLEME PANOSU — oturum sayacı
`docs/pano/ilerleme-panosu.html` · https://claude.ai/artifact/1Y8JNb3MckS3EhfSXJKKRs
Bu tablo **kaynaktır**; pano JSON'u buradan **türetilir**: `npm run pano` (elle sayı yazılmaz).

**Oturum bütçesi (TOPLAM 108 · YAPILAN 98 · %91):**

| Dönem | Faz | Yapılan/Toplam |
|---|---|---|
| Kuruluş (5 Haz – 11 Ağu) | F0 planlama · F1 greybox · F2 servis · F2Q görev · F3 roller · F6 sanat · DN denetim | **28/28 ✅** |
| Yayın programı (1 Eyl →) | P plan ve maket | 6/6 ✅ |
| | G görsel taban | 4/4 ✅ |
| | A temizlik | 3/3 ✅ |
| | B model geçişi + maket taşıması | 13/13 ✅ |
| | **C zincir ve denge** | **5/5 ✅** |
| | İA iş akışı hızlandırma (D-084) | 3/3 ✅ |
| | D meta katman | 9/9 ✅ |
| | E arayüz ve cila | 4/5 🔧 |
| | **S sanat ve arayüz geçişi** | **23/24 🔧** |
| | H oynanış düzeltmeleri | 0/3 ⏳ |
| | F paketleme ve yayın | 0/5 ⏳ |
| **Program toplam** | | **70/80** |

Kuruluş dönemi sayısı commit kaydından türetildi (114 commit / 14 çalışma günü); oturum-başı
defter tutmak yayın programıyla başladı. **Bütçe düzeltmesi 2026-09-08:** iş akışı hızlandırma
(D-084 P1-P3) üç kalemlik yeni faz olarak eklendi → toplam 73 → 76. **2026-09-09:** D3'ün ödül
KALIBI kendi turunu istedi (D3b) → Faz D 5 → 6 kalem, toplam 76 → 77. **Aynı gün:** nav ızgarası ↔
oyuncu çarpışması bilinen-hata listesinden çıkıp kendi turu oldu (D5) → Faz D 6 → 7, toplam 77 → 78.
**Aynı gün:** D7 kullanıcı kararıyla ölçüm (D7a) ve UI (D7b) olarak ikiye bölündü → Faz D 7 → 8,
toplam 78 → 79. **Aynı gün:** meta katmanın yığını beş turdur açık duran D-087 ölçümü olarak
kendi turunu aldı (D9) → Faz D 8 → 9, toplam 79 → 80. **Aynı gün:** E3 (ses) kullanıcı
kararıyla SİSTEM (E3) ve DOSYALAR (E4) olarak ikiye bölündü, onboarding E5 oldu → Faz E 4 → 5,
toplam 80 → 81. **2026-09-09 (ikinci oturum):** kullanıcı oynadı, 25 kalemlik geri bildirim verdi (`docs/geribildirim-oyun-testi-2026-09-09.md`); sanat/arayüz işi **Faz S** olarak açıldı (6 kalem, `docs/plan-faz-s-sanat.md`) → toplam 81 → 87. Faz adı S, çünkü defterde zaten bir Faz G (görsel taban) var; `G-0x` numaraları geri bildirimin, fazın kalemleri `S1…S6`. **Aynı gün:** kullanıcı S1'i oynadı ve dokuz kalem daha verdi (G-26…G-34); pad/modal düzeltmeleri **S2** olarak kendi kalemini aldı → Faz S 6 → 7, toplam 87 → 88. **Aynı gün, üçüncü tur:** kullanıcı lavabo kabin kapılarını ve ses assetlerini (ortam uğultusu + gerçekçi para sesi) istedi, ikisi de ayrı kalem oldu; UI araştırması da kendi kalemine ayrıldı → Faz S 7 → 10, toplam 88 → 91. **Aynı gün, dördüncü tur:** kullanıcı *"paketleme ve yayın öncesi oyun assetlerle hazır olsun"* dedi ve **oturum sayısı** istedi. Sayım dürüstçe yapıldı: UI dili tek oturuma sığmaz (araştırma+maket ile uygulama ayrı), karakterler kendi turunu ister → Faz S 10 → 12. Ayrıca bekleyen üç oynanış işi (hatalar · yükseltme sırası · masa aralığı) sanat kalemi değil; **Faz H** olarak ayrıldı (3 kalem). Toplam 91 → 96. **2026-09-10:** S6/②'de ertelenip S7'de kullanıcı kararıyla ayrılan **giriş cephesi camı** kendi
turunu aldı ve bitti → Faz S 12 → 13 kalem (yeni kalem **S8**, sonrakiler bir kaydı), toplam
96 → 97. **2026-09-14 (S14):** karakter kalemi kullanıcının *"görevi en fazla ikiye böl"* kuralıyla PERSONEL (**S14**) ve MÜŞTERİ (yeni kalem **S15**) olarak ikiye bölündü — kesme çizgisi yeşil ara durum: personel skinned, müşteriler kapsül olarak çalışmaya devam ediyor (D-112) → Faz S 14 → 15, toplam 98 → 99. **2026-09-14 (S16):** kullanıcının *"elde tepsi tutma falan sorun"* geri bildirimi kendi turunu istedi (ölçüm + kemik katmanlaması + iki sessiz hata) → Faz S 15 → 16, toplam 99 → 100. **2026-09-14 (S17+S18):** kullanıcı oyunu oynadı ve iki tur geri bildirim verdi; ölçüm üç sessiz hata çıkardı (T-poz · açılış yükleme döngüsü · müşteri görünüm takası) → iki yeni kalem **S17** (oynanış/görsel hata turu) ve **S18** (müşteri hareketi + arayüz dokunuşları) → Faz S 16 → 18, toplam 100 → 102. **2026-09-14 (S19):** kullanıcının yedi kalemi kendi turunu istedi ve "görevi en fazla ikiye böl" kuralıyla ÖLÇÜM+KARAR (**S19a**) ile UYGULAMA (**S19b**) olarak ikiye bölündü — kesme çizgisi kullanıcının kendi sözü: *"önce oturumu kaydet, sonraki chatte bunları yaparsın"* (D-116) → Faz S 18 → 20, toplam 102 → 104. **2026-09-15 (kalem S21, tur adı S20):** elektrik kesintisinde yarım kalan mutfak turu ölçümle kapandı ve **iki** yeni kalem doğurdu: turun kendisi (S21) ve ölçümün açtığı kademeli mutfak (**S22**). Ölçüm mutfağın SEVİYEYLE BÜYÜMEDİĞİNİ gösterdi (19 sabit ünite, tezgâh 6 kademe); kesme çizgisi kullanıcının "görevi en fazla ikiye böl" kuralı — sınır+tempo ile ilerleme tasarımı ayrı işler (D-118) → Faz S 20 → 22, toplam 104 → 106. **2026-09-15 (kalem S23, tur adı S19c):** S19'un kalan dört kalemi kullanıcı kararıyla GÖRSEL (S23) ve MANTIK (yükseltme tetiği, ayrı tur) olarak ikiye bölündü — kesme çizgisi varyant kapısı: üç görsel kalem denge dosyasına dokunmuyor, dördüncüsü `rules.ts`'e dokunuyor (D-120) → Faz S 22 → 23, toplam 106 → 107. **2026-09-16 (kalem S24):** S23'te ayrılan MANTIK yarısı kendi turunu aldı ve bitti — yükseltme tetiği (D-121) → Faz S 23 → 24, toplam 107 → 108. **NOT — numara kayması:** defterdeki KALEM numarası ile TUR ADI S19'dan beri ayrı yürüyor (kalem S20 = tur S19b); yeni kalemler tur adını parantezde taşıyor. **2026-09-14:** S11 (UI uygulaması) kullanıcının "görevi en fazla ikiye böl" kuralıyla DİL (**S11**) ve YAPI (yeni kalem **S12**, sonrakiler bir kaydı) olarak ikiye bölündü — ölçek/palet/ikon ile ekran kabuğu ayrı işler, kesme çizgisi yeşil ara durum (D-109) → Faz S 13 → 14, toplam 97 → 98. **E4 kapsamı ölçümle değişti ama kalem sayısı değişmedi:** tur "dosya bırak"
olarak açılmıştı, ölçüm "dosya alma, motoru büyüt" dedi (D-096); ortam sesi + `settings.music`
kablosu E4'ün dışında kaldı ve **henüz kendi kalemi olmadı** — açık kalemler listesinde duruyor.

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

## Faz D — META KATMAN (9/9) ✅
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

- ✅ **D9 — meta katmanın YIĞINI ölçüldü; D-087 KAPANDI, zincir borcu %20,1 KABUL (D-095)** ·
  üç ödül kanadı (H hedef çarpanı · R İtibar taşıma · E Usta+günlük görev) bugüne dek hep
  ötekilerin kancası KAPALI ölçülmüştü; sekiz bileşim ilk kez tek koşuda okundu. Yığın açıkken
  hüküm profilinde ihlal **0**, en uzun **18,0 dk** (gözlem 6 → 2 ihlal, 43,4 → 32,0 dk).
  **Kapatan katman R'dir**, H ve E tek başlarına kımıldatmıyor. **Katmanlar TOPLANIYOR** —
  D-090 Bulgu 10'un toplanamaması knob'lar arasındaydı, katmanlar arasında değil. Zincir
  8,48 → **6,77 sa** (%−20,1): üç geri-alma kolu da ölçülüp reddedildi, eşik yazıldı (tek kol
  %7 duruyor; yığın için yeni sayı %−20,1). `docs/meta-pencere-raporu-d9.md` · araç
  `tools/olcum-meta-penceresi.ts` · bekçi `tests/meta-pencere.test.ts` (22 test, **10 mutasyon,
  dokuzu yakalandı**; M5 ilk hâlde kaçtı ve E'nin ölçülebilir tek izini yazdırdı, M8 ölçülerek
  bilerek bırakıldı) · **kod YAZILMADI, `economy.config.ts` hiç değişmedi.**
  **Bekçi bir yazım hatası da düzeltti:** rapor "açılış sekiz satırda birebir aynı" diyordu;
  saniye çözünürlüğünde otomasyon H açıkken 366 → 365 sn kayıyor (%0,27, ölçütler geçiyor).

> D2-D7 `docs/plan-kat1-yayin.html` §D kapsamından türetildi; **sırası açık** — her tur başında
> seçilir. Ayrıca Faz D'de bekleyen bilinen bir hata var: **nav ızgarası ↔ oyuncu çarpışması**.

## Faz E — ARAYÜZ VE CİLA (4/5) 🔧
- ✅ **E1 — bilgi mimarisi + Görevler/Hedefler ekranı** (kuruluş turunda yapıldı; D-049…D-052).
- ✅ **E2 — duman testi `package.json`'a BAĞLANDI: `npm run duman`** · koşucu sunucuyu kendi
  kaldırıp indiriyor (`tools/duman.mjs`), 41/41 · çıkış 0 · **25 sn**. Fazın kapısı buydu.
  **İki tasarım iddiası ölçümde düzeltildi:** ① adres `127.0.0.1` yazılmıştı — vite `localhost`a
  bağlanıyor ve o ad bu makinede IPv6 `::1`e çözülüyor, yani sunucu AYAKTAYKEN "ayağa kalkmadı"
  deniyordu; ② `--strictPort` yeterli sanılmıştı — port bilerek doldurulup sınandı ve **varsayım
  çürüdü**: koşu kırmızıya dönüyor ama yanlış sebeple (yoklama, portu tutan YABANCI sunucunun
  200'ünü hazır sanıyor, hata "canvas bulunamadı" diye görünüyor). Düzeltme: hazır sinyali
  **vite'ın kendi stdout'undan** okunuyor, süreç ölürse anında biliniyor. Bekçi
  `tests/duman-kosucu.test.ts` (21 test, **18 mutasyon, on sekizi de yakalandı**; ilk hâlinde
  `--strictPort` mutasyonu KAÇMIŞTI — bayrak dosya metninde aranıyordu ve yorumda da geçtiği için
  argümanlardan silinince bile bulunuyordu → bekçi metin yerine **gerçek argümanları** okur oldu).
  Protokol güncellendi: `oturum-bitir` ve `CLAUDE.md` artık "mümkünse" demiyor, duman **kesilmez**.
- ✅ **E3 — ses SİSTEMİ kuruldu; `tick.ts`e DOKUNULMADI**
  *(tur kartında `E3a` adıyla açıldı — E3 ikiye bölündü; defter numarası E3.)* · olaylar durumun FARKINDAN türetiliyor
  (`sesOlaylari` saf), motor üç kelepçeli (ayar · tarayıcı ses kilidi · ses-başına aralık) ve
  **dosya yokken sentezlenmiş tona düşüyor** — `Model.tsx` fallback deseninin sesteki karşılığı,
  yani oyun `.ogg` gelmeden de tam sesli oynanıyor. **`settings.sound` v17'den beri kayıtta
  duruyordu ama hiçbir şeye bağlı değildi; bu turun asıl işi o bağlantı.** Mimarî karar: ses bir
  denge kolu değil SUNUM katmanı → `tick.ts` (denge dosyası) hiç açılmadı, varyant kapısı
  tetiklenmedi, tick parmak izi birebir korundu. `src/game/audio.ts` + `audioWeb.ts` +
  `audioBridge.ts` · manifest yeniden yazıldı (kaynak/lisans kolonları bilerek `?` — seçilmiş
  değil VARSAYILMIŞ kaynaklardı) · bekçi `tests/ses.test.ts` (29 test, **16 mutasyon, on altısı
  da yakalandı**) · vitest **734** · duman 41/41 · **denge sayısı DEĞİŞMEDİ.**
- ✅ **E4 — ses kaynağı seçildi: dosya değil KOD; motor büyütüldü (D-096)** *(tur adı `E3b`)* ·
  tur "hangi CC0 kaynaktan dosya" diye açıldı, ölçüm önündeki soruyu sordu: motor dosyasız da
  çalışıyordu. **İddia ölçüldü ve ayakta çıktı** (36 çiftin 35'i ayrı); tek gerçek kusur
  `quest ↔ reward` — aynı dalga, aynı +5 aralık, 0,6 JND süre farkı, yani **aynı jestin
  transpozesi** (jest 0,13 dB < taban 0,22). **İkinci kanalı ölçümün kendisi doğurdu:** tek
  kanalla 36/36 "AYRI" çıkıyordu, metrik yanlış değil SORULAN SORU eksikti — oyunda sesler art
  arda değil dakikalarca arayla duyulur, o zaman perde değil JEST kalır. Kullanıcı "en kalitelisi
  olsun" dedi, kol bana bırakıldı → **motor büyütüldü**: gürültü + bant süzgeci · inharmonik
  kısmiler · band-limitli dalgalar. Katalog **iki aileye** ayrıldı (fiziksel `pour`/`serve` ·
  ilerleme tonal · `coin` metalik arada) — D-080 Tek Odak'ın ses karşılığı. Sonuç **36/36 AYRI ·
  ikiz 0 grup · tını 3 → 6 · gürültü-baskın ses 0 → 2**, `quest↔reward` taban altından
  **×12,45 tabana**. **Sentez NİHAİ, dosya opsiyonel üstüne yazma**; `public/assets/audio/`
  bilerek boş, lisans yüzeyi sıfır, stil kilidi `docs/assets.md` §7'ye yazıldı. **En kalıcı
  parça:** sentez tek yerde üretiliyor (`audioSynth.ts`) — E3'te ölçüm aracı motoru TAKLİT
  ediyordu, artık ölçülen şey birebir duyulan şey. `docs/ses-raporu-e4.md` · araç
  `tools/olcum-ses-ayirt.ts` · bekçi `tests/ses-sentez.test.ts` (19 test, YENİ) +
  `tests/ses.test.ts` (43) · **18 mutasyon, on sekizi de yakalandı** — üçü ilk turda kaçtı ve
  üçü de gerçek delikti (M3 zarfın gecikme dalının ÖLÜ KOD olduğunu, M15/M16 aile testinin fazla
  gevşek olduğunu gösterdi). vitest **767** · duman **41/41** · **denge sayısı DEĞİŞMEDİ.**
  **Kabul edilen kapsam sınırı:** `settings.music` + ortam sesi girmedi — kablo sorunu, kabiliyet
  değil; kendi turunu ister.
- ⏳ **E5 — hareketli onboarding**

## Faz S — SANAT VE ARAYÜZ GEÇİŞİ (23/24) 🔧 — her kalem ≈ 1 oturum — kullanıcı geri bildirimi 2026-09-09
- ✅ **S1 — pad ve yükseltme dili yeniden yazıldı** · çember → **köşe parantezli kare** (kenar
  ortaları boş), dolum büyüyen disk → **alttan üste dolan kare**, "Masa"/"Çay Yükselt"/"Usta"
  → hepsinde **YÜKSELT** + solunda düz yukarı ok, yazı 700 → 800, 💎 pulu "mavi kare" → gerçek
  taş silüeti (`shapeGeometry`). **Usta şeridi MODAL oldu (G-14): D-094'ün kararı kullanıcı
  isteğiyle döndü** — o kararın endişesi ("modal hareketi keser") geçersiz değil, o yüzden modal
  kapatılabilir ve oyuncu o masadan uzaklaşana kadar geri açılmaz. **Görev toast'ı kalktı (G-04):**
  tamamlanma artık bandın kendi hâli (yeşil zemin + onay ikonu + "TAMAMLANDI"); `tick.ts`e
  DOKUNULMADI, olay hâlâ üretiliyor yalnız çizilmiyor (E3/D-096 sunum-katmanı deseni).
  vitest **770** · duman **41/41** · **denge sayısı DEĞİŞMEDİ** · tarayıcıda gözle doğrulandı.
  **Yan iş — `npm run pano` gerçek bir hata veriyordu:** yazma şartı "veri değişti mi"ydi, oysa
  pano elle düzenlenince BİÇİMİ kayabiliyor (JSON bloğunda 830 `\uXXXX` kaçışı ile 15.020 ham
  karakter yan yana bulundu) — veri aynı, bayt farklı, araç "zaten güncel" deyip çıkıyor ve
  `tests/pano-guncelle.test.ts`in "BİREBİR geri yazılır" bekçisi **sessizce kırmızı** kalıyordu.
  Şart `yazmaliMi()` olarak dışa alındı ve bayta bakıyor; bekçi 3 test daha aldı,
  **iki mutasyonla doğrulandı**. Açık kalemlerdeki "araç kendi turunu ister" maddesi bu kadarıyla
  kapandı; `.gitattributes` eksiği DURUYOR.
- ✅ **S2 — pad/modal etkileşimi kullanıcı testiyle düzeltildi (D-098)** · S1 oynandı, dört kusur
  çıktı ve dördü de kapandı: ① **ok ile yazı üst üste biniyordu** — çerçeve `radius`tan türüyor ve
  yazı ortalanıyordu, yani ikisi aynı genişlik için yarışıyor ve kimse ölçmüyordu; genişlik artık
  **yazıdan çözülüyor** (ok bloğu + harf ilerlemesi × punto). ② köşeler keskindi → parantezlerin
  **dış köşesi yuvarlatıldı**. ③ **modal yaklaşınca açılıyordu** → artık noktanın kalın çerçevesi
  oyuncu HAREKETSİZKEN 1,1 sn'de yeşil dolar, dolunca açılır (`dwellState`, modül değişkeni —
  60 fps setState yok). ④ **"modal dedim hâlâ alttan açılıyor"** — haklıydı: alt-sayfa kabuğu
  (`.modal-card`, `align-items: flex-end`) yeniden kullanılmıştı; Usta artık **kendi merkezî
  kabuğunda** (`.usta-card`). Usta noktasının biçimi de kareden **kalın çerçeveli yuvarlağa**
  döndü (kullanıcı tarifi). vitest **770** · duman **42/42** (biri YENİ: "modal merkezî kabukta" —
  alt sayfaya geri düşüş artık testle yasak) · **denge sayısı DEĞİŞMEDİ.**
  **Ölçülen ama YAPILMAYAN:** kullanıcı "masalar birbirine çok yakın mı" diye sordu ve
  "mutfağa yakın yerde yürüyemiyorum" dedi — ikisi **aynı kök**: geçiş için 2 × `playerRadius`
  = **0,94 br** gerekiyor, ön salonda boşluk **3,50 br** (rahat) ama **arka salonda 0,68 br**,
  çarpışma katılarında **52 açıklık eşiğin altında** (en darı **0,04 br**). Yani "yürüyemiyorum"
  bir his değil geometri. Düzeltme `layout.ts` ve **onaylı maket düzenine** dokunuyor →
  iki kol sayılarıyla yazıldı, **kullanıcı kararı bekliyor** (`docs/geribildirim-oyun-testi-2026-09-09.md`).
- ✅ **S3 — mutfak KayKit'e geçti; ön hat da dahil (D-099)** · arka duvarda **7 modüllük**
  hat (1,80 adım) + batı dönüşü + depo, **ve oyunun işleyen üç tezgâhı** (çay ocağı · garson
  istasyonu · bulaşık). Ölçek **tahmin edilmedi**: paket furniture-bits ile aynı ham ölçekte
  (`chair_A` ikisinde de 0,75) → `STOOL_S = 0,90`; sağlaması insan boyuyla (tezgâh üstü 0,90 =
  karakterin %51'i, gerçek oranın aynısı). Ön hat modelin değil **collision kutusunun** ölçüsüne
  çekiliyor (`kayGovde`), çekmeceler **mutfağa** dönük (kullanıcı). Kasa ayrı ölçekte (0,45) —
  0,90'da fırının önünü kapatıyordu. **Palet KayKit'in kendi paleti KALDI** (kullanıcı: *"her şey
  çok kahve kalıyor"*; renk ileride **tema olarak satılabilir** — boyama hattı ölçülü hazır:
  `tools/atlas-goz.mjs` + `tools/atlas-ton.mjs`). **Menü panosu kaldırıldı** (kullanıcı).
  Yeni: `kitchenLook.ts` (ölçü katmanı) · `Kitchen.tsx` (çizim) · `tools/model-olc.mjs` (gltf bbox).
  Bekçi `tests/kitchen-look.test.ts` 15 test, **4 mutasyonla** doğrulandı.
  **Yan bulgu: `npm run build` temiz ağaçta da KIRIKTI** — `tsc -b` HUD'da S2'den kalan ölü bir
  dal buldu (`notice.kind !== 'quest'`); vitest tip denetlemediği için görünmüyordu. Silindi.
  vitest **785** · duman **42/42** · `tsc -b` temiz · **denge sayısı DEĞİŞMEDİ**.
- ✅ **S4 — duvar REDDEDİLDİ, mutfak zemini + bulaşık + aksesuarlar geçti (D-100)** · KayKit duvarı
  ölçüldü (mimari ölçek 0,80 · modül 3,20 · dört döşeme kolu), kuruldu, ekranda denendi ve
  kullanıcı reddetti: modülün kendi yatay oluğu 1,60'ta (maketinki 0,94) ve hatlar arası modül eni
  3,00…3,80 (%27 fark). **Eski duvar silinmedi**, KayKit kipi yanında duruyor (`config/kabuk.ts`
  tek satır — kullanıcı şartı *"beğenmezsek dönebilelim"*). **Geçenler:** mutfak zemini
  `floor_kitchen_small` (8×5, küçük+siyah-beyaz — dört kare karşılaştırıldı) · kahve varyant
  **mağaza teması** (10.000 ₺, kayıt **v33** göçü) · bulaşık `kitchentable_sink_large` ↔
  `_decorated` çifti + kirli/temiz döngüsü (**`tick.ts`e dokunulmadı**) · ön hattın üç tezgâhı
  BİRLEŞTİ (bulaşık bugüne dek kutusundan küçük çiziliyordu: 2,00×1,00 kutu, 1,4×0,8 çizim) ·
  batı duvarı paketin peçetelik+havluluğuna geçti, oradaki bardak rafı kalktı · damacana rafı
  kaldırıldı · depo kasasına sucuk. **HUD:** oto-toplama toast'ı yuvarlanıyor ("273.3333" binlik
  ayracı gibi okunuyordu) · görev bitiş bandı 5 sn sonra kalkıyor.
  Yeni: `wallLook.ts` · `KayWalls.tsx` · `atlasUV.ts` · `DishSink.tsx` · `tools/olcum-duvar.ts`
  (ışın testli delik/profil ölçümü) · `tools/atlas-renk.mjs` (göz renkleri).
  Bekçi: `tests/wall-look.test.ts` 11 test **4 mutasyon** · `kitchen-look` 15→16 **3 mutasyon**
  (ikisi GERÇEK hata yakaladı) · v32→v33 göç bekçisi. vitest **798** · duman **42/42** ·
  `tsc -b` temiz · **denge sayısı DEĞİŞMEDİ**.
  **Denenip geri alındı:** tezgâh arkası fayans bandı (pakette duvar karosu yok) · tezgâh üstü
  süslemeler · beş kollu mutfak teması (*"bunları sen kendin uydurmuşsun"*).
- ✅ **S5 — dekorun sekiz türü KayKit'e geçti (D-101)** · ölçüm planın iki maddesini **eledi**:
  `trash_A/B` kova değil 18 üçgenlik yer çöpü, `cactus_*` yaprak bitkisi değil (biçim oranı
  saksının 2,4–2,8 katı — kullanıcıya soruldu, *kaktüs geçsin* dedi). Üç pakette iç mekân kovası
  YOK → **elle çizilen kova asıl kaldı**. Geçenler: saksı/büyük/denizlik → `cactus_medium/small`
  (A/B dönüşümlü) · ayaklı lamba → `lamp_standing` · konsol → `cabinet_medium + cabinet_small` ·
  tablo → `pictureframe_large_A` · paspas → `rug_rectangle_B` (**mavi**, kullanıcı) · gazetelik →
  `shelf_B_small_decorated` (ölçüm bunun **duvar rafı** olduğunu söyledi → zeminden asma bandına
  taşındı) · konsol üstüne yeni `lamp_table`. **Ölçek kuralı yazıldı: mobilya 0,90, aydınlatma
  GERÇEK BOY** — 0,90'da ayaklı lamba karakterin %130'u oluyordu (S3'ün kasa dersinin devamı).
  Yeni `decorLook.ts` (ölçü katmanı); elle çizimler silinmedi, **fallback** oldu.
  **Yeni ölçüt — AYAK İZİ:** eski bekçi dekoru yalnız MERKEZLE denetliyordu, artık gövde
  KENARINDAN (en dar açıklık 0,51 br, ihlal yok). Bekçi `tests/decor-look.test.ts` 20 test,
  **8 mutasyon** (biri kaçtı → bekçi düzeltildi, sonra yakalandı).
  `docs/dekor-raporu-s5.md` · vitest **818** · duman **42/42** · `tsc -b` temiz ·
  **denge sayısı DEĞİŞMEDİ**.
  **Yan iş:** ölçüm aracı kendi iki hatasını düzeltti — düz parçada boy karşılaştırması sahte
  %650 sapma üretiyordu (ölçek ENDEN türer) ve **biçim oranı** hiç ölçülmüyordu.
- ✅ **S6 — sokak görünen şeride indi · pencere duvara gömüldü · tente kondu (D-102)** ·
  **Ölçüm planı çürüttü:** karşı binalar üç kamera kipinde de **%0 görünür** (kamera oyuncunun
  +z'sinde, z tavanı 25,50; binalar 26,5'te) → `building_A…H` girmedi ve **bugünkü 9 kutu silindi**;
  yol karosu da girmedi (karo kendi kaldırım payını taşıyor + 7,00 derin ↔ bant 6,00). Harcamanın
  tamamı görünen şeride (z 17,5…20,5) gitti: lamba ×3 · bank ×2 · çalı ×4 · musluk · yer çöpü ×2 ·
  taksi, ölçek **3,636** (paketin ortancası; mutfağın 0,90'ı burada −%66…−%81).
  **Pencere şikâyeti geometriydi:** doğrama duvar yüzünün 0,055 önündeydi. KayKit modülü ölçüldü ve
  elendi (deliği 1,28 × 1,28 ↔ band 3,20 × 1,65; oluğu 1,60 ↔ lambri 0,94 = D-100'ün reddedilen
  düzeni) → boşluk **duvarın kendisinde** açıldı, nerede delineceği `config/decor.ts`ten türüyor.
  **Tente F1 kullanıcı kararı:** bedeli ölçüldü (kapı eşiği %77 konumda görünmez) ve kabul edildi;
  kaçamak kol aranıp **bulunamadı** (hiçbir yükseklik/derinlik hücresi %0'a inmiyor).
  **Lavabo G1:** kullanıcının *"gri hali"* tarifi atlas gözüyle doğrulandı (`kitchentable_sink`,
  tek göz #828c91); mutfak modülü olduğu için 0,90 değil bugünkü lavabo kutusuna çekildi.
  Yeni `streetLook.ts` + `wcLook.ts`; `wallBoxes` `y0` aldı; `MERDIVEN_DERINLIK` ölçü katmanına
  taşındı (çizim değişikliği mantık testini kırmıştı). Bekçi `tests/street-look.test.ts` (19) +
  `tests/pencere-nis.test.ts` (19), **16 mutasyon**. `docs/dis-cephe-raporu-s6.md` ·
  vitest **856** · duman **42/42** · `tsc -b` temiz · beş kadraj gözle doğrulandı ·
  **denge sayısı DEĞİŞMEDİ**.
- ✅ **S6/② — kullanıcı testi: "duvardan ayrı duruyor" TEK sayıydı (D-103)** · S6 oynandı,
  dokuz kalem geldi ve çoğu aynı köke çıktı: `WALL_FACE` bir TAHMİNDİ (17,32), duvarın gövde
  yüzü **17,41** → duvara asılan her şey **0,09 br havada**; petek `WALL_BACK`le birlikte
  **0,30**; lavabo maketin 0,45'iyle **0,12**. Üçü de artık duvarın kendi kalınlığından TÜRÜYOR.
  **Pencere sadeleşti** (denizlik · konsol şeridi · orta kayıt · denizlik saksısı kalktı; tür
  listeden de çıktı) ve **gölge kapandı** — kasa `castShadow` taşıyordu, odaya düşen dikdörtgen
  gölgelerin dayanacağı kütle yoktu; aynı artefakt apliklerde de vardı, o da kapandı.
  **Lavabo dolaplı-griye geçti:** "gri hali" ayrı bir MODEL değil ayrı bir GÖZ — `kitchencounter_sink`
  zaten %70 gri, turuncu olan %16'lık [3,6] gözü; `atlasUV.gozDegistir` ile griye taşındı
  (`recolor` seçilseydi mutfak da grileşirdi). `Model`e `esleme` kolu eklendi. **Ayna** KayKit'ten
  (`pictureframe_medium`in tuvali cam mavisine, çerçevesi lavabonun grisine); **çöp kutusu
  ölçüldü ve YOK** → elle çizim kaldı. WC girişindeki lento şeridi + pirinç düğmeler kalktı.
  **Giriş duvarı cam** kullanıcı bana bıraktı → ölçüm değer diyor (%8–15 görünür) ama kapı
  bloğuna dokunuyor, **S7'nin başlığı oldu.** İki mutasyon kaçtı, ikisi de bekçiyi güçlendirdi
  (aralık → eşitlik; gölge kararı ölçü katmanına çıktı). vitest **864** · duman **42/42** ·
  toplam **26 mutasyon** · **denge sayısı DEĞİŞMEDİ**.
- ✅ **S7 — WC odası: kabin kapısı KayKit'e geçti, seviye mekânsal okunuyor, kayboluş örtüldü (D-104)** ·
  §V S6'nın tersini söyledi (oda kapının önünde **%100** görünür); kapı `door_A` (%73'ü zaten
  WC'nin grisi, %25 yeşil kahve bloğunu kırıyor, çarpıtma 1,221 < D-103'ün 2,715'i); seviye artık
  lavabo **ve** kabin sayısıyla okunuyor (duvar 6 lavabo almıyor — 7,40 br, ön slot %0); müşteri
  kapıda buharlaşmıyor, içeri yürüyüp %0 görünür köşede sönüyor. **Denge DEĞİŞMEDİ.**
  Yeni araç `tools/model-bak.mjs`: sayı `door_A`yı kasa sandırdı, ekran düzeltti. İkinci kusuru
  (oda açık ama BOŞ) testler değil GÖRSEL TUR yakaladı → `wcSeviye()`.
  Bekçi `tests/wc-odasi.test.ts` 26 denetim · **15 mutasyon** (biri kaçtı, ölçüt sıkıldı) ·
  vitest **889** · duman **42/42**.
- ✅ **S8 — giriş cephesi VİTRİN oldu; D-037 sekiz oturum sonra koda girdi (D-105)** ·
  Ölçüm "yapma" diyordu (örtme kazancı **0,0 puan** — kamera 45°'den bakıyor, ışın cepheyi
  duvarın tepesinden geçiyor), **görsel tur** "yap" dedi: cephe kadraja girdiğinde ekranın
  dikey **%27'sini** kaplıyor ve o bant bomboştu. Camın ardındaki şeritte (z 14,88…17,39)
  **10 dekor öğesi** zaten vardı ve cephe onları kapatıyordu. Cam 0,98…2,65 · 4 göz/yarı
  (3,35 br) · lambri korundu (C4b). KayKit modülü elendi (delik bandın %57'si, hat 9,56 modül).
  Bekçi `tests/cephe-vitrin.test.ts` 17 denetim · **23 mutasyon, kaçan 0** (biri önce kaçtı:
  söve/köşe payları yer değiştirince hat uzunluğu değişmiyor, gözler kayıyordu). vitest **907** ·
  duman **42/42** · `tsc -b` temiz. **Denge DEĞİŞMEDİ.**
- ✅ **S17 — OYNANIŞ/GÖRSEL HATA TURU (D-115)** — T-poz (klipleri geç çözülen aktörde hiçbir
  eylem başlamıyordu; erken dönüş iki koşullu oldu) · açılış "Maximum update depth exceeded"
  (`SplashScreen` ilerlemeye ABONEYDİ, 3 açılışın 2'sinde patlıyordu → yoklamaya çevrildi;
  `Tables.tsx` yol listesi modül sabiti) · müşteri yuvası dizi sırası yerine KİMLİĞE bağlandı
  (oturan müşterinin saçı/kıyafeti başkası çıkınca değişiyordu) · tepsi el kemiklerine `useMemo`
  ile bağlandı. Müşteri koşusu → yürüyüş (`NPC_SPEED` 2,60 → 1,40) + müşteri-müşteri AYRIŞMA
  eklendi. Bekçi: `musteri-ayrisma` (6, davranış) + `yukleme-dongusu` (5) + `karakter-senkron`a 8;
  **8 mutasyon, kaçan 0.** docs/olcum-musteri.txt · docs/olcum-kol.json · vitest **994**.
- ✅ **S18 — ARAYÜZ DOKUNUŞLARI (D-115b)** — sipariş balonu (sarı küre → ürüne göre dokulu
  billboard) · garson SIRASI → POSTA (sıra genişletilemiyor, ölçüldü: 0,90'da masa noktası,
  1,00'da pad, 1,10'da katı engel; postalar aramayla seçildi, en kısa ara 3,55 br) · patron
  kimliği (önlüksüz + koyu gömlek; yelek/pelerin kolları karede elendi) · oyuncu TAVAN hızı
  5,40 → 4,95 (taban 4,50 sabit — ölçüm tavanın ekonomiye hiç dokunmadığını gösterdi).
  docs/olcum-oyuncu-hizi.txt · vitest **996**.
- ✅ **S19 — ÖLÇÜM + KARAR TURU (tur adı S19a), kod yazılmadı (D-116)** — oturuş çapası (klipte kalça kökün
  0,315 br arkasında; bugünkü arka taşma 0,258 → seçilen çapa 0,26'da sıfır), saran önlük
  (bugünkü önlük göğse takılı bir KUTU), patron dokunuşu (havlu + sıvalı kol), balonun içine
  çizim yerine NESNE + Kenney Food Kit (stil kilidi bilerek açıldı), ince belli bardak bizim
  ilkelimizden. Beş kare · üç yeni araç · `docs/patron-oturus-glif-raporu-s19a.md`.
- ✅ **S20 — D-116'nın UYGULAMASI (tur adı S19b) · D-117** — beş kol da koda girdi: oturuş çapası
  0,26 (yerel +z) · saran önlük **gövdenin profilinden** (sabit yarıçap üç gövdenin ikisini
  deliyordu — Rogue 0,4526 vs A2'nin 0,365; rozet gizlenemedi, ayrı düğüm değilmiş) · patron
  havlu + sıvalı kol (ten DOKUDAN ölçüldü: #f4b690, `PALETTE.ownerShirt` kalktı) · balonun içi
  model render'ı (Kenney `sandwich` + bizim dönel bardağımız) · Kenney Food Kit künyesiyle
  manifeste, `_aday` temizlendi. İki yeni modül (`onluk.ts` · `patron.ts`), iki yeni ölçüm aracı,
  bekçi `tests/oturus-kiyafet.test.ts` **38 denetim / 18 mutasyon**.
  `docs/kiyafet-raporu-s19b.md`. vitest 1030 ✓ · duman 42/42 ✓.
- ✅ **S21 — MUTFAK: sınır okunur oldu + çaycı salonun yükünü anlatıyor (tur adı S20) · D-118** —
  elektrik kesintisinde yarım kalan tur ölçümle kapandı. Görünürlük S6'nın TERSİ çıktı (odanın
  ortası baş hizasında **%99**, görünmeyen ünite **0/19**), yani mutfakta yapılan iş görülüyor.
  **E2:** oyuncu erişimi 0/37.846 ama kapalılık duvar değil `clampToOpenAreas` kelepçesiymiş;
  iki uçtaki **2,81** ve **1,70 br** açıklık (geçiş 0,94 ister) bölmeyle kapandı — salt görsel,
  collision yok, dar 0,20'lik dikişler bilerek açık. **Ç1:** çaycının başı 234 duruşun
  **%100'ünde** görünürken mekanik okuması 0'dı; tempo artık çay bekleyenden geliyor
  (0 / 0,60 / 2,00 — boş↔dolu **3,33×**), D-023 bozulmadı (okur, yazmaz).
  Bekçi `tests/mutfak-s20.test.ts` **17 denetim / 3 mutasyon**. `docs/mutfak-raporu-s20.md`.
  vitest 1051 ✓ · duman 42/42 ✓.
- ✅ **S22 — KADEMELİ MUTFAK: oda 6 kademeyle büyüyor (tur adı S21) · D-119** — sekiz kalıp
  varyant olarak ölçüldü; görünürlük hiçbirini elemedi (S20: 0/19 görünmez), ayıran sayı
  **delta kütle** ve **bedel–değişim uyumu** oldu. Sezgisel kalıp merdiveni TERS akıtıyordu
  (r = −0,95: %73'ünü ödeten basamakta değişen şey bir kasa kapağı). Seçilen **K5 + Y1**;
  merdiven elle yazıldı (türetilmiş dağıtım L2'yi kör bırakıyor). Uygulama üç şey öğretti:
  `_countertop` modelleri ocağın kademesi değil **gömme göz** (parça süzgeci eledi, zincir 5 → 3) ·
  **arka hattın düşey boşluğu dolu** (her modülün üstünde dolap ya da raf var, altı 1,40) — yani
  geç basamakların kütlesi zorunlu olarak ADADAN gelir · büyüyen ada bitişik slotta komşusuna
  giriyor (ada 3 → 2, bir slot atlar). Kural bekçili: **zincirin son üyesi = ünitenin kendi
  anahtarı**, yani L6 tam olarak bugünkü oda. Basamaklar ×0,40 → 0,75 → 1,46 → 1,58 → 2,69,
  r = +0,92, yeni çakışma 0/6, doluluk %32 → %42. Bekçi `tests/mutfak-kademe-s22.test.ts`
  **24 denetim / 4 mutasyon**. `docs/mutfak-kademe-raporu-s22.md`. vitest 1075 ✓ · duman 42/42 ✓.
- 🔧 **S9 — SES ASSETLERİ — ÖLÇÜM BİTTİ, KARAR BEKLİYOR (D-096'nın kapsam sınırı açılıyor)** — kullanıcı ortam uğultusu
  ("kalabalık sesi") ve **daha gerçekçi para sesi** istedi. **Bu karar D-096'yı kısmen geri
  alır:** sentez "nihai" seçilmişti ve `public/assets/audio/` bilerek boştu (lisans yüzeyi sıfır).
  Motor dosya üstüne yazmayı zaten destekliyor (`Model.tsx` deseninin tersi) — yani kablo hazır,
  açılan tek şey **lisans yüzeyi ve tek-stil kilidi**. Ayrıca `settings.music` hâlâ hiçbir şeye
  bağlı değil; ortam sesi o kabloyu da kapatır. **KAYNAK KARARI VERİLDİ (D-106): S-C** — Kenney tek
  sanatçı; coin = RPG Audio `handleCoins`, semaver = `metalPot`, bardak = Interface `glass_00x`,
  Casino Audio Kat 2'ye; `pour` sentezde kalır. Kalan iş dosyaları künyesiyle repoya almak +
  kaynaktan bağımsız **seri ivmesi** (perde basamağı) kodu. Paketler indirildi, repoya girmedi.
  **2026-09-16 — ölçüm TAMAMLANDI ve karar paketi yayınlandı** (`docs/ses-raporu-s17.md`; ham:
  `olcum-ses-s17.txt` + bu turda eklenen `olcum-ses-karma.txt`). Eksik kol ölçüldü: S17 iki UÇ
  hâli ölçmüştü, **karma** katalog sayısızdı (dosya↔sentez çaprazı matriste yoktu). Bulgu ikili —
  ① kimlik bu kararı **seçmiyor** (beş bölüşümün beşi de 0/36 KARIŞIR; çapraz en yakın 8,10 dB =
  taban ×4,9), ② kataloğun en dar yeri **coin değil**: `quest`↔`level` 4,06 dB ve K1/K3/K4'te
  aynı kalıyor — kazanç ilerleme ailesinde (ort. en-yakın 6,41 → K5 10,10 → K2 **10,97 dB**).
  Karar paketi **dinlenebilir** (`feedback_show_dont_ask`): https://claude.ai/artifact/49KsxE368xVHWbw4wHdkSy
  — kol seçimi kullanıcıda, **kod yazılmadı**.
- ✅ **S10 — UI tasarım dili: ARAŞTIRMA + MAKET (D-106)** — kod yazılmadı (tanımı gereği). Ölçüm
  108 görsel karar · palet kütlesi R 0,91 · 13 öğe Arial · 45/184 metin AA altı; sekiz CC0 paket
  indirildi; beş maket. **Kararlar:** ekran K3 tam ekran · mağaza içi M2 (önizleme 74 → 230 px) ·
  pad Y2 · kit **yolu 2** (biçimi al, dosyaları alma; ikonlar 434 CC0 SVG) · G-18 masanın kendi
  noktası · alt gezinme **geometrisi bugünküyle aynı** (A/B/C elendi, kullanıcı soruyu düzeltti).
  Yeni ölçü `tools/olcum-altnav.mjs`: bugünkü bar sahnenin baskın renginden **Δh 2°** — "bar
  sahnenin devamı gibi" şikâyetinin sayısı. Kollar P1 2° · P2 128° · P3 136°, üçü de WCAG AA.
  **Palet SEÇİLDİ: MOR (D-107)** — kullanıcı kolu seçmekle kalmadı, kapsamı büyüttü: arayüzün
  TAMAMI mor, 3B dünya sıcak kalır (dünyanın rengi KayKit'in paleti; D-099 zaten boyamayı
  reddetmişti). Beş ekranın maketi + palet/ölçek token listesi hazır → S11.
  **İkon seti de bu turda çizildi (D-108)** — tek gramer (24×24 · kontur 2,2 · detay ≥ 2 br ·
  aksan tek yerde), çark hesaplanarak; gerçek boyda sınandı, üç ikon düzeltildi. Kenney paketi
  ikon kaynağı olmadı (konturu yok) — S11'de şekil kaynağı olarak açık.
- ✅ **S11 — UI tasarım dili: DİL koda girdi (D-109)** — token katmanı `index.css :root`'ta tek
  kaynak; iki CSS'te ham renk/punto/yarıçap/gölge KALMADI. Tam koşu: punto 17 → **5** (tanımlı 6) ·
  gölge 27 → **3** · yarıçap 9 → **6 dizge = 3 basamak + hap + daire + köşe-başı** · font 3 → **2**
  (B5 Arial gitti) · zemin 29 → **10** · metin 23 → **8** · glif 17 → **13** (kalan `+` ve `₺`,
  ikisi de gerçek metin) · **AA altı 45/184 → 12/177**. İkonlar D-108 gramerinde yeniden yazıldı;
  görev fotoğrafı artık aynı 24-ızgara çizimden ölçeklenerek geliyor. Durum gölgeyle değil
  KENARLIKLA anlatılıyor (maketten daha katı). Bekçi `tests/mor-dil.test.ts` (9 denetim,
  **8 mutasyon**) · vitest 916 · duman 42/42 · `docs/ui-ses-raporu-s9s10.md` §S11a.
  **Açık:** kalan 12 AA ihlalinin hepsi `--tx2`nin gövde gradyanı üstünde durmasından — T1/T2
  kolları ölçüldü, kullanıcı seçecek (öneri T2, S11b'de).
- ✅ **S12 — UI tasarım dili: YAPI koda girdi (D-110)** — beş ekran tek **tam ekran** kabukta
  (geri · başlık · cüzdan); alt sayfa kalktı. Tam koşu: kabuk **5/5 tam ekran** · farklı yükseklik
  **4 → 1** (675·675·473·538·431 → 844) · ekran payı %51,1…%80,0 → **%100** · çıkış jesti
  "✕ + arka" → **tek jest: geri** · mağaza vitrini 150 → **230 px taban** (boşluğu yutarak ~460) ·
  satın alma **3 bileşende dağınık → 1 düğme** · **AA altı 12/177 → 0/184**. S11'in dil sayıları
  korundu (punto 5 · gölge 3 · font 2 · glif 13 · krom %23,2); yarıçap dizgesi 6 → **5** düştü.
  G-05: 50 görevin hepsine lakap · G-18: masa noktası `SV 3` yazıyor · Y2 zaten koddaydı (G-10).
  Bekçi `tests/ekran-kabugu.test.ts` (8 denetim, **8 mutasyon**) · vitest 924 · duman 42/42 ·
  `docs/ui-ses-raporu-s9s10.md` §S12. **Denge sayısı DEĞİŞMEDİ** (`economy.config.ts`e yalnız metin).
  **Araç düzeltildi:** ölçümün üç anlatı paragrafı S10'da donmuştu ve ölçtüğünün tersini
  söylüyordu; hüküm artık eşikten türüyor.
- ✅ **S13 — yeni ücretsiz KayKit paketleri (D-111)** — indirme engeli kalktı (4. adım oyun
  sayfasına gidiyor), **6/6 paket indi** (72,4 MB · 553 model · hepsi CC0). Kullanıcı **kol B**'yi
  seçti: repoya yalnız bir açık kaleme bakan modeller girdi, board-game-bits tek istisna olarak
  TAM alındı, **Block Bits girmedi** → `models/` **5,9 → 17,2 MB** (kol A 27,2 idi, ×4,6).
  Panonun 6 görevinden **3'ü çürüdü** (Holiday süs değil mobilya · Prototype ok değil **itme
  barsız kapı** · Block hacim değil voxel). **WC kabin kapısı değişti**, S7'nin itme barı gitti:
  ayak izi birebir, gövde kalınlığı ölçüldü (0,200; kutuyu şişiren tek şey tokmak).
  Üç kez ölçülen iki kalem kapandı: çöp kutusu 9 pakette yok · Forest'ta çiçek yok.
  Bekçi `tests/yeni-paketler.test.ts` (8 denetim, **11 mutasyon**) · vitest 932 · duman 42/42.
  **Açık kaldı:** yeni kapı yeşili götürüp kahve getiriyor — D-104'ün gerekçesine ters, tur kartında.
- ✅ **S14 — karakterler: PERSONEL (D-112)** — pano §3'ün üç hükmü çürüdü: ekipman **ayrı
  düğüm** (sivilleştirme = `visible=false`) · klipler gövdeye **69/69 iz** tutuyor (retarget yok) ·
  Quaternius ücretsiz katmanı 2 gövde + **80 MB PBR doku** (tek sivil karakter ≈22 MB). Panonun
  bilmediği paket bulundu: **Character Animations**, 139 klip, `Sit_Chair_*` dahil.
  Kullanıcı oranı onayladı konsepti reddetti (*"bunlar savaş karakteri"*) → çözüm dokuda: gövde ve
  bacak palete boyanır, **baş boyanmaz** (yüz/saç/sakal oradan gelir), kasket ve önlük kemiğe takılı.
  Repoya **6 gövde + 4 klip** girdi (+5,9 MB → 23,1). Sahip · garson · bulaşıkçı · çaycı skinned;
  **müşteriler kapsül** (kendi turunda: skinned + parça birleştirme + gömlek rengi).
  Bekçi `tests/karakter.test.ts` (11 denetim, **15 mutasyon, kaçan 0**) · vitest 943 · duman 42/42.
- ✅ **S15 — müşteriler skinned + üç görsel kusur (D-113)** — kullanıcının üç geri bildirimi
  sayıya çevrildi ve aynı turda kapandı. `Walking_A` **0,571 br/sn** için çizilmiş, oyuncu 4,5-5,4
  gidiyordu → ayak **7,9-9,5 katı** kayıyordu ("havada süzülüyor"); artık klip hızdan seçiliyor,
  katsayı hızdan türüyor, tavan 1,80. KayKit başı gövde boyunun %42-52'siydi (ilkel gövdede %33):
  **telafisiz** kolla ×0,75'e indi — gövde ölçeği kıpırdamadı (omuz 0,552 sabit), siluet ~1,52,
  `ACTOR_HEIGHT` ve türeyenleri dokunulmadı. Sahibin kasketi kalktı. Müşteriler **48 yuvalı
  skinned havuza** geçti (gövde başına iki mesh: 48 çizim / 0,52 ms; oyunda ölçülen 38 eşzamanlı
  müşteriyi paylı kapsar). **İkinci turda kullanıcı isteğiyle tavan 80** ("kapsül hiç görünmesin",
  1,57 ms) ve **oturan müşteri masaya döndürüldü** (yön hareketten türüyordu, oturunca geldiği
  yöne bakakalıyordu). Bekçi `tests/karakter-senkron.test.ts` 23 denetim, **21 mutasyon, kaçan 0**.
  Devreden: oyuncuda 2,0× artık kayma (hız düşürmek DENGE, ölçülmedi) · Rogue'un omzu 0,709.
- ✅ **S16 — elde tepsi tutma (D-114)** — tepsi ele değil, gövdenin yanında **sabit bir dünya
  noktasına** asılıydı ve taşırken yürüme klibi oynuyordu (çapa y 0,953 ↔ eller 0,66: tepsi
  ellerin 29 cm üstünde). Artık iki `handslot` kemiğinin ortasına bağlı ve klipler **kemik
  kümesine bölündü** — alt gövde yürür, üst gövde `Holding_A` oynar. Kodun `Walking_B`'yi
  "taşıma" diye etiketlemesi de ölçümle çürüdü (eller arkada). Yolda **iki sessiz hata** çıktı:
  three glTF düğüm adındaki **noktayı siliyor** (kemik kümesi hiçbir kolu yakalamıyordu, tepsi
  ayaklarda kalıyordu) ve `useGLTF`e her render **yeni yol dizisi** veriliyordu (açılışta
  "Maximum update depth exceeded" → duman aralıklı kırmızı). Bekçi
  `tests/karakter-senkron.test.ts` 32 denetim, **32 mutasyon, kaçan 0** · vitest 975 · duman 42/42.

- ✅ **S24 — YÜKSELTME TETİĞİ ARTIK ÇİZİLEN ÇERÇEVE · D-121** — S19'un kalan dördüncü kalemi
  (mantık yarısı). Kullanıcı **B + G**'yi seçti. Kusur ölçüde değil AYNI ŞEYİN İKİ KEZ
  TANIMLANMASINDAydı: çizilen çerçeve yazanla birebir aynıydı (sapma **0,0000**, 13/13) ama dolum
  ayrı bir DAİRE testine bağlıydı — tetikleyen alanın **%50,4'ü** çerçeve dışında. Geometri iki
  değil ÜÇTÜ: "üstündesin" kabarması da kendi dairesini kuruyordu (%34,3 dışarıda). Daireyi
  daraltmak kusuru taşıyor: A1 ölü bölge %28,5 (serviste **%68,2**), A2 %26,0. Yapısal kapatma:
  yeni `src/game/markerFrame.ts` — çizim, tetik ve kabarma tek fonksiyondan okuyor; `tick.ts`ten
  `PAD_RADIUS`/`TABLE_UP_RADIUS` tamamen çıktı. Bedel yazılı: tetik alanı −%49,6, menzil
  1,023 → 0,662/0,619; erişim %94,1 → **%97,6**. Ölçümün açığı uygulamadan önce kapatıldı
  (13 işaretin hiçbiri PAD değildi; 48 işaret tarandı, tek çakışma bilerek bırakıldı).
  Bekçi `tests/tetik-s24.test.ts` **14 denetim / 15 mutasyon, kaçan 0** — kaçan M8 bekçinin zayıf
  yerini gösterdi (hw ≫ hh kutusunda dikey taşma sınanmıyormuş). `docs/tetik-raporu-s24.md`.
  vitest 1105 ✓ · duman 42/42 ✓ · denge sayısı değişmedi.
  **Ayrıca:** `.gitattributes` eklendi (S23'ün CRLF borcu; `git add --renormalize` 0 dosya bozdu).
- ✅ **S23 — OK KENDİ BLOĞUNA GİRDİ, PANEL OYUNUN GÖVDESİNİ GÖSTERİYOR (tur adı S19c) · D-120** —
  S19'un kalan dört kaleminin GÖRSEL üçü; dördüncüsü (yükseltme tetiği) `rules.ts`'e dokunduğu
  için ayrı tura bırakıldı. Kullanıcı **O7 + K3 + E3**'ü seçti. **Ok:** kusur ölçü değil İKİ AYRI
  DOĞRUydu — blok 0,34 r yazılıyken çizilen uç 0,554 r, çünkü 3 kenarlı çemberin kenarı yarıçapın
  √3 katı ve o çarpan hiçbir yerde yazmıyordu; çizilen en artık `OK_GENIS`in KENDİSİ, üç sayı da
  hedefine oturdu, parantez açıklığı 22 katına çıktı. **Panel:** dört kimlik işaretinin dördü de
  tersti (kasket/önlük panelde vardı oyunda yoktu, havlu/sıvalı kol tersi); üç önizleme modeli
  tek `Onizleme` + `KayActor`e indi, vitrin `SalonSlice`e katıldı. **Doluluk:** mağaza her
  açılışta KİLİTLİ sekmede açılıyormuş — %55 → %88; karakter %54 → %95; ayarlar %31 → %74
  (künye bloğu + yıkıcı düğme dibe). Bekçi `tests/arayuz-s23.test.ts` **16 denetim / 12 mutasyon,
  kaçan 0** — mutasyon turu bekçinin iki zaafını buldu (import satırını "kullanım" sanmak ·
  ilk koşunun YALANCI 12/12'si). `docs/arayuz-raporu-s23.md`. vitest 1091 ✓ · duman 42/42 ✓.

**Faz S kapısı:** 185 kullanılmayan KayKit modeli oyuna bağlı + UI dili maketle onaylanmış +
ses kaynağı kararı yazılı. Ondan sonra Faz F'e (paketleme) geçilir.

## Faz H — OYNANIŞ DÜZELTMELERİ (0/3) ⏳ — her kalem ≈ 1 oturum
Sanat kalemi değil; Faz S'ten ayrı tutuldu ki asset işi bunların arkasında beklemesin.
- ⏳ **H1 — oynanış hataları (G-01 · G-02 · G-03)** · çay/bulaşık toplama masanın her tarafından
  olmuyor · çay ocağından alma güvenilmez (tepside yer varken) · 2. masa görevinde kamera
  kendiliğinden kayıyor. Üçü de hata, tasarım kararı beklemiyor.
- ⏳ **H2 — yükseltme SIRASI (ölç → seç → uygula)** · bugün sıra YOK: bir alan açılınca o alandaki
  4 masanın 4'ü de aynı anda ve serbest sırayla yükseltilebiliyor (`tableUpgradeUnlockedIn` yalnız
  ALANIN kapısına bakıyor). Kullanıcı sıralı istiyor. **`rules.ts`'e dokunur → varyant kapısı:**
  iki kol ölçülmeden uygulanmaz — *A: tek hedef* (aynı anda tek masanın noktası canlı, tavana
  varmadan sonraki açılmaz) · *B: kuşak* (hepsi L'ye varmadan hiçbiri L+1'e çıkamaz).
- ⏳ **H3 — masa aralığı / geçilemeyen açıklıklar** · ÖLÇÜLDÜ (D-098): geçiş için
  **2 × playerRadius = 0,94 br** gerekiyor; ön salon **3,50 br** (rahat), **arka salon 0,68 br**
  → 20 masanın 12'si geçilemez, çarpışma katılarında eşik altında **52 açıklık** (en darı 0,04 br).
  Onaylı maket düzenine dokunur → iki kol sayılarıyla yazılı, **kullanıcı kararı bekliyor**.

## Bilinen açık kalemler
- ~~Hedeflerin ₺ kolu bu hâliyle kalsın mı?~~ → **D3b'de kapandı (D-090):** ₺ kolu tamamen kalktı,
  yerine kalıcı gelir çarpanı geldi. **Yeni açık kalem:** çarpan GÖRÜNMEZ bir ödüldür (panelde iki
  yerde yazılıyor + 💎 anlık ödülü taşıyor) ama oyuncu üzerindeki etkisi ölçülmedi — sim'in
  ölçebileceği bir şey değil, **telefonda oynanınca yeniden okunacak.**
- ~~Normal profil 6. saatte 43,4 dk bekliyor~~ → **D6'da ödendi (D-092):** 41,2 → **33,8 dk**,
  ihlal 5 → 2, İdealize hükmü 1 → **0**. Bedeli zincirin %15,5'i — %7'lik eleme eşiğinin
  bilerek aşıldığı **ilk** karar. Sonraki turlar bunu emsal değil, sayısı yazılı istisna okusun.
- ~~Meta katman D-087'nin pencerelerini dolduruyor mu?~~ → **D9'da KAPANDI (D-095):** evet,
  yığın açıkken hüküm profilinde ihlal **0** (18,0 dk). **Yeni açık kalem:** zincir borcu
  %−20,1 kabul edildi ama zinciri UZATAN kollar hiç ölçülmedi — `outputMultByLevel` ve `b1`
  tam oraya bakıyor, kendi turunu ister.
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
