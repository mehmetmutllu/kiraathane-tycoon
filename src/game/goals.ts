/**
 * goals.ts — HEDEFLER (koleksiyon sistemi, D3 / D-089 · ödül kalıbı D3b / D-090).
 *
 * NE: beş kategori × beş kademe = 25 hedef. Görev hattı bittikten sonra da devam eden tek yapı;
 * ödülü **kalıcı gelir çarpanı** + 💎 (kalıbı da dozu da ölçüldü — `docs/hedef-raporu-d3.md` §6).
 *
 * ÖDÜL NEDEN ₺ DEĞİL: sabit ₺ merdiveni ölçümde zincirden %-3,2 götürüp tempoya hiç dokunmuyordu
 * ve geç oyunda bayatlıyordu (kazanıldığı noktadan birkaç dakika sonra gürültü). Çarpan ödülü
 * oyuncuyla birlikte büyütür ve "yazılan ≠ ödenen" hata sınıfını tanım gereği ortadan kaldırır
 * (Bulgu 14). Toplam artış config'te TEK sayı (`goals.incomeBonusTotal`); kademe başına düşen pay
 * burada türetilir — kademe sayısı değişirse toplam sabit kalır.
 *
 * KİMLİK — D-088'in dersinin aynısı. Kayıtta yalnız TOPLANMIŞ hedeflerin kimlikleri durur
 * (`goalsClaimed: string[]`); "kaçıncı kademedeyim" HİÇBİR yerde saklanmaz, her okumada
 * sayaçtan türetilir. Bir kategoriye kademe eklemek ya da eşiği değiştirmek, ilerlemiş bir kaydı
 * geri çekmez: toplanmış kimlik toplanmış kalır, yeni kademe sıraya girer.
 *
 * SAYAÇ TEK YERDE — HUD sayı hesaplamaz. D3 öncesi `GoalsSheet` eşikleri (500 · 200 · 1.000.000)
 * kendi içinde tutuyordu; bu hem CLAUDE.md'nin "sayı koda gömme" kuralını deliyordu hem de
 * ölçülemez kılıyordu (ölçüm aracı config'i okur, HUD'u değil). Artık eşik config'te, sayaç
 * burada, HUD yalnız çiziyor.
 *
 * DÖRT DURUM (plan §9): kilitli · ilerliyor · toplanabilir · toplandı.
 *   toplandı    — kimlik `claimed` listesinde.
 *   toplanabilir— sayaç eşiği geçti ve önceki kademe TOPLANMIŞ.
 *   kilitli     — önceki kademe henüz toplanmamış (sıra atlanmaz: 💎 merdiveni artan olduğu için
 *                 [3·5·8·12·22] atlamaya izin vermek, beklemeden büyük ödülü almak demekti.
 *                 Gelir çarpanı D-090'dan beri kademeye göre DEĞİŞMİYOR, kural artık 💎 içindir).
 *   ilerliyor   — sırası gelmiş ama eşik henüz dolmamış.
 */
import { economyConfig as C, type GoalCategory, type GoalMetric } from '../config/economy.config';

export type GoalState = 'locked' | 'progress' | 'claimable' | 'claimed';

/** Bir hedef kademesinin tam görünümü — HUD bunu olduğu gibi çizer. */
export interface GoalView {
  /** `<kategori>:<kademe>` — kayıtta duran kimlik. */
  id: string;
  categoryId: string;
  categoryName: string;
  note: string;
  /** Kademe index'i (0 tabanlı). */
  tier: number;
  target: number;
  cur: number;
  /** Bu kademenin kalıcı gelir artışı (oran; 0,004 = +%0,4). Eski `reward` (₺) yerine geçti. */
  bonus: number;
  diamonds: number;
  state: GoalState;
}

/** Sayaçların okunduğu tek girdi — store durumundan derlenir, HUD'dan değil. */
export interface GoalMetrics {
  /** Oyuncunun eliyle + garsonun taşıdığı toplam servis. */
  served: number;
  /** Açılmış ücretli pad sayısı (masa · salon · personel · oda). */
  pads: number;
  /** Toplam kazanılan ₺. */
  lifetime: number;
  /** Oyuncunun ELİYLE yıkadığı kirli bardak. */
  dishes: number;
  /** Son seviyeye çıkarılmış masa sayısı. */
  masterTables: number;
}

export const goalId = (categoryId: string, tier: number): string => `${categoryId}:${tier}`;

/** Koleksiyondaki TOPLAM kademe sayısı (5 × 5 = 25). */
export const totalTiers = (): number => C.goals.categories.reduce((a, c) => a + c.tiers.length, 0);

/** Bir kademenin kalıcı gelir artışı — toplam, kademelere EŞİT dağıtılır (ölçülen `hF` kolunun
 *  biçimi: çarpan açılan kademe sayısıyla doğrusal). */
