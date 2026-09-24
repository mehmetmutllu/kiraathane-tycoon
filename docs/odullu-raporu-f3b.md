# F3b — ÖDÜLLÜ VİDEONUN ÖDÜLÜ raporu

**Tur:** F3 tur 2 / F3b · Faz F · 2026-09-24
**Araç:** `tools/olcum-odullu-f3b.ts` · **Ham çıktı (TAM koşu):** `docs/olcum-odullu-f3b.txt`
**Sim kancası:** `HedefDurum.padsDone` eklendi (isteğe bağlı, okumayan kollar birebir aynı).

> **Bu rapor commit #1'de KARAR BÖLÜMÜ BOŞ olarak yayımlanır** (D-084 sıra kilidi).

---

## SORU

F3 altyapısı kuruldu (D-149), ödüllü düğmeler pasif. Beş yüzey bir ödül bekliyor ve her biri
`economy.config.ts`e bir sayı yazar → **varyant kapısı**:

1. Ödül ekranındaki **"İzle, 2× al"**. Dört ekranda çıkıyor: seviye ₺ · çevrimdışı ₺ · günlük görev 💎 · hedef (💎 + kalıcı gelir).
2. Usta ekranındaki **"İzle"**. Kaç video bir Usta eder, günde kaç kez?
3. **G-57 video hakkı** (kullanıcı taslağı: *"2 saatte 1 4 video hakkı … her videoda 1 elmas veya 200 para … seviye arttıkça artar"*).

## KAPSAM DAMGASI

- **§1 sim ÜST SINIRDIR:** oyuncu her fırsatta izliyor, dolum %100, ödül düştüğü an cüzdanda.
  Gerçek oyuncu daha az izler; üst sınır küçükse kol güvenle geçer.
- **§2 çevrimdışı defteri:** sim yokluğu oynamaz. Taban koşusunun Normal profilinden 5 dk'da bir örnek
  alındı, oyunun **kendi** `computeOfflineEarned`i o örnekte koşturuldu (67 örnek).
