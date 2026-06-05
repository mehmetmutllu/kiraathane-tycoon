# Progression & Ekonomi v2 — Tasarım Raporu

> Kullanıcı geri bildirimi (2026-06-05) sonrası ekonomi/ilerleme sisteminin yeniden
> tasarımı. **Bu doküman karar/plandır; implementasyon sonraki oturum(lar)da.**
> Önceki ad-hoc model (yükseltme = çay fiyatı çarpanı, gating yok) terk ediliyor.

## 1. Tespit edilen sorunlar (kullanıcı feedback'i)
1. **Pad numaralandırma/sıra kafa karıştırıcı:** "3. masa pad'inin üstünde durunca 4. masa
   geldi." Pad'ler bir slota bağlı ama sıra/önkoşul yok; rastgele hissi veriyor.
2. **Yükseltme yanlış şeyi etkiliyor:** Çay ocağı seviyesi **çay FİYATINI** artırıyor —
   gerçekçi değil. Doğrusu: seviye **servis edilen çay ADEDİNİ (throughput)** artırmalı.
3. **Sistem yok:** "Kör topal gidemeyiz" — net bir **yükseltme örüntüsü**, **fiyat
   politikası** ve **sıralı kilit (gating)** sistemi gerekli.
4. **Pad yerleşim kuralı net değil:** Yükseltme, yükselttiği şeyin **yanında**; yeni bir
   şey açan pad, **açılacak yerin** konumunda olmalı. Ve hepsi bir **sıraya** bağlı olmalı.

## 2. Araştırma özeti (kaynaklar §7)
- **Maliyet eğrisi:** `maliyet_n = taban × r^n`, r ≈ **1.07–1.15** (Clicker Heroes 1.07,
  AdVenture Capitalist işletmeleri 1.07–1.15). Bu aralık "dengeli/tatmin edici" kabul ediliyor.
- **Throughput zinciri dengesi (Idle Miner Tycoon):** üretim → taşıma → depo aynı kapasitede
  olmalı; **darboğaz = israf** (toplanmayan/bekleyen para boşa gider). Oyuncunun işi
  kapasiteleri **dengelemek**. Her yükseltme üretim HIZINI artırır; **kilometre-taşı
  step-fonksiyonları** (ör. 25./50. birimde ×2/×4 hız).
- **Restoran/kafe idle:** çekirdek denge = **oturma kapasitesi (masa) ↔ pişirme hızı (ocak)
  ↔ servis (garson) ↔ müşteri akışı**. "Müşteriyi çok bekletme" temel ilke; darboğaz olursa
  gelir düşer. Garson sabrı/elde tutmayı yönetir.
- **Tempo:** ilk **90 sn** içinde bir şey alınabilmeli; ilk **15 dk** tüm oturumun temposunu
  belirler; ilk **1 saatte** otomasyon açılmalı; erken oyunda **bileşik hız > çeşitlilik**.
- **Gating/önkoşul:** tech-tree düğümleri **önkoşullara** bağlı (Computer Tycoon); sıralı
  içerik kilidi; yeni içerik prestige katmanları arkasına kilitlenir; tek görünür prestige sayfası.

## 3. Önerilen sistem

### 3.1 Throughput zinciri (çekirdek model)
Gelir, dört kapasitenin **en küçüğüne (darboğaz)** bağlı — Idle Miner mantığı:

```
talep (müşteri/dk)  →  oturma (masa kapasitesi)  →  pişirme (ocak: çay/dk)  →  servis (garson)
gelir/dk ≈ min(talep, oturma_kapasitesi, pişirme_kapasitesi, servis_kapasitesi) × çay_fiyatı
```

- **Çay Ocağı (pişirme):** seviye ↑ → **çay/dk** ↑ (FİYAT DEĞİL). Birden çok ocak kapasiteyi toplar.
- **Masalar (oturma):** masa ↑ → aynı anda ağırlanan müşteri ↑.
- **Garson (servis):** çayı ocaktan masaya taşır. Garson yokken **sahip** taşır (yavaş, manuel);
  garson varken otomatik (hızlı). Garson seviyesi servis hızını artırır.
- **Talep (müşteri akışı):** müşteriler bir hızda gelir; yer doluysa kısa süre bekler/gider.
  İleride tabela/itibar/ödüllü-video ile artırılır.

> Tasarım dersi: oyuncu kapasiteleri **dengelemeli**. Sadece ocağı yükseltirse masalar
> dolar, çaylar birikir → israf. Bu, satın alma kararlarını anlamlı kılar.

### 3.2 Fiyat politikası
- **Çay fiyatı sabit taban** (ör. 5 ₺). Yükseltmeler fiyatı DEĞİL **hacmi** büyütür.
- Fiyat artışı yalnızca: (a) prestige kalıcı çarpanı, (b) çok sonradan opsiyonel "kalite/menü"
  yükseltmesi (ayrı, yavaş bir kol). Erken-orta oyunun motoru **hacim/throughput**.

### 3.3 Evrensel yükseltme örüntüsü (her upgradable şeye)
```
maliyet_n = floor(taban × r^(n-1))           // r ≈ 1.12 (1.07–1.15 arası)
etki(n)   = taban_kapasite × kapasiteÇarpanı^n   // ÇIKTI = throughput (çay/dk, oturma, servis)
L5 (Usta) = 💎 ya da ödüllü video             // büyük sıçrama + rozet (Faz 4)
step bonus: her K. seviyede ekstra ×          // Idle Miner kilometre-taşı (ör. L5/L10'da ×2)
```
- Her "şey"in (ocak, masa grubu, garson) kendi `UpgradeSpec`'i; etki **kendi kapasitesine**.
- `economy.config.ts` tek kaynak; `tools/simulate.ts` bottleneck'i ve tempoyu simüle eder.

