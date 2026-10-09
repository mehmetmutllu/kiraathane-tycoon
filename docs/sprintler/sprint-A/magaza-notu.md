# Sprint A ① Mağaza — ara not (2026-10-10)

## Verilen API (src/game/iap.ts)
- `magazaYenile(neden)` tek uçuş; dış çağrı geri çekilmeyi sıfırlar; `'yeniden'` iç zincir. `magazaDurumu()`.
- `urunFiyati` yalnız fiyat · `satinAlmaMesgul()` · `islemdeUrun()`.
- `satinAlDetay(urun) → { sonuc, islem?, musteri? }`; eski `satinAl` = `.islem ?? null` (HUD bozulmasın).
- `uzlasmaDinle(cb)`: yenileme · RC dinleyicisi · geri yükleme · zatenSahip müşteri bilgisini verir.
- `hataSonucu(e)`: 1→vazgecti · 20→bekliyor · 6→zatenSahip · diğer→hata (RC 13.6.1 enum'u testte doğrulandı).
- RC: geçişsiz cihazda `configure({apiKey})` + `logIn(rcKimlik)` → `kiraathane.rcGecis` yazılır; sonra `configure({apiKey, appUserID})`.
  Android `syncPurchases` sessiz; iOS yok. İşlem kimliği customerInfo'daki en yeni işlemden (yoksa mağazanınki).

## Uzlaşma (src/game/satinAlimUzlas.ts)
- `magazaUzlas(satin, MusteriOzu, simdi)`; `reklamsizEsitle(satin, magazaReklamsiz, kimlik)`.
- `baslangicElmas` yoksa: `islemElmas`'ta başlangıç işlemine 💎 yazılmışsa "verildi" sayılır ve bayrağa yazılır.
- Eski kayıt: `uzlasmaBasi=simdi`, `baslangicElmas = baslangic`, hiçbir şey verilmez.

## Kararlar / gerekçe
- İşlem kimliği önceliği customerInfo (görevde "transaction yoksa" denmişti): RC'de satın alma dönüşündeki
  `transaction.transactionIdentifier` ile `nonSubscriptionTransactions` kimliği aynı uzayda olmayabilir
  (iOS'ta RC kimliği / mağaza kimliği). İki yol aynı kimliği görmezse çift 💎 olurdu.
- `ads.ts(258)` TS2454 hatası ② ajanın dosyası — dokunulmadı.
