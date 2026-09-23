# T9b — OYNANIŞ TARAMASI (G-88'in ikinci parçası)

> Tur tipi: **tarama** — kod yazılmadı, `economy.config.ts` / `tick.ts` / `rules.ts` DEĞİŞMEDİ.
> Çıktı: bulgu listesi → kullanıcı seçer → seçilenler düzeltme turuna (varyant kapısı orada işler).
> Kapsam (kullanıcı 2026-09-23): oynanış · mantık hataları · görev sıralaması · UX/UI.
> Araç: `tools/tarama-botu-t9b.txt` (tarayıcıda `eval` edilen bot) · kareler: `docs/gorsel/t9b/`.

## §0 Yöntem

1. **Canlı oynanış botu** (tarayıcı, `npm run dev`, 412×860 telefon): gerçek `tick` + gerçek
   klavye girdisi (`inputKeyboard`) + gerçek çarpışma. Bot **yön okunu izler** (`questFocusPos` —
   bant/kamera/kenar oku/zemin işaretinin tek kaynağı), müşteriye servis eder, para toplar, kirli
   bardağı bulaşığa götürür, panel görevlerini (tepsi/mıknatıs/garson) store eylemiyle alır.
   Takılma dedektörü: 15 dk görev ilerlemezse durum dökümü. Görev hattı baştan
   `q_z3table5`'e (#37) kadar koşuldu; `q_tost5` kilidinde `__setQuest` ile atlatıldı.
   Bot süreleri **tempo ölçüsü DEĞİLDİR** (botun kendi yol sorunları var, bkz. §Bot sınırları).
2. **Statik inceleme** (üç paralel okuma): görev sırası/kapılar · oyun durumu/kayıt/offline · UI/UX kodu.
   Her "kesin" bulgu ya canlıda ya kodda ikinci kez doğrulandı (sütun **Doğrulama**).

## §Bulgular

Doğrulama sütunu: **canlı** = tarayıcıda gözlendi (kare `docs/gorsel/t9b/`) · **kod** = satır okunup
ikinci kez teyit edildi · **betik** = izole Playwright/eval denemesi. Önem: Y yüksek · O orta · D düşük.

### A — Oyunu kilitleyen / ilerlemeyi bozan

| # | Bulgu | Yer | Senaryo → sonuç | Önem | Doğrulama |
|---|---|---|---|---|---|
| A1 | **`q_tost5` asla bitmez — hat 30/50'de KİLİTLENİR** | `rules.ts:574-610` (`serveTost` dalı yok) | tost L5 → "5 tost servis et" → sayaç `null`, `questTargetMet` `false`. `tostServed` 50'ye çekildi, görev yerinden oynamadı. Kartta sayaç yok ("0/5" yerine "Hedefe git"). Hat kilitliyken pad yok, yükseltme noktası yok (D-142 kapısı) → oyuncunun yapacağı tek şey panel alımı | **Y** | canlı `t9b-04` + kod + betik |
| A2 | **`q_tableL2x2`: ok yanlış masayı gösteriyor** | `rules.ts:689-697` ↔ `tableUpgradeTarget` (D-124) | 1. masa L3'e çıkınca ok/kamera/kart 2. masaya döner, canlı nokta hâlâ 1. masada (tavana kadar). Oku izleyen bot 10 dk boş zeminde bekledi; 47 karede ok ≠ canlı nokta | **Y** | canlı `t9b-03` + bot izi |
| A3 | **Arka plandan sıcak dönüşte çevrimdışı gelir YOK** | `App.tsx:82` (yalnız `hidden`→kaydet) · `store.ts:578` (yalnız `init`) | uygulama arka plana → 3 sa → geri aç (yeniden yüklenmeden) → dt 0,25'e kelepçeli, 3 sa silinir, ödül ekranı çıkmaz. Mobilde en sık yol bu | **Y** | kod |
| A4 | **Android geri tuşu işlenmiyor** | `App.tsx` (`backButton` yok) | panel açıkken geri → uygulama kapanır | **Y** (Faz F) | kod |
| A5 | **Daha yeni sürümlü kayıt sıfırlanıyor** | `save.ts:353-362` | eski paket + yeni kayıt (v35) → `resetKeepingSettings` → 2 sn sonra üzerine yazılır, ilerleme gider | O | kod |
| A6 | **Kaydın iç alanları varsayılanla birleşmiyor** | `save.ts:355` (yüzeysel `...`) | eksik `stats.waiterServedByService` → her karede TypeError (donma); `padsDone:null` → `init` çöker, her açılışta beyaz ekran. Gelecekte eklenecek her `stats` alanı aynı tuzak | O | kod |
| A7 | **Seviye ödülü "Al"a basmadan kapatılırsa ₺ kaybolur** | `tick.ts:1626` · `levelUp` kayda girmiyor | Sv 5+ ekranı açıkken uygulama kapanır → ödül bir daha gelmez | O | kod |

