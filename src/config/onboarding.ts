/**
 * onboarding.ts — E5 HAREKETLİ İLK DAKİKALAR: sunum sabitleri (DENGE DEĞİL).
 *
 * Öğretici ayrı bir görev hattı KURMAZ. Adımlar görev hattının ilk dört görevidir; hangi adımda
 * olunduğu kartın görevinden (`cardQuestIndex`) türer (`src/game/onboarding.ts`). Burada yalnız
 * eşleme, metin ve çizim ölçüleri durur — hiçbir sayı tempoya/ekonomiye dokunmaz.
 */

export type OgreticiAdim = 'yuru' | 'cay-al' | 'servis' | 'para' | 'pad';

export const ONBOARDING = {
  /**
   * Görev → adım. SIRA ÖNEMLİ ve hattın BAŞINDAN başlar (bekçi: `tests/ogretici-e5.test.ts`).
   * Son görev bitince öğretici biter; ilerlemiş eski kayıt bu yüzden onu hiç görmez.
   * `yuru`, `q_pickup` görevinin içindeki ilk alt adımdır (oyuncu henüz hiç yürümedi).
   */
  gorevler: [
    { gorev: 'q_pickup', adim: 'cay-al' },
    { gorev: 'q_serve1', adim: 'servis' },
    { gorev: 'q_coin', adim: 'para' },
    { gorev: 'q_table2', adim: 'pad' },
  ] as readonly { gorev: string; adim: OgreticiAdim }[],

  /** Oyuncu başlangıç noktasından bu kadar (br) uzaklaşınca "yürümeyi öğrendi" sayılır. */
  yuruEsik: 0.25,

  /**
   * Kısa oyun dili. Bant NE yapılacağını söyler ("Ocaktan çay al"); bu satır NASIL/NEREDE
   * (D-135 G-64 kuralı: ekran aynı şeyi iki kez yazmaz). 390 px'te tek satıra sığar: ≤ 25 harf
   * (bekçi ölçer — 32 harflik ilk sürüm karede "…" ile kesildi).
   */
  metin: {
    yuru: 'Ekranı sürükle, yürü',
    'cay-al': 'Ocağa yürü, yanında dur',
    servis: 'Çay bekleyenin yanına git',
    'servis-bos': 'Tepsin boş, ocağa uğra',
    para: 'Paranın üstünden geç',
    'para-bekle': 'Müşteri içip ödeyecek',
    pad: 'Alanda dur, masa açılsın',
  } as const,
  /** Satırın harf tavanı (yukarıdaki kural; bekçi okur). */
  metinTavan: 25,

  /** Zemin izi (oyuncu → hedef): akan ok başları. Birimler dünya birimi / saniye. */
  iz: {
    aralik: 0.85,
    hiz: 1.6,
    /** Hedefe bu kadar yaklaşınca iz çizilmez (zemin işareti zaten orada). */
    yakinGizle: 1.4,
    /** Oyuncunun ayağından bu kadar ileride başlar (karakterin altında kalmasın). */
    bastanPay: 0.7,
    enCok: 16,
    boy: 0.62,
    /** Uçlarda sönme uzunluğu (ölçek 0 → 1). */
    sonum: 0.9,
    y: 0.035,
    /** Zemin işaretinin ok ucuyla aynı beyaz (GroundMarker `ok-uc`) — yeni bir renk dili açılmaz. */
    renk: '#ffffff',
    opaklik: 0.85,
  },

  /** Sürükleme eli: bir tur (bas → sürükle → bırak) süresi, sn. CSS değişkenine yazılır. */
  elTurSn: 2.2,
} as const;
