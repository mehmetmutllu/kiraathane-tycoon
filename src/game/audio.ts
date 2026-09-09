/**
 * audio.ts — SES SİSTEMİ (Faz E · E3a). Motor bu turda, DOSYALAR sonraki turda (E3b).
 *
 * ÜÇ TASARIM KARARI ve gerekçeleri:
 *
 * 1) SES `tick.ts`'e DOKUNMAZ — olaylar durumun FARKINDAN türetilir.
 *    Kolay yol, tick'e bir ses kuyruğu eklemekti (`noticeQueue` deseninin aynısı). Yapılmadı,
 *    iki sebeple: (a) `tick.ts` bir DENGE dosyasıdır (`tools/sira-kilidi.mjs`) — ona dokunan
 *    her değişiklik varyant kapısını açar ve ses bir denge kolu değildir; (b) ses bir SUNUM
 *    katmanıdır, simülasyonun çıktısı değil. Durum zaten her şeyi taşıyor (`stats.coinsCollected`,
 *    `padsDone`, `xp`, `mastersOwned`…), o yüzden olaylar TÜRETİLİR — `feedback_single_source_of_truth`
 *    ve `padsDone` deseninin (D-015) aynısı. Yan kazanç: `tick-fingerprint` çıktısı birebir korunur.
 *
 * 2) ÇEKİRDEK SAF: `sesOlaylari(onceki, simdiki)` hiçbir şey çalmaz, yalnız kimlik listesi döner.
 *    3B sahne görsel olarak doğrulanamıyor (CLAUDE.md) ve ses HİÇ doğrulanamıyor — o yüzden
 *    doğrulanan şey "duyuldu mu" değil, **hangi olayın hangi durum değişiminden doğduğu**.
 *
 * 3) DOSYA YOKSA SENTEZLENMİŞ TON — `components/three/Model.tsx`'in fallback loader deseninin
 *    sesteki karşılığı (CLAUDE.md · greybox-first). `.ogg` gelmeden de oyun TAM sesli oynanır;
 *    E3b yalnız `public/assets/audio/`'a dosya bırakır, tek satır kod değişmez.
 */

/** Çalınabilir ses kimlikleri. Manifest karşılıkları: `public/assets/README.md` §Sesler. */
export type SesId =
  | 'coin'      // yerden para toplandı
  | 'pour'      // ocaktan tepsiye çay alındı
  | 'serve'     // masaya ürün bırakıldı
  | 'purchase'  // ₺ yükseltme alındı (servis · masa · lavabo)
  | 'padFill'   // pad açıldı (yeni alan/masa/personel)
  | 'quest'     // görev tamamlandı
  | 'level'     // İtibar seviyesi atladı
  | 'master'    // 💎 ile Usta alındı
  | 'reward';   // hedef ya da günlük görev ödülü toplandı

/**
 * Bir sesin tanımı: dosyası ve DOSYA YOKKEN çalınacak sentez tonu.
 * Ton değerleri "müzik" değil OKUNABİLİRLİK için seçildi: para tiz ve kısa, satın alma iki
 * kademeli ve tok, seviye en uzun. Amaç, dosyalar gelene kadar bile olayların KULAKTAN
 * ayırt edilebilmesi.
 */
export interface SesTanim {
  /** `public/` altındaki yol. Yoksa/yüklenemezse `ton`a düşülür. */
  dosya: string;
  /** Sentez tonu: frekanslar (Hz, sırayla çalınır) · toplam süre (sn) · dalga · ses seviyesi. */
  ton: { hz: number[]; sure: number; dalga: OscillatorType; gain: number };
  /** Aynı sesin iki çalınışı arasındaki EN AZ süre (sn) — yığılmayı keser. */
  aralik: number;
}

/**
 * Ses kataloğu. `aralik` değerleri Tek Odak'ın (D-080) ses karşılığıdır: aynı anda çizilen 16
 * işaretten en çok 3'ünün konuşması gibi, aynı sesin de üst üste binmesi kesilir. En sık olay
 * PARA (bir karede birden çok toplanabilir) — onun aralığı en kısa ama sıfır değil.
 */
