# gameDesign — Köşe Kıraathanesi

## 1. Çekirdek fantezi
Mahalle kıraathanesinin sahibisin. Tek semaver + birkaç masayla başlar, sıcak ve cıvıl
cıvıl bir mekâna büyütürsün: çay vapuru fokurdar, ince belli bardaklar dizilir, arka
masada okey pulları takırdar, terasta nargile fısıldar. Boş zamanını yönet, mekânı kur,
mahallenin uğrak noktası ol.

## 2. Oyuncu döngüsü
### Saniyelik (an-be-an)
- Sahip karakterini joystick/WASD ile dolaştır.
- Yere düşen ₺'leri topla (üstünden geç → cüzdana).
- Servis akışını izle (başta siparişi sen taşırsın; garson açılınca otomatik).

### Oturum (5-15 dk)
- Biriken parayla yükseltme al (çay fiyatı/hızı L1-L4).
- 1-2 satın-alma pad'i doldur (yeni masa, yeni çaydanlık yeri, garson).
- Bir Usta (L5) seviyesini 💎 veya ödüllü video ile aç.
- Çevrimdışı gelir topla (dönüşte birikmiş para).

### Uzun vade (günler)
- İstasyon çeşitliliği (kahve, tost, pizza), okey/tavla salonu, nargile terası.
- Elmas ekonomisi ile premium dekor / zaman atlama.
- **Prestige "Renovasyon":** mekânı yenile, İtibar kazan, kalıcı gelir çarpanı, baştan
  ama daha güçlü başla.

## 3. Çekirdek mekanik döngüsü
```
NPC gelir → boş masaya oturur → sipariş (çay) → [sahip/garson] taşır →
müşteri içer → öder → ₺ yere düşer → oyuncu toplar → cüzdan →
yükseltme / yeni istasyon / pad doldur → kapasite & gelir artar → tekrar
```

## 4. Kontrol şeması
| Girdi | Mobil | Masaüstü (geliştirme/test) |
|---|---|---|
| Hareket | Sol-alt dokunmatik joystick | WASD / ok tuşları |
| Toplama | Otomatik (yakınlık) | Otomatik (yakınlık) |
| Pad doldurma | Pad üstünde dur | Pad üstünde dur |
| Yükseltme/menü | Dokunmatik UI butonları | Tıklama |
| Kamera | Sabit takip (omuz-üstü izometrik) | Aynı |

Sahip karakteri: kapsül (greybox). Kamera yumuşak takip; çarpışma rapier ile.

## 5. Özellik listesi → Faz eşlemesi
| Özellik | Faz |
|---|---|
| Sahne, ışık, takip kamera, oynanır sahip | 1 |
| 1 çay istasyonu, NPC tam yaşam döngüsü | 1 |
| Para düşme + toplama, cüzdan, HUD (₺/💎) | 1 |
| 1 satın-alma pad'i (2. masa) | 1 |
| Kayıt + offline + dev kancaları | 1 |
| Yardımcı garson (otomatik taşıma) | 2 |
| Çaydanlık yükseltme L1-L4, semaver geçişi | 2 |
| Yeni çaydanlık yeri pad'leri | 2 |
| Kahve/tost/pizza istasyonları | 3 |
| Okey/tavla masaları (grup, istikrarlı gelir) | 3 |
| Nargile terası, alan genişleme | 3 |
| Evrensel 5-seviye yükseltme (L5 💎/video) | 4 |
| Elmas ekonomisi, prestige Renovasyon, offline tavan | 4 |
| Otomatik para toplayıcı | 4 |
| AdMob + RevenueCat IAP (etik/çocuk-güvenli) | 5 |
| .glb sanat geçişi, animasyon, ses, postprocessing | 6 |
| Capacitor mobil build, 60fps optimizasyon | 7 |
| Mağaza yayını, politikalar, yaş uyumu | 8 |

## 6. Ekonomi & monetizasyon
Detay ayrı dosyalarda: `economy.md`, `monetization.md`. Tüm sayılar
`src/config/economy.config.ts`'te (data-driven). Para `break_infinity.js` Decimal.
