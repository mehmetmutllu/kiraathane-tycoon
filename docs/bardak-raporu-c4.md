# C4 — BARDAK KİLİDİ ÖLÇÜMÜ (D-082)

**Tarih:** 2026-09-08 · **Araç:** `tools/olcum-bardak.ts` → ham çıktı `docs/olcum-bardak.txt`
**Durum:** ÖLÇÜLDÜ → KARAR VERİLDİ (D-083) → UYGULANDI + BEKÇİLENDİ (bkz. §8).

---

## 0. Ne soruldu

C3'ün yan bulgusu (`docs/kuyruk-raporu-c3.md` §5): 4 masa · bulaşıkçı yok · oyuncu yokken
karelerin **%90,8'inde temiz bardak sıfır**, 15 dakikada yalnız **18 müşteri** oturuyor.
Kullanıcı bunu tasarım gereği saymadı (D-082): *"oyuncu telefonu bıraktığında mekânın tamamen
durması istenmiyor"*. Kapsam: **havuz boyu · bulaşıkçının zincirdeki yeri · minimum sızıntı**.

## 1. Nasıl ölçüldü

C3 deseninin aynısı: **ikinci bir model kurulmadı**, oyunun KENDİ `tick()`'i başsız koşturuldu
(tohumlu `Math.random` + sahte `localStorage`), her kare bardak envanteri örneklendi.
5 senaryo (zincirin bardak açısından anlamlı durakları) × 900 sn × dt 0,1.

**İki oyuncu kipi — kilidin iki ucu; arası kestirilmedi:**
- `park` — oyuncu sokakta durur (AFK, telefon bırakılmış). İlgi bütçesi %0. **Karar sayıları buradan.**
- `oyuncu` — dikkatli oyuncu botu: elindeki ürünü bekleyen masaya dağıtır, gerisini bulaşık
  döngüsüne verir. İlgi bütçesi %100. **Bir denge sayısı değil, TAVAN göstergesi.**

**Aracın kendi bekçileri:** (1) **korunum denetimi** — bardak kapalı sistemdir
(temiz + hazır + tepsiler + müşteri elinde + masada kirli = havuz); ölçülen en büyük sapma
**0 bardak** ✓. (2) Bot yürümediyse satır "ölçüm DEĞİL" damgası yer.

**Varyantlar oyun koduna dokunmadan uygulandı** (biri hariç: bulaşıkçının pad'i geçici olarak
1. salona alındı, koşu bitince geri konuldu). Kontrol koşusu varyantsız çıktının birebir aynısı.

## 2. Bulgu 1 — AFK'da mekân YAVAŞLAMIYOR, ÖLÜYOR (kalıcı)

> §2-§7 arasındaki bütün sayılar **D-083 ÖNCESİNİN** ölçümüdür (kararın dayanağı). Sonraki
> hâl §8'dedir; ikisini karıştırma — devralınan bayat sayı bu projede iki kez tuzak oldu.

| B2 · 4 masa · L1 · 1 garson · havuz 12 | park (AFK) | oyuncu (tavan) |
|---|---|---|
| servis / dk | **0,80** | 7,60 |
| toplam servis (15 dk) | **12** | 114 |
| temiz bardak 0 olan kare | %90,8 | %12,3 |
| **son çeyrekte** temiz 0 | **%100** | %16,5 |
| ortalama kirli masa | **3,57 / 4** | 0,48 / 4 |
| tüm masaların kirli olduğu kare | **%86,6** | %0 |

Dakika dakika: dk 1'de 5 servis · dk 2'de 7 · **dk 3'ten 15'e kadar sıfır**. Bitiş envanteri:
**12 bardağın 12'si de masada kirli**. Yani mekân 15 dakikada 12 müşteri (= tam havuz kadar)
ağırlıyor ve **süresiz duruyor** — geri dönüşü yok, çünkü bardağın tek kaynağı yıkamadır.

**Üç ayrı tohumda birebir aynı** (0,80 · %100 · ilk sıfır 82,7 sn): sonuç zarın değil yapının.
(Tohumun gerçekten döndüğü, aşağıdaki `bulasikci` satırlarının tohumla oynamasından görülür.)

B3 (7 masa, bulaşıkçıdan hemen önce) aynı şekil: 1,40 servis/dk, son çeyrek **%100** sıfır.

**B1 (2 masa, garson yok) bu kilide hiç girmiyor:** orada AFK zaten 0 servis, çünkü çayı taşıyacak
kimse yok. Bu tasarım gereği (aktif oynanış kuralı), bardak sorunu değil.

## 3. Bulgu 2 — Kilidi kuran şey havuz DEĞİL, kirli masa eşiği

Havuz iki katına ve dört katına çıkarıldı (12 → 24 → 48). **Hiçbir şey değişmedi:**

| B2 · park | havuz | servis/dk | ort. kirli masa | son çeyrek temiz 0 |
|---|---|---|---|---|
| KONTROL | 12 | 0,80 | 3,57 | %100 |
| havuz ×2 | 24 | **0,80** | **3,57** | %0 |
| havuz ×4 | 48 | **0,80** | **3,57** | %0 |

