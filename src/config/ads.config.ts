/**
 * ads.config.ts — REKLAMIN TEK AYAR KAYNAĞI (F3 · D-144).
 *
 * Buradaki sayılar DENGE değil sıklık/kimlik ayarıdır → varyant kapısına tabi değil. Ödüllü
 * videonun ÖDÜLLERİ (ne kadar ₺/💎) `economy.config.ts`e gider ve kapıya tabidir.
 *
 * Kimlikler Google'ın RESMÎ TEST kimlikleri. Gerçek kimlik AdMob hesabından gelince yalnız bu
 * dosya + `AndroidManifest.xml`deki `APPLICATION_ID` değişir ve `test` false olur.
 */
export const adsConfig = {
  test: true,
  birim: {
    gecisli: 'ca-app-pub-3940256099942544/1033173712',
    odullu: 'ca-app-pub-3940256099942544/5224354917',
  },
  /**
   * GEÇİŞLİ — C1′ (D-144): soğuma reklamı KURAR, panel kapanışı PATLATIR. Soğuma oturum açılışında
   * başlar (açılıştan 3 dk önce reklam yok). Panel açıkken bir ödül alındıysa o kapanış patlatmaz:
   * ödül ekranının ardından reklam gelmez (kullanıcı: "ala bastıktan sonra gelmesin").
   */
  gecisli: { sogumaSn: 180 },
  /** Çocuk-güvenli / sınırlı veri (monetization.md §3). AAID izni manifestten ayrıca çıkarıldı. */
  cocuk: {
    tagForChildDirectedTreatment: true,
    tagForUnderAgeOfConsent: true,
    maxAdContentRating: 'General',
  },
} as const;
