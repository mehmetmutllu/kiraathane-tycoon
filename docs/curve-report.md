# Curve Raporu — 3 Profil + Zone-2 Geçiş Temposu (gece 5/7, 2026-06-10)

> **SABAH ONAYINA.** Bu rapor HİÇBİR denge değişikliği uygulamaz; sayılar mevcut config'le
> `npx tsx tools/simulate.ts` çıktısıdır (sim zone'lu bottleneck modeline genişletildi —
> per-zone ocak arzı + 3-profil verim parametresi; denge sayılarına DOKUNULMADI).

## Model ve profiller
Gelir = Σ_zone min(talep, arz) × (5₺ + bahşiş) × **VERİM**.
- Talep_z = zone masaları / döngü; arz_z = 1 / demleme (per-zone ocak, D-022).
- **VERİM** = idealize tavanın oyuncu tarafından gerçeklenen payı (manuel servis kaçakları,
  yürüme, bulaşık, sabır kaçırma):
  - **Yoğun 0.80** — sürekli aktif, rota optimize, garson/bulaşıkçı destekli.
  - **Normal 0.55** — telefon oyuncusu ortalaması; ara ara bakar, sabır kaçırır.
  - **Rahat 0.35** — seyrek oturumlar; idle ağırlıklı his.

## Milestone tablosu (mevcut sayılarla)
| Milestone | İdealize | Yoğun | Normal | Rahat |
|---|---|---|---|---|
| İlk satın alma (2. Masa) | 1.0 dk ✓(<90sn) | 1.3 dk | 1.8 dk | 2.9 dk |
| Çay ocağı L1 | 1.4 dk | 1.8 dk | 2.6 dk | 4.0 dk |
| 3. Masa | 3.7 dk | 4.6 dk | 6.7 dk | 10.5 dk |
| Garson | 6.0 dk | 7.5 dk | 10.9 dk | 17.2 dk |
| Bulaşıkçı | 9.1 dk | 11.4 dk | 16.6 dk | 26.0 dk |
| 4. Masa (zone-1 dolu) | 13.1 dk | 16.3 dk | 23.7 dk | 37.3 dk |
| Ocak L4 (semaver) | 13.6 dk | 17.0 dk | 24.7 dk | 38.8 dk |
| **ZONE-2 AÇILDI (₺1200)** | **21.4 dk** | **26.8 dk** | **38.9 dk** | **1.02 sa** |
| Z2: 2. Masa | 22.8 dk | 28.5 dk | 41.5 dk | 1.09 sa |
| Z2: Garson | 24.8 dk | 31.0 dk | 45.1 dk | 1.18 sa |
| Z2: Bulaşıkçı | 31.0 dk | 38.8 dk | 56.4 dk | 1.48 sa |
| Z2: 4. Masa (zone-2 dolu) | 35.3 dk | 44.1 dk | 1.07 sa | 1.68 sa |
| Masa yükseltme L1 | 37.1 dk | 46.3 dk | 1.12 sa | 1.76 sa |
| lifetime 10k ₺ | 43.9 dk | 54.9 dk | 1.33 sa | 2.09 sa |

## Değerlendirme
1. **Öğretici/erken oyun hedefte:** ilk alım <90sn her profilde sağlam; zincir Normal'de
   ~2-7dk aralıklarla akıyor (D-010 §3.6 ruhu ✓).
2. **Zone-1 ömrü hedefin ALTINDA:** kullanıcı hedefi "zone ~1sa+ aktif oyunda bitsin".
   Normal profilde zone-1 tamamı (semaver dahil) ~25dk, zone-2 kapısı ~39dk. Yoğun'da 27dk.
   → Zone-1 → zone-2 geçişi bugünkü ₺1200 ile HIZLI.
3. **Zone-2 içi tempo düz:** zone-2 zinciri (3150₺) Normal'de ~25dk — zone-1 ile aynı; oysa
   ilerleyen içerik biraz DAHA uzun soluklu olmalı (derinleşen eğri hissi).
4. **Offline riski (Faz 4 notu):** zone-2 sonu oran ~11 ₺/sn → offline (0.5 × 1sa cap) tek
   girişte ~20k birikebilir; ileride zone-3 fiyatı buna göre konmalı ya da offline kademesi
   gözden geçirilmeli (şimdilik zone-3 yok — acil değil).

## ÖNERİLER (onaysız uygulanmaz)
| # | Değişiklik | Şimdi | Öneri | Etki (Normal) |
|---|---|---|---|---|
| Ö1 | `zone2.cost` | 1200 | **2000** | zone-2 kapısı 39dk → ~50dk (hedef ~1sa'ya yaklaşır) |
| Ö2 | z2 zinciri maliyetleri ×1.3 (325/520/780/1040/1430) | 3150 | ~4095 | zone-2 içi 25dk → ~33dk |
| Ö3 | `q_z2serve` 5 → 10 servis | 5 | 10 | unlock sonrası yeni salonda daha uzun "tanışma" |
| Ö4 | (alternatif, Ö1 yerine) zone2'ye `minLifetime: 6000` ek şartı | — | — | kapı parayla DEĞİL toplam ilerlemeyle de gate'lenir |
Ö1+Ö2 birlikte: Normal oyuncu zemin katın yarısını ~1.5 saatte bitirir; Rahat ~2.5-3 sa.
İKİNCİ İLERLEME EKSENİ (nakit-dışı zone gate — Faz 3a'ya ertelenen fikir) hâlâ masada;
istenirse Ö4 onun hafif sürümü.

## Sim modeli değişikliği (bilgi)
tools/simulate.ts: per-zone arz/talep + `runProfile(verim)`; idealize çıktı (verim 1.0)
eski denetimle uyumlu (ilk-alım 60sn SABİT). Milestone listesine zone-2 zinciri eklendi.
