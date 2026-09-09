/**
 * audio.ts — SES SİSTEMİ. Motor E3'te kuruldu, E4'te BÜYÜTÜLDÜ.
 *
 * DÖRT TASARIM KARARI ve gerekçeleri:
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
 * 3) SENTEZ NİHAİDİR, dosya OPSİYONEL ÜSTÜNE YAZMADIR (E4 · D-013'ün sesteki karşılığı).
 *    E3'te sıra tersti: dosya asıl, sentez "dosya gelene kadar" fallback'ti. E4 ölçümü bu
 *    varsayımı çürüttü — sentez kataloğu 36 çiftin 35'inde ayrışmış çıktı, yani yer tutucu gibi
 *    davranmıyordu (`docs/ses-raporu-e4.md` Bulgu 1). Projenin görsel kararı da zaten bu:
 *    primitive yer tutucu değil NİHAİ stil. Sentez tek "sanatçı"dır (stil kilidi tanımı gereği
 *    sağlanır) ve lisans yüzeyi sıfırdır. `dosya` alanı DURUYOR: bir `.ogg` bırakılırsa o çalar,
 *    tek satır kod değişmeden. Yani karar geri alınabilir kalıyor.
 *
 * 4) SENTEZ TEK YERDE ÜRETİLİR — `audioSynth.ts` (saf, deterministik, DOM'suz).
 *    E3'ün kabul edilen kusuru: sentez `audioWeb.ts` içinde WebAudio düğümleriyle kuruluydu ve
 *    ölçüm aracı o zinciri TAKLİT etmek zorundaydı; ölçülen kod ile duyulan kod ayrıydı ve
 *    sapmayı hiçbir şey tutmuyordu. Artık tarayıcı üretilen tamponu yalnızca ÇALAR, ölçüm aracı
 *    aynı tamponu OKUR.
 */
import type { Katman } from './audioSynth';
import { sesSuresi } from './audioSynth';

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

/** Bir sesin tanımı: sentez katmanları + (varsa) üstüne yazan dosya. */
export interface SesTanim {
  /** `public/` altındaki yol. Dosya VARSA sentezin yerine o çalar (opsiyonel üstüne yazma). */
  dosya: string;
  /** Sentez katmanları — sesin kendisi. Süre buradan TÜRER, elle yazılmaz. */
  katmanlar: Katman[];
  /** Aynı sesin iki çalınışı arasındaki EN AZ süre (sn) — yığılmayı keser. */
  aralik: number;
}

/**
 * SES KATALOĞU — iki AİLE, bilerek ayrılmış (E4).
 *
 * FİZİKSEL olaylar gürültü + filtre ile üretilir: bir bardağın masaya konması bir nota değil,
 * kısa bir şıngırtı ve tok bir gövdedir; çay dökmek de bir ezgi değil, bant merkezi yükselen bir
 * akıştır. Baskın katmanı gürültü olan sesler: `pour` · `serve`. İLERLEME olayları tonal kalır.
 * `coin` ikisinin arasında durur ve bilerek öyle: baskın katmanı TON'dur ama kısmileri
 * İNHARMONİKtir — yani perdeli değil METALİKtir, madenî paranın kendi tınısı.
 * Ayrım D-080 Tek Odak'ın ses karşılığıdır: oyuncu iki aileyi karıştırmaz, çünkü aynı dili
 * konuşmuyorlar.
 *
 * E3'te bu ayrım YOKTU (tek osilatör vardı) ve 9 sesin 7'si yükselen arpejdi; ölçüm bunun
 * kataloğu tek kalıba sıkıştırdığını ve `quest` ile `reward`ı AYNI JESTE düşürdüğünü gösterdi
 * (`docs/ses-raporu-e4.md` Bulgu 2-3). Baskın katmanların aralık örüntüleri artık bilerek farklı:
 *   pour +14 (gürültü süpürmesi) · purchase −5 · padFill +7,+5 · quest +4,+3 ·
 *   level +7,+5,+4 · master +5,+5 · reward +12 · coin ve serve tek değerli (aralıksız)
 *
 * `aralik` değerleri Tek Odak'ın (D-080) ses karşılığıdır: en sık olay PARA (bir karede birden
 * çok toplanabilir) — onun aralığı en kısa ama sıfır değil.
 */
