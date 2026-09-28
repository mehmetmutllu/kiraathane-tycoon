# F4c-5 — 💎 VİTRİN FİYATLARI raporu

**Tur:** F4c-5 · Faz F (F8 💎 vitrini) · 2026-09-28
**Araç:** `tools/olcum-elmas-fiyat-f4c5.ts` · **Ham çıktı (TAM koşu):** `docs/olcum-elmas-fiyat-f4c5-tam.txt`
**Sim kancası:** yürürlükteki Usta kolu (`eUYG`) bir **gözcüyle** sarıldı. Gözcü yalnız okur: hedef kademesini, tavandaki masayı
ve salon açılışını kaydeder. Gözlü koşunun izi tabanla aynı (`38fd43d5`, F4a T0 ile aynı).

> **Bu rapor commit #1'de KARAR BÖLÜMÜ BOŞ olarak yayımlanır** (D-084 sıra kilidi). `economy.config.ts` değişmedi.

---

## §Soru

💎 vitrinindeki 21 ürünün fiyatı ne olmalı? Ürünler: 5 kıyafet, 4 tepsi, 12 dekor (8 yuva ve yılbaşı koltuğunun 4 rengi).
Kurucu kıyafeti başlangıç paketiyle gelir, fiyatı yoktur. Tabelada 💎 ürünü yok (D-156). Fiyatlar bugün TASLAK (D-154/D-155):
kıyafet 60/150, tepsi 40/80/100, dekor 40–100. Toplam **1.570 💎**.

Ölçülen sorular:
- Ücretsiz oyuncu 💎'ı ne hızla kazanıyor? Gün 1/7/30'a bakıldı; reklam izleyen ve izlemeyen oyuncu ayrı ayrı.
- Reklamları Kaldır alan oyuncu ve başlangıç paketi alan oyuncu ne kadar kazanıyor?
- 25, 60 ve 150 💎'lık paketlerin her biri tek başına ne alıyor?
- Kozmetik ilerleme avantajı veriyor mu (etik kuralı)?

## §Kapsam damgası

- **Arz.** Hedef 💎'ının hangi aktif saatte düştüğü sim'den okundu (Normal profil, 12 sa pencere). Bunun üstüne:
  - günlük görev 10 💎/gün (izleyen oyuncuda 2×),
  - Reklamları Kaldır +10/gün,
  - başlangıç paketi 100 💎.
- **Birincil model: günde 1 sa aktif oyun.** 0,5 ve 2 sa/gün duyarlılık olarak §2c'de.
- **Sim elle bulaşık yıkamayı oynamaz.** Bu yüzden Temizlik kademelerinin Servis kademeleriyle aynı anda düştüğü varsayıldı.
  12 sa'ten sonra hedef 💎'ı düşmüyor sayıldı: **182 / 250**. Kalan 68 💎 SAYILMADI, yani arz bir **alt sınır**.
- **Usta aynı 💎 havuzundan beslenir:** 20 masa × 25 = 500 💎. Masaların tavana varışı sim'den okundu, 12 sa'ten sonra 20 masanın
  tamamı uygun sayıldı (F4a §2 kuralı, talebin üst sınırı). Oyuncu için iki harcama sırası ölçüldü:
  - **Kozmetik önce:** en ucuz ürün için biriktirir, atlamaz. Usta'yı vitrin bitince alır. Kozmetiğin en hızlı gelebileceği yol budur.
  - **Usta önce:** önce uygun masaya Usta alır, artan 💎'la en ucuz kozmetiği alır. Kozmetiğin en yavaş geldiği yol budur.
- **Dekor, salonu açılmadan alınamaz** (D-155). 3. Salon Normal profilde **2,07. sa**'te açılıyor. Bu tempoda kilit
  gün sayısını hiç değiştirmiyor.

---

## §Bulgular

### B0 — Etik: kozmetik ilerleme vermiyor ✓

- Statik tarama `src/game/*.ts`'in 38 dosyasına bakıldı. Kozmetik alanını (`outfit`, `trayLook`, `dekor`, `ownedCosmetics`) okuyan
  **0 satır** var. Bu sayıya izinli dosyalar dahil değil:
  - durum ve kayıt: `store` · `save`,
  - vitrin kuralı: `vitrin`,
  - dev kancası: `devHooks`,
  - satın alma sesi: `audio`/`audioBridge`, D-157.
- `buyGemCosmetic` yalnız görünüm alanlarını yazıyor: 💎, sahiplik, kıyafet/tepsi/dekor, bildirim. Cüzdana, masaya, hıza, Usta'ya,
  XP'ye dokunmuyor.
- Askılı tepsi yalnız görünüştür. Taşıma kapasitesi `char.tray`'den gelir.
- Dekor yuvalarında müşteri ve oyuncu trafiği %0,0 (D-155).
- Tek dolaylı bağ: 💎 Usta ile aynı havuzda. Kozmetiğe harcanan 💎, Usta'yı **geciktirir**, hızlandırmaz (B3).

### B1 — 💎 kazanma hızı (fiyattan bağımsız, günde 1 sa)

