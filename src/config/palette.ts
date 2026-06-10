/**
 * palette.ts — Türk kıraathanesi görsel kimliği (gece 4/7, 2026-06-10).
 * TEK renk kaynağı: bileşenler buradan okur (sayı/renk koda gömülmez — economy.config deseni).
 * Stil: flat-shaded low-poly, primitive = nihai sanat (D-013). Tema: çay/bakır/ahşap/kilim.
 * Varyant denemek için SADECE bu dosya değişir (kullanıcı ilkesi: görsel işte geri dönüş kolay olsun).
 */
export const PALETTE = {
  // Zemin
  floorWood: '#b98a5a', // sıcak ahşap parke (taban)
  floorWoodAlt: '#ad7e4f', // parke ikinci ton (canvas-tile şeritleri, WP4)
  floorSeam: '#8a6038', // parke derzi
  carpet: '#8e3b3b', // kırmızı kilim (küçük vurgu halısı — WP4'te küçüldü)
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
  steel: '#9aa7ad', // paslanmaz tezgah (klasik çay ocağı, WP4)
  steelDark: '#6e7a80', // kuzine gövdesi
  kettleBottom: '#c9cdd0', // alt kazan (çelik çaydanlık)
  kettleTop: '#b03a2e', // üst demlik (emaye kırmızı)
  // Kirli masa (WP4 B-varyantı)
  stain: '#7a6242', // masa lekesi
  sponge: '#f2d023', // temizlik süngeri
  spongeFoam: '#eaf6ff',
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
