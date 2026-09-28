/**
 * platform.ts — HANGİ MAĞAZADA KOŞUYORUZ (iOS izi). Platforma bağlı her seçim buradan türer:
 * reklam birimi, RevenueCat anahtarı, Play Games'in açık olup olmadığı. Başka dosya
 * `Capacitor.getPlatform()` ile kendi kararını vermez — tek kaynak.
 *
 * Tarayıcı ve test `null`dır: orada sahte arka uçlar çalışır (reklam, satın alma).
 */
import { Capacitor } from '@capacitor/core';

export type MagazaPlatformu = 'android' | 'ios';

export function magazaPlatformu(p: string = Capacitor.getPlatform()): MagazaPlatformu | null {
  return p === 'android' || p === 'ios' ? p : null;
}

/** Play Games yalnız Android'de vardır. iOS'ta ve tarayıcıda hiçbir çağrı yapılmaz, Ayarlar'da bölüm yok. */
export const playGamesVar = (p: string = Capacitor.getPlatform()): boolean => magazaPlatformu(p) === 'android';

/** Satın alımların saklandığı hesabın adı — oyuncuya yazılan metin (App Store incelemesi: iOS'ta "Google" yazmaz). */
export function magazaHesabi(p: string = Capacitor.getPlatform()): string {
  const m = magazaPlatformu(p);
  return m === 'ios' ? 'Apple hesabında' : m === 'android' ? 'Google hesabında' : 'mağaza hesabında';
}
