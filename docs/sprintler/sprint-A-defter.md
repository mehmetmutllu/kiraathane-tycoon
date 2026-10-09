# Sprint A defteri — mağaza güvenliği · kayıp önleme · performans Paket 1 (2026-10-10)

Plan: `sprint-A-plan.md` · karar: D-163 · ajan notları: `sprint-A/` (magaza · reklam · kayit · perf).
Commit'ler: `157385b` sözleşme · `e25cfc5` faz 1 · `076cccc` faz 2 · iOS: dal `ios-1.0.1` `19b385c` (BEKLER).
Doğrulama: vitest **1856/1856** · duman **74/74** + EN **4/4** · build temiz · mutasyon ① 4/4 · ② 5/5 · ③ 6/6 · ④ 2/3 · bağlama 6/6.

## Eski → yeni (oyuncunun göreceği)
| Konu | Eskiden | Şimdi |
|---|---|---|
| Mağazaya bağlanamama | Açılışta bir kez denenir; düşerse oturum boyu fiyat yok, "Tekrar dene" yazısı boştu | 2→4→8→16→30 sn yeniden dener; ön plana dönüşte ve Paketler açılınca yeniden; "Tekrar dene" düğmesi çalışıyor; uyarı yalnız hiç fiyat yokken |
| Satın alırken | Fiyatlar "—" olur, "bağlanılamadı" görünürdü | Fiyatlar durur, basılan düğmede "Bekleniyor…", diğerleri kilitli |
| İptal / onay bekleyen / zaten sahip / hata | Hepsi sessiz | Her biri kendi cümlesiyle (TR+EN) |
| Telefon değiştiren oyuncu | Elmas alımları kaybolurdu (anonim hesap) | Kalıcı mağaza kimliği; onaylı ama işlenmemiş alım sonraki açılışta bir kez gelir |
| Başlangıç Paketi geri yükleme | Sahiplik dönerdi, 💎 yok | Kol A: yeni kayıtta kıyafet + 100 💎 bir kez; aynı kayıtta hiçbir şey |
| Reklamsız | Başka/boş mağaza hesabı açılışta düşürebilirdi | Yalnız aynı hesapta iade edilirse düşer |
| Rıza / takip izni (iOS) | Rıza hatası takip sorusunu da atlatırdı | Ayrı sorulur; rıza yokken reklam SDK'sı başlamaz |
| Takılan reklam | Ödüllü kalıcı ölür, arka planda kayıt yazılmazdı | En geç 3 dk'da çözülür; kayıt her durumda yazılır |
| Reklam yüklenemezse | Oturum boyu reklam yok | 15 sn → 5 dk arayla yeniden dener; ödüllü düğmesi "Reklam şu an yüklenemedi" der |
| Reklam sırasında / arka planda | Müzik çalar, ses motoru açık kalırdı | Susar, dönünce devam |
| Kayıt deposu | Yalnız tarayıcı deposu (OS silebilir) | Telefonun kalıcı deposu + 3 dönen yedek + bozuk kayıt karantinası; sessiz sıfırlama yok, oyuncuya not |
| Android sil-kur | İlerleme gider | Android yedeği açık: yedekten döner |
| Görev hattı (eksik pad onarımı) | Ara görevleri ikinci kez öderdi, kayıt ileriyi unuturdu | Bir kez öder, kaldığı yere döner |
| Gece yarısı günlük ödül | Kart açıkken gün dönerse 💎 kaybolurdu | Önceki günün hazır ödülü o kartla alınır |
| EN ödül düğmesi | "Buy" | "Claim" |
| Gizlilik/destek bağlantısı | Hep Türkçe bölüm | Oyunun diline açılır |
| Performans | Panel açıkken sahne 60 fps çizilirdi | Panel açıkken çizilmez; oyunda kare işi ≈ −%36, mağaza açık ≈ −%81 (telefon öykünmesi); görüntü farkı 2 piksel |

## Görünmeyen davranış
- Kayıt sürümü artmadı; yeni alanlar eklemeli (eski kayıt kayıpsız açılır).
- `uzlasmaBasi`: eski kayıtta ilk açılışta "şimdi" yazılır → geçmiş işlemler yeniden ödenmez.
- Kaçan perf mutasyonu `fmt`'deki gereksiz bir biçim seçeneği (kod zayıflığı değil, fazlalık).

## Kapsam dışı kalanlar / ertelenen
- **iOS 1.0.1** (`ios-1.0.1` dalı): Apple incelemesi bitince → developer.apple.com → Identifiers → `com.mutlubadem.teahouse` →
  iCloud kutusu (CloudKit gerekmez) → dal main'e birleşir → Codemagic. Swift eklentisi Mac'te derlenmedi; ilk derleme ilk sınavı.
- Görev bandı "0/1" yarım ve EN öğretici satırlarının kesilmesi → görsel iş, Sprint C (ekran görüntüsüyle).
- HUD dolum çubuğunun `useFrame`'e taşınması (perf #7'nin ikinci yarısı) → Paket 2.
- Yeni metinler (~15) TR+EN taslak → Sprint B ChatGPT mikrometin turu. Çökme ekranı metinleri kendi içinde iki dilli (i18n'e bağlı değil — çökmede de çalışsın).

## Nasıl kontrol edersin (telefonda, Android 1.0.1)
1. İnterneti kapat → Mağaza › Paketler: "Mağazaya bağlanılamadı … Tekrar dene" çıkar. İnterneti aç → "Tekrar dene" → fiyatlar gelir.
2. Bir paketi satın almaya başla, Google ekranında vazgeç → "Satın almadan vazgeçtin." yazar.
3. Ödüllü video izlerken müzik susmalı; kapanınca dönmeli. Oyunu arka plana al → ses kesilir.
4. Biraz oyna, oyunu kaldır ve yeniden kur (yedek açık, aynı Google hesabı) → ilerleme dönmeli. (Android yedeği günde bir alınır;
   hemen denemek için bilgisayardan `adb shell bmgr backupnow com.mutlubadem.teahouse`.)
5. Mağaza sekmesi açıkken telefon eskisinden belirgin daha az ısınmalı.