"Temiz 0" yüzdesi düşüyor ama **debi zerre artmıyor**: fazladan bardaklar temiz olarak duruyor,
çünkü **dört masanın dördü de kirli** ve kirli masaya müşteri oturmuyor. Havuz büyüdükçe kilit
"bardak bitti"den "masa kirlendi"ye taşınıyor, o kadar.

> **D-082'nin birinci kolu (havuz boyu) ölçülmüş bir çıkmaz sokaktır.** Tek başına hiçbir işe yaramaz.

## 4. Bulgu 3 — Servise ORANTILI hiçbir çare kilidi açamaz

"Müşteri bardağını kendi geri götürsün" (iade) denendi:

| B2 · park | servis/dk | son çeyrek temiz 0 |
|---|---|---|
| KONTROL | 0,80 | %100 |
| müşterilerin %25'i bardağını götürür | **0,80** (değişim yok) | %100 |
| müşterilerin %50'si bardağını götürür | 1,80 | **%100** |

Sebep yapısal: **iade servise orantılıdır, servis sıfırlanınca iade de sıfırlanır.** Mekân
durduğu an çare de durur. Yavaşlatır, kurtarmaz.

> Kilidi açabilen tek şey **servisten BAĞIMSIZ** bir temiz-bardak kaynağıdır.

## 5. Bulgu 4 — İşe yarayan iki kol

| B2 · park (AFK) | servis/dk | oturan/dk | ort. kirli masa | son çeyrek temiz 0 |
|---|---|---|---|---|
| KONTROL | 0,80 | 1,20 | 3,57 | %100 |
| **bulaşıkçı 1. salonda** | **7,80** | 11,13 | 0,00 | %0 |
| **sızıntı 2 bardak/dk** | **2,73** | 3,20 | 3,05 | %86 |
| **sızıntı 6 bardak/dk** | **6,67** | 9,13 | 0,80 | %57 |
| *(karşılaştırma: dikkatli oyuncu)* | *7,60* | *9,93* | *0,48* | *%17* |

B3'te (7 masa) aynı sıralama: bulaşıkçı 4,00 · sızıntı 6 → 4,20 · sızıntı 2 → 3,33 · taban 1,40.

**Dikkat edilmesi gereken sayı:** bulaşıkçı erkene alınınca AFK debisi **7,80**, dikkatli oyuncunun
**7,60**'ının ÜSTÜNE çıkıyor — yani *oynamak ile oynamamak eşitleniyor*. Bu, `feedback_active_play_no_overautomation`
(aşırı otomasyon yok, oto-toplayıcı yok) ve `feedback_economy_pacing_offline` (AFK sert kısık)
kurallarıyla doğrudan çelişir. Sızıntı ise oranıyla **ayarlanabilir**: 2/dk → oyuncunun %36'sı,
6/dk → %88'i.

## 6. Yan gözlemler (bu turun kalemi değil, kayda geçsin)

- **Geç oyun (B5 · 20 masa · L6 · 3 garson + bulaşıkçı):** AFK'da 15,93 servis/dk, karelerin
  %23,3'ünde temiz bardak 0. **Ölümcül değil, vergi:** tek bulaşıkçı 20 masaya yetişemiyor.
  Erken kilitle aynı sorun değil; ayrı kalem.
- **Nav ızgarası ile oyuncu çarpışması aynı dünyayı görmüyor:** ızgara `actorRadius` (0,28) ile ve
  **sandalyesiz** kuruluyor (`navSolids`), oyuncu ise `playerRadius` (0,47) ile ve **sandalyeler
  katı** (`activeSolids`). Personelin geçtiği boşluktan oyuncu geçemiyor. Ölçüm botu bu yüzden
  masaya dayanıp süresiz itiyordu; gerçek oyuncu elle dolanıyor, o yüzden bugüne dek görünmedi.
  Faz D'de bakılacak kalem.

## 7. Kayda geçen tuzaklar (ölçüm aracının kendi hataları)

1. **Botun "ölçtüğü" hiçbir şey yoktu.** Bot sokakta başlatılmıştı; `clampToOpenAreas` oyuncuyu
   açık alanın dışında tuttuğu için hiç içeri giremedi ve sonuçlar park kipiyle **birebir aynı**
   çıktı. Tabloya bakan biri "oyuncunun bir faydası yok" diye okurdu. → Araca *"bot yürümediyse
   bu satır ölçüm değildir"* bekçisi eklendi.
2. **Varyant sessizce etkisiz kaldı.** Bulaşıkçı varyantında config değişikliği `kur()`'dan hemen
   sonra geri alınıyordu; `world` ise HER KAREDE `padsDone`'dan yeniden türetildiği için varyant
   koşu boyunca yok oldu ve B2 satırı kontrolle birebir aynı çıktı — yani **sahte bir "fark yok"**.
   → Geri alma koşunun sonuna taşındı.
