import type { MagazaPlatformu } from '../game/platform';

/**
 * iap.config.ts — SATIN ALMANIN KİMLİK AYARLARI (F4a).
 *
 * Buradaki değerler DENGE değil kimliktir → varyant kapısına tabi değil. Ürünlerin İÇERİĞİ (kaç 💎)
 * `economy.config.ts` `iap` bloğunda ve kapıya tabidir. FİYAT kodda YOK: mağazada ülke başına girilir,
 * oyun mağazanın yerel fiyat metnini gösterir.
 *
 * `revenueCatAnahtar` platform başınadır; o platformun anahtarı null iken cihazda satın alma KAPALIDIR
 * (düğmeler "Mağaza hazır değil"). Tarayıcı/testte sahte arka uç çalışır. Anahtarlar RevenueCat
 * panelinden gelir (proje → uygulama → "Public API key"): Android `goog_…`, iOS `appl_…`.
 */
export const iapConfig = {
  revenueCatAnahtar: { android: 'goog_UUbLMugYKLVHptXojEiKKCpAfpY', ios: 'appl_YEKJgMxeqxalKAwxjAXgcNtfSKF' } as Record<MagazaPlatformu, string | null>,
  /** RevenueCat "entitlement" kimlikleri — kalıcı sahiplikler (geri yüklenir). */
  hak: { reklamsiz: 'reklamsiz', baslangic: 'baslangic' },
  /**
   * Mağaza ürün kimlikleri — Play Console'da ve App Store Connect'te AYNI adla açılır (iki mağaza
   * da bu string'i görür). `elmas` sırası `economy.config.ts` `iap.diamondPacks` ile aynı.
   */
  urun: {
    reklamsiz: 'kiraathane_reklamsiz',
    baslangic: 'kiraathane_baslangic',
    elmas: ['kiraathane_elmas_25', 'kiraathane_elmas_60', 'kiraathane_elmas_150'],
  },
  /**
   * Vitrin kapıları (F4a kararı): başlangıç paketinin kozmetiği ve 💎'ın yeni harcama yeri (💎 kozmetik
   * vitrini) ayrı turda gelir. O gelene dek bu iki ürün kodda hazır ama mağazada GÖSTERİLMEZ —
   * harcanacak yeri olmayan 💎 ya da içi henüz olmayan paket satılmaz.
   * F4c'de ikisi de AÇILDI: 💎'ın harcama yeri (Kıyafet/Tepsi) ve paketin kozmetiği (Kurucu) geldi.
   */
  vitrin: { baslangic: true, elmas: true },
  /**
   * Sprint A (P1 #1): kurulum ya da fiyat okuma düşerse yeniden deneme bekleyişleri (sn) — 5 deneme,
   * sonra durum `yok` ("Tekrar dene" ya da ön plana dönüş zinciri baştan başlatır). Denge değil.
   */
  yeniden: [2, 4, 8, 16, 30],
} as const;
