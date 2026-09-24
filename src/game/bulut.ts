/**
 * bulut.ts — PLAY GAMES KATMANI: giriş + bulut kaydı + başarımlar (F4b · D-153). Oyun Play Games'i
 * yalnız bu modülden görür.
 *
 * `iap.ts`in deseni: cihazda kendi native eklentimiz (`PlayGamesPlugin.java`), tarayıcı/testte SAHTE
 * arka uç. Cihazda Play Games kimliği (APP_ID) girilmemişse eklenti "kullanılamaz" der ve katman
 * KAPALI kalır — oyun olduğu gibi oynanır, Ayarlar'da bölüm görünmez.
 *
 * ÇAKIŞMA KURALI (kullanıcı kararı 2026-09-24): DAHA İLERİ kayıt kazanır. İlerleme = toplam kazanç,
 * eşitse XP (`kayitIleriMi`). Buluttaki daha ileriyse açılışta yüklenir; yereldeki ileriyse buluta
 * yazılır. Daha ileri bir bulut kaydının üstüne ASLA yazılmaz — tek istisna oyuncunun bilinçli
 * sıfırlamasıdır (`bulutSifirla`). Bulut okunamadıysa hiç yazılmaz: bilinmeyen bir kaydı ezmemek için.
 *
 * Satın alımlar mağaza hesabının malıdır: bulut kaydı yüklenirken yereldeki satın alım bilgisi ve
 * ayarlar KORUNUR (birleştirilir), yoksa telefondaki reklamsızlık eski bir kayıtla düşebilirdi.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { levelProgress } from '../config/economy.config';
import { playGamesConfig } from '../config/playGames.config';
import { acikBasarimlar } from './basarim';
import { D } from './decimal';
import { kayitCoz, kayitKilitli, type SaveData } from './save';

export interface PlayGamesArkaUcu {
  /** `kullanilabilir`: APP_ID girilmiş ve SDK kuruldu. `girisli`: oyuncu Play Games'e bağlı. */
  durum(): Promise<{ kullanilabilir: boolean; girisli: boolean }>;
  girisYap(): Promise<boolean>;
  /** Buluttaki kayıt metni; hiç yazılmamışsa null. Okunamazsa HATA fırlatır (null değil). */
  oku(): Promise<string | null>;
  yaz(veri: string, ilerleme: number, aciklama: string): Promise<void>;
  /** Anahtar config'teki başarımdır; Play kimliğine çeviri arka ucun işi (kimliksizse HATA). */
  basarimAc(anahtar: string): Promise<void>;
  basarimlariGoster(): Promise<void>;
}

interface PlayGamesYerli {
  durum(): Promise<{ kullanilabilir: boolean; girisli: boolean }>;
  girisYap(): Promise<{ girisli: boolean }>;
  bulutOku(o: { ad: string }): Promise<{ veri: string | null }>;
  bulutYaz(o: { ad: string; veri: string; ilerleme: number; aciklama: string }): Promise<void>;
  basarimAc(o: { kimlik: string }): Promise<void>;
  basarimlariGoster(): Promise<void>;
}

function yerliArkaUc(): PlayGamesArkaUcu {
  const P = registerPlugin<PlayGamesYerli>('PlayGames');
  const ad = playGamesConfig.kayitAdi;
  return {
    durum: () => P.durum(),
    girisYap: async () => (await P.girisYap()).girisli,
    oku: async () => (await P.bulutOku({ ad })).veri ?? null,
    yaz: (veri, ilerleme, aciklama) => P.bulutYaz({ ad, veri, ilerleme, aciklama }),
    basarimAc: async (anahtar) => {
      const kimlik = playGamesConfig.basarimlar.find((b) => b.anahtar === anahtar)?.kimlik;
      if (!kimlik) throw new Error(`Play kimliği girilmemiş: ${anahtar}`);
      await P.basarimAc({ kimlik });
    },
    basarimlariGoster: () => P.basarimlariGoster(),
  };
}

/** Tarayıcı / test: bellekte bir bulut. `acilan` ve `veri` testin gözlemi içindir. */
export interface SahtePlayGames extends PlayGamesArkaUcu {
  veri: string | null;
  acilan: string[];
  yazmaSayisi: number;
  girisli: boolean;
  okumaHatasi: boolean;
}

