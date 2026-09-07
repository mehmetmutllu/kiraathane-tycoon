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

#### Kat 1'in ödüllü video tasarımı (B5b kararı, D-066 — uygulama Faz 5)
**Birincil ödül: geçici DEMLEME çarpanı ("Semaver kaynadı" — ×2, 60 sn).**
Gerekçe: `docs/denge-raporu-b5b.md` gelirin üç tavanını ölçtü (talep / arz / taşıma) ve Kat 1'in
bağlayıcı tavanı **arz** (servis noktasının demleme hızı). Ödül tam o kolun üstüne biner: oyuncu
etkiyi anında görür, ilerleme için zorunlu değildir, sadece hızlandırır. Genel "2x gelir"den
üstün çünkü oyuncuya oyunun kendi darboğazını ÖĞRETİR.

**Reddedilen: "para eksik kaldıysa reklamla pad'i tamamla"** (kullanıcı fikri, 2026-09-07).
Kural ihlali değil (yukarıdaki "anında pad" zaten meşru) ama **gereksiz**: bu düğmenin yeri
"tek bir alım çok uzun sürüyor" olurdu ve B5b'nin eğri düzeltmesinden sonra oyunda ~20 dakikayı
aşan tek bir alım kalmadı (en pahalı masa 9.950₺ ≈ 10,6 dk; en büyük tek harcama karakter
tepsisi T4, 18.000₺ ≈ 19,2 dk). Bir tempo sorununu eğriyi düzelterek çözmek varken reklamla
geçiştirmek türün bilinen tuzağıdır — **duvarı indirmek varken duvarı aşmayı satmak.**
Yeniden değerlendirme koşulu: B4'ten sonra 20 dk'yı aşan tek bir alım kalırsa açılır.

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
