/**
 * iap.config.ts — SATIN ALMANIN KİMLİK AYARLARI (F4a).
 *
 * Buradaki değerler DENGE değil kimliktir → varyant kapısına tabi değil. Ürünlerin İÇERİĞİ (kaç 💎)
 * `economy.config.ts` `iap` bloğunda ve kapıya tabidir. FİYAT kodda YOK: mağazada ülke başına girilir,
 * oyun mağazanın yerel fiyat metnini gösterir.
 *
 * `revenueCatAnahtar` null iken cihazda satın alma KAPALIDIR (düğmeler "Mağaza hazır değil").
 * Tarayıcı/testte sahte arka uç çalışır. Anahtar RevenueCat panelinden (Android public SDK key) gelir.
 */
export const iapConfig = {
  revenueCatAnahtar: null as string | null,
  /** RevenueCat "entitlement" kimlikleri — kalıcı sahiplikler (geri yüklenir). */
  hak: { reklamsiz: 'reklamsiz', baslangic: 'baslangic' },
  /** Play Console ürün kimlikleri. `elmas` sırası `economy.config.ts` `iap.diamondPacks` ile aynı. */
  urun: {
    reklamsiz: 'kiraathane_reklamsiz',
    baslangic: 'kiraathane_baslangic',
    elmas: ['kiraathane_elmas_25', 'kiraathane_elmas_60', 'kiraathane_elmas_150'],
  },
  /**
   * Vitrin kapıları (F4a kararı): başlangıç paketinin kozmetiği ve 💎'ın yeni harcama yeri (💎 kozmetik
   * vitrini) ayrı turda gelir. O gelene dek bu iki ürün kodda hazır ama mağazada GÖSTERİLMEZ —
   * harcanacak yeri olmayan 💎 ya da içi henüz olmayan paket satılmaz.
   */
  vitrin: { baslangic: false, elmas: false },
} as const;
