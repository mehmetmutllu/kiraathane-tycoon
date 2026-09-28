/**
 * onboarding.ts — E5 HAREKETLİ İLK DAKİKALAR: hangi adımdayız, iz nereyi gösteriyor.
 *
 * İKİNCİ BİR HAT DEĞİL. Görev hattı ilk dakikaların NE'sini zaten söylüyor (bant · kamera · kenar
 * oku · zemin işareti, D-038). Taze oyunda eksik kalan üç şey vardı ve öğretici yalnız onları ekler:
 *   1. **Nasıl yürünür** — joystick görünmez (dokunulan yerde belirir); ilk karede ekranda onu
 *      anlatan hiçbir şey yoktu. → sürükleyen el.
 *   2. **Tam olarak nereye** — "Çayı müşteriye götür" görevinin dünya hedefi OCAK (`questFocusPos`
 *      serveTea → istasyon); tepsisi dolu yeni oyuncuya ok ocağı gösteriyordu. Öğretici süresince
 *      hedef, çay bekleyen müşteri / yerdeki para olur. → zemin izi + aynı hedefe dönen kenar oku.
 *   3. **Nasıl alınır** — "durunca al" (hareket-temelli) kuralı hiçbir yerde yazmıyordu. → tek satır.
 *
 * TEK DOĞRU KAYNAK: adım sayaçtan değil, kartın görevinden (`cardQuestIndex`) türer. Kayıtta tek
 * yeni şey oyuncunun "Atla" kararıdır. Son öğretici görevi bitmiş (ilerlemiş/eski) kayıt öğreticiyi
 * yapısal olarak göremez — migrasyon gerekmez.
 */
import { ONBOARDING, type OgreticiAdim } from '../config/onboarding';
import { economyConfig as C } from '../config/economy.config';

/** Öğretici görevlerinin hattaki index'leri (config sırasıyla). */
const GOREV_INDEX: readonly number[] = ONBOARDING.gorevler.map((g) => C.quests.findIndex((q) => q.id === g.gorev));

/** Öğreticinin bittiği kart index'i: son öğretici görevinden SONRAKİ görev. */
export const OGRETICI_BITIS = Math.max(...GOREV_INDEX) + 1;

export interface OgreticiGirdi {
  /** KARTIN görevi (`cardQuestIndex`) — kutlama penceresinde biten görev, sonra yenisi. */
  kartIndex: number;
  /** Oyuncu "Atla" dedi (kayıtta). */
  atlandi: boolean;
  /** Oyuncu bu oturumda yürüdü mü (başlangıç noktasından `yuruEsik` kadar uzaklaştı). */
  yurudu: boolean;
}

/** Şu anki öğretici adımı; öğretici yoksa (bitti/atlandı) `null`. SAF. */
export function ogreticiAdimi(g: OgreticiGirdi): OgreticiAdim | null {
  if (g.atlandi) return null;
  // Bitiş ayrı bir eşik değil: kart öğretici görevlerinden birinde değilse öğretici yoktur
  // (`OGRETICI_BITIS` ve sonrası — ilerlemiş/eski kayıt dahil).
  const i = GOREV_INDEX.indexOf(g.kartIndex);
  if (i < 0) return null;
  const adim = ONBOARDING.gorevler[i].adim;
  return adim === 'cay-al' && !g.yurudu ? 'yuru' : adim;
}

/** Oyuncu yürümeyi öğrendi mi — başlangıç noktasından uzaklık. */
export function yurudu(player: readonly number[], baslangic: readonly number[]): boolean {
  return Math.hypot(player[0] - baslangic[0], player[2] - baslangic[2]) >= ONBOARDING.yuruEsik;
}

type Nokta = readonly [number, number, number] | readonly number[];

export interface OgreticiDunya {
  player: Nokta;
  tray: number;
  npcs: readonly { state: string; product: string; pos: Nokta }[];
  coins: readonly { pos: Nokta }[];
}

const yakini = <T extends { pos: Nokta }>(liste: readonly T[], p: Nokta): T | null => {
  let en: T | null = null;
  let d = Infinity;
  for (const o of liste) {
    const dd = Math.hypot(o.pos[0] - p[0], o.pos[2] - p[2]);
    if (dd < d) {
      d = dd;
      en = o;
    }
  }
  return en;
};

/**
 * Öğretici adımının DÜNYA hedefi — görevin kendi hedefinden (`questFocusPos`) farklıysa.
 * `null` = görevin hedefi zaten doğru, dokunma. Yalnız iki adımda ayrışır:
 *   - servis: tepside çay varken çay bekleyen EN YAKIN müşteri (tepsi boşsa ocak → null).
 *   - para:   yerdeki EN YAKIN para (henüz yoksa → null; görev hedefi salon ortası).
 */
export function ogreticiHedefi(adim: OgreticiAdim | null, w: OgreticiDunya): [number, number, number] | null {
  if (adim === 'servis') {
    if (w.tray <= 0) return null;
    const n = yakini(w.npcs.filter((m) => m.state === 'waitingForTea' && m.product !== 'tost'), w.player);
    return n ? [n.pos[0], 0, n.pos[2]] : null;
  }
  if (adim === 'para') {
    const c = yakini(w.coins, w.player);
    return c ? [c.pos[0], 0, c.pos[2]] : null;
  }
  return null;
}

/** Zemin izi çizilir mi: öğretici adımı var ve izin gideceği anlamlı bir hedef var (para
 *  adımında yerde henüz para yoksa görev hedefi salonun ortasıdır — oraya iz çekilmez). */
export function izCizilir(adim: OgreticiAdim | null, w: Pick<OgreticiDunya, 'coins'>): boolean {
  if (adim == null) return false;
  return !(adim === 'para' && w.coins.length === 0);
}

export type OgreticiMetinAnahtari = keyof typeof ONBOARDING.metin;

/** Adımın satırı. Servis/para adımında dünyanın hâline göre (tepsi boş · para henüz düşmedi). */
export function ogreticiMetni(adim: OgreticiAdim, w: Pick<OgreticiDunya, 'tray' | 'coins'>): OgreticiMetinAnahtari {
  if (adim === 'servis' && w.tray <= 0) return 'servis-bos';
  if (adim === 'para' && w.coins.length === 0) return 'para-bekle';
  return adim;
}
