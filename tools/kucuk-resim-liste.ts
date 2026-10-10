/**
 * kucuk-resim-liste.ts — mağaza kozmetiklerinin küçük resim LİSTESİ, tek kaynak (Sprint B · Faz 4).
 * Liste `economy.config.ts` `cosmetics`ten TÜRETİLİR; çekim sayfası (`kucuk-resim.tsx`) ve bekçi
 * (`tests/kucuk-resim.test.ts`) aynı fonksiyonu okur — yeni kozmetik eklenip resmi çekilmezse bekçi düşer.
 */
import { economyConfig } from '../src/config/economy.config';

export type KucukTur = 'kiyafet' | 'tepsi' | 'dekor' | 'masa' | 'zemin' | 'duvar' | 'mutfak';

export interface KucukResim {
  tur: KucukTur;
  id: string;
  label: string;
  /** `public/assets/thumbs/` altındaki dosya adı. */
  dosya: string;
}

/** Tek çıktı boyu (px, kare): mağaza pulu ~64 css px × 3 dpr. Gerekçe `kucuk-resim-notu.md`. */
export const KUCUK_PX = 192;
export const KUCUK_KLASOR = 'public/assets/thumbs';
/** Bekçi sınırları (bayt). */
export const TEK_SINIR = 24 * 1024;
export const TOPLAM_SINIR = 512 * 1024;

export function kucukResimListesi(): KucukResim[] {
  const c = economyConfig.cosmetics;
  const kaynak: [KucukTur, readonly { id: string; label: string }[]][] = [
    ['kiyafet', c.outfits],
    ['tepsi', c.trays],
    ['dekor', c.decor],
    ['masa', c.tableThemes],
    ['zemin', c.floorThemes],
    ['duvar', c.wallThemes],
    ['mutfak', c.kitchenThemes],
  ];
  return kaynak.flatMap(([tur, liste]) =>
    liste.map((u) => ({ tur, id: u.id, label: u.label, dosya: `${tur}-${u.id}.webp` })),
  );
}