- **§3 elmas defteri gün ölçeğinde** (D7 §5'in yöntemi). Kozmetikler aynı 💎 havuzunu paylaşır ama
  sayılmadı; yani günler **alt sınırdır**.

---

## BULGULAR

### §1 — ₺ kolları: tek başına hiçbiri eşiği geçmiyor, hepsi birlikte geçiyor

Taban **5,58 sa**: T8a'nın final sayısıyla aynı (D-142). Açılış üçlüsü (22 sn · 1,6 dk · 5,2 dk) hiçbir
kolda bozulmuyor, HÜKÜM hep 0.

| kol | ne | Kat 1 | dKat1 | en uzun bekleme (Normal) | ödenen |
|---|---|---|---|---|---|
| T0 | reklam yok | 5,58 sa | — | 30,5 dk | seviye ₺2.405 |
| **S2** | seviye ₺ 2× | 5,45 | **−%2,3** | 30,5 | seviye ₺5.012 |
| **H2** | hedefin kalıcı gelir payı 2× | 5,37 | **−%3,9** | 29,0 | — |
| V60 | G-57: 2 sa'te 4 video × son 60 sn'nin ₺'si | 5,45 | −%2,3 | 30,5 | video ₺2.336 (8) |
| V200 | G-57: 2 sa'te 4 video × 200 ₺ sabit | 5,48 | −%1,8 | 30,5 | video ₺1.600 (8) |
| V120 | G-57: 2 sa'te 4 video × son 120 sn | 5,34 | −%4,4 | 30,5 | video ₺4.856 (8) |
| **SV** | en çok izleyen: S2 + H2 + V60 | 5,14 | **−%8,0** | 29,0 | ₺2.233 + ₺3.151 |
| **SV2** | hedef ekranında düğme YOK: S2 + V60 *(commit #1b)* | 5,33 | **−%4,5** | 30,5 | ₺4.964 + ₺2.358 |

- Eleme eşiği %7 (D1/D-090). **Tek kolların hepsi altında**, hepsi birden (SV) **−%8,0** ile üstünde.
  Bu sayı üst sınır: oyuncu her seviyede, her hedefte ve her 2 saatte 4 video izliyor.
  Eşiği aşan H2: hedef ekranı çıkınca (SV2) toplam **−%4,5**'e iniyor.
- **V200 (sabit 200 ₺) geç oyunda eriyor:** 8 video toplam ₺1.600. Aynı 8 video oranlı V60'ta ₺2.336
  ediyor ve bu fark oyun ilerledikçe açılıyor. Taslağın kendi *"seviye arttıkça o da artar"* sezgisi
  sayıyla doğrulandı: ödül **oranlı** olmalı.
- **20 dk'yı aşan tek alım** her kolda aynı: **servis L6** (30,5 dk). Ödüllü video bu duvarı indirmiyor,
  en fazla 1,5 dk kısaltıyor (H2).

### §2 — Çevrimdışı 2×: tavan 1 saatlik dönüşte %100 bağlıyor

Oyunun kuralı: çevrimdışı ödül sıradaki omurga pad'in **1,15 katını** aşamaz (*"alan açılır ama içi bitmez"*).

| kol | yokluk | ödül / sıradaki pad (medyan) | sıradaki pad'i tek başına alır | iki pad eder | tavanda |
|---|---|---|---|---|---|
| O0 reklam yok | 20 dk | 1,15 | %36 | %0 | %36 |
| O1 2× tavandan SONRA | 20 dk | **2,30** | %78 | **%36** | %36 |
| O2 2× tavandan ÖNCE | 20 dk | 1,15 | %78 | %0 | %36 |
| O0 | 60 dk | 1,15 | %100 | %0 | **%100** |
| O1 | 60 dk | **2,30** | %100 | **%100** | %100 |
| O2 | 60 dk | 1,15 | %100 | %0 | %100 |

- **O1** tavanı delip ikiye katlıyor: 1 saatlik her dönüşte oyuncu **iki pad** alır. Kullanıcı kuralı
  (*"alanı tek girişte bitirmesin"*) kırılıyor.
- **O2** tavana saygılı ama 1 saatlik dönüşlerin **%100'ünde hiçbir şey eklemiyor**: tavan zaten
  bağlı. Düğme "2× al" deyip 1× verir; bu, T9d'nin kapattığı "boş vaat" (D-148 K3) ile aynı kusur.
  O2 yalnız kısa yokluklarda işe yarıyor: 20 dk'lık dönüşte sıradaki pad'i alabilme oranı %36'dan %78'e çıkıyor.

### §3 — Elmas: hedef 💎 2× Usta katmanını ilk gün bitiriyor

Usta bugün yalnız masada: **20 hedef · 25 💎 · günlük 10 💎 · hedeflerden toplam 250 💎.**

| kol | ne | peşin | kuyruk | Usta/gün | kuyruk biter | gün/Usta |
|---|---|---|---|---|---|---|
| **E0** | reklam yok | 10 | 10 | 0,40 | 25,0 gün | **2,50** |
| Eg2 | günlük görev 💎 2× | 10 | 10 | 0,80 | 12,5 gün | 1,25 |
| **Eh2** | hedef 💎 2× | **20** | **0** | — | **0 gün** | — |
| Egh2 | günlük + hedef 2× | 20 | 0 | — | 0 gün | — |
| U1 | Usta "İzle": 1 video = 1 Usta, günde 1 | 10 | 10 | 1,40 | 7,1 gün | 0,71 |
| U3 | … günde 3 | 10 | 10 | 3,40 | 2,9 gün | 0,29 |
| U∞ | … sınırsız | 10 | 10 | ∞ | 1 gün | 0,10 |
| Ug1 | G-57 💎: 4 video × 1 💎, günde 1 oturum | 10 | 10 | 0,56 | 17,9 gün | 1,79 |
| Ug2 | … günde 2 oturum | 10 | 10 | 0,72 | 13,9 gün | 1,39 |
| IAP | kıyas: Reklamları Kaldır (+10 💎/gün, D-040) | 10 | 10 | 0,80 | 12,5 gün | 1,25 |

- **Eh2 kuyruğu yok ediyor:** hedeflerin 250 💎'ı 500 olunca 20 Usta'nın 20'si peşin alınıyor. D-093'ün
  "10 peşin / kuyrukta bekleyen" yapısı kalmıyor. Hedef ekranında 💎'ı katlayan bir düğme bu katmanı bitirir.
- **Eg2 = IAP:** her gün izleyen oyuncu, "Reklamları Kaldır" alan oyuncuyla aynı hızda Usta alıyor
  (1,25 gün/Usta). D-040'ın *"IAP sahibi ~1,5 günde"* vaadiyle uyumlu.
- **U∞ kuyruğu bir günde bitiriyor.** Usta'yı reklamla açmanın tek sağlıklı hâli **günlük sınırlı**
  olanıdır. U1 izleyeni tabanın 3,5 katı hızlandırıyor (2,50 → 0,71 gün/Usta).

---

## KOLLAR (karar paketi için)

| soru | kollar |
|---|---|
| ① "İzle, 2× al" neyi katlar | seviye ₺ (S2) · çevrimdışı (O1 / O2 / düğme yok) · günlük 💎 (Eg2) · hedef (Eh2 + H2 / düğme yok) |
| ② Usta "İzle" | U1 · U3 · düğme kalkar |
| ③ G-57 video hakkı | V60 (oranlı ₺) · V200 (sabit) · Ug (💎) · şimdilik yok |

---

## KARAR

_(BOŞ — karar paketi sunulduktan sonra doldurulur · D-084 sıra kilidi)_

---

## UYGULAMA

_(BOŞ)_
