# economy — Ekonomi Tasarımı

> ⚠️ GÜNCEL YÖN: Bu dokümandaki "çay fiyatı seviyeyle artar" yaklaşımı **D-010 ile değişti**.
> Yeni model (yükseltme = throughput/çay-dk, sıralı gating, hacim-tabanlı fiyat):
> **`docs/progression-and-economy-v2.md`**. Aşağısı tarihsel/temel referans olarak kalıyor.


> Tüm sayılar `src/config/economy.config.ts`'te (TEK kaynak). Bu doküman tasarımı ve
> formülleri açıklar; ince ayar `tools/simulate.ts` çıktısına bakılarak yapılır.

## 1. İki para birimi
- **₺ Para (yumuşak):** müşteriden kazanılır. Yükseltme L1-L4, istasyon, masa, pad.
- **💎 Elmas (sert):** nadir, değerli.
  - **Kaynaklar:** ödüllü video, IAP elmas paketi, nadir kilometre-taşı ödülleri.
  - **Harcama:** L5 "Usta" yükseltmeleri, zaman atlama ("8 saatlik gelir"), premium dekor,
    anında pad açma, offline tavanını uzatma.

## 2. Evrensel 5-seviye yükseltme deseni
Her istasyon / masa / çalışan aynı şablonu kullanır (`UpgradeSpec`):
```
cost_n   = floor(costBase * costGrowth^(n-1))      // n = 1..4, ₺ ile
çıktı(n) = outputMult^n                            // her ₺ seviye çıktıyı çarpar
L5       = "Usta seviye": masterDiamondCost 💎 VEYA 1 ödüllü video
çıktı(5) = outputMult^4 * masterOutputMult         // daha büyük sıçrama + görsel rozet
```
- L5, ilerleme için ASLA zorunlu değil; sadece güçlü bir hızlandırma + prestij rozeti.
- `upgradeCost()` ve `upgradeOutputMultiplier()` yardımcıları config'te.

## 3. Pad-tabanlı genişleme (Roblox-tycoon mantığı)
- Sahip karakteri pad üstünde beklerken cüzdandan pad'e ₺ **akar** (`fillRate` ₺/sn).
- Pad dolunca ilgili şey açılır (kalıcı kayıtlı).
- Pad türleri (faz boyunca): yeni çaydanlık yeri, semavere geçiş, yeni masa, yardımcı
  garson, okey salonu alanı, nargile terası. **Bazı premium pad'ler 💎 ile.**
- Faz 1: tek pad → 2. masa (`pads.table2`, cost 150, fillRate 40).

## 4. Para curve'ü ve tempo
- İstasyon/masa **maliyetleri** geometrik (×~1.15-1.6/adet duruma göre).
- İstasyon **AÇILIMLARI** lifetime-₺ eşiklerine bağlı (içerik tempolansın).
- **Hedef tempo:**
  - İlk 5-10 dk: her ~20-40 sn'de bir satın alma (sık dopamin).
  - Orta oyun: satın almalar dakikalar mertebesinde.
  - Geç oyun: oyuncuyu **prestige**'e yönelt.

## 5. Prestige — "Renovasyon"
```
İtibar = floor(repK * sqrt(lifetime₺ / repScale))
kalıcı gelir çarpanı = 1 + İtibar * incomeBonusPerRep
```
- Renovasyonda ₺, istasyon seviyeleri ve pad'ler **sıfırlanır**.
- **Kalan:** İtibar, elmasla alınan kalıcılar, premium dekor.
- Config: `prestige.repK=1`, `repScale=1e6`, `incomeBonusPerRep=0.02`.

## 6. Çevrimdışı (offline) gelir
```
offline₺ = gelirOranı * min(geçenSüre, tavan)
tavan = baseCapHours (taban 2 saat) [+ elmas/IAP ile diamondExtendHours]
```
- Dönüşte özetle gösterilir ("yokken X ₺ kazandın").

## 7. Simülasyon
`tools/simulate.ts` config'i okuyup curve'ü simüle eder ve her kilometre taşına
(ör. 2. masa, ilk L5, ilk prestige) **~ne kadar sürede** ulaşıldığını yazar. Dengeleme
buradaki çıktıya bakılarak config sayıları oynanarak yapılır.

Çalıştır: `npx tsx tools/simulate.ts` (veya `node --import tsx tools/simulate.ts`).

## 8. Faz 1 somut sayıları (başlangıç)
| Şey | Değer |
|---|---|
| Çay fiyatı (taban) | 5 ₺ |
| Demlenme/sipariş süresi | 6 sn |
| NPC spawn aralığı | 4 sn |
| NPC döngüsü | yürü 2 + sipariş 6 + iç/öde 4 sn |
| 2. masa pad maliyeti | 150 ₺ (fillRate 40 ₺/sn) |
| Çay yükseltme | costBase 25, growth 1.6, outputMult 1.35, L5=15💎 ×2.0 |
> Bu değerler simülasyon + oynanış testiyle ince ayarlanacak (decisions/progress'e not).
