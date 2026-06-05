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
  /** O anki durumun geri sayım süresi (sn). */
  timer: number;
  /** Rastgele gövde rengi (greybox çeşitliliği). */
  color: string;
}

export interface Coin {
  id: number;
  pos: Vec3;
  value: number;
}
