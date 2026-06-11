/**
 * palette.ts — Türk kıraathanesi görsel kimliği (gece 4/7, 2026-06-10).
 * TEK renk kaynağı: bileşenler buradan okur (sayı/renk koda gömülmez — economy.config deseni).
 * Stil: flat-shaded low-poly, primitive = nihai sanat (D-013). Tema: çay/bakır/ahşap/kilim.
 * Varyant denemek için SADECE bu dosya değişir (kullanıcı ilkesi: görsel işte geri dönüş kolay olsun).
 */
export const PALETTE = {
  // Zemin
  floorWood: '#b98a5a', // sıcak ahşap zemin (düz renk)
  carpet: '#84504a', // kilim — yumuşatılmış toprak-bordo (kullanıcı 2026-06-11: eski kırmızı "çok cırtlak")
  carpetBorder: '#553630', // kilim bordürü
  // Duvar
  wallCream: '#e6d7b8', // üst duvar (krem badana)
  wainscot: '#6d4c41', // lambri kuşağı (alt ahşap şerit)
  doorWood: '#5d4037', // kapı söve/direk
  lintel: '#8d6e63',
  // Mobilya
  tableWood: '#9c6f4a', // masa tablası
  tableLeg: '#5d4037',
  stool: '#7a5230', // tabure gövdesi
  stoolCushion: '#a83232', // tabure minderi (kırmızı)
  // Masa örtüsü evrimi (index = tableLevel; L0 örtüsüz)
  tableclothByLevel: ['', '#2e7d32', '#9c2b2b', '#28537a', '#b8860b'], // çuha yeşili → bordo → laci → altın
  // YEMEK masası örtü evrimi (M3 tost salonu; çay salonundan ayrışan kimlik):
  // kırmızı muşamba → turuncu → petrol → altın (L4 altın iki hatta ortak "zirve" dili)
  foodTableclothByLevel: ['', '#c0473b', '#d07f2e', '#3c6e91', '#b8860b'],
  // Tost ocağı (M3)
  griddle: '#4a4f54', // sac/ızgara metali
  griddleLid: '#37474f', // tost presi kapağı
  toast: '#d9913b', // hazır tost (kızarmış)
  toastDark: '#a8632a', // tost ızgara izi
  bread: '#e3c388', // ekmek
  breadCrate: '#b07b4f', // ekmek kasası
  plate: '#ece4d4', // tabak (kirli tabak görseli bunun kirlisi)
  plateDirty: '#b3a48c',
  ketchup: '#c62828',
  mayo: '#f5f0dc',
  foodApron: '#c98f2c', // tost ustası önlüğü (hardal — çaycının bordosundan ayrışır)
  foodCap: '#f3ecd9', // tost ustası beyaz kepi
  // Mutfak
  counterWood: '#795548',
  copper: '#b87333', // bakır (semaver tabanı, tepsi dekoru)
  brass: '#d4af37',
  // Dekor
  trashBody: '#5c6b73',
  trashLid: '#465259',
  // TV köşesi
  tvFrame: '#263238',
  tvScreen: '#7ec8a9', // açık ekran (maç yeşili)
  tvStand: '#4e342e',
  // Sahip karakteri (çaycı — gece 6/7 prototip)
  skin: '#e0ac69',
  shirt: '#f3ecd9', // krem gömlek
  pants: '#3e3a36', // koyu pantolon
  apron: '#7a2230', // bordo çaycı önlüğü
  cap: '#4a3728', // kasket
  mustache: '#3a2a1d',
  // Sokak
  awning: '#2e6b4f', // kıraathane tentesi (koyu yeşil)
  awningStripe: '#e6d7b8',
  planter: '#7a5230',
  plant: '#3f7d44',
  outdoorTable: '#8d6e63',
} as const;

/** Kozmetik zemin temaları (WP6) — economy.config.cosmetics.floorThemes id'leriyle eşleşir.
 *  kind 'flat': zone zemini DÜZ base rengi (canvas-tile geri alındı, 2026-06-11).
 *  kind 'checker': base taban + alt renkte BÜYÜK kare quad'larla satranç deseni (dama kimliği
 *  düz renkte kayboluyordu — kullanıcı bug'ı "damalı seçtim beyaz duruyor").
 *  alt ayrıca mağaza önizleme swatch'ında kullanılır. */
export const FLOOR_THEMES: Record<string, { kind: 'flat' | 'checker'; base: string; alt: string }> = {
  parke: { kind: 'flat', base: '#b98a5a', alt: '#ad7e4f' },
  fayans: { kind: 'flat', base: '#e8dcc8', alt: '#ddd0b8' },
  dama: { kind: 'checker', base: '#ece6da', alt: '#7d4a3a' },
  ceviz: { kind: 'flat', base: '#8a5a3b', alt: '#7c4f33' },
};

/** Kozmetik duvar temaları (WP6) — üst badana + lambri kuşağı ikilisi. */
export const WALL_THEMES: Record<string, { cream: string; wainscot: string }> = {
  krem: { cream: '#e6d7b8', wainscot: '#6d4c41' },
  yesil: { cream: '#cfe3cd', wainscot: '#3f6347' },
  mavi: { cream: '#cfe0ea', wainscot: '#34557a' },
};
