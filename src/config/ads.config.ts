import type { MagazaPlatformu } from '../game/platform';

/**
 * ads.config.ts — REKLAMIN TEK AYAR KAYNAĞI (F3 · D-144).
 *
 * Buradaki sayılar DENGE değil sıklık/kimlik ayarıdır → varyant kapısına tabi değil. Ödüllü
 * videonun ÖDÜLLERİ (ne kadar ₺/💎) `economy.config.ts`e gider ve kapıya tabidir.
 *
 * AdMob'da her platform AYRI uygulamadır: birimler platform başına ayrı durur (`platform.ts` hangisinin
 * seçileceğini söyler). `test` true iken HER platformda `testBirim` (Google'ın RESMÎ test birimleri)
 * kullanılır — gerçek birimle geliştirme/test yapmak hesabın askıya alınma sebebidir. Yalnız Codemagic yayın
 * derlemesinde `test` false olur ve `birim` devreye girer; elle değiştirilmez. Kimliklerin durduğu yerler — başka yer YOK:
 *  - iOS:     `birim.ios` (GERÇEK, AdMob iOS uygulaması) + `ios/App/App/Info.plist` → `GADApplicationIdentifier`
 *  - Android: `birim.android` (GERÇEK, AdMob Android uygulaması) + `AndroidManifest.xml` → `APPLICATION_ID`
 */
type Birimler = Record<MagazaPlatformu, { gecisli: string; odullu: string }>;

export const adsConfig = {
  /** Yayın derlemesi (`VITE_REKLAM=gercek`, codemagic.yaml) dışında HER ZAMAN test — tarayıcı, test, yerel cihaz. */
  test: (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_REKLAM !== 'gercek',
  birim: {
    android: {
      gecisli: 'ca-app-pub-9532352817217002/1423661177',
      odullu: 'ca-app-pub-9532352817217002/7797497835',
    },
    ios: {
      gecisli: 'ca-app-pub-9532352817217002/3082048152',
      odullu: 'ca-app-pub-9532352817217002/3787876732',
    },
  } satisfies Birimler,
  testBirim: {
    android: {
      gecisli: 'ca-app-pub-3940256099942544/1033173712',
      odullu: 'ca-app-pub-3940256099942544/5224354917',
    },
    ios: {
      gecisli: 'ca-app-pub-3940256099942544/4411468910',
      odullu: 'ca-app-pub-3940256099942544/1712485313',
    },
  } satisfies Birimler,
  /**
   * GEÇİŞLİ — C1′ (D-144): soğuma reklamı KURAR, panel kapanışı PATLATIR. Soğuma oturum açılışında
   * başlar (açılıştan 3 dk önce reklam yok). Panel açıkken bir ödül alındıysa o kapanış patlatmaz:
   * ödül ekranının ardından reklam gelmez (kullanıcı: "ala bastıktan sonra gelmesin").
   */
  gecisli: { sogumaSn: 180 },
  /**
   * YÜKLEME HATASI (Sprint A · P1 #5): reklam yüklenemezse geri çekilerek yeniden denenir —
   * ilk bekleme `ilkSn`, her hatada iki katı, `tavanSn`de durur. Başarılı yükleme sayacı sıfırlar.
   */
  yeniden: { ilkSn: 15, tavanSn: 300 },
  /**
   * GÖSTERİM BEKÇİSİ: `show*` çağrısından sonra "açıldı" olayı `acilmaSn` içinde gelmezse reklam
   * gösterilemedi sayılır; açıldıysa da en geç `ustSinirSn`de beklemek bırakılır. Takılan bir reklam
   * oyunu (ödüllü düğme, arka plan kaydı) asla kilitli bırakmaz.
   */
  gosterim: { acilmaSn: 10, ustSinirSn: 180 },
  /**
   * iOS ATT penceresi uygulama ÖN PLANDA değilse sessizce düşer: soru, belge görünür olana dek en
   * çok `gorunurBekleSn` bekletilir.
   */
  izin: { gorunurBekleSn: 3 },
  /*
   * SDK tarafında KISIT YOK (D-151, kullanıcı kararı): çocuk işareti · yaş etiketi · içerik derecesi ·
   * kişiselleştirilmemiş reklam zorlaması yazılmaz. Reklam içeriği AdMob panelindeki engelleme
   * ayarlarıyla yönetilir; koda buradan kısıt eklenmez. Rıza formu (UMP) kısıt değil yasal ön koşul.
   */
} as const;
