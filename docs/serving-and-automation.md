# Servis & Otomasyon Tasarımı — manuel çay taşıma + garson kısmi otomasyon

> ÖNERİ / TASLAK (2026-06-06). Kullanıcı geri bildirimi sonrası servis döngüsünün yeniden
> tasarımı. **Bu doküman karar değil, öneridir; kullanıcı onayı bekliyor.** Onaylanınca
> D-011 "uygulandı"ya çekilir ve Faz 2c bu modele göre yapılır.
> Önceki plan ("garson çayı otomatik taşır") bunun yerini alır.

## 1. Sorun (kullanıcı feedback'i 2026-06-06)
1. **Şu an garson yokken bile çay otomatik servis ediliyor.** Oyuncu hiç çay taşımıyor —
   tutarsız ve oynanışsız. Oyuncu çayı kendi getirip götürmeli.
2. **Ama sürekli tek-tek taşımak istenmiyor.** "Çay tepsisi olur elimde… sürekli taşımamam
   gerek" → bir turda birden çok çay taşıyabilmeli.
3. **Para toplama + yükseltmeler oyuncuda kalmalı.** Mekânda yürümek çekirdek eğlence; çok
   şey otomatikleşirse "yürüyecek yer kalmaz" (oyuncunun yapacak işi kalmaz).
4. **Garson kısmi yardımcı olmalı.** Açılınca o da taşır ama yavaş; "o ana kadarki tüm
   ilerlemeyi tek başına taşıyabilmemeli" → garson mekânı tek başına döndüremez, oyuncu hâlâ aktif.

## 2. Araştırma özeti (kaynaklar §6)
- **Idle Restaurant Tycoon:** otomasyon **kademeli** — her operasyona garson/şef tutulur;
  "yeterli garson yoksa müşteriler aç kalır" = klasik **bottleneck baskısı**. Oyuncu personel
  sayısı ↔ maaş maliyeti dengeler. Otomasyon kârı çoğaltır, yokken bile çalışır.
- **Roblox tycoon (dropper→konveyör→collector):** erken oyunda **manuel** etkileşim/para
  toplama; otomasyon (auto-collect, ek dropper, konveyör hızı) **ilerlemeyle açılan** bir ödül.
  Çekirdek his: önce sen koştur, sonra otomatikleştir.
- **Çıkarım:** Manuel-önce, kademeli-otomasyon. Otomasyon oyuncuyu işsiz bırakmaz; **işi
  kaydırır** (servisi garsona devret → sen toplamaya/büyütmeye odaklan).

## 3. Önerilen model

### 3.1 İki elli aktif döngü (çekirdek)
Oyuncunun her zaman iki manuel işi var; oyun bunları dengelemekten doğar:
```
  [SERVİS]   ocak ready-kuyruğu → tepsiye al → masalara dağıt
  [TOPLAMA]  ödenen paralar yere düşer → yürüyüp topla
```
- Erken oyun: oyuncu **hem servis hem toplama** yapar (tek masa, kolay).
- Mekân büyüdükçe ikisini birden yetiştirmek zorlaşır → **garson** alıp servisi (kısmen)
  devreder, oyuncu toplama + yükseltmeye kayar. Böylece oyuncu ne işsiz kalır ne boğulur.

### 3.2 Ocak ready-kuyruğu (brewing = gerçek kapasite)
- Ocak, `brewTime`de bir çay demler ve tezgâhta **hazır çay** olarak biriktirir.
- **Kuyruk kapasitesi** var (ör. 3–5). Kuyruk doluysa ocak demlemeyi **durdurur** (israf yok ama
  üretim durur) → teslimat darboğaz olur. Kuyruk boşsa servis için **çay beklenir** → brewing darboğaz.
- Bu, D-010 §3.1'deki throughput zincirini **sahnede gerçek** kılar (şu an per-masa paralel
  demleme bottleneck'i görünmez kılıyordu).

### 3.3 Tepsi (manuel servis, ama toplu)
- Oyuncu ocağa gelir → tepsiye hazır çaylardan **N tane** alır (tepsi kapasitesi C).
- Oturan, çay bekleyen müşterilere yürür → tepsiden çay bırakır → müşteri içer → öder.
- **Tepsi kapasitesi upgradable** (C: 2 → 4 → 6…). Yüksek C = tur başına çok masa = az koşturma.
  "Sürekli tek-tek taşıma" sorununu çözer; yine de gidip-gelmek gerekir (oynanış korunur).

