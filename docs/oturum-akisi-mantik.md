# Oturum akışı — NET MANTIK (Fable 5.1 · 2026-09-08)

**Soru:** *"neden yapılan her şey aşırı uzun sürüyor, sırf bu chat 2 saat sürdü; memory yapısıyla ilgisi var mı?"*
**Kısa cevap:** Sürenin en büyük kalemi memory değil, **8 dakikalık ölçüm koşusunun kısa hâli olmaması** (§1.2).
Memory yapısı ikinci kalem ve süreden çok **kaliteyi** vuruyor: oturum, gerçekten gerekli 7 KB yerine
140-350 KB "geçmiş" okuyarak başlıyor (§1.3). Üçüncü kalem: aynı bulgu 5 yere yazılıyor (§1.4).
Bu belge kod ve belge DEĞİŞTİRMEZ; yalnız mantığı kurar. Uygulama §5'te oturumluk parçalara bölündü.

---

## 1. Ölçüm (tahmin değil)

### 1.1 Oturum süreleri (git damgaları, `git log --date`)
Eylül'de 13 oturum (commit aralığı > 90 dk = yeni oturum). Uzunlar: 09-06 441 dk/25 commit,
09-07 466 dk/27 commit, 09-08 C3 155 dk/4 commit, **C4: 16:20 → 18:24 ilk commit (124 dk), kuyruk 19:08'e
kadar (toplam 168 dk)**. C4'te 124 dakika boyunca **hiç ara commit yok** — ölçüm, karar, uygulama, test ve
rapor tek commit'e sığdırıldı. Aynı-oturum commit aralığı medyanı Eylül'de 14 dk; C4 bunun 9 katı.

### 1.2 C4'te süre nereye gitti — önceki oturumun tahmini ÇÜRÜDÜ (bir kalemde)
| kalem | önceki tahmin | ölçüm | kanıt |
|---|---|---|---|
| simülasyon koşuları | ~%15 | **8 dk 02 sn / tam koşu** (bu oturumda kronometreyle) × 7 koşu = **~56 dk = 168 dk'nın %33'ü** | `time npx tsx tools/olcum-bardak.ts`; `docs/olcum-bardak.txt` ile çıktı birebir |
| vitest | (test+doğrulama içinde) | **12 sn** (485 test, 19 sn duvar saati) | `vitest run` |
| kapanış (belge + pano + push) | ~%12 | C3 kapanışı **44 dk** (15:36 D-081 → 16:20 "Oturum kapanisi"); 09-08 01:34 notu 35 dk; medyan meta-commit 4 dk ama tam kapanışlar 16-44 dk | git aralıkları, 22 meta-commit |
| aynı bulguyu yazmak | 4 dosya | **5 yer**: rapor 220 satır + D-083 78 + progress 52 + activeContext 42 + pano JSON kartı | §1.4 |

Sonuç: **koşu süresi tek başına, önceki gözlemin "belge + soru + yanlış yol" toplamından büyük.** Araçta
kısa koşu bayrağı yok (`BARDAK_KIP`/`BARDAK_VARYANTSIZ` kipi/varyantı kısar, süreyi ve senaryo sayısını
kısmaz; `olcum-kuyruk.ts:455` `KUYRUK_HIZLI` var ama bardakta yok). 5 senaryo × 900 sn × 2 kip + tohum
sağlamlığı 2×3×3 + hedef×varyant döngüleri (`olcum-bardak.ts:672-749`) hepsi her seferinde koşuyor.

Önceki gözlemin doğru kalemleri: **sıra ihlali** (dar tetik önce uygulandı) gerçek — ve dikkat:
`activeContext.md:141-143` o oturuma "**önce ölç, sonra karar sor, sonra bekçile**" diye yazılı talimatla
girilmişti. Yazılı kural ihlali önlemedi; §3.2 bunu yapısal kilide çeviriyor.

### 1.3 Hafıza yapısı — activeContext "şu an" değil, arşiv
- `activeContext.md`: **4.219 satır / 349 KB**, içinde **96 adet "## ŞU AN" bloğu** üst üste (22'si "ÖNCEKİ/ESKİ"
  etiketli, geri kalanı etiketsiz yığın). 151 commit, **+4.906 / −632 satır** (silme %13) → fiilen sadece-ekle.
  Eylül'de 1.612 → 4.219 (+2.607 satır, 13 oturum, **~200 satır/oturum**).