export const SES_KATALOG: Record<SesId, SesTanim> = {
  coin:     { dosya: '/assets/audio/coin_pickup.ogg', ton: { hz: [880, 1320], sure: 0.09, dalga: 'triangle', gain: 0.18 }, aralik: 0.06 },
  pour:     { dosya: '/assets/audio/tea_pour.ogg',    ton: { hz: [420],       sure: 0.14, dalga: 'sine',     gain: 0.14 }, aralik: 0.15 },
  serve:    { dosya: '/assets/audio/tea_serve.ogg',   ton: { hz: [660, 520],  sure: 0.11, dalga: 'sine',     gain: 0.14 }, aralik: 0.12 },
  purchase: { dosya: '/assets/audio/purchase.ogg',    ton: { hz: [520, 780],  sure: 0.20, dalga: 'square',   gain: 0.12 }, aralik: 0.20 },
  padFill:  { dosya: '/assets/audio/pad_fill.ogg',    ton: { hz: [440, 660, 880], sure: 0.30, dalga: 'triangle', gain: 0.16 }, aralik: 0.30 },
  quest:    { dosya: '/assets/audio/quest_done.ogg',  ton: { hz: [660, 880],  sure: 0.26, dalga: 'triangle', gain: 0.16 }, aralik: 0.30 },
  level:    { dosya: '/assets/audio/level_up.ogg',    ton: { hz: [523, 659, 784, 1047], sure: 0.42, dalga: 'triangle', gain: 0.17 }, aralik: 0.40 },
  master:   { dosya: '/assets/audio/master.ogg',      ton: { hz: [784, 1047, 1319], sure: 0.36, dalga: 'sine', gain: 0.17 }, aralik: 0.30 },
  reward:   { dosya: '/assets/audio/reward.ogg',      ton: { hz: [988, 1319], sure: 0.24, dalga: 'triangle', gain: 0.16 }, aralik: 0.25 },
};

/**
 * Ses olaylarının türetildiği durum kesiti. Store'un TAMAMI değil — yalnız bu alanlar okunur,
 * böylece hangi değişimin ses ürettiği tek bakışta görünür ve alakasız bir alan değişince
 * sessizce yeni bir ses doğmaz.
 */
export interface SesKesit {
  coinsCollected: number;
  teaPickups: number;
  /** Oyuncunun eliyle masaya bıraktığı toplam ürün (çay + tost). */
  served: number;
  /** ₺ yükseltmelerinin TOPLAMI (servis + masa + lavabo) — hangisi olduğu sesi değiştirmiyor. */
  yukseltmeToplam: number;
  padSayisi: number;
  /** Görev hattındaki konum (D-088: çalışma zamanının kodlaması). Yalnız ARTIŞTA ses. */
  questIndex: number;
  seviye: number;
  ustaSayisi: number;
  /** Toplanmış hedef + günlük görev ödüllerinin toplamı. */
  odulSayisi: number;
}

/**
 * İKİ KESİT ARASINDAKİ ses olayları. SAF: hiçbir şey çalmaz, sıra da vermez — yalnız
 * "bu iki kare arasında ne oldu" sorusunun cevabı.
 *
 * SAYAÇLAR yalnız ARTIŞTA ses üretir; azalma (yükleme, kayıt göçü, prestij) SESSİZDİR.
 * Bu, dosyanın en kolay kaçırılacak kuralı: eski bir kayıt yüklenince bütün sayaçlar sıfırdan
 * o değerlere ATLAR ve kesit farkı devasa çıkar. `ilkKare` bayrağı bu yüzden var.
 */
