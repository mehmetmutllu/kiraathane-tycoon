/**
 * ads.ts — REKLAM KATMANI (F3 · D-144). Oyun reklamı yalnız bu modülden görür.
 *
 * İki parça:
 *  1. `gecisliUygun` — geçişli reklamın KURALI, saf fonksiyon (bekçi bunu test eder).
 *  2. Arka uç — cihazda AdMob eklentisi (`@capacitor-community/admob`), tarayıcıda/testte SAHTE
 *     arka uç (monetization.md §4: "test modunda reklamlar mock'lanır"). Oyun ikisini ayırt etmez.
 *
 * Banner YOK (kullanıcı kararı, kalıcı). Ödüllü videonun ödül MİKTARI burada değil —
 * `economy.config.ts`te ve varyant kapısına tabi.
 */
import { Capacitor } from '@capacitor/core';
import { adsConfig } from '../config/ads.config';

export interface GecisliGirdi {
  simdi: number;
  /** Oturumun açıldığı an (ms) — soğuma buradan başlar: açılışta reklam yok. */
  oturumBasi: number;
  /** Son geçişli reklamın gösterildiği an (ms), hiç yoksa null. */
  sonGecisli: number | null;
  /** Bu panel açıkken bir ödül alındı mı (ödül ekranından sonra reklam YASAK). */
  panelOdul: boolean;
  /** Şu an ekranda bir reklam var mı. */
  reklamAcik: boolean;
  sogumaSn: number;
  /** "Reklamları Kaldır" alındı (F4a · D-040): geçişli HİÇ çıkmaz. Ödüllüye dokunmaz. */
  reklamsiz: boolean;
}

/** C1′: soğuma KURAR, panel kapanışı PATLATIR. Kapanış anında bu fonksiyon doğruysa reklam çıkar. */
export function gecisliUygun(g: GecisliGirdi): boolean {
  if (g.reklamsiz || g.panelOdul || g.reklamAcik) return false;
  const referans = Math.max(g.oturumBasi, g.sonGecisli ?? -Infinity);
  return g.simdi - referans >= g.sogumaSn * 1000;
}

/** Reklam SDK'sının oyuna görünen yüzü. Her `goster` reklam kapanınca çözülür. */
export interface ReklamArkaUcu {
  kur(): Promise<void>;
  gecisliHazirla(): Promise<boolean>;
  gecisliGoster(): Promise<boolean>;
  odulluHazirla(): Promise<boolean>;
  /** Oyuncu videoyu sonuna dek izleyip ödülü hak ettiyse true. */
  odulluGoster(): Promise<boolean>;
}

/** Tarayıcı / test: her istek anında "gösterildi" sayılır, hiçbir ağ çağrısı yok. */
export function sahteArkaUc(): ReklamArkaUcu {
  return {
    kur: async () => {},
    gecisliHazirla: async () => true,
    gecisliGoster: async () => true,
    odulluHazirla: async () => true,
    odulluGoster: async () => true,
  };
}

async function admobArkaUcu(): Promise<ReklamArkaUcu> {
  const { AdMob, AdmobConsentStatus, InterstitialAdPluginEvents, RewardAdPluginEvents } =
    await import('@capacitor-community/admob');
  const test = adsConfig.test;
  /** `show*` çağrısı reklam AÇILINCA döner; oyun reklam KAPANANA dek beklemeli. */
  const kapanisiBekle = async (kapandi: string, basarisiz: string, goster: () => Promise<unknown>) => {
    const dinleyiciler: { remove: () => Promise<void> }[] = [];
    try {
      await new Promise<void>((coz, reddet) => {
        void AdMob.addListener(kapandi as never, () => coz()).then((d) => dinleyiciler.push(d));
        void AdMob.addListener(basarisiz as never, () => reddet(new Error(basarisiz))).then((d) => dinleyiciler.push(d));
        goster().catch(reddet);
      });
    } finally {
      await Promise.all(dinleyiciler.map((d) => d.remove()));
    }
  };
  return {
    kur: async () => {
      // D-151: SDK'ya kısıt bayrağı verilmez — içerik AdMob panelinden yönetiliyor (ads.config.ts).
      await AdMob.initialize({ initializeForTesting: test });
      // UMP (GDPR): rıza gerekiyorsa Google'ın kendi formu — AB/UK'de rızasız reklam hiç gelmez.
      const bilgi = await AdMob.requestConsentInfo();
      if (bilgi.status === AdmobConsentStatus.REQUIRED && bilgi.isConsentFormAvailable) await AdMob.showConsentForm();
    },
    gecisliHazirla: async () => {
      await AdMob.prepareInterstitial({ adId: adsConfig.birim.gecisli, isTesting: test });
      return true;
    },
    gecisliGoster: async () => {
      await kapanisiBekle(InterstitialAdPluginEvents.Dismissed, InterstitialAdPluginEvents.FailedToShow, () =>
        AdMob.showInterstitial());
      return true;
    },
    odulluHazirla: async () => {
      await AdMob.prepareRewardVideoAd({ adId: adsConfig.birim.odullu, isTesting: test });
      return true;
    },
    odulluGoster: async () => {
      // Ödül olayı gelmeden kapanırsa (erken çıkış) ödül YOK.
      let hakEtti = false;
      const dinle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { hakEtti = true; });
      try {
        await kapanisiBekle(RewardAdPluginEvents.Dismissed, RewardAdPluginEvents.FailedToShow, () =>
          AdMob.showRewardVideoAd());
      } finally {
        await dinle.remove();
      }
      return hakEtti;
    },
  };
}

