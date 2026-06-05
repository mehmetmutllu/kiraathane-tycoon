# monetization — ETİK + ÇOCUK-GÜVENLİ (zorunlu kurallar)

> Bu kurallar bağlayıcıdır. Faz 5 implementasyonu bunlara uymak ZORUNDA. İhlal = bug.

## 1. Reklamlar
### Banner
- **Opsiyonel** ve **altta**. Oynanışı kapatmaz. "Reklamları Kaldır" IAP'si ile gizlenir.

### Interstitial (tam ekran geçiş)
- SADECE **doğal aralarda** (ör. prestige sonrası, uzun offline dönüşü özeti sonrası).
- **Sıklık sınırı:** ≤ 1 / birkaç dakika (örn. en az 3 dk arayla; config'te tunable).
- Eylem ortasında **ASLA** (sipariş taşırken, pad doldururken, menüde değilken çıkmaz).
- "Reklamları Kaldır" IAP'si ile tamamen kalkar.

### Ödüllü video (rewarded)
- **Hep isteğe bağlı**, net etiketli ("İzle → +X 💎").
- İlerleme için **ASLA zorunlu değil** — yalnızca hızlandırır.
- Verir: elmas, geçici 2x gelir (süreli), ücretsiz bir L5 açılışı, anında pad.
- "Reklamları Kaldır" IAP'si ödüllü videoya **dokunmaz** (oyuncu isterse izler).

## 2. IAP (uygulama içi satın alma)
- **"Reklamları Kaldır"** — tek seferlik; banner + interstitial'ı kaldırır, ödüllüye dokunmaz.
- **Elmas paketleri** — net fiyat, net miktar.
- **Başlangıç paketi** — tek seferlik, adil değer.
- Kurallar: net fiyat, **manipülatif desen yok**, geri sayım/sahte kıtlık baskısı yok,
  **gerçek parayla loot-box / kumar mekaniği YOK**.

## 3. Çocuk-güvenliği (zorunlu)
- Bu türü çocuklar oynar → reklam SDK'sı **çocuğa-yönelik / sınırlı-veri** modunda
  yapılandırılır (kişiselleştirilmemiş reklam, yaşa uygun içerik filtresi).
- AdMob: `tagForChildDirectedTreatment` + `tagForUnderAgeOfConsent`; içerik derecesi G.
- Yayın (Faz 8) görevleri: mağaza **aile politikaları**, **COPPA** (ABD) ve
  **GDPR-K** (AB çocuk) uyumu, gizlilik politikası, veri toplama beyanı.

## 4. Teknik (Faz 5)
- Reklam: Capacitor AdMob eklentisi (güncel/bakımlı olan doğrulanacak — örn. @capgo/capacitor-admob).
- IAP/abonelik: `@revenuecat/purchases-capacitor`.
- Tüm sıklık/sınır sayıları config'te tunable; test modunda reklamlar mock'lanır.
