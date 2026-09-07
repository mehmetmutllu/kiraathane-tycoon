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
  // Banket adası (B3-2, orta şerit — maket v13 sedir paleti)
  banketBase: '#5d4037', // kaide (kapı ahşabıyla aynı ton)
  banketBody: '#8d5b3a', // gövde + ortak sırtlık (sedir)
  banketCushion: '#7a2230', // oturak ve sırtlık minderi (bordo — çaycı önlüğünün dili)
  banketPillow: '#9c3a45', // sırtlıktaki yastıklar (minderin bir ton açığı)
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
  // Dekor katmanı (B6a) — salt görsel; kesik duvarın asma bandına ve zemine giren parçalar.
  // Hepsi mevcut ahşap/bakır/krem ailesinden türetildi: yeni bir renk dili AÇILMADI.
  plantAlt: '#5a9a55', // ikinci yaprak kümesi (tek küre "yeşil top" duruyordu)
  glass: '#a9d6ea', // pencere camı (yarı saydam)
  glassFrame: '#5d4037', // vitrin doğraması (koyu)
  sill: '#efe7d6', // pencere denizliğinin ÜST yüzü (mermer) — kamera bu yüzü görüyor
  windowSash: '#f0e6cf', // PENCERE doğraması: AÇIK — yan duvar profilden görünüyor, koyu doğrama camı yutuyordu
  pictureArt: '#c0a37a', // tablo tuvali (krem badanadan bir ton koyu → çerçeve okunur)
  lampShade: '#e8c98a', // ayaklı lamba abajuru
  lampGlow: '#fff0b8', // ampul/aplik küresi
  // Kapı paspası: ilk deneme (#6b4a2f / #4a3423) parkenin üstünde KOYU BİR DELİK gibi
  // duruyordu; hasır tonuna çekildi — zeminden ayrışıyor ama leke olmuyor.
  doormat: '#8a6a45',
  doormatEdge: '#5d4430',
  paper: '#e9e4d6', // gazete/dergi
  coat: '#3a5570', // askıdaki ceket (koyu lacivert — #2c3e50 tepeden siyah lekeye dönüyordu)
  coatAlt: '#6d4c41',
} as const;

/** Kozmetik zemin temaları (WP6) — economy.config.cosmetics.floorThemes id'leriyle eşleşir.
 *  kind 'flat': zone zemini DÜZ base rengi (canvas-tile geri alındı, 2026-06-11).
 *  kind 'checker': base taban + alt renkte BÜYÜK kare quad'larla satranç deseni (dama kimliği
 *  düz renkte kayboluyordu — kullanıcı bug'ı "damalı seçtim beyaz duruyor").
 *  alt ayrıca mağaza önizleme swatch'ında kullanılır. */
export type FloorTheme = {
  /** Desen türü — çizimi `components/three/floorPattern.tsx` yapar. */
  kind: 'flat' | 'checker' | 'plank' | 'tile';
  /** plank/tile: tahtanın/karonun YÜZÜ · checker: taban rengi · flat: tek renk. */
  base: string;
  /** checker: satranç karelerinin alt rengi · diğerlerinde yalnız mağaza swatch'ı için. */
  alt: string;
  /** plank/tile: derz boşluğundan görünen ALT taban. Yoksa `base` kullanılır. */
  grout?: string;
  /** tile: karo kenarı (varsayılan 0,7). */
  cell?: number;
};

/**
 * G2 (2026-09-06): 'parke'/'ceviz' → **plank**, 'fayans'/'yemek' → **tile**. Eskiden hepsi düz
 * renkti; zeminde ölçek referansı olmadığı için mekân "bitmemiş" duruyordu (plan §8 teşhisi).
 * Desen doku DEĞİL geometri (D-041 doku yolunu kapattı) — gerekçe floorPattern.tsx başında.
 * 'dama' bilerek DEĞİŞMEDİ: yüksek kontrastlı satranç zaten ölçek veriyor.
 */
