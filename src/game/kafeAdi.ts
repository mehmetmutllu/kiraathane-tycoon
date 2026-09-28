/**
 * kafeAdi.ts — oyuncunun kafesine verdiği ad (F4c-3 · D-156).
 *
 * Ad girişte bir kez sorulur (eski kayıtlar da güncellemeden sonra bir kez görür), Ayarlar'dan
 * ücretsiz değişir ve cephedeki alınlık tabelasında yazar. Kayıtta `null` = hiç sorulmadı.
 * Oyunun kendi adı (`OYUN_ADI`) yükleniyor ekranındadır; kafenin adıyla karışmasın diye ayrıdır.
 */
import { dil, yerelBuyuk } from '../i18n';

export const OYUN_ADI = 'Tea House Tycoon';
/** Varsayılan ad oyuncunun DİLİNDE (dil açılışta, bu modülden önce ayarlanır — i18n/baslat). */
export const KAFE_ADI_VARSAYILAN = dil() === 'en' ? 'Tea House' : 'Çay Ocağı';
/** 20 harf: tabelada büyük harf ~0,20 br kalır (rapor B6 — yazıyı eni de sınırlıyor). */
export const KAFE_ADI_MAX = 20;

/** Denetim karakterlerini atar, boşlukları teke indirir, uçları kırpar, en fazla 20 harf (kod noktası). */
export function kafeAdiTemizle(ham: string): string {
  const tek = ham.replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim();
  return Array.from(tek).slice(0, KAFE_ADI_MAX).join('').trim();
}

/** Kayıttan gelen değer: dize değilse "hiç sorulmadı" (null). */
export const kafeAdiOku = (ham: unknown): string | null => (typeof ham === 'string' ? kafeAdiTemizle(ham) || KAFE_ADI_VARSAYILAN : null);

/** Tabelada yazan metin — Türkçe büyük harf (i → İ). */
export const tabelaYazisi = (kafeAdi: string | null): string => yerelBuyuk(kafeAdi || KAFE_ADI_VARSAYILAN);