export function sesOlaylari(onceki: SesKesit | null, simdiki: SesKesit): SesId[] {
  // İlk kare (ya da yükleme sonrası): kıyas noktası yok → hiçbir ses çalınmaz. Yoksa açılışta
  // oyuncunun bütün geçmişi bir anda "olay" olarak çalardı.
  if (!onceki) return [];
  const olaylar: SesId[] = [];
  const arttiMi = (a: number, b: number) => b > a;
  // Sıra ÖNEMLİ: en nadir/en anlamlı olay önce gelir, böylece bir karede birden çok olay
  // düştüğünde çalan ilk ses en bilgilendirici olan olur.
  if (arttiMi(onceki.seviye, simdiki.seviye)) olaylar.push('level');
  if (arttiMi(onceki.ustaSayisi, simdiki.ustaSayisi)) olaylar.push('master');
  if (arttiMi(onceki.padSayisi, simdiki.padSayisi)) olaylar.push('padFill');
  if (arttiMi(onceki.questIndex, simdiki.questIndex)) olaylar.push('quest');
  if (arttiMi(onceki.odulSayisi, simdiki.odulSayisi)) olaylar.push('reward');
  if (arttiMi(onceki.yukseltmeToplam, simdiki.yukseltmeToplam)) olaylar.push('purchase');
  if (arttiMi(onceki.served, simdiki.served)) olaylar.push('serve');
  if (arttiMi(onceki.teaPickups, simdiki.teaPickups)) olaylar.push('pour');
  if (arttiMi(onceki.coinsCollected, simdiki.coinsCollected)) olaylar.push('coin');
  return olaylar;
}

/**
 * Motorun tarayıcıya bakan yüzü. Testlerde sahtesi verilir — `jsdom`da gerçek WebAudio yok ve
 * olsaydı bile "duyuldu mu" doğrulanamazdı; doğrulanan şey motorun ne ÇALMAYA ÇALIŞTIĞI.
 */
export interface SesArkaUc {
  /** Dosyayı çal. Dosya yoksa/çalamazsa `false` döner → motor tona düşer. */
  dosyaCal(yol: string, gain: number): boolean;
  /** Sentez tonunu çal (fallback). */
  tonCal(ton: SesTanim['ton']): void;
  /** Tarayıcı ses kilidini açar (mobilde ilk dokunuşta). */
  kilidiAc(): void;
  /** Şu anki zaman (sn) — aralık kelepçesi bunu kullanır (testte sahte saat). */
  simdi(): number;
}

export interface SesMotoru {
  cal(id: SesId): boolean;
  kilidiAc(): void;
  ayarla(acik: boolean): void;
  readonly acik: boolean;
}

/**
 * Motoru kurar. `acik` = `settings.sound` (kayıttan gelir).
 *
 * ÜÇ KELEPÇE, üçü de gerçek bir kusuru kapatıyor:
 *  1. AYAR — kapalıyken tek bir ses bile çalınmaz (ayar bugüne dek kayıtta duruyordu ama
 *     hiçbir şeye bağlı değildi; bu tur bağlandığı yer burası).
 *  2. KİLİT — mobil tarayıcılar kullanıcı dokunmadan ses çalmaya izin vermez. Kilit açılmadan
 *     yapılan çağrılar SESSİZCE düşer (kuyruğa alınmaz: birikip sonra hep birden patlamasın).
 *  3. ARALIK — aynı ses `aralik` saniyesinden sık çalınmaz. Para toplama bir karede birden çok
 *     kez olabiliyor; kelepçe olmasa tek bir mıknatıs turunda onlarca ses üst üste binerdi.
 */
export function sesMotoruKur(arkaUc: SesArkaUc, acik: boolean): SesMotoru {
  let aktif = acik;
  let kilitli = true;
  const sonCalma = new Map<SesId, number>();

  return {
    get acik() { return aktif; },
    ayarla(v: boolean) { aktif = v; },
    kilidiAc() {
      if (!kilitli) return;
      kilitli = false;
      arkaUc.kilidiAc();
    },
    cal(id: SesId): boolean {
      if (!aktif || kilitli) return false;
      const tanim = SES_KATALOG[id];
      const t = arkaUc.simdi();
      const son = sonCalma.get(id);
      if (son != null && t - son < tanim.aralik) return false;
      sonCalma.set(id, t);
      // Dosya varsa o, yoksa sentez tonu (Model.tsx fallback deseni).
      if (!arkaUc.dosyaCal(tanim.dosya, tanim.ton.gain)) arkaUc.tonCal(tanim.ton);
      return true;
    },
  };
}
