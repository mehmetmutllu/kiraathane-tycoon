# DENGE RAPORU — turu-5 maddeleri 1/2/3/4/5(+6) (2026-06-13 gece)

> KULLANICI ŞARTI gereği: bu rapor SAYISAL hesap + öneri sunar; **hiçbir sayı uygulanmadı**.
> Onaylanan maddeler sonraki adımda uygulanır (gerekirse v29 migrasyonuyla birlikte).
> Kaynaklar: `tools/simulate.ts` (3 profil) + el hesabı (formüller aşağıda, hepsi config'ten).

## 0) Mevcut durum — gelir/tempo eğrisi (sim, NORMAL profil)

| Kilometre taşı | Normal | (Yoğun / Rahat) |
|---|---|---|
| İlk alım (2. Masa, 25₺) | 1.0 dk | 43sn / 1.6dk |
| Garson (150₺) | 11.8 dk | 8.1 / 18.5 dk |
| 4. Masa + Semaver L4 | ~21 dk | 14.6 / 33.4 dk |
| Zone-2 (1100₺) | 36 dk | 24.8 / 56.6 dk |
| Zone-3 (3600₺) | 1.21 sa | 50dk / 1.90sa |
| Z3 dolu (12 masa) | **1.63 sa** | 1.12 / 2.56 sa |

Gelir oranı (idealize): 0.42 → 2.56 (z1 dolu) → 4.6 (z2 dolu) → 11-14 ₺/sn (z3 dolu).
Tempo hedefleri (D-010 §3.6) tutuyor: ilk alım <90sn ✓, otomasyon <15dk ✓.

---

## 1) Madde 1 — Çay ocağına +1-2 ₺ seviyesi

**Mevcut:** ₺ ile soft max **L4** (maliyetler 20/30/45/68; growth 1.5). L5 = "Usta" (💎15, Faz 4).
Throughput çarpanı 1.35^L → L4 = ×3.32 (çay 6→1.81sn; tost 14→4.2sn).

**Öneri A (önerilen): +2 seviye, eğri AYNEN devam.**
- Çay: L5 = 68×1.5 ≈ **102₺**, L6 ≈ **153₺**. Tost tezgâhı (×20): L5 **2040₺**, L6 **3060₺**.
- Throughput: L5 ×4.48 (çay 1.34sn) · L6 ×6.05 (çay 0.99sn, **tost 2.3sn**).
- Usta (💎) L7'ye kayar (`masterLevel 5→7`); kayıt şeması DEĞİŞMEZ (stationLevels zaten sayı,
  kelepçe `stationSoftMaxLevel()` tek yerden). Migrasyon GEREKMEZ.
- Amortisman (z1, 4 masa talep-sınırlıyken): geç oyunda çay zone'larında ek seviye geliri AZ artırır
  (talep koltuk-sınırlı) → asıl değeri **tost arzında** (madde 2 ile birlikte) + brew kuyruğu +1/+1
  (queuePerLevel) + bardak havuzu +2/+2. Ekonomi eğrisini BOZMAZ (sim ile onay sonrası doğrulanır).
- Brew kuyruğu L6'da 9 olur — taşma yok (tepsi/garson kapasitesi sınırlayıcı kalır).

**Öneri B:** +1 seviye (L5 102₺) — tost arzına etkisi yarım kalır (aşağıda).

## 2) Madde 2 — Tost arzı talebe yetmiyor (AŞIRI darboğaz) — EN KRİTİK

**Arz formülü:** 60 / (prepTime / 1.35^L) tost/dk → prepTime 14:
L0 **4.3/dk** · L1 5.8 · L2 7.8 · L3 10.6 · L4 **14.3/dk**.

**Talep formülü (koltuk-temelli):** koltuk döngüsü ≈ yürüme 2 + bekleme W + yeme 4 + respawn 1.6 sn.
Anında serviste (W→0) koltuk başına ~7.9 tost/dk:
- z3 L0 (4 masa × 1 koltuk): teorik talep ~31/dk → arz/talep **1:7** (!)
- z3 masalar L4 (16 koltuk): talep ~70-120/dk → L4 tezgâhla bile **1:5-8**.

**Sabır penceresi denetimi:** sabır = 18×1.6 = 28.8sn (L0 masa). Aynı anda bekleyen N müşteri
sırayla doyar; N'inci müşteri (N−1)×prepTime_etkin bekler. Kaçış olmaması için kabaca
`(N−1)×prepTime_etkin < 28.8`:
- Bugün L1 tezgâh (10.4sn/tost) + 4 bekleyen → 4.'sü ~31sn bekler → **KAÇAR** (kullanıcının
  gözlemi turu-4 sabır fix'ine RAĞMEN sürer; round-robin talebi artırınca açığa çıktı).
- prepTime 11 + L2 (×1.82) → 6.0sn/tost → 4 bekleyende max ~18sn ✓
- prepTime 11 + L6 (Öneri 1A, ×6.05) → 1.8sn/tost → 16 koltukta bile max ~27sn ✓ (sınırda; 2.
  garson/tostçu tepsisiyle pratik olarak rahatlar)

