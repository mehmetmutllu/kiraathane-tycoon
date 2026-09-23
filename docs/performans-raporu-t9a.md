# T9a — PERFORMANS + KOD (G-88'in ilk parçası)

> Karar: **(boş — karar paketinden sonra)** · Kullanıcının T9 öncesi seçimleri: **D-144**
> Araçlar: `tools/olcum-perf-t9a.ts` → `docs/olcum-perf-t9a.txt` (node, tick bölüşümü + N2-kesin) ·
> `tools/olcum-nav-ab-t9a.mjs` → `docs/olcum-nav-ab-t9a-telefon.{txt,json}` (tarayıcı ABBA) ·
> `tools/olcum-g1-t9a.ts` → `docs/olcum-g1-t9a.txt` (g1 dozları, sim)
> Dikişler (varsayılanda KAPALI): `nav.navOnbellekAyarla` (N2-kesin) · `olcum.ts` node'da da açılır.
> Tam durum parmak izi (`tools/tick-fingerprint.ts`, 23.606 bayt) dikiş açıkken ve kapalıyken **birebir** (`cmp`).
> `economy.config.ts` / `tick.ts` / `rules.ts` bu commit'te DEĞİŞMEDİ.

## §0 Soru

Kullanıcı (2026-09-21, G-88): *"buna da ek olarak genel bir tarama da gerek"* — kapsam kullanıcıda
belirlendi: kod + oynanış, ağırlık performans. D-144: T9 iki parça; bu **T9a** = performans + kod.