export const FLOOR_THEMES: Record<string, FloorTheme> = {
  // parke 2026-06-11: #b98a5a → daha açık/az doygun sıcak kum tonu (kullanıcı: "daha soft zemin").
  // G2: aynı ton artık tahta yüzü; derz onun koyu-sıcak hâli (yeni renk ailesi GİRMEDİ).
  // B6b: maketin zemini (#b98a5a) doygun bir orta ahşap; oyunun parkesi (#c9a87d) ondan hem açık
  // hem soluktu. Yalnız pozlamayı açınca soluk renk kum rengine patlıyordu (ölçüldü) → tema
  // maketin ahşabına çekildi, tahta deseni korunuyor.
  // D-073 (kullanıcı 2026-09-07): *"zemin kesinlikle parke değil maketteki gibi olmalı"*.
  // Maketin salon zemini `floorPatch(..., C.floorWood)` — TEK DÜZ AHŞAP, tahta çizgisi yok.
  // G2'nin plank deseni (ölçek referansı gerekçesiyle eklenmişti) bu yüzden kaldırıldı; ölçek
  // referansını artık gölge veriyor. Id 'parke' KALIYOR (kayıt/mağaza uyumu), deseni düz.
  parke: { kind: 'flat', base: '#b98a5a', alt: '#a8794c' },
  // 'yemek' (Y1): tost salonunun DOĞUŞTAN teması — açık krem-gri IRI KARO (1,05 m), düşük
  // kontrastlı derzle; yüksek kontrastlı 'dama'dan ayrışması korunur.
  yemek: { kind: 'tile', base: '#e3dac6', alt: '#d8cdb4', grout: '#bdb096', cell: 1.05 },
  fayans: { kind: 'tile', base: '#e8dcc8', alt: '#ddd0b8', grout: '#c2b195' },
  dama: { kind: 'checker', base: '#ece6da', alt: '#7d4a3a' },
  ceviz: { kind: 'plank', base: '#8a5a3b', alt: '#7c4f33', grout: '#5d3c26' },
};

/** Mağaza kartının çift-renk swatch'ı: desenli temada tahta yüzü + derz, düzde base + alt. */
export function floorSwatch(id: string): [string, string] {
  const t = FLOOR_THEMES[id];
  if (!t) return ['#999', '#777'];
  return [t.base, t.grout ?? t.alt];
}

/**
 * Kozmetik duvar temaları (WP6). G3 (2026-09-06): ikili (badana + lambri) → ÜÇLÜ.
 * Duvar artık düz iki kuşak değil, BİTİMİ olan bir yüzey. Üç profil (süpürgelik · lambri üstü
 * çıta · kartonpiyer) TEK bir `trim` tonunu paylaşır: duvar "koyu lambri + boyalı çerçeve"
 * olarak okunur ve tema başına tek renk ayarlanır (kullanıcı: "uyumlu bir renk olsun").
 *
 * TRIM NEDEN AÇIK: ilk denemede süpürgelik + çıta plandaki koyu ahşaptı (#5d4037) ve ekran
 * görüntüsünde lambri kuşağıyla TEK bir koyu kütleye karıştı — görünmeyen profil profil
 * değildir (ss/g3-karsilastirma.png, A↔B↔C). Gölge olmadığı için (D-054) yatay hattı ayıran
 * tek sinyal DEĞER farkı. Çizim `components/three/wallPanel.tsx`.
 * Mağaza kartı swatch'ı yalnız cream+wainscot kullanır (değişmedi).
 */
/**
 * BM (D-070): maketin duvarında lambri üstü çıta KOYUDUR (maket `C.doorWood`), G3'ün açık
 * `trim`'i değil. `rail` bu yüzden eklendi. `trim` duruyor — mağaza kartları ve UI hâlâ kullanıyor.
 */
