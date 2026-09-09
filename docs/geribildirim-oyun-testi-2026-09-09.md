# Geri bildirim — oyun testi 2026-09-09 (kullanıcı oynadı)

> Ham liste. Hiçbiri bu turda uygulanmadı; her kalem kendi turuna/karara gider.
> Numaralar kalıcıdır — sonraki turlar "G-07" diye atıf yapar.

## A. Oynanış hataları (ölçülür, kod işi)

| # | Bulgu | Not |
|---|---|---|
| G-01 | Çay/bulaşık toplama **masanın her tarafından olmuyor** | etkileşim yarıçapı/açısı; `money.pickupRadius` deseni |
| G-02 | Çay ocağından çay alma **güvenilmez** — bazen alınıyor bazen alınmıyor, **tepside yer olmasına rağmen** | doluluk kontrolü mü, dwell mi, çarpışma mı? ölçülmeli |
| G-03 | **2. masadan önceki görevde kamera 2. masaya kayıyor** — istenmeyen otomatik kamera | "her şey düzgün olmalı" |

## B. Görev akışı / bildirim

| # | Bulgu | İstenen |
|---|---|---|
| G-04 | Görev bitince **toast ile yeni görev aynı anda** geliyor, karışıyor | **toast KALKSIN.** Görev BARI "yapıldı" hâline dönüşsün (şekil değişimi), *sonra* yeni görev gelsin |
| G-05 | Görev metinleri **açıklayıcı değil** | altta net hedef ("son seviyeye getirilen masa"), üstte kısa **lakap** başlık, sağda progress (zaten var) |

## C. Denge / tempo (VARYANT KAPISI — ölçülmeden uygulanmaz)

| # | Bulgu | İstenen |
|---|---|---|
| G-06 | Sıralamada **düzensizlik hissi**; tepsi ilk yükseltme **75 → ~50** | ölçülecek kol |
| G-07 | Yükseltme dwell'i **yüksek parada çok uzun** doluyor | **hep aynı süre** olsun (para bağımsız) |

## D. Pad ve yükseltme görselleri

| # | Bulgu | İstenen |
|---|---|---|
| G-08 | Ustalık pad ikonu **mavi bir kare** — kötü | gerçek ikon |
| G-09 | Pad yazıları ince | **daha kalın** |
| G-10 | Pad **yuvarlak** — "oyun yansıtmıyor" | **köşe-parantezli kare** (kenar ortaları boş) — kullanıcı emin değil, maket ister |
| G-11 | "Usta" yazıyor | **"YÜKSELT"** yazsın — her masada, her yükseltmede aynı |
| G-12 | Yükselt işaretinin **solunda yukarı ok** | altı kesikli **nitro tarzı** ok |
| G-13 | Dolma yönü | kare olursa **alttan üste** |
| G-14 | Usta'ya yaklaşınca **alt şerit** çıkıyor | **modal** çıksın |

## E. UI tasarım yönü (bu bir yön değişikliği — kendi turu)

| # | Bulgu | İstenen |
|---|---|---|
| G-15 | SVG'ler zayıf | daha güzel çizim |
| G-16 | Arayüz rengi **kahverengi = iç karartıcı** | **mavi** vb. — palet kararı |
| G-17 | Ekranlar tutarsız | ya **tam ekran** (sol üstte geri / sağ üstte çarpı) ya **modal**. Referans: **Subway Surfers** |
| G-18 | *(açık soru)* Masaya tıklayınca masa seviyesi gözüksün mü? | kullanıcı düşünüyor |

## F. Sanat / asset — "her şeyi yaptık ama KayKit'i hiçbir yere eklemedik"

| # | Bulgu | İstenen |
|---|---|---|
| G-19 | KayKit **entegre değil** | Restaurant Bits (144) + City Builder Bits (41) = **185 model repoda, src'de 0 referans** — bulgu doğrulandı |
| G-20 | **Karakter asseti yok**: müşteri · garson · bulaşıkçı · ana karakter | karar ister (bkz. asset artifact) |
| G-21 | **Zemin/duvar texture yok** | "KayKit restaurant'ta zaten vardı" — doğru: `floor_kitchen`, `wall*` |
| G-22 | **Dışarısı yapılmadı**, maketten çok eksik | pencere duvardan ayrı duruyor (sağda) · kapı üstünde **tente yok**, düz plaka duruyor |
| G-23 | Elle çizilen dekorlar | KayKit muadili varsa **değiştir** (çiçek, çöp kovası vb.) |
| G-24 | Çay bardağı asseti? | KayKit'te yok — AI/elle |
| G-25 | **İSTENEN ÇIKTI** | asset araştırması → linkli liste → **artifact** → kullanıcı seçer |

