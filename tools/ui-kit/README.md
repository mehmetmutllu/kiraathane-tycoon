# tools/ui-kit — macenta parça sayfası kesimi

ChatGPT'nin **macenta (#FF00FF) zeminli** UI parça sayfasını ve ikon ızgarasını saydam `.webp` parçalara keser.
Gereken: Python 3 + Pillow (WebP destekli) + numpy + scipy. Her zaman `python -I` ile çalıştır.

## Komutlar
```
# UI parça sayfası -> public/assets/ui/kit/<ad>.webp + MANIFEST.json (önizleme: tools/ui-kit/onizleme/kit.png)
python -I tools/ui-kit/kes.py docs/tasarim/sprint-B/parca-sayfasi.png --harita tools/ui-kit/harita.json

# 4x4 ikon ızgarası -> public/assets/ui/ikon/<ad>.webp (256 px kare) + MANIFEST.json (önizleme: tools/ui-kit/onizleme/ikon.png)
python -I tools/ui-kit/izgara.py docs/tasarim/sprint-B/ikon-izgara.png --harita tools/ui-kit/ikon-harita.json

# Sentetik sınama (gerçek görsel gelmeden): örnek sayfaları üretir, keser, doğrulukla karşılaştırır
python -I tools/ui-kit/ornek/sina.py        # çıktı: tools/ui-kit/ornek/cikti/{png,jpg}/{kit,ikon}
```
Seçenekler (ikisinde ortak): `--cikti DIR` · `--kalite 90` · `--kayipsiz` · `--taban` (soluk alfa kesimi; PNG 0.04, JPEG 0.06) ·
`--koru 10` (zeminden bu kadar px içerideki mor/pembe içerik opak kalır; 0 = kapalı) · `--sizinti-esik 0.01` · `--onizleme YOL`.
Yalnız `kes.py`: `--birlestir 6` (kopuk süsü parçaya katma yarıçapı; parçalar arası boşluk bunun 2 katından geniş olmalı) ·
`--min-alan 400` (daha küçük leke gürültü) · `--olcek 0.5` (kaynak px → CSS px) · `--url-onek /assets/ui/kit/`.
Yalnız `izgara.py`: `--izgara 4x4` · `--boyut 256` · `--doluluk 0.88` · `--min-oran 0.03`.

## Nasıl çalışır
1. **Anahtarlama** (`anahtar.py`): macentalık `m = min(R,B) − G`; alfa doğrusal `1 − m/m_zemin`, yarı saydam pikselde en yakın
   opak komşunun rengiyle düzeltilir. **Renk çözme (despill):** `ön = (görülen − (1−a)·M) / a` → kenarda pembe hale kalmaz,
   macenta üstündeki gölge yarı saydam siyaha döner. Zemine bağlı olmayan ya da zeminden uzak + düz tonlu + gölge rengi
   taşımayan yarı saydamlar opak kalır (mor taş, pembe ayrıntı).
2. **Kesim:** alfa maskesi `--birlestir` px genişletilip bağlı bileşenler bulunur; küçük lekeler atılır. Sıra: dikeyde örtüşen
   parçalar bir satır, satırlar yukarıdan aşağı, satır içi soldan sağa.
3. **Izgara:** bileşenler, ağırlık merkezinin düştüğü hücreye atanır (hücre çizgisine taşan ikon bölünmez); kare tuvale ortalanır.
4. **Denetim:** kenar bölgesinde (yarı saydam + saydama 2 px komşu) macentaya yakın piksel oranı **kaydedilmiş webp'te**
   ölçülür; eşiği aşarsa `UYARI`. Ayrıca: çok küçük parça, 9-slice merkezi yok, boş hücre, aşırı büyütülen ikon.

## harita.json (UI parça sayfası)
```json
{
  "olcek": 0.5,
  "parcalar": [
    "panel",
    {"ad": "kapat", "dokuz": false},
    {"ad": "dugme-birincil", "pay": [36, 30, 36, 40], "not": "pay elle düzeltildi"},
    {"ad": "kilit-rozeti", "kutu": [1080, 390, 1190, 510], "dokuz": false},
    "-"
  ]
}
```
- Düz metin ya da `{ad}`: okuma sırasındaki sıradaki parçaya verilir. `"-"` = o parçayı atla.
- `kutu: [x0, y0, x1, y1]` (kaynak px): merkezi bu kutuda olan parçayı alır, sıra sayımına girmez.
- `dokuz: false` = 9-slice yok (rozet, nokta, kapatma). `pay: [sol, üst, sağ, alt]` = otomatik payın yerine elle değer.
- `olcek` (kök ya da parça başı): CSS satırındaki `border-width` = pay × olcek. Harita yoksa ad `parca-01..` (konum sırası).

## ikon-harita.json
```json
{"izgara": "4x4", "adlar": ["para", "elmas", "cay", "-", "..."]}
```
Hücre sırası soldan sağa, yukarıdan aşağı; `"-"` = hücreyi atla; eksik adlar `ikon-NN`.

## MANIFEST.json (kit)
Her parça: `boyut`, `kaynak_kutu`, `dokuz_dilim.pay` (sol/üst/sağ/alt, kaynak px; `oto_pay` = betiğin önerisi, `elle` = haritadan),
`kose_yaricap` (alfa profilinden ölçülen köşe eğrisi), `css` (`border-image` örnek satırı), `sizinti_orani`, `uyari`.
Pay önerisi = renk profili (s18 yöntemi) ile köşe yarıçapının büyüğü + 2 güvenlik. İlerleme çubuğu dolusu gibi gerilemeyen
parçalarda pay büyük çıkar: bunlar CSS'te ray + dolgu olarak kurulur.

## ChatGPT istemi için kurallar (kesimi kolaylaştırır)
Düz #FF00FF zemin, doku/gradyan yok · parçalar arası en az 24 px boşluk · parça içinde macenta/mor/pembe ton yok ·
dış parıltı yerine sert kontur (parıltı + gölge üst üste gelirse renk ayrışmaz) · PNG indir (JPEG değil) · yazı yok.
