# T9c — MASAYA SERVİS TETİĞİ (K5 · B6)

> Karar: **D-147** (2026-09-24) — G7: servis masanın gövdesinden, pay `cups.collectReach` (0,70)
> Araç: `tools/olcum-servis-t9c.ts` → `docs/olcum-servis-t9c.txt` (tam koşu, damgalar temiz).
> Commit #1 denge dosyasına dokunmadı; kollar formülle ölçüldü, `tick.ts` değişmedi.

## §0 Soru

T9b taraması (B6): *masanın köşesine dayanan oyuncu çayı bırakamıyor.* Servis tetiği bugün masa
MERKEZİNDEN 1,60 br'lik daire (`serving.serveRadius`, `tick.ts` serveSystem). Dörtlü masa kare
(yarı 0,84); çarpışma da kare (`hitsSolid` = AABB + gövde yarıçapı), yani köşede gövde kutuya ancak
~0,67 br yaklaşır ve merkeze ~1,86 br'de kalır. H1 aynı kusuru kirli kap toplamada kapatmıştı
(tetik = gövde + `cups.collectReach` 0,70 — `atTableBody`).

Kullanıcı kararı (D-146 K5): **servis de masanın GÖVDESİNDEN, her kenar/köşe eşit.** Ölçülecek olan
yalnız PAY: kaç br?

## §Yöntem

Oyuncunun `LAYOUT.player`dan yürüyerek varabildiği hücreler taşma-doldurmayla bulunur (katılar,
açık alan ve gövde yarıçapı oyunun kendi `activeSolids`/`hitsSolid`/`clampToOpenAreas`'ından).
Her masaya 360 yönden yaklaşılır; ışındaki ilk durak, bir adım içerisi masanın KENDİ katısına
çarpıyorsa **yanaşık** sayılır (masaya dayanan oyuncu). H1'in "kutuya ≤ yarıçap + hücre" tanımı
köşeleri dışarıda bırakıyordu — ilk kısa koşuda tabanı %100 gösterdi, düzeltildi.

## §Bulgular

Tam koşu (0,02 br · 360 yön). **servis%** = yanaşık yönlerin yüzde kaçında çay bırakılır ·
**alan** = tetiğin kapsadığı yürünebilir zemin · **sızıntı** = o zeminin başka masanın tetiğiyle
örtüşen kısmı · **en uzak** = tetiğin ateşlediği en uzak durağın masa merkezine mesafesi.

**Erken dünya (1 salon · 4 dörtlü masa)**

| kol | servis% | kör yön | kör masa | alan br² | sızıntı br² | en uzak br |
|---|---|---|---|---|---|---|
| S0 merkez 1,60 (bugün) | 69,3 | 368 | 4/4 | 4,4 | 0,00 | 1,60 |
| G5 gövde + 0,50 | 77,3 | 272 | 4/4 | 0,7 | 0,00 | 1,64 |
| **G7 gövde + 0,70** | **100,0** | **0** | **0** | 7,4 | 0,00 | 1,88 |
| G8 gövde + 0,80 | 100,0 | 0 | 0 | 11,3 | 0,00 | 1,98 |
| G9 gövde + 0,90 | 100,0 | 0 | 0 | 15,6 | 0,00 | 2,08 |

**Geç dünya (3 salon · 20 masa: 8 dörtlü + 12 ikili)**

| kol | servis% | kör yön | kör masa | alan br² | sızıntı br² | en uzak br |
|---|---|---|---|---|---|---|
| S0 merkez 1,60 (bugün) | 87,4 | 736 | 8/20 | 46,7 | 0,00 | 1,60 |
| G5 gövde + 0,50 | 74,6 | 1480 | 20/20 | 3,4 | 0,00 | 1,64 |
| **G7 gövde + 0,70** | **100,0** | **0** | **0** | 30,6 | 0,00 | 1,88 |
| G8 gövde + 0,80 | 100,0 | 0 | 0 | 46,9 | 0,00 | 1,98 |
| G9 gövde + 0,90 | 100,0 | 0 | 0 | 64,0 | 0,00 | 2,08 |

**Pay alt sınırı** (yanaşık durakların masa kutusuna en uzağı = köşe): **0,672 br** (iki dünyada aynı).

1. **Bugünkü tetik her dörtlü masada kör:** yanaşık yönlerin %30,7'si (erken) servis etmiyor; bunlar
   köşeler. İkili masalar (yarı küçük) 1,60 dairesine sığdığı için %100 — geç dünyadaki 8 kör masa
   tam olarak 8 dörtlü masadır.
2. **Köşeyi kapatan en küçük pay 0,672** → G5 (0,50) köşeyi hiç kapatmıyor, kenarı bile sınırda (ızgarada
   %74-77). G7 (0,70) alt sınırın 0,028 üstünde — tam koşuda 0 kör yön.
3. **Sızıntı her kolda 0:** G9 (0,90) dahil hiçbir pay, yürünebilir bir durakta iki masayı birden tetiklemiyor.
4. **Affedicilik:** G7 dörtlü masada alanı büyütür (4,4 → 7,4 br², en uzak 1,60 → 1,88 = köşe), ikili
   masada küçültür (geç dünya 46,7 → 30,6 br²: ikili masaya 1,60 daireden daha yakın gelmek gerekir,
   ama yanaşık her yön yine %100). G8/G9 alanı 1,5-2× büyütür, köşe kapsamına katkısı yok.
5. **Tek kaynak:** G7'nin payı kirli kap toplamanın payıyla (`cups.collectReach`) aynı sayı — masaya
   değen oyuncu hem çayı bırakır hem kirliyi alır; iki tetik arasında bant kalmaz.

**Ölçülmeyen:** tempo etkisi. Sim (`tools/simulate.ts`) servis mesafesini modellemiyor; fark yürüme
süresinde < 0,3 br/servis mertebesinde. Rapora sayı olarak girmedi.

## §Karar

**G7 (kullanıcı 2026-09-24, D-147).** `tick.ts` serveSystem: `atTableBody(…, cups.collectReach)`;
`serving.serveRadius` config'ten kalktı (tek kullanıcısı buydu). Kirli kap ve servis artık AYNI
tetik: masaya değen oyuncu çayı bırakır ve kirliyi alır.

**Final tam koşu** (`docs/olcum-servis-t9c.txt`, `OYUN (tick)` satırı — oyunun kendi çağrısı, kaynaktan
damgalı): iki dünyada da G7 ile birebir (servis %100 · kör 0 · alan 7,4 / 30,6 br² · sızıntı 0).

**Bekçi:** `tests/mantik-t9c.test.ts` §K5 — köşe durağı (merkeze > 1,6) servis eder, payın 0,1 ötesi
etmez. Mutasyon ①: eski merkez dairesi → köşe testi düşer. ② pay 0,50 → köşe testi düşer.