## Elle çizilen 17 dekor parçası (Decor.tsx — G-23'ün kapsamı)
`saksi` · `buyukSaksi` · `copKovasi` · `askilik` · `gazetelik` · `ayakliLamba` · `paspas` ·
`tablo` · `duvarSaati` · `aplik` · `askiRayi` · `konsol` · `tvUnitesi` · `semsiyelik` ·
`petek` · `denizlikSaksi` · `pencere`

---

# İKİNCİ TUR — kullanıcı S1'i oynadı (2026-09-09, aynı gün)

| # | Bulgu | Durum |
|---|---|---|
| G-26 | Usta/masa noktalarında **"YÜKSELT" ile ok üst üste biniyor** | ✅ S2'de düzeldi — çerçeve genişliği artık yazıdan ÇÖZÜLÜYOR (ok bloğu + yazının gerçek genişliği), tahmin edilmiyor |
| G-27 | **Kare çok keskin, köşelerde border-radius olsun** | ✅ S2 — parantezlerin dış köşesi yuvarlatıldı (`bracketShape`) |
| G-28 | **Usta modali yaklaşınca açılıyor** — durunca açılmalı | ✅ S2 — kalın çerçeve oyuncu hareketsizken 1,1 sn'de YEŞİL dolar, dolunca açılır (`dwellState`) |
| G-29 | **"Modal dedim hâlâ alttan açılıyor"** | ✅ S2 — alt-sayfa kabuğu (`.modal-card`, `align-items: flex-end`) bırakıldı; kendi merkezî kabuğu (`.usta-card`) |
| G-30 | **Masalar birbirine çok yakın mı?** | 📏 ÖLÇÜLDÜ — aşağıya bak. **EVET, arka salonda.** |
| G-31 | **Mutfağa yakın yerde yürüyemiyorum** | 📏 ÖLÇÜLDÜ — aynı kök sebep. **Geçilemeyen açıklıklar var.** |
| G-32 | Seçim/modal **daha can alıcı** olmalı, piyasadaki tycoon'lar incelensin | ⏳ araştırma turu (kullanıcı: sonraki sohbet) |
| G-33 | **Genel UI çok kötü**, internetten araştırma yapılsın | ⏳ araştırma turu |
| G-34 | Diğer ekranlar ölçülmedi | ⏳ araştırma turuyla birlikte |

## G-30 / G-31 — ÖLÇÜM (kullanıcının sorusu sayıya çevrildi)

Oyuncunun bir açıklıktan geçebilmesi için gereken boşluk = **2 × `playerRadius` = 0,94 br**
(`LAYOUT.playerRadius` = 0,47).

**Masalar arası açık boşluk** (merkez mesafesi − iki masanın oturak yarıçapı):

| Bölge | Masa türü | Oturak yarıçapı | Merkez arası | **Açık boşluk** | Geçilir mi |
|---|---|---|---|---|---|
| Ön salon (masa 0-7) | `four` | 1,45 | 6,40 | **3,50 br** | ✓ rahat |
| Arka salon (masa 8-19) | `deuce` | 1,26 | 3,20 | **0,68 br** | ✗ **GEÇMEZ** |

Yani kullanıcının sezgisi doğru ve **yalnız arka salon için** doğru: 20 masanın **12'si**
birbirine oyuncunun sığamayacağı kadar yakın.

**Çarpışma katılarının** taranması aynı sonucu bağımsız olarak veriyor — eşiğin altında
**52 açıklık** var, en darları:

```
0,04 br  x ≈ −8,5 … −11,7 · z ≈ −3,1 … −4,5   (arka salon masa sırası, altı çift)
0,04 br  x ≈  8,5 …  11,7 · z ≈ −3,1 … −4,5   (simetriği, altı çift)
0,20 br  z ≈ −10,3 boyunca üç katı arası       (arka duvar hattı)
```

**Sonuç:** "yürüyemiyorum" bir his değil, geometrik bir gerçek — 0,04 br'lik bir aralıktan
0,94 br'lik bir gövde geçemez. Düzeltme **`layout.ts`** işidir ve onaylı maket düzenine
dokunur (`feedback_layout_order`: v2 onaylı) → **kullanıcı kararı ister**, S2'de yapılmadı.

**İki kol (ikisi de ölçülebilir):**
- **K1 — masa aralığını aç:** arka salon sütun aralığı 3,20 → **3,80** (boşluk 0,68 → 1,28 br).
  Bedeli: arka salon 0,60 br × sütun sayısı kadar genişler; oda sınırına yaklaşır.
- **K2 — oturak ayak izini küçült:** `deuce` oturak offseti 1,26 → **0,96** (boşluk 0,68 → 1,28).
  Bedeli: masa görsel olarak küçülür — `feedback_reference_scale_trap` tam bu tuzağı yasaklıyor
  ("oranı mobilyayı kısarak kovalama"), o yüzden K1 önerilir.
