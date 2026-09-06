/**
 * palette.ts — Türk kıraathanesi görsel kimliği (gece 4/7, 2026-06-10).
 * TEK renk kaynağı: bileşenler buradan okur (sayı/renk koda gömülmez — economy.config deseni).
 * Stil: flat-shaded low-poly, primitive = nihai sanat (D-013). Tema: çay/bakır/ahşap/kilim.
 * Varyant denemek için SADECE bu dosya değişir (kullanıcı ilkesi: görsel işte geri dönüş kolay olsun).
 */
export const PALETTE = {
  // Zemin (kilim 2026-06-11 kullanıcı isteğiyle KALDIRILDI: "halıya gerek yok, soft zemin")
  floorWood: '#b98a5a', // dış/taban ahşap zemin (düz renk)
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
  // Tier RENK (kullanıcı 2026-06-15 rev5): SADECE 2 renk — ferah ARA TON ilerler, son seviyede ALTIN.
  // İlerleme hissi maddesel kalite zincirinden gelir (ahşap→minder→örtü→altın+dolu sandalye), renk değil.
  // İki hat AYNI. (Kullanıcı sonra ince ayar çekecek.)
  // VARSAYILAN tema rengi = KayKit asset'inin KENDİ mavisi (kullanıcı "çok tatlı"). Örtü bu maviye
  // boyanır, minder zaten asset'in kendi mavisi (recolor YOK → native). Renk TIER DEĞİL: diğer renkler
  // (teal/altın) TEMA MAĞAZASINDA satın alınır (Faz 5). Seviye ilerlemesi yalnız mobilya ile.
  defaultTone: '#5a93cf', // asset native mavisi (örtü mesh'i bununla; minder native ile eşleşsin)
  midTone: '#4ea58f', // mağaza teması: ferah teal-yeşil
  goldTone: '#e3b24c', // mağaza teması: altın
  // Örtü (index=L): L0-L1 yok, Sv3'ten itibaren varsayılan mavi (sabit). Çay+yemek aynı.
  tableclothByLevel: ['', '', '#5a93cf', '#5a93cf', '#5a93cf'],
  foodTableclothByLevel: ['', '', '#5a93cf', '#5a93cf', '#5a93cf'],
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
  // Yemek alanı kimlik paketi (Y1)
  chairWood: '#7a4a2e', // arkalıklı restoran sandalyesi (taburenin tonundan ayrışır)
  chairCushion: '#3c6e91', // sandalye minderi (petrol — foodTablecloth L3 ile aynı dil)
  foodFloorEmblem: '#b89c72', // zemine işlenen çatal-bıçak/tost amblemi (fayanstan bir ton koyu)
  menuBoardFrame: '#4e342e', // menü panosu ahşap çerçeve
  menuBoard: '#2f3a33', // kara tahta yüzeyi (koyu yeşilimsi)
  menuChalk: '#f3ecd9', // tebeşir yazı şeritleri
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
  // parke 2026-06-11: #b98a5a → daha açık/az doygun sıcak kum tonu (kullanıcı: "daha soft zemin").
  parke: { kind: 'flat', base: '#c9a87d', alt: '#bd9b70' },
  // 'yemek' (Y1): tost salonunun DOĞUŞTAN teması — açık krem-gri "büyük fayans"; düşük kontrastlı
  // dama deseni iri karo hissi verir (yüksek kontrastlı 'dama'dan ayrışır).
  yemek: { kind: 'checker', base: '#e3dac6', alt: '#d8cdb4' },
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

/**
 * IŞIK (Faz G0, 2026-09-06) — "her yer eşit parlak" sorununun tek-satır kaynağı.
 * Eski kurulum: ambientLight 0.6 (yönsüz, düz) + directional 1.1 beyaz. Sonuç: her yüzey aynı
 * değerde, hacim yok, iç mekân dışarısıyla aynı sıcaklıkta. Yeni kurulum ÜÇ ayrımı geri getirir:
 *  1) GÖK/YER ayrımı — hemisphere: yukarı bakan yüzey sıcak gün ışığı, aşağı bakan yüzey
 *     yerden dönen koyu-sıcak ahşap yansıması alır. Ambient'in yaptığı düzleştirmenin panzehiri.
 *  2) YÖN — directional sıcaklaştırıldı ve güçlendi; gölge/ışık arası fark (değer aralığı) açıldı.
 *  3) DERİNLİK — fog: uzak kenarlar arka plana karışır, harita sert kesilmez.
 * Renk sayıları burada; Scene.tsx yalnız okur. Doku YOK (D-041) — bu yüzden ışık tek kaldıraç.
 */
export const LIGHTING = {
  skyColor: '#ffe9c8', // gök yarısı: öğleden sonra sıcak gün ışığı
  groundColor: '#6b5a4a', // yer yarısı: ahşap zeminden dönen koyu-sıcak bounce
  hemiIntensity: 0.35, // ambient 0.6'dan DÜŞÜK: ışık ile gölge arasındaki fark bu sayede açılıyor
  sunColor: '#fff2d8', // yönlü ışık: beyaz değil krem (semaver/bakır bu tonda canlanır)
  sunIntensity: 1.6,
  /**
   * GÜNEŞ AÇISI — G0'ın en büyük kazancı burası. Eski konum [6,12,6] ~55° yükseklikteydi:
   * gölgeler objenin ALTINDA kalıyor, tepeden bakan kamera onları hiç görmüyordu. Ölçüm: aynı
   * sahnede yalnız hemi/sun şiddetini oynatmak neredeyse hiçbir şeyi değiştirmedi; konumu
   * [9,9,7]'ye (~40°) indirmek ise her masayı ve müşteriyi zemine OTURTTU (bu iş "yüzme"
   * hissinin yarısını G1'i beklemeden kapatıyor).
   * Daha da alçaltmak ([9,8,7]) gölgeleri uzatıyor ama telefonda oynanışı örten uzun lekeler yapıyor.
   */
  sunPos: [9, 9, 7] as [number, number, number],
  /**
   * Gölge kamerası (ortografik, ışık uzayında). Güneş alçalınca gölgeler uzadı ve ESKİ sınırlar
   * (-12/24/12/-20) sağ-üst köşede kırpıyordu. Yeni sınırlar salonu + hemen önündeki sokağı
   * kapsar; 1024 haritada ~25 teksel/birim (eskisi 28) — kırpma yok, keskinlik kaybı ihmal edilebilir.
   */
  shadow: { left: -13, right: 28, top: 15, bottom: -15, mapSize: 1024 },
  background: '#1f2933',
  fogNear: 34, // oyun alanının DIŞINDA başlar (kamera ~14 birimden bakar) → oynanışı örtmez
  fogFar: 72,
  exposure: 1.05,
} as const;