- Gerçek "şu an" = ilk 106 satır = **7,3 KB (~2,3k token)**. `kiraathane-devam` skill'i (SKILL.md:11-16)
  dosyayı "sırayla oku" der: Read aracı 2.000 satır sınırıyla **140 KB (~44k token)**, tamamı ~109k token.
  Aynı skill `progress.md`'yi de okutur: 187 KB (~58k token); canlı bölüm (Faz C, 1812-son) **13 KB**.
  → Oturum, işe başlamadan **~100-170k token bağlam** yüklüyor; gerekli olan ~10k. Kullanıcının kendi
  tespiti (`feedback_task_splitting`: "dolu context = kalite düşer") bunu zaten kalite riski sayıyor.
- `decisions.md`: 79 karar, 182 KB, 60 commit +2.431/−112 — sadece-ekle ve **bu doğru**: karar defteri arşivdir,
  başta okunmaz, `D-0xx` ile aranır.
- Otomatik hafıza (`~/.claude/projects/.../memory/`): 30 dosya, 765 satır; `MEMORY.md` indeksi (28 madde,
  ~1,5 KB) **her oturumda sistem promptuna kendiliğinden giriyor** — tool çağrısı, okuma maliyeti yok.
  İçeriği: tercih/ilke (`feedback_*`), hedef, cihaz notu. **Proje durumu yok** ve olmamalı: klasör makineye
  özel, git'e girmez; proje iki makinede yürüyor, `git push` zaten protokolde. Kullanıcının "activecontext'i
  memory dosyalarıyla çözebiliriz" ipucu **ilkeler için zaten yapılmış**; "şu an" ise git'te kalmak zorunda.

### 1.4 Aynı bulgu beş yerde — örtüşme ölçümü (C4)
Anahtar sayıların dosya başına geçiş sayısı (rapor · decisions · progress · activeContext · pano):
`0,80`→10·4·3·6·1 · `7,53`→1·1·1·1·0 · `6,80`→1·1·2·3·0 · `demlemeKilidi`→2·1·1·1·0 · `18,87`→1·1·1·1·0 ·
`idleDishCarry`→2·1·1·1·0 · `485/485`→0·1·1·1·0 · "üç ayrı tohum"→1·1·1·1·0 · `urunVar`→2·1·1·1·0.
**11 anahtar sayının 9'u dört markdown dosyanın dördünde de var.** C3'te aynı: `starvation` 4·4·4·4.
Satır bütçesi: 220 + 78 + 52 + 42 + pano kartı ≈ **400 satır / bulgu**; rapor tek başına bulguyu tam taşıyor
(§0-§10 başlıklarıyla). Ötekiler raporun paragraf düzeyinde yeniden anlatımı.