export function sahteArkaUc(o: { girisli?: boolean; veri?: string | null } = {}): SahtePlayGames {
  const s: SahtePlayGames = {
    veri: o.veri ?? null,
    acilan: [],
    yazmaSayisi: 0,
    girisli: o.girisli ?? true,
    okumaHatasi: false,
    durum: async () => ({ kullanilabilir: true, girisli: s.girisli }),
    girisYap: async () => (s.girisli = true),
    oku: async () => {
      if (s.okumaHatasi) throw new Error('okunamadı');
      return s.veri;
    },
    yaz: async (veri) => {
      s.veri = veri;
      s.yazmaSayisi++;
    },
    basarimAc: async (anahtar) => {
      if (!s.acilan.includes(anahtar)) s.acilan.push(anahtar);
    },
    basarimlariGoster: async () => {},
  };
  return s;
}

/** `a`, `b`'den DAHA İLERİ mi: toplam kazanç, eşitse XP. Eşit kayıt ileri sayılmaz. */
export function kayitIleriMi(a: Pick<SaveData, 'lifetime' | 'xp'>, b: Pick<SaveData, 'lifetime' | 'xp'>): boolean {
  const k = D(a.lifetime).cmp(D(b.lifetime));
  return k > 0 || (k === 0 && a.xp > b.xp);
}

/** Buluttaki kaydı yerelin üstüne koyarken yerelden KORUNANLAR: ayarlar + satın alımlar. */
export function bulutlaBirlestir(bulut: SaveData, yerel: SaveData): SaveData {
  const a = bulut.satin;
  const b = yerel.satin;
  return {
    ...bulut,
    settings: { ...yerel.settings },
    satin: {
      reklamsiz: a.reklamsiz || b.reklamsiz,
      baslangic: a.baslangic || b.baslangic,
      gunlukGun: Math.max(a.gunlukGun, b.gunlukGun),
      islenen: [...new Set([...a.islenen, ...b.islenen])],
    },
  };
}

/** Saved Games'in `progressValue`'su — Google'ın kendi çakışma çözümü de "en ileri"yi seçsin. */
const ilerlemeDegeri = (s: SaveData): number =>
  Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(D(s.lifetime).toNumber())));

export interface BulutKancasi {
  /** Şu anki oyun durumunun kayıt görüntüsü. */
  yerel: () => SaveData;
  /** Buluttan gelen (birleştirilmiş) kaydı oyuna yükle. */
  yukle: (d: SaveData) => void;
}

// ─── Oturum durumu ───────────────────────────────────────────────────────────────────────────
let arkaUc: PlayGamesArkaUcu | null = null;
let kanca: BulutKancasi | null = null;
let girisli = false;
let okundu = false;
/** Bulutta bildiğimiz en son kayıt (okunan ya da yazılan) — daha ileriyse üstüne yazılmaz. */
let bilinen: Pick<SaveData, 'lifetime' | 'xp'> | null = null;
let sonImza = '';
const gonderilen = new Set<string>();
let kuyruk: Promise<unknown> = Promise.resolve();
const dinleyiciler = new Set<() => void>();
let surum = 0;
const bildir = () => { surum++; dinleyiciler.forEach((f) => f()); };
export const bulutSurumu = () => surum;
export const bulutAbone = (f: () => void): (() => void) => {
  dinleyiciler.add(f);
  return () => dinleyiciler.delete(f);
};
export const playGamesDurumu = () => ({ kullanilabilir: arkaUc != null, girisli });

/** Saved Games aynı kaydı iki kez aynı anda açamaz — bulut işleri sıraya girer. */
function sirada<T>(is: () => Promise<T>): Promise<T> {
  const r = kuyruk.then(is, is);
  kuyruk = r.catch(() => {});
  return r;
}

async function dene<T>(is: () => Promise<T>, yedek: T): Promise<T> {
  try {
    return await is();
  } catch {
    return yedek;
  }
}

/**
 * Uygulama açılışında bir kez. Play Games v2 girişi açılışta kendiliğinden dener; oyuncu bağlıysa
 * bulut hemen eşitlenir. `ozel` verilirse o arka uç kullanılır (test).
 */
