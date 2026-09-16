/**
 * cihazSinifi.ts — CİHAZ SINIFI ÖLÇÜMÜ (Faz F · F2, D-125).
 *
 * NEDEN VAR: F2 ölçümü gölgenin kare süresinin **%40,3'ünü** yediğini gösterdi
 * (`docs/telefon-raporu-f2.md` §C: taban 22,10 ms → gölge kapalı 13,20 ms). Ama gölge bir
 * ölçüm kararı değil, kullanıcının 2026-09-07'de AÇIKÇA geri istediği bir görsel karar
 * (D-073: *"maketteki ışık ve gölgeler baya iyiymiş, gölgeleri tekrar istiyorum"*). Bu yüzden
 * gölge kendiliğinden kapatılmaz — **yalnız cihaz kaldıramıyorsa** kapanır (D-125).
 *
 * NEDEN AYARDAN AYRI BİR MODÜL: "gölge açık mı" iki farklı şeyden doğar ve bunlar
 * karıştırılmamalı —
 *   · `settings.golge` oyuncunun TERCİHİ ise kayda girer, cihazdan cihaza taşınır;
 *   · cihaz sınıfı bu TELEFONUN olgusudur, kayda değil cihaza aittir.
 * İkisi tek alanda tutulsaydı, oyuncu güçlü telefonda "açık" der, kaydı zayıf telefona
 * taşıdığında oyun takılırdı. Sınıf bu yüzden `localStorage`ta AYRI durur.
 *
 * NEDEN ÖLÇÜLÜYOR, `deviceMemory`/`hardwareConcurrency` OKUNMUYOR: o alanlar GPU hakkında
 * hiçbir şey söylemez — gölgenin maliyeti GPU maliyetidir. Ucuz bir telefonun 8 çekirdeği
 * olabilir; ölçüm yalanı, kare süresi gerçeği söyler.
 */

const ANAHTAR = 'kiraathane-cihaz-sinifi';

export type CihazSinifi = 'guclu' | 'zayif' | 'bilinmiyor';

/**
 * EŞİK: ortanca kare süresi bunun üstündeyse cihaz zayıf sayılır.
 * 22 ms ≈ 45 FPS. Altında kalan cihaz gölgeyi taşıyor demektir; üstüne çıkan cihazda gölge
 * kapatılınca F2'nin ölçtüğü %40'lık pay geri gelir ve oyun 60 FPS'e yaklaşır.
 * 16,7 (60 FPS) SEÇİLMEDİ: o eşik, bir anlık takılmada güçlü cihazı da zayıf ilan ederdi.
 */
export const ZAYIF_ESIGI_MS = 22;

/** Ölçüm penceresi: ilk kareler (shader derlemesi, asset çözme) ATILIR, sonrası sayılır. */
export const ISINMA_KARE = 60;
export const ORNEK_KARE = 120;

function depo(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // özel sekme / kapalı depo
  }
}

/** Bu cihaz için daha önce ölçülmüş sınıf. */
export function cihazSinifiOku(): CihazSinifi {
  const v = depo()?.getItem(ANAHTAR);
  return v === 'guclu' || v === 'zayif' ? v : 'bilinmiyor';
}

export function cihazSinifiYaz(s: CihazSinifi): void {
  try {
    if (s === 'bilinmiyor') depo()?.removeItem(ANAHTAR);
    else depo()?.setItem(ANAHTAR, s);
  } catch { /* depo yazılamıyorsa ölçüm her açılışta yenilenir — kusur değil, maliyet */ }
}

/** Kare süresi örneklerinden sınıf: ortanca eşiğin üstündeyse zayıf. */
export function sinifBelirle(kareSureleri: readonly number[]): CihazSinifi {
  if (kareSureleri.length < ORNEK_KARE / 2) return 'bilinmiyor'; // yeterli örnek yok
  const s = [...kareSureleri].sort((a, b) => a - b);
  const ortanca = s[Math.floor(s.length / 2)];
  return ortanca > ZAYIF_ESIGI_MS ? 'zayif' : 'guclu';
}

/**
 * GÖLGE AÇIK MI — tek karar noktası.
 *
 * Oyuncunun açık tercihi her zaman kazanır; 'oto' ise cihaz sınıfı konuşur. Sınıf henüz
 * ölçülmediyse gölge AÇIK başlar: ilk izlenimi bilinmeyen bir cihaz uğruna bozmak yerine
 * ölçüp öyle karar vermek yeğdir (ölçüm zaten ilk saniyelerde biter).
 */
export function golgeAcikMi(tercih: 'oto' | 'acik' | 'kapali', sinif: CihazSinifi): boolean {
  if (tercih === 'acik') return true;
  if (tercih === 'kapali') return false;
  return sinif !== 'zayif';
}