### B — Yönlendirme / arayüz (UX)

| # | Bulgu | Yer | Senaryo → sonuç | Önem | Doğrulama |
|---|---|---|---|---|---|
| B1 | **Karakter görevinde ilk dokunuş yutuluyor** | `hud.css` karartma z:30 · alt gezinme z:13 | "Karakter sekmesine dokun" → dokununca yalnız karartma kapanır, panel **ikinci** dokunuşta açılır | O | betik (`elementFromPoint` = karartma) · `t9b-11b` |
| B2 | **Tepsi ipucu ilk servis ORTASINDA ekranı karartıyor** | `HUD.tsx:152,258` | 1. görev biter, "Çayı müşteriye götür" başlar → ekran kararır: *"Müşteri kalmadıysa tepsini boşaltabilirsin"* — görevle çelişik, kutu servis edilecek masanın üstünde; joystick'e ilk dokunuş yürütmez, ipucunu kapatır | O | canlı `t9b-10` + betik |
| B3 | **Hat bitince hiç yönlendirme kalmıyor** | `HUD.tsx:347-353` | 50. görev biter → bant kalkar; ok yok, işaret yok, Hedefler/Günlük'e çağrı yok | O | canlı `t9b-24` |
| B4 | **Garson görevi yanlış sekmede açılıyor** | `CharacterPanel.tsx:285` (`useState('player')`) | "Garson tepsisini yükselt" → panel "Oyuncu" sekmesinde, orada da "Tepsi" satırı var → yanlış alım | O | kod |
| B5 | **Usta penceresi masanın yanında her duruşta yeniden açılıyor** | `Scene.tsx:719-732` | tavandaki masaya servis eden oyuncu her durduğunda 1,1 sn sonra pencere; elmas yoksa yalnız pasif düğmeler | O | kod (sıklık ölçülmedi) |
| B6 | **Masa köşesinden servis olmuyor** | `tick.ts:841` (masa MERKEZİNDEN 1,6) | masanın köşesine dayanan oyuncu 1,85 br'de kalır → çay bırakılmaz. Kenardan 1,31 (olur). H1 bulaşığı gövdeye taşımıştı, servis hâlâ merkezde | D-O | betik (çarpışma geometrisi) |
| B7 | **Çok-adımlı durum görevlerinde sayaç yok** | `rules.ts:652` (`cur` yalnız sayaç görevinde) | "2 masayı Seviye 3'e çıkar", "Salon 1'in 4 masası L4" → kartta "1/2" yok, "Hedefe git" yazıyor | D-O | canlı `t9b-03` |
| B8 | **Bant ile zemin farklı tutar yazıyor** | `rules.ts:654` ↔ `Pad.tsx:30` | kısmi dolumdan sonra bant toplamı (9.950), zemin kalanı (4200) gösterir | D | kod |
| B9 | **Bildirim kesiliyor ve sağ düğmeye biniyor** | `hud.css:1451` | "Bekleyen paralar otomatik topla…" kesik, kamera düğmesinin üstünde | D | canlı `t9b-03` |
| B10 | **Seviye 2-4 ekranı 0 ₺ için "Al" + "İzle, 2× al" gösteriyor** | `tick.ts:1626` (₺ Sv 5'ten başlar) | yalnız "servis hızı %0 → %2" var; 2× neyin iki katı belirsiz. İki seviye arka arkaya gelince tek ekranda birleşiyor (tasarım gereği) | D | canlı `t9b-01` |
| B11 | **Çevrimdışı ₺ "Al"dan ÖNCE cüzdana eklenmiş** | `store.ts:594` | ekran açıkken üst şerit ödülü zaten içeriyor; "Al" hiçbir şey eklemiyor (24.785 → 24.785) | D | betik |
| B12 | **Pasif düğmeler nedenini söylemiyor** | `HUD.tsx:669,1328` · `CharacterPanel.tsx:142` | parası yetmeyen alım yalnız sönük; "X ₺ eksik" yok | D | kod |
| B13 | **Dokunma hedefleri < 44 px, yazı 11 px** | `hud.css`, `index.css:47` | dişli 34 · anahtar 30 · hedef "Topla" ~33 · alt gezinme etiketi 11 px | D | kod |

### C — Metin ve biçim tutarlılığı

| # | Bulgu | Örnek |
|---|---|---|
| C1 | **Para üç biçimde** | üst şerit "6.04K" · çevrimdışı "+7.474" · zemin "9950" · panel "2.6 → 3.4 alan". Türkçede "6.04" ondalık değil binlik okunur. `fmt` 999.995'i "1000K" yazar |
| C2 | **Aynı şeye üç ad** | alt gezinme "Karakter" · sekme "Oyuncu" · panel başlığı "Çaycı"; seviye ekranı "Seviye", şerit ve Hedefler "İtibar" |
| C3 | **Karışık yazım** | "YÜKSELT" (büyük) · "Lavaboyu Büyüt" · "SV 2" (açıklamasız) · "MAX" / "Max masa" (İngilizce) · bitiş metni iki farklı cümle |
| C4 | **"Bildirimler" anahtarı işlevsiz** | `settings.notifications` hiçbir yerde okunmuyor |
| C5 | **Sıfırlama onayı tarayıcı penceresi** | `window.confirm` → Capacitor'da sistem kutusu |

### D — Günlük görev / ekonomi kenar durumları

| # | Bulgu | Senaryo | Önem |
|---|---|---|---|
| D1 | **Günlük hedef gün içinde büyüyor** | "20 çay" 20/20 toplanabilir → toplamadan masa aç → hedef 22, kart "ilerliyor"a döner (`dailyQuests.ts:143`) | D-O |
| D2 | **Saati geri alarak günlük 💎 tekrar alınıyor** | `day !== prev.day` geri gidişte de yeni set + boş `claimed` (`dailyQuests.ts:155`) | O (💎 sert para) |
| D3 | **"Bardak yıka" günlüğü `q_wash`tan önce yapılamaz** | ilk gün ~%50 ihtimalle gelir; hat hızlı olduğu için genelde yetişiyor | D |
| D4 | **Yerdeki para + içmekte olan müşterinin ödemesi kapanınca yanar** | 3 dk'ya kadar birikebilir, çevrimdışı telafi etmez | D |
| D5 | **Yükseltme noktaları görev kapısında (D-142) → Usta hedefinin 3. kademesi hat sonuna kadar kilitli** | tasarım sonucu; A1 düzelmezse hiç açılmaz | D |
| D6 | **Garson yanlış ürünle dolu tepsiyle boşta kalabilir** | 2 çay taşıyan garson, yalnız tost bekleyenler varken bekler; yeni çay müşterisiyle çözülür | D |

### E — Araç bulgusu (T9a telefon A/B, kullanıcı 2026-09-24 istedi)

`docs/olcum-nav-ab-t9a-telefon.txt` — **sonuç geçerli, D-145 yerinde**: damgalar temiz, 5 bloğun 5'inde
önbellek kolu ucuz (kare işi ×0,70–0,81). Kusurlar:
- `olcum-nav-ab-t9a.mjs:55` `ortanca` çift uzunlukta ÜST ortayı alıyor → kare işi 45,3/35,6 yerine
  **44,75/35,25**, kazanç **−%21,4 değil −%21,2**; nav ×0,241 yerine ×0,243.
- "tarayıcı DOĞRULUYOR" eşiği ≤ 0,25; sonuç 0,24 — node ×0,07 ile 3,4 kat fark var: yön doğrulanıyor, büyüklük değil.
- §C yorum cümleleri sabit metin; veri önbellekte çağrı başı DAHA AZ ayırma gösteriyor (19,9 < 23,2 KB),
  rapor §A′ ise farkı "anahtar dizgesi ayırması" ile açıklıyor → açıklama kendi verisiyle çelişik.
- "Telefon" = masaüstü RTX 3060 + CPU 4× kısma öykünmesi (GPU kısılmadı) → rapor bunu gerçek cihaz gibi okutuyor.
- Denetim "nav çağrı/kare" −%10,4 (eşik ±%12) kare hızına bağlı; sim-saniyesi başına ölçülmeli.

### Tekrar üretilemeyen

- İlk betik koşusunda 10 kez `GLTFLoader: Couldn't load texture furniturebits/citybits_texture.png` —
  yalnız bot ana iş parçacığını saniyelerce kilitlerken çıktı; 4 bağlamda (mobil/masaüstü × swiftshader/
  varsayılan) + boyut değişimi + hat sonu ile yeniden denendi: **0 hata**. Bulgu sayılmadı.

## §Bot sınırları (bulgu DEĞİL)

- Personel yol ızgarası (`getNavGrid`) aktör yarıçapıyla şişer, oyuncunun gövdesi (0,47) daha
  kalın → bot saksı/masa köşesine takıldı; insan kayarak geçer. Bot 25 sn ilerlemezse hedefe ışınlanır.
- Bot tost müşterisini ancak tepside tost varken seçer; garsonlar tostu önce kapıyor → elle tost
  servisi 40 dk'da 0 kaldı (bu, `q_tost5` kilidinden BAĞIMSIZ: sayaç 50'ye elle çekildiğinde de görev
  ilerlemedi).