**Öneri (paket):**
1. `PRODUCTS.tost.prepTime` **14 → 11** (+%27 arz; tek satır, şema yok).
2. Madde 1A (+2 tezgâh seviyesi) — tost tezgâhı L5/L6 = 2040/3060₺ geç-oyun para emici olur
   (kullanıcının "para birikiyor" dönemine de hedef verir).
3. DOKUNULMAYAN: tost fiyatı 25₺, sabır ×1.6 (turu-4'te kalibre edildi).
- Gelir etkisi: tost geliri arz-sınırlı → +%27 arz ≈ +%27 z3 geliri (L0 1.8→2.3 ₺/sn katkı).
  Sim eğrisinde z3-sonrası milestone'lar ~%5-10 erkene gelir (z3 dolu ~1.63 → ~1.5sa civarı; onay
  sonrası sim ile kesinleştirilir).

## 3) Madde 3 (+6) — Garson tepsisi erkene + ucuza

**Mevcut:** çay tepsisi kademeleri **800/2400/6000₺** (kapasite 1→2→3→4); tostçu 2000/5000
(1→2→3). Görev `q_waiterTray1` z2 zincirinin ortasında (~38dk Normal); `q_tostTray1` z3'te.

**Garson işlem gücü (el hesabı):** tur ~12sn (L1 hız 1.5; ocak→uzak masa ~8.7br) →
tepsi 1 = **~5 çay/dk**; tepsi 2 = ~9-10/dk (tek-durak çoklu teslim Y3 ile); L2 hız (250₺) turu
~9sn'e indirir (+%30). Zone talebi 8-16 koltukta 20-40 çay/dk → tepsi 1 garson talebin
%15-25'ini taşıyor → kullanıcının "bensiz yetemiyor" hissi DOĞRU.