### 1.5 Ölçüm araçları — ortak iskelet var ama modül yok
`seedRandom` ve sahte `localStorage` blokları üç araçta **md5 birebir aynı** (`8103f4…`, `aa9f17…`);
`kur()` bardak ↔ kuyruk arasında 2 satır farklı. Kopyala-yapıştır iskelet: `olcum-bardak.ts` 761 satır,
`olcum-kuyruk.ts` 461, `tick-fingerprint.ts` 176. C4'te 600 satır "sıfırdan" yazılmasının sebebi ortak
`tools/olcum-lib.ts` olmaması; aracın kendi hataları (bot sokakta sıkıştı — `clampToOpenAreas`; varyant
`kur()`'dan sonra geri alındı ve sessizce etkisiz kaldı) **her araçta yeniden keşfediliyor**
(`bardak-raporu-c4.md §7`, `kuyruk-raporu-c3.md §9` — C3'ün aynı zaman-aşımı tuzağı C4'te tekrar).

---

## 2. Süre modeli — adım adım bedel mi israf mı

| adım | C4 payı (ölçülmüş/çıkarım) | hüküm | gerekçe |
|---|---|---|---|
| Başlatma: 4 dosya okuma + onay turu | ~5 dk süre, **44-170k token** | **israf (bağlam)** | Gerekli 10k; kalan 90+% eski oturum anlatısı. Süreye az, kaliteye çok vuruyor. |
| Soru turları (4) | ~%8 | yarısı bedel | 2 tur zorunlu (başta plan, ölçüm sonrası karar). Aradaki 2 tur, seçenekler tek pakette sunulsaydı erirdi (`feedback_workflow_plan_approve` eki zaten "tek soru sor" diyor). |
| Araç yazımı (600 satır) | ~%20 | yarısı bedel | Senaryo/varyant/kip mantığı gerçek iş; tohum + storage + kur + korunum + bot doğrulama + rapor formatı iskelet (~%50). |
| Aracın kendi hataları | ~%15 | **israf** | Üç tuzak C3'te de vardı, C4'te yeniden bulundu. İskelette "bot yürüdü mü / varyant etkili mi" damgası olsaydı ilk koşuda çıkardı. |
| Ölçüm koşuları (7 × 8 dk) | **%33** | **5/7'si israf** | Geliştirme sırasında 1 senaryo × 300 sn yeterdi (yön doğru mu?). Tam koşu 2 kez şart: taban + final. |
| Yanlış yol (dar tetik) | ~%15 | **israf** | Karşılaştırma sayısı (6,80 ↔ 7,27) uygulamadan ÖNCE elde edilebilirdi — aynı araca varyant olarak. |
| Uygulama + 3 bekçi + 4 mutasyon | ~%15 | **BEDEL** | Üç gerçek deliği bekçiler yakaladı (`demlemeKilidi`, `urunVar`, tezgâh yükleme). Mutasyon doğrulaması sahte yakalamayı eledi (C3'te yaşandı). Kesilmez. |
| Belgeleme (5 yer) | ~%12 (C3: 44 dk) | **3/5'i israf** | Rapor + karar cümlesi bedel; progress/activeContext/pano anlatısı aynı metnin kopyası. |
| Kapanış test + commit + push | vitest 12 sn | bedel | Zaten ucuz. |

Toplam israf çıkarımı: **~%45-50** (koşu 24 + yanlış yol 15 + araç hataları ~8 + belge ~7 + soru ~4 puan).
Bedel olan yarı, protokolün üç gerçek hatayı yakalayan kısmı — dokunulmaz.

---

## 3. NET MANTIK

### 3.1 Üç ilke
1. **Ölçüm ucuz, uygulama pahalı olsun.** Bir fikir önce *varyant* (araca enjekte edilen geçici config),
   ancak sayı çıktıktan sonra *kod*. C4 bunu tersine yaptı.
2. **Bir bilgi bir yere yazılır; ötekiler işaret eder.** `feedback_single_source_of_truth` kod için var;
   belgeye de uygulanır: sayı raporda, karar defterde, durum tek satırda, anlatı hiçbir yerde ikinci kez.
3. **Oturum "şu an"la başlar, geçmiş istenince gelir.** Başlangıç okuma seti ≤ 15 KB; geçmiş git + arşiv.

### 3.2 Oturum sırası — ve sıra ihlalini yapısal olarak imkânsız kılan kilit
```
0 BAŞLA   /kiraathane-devam → 3 küçük dosya (§3.3) → tek mesaj: "şu an / sıradaki / açık sorular" → onay
1 SORU    Tur kartı açılır (activeContext'in yeni biçimi): SORU · ÖLÇÜLECEK KOLLAR · (boş) SAYILAR · (boş) KARAR · (boş) UYGULAMA · (boş) BEKÇİ
2 ÖLÇ     kısa koşu ile aracı doğrula (bot yürüdü? varyant etkili? korunum 0?) → tam koşu TABAN → tüm kollar VARYANT olarak → rapor §"Bulgular"
          → commit #1: araç + ham çıktı + rapor (karar bölümü boş)
3 KARAR   Tek "karar paketi" mesajı: kollar tabloda, sayılarıyla, önerilen işaretli. Kullanıcı seçer
          ("sen mantıklı olanı yap" = önerilen). Bu oturumun TEK karar turu.
4 UYGULA  Yalnız kararın koluna kod. Bekçi testi → mutasyonla doğrula (en az 2) → tam koşu FİNAL → rapor §"Karar ve etki"
          → commit #2: kod + test + rapor tamamlandı + D-0xx
5 KAPAT   progress 1 satır · activeContext tur kartı → "sonraki tur" · pano · vitest · push (§3.7)
```
**Kilit — "varyant kapısı":** `economy.config.ts` / `tick.ts` / `rules.ts`'e dokunan her denge değişikliği,
raporun **§Bulgular tablosunda o kolun sayı satırı** olmadan yapılmaz. Kural yazıya değil *sıraya* gömülü:
commit #1'de rapor karar bölümü BOŞ olmak zorunda (ölçüm bitti, karar henüz yok); commit #2 ancak #1'den
sonra gelebilir. Dar tetik/geniş tetik gibi ikilikler adım 2'de **iki varyant satırı**dır — biri uygulanıp
diğeri sonradan ölçülemez, çünkü adım 4 tek kol kabul eder. `oturum-bitir` de kontrol eder: rapor
§Karar tarihi ≥ commit #1 tarihi, değilse kapanış uyarı verir (sonradan, §5 P3).

### 3.3 Belge haritası — hangi bilgi nereye, bir kez
| bilgi | TEK yeri | ötekiler ne yapar |
|---|---|---|
| ölçüm sayıları, yöntem, tuzaklar, etki | `docs/<konu>-raporu-<faz>.md` | linkler |
| karar cümlesi + belirleyici 1-2 sayı + gerekçe (≤ 12 satır) | `memory-bank/decisions.md` `D-0xx` | rapora link; sayı tablosu TEKRARLANMAZ |
| faz/oturum durumu | `memory-bank/progress.md` — **oturum başına 1-2 satır**: `✅ C4 — bardak kilidi · D-083 · docs/bardak-raporu-c4.md · vitest 485` | anlatı yok |
| ŞU AN + sıradaki + açık sorular | `memory-bank/activeContext.md` — **tur kartı, ≤ 80 satır, ÜZERİNE YAZILIR** | geçmiş: git + arşiv (§3.4) |
| pano sayaç + günlük kartı | `docs/pano/ilerleme-panosu.html` JSON | kart = progress satırının 3-4 cümlelik hâli; script üretir (§3.7) |
| kalıcı tercih/ilke/ders | otomatik hafıza `feedback_*.md` | memory-bank'e tekrar yazılmaz; proje DURUMU buraya asla |
| ölçüm iskeleti dersleri (tuzaklar) | `tools/olcum-lib.ts` içinde **kod olarak** (damga/assert) | raporların §"tuzaklar" bölümü yalnız yeni tuzağı yazar |

Bulgu başına satır bütçesi: ~400 → **~250** (rapor 220 aynen kalır; kalan 4 yer 180 → ~30).

### 3.4 activeContext: "şu an" mı arşiv mi? — ŞU AN, ve arşiv dışarı çıkar
- **Tek seferlik kesim:** 107. satırdan sonrası (4.113 satır) `memory-bank/arsiv/activeContext-2026-06-09..09-08.md`'ye
  taşınır; `progress.md`'nin bitmiş faz anlatıları (1-1811, Faz 0 → BM) `memory-bank/arsiv/progress-tamamlanan.md`'ye.
  Git zaten her satırı tutuyor; arşiv dosyası **grep için** (D-0xx ararken `git log -S` yerine dosya).
- **Sonrası:** activeContext = tur kartı, her oturum üzerine yazılır. `git log -p memory-bank/activeContext.md`
  oturum-oturum tarih olur — 96 blok bugün zaten bunu kötü taklit ediyor.
- `progress.md` = pano tablosu (30 satır) + aktif faz (≤ 100 satır). Faz kapanınca bölümü arşive gider.
- **Neden auto-memory değil:** makineye özel, git dışı; "şu an" iki makinede aynı olmak zorunda.

### 3.5 İki hafıza sisteminin iş bölümü (bugünkü fiili durum resmîleşir)
- **Otomatik hafıza** = *nasıl çalışırız* (tercih, ilke, red edilen fikir, ders). Kendiliğinden yüklenir,
  ücretsiz. Yeni kural buraya; `memory-bank`'e kopyalanmaz. 30 dosya iyi durumda; **3 zayıf nokta**:
  `feedback_workflow_plan_approve` + `feedback_task_splitting` + `feedback_night_session` üçü de oturum akışı
  anlatıyor → §5 P1'de tek `feedback_session_flow.md`'ye katlanır (bu belgeye link).
- **memory-bank (git)** = *proje nerede* (durum, karar, faz). Tool ile okunur, o yüzden **küçük** olmalı.
- **docs/** = *neden* (rapor, tasarım, ölçüm). İstenince okunur.
- **git** = *ne zaman ne oldu*. Anlatı arşivi budur; markdown'a ikinci kez yazılmaz.

### 3.6 Soru turları teke iner
Oturum başına **en fazla 2 tur**: (a) başlangıç onayı (skill adım 4, zaten var), (b) **karar paketi**
(§3.2 adım 3). Paket biçimi: `kol | sayı | takas | öneri ✓`. Arada çıkan her soru pakete beklemeye alınır;
pakete sığmayan **"sonraki oturumda sor"** olarak tur kartına yazılır (`feedback_workflow_plan_approve` eki
2026-09-04 bunu zaten istiyor). Kullanıcının "sen mantıklı olanı yap"ı = önerilen kol; tekrar sorulmaz.

### 3.7 Ölçüm aracı iskeleti + kısa/tam koşu
`tools/olcum-lib.ts` (tek dosya, ~200 satır): `seedRandom` · sahte storage · `kur(senaryo)` ·
`kosu(sn, kip, dt, varyant)` çatısı · **korunum denetimi** · **bot-yürüdü damgası** · **varyant-etkili damgası**
(varyantlı ve varyantsız ilk 100 karenin parmak izi farklı olmalı; değilse "VARYANT ETKİSİZ — ölçüm DEĞİL") ·
rapor tablosu. Konu-özel araç sadece senaryo listesi + örneklenen alanlar + varyant sözlüğü (~150-250 satır).
Koşu kipi: **`OLCUM=kisa` varsayılan** (1-2 senaryo × 300 sn × 1 tohum, hedef < 60 sn); **`OLCUM=tam`** yalnız
taban ve final koşusu (rapora giren sayılar). Rapor "tam koşu" damgası taşımayan sayıyı yayınlamaz.
Geçiş güvencesi: lib'e taşınan üç araç `tick-fingerprint` ile birebir aynı çıktıyı vermeli (Faz B1 deseni).

### 3.8 Kapanış ucuzlar
- **Yazılacak 4 şey 1'e iner:** progress'e 1 satır; activeContext tur kartı zaten dolu (oturum boyunca yazıldı);
  D-0xx ≤ 12 satır; pano kartı progress satırından **script** (`tools/pano-guncelle.mjs`: JSON `yapilan`+1,
  `ozet`, `siradaki`, `gunluk` başına kart, tarih — SKILL.md'nin 6 elle adımı) — sonra aynı yolla yayın.
- Testler zaten ucuz (12 sn). Smoke korunur.
- **Ara commit'ler** (§3.2 #1/#2) kapanışı 44 dk'dan ~10-15 dk'ya indirir: kapanışta yazılacak yeni bir şey
  kalmaz, yalnız progress satırı + pano.
- Kapanış mesajı aynen kalır.

---

## 4. Beklenen kazanç — C4 tabanı 168 dk (ölçülmüş)

| değişiklik | kazanç | risk / kalite etkisi |
|---|---|---|
| Kısa/tam koşu ayrımı | 7×8 = 56 dk → 2 tam (16) + 5 kısa (~5) = 21 dk → **−35 dk (%21)** | Kısa koşu yön gösterir, sayı vermez; tam koşu final ZORUNLU kalır. Kalite kaybı yok. |
| Varyant kapısı (sıra kilidi) | boşa giden uygulama+test+ölçüm turu ~25 dk → **−20 dk (%12)** | Sıfır; protokolü güçlendirir. |
| Ortak iskelet + damgalar | araç yazımı+kendi hataları ~%35 (59 dk) → ~%18 → **−25 dk (%15)**, 2. kullanımdan itibaren | İlk uygulama oturumu bunu ÖDER (P2). Damgalar sahte "fark yok"u ilk koşuda yakalar → kalite artar. |
| Belge tek-kaynak + script pano | kapanış 44 → ~12 dk → **−30 dk (%18)** (C3 ölçüsü; C4'te −15) | decisions'ta belirleyici sayı KALIR; yoksa karar bağlamsız kalır (D-078 dersi: devralınan sayı bayatlar → link, kopya değil). |
| Başlangıç okuma seti 150k → 10k token | süre −3 dk; **bağlam kalitesi** ana kazanç | Eski bilgi gerekince `arsiv/` + `D-0xx` araması: 1 tool çağrısı. |
| Soru turları 4 → 2 | **−5-8 dk** + bekleme | Karar paketi eksikse 3. tur olur; kabul edilebilir. |

**Toplam: 168 → ~90-100 dk (%40-45), bekçi/mutasyon/tam-koşu-final dokunulmadan.** Kaliteyi düşürecek olup
**önerilmeyen** şeyler açıkça: mutasyon doğrulamasını atlamak · finalde tam koşuyu atlamak · bekçi yazmadan
denge sayısı değiştirmek · raporu kısaltmak (rapor tek kaynak oldu, kısalmaz). Uzun oturum (441-466 dk)
kayıtları çoklu-görev geceleriydi; bu mantık onlara da uygulanır ama taban C4 gibi tek-görev oturumudur.

---

## 5. Uygulama planı (küçük, tek oturumluk parçalar; kod işiyle karışmaz)
- **P1 — Hafıza kesimi (½ oturum, kod yok):** `arsiv/` iki dosya · activeContext → tur kartı şablonu ·
  progress → pano tablosu + Faz C · `kiraathane-devam` okuma seti = brief + progress (küçük) + activeContext (kart);
  `oturum-bitir` = progress 1 satır + kart + D-0xx ≤ 12 satır · otomatik hafızada üç akış dosyası tek
  `feedback_session_flow.md`'ye (bu belgeye link). Kabul: başlangıç okuma seti ≤ 15 KB (ölçülür).
- **P2 — `tools/olcum-lib.ts` (1 oturum):** iskelet + damgalar + `OLCUM=kisa|tam`; üç araç lib'e bağlanır;
  `tick-fingerprint` diff boş; `docs/olcum-*.txt` birebir yeniden üretilir. Kabul: kısa koşu < 60 sn, tam koşu
  çıktısı değişmedi.
- **P3 — Kapanış otomasyonu (½ oturum):** `tools/pano-guncelle.mjs` (progress satırından JSON) + `oturum-bitir`'e
  "rapor §Karar boşsa/kod commit'i rapor commit'inden önceyse uyar" kontrolü.
- **P4 — İlk gerçek tur = C5** yeni akışla; git damgalarıyla süre ölçülür, bu belgenin §4 tahmini karşılaştırılır.
  Sapma > %15 ise mantık düzeltilir (ölçmeden yazılan cümle varsayımdır — D-078).

---

## 6. Kullanıcı kararı gereken sorular (öneri ✓)
1. **activeContext/progress geçmişi nereye?** A) sadece git'e bırak, sil · **B) `memory-bank/arsiv/` (grep'lenebilir) ✓** ·
   C) otomatik hafıza klasörü (makineye özel — önerilmez).
2. **Pano günlük kartı:** A) elle yazılmaya devam · **B) progress satırından script üretir, anlatı kısalır ✓** ·
   C) kart kaldırılır, yalnız sayaç kalır (`feedback_progress_dashboard` "anlatı kartlarda kalır" diyor — C ona aykırı).
3. **decisions.md ne kadar taşısın?** **A) karar + belirleyici 1-2 sayı + gerekçe ≤ 12 satır + rapor linki ✓** ·
   B) bugünkü gibi tam gerekçe (D-083: 78 satır) · C) yalnız karar cümlesi + link (bağlam kaybı riski).
4. **Ara commit:** **A) ölçüm (commit #1) ve uygulama (commit #2) ayrı — varyant kapısının mekanik kilidi ✓** ·
   B) tek commit (bugünkü; kilit yalnız yazılı kural olarak kalır, C4'te işe yaramadı).
