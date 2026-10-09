/**
 * yasal.config.ts — oyunun dışa açılan yasal adresleri (Y-06). Mağaza kaydındaki URL'lerle AYNI olmalı:
 * App Store Connect → Gizlilik Politikası / Destek URL'si. Sayfalar GitHub Pages'te (tea-house-tycoon deposu).
 */
export const yasalConfig = {
  gizlilik: 'https://mehmetmutllu.github.io/tea-house-tycoon/privacy.html',
  destek: 'https://mehmetmutllu.github.io/tea-house-tycoon/support.html',
} as const;

/** Sayfa oyunun diline açılır (`#tr` / `#en` bölümü). */
export const yasalAdres = (sayfa: keyof typeof yasalConfig, dil: 'tr' | 'en'): string => `${yasalConfig[sayfa]}#${dil}`;