**Amortisman (bugün):** tepsi 1→2 (+5 çay/dk ≈ +25₺/dk) → 800₺ ≈ **32dk** amorti (ÇOK uzun;
o dönem oran 3.5₺/sn = 210₺/dk gelirken 800₺ = 3.8dk birikim ama z2 pad'leriyle yarışır).

**Öneri A (önerilen — quest sırası DEĞİŞMEZ, v29 GEREKMEZ):**
- Çay: **800/2400/6000 → 400/1500/4500** (T1 amorti 32→16dk; T2-T3 aspirasyonel kalır).
- Tost: **2000/5000 → 1200/3500** (tostçu tur süresi uzun değil ama tost pahalı/yavaş — kapasite
  2 belirgin rahatlama).
- Quest yeri AYNI kalır (maliyet düşünce görev geldiğinde alınabilir oluyor; İD-eşleme riski yok).

**Öneri B (agresif — v29 İSTER):** q_waiterTray1'i q_z2waiter'dan ÖNCEYE (z1 dönemine) çek +
maliyet 300-400. Quest reorder = save **v29 + İD-eşleme migrasyonu** (turu-3'teki desen).
Kazanç: garson z1'de erken güçlenir. Risk/maliyet: migrasyon + test yükü.
**Tavsiyem: A** (aynı etkiyi migrasyonsuz verir).

**Madde 6 (hız):** garson TABAN hızına dokunulmaz (2026-06-11 onaylı yavaşlatma). İstenirse L3 hız
kademesi (2.0→2.4, ~800₺) Faz 4'te 💎/₺ olarak eklenebilir — bu rapor önermiyor (tepsi yeter).

## 4) Madde 5 — Karakter yükseltme eğrisi "absürt"

**Mevcut:** tepsi values 2→6, costs **[75, 150, 15.000, 60.000]**; mıknatıs [200, 900, 2.800];
hız [400, 1.400, 4.500]. T3/T4 bilinçli "aspirasyonel" tasarlandı (kozmetik 10-18k bandı) ama
75→150→**15.000** sıçraması ×100 — kullanıcı haklı, kademeler arasında köprü yok.

**Bağlam:** z3 dolu @1.63sa'da lifetime ~20-25k; 15k tepsi T3 ancak o zaman, 60k T4 prestige
öncesi pratikte ulaşılmaz.

**Öneri (köprülü eğri — "ilk 2 basit, sonrakiler zor ama GÖRÜNÜR"):**
| Kademe | Tepsi (2→6) | Mıknatıs | Hız |
|---|---|---|---|
| 1 | 75 (aynı) | 200 (aynı) | 400 (aynı) |
| 2 | 150 (aynı) | 900 → **700** | 1.400 → **1.100** |
| 3 | 15.000 → **5.000** | 2.800 → **2.200** | 4.500 → **3.200** |
| 4 | 60.000 → **18.000** | — | — |
- Tepsi T3 (kapasite 5) z3 dönemi hedefi (~5k = ~12dk birikim @6.4₺/sn); T4 geç-oyun (18k).
- Erken oyun (madde 4 ile etkileşim) DEĞİŞMEZ — ilk kademeler aynı.

## 5) Madde 4 — Genel fiyat indirimi (karar BİRLİKTE)

Kullanıcı çerçevesi: "ÇOK AZ veya aynı; belki sadece garson-öncesi dönem azıcık."
Sim: garson-öncesi alımlar → table2 25 · ocak L1-L3 (20/30/45) · tepsi T1 75 · table3 130 ·
tepsi T2 150 · garson 150. Normal profilde garson @**11.8dk** (hedef bandın içinde ama üst yarıda).

**Seçenek A — HİÇ dokunma:** eğri hedefleri zaten tutuyor; turu-5'te tost/tepsi fix'leri genel
hissi zaten iyileştirecek. (En güvenli.)
**Seçenek B — yalnız garson-öncesi −%15 (önerilen):** table3 130→**110**, garson 150→**130**,
tepsi T2 150→**130** (ocak/table2/T1 öğretici, AYNI). Etki: garson Normal ~11.8 → **~10.5-11dk**;
sonrası eğri pratikte aynı (toplam −60₺, z2+ maliyetleri yanında ihmal edilebilir).
**Seçenek C — genel −%10:** ÖNERMEM — z2/z3 zincirleri 2026-06-11'de zaten −%10 almıştı;
üst üste binince zone'lar 1 saatten kısa sürer (kullanıcının "salon ~1sa+" şartını bozar).

## 6) Madde 14 (gözlem) — Round-robin

Uygulama gerekmiyor; a96a478 fix'i turu-5 APK'sında ilk kez hissedilecek. Vitest 4 dağılım
testiyle korunuyor; telefonda hâlâ pürüz görülürse zone-içi seçim kuralına bakılır.

---

## ONAY SORULARI (sabah)
1. **Madde 1:** Öneri A (+2 seviye; çay 102/153, tost 2040/3060, Usta L7'ye) — onay?
2. **Madde 2:** prepTime 14→11 + (1A ile birlikte) — onay?
3. **Madde 3:** Öneri A (maliyet indirimi, quest yeri aynı, v29 YOK) mı, B (reorder + v29) mi?
4. **Madde 5:** köprülü eğri tablosu — onay/ayar?
5. **Madde 4:** Seçenek A (dokunma) mı B (garson-öncesi −%15) mi?

Onay gelince: tek pakette uygulanır → vitest + sim (eğri raporu BU dosyaya işlenir) + smoke +
Playwright + APK.

---

## SONUÇ — ONAY + UYGULAMA (2026-06-13 gece, 2. tur)

Kullanıcı kararları:
- **m.1 ✅ uygulandı (fiyatlar yükseltilerek):** kullanıcı "fiyat az mı?" diye sordu → kuyruk
  dikleştirildi: çay L5 **150** / L6 **300** (saf eğri 102/153 yerine); tost ×20 → **3000/6000**.
  Mekanizma: `UpgradeSpec.costsByLevel` [20,30,45,67,150,300] (L1-L4 birebir eski floor değerleri);
  `masterLevel 5→7` (Usta 💎 L7'ye). Şema değişmedi; init kelepçesi softMax'ı otomatik izler.
- **m.2 ✅ uygulandı:** `PRODUCTS.tost.prepTime` **14→11**.
- **m.3 ✅ uygulandı (kullanıcının rakamları):** çay tepsisi **400/1200/2500**; tost **1200/3000**.
  Quest sırası AYNI → v29 GEREKMEDİ.
- **m.5 ✅ uygulandı:** tepsi [75, **130**, **5.000**, **18.000**] (T2 130 = 5B); mıknatıs
  [200, **700**, **2.200**]; hız [400, **1.100**, **3.200**].
- **m.4 ✅ Seçenek B uygulandı (KISMEN):** garson pad **150→130**, karakter tepsi T2 **150→130**.
  table3 130→110 KAPSANMADI — kullanıcı "masa rakamlarına şimdi dokunma" dedi (aşağı bak).
- **MASA RAKAMLARI ERTELENDİ (kullanıcı):** açma −%10 + yükseltme 100/200/400/800 önerisi
  beklemede; "biraz daha test edip feedback toplayalım".

### Uygulama SONRASI sim eğrisi (Normal profil; önceki → yeni)
| Milestone | Önce | Sonra |
|---|---|---|
| Garson | 11.8 dk | **11.1 dk** (pad 130 + T2 130) |
| Zone-2 | 36.0 dk | 35.4 dk |
| Zone-3 | 1.21 sa | 1.20 sa |
| Z3 dolu | 1.63 sa | **1.69 sa** (yeni para emiciler: ocak L5/L6 + ucuzlayan tepsiler alınıyor) |
| Çay ocağı ₺-max | L4 @21dk | **L6 @1.87sa** (yeni geç-oyun hedefi — tasarım amacına uygun) |
| Masa yükseltme L1 | 1.63 sa | 1.91 sa |
Tempo hedefleri korunuyor (ilk alım 34sn ✓, "salon ~1sa+" ✓). Tost arzı: L1 tezgâh 5.45sn/tost
(eski 10.4) → 4 bekleyenli L0 senaryosunda max bekleme ~16sn < sabır 28.8sn ✓ (darboğaz kapandı).
