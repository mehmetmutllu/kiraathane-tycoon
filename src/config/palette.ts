/**
 * palette.ts — Türk kıraathanesi görsel kimliği (gece 4/7, 2026-06-10).
 * TEK renk kaynağı: bileşenler buradan okur (sayı/renk koda gömülmez — economy.config deseni).
 * Stil: flat-shaded low-poly, primitive = nihai sanat (D-013). Tema: çay/bakır/ahşap/kilim.
 * Varyant denemek için SADECE bu dosya değişir (kullanıcı ilkesi: görsel işte geri dönüş kolay olsun).
 */
export const PALETTE = {
  // Zemin
  floorWood: '#b98a5a', // sıcak ahşap parke
  carpet: '#8e3b3b', // kırmızı kilim (masa bölgesi)
  carpetBorder: '#5f2727', // kilim bordürü
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
  // Mutfak
  counterWood: '#795548',
  copper: '#b87333', // bakır (semaver tabanı, tepsi dekoru)
  brass: '#d4af37',
  // TV köşesi
  tvFrame: '#263238',
  tvScreen: '#7ec8a9', // açık ekran (maç yeşili)
  tvStand: '#4e342e',
  // Sokak
  awning: '#2e6b4f', // kıraathane tentesi (koyu yeşil)
  awningStripe: '#e6d7b8',
  planter: '#7a5230',
  plant: '#3f7d44',
  outdoorTable: '#8d6e63',
} as const;