### 3.4 Sabır + bottleneck (çocuk-güvenli)
- Oturan müşterinin **sabır timer'ı** var. Zamanında çay gelmezse **sessizce kalkar gider**
  (kayıp = o gelir; sert ceza/öfke animasyonu yok → çocuk-güvenli).
- Bu baskı, "yeterince hızlı servis et" hedefini verir; darboğazı (masa/ocak/servis) yükseltmeye iter.

### 3.5 Garson = kısmi otomasyon (tam değil)
- Garson, oyuncuyla **aynı döngüyü** yapan özerk NPC: ocak→tepsi→masa→ocak.
- **Kasıtlı sınırlar** (tek başına her şeyi taşıyamasın):
  - Oyuncudan **yavaş** yürür ve/veya **küçük tepsi** taşır.
  - Tek garson, büyüyen mekânın servisinin yalnız bir kısmına yetişir → kalanı oyuncu kapatır.
  - **Ek/yükseltme garson** (gated) = daha çok otomasyon. Geç oyunda çok garson ≈ tam otomasyon,
    ama o noktada oyuncunun işi toplama + büyütme + prestige olur.
- Açılışı `requires` zincirine girer (ör. prev:['table3'] veya 'samovar' sonrası).

### 3.6 Para toplama kalıcı manuel (çekirdek korunur)
- Para toplama oyuncunun **kalıcı işi** — garson servisi devralsa bile oyuncu yürümeye devam eder.
- (Opsiyonel, Faz 4) yavaş/kısmi **otomatik toplayıcı** (prestige/ödüllü) düşünülebilir ama
  çekirdeği değiştirmez; erken-orta oyunda toplama tamamen elle (öneri).

## 4. Uygulama etkisi (onaylanırsa, Faz 2c)
- **NPC durum makinesi:** `ordering` (otomatik timer) → `waitingForTea` (servis bekler) + `drinking`.
- **Ocak:** `readyCups` kuyruğu (kapasite) + demleme timer'ı (kuyruk doluysa durur).
- **Oyuncu durumu:** `tray` (taşınan çay sayısı, kapasite C). Ocakta otomatik dol, masada bırak (yakınlık).
- **Garson:** basit FSM (ocak→en yakın bekleyen masa→bırak→dön), hız/tepsi parametreli; `hasWaiter` persist.
- **economy.config:** `tray` (kapasite + upgrade), `brew.queueCapacity`, `npc.patience`,
  `waiter` (hız, tepsi, requires). Hepsi data-driven; `simulate.ts` zinciri bu darboğazlarla güncellenir.
- **Kayıt:** yeni alanlar (trayLevel, hasWaiter…) → `saveVersion` artır + migrasyon.
- **Test:** servis döngüsü (tepsiyle teslim → ödeme), sabır-aşımı (servis yoksa müşteri gider),
  garson teslimi; smoke'ta görsel-durum kancaları (`__game().tray`, `readyCups`, `hasWaiter`).

## 5. Açık sorular (kullanıcıya)
1. **Sabır aşımı:** sessizce gitsin (öneri, çocuk-güvenli) mi, yoksa sadece daha az mı öder?
2. **Tepsi kapasite** başlangıç/eğri (2→4→6?) ve maliyet.
3. **Garson:** global havuz mu (her yere koşar) yoksa bölge-başı mı (okey salonu/teras ayrı)?
4. **Otomatik para toplayıcı** hiç gelsin mi? (Öneri: erken-orta oyunda HAYIR; en erken Faz 4 kısmi.)
5. **Ocak ready-kuyruğu kapasitesi** upgradable mı, sabit mi?

## 6. Kaynaklar
- Idle Restaurant Tycoon (Kolibri Games) — resmi site + CouchClicker/T4G rehberleri (otomasyon = kademeli personel; bottleneck baskısı)
- Roblox tycoon dropper/konveyör/collector kalıpları (Roblox DevForum, Buzzy.GG) — manuel-önce, otomasyon-ilerlemeyle
- (Bağlam) Idle Miner Tycoon yönetici/otomasyon dengesi — `docs/progression-and-economy-v2.md` §7