// ─── Oturum durumu ───────────────────────────────────────────────────────────────────────────
let arkaUc: ReklamArkaUcu | null = null;
let oturumBasi = Date.now();
let sonGecisli: number | null = null;
let panelOdul = false;
let reklamAcik = false;
let gecisliHazir = false;
let odulluHazir = false;
let reklamsiz = false;
const sayac = { gecisli: 0, odullu: 0 };
const dinleyiciler = new Set<() => void>();
const bildir = () => dinleyiciler.forEach((f) => f());

/** Bir işlem başarısız olursa oyun durmaz — reklam gelmez, o kadar (dolum oranı %70-95). */
async function dene<T>(is: () => Promise<T>, yedek: T): Promise<T> {
  try {
    return await is();
  } catch {
    return yedek;
  }
}

async function gecisliYukle() {
  if (!arkaUc) return;
  gecisliHazir = await dene(arkaUc.gecisliHazirla, false);
}

async function odulluYukle() {
  if (!arkaUc) return;
  odulluHazir = await dene(arkaUc.odulluHazirla, false);
  bildir();
}

/** Uygulama açılışında bir kez. `ozel` verilirse o arka uç kullanılır (test). */
export async function reklamBaslat(ozel?: ReklamArkaUcu): Promise<void> {
  arkaUc = null;
  oturumBasi = Date.now();
  sonGecisli = null;
  panelOdul = false;
  reklamAcik = false;
  gecisliHazir = odulluHazir = false;
  sayac.gecisli = sayac.odullu = 0;
  const secilen = ozel ?? (Capacitor.isNativePlatform() ? await dene(admobArkaUcu, null) : sahteArkaUc());
  if (!secilen) return;
  const kuruldu = await dene(async () => { await secilen.kur(); return true; }, false);
  if (!kuruldu) return;
  arkaUc = secilen;
  await Promise.all([gecisliYukle(), odulluYukle()]);
}

/** Store çağırır (açılış · satın alma · geri yükleme). Reklam başlatılmadan önce de gelebilir. */
export function reklamsizAyarla(b: boolean): void {
  reklamsiz = b;
}

/** Oyun sıfırlandı: yeni oyun açılış sayılır, soğuma baştan kurulur. */
export function sogumaSifirla(): void {
  oturumBasi = Date.now();
  sonGecisli = null;
}

/** Ekranda reklam varken sayfa görünürlüğü değişir — bu çevrimdışı dönüş SAYILMAZ (App.tsx). */
export const reklamEkranda = () => reklamAcik;

/** Panel içinde ödül alındı (günlük görev · hedef) — bu panelin kapanışı reklam patlatmaz. */
export function odulAlindi(): void {
  panelOdul = true;
}

/** Panel kapandı: kural uygunsa geçişli reklam gösterilir. Gösterildiyse true. */
export async function panelKapandi(): Promise<boolean> {
  const uygun = gecisliUygun({
    simdi: Date.now(),
    oturumBasi,
    sonGecisli,
    panelOdul,
    reklamAcik,
    sogumaSn: adsConfig.gecisli.sogumaSn,
    reklamsiz,
  });
  panelOdul = false; // bayrak YALNIZ burada iner: bir ödül, ardından gelen ilk kapanışı reklamsız yapar
  if (!uygun || !arkaUc || !gecisliHazir) return false;
  reklamAcik = true;
  gecisliHazir = false;
  const gosterildi = await dene(arkaUc.gecisliGoster, false);
  reklamAcik = false;
  if (gosterildi) {
    sonGecisli = Date.now();
    sayac.gecisli++;
  }
  void gecisliYukle();
  return gosterildi;
}

export const odulluReklamHazir = () => odulluHazir && !reklamAcik;

/** React aboneliği (`useSyncExternalStore`) — ödüllü düğme hazır olunca etkinleşir. */
export function reklamAbone(f: () => void): () => void {
  dinleyiciler.add(f);
  return () => dinleyiciler.delete(f);
}

/** Ödüllü video. Oyuncu ödülü hak ettiyse true; reklam yoksa/yarıda kaldıysa false. */
export async function odulluIzle(): Promise<boolean> {
  if (!arkaUc || !odulluReklamHazir()) return false;
  reklamAcik = true;
  odulluHazir = false;
  bildir();
  const hakEtti = await dene(arkaUc.odulluGoster, false);
  reklamAcik = false;
  if (hakEtti) sayac.odullu++;
  void odulluYukle();
  return hakEtti;
}

/** Dev/duman: sayaçlar + soğumanın kalan süresi. */
export function reklamDurumu() {
  const referans = Math.max(oturumBasi, sonGecisli ?? -Infinity);
  return {
    kuruldu: arkaUc != null,
    gecisli: sayac.gecisli,
    odullu: sayac.odullu,
    sogumaKalanSn: Math.max(0, adsConfig.gecisli.sogumaSn - (Date.now() - referans) / 1000),
    odulluHazir: odulluReklamHazir(),
    reklamsiz,
  };
}

/** Dev/duman: saati ileri al (soğumayı beklemeden kuralı sınamak için). */
export function reklamSaatiKaydir(ms: number): void {
  oturumBasi -= ms;
  if (sonGecisli != null) sonGecisli -= ms;
}