3. **Paylaşımlı tepsi botu kilitliyordu:** ocağın yanından geçerken tepsiye giren hazır çay
   dağıtılmayınca bot bir daha kirli toplayamıyordu. Bu bir oyun kuralıdır (ürün + kirli aynı
   kapasiteyi paylaşır); bot "yalnız yıkayan"dan **dikkatli oyuncu**ya çevrildi.

*Ortak ders (C3'ten devam): bir sayının çıkması, onu üreten şeyin çalıştığı anlamına gelmez.*

## 8. Karar ve uygulama (D-083)

Kullanıcı ölçülen kollara bakıp **kendi seçeneğini önerdi**: *"garsonlar hem bulaşıkçı hem çaycı
gibi davransa?"* — ölçüldü ve kolların en iyisi çıktı. Uygulanan kural:

> **Temiz bardak BİTTİĞİNDE garson bulaşığa koşar:** masadan kirli toplar (2 kap), leğende yıkar,
> havuz açılır açılmaz servise döner. Temiz bardak varken kirliye ELİNİ SÜRMEZ.

Neden bu:
- **Dünyada sebebi var.** Yeni aktör yok, sihir yok, kaybolan bardak yok — gerçek bir kıraathane
  garsonu da ikisini birden yapar. "Sessiz sızıntı" kolu (bardak kendiliğinden kaybolur) bu yüzden
  ELENDİ, oysa ölçümü iyiydi (2,73 servis/dk).
- **Oyuncunun işini almıyor.** Tetik DAR: yalnız zincir kilitliyken. Normal oyunda garson bulaşığa
  hiç gitmez, bulaşık çemberi oyuncunundur. *Geniş tetik (boşta kalınca hep topla) ölçüldü ve
  REDDEDİLDİ:* AFK debisini 7,27'ye çıkarıyordu — dikkatli oyuncunun %90'ı.
- **Kısmi assist (D-014) korunuyor:** mekân büyüdükçe garsonun boş vakti bitiyor, baskı geri
  geliyor — 7 masada terk %41, 20 masada %71.

**Ölçülen sonuç (AFK · park · aynı tohumlar):**

| senaryo | önce | sonra | dikkatli oyuncu (tavan) |
|---|---|---|---|
| B2 · 4 masa | 0,80 servis/dk · dk 3'te **kalıcı ölüm** | **6,80** · ölüm yok | 7,40 |
| B3 · 7 masa | 1,40 · son çeyrek %100 kilitli | **5,27** · %31 | 4,40 |
| B4 · 8 masa + bulaşıkçı | 5,93 | 5,93 (değişmedi) | 5,13 |
| B5 · 20 masa | 15,93 | 16,13 | 16,53 |

**Dürüst olmak gerekirse:** 4 masalık mekân tek garsona kolay geliyor — AFK (6,80) ile dikkatli
oyuncu (7,40) arasındaki fark %9. Erken oyunda "oynamak" bu yüzden servis DEBİSİ için değil,
para toplamak ve pad doldurmak için değerli. Baskı 7 masadan itibaren geri geliyor. Bu bir takas
ve bilinerek yapıldı; istenirse tetik daha da daraltılabilir (kol config'te: `waiter.idleDishCarry`).

**Yan bulgu — bekçinin yakaladığı GERÇEK delik:** kural ilk hâliyle kilidi açmıyordu. Temiz bardak
bitince garson tezgâha gidip **asla gelmeyecek çayı** bekliyor, "boşta" sayılmıyor ve bulaşığa hiç
gitmiyordu. Bu yüzden `demlemeKilidi` eklendi: *hazır ürün 0 + temiz bardak 0 ⇒ yükleme beklemesi
anlamsızdır.* Bekçi bunu ilk koşuda yakaladı.

**Neler değişti:**
- `economy.config.ts` → `waiter.idleDishCarry: 2` (yeni sayı; tek denge kalemi).
- `tick.ts` → `waiterSystem`: demleme kilidi + boşta bulaşık dalı.
- `types.ts` → `Waiter.dirtyCarry` / `dirtyCarryFood` (transient; kabın türü korunur).
- `Waiter.tsx` + yeni `carriedDirty.tsx` → taşınan kirli GÖRÜNÜYOR; çizim bulaşıkçıyla ORTAK
  (iki ayrı kopya er geç birbirinden ayrışırdı).
- `tests/bardak.test.ts` (3 bekçi) — ikisi mutasyonla doğrulandı, üçüncüsü kuralı kendi içinde
  kapatıp mekânın gerçekten öldüğünü kanıtlıyor.
- `tests/logic.test.ts` → kirli-masa testi güçlendirildi: artık "50 kare sonra hâlâ bekliyor"
  yerine *masa o an kirliyken servis olamaz* değişmezini her karede denetliyor (garson masayı
  temizleyebildiği için eski kurulum sabit durmuyordu).

**Denge sayısı:** yalnız `idleDishCarry: 2` eklendi. Havuz, eşik, sabır, fiyat, ₺ — hiçbiri
değişmedi. `1 / 2 / 4` ölçüldü, aralarındaki fark gürültü içinde kaldı; 2 seçildi çünkü
bulaşıkçının TABAN leğen kapasitesiyle aynı (garson ondan güçlü olmasın).
