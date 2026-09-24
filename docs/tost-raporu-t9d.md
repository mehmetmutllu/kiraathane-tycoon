# T9d — `q_tost5` ELLE SÜRESİ (D-147 ertelemesi)

> Araç: `tools/olcum-tost-t9d.ts` → `docs/olcum-tost-t9d.txt` (tam koşu, 3 tohum, damgalar temiz).
> Commit #1 denge dosyasına dokunmadı; kollar aynı koşudan ve AFK koşusundan okundu, `tick.ts`e dikiş yok.

## §0 Soru

T9c `q_tost5` ("5 tost servis et") kilidini açtı (`serveTost` sayacı), ama sayaç yalnız OYUNCUNUN
elle verdiği tostu sayıyor. T9b botu 40 dk'da 0 elle tost verdi, çünkü garsonlar tezgâhtaki hazır
tostu oyuncudan önce alıyordu. Soru: **elle oynayan biri bu görevi kaç dakikada bitiriyor?** Süre
uzunsa seçenek getirilecekti.

## §Yöntem

Oyunun kendi `tick()`i başsız koştu. Dünya görev hattının tam o noktasındaydı: pad'ler `z3table3`e
kadar açık (11 masa · 3 salon · 2 garson), tezgâh L5, tepsi kademesi 2, `questIndex` = q_tost5.
Oyuncuyu bir BOT yürüttü: gerçek `inputKeyboard`, gerçek çarpışma, rota oyuncunun kendi ızgarasından
(`getPlayerNavGrid`). Bot "tost-odaklı insan" gibi davrandı:
- tepside teslim edilebilir ürün varsa en yakın bekleyen müşteriye gitti,
- elinde kirli kap varsa bulaşığa gitti,
- ikisi de yoksa tezgâhın önünde bekledi.

T9b botundan farkı: çay müşterisine de servis ediyor. Tepsi çayla dolup tostu kaçırsa bile döngü
dönmeye devam ediyor.

## §Bulgular

Tam koşu (tavan 45 dk · DT 1/60). Süreler dakika cinsinden.

| tohum | elle 1. / 3. / 5. tost | her tost 5. (oyuncu aktif) | her tost 5. (oyuncu AFK) | tost payı |
|---|---|---|---|---|
| 20260924 | 0,6 / 2,9 / 5,0 | 3,2 | 2,6 | %22,0 |
| 20260925 | 0,5 / 1,3 / 1,4 | 1,4 | 1,9 | %27,5 |
| 20260926 | 1,2 / 3,9 / 8,9 | 1,4 | 1,1 | %21,0 |

| kol | tanım | ortalama | aralık |
|---|---|---|---|
| **V0** (bugün) | yalnız oyuncunun tostu, hedef 5 | **5,1** | 1,4 – 8,9 |
| V3 | yalnız oyuncunun tostu, hedef 3 | 2,7 | 1,3 – 3,9 |
| V1 | garsonunki de sayılır, hedef 5, oyuncu aktif | 2,0 | 1,4 – 3,2 |
| V1a | garsonunki de sayılır, hedef 5, oyuncu AFK | 1,9 | 1,1 – 2,6 |

1. **Görev kilitli değil ve uzun da değil:** elle ortalama 5,1 dk, en kötü tohum 8,9 dk. Görev hattının
   pad görevleri de dakikalar sürüyor; bir salon ~1 sa aktif oyun (`feedback_economy_pacing_offline`).
2. **T9b'nin "40 dk'da 0" sonucu botun kusuruydu:** o bot yalnız tepside tost varken tost müşterisini
   seçiyordu. Çay müşterisine de servis eden, tezgâhta bekleyen oyuncu ilk tostunu 0,5–1,2 dk içinde veriyor.
3. **Garsonlar tostu kapıyor ama aç bırakmıyor:** müşterilerin %21–28'i tost istiyor. Oyuncu tezgâhta
   beklerken hazır tostun bir kısmı ona düşüyor.
4. **V1 görevi anlamsızlaştırır:** garsonun verdiği tost da sayılırsa oyuncu AFK kalırken görev
   1,9 dk'da bitiyor. Böylece "5 tost servis et" artık oyuncuya bir iş vermiyor.
5. **Varyans en büyük maliyet:** aynı dünyada 1,4 ile 8,9 dk arası (6×). Uzun ucun sebebi, bot tepsiyi
   çayla doldurup tost müşterisine yer bırakmayınca birkaç tur boşa gitmesi.

**Bot sınırları:** bot tezgâhta bekliyor, sıcak tostu görünce koşmuyor ve zaman zaman bir mobilyaya
takılıyor. Bu yüzden süreler insanın ÜST sınırına yakın okunmalı.

## §Karar

(boş — karar paketinde)