## §Karar (D-146, kullanıcı 2026-09-24)

- **Onayla düzelecek (karar gerekmedi):** A1–A7 · B1 · B2 · B4 · B7 · B8 · B9 · B11 · D2 · D6.
- **K1 hat sonu (B3):** alt bantta GÜNLÜK GÖREV kartı; üçü bitince "Bugünkü görevleri tamamladın — yenileri yarın".
  Kat 2 gelince hat yeniden uzar.
- **K2 para (C1):** küsurat YOK, tam sayıya yuvarla; < 1 milyon TAM ve dile göre binlik ayraç (tr "6.042" ·
  en "6,042"); ≥ 1 milyon dile göre kısaltma, TEK ondalık (tr "1,2 Mn" · en "1.2M"). Tek biçimleyici, yerel ayardan.
- **K3 Sv 2-4 ekranı (B10):** ₺ EKLENMEZ (Sv 5 kapısı ölçülü, `zincir-raporu-t8a` Bulgu 8: ₺ ilk alımı 22 → 3 sn'ye
  indiriyordu). Ekran kazanılanı büyük gösterir + tek "Harika!" düğmesi; "İzle, 2×" yalnız ikiye katlanacak ₺ varken.
- **K4 Usta (B5):** pad gibi — ÜSTÜNDE DURUNCA dolar/açılır, yaklaşınca değil; kapatınca noktadan çıkıp yeniden basana kadar açılmaz.
- **K5 servis (B6):** masanın GÖVDESİNDEN ölç (her kenar/köşe eşit) — `tick.ts` → varyant kapısı: önce kısa+tam ölçüm.
- **K6 adlar (C2):** "Çaycı" (Karakter/Oyuncu yerine) · "Seviye" (İtibar yerine).
- **K7 günlük (D1):** hedef gün başında SABİTLENİR.
- **K8 yerdeki para (D4):** kapanırken otomatik toplanır. **K9 (C4):** "Bildirimler" anahtarı Faz F'ye kadar KALDIRILIR.
- **K10 (E):** A/B aracı düzeltilir (ortanca · etiket · §C sabit metni · "telefon öykünmesi"); T9a raporu ve D-145 sayısı −%21,2.
- **Sıra:** T9c mantık/kilit (A · D · K4 · K5 · K7 · K8 · K10) → T9d arayüz/metin (B · C · K1 · K2 · K3 · K6 · K9).