### 3.4 Gating / önkoşul sistemi (sıra)
Her açılış/yükseltme bir **önkoşul** taşır; karşılanmadan pad/zone **görünmez/aktif olmaz**:
```ts
requires?: {
  padsDone?: string[];     // belirli açılışlar tamamlanmış olmalı
  minTables?: number;      // en az N masa
  minStationLevel?: number;
  minLifetime?: number;    // toplam kazanılan ₺ eşiği (tempo)
}
```
Örnek sıralı zincir (illüstratif, simülasyonla ayarlanacak):
1. Başlangıç: 1 masa, ocak L1. (İlk 90 sn'de ilk alım hedefi.)
2. **2. Masa** (lifetime ≥ ~120 ₺).
3. **Ocak L2** (requires: tables ≥ 2) — önce oturma, sonra pişirme dengelensin.
4. **3. Masa** (requires: stationLevel ≥ 2).
5. **Garson** (requires: tables ≥ 3) — otomasyon ~ilk 10-15 dk.
6. **2. Ocak / Semaver** (requires: garson açık) ...
> Kural: bir şey diğeri olmadan açılamaz; oyuncu hep "mantıklı sıradaki adımı" görür.

### 3.5 Pad/zone yerleştirme kuralı (formalize)
- **Yükseltme zone'u** (var olan şeyi iyileştirir): o şeyin **yanında** durur (ör. ocak
  yükseltmesi ocağın önünde; masa yükseltmesi o masanın yanında).
- **Açılış pad'i** (yeni şey yaratır): yeni şeyin **belireceği boş alanda** durur; tamamlanınca
  obje **tam orada** inşa olur, pad kaybolur, sıradaki önkoşulu karşılanan pad görünür.
- Her pad **tek bir slota/objeye** bağlı (off-by-one yok): "3. masanın pad'i → 3. masa", "4.
  masanın pad'i → 4. masa". Sıra `requires` ile garanti.

### 3.6 Tempo hedefleri (denetim listesi)
- İlk satın alma **< 90 sn**. İlk 5-10 dk her ~20-40 sn bir alım. Otomasyon (garson) **< 15 dk**.
- Orta oyun: alımlar dakikalar. Geç oyun: **prestige**'e yönlendir.
- `tools/simulate.ts` her kilometre taşına süreyi raporlasın; hedeften sapma = config ayarı.

## 4. Mevcut koddan ne değişecek (sonraki oturum planı)
1. `economy.config`: çay fiyatını seviyeden ayır; **station = brewRate (çay/dk)** yap;
   her upgradable için `UpgradeSpec` + `requires`. Pad/zone'lara `requires` ekle.
2. `store`: gelir modelini **throughput/bottleneck** üzerinden hesapla (anlık ve offline).
   Müşteri spawn'ını talep/kapasiteye bağla. `stationLevel` etkisini fiyattan brewRate'e taşı.
3. Gating: `currentPad`/zone görünürlüğünü `requires` ile filtrele; HUD "sıradaki adım" göstersin.
4. Pad konumları: her pad kendi slotunda; upgrade zone ilgili objenin yanında.
5. `simulate.ts`: bottleneck modeline güncelle; tempo raporu.
6. Testler (Vitest + smoke) güncelle; sonra **Faz 2c — garson**.

## 5. Açık tasarım soruları (kullanıcıya)
- Çay fiyatı tamamen sabit mi kalsın, yoksa ayrı bir "kalite/menü" koluyla mı artsın (geç oyun)?
- Talep (müşteri akışı) baştan kapasiteye eşit mi gelsin, yoksa ayrı "tabela/itibar" koluyla mı artsın?
- Gating eşikleri: lifetime-₺ mi (otomatik tempo) yoksa "önceki şey alındı" mı (net sıra) — yoksa ikisi?

## 6. Skill / araç önerileri
Kurulu bundled skill'ler (ek kurulum gerekmez, gerektiğinde çağrılır):
- **e2e** / **playwright-cli** + Playwright MCP (eklendi): UI/duman testleri, görsel regresyon (@visual).
- **frontend:react-patterns**: sahne büyüdükçe re-render/performans (şu an her kare re-render var).
- **impeccable** / **frontend-design** / **emil-design-eng**: HUD/juice cilası (Faz 6).
- **simplify**: değişen kodu sadeleştirme/kalite. **security-audit**: Faz 5 monetizasyon.
- **graphify**: önkoşul/yükseltme ağacını (tech-tree) görselleştirmek için opsiyonel.
> Oyun-dengesi için ayrı bir skill yok; kendi `tools/simulate.ts`'imizi genişleteceğiz.
> Yeni harici plugin şimdilik gerekmiyor; ihtiyaç olursa /plugin marketplace'ten kurulur.

## 7. Kaynaklar
- The Math of Idle Games (Anthony Pecorella, Kongregate/GDC)
- Numbers Getting Bigger: Design & Math of Incremental Games (Envato Tuts+)
- AdVenture Capitalist analizi (GameTalk/Medium)
- Idle Miner Tycoon Wiki — Mining Strategies / Managers (Fandom)
- Roblox Tycoon Games 2026: Builds, Loops, Economies (Gaming Endsights)
- Computer Tycoon — Research/Tech Tree (Fandom)
- Idle Game Design Principles (Eric Guan)