Devralınan üç girdi:
- **T6b Bulgu C** — kısıksız karede tick ~5 ms (~58 NPC), karenin üçte biri; telefonda darboğaz sim.
- **T5 Bulgu 6** — T5'ten sonra bile nav karenin %28-31'i; "asıl kol hâlâ masada: N2".
- **T5 §3.5** — N2'nin T5'te denenen politikası (aktörün yolunu tut, waypoint'e varınca sıradakine geç)
  duvardan geçen adımı %0,1 → %1,9'a çıkarıyordu → güvenli politika kendi turunu istiyordu.
- **g1 kolu** — `tempo-olcutu` bekçisi T8a'dan beri "g1 ölçütü iyileştiriyor (3 → 2)" diyordu.

## §Bulgular

### A — Tick'in %96'sı yol bulma; N2-KESİN onu ×14 ucuzlatıyor, çıktı BİREBİR aynı

`docs/olcum-perf-t9a.txt` (TAM, damgalar temiz: oyun döndü ×4 · tohum ×2 · birebir). Geç oyun,
ısınma 240 sn + kayıt 300 sn, dt 1/60, sıra ABBA.

| kol | tick p50 | tick ort | tick p95 | findNavPath ms/kare | NPC | servis/dk | parmak izi |
|---|---|---|---|---|---|---|---|
| taban | 3,92 | 4,06 | 5,45–5,72 | **3,912 (%96,3)** | 58,3 | 7,6 | `5cbc3445` |
| **N2-kesin** | **0,29** | **0,40** | 0,95–0,98 | **0,281** | 58,3 | 7,6 | `5cbc3445` |

- **Toplam tick ×10,13** (4,064 → 0,401 ms/kare). Çağrı sayısı aynı (26,85/kare), çağrı başına maliyet ×14.
- Bölüşüm: `npcSystem` 3,30 ms (%81) · `waiterSystem` 0,50 · `dishwasherSystem` 0,15 — üçünün de
  gövdesi `findNavPath`. Kalan 17 sistemin TOPLAMI 0,03 ms; sistem dışı (bağlam + `set`) 0,09 ms.
  **Nav'dan başka kol yok** — bir sonraki kalem bu tabloda görünmüyor.
- **Neden birebir:** `navPathAra`nın çıktısı yalnız (ızgara, başlangıç HÜCRESİ, tx, tz, reach)'e
  bağlı — `start` ızgaraya `clampCell` ile girer, snap hücreden türer, ızgara kurulduktan sonra
  değişmez. Aktör bir hücreyi ~12 karede geçtiği için aynı anahtar ardışık karelerde tekrarlanıyor.
  T5'in N2'si YOLU tutuyordu (bayatlar); bu kol ÇAĞRIYI tutuyor (bayatlayamaz). Ölçümle de sınandı:
  örneklenen parmak izi (`5cbc3445`) + tam durum dökümü (23.606 bayt, `cmp`) iki kolda aynı.

### A′ — Tarayıcı (telefon profili, ABBA, aynı sayfa)

`docs/olcum-nav-ab-t9a-telefon.txt` (TAM · 412×915 @ 2,625 · CPU 4× kısık · gölge AÇIK · ABBA × 5 blok ×
6 sn). **Denetim kolu TEMİZ** (çizim ms +2,7 · gölge +1,7 · çağrı +1,9 · üçgen +0,8 · NPC 0 — hepsi
eşik içinde); kol damgası 20/20 · konsol hatası 0. Oran okunur, mutlak ms bağlamdır.

| kalem | üretim | N2-kesin | oran / fark |
|---|---|---|---|
| nav ms/kare | 13,56 | 3,27 | **×0,24** |
| nav ms/çağrı | 0,735 | 0,167 | ×0,23 |
| karenin işi | 45,3 ms | 35,6 ms | **−%21,4** |
| fps | 20,4 | 25,7 | +%26 |
| nav'ın kare payı | %29,9 | %9,2 | |

Node ×0,07 → tarayıcı ×0,24: kazanç kareye YANSIYOR, ama node kadar değil (T5'te tarayıcı ×1,02 ile
hiç yansımamıştı). Fark beklenen: önbellek anahtarı her çağrıda bir dizge üretir ve çağrıların bir
kısmı yeni hücreye düşer — tarayıcıda karenin geri kalanı (çizim ~26 ms + gölge ~12 ms) sabit kalır.
Masaüstü koşusu alınmadı (T6b'de masaüstü damgası iki kez kırmızıydı; telefon profili darboğazın
olduğu yer).

### B — g1'in "iyileştirmesi" SAHTEYDİ; doğru tanımla kol ETKİSİZ

`docs/olcum-g1-t9a.txt` (TAM, damgalar temiz: varyant etkili ×2 · hat tıkanmadı ×3).

**Kusur:** g1 D1'de (D-087) "tepsi 3'te biten hatta 4. tepsiyi ekle" diye yazılmıştı. D-142 garsonu
2'li başlattı ve tepsi 4'ü (`q_waiterTray3`, kademe 2) hattın sonuna zaten koydu. Kol bunu bilmiyordu:
AYNI kimlikle, merdivende OLMAYAN kademeleri (3, 4) isteyen görevler ekliyordu. Hat orada takılıyor,
sonraki pahalı alımlar hiç yapılmıyor → ihlal düşüyor, **Kat 1 12 saatte hiç bitmiyor**. Bekçinin
"3 → 2" kaydı bu tıkanmanın gölgesiydi. (Kısa koşuda Kat 1 sütunu "—" çıkınca yakalandı; araca
bundan sonra her dozda "hat tıkanmadı" damgası eklendi.)

**Doğru tanım (T9a):** bugün hatta olmayan kademeler tepsi 5 (₺5.000, doz 1) ve hızın 3. basamağı
(2,5 · ₺1.200, doz 2); görevler `q_waiterTray3`ün arkasına girer.

| doz | kol | İdealize aşan (hüküm) | en uzun (İd.) | Normal aşan | Normal en uzun | Kat 1 (Normal) |
|---|---|---|---|---|---|---|
| 0 | taban | 1 | 22,0 dk servis L6 | 3 | 39,9 dk servis L6 | 7,49 sa |
| 1 | + tepsi 5 | 1 | 22,0 dk servis L6 | 3 | 39,9 dk servis L6 | 7,65 sa (+%2,2) |
| 2 | + tepsi 5 + hız 3 | 1 | 22,0 dk servis L6 | 3 | 39,9 dk servis L6 | 7,44 sa (−%0,7) |

Ölçütün hiçbir sayısı kıpırdamıyor; aşan üç alım (servis L5 · servis L6 · waiter3 pad'i) üç dozda
da aynı. `feedback_economy_throughput`'un "Kat 1'de taşıma kolu tükendi" sınırı D-142'den sonra
da geçerli.

### C — Araç borcu (kapısız, D-144 ⑤ + T9 listesi)

- **Sıra kilidi:** sekiz yanlış pozitif iki desene iniyordu — ① commit #1 karar paketinden önce
  push'lanıyor, kapanış menzili onu görmüyordu (T6 #2 · T8a #2 · T8b #2); ② commit #1 `tick.ts`e
  ölçüm dikişi koyuyordu (T6 #1 · T8b #1). Çare: geriye bakış (durak: denge commit'i ya da §Karar'ı
  dolu rapor) + §Karar'ı BOŞ commit'te `tick.ts`/`rules.ts` dikiş sayılır (`economy.config.ts` asla).
  Geçmişe karşı: 8 turun 7'si temiz, **C4 hâlâ ihlal** (gerçek), **D-138 hâlâ ihlal** (kararı dolu
  bir rapora `tick.ts` eklemişti — doğru). T2a (D-134) `olcum-yok` kalır: `tick.ts`e ölçümsüz mantık
  değişikliği; aracın bunu ayırması için davranış parmak izi gerekir, bu turun işi değil.
  Bekçi `tests/sira-kilidi.test.ts` 24 test · 3 mutasyonun 3'ü yakalandı (M3 ilk koşuda KAÇTI →
  D-138 gerçek-geçmiş testi eklendi).
- **Lint:** kayıtta 66 denmişti, gerçekte **77** (73 hata + 4 uyarı) ve yalnız `tools/` değil:
  `android/` derleme çıktısı (6) · `src/` (29) · `tests/` + `tools/` (36). Şimdi **0**. `src/components/three`
  için iki React Compiler kuralı + HMR kuralı kapatıldı (R3F'in useFrame'de yerinde değiştirme kalıbı,
  projede Compiler yok); UI'daki beş bulgu kodda düzeltildi (render'da ref yazımı → useFrame içine;
  effect'te setState → render'da koşullu düzeltme; `performance.now()` → tembel `useState`).

## §Karar

(boş — karar paketinden sonra doldurulur)