export const tierBonus = (): number => C.goals.incomeBonusTotal / totalTiers();

/** Toplanmış hedeflerden gelen kalıcı gelir artışı (oran; 0,04 = +%4). HUD bunu gösterir. */
export const collectionBonus = (claimedList: readonly string[]): number => claimedList.length * tierBonus();

/**
 * Gelir ÇARPANI (1 + bonus). ₺'nin YARATILDIĞI her yerde bununla çarpılır: müşteri ödemesi ve
 * lavabo ücreti (`tick.ts`) + çevrimdışı oran (`rules.ts`). Üç tavana (talep/arz/taşıma)
 * DOKUNMAZ — yalnız aynı akışın müşteri başına ₺'sini büyütür; ölçümdeki `hF` kolu da tam olarak
 * buraya biniyordu.
 */
export const collectionMult = (claimedList: readonly string[]): number => 1 + collectionBonus(claimedList);

const metricOf = (m: GoalMetrics, k: GoalMetric): number => m[k];

/** Kategorileri config'ten okur — çağıranlar listeyi kendileri kurmasın. */
export const goalCategories = (): readonly GoalCategory[] => C.goals.categories;

/**
 * Bir kategorinin AKTİF kademesi: toplanmamış ilk kademe. Hepsi toplanmışsa `tiers.length`
 * ("kategori bitti"). Kimliğe göre okunur — index kaydedilmediği için sıra değişse de doğru yeri
 * bulur (D-088 `activeQuestIndex` deseni).
 */
export function activeTier(cat: GoalCategory, claimed: ReadonlySet<string>): number {
  for (let i = 0; i < cat.tiers.length; i++) {
    if (!claimed.has(goalId(cat.id, i))) return i;
  }
  return cat.tiers.length;
}

/** Tek bir kademenin durumu. */
export function tierState(
  cat: GoalCategory,
  tier: number,
  metrics: GoalMetrics,
  claimed: ReadonlySet<string>,
): GoalState {
  if (claimed.has(goalId(cat.id, tier))) return 'claimed';
  if (tier > activeTier(cat, claimed)) return 'locked';
  return metricOf(metrics, cat.metric) >= cat.tiers[tier] ? 'claimable' : 'progress';
}

/**
 * Kategori başına GÖSTERİLECEK kademe: aktif olan (toplanmamış ilki). Panel her kategoriden tek
 * satır gösterir — beş kategori × beş kademe hepsi birden çizilseydi 25 satırlık bir liste olurdu
 * ve "şu an ne yapmalıyım" okunmaz hâle gelirdi (Tek Odak, D-080).
 */
export function goalViews(metrics: GoalMetrics, claimedList: readonly string[]): GoalView[] {
  const claimed = new Set(claimedList);
  return goalCategories().map((cat) => {
    const t = activeTier(cat, claimed);
    const bitti = t >= cat.tiers.length;
    const tier = bitti ? cat.tiers.length - 1 : t;
    return {
      id: goalId(cat.id, tier),
      categoryId: cat.id,
      categoryName: cat.name,
      note: cat.note,
      tier,
      target: cat.tiers[tier],
      cur: metricOf(metrics, cat.metric),
      bonus: tierBonus(),
      diamonds: C.goals.diamondByTier[tier] ?? 0,
      state: bitti ? 'claimed' : tierState(cat, tier, metrics, claimed),
    };
  });
}

/** Şu an toplanabilir hedeflerin kimlikleri — HUD rozetini ve "hepsini al"ı besler. */
export function claimableGoals(metrics: GoalMetrics, claimedList: readonly string[]): string[] {
  return goalViews(metrics, claimedList)
    .filter((g) => g.state === 'claimable')
    .map((g) => g.id);
}

/**
 * Bir hedefin ÖDÜLÜ — yalnız gerçekten toplanabilirse döner, yoksa `null`.
 * Doğrulama burada: store yalnız bunu çağırır, kendi başına eşik kontrolü yapmaz (iki yerde
 * kural olsaydı biri diğerinden sapardı — `padsDone` dersi, D-015).
 */
export function claimGoalReward(
  id: string,
  metrics: GoalMetrics,
  claimedList: readonly string[],
): { bonus: number; diamonds: number } | null {
  const [catId, tierStr] = id.split(':');
  const cat = goalCategories().find((c) => c.id === catId);
  const tier = Number(tierStr);
  if (!cat || !Number.isInteger(tier) || tier < 0 || tier >= cat.tiers.length) return null;
  if (tierState(cat, tier, metrics, new Set(claimedList)) !== 'claimable') return null;
  return { bonus: tierBonus(), diamonds: C.goals.diamondByTier[tier] ?? 0 };
}
