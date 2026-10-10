# Sprint B · mikrometin turu (ChatGPT)

Kaynak: Sprint A'nın yeni metinleri (`src/i18n/en.ts`, anahtar = TR) + çökme ekranı (`HataSiniri.tsx`, i18n dışı) + öğretici
(`src/config/onboarding.ts`, satır tavanı **25 harf**; EN satırları bugün tavanı aşıyor → telefonda kesiliyor).
Ad her yerde **Tea House Tycoon** (D-159). TR hitap "sen", sıcak ama kısa; EN sade, oyun dili.

## ChatGPT'ye verilen istem
> Mobil bir idle-tycoon oyunu (Tea House Tycoon — Türk kıraathanesi işletiyorsun) için arayüz metinlerini UX yazarı gözüyle
> eleştirel incele. Türkçe "sen" hitabıyla, kısa ve sıcak; İngilizce sade ve oyunlarda alışılmış dille. Yalnız DEĞİŞMESİ GEREKENLERİ
> JSON olarak ver: `[{"id":..., "tr":..., "en":..., "neden":...}]`. Sınırlar: öğretici satırları TR ve EN **en çok 25 karakter**;
> düğmeler en çok 14 karakter; bildirimler tek satır (≤ 48 karakter). Ücretsiz ödül alma düğmesi "satın al" gibi okunmamalı.
> Kayıt/satın alma hatalarında oyuncuyu suçlama, ne olduğunu ve ne yapacağını söyle.

## Liste

| id | Yer | TR | EN |
|---|---|---|---|
| m1 | Ödül düğmesi (ücretsiz) | Al | Claim |
| m2 | Satın alma sonucu | Satın alma tamam! | Purchase complete! |
| m3 | Satın alma sonucu | Satın almadan vazgeçtin. | Purchase cancelled. |
| m4 | Satın alma sonucu | Ödeme onay bekliyor; onaylanınca ödülün gelecek. | Payment pending — your reward arrives once it's approved. |
| m5 | Satın alma sonucu | Bu ürün zaten sende; geri yüklendi. | You already own this — restored. |
| m6 | Mağaza bağlantısı | Mağazaya ulaşılamadı. Tekrar dene. | Couldn't reach the store. Try again. |
| m7 | Düğme (bekleyen alım) | Bekleniyor… | Waiting… |
| m8 | Düğme | Tekrar dene | Try again |
| m9 | Kayıt notu | Kaydın bozulmuştu; birkaç dakika önceki yedekten devam ediyorsun. | Your save was damaged, so we restored a backup from a few minutes ago. |
| m10 | Kayıt notu | Kaydında bozuk bir değer vardı; düzelttik, ilerlemen korundu. | Part of your save was damaged. We fixed it and kept your progress. |
| m11 | Kayıt notu | Kaydın okunamadı, oyun baştan başladı. Eski kayıt cihazda saklı; destekle iletişime geçebilirsin. | We couldn't read your save, so the game started fresh. Your old save is kept on this device; contact support for help. |
| m12 | Ödüllü video | Reklam şu an yüklenemedi | Couldn't load the ad right now |
| m13 | Çaycı paneli etiketi | alan | range |
| c1 | Çökme ekranı başlık | Bir şeyler ters gitti | Something went wrong |
| c2 | Çökme ekranı açıklama | Oyun beklenmedik bir hatayla durdu. Yeniden başlatınca son kaydından devam edersin. | The game stopped because of an unexpected error. Restart to continue from your last save. |
| c3 | Çökme ekranı düğme | Yeniden başlat | Restart |
| o1 | Öğretici | Ekranı sürükle, yürü | Drag to move |
| o2 | Öğretici | Ocağa yürü, yanında dur | Walk to the Tea Station |
| o3 | Öğretici | Çay bekleyenin yanına git | Go to the waiting customer |
| o4 | Öğretici | Tepsin boş, ocağa uğra | Tray empty? Go to the Tea Station |
| o5 | Öğretici | Paranın üstünden geç | Walk over the coins |
| o6 | Öğretici | Müşteri içip ödeyecek | Customer will drink and pay |
| o7 | Öğretici | Alanda dur, masa açılsın | Stay in the area to unlock the table |

## Sonuç
ChatGPT 2 tur (2026-10-10). Değişmeyenler: m3 · m6 · m8 · c3 · o1 · o5 · m13 ("alan" doğru bulundu). Uygulananlar:

| id | TR | EN |
|---|---|---|
| m1 | Ücretsiz al | Free Reward |
| m2 | Satın alma başarılı! | Purchase successful! |
| m4 | Ödeme bekleniyor. Onaylanınca ödülün gelecek. | Payment pending. Reward arrives once approved. |
| m5 | Bu ürün zaten sende. Geri yüklendi! | You own this already. Restored! |
| m7 | Bekleniyor… | Pending… |
| m9 | Kayıt sorunu oluştu. Yedekten devam ediyorsun. | Save issue detected. Restored from backup. |
| m10 | Kayıt düzeltildi. İlerlemen korundu. | Save repaired. Your progress is safe. |
| m11 | Kayıt okunamadı. Yeni oyun başladı. Eski kaydın cihazda duruyor; destekten yardım alabilirsin. | Save unreadable. A new game started. Your old save is still on this device. Contact support for help. |
| m12 | Reklam yüklenemedi. Tekrar dene. | Ad didn't load. Try again. |
| c1 | Oyun durdu | Game stopped |
| c2 | Beklenmeyen bir hata oluştu. Yeniden başlatıp son kaydından devam et. | An unexpected error occurred. Restart to resume your last save. |
| o2 | Ocağa git, yanında dur | Go to the Tea Station |
| o3 | Bekleyene git | Go to waiting customer |
| o4 | Tepsin boşsa ocağa git | Empty tray? Tea Station ¹ |
| o6 | Müşteri içer, sonra öder | Customer drinks, then pays |
| o7 | Alanda dur, masa açılsın | Stay here to unlock table |

¹ ChatGPT'nin ikinci önerisi de 29 harfti ("Empty tray? Go to Tea Station"); 25 tavanı için "Go to" Claude düştü — tek müdahale.
Öğretici EN satırlarının hepsi artık ≤ 25 harf (telefonda kesilme biter).
