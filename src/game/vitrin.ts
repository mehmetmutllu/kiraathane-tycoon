/**
 * vitrin.ts — 💎 VİTRİNİNİN SAF KURALLARI (F4c). Store bunları çağırır; testler doğrudan sınar.
 *
 * Sahiplik TEK KAYNAKTAN türer (`feedback_single_source_of_truth`): 💎 ürünleri `ownedCosmetics`
 * listesinde (`outfit:id` · `tray:id`), paket ürünleri ise paketin kendisinden (`satin.baslangic`).
 * Kurucu kıyafeti listede SAKLANMAZ — paket iade edilirse sahiplik de kendiliğinden düşer.
 */
import { economyConfig as C } from '../config/economy.config';
import { vitrinYuva, yuvaAlani } from '../config/decor';
import type { SatinAlim } from './save';

export type VitrinTuru = 'outfit' | 'tray' | 'decor';

interface VitrinUrun {
  id: string;
  label: string;
  diamonds: number;
  paket?: string;
  /** Yalnız dekor: çizildiği yuva (`config/decor.ts` `VITRIN_YUVALARI`). */
  yuva?: string;
}

export function vitrinUrunleri(tur: VitrinTuru): readonly VitrinUrun[] {
  return (tur === 'outfit' ? C.cosmetics.outfits : tur === 'tray' ? C.cosmetics.trays : C.cosmetics.decor) as readonly VitrinUrun[];
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

// ---- 💎 DEKOR (F4c-2 · D-155) ----

/** Yuva → o yuvada DURAN ürün. Sahiplik ayrı (`ownedCosmetics`), bu yalnız yerleşim seçimi. */
export type DekorYerlesim = Readonly<Record<string, string>>;

/** Ürünün yuvası AÇIK mı? Yuvanın salonu açılmadan dekor vitrinde kilitli durur (kullanıcı kararı). */
export function dekorAcik(id: string, areasOpen: number): boolean {
  const y = vitrinYuva(vitrinUrunu('decor', id)?.yuva ?? '');
  return !!y && yuvaAlani(y) >= 0 && yuvaAlani(y) < areasOpen;
}

/** Yuvanın hangi salonla açıldığı (1'den sayılır) — kilit metni bunu söyler. */
export function dekorSalonu(id: string): number {
  const y = vitrinYuva(vitrinUrunu('decor', id)?.yuva ?? '');
  return y ? yuvaAlani(y) + 1 : 0;
}

/**
 * Sahnede çizilecek dekor: yerleştirilmiş + sahip olunan + yuvası açık. Sahiplik düşerse (kayıt
 * bozulması) yerleşimde kalan ürün kendiliğinden çizilmez — tek kaynak `ownedCosmetics`.
 */
export function gorunenDekor(
  s: SahiplikDurumu & { dekor: DekorYerlesim; areasOpen: number },
): { yuva: string; id: string }[] {
  return Object.entries(s.dekor)
    .filter(([yuva, id]) => vitrinUrunu('decor', id)?.yuva === yuva && vitrinSahip(s, 'decor', id) && dekorAcik(id, s.areasOpen))
    .map(([yuva, id]) => ({ yuva, id }));
}

/** Ürünü yuvasına koyar; zaten oradaysa kaldırır. Aynı yuvadaki başka ürün (yılbaşı rengi) yer değiştirir. */
export function dekorDegistir(dekor: DekorYerlesim, id: string): DekorYerlesim {
  const yuva = vitrinUrunu('decor', id)?.yuva;
  if (!yuva) return dekor;
  const yeni: Record<string, string> = { ...dekor };
  if (yeni[yuva] === id) delete yeni[yuva];
  else yeni[yuva] = id;
  return yeni;
}
