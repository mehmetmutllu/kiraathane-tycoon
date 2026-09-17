import type { CapacitorConfig } from '@capacitor/cli';

/*
 * `appId` Play'de KALICI kimliktir: uygulama yayımlandıktan sonra değiştirilemez, değiştirmek
 * yeni bir uygulama listelemek demektir. Yayıncı kökü (`com.memedobro`) bilerek seçildi —
 * sonraki oyunlar (ortaçağ tycoon, space colony) aynı çatı altına girer (D-130).
 *
 * `appName` yalnız Capacitor'ın kendi kaydıdır; cihazda simgenin altında görünen ad
 * `android/app/src/main/res/` altındaki `values` ve `values-tr` klasörlerinin
 * `strings.xml` dosyalarından gelir ve dile göre değişir
 * (Türkçe cihazda "Köşe Kıraathanesi"). Mağaza başlığı ikisinden de gelmez, Play Console'da yazılır.
 */
const config: CapacitorConfig = {
  appId: 'com.memedobro.teahousetycoon',
  appName: 'Tea House Tycoon',
  webDir: 'dist'
};

export default config;
