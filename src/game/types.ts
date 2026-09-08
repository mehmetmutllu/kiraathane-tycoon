import type { ProductId } from '../config/economy.config';

export type Vec3 = [number, number, number];

// D-011: çay artık oto servis edilmez. Müşteri oturur → 'waitingForTea' (sabır timer'ı)
// → oyuncu/garson tepsiyle çay bırakınca 'drinking' → (lavabo açıksa 'toWc'/'inWc') → 'leaving'.
// Sabır biterse sessizce gider (lavaboya da uğramaz — parasını ödememiştir).
// B4: ödeyip kalktıktan sonra müşteri LAVABOYA uğrayabilir — 'toWc' kapıya yürür, 'inWc' içeride
// (görünmez) bekler, çıkışta parasını lavabonun önündeki istife bırakıp 'leaving'e geçer.
export type NpcState = 'toTable' | 'waitingForTea' | 'drinking' | 'toWc' | 'inWc' | 'leaving';

export interface Npc {
  id: number;
  state: NpcState;
  pos: Vec3;
  /** Atanan masa indeksi (0..tables-1). */
  tableIndex: number;
  /** Atanan koltuk indeksi (0..tableSeats-1; LAYOUT.tables[i].seats). TRANSIENT —
   *  NPC'ler kaydedilmez, migrasyon gerekmez (Y2 grup sistemi). */
  seatIndex: number;
  /** O anki durumun geri sayım süresi (sn). */
  timer: number;
  /**
   * İSTEDİĞİ ÜRÜN (B2). Eskiden ürün müşterinin değil MASASININ bölgesinin özelliğiydi
   * ("3. salonda oturan tost ister"); artık müşteri gelirken kendi seçer, tost payı servis
   * noktasının seviyesinden gelir (`tostShare`). Sipariş nesnesi `{çay:1, tost:2}` Faz C'de.
   * TRANSIENT — NPC'ler kaydedilmez.
   */
  product: ProductId;
  /** Rastgele gövde rengi (greybox çeşitliliği). */
  color: string;
}

export interface Coin {
  id: number;
  pos: Vec3;
  value: number;
  /** Yerde geçirdiği süre (sn; transient). money.autoCollectAfter'ı aşınca otomatik toplanır
   *  (2026-06-13 — hem QoL hem FPS: AFK'da yüzlerce coin birikmesin, m.13 bulgusu). */
  age?: number;
}

// Kirli bardak (Faz 2e). İçen müşteri kalkınca masada bırakılır (coins gibi mekânsal nesne).
// Oyuncu/bulaşıkçı toplar → bulaşıkta yıkar → temiz havuza döner. Transient.
// tableIndex (D-019): bırakıldığı masa → masa-başı kirli sayısı (eşik aşılınca masa KİRLİ olur).
export interface Dish {
  id: number;
  pos: Vec3;
  tableIndex: number;
  /** Kirli kabın görseli (M3 ürün hattı): çay = bardak, tost = tabak. Havuz/yıkama ORTAK;
   *  yoksa bardak varsayılır (eski transient durumlar). */
  kind?: 'cup' | 'plate';
}

// Garson (Faz 2d, opsiyonel). Transient: hasWaiter persist edilir ama konum/tepsi her
// oturumda yeniden kurulur. Durum örtük: tray>0 ise teslimata, değilse ocağa yönelir.
// (Bulaşıkçı da aynı yapıyı kullanır: `tray` = taşınan kirli bardak sayısı.)
export interface Waiter {
  pos: Vec3;
  /**
   * ÜSTLENİLEN masa (D-046 ②, C3'te uygulandı): garson bir masayı üstlenince teslim edene kadar
   * BIRAKMAZ. Eskiden hedef HER KAREDE yeniden "sabrı en az kalan"a göre seçiliyordu; ölçüm
   * (`docs/kuyruk-raporu-c3.md`) garsonun ilk durağına giderken hedefinden başlangıç mesafesinin
   * 5,6 katı kadar uzaklaşabildiğini gösterdi. Üstlenme, hedef artık servis edilemez olunca düşer
   * (müşteri kalktı · masa kirlendi · tepside o ürün kalmadı). TRANSIENT — garson kaydedilmez.
   * (Bulaşıkçı da bu yapıyı kullanır ama üstlenmez: `claim` onda hep undefined.)
   */
  claim?: number;
  /** Taşıdığı ÇAY (garson) / kirli kap (bulaşıkçı). 0..ilgili kapasite. */
  tray: number;
  /** Taşıdığı TOST (yalnız garson; B2'de tek servis iki ürün verdiği için tepsi iki bölmeli —
   *  oyuncunun tray/trayFood ikilisiyle aynı desen). Kapasite ORTAK: tray + trayFood ≤ tepsi. */
  trayFood: number;
  /**
   * BOŞTA taşınan KİRLİ kap (D-083; yalnız garson — bulaşıkçı kirliyi `tray`de taşır). Garson
   * ancak servis edecek kimse kalmayınca toplar, leğene varınca temiz havuza döner. Ürün
   * tepsisinden AYRI sayılır: kirli taşırken tepsi ürünle dolu görünmemeli (garson boşalan
   * tepsisiyle servise anında dönebilir). TRANSIENT — garson kaydedilmez.
   */
  dirtyCarry?: number;
  /** Boşta taşınan kirli TABAK (D-083). Kabın TÜRÜ korunur: garson tabak taşırken elinde bardak
   *  görünmemeli (oyuncunun carriedDirty/carriedDirtyFood ikilisiyle aynı desen). TRANSIENT. */
  dirtyCarryFood?: number;
}