| oyuncu | gün 1 | gün 7 | gün 30 | sonra, hedefler bitince |
|---|---|---|---|---|
| **E0** reklam izlemez | 53 | 252 | 482 | 10/gün |
| **İ** ödüllü izler (günlük 2× + Usta videoyla) | 63 | 322 | 782 | 20/gün |
| **K** Reklamları Kaldır, izlemez | 63 | 322 | 782 | 20/gün |
| **K+İ** ikisi birden | 73 | 392 | 1.082 | 30/gün |
| **B** başlangıç paketi (gün 1), izlemez | 153 | 352 | 582 | 10/gün |

- **İlk hafta hedeflerle geliyor, sonrası günlük görevle.** Hedef 💎'ının 96'sı ilk 3 aktif saatte düşüyor.
- Duyarlılık (§2c): 0,5 ile 2 sa/gün arasında 30. gün adedi ve vitrinin bitiş günü **hiç değişmiyor**. Yalnız ilk kozmetik
  1 gün kayabiliyor. Sebep: 7. günden sonra arzı günlük görev belirliyor, oyun süresi değil.

### B2 — Kollar: ilk kozmetik · 30 gün · tüm vitrin

Kademe: **A** küçük (lamba, bakır, emaye) · **B** orta (4 kıyafet, radyo, tablo, kanarya, saat) ·
**C** büyük (askılı tepsi, koltuk, semaver, gramofon, 4 yılbaşı) · **D** altın (yelek, tepsi).

| kol | A · B · C · D | toplam |
|---|---|---|
| **K0** bugünkü TASLAK | 40 · 60 · 80–100 · 100/150 | 1.570 |
| **K1** ucuz | 15 · 25 · 40 · 60 | 685 |
| **K2** orta, paket-hizalı | 25 · 60 · 90 · 150 | 1.575 |
| **K3** pahalı | 60 · 100 · 150 · 300 | 2.780 |

**E0 (reklam izlemez)** — sıra: kozmetik önce | Usta önce

| kol | ilk kozmetik | 30. gün adet | tüm vitrin (21) | 20 Usta biter |
|---|---|---|---|---|
| K0 | 1. gün \| 1. gün | 9 \| **1** | 139 \| 189 gün | 189 \| 36 gün |
| K1 | 1 \| 1 | 16 \| 3 | **51** \| 101 | 101 \| 37 |
| K2 | 1 \| 1 | 9 \| 2 | 140 \| 190 | 190 \| 37 |
| K3 | 2 \| **38** | 6 \| **0** | 260 \| 310 | 310 \| 32 |

**İ (ödüllü izler)** — Usta'yı videoyla aldığı için 💎'ı kozmetiğe kalıyor

| kol | ilk kozmetik | 30. gün adet | tüm vitrin (21) | 20 Usta biter |
|---|---|---|---|---|
| K0 | 1 \| 1 | 13 \| 9 | 70 \| 85 | 21 \| 16 |
| K1 | 1 \| 1 | 21 \| 18 | **26** \| 38 | 21 \| 17 |
| K2 | 1 \| 1 | 13 \| 9 | 70 \| 85 | 21 \| 16 |
| K3 | 1 \| 1 | 9 \| 6 | 130 \| 145 | 21 \| 16 |

**K (Reklamları Kaldır)** ve **K+İ**, kozmetik önce sırasında tüm vitrini şu günlerde bitiriyor:

| kol | K | K+İ |
|---|---|---|
| K0 | 70 | 47 |
| K1 | **26** | **17** |
| K2 | 70 | 47 |
| K3 | 130 | 87 |

**Tek ürün için biriktiren E0** (§2d, başka harcama yok):

| kol | Bakır Tepsi | Kıraathane Yeleği | Okuma Koltuğu | Altın Yaldız | Altın Yelek |
|---|---|---|---|---|---|
| K0 | 1. gün | 2 | 3 | 2 | 4 |
| K2 | 1 | 2 | 3 | 4 | 4 |
| K3 | 2 | 2 | 4 | **12** | **12** |

**Ritim (§2e):** hedefler bittikten sonra E0 bir ürünü kaç günde alıyor:

| kol | B (orta) | D (altın) |
|---|---|---|
| K0 | 6 gün | 15 |
| K1 | 2,5 | 6 |
| K2 | 6 | 15 |
| K3 | 10 | 30 |

İzleyen oyuncu ve Reklamları Kaldır alan oyuncu bunun yarısında alıyor.

### B3 — Kozmetik ile Usta aynı 💎'ı paylaşıyor: izlemeyen oyuncu seçmek zorunda

- **E0 önce Usta alırsa** ilk 30 günde 0–3 kozmetik alabiliyor: K0'da **1**, K3'te **0**. Usta kuyruğu 36. günde biter, vitrin
  ondan sonra açılır.
- **E0 önce kozmetik alırsa** Usta çok gecikir: K0'da 36 → **189. gün**. Kozmetik ilerlemeyi hızlandırmıyor ama geciktirebiliyor.
  Bu seçim oyuncunun elinde, zorunlu değil.
