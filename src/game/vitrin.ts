/**
 * vitrin.ts — 💎 VİTRİNİNİN SAF KURALLARI (F4c). Store bunları çağırır; testler doğrudan sınar.
 *
 * Sahiplik TEK KAYNAKTAN türer (`feedback_single_source_of_truth`): 💎 ürünleri `ownedCosmetics`
 * listesinde (`outfit:id` · `tray:id`), paket ürünleri ise paketin kendisinden (`satin.baslangic`).
 * Kurucu kıyafeti listede SAKLANMAZ — paket iade edilirse sahiplik de kendiliğinden düşer.
 */
import { economyConfig as C } from '../config/economy.config';
import type { SatinAlim } from './save';

export type VitrinTuru = 'outfit' | 'tray';

interface VitrinUrun {
  id: string;
  label: string;
  diamonds: number;
  paket?: string;
}

export function vitrinUrunleri(tur: VitrinTuru): readonly VitrinUrun[] {
  return (tur === 'outfit' ? C.cosmetics.outfits : C.cosmetics.trays) as readonly VitrinUrun[];
}

export const vitrinUrunu = (tur: VitrinTuru, id: string): VitrinUrun | undefined =>
  vitrinUrunleri(tur).find((u) => u.id === id);

interface SahiplikDurumu {
  ownedCosmetics: readonly string[];
  satin: Pick<SatinAlim, 'baslangic'>;
}

export function vitrinSahip(s: SahiplikDurumu, tur: VitrinTuru, id: string): boolean {
  const u = vitrinUrunu(tur, id);
  if (!u) return false;
  if (u.paket) return u.paket === 'baslangic' && s.satin.baslangic;
  return u.diamonds === 0 || s.ownedCosmetics.includes(`${tur}:${id}`);
}

/** Giyilen kıyafet: seçili ama artık sahip olunmayan (iade edilmiş paket) → klasik. */
export const gecerliKiyafet = (s: SahiplikDurumu & { outfit: string }): string =>
  vitrinSahip(s, 'outfit', s.outfit) ? s.outfit : 'klasik';

export const gecerliTepsi = (s: SahiplikDurumu & { trayLook: string }): string =>
  vitrinSahip(s, 'tray', s.trayLook) ? s.trayLook : 'klasik';

/**
 * BAŞLANGIÇ PAKETİ TEKLİFİ (D-152 açık kalemi): ilk Usta'dan sonra BİR KEZ. Paket zaten alınmışsa
 * ya da teklif bir kez gösterilmişse çıkmaz. Geri sayım/baskı yok (monetization.md §2).
 */
export function baslangicTeklifiGoster(s: { mastersOwned?: readonly string[]; satin: Pick<SatinAlim, 'baslangic' | 'teklif'> }): boolean {
  return (s.mastersOwned?.length ?? 0) >= 1 && !s.satin.baslangic && !s.satin.teklif;
}
