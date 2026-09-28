import type { CapacitorConfig } from '@capacitor/cli';

/*
 * `appId` mağazada KALICI kimliktir (Android `applicationId` · iOS bundle identifier): uygulama
 * yayımlandıktan sonra değiştirilemez, değiştirmek yeni bir uygulama listelemek demektir.
 * Kullanıcı 2026-09-28: kimlik her yerde `com.mutlubadem.teahouse` (D-130'daki
 * `com.memedobro.teahousetycoon`un yerine; henüz hiçbir mağazada yayımlanmamıştı).
 * Android'in Java paketi / `namespace`i `com.memedobro.teahousetycoon` olarak KALDI — o kaynak
 * kodun paketidir, mağaza kimliği değil (Play Games eklentisi ve MainActivity orada).
 *
 * `appName` yalnız Capacitor'ın kendi kaydıdır; cihazda simgenin altında görünen ad
 * `android/app/src/main/res/` altındaki `values` ve `values-tr` klasörlerinin
 * `strings.xml` dosyalarından gelir ve dile göre değişir
 * (Türkçe cihazda "Köşe Kıraathanesi"). Mağaza başlığı ikisinden de gelmez, Play Console'da yazılır.
 */
const config: CapacitorConfig = {
  appId: 'com.mutlubadem.teahouse',
  appName: 'Tea House Tycoon',
  webDir: 'dist'
};

export default config;