export async function bulutBaslat(k: BulutKancasi, ozel?: PlayGamesArkaUcu): Promise<void> {
  arkaUc = null;
  kanca = k;
  girisli = false;
  okundu = false;
  bilinen = null;
  sonImza = '';
  gonderilen.clear();
  kuyruk = Promise.resolve();
  const secilen = ozel ?? (Capacitor.isNativePlatform() ? yerliArkaUc() : sahteArkaUc());
  const d = await dene(() => secilen.durum(), null);
  if (!d?.kullanilabilir) { bildir(); return; }
  arkaUc = secilen;
  girisli = d.girisli;
  bildir();
  if (girisli) await esitle();
}

/** Ayarlar'daki "Bağlan" düğmesi. */
export async function girisYap(): Promise<boolean> {
  if (!arkaUc) return false;
  if (!girisli) {
    girisli = await dene(arkaUc.girisYap, false);
    bildir();
    if (girisli) await esitle();
  }
  return girisli;
}

async function esitle(): Promise<void> {
  if (!arkaUc || !kanca) return;
  const a = arkaUc;
  const ham = await dene<string | null | undefined>(() => sirada(() => a.oku()), undefined);
  if (ham === undefined) return; // okunamadı → yazma da yok: bilinmeyen kaydı ezme
  okundu = true;
  let bulut: { data: SaveData; yeniSurum: boolean } | null = null;
  if (ham) {
    try {
      bulut = kayitCoz(JSON.parse(ham) as Record<string, unknown>);
    } catch {
      bulut = null; // bozuk bulut kaydı: yereldeki onun yerine geçer
    }
  }
  const yerel = kanca.yerel();
  if (bulut && kayitIleriMi(bulut.data, yerel)) {
    bilinen = bulut.data;
    // Daha yeni bir sürümle yazılmış kayıt bu pakette yüklenmez (şemayı bilmiyoruz) ama üstüne de
    // yazılmaz — oyuncu uygulamayı güncelleyince gelir.
    if (!bulut.yeniSurum) kanca.yukle(bulutlaBirlestir(bulut.data, yerel));
  } else {
    await bulutKaydet({ zorla: false });
  }
  await basarimlariGonder();
  bildir();
}

/** Yerel kaydı buluta yazar. Yazdıysa true. `zorla`: sıfırlamadan sonra (daha geri kayıt da yazılır). */
export async function bulutKaydet(o: { zorla: boolean } = { zorla: false }): Promise<boolean> {
  if (!arkaUc || !kanca || !girisli || !okundu || kayitKilitli()) return false;
  const yerel = kanca.yerel();
  if (!o.zorla && bilinen && kayitIleriMi(bilinen, yerel)) return false;
  const { lastSaved: _z, ...icerik } = yerel;
  const imza = JSON.stringify(icerik);
  if (!o.zorla && imza === sonImza) return false;
  const a = arkaUc;
  const veri = JSON.stringify(yerel);
  const ok = await dene(async () => {
    await sirada(() => a.yaz(veri, ilerlemeDegeri(yerel), `Seviye ${levelProgress(yerel.xp).level}`));
    return true;
  }, false);
  if (ok) {
    sonImza = imza;
    bilinen = yerel;
  }
  return ok;
}

/** Oyuncu oyunu sıfırladı: bulut da sıfırlanır, yoksa bir sonraki açılışta eski ilerleme geri gelirdi. */
export const bulutSifirla = () => bulutKaydet({ zorla: true });

/** Koşulu sağlanmış ve bu oturumda gönderilmemiş başarımları açar. Açmak tekrarlanabilir bir işlemdir. */
export async function basarimlariGonder(): Promise<number> {
  if (!arkaUc || !kanca || !girisli) return 0;
  const a = arkaUc;
  let n = 0;
  for (const anahtar of acikBasarimlar(kanca.yerel())) {
    if (gonderilen.has(anahtar)) continue;
    if (await dene(async () => { await a.basarimAc(anahtar); return true; }, false)) {
      gonderilen.add(anahtar);
      n++;
    }
  }
  return n;
}

export async function basarimlariGoster(): Promise<void> {
  if (arkaUc && girisli) await dene(arkaUc.basarimlariGoster, undefined);
}

/** Açık oyunda düzenli yoklama: başarımlar kısa, bulut yazımı uzun aralıkla. Temizleyiciyi döndürür. */
export function bulutDongusu(): () => void {
  const b = setInterval(() => void basarimlariGonder(), playGamesConfig.basarimAraligiSn * 1000);
  const y = setInterval(() => void bulutKaydet(), playGamesConfig.yazmaAraligiSn * 1000);
  return () => {
    clearInterval(b);
    clearInterval(y);
  };
}