export type WallTheme = { cream: string; wainscot: string; trim: string; rail: string };
export const WALL_THEMES: Record<string, WallTheme> = {
  krem: { cream: '#e6d7b8', wainscot: '#6d4c41', trim: '#f4ead3', rail: '#5d4037' },
  yesil: { cream: '#cfe3cd', wainscot: '#3f6347', trim: '#e9f2e6', rail: '#2f4a35' },
  mavi: { cream: '#cfe0ea', wainscot: '#34557a', trim: '#eaf2f8', rail: '#26405e' },
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
  hemiIntensity: 0.72, // B6b'de 0,35 → 0,72 (aşağıdaki PARLAKLIK notu)
  sunColor: '#fff2d8', // yönlü ışık: beyaz değil krem (semaver/bakır bu tonda canlanır)
  sunIntensity: 1.45, // B6b'de 1,6 → 1,45 (yarımküre yükseldi, güneşin tek başına taşıması gerekmiyor)
  /**
   * SOĞUK DOLGU IŞIĞI (B6b) — maket v13'te var, oyunda yoktu. Güneşin görmediği yüzler yalnız
   * yarımkürenin SICAK yer rengiyle aydınlanıyordu ve hem koyu hem sarı düşüyordu; lavabonun soğuk
   * gri fayansı (#cfd8dc) bu yüzden çamurlu bir griye dönüyordu. Maketin değeri birebir alındı.
   */
  fillColor: '#dfe6ff',
  fillIntensity: 0.28,
  fillPos: [-14, 12, -10] as [number, number, number],
  /**
   * GÜNEŞ AÇISI — G0'ın en büyük kazancı burası. Eski konum [6,12,6] ~55° yükseklikteydi:
   * gölgeler objenin ALTINDA kalıyor, tepeden bakan kamera onları hiç görmüyordu. Ölçüm: aynı
   * sahnede yalnız hemi/sun şiddetini oynatmak neredeyse hiçbir şeyi değiştirmedi; konumu
   * [9,9,7]'ye (~40°) indirmek ise her masayı ve müşteriyi zemine OTURTTU (bu iş "yüzme"
   * hissinin yarısını G1'i beklemeden kapatıyor).
   * Daha da alçaltmak ([9,8,7]) gölgeleri uzatıyor ama telefonda oynanışı örten uzun lekeler yapıyor.
   */
  /**
   * GÜNEŞ KONUMU — 2026-09-07 gece, D-073: **maketin konumu alındı** ([14, 26, 16], ~52°).
   * Kullanıcı maketi üstten görünce *"maketteki ışık ve gölgeler baya iyiymiş, gölgeleri tekrar
   * istiyorum"* dedi; beğenilen gölge boyu/açısı bu konumdan geliyor. Eski [9, 9, 7] (~40°) gölge
   * KAPALIYKEN objeyi zemine oturtmak için seçilmişti (D-053); gölge geri gelince o işi gölgenin
   * kendisi yapıyor ve 40° telefonda oynanışı örten uzun lekeler bırakıyordu.
   */
  sunPos: [14, 26, 16] as [number, number, number],
  /**
   * GÖLGE **AÇIK** (D-073, 2026-09-07 — D-054 kullanıcı tarafından geri alındı).
   * D-054'te gölgesiz seçilmişti (kare süresi 1,31 → 0,67 ms); maket üstten görülünce kullanıcı
   * gölgeleri geri istedi. Değerler maket v13'ün `init()`'inden BİREBİR alındı: PCFSoft ·
   * 2048 harita · bias −0,0012 · normalBias 0,14 (duvarlar 0,18–0,26 kalınlığında, gölge dış
   * yüze sızmasın) · ortografik ±30 · near 1 / far 80. Maketin haritası 34 × 34'ün tamamını
   * kapsıyor; D-054'ün "merdiven merdiven kenar" şikâyeti 1024'lük haritadandı, 2048 o sorunu
   * ~50 teksel/birime çıkararak kapatıyor.
   */
  shadowMapSize: 2048,
  shadowBias: -0.0012,
  shadowNormalBias: 0.14,
  shadowExtent: 30,
  shadowNear: 1,
  shadowFar: 80,
  background: '#1f2933',
  fogNear: 34, // oyun alanının DIŞINDA başlar (kamera ~14 birimden bakar) → oynanışı örtmez
  fogFar: 72,
  /**
   * PARLAKLIK (B6b, 2026-09-07 — ÖLÇÜLEREK değişti). Maket oyunun kamerasıyla render edilip yan
   * yana konunca geometrinin aynı, görüntünün farklı olduğu görüldü. Piksel ölçümü sebebi verdi:
   *
   *   yüzey            maket      oyun (eski)   fark
   *   salon zemini     L201       L118          −83
   *   WC fayansı       L255       L151          −104
   *   duvar kremi      L185       L135          −50
   *
   * Sebep TASARIM DEĞİL BORU HATTI: maket **three r128**'i varsayılan `WebGLRenderer` ile
   * kullanıyor → `LinearEncoding` çıkış, ton eşlemesi yok; renk yönetimi yapmadığı için yüzeyleri
   * patlatıyor (WC fayansı ekrana saf beyaz, 255,255,255 olarak düşüyor). Oyun **three 0.184** ile
   * renk-doğru çalışıyor (sRGB çıkış + ACESFilmic) ve doğal olarak çok daha koyu iniyor.
   *
   * Karar: maketin PATLAMASI değil, ORTA TONLARI hedeflendi. Ton eşlemesini kapatmak (`flat`)
   * denendi ve sahneyi DAHA da kararttı → elendi. Yakınsama: exposure 1,05 → 1,60 · yarımküre
   * 0,35 → 0,72 · güneş 1,6 → 1,45 · soğuk dolgu 0,28. Sonuç ölçüldü: salon zemini L118 → **L189**
   * (maket 201), WC fayansı L151 → **L213** (maketin 255'i kırpılmış değer, hedef alınmadı).
   *
   * GÜNEŞİN AÇISI DEĞİŞMEDİ ([9,9,7], ~40°): gölge olmadığı için (D-054) hacim hissini tek başına
   * o taşıyor, G0 bunu ölçerek seçmişti.
   */
  exposure: 1.6,
} as const;

/**
 * Mağaza önizleme `<Canvas gl={...}>` ayarı: dünyayla AYNI pozlama. Ton eşlemesi zaten ACESFilmic
 * (r3f varsayılanı) — yalnız exposure eşitlenir. (Işık takımı `components/three/lights.tsx`te.)
 */
export const PREVIEW_GL = { antialias: true, toneMappingExposure: LIGHTING.exposure } as const;
