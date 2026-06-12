export type Vec3 = [number, number, number];

// D-011: çay artık oto servis edilmez. Müşteri oturur → 'waitingForTea' (sabır timer'ı)
// → oyuncu/garson tepsiyle çay bırakınca 'drinking' → 'leaving'. Sabır biterse sessizce gider.
export type NpcState = 'toTable' | 'waitingForTea' | 'drinking' | 'leaving';

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
  /** Rastgele gövde rengi (greybox çeşitliliği). */
  color: string;
}

export interface Coin {
  id: number;
  pos: Vec3;
  value: number;
  /** Parayı ödeyen müşterinin masası (turu-5 m.6-B): coin o masanın moneySpot KULELERİNDE
   *  istiflenir. Yoksa serbest coin (eski davranış/testler) — istiflenmez. Transient. */
  tableIndex?: number;
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
  /** Taşıdığı bardak (garson: çay; bulaşıkçı: kirli). 0..ilgili kapasite. */
  tray: number;
}