export const SES_KATALOG: Record<SesId, SesTanim> = {
  // METALİK — madenî tık. İnharmonik kısmiler (1 · 2,76 · 5,40 · 8,93) çan/madenî para tınısı
  // verir; klasik dalgayla üretilemez. Üstüne çok kısa bir tiz gürültü geçişi ("tink") biner.
  coin: {
    dosya: '/assets/audio/coin_pickup.ogg',
    katmanlar: [
      { kaynak: 'ton', hz: [2200], kismi: [1, 2.76, 5.40, 8.93], atak: 0.001, sonme: 0.11, gain: 0.16 },
      { kaynak: 'gurultu', hz: [7000], q: 3, atak: 0.0005, sonme: 0.025, gain: 0.06 },
    ],
    aralik: 0.06,
  },
  // FİZİKSEL — çay dökme: bant merkezi YÜKSELEN süzülmüş gürültü (bardak doldukça tizleşen akış)
  // + altta yavaş bir fokurdama. Bu ses tam olarak "merkez frekansın yükselmesi"dir; sabit
  // katsayılı bir süzgeçle ya da nota dizisiyle anlatılamaz.
  pour: {
    dosya: '/assets/audio/tea_pour.ogg',
    katmanlar: [
      { kaynak: 'gurultu', hz: [650, 1500], suzul: true, q: 1.2, atak: 0.03, sonme: 0.40, gain: 0.10 },
      { kaynak: 'gurultu', hz: [180, 260], suzul: true, q: 0.8, atak: 0.02, sonme: 0.35, gain: 0.05 },
    ],
    aralik: 0.20,
  },
  // FİZİKSEL — bardak masaya kondu: dar bantlı cam şıngırtısı + tok alçak gövde. Şıngırtı
  // BASKIN katman (0,11 > 0,09): sesin kimliği cam, gövde ona eşlik ediyor. İkisi eşit
  // kazançtayken "baskın katman" beraberliğe düşüyordu ve teşhis sıraya bağlı kalıyordu.
  serve: {
    dosya: '/assets/audio/tea_serve.ogg',
    katmanlar: [
      { kaynak: 'gurultu', hz: [3600], q: 8, atak: 0.001, sonme: 0.10, gain: 0.11 },
      { kaynak: 'ton', hz: [190], dalga: 'sine', atak: 0.002, sonme: 0.09, gain: 0.09 },
    ],
    aralik: 0.10,
  },
  // İLERLEME — satın alma: önce tahta bir tok (kasa/tezgâh), sonra ALÇAK registerda kısa onay.
  // Alçak register bilerek: para HARCAMA sesi, para KAZANMA sesinden aşağıda durur. Jest de
  // bilerek İNİYOR (-5): katalogdaki tek inen tonal jest budur ve anlamı taşıyor — para çıkıyor.
  // Yükselen bir onay, harcamayı kazanç gibi duyururdu.
  purchase: {
    dosya: '/assets/audio/purchase.ogg',
    katmanlar: [
      { kaynak: 'gurultu', hz: [900], q: 4, atak: 0.001, sonme: 0.05, gain: 0.09 },
      { kaynak: 'ton', hz: [440, 330], dalga: 'square', gecikme: 0.03, atak: 0.005, sonme: 0.22, gain: 0.10 },
    ],
    aralik: 0.20,
  },
  // İLERLEME — pad doluyor: yükselen gürültü süpürmesi (DOLMA hissi) + yükselen üçlü.
  padFill: {
    dosya: '/assets/audio/pad_fill.ogg',
    katmanlar: [
      { kaynak: 'gurultu', hz: [400, 2000], suzul: true, q: 1.0, atak: 0.05, sonme: 0.30, gain: 0.05 },
      { kaynak: 'ton', hz: [440, 660, 880], dalga: 'triangle', atak: 0.004, sonme: 0.32, gain: 0.12 },
    ],
    aralik: 0.30,
  },
  // İLERLEME — görev tamam: majör üçlü (+4,+3). Kataloğun tek "üçlü" örüntüsü.
  quest: {
    dosya: '/assets/audio/quest_done.ogg',
    katmanlar: [
      { kaynak: 'ton', hz: [523, 659, 784], dalga: 'triangle', atak: 0.004, sonme: 0.30, gain: 0.13 },
    ],
    aralik: 0.30,
  },
  // İLERLEME — İtibar seviyesi: kataloğun en uzunu ve tek 4 notalısı; üstüne bir oktav üstten
  // ince bir parlaklık katmanı biner (fanfar hissi).
  level: {
    dosya: '/assets/audio/level_up.ogg',
    katmanlar: [
      { kaynak: 'ton', hz: [523, 784, 1047, 1319], dalga: 'triangle', atak: 0.004, sonme: 0.45, gain: 0.12 },
      { kaynak: 'ton', hz: [1046, 1568, 2094, 2638], dalga: 'sine', gecikme: 0.005, atak: 0.004, sonme: 0.42, gain: 0.04 },
    ],
    aralik: 0.45,
  },
  // İLERLEME (💎) — Usta: ÇAN. İnharmonik kısmiler + uzun sönme; katalogda tınısı buna benzeyen
  // tek ses `coin` ve o çok daha kısa/tiz. Sert para ödülü kendi tınısıyla ayrılır.
  master: {
    dosya: '/assets/audio/master.ogg',
    katmanlar: [
      { kaynak: 'ton', hz: [880, 1175, 1568], kismi: [1, 2.76, 5.40], atak: 0.002, sonme: 0.55, gain: 0.11 },
    ],
    aralik: 0.35,
  },
  // İLERLEME — ödül toplandı: OKTAV sıçraması (+12). E3'te `quest` ile aynı jestti (ikisi de
  // triangle, +5); ölçüm bunu tek gerçek kusur olarak buldu, jest bilerek ayrıldı.
  reward: {
    dosya: '/assets/audio/reward.ogg',
    katmanlar: [
      { kaynak: 'ton', hz: [660, 1320], dalga: 'triangle', atak: 0.003, sonme: 0.26, gain: 0.13 },
      { kaynak: 'gurultu', hz: [5000], q: 5, atak: 0.001, sonme: 0.03, gain: 0.04 },
    ],
    aralik: 0.25,
  },
};

/** Sesin süresi (sn) — katmanlardan türer, katalogda elle yazılmaz. */
export const sesSure = (id: SesId): number => sesSuresi(SES_KATALOG[id].katmanlar);

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
  /** Dosyayı çal. Dosya yoksa/çalamazsa `false` döner → motor sentezi çalar. */
  dosyaCal(yol: string, gain: number): boolean;
  /** Sentezi çal. Arka uç katmanları bir kez tampona çevirip önbellekler (`id` önbellek anahtarı). */
  sentezCal(id: SesId, katmanlar: readonly Katman[]): void;
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
 *  1. AYAR — kapalıyken tek bir ses bile çalınmaz (ayar E3'ten önce kayıtta duruyordu ama
 *     hiçbir şeye bağlı değildi; bağlandığı yer burası).
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
      // Dosya bırakılmışsa o üstüne yazar; yoksa NİHAİ ses olan sentez çalar (E4 · karar 3).
      if (!arkaUc.dosyaCal(tanim.dosya, 1)) arkaUc.sentezCal(id, tanim.katmanlar);
      return true;
    },
  };
}