- **İzleyen oyuncuda bu çatışma yok:** Usta günde 1 videoyla geliyor (21. günde biter), 💎 kozmetiğe kalıyor. Bu da D-150'nin
  "ödüllü hızlandırır, zorunlu değil" ilkesine uyuyor.

### B4 — Paket hizası: yalnız 25'lik paket kokuyor

Paket tek başına ne alıyor:

| kol | 25 💎 | 60 💎 | 150 💎 |
|---|---|---|---|
| K0 | **hiçbir kozmetik** | 1 kıyafet, tam | Altın Yelek, tam (en ucuzdan 3) |
| K1 | 1 kıyafet, tam | Altın Yelek, tam | en ucuzdan 7 |
| K2 | 1 küçük (bakır/emaye/lamba), tam | 1 kıyafet, tam (ya da 2 küçük) | Altın Yelek ya da Altın Tepsi, tam (en ucuzdan 4) |
| K3 | **hiçbir kozmetik** | 1 küçük, tam | 1 büyük, tam; altın için **2 sandık** gerekiyor |

- En iyi kombinasyonda hiçbir kolda artık 💎 kalmıyor. Tek koku, K0 ve K3'te **25'lik paketin hiçbir kozmetik alamaması**.
  Bu paket yalnız bir Usta alıyor (Usta 25 💎).
- K2'de her paket en az bir bütün ürüne denk geliyor. En büyük paket (150), en değerli ürünün (altın) tam fiyatı.

### B5 — Piyasa referansı (kısa)

| oyun | skin fiyatı | 💎 paketleri | bedava kazanç |
|---|---|---|---|
| Brawl Stars | 29 · 49 · 79 · 149 · 199 · 299 | 80 · 170 · 360 · 950 · 2.000 | ~50–60 💎/ay |
| Idle Hero TD (oyuncu forumu) | 500 | — | "100+ 💎/gün" |

- **Brawl Stars:** skin kademeleri paket boylarının hemen altında (79 < 80, 149 < 170). Paketi alan bir skin alıyor, artık az kalıyor.
  Bedava oyuncu orta skini **~1,5 ayda** alıyor.
- **Idle Hero TD:** bedava oyuncu bir skini ~5 günde alıyor.
- Bizim K0/K2'de E0 orta ürünü 6 günde alıyor. Bu, idle türünün cömert ucunda.

Kaynaklar: [Brawl Stars gems guide (SMBtech, 2026)](https://smbtech.au/blog/brawl-stars-gems-guide-how-to-spend-and-save-like-a-pro-in-2026/) ·
[Brawl Stars Wiki — Catalog](https://brawlstars.fandom.com/wiki/Catalog) · [Brawl Stars Wiki — Gems](https://brawlstars.fandom.com/wiki/Gems) ·
[Idle Hero TD — Steam tartışması](https://steamcommunity.com/app/2897580/discussions/0/6306822998896781333).
Wiki sayfaları doğrudan açılamadı (402), sayılar arama özetinden alındı. Idle Hero TD sayısı oyuncu yorumu, zayıf kaynak.

---

## §Öneri (en kaliteli kol — gerekçe)

**K2 — orta, paket-hizalı ✓** (A 25 · B 60 · C 90 · D 150, toplam 1.575)

1. **Uzun hedef korunuyor.** Toplam K0 ile aynı. İzleyen oyuncu vitrini ~70 günde, izlemeyen ~140 günde bitiriyor.
   - K1 izleyen oyuncuda **26. günde** bitiyor. Ondan sonra 💎'ın gidecek tek yeri Usta kalıyor, o da 21. günde bitmiş oluyor.
     Bu, D-152'nin kaçındığı "harcanacak yeri olmayan 💎" sorununu geri getirir. 150'lik paket de anlamsızlaşır.
2. **Her paket bir bütün ürün alıyor** (B4). K0'ın tek kusuru olan "25'lik paket kozmetik alamıyor" kokusu kapanıyor.
   Altın = 150 = en büyük paket; en değerli ürün tek sandıkla alınıyor.
3. **İzlemeyen oyuncuya da bir şey düşüyor.** Önce Usta alan E0 bile 30 günde 2 ürün alıyor (K0'da 1, K3'te 0). Küçük kademe
   25 💎 = 2,5 günlük görev.
4. **K3 elendi.** İzlemeyen oyuncu, önce Usta alırsa, ilk kozmetiğini **38. günde** alıyor. Altın ürün için 2 sandık
   gerekiyor. 25'lik paket kozmetik almıyor. Bu, etik ilkeye aykırı bir "ödeme duvarı" hissi verir.

**Takas:** K2 askılı tepsi ve dört büyük dekoru 80–100'den 90'a çekiyor, bakır/emaye/lamba'yı 40'tan 25'e indiriyor. Toplam
değişmiyor, dağılım uçlara kayıyor. Başlangıç paketini alan oyuncu (B) 100 💎 ile ilk gün 1 büyük ürün (90) ya da 1 kıyafet ve 1 küçük ürün
(85) alabiliyor.

---

## §Karar

*(boş — kullanıcı seçecek; commit #2'de doldurulur)*
